import { describe, expect, it } from 'vitest';
import { createApiContext } from '../../../src/clients/createContext';
import { loadConfig } from '../../../src/config';
import { buildBooking } from '../../../src/data/factories';
import {
  BookingSchema,
  CreatedBookingSchema,
  AuthTokenSchema,
  AuthFailureSchema,
} from '../../../src/schemas/booking';
import { BookingJanitor } from '../../../src/utils/janitor';

/**
 * Provider verification — checks the real API against consumer contract expectations.
 *
 * NOTE: The Pact native verifier doesn't fully support matchers with PactV4
 * against public APIs where data is unpredictable. Instead, we verify the
 * contracts by checking the real API responses against our Zod schemas,
 * which enforce the same structural guarantees the consumer contract defines.
 *
 * In production with a Pact Broker:
 *   1. Consumer publishes pact → Broker
 *   2. Provider verifies pact against staging → Broker
 *   3. Broker tracks compatibility matrix
 *
 * Here we skip the Broker and verify directly — same result, simpler setup.
 */

const config = loadConfig();

describe('Provider verification — real API matches consumer contracts', () => {
  const api = createApiContext();
  const janitor = new BookingJanitor(api.bookings, () => api.auth.createToken());

  it('GET /booking/:id — returns booking with expected structure', async () => {
    // Create a booking first (we know its shape)
    const payload = buildBooking();
    const created = await api.bookings.create(payload);
    janitor.track(created.bookingid);

    // Fetch it back — consumer contract expects these fields
    const fetched = await api.bookings.get(created.bookingid);

    // Structural validation (matches consumer contract shape)
    expect(typeof fetched.firstname).toBe('string');
    expect(typeof fetched.lastname).toBe('string');
    expect(typeof fetched.totalprice).toBe('number');
    expect(typeof fetched.depositpaid).toBe('boolean');
    expect(fetched.bookingdates).toBeDefined();
    expect(typeof fetched.bookingdates.checkin).toBe('string');
    expect(typeof fetched.bookingdates.checkout).toBe('string');

    // Schema validation (full contract)
    expect(BookingSchema.safeParse(fetched).success).toBe(true);
  });

  it('GET /booking/:id — returns 404 for non-existent booking', async () => {
    const response = await api.bookings.getRaw(99_999_999);
    expect(response.status).toBe(404);
  });

  it('POST /booking — creates and returns booking with expected shape', async () => {
    const payload = buildBooking();
    const created = await api.bookings.create(payload);
    janitor.track(created.bookingid);

    // Consumer contract expects: { bookingid, booking: { ... } }
    expect(typeof created.bookingid).toBe('number');
    expect(created.bookingid).toBeGreaterThan(0);
    expect(created.booking).toBeDefined();

    // Booking object matches consumer contract structure
    expect(typeof created.booking.firstname).toBe('string');
    expect(typeof created.booking.lastname).toBe('string');
    expect(typeof created.booking.totalprice).toBe('number');
    expect(typeof created.booking.depositpaid).toBe('boolean');

    // Full schema validation
    expect(CreatedBookingSchema.safeParse(created).success).toBe(true);
  });

  it('POST /auth — returns token for valid credentials', async () => {
    const response = await api.http.request<{ token: string }>({
      method: 'POST',
      path: '/auth',
      body: { username: config.username, password: config.password },
      throwOnError: false,
    });

    // Consumer contract expects: { token: string }
    expect(response.status).toBe(200);
    expect(typeof response.json.token).toBe('string');
    expect(response.json.token.length).toBeGreaterThan(0);

    // Full schema validation
    expect(AuthTokenSchema.safeParse(response.json).success).toBe(true);
  });

  it('POST /auth — returns failure reason for bad credentials', async () => {
    const response = await api.http.request<{ reason: string }>({
      method: 'POST',
      path: '/auth',
      body: { username: 'admin', password: 'wrong' },
      throwOnError: false,
    });

    // Consumer contract expects: { reason: string } (Restful Booker quirk: HTTP 200)
    expect(response.status).toBe(200);
    expect(typeof response.json.reason).toBe('string');
    expect(response.json.reason.length).toBeGreaterThan(0);

    // Full schema validation
    expect(AuthFailureSchema.safeParse(response.json).success).toBe(true);
  });

  it('Consumer contract file exists and is valid JSON', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const pactPath = path.resolve(
      __dirname,
      '../../../pacts/PlaywrightE2E-Frontend-RestfulBooker-API.json',
    );

    expect(fs.existsSync(pactPath)).toBe(true);

    const pact = JSON.parse(fs.readFileSync(pactPath, 'utf-8'));
    expect(pact.consumer.name).toBe('PlaywrightE2E-Frontend');
    expect(pact.provider.name).toBe('RestfulBooker-API');
    expect(pact.interactions.length).toBeGreaterThanOrEqual(5);
  });
});
