import { test } from '../../src/fixtures/test.fixture';
import { products } from '../../src/data/users';

test.describe('Cart', () => {
  test('adds a product and shows cart badge @smoke', async ({
    authenticatedPage,
    cartPage,
  }) => {
    await authenticatedPage.addProductToCart(products.backpack);
    await authenticatedPage.expectCartCount(1);

    await authenticatedPage.openCart();
    await cartPage.expectLoaded();
    await cartPage.expectItemVisible(products.backpack);
    await cartPage.expectItemCount(1);
  });

  test('adds multiple products', async ({ authenticatedPage, cartPage }) => {
    await authenticatedPage.addProductToCart(products.backpack);
    await authenticatedPage.addProductToCart(products.bikeLight);
    await authenticatedPage.expectCartCount(2);

    await authenticatedPage.openCart();
    await cartPage.expectItemCount(2);
    await cartPage.expectItemVisible(products.backpack);
    await cartPage.expectItemVisible(products.bikeLight);
  });
});
