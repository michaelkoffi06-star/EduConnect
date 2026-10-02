import { NextRequest, NextResponse } from 'next/server';
import { scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { createSessionToken, SESSION_COOKIE_NAME } from '@/lib/bleSseD-auth';
import { prisma } from '@/lib/prisma';
import { clientIp, startAttempt } from '@/lib/rate-limit';

const scryptAsync = promisify(scrypt);

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const derivedKey = (await scryptAsync(password, Buffer.from(saltHex, 'hex'), 64)) as Buffer;
  const storedKey = Buffer.from(hashHex, 'hex');
  if (derivedKey.length !== storedKey.length) return false;
  return timingSafeEqual(derivedKey, storedKey);
}

export async function POST(request: NextRequest) {
  // Tentative enregistrée AVANT la vérification (une rafale simultanée ne passe pas, §7sedecies) ;
  // elle n'est retirée qu'en cas de succès : seuls les échecs comptent.
  const attempt = await startAttempt(clientIp(request), MAX_ATTEMPTS, WINDOW_MS);

  if (attempt.blocked) {
    return NextResponse.json(
      { error: 'Trop de tentatives. Réessaie dans 15 minutes.' },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const username = body?.username;
  const password = body?.password;

  if (typeof username !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'Identifiant et mot de passe requis.' }, { status: 400 });
  }

  const user = await prisma.adminUser.findUnique({ where: { username } });

  const isValid =
    !!user && user.role === 'SUPER_ADMIN' && (await verifyPassword(password, user.passwordHash));

  if (!isValid) {
    return NextResponse.json({ error: 'Identifiant ou mot de passe incorrect.' }, { status: 401 });
  }
  await attempt.release();

  const token = await createSessionToken({
    id: user!.id,
    username: user!.username,
    role: user!.role,
    sessionVersion: user!.sessionVersion,
  });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
