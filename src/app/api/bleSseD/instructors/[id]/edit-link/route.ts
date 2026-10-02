import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/admin-permissions';
import { sendNewEditLinkEmail } from '@/lib/user-emails';
import { siteOrigin } from '@/lib/site';

// POST /api/bleSseD/instructors/[id]/edit-link — remplace le lien personnel de modification
// (/modifier-profil/<editToken>) d'un instructeur, par exemple s'il a pu fuiter : l'ancien lien
// cesse aussitôt de fonctionner et le nouveau est envoyé par email à l'instructeur.
// Le jeton n'est JAMAIS renvoyé à l'équipe (voir §7sedecies).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireRole(req, ['SUPER_ADMIN']);
  if (denied) return denied;
  try {
    const { id } = await params;
    const instructor = await prisma.instructor.update({
      where: { id },
      data: { editToken: randomUUID() },
      select: { editToken: true, email: true, firstName: true, user: { select: { email: true } } },
    });

    const emailSent = await sendNewEditLinkEmail(
      instructor.user?.email || instructor.email,
      instructor.firstName,
      `${siteOrigin(req)}/modifier-profil/${instructor.editToken}`
    );

    // emailSent false : l'ancien lien est déjà invalidé, il faut réessayer (l'interface le signale)
    return NextResponse.json({ ok: true, emailSent }, { status: 200 });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Instructeur introuvable.' }, { status: 404 });
    }
    console.error('Erreur régénération du lien de modification :', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
