import { test } from '@playwright/test';
import {
  getRandomAssignmentsPriorityAccount,
  getRandomTestAccount,
  getTestAccount,
} from '../../config/accounts';
import { openWorkforce } from '../../pages/QBOLogin';
import {
  verifyWorkforceLoginDashboardAndFilters,
  verifyBreakEntryCompleteFlow,
  verifySteCompleteFlow,
  verifyWteCompleteFlow,
  verifyClockInOutFlow,
} from '../Util/Workforce.Util';
import { dismissCookieConsent } from '../../pages/MileagePage';

test.describe('Workforce Priority Cases', () => {
  test.beforeEach(async ({ page }) => {
    const testInfo = test.info();
    const testId = testInfo.title.split(' - ')[0];
    const credentials = getTestAccount(testId);
    console.log(
      `[${testId}] Logging in with Workforce credentials:`,
      credentials.username,
    );
    await openWorkforce(page, credentials);
    console.log(`[${testId}] Login successful`);
  });

  test.afterEach(async ({ page }) => {
    console.log('Starting post-test cleanup (core suite)...');
    try {
      // Core suite touches Break Rules; keep full cleanup.
      //await cleanupAllTimeEntries(page);
      console.log('Post-test cleanup completed successfully');
    } catch (error) {
      console.log('Post-test cleanup failed:', error);
      // Don't fail the test due to cleanup issues
    }
  });

  test('WFP001 - Login, Dashboard & Page Elements', async ({ page }) => {
    await verifyWorkforceLoginDashboardAndFilters(page);
  });

  test('WFP002 - Clock In/Out Complete Flow', async ({ page }) => {
    await verifyClockInOutFlow(page);
  });

  test('WFP003 - Break Entry Complete Flow', async ({ page }) => {
    await verifyBreakEntryCompleteFlow(page);
  });

  test('WFP004 - STE Complete Flow', async ({ page }) => {
    await verifySteCompleteFlow(page);
  });

  test('WFP005 - WTE Complete Flow', async ({ page }) => {
    await verifyWteCompleteFlow(page);
  });

  // test("WF006 - Mileage tracking complete flow", async ({page}) => {
  //     await verifyMileageTrackingCompleteFlow(page);
  // });
});
