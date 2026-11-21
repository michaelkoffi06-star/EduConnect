// Données passées par src/app/page.tsx (requêtes Prisma) aux sections de l'accueil (§7tervicies)

export interface HomeInstructor {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  subjects: { subject: { id: string; name: string } }[];
}

export interface HomeStats {
  approvedCount: number; // instructeurs approuvés
  subjectCount: number; // matières
  doneMatchesCount: number; // mises en relation terminées
}
