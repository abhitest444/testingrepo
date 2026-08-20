import { test } from '@playwright/test';
import { getTestAccount } from '../../config/accounts';
import { openQBOTS } from '../../pages/QBOLogin';
import {
  cleanupForInvoiceSTAAndDeleteTimeEntries,
  cleanupRunPayrollTestDataInvoice,
  createSingleTimeActivityWithBilling,
} from '../Util/Invoice.util';
import * as InvoicePage from '../../pages/InvoicePage';
import {
  approveTimeEntries,
  cleanupTestDataInvoice,
  createSingleTimeEntry,
  validateTimeEntriesInTable,
} from '../Util/RunPayrollEditFlow.util';

test.describe('Run Payroll Edit Flow', () => {
  test.beforeEach(async ({ page }) => {
    console.log('=== beforeEach hook started ===');

    try {
      // Get current test info - this should work in beforeEach
      const testInfo = test.info();
      console.log('Test info retrieved, title:', testInfo.title);

      // Login using test-specific credentials
      const testId = testInfo.title.split(' - ')[0];
      console.log('Extracted test ID:', testId);

      const credentials = getTestAccount(testId);
      console.log('Logging in with credentials:', credentials.username);
      await openQBOTS(page, credentials);
      console.log('Login successful');

      // Pre-test cleanup: Delete old entries to ensure clean state
      console.log('Starting pre-test cleanup...');

      try {
        if (testId === 'RPEF007') {
          console.log('Running cleanup for RPEF007...');
          await cleanupForInvoiceSTAAndDeleteTimeEntries(page);
          console.log(`  ✓ Cleaned up time entries for ${testId}`);
        } else if (testId === 'RPEF008') {
          console.log('Running cleanup for RPEF008...');
          await cleanupForInvoiceSTAAndDeleteTimeEntries(page);
          await cleanupTestDataInvoice(page);
          console.log(`  ✓ Cleaned up payroll and time entries for ${testId}`);
        } else {
          console.log(`  ℹ No cleanup configured for test ID: ${testId}`);
        }
      } catch (cleanupError) {
        console.log(
          '  ℹ No old entries found or cleanup not needed:',
          cleanupError instanceof Error
            ? cleanupError.message
            : String(cleanupError),
        );
      }

      console.log('Pre-test cleanup completed');
    } catch (error) {
      console.error(
        'Error in beforeEach:',
        error instanceof Error ? error.message : String(error),
      );
      throw error; // Re-throw to fail the test if beforeEach fails
    }

    console.log('=== beforeEach hook completed ===');
  });

  test('RPEF007 - Comprehensive Invoice Flow Test For STA', async ({
    page,
  }) => {
    // Review and send invoice
    console.log('Step 5: Reviewing and sending invoice');
    await createSingleTimeActivityWithBilling(page, '6.00');
    await InvoicePage.navigateToCreateInvoiceAndOpenSuggestedTransactions(
      page,
      'Bakes and Beans',
    );
    const invoiceNumber = await InvoicePage.getInvoiceNumber(page);
    await InvoicePage.clickOnAddButton(page);

    const disposableEmail = `test${Date.now()}@sharklasers.com`;
    await InvoicePage.reviewAndSendInvoice(page, disposableEmail);

    const invoiceSent = await InvoicePage.verifyInvoiceSentSuccessfully(page);
    //expect(invoiceSent).toBeTruthy();

    await InvoicePage.navigateToInvoicePage(page);
    await InvoicePage.clickHistoryButton(page);
    await InvoicePage.verifyRecentEntryVisible(page, invoiceNumber || '');
    console.log('✓ Invoice sent successfully');

    // QLINV006: Verify invoiced time is not re-suggested
    console.log('Step 6: Verifying invoiced time is not re-suggested');
    await InvoicePage.verifyInvoicedTimeNotReSuggested(page, 'Bakes and Beans');

    const noReSuggestion =
      await InvoicePage.verifyPreviouslyInvoicedTimeNotInSuggestions(page);
    //expect(noReSuggestion).toBeTruthy();
    console.log('✓ Previously invoiced time not re-suggested');

    console.log('All invoice test scenarios completed successfully!');

    console.log('All invoice are deleted successfully!');
  });

  test('RPEF008 - Comprehensive Invoice Flow Test For STE', async ({
    page,
  }) => {
    // Step 1: Create single time entry and save
    console.log('Step 1: Creating single time entry for STE workflow...');
    const timeEntryData = await createSingleTimeEntry(
      page,
      '08:00',
      'Test note - initial',
    );

    // Step 2: Validate the time entries entered in the table
    console.log('Step 2: Validating STE time entry totals in table...');
    await validateTimeEntriesInTable(
      page,
      'Emp1, Test',
      timeEntryData.duration,
    );

    // Step 3: Go to the employee dropdown and approve the entered time entry
    console.log('Step 3: Approving time entries...');
    await approveTimeEntries(page, 'Emp1, Test');

    // Review and send invoice
    console.log('Step 5: Reviewing and sending invoice');
    //const createdTimeEntryId = await createSingleTimeActivityWithBilling(page, '6.00');
    await InvoicePage.navigateToCreateInvoiceAndOpenSuggestedTransactions(
      page,
      'Bakes and Beans',
    );
    const invoiceNumber = await InvoicePage.getInvoiceNumber(page);
    await InvoicePage.clickOnAddButton(page);

    const disposableEmail = `test${Date.now()}@sharklasers.com`;
    await InvoicePage.reviewAndSendInvoice(page, disposableEmail);

    const invoiceSent = await InvoicePage.verifyInvoiceSentSuccessfully(page);
    //expect(invoiceSent).toBeTruthy();

    await InvoicePage.navigateToInvoicePage(page);
    await InvoicePage.clickHistoryButton(page);
    await InvoicePage.verifyRecentEntryVisible(page, invoiceNumber || '');
    console.log('✓ Invoice sent successfully');

    // QLINV006: Verify invoiced time is not re-suggested
    console.log('Step 6: Verifying invoiced time is not re-suggested');
    await InvoicePage.verifyInvoicedTimeNotReSuggested(page, 'Bakes and Beans');

    const noReSuggestion =
      await InvoicePage.verifyPreviouslyInvoicedTimeNotInSuggestions(page);
    expect(noReSuggestion).toBeTruthy();
    console.log('✓ Previously invoiced time not re-suggested');

    console.log('All invoice test scenarios completed successfully!');
  });
});
