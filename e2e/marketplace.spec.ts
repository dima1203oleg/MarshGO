import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { Pool } from 'pg';

const databaseUrl = process.env.E2E_DATABASE_URL;
if (!databaseUrl) throw new Error('E2E_DATABASE_URL must point to the isolated local PostGIS test database');
const database = new URL(databaseUrl);
if (!['127.0.0.1', 'localhost', '::1'].includes(database.hostname)) {
  throw new Error('Browser E2E tests are restricted to a loopback database');
}

const pool = new Pool({ connectionString: databaseUrl });
const driverId = randomUUID();
const vehicleId = randomUUID();
const offerId = randomUUID();
const driverPhone = `+38050${String(Date.now()).slice(-7)}`;
const passengerPhone = `+38067${String(Date.now() + 1).slice(-7)}`;

function tomorrowInKyiv() {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv' }).format(new Date());
  const [year, month, day] = today.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
}

async function signIn(page: import('@playwright/test').Page, name: string, phone: string): Promise<string> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Почати', exact: true }).first().click();
  await page.getByPlaceholder('Ваше ім’я').fill(name);
  await page.getByPlaceholder('+380 номер телефону').fill(phone);
  await page.getByRole('button', { name: 'Почати', exact: true }).click();
  const otpNotice = page.getByText(/Тестовий OTP локального середовища:/);
  await expect(otpNotice).toBeVisible();
  const code = (await otpNotice.innerText()).match(/\b\d{6}\b/)?.[0];
  expect(code, 'development OTP should be visible only in this isolated local E2E environment').toMatch(/^\d{6}$/);
  await page.locator('input[autocomplete="one-time-code"]').fill(code!);
  const [authResponse] = await Promise.all([
    page.waitForResponse(response => response.url().endsWith('/api/v1/auth/otp/verify')),
    page.getByRole('button', { name: 'Підтвердити номер' }).click(),
  ]);
  await expect(page.getByText(`Привіт, ${name.split(' ')[0]}!`)).toBeVisible();
  expect(Boolean((await authResponse.allHeaders())['set-cookie']), 'OTP verification should issue a refresh cookie').toBe(true);
  return (await authResponse.json()).data.accessToken as string;
}

test.beforeAll(async () => {
  await pool.query(`
    INSERT INTO users(id,phone_e164,display_name,roles,is_verified)
    VALUES($1,$2,'MARSHGO E2E Driver',ARRAY['passenger','driver'],true)
  `, [driverId, driverPhone]);
  await pool.query(`INSERT INTO user_roles(user_id,role) VALUES($1,'passenger'),($1,'driver')`, [driverId]);
  await pool.query(`
    INSERT INTO vehicles(id,owner_id,make,model,model_year,seat_count,verification_status,is_active)
    VALUES($1,$2,'E2E','Road Car',2024,4,'verified',true)
  `, [vehicleId, driverId]);
  await pool.query(`
    INSERT INTO offers(id,driver_id,vehicle_id,origin_name,destination_name,origin,destination,route,
      departure_at,arrival_at,distance_m,duration_s,route_source,price_per_seat_minor,total_seats,available_seats)
    VALUES($1,$2,$3,'Стрий, Львівська область, Україна','Львів, Львівська область, Україна',
      ST_SetSRID(ST_MakePoint(23.8561,49.2567),4326)::geography,
      ST_SetSRID(ST_MakePoint(24.0297,49.8397),4326)::geography,
      ST_SetSRID(ST_GeomFromGeoJSON('{"type":"LineString","coordinates":[[23.8561,49.2567],[24.0297,49.8397]]}'),4326),
      (date_trunc('day',now() AT TIME ZONE 'Europe/Kyiv') + interval '1 day' + interval '9 hours') AT TIME ZONE 'Europe/Kyiv',
      (date_trunc('day',now() AT TIME ZONE 'Europe/Kyiv') + interval '1 day' + interval '10 hours 30 minutes') AT TIME ZONE 'Europe/Kyiv',
      78000,5400,'e2e_fixture',15000,4,4)
  `, [offerId, driverId, vehicleId]);
});

test.afterAll(async () => {
  const passenger = await pool.query<{ id: string }>('SELECT id FROM users WHERE phone_e164=$1', [passengerPhone]);
  const userIds = [driverId, ...passenger.rows.map((row) => row.id)];
  const testBookingQuery = `SELECT b.id FROM bookings b JOIN offers o ON o.id=b.offer_id WHERE b.passenger_id=ANY($1::uuid[]) OR o.driver_id=ANY($1::uuid[])`;
  await pool.query('DELETE FROM audit_events WHERE actor_id=ANY($1::uuid[]) OR entity_id=ANY($2::uuid[])', [userIds, [offerId, vehicleId]]);
  await pool.query(`DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE booking_id IN (${testBookingQuery}))`, [userIds]);
  await pool.query(`DELETE FROM conversation_members WHERE conversation_id IN (SELECT id FROM conversations WHERE booking_id IN (${testBookingQuery}))`, [userIds]);
  await pool.query(`DELETE FROM conversations WHERE booking_id IN (${testBookingQuery})`, [userIds]);
  await pool.query(`DELETE FROM booking_events WHERE booking_id IN (${testBookingQuery})`, [userIds]);
  await pool.query(`DELETE FROM bookings WHERE id IN (${testBookingQuery})`, [userIds]);
  await pool.query('DELETE FROM proposals WHERE driver_id=ANY($1::uuid[]) OR demand_id IN (SELECT id FROM passenger_demands WHERE passenger_id=ANY($2::uuid[]))', [userIds, userIds]);
  await pool.query('DELETE FROM passenger_demands WHERE passenger_id=ANY($1::uuid[])', [userIds]);
  await pool.query('DELETE FROM offers WHERE id=$1 OR driver_id=ANY($2::uuid[])', [offerId, userIds]);
  await pool.query('DELETE FROM otp_challenges WHERE phone_e164=ANY($1::text[])', [[driverPhone, passengerPhone]]);
  await pool.query('DELETE FROM sessions WHERE user_id=ANY($1::uuid[])', [userIds]);
  await pool.query('DELETE FROM vehicles WHERE id=$1', [vehicleId]);
  await pool.query('DELETE FROM users WHERE id=ANY($1::uuid[])', [userIds]);
  await pool.end();
});

test('two independent accounts search, book, negotiate a demand, and exchange persisted chat messages', async ({ browser, baseURL }) => {
  expect(baseURL).toBeTruthy();
  const passengerContext = await browser.newContext();
  const driverContext = await browser.newContext();
  const passengerPage = await passengerContext.newPage();
  const driverPage = await driverContext.newPage();

  try {
    const passengerAccessToken = await signIn(passengerPage, 'E2E Passenger', passengerPhone);
    const profileBeforeRoleSwitch = await passengerPage.evaluate(async token => fetch('/api/v1/users/me', { headers: { Authorization: `Bearer ${token}` } }).then(async response => ({ status: response.status, body: await response.json() })), passengerAccessToken);
    expect(profileBeforeRoleSwitch.status).toBe(200);
    const userIdBeforeRoleSwitch = profileBeforeRoleSwitch.body.data.id;
    const enabledDriverRole = await passengerPage.evaluate(async token => fetch('/api/v1/users/me/roles', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ role: 'driver' }) }).then(response => response.status), passengerAccessToken);
    expect(enabledDriverRole).toBe(200);
    const profileAfterRoleSwitch = await passengerPage.evaluate(async token => fetch('/api/v1/users/me', { headers: { Authorization: `Bearer ${token}` } }).then(response => response.json()), passengerAccessToken);
    const switchedProfile = profileAfterRoleSwitch.data;
    expect(switchedProfile.id).toBe(userIdBeforeRoleSwitch);
    expect(switchedProfile.roles).toEqual(expect.arrayContaining(['passenger', 'driver']));
    const crossAccountVehicleEdit = await passengerPage.evaluate(async ({ token, targetVehicleId }) => fetch(`/api/v1/vehicles/${targetVehicleId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ make: 'Unauthorized edit' }) }).then(response => response.status), { token: passengerAccessToken, targetVehicleId: vehicleId });
    expect(crossAccountVehicleEdit).toBe(404);

    await test.info().attach('marshgo-iphone-home', {
      body: await passengerPage.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
    if (process.env.E2E_SCREENSHOT_PATH) {
      await passengerPage.screenshot({ path: process.env.E2E_SCREENSHOT_PATH, fullPage: true });
    }
    await passengerPage.getByPlaceholder('Місто відправлення').fill('Стрий');
    await passengerPage.getByRole('button', { name: 'Знайти', exact: true }).nth(0).click();
    await passengerPage.getByRole('button', { name: /Стрий, Львівська область, Україна/ }).click();
    await passengerPage.getByPlaceholder('Місто призначення').fill('Львів');
    await passengerPage.getByRole('button', { name: 'Знайти', exact: true }).nth(1).click();
    await passengerPage.getByRole('button', { name: /Львів, Львівська область, Україна/ }).click();
    await passengerPage.locator('input[type="date"]').fill(tomorrowInKyiv());
    await passengerPage.getByRole('button', { name: 'Більше пасажирів' }).click();
    await passengerPage.getByRole('button', { name: /Знайти маршрут/ }).click();

    const resultCard = passengerPage.getByRole('button').filter({ hasText: 'MARSHGO E2E Driver' }).first();
    await expect(resultCard).toContainText('150');
    await resultCard.click();
    await expect(passengerPage.getByRole('heading', { name: /Стрий.*Львів/ })).toBeVisible();
    await passengerPage.getByRole('button', { name: /Забронювати місце/ }).click();
    await expect(passengerPage.getByRole('heading', { name: 'Мої поїздки' })).toBeVisible();
    await expect(passengerPage.getByText(/2 місця/).first()).toBeVisible();

    const booking = await pool.query<{ seat_count: number; total_price_minor: number; status: string }>(
      'SELECT b.seat_count,b.total_price_minor,b.status FROM bookings b WHERE b.offer_id=$1 AND b.passenger_id=(SELECT id FROM users WHERE phone_e164=$2)',
      [offerId, passengerPhone],
    );
    expect(booking.rows).toHaveLength(1);
    expect(booking.rows[0]).toMatchObject({ seat_count: 2, total_price_minor: 30000, status: 'confirmed' });
    const inventory = await pool.query<{ available_seats: number }>('SELECT available_seats FROM offers WHERE id=$1', [offerId]);
    expect(inventory.rows[0].available_seats).toBe(2);

    await passengerPage.getByRole('button', { name: /Написати/ }).click();
    await passengerPage.getByPlaceholder('Напишіть повідомлення…').fill('Буду на місці о 08:45.');
    await passengerPage.getByPlaceholder('Напишіть повідомлення…').press('Enter');
    await expect(passengerPage.getByText('Буду на місці о 08:45.')).toBeVisible();
    expect((await passengerContext.cookies()).some((cookie) => cookie.name === 'mg_refresh')).toBe(true);
    expect((await passengerContext.cookies('http://127.0.0.1:3300/api/v1/auth/refresh')).some((cookie) => cookie.name === 'mg_refresh')).toBe(true);
    const refreshResponse = passengerPage.waitForResponse((response) => response.url().endsWith('/api/v1/auth/refresh'));
    await passengerPage.reload();
    expect((await refreshResponse).status(), 'refresh should restore the session after a page reload').toBe(200);
    await expect(passengerPage.getByText('Привіт, E2E!')).toBeVisible();
    await passengerPage.getByRole('button', { name: 'Поїздки', exact: true }).click();
    await expect(passengerPage.getByText(/2 місця/).first()).toBeVisible();
    await passengerPage.getByRole('button', { name: /Написати/ }).click();
    await expect(passengerPage.getByText('Буду на місці о 08:45.')).toBeVisible();

    await passengerPage.getByRole('button', { name: 'Створити' }).click();
    await passengerPage.getByRole('button', { name: /Шукаю поїздку/ }).click();
    const demandPlaceInputs = passengerPage.getByPlaceholder('Пошук адреси або міста');
    await demandPlaceInputs.nth(0).fill('Стрий');
    await passengerPage.getByRole('button', { name: 'Знайти', exact: true }).nth(0).click();
    await passengerPage.getByRole('button', { name: /Стрий, Львівська область, Україна/ }).click();
    await demandPlaceInputs.nth(1).fill('Львів');
    await passengerPage.getByRole('button', { name: 'Знайти', exact: true }).nth(1).click();
    await passengerPage.getByRole('button', { name: /Львів, Львівська область, Україна/ }).click();
    const demandTimes = passengerPage.locator('input[type="datetime-local"]');
    await demandTimes.nth(0).fill(`${tomorrowInKyiv()}T08:00`);
    await demandTimes.nth(1).fill(`${tomorrowInKyiv()}T10:00`);
    await passengerPage.getByLabel('Пасажири').selectOption('2');
    await passengerPage.getByLabel('Бюджет, грн').fill('300');
    await passengerPage.getByRole('button', { name: 'Опублікувати заявку' }).click();
    await expect(passengerPage.getByRole('heading', { name: 'Пропозиції водіїв' })).toBeVisible();

    await signIn(driverPage, 'MARSHGO Driver', driverPhone);
    await driverPage.getByRole('button', { name: 'Поїздки', exact: true }).click();
    await expect(driverPage.getByText(/2\/4 місць/)).toBeVisible();
    await expect(driverPage.getByText(/2 місця/).first()).toBeVisible();
    await driverPage.getByRole('button', { name: /Написати/ }).click();
    await expect(driverPage.getByText('Буду на місці о 08:45.')).toBeVisible();

    await passengerPage.getByRole('button', { name: 'Поїздки', exact: true }).click();
    await passengerPage.getByRole('button', { name: /Написати/ }).click();
    await expect(passengerPage.getByText(/онлайн/)).toBeVisible();
    const realtimeMessage = 'Чекаю біля центрального входу.';
    const passengerChatInput = passengerPage.getByPlaceholder('Напишіть повідомлення…');
    await passengerChatInput.fill(realtimeMessage);
    await passengerChatInput.press('Enter');
    await expect(driverPage.getByText(realtimeMessage)).toBeVisible({ timeout: 10_000 });

    await driverPage.getByRole('button', { name: 'Створити' }).click();
    await driverPage.getByRole('button', { name: /Знайти пасажира/ }).click();
    const openDemand = driverPage.locator('article').filter({ hasText: /Стрий → Львів/ }).first();
    await openDemand.getByRole('button', { name: /Запропонувати ціну/ }).click();
    await driverPage.getByLabel('Перевірене авто').selectOption(vehicleId);
    await driverPage.getByLabel('Ціна, грн').fill('350');
    await driverPage.getByRole('button', { name: 'Надіслати пропозицію' }).click();
    await expect(driverPage.getByText('350 грн')).toBeVisible();

    await passengerPage.getByRole('button', { name: 'Створити' }).click();
    await passengerPage.getByRole('button', { name: /Шукаю поїздку/ }).click();
    await passengerPage.getByRole('button', { name: 'Мої заявки' }).click();
    await passengerPage.getByRole('button').filter({ hasText: /Стрий → Львів/ }).first().click();
    await passengerPage.getByRole('button', { name: 'Змінити ціну або час' }).click();
    await passengerPage.getByLabel('Загальна сума, грн').fill('320');
    await passengerPage.getByRole('button', { name: 'Надіслати зустрічну' }).click();
    await expect(passengerPage.getByText('320 грн')).toBeVisible();

    await driverPage.reload();
    await expect(driverPage.getByText('Привіт, MARSHGO!')).toBeVisible();
    await driverPage.getByRole('button', { name: 'Створити' }).click();
    await driverPage.getByRole('button', { name: /Знайти пасажира/ }).click();
    await driverPage.getByRole('button').filter({ hasText: /Стрий → Львів/ }).first().click();
    await driverPage.getByRole('button', { name: 'Погодити зустрічну ціну' }).click();

    await passengerPage.reload();
    await expect(passengerPage.getByText('Привіт, E2E!')).toBeVisible();
    await passengerPage.getByRole('button', { name: 'Створити' }).click();
    await passengerPage.getByRole('button', { name: /Шукаю поїздку/ }).click();
    await passengerPage.getByRole('button', { name: 'Мої заявки' }).click();
    await passengerPage.getByRole('button').filter({ hasText: /Стрий → Львів/ }).first().click();
    await passengerPage.getByRole('button', { name: 'Підтвердити домовленість і бронювання' }).click();
    await expect(passengerPage.getByRole('heading', { name: 'Мої поїздки' })).toBeVisible();
    const negotiatedBooking = await pool.query<{ seat_count: number; total_price_minor: number; status: string }>(
      `SELECT seat_count,total_price_minor,status FROM bookings WHERE passenger_id=(SELECT id FROM users WHERE phone_e164=$1) AND idempotency_key LIKE 'proposal-accept:%'`,
      [passengerPhone],
    );
    expect(negotiatedBooking.rows).toEqual([{ seat_count: 2, total_price_minor: 32000, status: 'confirmed' }]);

    await driverPage.reload();
    await expect(driverPage.getByText('Привіт, MARSHGO!')).toBeVisible();
    await driverPage.getByRole('button', { name: 'Поїздки', exact: true }).click();
    await expect(driverPage.getByText('320 грн')).toBeVisible();
    await driverPage.getByRole('button', { name: /Написати/ }).last().click();
    await expect(driverPage.getByText(realtimeMessage)).toBeVisible();

    const messages = await pool.query<{ body: string }>(
      `SELECT m.body FROM messages m JOIN conversations c ON c.id=m.conversation_id
       JOIN bookings b ON b.id=c.booking_id WHERE b.offer_id=$1 ORDER BY m.created_at`, [offerId],
    );
    expect(messages.rows.map((row) => row.body)).toEqual(['Буду на місці о 08:45.', realtimeMessage]);
  } finally {
    await passengerContext.close();
    await driverContext.close();
  }
});
