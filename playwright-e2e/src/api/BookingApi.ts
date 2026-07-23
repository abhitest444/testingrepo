import type { APIRequestContext, APIResponse } from '@playwright/test';

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

/**
 * Thin API client over Playwright's request context.
 * Prefer this over raw fetch in tests — headers, baseURL, and reporting stay consistent.
 */
export class BookingApi {
  constructor(private readonly request: APIRequestContext) {}

  async createToken(
    username = process.env.BOOKER_USERNAME ?? 'admin',
    password = process.env.BOOKER_PASSWORD ?? 'password123',
  ): Promise<string> {
    const response = await this.request.post('/auth', {
      data: { username, password },
    });
    await this.expectOk(response, 'createToken');
    const body = (await response.json()) as { token: string };
    return body.token;
  }

  async createBooking(payload: BookingPayload): Promise<CreatedBooking> {
    const response = await this.request.post('/booking', { data: payload });
    await this.expectOk(response, 'createBooking');
    return (await response.json()) as CreatedBooking;
  }

  async getBooking(id: number): Promise<BookingPayload> {
    const response = await this.request.get(`/booking/${id}`);
    await this.expectOk(response, 'getBooking');
    return (await response.json()) as BookingPayload;
  }

  async updateBooking(
    id: number,
    token: string,
    payload: BookingPayload,
  ): Promise<BookingPayload> {
    const response = await this.request.put(`/booking/${id}`, {
      headers: { Cookie: `token=${token}` },
      data: payload,
    });
    await this.expectOk(response, 'updateBooking');
    return (await response.json()) as BookingPayload;
  }

  async deleteBooking(id: number, token: string): Promise<void> {
    const response = await this.request.delete(`/booking/${id}`, {
      headers: { Cookie: `token=${token}` },
    });
    if (response.status() !== 201) {
      throw new Error(`deleteBooking failed: ${response.status()} ${await response.text()}`);
    }
  }

  private async expectOk(response: APIResponse, action: string): Promise<void> {
    if (!response.ok()) {
      throw new Error(`${action} failed: ${response.status()} ${await response.text()}`);
    }
  }
}
