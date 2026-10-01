import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/password';
import { getCurrentUser, passwordError, setUserSessionCookie, toPublicUser, unauthorized } from '@/lib/user-session';

// PATCH /api/compte — le compte connecté modifie son profil et/ou son mot de passe.
// - firstName / lastName / classe : élèves et parents (le nom d'un instructeur vient de sa fiche,
//   modifiable via son lien /modifier-profil).
// - newPassword : exige le mot de passe actuel.
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();

  try {
    const body = await req.json().catch(() => ({}));
    const data: {
      firstName?: string;
      lastName?: string;
      classe?: string | null;
      passwordHash?: string;
      sessionVersion?: { increment: number };
    } = {};

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
      // Déconnecte les autres appareils ; cette session-ci reçoit un nouveau cookie plus bas
      data.sessionVersion = { increment: 1 };
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Rien à modifier.' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
      select: { id: true, role: true, sessionVersion: true },
    });
    const fresh = {
      ...user,
      firstName: data.firstName ?? user.firstName,
      lastName: data.lastName ?? user.lastName,
      classe: data.classe !== undefined ? data.classe : user.classe,
      sessionVersion: updated.sessionVersion,
    };
    const res = NextResponse.json({ user: toPublicUser(fresh) });
    if (data.sessionVersion) await setUserSessionCookie(res, updated);
    return res;
  } catch (error) {
    console.error('Erreur mise à jour compte :', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
