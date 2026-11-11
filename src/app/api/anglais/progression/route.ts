import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, unauthorized } from '@/lib/user-session';
import { rateLimit, HOUR } from '@/lib/rate-limit';
import { getChapter } from '@/lib/english-chapters';
import { readAllProgress, recordProgress, type ProgressReport } from '@/lib/english-progress';

// Progression d'anglais technique du compte connecté (§7duovicies).
// - GET  : progression de tous les chapitres (page /anglais-technique, et page du chapitre pour
//          savoir si l'apprenant est connecté). 401 si personne n'est connecté.
// - POST : la page d'un chapitre envoie l'avancement de l'apprenant ; le serveur garde le meilleur
//          résultat et décide lui-même si une leçon ou le chapitre est terminé.

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();
  try {
    const chapters = await readAllProgress(user.id);
    return NextResponse.json({ chapters }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Erreur lecture progression anglais :', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}

// Entier compris entre min et max, sinon null
function intIn(value: unknown, min: number, max: number): number | null {
  return Number.isInteger(value) && (value as number) >= min && (value as number) <= max ? (value as number) : null;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();

  // La page envoie au plus un avancement toutes les 1,5 s : 300 par heure laisse de la marge.
  // Limite propre au compte (et à l'IP) : une classe derrière la même connexion ne la partage pas.
  const limited = await rateLimit(req, `progression-anglais:${user.id}`, 300, HOUR);
  if (limited) return limited;

  try {
    const body = await req.json().catch(() => null);
    const chapter = Number.isInteger(body?.chapter) ? getChapter(body.chapter) : undefined;
    if (!chapter || !chapter.href) {
      return NextResponse.json({ error: 'Chapitre inconnu.' }, { status: 400 });
    }

    // Chaque leçon annoncée doit exister et son score rester entre 0 et le nombre d'exercices
    const lessons: ProgressReport['lessons'] = [];
    for (const item of Array.isArray(body?.lessons) ? body.lessons.slice(0, 20) : []) {
      const rule = chapter.lessons.find((l) => l.number === item?.lesson);
      const score = rule ? intIn(item?.score, 0, rule.maxScore) : null;
      if (!rule || score === null) {
        return NextResponse.json({ error: 'Score de leçon invalide.' }, { status: 400 });
      }
      lessons.push({ lesson: rule.number, score });
    }

    const report: ProgressReport = {
      lessons,
      selfCheck: body?.selfCheck === true,
      messageWords: intIn(body?.messageWords, 0, 2000) ?? 0,
      challenge: body?.challenge === true,
    };
    const progress = await recordProgress(user.id, chapter, report);
    return NextResponse.json({ chapter: progress });
  } catch (error) {
    console.error('Erreur enregistrement progression anglais :', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
