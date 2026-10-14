import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const manifest = JSON.parse(readFileSync(join(root, 'RELEASE_MANIFEST.json'), 'utf8'));
const errors = [];
const shaPattern = /^[a-f0-9]{40}$/;
const digestPattern = /^sha256:[a-f0-9]{64}$/;
const requiredComponents = ['server', 'site', 'ios', 'admin', 'partner'];

function requireValue(condition, message) {
  if (!condition) errors.push(message);
}

requireValue(typeof manifest.release_id === 'string' && manifest.release_id.length > 0, 'release_id is required');
requireValue(typeof manifest.api_contract_version === 'string' && manifest.api_contract_version.length > 0, 'api_contract_version is required');
requireValue(typeof manifest.database_migration_version === 'string' && manifest.database_migration_version.length > 0, 'database_migration_version is required');
requireValue(['CANDIDATE', 'BLOCKED', 'APPROVED_FOR_STAGING', 'APPROVED_FOR_PRODUCTION', 'DEPLOYED', 'ROLLED_BACK'].includes(manifest.release_status), 'release_status is invalid');

for (const component of requiredComponents) {
  const entry = manifest.components?.[component];
  requireValue(Boolean(entry), `components.${component} is required`);
  if (!entry) continue;
  requireValue(typeof entry.repository === 'string' && entry.repository.length > 0, `components.${component}.repository is required`);
  requireValue(shaPattern.test(entry.commit_sha ?? ''), `components.${component}.commit_sha must be a full SHA`);
  requireValue(typeof entry.ref === 'string' && entry.ref.length > 0, `components.${component}.ref is required`);
}

if (manifest.components?.ios && manifest.components?.site) {
  requireValue(manifest.components.ios.site_sha === manifest.components.site.commit_sha, 'iOS Site SHA must match the Site component SHA');
}
for (const component of requiredComponents) {
  requireValue(['PINNED', 'VERIFIED', 'BLOCKED'].includes(manifest.components?.[component]?.status), `components.${component}.status is invalid`);
}
for (const name of ['server', 'site', 'admin', 'partner']) {
  const digest = manifest.docker_image_digests?.[name];
  requireValue(digest === null || digestPattern.test(digest ?? ''), `docker_image_digests.${name} must be null or an immutable sha256 digest`);
}
requireValue(manifest.rollback_references && typeof manifest.rollback_references === 'object', 'rollback_references is required');
requireValue(manifest.test_results && typeof manifest.test_results === 'object', 'test_results is required');

if (process.argv.includes('--production')) {
  requireValue(manifest.release_status === 'APPROVED_FOR_PRODUCTION', 'release_status must be APPROVED_FOR_PRODUCTION');
  requireValue(manifest.production_ready === true, 'production_ready must be true');
  requireValue(Boolean(manifest.deployment_target?.environment === 'production' && manifest.deployment_target?.identifier), 'production deployment_target is required');
  requireValue(typeof manifest.build_timestamp_utc === 'string' && Number.isFinite(Date.parse(manifest.build_timestamp_utc)), 'build_timestamp_utc is required');
  requireValue(requiredComponents.every((name) => manifest.components?.[name]?.status === 'VERIFIED'), 'all five components must be VERIFIED');
  requireValue(['server', 'site', 'admin', 'partner'].every((name) => digestPattern.test(manifest.docker_image_digests?.[name] ?? '')), 'all four web/API image digests must be immutable SHA-256 values');
  for (const gate of ['component_ci', 'cross_repository_acceptance', 'staging_acceptance', 'backup_restore', 'rollback']) {
    const result = manifest.test_results?.[gate];
    requireValue(result?.status === 'PASS', `test_results.${gate} must be PASS`);
    requireValue(Boolean(result?.source_shas), `test_results.${gate}.source_shas is required`);
    for (const component of requiredComponents) {
      requireValue(result?.source_shas?.[component] === manifest.components?.[component]?.commit_sha, `test_results.${gate} must use the pinned ${component} SHA`);
    }
  }
  for (const key of ['release_id', 'server_image', 'site_image', 'admin_image', 'partner_image', 'database_backup']) {
    requireValue(typeof manifest.rollback_references?.[key] === 'string' && manifest.rollback_references[key].length > 0, `rollback_references.${key} is required`);
  }
}

if (errors.length) {
  process.stderr.write(`${errors.map((error) => `- ${error}`).join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Release manifest structure valid (${manifest.release_id}; ${manifest.release_status}).\n`);
}
