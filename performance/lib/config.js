/**
 * Shared env + defaults for all k6 scenarios.
 * Override with env vars: BASE_URL, BOOKING_URL, VUS, DURATION, etc.
 *
 * Default HTTP target is Grafana QuickPizza (current official k6 demo app).
 * Legacy test-api.k6.io redirects here.
 */
export function baseUrl() {
  return (__ENV.BASE_URL || 'https://quickpizza.grafana.com').replace(/\/$/, '');
}

export function bookingUrl() {
  return (__ENV.BOOKING_URL || 'https://restful-booker.herokuapp.com').replace(/\/$/, '');
}

/**
 * QuickPizza expects: Authorization: Token <16-char-token>
 * Public demo accepts a fixed demo token; override with QUICKPIZZA_TOKEN if needed.
 */
export function pizzaToken() {
  return __ENV.QUICKPIZZA_TOKEN || 'tokentokentoken1';
}

/** Soft defaults — keep public demos polite. */
export const defaults = {
  smokeVus: Number(__ENV.SMOKE_VUS || 2),
  smokeDuration: __ENV.SMOKE_DURATION || '20s',
  loadStages: [
    { duration: '20s', target: Number(__ENV.LOAD_START_VUS || 5) },
    { duration: '40s', target: Number(__ENV.LOAD_PEAK_VUS || 15) },
    { duration: '20s', target: 0 },
  ],
  stressStages: [
    { duration: '15s', target: 10 },
    { duration: '30s', target: Number(__ENV.STRESS_PEAK_VUS || 40) },
    { duration: '15s', target: 0 },
  ],
};

export const commonThresholds = {
  http_req_failed: ['rate<0.05'],
  http_req_duration: ['p(95)<1500'],
};
