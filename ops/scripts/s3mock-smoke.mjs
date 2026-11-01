import assert from 'node:assert/strict';
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import process from 'node:process';

const endpoint = process.env.S3_ENDPOINT ?? 'http://127.0.0.1:9090';
const bucket = process.env.S3_BUCKET ?? 'marshgo-private';
const client = new S3Client({
  endpoint,
  region: process.env.S3_REGION ?? 'us-east-1',
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? 'test',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? 'test',
  },
});

const key = `acceptance/s3mock-${randomUUID()}.txt`;
const payload = `MARSHGO S3 adapter smoke ${new Date().toISOString()}`;
await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: payload, ContentType: 'text/plain' }));
const metadata = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
assert.equal(metadata.ContentType, 'text/plain');
const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
assert.equal(await response.Body?.transformToString(), payload);
process.stdout.write(`S3-compatible upload/head/download passed for ${bucket}/${key}. Test object is intentionally retained.\n`);
