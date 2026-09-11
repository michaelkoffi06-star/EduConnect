import { NextRequest, NextResponse } from 'next/server';
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

// POST /api/admin/instructors/[id]/files/presign — protégé par le middleware (§7bis)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { kind, contentType } = await req.json();

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
    console.error('Erreur présignature upload (admin) :', error);
    return NextResponse.json({ error: 'Erreur serveur.', details: error.message }, { status: 500 });
  }
}
