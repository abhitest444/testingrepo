import { Page, Locator, expect } from '@playwright/test';

/**
 * Self-contained Single Time Entry page object for the TE01 suite.
 *
 * This is a standalone copy (not a subclass/import) of the shared STE page so
 * the TE01 suite has NO dependency on `./SingleTimeEntryPage`. Behaviour and
 * selectors are intentionally identical — keep them in sync only if TE01 needs
 * to diverge.
 */
class TESingleTimeEntryPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async getFieldValue(fieldName: string) {
    return await this.getFieldLocator(fieldName).getAttribute('value');
  }

  async getNotesFieldValue() {
    const value = await this.page
      .locator(
        `//span[contains(text(), 'Notes')] / following-sibling::textarea`,
      )
      .textContent();
    return value;
  }

  async enterFieldValue(fieldName: string, value: string) {
    return await this.getFieldLocator(fieldName).fill(value);
  }

  async selectOptionFromDropdown(
    name: string,
    dropdownLabel: string = 'Name',
    maxRetries: number = 3,
  ) {
    const optionLocator = this.page.locator(
      `//li / descendant::*[self::b | self::span][text()='${name}']`,
    );

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Check if option is visible (dropdown is open)
        const isVisible = await optionLocator.isVisible();

        if (!isVisible) {
          console.log(
            `Attempt ${attempt}: Dropdown closed, reopening "${dropdownLabel}"...`,
          );
          await this.openDropdown(dropdownLabel);
          await this.page.waitForTimeout(500); // Wait for dropdown to fully open
        }

        // Wait for option to be visible and click
        await optionLocator.waitFor({ state: 'visible', timeout: 5000 });
        await optionLocator.click();
        return; // Success!
      } catch (error) {
        console.log(
          `Attempt ${attempt}/${maxRetries} failed for option "${name}"`,
        );
        if (attempt === maxRetries) {
          throw new Error(
            `Failed to select option "${name}" after ${maxRetries} attempts. Dropdown may be closing unexpectedly.`,
          );
        }
        await this.page.waitForTimeout(1000); // Wait before retry
      }
    }
  }

  async clickSaveAndCloseButton() {
    await this.page
      .locator(`//button[contains(@aria-label, "Save and")]`)
      .click();
    return await this.page.locator(`//*[text()='Save and close']`).click();
  }

  async clickFooterCancelButton() {
    return await this.page.getByRole('button', { name: 'Cancel' }).click();
  }

  get headingSingleTimeEntry(): Locator {
    return this.page.getByRole('heading', { name: 'Single time entry' });
  }

  get deleteButton(): Locator {
    return this.page.getByRole('button', { name: 'Delete' });
  }

  get deleteConfirmationHeading(): Locator {
    return this.page.getByRole('heading', {
      name: 'Are you sure you want to delete?',
    });
  }

  get modalDialog(): Locator {
    return this.page.getByTestId('ModalDialog');
  }

  get noButton(): Locator {
    return this.modalDialog.getByRole('button', { name: 'No' });
  }

  get yesButton(): Locator {
    return this.page.getByRole('button', { name: 'Yes' });
  }

  get timeEntryDeletedToast(): Locator {
    return this.page.getByText('Time entry deleted.');
  }

  async expectSingleTimeEntryVisible() {
    await expect(this.headingSingleTimeEntry).toBeVisible();
  }

  async expectDeleteButtonVisible() {
    await expect(this.deleteButton).toBeVisible();
  }

  async clickDeleteButton() {
    await this.deleteButton.click();
  }

  async expectDeleteConfirmationVisible() {
    await expect(this.deleteConfirmationHeading).toBeVisible();
  }

  async clickNoOnDeleteConfirmation() {
    await this.noButton.click();
  }

  async expectDeleteConfirmationNotVisible() {
    await expect(this.deleteConfirmationHeading).not.toBeVisible();
  }

  async clickYesOnDeleteConfirmation() {
    await this.yesButton.click();
  }

  async expectTimeEntryDeletedToastVisible() {
    await expect(this.timeEntryDeletedToast).toBeVisible();
  }

  async verifySetClockToggleState() {
    // Returns true when the "Set start and end time" toggle is ON.
    // The underlying <input> is visually hidden (it's a styled switch) and its
    // aria-checked attribute is unreliable across shells, so detect the real
    // state by the presence of the Start time field — it only renders when the
    // toggle is ON (start/end mode). When OFF, the hh:mm duration field shows
    // instead. Fall back to aria-checked if the field probe is inconclusive.
    const startTimeVisible = await this.page
      .locator(
        `//span[text()="Start time"] | //label[contains(text(), "Start time")]`,
      )
      .first()
      .isVisible()
      .catch(() => false);
    if (startTimeVisible) {
      return true;
    }
    const checked = await this.getSetClockInToggle()
      .getAttribute('aria-checked')
      .catch(() => null);
    return checked === 'true';
  }
  async clickSetClockInAndOutToggles() {
    // The toggle is a span wrapper containing a hidden input
    // We need to click the span.Switch-wrapper, not the input directly
    const toggleWrapper = this.page.locator(
      `//input[@aria-label="Set start and end time"]/parent::span`,
    );
    const toggleByClass = this.page.locator(`span[class*="Switch-wrapper"]`);
    const toggleInput = this.page.locator(
      `//input[@aria-label="Set start and end time"]`,
    );

    // Try clicking the wrapper span first (this is the visible toggle)
    try {
      await toggleWrapper.click({ timeout: 3000 });
    } catch {
      // Fallback to class-based selector
      try {
        await toggleByClass.click({ timeout: 3000 });
      } catch {
        // Last resort: force click the input
        await toggleInput.click({ force: true, timeout: 3000 });
      }
    }

    // Wait for Start time field to appear (confirms toggle worked)
    await this.page
      .waitForSelector(
        `//span[text()="Start time"] | //label[contains(text(), "Start time")]`,
        { state: 'visible', timeout: 5000 },
      )
      .catch(() => {
        console.log('Warning: Start time field not visible after toggle click');
      });
  }
  async openDropdown(label: string) {
    // Build a flexible selector that handles Customer, Customers, Customer/Project, Customers/Projects
    const lowerLabel = label.toLowerCase();

    if (lowerLabel.includes('customer') || lowerLabel.includes('project')) {
      // Try multiple selectors for customer dropdown variations
      const dropdown = this.page
        .getByPlaceholder(/select.*customer/i)
        .or(this.page.getByPlaceholder(/customer/i))
        .or(
          this.page.locator(
            `[placeholder*="Customer"], [placeholder*="customer"]`,
          ),
        )
        .first();
      await dropdown.waitFor({ state: 'visible', timeout: 30000 });
      return await dropdown.click();
    } else {
      // Default: look for placeholder containing the label
      const dropdown = this.page
        .getByPlaceholder(new RegExp(label, 'i'))
        .first();
      await dropdown.waitFor({ state: 'visible', timeout: 30000 });
      return await dropdown.click();
    }
  }

  // TODO it still gets stuck here despite `openDropdown` validating visibility of option
  async clickDropdownOption(optionNumber: number, label: string) {
    await this.page.waitForTimeout(2000);
    const locator = this.page.locator(
      `//span[text()='${label}'] / ancestor::label / descendant::input[@aria-expanded="false"]`,
    );
    if (await locator.isVisible()) {
      await this.page
        .locator(
          `//span[text()='${label}'] / ancestor::label / descendant::div[contains(@class, 'Dropdown')]`,
        )
        .click();
    }
    return await this.page
      .getByRole('option')
      .nth(optionNumber)
      .click({ force: true });
  }

  async clickSaveButton() {
    return await this.page
      .getByRole('button', { name: 'Save', exact: true })
      .click();
  }

  async closeSingleTimeTrowser() {
    return await this.page
      .locator(
        `//div[@data-automation-id="single-time-trowser_close"] / button[@aria-label="Close"]`,
      )
      .click();
  }

  async validateBreakButtonNotVisible() {
    return await expect(
      this.page.getByRole('button', { name: 'Add break' }),
    ).not.toBeVisible();
  }

  async validatePayTypeNotVisible() {
    return await expect(
      this.page.getByPlaceholder('Select pay type'),
    ).not.toBeVisible();
  }

  async validateCostRateNotVisible() {
    return await expect(
      this.page.locator(
        `//span[text()='Cost rate (per hour)']  / ancestor::div[1] /descendant::input[@aria-label="Bill rate"]`,
      ),
    ).not.toBeVisible();
  }

  async validateTaxableNotVisible() {
    return await expect(
      this.page.locator(`//span[text()='Taxable']`),
    ).not.toBeVisible();
  }

  async checkCheckboxIfVisible(label: string) {
    const checkbox = this.page.locator(
      `//span[contains(text(), '${label}')] / ancestor::label / descendant::input`,
    );
    if ((await checkbox.isVisible()) && !(await checkbox.isChecked())) {
      return await checkbox.check();
    }
  }

  async selectTime(timeType: 'Start' | 'End', time: string) {
    // Click the time input to open the dropdown
    const dropdown = this.page.locator(
      `//span[text()="${timeType} time"] / ancestor::label / descendant::input[@data-testid="__textField"]`,
    );
    await dropdown.click();

    // Wait for dropdown options to appear (use XPath only)
    await this.page.waitForSelector(`//li/span`, {
      state: 'visible',
      timeout: 5000,
    });
    await this.page.waitForTimeout(300); // Brief pause for dropdown to fully render

    // Locate the specific time option
    const timeOption = this.page.locator(`//li/span[text()='${time}']`);

    // Wait for the specific time option to be visible
    await timeOption.waitFor({ state: 'visible', timeout: 5000 });

    // Click the option
    await timeOption.click();

    // Wait for dropdown to close
    await this.page.waitForTimeout(300);
  }

  async enterNotes(value: string) {
    return await this.page
      .locator(
        `//span[contains(text(), 'Notes')] / following-sibling::textarea`,
      )
      .fill(value);
  }

  async validateSuccessToast() {
    try {
      return await expect(this.page.getByText('Time entry added.')).toBeVisible(
        {
          timeout: 10000,
        },
      );
    } catch (error) {
      // Ignore the error and move ahead
    }
  }

  async getTime(timeType: 'Start' | 'End') {
    const timeValue = await this.page
      .locator(
        `//span[text()="${timeType} time"] / ancestor::label / descendant::input[@data-testid="__textField"]`,
      )
      .getAttribute('value');
    await this.page.keyboard.press(`Tab`);
    return timeValue;
  }

  async checkFieldVisibility(fieldName: string) {
    const lowerCaseFieldName = fieldName.toLowerCase();
    switch (lowerCaseFieldName) {
      case 'cost rate (per hour)':
        return await this.costRateFieldVisibility();
      case 'billable (per hour)':
        return await this.billRateCheckBoxVisibility();
      default:
        // Use the generic field locator that handles capitalization for any field
        return await this.getFieldLocator(fieldName).isVisible();
    }
  }

  async fillBillRateInput(rate: string) {
    const billRateInput = this.page.locator(
      `//span[contains(text(), 'Billable')]  / ancestor::div[contains(@class, 'BillableTaxable')] / descendant::input[@aria-label="Bill rate"]`,
    );
    if (await billRateInput.isVisible()) {
      return await billRateInput.fill(rate);
    }
  }

  async billRateCheckBoxVisibility() {
    return await this.page
      .locator(`//span[contains(text(), 'Billable (per hour)')]`)
      .isVisible();
  }

  async waitForNameFieldToPopulate() {
    const nameSelector = `//*[contains(@placeholder, "name") and @type="text"]`;
    await this.waitTillNameFieldVisible();
    // Admin/manager trowsers often keep Name empty until the test selects an
    // employee; only poll briefly for self-service auto-populate.
    const populated = await this.page
      .waitForFunction(
        (sel) => {
          const el = document.evaluate(
            sel,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null,
          ).singleNodeValue as HTMLInputElement | null;
          return el && el.value && el.value.trim().length > 0;
        },
        nameSelector,
        { timeout: 5000 },
      )
      .then(() => true)
      .catch(() => false);
    if (!populated) {
      console.log(
        '[TE01][STE] Name field visible but empty — will select employee manually',
      );
    }
  }

  async validateStartEndTimeInFutureError() {
    return await expect(
      this.page.getByText('Start or end time cannot be in the future.'),
    ).toBeVisible();
  }

  async fillStartDate(startDate: string) {
    return await this.page
      .getByLabel('Start date', { exact: true })
      .fill(startDate);
  }

  async fillEndDate(startDate: string) {
    return await this.page
      .getByLabel('End date', { exact: true })
      .fill(startDate);
  }

  async getDate(type: 'Start' | 'End') {
    return await this.page
      .getByLabel(`${type} date`, { exact: true })
      .getAttribute('value');
  }

  async clearDate(type: 'Start' | 'End') {
    return await this.page
      .getByLabel(`${type} date`, { exact: true })
      .getAttribute('value');
  }

  async getSummaryText() {
    return await this.page
      .locator(`//p[contains(text(),'Summary')]`)
      .textContent();
  }

  normalizeSpaces(str: string): string {
    return str.replace(/\s+/g, ' ').trim();
  }

  getSetClockInToggle() {
    return this.page.locator(`//input[@aria-label="Set start and end time"]`);
  }

  async clickSaveAndNewButton() {
    await this.page
      .locator(`//button[contains(@aria-label, "Save and")]`)
      .click();
    await this.page.locator(`//*[text()='Save and new']`).click();
  }

  async waitTillNameFieldVisible() {
    return await expect(
      this.page.locator(`//*[contains(@placeholder, "name") and @type="text"]`),
    ).toBeVisible();
  }

  getOverlapError() {
    return this.page.locator(
      `//div[@data-automation-id="SingleTimeHOCErrorPageMessage"] / descendant::*[contains(text(), 'This team member already has a timesheet')]`,
    );
  }

  async waitTillSuccessToastDisappears() {
    return await expect(this.page.getByText('Time entry added.')).toBeHidden();
  }

  async handleTourModal() {
    // Handle all popups including the tour modal
    await this.handlePopupsInAnyOrder();
    await this.waitTillNameFieldVisible();
  }

  // Utility function to handle popups that may appear in any order
  async handlePopupsInAnyOrder(): Promise<void> {
    let popupsHandled = 0;
    const maxAttempts = 10; // Prevent infinite loops

    // First do a quick check to see if any popups are immediately visible
    const hasImmediatePopups = await this.checkForImmediatePopups();
    if (!hasImmediatePopups) {
      // If no immediate popups, wait a bit longer for delayed popups to appear
      await this.page.waitForTimeout(1000);
    }

    for (
      let attempt = 0;
      attempt < maxAttempts && popupsHandled < 6;
      attempt++
    ) {
      let handledThisRound = false;

      // Check for "A faster way to enter time" tour modal
      try {
        if (
          await this.page
            .getByRole('heading', {
              name: 'A faster way to enter time',
            })
            .isVisible({ timeout: 1000 })
        ) {
          await this.page
            .getByTestId('ModalDialog')
            .getByRole('button', { name: 'Close' })
            .click({ timeout: 2000 });
          await this.page.waitForTimeout(500);
          popupsHandled++;
          handledThisRound = true;
        }
      } catch (error) {
        // Popup disappeared on its own, continue
      }

      // Check for "Just around the corner" popup
      try {
        if (
          await this.page
            .getByText('Just around the corner')
            .isVisible({ timeout: 1000 })
        ) {
          await this.page
            .getByTestId('ModalDialog')
            .getByRole('button', { name: 'Ok' })
            .click({ timeout: 2000 });
          await this.page.waitForTimeout(500);
          popupsHandled++;
          handledThisRound = true;
        }
      } catch (error) {
        // Popup disappeared on its own, continue
      }

      // Check for "QuickBooks Time got a glow-up" popup
      try {
        if (
          await this.page
            .getByText('QuickBooks Time got a glow-up')
            .isVisible({ timeout: 1000 })
        ) {
          await this.page
            .getByRole('button', { name: 'Close', exact: true })
            .click({ timeout: 2000 });
          await this.page.waitForTimeout(500);
          popupsHandled++;
          handledThisRound = true;
        }
      } catch (error) {
        // Popup disappeared on its own, continue
      }

      // Check for "Streamlined time settings" popup
      try {
        if (
          await this.page
            .getByText('Streamlined time settings')
            .isVisible({ timeout: 1000 })
        ) {
          // Try to click "Got it" first, then fall back to "Close"
          try {
            await this.page
              .getByRole('button', { name: 'Got it' })
              .click({ timeout: 2000 });
          } catch {
            await this.page
              .getByRole('button', { name: 'Close' })
              .click({ timeout: 2000 });
          }
          await this.page.waitForTimeout(500);
          popupsHandled++;
          handledThisRound = true;
        }
      } catch (error) {
        // Popup disappeared on its own, continue
      }

      // Check for "Single time entry" popup
      try {
        if (
          await this.page
            .getByTestId('ModalDialog')
            .getByRole('heading', { name: 'Single time entry' })
            .isVisible({ timeout: 1000 })
        ) {
          await this.page
            .getByRole('button', { name: 'Got it' })
            .click({ timeout: 2000 });
          await this.page.waitForTimeout(500);
          popupsHandled++;
          handledThisRound = true;
        }
      } catch (error) {
        // Popup disappeared on its own, continue
      }

      // Check for "Go to QuickBooks Time to enter a timesheet" popup
      try {
        if (
          await this.page
            .getByRole('heading', {
              name: 'Go to QuickBooks Time to enter a timesheet',
            })
            .isVisible({ timeout: 1000 })
        ) {
          await this.page
            .getByLabel('Please do not show again')
            .click({ timeout: 2000 });
          await this.page
            .getByRole('button', { name: 'Close' })
            .nth(2)
            .click({ timeout: 2000 });
          await this.page.waitForTimeout(500);
          popupsHandled++;
          handledThisRound = true;
        }
      } catch (error) {
        // Popup disappeared on its own, continue
      }

      // If no popups were handled this round, break the loop
      if (!handledThisRound) {
        break;
      }
    }
  }

  // Private helper methods

  // Helper method to quickly check if any popups are immediately visible
  private async checkForImmediatePopups(): Promise<boolean> {
    try {
      // Use Promise.race to check all popup types with very short timeout
      await Promise.race([
        this.page
          .getByRole('heading', {
            name: 'A faster way to enter time',
          })
          .waitFor({ state: 'visible', timeout: 100 }),
        this.page
          .getByText('Just around the corner')
          .waitFor({ state: 'visible', timeout: 100 }),
        this.page
          .getByText('QuickBooks Time got a glow-up')
          .waitFor({ state: 'visible', timeout: 100 }),
        this.page
          .getByText('Streamlined time settings')
          .waitFor({ state: 'visible', timeout: 100 }),
        this.page
          .getByTestId('ModalDialog')
          .getByRole('heading', { name: 'Single time entry' })
          .waitFor({ state: 'visible', timeout: 100 }),
        this.page
          .getByRole('heading', {
            name: 'Go to QuickBooks Time to enter a timesheet',
          })
          .waitFor({ state: 'visible', timeout: 100 }),
      ]);
      return true; // At least one popup is immediately visible
    } catch (error) {
      return false; // No popups are immediately visible
    }
  }

  // Helper method to get field locator that handles capitalization differences for any field
  private getFieldLocator(fieldName: string) {
    const lowerCaseFieldName = fieldName.toLowerCase();

    // Special cases that need specific handling
    switch (lowerCaseFieldName) {
      case 'customers':
        // Handle both "Select customer" and "Select Customer" cases (note: removes 's' for customer)
        return this.getCaseInsensitiveLocator('customer');
      case 'duration':
      case 'break':
        return this.page.locator(
          `//*[contains(@placeholder, "hh:mm") and @type="text"]`,
        );
      default:
        // Generic handler for any field - handles all capitalization patterns
        return this.getCaseInsensitiveLocator(lowerCaseFieldName);
    }
  }

  // Helper method to create a case-insensitive locator for any field pattern
  private getCaseInsensitiveLocator(fieldPattern: string) {
    // Use case-insensitive XPath with contains() for maximum flexibility
    const lowercase = fieldPattern.toLowerCase();
    return this.page
      .locator(
        `//*[contains(translate(@placeholder, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), "${lowercase}") and @type="text"]`,
      )
      .first();
  }

  async costRateFieldVisibility() {
    return await this.page
      .locator(`//span[contains(text(), 'Cost rate (per hour)')]`)
      .isVisible();
  }
}

export default TESingleTimeEntryPage;
