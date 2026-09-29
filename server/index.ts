import 'dotenv/config';
import crypto from 'node:crypto';
import express, { NextFunction, Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { Pool } from 'pg';

const app = express();
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 12, idleTimeoutMillis: 30_000 });
const port = Number(process.env.API_PORT || 3002);
const host = process.env.API_HOST || '127.0.0.1';
const allowedOrigins = new Set((process.env.CORS_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000').split(',').map((origin) => origin.trim()));

app.disable('x-powered-by');
app.use((req, res, next) => {
  const origin = req.get('origin');
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,Idempotency-Key');
    return res.sendStatus(204);
  }
  next();
});
app.use(express.json({ limit: '32kb', strict: true }));
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'rate_limit_exceeded' },
}));

type AuthenticatedRequest = Request & { userId?: string };
function sha256(value: string) { return crypto.createHash('sha256').update(value).digest('hex'); }
function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const bearer = req.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (bearer) {
    pool.query<{ user_id: string }>(
      `SELECT user_id FROM sessions WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > now()`,
      [sha256(bearer)],
    ).then(({ rows }) => {
      if (!rows[0]) return res.status(401).json({ error: 'unauthorized' });
      req.userId = rows[0].user_id;
      next();
    }).catch(next);
    return;
  }

  // Explicit local-only escape hatch for API development; never accepted in production.
  const devUserId = req.get('x-dev-user-id');
  if (process.env.NODE_ENV === 'development' && process.env.AUTH_DEV_BYPASS === 'true' && devUserId) {
    req.userId = devUserId;
    next();
    return;
  }
  res.status(401).json({ error: 'unauthorized' });
}

class ApiError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}
const asyncHandler = (handler: (req: AuthenticatedRequest, res: Response) => Promise<void>) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => { void handler(req, res).catch(next); };
function requireRole(role: 'driver' | 'passenger') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    pool.query<{ allowed: boolean }>('SELECT roles @> ARRAY[$2]::text[] AS allowed FROM users WHERE id = $1', [req.userId, role])
      .then(({ rows }) => {
        if (!rows[0]) return res.status(401).json({ error: 'unauthorized' });
        if (!rows[0].allowed) return res.status(403).json({ error: 'forbidden' });
        next();
      }).catch(next);
  };
}

app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));
app.get('/readyz', asyncHandler(async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ready', database: 'connected' });
}));

// Return only published, future inventory from the database. This route has no seed-data fallback.
app.get('/api/v1/offers', asyncHandler(async (req, res) => {
  const origin = String(req.query.origin || '').trim();
  const destination = String(req.query.destination || '').trim();
  if (!origin || !destination || origin.length > 120 || destination.length > 120) {
    throw new ApiError(400, 'origin and destination are required');
  }
  const { rows } = await pool.query(
    `SELECT o.id, o.origin_name, o.destination_name, o.departure_at, o.price_per_seat_minor,
            o.currency, o.available_seats, u.display_name AS driver_name
       FROM offers o JOIN users u ON u.id = o.driver_id
      WHERE o.status = 'published' AND o.departure_at > now() AND o.available_seats > 0
        AND lower(o.origin_name) = lower($1) AND lower(o.destination_name) = lower($2)
      ORDER BY o.departure_at ASC LIMIT 100`,
    [origin, destination],
  );
  res.json({ data: rows });
}));

app.get('/api/v1/users/me', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, display_name, email, roles, is_verified, created_at FROM users WHERE id = $1', [req.userId],
  );
  if (!rows[0]) throw new ApiError(404, 'user unavailable');
  res.json({ data: rows[0] });
}));

app.get('/api/v1/vehicles', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, make, model, model_year, seat_count, verification_status, created_at
       FROM vehicles WHERE owner_id = $1 ORDER BY created_at DESC`, [req.userId],
  );
  res.json({ data: rows });
}));

app.post('/api/v1/vehicles', requireAuth, requireRole('driver'), asyncHandler(async (req, res) => {
  const { make, model, modelYear, seats } = req.body ?? {};
  if (typeof make !== 'string' || make.trim().length < 1 || make.length > 80 ||
      typeof model !== 'string' || model.trim().length < 1 || model.length > 100 ||
      !Number.isInteger(modelYear) || modelYear < 1950 || modelYear > new Date().getUTCFullYear() + 1 ||
      !Number.isInteger(seats) || seats < 1 || seats > 20) {
    throw new ApiError(400, 'invalid vehicle fields');
  }
  const { rows } = await pool.query(
    `INSERT INTO vehicles(owner_id,make,model,model_year,seat_count)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING id, make, model, model_year, seat_count, verification_status, created_at`,
    [req.userId, make.trim(), model.trim(), modelYear, seats],
  );
  await pool.query('INSERT INTO audit_events(actor_id,action,entity_type,entity_id) VALUES ($1,$2,$3,$4)', [req.userId, 'vehicle.created', 'vehicle', rows[0].id]);
  res.status(201).json({ data: rows[0] });
}));

app.post('/api/v1/offers', requireAuth, requireRole('driver'), asyncHandler(async (req, res) => {
  const body = req.body ?? {};
  const { vehicleId, originName, destinationName, origin, destination, departureAt, pricePerSeatMinor, seats } = body;
  const pointValid = (point: unknown) => Array.isArray(point) && point.length === 2 &&
    typeof point[0] === 'number' && typeof point[1] === 'number' &&
    Number.isFinite(point[0]) && Number.isFinite(point[1]) && Math.abs(point[0]) <= 180 && Math.abs(point[1]) <= 90;
  const departure = new Date(departureAt);
  if (typeof vehicleId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(vehicleId) ||
      typeof originName !== 'string' || originName.trim().length < 1 || originName.length > 120 ||
      typeof destinationName !== 'string' || destinationName.trim().length < 1 || destinationName.length > 120 ||
      !pointValid(origin) || !pointValid(destination) || !Number.isFinite(departure.getTime()) || departure <= new Date() ||
      !Number.isInteger(pricePerSeatMinor) || pricePerSeatMinor < 0 || pricePerSeatMinor > 100_000_000 ||
      !Number.isInteger(seats) || seats < 1 || seats > 20) {
    throw new ApiError(400, 'invalid offer fields');
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const vehicle = await client.query<{ seat_count: number }>(
      "SELECT seat_count FROM vehicles WHERE id = $1 AND owner_id = $2 AND verification_status = 'verified' FOR SHARE",
      [vehicleId, req.userId],
    );
    if (!vehicle.rows[0]) throw new ApiError(404, 'verified vehicle unavailable');
    if (seats > Number(vehicle.rows[0].seat_count)) throw new ApiError(400, 'offer exceeds vehicle capacity');
    const { rows } = await client.query(
      `INSERT INTO offers(driver_id,vehicle_id,origin_name,destination_name,origin,destination,departure_at,price_per_seat_minor,total_seats,available_seats)
       VALUES ($1,$2,$3,$4,ST_SetSRID(ST_MakePoint($5,$6),4326)::geography,ST_SetSRID(ST_MakePoint($7,$8),4326)::geography,$9,$10,$11,$11)
       RETURNING id, origin_name, destination_name, departure_at, price_per_seat_minor, currency, total_seats, available_seats, status`,
      [req.userId, vehicleId, originName.trim(), destinationName.trim(), origin[0], origin[1], destination[0], destination[1], departure.toISOString(), pricePerSeatMinor, seats],
    );
    await client.query('INSERT INTO audit_events(actor_id,action,entity_type,entity_id) VALUES ($1,$2,$3,$4)', [req.userId, 'offer.created', 'offer', rows[0].id]);
    await client.query('COMMIT');
    res.status(201).json({ data: rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

app.get('/api/v1/bookings', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT b.id, b.offer_id, b.seat_count, b.total_price_minor, b.currency, b.status, b.created_at,
            o.origin_name, o.destination_name, o.departure_at, u.display_name AS driver_name, p.display_name AS passenger_name
       FROM bookings b JOIN offers o ON o.id = b.offer_id JOIN users u ON u.id = o.driver_id
       JOIN users p ON p.id=b.passenger_id
      WHERE b.passenger_id = $1 OR o.driver_id=$1 ORDER BY b.created_at DESC LIMIT 100`, [req.userId],
  );
  res.json({ data: rows });
}));

app.post('/api/v1/bookings', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.userId!;
  const offerId = req.body?.offerId;
  const seats = req.body?.seats;
  const key = req.get('idempotency-key');
  if (typeof offerId !== 'string' || !/^[0-9a-f-]{36}$/i.test(offerId)) throw new ApiError(400, 'valid offerId is required');
  if (!Number.isInteger(seats) || seats < 1 || seats > 20) throw new ApiError(400, 'seats must be an integer from 1 to 20');
  if (!key || key.length < 16 || key.length > 128) throw new ApiError(400, 'Idempotency-Key must be 16–128 characters');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const offer = await client.query<{ price_per_seat_minor: number; currency: string; available_seats: number; driver_id: string; status: string }>(
      'SELECT price_per_seat_minor, currency, available_seats, driver_id, status FROM offers WHERE id = $1 FOR UPDATE', [offerId],
    );
    const currentOffer = offer.rows[0];
    if (!currentOffer || currentOffer.status !== 'published') throw new ApiError(404, 'offer unavailable');

    const prior = await client.query(
      'SELECT id, offer_id, seat_count, total_price_minor, currency, status FROM bookings WHERE passenger_id = $1 AND idempotency_key = $2',
      [userId, key],
    );
    if (prior.rows[0]) {
      if (prior.rows[0].offer_id !== offerId || Number(prior.rows[0].seat_count) !== seats) throw new ApiError(409, 'idempotency key already used for another request');
      await client.query('COMMIT');
      res.status(200).json({ data: prior.rows[0], replayed: true });
      return;
    }
    if (currentOffer.driver_id === userId) throw new ApiError(400, 'drivers cannot book their own offer');
    if (Number(currentOffer.available_seats) < seats) throw new ApiError(409, 'not enough available seats');

    const total = Number(currentOffer.price_per_seat_minor) * seats;
    await client.query('UPDATE offers SET available_seats = available_seats - $2 WHERE id = $1', [offerId, seats]);
    const booking = await client.query(
      `INSERT INTO bookings(offer_id, passenger_id, seat_count, unit_price_minor, total_price_minor, currency, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id, offer_id, seat_count, unit_price_minor, total_price_minor, currency, status, created_at`,
      [offerId, userId, seats, currentOffer.price_per_seat_minor, total, currentOffer.currency, key],
    );
    await client.query('INSERT INTO conversations(booking_id) VALUES ($1)', [booking.rows[0].id]);
    await client.query('INSERT INTO conversation_members(conversation_id,user_id) SELECT id,$2 FROM conversations WHERE booking_id=$1', [booking.rows[0].id, currentOffer.driver_id]);
    await client.query('INSERT INTO conversation_members(conversation_id,user_id) SELECT id,$2 FROM conversations WHERE booking_id=$1', [booking.rows[0].id, userId]);
    await client.query('INSERT INTO audit_events(actor_id,action,entity_type,entity_id) VALUES ($1,$2,$3,$4)', [userId, 'booking.created', 'booking', booking.rows[0].id]);
    await client.query('COMMIT');
    res.status(201).json({ data: booking.rows[0], replayed: false });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

app.post('/api/v1/bookings/:id/cancel', requireAuth, asyncHandler(async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const locked = await client.query<{ id: string; offer_id: string; seat_count: number; status: string }>(
      'SELECT id, offer_id, seat_count, status FROM bookings WHERE id = $1 AND passenger_id = $2 FOR UPDATE', [req.params.id, req.userId],
    );
    const booking = locked.rows[0];
    if (!booking) throw new ApiError(404, 'booking unavailable');
    if (booking.status === 'cancelled') {
      await client.query('COMMIT');
      res.json({ data: { id: booking.id, status: 'cancelled' }, replayed: true });
      return;
    }
    if (booking.status !== 'confirmed') throw new ApiError(409, 'booking cannot be cancelled');
    await client.query("UPDATE bookings SET status='cancelled', cancelled_at=now() WHERE id=$1", [booking.id]);
    await client.query("UPDATE offers SET available_seats=LEAST(total_seats,available_seats+$2) WHERE id=$1 AND status <> 'cancelled'", [booking.offer_id, booking.seat_count]);
    await client.query('INSERT INTO audit_events(actor_id,action,entity_type,entity_id) VALUES ($1,$2,$3,$4)', [req.userId, 'booking.cancelled', 'booking', booking.id]);
    await client.query('COMMIT');
    res.json({ data: { id: booking.id, status: 'cancelled' }, replayed: false });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

app.post('/api/v1/demands', requireAuth, requireRole('passenger'), asyncHandler(async (req, res) => {
  const body = req.body ?? {};
  const { originName, destinationName, origin, destination, earliestDeparture, latestDeparture, passengers, budgetMinor } = body;
  const validPoint = (point: unknown) => Array.isArray(point) && point.length === 2 &&
    typeof point[0] === 'number' && typeof point[1] === 'number' && Number.isFinite(point[0]) && Number.isFinite(point[1]) &&
    Math.abs(point[0]) <= 180 && Math.abs(point[1]) <= 90;
  const earliest = new Date(earliestDeparture);
  const latest = new Date(latestDeparture);
  if (typeof originName !== 'string' || !originName.trim() || originName.length > 120 ||
      typeof destinationName !== 'string' || !destinationName.trim() || destinationName.length > 120 ||
      !validPoint(origin) || !validPoint(destination) || !Number.isFinite(earliest.getTime()) || !Number.isFinite(latest.getTime()) ||
      earliest <= new Date() || latest < earliest || latest.getTime() - earliest.getTime() > 7 * 86400_000 ||
      !Number.isInteger(passengers) || passengers < 1 || passengers > 20 ||
      (budgetMinor !== undefined && (!Number.isInteger(budgetMinor) || budgetMinor < 0 || budgetMinor > 100_000_000))) {
    throw new ApiError(400, 'invalid passenger demand');
  }
  const { rows } = await pool.query(
    `INSERT INTO passenger_demands(passenger_id,origin_name,destination_name,origin,destination,earliest_departure,latest_departure,passenger_count,budget_minor)
     VALUES ($1,$2,$3,ST_SetSRID(ST_MakePoint($4,$5),4326)::geography,ST_SetSRID(ST_MakePoint($6,$7),4326)::geography,$8,$9,$10,$11)
     RETURNING id,origin_name,destination_name,earliest_departure,latest_departure,passenger_count,budget_minor,status,created_at`,
    [req.userId, originName.trim(), destinationName.trim(), origin[0], origin[1], destination[0], destination[1], earliest.toISOString(), latest.toISOString(), passengers, budgetMinor ?? null],
  );
  await pool.query('INSERT INTO audit_events(actor_id,action,entity_type,entity_id) VALUES ($1,$2,$3,$4)', [req.userId, 'demand.created', 'demand', rows[0].id]);
  res.status(201).json({ data: rows[0] });
}));

app.get('/api/v1/demands', requireAuth, requireRole('driver'), asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id,origin_name,destination_name,earliest_departure,latest_departure,passenger_count,budget_minor,created_at
       FROM passenger_demands WHERE status='open' AND latest_departure>now() AND passenger_id<>$1
      ORDER BY earliest_departure LIMIT 100`, [req.userId],
  );
  res.json({ data: rows });
}));

app.post('/api/v1/demands/:id/proposals', requireAuth, requireRole('driver'), asyncHandler(async (req, res) => {
  const { vehicleId, priceMinor, departureAt, comment } = req.body ?? {};
  const departure = new Date(departureAt);
  if (typeof vehicleId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(vehicleId) ||
      !Number.isInteger(priceMinor) || priceMinor < 0 || priceMinor > 100_000_000 || !Number.isFinite(departure.getTime()) ||
      (comment !== undefined && (typeof comment !== 'string' || comment.length > 1000))) throw new ApiError(400, 'invalid proposal');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: demands } = await client.query<{ passenger_id: string; earliest_departure: Date; latest_departure: Date; passenger_count: number; status: string }>(
      'SELECT passenger_id,earliest_departure,latest_departure,passenger_count,status FROM passenger_demands WHERE id=$1 FOR UPDATE', [req.params.id],
    );
    const demand = demands[0];
    if (!demand || demand.status !== 'open') throw new ApiError(404, 'demand unavailable');
    if (demand.passenger_id === req.userId) throw new ApiError(403, 'cannot propose to your own demand');
    if (departure < new Date(demand.earliest_departure) || departure > new Date(demand.latest_departure)) throw new ApiError(400, 'departure is outside the demand time window');
    const { rows: vehicles } = await client.query<{ seat_count: number }>(
      "SELECT seat_count FROM vehicles WHERE id=$1 AND owner_id=$2 AND verification_status='verified' FOR SHARE", [vehicleId, req.userId],
    );
    if (!vehicles[0]) throw new ApiError(404, 'verified vehicle unavailable');
    if (Number(vehicles[0].seat_count) < Number(demand.passenger_count)) throw new ApiError(400, 'vehicle has too few passenger seats');
    const { rows } = await client.query(
      `INSERT INTO proposals(demand_id,driver_id,vehicle_id,price_minor,departure_at,comment,expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,LEAST(now()+interval '24 hours',$7::timestamptz))
       RETURNING id,demand_id,driver_id,vehicle_id,price_minor,departure_at,status,expires_at,created_at`,
      [req.params.id, req.userId, vehicleId, priceMinor, departure.toISOString(), comment?.trim() || null, demand.latest_departure],
    );
    await client.query(
      `INSERT INTO proposal_revisions(proposal_id,revision_number,actor_id,actor_role,price_minor,departure_at,comment)
       VALUES ($1,1,$2,'driver',$3,$4,$5)`, [rows[0].id, req.userId, priceMinor, departure.toISOString(), comment?.trim() || null],
    );
    await client.query('INSERT INTO audit_events(actor_id,action,entity_type,entity_id) VALUES ($1,$2,$3,$4)', [req.userId, 'proposal.created', 'proposal', rows[0].id]);
    await client.query('COMMIT');
    res.status(201).json({ data: rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

app.post('/api/v1/proposals/:id/counter', requireAuth, asyncHandler(async (req, res) => {
  const { priceMinor, departureAt, comment } = req.body ?? {};
  const departure = new Date(departureAt);
  if (!Number.isInteger(priceMinor) || priceMinor < 0 || priceMinor > 100_000_000 || !Number.isFinite(departure.getTime()) ||
      (comment !== undefined && (typeof comment !== 'string' || comment.length > 1000))) throw new ApiError(400, 'invalid counter-offer');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query<{
      id: string; demand_id: string; driver_id: string; passenger_id: string; price_minor: number; departure_at: Date;
      revision_number: number; expires_at: Date; demand_status: string; earliest_departure: Date; latest_departure: Date;
    }>(
      `SELECT p.id,p.demand_id,p.driver_id,d.passenger_id,p.price_minor,p.departure_at,p.revision_number,p.expires_at,
              d.status AS demand_status,d.earliest_departure,d.latest_departure
         FROM proposals p JOIN passenger_demands d ON d.id=p.demand_id
        WHERE p.id=$1 AND p.status='pending' FOR UPDATE OF p,d`, [req.params.id],
    );
    const proposal = rows[0];
    if (!proposal || proposal.demand_status !== 'open' || new Date(proposal.expires_at) <= new Date()) throw new ApiError(404, 'proposal unavailable');
    const role = proposal.passenger_id === req.userId ? 'passenger' : proposal.driver_id === req.userId ? 'driver' : null;
    if (!role) throw new ApiError(403, 'not a negotiation participant');
    const { rows: latestRevision } = await client.query<{ actor_role: string }>(
      'SELECT actor_role FROM proposal_revisions WHERE proposal_id=$1 ORDER BY revision_number DESC LIMIT 1', [proposal.id],
    );
    if (latestRevision[0]?.actor_role === role) throw new ApiError(409, 'wait for the other participant to respond');
    if (departure < new Date(proposal.earliest_departure) || departure > new Date(proposal.latest_departure)) throw new ApiError(400, 'departure is outside the demand time window');
    if (Number(proposal.price_minor) === priceMinor && new Date(proposal.departure_at).getTime() === departure.getTime()) throw new ApiError(400, 'counter-offer must change price or time');
    const revision = Number(proposal.revision_number) + 1;
    await client.query('UPDATE proposals SET price_minor=$2,departure_at=$3,comment=$4,revision_number=$5 WHERE id=$1',
      [proposal.id, priceMinor, departure.toISOString(), comment?.trim() || null, revision]);
    await client.query(
      `INSERT INTO proposal_revisions(proposal_id,revision_number,actor_id,actor_role,price_minor,departure_at,comment)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`, [proposal.id, revision, req.userId, role, priceMinor, departure.toISOString(), comment?.trim() || null],
    );
    await client.query('INSERT INTO audit_events(actor_id,action,entity_type,entity_id) VALUES ($1,$2,$3,$4)', [req.userId, 'proposal.countered', 'proposal', proposal.id]);
    await client.query('COMMIT');
    res.json({ data: { id: proposal.id, price_minor: priceMinor, departure_at: departure.toISOString(), revision_number: revision } });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

app.post('/api/v1/proposals/:id/accept', requireAuth, asyncHandler(async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: demandRows } = await client.query<{
      id: string; passenger_id: string; origin_name: string; destination_name: string; passenger_count: number;
      status: string; earliest_departure: Date; latest_departure: Date;
    }>(
      `SELECT d.id,d.passenger_id,d.origin_name,d.destination_name,d.passenger_count,d.status,d.earliest_departure,d.latest_departure
         FROM passenger_demands d JOIN proposals p ON p.demand_id=d.id WHERE p.id=$1 FOR UPDATE OF d`, [req.params.id],
    );
    const demand = demandRows[0];
    if (!demand || demand.passenger_id !== req.userId) throw new ApiError(404, 'demand unavailable');
    if (demand.status !== 'open') throw new ApiError(409, 'demand has already been resolved');
    const { rows: proposalRows } = await client.query<{
      id: string; driver_id: string; vehicle_id: string; price_minor: number; departure_at: Date; status: string; expires_at: Date;
    }>('SELECT id,driver_id,vehicle_id,price_minor,departure_at,status,expires_at FROM proposals WHERE id=$1 AND demand_id=$2 FOR UPDATE', [req.params.id, demand.id]);
    const proposal = proposalRows[0];
    if (!proposal || proposal.status !== 'pending' || new Date(proposal.expires_at) <= new Date()) throw new ApiError(409, 'proposal is no longer available');
    const departure = new Date(proposal.departure_at);
    if (departure < new Date(demand.earliest_departure) || departure > new Date(demand.latest_departure)) throw new ApiError(409, 'proposal time is outside the demand window');
    const { rows: vehicles } = await client.query(
      "SELECT id FROM vehicles WHERE id=$1 AND owner_id=$2 AND verification_status='verified' FOR SHARE", [proposal.vehicle_id, proposal.driver_id],
    );
    if (!vehicles[0]) throw new ApiError(409, 'driver vehicle is no longer verified');
    const { rows: offers } = await client.query(
      `INSERT INTO offers(driver_id,vehicle_id,origin_name,destination_name,origin,destination,departure_at,price_per_seat_minor,total_seats,available_seats)
       SELECT $1,$2,d.origin_name,d.destination_name,d.origin,d.destination,$3,$4,d.passenger_count,d.passenger_count
         FROM passenger_demands d WHERE d.id=$5 RETURNING id`,
      [proposal.driver_id, proposal.vehicle_id, departure.toISOString(), Math.floor(Number(proposal.price_minor) / Number(demand.passenger_count)), demand.id],
    );
    const agreedTotal = Number(proposal.price_minor);
    const { rows: bookings } = await client.query(
      `INSERT INTO bookings(offer_id,passenger_id,seat_count,unit_price_minor,total_price_minor,currency,idempotency_key)
       VALUES ($1,$2,$3,$4,$5,'UAH',$6)
       RETURNING id,offer_id,seat_count,unit_price_minor,total_price_minor,currency,status,created_at`,
      [offers[0].id, req.userId, demand.passenger_count, Math.floor(agreedTotal / Number(demand.passenger_count)), agreedTotal, `proposal-accept:${proposal.id}`],
    );
    await client.query('UPDATE offers SET available_seats=available_seats-$2 WHERE id=$1', [offers[0].id, demand.passenger_count]);
    await client.query("UPDATE proposals SET status='accepted' WHERE id=$1", [proposal.id]);
    await client.query("UPDATE proposals SET status='rejected' WHERE demand_id=$1 AND id<>$2 AND status='pending'", [demand.id, proposal.id]);
    await client.query("UPDATE passenger_demands SET status='matched' WHERE id=$1 AND status='open'", [demand.id]);
    await client.query('INSERT INTO conversations(booking_id) VALUES ($1)', [bookings[0].id]);
    await client.query('INSERT INTO conversation_members(conversation_id,user_id) SELECT id,$2 FROM conversations WHERE booking_id=$1', [bookings[0].id, proposal.driver_id]);
    await client.query('INSERT INTO conversation_members(conversation_id,user_id) SELECT id,$2 FROM conversations WHERE booking_id=$1', [bookings[0].id, req.userId]);
    await client.query('INSERT INTO audit_events(actor_id,action,entity_type,entity_id) VALUES ($1,$2,$3,$4)', [req.userId, 'proposal.accepted', 'proposal', proposal.id]);
    await client.query('COMMIT');
    res.status(201).json({ data: bookings[0], proposalId: proposal.id, agreedTotalMinor: agreedTotal });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

app.get('/api/v1/proposals/:id/revisions', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT r.revision_number,r.actor_id,r.actor_role,r.price_minor,r.departure_at,r.comment,r.created_at
       FROM proposal_revisions r JOIN proposals p ON p.id=r.proposal_id
       JOIN passenger_demands d ON d.id=p.demand_id
      WHERE p.id=$1 AND (p.driver_id=$2 OR d.passenger_id=$2) ORDER BY r.revision_number`, [req.params.id, req.userId],
  );
  if (!rows.length) throw new ApiError(404, 'proposal unavailable');
  res.json({ data: rows });
}));

app.get('/api/v1/bookings/:id/conversation', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT c.id,c.booking_id,c.created_at FROM conversations c
      JOIN conversation_members cm ON cm.conversation_id=c.id
     WHERE c.booking_id=$1 AND cm.user_id=$2`, [req.params.id, req.userId],
  );
  if (!rows[0]) throw new ApiError(404, 'conversation unavailable');
  res.json({ data: rows[0] });
}));

app.get('/api/v1/conversations/:id/messages', requireAuth, asyncHandler(async (req, res) => {
  const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 50));
  const { rows } = await pool.query(
    `SELECT m.id,m.sender_id,u.display_name AS sender_name,m.body,m.created_at
       FROM messages m JOIN users u ON u.id=m.sender_id
      WHERE m.conversation_id=$1 AND EXISTS (
        SELECT 1 FROM conversation_members cm WHERE cm.conversation_id=m.conversation_id AND cm.user_id=$2
      )
      ORDER BY m.created_at DESC,m.id DESC LIMIT $3`, [req.params.id, req.userId, limit],
  );
  const { rows: membership } = await pool.query(
    'SELECT 1 FROM conversation_members WHERE conversation_id=$1 AND user_id=$2', [req.params.id, req.userId],
  );
  if (!membership[0]) throw new ApiError(404, 'conversation unavailable');
  res.json({ data: rows.reverse() });
}));

app.post('/api/v1/conversations/:id/messages', requireAuth, asyncHandler(async (req, res) => {
  const body = req.body?.body;
  if (typeof body !== 'string' || body.trim().length < 1 || body.trim().length > 4000) throw new ApiError(400, 'message body must contain 1–4000 characters');
  const { rows } = await pool.query(
    `INSERT INTO messages(conversation_id,sender_id,body)
     SELECT $1,$2,$3 WHERE EXISTS (
       SELECT 1 FROM conversation_members WHERE conversation_id=$1 AND user_id=$2
     ) RETURNING id,conversation_id,sender_id,body,created_at`,
    [req.params.id, req.userId, body.trim()],
  );
  if (!rows[0]) throw new ApiError(404, 'conversation unavailable');
  res.status(201).json({ data: rows[0] });
}));

app.use((req, res) => res.status(404).json({ error: 'not_found', path: req.path }));
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof ApiError) return res.status(error.status).json({ error: error.message });
  console.error(JSON.stringify({ level: 'error', message: error instanceof Error ? error.message : 'unknown_error' }));
  return res.status(500).json({ error: 'internal_error' });
});

const server = app.listen(port, host, () => console.log(JSON.stringify({ level: 'info', event: 'api.started', host, port })));
async function shutdown() {
  server.close(() => { void pool.end().finally(() => process.exit(0)); });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
