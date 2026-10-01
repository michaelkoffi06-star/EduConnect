export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { objectExists, resourceKey, extFromMime, BUCKET_PHOTOS, photoPublicUrl } from '@/lib/r2';
import type { ResourceType, AcademicLevel } from '@prisma/client';
import { requireRole } from '@/lib/admin-permissions';
import { publicResourceSelect, toPublicResource, resourceSlug, normalizeExternalUrl } from '@/lib/library';

// GET /api/bleSseD/resources — protégé par le middleware (voir §7bis)
export async function GET(request: NextRequest) {
  const denied = await requireRole(request, ['SUPER_ADMIN', 'PEDAGOGIE', 'ADMINISTRATIF']);
  if (denied) return denied;
  try {
    const resources = await prisma.resource.findMany({
      select: publicResourceSelect,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(resources.map(toPublicResource), { status: 200 });
  } catch (error: any) {
    console.error('Erreur API Admin Resources (GET):', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/bleSseD/resources — création après upload (si fichier) ou directe (si lien)
export async function POST(req: NextRequest) {
  const denied = await requireRole(req, ['SUPER_ADMIN', 'PEDAGOGIE']);
  if (denied) return denied;
  try {
    const body = await req.json();
    const { resourceId, title, description, type, subjectId, level, contentType, externalUrl, chapterId, position } = body;

    if (!title || !type || !subjectId) {
      return NextResponse.json({ error: 'Titre, type et matière sont obligatoires.' }, { status: 400 });
    }

    // Un chapitre (classeur) doit appartenir à la même matière que la ressource
    let chapterLevel: AcademicLevel | undefined;
    if (chapterId) {
      const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
      if (!chapter || chapter.subjectId !== subjectId) {
        return NextResponse.json({ error: "Ce chapitre n'appartient pas à la matière choisie." }, { status: 400 });
      }
      chapterLevel = chapter.level;
    }

    const needsFile = type === 'DOCUMENT' || type === 'EXERCICE';
    const needsUrl = type === 'VIDEO' || type === 'LIEN';

    let fileUrl: string | undefined;

    if (needsFile) {
      if (!resourceId || !contentType) {
        return NextResponse.json({ error: 'Fichier manquant pour ce type de ressource.' }, { status: 400 });
      }
      const key = resourceKey(resourceId, extFromMime(contentType));
      const exists = await objectExists(BUCKET_PHOTOS, key);
      if (!exists) {
        return NextResponse.json({ error: "L'upload du fichier n'a pas fini. Réessaie." }, { status: 400 });
      }
      fileUrl = photoPublicUrl(key);
    }

    const cleanUrl = needsUrl ? normalizeExternalUrl(externalUrl) : null;
    if (needsUrl && !cleanUrl) {
      return NextResponse.json(
        { error: 'Adresse invalide. Exemple attendu : https://www.youtube.com/watch?v=… ou https://exemple.com' },
        { status: 400 }
      );
    }

    const id = resourceId || crypto.randomUUID();

    const resource = await prisma.resource.create({
      data: {
        id,
        title,
        slug: resourceSlug(title, id),
        description: description || null,
        type: type as ResourceType,
        subjectId,
        chapterId: chapterId || null,
        position: Number.isFinite(Number(position)) ? Number(position) : 0,
        level: (level || chapterLevel || 'ALL') as AcademicLevel,
        fileUrl: fileUrl || null,
        externalUrl: cleanUrl,
      },
      select: publicResourceSelect,
    });

    return NextResponse.json(toPublicResource(resource), { status: 201 });
  } catch (error: any) {
    console.error('Erreur API Admin Resources (POST):', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
