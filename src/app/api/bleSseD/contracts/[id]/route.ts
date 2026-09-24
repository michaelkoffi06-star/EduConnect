import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/admin-permissions';

// GET /api/bleSseD/contracts/[id] — un contrat avec tout son historique mensuel
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = requireRole(request, ['SUPER_ADMIN', 'PEDAGOGIE']);
  if (denied) return denied;
  try {
    const { id } = await params;
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        instructor: { select: { id: true, firstName: true, lastName: true } },
        subject: true,
        entries: { orderBy: { month: 'desc' } },
      },
    });
    if (!contract) {
      return NextResponse.json({ error: 'Contrat introuvable.' }, { status: 404 });
    }
    return NextResponse.json(contract, { status: 200 });
  } catch (error: any) {
    console.error('Erreur API Admin Contracts (GET id):', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
  }
}

// DELETE /api/bleSseD/contracts/[id] — supprime un contrat et son historique
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = requireRole(request, ['SUPER_ADMIN', 'PEDAGOGIE']);
  if (denied) return denied;
  try {
    const { id } = await params;
    await prisma.contract.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Erreur API Admin Contracts (DELETE):', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
  }
}
