import { Page, test } from '@playwright/test';
import { openQBOTETab } from '../../pages/QBOLogin';
import TETimeEntriesTabPage from '../../pages/FastPipeline/TimeEntriesFlowsPage';
import {
  dismissQboOnboardingIfVisible,
  dismissTasksDrawerIfVisible,
} from '../../commonUtils';
import { LoginCredentials } from '../../config/types';
import {
  runSTEFullSuite,
  buildTEAccountsFromMatrix,
  cleanupCreatedEntries,
  runWTEFullSuite,
  runTimeClockSuite,
  runBreaksFullSuite,
  ensureTimeEntriesGridReady,
} from '../Util/FastPipeline/TimeEntriesFlows.Util';
import {
  runSTAFDFullSuite,
  cleanupCreatedSTAEntries,
} from '../Util/FastPipeline/SingleTimeActivityFlows.Util';
import {
  runWTAFDFullSuite,
  cleanupCreatedWTAEntries,
} from '../Util/FastPipeline/WeeklyTimeActivityFlows.Util';

/** Matrix selector for this run — set by the Groovy/Jenkins job. */
const TEST_ACCOUNT = process.env.TEST_ACCOUNT;

/** FREE_DATA matrix keys — STE/WTE are skipped; STA/WTA run instead. */
const FREE_DATA_ACCOUNT_KEYS = [
  'FREE_DATA_ADV',
  'FREE_DATA_ESSENTIAL',
  'FREE_DATA_PLUS',
] as const;
const isFreeDataAccount = FREE_DATA_ACCOUNT_KEYS.includes(
  TEST_ACCOUNT as (typeof FREE_DATA_ACCOUNT_KEYS)[number],
);

// Resolve the selector into its ordered account array. For FREE_DATA matrix keys
// the TE_ACCOUNT_MATRIX maps each to two accounts, e.g. FREE_DATA_ADV ->
// ['FDAF01', 'FDAF02']. Each test below picks its account BY POSITION:
//   • test 1 → matrixAccounts[0] — STE  (skipped for FREE_DATA_*)
//   • test 2 → matrixAccounts[1] — WTE  (skipped for FREE_DATA_*)
//   • test 3 → matrixAccounts[0] — STA  (FREE_DATA_* only)
//   • test 4 → matrixAccounts[1] — WTA  (FREE_DATA_* only)
// A test is REGISTERED only when its position has an account — if the array is
// shorter (e.g. an exact key resolves to one account), the extra test is not
// created at all (it does not run and does not show as skipped).
const matrixAccounts = buildTEAccountsFromMatrix(TEST_ACCOUNT);
const [firstAccount, secondAccount, thirdAccount, fourthAccount] =
  matrixAccounts;

/**
 * Free-data SKUs can land on homepage or chromeless setup after login.
 * Direct URL navigation to Time Entries is reliable; submenu hover can be
 * blocked by overlays or redirect into platform onboarding.
 */
async function loginFreeDataAccount(
  page: Page,
  credentials: LoginCredentials,
): Promise<void> {
  await openQBOTETab(page, credentials);
  await dismissQboOnboardingIfVisible(page).catch(() => undefined);

  const teTabPage = new TETimeEntriesTabPage(page);
  await dismissTasksDrawerIfVisible(page);

  const gridReady = await ensureTimeEntriesGridReady(page, teTabPage);

  if (!gridReady) {
    throw new Error(
      `[TE] Time Entries grid not ready after login — url=${page.url()}`,
    );
  }
}

test.describe('Time Entries Tab End-to-End', () => {
  // Notes of any entries created during a test. Lives at describe scope so the
  // afterEach below can clean them up even if a test times out or fails partway
  // (Playwright runs afterEach after a timeout; a try/finally in the test body
  // would not). cleanupCreatedEntries also deletes all known TE01 notes as a
  // fallback, so cleanup is robust even if a run dies before recording anything.
  let createdEntries: string[] = [];

  test.describe('With cleanup', () => {
    test.afterEach(async ({ page }) => {
      console.log('starting cleanup:');
      await cleanupCreatedSTAEntries(page, createdEntries);
      await cleanupCreatedWTAEntries(page, createdEntries);
      await cleanupCreatedEntries(page, createdEntries);
      createdEntries = [];
    });

    // Test 1 — uses the FIRST account in the array (not registered for FREE_DATA_*).
    if (!isFreeDataAccount && firstAccount) {
      const { testId, account } = firstAccount;
      test(`[${testId}] Time Entries Tab : STE End to End Flow`, async ({
        page,
      }) => {
        await openQBOTETab(page, account.credentials);
        await runSTEFullSuite(page, account, createdEntries);
      });
    }

    // Test 2 — uses the SECOND account in the array (not registered for FREE_DATA_*).
    if (!isFreeDataAccount && secondAccount) {
      const { testId, account } = secondAccount;
      test(`[${testId}] Time Entries Tab : WTE End to End Flow`, async ({
        page,
      }) => {
        await openQBOTETab(page, account.credentials);
        await runWTEFullSuite(page, account, createdEntries);
      });
    }

    // STA — FREE_DATA_* only; index 0 (FDAF01 / FDEF01 / FDPF01).
    if (isFreeDataAccount && firstAccount) {
      const { testId, account } = firstAccount;
      test(`[${testId}] Single Time Activity : STA End to End Flow`, async ({
        page,
      }) => {
        await loginFreeDataAccount(page, account.credentials);
        await runSTAFDFullSuite(page, account, createdEntries);
      });
    }

    // WTA — FREE_DATA_* only; index 1 (FDAF02 / FDEF02 / FDPF02).
    if (isFreeDataAccount && secondAccount) {
      const { testId, account } = secondAccount;
      test(`[${testId}] Weekly Time Activity : WTA End to End Flow`, async ({
        page,
      }) => {
        await loginFreeDataAccount(page, account.credentials);
        await runWTAFDFullSuite(page, account, createdEntries);
      });
    }

    // Test 3 — uses the THIRD account in the array (index 2 ).
    if (thirdAccount) {
      const { testId, account } = thirdAccount;
      test(`[${testId}] Time Entries Tab : Time Clock End to End Flow`, async ({
        page,
      }) => {
        await openQBOTETab(page, account.credentials);
        await runTimeClockSuite(page, account, createdEntries);
      });
    }
  });

  // Test 4 — uses the FOURTH account in the array (index 3). Runs the Breaks
  // suite. Intentionally OUTSIDE the 'With cleanup' describe so the afterEach
  // above does not run for it.
  if (fourthAccount) {
    const { testId, account } = fourthAccount;
    test(`[${testId}] Time Entries Tab : Breaks End to End Flow`, async ({
      page,
    }) => {
      await openQBOTETab(page, account.credentials);
      await runBreaksFullSuite(page, account);
    });
  }
});
