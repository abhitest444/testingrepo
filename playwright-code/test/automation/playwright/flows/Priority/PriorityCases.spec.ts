import { test } from '@playwright/test';
import {
  getRandomAssignmentsPriorityAccount,
  getRandomTestAccount,
  getTestAccount,
  getRandomMileageTrackingAccount,
} from '../../config/accounts';
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
  cleanupAllTimeEntriesOnly,
  validateAutoCalculateInMileageTracking,
  cleanupAllTimeEntriesForMileageTracking,
} from '../Util/TimeEntries.util';
import {
  CreateAndDeactivateNewCustomField,
  deactivateAllTestCustomFields,
} from '../Util/CustomFieldSettings.Util';
import { assignmentsExtendedMatrixE2EFlow } from '../Util/Assignments.util';
import { validateTimeMenuLinksAndLandingPages } from '../Util/TimePayrollRegression.util';

/** When set (e.g. PA01 on prod), use that companyAdmin test id instead of a random elite pool account. */
function credentialsForElitePrioritySuite() {
  const id = process.env.PLAYWRIGHT_ELITE_ACCOUNT_ID?.trim();
  if (id) {
    console.log('Elite priority suite: using PLAYWRIGHT_ELITE_ACCOUNT_ID=', id);
    return getTestAccount(id);
  }
  return getRandomTestAccount('elite');
}

test.describe('Playwright', () => {
  test.describe('Elite', () => {
    test.describe('Core priority suite', () => {
      test.beforeEach(async ({ page }) => {
        const credentials = credentialsForElitePrioritySuite();
        console.log('Logging in with Elite credentials:', credentials.username);
        await openQBOTS(page, credentials);
        console.log('Login successful');
      });

      test.afterEach(async ({ page }) => {
        console.log('Starting post-test cleanup (core suite)...');
        try {
          // Core suite touches Break Rules; keep full cleanup.
          await cleanupAllTimeEntries(page);
          await deactivateAllTestCustomFields(page);
          console.log('Post-test cleanup completed successfully');
        } catch (error) {
          console.log('Post-test cleanup failed:', error);
          // Don't fail the test due to cleanup issues
        }
      });

      test('End to end testing', async ({ page }) => {
        console.log('Starting Single Time Activity Cases');
        await singleTimeActivityPriorityCasesOptimized(page);
        console.log('Completed Single Time Activity Cases');

        console.log('Start Single Time Entry Cases');
        await addEditViewSte(page);
        console.log('Completed Single Time Entry Cases');

        await setCustomTimesheetFieldsPrerequisites(page);

        // Weekly Time Entry Priority Cases
        console.log('Start Weekly Time Entry Cases');
        await validateWeeklyTimeEntryPriorityCases(page);
        console.log('Completed Weekly Time Entry Cases');

        // Break Priority Cases
        console.log('Start Break Rules Cases');
        await validateBreakRulesPriorityCases(page);
        console.log('Completed Break Rules Cases');

        //Time Clock Priority Cases
        console.log('Starting Time Clock Cases');
        await validateTimeClockPriorityCases(page);
        console.log('Completed Time Clock Cases');

        // Time Settings Priority Cases
        console.log('Start Time Settings Cases');
        await validateTimeSettingsPriorityCases(page);
        console.log('Completed Time Settings Cases');

        // Custom Field Priority Cases
        console.log('Start Custom Field Cases');
        await CreateAndDeactivateNewCustomField(page);
        console.log('Completed Custom Field Cases');
      });
    });

    test.describe('Assignments priority cases', () => {
      test.beforeEach(async ({ page }) => {
        const credentials = getRandomAssignmentsPriorityAccount();
        console.log(
          'Assignments priority: logging in with',
          credentials.username,
        );
        await openQBOTS(page, credentials);
        console.log('Login successful (assignments priority account)');

        console.log('Starting pre-test cleanup (assignments suite)...');
        try {
          await deactivateAllTestCustomFields(page);
          console.log('Pre-test cleanup completed successfully');
        } catch (error) {
          console.log('Pre-test cleanup failed:', error);
          // Don't fail the test due to cleanup issues
        }
      });

      test.afterEach(async ({ page }) => {
        console.log('Starting post-test cleanup (assignments suite)...');
        try {
          // Assignments priority cases don't validate Break Rules; avoid extra hops.
          await cleanupAllTimeEntriesOnly(page);
          await deactivateAllTestCustomFields(page);
          console.log('Post-test cleanup completed successfully');
        } catch (error) {
          console.log('Post-test cleanup failed:', error);
          // Don't fail the test due to cleanup issues
        }
      });

      /**
       * Full matrix: 2 dropdown CFs (customer 1 only + option workers), STE/WTE, Service→customer 2,
       * Assignments workers + Location TTF. Standard fields stay **Inactive** on Timesheet settings so assignments are not
       * reset to all customers/workers. Requires ≥2 customers.
       */
      test('End to end - Assignments priority case - CF, Service, Location TTF', async ({
        page,
      }) => {
        console.log('Starting Assignments extended matrix E2E flow');
        await assignmentsExtendedMatrixE2EFlow(page);
        console.log('Completed Assignments extended matrix E2E flow');
      });
    });

    test.describe('Mileage priority cases', () => {
      test.beforeEach(async ({ page }) => {
        const credentials = getRandomMileageTrackingAccount();
        console.log('Mileage priority: logging in with', credentials.username);
        await openQBOTS(page, credentials);
        console.log('Login successful (mileage priority account)');

        console.log('Starting pre-test cleanup (mileage suite)...');
        try {
          await cleanupAllTimeEntriesForMileageTracking(page);
          console.log('Pre-test cleanup completed successfully');
        } catch (error) {
          console.log('Pre-test cleanup failed:', error);
          // Don't fail the test due to cleanup issues
        }
      });

      test.afterEach(async ({ page }) => {
        console.log('Starting post-test cleanup (mileage suite)...');
        try {
          await cleanupAllTimeEntriesForMileageTracking(page);
          console.log('Post-test cleanup completed successfully');
        } catch (error) {
          console.log('Post-test cleanup failed:', error);
          // Don't fail the test due to cleanup issues
        }
      });

      test('Mileage priority case - Validate Auto Calculate in STE', async ({
        page,
      }) => {
        console.log(
          'Starting Mileage priority case - Validate Auto Calculate in STE',
        );
        await validateAutoCalculateInMileageTracking(page);
        console.log(
          'Completed Mileage priority case - Validate Auto Calculate in STE',
        );
      });
    });

    test.describe('IES Time Menu Validation Cases', () => {
      test.beforeEach(async ({ page }) => {
        const testId = test.info().title.split(' - ')[0];
        const credentials = getTestAccount(testId);
        console.log('Logging in for', testId, credentials.username);
        await openQBOTS(page, credentials);
        console.log('Login successful');
      });

      test('IESP01 - Validate Time menu for Time Premium company', async ({
        page,
      }) => {
        await validateTimeMenuLinksAndLandingPages(page, 'time_premium');
        console.log(
          'TEST PASSED: Time menu navigation validation for Time Premium company completed successfully!',
        );
      });

      test('IESP02 - Validate Time menu for Free company (Time entries & Schedule only)', async ({
        page,
      }) => {
        await validateTimeMenuLinksAndLandingPages(page, 'free');
        console.log(
          'TEST PASSED: Time menu navigation validation for Free company completed successfully!',
        );
      });
      test('IESP03 - Validate Time menu for Payroll Elite company (all 7 options)', async ({
        page,
      }) => {
        await validateTimeMenuLinksAndLandingPages(page, 'elite');
        console.log(
          'TEST PASSED: Time menu navigation validation for Payroll Elite company completed successfully!',
        );
      });

      test('IESP04 - Validate Time menu for Payroll Premium company (all 7 options)', async ({
        page,
      }) => {
        await validateTimeMenuLinksAndLandingPages(page, 'elite');
        console.log(
          'TEST PASSED: Time menu navigation validation for Payroll Premium company completed successfully!',
        );
      });
    });
  });
});
