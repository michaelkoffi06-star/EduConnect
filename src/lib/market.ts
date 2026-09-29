import type { AcademicLevel, MarketOfferStatus, Prisma, TeachingMode } from '@prisma/client';

// Marché des instructeurs (voir §7quindecies de la doc) : validation des annonces saisies
// par l'équipe, partagée par la création (POST) et la modification (PATCH).

const LEVELS: AcademicLevel[] = ['PRIMAIRE', 'COLLEGE', 'LYCEE', 'ALL'];
const MODES: TeachingMode[] = ['DOMICILE', 'EN_LIGNE', 'LES_DEUX'];
export const OFFER_STATUSES: MarketOfferStatus[] = ['OPEN', 'FILLED', 'CLOSED'];

function optionalText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const v = value.trim().slice(0, max);
  return v || null;
}

// Renvoie les données à enregistrer, ou un message d'erreur.
// partial = true : seuls les champs présents dans le corps sont validés (PATCH).
export function parseOfferInput(
  body: Record<string, unknown>,
  partial: boolean
): { data: Prisma.MarketOfferUncheckedUpdateInput & Prisma.MarketOfferUncheckedCreateInput } | { error: string } {
  const has = (k: string) => body[k] !== undefined;
  const data: Record<string, unknown> = {};

  if (!partial || has('title')) {
    const title = optionalText(body.title, 120);
    if (!title) return { error: 'Le titre est obligatoire.' };
    data.title = title;
  }
  if (!partial || has('subjectId')) {
    if (typeof body.subjectId !== 'string' || !body.subjectId) return { error: 'La matière est obligatoire.' };
    data.subjectId = body.subjectId;
  }
  if (!partial || has('level')) {
    if (!LEVELS.includes(body.level as AcademicLevel)) return { error: 'Niveau invalide.' };
    data.level = body.level;
  }
  if (!partial || has('mode')) {
    if (!MODES.includes(body.mode as TeachingMode)) return { error: "Mode d'enseignement invalide." };
    data.mode = body.mode;
  }
  if (has('status')) {
    if (!OFFER_STATUSES.includes(body.status as MarketOfferStatus)) return { error: 'Statut invalide.' };
    data.status = body.status;
  }
  const texts: [string, number][] = [
    ['classe', 30],
    ['city', 60],
    ['commune', 60],
    ['schedule', 160],
    ['budget', 80],
    ['description', 2000],
  ];
  for (const [key, max] of texts) {
    if (!partial || has(key)) data[key] = optionalText(body[key], max);
  }

  return { data: data as Prisma.MarketOfferUncheckedUpdateInput & Prisma.MarketOfferUncheckedCreateInput };
}

// Vue équipe d'une annonce : avec les instructeurs qui se sont positionnés
export const offerAdminInclude = {
  subject: { select: { id: true, name: true } },
  interests: {
    orderBy: { createdAt: 'asc' },
    include: {
      instructor: {
        select: { id: true, firstName: true, lastName: true, email: true, whatsapp: true, status: true, commune: true },
      },
    },
  },
} satisfies Prisma.MarketOfferInclude;

// Champs d'une annonce visibles par les instructeurs (aucune donnée sur la famille)
export const publicOfferSelect = {
  id: true,
  title: true,
  level: true,
  classe: true,
  mode: true,
  city: true,
  commune: true,
  schedule: true,
  budget: true,
  description: true,
  status: true,
  createdAt: true,
  subject: { select: { id: true, name: true } },
} satisfies Prisma.MarketOfferSelect;
