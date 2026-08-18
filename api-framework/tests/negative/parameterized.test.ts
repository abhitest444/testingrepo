import { afterEach, beforeAll, describe, expect, it, test } from 'vitest';
import { createApiContext, type ApiContext } from '../../src/clients/createContext';
import { loadConfig } from '../../src/config';
import { buildBooking } from '../../src/data/factories';
import {
  AuthFailureSchema,
  AuthTokenSchema,
  BookingSchema,
  CreatedBookingSchema,
} from '../../src/schemas/booking';
import { BookingJanitor } from '../../src/utils/janitor';

// Config can be loaded at import time (no API call needed)
const config = loadConfig();

/**
 * Data-driven parameterized tests — demonstrate how to scale test coverage
 * by expressing scenarios as data rather than individual test cases.
 *
 * Pattern: test.each / describe.each from Vitest
 * Why: one table entry = one test; adding a row = adding coverage
 */

// ─── Auth Matrix ───────────────────────────────────────────

describe('Parameterized — auth matrix @smoke', () => {
  let api: ApiContext;
  let janitor: BookingJanitor;

  beforeAll(() => {
    api = createApiContext();
    janitor = new BookingJanitor(api.bookings, () => api.auth.createToken());
  });

  afterEach(async () => {
    await janitor.cleanup();
  });

  describe('POST /auth — credential validation', () => {
    test.each([
      {
        label: 'valid credentials → token',
        username: config.username,
        password: config.password,
        expectToken: true,
        expectFailure: false,
      },
      {
        label: 'wrong password → failure reason',
        username: config.username,
        password: 'definitely-wrong',
        expectToken: false,
        expectFailure: true,
      },
      {
        label: 'empty username → failure reason',
        username: '',
        password: config.password,
        expectToken: false,
        expectFailure: true,
      },
      {
        label: 'empty password → failure reason',
        username: config.username,
        password: '',
        expectToken: false,
        expectFailure: true,
      },
      {
        label: 'both empty → failure reason',
        username: '',
        password: '',
        expectToken: false,
        expectFailure: true,
      },
      {
        label: 'SQL injection attempt → failure reason',
        username: "admin' OR '1'='1",
        password: "pass' OR '1'='1",
        expectToken: false,
        expectFailure: true,
      },
      {
        label: 'very long username → failure reason',
        username: 'A'.repeat(1000),
        password: config.password,
        expectToken: false,
        expectFailure: true,
      },
    ])('$label', async ({ username, password, expectToken, expectFailure }) => {
      const result = await api.auth.attemptLogin({ username, password });

      expect(result.status).toBe(200); // Restful Booker quirk

      if (expectToken) {
        expect(result.token).toBeDefined();
        expect(typeof result.token).toBe('string');
        expect(result.token!.length).toBeGreaterThan(5);
        expect(AuthTokenSchema.safeParse({ token: result.token }).success).toBe(true);
      }

      if (expectFailure) {
        expect(result.token).toBeUndefined();
        expect(result.failureReason).toBeDefined();
        expect(result.failureReason!.length).toBeGreaterThan(0);
        expect(AuthFailureSchema.safeParse({ reason: result.failureReason }).success).toBe(true);
      }
    });
  });

  describe('PUT /booking/:id — token matrix', () => {
    test.each([
      {
        label: 'valid token → 200',
        token: '', // filled dynamically
        expectStatus: 200,
      },
      {
        label: 'empty string token → 401/403',
        token: '',
        expectStatus: [401, 403],
      },
      {
        label: 'garbage token → 401/403',
        token: 'not-a-real-token-abc123',
        expectStatus: [401, 403],
      },
      {
        label: 'expired-looking token → 401/403',
        token: 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2MDAwMDAwMDB9.fake-sig',
        expectStatus: [401, 403],
      },
    ])('$label', async ({ label, token, expectStatus }) => {
      // Create a fresh booking to mutate
      const created = await api.bookings.create(buildBooking());
      janitor.track(created.bookingid);

      // For the "valid token" case, get a real token
      const actualToken = label.includes('valid')
        ? await api.auth.createToken()
        : token;

      const response = await api.bookings.updateRaw(
        created.bookingid,
        buildBooking({ firstname: 'Updated' }),
        actualToken,
      );

      if (Array.isArray(expectStatus)) {
        expect(expectStatus).toContain(response.status);
      } else {
        expect(response.status).toBe(expectStatus);
      }
    });
  });
});

// ─── Booking Validation ────────────────────────────────────

describe('Parameterized — booking validation', () => {
  let api: ApiContext;
  let janitor: BookingJanitor;

  beforeAll(() => {
    api = createApiContext();
    janitor = new BookingJanitor(api.bookings, () => api.auth.createToken());
  });

  afterEach(async () => {
    await janitor.cleanup();
  });

  describe('POST /booking — invalid payloads', () => {
    test.each([
      {
        label: 'missing all fields',
        payload: {},
      },
      {
        label: 'missing firstname',
        payload: {
          lastname: 'Lovelace',
          totalprice: 120,
          depositpaid: true,
          bookingdates: { checkin: '2026-08-01', checkout: '2026-08-05' },
        },
      },
      {
        label: 'missing lastname',
        payload: {
          firstname: 'Ada',
          totalprice: 120,
          depositpaid: true,
          bookingdates: { checkin: '2026-08-01', checkout: '2026-08-05' },
        },
      },
      {
        label: 'missing bookingdates',
        payload: {
          firstname: 'Ada',
          lastname: 'Lovelace',
          totalprice: 120,
          depositpaid: true,
        },
      },
      {
        label: 'missing totalprice',
        payload: {
          firstname: 'Ada',
          lastname: 'Lovelace',
          depositpaid: true,
          bookingdates: { checkin: '2026-08-01', checkout: '2026-08-05' },
        },
      },
      // NOTE: Restful Booker accepts string/negative totalprice (practice API quirk)
      // These document the API's actual behavior, not ideal behavior
      {
        label: 'null payload',
        payload: null,
      },
    ])('$label', async ({ payload }) => {
      const response = await api.bookings.createRaw(payload);
      // Restful Booker returns 500 for invalid bodies (practice API quirk)
      expect([400, 500]).toContain(response.status);
    });

    // Quirk documentation: API accepts these "invalid" payloads
    test.each([
      {
        label: 'string totalprice → accepted (API quirk)',
        payload: { ...buildBooking(), totalprice: 'not-a-number' },
      },
      {
        label: 'negative totalprice → accepted (API quirk)',
        payload: { ...buildBooking(), totalprice: -100 },
      },
    ])('$label', async ({ payload }) => {
      const response = await api.bookings.createRaw(payload);
      // These pass validation but shouldn't — documented as known API weakness
      expect(response.status).toBe(200);
    });
  });

  describe('POST /booking — valid edge cases', () => {
    test.each([
      {
        label: 'minimal valid payload',
        payload: {
          firstname: 'A',
          lastname: 'B',
          totalprice: 1,
          depositpaid: true,
          bookingdates: { checkin: '2026-01-01', checkout: '2026-01-02' },
        },
      },
      {
        label: 'long names (100 chars)',
        payload: {
          ...buildBooking(),
          firstname: 'X'.repeat(100),
          lastname: 'Y'.repeat(100),
        },
      },
      {
        label: 'unicode characters in names',
        payload: {
          ...buildBooking(),
          firstname: '你好',
          lastname: '世界',
        },
      },
      {
        label: 'additionalneeds with special chars',
        payload: {
          ...buildBooking(),
          additionalneeds: 'Room 101, extra bed + crib, dietary: vegan/gluten-free',
        },
      },
    ])('$label', async ({ payload }) => {
      const created = await api.bookings.create(payload);
      janitor.track(created.bookingid);

      expect(CreatedBookingSchema.safeParse(created).success).toBe(true);
      expect(created.booking.firstname).toBe(payload.firstname);
      expect(created.booking.lastname).toBe(payload.lastname);
    });
  });
});

// ─── HTTP Status Matrix ───────────────────────────────────

describe('Parameterized — HTTP status matrix', () => {
  let api: ApiContext;
  let janitor: BookingJanitor;
  let token: string;

  beforeAll(async () => {
    api = createApiContext();
    token = await api.auth.createToken();
    janitor = new BookingJanitor(api.bookings, async () => token);
  });

  afterEach(async () => {
    await janitor.cleanup();
  });

  describe('GET /booking/:id', () => {
    test.each([
      {
        label: 'existing booking → 200',
        getId: async () => {
          const created = await api.bookings.create(buildBooking());
          janitor.track(created.bookingid);
          return created.bookingid;
        },
        expectStatus: 200,
      },
      {
        label: 'non-existent ID → 404',
        getId: async () => 99_999_999,
        expectStatus: 404,
      },
    ])('$label', async ({ getId, expectStatus }) => {
      const id = await getId();
      const response = await api.bookings.getRaw(id);
      expect(response.status).toBe(expectStatus);
    });
  });

  describe('DELETE /booking/:id', () => {
    test.each([
      {
        label: 'with valid token → 201 (Restful Booker quirk)',
        useToken: true,
        expectStatus: 201,
      },
      {
        label: 'without token → 401/403',
        useToken: false,
        expectStatus: [401, 403],
      },
    ])('$label', async ({ useToken, expectStatus }) => {
      const created = await api.bookings.create(buildBooking());
      // Don't track — we're deleting on purpose

      const response = await api.bookings.removeRaw(
        created.bookingid,
        useToken ? token : undefined,
      );

      if (Array.isArray(expectStatus)) {
        expect(expectStatus).toContain(response.status);
      } else {
        expect(response.status).toBe(expectStatus);
      }
    });
  });
});
