import { DataTable, Then, When } from '@cucumber/cucumber';
import type { PlaywrightWorld } from '../support/world';

When(
  'I add {string} to the cart',
  async function (this: PlaywrightWorld, productName: string) {
    await this.inventoryPage.addProductToCart(productName);
  },
);

When(
  'I add the following products to the cart:',
  async function (this: PlaywrightWorld, table: DataTable) {
    const rows = table.hashes() as { product: string }[];
    for (const row of rows) {
      await this.inventoryPage.addProductToCart(row.product);
    }
  },
);

When('I open the cart', async function (this: PlaywrightWorld) {
  await this.inventoryPage.openCart();
});

Then(
  'the cart badge should show {int}',
  async function (this: PlaywrightWorld, count: number) {
    await this.inventoryPage.expectCartCount(count);
  },
);

Then('I should see the cart page', async function (this: PlaywrightWorld) {
  await this.cartPage.expectLoaded();
});

Then(
  'the cart should contain:',
  async function (this: PlaywrightWorld, table: DataTable) {
    const rows = table.hashes() as { product: string }[];
    await this.cartPage.expectItemCount(rows.length);
    for (const row of rows) {
      await this.cartPage.expectItemVisible(row.product);
    }
  },
);
