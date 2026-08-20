import { Page, Locator, expect } from '@playwright/test';

/**
 * Page object for the QBO "Dimensions" list (Settings gear → Lists → Dimensions,
 * route /app/class) and the dimension detail + Payroll dimension defaults pages.
 *
 * This is a QBO-shell surface (not rendered by this repo), so selectors are the
 * live DOM ones confirmed against the IES env — not repo test-ids.
 */
export default class DimensionsListPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Settings gear → Lists → Dimensions, then wait for the list page. */
  async openViaSettingsMenu(): Promise<void> {
    await this.page.locator('button[data-id="settings"]').click();
    await this.page.locator('a[data-id="classes"]').click();
    await this.page
      .locator(`xpath=//*[text()='Classes']`)
      .first()
      .waitFor({ state: 'visible', timeout: 30000 });
  }

  /** The dimension card/title on the list page, matched by exact name. */
  dimensionByName(name: string): Locator {
    return this.page.getByText(name, { exact: true }).first();
  }

  async assertDimensionVisible(name: string): Promise<void> {
    await expect(this.dimensionByName(name)).toBeVisible({ timeout: 20000 });
  }

  /** Open a dimension's detail page and wait for its value table (NAME header). */
  async openDimensionDetail(name: string): Promise<void> {
    await this.dimensionByName(name).click();
    await this.page
      .locator(`xpath=//th[normalize-space(text())='NAME']`)
      .first()
      .waitFor({ state: 'visible', timeout: 30000 });
  }

  /** Assert each option value is listed on the dimension detail page. */
  async assertOptionsVisible(options: string[]): Promise<void> {
    for (const opt of options) {
      await expect(
        this.page.getByText(opt, { exact: true }).first(),
      ).toBeVisible({ timeout: 15000 });
    }
  }

  /**
   * From the detail page, open payroll defaults (button copy varies by release:
   * "Set payroll defaults" / "Set time & payroll defaults") and wait for the
   * "Dimension defaults" heading.
   */
  async openSetTimeAndPayrollDefaults(dimName: string): Promise<void> {
    await this.page
      .getByRole('button', {
        name: /set (time\s*&\s*)?payroll defaults/i,
      })
      .first()
      .click();

    await expect(
      this.page.getByRole('heading', { name: 'Dimension defaults' }),
    ).toBeVisible({ timeout: 30000 });
    await this.page.waitForTimeout(3000);

    await expect(this.dimensionByName(dimName)).toBeVisible({ timeout: 30000 });
  }

  /**
   * Assert the dimension's row does NOT show "None selected" in the Default
   * column — i.e. a default IS configured for it.
   */
  async assertDefaultIsSet(dimName: string): Promise<void> {
    const noneSelected = this.page.locator(
      `xpath=//*[text()='${dimName}']/ancestor::tr/descendant::*[text()='None selected']`,
    );
    await expect(noneSelected).toHaveCount(0);
  }

  /** Click Edit on the dimension's row → opens the Edit paycheck default drawer. */
  async openEditPayrollDefault(dimName: string): Promise<void> {
    await this.page
      .locator(
        `xpath=//*[text()='${dimName}']/ancestor::tr/descendant::*[text()='Edit']`,
      )
      .first()
      .click();
    await expect(
      this.page.getByText('Edit paycheck default').first(),
    ).toBeVisible({ timeout: 20000 });
  }

  /**
   * Assert the value selected in the "Assign one default for all employees"
   * dropdown matches the expected default value.
   */
  async assertAssignedDefaultValue(defaultValue: string): Promise<void> {
    await expect(
      this.page.getByText('Edit paycheck default').first(),
    ).toBeVisible({ timeout: 20000 });
    await expect(
      this.page.getByText(defaultValue, { exact: true }).first(),
    ).toBeVisible({ timeout: 15000 });
  }

  async closeEditDrawer(): Promise<void> {
    await this.page
      .getByRole('button', { name: 'Cancel' })
      .first()
      .click()
      .catch(() => undefined);
  }
}
