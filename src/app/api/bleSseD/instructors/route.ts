export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/admin-permissions';

// GET /api/bleSseD/instructors
// Récupère TOUS les instructeurs (peu importe leur statut), pour la page Admin.
// Jamais le lien secret de modification (editToken) : il permettrait de modifier la fiche
// depuis /modifier-profil. ADMINISTRATIF ne reçoit pas non plus les références CNI/CV.
export async function GET(request: NextRequest) {
  const denied = await requireRole(request, ['SUPER_ADMIN', 'PEDAGOGIE', 'ADMINISTRATIF']);
  if (denied) return denied;
  try {
    const isAdministratif = request.headers.get('x-admin-role') === 'ADMINISTRATIF';
    const instructors = await prisma.instructor.findMany({
      omit: { editToken: true, cniUrl: isAdministratif, cvUrl: isAdministratif },
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
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
