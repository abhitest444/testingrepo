import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class CartPage extends BasePage {
  private readonly title = this.page.locator('.title');
  private readonly checkoutButton = this.page.locator('[data-test="checkout"]');
  private readonly cartItems = this.page.locator('.cart_item');

  async expectLoaded(): Promise<void> {
    await this.expectUrlContains('cart');
    await expect(this.title).toHaveText('Your Cart');
  }

  async expectItemVisible(productName: string): Promise<void> {
    await expect(this.page.getByText(productName, { exact: true })).toBeVisible();
  }

  async expectItemCount(count: number): Promise<void> {
    await expect(this.cartItems).toHaveCount(count);
  }

  async proceedToCheckout(): Promise<void> {
    await this.checkoutButton.click();
  }
}
