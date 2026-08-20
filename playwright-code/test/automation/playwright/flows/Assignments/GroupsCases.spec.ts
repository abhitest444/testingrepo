import { test } from '@playwright/test';
import { getTestAccount } from '../../config/accounts';
import { openQBOTS } from '../../pages/QBOLogin';
import {
  validateWorkersTabInAssignments,
  assignWorkersAndLeadsFromDetailsPage,
  cleanupAllGroups,
  validateSearchInWorkersAndGroups,
  validatePaginationForWorkers,
  validatePaginationForGroups,
  viewSettingForWorkersInWorkerTab,
  groupsInWhosWorkingMap,
  assignUnassignWorkersTest,
  cleanupViewSettingsTestData,
  groupsInPayrollCoreCompany,
} from '../Util/Assignments.util';

test.describe('Assignments - Groups Cases', () => {
  test.beforeEach(async ({ page }) => {
    const testInfo = test.info();
    const testId = testInfo.title.split(' - ')[0];
    const credentials = getTestAccount(testId);
    await openQBOTS(page, credentials);
    if (testId == 'ASG04' || testId == 'ASG09' || testId == 'ASG10') {
      try {
        console.log('Starting cleanup');
        await cleanupAllGroups(page);
      } catch (error) {
        console.log('Cleanup failed, but continuing:', error);
      }
    }

    if (testId == 'ASG12') {
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
    if (testId == 'ASG04' || testId == 'ASG09' || testId == 'ASG10') {
      try {
        console.log('Starting cleanup');
        await cleanupAllGroups(page);
      } catch (error) {
        console.log('Cleanup failed, but continuing:', error);
      }
    }
    // Cleanup for viewSettingForWorkers tests
    if (testId == 'ASG12') {
      try {
        console.log('Starting View Settings cleanup');
        await cleanupViewSettingsTestData(page);
      } catch (error) {
        console.log('View Settings cleanup failed, but continuing:', error);
      }
    }
  });

  test('ASG01 - Validate Workers Tab in Assignments', async ({ page }) => {
    await validateWorkersTabInAssignments(page);
    console.log('✓ ASG01 - Workers Tab elements validation completed');
  });

  //ASG05 is covered in this test
  test('ASG04 - Assign workers/leads from groups details page', async ({
    page,
  }) => {
    await assignWorkersAndLeadsFromDetailsPage(page);
    console.log(
      '✓ ASG04 - Workers/leads assignment from groups details page completed',
    );
  });

  //ASG11, ASG12, ASG21, ASG22 are covered in this test
  test('ASG06 - Validate Search functionality in workers/groups tab', async ({
    page,
  }) => {
    await validateSearchInWorkersAndGroups(page);
    console.log('✓ ASG06 - Group Search validation completed');
  });

  test('ASG07 - Validate Pagination for workers', async ({ page }) => {
    await validatePaginationForWorkers(page);
    console.log('✓ ASG07 - Pagination for workers validation completed');
  });

  test('ASG08 - Validate Pagination for groups', async ({ page }) => {
    await validatePaginationForGroups(page);
    console.log('✓ ASG08 - Pagination for groups validation completed');
  });

  //ASG23 is covered in this test
  test('ASG09 - AssignUnassignWorkers', async ({ page }) => {
    await assignUnassignWorkersTest(page);
    console.log('✓ ASG09 - AssignUnassignWorkers test completed');
  });

  test('ASG10 - groupsInWhosWorkingMap', async ({ page }) => {
    await groupsInWhosWorkingMap(page);
    console.log('✓ ASG10 - groupsInWhosWorkingMap test completed');
  });

  test('ASG12 - viewSettingForWorkersInWorkerTab', async ({ page }) => {
    await viewSettingForWorkersInWorkerTab(page);
    console.log('✓ ASG12 - viewSettingForWorkersInWorkerTab test completed');
  });

  test('ASG14 - groupInPayrollCoreCompany', async ({ page }) => {
    await groupsInPayrollCoreCompany(page);
    console.log('✓ ASG14 - groupInPayrollCoreCompany test completed');
  });
});
