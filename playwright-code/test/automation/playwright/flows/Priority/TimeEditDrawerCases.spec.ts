import { test } from '@playwright/test';
import { expect } from '@playwright/test';
import { getRandomTestAccount, getTestAccount } from '../../config/accounts';
import * as TimeSettingsPage from '../../pages/TimeSettingsPage';
import { openQBOTS } from '../../pages/QBOLogin';
import {
  validateAddTimeDrawerCases,
  cleanupTimeEntriesForAT,
} from '../Util/TimeEntries.util';

test.describe('Add Time Drawer Cases', () => {
  test.beforeEach(async ({ page }) => {
    // Get current test info
    const testInfo = test.info();
    // Login using test-specific credentials
    const testId = testInfo.title.split(' - ')[0];
    const credentials = getTestAccount(testId);
    await openQBOTS(page, credentials);

    try {
      await cleanupTimeEntriesForAT(page);
    } catch (error) {
      console.log('Pre-test cleanup failed:', error);
      // Don't fail the test if cleanup / delete was unsuccessful
    }
  });

  test.afterEach(async ({ page }) => {
    console.log('Starting post-test cleanup...');
    try {
      await cleanupTimeEntriesForAT(page);
      console.log('Post-test cleanup completed successfully');
    } catch (error) {
      console.log('Post-test cleanup failed:', error);
      // Don't fail the test if cleanup / delete was unsuccessful
    }
  });

  test('ATD01 - Validate Add Time Drawer Cases', async ({ page }) => {
    console.log('Starting Add Time Drawer Cases');
    await validateAddTimeDrawerCases(page);
    console.log('Completed Add Time Drawer Cases');
  });
});
