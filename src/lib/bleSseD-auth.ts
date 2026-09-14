// Utilitaires de session admin. Compatible Node ET Edge runtime
// (utilisé à la fois par le middleware et la route de login).

export const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 jours

function getSecretBytes(): Uint8Array {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error('ADMIN_SESSION_SECRET manquant dans .env');
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
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data) as BufferSource);
  return bytesToBase64Url(new Uint8Array(sig));
}

// Comparaison à temps constant pour éviter les attaques par timing
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionToken(): Promise<string> {
  const payload = JSON.stringify({ exp: Date.now() + SESSION_DURATION_MS });
  const payloadB64 = bytesToBase64Url(new TextEncoder().encode(payload));
  const signature = await hmacSign(payloadB64);
  return `${payloadB64}.${signature}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [payloadB64, signature] = token.split('.');
  if (!payloadB64 || !signature) return false;

  const expectedSignature = await hmacSign(payloadB64);
  if (!constantTimeEqual(signature, expectedSignature)) return false;

  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payloadB64)));
    return typeof payload.exp === 'number' && payload.exp > Date.now();
  } catch {
    return false;
  }
}
