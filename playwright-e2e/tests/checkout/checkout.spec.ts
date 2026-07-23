import { test } from '../../src/fixtures/test.fixture';
import { products } from '../../src/data/users';

test.describe('Checkout', () => {
  test('completes purchase for one item @smoke', async ({
    authenticatedPage,
    cartPage,
    checkoutPage,
  }) => {
    await test.step('Add product to cart', async () => {
      await authenticatedPage.addProductToCart(products.backpack);
      await authenticatedPage.expectCartCount(1);
    });

    await test.step('Open cart and start checkout', async () => {
      await authenticatedPage.openCart();
      await cartPage.expectLoaded();
      await cartPage.expectItemVisible(products.backpack);
      await cartPage.proceedToCheckout();
    });

    await test.step('Submit customer info and finish', async () => {
      await checkoutPage.fillInfo({
        firstName: 'Ada',
        lastName: 'Lovelace',
        postalCode: '10001',
      });
      await checkoutPage.finish();
      await checkoutPage.expectOrderComplete();
    });
  });
});
