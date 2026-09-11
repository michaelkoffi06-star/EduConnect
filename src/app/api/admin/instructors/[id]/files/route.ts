import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  BUCKET_PHOTOS, BUCKET_PRIVATE, photoKey, privateKey, photoPublicUrl,
  extFromMime, objectExists, deleteFromR2,
} from '@/lib/r2';

const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_DOC_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

// PATCH /api/admin/instructors/[id]/files
// Le fichier a déjà été uploadé directement vers R2 via /files/presign.
// Cette route vérifie son existence puis met à jour la fiche instructeur.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const instructor = await prisma.instructor.findUnique({ where: { id } });
    if (!instructor) {
      return NextResponse.json({ error: 'Instructeur introuvable.' }, { status: 404 });
    }

    const { photoType, cniType, cvType } = await req.json();

    if (!photoType && !cniType && !cvType) {
      return NextResponse.json({ error: 'Aucun fichier fourni.' }, { status: 400 });
    }

    const updateData: Record<string, string> = {};

    if (photoType) {
      if (!ALLOWED_PHOTO_TYPES.includes(photoType)) {
        return NextResponse.json({ error: 'Type de photo invalide.' }, { status: 400 });
      }
      const newExt = extFromMime(photoType);
      const newKey = photoKey(id, newExt);
      if (!(await objectExists(BUCKET_PHOTOS, newKey))) {
        return NextResponse.json({ error: "L'upload de la photo n'a pas fini. Réessaie." }, { status: 400 });
      }
      if (instructor.photoUrl && !instructor.photoUrl.endsWith(`${id}.${newExt}`)) {
        const oldExt = instructor.photoUrl.split('.').pop();
        if (oldExt) await deleteFromR2(BUCKET_PHOTOS, photoKey(id, oldExt));
      }
      updateData.photoUrl = photoPublicUrl(newKey);
    }

    if (cniType) {
      if (!ALLOWED_DOC_TYPES.includes(cniType)) {
        return NextResponse.json({ error: 'Type de CNI invalide.' }, { status: 400 });
      }
      const newExt = extFromMime(cniType);
      const newKey = privateKey(id, 'cni', newExt);
      if (!(await objectExists(BUCKET_PRIVATE, newKey))) {
        return NextResponse.json({ error: "L'upload de la CNI n'a pas fini. Réessaie." }, { status: 400 });
      }
      if (instructor.cniUrl && instructor.cniUrl !== `cni.${newExt}`) {
        const oldExt = instructor.cniUrl.split('.').pop();
        if (oldExt) await deleteFromR2(BUCKET_PRIVATE, privateKey(id, 'cni', oldExt));
      }
      updateData.cniUrl = `cni.${newExt}`;
    }

    if (cvType) {
      if (!ALLOWED_DOC_TYPES.includes(cvType)) {
        return NextResponse.json({ error: 'Type de CV invalide.' }, { status: 400 });
      }
      const newExt = extFromMime(cvType);
      const newKey = privateKey(id, 'cv', newExt);
      if (!(await objectExists(BUCKET_PRIVATE, newKey))) {
        return NextResponse.json({ error: "L'upload du CV n'a pas fini. Réessaie." }, { status: 400 });
      }
      if (instructor.cvUrl && instructor.cvUrl !== `cv.${newExt}`) {
        const oldExt = instructor.cvUrl.split('.').pop();
        if (oldExt) await deleteFromR2(BUCKET_PRIVATE, privateKey(id, 'cv', oldExt));
      }
      updateData.cvUrl = `cv.${newExt}`;
    }

    const updated = await prisma.instructor.update({ where: { id }, data: updateData });
    return NextResponse.json(updated, { status: 200 });

  } catch (error: any) {
    console.error('Erreur mise a jour fichiers instructeur (admin) :', error);
    return NextResponse.json({ error: 'Erreur serveur.', details: error.message }, { status: 500 });
  }
}
