import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findResourceIdByKey } from '@/lib/library-server';

// POST /api/resources/[key]/view — compte une consultation (appelé par la page de lecture,
// une fois par ressource et par session navigateur). Alimente l'étagère "Les plus consultées".
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const found = await findResourceIdByKey(key);
    if (!found) {
      return NextResponse.json({ error: 'Ressource introuvable.' }, { status: 404 });
    }
    await prisma.resource.update({
      where: { id: found.id },
      data: { viewCount: { increment: 1 } },
    });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: any) {
    console.error('Erreur API Resource (vue):', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
