import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Checking permissions...')

  // Get roles
  const roles = await prisma.role.findMany()
  console.log('Roles:', roles.map(r => ({ id: r.id, name: r.name })))

  // Get role permissions
  const rolePerms = await prisma.rolePermission.findMany({
    include: {
      role: true,
      permission: true
    }
  })

  console.log('\nRole Permissions:')
  for (const rp of rolePerms) {
    console.log(`  ${rp.role.name} -> ${rp.permission.key} (${rp.permission.group})`)
  }

  // Check specific media permissions
  const mediaPerms = rolePerms.filter(rp => rp.permission.key.startsWith('media:'))
  console.log('\nMedia Permissions by Role:')
  for (const rp of mediaPerms) {
    console.log(`  ${rp.role.name} -> ${rp.permission.key}`)
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Error:', e)
    await prisma.$disconnect()
    process.exit(1)
  })