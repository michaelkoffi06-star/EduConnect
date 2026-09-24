export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/admin-permissions';
import { hashPassword } from '@/lib/password';

// GET /api/bleSseD/admin-users — liste des comptes (SUPER_ADMIN uniquement)
export async function GET(request: NextRequest) {
  const denied = requireRole(request, ['SUPER_ADMIN']);
  if (denied) return denied;
  try {
    const users = await prisma.adminUser.findMany({
      select: { id: true, username: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(users, { status: 200 });
  } catch (error: any) {
    console.error('Erreur API Admin Users (GET):', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
  }
}

// POST /api/bleSseD/admin-users — créer un nouveau compte (SUPER_ADMIN uniquement)
export async function POST(request: NextRequest) {
  const denied = requireRole(request, ['SUPER_ADMIN']);
  if (denied) return denied;
  try {
    const { username, password, role } = await request.json();

    if (!username || !password || !role) {
      return NextResponse.json({ error: 'Identifiant, mot de passe et rôle sont obligatoires.' }, { status: 400 });
    }
    if (!['SUPER_ADMIN', 'PEDAGOGIE', 'ADMINISTRATIF'].includes(role)) {
      return NextResponse.json({ error: 'Rôle invalide.' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Le mot de passe doit faire au moins 6 caractères.' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.adminUser.create({
      data: { username, passwordHash, role },
      select: { id: true, username: true, role: true, createdAt: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Cet identifiant est déjà pris.' }, { status: 409 });
    }
    console.error('Erreur API Admin Users (POST):', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
  }
}
