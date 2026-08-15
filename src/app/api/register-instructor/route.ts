import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, whatsapp, bio, type, levels, subjects } = await req.json();

    if (!firstName || !lastName || !email || !whatsapp || !subjects?.length) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants.' },
        { status: 400 }
      );
    }

    const newInstructor = await prisma.instructor.create({
      data: {
        firstName,
        lastName,
        email,
        whatsapp,
        bio: bio || '',
        type: type || 'ETUDIANT',
        levels: levels || 'ALL',
        status: 'PENDING',
        subjects: {
          create: subjects.map((subjectId: string) => ({ subjectId })),
        },
      },
    });

    // Notifie l'admin qu'une nouvelle candidature attend une validation.
    // Non bloquant : si l'envoi échoue, l'inscription reste enregistrée.
    // Notifie l'admin qu'une nouvelle candidature attend une validation.
// Non bloquant : si l'envoi échoue après tentatives, l'inscription reste enregistrée.
try {
  if (!process.env.ADMIN_NOTIFICATION_EMAIL) {
    console.error("⚠️ ADMIN_NOTIFICATION_EMAIL n'est pas défini dans .env — email non envoyé.");
  } else {
    const MAX_ATTEMPTS = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const { data, error } = await resend.emails.send({
        from: 'EduConnect <onboarding@resend.dev>',
        to: [process.env.ADMIN_NOTIFICATION_EMAIL],
        subject: '🎓 Nouvelle candidature instructeur reçue !',
        html: `<p>Candidature de <strong>${newInstructor.firstName} ${newInstructor.lastName}</strong> reçue et en attente de validation dans l'espace admin.</p>`,
      });

      if (!error) {
        console.log("✅ Email de notification envoyé, id:", data?.id, `(tentative ${attempt})`);
        lastError = null;
        break;
      }

      lastError = error;
      console.error(`⚠️ Tentative ${attempt}/${MAX_ATTEMPTS} échouée :`, JSON.stringify(error, null, 2));

      if (attempt < MAX_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 500)); // 500ms, puis 1000ms
      }
    }

    if (lastError) {
      console.error("❌ Échec définitif de l'envoi après", MAX_ATTEMPTS, "tentatives.");
    }
  }
} catch (emailError) {
  console.error("Erreur envoi email de notification admin :", emailError);
}

    return NextResponse.json(newInstructor, { status: 201 });

  } catch (error: any) {
    console.error('Erreur inscription instructeur :', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Un compte avec cet email existe déjà.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur.', details: error.message },
      { status: 500 }
    );
  }
}

