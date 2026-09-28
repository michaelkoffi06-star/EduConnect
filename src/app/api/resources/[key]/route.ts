import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { publicResourceSelect, toPublicResource } from '@/lib/library';
import { findResourceByKey } from '@/lib/library-server';

// GET /api/resources/[key] — une ressource (par slug ou id) + les autres documents de son
// classeur (même chapitre), dans l'ordre des onglets. Ne compte PAS de vue : les robots
// d'indexation lisent aussi cette route ; le comptage passe par POST .../view.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const resource = await findResourceByKey(key);
    if (!resource) {
      return NextResponse.json({ error: 'Ressource introuvable.' }, { status: 404 });
    }

    const siblings = resource.chapter
      ? await prisma.resource.findMany({
          where: { chapterId: resource.chapter.id },
          select: publicResourceSelect,
          orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
        })
      : [resource];

    return NextResponse.json(
      {
        resource: toPublicResource(resource),
        chapter: resource.chapter,
        siblings: siblings.map(toPublicResource),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erreur API Resource (détail):', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
  }
}
