import { Page, Locator, expect } from '@playwright/test';

/**
 * Page object for the dimension fields on the Time Clock / STE drawer.
 *
 * Prod renders each dimension as a labeled IDS combobox alongside
 * Customers/Service/Notes (no wrapper testid), so fields are located by the
 * combobox role, excluding the drawer's fixed (non-dimension) comboboxes.
 *
 * NOTE: This is the Time-Clock (FastPipeline) dimensions page object. The STE
 * dimensions flow uses the separate pages/DimensionsPage.ts (qf-dimension
 * quickfill rendering) — do not merge the two; each targets a different DOM.
 */
export const DIMENSION_TIMEOUT = 30000;

// Fixed comboboxes on the page / Time Clock / STE drawer that are not dimensions.
const FIXED_COMBOBOX_LABELS = [
  'Display by',
  'Select a date range',
  'Name',
  'Customers',
  'Service',
  'Class',
  'Department',
  'Location',
  'Shift',
  'Start time',
  'End time',
  'Time zone',
];

export default class DimensionsFlowsPage {
  constructor(private readonly page: Page) {}

  /** Dimension comboboxes only — every combobox minus the fixed drawer fields. */
  get fieldRows(): Locator {
    const exclusions = FIXED_COMBOBOX_LABELS.map(
      (label) => `not(@aria-label=${JSON.stringify(label)})`,
    ).join(' and ');
    return this.page.locator(
      `xpath=//*[@role='combobox' and @aria-label and ${exclusions}]`,
    );
  }

  fieldInput(index = 0): Locator {
    return this.fieldRows.nth(index);
  }

  /** First dimension field — presence anchor for the widget. */
  get widget(): Locator {
    return this.fieldRows.first();
  }

  async waitForWidget(): Promise<void> {
    await this.widget.waitFor({ state: 'visible', timeout: DIMENSION_TIMEOUT });
  }

  async getFieldCount(): Promise<number> {
    await this.waitForWidget();
    return this.fieldRows.count();
  }

  async getFieldValue(index = 0): Promise<string> {
    return (await this.fieldInput(index).inputValue()) ?? '';
  }

  /** Clear the nth dimension field so it is left empty. */
  async clearValue(index = 0): Promise<void> {
    await this.fieldInput(index).clear();
  }

  /** Field labels (dimension names) as shown on each selector, `*` stripped. */
  async getFieldLabels(): Promise<string[]> {
    await this.waitForWidget();
    const count = await this.fieldRows.count();
    const labels: string[] = [];
    for (let i = 0; i < count; i++) {
      const label = (await this.fieldInput(i).getAttribute('aria-label')) ?? '';
      labels.push(label.replace(/\s*\*\s*$/, '').trim());
    }
    return labels;
  }

  private get openOptions(): Locator {
    return this.page.locator("[role='option']");
  }

  // Non-selectable rows the typeahead renders (the "Add new" action and the
  // transient "Loading..." placeholder) — never treat these as values.
  private static readonly NON_VALUE_OPTION = /^(add new|loading)/i;

  // Option-name query prefix, e.g. "value2" -> "value" (quickfills only render
  // options after a query is typed).
  private static queryFrom(value: string): string {
    const prefix = value.replace(/\d+$/, '').trim();
    return prefix || value.slice(0, 1) || 'a';
  }

  // Real value labels currently shown, excluding "Add new" / "Loading...".
  private async realOptionLabels(): Promise<string[]> {
    const texts = await this.openOptions.allInnerTexts();
    return texts
      .map((t) => t.split('\n')[0].trim())
      .filter((l) => l && !DimensionsFlowsPage.NON_VALUE_OPTION.test(l));
  }

  // Clear the nth typeahead, type a query, and wait for real value options.
  private async revealOptions(index: number, query: string): Promise<void> {
    const input = this.fieldInput(index);
    await input.scrollIntoViewIfNeeded();
    await input.click();
    await input.fill('');
    await input.pressSequentially(query, { delay: 60 });
    await expect
      .poll(async () => (await this.realOptionLabels()).length, {
        timeout: DIMENSION_TIMEOUT,
      })
      .toBeGreaterThan(0);
  }

  private async clickOption(value: string): Promise<void> {
    await this.page
      .getByRole('option', { name: value, exact: true })
      .first()
      .click();
  }

  /** Type the given value into the nth typeahead and select the matching option. */
  async selectValue(index = 0, value: string): Promise<void> {
    await this.revealOptions(index, DimensionsFlowsPage.queryFrom(value));
    await this.clickOption(value);
  }

  /**
   * Type into the nth dimension typeahead and select the first available value.
   * Returns the chosen label, or '' if none were offered.
   */
  async selectFirstOption(index = 0): Promise<string> {
    const current = (await this.getFieldValue(index)).trim();
    await this.revealOptions(
      index,
      DimensionsFlowsPage.queryFrom(current || 'value'),
    );
    const target = (await this.realOptionLabels())[0] ?? '';
    if (!target) {
      await this.fieldInput(index).press('Escape');
      return '';
    }
    await this.clickOption(target);
    return target;
  }

  /**
   * Type into the nth dimension typeahead and select a value that differs from
   * the currently selected one (exercises the edit path).
   * Returns the chosen label, or '' if no different value was available.
   */
  async selectDifferentOption(index = 0): Promise<string> {
    const current = (await this.getFieldValue(index)).trim();
    await this.revealOptions(
      index,
      DimensionsFlowsPage.queryFrom(current || 'value'),
    );
    const target =
      (await this.realOptionLabels()).find((l) => l !== current) ?? '';
    if (!target) {
      await this.fieldInput(index).press('Escape');
      return '';
    }
    await this.clickOption(target);
    return target;
  }
}
