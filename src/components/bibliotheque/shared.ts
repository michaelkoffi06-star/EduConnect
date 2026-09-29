// Types et petits utilitaires partagés par l'étagère (/bibliotheque) et le classeur
// (/bibliotheque/[key]). Forme d'une ressource telle que renvoyée par /api/resources
// (voir toPublicResource dans src/lib/library.ts), dates en chaînes ISO.

export type ResType = "DOCUMENT" | "VIDEO" | "EXERCICE" | "LIEN";
export type Level = "PRIMAIRE" | "COLLEGE" | "LYCEE" | "ALL";

export interface LibResource {
  id: string;
  slug: string | null;
  urlKey: string;
  ref: string;
  title: string;
  description: string | null;
  type: ResType;
  level: Level;
  position: number;
  fileUrl: string | null;
  fileExt: string | null;
  externalUrl: string | null;
  viewCount: number;
  downloadCount: number;
  createdAt: string;
  subject: { id: string; name: string; slug: string; color: string };
  chapter: { id: string; title: string; slug: string; level: Level; classe: string | null; order: number } | null;
  correction: { id: string; fileExt: string } | null; // Corrigé réservé aux comptes connectés
}

export const TYPE_LABELS: Record<ResType, string> = {
  DOCUMENT: "Cours",
  EXERCICE: "Exercices",
  VIDEO: "Vidéo",
  LIEN: "Lien",
};

export const TYPE_TAGS: Record<ResType, string> = {
  DOCUMENT: "COURS",
  EXERCICE: "EXOS",
  VIDEO: "VIDÉO",
  LIEN: "LIEN",
};

export const LEVEL_LABELS: Record<Level, string> = {
  PRIMAIRE: "Primaire",
  COLLEGE: "Collège",
  LYCEE: "Lycée",
  ALL: "Tous niveaux",
};

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

// Couleur de texte lisible (encre foncée ou crème) selon la clarté du fond.
export function readableInk(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return "#231E17";
  const n = parseInt(m[1], 16);
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const lum = 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
  return lum > 0.22 ? "#231E17" : "#F7EFE6";
}

// Petit hachage stable (hauteur des tranches, décalage des onglets…)
export function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// URL d'intégration d'une vidéo YouTube ou Vimeo ; null si le lien n'est pas reconnu.
export function videoEmbedUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^(www\.|m\.)/, "");
    let id: string | null = null;
    if (host === "youtu.be") id = u.pathname.slice(1).split("/")[0];
    else if (host.endsWith("youtube.com")) {
      if (u.pathname === "/watch") id = u.searchParams.get("v");
      else if (/^\/(embed|shorts|live)\//.test(u.pathname)) id = u.pathname.split("/")[2];
    }
    if (id && /^[\w-]{6,}$/.test(id)) return `https://www.youtube-nocookie.com/embed/${id}`;
    if (host.endsWith("vimeo.com")) {
      const m = u.pathname.match(/\/(\d+)/);
      if (m) return `https://player.vimeo.com/video/${m[1]}`;
    }
  } catch {
    // URL invalide : on retombe sur un simple lien
  }
  return null;
}

export function domainOf(url: string | null): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
