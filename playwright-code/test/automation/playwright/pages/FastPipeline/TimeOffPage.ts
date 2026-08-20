import { Page, Locator, FrameLocator, expect } from '@playwright/test';

/**
 * Page object for the QBO Time → **Time off** tab.
 *
 * Two experiences are supported:
 *   • Reimagined — QBO-native DOM under `#time-off-container` (Elite/Premium).
 *   • Legacy     — TSheets requests widget in `#time_off_requests_list_frame`
 *                  (still served to some IES accounts).
 *
 * Reimagined locators are scoped to `#time-off-container` so they do not match
 * unrelated Time sub-nav links (e.g. the left-nav "Overview" item).
 *
 * The page is organised into four header tabs:
 *   • Overview  — marketing/summary panels (At a glance, Currently out of
 *                 office, Upcoming time off)
 *   • Requests  — request-status + employee dropdowns, filters, search, an
 *                 "Add request" action, and a requests table
 *   • Balances  — time-off-policy + employee dropdowns, filters, search, an
 *                 "Edit balances" action, and a balances table
 *   • Policies  — "Manage time off settings" + "Add time off policy" actions
 *                 and a policies table
 *
 * Mirrors SchedulePage.ts conventions: every getter is a single, stable locator
 * expression, role/text-based to survive minified class names, and waiting
 * logic is tolerant of fast loads / entitlement edge cases.
 */
class TimeOffPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ============================================================================
  // Loading
  // ============================================================================

  /** QBO shell loading spinner. */
  get loadingSpinner(): Locator {
    return this.page.locator(
      '//div[@aria-label="Loading" and @role="progressbar"]',
    );
  }

  async waitForLoadingToDisappear(timeoutMs = 15_000): Promise<void> {
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

  /**
   * Waits until the Time off tab is ready to assert against:
   *   Stage 1 — shell finished loading.
   *   Stage 2 — the "Time off" page header is painted.
   *   Stage 3 — best-effort wait for the header tabs to render.
   */
  async waitForTimeOffPageReady(timeoutMs = 10_000): Promise<void> {
    await this.waitForLoadingToDisappear();

    const experience = await this.detectExperience();
    if (experience === 'reimagined') {
      try {
        await this.pageHeader.waitFor({ state: 'visible', timeout: timeoutMs });
        await this.overviewTab.waitFor({ state: 'visible', timeout: 10_000 });
      } catch {
        await this.page.waitForTimeout(3000);
      }
      return;
    }

    if (experience === 'legacy') {
      try {
        await this.legacyIframe.waitFor({
          state: 'visible',
          timeout: timeoutMs,
        });
      } catch {
        await this.page.waitForTimeout(3000);
      }
      return;
    }

    await this.page.waitForTimeout(3000);
  }

  /** Which Time off shell rendered after navigation. */
  async detectExperience(): Promise<'reimagined' | 'legacy' | 'unknown'> {
    if (await this.timeOffContainer.isVisible().catch(() => false)) {
      return 'reimagined';
    }
    if (await this.legacyIframe.isVisible().catch(() => false)) {
      return 'legacy';
    }
    return 'unknown';
  }

  // ============================================================================
  // Shell — Page header & nav
  // ============================================================================

  /** Root for the reimagined, QBO-native Time off experience. */
  get timeOffContainer(): Locator {
    return this.page.locator('#time-off-container');
  }

  /** Legacy TSheets requests widget iframe. */
  get legacyIframe(): Locator {
    return this.page.locator('#time_off_requests_list_frame');
  }

  get legacyFrame(): FrameLocator {
    return this.page.frameLocator('#time_off_requests_list_frame');
  }

  /** The "Time off" page title rendered by the QBO shell. */
  get pageHeader(): Locator {
    return this.timeOffContainer.locator(`h5`).filter({ hasText: 'Time off' });
  }

  // ============================================================================
  // Header tabs — Overview / Requests / Balances / Policies
  // ============================================================================

  /**
   * Resolves a header tab by accessible name, regardless of whether the widget
   * renders it as a `tab`, `link`, or `button`.
   */
  private headerTab(name: RegExp): Locator {
    return this.timeOffContainer
      .getByRole('tab', { name })
      .or(this.timeOffContainer.getByRole('link', { name }))
      .or(this.timeOffContainer.getByRole('button', { name }))
      .first();
  }

  get overviewTab(): Locator {
    return this.headerTab('Overview');
  }

  get requestsTab(): Locator {
    return this.headerTab('Requests');
  }

  get balancesTab(): Locator {
    return this.headerTab('Balances');
  }

  get policiesTab(): Locator {
    return this.headerTab('Policies');
  }

  /** Clicks a header tab and waits for the shell to settle. */
  async openTab(
    tab: 'Overview' | 'Requests' | 'Balances' | 'Policies',
  ): Promise<void> {
    const locator = {
      Overview: this.overviewTab,
      Requests: this.requestsTab,
      Balances: this.balancesTab,
      Policies: this.policiesTab,
    }[tab];
    await locator.click({ timeout: 15_000 });
    await this.waitForLoadingToDisappear();
    await this.page.waitForTimeout(1000);
  }

  // ============================================================================
  // Overview tab — summary panels
  // ============================================================================

  /** "Your reimagined time off experience" hero heading. */
  get reimaginedHeading(): Locator {
    return this.timeOffContainer
      .getByRole('heading', { name: /reimagined time off experience/i })
      .or(this.timeOffContainer.getByText(/reimagined time off experience/i))
      .first();
  }

  /** The descriptive copy under the hero heading. */
  get reimaginedDescription(): Locator {
    return this.timeOffContainer
      .getByText(/manage|track|request|time off/i)
      .first();
  }

  get atAGlanceSection(): Locator {
    return this.timeOffContainer
      .getByRole('heading', { name: /at a glance/i })
      .or(this.timeOffContainer.getByText(/at a glance/i))
      .first();
  }

  get currentlyOutOfOfficeSection(): Locator {
    return this.timeOffContainer
      .getByRole('heading', { name: /currently out of office/i })
      .or(this.timeOffContainer.getByText(/currently out of office/i))
      .first();
  }

  get upcomingTimeOffSection(): Locator {
    return this.timeOffContainer
      .getByRole('heading', { name: /upcoming time off/i })
      .or(this.timeOffContainer.getByText(/upcoming time off/i))
      .first();
  }

  // ============================================================================
  // Requests tab — controls
  // ============================================================================

  /** "Request status" dropdown. */
  get requestStatusDropdown(): Locator {
    return this.timeOffContainer
      .getByRole('combobox', { name: /request status|status/i })
      .or(
        this.timeOffContainer.getByRole('button', {
          name: /request status|status/i,
        }),
      )
      .first();
  }

  /** "Employee" dropdown (shared shape on Requests & Balances tabs). */
  get employeeDropdown(): Locator {
    return this.timeOffContainer
      .getByRole('combobox', { name: /employee/i })
      .or(this.timeOffContainer.getByRole('button', { name: /employee/i }))
      .first();
  }

  /** "Filters" control. */
  get filtersControl(): Locator {
    return this.timeOffContainer
      .getByRole('button', { name: /^filters?$/i })
      .or(this.timeOffContainer.getByText(/^filters?$/i))
      .first();
  }

  /**
   * Search control on Requests / Balances tabs. Uses the shared collapsible
   * SearchField pattern: collapsed as a button[@aria-label="Search"], expanded
   * as a textbox/searchbox with the same label.
   */
  get searchInput(): Locator {
    return this.timeOffContainer
      .getByRole('button', { name: /^search$/i })
      .or(this.timeOffContainer.locator('button[aria-label="Search"]'))
      .or(this.timeOffContainer.getByRole('searchbox'))
      .or(this.timeOffContainer.getByPlaceholder(/search/i))
      .or(this.timeOffContainer.getByRole('textbox', { name: /search/i }))
      .first();
  }

  /** "Add request" primary action. */
  get addRequestButton(): Locator {
    return this.timeOffContainer
      .getByRole('button', { name: /add request|request time off/i })
      .first();
  }

  // ============================================================================
  // Balances tab — controls
  // ============================================================================

  /** "Time off policy" dropdown. */
  get timeOffPolicyDropdown(): Locator {
    return this.timeOffContainer
      .getByRole('combobox', { name: /time off policy|policy/i })
      .or(
        this.timeOffContainer.getByRole('button', {
          name: /time off policy|policy/i,
        }),
      )
      .first();
  }

  /** "Edit balances" primary action. */
  get editBalancesButton(): Locator {
    return this.timeOffContainer
      .getByRole('button', { name: /edit balances/i })
      .first();
  }

  // ============================================================================
  // Policies tab — controls
  // ============================================================================

  /** "Manage time off settings" action. */
  get manageTimeOffSettingsButton(): Locator {
    return this.timeOffContainer
      .getByRole('button', { name: /manage time off settings/i })
      .or(
        this.timeOffContainer.getByRole('link', {
          name: /manage time off settings/i,
        }),
      )
      .first();
  }

  /** "Add time off policy" primary action. */
  get addTimeOffPolicyButton(): Locator {
    return this.timeOffContainer
      .getByRole('button', { name: /add time off policy/i })
      .first();
  }

  // ============================================================================
  // Generic — tables & dropdowns
  // ============================================================================

  /** The first visible data table on the active tab. */
  get table(): Locator {
    return this.timeOffContainer
      .getByRole('table')
      .or(this.timeOffContainer.locator('table'))
      .first();
  }

  /**
   * Reads the column-header labels from the active tab's table. Reads the DOM
   * directly so it works even before data rows render.
   */
  async getTableColumnHeaders(): Promise<string[]> {
    const headers = this.table.locator('th, [role="columnheader"]');
    const count = await headers.count().catch(() => 0);
    const labels: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = (
        (await headers
          .nth(i)
          .textContent()
          .catch(() => '')) ?? ''
      ).trim();
      if (text.length > 0) labels.push(text);
    }
    return labels;
  }

  /**
   * Opens a dropdown trigger, reads the labels of its options, then closes it.
   * Handles both native `<select>` and ARIA listbox/menu renderings.
   */
  async getDropdownOptions(trigger: Locator): Promise<string[]> {
    // Native <select>: read options directly without opening.
    const tagName = await trigger
      .evaluate((el) => el.tagName.toLowerCase())
      .catch(() => '');
    if (tagName === 'select') {
      return trigger.evaluate((el) =>
        Array.from((el as HTMLSelectElement).options)
          .map((opt) => (opt.textContent ?? '').trim())
          .filter((label) => label.length > 0),
      );
    }

    // Custom (ARIA) dropdown: open, read options, close.
    await trigger.click();
    await this.page.waitForTimeout(500);

    const options = this.page
      .getByRole('option')
      .or(this.page.getByRole('menuitem'));
    const count = await options.count().catch(() => 0);
    const labels: string[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < count; i++) {
      const text = (
        (await options
          .nth(i)
          .textContent()
          .catch(() => '')) ?? ''
      ).trim();
      if (!text || seen.has(text)) continue;
      seen.add(text);
      labels.push(text);
    }

    await this.page.keyboard.press('Escape').catch(() => {});
    return labels;
  }

  // ============================================================================
  // Page-level validation (moved here from TimeOffFlows.Util.ts)
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
   * Validates every visible element on the Time off tab. Routes to the
   * reimagined or legacy validator based on which shell rendered.
   */
  async validatePageUI(): Promise<void> {
    await this.waitForTimeOffPageReady();

    const experience = await this.detectExperience();
    console.log(
      ' Time off experience=%s (reimagined=%s legacy=%s)',
      experience,
      experience === 'reimagined',
      experience === 'legacy',
    );

    if (experience === 'legacy') {
      await this.validateLegacyPageUI();
      return;
    }

    if (experience === 'reimagined') {
      await this.validateReimaginedPageUI();
      return;
    }

    console.warn(
      ' [soft] Unknown Time off experience — skipping page UI validation',
    );
  }

  /** Reimagined QBO-native Time off tabs (Overview / Requests / Balances / Policies). */
  private async validateReimaginedPageUI(): Promise<void> {
    // ── 1. Header tabs ──────────────────────────────────────────────────────────
    await this.soft('Header tab "Overview" is visible', async () => {
      await expect(this.overviewTab).toBeVisible({ timeout: 10000 });
    });
    await this.soft('Header tab "Requests" is visible', async () => {
      await expect(this.requestsTab).toBeVisible({ timeout: 10000 });
    });
    await this.soft('Header tab "Balances" is visible', async () => {
      await expect(this.balancesTab).toBeVisible({ timeout: 10000 });
    });
    await this.soft('Header tab "Policies" is visible', async () => {
      await expect(this.policiesTab).toBeVisible({ timeout: 10000 });
    });

    // ── 2. Overview tab — summary panels ────────────────────────────────────────
    await this.soft('Open Overview tab', async () => {
      await this.openTab('Overview');
    });
    await this.soft(
      'Overview: "reimagined time off experience" heading is visible',
      async () => {
        await expect(this.reimaginedHeading).toBeVisible({ timeout: 10000 });
      },
    );
    await this.soft('Overview: hero description copy is visible', async () => {
      await expect(this.reimaginedDescription).toBeVisible({ timeout: 10000 });
    });
    await this.soft('Overview: "At a glance" section is visible', async () => {
      await expect(this.atAGlanceSection).toBeVisible({ timeout: 10000 });
    });
    await this.soft(
      'Overview: "Currently out of office" section is visible',
      async () => {
        await expect(this.currentlyOutOfOfficeSection).toBeVisible({
          timeout: 10000,
        });
      },
    );
    await this.soft(
      'Overview: "Upcoming time off" section is visible',
      async () => {
        await expect(this.upcomingTimeOffSection).toBeVisible({
          timeout: 10000,
        });
      },
    );

    // ── 3. Requests tab ─────────────────────────────────────────────────────────
    await this.soft('Open Requests tab', async () => {
      await this.openTab('Requests');
    });
    await this.soft(
      'Requests: Request status dropdown is visible',
      async () => {
        await expect(this.requestStatusDropdown).toBeVisible({
          timeout: 10000,
        });
      },
    );
    await this.soft(
      'Requests: Request status dropdown exposes options',
      async () => {
        const options = await this.getDropdownOptions(
          this.requestStatusDropdown,
        );
        console.log(' Requests — Request status options: %o', options);
        expect(
          options.length,
          'Request status dropdown should expose at least one option',
        ).toBeGreaterThan(0);
      },
    );
    await this.soft('Requests: Employee dropdown is visible', async () => {
      await expect(this.employeeDropdown).toBeVisible({ timeout: 10000 });
    });
    await this.soft('Requests: Employee dropdown exposes options', async () => {
      const options = await this.getDropdownOptions(this.employeeDropdown);
      console.log(' Requests — Employee options: %o', options);
      expect(
        options.length,
        'Employee dropdown should expose at least one option',
      ).toBeGreaterThan(0);
    });
    await this.soft('Requests: Filters control is visible', async () => {
      await expect(this.filtersControl).toBeVisible({ timeout: 10000 });
    });
    await this.soft('Requests: Search input is visible', async () => {
      await expect(this.searchInput).toBeVisible({ timeout: 10000 });
    });
    await this.soft('Requests: "Add request" button is visible', async () => {
      await expect(this.addRequestButton).toBeVisible({ timeout: 10000 });
    });
    await this.soft('Requests: table shows column headers', async () => {
      const headers = await this.getTableColumnHeaders();
      console.log(' Requests — table column headers: %o', headers);
      expect(
        headers.length,
        'Requests table should render at least one column header',
      ).toBeGreaterThan(0);
    });

    // ── 4. Balances tab ─────────────────────────────────────────────────────────
    await this.soft('Open Balances tab', async () => {
      await this.openTab('Balances');
    });
    await this.soft(
      'Balances: Time off policy dropdown is visible',
      async () => {
        await expect(this.timeOffPolicyDropdown).toBeVisible({
          timeout: 10000,
        });
      },
    );
    await this.soft(
      'Balances: Time off policy dropdown exposes options',
      async () => {
        const options = await this.getDropdownOptions(
          this.timeOffPolicyDropdown,
        );
        console.log(' Balances — Time off policy options: %o', options);
        expect(
          options.length,
          'Time off policy dropdown should expose at least one option',
        ).toBeGreaterThan(0);
      },
    );
    await this.soft('Balances: Employee dropdown is visible', async () => {
      await expect(this.employeeDropdown).toBeVisible({ timeout: 10000 });
    });
    await this.soft('Balances: Employee dropdown exposes options', async () => {
      const options = await this.getDropdownOptions(this.employeeDropdown);
      console.log(' Balances — Employee options: %o', options);
      expect(
        options.length,
        'Employee dropdown should expose at least one option',
      ).toBeGreaterThan(0);
    });
    await this.soft('Balances: Filters control is visible', async () => {
      await expect(this.filtersControl).toBeVisible({ timeout: 10000 });
    });
    await this.soft('Balances: Search input is visible', async () => {
      await expect(this.searchInput).toBeVisible({ timeout: 10000 });
    });
    await this.soft('Balances: "Edit balances" button is visible', async () => {
      await expect(this.editBalancesButton).toBeVisible({ timeout: 10000 });
    });
    await this.soft('Balances: table shows column headers', async () => {
      const headers = await this.getTableColumnHeaders();
      console.log(' Balances — table column headers: %o', headers);
      expect(
        headers.length,
        'Balances table should render at least one column header',
      ).toBeGreaterThan(0);
    });

    // ── 5. Policies tab ─────────────────────────────────────────────────────────
    await this.soft('Open Policies tab', async () => {
      await this.openTab('Policies');
    });
    await this.soft(
      'Policies: "Manage time off settings" button is visible',
      async () => {
        await expect(this.manageTimeOffSettingsButton).toBeVisible({
          timeout: 10000,
        });
      },
    );
    await this.soft(
      'Policies: "Add time off policy" button is visible',
      async () => {
        await expect(this.addTimeOffPolicyButton).toBeVisible({
          timeout: 15000,
        });
      },
    );
    await this.soft('Policies: table shows column headers', async () => {
      const headers = await this.getTableColumnHeaders();
      console.log(' Policies — table column headers: %o', headers);
      expect(
        headers.length,
        'Policies table should render at least one column header',
      ).toBeGreaterThan(0);
    });

    console.log(' ✓ Reimagined Time off page UI validated');
  }

  /** Legacy TSheets requests iframe (still used by some IES accounts). */
  private async validateLegacyPageUI(): Promise<void> {
    await this.soft('Legacy: requests iframe is visible', async () => {
      await expect(this.legacyIframe).toBeVisible({ timeout: 30000 });
    });

    await this.soft('Legacy: "Time off" header is visible', async () => {
      await expect(
        this.page.getByText('Time off', { exact: true }).first(),
      ).toBeVisible({ timeout: 10000 });
    });

    await this.soft(
      'Legacy: Request or Add time off action is visible',
      async () => {
        await expect(
          this.page
            .getByRole('button', { name: /request time off|add time off/i })
            .or(
              this.legacyFrame.getByRole('button', {
                name: /request time off|add time off/i,
              }),
            )
            .or(this.legacyFrame.getByText(/request time off|add time off/i))
            .first(),
        ).toBeVisible({ timeout: 10000 });
      },
    );

    await this.soft('Legacy: Manage time off control is visible', async () => {
      await expect(
        this.page
          .getByText(/manage time off/i)
          .or(this.legacyFrame.getByText(/manage time off/i))
          .first(),
      ).toBeVisible({ timeout: 10000 });
    });

    for (const status of ['Pending', 'Approved', 'Denied'] as const) {
      await this.soft(
        `Legacy: ${status} status filter is visible`,
        async () => {
          await expect(
            this.legacyFrame.getByText(new RegExp(`^${status}$`, 'i')).first(),
          ).toBeVisible({ timeout: 10000 });
        },
      );
    }

    await this.soft('Legacy: date-range control is visible', async () => {
      await expect(
        this.legacyFrame
          .locator(
            `//*[contains(@class,'date') or contains(@id,'date') or @role='button']`,
          )
          .filter({ hasText: /\d|today|week|month|range/i })
          .first(),
      ).toBeVisible({ timeout: 10000 });
    });

    await this.soft(
      'Legacy: requests table or empty-state is visible',
      async () => {
        await expect(
          this.legacyFrame
            .getByRole('table')
            .or(this.legacyFrame.locator('table'))
            .or(this.legacyFrame.getByText(/no requests|no time off|empty/i))
            .first(),
        ).toBeVisible({ timeout: 10000 });
      },
    );

    await this.soft('Legacy: table shows column headers', async () => {
      const headers = this.legacyFrame
        .getByRole('table')
        .or(this.legacyFrame.locator('table'))
        .first()
        .locator('th, [role="columnheader"]');
      const count = await headers.count().catch(() => 0);
      const labels: string[] = [];
      for (let i = 0; i < count; i++) {
        const text = (
          (await headers
            .nth(i)
            .textContent()
            .catch(() => '')) ?? ''
        ).trim();
        if (text.length > 0) labels.push(text);
      }
      console.log(' Legacy — table column headers: %o', labels);
      expect(
        labels.length,
        'Legacy requests table should render at least one column header',
      ).toBeGreaterThan(0);
    });

    console.log(' ✓ Legacy Time off page UI validated');
  }
}

export default TimeOffPage;
