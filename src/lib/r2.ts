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

// --- Upload direct depuis le navigateur (URLs présignées) ---
// Contourne la limite de 4,5 Mo des fonctions serverless Vercel : le fichier
// est envoyé directement du navigateur vers R2, sans passer par notre API.

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { HeadObjectCommand } from '@aws-sdk/client-s3';

export function extFromMime(mime: string) {
  if (mime === 'application/pdf') return 'pdf';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

export async function getPresignedUploadUrl(
  bucket: string,
  key: string,
  contentType: string,
  expiresIn = 300
) {
  const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
  return getSignedUrl(r2Client, command, { expiresIn });
}

export async function objectExists(bucket: string, key: string): Promise<boolean> {
  try {
    await r2Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}
