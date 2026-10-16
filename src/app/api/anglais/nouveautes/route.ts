import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, HOUR } from '@/lib/rate-limit';
import { verifyNewsUnsubscribe } from '@/lib/english';

// POST /api/anglais/nouveautes — désinscription des emails « nouveautés » depuis le lien de
// l'email, sans connexion. Le lien porte l'id du compte (u) et sa signature HMAC (s) (§7novodecies).
export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, 'desinscription-anglais', 20, HOUR);
  if (limited) return limited;

  try {
    const body = await req.json().catch(() => ({}));
    if (!verifyNewsUnsubscribe(body?.u, body?.s)) {
      return NextResponse.json({ error: 'Lien de désinscription invalide.' }, { status: 400 });
    }
    // updateMany : pas d'erreur si le compte a été supprimé entre-temps
    await prisma.user.updateMany({ where: { id: body.u }, data: { englishNewsOptIn: false } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Erreur désinscription nouveautés anglais :', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
