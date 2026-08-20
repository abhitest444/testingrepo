import { test } from '@playwright/test';
import { openQBOTETab } from '../../pages/QBOLogin';
import {
  runTimeTeamSuite,
  buildTTMAccountsFromMatrix,
} from '../Util/FastPipeline/TimeTeamFlows.Util';

/** Matrix selector for this run — set by the Groovy/Jenkins job. */
const TEST_ACCOUNT = process.env.TEST_ACCOUNT;

// Resolve the selector into its ordered account array. For `TEST_ACCOUNT=PR_ELITE`
// the TTM_ACCOUNT_MATRIX maps PR_ELITE -> ['TTMEL01'], so this yields that account.
// The Time team full suite is registered ONCE PER resolved account, BY POSITION:
//   • test 1 → matrixAccounts[0]  (TTMEL01 for TEST_ACCOUNT=PR_ELITE)
//   • test 2 → matrixAccounts[1]
// A test is REGISTERED only when its position has an account — if the selector
// resolves to fewer accounts (e.g. an exact key resolves to one), the extra tests
// are not created at all (they do not run and do not show as skipped).
const matrixAccounts = buildTTMAccountsFromMatrix(TEST_ACCOUNT);
const [firstAccount] = matrixAccounts;

/**
 * TTM01 — Time team Tab End-to-End suite
 *
 * Covers all visible UI elements on the Time team ("Your Team") tab, which
 * renders inside the QuickBooks Time widget iframe (iframe[title="Your Team"]):
 *  1a. Login              — openQBOTETab (QBOLogin.ts)
 *  1b. Dashboard validate — body node, sidebar, account header (DashboardPage.ts)
 *  2.  Navigate to Time team + wait for the "Your Team" iframe to render
 *  3.  Validate all page elements:
 *        • "Your Team" header
 *        • View dropdown + options
 *        • Search field
 *        • Who's working / Invite team members / Add team member (+ options)
 *        • Roster table — column headers, First/Last Name columns, row names
 *        • Column sorting + resulting ordered values
 *        • Filters settings — Group + Last Activity dropdowns (+ options)
 */
test.describe('Time team End-to-End', () => {
  // One Time team full-suite test per resolved account.
  if (firstAccount) {
    const { testId, account } = firstAccount;
    test(`[${testId}] Time team : Navigate, Validate all visible UI elements`, async ({
      page,
    }) => {
      await openQBOTETab(page, account.credentials);
      await runTimeTeamSuite(page, account);
    });
  }
});
