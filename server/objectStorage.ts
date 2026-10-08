import crypto from 'node:crypto';
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { fileTypeFromBuffer } from 'file-type';

const maxPhotoBytes = 10 * 1024 * 1024;
const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const maxVerificationEvidenceBytes = 8 * 1024 * 1024;
const allowedVerificationEvidenceTypes = new Set(['image/jpeg', 'image/png', 'application/pdf']);
let client: S3Client | null = null;

export class ObjectStorageUnavailableError extends Error {
  constructor() { super('S3-compatible object storage is not configured'); }
}

export class StoredEvidenceUnavailableError extends Error {
  constructor() { super('Private verification evidence is missing or invalid'); }
}

function s3() {
  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION;
  if (!bucket || !region) throw new ObjectStorageUnavailableError();
  if (!client) client = new S3Client({
    region,
    ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT, forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true' } : {}),
    ...(process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
      ? { credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY } }
      : {}),
  });
  return { client, bucket };
}

export function isAllowedPhotoType(value: unknown): value is string {
  return typeof value === 'string' && allowedImageTypes.has(value);
}

export function isAllowedVerificationEvidenceType(value: unknown): value is string {
  return typeof value === 'string' && allowedVerificationEvidenceTypes.has(value);
}

export async function createVehiclePhotoUpload(key: string, contentType: string) {
  const { client: s3Client, bucket } = s3();
  const post = await createPresignedPost(s3Client, {
    Bucket: bucket,
    Key: key,
    Expires: 300,
    Fields: { 'Content-Type': contentType },
    Conditions: [
      ['content-length-range', 1, maxPhotoBytes],
      ['eq', '$Content-Type', contentType],
    ],
  });
  return { ...post, expiresInSeconds: 300, maxBytes: maxPhotoBytes };
}

export async function createVerificationEvidenceUpload(key: string, contentType: string) {
  if (!isAllowedVerificationEvidenceType(contentType)) throw new Error('Unsupported verification evidence media type');
  const { client: s3Client, bucket } = s3();
  const post = await createPresignedPost(s3Client, {
    Bucket: bucket,
    Key: key,
    Expires: 300,
    Fields: { 'Content-Type': contentType },
    Conditions: [
      ['content-length-range', 1, maxVerificationEvidenceBytes],
      ['eq', '$Content-Type', contentType],
    ],
  });
  return { ...post, expiresInSeconds: 300, maxBytes: maxVerificationEvidenceBytes };
}

export async function verifyVerificationEvidenceObject(key: string, expectedType: string) {
  if (!isAllowedVerificationEvidenceType(expectedType)) return false;
  const { client: s3Client, bucket } = s3();
  const metadata = await s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  if (!metadata.ContentLength || metadata.ContentLength < 1 || metadata.ContentLength > maxVerificationEvidenceBytes || metadata.ContentType !== expectedType) {
    return false;
  }
  const response = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key, Range: 'bytes=0-4095' }));
  if (!response.Body) return false;
  const bytes = Buffer.from(await response.Body.transformToByteArray());
  const detected = await fileTypeFromBuffer(bytes);
  return detected?.mime === expectedType;
}

export async function verifyVehiclePhotoObject(key: string, expectedType: string) {
  const { client: s3Client, bucket } = s3();
  const metadata = await s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  if (!metadata.ContentLength || metadata.ContentLength < 1 || metadata.ContentLength > maxPhotoBytes || metadata.ContentType !== expectedType) {
    return false;
  }
  const response = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key, Range: 'bytes=0-4095' }));
  if (!response.Body) return false;
  const bytes = Buffer.from(await response.Body.transformToByteArray());
  const detected = await fileTypeFromBuffer(bytes);
  return detected?.mime === expectedType;
}

const mediaSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const mediaSign = (key: string, expires: number) => crypto.createHmac('sha256', mediaSecret).update(`${key}.${expires}`).digest('base64url');
const photoPrefix = /^(vehicle-photos|driver-photos)\//;

/**
 * Photos are shown through this API (a short-lived signed same-origin path), never through a raw S3 URL: the storage endpoint
 * is usually private/localhost and unreachable from a phone behind a tunnel or a CDN.
 */
export async function getVehiclePhotoUrl(key: string) {
  s3(); // throws ObjectStorageUnavailableError when storage is not configured
  const expires = Date.now() + 15 * 60_000;
  return `/api/v1/media/photo/${Buffer.from(key).toString('base64url')}?e=${expires}&s=${mediaSign(key, expires)}`;
}

/** Validates a signed media path and returns the stored key, or null. */
export function verifyMediaRequest(encodedKey: string, expires: string, signature: string): string | null {
  const key = Buffer.from(encodedKey, 'base64url').toString();
  const e = Number(expires);
  if (!photoPrefix.test(key) || !Number.isFinite(e) || e < Date.now() || typeof signature !== 'string') return null;
  const expected = Buffer.from(mediaSign(key, e)); const given = Buffer.from(signature);
  return expected.length === given.length && crypto.timingSafeEqual(expected, given) ? key : null;
}

export async function readPhotoObject(key: string) {
  const { client: s3Client, bucket } = s3();
  const object = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  return { body: object.Body!, contentType: object.ContentType ?? 'application/octet-stream', contentLength: object.ContentLength };
}

/** Server-side upload: the browser sends the file to the API, which validates it and stores it. */
export async function putPhotoObject(key: string, body: Buffer, contentType: string) {
  if (!isAllowedPhotoType(contentType) || body.length < 1 || body.length > maxPhotoBytes) throw new Error('Unsupported photo');
  const detected = await fileTypeFromBuffer(body);
  if (detected?.mime !== contentType) throw new Error('Photo content does not match its type');
  const { client: s3Client, bucket } = s3();
  await s3Client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }));
}

export async function deleteStoredVehiclePhoto(key: string) {
  const { client: s3Client, bucket } = s3();
  await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function getVerificationEvidenceUrl(key: string) {
  const { client: s3Client, bucket } = s3();
  const metadata = await s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  if (!metadata.ContentLength || metadata.ContentLength > maxVerificationEvidenceBytes ||
      !isAllowedVerificationEvidenceType(metadata.ContentType)) throw new StoredEvidenceUnavailableError();
  return getSignedUrl(s3Client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 180 });
}

export async function deleteStoredVerificationEvidence(key: string) {
  const { client: s3Client, bucket } = s3();
  await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
