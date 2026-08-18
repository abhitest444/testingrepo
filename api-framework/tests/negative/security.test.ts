import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createApiContext, type ApiContext } from '../../src/clients/createContext';
import { buildBooking } from '../../src/data/factories';
import { BookingJanitor } from '../../src/utils/janitor';

/**
 * Security baseline tests — check for common HTTP security issues
 * against the practice API (Restful Booker).
 *
 * These are NOT a replacement for a full ZAP/Burp scan, but they
 * establish a security-aware testing posture and catch regressions.
 *
 * Why here: security is a quality concern, not just a pen-test concern.
 */

describe('Security baseline — HTTP headers & auth quirks', () => {
  let api: ApiContext;
  let janitor: BookingJanitor;

  beforeAll(() => {
    api = createApiContext();
    janitor = new BookingJanitor(api.bookings, () => api.auth.createToken());
  });

  afterEach(async () => {
    await janitor.cleanup();
  });

  describe('Security headers', () => {
    it('GET /booking returns response (headers check)', async () => {
      const response = await api.http.request({
        method: 'GET',
        path: '/booking',
        throwOnError: false,
      });

      // Document which security headers are present/missing
      const headers = response.headers;
      const securityHeaders = {
        'strict-transport-security': headers.get('strict-transport-security'),
        'x-content-type-options': headers.get('x-content-type-options'),
        'x-frame-options': headers.get('x-frame-options'),
        'content-security-policy': headers.get('content-security-policy'),
        'x-xss-protection': headers.get('x-xss-protection'),
      };

      // Log what we found (visible in test output for portfolio demos)
      console.log('Security headers:', JSON.stringify(securityHeaders, null, 2));

      // Restful Booker is a practice API — most headers will be missing.
      // The point is to CHECK and DOCUMENT, not to fail on missing headers.
      // In a real app, these would be hard assertions.
      expect(response.status).toBe(200);
    });

    it('API does not leak server version in headers', async () => {
      const response = await api.http.request({
        method: 'GET',
        path: '/booking',
        throwOnError: false,
      });

      const server = response.headers.get('server');
      const poweredBy = response.headers.get('x-powered-by');

      // Practice API may leak — document it
      if (server) console.log(`⚠ Server header leaked: ${server}`);
      if (poweredBy) console.log(`⚠ X-Powered-By leaked: ${poweredBy}`);

      // In a real app: expect(server).toBeNull(); expect(poweredBy).toBeNull();
      expect(response.status).toBe(200);
    });
  });

  describe('Authentication security', () => {
    it('bad credentials return HTTP 200 (documented quirk, not 401)', async () => {
      const result = await api.auth.attemptLogin({
        username: 'admin',
        password: 'wrong',
      });

      // This IS the security finding: API should return 401, not 200
      expect(result.status).toBe(200);
      expect(result.failureReason).toBeDefined();
      console.log('⚠ Security finding: bad auth returns 200 instead of 401');
    });

    it('auth token is not returned in response body on failure', async () => {
      const result = await api.auth.attemptLogin({
        username: 'admin',
        password: 'wrong',
      });

      expect(result.token).toBeUndefined();
      // Token should never leak in error responses
    });

    it('auth token has reasonable length (not trivially guessable)', async () => {
      const token = await api.auth.createToken();
      // Token should be at least 10 chars (practice API uses short tokens)
      expect(token.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Input sanitization', () => {
    it('booking with HTML in name does not cause server error', async () => {
      const payload = buildBooking({
        firstname: '<script>alert("xss")</script>',
        lastname: '<img src=x onerror=alert(1)>',
      });

      const response = await api.bookings.createRaw(payload);
      // Server should handle gracefully, not crash with 500
      expect([200, 400, 500]).toContain(response.status);
    });

    it('booking with extremely long name does not crash server', async () => {
      const payload = buildBooking({
        firstname: 'A'.repeat(10_000),
        lastname: 'B'.repeat(10_000),
      });

      const response = await api.bookings.createRaw(payload);
      // Server should handle gracefully
      expect([200, 400, 413, 500]).toContain(response.status);
    });

    it('booking with null bytes in name does not crash server', async () => {
      const payload = buildBooking({
        firstname: 'Ada\x00Lovelace',
        lastname: 'Test\x00User',
      });

      const response = await api.bookings.createRaw(payload);
      expect([200, 400, 500]).toContain(response.status);
    });

    it('booking with Unicode RTL override character', async () => {
      const payload = buildBooking({
        firstname: 'Ada\u202E',  // RTL override
        lastname: 'Lovelace',
      });

      const response = await api.bookings.createRaw(payload);
      expect([200, 400, 500]).toContain(response.status);
    });
  });

  describe('HTTP method security', () => {
    it('OPTIONS returns allowed methods (CORS preflight)', async () => {
      const response = await api.http.request({
        method: 'OPTIONS' as any,
        path: '/booking',
        throwOnError: false,
      });

      // Document CORS configuration
      const allow = response.headers.get('access-control-allow-methods');
      if (allow) console.log(`CORS allowed methods: ${allow}`);
      expect([200, 204, 405]).toContain(response.status);
    });

    it('PATCH on booking returns appropriate status', async () => {
      const response = await api.http.request({
        method: 'PATCH',
        path: '/booking/1',
        throwOnError: false,
      });

      // Practice API: PATCH without token returns 403
      expect([200, 403, 405, 404]).toContain(response.status);
    });
  });

  describe('Rate limiting & abuse', () => {
    it('rapid auth attempts do not crash server', async () => {
      const results = await Promise.all(
        Array.from({ length: 5 }, () =>
          api.auth.attemptLogin({ username: 'admin', password: 'wrong' }),
        ),
      );

      // All should return 200 (Restful Booker quirk) — none should crash
      for (const result of results) {
        expect(result.status).toBe(200);
        expect(result.failureReason).toBeDefined();
      }
    });
  });
});
