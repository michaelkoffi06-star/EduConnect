import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/admin-permissions';

function csvEscape(value: string | number): string {
  const str = String(value ?? '');
  if (str.includes(';') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// GET /api/bleSseD/instructors/[id]/export — fiche récapitulative CSV (infos + contrats)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = requireRole(request, ['SUPER_ADMIN', 'PEDAGOGIE']);
  if (denied) return denied;

  try {
    const { id } = await params;
    const instructor = await prisma.instructor.findUnique({
      where: { id },
      include: {
        subjects: { include: { subject: true } },
        contracts: {
          include: { subject: true, entries: { orderBy: { month: 'asc' } } },
        },
      },
    });

    if (!instructor) {
      return NextResponse.json({ error: 'Instructeur introuvable.' }, { status: 404 });
    }

    const lines: string[] = [];

    lines.push('Informations instructeur');
    lines.push(['Nom', 'Email', 'WhatsApp', 'Type', 'Niveaux', 'Mode', 'Ville', 'Commune', 'Statut', 'Matières']
      .map(csvEscape).join(';'));
    lines.push([
      `${instructor.firstName} ${instructor.lastName}`,
      instructor.email,
      instructor.whatsapp,
      instructor.type,
      instructor.levels,
      instructor.mode,
      instructor.city || '',
      instructor.commune || '',
      instructor.status,
      instructor.subjects.map((s) => s.subject.name).join(', '),
    ].map(csvEscape).join(';'));

    lines.push('');
    lines.push('Historique des contrats');
    lines.push(['Matière', 'Niveau', 'Mois', 'Élèves', 'Séances', 'Montant reçu (FCFA)'].map(csvEscape).join(';'));

    for (const contract of instructor.contracts) {
      for (const entry of contract.entries) {
        lines.push([
          contract.subject.name,
          contract.level,
          new Date(entry.month).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
          entry.studentCount,
          entry.sessionCount,
          entry.amountReceived,
        ].map(csvEscape).join(';'));
      }
    }

    const csvContent = '\uFEFF' + lines.join('\n'); // BOM pour un bon affichage des accents dans Excel
    const safeName = `${instructor.firstName}-${instructor.lastName}`.replace(/[^a-zA-Z0-9-]/g, '_');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="fiche-${safeName}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('Erreur export instructeur (CSV):', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
  }
}
