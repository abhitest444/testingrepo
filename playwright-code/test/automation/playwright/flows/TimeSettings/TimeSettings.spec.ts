import { test } from '@playwright/test';
import { getTestAccount } from '../../config/accounts';
import { openQBOTS } from '../../pages/QBOLogin';
import {
  validateNavigationToTimeSettingsTimeTracking,
  validateEditModeTimeTracking,
  validateFirstDayofWorkWeek,
  validateTimeFormat,
  verifyCheckedUncheckedSplitTimeSheetFromSTE,
  validateTimeZone,
  verifyCheckedSplitTimeSheetFromTimeClock,
  verifyIfEmpCanCreateTSFromSTA,
  verifyCheckUncheckAllowTMToCreateFromSTA,
  verifyTimeSheetRoundingClkIn,
  verifyDualSyncSettingsQBOSaved,
  verifyDualSyncSettingsClassicSaved,
  validateNavigationToTimeSettingsNotif,
  validateDaysRemSent,
  validateSendClkInRem,
  validateSendClkOutRem,
  validateNotifyWhenNotesAddedEdited,
  validateCheckboxes,
  verifyNotifDualSyncSettingsClassicSaved,
  verifyNotifDualSyncSettingsQBOSaved,
  validateClockInOut,
  verifyDualSyncCustomizeTimesheetSettingsFromQBOSaved,
  verifyDualSyncCustomizeTimesheetSettingsFromClassicTimesheetSaved,
  verifyCustomizedTimeSheetFieldFromQBOtoClassicTimeSheet,
  verifyBillableCustomizedTimeSheetFieldFromQBOtoClassicTimeSheet,
  verifyNotesCustomizedTimeSheetFieldFromQBOtoClassicTimeSheet,
  verifyCustomizedTimeSheetFieldFromClassicTimeSheetToQBO,
  validateTimeSignatureAndTeamMemberPermissionsSettings,
} from '../Util/TimeSettings.Util';

//========================================== Time Tracking Settings + STA/WTA/Timeclock validations ===============================================

test.describe('Time Settings Time Tracking Test Cases', () => {
  test.beforeEach(async ({ page }: { page: any }) => {
    // Get current test info
    const testInfo = test.info();
    // Login using test-specific credentials
    const testId = testInfo.title.split(' - ')[0];
    const credentials = getTestAccount(testId);
    await openQBOTS(page, credentials);
  });

  test('TS001 - Verify if Admin lands on to "Time Tacking" section and verifies the edit mode', async ({
    page,
  }) => {
    await validateNavigationToTimeSettingsTimeTracking(page);
    await validateEditModeTimeTracking(page);
  });

  test('TS002 - Validate "First day of work week" functionality. "', async ({
    page,
  }) => {
    await validateFirstDayofWorkWeek(page);
  });

  // commenting the test as saved Timeone from settings is not reflecting on STE
  /*test('TS003 - Validate "Time Zone" functionality.', async ({
    page,
  }) => {
    await validateTimeZone(page);
  });*/

  // commenting the test as developers need to fix adapting 24 hour format on STE/Timeclock
  /*test('TS004 - Validate "Time Format" functionality. "', async ({
    page,
  }) => {
    await validateTimeFormat(page);
  }); */

  // test('TS005 - Verify checked "Split timesheets at midnight" functionality from STE', async ({
  //   page,
  // }) => {
  //   await verifyCheckedUncheckedSplitTimeSheetFromSTE(page, 'check');
  // });

  // test('TS006 - Verify unchecked "Split timesheets at midnight" functionality from STE', async ({
  //   page,
  // }) => {
  //   await verifyCheckedUncheckedSplitTimeSheetFromSTE(page, 'uncheck');
  // });

  // test('TS007 - Verify checked "Split timesheets at midnight" functionality from Time Clock', async ({
  //   page,
  // }) => {
  //   await verifyCheckedSplitTimeSheetFromTimeClock(page, 'check');
  // });

  test('TS008 - Verify if company admin can check "Allow team members to create and edit their own timesheets" & save settings', async ({
    page,
  }) => {
    await verifyCheckUncheckAllowTMToCreateFromSTA(page, 'check');
  });

  //Commenting test as it needs some analysis in the specific test account creation
  /*test('TS009 - Verify if employee can create his/her timesheet with checked "Allow team members to create and edit their own timesheets" from STA', async ({
    page,
  }) => {
    await verifyIfEmpCanCreateTSFromSTA(page, 'access');
  });*/

  test('TS010 - Verify if company admin can uncheck "Allow team members to create and edit their own timesheets" & save settings', async ({
    page,
  }) => {
    await verifyCheckUncheckAllowTMToCreateFromSTA(page, 'uncheck');
  });

  //Commenting test as it needs some analysis in the test account creation
  /*test('TT011 - Verify if employee cannot create his/her timesheet with unchecked "Allow team members to create and edit their own timesheets" from STA', async ({
    page,
  }) => {
    await verifyIfEmpCanCreateTSFromSTA(page, 'noaccess');
  });*/

  // commenting the test as developers need to fix this
  /*test('TS012 - Validate Timesheet rounding functionality for clock in. "', async ({
    page,
  }) => {
    await verifyTimeSheetRoundingClkIn(page);
  }); */
});

//========================================== Time Tracking Dual Sync Settings ====================================================================

test.describe('Time Tracking Settings dual sync', () => {
  test.beforeEach(async ({ page }) => {
    // Get current test info
    const testInfo = test.info();
    // Login using test-specific credentials
    const testId = testInfo.title.split(' - ')[0];
    const credentials = getTestAccount(testId);
    await openQBOTS(page, credentials);
  });

  test('TS013 - Validate the dual sync settings for Time Tracking saved from QBO "', async ({
    page,
  }) => {
    await verifyDualSyncSettingsQBOSaved(page);
  });

  test('TS014 - Validate the dual sync settings for Time Tracking saved from classic timesheet "', async ({
    page,
  }) => {
    await verifyDualSyncSettingsClassicSaved(page);
  });
});

//========================================== Notifications Settings =============================================================
test.describe('Time Settings Notifications Test Cases', () => {
  test.beforeEach(async ({ page }) => {
    // Get current test info
    const testInfo = test.info();
    // Login using test-specific credentials
    const testId = testInfo.title.split(' - ')[0];
    const credentials = getTestAccount(testId);
    await openQBOTS(page, credentials);
  });

  test('TS015 - Verify static fields on Time Settings => Time => Notifications', async ({
    page,
  }) => {
    await validateNavigationToTimeSettingsNotif(page);
  });

  test('TS016 - Verify "Days reminders are sent" drop down', async ({
    page,
  }) => {
    await validateDaysRemSent(page);
  });

  test('TS017 - Verify Notify when notes are added or edited drop down', async ({
    page,
  }) => {
    await validateNotifyWhenNotesAddedEdited(page);
  });

  test('TS018 - Verify Send clock in reminder at drop down', async ({
    page,
  }) => {
    await validateSendClkInRem(page);
  });

  test('TS019 - Verify Send clock out reminder at drop down', async ({
    page,
  }) => {
    await validateSendClkOutRem(page);
  });

  test('TS020 - Verify Email & Mobile checkboxes', async ({ page }) => {
    await validateCheckboxes(page);
  });

  test('TS021 - Notify when clock-in/-out time is adjusted', async ({
    page,
  }) => {
    await validateClockInOut(page);
  });
});

//========================================== Notifications Dual Sync Settings ====================================================================

test.describe('Notifications Settings dual sync', () => {
  test.beforeEach(async ({ page }) => {
    // Get current test info
    const testInfo = test.info();
    // Login using test-specific credentials
    const testId = testInfo.title.split(' - ')[0];
    const credentials = getTestAccount(testId);
    await openQBOTS(page, credentials);
  });

  test('TS022 - Validate the dual sync settings for Notifications saved from QBO "', async ({
    page,
  }) => {
    await verifyNotifDualSyncSettingsQBOSaved(page);
  });

  test('TS023 - Validate the dual sync settings for Notifications saved from classic timesheet "', async ({
    page,
  }) => {
    await verifyNotifDualSyncSettingsClassicSaved(page);
  });

  // ========== Customize Time Sheet Fields ===============

  test('TS024 - Validate the dual sync settings for customize timesheet fields for QBO and Classic Time Sheet', async ({
    page,
  }) => {
    await verifyDualSyncCustomizeTimesheetSettingsFromQBOSaved(page);
  });

  // test('TS025 - Validate Class custom fields on STA, WTA and Classic Time Sheet after saving from QBO Time Settings', async ({
  //   page,
  // }) => {
  //   await verifyCustomizedTimeSheetFieldFromQBOtoClassicTimeSheet(
  //     page,
  //     'Class',
  //   );
  // });

  // test('TS026 - Validate Billable custom fields on STA, WTA and Classic Time Sheet after saving from QBO Time Settings', async ({
  //   page,
  // }) => {
  //   await verifyCustomizedTimeSheetFieldFromQBOtoClassicTimeSheet(
  //     page,
  //     'Location',
  //   );
  // });

  // test('TS027 - Validate Service item custom fields on STA, WTA and Classic Time Sheet after saving from QBO Time Settings', async ({
  //   page,
  // }) => {
  //   await verifyCustomizedTimeSheetFieldFromQBOtoClassicTimeSheet(
  //     page,
  //     'Service item',
  //   );
  // });

  test('TS028 - Validate Location custom fields on STA, WTA and Classic Time Sheet after saving from QBO Time Settings', async ({
    page,
  }) => {
    await verifyBillableCustomizedTimeSheetFieldFromQBOtoClassicTimeSheet(
      page,
      'Billable',
    );
  });

  test('TS029 - Validate Notes custom fields on STA, WTA and Classic Time Sheet after saving from QBO Time Settings', async ({
    page,
  }) => {
    await verifyNotesCustomizedTimeSheetFieldFromQBOtoClassicTimeSheet(
      page,
      'Notes',
    );
  });

  test('TS030 - Validate Time signature and team member permissions settings', async ({
    page,
  }) => {
    await validateTimeSignatureAndTeamMemberPermissionsSettings(page);
  });

  // As mentioned in the JIRA QUANTA-2627, we cannot hold test for 5-10 minutes, so commenting the test
  // test('TS041 - Validate Class custom fields on STA, WTA and QBO Time Settings after saving from Classic Time Sheet @jigs', async ({
  //   page,
  // }) => {
  //   test.info().fixme(true, 'https://jira.intuit.com/browse/QUANTA-2627');
  //   await verifyCustomizedTimeSheetFieldFromClassicTimeSheetToQBO(
  //     page,
  //     'Location',
  //   );
  // });
});
