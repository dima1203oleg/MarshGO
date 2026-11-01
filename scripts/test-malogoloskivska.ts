import dotenv from 'dotenv';
dotenv.config();
import { Pool } from 'pg';
import crypto from 'node:crypto';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const userRes = await pool.query('SELECT id FROM users LIMIT 1');
  const userId = userRes.rows[0].id;
  const accessToken = crypto.randomBytes(32).toString('base64url');
  const tokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');
  await pool.query(
    `INSERT INTO sessions(user_id, token_hash, expires_at, refresh_token_hash, refresh_expires_at, family_id)
     VALUES ($1, $2, now() + interval '1 day', $3, now() + interval '7 days', $4)`,
    [userId, tokenHash, tokenHash, crypto.randomUUID()]
  );

  async function check(q: string) {
    const res = await fetch('http://127.0.0.1:3002/api/v1/places/suggest?q=' + encodeURIComponent(q), {
      headers: { 'Authorization': 'Bearer ' + accessToken }
    });
    const data = await res.json();
    console.log('Query:', q, '->', data.data?.map((p: any) => ({ label: p.label, lat: p.latitude, lon: p.longitude })));
    return data.data?.[0];
  }

  const p1 = await check('Малоголосківська');
  const p2 = await check('Сихів');

  // Now perform search for p1 to p2!
  const provUrl = `http://127.0.0.1:3002/api/v1/mobility/providers?latitude=${p1.latitude}&longitude=${p1.longitude}`;
  const provRes = await fetch(provUrl, { headers: { Authorization: 'Bearer ' + accessToken } });
  const provData = await provRes.json();
  const { defaultSelection, toJourneyPreferences } = await import('../src/domain/transportPreferences');
  const prefs = toJourneyPreferences(defaultSelection, provData.data);

  console.log('\n--- TESTING BALANCED STRATEGY ---');
  let res = await fetch('http://127.0.0.1:3002/api/v1/journeys/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + accessToken },
    body: JSON.stringify({
      origin: { name: p1.label, coordinates: [p1.longitude, p1.latitude] },
      destination: { name: p2.label, coordinates: [p2.longitude, p2.latitude] },
      departureAt: new Date(Date.now() + 3600_000).toISOString(),
      passengers: 1,
      strategy: 'BALANCED',
      preferences: prefs
    })
  });
  let d = await res.json();
  console.log('BALANCED Journeys:', d.data?.journeys?.map((j: any) => ({
    id: j.id,
    strategy: j.strategy,
    duration: Math.round(j.totalDurationSeconds / 60) + 'm',
    price: j.totalPriceMinor ? j.totalPriceMinor / 100 + ' грн' : 'null',
    legs: j.legs?.map((l: any) => ({ mode: l.mode, title: l.title || l.routeName || l.providerName }))
  })));

  console.log('\n--- TESTING CHEAPEST STRATEGY ---');
  res = await fetch('http://127.0.0.1:3002/api/v1/journeys/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + accessToken },
    body: JSON.stringify({
      origin: { name: p1.label, coordinates: [p1.longitude, p1.latitude] },
      destination: { name: p2.label, coordinates: [p2.longitude, p2.latitude] },
      departureAt: new Date(Date.now() + 3600_000).toISOString(),
      passengers: 1,
      strategy: 'CHEAPEST',
      preferences: prefs
    })
  });
  d = await res.json();
  console.log('CHEAPEST Journeys:', d.data?.journeys?.map((j: any) => ({
    id: j.id,
    strategy: j.strategy,
    duration: Math.round(j.totalDurationSeconds / 60) + 'm',
    price: j.totalPriceMinor ? j.totalPriceMinor / 100 + ' грн' : 'null',
    legs: j.legs?.map((l: any) => ({ mode: l.mode, title: l.title || l.routeName || l.providerName }))
  })));

  console.log('\n--- TESTING FASTEST STRATEGY ---');
  res = await fetch('http://127.0.0.1:3002/api/v1/journeys/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + accessToken },
    body: JSON.stringify({
      origin: { name: p1.label, coordinates: [p1.longitude, p1.latitude] },
      destination: { name: p2.label, coordinates: [p2.longitude, p2.latitude] },
      departureAt: new Date(Date.now() + 3600_000).toISOString(),
      passengers: 1,
      strategy: 'FASTEST',
      preferences: prefs
    })
  });
  d = await res.json();
  console.log('FASTEST Journeys:', d.data?.journeys?.map((j: any) => ({
    id: j.id,
    strategy: j.strategy,
    duration: Math.round(j.totalDurationSeconds / 60) + 'm',
    price: j.totalPriceMinor ? j.totalPriceMinor / 100 + ' грн' : 'null',
    legs: j.legs?.map((l: any) => ({ mode: l.mode, title: l.title || l.routeName || l.providerName }))
  })));

  await pool.end();
}

run().catch(console.error);
