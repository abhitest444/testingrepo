# Test Strategy

This project is designed to show practical SDET judgment: fast feedback for pull requests, broader regression confidence on demand, and clear separation between UI, API, accessibility, and network-risk checks.

## Suite Split

| Suite | Command | Purpose |
| --- | --- | --- |
| Type check | `npm run lint` | Catch TypeScript and framework contract errors before runtime. |
| Smoke | `npm run test:smoke` | Small, high-value checks for login, checkout, API auth, API lifecycle, and mocked UI behavior. |
| Chromium portfolio suite | `npm run test:chromium` | CI-friendly browser/API coverage without installing every browser. |
| Mobile | `npm run test:mobile` | Pixel 5 device emulation for layout/touch risk. |
| Visual | `npm run test:visual` | Playwright screenshot baselines (`toHaveScreenshot`). |
| Advanced | `npm run test:advanced` | Soft assertions, clock control, and visual demos. |
| API | `npm run test:api` | Validate REST workflows, status handling, and cleanup discipline. |
| Accessibility | `npm run test:a11y` | Run axe scans and attach full JSON reports for review. |
| Cucumber BDD | `npm run test:cucumber` | Gherkin scenarios (outlines, tables, tags) on shared Page Objects. |
| Allure | `npm run allure:serve` | Stakeholder-friendly report from `allure-results/`. |
| UI Scout | `cd ../ui-scout && npm run scout` | Standalone crawl / axe / visual tooling (sibling project). |
| Full local regression | `npm test` | All configured projects, including Firefox, WebKit, and mobile. |

## Risk Model

| Area | Main Risk | Coverage |
| --- | --- | --- |
| Authentication | Valid users blocked, invalid users accepted, sessions unstable | Positive/negative login tests plus `storageState` setup; Cucumber login outlines. |
| Cart and checkout | Revenue path broken | Add-to-cart, cart verification, and purchase completion smoke flow; Cucumber cart data tables. |
| Inventory | Incorrect product ordering affects shopping decisions | Sort order assertions against visible product names. |
| Responsive / mobile | Layout or touch issues on small viewports | `mobile-chrome` (Pixel 5) project. |
| Visual regressions | Unintended UI chrome changes | Playwright screenshot baselines on login + inventory header. |
| Time-dependent UI | Flaky waits on timers / “now” | `page.clock` demos in `tests/advanced/clock.spec.ts`. |
| API lifecycle | Contract drift, auth failure, stale test data | Create/read/update/delete flow with `finally` cleanup. |
| Network behavior | UI coupled to backend availability | `route.fulfill` success/failure tests and passthrough observation. |
| Accessibility | Critical WCAG regressions | axe scans with JSON artifacts and known demo-site debt isolated. |
| Navigation / UI polish | Broken links, dead ends, overflow, silent console errors | UI Scout crawl + HTML report (sibling project). |

## CI Quality Gates

- `lint` job typechecks before any browser work.
- Chromium portfolio runs as **2 shards** for faster PR feedback.
- Mobile and Cucumber smoke run as parallel jobs.
- Upload Playwright HTML reports, `test-results/` (traces), and Allure artifacts.
- `trace: retain-on-failure` so every failed attempt is debuggable — see [`debugging.md`](./debugging.md).

Future upgrades worth adding:

- Nightly Firefox/WebKit matrix.
- Schedule UI Scout and publish reports.
- JSON schema validation in a dedicated API project.
- Allure history/trends via persistent CI storage.
