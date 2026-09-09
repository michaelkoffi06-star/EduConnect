import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadToR2, deleteFromR2, BUCKET_PHOTOS, BUCKET_PRIVATE, photoKey, privateKey, photoPublicUrl } from '@/lib/r2';

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const MAX_DOC_SIZE = 10 * 1024 * 1024;
const MIN_PHOTO_DIMENSION = 800;
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_DOC_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

function extFromMime(mime: string) {
  if (mime === 'application/pdf') return 'pdf';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

function getImageDimensions(buffer: Buffer, mimeType: string): { width: number; height: number } | null {
  try {
    if (mimeType === 'image/png') {
      if (buffer.length < 24) return null;
      return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
    }
    if (mimeType === 'image/jpeg') {
      let offset = 2;
      while (offset < buffer.length - 8) {
        if (buffer[offset] !== 0xff) { offset++; continue; }
        const marker = buffer[offset + 1];
        const isSOF = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
        if (isSOF) return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
        const segmentLength = buffer.readUInt16BE(offset + 2);
        offset += 2 + segmentLength;
      }
      return null;
    }
    if (mimeType === 'image/webp') {
      const fourCC = buffer.toString('ascii', 12, 16);
      if (fourCC === 'VP8 ') return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
      if (fourCC === 'VP8L') {
        const bits = buffer.readUInt32LE(21);
        return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
      }
      if (fourCC === 'VP8X') {
        const width = (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16)) + 1;
        const height = (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16)) + 1;
        return { width, height };
      }
      return null;
    }
    return null;
  } catch {
    return null;
  }
}

// PATCH /api/instructors/edit/[token]/files
// Permet à l'instructeur lui-même (via son lien secret) de remplacer sa photo/CNI/CV.
// Toute modification repasse le profil en PENDING, comme pour les champs texte.
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

    const formData = await req.formData();
    const photo = formData.get('photo') as File | null;
    const cni = formData.get('cni') as File | null;
    const cv = formData.get('cv') as File | null;

    if (!photo && !cni && !cv) {
      return NextResponse.json({ error: 'Aucun fichier fourni.' }, { status: 400 });
    }

    const id = instructor.id;
    const updateData: Record<string, string> = { status: 'PENDING' };

    if (photo) {
      if (!ALLOWED_PHOTO_TYPES.includes(photo.type) || photo.size > MAX_PHOTO_SIZE) {
        return NextResponse.json({ error: 'Photo invalide (JPEG/PNG/WebP, 5 Mo max).' }, { status: 400 });
      }
      const photoBuffer = Buffer.from(await photo.arrayBuffer());
      const dimensions = getImageDimensions(photoBuffer, photo.type);
      if (!dimensions || dimensions.width < MIN_PHOTO_DIMENSION || dimensions.height < MIN_PHOTO_DIMENSION) {
        return NextResponse.json({
          error: `Photo trop petite${dimensions ? ` : ${dimensions.width}x${dimensions.height}px` : ''}, minimum ${MIN_PHOTO_DIMENSION}x${MIN_PHOTO_DIMENSION}px.`
        }, { status: 400 });
      }

      const newExt = extFromMime(photo.type);
      const newKey = photoKey(id, newExt);
      if (instructor.photoUrl && !instructor.photoUrl.endsWith(`${id}.${newExt}`)) {
        const oldExt = instructor.photoUrl.split('.').pop();
        if (oldExt) await deleteFromR2(BUCKET_PHOTOS, photoKey(id, oldExt));
      }
      await uploadToR2(BUCKET_PHOTOS, newKey, photoBuffer, photo.type);
      updateData.photoUrl = photoPublicUrl(newKey);
    }

    if (cni) {
      if (!ALLOWED_DOC_TYPES.includes(cni.type) || cni.size > MAX_DOC_SIZE) {
        return NextResponse.json({ error: 'CNI invalide (JPEG/PNG/PDF, 10 Mo max).' }, { status: 400 });
      }
      const cniBuffer = Buffer.from(await cni.arrayBuffer());
      const cniExt = extFromMime(cni.type);
      if (instructor.cniUrl && instructor.cniUrl !== `cni.${cniExt}`) {
        const oldExt = instructor.cniUrl.split('.').pop();
        if (oldExt) await deleteFromR2(BUCKET_PRIVATE, privateKey(id, 'cni', oldExt));
      }
      await uploadToR2(BUCKET_PRIVATE, privateKey(id, 'cni', cniExt), cniBuffer, cni.type);
      updateData.cniUrl = `cni.${cniExt}`;
    }

    if (cv) {
      if (!ALLOWED_DOC_TYPES.includes(cv.type) || cv.size > MAX_DOC_SIZE) {
        return NextResponse.json({ error: 'CV invalide (JPEG/PNG/PDF, 10 Mo max).' }, { status: 400 });
      }
      const cvBuffer = Buffer.from(await cv.arrayBuffer());
      const cvExt = extFromMime(cv.type);
      if (instructor.cvUrl && instructor.cvUrl !== `cv.${cvExt}`) {
        const oldExt = instructor.cvUrl.split('.').pop();
        if (oldExt) await deleteFromR2(BUCKET_PRIVATE, privateKey(id, 'cv', oldExt));
      }
      await uploadToR2(BUCKET_PRIVATE, privateKey(id, 'cv', cvExt), cvBuffer, cv.type);
      updateData.cvUrl = `cv.${cvExt}`;
    }

    const updated = await prisma.instructor.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated, { status: 200 });

  } catch (error: any) {
    console.error('Erreur mise à jour fichiers profil (via token) :', error);
    return NextResponse.json({ error: 'Erreur serveur.', details: error.message }, { status: 500 });
  }
}
