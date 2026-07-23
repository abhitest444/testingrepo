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
| **UI Scout (crawl / broken links / UI heuristics)** | `src/scout/`, `tests/scout/` |
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
npm run test:scout       # exploratory UI crawl (alias: npm run scout)
npm run scout:browsers   # scout on chromium + firefox + webkit
npm run test:unauthenticated  # login + network mocking
npm run test:smoke       # @smoke across matching projects
npm run test:ui          # Playwright UI mode
npm run scout            # UI Scout crawl (mobile/tablet/desktop)
npm run scout:browsers   # Scout on Chromium + Firefox + WebKit
npm run report           # open HTML report
npm run lint             # TypeScript check
```

### UI Scout

Exploratory crawl that finds broken links, dead ends, console/network failures, broken images, and layout issues across viewports. Writes `scout-report/scout-report.html`.

See [`docs/ui-scout.md`](./docs/ui-scout.md).

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
6. **UI Scout** — on-demand crawl for broken links, console/network errors, layout overflow, and weak controls across viewports (`npm run test:scout`).
7. **Next upgrades** — visual snapshots, sharding, Allure, component testing, trace viewer walkthrough in README.

## Test Strategy

See [`docs/test-strategy.md`](./docs/test-strategy.md) for the risk model, suite split, and CI quality gates this framework is designed around.

## CI

Workflow: `../.github/workflows/playwright.yml`  
Typechecks, then runs Chromium e2e + unauthenticated + API; uploads the HTML report. UI Scout stays opt-in (`npm run scout`).
