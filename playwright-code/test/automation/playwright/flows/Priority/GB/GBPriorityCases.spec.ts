import { test } from '@playwright/test';
import { expect } from '@playwright/test';
import { getRandomTestAccount } from '../../../config/GB/gbaccounts';
import * as TimeSettingsPage from '../../../pages/TimeSettingsPage';
import { openQBOTS } from '../../../pages/GB/GBQboLogin';
import {
  validateBreakRulesPriorityCases,
  validateWeeklyTimeEntryPriorityCases,
  validateTimeClockPriorityCases,
  singleTimeActivityPriorityCasesOptimized,
  validateTimeSettingsPriorityCases,
  setCustomTimesheetFieldsPrerequisites,
} from '../../Util/GB/GBPriorityCasesOTX.util';
import {
  addEditViewSte,
  cleanupAllTimeEntries,
} from '../../Util/GB/GBTimeEntries.util';

test.describe('Playwright', () => {
  test.describe('Elite', () => {
    const env = process.env.PLAYWRIGHT_ENV;
    test.afterEach(async ({ page }) => {
      console.log('Starting post-test cleanup...');
      try {
        await cleanupAllTimeEntries(page);
        console.log('Post-test cleanup completed successfully');
      } catch (error) {
        console.log('Post-test cleanup failed:', error);
        // Don't fail the test due to cleanup issues
      }
    });

    test(`${env} UK Payroll Obil Elite - End to end testing`, async ({
      page,
    }) => {
      const credentials = getRandomTestAccount('elite');
      console.log('Logging in with Elite credentials:', credentials.username);
      await openQBOTS(page, credentials);
      console.log('Login successful');

      console.log('Starting pre-test cleanup...');
      await cleanupAllTimeEntries(page);
      console.log('Pre-test cleanup completed successfully');

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

      // Time Clock Priority Cases
      console.log('Starting Time Clock Cases');
      await validateTimeClockPriorityCases(page);
      console.log('Completed Time Clock Cases');

      // Time Settings Priority Cases
      console.log('Start Time Settings Cases');
      await validateTimeSettingsPriorityCases(page);
      console.log('Completed Time Settings Cases');
    });

    test(`${env} UK Payroll Obil Premium - End to end testing`, async ({
      page,
    }) => {
      const credentials = getRandomTestAccount('premium');
      console.log('Logging in with Elite credentials:', credentials.username);
      await openQBOTS(page, credentials);
      console.log('Login successful');

      console.log('Starting pre-test cleanup...');
      await cleanupAllTimeEntries(page);
      console.log('Pre-test cleanup completed successfully');

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

      // Time Clock Priority Cases
      console.log('Starting Time Clock Cases');
      await validateTimeClockPriorityCases(page);
      console.log('Completed Time Clock Cases');

      // Time Settings Priority Cases
      console.log('Start Time Settings Cases');
      await validateTimeSettingsPriorityCases(page);
      console.log('Completed Time Settings Cases');
    });

    test(`${env} UK Legacy Core QB Time Elite - End to end testing`, async ({
      page,
    }) => {
      const credentials = getRandomTestAccount('time_elite');
      console.log('Logging in with Elite credentials:', credentials.username);
      await openQBOTS(page, credentials);
      console.log('Login successful');

      console.log('Starting pre-test cleanup...');
      await cleanupAllTimeEntries(page);
      console.log('Pre-test cleanup completed successfully');

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

      // Time Clock Priority Cases
      console.log('Starting Time Clock Cases');
      await validateTimeClockPriorityCases(page);
      console.log('Completed Time Clock Cases');

      // Time Settings Priority Cases
      console.log('Start Time Settings Cases');
      await validateTimeSettingsPriorityCases(page);
      console.log('Completed Time Settings Cases');
    });

    test(`${env} UK Legacy Core QB Time Premium - End to end testing`, async ({
      page,
    }) => {
      const credentials = getRandomTestAccount('time_premium');
      console.log('Logging in with Elite credentials:', credentials.username);
      await openQBOTS(page, credentials);
      console.log('Login successful');

      console.log('Starting pre-test cleanup...');
      await cleanupAllTimeEntries(page);
      console.log('Pre-test cleanup completed successfully');

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

      // Time Clock Priority Cases
      console.log('Starting Time Clock Cases');
      await validateTimeClockPriorityCases(page);
      console.log('Completed Time Clock Cases');

      // Time Settings Priority Cases
      console.log('Start Time Settings Cases');
      await validateTimeSettingsPriorityCases(page);
      console.log('Completed Time Settings Cases');
    });
  });
});
