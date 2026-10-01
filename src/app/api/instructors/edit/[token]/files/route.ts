import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  BUCKET_PHOTOS, BUCKET_PRIVATE, photoKey, privateKey, photoPublicUrl,
  extFromMime, objectSize, deleteFromR2, MAX_PHOTO_BYTES, MAX_DOC_BYTES,
} from '@/lib/r2';

// Vérifie qu'un fichier envoyé par le navigateur est bien arrivé sur R2 et respecte la taille
// maximale ; un fichier trop lourd est supprimé (voir §7sedecies).
async function uploadedError(bucket: string, key: string, maxBytes: number, label: string): Promise<string | null> {
  const size = await objectSize(bucket, key);
  if (size === null) return `L'upload ${label} n'a pas fini. Réessaie.`;
  if (size > maxBytes) {
    await deleteFromR2(bucket, key);
    return `Fichier trop volumineux (${label}).`;
  }
  return null;
}

const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_DOC_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

// PATCH /api/instructors/edit/[token]/files
// Le fichier a déjà été uploadé directement vers R2 via /files/presign.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const instructor = await prisma.instructor.findUnique({ where: { editToken: token } });
    if (!instructor) {
      return NextResponse.json({ error: 'Lien invalide ou expiré.' }, { status: 404 });
    }
    const id = instructor.id;

    const { photoType, cniType, cvType } = await req.json();
    if (!photoType && !cniType && !cvType) {
      return NextResponse.json({ error: 'Aucun fichier fourni.' }, { status: 400 });
    }

    const updateData: Record<string, string> = { status: 'PENDING' };

    if (photoType) {
      if (!ALLOWED_PHOTO_TYPES.includes(photoType)) {
        return NextResponse.json({ error: 'Type de photo invalide.' }, { status: 400 });
      }
      const newExt = extFromMime(photoType);
      const newKey = photoKey(id, newExt);
      const photoError = await uploadedError(BUCKET_PHOTOS, newKey, MAX_PHOTO_BYTES, 'de la photo');
      if (photoError) return NextResponse.json({ error: photoError }, { status: 400 });
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
      const cniError = await uploadedError(BUCKET_PRIVATE, newKey, MAX_DOC_BYTES, 'de la CNI');
      if (cniError) return NextResponse.json({ error: cniError }, { status: 400 });
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
      const cvError = await uploadedError(BUCKET_PRIVATE, newKey, MAX_DOC_BYTES, 'du CV');
      if (cvError) return NextResponse.json({ error: cvError }, { status: 400 });
      if (instructor.cvUrl && instructor.cvUrl !== `cv.${newExt}`) {
        const oldExt = instructor.cvUrl.split('.').pop();
        if (oldExt) await deleteFromR2(BUCKET_PRIVATE, privateKey(id, 'cv', oldExt));
      }
      updateData.cvUrl = `cv.${newExt}`;
    }

    const updated = await prisma.instructor.update({ where: { id }, data: updateData });
    return NextResponse.json(updated, { status: 200 });

  } catch (error: any) {
    console.error('Erreur mise a jour fichiers profil (via token) :', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
