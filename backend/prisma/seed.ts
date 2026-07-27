import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Clear existing data
  await prisma.role.deleteMany()
  await prisma.permission.deleteMany()
  await prisma.user.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.rolePermission.deleteMany()

  // Create Roles
  console.log('Creating roles...')
  const roles = {}
  const USER_ROLES = ['SUPER_ADMIN', 'ADMIN', 'CATALOG_MANAGER', 'SUPPORT_AGENT', 'VIEWER']

  for (const role of USER_ROLES) {
    const roleRecord = await prisma.role.upsert({
      where: { name: role },
      create: {
        name: role,
        description: role + ' role',
        isSystem: true,
      },
      update: {},
    })
    roles[role] = roleRecord.id
    console.log('Created ' + role)
  }

  // Create Permissions
  console.log('Creating permissions...')
  const perms = [
    { key: 'login', name: 'Login', group: 'AUTHENTICATION' },
    { key: 'logout', name: 'Logout', group: 'AUTHENTICATION' },
    { key: 'register', name: 'Register', group: 'AUTHENTICATION' },
    { key: 'refresh-token', name: 'Refresh Token', group: 'AUTHENTICATION' },
    { key: 'user:view', name: 'View Users', group: 'USER_MANAGEMENT' },
    { key: 'user:create', name: 'Create User', group: 'USER_MANAGEMENT' },
    { key: 'user:update', name: 'Update User', group: 'USER_MANAGEMENT' },
    { key: 'user:delete', name: 'Delete User', group: 'USER_MANAGEMENT' },
    { key: 'role:view', name: 'View Roles', group: 'ROLE_MANAGEMENT' },
    { key: 'role:create', name: 'Create Role', group: 'ROLE_MANAGEMENT' },
    { key: 'role:update', name: 'Update Role', group: 'ROLE_MANAGEMENT' },
    { key: 'permission:view', name: 'View Permissions', group: 'PERMISSION_MANAGEMENT' },
    { key: 'permission:create', name: 'Create Permission', group: 'PERMISSION_MANAGEMENT' },
    { key: 'product:view', name: 'View Products', group: 'PRODUCT' },
    { key: 'product:create', name: 'Create Product', group: 'PRODUCT' },
    { key: 'product:update', name: 'Update Product', group: 'PRODUCT' },
    { key: 'product:delete', name: 'Delete Product', group: 'PRODUCT' },
    { key: 'variant:view', name: 'View Variants', group: 'PRODUCT' },
    { key: 'variant:create', name: 'Create Variant', group: 'PRODUCT' },
    { key: 'transaction:view', name: 'View Transactions', group: 'PRODUCT' },
    { key: 'category:view', name: 'View Categories', group: 'CATEGORY' },
    { key: 'category:create', name: 'Create Category', group: 'CATEGORY' },
    { key: 'brand:view', name: 'View Brands', group: 'BRAND' },
    { key: 'brand:create', name: 'Create Brand', group: 'BRAND' },
    { key: 'attribute:view', name: 'View Attributes', group: 'ATTRIBUTE' },
    { key: 'attribute:create', name: 'Create Attribute', group: 'ATTRIBUTE' },
    { key: 'media:view', name: 'View Media', group: 'MEDIA' },
    { key: 'media:create', name: 'Upload Media', group: 'MEDIA' },
  ]

  const permissionRecords = await Promise.all(
    perms.map(async (p) => {
      const record = await prisma.permission.upsert({
        where: { key: p.key },
        create: {
          key: p.key,
          name: p.name,
          description: p.key + ' permission',
          group: p.group,
        },
        update: {},
      })
      return record
    })
  )
  console.log('Created ' + permissionRecords.length + ' permissions')

  // Assign Permissions to Roles
  console.log('Assigning permissions to roles...')

  // SUPER_ADMIN gets all
  for (const perm of permissionRecords) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roles.SUPER_ADMIN, permissionId: perm.id } },
      create: { roleId: roles.SUPER_ADMIN, permissionId: perm.id },
      update: {},
    })
  }

  // ADMIN - most except user/role/permission mgmt
  const adminPerms = permissionRecords.filter((p) => !p.key.startsWith('user:') && !p.key.startsWith('role:') && !p.key.startsWith('permission:'))
  for (const perm of adminPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roles.ADMIN, permissionId: perm.id } },
      create: { roleId: roles.ADMIN, permissionId: perm.id },
      update: {},
    })
  }

  // CATALOG_MANAGER - product/category/brand/attribute/media related
  const catalogPerms = permissionRecords.filter((p) =>
    p.key.includes('product') || p.key.includes('variant') || p.key.includes('transaction') ||
    p.key.includes('category') || p.key.includes('brand') || p.key.includes('attribute') || p.key.includes('media')
  )
  for (const perm of catalogPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roles.CATALOG_MANAGER, permissionId: perm.id } },
      create: { roleId: roles.CATALOG_MANAGER, permissionId: perm.id },
      update: {},
    })
  }

  // VIEWER - view only + auth tokens
  const viewerPerms = permissionRecords.filter((p) => p.key.includes('view') || p.key.includes('token'))
  for (const perm of viewerPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roles.VIEWER, permissionId: perm.id } },
      create: { roleId: roles.VIEWER, permissionId: perm.id },
      update: {},
    })
  }
  console.log('Role-permission assignments complete')

  // Create Super Admin User
  console.log('Creating initial super admin user...')
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123'
  const hashedPassword = await bcrypt.hash(adminPassword, 10)

  const superAdmin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@trendsbird.com',
      password: hashedPassword,
      roleId: roles.SUPER_ADMIN,
      status: 'ACTIVE',
    },
  })
  console.log('Super Admin created: ' + superAdmin.email)
  console.log('Credentials:')
  console.log('  Email: admin@trendsbird.com')
  console.log('  Password: ' + adminPassword)
  console.log('Seeding completed!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Error seeding:', e)
    await prisma.$disconnect()
    process.exit(1)
  })