import type { NextRequest } from 'next/server';

// Adresse publique du site, pour les liens envoyés par email (confirmation, mot de passe,
// lien d'édition…). En production, toujours l'adresse officielle — jamais déduite des en-têtes
// de la requête, qu'un tiers pourrait influencer (voir §7sedecies). En développement, l'adresse
// locale utilisée (http://localhost:3000 ou l'adresse « Network »).
export const SITE_URL = 'https://educonnect-ci.org';

export function siteOrigin(req: NextRequest): string {
  if (process.env.NODE_ENV === 'production') return process.env.SITE_URL || SITE_URL;
  return req.nextUrl.origin;
}
