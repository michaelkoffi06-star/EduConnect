import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/admin-permissions';
import { siteOrigin } from '@/lib/site';
import { sendEnglishActivatedEmail, sendEnglishPaymentRejectedEmail } from '@/lib/user-emails';
import { cleanText, computeEndsAt, formatDateFr, subscriptionLabel } from '@/lib/english';

// PATCH /api/bleSseD/english-subscriptions/[id] — l'équipe traite un abonnement (§7novodecies) :
// - validate : paiement reçu → ACTIVE, dates calculées, email de confirmation. Si l'apprenant a déjà
//   un abonnement actif sur le même manuel (renouvellement), le nouveau démarre à sa fin.
// - reject   : paiement introuvable → retour en attente de paiement, avec un motif envoyé par email.
// - cancel   : annulation (doublon, remboursement…), sans email.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireRole(req, ['SUPER_ADMIN', 'ADMINISTRATIF']);
  if (denied) return denied;
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const action = body?.action;
    const note = cleanText(body?.note, 300);

    const sub = await prisma.englishSubscription.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true, firstName: true } } },
    });
    if (!sub) return NextResponse.json({ error: 'Abonnement introuvable.' }, { status: 404 });
    const link = `${siteOrigin(req)}/anglais-technique/mon-abonnement`;
    const waiting = ['PENDING_PAYMENT', 'PAYMENT_DECLARED'] as const;

    if (action === 'validate') {
      const now = new Date();
      const current = await prisma.englishSubscription.findFirst({
        where: { userId: sub.userId, manual: sub.manual, status: 'ACTIVE', endsAt: { gt: now } },
        orderBy: { endsAt: 'desc' },
        select: { endsAt: true },
      });
      const startsAt = current?.endsAt ?? now;
      const endsAt = computeEndsAt(startsAt, sub.plan);
      // Mise à jour conditionnelle : deux clics simultanés ne valident (et n'envoient l'email) qu'une fois
      const { count } = await prisma.englishSubscription.updateMany({
        where: { id, status: { in: [...waiting] } },
        data: {
          status: 'ACTIVE',
          startsAt,
          endsAt,
          adminNote: null,
          validatedBy: req.headers.get('x-admin-id'),
          reminderSentAt: null,
        },
      });
      if (count === 0) return NextResponse.json({ error: 'Cet abonnement a déjà été traité.' }, { status: 409 });
      await sendEnglishActivatedEmail(sub.user.email, sub.user.firstName, subscriptionLabel(sub.manual, sub.plan), formatDateFr(endsAt), link);
      return NextResponse.json({ ok: true, status: 'ACTIVE', startsAt, endsAt });
    }

    if (action === 'reject') {
      if (!note) return NextResponse.json({ error: 'Indique le motif du refus (envoyé à l’apprenant).' }, { status: 400 });
      const { count } = await prisma.englishSubscription.updateMany({
        where: { id, status: { in: [...waiting] } },
        data: { status: 'PENDING_PAYMENT', adminNote: note },
      });
      if (count === 0) return NextResponse.json({ error: 'Cet abonnement a déjà été traité.' }, { status: 409 });
      await sendEnglishPaymentRejectedEmail(sub.user.email, sub.user.firstName, note, link);
      return NextResponse.json({ ok: true, status: 'PENDING_PAYMENT' });
    }

    if (action === 'cancel') {
      const { count } = await prisma.englishSubscription.updateMany({
        where: { id, status: { notIn: ['CANCELLED', 'EXPIRED'] } },
        data: { status: 'CANCELLED', ...(note ? { adminNote: note } : {}) },
      });
      if (count === 0) return NextResponse.json({ error: 'Cet abonnement est déjà terminé.' }, { status: 409 });
      return NextResponse.json({ ok: true, status: 'CANCELLED' });
    }

    return NextResponse.json({ error: 'Action invalide.' }, { status: 400 });
  } catch (error) {
    console.error('Erreur API Admin abonnement anglais :', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
