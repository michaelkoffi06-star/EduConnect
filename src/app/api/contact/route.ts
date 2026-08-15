import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { studentEmail, studentMessage, instructorId, instructorName } = await request.json();

    if (!studentEmail || !studentMessage || !instructorId || !instructorName) {
      return NextResponse.json({ error: 'Champs manquants.' }, { status: 400 });
    }

    const matchRequest = await prisma.matchRequest.create({
      data: {
        studentEmail,
        studentMessage,
        instructorId,
        instructorName,
      },
    });

    try {
      if (!process.env.ADMIN_NOTIFICATION_EMAIL) {
        console.error("⚠️ ADMIN_NOTIFICATION_EMAIL n'est pas défini — email non envoyé.");
      } else {
        const { error } = await resend.emails.send({
          from: 'EduConnect <onboarding@resend.dev>',
          to: [process.env.ADMIN_NOTIFICATION_EMAIL],
          replyTo: studentEmail,
          subject: `🎯 Demande pour ${instructorName}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #c9951a;">Nouvelle demande de mise en relation</h2>
              <p>Un parent/élève souhaite être mis en relation avec <strong>${instructorName}</strong>.</p>
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Email du demandeur :</strong> ${studentEmail}</p>
                <p><strong>Message :</strong></p>
                <p style="font-style: italic; white-space: pre-line;">"${studentMessage}"</p>
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

  } catch (error: any) {
    console.error('Erreur création demande de mise en relation :', error);
    return NextResponse.json(
      { error: 'Erreur serveur.', details: error.message },
      { status: 500 }
    );
  }
}
