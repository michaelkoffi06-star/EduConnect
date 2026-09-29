import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getResendClient } from '@/lib/resend';
import { hashPassword } from '@/lib/password';
import { createEmailToken, normalizeEmail, passwordError } from '@/lib/user-session';
import type { InstructorType, AcademicLevel, TeachingMode } from '@prisma/client';
import {
  BUCKET_PHOTOS,
  BUCKET_PRIVATE,
  photoKey,
  privateKey,
  photoPublicUrl,
  extFromMime,
  objectExists,
} from '@/lib/r2';


const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_DOC_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Les fichiers sont désormais uploadés directement vers R2 par le navigateur
// (voir /api/register-instructor/presign), AVANT cet appel. Cette route se contente
// de vérifier que les fichiers existent bien sur R2, puis crée la fiche instructeur.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      instructorId,
      firstName,
      lastName,
      email,
      whatsapp,
      bio,
      type,
      levels,
      mode,
      city,
      commune,
      subjects,
      photoType,
      cniType,
      cvType,
      password,
    } = body;

    if (!UUID_RE.test(instructorId || '')) {
      return NextResponse.json({ error: 'Identifiant invalide.' }, { status: 400 });
    }

    if (!firstName || !lastName || !email || !whatsapp || !bio || !bio.trim() || !city || !city.trim() || !commune || !commune.trim() || !Array.isArray(subjects) || subjects.length === 0) {
      return NextResponse.json({ error: 'Champs obligatoires manquants (dont la bio, la ville et la commune).' }, { status: 400 });
    }

    if (!ALLOWED_PHOTO_TYPES.includes(photoType) || !ALLOWED_DOC_TYPES.includes(cniType) || !ALLOWED_DOC_TYPES.includes(cvType)) {
      return NextResponse.json({ error: 'Type de fichier invalide.' }, { status: 400 });
    }

    // Compte de connexion à l'espace instructeur (voir §7quindecies), créé avec la fiche
    const pwdError = passwordError(password);
    if (pwdError) {
      return NextResponse.json({ error: pwdError }, { status: 400 });
    }
    const accountEmail = normalizeEmail(email);
    const existingAccount = await prisma.user.findUnique({ where: { email: accountEmail }, select: { id: true } });
    if (existingAccount) {
      return NextResponse.json(
        { error: 'Un compte EduConnect utilise déjà cet email. Utilisez une autre adresse.' },
        { status: 409 }
      );
    }

    const photoExt = extFromMime(photoType);
    const cniExt = extFromMime(cniType);
    const cvExt = extFromMime(cvType);

    const pKey = photoKey(instructorId, photoExt);
    const cniKey = privateKey(instructorId, 'cni', cniExt);
    const cvKey = privateKey(instructorId, 'cv', cvExt);

    const [photoOk, cniOk, cvOk] = await Promise.all([
      objectExists(BUCKET_PHOTOS, pKey),
      objectExists(BUCKET_PRIVATE, cniKey),
      objectExists(BUCKET_PRIVATE, cvKey),
    ]);

    if (!photoOk || !cniOk || !cvOk) {
      return NextResponse.json(
        { error: "Un ou plusieurs fichiers n'ont pas fini d'être envoyés. Réessaie." },
        { status: 400 }
      );
    }

    const newInstructor = await prisma.instructor.create({
      data: {
        id: instructorId,
        firstName,
        lastName,
        email,
        whatsapp,
        bio,
        type: (type || 'ETUDIANT') as InstructorType,
        levels: (levels || 'ALL') as AcademicLevel,
        mode: (mode || 'DOMICILE') as TeachingMode,
        city,
        commune,
        status: 'PENDING',
        photoUrl: photoPublicUrl(pKey),
        cniUrl: `cni.${cniExt}`,
        cvUrl: `cv.${cvExt}`,
        subjects: {
          create: subjects.map((subjectId: string) => ({ subjectId })),
        },
        user: {
          create: {
            email: accountEmail,
            passwordHash: await hashPassword(password),
            role: 'INSTRUCTEUR',
            firstName,
            lastName,
          },
        },
      },
      include: { user: { select: { id: true } } },
    });

    const editLink = `${req.nextUrl.origin}/modifier-profil/${newInstructor.editToken}`;
    const verifyToken = newInstructor.user ? await createEmailToken(newInstructor.user.id, 'VERIFY_EMAIL') : null;
    const verifyLink = verifyToken ? `${req.nextUrl.origin}/api/compte/confirmer?jeton=${verifyToken}` : null;

    try {
      if (!process.env.ADMIN_NOTIFICATION_EMAIL) {
        console.error("⚠️ ADMIN_NOTIFICATION_EMAIL n'est pas défini dans .env — email non envoyé.");
      } else {
        const MAX_ATTEMPTS = 3;
        let lastError = null;
        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
          const { data, error } = await getResendClient().emails.send({
            from: 'EduConnect <notifications@educonnect-ci.org>',
            to: [process.env.ADMIN_NOTIFICATION_EMAIL],
            subject: '🎓 Nouvelle candidature instructeur reçue !',
            html: `<p>Candidature de <strong>${newInstructor.firstName} ${newInstructor.lastName}</strong> reçue et en attente de validation dans l'espace admin.</p>`,
          });
          if (!error) {
            console.log("✅ Email admin envoyé, id:", data?.id, `(tentative ${attempt})`);
            lastError = null;
            break;
          }
          lastError = error;
          console.error(`⚠️ Tentative ${attempt}/${MAX_ATTEMPTS} échouée :`, JSON.stringify(error, null, 2));
          if (attempt < MAX_ATTEMPTS) await new Promise((r) => setTimeout(r, attempt * 500));
        }
        if (lastError) console.error("❌ Échec définitif de l'envoi (admin) après", MAX_ATTEMPTS, "tentatives.");
      }
    } catch (emailError) {
      console.error("Erreur envoi email admin :", emailError);
    }

    try {
      await getResendClient().emails.send({
        from: 'EduConnect <notifications@educonnect-ci.org>',
        to: [email],
        subject: '✅ Votre candidature EduConnect a bien été reçue',
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #c9951a;">Bonjour ${firstName},</h2>
            <p>Votre candidature a bien été enregistrée et est en attente de validation.</p>
            <p>Vous pouvez modifier votre profil à tout moment via ce lien personnel :</p>
            <p><a href="${editLink}">${editLink}</a></p>
            <p style="font-size: 12px; color: #888;">Conservez ce lien, il n'est envoyé qu'une seule fois.</p>
            ${verifyLink ? `
            <p style="margin-top: 20px;">Confirmez aussi votre adresse email pour activer votre compte EduConnect
            (espace instructeur, bibliothèque des corrigés, forum) :</p>
            <p><a href="${verifyLink}">Confirmer mon email</a></p>
            <p style="font-size: 12px; color: #888;">Le marché des annonces et la salle des profs s'ouvriront dès que votre profil sera approuvé.</p>
            ` : ''}
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Info : email de confirmation instructeur non envoyé :", emailError);
    }

    return NextResponse.json({ ...newInstructor, user: undefined, editLink }, { status: 201 });

  } catch (error: any) {
    console.error('Erreur inscription instructeur :', error);

    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Un compte avec cet email existe déjà.' }, { status: 409 });
    }

    return NextResponse.json({ error: 'Erreur serveur.', details: error.message }, { status: 500 });
  }
}
