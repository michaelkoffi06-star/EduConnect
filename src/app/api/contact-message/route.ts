import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { fullName, email, subject, message } = await request.json();

    if (!fullName || !email || !message) {
      return NextResponse.json({ error: 'Nom, email et message sont requis.' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Adresse email invalide.' }, { status: 400 });
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
          const { data, error } = await resend.emails.send({
            from: 'EduConnect <onboarding@resend.dev>',
            to: [process.env.ADMIN_NOTIFICATION_EMAIL],
            replyTo: email,
            subject: `Nouveau message de contact : ${subject || 'sans objet'}`,
            html: `
              <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #c9951a;">Nouveau message via le formulaire de contact</h2>
                <p><strong>De :</strong> ${fullName} (${email})</p>
                <p><strong>Objet :</strong> ${subject || 'Non precise'}</p>
                <p><strong>Message :</strong></p>
                <p style="white-space: pre-line;">${message}</p>
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

  } catch (error: any) {
    console.error('Erreur lors de l\'enregistrement du message :', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue. Veuillez reessayer.', details: error.message },
      { status: 500 }
    );
  }
}
