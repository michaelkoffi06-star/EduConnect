export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { AcademicLevel, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, unauthorized } from '@/lib/user-session';
import { authorSelect, canRead, canWrite, cleanBody, isPostingTooFast, parseSpace, publicAuthor } from '@/lib/forum';

const PAGE_SIZE = 20;
const LEVELS: AcademicLevel[] = ['PRIMAIRE', 'COLLEGE', 'LYCEE', 'ALL'];

// GET /api/forum/threads?espace=questions|profs&matiere=<subjectId>&q=...&page=1
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const space = parseSpace(params.get('espace') || 'questions');
  if (!space) return NextResponse.json({ error: 'Espace inconnu.' }, { status: 400 });

  const user = await getCurrentUser(req);
  if (!canRead(user, space)) {
    return NextResponse.json({ error: 'La salle des profs est réservée aux instructeurs approuvés.' }, { status: 403 });
  }

  try {
    const page = Math.max(1, Number(params.get('page')) || 1);
    const q = (params.get('q') || '').trim().slice(0, 100);
    const where: Prisma.ForumThreadWhereInput = { space, hidden: false };
    if (params.get('matiere')) where.subjectId = params.get('matiere')!;
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { body: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, threads] = await Promise.all([
      prisma.forumThread.count({ where }),
      prisma.forumThread.findMany({
        where,
        orderBy: { lastActivityAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          title: true,
          body: true,
          level: true,
          replyCount: true,
          lastActivityAt: true,
          createdAt: true,
          subject: { select: { id: true, name: true } },
          author: { select: authorSelect },
        },
      }),
    ]);

    return NextResponse.json({
      total,
      pageSize: PAGE_SIZE,
      canWrite: canWrite(user, space),
      threads: threads.map((t) => ({
        ...t,
        body: t.body.length > 220 ? `${t.body.slice(0, 220)}…` : t.body,
        author: publicAuthor(t.author),
      })),
    });
  } catch (error: any) {
    console.error('Erreur API Forum (liste):', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/forum/threads — nouveau sujet { espace, title, body, subjectId?, level? }
export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();

  try {
    const body = await req.json().catch(() => ({}));
    const space = parseSpace(body.espace || 'questions');
    if (!space) return NextResponse.json({ error: 'Espace inconnu.' }, { status: 400 });
    if (!canWrite(user, space)) {
      return NextResponse.json({ error: 'La salle des profs est réservée aux instructeurs approuvés.' }, { status: 403 });
    }
    if (await isPostingTooFast(user.id)) {
      return NextResponse.json({ error: 'Tu publies beaucoup en peu de temps. Patiente quelques minutes.' }, { status: 429 });
    }

    const title = cleanBody(body.title, 150);
    const text = cleanBody(body.body);
    if (title.length < 5) return NextResponse.json({ error: 'Le titre doit faire au moins 5 caractères.' }, { status: 400 });
    if (text.length < 10) return NextResponse.json({ error: 'Détaille un peu plus ta question (10 caractères minimum).' }, { status: 400 });

    const thread = await prisma.forumThread.create({
      data: {
        space,
        title,
        body: text,
        subjectId: typeof body.subjectId === 'string' && body.subjectId ? body.subjectId : null,
        level: LEVELS.includes(body.level) ? body.level : null,
        authorId: user.id,
      },
      select: { id: true },
    });
    return NextResponse.json(thread, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2003') return NextResponse.json({ error: 'Matière introuvable.' }, { status: 400 });
    console.error('Erreur API Forum (nouveau sujet):', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
