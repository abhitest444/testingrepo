// tests/pages/BreaksPage.ts
import { type Page, type Locator, expect } from '@playwright/test';

export class BreaksPage {
  readonly page: Page;
  readonly addTimeDropdown: Locator;
  readonly addBreakOption: Locator;
  readonly singleTimeEntryOption: Locator;
  readonly addBreakDrawer: Locator;
  readonly breakNameInput: Locator;
  readonly durationInput: Locator;
  readonly startTimeInput: Locator;
  readonly endTimeInput: Locator;
  readonly setStartEndTimeToggle: Locator;
  readonly saveButton: Locator;
  readonly validationError: Locator;
  readonly editButton: Locator;
  readonly approveButton: Locator;
  readonly unapproveButton: Locator;
  readonly deleteButton: Locator;
  readonly confirmButton: Locator;
  readonly teamMemberDropdown: Locator;
  readonly breakTypeDropdown: Locator;
  readonly cancelButton: Locator;
  errorMessage: (text: string) => Locator;

  constructor(page: Page) {
    this.page = page;

    // Locators
    this.addTimeDropdown = page.locator(`//span[text()='Add time']`); // Placeholder
    this.addBreakOption = page.locator(`//span[text()='Break']`); // Placeholder
    this.singleTimeEntryOption = page.locator(
      `//span[text()='Single time entry']`,
    );
    this.addBreakDrawer = page.locator(
      `//div[@aria-modal="true"] / descendant::strong[text()='Add Break Entry']`,
    ); // Placeholder
    this.breakNameInput = page.locator('input[name="breakName"]'); // Placeholder
    this.durationInput = page.locator('input[name="duration"]'); // Placeholder
    this.startTimeInput = page.locator('input[name="startTime"]'); // Placeholder
    this.endTimeInput = page.locator('input[name="endTime"]'); // Placeholder
    this.setStartEndTimeToggle = page.locator(
      '//input[@aria-label="Set start and end time"]',
    ); // Placeholder
    this.saveButton = page.locator(`//span[text()='Save']`);
    this.validationError = page.locator(
      `//span[text()="We’re missing some info"]`,
    ); // Placeholder
    this.editButton = this.page.locator('.break-entry .edit-button');
    this.approveButton = this.page.getByRole('button', { name: 'Approve' });
    this.unapproveButton = this.page.getByRole('button', { name: 'Unapprove' });
    this.deleteButton = this.page.getByRole('button', { name: 'Delete' });
    this.confirmButton = this.page.getByRole('button', { name: 'Confirm' });
    this.teamMemberDropdown = this.page.locator(`//input[@aria-label="Name"]`);
    this.breakTypeDropdown = this.page.locator(
      `//input[@aria-label="Select Break"]`,
    );
    this.cancelButton = this.page.getByRole('button', { name: 'Cancel' });
    this.errorMessage = (text: string) =>
      this.page.locator(`//span[text()='Cancel']`);
  }

  async navigateToTimeEntries() {
    await this.page.goto('/app/time?jobId=time', { waitUntil: 'load' }); // Replace with your actual URL
  }

  async openAddBreakDrawer() {
    // Handle "Time Summary by Worker view has moved" popup if it appears
    await this.handleApprovalsMigrationPopup();

    // Assuming "Add Break" is inside an "Add Time" dropdown
    await expect(this.addTimeDropdown).toBeVisible({ timeout: 10000 });
    await this.addTimeDropdown.click();
    await expect(this.addBreakOption.first()).toBeVisible();
    await this.addBreakOption.click();
    await expect(this.addBreakDrawer.first()).toBeVisible();
  }

  /**
   * Opens the Single Time Entry trowser from the Time Entries page by clicking
   * the "Add time" dropdown and selecting "Single time entry". Mirrors
   * {@link openAddBreakDrawer}, reusing the same proven "Add time" dropdown
   * locator.
   */
  async openSingleTimeEntryDrawer() {
    // Handle "Time Summary by Worker view has moved" popup if it appears
    await this.handleApprovalsMigrationPopup();

    // "Single time entry" lives inside the "Add time" dropdown.
    await expect(this.addTimeDropdown).toBeVisible({ timeout: 10000 });
    await this.addTimeDropdown.click();
    await expect(this.singleTimeEntryOption.first()).toBeVisible();
    await this.singleTimeEntryOption.first().click();
  }

  async handleApprovalsMigrationPopup() {
    // Check for "Time Summary by Worker view has moved" popup and dismiss it
    // This popup can appear late, so we wait a bit and check multiple times
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const popupText = this.page.getByText(
          'Time Summary by Worker view has moved to the new Approvals tab',
        );
        const gotItButton = this.page.getByRole('button', { name: 'Got it' });

        // Wait a bit for popup to potentially appear
        await this.page.waitForTimeout(1000);

        if (await popupText.isVisible({ timeout: 1000 })) {
          console.log(
            '  Found "Time Summary by Worker view has moved" popup, clicking "Got it"',
          );
          await gotItButton.click();
          await this.page.waitForTimeout(1000);
          return; // Popup handled, exit
        }
      } catch {
        // Popup not present, continue checking
      }
    }
  }

  async selectTeamMemberAndBreakType(teamMember: string, breakType: string) {
    // Retry clicking dropdown up to 3 times
    const teamMemberOption = this.page.locator(
      `//span[@title="${teamMember}"]`,
    );
    for (let i = 0; i < 5; i++) {
      await this.page.waitForTimeout(5000);
      await expect(this.teamMemberDropdown).toBeVisible({ timeout: 5000 });
      await this.teamMemberDropdown.click({ force: true });
      await this.page.waitForTimeout(500);
      if (
        await teamMemberOption.isVisible({ timeout: 5000 }).catch(() => false)
      ) {
        break;
      }
      console.log(`Retry ${i + 1}: Team member dropdown not open, retrying...`);
    }
    await teamMemberOption.click();
    await this.page.waitForTimeout(1000);

    // Retry clicking break type dropdown
    const breakTypeOption = this.page
      .locator(`//li[text()='${breakType}']`)
      .or(this.page.locator(`//span[text()='${breakType}']`));
    for (let i = 0; i < 5; i++) {
      await this.breakTypeDropdown.click({ force: true });
      await this.page.waitForTimeout(500);
      if (
        await breakTypeOption.isVisible({ timeout: 2000 }).catch(() => false)
      ) {
        break;
      }
      console.log(`Retry ${i + 1}: Break type dropdown not open, retrying...`);
    }
    await breakTypeOption.click();
  }

  /**
   * Changes ONLY the break type in an already-open (e.g. edit) Break drawer,
   * leaving the team member untouched. Retries opening the "Select Break"
   * dropdown until the requested option is visible, then selects it.
   */
  async selectBreakTypeOnly(breakType: string) {
    const breakTypeOption = this.page
      .locator(`//li[text()='${breakType}']`)
      .or(this.page.locator(`//span[text()='${breakType}']`));
    for (let i = 0; i < 5; i++) {
      await this.breakTypeDropdown.click({ force: true });
      await this.page.waitForTimeout(500);
      if (
        await breakTypeOption.isVisible({ timeout: 2000 }).catch(() => false)
      ) {
        break;
      }
      console.log(`Retry ${i + 1}: Break type dropdown not open, retrying...`);
    }
    await breakTypeOption.click();
    await this.page.waitForTimeout(500);
  }

  async selectTeamMemberAndFirstBreakType(teamMember: string) {
    // Retry clicking dropdown up to 3 times
    const teamMemberOption = this.page.locator(
      `//span[@title="${teamMember}"]`,
    );
    for (let i = 0; i < 5; i++) {
      await this.teamMemberDropdown.click({ force: true });
      await this.page.waitForTimeout(500);
      if (
        await teamMemberOption.isVisible({ timeout: 2000 }).catch(() => false)
      ) {
        break;
      }
      console.log(`Retry ${i + 1}: Team member dropdown not open, retrying...`);
    }
    await teamMemberOption.click();
    await this.page.waitForTimeout(1000);

    // Retry clicking break type dropdown
    const firstOption = this.page.locator('//ul[@role="listbox"]//li').first();
    for (let i = 0; i < 5; i++) {
      await this.breakTypeDropdown.click({ force: true });
      await this.page.waitForTimeout(500);
      if (await firstOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        break;
      }
      console.log(`Retry ${i + 1}: Break type dropdown not open, retrying...`);
    }
    await firstOption.click();
  }

  async selectBreakEntryType(entryType: 'Duration' | 'Start and end time') {
    if (entryType === 'Start and end time') {
      if (
        await this.page
          .locator(
            `//input[@aria-label="Set start and end time" and @aria-checked='false']`, // | //input[@aria-label="Set start and end time"]//ancestor::*[contains(@class,'Switch-checked')]`,
          )
          .isVisible()
      ) {
        await this.page
          .locator(
            `//input[@aria-label="Set start and end time" and @aria-checked='false']`, // | //input[@aria-label="Set start and end time"]//ancestor::*[contains(@class,'Switch-checked')]`,
          )
          .click();
        await expect(
          this.page.locator(
            `//input[@aria-label="Set start and end time" and @aria-checked='true']`,
          ),
        ).toBeVisible();
      } else {
        console.log(` Start and end type breaks already selected`);
      }
    } else {
      if (
        await this.page
          .locator(
            `//input[@aria-label="Set start and end time" and @aria-checked='true']`,
          )
          .isVisible()
      ) {
        await this.page
          .locator(
            `//input[@aria-label="Set start and end time" and @aria-checked='true']`,
          )
          .click();
        await expect(
          this.page.locator(
            `//input[@aria-label="Set start and end time" and @aria-checked='false']`,
          ),
        ).toBeVisible();
      } else {
        console.log(`Duration type breaks already selected`);
      }
    }
  }

  /**
   * Sets the "Set start and end time" mode using the switch's checked property.
   */
  async setBreakEntryType(entryType: 'Duration' | 'Start and end time') {
    const toggle = this.page.getByRole('switch', {
      name: 'Set start and end time',
    });
    await expect(toggle).toBeVisible({ timeout: 10000 });

    const shouldBeChecked = entryType === 'Start and end time';
    const isChecked = await toggle.isChecked();

    if (isChecked === shouldBeChecked) {
      console.log(
        shouldBeChecked
          ? ` Start and end type breaks already selected`
          : `Duration type breaks already selected`,
      );
      return;
    }

    await toggle.click();
    if (shouldBeChecked) {
      await expect(toggle).toBeChecked();
    } else {
      await expect(toggle).not.toBeChecked();
    }
  }

  async enterDurationDate(date: string) {
    await this.page
      .locator(`//span[text()='Date'] / ancestor::label / descendant::input`)
      .fill(date);
  }

  async enterDurationTime(time: string) {
    await this.page
      .locator(
        `//span[text()='Duration'] / ancestor::label / descendant::input`,
      )
      .first()
      .fill(time);
  }

  async enterNotes(notes: string) {
    await this.page.getByLabel(`Notes`).fill(notes);
  }

  async validateBreakSavedSuccessToast() {
    await expect(
      this.page
        .locator(`//span[text()='Time entry saved for test Emp.']`)
        .first(),
    ).toBeVisible();
  }
  async saveBreak() {
    await this.saveButton.click();
  }

  async enterStartDate(date: string) {
    await this.page.getByLabel('Start Date', { exact: true }).click();
    await this.page.getByLabel('Start Date', { exact: true }).clear();
    await this.page.getByLabel('Start Date', { exact: true }).fill(date);
  }

  async enterStartOrEndTime(type: 'Start Time' | 'End Time', time: string) {
    await this.page
      .locator(`//span[text()='${type}'] / ancestor::label / descendant::input`)
      .fill(time);
  }
  async verifyBreakInList(breakName: string) {
    await expect(this.page.locator(`text=${breakName}`)).toBeVisible();
  }

  async editFirstBreakAndClearField() {
    // Placeholder logic for editing a break
    await this.page.locator('.break-entry .edit-button').first().click(); // Placeholder
    await this.breakNameInput.clear();
  }

  //========================================== Field Visibility Methods ===============================================

  async checkFieldVisibility(fieldName: string) {
    const lowerCaseFieldName = fieldName.toLowerCase();

    // Special handling for Class field
    if (lowerCaseFieldName === 'class') {
      return await this.page
        .locator('[data-cy="class-input-field"]')
        .isVisible();
    }

    switch (lowerCaseFieldName) {
      case 'customers':
        const replaceSmalls = lowerCaseFieldName.replace(/s$/, '');
        return await this.page
          .locator(
            `//*[contains(@placeholder, "${replaceSmalls}") and @type="text"]`,
          )
          .isVisible();
      case 'duration':
        return await this.page
          .locator(`//*[contains(@placeholder, "hh:mm") and @type="text"]`)
          .isVisible();
      case 'billable (per hour)':
        return await this.billRateCheckBoxVisibility();
      default:
        return await this.page
          .locator(
            `//*[contains(@placeholder, "${lowerCaseFieldName}") and @type="text"]`,
          )
          .isVisible();
    }
  }

  async validateFieldNotVisible(fieldName: string) {
    const lowerCaseFieldName = fieldName.toLowerCase();

    // Special handling for Class field
    if (lowerCaseFieldName === 'class') {
      const isVisible = await this.page
        .locator('[data-cy="class-input-field"]')
        .isVisible();
      await expect(isVisible).toBeFalsy();
      return;
    }

    switch (lowerCaseFieldName) {
      case 'customers':
        const replaceSmalls = lowerCaseFieldName.replace(/s$/, '');
        const isVisible = await this.page
          .locator(
            `//*[contains(@placeholder, "${replaceSmalls}") and @type="text"]`,
          )
          .isVisible();
        await expect(isVisible).toBeFalsy();
        break;
      case 'duration':
        const durationVisible = await this.page
          .locator(`//*[contains(@placeholder, "hh:mm") and @type="text"]`)
          .isVisible();
        await expect(durationVisible).toBeFalsy();
        break;
      case 'billable (per hour)':
        const billableVisible = await this.billRateCheckBoxVisibility();
        await expect(billableVisible).toBeFalsy();
        break;
      default:
        const defaultVisible = await this.page
          .locator(
            `//*[contains(@placeholder, "${lowerCaseFieldName}") and @type="text"]`,
          )
          .isVisible();
        await expect(defaultVisible).toBeFalsy();
        break;
    }
  }

  async billRateCheckBoxVisibility() {
    return await this.page
      .locator(`//span[contains(text(), 'Billable (per hour)')]`)
      .isVisible();
  }

  async closeTooltip() {
    // Close any tooltips that might be open
    try {
      const tooltip = this.page.locator('[role="tooltip"]');
      if (await tooltip.isVisible()) {
        await this.page.keyboard.press('Escape');
      }
    } catch (error) {
      // Tooltip might not be present, continue
    }
  }

  async validateSTALoaded() {
    const isSTALoaded = await this.page.locator(
      `//*[text()='Single day entry']`,
    );
    return await expect(isSTALoaded).toBeVisible();
  }

  async navigateToSTA() {
    return await this.page.goto(`app/timeactivity?t=s`, { waitUntil: 'load' });
  }

  async isVisibile(field: string, position: number) {
    const lowerCaseField = field.toLowerCase();

    // Special handling for Class field
    if (lowerCaseField === 'class') {
      return await this.page
        .locator('[data-cy="class-input-field"]')
        .isVisible();
    }

    try {
      return await this.page
        .locator(
          `(//span[contains(text(), '${field}')] / ancestor::label / descendant::input)[${position}]`,
        )
        .isVisible();
    } catch {
      return false;
    }
  }

  async openEditForBreak(breakName: string) {
    await this.page.locator(`text=${breakName}`).first().hover();
    await this.editButton.first().click();
  }

  async clickApproveBreakButton() {
    await this.approveButton.click();
  }

  async clickUnapproveBreakButton() {
    await this.unapproveButton.click();
  }

  async clickDeleteBreakButton() {
    await this.deleteButton.click();
  }

  async confirmDelete() {
    if (await this.confirmButton.isVisible()) {
      await this.confirmButton.click();
    }
  }

  async selectTeamMember(name: string) {
    await this.teamMemberDropdown.selectOption({ label: name });
  }

  async selectBreakType(type: string) {
    await this.breakTypeDropdown.click();
    await this.page.getByRole('option', { name: type }).click();
  }

  async editBreakDetails(newDetails: {
    name?: string;
    startTime?: string;
    endTime?: string;
    duration?: string;
  }) {
    if (newDetails.name) await this.breakNameInput.fill(newDetails.name);
    if (newDetails.startTime)
      await this.startTimeInput.fill(newDetails.startTime);
    if (newDetails.endTime) await this.endTimeInput.fill(newDetails.endTime);
    if (newDetails.duration) await this.durationInput.fill(newDetails.duration);
  }

  getErrorMessage(text: string): Locator {
    return this.errorMessage(text);
  }

  async clickCancelButton() {
    await this.cancelButton.click();
  }

  /**
   * Returns the locator for the PAID BREAK badge for a given break entry name.
   */
  getPaidBreakBadge(breakName: string): Locator {
    return this.page.locator(
      `.break-entry:has-text("${breakName}") .badge-paid`,
    );
  }

  /**
   * Returns the locator for the UNPAID BREAK badge for a given break entry name.
   */
  getUnpaidBreakBadge(breakName: string): Locator {
    return this.page.locator(
      `.break-entry:has-text("${breakName}") .badge-unpaid`,
    );
  }

  /**
   * Returns the locator for any badge for a given entry name (used to check absence of badge).
   */
  getNoBadgeForEntry(entryName: string): Locator {
    return this.page.locator(
      `.break-entry:has-text("${entryName}") .badge-paid, .break-entry:has-text("${entryName}") .badge-unpaid`,
    );
  }

  /**
   * Adds a regular (non-break) time entry for a team member.
   * @param teamMemberName Name of the team member
   * @param entryName Name for the time entry
   * @param startTime Start time string (e.g., '11:00 AM')
   * @param endTime End time string (e.g., '11:15 AM')
   */
  async addRegularTimeEntry(
    teamMemberName: string,
    entryName: string,
    startTime: string,
    endTime: string,
  ) {
    await this.page.locator('button:has-text("Add Time")').click();
    await this.page.locator('button:has-text("Single Time Entry")').click();
    await this.page
      .getByLabel('Team Member')
      .selectOption({ label: teamMemberName });
    await this.page.getByLabel('Start Time').fill(startTime);
    await this.page.getByLabel('End Time').fill(endTime);
    await this.page
      .getByLabel('Notes')
      .fill(entryName)
      .catch(() => {}); // If Notes field exists, use it for entry name
    await this.page.getByRole('button', { name: 'Save' }).click();
  }

  async editBreakEntry(
    breakName: string,
    newDetails: {
      name?: string;
      startTime?: string;
      endTime?: string;
      duration?: string;
    },
  ) {
    await this.openEditForBreak(breakName);
    await this.editBreakDetails(newDetails);
    await this.saveButton.click();
    await this.verifyBreakInList(newDetails.name || breakName);
  }

  async approveBreak(breakName: string) {
    await this.openEditForBreak(breakName);
    await this.approveButton.click();
    await expect(
      this.page.locator(
        `.break-entry:has-text("${breakName}") .approved-indicator`,
      ),
    ).toBeVisible();
  }

  async unapproveBreak(breakName: string) {
    await this.openEditForBreak(breakName);
    await this.unapproveButton.click();
    await expect(
      this.page.locator(
        `.break-entry:has-text("${breakName}") .approved-indicator`,
      ),
    ).not.toBeVisible();
  }

  async deleteBreak(breakName: string) {
    await this.openEditForBreak(breakName);
    await this.deleteButton.click();
    await this.confirmButton.click();
    await expect(this.page.locator(`text=${breakName}`)).not.toBeVisible();
  }
  async clearStartOrEndTime(type: 'Start Time' | 'End Time') {
    await this.page
      .locator(`//span[text()='${type}'] / ancestor::label / descendant::input`)
      .clear();
  }

  async focusStartOrEndTime(type: 'Start Time' | 'End Time') {
    await this.page
      .locator(`//span[text()='${type}'] / ancestor::label / descendant::input`)
      .focus();
  }

  async blurFocusStartOrEndTime(type: 'Start Time' | 'End Time') {
    await this.page
      .locator(`//span[text()='${type}'] / ancestor::label / descendant::input`)
      .blur();
  }

  // ============= Validation Methods =============

  async validateBreakTypeRequiredError() {
    return await expect(
      this.page.locator(`//*[text()='Break type is required']`),
    ).toBeVisible();
  }

  async validateDurationRequiredError() {
    return await expect(
      this.page.locator(`//*[text()='Duration is required']`),
    ).toBeVisible();
  }

  async validateBreakTypeRequiredErrorHidden() {
    return await expect(
      this.page.locator(`//*[text()='Break type is required']`),
    ).toBeHidden();
  }

  async validateDurationRequiredErrorHidden() {
    return await expect(
      this.page.locator(`//*[text()='Duration is required']`),
    ).toBeHidden();
  }

  async validateInvalidTimeFormatError(expectedCount: number) {
    const validationError = this.page.locator(
      `//span[text()='Invalid time format']`,
    );
    return await expect(validationError).toHaveCount(expectedCount);
  }

  async validateEditBreakEntryDialogVisible() {
    return await expect(
      this.page.locator(`//*[text()='Edit Break Entry']`),
    ).toBeVisible();
  }

  async validateApprovedHoursErrorMessage() {
    return await expect(
      this.page.locator(`//*[contains(text(), 'lease unsubmit or have')]`),
    ).toBeVisible();
  }

  async clickCancelButtonInFooter() {
    return await this.page
      .getByRole('button', { name: 'Cancel', exact: true })
      .last()
      .click();
  }

  async clickNoButton() {
    return await this.page.getByRole('button', { name: 'No' }).click();
  }

  // ============= Time Format Validation Methods =============

  getInvalidTimeFormatErrorLocator() {
    return this.page.locator(`//span[text()='Invalid time format']`);
  }

  async validateEndTimeEarlierThanStartTimeError() {
    return await expect(
      this.page.locator(`//*[text()='End time must be after start time.']`),
    ).toBeVisible();
  }

  async validateEndTimeEarlierThanStartTimeErrorHidden() {
    return await expect(
      this.page.locator(`//*[text()='End time must be after start time.']`),
    ).toBeHidden();
  }

  async validateOverlapError() {
    return await expect(
      this.page.getByText(
        'This team member already has a timesheet for this timeframe. Enter different dat',
      ),
    ).toBeVisible();
  }

  async validateOverlapErrorHidden() {
    return await expect(
      this.page.getByText(
        'This team member already has a timesheet for this timeframe. Enter different dat',
      ),
    ).toBeHidden();
  }

  async toggleOnStartEndTime() {
    if (
      await this.page
        .locator(
          `//input[@aria-label="Set start and end time"]//ancestor::*[contains(@class,'Switch-checked')]`,
        )
        .isVisible({ timeout: 5000 })
        .catch(() => false)
    ) {
      return;
    }
    await expect(
      this.page
        .locator(
          `//*[text()='Set start and end time']/following::input[@type='checkbox']`,
        )
        .first(),
    ).toBeVisible({ timeout: 5000 });
    await this.page
      .locator(
        `//*[text()='Set start and end time']/following::input[@type='checkbox']`,
      )
      .first()
      .click();
    await expect(
      this.page.locator(
        `//input[@aria-label="Set start and end time"]//ancestor::*[contains(@class,'Switch-checked')]`,
      ),
    ).toBeVisible();
  }
}
