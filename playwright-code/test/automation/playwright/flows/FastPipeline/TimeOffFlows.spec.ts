import { test } from '@playwright/test';
import { openQBOTETab } from '../../pages/QBOLogin';
import {
  runTimeOffSuite,
  buildTOFAccountsFromMatrix,
} from '../Util/FastPipeline/TimeOffFlows.Util';

/** Matrix selector for this run — set by the Groovy/Jenkins job. */
const TEST_ACCOUNT = process.env.TEST_ACCOUNT;

// Resolve the selector into its ordered account array. For `TEST_ACCOUNT=PR_ELITE`
// the TOF_ACCOUNT_MATRIX maps PR_ELITE -> ['TOFEL01'], so this yields that account.
// The Time off full suite is registered ONCE PER resolved account, BY POSITION:
//   • test 1 → matrixAccounts[0]  (TOFEL01 for TEST_ACCOUNT=PR_ELITE)
//   • test 2 → matrixAccounts[1]
// A test is REGISTERED only when its position has an account — if the selector
// resolves to fewer accounts (e.g. an exact key resolves to one), the extra tests
// are not created at all (they do not run and do not show as skipped).
const matrixAccounts = buildTOFAccountsFromMatrix(TEST_ACCOUNT);
const [firstAccount] = matrixAccounts;

/**
 * TOF01 — Time off Tab End-to-End suite
 *
 * Covers all visible UI elements on the Time off tab (under the Time menu):
 *  1a. Login              — openQBOTETab (QBOLogin.ts)
 *  1b. Dashboard validate — body node, sidebar, account header (DashboardPage.ts)
 *  2.  Navigate to Time off + wait for the requests widget to render
 *  3.  Left-nav persistence after navigation (Time off active)
 *  4.  All page elements (header, requests iframe, Request/Add time off,
 *      Manage time off, status filters Pending/Approved/Denied, date-range
 *      control, requests table / empty-state, table columns)
 */
test.describe('Time off End-to-End', () => {
  // One Time off full-suite test per resolved account.
  if (firstAccount) {
    const { testId, account } = firstAccount;
    test(`[${testId}] Time off : Navigate, Validate all visible UI elements`, async ({
      page,
    }) => {
      await openQBOTETab(page, account.credentials);
      await runTimeOffSuite(page, account);
    });
  }
});
