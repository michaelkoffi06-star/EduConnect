import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { EMAIL_RE, createEmailToken, getCurrentUser, normalizeEmail, passwordError } from '@/lib/user-session';
import { sendEnglishPaymentInstructionsEmail, sendVerificationEmail } from '@/lib/user-emails';
import { rateLimit, HOUR } from '@/lib/rate-limit';
import { siteOrigin } from '@/lib/site';
import {
  PLANS,
  cleanText,
  formatFcfa,
  generateReference,
  isManual,
  isPlan,
  isPlanOpen,
  paymentNumbers,
  subscriptionLabel,
} from '@/lib/english';

// POST /api/anglais/inscription — inscription à une formule d'anglais technique (§7novodecies).
// - Sans compte : crée un compte APPRENANT (prénom, nom, email, mot de passe, études) et un
//   abonnement en attente de paiement ; un email de confirmation d'adresse est envoyé.
// - Connecté (tout type de compte) : crée seulement l'abonnement et envoie les instructions de paiement.
export async function POST(req: NextRequest) {
  // Chaque inscription envoie un email : nombre limité par IP (voir §7sedecies)
  const limited = await rateLimit(req, 'inscription-anglais', 5, HOUR);
  if (limited) return limited;

  try {
    const body = await req.json().catch(() => ({}));
    const { manual, plan } = body ?? {};
    if (!isManual(manual)) return NextResponse.json({ error: 'Choisis un manuel.' }, { status: 400 });
    if (!isPlan(plan)) return NextResponse.json({ error: 'Choisis une formule.' }, { status: 400 });
    if (!isPlanOpen(plan)) {
      return NextResponse.json({ error: 'Cette formule n’est pas encore ouverte aux inscriptions.' }, { status: 400 });
    }
    const studyField = cleanText(body.studyField, 80);
    if (!studyField) return NextResponse.json({ error: 'Indique tes études ou ton métier.' }, { status: 400 });
    const newsOptIn = body.newsOptIn === true;
    const priceFcfa = PLANS[plan].priceFcfa as number; // isPlanOpen garantit un prix

    const current = await getCurrentUser(req);

    if (current) {
      // Une seule inscription en attente à la fois pour la même formule et le même manuel
      const pending = await prisma.englishSubscription.findFirst({
        where: { userId: current.id, manual, plan, status: { in: ['PENDING_PAYMENT', 'PAYMENT_DECLARED'] } },
        select: { id: true },
      });
      if (pending) {
        return NextResponse.json({ ok: true, existing: true, account: 'existing' });
      }
      const sub = await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: current.id },
          data: { studyField, ...(newsOptIn ? { englishNewsOptIn: true } : {}) },
        });
        return tx.englishSubscription.create({
          data: { userId: current.id, manual, plan, priceFcfa, reference: generateReference() },
          select: { reference: true },
        });
      });
      await sendEnglishPaymentInstructionsEmail(
        current.email,
        current.firstName,
        subscriptionLabel(manual, plan),
        formatFcfa(priceFcfa),
        sub.reference,
        paymentNumbers(),
        `${siteOrigin(req)}/anglais-technique/mon-abonnement`
      );
      return NextResponse.json({ ok: true, account: 'existing' }, { status: 201 });
    }

    // Nouveau compte
    const email = normalizeEmail(body.email);
    const password = body.password;
    const firstName = cleanText(body.firstName, 60);
    const lastName = cleanText(body.lastName, 60);
    if (!firstName || !lastName) return NextResponse.json({ error: 'Prénom et nom sont obligatoires.' }, { status: 400 });
    if (!EMAIL_RE.test(email) || email.length > 200) {
      return NextResponse.json({ error: 'Adresse email invalide.' }, { status: 400 });
    }
    const pwdError = passwordError(password);
    if (pwdError) return NextResponse.json({ error: pwdError }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      return NextResponse.json(
        {
          error: 'Un compte existe déjà avec cet email. Connecte-toi d’abord, puis reviens sur cette page pour t’inscrire.',
          code: 'ACCOUNT_EXISTS',
        },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
        role: 'APPRENANT',
        firstName,
        lastName,
        studyField,
        englishNewsOptIn: newsOptIn,
        englishSubscriptions: { create: { manual, plan, priceFcfa, reference: generateReference() } },
      },
      select: { id: true, firstName: true },
    });

    const token = await createEmailToken(user.id, 'VERIFY_EMAIL');
    await sendVerificationEmail(email, user.firstName, `${siteOrigin(req)}/connexion?jeton=${token}&suite=${encodeURIComponent('/anglais-technique/mon-abonnement')}`);

    return NextResponse.json({ ok: true, account: 'created' }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Un compte existe déjà avec cet email.' }, { status: 409 });
    }
    console.error('Erreur inscription anglais technique :', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
