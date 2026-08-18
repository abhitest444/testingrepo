import { expect, test } from '../../src/fixtures/test.fixture';
import { users } from '../../src/data/users';

/**
 * Data-driven login tests — demonstrate parameterized testing in Playwright.
 *
 * Playwright doesn't have built-in test.each like Vitest, so we use
 * describe blocks with data arrays to achieve the same effect.
 *
 * Pattern: iterate over a scenarios array, each entry becomes a test case.
 * Why: adding a login scenario = adding one object to the array.
 */

type LoginScenario = {
  label: string;
  username: string;
  password: string;
  expectSuccess: boolean;
  expectError?: string;
};

const loginScenarios: LoginScenario[] = [
  {
    label: 'standard user → inventory page',
    username: users.standard.username,
    password: users.standard.password,
    expectSuccess: true,
  },
  {
    label: 'locked user → locked out error',
    username: users.locked.username,
    password: users.locked.password,
    expectSuccess: false,
    expectError: 'Sorry, this user has been locked out',
  },
  {
    label: 'problem user → inventory page (quirky behavior)',
    username: users.problem.username,
    password: users.problem.password,
    expectSuccess: true,
  },
  {
    label: 'non-existent user → credential mismatch',
    username: 'ghost_user',
    password: 'secret_sauce',
    expectSuccess: false,
    expectError: 'Username and password do not match',
  },
  {
    label: 'empty username → username required',
    username: '',
    password: 'secret_sauce',
    expectSuccess: false,
    expectError: 'Username is required',
  },
  {
    label: 'empty password → password required',
    username: 'standard_user',
    password: '',
    expectSuccess: false,
    expectError: 'Password is required',
  },
  {
    label: 'both empty → username required (checked first)',
    username: '',
    password: '',
    expectSuccess: false,
    expectError: 'Username is required',
  },
  {
    label: 'SQL injection attempt → credential mismatch',
    username: "admin' OR '1'='1",
    password: "' OR '1'='1",
    expectSuccess: false,
    expectError: 'Username and password do not match',
  },
  {
    label: 'very long username → credential mismatch',
    username: 'A'.repeat(500),
    password: 'secret_sauce',
    expectSuccess: false,
    expectError: 'Username and password do not match',
  },
];

test.describe('Data-driven — login scenarios @smoke', () => {
  for (const scenario of loginScenarios) {
    test(scenario.label, async ({ loginPage, inventoryPage, page }) => {
      await loginPage.open();

      if (scenario.username) {
        await page.locator('[data-test="username"]').fill(scenario.username);
      }
      if (scenario.password) {
        await page.locator('[data-test="password"]').fill(scenario.password);
      }
      await page.locator('[data-test="login-button"]').click();

      if (scenario.expectSuccess) {
        await inventoryPage.expectLoaded();
      } else {
        await loginPage.expectStillOnLogin();
        if (scenario.expectError) {
          await loginPage.expectErrorContains(scenario.expectError);
        }
      }
    });
  }
});

// ─── Sort data matrix ─────────────────────────────────────

type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

type SortScenario = {
  label: string;
  sortValue: SortOption;
  firstExpected: string;
};

const sortScenarios: SortScenario[] = [
  {
    label: 'Name (A to Z) → first item is Bike Light',
    sortValue: 'az',
    firstExpected: 'Sauce Labs Bike Light',
  },
  {
    label: 'Name (Z to A) → first item is T-Shirt (Red)',
    sortValue: 'za',
    firstExpected: 'Test.allTheThings() T-Shirt (Red)',
  },
  {
    label: 'Price (low to high) → first item is Bike Light',
    sortValue: 'lohi',
    firstExpected: 'Sauce Labs Bike Light',
  },
  {
    label: 'Price (high to low) → first item is Jacket',
    sortValue: 'hilo',
    firstExpected: 'Sauce Labs Fleece Jacket',
  },
];

test.describe('Data-driven — sort options', () => {
  for (const scenario of sortScenarios) {
    test(scenario.label, async ({ loginPage, inventoryPage }) => {
      await loginPage.open();
      await loginPage.login(users.standard);
      await inventoryPage.expectLoaded();

      await inventoryPage.sortBy(scenario.sortValue);
      const names = await inventoryPage.getVisibleProductNames();
      expect(names.length).toBeGreaterThan(0);
      expect(names[0]).toBe(scenario.firstExpected);
    });
  }
});
