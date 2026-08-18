# Playwright E2E Framework

![Playwright](https://img.shields.io/badge/Playwright-1.54-2EAD33)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![axe-core](https://img.shields.io/badge/axe--core-4.10-blue)

TypeScript + Playwright automation suite built as a **recruiter-ready portfolio piece**.

Apps under test:
- UI: [Sauce Demo](https://www.saucedemo.com)
- API: [Restful Booker](https://restful-booker.herokuapp.com)
- Mocking demo: [Playwright api-mocking](https://demo.playwright.dev/api-mocking)

These are public demo systems, so occasional upstream downtime or data quirks are possible. The suite keeps that risk visible with isolated projects, route-level mocking examples, and API cleanup in `finally` blocks.

## Requirements

| Requirement | Version | Notes |
| --- | --- | --- |
| Node.js | ≥ 20 | LTS recommended |
| npm | ≥ 10 | comes with Node |
| Playwright browsers | — | `npx playwright install --with-deps chromium` |

No other global dependencies required — everything else is in `devDependencies`.

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

### Sample output

<details>
<summary>test:smoke:portfolio</summary>

```
Running 5 tests using 3 workers

  ✓  1 [chromium] › tests/auth/auth.setup.ts:14:5 › login as standard_user (2.3s)
  ✓  2 [chromium] › tests/cart/cart.spec.ts:10:5 › cart: add items and verify totals (1.8s)
  ✓  3 [chromium] › tests/checkout/checkout.spec.ts:8:5 › checkout: full flow to confirmation (2.1s)
  ✓  4 [unauthenticated] › tests/network/api-mocking.spec.ts:6:5 › mock: intercepted responses return deterministic data (0.9s)
  ✓  5 [api] › tests/api/booking.spec.ts:12:5 › API: create, read, update, delete booking (1.4s)

  5 passed (9.2s)
```

</details>

<details>
<summary>test:chromium (full portfolio)</summary>

```
Running 18 tests using 5 workers

  ✓  1 [chromium] › tests/auth/auth.setup.ts:14:5 › login as standard_user (2.1s)
  ✓  2 [chromium] › tests/inventory/inventory.spec.ts:8:5 › inventory: page loads with products (1.5s)
  ✓  3 [chromium] › tests/inventory/sort.spec.ts:12:5 › inventory: sort by name ascending (1.8s)
  ✓  4 [chromium] › tests/inventory/sort.spec.ts:20:5 › inventory: sort by price ascending (1.6s)
  ✓  5 [chromium] › tests/cart/cart.spec.ts:10:5 › cart: add items and verify totals (1.7s)
  ✓  6 [chromium] › tests/checkout/checkout.spec.ts:8:5 › checkout: full flow to confirmation (2.0s)
  ✓  7 [unauthenticated] › tests/auth/login.spec.ts:10:5 › login: valid credentials (1.2s)
  ✓  8 [unauthenticated] › tests/auth/login.spec.ts:18:5 › login: invalid credentials shows error (0.9s)
  ✓  9 [unauthenticated] › tests/network/api-mocking.spec.ts:6:5 › mock: intercepted responses (0.8s)
  ✓ 10 [api] › tests/api/booking.spec.ts:12:5 › API: CRUD booking lifecycle (1.3s)
  ...

  18 passed (22.4s)
```

</details>

<details>
<summary>lint (tsc --noEmit)</summary>

```
> tsc --noEmit

✅ No type errors found.
```

</details>

### Cucumber BDD

Living-documentation style scenarios (login, cart tables, sort outlines) on the same Page Objects:

```bash
npm run test:cucumber
```

See [`docs/cucumber.md`](./docs/cucumber.md).

### Debugging & Allure

- Trace walkthrough: [`docs/debugging.md`](./docs/debugging.md)
- Allure: `npm run test:chromium && npm run allure:serve`

### Dedicated API framework and UI Scout

This Playwright suite keeps the browser side in view, while the dedicated API project handles deeper REST contracts and auth matrix work:

```bash
cd ../api-framework
npm install && npm test
```

The standalone UI crawl companion remains here as a sibling exploration project:

```bash
cd ../ui-scout
npm install && npm run scout:ui
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

## Troubleshooting

<details>
<summary>playwright install fails or browsers are missing</summary>

```bash
npx playwright install --with-deps chromium

# If system deps are missing on Ubuntu/Debian:
sudo apt-get install -y libglib2.0-0 libnss3 libnspr4 libdbus-1-3 \
  libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 \
  libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 \
  libcairo2 libasound2
```
</details>

<details>
<summary>Tests pass locally but fail on CI</summary>

- Ensure `npx playwright install --with-deps` runs before tests
- Check that `.auth/user.json` is generated by the setup project
- Verify upstream targets (Sauce Demo, Restful Booker) are not rate-limited
- Look for flaky patterns in GitHub Actions logs
</details>

<details>
<summary>Allure report won't generate</summary>

```bash
# Make sure allure-results exists after test run
ls allure-results/

# Generate and serve
npm run allure:serve
```
</details>

<details>
<summary>Visual snapshot mismatches</summary>

```bash
# Review the diff images, then update baselines if intentional
npm run test:visual:update
```
</details>

## Test Strategy

See [`docs/test-strategy.md`](./docs/test-strategy.md).

## CI

Workflow: `../.github/workflows/playwright.yml`

- `lint` → typecheck
- `chromium` → sharded portfolio (`chromium` + `unauthenticated` + `api`)
- `mobile` → Pixel 5 project
- `cucumber` → smoke BDD
- `allure` → merge shard results and publish Allure HTML
