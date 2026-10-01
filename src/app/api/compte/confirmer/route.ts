import { NextRequest, NextResponse } from 'next/server';

// GET /api/compte/confirmer?jeton=... — ancien format du lien de confirmation (emails envoyés
// avant la correction de sécurité du §7sedecies). Le lien ne confirme plus rien à lui seul :
// il renvoie vers la page de connexion, où l'adresse est confirmée en même temps que la
// saisie du mot de passe (voir /api/compte/connexion). Le jeton n'est pas consommé ici, ce qui
// règle aussi le cas des messageries qui ouvrent les liens avant l'utilisateur.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('jeton') || '';
  const target = new URL('/connexion', req.url);
  if (token.length >= 20 && token.length <= 100) target.searchParams.set('jeton', token);
  else target.searchParams.set('confirmation', 'invalide');
  return NextResponse.redirect(target);
}
