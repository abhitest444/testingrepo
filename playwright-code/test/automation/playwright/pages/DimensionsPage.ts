import { Page, Locator, expect } from '@playwright/test';

/**
 * Reusable page object for the shared Dimensions widget on the time-entry
 * surfaces (STE, Time clock clock-out, and the Weekly cell panel).
 *
 * Selectors are the live quickfill DOM confirmed against the IES env:
 *   - each dimension field is a quickfill with class `qf-dimension`
 *     (`.QuickfillsContainer.qf-dimension`), one per active/enabled dimension;
 *   - inside is a `role="combobox"` input `data-testid="__textField"` whose
 *     `aria-label` is the dimension name (with a trailing " *" when required);
 *   - options render as `role="option"` (value text in `span.rowTextLabel`).
 * Dimension names are dynamic per company, so rows are discovered at runtime.
 */
export default class DimensionsPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** All dimension quickfill rows (one per active, enabled dimension). */
  get rows(): Locator {
    return this.page.locator('.QuickfillsContainer.qf-dimension');
  }

  row(index: number): Locator {
    return this.rows.nth(index);
  }

  /** The combobox input inside a dimension row. */
  private inputInRow(index: number): Locator {
    return this.row(index)
      .locator('input[data-testid="__textField"]')
      .or(this.row(index).locator('input[role="combobox"]'))
      .first();
  }

  /** True when at least one dimension field is rendered. */
  async isWidgetVisible(timeout = 15000): Promise<boolean> {
    return this.rows
      .first()
      .waitFor({ state: 'visible', timeout })
      .then(() => true)
      .catch(() => false);
  }

  async rowCount(): Promise<number> {
    await this.rows
      .first()
      .waitFor({ state: 'visible', timeout: 15000 })
      .catch(() => undefined);
    return this.rows.count();
  }

  /** Field label from the input's aria-label, e.g. "d1" or "d1 *" (required). */
  async getRowLabel(index: number): Promise<string> {
    return (
      (await this.inputInRow(index)
        .getAttribute('aria-label')
        .catch(() => '')) ?? ''
    ).trim();
  }

  /** A row is required when its aria-label carries the trailing asterisk. */
  async isRowRequired(index: number): Promise<boolean> {
    return (await this.getRowLabel(index)).endsWith('*');
  }

  /** Currently selected value shown in the combobox input. */
  async getRowValue(index: number): Promise<string> {
    return (
      await this.inputInRow(index)
        .inputValue()
        .catch(() => '')
    ).trim();
  }

  async hasValue(index: number): Promise<boolean> {
    return (await this.getRowValue(index)).length > 0;
  }

  /** Whether the row's control is read-only / disabled. */
  async isRowDisabled(index: number): Promise<boolean> {
    const input = this.inputInRow(index);
    const disabledAttr = await input.getAttribute('disabled').catch(() => null);
    const ariaDisabled = await input
      .getAttribute('aria-disabled')
      .catch(() => null);
    const isDisabledProp = await input.isDisabled().catch(() => false);
    return disabledAttr !== null || ariaDisabled === 'true' || isDisabledProp;
  }

  /**
   * Opens a dimension dropdown and selects an option.
   * @param index  row index
   * @param option option value (exact) or, if omitted, the first option
   * @returns the text of the option that was selected
   */
  /**
   * Opens a dimension dropdown and selects an option.
   * Types the option text into the typeahead (more reliable than force-clicking
   * a list item that may not commit), then clicks the matching option.
   * @returns the combobox input value after selection (never the option label alone)
   */
  async selectOption(index: number, option?: string): Promise<string> {
    const input = this.inputInRow(index);
    await input.waitFor({ state: 'visible', timeout: 15000 });
    // Force — WTE day CellInput often still holds focus after cell click.
    await input.click({ force: true });
    await this.page.waitForTimeout(300);

    if (!option) {
      await this.openDimensionOptions(input);
      const first = this.page.getByRole('option').first();
      const label = (await first.textContent())?.trim() ?? '';
      await first.click();
      return (await this.getRowValue(index)) || label;
    }

    // Type to open/filter the typeahead — bare click often does not open options
    // on the WTE side panel (especially when a day cell editor is active).
    await this.page.keyboard.press('ControlOrMeta+a');
    await this.page.keyboard.type(option, { delay: 40 });
    const target = this.page
      .getByRole('option', { name: option, exact: true })
      .or(
        this.page.locator(
          `//*[@role="option"]//span[contains(@class,"rowTextLabel") and normalize-space()="${option}"]`,
        ),
      )
      .first();
    await target.waitFor({ state: 'visible', timeout: 10000 });
    await target.click();

    for (let i = 0; i < 15; i++) {
      const current = await this.getRowValue(index);
      if (current.includes(option)) return current;
      await this.page.waitForTimeout(200);
    }
    throw new Error(
      `Dimension selectOption failed: expected "${option}" (got "${await this.getRowValue(
        index,
      )}")`,
    );
  }

  /** Opens the dimension typeahead list (click alone is unreliable on WTE). */
  private async openDimensionOptions(input: Locator): Promise<void> {
    const options = this.page.getByRole('option').first();
    if (await options.isVisible().catch(() => false)) return;
    await input.click({ force: true });
    await this.page.keyboard.press('ArrowDown').catch(() => undefined);
    await options.waitFor({ state: 'visible', timeout: 10000 });
  }

  /** Selects an option different from the current value (to override a default). */
  async selectDifferentOption(index: number): Promise<string> {
    const current = await this.getRowValue(index);
    await this.inputInRow(index).click();
    await this.page
      .getByRole('option')
      .first()
      .waitFor({ state: 'visible', timeout: 10000 });
    const options = this.page.getByRole('option');
    const count = await options.count();
    for (let i = 0; i < count; i++) {
      const text = (await options.nth(i).textContent())?.trim() ?? '';
      if (text && text !== current) {
        await options.nth(i).click({ force: true });
        return text;
      }
    }
    // Blur without Escape — Escape dismisses the WTE trowser.
    await this.page.keyboard.press('Tab').catch(() => undefined);
    return current;
  }

  /** Clears the dimension value (typeahead has no explicit clear control). */
  async clearValue(index: number): Promise<void> {
    const input = this.inputInRow(index);
    await input.click();
    await input.fill('');
    // Do not press Escape — it closes Weekly time entry (and similar shells).
    await this.page.keyboard.press('Tab').catch(() => undefined);
  }

  /**
   * The inline "This field is required" validation message on a row — the same
   * standard IDS inline-validation text the rest of the suite asserts on
   * (InlineValidationMessage / idsInlineValidationMessage-alertMsg).
   */
  async getRequiredError(index: number): Promise<Locator> {
    return this.row(index)
      .getByText('This field is required', { exact: false })
      .first();
  }

  async expectRequiredError(index: number, timeoutMs = 15000): Promise<void> {
    await expect(await this.getRequiredError(index)).toBeVisible({
      timeout: timeoutMs,
    });
  }

  /** Index of the first required row, or -1 when none is configured. */
  async firstRequiredRowIndex(): Promise<number> {
    const count = await this.rowCount();
    for (let i = 0; i < count; i++) {
      if (await this.isRowRequired(i)) return i;
    }
    return -1;
  }

  /** Index of the first row that already carries a value (a seeded default). */
  async firstPrefilledRowIndex(): Promise<number> {
    const count = await this.rowCount();
    for (let i = 0; i < count; i++) {
      if (await this.hasValue(i)) return i;
    }
    return -1;
  }

  /**
   * Combobox for a dimension by name. Required fields append " *" to aria-label.
   */
  comboboxForDimension(name: string): Locator {
    return this.page
      .getByRole('combobox', { name: `${name} *` })
      .or(this.page.getByRole('combobox', { name }))
      .first();
  }

  /** Current input value for a dimension looked up by name. */
  async getValueByName(name: string): Promise<string> {
    return (
      (await this.comboboxForDimension(name)
        .inputValue()
        .catch(() => '')) ?? ''
    ).trim();
  }

  /**
   * Row index whose aria-label matches `name` (ignoring trailing " *"),
   * else the first non-disabled row, else 0.
   */
  async findRowIndexByLabel(name: string): Promise<number> {
    const clean = (label: string): string => label.replace(/\*/g, '').trim();
    const count = await this.rowCount();
    if (name) {
      for (let i = 0; i < count; i++) {
        if (clean(await this.getRowLabel(i)) === clean(name)) return i;
      }
    }
    for (let i = 0; i < count; i++) {
      if (!(await this.isRowDisabled(i))) return i;
    }
    return 0;
  }

  /**
   * WTE-safe clear: Ctrl/Cmd+A + Backspace (no fill('') / Tab — those dismiss
   * the weekly drawer or wipe hours). Re-clicks the field to close options.
   */
  async clearValueByName(name: string): Promise<void> {
    const combobox = this.comboboxForDimension(name);
    await combobox.click();
    await this.page.keyboard.press('ControlOrMeta+a');
    await this.page.keyboard.press('Backspace');
    await combobox.click();
    await this.page
      .getByRole('option')
      .first()
      .waitFor({ state: 'hidden', timeout: 3000 })
      .catch(() => undefined);
  }

  /**
   * Selects a dimension option by field name.
   * Same type-then-click path as {@link selectOption}; throws if the input
   * does not show the value (never treats a successful option click as enough).
   */
  async selectValueByName(name: string, value: string): Promise<string> {
    const index = await this.findRowIndexByLabel(name);
    if (
      await this.rows
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      return this.selectOption(index, value);
    }

    const combobox = this.comboboxForDimension(name);
    await combobox.waitFor({ state: 'visible', timeout: 15000 });
    // Force — WTE day CellInput often still holds focus after cell click.
    await combobox.click({ force: true });
    await this.page.waitForTimeout(300);
    // Type to open/filter — do not wait for options on bare click.
    await this.page.keyboard.press('ControlOrMeta+a');
    await this.page.keyboard.type(value, { delay: 40 });
    const target = this.page
      .getByRole('option', { name: value, exact: true })
      .or(
        this.page.locator(
          `//*[@role="option"]//span[contains(@class,"rowTextLabel") and normalize-space()="${value}"]`,
        ),
      )
      .first();
    await target.waitFor({ state: 'visible', timeout: 10000 });
    await target.click();

    for (let i = 0; i < 15; i++) {
      const current = (await combobox.inputValue().catch(() => '')).trim();
      if (current.includes(value)) return current;
      await this.page.waitForTimeout(200);
    }
    throw new Error(
      `Dimension selectValueByName failed: expected "${value}" (got "${await this.getValueByName(
        name,
      )}")`,
    );
  }

  /** Inline "Required" under a field inside the WTE side panel content. */
  panelRequiredMessage(): Locator {
    return this.page.getByTestId('panelContent').getByText('Required').first();
  }

  /** Alert banner text that lists a missing required dimension ("… : Name"). */
  requiredDimensionAlert(dimensionName: string): Locator {
    return this.page
      .locator(
        `//div[@role='alert']/descendant::*[contains(text(), ': ${dimensionName}')]`,
      )
      .first();
  }
}
