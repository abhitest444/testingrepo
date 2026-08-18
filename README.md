# QA Portfolio — Software Testing Showcase

![Node](https://img.shields.io/badge/Node-%3E%3D20-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![Playwright](https://img.shields.io/badge/Playwright-1.54-2EAD33)
![k6](https://img.shields.io/badge/k6-0.54-7A0099)
![Vitest](https://img.shields.io/badge/Vitest-4.x-729B1B)
![License](https://img.shields.io/badge/License-MIT-yellow)

5 years of QA (manual + automation). This repo is a living portfolio of testing craft: frameworks, CI, API, and performance work recruiters can clone and run.

> **Built to be runnable evidence, not slideware.**

---

## Tech Stack

| Layer | Tool | Purpose |
| --- | --- | --- |
| Browser automation | Playwright 1.54 + TypeScript | POM, fixtures, storageState, mocking |
| API testing (browser) | Playwright `request` | Quick API checks beside UI tests |
| API testing (dedicated) | Vitest + Zod | Contract schemas, auth matrix, negatives |
| Accessibility | axe-core 4.10 | WCAG violation detection |
| Visual regression | Playwright `toHaveScreenshot` | Pixel-diff baselines |
| BDD | Cucumber.js 13 | Gherkin living documentation |
| Performance | k6 0.54 | Smoke / load / stress / capacity |
| Reporting | Allure 3.10 + Playwright HTML | Stakeholder narratives + debug traces |
| CI/CD | GitHub Actions | Sharded Chromium, mobile, nightly |

## Architecture Overview

```
qa-portfolio/
├── playwright-e2e/     ← Browser + BDD + visual + a11y + Allure
│   ├── tests/              (auth, cart, checkout, inventory, network, visual, a11y, advanced)
│   ├── cucumber/           (Gherkin features + step definitions)
│   └── src/pages/          (Page Objects shared across all tests)
│
├── api-framework/      ← Dedicated REST API: Zod contracts, auth matrix, negatives
│   ├── src/                (typed HttpClient, schemas, clients, janitor, flakiness tracker)
│   └── tests/              (contract, lifecycle, negative, security, fault injection, Pact)
│
├── mock-api/           ← Deterministic mock server (fault injection, offline testing)
│   └── src/                (Express server, in-memory store, /slow, /flaky endpoints)
│
├── ui-scout/           ← Exploratory crawler: broken images, JS errors, a11y, visual diffs
│   ├── src/                (scrape engines, analyzers, report writer)
│   └── scout-report/       (HTML dashboard output)
│
└── performance/        ← k6: smoke / load / stress / booking lifecycle
    ├── lib/                (config, HTTP helpers, shared journeys)
    └── scenarios/          (individual k6 scripts)
```

**How the pieces fit together:**
- `playwright-e2e` covers browser workflows (login → cart → checkout) plus API smoke via `request`
- `api-framework` goes deeper on the same Restful Booker API: contract validation, authz matrix, negative status handling
- `ui-scout` complements scripted tests — crawls like a curious tester, finds what POM suites miss
- `performance` proves capacity: the same API that's tested for correctness is also load-tested for speed

## Prerequisites

| Requirement | Version | Install |
| --- | --- | --- |
| Node.js | ≥ 20 | [nodejs.org](https://nodejs.org/) |
| npm | ≥ 10 | comes with Node |
| Playwright browsers | — | `npx playwright install --with-deps chromium` |
| k6 (optional) | ≥ 0.54 | [grafana.com/docs/k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) |
| Docker (optional) | ≥ 20 | for k6 without local install |

## Projects

| Project | Focus | Stack | Status |
| --- | --- | --- | --- |
| [playwright-e2e](./playwright-e2e) | POM, storageState, API, mocking, a11y, visual, Allure, Cucumber, sharded CI | Playwright + TS | ✅ Active |
| [ui-scout](./ui-scout) | Standalone crawler: axe, content, images, interaction, visual diffs, dashboard | Playwright + TS | ✅ Active |
| [api-framework](./api-framework) | REST API: Zod contracts, auth matrix, negatives, janitor cleanup | Vitest + Zod | ✅ Active |
| [performance](./performance) | k6: smoke / load / stress / booking lifecycle + CI thresholds | k6 + Docker | ✅ Active |
| CI/CD | GitHub Actions: lint gate, sharded Chromium, mobile, Cucumber, Allure publish | GH Actions | ✅ Shipped |

## Start here

```bash
cd playwright-e2e
npm install
npx playwright install --with-deps chromium
npm run test:smoke:portfolio   # start here — login, cart, checkout, mock, API smoke
```

<details>
<summary>📋 Expected output (test:smoke:portfolio)</summary>

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

Then go broader:

```bash
npm run test:chromium          # full Chromium portfolio
npm run test:mobile            # Pixel 5 emulation
npm run test:a11y              # axe accessibility scans
npm run test:visual            # screenshot baseline diffs
npm run test:cucumber:smoke    # BDD Gherkin scenarios
npm run allure:serve           # stakeholder-friendly HTML report
```

## Recruiter-facing story

This repo is intentionally built to show signal, not noise:

- **Fast proof first** — `test:smoke:portfolio` shows auth, cart/checkout, network mocking, and API lifecycle in one short run
- **Maintainable structure** — page objects + shared fixtures (not copy-paste specs)
- **Realistic multi-project flow** — `storageState` setup feeding authenticated browser projects
- **Depth on demand** — mobile, accessibility, visual snapshots, clock/soft-assert demos, and Cucumber BDD in the same codebase
- **Reviewable outputs** — Playwright HTML reports, traces on failure, and Allure for stakeholder-friendly narrative

## Also try

```bash
# Dedicated API framework (Zod contracts / auth matrix)
cd api-framework && npm install && npm test

# UI Scout showcase crawl (broken images, JS errors, 404s, forms, a11y)
cd ui-scout && npm install && npx playwright install chromium
npm run scout:demo
# open scout-report/scout-report.html — start with "Top Actionable Findings"

# Performance (k6) — smoke + load against QuickPizza
cd performance
npm run demo          # needs local k6, or: npm run demo:docker
```

<details>
<summary>📋 Expected output (api-framework test)</summary>

```
 ✓ tests/contract/booking-schema.test.ts (6 tests) 1.2s
 ✓ tests/lifecycle/crud.smoke.test.ts (4 tests) 0.9s
 ✓ tests/negative/status-codes.test.ts (5 tests) 0.7s
 ✓ tests/negative/auth-matrix.test.ts (8 tests) 1.1s

 Test Files  4 passed (4)
      Tests  23 passed (23)
   Start at  10:32:15
   Duration  3.9s
```

</details>

<details>
<summary>📋 Expected output (performance smoke)</summary>

```
     data_received...........: 48 kB  2.4 kB/s
     data_sent...............: 12 kB  598 B/s
     http_req_blocked........: avg=1.2ms     min=0s       med=0s       max=15ms     p(90)=0s       p(95)=0s
     http_req_duration.......: avg=85ms      min=42ms     med=78ms     max=210ms    p(90)=120ms    p(95)=145ms
     http_req_failed.........: 0.00%  ✓ 0    ✗ 0
     http_reqs...............: 60     3.0/s

     ✓ http_req_duration p95 < 500ms
     ✓ http_req_failed < 5%
```

</details>

### How to present UI Scout (60s)

1. Run `npm run scout:demo` in `ui-scout`
2. Open the HTML report → **Top Actionable Findings**
3. Talk track: crawl finds what POM suites miss → triage by severity/score → hand off with URL + screenshot + details
4. Call out categories: images, console/JS errors, dead ends, keyboard/forms, a11y, content, visual

Full demo script: [ui-scout/README.md](./ui-scout/README.md)

## Skills roadmap

- [x] Playwright foundation (POM, fixtures, multi-browser, CI)
- [x] Playwright advanced (storageState, API client, network mocking, axe a11y, test.step)
- [x] Playwright deeper (visual snapshots, soft asserts, clock, mobile project, Allure, sharded CI)
- [x] Cucumber BDD (features, outlines, data tables, World, hooks)
- [x] UI Scout (crawl, axe, visual diffs, local dashboard)
- [x] CI patterns (lint gate, sharded Chromium, mobile + cucumber jobs, Allure artifact)
- [x] Dedicated API project (Vitest + Zod contracts, auth matrix, negatives, janitor cleanup)
- [x] Performance testing (k6 smoke / load / stress / booking lifecycle + CI gates)
- [x] LICENSE, badges, prerequisites, sample outputs, architecture docs
- [x] Mutation testing (Stryker: 97% score on api-framework, targeted test improvements)
- [x] Security baseline (HTTP headers, auth quirks, input sanitization, rate limiting)
- [x] Data-driven parameterized tests (auth matrix, validation edge cases, sort options)
- [x] Contract testing (Pact consumer-driven: consumer contracts + provider verification)
- [x] Mock API server (deterministic, offline testing with fault injection)
- [x] Flakiness tracking (test outcome history, quarantine rules)
- [x] Fault injection tests (timeout, error handling, concurrent resilience)
- [ ] Deeper CI (nightly Firefox/WebKit matrix, Scout schedule, Allure history)

## What this taught me

| Area | Lesson |
| --- | --- |
| Test architecture | storageState beats per-test login — one setup feeds all browser projects |
| API testing | Contract-first (Zod) catches shape drift before business logic fails |
| Performance | Smoke ≠ load ≠ stress — different questions need different VU profiles and thresholds |
| Exploratory tooling | Crawlers find what scripted tests miss — broken images, JS errors, dead ends |
| CI design | Sharding + parallel jobs (mobile, Cucumber) cut feedback time without losing coverage |
| Reporting | Allure for stakeholders, traces for engineers — two audiences, two outputs |
| Mutation testing | Coverage lies — Stryker found 6 test gaps that 100% line coverage missed |
| Contract testing | Consumer-driven contracts prove API compatibility before deploy |
| Security posture | Checking headers and auth quirks catches regressions early |
| Mock APIs | Deterministic tests run 10x faster and work offline |
| Fault injection | Resilience tests prove graceful degradation under failure |

## Troubleshooting

<details>
<summary>Playwright install fails</summary>

```bash
# Full deps (includes system libraries for Chromium)
npx playwright install --with-deps chromium

# If still failing on Ubuntu/Debian
sudo apt-get install -y libglib2.0-0 libnss3 libnspr4 libdbus-1-3 \
  libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 \
  libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 \
  libcairo2 libasound2
```
</details>

<details>
<summary>k6 not found (performance tests)</summary>

```bash
# Option A: install k6
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
  | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6

# Option B: use Docker instead
cd performance && npm run demo:docker
```
</details>

<details>
<summary>Tests fail on CI but pass locally</summary>

- Check if `npx playwright install --with-deps` runs in CI
- Verify `.auth/user.json` is generated by the setup project
- Ensure upstream targets (Sauce Demo, Restful Booker) are not rate-limited
- Check GitHub Actions logs for flaky test patterns
</details>

<details>
<summary>UI Scout report is empty</summary>

- Verify `BASE_URL` is reachable: `curl -sI $BASE_URL`
- Check `SCOUT_START_PATH` exists on the target site
- Run with `SCOUT_MAX_PAGES=3` first to isolate issues
</details>

---

## Author

**QA Engineer** — 5 years in manual + automation testing

- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your Name](https://linkedin.com/in/yourname)
- Email: your.email@example.com

> Replace the placeholders above with your real info.

---

Built to be **runnable evidence**, not slideware.

## License

[MIT](LICENSE)
