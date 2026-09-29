export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, unauthorized } from '@/lib/user-session';
import { authorSelect, canRead, canWrite, publicAuthor } from '@/lib/forum';

// GET /api/forum/threads/[id] — un sujet et ses réponses visibles
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser(req);
  try {
    const thread = await prisma.forumThread.findUnique({
      where: { id },
      select: {
        id: true,
        space: true,
        title: true,
        body: true,
        level: true,
        hidden: true,
        createdAt: true,
        subject: { select: { id: true, name: true } },
        author: { select: authorSelect },
        posts: {
          where: { hidden: false },
          orderBy: { createdAt: 'asc' },
          select: { id: true, body: true, createdAt: true, author: { select: authorSelect } },
        },
      },
    });
    if (!thread || thread.hidden) return NextResponse.json({ error: 'Sujet introuvable.' }, { status: 404 });
    if (!canRead(user, thread.space)) {
      return NextResponse.json({ error: 'La salle des profs est réservée aux instructeurs approuvés.' }, { status: 403 });
    }

    return NextResponse.json({
      canWrite: canWrite(user, thread.space),
      currentUserId: user?.id ?? null,
      thread: {
        id: thread.id,
        space: thread.space,
        title: thread.title,
        body: thread.body,
        level: thread.level,
        createdAt: thread.createdAt,
        subject: thread.subject,
        author: publicAuthor(thread.author),
      },
      posts: thread.posts.map((p) => ({ ...p, author: publicAuthor(p.author) })),
    });
  } catch (error: any) {
    console.error('Erreur API Forum (sujet):', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/forum/threads/[id] — l'auteur supprime son propre sujet (et ses réponses)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();
  const { id } = await params;
  const { count } = await prisma.forumThread.deleteMany({ where: { id, authorId: user.id } });
  if (count === 0) return NextResponse.json({ error: 'Sujet introuvable.' }, { status: 404 });
  return NextResponse.json({ success: true });
}
