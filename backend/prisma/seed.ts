import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Clear existing data - delete in correct order to avoid FK constraints
  await prisma.product.deleteMany()
  await prisma.attributeValue.deleteMany()
  await prisma.attribute.deleteMany()
  await prisma.category.deleteMany()
  await prisma.brand.deleteMany()
  await prisma.media.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.user.deleteMany()
  await prisma.rolePermission.deleteMany()
  await prisma.role.deleteMany()
  await prisma.permission.deleteMany()

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

    // USER - critical: user:read, user:create, user:update are needed for user management
    { key: 'user:watch', name: 'Watch Users', group: 'USER_MANAGEMENT' },
    { key: 'user:create', name: 'Create User', group: 'USER_MANAGEMENT' },
    { key: 'user:read', name: 'Read Users', group: 'USER_MANAGEMENT' },
    { key: 'user:update', name: 'Update User', group: 'USER_MANAGEMENT' },
    { key: 'user:delete', name: 'Delete User', group: 'USER_MANAGEMENT' },

    // MEDIA
    { key: 'media:watch', name: 'Watch Media', group: 'MEDIA' },
    { key: 'media:read', name: 'Read Media', group: 'MEDIA' },
    { key: 'media:create', name: 'Create Media', group: 'MEDIA' },
    { key: 'media:update', name: 'Update Media', group: 'MEDIA' },
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

  // ADMIN - full user management permissions + all content management
  const adminPermissionKeys = [
    'user:read', 'user:update', 'user:create', 'user:watch', 'user:delete',
    'role:read', 'role:update', 'role:create',
    'permission:read', 'permission:update', 'permission:create',
    'dashboard:watch',
    'product:read', 'product:create', 'product:update', 'product:delete',
    'category:read', 'category:create', 'category:update', 'category:delete',
    'brand:read', 'brand:create', 'brand:update', 'brand:delete',
    'attribute:read', 'attribute:create', 'attribute:update', 'attribute:delete',
    'media:read', 'media:create', 'media:update', 'media:delete',
  ]

  for (const key of adminPermissionKeys) {
    const perm = permissionRecords.find(p => p.key === key)
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: roles.ADMIN, permissionId: perm.id } },
        create: { roleId: roles.ADMIN, permissionId: perm.id },
        update: {},
      })
    }
  }

  // CATALOG_MANAGER - user management permissions for create user
  const catalogPermissionKeys = [
    'user:read', 'user:update', 'user:create', 'user:watch', 'user:delete',
    'product:read', 'product:create', 'product:update', 'product:delete',
    'category:read', 'category:create', 'category:update', 'category:delete',
    'brand:read', 'brand:create', 'brand:update', 'brand:delete',
    'attribute:read', 'attribute:create', 'attribute:update', 'attribute:delete',
    'media:read', 'media:create', 'media:update', 'media:delete',
    'dashboard:watch'
  ]

  for (const key of catalogPermissionKeys) {
    const perm = permissionRecords.find(p => p.key === key)
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: roles.CATALOG_MANAGER, permissionId: perm.id } },
        create: { roleId: roles.CATALOG_MANAGER, permissionId: perm.id },
        update: {},
      })
    }
  }

  // SUPPORT_AGENT - limited access
  const supportPermissionKeys = [
    'user:read', 'user:watch',
    'product:read', 'product:create', 'product:watch',
    'category:read', 'category:watch',
    'brand:read', 'brand:watch',
    'attribute:read', 'attribute:watch',
    'media:read', 'media:watch',
    'dashboard:watch'
  ]

  for (const key of supportPermissionKeys) {
    const perm = permissionRecords.find(p => p.key === key)
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: roles.SUPPORT_AGENT, permissionId: perm.id } },
        create: { roleId: roles.SUPPORT_AGENT, permissionId: perm.id },
        update: {},
      })
    }
  }

  // VIEWER - read-only
  const viewerPermissionKeys = [
    'dashboard:watch',
    'product:read', 'product:watch',
    'category:read', 'category:watch',
    'brand:read', 'brand:watch',
    'attribute:read', 'attribute:watch',
    'media:read', 'media:watch',
    'user:read', 'user:watch'
  ]

  for (const key of viewerPermissionKeys) {
    const perm = permissionRecords.find(p => p.key === key)
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: roles.VIEWER, permissionId: perm.id } },
        create: { roleId: roles.VIEWER, permissionId: perm.id },
        update: {},
      })
    }
  }

  console.log('Role-permission assignments complete')

  // Create Super Admin User with all permissions
  console.log('Creating super admin user...')
  const superAdminExists = await prisma.user.findUnique({ where: { email: 'admin@trendsbird.com' } })
  if (!superAdminExists) {
    const hashedPassword = await bcrypt.hash('SuperAdmin@123', 10)
    const superAdmin = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: 'admin@trendsbird.com',
        phone: '+1234567890',
        password: hashedPassword,
        roleId: roles.SUPER_ADMIN,
        status: 'ACTIVE',
      },
      include: { role: true },
    })
    console.log('Created super admin:', superAdmin.email)
  } else {
    console.log('Super admin user already exists')
  }

  // Create Catalog Manager User
  console.log('Creating catalog manager user...')
  const catalogExists = await prisma.user.findUnique({ where: { email: 'catalog@trendsbird.com' } })
  if (!catalogExists) {
    const hashedPassword = await bcrypt.hash('CatalogManager@123', 10)
    const catalogUser = await prisma.user.create({
      data: {
        name: 'Catalog Manager',
        email: 'catalog@trendsbird.com',
        phone: '+1234567891',
        password: hashedPassword,
        roleId: roles.CATALOG_MANAGER,
        status: 'ACTIVE',
      },
      include: { role: true },
    })
    console.log('Created catalog manager:', catalogUser.email)
  } else {
    console.log('Catalog manager user already exists')
  }

  // Create Support Agent User
  console.log('Creating support agent user...')
  const supportExists = await prisma.user.findUnique({ where: { email: 'support@trendsbird.com' } })
  if (!supportExists) {
    const hashedPassword = await bcrypt.hash('SupportAgent@123', 10)
    const supportUser = await prisma.user.create({
      data: {
        name: 'Support Agent',
        email: 'support@trendsbird.com',
        phone: '+1234567892',
        password: hashedPassword,
        roleId: roles.SUPPORT_AGENT,
        status: 'ACTIVE',
      },
      include: { role: true },
    })
    console.log('Created support agent:', supportUser.email)
  } else {
    console.log('Support agent user already exists')
  }

  // Create Viewer User
  console.log('Creating viewer user...')
  const viewerExists = await prisma.user.findUnique({ where: { email: 'viewer@trendsbird.com' } })
  if (!viewerExists) {
    const hashedPassword = await bcrypt.hash('ViewerPass123', 10)
    const viewerUser = await prisma.user.create({
      data: {
        name: 'Viewer',
        email: 'viewer@trendsbird.com',
        phone: '+1234567893',
        password: hashedPassword,
        roleId: roles.VIEWER,
        status: 'ACTIVE',
      },
      include: { role: true },
    })
    console.log('Created viewer:', viewerUser.email)
  } else {
    console.log('Viewer user already exists')
  }

  // Create Sample Product
  console.log('Creating sample product...')
  const productExists = await prisma.product.findUnique({ where: { sku: 'TEST-PROD-001' } })
  if (!productExists) {
    const product = await prisma.product.create({
      data: {
        name: 'Test Product',
        slug: 'test-product',
        sku: 'TEST-PROD-001',
        shortDescription: 'Sample test product',
        description: 'This is a test product for demonstration purposes.',
        hasVariants: false,
        price: 99.99,
        stock: 100,
        isActive: true,
        isFeatured: true,
        status: 'PUBLISHED',
      },
    })
    console.log('Created product:', product.name)
  }

  console.log('Seeding complete!')
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
