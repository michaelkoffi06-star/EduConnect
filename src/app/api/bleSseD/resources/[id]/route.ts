import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deleteFromR2, resourceKey, BUCKET_PHOTOS } from '@/lib/r2';

// DELETE /api/bleSseD/resources/[id] — protégé par le middleware (voir §7bis)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const resource = await prisma.resource.findUnique({ where: { id } });
    if (!resource) {
      return NextResponse.json({ error: 'Ressource introuvable.' }, { status: 404 });
    }

    if (resource.fileUrl) {
      const ext = resource.fileUrl.split('.').pop();
      if (ext) await deleteFromR2(BUCKET_PHOTOS, resourceKey(id, ext));
    }

    await prisma.resource.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Erreur API Admin Resources (DELETE):', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
  }
}
