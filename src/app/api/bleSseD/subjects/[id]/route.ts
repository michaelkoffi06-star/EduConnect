import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/admin-permissions';
import { HEX_COLOR } from '@/lib/library';

// PATCH /api/bleSseD/subjects/[id] — couleur d'une matière sur l'étagère de la bibliothèque.
// { color: "#8FB3AB" } pour la définir, { color: null } pour revenir à la couleur automatique.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = requireRole(request, ['SUPER_ADMIN', 'PEDAGOGIE']);
  if (denied) return denied;
  try {
    const { id } = await params;
    const { color } = await request.json();

    if (color !== null && (typeof color !== 'string' || !HEX_COLOR.test(color))) {
      return NextResponse.json({ error: 'Couleur invalide (format attendu : #RRGGBB).' }, { status: 400 });
    }

    const subject = await prisma.subject.update({
      where: { id },
      data: { color: color ? color.toUpperCase() : null },
    });
    return NextResponse.json(subject, { status: 200 });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Matière introuvable.' }, { status: 404 });
    }
    console.error('Erreur API Admin Subjects (PATCH):', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
  }
}
