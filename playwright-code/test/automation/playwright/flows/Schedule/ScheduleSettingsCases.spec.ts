import { test } from '@playwright/test';
import { getTestAccount } from '../../config/accounts';
import { openQBOTS } from '../../pages/QBOLogin';
import {
  validateEmployeeWorkerScheduleSettings,
  validateAdminAndGroupLeadWorkerScheduleSettings,
} from '../Util/ScheduleFlows.Util';
import {
  verifySchedulePreferencesViewMode,
  verifyScheduleNotificationSettings,
  verifyViewRadiosDisabledByManage,
  editAndVerifySchedulePreferences,
  editAndVerifyScheduleNotifications,
} from '../Util/Schedule.Utils';

test.describe('Schedule Settings', () => {
  test.use({ actionTimeout: 15000 });

  test.beforeEach(async ({ page }) => {
    const testInfo = test.info();
    const testId = testInfo.title.split(' - ')[0];
    const credentials = getTestAccount(testId);
    await openQBOTS(page, credentials);
    console.log('Logged in with credentials:', credentials.username);
  });

  test('ST01 - Schedule Preferences card (view mode)', async ({ page }) => {
    await verifySchedulePreferencesViewMode(page);
  });

  test('ST02 - Schedule notification settings', async ({ page }) => {
    await verifyScheduleNotificationSettings(page);
  });

  test('ST05 - Edit Schedule Preferences: cancel, save & verify', async ({
    page,
  }) => {
    await editAndVerifySchedulePreferences(page);
  });

  test('ST06 - View radios disabled by Manage selection', async ({ page }) => {
    await verifyViewRadiosDisabledByManage(page);
  });

  test('ST07 - Edit Schedule notifications: cancel, save & verify', async ({
    page,
  }) => {
    await editAndVerifyScheduleNotifications(page);
  });

  // ST08 and ST13 are covered
  test('ST13 - Validate notification schedule settings for a worker in assignments', async ({
    page,
  }) => {
    await validateEmployeeWorkerScheduleSettings(page, 'Test Emp3');
  });

  // ST14 and ST15 are covered
  test('ST14 - Validate notification schedule settings for admin and group-lead workers in assignments', async ({
    page,
  }) => {
    await validateAdminAndGroupLeadWorkerScheduleSettings(page);
  });
});
