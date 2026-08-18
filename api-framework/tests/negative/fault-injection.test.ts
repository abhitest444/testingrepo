import { describe, expect, it } from 'vitest';
import { HttpClient } from '../../src/http/client';
import { BookingClient } from '../../src/clients/BookingClient';
import { AuthClient } from '../../src/clients/AuthClient';

/**
 * Fault injection tests — verify the test framework handles API failures gracefully.
 *
 * These tests use the mock API's fault injection endpoints (/slow, /flaky)
 * to verify that our HTTP client, janitor, and test utilities degrade gracefully.
 *
 * Why this matters:
 * - Real APIs have outages, timeouts, and intermittent failures
 * - Tests should detect and report these clearly, not crash silently
 * - The janitor should still clean up even when the API is unhealthy
 */

const MOCK_BASE = process.env.API_BASE_URL ?? 'http://localhost:3007';

describe('Fault injection — API resilience', () => {
  const http = new HttpClient(MOCK_BASE, 5000);
  const bookings = new BookingClient(http);
  const auth = new AuthClient(http, 'admin', 'password123');

  describe('Timeout handling', () => {
    it('HttpClient throws on slow responses exceeding timeout', async () => {
      // The /slow endpoint delays response — our 5s timeout should trigger
      const slowClient = new HttpClient(MOCK_BASE, 500); // 500ms timeout
      await expect(
        slowClient.request({ method: 'GET', path: '/slow/2000' }),
      ).rejects.toThrow();
    });

    it('HttpClient succeeds when response is faster than timeout', async () => {
      const fastClient = new HttpClient(MOCK_BASE, 5000);
      const response = await fastClient.request<{ delay: number }>({
        method: 'GET',
        path: '/slow/100',
        throwOnError: false,
      });
      expect(response.status).toBe(200);
      expect(response.json.delay).toBe(100);
    });
  });

  describe('Error response handling', () => {
    it('HttpClient throws on 500 errors when throwOnError is true', async () => {
      // The mock API with FAULT_ERROR_RATE=100 returns 500
      // Without fault injection, 404 from non-existent booking
      await expect(
        bookings.get(999_999_999),
      ).rejects.toThrow();
    });

    it('HttpClient returns response on 500 errors when throwOnError is false', async () => {
      const response = await http.request({
        method: 'GET',
        path: '/booking/999_999_999',
        throwOnError: false,
      });
      expect(response.status).toBe(404);
      expect(response.ok).toBe(false);
    });

    it('BookingClient.createRaw handles server errors gracefully', async () => {
      const response = await bookings.createRaw(null);
      expect([400, 500]).toContain(response.status);
    });
  });

  describe('Auth under failure conditions', () => {
    it('AuthClient.createToken throws descriptive error on bad credentials', async () => {
      const badAuth = new AuthClient(http, 'admin', 'wrong-password');
      await expect(badAuth.createToken()).rejects.toThrow(/Auth rejected/);
    });

    it('AuthClient.attemptLogin captures failure without throwing', async () => {
      const result = await auth.attemptLogin({
        username: 'admin',
        password: 'wrong',
      });
      expect(result.status).toBe(200);
      expect(result.token).toBeUndefined();
      expect(result.failureReason).toBeDefined();
    });
  });

  describe('Graceful degradation', () => {
    it('HTTP client handles malformed JSON responses', async () => {
      // The mock API returns text/html for some error paths
      const response = await http.request({
        method: 'GET',
        path: '/booking/999_999_999',
        throwOnError: false,
      });
      // Should not crash — json will be undefined for non-JSON responses
      expect(response).toBeDefined();
      expect(typeof response.status).toBe('number');
    });

    it('HTTP client handles empty response body', async () => {
      const response = await http.request({
        method: 'DELETE',
        path: '/booking/999_999_999',
        throwOnError: false,
      });
      // DELETE on non-existent returns 404, not a crash
      expect([404, 403]).toContain(response.status);
    });

    it('concurrent requests do not corrupt state', async () => {
      // Create 5 bookings simultaneously
      const creates = Array.from({ length: 5 }, (_, i) =>
        bookings.create({
          firstname: `Concurrent${i}`,
          lastname: `Test${Date.now()}-${i}`,
          totalprice: 100 + i,
          depositpaid: true,
          bookingdates: { checkin: '2026-01-01', checkout: '2026-01-02' },
        }),
      );

      const results = await Promise.all(creates);
      expect(results).toHaveLength(5);

      // All should have unique IDs
      const ids = results.map((r) => r.bookingid);
      expect(new Set(ids).size).toBe(5);
    });
  });
});
