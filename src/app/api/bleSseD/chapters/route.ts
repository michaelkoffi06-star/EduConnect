export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { AcademicLevel } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/admin-permissions';
import { slugify } from '@/lib/library';

const LEVELS: AcademicLevel[] = ['PRIMAIRE', 'COLLEGE', 'LYCEE', 'ALL'];

// GET /api/bleSseD/chapters — liste des chapitres (classeurs) de la bibliothèque
export async function GET(request: NextRequest) {
  const denied = await requireRole(request, ['SUPER_ADMIN', 'PEDAGOGIE', 'ADMINISTRATIF']);
  if (denied) return denied;
  try {
    const chapters = await prisma.chapter.findMany({
      include: {
        subject: { select: { id: true, name: true, slug: true } },
        _count: { select: { resources: true } },
      },
      orderBy: [{ subject: { name: 'asc' } }, { order: 'asc' }, { title: 'asc' }],
    });
    return NextResponse.json(chapters, { status: 200 });
  } catch (error: any) {
    console.error('Erreur API Admin Chapters (GET):', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/bleSseD/chapters — création d'un chapitre
export async function POST(request: NextRequest) {
  const denied = await requireRole(request, ['SUPER_ADMIN', 'PEDAGOGIE']);
  if (denied) return denied;
  try {
    const { title, subjectId, level, classe, order } = await request.json();

    if (!title?.trim() || !subjectId || !LEVELS.includes(level)) {
      return NextResponse.json({ error: 'Titre, matière et niveau sont obligatoires.' }, { status: 400 });
    }

    const cleanClasse = typeof classe === 'string' && classe.trim() ? classe.trim() : null;
    const slug = slugify(cleanClasse ? `${title} ${cleanClasse}` : title) || 'chapitre';

    const existing = await prisma.chapter.findUnique({ where: { subjectId_slug: { subjectId, slug } } });
    if (existing) {
      return NextResponse.json({ error: 'Ce chapitre existe déjà pour cette matière et cette classe.' }, { status: 409 });
    }

    const chapter = await prisma.chapter.create({
      data: {
        title: title.trim(),
        slug,
        subjectId,
        level,
        classe: cleanClasse,
        order: Number.isFinite(Number(order)) ? Number(order) : 0,
      },
      include: {
        subject: { select: { id: true, name: true, slug: true } },
        _count: { select: { resources: true } },
      },
    });
    return NextResponse.json(chapter, { status: 201 });
  } catch (error: any) {
    console.error('Erreur API Admin Chapters (POST):', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
