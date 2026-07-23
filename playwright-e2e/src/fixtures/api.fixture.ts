import { test as base, expect } from '@playwright/test';
import { BookingApi } from '../../src/api/BookingApi';
import type { BookingPayload } from '../../src/api/BookingApi';

type ApiFixtures = {
  bookingApi: BookingApi;
};

export const test = base.extend<ApiFixtures>({
  bookingApi: async ({ request }, use) => {
    await use(new BookingApi(request));
  },
});

export { expect };

export const sampleBooking = (overrides: Partial<BookingPayload> = {}): BookingPayload => ({
  firstname: 'Ada',
  lastname: 'Lovelace',
  totalprice: 120,
  depositpaid: true,
  bookingdates: {
    checkin: '2026-08-01',
    checkout: '2026-08-05',
  },
  additionalneeds: 'Late checkout',
  ...overrides,
});
