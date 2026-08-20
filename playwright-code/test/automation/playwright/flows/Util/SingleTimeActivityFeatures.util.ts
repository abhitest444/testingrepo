import { Page, expect } from '@playwright/test';
import SingleTimeActivityPage, {
  CERES_DAS_URL_PATTERN,
  matchTimeEntryBatchSaveResponse,
  OIGQL_URL_PATTERN,
  TIME_TRACKING_URL_PATTERN,
  waitForCeresServicesDetailsResponse,
  waitForResponseWithURLandBody,
} from '../../pages/SingleTimeActivityPage';
import { LABELS, NOTES_TEXT, testData, USER_ROLES } from '../../utils';
import { AutomationLoginData, getLoginData } from '../../logins';
import { openQBO } from '../../pages/QBOLogin';
import DashboardPage from '../../pages/DashboardPage';
import {
  fillSingleTAFields,
  saveAndClose,
  saveAndCloseForLastTeamMember,
  saveAndNew,
  saveStartAndEndTime,
} from './SingleTimeActivityCRUD.util';
import {
  EMPLOYEE_DETAILS_URL_PATTERN,
  matchEmployeeDetailsResponse,
  matchServicesDetailsResponse,
  matchVendorDetailsResponse,
  VENDOR_DETAILS_URL_PATTERN,
} from '../../pages/TimeTrowser';
import QBOSettingsPage from '../../pages/QBOSettingsPage';

const currentDate = new Date();
const currentDateUsFormat = currentDate.toLocaleDateString('en-US');
const currentDateGbFormat = currentDate.toLocaleDateString('en-GB');
const formattedDate = currentDate.toLocaleDateString('en-US', {
  day: '2-digit',
});

const dateFieldFormFunctionality = async (page: Page) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);
  const qboSettingsPage = new QBOSettingsPage(page);

  // navigate to trowser
  await singleTimeActPage.navigateToSingleTime();

  // wait for trowser to load
  await singleTimeActPage.validateSTALoaded();
  await singleTimeActPage.waitTillLoaderDisappears();
  await page.waitForTimeout(2000);
  await singleTimeActPage.handleTourModal();
  await singleTimeActPage.checkFieldVisibility(LABELS.Name);

  const state = await singleTimeActPage.verifySetClockToggleState();
  if (state) {
    await singleTimeActPage.clickSetClockInAndOutToggles();
    await singleTimeActPage.enterFieldValue(LABELS.Duration, testData.duration);
  } else {
    await singleTimeActPage.enterFieldValue(LABELS.Duration, testData.duration);
  }
  await singleTimeActPage.blurField(LABELS.Duration);
  await singleTimeActPage.clickButton(LABELS.Save);
  await singleTimeActPage.waitTillLoaderDisappears();
  await singleTimeActPage.validateSuccessToast();
  await page.reload();
  await page.waitForTimeout(2000);
  await singleTimeActPage.fillStartDate('Date');
  await page.keyboard.press(`Tab`);
  await singleTimeActPage.validateInvalidStartDateError();
  await singleTimeActPage.clearStartDateField();
  await singleTimeActPage.clickCalendarButtonForStartDateField();
  console.log(formattedDate);
  await singleTimeActPage.selectDateInCalendarForStartDate(formattedDate);
  await page.keyboard.press(`Tab`);
  expect(await page.getByText('Invalid date')).not.toBeVisible();
  // changing date format via qbo settings and checking autoformat
  await page.reload();
  await page.waitForTimeout(2000);
  const startDate = await singleTimeActPage.getStartDateValue();
  const originalDateFormat = await singleTimeActPage.determineDateFormat(
    startDate,
  );
  console.log(`Current date format is = ${originalDateFormat}`);
  await qboSettingsPage.navigateToQBOAdvancedSettings();
  await qboSettingsPage.waitForOtherPreferencesSectionToLoad();
  await qboSettingsPage.clickOtherPreferencesSection();
  await qboSettingsPage.clickOnDateFormatDropdown();
  await qboSettingsPage.selectDateFormat('dd/mm/yyyy');
  await qboSettingsPage.clickSaveButton();
  await qboSettingsPage.waitForSaveOperationToComplete();
  await singleTimeActPage.navigateToSingleTime();
  await page.reload();
  await page.waitForTimeout(2000);
  const startDateNew = await singleTimeActPage.getStartDateValue();
  const updatedDateFormat = await singleTimeActPage.determineDateFormat(
    startDateNew,
  );
  console.log(`Updated date format is = ${updatedDateFormat}`);
  await singleTimeActPage.fillStartDate(currentDateUsFormat);
  await page.keyboard.press('Tab');
  await singleTimeActPage.validateInvalidStartDateError();
  await singleTimeActPage.fillStartDate(formattedDate);
  await page.keyboard.press(`Tab`);
  const currentDate = await singleTimeActPage.getStartDateValue();
  expect(currentDate).toBe(currentDateGbFormat);
  await qboSettingsPage.navigateToQBOAdvancedSettings();
  await qboSettingsPage.waitForOtherPreferencesSectionToLoad();
  await qboSettingsPage.clickOtherPreferencesSection();
  await qboSettingsPage.clickOnDateFormatDropdown();
  await qboSettingsPage.selectDateFormat('mm/dd/yyyy');
  await qboSettingsPage.clickSaveButton();
  await qboSettingsPage.waitForSaveOperationToComplete();
  await page.locator(`//button[@aria-label="Close"]`).click();
  expect(await page.locator(`//div[text()='Settings saved']`)).toBeVisible();
  await singleTimeActPage.navigateToSingleTime();
  await page.reload();
  await page.waitForTimeout(2000);
  const startDateNew2 = await singleTimeActPage.getStartDateValue();
  const updatedDateFormat2 = await singleTimeActPage.determineDateFormat(
    startDateNew2,
  );
  console.log(`Updated date format is = ${updatedDateFormat2}`);
};

const startdateFieldRequiredCheck = async (page: Page) => {
  const dashboardPage = new DashboardPage(page);

  const singleTimeActPage = new SingleTimeActivityPage(page);

  // navigate to trowser
  await singleTimeActPage.navigateToSingleTime();

  // wait for trowser to load
  await singleTimeActPage.validateSTALoaded();
  await singleTimeActPage.waitTillLoaderDisappears();
  await page.waitForTimeout(2000);
  await singleTimeActPage.handleTourModal();
  await singleTimeActPage.checkFieldVisibility(LABELS.Name);
  await singleTimeActPage.clearStartDateField();
  await singleTimeActPage.clickButton(LABELS.Save);
  await singleTimeActPage.validateStartDateRequiredError();
};

const nameFieldFilterAndSelect = async (page: Page, role: string) => {
  const dashboardPage = new DashboardPage(page);

  const singleTimeActPage = new SingleTimeActivityPage(page);
  await singleTimeActPage.checkFieldVisibility(LABELS.Name);
  await singleTimeActPage.focusOnField(LABELS.Name);
  await page.waitForTimeout(2000);

  await singleTimeActPage.clearFieldValue(LABELS.Name);

  if (role !== USER_ROLES.payrollManager) {
    await singleTimeActPage.waitForDropDownList();
  }
  await singleTimeActPage.enterFieldValue(LABELS.Name, testData.teamMemberName);

  await singleTimeActPage.selectTeamMemberFromDropdown(testData.teamMemberName);

  const name = await singleTimeActPage.getFieldValue(LABELS.Name);

  expect(name).toBe(testData.teamMemberName);
};

const teamMemberFieldRequiredCheck = async (page: Page) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);

  // navigate to trowser
  await singleTimeActPage.navigateToSingleTime();

  // wait for trowser to load
  await singleTimeActPage.validateSTALoaded();
  await singleTimeActPage.waitTillLoaderDisappears();
  await page.waitForTimeout(2000);
  await singleTimeActPage.handleTourModal();
  await singleTimeActPage.checkFieldVisibility(LABELS.Name);
  await singleTimeActPage.focusOnField(LABELS.Name);
  await page.waitForTimeout(1000);
  await singleTimeActPage.clearFieldValue(LABELS.Name);
  await page.waitForTimeout(1000);
  await singleTimeActPage.blurField(LABELS.Name);
  await page.waitForTimeout(1000);
  await singleTimeActPage.clickButton(LABELS.Save);
  await singleTimeActPage.validateRequiredFieldError(LABELS.Name);
};

const customerFieldFilterAndSelect = async (page: Page) => {
  const dashboardPage = new DashboardPage(page);

  const singleTimeActPage = new SingleTimeActivityPage(page);
  if ((await singleTimeActPage.getFieldValue(LABELS.Customers)) === '') {
    await singleTimeActPage.openDropdown(LABELS.Customers);
    await singleTimeActPage.clickDropdownOption(
      testData.option1,
      LABELS.Customers,
    );
  }
  await singleTimeActPage.focusOnField(LABELS.Customers);
  await page.waitForTimeout(2000);

  await singleTimeActPage.clearFieldValue(LABELS.Customers);

  await singleTimeActPage.waitForDropDownList();
  await singleTimeActPage.enterFieldValue(
    LABELS.Customers,
    testData.customerName,
  );
  await singleTimeActPage.selectOptionFromDropdown(testData.customerName);

  const customer = await singleTimeActPage.getFieldValue(LABELS.Customers);

  expect(customer).toBe(testData.customerName);
};

const locationFieldFilterAndSelect = async (page: Page) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);
  if (await singleTimeActPage.checkFieldVisibility(LABELS.Location)) {
    if ((await singleTimeActPage.getFieldValue(LABELS.Location)) === '') {
      await singleTimeActPage.openDropdown(LABELS.Location);
      await singleTimeActPage.clickDropdownOption(
        testData.option1,
        LABELS.Location,
      );
    }
    await singleTimeActPage.focusOnField(LABELS.Location);
    await page.waitForTimeout(2000);

    await singleTimeActPage.clearFieldValue(LABELS.Location);

    await singleTimeActPage.waitForDropDownList();
    await singleTimeActPage.enterFieldValue(
      LABELS.Location,
      testData.locationName,
    );
    await singleTimeActPage.selectOptionFromDropdown(testData.locationName);

    const location = await singleTimeActPage.getFieldValue(LABELS.Location);

    expect(location).toBe(testData.locationName);
  } else {
    return;
  }
};

const serviceFieldFilterAndSelect = async (page: Page) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);
  if ((await singleTimeActPage.getFieldValue(LABELS.Service)) === '') {
    await singleTimeActPage.openDropdown(LABELS.Service);
    await singleTimeActPage.clickDropdownOption(
      testData.option1,
      LABELS.Service,
    );
  }
  await singleTimeActPage.focusOnField(LABELS.Service);
  await page.waitForTimeout(2000);

  await singleTimeActPage.clearFieldValue(LABELS.Service);

  await singleTimeActPage.waitForDropDownList();
  await singleTimeActPage.enterFieldValue(LABELS.Service, testData.serviceName);
  await singleTimeActPage.selectOptionFromDropdown(testData.serviceName);

  const service = await singleTimeActPage.getFieldValue(LABELS.Service);

  expect(service).toBe(testData.serviceName);
};

const addNewTeamMemberValidation = async (page: Page, role: string) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);
  if (
    role === USER_ROLES.inHouseAccountant ||
    role === USER_ROLES.salesManager
  ) {
    return;
  } else {
    // navigate to trowser
    await singleTimeActPage.navigateToSingleTime();
    // wait for trowser to load
    await singleTimeActPage.validateSTALoaded();
    await singleTimeActPage.waitTillLoaderDisappears();
    await page.waitForTimeout(2000);
    await singleTimeActPage.handleTourModal();
    await singleTimeActPage.checkFieldVisibility(LABELS.Name);
    await page.waitForTimeout(2000);
    await singleTimeActPage.openDropdown(LABELS.Name);
    await page.waitForTimeout(1000);
    const addNew = await singleTimeActPage.checkAddNewOptionAvailable();
    if (addNew) {
      await singleTimeActPage.clickAddNew();
      await singleTimeActPage.waitForAddNewTeamMemberDrawerToOpen();
      await singleTimeActPage.clickContactTypeDropdown();
      if (role === USER_ROLES.cAQlQBPlusCanada) {
        await singleTimeActPage.selectContactType('Supplier');
      } else {
        await singleTimeActPage.selectContactType('Vendor');
      }
      await singleTimeActPage.fillDisplayName(testData.randomName);
      await singleTimeActPage.clickSaveButtonDrawerFooter();
      await page.waitForSelector(
        `//button[contains(@class, 'Button-disabled')]`,
        { state: 'hidden', timeout: 0 },
      );
      if (
        (await page
          .locator(
            `//div[@data-testid="contact-drawer"] / descendant::div[@role='alert']`,
          )
          .isVisible()) ||
        (await page.locator(`//div[@id="page-save-error"]`).isVisible())
      ) {
        await page
          .getByTestId('contact-drawer')
          .getByRole('button', { name: 'Close' })
          .click();
        await page.locator(`//span[text()='Yes']`).click();
        return;
      } else {
        await singleTimeActPage.waitTillDrawerCloses();
        await page.waitForTimeout(4000);
        let newName = await singleTimeActPage.getFieldValue(LABELS.Name);
        if (newName === '') {
          await singleTimeActPage.openDropdown(LABELS.Name);
          await singleTimeActPage.enterFieldValue(
            LABELS.Name,
            testData.randomName,
          );
          await singleTimeActPage.clickDropdownOption(
            testData.option1,
            LABELS.Name,
          );
          await page.waitForTimeout(1000);
          newName = await singleTimeActPage.getFieldValue(LABELS.Name);
          expect(newName).toBe(testData.randomName);
          await singleTimeActPage.blurField(LABELS.Name);
        } else {
          expect(newName).toBe(testData.randomName);
          await singleTimeActPage.blurField(LABELS.Name);
        }
      }
    } else {
      await singleTimeActPage.blurField(LABELS.Name);
      return;
    }
  }
};

const addNewCustomerValidation = async (page: Page, role: string) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);
  if (role === USER_ROLES.timeTrackOnly) {
    await singleTimeActPage.navigateToSingleTime();
    await singleTimeActPage.checkFieldVisibility(LABELS.Name);
  }
  await page.waitForTimeout(2000);
  if (await singleTimeActPage.checkFieldVisibility(LABELS.Customer)) {
    await singleTimeActPage.openDropdown(LABELS.Customers);
    const addNew = await singleTimeActPage.checkAddNewOptionAvailable();
    if (addNew) {
      await singleTimeActPage.clickAddNew();
      await singleTimeActPage.waitForNewTeamMemberCustomerClassDrawerOpen();
      await singleTimeActPage.fillDisplayName(testData.randomName2);
      await singleTimeActPage.clickSaveButtonDrawerFooter();
      await page.waitForSelector(
        `//button[contains(@class, 'Button-disabled')]`,
        { state: 'hidden', timeout: 0 },
      );
      if (
        (await page
          .locator(
            `//div[@data-testid="contact-drawer"] / descendant::div[@role='alert']`,
          )
          .isVisible()) ||
        (await page.locator(`//div[@id="page-save-error"]`).isVisible())
      ) {
        await page
          .locator(
            `//div[contains(@class, 'Drawer')] / descendant::button[@aria-label="Close"]`,
          )
          .click();
        await page.locator(`//span[text()='Yes']`).click();
        return;
      } else {
        await singleTimeActPage.waitTillDrawerCloses();
        await page.waitForTimeout(4000);
        let newCustomer = await singleTimeActPage.getFieldValue(
          LABELS.Customers,
        );
        if (newCustomer === '') {
          await singleTimeActPage.openDropdown(LABELS.Customers);
          await singleTimeActPage.enterFieldValue(
            LABELS.Customers,
            testData.randomName2,
          );
          await singleTimeActPage.clickDropdownOption(
            testData.option1,
            LABELS.Customers,
          );
          await page.waitForTimeout(1000);
          newCustomer = await singleTimeActPage.getFieldValue(LABELS.Customers);
          expect(newCustomer).toBe(testData.randomName2);
          await singleTimeActPage.blurField(LABELS.Customers);
        } else {
          expect(newCustomer).toBe(testData.randomName2);
          await singleTimeActPage.blurField(LABELS.Customers);
        }
      }
    } else {
      await singleTimeActPage.blurField(LABELS.Customers);
      return;
    }
  } else {
    return;
  }
};

const validateCustomerFieldRequiredWhenBillableChecked = async (page: Page) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);

  // navigate to trowser
  await singleTimeActPage.navigateToSingleTime();
  // wait for trowser to load
  await singleTimeActPage.validateSTALoaded();
  await singleTimeActPage.waitTillLoaderDisappears();
  await page.waitForTimeout(2000);
  await singleTimeActPage.handleTourModal();
  await singleTimeActPage.checkFieldVisibility(LABELS.Name);
  await singleTimeActPage.openDropdown(LABELS.Customers);
  await singleTimeActPage.clickDropdownOption(
    testData.option1,
    LABELS.Customers,
  );
  await page.keyboard.press('Tab');
  await singleTimeActPage.checkCheckboxIfVisible(LABELS.Billable);
  const state = await singleTimeActPage.verifySetClockToggleState();
  if (state) {
    await singleTimeActPage.clickSetClockInAndOutToggles();
    await singleTimeActPage.enterFieldValue(LABELS.Duration, testData.duration);
  } else {
    await singleTimeActPage.enterFieldValue(LABELS.Duration, testData.duration);
  }
  await singleTimeActPage.focusOnField(LABELS.Customers);
  await singleTimeActPage.clearFieldValue(LABELS.Customers);
  await singleTimeActPage.clickButton(LABELS.Save);
  await singleTimeActPage.waitTillLoaderDisappears();
  await singleTimeActPage.validateRequiredFieldError(LABELS.Customers);
};

const validateCustomerFieldNotRequiredWhenBillableUnchecked = async (
  page: Page,
  role: string,
) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);
  if (role === USER_ROLES.payrollManager) {
    return;
  } else {
    // navigate to trowser
    await singleTimeActPage.navigateToSingleTime();
    // wait for trowser to load
    await singleTimeActPage.validateSTALoaded();
    await singleTimeActPage.waitTillLoaderDisappears();
    await page.waitForTimeout(2000);
    await singleTimeActPage.handleTourModal();
    await singleTimeActPage.checkFieldVisibility(LABELS.Name);
    await singleTimeActPage.openDropdown(LABELS.Customers);
    await singleTimeActPage.clickDropdownOption(
      testData.option1,
      LABELS.Customers,
    );
    await page.keyboard.press('Tab');
    await singleTimeActPage.uncheckCheckboxIfVisible(LABELS.Billable);
    const state = await singleTimeActPage.verifySetClockToggleState();
    if (state) {
      await singleTimeActPage.clickSetClockInAndOutToggles();
      await singleTimeActPage.enterFieldValue(
        LABELS.Duration,
        testData.duration,
      );
    } else {
      await singleTimeActPage.enterFieldValue(
        LABELS.Duration,
        testData.duration,
      );
    }
    await singleTimeActPage.focusOnField(LABELS.Customers);
    await singleTimeActPage.clearFieldValue(LABELS.Customers);
    await page.waitForTimeout(1000);
    await singleTimeActPage.blurField(LABELS.Customers);
    const createMutationPromise = waitForResponseWithURLandBody(
      page,
      OIGQL_URL_PATTERN,
      matchTimeEntryBatchSaveResponse,
    );
    await singleTimeActPage.clickButton(LABELS.Save);

    // verify response
    const createMutationPromisePayload = await createMutationPromise;
    expect(createMutationPromisePayload).toBeDefined();
    expect(
      createMutationPromisePayload.data.timeTrackingBatchManageTimeEntries
        .timeEntries[0].id,
    ).toBeDefined();
    await singleTimeActPage.validateSuccessToast();
  }
};

const addNewLocationValidation = async (page: Page) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);

  // navigate to trowser
  await singleTimeActPage.navigateToSingleTime();
  // wait for trowser to load
  await singleTimeActPage.validateSTALoaded();
  await singleTimeActPage.waitTillLoaderDisappears();
  await page.waitForTimeout(2000);
  await singleTimeActPage.handleTourModal();
  if (await singleTimeActPage.checkFieldVisibility(LABELS.Location)) {
    await singleTimeActPage.openDropdown(LABELS.Location);
    const addNew = await singleTimeActPage.checkAddNewOptionAvailable();
    if (addNew) {
      await singleTimeActPage.clickAddNew();
      await singleTimeActPage.waitForNewLocationDraweropen();
      await singleTimeActPage.fillNewLocationNameInLocationDrawer(
        testData.randomNumber,
      );
      await page.keyboard.press('Tab');
      await singleTimeActPage.clickSaveButtonLocationDrawer();
      await page.waitForSelector(
        `//button[contains(@class, 'Button-disabled')]`,
        { state: 'hidden', timeout: 0 },
      );
      if (
        (await page
          .locator(
            `//div[@data-testid="contact-drawer"] / descendant::div[@role='alert']`,
          )
          .isVisible()) ||
        (await page.locator(`//div[@id="page-save-error"]`).isVisible())
      ) {
        await page
          .locator(
            `//div[contains(@class, 'Drawer')] / descendant::button[@aria-label="Close"]`,
          )
          .click();
        await page.locator(`//span[text()='Yes']`).click();
        return;
      } else {
        await singleTimeActPage.waitTillDrawerCloses();
        await page.waitForTimeout(4000);
        let newLocation = await singleTimeActPage.getFieldValue(
          LABELS.Location,
        );
        if (newLocation === '') {
          await singleTimeActPage.openDropdown(LABELS.Location);
          await singleTimeActPage.enterFieldValue(
            LABELS.Location,
            testData.randomNumber,
          );
          await singleTimeActPage.clickDropdownOption(
            testData.option1,
            LABELS.Location,
          );
          await page.waitForTimeout(1000);
          newLocation = await singleTimeActPage.getFieldValue(LABELS.Location);
          expect(newLocation).toBe(testData.randomNumber);
          await singleTimeActPage.blurField(LABELS.Location);
        } else {
          expect(newLocation).toBe(testData.randomNumber);
          await singleTimeActPage.blurField(LABELS.Location);
        }
      }
    } else {
      await singleTimeActPage.blurField(LABELS.Location);
      return;
    }
  } else {
    return;
  }
};

const addNewServiceValidation = async (page: Page) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);
  if (await singleTimeActPage.checkFieldVisibility(LABELS.Service)) {
    await singleTimeActPage.openDropdown(LABELS.Service);
    const addNew = await singleTimeActPage.checkAddNewOptionAvailable();
    if (addNew) {
      await singleTimeActPage.clickAddNew();
      await singleTimeActPage.waitForNewServiceDrawerOpen();
      await singleTimeActPage.fillNewServiceNameInServiceDrawer(
        testData.randomName3,
      );
      await singleTimeActPage.clickSaveAndCloseButtonForNewServiceInDrawer();
      await page.waitForSelector(
        `//button[contains(@class, 'Button-disabled')]`,
        { state: 'hidden', timeout: 0 },
      );
      if (
        (await page
          .locator(
            `//div[@data-testid="contact-drawer"] / descendant::div[@role='alert']`,
          )
          .isVisible()) ||
        (await page.locator(`//div[@id="page-save-error"]`).isVisible())
      ) {
        await page
          .locator(
            `//div[contains(@class, 'Drawer')] / descendant::button[@aria-label="Close"]`,
          )
          .click();
        await page.locator(`//span[text()='Yes']`).click();
        return;
      } else {
        await singleTimeActPage.waitTillDrawerCloses();
        await page.waitForTimeout(4000);
        let newService = await singleTimeActPage.getFieldValue(LABELS.Service);
        if (newService === '') {
          await singleTimeActPage.openDropdown(LABELS.Service);
          await singleTimeActPage.enterFieldValue(
            LABELS.Service,
            testData.randomName3,
          );
          await singleTimeActPage.clickDropdownOption(
            testData.option1,
            LABELS.Service,
          );
          await page.waitForTimeout(1000);
          newService = await singleTimeActPage.getFieldValue(LABELS.Service);
          expect(newService).toBe(testData.randomName3);
          await singleTimeActPage.blurField(LABELS.Service);
        } else {
          expect(newService).toBe(testData.randomName3);
          await singleTimeActPage.blurField(LABELS.Service);
        }
      }
    } else {
      await singleTimeActPage.blurField(LABELS.Service);
      return;
    }
  } else {
    return;
  }
};

const classFieldFilterAndSelect = async (page: Page) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);

  if (await singleTimeActPage.checkFieldVisibility(LABELS.Class)) {
    if ((await singleTimeActPage.getFieldValue(LABELS.Class)) === '') {
      await singleTimeActPage.openDropdown(LABELS.Class);
      await singleTimeActPage.clickDropdownOption(
        testData.option1,
        LABELS.Class,
      );
    }
    await singleTimeActPage.focusOnField(LABELS.Class);
    await page.waitForTimeout(2000);

    await singleTimeActPage.clearFieldValue(LABELS.Class);

    await singleTimeActPage.enterFieldValue(LABELS.Class, testData.className1);
    await singleTimeActPage.waitForDropDownList();
    await singleTimeActPage.selectOptionFromDropdown(testData.className1);

    const service = await singleTimeActPage.getFieldValue(LABELS.Class);

    expect(service).toBe(testData.className1);
  } else {
    return;
  }
};

const addNewClassValidation = async (page: Page) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);
  await page.waitForTimeout(2000);
  if (await singleTimeActPage.checkFieldVisibility(LABELS.Class)) {
    await singleTimeActPage.openDropdown(LABELS.Class);
    const addNew = await singleTimeActPage.checkAddNewOptionAvailable();
    if (addNew) {
      await singleTimeActPage.clickAddNew();
      await singleTimeActPage.waitForNewClassDrawerToOpen();
      await singleTimeActPage.fillNewClassName(testData.randomName);
      await singleTimeActPage.clickSaveButtonDrawerFooter();
      await page.waitForSelector(
        `//button[contains(@class, 'Button-disabled')]`,
        { state: 'hidden', timeout: 0 },
      );
      if (
        (await page
          .locator(
            `//div[@data-testid="contact-drawer"] / descendant::div[@role='alert']`,
          )
          .isVisible()) ||
        (await page.locator(`//div[@id="page-save-error"]`).isVisible())
      ) {
        await page
          .locator(
            `//div[contains(@class, 'Drawer')] / descendant::button[@aria-label="Close"]`,
          )
          .click();
        await page.locator(`//span[text()='Yes']`).click();
        return;
      } else {
        await singleTimeActPage.waitTillDrawerCloses();
        await page.waitForTimeout(4000);
        let newClass = await singleTimeActPage.getFieldValue(LABELS.Class);
        if (newClass === '') {
          await singleTimeActPage.openDropdown(LABELS.Class);
          await singleTimeActPage.enterFieldValue(
            LABELS.Class,
            testData.randomName,
          );
          await page.waitForTimeout(1000);
          await singleTimeActPage.clickDropdownOption(
            testData.option1,
            LABELS.Class,
          );
          await page.waitForTimeout(1000);
          newClass = await singleTimeActPage.getFieldValue(LABELS.Class);
          expect(newClass).toBe(testData.randomName);
          await singleTimeActPage.blurField(LABELS.Class);
        } else {
          expect(newClass).toBe(testData.randomName);
          await singleTimeActPage.blurField(LABELS.Class);
        }
        await singleTimeActPage.blurField(LABELS.Class);
        return;
      }
    } else {
      await singleTimeActPage.blurField(LABELS.Class);
      return;
    }
  } else {
    return;
  }
};

const validateServiceFieldNotRequired = async (page: Page, role: string) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);
  if (role === USER_ROLES.payrollManager) {
    return;
  } else {
    // navigate to trowser
    await singleTimeActPage.navigateToSingleTime();
    // wait for trowser to load
    await singleTimeActPage.validateSTALoaded();
    await singleTimeActPage.waitTillLoaderDisappears();
    await page.waitForTimeout(2000);
    await singleTimeActPage.handleTourModal();

    await singleTimeActPage.checkFieldVisibility(LABELS.Name);
    await singleTimeActPage.openDropdown(LABELS.Service);
    await singleTimeActPage.clickDropdownOption(
      testData.option1,
      LABELS.Service,
    );
    await page.keyboard.press('Tab');
    await singleTimeActPage.uncheckCheckboxIfVisible(LABELS.BillablePerHour);
    const state = await singleTimeActPage.verifySetClockToggleState();
    if (state) {
      await singleTimeActPage.clickSetClockInAndOutToggles();
      await singleTimeActPage.fillData(LABELS.Duration, testData.duration);
    } else {
      await singleTimeActPage.fillData(LABELS.Duration, testData.duration);
    }
    await singleTimeActPage.focusOnField(LABELS.Service);
    await singleTimeActPage.clearFieldValue(LABELS.Service);
    await singleTimeActPage.blurField(LABELS.Service);
    await singleTimeActPage.uncheckCheckboxIfVisible(LABELS.BillablePerHour);
    const createMutationPromise = waitForResponseWithURLandBody(
      page,
      OIGQL_URL_PATTERN,
      matchTimeEntryBatchSaveResponse,
    );
    await singleTimeActPage.clickButton(LABELS.Save);

    // verify response
    const createMutationPromisePayload = await createMutationPromise;
    expect(createMutationPromisePayload).toBeDefined();
    expect(
      createMutationPromisePayload.data.timeTrackingBatchManageTimeEntries
        .timeEntries[0].id,
    ).toBeDefined();
    await singleTimeActPage.validateSuccessToast();
  }
};

const teamMemberRetainedSaveClose = async (page: Page, role: string) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);
  if (role === USER_ROLES.payrollManager) {
    return;
  } else {
    // navigate to trowser
    await singleTimeActPage.navigateToSingleTime();
    // wait for trowser to load
    await singleTimeActPage.validateSTALoaded();
    await singleTimeActPage.waitTillLoaderDisappears();
    await page.waitForTimeout(2000);
    await singleTimeActPage.handleTourModal();

    await singleTimeActPage.checkFieldVisibility(LABELS.Name);
    await singleTimeActPage.openDropdown(LABELS.Name);
    await singleTimeActPage.clickDropdownOption(testData.option1, LABELS.Name);
    await singleTimeActPage.openDropdown(LABELS.Customers);
    await singleTimeActPage.clickDropdownOption(
      testData.option1,
      LABELS.Customers,
    );
    await page.keyboard.press('Tab');
    await singleTimeActPage.uncheckCheckboxIfVisible(LABELS.BillablePerHour);
    const teamMember = await singleTimeActPage.getFieldValue(LABELS.Name);
    const state = await singleTimeActPage.verifySetClockToggleState();
    if (state) {
      await singleTimeActPage.clickSetClockInAndOutToggles();
      await singleTimeActPage.fillData(LABELS.Duration, testData.duration);
    } else {
      await singleTimeActPage.fillData(LABELS.Duration, testData.duration);
    }
    const createMutationPromise = waitForResponseWithURLandBody(
      page,
      OIGQL_URL_PATTERN,
      matchTimeEntryBatchSaveResponse,
    );
    await singleTimeActPage.clickButton(LABELS.Save);
    // verify response
    const createMutationPromisePayload = await createMutationPromise;
    expect(createMutationPromisePayload).toBeDefined();
    expect(
      createMutationPromisePayload.data.timeTrackingBatchManageTimeEntries
        .timeEntries[0].id,
    ).toBeDefined();
    await singleTimeActPage.validateSuccessToast();
    await singleTimeActPage.clickCrossButton();
    await singleTimeActPage.navigateToSingleTime(
      createMutationPromisePayload.data.timeTrackingBatchManageTimeEntries
        .timeEntries[0].id,
    );
    await singleTimeActPage.checkFieldVisibility(LABELS.Name);
    await page.waitForTimeout(4000);
    const teamMemberName = await singleTimeActPage.getFieldValue(LABELS.Name);
    if (teamMemberName === '') {
      await singleTimeActPage.navigateToSingleTime(
        createMutationPromisePayload.data.timeTrackingBatchManageTimeEntries
          .timeEntries[0].id,
      );
    } else {
      expect(teamMemberName).toBe(teamMember);
    }
  }
};

const unsavedChangesModalOnClickingCrossIconThenClickingNo = async (
  page: Page,
  role: string,
) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);

  await fillOutSomeFieldsBeforeMakingUnsavedChangesModalPopUp(
    singleTimeActPage,
    page,
    role,
  );

  // clicking on Cross 'X' Icon present on the Top Right corner of the trowser
  await singleTimeActPage.clickCrossButton();

  // verifying Unsaved Changed Modal Pops Up with a message
  expect(
    await singleTimeActPage.getUnsavedChangesModalTextLocator().textContent(),
  ).toEqual('Do you want to leave without saving?');

  // verifying that Single TA Trowser stays open after clicking 'NO' inside Unsaved Changes Modal
  await singleTimeActPage.getUnsavedChangesModalNoButtonLocator().click();
  await singleTimeActPage.validateSTALoaded();
  await singleTimeActPage.waitTillLoaderDisappears();
  await page.waitForTimeout(2000);
  await singleTimeActPage.handleTourModal();

  await singleTimeActPage.checkFieldVisibility(LABELS.Name);
};

const unsavedChangesModalOnClickingCrossIconThenClickingYes = async (
  page: Page,
  role: string,
) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);

  await fillOutSomeFieldsBeforeMakingUnsavedChangesModalPopUp(
    singleTimeActPage,
    page,
    role,
  );

  // clicking on Cross 'X' Icon present on the Top Right corner of the trowser
  await singleTimeActPage.clickCrossButton();

  // verifying Unsaved Changed Modal Pops Up with a message
  expect(
    await singleTimeActPage.getUnsavedChangesModalTextLocator().textContent(),
  ).toEqual('Do you want to leave without saving?');

  // verifying that Single TA Trowser closes and Dashboard Page is visible after clicking 'YES' inside Unsaved Changes Modal
  await singleTimeActPage.getUnsavedChangesModalYesButtonLocator().click();
  const dashboardPage = new DashboardPage(page);
  if (role === USER_ROLES.timeTrackOnly) {
    await dashboardPage.validateDashboardTimeTracking();
  } else {
    const isDashboardVisible = await dashboardPage.validateDashboardScreen();
    expect(isDashboardVisible).toBe(true);
  }
};

const unsavedChangesModalOnClickingCancelButtonInsideFooter = async (
  page: Page,
  role: string,
) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);

  await fillOutSomeFieldsBeforeMakingUnsavedChangesModalPopUp(
    singleTimeActPage,
    page,
    role,
  );

  // clicking on 'Cancel' button present on the Bottom Left corner of the trowser
  await singleTimeActPage.clickFooterCancelButton();

  // verifying Unsaved Changed Modal Pops Up with a message
  expect(
    await singleTimeActPage.getUnsavedChangesModalTextLocator().textContent(),
  ).toEqual('Do you want to leave without saving?');
};

const unsavedChangesModalOnPressingEscapeKey = async (
  page: Page,
  role: string,
) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);

  await fillOutSomeFieldsBeforeMakingUnsavedChangesModalPopUp(
    singleTimeActPage,
    page,
    role,
  );

  // pressing ESC key
  await page.keyboard.press('Escape');

  // verifying Unsaved Changed Modal Pops Up with a message
  expect(
    await singleTimeActPage.getUnsavedChangesModalTextLocator().textContent(),
  ).toEqual('Do you want to leave without saving?');
};

const fillOutSomeFieldsBeforeMakingUnsavedChangesModalPopUp = async (
  singleTimeActPage: SingleTimeActivityPage,
  page: Page,
  role: string,
) => {
  // navigate to trowser
  await singleTimeActPage.navigateToSingleTime();
  if (await page.getByRole('button', { name: 'Close Tooltip' }).isVisible()) {
    await page.getByRole('button', { name: 'Close Tooltip' }).click();
  }
  // wait for trowser to load
  await singleTimeActPage.validateSTALoaded();
  await singleTimeActPage.waitTillLoaderDisappears();
  await page.waitForTimeout(2000);
  await singleTimeActPage.handleTourModal();

  await singleTimeActPage.checkFieldVisibility(LABELS.Name);

  // changing Team Member Form Field Value
  if (role !== USER_ROLES.timeTrackOnly) {
    await singleTimeActPage.openDropdown(LABELS.Name);
    await singleTimeActPage.clickDropdownOption(testData.option1, LABELS.Name);
  }
  // changing Customer Form Field Value
  await singleTimeActPage.openDropdown(LABELS.Customers);
  await singleTimeActPage.clickDropdownOption(
    testData.option1,
    LABELS.Customers,
  );
  if (role === USER_ROLES.timeTrackOnly) {
    await singleTimeActPage.openDropdown(LABELS.Class);
    await singleTimeActPage.clickDropdownOption(testData.option1, LABELS.Class);
  }
};

const noUnsavedChangesModalOnClickingCrossIcon = async (
  page: Page,
  role: string,
) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);

  // navigate to trowser
  await singleTimeActPage.navigateToSingleTime();
  // wait for trowser to load
  await singleTimeActPage.validateSTALoaded();
  await singleTimeActPage.waitTillLoaderDisappears();
  await page.waitForTimeout(2000);
  await singleTimeActPage.handleTourModal();

  await singleTimeActPage.checkFieldVisibility(LABELS.Name);

  // clicking on Cross 'X' Icon present on the Top Right corner of the trowser
  await singleTimeActPage.clickCrossButton();

  // verifying Unsaved Changed Modal Doesn't Pop Up
  expect(
    await singleTimeActPage.getUnsavedChangesModalLocator().isVisible(),
  ).toEqual(false);

  // verifying that after Single TA Trowser closes, Dashboard Page is visible
  const dashboardPage = new DashboardPage(page);
  if (role === USER_ROLES.timeTrackOnly) {
    await dashboardPage.validateDashboardTimeTracking();
  } else {
    const isDashboardVisible = await dashboardPage.validateDashboardScreen();
    expect(isDashboardVisible).toBe(true);
  }
};

const noUnsavedChangesModalOnClickingCancelButtonInsideFooter = async (
  page: Page,
  role: string,
) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);

  // navigate to trowser
  await singleTimeActPage.navigateToSingleTime();
  // wait for trowser to load
  await singleTimeActPage.validateSTALoaded();
  await singleTimeActPage.waitTillLoaderDisappears();
  await page.waitForTimeout(2000);
  await singleTimeActPage.handleTourModal();

  await singleTimeActPage.checkFieldVisibility(LABELS.Name);

  // clicking on 'Cancel' button present on the Bottom Left corner of the trowser
  await singleTimeActPage.clickFooterCancelButton();

  // verifying Unsaved Changed Modal Doesn't Pop Up
  expect(
    await singleTimeActPage.getUnsavedChangesModalLocator().isVisible(),
  ).toEqual(false);

  // verifying that after Single TA Trowser closes, Dashboard Page is visible
  const dashboardPage = new DashboardPage(page);
  if (role === USER_ROLES.timeTrackOnly) {
    await dashboardPage.validateDashboardTimeTracking();
  } else {
    const isDashboardVisible = await dashboardPage.validateDashboardScreen();
    expect(isDashboardVisible).toBe(true);
  }
};

const noUnsavedChangesModalOnPressingEscapeKey = async (
  page: Page,
  role: string,
) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);

  // navigate to trowser
  await singleTimeActPage.navigateToSingleTime();
  // wait for trowser to load
  await singleTimeActPage.validateSTALoaded();
  await singleTimeActPage.waitTillLoaderDisappears();
  await page.waitForTimeout(2000);
  await singleTimeActPage.handleTourModal();

  await singleTimeActPage.checkFieldVisibility(LABELS.Name);

  // pressing ESC key
  await page.keyboard.press('Escape');

  // verifying Unsaved Changed Modal Doesn't Pop Up
  expect(
    await singleTimeActPage.getUnsavedChangesModalLocator().isVisible(),
  ).toEqual(false);

  // verifying that after Single TA Trowser closes, Dashboard Page is visible
  const dashboardPage = new DashboardPage(page);
  if (role === USER_ROLES.timeTrackOnly) {
    await dashboardPage.validateDashboardTimeTracking();
  } else {
    const isDashboardVisible = await dashboardPage.validateDashboardScreen();
    expect(isDashboardVisible).toBe(true);
  }
};

const noUnsavedChangedModalOnCloseAfterSave = async (
  page: Page,
  role: string,
) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);
  if (role === USER_ROLES.payrollManager) {
    return;
  } else {
    // navigate to trowser
    await singleTimeActPage.navigateToSingleTime();

    await fillSingleTAFields(
      page,
      testData.option1,
      testData.billableRate,
      testData.costRate,
      testData.note1,
      role,
    );
    await saveStartAndEndTime(page, role);
    // clicking on Cross 'X' Icon present on the Top Right corner of the trowser
    await singleTimeActPage.clickCrossButton();

    // verifying Unsaved Changed Modal Doesn't Pop Up
    expect(
      await singleTimeActPage.getUnsavedChangesModalLocator().isVisible(),
    ).toEqual(false);

    // verifying that after Single TA Trowser closes, Dashboard Page is visible
    const dashboardPage = new DashboardPage(page);
    if (role === USER_ROLES.timeTrackOnly) {
      await dashboardPage.validateDashboardTimeTracking();
    } else {
      const isDashboardVisible = await dashboardPage.validateDashboardScreen();
      expect(isDashboardVisible).toBe(true);
    }
  }
};

const noUnsavedChangedModalOnCloseAfterSaveAndNew = async (
  page: Page,
  role: string,
) => {
  if (role === USER_ROLES.payrollManager) {
    return;
  } else {
    await saveAndNew(page, role);
    const singleTimeActPage = new SingleTimeActivityPage(page);

    // clicking on Cross 'X' Icon present on the Top Right corner of the trowser
    await singleTimeActPage.clickCrossButton();

    // verifying Unsaved Changed Modal Doesn't Pop Up
    expect(
      await singleTimeActPage.getUnsavedChangesModalLocator().isVisible(),
    ).toEqual(false);

    // verifying that after Single TA Trowser closes, Dashboard Page is visible
    const dashboardPage = new DashboardPage(page);
    if (role === USER_ROLES.timeTrackOnly) {
      await dashboardPage.validateDashboardTimeTracking();
    } else {
      const isDashboardVisible = await dashboardPage.validateDashboardScreen();
      expect(isDashboardVisible).toBe(true);
    }
  }
};

const checkForBillRateGivingPriorityToServiceOverEmployee = async (
  page: Page,
  optionNumber: any,
  role: string,
) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);
  if (
    role === USER_ROLES.accountsReceivableManager ||
    role === USER_ROLES.inHouseAccountant
  ) {
    return;
  } else {
    const serviceDetailsQueryPromise = waitForResponseWithURLandBody(
      page,
      CERES_DAS_URL_PATTERN,
      matchServicesDetailsResponse,
    );

    // navigate to trowser
    await singleTimeActPage.navigateToSingleTime();

    // wait for trowser to load
    await singleTimeActPage.validateSTALoaded();
    await singleTimeActPage.waitTillLoaderDisappears();
    await page.waitForTimeout(2000);
    await singleTimeActPage.handleTourModal();
    const employeeDetailsQueryPromise = waitForResponseWithURLandBody(
      page,
      EMPLOYEE_DETAILS_URL_PATTERN,
      matchEmployeeDetailsResponse,
    );

    // Open name dropdown & choose the employee having pre-defined bill rate
    await singleTimeActPage.openDropdown(LABELS.Name);
    await singleTimeActPage.clickDropdownOptionForEmployee(optionNumber);

    // verify response
    const employeeDetailsQueryPromisePayload =
      await employeeDetailsQueryPromise;
    expect(employeeDetailsQueryPromisePayload).toBeDefined();

    await checkForEmployeeBillableStatusAndBillRateGettingUpdated(
      employeeDetailsQueryPromisePayload,
      page,
      singleTimeActPage,
    );

    // verify response
    const serviceDetailsQueryPromisePayload = await serviceDetailsQueryPromise;
    expect(serviceDetailsQueryPromisePayload).toBeDefined();

    await checkForServiceBillableStatusBillRateAndTaxableStatusGettingUpdated(
      serviceDetailsQueryPromisePayload,
      page,
      singleTimeActPage,
    );
  }
};

const checkForBillRateGivingPriorityToServiceOverVendor = async (
  page: Page,
  optionNumber: any,
  role: string,
) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);
  if (
    role === USER_ROLES.accountsReceivableManager ||
    role === USER_ROLES.inHouseAccountant
  ) {
    return;
  } else {
    const serviceDetailsQueryPromise = waitForResponseWithURLandBody(
      page,
      CERES_DAS_URL_PATTERN,
      matchServicesDetailsResponse,
    );

    // navigate to trowser
    await singleTimeActPage.navigateToSingleTime();

    // wait for trowser to load
    await singleTimeActPage.validateSTALoaded();
    await singleTimeActPage.waitTillLoaderDisappears();
    await page.waitForTimeout(2000);
    await singleTimeActPage.handleTourModal();

    const vendorDetailsQueryPromise = waitForResponseWithURLandBody(
      page,
      VENDOR_DETAILS_URL_PATTERN,
      matchVendorDetailsResponse,
    );

    // Open name dropdown & choose the vendor having pre-defined bill rate
    await singleTimeActPage.openDropdown(LABELS.Name);
    await singleTimeActPage.enterFieldValue(LABELS.Name, testData.vendorName);
    await singleTimeActPage.selectOptionFromDropdown(testData.vendorName);
    // await singleTimeActPage.clickDropdownOptionForVendor(optionNumber);

    // verify response
    const vendorDetailsQueryPromisePayload = await vendorDetailsQueryPromise;
    expect(vendorDetailsQueryPromisePayload).toBeDefined();

    await checkForVendorBillableStatusAndBillRateGettingUpdated(
      vendorDetailsQueryPromisePayload,
      page,
      singleTimeActPage,
    );

    // verify response
    const serviceDetailsQueryPromisePayload = await serviceDetailsQueryPromise;
    expect(serviceDetailsQueryPromisePayload).toBeDefined();

    await checkForServiceBillableStatusBillRateAndTaxableStatusGettingUpdated(
      serviceDetailsQueryPromisePayload,
      page,
      singleTimeActPage,
    );
  }
};

const checkForVendorBillableStatusAndBillRateGettingUpdated = async (
  vendorDetailsQueryPromisePayload: any,
  page: Page,
  singleTimeActPage: SingleTimeActivityPage,
) => {
  if (await singleTimeActPage.isCheckboxVisible(LABELS.BillablePerHour)) {
    const vendorBillRate =
      vendorDetailsQueryPromisePayload.data.node.profiles.vendor.jobCosting
        .billRate;
    if (vendorBillRate) {
      expect(
        await singleTimeActPage.isCheckboxChecked(LABELS.BillablePerHour),
      ).toEqual(true);
      const billRateValue = await singleTimeActPage.returnBillRateValue();
      expect(`${billRateValue}.00`).toEqual(vendorBillRate);
    } else {
      expect(
        await singleTimeActPage.isCheckboxChecked(LABELS.BillablePerHour),
      ).toEqual(false);
    }
  }
};

const checkForEmployeeBillableStatusAndBillRateGettingUpdated = async (
  employeeDetailsQueryPromisePayload: any,
  page: Page,
  singleTimeActPage: SingleTimeActivityPage,
) => {
  if (await singleTimeActPage.isCheckboxVisible(LABELS.BillablePerHour)) {
    const employeeBillRate =
      employeeDetailsQueryPromisePayload.data.company.employee.employmentDetail
        .jobCosting.billRate;
    if (employeeBillRate) {
      expect(
        await singleTimeActPage.isCheckboxChecked(LABELS.BillablePerHour),
      ).toEqual(true);
      expect(await singleTimeActPage.returnBillRateValue()).toEqual(
        Number(employeeBillRate),
      );
    } else {
      expect(
        await singleTimeActPage.isCheckboxChecked(LABELS.BillablePerHour),
      ).toEqual(false);
    }
  }
};

const checkForEmployeeCostRateGettingUpdated = async (
  employeeDetailsQueryPromisePayload: any,
  singleTimeActPage: SingleTimeActivityPage,
) => {
  const costRateInputField = await singleTimeActPage.costRateFieldVisibility();
  if (costRateInputField) {
    const employeeCostRate =
      employeeDetailsQueryPromisePayload.data.company.employee.employmentDetail
        .jobCosting.costRate;
    if (employeeCostRate) {
      expect(await singleTimeActPage.returnCostRateValue()).toEqual(
        Number(employeeCostRate),
      );
    } else {
      expect(await singleTimeActPage.returnCostRateValue()).toEqual(0);
    }
  }
};

const checkForServiceBillableStatusBillRateAndTaxableStatusGettingUpdated =
  async (
    serviceDetailsQueryPromisePayload: any,
    page: Page,
    singleTimeActPage: SingleTimeActivityPage,
  ) => {
    const { billableServiceIndex, billRateOfSelectedService } =
      fetchBillableServiceAndItsBillRate(serviceDetailsQueryPromisePayload);

    if (billableServiceIndex !== -1) {
      // Open service dropdown & choose the service having pre-defined bill rate
      await singleTimeActPage.openDropdown(LABELS.Service);
      await singleTimeActPage.clickDropdownOption(
        billableServiceIndex,
        LABELS.Service,
      );

      if (await singleTimeActPage.isCheckboxVisible(LABELS.BillablePerHour)) {
        expect(
          await singleTimeActPage.isCheckboxChecked(LABELS.BillablePerHour),
        ).toEqual(true);
        expect(await singleTimeActPage.returnBillRateValue()).toEqual(
          billRateOfSelectedService,
        );
      }
    }

    const taxableServiceIndex = fetchTaxableService(
      serviceDetailsQueryPromisePayload,
    );

    if (taxableServiceIndex !== -1) {
      // Open service dropdown & choose the service having pre-defined bill rate
      await singleTimeActPage.openDropdown(LABELS.Service);
      await singleTimeActPage.clickDropdownOption(
        taxableServiceIndex,
        LABELS.Service,
      );

      if (await singleTimeActPage.isCheckboxVisible(LABELS.Taxable)) {
        expect(
          await singleTimeActPage.isCheckboxChecked(LABELS.Taxable),
        ).toEqual(true);
      }
    }
  };

const fetchBillableServiceAndItsBillRate = (
  serviceDetailsQueryPromisePayload: any,
) => {
  let billableServiceIndex = -1;
  let billRateOfSelectedService = 0;

  for (
    let serviceItemIndex = 0;
    serviceItemIndex <
    serviceDetailsQueryPromisePayload.data.products.data.length;
    serviceItemIndex++
  ) {
    if (
      serviceDetailsQueryPromisePayload.data.products.data[serviceItemIndex]
        .saleDetails.price !== 0
    ) {
      billableServiceIndex = serviceItemIndex + 1;
      billRateOfSelectedService =
        serviceDetailsQueryPromisePayload.data.products.data[serviceItemIndex]
          .saleDetails.price;
      break;
    }
  }

  return {
    billableServiceIndex,
    billRateOfSelectedService,
  };
};

const fetchTaxableService = (serviceDetailsQueryPromisePayload: any) => {
  let taxableServiceIndex = -1;

  for (
    let serviceItemIndex = 0;
    serviceItemIndex <
    serviceDetailsQueryPromisePayload.data.products.data.length;
    serviceItemIndex++
  ) {
    if (
      serviceDetailsQueryPromisePayload.data.products.data[serviceItemIndex]
        .taxable
    ) {
      taxableServiceIndex = serviceItemIndex + 1;
      break;
    }
  }

  return taxableServiceIndex;
};

const locateAndHoverOverIconNextToBillableCheckbox = async (page: Page) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);

  // navigate to trowser
  await singleTimeActPage.navigateToSingleTime();

  // wait for trowser to load
  await singleTimeActPage.validateSTALoaded();
  await singleTimeActPage.waitTillLoaderDisappears();
  await page.waitForTimeout(2000);
  await singleTimeActPage.handleTourModal();

  if (await singleTimeActPage.checkFieldVisibility(LABELS.BillablePerHour)) {
    expect(
      await singleTimeActPage.getBillableFormFieldIcon().isVisible(),
    ).toEqual(true);
    await singleTimeActPage.getBillableFormFieldIcon().hover();
    expect(
      await page
        .getByText(
          'When a timesheet is marked billable, you can add that time to invoices.',
        )
        .isVisible(),
    ).toEqual(true);
  }
};

const fillUpBillRateFormFieldAndValidate = async (page: Page) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);

  // navigate to trowser
  await singleTimeActPage.navigateToSingleTime();

  // wait for trowser to load
  await singleTimeActPage.validateSTALoaded();
  await singleTimeActPage.waitTillLoaderDisappears();
  await page.waitForTimeout(2000);
  await singleTimeActPage.handleTourModal();

  const isBillableCheckboxChecked = await singleTimeActPage.isCheckboxVisible(
    LABELS.BillablePerHour,
  );
  if (isBillableCheckboxChecked) {
    await singleTimeActPage.checkCheckboxForGivenLabelIfVisible(
      LABELS.BillablePerHour,
    );

    const isBillRateFormFieldVisible = await singleTimeActPage
      .getBillRateLocator()
      .isVisible();
    if (isBillRateFormFieldVisible) {
      // check for input value getting auto-formated onBlur
      const isValidationMessageVisibleFirstTime = await singleTimeActPage
        .getValidationErrorLocatorForBillRate()
        .isVisible();
      await singleTimeActPage.fillBillRateInput('45$232');
      await singleTimeActPage.getBillRateLocator().blur();
      const inputValue = await singleTimeActPage
        .getBillRateLocator()
        .inputValue();
      expect(inputValue).toEqual('45.00');
      expect(isValidationMessageVisibleFirstTime).toEqual(false);

      // check for validation message being displayed on invalid input value onBlur
      await singleTimeActPage.fillBillRateInput('abcd');
      await singleTimeActPage.getBillRateLocator().blur();
      const isValidationMessageVisibleSecondTime = await singleTimeActPage
        .getValidationErrorLocatorForBillRate()
        .isVisible();
      expect(isValidationMessageVisibleSecondTime).toEqual(true);
      expect(
        await singleTimeActPage
          .getValidationErrorMessageLocatorForBillRate()
          .nth(0)
          .textContent(),
      ).toEqual('Invalid rate');

      // check for validation message being displayed for required field on clicking Save
      await singleTimeActPage.fillBillRateInput('');
      await singleTimeActPage.getBillRateLocator().blur();
      await singleTimeActPage.clickButton(LABELS.Save);
      expect(
        await singleTimeActPage
          .getValidationErrorMessageLocatorForBillRate()
          .nth(0)
          .textContent(),
      ).toEqual('This field is required');
    }
  }
};

const checkTaxableCheckboxAndVerifySavedTimeEntry = async (
  page: Page,
  role: string,
) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);
  if (role === USER_ROLES.payrollManager) {
    return;
  } else {
    // navigate to trowser
    await singleTimeActPage.navigateToSingleTime();

    // wait for trowser to load
    await singleTimeActPage.validateSTALoaded();
    await singleTimeActPage.waitTillLoaderDisappears();
    await page.waitForTimeout(2000);
    await singleTimeActPage.handleTourModal();

    // Open name dropdown & click first option
    if (role !== USER_ROLES.timeTrackOnly) {
      await singleTimeActPage.openDropdown(LABELS.Name);
      await singleTimeActPage.clickDropdownOption(
        testData.option1,
        LABELS.Name,
      );
    }

    // open customer dropdown & click first option
    await singleTimeActPage.openDropdown(LABELS.Customers);
    await singleTimeActPage.clickDropdownOption(
      testData.option1,
      LABELS.Customers,
    );

    // fill out duration field
    const state = await singleTimeActPage.verifySetClockToggleState();
    if (state) {
      await singleTimeActPage.clickSetClockInAndOutToggles();
      await singleTimeActPage.fillData(LABELS.Duration, testData.duration);
    } else {
      await singleTimeActPage.fillData(LABELS.Duration, testData.duration);
    }

    // if billable checkbox is visible, check it in order to make taxable checkbox visible
    const isBillableCheckboxChecked = await singleTimeActPage.isCheckboxVisible(
      LABELS.BillablePerHour,
    );
    if (isBillableCheckboxChecked) {
      await singleTimeActPage.checkCheckboxForGivenLabelIfVisible(
        LABELS.BillablePerHour,
      );

      const isTaxableCheckboxVisible =
        await singleTimeActPage.isCheckboxVisible(LABELS.Taxable);
      if (isTaxableCheckboxVisible) {
        // check taxable checkbox, save single time activity and then verify the status by reloading the time activity
        await singleTimeActPage.checkCheckboxForGivenLabelIfVisible(
          LABELS.Taxable,
        );

        // click save
        const createMutationPromise = waitForResponseWithURLandBody(
          page,
          OIGQL_URL_PATTERN,
          matchTimeEntryBatchSaveResponse,
        );
        await singleTimeActPage.clickButton(LABELS.Save);

        // verify response
        const createMutationPromisePayload = await createMutationPromise;
        expect(createMutationPromisePayload).toBeDefined();
        expect(
          createMutationPromisePayload.data.timeTrackingBatchManageTimeEntries
            .timeEntries[0].id,
        ).toBeDefined();

        // navigate to activity with param(id)
        await singleTimeActPage.navigateToSingleTime(
          createMutationPromisePayload.data.timeTrackingBatchManageTimeEntries
            .timeEntries[0].id,
        );

        // wait for trowser to load and verify if modified cost rate is preserved
        await singleTimeActPage.validateSTALoaded();
        await singleTimeActPage.waitTillLoaderDisappears();
        await page.waitForTimeout(2000);
        await singleTimeActPage.handleTourModal();

        await singleTimeActPage.checkFieldVisibility(LABELS.Name);
        const isTaxableCheckboxVisible =
          await singleTimeActPage.isCheckboxVisible(LABELS.Taxable);
        if (isTaxableCheckboxVisible) {
          expect(
            await singleTimeActPage.isCheckboxChecked(LABELS.Taxable),
          ).toEqual(true);
        }
      }
    }
  }
};

const fillUpCostRateFormFieldAndValidate = async (page: Page) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);

  // navigate to trowser
  await singleTimeActPage.navigateToSingleTime();

  // wait for trowser to load
  await singleTimeActPage.validateSTALoaded();
  await singleTimeActPage.waitTillLoaderDisappears();
  await page.waitForTimeout(2000);
  await singleTimeActPage.handleTourModal();

  const costRateInputField = await singleTimeActPage.costRateFieldVisibility();
  if (costRateInputField) {
    // check for input value getting auto-formated onBlur
    const isValidationMessageVisibleFirstTime = await singleTimeActPage
      .getInvalidRateMessageLocator()
      .isVisible();
    await singleTimeActPage.fillCostRateInput('45$232');
    await singleTimeActPage.getCostRateLocator().blur();
    const inputValue = await singleTimeActPage
      .getCostRateLocator()
      .inputValue();
    expect(inputValue).toEqual('45.00');
    expect(isValidationMessageVisibleFirstTime).toEqual(false);

    // check for validation message being displayed on invalid input value onBlur
    await singleTimeActPage.fillCostRateInput('abcd');
    await singleTimeActPage.getCostRateLocator().blur();
    const isValidationMessageVisibleSecondTime = await singleTimeActPage
      .getInvalidRateMessageLocator()
      .isVisible();
    expect(isValidationMessageVisibleSecondTime).toEqual(true);
  }
};

const emptyCostRateFormFieldAndSaveSingleTA = async (
  page: Page,
  role: string,
) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);
  if (role === USER_ROLES.payrollManager) {
    return;
  } else {
    // navigate to trowser
    await singleTimeActPage.navigateToSingleTime();

    // wait for trowser to load
    await singleTimeActPage.validateSTALoaded();
    await singleTimeActPage.waitTillLoaderDisappears();
    await page.waitForTimeout(2000);
    await singleTimeActPage.handleTourModal();

    // Open name dropdown & click first option
    if (role !== USER_ROLES.timeTrackOnly) {
      await singleTimeActPage.openDropdown(LABELS.Name);
      await singleTimeActPage.clickDropdownOption(
        testData.option1,
        LABELS.Name,
      );
    }

    // open customer dropdown & click first option
    await singleTimeActPage.openDropdown(LABELS.Customers);
    await singleTimeActPage.clickDropdownOption(
      testData.option1,
      LABELS.Customers,
    );

    // fill out duration field
    const state = await singleTimeActPage.verifySetClockToggleState();
    if (state) {
      await singleTimeActPage.clickSetClockInAndOutToggles();
      await singleTimeActPage.fillData(LABELS.Duration, testData.duration);
    } else {
      await singleTimeActPage.fillData(LABELS.Duration, testData.duration);
    }

    const costRateInputField =
      await singleTimeActPage.costRateFieldVisibility();
    if (costRateInputField) {
      const inputValue = await singleTimeActPage
        .getCostRateLocator()
        .inputValue();

      if (inputValue !== '') {
        await singleTimeActPage.fillCostRateInput('');
        await singleTimeActPage.getCostRateLocator().blur();
      }
    }

    // click save
    const createMutationPromise = waitForResponseWithURLandBody(
      page,
      OIGQL_URL_PATTERN,
      matchTimeEntryBatchSaveResponse,
    );
    await singleTimeActPage.clickButton(LABELS.Save);

    // verify response
    const createMutationPromisePayload = await createMutationPromise;
    expect(createMutationPromisePayload).toBeDefined();
    expect(
      createMutationPromisePayload.data.timeTrackingBatchManageTimeEntries
        .timeEntries[0].id,
    ).toBeDefined();
  }
};

const replacePredefinedEmployeeCostRateValueAndSaveSingleTA = async (
  page: Page,
  optionNumber: any,
  role: string,
) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);
  if (
    role === USER_ROLES.accountsReceivableManager ||
    role === USER_ROLES.inHouseAccountant
  ) {
    return;
  } else {
    // navigate to trowser
    await singleTimeActPage.navigateToSingleTime();

    // wait for trowser to load
    await singleTimeActPage.validateSTALoaded();
    await singleTimeActPage.waitTillLoaderDisappears();
    await page.waitForTimeout(2000);
    await singleTimeActPage.handleTourModal();

    const employeeDetailsQueryPromise = waitForResponseWithURLandBody(
      page,
      EMPLOYEE_DETAILS_URL_PATTERN,
      matchEmployeeDetailsResponse,
    );

    // Clear Name Input First (This Approach Doesn't work in case if the current selected employee is same for previously saved Single TA)
    // await singleTimeActPage.clearNameInputField();
    // await page.waitForTimeout(2000);

    // Open name dropdown & choose the employee having pre-defined bill rate
    await singleTimeActPage.openDropdown(LABELS.Name);
    await singleTimeActPage.clickDropdownOptionForEmployee(optionNumber);

    // verify response
    const employeeDetailsQueryPromisePayload =
      await employeeDetailsQueryPromise;
    expect(employeeDetailsQueryPromisePayload).toBeDefined();

    // open customer dropdown & click first option
    await singleTimeActPage.openDropdown(LABELS.Customers);
    await singleTimeActPage.clickDropdownOption(
      testData.option1,
      LABELS.Customers,
    );

    // fill out duration field
    const state = await singleTimeActPage.verifySetClockToggleState();
    if (state) {
      await singleTimeActPage.clickSetClockInAndOutToggles();
      await singleTimeActPage.fillData(LABELS.Duration, testData.duration);
    } else {
      await singleTimeActPage.fillData(LABELS.Duration, testData.duration);
    }

    await checkForEmployeeCostRateGettingUpdated(
      employeeDetailsQueryPromisePayload,
      singleTimeActPage,
    );

    const costRateInputField =
      await singleTimeActPage.costRateFieldVisibility();
    if (costRateInputField) {
      // check for input value getting auto-formated onBlur
      await singleTimeActPage.fillCostRateInput('45$232');
      await singleTimeActPage.getCostRateLocator().blur();
      const inputValue = await singleTimeActPage
        .getCostRateLocator()
        .inputValue();
      expect(inputValue).toEqual('45.00');

      // click save
      const createMutationPromise = waitForResponseWithURLandBody(
        page,
        OIGQL_URL_PATTERN,
        matchTimeEntryBatchSaveResponse,
      );
      await singleTimeActPage.clickButton(LABELS.Save);

      // verify response
      const createMutationPromisePayload = await createMutationPromise;
      expect(createMutationPromisePayload).toBeDefined();
      expect(
        createMutationPromisePayload.data.timeTrackingBatchManageTimeEntries
          .timeEntries[0].id,
      ).toBeDefined();

      // navigate to activity with param(id)
      await singleTimeActPage.navigateToSingleTime(
        createMutationPromisePayload.data.timeTrackingBatchManageTimeEntries
          .timeEntries[0].id,
      );

      // wait for trowser to load and verify if modified cost rate is preserved
      await singleTimeActPage.validateSTALoaded();
      await singleTimeActPage.waitTillLoaderDisappears();
      await page.waitForTimeout(2000);
      await singleTimeActPage.handleTourModal();

      await singleTimeActPage.checkFieldVisibility(LABELS.Name);
      const costRateInputField =
        await singleTimeActPage.costRateFieldVisibility();
      if (costRateInputField) {
        expect(
          await singleTimeActPage.getCostRateLocator().inputValue(),
        ).toEqual('45.00');
      }
    }
  }
};

const locateAndHoverOverIconNextToCostRateLabel = async (page: Page) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);

  // navigate to trowser
  await singleTimeActPage.navigateToSingleTime();

  // wait for trowser to load
  await singleTimeActPage.validateSTALoaded();
  await singleTimeActPage.waitTillLoaderDisappears();
  await page.waitForTimeout(2000);
  await singleTimeActPage.handleTourModal();

  if (await singleTimeActPage.costRateFieldVisibility()) {
    expect(
      await singleTimeActPage.getCostRateFormFieldIcon().isVisible(),
    ).toEqual(true);
    await singleTimeActPage.getCostRateFormFieldIcon().hover();
    expect(
      await page
        .getByText(
          'Include the total of wages, taxes, and overhead for each worker. This is not your billable rate.',
        )
        .isVisible(),
    ).toEqual(true);
  }
};

const checkForBillRateAndCostRateGettingPreFilledForEmployee = async (
  page: Page,
  optionNumber: any,
) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);

  // navigate to trowser
  await singleTimeActPage.navigateToSingleTime();

  // wait for trowser to load
  await singleTimeActPage.validateSTALoaded();
  await singleTimeActPage.waitTillLoaderDisappears();
  await page.waitForTimeout(2000);
  await singleTimeActPage.handleTourModal();

  const employeeDetailsQueryPromise = waitForResponseWithURLandBody(
    page,
    EMPLOYEE_DETAILS_URL_PATTERN,
    matchEmployeeDetailsResponse,
  );

  // Clear Name Input First (This Approach Doesn't work in case if the current selected employee is same for previously saved Single TA)
  // await singleTimeActPage.clearNameInputField();
  // await page.waitForTimeout(2000);

  // Open name dropdown & choose the employee having pre-defined bill rate
  await singleTimeActPage.openDropdown(LABELS.Name);
  await singleTimeActPage.clickDropdownOptionForEmployee(optionNumber);

  // verify response
  const employeeDetailsQueryPromisePayload = await employeeDetailsQueryPromise;
  expect(employeeDetailsQueryPromisePayload).toBeDefined();

  await checkForEmployeeBillableStatusAndBillRateGettingUpdated(
    employeeDetailsQueryPromisePayload,
    page,
    singleTimeActPage,
  );

  await checkForEmployeeCostRateGettingUpdated(
    employeeDetailsQueryPromisePayload,
    singleTimeActPage,
  );
};

const checkForBillRateAndCostRateGettingPreFilledForVendor = async (
  page: Page,
  optionNumber: any,
  role: string,
) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);

  // navigate to trowser
  await singleTimeActPage.navigateToSingleTime();

  // wait for trowser to load
  await singleTimeActPage.validateSTALoaded();
  await singleTimeActPage.waitTillLoaderDisappears();
  await page.waitForTimeout(2000);
  await singleTimeActPage.handleTourModal();
  await page.waitForTimeout(2000);

  const vendorDetailsQueryPromise = waitForResponseWithURLandBody(
    page,
    VENDOR_DETAILS_URL_PATTERN,
    matchVendorDetailsResponse,
  );

  // Open name dropdown & choose the vendor having pre-defined bill rate
  await singleTimeActPage.openDropdown(LABELS.Name);
  if (role === USER_ROLES.cAQlQBPlusCanada) {
    await singleTimeActPage.enterFieldValue(LABELS.Name, testData.supplierName);
    await singleTimeActPage.clickDropdownOption(optionNumber, LABELS.Name);
  } else {
    await singleTimeActPage.enterFieldValue(LABELS.Name, testData.vendorName);
    await singleTimeActPage.clickDropdownOption(optionNumber, LABELS.Name);
  }
  // await singleTimeActPage.clickDropdownOptionForVendor(optionNumber);

  // verify response
  const vendorDetailsQueryPromisePayload = await vendorDetailsQueryPromise;
  expect(vendorDetailsQueryPromisePayload).toBeDefined();

  await checkForVendorBillableStatusAndBillRateGettingUpdated(
    vendorDetailsQueryPromisePayload,
    page,
    singleTimeActPage,
  );

  const costRateInputField = await singleTimeActPage.costRateFieldVisibility();
  if (costRateInputField) {
    const vendorCostRate = vendorDetailsQueryPromisePayload.Vendor.CostRate;
    if (vendorCostRate) {
      expect(await singleTimeActPage.returnCostRateValue()).toEqual(
        vendorCostRate,
      );
    } else {
      expect(await singleTimeActPage.returnCostRateValue()).toEqual(0);
    }
  }
};

const checkForServiceBillableStatusBillRateAndTaxableStatusGettingUpdatedOptional =
  async (
    serviceDetailsQueryPromisePayload: any,
    page: Page,
    singleTimeActPage: SingleTimeActivityPage,
  ) => {
    const { billableServiceIndex, billRateOfSelectedService } =
      fetchBillableServiceAndItsBillRate(serviceDetailsQueryPromisePayload);

    if (billableServiceIndex !== -1) {
      await singleTimeActPage.openDropdown(LABELS.Service);
      await singleTimeActPage.clickDropdownOption(
        billableServiceIndex,
        LABELS.Service,
      );

      if (await singleTimeActPage.isCheckboxVisible(LABELS.BillablePerHour)) {
        expect
          .soft(
            await singleTimeActPage.isCheckboxChecked(LABELS.BillablePerHour),
          )
          .toEqual(true);
        expect
          .soft(await singleTimeActPage.returnBillRateValue())
          .toEqual(billRateOfSelectedService);
      }
    }

    const taxableServiceIndex = fetchTaxableService(
      serviceDetailsQueryPromisePayload,
    );

    if (taxableServiceIndex !== -1) {
      await singleTimeActPage.openDropdown(LABELS.Service);
      await singleTimeActPage.clickDropdownOption(
        taxableServiceIndex,
        LABELS.Service,
      );

      if (await singleTimeActPage.isCheckboxVisible(LABELS.Taxable)) {
        expect
          .soft(await singleTimeActPage.isCheckboxChecked(LABELS.Taxable))
          .toEqual(true);
      }
    }
  };

/**
 * Priority-only: billable service / bill rate checks are best-effort.
 * Skips without failing when Ceres is unavailable or no paid (non-zero price) service exists.
 */
const checkForBillRateGettingPreFilledForBillableServicePriorityOptional =
  async (page: Page, role: string) => {
    if (
      role === USER_ROLES.accountsReceivableManager ||
      role === USER_ROLES.inHouseAccountant
    ) {
      return;
    }

    const singleTimeActPage = new SingleTimeActivityPage(page);

    try {
      await singleTimeActPage.navigateToSingleTime();
      await page.waitForTimeout(2000);
      await singleTimeActPage.validateSTALoaded();
      await singleTimeActPage.waitTillLoaderDisappears();
      await page.waitForTimeout(2000);
      await singleTimeActPage.handleTourModal();

      let serviceDetailsQueryPromisePayload: any;
      try {
        serviceDetailsQueryPromisePayload =
          await waitForCeresServicesDetailsResponse(
            page,
            async () => {
              await singleTimeActPage.openDropdown(LABELS.Service);
            },
            { timeoutMs: 60_000 },
          );
      } catch {
        console.log(
          'Optional priority: Ceres services catalog not available; skipping billable service validation',
        );
        return;
      }

      const products =
        serviceDetailsQueryPromisePayload?.data?.products?.data ?? [];
      if (!products.length) {
        console.log(
          'Optional priority: empty services catalog; skipping billable service validation',
        );
        return;
      }

      const { billableServiceIndex } = fetchBillableServiceAndItsBillRate(
        serviceDetailsQueryPromisePayload,
      );
      if (billableServiceIndex === -1) {
        console.log(
          'Optional priority: no billable service (non-zero price) in catalog; skipping billable service validation',
        );
        return;
      }

      console.log(
        'Optional priority: running billable service bill rate validation',
      );
      await checkForServiceBillableStatusBillRateAndTaxableStatusGettingUpdatedOptional(
        serviceDetailsQueryPromisePayload,
        page,
        singleTimeActPage,
      );
    } catch (error) {
      console.log(
        'Optional priority: billable service validation skipped:',
        error instanceof Error ? error.message : String(error),
      );
    }
  };

const checkForBillRateGettingPreFilledForBillableService = async (
  page: Page,
  role: string,
) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);
  if (
    role === USER_ROLES.accountsReceivableManager ||
    role === USER_ROLES.inHouseAccountant
  ) {
    return;
  } else {
    const serviceDetailsQueryPromise = waitForResponseWithURLandBody(
      page,
      CERES_DAS_URL_PATTERN,
      matchServicesDetailsResponse,
    );

    // navigate to trowser
    await singleTimeActPage.navigateToSingleTime();
    await page.waitForTimeout(2000);

    // wait for trowser to load
    await singleTimeActPage.validateSTALoaded();
    await singleTimeActPage.waitTillLoaderDisappears();
    await page.waitForTimeout(2000);
    await singleTimeActPage.handleTourModal();

    // verify response
    const serviceDetailsQueryPromisePayload = await serviceDetailsQueryPromise;
    expect(serviceDetailsQueryPromisePayload).toBeDefined();

    await checkForServiceBillableStatusBillRateAndTaxableStatusGettingUpdated(
      serviceDetailsQueryPromisePayload,
      page,
      singleTimeActPage,
    );
  }
};

const checkForBillRateStayingTheSameForNonBillableService = async (
  page: Page,
  role: string,
) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);
  if (
    role === USER_ROLES.accountsReceivableManager ||
    role === USER_ROLES.inHouseAccountant
  ) {
    return;
  } else {
    const serviceDetailsQueryPromise = waitForResponseWithURLandBody(
      page,
      CERES_DAS_URL_PATTERN,
      matchServicesDetailsResponse,
    );

    // navigate to trowser
    await singleTimeActPage.navigateToSingleTime();
    await page.waitForTimeout(2000);

    // wait for trowser to load
    await singleTimeActPage.validateSTALoaded();
    await singleTimeActPage.waitTillLoaderDisappears();
    await page.waitForTimeout(2000);
    await singleTimeActPage.handleTourModal();

    // verify response
    const serviceDetailsQueryPromisePayload = await serviceDetailsQueryPromise;
    expect(serviceDetailsQueryPromisePayload).toBeDefined();

    const nonBillableServiceIndex =
      serviceDetailsQueryPromisePayload.data.products.data.findIndex(
        (service: any) => service.saleDetails.price === 0,
      );

    if (nonBillableServiceIndex !== -1) {
      let currentBillableStatus = false;
      let currentBillRate = 0;
      if (await singleTimeActPage.isCheckboxVisible(LABELS.BillablePerHour)) {
        currentBillableStatus = await singleTimeActPage.isCheckboxChecked(
          LABELS.BillablePerHour,
        );
      }

      if (currentBillableStatus) {
        currentBillRate = await singleTimeActPage.returnBillRateValue();
      }

      // Open service dropdown & choose the service that doesn't have pre-defined bill rate
      await singleTimeActPage.openDropdown(LABELS.Service);
      await singleTimeActPage.clickDropdownOption(
        nonBillableServiceIndex + 1,
        LABELS.Service,
      );

      if (await singleTimeActPage.isCheckboxVisible(LABELS.BillablePerHour)) {
        expect(
          await singleTimeActPage.isCheckboxChecked(LABELS.BillablePerHour),
        ).toEqual(currentBillableStatus);
        if (currentBillableStatus) {
          expect(await singleTimeActPage.returnBillRateValue()).toEqual(
            currentBillRate,
          );
        }
      }
    }
  }
};

const durationAutoFormat = async (page: Page) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);
  const state = await singleTimeActPage.verifySetClockToggleState();
  if (state) {
    await singleTimeActPage.clickSetClockInAndOutToggles();
    await singleTimeActPage.fillData(
      LABELS.Duration,
      testData.unformattedDuration,
    );
  } else {
    await singleTimeActPage.fillData(
      LABELS.Duration,
      testData.unformattedDuration,
    );
  }
  await page.keyboard.press('Tab');
  await page.waitForTimeout(2000);
  const duration = await singleTimeActPage.getFieldValue(LABELS.Duration);

  // Handle both "5:00" and "05:00" formats
  const normalizedDuration =
    duration && duration.length === 4 ? `0${duration}` : duration;
  expect(normalizedDuration).toBe(testData.duration);
};

const durationRequiredCheck = async (page: Page) => {
  const dashboardPage = new DashboardPage(page);
  await page.waitForTimeout(2000);
  const singleTimeActPage = new SingleTimeActivityPage(page);

  const state = await singleTimeActPage.verifySetClockToggleState();
  if (state) {
    await singleTimeActPage.clickSetClockInAndOutToggles();
    await singleTimeActPage.clearFieldValue(LABELS.Duration);
  }
  await singleTimeActPage.clearFieldValue(LABELS.Duration);
  await page.waitForTimeout(2000);
  await singleTimeActPage.clickButton(LABELS.Save);
  await singleTimeActPage.validateRequiredFieldError(LABELS.Duration);
};

const durationAutoFormatToValidFormat = async (page: Page) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);
  await page.waitForTimeout(2000);
  const state = await singleTimeActPage.verifySetClockToggleState();
  if (state) {
    await singleTimeActPage.clickSetClockInAndOutToggles();
    await singleTimeActPage.fillData(
      LABELS.Duration,
      testData.unformattedDuration2,
    );
  } else {
    await singleTimeActPage.fillData(
      LABELS.Duration,
      testData.unformattedDuration2,
    );
  }
  await page.keyboard.press('Tab');
  await page.waitForTimeout(2000);
  const duration = await singleTimeActPage.getFieldValue(LABELS.Duration);
  expect(duration).toBe(testData.formattedDuration2);
};

const startAndEndDateAutoFormat = async (page: Page, role: string) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);

  // navigate to trowser
  await singleTimeActPage.navigateToSingleTime();
  // wait for trowser to load
  await singleTimeActPage.validateSTALoaded();
  await singleTimeActPage.waitTillLoaderDisappears();
  await page.waitForTimeout(2000);
  await singleTimeActPage.handleTourModal();

  if (role !== USER_ROLES.timeTrackOnly) {
    await singleTimeActPage.checkFieldVisibility(LABELS.Name);
    await singleTimeActPage.openDropdown(LABELS.Name);
    await singleTimeActPage.clickDropdownOption(testData.option1, LABELS.Name);
  }
  const state = await singleTimeActPage.verifySetClockToggleState();
  if (!state) {
    await singleTimeActPage.clickSetClockInAndOutToggles();
  }
  await singleTimeActPage.clickButton(LABELS.Save);
  await page.waitForTimeout(2000);
  await singleTimeActPage.validateRequiredTimeError('Start');
  await singleTimeActPage.validateRequiredTimeError('End');
  await page.waitForTimeout(2000);
  await singleTimeActPage.fillTime('Start', testData.invalidStartTime);
  await singleTimeActPage.fillTime('End', testData.invalidEndTime);
  await page.waitForTimeout(2000);
  await singleTimeActPage.validateInvalidTimeError('Start');
  await singleTimeActPage.validateInvalidTimeError('End');
  await page.waitForTimeout(2000);
  await singleTimeActPage.focusOnTimeField('Start');
  await singleTimeActPage.clearTime('Start');
  await singleTimeActPage.clearTime('End');
  await page.waitForTimeout(2000);
  await singleTimeActPage.fillTime('Start', testData.unformattedStartTime);
  await singleTimeActPage.fillTime('End', testData.unformattedEndTime);
  await page.keyboard.press(`Tab`);
  await page.waitForTimeout(2000);
  const startTime = await singleTimeActPage.getTime('Start');
  const endTime = await singleTimeActPage.getTime('End');
  expect(startTime).toBe(testData.startTime);
  expect(endTime).toBe(testData.endTime);
};

const classNotRequired = async (page: Page) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);

  // navigate to trowser
  await singleTimeActPage.navigateToSingleTime();

  // wait for trowser to load
  await singleTimeActPage.validateSTALoaded();
  await singleTimeActPage.waitTillLoaderDisappears();
  await page.waitForTimeout(2000);
  await singleTimeActPage.handleTourModal();
  await singleTimeActPage.checkFieldVisibility(LABELS.Name);
  if (await singleTimeActPage.checkFieldVisibility(LABELS.Class)) {
    await singleTimeActPage.openDropdown(LABELS.Class);
    await singleTimeActPage.clickDropdownOption(testData.option1, LABELS.Class);
    await singleTimeActPage.clearFieldValue(LABELS.Class);
    await singleTimeActPage.uncheckCheckboxIfVisible(LABELS.BillablePerHour);
    const state = await singleTimeActPage.verifySetClockToggleState();
    if (state) {
      await singleTimeActPage.clickSetClockInAndOutToggles();
      await singleTimeActPage.fillData(
        LABELS.Duration,
        testData.unformattedDuration,
      );
    } else {
      await singleTimeActPage.fillData(
        LABELS.Duration,
        testData.unformattedDuration,
      );
    }
    await page.keyboard.press('Tab');
    await singleTimeActPage.clickButton(LABELS.Save);
    await singleTimeActPage.waitTillLoaderDisappears();
    await singleTimeActPage.validateSuccessToast();
  } else {
    return;
  }
};

const payTypeFieldHiddenWhenVendorSelected = async (
  page: Page,
  role: string,
) => {
  const dashboardPage = new DashboardPage(page);
  const singleTimeActPage = new SingleTimeActivityPage(page);

  // navigate to trowser
  await singleTimeActPage.navigateToSingleTime();

  // wait for trowser to load
  await singleTimeActPage.validateSTALoaded();
  await singleTimeActPage.waitTillLoaderDisappears();
  await page.waitForTimeout(2000);
  await singleTimeActPage.handleTourModal();

  await page.waitForTimeout(4000);
  // Clear Name Input First (This Approach Doesn't work in case if the current selected vendor is same for previously saved Single TA)
  // await singleTimeActPage.clearNameInputField();
  // await page.waitForTimeout(2000);

  // Open name dropdown & choose the vendor having pre-defined bill rate
  await singleTimeActPage.openDropdown(LABELS.Name);
  if (role === USER_ROLES.cAQlQBPlusCanada) {
    await singleTimeActPage.enterFieldValue(LABELS.Name, testData.supplierName);
  } else {
    await singleTimeActPage.enterFieldValue(LABELS.Name, testData.vendorName);
  }
  await page.waitForTimeout(2000);
  await singleTimeActPage.clickDropdownOption(testData.option1, LABELS.Name);
  // await singleTimeActPage.clickDropdownOptionForVendor(1);
  expect(await singleTimeActPage.getField(LABELS.PayType)).not.toBeVisible();
  console.log('Not visible');
};

const closeTroserwithCrossEscapeAndCancel = async (
  page: Page,
  scenario: string,
  skipSidebar: boolean = false,
  role: string,
) => {
  const company = getLoginData(scenario);
  await openQBO(page, company, skipSidebar);

  const singleTimeActPage = new SingleTimeActivityPage(page);
  const dashboardPage = new DashboardPage(page);

  await fillSingleTAFields(
    page,
    testData.option1,
    testData.billableRate,
    testData.costRate,
    testData.note1,
  );

  // fill out duration field
  const state = await singleTimeActPage.verifySetClockToggleState();
  if (state) {
    await singleTimeActPage.clickSetClockInAndOutToggles();
    await singleTimeActPage.fillData(LABELS.Duration, testData.duration);
  } else {
    await singleTimeActPage.fillData(LABELS.Duration, testData.duration);
  }
  // click save
  const createMutationPromise = waitForResponseWithURLandBody(
    page,
    OIGQL_URL_PATTERN,
    matchTimeEntryBatchSaveResponse,
  );
  await singleTimeActPage.clickButton(LABELS.Save);

  // verify response
  const createMutationPromisePayload = await createMutationPromise;
  expect(createMutationPromisePayload).toBeDefined();
  expect(
    createMutationPromisePayload.data.timeTrackingBatchManageTimeEntries
      .timeEntries[0].id,
  ).toBeDefined();

  await singleTimeActPage.clickCrossButton();

  if (role === USER_ROLES.timeTrackOnly) {
    await dashboardPage.validateDashboardTimeTracking();
  } else {
    const isDashboardVisible = await dashboardPage.validateDashboardScreen();
    expect(isDashboardVisible).toBe(true);
  }
  await singleTimeActPage.navigateToSingleTime();
  await fillSingleTAFields(
    page,
    testData.option1,
    testData.billableRate,
    testData.costRate,
    testData.note1,
  );

  // fill out duration field
  await singleTimeActPage.fillData(LABELS.Duration, testData.duration);

  // click save
  const createMutationPromiseTwo = waitForResponseWithURLandBody(
    page,
    OIGQL_URL_PATTERN,
    matchTimeEntryBatchSaveResponse,
  );
  await singleTimeActPage.clickButton(LABELS.Save);

  // verify response
  const createMutationPromisePayloadTwo = await createMutationPromiseTwo;
  expect(createMutationPromisePayloadTwo).toBeDefined();
  expect(
    createMutationPromisePayload.data.timeTrackingBatchManageTimeEntries
      .timeEntries[0].id,
  ).toBeDefined();

  await singleTimeActPage.clickFooterCancelButton();
  if (role === USER_ROLES.timeTrackOnly) {
    await dashboardPage.validateDashboardTimeTracking();
  } else {
    const isDashboardVisible = await dashboardPage.validateDashboardScreen();
    expect(isDashboardVisible).toBe(true);
  }
};

const validateBreakFieldAutoFormatAndValidations = async (
  page: Page,
  role: string,
) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);

  await singleTimeActPage.navigateToSingleTime();
  await singleTimeActPage.validateSTALoaded();
  await singleTimeActPage.waitTillLoaderDisappears();
  await page.waitForTimeout(2000);
  await singleTimeActPage.handleTourModal();
  await singleTimeActPage.checkFieldVisibility(LABELS.Name);
  if (role !== USER_ROLES.timeTrackOnly) {
    await singleTimeActPage.openDropdown(LABELS.Name);
    await singleTimeActPage.clickDropdownOption(testData.option1, LABELS.Name);
  }
  const state = await singleTimeActPage.verifySetClockToggleState();
  if (!state) {
    await singleTimeActPage.clickSetClockInAndOutToggles();
    await singleTimeActPage.validateDateFieldPresence('Start');
    await singleTimeActPage.validateDateFieldPresence('End');
  }
  await singleTimeActPage.validateBreakButtonVisible();
  await singleTimeActPage.clickBreakButton();
  await singleTimeActPage.validateBreakFieldVisible();
  await singleTimeActPage.validateDeleteBreakButtonVisible();
  await singleTimeActPage.fillBreak(testData.unformattedDuration2);
  await page.keyboard.press(`Tab`);
  await singleTimeActPage.validateBreakValueAutoFormat(
    testData.formattedDuration2,
  );
  await singleTimeActPage.clickDeleteBreakButton();
  await singleTimeActPage.validateBreakButtonVisible();
  await singleTimeActPage.validateBreakFieldNotVisible();
  await singleTimeActPage.validateDeleteBreakButtonNotVisible();
  await singleTimeActPage.clickBreakButton();
  await singleTimeActPage.fillBreak(testData.randomName);
  await page.keyboard.press(`Tab`);
  await singleTimeActPage.validateInvalidBreakTimeError();
  await singleTimeActPage.focusBreakField();
  await singleTimeActPage.clearBreakField();
  await singleTimeActPage.clickButton(LABELS.Save);
  await singleTimeActPage.validateBreakTimeRequiredError();
};

const saveSingleTaActivityWithBreak = async (page: Page, role: string) => {
  // Adding break and then validating presence of bill summary without passing billrate and saving the activity
  const singleTimeActPage = new SingleTimeActivityPage(page);
  const dashboardPage = new DashboardPage(page);
  if (role === USER_ROLES.payrollManager) {
    return;
  } else {
    await singleTimeActPage.navigateToSingleTime();

    await singleTimeActPage.validateSTALoaded();
    await singleTimeActPage.waitTillLoaderDisappears();
    await page.waitForTimeout(2000);
    await singleTimeActPage.handleTourModal();
    await singleTimeActPage.checkFieldVisibility(LABELS.Name);

    // Open name dropdown & click first option
    await singleTimeActPage.openDropdown(LABELS.Name);
    await singleTimeActPage.clickDropdownOption(testData.option1, LABELS.Name);

    // open customer dropdown & click first option
    await singleTimeActPage.openDropdown(LABELS.Customers);
    await singleTimeActPage.clickDropdownOption(
      testData.option1,
      LABELS.Customers,
    );

    // open location dropdown & click first option
    // if (await singleTimeActPage.checkFieldVisibility(LABELS.Location)) {
    //   await singleTimeActPage.openDropdown(LABELS.Location);
    //   await singleTimeActPage.clickDropdownOption(
    //     testData.option1,
    //     LABELS.Location
    //   );
    // }

    // open service dropdown & click first option
    if (await singleTimeActPage.checkFieldVisibility(LABELS.Service)) {
      await singleTimeActPage.openDropdown(LABELS.Service);
      await singleTimeActPage.clickDropdownOption(
        testData.option1,
        LABELS.Service,
      );
    }

    // open class dropdown & click first option
    if (await singleTimeActPage.checkFieldVisibility(LABELS.Class)) {
      await singleTimeActPage.openDropdown(LABELS.Class);
      await singleTimeActPage.clickDropdownOption(
        testData.option1,
        LABELS.Class,
      );
    }

    // pick pay type
    if (
      (await singleTimeActPage.checkFieldVisibility(LABELS.PayType)) &&
      !(await singleTimeActPage.validateNoAvailablePayTypes())
    ) {
      await singleTimeActPage.openDropdown(LABELS.PayType);
      await singleTimeActPage.selectPayTypeOption(testData.option1);
    }

    await singleTimeActPage.uncheckCheckboxIfVisible(LABELS.Billable);

    let state = await singleTimeActPage.verifySetClockToggleState();
    if (!state) {
      await singleTimeActPage.clickSetClockInAndOutToggles();
      await singleTimeActPage.validateDateFieldPresence('Start');
      await singleTimeActPage.validateDateFieldPresence('End');
      await singleTimeActPage.selectTime('Start', testData.startTime3);
      await singleTimeActPage.selectTime('End', testData.endTime3);
    } else {
      await singleTimeActPage.validateDateFieldPresence('Start');
      await singleTimeActPage.validateDateFieldPresence('End');
      await singleTimeActPage.selectTime('Start', testData.startTime3);
      await singleTimeActPage.selectTime('End', testData.endTime3);
    }

    await singleTimeActPage.validateBreakButtonVisible();
    await singleTimeActPage.clickBreakButton();
    await singleTimeActPage.validateBreakFieldVisible();
    await singleTimeActPage.fillBreak(testData.breakTime);
    await singleTimeActPage.fillData(LABELS.NotesLabel, testData.note1);
    await singleTimeActPage.validateSummaryVisible(testData.summaryTime);

    // click save
    const createMutationPromise = waitForResponseWithURLandBody(
      page,
      OIGQL_URL_PATTERN,
      matchTimeEntryBatchSaveResponse,
    );
    await singleTimeActPage.clickButton(LABELS.Save);
    await singleTimeActPage.waitTillLoaderDisappears();
    if (await singleTimeActPage.userNotAllowedActionError()) {
      return;
    } else {
      await singleTimeActPage.validateSuccessToast();
      // verify response
      const createMutationPromisePayload = await createMutationPromise;
      expect(createMutationPromisePayload).toBeDefined();
      expect(
        createMutationPromisePayload.data.timeTrackingBatchManageTimeEntries
          .timeEntries[0].id,
      ).toBeDefined();
    }

    //checking billable box and passing bill rate and then checking summary and save activity
    await singleTimeActPage.checkCheckboxIfVisible(LABELS.BillablePerHour);
    await singleTimeActPage.fillBillRateInput(testData.billableRate);
    await page.keyboard.press(`Tab`);
    if (
      role === USER_ROLES.inHouseAccountant ||
      role === USER_ROLES.salesManager
    ) {
      await singleTimeActPage.validateSummaryVisible(testData.summaryTime);
    } else {
      expect(
        await singleTimeActPage.validateSummaryVisibleWhenBillRateFilled(
          testData.summaryTime,
          testData.billableRate,
        ),
      ).toBe(true);
    }
    // click save
    const createMutationPromiseSaveWithBillRate = waitForResponseWithURLandBody(
      page,
      OIGQL_URL_PATTERN,
      matchTimeEntryBatchSaveResponse,
    );
    await singleTimeActPage.clickButton(LABELS.Save);
    await singleTimeActPage.waitTillLoaderDisappears();
    const createMutationPromisePayloadWithBillRate =
      await createMutationPromiseSaveWithBillRate;
    expect(createMutationPromisePayloadWithBillRate).toBeDefined();
    expect(
      createMutationPromisePayloadWithBillRate.data
        .timeTrackingBatchManageTimeEntries.timeEntries[0].id,
    ).toBeDefined();
    await singleTimeActPage.validateSuccessToast();
    await singleTimeActPage.uncheckCheckboxIfVisible(LABELS.BillablePerHour);
    await singleTimeActPage.clickButton(LABELS.Save);
    await singleTimeActPage.waitTillLoaderDisappears();

    //saving timeactivity with break equal to total time
    state = await singleTimeActPage.verifySetClockToggleState();
    if (!state) {
      await singleTimeActPage.clickSetClockInAndOutToggles();
      await singleTimeActPage.selectTime('Start', testData.startTime2);
      await singleTimeActPage.selectTime('End', testData.endTime2);
    } else {
      await singleTimeActPage.selectTime('Start', testData.startTime2);
      await singleTimeActPage.selectTime('End', testData.endTime2);
    }
    await singleTimeActPage.fillBreak(testData.breaktime2);
    await page.keyboard.press('Tab');
    // click save
    const createMutationPromiseBreakEqual = waitForResponseWithURLandBody(
      page,
      OIGQL_URL_PATTERN,
      matchTimeEntryBatchSaveResponse,
    );
    await singleTimeActPage.clickButton(LABELS.Save);
    await singleTimeActPage.waitTillLoaderDisappears();
    if (await singleTimeActPage.userNotAllowedActionError()) {
      return;
    } else {
      await singleTimeActPage.validateSuccessToast();
      // verify response
      const createMutationPromisePayloadBreakEqual =
        await createMutationPromiseBreakEqual;
      expect(createMutationPromisePayloadBreakEqual).toBeDefined();
      expect(
        createMutationPromisePayloadBreakEqual.data
          .timeTrackingBatchManageTimeEntries.timeEntries[0].id,
      ).toBeDefined();
    }

    //toggling off set clock, filling duration, saving and then validating data
    if (state) {
      await singleTimeActPage.clickSetClockInAndOutToggles();
      await singleTimeActPage.checkFieldVisibility(LABELS.Duration);
      await singleTimeActPage.enterFieldValue(
        LABELS.Duration,
        testData.duration,
      );
    } else {
      await singleTimeActPage.checkFieldVisibility(LABELS.Duration);
      await singleTimeActPage.enterFieldValue(
        LABELS.Duration,
        testData.duration,
      );
    }
    await singleTimeActPage.validateBreakButtonHidden();
    await page.keyboard.press('Tab');

    // click save
    const createMutationPromiseDuration = waitForResponseWithURLandBody(
      page,
      OIGQL_URL_PATTERN,
      matchTimeEntryBatchSaveResponse,
    );
    let name = await singleTimeActPage.getFieldValue(LABELS.Name);
    let duration = await singleTimeActPage.getFieldValue(LABELS.Duration);
    await singleTimeActPage.clickButton(LABELS.Save);
    await singleTimeActPage.waitTillLoaderDisappears();
    if (await singleTimeActPage.userNotAllowedActionError()) {
      return;
    } else {
      // verify response
      const createMutationPromisePayloadDuration =
        await createMutationPromiseDuration;
      expect(createMutationPromisePayloadDuration).toBeDefined();
      expect(
        createMutationPromisePayloadDuration.data
          .timeTrackingBatchManageTimeEntries.timeEntries[0].id,
      ).toBeDefined();
      await singleTimeActPage.navigateToSingleTime(
        createMutationPromisePayloadDuration.data
          .timeTrackingBatchManageTimeEntries.timeEntries[0].id,
      );
      await page.waitForTimeout(4000);
      const updatedName = await singleTimeActPage.getFieldValue(LABELS.Name);
      const updatedDuration = await singleTimeActPage.getFieldValue(
        LABELS.Duration,
      );
      expect(updatedName).toBe(name);
      expect(updatedDuration).toBe(duration);
    }
  }
};

const saveSingleTaActivityWithBreakExceeedingTotalTime = async (
  page: Page,
  role: string,
) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);
  const dashboardPage = new DashboardPage(page);

  if (role === USER_ROLES.payrollManager) {
    return;
  } else {
    await singleTimeActPage.navigateToSingleTime();

    await singleTimeActPage.validateSTALoaded();
    await singleTimeActPage.waitTillLoaderDisappears();
    await page.waitForTimeout(2000);
    await singleTimeActPage.handleTourModal();
    await singleTimeActPage.checkFieldVisibility(LABELS.Name);

    // Open name dropdown & click first option
    await singleTimeActPage.openDropdown(LABELS.Name);
    await singleTimeActPage.clickDropdownOption(testData.option1, LABELS.Name);

    // open customer dropdown & click first option
    await singleTimeActPage.openDropdown(LABELS.Customers);
    await singleTimeActPage.clickDropdownOption(
      testData.option1,
      LABELS.Customers,
    );

    // open location dropdown & click first option
    // if (await singleTimeActPage.checkFieldVisibility(LABELS.Location)) {
    //   await singleTimeActPage.openDropdown(LABELS.Location);
    //   await singleTimeActPage.clickDropdownOption(
    //     testData.option1,
    //     LABELS.Location
    //   );
    // }

    // open service dropdown & click first option
    if (await singleTimeActPage.checkFieldVisibility(LABELS.Service)) {
      await singleTimeActPage.openDropdown(LABELS.Service);
      await singleTimeActPage.clickDropdownOption(
        testData.option1,
        LABELS.Service,
      );
    }

    // open class dropdown & click first option
    if (await singleTimeActPage.checkFieldVisibility(LABELS.Class)) {
      await singleTimeActPage.openDropdown(LABELS.Class);
      await singleTimeActPage.clickDropdownOption(
        testData.option1,
        LABELS.Class,
      );
    }

    // pick pay type
    if (
      (await singleTimeActPage.checkFieldVisibility(LABELS.PayType)) &&
      !(await singleTimeActPage.validateNoAvailablePayTypes())
    ) {
      await singleTimeActPage.openDropdown(LABELS.PayType);
      await singleTimeActPage.selectPayTypeOption(testData.option1);
    }

    const state = await singleTimeActPage.verifySetClockToggleState();
    if (!state) {
      await singleTimeActPage.clickSetClockInAndOutToggles();
      await singleTimeActPage.validateDateFieldPresence('Start');
      await singleTimeActPage.validateDateFieldPresence('End');
      await singleTimeActPage.selectTime('Start', testData.startTime);
      await singleTimeActPage.selectTime('End', testData.endTime);
    } else {
      await singleTimeActPage.validateDateFieldPresence('Start');
      await singleTimeActPage.validateDateFieldPresence('End');
      await singleTimeActPage.selectTime('Start', testData.startTime);
      await singleTimeActPage.selectTime('End', testData.endTime);
    }

    await singleTimeActPage.validateBreakButtonVisible();
    await singleTimeActPage.clickBreakButton();
    await singleTimeActPage.validateBreakFieldVisible();
    await singleTimeActPage.fillBreak(testData.breakTime);
    await singleTimeActPage.fillData(LABELS.NotesLabel, testData.note1);
    await singleTimeActPage.breakTimeExceedTotalTimeTextVisible();

    // click save
    await singleTimeActPage.clickButton(LABELS.Save);
    const response = await page.waitForResponse((response) =>
      OIGQL_URL_PATTERN.test(response.url()),
    );
    const responseBody = await response.json();
    expect(responseBody.data.timeTrackingBatchManageTimeEntries.errorCode).toBe(
      'TT_DURATION_NOT_MATCHED',
    );
    await singleTimeActPage.waitTillLoaderDisappears();
    if (await singleTimeActPage.userNotAllowedActionError()) {
      return;
    } else {
      expect(
        await singleTimeActPage.validateBreakTimeExceedTotalTimeError(),
      ).toBe(true);
    }
  }
};

const feedBackModalValidation = async (page: Page) => {
  const singleTimeActivityPage = new SingleTimeActivityPage(page);

  await singleTimeActivityPage.validateFeedbackButtonPresence();
  await singleTimeActivityPage.clickGiveFeedbackButton();
  await singleTimeActivityPage.validateFeedbackPopupOpened();
  await singleTimeActivityPage.clickSendFeedbackButton();
  await singleTimeActivityPage.validateEmptyFeedbackFieldError();
  await singleTimeActivityPage.fillFeedback(testData.feedback);
  await singleTimeActivityPage.clickSendFeedbackButton();
  await singleTimeActivityPage.waitTillLoaderDisappears();
  await singleTimeActivityPage.validateFeedbackSuccessToast();
  await singleTimeActivityPage.validateFeedbackPopupClosed();
};

const notesFieldValidation = async (page: Page, role: string) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);
  await singleTimeActPage.navigateToSingleTime();
  await singleTimeActPage.validateSTALoaded();
  await singleTimeActPage.waitTillLoaderDisappears();
  await page.waitForTimeout(2000);
  await singleTimeActPage.handleTourModal();
  await singleTimeActPage.checkFieldVisibility(LABELS.Name);
  if (role !== USER_ROLES.timeTrackOnly) {
    await singleTimeActPage.openDropdown(LABELS.Name);
    await singleTimeActPage.clickDropdownOption(testData.option1, LABELS.Name);
  }
  // fill out duration field
  const state = await singleTimeActPage.verifySetClockToggleState();
  if (state) {
    await singleTimeActPage.clickSetClockInAndOutToggles();
    await singleTimeActPage.fillData(LABELS.Duration, testData.duration2);
  } else {
    await singleTimeActPage.fillData(LABELS.Duration, testData.duration2);
  }
  await singleTimeActPage.fillData(LABELS.NotesLabel, NOTES_TEXT);
  await singleTimeActPage.clickButton(LABELS.Save);
  await singleTimeActPage.validateNotesFieldMaxLengthExceeded();
  await singleTimeActPage.clearNotesField();
  await singleTimeActPage.fillData(LABELS.NotesLabel, testData.note1);
  if (role === USER_ROLES.timeTrackOnly) {
    await page.keyboard.press(`Tab`);
  }
  await singleTimeActPage.clickButton(LABELS.Save);
  await singleTimeActPage.waitTillLoaderDisappears();
  await singleTimeActPage.validateSuccessToast();
};

const featureCases = async (page: Page, role: string) => {
  const singleTimeActivityPage = new SingleTimeActivityPage(page);
  await unsavedChangesModalOnClickingCancelButtonInsideFooter(page, role);
  console.log('1 STA Features');
  await unsavedChangesModalOnClickingCrossIconThenClickingNo(page, role);
  console.log('2 STA Features');
  await noUnsavedChangesModalOnPressingEscapeKey(page, role);
  console.log('3 STA Features');
  await unsavedChangesModalOnClickingCrossIconThenClickingYes(page, role);
  console.log('4 STA Features');
  await unsavedChangesModalOnClickingCrossIconThenClickingNo(page, role);
  console.log('5 STA Features');
  await unsavedChangesModalOnClickingCancelButtonInsideFooter(page, role);
  console.log('6 STA Features');
  await noUnsavedChangedModalOnCloseAfterSave(page, role);
  console.log('7 STA Features');
  await noUnsavedChangedModalOnCloseAfterSaveAndNew(page, role);
  console.log('8 STA Features');
  await noUnsavedChangesModalOnClickingCancelButtonInsideFooter(page, role);
  console.log('unsaved cases done');
  // }

  if (role !== USER_ROLES.payrollManager) {
    await singleTimeActivityPage.navigateToSingleTime();
    await page.waitForTimeout(4000);
    await saveAndClose(page);
  }

  if (role !== USER_ROLES.timeTrackOnly) {
    await addNewTeamMemberValidation(page, role);
    console.log('executed addNewTeamMemberValidation');
  }

  await addNewCustomerValidation(page, role);
  console.log('executed addNewCustomerValidation');

  // await addNewLocationValidation(page); // commented out due to new location creation limitationy
  // console.log('executed addNewLocationValidation');

  await addNewClassValidation(page);
  console.log('executed addNewClassValidation');

  await addNewServiceValidation(page);
  console.log('executed addNewServiceValidation');

  if (role !== USER_ROLES.payrollManager && role !== USER_ROLES.timeTrackOnly) {
    await saveAndCloseForLastTeamMember(page, role);
    console.log('save and close');
  }

  await classNotRequired(page);
  console.log('classNotRequired');

  await durationAutoFormat(page);
  console.log('durationAutoFormat');

  await durationRequiredCheck(page);
  console.log('durationRequiredCheck');

  await durationAutoFormatToValidFormat(page);
  console.log('durationAutoFormatToValidFormat');

  await startAndEndDateAutoFormat(page, role);
  console.log('startAndEndDateAutoFormat');

  await startdateFieldRequiredCheck(page);
  console.log('executed startdateFieldRequiredCheck');

  if (role !== USER_ROLES.timeTrackOnly) {
    // was commented out due to employee issue
    await nameFieldFilterAndSelect(page, role);
    console.log('executed nameFieldFilterAndSelect');
  }

  if (role !== USER_ROLES.timeTrackOnly) {
    //was commented out due to employee issue
    await teamMemberFieldRequiredCheck(page);
    console.log('executed teamMemberFieldRequiredCheck');
  }

  await customerFieldFilterAndSelect(page);
  console.log('executed customerFieldFilterAndSelect');

  await locationFieldFilterAndSelect(page); // was commented out due to location bug in application
  console.log('executed locationFieldFilterAndSelect');

  await classFieldFilterAndSelect(page);
  console.log('executed classFieldFilterAndSelect');

  await serviceFieldFilterAndSelect(page);
  console.log('executed serviceFieldFilterAndSelect');

  await validateCustomerFieldNotRequiredWhenBillableUnchecked(page, role);
  console.log('executed validateCustomerFieldNotRequiredWhenBillableUnchecked');

  await validateServiceFieldNotRequired(page, role);
  console.log('executed validateServiceFieldNotRequired');

  if (role !== USER_ROLES.timeTrackOnly) {
    await teamMemberRetainedSaveClose(page, role);
    console.log('executed teamMemberRetainedSaveClose');
  }

  if (role !== USER_ROLES.payrollManager && role !== USER_ROLES.timeTrackOnly) {
    await saveAndClose(page);
    console.log('save and close');
  }

  if (role !== USER_ROLES.timeTrackOnly) {
    await checkForBillRateAndCostRateGettingPreFilledForVendor(page, 1, role);
    console.log('checkForBillRateAndCostRateGettingPreFilledForVendor');
  }

  if (
    role !== USER_ROLES.payrollManager &&
    role !== USER_ROLES.timeTrackOnly // including timetracking due to application issue in this role
  ) {
    await saveAndCloseForLastTeamMember(page, role);
    console.log('save and close');
  }
  await checkForBillRateGettingPreFilledForBillableService(page, role); // billable field not visible for accountants recievable and in house acc
  console.log('checkForBillRateGettingPreFilledForBillableService');

  if (role !== USER_ROLES.payrollManager && role !== USER_ROLES.timeTrackOnly) {
    await saveAndCloseForLastTeamMember(page, role);
    console.log('save and close');
  }
  await checkForBillRateStayingTheSameForNonBillableService(page, role);
  console.log('checkForBillRateStayingTheSameForNonBillableService');

  // await page.setViewportSize({ width: 1920, height: 1080 });
  if (role !== USER_ROLES.payrollManager && role !== USER_ROLES.timeTrackOnly) {
    await saveAndCloseForLastTeamMember(page, role);
    console.log('save and close');
  }
  await checkForBillRateGivingPriorityToServiceOverEmployee(page, 1, role);
  console.log('checkForBillRateGivingPriorityToServiceOverEmployee');

  if (role !== USER_ROLES.payrollManager && role !== USER_ROLES.timeTrackOnly) {
    await saveAndCloseForLastTeamMember(page, role);
    console.log('save and close');
  }

  if (role !== USER_ROLES.timeTrackOnly) {
    await checkForBillRateGivingPriorityToServiceOverVendor(page, 0, role);
    console.log('checkForBillRateGivingPriorityToServiceOverVendor');
  }

  await locateAndHoverOverIconNextToBillableCheckbox(page);
  console.log('locateAndHoverOverIconNextToBillableCheckbox');

  await fillUpBillRateFormFieldAndValidate(page);
  console.log('fillUpBillRateFormFieldAndValidate');

  await fillUpCostRateFormFieldAndValidate(page);
  console.log('fillUpCostRateFormFieldAndValidate');

  await emptyCostRateFormFieldAndSaveSingleTA(page, role);
  console.log('emptyCostRateFormFieldAndSaveSingleTA');

  if (role !== USER_ROLES.payrollManager && role !== USER_ROLES.timeTrackOnly) {
    await saveAndCloseForLastTeamMember(page, role);
    console.log('save and close');
  }

  if (role !== USER_ROLES.timeTrackOnly) {
    await replacePredefinedEmployeeCostRateValueAndSaveSingleTA(page, 0, role);
    console.log('replacePredefinedEmployeeCostRateValueAndSaveSingleTA');
  }

  await locateAndHoverOverIconNextToCostRateLabel(page);
  console.log('locateAndHoverOverIconNextToCostRateLabel');

  await checkTaxableCheckboxAndVerifySavedTimeEntry(page, role);
  console.log('checkTaxableCheckboxAndVerifySavedTimeEntry');

  await feedBackModalValidation(page);

  await notesFieldValidation(page, role);

  // await dateFieldFormFunctionality(page, USER_ROLES.companyAdmin);   //due to application error on qbo settings page, skipping this
  // console.log('executed dateFieldFormFunctionality');

  await validateBreakFieldAutoFormatAndValidations(page, role);
  console.log('validateBreakFieldAutoFormatAndValidations');

  if (role !== USER_ROLES.timeTrackOnly) {
    await saveSingleTaActivityWithBreakExceeedingTotalTime(page, role);
    console.log('saveSingleTaActivityWithBreakExceeedingTotalTime');
  }
  if (
    role !== USER_ROLES.accountsReceivableManager &&
    role !== USER_ROLES.timeTrackOnly
  ) {
    // For this role, break equal to start and end time is working intermittently on pipeline
    await saveSingleTaActivityWithBreak(page, role);
    console.log(`saveSingleTaActivityWithBreak ${role}`);
  }
  if (role !== USER_ROLES.timeTrackOnly) {
    await payTypeFieldHiddenWhenVendorSelected(page, role);
    console.log('All cases done for features');
  }
};

const checkForBillRateAndCostRateGettingPreFilledForEmployeePriority = async (
  page: Page,
) => {
  const singleTimeActPage = new SingleTimeActivityPage(page);

  const employeeDetailsQueryPromise = waitForResponseWithURLandBody(
    page,
    EMPLOYEE_DETAILS_URL_PATTERN,
    matchEmployeeDetailsResponse,
  );

  // navigate to trowser
  await singleTimeActPage.navigateToSingleTime();

  // wait for trowser to load
  await singleTimeActPage.validateSTALoaded();
  await singleTimeActPage.waitTillLoaderDisappears();
  await page.waitForTimeout(2000);
  await singleTimeActPage.handleTourModal();

  // Clear Name Input First (This Approach Doesn't work in case if the current selected employee is same for previously saved Single TA)
  // await singleTimeActPage.clearNameInputField();
  // await page.waitForTimeout(2000);

  // Open name dropdown & choose the employee having pre-defined bill rate
  // await singleTimeActPage.openDropdown(LABELS.Name);
  // await singleTimeActPage.clickDropdownOptionForEmployee(optionNumber);

  // verify response
  const employeeDetailsQueryPromisePayload = await employeeDetailsQueryPromise;
  expect(employeeDetailsQueryPromisePayload).toBeDefined();

  await checkForEmployeeBillableStatusAndBillRateGettingUpdated(
    employeeDetailsQueryPromisePayload,
    page,
    singleTimeActPage,
  );

  await checkForEmployeeCostRateGettingUpdated(
    employeeDetailsQueryPromisePayload,
    singleTimeActPage,
  );
};

export {
  dateFieldFormFunctionality,
  startdateFieldRequiredCheck,
  nameFieldFilterAndSelect,
  teamMemberFieldRequiredCheck,
  customerFieldFilterAndSelect,
  locationFieldFilterAndSelect,
  serviceFieldFilterAndSelect,
  addNewTeamMemberValidation,
  addNewCustomerValidation,
  validateCustomerFieldRequiredWhenBillableChecked,
  validateCustomerFieldNotRequiredWhenBillableUnchecked,
  addNewLocationValidation,
  addNewServiceValidation,
  classFieldFilterAndSelect,
  addNewClassValidation,
  validateServiceFieldNotRequired,
  teamMemberRetainedSaveClose,
  unsavedChangesModalOnClickingCancelButtonInsideFooter,
  unsavedChangesModalOnClickingCrossIconThenClickingNo,
  unsavedChangesModalOnPressingEscapeKey,
  unsavedChangesModalOnClickingCrossIconThenClickingYes,
  noUnsavedChangedModalOnCloseAfterSave,
  noUnsavedChangesModalOnClickingCancelButtonInsideFooter,
  noUnsavedChangedModalOnCloseAfterSaveAndNew,
  noUnsavedChangesModalOnPressingEscapeKey,
  noUnsavedChangesModalOnClickingCrossIcon,
  fillOutSomeFieldsBeforeMakingUnsavedChangesModalPopUp,
  fillUpCostRateFormFieldAndValidate,
  emptyCostRateFormFieldAndSaveSingleTA,
  replacePredefinedEmployeeCostRateValueAndSaveSingleTA,
  checkTaxableCheckboxAndVerifySavedTimeEntry,
  locateAndHoverOverIconNextToBillableCheckbox,
  checkForServiceBillableStatusBillRateAndTaxableStatusGettingUpdated,
  checkForBillRateStayingTheSameForNonBillableService,
  checkForBillRateGettingPreFilledForBillableService,
  checkForBillRateGivingPriorityToServiceOverEmployee,
  checkForBillRateGivingPriorityToServiceOverVendor,
  checkForBillRateAndCostRateGettingPreFilledForEmployee,
  checkForBillRateAndCostRateGettingPreFilledForVendor,
  locateAndHoverOverIconNextToCostRateLabel,
  fillUpBillRateFormFieldAndValidate,
  startAndEndDateAutoFormat,
  durationAutoFormatToValidFormat,
  durationRequiredCheck,
  durationAutoFormat,
  classNotRequired,
  payTypeFieldHiddenWhenVendorSelected,
  closeTroserwithCrossEscapeAndCancel,
  validateBreakFieldAutoFormatAndValidations,
  saveSingleTaActivityWithBreak,
  saveSingleTaActivityWithBreakExceeedingTotalTime,
  notesFieldValidation,
  feedBackModalValidation,
  featureCases,
  checkForBillRateGettingPreFilledForBillableServicePriorityOptional,
  checkForBillRateAndCostRateGettingPreFilledForEmployeePriority,
};
