import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/admin-permissions';

// POST /api/bleSseD/contracts/[id]/entries — ajoute/écrase l'entrée d'un mois donné
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = requireRole(request, ['SUPER_ADMIN', 'PEDAGOGIE']);
  if (denied) return denied;
  try {
    const { id } = await params;
    const { month, studentCount, sessionCount, amountReceived } = await request.json();

    if (!month || studentCount == null || sessionCount == null || amountReceived == null) {
      return NextResponse.json({ error: 'Tous les champs sont obligatoires.' }, { status: 400 });
    }

    const entry = await prisma.contractEntry.upsert({
      where: { contractId_month: { contractId: id, month: new Date(month) } },
      update: { studentCount, sessionCount, amountReceived },
      create: {
        contractId: id,
        month: new Date(month),
        studentCount,
        sessionCount,
        amountReceived,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error: any) {
    console.error('Erreur API Admin Contract Entries (POST):', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
  }
}
