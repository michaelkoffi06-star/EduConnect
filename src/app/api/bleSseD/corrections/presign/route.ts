import { NextRequest, NextResponse } from 'next/server';
import { BUCKET_PRIVATE, correctionKey, extFromMime, getPresignedUploadUrl } from '@/lib/r2';
import { requireRole } from '@/lib/admin-permissions';

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST /api/bleSseD/corrections/presign — URL d'upload direct navigateur → R2 (bucket privé)
// pour le fichier d'un corrigé (voir §7septies et §7quindecies)
export async function POST(req: NextRequest) {
  const denied = await requireRole(req, ['SUPER_ADMIN', 'PEDAGOGIE', 'ADMINISTRATIF']);
  if (denied) return denied;
  try {
    const { correctionId, contentType } = await req.json();
    if (!UUID_RE.test(correctionId || '') || !ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
    }
    const key = correctionKey(correctionId, extFromMime(contentType));
    const uploadUrl = await getPresignedUploadUrl(BUCKET_PRIVATE, key, contentType);
    return NextResponse.json({ uploadUrl, key });
  } catch (error: any) {
    console.error('Erreur présignature corrigé :', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
