import { test } from '@playwright/test';
import {
  validateServiceItemSelection,
  validateClockInFunctionality,
  validateClockOutButtonVisibility,
  validateBillableField,
  validateDepartmentSelection,
  validateTimesheetUpdateOnSave,
  validateTimerResetOnClockOut,
  validateTimerResetOnSwitchJob,
  validateClassSelection,
  validateLocationSelection,
  validateCustomField,
} from '../Util/TimeClockUtil';
import { getTestAccount } from '../../config/accounts';
import { openQBOTE } from '../../pages/QBOLogin';

test.describe('Time Clocks Page Test Cases', () => {
  test.beforeEach(async ({ page }) => {
    // Get current test info
    const testInfo = test.info();
    // Login using test-specific credentials
    const testId = testInfo.title.split(' - ')[0];
    const credentials = getTestAccount(testId);
    await openQBOTE(page, credentials);
  });

  test('TCP001 - Verify Clock In Button Functionality and Screen', async ({
    page,
  }) => {
    await validateClockInFunctionality(page);
  });

  test('TCP002 - Verify Clock In Button Visibility When Already Clocked In', async ({
    page,
  }) => {
    await validateClockOutButtonVisibility(page);
  });

  test('TCP003 - Verify Service Item Selection', async ({ page }) => {
    await validateServiceItemSelection(page);
  });

  test('TCP004 - Verify Billable Field Toggle', async ({ page }) => {
    await validateBillableField(page);
  });

  test('TCP005 - Verify Bill Rate Input When Billable', async ({ page }) => {
    await validateBillableField(page);
  });

  test('TCP006 - Verify Class Selection', async ({ page }) => {
    await validateClassSelection(page);
  });

  test('TCP007 - Verify Department Selection', async ({ page }) => {
    await validateDepartmentSelection(page);
  });

  test('TCP008 - Admin can select location', async ({ page }) => {
    await validateLocationSelection(page);
  });

  test('TCP009 - Timesheet updates on save and stays on clock', async ({
    page,
  }) => {
    await validateTimesheetUpdateOnSave(page);
  });

  test('TCP010 - Timer resets on clock out', async ({ page }) => {
    await validateTimerResetOnClockOut(page);
  });

  test('TCP011 - Timer resets and form resets on switch job', async ({
    page,
  }) => {
    await validateTimerResetOnSwitchJob(page);
  });

  test('TCP012 - Custom field validation', async ({ page }) => {
    test.info().fixme(true, 'https://jira.intuit.com/browse/QUANTA-3848');
    await validateCustomField(page);
  });

  // NOTE: Time Clock QBO-user coverage moved to
  // flows/QBO/TimeClockQBO.spec.ts (one case per QBO SKU account).
});
