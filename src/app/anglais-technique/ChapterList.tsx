"use client";

import { useEffect, useState } from "react";
import { CHAPTERS, isChapterUnlocked, type ChapterInfo, type ChapterProgressView } from "@/lib/english-chapters";

// Liste des chapitres de /anglais-technique avec la progression du compte connecté (§7duovicies) :
// barre de progression, détail des critères, badge « Terminé », chapitres verrouillés.
// La liste s'affiche tout de suite ; la progression arrive ensuite par GET /api/anglais/progression
// (401 = personne n'est connecté).

type Status = "loading" | "anonymous" | "connected" | "error";

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function ProgressDetail({ chapter, view }: { chapter: ChapterInfo; view: ChapterProgressView }) {
  const percent = Math.round((view.steps.done / view.steps.total) * 100);
  const items: { label: string; done: boolean }[] = view.lessons.map((l) => ({
    label: `Leçon ${l.lesson} : ${l.bestScore}/${l.maxScore}${l.passed ? "" : ` (${l.passingScore} pour valider)`}`,
    done: l.passed,
  }));
  if (chapter.selfCheck) items.push({ label: "Cases « Je peux… »", done: view.selfCheckDone });
  if (chapter.messageMinWords > 0) {
    items.push({
      label: `Message : ${Math.min(view.messageWords, view.messageMinWords)}/${view.messageMinWords} mots`,
      done: view.messageWords >= view.messageMinWords,
    });
  }
  if (chapter.challenge) items.push({ label: "Défi joué", done: view.challengeDone });

  return (
    <span className="mt-4 block">
      <span className="flex items-center justify-between text-xs text-gray-500 mb-1">
        <span>Progression</span>
        <span className="font-semibold text-[#0d1b3e]">{percent} %</span>
      </span>
      <span
        className="block h-2 rounded-full bg-[#f1ecdd] overflow-hidden"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progression du chapitre ${chapter.number}`}
      >
        <span className="block h-full rounded-full bg-[#c9951a] transition-all" style={{ width: `${percent}%` }} />
      </span>
      <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
        {items.map((it) => (
          <span key={it.label} className={it.done ? "text-emerald-700" : "text-gray-500"}>
            {it.done ? "✓ " : "○ "}
            {it.label}
          </span>
        ))}
      </span>
    </span>
  );
}

export default function ChapterList() {
  const [status, setStatus] = useState<Status>("loading");
  const [progress, setProgress] = useState<ChapterProgressView[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/anglais/progression", { cache: "no-store" })
      .then(async (res) => {
        if (cancelled) return;
        // 401 : personne n'est connecté. Autre erreur : panne, on ne dit pas « connecte-toi »
        if (res.status === 401) {
          setStatus("anonymous");
          return;
        }
        if (!res.ok) {
          setStatus("error");
          return;
        }
        const data = await res.json();
        setProgress(data.chapters ?? []);
        setStatus("connected");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loggedIn = status === "connected";
  const completed = new Set(progress.filter((p) => p.completedAt).map((p) => p.chapter));

  return (
    <>
      {status === "anonymous" && (
        <p className="mb-4 rounded-2xl bg-[#f6f1e4] px-4 py-3 text-sm text-[#0d1b3e]">
          Le chapitre 1 est ouvert à tous. Pour enregistrer ta progression et débloquer la suite,{" "}
          <a href="/connexion?suite=/anglais-technique" className="font-semibold text-[#8a6510] hover:underline">
            connecte-toi
          </a>{" "}
          ou{" "}
          <a href="/inscription" className="font-semibold text-[#8a6510] hover:underline">
            crée un compte gratuit
          </a>
          .
        </p>
      )}

      {status === "error" && (
        <p className="mb-4 rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
          Ta progression est momentanément indisponible. Réessaie dans quelques instants.
        </p>
      )}

      <ul className="space-y-3">
        {CHAPTERS.map((c) => {
          const view = progress.find((p) => p.chapter === c.number);
          // Pendant le chargement ou en cas de panne, pas de cadenas trompeur : seul le chapitre 1 est cliquable
          const known = status === "connected" || status === "anonymous";
          const unlocked = known && isChapterUnlocked(c.number, completed, loggedIn);
          const open = c.href !== null && (c.number === 1 || unlocked);
          const done = Boolean(view?.completedAt);
          const started = Boolean(view && view.steps.done > 0);

          const header = (
            <>
              <span className="flex flex-wrap items-center gap-2 text-xs font-medium">
                <span className="rounded-full bg-[#f6f1e4] px-2.5 py-0.5 text-[#0d1b3e]">Chapitre {c.number}</span>
                <span className="rounded-full bg-[#f6f1e4] px-2.5 py-0.5 text-[#8a6510]">Niveau {c.level}</span>
                {c.free && <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-emerald-700">Gratuit</span>}
                {done && <span className="rounded-full bg-[#c9951a] px-2.5 py-0.5 text-white">Terminé ✓</span>}
              </span>
              <span className="mt-3 block font-semibold text-[#0d1b3e]">{c.title}</span>
              <span className="mt-1 block text-sm text-gray-600">
                {c.subtitle} · {c.lessonsLabel}
              </span>
            </>
          );

          if (open) {
            return (
              <li key={c.number}>
                <a
                  href={c.href!}
                  className="block bg-white rounded-3xl border border-[#eee6d3] shadow-sm p-6 transition hover:border-[#c9951a]"
                >
                  {header}
                  {loggedIn && view && <ProgressDetail chapter={c} view={view} />}
                  <span className="mt-3 block text-sm font-semibold text-[#c9951a]">
                    {done ? "Réviser →" : started ? "Continuer →" : "Commencer →"}
                  </span>
                </a>
              </li>
            );
          }

          // Chapitre fermé : pas encore en ligne, ou verrouillé
          let message = "Bientôt en ligne.";
          if (!known) message = "";
          else if (!loggedIn) message = `Crée un compte gratuit et termine le chapitre ${c.number - 1} pour l'ouvrir.`;
          else if (!unlocked) message = `Termine le chapitre ${c.number - 1} pour débloquer ce chapitre.`;
          else if (c.href === null) message = "Débloqué : il arrive très bientôt en ligne.";

          return (
            <li key={c.number}>
              <div className="bg-[#faf8f2] rounded-3xl border border-dashed border-[#e2d8bf] p-6 text-gray-500" aria-disabled="true">
                <div className="opacity-70">{header}</div>
                {message && (
                  <p className="mt-3 flex items-center gap-2 text-sm font-medium text-[#8a6510]">
                    {!unlocked && <LockIcon />}
                    {message}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
