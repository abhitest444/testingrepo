import { test } from '@playwright/test';
import { getTestAccount } from '../../config/accounts';
import { openQBOTS } from '../../pages/QBOLogin';
import {
  createSingleTimeEntry,
  validateTimeEntriesInTable,
  approveTimeEntries,
  navigateToRunPayrollAndValidate,
  unapproveAndEditTimeEntry,
  validateReportsBeforeApproval,
  reapproveTimeEntries,
  validateReportsAfterApproval,
  runAndSubmitPayroll,
  deletePayCheck,
  unapproveTimeFromEmployeeSection,
  deleteTimeEntry,
  cleanupRunPayrollTestData,
  validateWeeklyTimesheetTotals,
  createWeeklyTimeEntryThreeCellsRunPayroll,
  unapproveAndEditWeeklyTimeEntry,
  validateBreaksAndEditFlowInRunPayroll,
  cleanupBreaksEditWorkflowTestData,
  createTimeClockEntryRunPayroll,
  validateTimeClockEntriesInTable,
  cleanupRunPayrollTestDataTC,
  cleanupRunPayrollTestDataWTE,
  unapproveAndEditTCTimeEntry,
  navigateToRunPayrollAndValidateTC,
  validateReportsBeforeApprovalTC,
  reapproveTimeEntriesWTE,
  createSTARunPayroll,
  deleteAuditEntry,
  validateEntryFromAuditlog,
  editedTimeEntryFromAuditlog,
  cleanupEntryFromAuditlog,
  validateReportsBeforeEdit,
  validateReportsAfterEdit,
  createWTARunPayroll,
  deleteAuditEntryWTA,
  editedTimeEntryFromAuditlogWTA,
} from '../Util/RunPayrollEditFlow.util';

test.describe('Run Payroll Edit Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Get current test info
    const testInfo = test.info();
    // Login using test-specific credentials
    const testId = testInfo.title.split(' - ')[0];
    const credentials = getTestAccount(testId);
    console.log('Logging in with credentials:', credentials.username);
    await openQBOTS(page, credentials);
    console.log('Login successful');

    // Pre-test cleanup: Delete old entries to ensure clean state
    console.log('Starting pre-test cleanup...');

    try {
      if (testId === 'RPEF001') {
        //await cleanupRunPayrollTestData(page);
        await cleanupRunPayrollTestDataWTE(page, 'Emp1, Test');
        console.log(`  ✓ Cleaned up time entries for ${testId}`);
      } else if (testId === 'RPEF002') {
        await cleanupRunPayrollTestDataWTE(page, 'Emp1, Test');
        console.log(`  ✓ Cleaned up payroll and time entries for ${testId}`);
      } else if (testId === 'RPEF003') {
        await cleanupRunPayrollTestDataTC(page);
        console.log(`  ✓ Cleaned up payroll and time entries for ${testId}`);
      } else if (testId === 'RPEF004') {
        await cleanupBreaksEditWorkflowTestData(page);
        console.log(`  ✓ Cleaned up payroll and time entries for ${testId}`);
      } else if (testId === 'RPEF005') {
        await cleanupEntryFromAuditlog(page);
        console.log(`  ✓ Cleaned up payroll and time entries for ${testId}`);
      } else if (testId === 'RPEF006') {
        await deleteAuditEntryWTA(page);
        console.log(`  ✓ Cleaned up payroll and time entries for ${testId}`);
      }
    } catch (cleanupError) {
      console.log(
        '  ℹ No old entries found or cleanup not needed:',
        cleanupError,
      );
    }

    console.log('Pre-test cleanup completed');
  });

  test.afterEach(async ({ page }) => {
    const testInfo = test.info();
    // Login using test-specific credentials
    const testId = testInfo.title.split(' - ')[0];
    console.log('Starting post-test cleanup...');
    try {
      if (testId === 'RPEF004') {
        await cleanupBreaksEditWorkflowTestData(page);
        console.log('Post-test cleanup completed successfully');
      }
    } catch (error) {
      console.log('Post-test cleanup failed:', error);
    }
  });

  test('RPEF001 - Create Single Time Entry -> Verify in Run Payroll (Unapproved) -> Approve STE -> Verify in Run Payroll (Approved) -> Unapprove & Re-Approve STE -> Edit the STE -> Re-Approve STE -> Verify Final State in Run Payroll -> Submit Payroll - Complete Workflow', async ({
    page,
  }) => {
    console.log('Starting Run Payroll Edit STE Flow test...');

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

    // Step 4: Go to the run payroll
    // Step 5: Validate the regular pay and gross pay
    console.log(
      'Step 4-5: Navigating to run payroll and validating initial amounts...',
    );
    await navigateToRunPayrollAndValidate(page, '8h', '$800.00');

    // Step 6: Click on edit time
    // Step 7: Unapprove the approved time and edit the time and notes
    console.log('Step 6-7: Unapproving and editing STE time entry...');
    await unapproveAndEditTimeEntry(
      page,
      '07:00',
      'Test notes edited - workflow',
      '8h',
      '$800.00',
    );

    // Step 8: Validate the regular pay and gross pay it should existing value (before re-approval)
    console.log(
      'Step 8: Validating payroll shows existing values before re-approval...',
    );
    await navigateToRunPayrollAndValidate(page, '8h', '$800.00');

    // Step 9: Validate reports before approval (should show old values)
    console.log('Step 9: Validating reports before approval...');
    await validateReportsBeforeApproval(page, 'Test Emp1', '08:00');

    // Step 10: Approve the edited time
    console.log('Step 10: Re-approving edited time...');
    await reapproveTimeEntries(page, 'Emp1, Test');

    // Step 11: Validate the new regular pay and gross pay
    console.log('Step 11: Validating updated payroll amounts...');
    await navigateToRunPayrollAndValidate(page, '7h', '$700.00');

    // Step 12: Validate reports after approval (should show new values)
    console.log('Step 12: Validating reports after re-approval...');
    await validateReportsAfterApproval(page, 'Test Emp1', '07.00');

    // Step 13: Run the payroll and submit the payroll
    console.log('Step 13: Running and submitting payroll...');
    await runAndSubmitPayroll(page);

    // Step 14: Delete the already created pay check
    console.log('Step 14: Deleting the created pay check...');
    await deletePayCheck(page);

    // Step 15: Unapprove the time from time entries employee section
    console.log('Step 15: Unapproving time from employee section...');
    await unapproveTimeFromEmployeeSection(page, 'Emp1, Test');

    // Step 16: Delete the time entry
    console.log('Step 16: Deleting the time entry...');
    await deleteTimeEntry(page, 'Emp1, Test');

    console.log('✓ Run Payroll Edit STE Flow test completed successfully!');
  });

  test('RPEF002 - Create Weekly Time Entry -> Verify in Run Payroll (Unapproved) -> Approve WTE -> Verify in Run Payroll (Approved) -> Unapprove & Re-Approve WTE -> Edit the WTE -> Re-Approve WTE -> Verify Final State in Run Payroll -> Submit Payroll- Complete Workflow', async ({
    page,
  }) => {
    console.log('Starting Run Payroll Edit WTE Flow test...');

    // Step 1: Create weekly time entry and save
    console.log('Step 1: Creating weekly time entry for WTE workflow...');
    await createWeeklyTimeEntryThreeCellsRunPayroll(page);

    // Step 2: Validate the time entries entered in the table
    console.log('Step 2: Validating weekly timesheet totals...');
    await validateWeeklyTimesheetTotals(page, 'Emp1, Test', '8.00');

    // Step 3: Go to the employee dropdown and approve the entered time entry
    console.log('Step 3: Approving time entries...');
    await approveTimeEntries(page, 'Emp1, Test');

    // Step 4: Go to the run payroll
    // Step 5: Validate the regular pay and gross pay
    console.log(
      'Step 4-5: Navigating to run payroll and validating initial amounts...',
    );
    await navigateToRunPayrollAndValidate(page, '16h', '$1,600.00');

    // Step 6: Click on edit time
    // Step 7: Unapprove the approved time and edit the time and notes
    console.log('Step 6-7: Unapproving and editing weekly time entry...');
    await unapproveAndEditWeeklyTimeEntry(
      page,
      '07:00',
      'Test notes edited - workflow',
      '16h',
      '$1,600.00',
    );

    // Step 8: Validate the regular pay and gross pay it should existing value (before re-approval)
    console.log(
      'Step 8: Validating payroll shows existing values before re-approval...',
    );
    await navigateToRunPayrollAndValidate(page, '16h', '$1,600.00');

    // Step 9: Validate reports before approval (should show old values)
    console.log('Step 9: Validating reports before approval...');
    await validateReportsBeforeApproval(page, 'Test Emp1', '08:00');

    // Step 10: Approve the edited time
    console.log('Step 10: Re-approving edited time...');
    await reapproveTimeEntriesWTE(page, 'Emp1, Test');

    // Step 11: Validate the new regular pay and gross pay
    console.log('Step 11: Validating updated payroll amounts...');
    await navigateToRunPayrollAndValidate(page, '14h', '$1,400.00');

    // Step 12: Validate reports after approval (should show new values)
    console.log('Step 12: Validating reports after re-approval...');
    await validateReportsAfterApproval(page, 'Test Emp1', '07.00');

    // Step 13: Run the payroll and submit the payroll
    console.log('Step 13: Running and submitting payroll...');
    await runAndSubmitPayroll(page);

    // Step 14: Delete the already created pay check
    console.log('Step 14: Deleting the created pay check...');
    await deletePayCheck(page);

    // Step 15: Unapprove the time from time entries employee section
    console.log('Step 15: Unapproving time from employee section...');
    await unapproveTimeFromEmployeeSection(page, 'Emp1, Test');

    // Step 16: Delete the time entry
    console.log('Step 16: Deleting the time entry...');
    await deleteTimeEntry(page, 'Emp1, Test');

    console.log('✓ Run Payroll Edit WTE Flow test completed successfully!');
  });

  test('RPEF003 - Create Time Clock Entry -> Verify in Run Payroll (Unapproved) -> Approve TC -> Verify in Run Payroll (Approved) -> Unapprove & Re-Approve TC -> Edit the TC -> Re-Approve TC -> Verify Final State in Run Payroll -> Submit Payroll- Complete Workflow', async ({
    page,
  }) => {
    console.log('Starting Run Payroll Edit Time clock Flow test...');

    // Step 1: Create weekly time entry and save
    console.log('Step 1: Creating time clock entry for workflow...');
    await createTimeClockEntryRunPayroll(page);

    // Step 2: Validate the time entries entered in the table
    console.log('Step 2: Validating time clock entries in table...');
    await validateTimeClockEntriesInTable(page, 'Emp1, Test');

    // Step 3: Go to the employee dropdown and approve the entered time entry
    console.log('Step 3: Approving time entries...');
    await approveTimeEntries(page, 'Emp1, Test');

    // Step 4: Go to the run payroll
    // Step 5: Validate the regular pay and gross pay
    console.log(
      'Step 4-5: Navigating to run payroll and validating initial amounts...',
    );
    await navigateToRunPayrollAndValidateTC(
      page,
      ['0.03h', '0.02h'],
      ['$3.00', '$2.00'],
    );

    // Step 6: Click on edit time
    // Step 7: Unapprove the approved time and edit the time and notes
    console.log('Step 6-7: Unapproving and editing time clock entry...');
    await unapproveAndEditTCTimeEntry(
      page,
      '9:00 AM',
      '4:00 PM',
      'Test notes edited - workflow',
      ['0.03h', '0.02h'],
      ['$3.00', '$2.00'],
    );

    // Step 8: Validate the regular pay and gross pay it should existing value (before re-approval)
    console.log(
      'Step 8: Validating payroll shows existing values before re-approval...',
    );
    await navigateToRunPayrollAndValidateTC(
      page,
      ['0.03h', '0.02h'],
      ['$3.00', '$2.00'],
    );

    // Step 9: Validate reports before approval (should show old values)
    console.log('Step 9: Validating reports before approval...');
    await validateReportsBeforeApprovalTC(page, 'Test Emp1', '00:02');

    // Step 10: Approve the edited time
    console.log('Step 10: Re-approving edited time...');
    await reapproveTimeEntriesWTE(page, 'Emp1, Test');

    // Step 11: Validate the new regular pay and gross pay
    console.log('Step 11: Validating updated payroll amounts...');
    await navigateToRunPayrollAndValidate(page, '7h', '$700.00');

    // Step 12: Validate reports after approval (should show new values)
    console.log('Step 12: Validating reports after re-approval...');
    await validateReportsAfterApproval(page, 'Test Emp1', '07.00');

    // Step 13: Run the payroll and submit the payroll
    console.log('Step 13: Running and submitting payroll...');
    await runAndSubmitPayroll(page);

    // Step 14: Delete the already created pay check
    console.log('Step 14: Deleting the created pay check...');
    await deletePayCheck(page);

    // Step 15: Unapprove the time from time entries employee section
    console.log('Step 15: Unapproving time from employee section...');
    await unapproveTimeFromEmployeeSection(page, 'Emp1, Test');

    // Step 16: Delete the time entry
    console.log('Step 16: Deleting the time entry...');
    await deleteTimeEntry(page, 'Emp1, Test');

    console.log(
      '✓ Run Payroll Edit Time clock Flow test completed successfully!',
    );
  });

  test('RPEF004 - Create Break Entry -> Verify in Run Payroll (Unapproved) -> Approve Breaks -> Verify in Run Payroll (Approved) -> Unapprove & Re-Approve Breaks -> Verify Final State in Run Payroll -> Submit Payroll - Complete Workflow', async ({
    page,
  }) => {
    console.log('Starting Run Payroll Edit Flow for Breaks test...');
    await validateBreaksAndEditFlowInRunPayroll(page);
    console.log(
      'TEST PASSED: Run Payroll Edit Flow for Breaks test completed successfully!',
    );
  });

  test('RPEF005 - Create Single Time Activity -> Verify in Run Payroll -> Validate audit log -> Edit the STA -> Verify Final State in Run Payroll -> Submit Payroll - Complete Workflow', async ({
    page,
  }) => {
    console.log('Starting Run Payroll Edit STA Flow test...');

    // Step 1: Create single time entry and save
    console.log('Step 1: Creating Schedule Time entry for STA workflow...');

    const timeEntryData = await createSTARunPayroll(page, 'Emp1, Test');

    // Step 4: Go to the run payroll
    // Step 5: Validate the regular pay and gross pay
    console.log('Step 2: Validating payroll amounts before edits...');
    await navigateToRunPayrollAndValidate(page, '8h', '$800.00');

    // Step 9: Validate reports before approval (should show old values)
    console.log('Step 3: Validating reports before STA edit...');
    await validateReportsBeforeEdit(page, 'Test Emp1', '08:00');

    // Navigate to Audit Log
    console.log('Step 4: Navigating to audit log for STA entry...');
    await validateEntryFromAuditlog(page);

    //edited auditlog in STA
    console.log('Step 5: Editing STA entry from audit log...');
    await editedTimeEntryFromAuditlog(page);

    // Step 11: Validate the new regular pay and gross pay
    console.log('Step 6: Validating payroll amounts after STA edit...');
    await navigateToRunPayrollAndValidate(page, '7h', '$700.00');

    // Step 12: Validate reports after approval (should show new values)
    console.log('Step 7: Validating reports after STA edit...');
    await validateReportsAfterEdit(page, 'Test Emp1', '07.00');

    // Step 13: Run the payroll and submit the payroll
    console.log('Step 13: Running and submitting payroll...');
    await runAndSubmitPayroll(page);

    // Step 14: Delete the already created pay check
    console.log('Step 14: Deleting the created pay check...');
    await deletePayCheck(page);

    // Step 15: Validate audit log edit flow and delete entry
    console.log('Step 8: Cleaning up STA entry via audit log...');
    await deleteAuditEntry(page);

    console.log('✓ Run Payroll Edit STE Flow test completed successfully!');
  });

  test('RPEF006 - Create Weekly Time Activity -> Verify in Run Payroll -> Validate audit log -> Edit the WTA -> Verify Final State in Run Payroll -> Submit Payroll - Complete Workflow', async ({
    page,
  }) => {
    console.log('Starting Run Payroll Edit WTA Flow test...');

    // Step 1: Create single time entry and save
    console.log('Step 1: Creating Who’s Working entry for WTA workflow...');

    const timeEntryData = await createWTARunPayroll(page, 'Emp1, Test');

    // Step 4: Go to the run payroll
    // Step 5: Validate the regular pay and gross pay
    console.log('Step 2: Validating payroll amounts before WTA edit...');
    await navigateToRunPayrollAndValidateTC(
      page,
      ['24h', '16h'],
      ['$2,400.00', '$1,600.00'],
    );

    // Step 9: Validate reports before approval (should show old values)
    console.log('Step 3: Validating reports before WTA edit...');
    await validateReportsBeforeEdit(page, 'Test Emp1', '08:00');

    // Navigate to Audit Log
    console.log('Step 4: Navigating to audit log for WTA entry...');
    await validateEntryFromAuditlog(page);

    //edited auditlog in STA
    console.log('Step 5: Editing WTA entry from audit log...');
    await editedTimeEntryFromAuditlogWTA(page);

    // Step 11: Validate the new regular pay and gross pay
    console.log('Step 6: Validating payroll amounts after WTA edit...');
    await navigateToRunPayrollAndValidateTC(
      page,
      ['23h', '15h'],
      ['$2,300.00', '$1,500.00'],
    );

    // Step 12: Validate reports after approval (should show new values)
    console.log('Step 7: Validating reports after WTA edit...');
    await validateReportsAfterEdit(page, 'Test Emp1', '07.00');

    // Step 13: Run the payroll and submit the payroll
    console.log('Step 13: Running and submitting payroll...');
    await runAndSubmitPayroll(page);

    // Step 14: Delete the already created pay check
    console.log('Step 14: Deleting the created pay check...');
    await deletePayCheck(page);

    console.log('✓ Run Payroll Edit STE Flow test completed successfully!');
  });
});
