import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, HOUR } from '@/lib/rate-limit';
import { parseContact } from '@/lib/app-waitlist';

// POST /api/anglais/application — « Prévenez-moi à la sortie » de l'application mobile (§7unvicies).
// Public, limité par IP. Réponse identique qu'on soit déjà inscrit ou non : on ne révèle pas
// quels emails ou numéros figurent dans la liste.
export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, 'liste-application', 5, HOUR);
  if (limited) return limited;

  try {
    const body = await req.json().catch(() => ({}));
    const contact = parseContact(body?.contact);
    if (!contact) {
      return NextResponse.json(
        { error: 'Saisis une adresse email ou un numéro WhatsApp valide (ex. 07 00 00 00 00).' },
        { status: 400 }
      );
    }
    try {
      await prisma.appWaitlistEntry.create({ data: contact });
    } catch (error: any) {
      if (error?.code !== 'P2002') throw error; // déjà inscrit : rien à faire
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Erreur liste d’attente application :', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
