# Test Strategy

This project is designed to show practical SDET judgment: fast feedback for pull requests, broader regression confidence on demand, and clear separation between UI, API, accessibility, and network-risk checks.

## Suite Split

| Suite | Command | Purpose |
| --- | --- | --- |
| Type check | `npm run lint` | Catch TypeScript and framework contract errors before runtime. |
| Smoke | `npm run test:smoke` | Small, high-value checks for login, checkout, API auth, API lifecycle, and mocked UI behavior. |
| Chromium portfolio suite | `npm run test:chromium` | CI-friendly browser/API coverage without installing every browser. |
| API | `npm run test:api` | Validate REST workflows, status handling, and cleanup discipline. |
| Accessibility | `npm run test:a11y` | Run axe scans and attach full JSON reports for review. |
| UI Scout | `npm run test:scout` | Exploratory crawl across viewports; HTML/JSON report for broken links and UI defects. |
| Full local regression | `npm test` | Run all configured projects, including Firefox and WebKit (scout remains a separate project). |

## Risk Model

| Area | Main Risk | Coverage |
| --- | --- | --- |
| Authentication | Valid users blocked, invalid users accepted, sessions unstable | Positive/negative login tests plus `storageState` setup. |
| Cart and checkout | Revenue path broken | Add-to-cart, cart verification, and purchase completion smoke flow. |
| Inventory | Incorrect product ordering affects shopping decisions | Sort order assertions against visible product names. |
| API lifecycle | Contract drift, auth failure, stale test data | Create/read/update/delete flow with `finally` cleanup. |
| Network behavior | UI coupled to backend availability | `route.fulfill` success/failure tests and passthrough observation. |
| Accessibility | Critical WCAG regressions | axe scans with JSON artifacts and known demo-site debt isolated. |
| Navigation / UI polish | Broken links, dead ends, overflow, silent console errors | UI Scout crawl + HTML report (`docs/ui-scout.md`). |
| Exploratory / regression blind spots | Pages never covered by scripted flows | UI Scout crawl (on-demand; not a PR-blocking default). |

## CI Quality Gates

The CI suite prioritizes reliable, reviewable feedback:

- Install dependencies with `npm ci`.
- Typecheck with `npm run lint`.
- Run the Chromium portfolio suite for browser, unauthenticated, network, and API coverage.
- Upload Playwright HTML reports as artifacts.
- Keep traces, screenshots, and videos for failure investigation.
- Keep UI Scout out of the default PR job (run via `npm run test:scout` or a scheduled workflow later).

Future upgrades worth adding:

- Split API, a11y, and browser suites into separate jobs.
- Add browser matrix coverage for nightly or release branches.
- Schedule UI Scout on a nightly workflow and publish `scout-report/`.
- Publish the Playwright HTML report or Allure report for easier reviewer access.
- Add JSON schema validation for API responses.
