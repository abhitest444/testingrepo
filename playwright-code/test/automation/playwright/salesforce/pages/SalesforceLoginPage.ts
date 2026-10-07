import { expect, Page } from '@playwright/test';
import { frontdoorUrl } from '../salesforceSoap';
import { SalesforceSoapSession } from '../types';

const POST_LOGIN_BUTTONS = [
  'Remind Me Later',
  'Skip for now',
  'Skip',
  'Not Now',
  'No Thanks',
  'Got It',
  "Don't Ask Again",
  'Dismiss',
];

export default class SalesforceLoginPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async loginAndReachLightning(session: SalesforceSoapSession): Promise<void> {
    await this.page.goto(frontdoorUrl(session));
    await this.switchToLightningIfNeeded();
    await this.dismissInterstitials();
    await expect(this.appLauncher()).toBeVisible({ timeout: 60_000 });
  }

  private appLauncher() {
    return this.page
      .getByRole('button', { name: 'App Launcher' })
      .or(this.page.locator('button.slds-icon-waffle'))
      .first();
  }

  private async switchToLightningIfNeeded(): Promise<void> {
    const switchLink = this.page.getByRole('link', {
      name: 'Switch to Lightning Experience',
    });

    if (await switchLink.isVisible().catch(() => false)) {
      await switchLink.click();
    }
  }

  private async dismissInterstitials(): Promise<void> {
    for (const name of POST_LOGIN_BUTTONS) {
      const button = this.page.getByRole('button', { name }).first();
      if (await button.isVisible().catch(() => false)) {
        await button.click({ timeout: 2_000 }).catch(() => undefined);
      }
    }
  }
}
