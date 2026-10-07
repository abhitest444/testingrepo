import { expect, Page } from '@playwright/test';

export default class CamrPatientReportPage {
  private readonly page: Page;

  private readonly preliminaryInput = () =>
    this.page.getByRole('textbox', { name: 'Enter Preliminary' });

  constructor(page: Page) {
    this.page = page;
  }

  async setPreliminaryNote(note: string): Promise<void> {
    await expect(this.preliminaryInput()).toBeVisible();
    await this.preliminaryInput().fill(note);
  }

  async expectPreliminaryNote(note: string): Promise<void> {
    await expect(this.preliminaryInput()).toHaveValue(note);
  }
}
