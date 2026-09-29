import { NextResponse } from 'next/server';
import { clearUserSessionCookie } from '@/lib/user-session';

// POST /api/compte/deconnexion — supprime le cookie de session du compte
export async function POST() {
  const res = NextResponse.json({ ok: true });
  clearUserSessionCookie(res);
  return res;
}
