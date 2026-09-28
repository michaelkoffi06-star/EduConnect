"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import {
  LEVEL_LABELS,
  TYPE_LABELS,
  TYPE_TAGS,
  hashString,
  readableInk,
  type LibResource,
  type Level,
  type ResType,
} from "@/components/bibliotheque/shared";

// Accueil de la bibliothèque : une étagère par matière (ou par type / niveau), où chaque
// ressource est une tranche de livre. Un clic ouvre la ressource dans son classeur
// (/bibliotheque/[key]). Voir §7quaterdecies de la doc.

type Group = "matiere" | "type" | "niveau";
type View = "etagere" | "liste";

interface Shelf {
  key: string;
  label: string;
  items: LibResource[];
  wide?: boolean;
}

const GROUPS: { value: Group; label: string }[] = [
  { value: "matiere", label: "Par matière" },
  { value: "type", label: "Par type" },
  { value: "niveau", label: "Par niveau" },
];

const LEVEL_FILTERS: { value: Level | ""; label: string }[] = [
  { value: "", label: "Tous" },
  { value: "PRIMAIRE", label: "Primaire" },
  { value: "COLLEGE", label: "Collège" },
  { value: "LYCEE", label: "Lycée" },
];

const NEW_WINDOW_DAYS = 45;

// Mur de la bibliothèque : lambris de bois clair (lattes verticales, veinage discret et
// halo de lumière en haut), dessiné en CSS pur — aucune image à charger, même sur mobile.
const WALL_STYLE = {
  background: [
    "radial-gradient(ellipse 120% 70% at 50% 0%, rgba(255,251,242,0.65), rgba(255,251,242,0) 60%)",
    "repeating-linear-gradient(90deg, rgba(96,72,40,0.13) 0 1px, rgba(255,255,255,0.22) 1px 2px, transparent 2px var(--plank))",
    "repeating-linear-gradient(90deg, transparent 0 calc(var(--plank) * 0.37), rgba(96,72,40,0.035) calc(var(--plank) * 0.37) calc(var(--plank) * 0.62), transparent calc(var(--plank) * 0.62) var(--plank))",
    "repeating-linear-gradient(0deg, rgba(96,72,40,0.03) 0 1px, transparent 1px 5px)",
    "#E9DDC6",
  ].join(", "),
} as React.CSSProperties;
const SPECIAL_SHELF_SIZE = 10;

function norm(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n > 1 ? many : one}`;
}

function Spine({ r }: { r: LibResource }) {
  const h = 172 + (hashString(r.id) % 6) * 9;
  const w = 44 + (r.title.length > 30 ? 8 : r.title.length > 16 ? 4 : 0);
  const ink = readableInk(r.subject.color);
  return (
    <Link
      href={`/bibliotheque/${r.urlKey}`}
      title={r.title}
      aria-label={`${r.title} — ${TYPE_LABELS[r.type]}, ${r.subject.name}`}
      className="shrink-0 flex flex-col items-center justify-between rounded-t-[3px] rounded-b-[1px] pt-3 pb-2 transition-transform duration-200 hover:-translate-y-1.5 focus-visible:-translate-y-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F55D2]"
      style={{
        width: w,
        height: h,
        background: r.subject.color,
        color: ink,
        boxShadow: "inset -3px 0 0 rgba(0,0,0,0.08), inset 2px 0 0 rgba(255,255,255,0.28)",
      }}
    >
      <span className="block w-3/5 h-px bg-current opacity-30" />
      <span
        className="[writing-mode:vertical-rl] rotate-180 overflow-hidden whitespace-nowrap text-ellipsis font-[family-name:var(--font-biblio-serif)] text-[17px] font-semibold leading-none"
        style={{ maxHeight: h - 56 }}
      >
        {r.title}
      </span>
      <span className="font-[family-name:var(--font-biblio-mono)] text-[9px] tracking-wider">{TYPE_TAGS[r.type]}</span>
    </Link>
  );
}

function ShelfRow({ shelf }: { shelf: Shelf }) {
  return (
    <section className={`mt-8 min-w-0 ${shelf.wide ? "lg:col-span-2" : ""}`}>
      <div className="flex items-baseline gap-3 px-1">
        <h2 className="text-xs font-semibold tracking-[0.16em] uppercase text-[#2E4636]">{shelf.label}</h2>
        <span className="text-sm text-[#6B6152]">{plural(shelf.items.length, "ressource", "ressources")}</span>
      </div>
      <div className="mt-3 flex items-end gap-1 overflow-x-auto px-3 pt-2 min-h-[232px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {shelf.items.map((r) => (
          <Spine key={r.id} r={r} />
        ))}
      </div>
      <div
        className="h-3 rounded-[3px]"
        style={{
          background: "linear-gradient(#BFA87D, #8C744C)",
          boxShadow: "0 9px 14px -7px rgba(60,40,15,0.5)",
        }}
      />
    </section>
  );
}

function ShelfList({ shelf }: { shelf: Shelf }) {
  return (
    <section className={`mt-8 min-w-0 ${shelf.wide ? "lg:col-span-2" : ""}`}>
      <div className="flex items-baseline gap-3 px-1 mb-2">
        <h2 className="text-xs font-semibold tracking-[0.16em] uppercase text-[#2E4636]">{shelf.label}</h2>
        <span className="text-sm text-[#6B6152]">{plural(shelf.items.length, "ressource", "ressources")}</span>
      </div>
      <ul className="divide-y divide-[#E2D8C4] border-y border-[#E2D8C4]">
        {shelf.items.map((r) => (
          <li key={r.id}>
            <Link
              href={`/bibliotheque/${r.urlKey}`}
              className="flex items-center gap-3 px-1 py-3 min-h-[48px] hover:bg-[#EDE5D5] transition"
            >
              <span className="w-2.5 h-8 rounded-sm shrink-0" style={{ background: r.subject.color }} aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block font-medium truncate">{r.title}</span>
                <span className="block text-xs text-[#6B6152] truncate">
                  {r.subject.name}
                  {r.chapter ? ` · ${r.chapter.title}` : ""} · {r.chapter?.classe || LEVEL_LABELS[r.level]}
                </span>
              </span>
              <span className="hidden sm:block font-[family-name:var(--font-biblio-mono)] text-[11px] text-[#6B6152]">{r.ref}</span>
              <span className="font-[family-name:var(--font-biblio-mono)] text-[10px] tracking-wider text-[#2E4636] w-12 text-right">
                {TYPE_TAGS[r.type]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Chip({
  pressed,
  onClick,
  children,
  tone = "ink",
}: {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
  tone?: "ink" | "green";
}) {
  const on = tone === "ink" ? "bg-[#231E17] text-[#F4EFE4] border-[#231E17]" : "bg-[#2E4636] text-[#F4EFE4] border-[#2E4636]";
  const off = tone === "ink" ? "bg-[#F4EDDF] text-[#231E17] border-[#CDBFA5]" : "bg-[#F4EDDF]/60 text-[#231E17] border-[#C2B292]";
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`shrink-0 h-11 px-4 rounded-full border text-[15px] transition ${pressed ? on : off}`}
    >
      {children}
    </button>
  );
}

export default function BibliothequeClient() {
  const [resources, setResources] = useState<LibResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [q, setQ] = useState("");
  const [level, setLevel] = useState<Level | "">("");
  const [group, setGroup] = useState<Group>("matiere");
  const [view, setView] = useState<View>("etagere");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/resources");
        if (!res.ok) throw new Error();
        setResources(await res.json());
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const qn = norm(q.trim());
    return resources.filter((r) => {
      if (level && r.level !== level && r.level !== "ALL") return false;
      if (!qn) return true;
      const hay = norm([r.title, r.description || "", r.subject.name, r.chapter?.title || "", r.chapter?.classe || ""].join(" "));
      return hay.includes(qn);
    });
  }, [resources, q, level]);

  const shelves = useMemo<Shelf[]>(() => {
    const out: Shelf[] = [];
    const searching = q.trim().length > 0;

    if (group === "matiere") {
      if (!searching) {
        const cutoff = Date.now() - NEW_WINDOW_DAYS * 24 * 3600 * 1000;
        const fresh = filtered
          .filter((r) => new Date(r.createdAt).getTime() >= cutoff)
          .slice(0, SPECIAL_SHELF_SIZE);
        if (fresh.length) out.push({ key: "new", label: "Nouveautés", items: fresh, wide: true });

        const popular = [...filtered]
          .filter((r) => r.viewCount > 0)
          .sort((a, b) => b.viewCount - a.viewCount)
          .slice(0, SPECIAL_SHELF_SIZE);
        if (popular.length >= 3) out.push({ key: "popular", label: "Les plus consultées", items: popular, wide: true });
      }
      const bySubject = new Map<string, LibResource[]>();
      for (const r of filtered) {
        const list = bySubject.get(r.subject.id) || [];
        list.push(r);
        bySubject.set(r.subject.id, list);
      }
      [...bySubject.values()]
        .sort((a, b) => a[0].subject.name.localeCompare(b[0].subject.name, "fr"))
        .forEach((items) => {
          // Dans une matière : par chapitre (ordre défini par la pédagogie), puis position dans le classeur
          items.sort(
            (a, b) =>
              (a.chapter?.order ?? 9999) - (b.chapter?.order ?? 9999) ||
              (a.chapter?.title || "").localeCompare(b.chapter?.title || "", "fr") ||
              a.position - b.position
          );
          out.push({ key: items[0].subject.id, label: items[0].subject.name, items });
        });
    } else if (group === "type") {
      (["DOCUMENT", "EXERCICE", "VIDEO", "LIEN"] as ResType[]).forEach((t) => {
        const items = filtered.filter((r) => r.type === t);
        if (items.length) out.push({ key: t, label: t === "VIDEO" ? "Vidéos" : t === "LIEN" ? "Liens" : TYPE_LABELS[t], items });
      });
    } else {
      (["PRIMAIRE", "COLLEGE", "LYCEE", "ALL"] as Level[]).forEach((lv) => {
        const items = filtered.filter((r) => r.level === lv);
        if (items.length) out.push({ key: lv, label: LEVEL_LABELS[lv], items });
      });
    }
    return out;
  }, [filtered, group, q]);

  const isFiltered = q.trim().length > 0 || level !== "";
  const countLabel = isFiltered
    ? `${plural(filtered.length, "ressource correspond", "ressources correspondent")}`
    : `${plural(resources.length, "ressource", "ressources")} en libre accès — cours, exercices, vidéos et liens`;

  return (
    <div className="min-h-screen text-[#231E17] [--plank:88px] md:[--plank:132px]" style={WALL_STYLE}>
      <SiteHeader />

      <main className="max-w-7xl mx-auto px-5 md:px-10 pt-8 md:pt-12 pb-20">
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
          <div className="flex flex-col gap-2">
            <span className="font-[family-name:var(--font-biblio-mono)] text-[11px] tracking-[0.14em] uppercase text-[#6B6152]">
              EduConnect · Libre accès
            </span>
            <h1 className="font-[family-name:var(--font-biblio-serif)] font-semibold text-5xl md:text-7xl leading-[0.95] tracking-tight">
              Bibliothèque
            </h1>
            <p className="text-[15px] md:text-base text-[#6B6152]">{loading ? "Chargement des ressources…" : countLabel}</p>
          </div>
          <label className="flex items-center gap-2.5 h-12 w-full md:w-[400px] px-4 bg-[#FBF8F1] border border-[#D6CBB6] rounded-full text-[#6B6152] focus-within:border-[#231E17]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <span className="sr-only">Rechercher une ressource</span>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Pythagore, dissertation, cellule…"
              className="flex-1 min-w-0 bg-transparent outline-none text-[15px] text-[#231E17] placeholder:text-[#7A705F]"
            />
          </label>
        </header>

        <div className="mt-6 flex flex-col lg:flex-row lg:items-center gap-2.5 lg:gap-3">
          <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {GROUPS.map((g) => (
              <Chip key={g.value} pressed={group === g.value} onClick={() => setGroup(g.value)}>
                {g.label}
              </Chip>
            ))}
          </div>
          <span className="hidden lg:block w-px h-7 bg-[#D6CBB6]" />
          <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {LEVEL_FILTERS.map((l) => (
              <Chip key={l.value || "all"} tone="green" pressed={level === l.value} onClick={() => setLevel(l.value)}>
                {l.label}
              </Chip>
            ))}
          </div>
          <div className="lg:ml-auto flex gap-1 p-1 rounded-full bg-[#F4EDDF] border border-[#CDBFA5] self-start">
            {(["etagere", "liste"] as View[]).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={`h-9 px-4 rounded-full text-sm transition ${view === v ? "bg-[#FBF8F1] shadow-sm font-medium" : "text-[#6B6152]"}`}
              >
                {v === "etagere" ? "Étagère" : "Liste"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 animate-pulse" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="mt-10">
                <div className="h-3 w-32 bg-[#E2D8C4] rounded mb-4" />
                <div className="flex items-end gap-1 px-3 min-h-[200px]">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <div key={j} className="w-11 bg-[#E2D8C4] rounded-t" style={{ height: 150 + ((i * 7 + j) % 5) * 10 }} />
                  ))}
                </div>
                <div className="h-3 rounded bg-[#D6CBB6]" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="mt-12 p-8 border border-dashed border-[#C9BCA3] rounded-2xl text-center">
            <p className="font-[family-name:var(--font-biblio-serif)] text-2xl font-semibold">La bibliothèque n’a pas pu se charger</p>
            <p className="mt-2 text-[#6B6152]">Vérifie ta connexion puis recharge la page.</p>
          </div>
        ) : shelves.length === 0 ? (
          <div className="mt-12 p-8 border border-dashed border-[#C9BCA3] rounded-2xl text-center flex flex-col items-center gap-3">
            <p className="font-[family-name:var(--font-biblio-serif)] text-2xl font-semibold">
              {resources.length === 0 ? "Les premières ressources arrivent bientôt" : "Aucune ressource trouvée"}
            </p>
            {resources.length > 0 && (
              <>
                <p className="text-[#6B6152]">Essaie un autre mot ou un autre niveau.</p>
                <button
                  type="button"
                  onClick={() => {
                    setQ("");
                    setLevel("");
                    setGroup("matiere");
                  }}
                  className="h-11 px-5 rounded-full border border-[#231E17] text-[15px]"
                >
                  Tout afficher
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16">
            {shelves.map((s) =>
              view === "etagere" ? <ShelfRow key={s.key} shelf={s} /> : <ShelfList key={s.key} shelf={s} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
