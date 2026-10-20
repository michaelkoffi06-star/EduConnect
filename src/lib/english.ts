import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import type { EnglishManual, EnglishPlan } from '@prisma/client';
import { PAYMENT_METHODS, PLANS, type PaymentMethod } from '@/lib/english-plans';

export { MANUALS, PAYMENT_METHODS, PLANS, formatFcfa, subscriptionLabel, type PaymentMethod } from '@/lib/english-plans';

// Anglais technique, côté serveur (§7novodecies) : numéros de paiement Mobile Money, ouverture
// des inscriptions, références de paiement et liens de désinscription. Les formules et les prix
// sont dans english-plans.ts ; tant qu'un prix ou les numéros manquent, la formule reste fermée.

// Object.hasOwn et non « in » : « in » accepte aussi les noms hérités de l'objet
// (constructor, toString, __proto__…), qui provoquaient une erreur 500 au lieu d'un refus.
export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === 'string' && Object.hasOwn(PAYMENT_METHODS, value);
}

export function isManual(value: unknown): value is EnglishManual {
  return value === 'A' || value === 'B';
}

export function isPlan(value: unknown): value is EnglishPlan {
  return typeof value === 'string' && Object.hasOwn(PLANS, value);
}

// Numéros marchands où payer, lus dans ENGLISH_PAYMENT_NUMBERS (variable Vercel), au format
// « WAVE=+225 07 00 00 00 00;ORANGE_MONEY=+225 07 00 00 00 00 ». Seuls les moyens listés sont proposés.
export function paymentNumbers(): { method: PaymentMethod; label: string; number: string }[] {
  const raw = process.env.ENGLISH_PAYMENT_NUMBERS || '';
  return raw
    .split(';')
    .map((part) => part.split('='))
    .filter(([key, number]) => isPaymentMethod(key?.trim()) && number?.trim())
    .map(([key, number]) => {
      const method = key.trim() as PaymentMethod;
      return { method, label: PAYMENT_METHODS[method], number: number.trim().slice(0, 40) };
    });
}

// Une formule est ouverte aux inscriptions si son prix est fixé et qu'au moins un numéro de paiement existe
export function isPlanOpen(plan: EnglishPlan): boolean {
  return PLANS[plan].priceFcfa !== null && paymentNumbers().length > 0;
}

// Code à indiquer dans le paiement : lettres et chiffres sans ambiguïté (pas de O/0, I/1)
const REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function generateReference(): string {
  let code = '';
  for (let i = 0; i < 6; i++) code += REF_ALPHABET[randomInt(REF_ALPHABET.length)];
  return `AT-${code}`;
}

export function computeEndsAt(start: Date, plan: EnglishPlan): Date {
  return new Date(start.getTime() + PLANS[plan].durationDays * 24 * 60 * 60 * 1000);
}

export function formatDateFr(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Abidjan' });
}

// --- Désinscription des emails « nouveautés » sans connexion ---
// Le lien contient l'id du compte et une signature HMAC : impossible de désinscrire quelqu'un d'autre.

function newsSecret(): string {
  const secret = process.env.USER_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error('USER_SESSION_SECRET (ou ADMIN_SESSION_SECRET) manquant dans .env');
  return secret;
}

export function newsUnsubscribeSignature(userId: string): string {
  return createHmac('sha256', newsSecret()).update(`english-news-unsubscribe.${userId}`).digest('base64url');
}

export function verifyNewsUnsubscribe(userId: unknown, signature: unknown): userId is string {
  if (typeof userId !== 'string' || typeof signature !== 'string' || userId.length > 60 || signature.length > 100) return false;
  const expected = Buffer.from(newsUnsubscribeSignature(userId));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

// --- Validation des saisies ---

export function cleanText(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, max) : '';
}
