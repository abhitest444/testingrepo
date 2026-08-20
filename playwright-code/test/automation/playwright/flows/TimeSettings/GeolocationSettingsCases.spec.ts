import { test } from '@playwright/test';
import { getTestAccount } from '../../config/accounts';
import { openQBOTS } from '../../pages/QBOLogin';
import {
  validateGeoLocationElementsFromQBOTimeSettings,
  validateOptionalLocationDualSyncFromQBOSettings,
  navigatetoLocationTrackingPage,
  validateOptionalLocationDualSyncFromClassicTimesheet,
  validateNeverLocationDualSyncFromQBO,
  validateRequireLocationDualSyncFromQBO,
  validateRequireLocationDualSyncFromClassicTimesheet,
  validateNeverLocationDualSyncFromClassicTimesheet,
  cleanupLocationTrackingOption,
  validateLocationTrackingSettingsForQBOFreeCompany,
} from '../Util/TimeSettings.Util';

test.describe('Geolocation Settings Cases', () => {
  test.beforeEach(async ({ page }) => {
    // Get current test info
    const testInfo = test.info();
    // Login using test-specific credentials
    const testId = testInfo.title.split(' - ')[0];
    const credentials = getTestAccount(testId);
    await openQBOTS(page, credentials);
  });

  test.afterEach(async ({ page }) => {
    // Get current test info
    const testInfo = test.info();
    const testId = testInfo.title.split(' - ')[0];

    // Cleanup location tracking Set to a different option than what was tested
    const cleanupMap: { [key: string]: 'Optional' | 'Never' | 'Require' } = {
      GL002: 'Never', // Tested Optional -> Cleanup to Never
      GL003: 'Optional', // Tested Never -> Cleanup to Optional
      GL004: 'Never', // Tested Require -> Cleanup to Never
      GL005: 'Never', // Tested Require -> Cleanup to Never
      GL006: 'Optional', // Tested Never -> Cleanup to Optional
      GL007: 'Never', // Tested Optional -> Cleanup to Never
    };

    if (cleanupMap[testId]) {
      try {
        console.log(`Running cleanup for ${testId}`);
        await cleanupLocationTrackingOption(page, cleanupMap[testId]);
      } catch (error) {
        // Log cleanup error but don't fail the test
        console.error(`Cleanup failed for ${testId}:`, error);
      }
    }
  });

  //Geolocation Elements, New badge, Cancel button, Close button, Save button disabled, dont save popup tests are covered in this test
  test('GL001 - Validate Geo Location settings', async ({ page }) => {
    await validateGeoLocationElementsFromQBOTimeSettings(page);
    console.log('Geo Location elements verified successfully');
  });

  test('GL002 - Validate Optional Location Tracking Dual Sync from QBO', async ({
    page,
  }) => {
    await navigatetoLocationTrackingPage(page);
    await validateOptionalLocationDualSyncFromQBOSettings(page);
    console.log('Optional Location Tracking verified successfully');
  });

  test('GL003 - Validate Never Location Tracking Dual Sync from QBO', async ({
    page,
  }) => {
    await navigatetoLocationTrackingPage(page);
    await validateNeverLocationDualSyncFromQBO(page);
    console.log('Never Location Tracking verified successfully');
  });

  test('GL004 - Validate Require Location Tracking Dual Sync from QBO', async ({
    page,
  }) => {
    await navigatetoLocationTrackingPage(page);
    await validateRequireLocationDualSyncFromQBO(page);
    console.log('Require Location Tracking verified successfully');
  });

  test('GL005 - Validate Require Location Tracking Dual Sync from classic timesheet', async ({
    page,
  }) => {
    await validateRequireLocationDualSyncFromClassicTimesheet(page);
    console.log(
      'Require Location Tracking verified successfully from classic timesheet',
    );
  });

  test('GL006 - Validate Never Location Tracking Dual Sync from classic timesheet', async ({
    page,
  }) => {
    await validateNeverLocationDualSyncFromClassicTimesheet(page);
    console.log(
      'Never Location Tracking verified successfully from classic timesheet',
    );
  });

  test('GL007 - Validate Optional Location Tracking Dual Sync from classic timesheet', async ({
    page,
  }) => {
    await validateOptionalLocationDualSyncFromClassicTimesheet(page);
    console.log(
      'Optional Location Tracking verified successfully from classic timesheet',
    );
  });

  test('GL008 - Validate Location Tracking Settings for QBO Free Company', async ({
    page,
  }) => {
    await validateLocationTrackingSettingsForQBOFreeCompany(page);
    console.log('Location Tracking verified successfully for qbo free company');
  });
});
