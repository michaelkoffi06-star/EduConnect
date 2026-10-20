import { NextRequest, NextResponse } from 'next/server';
import type { EnglishSubscriptionStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/admin-permissions';

const STATUSES: EnglishSubscriptionStatus[] = ['PENDING_PAYMENT', 'PAYMENT_DECLARED', 'ACTIVE', 'EXPIRED', 'CANCELLED'];

// GET /api/bleSseD/english-subscriptions?status=PAYMENT_DECLARED&q=… — abonnements d'anglais
// technique pour l'équipe (§7novodecies). Sans statut : tous. q cherche dans la référence,
// l'email, le nom et l'identifiant de transaction. Compteurs par statut pour les onglets.
export async function GET(req: NextRequest) {
  const denied = await requireRole(req, ['SUPER_ADMIN', 'ADMINISTRATIF']);
  if (denied) return denied;
  try {
    const status = req.nextUrl.searchParams.get('status') as EnglishSubscriptionStatus | null;
    const q = (req.nextUrl.searchParams.get('q') || '').trim().slice(0, 80);
    const where = {
      ...(status && STATUSES.includes(status) ? { status } : {}),
      ...(q
        ? {
            OR: [
              { reference: { contains: q, mode: 'insensitive' as const } },
              { transactionId: { contains: q, mode: 'insensitive' as const } },
              { user: { email: { contains: q, mode: 'insensitive' as const } } },
              { user: { lastName: { contains: q, mode: 'insensitive' as const } } },
              { user: { firstName: { contains: q, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    };

    const [subscriptions, groups, optInCount] = await Promise.all([
      prisma.englishSubscription.findMany({
        where,
        orderBy: [{ declaredAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
        take: 200,
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true, studyField: true, role: true } },
        },
      }),
      prisma.englishSubscription.groupBy({ by: ['status'], _count: { _all: true } }),
      // Mêmes critères que l'envoi réel (comptes confirmés uniquement)
      prisma.user.count({ where: { englishNewsOptIn: true, emailVerifiedAt: { not: null }, englishSubscriptions: { some: {} } } }),
    ]);

    const counts = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<EnglishSubscriptionStatus, number>;
    for (const g of groups) counts[g.status] = g._count._all;

    return NextResponse.json({ subscriptions, counts, optInCount });
  } catch (error) {
    console.error('Erreur API Admin abonnements anglais :', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
