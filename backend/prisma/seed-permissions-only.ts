import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Assigning permissions to roles...')

  // Get existing roles
  const roles = await prisma.role.findMany()
  const roleMap: Record<string, string> = {}
  for (const r of roles) {
    roleMap[r.name] = r.id
  }
  console.log('Found roles:', roleMap)

  // Get existing permissions
  const permissions = await prisma.permission.findMany()
  console.log('Found permissions:', permissions.length)

  // SUPER_ADMIN gets ALL permissions
  console.log('Assigning all permissions to SUPER_ADMIN...')
  for (const perm of permissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roleMap.SUPER_ADMIN, permissionId: perm.id } },
      create: { roleId: roleMap.SUPER_ADMIN, permissionId: perm.id },
      update: {},
    })
  }

  // ADMIN - management permissions plus product/content access
  const adminPerms = permissions.filter((p) =>
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
      where: { roleId_permissionId: { roleId: roleMap.ADMIN, permissionId: perm.id } },
      create: { roleId: roleMap.ADMIN, permissionId: perm.id },
      update: {},
    })
  }

  // CATALOG_MANAGER - product/category/brand/attribute/media related only
  const catalogPerms = permissions.filter((p) =>
    p.key.startsWith('product:') ||
    p.key.startsWith('category:') ||
    p.key.startsWith('brand:') ||
    p.key.startsWith('attribute:') ||
    p.key.startsWith('media:')
  )
  for (const perm of catalogPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roleMap.CATALOG_MANAGER, permissionId: perm.id } },
      create: { roleId: roleMap.CATALOG_MANAGER, permissionId: perm.id },
      update: {},
    })
  }

  // SUPPORT_AGENT - limited content view and create
  const supportPerms = permissions.filter((p) =>
    p.key === 'product:watch' || p.key === 'product:read' || p.key === 'product:create' ||
    p.key === 'category:watch' || p.key === 'category:read' ||
    p.key.startsWith('brand:') ||
    p.key.startsWith('attribute:') ||
    p.key.startsWith('media:') ||
    p.key === 'dashboard:watch'
  )
  for (const perm of supportPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roleMap.SUPPORT_AGENT, permissionId: perm.id } },
      create: { roleId: roleMap.SUPPORT_AGENT, permissionId: perm.id },
      update: {},
    })
  }

  // VIEWER - read-only permissions across all modules
  const viewerPerms = permissions.filter((p) => p.key.endsWith(':watch') || p.key.endsWith(':read'))
  for (const perm of viewerPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roleMap.VIEWER, permissionId: perm.id } },
      create: { roleId: roleMap.VIEWER, permissionId: perm.id },
      update: {},
    })
  }
  console.log('Role-permission assignments complete')
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