const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  const saltRounds = 10;

  // ============================================
  // 1. PERMISSIONS (Task 5)
  // ============================================
  console.log('⚡ Creating permissions...');
  const permissions = [
    { key: 'authentication:read', name: 'Read Authentication Info', group: 'AUTHENTICATION', isActive: true },
    { key: 'user_management:read', name: 'Read Users', group: 'USER_MANAGEMENT', isActive: true },
    { key: 'user_management:create', name: 'Create User', group: 'USER_MANAGEMENT', isActive: true },
    { key: 'user_management:update', name: 'Update User', group: 'USER_MANAGEMENT', isActive: true },
    { key: 'user_management:delete', name: 'Delete User', group: 'USER_MANAGEMENT', isActive: true },
    { key: 'role_management:read', name: 'Read Roles', group: 'ROLE_MANAGEMENT', isActive: true },
    { key: 'role_management:create', name: 'Create Role', group: 'ROLE_MANAGEMENT', isActive: true },
    { key: 'role_management:update', name: 'Update Role', group: 'ROLE_MANAGEMENT', isActive: true },
    { key: 'role_management:delete', name: 'Delete Role', group: 'ROLE_MANAGEMENT', isActive: true },
    { key: 'permission_management:read', name: 'Read Permissions', group: 'PERMISSION_MANAGEMENT', isActive: true },
    { key: 'permission_management:create', name: 'Create Permission', group: 'PERMISSION_MANAGEMENT', isActive: true },
    { key: 'media:read', name: 'Read Media', group: 'MEDIA', isActive: true },
    { key: 'media:create', name: 'Upload Media', group: 'MEDIA', isActive: true },
    { key: 'media:update', name: 'Update Media', group: 'MEDIA', isActive: true },
    { key: 'media:delete', name: 'Delete Media', group: 'MEDIA', isActive: true },
    { key: 'category:read', name: 'Read Categories', group: 'CATEGORY', isActive: true },
    { key: 'category:create', name: 'Create Category', group: 'CATEGORY', isActive: true },
    { key: 'category:update', name: 'Update Category', group: 'CATEGORY', isActive: true },
    { key: 'category:delete', name: 'Delete Category', group: 'CATEGORY', isActive: true },
    { key: 'brand:read', name: 'Read Brands', group: 'BRAND', isActive: true },
    { key: 'brand:create', name: 'Create Brand', group: 'BRAND', isActive: true },
    { key: 'brand:update', name: 'Update Brand', group: 'BRAND', isActive: true },
    { key: 'brand:delete', name: 'Delete Brand', group: 'BRAND', isActive: true },
    { key: 'attribute:read', name: 'Read Attributes', group: 'ATTRIBUTE', isActive: true },
    { key: 'attribute:create', name: 'Create Attribute', group: 'ATTRIBUTE', isActive: true },
    { key: 'attribute:update', name: 'Update Attribute', group: 'ATTRIBUTE', isActive: true },
    { key: 'attribute:delete', name: 'Delete Attribute', group: 'ATTRIBUTE', isActive: true },
    { key: 'product:read', name: 'Read Products', group: 'PRODUCT', isActive: true },
    { key: 'product:create', name: 'Create Product', group: 'PRODUCT', isActive: true },
    { key: 'product:update', name: 'Update Product', group: 'PRODUCT', isActive: true },
    { key: 'product:delete', name: 'Delete Product', group: 'PRODUCT', isActive: true },
    { key: 'product_variant:read', name: 'Read Variants', group: 'PRODUCT', isActive: true },
    { key: 'product_variant:create', name: 'Create Variant', group: 'PRODUCT', isActive: true },
    { key: 'transaction:read', name: 'Read Transactions', group: 'PRODUCT',isActive: true },
  ];

  for (const perm of permissions) {
    try {
      await prisma.permission.upsert({
        where: { key: perm.key },
        update: {},
        create: perm,
      });
    } catch (e) {
      console.warn(`Permission ${perm.key} already exists`);
    }
  }

  const permRecords = await prisma.permission.findMany();
  console.log(`✅ ${permRecords.length} permissions ready`);

  // ============================================
  // 2. ROLES (Task 6) + PERMISSION ASSIGNMENTS
  // ============================================
  console.log('🎭 Creating roles...');

  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: { name: 'SUPER_ADMIN', isSystem: true, isActive: true },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', isSystem: false, isActive: true },
  });

  const catalogManagerRole = await prisma.role.upsert({
    where: { name: 'CATALOG_MANAGER' },
    update: {},
    create: { name: 'CATALOG_MANAGER', isSystem: false, isActive: true },
  });

  const supportAgentRole = await prisma.role.upsert({
    where: { name: 'SUPPORT_AGENT' },
    update: {},
    create: { name: 'SUPPORT_AGENT', isSystem: false, isActive: true },
  });

  const viewerRole = await prisma.role.upsert({
    where: { name: 'VIEWER' },
    update: {},
    create: { name: 'VIEWER', isSystem: false, isActive: true },
  });

  // Map role IDs for permission assignment
  const roleMap = {
    superAdmin: superAdminRole.id,
    admin: adminRole.id,
    catalog: catalogManagerRole.id,
    support: supportAgentRole.id,
    viewer: viewerRole.id,
  };

  // Get all permission IDs
  const permMap = {};
  for (const perm of permRecords) {
    permMap[perm.key] = perm.id;
  }

  // Assign permissions to roles (simplified mapping)
  const assignPermissions = async (roleId, permKeys) => {
    for (const key of permKeys) {
      if (permMap[key]) {
        try {
          await prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId, permissionId: permMap[key] } },
            update: {},
            create: { roleId, permissionId: permMap[key] },
          });
        } catch (e) {}
      }
    }
  };

  // Super Admin: ALL permissions
  assignPermissions(roleMap.superAdmin, Object.keys(permMap));

  // Admin: Most permissions except authentication & permission management
  const adminPerms = Object.keys(permMap).filter(k => !k.startsWith('authentication:') && !k.startsWith('permission_management:'));
  assignPermissions(roleMap.admin, adminPerms);

  // Catalog Manager: Product, Category, Brand, Attribute, Media permissions
  const catalogPerms = Object.keys(permMap).filter(k =>
    k.startsWith('product:') || k.startsWith('category:') ||
    k.startsWith('brand:') || k.startsWith('attribute:') || k.startsWith('media:')
  );
  assignPermissions(roleMap.catalog, catalogPerms);

  // Support Agent: Read-only product and media
  const supportPerms = Object.keys(permMap).filter(k =>
    (k.includes('read') && (k.startsWith('product:') || k.startsWith('media:')))
  );
  assignPermissions(roleMap.support, supportPerms);

  // Viewer: Very limited read access
  const viewerPerms = Object.keys(permMap).filter(k =>
    k.startsWith('category:') && k.includes('read') ||
    k.startsWith('brand:') && k.includes('read')
  );
  assignPermissions(roleMap.viewer, viewerPerms);

  console.log('✅ Roles and permissions assigned');

  // ============================================
  // 3. USERS (Task 7)
  // ============================================
  console.log('👥 Creating users...');

  const adminHash = await bcrypt.process.env.ADMIN_PASSWORD || 'admin123';
  const adminHashed = await bcrypt.hash(adminHash, saltRounds);

  await prisma.user.upsert({
    where: { email: 'admin@trends-bird.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@trends-bird.com',
      password: adminHashed,
      roleId: roleMap.superAdmin,
      status: 'ACTIVE',
    },
  });

  const catalogHash = await bcrypt.hash('catalog123', saltRounds);
  await prisma.user.upsert({
    where: { email: 'catalog@trends-bird.com' },
    update: {},
    create: {
      name: 'Catalog Manager',
      email: 'catalog@trends-bird.com',
      password: catalogHash,
      roleId: roleMap.catalog,
      status: 'ACTIVE',
    },
  });

  console.log('✅ Users created');

  // ============================================
  // 4. CATEGORIES (Task 9) - Nested Tree
  // ============================================
  console.log('📂 Creating categories...');

  const rootElectronics = await prisma.category.create({
    data: { name: 'Electronics', slug: 'electronics', description: 'All electronic devices', isActive: true },
  });

  const rootClothing = await prisma.category.create({
    data: { name: 'Clothing', slug: 'clothing', description: 'Apparel and accessories', isActive: true },
  });

  const phonesSub = await prisma.category.create({
    data: { name: 'Phones & Tablets', slug: 'phones-tablets', parentId: rootElectronics.id, isActive: true },
  });

  const computersSub = await prisma.category.create({
    data: { name: 'Computers', slug: 'computers', parentId: rootElectronics.id, isActive: true },
  });

  const mensClothing = await prisma.category.create({
    data: { name: \"Men's Clothing\", slug: 'mens-clothing', parentId: rootClothing.id, isActive: true },
  });

  const womensClothing = await prisma.category.create({
    data: { name: "Women's Clothing", slug: 'womens-clothing', parentId: rootClothing.id, isActive: true },
  });

  console.log('✅ Category tree created');

  // ============================================
  // 5. BRANDS (Task 10)
  // ============================================
  console.log('🏷️ Creating brands...');

  const appleMedia = await prisma.media.create({
    data: { fileName: 'apple-logo.png', filePath: '/uploads/apple-logo.png', publicPath: '/uploads/apple-logo.png', type: 0, size: 10240, status: 2, uploadedById: '00000000-0000-0000-0000-000000000001' },
  });

  const samsungMedia = await prisma.media.create({
    data: { fileName: 'samsung-logo.png', filePath: '/uploads/samsung-logo.png', publicPath: '/uploads/samsung-logo.png', type: 0, size: 11264, status: 2, uploadedById: '00000000-0000-0000-0000-000000000001' },
  });

  const appleBrand = await prisma.brand.create({
    data: { name: 'Apple', description: 'American tech company', status: 0, mediaId: appleMedia.id },
  });

  const samsungBrand = await prisma.brand.create({
    data: { name: 'Samsung', description: 'South Korean conglomerate', status: 0, mediaId: samsungMedia.id },
  });

  const nikeBrand = await prisma.brand.create({ data: { name: 'Nike', description: 'Sportswear manufacturer', status: 0 } });

  const adidasBrand = await prisma.brand.create({ data: { name: 'Adidas', description: 'German sportswear company', status: 0 } });

  console.log('✅ Brands created');

  // ============================================
  // 6. ATTRIBUTES (Task 11)
  // ============================================
  console.log('🔧 Creating attributes...');

  const colorAttr = await prisma.attribute.create({ data: { name: 'Color', type: 2, description: 'Color options' } });
  const sizeAttr = await prisma.attribute.create({ data: { name: 'Size', type: 1, description: 'Size selection' } });
  const materialAttr = await prisma.attribute.create({ data: { name: 'Material', type: 0, description: 'Material composition' } });

  // Color values
  const redValue = await prisma.attributeValue.create({ data: { label: 'Red', valueCode: '#FF0000', sortOrder: 1, attributeId: colorAttr.id } });
  const blueValue = await prisma.attributeValue.create({ data: { label: 'Blue', valueCode: '#0000FF', sortOrder: 2, attributeId: colorAttr.id } });
  const blackValue = await prisma.attributeValue.create({ data: { label: 'Black', valueCode: '#000000', sortOrder: 3, attributeId: colorAttr.id } });
  const whiteValue = await prisma.attributeValue.create({ data: { label: 'White', valueCode: '#FFFFFF', sortOrder: 4, attributeId: colorAttr.id } });

  // Size values
  const sValue = await prisma.attributeValue.create({ data: { label: 'S (Small)', valueCode: 'S', sortOrder: 1, attributeId: sizeAttr.id } });
  const mValue = await prisma.attributeValue.create({ data: { label: 'M (Medium)', valueCode: 'M', sortOrder: 2, attributeId: sizeAttr.id } });
  const lValue = await prisma.attributeValue.create({ data: { label: 'L (Large)', valueCode: 'L', sortOrder: 3, attributeId: sizeAttr.id } });
  const xlValue = await prisma.attributeValue.create({ data: { label: 'XL (Extra Large)', valueCode: 'XL', sortOrder: 4, attributeId: sizeAttr.id } });

  // Material values
  const cottonValue = await prisma.attributeValue.create({ data: { label: 'Cotton', valueCode: 'cotton', sortOrder: 1, attributeId: materialAttr.id } });
  const polyesterValue = await prisma.attributeValue.create({ data: { label: 'Polyester', valueCode: 'polyester', sortOrder: 2, attributeId: materialAttr.id } });

  console.log('✅ Attributes and values created');

  // ============================================
  // 7. PRODUCTS & VARIANTS (Task 12 - STAR)
  // ============================================
  console.log('🛍️ Creating products and variants...');

  const iphoneProduct = await prisma.product.create({
    data: {
      name: 'iPhone 15 Pro',
      description: 'Latest Apple smartphone with A17 Pro chip',
      price: 999.99,
      sku: 'IPHONE15PRO',
      categoryId: rootElectronics.id,
      brandId: appleBrand.id,
      status: 1,
    },
  });

  const nikeAirMaxProduct = await prisma.product.create({
    data: {
      name: 'Nike Air Max 270',
      description: 'Comfortable running shoes with air cushioning',
      price: 129.99,
      sku: 'NIKEAIRMAX270',
      categoryId: womensClothing.id,
      brandId: nikeBrand.id,
      status: 1,
    },
  });

  // iPhone variants
  const iphoneBlueVariant = await prisma.productVariant.create({
    data: {
      productId: iphoneProduct.id,
      sku: 'IPHONE15PRO-BLU',
      price: 999.99,
      inventory: 50,
      weight: 0.187,
      dimensions: JSON.stringify({ width: '7.15', height: '14.66', depth: '0.78' }),
      attributeValues: {
        create: [{ attributeValueId: blueValue.id }, { attributeValueId: mValue.id }],
      },
    },
  });

  const iphoneBlackVariant = await prisma.productVariant.create({
    data: {
      productId: iphoneProduct.id,
      sku: 'IPHONE15PRO-BLK',
      price: 999.99,
      inventory: 35,
      weight: 0.187,
      dimensions: JSON.stringify({ width: '7.15', height: '14.66', depth: '0.78' }),
      attributeValues: { create: [{ attributeValueId: blackValue.id }, { attributeValueId: mValue.id }] },
    },
  });

  // Nike variant
  const nikeWhiteVariant = await prisma.productVariant.create({
    data: {
      productId: nikeAirMaxProduct.id,
      sku: 'NIKEWM-WHITE',
      price: 129.99,
      inventory: 100,
      weight: 0.5,
      dimensions: JSON.stringify({ width: '12', height: '4', depth: '4' }),
      attributeValues: {
        create: [
          { attributeValueId: whiteValue.id },
          { attributeValueId: lValue.id },
          { attributeValueId: cottonValue.id },
        ],
      },
    },
  });

  console.log('✅ Products and variants created');

  // ============================================
  // 8. PRODUCT ATTRIBUTE VALUE LINKS
  // ============================================
  console.log('🔗 Creating attribute-value links...');

  await prisma.productAttributeValue.createMany({
    data: [
      { productVariantId: iphoneBlueVariant.id, attributeValueId: blueValue.id },
      { productVariantId: iphoneBlackVariant.id, attributeValueId: blackValue.id },
      { productVariantId: iphoneBlueVariant.id, attributeValueId: mValue.id },
      { productVariantId: iphoneBlackVariant.id, attributeValueId: mValue.id },
      { productVariantId: nikeWhiteVariant.id, attributeValueId: whiteValue.id },
      { productVariantId: nikeWhiteVariant.id, attributeValueId: lValue.id },
      { productVariantId: nikeWhiteVariant.id, attributeValueId: cottonValue.id },
    ],
  });

  console.log('✅ Attribute-value links created');

  // ============================================
  // 9. PRODUCT TRANSACTIONS (Task 12)
  // ============================================
  console.log('📝 Creating transaction records...');

  await prisma.productTransaction.createMany({
    data: [
      { productId: iphoneProduct.id, variantId: null, type: 'CREATE', quantity: 1, priceAtTime: 999.99, notes: 'Product initially created' },
      { productId: iphoneProduct.id, variantId: iphoneBlueVariant.id, type: 'SELL', quantity: -5, priceAtTime: 999.99, notes: '5 units sold' },
      { productId: iphoneProduct.id, variantId: iphoneBlackVariant.id, type: 'RESTOCK', quantity: 20, priceAtTime: 999.99, notes: 'Restocked 20 units' },
      { productId: nikeAirMaxProduct.id, variantId: nikeWhiteVariant.id, type: 'SELL', quantity: -15, priceAtTime: 129.99, notes: '15 units sold' },
      { productId: nikeAirMaxProduct.id, variantId: nikeWhiteVariant.id, type: 'ADJUST', quantity: -2, priceAtTime: 129.99, notes: '2 units damaged/returned' },
    ],
  });

  console.log('✅ Transactions recorded');
  console.log('\n🎉 Seed script completed successfully!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});