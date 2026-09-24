import { NextRequest, NextResponse } from 'next/server';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/bleSseD-auth';
import { prisma } from '@/lib/prisma';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(password, Buffer.from(salt, 'hex'), 64)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const derivedKey = (await scryptAsync(password, Buffer.from(saltHex, 'hex'), 64)) as Buffer;
  const storedKey = Buffer.from(hashHex, 'hex');
  if (derivedKey.length !== storedKey.length) return false;
  return timingSafeEqual(derivedKey, storedKey);
}

// PATCH /api/account — un compte modifie son propre identifiant/mot de passe.
// Nécessite le mot de passe actuel pour confirmer.
export async function PATCH(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);
  if (!session) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  try {
    const { currentPassword, newUsername, newPassword } = await request.json();

    if (typeof currentPassword !== 'string' || !currentPassword) {
      return NextResponse.json({ error: 'Mot de passe actuel requis.' }, { status: 400 });
    }

    const user = await prisma.adminUser.findUnique({ where: { id: session.sub } });
    if (!user) {
      return NextResponse.json({ error: 'Compte introuvable.' }, { status: 404 });
    }

    const ok = await verifyPassword(currentPassword, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: 'Mot de passe actuel incorrect.' }, { status: 401 });
    }

    const data: { username?: string; passwordHash?: string } = {};
    if (typeof newUsername === 'string' && newUsername.trim() && newUsername.trim() !== user.username) {
      data.username = newUsername.trim();
    }
    if (typeof newPassword === 'string' && newPassword.length > 0) {
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'Le nouveau mot de passe doit faire au moins 6 caractères.' }, { status: 400 });
      }
      data.passwordHash = await hashPassword(newPassword);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Rien à modifier.' }, { status: 400 });
    }

    const updated = await prisma.adminUser.update({ where: { id: user.id }, data });
    return NextResponse.json({ ok: true, username: updated.username });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Cet identifiant est déjà pris.' }, { status: 409 });
    }
    console.error('Erreur mise à jour compte :', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
  }
}
