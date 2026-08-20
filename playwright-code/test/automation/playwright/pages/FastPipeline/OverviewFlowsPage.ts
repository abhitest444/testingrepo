import { Page, Locator, expect } from '@playwright/test';
import { CommonLocators } from '../../commonUtils';
import { TimeSubmenu } from '../../config/types';
import { waitForLoadingToDisappear } from '../TimeSettingsPage';

/**
 * Page object for the OV01 Overview Tab end-to-end suite.
 *
 * Like the TE01 / AS01 page objects, this COMPOSES `CommonLocators` rather than
 * duplicating selectors. It exposes:
 *  - navigation to the Time → Overview tab (UI hover with a direct-URL fallback),
 *  - a getter for every UI element rendered on the Overview screen, grouped by
 *    region (page header, guided-setup card, setup tasks, shortcuts, helpful
 *    resources, and the Time left-nav submenu).
 *
 * The actual assertions live in `OverviewFlows.Util.ts` so the report shows one
 * labelled `test.step` per region; the getters here keep the selectors in a
 * single place.
 */
export default class OverviewFlowsPage {
  readonly common: CommonLocators;
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.common = new CommonLocators(page);
  }

  // ---- Navigation -----------------------------------------------------------

  /**
   * Navigate to the Overview tab via the UI: hover "All apps" → hover "Time" →
   * click the "Overview" sub-menu item. The click loads the Overview page; if any
   * step is blocked (e.g. a renamed nav item or a real regression) this throws
   * and FAILS the test rather than masking it with a direct URL navigation.
   */
  async navigateToOverview(): Promise<void> {
    if (this.isOnOverviewPage()) {
      await this.waitForOverviewReady();
      return;
    }

    const allApps = this.page.locator(`//*[@aria-label='All apps']`).first();
    await expect(allApps).toBeVisible({ timeout: 10000 });
    await allApps.hover();
    // Let the "All apps" flyout render before hovering "Time" — without this
    // settle the next hover can fire before the panel exists and miss it.
    await this.page.waitForTimeout(500);

    const timeMenu = this.page.locator(`//*[@aria-label='Time']`).first();
    await expect(timeMenu).toBeVisible({ timeout: 10000 });
    await timeMenu.hover();
    // Let the Time sub-menu expand before clicking the Overview item.
    await this.page.waitForTimeout(500);

    const overviewItem = this.submenuItem('Overview');
    await expect(overviewItem).toBeVisible({ timeout: 5000 });
    await overviewItem.click();
    await this.page.waitForLoadState('load').catch(() => undefined);

    await this.waitForOverviewReady();
  }

  /** True when the page is already on the Overview page (by URL). */
  private isOnOverviewPage(): boolean {
    return /\/app\/time\/overview/.test(this.page.url());
  }

  async waitForOverviewReady(): Promise<void> {
    await waitForLoadingToDisappear(this.page).catch(() => undefined);
    await expect(this.overviewHeading()).toBeVisible({ timeout: 20000 });
  }

  /**
   * Open the left-nav Time fly-out (hover "All apps" → hover "Time") and report
   * whether the "Overview" sub-menu item is present. Free-data SKUs should NOT
   * show it. Asserts the Time menu itself is reachable (hard) so a login/nav
   * failure surfaces instead of being mistaken for "Overview hidden".
   */
  async isOverviewAvailableUnderTimeMenu(): Promise<boolean> {
    const allApps = this.page.locator(`//*[@aria-label='All apps']`).first();
    await expect(allApps).toBeVisible({ timeout: 15000 });
    await allApps.hover();
    // Let the "All apps" flyout render before hovering "Time".
    await this.page.waitForTimeout(1000);

    const timeMenu = this.page.locator(`//*[@aria-label='Time']`).first();
    await expect(timeMenu).toBeVisible({ timeout: 10000 });
    await timeMenu.hover();
    // Let the Time sub-menu expand before probing for the Overview item.
    await this.page.waitForTimeout(1500);

    const visible = await this.submenuItem('Overview')
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    // Close the fly-out so the caller leaves the nav in a clean state.
    await this.page.keyboard.press('Escape').catch(() => undefined);
    return visible;
  }

  // ---- Page header (Step / region 1) ----------------------------------------

  overviewHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Overview', exact: true });
  }

  /** "Go to classic QuickBooks Time" control in the page header (top-right).
   *  Rendered as a button (first of the two on the page; the other is in the
   *  Shortcuts card). */
  goToClassicQbTimeHeaderLink(): Locator {
    return this.page
      .getByRole('button', { name: /Go to classic QuickBooks Time/i })
      .first();
  }

  giveFeedbackLink(): Locator {
    return this.page.getByRole('button', { name: /Give feedback/i }).first();
  }

  // ---- Guided-setup card (region 2) -----------------------------------------

  guidedSetupCardHeading(): Locator {
    return this.page.getByText(/Schedule your free guided setup/i).first();
  }

  /** "Schedule my call" is rendered as a (disabled) link, not a button. */
  scheduleMyCallButton(): Locator {
    return this.page.getByRole('link', { name: /Schedule my call/i }).first();
  }

  // ---- Setup tasks (region 3) -----------------------------------------------

  setupTasksHeading(): Locator {
    return this.page.getByText(/SETUP TASKS/i).first();
  }

  setUpTimeTrackingTask(): Locator {
    return this.page.getByText(/Set up time tracking/i).first();
  }

  getTeamReadyTask(): Locator {
    return this.page.getByText(/Get your team ready/i).first();
  }

  setUpKioskTask(): Locator {
    return this.page.getByText(/Set up your kiosk/i).first();
  }

  // ---- Setup tasks — "customized" / post-setup state ------------------------
  // After QB Time setup completes, the Setup Tasks card switches to a
  // "You're on your way" / "Your time tracking setup has been customized"
  // state with a different task list (work week / add time / approve time).

  setupCustomizedMessage(): Locator {
    return this.page
      .getByText(/Your time tracking setup has been customized/i)
      .first();
  }

  setUpWorkWeekTask(): Locator {
    return this.page.getByText(/Set up your work week/i).first();
  }

  addTimeEntryTask(): Locator {
    return this.page.getByText(/Add a time entry/i).first();
  }

  approveTimeTask(): Locator {
    return this.page.getByRole('heading', { name: /Approve time/i }).first();
  }

  // ---- Shortcuts (region 4) -------------------------------------------------

  shortcutsHeading(): Locator {
    return this.page.getByText(/SHORTCUTS/i).first();
  }

  /** All shortcut tiles labels expected in the SHORTCUTS card. */
  readonly shortcutLabels: string[] = [
    'Add time entry',
    'Add employee',
    'Approve time',
    'Run report',
    'Invite team',
    'Time off',
    'Manage kiosks',
    'View time settings',
  ];

  shortcutTile(label: string): Locator {
    return this.page.getByText(label, { exact: true }).first();
  }

  /** "Go to classic QuickBooks Time" inside the SHORTCUTS card (rendered as a
   *  button; the last of the two on the page). */
  goToClassicQbTimeShortcutLink(): Locator {
    return this.page
      .getByRole('button', { name: /Go to classic QuickBooks Time/i })
      .last();
  }

  // ---- Helpful resources (region 5) -----------------------------------------

  helpfulResourcesHeading(): Locator {
    return this.page.getByText(/HELPFUL RESOURCES/i).first();
  }

  howToApproveTimeLink(): Locator {
    return this.page
      .getByRole('link', { name: /How to approve time/i })
      .first();
  }

  // ---- Time left-nav submenu (region 6) -------------------------------------

  /**
   * Time submenu items shown in the left nav when Time is expanded, each mapped
   * to a distinctive fragment of its href. We locate by href (not aria-label):
   * aria-label="Overview" is NOT unique — Expenses also has an "Overview" nav
   * item (`/app/expense-overview`) — so scoping to `/app/time*` disambiguates.
   */
  readonly submenuHrefs: Record<TimeSubmenu, string> = {
    Overview: '/app/time/overview',
    'Time entries': '/app/time?',
    Approvals: '/app/time/approval',
    Schedule: '/app/time/schedule',
    'Time off': '/app/time/time-off',
    'Time team': '/app/time/team',
    Assignments: '/app/time/assignments',
    'Time projects': '/app/time/timeProject',
    'Time reports': '/app/time/reports',
  };

  get submenuItems(): TimeSubmenu[] {
    return Object.keys(this.submenuHrefs) as TimeSubmenu[];
  }

  submenuItem(item: TimeSubmenu): Locator {
    return this.page
      .locator(`//a[contains(@href, "${this.submenuHrefs[item]}")]`)
      .first();
  }
}
