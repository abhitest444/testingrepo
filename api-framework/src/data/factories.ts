import type { Booking } from '../schemas/booking';

let seq = 0;

/**
 * Deterministic-enough factory for booking payloads.
 * Unique last names reduce collisions when listing/filtering on a shared demo API.
 */
export function buildBooking(overrides: Partial<Booking> = {}): Booking {
  seq += 1;
  const stamp = Date.now().toString(36);
  return {
    firstname: 'Ada',
    lastname: `Lovelace-${stamp}-${seq}`,
    totalprice: 120,
    depositpaid: true,
    bookingdates: {
      checkin: '2026-08-01',
      checkout: '2026-08-05',
    },
    additionalneeds: 'Late checkout',
    ...overrides,
  };
}
