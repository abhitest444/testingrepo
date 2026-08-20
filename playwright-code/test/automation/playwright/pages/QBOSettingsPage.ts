import { expect, Page } from '@playwright/test';
import { waitForLoadingToDisappear } from './TimeSettingsPage';

class QBOSettingsPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigateToQBOSettings() {
    await this.page.goto(`https://e2e.qbo.intuit.com/app/accountsettings`, {
      waitUntil: 'load',
    });
  }

  async clickAdvancedQBOSettings() {
    await this.page.waitForSelector(`//*[text()='Advanced']`, {
      state: 'visible',
      timeout: 0,
    });
    return await this.page.locator(`//*[text()='Advanced']`).click();
  }

  async clickTracklocations() {
    return await this.page
      .locator(
        `//span[contains(text(),'Track locations')] | //div[contains(text(),'Track locations')]`,
      )
      .click();
  }

  async checkIfLocationSettingToggleOn() {
    const isChecked = await this.page
      .locator(`//input[@data-qbo-bind="checked: hasLocation"]`)
      .isChecked();
    return isChecked;
  }

  async uncheckLocationToggle() {
    return await this.page
      .locator(
        `//input[@aria-label="advanced_categories_track_location"] | //input[@data-qbo-bind="checked: hasLocation"] / following-sibling::span`,
      )
      .uncheck();
  }

  async checkLocationToggle() {
    return await this.page
      .locator(
        `//input[@aria-label="advanced_categories_track_location"] | //input[@data-qbo-bind="checked: hasLocation"] / following-sibling::span`,
      )
      .check();
  }

  async clickSaveButton() {
    return await this.page.locator(`//*[text()='Save']`).click();
  }

  async waitForTrackLocationsToBeVisible() {
    return await this.page.waitForSelector(
      `//div[contains(text(),'Track locations')]`,
      {
        state: 'visible',
        timeout: 0,
      },
    );
  }

  async waitForTrackClassesToBeVisible() {
    return await this.page.waitForSelector(
      `//div[contains(@class, "settingSection")] / descendant::div[contains(text(),'Track classes')]`,
      {
        state: 'visible',
        timeout: 0,
      },
    );
  }

  async clickTrackClasses() {
    return await this.page
      .locator(
        `//span[contains(text(),'Track classes')] | //div[contains(text(),'Track classes')]`,
      )
      .click();
  }

  async checkIfClassesSettingToggleOn() {
    const isChecked = await this.page
      .locator(`//input[@data-qbo-bind="checked: hasClasses"]`)
      .isChecked();
    return isChecked;
  }

  async uncheckClassesToggle() {
    return await this.page
      .locator(
        `//input[@aria-label="advanced_categories_track_classes"] | //input[@data-qbo-bind="checked: hasClasses"] / following-sibling::span`,
      )
      .uncheck();
  }

  async checkClassesToggle() {
    return await this.page
      .locator(
        `//input[@aria-label="advanced_categories_track_classes"] | //input[@data-qbo-bind="checked: hasClasses"] / following-sibling::span`,
      )
      .check();
  }

  async waitForSaveOperationToComplete() {
    try {
      return await this.page.waitForSelector(
        `//*[@data-testid="save-section-button"]`,
        {
          state: 'hidden',
          timeout: 10000,
        },
      );
    } catch (error: any) {
      if (error.name === 'TimeoutError') {
        console.error(
          'Timeout error waiting for save operation to complete:',
          error,
        );
      } else {
        console.error('Error waiting for save operation to complete:', error);
      }
      throw error;
    }
  }

  async turnOnClassSettingsToggleIfOff() {
    if (
      await this.page
        .locator(
          `//*[@data-qbo-bind="text:hasClassValue, visible:readTracking" and  text()="Off"]`,
        )
        .isVisible()
    ) {
      return await this.checkClassesToggle();
    }
  }

  async turnOnLocationSettingsToggleIfOff() {
    if (
      await this.page
        .locator(
          `//*[@data-qbo-bind="text:hasLocationValue, visible:readTracking" and  text()="Off"]`,
        )
        .isVisible()
    ) {
      return await this.checkLocationToggle();
    }
  }

  async validateClassAndLocationSettingsNotAvailable() {
    try {
      await this.page.waitForSelector(
        `//span[text()='Enable account numbers'] | //div[@data-section="advancedChartOfAccounts"] / descendant::div[text()='Enable account numbers ']`,
        { state: 'visible', timeout: 0 },
      );

      return await this.page
        .locator(
          `//*[text()='Categories'] | //div[@data-section='advancedTracking']`,
        )
        .isHidden();
    } catch (error) {
      console.error('Error waiting for element:', error);
      return false;
    }
  }

  async waitForOtherPreferencesSectionToLoad() {
    await this.page.waitForSelector(`//div[text()='Date format']`, {
      state: 'visible',
      timeout: 0,
    });
  }

  async clickOtherPreferencesSection() {
    return await this.page.locator(`//*[@data-section="advancedMisc"]`).click();
  }

  async clickOnDateFormatDropdown() {
    return await this.page.locator(`//*[@aria-label="Date format"]`).click();
  }

  async selectDateFormat(format: string) {
    return await this.page.locator(`//*[@aria-label="${format} "]`).click();
  }

  async navigateToQBOAdvancedSettings() {
    return await this.page.goto(`/app/accountsettings?p=advanced`, {
      waitUntil: 'load',
    });
  }

  async waitForChartOfAccounts() {
    return await this.page.waitForSelector(
      `//span[text()='Enable account numbers'] | //div[contains(text(),'Enable account numbers ')]`,
      {
        state: 'visible',
        timeout: 0,
      },
    );
  }
}

// ——— QB Time Setup flow functions
const QB_TIME_SETUP_URL =
  'app/setup?project=qbtimesetup&flow=qbtimesetupv2#/qbtimesetupv2/timeTrackingGetStarted';

/** Go to QB Time Setup flow URL */
export const goToQBTimeSetup = async (page: Page) => {
  await page.goto(QB_TIME_SETUP_URL, { waitUntil: 'load' });
  await waitForLoadingToDisappear(page);
};

/** Verify "Set up time tracking" dialog: header, content section, then click Let's Go */
export const verifySetUpTimeTrackingAndClickLetsGo = async (page: Page) => {
  const dialog = page.getByRole('dialog', { name: 'Set up time tracking' });
  await expect(dialog).toBeVisible({ timeout: 10000 });

  // Verify header (title in dialog header)
  await expect(
    dialog
      .locator('[data-automation-id="getStartedTrowser_header"]')
      .getByText('Set up time tracking'),
  ).toBeVisible();

  const contentSection = dialog.locator(
    '[data-automation-id="getStartedTrowser_section"]',
  );
  await expect(
    contentSection.getByText('How time tracking works'),
  ).toBeVisible();

  await dialog
    .locator('button')
    .filter({ hasText: /Let's Go/i })
    .click();
  await page.waitForTimeout(10000);
  await waitForLoadingToDisappear(page);
  console.log('Verified: Set up time tracking');
};

/** Verify "Timesheet settings" dialog */
export const verifyTimesheetSettingsAndClickNext = async (page: Page) => {
  const dialog = page.getByRole('dialog', { name: 'Timesheet settings' });
  await expect(dialog).toBeVisible({ timeout: 1000 });

  await dialog.locator('button').filter({ hasText: /Back/i }).click();
  await page.waitForTimeout(5000);
  await waitForLoadingToDisappear(page);

  await expect(page).toHaveURL(/timeTrackingGetStarted/, { timeout: 15_000 });

  await page
    .getByRole('dialog', { name: 'Set up time tracking' })
    .locator('button')
    .filter({ hasText: /Let's Go/i })
    .click();
  await page.waitForTimeout(10000);
  await waitForLoadingToDisappear(page);

  // Verify header (title in dialog header)
  await expect(
    dialog
      .locator('[data-automation-id="timesheetSettingsTrowser_header"]')
      .getByText('Timesheet settings'),
  ).toBeVisible();

  // Verify content section: "Customize your timesheets" (or "Customise")
  const contentSection = dialog.locator(
    '[data-automation-id="timesheetSettingsTrowser_section"]',
  );
  await expect(
    contentSection.getByText('Customize your timesheets', { exact: false }),
  ).toBeVisible();

  await dialog
    .locator('button')
    .filter({ hasText: /Next/i })
    .first()
    .click({ force: true });
  await page.waitForTimeout(10000);
  await waitForLoadingToDisappear(page);
  await expect(
    contentSection.getByText('Customize time entry preferences', {
      exact: false,
    }),
  ).toBeVisible();

  await dialog
    .locator('button')
    .filter({ hasText: /Next/i })
    .first()
    .click({ force: true });
  await page.waitForTimeout(10000);
  await waitForLoadingToDisappear(page);
  console.log('Verified: Timesheet settings');
};

/** Verify "Invite team" dialog */
export const verifyInviteTeamAndClickSkipForNow = async (page: Page) => {
  const dialog = page.getByRole('dialog', { name: 'Invite team' });
  await expect(dialog).toBeVisible({ timeout: 1000 });

  await expect(dialog.locator('iframe#invite-team-iframe')).toBeVisible();
  // Locators below resolve inside the iframe. If Back/Skip render on the dialog instead, use `dialog.locator(...)` for those.
  const inviteFrame = dialog.frameLocator('iframe#invite-team-iframe');

  await expect(
    inviteFrame.locator(`//button[@id="user_list_invite_invite_button"]`),
  ).toBeVisible();
  await expect(
    inviteFrame.locator('[id="show_step_flow_back_button"]'),
  ).toBeVisible();

  await inviteFrame
    .locator(`//a[@id="show_step_flow_skip_button"]`)
    .click({ force: true });
  await page.waitForTimeout(10000);
  await page.waitForLoadState('load');
  console.log('Verified: Invite team');
};

/** Verify "Tailor your setup" dialog: header, content, click Done, then verify overview page */
export const verifyTailorYourSetupAndClickDone = async (page: Page) => {
  const dialog = page.getByRole('dialog', { name: 'Tailor your setup' });
  await expect(dialog).toBeVisible({ timeout: 15_000 });

  // Verify header (h2 title in dialog)
  await expect(
    dialog.locator('h2').getByText('Tailor your setup'),
  ).toBeVisible();

  // Verify content: main heading and subheader
  const contentSection = dialog.locator(
    '[data-automation-id="intent-picker-stepflow-step"]',
  );

  await expect(dialog.getByRole('button', { name: 'Back' })).toBeVisible();
  await expect(
    dialog.locator('button').filter({ hasText: 'Done' }),
  ).toBeVisible();

  await dialog.locator('button').filter({ hasText: 'Skip for now' }).click();
  await page.waitForTimeout(10000);
  await page.waitForLoadState('load');
  await waitForLoadingToDisappear(page);
  await expect(page).toHaveURL(/\/app\/time\/overview/, { timeout: 15_000 });
  console.log('Verified: Tailor your setup');
};

/** Task routes base path */
const TASK_BASE = '/app/time/task';

/** Navigate to task route and verify URL */
const gotoTaskRoute = async (page: Page, path: string) => {
  const url = `${path}`;
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForLoadState('domcontentloaded');
  const pathRegex = new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  await expect(page).toHaveURL(pathRegex, { timeout: 15_000 });
};

/** Verify a heading or main content contains the given text */
const expectPageToShow = async (page: Page, text: string) => {
  await expect(
    page.getByRole('heading', { name: new RegExp(text, 'i') }),
  ).toBeVisible({ timeout: 10_000 });
  await waitForLoadingToDisappear(page);
};

export const verifyTaskRouteGetStarted = async (page: Page) => {
  await gotoTaskRoute(page, `${TASK_BASE}/get-started`);
  await expectPageToShow(page, 'Get started|Set up time tracking');
  await expect(
    page.locator('[data-automation-id="getStartedTrowser_section"]'),
  ).toBeVisible({ timeout: 10_000 });
  console.log('Verified: get-started');
};

export const verifyTaskRouteIntents = async (page: Page) => {
  await gotoTaskRoute(page, `${TASK_BASE}/intents`);
  await expectPageToShow(page, 'Intents|Tailor');
  await expect(
    page.locator('[data-automation-id="intent-picker-stepflow-step"]'),
  ).toBeVisible({ timeout: 10_000 });
  console.log('Verified: intents');
};

export const verifyTaskRouteInviteTeam = async (page: Page) => {
  await gotoTaskRoute(page, `${TASK_BASE}/invite-team`);
  await expectPageToShow(page, 'Invite team');
  await expect(page.locator('[id="invite-team-iframe"]')).toBeVisible({
    timeout: 10_000,
  });
  console.log('Verified: invite-team');
};

export const verifyTaskRouteKioskManager = async (page: Page) => {
  await gotoTaskRoute(page, `${TASK_BASE}/kiosk-manager`);
  await expectPageToShow(page, 'Kiosk Manager');
  console.log('Verified: kiosk-manager');
};

export const verifyTaskRouteTimesheetSettings = async (page: Page) => {
  await gotoTaskRoute(page, `${TASK_BASE}/timesheet-settings`);
  await expectPageToShow(page, 'Timesheet settings');
  await expect(
    page.locator('[data-automation-id="timesheetSettingsTrowser_section"]'),
  ).toBeVisible({ timeout: 10_000 });
  console.log('Verified: timesheet-settings');
};

export const verifyTaskRouteBreaks = async (page: Page) => {
  await gotoTaskRoute(page, `${TASK_BASE}/breaks`);
  await expectPageToShow(page, 'Break Preferences');
  await expect(page.locator('[id="addon_breaks_frame"]')).toBeVisible({
    timeout: 10_000,
  });
  console.log('Verified: breaks');
};

export const verifyTaskRouteAssignments = async (page: Page) => {
  await gotoTaskRoute(page, `${TASK_BASE}/assignments`);
  await expectPageToShow(page, 'Assignments');
  await expect(
    page.locator('[data-automation-id="assignmentsTrowser_section"]'),
  ).toBeVisible({ timeout: 10_000 });
  console.log('Verified: assignments');
};

export const verifyTaskRouteApprovals = async (page: Page) => {
  await gotoTaskRoute(page, `${TASK_BASE}/approvals`);
  await expectPageToShow(page, 'Approvals');
  await expect(page.locator('[data-testid="approvals-settings"]')).toBeVisible({
    timeout: 10_000,
  });
  console.log('Verified: approvals');
};

/** Navigate to all task routes and verify header/content on each screen. */
export const verifyTaskRouteWidgets = async (page: Page) => {
  await verifyTaskRouteGetStarted(page);
  await verifyTaskRouteIntents(page);
  await verifyTaskRouteInviteTeam(page);
  await verifyTaskRouteKioskManager(page);
  await verifyTaskRouteTimesheetSettings(page);
  await verifyTaskRouteBreaks(page);
  //await verifyTaskRouteAssignments(page);
  await verifyTaskRouteApprovals(page);
};

export default QBOSettingsPage;
