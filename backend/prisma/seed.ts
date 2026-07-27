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
    // AUTHENTICATION模块
    { key: 'authentication:view', name: 'View Authentication Settings', group: 'AUTHENTICATION' },
    { key: 'authentication:login', name: 'Login', group: 'AUTHENTICATION' },
    { key: 'authentication:logout', name: 'Logout', group: 'AUTHENTICATION' },
    { key: 'authentication:refresh', name: 'Refresh Token', group: 'AUTHENTICATION' },

    // USER_MANAGEMENT模块
    { key: 'user_management:read', name: 'View Users', group: 'USER_MANAGEMENT' },
    { key: 'user_management:create', name: 'Create User', group: 'USER_MANAGEMENT' },
    { key: 'user_management:update', name: 'Update User', group: 'USER_MANAGEMENT' },
    { key: 'user_management:delete', name: 'Delete User', group: 'USER_MANAGEMENT' },
    { key: 'user_management:activate', name: 'Activate User', group: 'USER_MANAGEMENT' },
    { key: 'user_management:deactivate', name: 'Deactivate User', group: 'USER_MANAGEMENT' },
    { key: 'user_management:lock', name: 'Lock User', group: 'USER_MANAGEMENT' },
    { key: 'user_management:unlock', name: 'Unlock User', group: 'USER_MANAGEMENT' },

    // ROLE_MANAGEMENT模块
    { key: 'role_management:read', name: 'View Roles', group: 'ROLE_MANAGEMENT' },
    { key: 'role_management:create', name: 'Create Role', group: 'ROLE_MANAGEMENT' },
    { key: 'role_management:update', name: 'Update Role', group: 'ROLE_MANAGEMENT' },
    { key: 'role_management:delete', name: 'Delete Role', group: 'ROLE_MANAGEMENT' },

    // PERMISSION_MANAGEMENT模块
    { key: 'permission_management:read', name: 'View Permissions', group: 'PERMISSION_MANAGEMENT' },
    { key: 'permission_management:create', name: 'Create Permission', group: 'PERMISSION_MANAGEMENT' },
    { key: 'permission_management:update', name: 'Update Permission', group: 'PERMISSION_MANAGEMENT' },
    { key: 'permission_management:delete', name: 'Delete Permission', group: 'PERMISSION_MANAGEMENT' },

    // PRODUCT模块
    { key: 'product:view', name: 'View Products', group: 'PRODUCT' },
    { key: 'product:create', name: 'Create Product', group: 'PRODUCT' },
    { key: 'product:update', name: 'Update Product', group: 'PRODUCT' },
    { key: 'product:delete', name: 'Delete Product', group: 'PRODUCT' },
    { key: 'variant:view', name: 'View Variants', group: 'PRODUCT' },
    { key: 'variant:create', name: 'Create Variant', group: 'PRODUCT' },
    { key: 'transaction:view', name: 'View Transactions', group: 'PRODUCT' },

    // CATEGORY模块
    { key: 'category:view', name: 'View Categories', group: 'CATEGORY' },
    { key: 'category:create', name: 'Create Category', group: 'CATEGORY' },

    // BRAND模块
    { key: 'brand:view', name: 'View Brands', group: 'BRAND' },
    { key: 'brand:create', name: 'Create Brand', group: 'BRAND' },

    // ATTRIBUTE模块
    { key: 'attribute:view', name: 'View Attributes', group: 'ATTRIBUTE' },
    { key: 'attribute:create', name: 'Create Attribute', group: 'ATTRIBUTE' },

    // MEDIA模块
    { key: 'media:view', name: 'View Media', group: 'MEDIA' },
    { key: 'media:create', name: 'Upload Media', group: 'MEDIA' },

    // DASHBOARD模块
    { key: 'dashboard:view', name: 'View Dashboard', group: 'DASHBOARD' },

    // SETTINGS模块
    { key: 'settings:view', name: 'View Settings', group: 'SETTINGS' },
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
    p.key.startsWith('user_management:') ||
    p.key.startsWith('role_management:') ||
    p.key.startsWith('permission_management:') ||
    p.key.startsWith('product:') ||
    p.key.startsWith('category:') ||
    p.key.startsWith('brand:') ||
    p.key.startsWith('attribute:') ||
    p.key.startsWith('media:') ||
    p.key.startsWith('dashboard:') ||
    p.key.startsWith('settings:') ||
    p.key.includes('view') && !p.key.includes('token')
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

  // SUPPORT_AGENT - limited content view and create
  const supportPerms = permissionRecords.filter((p) =>
    p.key === 'product:view' || p.key === 'product:create' ||
    p.key === 'category:view' || p.key.includes('brand') ||
    p.key.includes('attribute') || p.key.includes('media') ||
    p.key === 'dashboard:view'
  )
  for (const perm of supportPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roles.SUPPORT_AGENT, permissionId: perm.id } },
      create: { roleId: roles.SUPPORT_AGENT, permissionId: perm.id },
      update: {},
    })
  }

  // VIEWER - read-only permissions across all modules
  const viewerPerms = permissionRecords.filter((p) => p.key.includes('view'))
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