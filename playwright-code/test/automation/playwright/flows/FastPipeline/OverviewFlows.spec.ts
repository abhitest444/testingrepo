import { test } from '@playwright/test';
import { openQBOTS } from '../../pages/QBOLogin';
import { applyNetworkThrottling } from '../../utils/networkThrottle';
import {
  runOverviewFullSuite,
  buildOverviewAccountsFromMatrix,
} from '../Util/FastPipeline/OverviewFlows.Util';

/** Matrix selector for this run — set by the Groovy/Jenkins job. */
const TEST_ACCOUNT = process.env.TEST_ACCOUNT;

// Resolve the selector into its ordered account array. For `TEST_ACCOUNT=IES`
// the OV_ACCOUNT_MATRIX maps IES -> its account list, so this yields those
// accounts in order. Each test below picks its account BY POSITION:
//   • test 1 → matrixAccounts[0]
//   • test 2 → matrixAccounts[1]
// A test is REGISTERED only when its position has an account — if the array is
// shorter (e.g. an exact key resolves to one account), the extra test is not
// created at all (it does not run and does not show as skipped).
const matrixAccounts = buildOverviewAccountsFromMatrix(TEST_ACCOUNT);
const [firstAccount] = matrixAccounts;

test.describe('Overview Tab End-to-End', () => {
  // One test with two methods:
  //   1. Verify all UI elements visible on the Overview screen.
  //   2. Cover all cases from flows/Priority/QBTimeSetupCases.spec.ts.

  // Test 1 — uses the FIRST account in the array.
  if (firstAccount) {
    const { testId, account } = firstAccount;
    test(`[${testId}] Overview Tab UI Verification and QB Time Setup cases`, async ({
      page,
    }) => {
      await openQBOTS(page, account.credentials);
      // Apply network throttling AFTER login so the auth handshake isn't throttled.
      // Controlled by the NETWORK_PROFILE env var (Jenkins param); no-op when unset.
      await applyNetworkThrottling(page);
      await runOverviewFullSuite(page, account);
    });
  }
});
