const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const p = new PrismaClient();

async function main() {
  const user = await p.user.findFirst({
    where: { email: 'admin@trendsbird.com' },
    select: { email: true, status: true, id: true, password: true }
  });
  console.log('User found:', user ? { email: user.email, status: user.status, id: user.id } : null);
  if (user) {
    const valid = await bcrypt.compare('Admin@123', user.password);
    console.log('Password valid:', valid);
  }
}

main().finally(() => p.$disconnect());
