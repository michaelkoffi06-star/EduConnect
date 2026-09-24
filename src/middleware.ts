import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME, type AdminRole } from '@/lib/bleSseD-auth';

// S'applique à toutes les routes sauf les fichiers statiques Next.js et le dossier marketing
// (logo, assets de l'ancienne vitrine), pour que la page de maintenance puisse afficher le logo.
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|marketing/).*)'],
};

// Page de connexion partagée pour les rôles pédagogie et administratif
// (voir §7bis de la doc — nom volontairement discret, distinct de /bleSseD/login)
const SHARED_LOGIN_PAGE = '/dev_edco_si/san_other/login';
const SHARED_LOGIN_API = '/api/dev_edco_si/san_other/login';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isBleSseDPath = pathname.startsWith('/bleSseD') || pathname.startsWith('/api/bleSseD');
  const isPedagogiePath = pathname.startsWith('/pedagogie');
  const isAdministratifPath = pathname.startsWith('/administratif');
  const isAccountPath = pathname.startsWith('/api/account'); // auto-gestion du compte, tous rôles
  const isLoginPath =
    pathname === '/bleSseD/login' ||
    pathname === '/api/bleSseD/login' ||
    pathname === '/api/bleSseD/forgot-password' ||
    pathname === SHARED_LOGIN_PAGE ||
    pathname === SHARED_LOGIN_API;

  const isAdminPath = isBleSseDPath || isPedagogiePath || isAdministratifPath || isAccountPath;

  // --- Auth admin : /bleSseD/**, /pedagogie/** et /administratif/** sont protégés,
  // et restent accessibles même en mode maintenance.
  if (isAdminPath) {
    if (isLoginPath) {
      return NextResponse.next();
    }

    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(token);

    const fallbackLogin = isBleSseDPath ? '/bleSseD/login' : SHARED_LOGIN_PAGE;

    if (!session) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
      }
      return NextResponse.redirect(new URL(fallbackLogin, request.url));
    }

    // Autorisation par rôle : la PAGE /bleSseD reste réservée au super-admin ;
    // les API /api/bleSseD/** sont partagées par les 3 panneaux (restriction fine
    // faite dans chaque route via l'en-tête x-admin-role ci-dessous).
    const role = session.role as AdminRole;

    if (pathname.startsWith('/bleSseD') && role !== 'SUPER_ADMIN') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
      }
      return NextResponse.redirect(new URL(fallbackLogin, request.url));
    }

    if (isPedagogiePath && role !== 'SUPER_ADMIN' && role !== 'PEDAGOGIE') {
      return NextResponse.redirect(new URL(SHARED_LOGIN_PAGE, request.url));
    }

    if (isAdministratifPath && role !== 'SUPER_ADMIN' && role !== 'ADMINISTRATIF') {
      return NextResponse.redirect(new URL(SHARED_LOGIN_PAGE, request.url));
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-admin-role', role);
    return NextResponse.next({ request: { headers: requestHeaders } });
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
