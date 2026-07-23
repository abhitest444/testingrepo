import { expect, test } from '../../src/fixtures/test.fixture';
import { users } from '../../src/data/users';

test.describe('Authentication', () => {
  test('standard user can log in @smoke', async ({ loginPage, inventoryPage }) => {
    await loginPage.open();
    await loginPage.login(users.standard);
    await inventoryPage.expectLoaded();
  });

  test('locked out user sees an error', async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.login(users.locked);
    await loginPage.expectStillOnLogin();
    await loginPage.expectErrorContains('Sorry, this user has been locked out');
  });

  test('invalid credentials are rejected', async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.login({ username: 'not_a_user', password: 'wrong' });
    await loginPage.expectErrorContains('Username and password do not match');
  });

  test('empty username shows validation error', async ({ loginPage, page }) => {
    await loginPage.open();
    await page.locator('[data-test="login-button"]').click();
    await loginPage.expectErrorContains('Username is required');
  });
});
