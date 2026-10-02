import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createEmailToken, normalizeEmail, startUserAttempt } from '@/lib/user-session';
import { sendVerificationEmail } from '@/lib/user-emails';
import { siteOrigin } from '@/lib/site';

// POST /api/compte/renvoyer-confirmation — renvoie le lien de confirmation d'email.
// Réponse identique que le compte existe ou non (ne révèle pas quels emails sont inscrits).
// Limité à 5 envois par IP sur 15 minutes.
export async function POST(req: NextRequest) {
  try {
    if ((await startUserAttempt('renvoi', req)).blocked) {
      return NextResponse.json({ error: 'Trop de demandes. Réessaie dans 15 minutes.' }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(body?.email);
    const user = email
      ? await prisma.user.findUnique({ where: { email }, select: { id: true, firstName: true, emailVerifiedAt: true } })
      : null;

    if (user && !user.emailVerifiedAt) {
      const token = await createEmailToken(user.id, 'VERIFY_EMAIL');
      await sendVerificationEmail(email, user.firstName, `${siteOrigin(req)}/connexion?jeton=${token}`);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Erreur renvoi confirmation :', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
