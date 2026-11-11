// Enregistrement et lecture de la progression d'anglais technique (§7duovicies). Côté serveur
// uniquement (accès à la base). Les règles (70 %, critères de fin) sont dans english-chapters.ts.
import { prisma } from '@/lib/prisma';
import {
  CHAPTERS,
  meetsCompletion,
  passingScore,
  summarizeChapter,
  type ChapterInfo,
  type ChapterProgressView,
} from '@/lib/english-chapters';

// Ce que la page d'un chapitre envoie (déjà validé par la route API)
export interface ProgressReport {
  lessons: { lesson: number; score: number }[];
  selfCheck: boolean;
  messageWords: number;
  challenge: boolean;
}

// Crée la ligne si elle n'existe pas encore. Deux envois simultanés peuvent tenter la création en
// même temps : le second échoue sur la contrainte d'unicité (P2002), ce qui n'est pas grave puisque
// la ligne existe alors bel et bien.
async function ensureRow(create: () => Promise<unknown>) {
  try {
    await create();
  } catch (error: any) {
    if (error?.code !== 'P2002') throw error;
  }
}

// Enregistre un avancement. Chaque mise à jour est CONDITIONNELLE (« seulement si c'est mieux ») :
// la base ne garde que le meilleur score et ne retire jamais une réussite, même si deux envois
// arrivent dans le désordre (même principe que startAttempt, §7sedecies).
export async function recordProgress(userId: string, chapter: ChapterInfo, report: ProgressReport): Promise<ChapterProgressView> {
  const now = new Date();
  const c = chapter.number;

  for (const { lesson, score } of report.lessons) {
    const rule = chapter.lessons.find((l) => l.number === lesson)!;
    const passed = score >= passingScore(rule.maxScore);
    const where = { userId, chapter: c, lesson };
    await ensureRow(() =>
      prisma.englishLessonProgress.upsert({
        where: { userId_chapter_lesson: where },
        create: { ...where, bestScore: score, maxScore: rule.maxScore, completedAt: passed ? now : null },
        update: {},
      })
    );
    await prisma.englishLessonProgress.updateMany({
      where: { ...where, bestScore: { lt: score } },
      data: { bestScore: score, maxScore: rule.maxScore },
    });
    if (passed) {
      await prisma.englishLessonProgress.updateMany({ where: { ...where, completedAt: null }, data: { completedAt: now } });
    }
  }

  const chapterWhere = { userId, chapter: c };
  await ensureRow(() =>
    prisma.englishChapterProgress.upsert({
      where: { userId_chapter: chapterWhere },
      create: chapterWhere,
      update: {},
    })
  );
  if (report.selfCheck) {
    await prisma.englishChapterProgress.updateMany({ where: { ...chapterWhere, selfCheckDone: false }, data: { selfCheckDone: true } });
  }
  if (report.messageWords > 0) {
    await prisma.englishChapterProgress.updateMany({
      where: { ...chapterWhere, messageWords: { lt: report.messageWords } },
      data: { messageWords: report.messageWords },
    });
  }
  if (report.challenge) {
    await prisma.englishChapterProgress.updateMany({ where: { ...chapterWhere, challengeDone: false }, data: { challengeDone: true } });
  }

  // Le chapitre est-il terminé ? On relit l'état complet, puis on pose la date une seule fois.
  let view = await readChapter(userId, chapter);
  if (!view.completedAt && meetsCompletion(chapter, view)) {
    await prisma.englishChapterProgress.updateMany({ where: { ...chapterWhere, completedAt: null }, data: { completedAt: now } });
    view = await readChapter(userId, chapter);
  }
  return view;
}

async function readChapter(userId: string, chapter: ChapterInfo): Promise<ChapterProgressView> {
  const [lessonRows, chapterRow] = await Promise.all([
    prisma.englishLessonProgress.findMany({
      where: { userId, chapter: chapter.number },
      select: { lesson: true, bestScore: true, completedAt: true },
    }),
    prisma.englishChapterProgress.findUnique({
      where: { userId_chapter: { userId, chapter: chapter.number } },
      select: { selfCheckDone: true, messageWords: true, challengeDone: true, completedAt: true },
    }),
  ]);
  return summarizeChapter(chapter, lessonRows, chapterRow);
}

// Progression de tous les chapitres d'un compte, en deux requêtes
export async function readAllProgress(userId: string): Promise<ChapterProgressView[]> {
  const [lessonRows, chapterRows] = await Promise.all([
    prisma.englishLessonProgress.findMany({
      where: { userId },
      select: { chapter: true, lesson: true, bestScore: true, completedAt: true },
    }),
    prisma.englishChapterProgress.findMany({
      where: { userId },
      select: { chapter: true, selfCheckDone: true, messageWords: true, challengeDone: true, completedAt: true },
    }),
  ]);
  return CHAPTERS.map((chapter) =>
    summarizeChapter(
      chapter,
      lessonRows.filter((r) => r.chapter === chapter.number),
      chapterRows.find((r) => r.chapter === chapter.number) ?? null
    )
  );
}
