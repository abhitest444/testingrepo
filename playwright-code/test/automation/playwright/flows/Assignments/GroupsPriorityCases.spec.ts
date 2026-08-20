import { test } from '@playwright/test';
import { getTestAccount } from '../../config/accounts';
import { openQBOTS } from '../../pages/QBOLogin';
import {
  validateGroupsTabInAssignments,
  createGroupAndValidateGroupDetails,
  cleanupAllGroups,
  groupsCrudOperations,
  viewSettingForWorkersInGroupsTab,
  groupsDualSyncFromQL,
  cleanupViewSettingsTestData,
} from '../Util/Assignments.util';

test.describe('Assignments - Groups Cases', () => {
  test.beforeEach(async ({ page }) => {
    const testInfo = test.info();
    const testId = testInfo.title.split(' - ')[0];
    const credentials = getTestAccount(testId);
    await openQBOTS(page, credentials);
    if (testId == 'GP002' || testId == 'GP003' || testId == 'GP004') {
      try {
        console.log('Starting cleanup');
        await cleanupAllGroups(page);
      } catch (error) {
        console.log('Cleanup failed, but continuing:', error);
      }
    }

    if (testId == 'GP005') {
      try {
        console.log('Starting View Settings cleanup');
        await cleanupViewSettingsTestData(page);
        console.log('View Settings cleanup completed');
      } catch (error) {
        console.log('View Settings cleanup failed', error);
      }
    }
  });

  test.afterEach(async ({ page }) => {
    const testInfo = test.info();
    const testId = testInfo.title.split(' - ')[0];
    if (testId == 'GP002' || testId == 'GP003' || testId == 'GP004') {
      try {
        console.log('Starting cleanup');
        await cleanupAllGroups(page);
      } catch (error) {
        console.log('Cleanup failed, but continuing:', error);
      }
    }
    // Cleanup for viewSettingForWorkers tests
    if (testId == 'GP005') {
      try {
        console.log('Starting View Settings cleanup');
        await cleanupViewSettingsTestData(page);
      } catch (error) {
        console.log('View Settings cleanup failed, but continuing:', error);
      }
    }
  });

  test('GP001 - Validate Groups Tab in Assignments', async ({ page }) => {
    await validateGroupsTabInAssignments(page);
    console.log('✓ GP001 - Groups Tab elements validation completed');
  });

  //ASG03, ASG04, ASG17, ASG18 are covered in this test
  test('GP002 - Create group and validate group details', async ({ page }) => {
    await createGroupAndValidateGroupDetails(page);
    console.log('✓ GP002 - Create group and validate group details completed');
  });

  //ASG06 to ASG10 are covered in this test
  test('GP003 - CRUD cases for groups', async ({ page }) => {
    await groupsCrudOperations(page);
    console.log('✓ GP003 - Groups CRUD operations completed');
  });

  test('GP004 - groupsDualSyncFromQL', async ({ page }) => {
    await groupsDualSyncFromQL(page);
    console.log('✓ GP004 - groupsDualSyncFromQL test completed');
  });

  test('GP005 - viewSettingForWorkersInGroupsTab', async ({ page }) => {
    await viewSettingForWorkersInGroupsTab(page);
    console.log('✓ GP005 - viewSettingForWorkersInGroupsTab test completed');
  });
});
