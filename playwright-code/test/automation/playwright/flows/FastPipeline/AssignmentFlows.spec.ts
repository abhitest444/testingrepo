import { test } from '@playwright/test';
import { openQBOTS } from '../../pages/QBOLogin';
import {
  runAssignmentsFullSuite,
  buildAssignmentsAccountsFromMatrix,
  cleanupAssignmentsTestData,
} from '../Util/FastPipeline/AssignmentFlows.Util';

/** Matrix selector for this run — set by the Groovy/Jenkins job. */
const TEST_ACCOUNT = process.env.TEST_ACCOUNT;

// Resolve the selector into its ordered account array. For `TEST_ACCOUNT=IES`
// the AS_ACCOUNT_MATRIX maps IES -> its account list, so this yields those
// accounts in order. Each test below picks its account BY POSITION:
//   • test 1 → matrixAccounts[0]
//   • test 2 → matrixAccounts[1]
// A test is REGISTERED only when its position has an account — if the array is
// shorter (e.g. an exact key resolves to one account), the extra test is not
// created at all (it does not run and does not show as skipped).
const matrixAccounts = buildAssignmentsAccountsFromMatrix(TEST_ACCOUNT);
const [firstAccount] = matrixAccounts;

test.describe('Assignments Tab End-to-End', () => {
  test.afterEach(async ({ page }) => {
    // Free-data accounts run only the negative check (no data created), so skip
    // cleanup — it applies to IES / Elite / Premium only.
    if (firstAccount?.account.companyType === 'FreeData') {
      console.log('skipping cleanup: free-data account (no test data created)');
      return;
    }
    console.log('starting cleanup:');
    try {
      await cleanupAssignmentsTestData(page);
    } catch (error) {
      console.log('cleanup failed, but continuing:', error);
    }
  });

  // Test 1 — uses the FIRST account in the array.
  // Assignments Tab : Login, Navigation, Visibility, Filters, Columns, Role
  // scope, and CRUD for every assignment type (Customer→Field/Worker/Geofence,
  // Customer/Worker/Group CRUD, View settings & sync, Who's Working & Payroll).
  if (firstAccount) {
    const { testId, account } = firstAccount;
    test(`[${testId}] Assignments Tab Validation and CRUD End to End flow`, async ({
      page,
    }) => {
      await openQBOTS(page, account.credentials);
      await runAssignmentsFullSuite(page, account);
    });
  }
});
