const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if media:create exists
    let permission = await prisma.permission.findUnique({
      where: { key: 'media:create' },
    });

    if (!permission) {
      console.log('Creating media:create permission...');
      permission = await prisma.permission.create({
        data: {
          key: 'media:create',
          name: 'Create Media',
          description: 'Upload media files',
          group: 'MEDIA'
        }
      });
    }

    // Get all roles
    const roles = await prisma.role.findMany();
    
    // Assign to roles (like ADMIN, SUPERADMIN)
    for (const role of roles) {
      if (role.name === 'ADMIN' || role.name === 'SUPER_ADMIN' || role.name === 'SUPERADMIN' || role.name.includes('admin') || role.name === 'SUPER_ADMINISTRATOR') {
        // check if already has it
        const hasPerm = await prisma.rolePermission.findFirst({
          where: { roleId: role.id, permissionId: permission.id }
        });
        
        if (!hasPerm) {
          await prisma.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: permission.id
            }
          });
          console.log(`Assigned media:create to role ${role.name}`);
        } else {
          console.log(`Role ${role.name} already has media:create`);
        }
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
