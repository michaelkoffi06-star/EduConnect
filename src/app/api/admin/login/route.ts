import { NextRequest, NextResponse } from 'next/server';
import { scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { createSessionToken, SESSION_COOKIE_NAME } from '@/lib/admin-auth';

const scryptAsync = promisify(scrypt);

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const derivedKey = (await scryptAsync(password, Buffer.from(saltHex, 'hex'), 64)) as Buffer;
  const storedKey = Buffer.from(hashHex, 'hex');
  if (derivedKey.length !== storedKey.length) return false;
  return timingSafeEqual(derivedKey, storedKey);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const password = body?.password;
  const storedHash = process.env.ADMIN_PASSWORD_HASH;

  if (!storedHash) {
    console.error('ADMIN_PASSWORD_HASH manquant dans .env');
    return NextResponse.json({ error: 'Configuration serveur invalide.' }, { status: 500 });
  }

  if (typeof password !== 'string' || !(await verifyPassword(password, storedHash))) {
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
