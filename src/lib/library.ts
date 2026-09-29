import type { Prisma, ResourceType } from '@prisma/client';

// Utilitaires partagés de la bibliothèque (voir §7quaterdecies de la doc) :
// slugs, codes de référence et forme publique d'une ressource.

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// Slug unique d'une ressource : titre + 6 premiers caractères de l'id (évite les collisions
// entre deux ressources de même titre, sans requête supplémentaire).
export function resourceSlug(title: string, id: string): string {
  const base = slugify(title) || 'ressource';
  return `${base}-${id.replace(/-/g, '').slice(0, 6)}`;
}

// Code court de la matière, déduit de son slug : "maths" -> "MATH",
// "physique-chimie" -> "PC", "histoire-geo" -> "HG", "svt" -> "SVT".
export function subjectCode(subjectSlug: string): string {
  const parts = subjectSlug.split('-').filter(Boolean);
  if (parts.length > 1) return parts.map((p) => p[0]).join('').toUpperCase();
  return (parts[0] || 'X').slice(0, 4).toUpperCase();
}

const LEVEL_CODES: Record<string, string> = { PRIMAIRE: 'PRIM', COLLEGE: 'COL', LYCEE: 'LYC', ALL: 'TOUS' };
const TYPE_LETTERS: Record<ResourceType, string> = { DOCUMENT: 'C', EXERCICE: 'E', VIDEO: 'V', LIEN: 'L' };

// Code de référence affiché dans le classeur, ex. "MATH-3E-07-C".
export function refCode(opts: {
  subjectSlug: string;
  classe?: string | null;
  level: string;
  refNumber: number;
  type: ResourceType;
}): string {
  const classePart = opts.classe
    ? slugify(opts.classe).replace(/-/g, '').toUpperCase()
    : LEVEL_CODES[opts.level] || 'TOUS';
  const num = String(opts.refNumber).padStart(2, '0');
  return `${subjectCode(opts.subjectSlug)}-${classePart}-${num}-${TYPE_LETTERS[opts.type]}`;
}

// Champs sélectionnés pour toute ressource renvoyée publiquement.
export const publicResourceSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  type: true,
  level: true,
  position: true,
  fileUrl: true,
  externalUrl: true,
  refNumber: true,
  viewCount: true,
  downloadCount: true,
  createdAt: true,
  subject: { select: { id: true, name: true, slug: true, color: true } },
  chapter: { select: { id: true, title: true, slug: true, level: true, classe: true, order: true } },
  // Présence d'un corrigé (le fichier lui-même n'est servi qu'aux comptes connectés)
  correction: { select: { id: true, fileExt: true } },
} satisfies Prisma.ResourceSelect;

export type PublicResourceRow = Prisma.ResourceGetPayload<{ select: typeof publicResourceSelect }>;

// Ajoute les champs calculés (référence, extension du fichier) et masque refNumber.
export function toPublicResource(r: PublicResourceRow) {
  const { refNumber, fileUrl, externalUrl, ...rest } = r;
  const fileExt = fileUrl ? fileUrl.split('.').pop()?.toLowerCase() || null : null;
  return {
    ...rest,
    subject: { ...r.subject, color: subjectColor(r.subject) },
    fileUrl,
    externalUrl: normalizeExternalUrl(externalUrl),
    fileExt,
    urlKey: r.slug || r.id, // identifiant utilisé dans l'URL publique
    ref: refCode({
      subjectSlug: r.subject.slug,
      classe: r.chapter?.classe,
      level: r.chapter?.level || r.level,
      refNumber,
      type: r.type,
    }),
  };
}

export type PublicResource = ReturnType<typeof toPublicResource>;

// Couleur de secours pour une matière sans couleur définie (palette douce de l'étagère).
const FALLBACK_COLORS = ['#8FB3AB', '#DDA29B', '#9DBB86', '#DDB877', '#B3A6CC', '#9DB5C9', '#C9A27E', '#A8B894'];
export function subjectColor(subject: { slug: string; color: string | null }): string {
  if (subject.color) return subject.color;
  let h = 0;
  for (const ch of subject.slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return FALLBACK_COLORS[h % FALLBACK_COLORS.length];
}

export const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

// Lien externe saisi par l'équipe : ajoute https:// s'il manque (sinon le navigateur le traite
// comme une adresse du site, ex. /bibliotheque/anglaisefacile.com), n'accepte que http(s).
// Renvoie null si l'adresse est inutilisable.
export function normalizeExternalUrl(raw: string | null | undefined): string | null {
  const value = (raw || '').trim();
  if (!value) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value.replace(/^\/+/, '')}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    if (!u.hostname.includes('.')) return null;
    return u.toString();
  } catch {
    return null;
  }
}
