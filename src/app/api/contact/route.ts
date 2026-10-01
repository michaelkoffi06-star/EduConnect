import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getResendClient } from '@/lib/resend';
import { escapeHtml } from '@/lib/user-emails';
import { rateLimit, HOUR } from '@/lib/rate-limit';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/contact — demande de mise en relation avec un instructeur (route publique).
// Crée une MatchRequest et prévient l'équipe par email (jamais l'instructeur).
// Sécurité (voir §7sedecies) : nombre de demandes limité par IP, le nom de l'instructeur est
// relu en base (on ne fait pas confiance à celui envoyé par le navigateur), et tout texte saisi
// est échappé avant d'être inséré dans l'email.
export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, 'contact', 5, HOUR);
  if (limited) return limited;

  try {
    const body = await request.json().catch(() => ({}));
    const studentEmail = typeof body.studentEmail === 'string' ? body.studentEmail.trim() : '';
    const studentMessage = typeof body.studentMessage === 'string' ? body.studentMessage.trim() : '';
    const instructorId = typeof body.instructorId === 'string' ? body.instructorId : '';

    if (!studentEmail || !studentMessage || !instructorId) {
      return NextResponse.json({ error: 'Champs manquants.' }, { status: 400 });
    }
    if (!EMAIL_RE.test(studentEmail) || studentEmail.length > 200) {
      return NextResponse.json({ error: 'Adresse email invalide.' }, { status: 400 });
    }
    if (studentMessage.length > 2000) {
      return NextResponse.json({ error: 'Message trop long (2000 caractères maximum).' }, { status: 400 });
    }

    const instructor = await prisma.instructor.findFirst({
      where: { id: instructorId, status: 'APPROVED' },
      select: { firstName: true, lastName: true },
    });
    if (!instructor) {
      return NextResponse.json({ error: 'Instructeur introuvable.' }, { status: 404 });
    }
    const instructorName = `${instructor.firstName} ${instructor.lastName}`;

    const matchRequest = await prisma.matchRequest.create({
      data: { studentEmail, studentMessage, instructorId, instructorName },
    });

    try {
      if (!process.env.ADMIN_NOTIFICATION_EMAIL) {
        console.error("⚠️ ADMIN_NOTIFICATION_EMAIL n'est pas défini — email non envoyé.");
      } else {
        const { error } = await getResendClient().emails.send({
          from: 'EduConnect <notifications@educonnect-ci.org>',
          to: [process.env.ADMIN_NOTIFICATION_EMAIL],
          replyTo: studentEmail,
          subject: `🎯 Demande pour ${instructorName}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #c9951a;">Nouvelle demande de mise en relation</h2>
              <p>Un parent/élève souhaite être mis en relation avec <strong>${escapeHtml(instructorName)}</strong>.</p>
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Email du demandeur :</strong> ${escapeHtml(studentEmail)}</p>
                <p><strong>Message :</strong></p>
                <p style="font-style: italic; white-space: pre-line;">"${escapeHtml(studentMessage)}"</p>
              </div>
              <p>Retrouve cette demande dans l'espace admin, onglet "Demandes".</p>
            </div>
          `,
        });

        if (error) {
          console.error("⚠️ Resend a refusé l'envoi :", JSON.stringify(error, null, 2));
        }
      }
    } catch (emailError) {
      console.error('Erreur envoi email de notification admin :', emailError);
    }

    return NextResponse.json({ success: true, id: matchRequest.id }, { status: 201 });
  } catch (error) {
    console.error('Erreur création demande de mise en relation :', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
