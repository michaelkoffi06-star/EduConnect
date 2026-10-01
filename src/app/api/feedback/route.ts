import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getResendClient } from '@/lib/resend';
import { escapeHtml } from '@/lib/user-emails';
import { rateLimit, HOUR } from '@/lib/rate-limit';

// POST /api/feedback — formulaire public de suggestions, sans authentification.
// Nombre de suggestions limité par IP et texte échappé dans l'email (voir §7sedecies).
export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, 'feedback', 5, HOUR);
  if (limited) return limited;

  try {
    const body = await req.json().catch(() => ({}));
    const { message, email } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Le message est obligatoire.' }, { status: 400 });
    }
    if (message.length > 5000 || (typeof email === 'string' && email.length > 200)) {
      return NextResponse.json({ error: 'Message ou email trop long.' }, { status: 400 });
    }

    const feedback = await prisma.feedback.create({
      data: {
        message: message.trim(),
        email: email && typeof email === 'string' && email.trim() ? email.trim() : null,
      },
    });

    try {
      if (process.env.ADMIN_NOTIFICATION_EMAIL) {
        await getResendClient().emails.send({
          from: 'EduConnect <notifications@educonnect-ci.org>',
          to: [process.env.ADMIN_NOTIFICATION_EMAIL],
          subject: '💡 Nouvelle suggestion reçue',
          html: `
            <p><strong>Message :</strong></p>
            <p>${escapeHtml(feedback.message).replace(/\n/g, '<br/>')}</p>
            ${feedback.email ? `<p><strong>Contact :</strong> ${escapeHtml(feedback.email)}</p>` : '<p><em>Aucun email fourni.</em></p>'}
          `,
        });
      }
    } catch (emailError) {
      console.error('Erreur envoi email suggestion :', emailError);
    }

    return NextResponse.json({ ok: true, id: feedback.id }, { status: 201 });
  } catch (error) {
    console.error('Erreur création feedback :', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
