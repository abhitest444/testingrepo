import { test } from '@playwright/test';
import { getTestAccount } from '../../config/accounts';
import { openQBOTS } from '../../pages/QBOLogin';
import {
  verifyTimeProjectZeroStateElements,
  verifyCreateProjectAndVerifyInTimeProject,
  verifyCreateEstimateByHoursAndEdit,
  verifyCreateEstimateByServiceItemAndEdit,
  verifyAssignWorkersForProject,
  cleanupEditAndDeleteEstimate,
  cleanupDeleteProject,
  cleanupDeleteEstimate,
} from '../Util/TimeProject.util';

test.describe('Time Project Priority Cases', () => {
  // Variables to track created resources for cleanup
  let createdProjectNamePPR02: string | null = null;
  let createdEstimateProjectPPR03: string | null = null;
  let createdEstimateProjectPPR04: string | null = null;
  let createdProjectNamePPR05: string | null = null;

  test.beforeEach(async ({ page }) => {
    const testInfo = test.info();
    const testId = testInfo.title.split(' - ')[0];
    const credentials = getTestAccount(testId);
    await openQBOTS(page, credentials);
  });

  test.afterEach(async ({ page }) => {
    const testInfo = test.info();
    const testId = testInfo.title.split(' - ')[0];
    if (
      (testId == 'PPR02' && createdProjectNamePPR02) ||
      (testId == 'PPR03' && createdEstimateProjectPPR03) ||
      (testId == 'PPR04' && createdEstimateProjectPPR04) ||
      (testId == 'PPR05' && createdProjectNamePPR05)
    ) {
      try {
        console.log('Starting post-test cleanup...');
        if (testId == 'PPR02' && createdProjectNamePPR02) {
          await cleanupDeleteProject(page, createdProjectNamePPR02);
          createdProjectNamePPR02 = null;
        }
        if (testId == 'PPR03' && createdEstimateProjectPPR03) {
          await cleanupEditAndDeleteEstimate(page, createdEstimateProjectPPR03);
          createdEstimateProjectPPR03 = null;
        }
        if (testId == 'PPR04' && createdEstimateProjectPPR04) {
          await cleanupDeleteEstimate(page, createdEstimateProjectPPR04);
          createdEstimateProjectPPR04 = null;
        }
        if (testId == 'PPR05' && createdProjectNamePPR05) {
          await cleanupDeleteProject(page, createdProjectNamePPR05);
          createdProjectNamePPR05 = null;
        }
        console.log('Post-test cleanup completed successfully');
      } catch (error) {
        console.log('Post-test cleanup failed:', error);
      }
    }
  });

  test('PPR01 - Verify Time project screen elements (navigate, verify columns, verify zero state, verify manage projects navigation)', async ({
    page,
  }) => {
    await verifyTimeProjectZeroStateElements(page);
  });

  test('PPR02 - Create Project and verify in Time project (Click Manage Projects, create a project in QBO projects and verify created project is reflected in Time project)', async ({
    page,
  }) => {
    createdProjectNamePPR02 = await verifyCreateProjectAndVerifyInTimeProject(
      page,
    );
  });

  test('PPR03 - Create Estimate by Hour In project - create, edit estimate and verify in view section (estimate by hours is the total hours estimated versus actual)', async ({
    page,
  }) => {
    createdEstimateProjectPPR03 = await verifyCreateEstimateByHoursAndEdit(
      page,
    );
  });

  test('PPR04 - Create Estimate by Service item in project - create, edit estimate and verify in view section', async ({
    page,
  }) => {
    createdEstimateProjectPPR04 =
      await verifyCreateEstimateByServiceItemAndEdit(page);
  });

  test('PPR05 - Assign workers for project (create project, navigate to Time project, assign workers, verify count in view project)', async ({
    page,
  }) => {
    createdProjectNamePPR05 = await verifyAssignWorkersForProject(page);
  });
});
