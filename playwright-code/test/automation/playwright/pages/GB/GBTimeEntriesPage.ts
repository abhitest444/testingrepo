import { Page, Locator, expect, FrameLocator } from '@playwright/test';
import { testData } from '../../constants';

export const OIGQL_URL_PATTERN =
  /https:\/\/sbseggraphqlorch.*\.api\.intuit\.com\/graphql/;

export const TSHEETS_URL_PATTERN =
  /https:\/\/tsheets(-e2e)?\.api\.intuit\.com\/graphql/;

class TimeEntriesPage {
  private page: Page;
  private frame: FrameLocator;

  constructor(page: Page) {
    this.page = page;
    this.frame = page.frameLocator('#time_off_requests_list_frame');
  }

  // Locators
  get loadingSpinner() {
    return this.page.locator(
      `//div[@aria-label="Loading" and @role="progressbar"]`,
    );
  }

  get dropdownMenu() {
    return this.page.locator(`//ul[@role='listbox']`);
  }

  get listItems() {
    return this.dropdownMenu.locator('li');
  }

  async navigateToTimeEntriesPage() {
    await this.page.goto('/app/time?jobId=time', { waitUntil: 'load' });
    await this.page.waitForTimeout(2000);
    // Wait for the page to be ready before checking for popups
    await this.waitForPageReady(this.page);
    await this.handlePopupsInAnyOrder();
  }

  // Actions
  async waitForLoadingToDisappear() {
    return await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 0 });
  }

  async getDropdownOptions() {
    const textContents = await this.listItems.allInnerTexts();
    return textContents
      .filter((text) => text.trim() !== '') // Remove empty strings
      .map((text) => text.split('\n')[0].trim()); // Extract the part before '\n' and trim whitespace
  }

  async validateTimeEntriesVisibleInDateFormat() {
    return expect(
      await this.page.locator(
        `(//*[contains(@aria-label, "Collapse rows for")])[1]`,
      ),
    ).toBeVisible();
  }

  async validateDateRangeDropdownOptions() {
    const actualOptions = await this.getDropdownOptions();
    testData.expectedOptions.forEach((option) => {
      if (!actualOptions.includes(option)) {
        throw new Error(`Option "${option}" is missing in the dropdown.`);
      }
    });
  }

  async validateDateWiseDataVisible() {
    return await expect(
      this.page.locator(`(//*[contains(@aria-label, "Collapse rows for")])[1]`),
    ).toBeVisible();
  }

  async validateTimeEntryColumnHeaders(expectedHeaders: string[]) {
    const tableHeaders = await this.page.locator(
      '//thead//*[@role="row"]/descendant::th',
    );

    // Get the text content of all <th> elements and filter out empty/undefined
    const actualHeaders = (await tableHeaders.allTextContents())
      .map((h) => h?.trim())
      .filter((h) => h && h.length > 0);

    // 1. Flag any header in the application that is not present in the constant file
    const unexpectedHeaders = actualHeaders.filter(
      (header) => !expectedHeaders.includes(header),
    );
    if (unexpectedHeaders.length > 0) {
      throw new Error(
        `Unexpected headers found in the table: ${unexpectedHeaders.join(
          ', ',
        )}`,
      );
    }
    const missingHeaders = expectedHeaders.filter(
      (header) => !actualHeaders.includes(header),
    );
    if (missingHeaders.length > 0) {
      console.warn(
        `These expected headers are not present in the table (ignored): ${missingHeaders.join(
          ', ',
        )}`,
      );
    }
  }

  async clickSettingsButton() {
    return await this.page
      .locator(`//th / descendant::*[@aria-label="Settings"]`)
      .click();
  }

  async getColumnsCheckboxFromSettings(columnName: string) {
    const checkbox = await this.page.locator(
      `//span[text()='${columnName}']/ancestor::label/descendant::input`,
    );
    return checkbox;
  }

  async waitForSettingsPopupToClose() {
    return await this.page.waitForSelector(
      `//*[@name="detailColumnSettings"]`,
      { state: 'hidden', timeout: 0 },
    );
  }

  async validateColumnVisible(columnName: string) {
    return await expect(
      this.page.locator(`//th/div[text()='${columnName}']`),
    ).toBeVisible();
  }

  async validateColumnHidden(columnName: string) {
    // Check if the column is hidden
    return await expect(
      this.page.locator(`//th/div[text()='${columnName}']`),
    ).toBeHidden();
  }

  async clickTeamMember() {
    // Check if the column is hidden
    await expect(
      this.page.getByPlaceholder('Search team members'),
    ).toBeVisible();
    await this.page.getByPlaceholder('Search team members').click();
  }

  async fillTeamMember(teamMemberName: string) {
    // Fill in the team member search box
    await this.page
      .getByPlaceholder('Search team members')
      .fill(teamMemberName);
  }

  async selectTeamMember(teamMemberName: string) {
    // Verify the dropdown is visible and contains the expected option and select the dropdown value
    await expect(
      this.page.getByRole('menuitem', { name: teamMemberName }),
    ).toBeVisible();
    await this.page.getByRole('menuitem', { name: teamMemberName }).click();
  }

  async validateFilterRecordDisplayed(teamMemberName: string) {
    await expect(
      this.page
        .locator(
          `//table//tbody/tr[2]/td[2]//div[contains(@class,'StyledName-')]`,
        )
        .first(),
    ).toBeVisible();
    // Verify that all displayed entries contain the filtered team member's name
    const entries = await this.page
      .locator(
        `//table//tbody/tr[2]/td[2]//div[contains(@class,'StyledName-')]`,
      )
      .all();
    for (const entry of entries) {
      const entryText = await entry.textContent();
      expect(entryText).toContain(teamMemberName);
    }
  }

  async validateRecordNotVisible(invalidEmpName: string) {
    await this.page.waitForTimeout(3000);
    await expect(
      this.page.getByRole('menuitem', { name: invalidEmpName }),
    ).not.toBeVisible();
  }

  async clickButton(buttonText: string, n = 1) {
    const button = this.page
      .getByRole('button', { name: buttonText, exact: true })
      .nth(n);

    await button.waitFor({ state: 'visible' });
    return button.click();
  }

  async validateEditDrawerHeader() {
    await this.page.getByText(`Edit time`).waitFor({ state: 'visible' });
    expect(this.page.getByText(`Edit time`)).toBeVisible();
  }

  async blockNetworkCalls(
    page: { route: (arg0: any, arg1: (route: any) => void) => any },
    apiCall: any,
  ) {
    // Intercept and block the GraphQL POST request
    await page.route(
      apiCall,
      (route: {
        request: () => {
          (): any;
          new (): any;
          method: { (): string; new (): any };
        };
        abort: () => void;
        continue: () => void;
      }) => {
        if (route.request().method() === 'POST') {
          route.abort(); // Block the POST request
        } else {
          route.continue(); // Allow other requests
        }
      },
    );
  }

  async validateNetworkInterruptionError() {
    await expect(
      this.page.locator(`//div[text()='Something went wrong.']`),
    ).toBeVisible();
    await expect(
      this.page.locator(`//div[text()='Try again later.']`),
    ).toBeVisible();
  }

  async getAllCollapsibleDateElements() {
    // Get all collapsible date elements
    const dateLocator = await this.page.locator(
      '//*[contains(@aria-label, "Collapse rows for")]',
    );
    return dateLocator;
  }

  async convertDateTextIntoObjectsAndValidateOrder(dateTexts: any) {
    // Convert the text contents into Date objects
    const dates = dateTexts.map((text: any) => new Date(text));
    // Validate that the dates are in descending order
    const isDescending = dates.every((date: any, index: any) => {
      if (index === 0) return true; // First element, nothing to compare
      return date <= dates[index - 1]; // Ensure each date is less than or equal to the previous one
    });
    return isDescending;
  }

  async getCollapsibleDateRow(index: any) {
    return await this.page.locator(`//tbody[${index}]/ tr[${index}]`);
  }

  async validateExpandCollapseDateRowFunctionality(firstDateRow: any) {
    //check whether the row is expanded or collapsed
    const isExpanded = await firstDateRow
      .locator(`xpath=descendant::button`)
      .getAttribute('aria-expanded');
    if (isExpanded) {
      // if expanded, check time entry record is visible below the date row
      await expect(
        await this.page.locator(
          `(//*[contains(@aria-label, "Collapse rows for")])[1] / ancestor::tr / following-sibling::tr[1]`,
        ),
      ).toBeVisible();

      //then click on date row to collapse it
      await firstDateRow.click();

      // check if time entry record no longer visible after date row is collapsed
      await expect(
        await this.page.locator(
          `(//*[contains(@aria-label, "Expand rows for")])[1] / ancestor::tr / following-sibling::tr[@aria-hidden="true"][1]`,
        ),
      ).toBeHidden();
    } else {
      // if collpsed, check time entry record is not visible below the date row
      await expect(
        await this.page.locator(
          `(//*[contains(@aria-label, "Expand rows for")])[1] / ancestor::tr / following-sibling::tr[@aria-hidden="true"][1]`,
        ),
      ).toBeHidden();

      //then click on date row to expand it
      await firstDateRow.click();

      // check if time entry record is now visible after date row is expanded
      await expect(
        await this.page.locator(
          `(//*[contains(@aria-label, "Collapse rows for")])[1] / ancestor::tr / following-sibling::tr[1]`,
        ),
      ).toBeVisible();
    }
  }

  async getLockIconInDetailsColumn() {
    return this.page.locator(
      `(//span[text()='Approved']//ancestor::div[contains(@class, 'TimeDetailRow')]/../../td//*[name()='svg'])[1]`,
    );
  }

  async hoverOverLockIcon() {
    const lockIcon = await this.getLockIconInDetailsColumn();
    await lockIcon.hover();
  }

  async validateLockIconTooltip() {
    const tooltip = this.page.getByText('Timesheet Locked');
    await expect(tooltip).toBeVisible();
  }

  async getAttachmentIconInDetailsColumn(attachmentCount: number) {
    return this.page.getByRole('button', {
      name: `${attachmentCount} attachments`,
    });
  }

  async hoverOverAttachmentIcon(attachmentCount: number) {
    const attachmentIcon = await this.getAttachmentIconInDetailsColumn(
      attachmentCount,
    );
    await attachmentIcon.hover();
  }

  async clickAttachmentIcon(attachmentCount: number) {
    const attachmentIcon = await this.getAttachmentIconInDetailsColumn(
      attachmentCount,
    );
    await attachmentIcon.click();
  }

  async validateAttachmentTooltip(attachmentCount: number) {
    const tooltip = this.page.getByText(`${attachmentCount} attachments`);
    await expect(tooltip).toBeVisible();
  }

  async validateAttachmentsModal() {
    // Validate modal is visible
    const modal = this.page.locator(
      `//div[contains(@class, 'AttachmentContainer')]`,
    );
    await expect(modal).toBeVisible();

    // Validate download button
    const downloadButton = this.page.getByRole('link', {
      name: 'Close attachments viewer',
    });
    await expect(downloadButton).toBeVisible();

    // Validate delete button
    const deleteButton = this.page.getByRole('button', {
      name: 'Delete attachment',
    });
    await expect(deleteButton).toBeVisible();

    // Validate close button
    const closeButton = this.page.getByRole('button', {
      name: 'Close attachments viewer',
    });
    await expect(closeButton).toBeVisible();
  }

  async closeAttachmentsModal() {
    const closeButton = this.page.getByRole('button', {
      name: 'Close attachments viewer',
    });
    await closeButton.click();
    await expect(
      this.page.locator(`//div[contains(@class, 'AttachmentContainer')]`),
    ).toBeHidden();
  }

  async getGPSIconInDetailsColumn() {
    return this.page.locator(
      `(//button[@aria-label='View GPS data for this timesheet']/*[name()='svg'])[1]`,
    );
  }

  async hoverOverGPSIcon() {
    const gpsIcon = await this.getGPSIconInDetailsColumn();
    await gpsIcon.hover();
  }

  async validateGPSTooltip() {
    const tooltip = this.page.getByText('View GPS data for this timesheet');
    await expect(tooltip).toBeVisible();
  }

  async clickGPSIcon() {
    const gpsIcon = await this.getGPSIconInDetailsColumn();
    await gpsIcon.click();
  }

  async validateGPSModal() {
    // Validate modal title
    const modalTitle = this.page.getByText('Timesheet Map');
    await expect(modalTitle).toBeVisible();

    // Validate location is displayed
    const frameLocator = this.page.frameLocator(
      `iframe[title='Timesheet Map']`,
    );
    const location = frameLocator.locator(
      `(//div[@aria-label='Map']/following::img[@width='20'])[1]`,
    );
    await expect(location).toBeVisible();

    // Validate timestamp is displayed
    const timestamp = frameLocator.locator(
      `//h2[text()='Timesheet Details']/following-sibling::div/div`,
    );
    await expect(timestamp).toBeVisible();
  }

  async closeGPSModal() {
    const frameLocator = this.page.frameLocator(
      `iframe[title='Timesheet Map']`,
    );
    const closeButton = this.page
      .locator(`//button[@aria-label='Close']`)
      .first();
    await closeButton.click();
    await expect(
      frameLocator.locator(
        `//h2[text()='Timesheet Details']/following-sibling::div/div`,
      ),
    ).toBeHidden();
  }

  async selectDateRangeWithMoreRows() {
    // Select a date range that typically yields more rows (e.g., Last 3 months)
    await this.page.getByRole('button', { name: 'Date range' }).click();
    await this.page.getByRole('menuitem', { name: 'Last 3 months' }).click();
    await this.waitForLoadingToDisappear();
  }

  async scrollToBottom() {
    await this.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
  }

  async clickShowMore() {
    const showMoreButton = this.page.locator(
      `//span[text()='Show more']/parent::button`,
    );
    await showMoreButton.waitFor({ state: 'visible' });
    await showMoreButton.click();
    await this.waitForLoadingToDisappear();
  }

  async validateMoreRowsLoaded(initialCount: number) {
    const currentRows = await this.page.locator('//table//tbody/tr').count();
    expect(currentRows).toBeGreaterThan(initialCount);
  }

  async getRowCount() {
    return await this.page.locator('//table//tbody/tr').count();
  }

  async validateTimeEntryRecords() {
    // Validate that time entry records are visible and have content
    const records = await this.page.locator('//table//tbody/tr').all();
    for (const record of records) {
      // Validate name column
      await expect(
        this.page.locator(
          `(//table//tbody/tr/td[contains(@class, 'name-header-cell') or position()=2])[1]`,
        ),
      ).toBeVisible();

      // Validate time column
      await expect(
        this.page.locator(
          `(//table//tbody/tr/td[contains(@class, 'name-header-cell') or position()=3])[1]`,
        ),
      ).toBeVisible();

      // Validate hours column
      await expect(
        this.page.locator(
          `(//table//tbody/tr/td[contains(@class, 'name-header-cell') or position()=4])[1]`,
        ),
      ).toBeVisible();

      // Validate customer column
      await expect(
        this.page.locator(
          `(//table//tbody/tr/td[contains(@class, 'name-header-cell') or position()=5])[1]`,
        ),
      ).toBeVisible();
    }
  }

  async filterByDate() {
    // Click on the date range dropdown
    await this.page
      .locator('//div[contains(@class, "DateRangeSelect")]')
      .click();

    // Select "This month" option
    await this.page.getByRole('menuitem', { name: 'This month' }).click();

    // Wait for the loading spinner to disappear
    await this.waitForLoadingToDisappear();
  }

  async getSortableColumnHeader(columnName: string) {
    return this.page.locator(
      `//th[contains(@role, 'columnheader') and contains(., '${columnName}')]`,
    );
  }

  async getSortDirection(sortString: string) {
    const lowerCaseSortString = sortString.toLowerCase();
    if (lowerCaseSortString.includes('descending')) {
      return 'asc';
    } else if (lowerCaseSortString.includes('ascending')) {
      return 'desc';
    }
  }

  async clickSortIcon(columnName: string) {
    const columnHeader = await this.getSortableColumnHeader(columnName);
    const sortIcon = columnHeader.locator('//button');
    await sortIcon.click();
    await this.waitForLoadingToDisappear();
  }

  async getDateColumnValues(): Promise<Date[]> {
    const dateCells = await this.page
      .locator('//td[contains(@class, "date-cell")]')
      .all();
    const dates: Date[] = [];

    for (const cell of dateCells) {
      const dateText = await cell.textContent();
      if (dateText) {
        dates.push(new Date(dateText));
      }
    }

    return dates;
  }

  async validateDateSorting(order: 'asc' | 'desc') {
    const dates = await this.getDateColumnValues();

    if (order === 'asc') {
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i].getTime()).toBeGreaterThanOrEqual(
          dates[i - 1].getTime(),
        );
      }
    } else {
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i].getTime()).toBeLessThanOrEqual(dates[i - 1].getTime());
      }
    }
  }

  async getColumnValues(columnName: string): Promise<string[]> {
    const columnIndex = {
      Name: 2,
      Time: 3,
      Hours: 4,
      Customer: 6,
    }[columnName];

    const cells = await this.page
      .locator(
        `//table//tbody/tr/td[contains(@class, 'name-header-cell') or position()=${columnIndex}]`,
      )
      .all();
    const textContents = await Promise.all(
      cells.map((cell) => cell.textContent()),
    );
    return textContents.filter((text): text is string => text !== null);
  }

  async validateColumnValuesSorted(values: string[], order: 'asc' | 'desc') {
    const sortedValues = [...values].sort((a, b) => {
      if (order === 'asc') {
        return a.localeCompare(b);
      } else {
        return b.localeCompare(a);
      }
    });
    expect(values).toEqual(sortedValues);
  }

  async validateHoursSorted(values: string[], order: 'asc' | 'desc') {
    const sortedValues = [...values].sort((a, b) => {
      const hoursA = parseFloat(a);
      const hoursB = parseFloat(b);
      if (order === 'asc') {
        return hoursA - hoursB;
      } else {
        return hoursB - hoursA;
      }
    });
    expect(values).toEqual(sortedValues);
  }

  async validateTimeSorted(values: string[], order: 'asc' | 'desc') {
    const sortedValues = [...values].sort((a, b) => {
      // Extract start time from format "HH:MM AM/PM - HH:MM AM/PM"
      const startTimeA = a.split(' - ')[0];
      const startTimeB = b.split(' - ')[0];

      const timeA = new Date(`1970-01-01T${startTimeA}`);
      const timeB = new Date(`1970-01-01T${startTimeB}`);

      if (order === 'asc') {
        return timeA.getTime() - timeB.getTime();
      } else {
        return timeB.getTime() - timeA.getTime();
      }
    });
    expect(values).toEqual(sortedValues);
  }

  async validateNameSorted(values: string[], order: 'asc' | 'desc') {
    const sortedValues = [...values].sort((a, b) => {
      const lastNameA = a.split(',')[0].trim();
      const lastNameB = b.split(',')[0].trim();
      // First compare case-insensitively
      const caseInsensitiveCompare = lastNameA.localeCompare(
        lastNameB,
        undefined,
        { sensitivity: 'base' },
      );
      if (caseInsensitiveCompare !== 0) {
        return order === 'asc'
          ? caseInsensitiveCompare
          : -caseInsensitiveCompare;
      }
      // If case-insensitive comparison is equal, compare case-sensitively
      const caseSensitiveCompare = lastNameA.localeCompare(lastNameB);
      return order === 'asc' ? caseSensitiveCompare : -caseSensitiveCompare;
    });
    expect(values).toEqual(sortedValues);
  }

  async validateColumnSorting(columnName: string, order: 'asc' | 'desc') {
    const values = await this.getColumnValues(columnName);

    switch (columnName) {
      case 'Hours':
        await this.validateHoursSorted(values, order);
        break;
      case 'Time':
        await this.validateTimeSorted(values, order);
        break;
      case 'Name':
        await this.validateNameSorted(values, order);
        break;
      case 'Customer':
        await this.validateColumnValuesSorted(values, order);
        break;
      default:
        throw new Error(`Unsupported column: ${columnName}`);
    }
  }

  async selectDateByClickingLeftArrow(targetDate: string) {
    const maxAttempts = 12; // Maximum number of months to go back
    let attempts = 0;
    let dateFound = false;

    while (attempts < maxAttempts && !dateFound) {
      // Check if the target date is visible
      const dateElement = this.page.locator(`[data-test-id="${targetDate}"]`);
      const isVisible = await dateElement.isVisible();

      if (isVisible) {
        // Click the date
        await dateElement.click();
        await dateElement.click();
        dateFound = true;
      } else {
        // Click the left arrow to go to previous month
        await this.page
          .locator('[data-test-id="date-picker-left-arrow"]')
          .click();
        attempts++;
        // Add a small delay to allow the calendar to update
        await this.page.waitForTimeout(500);
      }
    }

    if (!dateFound) {
      throw new Error(
        `Could not find date ${targetDate} after ${maxAttempts} attempts`,
      );
    }
  }

  async selectFromToDateByClickingLeftArrow(fromDate: string, toDate: string) {
    const maxAttempts = 12; // Maximum number of months to go back
    let attempts = 0;
    let dateFound = false;

    while (attempts < maxAttempts && !dateFound) {
      // Check if the target date is visible
      const dateFromElement = this.page.locator(`[data-test-id="${fromDate}"]`);
      const dateToElement = this.page.locator(`[data-test-id="${toDate}"]`);
      const isFromDateVisible = await dateFromElement.isVisible();
      const isToDateVisible = await dateToElement.isVisible();

      if (isFromDateVisible && isToDateVisible) {
        // Click the date
        await dateFromElement.click();
        await dateToElement.click();
        dateFound = true;
      } else {
        // Click the left arrow to go to previous month
        await this.page
          .locator('[data-test-id="date-picker-left-arrow"]')
          .click();
        attempts++;
        // Add a small delay to allow the calendar to update
        await this.page.waitForTimeout(500);
      }
    }

    if (!dateFound) {
      throw new Error(
        `Could not find date ${fromDate} after ${maxAttempts} attempts`,
      );
    }
  }

  async validateTimeEntriesResponse(responseBody: any) {
    // for validating oigql graphql response
    if (!responseBody || !responseBody.data) {
      throw new Error('Invalid response body: Missing "data" field');
    }

    // Validate the top-level structure
    expect(responseBody).toHaveProperty('data.timeTrackingTimeEntries.edges');

    const edges = responseBody.data.timeTrackingTimeEntries.edges;

    // Ensure edges is an array and has at least one item
    expect(edges).toBeInstanceOf(Array);
    expect(edges.length).toBeGreaterThan(0);

    // Validate the structure of each edge
    edges.forEach((edge: any) => {
      expect(edge).toHaveProperty('node');
      expect(edge.node).toHaveProperty('id');
      expect(edge.node).toHaveProperty('__typename', 'TimeTracking_TimeEntry');
    });
  }

  async validateCustomerWiseRecords() {
    // validate that first record is visible with customer name in it
    return await expect(
      this.page.locator(`(//div[contains(@class, 'CustomerName')])[1]`),
    ).toBeVisible();
  }

  async validateCustomerSearchBoxVisible() {
    // Check if the column is hidden
    return await expect(
      this.page.locator(`//input[contains(@placeholder, 'Search customers')]`),
    ).toBeVisible();
  }

  async searchCustomer(customerName: string) {
    await this.page
      .locator(`//input[contains(@placeholder, 'Search customers')]`)
      .click();
    // Fill in the team member search box
    return await this.page
      .locator(`//input[contains(@placeholder, 'Search customers')]`)
      .fill(customerName);
  }

  async validateSearchedCustomerRecords(customerName: string) {
    // Get all customer name cells in the first column of each row
    const records = await this.page
      .locator(`//tbody//*[@role="row"]/td[1]`)
      .allTextContents();

    // Assert that every record matches the expected customer name
    for (const name of records) {
      expect(name.trim()).toBe(customerName);
    }

    // Optionally, assert that at least one record is found
    return expect(records.length).toBeGreaterThan(0);
  }

  async isStrictTsheetsResponse(responseBody: any) {
    if (
      !responseBody ||
      !responseBody.data ||
      !Array.isArray(responseBody.data.timeReport)
    ) {
      return false;
    }

    // Check every item in the timeReport array
    return responseBody.data.timeReport.every((item: any) => {
      return (
        typeof item.id === 'string' &&
        item.aggregateItem &&
        typeof item.aggregateItem.id === 'string' &&
        typeof item.aggregateItem.fullName === 'string' &&
        typeof item.aggregateItem.__typename === 'string' &&
        item.aggregateItem.__typename === 'Customer'
      );
    });
  }

  async waitForStrictTsheetsResponse(
    page: Page,
    urlPattern: RegExp,
    timeout = 15000,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      let resolved = false;

      const onResponse = async (response: any) => {
        try {
          if (urlPattern.test(response.url()) && response.status() === 200) {
            const body = await response.json();
            if (await this.isStrictTsheetsResponse(body)) {
              if (!resolved) {
                resolved = true;
                page.off('response', onResponse);
                resolve(body);
              }
            }
          }
        } catch (err) {
          // Ignore JSON parse errors and keep listening
        }
      };

      page.on('response', onResponse);

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          page.off('response', onResponse);
          reject(new Error('Timed out waiting for a strict TSheets response.'));
        }
      }, timeout);
    });
  }

  async getAllCustomerOrEmployeeRecordRowsCount() {
    const records = await this.page
      .locator(`//tbody//*[@role="row"]/td[1]`)
      .count();
    return records;
  }

  getFirstCustomerOrEmployee() {
    //this method can be used for employee as well
    return this.page
      .locator(
        `//tbody//*[@role="row"]/td/descendant::button[contains(@class, 'time-summary-name')]`,
      )
      .first();
  }
  async calculateTotalHoursForCustomer() {
    const fourthColumnCells = this.page.locator(
      `//tbody//*[@role="row"]/td[4]`,
    );
    const texts = await fourthColumnCells.allTextContents();
    let totalMinutes = 0;
    let detectedFormat: 'decimal' | 'colon' | 'hm' | null = null;

    for (const text of texts) {
      if (!text || typeof text !== 'string') {
        console.warn('Skipping invalid time string:', text);
        continue;
      }

      let hours = 0,
        minutes = 0;
      const trimmed = text.trim();

      if (trimmed.includes(':')) {
        // Format: H:MM
        if (!detectedFormat) detectedFormat = 'colon';
        const [hoursStr, minutesStr] = trimmed.split(':');
        hours = Number(hoursStr.trim());
        minutes = Number(minutesStr.trim());
      } else if (trimmed.includes('.')) {
        // Format: H.MM (treat as decimal hours)
        if (!detectedFormat) detectedFormat = 'decimal';
        const floatVal = parseFloat(trimmed);
        if (!isNaN(floatVal)) {
          hours = Math.floor(floatVal);
          minutes = Math.round((floatVal - hours) * 60);
        } else {
          console.warn('Skipping unparsable time string:', text);
          continue;
        }
      } else {
        // Try to match "Xh Ym", "Xh", "Ym"
        const regex = /^(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?$/i;
        const match = trimmed.match(regex);
        if (match && (match[1] || match[2])) {
          if (!detectedFormat) detectedFormat = 'hm';
          hours = match[1] ? Number(match[1]) : 0;
          minutes = match[2] ? Number(match[2]) : 0;
        } else {
          console.warn('Skipping unparsable time string:', text);
          continue;
        }
      }

      if (isNaN(hours) || isNaN(minutes)) {
        console.warn('Skipping unparsable time string:', text);
        continue;
      }
      totalMinutes += hours * 60 + minutes;
    }

    // Format result based on detected format
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    if (detectedFormat === 'decimal') {
      // Return as decimal hours, e.g., 18.25 or 18.00
      const decimal = totalMinutes / 60;
      // Always show two decimals (e.g., 18.00)
      return decimal.toFixed(2);
    } else if (detectedFormat === 'hm') {
      // Return as "18h 0m"
      return `${totalHours}h ${remainingMinutes}m`;
    } else if (detectedFormat === 'colon') {
      // Return as "18:00"
      return `${totalHours}:${remainingMinutes.toString().padStart(2, '0')}`;
    } else {
      // Fallback: return as "H:MM"
      return `${totalHours}:${remainingMinutes.toString().padStart(2, '0')}`;
    }
  }

  async calculateBillableHours() {
    const texts = await this.page
      .locator(`//div[text()='Yes'] / ancestor::td / preceding-sibling::td[1]`)
      .allTextContents();
    let totalMinutes = 0;
    let detectedFormat: 'decimal' | 'colon' | 'hm' | null = null;

    for (const text of texts) {
      if (!text || typeof text !== 'string') {
        console.warn('Skipping invalid time string:', text);
        continue;
      }

      let hours = 0,
        minutes = 0;
      const trimmed = text.trim();

      if (trimmed.includes(':')) {
        // Format: H:MM
        if (!detectedFormat) detectedFormat = 'colon';
        const [hoursStr, minutesStr] = trimmed.split(':');
        hours = Number(hoursStr.trim());
        minutes = Number(minutesStr.trim());
      } else if (trimmed.includes('.')) {
        // Format: H.MM (treat as decimal hours)
        if (!detectedFormat) detectedFormat = 'decimal';
        const floatVal = parseFloat(trimmed);
        if (!isNaN(floatVal)) {
          hours = Math.floor(floatVal);
          minutes = Math.round((floatVal - hours) * 60);
        } else {
          console.warn('Skipping unparsable time string:', text);
          continue;
        }
      } else {
        // Try to match "Xh Ym", "Xh", "Ym"
        const regex = /^(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?$/i;
        const match = trimmed.match(regex);
        if (match && (match[1] || match[2])) {
          if (!detectedFormat) detectedFormat = 'hm';
          hours = match[1] ? Number(match[1]) : 0;
          minutes = match[2] ? Number(match[2]) : 0;
        } else {
          console.warn('Skipping unparsable time string:', text);
          continue;
        }
      }

      if (isNaN(hours) || isNaN(minutes)) {
        console.warn('Skipping unparsable time string:', text);
        continue;
      }
      totalMinutes += hours * 60 + minutes;
    }

    // Format result based on detected format
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    if (detectedFormat === 'decimal') {
      // Return as decimal hours, e.g., 18.25 or 18.00
      const decimal = totalMinutes / 60;
      // Always show two decimals (e.g., 18.00)
      return decimal.toFixed(2);
    } else if (detectedFormat === 'hm') {
      // Return as "18h 0m"
      return `${totalHours}h ${remainingMinutes}m`;
    } else if (detectedFormat === 'colon') {
      // Return as "18:00"
      return `${totalHours}:${remainingMinutes.toString().padStart(2, '0')}`;
    } else {
      // Fallback: return as "H:MM"
      return `${totalHours}:${remainingMinutes.toString().padStart(2, '0')}`;
    }
  }

  getTotalHoursOfFirstCustomer() {
    return this.page
      .locator(`//tbody//*[@role="row"]/td[2]`)
      .first()
      .textContent();
  }

  getBillableoursOfFirstCustomer() {
    return this.page
      .locator(`  //tbody//*[@role="row"]/td[3]`)
      .first()
      .textContent();
  }

  async validateDecimalHourColumnSorting(
    values: (string | null | undefined)[],
    order: 'asc' | 'desc',
  ) {
    // Helper: true if value is empty or a placeholder (e.g., '--0.00', '', null, undefined)
    const isEmptyOrPlaceholder = (v: string | null | undefined) =>
      !v || !v.trim() || /^-+0*\.?0*$/.test(v.trim());

    // Extract valid numbers
    const numericValues = values
      .filter((v) => !isEmptyOrPlaceholder(v))
      .map((v) => Number(v))
      .filter((num) => !isNaN(num));

    // If all values are empty/placeholder, consider sorted
    if (numericValues.length === 0) return;

    // Check sorting
    const sorted = [...numericValues].sort((a, b) =>
      order === 'asc' ? a - b : b - a,
    );

    if (!numericValues.every((val, i) => val === sorted[i])) {
      throw new Error(
        `Decimal hour values are not sorted in ${order} order. ` +
          `Expected: ${sorted.join(', ')}, Actual: ${numericValues.join(', ')}`,
      );
    }
  }

  async getColumnValuesCustomer(columnName: string): Promise<string[]> {
    const columnIndex = {
      Name: 1,
      Total: 2,
      Billable: 3,
    }[columnName];

    const cells = await this.page
      .locator(
        `//table//tbody/tr/td[contains(@class, 'name-header-cell') or position()=${columnIndex}]`,
      )
      .all();
    const textContents = await Promise.all(
      cells.map((cell) => cell.textContent()),
    );
    return textContents.filter((text): text is string => text !== null);
  }

  async validateNameSortedSpace(values: string[], order: 'asc' | 'desc') {
    // Define special values that should not be included in sorting validation
    const specialNames = ['No customer', 'Testing Cooking'];
    // Filter out special values
    const filteredValues = values.filter(
      (v) => !specialNames.includes(v.trim()),
    );

    const sortedValues = [...filteredValues].sort((a, b) => {
      // Split into last name and first name (on the first space)
      const [lastNameA, ...firstNamePartsA] = a.trim().split(' ');
      const [lastNameB, ...firstNamePartsB] = b.trim().split(' ');

      const firstNameA = firstNamePartsA.join(' ');
      const firstNameB = firstNamePartsB.join(' ');

      // Compare last names first
      const lastNameCompare = lastNameA.localeCompare(lastNameB, undefined, {
        sensitivity: 'case',
        caseFirst: 'upper',
        usage: 'sort',
      });

      // If last names are equal, compare first names
      if (lastNameCompare === 0) {
        return firstNameA.localeCompare(firstNameB, undefined, {
          sensitivity: 'case',
          caseFirst: 'upper',
          usage: 'sort',
        });
      }

      return order === 'asc' ? lastNameCompare : -lastNameCompare;
    });
    expect(filteredValues).toEqual(sortedValues);
  }

  async validateColumnSortingCustomer(
    columnName: string,
    order: 'asc' | 'desc',
  ) {
    const values = await this.getColumnValuesCustomer(columnName);

    switch (columnName) {
      case 'Total':
        await this.validateDecimalHourColumnSorting(values, order);
        break;
      case 'Name':
        await this.validateNameSortedSpace(values, order);
        break;
      case 'Billable':
        await this.validateDecimalHourColumnSorting(values, order);
        break;
      default:
        throw new Error(`Unsupported column: ${columnName}`);
    }
  }

  async selectCustomDateRange(
    targetMonthYear: string,
    startDate: string,
    endDate: string,
  ) {
    // Get the currently visible month and year from the calendar UI
    const monthYearText = await this.page
      .locator(`//div[contains(@class, 'CalendarMonthLabel')]`)
      .textContent();
    // Example: "June 2025"

    // Parse current and target month/year into Date objects (using the 1st of the month)
    const currentDate = new Date(`1 ${monthYearText}`);
    const targetDate = new Date(`1 ${targetMonthYear}`);

    // Calculate the difference in months
    const monthsToMove =
      (currentDate.getFullYear() - targetDate.getFullYear()) * 12 +
      (currentDate.getMonth() - targetDate.getMonth());

    for (let i = 0; i < monthsToMove; i++) {
      await this.page
        .locator(`//button[@data-test-id="date-picker-left-arrow"]`)
        .click();
    }

    // Wait for the correct month/year to be visible
    await expect(
      this.page.locator(`//div[text()='${targetMonthYear}']`),
    ).toBeVisible();

    // Click the start date
    await this.page.locator(`//button[@data-test-id="${startDate}"]`).click();

    // Assert the active cell
    await expect(
      this.page.locator(
        `//button[contains(@class, 'idsDatePickerInline_calendarCellActive')]`,
      ),
    ).toBeVisible();

    // Click the end date
    await this.page.locator(`//button[@data-test-id="${endDate}"]`).click();
  }

  async getCustomerNameCustomerDetailPage() {
    //Customer detail page appears when a customer record is clicked after selecting customer filter
    const customerNameTime = await this.page
      .locator(`//div[contains(@class, 'CustomerName__StyledNameContent')]`)
      .textContent();
    return customerNameTime;
  }
  async getTotalHoursCustomerDetailPage() {
    const tHours = await this.page
      .locator(`//*[contains(@class, 'TotalHours')]`)
      .textContent();
    return tHours;
  }

  async getBillableHoursCustomerDetailPage() {
    const bHours = await this.page
      .locator(`//*[contains(@class, 'BillableHours')]`)
      .textContent();
    return bHours;
  }

  async validateEmployeeWiseRecords() {
    // validate that first record is visible with customer name in it
    return await expect(
      this.page.locator(
        `(//div[contains(@class, 'SummaryTableStyles__StyledName')])[1]`,
      ),
    ).toBeVisible();
  }

  async validateEmployeeSearchBoxVisible() {
    // Check if the column is hidden
    return await expect(
      this.page.locator(
        `//input[contains(@placeholder, 'Search team members')]`,
      ),
    ).toBeVisible();
  }

  async searchEmployee(customerName: string) {
    await this.page
      .locator(`//input[contains(@placeholder, 'Search team members')]`)
      .click();
    // Fill in the team member search box
    await this.page
      .locator(`//input[contains(@placeholder, 'Search team members')]`)
      .fill(customerName);
    await this.page.locator(`//*[text()='${customerName}']`).click();
  }

  async validateSearchedEmployeeRecords(empName: string) {
    // Get all customer name cells in the first column of each row
    const records = await this.page
      .locator(`//tbody//*[@role="row"]/td[2]`)
      .allTextContents();

    // Assert that every record matches the expected customer name
    for (const name of records) {
      expect(name.trim()).toBe(empName);
    }

    // Optionally, assert that at least one record is found
    return expect(records.length).toBeGreaterThan(0);
  }

  getTotalHoursOfFirstEmployee() {
    return this.page
      .locator(`//tbody//*[@role="row"]/td[3]`)
      .first()
      .textContent();
  }

  async getEmployeeNameEmployeeDetailPage() {
    //Customer detail page appears when a customer record is clicked after selecting customer filter
    const employeeNameTime = await this.page
      .locator(`//div[contains(@class, 'WorkerInfo__StyledName')]`)
      .textContent();
    return employeeNameTime;
  }

  async getTotalHoursEmployeeDetailPage() {
    const tHours = await this.page
      .locator(`//tbody/tr/td/div`)
      .first()
      .textContent();
    return tHours;
  }

  async calculateTotalHoursForEmployee() {
    const fourthColumnCells = this.page.locator(
      `//tbody//*[@role="row"]/td[3]`,
    );
    const texts = await fourthColumnCells.allTextContents();
    let totalMinutes = 0;
    let detectedFormat: 'decimal' | 'colon' | 'hm' | null = null;

    for (const text of texts) {
      if (!text || typeof text !== 'string') {
        console.warn('Skipping invalid time string:', text);
        continue;
      }

      let hours = 0,
        minutes = 0;
      const trimmed = text.trim();

      if (trimmed.includes(':')) {
        // Format: H:MM
        if (!detectedFormat) detectedFormat = 'colon';
        const [hoursStr, minutesStr] = trimmed.split(':');
        hours = Number(hoursStr.trim());
        minutes = Number(minutesStr.trim());
      } else if (trimmed.includes('.')) {
        // Format: H.MM (treat as decimal hours)
        if (!detectedFormat) detectedFormat = 'decimal';
        const floatVal = parseFloat(trimmed);
        if (!isNaN(floatVal)) {
          hours = Math.floor(floatVal);
          minutes = Math.round((floatVal - hours) * 60);
        } else {
          console.warn('Skipping unparsable time string:', text);
          continue;
        }
      } else {
        // Try to match "Xh Ym", "Xh", "Ym"
        const regex = /^(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?$/i;
        const match = trimmed.match(regex);
        if (match && (match[1] || match[2])) {
          if (!detectedFormat) detectedFormat = 'hm';
          hours = match[1] ? Number(match[1]) : 0;
          minutes = match[2] ? Number(match[2]) : 0;
        } else {
          console.warn('Skipping unparsable time string:', text);
          continue;
        }
      }

      if (isNaN(hours) || isNaN(minutes)) {
        console.warn('Skipping unparsable time string:', text);
        continue;
      }
      totalMinutes += hours * 60 + minutes;
    }

    // Format result based on detected format
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    if (detectedFormat === 'decimal') {
      // Return as decimal hours, e.g., 18.25 or 18.00
      const decimal = totalMinutes / 60;
      // Always show two decimals (e.g., 18.00)
      return decimal.toFixed(2);
    } else if (detectedFormat === 'hm') {
      // Return as "18h 0m"
      return `${totalHours}h ${remainingMinutes}m`;
    } else if (detectedFormat === 'colon') {
      // Return as "18:00"
      return `${totalHours}:${remainingMinutes.toString().padStart(2, '0')}`;
    } else {
      // Fallback: return as "H:MM"
      return `${totalHours}:${remainingMinutes.toString().padStart(2, '0')}`;
    }
  }

  async validateColumnSortingCustomerEmployee(
    columnName: string,
    order: 'asc' | 'desc',
  ) {
    const values = await this.getColumnValuesCustomerEmployee(columnName);

    switch (columnName) {
      case 'Total':
      case 'Regular':
      case 'Overtime':
      case 'Paid time off':
        await this.validateDecimalHourColumnSorting(values, order);
        break;
      case 'Name':
        await this.validateNameSorted(values, order);
        break;
      case 'Billable':
        await this.validateDecimalHourColumnSorting(values, order);
        break;
      default:
        throw new Error(`Unsupported column: ${columnName}`);
    }
  }

  async getColumnValuesCustomerEmployee(columnName: string): Promise<string[]> {
    // Get all header cells
    const headerCells = await this.page.locator('//table//thead//th').all();
    let columnIndex = -1;

    for (let i = 0; i < headerCells.length; i++) {
      const headerText = (await headerCells[i].textContent())?.trim();
      if (headerText === columnName) {
        columnIndex = i + 1; // XPath is 1-based
        break;
      }
    }

    if (columnIndex === -1) {
      throw new Error(`Column "${columnName}" not found in table headers.`);
    }

    // Select all cells in the found column
    const cells = await this.page
      .locator(`//table//tbody/tr/td[position()=${columnIndex}]`)
      .all();
    const textContents = await Promise.all(
      cells.map((cell) => cell.textContent()),
    );
    return textContents.filter((text): text is string => text !== null);
  }

  async validateFirstFinishSetupButtonVisibility() {
    return await this.page
      .getByRole('button', { name: 'Finish setup' })
      .first()
      .isVisible();
  }

  async clickFirstFinishSetupButton() {
    return await this.page
      .getByRole('button', { name: 'Finish setup' })
      .first()
      .click();
  }

  async validatePayTypesEditHeaderVisibility() {
    return expect(
      await this.page.getByRole('heading', { name: 'Edit pay types' }),
    ).toBeVisible();
  }

  async clickClosePayTypeEditButton() {
    return await this.page
      .locator(
        `//header[@data-automation-id="undefined_header"]/ descendant::button[@aria-label="Close"]`,
      )
      .click();
  }

  async validateStatusDropdownVisible() {
    return expect(await this.page.getByLabel('Status')).toBeVisible();
  }

  async openStatusDropdown() {
    return await this.page.getByLabel('Status').click();
  }

  async validateStatusDropdownOptions() {
    // Get all status filter options, normalize, and assert against expected
    const labelElements = await this.page
      .locator('//div[@aria-labelledby="status_filter_dropdown"] / ul')
      .allTextContents();
    const labels = labelElements.map((label) => label.trim());
    const expectedLabels = ['All', 'Unapproved', 'Approved'];

    expect(labels.length).toBe(expectedLabels.length);
    expect(labels).toEqual(expectedLabels);
  }

  async clickOptionStatusDropDown(option: string) {
    return await this.page.locator(`//li[text()='${option}']`).click();
  }

  async validateRecordsAfterStatusOptionSelected(
    selectedOption: 'Approved' | 'Unapproved',
  ) {
    let approveBtn;
    let unApproveBtn;
    // Get all rows
    const rows = await this.page.locator('//tbody//*[@role="row"]');
    const rowCount = await rows.count();

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);

      // Check for "Unapprove" button in the row if Approved selected or For "Approve" if Unapproved selected
      if (selectedOption === 'Approved') {
        unApproveBtn = row.locator(
          `xpath = descendant::span[text()='Unapprove']`,
        );
        await expect(unApproveBtn).toBeVisible();

        // Check that "Approve" button is NOT present in the row
        approveBtn = row.locator(`xpath = descendant::span[text()='Approve']`);
        await expect(approveBtn).toHaveCount(0);
      } else {
        // Locator for either "Approve" or "Finish Setup" button
        const approveOrFinishBtn = row.locator(
          `xpath = descendant::span[text()='Approve' or text()='Finish setup']`,
        );
        // Assert that at least one of the buttons is visible
        await expect(approveOrFinishBtn).toBeVisible();

        // Check that "Unapprove" button is NOT present in the row
        unApproveBtn = row.locator(
          `xpath = descendant::span[text()='Unapprove']`,
        );
        await expect(unApproveBtn).toHaveCount(0);
      }
    }
  }

  async getAllColumnsWithSorting() {
    const columns = await this.page
      .locator(
        `//thead/tr[1]/th/descendant::button[contains(@aria-label, "Sort by")] / parent::div`,
      )
      .allTextContents();
    return columns;
  }

  async checkEditVisibleOnlyForUnapproved(empName: string) {
    // Locate the row for 'new, admin'
    const rowLocator = this.page.locator(
      `//div[text()='${empName}']/ancestor::tr`,
    );

    // Find the status cell in the row (assuming the status is in a <span> with text 'Unapproved' or 'Approved')
    // Use two separate locators for clarity
    const unapprovedStatusLocator = rowLocator.locator(
      `xpath=.//span[text()='Unapproved']`,
    );
    const approvedStatusLocator = rowLocator.locator(
      `xpath=.//span[text()='Approved']`,
    );

    let statusText: string | null = null;
    if ((await unapprovedStatusLocator.count()) > 0) {
      statusText =
        (await unapprovedStatusLocator.first().textContent())?.trim() || null;
    } else if ((await approvedStatusLocator.count()) > 0) {
      statusText =
        (await approvedStatusLocator.first().textContent())?.trim() || null;
    }

    // Find the Edit button in the same row
    const editButtonLocator = rowLocator.locator(`xpath=.//*[text()='Edit']`);

    if (statusText === 'Unapproved') {
      // Edit should be visible
      await expect(editButtonLocator.first()).toBeVisible();
    } else {
      // Edit should NOT be visible
      await expect(editButtonLocator.first()).toHaveCount(0);
    }
  }

  async checkViewVisibleOnlyForApproved(empName: string) {
    // Locate the row for 'new, admin'
    const rowLocator = this.page.locator(
      `//div[text()='${empName}']/ancestor::tr`,
    );

    // Find the status cell in the row (assuming the status is in a <span> with text 'Unapproved' or 'Approved')
    const approvedStatusLocator = rowLocator.locator(
      `xpath=.//span[text()='Approved']`,
    );

    let statusText: string | null = null;
    if ((await approvedStatusLocator.count()) > 0) {
      statusText =
        (await approvedStatusLocator.first().textContent())?.trim() || null;
    }

    // Find the Edit and View buttons in the same row
    const editButtonLocator = rowLocator.locator(`xpath=.//*[text()='Edit']`);
    const viewButtonLocator = rowLocator.locator(
      `xpath=.//span[text()='View']`,
    );

    if (statusText === 'Approved') {
      // View should be visible, Edit should NOT be visible
      await expect(viewButtonLocator.first()).toBeVisible();
      await expect(editButtonLocator.first()).toHaveCount(0);
    } else {
      // Optionally, you can assert that View is not visible if not approved
      await expect(viewButtonLocator.first()).toHaveCount(0);
    }
  }
  async clickEditForEmployee() {
    const possibleNames = ['AAA, Test', 'Test AAA'];

    for (const name of possibleNames) {
      const count = await this.page
        .locator(
          `//div[contains(text(), '${name}')] / ancestor::tr / descendant::*[text()='Edit']`,
        )
        .first()
        .count();
      if (count > 0) {
        return await this.page
          .locator(
            `//div[contains(text(), '${name}')] / ancestor::tr / descendant::*[text()='Edit']`,
          )
          .first()
          .click();
      }
    }
    throw new Error('Employee name not found in either format');
  }

  // Clicks the View button for a given employee name
  async clickViewForEmployee(employeeName: string) {
    await this.page
      .locator(
        `//div[contains(text(), '${employeeName}')] / ancestor::tr / descendant::span[text()='View']`,
      )
      .first()
      .click();
  }

  // Gets all table headers as an array of strings
  async getTableHeaders(): Promise<string[]> {
    const tableHeaders = await this.page.locator(
      '//thead//*[@role="row"]/descendant::th',
    );
    return (await tableHeaders.allTextContents())
      .map((h) => h?.trim())
      .filter((h) => h && h.length > 0);
  }

  // Gets all cell values for a given employee row as an array of strings
  async getRowCellsForEmployee(employeeName: string): Promise<string[]> {
    const rowLocator = this.page.locator(
      `//div[contains(text(), '${employeeName}')]/ancestor::tr`,
    );
    const tdLocators = rowLocator.locator('td');
    const tdCount = await tdLocators.count();
    const tds: string[] = [];
    for (let i = 0; i < tdCount; i++) {
      const td = tdLocators.nth(i);
      const text = (await td.textContent())?.trim() ?? '';
      tds.push(text);
    }
    return tds;
  }

  // Returns a mapping of header to cell value for a given employee row
  async getRowObjectForEmployee(
    employeeName: string,
    index: number = 0,
  ): Promise<Record<string, string>> {
    const rows = await this.page.locator(
      `//div[contains(text(), '${employeeName}')]/ancestor::tr`,
    );
    const row = rows.nth(index);
    const headers = await this.getTableHeaders();
    const tds = await row.locator('td').allTextContents();
    const tdsToUse = tds.length > headers.length ? tds.slice(1) : tds;
    return Object.fromEntries(
      headers
        .map((header, idx) => [header, tdsToUse[idx]])
        .filter(([header, value]) => header !== 'Details' && value !== '-'),
    );
  }

  async getRowObjectForAnyEmployeeName(
    possibleNames: string[],
    index: number = 0,
  ): Promise<Record<string, string>> {
    for (const name of possibleNames) {
      const rows = await this.page.locator(
        `//div[contains(text(), '${name}')]/ancestor::tr`,
      );
      if ((await rows.count()) > 0) {
        return this.getRowObjectForEmployee(name, index);
      }
    }
    throw new Error(
      `Employee not found for any of: ${possibleNames.join(', ')}`,
    );
  }

  async validateCustomerValueForSpecificEmployee(
    empName: string,
    customerName: string,
  ) {
    return await expect(
      this.page.locator(
        `//div[text()='${empName}'] / ancestor::tr / descendant::div[text()='${customerName}']`,
      ),
    ).toBeVisible();
  }

  async validateCustomerValueForSpecificEmployeeNotVisible(
    empName: string,
    customerName: string,
  ) {
    return await expect(
      this.page.locator(
        `//div[text()='${empName}'] / ancestor::tr / descendant::div[text()='${customerName}']`,
      ),
    ).not.toBeVisible();
  }

  getFirstLockedRecord() {
    const record = this.page
      .locator(
        '//*[contains(@aria-describedby, "qbds-tooltip")]/ancestor::tr/descendant::span[text()="View"]',
      )
      .first();
    return record;
  }

  async validateCreatedSingleTimeEntryForEmployee(
    empName: string,
    expectedCount: number = 1,
  ) {
    const count = await this.page
      .locator(
        `//tbody//*[@role='row']//div[contains(@class, 'StyledName') and text()='${empName}']`,
      )
      .count();
    expect(count).toBe(expectedCount);
  }

  editButtonForEmployee(employeeName: string): Locator {
    return this.page.locator(
      `//div[contains(text(), '${employeeName}')] / ancestor::tr / descendant::*[text()='Edit']`,
    );
  }

  async expectEditButtonNotVisibleForEmployee(employeeName: string) {
    await expect(this.editButtonForEmployee(employeeName)).not.toBeVisible();
  }

  async checkIfEditButtonVisibleForEmployee(employeeName: string) {
    return await this.editButtonForEmployee(employeeName).isVisible();
  }

  async clickActionDropdownForEmployee(empName: string) {
    // Handle both "Emp, test" and "test Emp" formats
    if (empName === 'Emp, test') {
      return await this.page
        .locator(
          `(//div[text()='Emp, test' or text()='test Emp'] / ancestor::tr / descendant::button[@aria-label="Expand Menu"])[1]`,
        )
        .click();
    }
    return await this.page
      .locator(
        `(//div[text()='${empName}'] / ancestor::tr / descendant::button[@aria-label="Expand Menu"])[1]`,
      )
      .click();
  }

  async clickDeleteInActionDropdown() {
    return await this.page
      .locator(`//li[text()='Delete']`)
      .or(this.page.locator(`//span[text()='Delete']`))
      .click();
  }

  async expectDeleteEntryConfirmationPopupOpen() {
    return await expect(
      this.page.getByText('Are you sure you want to delete this time entry?'),
    ).toBeVisible();
  }

  async clickYesOnDeleteEntryPopup() {
    return await this.page.getByRole('button', { name: 'Yes' }).click();
  }

  async countEmployeeRow(empName: string) {
    // Handle both "Emp, test" and "test Emp" formats
    if (empName === 'Emp, test') {
      return await this.page
        .locator(
          `//div[contains(text(), 'Emp, test') or contains(text(), 'test Emp')]/ancestor::tr`,
        )
        .count();
    }
    return await this.page
      .locator(`//div[contains(text(), '${empName}')]/ancestor::tr`)
      .count();
  }

  async validateCustomerRecordVisible(customerName: string) {
    return await expect(
      this.page.locator(`//div[text()='${customerName}']`),
    ).toBeVisible();
  }
  async clickCustomerName(customerName: string) {
    return await this.page.locator(`//div[text()='${customerName}']`).click();
  }

  async validateEmployeeRecordVisible(empName: string) {
    return await expect(
      this.page.locator(`//div[text()='${empName}']`),
    ).toBeVisible();
  }

  async clickEmployeeName() {
    //return await this.page.locator(`//div[text()='${empName}']`).click();
    const possibleNames = ['Emp1, Test', 'Test Emp1'];

    for (const name of possibleNames) {
      const count = await this.page.locator(`//div[text()='${name}']`).count();
      if (count > 0) {
        return await this.page.locator(`//div[text()='${name}']`).click();
      }
    }
    throw new Error('Employee name not found in either format');
  }

  async getTableHeaderEmployeeDetailsView() {
    const tableHeaders = await this.page.locator(
      `//tr[contains(@class, 'TimeDetailsTable')] / th`,
    );
    return (await tableHeaders.allTextContents())
      .map((h) => h?.trim())
      .filter((h) => h && h.length > 0);
  }

  async getRowCellsForEmployeeDetailsView(): Promise<string[]> {
    const rowLocator = this.page.locator(
      `//tbody/ tr / td[contains(@class, 'TimeDetailRow')]`,
    );
    const tdCount = await rowLocator.count();
    const tds: string[] = [];
    for (let i = 0; i < tdCount; i++) {
      const td = rowLocator.nth(i);
      const text = (await td.textContent())?.trim() ?? '';
      tds.push(text);
    }
    return tds;
  }

  async getRowObjectForEmployeeDetaisView(): Promise<Record<string, string>> {
    const headers = await this.getTableHeaderEmployeeDetailsView();
    const tds = await this.getRowCellsForEmployeeDetailsView();
    const tdsToUse = tds.length > headers.length ? tds.slice(1) : tds;
    return Object.fromEntries(
      headers
        .map((header, idx) => [header, tdsToUse[idx]])
        .filter(([header, value]) => header !== 'Details' && value !== '-'),
    );
  }

  async clickTimeOffSection() {
    return await this.page
      .getByRole('link', { name: 'Time off Time off' })
      .click();
  }

  async navigateToTimeOff() {
    return await this.page.goto(`/app/time/time-off?jobId=time`, {
      waitUntil: 'load',
    });
  }

  getAllRowsForAnEmployee(empName: string) {
    // Handle both "Emp, test" and "test Emp" formats
    if (empName === 'Emp, test') {
      return this.page.locator(
        `//div[contains(text(), 'Emp, test') or contains(text(), 'test Emp')]/ancestor::tr`,
      );
    }
    return this.page.locator(
      `//div[contains(text(), '${empName}')]/ancestor::tr`,
    );
  }

  async waitForTableOrNoEntriesMessage() {
    await Promise.race([
      this.page.waitForSelector(`//thead//*[@role="row"]/descendant::th`, {
        state: 'visible',
        timeout: 15000,
      }),
      this.page.waitForSelector(
        `//*[text()='No time entries yet' or text()='No time for this date range']`,
        {
          state: 'visible',
          timeout: 15000,
        },
      ),
    ]);
  }

  async getTimeEntryError(): Promise<string> {
    const errorElement = await this.page.getByRole('alert');
    return (await errorElement.textContent()) || '';
  }

  async validateAddedBreaksEntryExistsForEmployee(
    breakName: string,
    empName: string,
  ) {
    // Find a table row that contains both the break name and employee name as separate elements
    // This approach works when both elements are within the same table row but not necessarily parent-child
    const rowLocator = this.page
      .locator('tr')
      .filter({
        has: this.page.locator(`div:has-text("${breakName}")`),
      })
      .filter({
        has: this.page.locator(`div:has-text("${empName}")`),
      });

    await expect(rowLocator.first()).toBeVisible();
  }

  // Utility function to handle popups that may appear in any order
  async handlePopupsInAnyOrder(): Promise<void> {
    await this.page.waitForTimeout(3000); // Increased initial wait for late-appearing popups
    let popupsHandled = 0;
    const maxAttempts = 10; // Prevent infinite loops
    // First do a quick check to see if any popups are immediately visible
    const hasImmediatePopups = await this.checkForImmediatePopups(this.page);
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
            .getByText('Just around the corner')
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
  async waitForPageReady(page: Page): Promise<void> {
    try {
      // Wait for either the loading spinner to appear and disappear, or key page elements to be visible
      await Promise.race([
        // Option 1: Wait for loading spinner to finish
        page
          .locator('[data-testid="LoadingSpinner"]')
          .waitFor({ state: 'visible', timeout: 2000 })
          .then(() =>
            page.locator('[data-testid="LoadingSpinner"]').waitFor({
              state: 'hidden',
              timeout: 10000,
            }),
          ),
        // Option 2: Wait for key page elements that indicate the page is ready
        Promise.all([
          page
            .locator('[data-testid="DateRangeSelect"], .DateRangeSelect')
            .waitFor({ state: 'visible', timeout: 10000 }),
          page
            .locator(
              '[aria-label="Display by"], [data-testid="DisplayByDropdown"]',
            )
            .waitFor({ state: 'visible', timeout: 10000 }),
        ]),
      ]);
      // Small buffer to ensure any immediate popups have time to appear
      await page.waitForTimeout(500);
    } catch (error) {
      // If specific elements aren't found, fall back to a shorter wait
      await page.waitForTimeout(2000);
    }
  }
  // Helper method to quickly check if any popups are immediately visible
  async checkForImmediatePopups(page: Page): Promise<boolean> {
    try {
      // Use Promise.race to check all popup types with very short timeout
      await Promise.race([
        page
          .getByRole('heading', {
            name: 'A faster way to enter time',
          })
          .waitFor({ state: 'visible', timeout: 100 }),
        page
          .getByText('Just around the corner')
          .waitFor({ state: 'visible', timeout: 100 }),
        page
          .getByText('QuickBooks Time got a glow-up')
          .waitFor({ state: 'visible' }),
        page
          .locator('text="Streamlined time settings"')
          .or(page.getByRole('heading', { name: 'Streamlined time settings' }))
          .waitFor({ state: 'visible', timeout: 100 }),
        page
          .getByTestId('ModalDialog')
          .getByRole('heading', { name: 'Single time entry' })
          .waitFor({ state: 'visible', timeout: 100 }),
        page
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

  // ============= Break Entry Related Methods =============

  async validateDisplayByDropdownVisible() {
    return await expect(
      this.page.locator(
        `//span[text()='Display by'] / ancestor::label / descendant::input`,
      ),
    ).toBeVisible();
  }

  async validateApproveButtonVisible(employeeName: string) {
    return await expect(
      this.page.locator(
        `//div[text()='${employeeName}'] / ancestor::tr / descendant::button/span[text()='Approve']`,
      ),
    ).toBeVisible();
  }

  async clickApproveButton(employeeName: string) {
    return await this.page
      .locator(
        `//div[text()='${employeeName}'] / ancestor::tr / descendant::button/span[text()='Approve']`,
      )
      .click();
  }

  async validateLockTimeDialog() {
    return await expect(
      this.page.locator(`//*[contains(text(), 'Lock time through')]`),
    ).toBeVisible();
  }

  async clickApproveAndLockTimeButton() {
    return await this.page
      .locator(`//*[text()='Approve and lock time']`)
      .click();
  }

  async waitForApprovalProcessing() {
    return await this.page.waitForSelector(
      `//*[@aria-label="Please wait..."]`,
      { state: 'hidden', timeout: 0 },
    );
  }

  async validateTimeApprovedMessage(employeeName: string) {
    return await expect(
      this.page.locator(`//*[@aria-label="Time approved for ${employeeName}"]`),
    ).toBeVisible();
  }

  async validateUnapproveButtonVisible(employeeName: string) {
    return await expect(
      this.page.locator(
        `//div[text()='${employeeName}'] / ancestor::tr / descendant::button/span[text()='Unapprove']`,
      ),
    ).toBeVisible();
  }

  async clickUnapproveButton(employeeName: string) {
    return await this.page
      .locator(
        `//div[text()='${employeeName}'] / ancestor::tr / descendant::button/span[text()='Unapprove']`,
      )
      .click();
  }

  async validateUnapproveConfirmationDialog(employeeName: string) {
    const firstName =
      employeeName.split(' ')[1] || employeeName.split(',')[1]?.trim();
    return await expect(
      this.page.locator(`//*[text()='Unapprove time for ${firstName}?']`),
    ).toBeVisible();
  }

  async clickUnapproveAndUnlockTimeButton() {
    return await this.page
      .locator(`//button/*[text()='Unapprove and unlock time']`)
      .click();
  }

  async validateTimeUnapprovedMessage() {
    return await expect(
      this.page.locator(`//*[contains(text(), "Time unapproved for")]`),
    ).toBeVisible();
  }

  async validateApprovedRowWithViewButton(employeeName: string) {
    return await expect(
      this.page.locator(
        `//div[text()='${employeeName}'] / ancestor::tr[descendant::*[text()='Approved'] and descendant::*[text()='View']]`,
      ),
    ).toBeVisible();
  }

  async clickViewButtonForEmployee(employeeName: string) {
    return await this.page
      .locator(
        `//div[text()='${employeeName}'] / ancestor::tr / descendant::*[text()='View']`,
      )
      .click();
  }

  async validateUpdatedHoursForEmployee(employeeName: string, hours: string) {
    return await expect(
      this.page.locator(
        `//div[text()='${employeeName}'] / ancestor::tr / descendant::*[text()='${hours}']`,
      ),
    ).toBeVisible();
  }
}

export default TimeEntriesPage;
