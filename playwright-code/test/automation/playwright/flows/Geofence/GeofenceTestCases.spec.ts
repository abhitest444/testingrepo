import { test } from '@playwright/test';
import { getTestAccount } from '../../config/accounts';
import { openQBOTS } from '../../pages/QBOLogin';
import {
  verifyGeolocationSectionVisible,
  verifyGeofenceDefaultValueOff,
  verifyGeofenceCheckboxNotSelectedByDefault,
  verifySetupGeofenceNotificationsAfterCheckbox,
  verifyGeofenceNotificationsSettingsSync,
  validateGeofenceDualSyncFromQBO,
  validateGeofenceDualSyncFromTSheets,
  validateInvalidAddressError,
  validateGeofenceRadiusAndMap,
  validateCancelInCustomersGeofenceDrawer,
  verifyGeofenceNotVisibleInNotificationsWhenOff,
  verifyGeofenceUncheckedAfterDontSave,
  verifyTypeStartTimeInGeofenceNotifications,
  verifyTypeEndTimeInGeofenceNotifications,
  verifyTimeAcceptsOnly12HourFormat,
  verifyOriginalValuesRetainAfterCancel,
  verifyOnlyTimeDisplayedWithoutDays,
  validateGeofenceLocationTrackingDisplayMessage,
} from '../Util/Geofence.util';
import {
  validateRadiusSizeEnabledWhenGeofenceOn,
  validateMapNotDisplayedWithoutAddress,
  validateGeofenceToggleRetainsOnAddressChange,
  validateRadiusSizeRetainsOnAddressChangeAndBack,
  validateGeofenceNotDisplayedWhenDisabled,
  validateGeofenceNotDisplayedForNonElite,
  validateAssignmentPageWithoutGeofenceColumns,
  validateAssignmentPageWithGeofenceColumns,
  validateAssignGeofenceDrawerAddressRadiusThenRevertRetainsRadius,
  validateGeofenceDrawerAddressSyncsToEditCustomer,
  cleanupGeofenceSettings,
} from '../Util/Geofencing.util';

test.describe('Geofencing', () => {
  test.beforeEach(async ({ page }) => {
    const testInfo = test.info();
    const testId = testInfo.title.split(' - ')[0];
    const credentials = getTestAccount(testId);
    await openQBOTS(page, credentials);
  });

  test.afterEach(async ({ page }) => {
    const testInfo = test.info();
    const testId = testInfo.title.split(' - ')[0];

    const cleanupMap: { [key: string]: boolean } = {
      GF013: true,
      GF014: true,
      GF015: true,
      GF016: true,
      GF017: true,
      // GF018: non-elite — no Geolocation in Settings → Time; skip cleanup (was calling disable and hanging).
      GF019: true,
      GF020: true,
      GF021: true,
      GF022: true,
    };

    if (cleanupMap[testId] !== undefined) {
      try {
        console.log(`Running cleanup for ${testId}`);
        await cleanupGeofenceSettings(page, cleanupMap[testId]);
      } catch (error) {
        console.error(`Cleanup failed for ${testId}:`, error);
      }
    }
  });

  test('GF001 - Verify Geolocation section is visible in settings', async ({
    page,
  }) => {
    await verifyGeolocationSectionVisible(page);
  });

  test('GF002 - Verify Geofence value is displayed as OFF by default', async ({
    page,
  }) => {
    await verifyGeofenceDefaultValueOff(page);
  });

  test('GF003 - Verify Geofence checkbox is not selected by default in settings', async ({
    page,
  }) => {
    await verifyGeofenceCheckboxNotSelectedByDefault(page);
  });

  test('GF004 - Verify set up geofence notifications is displayed after selecting the checkbox for geofence', async ({
    page,
  }) => {
    await verifySetupGeofenceNotificationsAfterCheckbox(page);
  });

  test('GF005 - Verify that the updated notifications settings for geofence is displayed in the Notifications section', async ({
    page,
  }) => {
    await verifyGeofenceNotificationsSettingsSync(page);
  });

  //GF006 and GF021 is covered in this test
  test('GF006 - Validate geofence dual sync from QBO', async ({ page }) => {
    await validateGeofenceDualSyncFromQBO(page);
  });

  //GF007 and GF022 is covered in this test
  test('GF007 - Validate geofence dual sync from TSheets', async ({ page }) => {
    await validateGeofenceDualSyncFromTSheets(page);
  });

  // GF008, GF009 and GF023 is covered in this test
  test('GF008 - Validate invalid address error for customer', async ({
    page,
  }) => {
    await validateInvalidAddressError(page);
  });

  // GF009 - GF012 are covered in this test
  test('GF009 - Validate Geofence toggle on/off visibility', async ({
    page,
  }) => {
    await validateGeofenceRadiusAndMap(page);
  });

  // GF024 and GF025 are covered in this test
  test('GF024 - Geofence drawer: Cancel, Close, unsaved address', async ({
    page,
  }) => {
    await validateCancelInCustomersGeofenceDrawer(page);
  });

  // GF026 and GF027 are covered in this test
  test('GF026 - validate display message for different location tracking in Geofence', async ({
    page,
  }) => {
    await validateGeofenceLocationTrackingDisplayMessage(page);
  });

  test('GF028 - Verify geofence is not displayed in Notifications section when geofence is turned off', async ({
    page,
  }) => {
    await verifyGeofenceNotVisibleInNotificationsWhenOff(page);
  });

  test('GF029 - Verify Turn on geofence checkbox is not checked after clicking Dont Save', async ({
    page,
  }) => {
    await verifyGeofenceUncheckedAfterDontSave(page);
  });

  test('GF030 - Verify user can type and enter specific hours in Start time dropdown', async ({
    page,
  }) => {
    await verifyTypeStartTimeInGeofenceNotifications(page);
  });

  test('GF031 - Verify user can type and enter specific hours in End time dropdown', async ({
    page,
  }) => {
    await verifyTypeEndTimeInGeofenceNotifications(page);
  });

  test('GF032 - Verify Start time and End time accept only 12 hours format', async ({
    page,
  }) => {
    await verifyTimeAcceptsOnly12HourFormat(page);
  });

  test('GF033 - Verify original values retain after clicking Cancel in Notifications edit section', async ({
    page,
  }) => {
    await verifyOriginalValuesRetainAfterCancel(page);
  });

  test('GF034 - Verify only Start time and End time displayed when no Days of week selected', async ({
    page,
  }) => {
    await verifyOnlyTimeDisplayedWithoutDays(page);
  });

  test('GF013 - Validate geofencing radius size is enabled for customer with valid address when geofence toggle is on', async ({
    page,
  }) => {
    await validateRadiusSizeEnabledWhenGeofenceOn(page);
    console.log('GF013: Radius size enabled verification completed');
  });

  test('GF014 - With geofence on, customer without address shows Address is required', async ({
    page,
  }) => {
    await validateMapNotDisplayedWithoutAddress(page);
    console.log('GF014: Address required verification completed');
  });

  test.fixme(
    'GF015 - Assign geofence address field shows updated billing address',
    async ({ page }) => {
      await validateGeofenceToggleRetainsOnAddressChange(page);
      console.log(
        'GF015: Assign geofence address field verification completed',
      );
    },
  );

  test.fixme(
    'GF016 - Validate radius size retains when address changed and changed back',
    async ({ page }) => {
      await validateRadiusSizeRetainsOnAddressChangeAndBack(page);
      console.log('GF016: Radius size retention verification completed');
    },
  );

  test('GF017 - Verify geofence feature not displayed when geofence disabled in company settings', async ({
    page,
  }) => {
    await validateGeofenceNotDisplayedWhenDisabled(page);
    console.log('GF017: Geofence not displayed verification completed');
  });

  test('GF018 - Non-elite: no Time in app menu; Settings → Time has no Geolocation/Geofence', async ({
    page,
  }) => {
    await validateGeofenceNotDisplayedForNonElite(page);
    console.log('GF018: Non-elite company verification completed');
  });

  test('GF019 - Validate assignment page does not display Geofence columns when geofence disabled', async ({
    page,
  }) => {
    await validateAssignmentPageWithoutGeofenceColumns(page);
    console.log(
      'GF019: Assignment page columns (disabled) verification completed',
    );
  });

  test('GF020 - Validate assignment page displays Geofence columns when geofence enabled', async ({
    page,
  }) => {
    await validateAssignmentPageWithGeofenceColumns(page);
    console.log(
      'GF020: Assignment page columns (enabled) verification completed',
    );
  });

  test('GF021 - Assign geofence drawer: change address and radius, revert address restores prior radius', async ({
    page,
  }) => {
    await validateAssignGeofenceDrawerAddressRadiusThenRevertRetainsRadius(
      page,
    );
    console.log(
      'GF021: Assign drawer address/radius revert verification completed',
    );
  });

  test.fixme(
    'GF022 - Assign geofence drawer address update syncs to Edit customer billing',
    async ({ page }) => {
      await validateGeofenceDrawerAddressSyncsToEditCustomer(page);
      console.log(
        'GF022: Geofence-to-customer billing sync verification completed',
      );
    },
  );
});
