import { randomUUID } from 'node:crypto';
import { devices, expect, test } from '@playwright/test';
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
const rescueAlternativeId = randomUUID();
const driverPhone = `+38050${String(Date.now()).slice(-7)}`;
const passengerPhone = `+38067${String(Date.now() + 1).slice(-7)}`;
const navigationPhone = `+38063${String(Date.now() + 2).slice(-7)}`;
const navigationSecondPhone = `+38066${String(Date.now() + 3).slice(-7)}`;
const navigationPassengerPhone = `+38068${String(Date.now() + 4).slice(-7)}`;
const navigationFlowDriverPhone = `+38069${String(Date.now() + 5).slice(-7)}`;
const journeyPassengerPhone = `+38070${String(Date.now() + 6).slice(-7)}`;
const navigationFlowVehicleId = randomUUID();
let navigationFlowDemandId = '';

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
  await pool.query(`
    INSERT INTO offers(id,driver_id,vehicle_id,origin_name,destination_name,origin,destination,route,
      departure_at,arrival_at,distance_m,duration_s,route_source,price_per_seat_minor,total_seats,available_seats)
    VALUES($1,$2,$3,'Rescue E2E Origin','Rescue E2E Destination',
      ST_SetSRID(ST_MakePoint(23.8561,49.2567),4326)::geography,
      ST_SetSRID(ST_MakePoint(24.0297,49.8397),4326)::geography,
      ST_SetSRID(ST_GeomFromGeoJSON('{"type":"LineString","coordinates":[[23.8561,49.2567],[24.0297,49.8397]]}'),4326),
      (date_trunc('day',now() AT TIME ZONE 'Europe/Kyiv') + interval '1 day' + interval '10 hours') AT TIME ZONE 'Europe/Kyiv',
      (date_trunc('day',now() AT TIME ZONE 'Europe/Kyiv') + interval '1 day' + interval '11 hours 30 minutes') AT TIME ZONE 'Europe/Kyiv',
      78000,5400,'e2e_fixture',22000,4,4)
  `, [rescueAlternativeId, driverId, vehicleId]);
});

test.afterAll(async () => {
  const testUsers = await pool.query<{ id: string }>('SELECT id FROM users WHERE phone_e164=ANY($1::text[])', [[passengerPhone, navigationPhone, navigationSecondPhone, navigationPassengerPhone, navigationFlowDriverPhone, journeyPassengerPhone]]);
  const userIds = [driverId, ...testUsers.rows.map((row) => row.id)];
  const testBookingQuery = `SELECT b.id FROM bookings b JOIN offers o ON o.id=b.offer_id WHERE b.passenger_id=ANY($1::uuid[]) OR o.driver_id=ANY($1::uuid[])`;
  await pool.query('DELETE FROM audit_events WHERE actor_id=ANY($1::uuid[]) OR entity_id=ANY($2::uuid[])', [userIds, [offerId, vehicleId]]);
  await pool.query(`DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE booking_id IN (${testBookingQuery}))`, [userIds]);
  await pool.query(`DELETE FROM conversation_members WHERE conversation_id IN (SELECT id FROM conversations WHERE booking_id IN (${testBookingQuery}))`, [userIds]);
  await pool.query(`DELETE FROM conversations WHERE booking_id IN (${testBookingQuery})`, [userIds]);
  await pool.query(`DELETE FROM booking_events WHERE booking_id IN (${testBookingQuery})`, [userIds]);
  await pool.query(`DELETE FROM bookings WHERE id IN (${testBookingQuery})`, [userIds]);
  await pool.query('DELETE FROM proposals WHERE driver_id=ANY($1::uuid[]) OR demand_id IN (SELECT id FROM passenger_demands WHERE passenger_id=ANY($2::uuid[]))', [userIds, userIds]);
  await pool.query('DELETE FROM navigation_sessions WHERE driver_id=ANY($1::uuid[])', [userIds]);
  await pool.query('DELETE FROM passenger_demands WHERE passenger_id=ANY($1::uuid[])', [userIds]);
  await pool.query('DELETE FROM offers WHERE id=$1 OR driver_id=ANY($2::uuid[])', [offerId, userIds]);
  await pool.query('DELETE FROM otp_challenges WHERE phone_e164=ANY($1::text[])', [[driverPhone, passengerPhone, navigationPhone, navigationSecondPhone, navigationPassengerPhone, navigationFlowDriverPhone, journeyPassengerPhone]]);
  await pool.query('DELETE FROM sessions WHERE user_id=ANY($1::uuid[])', [userIds]);
  await pool.query('DELETE FROM vehicles WHERE id=$1 OR owner_id=ANY($2::uuid[])', [vehicleId, userIds]);
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
    let passengerAccessToken = await signIn(passengerPage, 'E2E Passenger', passengerPhone);
    let refreshTokenResponses = Promise.resolve();
    passengerPage.on('response', (response) => {
      if (response.url().endsWith('/api/v1/auth/refresh') && response.ok()) {
        refreshTokenResponses = refreshTokenResponses.then(async () => {
          const body = await response.json() as { data: { accessToken: string } };
          passengerAccessToken = body.data.accessToken;
        });
      }
    });
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
    const bookingResponsePromise = passengerPage.waitForResponse(response => response.url().endsWith('/api/v1/bookings') && response.request().method() === 'POST');
    await passengerPage.getByRole('button', { name: /Забронювати місце/ }).click();
    const createdBookingResponse = await bookingResponsePromise;
    expect(createdBookingResponse.status()).toBe(201);
    const createdBooking = (await createdBookingResponse.json()).data as { id: string; offer_id: string; seat_count: number; total_price_minor: number; status: string; fee_class: string; platform_fee_minor: number; fee_rule_version: string };
    expect(createdBooking).toMatchObject({ offer_id: offerId, seat_count: 2, total_price_minor: 30000, status: 'confirmed', fee_class: 'community', platform_fee_minor: 0, fee_rule_version: 'community-0pct-v1' });
    await expect(passengerPage.getByRole('heading', { name: 'Мої поїздки' })).toBeVisible();
    await expect(passengerPage.getByText(/2 місця/).first()).toBeVisible();

    const booking = await pool.query<{ seat_count: number; total_price_minor: number; status: string }>(
      'SELECT b.seat_count,b.total_price_minor,b.status FROM bookings b WHERE b.id=$1 AND b.passenger_id=(SELECT id FROM users WHERE phone_e164=$2)',
      [createdBooking.id, passengerPhone],
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
    const restoredSession = await refreshResponse;
    expect(restoredSession.status(), 'refresh should restore the session after a page reload').toBe(200);
    await refreshTokenResponses;
    await expect(passengerPage.getByText('Привіт, E2E!')).toBeVisible();
    await passengerPage.getByRole('button', { name: 'Поїздки', exact: true }).click();
    await expect(passengerPage.getByText(/2 місця/).first()).toBeVisible();
    await passengerPage.getByRole('button', { name: 'Відкрити зустріч' }).click();
    await expect(passengerPage.getByText('Очікує часу зустрічі')).toBeVisible();
    await expect(passengerPage.getByText(/Точка посадки · Стрий/)).toBeVisible();
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
    await passengerPage.getByRole('button', { name: 'Поїздки', exact: true }).click();
    const passengerTripCard = passengerPage.locator('article').filter({ hasText: 'MARSHGO E2E Driver' }).first();
    await passengerTripCard.getByRole('button', { name: /Показати квиток для посадки/ }).click();
    const signedTicket = (await passengerTripCard.getByTestId('booking-ticket-token').innerText()).trim();
    expect(signedTicket.length).toBeGreaterThan(40);
    const driverTripCard = driverPage.locator('article').filter({ hasText: 'E2E Passenger' }).first();
    await driverTripCard.getByLabel('Токен квитка пасажира').fill(signedTicket);
    await driverTripCard.getByRole('button', { name: 'Підтвердити посадку' }).click();
    await expect(driverTripCard.getByText('Посадка')).toBeVisible();
    await driverTripCard.getByRole('button', { name: 'Почати поїздку' }).click();
    await expect(passengerTripCard.getByText('У дорозі')).toBeVisible();
    await passengerTripCard.getByRole('button', { name: 'Підтвердити завершення' }).click();
    await expect(passengerTripCard.getByText('Завершення: 1/2 учасники')).toBeVisible();
    await driverPage.bringToFront();
    await expect(driverTripCard.getByText('Завершення: 1/2 учасники')).toBeVisible({ timeout: 12_000 });
    await driverTripCard.getByRole('button', { name: 'Підтвердити завершення' }).click();
    await expect(driverTripCard.getByText('Завершено')).toBeVisible();
    const completedBooking = await pool.query<{ status: string; confirmation_count: number }>(
      `SELECT b.status,(SELECT count(*)::int FROM booking_completion_confirmations cc WHERE cc.booking_id=b.id) AS confirmation_count
         FROM bookings b WHERE b.offer_id=$1 AND b.passenger_id=(SELECT id FROM users WHERE phone_e164=$2)`, [offerId, passengerPhone],
    );
    expect(completedBooking.rows).toEqual([{ status: 'completed', confirmation_count: 2 }]);

    await driverPage.getByRole('button', { name: /Написати/ }).click();
    await expect(driverPage.getByText('Буду на місці о 08:45.')).toBeVisible();

    await passengerPage.getByRole('button', { name: 'Поїздки', exact: true }).click();
    await passengerPage.getByRole('button', { name: /Написати/ }).click();
    await expect(passengerPage.getByText(/онлайн/)).toBeVisible();
    const realtimeMessage = 'Чекаю біля центрального входу.';
    const passengerChatInput = passengerPage.getByPlaceholder('Напишіть повідомлення…');
    await passengerChatInput.fill(realtimeMessage);
    await passengerChatInput.press('Enter');
    await driverPage.bringToFront();
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

    await passengerPage.getByRole('button', { name: 'Поїздки', exact: true }).click();
    await passengerPage.getByRole('button', { name: /Написати/ }).first().click();
    passengerPage.once('dialog', (dialog) => dialog.accept());
    await passengerPage.getByRole('button', { name: 'Заблокувати співрозмовника' }).click();
    await expect(passengerPage.getByRole('status')).toContainText('заблоковано');
    await passengerPage.getByRole('button', { name: 'Профіль', exact: true }).click();
    await expect(passengerPage.getByText('Заблоковані користувачі')).toBeVisible();
    await expect(passengerPage.getByText('MARSHGO E2E Driver', { exact: true })).toBeVisible();

    const deniedMessage = 'Це повідомлення має бути заблоковане.';
    const driverChatInput = driverPage.getByPlaceholder('Напишіть повідомлення…');
    await driverChatInput.fill(deniedMessage);
    await driverChatInput.press('Enter');
    await expect(driverPage.getByRole('status')).toContainText('conversation unavailable');
    const deniedStored = await pool.query<{ count: number }>('SELECT count(*)::int AS count FROM messages WHERE body=$1', [deniedMessage]);
    expect(deniedStored.rows[0].count).toBe(0);

    await passengerPage.getByRole('button', { name: 'Розблокувати', exact: true }).click();
    await expect(passengerPage.getByText('Список порожній. Заблокувати контакт можна з його чату.')).toBeVisible();
    await driverChatInput.press('Enter');
    await expect(driverPage.getByText(deniedMessage)).toBeVisible();
    await passengerPage.getByRole('button', { name: 'Поїздки', exact: true }).click();
    await passengerPage.getByRole('button', { name: /Написати/ }).last().click();
    await expect(passengerPage.getByText(deniedMessage)).toBeVisible();

    await refreshTokenResponses;
    const cancelledBooking = await passengerPage.evaluate(async ({ targetOfferId, accessToken }) => {
      const response = await fetch('/api/v1/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}`, 'Idempotency-Key': `e2e-rescue-${crypto.randomUUID()}` },
        body: JSON.stringify({ offerId: targetOfferId, seats: 1 }),
      });
      return { status: response.status, body: await response.json() };
    }, { targetOfferId: offerId, accessToken: passengerAccessToken });
    expect(cancelledBooking.status).toBe(201);
    await passengerPage.reload();
    await expect(passengerPage.getByText('Привіт, E2E!')).toBeVisible();
    await passengerPage.getByRole('button', { name: 'Поїздки', exact: true }).click();
    const rescueTripCard = passengerPage.locator('article').filter({ hasText: 'MARSHGO E2E Driver' }).first();
    passengerPage.once('dialog', dialog => dialog.accept());
    await rescueTripCard.getByRole('button', { name: 'Скасувати' }).click();
    await expect(rescueTripCard.getByText('Інші поїздки MARSHGO поруч')).toBeVisible();
    const rescueAlternative = rescueTripCard.getByRole('button').filter({ hasText: 'Rescue E2E Origin' }).first();
    await expect(rescueAlternative).toContainText('MARSHGO Community');
    await expect(rescueAlternative).toContainText('220 грн');
    await rescueAlternative.click();
    await expect(passengerPage.getByRole('heading', { name: /Rescue E2E Origin/ })).toBeVisible();
    const rescueBookingResponse = passengerPage.waitForResponse(response =>
      response.url().endsWith('/api/v1/bookings') && response.request().method() === 'POST',
    );
    await passengerPage.getByRole('button', { name: /Забронювати місце/ }).click();
    const bookingResponse = await rescueBookingResponse;
    expect(bookingResponse.status(), await bookingResponse.text()).toBe(201);
    const rescueBooking = await pool.query<{ status: string; total_price_minor: number }>(
      `SELECT b.status,b.total_price_minor FROM bookings b WHERE b.offer_id=$1 AND b.passenger_id=(SELECT id FROM users WHERE phone_e164=$2)`,
      [rescueAlternativeId, passengerPhone],
    );
    expect(rescueBooking.rows).toEqual([{ status: 'confirmed', total_price_minor: 22000 }]);
  } finally {
    await passengerContext.close();
    await driverContext.close();
  }
});

test('two accounts confirm a route match, negotiate, book and refresh the driver road route', async ({ browser, baseURL }) => {
  expect(baseURL).toBeTruthy();
  const driverContext = await browser.newContext({
    ...devices['iPhone 16 Pro Max'], baseURL, timezoneId: 'Europe/Kyiv',
    geolocation: { latitude: 49.2567, longitude: 23.8561, accuracy: 8 }, permissions: ['geolocation'],
  });
  const passengerContext = await browser.newContext({ baseURL, timezoneId: 'Europe/Kyiv' });
  const driverPage = await driverContext.newPage();
  const passengerPage = await passengerContext.newPage();
  let navigationSessionId = '';
  let driverAccessToken = '';
  try {
    driverAccessToken = await signIn(driverPage, 'Navigation Driver', navigationFlowDriverPhone);
    let passengerToken = await signIn(passengerPage, 'Navigation Passenger', navigationPassengerPhone);
    const enableDriverRole = await driverPage.evaluate(async token => fetch('/api/v1/users/me/roles', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ role: 'driver' }),
    }).then(response => response.status), driverAccessToken);
    expect(enableDriverRole).toBe(200);
    const driverProfile = await driverPage.evaluate(async token => fetch('/api/v1/users/me', { headers: { Authorization: `Bearer ${token}` } }).then(response => response.json()), driverAccessToken);
    const passengerProfile = await passengerPage.evaluate(async token => fetch('/api/v1/users/me', { headers: { Authorization: `Bearer ${token}` } }).then(response => response.json()), passengerToken);
    const driverUserId = driverProfile.data.id as string;
    const passengerUserId = passengerProfile.data.id as string;
    expect(driverUserId).not.toBe(passengerUserId);
    await pool.query(`INSERT INTO vehicles(id,owner_id,make,model,model_year,seat_count,verification_status,is_active)
      VALUES($1,$2,'E2E','Navigation car',2024,4,'verified',true)`, [navigationFlowVehicleId, driverUserId]);
    const driverRefresh = driverPage.waitForResponse(response => response.url().endsWith('/api/v1/auth/refresh'));
    await driverPage.reload();
    const refreshedDriverSession = await driverRefresh;
    expect(refreshedDriverSession.status()).toBe(200);
    driverAccessToken = (await refreshedDriverSession.json()).data.accessToken as string;

    await driverPage.getByRole('button', { name: 'Почати навігацію' }).click();
    await driverPage.getByPlaceholder('Наприклад, Львів').fill('Львів');
    await driverPage.getByRole('button', { name: 'Знайти', exact: true }).click();
    await driverPage.getByRole('button', { name: /Львів, Львівська область, Україна/ }).click();
    const createdSession = driverPage.waitForResponse(response => response.url().endsWith('/api/v1/navigation/sessions') && response.request().method() === 'POST');
    await driverPage.getByRole('button', { name: 'Почати навігацію' }).click();
    const sessionResponse = await createdSession;
    expect(sessionResponse.status()).toBe(201);
    navigationSessionId = (await sessionResponse.json()).data.id as string;
    await expect(driverPage.getByRole('switch', { name: 'Пошук попутників уздовж маршруту' })).toBeEnabled();
    await driverPage.getByRole('switch', { name: 'Пошук попутників уздовж маршруту' }).click();
    await expect(driverPage.getByRole('switch', { name: 'Пошук попутників уздовж маршруту' })).toHaveAttribute('aria-checked', 'true');
    await expect.poll(async () => pool.query<{ current_location_at: Date | null }>('SELECT current_location_at FROM navigation_sessions WHERE id=$1', [navigationSessionId]).then(result => result.rows[0]?.current_location_at ?? null)).not.toBeNull();

    const departureStart = new Date(Date.now() + 15 * 60_000);
    const departureEnd = new Date(Date.now() + 4 * 60 * 60_000);
    const demandResponse = await passengerPage.evaluate(async ({ token, earliest, latest }) => fetch('/api/v1/demands', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        originName: 'Дуліб', destinationName: 'Львів', origin: [23.94, 49.53], destination: [24.0, 49.77],
        earliestDeparture: earliest, latestDeparture: latest, passengers: 1, budgetMinor: 30000, budgetType: 'total_all', notes: 'E2E navigation demand',
      }),
    }).then(async response => ({ status: response.status, body: await response.json() })), {
      token: passengerToken, earliest: departureStart.toISOString(), latest: departureEnd.toISOString(),
    });
    expect(demandResponse.status).toBe(201);
    navigationFlowDemandId = demandResponse.body.data.id as string;

    const candidateResult = await driverPage.evaluate(async ({ token, sessionId }) => fetch(`/api/v1/navigation/sessions/${sessionId}/matches/refresh`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
    }).then(async response => ({ status: response.status, body: await response.json() })), { token: driverAccessToken, sessionId: navigationSessionId });
    expect(candidateResult.status).toBe(200);
    const candidate = (candidateResult.body.data as Array<{ id: string; demand_id: string; detour_distance_m: number; detour_duration_s: number }>).find(item => item.demand_id === navigationFlowDemandId);
    expect(candidate, 'the real demand should pass route/time/seat matching against the foreground session').toBeTruthy();
    expect(candidate!.detour_distance_m).toBeGreaterThanOrEqual(0);

    const restoredDriverRefresh = driverPage.waitForResponse(response => response.url().endsWith('/api/v1/auth/refresh'));
    await driverPage.reload();
    const restoredSessionResponse = await restoredDriverRefresh;
    expect(restoredSessionResponse.status()).toBe(200);
    driverAccessToken = (await restoredSessionResponse.json()).data.accessToken as string;
    await driverPage.getByRole('button', { name: 'Почати навігацію' }).click();
    const routeLine = driverPage.locator('.leaflet-overlay-pane path.leaflet-interactive').first();
    await expect(routeLine).toBeVisible();
    const initialRoutePath = await routeLine.getAttribute('d');
    await expect(driverPage.getByText('Дуліб → Львів').first()).toBeVisible();
    await driverPage.getByRole('button', { name: 'Зупиніться та призупиніть навігацію, щоб відповісти' }).first().click();
    await expect.poll(async () => pool.query<{ state: string }>(
      'SELECT state FROM navigation_sessions WHERE id=$1', [navigationSessionId],
    ).then(result => result.rows[0]?.state)).toBe('paused');
    const candidateState = await pool.query(`SELECT c.navigation_session_id,c.status,c.expires_at,d.status AS demand_status,s.driver_id,s.state,s.opt_in,s.current_location_at
      FROM navigation_match_candidates c JOIN passenger_demands d ON d.id=c.demand_id JOIN navigation_sessions s ON s.id=c.navigation_session_id WHERE c.id=$1`, [candidate!.id]);
    const driverInterest = await driverPage.evaluate(async ({ token, sessionId, candidateId }) => fetch(`/api/v1/navigation/sessions/${sessionId}/matches/${candidateId}/interest`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
    }).then(async response => ({ status: response.status, body: await response.json() })), { token: driverAccessToken, sessionId: navigationSessionId, candidateId: candidate!.id });
    expect(driverInterest.status, JSON.stringify({ body: driverInterest.body, state: candidateState.rows })).toBe(200);
    const passengerMatchList = await passengerPage.evaluate(async token => fetch('/api/v1/demands/mine/navigation-matches', { headers: { Authorization: `Bearer ${token}` } }).then(async response => ({ status: response.status, body: await response.json() })), passengerToken);
    expect(passengerMatchList.status, JSON.stringify(passengerMatchList.body)).toBe(200);
    expect(passengerMatchList.body.data).toEqual(expect.arrayContaining([expect.objectContaining({ candidate_id: candidate!.id, status: 'driver_interested' })]));

    const refreshedPassengerSession = passengerPage.waitForResponse(response => response.url().endsWith('/api/v1/auth/refresh'));
    await passengerPage.reload();
    const passengerRefreshResponse = await refreshedPassengerSession;
    expect(passengerRefreshResponse.status()).toBe(200);
    passengerToken = (await passengerRefreshResponse.json()).data.accessToken as string;
    await passengerPage.getByRole('button', { name: 'Створити' }).click();
    await passengerPage.getByRole('button', { name: /Шукаю поїздку/ }).click();
    await passengerPage.getByRole('button', { name: 'Мої заявки' }).click();
    await passengerPage.getByRole('button', { name: 'Оновити', exact: true }).click();
    await expect(passengerPage.getByRole('button', { name: 'Підтвердити взаємний інтерес' })).toBeVisible();
    await passengerPage.getByRole('button', { name: 'Підтвердити взаємний інтерес' }).click();
    await expect(passengerPage.getByRole('status')).toContainText('Взаємний інтерес підтверджено. Ціну та бронювання ще не погоджено');

    const proposalId = await driverPage.evaluate(async ({ token, demandId, candidateId, vehicle }) => {
      const response = await fetch(`/api/v1/demands/${demandId}/proposals`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ vehicleId: vehicle, priceMinor: 30000, departureAt: new Date(Date.now() + 60 * 60_000).toISOString(), comment: 'E2E mutual route offer', navigationCandidateId: candidateId }),
      });
      const body = await response.json();
      return { status: response.status, id: body.data?.id as string | undefined };
    }, { token: driverAccessToken, demandId: navigationFlowDemandId, candidateId: candidate!.id, vehicle: navigationFlowVehicleId });
    expect(proposalId.status).toBe(201);
    expect(proposalId.id).toBeTruthy();
    const acceptance = await passengerPage.evaluate(async ({ token, id }) => fetch(`/api/v1/proposals/${id}/accept`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
    }).then(async response => ({ status: response.status, body: await response.json() })), { token: passengerToken, id: proposalId.id! });
    expect(acceptance.status).toBe(201);
    const booking = await pool.query<{ status: string; total_price_minor: number }>('SELECT status,total_price_minor FROM bookings WHERE id=$1', [acceptance.body.data.id]);
    expect(booking.rows).toEqual([{ status: 'confirmed', total_price_minor: 30000 }]);
    expect(acceptance.body.data).toMatchObject({ fee_class: 'community', platform_fee_minor: 0, fee_rule_version: 'community-0pct-v1' });
    const route = await pool.query<{ route_version: number; opt_in: boolean; waypoint_count: number }>(
      `SELECT s.route_version,s.opt_in,(SELECT count(*)::int FROM navigation_waypoints w WHERE w.navigation_session_id=s.id) AS waypoint_count
         FROM navigation_sessions s WHERE s.id=$1`, [navigationSessionId],
    );
    expect(route.rows[0]).toMatchObject({ route_version: 2, opt_in: false, waypoint_count: 2 });
    const driverRefreshAfterBooking = driverPage.waitForResponse(response => response.url().endsWith('/api/v1/auth/refresh'));
    await driverPage.reload();
    expect((await driverRefreshAfterBooking).status()).toBe(200);
    await driverPage.getByRole('button', { name: 'Почати навігацію' }).click();
    const reroutedLine = driverPage.locator('.leaflet-overlay-pane path.leaflet-interactive').first();
    await expect(reroutedLine).toBeVisible();
    await expect.poll(() => reroutedLine.getAttribute('d')).not.toBe(initialRoutePath);
    await expect(driverPage.getByRole('switch', { name: 'Пошук попутників уздовж маршруту' })).toHaveAttribute('aria-checked', 'false');
    expect((await passengerPage.evaluate(async token => fetch('/api/v1/bookings', { headers: { Authorization: `Bearer ${token}` } }).then(response => response.json()), passengerToken)).data.some((item: { id: string }) => item.id === acceptance.body.data.id)).toBe(true);
    await test.info().attach('two-account-navigation-reroute-driver', { body: await driverPage.screenshot({ fullPage: true }), contentType: 'image/png' });
  } finally {
    if (navigationSessionId && driverAccessToken) await driverPage.evaluate(async ({ token, id }) => fetch(`/api/v1/navigation/sessions/${id}/end`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }), { token: driverAccessToken, id: navigationSessionId }).catch(() => undefined);
    await driverContext.close();
    await passengerContext.close();
  }
});

test('foreground road route renders on iPhone 15 Pro Max and 16 Pro Max viewports', async ({ browser, baseURL }) => {
  expect(baseURL).toBeTruthy();
  for (const model of ['iPhone 15 Pro Max', 'iPhone 16 Pro Max'] as const) {
    const context = await browser.newContext({
      ...devices[model],
      baseURL,
      timezoneId: 'Europe/Kyiv',
      geolocation: { latitude: 49.2567, longitude: 23.8561, accuracy: 8 },
      permissions: ['geolocation'],
    });
    const page = await context.newPage();
    let sessionId: string | undefined;
    try {
      const phone = model === 'iPhone 15 Pro Max' ? navigationPhone : navigationSecondPhone;
      const accessToken = await signIn(page, 'MARSHGO Driver', phone);
      const roleResponse = await page.evaluate(async (token) => fetch('/api/v1/users/me/roles', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: 'driver' }),
      }).then((response) => response.status), accessToken);
      expect(roleResponse).toBe(200);
      await page.reload();
      await expect(page.getByText('Привіт, MARSHGO!')).toBeVisible();
      const viewport = await page.evaluate(() => ({ width: window.innerWidth, documentWidth: document.documentElement.scrollWidth }));
      expect(viewport.documentWidth).toBeLessThanOrEqual(viewport.width + 1);
      const modelFileName = model.toLowerCase().replaceAll(' ', '-');
      await page.screenshot({ path: `/tmp/marshgo-${modelFileName}-home.png`, fullPage: true });
      await page.getByRole('button', { name: 'Почати навігацію' }).click();
      await page.getByPlaceholder('Наприклад, Львів').fill('Львів');
      await page.getByRole('button', { name: 'Знайти', exact: true }).click();
      await page.getByRole('button', { name: /Львів, Львівська область, Україна/ }).click();

      const createdSession = page.waitForResponse((response) => response.url().endsWith('/api/v1/navigation/sessions') && response.request().method() === 'POST');
      await page.getByRole('button', { name: 'Почати навігацію' }).click();
      const response = await createdSession;
      expect(response.status()).toBe(201);
      sessionId = (await response.json()).data.id as string;

      await expect(page.getByText('До пункту призначення')).toBeVisible();
      await expect.poll(async () => page.locator('img.leaflet-tile').evaluateAll(tiles =>
        tiles.filter(tile => (tile as HTMLImageElement).complete && (tile as HTMLImageElement).naturalWidth > 0).length,
      )).toBeGreaterThan(0);
      await expect(page.getByText('Підкладка карти не налаштована. Показано справжню геометрію маршруту без вулиць.')).toHaveCount(0);
      const tileFixture = 'http://127.0.0.1:3306';
      const initialTileStats = await page.request.get(`${tileFixture}/__test/stats`).then(response => response.json());
      expect(initialTileStats.loaded).toBeGreaterThan(0);
      expect(initialTileStats.failed).toBe(0);

      await page.request.get(`${tileFixture}/__test/mode?value=mixed`);
      await page.mouse.move(viewport.width / 2, 300);
      await page.mouse.wheel(0, -550);
      await expect(page.getByRole('alert')).toContainText('Не всі фрагменти карти завантажилися.');
      await expect.poll(async () => page.request.get(`${tileFixture}/__test/stats`).then(response => response.json()).then(stats => stats.failed))
        .toBeGreaterThan(0);

      await page.request.get(`${tileFixture}/__test/mode?value=success`);
      await page.getByRole('button', { name: 'Повторити завантаження карти' }).click();
      await expect(page.getByRole('alert')).toHaveCount(0);

      const route = page.locator('.leaflet-overlay-pane path.leaflet-interactive').first();
      await expect(route).toBeVisible();
      expect((await route.getAttribute('d'))?.length).toBeGreaterThan(10);
      await expect(page.getByText('На маршруті', { exact: true })).toBeVisible({ timeout: 10_000 });
      await test.info().attach(`${model.replaceAll(' ', '-')}-navigation-map`, {
        body: await page.screenshot({ fullPage: true }), contentType: 'image/png',
      });
      await page.screenshot({ path: `/tmp/marshgo-${modelFileName}-route.png`, fullPage: true });

      await page.getByRole('button', { name: /Завершити навігацію/ }).click();
      await expect(page.getByText('Навігацію завершено. Точну геолокацію видалено із сервера.')).toBeVisible();
      const ended = await pool.query<{ state: string; route: unknown; current_location: unknown }>(
        'SELECT state,route,current_location FROM navigation_sessions WHERE id=$1', [sessionId],
      );
      expect(ended.rows).toEqual([{ state: 'ended', route: null, current_location: null }]);
      sessionId = undefined;
    } finally {
      if (sessionId) await page.request.post(`/api/v1/navigation/sessions/${sessionId}/end`).catch(() => undefined);
      await context.close();
    }
  }
});

test('Journey Planner ranks a persisted Community route and opens its current offer detail', async ({ browser, baseURL }) => {
  expect(baseURL).toBeTruthy();
  const context = await browser.newContext({ baseURL, timezoneId: 'Europe/Kyiv' });
  const page = await context.newPage();
  try {
    const accessToken = await signIn(page, 'Journey Passenger', journeyPassengerPhone);
    await page.getByPlaceholder('Місто відправлення').fill('Стрий');
    await page.getByRole('button', { name: 'Знайти', exact: true }).nth(0).click();
    await page.getByRole('button', { name: /Стрий, Львівська область, Україна/ }).click();
    await page.getByPlaceholder('Місто призначення').fill('Львів');
    await page.getByRole('button', { name: 'Знайти', exact: true }).nth(1).click();
    await page.getByRole('button', { name: /Львів, Львівська область, Україна/ }).click();
    await page.getByLabel('Час відправлення для плану').fill(`${tomorrowInKyiv()}T08:00`);
    await page.getByLabel('Пріоритет маршруту').selectOption('CHEAPEST');

    const searchResponse = page.waitForResponse(response => response.url().endsWith('/api/v1/journeys/search') && response.request().method() === 'POST');
    await page.getByRole('button', { name: /Оптимізувати весь маршрут/ }).click();
    const response = await searchResponse;
    expect(response.status()).toBe(200);
    const payload = (await response.json()).data as { journeys: Array<{ id: string; strategy: string; offerId: string }>; partial: boolean; blockedProviders: string[] };
    expect(payload.partial).toBe(true);
    expect(payload.blockedProviders).toContain('bus');
    expect(payload.journeys.some(item => item.strategy === 'CHEAPEST' && item.offerId === offerId)).toBe(true);
    await expect(page.getByRole('heading', { name: 'Варіанти маршруту' })).toBeVisible();
    await expect(page.getByText('Автобуси, таксі й громадський транспорт не підключені як реальні джерела.')).toBeVisible();
    const saved = await pool.query<{ owner_id: string; offer_id: string }>(
      `SELECT j.user_id AS owner_id,l.offer_id FROM journeys j JOIN journey_legs l ON l.journey_id=j.id WHERE j.id=$1`, [payload.journeys.find(item => item.strategy === 'CHEAPEST')!.id],
    );
    const profile = await page.evaluate(async token => fetch('/api/v1/users/me', { headers: { Authorization: `Bearer ${token}` } }).then(response => response.json()), accessToken);
    expect(saved.rows).toEqual([{ owner_id: profile.data.id, offer_id: offerId }]);

    const offerDetail = page.waitForResponse(response => response.url().endsWith(`/api/v1/offers/${offerId}`));
    await page.getByRole('button', { name: /Переглянути пропозицію й бронювання/ }).first().click();
    expect((await offerDetail).status()).toBe(200);
    await expect(page.getByRole('heading', { name: /Стрий.*Львів/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Забронювати місце/ })).toBeVisible();
    const linkedBookingResponse = page.waitForResponse(response => response.url().endsWith('/api/v1/bookings') && response.request().method() === 'POST');
    await page.getByRole('button', { name: /Забронювати місце/ }).click();
    const linkedBookingHttp = await linkedBookingResponse;
    expect(linkedBookingHttp.status()).toBe(201);
    const linkedBooking = await linkedBookingHttp.json() as { data: { id: string } };
    await expect(page.getByText('Journey оновлено сервером і збережено як готовий маршрут.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Збережені маршрути' })).toBeVisible();
    await expect(page.getByText('Маршрут готовий')).toBeVisible();
    const linked = await pool.query<{ state: string; confirmed_price_minor: number; leg_state: string; price_status: string; booking_id: string }>(
      `SELECT j.state,j.confirmed_price_minor,l.state AS leg_state,l.price_status,l.booking_id
         FROM journeys j JOIN journey_legs l ON l.journey_id=j.id WHERE j.user_id=(SELECT id FROM users WHERE phone_e164=$1)`, [journeyPassengerPhone],
    );
    expect(linked.rows).toHaveLength(1);
    expect(linked.rows[0]).toMatchObject({ state: 'READY', confirmed_price_minor: 15000, leg_state: 'CONFIRMED', price_status: 'LOCKED' });

    page.once('dialog', dialog => void dialog.accept());
    const cancelResponse = page.waitForResponse(response => response.url().endsWith(`/api/v1/bookings/${linkedBooking.data.id}/cancel`));
    await page.getByRole('button', { name: 'Скасувати', exact: true }).click();
    expect((await cancelResponse).status()).toBe(200);
    await expect(page.getByText('Потрібне перепланування')).toBeVisible();
    await expect(page.getByText('Ціна оновиться після перепланування')).toBeVisible();

    const inboxResponse = page.waitForResponse(response => response.url().includes('/api/v1/notifications?limit=30'));
    await page.getByRole('button', { name: /Сповіщення/ }).click();
    expect((await inboxResponse).status()).toBe(200);
    await expect(page.getByRole('heading', { name: 'Сповіщення' })).toBeVisible();
    await expect(page.getByText('План маршруту оновлено').first()).toBeVisible();
    await expect(page.getByText('Бронювання підтверджено').first()).toBeVisible();
    const markReadResponse = page.waitForResponse(response => /\/api\/v1\/notifications\/[0-9a-f-]+\/read$/.test(response.url()));
    await page.getByRole('button').filter({ hasText: 'План маршруту оновлено' }).first().click();
    expect((await markReadResponse).status()).toBe(200);
  } finally {
    await context.close();
  }
});
