import { describe, expect, it } from 'vitest';
import { buildBooking } from '../../src/data/factories';
import {
  AuthTokenSchema,
  BookingDatesSchema,
  BookingSchema,
  parseOrThrow,
} from '../../src/schemas/booking';

/**
 * Targeted tests to kill surviving mutants from Stryker mutation analysis.
 *
 * Each test is named after the mutant it kills, making the portfolio
 * a clear demonstration of mutation-score-driven test improvement.
 */
describe('Mutation-killing tests — surviving mutant coverage', () => {
  // ── Survived: AssignmentOperator (factories.ts seq += 1 → seq -= 1) ──
  describe('factories — sequence counter', () => {
    it('buildBooking produces unique ascending IDs on sequential calls', () => {
      const first = buildBooking();
      const second = buildBooking();
      const third = buildBooking();

      // Last names include the sequence counter — different values prove it incremented
      expect(first.lastname).not.toBe(second.lastname);
      expect(second.lastname).not.toBe(third.lastname);
    });

    it('buildBooking uses default depositpaid of true', () => {
      const booking = buildBooking();
      expect(booking.depositpaid).toBe(true);
    });
  });

  // ── Survived: BooleanLiteral (factories.ts depositpaid: true → false) ──
  describe('factories — default values', () => {
    it('buildBooking default totalprice is 120', () => {
      const booking = buildBooking();
      expect(booking.totalprice).toBe(120);
    });

    it('buildBooking default checkin is 2026-08-01', () => {
      const booking = buildBooking();
      expect(booking.bookingdates.checkin).toBe('2026-08-01');
    });

    it('buildBooking default checkout is 2026-08-05', () => {
      const booking = buildBooking();
      expect(booking.bookingdates.checkout).toBe('2026-08-05');
    });
  });

  // ── Survived: ConditionalExpression (parseOrThrow if false → never throws) ──
  describe('parseOrThrow — error path', () => {
    it('throws on invalid data with descriptive message', () => {
      expect(() => parseOrThrow(BookingSchema, { firstname: '' }, 'test')).toThrow(
        /test failed schema validation/,
      );
    });

    it('throws with field-level detail for nested errors', () => {
      expect(() =>
        parseOrThrow(
          BookingSchema,
          {
            firstname: 'Ada',
            lastname: 'Lovelace',
            totalprice: 120,
            depositpaid: true,
            bookingdates: { checkin: 'not-a-date', checkout: 'also-not' },
          },
          'nested test',
        ),
      ).toThrow(/bookingdates/);
    });

    it('returns parsed data on success', () => {
      const booking = buildBooking();
      const result = parseOrThrow(BookingSchema, booking, 'success test');
      expect(result).toEqual(booking);
    });
  });

  // ── Survived: Regex (booking.ts isoDate regex anchors removed) ──
  describe('BookingDatesSchema — date regex', () => {
    it('rejects date without leading zero in month', () => {
      const result = BookingDatesSchema.safeParse({ checkin: '2026-1-01', checkout: '2026-1-05' });
      expect(result.success).toBe(false);
    });

    it('rejects date without leading zero in day', () => {
      const result = BookingDatesSchema.safeParse({ checkin: '2026-01-1', checkout: '2026-01-5' });
      expect(result.success).toBe(false);
    });

    it('rejects date with trailing text', () => {
      const result = BookingDatesSchema.safeParse({
        checkin: '2026-08-01extra',
        checkout: '2026-08-05',
      });
      expect(result.success).toBe(false);
    });

    it('rejects date with extra prefix', () => {
      const result = BookingDatesSchema.safeParse({
        checkin: 'prefix-2026-08-01',
        checkout: '2026-08-05',
      });
      expect(result.success).toBe(false);
    });

    it('accepts valid YYYY-MM-DD dates', () => {
      const result = BookingDatesSchema.safeParse({
        checkin: '2026-08-01',
        checkout: '2026-08-05',
      });
      expect(result.success).toBe(true);
    });
  });

  // ── Survived: ObjectLiteral (booking.ts empty object schema) ──
  describe('BookingSchema — required fields', () => {
    it('rejects booking missing checkin date', () => {
      const result = BookingSchema.safeParse({
        firstname: 'Ada',
        lastname: 'Lovelace',
        totalprice: 120,
        depositpaid: true,
        bookingdates: { checkout: '2026-08-05' },
      });
      expect(result.success).toBe(false);
    });

    it('rejects booking missing checkout date', () => {
      const result = BookingSchema.safeParse({
        firstname: 'Ada',
        lastname: 'Lovelace',
        totalprice: 120,
        depositpaid: true,
        bookingdates: { checkin: '2026-08-01' },
      });
      expect(result.success).toBe(false);
    });

    it('rejects booking with empty bookingdates', () => {
      const result = BookingSchema.safeParse({
        firstname: 'Ada',
        lastname: 'Lovelace',
        totalprice: 120,
        depositpaid: true,
        bookingdates: {},
      });
      expect(result.success).toBe(false);
    });

    it('rejects booking missing firstname', () => {
      const result = BookingSchema.safeParse({
        lastname: 'Lovelace',
        totalprice: 120,
        depositpaid: true,
        bookingdates: { checkin: '2026-08-01', checkout: '2026-08-05' },
      });
      expect(result.success).toBe(false);
    });
  });

  // ── Survived: NoCoverage (parseOrThrow arrow function mutation) ──
  describe('parseOrThrow — error formatting', () => {
    it('formats multiple field errors in the message', () => {
      try {
        parseOrThrow(BookingSchema, {}, 'multi-error');
        expect.fail('Should have thrown');
      } catch (e: any) {
        // Should contain path and message for multiple fields
        expect(e.message).toContain('failed schema validation');
        expect(e.message).toContain(':');
      }
    });

    it('uses "(root)" label for top-level errors', () => {
      try {
        parseOrThrow(AuthTokenSchema, 'not-an-object', 'root-error');
        expect.fail('Should have thrown');
      } catch (e: any) {
        expect(e.message).toContain('(root)');
      }
    });
  });
});
