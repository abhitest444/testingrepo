import { expect, Page } from '@playwright/test';
import { getSalesforceLightningUrl } from '../config';
import { SalesforceLeadData } from '../types';

export default class SalesforceLeadsPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async openSalesApp(): Promise<void> {
    const appLauncher = this.page.getByRole('button', { name: 'App Launcher' });
    await expect(appLauncher).toBeVisible();
    await appLauncher.click();

    const search = this.page.getByPlaceholder(/Search apps/);
    if (await search.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await search.fill('Sales');
    }

    await this.page
      .locator('one-app-launcher-item, one-app-launcher-menu-item, a[data-label="Sales"]')
      .filter({ hasText: /^Sales$/ })
      .first()
      .click();

    await expect(this.leadsTab()).toBeVisible({ timeout: 30_000 });
  }

  async openLead(leadId: string, leadName: string): Promise<void> {
    await this.page.goto(
      `${getSalesforceLightningUrl()}/lightning/r/Lead/${leadId}/view`,
      { waitUntil: 'domcontentloaded' },
    );
    await this.waitForText(leadName);
  }

  async openLeads(): Promise<void> {
    await this.page.goto(`${getSalesforceLightningUrl()}/lightning/o/Lead/list`, {
      waitUntil: 'domcontentloaded',
    });
    await this.dismissOfflineDialog();
    await this.recoverFromConnectionError();
    await expect(this.newButton()).toBeVisible({ timeout: 30_000 });
  }

  async createLead(lead: SalesforceLeadData): Promise<void> {
    await this.newButton().click();

    const next = this.page.getByRole('button', { name: 'Next' });
    if (await next.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await next.click();
    }

    await expect(this.page.getByRole('heading', { name: 'New Lead' })).toBeVisible();

    await this.fillField('First Name', lead.firstName);
    await this.fillField('Last Name', lead.lastName);
    await this.fillField('Company', lead.company);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await this.dismissOfflineDialog();
      await this.page.getByRole('button', { name: 'Save', exact: true }).click();
      await this.page
        .getByRole('heading', { name: 'New Lead' })
        .waitFor({ state: 'hidden', timeout: 20_000 })
        .catch(() => undefined);

      if (
        !(await this.page
          .getByRole('heading', { name: 'New Lead' })
          .isVisible()
          .catch(() => false))
      ) {
        return;
      }
    }

    await expect(this.page.getByRole('heading', { name: 'New Lead' })).toBeHidden({
      timeout: 30_000,
    });
  }

  async expectLeadOpen(lead: SalesforceLeadData): Promise<void> {
    const headerName = `${lead.firstName} ${lead.lastName}`;
    await this.waitForText(headerName);
    await expect(
      this.page.getByRole('option', { name: 'Open - Not Contacted' }),
    ).toBeVisible();
  }

  async convertLead(lead: SalesforceLeadData): Promise<void> {
    await this.openConvertModal();
    await this.dismissOfflineDialog();

    await this.page
      .getByText("Don't create an opportunity upon conversion", { exact: true })
      .click({ force: true, timeout: 5_000 })
      .catch(() => undefined);

    const convertButton = this.page
      .getByRole('dialog', { name: 'Convert Lead' })
      .getByRole('button', { name: 'Convert' });
    await convertButton.click({ timeout: 15_000 });

    await expect(this.page.getByRole('dialog', { name: 'Convert Lead' })).toBeHidden({
      timeout: 45_000,
    });

    const convertedDialog = this.page.getByRole('dialog').filter({
      hasText: 'Your lead has been converted',
    });
    if (
      await convertedDialog
        .waitFor({ state: 'visible', timeout: 10_000 })
        .then(() => true)
        .catch(() => false)
    ) {
      await convertedDialog.getByRole('link').first().click();
    }

    await expect(this.page).toHaveURL(/\/lightning\/r\/Account\//, {
      timeout: 30_000,
    });
  }

  async expectAccountOpen(accountName: string): Promise<void> {
    await expect(this.page).toHaveURL(/\/lightning\/r\/Account\//, {
      timeout: 15_000,
    });
    await expect(
      this.page.getByRole('heading', { name: accountName }),
    ).toBeVisible({ timeout: 15_000 });
  }

  private async openConvertModal(): Promise<void> {
    const convert = this.page.getByRole('button', { name: 'Convert' }).first();
    if (await convert.isVisible().catch(() => false)) {
      await convert.click();
    } else {
      await this.page.getByRole('button', { name: 'Show more actions' }).click();
      await this.page.getByRole('menuitem', { name: 'Convert' }).click();
    }

    await expect(this.page.getByRole('heading', { name: /Convert Lead/i })).toBeVisible();
  }

  private async waitForText(text: string): Promise<void> {
    const target = this.page.getByText(text).first();
    for (let attempt = 0; attempt < 4; attempt += 1) {
      if (await target.isVisible().catch(() => false)) {
        return;
      }
      await this.dismissOfflineDialog();
      await target.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => undefined);
    }
    await expect(target).toBeVisible({ timeout: 15_000 });
  }

  private async dismissOfflineDialog(): Promise<void> {
    const tryAgain = this.page.getByRole('button', { name: 'Try Again' });
    if (await tryAgain.isVisible().catch(() => false)) {
      await tryAgain.click();
      await tryAgain
        .waitFor({ state: 'hidden', timeout: 10_000 })
        .catch(() => undefined);
    }
  }

  private leadsTab() {
    return this.page
      .locator('one-app-nav-bar-item-root a[title="Leads"]')
      .or(this.page.getByRole('link', { name: 'Leads', exact: true }))
      .first();
  }

  private newButton() {
    return this.page
      .getByRole('button', { name: 'New' })
      .or(this.page.getByRole('link', { name: 'New' }))
      .first();
  }

  private async recoverFromConnectionError(): Promise<void> {
    const tryAgain = this.page.getByRole('button', { name: 'Try Again' });

    for (let attempt = 0; attempt < 3; attempt += 1) {
      if (await this.newButton().isVisible().catch(() => false)) {
        return;
      }

      if (await tryAgain.isVisible().catch(() => false)) {
        await tryAgain.click();
      } else {
        await this.page.reload({ waitUntil: 'domcontentloaded' });
      }

      await this.newButton()
        .waitFor({ state: 'visible', timeout: 15_000 })
        .catch(() => undefined);
    }
  }

  private async fillField(label: string, value: string): Promise<void> {
    const nameByLabel: Record<string, string> = {
      'First Name': 'firstName',
      'Last Name': 'lastName',
      Company: 'Company',
    };

    const named = this.page.locator(`input[name="${nameByLabel[label]}"]`).first();
    if (await named.isVisible().catch(() => false)) {
      await named.fill(value);
      return;
    }

    await this.page.getByLabel(label, { exact: true }).first().fill(value);
  }
}
