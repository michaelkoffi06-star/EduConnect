import { NextRequest, NextResponse } from 'next/server';
import {
  getPresignedUploadUrl,
  extFromMime,
  resourceKey,
  BUCKET_PHOTOS,
} from '@/lib/r2';
import { requireRole } from '@/lib/admin-permissions';

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

// POST /api/bleSseD/resources/presign — protégé par le middleware (voir §7bis)
export async function POST(req: NextRequest) {
  const denied = requireRole(req, ['SUPER_ADMIN', 'PEDAGOGIE']);
  if (denied) return denied;
  try {
    const { resourceId, contentType } = await req.json();

    if (!resourceId || !ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
    }

    const key = resourceKey(resourceId, extFromMime(contentType));
    const uploadUrl = await getPresignedUploadUrl(BUCKET_PHOTOS, key, contentType);

    return NextResponse.json({ uploadUrl, key }, { status: 200 });
  } catch (error: any) {
    console.error('Erreur présignature ressource :', error);
    return NextResponse.json({ error: 'Erreur serveur.', details: error.message }, { status: 500 });
  }
}
