import { test } from '@playwright/test';
import { getTestAccount } from '../../config/accounts';
import { openQBOTS } from '../../pages/QBOLogin';
import {
  validateAutoCalculateInMileageTracking,
  validateMileageTrackingInQBO,
  cleanupAllTimeEntries,
  validateMileageEntriesInCustomerView,
  cleanupAllTimeEntriesForMileageTracking,
  validateMileageTrackingForPremiumCompanies,
  validateDataPersistenceWhenCheckingMileageOnOrOff,
} from '../Util/TimeEntries.util';
import {
  verifyMileageSettingsDualSyncFromQL,
  verifyMileageSettingsDualSyncFromTsheets,
  validateMileageColumnVisibilityInQL,
  crudWithMileageFromQL,
  crudWithMileageFromTsheets,
  preCleanupProcess,
  deleteAllTimeEntries,
  verifyMileageInPrintView,
} from '../Util/Mileage.util';

test.describe('Mileage Cases Test Cases', () => {
  test.beforeEach(async ({ page }: { page: any }) => {
    // Get current test info
    const testInfo = test.info();
    // Login using test-specific credentials
    const testId = testInfo.title.split(' - ')[0];
    const credentials = getTestAccount(testId);
    await openQBOTS(page, credentials);

    // Pre-test cleanup: Delete old entries to ensure clean state
    console.log('Starting pre-test cleanup...');

    try {
      if (testId === 'ML003' || testId === 'ML004') {
        await preCleanupProcess(page);
        console.log(`  ✓ Cleaned up time entries for ${testId}`);
      } else if (
        testId === 'ML005' ||
        testId === 'ML006' ||
        testId === 'ML007' ||
        testId === 'ML012'
      ) {
        await deleteAllTimeEntries(page);
        console.log(`  ✓ Cleaned up time entries for ${testId}`);
      } else if (
        testId === 'ML008' ||
        testId === 'ML009' ||
        testId === 'ML011'
      ) {
        await cleanupAllTimeEntriesForMileageTracking(page);
        console.log(`  ✓ Cleaned up time entries for ${testId}`);
      }
    } catch (cleanupError) {
      console.log(
        '  ℹ No old entries found or cleanup not needed:',
        cleanupError,
      );
    }

    console.log('Pre-test cleanup completed');
  });

  //Both ML001 and ML002 are covered in the same test case
  test('ML001 - Verify Enable/Disable Mileage Tracking from Geo Location Settings', async ({
    page,
  }) => {
    await validateMileageTrackingInQBO(page);
  });

  test('ML003 - Verify Mileage Tracking with Required Location and Uninstall in TSheets', async ({
    page,
  }) => {
    await verifyMileageSettingsDualSyncFromQL(page);
  });

  test('ML004 - Verify Mileage Settings Dual sync from Tsheets', async ({
    page,
  }) => {
    await verifyMileageSettingsDualSyncFromTsheets(page);
  });

  test('ML005 - Validate Mileage column visibility in QL', async ({ page }) => {
    await validateMileageColumnVisibilityInQL(page);
  });

  test('ML006 - CRUD with mileage from QL', async ({ page }) => {
    await crudWithMileageFromQL(page);
  });

  test('ML007 - CRUD with mileage from Tsheets', async ({ page }) => {
    await crudWithMileageFromTsheets(page);
  });

  test('ML008 - Validate Auto Calulate in Mileage Tracking', async ({
    page,
  }) => {
    await validateAutoCalculateInMileageTracking(page);
    console.log(
      '✓ ML008 - Validate Auto Calulate in Mileage Tracking completed',
    );
  });

  test('ML009 - Validate Mileage entries in Customer view', async ({
    page,
  }) => {
    await validateMileageEntriesInCustomerView(page, '100', '07:00');
    console.log(
      '✓ ML009 - Mileage entries in Customer view validation completed',
    );
  });

  test('ML010 - Validate Mileage tracking for premium companies', async ({
    page,
  }) => {
    await validateMileageTrackingForPremiumCompanies(page);
    console.log(
      '✓ ML010 - Validate Mileage tracking for premium companies completed',
    );
  });

  test('ML011 - Validate Data persistence when checking mileage on or off', async ({
    page,
  }) => {
    await validateDataPersistenceWhenCheckingMileageOnOrOff(page);
    console.log(
      '✓ ML011 - Validate Data persistence when checking mileage on or off completed',
    );
  });

  test('ML012 - Verify mileage in print view from Approvals', async ({
    page,
  }) => {
    await verifyMileageInPrintView(page);
    console.log(
      '✓ ML012 - Verify mileage in print view from Approvals completed',
    );
  });
});
