import { Client } from 'pg'
import dotenv from 'dotenv'
import { randomUUID } from 'crypto'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://tutor_user:@localhost:5433/tutoring_db?schema=public"

async function runDirectSeed() {
  const client = new Client({ connectionString })
  
  try {
    await client.connect()
    console.log('🔌 Connecté directement à PostgreSQL...')

    // 1. Nettoyage complet
    await client.query('TRUNCATE TABLE "InstructorSubject", "Instructor", "Subject" RESTART IDENTITY CASCADE;')
    console.log('🧹 Base de données nettoyée.')

    // 2. IDs matières
    const mathsId       = randomUUID()
    const physiqueId    = randomUUID()
    const anglaisId     = randomUUID()
    const histoireGeoId = randomUUID()
    const svtId         = randomUUID()
    const allemandId    = randomUUID()
    const espagnolId    = randomUUID()
    const francaisId    = randomUUID()
    const philosophieId = randomUUID()
    const economieId    = randomUUID()
    const portugaisId   = randomUUID()
    const informatiqueId = randomUUID()

    // 3. Insertion des 12 matières
    const subjects = [
      { id: mathsId,        name: 'Mathématiques',      slug: 'maths' },
      { id: physiqueId,     name: 'Physique-Chimie',     slug: 'physique-chimie' },
      { id: anglaisId,      name: 'Anglais',             slug: 'anglais' },
      { id: histoireGeoId,  name: 'Histoire-Géographie', slug: 'histoire-geo' },
      { id: svtId,          name: 'SVT',                 slug: 'svt' },
      { id: allemandId,     name: 'Allemand',            slug: 'allemand' },
      { id: espagnolId,     name: 'Espagnol',            slug: 'espagnol' },
      { id: francaisId,     name: 'Français',            slug: 'francais' },
      { id: philosophieId,  name: 'Philosophie',         slug: 'philosophie' },
      { id: economieId,     name: 'Économie',            slug: 'economie' },
      { id: portugaisId,    name: 'Portugais',           slug: 'portugais' },
      { id: informatiqueId, name: 'Informatique',        slug: 'informatique' },
    ]

    for (const sub of subjects) {
      await client.query(
        `INSERT INTO "Subject" (id, name, slug) VALUES ($1, $2, $3);`,
        [sub.id, sub.name, sub.slug]
      )
    }
    console.log('📚 12 matières insérées.')

    // 4. Instructeurs de démonstration
    const prof1Id = randomUUID()
    const prof2Id = randomUUID()

    await client.query(`
      INSERT INTO "Instructor" (id, "firstName", "lastName", type, status, levels, bio, email, whatsapp, "createdAt", "updatedAt")
      VALUES ($1, 'Marc', 'Dubois', 'PROF_LYCEE', 'APPROVED', 'LYCEE',
        'Enseignant certifié, expert en Histoire et Maths.', 'marc.dubois@mail.com', '33612345678', NOW(), NOW());
    `, [prof1Id])

    await client.query(`
      INSERT INTO "Instructor" (id, "firstName", "lastName", type, status, levels, bio, email, whatsapp, "createdAt", "updatedAt")
      VALUES ($1, 'Amina', 'Koné', 'ETUDIANT', 'PENDING', 'ALL',
        'Passionnée par les langues et la SVT.', 'amina.kone@mail.com', '22507070707', NOW(), NOW());
    `, [prof2Id])

    console.log('👨‍🏫 2 instructeurs de démo insérés.')

    // 5. Liaisons instructeurs <-> matières
    await client.query(`
      INSERT INTO "InstructorSubject" ("instructorId", "subjectId") VALUES
      ($1, $2), ($1, $3), ($4, $5), ($4, $6);
    `, [prof1Id, mathsId, histoireGeoId, prof2Id, svtId, espagnolId])

    console.log('🔗 Liaisons créées.')
    console.log('✅ Base de données initialisée avec succès !')

  } catch (error) {
    console.error('❌ Erreur durant le seed :', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

runDirectSeed()
