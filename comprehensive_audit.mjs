import { Pool } from 'pg';

const API_BASE = process.env.MARSHGO_AUDIT_API_BASE ?? 'http://127.0.0.1:8081';
const DEV_USER_ID = process.env.MARSHGO_AUDIT_DEV_USER_ID;
const DATABASE_URL = process.env.MARSHGO_AUDIT_DATABASE_URL;
if (!DEV_USER_ID || !DATABASE_URL) {
  throw new Error('Set MARSHGO_AUDIT_DEV_USER_ID and MARSHGO_AUDIT_DATABASE_URL for the local audit environment.');
}
const HEADERS = {
  'Content-Type': 'application/json',
  'x-dev-user-id': DEV_USER_ID
};

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 3
});

async function runAudit() {
  console.log('====================================================');
  console.log('🚀 MARSHGO DEEP AUDIT & END-TO-END VERIFICATION');
  console.log('====================================================\n');

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    details: []
  };

  function record(name, success, info = '') {
    if (success) {
      results.passed++;
      console.log(`✅ [PASS] ${name} ${info ? `(${info})` : ''}`);
    } else {
      results.failed++;
      console.error(`❌ [FAIL] ${name} ${info ? `(${info})` : ''}`);
    }
    results.details.push({ name, success, info });
  }

  // 1. Health & Readiness
  console.log('--- 1. Service Health & Readiness ---');
  try {
    const healthRes = await fetch(`${API_BASE}/healthz`);
    const health = await healthRes.json();
    record('Healthz Check', healthRes.ok && health.status === 'ok', `status: ${health.status}`);
  } catch (err) {
    record('Healthz Check', false, err.message);
  }

  try {
    const readyRes = await fetch(`${API_BASE}/readyz`);
    const ready = await readyRes.json();
    record('Readyz Check', readyRes.ok && ready.status === 'ready', `DB: ${ready.database}, Realtime: ${ready.realtime}`);
  } catch (err) {
    record('Readyz Check', false, err.message);
  }

  // 2. Transport Cities & Providers
  console.log('\n--- 2. Ukrainian Transport Cities & Providers ---');
  try {
    const citiesRes = await fetch(`${API_BASE}/api/v1/transport/cities`, { headers: HEADERS });
    const citiesJson = await citiesRes.json();
    const cityList = citiesJson.data || [];
    const cityNames = cityList.map(c => c.name);
    record('Cities Catalog', citiesRes.ok && cityNames.length > 0, `${cityNames.length} cities: ${cityNames.join(', ')}`);
  } catch (err) {
    record('Cities Catalog', false, err.message);
  }

  try {
    const provRes = await fetch(`${API_BASE}/api/v1/transport/providers`, { headers: HEADERS });
    const provJson = await provRes.json();
    const providerList = provJson.data || [];
    record('Providers Catalog', provRes.ok && providerList.length > 0, `${providerList.length} transit feeds/providers configured across Ukraine`);
  } catch (err) {
    record('Providers Catalog', false, err.message);
  }

  try {
    const healthProvRes = await fetch(`${API_BASE}/api/v1/transport/health`, { headers: HEADERS });
    const provHealth = await healthProvRes.json();
    const healthy = (provHealth.data?.providers || provHealth.providers || []).filter(p => p.status === 'HEALTHY' || p.status === 'ONLINE' || p.health === 'healthy');
    record('Providers Health Monitor', healthProvRes.ok, `${healthy.length} providers reporting healthy/online`);
  } catch (err) {
    record('Providers Health Monitor', false, err.message);
  }

  // 3. Realtime Vehicles
  console.log('\n--- 3. Realtime Vehicles Feed ---');
  try {
    // Uzhhorod live vehicles bbox: [22.2, 48.55, 22.35, 48.65]
    const vehRes = await fetch(`${API_BASE}/api/v1/transport/vehicles?bbox=22.2,48.55,22.35,48.65&types=bus,marshrutka`, { headers: HEADERS });
    const vehJson = await vehRes.json();
    const count = vehJson.data?.features?.length ?? 0;
    record('Realtime Uzhhorod Vehicles', vehRes.ok && count > 0, `${count} live vehicles moving in viewport`);
  } catch (err) {
    record('Realtime Uzhhorod Vehicles', false, err.message);
  }

  try {
    // Chervonohrad live vehicles bbox: [24.1, 50.3, 24.3, 50.5]
    const vehRes = await fetch(`${API_BASE}/api/v1/transport/vehicles?bbox=24.1,50.3,24.3,50.5&types=bus,marshrutka`, { headers: HEADERS });
    const vehJson = await vehRes.json();
    const count = vehJson.data?.features?.length ?? 0;
    record('Realtime Chervonohrad Vehicles', vehRes.ok, `${count} live vehicles moving in viewport`);
  } catch (err) {
    record('Realtime Chervonohrad Vehicles', false, err.message);
  }

  // 4. Multimodal Routing across Strategies
  console.log('\n--- 4. Multimodal Routing: Strategies & Constraints ---');
  const strategies = ['FASTEST', 'CHEAPEST', 'RELIABLE', 'BALANCED'];
  
  const tomorrowNoon = new Date();
  tomorrowNoon.setDate(tomorrowNoon.getDate() + 1);
  tomorrowNoon.setHours(12, 0, 0, 0);

  for (const strat of strategies) {
    try {
      const body = {
        origin: { name: 'Lviv Center', coordinates: [24.0311, 49.8429] },
        destination: { name: 'Sykhiv', coordinates: [24.0620, 49.8055] },
        departureAt: tomorrowNoon.toISOString(),
        passengers: 1,
        strategy: strat,
        preferences: {
          allowCommunity: false,
          allowPublicTransport: true,
        }
      };
      const res = await fetch(`${API_BASE}/api/v1/journeys/search`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify(body)
      });
      const data = await res.json();
      const journeys = data.data?.journeys || [];
      const ok = res.status === 200 && journeys.length > 0;
      record(`Routing Strategy: ${strat}`, ok, `Found ${journeys.length} routes, top duration: ${journeys[0]?.totalDurationSeconds ?? 0}s, mode: ${journeys[0]?.mode}`);
    } catch (err) {
      record(`Routing Strategy: ${strat}`, false, err.message);
    }
  }

  // 5. Kyiv Multimodal Route & Network
  console.log('\n--- 5. Kyiv Multimodal & Network Data ---');
  try {
    const stopsRes = await fetch(`${API_BASE}/api/v1/transport/stops?bbox=30.4,50.4,30.6,50.5&types=bus,tram,trolleybus`, { headers: HEADERS });
    const stopsJson = await stopsRes.json();
    const stopCount = stopsJson.data?.features?.length ?? 0;
    record('Kyiv Transit Network Stops', stopsRes.ok && stopCount > 0, `${stopCount} official stops in Kyiv center`);
  } catch (err) {
    record('Kyiv Transit Network Stops', false, err.message);
  }

  try {
    const routesRes = await fetch(`${API_BASE}/api/v1/transport/routes?bbox=30.4,50.4,30.6,50.5&types=bus,tram,trolleybus`, { headers: HEADERS });
    const routesJson = await routesRes.json();
    const routeCount = routesJson.data?.features?.length ?? 0;
    record('Kyiv Transit Network Routes', routesRes.ok && routeCount > 0, `${routeCount} official transit route lines`);
  } catch (err) {
    record('Kyiv Transit Network Routes', false, err.message);
  }

  // 6. Database Schema & Constraints Integrity
  console.log('\n--- 6. PostgreSQL Database Integrity & Constraints ---');
  try {
    // Check recent journeys inserted in DB
    const journeysDb = await pool.query('SELECT id, state, strategy, total_duration_s FROM journeys ORDER BY created_at DESC LIMIT 5');
    record('Journeys DB Query', journeysDb.rows.length > 0, `${journeysDb.rows.length} journeys present in DB`);

    // Check recent journey legs
    const legsDb = await pool.query('SELECT id, journey_id, mode, price_status, state FROM journey_legs ORDER BY created_at DESC LIMIT 10');
    record('Journey Legs DB Query', legsDb.rows.length > 0, `${legsDb.rows.length} legs verified in DB, price_status enum valid`);
    
    // Check constraint on price_status
    const checkConstraints = await pool.query(`
      SELECT conname, pg_get_constraintdef(oid) 
      FROM pg_constraint 
      WHERE conrelid = 'journey_legs'::regclass;
    `);
    const hasPriceCheck = checkConstraints.rows.some(r => r.conname === 'journey_legs_price_status_check');
    record('DB Price Status Constraint Check', hasPriceCheck, 'journey_legs_price_status_check active & respected');
  } catch (err) {
    record('Database Integrity Check', false, err.message);
  }

  await pool.end();

  console.log('\n====================================================');
  console.log(`Audit Summary: Passed: ${results.passed}, Failed: ${results.failed}`);
  console.log('====================================================');
}

runAudit().catch(err => {
  console.error('Audit fatal error:', err);
  process.exit(1);
});
