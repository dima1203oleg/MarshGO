const SHA_RE = /^[a-f0-9]{40}$/;
const BUILD_ID_RE = /^[A-Za-z0-9._:-]{1,128}$/;

export function createReleaseBuildMetadata(serverSha, {
  runId,
  runAttempt,
  builtAt = new Date(),
} = {}) {
  if (!SHA_RE.test(serverSha ?? '')) throw new Error('A full pinned Server commit SHA is required');
  if (!(builtAt instanceof Date) || !Number.isFinite(builtAt.getTime())) throw new Error('A valid build timestamp is required');

  const normalizedRunId = /^\d+$/.test(runId ?? '') ? runId : null;
  const normalizedAttempt = /^\d+$/.test(runAttempt ?? '') ? runAttempt : '1';
  const timestamp = builtAt.toISOString();
  const buildId = normalizedRunId
    ? `github-${normalizedRunId}-${normalizedAttempt}`
    : `local-${serverSha.slice(0, 12)}-${timestamp.replace(/[^A-Za-z0-9]/g, '')}`;
  if (!BUILD_ID_RE.test(buildId)) throw new Error('Generated build ID is invalid');

  return {
    buildId,
    commitSha: serverSha,
    builtAt: timestamp,
    sourceState: 'clean',
  };
}

export function bindReleaseBuildMetadata(compose, metadata) {
  const values = {
    MARSHGO_BUILD_ID: metadata?.buildId,
    MARSHGO_BUILD_SHA: metadata?.commitSha,
    MARSHGO_BUILD_TIME: metadata?.builtAt,
    MARSHGO_SOURCE_STATE: metadata?.sourceState,
  };
  let rendered = compose;
  for (const [key, value] of Object.entries(values)) {
    if (typeof value !== 'string' || !value || value.length > 128) throw new Error(`Invalid release build metadata: ${key}`);
    const template = `${key}: \${${key}:-unknown}`;
    const count = rendered.split(template).length - 1;
    if (count !== 1) throw new Error(`Expected exactly one build metadata placeholder: ${key}`);
    rendered = rendered.replace(template, `${key}: ${JSON.stringify(value)}`);
  }
  if (/\$\{MARSHGO_BUILD_(?:ID|SHA|TIME)|\$\{MARSHGO_SOURCE_STATE/.test(rendered)) {
    throw new Error('Unbound release build metadata placeholder remains in generated Compose file');
  }
  return rendered;
}
