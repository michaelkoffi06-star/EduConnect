import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/admin-permissions';
import { offerAdminInclude, parseOfferInput } from '@/lib/market';

// PATCH /api/bleSseD/market-offers/[id] — modifier une annonce ou changer son statut
// (OPEN : visible par les instructeurs ; FILLED : pourvue ; CLOSED : retirée)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = requireRole(req, ['SUPER_ADMIN', 'ADMINISTRATIF']);
  if (denied) return denied;
  try {
    const { id } = await params;
    const parsed = parseOfferInput(await req.json().catch(() => ({})), true);
    if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const offer = await prisma.marketOffer.update({ where: { id }, data: parsed.data, include: offerAdminInclude });
    return NextResponse.json(offer);
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'Annonce introuvable.' }, { status: 404 });
    console.error('Erreur API Admin Marché (PATCH):', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
  }
}

// DELETE /api/bleSseD/market-offers/[id] — supprime l'annonce et les candidatures associées
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = requireRole(req, ['SUPER_ADMIN', 'ADMINISTRATIF']);
  if (denied) return denied;
  try {
    const { id } = await params;
    await prisma.marketOffer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'Annonce introuvable.' }, { status: 404 });
    console.error('Erreur API Admin Marché (DELETE):', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
  }
}
