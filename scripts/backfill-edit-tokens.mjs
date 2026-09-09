import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const instructors = await prisma.instructor.findMany({
  where: { editToken: null },
  select: { id: true, firstName: true, lastName: true },
});

console.log(`${instructors.length} instructeur(s) sans editToken.`);

for (const inst of instructors) {
  await prisma.instructor.update({
    where: { id: inst.id },
    data: { editToken: randomUUID() },
  });
  console.log('OK :', inst.firstName, inst.lastName);
}

await prisma.$disconnect();
console.log('Termine.');
