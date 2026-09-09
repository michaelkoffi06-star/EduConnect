import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { InstructorType, AcademicLevel } from '@prisma/client';

// GET : récupère le profil correspondant au jeton secret (pour pré-remplir le formulaire)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const instructor = await prisma.instructor.findUnique({
    where: { editToken: token },
    include: { subjects: { include: { subject: true } } },
  });

  if (!instructor) {
    return NextResponse.json({ error: 'Lien invalide ou expiré.' }, { status: 404 });
  }

  return NextResponse.json(instructor, { status: 200 });
}

// PATCH : met à jour les infos texte du profil (pas les fichiers ici, voir route séparée si besoin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { firstName, lastName, whatsapp, bio, type, levels, subjects } = body;

    const existing = await prisma.instructor.findUnique({ where: { editToken: token } });
    if (!existing) {
      return NextResponse.json({ error: 'Lien invalide ou expiré.' }, { status: 404 });
    }

    if (!firstName || !lastName || !whatsapp || !bio || !bio.trim() || !Array.isArray(subjects) || subjects.length === 0) {
      return NextResponse.json({ error: 'Champs obligatoires manquants (dont la bio et au moins une matière).' }, { status: 400 });
    }

    const updated = await prisma.instructor.update({
      where: { editToken: token },
      data: {
        firstName,
        lastName,
        whatsapp,
        bio,
        type: type as InstructorType,
        levels: levels as AcademicLevel,
        // Statut repassé en attente : toute modification doit être re-validée par l'admin
        status: 'PENDING',
        subjects: {
          deleteMany: {},
          create: subjects.map((subjectId: string) => ({ subjectId })),
        },
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    console.error('Erreur modification profil instructeur :', error);
    return NextResponse.json({ error: 'Erreur serveur.', details: error.message }, { status: 500 });
  }
}
