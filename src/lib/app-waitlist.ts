import { EMAIL_RE, normalizeEmail } from '@/lib/user-session';

// Liste d'attente de l'application mobile (§7unvicies) : un seul champ, email ou numéro WhatsApp.

export type WaitlistContact = { email: string } | { whatsapp: string };

// Numéro WhatsApp au format international. Un numéro ivoirien à 10 chiffres saisi sans indicatif
// reçoit +225 ; « 00 » en tête devient « + ». 8 à 15 chiffres (norme E.164).
export function normalizeWhatsapp(value: string): string | null {
  let v = value.replace(/[\s.()\-]/g, '');
  if (v.startsWith('00')) v = '+' + v.slice(2);
  if (/^\d{10}$/.test(v)) v = '+225' + v;
  if (!/^\+\d{8,15}$/.test(v)) return null;
  return v;
}

export function parseContact(value: unknown): WaitlistContact | null {
  if (typeof value !== 'string') return null;
  const raw = value.trim().slice(0, 200);
  if (!raw) return null;
  if (raw.includes('@')) {
    const email = normalizeEmail(raw);
    return EMAIL_RE.test(email) ? { email } : null;
  }
  const whatsapp = normalizeWhatsapp(raw);
  return whatsapp ? { whatsapp } : null;
}
