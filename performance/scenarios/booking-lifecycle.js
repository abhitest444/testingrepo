import http from 'k6/http';
import { check, sleep } from 'k6';
import { bookingUrl } from '../lib/config.js';

/**
 * Booking lifecycle under light load — ties performance to the same Restful Booker
 * API used by api-framework (correctness there; capacity here).
 *
 * KEEP VUs LOW: Restful Booker is a shared public demo.
 */
export const options = {
  scenarios: {
    booking_lifecycle: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: Number(__ENV.BOOKING_VUS || 3) },
        { duration: '30s', target: Number(__ENV.BOOKING_VUS || 3) },
        { duration: '10s', target: 0 },
      ],
      gracefulRampDown: '5s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.1'],
    http_req_duration: ['p(95)<2000'],
    checks: ['rate>0.9'],
  },
};

function uniqueName() {
  return `k6_${__VU}_${__ITER}_${Date.now()}`;
}

export default function bookingLifecycle() {
  const root = bookingUrl();

  const payload = {
    firstname: 'Perf',
    lastname: uniqueName(),
    totalprice: 120,
    depositpaid: true,
    bookingdates: {
      checkin: '2026-08-01',
      checkout: '2026-08-05',
    },
    additionalneeds: 'Breakfast',
  };

  const create = http.post(`${root}/booking`, JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    tags: { name: 'create_booking' },
  });

  const created = check(create, {
    'create is 200': (r) => r.status === 200,
    'create has bookingid': (r) => {
      try {
        return typeof r.json('bookingid') === 'number';
      } catch {
        return false;
      }
    },
  });

  if (!created) {
    sleep(1);
    return;
  }

  const id = create.json('bookingid');
  sleep(0.3 + Math.random() * 0.5);

  const get = http.get(`${root}/booking/${id}`, {
    headers: { Accept: 'application/json' },
    tags: { name: 'get_booking' },
  });

  check(get, {
    'get is 200': (r) => r.status === 200,
    'lastname matches': (r) => {
      try {
        return r.json('lastname') === payload.lastname;
      } catch {
        return false;
      }
    },
  });

  sleep(0.4 + Math.random() * 0.6);
}
