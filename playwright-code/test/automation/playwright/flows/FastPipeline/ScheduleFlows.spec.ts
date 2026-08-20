import { test } from '@playwright/test';
import { openQBOTETab } from '../../pages/QBOLogin';
import {
  runScheduleSuite,
  buildSCHAccountsFromMatrix,
} from '../Util/FastPipeline/ScheduleFlows.Util';

/** Matrix selector for this run — set by the Groovy/Jenkins job. */
const TEST_ACCOUNT = process.env.TEST_ACCOUNT;

// Resolve the selector into its ordered account array. For `TEST_ACCOUNT=PR_ELITE`
// the SCH_ACCOUNT_MATRIX maps PR_ELITE -> ['SCHEL01'], so this yields that account.
// The Schedule full suite is registered ONCE PER resolved account, BY POSITION:
//   • test 1 → matrixAccounts[0]  (SCHEL01 for TEST_ACCOUNT=PR_ELITE)
//   • test 2 → matrixAccounts[1]
// A test is REGISTERED only when its position has an account — if the selector
// resolves to fewer accounts (e.g. an exact key resolves to one), the extra tests
// are not created at all (they do not run and do not show as skipped).
const matrixAccounts = buildSCHAccountsFromMatrix(TEST_ACCOUNT);
const [firstAccount] = matrixAccounts;

/**
 * SCH01 — Schedule Tab End-to-End suite
 *
 * Covers all visible UI elements on the Schedule tab and the full shift
 * lifecycle:
 *  1a. Login              — openQBOTETab (QBOLogin.ts)
 *  1b. Dashboard validate — body node, sidebar, account header (DashboardPage.ts)
 *  2.  Navigate to Schedule + wait for iframe widget ready (DashboardPage.ts)
 *  3.  Left-nav persistence after navigation (DashboardPage.ts)
 *  4.  All page elements (Actions, date nav, Customers, Team members, My/Full,
 *      Week dropdown, Print, Settings, Publish, VIEW BY, calendar grid)
 */
test.describe('Schedule End-to-End', () => {
  // One Schedule full-suite test per resolved account.
  if (firstAccount) {
    const { testId, account } = firstAccount;
    test(`[${testId}] Schedule : Navigate, Validate UI, Create+Cancel, Create+Publish, Edit, Cleanup`, async ({
      page,
    }) => {
      await openQBOTETab(page, account.credentials);
      await runScheduleSuite(page, account);
    });
  }
});
