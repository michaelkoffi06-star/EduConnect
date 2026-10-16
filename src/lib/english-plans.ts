import type { EnglishManual, EnglishPlan } from '@prisma/client';

// Anglais technique : manuels et formules (§7novodecies). Fichier sans dépendance serveur,
// importable aussi par les composants clients. Pour fixer un prix : remplacer null par le
// montant en FCFA, puis redéployer. Les durées servent au calcul de la date de fin.

export const MANUALS: Record<EnglishManual, { label: string; short: string }> = {
  A: { label: 'Manuel A · Networking, Cybersecurity and Telecommunications', short: 'Réseaux, cybersécurité et télécoms' },
  B: { label: 'Manuel B · Software Engineering', short: 'Génie logiciel' },
};

// priceFcfa : null tant que le prix n'est pas décidé (la formule s'affiche « bientôt disponible »)
export const PLANS: Record<EnglishPlan, { label: string; text: string; durationDays: number; durationLabel: string; priceFcfa: number | null }> = {
  AUTONOME: {
    label: 'Autonome',
    text: 'Tout le manuel, à ton rythme.',
    durationDays: 365,
    durationLabel: '12 mois',
    priceFcfa: null,
  },
  GUIDE: {
    label: 'Parcours guidé',
    text: 'Une leçon débloquée par étape, des rappels, une attestation si tu finis à temps.',
    durationDays: 90,
    durationLabel: '3 mois',
    priceFcfa: null,
  },
  SPRINT: {
    label: 'Sprint',
    text: 'Un objectif précis : entretien d’embauche, soutenance ou entretien technique.',
    durationDays: 21,
    durationLabel: '3 semaines',
    priceFcfa: null,
  },
  COACHE: {
    label: 'Coaché',
    text: 'Séances de conversation en petit groupe, correction de tes enregistrements, soutenance blanche.',
    durationDays: 90,
    durationLabel: '3 mois',
    priceFcfa: null,
  },
};

export const PAYMENT_METHODS = {
  WAVE: 'Wave',
  ORANGE_MONEY: 'Orange Money',
  MTN_MONEY: 'MTN MoMo',
  MOOV_MONEY: 'Moov Money',
} as const;
export type PaymentMethod = keyof typeof PAYMENT_METHODS;

// Libellé court d'un abonnement, ex. « Manuel A · Autonome (12 mois) »
export function subscriptionLabel(manual: EnglishManual, plan: EnglishPlan): string {
  return `${MANUALS[manual].label.split(' · ')[0]} · ${PLANS[plan].label} (${PLANS[plan].durationLabel})`;
}

export function formatFcfa(amount: number): string {
  return `${amount.toLocaleString('fr-FR').replace(/ | /g, ' ')} FCFA`;
}

