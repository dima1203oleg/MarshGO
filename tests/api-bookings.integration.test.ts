import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { Pool } from 'pg';

const apiUrl = process.env.API_TEST_URL;
const databaseUrl = process.env.API_TEST_DATABASE_URL;
const enabled = Boolean(apiUrl && databaseUrl);
const database = databaseUrl ? new URL(databaseUrl) : null;
if (enabled && database && !['127.0.0.1', 'localhost', '::1'].includes(database.hostname)) {
  throw new Error('API integration tests are restricted to a loopback database');
}

describe('API booking transaction (opt-in local integration test)', { skip: !enabled }, () => {
  const pool = new Pool({ connectionString: databaseUrl });
  const ids = {
    driver: crypto.randomUUID(),
    passengerA: crypto.randomUUID(),
    passengerB: crypto.randomUUID(),
    vehicle: crypto.randomUUID(),
    offer: crypto.randomUUID(),
  };
  const keys = [`api-test-${crypto.randomUUID()}`, `api-test-${crypto.randomUUID()}`];
  let apiCreatedVehicleId: string | null = null;

  before(async () => {
    await pool.query(`INSERT INTO users(id,display_name,roles) VALUES
      ($1,'API test driver',ARRAY['driver']),($2,'API test passenger A',ARRAY['passenger']),($3,'API test passenger B',ARRAY['passenger'])`,
    [ids.driver, ids.passengerA, ids.passengerB]);
    await pool.query(`INSERT INTO vehicles(id,owner_id,make,model,model_year,seat_count)
      VALUES ($1,$2,'Test','Vehicle',2024,4)`, [ids.vehicle, ids.driver]);
    await pool.query(`INSERT INTO offers(id,driver_id,vehicle_id,origin_name,destination_name,origin,destination,departure_at,price_per_seat_minor,total_seats,available_seats)
      VALUES ($1,$2,$3,'API Test Origin','API Test Destination',
        ST_SetSRID(ST_MakePoint(24.0,49.0),4326)::geography,
        ST_SetSRID(ST_MakePoint(25.0,50.0),4326)::geography,
        now()+interval '10 days',15000,1,1)`, [ids.offer, ids.driver, ids.vehicle]);
  });

  after(async () => {
    await pool.query("DELETE FROM audit_events WHERE actor_id = ANY($1::uuid[]) AND action IN ('vehicle.created','offer.created','demand.created','proposal.created','proposal.countered','proposal.accepted')", [[ids.driver, ids.passengerA]]);
    await pool.query('DELETE FROM audit_events WHERE entity_id IN (SELECT id FROM bookings WHERE offer_id IN (SELECT id FROM offers WHERE driver_id = $1)) OR entity_id = ANY($2::uuid[])',
      [ids.driver, [ids.vehicle, ...(apiCreatedVehicleId ? [apiCreatedVehicleId] : [])]]);
    await pool.query('DELETE FROM conversations WHERE booking_id IN (SELECT id FROM bookings WHERE offer_id IN (SELECT id FROM offers WHERE driver_id = $1))', [ids.driver]);
    await pool.query('DELETE FROM bookings WHERE offer_id IN (SELECT id FROM offers WHERE driver_id = $1)', [ids.driver]);
    await pool.query('DELETE FROM proposals WHERE driver_id=$1 OR demand_id IN (SELECT id FROM passenger_demands WHERE passenger_id=$2)', [ids.driver, ids.passengerA]);
    await pool.query('DELETE FROM passenger_demands WHERE passenger_id=$1', [ids.passengerA]);
    await pool.query('DELETE FROM offers WHERE driver_id = $1', [ids.driver]);
    await pool.query('DELETE FROM vehicles WHERE owner_id = $1', [ids.driver]);
    await pool.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [[ids.driver, ids.passengerA, ids.passengerB]]);
    await pool.end();
  });

  it('rejects anonymous booking and allows only one user to book the last seat', async () => {
    const anonymous = await fetch(`${apiUrl}/api/v1/bookings`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}',
    });
    assert.equal(anonymous.status, 401);

    const book = (userId: string, key: string) => fetch(`${apiUrl}/api/v1/bookings`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-dev-user-id': userId, 'idempotency-key': key },
      body: JSON.stringify({ offerId: ids.offer, seats: 1 }),
    });
    const [first, second] = await Promise.all([
      book(ids.passengerA, keys[0]),
      book(ids.passengerB, keys[1]),
    ]);
    assert.deepEqual([first.status, second.status].sort(), [201, 409]);
    const acceptedResponse = first.status === 201 ? first : second;
    const acceptedUser = first.status === 201 ? ids.passengerA : ids.passengerB;
    const acceptedKey = first.status === 201 ? keys[0] : keys[1];
    const accepted = await acceptedResponse.json() as { data: { id: string; total_price_minor: number } };
    assert.equal(accepted.data.total_price_minor, 15000);

    const replay = await book(acceptedUser, acceptedKey);
    assert.equal(replay.status, 200);
    assert.equal((await replay.json() as { replayed: boolean }).replayed, true);

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const cancelled = await fetch(`${apiUrl}/api/v1/bookings/${accepted.data.id}/cancel`, {
        method: 'POST', headers: { 'x-dev-user-id': acceptedUser },
      });
      assert.equal(cancelled.status, 200);
    }
    const { rows } = await pool.query('SELECT available_seats FROM offers WHERE id = $1', [ids.offer]);
    assert.equal(rows[0].available_seats, 1);
  });

  it('enforces driver role, vehicle ownership, and vehicle verification before publishing', async () => {
    const passengerVehicle = await fetch(`${apiUrl}/api/v1/vehicles`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-dev-user-id': ids.passengerA },
      body: JSON.stringify({ make: 'Toyota', model: 'Test', modelYear: 2024, seats: 4 }),
    });
    assert.equal(passengerVehicle.status, 403);

    const vehicleResponse = await fetch(`${apiUrl}/api/v1/vehicles`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-dev-user-id': ids.driver },
      body: JSON.stringify({ make: 'Kia', model: 'Ceed', modelYear: 2022, seats: 3 }),
    });
    assert.equal(vehicleResponse.status, 201);
    const vehicle = await vehicleResponse.json() as { data: { id: string; verification_status: string } };
    apiCreatedVehicleId = vehicle.data.id;
    assert.equal(vehicle.data.verification_status, 'pending');

    const offerPayload = {
      vehicleId: apiCreatedVehicleId,
      originName: 'API Publish Origin', destinationName: 'API Publish Destination',
      origin: [24.0, 49.0], destination: [25.0, 50.0],
      departureAt: new Date(Date.now() + 10 * 86400_000).toISOString(),
      pricePerSeatMinor: 15000, seats: 2,
    };
    const pendingOffer = await fetch(`${apiUrl}/api/v1/offers`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-dev-user-id': ids.driver },
      body: JSON.stringify(offerPayload),
    });
    assert.equal(pendingOffer.status, 404);

    await pool.query("UPDATE vehicles SET verification_status = 'verified' WHERE id = $1", [apiCreatedVehicleId]);
    const published = await fetch(`${apiUrl}/api/v1/offers`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-dev-user-id': ids.driver },
      body: JSON.stringify(offerPayload),
    });
    assert.equal(published.status, 201);
    const response = await published.json() as { data: { id: string; available_seats: number } };
    assert.equal(response.data.available_seats, 2);
  });

  it('keeps negotiation history and atomically converts an accepted proposal into a booking', async () => {
    assert.ok(apiCreatedVehicleId);
    const headers = (userId: string) => ({ 'content-type': 'application/json', 'x-dev-user-id': userId });
    const now = Date.now();
    const earliest = new Date(now + 9 * 86400_000);
    const latest = new Date(now + 10 * 86400_000);
    const demandResponse = await fetch(`${apiUrl}/api/v1/demands`, {
      method: 'POST', headers: headers(ids.passengerA),
      body: JSON.stringify({
        originName: 'Reverse Origin', destinationName: 'Reverse Destination',
        origin: [23.86, 49.25], destination: [24.03, 49.84],
        earliestDeparture: earliest.toISOString(), latestDeparture: latest.toISOString(), passengers: 2, budgetMinor: 16000,
      }),
    });
    assert.equal(demandResponse.status, 201);
    const demand = await demandResponse.json() as { data: { id: string; status: string } };

    const proposalResponse = await fetch(`${apiUrl}/api/v1/demands/${demand.data.id}/proposals`, {
      method: 'POST', headers: headers(ids.driver),
      body: JSON.stringify({ vehicleId: apiCreatedVehicleId, priceMinor: 17000, departureAt: earliest.toISOString(), comment: 'Can take two passengers' }),
    });
    assert.equal(proposalResponse.status, 201);
    const proposal = await proposalResponse.json() as { data: { id: string } };

    const sameActorCounter = await fetch(`${apiUrl}/api/v1/proposals/${proposal.data.id}/counter`, {
      method: 'POST', headers: headers(ids.driver),
      body: JSON.stringify({ priceMinor: 16000, departureAt: earliest.toISOString() }),
    });
    assert.equal(sameActorCounter.status, 409);

    const counter = await fetch(`${apiUrl}/api/v1/proposals/${proposal.data.id}/counter`, {
      method: 'POST', headers: headers(ids.passengerA),
      body: JSON.stringify({ priceMinor: 15000, departureAt: earliest.toISOString(), comment: 'Agreed at this price' }),
    });
    assert.equal(counter.status, 200);
    const revisions = await fetch(`${apiUrl}/api/v1/proposals/${proposal.data.id}/revisions`, {
      headers: headers(ids.driver),
    });
    assert.equal((await revisions.json() as { data: unknown[] }).data.length, 2);

    const accepted = await fetch(`${apiUrl}/api/v1/proposals/${proposal.data.id}/accept`, {
      method: 'POST', headers: headers(ids.passengerA),
    });
    assert.equal(accepted.status, 201);
    const booking = await accepted.json() as { data: { id: string; total_price_minor: number; seat_count: number }; agreedTotalMinor: number };
    assert.equal(booking.data.total_price_minor, 15000);
    assert.equal(booking.data.seat_count, 2);
    assert.equal(booking.agreedTotalMinor, 15000);

    const duplicateAccept = await fetch(`${apiUrl}/api/v1/proposals/${proposal.data.id}/accept`, {
      method: 'POST', headers: headers(ids.passengerA),
    });
    assert.equal(duplicateAccept.status, 409);

    const conversationResponse = await fetch(`${apiUrl}/api/v1/bookings/${booking.data.id}/conversation`, {
      headers: headers(ids.driver),
    });
    assert.equal(conversationResponse.status, 200);
    const conversation = await conversationResponse.json() as { data: { id: string } };
    const message = await fetch(`${apiUrl}/api/v1/conversations/${conversation.data.id}/messages`, {
      method: 'POST', headers: headers(ids.passengerA), body: JSON.stringify({ body: 'Підтверджую час виїзду.' }),
    });
    assert.equal(message.status, 201);
    const history = await fetch(`${apiUrl}/api/v1/conversations/${conversation.data.id}/messages`, {
      headers: headers(ids.driver),
    });
    assert.equal((await history.json() as { data: Array<{ body: string }> }).data[0].body, 'Підтверджую час виїзду.');
    const outside = await fetch(`${apiUrl}/api/v1/conversations/${conversation.data.id}/messages`, {
      method: 'POST', headers: headers(ids.passengerB), body: JSON.stringify({ body: 'I should not see this.' }),
    });
    assert.equal(outside.status, 404);
  });
});
