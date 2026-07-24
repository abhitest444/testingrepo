import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createApiContext, type ApiContext } from '../../src/clients/createContext';
import { buildBooking } from '../../src/data/factories';
import { BookingJanitor } from '../../src/utils/janitor';

/**
 * Auth matrix — valid token works; missing/invalid token does not.
 * Documents Restful Booker's cookie-token model.
 */
describe('Authz — mutating operations require a valid token', () => {
  let api: ApiContext;
  let janitor: BookingJanitor;
  let validToken: string;

  beforeAll(async () => {
    api = createApiContext();
    validToken = await api.auth.createToken();
    janitor = new BookingJanitor(api.bookings, async () => validToken);
  });

  afterEach(async () => {
    await janitor.cleanup();
  });

  it('update succeeds with a valid token', async () => {
    const created = await api.bookings.create(buildBooking({ firstname: 'Before' }));
    janitor.track(created.bookingid);

    const updated = await api.bookings.update(
      created.bookingid,
      validToken,
      buildBooking({ firstname: 'After' }),
    );
    expect(updated.firstname).toBe('After');
  });

  it('update fails with a garbage token', async () => {
    const created = await api.bookings.create(buildBooking());
    janitor.track(created.bookingid);

    const response = await api.bookings.updateRaw(
      created.bookingid,
      buildBooking({ firstname: 'Hacker' }),
      'not-a-real-token',
    );
    expect([401, 403]).toContain(response.status);
  });

  it('delete fails with a garbage token', async () => {
    const created = await api.bookings.create(buildBooking());
    janitor.track(created.bookingid);

    const response = await api.bookings.removeRaw(created.bookingid, 'not-a-real-token');
    expect([401, 403]).toContain(response.status);
  });
});
