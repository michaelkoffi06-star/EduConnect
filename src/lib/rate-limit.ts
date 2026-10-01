import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Limitation simple du nombre de requêtes par IP, pour les routes publiques qui écrivent en base,
// envoient un email ou délivrent une URL d'envoi de fichier (voir §7sedecies de la doc).
// Stockage : la table LoginAttempt (déjà utilisée par les connexions), avec une clé
// "rl:<scope>:<ip>" pour ne pas se mélanger aux compteurs de connexion.

export function clientIp(request: NextRequest): string {
  // Sur Vercel, x-forwarded-for est réécrit par la plateforme : le premier élément est l'IP réelle
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

const RETENTION_MS = 2 * 24 * 60 * 60 * 1000; // les traces de plus de 2 jours ne servent plus

/**
 * Compte la requête et renvoie une réponse 429 si l'IP a déjà fait `max` requêtes de ce type
 * sur la fenêtre `windowMs` ; sinon null (la route continue normalement).
 */
export async function rateLimit(
  request: NextRequest,
  scope: string,
  max: number,
  windowMs: number
): Promise<NextResponse | null> {
  const key = `rl:${scope}:${clientIp(request)}`;
  try {
    const count = await prisma.loginAttempt.count({
      where: { ip: key, createdAt: { gte: new Date(Date.now() - windowMs) } },
    });
    if (count >= max) {
      return NextResponse.json(
        { error: 'Trop de demandes depuis cette connexion. Réessaie un peu plus tard.' },
        { status: 429 }
      );
    }
    await prisma.loginAttempt.create({ data: { ip: key } });

    // Nettoyage occasionnel des vieilles traces (environ 1 requête sur 50)
    if (Math.random() < 0.02) {
      prisma.loginAttempt
        .deleteMany({ where: { createdAt: { lt: new Date(Date.now() - RETENTION_MS) } } })
        .catch(() => {});
    }
  } catch (error) {
    // Une panne du compteur ne doit pas bloquer le site : on laisse passer et on le signale
    console.error('rateLimit indisponible :', error);
  }
  return null;
}

export const MINUTE = 60 * 1000;
export const HOUR = 60 * MINUTE;
