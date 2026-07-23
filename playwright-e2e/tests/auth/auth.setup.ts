import { expect, test as setup } from '@playwright/test';
import path from 'path';
import { users } from '../../src/data/users';
import { LoginPage } from '../../src/pages/LoginPage';
import { InventoryPage } from '../../src/pages/InventoryPage';

const authFile = path.join(__dirname, '../../.auth/user.json');

/**
 * Runs once per worker graph via the `setup` project.
 * Downstream e2e projects load this storageState instead of logging in every test.
 */
setup('authenticate as standard user', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const inventoryPage = new InventoryPage(page);

  await loginPage.open();
  await loginPage.login(users.standard);
  await inventoryPage.expectLoaded();

  await page.context().storageState({ path: authFile });
  expect(authFile).toBeTruthy();
});
