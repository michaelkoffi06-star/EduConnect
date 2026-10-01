import { NextRequest, NextResponse } from 'next/server';
import type { MarketInterestStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/admin-permissions';
import { siteOrigin } from '@/lib/site';
import { sendMarketSelectedEmail } from '@/lib/user-emails';

const STATUSES: MarketInterestStatus[] = ['PENDING', 'SELECTED', 'DECLINED'];

// PATCH /api/bleSseD/market-interests/[id] — l'équipe retient ou écarte un instructeur
// positionné sur une annonce. Email envoyé à l'instructeur quand il est retenu.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireRole(req, ['SUPER_ADMIN', 'ADMINISTRATIF']);
  if (denied) return denied;
  try {
    const { id } = await params;
    const { status } = await req.json().catch(() => ({}));
    if (!STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Statut invalide.' }, { status: 400 });
    }

    const previous = await prisma.marketInterest.findUnique({ where: { id }, select: { status: true } });
    if (!previous) return NextResponse.json({ error: 'Candidature introuvable.' }, { status: 404 });

    const interest = await prisma.marketInterest.update({
      where: { id },
      data: { status },
      include: {
        offer: { select: { title: true } },
        instructor: {
          select: {
            id: true, firstName: true, lastName: true, email: true, whatsapp: true, status: true, commune: true,
            user: { select: { email: true } },
          },
        },
      },
    });

    if (status === 'SELECTED' && previous.status !== 'SELECTED') {
      await sendMarketSelectedEmail(
        interest.instructor.user?.email || interest.instructor.email,
        interest.instructor.firstName,
        interest.offer.title,
        `${siteOrigin(req)}/espace-instructeur`
      );
    }

    return NextResponse.json({ ...interest, instructor: { ...interest.instructor, user: undefined }, offer: undefined });
  } catch (error: any) {
    console.error('Erreur API Admin Marché (candidature):', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
