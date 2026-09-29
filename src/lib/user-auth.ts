// Session des comptes utilisateurs (élèves, parents, instructeurs) — distincte de la session
// admin (bleSseD-auth.ts). Compatible Node ET Edge runtime (utilisée par le middleware).
// Même principe que la session admin : cookie httpOnly signé en HMAC-SHA256. La signature
// porte sur un préfixe propre ("user-session.") : un jeton utilisateur ne peut jamais être
// accepté comme jeton admin, et inversement, même si le secret est partagé.

export const USER_SESSION_COOKIE = 'user_session';
export const USER_SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 jours, en secondes

export type UserRole = 'ELEVE' | 'PARENT' | 'INSTRUCTEUR';

export interface UserSessionPayload {
  sub: string;
  role: UserRole;
  exp: number;
}

function getSecretBytes(): Uint8Array {
  const secret = process.env.USER_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error('USER_SESSION_SECRET (ou ADMIN_SESSION_SECRET) manquant dans .env');
  return new TextEncoder().encode(secret);
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(str: string): Uint8Array {
  const padLength = (4 - (str.length % 4)) % 4;
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(padLength);
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function hmacSign(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    getSecretBytes() as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`user-session.${data}`) as BufferSource);
  return bytesToBase64Url(new Uint8Array(sig));
}

// Comparaison à temps constant pour éviter les attaques par timing
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createUserSessionToken(user: { id: string; role: UserRole }): Promise<string> {
  const payload = JSON.stringify({ sub: user.id, role: user.role, exp: Date.now() + USER_SESSION_MAX_AGE * 1000 });
  const payloadB64 = bytesToBase64Url(new TextEncoder().encode(payload));
  const signature = await hmacSign(payloadB64);
  return `${payloadB64}.${signature}`;
}

// Retourne le contenu de la session si le jeton est valide et non expiré, sinon null.
// Ne vérifie PAS que le compte existe encore : les routes API relisent le compte en base
// (voir getCurrentUser dans user-session.ts).
export async function verifyUserSessionToken(token: string | undefined | null): Promise<UserSessionPayload | null> {
  if (!token) return null;
  const [payloadB64, signature] = token.split('.');
  if (!payloadB64 || !signature) return null;

  const expectedSignature = await hmacSign(payloadB64);
  if (!constantTimeEqual(signature, expectedSignature)) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payloadB64)));
    if (typeof payload.exp !== 'number' || payload.exp <= Date.now()) return null;
    if (typeof payload.sub !== 'string' || typeof payload.role !== 'string') return null;
    return payload as UserSessionPayload;
  } catch {
    return null;
  }
}
