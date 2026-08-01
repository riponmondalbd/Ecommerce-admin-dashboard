import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding users only...')

  // Get existing roles
  const roles = await prisma.role.findMany()
  const roleMap: Record<string, string> = {}
  for (const r of roles) {
    roleMap[r.name] = r.id
  }
  console.log('Found roles:', Object.keys(roleMap))

  // Create Super Admin User
  console.log('Creating initial super admin user...')
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123'
  const hashedPassword = await bcrypt.hash(adminPassword, 10)

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@trendsbird.com' },
    create: {
      name: 'Super Admin',
      email: 'admin@trendsbird.com',
      password: hashedPassword,
      roleId: roleMap.SUPER_ADMIN,
      status: 'ACTIVE',
    },
    update: {},
  })
  console.log('Super Admin created: ' + superAdmin.email)
  console.log('Credentials:')
  console.log('  Email: admin@trendsbird.com')
  console.log('  Password: ' + adminPassword)

  // Create Catalog Manager User (for testing)
  console.log('Creating catalog manager user...')
  const catalogUser = await prisma.user.upsert({
    where: { email: 'catalog@trendsbird.com' },
    create: {
      name: 'Catalog Manager',
      email: 'catalog@trendsbird.com',
      password: await bcrypt.hash('Catalog@123', 10),
      roleId: roleMap.CATALOG_MANAGER,
      status: 'ACTIVE',
    },
    update: {},
  })
  console.log('Catalog Manager created: ' + catalogUser.email)

  console.log('User seeding completed!')
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