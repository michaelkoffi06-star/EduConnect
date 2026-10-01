import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { EMAIL_RE, createEmailToken, normalizeEmail, passwordError } from '@/lib/user-session';
import { sendVerificationEmail } from '@/lib/user-emails';
import { rateLimit, HOUR } from '@/lib/rate-limit';
import { siteOrigin } from '@/lib/site';

// POST /api/compte/inscription — création d'un compte élève, parent ou instructeur.
// - ELEVE / PARENT : prénom, nom, email, mot de passe (+ classe pour l'élève).
// - INSTRUCTEUR : le compte est rattaché à la fiche instructeur existante portant le même
//   email (inscription préalable via /register-instructor). Les nouveaux instructeurs
//   créent leur compte directement depuis /register-instructor.
// Le compte est inutilisable tant que l'email n'est pas confirmé (lien envoyé par email).
export async function POST(req: NextRequest) {
  // Chaque inscription envoie un email : nombre limité par IP (voir §7sedecies)
  const limited = await rateLimit(req, 'inscription-compte', 5, HOUR);
  if (limited) return limited;

  try {
    const body = await req.json().catch(() => ({}));
    const role = body?.role;
    const email = normalizeEmail(body?.email);
    const password = body?.password;

    if (role !== 'ELEVE' && role !== 'PARENT' && role !== 'INSTRUCTEUR') {
      return NextResponse.json({ error: 'Choisis un type de compte.' }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Adresse email invalide.' }, { status: 400 });
    }
    const pwdError = passwordError(password);
    if (pwdError) return NextResponse.json({ error: pwdError }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      return NextResponse.json(
        { error: 'Un compte existe déjà avec cet email. Connecte-toi, ou utilise « Mot de passe oublié ».' },
        { status: 409 }
      );
    }

    let firstName: string;
    let lastName: string;
    let classe: string | null = null;
    let instructorId: string | null = null;

    if (role === 'INSTRUCTEUR') {
      const instructor = await prisma.instructor.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        select: { id: true, firstName: true, lastName: true, user: { select: { id: true } } },
      });
      if (!instructor) {
        return NextResponse.json(
          {
            error: "Aucune fiche instructeur n'utilise cet email. Inscrivez-vous d'abord comme instructeur.",
            code: 'NO_INSTRUCTOR',
          },
          { status: 404 }
        );
      }
      if (instructor.user) {
        return NextResponse.json({ error: 'Un compte existe déjà pour cette fiche instructeur.' }, { status: 409 });
      }
      firstName = instructor.firstName;
      lastName = instructor.lastName;
      instructorId = instructor.id;
    } else {
      firstName = typeof body.firstName === 'string' ? body.firstName.trim().slice(0, 60) : '';
      lastName = typeof body.lastName === 'string' ? body.lastName.trim().slice(0, 60) : '';
      if (!firstName || !lastName) {
        return NextResponse.json({ error: 'Prénom et nom sont obligatoires.' }, { status: 400 });
      }
      if (role === 'ELEVE' && typeof body.classe === 'string' && body.classe.trim()) {
        classe = body.classe.trim().slice(0, 30);
      }
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
        role,
        firstName,
        lastName,
        classe,
        instructorId,
      },
      select: { id: true, firstName: true },
    });

    const token = await createEmailToken(user.id, 'VERIFY_EMAIL');
    await sendVerificationEmail(email, user.firstName, `${siteOrigin(req)}/connexion?jeton=${token}`);

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Un compte existe déjà avec cet email.' }, { status: 409 });
    }
    console.error('Erreur inscription compte :', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
