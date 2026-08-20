import { Page, Locator, expect } from '@playwright/test';
import TimeSettingsPage from './TimeSettingsPage';

/**
 * Notification channel shown next to every schedule setting.
 * The widget renders one checkbox per channel on each setting row.
 */
export type NotificationChannel = 'Mobile' | 'Email';

/**
 * The four schedule notification settings every worker (and the company level)
 * shows, in display order. Matched with `contains()` so minor copy/punctuation
 * tweaks in the product don't break the locators.
 */
export const SCHEDULE_SETTINGS = [
  // Labels copied verbatim from the Settings → Time → Schedule section UI.
  'When assigned shift is published or changed',
  'One hour before shift starts',
  'Forgot to clock in after shift started',
  'Forgot to clock out after shift ended',
] as const;

export type ScheduleSetting = (typeof SCHEDULE_SETTINGS)[number];

/**
 * Manager-only setting. Visible at company level and for admin / group-manager
 * workers, but NOT for a plain employee worker (ST13 vs ST14/ST15).
 */
export const MANAGER_SETTING =
  "Team member hasn't clocked in after shift started. Notify manager.";

/** First setting — the only one with radio sub-options under it. */
export const ASSIGNED_SHIFT_SETTING = SCHEDULE_SETTINGS[0];

/**
 * The three radio choices shown under "When assigned shift is published or
 * changed", each with its descriptive sub-text. Labels/texts copied from the UI.
 */
export const ASSIGNED_SHIFT_RADIOS = [
  {
    label: 'Always send',
    description: 'Automatically send notifications to assigned team members',
  },
  { label: 'Never send', description: 'Notifications will not be sent' },
  {
    label: 'Ask',
    description: `Prompt to choose whether to "Send" or "Don't Send"`,
  },
] as const;

/** Checked state of a single setting's two channel checkboxes. */
export interface SettingState {
  email: boolean;
  mobile: boolean;
}

/** A snapshot of every visible setting → its {email, mobile} state. */
export type ScheduleSettingsState = Record<string, SettingState>;

/**
 * Page object for the **schedule** notification settings. The same settings
 * card is rendered both at company level (Account & settings → Time →
 * Notifications) and per worker (Assignments → worker → View settings), so the
 * same row/checkbox locators are reused for both.
 */
export default class ScheduleSettingsPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ==================== Company-level navigation ====================

  /**
   * Account & settings → Time → scroll to the Notifications section and open it
   * in edit mode so the schedule settings + checkboxes are interactive.
   */
  async openCompanyNotifications(): Promise<void> {
    await TimeSettingsPage.navigateToAccountAndSettingsTime(this.page);
    await TimeSettingsPage.scrollToNotificationsSection(this.page);
    await TimeSettingsPage.clickNotifEditButton(this.page);
    await this.page.waitForTimeout(1000);
  }

  // ==================== Settings rows + checkboxes ====================
  //
  // NOTE: this page object drives TWO different UIs with the same labels:
  //   • Company level (Account & settings → Time → Notifications) — bare
  //     checkboxes laid out in row containers, plus Always/Never/Ask radios.
  //   • Worker level (Assignments → worker → settings) — the user-settings card,
  //     where labels gain a "Notify " prefix, checkboxes carry a full aria-label
  //     ("{label} {channel}"), and there are NO send-mode radios.
  // The locators below match both: label text is compared case-insensitively as a
  // substring (so "When assigned shift…" also matches "Notify when assigned shift…").

  /** The row container holding a setting's label and its channel checkboxes (company UI). */
  private settingRow(label: string): Locator {
    return this.page
      .locator(
        `//*[contains(normalize-space(.),"${label}")]/ancestor-or-self::*[self::tr or contains(@class,"row") or contains(@class,"Row")][1]`,
      )
      .first();
  }

  /** The visible label text of a setting — present in BOTH UIs (substring, case-insensitive). */
  private settingLabel(label: string): Locator {
    return this.page.getByText(label, { exact: false }).first();
  }

  /**
   * The Email / Mobile checkbox for a setting, resolved across both UIs:
   *   • Worker UI — the checkbox has a full aria-label "{label} {channel}".
   *   • Company UI — bare checkboxes in the setting's row; Email first, Mobile second.
   */
  private channelCheckbox(
    label: string,
    channel: NotificationChannel,
  ): Locator {
    // Worker/user-settings UI: full aria-label names both the setting and channel.
    const byFullAriaLabel = this.page.locator(
      `input[type="checkbox"][aria-label*="${label}" i][aria-label*="${channel}" i]`,
    );
    // Company UI: bare checkboxes inside the row — Email is column 0, Mobile column 1.
    const byPosition = this.settingRow(label)
      .locator('input[type="checkbox"]')
      .nth(channel === 'Email' ? 0 : 1);
    return byFullAriaLabel.or(byPosition).first();
  }

  /** True when a schedule setting is shown (matches the label text in either UI). */
  async isSettingVisible(label: string, timeoutMs = 8000): Promise<boolean> {
    return this.settingLabel(label)
      .isVisible({ timeout: timeoutMs })
      .catch(() => false);
  }

  /**
   * True when the manager-only setting is shown. Uses a short timeout — this is
   * used for the NEGATIVE (employee) check, and by the time we reach it the page
   * is already loaded, so a hidden manager row confirms absence in ~2s.
   */
  async isManagerSettingVisible(): Promise<boolean> {
    return this.isSettingVisible(MANAGER_SETTING, 2000);
  }

  /** Current checked state of a setting's channel checkbox. */
  async isChannelChecked(
    label: string,
    channel: NotificationChannel,
  ): Promise<boolean> {
    return this.channelCheckbox(label, channel)
      .isChecked()
      .catch(() => false);
  }

  /** Sets a setting's channel checkbox to the desired state (no-op if already there). */
  async setChannel(
    label: string,
    channel: NotificationChannel,
    checked: boolean,
  ): Promise<void> {
    const checkbox = this.channelCheckbox(label, channel);
    if (!(await checkbox.isVisible({ timeout: 5000 }).catch(() => false))) {
      return;
    }
    // Keep the action visible on screen so the run is followable (works in both
    // UIs — the row container only exists at company level).
    await checkbox.scrollIntoViewIfNeeded().catch(() => {});
    const current = await checkbox.isChecked().catch(() => false);
    if (current === checked) return;
    await checkbox.setChecked(checked, { force: true });
    await this.page.waitForTimeout(500);
  }

  // ==================== State snapshot / apply ====================

  /** All setting labels that may be present (core 4 + manager-only). */
  private allLabels(): string[] {
    return [...SCHEDULE_SETTINGS, MANAGER_SETTING];
  }

  /**
   * Reads the {email, mobile} state of every currently-visible setting into a
   * map. Used to capture the company baseline and to read back the worker level.
   */
  async readState(): Promise<ScheduleSettingsState> {
    const state: ScheduleSettingsState = {};
    for (const label of this.allLabels()) {
      // Skip rows that aren't shown (e.g. manager setting for an employee).
      if (!(await this.isSettingVisible(label))) continue;
      state[label] = {
        email: await this.isChannelChecked(label, 'Email'),
        mobile: await this.isChannelChecked(label, 'Mobile'),
      };
    }
    return state;
  }

  /**
   * Forces every checkbox to match the given baseline. This is how the worker
   * level is reset to the company level so the "worker matches company" check
   * is deterministic regardless of what a previous run left behind.
   */
  async applyState(state: ScheduleSettingsState): Promise<void> {
    for (const [label, { email, mobile }] of Object.entries(state)) {
      if (!(await this.isSettingVisible(label))) continue;
      await this.setChannel(label, 'Email', email);
      await this.setChannel(label, 'Mobile', mobile);
    }
  }

  /**
   * Sets the given channel to `checked` for EVERY currently-visible schedule
   * setting (core 4 + manager-only when shown). Returns the labels touched so the
   * caller can assert them back after a reload.
   */
  async setAllSettingsChannel(
    channel: NotificationChannel,
    checked: boolean,
  ): Promise<string[]> {
    const touched: string[] = [];
    for (const label of this.allLabels()) {
      if (!(await this.isSettingVisible(label))) continue;
      await this.setChannel(label, channel, checked);
      touched.push(label);
    }
    return touched;
  }

  /** Asserts the given channel equals `checked` for each of the given setting labels. */
  async expectAllSettingsChannel(
    channel: NotificationChannel,
    checked: boolean,
    labels: string[],
  ): Promise<void> {
    for (const label of labels) {
      const actual = await this.isChannelChecked(label, channel);
      expect(actual, `"${label}" ${channel} should be ${checked}`).toBe(
        checked,
      );
    }
  }

  // ==================== View-mode value (On/Off + channels) ====================

  /**
   * Reads a setting's read-only VIEW-mode value (e.g. "On, mobile, email" / "Off").
   * In the worker view card the label and its value render as adjacent <strong>
   * siblings, so anchor on the label <strong> (case-insensitive substring, since
   * the worker UI prefixes "Notify ") and read the next <strong>. VIEW mode only.
   */
  async getViewModeValue(label: string): Promise<string> {
    // Label and value are NOT DOM siblings (nested in separate containers), but
    // the value <strong> is the next one in document order — use `following::`.
    const valueEl = this.page
      .locator('strong')
      .filter({ hasText: label })
      .first()
      .locator('xpath=following::strong[1]');
    await valueEl.scrollIntoViewIfNeeded().catch(() => {});
    await expect(
      valueEl,
      `View-mode value for "${label}" should be visible`,
    ).toBeVisible({ timeout: 8000 });
    return (await valueEl.textContent())?.trim() ?? '';
  }

  /**
   * Asserts a setting's VIEW-mode text reflects its channel state:
   *   • both channels off → shows "Off"
   *   • otherwise         → shows "On" and lists ONLY the enabled channels
   *     (email/mobile appear iff their checkbox is on).
   */
  async expectViewModeReflectsChannels(
    label: string,
    state: SettingState,
  ): Promise<void> {
    const value = (await this.getViewModeValue(label)).toLowerCase();

    if (!state.email && !state.mobile) {
      expect(
        value,
        `"${label}" view should show "Off" when no channel is enabled`,
      ).toContain('off');
      return;
    }

    expect(
      value,
      `"${label}" view should show "On" when a channel is enabled`,
    ).toContain('on');
    expect(
      value.includes('email'),
      `"${label}" view should ${state.email ? '' : 'NOT '}show email`,
    ).toBe(state.email);
    expect(
      value.includes('mobile'),
      `"${label}" view should ${state.mobile ? '' : 'NOT '}show mobile`,
    ).toBe(state.mobile);
  }

  /**
   * Asserts the live state equals an expected baseline for the given labels.
   * Throwing here surfaces a real worker-vs-company mismatch.
   */
  async expectStateMatches(
    expected: ScheduleSettingsState,
    labels: string[],
  ): Promise<void> {
    for (const label of labels) {
      const actual: SettingState = {
        email: await this.isChannelChecked(label, 'Email'),
        mobile: await this.isChannelChecked(label, 'Mobile'),
      };
      expect(actual, `"${label}" should match the company baseline`).toEqual(
        expected[label],
      );
    }
  }

  // ==================== Assigned-shift radio sub-options ====================

  /** The radiogroup under "When assigned shift is published or changed". */
  private assignedShiftRadioGroup(): Locator {
    return this.page
      .getByRole('radiogroup', { name: ASSIGNED_SHIFT_SETTING })
      .first();
  }

  /**
   * The radio for one assigned-shift choice (Always/Never/Ask). Scoped to the
   * radiogroup and matched on an accessible name ANCHORED at the option label —
   * the names include their description (e.g. "Never send Notifications will not
   * be sent"), so an un-anchored/substring match would collapse onto the wrong
   * option. The three labels are mutually exclusive prefixes.
   */
  private assignedShiftRadio(label: string): Locator {
    return this.assignedShiftRadioGroup().getByRole('radio', {
      name: new RegExp(`^\\s*${label}\\b`, 'i'),
    });
  }

  /** Returns the label of the currently-selected assigned-shift radio (or ''). */
  async getSelectedAssignedShiftRadio(): Promise<string> {
    for (const { label } of ASSIGNED_SHIFT_RADIOS) {
      // isChecked() resolves the computed checked state of the role=radio element
      // (IDS doesn't expose a literal aria-checked attribute). Reliable now that
      // the locator is scoped to a single option within the radiogroup.
      if (
        await this.assignedShiftRadio(label)
          .isChecked()
          .catch(() => false)
      ) {
        return label;
      }
    }
    return '';
  }

  /**
   * Verifies the assigned-shift setting's radio sub-options: each radio label +
   * its description text is visible, and exactly one radio is selected.
   */
  async validateAssignedShiftRadios(): Promise<void> {
    // Bring the radiogroup on-screen so the run is followable.
    await this.assignedShiftRadioGroup()
      .scrollIntoViewIfNeeded()
      .catch(() => {});
    for (const { label, description } of ASSIGNED_SHIFT_RADIOS) {
      // Radio control present.
      await expect(
        this.assignedShiftRadio(label),
        `Radio "${label}" should be visible`,
      ).toBeVisible({ timeout: 8000 });
      // Its descriptive sub-text present.
      await expect(
        this.page.getByText(description, { exact: false }).first(),
        `Description for "${label}" should be visible`,
      ).toBeVisible({ timeout: 8000 });
    }

    // Exactly one option must be selected (the widget defaults to "Ask").
    const selected = await this.getSelectedAssignedShiftRadio();
    expect(
      selected,
      'Exactly one assigned-shift radio option should be selected',
    ).not.toBe('');
    console.log(`✓ Assigned-shift radios verified — selected: "${selected}"`);
  }

  // ==================== Validation helpers ====================

  /**
   * Asserts the four core schedule settings are visible and that both Mobile
   * and Email checkboxes exist for each. `expectManagerSetting` adds (or
   * forbids) the manager-only row depending on the worker role.
   */
  async validateAllSettingsVisible(
    expectManagerSetting: boolean,
  ): Promise<void> {
    for (const label of SCHEDULE_SETTINGS) {
      await expect(
        this.settingLabel(label),
        `Schedule setting "${label}" should be visible`,
      ).toBeVisible({ timeout: 8000 });

      await expect(
        this.channelCheckbox(label, 'Mobile'),
        `Mobile checkbox for "${label}" should be present`,
      ).toBeVisible({ timeout: 8000 });
      await expect(
        this.channelCheckbox(label, 'Email'),
        `Email checkbox for "${label}" should be present`,
      ).toBeVisible({ timeout: 8000 });
    }

    // The Always/Never/Ask radios exist ONLY in the company UI. Validate them
    // when the radiogroup is actually present (skipped at the worker level).
    if (
      await this.assignedShiftRadioGroup()
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      await this.validateAssignedShiftRadios();
    }

    if (expectManagerSetting) {
      await expect(
        this.settingLabel(MANAGER_SETTING),
        'Manager notification setting should be visible for admin/group-manager worker',
      ).toBeVisible({ timeout: 8000 });
    } else {
      await expect(
        await this.isManagerSettingVisible(),
        'Manager notification setting should NOT be visible for an employee worker',
      ).toBe(false);
    }
  }

  /**
   * Clicks the Save button on the open settings panel. The company UI's button
   * has the accessible name "Save"; the worker/user-settings card's button has
   * the accessible name "save-notifications" (visible text "Save"). Match either.
   */
  async save(): Promise<void> {
    const saveButton = this.page
      .getByRole('button', { name: /^save(-notifications)?$/i })
      .first();
    await expect(saveButton).toBeVisible({ timeout: 8000 });
    await saveButton.scrollIntoViewIfNeeded().catch(() => {});
    await saveButton.click();
    await this.page.waitForTimeout(2000);
  }

  // ==================== "Never send" view-mode behaviour (ST08) ====================

  /** Selects one of the assigned-shift send-mode radios (Always/Never/Ask). */
  async selectAssignedShiftSendMode(label: string): Promise<void> {
    const radio = this.assignedShiftRadio(label);
    await expect(
      radio,
      `Assigned-shift radio "${label}" should be visible`,
    ).toBeVisible({ timeout: 8000 });
    // Keep the action visible on screen so the run is followable.
    await radio.scrollIntoViewIfNeeded().catch(() => {});
    await radio.click({ force: true });
    await this.page.waitForTimeout(500);

    // If the click didn't register the selection, fall back to clicking the
    // visible option text scoped INSIDE this radiogroup (avoids matching the
    // same words elsewhere on the page).
    if (!(await radio.isChecked().catch(() => false))) {
      await this.assignedShiftRadioGroup()
        .getByText(label, { exact: true })
        .first()
        .click({ force: true });
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * View-mode value rendered for "When assigned shift is published or changed".
   * The view row carries data-testid="notifications-schedule-shift-published";
   * its bold <span> holds the summary text (e.g. "Never send" or "Always send, mobile, email").
   */
  async getAssignedShiftViewValue(): Promise<string> {
    // View rows render as <label>{title}</label><span>{value}</span> siblings,
    // so anchor on the label text and read the adjacent value span. More robust
    // than a data-testid (which isn't emitted on this row).
    const value = this.page
      .locator(
        `//label[contains(normalize-space(.),"${ASSIGNED_SHIFT_SETTING}")]/following-sibling::span`,
      )
      .first();
    await value.scrollIntoViewIfNeeded().catch(() => {});
    await expect(
      value,
      'Assigned-shift view value should be visible',
    ).toBeVisible({ timeout: 8000 });
    return (await value.textContent())?.trim() ?? '';
  }

  /** Re-opens the Notifications section in edit mode (a save lands us back in view mode). */
  private async reopenNotificationsEdit(): Promise<void> {
    await TimeSettingsPage.scrollToNotificationsSection(this.page);
    await TimeSettingsPage.clickNotifEditButton(this.page);
    await this.page.waitForTimeout(1000);
  }

  /**
   * ST08 — when "Never send" is selected for the assigned-shift setting, the
   * view-mode value must collapse to ONLY "Never send", hiding any Email/Mobile
   * channel detail regardless of the checkbox state.
   *
   * Assumes the Notifications section is already OPEN IN EDIT mode. Turns ON both
   * Email + Mobile, selects "Never send", saves, then reads the view value and
   * asserts it is exactly "Never send" (no channel words). Returns the originally
   * selected send mode so the caller can restore it during cleanup.
   */
  async validateNeverSendHidesChannelsInViewMode(): Promise<string> {
    // Bring the Schedule section into view so the run is followable on screen.
    await this.assignedShiftRadioGroup()
      .scrollIntoViewIfNeeded()
      .catch(() => {});

    // Remember the original radio so cleanup can restore it.
    const originalSendMode = await this.getSelectedAssignedShiftRadio();

    // 1. Turn ON both Email + Mobile for the assigned-shift setting.
    await this.setChannel(ASSIGNED_SHIFT_SETTING, 'Email', true);
    await this.setChannel(ASSIGNED_SHIFT_SETTING, 'Mobile', true);

    // 2. Select "Never send" and confirm the selection registered before saving.
    await this.selectAssignedShiftSendMode('Never send');
    expect(
      await this.getSelectedAssignedShiftRadio(),
      '"Never send" should be the selected radio before saving',
    ).toMatch(/never send/i);

    // 3. Save → panel returns to view mode.
    await this.save();

    // 4. View value must be exactly "Never send" with no Email/Mobile detail.
    const value = await this.getAssignedShiftViewValue();
    expect(
      value,
      `"${ASSIGNED_SHIFT_SETTING}" view value should be "Never send" when Never send is selected`,
    ).toMatch(/^never send$/i);
    expect(
      value.toLowerCase(),
      'Email/Mobile detail must NOT appear in view mode when Never send is selected',
    ).not.toMatch(/email|mobile/);

    console.log('✓ ST08: "Never send" hides Email/Mobile detail in view mode');
    return originalSendMode;
  }

  /**
   * Cleanup — restore the company assigned-shift schedule setting to the state
   * captured before the ST08 mutation, so every fresh run starts deterministic.
   * Re-opens edit mode (we land in view mode after the ST08 save), restores the
   * send-mode radio (defaults to "Ask" when nothing was selected) + the
   * Email/Mobile channels from the baseline, then saves.
   */
  async restoreCompanyScheduleDefaults(
    baseline: ScheduleSettingsState,
    originalSendMode: string,
  ): Promise<void> {
    await this.reopenNotificationsEdit();

    const original = baseline[ASSIGNED_SHIFT_SETTING];
    if (original) {
      await this.setChannel(ASSIGNED_SHIFT_SETTING, 'Email', original.email);
      await this.setChannel(ASSIGNED_SHIFT_SETTING, 'Mobile', original.mobile);
    }
    await this.selectAssignedShiftSendMode(originalSendMode || 'Ask');

    await this.save();
    console.log('✓ Cleanup: company schedule settings restored to default');
  }
}
