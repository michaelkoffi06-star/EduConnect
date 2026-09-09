import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// POST /api/feedback — formulaire public de suggestions, sans authentification
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, email } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Le message est obligatoire.' }, { status: 400 });
    }

    const feedback = await prisma.feedback.create({
      data: {
        message: message.trim(),
        email: email && typeof email === 'string' && email.trim() ? email.trim() : null,
      },
    });

    try {
      if (process.env.ADMIN_NOTIFICATION_EMAIL) {
        await resend.emails.send({
          from: 'EduConnect <notifications@educonnect-ci.org>',
          to: [process.env.ADMIN_NOTIFICATION_EMAIL],
          subject: '💡 Nouvelle suggestion reçue',
          html: `
            <p><strong>Message :</strong></p>
            <p>${feedback.message.replace(/\n/g, '<br/>')}</p>
            ${feedback.email ? `<p><strong>Contact :</strong> ${feedback.email}</p>` : '<p><em>Aucun email fourni.</em></p>'}
          `,
        });
      }
    } catch (emailError) {
      console.error('Erreur envoi email suggestion :', emailError);
    }

    return NextResponse.json(feedback, { status: 201 });
  } catch (error: any) {
    console.error('Erreur création feedback :', error);
    return NextResponse.json({ error: 'Erreur serveur.', details: error.message }, { status: 500 });
  }
}
