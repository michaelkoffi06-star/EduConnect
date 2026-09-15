export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/bleSseD/waitlist — protégé par le middleware (voir §7bis)
export async function GET() {
  try {
    const entries = await prisma.waitlistEntry.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const subjectIds = [...new Set(entries.map((e) => e.subjectId))];
    const subjects = await prisma.subject.findMany({
      where: { id: { in: subjectIds } },
    });
    const subjectById = new Map(subjects.map((s) => [s.id, s]));

    const result = entries.map((entry) => ({
      ...entry,
      subject: subjectById.get(entry.subjectId) ?? null,
    }));

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Erreur API Admin Waitlist (GET):', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
  }
}
