import { Page, Locator, expect } from '@playwright/test';
import AssignmentsPage from '../AssignmentsPage';
import GeofencingPage from '../GeofencingPage';
import { CommonLocators } from '../../commonUtils';
import gotoWithAuthSession from '../../gotoWithAuthSession';

/**
 * Page object for the AS01 Assignments Tab end-to-end suite.
 *
 * Like the TE01 page object, this COMPOSES the existing page objects
 * (`AssignmentsPage`, `GeofencingPage`, `CommonLocators`) rather than
 * duplicating their selectors. It only adds the NEW actions/selectors that
 * AS01 needs for the page-/tab-/filter-/column-level checks (Steps 2–6) and
 * that do not already exist on the base objects.
 *
 * The heavier CRUD / sub-feature flows (Step 7a–7h) are reused directly from
 * `flows/Util/Assignments.util.ts`, `flows/Util/Geofencing.util.ts` and
 * `flows/Util/Geofence.util.ts` inside `AssignmentFlows.Util.ts`.
 */
export default class AssignmentFlowsPage {
  readonly assignments: AssignmentsPage;
  readonly geofence: GeofencingPage;
  readonly common: CommonLocators;
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.assignments = new AssignmentsPage(page);
    this.geofence = new GeofencingPage(page);
    this.common = new CommonLocators(page);
  }

  // ---- Navigation -----------------------------------------------------------

  /**
   * Navigate to the Assignments page via the UI (NOT by URL): hover "All apps"
   * in the left nav → hover "Time" → click the "Assignments" sub-menu item
   * (mirrors the Time Entries suite's submenu navigation). Then land on the
   * Customers tab and wait for the customer assignment table.
   */
  async navigateToAssignments(): Promise<void> {
    // If we are already on the Assignments page, the left-nav hover/click is
    // redundant (and its overlapping flyout items can intercept clicks) — just
    // ensure the Customers tab is selected and return.
    if (await this.isOnAssignmentsPage()) {
      await this.assignments.clickCustomersTab();
      await this.assignments.waitForCustomerTable();
      return;
    }

    // A previous step may have left a drawer / settings view open over the left
    // nav; dismiss it so the nav is interactable.
    await this.dismissOpenOverlays();

    // Prefer UI navigation: hover "All apps" → hover "Time" → click "Assignments".
    // But the left-nav hover is blocked when we're on Account & Settings / an STE
    // trowser (a full-screen overlay sits over the nav). In that case fall back
    // to a direct navigation so the suite isn't stranded off Assignments.
    try {
      const allApps = this.page.locator(`//*[@aria-label='All apps']`).first();
      await expect(allApps).toBeVisible({ timeout: 8000 });
      await allApps.hover({ timeout: 6000 });
      await this.page.waitForTimeout(1000);

      const timeMenu = this.page.locator(`//*[@aria-label='Time']`).first();
      await expect(timeMenu).toBeVisible({ timeout: 8000 });
      await timeMenu.hover({ timeout: 6000 });
      await this.page.waitForTimeout(1500);

      const assignmentsItem = this.page
        .locator(`//*[@aria-label='Assignments']`)
        .first();
      await expect(assignmentsItem).toBeVisible({ timeout: 8000 });
      await assignmentsItem.click({ timeout: 6000 });

      // Use 'domcontentloaded' (fires far earlier than 'load', which waits for
      // every resource) — the fixed waitForTimeout below covers settle time.
      await this.page
        .waitForLoadState('domcontentloaded')
        .catch(() => undefined);
      await this.page.waitForTimeout(2000);
    } catch {
      // Fallback: UI hover was blocked (settings/STE overlay) — navigate directly.
      console.log(
        '[AS01] navigateToAssignments: UI hover blocked — falling back to direct navigation.',
      );
      await this.page
        .goto('/app/time/assignments?jobId=time', {
          waitUntil: 'domcontentloaded',
        })
        .catch(() => undefined);
      await this.page.waitForTimeout(2000);
    }

    // Land on the Customers tab and wait for the customer assignment table.
    await this.page.waitForTimeout(5000);
    await this.assignments.clickCustomersTab();
    await this.assignments.waitForCustomerTable();
  }

  /** True when the page is already on the Assignments page (by URL). */
  private async isOnAssignmentsPage(): Promise<boolean> {
    return /\/app\/time\/assignments/.test(this.page.url());
  }

  /** Best-effort dismissal of any open drawer/modal/flyout via Escape. */
  private async dismissOpenOverlays(): Promise<void> {
    for (let i = 0; i < 2; i++) {
      await this.page.keyboard.press('Escape').catch(() => undefined);
      await this.page.waitForTimeout(400);
    }
  }

  async waitForCustomerTable(): Promise<void> {
    await this.assignments.waitForCustomerTable();
  }

  /**
   * Open the left-nav Time fly-out (hover "All apps" → hover "Time") and report
   * whether an "Assignments" sub-menu item is present. Free-data SKUs should NOT
   * show it. Asserts the Time menu itself is reachable (hard) so a login/nav
   * failure surfaces instead of being mistaken for "Assignments hidden".
   */
  async isAssignmentsAvailableUnderTimeMenu(): Promise<boolean> {
    // Free-data login can land on the chromeless setup/onboarding view (no left
    // nav). Navigate to the Time home first so the standard shell + left nav
    // render, then open the Time fly-out.
    await gotoWithAuthSession(this.page, '/app/time?jobId=time', {
      waitUntil: 'domcontentloaded',
    }).catch(() => undefined);
    await this.page.waitForTimeout(5000);
    await this.dismissOpenOverlays();

    const allApps = this.page.locator(`//*[@aria-label='All apps']`).first();
    await expect(allApps).toBeVisible({ timeout: 15000 });
    await allApps.hover({ timeout: 6000 });
    await this.page.waitForTimeout(1000);

    const timeMenu = this.page.locator(`//*[@aria-label='Time']`).first();
    await expect(timeMenu).toBeVisible({ timeout: 10000 });
    await timeMenu.hover({ timeout: 6000 });
    await this.page.waitForTimeout(1500);

    const assignmentsItem = this.page
      .locator(`//*[@aria-label='Assignments']`)
      .first();
    const visible = await assignmentsItem
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    // Close the fly-out so the caller leaves the nav in a clean state.
    await this.page.keyboard.press('Escape').catch(() => undefined);
    return visible;
  }

  /**
   * Attach console / page-error listeners and return the array they push into.
   * Call BEFORE navigating so errors during load are captured (Step 2).
   */
  attachConsoleErrorCapture(): string[] {
    const consoleErrors: string[] = [];
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    this.page.on('pageerror', (err) => consoleErrors.push(err.message));
    return consoleErrors;
  }

  // ---- Entitlements (Step 1) ------------------------------------------------

  /**
   * Read every `flavour`/`flavor` string from `window.qbo.productEntitlements`.
   * Used to derive companyType (elite/premium/ies/standard) and log the gates
   * for the Playwright report. Returns an empty array when unavailable.
   */
  async getProductEntitlementFlavours(): Promise<string[]> {
    try {
      const flavours = await this.page.evaluate(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const qbo = (window as any).qbo;
        if (!qbo || typeof qbo.productEntitlements === 'undefined') {
          return [] as string[];
        }
        const raw = qbo.productEntitlements;
        const rows = Array.isArray(raw) ? raw : Object.values(raw as object);
        return rows
          .map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (row: any) => (row?.flavour ?? row?.flavor ?? '') as string,
          )
          .filter((f: string) => f.length > 0);
      });
      return flavours ?? [];
    } catch {
      return [];
    }
  }

  // ---- Tabs (Step 2 / 3) ----------------------------------------------------

  customersTab(): Locator {
    return this.page.locator(`//*[@role="tablist"]//*[text()='Customers']`);
  }

  workersTab(): Locator {
    return this.page.locator(`//*[@role="tablist"]//*[text()='Workers']`);
  }

  async isCustomersTabVisible(): Promise<boolean> {
    return await this.customersTab()
      .first()
      .isVisible({ timeout: 8000 })
      .catch(() => false);
  }

  async isWorkersTabVisible(): Promise<boolean> {
    return await this.workersTab()
      .first()
      .isVisible({ timeout: 8000 })
      .catch(() => false);
  }

  /** Returns the currently-selected tab label (aria-selected="true"), or ''. */
  async getActiveTabName(): Promise<string> {
    const active = this.page.locator(
      `//*[@role="tab" and @aria-selected="true"]`,
    );
    if (
      await active
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false)
    ) {
      return ((await active.first().textContent()) ?? '').trim();
    }
    return '';
  }

  async selectCustomersTab(): Promise<void> {
    await this.assignments.clickCustomersTab();
  }

  async selectWorkersTab(): Promise<void> {
    await this.assignments.clickWorkersTab();
  }

  async switchToGroupsView(): Promise<void> {
    await this.assignments.switchToGroupsView();
  }

  async switchToWorkersView(): Promise<void> {
    await this.assignments.clickWorkersToggle();
    await this.page.waitForTimeout(500);
  }

  // ---- Worker type filter (Step 4) ------------------------------------------

  /**
   * Select a Worker Type filter option (All / Employee / QBO User /
   * Vendor-Contractor). The filter is only present in the Workers (list) view.
   */
  async selectWorkerTypeFilter(option: string): Promise<boolean> {
    const dropdown = this.assignments.filterByWorkerTypeDropdown();
    await expect(dropdown).toBeVisible({ timeout: 10000 });
    await dropdown.click();
    await this.page.waitForTimeout(500);
    const choice = this.page
      .getByRole('option', { name: option, exact: false })
      .or(this.page.locator(`//li[contains(., "${option}")]`))
      .first();
    // Don't hang on a label that doesn't exist for this account/UI — probe with a
    // short timeout, log the options that ARE present, then close the dropdown.
    if (!(await choice.isVisible({ timeout: 4000 }).catch(() => false))) {
      const available = await this.page
        .getByRole('option')
        .allTextContents()
        .catch(() => [] as string[]);
      console.log(
        '[AS01] Worker-type option "%s" not found — available: %o',
        option,
        available.map((t) => t.trim()).filter(Boolean),
      );
      await this.page.keyboard.press('Escape').catch(() => undefined);
      await this.page.waitForTimeout(300);
      return false;
    }
    await choice.click();
    await this.page.waitForTimeout(1000);
    return true;
  }

  /** Whether the Worker Type filter control is present (hidden in Groups view). */
  async isWorkerTypeFilterVisible(): Promise<boolean> {
    return await this.assignments
      .filterByWorkerTypeDropdown()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
  }

  // ---- Search (Step 4) ------------------------------------------------------

  async searchWorkers(term: string): Promise<void> {
    await this.assignments.searchWorkerButton().first().click();
    const input = this.page.getByRole('textbox', { name: /search/i }).first();
    await input.fill(term);
    await this.page.waitForTimeout(1000);
  }

  async clearWorkerSearch(): Promise<void> {
    const input = this.page.getByRole('textbox', { name: /search/i }).first();
    if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
      await input.clear();
      await this.page.waitForTimeout(1000);
    }
  }

  async searchGroups(term: string): Promise<void> {
    await this.assignments.searchGroupsButton().first().click();
    const input = this.page.getByRole('textbox', { name: /search/i }).first();
    await input.fill(term);
    await this.page.waitForTimeout(1000);
  }

  // ---- Columns (Step 5) -----------------------------------------------------

  /** Read all visible column-header texts in the currently-rendered table. */
  async getColumnHeaderTexts(): Promise<string[]> {
    const headers = this.page.locator('th[role="columnheader"]');
    const count = await headers.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await headers.nth(i).textContent())?.trim();
      if (text) {
        texts.push(text);
      }
    }
    return texts;
  }

  /** True when a column header whose text includes `name` is present. */
  async hasColumn(name: string): Promise<boolean> {
    const headers = await this.getColumnHeaderTexts();
    return headers.some((h) => h.toLowerCase().includes(name.toLowerCase()));
  }

  /** Geofence column on the Customers table (Time Elite + flag + setting). */
  async isGeofenceColumnVisible(): Promise<boolean> {
    return await this.geofence.isGeofenceColumnVisible().catch(() => false);
  }

  /** "Group leads" column — present for non-NTTF (legacy) companies. */
  async isGroupLeadsColumnVisible(): Promise<boolean> {
    return await this.hasColumn('Group leads');
  }

  /**
   * True when the Groups view shows its empty state ("No groups yet") — i.e. the
   * company has no groups, so the Groups table/columns are not rendered.
   */
  async isGroupsEmptyState(): Promise<boolean> {
    return await this.page
      .locator(`//*[contains(text(),'No groups yet')]`)
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
  }

  // ---- Add worker / Invite to track time (Step 3 / 7e) ----------------------

  /**
   * Open the "Add worker" dropdown and report which options it exposes.
   * "Invite to track time" only appears when its feature flag is on.
   */
  async getAddWorkerMenuOptions(): Promise<string[]> {
    await this.assignments.addWorkerButton().first().click();
    await this.page.waitForTimeout(500);
    // The Add-worker dropdown renders its choices as role="option" (e.g.
    // "Add employee" / "Add contractor"), not role="menuitem". Read both so the
    // helper is robust to either rendering.
    const items = this.page
      .getByRole('option')
      .or(this.page.getByRole('menuitem'));
    await items
      .first()
      .waitFor({ state: 'visible', timeout: 8000 })
      .catch(() => undefined);
    const count = await items.count();
    const labels: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await items.nth(i).textContent())?.trim();
      if (text) {
        labels.push(text);
      }
    }
    // Close the menu so subsequent steps start clean.
    await this.page.keyboard.press('Escape').catch(() => undefined);
    return labels;
  }

  /**
   * Open the Add-worker trowser for a given option ("Add employee" /
   * "Add contractor"), verify it opened by checking ONE element inside it (the
   * First name field, with the Save button as a fallback), then close it.
   * Returns true when the trowser was confirmed open.
   */
  async openAndCloseAddWorkerTrowser(option: string): Promise<boolean> {
    await this.assignments.addWorkerButton().first().click();
    // Wait for the dropdown option to render before clicking it (avoids racing
    // the menu open), mirroring the working add-worker flow.
    const opt = this.page
      .getByRole('option', { name: option, exact: false })
      .first();
    await opt
      .waitFor({ state: 'visible', timeout: 15000 })
      .catch(() => undefined);
    await opt.click();

    // Give the trowser time to open/render before checking for its contents
    // (it boots behind the web-shell). 'networkidle' rarely settles on QBO
    // (background polling) and would burn the full timeout — use the cheaper
    // 'domcontentloaded' plus the fixed settle pause below.
    await this.page
      .waitForLoadState('domcontentloaded', { timeout: 8000 })
      .catch(() => undefined);
    await this.page.waitForTimeout(5000);

    // The trowser boots behind the web-shell and can take a while to render, so
    // give the inner elements a generous window (the working flow relies on the
    // 180s global expect timeout). Verify via any reliable trowser signal and
    // log which one fired so a future failure is diagnosable.
    const signals: Array<[string, Locator]> = [
      [
        'First name field',
        this.page.getByRole('textbox', { name: 'First name' }).first(),
      ],
      ['Save button', this.assignments.drawerSaveButton().first()],
      ['dialog', this.page.getByRole('dialog').first()],
      [
        'Employee/Contractor heading',
        this.page
          .getByRole('heading', { name: /employee|contractor/i })
          .first(),
      ],
    ];
    let opened = false;
    // First, give the primary signal a wait; the rest are quick probes.
    if (await signals[0][1].isVisible({ timeout: 20000 }).catch(() => false)) {
      opened = true;
      console.log(
        '[AS01] %s trowser opened — matched: %s',
        option,
        signals[0][0],
      );
    } else {
      for (const [label, loc] of signals.slice(1)) {
        if (await loc.isVisible({ timeout: 3000 }).catch(() => false)) {
          opened = true;
          console.log('[AS01] %s trowser opened — matched: %s', option, label);
          break;
        }
      }
    }
    if (!opened) {
      console.log(
        '[AS01] %s trowser — NO signal matched (did it open?).',
        option,
      );
      // Diagnostic: capture what's actually on screen after the option click so
      // we can see the real trowser markup instead of guessing locators.
      const file = `reports/playwright/add-worker-${option
        .replace(/\s+/g, '-')
        .toLowerCase()}.png`;
      await this.page
        .screenshot({ path: file, fullPage: true })
        .then(() => console.log('[AS01] saved trowser screenshot → %s', file))
        .catch(() => undefined);
    }

    await this.closeOpenTrowser();
    return opened;
  }

  /**
   * Close an open trowser/drawer via its header Close control (Escape fallback)
   * and accept any "discard unsaved changes" confirmation so the grid is clean.
   */
  private async closeOpenTrowser(): Promise<void> {
    const closeBtn = this.page.getByRole('button', { name: 'Close' }).last();
    if (await closeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await closeBtn.click().catch(() => undefined);
    } else {
      await this.page.keyboard.press('Escape').catch(() => undefined);
    }
    await this.page.waitForTimeout(500);

    const discard = this.page
      .getByRole('button', { name: /discard|don.?t save|yes/i })
      .first();
    if (await discard.isVisible({ timeout: 1500 }).catch(() => false)) {
      await discard.click().catch(() => undefined);
      await this.page.waitForTimeout(400);
    }
  }

  async isInviteToTrackTimeAvailable(): Promise<boolean> {
    const options = await this.getAddWorkerMenuOptions().catch(() => []);
    return options.some((o) => /invite/i.test(o) && /track/i.test(o));
  }
}
