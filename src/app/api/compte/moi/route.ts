export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, toPublicUser } from '@/lib/user-session';

// GET /api/compte/moi — compte connecté, ou { user: null } (pas d'erreur : utilisé par les
// pages publiques pour savoir s'il faut afficher « Se connecter » ou le contenu réservé).
export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  return NextResponse.json({ user: user ? toPublicUser(user) : null });
}
