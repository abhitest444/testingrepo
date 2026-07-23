# UI Scout

Exploratory crawl helper for testers. It walks the app like a curious user, then flags UI and navigation problems across viewports (and optionally browsers).

## What it checks

| Check | Examples |
| --- | --- |
| Broken links | Same-origin `a[href]` returning 4xx/5xx or failing to load |
| Dead ends | Navigation failures, error HTTP status, pages with no internal exits |
| Console / page errors | `console.error`, uncaught exceptions |
| Network failures | Failed document, CSS, JS, image, or font responses |
| Broken images | `<img>` with `naturalWidth === 0` |
| Layout | Horizontal overflow past the viewport |
| Interactive targets | Tiny clickables, buttons with no name |

## Run

```bash
# Chromium + mobile / tablet / desktop (default)
npm run scout

# Also Firefox + WebKit
npm run scout:browsers

# Narrow viewports
SCOUT_VIEWPORTS=desktop npm run scout

# Point at another start path / limit crawl depth
SCOUT_START_PATH=/inventory.html SCOUT_MAX_PAGES=15 npm run scout
```

Open the report:

```bash
# macOS
open scout-report/scout-report.html

# Linux
xdg-open scout-report/scout-report.html
```

JSON is written beside it at `scout-report/scout-report.json`. Screenshots land in `scout-report/screenshots/`.

## Auth

Scout uses the same `storageState` as e2e (`setup` project → `.auth/user.json`), so it starts already logged in on Sauce Demo.

Logout links are excluded by default (`SCOUT_EXCLUDE=logout`) so the crawl does not destroy the session mid-run.

## Soft vs hard failures

- **Critical / serious** issues fail the Playwright test (broken links, console errors, dead navigations, broken images).
- **Moderate / minor** issues are recorded in the HTML report only (overflow, tiny targets, sparse link graphs).

That keeps the tool useful on imperfect demo apps while still gating real regressions in CI if you add `npm run scout` to a nightly job.

## Interview talking points

1. **Crawl ≠ scripted e2e** — discovers pages you forgot to cover with POM tests.
2. **Viewport matrix** — same crawl at 390 / 768 / 1440 catches responsive layout bugs.
3. **Browser matrix** — `scout:browsers` surfaces engine-specific console or rendering issues.
4. **Actionable report** — severity + category + page URL + details for a manual tester to reproduce.
