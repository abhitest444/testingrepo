# UI Scout

Exploratory crawl tool for testers: discovers pages, flags UI / a11y / content / image / interaction issues, and writes a triage-friendly report + local dashboard.

Full reference: [docs/ui-scout.md](./docs/ui-scout.md)

## Quick start

```bash
cd ui-scout
npm install
npx playwright install chromium
npm run scout:demo          # showcase crawl (recommended for demos)
# open scout-report/scout-report.html
```

Dashboard (optional):

```bash
npm run scout:ui
# http://localhost:4177
```

## Demo script — how to present this (≈60s)

Use this talk track in interviews or portfolio walkthroughs.

### 1. Run the showcase scan

```bash
npm run scout:demo
```

Targets [the-internet.herokuapp.com](https://the-internet.herokuapp.com) with seed paths that deliberately hit broken images, JS errors, HTTP status codes, and forms.

### 2. Open the report

```bash
xdg-open scout-report/scout-report.html   # Linux
# or open scout-report/scout-report.html on macOS
```

### 3. What to say (talk track)

1. **Crawl ≠ scripted e2e** — Scout walks the app like a curious tester and finds pages/issues POM suites often miss.
2. **Top Actionable Findings** — start here; findings are scored by severity × category × how many pages they hit.
3. **Issue types to call out**
   - **broken-image** — failed / stretched / missing-alt assets
   - **console-error / page-error** — JS failures users feel as broken UX
   - **dead-end** — 404/500 or unreachable routes
   - **keyboard / tooltip / form-validation** — interaction smoke (tab focus, unnamed icons, invalid email/phone)
   - **a11y / content** — axe WCAG + title/heading/copy heuristics
   - **visual** — pixel regressions vs baselines (second run onward)
4. **How you’d hand off** — pick a serious finding → attach screenshot/URL/details → file a bug with repro path from the crawl.

### 4. Optional second demo (real product)

```bash
BASE_URL=https://staging.voiceyworld.com \
SCOUT_AUTH=none \
SCOUT_START_PATH=/ \
SCOUT_MAX_PAGES=10 \
SCOUT_VIEWPORTS=desktop \
npm run scout
```

Use this to show content polish, image hygiene, and visual regressions on a live site.

## Useful scripts

| Script | Purpose |
| --- | --- |
| `npm run scout:demo` | Showcase crawl on the-internet (many issue types) |
| `npm run scout` | Crawl current `BASE_URL` / Sauce Demo defaults |
| `npm run scout:ui` | Local dashboard to kick scans + browse reports |
| `npm run scout:baselines` | Refresh visual baselines |
| `npm run test:unit` | Heuristic unit tests (no live site) |
| `npm run lint` | Typecheck |

## Point at any site

```bash
BASE_URL=https://example.com \
SCOUT_AUTH=none \
SCOUT_START_PATH=/ \
SCOUT_MAX_PAGES=12 \
SCOUT_VIEWPORTS=desktop \
npm run scout
```

Auth modes and env vars: [docs/ui-scout.md](./docs/ui-scout.md).
