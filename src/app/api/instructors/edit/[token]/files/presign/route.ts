import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getPresignedUploadUrl,
  extFromMime,
  photoKey,
  privateKey,
  BUCKET_PHOTOS,
  BUCKET_PRIVATE,
  MAX_PHOTO_BYTES,
  MAX_DOC_BYTES,
} from '@/lib/r2';
import { rateLimit, HOUR } from '@/lib/rate-limit';

const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_DOC_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

// POST /api/instructors/edit/[token]/files/presign — re-upload depuis le lien secret d'un instructeur.
// Body : { kind: 'photo' | 'cni' | 'cv', contentType: string, size: number }
// Taille bornée et signée avec l'URL, nombre de demandes limité par IP (voir §7sedecies).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const limited = await rateLimit(req, 'presign-profil', 30, HOUR);
  if (limited) return limited;

  try {
    const { token } = await params;
    const instructor = await prisma.instructor.findUnique({ where: { editToken: token }, select: { id: true } });
    if (!instructor) {
      return NextResponse.json({ error: 'Lien invalide ou expiré.' }, { status: 404 });
    }

    const { kind, contentType, size } = await req.json();
    const id = instructor.id;

    const isPhoto = kind === 'photo';
    const isDoc = kind === 'cni' || kind === 'cv';
    if (!isPhoto && !isDoc) {
      return NextResponse.json({ error: 'Type de fichier invalide.' }, { status: 400 });
    }
    if (!(isPhoto ? ALLOWED_PHOTO_TYPES : ALLOWED_DOC_TYPES).includes(contentType)) {
      return NextResponse.json({ error: isPhoto ? 'Type de photo invalide.' : 'Type de document invalide.' }, { status: 400 });
    }
    const maxBytes = isPhoto ? MAX_PHOTO_BYTES : MAX_DOC_BYTES;
    if (!Number.isInteger(size) || size <= 0 || size > maxBytes) {
      return NextResponse.json(
        { error: `Fichier trop volumineux (${isPhoto ? '5' : '10'} Mo maximum).` },
        { status: 400 }
      );
    }

    const key = isPhoto ? photoKey(id, extFromMime(contentType)) : privateKey(id, kind, extFromMime(contentType));
    const uploadUrl = await getPresignedUploadUrl(isPhoto ? BUCKET_PHOTOS : BUCKET_PRIVATE, key, contentType, 300, size);
    return NextResponse.json({ uploadUrl, key }, { status: 200 });
  } catch (error) {
    console.error('Erreur présignature upload (token) :', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
