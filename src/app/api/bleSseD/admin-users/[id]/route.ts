import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/admin-permissions';
import { hashPassword, adminPasswordError } from '@/lib/password';
import type { AdminRole } from '@prisma/client';

// Refuse de retirer le rôle SUPER_ADMIN (rétrogradation ou suppression) au dernier compte qui l'a.
async function lastSuperAdminError(id: string): Promise<string | null> {
  const target = await prisma.adminUser.findUnique({ where: { id }, select: { role: true } });
  if (target?.role !== 'SUPER_ADMIN') return null;
  const superAdmins = await prisma.adminUser.count({ where: { role: 'SUPER_ADMIN' } });
  return superAdmins <= 1 ? 'Impossible : il doit rester au moins un compte SUPER_ADMIN.' : null;
}

// PATCH /api/bleSseD/admin-users/[id] — modifier un compte (SUPER_ADMIN uniquement)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireRole(request, ['SUPER_ADMIN']);
  if (denied) return denied;
  try {
    const { id } = await params;
    const { username, password, role } = await request.json();

    const data: {
      username?: string;
      passwordHash?: string;
      role?: AdminRole;
      sessionVersion?: { increment: number };
    } = {};

    if (typeof username === 'string' && username.trim()) {
      if (username.trim().length > 50) {
        return NextResponse.json({ error: 'Identifiant trop long (50 caractères maximum).' }, { status: 400 });
      }
      data.username = username.trim();
    }
    if (typeof password === 'string' && password.length > 0) {
      const pwdError = adminPasswordError(password);
      if (pwdError) {
        return NextResponse.json({ error: pwdError }, { status: 400 });
      }
      data.passwordHash = await hashPassword(password);
    }
    if (typeof role === 'string') {
      if (!['SUPER_ADMIN', 'PEDAGOGIE', 'ADMINISTRATIF'].includes(role)) {
        return NextResponse.json({ error: 'Rôle invalide.' }, { status: 400 });
      }
      data.role = role as AdminRole;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Rien à modifier.' }, { status: 400 });
    }
    // Il doit toujours rester au moins un SUPER_ADMIN : sans lui, plus personne ne gère les comptes
    // et la clé de secours (réservée au SUPER_ADMIN) ne sert plus à rien.
    if (data.role && data.role !== 'SUPER_ADMIN') {
      const blocked = await lastSuperAdminError(id);
      if (blocked) return NextResponse.json({ error: blocked }, { status: 409 });
    }
    // Mot de passe ou rôle changé : la personne est déconnectée partout (voir §7sedecies)
    if (data.passwordHash || data.role) data.sessionVersion = { increment: 1 };

    const updated = await prisma.adminUser.update({
      where: { id },
      data,
      select: { id: true, username: true, role: true, createdAt: true },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Cet identifiant est déjà pris.' }, { status: 409 });
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Compte introuvable.' }, { status: 404 });
    }
    console.error('Erreur API Admin Users (PATCH):', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/bleSseD/admin-users/[id] — supprimer un compte (SUPER_ADMIN uniquement)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireRole(request, ['SUPER_ADMIN']);
  if (denied) return denied;
  try {
    const { id } = await params;
    if (id === request.headers.get('x-admin-id')) {
      return NextResponse.json({ error: 'Tu ne peux pas supprimer ton propre compte.' }, { status: 409 });
    }
    const blocked = await lastSuperAdminError(id);
    if (blocked) return NextResponse.json({ error: blocked }, { status: 409 });
    await prisma.adminUser.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Compte introuvable.' }, { status: 404 });
    }
    console.error('Erreur API Admin Users (DELETE):', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
