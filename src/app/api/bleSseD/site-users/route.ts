export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { Prisma, UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/admin-permissions';

// GET /api/bleSseD/site-users — comptes du site (élèves, parents, instructeurs, apprenants) pour
// l'onglet « Utilisateurs du site » du panneau /bleSseD (§7vicies). SUPER_ADMIN uniquement : la liste
// contient les emails de tous les inscrits.
// Filtres : role (ELEVE | PARENT | INSTRUCTEUR | APPRENANT), verified (yes | no), q (nom ou email).
// ?format=csv renvoie la liste filtrée en CSV (séparateur « ; », ouvrable dans Excel).

const ROLES: UserRole[] = ['ELEVE', 'PARENT', 'INSTRUCTEUR', 'APPRENANT'];
const ROLE_LABELS: Record<UserRole, string> = {
  ELEVE: 'Élève',
  PARENT: 'Parent',
  INSTRUCTEUR: 'Instructeur',
  APPRENANT: 'Apprenant (anglais technique)',
};
const MAX_ROWS = 5000;

// Cellule CSV : guillemets si besoin, et apostrophe devant = + - @ pour qu'Excel n'exécute pas
// une formule glissée dans un nom (les noms viennent des formulaires publics, voir §7sedecies).
function csvCell(value: string): string {
  let v = value;
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
  return /[;"\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function formatDate(d: Date | null): string {
  return d ? d.toLocaleDateString('fr-FR', { timeZone: 'Africa/Abidjan' }) : '';
}

export async function GET(request: NextRequest) {
  const denied = await requireRole(request, ['SUPER_ADMIN']);
  if (denied) return denied;
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const verified = searchParams.get('verified');
    const q = searchParams.get('q')?.trim().slice(0, 100);

    const where: Prisma.UserWhereInput = {
      ...(role && (ROLES as string[]).includes(role) && { role: role as UserRole }),
      ...(verified === 'yes' && { emailVerifiedAt: { not: null } }),
      ...(verified === 'no' && { emailVerifiedAt: null }),
      ...(q && {
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
        ],
      }),
    };

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: MAX_ROWS,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        classe: true,
        studyField: true,
        emailVerifiedAt: true,
        englishNewsOptIn: true,
        createdAt: true,
        instructor: { select: { status: true } },
        _count: { select: { englishSubscriptions: true, forumThreads: true, forumPosts: true } },
      },
    });

    if (searchParams.get('format') === 'csv') {
      const header = ['Prénom', 'Nom', 'Email', 'Type de compte', 'Email confirmé', 'Classe / études', 'Inscrit le'];
      const lines = [header.join(';')];
      for (const u of users) {
        lines.push(
          [
            u.firstName,
            u.lastName,
            u.email,
            ROLE_LABELS[u.role],
            u.emailVerifiedAt ? 'Oui' : 'Non',
            u.classe || u.studyField || '',
            formatDate(u.createdAt),
          ]
            .map(csvCell)
            .join(';')
        );
      }
      const date = new Date().toISOString().slice(0, 10);
      return new NextResponse('﻿' + lines.join('\r\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="comptes-educonnect-${date}.csv"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    // Compteurs sur l'ensemble des comptes (indépendants des filtres)
    const [byRole, verifiedCount, total, last30] = await Promise.all([
      prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
      prisma.user.count({ where: { emailVerifiedAt: { not: null } } }),
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
    ]);
    const roles = Object.fromEntries(ROLES.map((r) => [r, 0])) as Record<UserRole, number>;
    for (const g of byRole) roles[g.role] = g._count._all;

    return NextResponse.json(
      {
        users,
        truncated: users.length === MAX_ROWS,
        stats: { total, verified: verifiedCount, last30Days: last30, roles },
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Erreur API Admin comptes du site :', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
