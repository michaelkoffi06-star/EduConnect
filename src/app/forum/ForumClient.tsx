"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ErrorBox,
  Icon,
  InfoBox,
  PageHero,
  SkeletonCards,
  cardClass,
  inputClass,
  labelClass,
  primaryBtn,
  smallBtn,
  useAccount,
} from "@/components/compte/ui";
import { AuthorLine, LEVEL_LABELS, type ForumAuthor, type Space } from "@/components/forum/shared";

// Forum : « Questions » (lecture publique, écriture pour tout compte connecté) et
// « Salle des profs » (instructeurs approuvés uniquement). Voir §7quindecies de la doc.

interface Subject { id: string; name: string; }
interface ThreadRow {
  id: string;
  title: string;
  body: string;
  level: string | null;
  replyCount: number;
  lastActivityAt: string;
  createdAt: string;
  subject: Subject | null;
  author: ForumAuthor;
}

function NewThreadForm({ space, subjects, onCreated, onCancel }: { space: Space; subjects: Subject[]; onCreated: (id: string) => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [level, setLevel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/forum/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ espace: space, title, body, subjectId, level }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onCreated(data.id);
    } catch (err: any) {
      setError(err.message || "Impossible de publier.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className={`${cardClass} space-y-4 animate-fade-blur`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-bold text-[#0d1b3e]">
          <span className="w-9 h-9 rounded-xl bg-[#c9951a] text-white flex items-center justify-center">{Icon.pen(18)}</span>
          {space === "profs" ? "Nouvelle discussion" : "Nouvelle question"}
        </h2>
        <button type="button" onClick={onCancel} className="text-sm text-gray-500 hover:text-[#0d1b3e]">Annuler</button>
      </div>
      <div>
        <label className={labelClass} htmlFor="title">{space === "profs" ? "Sujet" : "Ta question en une phrase"}</label>
        <input id="title" required minLength={5} maxLength={150} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={space === "profs" ? "Comment motiver un élève de Tle qui décroche ?" : "Comment calculer l'hypoténuse d'un triangle rectangle ?"} className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="subject">Matière</label>
          <select id="subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={inputClass}>
            <option value="">Aucune / générale</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="level">Niveau</label>
          <select id="level" value={level} onChange={(e) => setLevel(e.target.value)} className={inputClass}>
            <option value="">Non précisé</option>
            {["PRIMAIRE", "COLLEGE", "LYCEE"].map((l) => <option key={l} value={l}>{LEVEL_LABELS[l]}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className={labelClass} htmlFor="body">Détails</label>
        <textarea id="body" required minLength={10} maxLength={5000} rows={6} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Explique ce que tu as déjà essayé, là où tu bloques…" className={`${inputClass} resize-y`} />
      </div>
      <p className="text-xs text-gray-500">
        Reste poli et bienveillant. Ne partage ni numéro de téléphone ni adresse : les messages sont publics
        {space === "profs" ? " pour les instructeurs" : ""} et peuvent être signalés à l&apos;équipe.
      </p>
      {error && <ErrorBox>{error}</ErrorBox>}
      <button type="submit" disabled={busy} className={primaryBtn}>{busy ? "Publication..." : "Publier"}</button>
    </form>
  );
}

export default function ForumClient() {
  const { user, loading: accountLoading } = useAccount();
  const [space, setSpace] = useState<Space>("questions");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [canWrite, setCanWrite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [writing, setWriting] = useState(false);
  const [listKey, setListKey] = useState(0);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("espace") === "profs") setSpace("profs");
    fetch("/api/subjects").then((r) => r.json()).then(setSubjects).catch(() => {});
  }, []);

  const load = useCallback(
    async (nextPage: number) => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ espace: space, page: String(nextPage) });
        if (subjectId) params.set("matiere", subjectId);
        if (q) params.set("q", q);
        const res = await fetch(`/api/forum/threads?${params}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setThreads((prev) => (nextPage === 1 ? data.threads : [...prev, ...data.threads]));
        setTotal(data.total);
        setCanWrite(data.canWrite);
        setPage(nextPage);
        // Nouvelle liste (filtre, espace) : on rejoue l'apparition en cascade
        if (nextPage === 1) setListKey((k) => k + 1);
      } catch (err: any) {
        setError(err.message || "Le forum n'a pas pu se charger.");
        if (nextPage === 1) setThreads([]);
      } finally {
        setLoading(false);
      }
    },
    [space, subjectId, q]
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const switchSpace = (s: Space) => {
    setSpace(s);
    setWriting(false);
    window.history.replaceState(null, "", s === "profs" ? "/forum?espace=profs" : "/forum");
  };

  const showProfsTab = !!user?.isApprovedInstructor;
  const isProfs = space === "profs";

  return (
    <PageHero
      image={isProfs ? "/images/comptes/espace-instructeur.jpg" : "/images/comptes/forum.jpg"}
      position={isProfs ? "center 35%" : "center 40%"}
      kicker={isProfs ? "Entre instructeurs" : "Entraide"}
      title={isProfs ? <>Salle des <span className="text-[#c9951a]">profs</span></> : <>Le <span className="text-[#c9951a]">forum</span> EduConnect</>}
      subtitle={
        isProfs
          ? "L'espace d'échange entre instructeurs : méthodes, conseils, entraide entre collègues."
          : "Pose ta question : les instructeurs et les autres élèves t'aident à comprendre, pas seulement à trouver la réponse."
      }
      width="max-w-4xl"
      aside={
        <div className="animate-float-y bg-white/90 backdrop-blur-xl border border-white rounded-[2rem] px-6 py-5 shadow-[0_20px_60px_-15px_rgba(13,27,62,0.3)] flex items-center gap-4">
          <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#c9951a] to-[#e2b94a] text-white flex items-center justify-center shadow">{Icon.chat(24)}</span>
          <div>
            <div className="font-[family-name:var(--font-cinzel)] text-3xl text-[#0d1b3e] leading-none">{total}</div>
            <div className="text-xs text-gray-500 mt-1">{isProfs ? "discussions" : "questions posées"}</div>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {showProfsTab && (
          <div className="inline-flex gap-1 bg-white/80 backdrop-blur-xl border border-[#eee6d3] rounded-full p-1.5 shadow-sm">
            {([
              ["questions", "Questions des élèves"],
              ["profs", "Salle des profs"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={space === value}
                onClick={() => switchSpace(value)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                  space === value ? "bg-[#0d1b3e] text-white shadow-md" : "text-gray-600 hover:text-[#0d1b3e]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {!accountLoading && !user && (
          <InfoBox>
            <Link href="/connexion?suite=/forum" className="font-semibold text-[#8a6510] hover:underline">Connecte-toi</Link> ou{" "}
            <Link href="/inscription" className="font-semibold text-[#8a6510] hover:underline">crée un compte gratuit</Link> pour poser une
            question ou répondre.
          </InfoBox>
        )}

        {canWrite && writing && (
          <NewThreadForm space={space} subjects={subjects} onCreated={(id) => (window.location.href = `/forum/${id}`)} onCancel={() => setWriting(false)} />
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <form
            onSubmit={(e) => { e.preventDefault(); setQ(search.trim()); }}
            className="flex-1 flex items-center gap-2 bg-white/90 backdrop-blur-xl border border-[#eee6d3] rounded-full pl-4 pr-1.5 py-1.5 shadow-sm focus-within:border-[#c9951a] focus-within:ring-4 focus-within:ring-[#c9951a]/15 transition"
          >
            <span className="text-gray-400">{Icon.search(18)}</span>
            <input
              type="search"
              aria-label="Rechercher dans le forum"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="flex-1 min-w-0 bg-transparent outline-none text-sm text-[#0d1b3e] placeholder-gray-400 py-1.5"
            />
            <select
              aria-label="Filtrer par matière"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="max-w-[45%] bg-[#faf8f2] border border-[#eee6d3] rounded-full text-xs font-semibold text-[#0d1b3e] px-3 py-2 outline-none"
            >
              <option value="">Toutes les matières</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </form>
          {canWrite && !writing && (
            <button
              type="button"
              onClick={() => setWriting(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#c9951a] to-[#d4a820] text-white text-sm font-bold shadow-[0_10px_24px_-10px_rgba(201,149,26,0.8)] hover:-translate-y-0.5 hover:shadow-lg transition-all"
            >
              {Icon.plus(18)} {isProfs ? "Lancer une discussion" : "Poser une question"}
            </button>
          )}
        </div>

        {error && <ErrorBox>{error}</ErrorBox>}

        {loading && threads.length === 0 ? (
          <SkeletonCards count={4} />
        ) : threads.length === 0 && !error ? (
          <div className="animate-fade-blur text-center py-16 px-6 bg-white/70 backdrop-blur border border-dashed border-[#e2d5b4] rounded-[2rem]">
            <span className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-[#faf3e0] text-[#c9951a] flex items-center justify-center">{Icon.chat(26)}</span>
            <p className="text-gray-600 text-sm">{q || subjectId ? "Aucun sujet ne correspond." : "Aucun sujet pour le moment : lance la première discussion !"}</p>
          </div>
        ) : (
          <ul key={listKey} className="space-y-4 stagger">
            {threads.map((t, i) => (
              <li key={t.id} style={{ "--i": Math.min(i, 12) } as React.CSSProperties}>
                <Link
                  href={`/forum/${t.id}`}
                  className="group block bg-white/85 backdrop-blur-xl rounded-[1.75rem] border border-[#eee6d3] p-5 md:p-6 shadow-sm hover:shadow-[0_24px_50px_-24px_rgba(13,27,62,0.35)] hover:border-[#c9951a]/50 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {t.subject && (
                          <span className="text-[11px] font-bold text-[#8a6510] bg-[#c9951a]/10 rounded-full px-2.5 py-0.5 uppercase tracking-wide">{t.subject.name}</span>
                        )}
                        {t.level && <span className="text-[11px] text-gray-500 bg-gray-100 rounded-full px-2.5 py-0.5">{LEVEL_LABELS[t.level]}</span>}
                      </div>
                      <h2 className="font-bold text-[#0d1b3e] text-[17px] leading-snug group-hover:text-[#8a6510] transition-colors">{t.title}</h2>
                      <p className="text-sm text-gray-600 mt-1.5 line-clamp-2">{t.body}</p>
                      <div className="mt-4">
                        <AuthorLine author={t.author} date={t.createdAt} />
                      </div>
                    </div>
                    <div
                      className={`shrink-0 self-center w-16 h-16 rounded-2xl flex flex-col items-center justify-center transition-colors ${
                        t.replyCount > 0 ? "bg-emerald-50 text-emerald-700" : "bg-[#faf8f2] text-gray-400"
                      }`}
                    >
                      <span className="text-xl font-bold leading-none">{t.replyCount}</span>
                      <span className="text-[10px] mt-1">réponse{t.replyCount > 1 ? "s" : ""}</span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {threads.length < total && (
          <div className="text-center pt-2">
            <button type="button" disabled={loading} onClick={() => load(page + 1)} className={smallBtn}>
              {loading ? "Chargement..." : "Voir plus de sujets"}
            </button>
          </div>
        )}
      </div>
    </PageHero>
  );
}
