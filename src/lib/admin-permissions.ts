import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { AdminRole } from './bleSseD-auth';

// Le middleware vérifie la signature du cookie admin puis pose ces en-têtes (toujours réécrits,
// donc impossibles à falsifier depuis le navigateur) :
// - x-admin-role : rôle inscrit dans la session ;
// - x-admin-id / x-admin-sv : compte et version de session, relus en base par requireRole().
export function getRoleFromHeaders(request: NextRequest): AdminRole | null {
  const role = request.headers.get('x-admin-role');
  if (role === 'SUPER_ADMIN' || role === 'PEDAGOGIE' || role === 'ADMINISTRATIF') return role;
  return null;
}

// Retourne une réponse 401/403 si l'accès est refusé, sinon null (le handler continue).
// Relit le compte en base à chaque appel (voir §7sedecies) : un compte supprimé, dont le rôle
// a changé ou dont le mot de passe a été modifié perd l'accès immédiatement, sans attendre
// l'expiration de sa session (7 jours). C'est le rôle EN BASE qui fait foi.
export async function requireRole(request: NextRequest, allowed: AdminRole[]): Promise<NextResponse | null> {
  const id = request.headers.get('x-admin-id');
  const version = Number(request.headers.get('x-admin-sv') ?? '0');
  if (!id || !getRoleFromHeaders(request)) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const admin = await prisma.adminUser.findUnique({
    where: { id },
    select: { role: true, sessionVersion: true },
  });
  if (!admin || admin.sessionVersion !== version) {
    return NextResponse.json({ error: 'Session expirée. Reconnecte-toi.' }, { status: 401 });
  }
  if (!allowed.includes(admin.role)) {
    return NextResponse.json({ error: 'Accès refusé pour ce rôle.' }, { status: 403 });
  }
  return null;
}
