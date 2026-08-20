import { test, expect } from '@playwright/test';
import { getTestAccount } from '../../config/accounts';
import { openQBOTS } from '../../pages/QBOLogin';
import {
  validateSubmissionsRemindersDayOfWeekFromClassicTimesheet,
  validateSubmissionsRemindersDayOfWeekFromQBOTime,
  validateSubmissionsRemindersPayrollCloseDateFromClassicTimesheet,
  validateSubmissionsRemindersPayPeriodFromQBOTime,
  validateSubmissionsRemindersDailyFromClassicTimesheet,
  validateSubmissionsRemindersDailyFromQBOTime,
  validateApprovalManagerRemindersDayOfWeekFromClassicTimesheet,
  validateApprovalManagerRemindersDayOfWeekFromQBOTime,
  validateApprovalManagerRemindersPayrollCloseDateFromClassicTimesheet,
  validateApprovalManagerRemindersPayPeriodFromQBOTime,
  validateEmailManagerFromClassicTimesheet,
  validateEmailManagerFromQBOTime,
  validateCustomMessageFromClassicTimesheet,
  validateCustomMessageFromQBOTime,
  validateRestoreCustomMessageFromClassicTimesheet,
  validateResetCustomMessageFromQBOTime,
  verifyDefaultApprovalPreferencesInTSheetsAndQBOSettings,
  verifyApprovalsSectionWhenSubmissionIsTurnedOff,
  verifyApprovalsSectionWhenSubmissionIsTurnedOnFromTSheets,
  verifyApprovalsSectionWhenSubmissionIsTurnedOnFromQBOSettings,
} from '../Util/TimeSettings.Util';

test.describe('Approvals and Settings Test Cases', () => {
  test.beforeEach(async ({ page }: { page: any }) => {
    // Get current test info
    const testInfo = test.info();
    // Login using test-specific credentials
    const testId = testInfo.title.split(' - ')[0];
    const credentials = getTestAccount(testId);
    await openQBOTS(page, credentials);
  });

  test('APS001 - Verify default approval preferences in TSheets & QBOSettings', async ({
    page,
  }) => {
    await verifyDefaultApprovalPreferencesInTSheetsAndQBOSettings(page);
  });

  test('APS002 - Verify Approvals section when submission is turned off', async ({
    page,
  }) => {
    await verifyApprovalsSectionWhenSubmissionIsTurnedOff(page);
  });

  test('APS003 - Verify Approvals section when submission is turned On from TSheets', async ({
    page,
  }) => {
    await verifyApprovalsSectionWhenSubmissionIsTurnedOnFromTSheets(page);
  });

  test('APS004 - Verify Approvals section when submission is turned on from QBOSettings', async ({
    page,
  }) => {
    await verifyApprovalsSectionWhenSubmissionIsTurnedOnFromQBOSettings(page);
  });

  test('APS005 - Validate submissions reminders to team members based on day of week from classic time sheet', async ({
    page,
  }) => {
    await validateSubmissionsRemindersDayOfWeekFromClassicTimesheet(page);
  });

  test('APS006 - Validate submissions reminders to team members based on day of week from QBO time', async ({
    page,
  }) => {
    await validateSubmissionsRemindersDayOfWeekFromQBOTime(page);
  });

  test('APS007 - Validate submissions reminders to team members based on payroll close date from classic time sheet', async ({
    page,
  }) => {
    await validateSubmissionsRemindersPayrollCloseDateFromClassicTimesheet(
      page,
    );
  });

  test('APS008 - Validate submissions reminders to team members based on pay period from QBO time', async ({
    page,
  }) => {
    await validateSubmissionsRemindersPayPeriodFromQBOTime(page);
  });

  test('APS009 - Validate submissions reminders to team members based on daily from classic time sheet', async ({
    page,
  }) => {
    await validateSubmissionsRemindersDailyFromClassicTimesheet(page);
  });

  test('APS010 - Validate submissions reminders to team members based on daily from QBO time', async ({
    page,
  }) => {
    await validateSubmissionsRemindersDailyFromQBOTime(page);
  });

  test('APS011 - Validate submissions reminders to approval manager based on day of week from classic time sheet', async ({
    page,
  }) => {
    await validateApprovalManagerRemindersDayOfWeekFromClassicTimesheet(page);
  });

  test('APS012 - Validate submissions reminders to approval manager based on day of week from QBO time', async ({
    page,
  }) => {
    await validateApprovalManagerRemindersDayOfWeekFromQBOTime(page);
  });

  test('APS013 - Validate submissions reminders to approval manager based on payroll close date from classic time sheet', async ({
    page,
  }) => {
    await validateApprovalManagerRemindersPayrollCloseDateFromClassicTimesheet(
      page,
    );
  });

  test('APS014 - Validate submissions reminders to approval manager based on pay period from QBO time', async ({
    page,
  }) => {
    await validateApprovalManagerRemindersPayPeriodFromQBOTime(page);
  });

  test('APS015 - Validate submissions reminders to email manager from classic time sheet', async ({
    page,
  }) => {
    await validateEmailManagerFromClassicTimesheet(page);
  });

  test('APS016 - Validate submissions reminders to email manager from QBO time', async ({
    page,
  }) => {
    await validateEmailManagerFromQBOTime(page);
  });

  test('APS017 - Validate custom message validation from classic time sheet', async ({
    page,
  }) => {
    await validateCustomMessageFromClassicTimesheet(page);
  });

  test('APS018 - Validate custom message validation from QBO time', async ({
    page,
  }) => {
    await validateCustomMessageFromQBOTime(page);
  });

  test('APS019 - Validate restore custom message validation from classic time sheet', async ({
    page,
  }) => {
    await validateRestoreCustomMessageFromClassicTimesheet(page);
  });

  test('APS020 - Validate reset custom message validation from QBO time', async ({
    page,
  }) => {
    await validateResetCustomMessageFromQBOTime(page);
  });
});
