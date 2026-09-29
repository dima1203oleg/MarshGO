import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createVehiclePhotoUpload, isAllowedPhotoType } from '../server/objectStorage';

const variableNames = ['S3_BUCKET', 'S3_REGION', 'S3_ENDPOINT', 'S3_FORCE_PATH_STYLE', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'] as const;
const originalValues = Object.fromEntries(variableNames.map((key) => [key, process.env[key]]));

describe('S3 vehicle photo upload adapter', () => {
  after(() => {
    for (const key of variableNames) {
      const value = originalValues[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('limits accepted media types and creates a signed size-limited upload policy', async () => {
    assert.equal(isAllowedPhotoType('image/jpeg'), true);
    assert.equal(isAllowedPhotoType('image/svg+xml'), false);
    process.env.S3_BUCKET = 'marshgo-private';
    process.env.S3_REGION = 'eu-central-1';
    process.env.S3_ENDPOINT = 'http://127.0.0.1:9000';
    process.env.S3_FORCE_PATH_STYLE = 'true';
    process.env.S3_ACCESS_KEY_ID = 'local-access-key';
    process.env.S3_SECRET_ACCESS_KEY = 'local-secret-key-not-used-for-network';
    const signed = await createVehiclePhotoUpload('vehicle-photos/user/vehicle/photo-id', 'image/jpeg');
    assert.equal(signed.url, 'http://127.0.0.1:9000/marshgo-private');
    assert.equal(signed.fields.key, 'vehicle-photos/user/vehicle/photo-id');
    assert.equal(signed.fields['Content-Type'], 'image/jpeg');
    assert.equal(signed.expiresInSeconds, 300);
    const policy = JSON.parse(Buffer.from(signed.fields.Policy, 'base64').toString('utf8')) as { conditions: unknown[] };
    assert.ok(policy.conditions.some((condition) => Array.isArray(condition) && condition[0] === 'content-length-range' && condition[2] === 10 * 1024 * 1024));
  });
});
