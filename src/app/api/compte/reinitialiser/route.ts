import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { consumeEmailToken, passwordError, setUserSessionCookie } from '@/lib/user-session';

// POST /api/compte/reinitialiser — nouveau mot de passe à partir du lien reçu par email.
// Le lien prouve la possession de l'adresse : l'email est aussi marqué comme confirmé.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const pwdError = passwordError(body?.password);
    if (pwdError) return NextResponse.json({ error: pwdError }, { status: 400 });

    const userId = await consumeEmailToken(body?.token, 'RESET_PASSWORD');
    if (!userId) {
      return NextResponse.json(
        { error: 'Ce lien est invalide ou a expiré. Refais une demande de mot de passe oublié.' },
        { status: 400 }
      );
    }

    const current = await prisma.user.findUnique({ where: { id: userId }, select: { emailVerifiedAt: true } });
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: await hashPassword(body.password),
        emailVerifiedAt: current?.emailVerifiedAt ?? new Date(),
      },
      select: { id: true, role: true },
    });

    const res = NextResponse.json({ ok: true });
    await setUserSessionCookie(res, user);
    return res;
  } catch (error) {
    console.error('Erreur réinitialisation mot de passe :', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
