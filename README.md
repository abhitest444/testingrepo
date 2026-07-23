# QA Portfolio — Software Testing Showcase

5 years of QA (manual + automation). This repo is a living portfolio of testing craft: frameworks, CI, API, and performance work recruiters can clone and run.

## Projects

| Project | Focus | Status |
| --- | --- | --- |
| [playwright-e2e](./playwright-e2e) | Playwright + TS: POM, storageState, API, mocking, a11y, UI Scout, CI | Active |
| Dedicated API framework | Contract/schema REST automation beyond Playwright request | Planned |
| Performance | k6 load & thresholds | Planned |
| CI/CD deep dive | Pipelines, sharding, quality gates | In progress (see Playwright workflow) |

## Start here

```bash
cd playwright-e2e
npm install
npx playwright install --with-deps chromium
npm run test:chromium   # recommended first run (setup + e2e + login/network + api)
```

## Skills roadmap

- [x] Playwright foundation (POM, fixtures, multi-browser, CI)
- [x] Playwright advanced (storageState, API client, network mocking, axe a11y, test.step)
- [x] UI Scout (multi-viewport crawl, broken links, dead ends, UI heuristics)
- [ ] Dedicated API project (beyond Playwright request)
- [ ] Performance testing
- [ ] Broader CI/CD patterns (sharding, quality gates)

---

Built to be **runnable evidence**, not slideware.
