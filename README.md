# QA Portfolio — Software Testing Showcase

5 years of QA (manual + automation). This repo is a living portfolio of testing craft: frameworks, CI, API, and performance work recruiters can clone and run.

## Projects

| Project | Focus | Status |
| --- | --- | --- |
| [playwright-e2e](./playwright-e2e) | Playwright + TS: POM, storageState, API, mocking, a11y, visual, Allure, Cucumber, sharded CI | Active |
| [ui-scout](./ui-scout) | Standalone UI Scout: crawl, axe, content, images, interaction, visual diffs, dashboard | Active |
| [api-framework](./api-framework) | Dedicated REST API tests: Zod contracts, auth matrix, negatives, cleanup | Active |
| [performance](./performance) | k6: smoke / load / stress / booking lifecycle + CI thresholds | Active |
| CI/CD deep dive | Pipelines, sharding, quality gates | Active (see Playwright workflow; nightly matrix still planned) |

## Start here

```bash
cd playwright-e2e
npm install
npx playwright install --with-deps chromium
npm run test:smoke:portfolio   # start here — login, cart, checkout, mock, API smoke
npm run test:chromium          # then go broader (full Chromium portfolio)
```

`test:smoke:portfolio` is the short demo path. Mobile, a11y, visual, Cucumber, and Allure live in the same project — run them next when you want depth:

```bash
npm run test:mobile
npm run test:a11y
npm run test:visual
npm run test:cucumber:smoke
npm run allure:serve
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
- [ ] Deeper CI (nightly Firefox/WebKit matrix, Scout schedule, Allure history)

---

Built to be **runnable evidence**, not slideware.
