import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { setUserSessionCookie } from '@/lib/user-session';

// GET /api/compte/confirmer?jeton=... — lien reçu par email après l'inscription.
// Confirme l'adresse, connecte directement le compte et redirige vers /mon-compte.
// Certaines messageries ouvrent les liens avant l'utilisateur (analyse antivirus) : si le
// jeton a déjà servi mais que l'email est bien confirmé, on renvoie simplement vers la connexion.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('jeton') || '';
  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, req.url));

  if (token.length < 20 || token.length > 100) return redirectTo('/connexion?confirmation=invalide');

  const record = await prisma.userToken.findUnique({
    where: { tokenHash: createHash('sha256').update(token).digest('hex') },
    include: { user: { select: { id: true, role: true, emailVerifiedAt: true } } },
  });

  if (!record || record.type !== 'VERIFY_EMAIL') return redirectTo('/connexion?confirmation=invalide');

  if (record.usedAt || record.expiresAt <= new Date()) {
    return redirectTo(record.user.emailVerifiedAt ? '/connexion?confirmation=ok' : '/connexion?confirmation=expiree');
  }

  await prisma.$transaction([
    prisma.userToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.user.update({
      where: { id: record.user.id },
      data: { emailVerifiedAt: record.user.emailVerifiedAt ?? new Date() },
    }),
  ]);

  const res = redirectTo('/mon-compte?bienvenue=1');
  await setUserSessionCookie(res, record.user);
  return res;
}
