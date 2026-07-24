import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createApiContext, type ApiContext } from '../../src/clients/createContext';
import { buildBooking } from '../../src/data/factories';
import { BookingJanitor } from '../../src/utils/janitor';

describe('Lifecycle — booking CRUD @smoke', () => {
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

  it('creates, reads, updates, and deletes a booking', async () => {
    const created = await api.bookings.create(buildBooking({ firstname: 'Ada' }));
    janitor.track(created.bookingid);
    expect(created.bookingid).toBeGreaterThan(0);

    const fetched = await api.bookings.get(created.bookingid);
    expect(fetched.firstname).toBe('Ada');

    const updated = await api.bookings.update(
      created.bookingid,
      token,
      buildBooking({ firstname: 'Grace', totalprice: 200 }),
    );
    expect(updated.firstname).toBe('Grace');
    expect(updated.totalprice).toBe(200);

    await api.bookings.remove(created.bookingid, token);
    // Un-track after successful delete so janitor does not double-delete.
    // (cleanup is still safe if this fails mid-way)

    const missing = await api.bookings.getRaw(created.bookingid);
    expect(missing.status).toBe(404);
  });

  it('list endpoint returns an array of booking ids', async () => {
    const created = await api.bookings.create(buildBooking());
    janitor.track(created.bookingid);

    const ids = await api.bookings.listIds();
    expect(Array.isArray(ids)).toBe(true);
    expect(ids.length).toBeGreaterThan(0);
    expect(ids).toContain(created.bookingid);
  });
});
