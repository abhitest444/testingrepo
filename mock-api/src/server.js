/**
 * Mock API Server — local Restful Booker replica for deterministic testing.
 *
 * Features:
 * - In-memory data store (resets on restart)
 * - Fault injection via env vars (delay, errors, rate limiting)
 * - CORS enabled for cross-origin testing
 * - Health check endpoint
 *
 * Usage:
 *   node src/server.js                    # normal mode
 *   FAULT_DELAY=2000 node src/server.js   # 2s delay on all responses
 *   FAULT_ERROR_RATE=50 node src/server.js # 50% chance of 500 errors
 *   FAULT_RATE_LIMIT=5 node src/server.js  # max 5 requests per minute
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT ?? 3007;

// ── Fault injection config ────────────────────────────────
const FAULT_DELAY = Number(process.env.FAULT_DELAY ?? 0);
const FAULT_ERROR_RATE = Number(process.env.FAULT_ERROR_RATE ?? 0); // 0-100
const FAULT_RATE_LIMIT = Number(process.env.FAULT_RATE_LIMIT ?? 0); // 0 = unlimited

// ── In-memory store ───────────────────────────────────────
let bookings = [];
let nextId = 1;
let requestCount = 0;
let windowStart = Date.now();

// Seed data matching Restful Booker's example responses
bookings.push(
  {
    bookingid: 1,
    booking: {
      firstname: 'Jim',
      lastname: 'Brown',
      totalprice: 111,
      depositpaid: true,
      bookingdates: { checkin: '2018-01-01', checkout: '2019-01-01' },
      additionalneeds: 'Breakfast',
    },
  },
  {
    bookingid: 2,
    booking: {
      firstname: 'Sally',
      lastname: 'Wilson',
      totalprice: 806,
      depositpaid: false,
      bookingdates: { checkin: '2015-02-25', checkout: '2021-02-21' },
      additionalneeds: 'Late checkout',
    },
  },
);
nextId = 3;

// Valid tokens (Restful Booker pattern)
const VALID_TOKENS = new Set(['abc123', 'token123']);

// ── Middleware ─────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Fault injection: delay
app.use((req, res, next) => {
  if (FAULT_DELAY > 0) {
    setTimeout(next, FAULT_DELAY);
  } else {
    next();
  }
});

// Fault injection: rate limiting
app.use((req, res, next) => {
  if (FAULT_RATE_LIMIT > 0) {
    const now = Date.now();
    if (now - windowStart > 60_000) {
      requestCount = 0;
      windowStart = now;
    }
    requestCount++;
    if (requestCount > FAULT_RATE_LIMIT) {
      return res.status(429).json({ error: 'Too many requests' });
    }
  }
  next();
});

// Fault injection: random errors
app.use((req, res, next) => {
  if (FAULT_ERROR_RATE > 0 && Math.random() * 100 < FAULT_ERROR_RATE) {
    return res.status(500).json({ error: 'Injected fault' });
  }
  next();
});

// ── Helper: extract token from cookie ─────────────────────
function extractToken(req) {
  const cookie = req.headers.cookie ?? '';
  const match = cookie.match(/token=([^;]+)/);
  return match ? match[1] : null;
}

// ── Health check ──────────────────────────────────────────
app.get('/ping', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── POST /auth ────────────────────────────────────────────
app.post('/auth', (req, res) => {
  const { username, password } = req.body ?? {};

  // Restful Booker quirk: valid auth returns { token }
  if (username === 'admin' && password === 'password123') {
    const token = `mock-${Date.now().toString(36)}`;
    VALID_TOKENS.add(token);
    return res.json({ token });
  }

  // Restful Booker quirk: bad auth returns 200 + { reason }, not 401
  res.json({ reason: 'Bad credentials' });
});

// ── GET /booking ──────────────────────────────────────────
app.get('/booking', (req, res) => {
  res.json(bookings.map((b) => ({ bookingid: b.bookingid })));
});

// ── GET /booking/:id ─────────────────────────────────────
app.get('/booking/:id', (req, res) => {
  const id = Number(req.params.id);
  const found = bookings.find((b) => b.bookingid === id);
  if (!found) return res.status(404).json({ error: 'Not Found' });
  res.json(found.booking);
});

// ── POST /booking ─────────────────────────────────────────
app.post('/booking', (req, res) => {
  const payload = req.body;

  // Validate required fields
  if (!payload || !payload.firstname || !payload.lastname || !payload.totalprice ||
      payload.depositpaid === undefined || !payload.bookingdates) {
    return res.status(500).json({ error: 'Incomplete payload' });
  }

  const id = nextId++;
  const booking = { bookingid: id, booking: payload };
  bookings.push(booking);
  res.status(200).json(booking);
});

// ── PUT /booking/:id ──────────────────────────────────────
app.put('/booking/:id', (req, res) => {
  const id = Number(req.params.id);
  const token = extractToken(req);

  // Restful Booker: PUT requires valid token cookie
  if (!token || !VALID_TOKENS.has(token)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const idx = bookings.findIndex((b) => b.bookingid === id);
  if (idx === -1) return res.status(404).json({ error: 'Not Found' });

  bookings[idx] = { bookingid: id, booking: req.body };
  res.json(req.body);
});

// ── DELETE /booking/:id ───────────────────────────────────
app.delete('/booking/:id', (req, res) => {
  const id = Number(req.params.id);
  const token = extractToken(req);

  if (!token || !VALID_TOKENS.has(token)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const idx = bookings.findIndex((b) => b.bookingid === id);
  if (idx === -1) return res.status(404).json({ error: 'Not Found' });

  bookings.splice(idx, 1);
  // Restful Booker quirk: DELETE returns 201 Created
  res.status(201).json({ message: 'Deleted' });
});

// ── Fault injection: custom endpoints ─────────────────────
// Simulate slow responses for performance testing
app.get('/slow/:ms', (req, res) => {
  const delay = Math.min(Number(req.params.ms ?? 1000), 30_000);
  setTimeout(() => res.json({ delay }), delay);
});

// Simulate intermittent failures
app.get('/flaky', (req, res) => {
  if (Math.random() < 0.5) {
    return res.status(500).json({ error: 'Random failure' });
  }
  res.json({ status: 'ok' });
});

// ── Start ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🟢 Mock API running on http://localhost:${PORT}`);
  console.log(`   Fault injection: delay=${FAULT_DELAY}ms, errorRate=${FAULT_ERROR_RATE}%, rateLimit=${FAULT_RATE_LIMIT}/min`);
  console.log(`   Seeded with ${bookings.length} bookings`);
});
