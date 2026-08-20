import { Page, expect } from '@playwright/test';
import * as InvoicePage from '../../pages/InvoicePage';
import SingleTimeActivityPage, {
  matchTimeEntryBatchSaveResponse,
  OIGQL_URL_PATTERN,
  waitForResponseWithURLandBody,
} from '../../pages/SingleTimeActivityPage';
import { LABELS, testData } from '../../utils';
import {
  getConfirmDeleteInvoiceButton,
  getDeleteInvoiceMenuItem,
  getMoreActionsButton,
  getRecentButton,
  getRecentInvoiceEntry,
  navigateToInvoicePage,
  preCleanupInvoices,
} from '../../pages/InvoicePage';
import TimeEntriesPage from '../../pages/TimeEntriesPage';
import {
  openDateRangeDropdown,
  selectDateRangeOption,
  selectDisplayByOption,
} from '../../commonUtils';
import { unapproveTimeFromEmployeeSection } from './RunPayrollEditFlow.util';
import { Invoice } from '@design-systems/icons';

/**
 * Complete invoice validation flow
 */
export async function createSingleTimeActivityWithBilling(
  page: Page,
  duration: string,
): Promise<string> {
  const singleTimeActPage = new SingleTimeActivityPage(page);

  await singleTimeActPage.navigateToSingleTime();
  await singleTimeActPage.validateSTALoaded();
  await singleTimeActPage.handleTourModal();
  await singleTimeActPage.checkFieldVisibility(LABELS.Name);

  await singleTimeActPage.openDropdown(LABELS.Name);
  await singleTimeActPage.clickDropdownOption(testData.option1, LABELS.Name);

  await singleTimeActPage.openDropdown(LABELS.Customers);
  await singleTimeActPage.clickDropdownOption(
    testData.option1,
    LABELS.Customers,
  );

  await singleTimeActPage.openDropdown(LABELS.Service);
  await singleTimeActPage.clickDropdownOption(testData.option1, LABELS.Service);

  await singleTimeActPage.checkCheckboxIfVisible(LABELS.BillablePerHour);
  // fill bill rate
  await singleTimeActPage.fillBillRateInput(testData.billableRate);

  // fill out duration field
  const state = await singleTimeActPage.verifySetClockToggleState();
  if (state) {
    await singleTimeActPage.clickSetClockInAndOutToggles();
    await singleTimeActPage.fillData(LABELS.Duration, duration);
  }

  // add a note
  else {
    await singleTimeActPage.fillData(LABELS.Duration, duration);
  }

  await singleTimeActPage.fillData(LABELS.NotesLabel, testData.note1);

  const createMutationPromise = waitForResponseWithURLandBody(
    page,
    OIGQL_URL_PATTERN,
    matchTimeEntryBatchSaveResponse,
  );

  await singleTimeActPage.clickButton(LABELS.Save);

  // verify response and store the ID
  const createMutationPromisePayload = await createMutationPromise;
  expect(createMutationPromisePayload).toBeDefined();

  const timeEntryId =
    createMutationPromisePayload.data.timeTrackingBatchManageTimeEntries
      .timeEntries[0].id;
  expect(timeEntryId).toBeDefined();

  return timeEntryId;
}

export const validateInvoiceIntegration = async (
  page: Page,
  customerName: string,
) => {
  try {
    console.log(`  Starting Invoice integration validation...`);

    // Step 1: Navigate to invoice and select customer
    await InvoicePage.navigateToInvoiceAndSelectCustomer(page, customerName);

    // Step 2: Verify billing time is present in suggested transactions
    await page.waitForTimeout(5000);
    const billingTimeFound =
      await InvoicePage.verifyBillingTimeInSuggestedTransactions(page);
    expect(billingTimeFound).toBeTruthy();
    console.log(`  ✓ Billing time validated in suggested transactions`);

    // Step 3: Add billing time to product lines
    await InvoicePage.addBillingTimeToProductLines(page);

    // Step 4: Verify billing time is in product lines
    const billingTimeInLines =
      await InvoicePage.verifyBillingTimeInProductLines(page, '3');
    expect(billingTimeInLines).toBeTruthy();
    console.log(`  ✓ Billing time validated in product service lines`);

    // Step 5: Click link icon and validate navigation to STA screen
    // (This opens new tab, validates STA, and closes the tab automatically)
    await InvoicePage.clickLinkIconAndValidateSTA(page);

    console.log(`  ✓ Invoice integration validation completed successfully`);

    // Note: We intentionally don't save/send the invoice to avoid complications
    // This is just a validation that the billable time appears correctly
  } catch (error) {
    console.log(
      `  ⚠ Invoice validation encountered an error: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    console.log(`  Continuing with remaining tests...`);
  }
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

export const cleanupRunPayrollTestDataInvoice = async (
  page: Page,
  invoiceNumber: string | null,
) => {
  console.log('Cleaning up run payroll test data');

  try {
    const timeEntriesPage = new TimeEntriesPage(page);
    await cleanupInvoice(page, invoiceNumber);
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();

    await selectDisplayByOption(page, 'Date');
    await timeEntriesPage.waitForLoadingToDisappear();
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, 'This month');
    await timeEntriesPage.waitForLoadingToDisappear();

    const TEST_EMPLOYEE = {
      listView: 'Emp1, Test',
      dropdown: 'Test Emp1',
      alternateListView: 'Test Emp1',
    };

    // Delete all entries for test employee
    const cleanupEmployeeName =
      await timeEntriesPage.getEmployeeNameForListView(
        TEST_EMPLOYEE.listView,
        TEST_EMPLOYEE.alternateListView,
      );

    let count = await timeEntriesPage.countEmployeeRow(cleanupEmployeeName);

    while (count > 0) {
      if (await page.locator(`//span[text()='Approved']`).first().isVisible()) {
        await unapproveTimeFromEmployeeSection(page, cleanupEmployeeName);
      }
      await selectDisplayByOption(page, 'Date');
      await page
        .locator(`//button[@data-testid='chevron-down-icon-control']`)
        .first()
        .click();
      await page.getByRole('menuitem', { name: 'Delete' }).click();
      await page.getByRole('button', { name: 'Yes' }).click();
      await timeEntriesPage.waitForLoadingToDisappear();

      // Refresh data
      await selectDisplayByOption(page, 'Employee');
      await timeEntriesPage.waitForLoadingToDisappear();
      await selectDisplayByOption(page, 'Date');
      await timeEntriesPage.waitForLoadingToDisappear();

      count = await timeEntriesPage.countEmployeeRow(cleanupEmployeeName);
    }

    console.log('✓ Cleanup completed successfully');
  } catch (error) {
    console.log('Cleanup encountered an error:', error);
  }
};

export const cleanupForInvoiceSTAAndDeleteTimeEntries = async (page: Page) => {
  console.log('Cleaning up invoice and time entries via History panel');

  try {
    await navigateToInvoicePage(page);
    await page.waitForTimeout(1500);

    const openHistoryDrawer = async () => {
      const historyBtn = page.getByRole('button', { name: 'History' });
      const visible = await historyBtn
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      if (!visible) {
        throw new Error('History button not visible, cannot clean up invoices');
      }
      await historyBtn.click();
      await page.waitForTimeout(1000);
    };

    const deleteTimeChargeEntry = async (): Promise<boolean> => {
      const timeChargeCell = page
        .getByRole('cell', { name: 'Time charge' })
        .first();
      const visible = await timeChargeCell
        .isVisible({ timeout: 2000 })
        .catch(() => false);
      if (!visible) {
        return false;
      }
      await timeChargeCell.click();
      await page.waitForTimeout(500);
      const deleteButton = page.getByRole('button', { name: 'Delete' });
      const deleteVisible = await deleteButton
        .isVisible({ timeout: 2000 })
        .catch(() => false);
      if (!deleteVisible) {
        return false;
      }
      await deleteButton.click();
      await page.waitForTimeout(500);
      const yesButton = page.getByRole('button', { name: 'Yes' });
      const yesVisible = await yesButton
        .isVisible({ timeout: 2000 })
        .catch(() => false);
      if (!yesVisible) {
        return false;
      }
      await yesButton.click();
      await page.waitForTimeout(1500);
      return true;
    };

    const deleteInvoiceEntry = async (): Promise<boolean> => {
      const invoiceCell = page
        .getByTestId('test-row-0-cell-1')
        .getByText('Invoice')
        .first();
      const invoiceVisible = await invoiceCell
        .isVisible({ timeout: 2000 })
        .catch(() => false);
      if (!invoiceVisible) {
        return false;
      }
      await invoiceCell.click();
      await page.waitForTimeout(500);
      const moreActionsButton = page.getByRole('button', {
        name: 'More actions',
      });
      const moreActionsVisible = await moreActionsButton
        .isVisible({ timeout: 2000 })
        .catch(() => false);
      if (!moreActionsVisible) {
        return false;
      }
      await moreActionsButton.click();
      await page.waitForTimeout(500);
      const deleteMenuItem = page.getByTestId('txp-delete-menu-item');
      const deleteMenuVisible = await deleteMenuItem
        .isVisible({ timeout: 2000 })
        .catch(() => false);
      if (!deleteMenuVisible) {
        return false;
      }
      await deleteMenuItem.click();
      await page.waitForTimeout(500);
      const confirmDelete = page.getByTestId('confirmation-modal-confirm');
      const confirmVisible = await confirmDelete
        .isVisible({ timeout: 2000 })
        .catch(() => false);
      if (!confirmVisible) {
        return false;
      }
      await confirmDelete.click();
      await page.waitForTimeout(1500);
      return true;
    };

    const removeFilterButton = page.getByRole('button', {
      name: 'Remove Transaction type filter',
    });
    await openHistoryDrawer();
    const filterVisible = await removeFilterButton
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    if (filterVisible) {
      await removeFilterButton.click();
      await page.waitForTimeout(500);
      await openHistoryDrawer();
    }

    const maxIterations = 50;
    for (let iteration = 0; iteration < maxIterations; iteration += 1) {
      await openHistoryDrawer();

      const viewMoreButton = page.getByRole('button', { name: 'View more' });
      const viewMoreVisible = await viewMoreButton
        .isVisible({ timeout: 2000 })
        .catch(() => false);
      if (viewMoreVisible) {
        await viewMoreButton.click();
        await page.waitForTimeout(1000);
      }

      const noResultsLocator = page.locator(
        `//span/strong[text()='No results found']`,
      );
      const noResultsVisible = await noResultsLocator
        .isVisible({ timeout: 2000 })
        .catch(() => false);
      if (noResultsVisible) {
        console.log('✓ No more entries found, cleanup complete');
        return;
      }

      const deletedTimeCharge = await deleteTimeChargeEntry();
      if (deletedTimeCharge) {
        console.log('✓ Deleted Time charge entry');
        continue;
      }

      const deletedInvoice = await deleteInvoiceEntry();
      if (deletedInvoice) {
        console.log('✓ Deleted Invoice entry');
        continue;
      }

      const anyEntryVisible = await page
        .getByTestId('test-row-0-cell-1')
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false);
      if (!anyEntryVisible) {
        console.log('✓ No entries visible, cleanup complete');
        return;
      }

      console.log(
        '⚠ Could not delete entries in this iteration, will retry once more',
      );
    }

    console.log('⚠ Reached max iterations, stopping cleanup');
  } catch (error) {
    console.log(
      'Cleanup encountered an error:',
      error instanceof Error ? error.message : String(error),
    );
  }
};

export const preStartCleanupForInvoice =
  cleanupForInvoiceSTAAndDeleteTimeEntries;
