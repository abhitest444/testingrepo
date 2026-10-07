import { expect, Page } from '@playwright/test';
import { CamrCredentials } from '../types';

export default class CamrLoginPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async open(): Promise<void> {
    await this.page.goto('/login');
    await expect(
      this.page.getByRole('heading', { name: 'Login to Account' }),
    ).toBeVisible();
  }

  async login(credentials: CamrCredentials): Promise<void> {
    await this.page
      .getByRole('textbox', { name: 'Enter Username' })
      .fill(credentials.username);
    await this.page
      .getByRole('textbox', { name: 'Enter password' })
      .fill(credentials.password);
    await this.page
      .getByRole('textbox', { name: 'Enter Clinic Name' })
      .fill(credentials.clinicName);
    await this.page.getByRole('button', { name: 'Sign In' }).click();
  }

  private sentToEmrButton() {
    return this.page.getByRole('button').filter({ hasText: 'SENT TO EMR' });
  }

  /** Sign in, dismiss clinic picker if shown, wait for the dashboard. */
  async loginAndReachDashboard(credentials: CamrCredentials): Promise<void> {
    await this.login(credentials);

    const clinicPicker = this.page.getByText('Select Clinics/Hospitals');
    const dashboardReady = this.sentToEmrButton();

    await Promise.race([
      clinicPicker.waitFor({ state: 'visible', timeout: 60_000 }),
      dashboardReady.waitFor({ state: 'visible', timeout: 60_000 }),
    ]).catch(() => undefined);

    if (await clinicPicker.isVisible()) {
      await this.page.getByRole('button', { name: 'Continue' }).click();
      await expect(clinicPicker).not.toBeVisible({ timeout: 60_000 });
    }
if(await this.page.getByRole('checkbox', { name: 'Selecr All' }).isChecked()){
  console.log('All clinics selected');
}else{
  await this.page.getByRole('checkbox', { name: 'Selecr All' }).click();
  console.log('Not all clinics selected');
}
    await expect(dashboardReady).toBeVisible({ timeout: 60_000 });
  }
}
