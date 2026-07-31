const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.brand.findMany({ include: { media: true } })
  .then(b => { console.log(JSON.stringify(b, null, 2)); prisma.$disconnect(); });
