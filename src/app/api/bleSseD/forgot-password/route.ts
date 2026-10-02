import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/prisma';
import { clientIp, startAttempt } from '@/lib/rate-limit';
import { hashPassword, adminPasswordError, ADMIN_PASSWORD_MIN } from '@/lib/password';

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// POST /api/bleSseD/forgot-password — réinitialise le mot de passe du super-admin
// via une clé de récupération secrète (ADMIN_RECOVERY_KEY, connue uniquement du développeur).
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
    adminPasswordError(newPassword)
  ) {
    return NextResponse.json(
      { error: `Identifiant, clé de récupération et nouveau mot de passe (${ADMIN_PASSWORD_MIN} car. min.) requis.` },
      { status: 400 }
    );
  }

  const keyValid = safeEqual(recoveryKey, configuredKey);
  const user = keyValid ? await prisma.adminUser.findUnique({ where: { username } }) : null;
  const isValid = keyValid && !!user && user.role === 'SUPER_ADMIN';

  if (!isValid) {
    // Message volontairement générique : ne révèle pas si l'identifiant existe ou si c'est la clé qui est fausse.
    return NextResponse.json({ error: 'Identifiant ou clé de récupération incorrect.' }, { status: 401 });
  }

  const passwordHash = await hashPassword(newPassword);
  // Nouvelle version de session : toute session ouverte avec l'ancien mot de passe est refusée (§7sedecies)
  await prisma.adminUser.update({
    where: { id: user!.id },
    data: { passwordHash, sessionVersion: { increment: 1 } },
  });
  await attempt.release();

  return NextResponse.json({ ok: true });
}
