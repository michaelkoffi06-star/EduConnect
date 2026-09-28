import { NextRequest, NextResponse } from 'next/server';
import type { AcademicLevel, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/admin-permissions';
import { slugify } from '@/lib/library';

const LEVELS: AcademicLevel[] = ['PRIMAIRE', 'COLLEGE', 'LYCEE', 'ALL'];

// PATCH /api/bleSseD/chapters/[id] — modifier titre, classe, niveau ou ordre.
// La matière d'un chapitre ne change pas (ses ressources y sont rattachées).
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = requireRole(request, ['SUPER_ADMIN', 'PEDAGOGIE']);
  if (denied) return denied;
  try {
    const { id } = await params;
    const current = await prisma.chapter.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: 'Chapitre introuvable.' }, { status: 404 });
    }

    const body = await request.json();
    const data: Prisma.ChapterUpdateInput = {};

    if (body.title !== undefined) {
      if (!String(body.title).trim()) {
        return NextResponse.json({ error: 'Le titre ne peut pas être vide.' }, { status: 400 });
      }
      data.title = String(body.title).trim();
    }
    if (body.classe !== undefined) {
      data.classe = typeof body.classe === 'string' && body.classe.trim() ? body.classe.trim() : null;
    }
    if (body.level !== undefined) {
      if (!LEVELS.includes(body.level)) {
        return NextResponse.json({ error: 'Niveau invalide.' }, { status: 400 });
      }
      data.level = body.level;
    }
    if (body.order !== undefined && Number.isFinite(Number(body.order))) {
      data.order = Number(body.order);
    }

    // Le slug suit le titre et la classe
    if (data.title !== undefined || data.classe !== undefined) {
      const title = (data.title as string | undefined) ?? current.title;
      const classe = data.classe !== undefined ? (data.classe as string | null) : current.classe;
      const slug = slugify(classe ? `${title} ${classe}` : title) || 'chapitre';
      if (slug !== current.slug) {
        const clash = await prisma.chapter.findUnique({
          where: { subjectId_slug: { subjectId: current.subjectId, slug } },
        });
        if (clash) {
          return NextResponse.json({ error: 'Un chapitre identique existe déjà pour cette matière.' }, { status: 409 });
        }
        data.slug = slug;
      }
    }

    const chapter = await prisma.chapter.update({
      where: { id },
      data,
      include: {
        subject: { select: { id: true, name: true, slug: true } },
        _count: { select: { resources: true } },
      },
    });
    return NextResponse.json(chapter, { status: 200 });
  } catch (error: any) {
    console.error('Erreur API Admin Chapters (PATCH):', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
  }
}

// DELETE /api/bleSseD/chapters/[id] — supprime le chapitre ; ses ressources sont conservées
// et simplement détachées (chapterId passe à null, voir le schéma).
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = requireRole(request, ['SUPER_ADMIN', 'PEDAGOGIE']);
  if (denied) return denied;
  try {
    const { id } = await params;
    await prisma.chapter.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Chapitre introuvable.' }, { status: 404 });
    }
    console.error('Erreur API Admin Chapters (DELETE):', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
  }
}
