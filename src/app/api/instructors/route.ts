import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectSlug = searchParams.get('subject');
    const level = searchParams.get('level'); // 'PRIMAIRE' | 'COLLEGE' | 'LYCEE' | null
    const mode = searchParams.get('mode'); // 'DOMICILE' | 'EN_LIGNE' | null
    const city = searchParams.get('city');
    const commune = searchParams.get('commune');

    const instructors = await prisma.instructor.findMany({
      where: {
        status: 'APPROVED',
        // Si un paramètre 'subject' est fourni, on filtre par slug
        ...(subjectSlug && {
          subjects: {
            some: {
              subject: { slug: subjectSlug.toLowerCase() }
            }
          }
        }),
        // Un instructeur en 'ALL' correspond aux deux niveaux ; sinon filtrage strict
        ...((level === 'PRIMAIRE' || level === 'COLLEGE' || level === 'LYCEE') && {
          levels: { in: [level, 'ALL'] }
        }),
        // Un instructeur en 'LES_DEUX' correspond aux deux modes ; sinon filtrage strict
        ...((mode === 'DOMICILE' || mode === 'EN_LIGNE') && {
          mode: { in: [mode, 'LES_DEUX'] }
        }),
        ...(city && {
          city: { equals: city, mode: 'insensitive' }
        }),
        ...(commune && {
          commune: { equals: commune, mode: 'insensitive' }
        })
      },
      // Sélection explicite : route publique, jamais cniUrl/cvUrl/email/whatsapp
      select: {
        id: true,
        firstName: true,
        lastName: true,
        bio: true,
        type: true,
        status: true,
        levels: true,
        mode: true,
        city: true,
        commune: true,
        photoUrl: true,
        rating: true,
        ratingCount: true,
        createdAt: true,
        subjects: {
          include: { subject: true }
        }
      },
      orderBy: { lastName: 'asc' }
    });

    return NextResponse.json(instructors, { status: 200 });

  } catch (error: any) {
    console.error("Erreur API Instructors (DB Mode):", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: error.message },
      { status: 500 }
    );
  }
}
