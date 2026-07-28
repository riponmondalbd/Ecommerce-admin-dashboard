const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Running minimal seed for auth testing...');
  const saltRounds = 10;

  // Create permissions (only essentials)
  const permissions = [
    'product:read', 'product:create', 'dashboard:read', 'media:read', 'category:read', 'brand:read'
  ];

  for (const key of permissions) {
    const group = key.split(':')[0].toUpperCase();
    const action = key.split(':')[1];
    const name = `${group} ${action}`;
    try {
      await prisma.permission.upsert({
        where: { key },
        update: {},
        create: { key, name, group, isActive: true },
      });
    } catch (e) {
      // Already exists
    }
  }
  console.log(`✅ Created/confirmed ${permissions.length} permissions`);

  // Or get existing permissions
  const permMap = {};
  for (const key of permissions) {
    const p = await prisma.permission.findUnique({ where: { key } });
    if (p) permMap[key] = p.id;
  }

  // Create roles
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: { name: 'SUPER_ADMIN', isSystem: true, isActive: true },
  });
  console.log('✅ SUPER_ADMIN role ready');

  const catalogManagerRole = await prisma.role.upsert({
    where: { name: 'CATALOG_MANAGER' },
    update: {},
    create: { name: 'CATALOG_MANAGER', isSystem: false, isActive: true },
  });
  console.log('✅ CATALOG_MANAGER role ready');

  // Assign permissions to roles
  const assignPerm = async (roleId, permKeys) => {
    for (const pk of permKeys) {
      if (permMap[pk]) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId, permissionId: permMap[pk] } },
          update: {},
          create: { roleId, permissionId: permMap[pk] },
        });
      }
    }
  };

  // Give SUPER_ADMIN product:read and dashboard:read
  await assignPerm(superAdminRole.id, ['product:read', 'dashboard:read']);
  console.log('✅ Permissions assigned to SUPER_ADMIN');

  // Give CATALOG_MANAGER product:read
  await assignPerm(catalogManagerRole.id, ['product:read']);
  console.log('✅ Permissions assigned to CATALOG_MANAGER');

  // Create users
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminHashed = await bcrypt.hash(adminPassword, saltRounds);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@trends-bird.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@trends-bird.com',
      password: adminHashed,
      roleId: superAdminRole.id,
      status: 'ACTIVE',
    },
  });
  console.log('✅ Admin user created/updated:', adminUser.email);

  const catalogHash = await bcrypt.hash('catalog123', saltRounds);
  const catalogUser = await prisma.user.upsert({
    where: { email: 'catalog@trends-bird.com' },
    update: {},
    create: {
      name: 'Catalog Manager',
      email: 'catalog@trends-bird.com',
      password: catalogHash,
      roleId: catalogManagerRole.id,
      status: 'ACTIVE',
    },
  });
  console.log('✅ Catalog user created/updated:', catalogUser.email);

  console.log('\n🎉 Minimal seed completed successfully!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
