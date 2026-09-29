import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, unauthorized } from '@/lib/user-session';
import { canRead } from '@/lib/forum';

// POST /api/forum/signalements — signaler un sujet (threadId) ou une réponse (threadId + postId).
// Un même compte ne signale qu'une fois le même message ; l'équipe traite depuis son panneau.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();

  try {
    const body = await req.json().catch(() => ({}));
    const threadId = typeof body.threadId === 'string' ? body.threadId : '';
    const postId = typeof body.postId === 'string' && body.postId ? body.postId : null;
    const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 300) || null : null;

    const thread = await prisma.forumThread.findUnique({ where: { id: threadId }, select: { space: true } });
    if (!thread || !canRead(user, thread.space)) return NextResponse.json({ error: 'Sujet introuvable.' }, { status: 404 });
    if (postId) {
      const post = await prisma.forumPost.findUnique({ where: { id: postId }, select: { threadId: true } });
      if (!post || post.threadId !== threadId) return NextResponse.json({ error: 'Réponse introuvable.' }, { status: 404 });
    }

    const already = await prisma.forumReport.findFirst({ where: { threadId, postId, reporterId: user.id } });
    if (!already) {
      await prisma.forumReport.create({ data: { threadId, postId, reporterId: user.id, reason } });
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error: any) {
    console.error('Erreur API Forum (signalement):', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
