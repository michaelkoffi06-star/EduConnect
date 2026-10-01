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
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST /api/register-instructor/presign — route PUBLIQUE (inscription d'un nouvel instructeur)
// Body : { kind: 'photo' | 'cni' | 'cv', contentType: string, size: number, instructorId: string }
// Renvoie une URL R2 présignée vers laquelle le navigateur peut PUT directement le fichier.
// Sécurité (voir §7sedecies) :
// - l'identifiant ne doit appartenir à AUCUN instructeur existant (sinon n'importe qui pourrait
//   remplacer la photo, la CNI ou le CV d'un instructeur déjà inscrit, leurs identifiants étant publics) ;
// - la taille du fichier est bornée et signée avec l'URL ;
// - nombre de demandes limité par IP.
export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, 'presign-inscription', 30, HOUR);
  if (limited) return limited;

  try {
    const { kind, contentType, size, instructorId } = await req.json();

    if (typeof instructorId !== 'string' || !UUID_RE.test(instructorId)) {
      return NextResponse.json({ error: 'Identifiant invalide.' }, { status: 400 });
    }

    const existing = await prisma.instructor.findUnique({ where: { id: instructorId }, select: { id: true } });
    if (existing) {
      return NextResponse.json({ error: 'Identifiant invalide.' }, { status: 409 });
    }

    const isPhoto = kind === 'photo';
    const isDoc = kind === 'cni' || kind === 'cv';
    if (!isPhoto && !isDoc) {
      return NextResponse.json({ error: 'Type de fichier invalide (attendu : photo, cni, ou cv).' }, { status: 400 });
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

    const key = isPhoto
      ? photoKey(instructorId, extFromMime(contentType))
      : privateKey(instructorId, kind, extFromMime(contentType));
    const uploadUrl = await getPresignedUploadUrl(isPhoto ? BUCKET_PHOTOS : BUCKET_PRIVATE, key, contentType, 300, size);
    return NextResponse.json({ uploadUrl, key }, { status: 200 });
  } catch (error) {
    console.error('Erreur présignature upload :', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
