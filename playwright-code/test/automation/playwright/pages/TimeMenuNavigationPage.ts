import { Page, Locator, expect } from '@playwright/test';
import { getDateRangeDropdown } from '../commonUtils';

/**
 * Page Object for Time Menu Navigation
 * Handles left rail menu interactions for Time menu and its submenu options
 */
class TimeMenuNavigationPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ========== LOCATORS ==========

  get myAppsMenu(): Locator {
    return this.page.locator(
      `//*[@aria-label="My apps" or @aria-label="All apps"]`,
    );
  }

  get timeMenu(): Locator {
    return this.page.locator(
      `//div[contains(@class, 'NavItem')] / descendant::*[text()='Time']`,
    );
  }

  get overviewOption(): Locator {
    return this.page.locator(
      `//div[@id="submenu-time"] / descendant::*[text()='Overview']`,
    );
  }

  get timeEntriesOption(): Locator {
    return this.page.locator(
      `//div[@id="submenu-time"] / descendant::*[text()='Time entries']`,
    );
  }

  get approvalsOption(): Locator {
    return this.page.locator(
      `//div[@id="submenu-time"] / descendant::*[text()='Approvals']`,
    );
  }

  get scheduleOption(): Locator {
    return this.page.locator(
      `//div[@id="submenu-time"] / descendant::*[text()='Schedule']`,
    );
  }

  get timeOffOption(): Locator {
    return this.page.locator(
      `//div[@id="submenu-time"] / descendant::*[text()='Time off']`,
    );
  }

  get timeTeamOption(): Locator {
    return this.page.locator(
      `//div[@id="submenu-time"] / descendant::*[text()='Time team']`,
    );
  }

  get assignmentsOption(): Locator {
    return this.page.locator(
      `//div[@id="submenu-time"] / descendant::*[text()='Assignments']`,
    );
  }

  get timeReportsOption(): Locator {
    return this.page.locator(
      `//div[@id="submenu-time"] / descendant::*[text()='Time reports']`,
    );
  }

  /** Time → **Time projects** (`timeProject` widget). NLS: `timeProject.title`. */
  get timeProjectsOption(): Locator {
    return this.page.locator(`//span[text()="Time projects"]`);
  }

  // Landing page validation locators
  get overviewPageAddTimeEntryButton(): Locator {
    return this.page.locator(`//*[text()='Add time entry']`);
  }

  get overviewPageGetReadyText(): Locator {
    return this.page.locator(`//*[text()="Let's get you ready to track time"]`);
  }

  get timeEntriesPageDisplayByDropdown(): Locator {
    return this.page.getByLabel('Display by');
  }

  // Schedule page is inside an iframe with title="Schedule"
  getSchedulePageActionsText(): Locator {
    return this.page
      .frameLocator('iframe[title="Schedule"]')
      .locator(`//*[text()='Actions']`);
  }

  // Schedule page for free companies
  get schedulePageFreeCompanyText(): Locator {
    return this.page.locator(
      `//*[text()="Schedule and track your team's time on the go"]`,
    );
  }

  get timeOffPageManageTimeOffText(): Locator {
    // "Manage time off" is outside iframe, for iframe case check iframe exists
    return this.page
      .locator(`//*[text()='Time off']`)
      .or(this.page.locator(`iframe#time_off_requests_list_frame`));
  }

  // Time team page is inside an iframe with title="Your Team"
  getTimeTeamPageFirstNameHeader(): Locator {
    return this.page
      .frameLocator('iframe[title="Your Team"]')
      .locator(`//*[text()='First Name']`);
  }

  // Assignments page is inside an iframe with title="job_codes"
  getAssignmentsPageCustomersHeader(): Locator {
    return this.page.locator(`//strong[text()='Customers']`);
  }

  get timeReportsPagePayrollReportText(): Locator {
    return this.page.locator(`//*[text()='Payroll report']`);
  }

  // Access denial message for Time Premium companies
  get accessDeniedText(): Locator {
    return this.page.locator(
      `//*[text()='You need access to use QuickBooks Time']`,
    );
  }

  // ========== ACTIONS ==========

  /**
   * Hovers on the "My apps" menu with retry logic
   * @param maxAttempts Maximum number of attempts (default: 10)
   * @returns true if successful, false otherwise
   */
  async hoverOnMyAppsMenu(maxAttempts: number = 10): Promise<boolean> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(
          `  Attempting to hover on My apps (attempt ${attempt}/${maxAttempts})...`,
        );

        // Wait briefly for major network activity to settle (not networkidle - can hang indefinitely)
        // Using a short timeout to catch most dynamic content without risking infinite wait
        console.log('  Waiting for initial page load to settle...');
        await this.page.waitForLoadState('load').catch(() => {});
        await this.page.waitForTimeout(2000); // Allow dynamic content to start loading

        // Wait for any loading spinners to disappear before hovering
        const loadingSpinner = this.page.locator('[aria-label="Loading"]');
        if (
          await loadingSpinner.isVisible({ timeout: 1000 }).catch(() => false)
        ) {
          console.log('  Waiting for loading spinner to disappear...');
          await loadingSpinner
            .waitFor({ state: 'hidden', timeout: 30000 })
            .catch(() => {});
          await this.page.waitForTimeout(2000);
        }

        // Wait for common dynamic elements to settle (Business Feed, promotional banners)
        const businessFeed = this.page.locator('text=Business Feed');
        if (
          await businessFeed.isVisible({ timeout: 2000 }).catch(() => false)
        ) {
          console.log('  Business Feed detected, waiting for it to settle...');
          await this.page.waitForTimeout(2000);
        }

        // Perform the hover
        await this.myAppsMenu.hover({ timeout: 15000 });
        await this.page.waitForTimeout(3000);

        // Verify Time menu is visible
        const timeMenuVisible = await this.timeMenu.isVisible({
          timeout: 10000,
        });
        if (timeMenuVisible) {
          // Double-check: wait a bit and verify Time menu is STILL visible
          // This handles cases where page re-renders and closes the menu
          await this.page.waitForTimeout(2000);
          const stillVisible = await this.timeMenu
            .isVisible({ timeout: 3000 })
            .catch(() => false);
          if (stillVisible) {
            console.log('  ✓ Hover successful, Time menu is visible');
            return true;
          } else {
            console.log(
              `  Attempt ${attempt} failed: Time menu appeared but then closed (page re-render)`,
            );
            if (attempt < maxAttempts) {
              // Wait longer for page to stabilize before next retry
              console.log('  Waiting for page to stabilize...');
              await this.page.waitForLoadState('load').catch(() => {});
              await this.page.waitForTimeout(5000);
            }
            continue;
          }
        } else {
          console.log(`  Attempt ${attempt} failed: Time menu not visible`);
          if (attempt < maxAttempts) {
            await this.page.waitForTimeout(5000);
          }
        }
      } catch (error) {
        console.log(
          `  Attempt ${attempt} failed with error: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        if (attempt < maxAttempts) {
          await this.page.waitForTimeout(5000);
        }
      }
    }
    return false;
  }

  /**
   * Hovers on the Time menu to reveal submenu options
   * @param maxAttempts Maximum number of attempts (default: 10)
   * @param companyType Type of company to determine which submenu options to check ('elite', 'time_premium', 'free', or 'core')
   * @returns true if successful, false otherwise
   */
  async hoverOnTimeMenu(
    maxAttempts: number = 10,
    companyType: 'elite' | 'time_premium' | 'free' | 'core' = 'elite',
  ): Promise<boolean> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(
          `  Attempting to hover on Time menu (attempt ${attempt}/${maxAttempts})...`,
        );
        await this.timeMenu.hover({ timeout: 15000 });
        await this.page.waitForTimeout(3000);

        // Verify submenu options are visible based on company type
        const optionsVisible = await this.areSubmenuOptionsVisible(companyType);

        if (optionsVisible) {
          const message =
            companyType === 'free'
              ? '  ✓ Free company Time submenu options (Time entries, Schedule) are visible'
              : '  ✓ All Time submenu options are visible (incl. Approvals)';
          console.log(message);
          return true;
        } else {
          console.log(
            `  Attempt ${attempt} failed: Expected submenu options not visible`,
          );
          if (attempt < maxAttempts) {
            // Re-hover on My apps first
            await this.myAppsMenu.hover({ timeout: 15000 });
            await this.page.waitForTimeout(2000);
          }
        }
      } catch (error) {
        console.log(
          `  Attempt ${attempt} failed with error: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        if (attempt < maxAttempts) {
          await this.myAppsMenu.hover({ timeout: 15000 });
          await this.page.waitForTimeout(2000);
        }
      }
    }
    return false;
  }

  /**
   * Checks if expected submenu options are visible based on company type
   * @param companyType Type of company ('elite', 'time_premium', 'free', or 'core')
   */
  async areSubmenuOptionsVisible(
    companyType: 'elite' | 'time_premium' | 'free' | 'core' = 'elite',
  ): Promise<boolean> {
    if (companyType === 'free') {
      // Free companies: only Time Entries and Schedule
      const timeEntriesVisible = await this.timeEntriesOption
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      const scheduleVisible = await this.scheduleOption
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      return timeEntriesVisible && scheduleVisible;
    } else {
      // Elite and Time Premium companies: all 8 options (incl. Approvals)
      const options = [
        this.overviewOption,
        this.timeEntriesOption,
        this.approvalsOption,
        this.scheduleOption,
        this.timeOffOption,
        this.timeTeamOption,
        this.assignmentsOption,
        this.timeReportsOption,
      ];

      for (const option of options) {
        const isVisible = await option
          .isVisible({ timeout: 5000 })
          .catch(() => false);
        if (!isVisible) {
          return false;
        }
      }
      return true;
    }
  }

  /**
   * Hovers on My apps and Time menu in sequence
   */
  async hoverToRevealTimeSubmenu(): Promise<void> {
    await this.myAppsMenu.hover();
    await this.page.waitForTimeout(2000);
    await this.timeMenu.hover();
    await this.page.waitForTimeout(2000);
  }

  /**
   * Clicks on Overview option
   */
  async clickOverview(): Promise<void> {
    await this.overviewOption.click();
    await this.page.waitForTimeout(3000);
  }

  /**
   * Clicks on Time entries option
   */
  async clickTimeEntries(): Promise<void> {
    await this.timeEntriesOption.click();
    await this.page.waitForTimeout(3000);
  }

  /**
   * Clicks on Approvals option (Time submenu)
   */
  async clickApprovals(): Promise<void> {
    await this.approvalsOption.click();
    await this.page.waitForTimeout(3000);
  }

  /**
   * Clicks on Schedule option
   */
  async clickSchedule(): Promise<void> {
    await this.scheduleOption.click();
    await this.page.waitForTimeout(3000);
  }

  /**
   * Clicks on Time off option
   */
  async clickTimeOff(): Promise<void> {
    await this.timeOffOption.click();
    await this.page.waitForTimeout(3000);
  }

  /**
   * Clicks on Time team option
   */
  async clickTimeTeam(): Promise<void> {
    await this.timeTeamOption.click();
    await this.page.waitForTimeout(3000);
  }

  /**
   * Clicks on Assignments option
   */
  async clickAssignments(): Promise<void> {
    await this.assignmentsOption.click();
    await this.page.waitForTimeout(3000);
  }

  /**
   * Clicks on Time reports option
   */
  async clickTimeReports(): Promise<void> {
    await this.timeReportsOption.click();
    await this.page.waitForTimeout(3000);
  }

  /**
   * Clicks **Time projects** under the Time submenu (`/app/timeproject`).
   */
  async clickTimeProjects(): Promise<void> {
    await this.timeProjectsOption.click();
    await this.page.waitForTimeout(3000);
  }

  // ========== VALIDATIONS ==========

  /**
   * Validates Time menu is visible
   */
  async validateTimeMenuVisible(): Promise<void> {
    await expect(this.timeMenu).toBeVisible();
  }

  /**
   * Validates submenu options based on company type
   * @param companyType Type of company ('elite', 'time_premium', 'free', or 'core')
   */
  async validateSubmenuOptions(
    companyType: 'elite' | 'time_premium' | 'free' | 'core' = 'elite',
  ): Promise<void> {
    if (companyType === 'free') {
      // Free companies: only Time entries and Schedule should be visible
      await expect(this.timeEntriesOption).toBeVisible();
      await expect(this.scheduleOption).toBeVisible();

      // Others should NOT be visible
      await expect(this.overviewOption).not.toBeVisible();
      await expect(this.approvalsOption).not.toBeVisible();
      await expect(this.timeOffOption).not.toBeVisible();
      await expect(this.timeTeamOption).not.toBeVisible();
      await expect(this.assignmentsOption).not.toBeVisible();
      await expect(this.timeReportsOption).not.toBeVisible();
    } else {
      // Elite and Time Premium companies: all 8 options should be visible
      await expect(this.overviewOption).toBeVisible();
      await expect(this.timeEntriesOption).toBeVisible();
      await expect(this.approvalsOption).toBeVisible();
      await expect(this.scheduleOption).toBeVisible();
      await expect(this.timeOffOption).toBeVisible();
      await expect(this.timeTeamOption).toBeVisible();
      await expect(this.assignmentsOption).toBeVisible();
      await expect(this.timeReportsOption).toBeVisible();
    }
  }

  /**
   * Validates Time menu is not visible (for payroll core companies)
   */
  async validateTimeMenuNotVisible(): Promise<void> {
    await expect(this.timeMenu).not.toBeVisible();
  }

  /**
   * Validates Overview page loaded successfully
   * Checks for either "Add time entry" button or "Let's get you ready to track time" text
   */
  async validateOverviewPageLoaded(): Promise<void> {
    // Use expect with or() to check for either element
    await expect(
      this.overviewPageAddTimeEntryButton.or(this.overviewPageGetReadyText),
    ).toBeVisible();
  }

  /**
   * Validates Time entries page loaded successfully
   */
  async validateTimeEntriesPageLoaded(): Promise<void> {
    await expect(this.timeEntriesPageDisplayByDropdown).toBeVisible();
  }

  /**
   * Validates Approvals (time) page loaded — date range control like Time entries.
   */
  async validateApprovalsPageLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/time\/approval|approval/);
    await expect(getDateRangeDropdown(this.page)).toBeVisible();
  }

  /**
   * Validates Schedule page loaded successfully
   * For elite/premium: checks for Actions button inside iframe
   * For free: checks for "Schedule and track your team's time on the go" text
   */
  async validateSchedulePageLoaded(
    companyType: 'elite' | 'time_premium' | 'free' | 'core' = 'elite',
  ): Promise<void> {
    if (companyType === 'free') {
      // Free companies show a different message
      await expect(this.schedulePageFreeCompanyText).toBeVisible();
    } else {
      // Elite and premium companies show the Actions button in iframe
      await expect(this.getSchedulePageActionsText()).toBeVisible();
    }
  }

  /**
   * Validates Time off page loaded successfully
   */
  async validateTimeOffPageLoaded(): Promise<void> {
    await this.page.waitForTimeout(2000);
    // Use first() to avoid strict mode issues with multiple matches
    await expect(this.timeOffPageManageTimeOffText.first()).toBeVisible({
      timeout: 30000,
    });
  }

  /**
   * Validates Time team page loaded successfully (inside iframe)
   */
  async validateTimeTeamPageLoaded(): Promise<void> {
    await expect(this.getTimeTeamPageFirstNameHeader()).toBeVisible();
  }

  /**
   * Validates Assignments page loaded successfully (inside iframe)
   */
  async validateAssignmentsPageLoaded(): Promise<void> {
    await expect(this.getAssignmentsPageCustomersHeader()).toBeVisible();
  }

  /**
   * Validates Time reports page loaded successfully
   */
  async validateTimeReportsPageLoaded(): Promise<void> {
    await expect(this.timeReportsPagePayrollReportText).toBeVisible();
  }

  /**
   * Validates access denied message is shown (for Time Premium companies)
   */
  async validateAccessDenied(): Promise<void> {
    await expect(this.accessDeniedText).toBeVisible();
  }

  get timeProjectOption(): Locator {
    return this.page.locator(
      `//div[@id="submenu-time"] / descendant::*[text()='Time project']`,
    );
  }

  /**
   * Clicks on Time project option
   */
  async clickTimeProject(): Promise<void> {
    await this.timeProjectOption.click();
    await this.page.waitForTimeout(3000);
  }

  /**
   * Validates Time project option is visible in submenu
   */
  async validateTimeProjectOptionVisible(): Promise<void> {
    await expect(this.timeProjectOption).toBeVisible();
  }
}

export default TimeMenuNavigationPage;
