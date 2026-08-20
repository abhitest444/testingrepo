import { test } from '@playwright/test';
import { getTestAccount } from '../../config/accounts';
import { openQBOTS } from '../../pages/QBOLogin';
import {
  validateBillableSTAInReports,
  cleanupExtraFlowTestData,
  validateBillableSTAWithPayTypeInRunPayroll,
  cleanupWorkflowTestData,
  validateBillableWTAWithPayTypeInRunPayroll,
  cleanupWorkflowWTATestData,
  deleteSTAEntriesFromReports,
  validateBillableWTEInRunPayroll,
  cleanupWorkflowTimeEntryTestData,
  validateTimeClockInRunPayroll,
  validateSTEWithApprovalInRunPayroll,
  cleanupSTEWorkflowTestData,
  validateBreaksWithApprovalInRunPayroll,
  cleanupBreaksWorkflowTestData,
  validateSTAFromProjectsToPayroll,
  cleanupSTAFromProjectsTestData,
  validateSTACrossModuleSync,
  cleanupSTACrossModuleTestData,
  validateSTEApprovalWithProjectsVerification,
  cleanupSTEProjectsVerificationTestData,
} from '../Util/TimePayrollRegression.util';

test.describe('Run Payroll Create Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Get test info and login with test-specific credentials
    const testInfo = test.info();
    const testId = testInfo.title.split(' - ')[0];
    const credentials = getTestAccount(testId);
    console.log('Logging in with credentials:', credentials.username);
    await openQBOTS(page, credentials);
    console.log('Login successful');

    // Pre-test cleanup: Delete old entries to ensure clean state
    console.log('Starting pre-test cleanup...');

    try {
      if (testId === 'RP003') {
        await deleteSTAEntriesFromReports(page, 'Billable STA Test Entry', 5);
        console.log(`  ✓ Cleaned up time entries for ${testId}`);
      } else if (testId === 'RP001') {
        await cleanupWorkflowTestData(page);
        console.log(`  ✓ Cleaned up payroll and time entries for ${testId}`);
      } else if (testId === 'RP002') {
        await cleanupWorkflowWTATestData(page);
        console.log(`  ✓ Cleaned up payroll and time entries for ${testId}`);
      } else if (testId === 'RP004') {
        // Cleanup deletes paycheck, unapproves entries, and deletes from reports
        await cleanupWorkflowTimeEntryTestData(page);
        console.log(`  ✓ Cleaned up payroll and time entries for ${testId}`);
      } else if (testId === 'RP006') {
        await cleanupWorkflowTimeEntryTestData(page);
        console.log(`  ✓ Cleaned up payroll and time entries for ${testId}`);
      } else if (testId === 'RP005') {
        await cleanupSTEWorkflowTestData(page);
        console.log(`  ✓ Cleaned up payroll and time entries for ${testId}`);
      } else if (testId === 'RP007') {
        // First run the workflow cleanup (deletes paycheck, unlocking entries)
        await cleanupBreaksWorkflowTestData(page);
        // Then delete any remaining entries from Reports
        await deleteSTAEntriesFromReports(page, '', 50);
        console.log(`  ✓ Cleaned up payroll and break entries for ${testId}`);
      } else if (testId === 'RP008') {
        await cleanupSTACrossModuleTestData(page);
        console.log(`  ✓ Cleaned up time entries across modules for ${testId}`);
      } else if (testId === 'RP009') {
        await cleanupSTAFromProjectsTestData(page);
        console.log(`  ✓ Cleaned up payroll and time entries for ${testId}`);
      } else if (testId === 'RP010') {
        await cleanupSTEProjectsVerificationTestData(page);
        console.log(
          `  ✓ Cleaned up STE entries for Projects verification for ${testId}`,
        );
      }
    } catch (cleanupError) {
      console.log(
        '  ℹ No old entries found or cleanup not needed:',
        cleanupError,
      );
    }

    console.log('Pre-test cleanup completed');
  });

  test('RP001 - Create Billable STA with Pay Type -> Verify Entry in Run Payroll Preview -> Submit Payroll Successfully -> Complete Workflow', async ({
    page,
  }) => {
    await validateBillableSTAWithPayTypeInRunPayroll(page);
    console.log(
      'TEST PASSED: Regression test for STA with pay type through run payroll completed successfully!',
    );
  });

  test('RP003 - Create Billable STA Entry -> Verify in Reports Module -> Update STA -> Verify Updated Data in Reports -> Complete Workflow', async ({
    page,
  }) => {
    await validateBillableSTAInReports(page);
    console.log('TEST PASSED: Billable STA in Reports validation successful!');
  });

  test('RP002 - Create Billable WTA with Pay Type -> Verify Entry in Run Payroll Preview -> Submit Payroll Successfully -> Complete Workflow', async ({
    page,
  }) => {
    await validateBillableWTAWithPayTypeInRunPayroll(page);
    console.log(
      'TEST PASSED: Regression test for WTA with pay type through run payroll completed successfully!',
    );
  });

  test('RP004 - Create WTE Entry -> Approve -> Verify in Run Payroll (Approved) -> Unapprove & Edit WTE -> Re-Approve -> Verify Updated Data in Run Payroll -> Submit Payroll -> Complete Workflow', async ({
    page,
  }) => {
    await validateBillableWTEInRunPayroll(page);
    console.log(
      'TEST PASSED: Regression test for WTE through run payroll completed successfully!',
    );
  });

  test('RP006 - Create Time Clock Entry -> Approve -> Verify in Run Payroll (Approved) -> Unapprove & Edit Entry -> Re-Approve -> Verify Updated Data in Run Payroll -> Submit Payroll -> Complete Workflow', async ({
    page,
  }) => {
    await validateTimeClockInRunPayroll(page);
    console.log(
      'TEST PASSED: Regression test for Time Clock through run payroll completed successfully!',
    );
  });

  test('RP005 - Create STE Entry -> Approve -> Verify in Run Payroll (Approved) -> Unapprove & Edit STE -> Re-Approve -> Verify Updated Data in Run Payroll -> Submit Payroll -> Complete Workflow', async ({
    page,
  }) => {
    await validateSTEWithApprovalInRunPayroll(page);
    console.log(
      'TEST PASSED: Regression test for STE with approval through run payroll completed successfully!',
    );
  });

  test.fixme(
    'RP007 - Create Break Entry -> Verify in Run Payroll (Unapproved) -> Approve Breaks -> Verify in Run Payroll (Approved) -> Unapprove & Re-Approve Breaks -> Verify in Run Payroll -> Submit Payroll -> Complete Workflow',
    async ({ page }) => {
      // Bug with breaks
      await validateBreaksWithApprovalInRunPayroll(page);
      console.log(
        'TEST PASSED: Regression test for breaks with approval through run payroll completed successfully!',
      );
    },
  );

  test('RP008 - Create STA in Trowser -> Verify Entry in Projects Module -> Edit STA in Projects -> Verify Changes in Reports Module -> Edit STA in Reports -> Verify in Projects -> Complete Workflow', async ({
    page,
  }) => {
    await validateSTACrossModuleSync(page);
    console.log(
      'TEST PASSED: Regression test for STA cross-module synchronization completed successfully!',
    );
  });

  test('RP009 - Create STA in Projects Module -> Verify Entry in Run Payroll -> Edit STA in Projects -> Verify Updated Data in Run Payroll -> Submit Payroll -> Complete Workflow', async ({
    page,
  }) => {
    await validateSTAFromProjectsToPayroll(page);
    console.log(
      'TEST PASSED: Regression test for STA created from Projects through payroll completed successfully!',
    );
  });

  test('RP010 - Create STE Entry -> Approve -> Verify Initial Data in Projects Module -> Unapprove & Edit STE -> Verify Older Data Still in Projects -> Re-Approve STE -> Verify Updated Data Synced to Projects -> Complete Workflow', async ({
    page,
  }) => {
    await validateSTEApprovalWithProjectsVerification(page);
    console.log(
      'TEST PASSED: Regression test for STE approval workflow with Projects verification completed successfully!',
    );
  });

  test.afterEach(async ({ page }) => {
    const testInfo = test.info();
    const testId = testInfo.title.split(' - ')[0];

    // Post-test cleanup: Delete entries created during test
    console.log('Starting post-test cleanup...');
    try {
      if (testId === 'RP003') {
        await cleanupExtraFlowTestData(page);
      } else if (testId === 'RP001') {
        await cleanupWorkflowTestData(page);
      } else if (testId === 'RP002') {
        await cleanupWorkflowWTATestData(page);
      } else if (testId === 'RP004') {
        // Cleanup deletes paycheck, unapproves entries, and deletes from reports
        await cleanupWorkflowTimeEntryTestData(page);
      } else if (testId === 'RP006') {
        await cleanupWorkflowTimeEntryTestData(page);
      } else if (testId === 'RP005') {
        await cleanupSTEWorkflowTestData(page);
      } else if (testId === 'RP007') {
        // First run the workflow cleanup (deletes paycheck, then time entries)
        await cleanupBreaksWorkflowTestData(page);
        // Then delete any remaining entries from Reports
        await deleteSTAEntriesFromReports(page, '', 50);
      } else if (testId === 'RP008') {
        await cleanupSTACrossModuleTestData(page);
      } else if (testId === 'RP009') {
        await cleanupSTAFromProjectsTestData(page);
      } else if (testId === 'RP010') {
        await cleanupSTEProjectsVerificationTestData(page);
      }
      console.log('Post-test cleanup completed successfully');
    } catch (error) {
      console.log('Post-test cleanup failed:', error);
    }
  });
});
