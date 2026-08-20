import { test } from '@playwright/test';
import {
  validateMandatoryFieldsBreakEntry,
  validateApproveUnapproveBreaks,
  validateEndTimeEarlierThanStartTime,
  validateOverlappingBreakEntries,
  validateAddBreakDrawerOpens,
  validateAddBreakOptionVisibility,
  addManualBreakWithDuration,
  addManualBreakWithStartEndTime,
  cleanupApprovedAndAllTimeEntries,
} from '../Util/Breaks.Util';
import { getTestAccount } from '../../config/accounts';
import { openQBOTS } from '../../pages/QBOLogin';

test.describe('Break Rules Management & Assignment', () => {
  test.beforeEach(async ({ page }) => {
    // Get current test info
    const testInfo = test.info();
    // Login using test-specific credentials
    const testId = testInfo.title.split(' - ')[0];
    const credentials = getTestAccount(testId);
    await openQBOTS(page, credentials);
  });

  test('BRE006 - Validate mandatory field when adding and editing breaks', async ({
    page,
  }) => {
    // Covers BRE006 and BRE007
    await validateMandatoryFieldsBreakEntry(page);
  });

  test('BRE010 - Validate approve and unapprove breaks functionality', async ({
    page,
  }) => {
    // Covers BRE010, BRE011, BRE019, BRE020
    await cleanupApprovedAndAllTimeEntries(page);
    await validateApproveUnapproveBreaks(page);
  });

  test('BRE016 - Validate end time earlier than start time validation', async ({
    page,
  }) => {
    // Covers BRE016 and BRE017
    await validateEndTimeEarlierThanStartTime(page);
  });

  test('BRE021 - Validate overlapping break entries (ADD and EDIT)', async ({
    page,
  }) => {
    // Covers BRE021 and BRE022
    await cleanupApprovedAndAllTimeEntries(page);
    await validateOverlappingBreakEntries(page);
  });

  test('BRE030 - Break Entry - Access and visibility', async ({ page }) => {
    await validateAddBreakOptionVisibility(page);
    await validateAddBreakDrawerOpens(page);
  });

  test('BRE031 - Break Entry - Add Manual Break with Duration and Start and End time', async ({
    page,
  }) => {
    await addManualBreakWithStartEndTime(page);
    await addManualBreakWithDuration(page);
  });
});
