import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import { randomUUID } from 'crypto';
import type { InstructorType, AcademicLevel } from '@prisma/client';
import { uploadToR2, BUCKET_PHOTOS, BUCKET_PRIVATE, photoKey, privateKey, photoPublicUrl } from '@/lib/r2';

const resend = new Resend(process.env.RESEND_API_KEY);

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;  // 5 Mo
const MAX_DOC_SIZE = 10 * 1024 * 1024;   // 10 Mo
const MIN_PHOTO_DIMENSION = 800;         // px, largeur ET hauteur minimales
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_DOC_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

function extFromMime(mime: string) {
  if (mime === 'application/pdf') return 'pdf';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

function getImageDimensions(buffer: Buffer, mimeType: string): { width: number; height: number } | null {
  try {
    if (mimeType === 'image/png') {
      if (buffer.length < 24) return null;
      return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
    }

    if (mimeType === 'image/jpeg') {
      let offset = 2;
      while (offset < buffer.length - 8) {
        if (buffer[offset] !== 0xff) { offset++; continue; }
        const marker = buffer[offset + 1];
        const isSOF = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
        if (isSOF) {
          return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
        }
        const segmentLength = buffer.readUInt16BE(offset + 2);
        offset += 2 + segmentLength;
      }
      return null;
    }

    if (mimeType === 'image/webp') {
      const fourCC = buffer.toString('ascii', 12, 16);
      if (fourCC === 'VP8 ') {
        return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
      }
      if (fourCC === 'VP8L') {
        const bits = buffer.readUInt32LE(21);
        return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
      }
      if (fourCC === 'VP8X') {
        const width = (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16)) + 1;
        const height = (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16)) + 1;
        return { width, height };
      }
      return null;
    }

    return null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const whatsapp = formData.get('whatsapp') as string;
    const bio = formData.get('bio') as string;
    const type = formData.get('type') as string;
    const levels = formData.get('levels') as string;
    const subjectsRaw = formData.get('subjects') as string;
    const subjects: string[] = subjectsRaw ? JSON.parse(subjectsRaw) : [];

    const photo = formData.get('photo') as File | null;
    const cni = formData.get('cni') as File | null;
    const cv = formData.get('cv') as File | null;

    if (!firstName || !lastName || !email || !whatsapp || !bio || !bio.trim() || subjects.length === 0) {
      return NextResponse.json({ error: 'Champs obligatoires manquants (dont la bio).' }, { status: 400 });
    }

    if (!photo || !cni || !cv) {
      return NextResponse.json({ error: 'Photo, CNI et CV sont tous les trois obligatoires.' }, { status: 400 });
    }

    if (!ALLOWED_PHOTO_TYPES.includes(photo.type) || photo.size > MAX_PHOTO_SIZE) {
      return NextResponse.json({ error: 'Photo invalide (JPEG/PNG/WebP, 5 Mo max).' }, { status: 400 });
    }
    if (!ALLOWED_DOC_TYPES.includes(cni.type) || cni.size > MAX_DOC_SIZE) {
      return NextResponse.json({ error: 'CNI invalide (JPEG/PNG/PDF, 10 Mo max).' }, { status: 400 });
    }
    if (!ALLOWED_DOC_TYPES.includes(cv.type) || cv.size > MAX_DOC_SIZE) {
      return NextResponse.json({ error: 'CV invalide (JPEG/PNG/PDF, 10 Mo max).' }, { status: 400 });
    }

    const photoBuffer = Buffer.from(await photo.arrayBuffer());
    const dimensions = getImageDimensions(photoBuffer, photo.type);

    if (!dimensions) {
      return NextResponse.json({ error: "Impossible de lire les dimensions de la photo. Réessaie avec un autre fichier." }, { status: 400 });
    }
    if (dimensions.width < MIN_PHOTO_DIMENSION || dimensions.height < MIN_PHOTO_DIMENSION) {
      return NextResponse.json({
        error: `Photo trop petite : ${dimensions.width}×${dimensions.height}px reçus, minimum ${MIN_PHOTO_DIMENSION}×${MIN_PHOTO_DIMENSION}px requis.`
      }, { status: 400 });
    }

    const cniBuffer = Buffer.from(await cni.arrayBuffer());
    const cvBuffer = Buffer.from(await cv.arrayBuffer());

    const instructorId = randomUUID();

    const photoExt = extFromMime(photo.type);
    const pKey = photoKey(instructorId, photoExt);
    await uploadToR2(BUCKET_PHOTOS, pKey, photoBuffer, photo.type);
    const photoUrl = photoPublicUrl(pKey);

    const cniExt = extFromMime(cni.type);
    const cvExt = extFromMime(cv.type);
    const cniFileName = `cni.${cniExt}`;
    const cvFileName = `cv.${cvExt}`;
    await uploadToR2(BUCKET_PRIVATE, privateKey(instructorId, 'cni', cniExt), cniBuffer, cni.type);
    await uploadToR2(BUCKET_PRIVATE, privateKey(instructorId, 'cv', cvExt), cvBuffer, cv.type);

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
        status: 'PENDING',
        photoUrl,
        cniUrl: cniFileName,
        cvUrl: cvFileName,
        subjects: {
          create: subjects.map((subjectId: string) => ({ subjectId })),
        },
      },
    });

    const editLink = `${req.nextUrl.origin}/modifier-profil/${newInstructor.editToken}`;

    try {
      if (!process.env.ADMIN_NOTIFICATION_EMAIL) {
        console.error("⚠️ ADMIN_NOTIFICATION_EMAIL n'est pas défini dans .env — email non envoyé.");
      } else {
        const MAX_ATTEMPTS = 3;
        let lastError = null;
        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
          const { data, error } = await resend.emails.send({
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
      await resend.emails.send({
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
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Info : email de confirmation instructeur non envoyé (normal tant que le domaine Resend n'est pas vérifié) :", emailError);
    }

    return NextResponse.json({ ...newInstructor, editLink }, { status: 201 });

  } catch (error: any) {
    console.error('Erreur inscription instructeur :', error);

    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Un compte avec cet email existe déjà.' }, { status: 409 });
    }

    return NextResponse.json({ error: 'Erreur serveur.', details: error.message }, { status: 500 });
  }
}
