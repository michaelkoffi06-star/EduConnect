import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/password';
import { normalizeEmail, recordAttempt, setUserSessionCookie, tooManyAttempts } from '@/lib/user-session';

// POST /api/compte/connexion — email + mot de passe. 5 échecs max par IP sur 15 minutes
// (même mécanisme que la connexion admin, voir §7bis).
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
      select: { id: true, role: true, passwordHash: true, emailVerifiedAt: true },
    });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      await recordAttempt('compte', req);
      return NextResponse.json({ error: 'Email ou mot de passe incorrect.' }, { status: 401 });
    }

    if (!user.emailVerifiedAt) {
      return NextResponse.json(
        {
          error: "Ton adresse email n'est pas encore confirmée. Clique sur le lien reçu par email (pense à regarder dans les spams).",
          code: 'EMAIL_NOT_VERIFIED',
        },
        { status: 403 }
      );
    }

    const res = NextResponse.json({ ok: true, role: user.role });
    await setUserSessionCookie(res, user);
    return res;
  } catch (error) {
    console.error('Erreur connexion compte :', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
