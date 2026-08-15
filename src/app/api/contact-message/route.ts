import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/contact-message
// Gère le formulaire de contact général du site (section "Contact" de la page d'accueil).
// À ne pas confondre avec /api/contact, qui gère le contact étudiant → instructeur.
export async function POST(request: NextRequest) {
  try {
    const { fullName, email, subject, message } = await request.json();

    if (!fullName || !email || !message) {
      return NextResponse.json(
        { error: 'Nom, email et message sont requis.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Adresse email invalide.' },
        { status: 400 }
      );
    }

    const contactMessage = await prisma.contactMessage.create({
      data: {
        fullName,
        email,
        subject: subject || null,
        message,
      },
    });

    return NextResponse.json({ success: true, id: contactMessage.id }, { status: 201 });

  } catch (error: any) {
    console.error('Erreur lors de l\'enregistrement du message :', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue. Veuillez réessayer.', details: error.message },
      { status: 500 }
    );
  }
}
