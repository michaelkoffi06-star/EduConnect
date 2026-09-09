import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { readdir, rm } from 'fs/promises';
import path from 'path';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const oldInstructors = await prisma.instructor.findMany({
  where: { NOT: { photoUrl: { startsWith: 'http' } } },
  select: { id: true, firstName: true, lastName: true, photoUrl: true },
});

console.log(`${oldInstructors.length} ancien(s) instructeur(s) trouvé(s) (fichiers locaux) :`);
oldInstructors.forEach((i) => console.log(`  - ${i.firstName} ${i.lastName} (${i.id})`));

if (oldInstructors.length === 0) {
  console.log('Rien à supprimer.');
  process.exit(0);
}

const ids = oldInstructors.map((i) => i.id);

// 1. Supprime les liaisons matières (contrainte de clé étrangère)
await prisma.instructorSubject.deleteMany({ where: { instructorId: { in: ids } } });

// 2. Supprime les instructeurs en base
const { count } = await prisma.instructor.deleteMany({ where: { id: { in: ids } } });
console.log(`✅ ${count} instructeur(s) supprimé(s) de la base.`);

// 3. Supprime les fichiers locaux (photo + dossier privé CNI/CV)
const photosDir = path.join(process.cwd(), 'public', 'uploads', 'photos');
let deletedFiles = 0;

try {
  const files = await readdir(photosDir);
  for (const id of ids) {
    const match = files.find((f) => f.startsWith(id + '.'));
    if (match) {
      await rm(path.join(photosDir, match));
      deletedFiles++;
    }
  }
} catch {
  console.log('Dossier photos local introuvable, ignoré.');
}

for (const id of ids) {
  const dir = path.join(process.cwd(), 'private-uploads', 'instructors', id);
  await rm(dir, { recursive: true, force: true });
}

console.log(`✅ ${deletedFiles} photo(s) locale(s) supprimée(s), dossiers CNI/CV nettoyés.`);
await prisma.$disconnect();
