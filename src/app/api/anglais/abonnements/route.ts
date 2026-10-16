import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, unauthorized } from '@/lib/user-session';
import { isPlanOpen, PLANS, paymentNumbers } from '@/lib/english';
import type { EnglishPlan } from '@prisma/client';

// GET /api/anglais/abonnements — abonnements du compte connecté, numéros de paiement et
// formules ouvertes, pour la page /anglais-technique/mon-abonnement (§7novodecies).
export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();

  try {
    const [subscriptions, profile] = await Promise.all([
      prisma.englishSubscription.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: {
          id: true,
          manual: true,
          plan: true,
          status: true,
          priceFcfa: true,
          reference: true,
          paymentMethod: true,
          transactionId: true,
          declaredAt: true,
          adminNote: true,
          startsAt: true,
          endsAt: true,
          createdAt: true,
        },
      }),
      prisma.user.findUnique({ where: { id: user.id }, select: { studyField: true, englishNewsOptIn: true } }),
    ]);

    const openPlans = (Object.keys(PLANS) as EnglishPlan[]).filter((p) => isPlanOpen(p));

    return NextResponse.json({
      subscriptions,
      paymentNumbers: paymentNumbers(),
      openPlans,
      studyField: profile?.studyField ?? '',
      newsOptIn: profile?.englishNewsOptIn ?? false,
    });
  } catch (error) {
    console.error('Erreur lecture abonnements anglais :', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
