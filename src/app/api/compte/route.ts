import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/password';
import { getCurrentUser, passwordError, toPublicUser, unauthorized } from '@/lib/user-session';

// PATCH /api/compte — le compte connecté modifie son profil et/ou son mot de passe.
// - firstName / lastName / classe : élèves et parents (le nom d'un instructeur vient de sa fiche,
//   modifiable via son lien /modifier-profil).
// - newPassword : exige le mot de passe actuel.
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();

  try {
    const body = await req.json().catch(() => ({}));
    const data: { firstName?: string; lastName?: string; classe?: string | null; passwordHash?: string } = {};

    if (user.role !== 'INSTRUCTEUR') {
      if (body.firstName !== undefined) {
        const v = String(body.firstName).trim().slice(0, 60);
        if (!v) return NextResponse.json({ error: 'Le prénom ne peut pas être vide.' }, { status: 400 });
        data.firstName = v;
      }
      if (body.lastName !== undefined) {
        const v = String(body.lastName).trim().slice(0, 60);
        if (!v) return NextResponse.json({ error: 'Le nom ne peut pas être vide.' }, { status: 400 });
        data.lastName = v;
      }
      if (user.role === 'ELEVE' && body.classe !== undefined) {
        data.classe = String(body.classe).trim().slice(0, 30) || null;
      }
    }

    if (body.newPassword !== undefined && body.newPassword !== '') {
      const pwdError = passwordError(body.newPassword);
      if (pwdError) return NextResponse.json({ error: pwdError }, { status: 400 });
      const stored = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
      if (!stored || typeof body.currentPassword !== 'string' || !(await verifyPassword(body.currentPassword, stored.passwordHash))) {
        return NextResponse.json({ error: 'Mot de passe actuel incorrect.' }, { status: 401 });
      }
      data.passwordHash = await hashPassword(body.newPassword);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Rien à modifier.' }, { status: 400 });
    }

    await prisma.user.update({ where: { id: user.id }, data });
    const fresh = await getCurrentUser(req);
    return NextResponse.json({ user: fresh ? toPublicUser(fresh) : null });
  } catch (error) {
    console.error('Erreur mise à jour compte :', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
