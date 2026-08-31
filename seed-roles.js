const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const staffPassword = await bcrypt.hash('staff123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@sapa.id' },
    update: { role: 'ADMIN', passwordHash: adminPassword },
    create: {
      name: 'Admin BWS',
      email: 'admin@sapa.id',
      phone: '0811000000',
      passwordHash: adminPassword,
      role: 'ADMIN'
    }
  });

  await prisma.user.upsert({
    where: { email: 'staff@sapa.id' },
    update: { role: 'STAFF', passwordHash: staffPassword },
    create: {
      name: 'Staff TU',
      email: 'staff@sapa.id',
      phone: '0812000000',
      passwordHash: staffPassword,
      role: 'STAFF'
    }
  });

  console.log('Seeded admin & staff');
}

main().catch(console.error).finally(() => prisma.$disconnect());
