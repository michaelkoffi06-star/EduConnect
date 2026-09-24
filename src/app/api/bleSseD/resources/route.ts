export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { objectExists, resourceKey, extFromMime, BUCKET_PHOTOS, photoPublicUrl } from '@/lib/r2';
import type { ResourceType, AcademicLevel } from '@prisma/client';
import { requireRole } from '@/lib/admin-permissions';

// GET /api/bleSseD/resources — protégé par le middleware (voir §7bis)
export async function GET(request: NextRequest) {
  const denied = requireRole(request, ['SUPER_ADMIN', 'PEDAGOGIE', 'ADMINISTRATIF']);
  if (denied) return denied;
  try {
    const resources = await prisma.resource.findMany({
      include: { subject: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(resources, { status: 200 });
  } catch (error: any) {
    console.error('Erreur API Admin Resources (GET):', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
  }
}

// POST /api/bleSseD/resources — création après upload (si fichier) ou directe (si lien)
export async function POST(req: NextRequest) {
  const denied = requireRole(req, ['SUPER_ADMIN', 'PEDAGOGIE']);
  if (denied) return denied;
  try {
    const body = await req.json();
    const { resourceId, title, description, type, subjectId, level, contentType, externalUrl } = body;

    if (!title || !type || !subjectId) {
      return NextResponse.json({ error: 'Titre, type et matière sont obligatoires.' }, { status: 400 });
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

    if (needsUrl && (!externalUrl || !externalUrl.trim())) {
      return NextResponse.json({ error: 'URL requise pour ce type de ressource.' }, { status: 400 });
    }

    const resource = await prisma.resource.create({
      data: {
        id: resourceId || undefined,
        title,
        description: description || null,
        type: type as ResourceType,
        subjectId,
        level: (level || 'ALL') as AcademicLevel,
        fileUrl: fileUrl || null,
        externalUrl: needsUrl ? externalUrl.trim() : null,
      },
      include: { subject: true },
    });

    return NextResponse.json(resource, { status: 201 });
  } catch (error: any) {
    console.error('Erreur API Admin Resources (POST):', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
  }
}
