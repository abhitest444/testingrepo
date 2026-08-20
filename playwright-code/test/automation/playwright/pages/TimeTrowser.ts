import { Page } from '@playwright/test';

export const OIGQL_URL_PATTERN =
  /https:\/\/sbseggraphqlorch.*\.api\.intuit\.com/;

export const SETTINGS_FACADE_URL_PATTERN =
  /https:\/\/settingsfacade.*\.api\.intuit\.com/;

export const EMPLOYEE_DETAILS_URL_PATTERN =
  /https:\/\/api.qbo.*\.onlinepayroll\.intuit\.com/;

export const VENDOR_DETAILS_URL_PATTERN =
  /https:\/\/(?:e2e\.)?qbo\.intuit\.com\/api\/v4\/graphql/;

export const waitForResponseWithURLandBody = async (
  page: Page,
  urlPattern: RegExp,
  // eslint-disable-next-line no-unused-vars
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

export const waitForResponseWithURLandBodyWTA = async (
  page: Page,
  urlPattern: RegExp,
  // eslint-disable-next-line no-unused-vars
  respondBodyMatcher: (input: any) => boolean,
): Promise<any | undefined> => {
  const matchedResponse = await page.waitForResponse(async (response) => {
    if (urlPattern.test(response.url()) && response.status() === 200) {
      try {
        await page.waitForTimeout(5000);
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

export const matchCompanySettingsResponse = (responseBody: any) =>
  responseBody &&
  responseBody.data &&
  responseBody.data.qbAppFoundationQbSettings;

export const matchEmployeeDetailsResponse = (responseBody: any) =>
  responseBody &&
  responseBody.data &&
  responseBody.data.company &&
  responseBody.data.company.employee &&
  responseBody.data.company.employee.employmentDetail &&
  responseBody.data.company.employee.employmentDetail.jobCosting;

// export const matchVendorDetailsResponse = (responseBody: any) =>
//   responseBody && responseBody.Vendor;

export const matchVendorDetailsResponse = (responseBody: any) =>
  responseBody &&
  responseBody.data &&
  responseBody.data.node &&
  responseBody.data.node.profiles &&
  responseBody.data.node.profiles.vendor;

export const matchServicesDetailsResponse = (responseBody: any) =>
  responseBody &&
  responseBody.data &&
  responseBody.data.products &&
  responseBody.data.products.data;

class TimeTrowser {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  navigateToSingleTime(id = null) {
    if (id) {
      return this.page.goto(`/app/timeactivity?id=${id}`);
    }
    return this.page.goto(`/app/timeactivity`);
  }

  navigateToWeeklyTime() {
    return this.page.goto(`/app/timetracking`);
  }

  getByCss(cssSelector: string) {
    return this.page.locator(cssSelector);
  }

  getByText(text: string) {
    return this.page.getByText(text);
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
    // Poll for the dropdown menu to appear.
    // Sadly this is necessary to account for some preference such as UxPreferenceKey.TIME_ENTRY_TIME_FOR
    // which change the form around the same time the dropdown is opened, causing it to not open correctly.
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
      } catch {
        retries++;
      }
    }
  }

  // TODO it still gets stuck here despite `openDropdown` validating visibility of option
  clickDropdownOption(n = 1) {
    return this.page.getByRole('option').nth(n).click();
  }

  toggleCheckbox(label: string) {
    return this.page.getByLabel(label).check();
  }

  clickButton(buttonText: string) {
    return this.page
      .getByRole('button', { name: buttonText, exact: true })
      .click();
  }
}

export default TimeTrowser;
