import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findResourceIdByKey } from '@/lib/library-server';
import { getPresignedDownloadUrl, resourceKey, BUCKET_PHOTOS } from '@/lib/r2';
import { slugify } from '@/lib/library';

// GET /api/resources/[key]/download — force le téléchargement du fichier d'une ressource
// (DOCUMENT / EXERCICE). Compte le téléchargement puis redirige vers une URL R2 signée
// valable 5 minutes, avec un nom de fichier lisible (ex. "theoreme-de-pythagore-3f2a1c.pdf").
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const found = await findResourceIdByKey(key);
    if (!found) {
      return NextResponse.json({ error: 'Ressource introuvable.' }, { status: 404 });
    }
    if (!found.fileUrl) {
      return NextResponse.json({ error: "Cette ressource n'a pas de fichier à télécharger." }, { status: 400 });
    }

    const ext = found.fileUrl.split('.').pop()?.toLowerCase() || 'pdf';
    const filename = `${found.slug || slugify(found.title) || 'ressource'}.${ext}`;
    const url = await getPresignedDownloadUrl(BUCKET_PHOTOS, resourceKey(found.id, ext), filename);

    await prisma.resource.update({
      where: { id: found.id },
      data: { downloadCount: { increment: 1 } },
    });

    return NextResponse.redirect(url, 302);
  } catch (error: any) {
    console.error('Erreur API Resource (téléchargement):', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
