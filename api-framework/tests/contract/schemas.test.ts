import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createApiContext, type ApiContext } from '../../src/clients/createContext';
import { buildBooking } from '../../src/data/factories';
import {
  AuthFailureSchema,
  AuthTokenSchema,
  BookingSchema,
  CreatedBookingSchema,
} from '../../src/schemas/booking';
import { BookingJanitor } from '../../src/utils/janitor';

describe('Contract — response schemas @smoke', () => {
  let api: ApiContext;
  let janitor: BookingJanitor;

  beforeAll(() => {
    api = createApiContext();
    janitor = new BookingJanitor(api.bookings, () => api.auth.createToken());
  });

  afterEach(async () => {
    await janitor.cleanup();
  });

  it('auth token payload matches AuthTokenSchema', async () => {
    const response = await api.http.request({
      method: 'POST',
      path: '/auth',
      body: {
        username: api.config.username,
        password: api.config.password,
      },
    });

    const parsed = AuthTokenSchema.safeParse(response.json);
    expect(parsed.success, JSON.stringify(parsed.error?.issues)).toBe(true);
    expect(parsed.success && parsed.data.token.length).toBeGreaterThan(5);
  });

  it('bad credentials payload matches AuthFailureSchema (HTTP 200 quirk)', async () => {
    const result = await api.auth.attemptLogin({
      username: 'admin',
      password: 'definitely-wrong',
    });

    expect(result.status).toBe(200);
    expect(result.token).toBeUndefined();
    expect(result.failureReason).toMatch(/bad credentials/i);

    const parsed = AuthFailureSchema.safeParse(result.body);
    expect(parsed.success).toBe(true);
  });

  it('create + get booking payloads match Booking schemas', async () => {
    const payload = buildBooking();
    const created = await api.bookings.create(payload);
    janitor.track(created.bookingid);

    expect(CreatedBookingSchema.safeParse(created).success).toBe(true);
    expect(created.booking.firstname).toBe(payload.firstname);

    const fetched = await api.bookings.get(created.bookingid);
    expect(BookingSchema.safeParse(fetched).success).toBe(true);
    expect(fetched.lastname).toBe(payload.lastname);
  });
});
