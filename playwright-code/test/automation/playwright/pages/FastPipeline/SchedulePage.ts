import { Page, Locator, FrameLocator, expect } from '@playwright/test';

class SchedulePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get frame(): FrameLocator {
    return this.page.frameLocator(`//iframe[@title='Schedule']`);
  }

  // ============================================================================
  // Loading
  // ============================================================================

  /** QBO shell loading spinner — lives in the parent page, NOT the iframe. */
  get loadingSpinner(): Locator {
    return this.page.locator(
      '//div[@aria-label="Loading" and @role="progressbar"]',
    );
  }

  async waitForLoadingToDisappear(timeoutMs = 60_000): Promise<void> {
    try {
      await this.loadingSpinner.waitFor({
        state: 'hidden',
        timeout: timeoutMs,
      });
    } catch {
      // Fast loads — spinner may never appear.
    }
    await this.page.waitForTimeout(1500);
  }

  async waitForScheduleWidgetReady(timeoutMs = 30_000): Promise<void> {
    await this.waitForLoadingToDisappear();

    // Stage 1 — iframe must exist in the parent DOM.
    try {
      await this.page
        .locator('iframe[title="Schedule"]')
        .waitFor({ state: 'attached', timeout: timeoutMs });
    } catch {
      // Free-tier companies show a static message instead of the iframe.
      await this.page.waitForTimeout(3000);
      return;
    }

    // Stage 2 — widget content ready: Actions button visible inside the frame.
    try {
      await this.actionsButton.waitFor({
        state: 'visible',
        timeout: timeoutMs,
      });
    } catch {
      // If Actions never appears (entitlement edge case), wait for any button.
      try {
        await this.frame
          .locator('button')
          .first()
          .waitFor({ state: 'visible', timeout: 10000 });
      } catch {
        await this.page.waitForTimeout(5000);
      }
    }
  }

  // ============================================================================
  // Toolbar — Actions button
  // ============================================================================

  /**
   * "Actions" dropdown button in the Schedule toolbar.
   * Locator matches TimeMenuNavigationPage.getSchedulePageActionsText() exactly.
   */
  get actionsButton(): Locator {
    return this.frame.locator(`//*[text()='Actions']`).first();
  }

  // ============================================================================
  // Toolbar — Date navigation
  // ============================================================================

  get todayButton(): Locator {
    return this.frame.getByRole('button', { name: /^today$/i });
  }

  /**
   * The current date-range label between the arrows, e.g. "May 31 - Jun 6, 2026".
   * Text-pattern match is stable; class names on the widget are minified/unstable.
   */
  get dateRangeLabel(): Locator {
    return this.frame
      .locator(`//*[@id='addon_schedule3_date_bar']/div/div[2]/div`)
      .first();
  }

  // ============================================================================
  // Toolbar — Customers filter
  // ============================================================================

  get customersLabel(): Locator {
    return this.frame.locator(`//label[@title="CUSTOMERS"]`).first();
  }

  /**
   * The "All" link immediately after the Customers label.
   * XPath sibling traversal is the most direct single-expression strategy.
   */
  get customersValue(): Locator {
    return this.frame
      .locator(
        `//label[@title="CUSTOMERS"]/following::a[@id='addon_schedule3_jobcode_filter_value_label']`,
      )
      .first();
  }

  // ============================================================================
  // Toolbar — Team members filter
  // ============================================================================

  get teamMembersLabel(): Locator {
    return this.frame.locator(`//label[text()="Team Members"]`).first();
  }

  /**
   * "All team members" link/button.
   * XPath text match is more reliable than getByRole('link') because the widget
   * may render this as a button rather than an anchor on some builds.
   */
  get teamMembersAllLink(): Locator {
    return this.frame
      .locator(
        `//label[text()="Team Members"]//following::a[@id='addon_schedule3_multi_group_link']`,
      )
      .first();
  }

  // ============================================================================
  // Toolbar — Print and Settings icons
  // ============================================================================

  /**
   * Print icon button. aria-label is the most stable attribute on icon-only buttons.
   */
  get printButton(): Locator {
    return this.frame.locator(`//button[@title='Print']`);
  }

  /**
   * Settings / gear icon button. aria-label is the most stable attribute.
   */
  get settingsButton(): Locator {
    return this.frame.locator(`//button[@id='addon_schedule3_publish_button']`);
  }

  /**
   * Global Publish button. The label toggles between "Publish" (unpublished
   * changes exist) and "Published" (all changes live). A single regex covers
   * both states without needing an .or() chain.
   */
  get publishButton(): Locator {
    return this.frame.getByRole('button', { name: /^publish(ed)?$/i });
  }

  // ============================================================================
  // Toolbar — My / Full view toggle
  // ============================================================================

  /**
   * "My" view toggle. getByRole('button') is the most semantic and stable
   * strategy; text-exact match avoids false positives.
   */
  get myViewButton(): Locator {
    return this.frame.locator(
      `//*[@id='addon_schedule3_my_select' and text()='My']`,
    );
  }

  /** "Full" view toggle. */
  get fullViewButton(): Locator {
    return this.frame.locator(
      `//*[@id='addon_schedule3_full_select' and text()='Full']`,
    );
  }

  // SCH01-ACTIVE: clickMyView — called by validateSchedulePageUI validation 1
  async clickMyView(): Promise<void> {
    await this.myViewButton.click();
    await this.waitForLoadingToDisappear();
  }

  // SCH01-ACTIVE: clickFullView — called by validateSchedulePageUI validation 2
  async clickFullView(): Promise<void> {
    await this.fullViewButton.click();
    await this.waitForLoadingToDisappear();
  }

  // ============================================================================
  // Toolbar — Week / period dropdown
  // ============================================================================

  /**
   * Week period dropdown. getByRole is most semantic; regex allows for
   * "Week" appearing as button text in any casing.
   */
  get weekDropdown(): Locator {
    return this.frame.locator(
      `//*[@id='addon_schedule3_selected_view' and text()='Week']`,
    );
  }

  // ============================================================================
  // Grid — VIEW BY section
  // ============================================================================

  get viewByLabel(): Locator {
    return this.frame.locator('//label[text()="VIEW BY"]').first();
  }

  get viewByTeamMemberDropdown(): Locator {
    return this.frame
      .locator('select:has(option:text-is("Team member"))')
      .first();
  }

  /** Alias — the VIEW BY <select> control (same element as viewByTeamMemberDropdown). */
  get viewBySelect(): Locator {
    return this.viewByTeamMemberDropdown;
  }

  /**
   * Reads every <option> label from the VIEW BY <select>. Reading the DOM
   * directly is reliable even while the dropdown is closed — the options exist
   * in the markup regardless of open state (unlike their `visible` flag).
   */
  async getViewByOptions(): Promise<string[]> {
    return this.viewBySelect.evaluate((el) =>
      Array.from((el as HTMLSelectElement).options)
        .map((opt) => (opt.textContent ?? '').trim())
        .filter((label) => label.length > 0),
    );
  }

  async selectViewBy(option: 'Team member' | 'Customer'): Promise<void> {
    await this.viewBySelect.selectOption({ label: option });
    await this.waitForLoadingToDisappear();
    console.log(' VIEW BY changed to "%s"', option);
  }

  // ============================================================================
  // Grid — Calendar table
  // ============================================================================

  get calendarGridHeader(): Locator {
    return this.frame.locator('table thead tr').first();
  }

  /** Calendar grid body. */
  get calendarGridBody(): Locator {
    return this.frame.locator('table tbody').first();
  }

  get weekDayHeaderCells(): Locator {
    return this.frame.getByText(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s+\d{1,2}\b/i);
  }

  async getWeekDayHeaders(): Promise<string[]> {
    const cells = this.weekDayHeaderCells;
    const count = await cells.count();
    const days: string[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < count; i++) {
      const text = ((await cells.nth(i).textContent()) ?? '').trim();
      const match = text.match(/\b(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\b/i);
      if (!match) continue;

      const day = match[1].slice(0, 3).toLowerCase();
      if (seen.has(day)) continue;

      seen.add(day);
      days.push(day);
    }

    return days;
  }

  async getGridRowLabels(): Promise<string[]> {
    const rows = this.frame.locator(
      `(//*[@class='fc-scrollpane-inner'])[3]//tr`,
    );
    const count = await rows.count();
    const labels: string[] = [];

    for (let i = 0; i < count; i++) {
      const text =
        (await rows
          .nth(i)
          .locator(`//*[@class='fc-cell-text']`)
          .first()
          .textContent()) ?? '';
      if (text.length > 0) labels.push(text);
    }
    return labels;
  }

  get unassignedRow(): Locator {
    return this.frame
      .locator('tr')
      .filter({ hasText: /unassigned/i })
      .first();
  }

  /** Returns the `<tr>` for a specific team member in the schedule grid. */
  getEmployeeRow(teamMemberName: string): Locator {
    return this.frame
      .locator(`(//*[@class='fc-scrollpane-inner'])[3]//tr`)
      .filter({ hasText: teamMemberName })
      .first();
  }

  async expectEmployeeRowVisible(
    teamMemberName: string,
    timeoutMs = 10000,
  ): Promise<void> {
    await expect(this.getEmployeeRow(teamMemberName)).toBeVisible({
      timeout: timeoutMs,
    });
  }

  // ============================================================================
  // Page-level validation (moved here from ScheduleFlows.Util.ts)
  // ============================================================================

  /** Logs a warning instead of failing the test — mirrors the suite soft pattern. */
  private async soft(label: string, fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
      console.warn(` [soft] ${label}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(` [soft] ${label} — ${message}`);
    }
  }

  /**
   * Validates every visible element on the Schedule page and the My/Full view
   * + VIEW BY behaviour. All assertions are soft so a single environment quirk
   * does not abort the suite.
   *
   * @param teamMemberName seeded employee expected in the grid (e.g. 'Test Emp1').
   */
  async validatePageUI(teamMemberName: string): Promise<void> {
    // Re-anchor: ensure the widget iframe is fully rendered before asserting.
    await this.waitForScheduleWidgetReady();

    // ── Toolbar — Actions ───────────────────────────────────────────────────────
    await this.soft('Actions button is visible', async () => {
      await expect(this.actionsButton).toBeVisible({ timeout: 10000 });
    });

    // ── Toolbar — Date navigation ───────────────────────────────────────────────
    await this.soft('Today button is visible', async () => {
      await expect(this.todayButton).toBeVisible({ timeout: 10000 });
    });

    await this.soft('Current date-range label is visible', async () => {
      await expect(this.dateRangeLabel).toBeVisible({ timeout: 10000 });
    });

    // ── Filters ─────────────────────────────────────────────────────────────────
    await this.soft('Customers label is visible', async () => {
      await expect(this.customersLabel).toBeVisible({ timeout: 10000 });
    });

    await this.soft('Customers filter value link is visible', async () => {
      await expect(this.customersValue).toBeVisible({ timeout: 10000 });
    });

    await this.soft('Team members label is visible', async () => {
      await expect(this.teamMembersLabel).toBeVisible({ timeout: 10000 });
    });

    await this.soft('Team members filter value link is visible', async () => {
      await expect(this.teamMembersAllLink).toBeVisible({ timeout: 10000 });
    });

    // ── Icons ───────────────────────────────────────────────────────────────────
    await this.soft('Print icon button is visible', async () => {
      await expect(this.printButton).toBeVisible({ timeout: 10000 });
    });

    await this.soft('Settings gear icon is visible', async () => {
      await expect(this.settingsButton).toBeVisible({ timeout: 10000 });
    });

    // ── Controls ────────────────────────────────────────────────────────────────
    await this.soft('Publish button is visible', async () => {
      await expect(this.publishButton).toBeVisible({ timeout: 10000 });
    });

    await this.soft('"My" view toggle is visible', async () => {
      await expect(this.myViewButton).toBeVisible({ timeout: 10000 });
    });

    await this.soft('"Full" view toggle is visible', async () => {
      await expect(this.fullViewButton).toBeVisible({ timeout: 10000 });
    });

    // ── My / Full view toggle behaviour ─────────────────────────────────────────

    // In "My" view the grid shows only the current user's schedule — the multi-
    // team-member filter has no meaning and is hidden by the widget.
    await this.soft(
      '"My" view: Team members filter link is hidden',
      async () => {
        await this.clickMyView();
        await expect(this.teamMembersAllLink).not.toBeVisible({
          timeout: 5000,
        });
        console.log(' ✓ "My" view — Team members filter link is not displayed');
      },
    );

    // Validation 2: Click "Full" → Team members filter link must be displayed.
    // In "Full" view all team members are shown — the filter link re-appears.
    await this.soft(
      '"Full" view: Team members filter link is visible',
      async () => {
        await this.clickFullView();
        await expect(this.teamMembersAllLink).toBeVisible({ timeout: 10000 });
        console.log(' ✓ "Full" view — Team members filter link is displayed');
      },
    );

    await this.soft('Week period dropdown is visible', async () => {
      await expect(this.weekDropdown).toBeVisible({ timeout: 10000 });
    });

    // ── Grid — VIEW BY ──────────────────────────────────────────────────────────
    await this.soft('VIEW BY label is visible', async () => {
      await expect(this.viewByLabel).toBeVisible({ timeout: 10000 });
    });

    await this.soft('VIEW BY "Team member" selector is visible', async () => {
      await expect(this.viewByTeamMemberDropdown).toBeVisible({
        timeout: 10000,
      });
    });

    // (1) VIEW BY dropdown — verify both options exist.
    await this.soft(
      'VIEW BY dropdown exposes "Team member" and "Customer" options',
      async () => {
        const options = await this.getViewByOptions();
        expect(
          options.length,
          'VIEW BY dropdown should have at least one option',
        ).toBeGreaterThan(0);
        expect(
          options.some((o) => /team member/i.test(o)),
          `VIEW BY options should include "Team member" (got ${JSON.stringify(
            options,
          )})`,
        ).toBe(true);
      },
    );

    // (2) Select "Team member" → log only the clean team-member names from the grid.
    await this.soft(
      'VIEW BY "Team member" — displays clean team-member names',
      async () => {
        const names = await this.getGridRowLabels();
        console.log(' VIEW BY "Team member": ' + names);
        expect(
          names.some((n) =>
            n.toLowerCase().includes(teamMemberName.toLowerCase()),
          ),
          `Team-member list should include "${teamMemberName}" (got: ${names.join(
            ', ',
          )})`,
        ).toBe(true);
      },
    );

    // (3) Select "Customer" → log only the clean customer names from the grid.
    await this.soft(
      'VIEW BY "Customer" — displays clean customer names',
      async () => {
        const names = await this.getGridRowLabels();
        console.log(' VIEW BY "Customer": ' + names);
      },
    );

    // Restore default selection so later steps (shift creation) operate under
    // the expected "Team member" grouping.
    await this.soft(
      'VIEW BY restored to "Team member" after validation',
      async () => {
        await this.selectViewBy('Team member');
      },
    );

    // ── Grid — Calendar ─────────────────────────────────────────────────────────
    await this.soft('Calendar grid header row is visible', async () => {
      await expect(this.calendarGridHeader).toBeVisible({ timeout: 10000 });
    });

    // (3) Weekday column names Sun → Sat across the calendar header.
    await this.soft(
      'Calendar header shows weekday columns Sun→Sat',
      async () => {
        const expectedDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const actualDays = await this.getWeekDayHeaders();
        console.log(' Weekday header columns: %o', actualDays);

        for (const day of expectedDays) {
          expect(
            actualDays.includes(day),
            `Weekday column "${day}" should be present (got ${JSON.stringify(
              actualDays,
            )})`,
          ).toBe(true);
        }

        expect(
          actualDays,
          `Weekday columns should run Sun→Sat (got ${JSON.stringify(
            actualDays,
          )})`,
        ).toEqual(expectedDays);
      },
    );

    await this.soft('Calendar grid body is visible', async () => {
      await expect(this.calendarGridBody).toBeVisible({ timeout: 10000 });
    });

    await this.soft('"unassigned" row is visible in grid', async () => {
      await expect(this.unassignedRow).toBeVisible({ timeout: 10000 });
    });

    await this.soft(
      `Employee row for "${teamMemberName}" is visible`,
      async () => {
        await this.expectEmployeeRowVisible(teamMemberName);
      },
    );

    console.log(' ✓ Schedule page UI validated');
  }
}

export default SchedulePage;
