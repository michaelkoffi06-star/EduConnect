import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(password, Buffer.from(salt, 'hex'), 64)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const derivedKey = (await scryptAsync(password, Buffer.from(saltHex, 'hex'), 64)) as Buffer;
  const storedKey = Buffer.from(hashHex, 'hex');
  if (derivedKey.length !== storedKey.length) return false;
  return timingSafeEqual(derivedKey, storedKey);
}

// Mot de passe d'un compte de l'équipe (admin) : 12 caractères au moins, car ces comptes voient les
// CNI et CV des instructeurs (voir §7sedecies). S'applique à la création et au changement de mot de
// passe ; les comptes existants gardent leur mot de passe jusqu'au prochain changement.
export const ADMIN_PASSWORD_MIN = 12;

export function adminPasswordError(password: unknown): string | null {
  if (typeof password !== 'string' || password.length < ADMIN_PASSWORD_MIN) {
    return `Le mot de passe doit faire au moins ${ADMIN_PASSWORD_MIN} caractères.`;
  }
  if (password.length > 200) return 'Le mot de passe est trop long (200 caractères maximum).';
  return null;
}
