import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/admin-permissions';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const denied = await requireRole(request, ['SUPER_ADMIN', 'ADMINISTRATIF']);
  if (denied) return denied;
  try {
    const requests = await prisma.matchRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(requests, { status: 200 });
  } catch (error: any) {
    console.error('Erreur API Admin MatchRequests (GET):', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
