import type { APIRequestContext } from '@playwright/test';
import { BaseApiClient } from './BaseApiClient';

export type BookingDates = {
  checkin: string;
  checkout: string;
};

export type BookingPayload = {
  firstname: string;
  lastname: string;
  totalprice: number;
  depositpaid: boolean;
  bookingdates: BookingDates;
  additionalneeds?: string;
};

export type CreatedBooking = {
  bookingid: number;
  booking: BookingPayload;
};

export type TokenResponse = {
  token: string;
};

/**
 * Typed API client for the Restful Booker service.
 * Keeps the tests readable while still using Playwright's request context under the hood.
 */
export class BookingApi extends BaseApiClient {
  constructor(request: APIRequestContext) {
    super(request);
  }

  async createToken(
    username = process.env.BOOKER_USERNAME ?? 'admin',
    password = process.env.BOOKER_PASSWORD ?? 'password123',
  ): Promise<string> {
    const body = await this.requestJson<TokenResponse>('post', '/auth', {
      data: { username, password },
    });

    return body.token;
  }

  async createBooking(payload: BookingPayload): Promise<CreatedBooking> {
    return this.requestJson<CreatedBooking>('post', '/booking', {
      data: payload,
    });
  }

  async getBooking(id: number): Promise<BookingPayload> {
    return this.requestJson<BookingPayload>('get', `/booking/${id}`);
  }

  async updateBooking(
    id: number,
    token: string,
    payload: BookingPayload,
  ): Promise<BookingPayload> {
    return this.requestJson<BookingPayload>('put', `/booking/${id}`, {
      headers: this.buildAuthHeaders(token),
      data: payload,
    });
  }

  async deleteBooking(id: number, token: string): Promise<void> {
    await this.requestText('delete', `/booking/${id}`, {
      headers: this.buildAuthHeaders(token),
    }, 201);
  }
}
