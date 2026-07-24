import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createApiContext, type ApiContext } from '../../src/clients/createContext';
import { buildBooking } from '../../src/data/factories';
import { BookingJanitor } from '../../src/utils/janitor';

describe('Negative — status handling', () => {
  let api: ApiContext;
  let janitor: BookingJanitor;

  beforeAll(() => {
    api = createApiContext();
    janitor = new BookingJanitor(api.bookings, () => api.auth.createToken());
  });

  afterEach(async () => {
    await janitor.cleanup();
  });

  it('GET unknown booking returns 404', async () => {
    const response = await api.bookings.getRaw(99_999_999);
    expect(response.status).toBe(404);
  });

  it('POST incomplete payload is rejected', async () => {
    const response = await api.bookings.createRaw({ firstname: 'OnlyFirst' });
    // Restful Booker often returns 500 for schema-invalid bodies (practice API quirk).
    expect([400, 500]).toContain(response.status);
  });

  it('PUT without token is forbidden', async () => {
    const created = await api.bookings.create(buildBooking());
    janitor.track(created.bookingid);

    const response = await api.bookings.updateRaw(created.bookingid, buildBooking({ firstname: 'Nope' }));
    expect([401, 403]).toContain(response.status);
  });

  it('DELETE without token is forbidden', async () => {
    const created = await api.bookings.create(buildBooking());
    janitor.track(created.bookingid);

    const response = await api.bookings.removeRaw(created.bookingid);
    expect([401, 403]).toContain(response.status);
  });
});
