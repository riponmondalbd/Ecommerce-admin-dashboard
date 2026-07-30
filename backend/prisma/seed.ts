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

  // Create Permissions - All modules
  console.log('Creating permissions...')
  const perms = [
    // DASHBOARD
    { key: 'dashboard:watch', name: 'Watch Dashboard', group: 'DASHBOARD' },

    // PERMISSION
    { key: 'permission:watch', name: 'Watch Permissions', group: 'PERMISSION_MANAGEMENT' },
    { key: 'permission:create', name: 'Create Permission', group: 'PERMISSION_MANAGEMENT' },
    { key: 'permission:read', name: 'Read Permissions', group: 'PERMISSION_MANAGEMENT' },
    { key: 'permission:update', name: 'Update Permission', group: 'PERMISSION_MANAGEMENT' },
    { key: 'permission:delete', name: 'Delete Permission', group: 'PERMISSION_MANAGEMENT' },

    // ROLE
    { key: 'role:watch', name: 'Watch Roles', group: 'ROLE_MANAGEMENT' },
    { key: 'role:create', name: 'Create Role', group: 'ROLE_MANAGEMENT' },
    { key: 'role:read', name: 'Read Roles', group: 'ROLE_MANAGEMENT' },
    { key: 'role:update', name: 'Update Role', group: 'ROLE_MANAGEMENT' },
    { key: 'role:delete', name: 'Delete Role', group: 'ROLE_MANAGEMENT' },

    // USER
    { key: 'user:watch', name: 'Watch Users', group: 'USER_MANAGEMENT' },
    { key: 'user:create', name: 'Create User', group: 'USER_MANAGEMENT' },
    { key: 'user:read', name: 'Read Users', group: 'USER_MANAGEMENT' },
    { key: 'user:update', name: 'Update User', group: 'USER_MANAGEMENT' },
    { key: 'user:delete', name: 'Delete User', group: 'USER_MANAGEMENT' },

    // MEDIA
    { key: 'media:watch', name: 'Watch Media', group: 'MEDIA' },
    { key: 'media:read', name: 'Read Media', group: 'MEDIA' },
    { key: 'media:upload', name: 'Upload Media', group: 'MEDIA' },
    { key: 'media:write', name: 'Write Media', group: 'MEDIA' },
    { key: 'media:delete', name: 'Delete Media', group: 'MEDIA' },

    // CATEGORY
    { key: 'category:watch', name: 'Watch Categories', group: 'CATEGORY' },
    { key: 'category:create', name: 'Create Category', group: 'CATEGORY' },
    { key: 'category:read', name: 'Read Categories', group: 'CATEGORY' },
    { key: 'category:update', name: 'Update Category', group: 'CATEGORY' },
    { key: 'category:delete', name: 'Delete Category', group: 'CATEGORY' },

    // BRAND
    { key: 'brand:watch', name: 'Watch Brands', group: 'BRAND' },
    { key: 'brand:create', name: 'Create Brand', group: 'BRAND' },
    { key: 'brand:read', name: 'Read Brands', group: 'BRAND' },
    { key: 'brand:update', name: 'Update Brand', group: 'BRAND' },
    { key: 'brand:delete', name: 'Delete Brand', group: 'BRAND' },

    // ATTRIBUTE
    { key: 'attribute:watch', name: 'Watch Attributes', group: 'ATTRIBUTE' },
    { key: 'attribute:create', name: 'Create Attribute', group: 'ATTRIBUTE' },
    { key: 'attribute:read', name: 'Read Attributes', group: 'ATTRIBUTE' },
    { key: 'attribute:update', name: 'Update Attribute', group: 'ATTRIBUTE' },
    { key: 'attribute:delete', name: 'Delete Attribute', group: 'ATTRIBUTE' },

    // PRODUCT
    { key: 'product:watch', name: 'Watch Products', group: 'PRODUCT' },
    { key: 'product:create', name: 'Create Product', group: 'PRODUCT' },
    { key: 'product:read', name: 'Read Products', group: 'PRODUCT' },
    { key: 'product:update', name: 'Update Product', group: 'PRODUCT' },
    { key: 'product:delete', name: 'Delete Product', group: 'PRODUCT' },
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
          isActive: true,
        },
        update: {},
      })
      return record
    })
  )
  console.log('Created ' + permissionRecords.length + ' permissions')

  // Assign Permissions to Roles
  console.log('Assigning permissions to roles...')

  // SUPER_ADMIN gets ALL permissions
  for (const perm of permissionRecords) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roles.SUPER_ADMIN, permissionId: perm.id } },
      create: { roleId: roles.SUPER_ADMIN, permissionId: perm.id },
      update: {},
    })
  }

  // ADMIN - management permissions plus product/content access
  const adminPerms = permissionRecords.filter((p) =>
    p.key.startsWith('user:') ||
    p.key.startsWith('role:') ||
    p.key.startsWith('permission:') ||
    p.key.startsWith('product:') ||
    p.key.startsWith('category:') ||
    p.key.startsWith('brand:') ||
    p.key.startsWith('attribute:') ||
    p.key.startsWith('media:') ||
    p.key.startsWith('dashboard:')
  )
  for (const perm of adminPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roles.ADMIN, permissionId: perm.id } },
      create: { roleId: roles.ADMIN, permissionId: perm.id },
      update: {},
    })
  }

  // CATALOG_MANAGER - product/category/brand/attribute/media related only
  const catalogPerms = permissionRecords.filter((p) =>
    p.key.startsWith('product:') || 
    p.key.startsWith('category:') || 
    p.key.startsWith('brand:') || 
    p.key.startsWith('attribute:') || 
    p.key.startsWith('media:')
  )
  for (const perm of catalogPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roles.CATALOG_MANAGER, permissionId: perm.id } },
      create: { roleId: roles.CATALOG_MANAGER, permissionId: perm.id },
      update: {},
    })
  }

  // SUPPORT_AGENT - limited content view and create
  const supportPerms = permissionRecords.filter((p) =>
    p.key === 'product:watch' || p.key === 'product:read' || p.key === 'product:create' ||
    p.key === 'category:watch' || p.key === 'category:read' || 
    p.key.startsWith('brand:') ||
    p.key.startsWith('attribute:') || 
    p.key.startsWith('media:') ||
    p.key === 'dashboard:watch'
  )
  for (const perm of supportPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roles.SUPPORT_AGENT, permissionId: perm.id } },
      create: { roleId: roles.SUPPORT_AGENT, permissionId: perm.id },
      update: {},
    })
  }

  // VIEWER - read-only permissions across all modules
  const viewerPerms = permissionRecords.filter((p) => p.key.endsWith(':watch') || p.key.endsWith(':read'))
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

  // Create Catalog Manager User (for testing)
  console.log('Creating catalog manager user...')
  const catalogUser = await prisma.user.create({
    data: {
      name: 'Catalog Manager',
      email: 'catalog@trendsbird.com',
      password: await bcrypt.hash('Catalog@123', 10),
      roleId: roles.CATALOG_MANAGER,
      status: 'ACTIVE',
    },
  })
  console.log('Catalog Manager created: ' + catalogUser.email)

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