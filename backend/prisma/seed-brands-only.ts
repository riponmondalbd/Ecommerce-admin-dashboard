import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding brands only...')

  // Create sample brands
  console.log('Creating sample brands...')
  const brandData = [
    { name: 'Apple', slug: 'apple', status: 'ACTIVE' as const, description: 'Premium electronics and accessories' },
    { name: 'Samsung', slug: 'samsung', status: 'ACTIVE' as const, description: 'Leading electronics manufacturer' },
    { name: 'Nike', slug: 'nike', status: 'ACTIVE' as const, description: 'Athletic footwear and apparel' },
    { name: 'Adidas', slug: 'adidas', status: 'ACTIVE' as const, description: 'Sports clothing and accessories' },
    { name: 'Sony', slug: 'sony', status: 'ACTIVE' as const, description: 'Consumer electronics and entertainment' },
  ]

  for (const b of brandData) {
    const brand = await prisma.brand.upsert({
      where: { slug: b.slug },
      create: b,
      update: {},
    })
    console.log('Created brand: ' + b.name + ' (id: ' + brand.id + ')')
  }

  console.log('Seeding brands completed!')
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