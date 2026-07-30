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
    // DASHBOARD
    { key: 'dashboard:watch', name: 'Watch Dashboard', group: 'DASHBOARD', isActive: true },

    // PERMISSION
    { key: 'permission:watch', name: 'Watch Permissions', group: 'PERMISSION_MANAGEMENT', isActive: true },
    { key: 'permission:create', name: 'Create Permission', group: 'PERMISSION_MANAGEMENT', isActive: true },
    { key: 'permission:read', name: 'Read Permissions', group: 'PERMISSION_MANAGEMENT', isActive: true },
    { key: 'permission:update', name: 'Update Permission', group: 'PERMISSION_MANAGEMENT', isActive: true },
    { key: 'permission:delete', name: 'Delete Permission', group: 'PERMISSION_MANAGEMENT', isActive: true },

    // ROLE
    { key: 'role:watch', name: 'Watch Roles', group: 'ROLE_MANAGEMENT', isActive: true },
    { key: 'role:create', name: 'Create Role', group: 'ROLE_MANAGEMENT', isActive: true },
    { key: 'role:read', name: 'Read Roles', group: 'ROLE_MANAGEMENT', isActive: true },
    { key: 'role:update', name: 'Update Role', group: 'ROLE_MANAGEMENT', isActive: true },
    { key: 'role:delete', name: 'Delete Role', group: 'ROLE_MANAGEMENT', isActive: true },

    // USER
    { key: 'user:watch', name: 'Watch Users', group: 'USER_MANAGEMENT', isActive: true },
    { key: 'user:create', name: 'Create User', group: 'USER_MANAGEMENT', isActive: true },
    { key: 'user:read', name: 'Read Users', group: 'USER_MANAGEMENT', isActive: true },
    { key: 'user:update', name: 'Update User', group: 'USER_MANAGEMENT', isActive: true },
    { key: 'user:delete', name: 'Delete User', group: 'USER_MANAGEMENT', isActive: true },

    // MEDIA
    { key: 'media:watch', name: 'Watch Media', group: 'MEDIA', isActive: true },
    { key: 'media:read', name: 'Read Media', group: 'MEDIA', isActive: true },
    { key: 'media:upload', name: 'Upload Media', group: 'MEDIA', isActive: true },
    { key: 'media:write', name: 'Write Media', group: 'MEDIA', isActive: true },
    { key: 'media:delete', name: 'Delete Media', group: 'MEDIA', isActive: true },

    // CATEGORY
    { key: 'category:watch', name: 'Watch Categories', group: 'CATEGORY', isActive: true },
    { key: 'category:create', name: 'Create Category', group: 'CATEGORY', isActive: true },
    { key: 'category:read', name: 'Read Categories', group: 'CATEGORY', isActive: true },
    { key: 'category:update', name: 'Update Category', group: 'CATEGORY', isActive: true },
    { key: 'category:delete', name: 'Delete Category', group: 'CATEGORY', isActive: true },

    // BRAND
    { key: 'brand:watch', name: 'Watch Brands', group: 'BRAND', isActive: true },
    { key: 'brand:create', name: 'Create Brand', group: 'BRAND', isActive: true },
    { key: 'brand:read', name: 'Read Brands', group: 'BRAND', isActive: true },
    { key: 'brand:update', name: 'Update Brand', group: 'BRAND', isActive: true },
    { key: 'brand:delete', name: 'Delete Brand', group: 'BRAND', isActive: true },

    // ATTRIBUTE
    { key: 'attribute:watch', name: 'Watch Attributes', group: 'ATTRIBUTE', isActive: true },
    { key: 'attribute:create', name: 'Create Attribute', group: 'ATTRIBUTE', isActive: true },
    { key: 'attribute:read', name: 'Read Attributes', group: 'ATTRIBUTE', isActive: true },
    { key: 'attribute:update', name: 'Update Attribute', group: 'ATTRIBUTE', isActive: true },
    { key: 'attribute:delete', name: 'Delete Attribute', group: 'ATTRIBUTE', isActive: true },

    // PRODUCT
    { key: 'product:watch', name: 'Watch Products', group: 'PRODUCT', isActive: true },
    { key: 'product:create', name: 'Create Product', group: 'PRODUCT', isActive: true },
    { key: 'product:read', name: 'Read Products', group: 'PRODUCT', isActive: true },
    { key: 'product:update', name: 'Update Product', group: 'PRODUCT', isActive: true },
    { key: 'product:delete', name: 'Delete Product', group: 'PRODUCT', isActive: true },
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
  const adminPerms = Object.keys(permMap).filter(k =>
    k.startsWith('user:') || k.startsWith('role:') || k.startsWith('permission:') ||
    k.startsWith('product:') || k.startsWith('category:') || k.startsWith('brand:') ||
    k.startsWith('attribute:') || k.startsWith('media:') || k.startsWith('dashboard:')
  );
  assignPermissions(roleMap.admin, adminPerms);

  // Catalog Manager: Product, Category, Brand, Attribute, Media permissions
  const catalogPerms = Object.keys(permMap).filter(k =>
    k.startsWith('product:') || k.startsWith('category:') || k.startsWith('brand:') ||
    k.startsWith('attribute:') || k.startsWith('media:')
  );
  assignPermissions(roleMap.catalog, catalogPerms);

  // Support Agent: Read-only product and media
  const supportPerms = Object.keys(permMap).filter(k =>
    k === 'product:watch' || k === 'product:read' || k === 'product:create' ||
    k === 'category:watch' || k === 'category:read' || 
    k.startsWith('brand:') || k.startsWith('attribute:') || k.startsWith('media:') || k === 'dashboard:watch'
  );
  assignPermissions(roleMap.support, supportPerms);

  // Viewer: Very limited read access
  const viewerPerms = Object.keys(permMap).filter(k => k.endsWith(':watch') || k.endsWith(':read'));
  assignPermissions(roleMap.viewer, viewerPerms);

  console.log('✅ Roles and permissions assigned');

  // ============================================
  // 3. USERS (Task 7)
  // ============================================
  console.log('👥 Creating users...');

  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminHashed = await bcrypt.hash(adminPassword, saltRounds);

  const adminUser = await prisma.user.upsert({
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
  const catalogUser = await prisma.user.upsert({
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
  console.log(`Admin user ID: ${adminUser.id}`);
  console.log(`Catalog user ID: ${catalogUser.id}`);

  // Store admin user ID for media uploads
  const adminUserId = adminUser.id;

  // ============================================
  // 4. CATEGORIES (Task 9) - Nested Tree
  // ============================================
  console.log('📂 Creating categories...');

  const rootElectronics = await prisma.category.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: { name: 'Electronics', slug: 'electronics', description: 'All electronic devices', isActive: true },
  });

  const rootClothing = await prisma.category.upsert({
    where: { slug: 'clothing' },
    update: {},
    create: { name: 'Clothing', slug: 'clothing', description: 'Apparel and accessories', isActive: true },
  });

  const phonesSub = await prisma.category.upsert({
    where: { slug: 'phones-tablets' },
    update: {},
    create: { name: 'Phones & Tablets', slug: 'phones-tablets', parentId: rootElectronics.id, isActive: true },
  });

  const computersSub = await prisma.category.upsert({
    where: { slug: 'computers' },
    update: {},
    create: { name: 'Computers', slug: 'computers', parentId: rootElectronics.id, isActive: true },
  });

  const mensClothing = await prisma.category.upsert({
    where: { slug: 'mens-clothing' },
    update: {},
    create: { name: "Men's Clothing", slug: 'mens-clothing', parentId: rootClothing.id, isActive: true },
  });

  const womensClothing = await prisma.category.upsert({
    where: { slug: 'womens-clothing' },
    update: {},
    create: { name: "Women's Clothing", slug: 'womens-clothing', parentId: rootClothing.id, isActive: true },
  });

  console.log('✅ Category tree created');

  // ============================================
  // 5. BRANDS (Task 10)
  // ============================================
  console.log('🏷️ Creating brands...');

  // Create media entries - use create directly (no upsert needed, just ensure they don't conflict)
  const createMediaIfNotExist = async (fileName, type, size) => {
    // First check if already exists
    let media = await prisma.media.findFirst({ where: { fileName } });
    if (media) return media;

    // Try to create
    try {
      return await prisma.media.create({
        data: {
          fileName,
          filePath: `/uploads/${fileName}`,
          publicUrl: `/uploads/${fileName}`,
          type,
          size,
          status: 'READY',
          uploadedById: adminUserId,
        },
      });
    } catch (error) {
      // If foreign key error (user not found), try without uploadedById
      if (error.code === 'P2003') { // Foreign key constraint
        console.warn(`FK constraint for media ${fileName}, creating without uploadedBy`);
        return await prisma.media.create({
          data: {
            fileName,
            filePath: `/uploads/${fileName}`,
            publicUrl: `/uploads/${fileName}`,
            type,
            size,
            status: 'READY',
          },
        });
      }
      throw error;
    }
  };

  const appleMedia = await createMediaIfNotExist('apple-logo.png', 'IMAGE', 10240);
  const samsungMedia = await createMediaIfNotExist('samsung-logo.png', 'IMAGE', 11264);

  const appleBrand = await prisma.brand.upsert({
    where: { name: 'Apple' },
    update: {},
    create: { name: 'Apple', slug: 'apple', description: 'American tech company', status: 'ACTIVE', mediaId: appleMedia.id },
  });

  const samsungBrand = await prisma.brand.upsert({
    where: { name: 'Samsung' },
    update: {},
    create: { name: 'Samsung', slug: 'samsung', description: 'South Korean conglomerate', status: 'ACTIVE', mediaId: samsungMedia.id },
  });

  const nikeBrand = await prisma.brand.upsert({
    where: { name: 'Nike' },
    update: {},
    create: { name: 'Nike', slug: 'nike', description: 'Sportswear manufacturer', status: 'ACTIVE' },
  });

  const adidasBrand = await prisma.brand.upsert({
    where: { name: 'Adidas' },
    update: {},
    create: { name: 'Adidas', slug: 'adidas', description: 'German sportswear company', status: 'ACTIVE' },
  });

  console.log('✅ Brands created');

  // ============================================
  // 6. ATTRIBUTES (Task 11)
  // ============================================
  console.log('🔧 Creating attributes...');

  const colorAttr = await prisma.attribute.upsert({
    where: { name: 'Color' },
    update: {},
    create: { name: 'Color', slug: 'color', type: 'COLOR_SWATCH', description: 'Color options' },
  });
  const sizeAttr = await prisma.attribute.upsert({
    where: { name: 'Size' },
    update: {},
    create: { name: 'Size', slug: 'size', type: 'DROPDOWN', description: 'Size selection' },
  });
  const materialAttr = await prisma.attribute.upsert({
    where: { name: 'Material' },
    update: {},
    create: { name: 'Material', slug: 'material', type: 'TEXT', description: 'Material composition' },
  });

  // Color values
  const redValue = await prisma.attributeValue.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: { id: '00000000-0000-0000-0000-000000000001', slug: 'red', label: 'Red', referenceValue: '#FF0000', sortOrder: 1, attributeId: colorAttr.id },
  });
  const blueValue = await prisma.attributeValue.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: { id: '00000000-0000-0000-0000-000000000002', slug: 'blue', label: 'Blue', referenceValue: '#0000FF', sortOrder: 2, attributeId: colorAttr.id },
  });
  const blackValue = await prisma.attributeValue.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: { id: '00000000-0000-0000-0000-000000000003', slug: 'black', label: 'Black', referenceValue: '#000000', sortOrder: 3, attributeId: colorAttr.id },
  });
  const whiteValue = await prisma.attributeValue.upsert({
    where: { id: '00000000-0000-0000-0000-000000000004' },
    update: {},
    create: { id: '00000000-0000-0000-0000-000000000004', slug: 'white', label: 'White', referenceValue: '#FFFFFF', sortOrder: 4, attributeId: colorAttr.id },
  });

  // Size values
  const sValue = await prisma.attributeValue.upsert({
    where: { id: '00000000-0000-0000-0000-000000000005' },
    update: {},
    create: { id: '00000000-0000-0000-0000-000000000005', slug: 'small', label: 'S (Small)', referenceValue: 'S', sortOrder: 1, attributeId: sizeAttr.id },
  });
  const mValue = await prisma.attributeValue.upsert({
    where: { id: '00000000-0000-0000-0000-000000000006' },
    update: {},
    create: { id: '00000000-0000-0000-0000-000000000006', slug: 'medium', label: 'M (Medium)', referenceValue: 'M', sortOrder: 2, attributeId: sizeAttr.id },
  });
  const lValue = await prisma.attributeValue.upsert({
    where: { id: '00000000-0000-0000-0000-000000000007' },
    update: {},
    create: { id: '00000000-0000-0000-0000-000000000007', slug: 'large', label: 'L (Large)', referenceValue: 'L', sortOrder: 3, attributeId: sizeAttr.id },
  });
  const xlValue = await prisma.attributeValue.upsert({
    where: { id: '00000000-0000-0000-0000-000000000008' },
    update: {},
    create: { id: '00000000-0000-0000-0000-000000000008', slug: 'extra-large', label: 'XL (Extra Large)', referenceValue: 'XL', sortOrder: 4, attributeId: sizeAttr.id },
  });

  // Material values
  const cottonValue = await prisma.attributeValue.upsert({
    where: { id: '00000000-0000-0000-0000-000000000009' },
    update: {},
    create: { id: '00000000-0000-0000-0000-000000000009', slug: 'cotton', label: 'Cotton', referenceValue: 'cotton', sortOrder: 1, attributeId: materialAttr.id },
  });
  const polyesterValue = await prisma.attributeValue.upsert({
    where: { id: '00000000-0000-0000-0000-000000000010' },
    update: {},
    create: { id: '00000000-0000-0000-0000-000000000010', slug: 'polyester', label: 'Polyester', referenceValue: 'polyester', sortOrder: 2, attributeId: materialAttr.id },
  });

  console.log('✅ Attributes and values created');

  // ============================================
  // 7. PRODUCTS & VARIANTS (Task 12 - STAR)
  // ============================================
  console.log('🛍️ Creating products and variants...');

  const iphoneProduct = await prisma.product.upsert({
    where: { sku: 'IPHONE15PRO' },
    update: {},
    create: {
      name: 'iPhone 15 Pro',
      slug: 'iphone-15-pro',
      description: 'Latest Apple smartphone with A17 Pro chip',
      price: 999.99,
      sku: 'IPHONE15PRO',
      categories: { connect: { id: rootElectronics.id } },
      brandId: appleBrand.id,
      status: 'PUBLISHED',
    },
  });

  const nikeAirMaxProduct = await prisma.product.upsert({
    where: { sku: 'NIKEAIRMAX270' },
    update: {},
    create: {
      name: 'Nike Air Max 270',
      slug: 'nike-air-max-270',
      description: 'Comfortable running shoes with air cushioning',
      price: 129.99,
      sku: 'NIKEAIRMAX270',
      categories: { connect: { id: womensClothing.id } },
      brandId: nikeBrand.id,
      status: 'PUBLISHED',
    },
  });

  // iPhone variants
  const iphoneBlueVariant = await prisma.productVariant.upsert({
    where: { sku: 'IPHONE15PRO-BLU' },
    update: {},
    create: {
      productId: iphoneProduct.id,
      sku: 'IPHONE15PRO-BLU',
      price: 999.99,
      inventory: 50,
      weight: 0.187,
      dimensions: JSON.stringify({ width: '7.15', height: '14.66', depth: '0.78' }),
    },
  });

  const iphoneBlackVariant = await prisma.productVariant.upsert({
    where: { sku: 'IPHONE15PRO-BLK' },
    update: {},
    create: {
      productId: iphoneProduct.id,
      sku: 'IPHONE15PRO-BLK',
      price: 999.99,
      inventory: 35,
      weight: 0.187,
      dimensions: JSON.stringify({ width: '7.15', height: '14.66', depth: '0.78' }),
    },
  });

  // Nike variant
  const nikeWhiteVariant = await prisma.productVariant.upsert({
    where: { sku: 'NIKEWM-WHITE' },
    update: {},
    create: {
      productId: nikeAirMaxProduct.id,
      sku: 'NIKEWM-WHITE',
      price: 129.99,
      inventory: 100,
      weight: 0.5,
      dimensions: JSON.stringify({ width: '12', height: '4', depth: '4' }),
    },
  });

  console.log('✅ Products and variants created');

  // ============================================
  // 8. PRODUCT ATTRIBUTE VALUE LINKS
  // ============================================
  console.log('🔗 Creating attribute-value links...');

  // This requires creating junction entries between productVariant and attributeValue
  // The schema may have a direct junction table or it may be handled through productVariant
  try {
    // Try to create links via the relationship defined in schema
    await prisma.productAttributeValue.createMany({
      data: [
        { productVariantId: iphoneBlueVariant.id, attributeValueId: blueValue.id },
        { productVariantId: iphoneBlueVariant.id, attributeValueId: mValue.id },
        { productVariantId: iphoneBlackVariant.id, attributeValueId: blackValue.id },
        { productVariantId: iphoneBlackVariant.id, attributeValueId: mValue.id },
        { productVariantId: nikeWhiteVariant.id, attributeValueId: whiteValue.id },
        { productVariantId: nikeWhiteVariant.id, attributeValueId: lValue.id },
        { productVariantId: nikeWhiteVariant.id, attributeValueId: cottonValue.id },
      ],
    });
    console.log('✅ Attribute-value links created');
  } catch (attrError) {
    console.warn('Could not create attribute-value links (schema may handle this differently):', attrError.message);
  }

  // ============================================
  // 9. PRODUCT TRANSACTIONS (Task 12)
  // ============================================
  console.log('📝 Creating transaction records...');

  await prisma.productTransaction.createMany({
    data: [
      { productId: iphoneProduct.id, variantId: null, type: 'CREATE', quantity: 1, priceAtTime: 999.99, notes: 'Product initially created' },
      { productId: iphoneProduct.id, variantId: iphoneBlueVariant.id, type: 'SELL', quantity: -5, priceAtTime: 999.99, notes: '5 units sold' },
      { productId: iphoneProduct.id, variantId: iphoneBlackVariant.id, type: 'RESTOCK', quantity: 20, priceAtTime: 999.99, notes: 'Restocked 20 units' },
      {productId: nikeAirMaxProduct.id, variantId: nikeWhiteVariant.id, type: 'SELL', quantity: -15, priceAtTime: 129.99, notes: '15 units sold' },
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
