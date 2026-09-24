import { NextRequest, NextResponse } from 'next/server';
import type { AdminRole } from './bleSseD-auth';

// Le middleware pose cet en-tête après avoir vérifié la session ; on s'en sert ici
// pour restreindre finement l'accès à certaines routes /api/bleSseD/** partagées
// par les 3 panneaux (bleSseD, pédagogie, administratif).
export function getRoleFromHeaders(request: NextRequest): AdminRole | null {
  const role = request.headers.get('x-admin-role');
  if (role === 'SUPER_ADMIN' || role === 'PEDAGOGIE' || role === 'ADMINISTRATIF') return role;
  return null;
}

// Retourne une réponse 403 si le rôle courant n'est pas dans la liste autorisée,
// sinon null (le handler peut continuer normalement).
export function requireRole(request: NextRequest, allowed: AdminRole[]): NextResponse | null {
  const role = getRoleFromHeaders(request);
  if (!role || !allowed.includes(role)) {
    return NextResponse.json({ error: 'Accès refusé pour ce rôle.' }, { status: 403 });
  }
  return null;
}
