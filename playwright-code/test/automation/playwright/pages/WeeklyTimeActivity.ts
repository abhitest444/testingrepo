import { Page } from 'playwright-core';
import { expect } from '@playwright/test';
import gotoWithAuthSession from '../gotoWithAuthSession';
import { CHARACTERS, LABELS, testData } from '../utils';
import { TIMEOUT } from 'dns';
import { AutomationLogin } from '../logins';
import { Tab } from '@ids-ts/tabs';

class WeeklyTimeActivity {
  page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async handleWTATourPopup() {
    console.log('Checking for WTA tour popup...');

    // Check if the tour popup is visible automatically
    const transformPopup = this.page.locator(
      `//*[contains(text(), 'We transformed')]`,
    );
    const isPopupVisible = await transformPopup
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (!isPopupVisible) {
      console.log(
        'Tour popup not visible automatically, clicking "See what\'s new" button...',
      );

      // Try to find and click the "See what's new" button
      const seeWhatsNewButton = this.page.getByRole('button', {
        name: "See what's new",
      });
      const isButtonVisible = await seeWhatsNewButton
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      if (!isButtonVisible) {
        console.log('✓ Tour popup not found - skipping tour validation');
        return;
      }

      await seeWhatsNewButton.click();
      await this.page.waitForTimeout(1000);
    }

    // Page 1: "We transformed"
    await expect(transformPopup).toBeVisible({ timeout: 5000 });
    console.log('✓ Tour popup page 1 visible: "We transformed"');

    // Click "See what's new" button inside the popup (page 1 -> page 2)
    await this.page
      .locator(
        `//div[contains(@class, 'GeneralPopoverTourstyled')] / descendant::*[contains(text(),"See what")]`,
      )
      .click();
    await this.page.waitForTimeout(1000);

    // Page 2: "Choose an employee"
    const page2Text = this.page.locator(
      `//*[contains(text(), 'Choose an employee')]`,
    );
    await expect(page2Text).toBeVisible({ timeout: 5000 });
    console.log('✓ Tour popup page 2 visible: "Choose an employee"');

    await this.page.getByRole('button', { name: 'Next: enter time' }).click();
    await this.page.waitForTimeout(1000);

    // Page 3: "After entering job" (different from STA)
    const page3Text = this.page.locator(
      `//*[contains(text(), 'After entering job')]`,
    );
    await expect(page3Text).toBeVisible({ timeout: 5000 });
    console.log('✓ Tour popup page 3 visible: "After entering job"');

    await this.page
      .getByRole('button', { name: 'Next: save time entry' })
      .click();
    await this.page.waitForTimeout(1000);

    // Page 4: "Hit the save button"
    const page4Text = this.page.locator(
      `//*[contains(text(), 'Hit the save button')]`,
    );
    await expect(page4Text).toBeVisible({ timeout: 5000 });
    console.log('✓ Tour popup page 4 visible: "Hit the save button"');

    // Test back button functionality
    const backButton = this.page.locator(
      `//button[contains(@class, 'GeneralPopoverTourstyled__BackButton')]`,
    );
    const hasBackButton = await backButton
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (hasBackButton) {
      await backButton.click();
      await this.page.waitForTimeout(1000);
      await expect(page3Text).toBeVisible({ timeout: 5000 });
      console.log('✓ Back button works: Returned to page 3');
    } else {
      console.log('ℹ Back button not found in popup, using browser back');
      await this.page.goBack();
      await this.page.waitForTimeout(1000);
      await expect(page3Text).toBeVisible({ timeout: 5000 });
      console.log('✓ Browser back button works: Returned to page 3');
    }

    // Navigate forward again to page 4
    await this.page
      .getByRole('button', { name: 'Next: save time entry' })
      .click();
    await this.page.waitForTimeout(1000);
    await expect(page4Text).toBeVisible({ timeout: 5000 });
    console.log('✓ Navigated back to page 4');

    // Close the tour
    await this.page.getByRole('button', { name: 'Done' }).click();
    await this.page.waitForTimeout(1000);

    // Validate popup is closed
    const isPopupClosed = await page4Text
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    if (!isPopupClosed) {
      console.log('✓ Tour popup closed successfully');
    } else {
      console.log('⚠ Warning: Tour popup may still be visible');
    }
  }

  async timeForDropdown(label: string) {
    let retries = 0;
    while (retries < 3) {
      await this.page
        .locator('label')
        .filter({ hasText: label })
        .locator('div')
        .nth(1)
        .click();

      try {
        // wait for dropdown options to appear
        await this.page.waitForSelector('[role=option]', {
          state: 'attached',
          timeout: 1000,
        });
        return; // success
      } catch (error) {
        retries += 1;
      }
    }
  }

  // fetch row based drop downs
  async openRowDropdown(label: string, position: number) {
    let retries = 0;
    while (retries < 3) {
      await this.page
        .locator(
          `(//span[contains(text(), '${label}')] / ancestor::label / descendant::input)[${position}]`,
        )
        .click();

      try {
        // wait for dropdown options to appear
        await this.page.waitForSelector('[role=option]', {
          state: 'attached',
          timeout: 1000,
        });
        return; // success
      } catch {
        retries += 1;
      }
    }
  }

  async isVisibile(label: string, position: number) {
    let isVisibleRow;
    try {
      isVisibleRow = await this.page
        .locator(
          `(//span[text()='${label}'] / ancestor::label / descendant::input)[${position}]`,
        )
        .isVisible();
    } catch {
      isVisibleRow = false;
    }
    return isVisibleRow;
  }

  async closeTooltip() {
    const closeTooltipButton = await this.page.getByRole('button', {
      name: 'Close Tooltip',
    });
    if (await closeTooltipButton.isVisible()) {
      await closeTooltipButton.click();
      await this.page.waitForTimeout(1000);
    }
  }

  async isBillableVisible() {
    let isBillableVisibleRow;
    try {
      isBillableVisibleRow = await this.page
        .locator(`//span[contains(text(),'Billable')]`)
        .count();
      if (isBillableVisibleRow > 0) {
        return true;
      }
    } catch {
      isBillableVisibleRow = false;
    }
    return isBillableVisibleRow;
  }

  async isPayTypeDisabled(label: string, position: number): Promise<boolean> {
    let isDisabled;
    try {
      const selector = `(//span[contains(text(), '${label}')] / ancestor::label / descendant::input[@disabled])[${position}]`;
      // await this.page.locator(selector).waitFor({ state: "visible" });

      isDisabled = await this.page.locator(selector).isVisible();
    } catch {
      isDisabled = false;
    }
    return isDisabled;
  }

  async durationToBeEmpty(position: number) {
    const durationArr = this.page.locator(
      `//tr[${position}]//input[contains(@aria-label,"${LABELS.Duration}")]`,
    );

    for (let i = 0; i < (await durationArr.count()); i += 1) {
      const hours = await durationArr.nth(i).getAttribute('value');
      console.log(hours);
      expect(hours).toBe('');
    }
  }

  async enterDuration(position: number) {
    const durationArr = this.page.locator(
      `//tr[${position}]//input[contains(@aria-label,"${LABELS.Duration}")]`,
    );
    const numberOfDays = await durationArr.count();

    for (let i = 0; i < numberOfDays; i += 1) {
      const hours = durationArr.nth(i);
      await hours.fill('1');
    }
    await this.page.keyboard.press('Tab');
  }

  async isChecked(position: number, label: string) {
    let isChecked;
    try {
      isChecked = await this.page
        .locator(
          `//tr[${position}]// span[contains(text(), '${label}')]/../preceding-sibling::span/input[@type='checkbox']`,
        )
        .isChecked();
    } catch {
      isChecked = false;
    }

    return isChecked;
  }

  async checkInputCheckbox(position: number, label: string) {
    await this.page
      .locator(
        `//tr[${position}]// span[contains(text(), '${label}')]/../preceding-sibling::span/input[@type='checkbox']`,
      )
      .check();
  }

  async unCheckInputCheckbox(position: number, label: string) {
    await this.page
      .locator(
        `//tr[${position}]// span[contains(text(), '${label}')]/../preceding-sibling::span/input[@type='checkbox']`,
      )
      .uncheck();
  }

  findNotes = (position: number) => {
    return this.page.locator(`//tr[${position}] / descendant::textarea`);
  };

  async enterNotes(label: string, position: number) {
    await this.page.locator(`//tr[${position}] / descendant::textarea`).click();
    await this.page
      .locator(`//tr[${position}] / descendant::textarea`)
      .fill(label);
  }

  async expandRow(position: number) {
    await this.page
      .locator(`//tr[${position}] / td / button[@aria-label="Expand row"]`)
      .click();
  }

  async enterBillRate(position: number) {
    if (
      await this.page
        .locator(
          `//tr[${position}] / descendant::input[@aria-label='${LABELS.BillRate}']`,
        )
        .isVisible()
    ) {
      await this.page.waitForSelector(
        `//tr[${position}] / descendant::input[@aria-label='${LABELS.BillRate}']`,
        { state: 'visible', timeout: 1000 },
      );
      try {
        (await this.billRate(position)).clear();
        await this.page.waitForTimeout(1000);
        (await this.billRate(position)).fill('2');
        await this.page.waitForTimeout(1000);
      } catch (error) {
        console.error('Failed to fill BillRate:', error);
      }
    }
  }

  async isExpandRowIconVisible(position: number) {
    const isExpandRowIconVisible = await this.page
      .locator(`//tr[${position}] / td / button[@aria-label="Expand row"]`)
      .isVisible();
    return isExpandRowIconVisible;
  }

  async durationHaveGivenTextValue(duration: string, position: number) {
    const durationArr = this.page.locator(
      `//tr[${position}]//input[contains(@aria-label,"${LABELS.Duration}")]`,
    );
    const numberOfDays = await durationArr.count();
    for (let i = 0; i < numberOfDays; i += 1) {
      const hours = durationArr.nth(i);
      await expect(hours).toHaveValue(duration);
    }
  }

  // function to check the added values are displayed with respect to the notes
  async validateRowsWithGivenData(notes: string, duration: string) {
    const numberOfRowsArr = this.page.locator(
      `//tbody[@data-test-id="weekly-time-table-row"]/tr`,
    );
    const numberOfrows = await numberOfRowsArr.count();
    for (let i = 1; i <= numberOfrows; i += 1) {
      if (await this.isExpandRowIconVisible(i)) {
        await this.expandRow(i);
      }
      let text = await this.findNotes(i).textContent();
      if (text?.includes(notes)) {
        this.durationHaveGivenTextValue(duration, i);
        console.log(`Notes ${notes} has the duration set to ${duration}`);
        break;
      }
    }
  }

  async clickButtonSaveandClose() {
    await this.page.locator(`//button[@title="Save and new menu"]`).click();

    await this.page.locator(`//li[text()='Save and close']`).click();
  }

  async clickSaveAndCloseButton() {
    await this.page
      .locator(`//button[contains(@aria-label, "Save and")]`)
      .click();
    await this.page.locator(`//*[text()='Save and close']`).click();
  }

  billRate = async (position: number) => {
    return this.page.locator(
      `//tr[${position}] / descendant::input[@aria-label='${LABELS.BillRate}']`,
    );
  };

  clickDeleteIconRow = async (position: number) => {
    return this.page
      .locator(
        `//tr[${position}] / descendant::button[@aria-label='${LABELS.DeleteTimeRow}']`,
      )
      .click({ force: true });
  };

  getTeamForVal = async (position: number) => {
    return this.page
      .locator(
        `(//span[text()='Name'] / ancestor::label / descendant::input)[${position}]`,
      )
      .getAttribute('value');
  };

  getCustomerVal = async (position: number) => {
    return this.page
      .locator(
        `(//span[text()='Customers'] / ancestor::label / descendant::input)[${position}]`,
      )
      .getAttribute('value');
  };

  getByText(text: string) {
    return this.page.getByText(text);
  }

  getByLabel(label: string) {
    return this.page.getByLabel(label);
  }

  getByPlaceholder(placeHolder: string) {
    return this.page.getByPlaceholder(placeHolder);
  }

  dropdownOptionsCount() {
    return this.page.getByRole('option').count();
  }

  isOptionAvailable(n: number) {
    return this.page.getByRole('option').nth(n).isVisible();
  }

  // TODO it still gets stuck here despite `openDropdown` validating visibility of option
  clickDropdownOption(n = 2) {
    return this.page.getByRole('option').nth(n).click();
  }

  async selectOption(optionNumber = 1) {
    await this.page
      .locator(
        `(//li[contains(@class, 'menu-item-container')])[${optionNumber}]`,
      )
      .click();
  }

  async navigateToWeeklyTime(id = null) {
    const url = `/app/timetracking${id ? `?id=${id}` : ''}`;
    await gotoWithAuthSession(this.page, url, { waitUntil: 'load' });
    await this.page.waitForTimeout(2000);
    await this.page.waitForLoadState('load');
  }

  async clickButton(buttonText: string) {
    return await this.page
      .getByRole('button', { name: buttonText, exact: true })
      .click({ force: true });
  }

  async clickSaveAndNewButton() {
    await this.page
      .locator(`//button[@aria-label="Save and new menu"]`)
      .or(this.page.locator(`//button[@aria-label="Save and close menu"]`))
      .click();
    await this.page.waitForTimeout(2000);
    await this.page.locator(`//*[text()='Save and new']`).click();
  }

  async scrollTillButtonNotFound(buttonName: string) {
    await this.page.evaluate((buttonText: string) => {
      const buttons = Array.from(document.querySelectorAll('button')); // Get all buttons
      const targetButton = buttons.find((button) =>
        button.innerText.includes(buttonText),
      ); // Find button with matching text
      if (targetButton) {
        targetButton.scrollIntoView(); // Scroll to the button
      }
    }, buttonName);

    // Wait for the button to be clickable
    await this.page.waitForSelector(`text=${buttonName}`, {
      state: 'visible',
    });
  }

  async validateSuccessToast() {
    // await expect(this.page.getByTestId('toastMessage')).toMatchAriaSnapshot(`- text: Time entry added.`);
    await expect(this.page.getByText('Time entry added.')).toBeVisible({
      timeout: 30000,
    });
  }

  async validateSuccessToastMsg() {
    await expect(this.page.getByText('Time entry added.')).toBeVisible();
  }

  async validateSaveandNew(n = 1) {
    const customer = await this.getCustomerVal(n);
    expect(customer).toBe('');

    const name = await this.getTeamForVal(n);
    expect(name).toBe('');
  }

  async validateSaveandNewTT(n = 1) {
    const customer = await this.getCustomerVal(n);
    expect(customer).toBe('');
  }

  async validateSaveandClose() {
    await this.page.locator(`//div[@aria-label="${LABELS.QBO}"]`).isVisible();
  }

  validateNotes(value: string, position: number) {
    expect(this.findNotes(position)).toContainText(value);
  }

  async validateResponse(createMutationPromisePayload: any) {
    expect(createMutationPromisePayload).toBeDefined();
    expect(
      createMutationPromisePayload.data.timeTrackingBatchManageTimeEntries
        .timeEntries[0].id,
    ).toBeDefined();
  }

  async durationHaveTextValue(position: number) {
    const durationArr = this.page.locator(
      `//tr[${position}]//input[contains(@aria-label,"${LABELS.Duration}")]`,
    );
    const numberOfDays = await durationArr.count();

    for (let i = 0; i < numberOfDays; i += 1) {
      const hours = durationArr.nth(i);
      await expect(hours).toHaveValue('1:00');
    }
  }

  getErrorMessage() {
    return this.page.getByTestId('WeeklyTimeHOCErrorPageMessage');
  }

  async validateUpdateRes(
    createMutationPromisePayload: any,
    updateMutationPromisePayload: any,
  ) {
    // Ensure payloads exist
    expect(createMutationPromisePayload).toBeDefined();
    expect(updateMutationPromisePayload).toBeDefined();

    // Get the data structures
    const createData =
      createMutationPromisePayload.data.timeTrackingBatchManageTimeEntries;
    const updateData =
      updateMutationPromisePayload.data.timeTrackingBatchManageTimeEntries;

    const createID = createData.timeEntries[0].id;

    // Filter the entry
    const matchingUpdateEntry = updateData.timeEntries.find(
      (entry: { id: any }) => entry.id === createID,
    );
    expect(createID).toEqual(matchingUpdateEntry.id);
  }

  async validateUpdateResponse(
    createMutationPromisePayload: any,
    updateMutationPromisePayload: any,
  ) {
    expect(updateMutationPromisePayload).toBeDefined();
    expect(
      createMutationPromisePayload.data.timeTrackingBatchManageTimeEntries
        .timeEntries[0].id,
    ).toEqual(
      updateMutationPromisePayload.data.timeTrackingBatchManageTimeEntries
        .timeEntries[0].id,
    );
  }

  async emptyFieldData(fieldName: string, location: number) {
    if (await this.isVisibile(fieldName, location)) {
      await this.page
        .locator(
          `//tr[${location}] / descendant::span[text()='${fieldName}'] / ancestor::label / descendant::input`,
        )
        .clear();
    }
  }

  async clearTheFieldData(fieldName: string, numberOfRows: number) {
    for (let i = 1; i <= numberOfRows; i += 1) {
      await this.emptyFieldData(fieldName, i);
    }
  }

  async isFieldFindInPopover(field: string) {
    let sttaus;
    try {
      sttaus = await this.page
        .locator(
          `//div[contains(@class, 'TimeSettingsPopoverForm')] / descendant::span[text()='${field}'] / ancestor::label / descendant::input`,
        )
        .isVisible();
    } catch {
      sttaus = false;
    }
    return sttaus;
  }

  async getSizeOfFirstDayOfWeekCheckbox() {
    const checkboxes = await this.page
      .locator(
        `//div[contains(@class, 'TimeSettingsPopoverForm')][text()='Days of week']/following-sibling::div/descendant::input[contains(@class,'inputCheckboxChecked')]`,
      )
      .count();
    return checkboxes;
  }

  async clickOnFieldToggleCheckbox(field: string) {
    // Locate the checkbox for 'Class' using the text label
    const checkbox = this.page.locator(
      `//div[contains(@class, 'TimeSettingsPopoverForm')] / descendant::span[text()='${field}'] / ancestor::label / descendant::input`,
    );

    // Ensure the checkbox is found before attempting to click
    await expect(checkbox).toBeVisible();

    // Click on the checkbox to check it, if not already checked
    await checkbox.click();
  }

  async clickSettingsIcon() {
    if (
      await this.page
        .getByRole('button', { name: 'Time entry settings' })
        .isVisible({ timeout: 30000 })
    ) {
      await this.page
        .getByRole('button', { name: 'Time entry settings' })
        .click({ force: true });
    }
  }

  async columnSelectionDeSelectionLogic(field: string) {
    let retries = 0;
    const maxRetries = 5;
    while (
      !(await this.page
        .getByRole('button', { name: LABELS.SaveSettings, exact: true })
        .isVisible({ timeout: 10000 })) &&
      retries < maxRetries
    ) {
      await this.clickSettingsIcon();
      await this.page.waitForTimeout(1000);
      retries++;
    }
    if (await this.isFieldFindInPopover(field)) {
      // if (field != LABELS.Sunday && await this.getSizeOfFirstDayOfWeekCheckbox()>1)
      // {
      await this.clickOnFieldToggleCheckbox(field);
      await this.scrollTillButtonNotFound(LABELS.SaveSettings);
      await this.clickButton(LABELS.SaveSettings);
      await this.page.waitForTimeout(2000);
      try {
        await expect(
          this.page.getByRole('button', {
            name: LABELS.SaveSettings,
            exact: true,
          }),
        ).not.toBeVisible({ timeout: 2000 });
      } catch (error) {
        if (
          field == LABELS.Sunday &&
          (await this.getSizeOfFirstDayOfWeekCheckbox()) == 0
        ) {
          await this.clickOnFieldToggleCheckbox(field);
          await this.scrollTillButtonNotFound(LABELS.SaveSettings);
          await this.clickButton(LABELS.SaveSettings);
          await this.page.waitForTimeout(2000);
          await expect(
            this.page.getByRole('button', {
              name: LABELS.SaveSettings,
              exact: true,
            }),
          ).not.toBeVisible();
        }
      }
      // }
    } else {
      try {
        await this.clickButton(LABELS.SaveSettings);
        await this.page.waitForTimeout(2000);
        await expect(
          this.page.getByRole('button', {
            name: LABELS.SaveSettings,
            exact: true,
          }),
        ).not.toBeVisible();
      } catch {
        console.log('Settings window is not opened');
      }
    }
  }

  async columnSelectionDeSelectionLogicForWeekDays(field: string) {
    let retries = 0;
    const maxRetries = 5;
    while (
      !(await this.page
        .getByRole('button', { name: LABELS.SaveSettings, exact: true })
        .isVisible({ timeout: 10000 })) &&
      retries < maxRetries
    ) {
      await this.clickSettingsIcon();
      await this.page.waitForTimeout(1000);
      retries++;
    }
    if (await this.isFieldFindInPopover(field)) {
      await this.clickOnFieldToggleCheckbox(field);
      await this.scrollTillButtonNotFound(LABELS.SaveSettings);
      await this.clickButton(LABELS.SaveSettings);
      await this.page.waitForTimeout(2000);
    } else {
      try {
        await this.clickButton(LABELS.SaveSettings);
        await this.page.waitForTimeout(2000);
      } catch {
        console.log('Settings window is not opened');
      }
    }
  }

  async columnsAndWeekdayPopoverPopulate(field: string) {
    await this.clickSettingsIcon();
    await this.columnSelectionDeSelectionLogic(field);
  }

  async columnsAndWeekdayPopoverPopulateForWeekdaysError(field: string) {
    await this.clickSettingsIcon();
    await this.columnSelectionDeSelectionLogicForWeekDays(field);
  }

  async validateRelevantFieldsSectionIsNotDIsplayed() {
    await expect(
      this.page.getByRole('button', { name: 'Time entry settings' }),
    ).toBeVisible({ timeout: 30000 });

    let retries = 0;
    const maxRetries = 5;
    while (
      !(await this.page
        .getByRole('button', { name: LABELS.SaveSettings, exact: true })
        .isVisible({ timeout: 10000 })) &&
      retries < maxRetries
    ) {
      await this.clickSettingsIcon();
      await this.page.waitForTimeout(1000);
      retries++;
    }
    await expect(
      this.page.getByText('Select the relevant fields to display'),
    ).not.toBeVisible();
    await this.clickButton(LABELS.SaveSettings);
    await this.page.waitForTimeout(2000);
  }

  async labelLocator(label: string, position: number) {
    return this.page.locator(
      `(//span[text()='${label}'] / ancestor::label / descendant::input)[${position}]`,
    );
  }

  async locatorEnabled(label: string, position: number) {
    return this.labelLocator(label, position);
  }

  async durationWithValue(position: number, value: string) {
    const durationArr = this.page.locator(
      `//tr[${position}]//input[contains(@aria-label,"${LABELS.Duration}")]`,
    );
    const numberOfDays = await durationArr.count();

    for (let i = 0; i < numberOfDays; i++) {
      const hours = durationArr.nth(i).inputValue();
      expect(hours).toBe(value);
    }
  }

  async checkATARowIsEmpty(position: number): Promise<boolean> {
    await this.page.waitForTimeout(2000);
    let isEmpty = true;

    if (await this.isVisibile(LABELS.Customers, position)) {
      const customerVal = await this.getDropDownVal(LABELS.Customers, position);
      isEmpty = isEmpty && customerVal === '';
    }
    if (await this.isVisibile(LABELS.Class, position)) {
      const classVal = await this.getDropDownVal(LABELS.Class, position);
      isEmpty = isEmpty && classVal === '';
    }
    if (await this.isVisibile(LABELS.Class, position)) {
      const classVal = await this.getDropDownVal(LABELS.Class, position);
      isEmpty = isEmpty && classVal === '';
    }
    if (await this.isVisibile(LABELS.Service, position)) {
      const serviceVal = await this.getDropDownVal(LABELS.Service, position);
      isEmpty = isEmpty && serviceVal === '';
    }
    if (await this.isVisibile(LABELS.Location, position)) {
      const locationVal = await this.getDropDownVal(LABELS.Location, position);
      isEmpty = isEmpty && locationVal === '';
    }
    if (
      (await this.isVisibile(LABELS.PayType, position)) &&
      !(await this.isVisibile(LABELS.NoPayType, position))
    ) {
      const payTypeVal = await this.getDropDownVal(LABELS.PayType, position);
      isEmpty = isEmpty && payTypeVal === '';
    }

    const durationEmpty = await this.isDurationRowsEmpty(position);
    isEmpty = isEmpty && durationEmpty;

    const notesVal = await this.getNotesVal(position);
    isEmpty = isEmpty && notesVal === '';

    return isEmpty;
  }

  getDropDownVal = async (label: string, position: number) => {
    let retries = 0;
    let selector;

    selector = this.page
      .locator(
        `(//span[text()='${label}'] / ancestor::label / descendant::input)[${position}]`,
      )
      .getAttribute('value');

    return selector;

    /*

    let retries = 0;
    let selector;

    selector = this.page
      .locator(
        `(//span[text()='${label}'] / ancestor::label / descendant::input)[${position}]`
      )
      .getAttribute('value');

    return selector;

    /*

    return this.page
      .locator(
        `(//span[text()='${label}'] / ancestor::label / descendant::input)[${position}]`
      )
      .getAttribute('value');
      */
  };

  async isDurationRowsEmpty(position: number): Promise<boolean> {
    const durationArr = this.page.locator(
      `//tr[${position}]//input[contains(@aria-label,"${LABELS.Duration}")]`,
    );
    const numberOfDays = await durationArr.count();
    let isEmpty = true;

    for (let i = 0; i < numberOfDays; i++) {
      const hoursInput = durationArr.nth(i);
      const hoursValue = await hoursInput.inputValue();
      isEmpty = isEmpty && hoursValue === '';
      if (!isEmpty) break;
    }

    return isEmpty; // Return the collective result.
  }

  async getNotesVal(position: number) {
    return this.page
      .locator(`//tr[${position}]//descendant::textarea`)
      .inputValue();
  }

  async validateBillRateValue(position: number, value: string) {
    const billAmount = await this.page
      .locator(`//tr[${position}]//input[@aria-label='Bill rate']`)
      .inputValue();
    expect(billAmount).toBe(value);
  }

  async getName() {
    const name = await this.page.getByLabel('Name').getAttribute('value');
    if (name == '' || name == null) {
      console.log('Inside getName method if');
      await this.timeForDropdown(LABELS.timeFor);
      await this.chooseNameOption();
    }
  }

  async toggleCheckboxFieldIsUnSelected(field: string) {
    // Locate the checkbox for 'Class' using the text label
    const checkbox = this.page.locator(
      `//div[contains(@class, 'TimeSettingsPopoverForm')] / descendant::span[text()='${field}'] / ancestor::label / descendant::input`,
    );
    if (
      await this.page
        .locator(
          `//div[contains(@class, 'TimeSettingsPopoverForm')] / descendant::span[text()='${field}'] / ancestor::label`,
        )
        .isVisible({ timeout: 2000 })
    ) {
      // Ensure the checkbox is found before attempting to click
      await expect(checkbox).not.toBeChecked();
    }
  }

  async toggleCheckboxFieldSelected(field: string) {
    // Locate the checkbox for 'Class' using the text label
    const checkbox = this.page.locator(
      `//div[contains(@class, 'TimeSettingsPopoverForm')] / descendant::span[text()='${field}'] / ancestor::label / descendant::input`,
    );
    if (
      await this.page
        .locator(
          `//div[contains(@class, 'TimeSettingsPopoverForm')] / descendant::span[text()='${field}'] / ancestor::label`,
        )
        .isVisible({ timeout: 2000 })
    ) {
      // Ensure the checkbox is found before attempting to click
      await expect(checkbox).toBeChecked();
    }
  }

  getAbbreviatedDay(dayName: string) {
    const dayMap: any = {
      Monday: 'Mon',
      Tuesday: 'Tue',
      Wednesday: 'Wed',
      Thursday: 'Thu',
      Friday: 'Fri',
      Saturday: 'Sat',
      Sunday: 'Sun',
    };

    return dayMap[dayName];
  }

  async isTableHeaderVisible(header: string) {
    const abbreviatedDay = await this.getAbbreviatedDay(header);
    let isVisibleHeader;
    try {
      isVisibleHeader = await this.page
        .locator(`th >> text=/^${abbreviatedDay} .*/`)
        .isVisible();
    } catch {
      isVisibleHeader = false;
    }

    // Expect that the element with "Mon" is visible
    return isVisibleHeader;
  }

  async validateNameFieldIsRequire() {
    return expect(
      await this.page.locator(
        `//div[@placeholder='Select name'] / descendant::span[text()='This field is required']`,
      ),
    ).toBeVisible();
  }

  async generateRandomString(length: number) {
    let result = ' ';
    const charactersLength = CHARACTERS.length;
    for (let i = 0; i < length; i += 1) {
      if (i === 5) {
        result += ' ';
      } else {
        result += CHARACTERS.charAt(
          Math.floor(Math.random() * charactersLength),
        );
      }
    }

    return result;
  }

  async isDialogVisible(dialogType: string) {
    return expect(
      await this.page.locator(
        `//*[contains(@data-testid, 'drawerTitle') and contains(text(), ${dialogType})]`,
      ),
    ).toBeVisible({ timeout: 60000 });
  }

  async locationDialogHeader(dialogType: string) {
    return expect(
      await this.page.locator(
        `//div[contains(@class, 'Drawer')] / descendant::*[text()='${dialogType}']`,
      ),
    ).toBeVisible({ timeout: 60000 });
  }

  async isFieldFilled(field: string) {
    return expect(
      await this.page.locator(`// descendant::input[@aira-label='${field}']`),
    ).not.toBe('');
  }

  async isRowFieldFilled(field: string) {
    return expect(
      await this.page.locator(`// descendant::input[@aria-label='${field}']`),
    ).not.toBe('');
  }

  async isLocationRowFieldFilled(field: string) {
    return expect(
      await this.page.locator(`// descendant::input[@name='${field}']`),
    ).not.toBe('');
  }

  async locationDrawerSaveButton() {
    await this.page
      .locator(`//button[@data-cy="location-drawer-save-button"]`)
      .click();
  }

  async serviceDrawerNameField() {
    return expect(
      await this.page.locator(`//input[@data-cy="itemDrawerName"]`),
    ).not.toBe('');
  }

  async serviceDrawerHeader() {
    return expect(
      await this.page.locator(
        `//div[contains(@class, 'Drawer')] /descendant::strong[contains(text(),'service')]`,
      ),
    ).toBeVisible();
  }

  async serviceDrawerSaveButtonClick() {
    // await this.page.locator(`//button[@data-cy="itemDrawerSaveBtn"]`).click();

    await this.page
      .getByRole('button', { name: 'Save and close', exact: true })
      .click();
  }

  async clickSaveDialog() {
    // await expect(async () => {
    //   await expect(this.page.locator(`//button[@aria-label="Save"]`)).toBeVisible();
    //   await this.page.locator(`//button[@aria-label="Save"]`).click({force: true});
    //   await expect(this.page.locator(`//button[@aria-label="Save"]`)).not.toBeVisible({timeout: 500});
    // }).toPass({intervals: [500, 1000, 2000], timeout: 10000});
    await expect(
      this.page.locator(`//button[@aria-label="Save"]`),
    ).toBeVisible();
    // await this.page.locator(`//button[@aria-label="Save"]`).click();

    let retires = 0;
    const maxcount = 3;

    while (
      (await this.page.locator(`//button[@aria-label="Save"]`).isVisible()) &&
      (await this.page.locator(`//button[@aria-label="Save"]`).isEnabled()) &&
      retires < maxcount
    ) {
      try {
        await this.page.locator(`//button[@aria-label="Save"]`).click();
      } catch {
        console.log('Dialog save button is not visible');
      }
      retires++;
      await this.page.waitForTimeout(10000);
    }

    await expect(
      this.page.locator(`//button[@aria-label="Save"]`),
    ).not.toBeVisible({ timeout: 5000 });
  }

  async clickOnCustomerSaveButton() {
    await this.page
      .getByTestId('contact-drawer')
      .getByRole('button', { name: 'Save' })
      .click({ force: true });
  }

  async emptyNameFieldData(field: string, text: string) {
    const fieldInputLocator = this.page.locator(
      `//span[text()='${field}'] /ancestor::label /descendant::input`,
    );

    await fieldInputLocator.fill(''); // Clear the input
    await this.page.waitForTimeout(2000);
    await fieldInputLocator.fill(text);
    await this.page.waitForTimeout(2000);
  }

  async fillTheTimeForDropdown(field: string, text: string) {
    await this.emptyNameFieldData(field, text);

    let retries = 0;
    while (retries < 3) {
      await this.page
        .locator(
          `//span[text()='${field}'] /ancestor::label /descendant::input`,
        )
        .click();

      try {
        // wait for dropdown options to appear
        await this.page.waitForSelector('[role=option]', {
          state: 'attached',
          timeout: 1000,
        });
        return; // success
      } catch {
        retries += 1;
      }
    }
  }

  async emptyFormRowFieldData(field: string, position: number, text: string) {
    const fieldInputLocator = await this.page.locator(
      `(//span[contains(text(), '${field}')] / ancestor::label / descendant::input)[${position}]`,
    );

    await fieldInputLocator.fill(''); // Clear the input
    await this.page.waitForTimeout(2000);
    await fieldInputLocator.fill(text);
    await this.page.waitForTimeout(2000);
  }

  async fillTheDropDown(field: string, position: number, text: string) {
    await this.emptyFormRowFieldData(field, position, text);

    let retries = 0;
    while (retries < 3) {
      await this.page
        .locator(
          `(//span[contains(text(), '${field}')] / ancestor::label / descendant::input)[${position}]`,
        )
        .click();

      try {
        // wait for dropdown options to appear
        await this.page.waitForSelector('[role=option]', {
          state: 'attached',
          timeout: 1000,
        });
        return; // success
      } catch {
        retries += 1;
      }
    }
  }

  async isFormRowFieldFilled(field: string, position: number) {
    return await expect(
      this.page.locator(
        `(//span[contains(text(), '${field}')] / ancestor::label / descendant::input)[${position}]`,
      ),
    ).not.toBeEmpty();
  }

  stringDate = async () => {
    await this.page
      .locator(
        `//span[text()='Select a week'] / ancestor::label / descendant::input`,
      )
      .isVisible();

    return await this.page
      .locator(
        `//span[text()='Select a week'] / ancestor::label / descendant::input`,
      )
      .getAttribute('value');
  };

  async selectWeekDropdown(label: string, weekNo: number) {
    await this.page.waitForLoadState('load');
    const dateString = await this.stringDate();

    if (dateString) {
      const [startDate, endDate] = dateString.split(' to ');
      const startDateTime = new Date(startDate);
      const endDateTime = new Date(endDate);
      const weekNumber = weekNo; // pass the number of weeks after the current week

      const nextWeekStartDateTime = new Date(
        startDateTime.getTime() + weekNumber * 7 * 24 * 60 * 60 * 1000,
      );
      const nextWeekEndDateTime = new Date(
        endDateTime.getTime() + weekNumber * 7 * 24 * 60 * 60 * 1000,
      );

      const nextWeekText = `${nextWeekStartDateTime.toLocaleDateString(
        'en-US',
        { month: '2-digit', day: '2-digit', year: 'numeric' },
      )} to ${nextWeekEndDateTime.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      })}`;
      await this.page.waitForTimeout(2000);
      // console.log("nextWeekText===="+nextWeekText);

      let clickRetries = 0;
      const maxClickRetries = 2;
      while (clickRetries < maxClickRetries) {
        try {
          await this.page
            .locator(
              `//span[text()='Select a week'] / ancestor::label / descendant::input`,
            )
            .click({ force: true, timeout: 1000 });
          break; // If click succeeds, exit the loop
        } catch (error) {
          clickRetries++;
          if (clickRetries === maxClickRetries) {
            throw error; // If all retries failed, throw the error
          }
          await this.page.waitForTimeout(1000); // Wait before retrying
        }
      }

      let optionRetries = 0;
      const maxOptionRetries = 2;
      while (optionRetries < maxOptionRetries) {
        try {
          await this.page
            .getByRole('option', { name: nextWeekText })
            .isVisible();
          await this.page
            .getByRole('option', { name: nextWeekText })
            .click({ timeout: 1000 });
          break; // If both operations succeed, exit the loop
        } catch (error) {
          optionRetries++;
          if (optionRetries === maxOptionRetries) {
            throw error; // If all retries failed, throw the error
          }
          await this.page.waitForTimeout(1000); // Wait before retrying
        }
      }
    } else {
      console.error('Failed to retrieve string date');
    }
  }

  requiredField = async (label: string) => {
    return this.page.locator(
      `//div[@placeholder='${label}'] / descendant::span[text()='This field is required']`,
    );
  };

  async requireFieldValidation(label: string) {
    expect((await this.requiredField(label)).isVisible());
  }

  async containsWeekDay(label: string) {
    const weekDayLocator = this.page.locator(`//th[contains(text(), 'Sun')]`);
    await weekDayLocator.waitFor({ state: 'visible' });
  }

  async validateDurationTextValue(position: number, value: string) {
    const durationArr = this.page.locator(
      `//tr[${position}]//input[contains(@aria-label,"${LABELS.Duration}")]`,
    );
    const numberOfDays = await durationArr.count();

    for (let i = 0; i < numberOfDays; i += 1) {
      const hours = durationArr.nth(i);
      await expect(hours).toHaveValue(value);
    }
  }

  async weekDaysDeselection() {
    await this.clickSettingsIcon();
    await this.deSelectWeekDays();
    // await this.page.waitForTimeout(5000);
    await this.clickButton(LABELS.SaveSettings);
    // await this.page.waitForTimeout(2000);
  }

  async deSelectWeekDays() {
    const days = [
      LABELS.Sunday,
      LABELS.Monday,
      LABELS.Tuesday,
      LABELS.Wednesday,
      LABELS.Thursday,
      LABELS.Friday,
      LABELS.Saturday,
    ];

    for (const day of days) {
      if (await this.isFieldFindInPopover(day)) {
        await this.clickOnFieldToggleCheckbox(day);
      }
    }

    await this.scrollTillButtonNotFound(LABELS.SaveSettings);
  }

  async billableIconTooltip(position: number) {
    return this.page.locator(
      `//tr[${position}] / descendant::*[contains(@aria-describedby, "qbds-tooltip") and @fill='none']`,
    );
  }

  async enterCustomOddDuration(
    position: number,
    durationStart: number,
    value: string,
  ) {
    const durationArr = this.page.locator(
      `//tr[${position}]//input[contains(@aria-label,"${LABELS.Duration}")]`,
    );
    const numberOfDays = await durationArr.count();

    for (let i = durationStart; i < numberOfDays; i++) {
      if (i % 2 === 1) {
        const hours = durationArr.nth(i);
        await hours.fill(value);
      }
    }
  }

  async enterCustomEvenDuration(
    position: number,
    durationStart: number,
    value: string,
  ) {
    const durationArr = this.page.locator(
      `//tr[${position}]//input[contains(@aria-label,"${LABELS.Duration}")]`,
    );
    const numberOfDays = await durationArr.count();

    for (let i = durationStart; i < numberOfDays; i++) {
      if (i % 2 === 0) {
        const hours = durationArr.nth(i);
        await hours.fill(value);
      }
    }
  }

  async enterDurationWithValue(position: number, value: string) {
    const durationArr = this.page.locator(
      `//tr[${position}]//input[contains(@aria-label,"${LABELS.Duration}")]`,
    );
    const numberOfDays = await durationArr.count();

    for (let i = 0; i < numberOfDays; i += 1) {
      const hours = durationArr.nth(i);
      await hours.fill(value);
    }
  }

  async clickCustomDropdownOption(n: number) {
    const isVisib = await this.page
      .locator(`(//ul[@role="listbox"]/li)[${n}]`)
      .isVisible();
    if (!isVisib) {
      await this.page
        .locator(`(//ul[@role="listbox"]/li)[${n}]`)
        .scrollIntoViewIfNeeded();
    }
    await this.page.locator(`(//ul[@role="listbox"]/li)[${n}]`).click();
  }

  async validateMaxlength(position: number): Promise<boolean> {
    const isVisible = await this.page
      .locator(
        `//tr[${position}] / descendant::span[text()='Exceeds max length']`,
      )
      .isVisible();
    return isVisible;
  }

  // below items for Features Utils
  async selectAddNewOptionFromDropDown() {
    await this.page.getByRole('option', { name: 'add new item' }).click();
  }

  async checkEmployeeDrawerDisplayed() {
    await expect(this.page.locator('(//div[@role="dialog"])[2]')).toBeVisible();
  }

  async checkClassDialogDrawerDisplayed() {
    await expect(
      this.page.getByRole('dialog', { name: 'New Class' }).locator('section'),
    ).toBeVisible();
  }

  async selectContactType(option: string) {
    await expect(this.page.getByLabel(LABELS.ContactType)).toBeVisible();
    await this.page.waitForTimeout(1000);
    await this.page.getByLabel(LABELS.ContactType).click();
    await this.page.getByRole('option', { name: option }).click();
  }

  async selectServiceItem(position: number, option: string) {
    await this.page.waitForTimeout(1000);
    await this.page
      .locator(
        `//tr[${position}]//span[text()='Service']/following-sibling::div/div`,
      )
      .click();
    await this.page.getByText(`${option}`).click();
  }

  async selectCustomer(position: number, option: string) {
    await this.page.waitForTimeout(1000);
    await this.page
      .locator(
        `//tr[${position}]//span[text()='Customers']/following-sibling::div/div`,
      )
      .click();
    await this.page.locator(`//span/b[text()='${option}']`).click();
  }

  async selectEmployeeName(option: string) {
    await this.page.waitForTimeout(1000);
    await this.page
      .locator(`//span[text()='Name']/following-sibling::div/div`)
      .click();
    await this.page.locator(`//span[text()='${option}']`).click();
  }

  async addNewClassName() {
    const className = this.page.getByLabel(LABELS.ClassName);
    await className.click();
    await className.fill(testData.randomClassName);
    return testData.randomClassName;
  }

  async clickOnClassDrawerSaveButton() {
    await this.page
      .getByRole('dialog', { name: 'New Class' })
      .getByRole('button', { name: 'Save' }).isVisible;
    await this.page
      .getByRole('dialog', { name: 'New Class' })
      .getByRole('button', { name: 'Save' })
      .click({ timeout: 3000 });
  }

  async fillMandatoryFieldsForEmployee() {
    const randomString = Math.random().toString(36).substring(2, 8);
    const lastName = `Emp${randomString}`;
    const firstName = this.page.getByLabel(LABELS.FirstName);
    const lastNameField = this.page.getByLabel(LABELS.LastName);
    await firstName.click();
    await firstName.fill('Test');
    await lastNameField.click();
    await lastNameField.fill(testData.randomLastName);
    const finalName = `Test ${testData.randomLastName}`;
    return finalName;
  }

  async clickOnEmployeeDialogSaveButton() {
    await this.page
      .getByRole('dialog', { name: 'Employee' })
      .getByRole('button', { name: 'Save' })
      .click();
  }

  async waitUntilEmployeeDrawerDialogClosed() {
    await this.page
      .getByRole('dialog', { name: 'Employee' })
      .waitFor({ state: 'hidden', timeout: 30000 });
  }

  async waitUntilVendorDrawerDialogClosed() {
    await this.page
      .getByRole('dialog', { name: 'Vendor' })
      .locator('div')
      .filter({
        hasText: 'Contact typeName and contactCompany nameVendor display name',
      })
      .first()
      .waitFor({ state: 'hidden', timeout: 30000 });
  }

  async validateVendorDialog() {
    await expect(
      this.page.getByTestId('drawerTitle').getByText('Vendor'),
    ).toBeVisible();
  }

  async fillMandatoryFieldsForVendor() {
    const companyNameField = this.page.getByLabel(LABELS.CompanyName);
    //await companyNameField.click();
    await companyNameField.fill(`Comp${testData.randomCompanyName}`);
    return `Comp${testData.randomCompanyName}`;
  }

  async clickOnVendorSaveButton() {
    await this.page.locator(`//button[@aria-label='Save']`).click();
  }

  async validateGivenNameDisplayedUnderNameLabel(name: string) {
    const displayedName = await this.page
      .locator(`//*[text()='Name']/following::input[1]`)
      .getAttribute('value');
    if (displayedName?.includes(name)) {
      expect(displayedName).toContain(name);
    } else {
      await this.timeForDropdown(LABELS.timeFor);
      await this.clickCustomDropdownOnGivenOption(name);
      await this.page.waitForTimeout(2000);
    }
  }

  async validateGivenClassDisplayedUnderClassLabel(
    label: string,
    name: string,
  ) {
    let retries = 2;
    let interval = 2000; // Time interval in milliseconds

    for (let i = 0; i <= retries; i++) {
      const displayedClassName = await this.page
        .locator(
          `(//span[contains(text(), '${label}')] / ancestor::label / descendant::input)[1]`,
        )
        .getAttribute('value');

      if (displayedClassName && displayedClassName.includes(name)) {
        expect(displayedClassName).toContain(name);
        return;
      }

      if (i < retries) {
        await this.page.waitForTimeout(interval);
        return;
      }
    }
  }

  async waitUntilClassDrawerDialogClosed() {
    await this.page
      .getByRole('dialog', { name: 'New Class' })
      .waitFor({ state: 'hidden', timeout: 10000 });
  }

  async checkNewlyAddedOptionDisplayedUnderDropdown(
    option: string,
  ): Promise<boolean> {
    try {
      await expect(
        this.page.getByRole('option', { name: option }),
      ).toBeVisible();
      return true;
    } catch {
      return false;
    }
  }

  async clickOnCancelButton() {
    await this.page.getByRole('button', { name: 'Cancel' }).click();
  }

  async clickOnYesButton() {
    await this.page.getByRole('button', { name: 'Yes' }).click();
  }

  async clickOnClassCloseOption() {
    await this.page
      .getByRole('dialog', { name: 'New Class' })
      .getByRole('button', { name: 'Close' })
      .click();
  }

  async validateErrorMessageDisplayed() {
    await expect(
      this.page.getByText('This field is required').first(),
    ).toBeVisible();
  }

  async clickCustomDropdownOnGivenOption(option: string) {
    await this.page.waitForTimeout(1000);
    await this.page.getByRole('option').nth(1).hover();
    await this.page.waitForTimeout(1000);
    // Scroll to last element
    for (let i = 0; i < 20; i++) {
      await this.page.mouse.wheel(0, 1000);
      await this.page.waitForTimeout(500);
      if (
        await this.page
          .getByRole('option', { name: option })
          .first()
          .isVisible()
      ) {
        break;
      }
    }
    // Try to find and click the option
    await this.page
      .getByRole('option', { name: option })
      .first()
      .click({ force: true, timeout: 3000 });
  }

  async chooseNameOption(index = 1) {
    await this.page.getByRole('option').nth(index).click();
  }

  async clickCustomDropdownOnGivenFirstOption(option: string) {
    await this.page
      .getByRole('option', { name: option.trim(), exact: true })
      .click({ force: true });
  }

  async validateOptionDisplayedUnderGivenLabelNotNone(label: string) {
    const displayedClassName = await this.page
      .locator(
        `(//span[contains(text(), '${label}')] / ancestor::label / descendant::input)[1]`,
      )
      .getAttribute('value');
    expect(displayedClassName).not.toBe('');
  }

  async validatePopupDisplayedWhenNoChangesSaved(popupText: string) {
    const popupLocator = this.page
      .getByText(popupText)
      .or(
        this.page.getByText(
          `If you select a different employee or supplier, you\'ll lose the data you entered`,
        ),
      );
    await expect(popupLocator).toBeVisible();
  }

  async getFirstDayOfWeekDisplayedOnHeader() {
    const firstWeekDay = await this.page.locator('//tr[1]/th[2]').textContent();
    const requiredWeekDay = firstWeekDay?.split(' ')[0];
    return requiredWeekDay;
  }

  async closeTimeSheetTrouser() {
    await this.page
      .getByRole('banner')
      .getByRole('button', { name: 'Close' })
      .click();
  }

  async getBillableAmountWithCurrencySymbol() {
    return await this.page
      .locator(`//tr[1]/th[contains(text(),'Billable')]/div`)
      .textContent();
  }

  async getGivenFieldValueDisplayed(label: string) {
    const displayedData = await this.page
      .locator(
        `(//span[contains(text(), '${label}')] / ancestor::label / descendant::input)[1]`,
      )
      .getAttribute('value');
    return displayedData;
  }

  async getTotalDisplayed() {
    return this.page
      .locator(`//th[contains(text(), 'Total')] /div`)
      .textContent();
  }

  async getNumberOfDurationDisplayedForRow(position: number) {
    const durationArr = this.page.locator(
      `//tr[${position}]//input[contains(@aria-label,"${LABELS.Duration}")]`,
    );
    const numberOfDays = await durationArr.count();
    return numberOfDays;
  }

  async columnSelectionDeSelectionLogicForDuration(field: string) {
    const arrayWeekDay = field.split(',');
    for (const item of arrayWeekDay) {
      if (await this.isFieldFindInPopover(item)) {
        await this.clickOnFieldToggleCheckbox(item);
        await this.page.waitForTimeout(1000);
      }
    }
    await this.scrollTillButtonNotFound(LABELS.SaveSettings);
    await this.clickButton(LABELS.SaveSettings);
    await this.page.waitForTimeout(2000);
  }

  async validateCurrentWeekSelectedIsInCurrentDate() {
    const dateString = await this.stringDate();
    if (dateString) {
      const [startDate, endDate] = dateString.split(' to ');
      const startDateTime = new Date(startDate);
      const endDateTime = new Date(endDate);
      const currentDate = this.getCurrentdate();
      const currentDatereq = new Date(currentDate);
      const isWithinRange =
        currentDatereq >= startDateTime && currentDatereq <= endDateTime;
      expect(isWithinRange).toBeTruthy();
    } else {
      expect(false).toBeTruthy();
      console.error('Failed to retrieve string date');
    }
  }

  async validateGivenNameDisplayedUnderGivenLabel(
    name: string,
    field: string,
    position: number,
  ) {
    const displayedName = await this.page
      .locator(`(//*[text()='Customers']/following::input[1])[${position}]`)
      .getAttribute('value');
    if (displayedName?.includes(name)) {
      expect(displayedName).toContain(name);
    } else {
      await this.openRowDropdown(field, position);
      await this.clickCustomDropdownOnGivenOption(name);
    }
  }

  async validateGivenNameDisplayedUnderGivenLabelIfNotSelect(
    name: string,
    field: string,
    position: number,
  ) {
    const displayedName = await this.page
      .locator(`(//*[text()='${field}']/following::input[1])[${position}]`)
      .getAttribute('value');
    if (displayedName?.includes(name)) {
      expect(displayedName).toContain(name);
    } else {
      await this.openRowDropdown(field, position);
      await this.page
        .locator(
          `(//span[contains(text(), '${field}')] / ancestor::label / descendant::input)[${position}]`,
        )
        .fill(name);
      //await this.clickCustomDropdownOnGivenFirstOption(name);
    }
  }

  getCurrentdate() {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const year = today.getFullYear();
    return `${month}/${day}/${year}`;
  }

  async checkNoAccess() {
    await expect(this.page.getByText('We’re sorry!')).toBeVisible();
    await expect(
      this.page.getByText('You don’t have access rights to view this data.'),
    ).toBeVisible();
  }

  async validateDrawerVisibility() {
    await expect(this.page.getByTestId('drawerTitle')).toBeVisible({
      timeout: 20000,
    });
    return await this.page.getByTestId('drawerTitle').isVisible();
  }

  async refreshScreen() {
    await this.page.reload();
  }

  // below items for Features Utils
  async validateAddNewOptionFromDropDownNotDisplayed() {
    await expect(
      this.page.getByRole('option', { name: 'add new item' }),
    ).not.toBeVisible();
  }

  async validateAddNewOptionIsNotAvailableForGivenField(field: string) {
    await this.navigateToWeeklyTime();
    await this.openRowDropdown(field, 1);
    await this.validateAddNewOptionFromDropDownNotDisplayed();
  }

  async validateAddNewOptionIsNotAvailableForNameField(field: string) {
    await this.navigateToWeeklyTime();
    await this.timeForDropdown(field);
    await this.validateAddNewOptionFromDropDownNotDisplayed();
  }

  async validateDontHavePermissionToupdateCompanySettings() {
    await expect(
      this.page
        .getByText('You do not have access rights to edit this information.')
        .or(this.page.getByText(`We’re sorry`))
        .or(
          this.page.getByText(
            `We're sorry, we can't find the page you requested.`,
          ),
        ),
    ).toBeVisible({ timeout: 10000 });
  }

  async clickOnPrintOption() {
    await this.page.getByRole('button', { name: 'Print time table' }).click();
  }

  async validateGivenFieldNotVisible(field: string) {
    await this.navigateToWeeklyTime();
    const status = await this.isVisibile(field, 1);
    await expect(status).toBeFalsy();
  }

  async validateDashboardPageOrGetStartedPage() {
    try {
      await expect(
        this.page
          .locator(`//button[@data-id='settings']`)
          .or(this.page.locator(`//a[@aria-label='QuickBooks Landing Page']`))
          .or(
            this.page.getByRole('heading', {
              name: 'One place to run and grow',
            }),
          ),
      ).toBeVisible();
    } catch {
      console.log('no navigation window found');
    }
  }

  async selectSpecificWeekFromDropdown(label: string, weekNo: number) {
    await this.page.waitForLoadState('load');
    const dateString = await this.stringDate();

    if (dateString) {
      // Extract start date from the provided range
      const [startDateStr, endDateStr] = dateString.split(' to ');
      const startDate = new Date(startDateStr.split('/').reverse().join('-'));

      // Compute the start of the next week range
      const nextStartDate = new Date(startDate);
      nextStartDate.setDate(startDate.getDate() + weekNo * 7);

      // Compute the end of the next week range
      const nextEndDate = new Date(nextStartDate);
      nextEndDate.setDate(nextStartDate.getDate() + 6);

      // Format the new date range
      const formatDate = (date: Date) =>
        `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
          .toString()
          .padStart(2, '0')}/${date.getFullYear()}`;

      const nextWeekText = `${formatDate(nextStartDate)} to ${formatDate(
        nextEndDate,
      )}`;
      await this.page.waitForTimeout(2000);

      // Click dropdown and select the calculated week
      await this.page
        .locator(
          `//span[text()='Select a week'] / ancestor::label / descendant::input`,
        )
        .click({ force: true, timeout: 1000 });

      await this.page.getByRole('option', { name: nextWeekText }).click();
    } else {
      console.error('Failed to retrieve string date');
    }
  }

  async validateFieldNotVisible(field: string) {
    const isVisible = await this.isVisibile(field, 1);
    await expect(isVisible).toBeFalsy();
  }
}

export { WeeklyTimeActivity };
