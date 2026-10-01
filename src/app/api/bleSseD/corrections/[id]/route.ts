import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BUCKET_PRIVATE, correctionKey, deleteFromR2, getPresignedReadUrl } from '@/lib/r2';
import { requireRole } from '@/lib/admin-permissions';

// GET /api/bleSseD/corrections/[id] — aperçu du corrigé par l'équipe (redirige vers une URL signée)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireRole(req, ['SUPER_ADMIN', 'PEDAGOGIE', 'ADMINISTRATIF']);
  if (denied) return denied;
  const { id } = await params;
  const correction = await prisma.correction.findUnique({ where: { id }, select: { id: true, fileExt: true } });
  if (!correction) {
    return NextResponse.json({ error: 'Corrigé introuvable.' }, { status: 404 });
  }
  const url = await getPresignedReadUrl(BUCKET_PRIVATE, correctionKey(correction.id, correction.fileExt));
  return NextResponse.redirect(url, 302);
}

// DELETE /api/bleSseD/corrections/[id] — retire le corrigé (fichier R2 compris)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireRole(req, ['SUPER_ADMIN', 'PEDAGOGIE']);
  if (denied) return denied;
  try {
    const { id } = await params;
    const correction = await prisma.correction.findUnique({ where: { id }, select: { id: true, fileExt: true } });
    if (!correction) {
      return NextResponse.json({ error: 'Corrigé introuvable.' }, { status: 404 });
    }
    await deleteFromR2(BUCKET_PRIVATE, correctionKey(correction.id, correction.fileExt));
    await prisma.correction.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur API Admin Corrigés (DELETE):', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
