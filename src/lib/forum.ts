import type { ForumSpace, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { displayName, isApprovedInstructor, type CurrentUser } from '@/lib/user-session';

// Forum (voir §7quindecies de la doc).
// - QUESTIONS : lecture publique ; tout compte connecté peut poser une question ou répondre.
// - SALLE_DES_PROFS : lecture et écriture réservées aux instructeurs approuvés.
// Les messages sont publiés immédiatement ; un signalement les fait remonter à l'équipe,
// qui peut les masquer.

export function parseSpace(raw: unknown): ForumSpace | null {
  if (raw === 'questions' || raw === 'QUESTIONS') return 'QUESTIONS';
  if (raw === 'profs' || raw === 'SALLE_DES_PROFS') return 'SALLE_DES_PROFS';
  return null;
}

export function canRead(user: CurrentUser | null, space: ForumSpace): boolean {
  return space === 'QUESTIONS' || isApprovedInstructor(user);
}

export function canWrite(user: CurrentUser | null, space: ForumSpace): boolean {
  if (!user) return false;
  return space === 'QUESTIONS' || isApprovedInstructor(user);
}

export const authorSelect = {
  id: true,
  firstName: true,
  lastName: true,
  role: true,
  instructor: { select: { status: true } },
} satisfies Prisma.UserSelect;

type AuthorRow = Prisma.UserGetPayload<{ select: typeof authorSelect }>;

// Auteur tel qu'affiché : « Awa K. », avec un badge Instructeur seulement si la fiche est approuvée
export function publicAuthor(a: AuthorRow) {
  const badge =
    a.role === 'INSTRUCTEUR' ? (a.instructor?.status === 'APPROVED' ? 'Instructeur' : 'Membre') : a.role === 'PARENT' ? 'Parent' : 'Élève';
  return { id: a.id, name: displayName(a), badge };
}

// Limite anti-spam : 8 messages (sujets + réponses) par compte sur 10 minutes
export async function isPostingTooFast(userId: string): Promise<boolean> {
  const since = new Date(Date.now() - 10 * 60 * 1000);
  const [threads, posts] = await Promise.all([
    prisma.forumThread.count({ where: { authorId: userId, createdAt: { gte: since } } }),
    prisma.forumPost.count({ where: { authorId: userId, createdAt: { gte: since } } }),
  ]);
  return threads + posts >= 8;
}

export function cleanBody(raw: unknown, max = 5000): string {
  return typeof raw === 'string' ? raw.trim().slice(0, max) : '';
}
