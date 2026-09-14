import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const requests = await prisma.matchRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(requests, { status: 200 });
  } catch (error: any) {
    console.error('Erreur API Admin MatchRequests (GET):', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    );
  }
}
