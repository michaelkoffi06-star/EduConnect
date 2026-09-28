// Donne un slug (URL lisible /bibliotheque/<slug>) aux ressources créées avant la bibliothèque v2.
// À lancer une fois après `npx prisma db push` :
//   node --env-file=.env scripts/backfill-resource-slugs.mjs
// Même logique que resourceSlug() dans src/lib/library.ts.
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function slugify(input) {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

const resources = await prisma.resource.findMany({
  where: { slug: null },
  select: { id: true, title: true },
});

console.log(`${resources.length} ressource(s) sans slug.`);

for (const r of resources) {
  const slug = `${slugify(r.title) || 'ressource'}-${r.id.replace(/-/g, '').slice(0, 6)}`;
  await prisma.resource.update({ where: { id: r.id }, data: { slug } });
  console.log('OK :', slug);
}

await prisma.$disconnect();
console.log('Termine.');
