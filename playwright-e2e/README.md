# Playwright E2E Framework

TypeScript + Playwright automation suite built as a **recruiter-ready portfolio piece**.

Apps under test:
- UI: [Sauce Demo](https://www.saucedemo.com)
- API: [Restful Booker](https://restful-booker.herokuapp.com)
- Mocking demo: [Playwright api-mocking](https://demo.playwright.dev/api-mocking)

These are public demo systems, so occasional upstream downtime or data quirks are possible. The suite keeps that risk visible with isolated projects, route-level mocking examples, and API cleanup in `finally` blocks.

## What this shows

| Practice | Where |
| --- | --- |
| Page Object Model | `src/pages/` |
| Custom fixtures | `src/fixtures/` |
| **storageState auth (login once)** | `tests/auth/auth.setup.ts` + config projects |
| **API testing via `request`** | `src/api/`, `tests/api/` |
| **Network mocking (`route.fulfill`)** | `tests/network/` |
| **Accessibility (axe)** | `tests/a11y/` |
| **UI Scout** | now lives in the standalone sibling project `../ui-scout` |
| **`test.step` for readable reports** | checkout + API specs |
| Smoke tagging (`@smoke`) | specs |
| Multi-browser + CI artifacts | `playwright.config.ts`, GitHub Actions |

## Quick start

```bash
cd playwright-e2e
npm install
npx playwright install --with-deps
cp .env.example .env   # optional
npm run test:chromium  # setup + e2e + login/network + api (recommended locally)
```

### Useful scripts

```bash
npm test                 # all projects (incl. firefox/webkit)
npm run test:e2e         # authenticated Chromium e2e (runs setup first)
npm run test:api         # Restful Booker API suite
npm run test:a11y        # axe scans
npm run test:unauthenticated  # login + network mocking
npm run test:smoke       # @smoke across matching projects
npm run test:ui          # Playwright UI mode
npm run report           # open HTML report
npm run lint             # TypeScript check
```

### Standalone UI Scout

UI Scout now lives in the standalone sibling project at `../ui-scout`.

```bash
cd ../ui-scout
npm install
npm run scout:ui   # http://localhost:4177
```

## Project layout

```text
playwright-e2e/
├── playwright.config.ts      # setup / e2e / unauthenticated / api / scout projects
├── docs/
│   └── test-strategy.md      # risk model, suite split, CI gates
├── .auth/                    # generated storageState (gitignored)
├── scout-report/             # generated UI Scout HTML/JSON (gitignored)
├── src/
│   ├── api/                  # API clients (BookingApi)
│   ├── data/
│   ├── fixtures/             # UI + API fixtures
│   ├── pages/                # Page Object Model
│   └── scout/                # exploratory crawler + issue checks
└── tests/
    ├── auth/                 # setup + login negatives
    ├── a11y/
    ├── api/
    ├── cart/
    ├── checkout/
    ├── inventory/
    ├── network/
    └── scout/
```

## Auth model (interview talking point)

```text
setup project  →  login once  →  .auth/user.json
        ↓
chromium/firefox/webkit load storageState (no UI login per test)
        ↓
unauthenticated project runs login/mocking without stored session
```

This is the same pattern used in large suites: faster tests, less flaky login, clearer separation of auth vs feature risk.

## Design notes

1. **storageState over per-test login** — cart/checkout start on inventory already authenticated.
2. **API client wrapper** — keeps Playwright `request` calls typed and reusable; easy to swap base URLs via env.
3. **Mocking for determinism** — `route.fulfill` proves you can isolate UI from backend failures.
4. **axe in CI mindset** — attach full JSON; fail on `critical` impact (serious/moderate can be phased in).
5. **Cleanup discipline** — API data created during tests is deleted in `finally`, so failures do not leave stale state.
6. **Standalone UI Scout** — crawl with axe + visual diffs + local dashboard in the sibling project.
7. **Next upgrades** — sharding, Allure, component testing, trace viewer walkthrough in README.

## Test Strategy

See [`docs/test-strategy.md`](./docs/test-strategy.md) for the risk model, suite split, and CI quality gates this framework is designed around.

## CI

Workflow: `../.github/workflows/playwright.yml`  
Typechecks, then runs Chromium e2e + unauthenticated + API; uploads the HTML report.
