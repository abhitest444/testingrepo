# Debugging with Playwright Trace Viewer

When a test fails, Playwright keeps a **trace** (DOM snapshots, network, console, actions).
This suite uses `trace: 'retain-on-failure'` in `playwright.config.ts`.

## Open a local failure trace

```bash
cd playwright-e2e
npm run test:e2e          # or any failing suite
npx playwright show-trace test-results/**/trace.zip
```

Or from the HTML report: open `npm run report` → failed test → **Trace**.

## What to look for (interview walkthrough)

1. **Action timeline** — which click/fill timed out?
2. **Before/after snapshots** — was the element covered / not yet rendered?
3. **Network tab** — 401/500/aborted calls that explain an empty UI?
4. **Console** — app errors vs test assertion mistakes?
5. **Source** — confirm the locator you intended actually matched.

## CI artifacts

GitHub Actions uploads `test-results/` and `playwright-report/` per shard.
Download the artifact, unzip, then:

```bash
npx playwright show-trace path/to/trace.zip
```

## Allure

Allure aggregates steps, attachments, and history-friendly results:

```bash
npm run test:chromium
npm run allure:serve     # generate + open
```

Traces remain the best **interactive** debug tool; Allure is the best **suite narrative** for stakeholders.
