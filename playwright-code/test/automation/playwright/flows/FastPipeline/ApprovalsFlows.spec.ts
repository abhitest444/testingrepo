import { test } from '@playwright/test';
import { openQBOTETab } from '../../pages/QBOLogin';
import {
  runApprovalsSuite,
  buildAPTAccountsFromMatrix,
  revertAPTChanges,
} from '../Util/FastPipeline/ApprovalsFlows.Util';

/** Matrix selector for this run — set by the Groovy/Jenkins job. */
const TEST_ACCOUNT = process.env.TEST_ACCOUNT;

// Resolve the selector into its ordered account array. For `TEST_ACCOUNT=IES`
// the APT_ACCOUNT_MATRIX maps IES -> ['IES01', 'IES02'], so this yields those
// two accounts in order. The Approvals full suite is registered ONCE PER resolved
// account, BY POSITION:
//   • test 1 → matrixAccounts[0]  (APP01 for TEST_ACCOUNT=PR_ELITE)
//   • test 2 → matrixAccounts[1]
// A test is REGISTERED only when its position has an account — if the selector
// resolves to fewer accounts (e.g. an exact key resolves to one), the extra tests
// are not created at all (they do not run and do not show as skipped).
const matrixAccounts = buildAPTAccountsFromMatrix(TEST_ACCOUNT);
const [firstAccount] = matrixAccounts;

test.describe('Approvals End-to-End', () => {
  // The account whose test is currently running. Set at the start of each test
  // and consumed by afterEach so the right account's changes are reverted even
  // if the test times out or fails partway (Playwright runs afterEach after a
  // timeout; a try/finally in the test body would not).
  let activeAccount: (typeof matrixAccounts)[number]['account'] | undefined;
  let cleanupNeeded = false;

  test.afterEach(async ({ page }) => {
    if (activeAccount && cleanupNeeded) {
      await revertAPTChanges(page, activeAccount);
    }
    activeAccount = undefined;
    cleanupNeeded = false;
  });

  // One Approvals full-suite test per resolved account.
  if (firstAccount) {
    const { testId, account } = firstAccount;
    test(`[${testId}] Approvals : Navigate, Validate, Approve, Locked State, Unapprove, Edit, Run Payroll, Cleanup`, async ({
      page,
    }) => {
      activeAccount = account;
      cleanupNeeded = true;
      await openQBOTETab(page, account.credentials);
      const submenuFound = await runApprovalsSuite(page, account);
      if (!submenuFound) {
        cleanupNeeded = false;
      }
    });
  }
});
