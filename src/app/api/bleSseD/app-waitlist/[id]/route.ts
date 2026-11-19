import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/admin-permissions';

// DELETE /api/bleSseD/app-waitlist/[id] — retire un contact (demande de suppression, erreur de saisie)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireRole(req, ['SUPER_ADMIN', 'ADMINISTRATIF']);
  if (denied) return denied;
  try {
    const { id } = await params;
    const { count } = await prisma.appWaitlistEntry.deleteMany({ where: { id } });
    if (count === 0) return NextResponse.json({ error: 'Contact introuvable.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Erreur API Admin suppression liste d’attente :', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
