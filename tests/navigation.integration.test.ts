import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { Pool } from 'pg';

const apiUrl = process.env.API_TEST_URL;
const databaseUrl = process.env.API_TEST_DATABASE_URL;
const enabled = process.env.API_TEST_NAVIGATION === 'true' && Boolean(apiUrl && databaseUrl);
const database = databaseUrl ? new URL(databaseUrl) : null;
if (enabled && database && !['127.0.0.1', 'localhost', '::1'].includes(database.hostname)) {
  throw new Error('Navigation integration tests are restricted to a loopback database');
}

describe('foreground navigation session API (opt-in local integration test)', { skip: !enabled }, () => {
  const pool = new Pool({ connectionString: databaseUrl });
  const driver = crypto.randomUUID();
  const passenger = crypto.randomUUID();
  const headers = (userId: string) => ({ 'content-type': 'application/json', 'x-dev-user-id': userId });
  let sessionId = '';

  before(async () => {
    await pool.query(`INSERT INTO users(id,display_name,roles) VALUES($1,'Navigation test driver',ARRAY['driver']),($2,'Navigation test passenger',ARRAY['passenger'])`, [driver, passenger]);
    await pool.query(`INSERT INTO user_roles(user_id,role) VALUES($1,'driver'),($2,'passenger')`, [driver, passenger]);
  });

  after(async () => {
    if (sessionId) {
      await pool.query('DELETE FROM audit_events WHERE entity_id=$1', [sessionId]);
      await pool.query('DELETE FROM navigation_sessions WHERE id=$1', [sessionId]);
    }
    await pool.query('DELETE FROM users WHERE id=ANY($1::uuid[])', [[driver, passenger]]);
    await pool.end();
  });

  it('persists an owner-only real-route session, validates GPS, and deletes precise location on end', async () => {
    const created = await fetch(`${apiUrl}/api/v1/navigation/sessions`, {
      method: 'POST', headers: headers(driver),
      body: JSON.stringify({ origin: [24, 49], destination: [25, 50], destinationName: 'Integration destination' }),
    });
    assert.equal(created.status, 201);
    const createdBody = await created.json() as { data: { id: string; state: string; route: [number, number][]; route_distance_m: number } };
    sessionId = createdBody.data.id;
    assert.equal(createdBody.data.state, 'active');
    assert.deepEqual(createdBody.data.route, [[24, 49], [24.5, 49.5], [25, 50]]);
    assert.equal(createdBody.data.route_distance_m, 12_345);
    const active = await fetch(`${apiUrl}/api/v1/navigation/sessions/active`, { headers: headers(driver) });
    const activeBody = await active.json() as { data: { id: string; route: [number, number][] } };
    assert.equal(active.status, 200);
    assert.equal(activeBody.data.id, sessionId);
    assert.deepEqual(activeBody.data.route, createdBody.data.route);
    const ownSession = await fetch(`${apiUrl}/api/v1/navigation/sessions/${sessionId}`, { headers: headers(driver) });
    assert.equal(ownSession.status, 200);
    const duplicate = await fetch(`${apiUrl}/api/v1/navigation/sessions`, {
      method: 'POST', headers: headers(driver),
      body: JSON.stringify({ origin: [24, 49], destination: [25, 50], destinationName: 'Duplicate session' }),
    });
    assert.equal(duplicate.status, 409);

    const hidden = await fetch(`${apiUrl}/api/v1/navigation/sessions/${sessionId}`, { headers: headers(passenger) });
    assert.equal(hidden.status, 403);
    const forbiddenStart = await fetch(`${apiUrl}/api/v1/navigation/sessions`, {
      method: 'POST', headers: headers(passenger),
      body: JSON.stringify({ origin: [24, 49], destination: [25, 50], destinationName: 'No driver role' }),
    });
    assert.equal(forbiddenStart.status, 403);

    const fix = await fetch(`${apiUrl}/api/v1/navigation/sessions/${sessionId}/location`, {
      method: 'POST', headers: headers(driver),
      body: JSON.stringify({ coordinates: [24, 49], accuracyMeters: 8, capturedAt: new Date().toISOString() }),
    });
    assert.equal(fix.status, 200);
    assert.equal((await fix.json() as { data: { onRoute: boolean } }).data.onRoute, true);

    const stale = await fetch(`${apiUrl}/api/v1/navigation/sessions/${sessionId}/location`, {
      method: 'POST', headers: headers(driver),
      body: JSON.stringify({ coordinates: [24, 49], accuracyMeters: 8, capturedAt: new Date(Date.now() - 5 * 60_000).toISOString() }),
    });
    assert.equal(stale.status, 400);
    const teleport = await fetch(`${apiUrl}/api/v1/navigation/sessions/${sessionId}/location`, {
      method: 'POST', headers: headers(driver),
      body: JSON.stringify({ coordinates: [24.2, 49.2], accuracyMeters: 8, capturedAt: new Date(Date.now() + 2_000).toISOString() }),
    });
    assert.equal(teleport.status, 422);

    const ended = await fetch(`${apiUrl}/api/v1/navigation/sessions/${sessionId}/end`, { method: 'POST', headers: headers(driver) });
    assert.equal(ended.status, 200);
    const replay = await fetch(`${apiUrl}/api/v1/navigation/sessions/${sessionId}/end`, { method: 'POST', headers: headers(driver) });
    assert.equal(replay.status, 200);
    assert.equal((await replay.json() as { data: { replayed: boolean } }).data.replayed, true);
    const persisted = await pool.query('SELECT state,route,current_location,destination,destination_name FROM navigation_sessions WHERE id=$1', [sessionId]);
    assert.equal(persisted.rows[0].state, 'ended');
    assert.equal(persisted.rows[0].route, null);
    assert.equal(persisted.rows[0].current_location, null);
    assert.equal(persisted.rows[0].destination, null);
    assert.equal(persisted.rows[0].destination_name, null);
  });
});
