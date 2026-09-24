import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// POST /api/bleSseD/forgot-password — réinitialise le mot de passe du super-admin
// via une clé de récupération secrète (ADMIN_RECOVERY_KEY, connue uniquement du développeur).
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
  const username = body?.username;
  const recoveryKey = body?.recoveryKey;
  const newPassword = body?.newPassword;

  const configuredKey = process.env.ADMIN_RECOVERY_KEY;

  if (!configuredKey) {
    console.error('ADMIN_RECOVERY_KEY manquant dans .env');
    return NextResponse.json({ error: 'Configuration serveur invalide.' }, { status: 500 });
  }

  if (
    typeof username !== 'string' ||
    typeof recoveryKey !== 'string' ||
    typeof newPassword !== 'string' ||
    newPassword.length < 6
  ) {
    return NextResponse.json(
      { error: 'Identifiant, clé de récupération et nouveau mot de passe (6 car. min.) requis.' },
      { status: 400 }
    );
  }

  const keyValid = safeEqual(recoveryKey, configuredKey);
  const user = keyValid ? await prisma.adminUser.findUnique({ where: { username } }) : null;
  const isValid = keyValid && !!user && user.role === 'SUPER_ADMIN';

  if (!isValid) {
    await prisma.loginAttempt.create({ data: { ip } }).catch(() => {});
    // Message volontairement générique : ne révèle pas si l'identifiant existe ou si c'est la clé qui est fausse.
    return NextResponse.json({ error: 'Identifiant ou clé de récupération incorrect.' }, { status: 401 });
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.adminUser.update({ where: { id: user!.id }, data: { passwordHash } });

  return NextResponse.json({ ok: true });
}
