import { expect, sampleBooking, test } from '../../src/fixtures/api.fixture';

test.describe('Restful Booker API', () => {
  test('auth token can be created @smoke', async ({ bookingApi }) => {
    const token = await bookingApi.createToken();
    expect(token.length).toBeGreaterThan(5);
  });

  test('booking CRUD lifecycle @smoke', async ({ bookingApi }) => {
    const token = await test.step('Create auth token', async () => {
      return bookingApi.createToken();
    });

    const created = await test.step('Create booking', async () => {
      const result = await bookingApi.createBooking(sampleBooking());
      expect(result.bookingid).toBeGreaterThan(0);
      expect(result.booking.firstname).toBe('Ada');
      return result;
    });

    try {
      await test.step('Read booking', async () => {
        const fetched = await bookingApi.getBooking(created.bookingid);
        expect(fetched.lastname).toBe('Lovelace');
        expect(fetched.totalprice).toBe(120);
      });

      await test.step('Update booking', async () => {
        const updated = await bookingApi.updateBooking(
          created.bookingid,
          token,
          sampleBooking({ firstname: 'Grace', totalprice: 200 }),
        );
        expect(updated.firstname).toBe('Grace');
        expect(updated.totalprice).toBe(200);
      });
    } finally {
      await test.step('Delete booking', async () => {
        await bookingApi.deleteBooking(created.bookingid, token);
      });
    }
  });

  test('get unknown booking returns 404', async ({ request }) => {
    const response = await request.get('/booking/99999999');
    expect(response.status()).toBe(404);
  });

  test('create booking rejects incomplete payload', async ({ request }) => {
    const response = await request.post('/booking', {
      data: { firstname: 'OnlyFirst' },
    });
    // Restful Booker returns 500 for schema-invalid bodies (practice API quirk)
    expect([400, 500]).toContain(response.status());
  });
});
