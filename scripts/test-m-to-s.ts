import dotenv from 'dotenv';
dotenv.config();
import { Pool } from 'pg';
import crypto from 'node:crypto';
import { defaultSelection, toJourneyPreferences } from '../src/domain/transportPreferences';

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

  // Малоголосківська: [24.0029933, 49.8681678]
  // Сихів, Львів: [24.057585, 49.794117]
  const origin = { name: 'вул. Малоголосківська, Львів', coordinates: [24.0029933, 49.8681678] as [number, number] };
  const destination = { name: 'Сихів, Львів', coordinates: [24.057585, 49.794117] as [number, number] };

  const provUrl = `http://127.0.0.1:3002/api/v1/mobility/providers?latitude=${origin.coordinates[1]}&longitude=${origin.coordinates[0]}`;
  const provRes = await fetch(provUrl, { headers: { Authorization: 'Bearer ' + accessToken } });
  const provData = await provRes.json();
  const prefs = toJourneyPreferences(defaultSelection, provData.data);

  console.log('Prefs allowedTransitProviders count:', Array.isArray(prefs.allowedTransitProviders) ? prefs.allowedTransitProviders.length : undefined);
  console.log('Prefs allowedTransportTypes:', prefs.allowedTransportTypes);

  for (const strat of ['CHEAPEST', 'BALANCED', 'FASTEST'] as const) {
    const res = await fetch('http://127.0.0.1:3002/api/v1/journeys/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + accessToken },
      body: JSON.stringify({
        origin,
        destination,
        departureAt: new Date(Date.now() + 3600_000).toISOString(),
        passengers: 1,
        strategy: strat,
        preferences: prefs
      })
    });
    const d = await res.json();
    console.log(`\n=== Strategy: ${strat} ===`);
    console.log('Status:', res.status, 'Journeys found:', d.data?.journeys?.length ?? 0);
    for (const j of d.data?.journeys ?? []) {
      console.log(`  - Strategy: ${j.strategy}, Dur: ${Math.round(j.totalDurationSeconds/60)}m, Price: ${j.totalPriceMinor ? j.totalPriceMinor/100 + ' грн' : 'null'}, Source: ${j.source || j.providerName}, Legs: ${j.legs?.map((l: any) => `${l.mode}(${l.title || l.routeName || l.providerName})`).join(' -> ')}`);
    }
  }

  await pool.end();
}

run().catch(console.error);
