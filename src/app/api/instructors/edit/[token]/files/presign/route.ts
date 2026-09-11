import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getPresignedUploadUrl,
  extFromMime,
  photoKey,
  privateKey,
  BUCKET_PHOTOS,
  BUCKET_PRIVATE,
} from '@/lib/r2';

const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_DOC_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

// POST /api/instructors/edit/[token]/files/presign
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const instructor = await prisma.instructor.findUnique({ where: { editToken: token } });
    if (!instructor) {
      return NextResponse.json({ error: 'Lien invalide ou expiré.' }, { status: 404 });
    }

    const { kind, contentType } = await req.json();
    const id = instructor.id;

    if (kind === 'photo') {
      if (!ALLOWED_PHOTO_TYPES.includes(contentType)) {
        return NextResponse.json({ error: 'Type de photo invalide.' }, { status: 400 });
      }
      const key = photoKey(id, extFromMime(contentType));
      const uploadUrl = await getPresignedUploadUrl(BUCKET_PHOTOS, key, contentType);
      return NextResponse.json({ uploadUrl, key }, { status: 200 });
    }

    if (kind === 'cni' || kind === 'cv') {
      if (!ALLOWED_DOC_TYPES.includes(contentType)) {
        return NextResponse.json({ error: 'Type de document invalide.' }, { status: 400 });
      }
      const key = privateKey(id, kind, extFromMime(contentType));
      const uploadUrl = await getPresignedUploadUrl(BUCKET_PRIVATE, key, contentType);
      return NextResponse.json({ uploadUrl, key }, { status: 200 });
    }

    return NextResponse.json({ error: 'Type de fichier invalide.' }, { status: 400 });
  } catch (error: any) {
    console.error('Erreur présignature upload (token) :', error);
    return NextResponse.json({ error: 'Erreur serveur.', details: error.message }, { status: 500 });
  }
}
