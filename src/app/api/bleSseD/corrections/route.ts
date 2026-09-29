import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BUCKET_PRIVATE, correctionKey, deleteFromR2, extFromMime, objectExists } from '@/lib/r2';
import { requireRole } from '@/lib/admin-permissions';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST /api/bleSseD/corrections — rattache un corrigé à un document/exercice, après l'upload
// direct du fichier sur R2. Remplace le corrigé existant s'il y en a déjà un.
export async function POST(req: NextRequest) {
  const denied = requireRole(req, ['SUPER_ADMIN', 'PEDAGOGIE']);
  if (denied) return denied;
  try {
    const { correctionId, resourceId, contentType } = await req.json();
    if (!UUID_RE.test(correctionId || '') || !resourceId || !contentType) {
      return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
    }

    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      select: { id: true, type: true, correction: { select: { id: true, fileExt: true } } },
    });
    if (!resource) {
      return NextResponse.json({ error: 'Ressource introuvable.' }, { status: 404 });
    }
    if (resource.type !== 'DOCUMENT' && resource.type !== 'EXERCICE') {
      return NextResponse.json({ error: 'Un corrigé ne peut être ajouté qu’à un document ou un exercice.' }, { status: 400 });
    }

    const fileExt = extFromMime(contentType);
    if (!(await objectExists(BUCKET_PRIVATE, correctionKey(correctionId, fileExt)))) {
      return NextResponse.json({ error: "L'upload du fichier n'a pas fini. Réessaie." }, { status: 400 });
    }

    if (resource.correction) {
      await deleteFromR2(BUCKET_PRIVATE, correctionKey(resource.correction.id, resource.correction.fileExt));
      await prisma.correction.delete({ where: { id: resource.correction.id } });
    }

    const correction = await prisma.correction.create({
      data: { id: correctionId, resourceId, fileExt },
      select: { id: true, fileExt: true },
    });
    return NextResponse.json(correction, { status: 201 });
  } catch (error: any) {
    console.error('Erreur API Admin Corrigés (POST):', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
  }
}
