import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/prisma';
import { SITE_URL } from '@/lib/site';
import { sendEnglishReminderEmail } from '@/lib/user-emails';
import { formatDateFr, subscriptionLabel } from '@/lib/english';

const DAY = 24 * 60 * 60 * 1000;

// GET /api/cron/anglais-abonnements — tâche quotidienne Vercel (vercel.json, 8 h UTC = 8 h à Abidjan),
// §7novodecies :
// 1. passe en EXPIRED les abonnements actifs dont la date de fin est dépassée ;
// 2. envoie le rappel « fin dans une semaine » (une seule fois par abonnement), sauf si l'apprenant
//    a déjà renouvelé sur le même manuel.
// Vercel appelle la route avec « Authorization: Bearer <CRON_SECRET> » : toute autre requête est refusée.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const given = req.headers.get('authorization') || '';
  const expected = `Bearer ${secret}`;
  if (!secret || given.length !== expected.length || !timingSafeEqual(Buffer.from(given), Buffer.from(expected))) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  try {
    const now = new Date();
    const origin = process.env.SITE_URL || SITE_URL;

    const expired = await prisma.englishSubscription.updateMany({
      where: { status: 'ACTIVE', endsAt: { lte: now } },
      data: { status: 'EXPIRED' },
    });

    const ending = await prisma.englishSubscription.findMany({
      where: { status: 'ACTIVE', reminderSentAt: null, endsAt: { gt: now, lte: new Date(now.getTime() + 7 * DAY) } },
      include: { user: { select: { email: true, firstName: true } } },
      take: 500,
    });

    let reminded = 0;
    for (const sub of ending) {
      // Déjà renouvelé (abonnement qui démarre après celui-ci, ou paiement en cours) : pas de rappel
      const renewed = await prisma.englishSubscription.count({
        where: {
          userId: sub.userId,
          manual: sub.manual,
          id: { not: sub.id },
          OR: [{ status: 'ACTIVE', endsAt: { gt: sub.endsAt! } }, { status: 'PAYMENT_DECLARED' }],
        },
      });
      // Marqué avant l'envoi, sous condition : si la tâche tourne deux fois en même temps, un seul email
      const { count } = await prisma.englishSubscription.updateMany({
        where: { id: sub.id, reminderSentAt: null },
        data: { reminderSentAt: now },
      });
      if (count === 0 || renewed > 0) continue;
      await sendEnglishReminderEmail(
        sub.user.email,
        sub.user.firstName,
        subscriptionLabel(sub.manual, sub.plan),
        formatDateFr(sub.endsAt!),
        `${origin}/anglais-technique/mon-abonnement`
      );
      reminded++;
    }

    return NextResponse.json({ ok: true, expired: expired.count, reminded });
  } catch (error) {
    console.error('Erreur tâche quotidienne abonnements anglais :', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
