import { test as base, expect } from '@playwright/test';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { InventoryPage } from '../pages/InventoryPage';
import { LoginPage } from '../pages/LoginPage';

type Pages = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
};

type Auth = {
  /**
   * Assumes storageState from the setup project.
   * Opens inventory ready for product actions — no UI login per test.
   */
  authenticatedPage: InventoryPage;
};

/**
 * Custom fixtures keep tests thin: pages are injected; auth comes from storageState.
 */
export const test = base.extend<Pages & Auth>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
  authenticatedPage: async ({ page }, use) => {
    const inventoryPage = new InventoryPage(page);
    await page.goto('/inventory.html');
    await inventoryPage.expectLoaded();
    await use(inventoryPage);
  },
});

export { expect };
