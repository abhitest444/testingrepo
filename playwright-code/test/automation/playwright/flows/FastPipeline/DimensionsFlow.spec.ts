import { test } from '@playwright/test';
import {
  buildDimPayrollAccounts,
  runSteDimensionsPayrollFlow,
  cleanupDimensionsPayroll,
  dimensionTimeClockE2EFlow,
  runWteDimensionsPayrollFlow,
} from '../Util/FastPipeline/DimensionsFlow.Util';

/** Matrix selector for this run — set by the Groovy/Jenkins job. */
const TEST_ACCOUNT = process.env.TEST_ACCOUNT;

// Resolve the selector into its ordered account array. Each test picks its
// account BY POSITION per the IES pool (same pattern as TE / other FastPipeline):
//   • test 1 → matrixAccounts[0] — STE
//   • test 2 → matrixAccounts[1] — Time Clock
//   • test 3 → matrixAccounts[2] — WTE
// A test is REGISTERED only when its position has an account.
const matrixAccounts = buildDimPayrollAccounts(TEST_ACCOUNT);
const [firstAccount, secondAccount, thirdAccount] = matrixAccounts;

test.describe('Dimensions Payroll End-to-End', () => {
  test.describe.configure({ timeout: 45 * 60 * 1000 });

  const createdEntries: string[] = [];

  // Post-cleanup for STE/WTE only (Time Clock manages its own cleanup).
  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.title.includes('Time Clock') || page.isClosed()) return;
    if (!firstAccount && !thirdAccount) return;
    await cleanupDimensionsPayroll(page).catch(() => undefined);
  });

  // Test 1 — FIRST account: STE End to End Flow.
  if (firstAccount) {
    const { testId } = firstAccount;
    test(`[${testId}] Dimensions : STE -> Approve -> Run Payroll`, async ({
      page,
    }) => {
      await runSteDimensionsPayrollFlow(page, firstAccount, createdEntries);
    });
  }

  // Test 2 — SECOND account: Time Clock End to End Flow.
  if (secondAccount) {
    const { testId } = secondAccount;
    test(`[${testId}] Dimensions : Time Clock -> STE edit -> Approve -> Run Payroll`, async ({
      page,
    }) => {
      await dimensionTimeClockE2EFlow(page, secondAccount);
    });
  }

  // Test 3 — THIRD account: WTE End to End Flow (new addition).
  if (thirdAccount) {
    const { testId } = thirdAccount;
    test(`[${testId}] Dimensions : WTE -> Approve -> Run Payroll`, async ({
      page,
    }) => {
      await runWteDimensionsPayrollFlow(page, thirdAccount, createdEntries);
    });
  }
});
