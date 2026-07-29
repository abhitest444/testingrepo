import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * GET helper with named checks + think time.
 */
export function getJson(url, tags = {}) {
  const res = http.get(url, {
    headers: { Accept: 'application/json' },
    tags,
  });

  check(res, {
    'status is 2xx': (r) => r.status >= 200 && r.status < 300,
    'has body': (r) => (r.body || '').length > 0,
  });

  return res;
}

export function postJson(url, body, tags = {}, headers = {}) {
  const res = http.post(url, JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...headers,
    },
    tags,
  });

  check(res, {
    'status is 2xx': (r) => r.status >= 200 && r.status < 300,
  });

  return res;
}

/** Small randomized think time so load is not a perfect hammer. */
export function think(min = 0.3, max = 1.2) {
  sleep(min + Math.random() * (max - min));
}
