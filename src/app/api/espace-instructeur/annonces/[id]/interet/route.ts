import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { forbiddenForInstructors, getCurrentUser, isApprovedInstructor, unauthorized } from '@/lib/user-session';

// POST /api/espace-instructeur/annonces/[id]/interet — « Je suis intéressé(e) » (message optionnel)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();
  if (!isApprovedInstructor(user)) return forbiddenForInstructors();

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const message = typeof body.message === 'string' ? body.message.trim().slice(0, 1000) || null : null;

    const offer = await prisma.marketOffer.findUnique({ where: { id }, select: { status: true } });
    if (!offer) return NextResponse.json({ error: 'Annonce introuvable.' }, { status: 404 });
    if (offer.status !== 'OPEN') {
      return NextResponse.json({ error: "Cette annonce n'est plus ouverte." }, { status: 400 });
    }

    const interest = await prisma.marketInterest.create({
      data: { offerId: id, instructorId: user.instructor!.id, message },
      select: { id: true, status: true, message: true, createdAt: true },
    });
    return NextResponse.json(interest, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Vous êtes déjà positionné(e) sur cette annonce.' }, { status: 409 });
    }
    console.error('Erreur API Espace instructeur (intérêt):', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/espace-instructeur/annonces/[id]/interet — retirer sa candidature (tant qu'elle est en attente)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();
  if (!isApprovedInstructor(user)) return forbiddenForInstructors();

  try {
    const { id } = await params;
    const { count } = await prisma.marketInterest.deleteMany({
      where: { offerId: id, instructorId: user.instructor!.id, status: 'PENDING' },
    });
    if (count === 0) {
      return NextResponse.json({ error: 'Aucune candidature en attente à retirer.' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur API Espace instructeur (retrait):', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
