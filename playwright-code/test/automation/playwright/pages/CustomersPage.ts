import { expect, Locator, Page } from '@playwright/test';

/**
 * QBO Customer Center — deactivate test customers created from Assignments / Time flows.
 */
export default class CustomersPage {
  private readonly page: Page;
  private readonly customerCenterUrl = '/app/customers?jobId=customers';

  constructor(page: Page) {
    this.page = page;
  }

  customerNameButton(name: string): Locator {
    return this.page.getByRole('button', { name, exact: true }).first();
  }

  /** Row control that opens the customer overflow / actions menu (QBO shell wording varies). */
  private rowCustomerActionsTrigger(row: Locator): Locator {
    return row
      .getByRole('button', { name: 'Expand Menu' })
      .or(row.getByRole('button', { name: /^Action$/i }))
      .or(row.getByRole('button', { name: /^Actions$/i }))
      .first();
  }

  async gotoCustomerCenter(): Promise<void> {
    await this.page.goto(this.customerCenterUrl, { waitUntil: 'load' });
    await this.page.waitForLoadState('load');
  }

  /**
   * Customers list → row for `customerName` → row actions menu → Make inactive → Yes (if shown).
   * Uses a larger viewport + slight page zoom-out so long menus stay on-screen (same idea as other teardown flows).
   */
  async makeCustomerInactive(customerName: string): Promise<void> {
    const previousViewport = this.page.viewportSize();
    await this.page.setViewportSize({ width: 1920, height: 1200 });

    try {
      await this.page.evaluate(() => {
        document.documentElement.style.setProperty('zoom', '0.85');
      });

      await this.gotoCustomerCenter();

      const row = this.page
        .getByRole('row')
        .filter({ has: this.customerNameButton(customerName) })
        .first();

      await expect(row).toBeVisible({ timeout: 30_000 });
      await row.scrollIntoViewIfNeeded();

      const actionsTrigger = this.rowCustomerActionsTrigger(row);
      await actionsTrigger.click({ force: true, timeout: 15_000 });

      const makeInactive = this.page.getByRole('menuitem', {
        name: /Make inactive/i,
      });
      await makeInactive.scrollIntoViewIfNeeded();
      await expect(makeInactive).toBeVisible({ timeout: 15_000 });
      await makeInactive.click();

      const yes = this.page.getByRole('button', { name: 'Yes' });
      if (await yes.isVisible().catch(() => false)) {
        await yes.click();
      }

      await expect(this.customerNameButton(customerName)).toBeHidden({
        timeout: 25_000,
      });
    } finally {
      await this.page
        .evaluate(() => {
          document.documentElement.style.removeProperty('zoom');
        })
        .catch(() => {});
      if (previousViewport) {
        await this.page.setViewportSize(previousViewport);
      }
    }
  }
}
