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
| **Visual snapshots** | `tests/visual/` (`toHaveScreenshot`) |
| **Soft assertions** | `tests/advanced/soft-assertions.spec.ts` |
| **Clock mocking** | `tests/advanced/clock.spec.ts` |
| **Mobile device project** | `mobile-chrome` (Pixel 5) |
| **Allure reporting** | `allure-playwright` + `npm run allure:serve` |
| **Cucumber BDD** | `cucumber/` + [`docs/cucumber.md`](./docs/cucumber.md) |
| **UI Scout** | sibling project `../ui-scout` |
| **`test.step` for readable reports** | checkout + API specs |
| Smoke tagging (`@smoke`) | specs |
| Multi-browser + sharded CI | `playwright.config.ts`, GitHub Actions |

## Quick start

```bash
cd playwright-e2e
npm install
npx playwright install --with-deps
cp .env.example .env   # optional
npm run test:smoke:portfolio  # start here — login, cart, checkout, mock, API smoke
npm run test:chromium         # then go broader (full Chromium portfolio)
```

`test:smoke:portfolio` is the short proof run. Mobile, a11y, visual, Cucumber, and Allure are in this same project — use the scripts below when you want depth.

### Useful scripts

```bash
npm test                 # all projects (incl. firefox/webkit/mobile)
npm run test:e2e         # authenticated Chromium e2e (runs setup first)
npm run test:api         # Restful Booker API suite
npm run test:a11y        # axe scans
npm run test:mobile      # Pixel 5 device emulation
npm run test:visual      # screenshot baselines
npm run test:visual:update  # refresh visual baselines
npm run test:advanced    # soft asserts + clock + visual
npm run test:unauthenticated  # login + network mocking
npm run test:smoke       # @smoke across matching projects
npm run test:smoke:portfolio  # short demo path (login/cart/checkout/mock/API)
npm run test:ui          # Playwright UI mode
npm run test:cucumber    # Gherkin / Cucumber BDD scenarios
npm run test:cucumber:smoke  # @smoke cucumber scenarios
npm run report           # Playwright HTML report
npm run allure:serve     # generate + open Allure report
npm run lint             # TypeScript check
```

### Cucumber BDD

Living-documentation style scenarios (login, cart tables, sort outlines) on the same Page Objects:

```bash
npm run test:cucumber
```

See [`docs/cucumber.md`](./docs/cucumber.md).

### Debugging & Allure

- Trace walkthrough: [`docs/debugging.md`](./docs/debugging.md)
- Allure: `npm run test:chromium && npm run allure:serve`

### Standalone UI Scout

```bash
cd ../ui-scout
npm install
npm run scout:ui   # http://localhost:4177
```

## Project layout

```text
playwright-e2e/
├── playwright.config.ts      # setup / browsers / mobile / api projects
├── cucumber.js
├── docs/
│   ├── test-strategy.md
│   ├── cucumber.md
│   └── debugging.md          # traces + Allure
├── .auth/                    # generated storageState (gitignored)
├── cucumber/
├── src/
│   ├── api/
│   ├── data/
│   ├── fixtures/
│   └── pages/
└── tests/
    ├── auth/
    ├── a11y/
    ├── advanced/             # soft asserts + clock
    ├── api/
    ├── cart/
    ├── checkout/
    ├── inventory/
    ├── network/
    └── visual/               # toHaveScreenshot baselines
```

## Auth model (interview talking point)

```text
setup project  →  login once  →  .auth/user.json
        ↓
chromium/firefox/webkit/mobile-chrome load storageState
        ↓
unauthenticated project runs login/mocking/clock without stored session
```

## Design notes

1. **storageState over per-test login** — cart/checkout start on inventory already authenticated.
2. **API client wrapper** — typed Playwright `request` calls; easy to swap base URLs via env.
3. **Mocking for determinism** — `route.fulfill` isolates UI from backend failures.
4. **axe in CI mindset** — attach full JSON; fail on `critical` impact.
5. **Cleanup discipline** — API data deleted in `finally`.
6. **Visual + soft + clock** — advanced Playwright APIs without bloating the smoke path.
7. **Allure + traces** — suite narrative for stakeholders; interactive debug for engineers.
8. **Sharded CI** — Chromium portfolio split across shards; mobile + cucumber as parallel jobs.

## Test Strategy

See [`docs/test-strategy.md`](./docs/test-strategy.md).

## CI

Workflow: `../.github/workflows/playwright.yml`

- `lint` → typecheck
- `chromium` → sharded portfolio (`chromium` + `unauthenticated` + `api`)
- `mobile` → Pixel 5 project
- `cucumber` → smoke BDD
- `allure` → merge shard results and publish Allure HTML
