import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class InventoryPage extends BasePage {
  private readonly title = this.page.locator('.title');
  private readonly cartLink = this.page.locator('[data-test="shopping-cart-link"]');
  private readonly cartBadge = this.page.locator('[data-test="shopping-cart-badge"]');
  private readonly sortSelect = this.page.locator('[data-test="product-sort-container"]');

  async expectLoaded(): Promise<void> {
    await this.expectUrlContains('inventory');
    await expect(this.title).toHaveText('Products');
  }

  private addToCartButton(productName: string) {
    const slug = productName.toLowerCase().replace(/\s+/g, '-');
    return this.page.locator(`[data-test="add-to-cart-${slug}"]`);
  }

  async addProductToCart(productName: string): Promise<void> {
    await this.addToCartButton(productName).click();
  }

  async expectCartCount(count: number): Promise<void> {
    if (count === 0) {
      await expect(this.cartBadge).toHaveCount(0);
      return;
    }
    await expect(this.cartBadge).toHaveText(String(count));
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }

  async sortBy(option: 'az' | 'za' | 'lohi' | 'hilo'): Promise<void> {
    await this.sortSelect.selectOption(option);
  }

  async getVisibleProductNames(): Promise<string[]> {
    return this.page.locator('.inventory_item_name').allTextContents();
  }
}
