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
 * Enregistre une tentative PUIS compte celles de la fenêtre (la nouvelle comprise) : même avec
 * 50 requêtes envoyées en même temps, au plus `max` passent. L'ancien ordre « compter puis
 * enregistrer » laissait passer toute la rafale (voir §7sedecies).
 * - blocked : la limite est dépassée (la tentative est alors retirée, pour ne pas prolonger le blocage).
 * - release() : retire la tentative, par exemple après une connexion réussie (seuls les échecs comptent).
 * En cas de panne de la base, on laisse passer (blocked: false) plutôt que de bloquer le site.
 */
export async function startAttempt(
  key: string,
  max: number,
  windowMs: number
): Promise<{ blocked: boolean; release: () => Promise<void> }> {
  const noop = async () => {};
  try {
    const attempt = await prisma.loginAttempt.create({ data: { ip: key }, select: { id: true } });
    const release = async () => {
      await prisma.loginAttempt.deleteMany({ where: { id: attempt.id } }).catch(() => {});
    };
    const count = await prisma.loginAttempt.count({
      where: { ip: key, createdAt: { gte: new Date(Date.now() - windowMs) } },
    });

    // Nettoyage occasionnel des vieilles traces (environ 1 requête sur 50)
    if (Math.random() < 0.02) {
      prisma.loginAttempt
        .deleteMany({ where: { createdAt: { lt: new Date(Date.now() - RETENTION_MS) } } })
        .catch(() => {});
    }

    if (count > max) {
      await release();
      return { blocked: true, release: noop };
    }
    return { blocked: false, release };
  } catch (error) {
    console.error('Compteur de tentatives indisponible :', error);
    return { blocked: false, release: noop };
  }
}

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
  const { blocked } = await startAttempt(`rl:${scope}:${clientIp(request)}`, max, windowMs);
  if (blocked) {
    return NextResponse.json(
      { error: 'Trop de demandes depuis cette connexion. Réessaie un peu plus tard.' },
      { status: 429 }
    );
  }
  return null;
}

export const MINUTE = 60 * 1000;
export const HOUR = 60 * MINUTE;
