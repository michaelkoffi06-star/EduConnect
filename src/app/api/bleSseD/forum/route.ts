export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/admin-permissions';

// Modération du forum (voir §7quindecies) — SUPER_ADMIN et PEDAGOGIE.

const authorForTeam = { select: { firstName: true, lastName: true, email: true, role: true } };

// GET /api/bleSseD/forum — signalements à traiter + derniers sujets publiés
export async function GET(req: NextRequest) {
  const denied = await requireRole(req, ['SUPER_ADMIN', 'PEDAGOGIE']);
  if (denied) return denied;
  try {
    const [reports, threads] = await Promise.all([
      prisma.forumReport.findMany({
        where: { resolved: false },
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: { select: { firstName: true, lastName: true, email: true } },
          thread: { select: { id: true, title: true, body: true, space: true, hidden: true, author: authorForTeam } },
          post: { select: { id: true, body: true, hidden: true, author: authorForTeam } },
        },
      }),
      prisma.forumThread.findMany({
        orderBy: { createdAt: 'desc' },
        take: 40,
        select: {
          id: true,
          title: true,
          space: true,
          hidden: true,
          replyCount: true,
          createdAt: true,
          author: authorForTeam,
          subject: { select: { name: true } },
        },
      }),
    ]);
    return NextResponse.json({ reports, threads });
  } catch (error: any) {
    console.error('Erreur API Admin Forum (GET):', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH /api/bleSseD/forum — { action: 'hide' | 'unhide', threadId, postId? } masque/rétablit un
// sujet ou une réponse (et clôt ses signalements), ou { action: 'dismiss', reportId } classe un
// signalement sans suite.
export async function PATCH(req: NextRequest) {
  const denied = await requireRole(req, ['SUPER_ADMIN', 'PEDAGOGIE']);
  if (denied) return denied;
  try {
    const { action, threadId, postId, reportId } = await req.json().catch(() => ({}));

    if (action === 'dismiss') {
      if (typeof reportId !== 'string') return NextResponse.json({ error: 'Signalement manquant.' }, { status: 400 });
      await prisma.forumReport.update({ where: { id: reportId }, data: { resolved: true } });
      return NextResponse.json({ success: true });
    }

    if (action !== 'hide' && action !== 'unhide') return NextResponse.json({ error: 'Action inconnue.' }, { status: 400 });
    const hidden = action === 'hide';

    if (typeof postId === 'string' && postId) {
      const post = await prisma.forumPost.findUnique({ where: { id: postId }, select: { hidden: true, threadId: true } });
      if (!post) return NextResponse.json({ error: 'Réponse introuvable.' }, { status: 404 });
      if (post.hidden !== hidden) {
        await prisma.$transaction([
          prisma.forumPost.update({ where: { id: postId }, data: { hidden } }),
          prisma.forumThread.update({
            where: { id: post.threadId },
            data: { replyCount: hidden ? { decrement: 1 } : { increment: 1 } },
          }),
        ]);
      }
      if (hidden) await prisma.forumReport.updateMany({ where: { postId }, data: { resolved: true } });
      return NextResponse.json({ success: true });
    }

    if (typeof threadId !== 'string') return NextResponse.json({ error: 'Sujet manquant.' }, { status: 400 });
    await prisma.forumThread.update({ where: { id: threadId }, data: { hidden } });
    if (hidden) await prisma.forumReport.updateMany({ where: { threadId, postId: null }, data: { resolved: true } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'Élément introuvable.' }, { status: 404 });
    console.error('Erreur API Admin Forum (PATCH):', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
