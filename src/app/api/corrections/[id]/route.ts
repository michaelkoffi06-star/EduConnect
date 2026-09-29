import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BUCKET_PRIVATE, correctionKey, getPresignedDownloadUrl, getPresignedReadUrl } from '@/lib/r2';
import { slugify } from '@/lib/library';
import { getCurrentUser } from '@/lib/user-session';

// GET /api/corrections/[id] — accès au fichier d'un corrigé (bucket R2 privé), comptes connectés uniquement.
// - ?mode=lecture : renvoie { url } (URL signée 5 min) pour l'afficher dans la page (lecteur PDF / image)
// - sinon : téléchargement — redirige vers une URL signée qui force l'enregistrement du fichier.
//   Sans session, redirige vers la connexion (le lien est ouvert directement par le navigateur).
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reading = req.nextUrl.searchParams.get('mode') === 'lecture';

  const user = await getCurrentUser(req);
  if (!user) {
    if (reading) return NextResponse.json({ error: 'Connecte-toi pour voir ce corrigé.' }, { status: 401 });
    return NextResponse.redirect(new URL('/connexion?suite=/bibliotheque/corriges', req.url));
  }

  try {
    const correction = await prisma.correction.findUnique({
      where: { id },
      select: { id: true, fileExt: true, resource: { select: { title: true, slug: true } } },
    });
    if (!correction) {
      return NextResponse.json({ error: 'Corrigé introuvable.' }, { status: 404 });
    }

    const key = correctionKey(correction.id, correction.fileExt);

    if (reading) {
      const url = await getPresignedReadUrl(BUCKET_PRIVATE, key);
      await prisma.correction.update({ where: { id }, data: { viewCount: { increment: 1 } } });
      return NextResponse.json({ url, fileExt: correction.fileExt });
    }

    const base = correction.resource.slug || slugify(correction.resource.title) || 'ressource';
    const url = await getPresignedDownloadUrl(BUCKET_PRIVATE, key, `corrige-${base}.${correction.fileExt}`);
    await prisma.correction.update({ where: { id }, data: { downloadCount: { increment: 1 } } });
    return NextResponse.redirect(url, 302);
  } catch (error: any) {
    console.error('Erreur API Corrigé (fichier):', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
