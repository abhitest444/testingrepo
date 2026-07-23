import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export type CheckoutInfo = {
  firstName: string;
  lastName: string;
  postalCode: string;
};

export class CheckoutPage extends BasePage {
  private readonly firstName = this.page.locator('[data-test="firstName"]');
  private readonly lastName = this.page.locator('[data-test="lastName"]');
  private readonly postalCode = this.page.locator('[data-test="postalCode"]');
  private readonly continueButton = this.page.locator('[data-test="continue"]');
  private readonly finishButton = this.page.locator('[data-test="finish"]');
  private readonly completeHeader = this.page.locator('[data-test="complete-header"]');

  async fillInfo(info: CheckoutInfo): Promise<void> {
    await this.firstName.fill(info.firstName);
    await this.lastName.fill(info.lastName);
    await this.postalCode.fill(info.postalCode);
    await this.continueButton.click();
  }

  async finish(): Promise<void> {
    await this.finishButton.click();
  }

  async expectOrderComplete(): Promise<void> {
    await this.expectUrlContains('checkout-complete');
    await expect(this.completeHeader).toHaveText('Thank you for your order!');
  }
}
