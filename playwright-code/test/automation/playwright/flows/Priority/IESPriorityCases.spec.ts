import { test } from '@playwright/test';
import { expect } from '@playwright/test';
import { getTestAccount } from '../../config/accounts';
import { openQBOTS } from '../../pages/QBOLogin';
import {
  validateBreakRulesPriorityCases,
  validateWeeklyTimeEntryPriorityCases,
  validateTimeClockPriorityCases,
  singleTimeActivityPriorityCasesOptimized,
  validateTimeSettingsPriorityCases,
  setCustomTimesheetFieldsPrerequisites,
} from '../Util/PriorityCasesOTX.util';
import {
  addEditViewSte,
  cleanupAllTimeEntries,
} from '../Util/TimeEntries.util';
import { CreateAndDeactivateNewCustomField } from '../Util/CustomFieldSettings.Util';
import {
  assignCustomFieldToCustomerAndValidateWTE,
  assignWorkersAndLeadsFromDetailsPage,
  createCustomerAndAssignTimeTrackingFieldsSTE,
  groupsCrudOperations,
  toggleRequiredOnAndOff,
  toggleRequiredOnAndValidateSTE,
  validateCustomFieldsSaveFailureError,
  cleanupAllGroups,
  cleanupCustomFieldCustomerAssignment,
  cleanupRequiredTogglesForCustomFields,
} from '../Util/Assignments.util';
import { weeklyTimeActivityPriorityCases } from '../Util/WeeklyTimeActivityCRUD.util';
import { USER_ROLES } from '../../utils';
import { validateTimeMenuLinksAndLandingPages } from '../Util/TimePayrollRegression.util';

test.describe('IES Priority Cases', () => {
  test.beforeEach(async ({ page }) => {
    const testInfo = test.info();
    const testId = testInfo.title.split(' - ')[0];
    const credentials = getTestAccount(testId);
    console.log(
      `[${testId}] Logging in with IES credentials:`,
      credentials.username,
    );
    await openQBOTS(page, credentials);
    console.log(`[${testId}] Login successful`);
  });

  test.afterEach(async ({ page }) => {
    const testInfo = test.info();
    const testId = testInfo.title.split(' - ')[0];
    console.log(`[${testId}] Starting post-test cleanup...`);

    // Cleanup time entries for time-related tests
    if (
      testId === 'IES01' ||
      testId === 'IES02' ||
      testId === 'IES03' ||
      testId === 'IES04' ||
      testId === 'IES05' ||
      testId === 'IES06' ||
      testId === 'IES07' ||
      testId === 'IES10' ||
      testId === 'IES15'
    ) {
      try {
        await cleanupAllTimeEntries(page);
        console.log(`[${testId}] Time entries cleanup completed successfully`);
      } catch (error) {
        console.log(`[${testId}] Time entries cleanup failed:`, error);
      }
    }

    // Cleanup groups for group-related tests
    if (testId === 'IES13' || testId === 'IES14') {
      try {
        await cleanupAllGroups(page);
        console.log(`[${testId}] Groups cleanup completed successfully`);
      } catch (error) {
        console.log(`[${testId}] Groups cleanup failed:`, error);
      }
    }
  });

  test('IES01 - Single Time Activity Cases', async ({ page }) => {
    console.log('Starting Single Time Activity Cases');
    await singleTimeActivityPriorityCasesOptimized(page);
    console.log('✓ IES01 - Single Time Activity Cases completed');
  });

  test('IES15 - Weekly Time Activity Cases', async ({ page }) => {
    console.log('Starting Weekly Time Activity Cases');
    await weeklyTimeActivityPriorityCases(page, USER_ROLES.p0companyAdmin);
    console.log('✓ IES15 - Weekly Time Activity Cases completed');
  });

  test('IES02 - Single Time Entry Cases', async ({ page }) => {
    console.log('Starting Single Time Entry Cases');
    await addEditViewSte(page);
    console.log('✓ IES02 - Single Time Entry Cases completed');
  });

  test('IES03 - Weekly Time Entry Cases', async ({ page }) => {
    console.log('Setting up custom timesheet fields prerequisites');
    await setCustomTimesheetFieldsPrerequisites(page);
    console.log('Starting Weekly Time Entry Cases');
    await validateWeeklyTimeEntryPriorityCases(page);
    console.log('✓ IES03 - Weekly Time Entry Cases completed');
  });

  test('IES04 - Break Rules Cases', async ({ page }) => {
    console.log('Starting Break Rules Cases');
    await validateBreakRulesPriorityCases(page);
    console.log('✓ IES04 - Break Rules Cases completed');
  });

  test('IES05 - Time Clock Cases', async ({ page }) => {
    console.log('Starting Time Clock Cases');
    await validateTimeClockPriorityCases(page);
    console.log('✓ IES05 - Time Clock Cases completed');
  });

  test('IES06 - Time Settings Cases', async ({ page }) => {
    console.log('Starting Time Settings Cases');
    await validateTimeSettingsPriorityCases(page);
    console.log('✓ IES06 - Time Settings Cases completed');
  });

  test('IES07 - Custom Field Cases', async ({ page }) => {
    console.log('Starting Custom Field Cases');
    await CreateAndDeactivateNewCustomField(page);
    console.log('✓ IES07 - Custom Field Cases completed');
  });

  test('IES08 - Toggle required on in custom fields', async ({ page }) => {
    console.log('Starting Toggle required on in custom fields');
    await toggleRequiredOnAndOff(page);
    console.log('✓ IES08 - Toggle required on in custom fields completed');
  });

  test('IES09 - Toggle required on in custom fields STE', async ({ page }) => {
    console.log('Starting Toggle required on in custom fields STE');
    await toggleRequiredOnAndValidateSTE(page);
    console.log('✓ IES09 - Toggle required on in custom fields STE completed');
  });

  test('IES10 - Assign custom field for a customer in WTE', async ({
    page,
  }) => {
    console.log('Starting Assign custom field for a customer in WTE');
    await assignCustomFieldToCustomerAndValidateWTE(page);
    console.log(
      '✓ IES10 - Assign custom field for a customer in WTE completed',
    );
  });

  test('IES11 - Create customer and validate assign to time tracking fields STE', async ({
    page,
  }) => {
    test.info().annotations.push({
      type: 'fixme',
      description:
        'IES11 test case will be enabled after assignments fixes are enabled',
    });
    return;
    console.log(
      'Starting Create customer and validate assign to time tracking fields STE',
    );
    await createCustomerAndAssignTimeTrackingFieldsSTE(page);
    console.log(
      '✓ IES11 - Create customer and validate assign to time tracking fields STE completed',
    );
  });

  test('IES12 - Custom Fields Error State - Changes Not Saved', async ({
    page,
  }) => {
    test.info().annotations.push({
      type: 'fixme',
      description:
        'IES12 test case will be enabled after assignments fixes are enabled',
    });
    return;
    console.log('Starting Custom Fields Error State - Changes Not Saved');
    await validateCustomFieldsSaveFailureError(page);
    console.log(
      '✓ IES12 - Custom Fields Error State - Changes Not Saved completed',
    );
  });

  test('IES13 - Assign workers/leads from groups details page', async ({
    page,
  }) => {
    console.log('Starting Assign workers/leads from groups details page');
    await assignWorkersAndLeadsFromDetailsPage(page);
    console.log(
      '✓ IES13 - Assign workers/leads from groups details page completed',
    );
  });

  //IES14 and IES15 are covered in this test
  test('IES14 - CRUD cases for groups', async ({ page }) => {
    console.log('Starting Groups CRUD operations');
    await groupsCrudOperations(page);
    console.log('✓ IES14 - Groups CRUD operations completed');
  });

  test('IES16 - Validate Time menu for Elite - Standard all access role (all 7 options)', async ({
    page,
  }) => {
    console.log('Starting Validate Time menu for Standard all access role');
    await validateTimeMenuLinksAndLandingPages(page, 'elite');
    console.log(
      '✓ IES16 - Validate Time menu for Standard all access role completed',
    );
  });
});
