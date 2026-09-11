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
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST /api/register-instructor/presign
// Body : { kind: 'photo' | 'cni' | 'cv', contentType: string, instructorId: string }
// Renvoie une URL R2 présignée vers laquelle le navigateur peut PUT directement le fichier.
export async function POST(req: NextRequest) {
  try {
    const { kind, contentType, instructorId } = await req.json();

    if (!UUID_RE.test(instructorId || '')) {
      return NextResponse.json({ error: 'Identifiant invalide.' }, { status: 400 });
    }

    if (kind === 'photo') {
      if (!ALLOWED_PHOTO_TYPES.includes(contentType)) {
        return NextResponse.json({ error: 'Type de photo invalide.' }, { status: 400 });
      }
      const key = photoKey(instructorId, extFromMime(contentType));
      const uploadUrl = await getPresignedUploadUrl(BUCKET_PHOTOS, key, contentType);
      return NextResponse.json({ uploadUrl, key }, { status: 200 });
    }

    if (kind === 'cni' || kind === 'cv') {
      if (!ALLOWED_DOC_TYPES.includes(contentType)) {
        return NextResponse.json({ error: 'Type de document invalide.' }, { status: 400 });
      }
      const key = privateKey(instructorId, kind, extFromMime(contentType));
      const uploadUrl = await getPresignedUploadUrl(BUCKET_PRIVATE, key, contentType);
      return NextResponse.json({ uploadUrl, key }, { status: 200 });
    }

    return NextResponse.json({ error: 'Type de fichier invalide (attendu : photo, cni, ou cv).' }, { status: 400 });
  } catch (error: any) {
    console.error('Erreur présignature upload :', error);
    return NextResponse.json({ error: 'Erreur serveur.', details: error.message }, { status: 500 });
  }
}
