import { test } from '@playwright/test';
import { getTestAccount } from '../../config/accounts';
import { openQBOTS } from '../../pages/QBOLogin';
import {
  verifyTimesheetDetailByEmployeeActivityDateSort,
  verifyTimeSummaryByPaytypeActivityDateSort,
} from '../Util/TimeReports.util';

test.describe('Time Reports Cases', () => {
  test.beforeEach(async ({ page }) => {
    const testInfo = test.info();
    const testId = testInfo.title.split(' - ')[0];
    const credentials = getTestAccount(testId);
    await openQBOTS(page, credentials);
  });

  test('TR006 - Verify Day column sorting in Timesheet detail by employee', async ({
    page,
  }) => {
    await verifyTimesheetDetailByEmployeeActivityDateSort(page);
  });

  test('TR007 - Verify sorting in Time Summary by paytype', async ({
    page,
  }) => {
    await verifyTimeSummaryByPaytypeActivityDateSort(page);
  });
});
