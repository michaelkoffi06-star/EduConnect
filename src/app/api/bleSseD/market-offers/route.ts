export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/admin-permissions';
import { offerAdminInclude, parseOfferInput } from '@/lib/market';

// Annonces du marché des instructeurs (voir §7quindecies) — gérées par SUPER_ADMIN et ADMINISTRATIF,
// l'équipe qui traite déjà les demandes des familles.

// GET /api/bleSseD/market-offers — toutes les annonces, avec les instructeurs intéressés
export async function GET(req: NextRequest) {
  const denied = requireRole(req, ['SUPER_ADMIN', 'ADMINISTRATIF']);
  if (denied) return denied;
  try {
    const offers = await prisma.marketOffer.findMany({ include: offerAdminInclude, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(offers);
  } catch (error: any) {
    console.error('Erreur API Admin Marché (GET):', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
  }
}

// POST /api/bleSseD/market-offers — publication d'une annonce
export async function POST(req: NextRequest) {
  const denied = requireRole(req, ['SUPER_ADMIN', 'ADMINISTRATIF']);
  if (denied) return denied;
  try {
    const parsed = parseOfferInput(await req.json().catch(() => ({})), false);
    if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const offer = await prisma.marketOffer.create({ data: parsed.data, include: offerAdminInclude });
    return NextResponse.json(offer, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2003') return NextResponse.json({ error: 'Matière introuvable.' }, { status: 400 });
    console.error('Erreur API Admin Marché (POST):', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
  }
}
