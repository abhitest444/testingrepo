import { expect, Page } from '@playwright/test';

export default class CamrSentToEmrPage {
  private readonly page: Page;

  private readonly sentToEmrButton = () =>
    this.page.getByRole('button').filter({ hasText: 'SENT TO EMR' });

  constructor(page: Page) {
    this.page = page;
  }

  async expectLoaded(): Promise<void> {
    await expect(this.sentToEmrButton()).toBeVisible();
  }

  async openQueue(): Promise<void> {
    await this.sentToEmrButton().click();
  }

  patientRow(patientRowMatch: string) {
    return this.page
      .getByRole('row')
      .filter({ hasText: patientRowMatch });
  }

  async openPatientReport(patientRowMatch: string): Promise<void> {
    const row = this.patientRow(patientRowMatch).first();
    await expect(row).toBeVisible();
    await row.getByRole('link').click();
  }
}
