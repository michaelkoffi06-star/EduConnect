export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { publicOfferSelect } from '@/lib/market';
import { forbiddenForInstructors, getCurrentUser, isApprovedInstructor, unauthorized } from '@/lib/user-session';

// GET /api/espace-instructeur/annonces — marché des instructeurs (voir §7quindecies).
// Réservé aux instructeurs approuvés. Renvoie les annonces ouvertes, plus celles (même
// clôturées) sur lesquelles l'instructeur s'est positionné, avec l'état de sa candidature.
export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();
  if (!isApprovedInstructor(user)) return forbiddenForInstructors();
  const instructorId = user.instructor!.id;

  try {
    const offers = await prisma.marketOffer.findMany({
      where: { OR: [{ status: 'OPEN' }, { interests: { some: { instructorId } } }] },
      select: {
        ...publicOfferSelect,
        _count: { select: { interests: true } },
        interests: { where: { instructorId }, select: { id: true, status: true, message: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      mySubjectIds: user.instructor!.subjects.map((s) => s.subjectId),
      offers: offers.map(({ interests, _count, ...offer }) => ({
        ...offer,
        interestCount: _count.interests,
        myInterest: interests[0] ?? null,
      })),
    });
  } catch (error: any) {
    console.error('Erreur API Espace instructeur (annonces):', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
