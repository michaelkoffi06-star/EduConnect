export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/admin-permissions';

// GET /api/bleSseD/feedback — protégé par le middleware (voir §7bis)
export async function GET(request: NextRequest) {
  const denied = requireRole(request, ['SUPER_ADMIN']);
  if (denied) return denied;
  try {
    const feedback = await prisma.feedback.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(feedback, { status: 200 });
  } catch (error: any) {
    console.error('Erreur API Admin Feedback (GET):', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
  }
}
