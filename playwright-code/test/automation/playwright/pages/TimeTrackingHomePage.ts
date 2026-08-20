import { Page } from '@playwright/test';

class TimeTrackingHomePage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate() {
    await this.page.goto('/app/qtime');
  }
}

export default TimeTrackingHomePage;
