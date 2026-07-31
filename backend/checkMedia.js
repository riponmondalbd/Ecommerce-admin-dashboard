const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const media = await prisma.media.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  });
  console.log(JSON.stringify(media, null, 2));
}

main().finally(() => prisma.$disconnect());
