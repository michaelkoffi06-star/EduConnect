import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/password';
import {
  consumeEmailTokenFor,
  normalizeEmail,
  recordAttempt,
  setUserSessionCookie,
  tooManyAttempts,
} from '@/lib/user-session';

// POST /api/compte/connexion — email + mot de passe. 5 échecs max par IP sur 15 minutes
// (même mécanisme que la connexion admin, voir §7bis).
// Confirmation d'email : le lien reçu par email ouvre /connexion?jeton=… et le jeton est envoyé
// ici avec l'email et le mot de passe. L'adresse n'est confirmée QUE si le mot de passe est bon :
// quelqu'un qui aurait créé un compte avec l'email d'une autre personne ne peut donc pas le faire
// activer à son insu (voir §7sedecies). Le vrai propriétaire passe par « Mot de passe oublié ».
export async function POST(req: NextRequest) {
  try {
    if (await tooManyAttempts('compte', req)) {
      return NextResponse.json({ error: 'Trop de tentatives. Réessaie dans 15 minutes.' }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(body?.email);
    const password = body?.password;
    if (!email || typeof password !== 'string') {
      return NextResponse.json({ error: 'Email et mot de passe requis.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true, passwordHash: true, emailVerifiedAt: true, sessionVersion: true },
    });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      await recordAttempt('compte', req);
      return NextResponse.json({ error: 'Email ou mot de passe incorrect.' }, { status: 401 });
    }

    let confirmed = false;
    if (!user.emailVerifiedAt && body?.confirmationToken) {
      if (await consumeEmailTokenFor(body.confirmationToken, 'VERIFY_EMAIL', user.id)) {
        await prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });
        confirmed = true;
      } else {
        return NextResponse.json(
          {
            error: 'Ce lien de confirmation est invalide ou a expiré. Demande un nouveau lien ci-dessous.',
            code: 'EMAIL_NOT_VERIFIED',
          },
          { status: 403 }
        );
      }
    }

    if (!user.emailVerifiedAt && !confirmed) {
      return NextResponse.json(
        {
          error: "Ton adresse email n'est pas encore confirmée. Clique sur le lien reçu par email (pense à regarder dans les spams).",
          code: 'EMAIL_NOT_VERIFIED',
        },
        { status: 403 }
      );
    }

    const res = NextResponse.json({ ok: true, role: user.role, confirmed });
    await setUserSessionCookie(res, user);
    return res;
  } catch (error) {
    console.error('Erreur connexion compte :', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
