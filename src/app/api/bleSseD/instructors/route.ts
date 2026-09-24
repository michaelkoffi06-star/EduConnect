export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/admin-permissions';

// GET /api/bleSseD/instructors
// Récupère TOUS les instructeurs (peu importe leur statut), pour la page Admin
export async function GET(request: NextRequest) {
  const denied = requireRole(request, ['SUPER_ADMIN', 'PEDAGOGIE', 'ADMINISTRATIF']);
  if (denied) return denied;
  try {
    const instructors = await prisma.instructor.findMany({
      include: {
        subjects: {
          include: { subject: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(instructors, { status: 200 });

  } catch (error: any) {
    console.error("Erreur API Admin Instructors (GET):", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: error.message },
      { status: 500 }
    );
  }
}
