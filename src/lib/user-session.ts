import { createHash, randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import type { Prisma, UserTokenType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  USER_SESSION_COOKIE,
  USER_SESSION_MAX_AGE,
  createUserSessionToken,
  verifyUserSessionToken,
  type UserRole,
} from '@/lib/user-auth';

// Outils serveur des comptes utilisateurs (voir §7quindecies de la doc) : lecture du compte
// connecté, cookie de session, jetons envoyés par email, limitation des tentatives.

const currentUserSelect = {
  id: true,
  email: true,
  role: true,
  firstName: true,
  lastName: true,
  classe: true,
  emailVerifiedAt: true,
  createdAt: true,
  instructor: {
    select: {
      id: true,
      status: true,
      editToken: true,
      subjects: { select: { subjectId: true } },
    },
  },
} satisfies Prisma.UserSelect;

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof loadUser>>>;

async function loadUser(id: string) {
  return prisma.user.findUnique({ where: { id }, select: currentUserSelect });
}

// Compte connecté à partir de la valeur du cookie (routes API et pages serveur).
// null si pas de session valide, compte supprimé ou email non confirmé.
export async function getUserFromToken(token: string | undefined | null): Promise<CurrentUser | null> {
  const session = await verifyUserSessionToken(token);
  if (!session) return null;
  const user = await loadUser(session.sub);
  if (!user || !user.emailVerifiedAt) return null;
  return user;
}

export function getCurrentUser(request: NextRequest): Promise<CurrentUser | null> {
  return getUserFromToken(request.cookies.get(USER_SESSION_COOKIE)?.value);
}

// Instructeur dont la fiche a été approuvée par l'équipe : seul à accéder au marché
// et à la salle des profs.
export function isApprovedInstructor(user: CurrentUser | null): boolean {
  return !!user && user.role === 'INSTRUCTEUR' && user.instructor?.status === 'APPROVED';
}

// Réponses d'erreur communes aux routes réservées aux comptes
export function unauthorized() {
  return NextResponse.json({ error: 'Connecte-toi pour accéder à ce contenu.' }, { status: 401 });
}

export function forbiddenForInstructors() {
  return NextResponse.json(
    { error: 'Réservé aux instructeurs dont le profil a été approuvé par l’équipe EduConnect.' },
    { status: 403 }
  );
}

// Forme renvoyée au navigateur (jamais le hash du mot de passe)
export function toPublicUser(user: CurrentUser) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    classe: user.classe,
    createdAt: user.createdAt,
    instructorStatus: user.instructor?.status ?? null,
    isApprovedInstructor: isApprovedInstructor(user),
    // Lien d'auto-édition de la fiche (§7quater) : le compte a prouvé posséder l'email de la fiche
    instructorEditPath: user.instructor ? `/modifier-profil/${user.instructor.editToken}` : null,
  };
}

// Nom affiché publiquement (forum) : prénom + initiale du nom, ex. "Awa K."
export function displayName(user: { firstName: string; lastName: string }): string {
  const initial = user.lastName.trim().charAt(0).toUpperCase();
  return initial ? `${user.firstName.trim()} ${initial}.` : user.firstName.trim();
}

export async function setUserSessionCookie(res: NextResponse, user: { id: string; role: UserRole }) {
  const token = await createUserSessionToken(user);
  res.cookies.set(USER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: USER_SESSION_MAX_AGE,
  });
}

export function clearUserSessionCookie(res: NextResponse) {
  res.cookies.set(USER_SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}

// --- Validation des saisies ---

export function normalizeEmail(raw: unknown): string {
  return typeof raw === 'string' ? raw.trim().toLowerCase() : '';
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 8;

export function passwordError(password: unknown): string | null {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`;
  }
  if (password.length > 200) return 'Mot de passe trop long.';
  return null;
}

// --- Jetons à usage unique envoyés par email ---
// Le jeton en clair n'est jamais stocké : seule son empreinte SHA-256 est en base.

const TOKEN_TTL_MS: Record<UserTokenType, number> = {
  VERIFY_EMAIL: 1000 * 60 * 60 * 48, // 48 h
  RESET_PASSWORD: 1000 * 60 * 60, // 1 h
};

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createEmailToken(userId: string, type: UserTokenType): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  // Un seul jeton actif par type : les liens envoyés précédemment deviennent invalides
  await prisma.userToken.deleteMany({ where: { userId, type, usedAt: null } });
  await prisma.userToken.create({
    data: { userId, type, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + TOKEN_TTL_MS[type]) },
  });
  return token;
}

// Consomme un jeton : renvoie l'id du compte s'il est valide, sinon null.
export async function consumeEmailToken(token: unknown, type: UserTokenType): Promise<string | null> {
  if (typeof token !== 'string' || token.length < 20 || token.length > 100) return null;
  const record = await prisma.userToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.type !== type || record.usedAt || record.expiresAt <= new Date()) return null;
  // updateMany + condition usedAt: null : un même jeton ne peut pas être consommé deux fois
  const { count } = await prisma.userToken.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  return count === 1 ? record.userId : null;
}

// --- Limitation des tentatives (même table que la connexion admin, préfixe dédié) ---

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}

export async function tooManyAttempts(scope: string, request: NextRequest): Promise<boolean> {
  const count = await prisma.loginAttempt.count({
    where: { ip: `${scope}:${getClientIp(request)}`, createdAt: { gte: new Date(Date.now() - WINDOW_MS) } },
  });
  return count >= MAX_ATTEMPTS;
}

export async function recordAttempt(scope: string, request: NextRequest) {
  await prisma.loginAttempt.create({ data: { ip: `${scope}:${getClientIp(request)}` } }).catch(() => {});
}
