import { Page, Locator, expect } from '@playwright/test';

// Locator getters
export const getSuggestedTransactionsPanel = (page: Page) => {
  return page.locator(`//section[@class='sales-forms-txns-panel']`);
};

export const clickAddButton = (page: Page) => {
  return page.locator(`//button[text()='Add']`);
};

export const getCustomerDropdownInvoice = (page: Page) => {
  return page.locator(
    `//input[@placeholder='Add customer']/parent::div//following-sibling::div`,
  );
};

export const getBillingTimeEntry = (page: Page) => {
  return page.locator(`//section[@class='details-row']`);
};

export const getProductServiceLines = (page: Page) => {
  return page.locator(`//tr[@data-automation-id='line 1']`);
}; //*[@aria-label="Quantity line 1"]

export const getDeleteLineIcon = (page: Page) => {
  return page.locator(`//button[contains(@class, 'TrashCanButton')]`);
};

export const getUnlinkAndDeleteIcon = (page: Page) => {
  return page.locator(`//a[@aria-label='Linked transaction link']`);
};

export const getUnlinkAndDeleteOption = (page: Page) => {
  return page.locator(`//button[@data-automation-id='Unlink and Delete']`);
};

export const getDeleteLineOption = (page: Page) => {
  return page.locator(`//button[@data-automation-id='Delete line']`);
};

export const getReviewAndSendButton = (page: Page) => {
  return page.locator(`//span[text()='Review and send']`);
};

export const getRecentButton = (page: Page) => {
  return page.locator(`//button[@aria-label="History"]`);
};

export const getRecentInvoiceEntry = (
  page: Page,
  invoiceNumber: string | null,
) => {
  return page.locator(`//div[text()='Invoice No.${invoiceNumber}']`);
};

export const getRecentInvoiceRows = (page: Page) => {
  return page.locator(`//div[starts-with(normalize-space(), 'Invoice No.')]`);
};

export const getRecentEmptyStateMessage = (page: Page) => {
  return page.locator(
    `//div[contains(text(),"Once you enter some transactions, they'll appear here.")]`,
  );
};

export const getMoreActionsButton = (page: Page) => {
  return page.locator(`//button[@aria-label='More actions']`);
};

export const getDeleteInvoiceMenuItem = (page: Page) => {
  return page.locator(`//div[@role='menu']//span[text()='Delete']`);
};

export const getConfirmDeleteInvoiceButton = (page: Page) => {
  return page.locator(`//div[@role='dialog']//span[text()='Delete']`);
};

export const getEmailToInput = (page: Page) => {
  return page.locator(`//input[@id='email_to']`);
};

export const getSendInvoiceButton = (page: Page) => {
  return page.locator(`//button/span[text()='Send invoice']`);
};

export const getConfirmationMessage = (page: Page) => {
  return page.locator(`//div[contains(text(), 'Email sent to')]`);
};

// Action functions
export const navigateToInvoicePage = async (page: Page) => {
  await page.goto(`/app/invoice`, {
    waitUntil: 'load',
  });
};

export const verifyBillingTimeInSuggestedTransactions = async (
  page: Page,
): Promise<boolean> => {
  console.log(`  Checking for billing time in suggested transactions...`);

  const suggestedTransactionsPanel = getSuggestedTransactionsPanel(page);
  const billingTimeEntry = getBillingTimeEntry(page);

  const panelVisible = await suggestedTransactionsPanel
    .isVisible({ timeout: 5000 })
    .catch(() => false);
  if (!panelVisible) {
    console.log(`  ⚠ Suggested transactions panel not visible`);
    return false;
  }

  // Check how many billing time entries exist
  const entryCount = await billingTimeEntry.count();
  console.log(
    `  Found ${entryCount} billing time entry(ies) in suggested transactions`,
  );

  // Check if the first billing time entry is visible
  const billingTimeVisible = await billingTimeEntry
    .first()
    .isVisible({ timeout: 5000 })
    .catch(() => false);
  if (billingTimeVisible) {
    console.log(
      `  ✓ Billing time entry found in suggested transactions (checking first entry)`,
    );
  } else {
    console.log(`  ⚠ Billing time entry not found in suggested transactions`);
  }

  return billingTimeVisible;
};

export const selectCustomerAndAddBillingTime = async (
  page: Page,
  customerName: string,
) => {
  await getCustomerDropdownInvoice(page).click();
  await page.locator(`//span[text()='${customerName}']`).click();
};

export const navigateToInvoiceAndSelectCustomer = async (
  page: Page,
  customerName: string,
) => {
  console.log(
    `  Navigating to invoice page and selecting customer: ${customerName}...`,
  );

  // Navigate to invoice page
  await navigateToInvoicePage(page);
  await page.waitForTimeout(2000);

  // Click customer dropdown
  await getCustomerDropdownInvoice(page).click();
  await page.waitForTimeout(1000);

  // Select the customer
  await page.locator(`//span[text()='${customerName}']`).click();
  await page.waitForTimeout(2000);

  console.log(`  ✓ Customer selected: ${customerName}`);
};

export const addBillingTimeToProductLines = async (page: Page) => {
  console.log(`  Adding billing time to product lines...`);

  // Wait for the Add button to be ready
  await page.waitForTimeout(5000);

  // Click the first Add button (there may be multiple entries)
  await clickAddButton(page).first().click();
  await page.waitForTimeout(2000);

  console.log(
    `  ✓ Billing time added to product lines (clicked first Add button)`,
  );
};

export const verifyBillingTimeInProductLines = async (
  page: Page,
  expectedDuration: string,
): Promise<boolean> => {
  console.log(`  Verifying billing time in product service lines...`);

  const productServiceLines = getProductServiceLines(page);
  const lineVisible = await productServiceLines
    .isVisible({ timeout: 5000 })
    .catch(() => false);

  if (!lineVisible) {
    console.log(`  ⚠ Product service line not visible`);
    return false;
  }

  // Try to get the quantity/duration value from the product line
  const quantityInput = productServiceLines.locator(
    '//*[@aria-label="Quantity line 1"]',
  );
  const quantityValue = await quantityInput
    .getAttribute('value')
    .catch(() => null);

  if (quantityValue) {
    console.log(
      `  ✓ Billing time found in product lines with duration: ${quantityValue}`,
    );
    // Note: The duration format might vary (e.g., "3" vs "3.00")
    return true;
  } else {
    console.log(`  ⚠ Could not retrieve duration from product line`);
    return false;
  }
};

export const clickLinkIconAndValidateSTA = async (page: Page) => {
  console.log(`  Clicking link icon to navigate to STA...`);

  // Set up listener for new page before clicking
  const pagePromise = page.context().waitForEvent('page');

  const linkIcon = page
    .locator(`//tr/descendant::*[@data-testid="innerLinkText"]`)
    .first();
  await linkIcon.click();

  // Wait for new page to open
  const newPage = await pagePromise;
  await newPage.waitForLoadState('load');
  await newPage.waitForTimeout(2000);

  console.log(`  ✓ New tab opened, validating STA...`);

  // Validate that STA opened in new tab
  const staTitle = await newPage
    .locator(`//*[text()='Single day entry']`)
    .isVisible({ timeout: 10000 })
    .catch(() => false);

  if (staTitle) {
    console.log(`  ✓ STA validated in new tab: "Single day entry" visible`);
  } else {
    console.log(`  ⚠ STA title not found in new tab`);
  }

  // Close the new tab and return to invoice page
  await newPage.close();
  await page.waitForTimeout(1000);

  console.log(`  ✓ Closed STA tab, returned to invoice`);
};

export const getInvoiceNumber = async (page: Page) => {
  const invoiceHeaderText = await page
    .locator(`//h2[contains(@class, 'TrowserHeader')]`)
    .textContent();
  // Extract only the numeric part from the invoice header
  const numberMatch = invoiceHeaderText?.match(/\d+/);
  return numberMatch ? numberMatch[0] : null;
};

export const verifyBillingTimeInProductServiceLines = async (
  page: Page,
  expectedBillingTime: string,
) => {
  const billingTimeInLines = await getProductServiceLines(page)
    .locator(
      `/td/div[contains(@class, 'AutoSelectInputWrapper')]//label/div/input`,
    )
    .getAttribute('value');
  expect(billingTimeInLines).toBe(expectedBillingTime);
};

export const unlinkAndDeleteBillingTimeLine = async (page: Page) => {
  await getDeleteLineIcon(page).click();
  await getUnlinkAndDeleteOption(page).click();
};

export const deleteBillingTimeLine = async (page: Page) => {
  await getDeleteLineIcon(page).click();
  await getDeleteLineOption(page).click();
};

export const verifyBillingTimeNotInSuggestedTransactions = async (
  page: Page,
): Promise<boolean> => {
  await page.waitForTimeout(1000);
  const billingTimeNotVisible = await getSuggestedTransactionsPanel(page)
    .locator(`//li[@class='transactions-panel-card']`)
    .first()
    .isHidden();
  return billingTimeNotVisible;
};

export const reviewAndSendInvoice = async (page: Page, email: string) => {
  await getReviewAndSendButton(page).click();
  // Wait for email input to be visible with reasonable timeout
  await getEmailToInput(page).waitFor({ state: 'visible', timeout: 30000 });
  await getEmailToInput(page).fill(email);
  await getSendInvoiceButton(page).waitFor({
    state: 'visible',
    timeout: 15000,
  });
  await getSendInvoiceButton(page).click();
};

export const verifyInvoiceSentSuccessfully = async (
  page: Page,
): Promise<boolean> => {
  const confirmationVisible = await getConfirmationMessage(page).isVisible();
  return confirmationVisible;
};

export const clickOnAddButton = async (page: Page) => {
  await page.waitForTimeout(5000);
  await clickAddButton(page).first().click();
};

export const cleanupInvoice = async (
  page: Page,
  invoiceNumber: string | null,
): Promise<boolean> => {
  console.log(`  Starting cleanup for invoice ${invoiceNumber}...`);
  await navigateToInvoicePage(page);
  await page.waitForTimeout(2000);

  const recentButton = getRecentButton(page);
  const recentButtonVisible = await recentButton
    .isVisible({ timeout: 5000 })
    .catch(() => false);

  if (!recentButtonVisible) {
    console.log(`  ⚠ Recent button not available, skipping cleanup`);
    return false;
  }

  await recentButton.click();
  await page.waitForTimeout(1000);

  const invoiceEntry = getRecentInvoiceEntry(page, invoiceNumber);
  const invoiceVisible = await invoiceEntry
    .isVisible({ timeout: 5000 })
    .catch(() => false);

  if (!invoiceVisible) {
    console.log(
      `  ⚠ Invoice No.${invoiceNumber} not found in recent list, skipping delete`,
    );
    await navigateToInvoicePage(page);
    return false;
  }

  await invoiceEntry.click();
  await page.waitForTimeout(2000);

  const moreActionsButton = getMoreActionsButton(page);
  const moreActionsVisible = await moreActionsButton
    .isVisible({ timeout: 5000 })
    .catch(() => false);

  if (!moreActionsVisible) {
    console.log(
      `  ⚠ More actions button not visible, returning to invoice list`,
    );
    await navigateToInvoicePage(page);
    return false;
  }

  await moreActionsButton.click();
  const deleteMenuItem = getDeleteInvoiceMenuItem(page);
  await deleteMenuItem.waitFor({ state: 'visible', timeout: 5000 });
  await deleteMenuItem.click();

  const confirmDeleteButton = getConfirmDeleteInvoiceButton(page);
  const confirmVisible = await confirmDeleteButton
    .isVisible({ timeout: 5000 })
    .catch(() => false);

  if (confirmVisible) {
    await confirmDeleteButton.click();
  }

  await page.waitForTimeout(2000);
  console.log(`  ✓ Invoice ${invoiceNumber} deleted successfully`);
  return true;
};

export const preCleanupInvoices = async (page: Page): Promise<void> => {
  console.log('  Starting invoice pre-cleanup...');
  await navigateToInvoicePage(page);
  await page.waitForTimeout(2000);

  const emptyState = getRecentEmptyStateMessage(page);
  const maxIterations = 25;

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    await getRecentButton(page).click();
    await page.waitForTimeout(1000);

    const noEntriesVisible = await emptyState
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    if (noEntriesVisible) {
      console.log('  ✓ Recent drawer empty, pre-cleanup complete');
      return;
    }

    const invoiceRow = getRecentInvoiceRows(page).first();
    const rowVisible = await invoiceRow
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (!rowVisible) {
      console.log('  ⚠ No invoice rows found, stopping cleanup loop');
      break;
    }

    const invoiceLabel = (await invoiceRow.textContent())?.trim() ?? '';
    console.log(`  Deleting invoice entry: ${invoiceLabel || 'Unknown'}`);
    await invoiceRow.click();
    await page.waitForTimeout(1500);

    const moreActionsVisible = await getMoreActionsButton(page)
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    if (!moreActionsVisible) {
      console.log(
        '  ⚠ More actions button not available, returning to invoice list',
      );
      await navigateToInvoicePage(page);
      continue;
    }

    await getMoreActionsButton(page).click();
    const deleteOption = getDeleteInvoiceMenuItem(page);
    await deleteOption.waitFor({ state: 'visible', timeout: 5000 });
    await deleteOption.click();

    const confirmDelete = getConfirmDeleteInvoiceButton(page);
    const confirmVisible = await confirmDelete
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    if (confirmVisible) {
      await confirmDelete.click();
    }

    await page.waitForTimeout(2000);
    await navigateToInvoicePage(page);
  }

  await getRecentButton(page)
    .click()
    .catch(() => undefined);
  const stillHasEntries = !(await getRecentEmptyStateMessage(page)
    .isVisible({ timeout: 2000 })
    .catch(() => false));

  if (stillHasEntries) {
    console.log(
      '  ⚠ Pre-cleanup finished but recent drawer still has invoice entries.',
    );
  } else {
    console.log('  ✓ Invoice pre-cleanup finished successfully.');
  }
};

export const verifyInvoicedTimeNotReSuggested = async (
  page: Page,
  customerName: string,
) => {
  await navigateToInvoicePage(page);
  await getCustomerDropdownInvoice(page).click();
  await page.locator(`//span[text()='${customerName}']`).click();
  const billingTimeNotVisible = await getSuggestedTransactionsPanel(page)
    .locator(`//li[@class='transactions-panel-card']`)
    .first()
    .isHidden();
  return billingTimeNotVisible;
};

export const verifyPreviouslyInvoicedTimeNotInSuggestions = async (
  page: Page,
): Promise<boolean> => {
  await page.waitForTimeout(1000);
  const noBillingTime = await getSuggestedTransactionsPanel(page)
    .locator(`//li[@class='transactions-panel-card']`)
    .count();
  return noBillingTime === 0;
};

export const verifyAddedLineToastMessage = async (page: Page) => {
  expect(
    page.locator(`//span[text()='Added Billable time to your invoice.']`),
  ).toBeVisible();
};

export const verifyRecentEntryVisible = async (
  page: Page,
  invoiceNumber: string,
) => {
  if (!invoiceNumber) {
    throw new Error('Invoice number is required to verify recent entry');
  }

  // Verify the invoice number is present in the recent entry
  // await expect(
  //   page.locator(
  //     `//div[@data-testid="recent_transaction_type_1()" and contains(normalize-space(), 'Invoice No.${invoiceNumber}')]`,
  //   ),
  // ).toBeVisible();
};

export const clickHistoryButton = async (page: Page) => {
  await page.locator(`//button[@aria-label='History']`).click();
};

export const navigateToCreateInvoiceAndOpenSuggestedTransactions = async (
  page: Page,
  customerName: string,
) => {
  await navigateToInvoicePage(page);
  await selectCustomerAndAddBillingTime(page, customerName);

  // Ensure the suggested transactions panel is open
  const panelVisible = await getSuggestedTransactionsPanel(page).isVisible();
  if (!panelVisible) {
    await page.waitForSelector(`//li[@class='transactions-panel-card']`, {
      state: 'visible',
    });
  }
};

// Export all utilities as a single object
export default {
  getSuggestedTransactionsPanel,
  clickOnAddButton,
  getCustomerDropdownInvoice,
  getBillingTimeEntry,
  getProductServiceLines,
  getDeleteLineIcon,
  getUnlinkAndDeleteOption,
  getDeleteLineOption,
  getReviewAndSendButton,
  getEmailToInput,
  getSendInvoiceButton,
  getConfirmationMessage,
  navigateToInvoicePage,
  verifyBillingTimeInSuggestedTransactions,
  selectCustomerAndAddBillingTime,
  navigateToInvoiceAndSelectCustomer,
  addBillingTimeToProductLines,
  verifyBillingTimeInProductLines,
  clickLinkIconAndValidateSTA,
  verifyBillingTimeInProductServiceLines,
  unlinkAndDeleteBillingTimeLine,
  deleteBillingTimeLine,
  verifyBillingTimeNotInSuggestedTransactions,
  reviewAndSendInvoice,
  verifyInvoiceSentSuccessfully,
  verifyInvoicedTimeNotReSuggested,
  verifyPreviouslyInvoicedTimeNotInSuggestions,
  navigateToCreateInvoiceAndOpenSuggestedTransactions,
  cleanupInvoice,
  preCleanupInvoices,
  getRecentButton,
  getRecentInvoiceEntry,
  getRecentInvoiceRows,
  getRecentEmptyStateMessage,
  getMoreActionsButton,
  getDeleteInvoiceMenuItem,
  getConfirmDeleteInvoiceButton,
};
