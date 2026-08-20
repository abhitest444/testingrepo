import { test } from '@playwright/test';
import { getTestAccount } from '../../config/accounts';
import {
  validateEnableSubmitTimeFromQBO,
  validateEnableSubmitTimeFromTSheets,
  validateSubmitTimeFlow,
  validateSubmittedTimeEntryCannotBeEdited,
  validateApprovalFlowOfSubmittedTime,
  validateNoNewEntryWithinSubmittedTimeline,
  validateAdminCanEditDeleteSubmittedEntry,
  validateSubmitButtonEnableDisable,
  validateDeleteSubmittedEntryInWFS,
  validateSubmitTimeForWTE,
  validateSubmitTimeForTimeClock,
  cleanupSubmittedTimeEntry,
  cleanupSubmittedTimeEntryForSUT10,
  cleanupSubmittedTimeEntryForSUT11,
} from '../Util/FastPipeline/SubmitTime.Util';

/**
 * SUT01, SUT03 and SUT05 use the QBO admin + Workforce employee (SEPARATE
 * email) dual-session approach, mirroring the Workforce <-> QBO sync cases in
 * WorkforceCases.spec.ts. Each manages its own browser pages, so they live in
 * their own describe block with no shared beforeEach.
 */
test.describe('Submit Time', () => {
  // SUT01 - Validate the enabling of Submit Time entry in WFS from QBO
  test('SUT01 - Validate the enabling of Submit Time entry in WFS from QBO', async ({
    browser,
  }) => {
    const adminCredentials = getTestAccount('SUT01');
    const employeeCredentials = getTestAccount('SUTW01');
    await validateEnableSubmitTimeFromQBO(
      browser,
      adminCredentials,
      employeeCredentials,
    );
  });

  // SUT02 - Validate the enabling of Submit Time entry in WFS from TSheets
  test('SUT02 - Validate the enabling of Submit Time entry in WFS from TSheets', async ({
    browser,
  }) => {
    const adminCredentials = getTestAccount('SUT02');
    const employeeCredentials = getTestAccount('SUTW02');
    await validateEnableSubmitTimeFromTSheets(
      browser,
      adminCredentials,
      employeeCredentials,
    );
  });

  // SUT03 - Validate the disabling and enabling of Submit button in Submit time
  test('SUT03 - Validate the disabling and enabling of Submit button in Submit time', async ({
    browser,
  }) => {
    const adminCredentials = getTestAccount('SUT03');
    const employeeCredentials = getTestAccount('SUTW03');
    await validateSubmitButtonEnableDisable(
      browser,
      adminCredentials,
      employeeCredentials,
    );
  });

  // SUT05 - Validate that Submitted Time Entry cannot be edited (Workforce login)
  test('SUT05 - Validate that Submitted Time Entry cannot be edited or deleted', async ({
    browser,
  }) => {
    const adminCredentials = getTestAccount('SUT05');
    const employeeCredentials = getTestAccount('SUTW05');
    await validateSubmittedTimeEntryCannotBeEdited(
      browser,
      adminCredentials,
      employeeCredentials,
    );
  });

  // SUT06 - Validate a Submitted Time Entry can be edited and deleted by admin in QBO
  test('SUT06 - Validate that Submitted Time Entry can be edited and deleted by admin in QBO', async ({
    browser,
  }) => {
    const adminCredentials = getTestAccount('SUT06');
    const employeeCredentials = getTestAccount('SUTW06');
    await validateAdminCanEditDeleteSubmittedEntry(
      browser,
      adminCredentials,
      employeeCredentials,
    );
  });

  // SUT07 - Validate the Approval flow of submitted time
  test('SUT07 - Validate the Approval flow of submitted time', async ({
    browser,
  }) => {
    const adminCredentials = getTestAccount('SUT07');
    const employeeCredentials = getTestAccount('SUTW07');
    await validateApprovalFlowOfSubmittedTime(
      browser,
      adminCredentials,
      employeeCredentials,
    );
  });

  // SUT09 - Validate the deleting of submitted time entry in WFS
  test('SUT09 - Validate the deleting of submitted time entry in WFS', async ({
    browser,
  }) => {
    const adminCredentials = getTestAccount('SUT09');
    const employeeCredentials = getTestAccount('SUTW09');
    await validateDeleteSubmittedEntryInWFS(
      browser,
      adminCredentials,
      employeeCredentials,
    );
  });
});

/**
 * SUT04 runs cleanup in a beforeEach (separate from the test body) so a slow
 * cleanup does not consume the test's time budget or leave the body starting
 * against a torn-down browser.
 */
test.describe('Submit Time', () => {
  test.beforeEach(async ({ browser }) => {
    const adminCredentials = getTestAccount('SUT04');
    await cleanupSubmittedTimeEntry(browser, adminCredentials).catch(
      (error) => {
        console.log(
          `⚠ SUT04 cleanup failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      },
    );
  });

  // SUT04 - Validate the Submit Time flow in WFS (P0)
  test('SUT04 - Validate the Submit Time flow in WFS', async ({ browser }) => {
    const employeeCredentials = getTestAccount('SUTW04');
    await validateSubmitTimeFlow(browser, employeeCredentials);
  });
});

/**
 * SUT08 runs cleanup in a beforeEach (removing any leftover submitted entry)
 * before the test creates, submits, and re-attempts an entry on the same date.
 */
test.describe('Submit Time', () => {
  test.beforeEach(async ({ browser }) => {
    const adminCredentials = getTestAccount('SUT08');
    await cleanupSubmittedTimeEntry(browser, adminCredentials).catch(
      (error) => {
        console.log(
          `⚠ SUT08 cleanup failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      },
    );
  });

  // SUT08 - Validate a new Time Entry cannot be created within the submitted timelines
  test('SUT08 - Validate that new Time Entry cannot be created within submitted timelines', async ({
    browser,
  }) => {
    const employeeCredentials = getTestAccount('SUTW08');
    await validateNoNewEntryWithinSubmittedTimeline(
      browser,
      employeeCredentials,
    );
  });
});

/**
 * SUT10 runs cleanup in a beforeEach: the admin rejects the previously submitted
 * Weekly time entry in TSheets and deletes the (now un-submitted) WTE rows from
 * QBO, so the test starts from a clean slate before creating + submitting again.
 */
test.describe('Submit Time', () => {
  test.beforeEach(async ({ browser }) => {
    const adminCredentials = getTestAccount('SUT10');
    await cleanupSubmittedTimeEntryForSUT10(browser, adminCredentials).catch(
      (error) => {
        console.log(
          `⚠ SUT10 cleanup failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      },
    );
  });

  // SUT10 - Validate Submit time for a Weekly time entry (WTE) in WFS
  test('SUT10 - Validate Submit time for WTE in WFS', async ({ browser }) => {
    const employeeCredentials = getTestAccount('SUTW10');
    await validateSubmitTimeForWTE(browser, employeeCredentials);
  });
});

/**
 * SUT11 runs cleanup in a beforeEach: the admin rejects the previously submitted
 * Time Clock entry in TSheets and deletes the (now un-submitted) record from
 * QBO, so the test starts from a clean slate before creating + submitting again.
 */
test.describe('Submit Time', () => {
  test.beforeEach(async ({ browser }) => {
    const adminCredentials = getTestAccount('SUT11');
    await cleanupSubmittedTimeEntryForSUT11(browser, adminCredentials).catch(
      (error) => {
        console.log(
          `⚠ SUT11 cleanup failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      },
    );
  });

  // SUT11 - Validate Submit time for a Time Clock entry in WFS
  test('SUT11 - Validate Submit time for Time Clock in WFS', async ({
    browser,
  }) => {
    const employeeCredentials = getTestAccount('SUTW11');
    await validateSubmitTimeForTimeClock(browser, employeeCredentials);
  });
});
