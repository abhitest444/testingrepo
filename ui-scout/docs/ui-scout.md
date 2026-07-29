# UI Scout

Exploratory crawl helper for testers. It walks the app like a curious user, then flags UI and navigation problems across viewports (and optionally browsers).

## What it checks

| Check | Examples |
| --- | --- |
| Broken links | Same-origin probes by default; external probes opt-in (`SCOUT_PROBE_EXTERNAL`) |
| Dead ends | Navigation failures, hard HTTP errors, empty navigation graphs |
| SPA soft-404 | Host 404 while the app still renders (common on GitHub Pages) — recorded as minor |
| Console / page errors | `console.error`, uncaught exceptions |
| Network failures | Failed document, CSS, JS, image, or font responses |
| Image quality | Broken load, stretched/squashed aspect ratio, upscaled pixelation, missing alt on large images; skips lazy/off-screen thumbnails |
| Layout | Horizontal overflow past the viewport |
| Interactive targets | Tiny clickables, buttons with no name |
| Interaction quality | Sampled keyboard tab flow, icon-label/tooltip hints, common email/phone/required validation |
| Content / copy | Title issues, typos, placeholders, double spaces, heading hierarchy |
| Accessibility | axe-core WCAG 2 A/AA on every crawled page |
| Visual diffs | Viewport screenshots vs `scout-baselines/` (pixelmatch), with optional masked dynamic selectors |

Discovery is SPA-aware: seed paths + click probes for `href="#"` controls (Sauce Demo style), not only classic `<a href="/path">` crawls.

## Noise reduction (defaults)

- **External link probes off** — social/CDN false positives avoided (`SCOUT_PROBE_EXTERNAL=false`).
- **Social hosts skipped** when external probes are on — unless `SCOUT_PROBE_SOCIAL=true`.
- **Cross-page dedupe** — footer/header repeats collapse to one row (`SCOUT_DEDUPE=true`).
- **Visual baselines** — first-run baseline creation is not reported as an issue.

## Showcase demo (recommended for interviews)

```bash
npm run scout:demo
# open scout-report/scout-report.html
```

Crawls [the-internet.herokuapp.com](https://the-internet.herokuapp.com) with seed paths for broken images, JS errors, HTTP status codes, and forms so the report shows many issue types in one pass. See [README.md](../README.md#how-to-present-ui-scout-60s) for the portfolio summary and [ui-scout README](./README.md) for the full talk track.

## Local dashboard (recommended)

```bash
npm run scout:ui
# open http://localhost:4177
```

From the UI you can pick viewports, toggle axe / visual diffs, update baselines, watch the live log, and browse findings + screenshots.

## Point Scout at any website

```bash
# Public site (no login)
BASE_URL=https://example.com \
SCOUT_AUTH=none \
SCOUT_START_PATH=/ \
SCOUT_MAX_PAGES=10 \
SCOUT_VIEWPORTS=desktop \
npm run scout

# App with a login form
BASE_URL=https://your-app.example.com \
SCOUT_AUTH=form \
SCOUT_LOGIN_PATH=/login \
SCOUT_USERNAME=qa.user \
SCOUT_PASSWORD=secret \
SCOUT_USER_SELECTOR='input[name=email]' \
SCOUT_PASSWORD_SELECTOR='input[name=password]' \
SCOUT_SUBMIT_SELECTOR='button[type=submit]' \
SCOUT_SUCCESS_URL=dashboard \
SCOUT_START_PATH=/dashboard \
npm run scout
```

| Variable | Purpose |
| --- | --- |
| `BASE_URL` | Website origin |
| `SCOUT_START_PATH` | First path to open (not a full URL) |
| `SCOUT_AUTH` | `none` \| `form` \| `sauce` (auto if unset) |
| `SCOUT_LOGIN_PATH` | Login page path for `form` mode |
| `SCOUT_USER_SELECTOR` / `SCOUT_PASSWORD_SELECTOR` | Form field selectors |
| `SCOUT_SUBMIT_SELECTOR` | Login button (default `button[type=submit]`) |
| `SCOUT_SUCCESS_URL` / `SCOUT_SUCCESS_SELECTOR` | Optional post-login wait |
| `SCOUT_CONTENT` | Copy / grammar heuristics (default `true`) |
| `SCOUT_INTERACTION` | Keyboard/tab, tooltip, form validation heuristics (default `true`) |
| `SCOUT_MAX_TAB_STOPS` | Tabbing sample length per page (default `20`) |
| `SCOUT_MAX_FORM_PROBES` | Max form fields to probe per page (default `4`) |
| `SCOUT_MAX_TOOLTIP_PROBES` | Max icon/unnamed controls to inspect per page (default `10`) |
| `SCOUT_VISUAL_MASK` | Comma-separated selectors to mask in screenshots (dynamic carousels, timestamps) |
| `SCOUT_PROBE_EXTERNAL` | Probe external links (default `false`) |
| `SCOUT_PROBE_SOCIAL` | Include Instagram/X/etc. when probing external (default `false`) |
| `SCOUT_DEDUPE` | Collapse repeat findings across pages (default `true`) |

## CLI

```bash
# Chromium + mobile / tablet / desktop (default Sauce Demo + sauce auth)
npm run scout

# Also Firefox + WebKit
npm run scout:browsers

# Create / refresh visual baselines
npm run scout:baselines

# Narrow viewports
SCOUT_VIEWPORTS=desktop npm run scout

# Point at another start path / limit crawl depth
SCOUT_START_PATH=/inventory.html SCOUT_MAX_PAGES=15 npm run scout
```

Scout uses `playwright.scout.config.ts` so it stays out of the default `npm test` run.

Open the static report:

```bash
# macOS
open scout-report/scout-report.html

# Linux
xdg-open scout-report/scout-report.html
```

JSON is at `scout-report/scout-report.json`. Screenshots: `scout-report/screenshots/`. Diffs: `scout-report/diffs/`. Baselines: `scout-baselines/`.

## Auth

Scout auth is separate from e2e (`tests/auth/scout.auth.setup.ts` → `.auth/user.json`).

| Mode | When |
| --- | --- |
| `sauce` | Default on Sauce Demo — uses the POM login |
| `none` | Public sites — empty storageState |
| `form` | Any app — fill login form via selectors |
| auto | `form` if username+user selector set; else `sauce` on Sauce Demo; else `none` |

Logout / reset links are excluded by default (`SCOUT_EXCLUDE=logout,reset,sign-out`) so the crawl does not destroy the session mid-run.

## Soft vs hard failures

- **Critical** issues always fail the Playwright test (except axe — see below).
- **Serious** non-a11y issues fail the test.
- **Axe findings** are always recorded; they fail the run only when `SCOUT_A11Y_STRICT=true` (demo sites like Sauce Demo have known a11y debt).
- **Moderate / minor** stay in the report / dashboard only (overflow, soft-404s, blocked social probes).

## Interview talking points

1. **Crawl ≠ scripted e2e** — discovers pages you forgot to cover with POM tests.
2. **Viewport matrix** — same crawl at 390 / 768 / 1440 catches responsive layout bugs.
3. **Content + image heuristics** — catches copy debt and stretched assets without manual pass.
4. **Axe + visual in one pass** — accessibility and pixel regressions without a separate suite wiring.
5. **Tester-facing UI** — non-automation folks can kick off scans and triage findings without CLI.
