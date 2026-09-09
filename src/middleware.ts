import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/admin-auth';

// S'applique à toutes les routes sauf les fichiers statiques Next.js et le dossier marketing
// (logo, assets de l'ancienne vitrine), pour que la page de maintenance puisse afficher le logo.
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|marketing/).*)'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');

  // --- Auth admin (inchangé) : /admin/** et /api/admin/** restent protégés,
  // et restent accessibles même en mode maintenance.
  if (isAdminPath) {
    if (pathname === '/admin/login' || pathname === '/api/admin/login') {
      return NextResponse.next();
    }

    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const isValid = await verifySessionToken(token);

    if (!isValid) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    return NextResponse.next();
  }

  // --- Mode maintenance : bloque tout le reste du site (public + API publiques)
  // tant que MAINTENANCE_MODE=true, sans toucher au code.
  // Exceptions : suggestions et soutien restent accessibles même pendant la maintenance.
  const maintenanceMode = process.env.MAINTENANCE_MODE === 'true';
  const isExemptFromMaintenance =
    pathname === '/suggestions' ||
    pathname === '/soutenir' ||
    pathname === '/api/feedback';

  if (maintenanceMode && pathname !== '/maintenance' && !isExemptFromMaintenance) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Site en maintenance.' }, { status: 503 });
    }
    return NextResponse.rewrite(new URL('/maintenance', request.url));
  }

  return NextResponse.next();
}
