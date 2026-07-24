import type { HttpClient } from '../http/client';
import {
  BookingIdListSchema,
  BookingSchema,
  CreatedBookingSchema,
  parseOrThrow,
  type Booking,
  type CreatedBooking,
} from '../schemas/booking';

export class BookingClient {
  constructor(private readonly http: HttpClient) {}

  async create(payload: Booking): Promise<CreatedBooking> {
    const response = await this.http.request<unknown>({
      method: 'POST',
      path: '/booking',
      body: payload,
    });
    return parseOrThrow(CreatedBookingSchema, response.json, 'create booking');
  }

  async get(id: number): Promise<Booking> {
    const response = await this.http.request<unknown>({
      method: 'GET',
      path: `/booking/${id}`,
    });
    return parseOrThrow(BookingSchema, response.json, 'get booking');
  }

  async getRaw(id: number) {
    return this.http.request<unknown>({
      method: 'GET',
      path: `/booking/${id}`,
      throwOnError: false,
    });
  }

  async listIds(): Promise<number[]> {
    const response = await this.http.request<unknown>({
      method: 'GET',
      path: '/booking',
    });
    const list = parseOrThrow(BookingIdListSchema, response.json, 'list bookings');
    return list.map((row) => row.bookingid);
  }

  async update(id: number, token: string, payload: Booking): Promise<Booking> {
    const response = await this.http.request<unknown>({
      method: 'PUT',
      path: `/booking/${id}`,
      body: payload,
      token,
    });
    return parseOrThrow(BookingSchema, response.json, 'update booking');
  }

  async updateRaw(id: number, payload: Booking, token?: string) {
    return this.http.request<unknown>({
      method: 'PUT',
      path: `/booking/${id}`,
      body: payload,
      token,
      throwOnError: false,
    });
  }

  async remove(id: number, token: string): Promise<void> {
    await this.http.request({
      method: 'DELETE',
      path: `/booking/${id}`,
      token,
    });
  }

  async removeRaw(id: number, token?: string) {
    return this.http.request({
      method: 'DELETE',
      path: `/booking/${id}`,
      token,
      throwOnError: false,
    });
  }

  async createRaw(payload: unknown) {
    return this.http.request<unknown>({
      method: 'POST',
      path: '/booking',
      body: payload,
      throwOnError: false,
    });
  }
}
