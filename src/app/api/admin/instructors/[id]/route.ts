import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const VALID_STATUSES = ['PENDING', 'APPROVED', 'SUSPENDED'];

// PATCH /api/admin/instructors/[id]
// Body attendu : { "status": "APPROVED" }
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Statut invalide. Valeurs acceptées : ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const updatedInstructor = await prisma.instructor.update({
      where: { id },
      data: { status },
      include: {
        subjects: {
          include: { subject: true }
        }
      }
    });

    return NextResponse.json(updatedInstructor, { status: 200 });

  } catch (error: any) {
    console.error("Erreur API Admin Instructors (PATCH):", error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Instructeur introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Erreur serveur", details: error.message },
      { status: 500 }
    );
  }
}
