"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import SiteHeader from "@/components/SiteHeader";
import { DownloadIcon, LockIcon } from "@/components/bibliotheque/PdfReader";
import { LEVEL_LABELS, TYPE_TAGS, readableInk, type LibResource } from "@/components/bibliotheque/shared";

// Étagère des corrigés (/bibliotheque/corriges) : réservée aux comptes connectés
// (élèves, parents, instructeurs — voir §7quindecies de la doc). Chaque ligne ouvre le
// classeur du document directement sur son corrigé.

const MONO = "font-[family-name:var(--font-biblio-mono)]";
// Halo clair autour des textes posés sur la photo (comme sur l'étagère)
const HALO = { textShadow: "0 1px 0 rgba(255,250,240,0.9), 0 0 14px rgba(255,250,240,0.95)" };
const SERIF = "font-[family-name:var(--font-biblio-serif)]";

export default function CorrigesClient() {
  const [items, setItems] = useState<LibResource[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "locked" | "error">("loading");
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/corrections")
      .then(async (res) => {
        if (res.status === 401) return setStatus("locked");
        if (!res.ok) throw new Error();
        setItems(await res.json());
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  // Regroupement par matière, filtré par la recherche
  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const map = new Map<string, { name: string; color: string; items: LibResource[] }>();
    for (const r of items) {
      const hay = `${r.title} ${r.subject.name} ${r.chapter?.title || ""} ${r.chapter?.classe || ""}`.toLowerCase();
      if (needle && !hay.includes(needle)) continue;
      const g = map.get(r.subject.id) || { name: r.subject.name, color: r.subject.color, items: [] };
      g.items.push(r);
      map.set(r.subject.id, g);
    }
    return [...map.values()];
  }, [items, q]);

  return (
    <div className="relative min-h-screen bg-[#E9DDC6] text-[#231E17]">
      {/* Même fond que l'étagère (photo Unsplash sous un voile clair), fixé pendant le défilement */}
      <div className="fixed inset-0 -z-0 pointer-events-none" aria-hidden="true">
        <Image src="/images/bibliotheque/fond-etagere.jpg" alt="" fill priority sizes="100vw" quality={70} className="object-cover animate-ken-burns" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#F4EDDF]/60 via-[#F4EDDF]/75 to-[#F4EDDF]/90" />
      </div>
      <div className="relative">
      <SiteHeader />
      <main className="max-w-5xl mx-auto px-5 md:px-10 pt-8 md:pt-12 pb-20">
        <Link href="/bibliotheque" className={`${MONO} text-xs text-[#4A4034] hover:text-[#231E17]`} style={HALO}>
          ← Bibliothèque
        </Link>
        <header className="mt-3 flex flex-col md:flex-row md:items-end md:justify-between gap-5 animate-fade-blur">
          <div className="flex flex-col gap-2">
            <span className={`${MONO} text-xs font-medium tracking-[0.14em] uppercase text-[#3A3024] inline-flex items-center gap-2`} style={HALO}>
              <LockIcon /> Réservé aux membres
            </span>
            <h1 className={`${SERIF} font-bold text-5xl md:text-7xl leading-[0.95] tracking-tight`} style={HALO}>Corrigés</h1>
            {status === "ready" && (
              <p className="text-[15px] text-[#2E2619]">
                {items.length} corrigé{items.length > 1 ? "s" : ""} disponible{items.length > 1 ? "s" : ""}
              </p>
            )}
          </div>
          {status === "ready" && items.length > 0 && (
            <label className="flex items-center gap-2.5 h-12 w-full md:w-[360px] px-4 bg-[#FBF8F1] border border-[#D6CBB6] rounded-full focus-within:border-[#231E17]">
              <span className="sr-only">Rechercher un corrigé</span>
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher un corrigé…"
                className="flex-1 min-w-0 bg-transparent outline-none text-[15px] placeholder:text-[#7A705F]"
              />
            </label>
          )}
        </header>

        {status === "loading" && (
          <div className="mt-10 space-y-3" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}
          </div>
        )}

        {status === "error" && (
          <p className={`${SERIF} mt-16 text-center text-2xl font-semibold`}>Les corrigés n’ont pas pu se charger. Réessaie plus tard.</p>
        )}

        {status === "locked" && (
          <div className="mt-12 max-w-lg mx-auto text-center bg-[#FBF8F1]/85 backdrop-blur-xl border border-white/70 ring-1 ring-[#D6CBB6] rounded-[2rem] p-8 md:p-10 shadow-[0_30px_70px_-30px_rgba(35,30,23,0.5)] animate-fade-blur">
            <span className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-[#231E17] text-[#F4EFE4] flex items-center justify-center animate-float-y">
              <span className="scale-150 inline-flex"><LockIcon /></span>
            </span>
            <p className={`${SERIF} text-3xl font-semibold`}>Les corrigés sont réservés aux membres</p>
            <p className="mt-3 text-[15px] text-[#4A4034] leading-relaxed">
              Élèves, parents et instructeurs inscrits peuvent lire et télécharger tous les corrigés. L’inscription est
              gratuite ; le reste de la bibliothèque reste en libre accès.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/connexion?suite=/bibliotheque/corriges" className="h-12 px-6 rounded-full inline-flex items-center justify-center bg-[#231E17] text-[#F4EFE4] font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all">
                Se connecter
              </Link>
              <Link href="/inscription" className="h-12 px-6 rounded-full inline-flex items-center justify-center border-[1.5px] border-[#231E17] font-semibold hover:bg-[#231E17]/5 hover:-translate-y-0.5 transition-all">
                Créer un compte
              </Link>
            </div>
          </div>
        )}

        {status === "ready" && items.length === 0 && (
          <p className={`${SERIF} mt-16 text-center text-2xl font-semibold`}>Aucun corrigé pour le moment : ils arrivent bientôt.</p>
        )}

        {status === "ready" && items.length > 0 && groups.length === 0 && (
          <p className="mt-16 text-center text-[#6B6152]">Aucun corrigé ne correspond à « {q} ».</p>
        )}

        {status === "ready" &&
          groups.map((g, gi) => (
            <section key={`${g.name}-${q}`} className="mt-10 animate-fade-blur" style={{ animationDelay: `${Math.min(gi, 6) * 90}ms` }}>
              <h2 className={`${SERIF} text-3xl md:text-4xl font-semibold flex items-center gap-3`} style={HALO}>
                <span className="inline-block w-3.5 h-9 rounded-sm shadow" style={{ background: g.color }} aria-hidden="true" />
                {g.name}
              </h2>
              <ul className="mt-4 space-y-2.5 stagger">
                {g.items.map((r, i) => (
                  <li
                    key={r.id}
                    style={{ "--i": Math.min(i, 10) } as React.CSSProperties}
                    className="group flex items-center gap-3 bg-[#FBF8F1]/85 backdrop-blur-md border border-white/70 ring-1 ring-[#D6CBB6]/70 rounded-2xl pl-2 pr-2.5 py-2 shadow-sm hover:shadow-[0_16px_34px_-18px_rgba(35,30,23,0.55)] hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <span className="self-stretch w-1.5 rounded-full" style={{ background: g.color }} aria-hidden="true" />
                    <Link href={`/bibliotheque/${r.urlKey}?corrige=1`} className="flex-1 min-w-0 py-1">
                      <span className="block font-semibold truncate group-hover:underline underline-offset-4">{r.title}</span>
                      <span className={`${MONO} block text-[11px] text-[#6B6152] mt-0.5`}>
                        {r.ref} · {TYPE_TAGS[r.type]} · {r.chapter?.classe || LEVEL_LABELS[r.level]}
                      </span>
                    </Link>
                    <a
                      href={`/api/corrections/${r.correction!.id}`}
                      className="h-10 px-4 rounded-full inline-flex items-center gap-2 text-sm font-semibold shrink-0 hover:brightness-95 transition"
                      style={{ background: g.color, color: readableInk(g.color) }}
                      aria-label={`Télécharger le corrigé de ${r.title}`}
                    >
                      <DownloadIcon /> <span className="hidden sm:inline">Corrigé</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
      </main>
      </div>
    </div>
  );
}
