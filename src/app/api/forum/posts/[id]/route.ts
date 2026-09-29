import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, unauthorized } from '@/lib/user-session';

// DELETE /api/forum/posts/[id] — l'auteur supprime sa propre réponse
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();
  const { id } = await params;

  const post = await prisma.forumPost.findUnique({ where: { id }, select: { authorId: true, threadId: true, hidden: true } });
  if (!post || post.authorId !== user.id) return NextResponse.json({ error: 'Réponse introuvable.' }, { status: 404 });

  await prisma.$transaction([
    prisma.forumPost.delete({ where: { id } }),
    ...(post.hidden ? [] : [prisma.forumThread.update({ where: { id: post.threadId }, data: { replyCount: { decrement: 1 } } })]),
  ]);
  return NextResponse.json({ success: true });
}
