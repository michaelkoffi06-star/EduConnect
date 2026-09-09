import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFromR2, BUCKET_PRIVATE, privateKey } from '@/lib/r2';

// Protégée par le middleware (voir §7bis de la doc) : /api/admin/** exige une session admin valide.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const type = request.nextUrl.searchParams.get('type');

  if (type !== 'cni' && type !== 'cv') {
    return NextResponse.json({ error: 'Type de document invalide (attendu : cni ou cv).' }, { status: 400 });
  }

  const instructor = await prisma.instructor.findUnique({ where: { id } });
  if (!instructor) {
    return NextResponse.json({ error: 'Instructeur introuvable.' }, { status: 404 });
  }

  const fileName = type === 'cni' ? instructor.cniUrl : instructor.cvUrl;
  if (!fileName) {
    return NextResponse.json({ error: "Ce document n'a pas été fourni." }, { status: 404 });
  }

  const ext = fileName.split('.').pop() || '';
  const key = privateKey(id, type, ext);
  const result = await getFromR2(BUCKET_PRIVATE, key);

  if (!result) {
    return NextResponse.json({ error: 'Fichier introuvable sur le stockage.' }, { status: 404 });
  }

  const contentType = result.contentType || (fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

  return new NextResponse(result.buffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${fileName}"`,
    },
  });
}
