import { expect, test } from '../../src/fixtures/test.fixture';
import { products } from '../../src/data/users';

/**
 * Soft assertions collect multiple UI defects in one run instead of failing
 * on the first mismatch — useful for form/page audits.
 */
test.describe('Soft assertions', () => {
  test('inventory shell exposes expected chrome @soft', async ({ authenticatedPage, page }) => {
    void authenticatedPage;

    await expect.soft(page.locator('.title'), 'products heading').toHaveText('Products');
    await expect.soft(page.getByTestId('shopping-cart-link'), 'cart link').toBeVisible();
    await expect.soft(page.getByTestId('product-sort-container'), 'sort control').toBeVisible();
    await expect.soft(page.locator('.inventory_item'), 'product grid').toHaveCount(6);
    await expect
      .soft(page.getByText(products.backpack, { exact: true }), 'flagship product')
      .toBeVisible();

    // Playwright fails the test at the end if any soft assertion failed.
  });
});
