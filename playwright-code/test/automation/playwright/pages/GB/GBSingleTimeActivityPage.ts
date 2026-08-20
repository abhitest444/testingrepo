import { Page, expect } from '@playwright/test';
import gotoWithAuthSession from '../../gotoWithAuthSession';
import {
  LABELS,
  testData,
  UNSAVED_CHANGES_MODAL_BASE_XPATH,
} from '../../utils';
import TimeEntriesPage from '../TimeEntriesPage';
// import { matchTeamMemberQueryResponse, matchTimeEntryBatchSaveResponse, OIGQL_URL_PATTERN, TIME_TRACKING_URL_PATTERN, waitForResponseWithURLandBody } from './TimeTrowser';

export const TIME_TRACKING_URL_PATTERN =
  /https:\/\/qb-time-tracking.*\.api\.intuit\.com/;

export const CERES_DAS_URL_PATTERN = /https:\/\/ceres-das.*\.api\.intuit\.com/;

export const OIGQL_URL_PATTERN =
  /https:\/\/sbseggraphqlorch.*\.api\.intuit\.com\/graphql/;

export const waitForResponseWithURLandBody = async (
  page: Page,
  urlPattern: RegExp,
  respondBodyMatcher: (input: any) => boolean,
): Promise<any | undefined> => {
  const matchedResponse = await page.waitForResponse(async (response) => {
    if (urlPattern.test(response.url()) && response.status() === 200) {
      try {
        const responseBody = await response.json();
        return respondBodyMatcher(responseBody);
      } catch (e) {
        return false;
      }
    }
    return false;
  });

  try {
    const responseBody = await matchedResponse.json();
    return respondBodyMatcher(responseBody) ? responseBody : undefined;
  } catch (e) {
    return undefined;
  }
};

export const matchTeamMemberQueryResponse = (responseBody: any) =>
  responseBody &&
  responseBody.data &&
  responseBody.data.dataAccessContacts &&
  responseBody.data.dataAccessContacts.edges &&
  Array.isArray(responseBody.data.dataAccessContacts.edges) &&
  responseBody.data.dataAccessContacts.edges.length > 0 &&
  responseBody.data.dataAccessContacts.edges[0].node &&
  responseBody.data.dataAccessContacts.edges[0].node.type &&
  (responseBody.data.dataAccessContacts.edges[0].node.type === 'EMPLOYEE' ||
    responseBody.data.dataAccessContacts.edges[0].node.type === 'VENDOR');

export const matchTimeEntrySearchResponse = (responseBody: any) =>
  responseBody &&
  responseBody.data &&
  responseBody.data.timeTrackingTimeEntries &&
  responseBody.data.timeTrackingTimeEntries &&
  // eslint-disable-next-line no-underscore-dangle
  responseBody.data.timeTrackingTimeEntries.__typename ===
    'TimeTracking_TimeEntriesQueryPayload';

export const matchTimeEntryQueryResponse = (responseBody: any) =>
  responseBody &&
  responseBody.data &&
  responseBody.data.timeTrackingTimeEntry &&
  responseBody.data.timeTrackingTimeEntry &&
  responseBody.data.timeTrackingTimeEntry.id;

export const matchTimeEntryCreateResponse = (responseBody: any) =>
  responseBody &&
  responseBody.data &&
  responseBody.data.timeTrackingCreateTimeEntry &&
  responseBody.data.timeTrackingCreateTimeEntry &&
  // eslint-disable-next-line no-underscore-dangle
  responseBody.data.timeTrackingCreateTimeEntry.__typename ===
    'TimeTracking_CreateTimeEntryPayload';

export const matchTimeEntryUpdateResponse = (responseBody: any) =>
  responseBody &&
  responseBody.data &&
  responseBody.data.timeTrackingUpdateTimeEntry &&
  responseBody.data.timeTrackingUpdateTimeEntry &&
  // eslint-disable-next-line no-underscore-dangle
  responseBody.data.timeTrackingUpdateTimeEntry.__typename ===
    'TimeTracking_UpdateTimeEntryPayload';

export const matchTimeEntryDeleteResponse = (responseBody: any) =>
  responseBody &&
  responseBody.data &&
  responseBody.data.timeTrackingDeleteTimeEntry &&
  responseBody.data.timeTrackingDeleteTimeEntry &&
  // eslint-disable-next-line no-underscore-dangle
  responseBody.data.timeTrackingDeleteTimeEntry.__typename ===
    'TimeTracking_DeleteTimeEntryPayload';

export const matchTimeEntryBatchSaveResponse = (responseBody: any) =>
  responseBody &&
  responseBody.data &&
  responseBody.data.timeTrackingBatchManageTimeEntries &&
  responseBody.data.timeTrackingBatchManageTimeEntries &&
  // eslint-disable-next-line no-underscore-dangle
  responseBody.data.timeTrackingBatchManageTimeEntries.__typename ===
    'TimeTracking_BatchManageTimeEntriesPayload';

class SingleTimeActivityPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async validateSTALoaded() {
    const isSTALoaded = await this.page.locator(
      `//*[text()='Single day entry']`,
    );
    return await expect(isSTALoaded).toBeVisible();
  }

  async validateTrowserClosed() {
    await this.page.waitForSelector(`//h1[contains(text(), 'Are you sure')]`, {
      state: 'hidden',
      timeout: 2000,
    });
    await this.page.waitForSelector(`//button / span[text()='Save']`, {
      state: 'hidden',
      timeout: 3000,
    });
    expect(
      this.page.locator(`//*[text()='Single day entry']`),
    ).not.toBeVisible();
    expect(
      this.page.locator(`//div[@aria-label="Intuit QuickBooks Online"]`),
    ).toBeVisible({ timeout: 3000 });
  }

  async fillData(fieldName: string, hours: string) {
    return await this.page.getByLabel(fieldName).fill(hours);
  }

  async navigateToSingleTime(id?: string | null) {
    const timeEntriesPage = new TimeEntriesPage(this.page);
    if (id) {
      await gotoWithAuthSession(this.page, `/app/timeactivity?id=${id}`, {
        waitUntil: 'load',
      });
    } else {
      await gotoWithAuthSession(this.page, `/app/timeactivity?t=s`, {
        waitUntil: 'load',
      });
    }
    await this.page.waitForTimeout(2000);
    await timeEntriesPage.handlePopupsInAnyOrder();
  }

  navigateToWeeklyTime() {
    return gotoWithAuthSession(this.page, `/app/timetracking`);
  }

  getByCss(cssSelector: string) {
    return this.page.locator(cssSelector);
  }

  getField(fieldName: string) {
    return this.page.getByText(fieldName);
  }

  getByLabel(label: string) {
    return this.page.getByLabel(label);
  }

  getByPlaceholder(placeHolder: string) {
    return this.page.getByPlaceholder(placeHolder);
  }

  getByTestId(testId: string) {
    return this.page.getByTestId(testId);
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

  async clickLastDropdownOption() {
    return await this.page.getByRole('option').last().click();
  }

  async clickDropdownOptionForEmployee(optionNumber: number) {
    return await this.page
      .getByRole('option')
      .getByText('Employee', { exact: true })
      .nth(optionNumber)
      .click();
  }

  async clickDropdownOptionForVendor(optionNumber: number) {
    return await this.page
      .getByRole('option')
      .getByText(/^Supplier|Vendor$/i, { exact: true })
      .nth(optionNumber)
      .click();
  }

  toggleCheckbox(label: string) {
    return this.page.getByLabel(label).check();
  }

  clickButton(buttonText: string) {
    return this.page
      .getByRole('button', { name: buttonText, exact: true })
      .click();
  }

  async validateBillRateValue(value: string) {
    const billAmount = await this.page
      .locator(`//input[@aria-label='Bill rate']`)
      .inputValue();
    expect(billAmount).toBe(value);
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

  // Helper method to create a case-insensitive locator with data-testid
  private getCaseInsensitiveTestIdLocator(fieldPattern: string) {
    const lowercase = fieldPattern.toLowerCase();
    return this.page.locator(
      `[data-testid="__textField"][contains(translate(@placeholder, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), "${lowercase}")]`,
    );
  }

  // Helper method to capitalize first letter of a string
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
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

  async closeTooltip() {
    const closeTooltipButton = await this.page.getByRole('button', {
      name: 'Close Tooltip',
    });
    if (await closeTooltipButton.isVisible()) {
      await closeTooltipButton.click();
      await this.page.waitForTimeout(1000);
    }
  }

  async clickYesOnDeleteConfirmation() {
    expect(this.page.getByText('Yes')).toBeVisible();
    return await this.clickButton('Yes');
  }

  createCreateActivityMutationResponse() {
    const createMutationPromise = waitForResponseWithURLandBody(
      this.page,
      TIME_TRACKING_URL_PATTERN,
      matchTimeEntryBatchSaveResponse,
    );
    return createMutationPromise;
  }

  async validateCreateMutationResponse(createMutationPromise: any) {
    const createMutationPromisePayload = await createMutationPromise;
    expect(createMutationPromisePayload).toBeDefined();
    return createMutationPromisePayload;
  }

  createUpdateMutationResponse() {
    const updateMutationPromise = waitForResponseWithURLandBody(
      this.page,
      TIME_TRACKING_URL_PATTERN,
      matchTimeEntryBatchSaveResponse,
    );
    return updateMutationPromise;
  }

  async validateUpdateMutationResponse(updateMutationPromise: any) {
    const updateMutationPromisePayload = await updateMutationPromise;
    expect(updateMutationPromisePayload).toBeDefined();
  }

  createDeleteMutationResponse() {
    const deleteMutationPromise = waitForResponseWithURLandBody(
      this.page,
      TIME_TRACKING_URL_PATTERN,
      matchTimeEntryBatchSaveResponse,
    );
    return deleteMutationPromise;
  }

  async validateDeleteMutationResponse(deleteMutationPromise: any) {
    const deleteMutationPromisePayload = await deleteMutationPromise;
    expect(deleteMutationPromisePayload).toBeDefined();
    expect(deleteMutationPromisePayload).toBeDefined();
    return deleteMutationPromisePayload;
  }

  validateMutationIdMatch(mutationPayloadOne: any, mutationPayloadTwo: any) {
    expect(
      mutationPayloadOne.data.timeTrackingBatchManageTimeEntries.timeEntries[0]
        .id,
    ).toEqual(
      mutationPayloadTwo.data.timeTrackingBatchManageTimeEntries.timeEntries[0]
        .id,
    );
  }
  async checkCheckboxIfVisible(label: string) {
    const checkbox = this.page.locator(
      `//span[contains(text(), '${label}')] / ancestor::label / descendant::input`,
    );
    if ((await checkbox.isVisible()) && !(await checkbox.isChecked())) {
      return await checkbox.check();
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

  async clearNameInputField() {
    const lowerCaseFieldName = LABELS.Name.toLowerCase();
    const nameInputField = await this.page.locator(
      `//*[contains(@placeholder, "${lowerCaseFieldName}") and @type="text"]`,
    );
    await nameInputField.focus();
    await nameInputField.fill('');
    return await nameInputField.blur();
  }

  async getNameInputFieldValue() {
    const lowerCaseFieldName = LABELS.Name.toLowerCase();
    const nameInputField = this.page.locator(
      `//*[contains(@placeholder, "${lowerCaseFieldName}") and @type="text"]`,
    );
    const nameInputValue = await nameInputField.inputValue();
    return nameInputValue;
  }

  getBillRateLocator() {
    return this.page.locator(
      `//span[contains(text(), '${LABELS.BillablePerHour}')]  / ancestor::div[contains(@class, 'BillableTaxable')] / descendant::input[@aria-label="Bill rate"]`,
    );
  }

  async returnBillRateValue() {
    const billRateValue = await this.getBillRateLocator().inputValue();
    return Number(billRateValue);
  }

  getBillableFormFieldIcon() {
    return this.page.locator(
      `//span[text()='${LABELS.BillablePerHour}'] / ancestor::label / following-sibling::*`,
    );
  }

  async returnCostRateValue() {
    const costRateValue = await this.page
      .locator(
        `//span[contains(text(), '${LABELS.CostRatePerHour}')]  / ancestor::div[contains(@class, 'CostRate')] / descendant::input[@aria-label="Bill rate"]`,
      )
      .inputValue();
    return Number(costRateValue);
  }

  async fillCostRateInput(rate: string) {
    return await this.page
      .locator(
        `//span[contains(text(), '${LABELS.CostRate}')] / ancestor::div[1] / descendant::input`,
      )
      .fill(rate);
  }

  getCostRateFormFieldIcon() {
    return this.page.locator(
      `//span[text()='${LABELS.CostRatePerHour}'] / following-sibling::*`,
    );
  }

  getCostRateLocator() {
    return this.page.locator(
      `//span[contains(text(), '${LABELS.CostRate}')] / ancestor::div[1] / descendant::input`,
    );
  }

  getInvalidRateMessageLocator() {
    return this.page.locator(
      `//span[text()='${LABELS.CostRatePerHour}'] / ancestor::span / following-sibling::div/div/div / *[@data-automation-id="idsInlineValidationMessage-alertMsg"] `,
    );
  }

  getValidationErrorLocatorForBillRate() {
    return this.page.locator(
      `//span[text()='${LABELS.BillablePerHour}'] / ancestor::label / ancestor::div / following-sibling::div/div/div/div/div / *[@data-automation-id="idsInlineValidationMessage-alertMsg"]`,
    );
  }

  getValidationErrorMessageLocatorForBillRate() {
    return this.page.locator(
      `//span[text()='${LABELS.BillablePerHour}'] / ancestor::label / ancestor::div / following-sibling::div/div/div/div/div / *[@data-automation-id="idsInlineValidationMessage-alertMsg"]/div/span`,
    );
  }

  async noAccessValidation() {
    await this.page.waitForSelector(`//div[text()="We're sorry!"]`, {
      state: 'visible',
      timeout: 5000,
    });
    return await expect(
      this.page.locator(
        `//*[text() = "You don’t have access rights to view this data."]`,
      ),
    ).toBeVisible();
  }

  validateDrawerVisibility() {
    return this.page.getByTestId('drawerTitle').isVisible();
  }

  validateOldTrowerTitle() {
    return this.page.getByText('Time Activity').isVisible();
  }

  async validateNoAvailablePayTypes() {
    return this.page.getByPlaceholder('No available pay types').isVisible();
  }

  async clickSetClockInAndOutToggles() {
    return await this.page
      .locator(`//input[@aria-label="Set start and end time"]`)
      .click();
  }

  async selectStartTime(time: string) {
    await this.page
      .locator(
        `//span[text()='Start time'] / ancestor::label / descendant::input[@data-testid="__textField"]`,
      )
      .click();
    return await this.page.getByRole('option', { name: time }).click();
  }

  async selectEndTime(time: string) {
    await this.page
      .locator(
        `//span[text()='End time'] / ancestor::label / descendant::input[@data-testid="__textField"]`,
      )
      .click();
    return await this.page
      .getByRole('option', { name: time, exact: true })
      .click();
  }

  async validateStartTime(time: string) {
    const startTime = await this.page
      .locator(
        `//span[text()='Start time'] / ancestor::label / descendant::input[@data-testid="__textField"]`,
      )
      .getAttribute('value');
    return await expect(startTime).toContain(time);
  }

  async validateEndTime(time: string) {
    const endTime = await this.page
      .locator(
        `//span[text()='End time'] / ancestor::label / descendant::input[@data-testid="__textField"]`,
      )
      .getAttribute('value');
    return await expect(endTime).toContain(time);
  }

  async waitTillLoaderDisappears() {
    return await this.page.waitForSelector('//div[@aria-label="Loading"]', {
      state: 'hidden',
      timeout: 0,
    });
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

  async clickSaveAndCloseButton() {
    await this.page
      .locator(`//button[contains(@aria-label, "Save and")]`)
      .click();
    return await this.page.locator(`//*[text()='Save and close']`).click();
  }

  async selectPayTypeOption(optionNumber: Number) {
    return await this.page
      .locator(
        `(//li[contains(@class, 'menu-item-container')])[${optionNumber}]`,
      )
      .or(
        this.page.locator(
          `(//span[contains(@class, 'menu-item-container')])[${optionNumber}]`,
        ),
      )
      .click();
  }

  async validateStartDateFieldPresence() {
    return await this.page
      .locator(
        `//span[text()='Start time'] / ancestor::label / descendant::input[@data-testid="__textField"]`,
      )
      .isVisible();
  }

  async validateEndDateFieldPresence() {
    return await this.page
      .locator(
        `//span[text()='End time'] / ancestor::label / descendant::input[@data-testid="__textField"]`,
      )
      .isVisible();
  }

  async getFieldValue(fieldName: string) {
    return await this.getFieldLocator(fieldName).getAttribute('value');
  }

  async getCustomerFieldValue() {
    // Use the generic case-insensitive approach
    return await this.getCaseInsensitiveTestIdLocator('customer')
      .first()
      .getAttribute('value');
  }

  async getServiceFieldValue() {
    // Use the generic case-insensitive approach
    return await this.getCaseInsensitiveTestIdLocator('service')
      .first()
      .getAttribute('value');
  }

  async getNotesFieldValue() {
    const value = await this.page
      .locator(`//span[contains(text(),'Notes')]/following-sibling::textarea`)
      .textContent();
    return value !== null ? value : '';
  }

  async validateNotesFieldPresence() {
    return await this.page
      .locator(`//span[contains(text(),'Notes')]/following-sibling::textarea`)
      .isVisible();
  }

  async selectDropDownOption(optionName: string) {
    return await this.page
      .locator(`//div[@role="listbox"] / descendant::*[text()='${optionName}']`)
      .click();
  }

  async getStartTimeValue() {
    const startTime = await this.page
      .locator(
        `//span[text()='Start time'] / ancestor::label / descendant::input[@data-testid="__textField"]`,
      )
      .textContent();
    return startTime;
  }

  async getEndTimeValue() {
    const endTime = await this.page
      .locator(
        `//span[text()='End time'] / ancestor::label / descendant::input[@data-testid="__textField"]`,
      )
      .textContent();
    return endTime;
  }

  async costRateFieldVisibility() {
    return await this.page
      .locator(`//span[contains(text(), '${LABELS.CostRatePerHour}')]`)
      .isVisible();
  }

  async clickFooterCancelButton() {
    return await this.page.getByRole('button', { name: 'Cancel' }).click();
  }

  async clickCrossButton() {
    return await this.page
      .locator(`//div[@data-automation-id='single-time-trowser_close']//button`)
      .click();
  }

  async uncheckCheckboxIfVisible(label: string) {
    const checkbox = this.page.locator(
      `//span[contains(text(), '${label}')] / ancestor::label / descendant::input`,
    );

    const isVisible = await checkbox.isVisible();
    if (isVisible) {
      const isChecked = await checkbox.isChecked();

      if (isVisible && isChecked) {
        await checkbox.uncheck();
      }
    }
  }

  async isCheckboxVisible(label: string) {
    const checkbox = this.page.locator(
      `//span[contains(text(), '${label}')]/preceding-sibling::span/input[@type='checkbox']`,
    );
    return await checkbox.isVisible();
  }

  async isCheckboxChecked(label: string) {
    const checkbox = this.page.locator(
      `//span[contains(text(), '${label}')] /ancestor::label /descendant::input[@type='checkbox']`,
    );
    return await checkbox.isChecked();
  }

  async checkCheckboxForGivenLabelIfVisible(label: string) {
    const checkbox = await this.page.locator(
      `//span[contains(text(), '${label}')]/preceding-sibling::span/input[@type='checkbox']`,
    );
    if ((await checkbox.isVisible()) && !(await checkbox.isChecked())) {
      return await checkbox.check();
    }
  }

  async clearCostRateFieldValue() {
    const costRateField = await this.page
      .locator(`//input[@aria-label='Bill rate']`)
      .nth(0);
    if (await costRateField.isVisible()) {
      return await costRateField.clear();
    }
  }

  async populateCostRateFieldValue() {
    const costRateField = await this.page
      .locator(`//input[@aria-label='Bill rate']`)
      .nth(0);
    if (await costRateField.isVisible()) {
      return await costRateField.fill('10.00');
    }
  }

  async openTimeSettingsPopoverForm() {
    return await this.page
      .getByRole('dialog', { name: 'Single day entry' })
      .getByRole('button', { name: 'Settings' })
      .click();
  }

  async isCheckboxVisibleInTimeSettingsPopover(label: string) {
    return await this.page
      .locator(
        `//div[contains(@class, 'TimeSettingsPopoverForm')] / descendant::span[text()='${label}'] / ancestor::label / descendant::input`,
      )
      .isVisible();
  }

  async uncheckCheckboxInTimeSettingsPopover(label: string) {
    return await this.page
      .locator(
        `//div[contains(@class, 'TimeSettingsPopoverForm')] / descendant::span[text()='${label}'] / ancestor::label / descendant::input`,
      )
      .uncheck();
  }

  async checkCheckboxInTimeSettingsPopover(label: string) {
    return await this.page
      .locator(
        `//div[contains(@class, 'TimeSettingsPopoverForm')] / descendant::span[text()='${label}'] / ancestor::label / descendant::input`,
      )
      .check();
  }

  async clickOnSaveSettingsInsidePopover() {
    return await this.page
      .getByRole('button', { name: 'Save settings' })
      .click();
  }

  async fillStartDate(date: string) {
    return await this.page.getByLabel('Start date', { exact: true }).fill(date);
  }

  async validateInvalidStartDateError() {
    return expect(await this.page.getByText('Invalid date')).toBeVisible();
  }

  async clearStartDateField() {
    return await this.page.getByLabel('Start date', { exact: true }).clear();
  }

  async clickCalendarButtonForStartDateField() {
    return await this.page
      .getByRole('button', { name: 'Start date Calendar' })
      .click();
  }

  async selectDateInCalendarForStartDate(date: string) {
    return await this.page.getByRole('button', { name: date }).first().click();
  }

  async verifyInvalidStartDateErrorDisappeared() {
    return expect(await this.page.getByText('Invalid date')).not.toBeVisible();
  }

  async validateStartDateRequiredError() {
    return expect(
      await this.page
        .locator(
          `//div[@data-automation-id="idsInlineValidationMessage-alertMsg"]`,
        )
        .first(),
    ).toBeVisible();
  }

  async selectTeamMemberFromDropdown(name: string) {
    return await this.page
      .locator(`//li / descendant::*[self::b | self::span][text()='${name}']`)
      .click();
  }

  async clearFieldValue(fieldName: string) {
    return await this.getFieldLocator(fieldName).clear();
  }

  async focusOnField(fieldName: string) {
    return await this.getFieldLocator(fieldName).focus();
  }

  async waitForDropDownList() {
    return await this.page
      .locator(`//ul[@role='listbox']`)
      .or(this.page.locator('//div[@role="listbox"]'))
      .waitFor({
        state: 'visible',
        timeout: 30000, // or whatever timeout you need
      });
  }

  async selectOptionFromDropdown(name: string) {
    return await this.page
      .locator(`//li / descendant::*[self::b | self::span][text()='${name}']`)
      .click();
  }

  async enterFieldValue(fieldName: string, value: string) {
    return await this.getFieldLocator(fieldName).fill(value);
  }

  async validateRequiredFieldError(fieldName: string) {
    return await expect(
      this.page.locator(
        `//span[contains(text(), '${fieldName}')] / ancestor::label / following-sibling::div / *[@data-automation-id="idsInlineValidationMessage-alertMsg"]`,
      ),
    ).toBeVisible();
  }

  async clickAddNew() {
    return await this.page.locator(`//span[text()='Add new']`).click();
  }

  async fillDisplayName(name: string) {
    return await this.page
      .locator(`//input[@data-testid="contact-drawer-display-name__textField"]`)
      .fill(name);
  }

  async clickSaveButtonDrawerFooter() {
    return await this.page
      .locator(
        `//div[contains(@class, 'Drawer')] / descendant::*[text()='Save']`,
      )
      .click();
  }

  async clickSaveButtonLocationDrawer() {
    return await this.page
      .locator(`//button[@data-cy="location-drawer-save-button"]`)
      .click();
  }

  async waitForNewTeamMemberCustomerClassDrawerOpen() {
    return await this.page.waitForSelector(`//div[text()='Name and contact']`, {
      state: 'visible',
      timeout: 0,
    });
  }

  async waitTillDrawerCloses() {
    return await this.page.waitForSelector(
      `//div[contains(@class, 'Drawer-wrapper')]`,
      {
        state: 'hidden',
        timeout: 0,
      },
    );
  }

  async waitForNewServiceDrawerOpen() {
    return await this.page.waitForSelector(
      `//strong[text()='Add a new service']`,
      {
        state: 'visible',
        timeout: 0,
      },
    );
  }

  async fillNewServiceNameInServiceDrawer(serviceName: string) {
    return await this.page.getByLabel('Name*').fill(serviceName);
  }

  async clickSaveAndCloseButtonForNewServiceInDrawer() {
    return await this.page.locator(`//button[@id='save-item']`).click();
  }

  async waitForNewLocationDraweropen() {
    return await this.page.waitForSelector(`//span[text()='Location name']`, {
      state: 'visible',
      timeout: 0,
    });
  }

  async fillNewLocationNameInLocationDrawer(locationName: string) {
    return await this.page.getByLabel('Location name').fill(locationName);
  }

  getUnsavedChangesModalLocator() {
    return this.page.locator(`${UNSAVED_CHANGES_MODAL_BASE_XPATH}`);
  }

  getUnsavedChangesModalTextLocator() {
    return this.page.locator(
      `${UNSAVED_CHANGES_MODAL_BASE_XPATH} / div/div/h1`,
    );
  }

  getUnsavedChangesModalNoButtonLocator() {
    return this.page.locator(
      `${UNSAVED_CHANGES_MODAL_BASE_XPATH} / div/div[position()=2]/div/button[position()=1]`,
    );
  }

  getUnsavedChangesModalYesButtonLocator() {
    return this.page.locator(
      `${UNSAVED_CHANGES_MODAL_BASE_XPATH} / div/div[position()=2]/div/button[position()=2]`,
    );
  }

  async waitForAddNewTeamMemberDrawerToOpen() {
    return expect(await this.page.getByText(`Employee`)).toBeVisible();
  }

  async clickContactTypeDropdown() {
    return await this.page.getByLabel('Contact type').click();
  }

  async selectContactType(option: string) {
    return await this.page.getByRole('option', { name: option }).click();
  }

  async checkIfSetClockToggleOff() {
    const state = await this.page
      .locator(`//input[@data-automation-id="undefined-input"]`)
      .isChecked();
    return state;
  }

  async validateInvalidTimeError(timeType: 'Start' | 'End') {
    return expect(
      await this.page.locator(
        `//span[text()="${timeType} time"] / ancestor::div[@data-testid="__wrapper"] / descendant::span[text()='Invalid time format']`,
      ),
    ).toBeVisible();
  }

  async fillTime(timeType: 'Start' | 'End', timeValue: string) {
    await this.page
      .locator(
        `//span[text()="${timeType} time"] / ancestor::label / descendant::input[@data-testid="__textField"]`,
      )
      .fill(timeValue);
    return await this.page.keyboard.press('Tab');
  }

  async clearTime(timeType: 'Start' | 'End') {
    await this.page
      .locator(
        `//span[text()="${timeType} time"]/ ancestor::div[@data-testid="__wrapper"] / descendant::input`,
      )
      .clear();
    return await this.page.keyboard.press('Tab');
  }

  async validateRequiredTimeError(timeType: 'Start' | 'End') {
    return expect(
      await this.page.locator(
        `//span[text()="${timeType} time"] / ancestor::div[@data-testid="__wrapper"] / descendant::span[text()='This field is required']`,
      ),
    ).toBeVisible();
  }
  async focusOnTimeField(timeType: 'Start' | 'End') {
    return await this.page
      .locator(
        `//span[text()="${timeType} time"]/ ancestor::div[@data-testid="__wrapper"] / descendant::input`,
      )
      .focus();
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
  async waitForNewClassDrawerToOpen() {
    return await this.page.waitForSelector(
      `//div[contains(@class, "Drawer")] / descendant::*[text()='New Class']`,
      { state: 'visible', timeout: 0 },
    );
  }

  async fillNewClassName(className: string) {
    return await this.page
      .locator(`//*[@data-cy="class-input-field"]`)
      .fill(className);
  }

  async clickNoOnDeleteConfirmation() {
    return await this.clickButton('No');
  }

  async waitForDeletModalToClose() {
    return await this.page.waitForSelector(
      `//*[@data-automation-id="ModalDialog"]`,
      {
        timeout: 0,
        state: 'hidden',
      },
    );
  }

  async billRateCheckBoxVisibility() {
    return await this.page
      .locator(`//span[contains(text(), '${LABELS.BillablePerHour}')]`)
      .isVisible();
  }

  async validateSettingsVisibleSingleTA() {
    return await this.page
      .getByRole('dialog', { name: 'Single day entry' })
      .getByRole('button', { name: 'Settings' })
      .isVisible();
  }

  async clickSaveAndNewButton() {
    await this.page
      .locator(`//button[contains(@aria-label, "Save and")]`)
      .click();
    await this.page.locator(`//*[text()='Save and new']`).click();
  }

  async checkIfErrorEncounteredWhileDeleteSingleActivity() {
    return await this.page
      .getByText('Something went wrong. Give it another try.')
      .isVisible();
  }

  async checkIfSingleTimeHocErrorVisible() {
    return await this.page
      .getByTestId('SingleTimeHOCErrorPageMessage')
      .isVisible();
  }

  async userNotAllowedActionError() {
    return await this.page
      .getByText(
        'User is not allowed to perform action Create on resource Track Own Time',
      )
      .isVisible();
  }

  public async waitForFieldValue(fieldName: string, timeout = 5000) {
    await this.page.waitForFunction(
      (
        (fieldName) => async () =>
          (await this.getFieldValue(fieldName)) !== ''
      )(fieldName),
      { timeout },
    );
  }

  async verifySetClockToggleState() {
    // when toggle is on returns true, else false
    let status;
    try {
      status = await this.page
        .locator(
          `//input[@aria-label="Set start and end time" and @aria-checked='true']`,
        )
        .isVisible();
    } catch {
      status = false;
    }
    return status;
  }

  async checkCheckboxInTimeSettingsPopoverIfUnchecked(label: string) {
    const checkboxLocator = this.page.locator(
      `//div[contains(@class, 'TimeSettingsPopoverForm')] / descendant::span[text()='${label}'] / ancestor::label / descendant::input`,
    );
    if (!(await checkboxLocator.isChecked())) {
      await checkboxLocator.check();
    }
  }

  // async openDropdown(label: string) {
  //   // Poll for the dropdown menu to appear.
  //   // Sadly this is necessary to account for some preference such as UxPreferenceKey.TIME_ENTRY_TIME_FOR
  //   // which change the form around the same time the dropdown is opened, causing it to not open correctly.
  //   await this.page.waitForSelector(
  //     `//span[text()='${label}'] / ancestor::label / descendant::input`,
  //     { state: 'visible', timeout: 0 }
  //   );
  //   await this.page
  //     .locator(
  //       `//span[text()='${label}'] / ancestor::label / descendant::input`
  //     )
  //     .click({ force: true });
  //   // let retries = 0;
  //   // while (retries < 3) {
  //   //   await this.page
  //   //     .locator('label')
  //   //     .filter({ hasText: label })
  //   //     .locator('div')
  //   //     .nth(1)
  //   //     .click({ force: true });
  //   //   try {
  //   //     // wait for dropdown options to appear
  //   //     await this.page.waitForSelector('[role=option]', {
  //   //       state: 'attached',
  //   //       timeout: 1000,
  //   //     });
  //   //     await this.page.waitForTimeout(500);
  //   //     return; // success
  //   //   } catch {
  //   //     retries += 1;
  //   //   }
  //   // }
  // }

  async validateDateFieldPresence(dateType: 'Start' | 'End') {
    return expect(
      await this.page.locator(
        `//span[text()="${dateType} time"] / ancestor::label / descendant::input[@data-testid="__textField"]`,
      ),
    ).toBeVisible();
  }

  async selectTime(timeType: 'Start' | 'End', time: string) {
    await this.page
      .locator(
        `//span[text()="${timeType} time"] / ancestor::label / descendant::input[@data-testid="__textField"]`,
      )
      .click();
    return await this.page.getByRole('option', { name: `${time}` }).click();

    // return await this.page
    // .getByRole('option', { name: `${time}` })
    // .or(this.page.locator(`//span[text()='${time}']`))
    // .click();
  }

  async validateBreakButtonVisible() {
    return await expect(
      await this.page.getByRole('button', { name: 'Add break' }),
    ).toBeVisible();
  }

  async clickBreakButton() {
    return await this.page.getByRole('button', { name: 'Add break' }).click();
  }

  async validateBreakFieldVisible() {
    return await expect(
      await this.page.locator(
        `//span[text()='Break'] / ancestor::label / descendant::input`,
      ),
    ).toBeVisible();
  }

  async validateDeleteBreakButtonVisible() {
    return await expect(
      await this.page.getByRole('button', { name: 'Delete break' }),
    ).toBeVisible();
  }

  async clickDeleteBreakButton() {
    return await this.page
      .getByRole('button', { name: 'Delete break' })
      .click();
  }

  async fillBreak(value: string) {
    return await this.page
      .locator(`//span[text()='Break'] / ancestor::label / descendant::input`)
      .fill(value);
  }

  async focusBreakField() {
    return await this.page
      .locator(`//span[text()='Break'] / ancestor::label / descendant::input`)
      .focus();
  }

  async clearBreakField() {
    return await this.page
      .locator(`//span[text()='Break'] / ancestor::label / descendant::input`)
      .clear();
  }

  async validateBreakValueAutoFormat(value: string) {
    return await expect(
      await this.page
        .locator(`//span[text()='Break'] / ancestor::label / descendant::input`)
        .getAttribute('value'),
    ).toBe(value);
  }

  async validateInvalidBreakTimeError() {
    return expect(
      await this.page.locator(
        `//span[text()='Break'] / ancestor::label / following::span[text()='Invalid time duration']`,
      ),
    ).toBeVisible();
  }

  async validateBreakTimeRequiredError() {
    return expect(
      await this.page.locator(
        `//span[text()='Break'] / ancestor::label / following::span[text()='This field is required']`,
      ),
    ).toBeVisible();
  }
  async validateBreakFieldNotVisible() {
    return await expect(
      await this.page.locator(
        `//span[text()='Break'] / ancestor::label / descendant::input`,
      ),
    ).toBeHidden();
  }

  async validateDeleteBreakButtonNotVisible() {
    return await expect(
      await this.page.getByRole('button', { name: 'Delete break' }),
    ).toBeHidden();
  }

  async validateBreakTimeExceedTotalTimeError() {
    return await this.page
      .getByTestId('SingleTimeHOCErrorPageMessage')
      .getByText('Break time cannot exceed the total time worked.')
      .isVisible();
  }

  async breakTimeExceedTotalTimeTextVisible() {
    return expect(
      await this.page.locator(
        `//p[text()='Break time cannot exceed the total time worked.']`,
      ),
    ).toBeVisible();
  }

  async validateSummaryVisible(hour: string) {
    return await expect(
      await this.page.getByText(`Summary: ${hour} hours`),
    ).toBeVisible();
  }

  async validateSummaryVisibleWhenBillRateFilled(
    hours: string,
    billRate: string,
  ) {
    const hoursInNumber = Number(hours);
    const billRateInNumber = Number(billRate);
    const totalBill = hoursInNumber * billRateInNumber;
    const totalBillString = totalBill.toString();
    return await this.page
      .locator(
        `//p[text()='Summary: ${hours} hours  at $${billRate} per hour = $${totalBillString}.00']`,
      )
      .isVisible();
  }

  async validateBreakButtonHidden() {
    return await expect(
      await this.page.getByRole('button', { name: 'Add break' }),
    ).toBeHidden();
  }

  async handleInvoiceTimePopup() {
    if (
      await this.page
        .locator(
          `//div[@data-testid="ModalDialog--wrapper"] / descendant::*[contains(text(), 'This time has been added to')]`,
        )
        .isVisible()
    ) {
      await this.page
        .locator(
          `//div[@data-testid="ModalDialog--wrapper"] / descendant::*[text()='Yes']`,
        )
        .click();
    }
  }

  async validateNotesFieldMaxLengthExceeded() {
    return await expect(
      this.page.locator(
        `//span[contains(text(),'Notes')]/ ancestor::label / descendant::span[text()='Exceeds max length']`,
      ),
    ).toBeVisible();
  }

  async validateFeedbackButtonPresence() {
    return expect(
      await this.page.locator(`//button[@aria-label="Feedback"]`),
    ).toBeVisible();
  }

  async clickGiveFeedbackButton() {
    await this.page.locator(`//button[@aria-label="Feedback"]`).click();
  }

  async validateFeedbackPopupOpened() {
    return expect(
      await this.page.locator(`//*[text()="We want to hear from you!"]`),
    ).toBeVisible();
  }

  async clickSendFeedbackButton() {
    return await this.page.locator(`//*[text()='Send feedback']`).click();
  }

  async validateEmptyFeedbackFieldError() {
    expect(
      await this.page.locator(`//*[text()='Add your feedback above']`),
    ).toBeVisible();
  }

  async fillFeedback(feedback: string) {
    await this.page
      .locator(`//textarea[@aria-label="Feedback"]`)
      .fill(feedback);
  }

  async validateFeedbackSuccessToast() {
    return expect(
      await this.page.locator(
        `//span[text()='Thank you! Your feedback helps us improve QuickBooks for everyone.']`,
      ),
    ).toBeVisible();
  }

  async validateFeedbackPopupClosed() {
    expect(
      await this.page.locator(`//*[text()="We want to hear from you!"]`),
    ).toBeHidden();
  }

  async getStartDateValue() {
    const date = await this.page
      .getByLabel('Start date', { exact: true })
      .getAttribute('value');
    return date as string;
  }

  async determineDateFormat(dateString: string) {
    const formats = [
      { regex: /^\d{2}\/\d{2}\/\d{4}$/, format: 'MM/DD/YYYY' },
      { regex: /^\d{4}-\d{2}-\d{2}$/, format: 'YYYY-MM-DD' },
      { regex: /^\d{2}\.\d{2}\.\d{4}$/, format: 'DD.MM.YYYY' },
      { regex: /^\d{2}-\d{2}-\d{4}$/, format: 'DD-MM-YYYY' },
    ];
    for (const { regex, format } of formats) {
      if (regex.test(dateString)) {
        if (format === 'MM/DD/YYYY' || format === 'DD/MM/YYYY') {
          const parts = dateString.split('/');
          const month = parseInt(parts[0], 10);
          if (month > 12) {
            return 'DD/MM/YYYY';
          } else {
            return 'MM/DD/YYYY';
          }
        }
        return format;
      }
    }
    return 'Unknown format';
  }

  async clearNotesField() {
    return await this.page
      .locator(`//span[contains(text(),'Notes')]/following-sibling::textarea`)
      .clear();
  }

  async blurField(fieldName: string) {
    return await this.getFieldLocator(fieldName).blur();
  }

  async checkAddNewOptionAvailable() {
    if (await this.page.locator(`//span[text()='Add new']`).isVisible()) {
      return true;
    } else {
      return false;
    }
  }

  async getCostRateValue() {
    const costRateValue = await this.page
      .locator(
        `//span[contains(text(), '${LABELS.CostRatePerHour}')]  / ancestor::div[contains(@class, 'CostRate')] / descendant::input[@aria-label="Bill rate"]`,
      )
      .inputValue();
    return costRateValue;
  }

  async getSuccessToastLocator() {
    return this.page.getByText('Time Entry Added');
  }

  async validateFieldNotVisible(fieldName: string) {
    const isVisible = await this.checkFieldVisibility(fieldName);
    await expect(isVisible).toBeFalsy();
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

  async waitTillNameFieldVisible() {
    return await expect(
      this.page.locator(`//*[contains(@placeholder, "name") and @type="text"]`),
    ).toBeVisible();
  }

  clickHistoryButton() {
    return this.page
      .getByRole('button', { name: 'History', exact: true })
      .click();
  }

  clickSTARecentEntry(entryNumber: number) {
    return this.page
      .locator(
        `//div[contains(@class,"RecentTimeActivitiesModal")]//table/tr[${entryNumber}]`,
      )
      .click();
  }

  checkSTARecentEntryVisible(entryNumber: number) {
    return this.page
      .locator(
        `//div[contains(@class,"RecentTimeActivitiesModal")]//table/tr[${entryNumber}]`,
      )
      .isVisible();
  }
}

export default SingleTimeActivityPage;
