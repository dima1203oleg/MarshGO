import { expect, test } from '@playwright/test';
import { signInWithEmailPassword } from './support/emailPasswordAuth';

test('confirmed carpool rendezvous displays consented locations and labeled straight-line distance', async ({ page }) => {
  const bookingId = 'e2e-rendezvous-booking';
  const rendezvousId = 'e2e-rendezvous-session';
  const booking = {
    id: bookingId, offer_id: 'e2e-rendezvous-offer', seat_count: 1,
    total_price_minor: 0, currency: 'UAH', fee_class: 'community',
    platform_fee_minor: 0, fee_rule_version: 'e2e', status: 'confirmed',
    origin_name: 'Київ, Лівий берег', destination_name: 'Київ, Поділ',
    departure_at: '2026-10-18T09:00:00.000Z', driver_name: 'Test Driver', passenger_name: 'Test Passenger',
    current_user_is_driver: false, completion_confirmation_count: 0,
    current_user_confirmed_completion: false, current_user_has_review: false,
  };
  const rendezvous = {
    id: rendezvousId, bookingId, journeyLegId: null, state: 'ACTIVE',
    pickup: { label: 'Поштова площа', coordinates: [30.5262812, 50.4592213] },
    plannedPickupAt: '2026-10-18T09:00:00.000Z', predictedPickupAt: null,
    activationAt: '2026-10-18T08:45:00.000Z', locationSharingEnabled: true,
    driverArrivedAt: null, passengerArrivedAt: null, currentParticipant: 'passenger',
    currentParticipantConsent: true, otherParticipantConsent: true,
    locations: {
      driver: { coordinates: [30.51, 50.44], accuracyMeters: 12, capturedAt: '2026-10-18T08:58:00.000Z', freshness: 'LIVE' },
      passenger: { coordinates: [30.50, 50.43], accuracyMeters: 20, capturedAt: '2026-10-18T08:58:00.000Z', freshness: 'LIVE' },
    },
  };

  await page.context().grantPermissions(['geolocation']);
  await page.context().setGeolocation({ latitude: 50.43, longitude: 30.50, accuracy: 10 });
  await page.route(url => new URL(url).pathname === '/api/v1/bookings', route => route.request().method() === 'GET'
    ? route.fulfill({ json: { data: [booking] } })
    : route.continue());
  await page.route(url => new URL(url).pathname === `/api/v1/bookings/${bookingId}/rendezvous`, route => route.request().method() === 'GET'
    ? route.fulfill({ json: { data: rendezvous } })
    : route.continue());
  await page.route(url => new URL(url).pathname === `/api/v1/rendezvous/${rendezvousId}/location`, route => route.request().method() === 'POST'
    ? route.fulfill({ json: { data: { rendezvousId, storedEphemerally: true, expiresInSeconds: 90, nearPickup: false, arrivalRequiresUserConfirmation: true } } })
    : route.continue());

  await signInWithEmailPassword(page, 'Rendezvous UI Test', `+38092${String(Date.now()).slice(-7)}`);
  await page.getByRole('button', { name: 'Поїздки' }).click();
  await expect(page.getByRole('heading', { name: 'Мої поїздки' })).toBeVisible();
  await page.getByRole('button', { name: 'Відкрити зустріч' }).click();
  await expect(page.getByRole('button', { name: 'Відкрити карту зустрічі' })).toBeVisible();
  await page.getByRole('button', { name: 'Відкрити карту зустрічі' }).click();

  const meetingMap = page.getByRole('main', { name: 'Карта зустрічі' });
  await expect(meetingMap).toBeVisible();
  const map = meetingMap.getByRole('img', { name: 'Карта маршруту MARSHGO' });
  await expect(map).toBeVisible({ timeout: 20_000 });
  await expect(meetingMap.getByTestId('meeting-pickup')).toBeVisible();
  await expect(meetingMap.getByTestId('meeting-driver')).toBeVisible();
  await expect(meetingMap.getByTestId('meeting-passenger')).toBeVisible();
  await expect.poll(() => map.evaluate(element => element.getAttribute('data-marshgo-meeting-points'))).toBe('3');
  await expect(meetingMap.getByTestId('meeting-driver-card')).toContainText('Водій');
  await expect(meetingMap.getByTestId('meeting-driver-card')).toContainText('до точки');
  await expect(meetingMap.getByTestId('meeting-passenger-card')).toContainText('Ви (пасажир)');
  await expect(meetingMap.getByTestId('meeting-passenger-card')).toContainText('до точки');
  await expect(meetingMap.getByTestId('meeting-between')).toContainText('Між вами');
  await expect(meetingMap).toContainText('Місце зустрічі — початок маршруту поїздки');
  await meetingMap.screenshot({ path: '/tmp/marshgo-rendezvous-map.png' });
});
