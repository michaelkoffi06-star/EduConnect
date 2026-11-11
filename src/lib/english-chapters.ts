// Chapitres d'anglais technique et règles de progression (§7duovicies).
// Fichier sans accès à la base : il est utilisé à la fois par le serveur (API de progression)
// et par le navigateur (page /anglais-technique). Ajouter un chapitre = ajouter une entrée ici.

// Une leçon est validée à partir de 70 % de bonnes réponses (décision du 11/11/2026)
export const PASS_RATE = 0.7;

export interface LessonRule {
  number: number;
  title: string;
  maxScore: number; // nombre d'exercices notés dans la page de la leçon
}

export interface ChapterInfo {
  number: number;
  title: string;
  subtitle: string;
  level: string;
  lessonsLabel: string;
  href: string | null; // null : chapitre pas encore en ligne
  free: boolean;
  // Critères de fin, vérifiables par la page du chapitre
  lessons: LessonRule[];
  selfCheck: boolean; // cases « Je peux… » à cocher
  messageMinWords: number; // 0 : pas de message à écrire
  challenge: boolean; // défi à jouer une fois
}

export const CHAPTERS: ChapterInfo[] = [
  {
    number: 1,
    title: 'Introducing Yourself and Your IT Background',
    subtitle: 'Se présenter et parler de son parcours en informatique',
    level: 'A1',
    lessonsLabel: '2 leçons · ≈ 90 min',
    href: '/lecons/chapitre-01/index.html',
    free: true,
    lessons: [
      { number: 1, title: "Hello, I'm Aya", maxScore: 6 },
      { number: 2, title: 'My IT background', maxScore: 6 },
    ],
    selfCheck: true,
    messageMinWords: 30, // message de présentation WhatsApp de la leçon 1 (30 à 50 mots)
    challenge: false,
  },
  {
    number: 2,
    title: 'Building Correct English Sentences',
    subtitle: 'Construire des phrases correctes pour décrire un système',
    level: 'A1 → A2',
    lessonsLabel: '2 leçons',
    href: null, // en ligne dès que ses audios sont enregistrés
    free: true,
    lessons: [
      { number: 1, title: "Our team's laptops", maxScore: 6 },
      { number: 2, title: "It doesn't work!", maxScore: 6 },
    ],
    selfCheck: true,
    messageMinWords: 30,
    challenge: true, // défi « Sentence builder »
  },
];

export function getChapter(number: number): ChapterInfo | undefined {
  return CHAPTERS.find((c) => c.number === number);
}

// Score minimal pour valider une leçon : 70 % arrondi au supérieur (5 sur 6)
export function passingScore(maxScore: number): number {
  return Math.ceil(maxScore * PASS_RATE);
}

// --- Résumé de la progression d'un chapitre (même calcul côté serveur et côté page) ---

export interface LessonProgressView {
  lesson: number;
  title: string;
  bestScore: number;
  maxScore: number;
  passingScore: number;
  passed: boolean;
}

export interface ChapterProgressView {
  chapter: number;
  lessons: LessonProgressView[];
  selfCheckDone: boolean;
  messageWords: number;
  messageMinWords: number;
  challengeDone: boolean;
  completedAt: string | null;
  steps: { done: number; total: number }; // pour la barre de progression
}

export function summarizeChapter(
  chapter: ChapterInfo,
  lessonRows: { lesson: number; bestScore: number; completedAt: Date | string | null }[],
  chapterRow: { selfCheckDone: boolean; messageWords: number; challengeDone: boolean; completedAt: Date | string | null } | null
): ChapterProgressView {
  const lessons = chapter.lessons.map((rule) => {
    const row = lessonRows.find((r) => r.lesson === rule.number);
    const bestScore = row?.bestScore ?? 0;
    return {
      lesson: rule.number,
      title: rule.title,
      bestScore,
      maxScore: rule.maxScore,
      passingScore: passingScore(rule.maxScore),
      passed: Boolean(row?.completedAt),
    };
  });
  const selfCheckDone = chapterRow?.selfCheckDone ?? false;
  const messageWords = chapterRow?.messageWords ?? 0;
  const challengeDone = chapterRow?.challengeDone ?? false;

  // Une étape par leçon, plus une par critère du chapitre
  let total = lessons.length;
  let done = lessons.filter((l) => l.passed).length;
  if (chapter.selfCheck) { total++; if (selfCheckDone) done++; }
  if (chapter.messageMinWords > 0) { total++; if (messageWords >= chapter.messageMinWords) done++; }
  if (chapter.challenge) { total++; if (challengeDone) done++; }

  const completedAt = chapterRow?.completedAt ? new Date(chapterRow.completedAt).toISOString() : null;
  return {
    chapter: chapter.number,
    lessons,
    selfCheckDone,
    messageWords,
    messageMinWords: chapter.messageMinWords,
    challengeDone,
    completedAt,
    steps: { done: completedAt ? total : done, total },
  };
}

// Toutes les conditions de fin remplies ?
export function meetsCompletion(chapter: ChapterInfo, view: ChapterProgressView): boolean {
  return (
    view.lessons.every((l) => l.passed) &&
    (!chapter.selfCheck || view.selfCheckDone) &&
    view.messageWords >= chapter.messageMinWords &&
    (!chapter.challenge || view.challengeDone)
  );
}

// Le chapitre 1 est ouvert à tous ; à partir du chapitre 2, il faut un compte et avoir terminé le
// chapitre précédent. Un chapitre déjà terminé reste toujours ouvert (pour réviser).
export function isChapterUnlocked(number: number, completed: Set<number>, loggedIn: boolean): boolean {
  if (number === 1) return true;
  if (!loggedIn) return false;
  return completed.has(number) || completed.has(number - 1);
}
