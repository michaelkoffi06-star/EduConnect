import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, unauthorized } from '@/lib/user-session';
import { authorSelect, canWrite, cleanBody, isPostingTooFast, publicAuthor } from '@/lib/forum';

// POST /api/forum/threads/[id]/posts — répondre à un sujet { body }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    const thread = await prisma.forumThread.findUnique({ where: { id }, select: { space: true, hidden: true } });
    if (!thread || thread.hidden) return NextResponse.json({ error: 'Sujet introuvable.' }, { status: 404 });
    if (!canWrite(user, thread.space)) {
      return NextResponse.json({ error: 'La salle des profs est réservée aux instructeurs approuvés.' }, { status: 403 });
    }
    if (await isPostingTooFast(user.id)) {
      return NextResponse.json({ error: 'Tu publies beaucoup en peu de temps. Patiente quelques minutes.' }, { status: 429 });
    }

    const body = cleanBody((await req.json().catch(() => ({}))).body);
    if (body.length < 2) return NextResponse.json({ error: 'La réponse est vide.' }, { status: 400 });

    const [post] = await prisma.$transaction([
      prisma.forumPost.create({
        data: { threadId: id, authorId: user.id, body },
        select: { id: true, body: true, createdAt: true, author: { select: authorSelect } },
      }),
      prisma.forumThread.update({
        where: { id },
        data: { replyCount: { increment: 1 }, lastActivityAt: new Date() },
      }),
    ]);
    return NextResponse.json({ ...post, author: publicAuthor(post.author) }, { status: 201 });
  } catch (error: any) {
    console.error('Erreur API Forum (réponse):', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
