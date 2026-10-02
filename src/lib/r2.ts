import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const accountId = process.env.R2_ACCOUNT_ID!;
const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

export const BUCKET_PHOTOS = process.env.R2_BUCKET_PHOTOS!;
export const BUCKET_PRIVATE = process.env.R2_BUCKET_PRIVATE!;
export const PUBLIC_URL_PHOTOS = process.env.R2_PUBLIC_URL_PHOTOS!;

export async function uploadToR2(bucket: string, key: string, buffer: Buffer, contentType: string) {
  await r2Client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
}

export async function deleteFromR2(bucket: string, key: string) {
  try {
    await r2Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch {
    // le fichier n'existait déjà pas, rien à faire
  }
}

export async function getFromR2(bucket: string, key: string): Promise<{ buffer: Buffer; contentType?: string } | null> {
  try {
    const res = await r2Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (!res.Body) return null;
    const bytes = await res.Body.transformToByteArray();
    return { buffer: Buffer.from(bytes), contentType: res.ContentType };
  } catch {
    return null;
  }
}

// Clé de la photo publique : "<instructorId>.<ext>" à la racine du bucket photos
export function photoKey(instructorId: string, ext: string) {
  return `${instructorId}.${ext}`;
}

// Clé d'un document privé : "instructors/<instructorId>/<baseName>.<ext>"
export function privateKey(instructorId: string, baseName: string, ext: string) {
  return `instructors/${instructorId}/${baseName}.${ext}`;
}

export function photoPublicUrl(key: string) {
  return `${PUBLIC_URL_PHOTOS}/${key}`;
}

// Clé d'un fichier de la bibliothèque de ressources : "resources/<resourceId>.<ext>"
export function resourceKey(resourceId: string, ext: string) {
  return `resources/${resourceId}.${ext}`;
}

// Clé du corrigé d'une ressource, dans le bucket PRIVÉ : "corrections/<correctionId>.<ext>"
// (servi uniquement aux comptes connectés via une URL signée, voir §7quindecies)
export function correctionKey(correctionId: string, ext: string) {
  return `corrections/${correctionId}.${ext}`;
}

// --- Upload direct depuis le navigateur (URLs présignées) ---
// Contourne la limite de 4,5 Mo des fonctions serverless Vercel : le fichier
// est envoyé directement du navigateur vers R2, sans passer par notre API.

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { HeadObjectCommand, CopyObjectCommand } from '@aws-sdk/client-s3';

export function extFromMime(mime: string) {
  if (mime === 'application/pdf') return 'pdf';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

// contentLength (optionnel) : taille exacte annoncée par le navigateur. Elle est signée avec l'URL,
// donc R2 refuse un fichier d'une autre taille ; les routes publiques l'exigent (voir §7sedecies).
export async function getPresignedUploadUrl(
  bucket: string,
  key: string,
  contentType: string,
  expiresIn = 300,
  contentLength?: number
) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ...(contentLength !== undefined && { ContentLength: contentLength }),
  });
  return getSignedUrl(r2Client, command, { expiresIn });
}

// URL de téléchargement temporaire qui force l'enregistrement du fichier (Content-Disposition:
// attachment) au lieu de l'ouvrir dans le navigateur — l'attribut HTML `download` est ignoré
// pour un fichier servi depuis un autre domaine (R2), d'où ce passage par une URL signée.
export async function getPresignedDownloadUrl(
  bucket: string,
  key: string,
  filename: string,
  expiresIn = 300
) {
  const ascii = filename.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '_');
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
  });
  return getSignedUrl(r2Client, command, { expiresIn });
}

// URL de lecture temporaire (affichage dans la page, sans forcer le téléchargement),
// pour les fichiers du bucket privé.
export async function getPresignedReadUrl(bucket: string, key: string, expiresIn = 300) {
  return getSignedUrl(r2Client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn });
}

// Taille (octets) d'un objet R2, ou null s'il n'existe pas. Sert à revérifier côté serveur
// qu'un fichier envoyé par le navigateur respecte la taille maximale.
export async function objectSize(bucket: string, key: string): Promise<number | null> {
  try {
    const res = await r2Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return res.ContentLength ?? 0;
  } catch {
    return null;
  }
}

// Tailles maximales des fichiers envoyés par les instructeurs (mêmes valeurs que les formulaires)
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const MAX_DOC_BYTES = 10 * 1024 * 1024;

// Fichiers d'une inscription d'instructeur pas encore finalisée : "pending/<instructorId>/<kind>.<ext>",
// TOUJOURS dans le bucket PRIVÉ. Ils ne sont copiés vers leur emplacement définitif (photo publique,
// CNI/CV privés) qu'au moment où la fiche est créée. Une règle de cycle de vie R2 supprime le préfixe
// "pending/" au bout d'un jour : un envoi jamais suivi d'une inscription ne reste ni public ni stocké
// (voir §7sedecies).
export function pendingKey(instructorId: string, kind: 'photo' | 'cni' | 'cv', ext: string) {
  return `pending/${instructorId}/${kind}.${ext}`;
}

// Déplace un objet (copie puis suppression de l'original). Copie côté R2 quand c'est possible ;
// sinon, repli sur lecture + écriture par le serveur (fichiers de 10 Mo au plus).
export async function moveObject(
  srcBucket: string,
  srcKey: string,
  dstBucket: string,
  dstKey: string,
  contentType: string
) {
  try {
    await r2Client.send(new CopyObjectCommand({
      Bucket: dstBucket,
      Key: dstKey,
      CopySource: `${srcBucket}/${srcKey.split('/').map(encodeURIComponent).join('/')}`,
      ContentType: contentType,
      MetadataDirective: 'REPLACE',
    }));
  } catch (copyError) {
    console.warn('CopyObject R2 en échec, repli lecture + écriture :', copyError);
    const file = await getFromR2(srcBucket, srcKey);
    if (!file) throw new Error(`Fichier introuvable : ${srcKey}`);
    await uploadToR2(dstBucket, dstKey, file.buffer, contentType);
  }
  await deleteFromR2(srcBucket, srcKey);
}

// Vérifie qu'un fichier envoyé par le navigateur est bien arrivé sur R2 et respecte la taille
// maximale ; un fichier trop lourd est supprimé. Renvoie le message d'erreur, ou null si tout va bien.
export async function uploadedFileError(bucket: string, key: string, maxBytes: number, label: string): Promise<string | null> {
  const size = await objectSize(bucket, key);
  if (size === null) return `L'upload ${label} n'a pas fini. Réessaie.`;
  if (size > maxBytes) {
    await deleteFromR2(bucket, key);
    return `Fichier trop volumineux (${label}).`;
  }
  return null;
}

export async function objectExists(bucket: string, key: string): Promise<boolean> {
  try {
    await r2Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}
