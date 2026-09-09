import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { rm } from 'fs/promises';
import path from 'path';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const toDelete = await prisma.instructor.findMany({
  where: { photoUrl: null },
  select: { id: true, firstName: true, lastName: true },
});

console.log(`${toDelete.length} instructeur(s) sans photo trouvé(s) :`);
toDelete.forEach((i) => console.log(`  - ${i.firstName} ${i.lastName} (${i.id})`));

if (toDelete.length === 0) {
  console.log('Rien à supprimer.');
  process.exit(0);
}

const ids = toDelete.map((i) => i.id);

await prisma.instructorSubject.deleteMany({ where: { instructorId: { in: ids } } });
const { count } = await prisma.instructor.deleteMany({ where: { id: { in: ids } } });
console.log(`✅ ${count} instructeur(s) supprimé(s) de la base.`);

// Par précaution, nettoie aussi d'éventuels dossiers privés résiduels (normalement vides ici)
for (const id of ids) {
  const dir = path.join(process.cwd(), 'private-uploads', 'instructors', id);
  await rm(dir, { recursive: true, force: true });
}

await prisma.$disconnect();
