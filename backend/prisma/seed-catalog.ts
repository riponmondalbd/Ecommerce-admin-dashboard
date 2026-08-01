import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding catalog data...')

  // Get brands
  const brands = await prisma.brand.findMany()
  const brandMap: Record<string, string> = {}
  for (const b of brands) {
    brandMap[b.slug] = b.id
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
      stockStatus: 'IN_STOCK',
      sku: 'APL-IP15P-128',
      status: 'PUBLISHED',
      isActive: true,
      isFeatured: true,
      sortOrder: 1,
      brandId: brandMap.apple,
      categoryIds: [smartphones.id],
    },
    {
      name: 'Samsung Galaxy S24 Ultra',
      slug: 'samsung-galaxy-s24-ultra',
      shortDescription: 'Premium Android smartphone with S Pen',
      description: 'The Galaxy S24 Ultra features a 200MP camera, built-in S Pen, and Galaxy AI.',
      price: 1299.99,
      stock: 30,
      stockStatus: 'IN_STOCK',
      sku: 'SAM-S24U-256',
      status: 'PUBLISHED',
      isActive: true,
      isFeatured: true,
      sortOrder: 2,
      brandId: brandMap.samsung,
      categoryIds: [smartphones.id],
    },
    {
      name: 'MacBook Air M3',
      slug: 'macbook-air-m3',
      shortDescription: 'Lightweight laptop with M3 chip',
      description: 'The MacBook Air with M3 chip delivers incredible performance and up to 18 hours of battery life.',
      price: 1099.99,
      stock: 25,
      stockStatus: 'IN_STOCK',
      sku: 'APL-MBA-M3-13',
      status: 'PUBLISHED',
      isActive: true,
      isFeatured: false,
      sortOrder: 3,
      brandId: brandMap.apple,
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
      stockStatus: 'IN_STOCK',
      sku: 'NIK-AM270-10',
      status: 'PUBLISHED',
      isActive: true,
      isFeatured: true,
      sortOrder: 4,
      brandId: brandMap.nike,
      categoryIds: [footwear.id],
    },
    {
      name: 'Adidas Ultraboost 22',
      slug: 'adidas-ultraboost-22',
      shortDescription: 'Premium running shoes',
      description: 'The Ultraboost 22 returns incredible energy with every stride.',
      price: 190.00,
      stock: 75,
      stockStatus: 'IN_STOCK',
      sku: 'ADI-UB22-10',
      status: 'PUBLISHED',
      isActive: true,
      isFeatured: false,
      sortOrder: 5,
      brandId: brandMap.adidas,
      categoryIds: [footwear.id],
    },
  ]

  for (const p of products) {
    const { categoryIds, brandId, ...productData } = p
    await prisma.product.upsert({
      where: { sku: p.sku },
      create: {
        ...productData,
        brand: { connect: { id: brandId } },
        categories: { connect: categoryIds.map(id => ({ id })) },
      },
      update: {},
    })
    console.log('Created product: ' + p.name)
  }

  console.log('Catalog data seeding completed!')
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