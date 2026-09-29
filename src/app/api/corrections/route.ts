export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { publicResourceSelect, toPublicResource } from '@/lib/library';
import { getCurrentUser, unauthorized } from '@/lib/user-session';

// GET /api/corrections — étagère des corrigés : toutes les ressources qui ont un corrigé.
// Réservé aux comptes connectés (élèves, parents, instructeurs).
export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();
  try {
    const resources = await prisma.resource.findMany({
      where: { correction: { isNot: null } },
      select: publicResourceSelect,
      orderBy: [{ subject: { name: 'asc' } }, { createdAt: 'desc' }],
    });
    return NextResponse.json(resources.map(toPublicResource));
  } catch (error: any) {
    console.error('Erreur API Corrigés (liste):', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
