import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/admin-permissions';
import { hashPassword } from '@/lib/password';
import type { AdminRole } from '@prisma/client';

// PATCH /api/bleSseD/admin-users/[id] — modifier un compte (SUPER_ADMIN uniquement)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = requireRole(request, ['SUPER_ADMIN']);
  if (denied) return denied;
  try {
    const { id } = await params;
    const { username, password, role } = await request.json();

    const data: { username?: string; passwordHash?: string; role?: AdminRole } = {};

    if (typeof username === 'string' && username.trim()) {
      data.username = username.trim();
    }
    if (typeof password === 'string' && password.length > 0) {
      if (password.length < 6) {
        return NextResponse.json({ error: 'Le mot de passe doit faire au moins 6 caractères.' }, { status: 400 });
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
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
  }
}

// DELETE /api/bleSseD/admin-users/[id] — supprimer un compte (SUPER_ADMIN uniquement)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = requireRole(request, ['SUPER_ADMIN']);
  if (denied) return denied;
  try {
    const { id } = await params;
    await prisma.adminUser.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Compte introuvable.' }, { status: 404 });
    }
    console.error('Erreur API Admin Users (DELETE):', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
  }
}
