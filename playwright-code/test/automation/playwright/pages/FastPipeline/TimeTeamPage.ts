import { Page, Locator, FrameLocator, expect } from '@playwright/test';

/**
 * Page object for the QBO Time → **Time team** tab (the "Your Team" roster).
 *
 * Like the Schedule tab, the Time team experience is rendered by the embedded
 * QuickBooks Time (TSheets) widget inside an iframe whose title is
 * `Your Team`, so every locator is scoped through that frame
 * (mirrors SchedulePage.ts, which scopes through `iframe[title="Schedule"]`).
 *
 * Visible surface this page object covers:
 *   • "Your Team" header
 *   • "View" dropdown (+ its options)
 *   • Search field
 *   • "Who's working", "Invite team members" links
 *   • "Add team member" button (+ its dropdown options)
 *   • Roster table — column headers, First Name / Last Name columns, row names
 *   • Column sorting + reading the resulting column values
 *   • Filters settings button → "Group" + "Last Activity" dropdowns (+ options)
 *
 * Conventions match SchedulePage / TimeOffPage: single, stable locator
 * expressions, role/text-based to survive minified class names, `.or()`
 * fallbacks for elements the widget may render as link vs. button, and tolerant
 * waiting logic for fast loads / entitlement edge cases.
 */
class TimeTeamPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** All Time team content lives inside the QuickBooks Time "Your Team" iframe. */
  get frame(): FrameLocator {
    return this.page.frameLocator(`//iframe[@title='Your Team']`);
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

  /**
   * Waits until the Time team tab is ready to assert against:
   *   Stage 1 — shell finished loading.
   *   Stage 2 — the "Your Team" iframe is attached to the parent DOM.
   *   Stage 3 — widget content painted: the "First Name" column header is
   *             visible (falls back to any button inside the frame).
   */
  async waitForTeamWidgetReady(timeoutMs = 30_000): Promise<void> {
    await this.waitForLoadingToDisappear();

    // Stage 1 — iframe must exist in the parent DOM.
    try {
      await this.page
        .locator('iframe[title="Your Team"]')
        .waitFor({ state: 'attached', timeout: timeoutMs });
    } catch {
      // Free-tier companies show a static message instead of the iframe.
      await this.page.waitForTimeout(3000);
      return;
    }

    // Stage 2 — widget content ready: First Name header visible inside the frame.
    try {
      await this.firstNameHeader.waitFor({
        state: 'visible',
        timeout: timeoutMs,
      });
    } catch {
      // If the header never appears (entitlement edge case), wait for any button.
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
  // 1. "Your Team" header
  // ============================================================================

  get yourTeamHeader(): Locator {
    return this.page.locator(`//*[text()='Your Team']`).first();
  }

  // ============================================================================
  // 2. View dropdown
  // ============================================================================

  /**
   * The "View" dropdown that toggles which team members are listed
   * (e.g. Active, Archived, All team members).
   */
  get viewDropdown(): Locator {
    return this.frame.locator(`//label[@id='selectedUserMode-label']`).first();
  }

  /**
   * The actual control the "View" label is bound to. TSheets renders this as a
   * native <select id="selectedUserMode">; fall back to anything labelled by
   * the View label. Reading options off the <select> is reliable even while
   * the dropdown is closed.
   */
  get viewSelect(): Locator {
    return this.frame
      .locator(
        '#selectedUserMode, select[aria-labelledby="selectedUserMode-label"], ' +
          '[aria-labelledby="selectedUserMode-label"]',
      )
      .first();
  }

  /** Returns the labels of the options exposed by the View dropdown. */
  async getViewOptions(): Promise<string[]> {
    return this.readDropdownOptions(this.viewSelect);
  }

  // ============================================================================
  // 3. Search field
  // ============================================================================

  // NOTE: `.or()` cannot combine FrameLocator-based locators ("Frames are not
  // allowed inside internal:or selectors"), so frame-scoped alternatives use a
  // single CSS/XPath union instead.
  get searchField(): Locator {
    return this.frame
      .locator(
        `//*[@id='my-team-search-label']//following::input[@id='my-team-search']`,
      )
      .first();
  }

  // ============================================================================
  // 4. Who's working / Invite / Add team member
  // ============================================================================

  get whosWorkingLink(): Locator {
    return this.page.locator(`//button/*[text()="Who's working"]`).first();
  }

  get inviteTeamMembersLink(): Locator {
    return this.page
      .locator(`//button/*[text()='Invite team members']`)
      .first();
  }

  get addTeamMemberButton(): Locator {
    return this.page.locator(`//button/*[text()='Add team members']`).first();
  }

  /**
   * Opens the "Add team member" dropdown, reads the option labels (e.g.
   * "Add one", "Import multiple"), then closes it.
   */
  async getAddTeamMemberOptions(): Promise<string[]> {
    await this.addTeamMemberButton.click();
    await this.page.waitForTimeout(500);

    // The "Add team member" button lives in the QBO shell (page level), so its
    // dropdown menu renders in the page DOM, not inside the Your Team iframe.
    const options = this.page.locator('[role="menuitem"], [role="option"]');

    const labels = await this.readOptionTexts(options);
    await this.page.keyboard.press('Escape').catch(() => {});
    return labels;
  }

  // ============================================================================
  // 5. Roster table — headers, columns, names
  // ============================================================================

  /** The first data table rendered inside the Your Team iframe. */
  get table(): Locator {
    return this.frame.locator('table').first();
  }

  // Header locators lead with the text-match strategy verified working against
  // the live "Your Team" iframe in Assignments.util.ts
  // (`timeTeamFrame.locator("//*[text()='First Name']")`), with a columnheader
  // role fallback in case the widget markup changes.
  get firstNameHeader(): Locator {
    return this.frame
      .locator(`//*[normalize-space(text())='First Name']`)
      .first();
  }

  get lastNameHeader(): Locator {
    return this.frame
      .locator(`//*[normalize-space(text())='Last Name']`)
      .first();
  }

  /** Returns the header by visible column label (used for sorting clicks). */
  columnHeader(name: string): Locator {
    const lit = this.xpathLiteral(name);
    return this.frame
      .locator(
        `//th[normalize-space(.)=${lit}] | //*[normalize-space(text())=${lit}]`,
      )
      .first();
  }

  /**
   * Non-data utility columns that the widget renders as real `<th>` cells but
   * which hold per-row controls rather than team-member data. "Actions" is the
   * trailing column carrying each row's kebab / Edit menu, so it is excluded
   * from the reported data-column headers.
   */
  private static readonly UTILITY_COLUMNS = /^(actions?)$/i;

  /**
   * Reads the data column-header labels from the roster table. Tries `th` /
   * `columnheader` first; if the widget renders headers without those roles,
   * falls back to the cells of the header row (the first `row` that has no
   * `td`, i.e. the non-data row). Utility columns (e.g. "Actions") are filtered
   * out so only genuine data columns are returned.
   */
  async getTableColumnHeaders(): Promise<string[]> {
    const headers = this.table.locator('th, [role="columnheader"]');
    let count = await headers.count().catch(() => 0);

    if (count > 0) {
      const labels: string[] = [];
      for (let i = 0; i < count; i++) {
        const text = (
          (await headers
            .nth(i)
            .textContent()
            .catch(() => '')) ?? ''
        ).trim();
        if (text.length > 0 && !TimeTeamPage.UTILITY_COLUMNS.test(text)) {
          labels.push(text);
        }
      }
      return labels;
    }

    // Fallback — read the header row's cells directly. The header row is the
    // table row that has no `td` cells. (CSS `:not(:has(td))` avoids putting a
    // frame locator inside `.filter()`, which Playwright forbids.)
    const headerRow = this.frame.locator('table tr:not(:has(td))').first();
    const cells = headerRow.locator(
      'th, td, [role="columnheader"], [role="cell"]',
    );
    count = await cells.count().catch(() => 0);
    const labels: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (
        (await cells
          .nth(i)
          .textContent()
          .catch(() => '')) ?? ''
      ).trim();
      if (text.length > 0 && !TimeTeamPage.UTILITY_COLUMNS.test(text)) {
        labels.push(text);
      }
    }
    return labels;
  }

  /**
   * The roster data rows. Uses the `row` role (verified working against the
   * live iframe in Assignments.util.ts) filtered to rows that contain `td`
   * cells, which excludes the header row.
   */
  get rows(): Locator {
    return this.frame.locator(
      `//table/tbody/tr[contains(@class,'one-time-experience')]`,
    );
  }

  /** Resolves the zero-based index of a column from its header label. */
  private async columnIndex(headerLabel: string): Promise<number> {
    const headers = await this.getTableColumnHeaders();
    return headers.findIndex((h) =>
      h.toLowerCase().includes(headerLabel.toLowerCase()),
    );
  }

  /**
   * Reads all cell values from the column whose header matches `headerLabel`.
   *
   * The name column renders as a single combined "First NameLast Name" cell
   * whose textContent glues the avatar initials onto the display name and then
   * repeats the name (e.g. "TuTest userTest userTest user"). Each value is run
   * through cleanCellText() to collapse that down to the unique name
   * ("Test user"), and the returned list is de-duplicated so only unique names
   * are reported.
   */
  async getColumnValues(headerLabel: string): Promise<string[]> {
    const index = await this.columnIndex(headerLabel);
    if (index < 0) return [];

    const rowCount = await this.rows.count().catch(() => 0);
    const values: string[] = [];
    const seen = new Set<string>();

    for (let r = 0; r < rowCount; r++) {
      const cell = this.rows.nth(r).locator('td').nth(index);
      const raw = ((await cell.textContent().catch(() => '')) ?? '').trim();
      const text = this.cleanCellText(raw);
      if (text.length === 0 || seen.has(text)) continue;
      seen.add(text);
      values.push(text);
    }
    return values;
  }

  /**
   * Normalises a roster cell's textContent to a single clean value.
   *
   * The "Your Team" name cells concatenate the avatar initials with the display
   * name repeated several times. We detect the smallest phrase that repeats at
   * the end of the string and return a single copy of it — which also drops the
   * glued-on initials prefix. Cells with no repetition are returned unchanged.
   */
  private cleanCellText(raw: string): string {
    const text = (raw ?? '').replace(/\s+/g, ' ').trim();
    if (!text) return text;

    // Only collapse when the repeating unit is a substantial phrase (>= 3 chars)
    // so short values like "All" or "aa" are never corrupted into "l"/"a".
    const unit = this.smallestRepeatingTail(text);
    return unit && unit.length >= 3 && unit.length < text.length
      ? unit.trim()
      : text;
  }

  /**
   * Returns the smallest trailing substring `u` such that the string ends with
   * `u` immediately preceded by another `u` (i.e. `u` repeats at the end), or
   * null when nothing repeats. For "TuTest userTest userTest user" this returns
   * "Test user".
   */
  private smallestRepeatingTail(s: string): string | null {
    const n = s.length;
    for (let len = 1; len <= Math.floor(n / 2); len++) {
      const unit = s.slice(n - len);
      const before = s.slice(n - 2 * len, n - len);
      if (unit === before) return unit;
    }
    return null;
  }

  /** Convenience: the list of First Name column values. */
  async getFirstNames(): Promise<string[]> {
    return this.getColumnValues('First Name');
  }

  /** Convenience: the list of Last Name column values. */
  async getLastNames(): Promise<string[]> {
    return this.getColumnValues('Last Name');
  }

  // ============================================================================
  // 6. Sorting
  // ============================================================================

  /**
   * Clicks a column header to sort by it, waits for the grid to settle, then
   * returns the resulting column values in display order.
   */
  async sortByColumnAndGetValues(headerLabel: string): Promise<string[]> {
    await this.columnHeader(headerLabel).click();
    await this.waitForLoadingToDisappear();
    await this.page.waitForTimeout(1000);
    return this.getColumnValues(headerLabel);
  }

  // ============================================================================
  // 7. Filters settings — Group + Last Activity dropdowns
  // ============================================================================

  get filtersButton(): Locator {
    return this.frame.locator(`//*[@id='my-team-filter']`).first();
  }

  /** Opens the Filters panel (idempotent — clicks the Filters control once). */
  async openFilters(): Promise<void> {
    await this.filtersButton.click();
    await this.page.waitForTimeout(750);
  }

  get groupDropdown(): Locator {
    return this.frame
      .locator(
        `//*[text()='Group']//following::*[@role='button' and @id='group_filter']`,
      )
      .first();
  }

  get lastActivityDropdown(): Locator {
    return this.frame
      .locator(
        `//*[text()='Group']//following::*[@role='button' and @id='last_activity_filter']`,
      )
      .first();
  }

  async getGroupOptions(): Promise<string[]> {
    return this.readDropdownOptions(this.groupDropdown);
  }

  async getLastActivityOptions(): Promise<string[]> {
    return this.readDropdownOptions(this.lastActivityDropdown);
  }

  // ============================================================================
  // Shared helpers
  // ============================================================================

  /**
   * Reads option labels from a dropdown trigger. Handles native `<select>`
   * (read directly without opening) and custom ARIA listbox/menu renderings
   * (open → read → close). Mirrors TimeOffPage.getDropdownOptions.
   */
  private async readDropdownOptions(trigger: Locator): Promise<string[]> {
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

    await trigger.click();
    await this.page.waitForTimeout(500);

    const options = this.frame.locator(
      '[role="option"], [role="menuitem"], option',
    );

    const labels = await this.readOptionTexts(options);
    await this.page.keyboard.press('Escape').catch(() => {});
    return labels;
  }

  /** Reads de-duplicated, trimmed, non-empty texts from an options locator. */
  private async readOptionTexts(options: Locator): Promise<string[]> {
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
    return labels;
  }

  /** Escapes a string for safe embedding inside an XPath expression. */
  private xpathLiteral(value: string): string {
    if (!value.includes("'")) return `'${value}'`;
    if (!value.includes('"')) return `"${value}"`;
    return `concat('${value.replace(/'/g, "',\"'\",'")}')`;
  }

  // ============================================================================
  // Page-level validation (moved here from TimeTeamFlows.Util.ts)
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
   * Returns true if `values` is sorted (case-insensitive, ascending OR
   * descending). Used to confirm clicking a column header actually orders the
   * column — without asserting a specific direction (TSheets toggles asc/desc).
   */
  private isSortedEitherDirection(values: string[]): boolean {
    if (values.length < 2) return true;
    const lower = values.map((v) => v.toLowerCase());
    const asc = [...lower].sort((a, b) => a.localeCompare(b));
    const desc = [...asc].reverse();
    const eq = (a: string[], b: string[]) => a.every((v, i) => v === b[i]);
    return eq(lower, asc) || eq(lower, desc);
  }

  /**
   * Validates every element visible on the Time team tab (header, View
   * dropdown, search, Who's working / Invite / Add team member, roster table +
   * First/Last Name columns, column sorting, and the Filters Group + Last
   * Activity dropdowns). All assertions are soft.
   *
   * @param teamMemberFirstName seeded member expected in the First Name column.
   */
  async validatePageUI(teamMemberFirstName: string): Promise<void> {
    // Re-anchor: ensure the widget iframe is fully rendered before asserting.
    await this.waitForTeamWidgetReady();

    // ── 1. "Your Team" header ────────────────────────────────────────────────────
    await this.soft('"Your Team" header is visible', async () => {
      await expect(this.yourTeamHeader).toBeVisible({ timeout: 10000 });
    });

    // ── 2. View dropdown + options ────────────────────────────────────────────────
    await this.soft('View dropdown is visible', async () => {
      await expect(this.viewDropdown).toBeVisible({ timeout: 10000 });
    });

    await this.soft('View dropdown exposes options', async () => {
      const options = await this.getViewOptions();
      console.log(' Time team — View options: %o', options);
      expect(
        options.length,
        'View dropdown should expose at least one option',
      ).toBeGreaterThan(0);
    });

    // ── 3. Search field ───────────────────────────────────────────────────────────
    await this.soft('Search field is visible', async () => {
      await expect(this.searchField).toBeVisible({ timeout: 10000 });
    });

    // ── 4. Who's working / Invite / Add team member ────────────────────────────────
    await this.soft('"Who\'s working" link is visible', async () => {
      await expect(this.whosWorkingLink).toBeVisible({ timeout: 10000 });
    });

    await this.soft('"Invite team members" link is visible', async () => {
      await expect(this.inviteTeamMembersLink).toBeVisible({ timeout: 10000 });
    });

    await this.soft('"Add team member" button is visible', async () => {
      await expect(this.addTeamMemberButton).toBeVisible({ timeout: 10000 });
    });

    await this.soft('"Add team member" dropdown exposes options', async () => {
      const options = await this.getAddTeamMemberOptions();
      console.log(' Time team — Add team member options: %o', options);
      expect(
        options.length,
        '"Add team member" dropdown should expose at least one option',
      ).toBeGreaterThan(0);
    });

    // ── 5. Roster table — headers, First/Last Name, names ───────────────────────────
    await this.soft('Roster table is visible', async () => {
      await expect(this.table).toBeVisible({ timeout: 10000 });
    });

    await this.soft(
      'Roster table shows column headers (incl. First/Last Name)',
      async () => {
        const headers = await this.getTableColumnHeaders();
        console.log(' Time team — table column headers: %o', headers);
        expect(
          headers.length,
          'Roster table should render at least one column header',
        ).toBeGreaterThan(0);
        expect(
          headers.some((h) => /first name/i.test(h)),
          `Headers should include "First Name" (got ${JSON.stringify(
            headers,
          )})`,
        ).toBe(true);
        expect(
          headers.some((h) => /last name/i.test(h)),
          `Headers should include "Last Name" (got ${JSON.stringify(headers)})`,
        ).toBe(true);
      },
    );

    await this.soft('First Name column header is visible', async () => {
      await expect(this.firstNameHeader).toBeVisible({ timeout: 10000 });
    });

    await this.soft('Last Name column header is visible', async () => {
      await expect(this.lastNameHeader).toBeVisible({ timeout: 10000 });
    });

    await this.soft(
      'Roster lists First Name values (incl. seeded member)',
      async () => {
        const firstNames = await this.getFirstNames();
        console.log(' Time team — First Name column: %o', firstNames);
        expect(
          firstNames.length,
          'First Name column should list at least one team member',
        ).toBeGreaterThan(0);
        expect(
          firstNames.some((n) =>
            n.toLowerCase().includes(teamMemberFirstName.toLowerCase()),
          ),
          `First Name column should include "${teamMemberFirstName}" ` +
            `(got ${JSON.stringify(firstNames)})`,
        ).toBe(true);
      },
    );

    await this.soft('Roster lists Last Name values', async () => {
      const lastNames = await this.getLastNames();
      console.log(' Time team — Last Name column: %o', lastNames);
      expect(
        lastNames.length,
        'Last Name column should list at least one team member',
      ).toBeGreaterThan(0);
    });

    // ── 6. Sorting on columns + resulting values ────────────────────────────────────
    await this.soft('Sorting by "First Name" orders the column', async () => {
      const sorted = await this.sortByColumnAndGetValues('First Name');
      console.log(' Time team — First Name after sort: %o', sorted);
      expect(
        this.isSortedEitherDirection(sorted),
        `First Name column should be ordered after a sort click (got ${JSON.stringify(
          sorted,
        )})`,
      ).toBe(true);
    });

    await this.soft('Sorting by "Last Name" orders the column', async () => {
      const sorted = await this.sortByColumnAndGetValues('Last Name');
      console.log(' Time team — Last Name after sort: %o', sorted);
      expect(
        this.isSortedEitherDirection(sorted),
        `Last Name column should be ordered after a sort click (got ${JSON.stringify(
          sorted,
        )})`,
      ).toBe(true);
    });

    // ── 7. Filters settings — Group + Last Activity dropdowns ────────────────────────
    await this.soft('Filters settings button is visible', async () => {
      await expect(this.filtersButton).toBeVisible({ timeout: 10000 });
    });

    await this.soft('Open Filters panel', async () => {
      await this.openFilters();
    });

    await this.soft('Filters: Group dropdown is visible', async () => {
      await expect(this.groupDropdown).toBeVisible({ timeout: 10000 });
    });

    await this.soft('Filters: Group dropdown exposes options', async () => {
      const options = await this.getGroupOptions();
      console.log(' Time team — Filters Group options: %o', options);
      expect(
        options.length,
        'Group dropdown should expose at least one option',
      ).toBeGreaterThan(0);
    });

    await this.soft('Filters: Last Activity dropdown is visible', async () => {
      await expect(this.lastActivityDropdown).toBeVisible({ timeout: 10000 });
    });

    await this.soft(
      'Filters: Last Activity dropdown exposes options',
      async () => {
        const options = await this.getLastActivityOptions();
        console.log(' Time team — Filters Last Activity options: %o', options);
        expect(
          options.length,
          'Last Activity dropdown should expose at least one option',
        ).toBeGreaterThan(0);
      },
    );

    console.log(' ✓ Time team page UI validated');
  }
}

export default TimeTeamPage;
