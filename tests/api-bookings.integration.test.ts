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
  const extraVehicleIds: string[] = [];
  let otpUserId: string | null = null;

  before(async () => {
    await pool.query(`INSERT INTO users(id,display_name,roles) VALUES
      ($1,'API test driver',ARRAY['driver']),($2,'API test passenger A',ARRAY['passenger']),($3,'API test passenger B',ARRAY['passenger'])`,
    [ids.driver, ids.passengerA, ids.passengerB]);
    await pool.query(`INSERT INTO user_roles(user_id,role) VALUES
      ($1,'driver'),($2,'passenger'),($3,'passenger')`, [ids.driver, ids.passengerA, ids.passengerB]);
    await pool.query(`INSERT INTO vehicles(id,owner_id,make,model,model_year,seat_count)
      VALUES ($1,$2,'Test','Vehicle',2024,4)`, [ids.vehicle, ids.driver]);
    await pool.query(`INSERT INTO offers(id,driver_id,vehicle_id,origin_name,destination_name,origin,destination,departure_at,price_per_seat_minor,total_seats,available_seats)
      VALUES ($1,$2,$3,'API Test Origin','API Test Destination',
        ST_SetSRID(ST_MakePoint(24.0,49.0),4326)::geography,
        ST_SetSRID(ST_MakePoint(25.0,50.0),4326)::geography,
        now()+interval '10 days',15000,1,1)`, [ids.offer, ids.driver, ids.vehicle]);
  });

  after(async () => {
    if (otpUserId) await pool.query('DELETE FROM audit_events WHERE actor_id=$1', [otpUserId]);
    await pool.query('DELETE FROM vehicles WHERE owner_id IN (SELECT id FROM users WHERE phone_e164 LIKE $1)', [`+38099${process.pid}%`]);
    await pool.query('DELETE FROM users WHERE phone_e164 LIKE $1', [`+38099${process.pid}%`]);
    await pool.query('DELETE FROM sessions WHERE user_id = ANY($1::uuid[])', [[ids.driver, ids.passengerA, ids.passengerB]]);
    await pool.query('DELETE FROM otp_challenges WHERE phone_e164 LIKE $1', [`+38099${process.pid}%`]);
    await pool.query("DELETE FROM audit_events WHERE actor_id = ANY($1::uuid[]) AND action IN ('vehicle.created','offer.created','demand.created','demand.cancelled','proposal.created','proposal.countered','proposal.agreed','proposal.accepted')", [[ids.driver, ids.passengerA]]);
    await pool.query('DELETE FROM audit_events WHERE entity_id IN (SELECT id FROM bookings WHERE offer_id IN (SELECT id FROM offers WHERE driver_id = $1)) OR entity_id = ANY($2::uuid[])',
      [ids.driver, [ids.vehicle, ...(apiCreatedVehicleId ? [apiCreatedVehicleId] : []), ...extraVehicleIds]]);
    await pool.query('DELETE FROM reviews WHERE booking_id IN (SELECT id FROM bookings WHERE offer_id IN (SELECT id FROM offers WHERE driver_id=$1))', [ids.driver]);
    await pool.query('DELETE FROM conversations WHERE booking_id IN (SELECT id FROM bookings WHERE offer_id IN (SELECT id FROM offers WHERE driver_id = $1))', [ids.driver]);
    await pool.query('DELETE FROM bookings WHERE offer_id IN (SELECT id FROM offers WHERE driver_id = $1)', [ids.driver]);
    await pool.query('DELETE FROM proposals WHERE driver_id=$1 OR demand_id IN (SELECT id FROM passenger_demands WHERE passenger_id=$2)', [ids.driver, ids.passengerA]);
    await pool.query('DELETE FROM passenger_demands WHERE passenger_id=$1', [ids.passengerA]);
    await pool.query('DELETE FROM offers WHERE driver_id = $1', [ids.driver]);
    await pool.query('DELETE FROM vehicles WHERE owner_id = $1', [ids.driver]);
    await pool.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [[ids.driver, ids.passengerA, ids.passengerB]]);
    await pool.end();
  });

  it('registers with development OTP, persists profile, and rotates refresh sessions', async () => {
    const phone = `+38099${process.pid}${crypto.randomInt(1000, 9999)}`;
    const requested = await fetch(`${apiUrl}/api/v1/auth/otp/request`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone, displayName: 'OTP Integration User' }),
    });
    assert.equal(requested.status, 200);
    const requestBody = await requested.json() as { developmentCode?: string };
    assert.match(requestBody.developmentCode ?? '', /^\d{6}$/);
    const verified = await fetch(`${apiUrl}/api/v1/auth/otp/verify`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone, code: requestBody.developmentCode }),
    });
    assert.equal(verified.status, 200);
    const auth = await verified.json() as { data: { user: { id: string; roles: string[] }; accessToken: string } };
    assert.ok(auth.data.user.id);
    otpUserId = auth.data.user.id;
    assert.deepEqual(auth.data.user.roles, ['passenger']);
    const authHeaders = { authorization: `Bearer ${auth.data.accessToken}`, 'content-type': 'application/json' };
    const unavailableRoute = await fetch(`${apiUrl}/api/v1/routing/route`, {
      method: 'POST', headers: authHeaders,
      body: JSON.stringify({ origin: [23.86, 49.25], destination: [24.03, 49.84] }),
    });
    assert.equal(unavailableRoute.status, 503);
    const me = await fetch(`${apiUrl}/api/v1/users/me`, { headers: authHeaders });
    assert.equal(me.status, 200);
    const profile = await fetch(`${apiUrl}/api/v1/users/me`, {
      method: 'PATCH', headers: authHeaders, body: JSON.stringify({ email: 'otp-user@example.test' }),
    });
    assert.equal((await profile.json() as { data: { email: string } }).data.email, 'otp-user@example.test');
    const updatedName = await fetch(`${apiUrl}/api/v1/users/me`, {
      method: 'PATCH', headers: authHeaders, body: JSON.stringify({ displayName: 'Updated OTP User' }),
    });
    const updatedProfile = await updatedName.json() as { data: { email: string; display_name: string } };
    assert.equal(updatedProfile.data.email, 'otp-user@example.test');
    assert.equal(updatedProfile.data.display_name, 'Updated OTP User');

    const enabledDriver = await fetch(`${apiUrl}/api/v1/users/me/roles`, {
      method: 'POST', headers: authHeaders, body: JSON.stringify({ role: 'driver' }),
    });
    const roleBody = await enabledDriver.json() as { data?: { roles: string[] }; error?: { message: string } };
    assert.equal(enabledDriver.status, 200, roleBody.error?.message);
    assert.deepEqual(roleBody.data?.roles, ['driver', 'passenger']);
    const ownCar = await fetch(`${apiUrl}/api/v1/vehicles`, {
      method: 'POST', headers: authHeaders, body: JSON.stringify({ make: 'Test', model: 'OTP Car', modelYear: 2022, seats: 4 }),
    });
    assert.equal(ownCar.status, 201);
    const createdVehicle = await ownCar.json() as { data: { id: string } };
    const blockedUpload = await fetch(`${apiUrl}/api/v1/vehicles/${createdVehicle.data.id}/photos/upload-url`, {
      method: 'POST', headers: authHeaders, body: JSON.stringify({ contentType: 'image/jpeg' }),
    });
    assert.equal(blockedUpload.status, 503);

    const verifyCookie = verified.headers.get('set-cookie');
    assert.ok(verifyCookie?.includes('mg_refresh='));
    const cookie = verifyCookie?.split(';')[0];
    const refreshed = await fetch(`${apiUrl}/api/v1/auth/refresh`, { method: 'POST', headers: { cookie: cookie ?? '' } });
    assert.equal(refreshed.status, 200);
    const rotatedCookie = refreshed.headers.get('set-cookie')?.split(';')[0];
    assert.ok(rotatedCookie && rotatedCookie !== cookie);
    const refreshBody = await refreshed.json() as { data: { accessToken: string } };
    const logout = await fetch(`${apiUrl}/api/v1/auth/logout-all`, {
      method: 'POST', headers: { authorization: `Bearer ${refreshBody.data.accessToken}` },
    });
    assert.equal(logout.status, 200);
    const oldRefresh = await fetch(`${apiUrl}/api/v1/auth/refresh`, { method: 'POST', headers: { cookie: rotatedCookie ?? '' } });
    assert.equal(oldRefresh.status, 401);
    const oldAccess = await fetch(`${apiUrl}/api/v1/users/me`, { headers: { authorization: `Bearer ${refreshBody.data.accessToken}` } });
    assert.equal(oldAccess.status, 401);
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
    const vehicle = await vehicleResponse.json() as { data: { id: string; verification_status: string; is_active: boolean } };
    apiCreatedVehicleId = vehicle.data.id;
    assert.equal(vehicle.data.verification_status, 'pending');
    assert.equal(vehicle.data.is_active, true);

    const forbiddenEdit = await fetch(`${apiUrl}/api/v1/vehicles/${apiCreatedVehicleId}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json', 'x-dev-user-id': ids.passengerA },
      body: JSON.stringify({ model: 'Hijacked' }),
    });
    assert.equal(forbiddenEdit.status, 403);
    const ownerEdit = await fetch(`${apiUrl}/api/v1/vehicles/${apiCreatedVehicleId}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json', 'x-dev-user-id': ids.driver },
      body: JSON.stringify({ model: 'Ceed Updated' }),
    });
    assert.equal((await ownerEdit.json() as { data: { model: string } }).data.model, 'Ceed Updated');

    const secondVehicle = await fetch(`${apiUrl}/api/v1/vehicles`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-dev-user-id': ids.driver },
      body: JSON.stringify({ make: 'Skoda', model: 'Octavia', modelYear: 2023, seats: 4 }),
    });
    const second = await secondVehicle.json() as { data: { id: string; is_active: boolean } };
    extraVehicleIds.push(second.data.id);
    assert.equal(second.data.is_active, false);
    const activated = await fetch(`${apiUrl}/api/v1/vehicles/${second.data.id}/activate`, {
      method: 'POST', headers: { 'x-dev-user-id': ids.driver },
    });
    assert.equal((await activated.json() as { data: { is_active: boolean } }).data.is_active, true);
    const vehicleCount = await pool.query('SELECT count(*)::int AS active_count FROM vehicles WHERE owner_id=$1 AND is_active', [ids.driver]);
    assert.equal(vehicleCount.rows[0].active_count, 1);

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
    const response = await published.json() as { data: { id: string; available_seats: number; route_source: string } };
    assert.equal(response.data.available_seats, 2);
    assert.equal(response.data.route_source, 'development_unrouted');
    const localDepartureDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv' }).format(new Date(offerPayload.departureAt));
    const found = await fetch(`${apiUrl}/api/v1/offers?origin=API%20Publish%20Origin&destination=API%20Publish%20Destination&date=${localDepartureDate}&seats=2`);
    assert.equal(found.status, 200);
    assert.equal((await found.json() as { data: Array<{ id: string }> }).data.some((offer) => offer.id === response.data.id), true);
    const tooMany = await fetch(`${apiUrl}/api/v1/offers?origin=API%20Publish%20Origin&destination=API%20Publish%20Destination&date=${localDepartureDate}&seats=5`);
    assert.equal((await tooMany.json() as { data: unknown[] }).data.length, 0);
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
        budgetType: 'total_all', notes: 'One suitcase', requirements: { luggage: true },
      }),
    });
    assert.equal(demandResponse.status, 201);
    const demand = await demandResponse.json() as { data: { id: string; status: string; budget_type: string; notes: string; requirements: { luggage: boolean } } };
    assert.equal(demand.data.budget_type, 'total_all');
    assert.equal(demand.data.notes, 'One suitcase');
    assert.equal(demand.data.requirements.luggage, true);

    const ownDemands = await fetch(`${apiUrl}/api/v1/demands/mine`, { headers: headers(ids.passengerA) });
    assert.equal(ownDemands.status, 200);
    assert.equal((await ownDemands.json() as { data: Array<{ id: string; proposal_count: number }> }).data.find((item) => item.id === demand.data.id)?.proposal_count, 0);

    const driverDemands = await fetch(`${apiUrl}/api/v1/demands`, { headers: headers(ids.driver) });
    assert.equal((await driverDemands.json() as { data: Array<{ id: string }> }).data.some((item) => item.id === demand.data.id), true);
    const noProposals = await fetch(`${apiUrl}/api/v1/demands/${demand.data.id}/proposals`, { headers: headers(ids.driver) });
    assert.equal(noProposals.status, 200);
    assert.deepEqual((await noProposals.json() as { data: unknown[] }).data, []);

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
    const prematureAccept = await fetch(`${apiUrl}/api/v1/proposals/${proposal.data.id}/accept`, {
      method: 'POST', headers: headers(ids.passengerA),
    });
    assert.equal(prematureAccept.status, 409);
    const agreedByDriver = await fetch(`${apiUrl}/api/v1/proposals/${proposal.data.id}/agree`, {
      method: 'POST', headers: headers(ids.driver),
    });
    assert.equal(agreedByDriver.status, 200);
    const revisions = await fetch(`${apiUrl}/api/v1/proposals/${proposal.data.id}/revisions`, {
      headers: headers(ids.driver),
    });
    const proposalHistory = await revisions.json() as { data: Array<{ actor_role: string; price_minor: number }> };
    assert.equal(proposalHistory.data.length, 3);
    assert.equal(proposalHistory.data[2].actor_role, 'driver');
    assert.equal(proposalHistory.data[2].price_minor, 15000);

    const accepted = await fetch(`${apiUrl}/api/v1/proposals/${proposal.data.id}/accept`, {
      method: 'POST', headers: headers(ids.passengerA),
    });
    assert.equal(accepted.status, 201);
    const booking = await accepted.json() as { data: { id: string; total_price_minor: number; seat_count: number }; agreedTotalMinor: number };
    assert.equal(booking.data.total_price_minor, 15000);
    assert.equal(booking.data.seat_count, 2);
    assert.equal(booking.agreedTotalMinor, 15000);

    const cancellationDemand = await fetch(`${apiUrl}/api/v1/demands`, {
      method: 'POST', headers: headers(ids.passengerA),
      body: JSON.stringify({
        originName: 'Cancel Origin', destinationName: 'Cancel Destination', origin: [23.86, 49.25], destination: [24.03, 49.84],
        earliestDeparture: earliest.toISOString(), latestDeparture: latest.toISOString(), passengers: 1,
      }),
    });
    const cancellationDemandId = (await cancellationDemand.json() as { data: { id: string } }).data.id;
    const cancelled = await fetch(`${apiUrl}/api/v1/demands/${cancellationDemandId}/cancel`, { method: 'POST', headers: headers(ids.passengerA) });
    assert.equal((await cancelled.json() as { data: { status: string } }).data.status, 'cancelled');
    const cancelledAgain = await fetch(`${apiUrl}/api/v1/demands/${cancellationDemandId}/cancel`, { method: 'POST', headers: headers(ids.passengerA) });
    assert.equal((await cancelledAgain.json() as { replayed: boolean }).replayed, true);

    const ticketResponse = await fetch(`${apiUrl}/api/v1/bookings/${booking.data.id}/ticket`, { headers: headers(ids.driver) });
    assert.equal(ticketResponse.status, 200);
    const ticket = await ticketResponse.json() as { data: { token: string } };
    const invalidTicket = await fetch(`${apiUrl}/api/v1/bookings/${booking.data.id}/boarding`, {
      method: 'POST', headers: headers(ids.driver), body: JSON.stringify({ ticket: 'bad.signature' }),
    });
    assert.equal(invalidTicket.status, 400);
    const wrongBoarding = await fetch(`${apiUrl}/api/v1/bookings/${booking.data.id}/boarding`, {
      method: 'POST', headers: headers(ids.passengerA), body: JSON.stringify({ ticket: ticket.data.token }),
    });
    assert.equal(wrongBoarding.status, 404);
    const boarding = await fetch(`${apiUrl}/api/v1/bookings/${booking.data.id}/boarding`, {
      method: 'POST', headers: headers(ids.driver), body: JSON.stringify({ ticket: ticket.data.token }),
    });
    assert.equal((await boarding.json() as { data: { status: string } }).data.status, 'boarding');
    const passengerStart = await fetch(`${apiUrl}/api/v1/bookings/${booking.data.id}/start`, {
      method: 'POST', headers: headers(ids.passengerA),
    });
    assert.equal(passengerStart.status, 404);
    const started = await fetch(`${apiUrl}/api/v1/bookings/${booking.data.id}/start`, {
      method: 'POST', headers: headers(ids.driver),
    });
    assert.equal((await started.json() as { data: { status: string } }).data.status, 'in_progress');
    const earlyReview = await fetch(`${apiUrl}/api/v1/bookings/${booking.data.id}/reviews`, {
      method: 'POST', headers: headers(ids.passengerA), body: JSON.stringify({ rating: 5 }),
    });
    assert.equal(earlyReview.status, 409);
    const firstCompletion = await fetch(`${apiUrl}/api/v1/bookings/${booking.data.id}/complete`, {
      method: 'POST', headers: headers(ids.passengerA),
    });
    assert.deepEqual((await firstCompletion.json() as { data: { status: string; confirmations: number } }).data, {
      id: booking.data.id, status: 'in_progress', confirmations: 1, requiredConfirmations: 2,
    });
    const secondCompletion = await fetch(`${apiUrl}/api/v1/bookings/${booking.data.id}/complete`, {
      method: 'POST', headers: headers(ids.driver),
    });
    assert.equal((await secondCompletion.json() as { data: { status: string } }).data.status, 'completed');
    const passengerReview = await fetch(`${apiUrl}/api/v1/bookings/${booking.data.id}/reviews`, {
      method: 'POST', headers: headers(ids.passengerA), body: JSON.stringify({ rating: 5, comment: 'Доїхали вчасно.' }),
    });
    assert.equal(passengerReview.status, 201);
    const driverReview = await fetch(`${apiUrl}/api/v1/bookings/${booking.data.id}/reviews`, {
      method: 'POST', headers: headers(ids.driver), body: JSON.stringify({ rating: 4 }),
    });
    assert.equal(driverReview.status, 201);
    const duplicateReview = await fetch(`${apiUrl}/api/v1/bookings/${booking.data.id}/reviews`, {
      method: 'POST', headers: headers(ids.passengerA), body: JSON.stringify({ rating: 1 }),
    });
    assert.equal(duplicateReview.status, 409);
    const offerDate = new Date(Date.now() + 10 * 86400_000);
    const localOfferDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv' }).format(offerDate);
    const ratedOffers = await fetch(`${apiUrl}/api/v1/offers?origin=API%20Publish%20Origin&destination=API%20Publish%20Destination&date=${localOfferDate}&seats=2`);
    const rated = (await ratedOffers.json() as { data: Array<{ average_rating: string | number; review_count: number }> }).data[0];
    assert.equal(Number(rated.average_rating), 5);
    assert.equal(rated.review_count, 1);
    const bookingEvents = await fetch(`${apiUrl}/api/v1/bookings/${booking.data.id}/events`, { headers: headers(ids.driver) });
    assert.deepEqual((await bookingEvents.json() as { data: Array<{ to_status: string }> }).data.map((event) => event.to_status), [
      'confirmed', 'boarding', 'in_progress', 'completed',
    ]);

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
