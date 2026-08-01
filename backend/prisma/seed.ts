import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Clear existing data - delete in correct order to avoid FK constraints
  // Only delete tables that are guaranteed to exist
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

    // USER
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

  // Create sample brands
  console.log('Creating sample brands...')
  const brandData = [
    { name: 'Apple', slug: 'apple', status: 'ACTIVE' as const, description: 'Premium electronics and accessories' },
    { name: 'Samsung', slug: 'samsung', status: 'ACTIVE' as const, description: 'Leading electronics manufacturer' },
    { name: 'Nike', slug: 'nike', status: 'ACTIVE' as const, description: 'Athletic footwear and apparel' },
    { name: 'Adidas', slug: 'adidas', status: 'ACTIVE' as const, description: 'Sports clothing and accessories' },
    { name: 'Sony', slug: 'sony', status: 'ACTIVE' as const, description: 'Consumer electronics and entertainment' },
  ]
  const brands = {}
  for (const b of brandData) {
    const brand = await prisma.brand.upsert({
      where: { slug: b.slug },
      create: b,
      update: {},
    })
    brands[b.slug] = brand.id
    console.log('Created brand: ' + b.name)
  }

  // Create sample categories
  console.log('Creating sample categories...')
  const electronics = await prisma.category.upsert({
    where: { slug: 'electronics' },
    create: { name: 'Electronics', slug: 'electronics', isActive: true },
    update: {},
  })
  console.log('Created category: Electronics')

  const smartphones = await prisma.category.upsert({
    where: { slug: 'smartphones' },
    create: { name: 'Smartphones', slug: 'smartphones', parentId: electronics.id, isActive: true },
    update: {},
  })
  console.log('Created category: Smartphones')

  const laptops = await prisma.category.upsert({
    where: { slug: 'laptops' },
    create: { name: 'Laptops', slug: 'laptops', parentId: electronics.id, isActive: true },
    update: {},
  })
  console.log('Created category: Laptops')

  const fashion = await prisma.category.upsert({
    where: { slug: 'fashion' },
    create: { name: 'Fashion', slug: 'fashion', isActive: true },
    update: {},
  })
  console.log('Created category: Fashion')

  const footwear = await prisma.category.upsert({
    where: { slug: 'footwear' },
    create: { name: 'Footwear', slug: 'footwear', parentId: fashion.id, isActive: true },
    update: {},
  })
  console.log('Created category: Footwear')

  // Create sample attributes
  console.log('Creating sample attributes...')
  const colorAttr = await prisma.attribute.upsert({
    where: { slug: 'color' },
    create: { name: 'Color', slug: 'color', type: 'COLOR_SWATCH' },
    update: {},
  })
  console.log('Created attribute: Color')

  const sizeAttr = await prisma.attribute.upsert({
    where: { slug: 'size' },
    create: { name: 'Size', slug: 'size', type: 'DROPDOWN' },
    update: {},
  })
  console.log('Created attribute: Size')

  // Create attribute values
  const colorValues = ['Red', 'Blue', 'Black', 'White', 'Silver', 'Gold']
  for (const val of colorValues) {
    const slug = `color-${val.toLowerCase()}`
    await prisma.attributeValue.upsert({
      where: { slug },
      create: {
        attributeId: colorAttr.id,
        slug,
        label: val,
        referenceValue: val.toLowerCase(),
        // type: 'COLOR',  // Not in schema
        // color: val.toLowerCase(),  // Not in schema
      },
      update: {},
    })
  }
  console.log('Created color values')

  const sizeValues = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
  for (const val of sizeValues) {
    const slug = `size-${val.toLowerCase()}`
    await prisma.attributeValue.upsert({
      where: { slug },
      create: {
        attributeId: sizeAttr.id,
        slug,
        label: val,
        referenceValue: val.toLowerCase(),
        // type: 'TEXT',  // Not in schema
      },
      update: {},
    })
  }
  console.log('Created size values')

  // Create sample products
  console.log('Creating sample products...')
  const products = [
    {
      name: 'iPhone 15 Pro',
      slug: 'iphone-15-pro',
      shortDescription: 'Latest Apple flagship smartphone',
      description: 'The iPhone 15 Pro features a titanium design, A17 Pro chip, and advanced camera system.',
      price: 999.99,
      salePrice: 949.99,
      stock: 50,
      stockStatus: 'IN_STOCK' as const,
      sku: 'APL-IP15P-128',
      status: 'PUBLISHED' as const,
      isActive: true,
      isFeatured: true,
      sortOrder: 1,
      brandId: brands.apple,
      categoryIds: [smartphones.id],
    },
    {
      name: 'Samsung Galaxy S24 Ultra',
      slug: 'samsung-galaxy-s24-ultra',
      shortDescription: 'Premium Android smartphone with S Pen',
      description: 'The Galaxy S24 Ultra features a 200MP camera, built-in S Pen, and Galaxy AI.',
      price: 1299.99,
      stock: 30,
      stockStatus: 'IN_STOCK' as const,
      sku: 'SAM-S24U-256',
      status: 'PUBLISHED' as const,
      isActive: true,
      isFeatured: true,
      sortOrder: 2,
      brandId: brands.samsung,
      categoryIds: [smartphones.id],
    },
    {
      name: 'MacBook Air M3',
      slug: 'macbook-air-m3',
      shortDescription: 'Lightweight laptop with M3 chip',
      description: 'The MacBook Air with M3 chip delivers incredible performance and up to 18 hours of battery life.',
      price: 1099.99,
      stock: 25,
      stockStatus: 'IN_STOCK' as const,
      sku: 'APL-MBA-M3-13',
      status: 'PUBLISHED' as const,
      isActive: true,
      isFeatured: false,
      sortOrder: 3,
      brandId: brands.apple,
      categoryIds: [laptops.id],
    },
    {
      name: 'Nike Air Max 270',
      slug: 'nike-air-max-270',
      shortDescription: 'Iconic lifestyle sneakers',
      description: 'The Nike Air Max 270 features Max Air cushioning for all-day comfort.',
      price: 150.00,
      salePrice: 120.00,
      stock: 100,
      stockStatus: 'IN_STOCK' as const,
      sku: 'NIK-AM270-10',
      status: 'PUBLISHED' as const,
      isActive: true,
      isFeatured: true,
      sortOrder: 4,
      brandId: brands.nike,
      categoryIds: [footwear.id],
    },
    {
      name: 'Adidas Ultraboost 22',
      slug: 'adidas-ultraboost-22',
      shortDescription: 'Premium running shoes',
      description: 'The Ultraboost 22 returns incredible energy with every stride.',
      price: 190.00,
      stock: 75,
      stockStatus: 'IN_STOCK' as const,
      sku: 'ADI-UB22-10',
      status: 'PUBLISHED' as const,
      isActive: true,
      isFeatured: false,
      sortOrder: 5,
      brandId: brands.adidas,
      categoryIds: [footwear.id],
    },
  ]

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      create: p,
      update: {},
    })
    console.log('Created product: ' + p.name)
  }

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