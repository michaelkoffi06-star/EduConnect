"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Lecteur PDF page par page, basé sur PDF.js chargé depuis un CDN au moment de la lecture
// (aucune dépendance npm à ajouter). Nécessaire car les navigateurs mobiles (Android surtout)
// n'affichent pas un PDF intégré dans une page : ils le téléchargent à la place.
// Le fichier est lu directement depuis R2 : la règle CORS du bucket doit autoriser GET
// depuis educonnect-ci.org (voir §7septies de la doc).

const PDFJS_VERSION = "4.10.38";
const PDFJS_BASE = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PdfJs = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PdfDoc = any;

let pdfjsPromise: Promise<PdfJs> | null = null;

function loadPdfJs(): Promise<PdfJs> {
  if (!pdfjsPromise) {
    // import() dynamique hors bundler : le module est récupéré tel quel sur le CDN
    const dynamicImport = new Function("u", "return import(u)") as (u: string) => Promise<PdfJs>;
    pdfjsPromise = dynamicImport(`${PDFJS_BASE}/pdf.min.mjs`)
      .then((lib) => {
        lib.GlobalWorkerOptions.workerSrc = `${PDFJS_BASE}/pdf.worker.min.mjs`;
        return lib;
      })
      .catch((err) => {
        pdfjsPromise = null;
        throw err;
      });
  }
  return pdfjsPromise;
}

interface Props {
  url: string;
  title: string;
  reference: string;
  downloadHref: string;
  /** Couleur du texte des contrôles (encre du dossier ouvert) */
  ink: string;
}

function ChevronIcon({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={dir === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
    </svg>
  );
}

export function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 4v11" />
      <path d="M7 10l5 5 5-5" />
      <path d="M5 20h14" />
    </svg>
  );
}

// Cadenas des contenus réservés aux comptes (corrigés, voir §7quindecies)
export function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export default function PdfReader({ url, title, reference, downloadHref, ink }: Props) {
  const [doc, setDoc] = useState<PdfDoc | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [fullscreen, setFullscreen] = useState(false);
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Chargement du document
  useEffect(() => {
    let cancelled = false;
    let loaded: PdfDoc | null = null;
    setStatus("loading");
    setDoc(null);
    setPage(1);
    loadPdfJs()
      .then((lib) => lib.getDocument({ url }).promise)
      .then((d: PdfDoc) => {
        loaded = d;
        if (cancelled) {
          d.destroy();
          return;
        }
        setDoc(d);
        setNumPages(d.numPages);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
      if (loaded) loaded.destroy();
    };
  }, [url]);

  // Largeur disponible (suivie en continu : rotation du téléphone, plein écran…)
  useEffect(() => {
    if (!box) return;
    const update = () => setWidth(box.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(box);
    return () => ro.disconnect();
  }, [box]);

  // Rendu de la page courante
  useEffect(() => {
    if (!doc || !width || !canvasRef.current) return;
    let task: { cancel: () => void; promise: Promise<void> } | null = null;
    let cancelled = false;
    (async () => {
      try {
        const p = await doc.getPage(page);
        if (cancelled) return;
        const base = p.getViewport({ scale: 1 });
        const viewport = p.getViewport({ scale: width / base.width });
        const ratio = Math.min(window.devicePixelRatio || 1, 2.5);
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = Math.floor(viewport.width * ratio);
        canvas.height = Math.floor(viewport.height * ratio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        task = p.render({
          canvasContext: ctx,
          viewport,
          transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined,
        });
        await task!.promise;
      } catch {
        // rendu annulé (changement de page rapide) : rien à faire
      }
    })();
    return () => {
      cancelled = true;
      if (task) task.cancel();
    };
  }, [doc, page, width, fullscreen]);

  const prev = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
  const next = useCallback(() => setPage((p) => Math.min(numPages || 1, p + 1)), [numPages]);

  // Plein écran : Échap pour fermer, flèches pour tourner les pages, défilement de la page bloqué
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [fullscreen, prev, next]);

  const pageLabel = numPages ? `Page ${page} / ${numPages}` : "";

  if (status === "error") {
    return (
      <div className="rounded-md border-[1.5px] border-current p-5 flex flex-col gap-3">
        <p className="text-[15px] leading-relaxed">L’aperçu n’a pas pu s’afficher ici. Tu peux ouvrir le PDF directement ou le télécharger.</p>
        <div className="flex flex-wrap gap-2">
          <a href={url} target="_blank" rel="noopener noreferrer" className="h-11 px-5 rounded-full border-[1.5px] border-current inline-flex items-center font-medium">
            Ouvrir le PDF
          </a>
          <a href={downloadHref} className="h-11 px-5 rounded-full border-[1.5px] border-current inline-flex items-center gap-2 font-medium">
            <DownloadIcon /> Télécharger
          </a>
        </div>
      </div>
    );
  }

  const pageArea = (
    <div ref={setBox} className="w-full">
      {status === "loading" && (
        <div className="w-full aspect-[1/1.414] rounded-[4px] bg-[#FFFDF8] flex items-center justify-center text-[#6B6152] text-sm">
          Chargement du document…
        </div>
      )}
      <canvas
        ref={canvasRef}
        aria-label={`${title}, ${pageLabel}`}
        className={`block mx-auto bg-white rounded-[4px] shadow-[0_14px_30px_-14px_rgba(0,0,0,0.6)] ${status === "ready" ? "" : "hidden"}`}
      />
    </div>
  );

  const pager = (tone: "folder" | "dark") => (
    <div className="flex items-center justify-center gap-5">
      <button
        type="button"
        onClick={prev}
        disabled={page <= 1}
        aria-label="Page précédente"
        className={`w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-40 ${tone === "folder" ? "bg-black/20" : "border border-[#3A342A]"}`}
      >
        <ChevronIcon dir="left" />
      </button>
      <span className="font-[family-name:var(--font-biblio-mono)] text-sm min-w-24 text-center">{pageLabel}</span>
      <button
        type="button"
        onClick={next}
        disabled={!numPages || page >= numPages}
        aria-label="Page suivante"
        className={`w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-40 ${tone === "folder" ? "bg-black/20" : "border border-[#3A342A]"}`}
      >
        <ChevronIcon dir="right" />
      </button>
    </div>
  );

  if (fullscreen) {
    return (
      <div role="dialog" aria-modal="true" aria-label={`Lecture : ${title}`} className="fixed inset-0 z-[60] bg-[#0E0C09] text-[#F4EFE4] flex flex-col">
        <div className="h-16 shrink-0 px-2 md:px-6 flex items-center gap-2 border-b border-[#2B261E]">
          <button type="button" onClick={() => setFullscreen(false)} aria-label="Fermer la lecture" className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-white/10">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-semibold truncate">{title}</div>
            <div className="font-[family-name:var(--font-biblio-mono)] text-[11px] text-[#A89C86]">{reference}</div>
          </div>
          <a href={downloadHref} aria-label="Télécharger le document" className="h-11 px-3 md:px-4 rounded-full bg-[#F4EFE4] text-[#16130F] font-semibold inline-flex items-center gap-2">
            <DownloadIcon />
            <span className="hidden md:inline">Télécharger</span>
          </a>
        </div>
        <div className="flex-1 overflow-y-auto py-4 md:py-8 px-3">
          <div className="max-w-3xl mx-auto">{pageArea}</div>
        </div>
        <div className="h-[72px] shrink-0 border-t border-[#2B261E] flex items-center justify-center">{pager("dark")}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3" style={{ color: ink }}>
      {pageArea}
      {pager("folder")}
      <button
        type="button"
        onClick={() => setFullscreen(true)}
        disabled={status !== "ready"}
        className="self-center h-11 px-5 rounded-full border-[1.5px] border-current inline-flex items-center gap-2 font-medium disabled:opacity-50"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
        </svg>
        Lire en plein écran
      </button>
    </div>
  );
}
