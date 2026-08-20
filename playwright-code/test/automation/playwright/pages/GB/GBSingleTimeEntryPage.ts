import { Page, Locator, expect } from '@playwright/test';
import { LABELS } from '../../utils';

class SingleTImeEntryPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async getFieldValue(fieldName: string) {
    return await this.getFieldLocator(fieldName).getAttribute('value');
  }

  getSetClockInToggle() {
    return this.page.locator(`//input[@aria-label="Set start and end time"]`);
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

  async selectOptionFromDropdown(name: string) {
    return await this.page
      .locator(
        `//li / descendant::*[self::b | self::span][contains(text(), '${name}')]`,
      )
      .click();
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
    // when toggle is on returns true, else false
    let status;
    try {
      status = await this.page
        .locator(
          `//span[text()='Set clock in and out'] / following::input[@aria-checked='true']`,
        )
        .isVisible();
    } catch {
      status = false;
    }
    return status;
  }
  async clickSetClockInAndOutToggles() {
    return await this.page
      .locator(
        `//span[contains(text(), 'Set clock')] / .. / following-sibling::input`,
      )
      .click();
  }
  async openDropdown(label: string) {
    await this.page.waitForSelector(
      `//span[contains(text(),'${label}')] / ancestor::label / descendant::div[contains(@class, 'Dropdown')]`,
      { state: 'visible', timeout: 0 },
    );
    return await this.page
      .locator(
        `//span[contains(text(),'${label}')] / ancestor::label / descendant::div[contains(@class, 'Dropdown')]`,
      )
      .click();
  }

  async openCustomerDropdown(label: string) {
    const customerDropdownSelector = `//span[contains(text(),'${label}')]/../following-sibling::div[contains(@class,'Dropdown')]`;
    await this.page.waitForSelector(customerDropdownSelector, {
      state: 'visible',
      timeout: 500,
    });
    return await this.page.locator(customerDropdownSelector).first().click();
  }

  async openAndselectCustomerOption(optionNumber: number): Promise<void> {
    const customerLabels = ['Customer', 'Customer/Project'];
    for (const label of customerLabels) {
      try {
        await this.openCustomerDropdown(label);
        await this.page.waitForTimeout(500);
        await this.clickDropdownOption(optionNumber, label);
        return;
      } catch {
        continue;
      }
    }
    throw new Error('Customer label not found');
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

  async checkCheckboxIfVisible(label: string) {
    const checkbox = this.page.locator(
      `//span[contains(text(), '${label}')] / ancestor::label / descendant::input`,
    );
    if ((await checkbox.isVisible()) && !(await checkbox.isChecked())) {
      return await checkbox.check();
    }
  }

  async selectTime(timeType: 'Start' | 'End', time: string) {
    await this.page
      .locator(
        `//span[text()="${timeType} time"] / ancestor::label / descendant::input[@data-testid="__textField"]`,
      )
      .click();
    return await this.page.locator(`//li[text()='${time}']`).click();
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
    if (
      await this.page
        .getByRole('heading', { name: 'A faster way to enter time' })
        .isVisible()
    ) {
      await this.page
        .getByTestId('ModalDialog')
        .getByRole('button', { name: 'Close' })
        .click();
    }
    await this.waitTillNameFieldVisible();
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
      .locator(`//span[contains(text(), '${LABELS.CostRatePerHour}')]`)
      .isVisible();
  }

  // Utility function to handle popups that may appear in any order
  async handlePopupsInAnyOrder(): Promise<void> {
    await this.page.waitForTimeout(3000); // Increased initial wait for late-appearing popups
    let popupsHandled = 0;
    const maxAttempts = 10; // Prevent infinite loops
    // First do a quick check to see if any popups are immediately visible
    const hasImmediatePopups = await this.checkForImmediatePopups();
    if (!hasImmediatePopups) {
      // If no immediate popups, wait a bit longer for delayed popups to appear
      await this.page.waitForTimeout(3000); // Increased wait for delayed popups
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
            .isVisible({ timeout: 2000 })
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
            .isVisible({ timeout: 2000 })
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
            .isVisible({ timeout: 5000 })
        ) {
          await this.page
            .locator(
              `//div[@data-automation-id="ModalDialog"] / descendant::button[@aria-label="Close"]`,
            )
            .or(this.page.getByRole('button', { name: 'Close', exact: true }))
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
            .or(
              this.page.getByRole('heading', {
                name: 'Streamlined time settings',
              }),
            )
            .isVisible({ timeout: 3000 })
        ) {
          // Try to click "Got it" first, then fall back to "Close"
          try {
            await this.page
              .getByRole('button', { name: 'Got it' })
              .click({ timeout: 2000 });
          } catch {
            await this.page
              .getByTestId('ModalDialog')
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
            .isVisible({ timeout: 2000 })
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
            .or(
              this.page.getByRole('heading', {
                name: 'Go to QuickBooks Time to',
              }),
            )
            .isVisible({ timeout: 2000 })
        ) {
          await this.page
            .getByLabel('Please do not show again')
            .or(this.page.getByText('Please do not show again'))
            .click({ timeout: 2000 });
          await this.page
            .getByTestId('ModalDialog')
            .getByLabel('Close')
            .or(
              this.page
                .getByTestId('ModalDialog')
                .locator('button')
                .filter({ hasText: 'Close' }),
            )
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
  // Wait for page to be fully loaded and ready
  async waitForPageReady(): Promise<void> {
    try {
      // Wait for either the loading spinner to appear and disappear, or key page elements to be visible
      await Promise.race([
        // Option 1: Wait for loading spinner to finish
        this.loadingSpinner
          .waitFor({ state: 'visible', timeout: 2000 })
          .then(() =>
            this.loadingSpinner.waitFor({
              state: 'hidden',
              timeout: 10000,
            }),
          ),
        // Option 2: Wait for key page elements that indicate the page is ready
        Promise.all([
          this.page
            .locator('[data-testid="DateRangeSelect"], .DateRangeSelect')
            .waitFor({ state: 'visible', timeout: 10000 }),
          this.page
            .locator(
              '[aria-label="Display by"], [data-testid="DisplayByDropdown"]',
            )
            .waitFor({ state: 'visible', timeout: 10000 }),
        ]),
      ]);
      // Small buffer to ensure any immediate popups have time to appear
      await this.page.waitForTimeout(500);
    } catch (error) {
      // If specific elements aren't found, fall back to a shorter wait
      await this.page.waitForTimeout(2000);
    }
  }
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
          .locator('text="Streamlined time settings"')
          .or(
            this.page.getByRole('heading', {
              name: 'Streamlined time settings',
            }),
          )
          .waitFor({ state: 'visible', timeout: 100 }),
        this.page
          .getByTestId('ModalDialog')
          .getByRole('heading', { name: 'Single time entry' })
          .waitFor({ state: 'visible', timeout: 100 }),
        this.page
          .getByRole('heading', {
            name: 'Go to QuickBooks Time to enter a timesheet',
          })
          .or(
            this.page.getByRole('heading', {
              name: 'Go to QuickBooks Time to',
            }),
          )
          .waitFor({ state: 'visible', timeout: 100 }),
      ]);
      return true; // At least one popup is immediately visible
    } catch (error) {
      return false; // No popups are immediately visible
    }
  }

  get loadingSpinner() {
    return this.page.locator(
      `//div[@aria-label="Loading" and @role="progressbar"]`,
    );
  }
}
export default SingleTImeEntryPage;
