import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { publicResourceSelect, toPublicResource } from '@/lib/library';

const LEVELS = ['PRIMAIRE', 'COLLEGE', 'LYCEE'] as const;
const TYPES = ['DOCUMENT', 'VIDEO', 'EXERCICE', 'LIEN'] as const;

// GET /api/resources — liste publique de la bibliothèque.
// Filtres optionnels : subject (slug), level, chapter (id), type, q (recherche texte).
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectSlug = searchParams.get('subject');
    const level = searchParams.get('level');
    const chapterId = searchParams.get('chapter');
    const type = searchParams.get('type');
    const q = searchParams.get('q')?.trim();

    const where: Prisma.ResourceWhereInput = {
      ...(subjectSlug && { subject: { slug: subjectSlug.toLowerCase() } }),
      ...(level && (LEVELS as readonly string[]).includes(level) && {
        level: { in: [level as (typeof LEVELS)[number], 'ALL'] },
      }),
      ...(chapterId && { chapterId }),
      ...(type && (TYPES as readonly string[]).includes(type) && { type: type as (typeof TYPES)[number] }),
      ...(q && {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { chapter: { title: { contains: q, mode: 'insensitive' } } },
          { subject: { name: { contains: q, mode: 'insensitive' } } },
        ],
      }),
    };

    const resources = await prisma.resource.findMany({
      where,
      select: publicResourceSelect,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(resources.map(toPublicResource), { status: 200 });
  } catch (error: any) {
    console.error('Erreur API Resources (public):', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
  }
}
