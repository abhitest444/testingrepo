import { test } from '@playwright/test';
import { openQBOTETab } from '../../pages/QBOLogin';
import {
  runTimeReportsSuite,
  buildTRPAccountsFromMatrix,
} from '../Util/FastPipeline/TimeReportsFlows.Util';

/** Matrix selector for this run — set by the Groovy/Jenkins job. */
const TEST_ACCOUNT = process.env.TEST_ACCOUNT;

// Resolve the selector into its ordered account array. For `TEST_ACCOUNT=PR_ELITE`
// the TRP_ACCOUNT_MATRIX maps PR_ELITE -> ['TRPEL01'], so this yields that account.
// The Time reports full suite is registered ONCE PER resolved account, BY POSITION:
//   • test 1 → matrixAccounts[0]  (TRPEL01 for TEST_ACCOUNT=PR_ELITE)
//   • test 2 → matrixAccounts[1]
// A test is REGISTERED only when its position has an account — if the selector
// resolves to fewer accounts (e.g. an exact key resolves to one), the extra tests
// are not created at all (they do not run and do not show as skipped).
const matrixAccounts = buildTRPAccountsFromMatrix(TEST_ACCOUNT);
const [firstAccount] = matrixAccounts;

/**
 * TRP01 — Time reports Tab End-to-End suite
 *
 * Covers all visible UI elements on the Time reports tab (under the Time menu)
 * and the two report-type flows. The Time reports landing and the Standard
 * reports page render page-level (no iframe):
 *  1a. Login              — openQBOTETab (QBOLogin.ts)
 *  1b. Dashboard validate — body node, sidebar, account header (DashboardPage.ts)
 *  2.  Navigate to Time reports + validate the Time reports header
 *  3.  Validate the two report types (Payroll report + Itemized Total Time
 *      Report) and their descriptions
 *  4.  Click Payroll report → Standard reports page → Time section visible →
 *      Timesheet Detail by Employee + Time Summary by Pay Type
 *  5.  Navigate back to Time reports
 *  6.  Click Itemized Total Time Report → Standard reports page → Time section
 *      visible → Timesheet Detail by Employee + Time Summary by Pay Type
 */
test.describe('Time reports End-to-End', () => {
  // One Time reports full-suite test per resolved account.
  if (firstAccount) {
    const { testId, account } = firstAccount;
    test(`[${testId}] Time reports : Navigate, Validate report types, Payroll + Itemized flows`, async ({
      page,
    }) => {
      await openQBOTETab(page, account.credentials);
      await runTimeReportsSuite(page, account);
    });
  }
});
