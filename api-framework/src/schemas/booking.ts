import { z } from 'zod';

/** ISO date string as used by Restful Booker (YYYY-MM-DD). */
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

export const BookingDatesSchema = z.object({
  checkin: isoDate,
  checkout: isoDate,
});

export const BookingSchema = z.object({
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  totalprice: z.number().int(),
  depositpaid: z.boolean(),
  bookingdates: BookingDatesSchema,
  additionalneeds: z.string().optional(),
});

export const CreatedBookingSchema = z.object({
  bookingid: z.number().int().positive(),
  booking: BookingSchema,
});

export const AuthTokenSchema = z.object({
  token: z.string().min(1),
});

/** Restful Booker returns this object (HTTP 200) for bad credentials — not a 401. */
export const AuthFailureSchema = z.object({
  reason: z.string().min(1),
});

export const BookingIdListSchema = z.array(
  z.object({
    bookingid: z.number().int().positive(),
  }),
);

export type Booking = z.infer<typeof BookingSchema>;
export type CreatedBooking = z.infer<typeof CreatedBookingSchema>;
export type AuthToken = z.infer<typeof AuthTokenSchema>;

export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const detail = result.error.issues
      .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('; ');
    throw new Error(`${label} failed schema validation: ${detail}`);
  }
  return result.data;
}
