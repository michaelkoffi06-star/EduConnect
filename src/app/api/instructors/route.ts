import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectSlug = searchParams.get('subject');

    // Requête réelle à la base de données
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
