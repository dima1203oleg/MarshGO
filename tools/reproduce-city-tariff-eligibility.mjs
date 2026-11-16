import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';

const serverSha = '378eccbdd320ff5ddf2491dd9bc613b55237f998';
const sourcePath = 'server/mobility/transportTariffs.ts';
const startedAt = new Date().toISOString();
const sourceResponse = JSON.parse(execFileSync('gh', ['api', `repos/dima1203oleg/MarshGO-Server/contents/${sourcePath}?ref=${serverSha}`], { encoding: 'utf8', maxBuffer: 1_000_000 }));
const source = Buffer.from(sourceResponse.content, 'base64').toString('utf8');
const load = async (text) => import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(text, { mode: 'strip' })).toString('base64')}`);
const baseline = await load(source);
const leg = (date, offset = 0, city = 'Київ', type = 'bus') => ({
  providerCity: city,
  mode: type.toUpperCase(),
  transportType: type,
  departureAt: new Date(Date.parse(`${date}T08:00:00Z`) + offset * 60_000),
  arrivalAt: new Date(Date.parse(`${date}T08:20:00Z`) + offset * 60_000),
});
const cases = [
  { name: 'before-single-effective-date', legs: [leg('2026-07-14')], baseline: [3000, 3000], guarded: [null, null] },
  { name: 'before-transfer-effective-date', legs: [0, 25, 50].map((offset) => leg('2026-07-31', offset)), baseline: [6000, 9000], guarded: [9000, 9000] },
  { name: 'current-single-positive', legs: [leg('2026-11-18')], baseline: [3000, 3000], guarded: [3000, 3000] },
  { name: 'current-transfer-positive', legs: [0, 25, 50].map((offset) => leg('2026-11-18', offset)), baseline: [6000, 9000], guarded: [6000, 9000] },
  { name: 'unknown-city-negative', legs: [leg('2026-11-18', 0, 'Невідома')], baseline: [null, null], guarded: [null, null] },
  { name: 'marshrutka-negative', legs: [leg('2026-11-18', 0, 'Київ', 'marshrutka')], baseline: [null, null], guarded: [null, null] },
];
const applyOnce = (text, before, after) => {
  assert.equal(text.split(before).length - 1, 1, `Patch anchor must match exactly once: ${before}`);
  return text.replace(before, after);
};
let guardedSource = source;
for (const name of ['calculateCityTariffFare', 'calculateCashFare']) {
  const signature = name === 'calculateCityTariffFare'
    ? 'export function calculateCityTariffFare(legs: readonly FareLegInput[]): GtfsItineraryFare | null {'
    : 'export function calculateCashFare(legs: readonly FareLegInput[]): CashFareQuote | null {';
  guardedSource = applyOnce(guardedSource, signature, `${signature}\n  if (legs.some((leg) => cityKey(leg.providerCity) === 'kyiv' && leg.departureAt.getTime() < Date.parse('2026-07-15T00:00:00+03:00'))) return null;`);
}
guardedSource = applyOnce(guardedSource,
  'const candidate = 6_000 + best[end]!;',
  "if (legs[start]!.departureAt.getTime() < Date.parse('2026-08-01T00:00:00+03:00')) continue;\n        const candidate = 6_000 + best[end]!;");
const guarded = await load(guardedSource);
const run = (implementation, expectedKey) => cases.map((sample) => {
  const fare = implementation.calculateCityTariffFare(sample.legs);
  const cash = implementation.calculateCashFare(sample.legs);
  const amounts = [fare?.priceMinor ?? null, cash?.priceMinor ?? null];
  assert.deepEqual(amounts, sample[expectedKey], sample.name);
  return {
    name: sample.name,
    legs: sample.legs,
    fare,
    cash,
    observedAmounts: amounts,
  };
});
const baselineResults = run(baseline, 'baseline');
const guardedResults = run(guarded, 'guarded');
assert.notDeepEqual(baselineResults[0].observedAmounts, guardedResults[0].observedAmounts);
assert.notDeepEqual(baselineResults[1].observedAmounts, guardedResults[1].observedAmounts);
for (let index = 2; index < cases.length; index++) {
  assert.deepEqual(baselineResults[index].observedAmounts, guardedResults[index].observedAmounts);
}
console.log(JSON.stringify({
  startedAt,
  completedAt: new Date().toISOString(),
  serverSha,
  sourcePath,
  githubBlobSha: sourceResponse.sha,
  sourceSha256: createHash('sha256').update(source).digest('hex'),
  scope: 'ISOLATED_PINNED_MODULE_NOT_LIVE_API_OR_ENGINE',
  verdict: 'REPRODUCED_INTERNAL_EFFECTIVE_DATE_ELIGIBILITY_GAP',
  releaseStatus: 'NOT_RELEASED',
  httpReachability: {
    evidenceKind: 'PINNED_SOURCE_REVIEW_NOT_EXECUTED_HTTP',
    parser: 'server/journey/search.ts:127-138',
    handler: 'server/index.ts:3149-3155',
    historicalDepartureRejected: true,
    classification: 'INTERNAL_CONTRACT_NOT_CURRENT_LIVE_API_WRONG_FARE',
  },
  productionCaller: {
    location: 'server/journey/gtfsTimetable.ts:4163-4195',
    tariffInputFields: ['providerCity', 'mode', 'transportType', 'departureAt', 'arrivalAt'],
    gtfsFareInputIncludesProviderAndAgency: true,
    cityTariffFallbackReceivesProviderAndAgency: false,
    privateOperatorRuntimeCase: 'NOT_TESTED',
  },
  catalogEffectiveDates: Object.fromEntries(baseline.transportFareCatalog.filter((record) => ['kyiv-communal-single-ride', 'kyiv-90-minute-transfer-ticket'].includes(record.id)).map((record) => [record.id, record.effectiveFrom])),
  scenarioExecutions: cases.length * 2,
  baseline: baselineResults,
  inMemoryDateGuardControl: guardedResults,
  limitations: ['SYNTHETIC_DATES_AND_LEGS', 'NO_LIVE_HISTORICAL_OR_PRIVATE_OPERATOR_CASE', 'NO_PRIMARY_LEGAL_ACT_ATTESTATION', 'IN_MEMORY_GUARD_IS_NOT_A_SERVER_FIX_OR_PROPOSED_COMPLETE_DESIGN', 'NO_LEGACY_FARE_ASSUMED', 'NO_SERVER_SITE_RUNTIME_DB_MUTATION'],
}, null, 2));
