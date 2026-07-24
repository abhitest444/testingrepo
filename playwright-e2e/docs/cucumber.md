# Cucumber BDD (Playwright)

Gherkin features run through `@cucumber/cucumber` with a custom Playwright **World**, reusing the same Page Objects as the Playwright Test suite.

## Why both Playwright Test and Cucumber?

| Layer | Role |
| --- | --- |
| Playwright Test | Fast, typed suite for CI (fixtures, projects, storageState) |
| Cucumber | Living documentation + BDD collaboration patterns (features, outlines, tables) |

Same Page Objects power both — BDD does not fork the automation model.

## What this demonstrates

- Feature / Scenario / **Background**
- **Scenario Outline** + Examples
- **Data tables** (`DataTable.hashes()`)
- Custom **parameter types** (`{userRole}`, `{sortOption}`)
- Custom **World** (Playwright browser + page objects)
- **Hooks** (`Before` / `After`) with failure screenshots
- **Tags** (`@smoke`, `@cucumber`)

## Layout

```text
cucumber/
├── features/
│   ├── auth/login.feature
│   ├── cart/add-to-cart.feature
│   └── inventory/sort.feature
├── steps/
│   ├── auth.steps.ts
│   ├── cart.steps.ts
│   └── inventory.steps.ts
└── support/
    ├── world.ts
    ├── hooks.ts
    └── parameter-types.ts
cucumber.js                 # runner config
```

## Run

```bash
npm run test:cucumber              # all BDD scenarios
npm run test:cucumber:smoke        # @smoke and @cucumber
HEADED=true npm run test:cucumber  # watch the browser
```

HTML report: `cucumber-report/index.html`  
Failure screenshots: `cucumber-report/artifacts/`

## Interview talking points

1. Steps stay thin — assertions and selectors live in Page Objects.
2. World is the DI container for scenario state (browser, pages).
3. Outlines + tables keep examples in the feature (readable for PMs/BAs).
4. Cucumber is opt-in (`npm run test:cucumber`); Playwright Test remains the default CI path.
