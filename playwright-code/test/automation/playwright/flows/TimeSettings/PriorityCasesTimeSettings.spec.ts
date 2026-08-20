import { test } from '@playwright/test';
import { getTestAccount } from '../../config/accounts';
import { openQBOTS } from '../../pages/QBOLogin';
import {
  validateNavigationToTimeSettingsTimeTracking,
  validateEditModeTimeTracking,
  validateNavigationToTimeSettingsNotif,
  verifyNotifDualSyncPriorityCaseClassicSaved,
  validateNotifEditMode,
  verifyDualSyncPriorityCase,
  verifyDualSyncCustomizeTimesheetSettingsFromQBOSaved,
  verifyDualSyncCustomizeTimesheetSettingsFromClassicTimesheetSaved,
  validateTimeSignatureAndTeamMemberPermissionsSettings,
} from '../Util/TimeSettings.Util';

test.describe('Time Settings Priority Cases', () => {
  test.beforeEach(async ({ page }) => {
    // Get current test info
    const testInfo = test.info();
    // Login using test-specific credentials
    const testId = testInfo.title.split(' - ')[0];
    const credentials = getTestAccount(testId);
    await openQBOTS(page, credentials);
  });

  test('TSP001 - Verify if Admin lands on to "Time Tacking" section and verifies the edit mode', async ({
    page,
  }) => {
    await validateNavigationToTimeSettingsTimeTracking(page);
    await validateEditModeTimeTracking(page);
  });

  test('TSP002 - Verify if Admin lands on Notifications sections and verifies the edit mode', async ({
    page,
  }) => {
    await validateNavigationToTimeSettingsNotif(page);
    await validateNotifEditMode(page);
  });

  test('TSP003 - Validate split timesheet setting for Time Tracking saved from QBO', async ({
    page,
  }) => {
    await verifyDualSyncPriorityCase(page);
  });

  test('TSP004 - Validate Clock In/Out reminder settings for Notifications saved from classic timesheet', async ({
    page,
  }) => {
    await verifyNotifDualSyncPriorityCaseClassicSaved(page);
  });
  test('TSP005 - Validate the dual sync settings for customize timesheet saved from QBO', async ({
    page,
  }) => {
    await verifyDualSyncCustomizeTimesheetSettingsFromQBOSaved(page);
  });

  test('TSP006 - Validate the dual sync settings for customize timesheet saved from classic timesheet', async ({
    page,
  }) => {
    await verifyDualSyncCustomizeTimesheetSettingsFromClassicTimesheetSaved(
      page,
    );
  });

  test('TS030 - Validate Time signature and team member permissions settings', async ({
    page,
  }) => {
    await validateTimeSignatureAndTeamMemberPermissionsSettings(page);
  });
});
