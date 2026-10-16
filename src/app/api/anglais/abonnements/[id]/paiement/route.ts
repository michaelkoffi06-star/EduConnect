import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, unauthorized } from '@/lib/user-session';
import { rateLimit, HOUR } from '@/lib/rate-limit';
import { sendEnglishPaymentDeclaredAlert } from '@/lib/user-emails';
import { PAYMENT_METHODS, cleanText, formatFcfa, isPaymentMethod, subscriptionLabel } from '@/lib/english';

// POST /api/anglais/abonnements/[id]/paiement — l'apprenant déclare son paiement Mobile Money
// (moyen + identifiant de transaction). L'équipe le vérifie puis valide dans /administratif
// (§7novodecies). Possible tant que l'abonnement attend un paiement ou une validation.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();

  // Chaque déclaration envoie une alerte email à l'équipe
  const limited = await rateLimit(req, 'paiement-anglais', 10, HOUR);
  if (limited) return limited;

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const method = body?.method;
    const transactionId = cleanText(body?.transactionId, 60);
    if (!isPaymentMethod(method)) return NextResponse.json({ error: 'Choisis le moyen de paiement.' }, { status: 400 });
    if (transactionId.length < 4) {
      return NextResponse.json({ error: 'Saisis l’identifiant de la transaction (reçu par SMS).' }, { status: 400 });
    }

    const sub = await prisma.englishSubscription.findFirst({
      where: { id, userId: user.id },
      select: { id: true, status: true, manual: true, plan: true, priceFcfa: true, reference: true },
    });
    if (!sub) return NextResponse.json({ error: 'Abonnement introuvable.' }, { status: 404 });
    if (sub.status !== 'PENDING_PAYMENT' && sub.status !== 'PAYMENT_DECLARED') {
      return NextResponse.json({ error: 'Cet abonnement n’attend pas de paiement.' }, { status: 400 });
    }

    await prisma.englishSubscription.update({
      where: { id: sub.id },
      data: { status: 'PAYMENT_DECLARED', paymentMethod: method, transactionId, declaredAt: new Date(), adminNote: null },
    });

    await sendEnglishPaymentDeclaredAlert(
      `${user.firstName} ${user.lastName} <${user.email}>`,
      subscriptionLabel(sub.manual, sub.plan),
      formatFcfa(sub.priceFcfa),
      sub.reference,
      PAYMENT_METHODS[method],
      transactionId
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Erreur déclaration paiement anglais :', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
