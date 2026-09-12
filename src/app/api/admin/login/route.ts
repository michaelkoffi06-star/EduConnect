import { NextRequest, NextResponse } from 'next/server';
import { scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { createSessionToken, SESSION_COOKIE_NAME } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

const scryptAsync = promisify(scrypt);

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const derivedKey = (await scryptAsync(password, Buffer.from(saltHex, 'hex'), 64)) as Buffer;
  const storedKey = Buffer.from(hashHex, 'hex');
  if (derivedKey.length !== storedKey.length) return false;
  return timingSafeEqual(derivedKey, storedKey);
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const windowStart = new Date(Date.now() - WINDOW_MS);

  const recentFailures = await prisma.loginAttempt.count({
    where: { ip, createdAt: { gte: windowStart } },
  });

  if (recentFailures >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: 'Trop de tentatives. Réessaie dans 15 minutes.' },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const password = body?.password;
  const storedHash = process.env.ADMIN_PASSWORD_HASH;

  if (!storedHash) {
    console.error('ADMIN_PASSWORD_HASH manquant dans .env');
    return NextResponse.json({ error: 'Configuration serveur invalide.' }, { status: 500 });
  }

  const isValid = typeof password === 'string' && (await verifyPassword(password, storedHash));

  if (!isValid) {
    await prisma.loginAttempt.create({ data: { ip } }).catch(() => {});
    return NextResponse.json({ error: 'Mot de passe incorrect.' }, { status: 401 });
  }

  const token = await createSessionToken();
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
