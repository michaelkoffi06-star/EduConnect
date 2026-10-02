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
import { requireRole } from '@/lib/admin-permissions';

const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_DOC_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

// POST /api/bleSseD/instructors/[id]/files/presign — protégé par le middleware (§7bis)
// Réservé à SUPER_ADMIN ; taille signée dans l'URL et revérifiée à la finalisation (§7sedecies).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireRole(req, ['SUPER_ADMIN']);
  if (denied) return denied;
  try {
    const { id } = await params;
    const { kind, contentType, size } = await req.json();

    const instructor = await prisma.instructor.findUnique({ where: { id }, select: { id: true } });
    if (!instructor) {
      return NextResponse.json({ error: 'Instructeur introuvable.' }, { status: 404 });
    }
    const maxBytes = kind === 'photo' ? MAX_PHOTO_BYTES : MAX_DOC_BYTES;
    if (!Number.isInteger(size) || size <= 0 || size > maxBytes) {
      return NextResponse.json(
        { error: `Fichier trop volumineux (${kind === 'photo' ? '5' : '10'} Mo maximum).` },
        { status: 400 }
      );
    }

    if (kind === 'photo') {
      if (!ALLOWED_PHOTO_TYPES.includes(contentType)) {
        return NextResponse.json({ error: 'Type de photo invalide.' }, { status: 400 });
      }
      const key = photoKey(id, extFromMime(contentType));
      const uploadUrl = await getPresignedUploadUrl(BUCKET_PHOTOS, key, contentType, 300, size);
      return NextResponse.json({ uploadUrl, key }, { status: 200 });
    }

    if (kind === 'cni' || kind === 'cv') {
      if (!ALLOWED_DOC_TYPES.includes(contentType)) {
        return NextResponse.json({ error: 'Type de document invalide.' }, { status: 400 });
      }
      const key = privateKey(id, kind, extFromMime(contentType));
      const uploadUrl = await getPresignedUploadUrl(BUCKET_PRIVATE, key, contentType, 300, size);
      return NextResponse.json({ uploadUrl, key }, { status: 200 });
    }

    return NextResponse.json({ error: 'Type de fichier invalide.' }, { status: 400 });
  } catch (error: any) {
    console.error('Erreur présignature upload (admin) :', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
