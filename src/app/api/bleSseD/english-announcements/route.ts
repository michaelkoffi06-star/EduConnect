import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/admin-permissions';
import { siteOrigin } from '@/lib/site';
import { sendEnglishAnnouncementEmails } from '@/lib/user-emails';
import { cleanText, newsUnsubscribeSignature } from '@/lib/english';

// GET /api/bleSseD/english-announcements — dernières annonces envoyées
export async function GET(req: NextRequest) {
  const denied = await requireRole(req, ['SUPER_ADMIN', 'ADMINISTRATIF']);
  if (denied) return denied;
  try {
    const announcements = await prisma.englishAnnouncement.findMany({ orderBy: { createdAt: 'desc' }, take: 20 });
    return NextResponse.json(announcements);
  } catch (error) {
    console.error('Erreur API Admin annonces anglais :', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}

// POST /api/bleSseD/english-announcements — annonce un nouveau contenu (chapitre, ressource…) par
// email aux comptes qui ont au moins un abonnement d'anglais technique et ont accepté les nouveautés
// (§7novodecies). Chaque email porte un lien de désinscription signé.
export async function POST(req: NextRequest) {
  const denied = await requireRole(req, ['SUPER_ADMIN', 'ADMINISTRATIF']);
  if (denied) return denied;
  try {
    const body = await req.json().catch(() => ({}));
    const title = cleanText(body?.title, 120);
    const message = typeof body?.message === 'string' ? body.message.trim().slice(0, 2000) : '';
    if (!title || !message) return NextResponse.json({ error: 'Titre et message sont obligatoires.' }, { status: 400 });

    // Lien facultatif : chemin du site (/lecons/…) ou adresse https
    const rawLink = cleanText(body?.link, 300);
    let link: string | null = null;
    const origin = siteOrigin(req);
    if (rawLink) {
      if (rawLink.startsWith('/') && !rawLink.startsWith('//')) link = `${origin}${rawLink}`;
      else if (/^https:\/\/[^\s"'<>]+$/.test(rawLink)) link = rawLink;
      else return NextResponse.json({ error: 'Lien invalide : un chemin du site (/…) ou une adresse https://.' }, { status: 400 });
    }

    const users = await prisma.user.findMany({
      where: { englishNewsOptIn: true, emailVerifiedAt: { not: null }, englishSubscriptions: { some: {} } },
      select: { id: true, email: true, firstName: true },
    });
    if (users.length === 0) return NextResponse.json({ error: 'Aucun apprenant n’a accepté les nouveautés pour l’instant.' }, { status: 400 });

    const recipients = users.map((u) => ({
      email: u.email,
      firstName: u.firstName,
      unsubscribeLink: `${origin}/anglais-technique/nouveautes?u=${encodeURIComponent(u.id)}&s=${newsUnsubscribeSignature(u.id)}`,
    }));
    const sentCount = await sendEnglishAnnouncementEmails(recipients, title, message, link);

    const announcement = await prisma.englishAnnouncement.create({
      data: { title, message, link, sentCount, sentBy: req.headers.get('x-admin-id') },
    });
    return NextResponse.json({ ...announcement, recipients: recipients.length }, { status: 201 });
  } catch (error) {
    console.error('Erreur API Admin annonce anglais :', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
