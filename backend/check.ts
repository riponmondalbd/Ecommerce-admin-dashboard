import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const brands = await prisma.brand.findMany();
  console.log("BRANDS:");
  console.log(JSON.stringify(brands, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
