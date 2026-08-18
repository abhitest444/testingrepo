# API Framework

![Vitest](https://img.shields.io/badge/Vitest-4.x-729B1B)
![Zod](https://img.shields.io/badge/Zod-4.x-3E67DB)
![TypeScript](https://img.shields.io/badge/TypeScript-7.0-blue)

Dedicated REST API test framework — **not** Playwright `request`.

Built to show contract testing, auth matrices, negative status handling, and cleanup discipline against [Restful Booker](https://restful-booker.herokuapp.com).

## Requirements

| Requirement | Version | Notes |
| --- | --- | --- |
| Node.js | ≥ 20 | LTS recommended |
| npm | ≥ 10 | comes with Node |

No browser or k6 needed — pure HTTP via Vitest.

## Why a separate project?

| Playwright `request` (in `playwright-e2e`) | This framework |
| --- | --- |
| Convenient beside UI tests | Focused API-only runner (Vitest) |
| Light typing | **Zod schemas** on every critical response |
| Happy-path CRUD demo | Authz matrix + negatives + janitor cleanup |

Same public API, deeper API-testing craft.

## What this shows

- Typed `HttpClient` over `fetch` (timeouts, cookie token, soft/hard errors)
- **Zod contracts** for auth + booking payloads
- Documents Restful Booker quirks (bad auth → HTTP 200 + `{ reason }`, DELETE → 201)
- **Auth matrix** — valid / missing / garbage token on PUT/DELETE
- **Negative statuses** — 404, invalid body, forbidden mutations
- **BookingJanitor** — tracks created IDs and deletes them in `afterEach`
- Factory data with unique last names for shared-env safety

## Layout

```text
api-framework/
├── src/
│   ├── config.ts
│   ├── http/client.ts
│   ├── schemas/booking.ts      # Zod contracts
│   ├── clients/                # Auth + Booking
│   ├── data/factories.ts
│   └── utils/janitor.ts
└── tests/
    ├── contract/               # schema assertions
    ├── lifecycle/              # CRUD @smoke
    └── negative/               # status + authz
```

## Quick start

```bash
cd api-framework
npm install
cp .env.example .env   # optional
npm test
```

### Scripts

```bash
npm run lint            # tsc --noEmit
npm test                # full suite
npm run test:smoke      # titles containing @smoke
npm run test:contract   # schema/contract folder
npm run test:negative   # negatives + authz
```

### Sample output

<details>
<summary>npm test (full suite)</summary>

```
 ✓ tests/contract/booking-schema.test.ts (6 tests) 1.2s
 ✓ tests/contract/auth-schema.test.ts (4 tests) 0.8s
 ✓ tests/lifecycle/crud.smoke.test.ts (4 tests) 0.9s
 ✓ tests/negative/status-codes.test.ts (5 tests) 0.7s
 ✓ tests/negative/auth-matrix.test.ts (8 tests) 1.1s

 Test Files  5 passed (5)
      Tests  27 passed (27)
   Start at  10:32:15
   Duration  4.7s
```

</details>

<details>
<summary>npm run test:contract</summary>

```
 ✓ tests/contract/booking-schema.test.ts (6 tests) 1.1s
 ✓ tests/contract/auth-schema.test.ts (4 tests) 0.8s

 Test Files  2 passed (2)
      Tests  10 passed (10)
   Duration  2.0s
```

</details>

<details>
<summary>npm run lint</summary>

```
> tsc --noEmit

✅ No type errors found.
```

</details>

## Interview talking points

1. **Contract first** — if the payload shape drifts, tests fail before business asserts.
2. **Auth is a matrix, not a happy path** — missing vs invalid token are different risks.
3. **Cleanup is mandatory** on shared environments — janitor pattern beats hoping `finally` always ran.
4. **Know your practice API** — assert real quirks instead of pretending every API is textbook HTTP.

## Troubleshooting

<details>
<summary>Tests fail with connection refused</summary>

- Verify Restful Booker is reachable: `curl -sI https://restful-booker.herokuapp.com`
- The free Heroku instance may take 30s+ to wake up on first request
- Check if `BASE_URL` in `.env` or environment overrides the default
</details>

<details>
<summary>Auth token expired or invalid</summary>

- Auth token is fetched fresh per test run via `/auth`
- If the API returns `200` with `{ reason: "Bad credentials" }`, the API is working — assert the reason
- Restful Booker has known quirks: bad auth returns HTTP 200, not 401
</details>

<details>
<summary>Janitor didn't clean up</summary>

- Janitor runs in `afterEach` — check if the test errored before cleanup
- Deleted items are logged to console during teardown
- On shared envs, manually DELETE any leftover bookings by ID
</details>

## Related

UI + Playwright `request` smoke lives in [`../playwright-e2e`](../playwright-e2e). This project is the deeper API pillar.
