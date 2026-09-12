import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const VALID_STATUSES = ['PENDING', 'APPROVED', 'SUSPENDED'];

// PATCH /api/admin/instructors/[id]
// Body attendu : { "status": "APPROVED" }
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Statut invalide. Valeurs acceptées : ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const existing = await prisma.instructor.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Instructeur introuvable" }, { status: 404 });
    }

    const wasApproved = existing.status === 'APPROVED';

    const updatedInstructor = await prisma.instructor.update({
      where: { id },
      data: { status },
      include: {
        subjects: {
          include: { subject: true }
        }
      }
    });

    // Email de notification uniquement lors du passage EN APPROVED (pas si déjà approuvé avant)
    if (status === 'APPROVED' && !wasApproved) {
      try {
        await resend.emails.send({
          from: 'EduConnect <notifications@educonnect-ci.org>',
          to: [updatedInstructor.email],
          subject: '🎉 Votre profil EduConnect a été validé !',
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #c9951a;">Félicitations ${updatedInstructor.firstName} !</h2>
              <p>Votre profil instructeur a été examiné et <strong>validé</strong> par notre équipe.</p>
              <p>Il est désormais visible par les familles à la recherche d'un tuteur sur EduConnect.</p>
              <p style="font-size: 12px; color: #888; margin-top: 24px;">
                Vous pouvez modifier votre profil à tout moment via le lien personnel reçu lors de votre inscription.
              </p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Erreur envoi email approbation :", emailError);
      }
    }

    return NextResponse.json(updatedInstructor, { status: 200 });

  } catch (error: any) {
    console.error("Erreur API Admin Instructors (PATCH):", error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Instructeur introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Erreur serveur", details: error.message },
      { status: 500 }
    );
  }
}
