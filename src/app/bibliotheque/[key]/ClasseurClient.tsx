"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PdfReader, { DownloadIcon, LockIcon } from "@/components/bibliotheque/PdfReader";
import {
  LEVEL_LABELS,
  TYPE_LABELS,
  TYPE_TAGS,
  domainOf,
  formatDate,
  videoEmbedUrl,
  type LibResource,
} from "@/components/bibliotheque/shared";

// Ouverture d'une ressource : son chapitre s'affiche comme un classeur à onglets de couleur
// (un onglet par document du chapitre). Le dossier ouvert contient la fiche d'index,
// la lecture en ligne (PDF page par page, image, vidéo intégrée ou lien) et le téléchargement.

const FOLDERS = [
  { fill: "#5E2750", ink: "#F7EFE6" },
  { fill: "#E0692E", ink: "#1B140E" },
  { fill: "#16725F", ink: "#F7EFE6" },
  { fill: "#2D55D2", ink: "#FFFFFF" },
  { fill: "#F0C43F", ink: "#1B140E" },
  { fill: "#C23A2E", ink: "#FFFFFF" },
];
// Décalage horizontal des onglets, en fraction de la largeur disponible (effet classeur)
const OFFSETS = [0, 0.55, 0.18, 0.78, 0.36, 0.08, 0.66, 0.26];
const BINDER_BG = "#16130F";
const TAB_MAX = 280;

function typeLine(r: LibResource) {
  if (r.type === "VIDEO") return `Vidéo · ${domainOf(r.externalUrl)}`;
  if (r.type === "LIEN") return `Lien externe · ${domainOf(r.externalUrl)}`;
  return `${TYPE_LABELS[r.type]} · ${(r.fileExt || "fichier").toUpperCase()}`;
}

function isImage(r: LibResource) {
  return !!r.fileExt && ["jpg", "jpeg", "png", "webp"].includes(r.fileExt);
}

function ExternalIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 4h6v6" />
      <path d="M20 4l-9 9" />
      <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  );
}

function Reader({ r, fill, ink }: { r: LibResource; fill: string; ink: string }) {
  const downloadHref = `/api/resources/${encodeURIComponent(r.urlKey)}/download`;

  if (r.fileUrl && r.fileExt === "pdf") {
    return <PdfReader key={r.id} url={r.fileUrl} title={r.title} reference={r.ref} downloadHref={downloadHref} ink={ink} />;
  }

  if (r.fileUrl && isImage(r)) {
    return (
      <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={r.fileUrl}
          alt={r.title}
          className="w-full h-auto bg-white rounded-[4px] shadow-[0_14px_30px_-14px_rgba(0,0,0,0.6)]"
        />
        <span className="sr-only">Ouvrir l’image en grand</span>
      </a>
    );
  }

  if (r.type === "VIDEO") {
    const embed = videoEmbedUrl(r.externalUrl);
    if (embed) {
      return (
        <div className="flex flex-col gap-3">
          <div className="relative w-full aspect-video rounded-md overflow-hidden bg-[#0E0C09]">
            <iframe
              src={embed}
              title={r.title}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              className="absolute inset-0 w-full h-full border-0"
            />
          </div>
          <p className="text-sm opacity-85">La vidéo se regarde ici, sans quitter la page.</p>
        </div>
      );
    }
  }

  // Lien externe (ou vidéo d'une plateforme non reconnue)
  return (
    <div className="rounded-lg border-[1.5px] border-current p-6 md:p-8 flex flex-col gap-3">
      <span className="font-[family-name:var(--font-biblio-mono)] text-sm">{domainOf(r.externalUrl)}</span>
      <span className="font-[family-name:var(--font-biblio-serif)] text-3xl font-semibold leading-tight">{r.title}</span>
      <span className="text-[15px]">Ressource externe, ouverte dans un nouvel onglet.</span>
      {r.externalUrl && (
        <a
          href={r.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="self-start mt-2 h-12 px-6 rounded-full inline-flex items-center gap-2 font-semibold"
          style={{ background: ink, color: fill }}
        >
          Ouvrir le lien <ExternalIcon />
        </a>
      )}
    </div>
  );
}

// Lecture d'un corrigé (réservé aux comptes connectés) : l'URL signée du fichier, valable
// quelques minutes, est demandée à l'API au moment de l'ouverture.
function CorrectionReader({ r, ink }: { r: LibResource; ink: string }) {
  const correction = r.correction!;
  const [state, setState] = useState<{ url: string } | "loading" | "error">("loading");
  const downloadHref = `/api/corrections/${correction.id}`;

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    fetch(`/api/corrections/${correction.id}?mode=lecture`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((d) => !cancelled && setState({ url: d.url }))
      .catch(() => !cancelled && setState("error"));
    return () => {
      cancelled = true;
    };
  }, [correction.id]);

  if (state === "loading") return <p className="text-sm opacity-85 py-10 text-center">Ouverture du corrigé…</p>;
  if (state === "error") {
    return (
      <p className="text-sm py-10 text-center">
        Le corrigé n’a pas pu s’ouvrir.{" "}
        <a href={downloadHref} className="underline font-semibold">Le télécharger</a>
      </p>
    );
  }
  if (correction.fileExt === "pdf") {
    return <PdfReader key={correction.id} url={state.url} title={`Corrigé — ${r.title}`} reference={`${r.ref} · CORRIGÉ`} downloadHref={downloadHref} ink={ink} />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={state.url} alt={`Corrigé — ${r.title}`} className="w-full h-auto bg-white rounded-[4px] shadow-[0_14px_30px_-14px_rgba(0,0,0,0.6)]" />;
}

// Encadré « Corrigé » de la fiche : boutons pour les comptes connectés, invitation à se
// connecter sinon (le reste de la bibliothèque reste en libre accès).
function CorrectionBox({
  r,
  account,
  showing,
  onToggle,
  fill,
  ink,
}: {
  r: LibResource;
  account: "loading" | "in" | "out";
  showing: boolean;
  onToggle: () => void;
  fill: string;
  ink: string;
}) {
  if (!r.correction) return null;
  const next = encodeURIComponent(`/bibliotheque/${r.urlKey}?corrige=1`);
  return (
    <div className="rounded-lg border-[1.5px] border-current p-4 flex flex-col gap-3">
      <span className="font-[family-name:var(--font-biblio-mono)] text-[11px] tracking-[0.12em] inline-flex items-center gap-2">
        <LockIcon /> CORRIGÉ DISPONIBLE
      </span>
      {account === "in" ? (
        <>
          <button
            type="button"
            onClick={onToggle}
            className="h-11 rounded-full inline-flex items-center justify-center gap-2 font-semibold"
            style={{ background: ink, color: fill }}
          >
            {showing ? "Revenir à l’énoncé" : "Lire le corrigé"}
          </button>
          <a href={`/api/corrections/${r.correction.id}`} className="h-11 rounded-full inline-flex items-center justify-center gap-2 font-semibold border-[1.5px] border-current">
            <DownloadIcon /> Télécharger le corrigé
          </a>
        </>
      ) : account === "out" ? (
        <>
          <p className="text-sm leading-snug">Réservé aux membres : élèves, parents et instructeurs inscrits. L’inscription est gratuite.</p>
          <Link
            href={`/connexion?suite=${next}`}
            className="h-11 rounded-full inline-flex items-center justify-center font-semibold"
            style={{ background: ink, color: fill }}
          >
            Se connecter
          </Link>
          <Link href="/inscription" className="text-sm text-center underline underline-offset-4">
            Créer un compte
          </Link>
        </>
      ) : null}
    </div>
  );
}

export default function ClasseurClient({ initialId, siblings }: { initialId: string; siblings: LibResource[] }) {
  const [activeId, setActiveId] = useState(initialId);
  const active = siblings.find((s) => s.id === activeId) || siblings[0];
  const activeIndex = siblings.indexOf(active);
  const chapter = active.chapter;
  const [account, setAccount] = useState<"loading" | "in" | "out">("loading");
  const [showCorrectionFor, setShowCorrectionFor] = useState<string | null>(null);
  const hasCorrections = siblings.some((s) => s.correction);

  // Session lue seulement si le classeur contient au moins un corrigé
  useEffect(() => {
    if (!hasCorrections) return;
    fetch("/api/compte/moi")
      .then((r) => r.json())
      .then((d) => {
        setAccount(d.user ? "in" : "out");
        // Lien direct vers le corrigé (?corrige=1, depuis l'étagère des corrigés ou après connexion)
        if (d.user && new URLSearchParams(window.location.search).get("corrige") === "1") {
          setShowCorrectionFor(initialId);
        }
      })
      .catch(() => setAccount("out"));
  }, [hasCorrections, initialId]);

  // L'URL suit l'onglet ouvert (lien partageable vers le bon document)
  const selectDoc = (r: LibResource) => {
    setActiveId(r.id);
    setShowCorrectionFor(null);
    window.history.replaceState(null, "", `/bibliotheque/${r.urlKey}`);
    document.title = `${r.title} | EduConnect CI`;
  };

  // Une consultation comptée par ressource et par session navigateur
  useEffect(() => {
    const k = `ec-view-${active.id}`;
    try {
      if (window.sessionStorage.getItem(k)) return;
      window.sessionStorage.setItem(k, "1");
    } catch {
      // stockage indisponible (navigation privée) : on compte quand même
    }
    fetch(`/api/resources/${encodeURIComponent(active.urlKey)}/view`, { method: "POST" }).catch(() => {});
  }, [active.id, active.urlKey]);

  const folders = useMemo(
    () =>
      siblings.map((r, i) => ({
        r,
        ...FOLDERS[i % FOLDERS.length],
        prevFill: i === 0 ? BINDER_BG : FOLDERS[(i - 1) % FOLDERS.length].fill,
        offset: OFFSETS[i % OFFSETS.length],
      })),
    [siblings]
  );

  const crumbLevel = chapter ? `${LEVEL_LABELS[chapter.level]}${chapter.classe ? ` · ${chapter.classe}` : ""}` : LEVEL_LABELS[active.level];
  const heading = chapter ? chapter.title : active.title;
  const hasFile = !!active.fileUrl;
  const downloadHref = `/api/resources/${encodeURIComponent(active.urlKey)}/download`;

  return (
    <div className="min-h-screen text-[#F4EFE4]" style={{ background: BINDER_BG }}>
      <div className="max-w-6xl mx-auto px-3 md:px-10 pt-3 md:pt-6 pb-16">
        <div className="flex items-center justify-between gap-3">
          <Link href="/bibliotheque" className="min-h-11 inline-flex items-center gap-2 pr-2 text-[15px] md:text-base hover:underline underline-offset-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5" />
              <path d="M11 6l-6 6 6 6" />
            </svg>
            Étagère
          </Link>
          <Link href="/" className="font-[family-name:var(--font-cinzel)] text-sm tracking-wide text-[#A89C86] hover:text-[#F4EFE4]">
            EduConnect
          </Link>
        </div>

        <div className="px-2 md:px-0 mt-3 md:mt-6">
          <nav aria-label="Fil d’Ariane" className="font-[family-name:var(--font-biblio-mono)] text-[11px] md:text-xs text-[#A89C86]">
            <Link href="/bibliotheque" className="hover:text-[#F4EFE4]">Bibliothèque</Link> / {active.subject.name} / {crumbLevel}
          </nav>
          <div className="mt-2 flex flex-col md:flex-row md:items-end md:justify-between gap-1">
            <h1 className="font-[family-name:var(--font-biblio-serif)] font-medium text-4xl md:text-6xl leading-[1.02]">{heading}</h1>
            <span className="font-[family-name:var(--font-biblio-mono)] text-xs text-[#A89C86]">
              {siblings.length > 1 ? `${siblings.length} documents dans ce classeur` : "1 document"}
            </span>
          </div>
        </div>

        <div className="mt-7 md:mt-10">
          {folders.map((f) => {
            const open = f.r.id === active.id;
            return (
              <div key={f.r.id}>
                <div className="flex" style={{ background: f.prevFill, paddingLeft: `calc(${f.offset} * (100% - ${TAB_MAX}px))` }}>
                  <button
                    type="button"
                    onClick={() => selectDoc(f.r)}
                    aria-expanded={open}
                    aria-controls={`dossier-${f.r.id}`}
                    className="h-11 md:h-12 px-7 md:px-9 flex items-center min-w-0 hover:brightness-110"
                    style={{
                      maxWidth: TAB_MAX,
                      background: f.fill,
                      color: f.ink,
                      clipPath: "polygon(14px 0, calc(100% - 14px) 0, 100% 100%, 0 100%)",
                    }}
                  >
                    <span className="font-[family-name:var(--font-biblio-serif)] text-lg md:text-xl font-semibold truncate">{f.r.title}</span>
                  </button>
                </div>

                {!open ? (
                  <div className="h-3.5 md:h-4" style={{ background: f.fill }} />
                ) : (
                  <div
                    id={`dossier-${f.r.id}`}
                    className="px-4 md:px-9 pt-5 md:pt-8 pb-7 md:pb-9 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 lg:gap-11"
                    style={{ background: f.fill, color: f.ink }}
                  >
                    <aside className="flex flex-col gap-5 min-w-0 lg:order-2">
                      <dl className="grid grid-cols-[72px_minmax(0,1fr)] md:grid-cols-[80px_minmax(0,1fr)] gap-x-3 gap-y-1.5 font-[family-name:var(--font-biblio-mono)] text-xs md:text-[13px] leading-snug">
                        <dt className="opacity-80">RÉF</dt>
                        <dd>{f.r.ref}</dd>
                        <dt className="opacity-80">TYPE</dt>
                        <dd>{typeLine(f.r)}</dd>
                        <dt className="opacity-80">NIVEAU</dt>
                        <dd>{f.r.chapter?.classe ? `${LEVEL_LABELS[f.r.level]} · ${f.r.chapter.classe}` : LEVEL_LABELS[f.r.level]}</dd>
                        <dt className="opacity-80">AJOUTÉ</dt>
                        <dd>{formatDate(f.r.createdAt)}</dd>
                      </dl>
                      {f.r.description && <p className="text-[15px] md:text-base leading-relaxed">{f.r.description}</p>}

                      {hasFile && (
                        <a
                          href={downloadHref}
                          className="h-12 rounded-full inline-flex items-center justify-center gap-2 font-semibold"
                          style={{ background: f.ink, color: f.fill }}
                        >
                          <DownloadIcon />
                          Télécharger{f.r.fileExt ? ` (${f.r.fileExt.toUpperCase()})` : ""}
                        </a>
                      )}

                      <CorrectionBox
                        r={f.r}
                        account={account}
                        showing={showCorrectionFor === f.r.id}
                        onToggle={() => setShowCorrectionFor(showCorrectionFor === f.r.id ? null : f.r.id)}
                        fill={f.fill}
                        ink={f.ink}
                      />

                      {siblings.length > 1 && (
                        <div className="hidden lg:flex flex-col gap-1 pt-4 border-t" style={{ borderTopColor: "currentColor" }}>
                          <span className="font-[family-name:var(--font-biblio-mono)] text-[11px] tracking-[0.12em] opacity-80 mb-1.5">DANS CE CLASSEUR</span>
                          {siblings.map((s, i) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => selectDoc(s)}
                              aria-current={s.id === active.id ? "true" : undefined}
                              className={`min-h-11 rounded-md px-2.5 grid grid-cols-[26px_minmax(0,1fr)_56px] items-center gap-2.5 text-left ${s.id === active.id ? "bg-black/20" : "hover:bg-black/10"}`}
                            >
                              <span className="font-[family-name:var(--font-biblio-mono)] text-xs">{String(i + 1).padStart(2, "0")}</span>
                              <span className="text-sm truncate">{s.title}</span>
                              <span className="font-[family-name:var(--font-biblio-mono)] text-[11px] text-right">{TYPE_TAGS[s.type]}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </aside>

                    <div className="min-w-0 lg:order-1">
                      {showCorrectionFor === f.r.id && f.r.correction ? (
                        <CorrectionReader r={f.r} ink={f.ink} />
                      ) : (
                        <Reader r={f.r} fill={f.fill} ink={f.ink} />
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {activeIndex >= 0 && siblings.length > 1 && (
          <p className="sr-only" aria-live="polite">
            Document {activeIndex + 1} sur {siblings.length} : {active.title}
          </p>
        )}
      </div>
    </div>
  );
}
