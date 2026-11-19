import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/admin-permissions';

// GET /api/bleSseD/app-waitlist — liste d'attente de l'application mobile (§7unvicies)
export async function GET(req: NextRequest) {
  const denied = await requireRole(req, ['SUPER_ADMIN', 'ADMINISTRATIF']);
  if (denied) return denied;
  try {
    const [entries, total] = await Promise.all([
      prisma.appWaitlistEntry.findMany({ orderBy: { createdAt: 'desc' }, take: 2000 }),
      prisma.appWaitlistEntry.count(),
    ]);
    return NextResponse.json({ entries, total }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Erreur API Admin liste d’attente application :', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
