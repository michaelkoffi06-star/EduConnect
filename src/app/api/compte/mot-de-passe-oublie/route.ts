import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createEmailToken, normalizeEmail, recordAttempt, tooManyAttempts } from '@/lib/user-session';
import { sendPasswordResetEmail } from '@/lib/user-emails';
import { siteOrigin } from '@/lib/site';

// POST /api/compte/mot-de-passe-oublie — envoie un lien de réinitialisation (valable 1 h).
// Réponse identique que le compte existe ou non. Limité à 5 demandes par IP sur 15 minutes.
export async function POST(req: NextRequest) {
  try {
    if (await tooManyAttempts('oubli', req)) {
      return NextResponse.json({ error: 'Trop de demandes. Réessaie dans 15 minutes.' }, { status: 429 });
    }
    await recordAttempt('oubli', req);

    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(body?.email);
    const user = email
      ? await prisma.user.findUnique({ where: { email }, select: { id: true, firstName: true } })
      : null;

    if (user) {
      const token = await createEmailToken(user.id, 'RESET_PASSWORD');
      await sendPasswordResetEmail(email, user.firstName, `${siteOrigin(req)}/reinitialiser-mot-de-passe?jeton=${token}`);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Erreur mot de passe oublié :', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
