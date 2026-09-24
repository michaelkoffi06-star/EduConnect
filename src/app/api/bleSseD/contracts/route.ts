export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/admin-permissions';
import type { AcademicLevel } from '@prisma/client';

// GET /api/bleSseD/contracts — liste des contrats, avec la dernière entrée mensuelle
export async function GET(request: NextRequest) {
  const denied = requireRole(request, ['SUPER_ADMIN', 'PEDAGOGIE']);
  if (denied) return denied;
  try {
    const contracts = await prisma.contract.findMany({
      include: {
        instructor: { select: { id: true, firstName: true, lastName: true } },
        subject: true,
        entries: { orderBy: { month: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(contracts, { status: 200 });
  } catch (error: any) {
    console.error('Erreur API Admin Contracts (GET):', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
  }
}

// POST /api/bleSseD/contracts — créer un nouvel engagement (instructeur + matière + niveau)
export async function POST(request: NextRequest) {
  const denied = requireRole(request, ['SUPER_ADMIN', 'PEDAGOGIE']);
  if (denied) return denied;
  try {
    const { instructorId, subjectId, level } = await request.json();

    if (!instructorId || !subjectId || !level) {
      return NextResponse.json({ error: 'Instructeur, matière et niveau sont obligatoires.' }, { status: 400 });
    }

    const contract = await prisma.contract.create({
      data: { instructorId, subjectId, level: level as AcademicLevel },
      include: {
        instructor: { select: { id: true, firstName: true, lastName: true } },
        subject: true,
        entries: true,
      },
    });

    return NextResponse.json(contract, { status: 201 });
  } catch (error: any) {
    console.error('Erreur API Admin Contracts (POST):', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
  }
}
