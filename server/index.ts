import 'dotenv/config';
import crypto from 'node:crypto';
import express, { NextFunction, Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { Pool, PoolClient } from 'pg';
import { sendVerificationCode, SmsProviderUnavailableError } from './sms';
import { getRoadRoute, RoutingUnavailableError } from './routing';
import { createVehiclePhotoUpload, deleteStoredVehiclePhoto, getVehiclePhotoUrl, isAllowedPhotoType, ObjectStorageUnavailableError, verifyVehiclePhotoObject } from './objectStorage';

const app = express();
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) throw new Error('SESSION_SECRET is required in production');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 12, idleTimeoutMillis: 30_000 });
const port = Number(process.env.API_PORT || 3002);
const host = process.env.API_HOST || '127.0.0.1';
const allowedOrigins = new Set((process.env.CORS_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000').split(',').map((origin) => origin.trim()));
const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const accessLifetimeMs = 15 * 60 * 1000;
const refreshLifetimeMs = 30 * 24 * 60 * 60 * 1000;

app.disable('x-powered-by');
app.use((req, res, next) => {
  const requestId = crypto.randomUUID();
  res.locals.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
});
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
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
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
  handler: (_req, res) => res.status(429).json({ error: { code: 'rate_limit_exceeded', message: 'Too many requests', requestId: res.locals.requestId } }),
}));

type AuthenticatedRequest = Request & { userId?: string; sessionId?: string };
function sha256(value: string) { return crypto.createHash('sha256').update(value).digest('hex'); }
function otpHash(phone: string, code: string) { return crypto.createHmac('sha256', sessionSecret).update(`${phone}:${code}`).digest('hex'); }
function token() { return crypto.randomBytes(32).toString('base64url'); }
function cookieValue(req: Request, name: string) {
  const value = req.get('cookie')?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
  return value ? decodeURIComponent(value) : undefined;
}
function setRefreshCookie(res: Response, value: string, maxAgeMs: number) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.append('Set-Cookie', `mg_refresh=${encodeURIComponent(value)}; Path=/api/v1/auth; HttpOnly; SameSite=Strict; Max-Age=${Math.floor(maxAgeMs / 1000)}${secure}`);
}
function clearRefreshCookie(res: Response) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.append('Set-Cookie', `mg_refresh=; Path=/api/v1/auth; HttpOnly; SameSite=Strict; Max-Age=0${secure}`);
}
async function insertSession(client: PoolClient, userId: string, familyId: string = crypto.randomUUID()) {
  const accessToken = token();
  const refreshToken = token();
  const accessExpiresAt = new Date(Date.now() + accessLifetimeMs);
  const refreshExpiresAt = new Date(Date.now() + refreshLifetimeMs);
  await client.query(
    `INSERT INTO sessions(user_id,token_hash,expires_at,refresh_token_hash,refresh_expires_at,family_id)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [userId, sha256(accessToken), accessExpiresAt.toISOString(), sha256(refreshToken), refreshExpiresAt.toISOString(), familyId],
  );
  return { accessToken, refreshToken, accessExpiresAt, refreshExpiresAt };
}
function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const bearer = req.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (bearer) {
    pool.query<{ id: string; user_id: string }>(
      `SELECT s.id,s.user_id FROM sessions s JOIN users u ON u.id=s.user_id
        WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at>now() AND u.account_status='active'`,
      [sha256(bearer)],
    ).then(({ rows }) => {
      if (!rows[0]) return res.status(401).json({ error: { code: 'unauthorized', message: 'Authentication required', requestId: res.locals.requestId } });
      req.userId = rows[0].user_id;
      req.sessionId = rows[0].id;
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
  res.status(401).json({ error: { code: 'unauthorized', message: 'Authentication required', requestId: res.locals.requestId } });
}

class ApiError extends Error {
  constructor(readonly status: number, message: string, readonly code = message.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')) { super(message); }
}
const asyncHandler = (handler: (req: AuthenticatedRequest, res: Response) => Promise<void>) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => { void handler(req, res).catch(next); };
function requireRole(role: 'driver' | 'passenger') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    pool.query<{ allowed: boolean }>('SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id=$1 AND role=$2) AS allowed', [req.userId, role])
      .then(({ rows }) => {
        if (!rows[0]) return res.status(401).json({ error: { code: 'unauthorized', message: 'Authentication required', requestId: res.locals.requestId } });
        if (!rows[0].allowed) return res.status(403).json({ error: { code: 'forbidden', message: 'Required role is missing', requestId: res.locals.requestId } });
        next();
      }).catch(next);
  };
}

app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));
app.get('/readyz', asyncHandler(async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ready', database: 'connected' });
}));

app.post('/api/v1/routing/route', requireAuth, asyncHandler(async (req, res) => {
  const { origin, destination } = req.body ?? {};
  const isPoint = (point: unknown) => Array.isArray(point) && point.length === 2 && point.every((value) => typeof value === 'number' && Number.isFinite(value));
  if (!isPoint(origin) || !isPoint(destination) || Math.abs(origin[0]) > 180 || Math.abs(origin[1]) > 90 || Math.abs(destination[0]) > 180 || Math.abs(destination[1]) > 90) {
    throw new ApiError(400, 'origin and destination must be WGS84 coordinate pairs');
  }
  try {
    res.json({ data: await getRoadRoute(origin as [number, number], destination as [number, number]) });
  } catch (error) {
    if (error instanceof RoutingUnavailableError) throw new ApiError(503, error.message, 'routing_unavailable');
    throw error;
  }
}));

app.post('/api/v1/auth/otp/request', asyncHandler(async (req, res) => {
  const phone = req.body?.phone;
  const requestedName = req.body?.displayName;
  if (typeof phone !== 'string' || !/^\+[1-9]\d{7,14}$/.test(phone)) throw new ApiError(400, 'Use a valid international phone number');
  if (requestedName !== undefined && (typeof requestedName !== 'string' || requestedName.trim().length < 2 || requestedName.trim().length > 80)) {
    throw new ApiError(400, 'Name must contain 2–80 characters');
  }

  const displayName = typeof requestedName === 'string' ? requestedName.trim() : null;
  if (!displayName) throw new ApiError(400, 'Name is required');

  const challengeId = crypto.randomUUID();
  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const requestIpHash = sha256(`${sessionSecret}:${req.ip}`);
    for (const lockKey of [`phone:${phone}`, `ip:${requestIpHash}`].sort()) {
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [lockKey]);
    }
    const { rows } = await client.query<{ attempts_in_hour: number; ip_attempts_in_hour: number; seconds_since_latest: number | null }>(
      `SELECT (SELECT count(*)::int FROM otp_challenges WHERE phone_e164=$1 AND created_at>now()-interval '1 hour') AS attempts_in_hour,
              (SELECT count(*)::int FROM otp_challenges WHERE request_ip_hash=$2 AND created_at>now()-interval '1 hour') AS ip_attempts_in_hour,
              (SELECT EXTRACT(EPOCH FROM (now()-max(created_at)))::int FROM otp_challenges WHERE phone_e164=$1 AND created_at>now()-interval '1 hour') AS seconds_since_latest`, [phone, requestIpHash],
    );
    if (rows[0].seconds_since_latest !== null && rows[0].seconds_since_latest < 60) throw new ApiError(429, 'Wait before requesting another code');
    if (Number(rows[0].attempts_in_hour) >= 5) throw new ApiError(429, 'OTP request limit reached for this phone');
    if (Number(rows[0].ip_attempts_in_hour) >= 20) throw new ApiError(429, 'OTP request limit reached for this network');
    await client.query(
      `INSERT INTO otp_challenges(id,phone_e164,code_hash,display_name,request_ip_hash,expires_at)
       VALUES ($1,$2,$3,$4,$5,now()+interval '5 minutes')`,
      [challengeId, phone, otpHash(phone, code), displayName, requestIpHash],
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  try {
    const delivery = await sendVerificationCode(phone, code);
    if (delivery.provider === 'development') {
      res.json({ data: { expiresInSeconds: 300, delivery: 'development' }, developmentCode: delivery.testCode });
      return;
    }
    res.json({ data: { expiresInSeconds: 300, delivery: 'sent' } });
  } catch (error) {
    await pool.query('UPDATE otp_challenges SET consumed_at=now() WHERE id=$1', [challengeId]);
    if (error instanceof SmsProviderUnavailableError) throw new ApiError(503, 'SMS verification is not configured', 'sms_provider_unavailable');
    throw new ApiError(503, 'Could not deliver verification code', 'sms_delivery_failed');
  }
}));

app.post('/api/v1/auth/otp/verify', asyncHandler(async (req, res) => {
  const phone = req.body?.phone;
  const code = req.body?.code;
  if (typeof phone !== 'string' || !/^\+[1-9]\d{7,14}$/.test(phone) || typeof code !== 'string' || !/^\d{6}$/.test(code)) {
    throw new ApiError(400, 'Phone and six-digit code are required');
  }
  const client = await pool.connect();
  let session: Awaited<ReturnType<typeof insertSession>> | undefined;
  let user: { id: string; display_name: string; phone_e164: string; roles: string[] } | undefined;
  let invalidCode = false;
  let unavailableAccount = false;
  try {
    await client.query('BEGIN');
    const { rows } = await client.query<{
      id: string; code_hash: string; display_name: string | null; attempts: number; expires_at: Date; consumed_at: Date | null;
    }>(
      'SELECT id,code_hash,display_name,attempts,expires_at,consumed_at FROM otp_challenges WHERE phone_e164=$1 ORDER BY created_at DESC LIMIT 1 FOR UPDATE', [phone],
    );
    const challenge = rows[0];
    if (!challenge || challenge.consumed_at || new Date(challenge.expires_at) <= new Date() || Number(challenge.attempts) >= 5) {
      invalidCode = true;
    } else {
      const expected = Buffer.from(challenge.code_hash, 'hex');
      const actual = Buffer.from(otpHash(phone, code), 'hex');
      if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
        await client.query('UPDATE otp_challenges SET attempts=attempts+1 WHERE id=$1', [challenge.id]);
        invalidCode = true;
      } else {
        await client.query('UPDATE otp_challenges SET consumed_at=now() WHERE id=$1', [challenge.id]);
        const found = await client.query<{ id: string; display_name: string; phone_e164: string; roles: string[]; account_status: string }>(
          'SELECT id,display_name,phone_e164,roles,account_status FROM users WHERE phone_e164=$1 FOR UPDATE', [phone],
        );
        if (found.rows[0]?.account_status !== undefined && found.rows[0].account_status !== 'active') {
          unavailableAccount = true;
        } else {
          if (found.rows[0]) {
            user = found.rows[0];
            await client.query('UPDATE users SET is_verified=true,updated_at=now() WHERE id=$1', [user.id]);
          } else {
            const inserted = await client.query<{ id: string; display_name: string; phone_e164: string; roles: string[] }>(
              `INSERT INTO users(phone_e164,display_name,roles,is_verified)
               VALUES ($1,$2,ARRAY['passenger']::text[],true) RETURNING id,display_name,phone_e164,roles`,
              [phone, challenge.display_name],
            );
            user = inserted.rows[0];
            await client.query('INSERT INTO user_roles(user_id,role) VALUES ($1,$2)', [user.id, 'passenger']);
          }
          if (user) session = await insertSession(client, user.id);
        }
      }
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  if (invalidCode) throw new ApiError(401, 'Verification code is invalid or expired', 'otp_invalid');
  if (unavailableAccount || !user || !session) throw new ApiError(403, 'Account is not available', 'account_unavailable');
  setRefreshCookie(res, session.refreshToken, refreshLifetimeMs);
  res.json({ data: { user, accessToken: session.accessToken, accessExpiresAt: session.accessExpiresAt.toISOString() } });
}));

app.post('/api/v1/auth/refresh', asyncHandler(async (req, res) => {
  const refreshToken = cookieValue(req, 'mg_refresh');
  if (!refreshToken) throw new ApiError(401, 'Refresh session is missing', 'refresh_invalid');
  const client = await pool.connect();
  let rotated: Awaited<ReturnType<typeof insertSession>> | undefined;
  let userId: string | undefined;
  try {
    await client.query('BEGIN');
    const { rows } = await client.query<{
      id: string; user_id: string; family_id: string; revoked_at: Date | null; refresh_expires_at: Date | null;
    }>(
      'SELECT id,user_id,family_id,revoked_at,refresh_expires_at FROM sessions WHERE refresh_token_hash=$1 FOR UPDATE', [sha256(refreshToken)],
    );
    const current = rows[0];
    if (!current) throw new ApiError(401, 'Refresh session is invalid', 'refresh_invalid');
    if (current.revoked_at) {
      await client.query('UPDATE sessions SET revoked_at=COALESCE(revoked_at,now()) WHERE family_id=$1', [current.family_id]);
      await client.query('COMMIT');
      clearRefreshCookie(res);
      throw new ApiError(401, 'Refresh token reuse detected; sign in again', 'refresh_reuse_detected');
    }
    if (!current.refresh_expires_at || new Date(current.refresh_expires_at) <= new Date()) throw new ApiError(401, 'Refresh session expired', 'refresh_expired');
    const account = await client.query<{ account_status: string }>('SELECT account_status FROM users WHERE id=$1', [current.user_id]);
    if (account.rows[0]?.account_status !== 'active') throw new ApiError(401, 'Account is not active', 'account_unavailable');
    await client.query('UPDATE sessions SET revoked_at=now() WHERE id=$1', [current.id]);
    rotated = await insertSession(client, current.user_id, current.family_id);
    userId = current.user_id;
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
  if (!rotated || !userId) throw new ApiError(401, 'Refresh session is invalid', 'refresh_invalid');
  const { rows: users } = await pool.query('SELECT id,display_name,phone_e164,roles FROM users WHERE id=$1', [userId]);
  setRefreshCookie(res, rotated.refreshToken, refreshLifetimeMs);
  res.json({ data: { user: users[0], accessToken: rotated.accessToken, accessExpiresAt: rotated.accessExpiresAt.toISOString() } });
}));

app.post('/api/v1/auth/logout', requireAuth, asyncHandler(async (req, res) => {
  if (req.sessionId) await pool.query('UPDATE sessions SET revoked_at=COALESCE(revoked_at,now()) WHERE id=$1', [req.sessionId]);
  clearRefreshCookie(res);
  res.json({ data: { loggedOut: true } });
}));

app.post('/api/v1/auth/logout-all', requireAuth, asyncHandler(async (req, res) => {
  await pool.query('UPDATE sessions SET revoked_at=COALESCE(revoked_at,now()) WHERE user_id=$1', [req.userId]);
  clearRefreshCookie(res);
  res.json({ data: { loggedOut: true } });
}));

app.get('/api/v1/users/me', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id,phone_e164,display_name,email,roles,is_verified,account_status,created_at
       FROM users WHERE id=$1 AND account_status='active'`, [req.userId],
  );
  if (!rows[0]) throw new ApiError(404, 'user unavailable');
  res.json({ data: rows[0] });
}));

app.patch('/api/v1/users/me', requireAuth, asyncHandler(async (req, res) => {
  const { displayName, email } = req.body ?? {};
  if (displayName !== undefined && (typeof displayName !== 'string' || displayName.trim().length < 2 || displayName.trim().length > 80)) {
    throw new ApiError(400, 'Name must contain 2–80 characters');
  }
  if (email !== undefined && email !== null && (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    throw new ApiError(400, 'Email address is invalid');
  }
  const { rows } = await pool.query(
    `UPDATE users SET display_name=COALESCE($2,display_name),email=CASE WHEN $3::boolean THEN $4 ELSE email END,updated_at=now()
      WHERE id=$1 AND account_status='active'
      RETURNING id,phone_e164,display_name,email,roles,is_verified,created_at`,
    [req.userId, displayName?.trim() ?? null, email !== undefined, email === null ? null : email?.toLowerCase()],
  );
  if (!rows[0]) throw new ApiError(404, 'user unavailable');
  res.json({ data: rows[0] });
}));

app.post('/api/v1/users/me/roles', requireAuth, asyncHandler(async (req, res) => {
  const role = req.body?.role;
  if (role !== 'passenger' && role !== 'driver') throw new ApiError(400, 'Only passenger and driver roles can be self-enabled');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('INSERT INTO user_roles(user_id,role) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.userId, role]);
    const { rows } = await client.query(
      `UPDATE users SET roles=(SELECT ARRAY(SELECT DISTINCT unnest(roles || ARRAY[$2]::text[]) ORDER BY 1)),updated_at=now()
        WHERE id=$1 AND account_status='active' RETURNING id,roles`, [req.userId, role],
    );
    if (!rows[0]) throw new ApiError(404, 'user unavailable');
    await client.query('INSERT INTO audit_events(actor_id,action,entity_type,entity_id) VALUES ($1,$2,$3,$1)', [req.userId, 'role.enabled', 'user']);
    await client.query('COMMIT');
    res.json({ data: rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

app.get('/api/v1/users/me/export', requireAuth, asyncHandler(async (req, res) => {
  const [profile, vehicles, bookings, demands] = await Promise.all([
    pool.query('SELECT id,phone_e164,display_name,email,roles,is_verified,created_at FROM users WHERE id=$1', [req.userId]),
    pool.query('SELECT id,make,model,model_year,seat_count,verification_status,created_at FROM vehicles WHERE owner_id=$1', [req.userId]),
    pool.query(
      `SELECT b.id,b.offer_id,b.seat_count,b.total_price_minor,b.currency,b.status,b.created_at
         FROM bookings b JOIN offers o ON o.id=b.offer_id WHERE b.passenger_id=$1 OR o.driver_id=$1`, [req.userId],
    ),
    pool.query('SELECT id,origin_name,destination_name,earliest_departure,latest_departure,passenger_count,budget_minor,status,created_at FROM passenger_demands WHERE passenger_id=$1', [req.userId]),
  ]);
  if (!profile.rows[0]) throw new ApiError(404, 'user unavailable');
  res.json({ data: { profile: profile.rows[0], vehicles: vehicles.rows, bookings: bookings.rows, demands: demands.rows } });
}));

app.post('/api/v1/users/me/deletion-requests', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `INSERT INTO account_deletion_requests(user_id) VALUES ($1)
     ON CONFLICT (user_id) WHERE status='pending' DO NOTHING
     RETURNING id,status,requested_at`, [req.userId],
  );
  if (!rows[0]) throw new ApiError(409, 'An account deletion request is already pending');
  res.status(202).json({ data: rows[0] });
}));

// Return only published, future inventory from the database. This route has no seed-data fallback.
app.get('/api/v1/offers', asyncHandler(async (req, res) => {
  const origin = String(req.query.origin || '').trim();
  const destination = String(req.query.destination || '').trim();
  const date = req.query.date === undefined ? null : String(req.query.date);
  const seats = req.query.seats === undefined ? 1 : Number(req.query.seats);
  if (!origin || !destination || origin.length > 120 || destination.length > 120) {
    throw new ApiError(400, 'origin and destination are required');
  }
  if (!Number.isInteger(seats) || seats < 1 || seats > 20 || (date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(date))) {
    throw new ApiError(400, 'invalid date or passenger count');
  }
  const { rows } = await pool.query(
    `SELECT o.id, o.origin_name, o.destination_name, o.departure_at, o.arrival_at,o.distance_m,o.duration_s,o.route_source,o.price_per_seat_minor,
            o.currency, o.available_seats, o.total_seats, u.display_name AS driver_name
       FROM offers o JOIN users u ON u.id = o.driver_id
      WHERE o.status = 'published' AND o.departure_at > now() AND o.available_seats > 0
        AND o.available_seats >= $4
        AND lower(o.origin_name) = lower($1) AND lower(o.destination_name) = lower($2)
        AND ($3::date IS NULL OR (o.departure_at AT TIME ZONE 'Europe/Kyiv')::date=$3::date)
      ORDER BY o.departure_at ASC LIMIT 100`,
    [origin, destination, date, seats],
  );
  res.json({ data: rows });
}));

app.get('/api/v1/vehicles', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, make, model, model_year, seat_count, verification_status, is_active, created_at
       FROM vehicles WHERE owner_id = $1 AND archived_at IS NULL ORDER BY is_active DESC,created_at DESC`, [req.userId],
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
  const client = await pool.connect();
  let rows;
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [req.userId]);
    const active = await client.query('SELECT 1 FROM vehicles WHERE owner_id=$1 AND is_active AND archived_at IS NULL', [req.userId]);
    ({ rows } = await client.query(
      `INSERT INTO vehicles(owner_id,make,model,model_year,seat_count,is_active)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id,make,model,model_year,seat_count,verification_status,is_active,created_at`,
      [req.userId, make.trim(), model.trim(), modelYear, seats, active.rowCount === 0],
    ));
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  await pool.query('INSERT INTO audit_events(actor_id,action,entity_type,entity_id) VALUES ($1,$2,$3,$4)', [req.userId, 'vehicle.created', 'vehicle', rows[0].id]);
  res.status(201).json({ data: rows[0] });
}));

app.patch('/api/v1/vehicles/:id', requireAuth, requireRole('driver'), asyncHandler(async (req, res) => {
  const { make, model, modelYear, seats } = req.body ?? {};
  if ((make !== undefined && (typeof make !== 'string' || make.trim().length < 1 || make.trim().length > 80)) ||
      (model !== undefined && (typeof model !== 'string' || model.trim().length < 1 || model.trim().length > 100)) ||
      (modelYear !== undefined && (!Number.isInteger(modelYear) || modelYear < 1950 || modelYear > new Date().getUTCFullYear() + 1)) ||
      (seats !== undefined && (!Number.isInteger(seats) || seats < 1 || seats > 20))) {
    throw new ApiError(400, 'invalid vehicle fields');
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const owned = await client.query('SELECT id FROM vehicles WHERE id=$1 AND owner_id=$2 AND archived_at IS NULL FOR UPDATE', [req.params.id, req.userId]);
    if (!owned.rows[0]) throw new ApiError(404, 'vehicle unavailable');
    if (seats !== undefined) {
      const incompatible = await client.query(
        "SELECT 1 FROM offers WHERE vehicle_id=$1 AND departure_at>now() AND status='published' AND total_seats>$2 LIMIT 1", [req.params.id, seats],
      );
      if (incompatible.rows[0]) throw new ApiError(409, 'Vehicle capacity cannot be reduced below an upcoming published trip', 'vehicle_capacity_in_use');
    }
    const { rows } = await client.query(
      `UPDATE vehicles SET make=COALESCE($3,make),model=COALESCE($4,model),model_year=COALESCE($5,model_year),seat_count=COALESCE($6,seat_count)
        WHERE id=$1 AND owner_id=$2 AND archived_at IS NULL
        RETURNING id,make,model,model_year,seat_count,verification_status,is_active,created_at`,
      [req.params.id, req.userId, make?.trim() ?? null, model?.trim() ?? null, modelYear ?? null, seats ?? null],
    );
    await client.query('INSERT INTO audit_events(actor_id,action,entity_type,entity_id) VALUES ($1,$2,$3,$4)', [req.userId, 'vehicle.updated', 'vehicle', req.params.id]);
    await client.query('COMMIT');
    res.json({ data: rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

app.post('/api/v1/vehicles/:id/activate', requireAuth, requireRole('driver'), asyncHandler(async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [req.userId]);
    const target = await client.query('SELECT id FROM vehicles WHERE id=$1 AND owner_id=$2 AND archived_at IS NULL FOR UPDATE', [req.params.id, req.userId]);
    if (!target.rows[0]) throw new ApiError(404, 'vehicle unavailable');
    await client.query('UPDATE vehicles SET is_active=false WHERE owner_id=$1 AND is_active', [req.userId]);
    const { rows } = await client.query(
      `UPDATE vehicles SET is_active=true WHERE id=$1 AND owner_id=$2
       RETURNING id,make,model,model_year,seat_count,verification_status,is_active,created_at`, [req.params.id, req.userId],
    );
    await client.query('INSERT INTO audit_events(actor_id,action,entity_type,entity_id) VALUES ($1,$2,$3,$4)', [req.userId, 'vehicle.activated', 'vehicle', req.params.id]);
    await client.query('COMMIT');
    res.json({ data: rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

app.delete('/api/v1/vehicles/:id', requireAuth, requireRole('driver'), asyncHandler(async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const vehicle = await client.query('SELECT id FROM vehicles WHERE id=$1 AND owner_id=$2 AND archived_at IS NULL FOR UPDATE', [req.params.id, req.userId]);
    if (!vehicle.rows[0]) throw new ApiError(404, 'vehicle unavailable');
    const activeTrips = await client.query(
      `SELECT 1 FROM offers o WHERE o.vehicle_id=$1 AND o.departure_at>now() AND o.status='published' LIMIT 1`, [req.params.id],
    );
    if (activeTrips.rows[0]) throw new ApiError(409, 'Vehicle has upcoming trips and cannot be archived', 'vehicle_has_upcoming_trips');
    await client.query('UPDATE vehicles SET is_active=false,archived_at=now() WHERE id=$1', [req.params.id]);
    await client.query('INSERT INTO audit_events(actor_id,action,entity_type,entity_id) VALUES ($1,$2,$3,$4)', [req.userId, 'vehicle.archived', 'vehicle', req.params.id]);
    await client.query('COMMIT');
    res.json({ data: { id: req.params.id, archived: true } });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

app.post('/api/v1/vehicles/:id/photos/upload-url', requireAuth, requireRole('driver'), asyncHandler(async (req, res) => {
  const contentType = req.body?.contentType;
  if (!isAllowedPhotoType(contentType)) throw new ApiError(400, 'Only JPEG, PNG, and WebP vehicle photos are allowed');
  const { rows } = await pool.query('SELECT 1 FROM vehicles WHERE id=$1 AND owner_id=$2 AND archived_at IS NULL', [req.params.id, req.userId]);
  if (!rows[0]) throw new ApiError(404, 'vehicle unavailable');
  const key = `vehicle-photos/${req.userId}/${req.params.id}/${crypto.randomUUID()}`;
  try {
    const upload = await createVehiclePhotoUpload(key, contentType);
    res.json({ data: { key, ...upload } });
  } catch (error) {
    if (error instanceof ObjectStorageUnavailableError || (error instanceof Error && error.name === 'CredentialsProviderError')) {
      throw new ApiError(503, 'Vehicle photo storage is not configured', 'object_storage_unavailable');
    }
    throw error;
  }
}));

app.post('/api/v1/vehicles/:id/photos', requireAuth, requireRole('driver'), asyncHandler(async (req, res) => {
  const key = req.body?.key;
  const contentType = req.body?.contentType;
  const prefix = `vehicle-photos/${req.userId}/${req.params.id}/`;
  if (typeof key !== 'string' || !key.startsWith(prefix) || !/^[0-9a-f-]{36}$/i.test(key.slice(prefix.length)) || !isAllowedPhotoType(contentType)) {
    throw new ApiError(400, 'invalid vehicle photo reference');
  }
  const { rows: vehicle } = await pool.query('SELECT 1 FROM vehicles WHERE id=$1 AND owner_id=$2 AND archived_at IS NULL', [req.params.id, req.userId]);
  if (!vehicle[0]) throw new ApiError(404, 'vehicle unavailable');
  let valid: boolean;
  let photoUrl: string;
  try {
    valid = await verifyVehiclePhotoObject(key, contentType);
    if (!valid) {
      await deleteStoredVehiclePhoto(key).catch(() => undefined);
      throw new ApiError(400, 'Uploaded file does not match the required image type or size', 'invalid_vehicle_photo');
    }
    photoUrl = await getVehiclePhotoUrl(key);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof ObjectStorageUnavailableError || (error instanceof Error && error.name === 'CredentialsProviderError')) {
      throw new ApiError(503, 'Vehicle photo storage is not configured', 'object_storage_unavailable');
    }
    throw new ApiError(503, 'Uploaded photo could not be verified', 'vehicle_photo_verification_failed');
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT id FROM vehicles WHERE id=$1 AND owner_id=$2 FOR UPDATE', [req.params.id, req.userId]);
    const existing = await client.query('SELECT 1 FROM vehicle_photos WHERE vehicle_id=$1 LIMIT 1', [req.params.id]);
    const { rows } = await client.query(
      'INSERT INTO vehicle_photos(vehicle_id,object_key,is_primary) VALUES ($1,$2,$3) RETURNING id,vehicle_id,is_primary,created_at',
      [req.params.id, key, existing.rowCount === 0],
    );
    await client.query('INSERT INTO audit_events(actor_id,action,entity_type,entity_id) VALUES ($1,$2,$3,$4)', [req.userId, 'vehicle.photo.added', 'vehicle', req.params.id]);
    await client.query('COMMIT');
    res.status(201).json({ data: { ...rows[0], url: photoUrl } });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

app.get('/api/v1/vehicles/:id/photos', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT p.id,p.is_primary,p.created_at,p.object_key FROM vehicle_photos p JOIN vehicles v ON v.id=p.vehicle_id
      WHERE p.vehicle_id=$1 AND v.owner_id=$2 AND v.archived_at IS NULL ORDER BY p.is_primary DESC,p.created_at`, [req.params.id, req.userId],
  );
  if (!rows.length) {
    const owned = await pool.query('SELECT 1 FROM vehicles WHERE id=$1 AND owner_id=$2 AND archived_at IS NULL', [req.params.id, req.userId]);
    if (!owned.rows[0]) throw new ApiError(404, 'vehicle unavailable');
    res.json({ data: [] });
    return;
  }
  try {
    res.json({ data: await Promise.all(rows.map(async ({ object_key, ...photo }) => ({ ...photo, url: await getVehiclePhotoUrl(object_key) }))) });
  } catch (error) {
    if (error instanceof ObjectStorageUnavailableError || (error instanceof Error && error.name === 'CredentialsProviderError')) {
      throw new ApiError(503, 'Vehicle photo storage is not configured', 'object_storage_unavailable');
    }
    throw error;
  }
}));

app.patch('/api/v1/vehicles/:id/photos/:photoId/primary', requireAuth, requireRole('driver'), asyncHandler(async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const photo = await client.query(
      `SELECT p.id FROM vehicle_photos p JOIN vehicles v ON v.id=p.vehicle_id
        WHERE p.id=$1 AND p.vehicle_id=$2 AND v.owner_id=$3 AND v.archived_at IS NULL FOR UPDATE OF v,p`, [req.params.photoId, req.params.id, req.userId],
    );
    if (!photo.rows[0]) throw new ApiError(404, 'vehicle photo unavailable');
    await client.query('UPDATE vehicle_photos SET is_primary=false WHERE vehicle_id=$1', [req.params.id]);
    const { rows } = await client.query(
      'UPDATE vehicle_photos SET is_primary=true WHERE id=$1 RETURNING id,vehicle_id,is_primary,created_at', [req.params.photoId],
    );
    await client.query('INSERT INTO audit_events(actor_id,action,entity_type,entity_id) VALUES ($1,$2,$3,$4)', [req.userId, 'vehicle.photo.primary_changed', 'vehicle', req.params.id]);
    await client.query('COMMIT');
    res.json({ data: rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

app.delete('/api/v1/vehicles/:id/photos/:photoId', requireAuth, requireRole('driver'), asyncHandler(async (req, res) => {
  const found = await pool.query<{ object_key: string; is_primary: boolean }>(
    `SELECT p.object_key,p.is_primary FROM vehicle_photos p JOIN vehicles v ON v.id=p.vehicle_id
      WHERE p.id=$1 AND p.vehicle_id=$2 AND v.owner_id=$3 AND v.archived_at IS NULL`, [req.params.photoId, req.params.id, req.userId],
  );
  if (!found.rows[0]) throw new ApiError(404, 'vehicle photo unavailable');
  try { await deleteStoredVehiclePhoto(found.rows[0].object_key); }
  catch (error) {
    if (error instanceof ObjectStorageUnavailableError || (error instanceof Error && error.name === 'CredentialsProviderError')) {
      throw new ApiError(503, 'Vehicle photo storage is not configured', 'object_storage_unavailable');
    }
    throw new ApiError(503, 'Vehicle photo could not be deleted', 'vehicle_photo_delete_failed');
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT id FROM vehicles WHERE id=$1 AND owner_id=$2 FOR UPDATE', [req.params.id, req.userId]);
    const removed = await client.query(
      'DELETE FROM vehicle_photos WHERE id=$1 AND vehicle_id=$2 RETURNING is_primary', [req.params.photoId, req.params.id],
    );
    if (!removed.rows[0]) throw new ApiError(404, 'vehicle photo unavailable');
    if (removed.rows[0].is_primary) {
      await client.query(
        'UPDATE vehicle_photos SET is_primary=true WHERE id=(SELECT id FROM vehicle_photos WHERE vehicle_id=$1 ORDER BY created_at,id LIMIT 1)', [req.params.id],
      );
    }
    await client.query('INSERT INTO audit_events(actor_id,action,entity_type,entity_id) VALUES ($1,$2,$3,$4)', [req.userId, 'vehicle.photo.deleted', 'vehicle', req.params.id]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  res.json({ data: { id: req.params.photoId, deleted: true } });
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
      !Number.isInteger(pricePerSeatMinor) || pricePerSeatMinor < 1 || pricePerSeatMinor > 100_000_000 ||
      !Number.isInteger(seats) || seats < 1 || seats > 20) {
    throw new ApiError(400, 'invalid offer fields');
  }
  let roadRoute: Awaited<ReturnType<typeof getRoadRoute>> | undefined;
  if (process.env.NODE_ENV === 'production' || process.env.ROUTING_ENGINE_URL) {
    try { roadRoute = await getRoadRoute(origin as [number, number], destination as [number, number]); }
    catch (error) {
      if (error instanceof RoutingUnavailableError) throw new ApiError(503, error.message, 'routing_unavailable');
      throw error;
    }
  }
  const arrivalAt = roadRoute ? new Date(departure.getTime() + roadRoute.durationSeconds * 1000) : null;
  const routeGeoJson = roadRoute ? JSON.stringify({ type: 'LineString', coordinates: roadRoute.geometry }) : null;
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
      `INSERT INTO offers(driver_id,vehicle_id,origin_name,destination_name,origin,destination,route,departure_at,arrival_at,distance_m,duration_s,route_source,price_per_seat_minor,total_seats,available_seats)
       VALUES ($1,$2,$3,$4,ST_SetSRID(ST_MakePoint($5,$6),4326)::geography,ST_SetSRID(ST_MakePoint($7,$8),4326)::geography,
         CASE WHEN $9::text IS NULL THEN NULL ELSE ST_SetSRID(ST_GeomFromGeoJSON($9),4326) END,$10,$11,$12,$13,$14,$15,$16,$16)
       RETURNING id,origin_name,destination_name,departure_at,arrival_at,distance_m,duration_s,route_source,price_per_seat_minor,currency,total_seats,available_seats,status`,
      [req.userId, vehicleId, originName.trim(), destinationName.trim(), origin[0], origin[1], destination[0], destination[1], routeGeoJson,
        departure.toISOString(), arrivalAt?.toISOString() ?? null, roadRoute ? Math.round(roadRoute.distanceMeters) : null,
        roadRoute ? Math.round(roadRoute.durationSeconds) : null, roadRoute ? 'osrm' : (process.env.NODE_ENV === 'production' ? null : 'development_unrouted'), pricePerSeatMinor, seats],
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

app.use((req, res) => res.status(404).json({ error: { code: 'not_found', message: 'Route not found', requestId: res.locals.requestId } }));
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof ApiError) return res.status(error.status).json({ error: { code: error.code, message: error.message, requestId: res.locals.requestId } });
  const message = error instanceof Error ? error.message : 'unknown_error';
  console.error(JSON.stringify({ level: 'error', requestId: res.locals.requestId, message }));
  return res.status(500).json({ error: { code: 'internal_error', message: 'An unexpected error occurred', requestId: res.locals.requestId } });
});

const server = app.listen(port, host, () => console.log(JSON.stringify({ level: 'info', event: 'api.started', host, port })));
async function shutdown() {
  server.close(() => { void pool.end().finally(() => process.exit(0)); });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
