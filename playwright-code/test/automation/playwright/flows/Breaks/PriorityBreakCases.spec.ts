import { test } from '@playwright/test';
import {
  navigateToBreakPreferencesScreen,
  validateManageBreaksUIElements,
  validateAddBreakOptionVisibility,
  validateAddBreakDrawerOpens,
  addAutomaticBreakRuleAndDeleteIt,
  addManualBreakRuleAndDeleteIt,
  addManualBreakWithStartEndTime,
  addManualBreakWithDuration,
  validateBreakSectionPresent,
  validateCloseAndXButton,
  validateNoSetDurationCheckBox,
  validateNoSetDurationBoxChecked,
} from '../Util/Breaks.Util';
import { getTestAccount } from '../../config/accounts';
import { openQBOTS } from '../../pages/QBOLogin';
import { cleanupAllTimeEntries } from '../Util/TimeEntries.util';

test.describe('Break Rules Management & Assignment', () => {
  test.beforeEach(async ({ page }) => {
    // Get current test info
    const testInfo = test.info();
    // Login using test-specific credentials
    const testId = testInfo.title.split(' - ')[0];
    const credentials = getTestAccount(testId);
    await openQBOTS(page, credentials);
  });

  test('BRP001 - Priority Case - Break Rule - Validate Break Rules and Manage Break Sections', async ({
    page,
  }) => {
    await navigateToBreakPreferencesScreen(page);
    await validateBreakSectionPresent(page);
    await validateManageBreaksUIElements(page);
  });

  test('BRP002 - Priority Case - Break Rule - Add Automatic and Manual Break Rules, Validate and then delete it', async ({
    page,
  }) => {
    await addAutomaticBreakRuleAndDeleteIt(page);
    await addManualBreakRuleAndDeleteIt(page);
    await cleanupAllTimeEntries(page);
  });

  test('BRP003 - Priority Case - Break Entry - Access and visibility', async ({
    page,
  }) => {
    await validateAddBreakOptionVisibility(page);
    await validateAddBreakDrawerOpens(page);
  });

  test('BRP004 - Priority Case - Break Entry - Add Manual Break with Duration and Start and End time', async ({
    page,
  }) => {
    await addManualBreakWithStartEndTime(page);
    await addManualBreakWithDuration(page);
  });
});
