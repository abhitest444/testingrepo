import { Page, expect, Locator } from '@playwright/test';
import {
  accountSettingsPageUrls,
  CUSTOM_FIELD_DATA_TYPES,
  CUSTOM_FIELD_LABELS,
} from '../constants';
import gotoWithAuthSession from '../gotoWithAuthSession';

const CUSTOM_FIELD_NAV_TIMEOUT = 120_000;

const navigationToCustomFieldSettings = async (page: Page) => {
  const url = accountSettingsPageUrls.customFieldSettings;

  try {
    await gotoWithAuthSession(page, url, {
      waitUntil: 'domcontentloaded',
      timeout: CUSTOM_FIELD_NAV_TIMEOUT,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes('ERR_ABORTED')) {
      throw error;
    }
  }

  await page
    .waitForURL(/accountsettings\?p=time/i, {
      timeout: CUSTOM_FIELD_NAV_TIMEOUT,
    })
    .catch(() => {});
  await page
    .waitForLoadState('load', { timeout: CUSTOM_FIELD_NAV_TIMEOUT })
    .catch(() => {});
  await waitForCustomFieldsLoading(page);
  await handleTimeSettingsModal(page);
  await ensureAccountSettingsTimePanel(page);
  await page
    .waitForLoadState('load', { timeout: CUSTOM_FIELD_NAV_TIMEOUT })
    .catch(() => {});
};

// custom fields section to be visible with zero state
export const validateTimeSettingsCustomFieldSectionVisible = async (
  page: Page,
) => {
  await expect(page.getByTestId('custom-fields-settings')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: CUSTOM_FIELD_LABELS.heading }),
  ).toBeVisible();

  await expect(page.getByText(CUSTOM_FIELD_LABELS.createLabel)).toBeVisible();
  await expect(
    page.getByTestId('custom-fields-settings-view').locator('label'),
  ).toContainText(CUSTOM_FIELD_LABELS.createLabel);

  await expect(
    page.getByRole('button', {
      name: CUSTOM_FIELD_LABELS.manageAllCustomFieldsText,
    }),
  ).toBeVisible();
  await expect(page.getByTestId('custom-fields-settings-view')).toContainText(
    CUSTOM_FIELD_LABELS.manageAllCustomFieldsText,
  );

  await expect(
    page
      .getByTestId('custom-fields-settings-view')
      .getByRole('button', { name: 'edit' }),
  ).toBeVisible();
};

// custom fields section to be visible with zero state
export const validateCustomFieldSectionVisibleWithZeroState = async (
  page: Page,
) => {
  await expect(page.locator(`//span[text()="Custom field"]`)).toBeVisible();

  await expect(
    page.getByRole('button', {
      name: CUSTOM_FIELD_LABELS.manageAllCustomFieldsText,
    }),
  ).toBeVisible();
  await expect(
    page.locator(`//a[text()="Manage all custom fields"]`),
  ).toBeVisible();

  // await expect(
  //   page.getByText(CUSTOM_FIELD_LABELS.goToClassicQuickBooksTimeText),
  // ).toBeVisible();

  await expect(page.getByText(CUSTOM_FIELD_LABELS.addUpToText)).toBeVisible();

  await expect(
    page.getByText(CUSTOM_FIELD_LABELS.noCustomFieldsText),
  ).toBeVisible();

  await expect(
    page.getByText(CUSTOM_FIELD_LABELS.getStartedText),
  ).toBeVisible();

  await expect(
    page.getByRole('button', { name: 'custom-fields-add-button' }),
  ).toBeVisible();
};

// click manage all custom fields link/button
export const clickManageAllCustomFieldsLink = async (page: Page) => {
  // Click either "Manage all custom fields" button or "Go to classic QuickBooks Time" link (whichever is present); use .first() when both exist
  const manageAllButton = page.locator(
    '//span[text()="Manage all custom fields"]',
  );
  const classicLink = page.locator(
    `//a[text()="Go to classic QuickBooks Time to assign customers"]`,
  );
  const linkOrButton = manageAllButton.or(classicLink).first();
  await linkOrButton.waitFor({ state: 'visible', timeout: 60_000 });
  await linkOrButton.click({ force: true });
};

export const clickCustomFieldSettingsManageAllCustomFieldsLink = async (
  page: Page,
) => {
  await page
    .getByLabel('Custom fields')
    .getByText('Go to classic QuickBooks Time')
    .click({ timeout: 2000 });
};

// validate manage all custom fields page
export const validateManageAllCustomFieldsPageUI = async (page: Page) => {
  // Validate page title/heading
  await expect(page.getByText('Custom fields', { exact: true })).toBeVisible({
    timeout: 2000,
  });

  // Validate breadcrumb/navigation
  await expect(page.getByText('All Lists')).toBeVisible({ timeout: 2000 });

  // Validate top right buttons
  await expect(page.getByText('See how it works')).toBeVisible();
  await expect(page.getByText('(3.03)')).toBeVisible({ timeout: 2000 });
  await expect(page.getByRole('button', { name: 'Give feedback' })).toBeVisible(
    { timeout: 2000 },
  );
  await expect(
    page.getByRole('button', { name: 'Add custom field' }),
  ).toBeVisible({
    timeout: 2000,
  });

  // // Validate "Include inactive" toggle
  // await expect(page.getByText('Include inactive')).toBeVisible({
  //   timeout: 2000,
  // });
  // await expect(page.locator('[role="switch"]')).toBeVisible({ timeout: 2000 }); // Toggle switch

  // // Validate table structure and headers
  // await validateManageAllCustomFieldsPageTableHeaders(page);

  // // Validate pagination
  // await expect(page.getByText('1-1 of 1')).toBeVisible();
};

export const validateManageAllCustomFieldsPageTableHeaders = async (
  page: Page,
) => {
  // CUSTOM FIELDS section headers
  // add the time out for each expect to be visible
  await expect(
    page.getByRole('columnheader', { name: 'CUSTOM FIELDS' }),
  ).toBeVisible({ timeout: 2000 });
  await expect(page.getByRole('columnheader', { name: 'NAME' })).toBeVisible({
    timeout: 2000,
  });
  await expect(
    page.getByRole('columnheader', { name: 'CATEGORY' }),
  ).toBeVisible({ timeout: 2000 });

  // SALES section headers
  await expect(
    page.getByRole('columnheader', { name: 'SALES', exact: true }),
  ).toBeVisible({ timeout: 2000 });
  await expect(
    page.getByRole('columnheader', { name: 'SALES RECEIPT' }),
  ).toBeVisible({ timeout: 2000 });
  await expect(page.getByRole('columnheader', { name: 'INVOICE' })).toBeVisible(
    { timeout: 2000 },
  );
  await expect(
    page.getByRole('columnheader', { name: 'ESTIMATE' }),
  ).toBeVisible({ timeout: 2000 });
  await expect(
    page.getByRole('columnheader', { name: 'CREDIT MEMO' }),
  ).toBeVisible({ timeout: 2000 });
  await expect(
    page.getByRole('columnheader', { name: 'REFUND RECEIPT' }),
  ).toBeVisible({ timeout: 2000 });
  await expect(
    page.getByRole('columnheader', { name: 'SALES ORDER' }),
  ).toBeVisible({ timeout: 2000 });

  // PURCHASES section headers
  await expect(
    page.getByRole('columnheader', { name: 'PURCHASES' }),
  ).toBeVisible({ timeout: 2000 });
  await expect(
    page.getByRole('columnheader', { name: 'PURCHASE ORDER' }),
  ).toBeVisible({ timeout: 2000 });
  await expect(page.getByRole('columnheader', { name: 'EXPENSE' })).toBeVisible(
    { timeout: 2000 },
  );
  await expect(page.getByRole('columnheader', { name: 'BILL' })).toBeVisible({
    timeout: 2000,
  });
  await expect(page.getByRole('columnheader', { name: 'CHECK' })).toBeVisible({
    timeout: 2000,
  });
  await expect(
    page.getByRole('columnheader', { name: 'VENDOR CREDIT' }),
  ).toBeVisible({ timeout: 2000 });
  await expect(
    page.getByRole('columnheader', { name: 'CREDIT CARD CREDIT' }),
  ).toBeVisible({ timeout: 2000 });

  // ACTIONS column
  await expect(
    page.getByRole('columnheader', { name: 'ACTIONS' }),
  ).toBeVisible();
};

// click customfields edit button (scoped to Custom fields card — not Company info Edit)
export const clickCustomFieldsEditButton = async (page: Page) => {
  await ensureAccountSettingsTimePanel(page);
  const editInCustomFields = page
    .getByTestId('custom-fields-settings-view')
    .getByRole('button', { name: /^Edit$/i })
    .or(
      page.locator(
        `//*[@data-testid="custom-fields-settings-view"]//*[@aria-label="Edit"]`,
      ),
    )
    .first();
  await expect(editInCustomFields).toBeVisible({ timeout: 60_000 });
  // A transient loading/overlay mask can intercept this click even though the
  // button is visible + stable (Playwright then burns the full 30s timeout).
  // Try a normal click, then fall back to a forced click once it's confirmed
  // visible. Applies to every account (Elite/Premium/IES).
  try {
    await editInCustomFields.click({ timeout: 10_000 });
  } catch {
    await editInCustomFields.click({ force: true, timeout: 10_000 });
  }
  await page.waitForTimeout(1000);
};

//customername dropdown

export const clickCustomFieldCustomer = async (
  page: Page,
  customFieldName: string,
) => {
  await page
    .locator(`//tbody/tr[td[1]//strong[contains(text(),'${customFieldName}')]]`)
    .click();
};

export const validateTimeTrackingCustomFieldsPage = async (page: Page) => {
  await expect(
    page.locator(`//h2[contains(text(),"Custom fields")]`),
  ).toBeVisible();
  await expect(
    page.getByText('Manage custom fields for time tracking'),
  ).toBeVisible();
  await expect(
    page.getByText(
      'Add up to 12 custom fields and choose which ones your team are required to fill out when they track time.',
    ),
  ).toBeVisible();
  await expect(page.locator(`//span[text()="Add custom fields"]`)).toBeVisible({
    timeout: 2000,
  });
  await expect(page.locator(`//span[text()="Custom field"]`)).toBeVisible({
    timeout: 2000,
  });
  await expect(page.locator(`//span[text()="Data type"]`)).toBeVisible({
    timeout: 2000,
  });
  await expect(page.locator(`//span[text()="Status"]`)).toBeVisible({
    timeout: 2000,
  });
  await expect(page.locator(`//span[text()="Required"]`)).toBeVisible({
    timeout: 2000,
  });
};

// click add custom fields button
export const clickAddCustomFieldsButton = async (page: Page) => {
  await page.locator(`//span[text()="Add custom fields"]`).click();
  await page.waitForTimeout(5000);
};

// validate add custom fields page
export const validateAddCustomFieldsPage = async (page: Page) => {
  // Custom fields list is also role=dialog ("Custom fields"); nested drawer matches hasText too.
  // Closest dialog ancestor of the drawer title = inner "Add custom field" panel only (strict-safe).
  const addCustomFieldTitle = page
    .locator(
      `//h2[@data-testid='drawerTitle' and contains(text(),"Add custom field")]`,
    )
    .or(page.locator('strong').filter({ hasText: /^Add custom field$/ }));
  const addCustomFieldDialog = addCustomFieldTitle.locator(
    'xpath=ancestor::*[@role="dialog"][1]',
  );

  await expect(addCustomFieldTitle).toBeVisible();
  await expect(
    addCustomFieldDialog.getByRole('button', { name: 'Close' }),
  ).toBeVisible();
  await expect(
    addCustomFieldDialog.locator(
      `//div[contains(@class,"Drawer-footerButtons")]//span[text()="Save"]`,
    ),
  ).toBeVisible();
  await expect(
    addCustomFieldDialog.locator(`//span[text()="Name"]`),
  ).toBeVisible();
  await expect(
    addCustomFieldDialog.locator(`//label//span[text()="Data type"]`),
  ).toBeVisible();
  // Category validation will be done in specific test
};

// add custom name field with 10 characters random string
export const addCustomFieldName = async (page: Page) => {
  // Close tooltip if visible
  const closeTooltipBtn = page.getByRole('button', { name: 'Close Tooltip' });
  if (await closeTooltipBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await closeTooltipBtn.click();
    await page.waitForTimeout(500);
  }

  const randomString = Math.random().toString(36).substring(2, 15);
  const customFieldName = `Test Custom Field ${randomString}`;
  await page.getByRole('textbox', { name: 'Name' }).fill(customFieldName);
  return customFieldName;
};

export const getdropdownMenu = async (page: Page) => {
  return await page.locator(
    `//div[contains(@class, 'DataTypeSelect') and @role='listbox']`,
  );
};

export const getlistItems = async (page: Page) => {
  const dropdownMenu = await getdropdownMenu(page);
  return dropdownMenu.locator('li');
};

export const getDataTypeDropdownOptions = async (page: Page) => {
  const listItems = await getlistItems(page);
  const textContents = await listItems.allInnerTexts();
  return textContents
    .filter((text: string) => text.trim() !== '') // Remove empty strings
    .map((text: string) => text.split('\n')[0].trim()); // Extract the part before '\n' and trim whitespace
};

export const openTimeTrackingAddCustomFieldDataTypeDropdown = async (
  page: Page,
) => {
  const dropdown = page.locator('[data-id="custom-fields-drawer-type"]');
  await dropdown.waitFor({ state: 'visible' });
  await dropdown.scrollIntoViewIfNeeded();
  await dropdown.click();
  await page.waitForTimeout(2000);
};

export const validateDataTypeDropdownOptions = async (page: Page) => {
  const actualOptions = await getDataTypeDropdownOptions(page);
  // Only validate 'Text and number' and 'Dropdown list' options (skip 'Number')
  const optionsToValidate = [
    CUSTOM_FIELD_DATA_TYPES.textAndNumber,
    CUSTOM_FIELD_DATA_TYPES.dropdownList,
  ];
  optionsToValidate.forEach((option) => {
    if (!actualOptions.includes(option)) {
      throw new Error(`Option "${option}" is missing in the dropdown.`);
    }
  });
};

// select option from Data type dropdown dynamic based on parameter passed
export const selectDataTypeDropdownOption = async (
  page: Page,
  optionName: string,
) => {
  // Wait for dropdown to be open and option to be visible
  //if(optionName === 'Text and number') {
  try {
    await page
      .locator(`//li / *[text()='${optionName}']`)
      .click({ force: true });
  } catch (error) {
    await page.getByRole('option', { name: optionName }).click({ force: true });
  }
  await page.waitForTimeout(2000);
  await page.keyboard.press('Tab');
};
//};

// validate category for time tracking custom field
export const validateCategoryForTimeTrackingCustomField = async (
  page: Page,
) => {
  // validate only the Time category option is visible
  await expect(page.getByRole('radio', { name: 'Time' })).toBeVisible();
};

// select category for time tracking custom field
export const selectCategoryForTimeTrackingCustomField = async (
  page: Page,
  category: string,
) => {
  await page
    .getByRole('radio', { name: category })
    .click({ force: true, timeout: 2000 });
  await page.waitForTimeout(2000);
};

// click time tracking custom field save button
export const clickTimeTrackingCustomFieldSaveButton = async (page: Page) => {
  await page
    .locator(
      `//div[contains(@class,"Drawer-footerButtons")]//span[text()="Save"]`,
    )
    .click();
  await page.waitForTimeout(2000);
};

export const clickSaveCustomFieldsListScreen = async (page: Page) => {
  await page.locator(`//span[text()="Save"]`).click();
  await page.waitForTimeout(2000);
};

export const clickSaveButton = async (page: Page) => {
  // await page.locator("//span[text()='Save']").click();
  await page.getByRole('button', { name: 'Done' }).click();
  await page.waitForTimeout(2000);
};

// custom fields section to be visible with zero state
export const validateCustomFieldSettingsPage = async (page: Page) => {
  await expect(page.getByTestId('custom-fields-settings')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: CUSTOM_FIELD_LABELS.heading }),
  ).toBeVisible();

  await expect(
    page.getByRole('button', {
      name: CUSTOM_FIELD_LABELS.manageAllCustomFieldsText,
    }),
  ).toBeVisible();
  await expect(page.getByTestId('custom-fields-settings-view')).toContainText(
    CUSTOM_FIELD_LABELS.manageAllCustomFieldsText,
  );
};

// custom fields section to be visible with zero state
export const validateCustomFieldSettingsPageWithTimeTracking = async (
  page: Page,
) => {
  await expect(page.getByTestId('custom-fields-settings')).toBeVisible();
  await expect(
    page
      .getByLabel('Custom fields')
      .getByRole('heading', { name: 'Custom fields', exact: true }),
  ).toBeVisible({ timeout: 2000 });

  await expect(
    page
      .getByText('Go to classic QuickBooks Time')
      .or(page.locator(`//a[text()="Manage all custom fields"]`)),
  ).toBeVisible({ timeout: 2000 });

  await expect(
    page.getByRole('heading', {
      name: 'Manage custom fields for time tracking',
    }),
  ).toBeVisible({ timeout: 2000 });
};

// validate custom field added in list
export const validateCustomFieldAddedInList = async (
  page: Page,
  customFieldName: string,
  dataFieldType: string,
) => {
  // XPath to find the row containing the custom field name
  const rowXPath = `//tbody/tr[td[1]//strong[contains(text(),'${customFieldName}')]]`;
  ////tbody/tr[td[1]//strong[contains(text(),'${customFieldName}')]]//td[2][contains(text(),'${dataFieldType}')]
  const row = page.locator(rowXPath);

  if (!(await row.isVisible())) {
    await page.reload();
    await page.waitForTimeout(2000);
    await clickCustomFieldsEditButton(page);
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);
  }

  // Validate all columns within the found row using full XPath expressions
  await expect(
    page.locator(`//strong[contains(text(),'${customFieldName}')]`),
  ).toBeVisible();
  await expect(
    page.locator(`${rowXPath}//td[2][contains(text(),'${dataFieldType}')]`),
  ).toBeVisible();
  await expect(
    page
      .locator(`${rowXPath}/td[3][contains(text(),'Active')]`)
      .or(page.locator(`${rowXPath}/td[5][contains(text(),'Active')]`)),
  ).toBeVisible();
  await expect(
    page
      .locator(`${rowXPath}/td[4]//span[contains(text(),'No')]`)
      .or(page.locator(`${rowXPath}/td[6]//span[contains(text(),'No')]`)),
  ).toBeVisible();
};

// get custom field require field toggle state
export const getCustomFieldRequireFieldToggleState = async (page: Page) => {
  const toggleSwitch = await page.locator(
    '(//input[@type="checkbox"][@role="switch"])[1]',
  );
  const isChecked = await toggleSwitch.isChecked();
  const ariaChecked = await toggleSwitch.getAttribute('aria-checked');
  return { isChecked, ariaChecked };
};

// click custom field require field toggle to turn it ON
export const makeCustomFieldRequireFieldToggleON = async (page: Page) => {
  const toggleSwitch = await page.locator(
    '(//input[@type="checkbox"][@role="switch"])[1]',
  );
  await page.waitForTimeout(2000);
  const isChecked = await toggleSwitch.isChecked();
  const ariaChecked = await toggleSwitch.getAttribute('aria-checked');

  // Condition: If the switch is ON (true), then click to turn it OFF
  if (isChecked || ariaChecked === 'true') {
  } else {
    expect(
      page
        .locator('div[class*="RequiredContainer"] span:has-text("No")')
        .first(),
    ).toBeVisible();

    await toggleSwitch.click({ timeout: 2000 });
    await page.waitForTimeout(1000); // Wait for toggle animation

    // Verify the toggle was clicked successfully
    const newState = await toggleSwitch.isChecked();
    const newAriaChecked = await toggleSwitch.getAttribute('aria-checked');
    await page.waitForTimeout(2000);
    expect(newState).toBe(true);
    expect(newAriaChecked).toBe('true');
  }
};

// click custom field require field toggle to turn it OFF
export const makeCustomFieldRequireFieldToggleOFF = async (page: Page) => {
  const toggleSwitch = await page.locator(
    '(//input[@type="checkbox"][@role="switch"])[1]',
  );
  const isChecked = await toggleSwitch.isChecked();
  const ariaChecked = await toggleSwitch.getAttribute('aria-checked');

  // Condition: If the switch is OFF (false), then click to turn it ON
  if (!isChecked || ariaChecked === 'false') {
    await page.waitForTimeout(1000); // Wait for toggle animation
  } else {
    expect(
      page
        .locator('div[class*="RequiredContainer"] span:has-text("Yes")')
        .first(),
    ).toBeVisible();

    //await toggleSwitch.click({ timeout: 2000 });
    await page.waitForTimeout(1000); // Wait for toggle animation

    // Verify the toggle was clicked successfully
    const newState = await toggleSwitch.isChecked();
    const newAriaChecked = await toggleSwitch.getAttribute('aria-checked');
    await page.waitForTimeout(2000);
    expect(newState).toBe(false);
    expect(newAriaChecked).toBe('false');
  }
};

// click custom field settings close button
export const clickCustomFieldSettingsCloseButton = async (page: Page) => {
  await page
    .getByLabel('Custom fields')
    .getByRole('button', { name: 'Close' })
    .first()
    .click({ timeout: 2000 });
  await page.waitForTimeout(2000);
};

// click custom field settings cancel button
export const clickCustomFieldSettingsCancelButton = async (page: Page) => {
  await page
    .getByLabel('Custom fields')
    .getByRole('button', { name: 'Cancel' })
    .click({ timeout: 2000 });
  await page.waitForTimeout(2000);
};

// click custom field settings save button
export const clickCustomFieldSettingsSaveButton = async (page: Page) => {
  await page
    .getByLabel('Custom fields')
    .getByRole('button', { name: 'Save' })
    .click({ timeout: 2000 });
  await page.waitForTimeout(2000);
};

// validate custom field settings confirmation popup visible
export const validateCustomFieldSettingsConfirmationPopupVisible = async (
  page: Page,
) => {
  expect(page.getByTestId('ModalDialog').getByRole('heading')).toContainText(
    'Do you want to leave without saving?',
  );
  expect(
    page.getByTestId('ModalDialog').getByRole('button', { name: 'No' }),
  ).toBeVisible();
  expect(
    page.getByTestId('ModalDialog').getByRole('button', { name: 'Yes' }),
  ).toBeVisible();
};

// click custom field settings confirmation popup no button
export const clickCustomFieldSettingsConfirmationPopupNoButton = async (
  page: Page,
  buttonName: string,
) => {
  expect(
    page.getByTestId('ModalDialog').getByRole('button', { name: buttonName }),
  ).toBeVisible();
  await page
    .getByTestId('ModalDialog')
    .getByRole('button', { name: buttonName })
    .click();
  await page.waitForTimeout(2000);
};

// click add custom field - close button
export const clickAddCustomFieldPageCloseButton = async (page: Page) => {
  await page
    .locator(
      `//h2[@data-testid='drawerTitle']/../parent::div//button[@aria-label="Close"]`,
    )
    .first()
    .click();
  await page.waitForTimeout(2000);
};

// validate add custom field page confirmation popup visible
export const validateAddCustomFieldPageConfirmationPopupVisible = async (
  page: Page,
) => {
  expect(page.getByTestId('ModalDialog').getByRole('heading')).toContainText(
    'Save your custom fields before leaving',
  );
  expect(page.getByTestId('ModalDialog').getByRole('paragraph')).toContainText(
    'Your work will be lost if you leave. Do you want to leave without saving?',
  );
  expect(
    page.getByTestId('ModalDialog').getByRole('button', { name: 'No' }),
  ).toBeVisible({ timeout: 2000 });
  expect(
    page.getByTestId('ModalDialog').getByRole('button', { name: 'Yes' }),
  ).toBeVisible({ timeout: 2000 });
};

export const closeAddCustomFieldTooltip = async (page: Page) => {
  const closeTooltipButton = await page
    .getByRole('dialog')
    .filter({ hasText: 'Add Custom FieldsCreate' })
    .getByLabel('Close');
  if (await closeTooltipButton.isVisible()) {
    await closeTooltipButton.click();
    await page.waitForTimeout(1000);
  }
};

export const handleTimeSettingsModal = async (page: Page) => {
  // Utility function to handle popups that may appear in any order
  let popupsHandled = 0;
  const maxAttempts = 10; // Prevent infinite loops
  for (let attempt = 0; attempt < maxAttempts && popupsHandled < 2; attempt++) {
    let handledThisRound = false;

    // Check for "Just around the corner" popup
    if (
      await page
        .getByRole('heading', { name: 'Streamlined time settings' })
        .first()
        .isVisible({ timeout: 3000 })
    ) {
      await page
        .getByRole('button', { name: 'Got it' })
        .first()
        .click({ force: true, timeout: 3000 });
      await page.waitForTimeout(500);
      popupsHandled++;
      handledThisRound = true;
    }

    // If no popups were handled this round, break the loop
    if (!handledThisRound) {
      break;
    }
  }
};

// Get custom field number of rows in the CustomFieldsTable data grid
export const getCustomFieldNumberOfRowsInDataGrid = async (page: Page) => {
  // Target the specific CustomFieldsTable and count tbody rows
  const customFieldsTable = page.locator(
    'table[class*="CustomFieldsTablestyled__StyledTable"]',
  );
  const rows = await customFieldsTable.locator('tbody tr').count();
  return rows;
};

// get custom field pagination summary text
export const getCustomFieldPaginationSummary = async (page: Page) => {
  const paginationSummary = await page
    .locator(`//div[contains(@data-testid, 'pagination-summary')]`)
    .textContent();
  return paginationSummary;
};

// get custom field pagination current page number value
export const getCustomFieldPaginationCurrentPageNumber = async (page: Page) => {
  const paginationPageNumber = await page
    .getByRole('spinbutton', { name: 'Page number' })
    .inputValue();
  return paginationPageNumber;
};

// get custom field pagination total number of pages
export const getCustomFieldPaginationNumberOfPages = async (page: Page) => {
  const totalPages = await page
    .locator(
      `//div[contains(@class, 'Pagination-paginationTextField')]/following-sibling::span`,
    )
    .textContent();
  const totalPagesNumber = totalPages?.replace('of ', '').trim();
  return totalPagesNumber;
};

// Get all pagination information at once
export const validateCustomFieldPaginationInfo = async (
  page: Page,
  expectedNumberOfRows: number,
  expectedSummary: string,
  expectedCurrentPage: number,
  expectedTotalPages: number,
) => {
  const numberOfRows = await getCustomFieldNumberOfRowsInDataGrid(page);
  const summary = await getCustomFieldPaginationSummary(page);
  const currentPage = parseInt(
    await getCustomFieldPaginationCurrentPageNumber(page),
  );
  const totalPages = parseInt(
    (await getCustomFieldPaginationNumberOfPages(page)) || '1',
  );

  expect(numberOfRows).toBe(expectedNumberOfRows);
  expect(summary).toBe(expectedSummary);
  expect(currentPage).toBe(expectedCurrentPage);
  expect(totalPages).toBe(expectedTotalPages);
};

// Add dropdown values for dropdown list custom field
export const addDropdownValue = async (page: Page, value: string) => {
  const addValueButton = page.locator(`//div[text()="Add item"]`);
  await addValueButton.click();
  await page.waitForTimeout(1000);
  const valueInputs = page
    .locator('//input[@aria-label="custom-field-drop-down-value"]')
    .first();
  const lastInput = page
    .locator('//input[@aria-label="custom-field-drop-down-value"]')
    .nth(2);
  await lastInput.fill(value);
  await page.waitForTimeout(500);
};

// Add multiple dropdown values
export const addMultipleDropdownValues = async (
  page: Page,
  values: string[],
) => {
  for (const value of values) {
    await addDropdownValue(page, value);
  }
};

// Get custom field row by name
export const getCustomFieldRow = (page: Page, customFieldName: string) => {
  return page.locator(`//strong[contains(text(),'${customFieldName}')]`);
};

export const getCustomFieldNewRow = (page: Page, newFieldName: string) => {
  return page.locator(`//div[contains(text(),'${newFieldName}')]`);
};

export const getCustomFieldNewEditRow = (
  page: Page,
  customFieldName: string,
) => {
  return page.locator(`//div[contains(text(),'${customFieldName}')]`);
};

// Click Actions dropdown for a custom field
export const clickCustomFieldActionsDropdown = async (
  page: Page,
  customFieldName: string,
) => {
  const row = getCustomFieldRow(page, customFieldName);
  const actionsButton = page
    .locator(`//button[@aria-haspopup="listbox"]`)
    .or(page.locator(`//button[@aria-haspopup="menu"]`))
    .first();
  await actionsButton.click();
  await page.waitForTimeout(1000);
};

// Click Edit option from Actions dropdown
export const clickEditCustomField = async (
  page: Page,
  customFieldName: string,
) => {
  await clickCustomFieldActionsDropdown(page, customFieldName);
  await page.getByRole('menuitem', { name: 'Edit' }).click();
  await page.waitForTimeout(2000);
};

/** Manage-all custom fields row menu after opening the listbox trigger. */
export const clickMakeInactiveFromOpenCustomFieldMenu = async (
  page: Page,
): Promise<void> => {
  await page
    .getByRole('option', { name: 'Make inactive' })
    .click({ timeout: 20000 });
};

// Click Make inactive option from Actions dropdown
export const clickMakeInactiveCustomField = async (
  page: Page,
  customFieldName: string,
) => {
  await clickCustomFieldActionsDropdown(page, customFieldName);
  await clickMakeInactiveFromOpenCustomFieldMenu(page);
  await page.waitForTimeout(2000);
};

// Edit custom field name
export const editCustomFieldName = async (page: Page, newName: string) => {
  const nameInput = page.getByRole('textbox', { name: 'Name' });
  await nameInput.clear();
  await nameInput.fill(newName);
  await page.waitForTimeout(500);
};

// Click Assign Customers button for a custom field
export const clickAssignCustomersForCustomField = async (
  page: Page,
  customFieldName: string,
) => {
  const tableRow = getCustomFieldRow(page, customFieldName).locator(
    'xpath=ancestor::tr[1]',
  );
  // Label is often in a child node; panel title uses "Assign customers" (see verifyAssignCustomersPanelVisible).
  const assignButton = tableRow
    .getByRole('button', { name: /assign customers/i })
    .or(tableRow.getByRole('link', { name: /assign customers/i }));
  await assignButton.click();
  await page.waitForTimeout(2000);
};

// Click Assign Workers button for a custom field
export const clickAssignWorkersForCustomField = async (
  page: Page,
  customFieldName: string,
) => {
  const tableRow = getCustomFieldRow(page, customFieldName).locator(
    'xpath=ancestor::tr[1]',
  );
  const assignButton = tableRow
    .getByRole('button', { name: /assign workers/i })
    .or(tableRow.getByRole('link', { name: /assign workers/i }));
  await assignButton.click();
  await page.waitForTimeout(2000);
};

// Select customer in Assign Customers panel
export const selectCustomerInAssignPanel = async (
  page: Page,
  customerName: string,
) => {
  const panel = page.getByRole('dialog', { name: /Assign customers/i });
  await panel.waitFor({ state: 'visible', timeout: 20_000 });

  // Guardrail: never allow the group toggle to be treated as a "customer".
  if (/customers\/projects/i.test(customerName.trim())) {
    throw new Error(
      `selectCustomerInAssignPanel: refusing to select group toggle "${customerName}"`,
    );
  }
  if (/^all items$/i.test(customerName.trim())) {
    throw new Error(
      `selectCustomerInAssignPanel: refusing to select all-items toggle "${customerName}"`,
    );
  }

  // Prefer deterministic checkbox in this panel: aria-label="Select <customer>"
  const byAriaExact = panel.locator(
    `input[type="checkbox"][aria-label="Select ${customerName}"]`,
  );
  if (await byAriaExact.isVisible({ timeout: 2000 }).catch(() => false)) {
    if (!(await byAriaExact.isChecked().catch(() => false))) {
      await byAriaExact.check();
    }
    await page.waitForTimeout(300);
    return;
  }

  // If list is virtualized / not in view, try searching within the panel.
  const search = panel
    .locator('input[placeholder="Search"], input[type="search"]')
    .first();
  if (await search.isVisible({ timeout: 1500 }).catch(() => false)) {
    await search.fill(customerName);
    await page.waitForTimeout(500);
  }

  const byAriaCandidates = panel.locator(
    `input[type="checkbox"][aria-label^="Select "]`,
  );
  const n = await byAriaCandidates.count();
  for (let i = 0; i < n; i++) {
    const cb = byAriaCandidates.nth(i);
    const aria = (await cb.getAttribute('aria-label')) || '';
    // Skip the group toggle in the customer list.
    if (/select\s+customers\/projects/i.test(aria.trim())) continue;
    if (/select\s+all\s+items/i.test(aria.trim())) continue;
    if (aria.toLowerCase() === `select ${customerName}`.toLowerCase()) {
      if (!(await cb.isChecked().catch(() => false))) await cb.check();
      await page.waitForTimeout(300);
      return;
    }
    if (aria.toLowerCase().includes(customerName.toLowerCase())) {
      if (!(await cb.isChecked().catch(() => false))) await cb.check();
      await page.waitForTimeout(300);
      return;
    }
  }

  // Last resort: role-based checkbox (less reliable in this UI, but useful on some shells).
  const byRole = panel.getByRole('checkbox', {
    name: new RegExp(customerName, 'i'),
  });
  await byRole.first().waitFor({ state: 'visible', timeout: 15_000 });
  // Avoid group toggle again on role-based fallback.
  const aria = (await byRole.first().getAttribute('aria-label')) || '';
  if (/select\s+customers\/projects/i.test(aria.trim())) {
    throw new Error(
      `selectCustomerInAssignPanel: role-based match resolved to group toggle for "${customerName}"`,
    );
  }
  if (
    !(await byRole
      .first()
      .isChecked()
      .catch(() => false))
  ) {
    await byRole.first().check();
  }
  await page.waitForTimeout(300);
};

// Unselect all customers in Assign Customers panel
export const unselectAllCustomersInAssignPanel = async (
  page: Page,
  savePanel = true,
) => {
  const panel = page.getByRole('dialog', { name: /Assign customers/i });
  const scope = (await panel.isVisible().catch(() => false)) ? panel : page;

  // Top-level group checkbox is often "Customers/Projects" (aria-label="Select Customers/Projects"),
  // not "Select all items". Prefer that first.
  const groupToggle = scope
    .locator(
      [
        // Common current shell (your screenshot): "Customers/Projects"
        'input[type="checkbox"][aria-label="Select Customers/Projects"]',
        'input[type="checkbox"][aria-label^="Select Customers"]',
        'input[type="checkbox"][aria-label*="Customers/Projects"]',
        // Older shells: still a group toggle, but label varies. Keep as last resort.
        'input[type="checkbox"][aria-label^="Select "]',
      ].join(', '),
    )
    .first();
  if (await groupToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
    const checked = await groupToggle.isChecked().catch(() => false);
    if (checked) {
      await groupToggle.uncheck();
      await page.waitForTimeout(500);
    }
  }

  // Also uncheck any remaining individual checkboxes (covers nested lists / legacy tables)
  const checkboxes = scope.locator('input[type="checkbox"]');
  const count = await checkboxes.count();
  for (let i = 0; i < count; i++) {
    const checkbox = checkboxes.nth(i);
    // Avoid re-toggling the group checkbox in this loop; its behavior can re-check children.
    const aria = (await checkbox.getAttribute('aria-label')) || '';
    if (/^select\s+customers\/projects$/i.test(aria.trim())) continue;
    if (await checkbox.isChecked().catch(() => false)) {
      await checkbox.uncheck();
    }
  }
  await page.waitForTimeout(800);
  if (savePanel) {
    await clickSaveAssignCustomersPanel(page);
    await waitForAssignCustomersPanelDismissed(page);
  }
};

export const selectAllCustomersInAssignPanel = async (page: Page) => {
  const panel = page.getByRole('dialog', { name: /Assign customers/i });
  const scope = (await panel.isVisible().catch(() => false)) ? panel : page;

  const groupToggle = scope
    .locator(
      [
        'input[type="checkbox"][aria-label="Select Customers/Projects"]',
        'input[type="checkbox"][aria-label^="Select Customers"]',
        'input[type="checkbox"][aria-label*="Customers/Projects"]',
        'input[type="checkbox"][aria-label^="Select "]',
      ].join(', '),
    )
    .first();
  await groupToggle.waitFor({ state: 'visible', timeout: 20_000 });
  const isChecked = await groupToggle.isChecked().catch(() => false);
  if (!isChecked) {
    await groupToggle.check();
  }
  await page.waitForTimeout(800);
  await clickSaveAssignCustomersPanel(page);
  await waitForAssignCustomersPanelDismissed(page);
};

// Select worker in Assign Workers panel
export const selectWorkerInAssignPanel = async (
  page: Page,
  workerName: string,
) => {
  const workerCheckbox = page.getByRole('checkbox', {
    name: new RegExp(workerName, 'i'),
  });
  await workerCheckbox.check();
  await page.waitForTimeout(500);
};

/** Save on the Assign workers panel (not the Custom fields screen footer Save). */
export const clickSaveAssignWorkersPanel = async (
  page: Page,
): Promise<void> => {
  const panel = page.getByRole('dialog', { name: /Assign workers/i });
  const saveBtn = panel.getByRole('button', { name: 'Save' });
  await saveBtn.waitFor({ state: 'visible', timeout: 20_000 });

  const ariaDisabled = await saveBtn.getAttribute('aria-disabled');
  const saveLooksDisabled =
    !(await saveBtn.isEnabled()) || ariaDisabled === 'true';

  if (saveLooksDisabled) {
    const dismiss = panel
      .getByRole('button', { name: /^cancel$/i })
      .or(panel.locator('button[aria-label="Close"]'))
      .first();
    if (await dismiss.isVisible({ timeout: 5000 }).catch(() => false)) {
      await dismiss.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await panel.waitFor({ state: 'hidden', timeout: 20_000 }).catch(() => {});
    await page.waitForTimeout(300);
    return;
  }

  await saveBtn.click();
};

/** Save on the Assign customers panel so checkbox changes persist (Close alone discards). */
export const clickSaveAssignCustomersPanel = async (
  page: Page,
): Promise<void> => {
  const panel = page.getByRole('dialog', { name: /Assign customers/i });
  const saveBtn = panel.getByRole('button', { name: /^save$/i }).first();
  if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    const ariaDisabled = await saveBtn.getAttribute('aria-disabled');
    const saveLooksDisabled =
      !(await saveBtn.isEnabled().catch(() => false)) ||
      ariaDisabled === 'true';

    if (saveLooksDisabled) {
      const dismiss = panel
        .getByRole('button', { name: /^cancel$/i })
        .or(panel.getByRole('button', { name: /^close$/i }))
        .or(panel.locator('button[aria-label="Close"]'))
        .first();
      if (await dismiss.isVisible({ timeout: 5000 }).catch(() => false)) {
        await dismiss.click();
      } else {
        await page.keyboard.press('Escape');
      }
      await panel.waitFor({ state: 'hidden', timeout: 20_000 }).catch(() => {});
      await page.waitForTimeout(300);
      return;
    }

    await saveBtn.click();
    return;
  }

  // Legacy drawer shell
  const legacySave = page.locator(
    `//div[contains(@class,"AssignmentDrawerstyled")]//button[.//span[text()='Save']]`,
  );
  if (await legacySave.isVisible({ timeout: 5000 }).catch(() => false)) {
    const ariaDisabled = await legacySave.getAttribute('aria-disabled');
    const saveLooksDisabled =
      !(await legacySave.isEnabled().catch(() => false)) ||
      ariaDisabled === 'true';
    if (saveLooksDisabled) {
      const legacyClose = page
        .locator(
          `//div[contains(@class,"AssignmentDrawerstyled")]//button[@aria-label="Close"]`,
        )
        .or(page.getByRole('button', { name: /^cancel$/i }))
        .first();
      if (await legacyClose.isVisible({ timeout: 5000 }).catch(() => false)) {
        await legacyClose.click();
      } else {
        await page.keyboard.press('Escape');
      }
      await panel.waitFor({ state: 'hidden', timeout: 20_000 }).catch(() => {});
      await page.waitForTimeout(300);
      return;
    }
    await legacySave.click();
  }
};

/**
 * Assign customers often stays on screen after Save; the parent drawer Close is not clickable until this layer is gone.
 */
export const waitForAssignCustomersPanelDismissed = async (
  page: Page,
): Promise<void> => {
  const panel = page
    .getByRole('dialog', { name: /Assign Customers/i })
    .or(page.getByText('Assign Customers', { exact: true }));
  const dismissed = await panel
    .first()
    .waitFor({ state: 'hidden', timeout: 25_000 })
    .then(() => true)
    .catch(() => false);
  if (dismissed) {
    await page.waitForTimeout(300);
    return;
  }
  const closeBtn = panel
    .first()
    .locator('button[aria-label="Close"]')
    .or(panel.first().getByRole('button', { name: /^close$/i }))
    .first();
  if (await closeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await closeBtn.click();
  } else {
    await page.keyboard.press('Escape');
  }
  await panel
    .first()
    .waitFor({ state: 'hidden', timeout: 20_000 })
    .catch(() => {});
  await page.waitForTimeout(500);
};

/**
 * After Assign customers closes, persist and leave the manage-all / edit list shell.
 * Older builds nested an edit drawer (`Drawer-headerRightActionButton` Close then modal Save); the current
 * Custom fields modal uses a top-level Save and often has no that close control — waiting on it times out.
 */
export const exitCustomFieldsEditAfterAssignCustomers = async (
  page: Page,
): Promise<void> => {
  const legacyDrawerClose = page.locator(
    `//div[contains(@class,"Drawer-headerRightActionButton")]//button[@aria-label="Close"]`,
  );
  if (await legacyDrawerClose.isVisible({ timeout: 4000 }).catch(() => false)) {
    await legacyDrawerClose.click();
    await page.waitForTimeout(500);
  }

  const modal = page.getByTestId('ModalDialog');
  const labeledSave = page
    .getByLabel('Custom fields')
    .getByRole('button', { name: /^Save$/i });
  const modalSave = modal.getByRole('button', { name: /^Save$/i });

  if (await labeledSave.isVisible({ timeout: 6000 }).catch(() => false)) {
    await labeledSave.click({ timeout: 30_000 });
  } else if (
    await modalSave
      .first()
      .isVisible({ timeout: 6000 })
      .catch(() => false)
  ) {
    await modalSave.last().click({ timeout: 30_000 });
  } else {
    await modal.locator(`//span[text()='Save']`).last().click({
      timeout: 30_000,
    });
  }
  await page.waitForTimeout(2000);
};

// Unselect all workers in Assign Workers panel
export const unselectAllWorkersInAssignPanel = async (page: Page) => {
  const panel = page.getByRole('dialog', { name: /Assign workers/i });
  // Top-level group checkbox is often "Workers" (aria-label="Select Workers"), not "Select all".
  const groupToggle = panel
    .locator('input[type="checkbox"][aria-label^="Select "]')
    .first();
  if (await groupToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
    const checked = await groupToggle.isChecked().catch(() => false);
    if (checked) {
      await groupToggle.uncheck();
      await page.waitForTimeout(500);
    }
  }
  const checkboxes = panel.locator('input[type="checkbox"]');
  const count = await checkboxes.count();
  for (let i = 0; i < count; i++) {
    const checkbox = checkboxes.nth(i);
    if (await checkbox.isChecked().catch(() => false)) {
      await checkbox.uncheck();
    }
  }
  await page.waitForTimeout(800);
};

export const unselectAllCustomersInAssignmentTrackingPanel = async (
  page: Page,
) => {
  const selectAllCheckbox = page.locator(`//input[@type="checkbox"]`).first();
  const isChecked = await selectAllCheckbox.isChecked().catch(() => false);
  if (isChecked) {
    await selectAllCheckbox.uncheck();
  }
  // Also uncheck individual checkboxes
  const checkboxes = page.locator('//input[@type="checkbox"]');
  const count = await checkboxes.count();
  for (let i = 0; i < count; i++) {
    const checkbox = checkboxes.nth(i);
    if (await checkbox.isChecked()) {
      await checkbox.uncheck();
    }
  }
  await page.waitForTimeout(1000);
};

// Get customer assignment count text from table
export const getCustomerAssignmentCount = async (
  page: Page,
  customFieldName: string,
) => {
  const row = getCustomFieldRow(page, customFieldName);
  const customerCell = row.locator('td').filter({ hasText: /of \d+/i });
  return await customerCell.textContent();
};

// Get worker assignment count text from table
export const getWorkerAssignmentCount = async (
  page: Page,
  customFieldName: string,
) => {
  const row = getCustomFieldRow(page, customFieldName);
  const workerCell = row.locator('td').filter({ hasText: /of \d+/i });
  return await workerCell.textContent();
};

// Verify customer assignment panel is visible
export const verifyAssignCustomersPanelVisible = async (page: Page) => {
  await expect(
    page.getByRole('dialog', { name: /Assign customers/i }),
  ).toBeVisible({ timeout: 60_000 });
};

// Verify assign workers panel is visible
export const verifyAssignWorkersPanelVisible = async (page: Page) => {
  await expect(
    page.getByRole('heading', { name: /Assign workers/i }),
  ).toBeVisible();
};

// Get Required toggle for a custom field by name
export const getRequiredToggleForCustomField = async (
  page: Page,
  customFieldName: string,
) => {
  const row = getCustomFieldRow(page, customFieldName);
  return row.locator('input[type="checkbox"][role="switch"]').first();
};

// Toggle Required ON for a custom field by name
export const toggleRequiredONForCustomField = async (
  page: Page,
  customFieldName: string,
) => {
  const requiredToggle = page
    .locator(
      `//tbody/tr[td[1]//strong[contains(text(),'${customFieldName}')]]/td[6]//input[@type="checkbox"]`,
    )
    .first();

  if (await requiredToggle.isVisible()) {
    const isEnabled =
      (await requiredToggle.getAttribute('aria-checked')) === 'true';
    if (!isEnabled) {
      await requiredToggle.click();
    }
  }
};

// Toggle Required OFF for a custom field by name
export const toggleRequiredOFFForCustomField = async (
  page: Page,
  customFieldName: string,
) => {
  const requiredToggle = page.locator(
    `//tbody/tr[td[1]//strong[contains(text(),'${customFieldName}')]]/td[6]//input[@type="checkbox" and @aria-checked="true"] `,
  );

  if (await requiredToggle.isVisible()) {
    await requiredToggle.click();
  }
};

// Verify Required status in table
export const verifyRequiredStatusOffInTable = async (
  page: Page,
  customFieldName: string,
) => {
  //const row = getCustomFieldRow(page, customFieldName);
  await expect(
    page.locator(
      `//strong[contains(text(), '${customFieldName}')]/ancestor::tr/td//span[text()="No"]`,
    ),
  ).toBeVisible();
};

export const verifyRequiredStatusOnInTable = async (
  page: Page,
  customFieldName: string,
) => {
  //const row = getCustomFieldRow(page, customFieldName);
  await expect(
    page.locator(
      `//strong[contains(text(), '${customFieldName}')]/ancestor::tr/td//span[text()="Yes"]`,
    ),
  ).toBeVisible();
};
// Click Assign Customers for standard field (Timesheet settings table)
export const clickAssignCustomersForStandardField = async (
  page: Page,
  fieldName: string,
) => {
  // If already open (caller might retry), don't click anything again.
  const alreadyOpen = page.getByRole('dialog', { name: /Assign customers/i });
  if (await alreadyOpen.isVisible().catch(() => false)) {
    return;
  }

  if (fieldName.trim() === 'Class') {
    await clickAssignCustomersForClassFieldRow(page);
    return;
  }

  // Location has no Service-style value rows; **View** opens an empty "Location values" table with no Assign customers.
  // The main list row still exposes Assign customers via link or overflow menu (see MainListOnly).
  if (fieldName.trim() === 'Location') {
    await clickAssignCustomersForStandardFieldMainListOnly(page, fieldName);
    return;
  }

  /** Prefer the shell that actually shows "Timesheet settings" — `.first()` dialog is often the wrong layer. */
  const timesheetModal = page
    .locator('[data-testid="ModalDialog"]')
    .filter({ hasText: /timesheet settings/i })
    .or(page.getByRole('dialog').filter({ hasText: /timesheet settings/i }))
    .first();
  const shell = (await timesheetModal
    .isVisible({ timeout: 4000 })
    .catch(() => false))
    ? timesheetModal
    : page.getByTestId('ModalDialog').or(page.getByRole('dialog')).first();

  /**
   * Matches {@link validateStandardFieldsSaveFailureError}: actions are often **text** links, not stable roles.
   */
  const clickAssignCustomersInTableRow = async (row: Locator) => {
    const assign = row
      .getByText(/^assign customers$/i)
      .or(
        row.locator('a, button, [role="link"], [role="button"]').filter({
          hasText: /assign customer/i,
        }),
      )
      .or(
        row.locator(
          `xpath=.//a[contains(normalize-space(.), 'Assign Customer')] | .//button[contains(normalize-space(.), 'Assign Customer')]`,
        ),
      )
      .first();
    await expect(assign).toBeVisible({ timeout: 15_000 });
    await assign.click();
    await page.waitForTimeout(1500);
  };

  /**
   * Standard-field **values** screen (e.g. Service item): rows are Hours/Sales with Assign Customers.
   * Exclude rows that include the **field label** (the main list row is still "Service item … Assign …" on some shells).
   */
  const valueAssignRow = shell
    .locator('tbody tr')
    .filter({ hasText: /assign customers/i })
    .filter({ hasNot: page.getByText(fieldName, { exact: true }) })
    .first();
  if (await valueAssignRow.isVisible({ timeout: 5000 }).catch(() => false)) {
    await clickAssignCustomersInTableRow(valueAssignRow);
    return;
  }

  // Main timesheet-fields list: match the row by **exact** field label, not substring (avoids "Service item values").
  const fieldRow = page
    .locator('tbody tr')
    .filter({ has: page.getByText(fieldName, { exact: true }) })
    .first();
  await expect(fieldRow).toBeVisible({ timeout: 15_000 });

  const directAssign = fieldRow
    .getByRole('button', { name: /assign customers/i })
    .or(fieldRow.getByRole('link', { name: /assign customers/i }))
    .or(fieldRow.getByText(/^assign customers$/i))
    .or(fieldRow.locator('a, button').filter({ hasText: /assign customer/i }));
  if (
    await directAssign
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    await directAssign.first().click();
    await page.waitForTimeout(1500);
    return;
  }

  const expandMenu = fieldRow
    .locator('[aria-label="Expand Menu"]')
    .or(fieldRow.getByRole('button', { name: /expand menu/i }))
    .first();
  await expect(expandMenu).toBeVisible({ timeout: 15_000 });
  await expandMenu.click();
  await page.waitForTimeout(500);
  // Some Timesheet-settings shells open a real menu; others navigate into a standard-field detail
  // screen (e.g., "Service item" values) where "Assign Customers" is a row action, not a menuitem.
  const assignCustomersMenuItem = page.getByText('Assign Customers', {
    exact: true,
  });
  if (
    await assignCustomersMenuItem
      .isVisible({ timeout: 2000 })
      .catch(() => false)
  ) {
    await assignCustomersMenuItem.click();
    await page.waitForTimeout(1500);
    return;
  }

  // Landed on values detail: re-resolve timesheet modal, then pick a **value** row (not the field label row).
  const timesheetModal2 = page
    .locator('[data-testid="ModalDialog"]')
    .filter({ hasText: /timesheet settings/i })
    .or(page.getByRole('dialog').filter({ hasText: /timesheet settings/i }))
    .first();
  const shell2 = (await timesheetModal2
    .isVisible({ timeout: 4000 })
    .catch(() => false))
    ? timesheetModal2
    : page.getByTestId('ModalDialog').or(page.getByRole('dialog')).first();
  const detailAssignRow = shell2
    .locator('tbody tr')
    .filter({ hasText: /assign customers/i })
    .filter({ hasNot: page.getByText(fieldName, { exact: true }) })
    .first();
  await expect(detailAssignRow).toBeVisible({ timeout: 15_000 });
  await clickAssignCustomersInTableRow(detailAssignRow);
};

/**
 * **Timesheet fields** main list only: open **Assign customers** for the standard-field row (`fieldName`).
 * Does not use the Service-item **values** table (Hours/Sales); use before **View** per QBO flow.
 */
export const clickAssignCustomersForStandardFieldMainListOnly = async (
  page: Page,
  fieldName: string,
) => {
  if (fieldName.trim() === 'Class') {
    await clickAssignCustomersForClassFieldRow(page);
    return;
  }

  const alreadyOpen = page.getByRole('dialog', { name: /Assign customers/i });
  if (await alreadyOpen.isVisible().catch(() => false)) {
    return;
  }

  const timesheetModal = page
    .locator('[data-testid="ModalDialog"]')
    .filter({ hasText: /timesheet settings/i })
    .or(page.getByRole('dialog').filter({ hasText: /timesheet settings/i }))
    .first();
  const shell = (await timesheetModal
    .isVisible({ timeout: 4000 })
    .catch(() => false))
    ? timesheetModal
    : page.getByTestId('ModalDialog').or(page.getByRole('dialog')).first();

  const fieldRow = shell
    .locator('tbody tr')
    .filter({ has: page.getByText(fieldName, { exact: true }) })
    .first();
  await expect(fieldRow).toBeVisible({ timeout: 15_000 });

  const directAssign = fieldRow
    .getByRole('button', { name: /assign customers/i })
    .or(fieldRow.getByRole('link', { name: /assign customers/i }))
    .or(fieldRow.getByText(/^assign customers$/i))
    .or(fieldRow.locator('a, button').filter({ hasText: /assign customer/i }));
  if (
    await directAssign
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    await directAssign.first().click();
    await page.waitForTimeout(1500);
    return;
  }

  const menuTrigger = fieldRow
    .locator('[aria-label="Expand Menu"]')
    .or(fieldRow.getByRole('button', { name: /expand menu/i }))
    .or(
      fieldRow.locator(
        'button[aria-haspopup="menu"], button[aria-haspopup="true"]',
      ),
    )
    .first();
  await expect(menuTrigger).toBeVisible({ timeout: 15_000 });
  await menuTrigger.click();
  await page.waitForTimeout(500);
  const assignCustomersMenuItem = page
    .getByRole('menuitem', { name: /assign customers/i })
    .or(
      page.locator(
        `//*[self::span or self::div][normalize-space(.)='Assign customers']`,
      ),
    )
    .first();
  await expect(assignCustomersMenuItem).toBeVisible({ timeout: 8000 });
  await assignCustomersMenuItem.click();
  await page.waitForTimeout(1500);
};

/** Class row: chevron → Assign Customers (not View). */
export const clickAssignCustomersForClassFieldRow = async (page: Page) => {
  const fieldName = 'Class';
  const dialog = page.getByRole('dialog', { name: /Assign customers/i });
  if (await dialog.isVisible().catch(() => false)) {
    return;
  }

  const chevron = page.locator(
    `xpath=//*[normalize-space(.)="${fieldName}"]/ancestor::tr[1]/descendant::*[@data-testid="chevron-down-icon-control"]`,
  );
  await chevron.scrollIntoViewIfNeeded({ timeout: 25_000 });
  await expect(chevron).toBeVisible({ timeout: 25_000 });

  const menuItem = page
    .getByRole('menuitem', { name: /^Assign Customers$/i })
    .or(
      page.locator(
        `//*[self::span or self::div][normalize-space(.)='Assign customers']`,
      ),
    )
    .first();

  const maxAttempts = 3;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (await dialog.isVisible({ timeout: 1000 }).catch(() => false)) {
      return;
    }
    await chevron.click({ force: true });
    await page.waitForTimeout(500);
    if (await menuItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      await menuItem.click();
      await page.waitForTimeout(500);
      await expect(dialog).toBeVisible({ timeout: 60_000 });
      return;
    }
    await page.keyboard.press('Escape').catch(() => undefined);
    await page.waitForTimeout(300);
  }

  await chevron.click({ force: true });
  await page.waitForTimeout(500);
  await expect(menuItem).toBeVisible({ timeout: 10_000 });
  await menuItem.click();
  await page.waitForTimeout(500);
  await expect(dialog).toBeVisible({ timeout: 60_000 });
};

// Hover over element
export const hoverOverElement = async (
  page: Page,
  selector: string | Locator,
) => {
  const element =
    typeof selector === 'string' ? page.locator(selector) : selector;
  await element.hover();
  await page.waitForTimeout(500);
};

// Verify tooltip is visible
export const verifyTooltipVisible = async (
  page: Page,
  tooltipText?: string,
) => {
  if (tooltipText) {
    await expect(page.getByText(tooltipText)).toBeVisible({ timeout: 3000 });
  } else {
    await expect(
      page.locator('[role="tooltip"], [data-testid*="tooltip"]'),
    ).toBeVisible({ timeout: 3000 });
  }
};

// ==================== ASM049-060 Helper Methods ====================

/**
 * Gets the first custom field name from the list.
 */
export const getFirstCustomFieldName = async (page: Page): Promise<string> => {
  const customFieldRows = page.locator('//table//tbody//tr[.//strong]');
  if (
    await customFieldRows
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false)
  ) {
    const customFieldNameElement = customFieldRows.first().locator('strong');
    return (await customFieldNameElement.textContent())?.trim() || '';
  }
  return '';
};

/**
 * Gets customer checkboxes in Assign Customers panel.
 */
export const getCustomerCheckboxesInAssignPanel = (page: Page) => {
  const panel = page.getByRole('dialog', { name: /Assign customers/i });
  const scope = panel;
  // Exclude the group toggle ("Customers/Projects") which is not a real customer.
  return scope
    .locator(
      [
        'input[type="checkbox"][aria-label^="Select "]',
        '[role="checkbox"][aria-label^="Select "]',
      ].join(', '),
    )
    .filter({
      hasNot: scope.locator(
        [
          '[aria-label="Select Customers/Projects"]',
          '[aria-label*="Customers/Projects"]',
          '[aria-label^="Select Customers"]',
          '[aria-label="Select all items"]',
        ].join(', '),
      ),
    });
};

/**
 * Gets a specific customer checkbox by name in Assign panel.
 */
export const getCustomerCheckbox = (page: Page, customerName: string) => {
  return page.locator(`//*[@aria-label="Select ${customerName}"]`);
};

/**
 * Toggles a customer selection in Assign Customers panel.
 */
export const toggleCustomerInAssignPanel = async (
  page: Page,
  customerName: string,
  select: boolean,
): Promise<boolean> => {
  const checkbox = page.locator(`//*[@aria-label="Select ${customerName}"]`);
  if (await checkbox.isVisible({ timeout: 3000 }).catch(() => false)) {
    const isChecked = await checkbox.isChecked().catch(() => false);
    if ((select && !isChecked) || (!select && isChecked)) {
      await checkbox.click();
      await page.waitForTimeout(500);
      return true;
    }
  }
  return false;
};

/**
 * Clicks Assign Customers button for a custom field (using contains for partial match).
 */
export const clickAssignCustomersWithPartialMatch = async (
  page: Page,
  customFieldBaseName: string,
): Promise<boolean> => {
  const assignButton = page
    .locator(
      `//*[contains(text(),'${customFieldBaseName}')]/ancestor::tr/descendant::*[text()='Assign Customers']`,
    )
    .or(page.locator(`tbody tr`).first().locator(`text=Assign Customers`));

  if (
    await assignButton
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false)
  ) {
    await assignButton.first().click();
    await page.waitForTimeout(1000);
    return true;
  }
  return false;
};

/**
 * Saves changes in panel (handles multiple Save buttons).
 */
export const saveAssignPanel = async (
  page: Page,
  buttonIndex: number = 1,
): Promise<boolean> => {
  const saveButton = page.locator(`//*[text()='Save']`);
  if (
    await saveButton
      .nth(buttonIndex)
      .isVisible({ timeout: 3000 })
      .catch(() => false)
  ) {
    await saveButton.nth(buttonIndex).click({ force: true });
    await page.waitForTimeout(2000);
    return true;
  } else if (
    await saveButton
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false)
  ) {
    await saveButton.first().click({ force: true });
    await page.waitForTimeout(2000);
    return true;
  }
  return false;
};

/**
 * Closes assign panel with Escape or close button.
 */
export const closeAssignPanel = async (page: Page): Promise<void> => {
  const closeButton = page.locator(`//*[@aria-label="close"]`);
  if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeButton.click();
  } else {
    await page.keyboard.press('Escape');
  }
  await page.waitForTimeout(500);
};

/**
 * Waits for loading indicator to disappear.
 */
export const waitForCustomFieldsLoading = async (page: Page): Promise<void> => {
  const loadingIndicator = page.locator(`//*[@aria-label="Loading"]`);
  if (await loadingIndicator.isVisible({ timeout: 5000 }).catch(() => false)) {
    await loadingIndicator
      .waitFor({ state: 'hidden', timeout: CUSTOM_FIELD_NAV_TIMEOUT })
      .catch(() => {});
  }
  await page.waitForTimeout(2000);
};

/** Account settings often opens on Company; `?p=time` alone may not show Custom fields. */
export const ensureAccountSettingsTimePanel = async (page: Page) => {
  const customFieldsShell = page.getByTestId('custom-fields-settings-view');
  if (await customFieldsShell.isVisible({ timeout: 5000 }).catch(() => false)) {
    return;
  }

  const timeNav = page
    .getByRole('link', { name: /^Time/i })
    .or(page.getByRole('tab', { name: /^Time/i }))
    .or(page.locator('a[href*="p=time"]'))
    .or(page.getByText(/^Time$/i).locator('xpath=ancestor::a[1]'))
    .first();
  if (await timeNav.isVisible({ timeout: 15_000 }).catch(() => false)) {
    await timeNav.click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
  }

  if (
    await customFieldsShell.isVisible({ timeout: 10_000 }).catch(() => false)
  ) {
    return;
  }

  await gotoWithAuthSession(page, accountSettingsPageUrls.customFieldSettings, {
    waitUntil: 'load',
  });
  await page.waitForLoadState('load');
  await page.waitForTimeout(2000);
  if (await timeNav.isVisible({ timeout: 10_000 }).catch(() => false)) {
    await timeNav.click();
    await page.waitForTimeout(1500);
  }

  await expect(page.getByTestId('custom-fields-settings')).toBeVisible({
    timeout: 60_000,
  });
};

export default {
  navigationToCustomFieldSettings,
  validateCustomFieldSectionVisibleWithZeroState,
  clickManageAllCustomFieldsLink,
  clickCustomFieldSettingsManageAllCustomFieldsLink,
  validateManageAllCustomFieldsPageUI,
  validateManageAllCustomFieldsPageTableHeaders,
  clickCustomFieldsEditButton,
  validateTimeTrackingCustomFieldsPage,
  clickAddCustomFieldsButton,
  validateAddCustomFieldsPage,
  addCustomFieldName,
  openTimeTrackingAddCustomFieldDataTypeDropdown,
  validateDataTypeDropdownOptions,
  selectDataTypeDropdownOption,
  validateCategoryForTimeTrackingCustomField,
  selectCategoryForTimeTrackingCustomField,
  clickTimeTrackingCustomFieldSaveButton,
  validateCustomFieldAddedInList,
  getCustomFieldRequireFieldToggleState,
  makeCustomFieldRequireFieldToggleON,
  makeCustomFieldRequireFieldToggleOFF,
  clickCustomFieldSettingsCloseButton,
  clickCustomFieldSettingsSaveButton,
  clickCustomFieldSettingsCancelButton,
  validateCustomFieldSettingsConfirmationPopupVisible,
  clickCustomFieldSettingsConfirmationPopupNoButton,
  validateCustomFieldSettingsPage,
  validateCustomFieldSettingsPageWithTimeTracking,
  closeAddCustomFieldTooltip,
  clickSaveButton,
  validateTimeSettingsCustomFieldSectionVisible,
  clickAddCustomFieldPageCloseButton,
  validateAddCustomFieldPageConfirmationPopupVisible,
  validateCustomFieldPaginationInfo,
  clickSaveCustomFieldsListScreen,
  addDropdownValue,
  addMultipleDropdownValues,
  getCustomFieldRow,
  clickCustomFieldActionsDropdown,
  clickEditCustomField,
  clickMakeInactiveFromOpenCustomFieldMenu,
  clickMakeInactiveCustomField,
  editCustomFieldName,
  clickAssignCustomersForCustomField,
  clickAssignWorkersForCustomField,
  selectCustomerInAssignPanel,
  unselectAllCustomersInAssignPanel,
  selectAllCustomersInAssignPanel,
  selectWorkerInAssignPanel,
  clickSaveAssignWorkersPanel,
  clickSaveAssignCustomersPanel,
  waitForAssignCustomersPanelDismissed,
  exitCustomFieldsEditAfterAssignCustomers,
  unselectAllWorkersInAssignPanel,
  getCustomerAssignmentCount,
  getWorkerAssignmentCount,
  verifyAssignCustomersPanelVisible,
  verifyAssignWorkersPanelVisible,
  getRequiredToggleForCustomField,
  toggleRequiredONForCustomField,
  toggleRequiredOFFForCustomField,
  verifyRequiredStatusOffInTable,
  clickAssignCustomersForStandardField,
  clickAssignCustomersForStandardFieldMainListOnly,
  clickAssignCustomersForClassFieldRow,
  hoverOverElement,
  verifyTooltipVisible,
  getCustomFieldNewEditRow,
  getCustomFieldNewRow,
  verifyRequiredStatusOnInTable,
  clickCustomFieldCustomer,
  // ASM049-060 Helper Methods
  getFirstCustomFieldName,
  getCustomerCheckboxesInAssignPanel,
  getCustomerCheckbox,
  toggleCustomerInAssignPanel,
  clickAssignCustomersWithPartialMatch,
  saveAssignPanel,
  closeAssignPanel,
  waitForCustomFieldsLoading,
  ensureAccountSettingsTimePanel,
};
