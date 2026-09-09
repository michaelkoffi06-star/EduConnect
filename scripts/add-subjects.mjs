import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const subjects = [
  { name: 'Philosophie', slug: 'philosophie' },
  { name: 'Économie', slug: 'economie' },
  { name: 'Portugais', slug: 'portugais' },
  { name: 'Informatique', slug: 'informatique' },
  { name: 'Français', slug: 'francais' },
];

for (const s of subjects) {
  const result = await prisma.subject.upsert({
    where: { slug: s.slug },
    update: { name: s.name },
    create: s,
  });
  console.log('OK :', result.name, '(' + result.slug + ')');
}

await prisma.$disconnect();
console.log('Termine.');
