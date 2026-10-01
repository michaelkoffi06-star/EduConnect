import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getResendClient } from '@/lib/resend';
import { escapeHtml } from '@/lib/user-emails';
import { rateLimit, HOUR } from '@/lib/rate-limit';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/contact-message — formulaire de contact général (route publique).
// Nombre de messages limité par IP et texte échappé dans l'email envoyé à l'équipe (voir §7sedecies).
export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, 'contact-message', 5, HOUR);
  if (limited) return limited;

  try {
    const body = await request.json().catch(() => ({}));
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (!fullName || !email || !message) {
      return NextResponse.json({ error: 'Nom, email et message sont requis.' }, { status: 400 });
    }
    if (!EMAIL_RE.test(email) || email.length > 200) {
      return NextResponse.json({ error: 'Adresse email invalide.' }, { status: 400 });
    }
    if (fullName.length > 100 || subject.length > 150 || message.length > 5000) {
      return NextResponse.json({ error: 'Un des champs est trop long.' }, { status: 400 });
    }

    const contactMessage = await prisma.contactMessage.create({
      data: { fullName, email, subject: subject || null, message },
    });

    try {
      if (!process.env.ADMIN_NOTIFICATION_EMAIL) {
        console.error("ADMIN_NOTIFICATION_EMAIL n'est pas defini dans .env - email non envoye.");
      } else {
        const MAX_ATTEMPTS = 3;
        let lastError = null;
        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
          const { data, error } = await getResendClient().emails.send({
            from: 'EduConnect <notifications@educonnect-ci.org>',
            to: [process.env.ADMIN_NOTIFICATION_EMAIL],
            replyTo: email,
            subject: `Nouveau message de contact : ${subject || 'sans objet'}`,
            html: `
              <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #c9951a;">Nouveau message via le formulaire de contact</h2>
                <p><strong>De :</strong> ${escapeHtml(fullName)} (${escapeHtml(email)})</p>
                <p><strong>Objet :</strong> ${escapeHtml(subject || 'Non precise')}</p>
                <p><strong>Message :</strong></p>
                <p style="white-space: pre-line;">${escapeHtml(message)}</p>
              </div>
            `,
          });
          if (!data && !error) break;
          if (!error) { lastError = null; break; }
          lastError = error;
          console.error(`Tentative ${attempt}/${MAX_ATTEMPTS} echouee :`, JSON.stringify(error, null, 2));
          if (attempt < MAX_ATTEMPTS) await new Promise((r) => setTimeout(r, attempt * 500));
        }
        if (lastError) console.error("Echec definitif de l'envoi (formulaire contact).");
      }
    } catch (emailError) {
      console.error('Erreur envoi email formulaire de contact :', emailError);
    }

    return NextResponse.json({ success: true, id: contactMessage.id }, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du message :", error);
    return NextResponse.json({ error: 'Une erreur est survenue. Veuillez reessayer.' }, { status: 500 });
  }
}
