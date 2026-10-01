import { NextRequest, NextResponse } from 'next/server';
import type { AcademicLevel, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { deleteFromR2, resourceKey, correctionKey, BUCKET_PHOTOS, BUCKET_PRIVATE } from '@/lib/r2';
import { requireRole } from '@/lib/admin-permissions';
import { publicResourceSelect, toPublicResource, resourceSlug } from '@/lib/library';

const LEVELS: AcademicLevel[] = ['PRIMAIRE', 'COLLEGE', 'LYCEE', 'ALL'];

// PATCH /api/bleSseD/resources/[id] — modifier titre, description, niveau, chapitre ou position.
// Le slug n'est pas recalculé quand le titre change, pour ne pas casser les liens déjà partagés ;
// il est seulement créé s'il manque (ressource antérieure à la v2).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireRole(req, ['SUPER_ADMIN', 'PEDAGOGIE']);
  if (denied) return denied;
  try {
    const { id } = await params;
    const current = await prisma.resource.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: 'Ressource introuvable.' }, { status: 404 });
    }

    const body = await req.json();
    const data: Prisma.ResourceUncheckedUpdateInput = {};

    if (body.title !== undefined) {
      if (!String(body.title).trim()) {
        return NextResponse.json({ error: 'Le titre ne peut pas être vide.' }, { status: 400 });
      }
      data.title = String(body.title).trim();
    }
    if (body.description !== undefined) {
      data.description = typeof body.description === 'string' && body.description.trim() ? body.description.trim() : null;
    }
    if (body.level !== undefined) {
      if (!LEVELS.includes(body.level)) {
        return NextResponse.json({ error: 'Niveau invalide.' }, { status: 400 });
      }
      data.level = body.level;
    }
    if (body.position !== undefined && Number.isFinite(Number(body.position))) {
      data.position = Number(body.position);
    }
    if (body.chapterId !== undefined) {
      if (body.chapterId === null || body.chapterId === '') {
        data.chapterId = null;
      } else {
        const chapter = await prisma.chapter.findUnique({ where: { id: body.chapterId } });
        if (!chapter || chapter.subjectId !== current.subjectId) {
          return NextResponse.json({ error: "Ce chapitre n'appartient pas à la matière de la ressource." }, { status: 400 });
        }
        data.chapterId = chapter.id;
      }
    }
    if (!current.slug) {
      data.slug = resourceSlug((data.title as string | undefined) ?? current.title, current.id);
    }

    const resource = await prisma.resource.update({
      where: { id },
      data,
      select: publicResourceSelect,
    });
    return NextResponse.json(toPublicResource(resource), { status: 200 });
  } catch (error: any) {
    console.error('Erreur API Admin Resources (PATCH):', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/bleSseD/resources/[id] — protégé par le middleware (voir §7bis)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireRole(req, ['SUPER_ADMIN', 'PEDAGOGIE']);
  if (denied) return denied;
  try {
    const { id } = await params;
    const resource = await prisma.resource.findUnique({ where: { id }, include: { correction: true } });
    if (!resource) {
      return NextResponse.json({ error: 'Ressource introuvable.' }, { status: 404 });
    }

    if (resource.fileUrl) {
      const ext = resource.fileUrl.split('.').pop();
      if (ext) await deleteFromR2(BUCKET_PHOTOS, resourceKey(id, ext));
    }
    // Le corrigé est supprimé en base par cascade ; son fichier (bucket privé) est effacé ici
    if (resource.correction) {
      await deleteFromR2(BUCKET_PRIVATE, correctionKey(resource.correction.id, resource.correction.fileExt));
    }

    await prisma.resource.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Erreur API Admin Resources (DELETE):', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
