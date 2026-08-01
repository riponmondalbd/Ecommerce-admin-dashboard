import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fixing permissions for CATALOG_MANAGER role...');

  // Get the CATALOG_MANAGER role
  const catalogManagerRole = await prisma.role.findUnique({
    where: { name: 'CATALOG_MANAGER' },
  });

  if (!catalogManagerRole) {
    console.error('CATALOG_MANAGER role not found!');
    return;
  }

  console.log(`Found CATALOG_MANAGER role: ${catalogManagerRole.name} (ID: ${catalogManagerRole.id})`);

  // Get all user management permissions
  const userPermissions = await prisma.permission.findMany({
    where: {
      key: { in: ['user:read', 'user:update', 'user:create', 'user:watch', 'user:delete'] },
    },
  });

  console.log('User permissions to assign:', userPermissions.map(p => p.key));

  // Assign each user permission to CATALOG_MANAGER role
  for (const perm of userPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: catalogManagerRole.id, permissionId: perm.id } },
      create: {
        roleId: catalogManagerRole.id,
        permissionId: perm.id,
      },
      update: {},
    });
    console.log(`Assigned ${perm.key} to CATALOG_MANAGER role`);
  }

  // Also check if ADMIN role has user permissions (it should per seed)
  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  if (adminRole) {
    const adminPerms = await prisma.permission.findMany({
      where: { key: { in: ['user:read', 'user:update', 'user:create'] } },
    });
    console.log(`ADMIN role has ${adminPerms.length} user permissions`);
  }

  // Now assign a user (the admin user) to ADMIN role if needed
  const adminUser = await prisma.user.findFirst({
    where: { email: { endsWith: '@trendsbird.com' } },
    include: { role: true },
  });

  if (adminUser && adminUser.role.name !== 'ADMIN') {
    console.log(`Updating user ${adminUser.email} to ADMIN role...`);
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { roleId: adminRole?.id || adminUser.roleId },
    });
    console.log('User role updated to ADMIN');
  }

  console.log('Permissions fix complete!');
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
