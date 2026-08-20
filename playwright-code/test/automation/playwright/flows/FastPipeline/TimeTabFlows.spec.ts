import { test } from '@playwright/test';
import { openQBOTETab } from '../../pages/QBOLogin';
import {
  buildTTAccountsFromMatrix,
  revertTimeTabSettingsChanges,
  runTimeTabSettingsSuite,
} from '../Util/FastPipeline/TimeTabFlow.Utils';
import { validateScheduleSettings } from '../Util/Schedule.Utils';

/** Matrix selector for this run — set by the Groovy/Jenkins job. */
const TEST_ACCOUNT = process.env.TEST_ACCOUNT;

// Resolve the selector into its ordered account array. For `TEST_ACCOUNT=PR_ELITE`
// the TT_ACCOUNT_MATRIX maps PR_ELITE -> ['TTEL01'], so this yields that account.
// The combined Time Settings suite is registered ONCE PER resolved account.
const matrixAccounts = buildTTAccountsFromMatrix(TEST_ACCOUNT);
const [firstAccount, secondAccount] = matrixAccounts;

test.describe('TT01 - Time Settings End-to-End', () => {
  let createdPolicies: string[] = [];

  test.afterEach(async ({ page }) => {
    await revertTimeTabSettingsChanges(page, createdPolicies);
    createdPolicies = [];
  });

  if (firstAccount) {
    const { testId, account } = firstAccount;
    test(`[${testId}] Time Settings : Approval Settings, Notifications, Overtime Policy End to End Flow`, async ({
      page,
    }) => {
      await openQBOTETab(page, account.credentials);
      await runTimeTabSettingsSuite(page, account, createdPolicies);
    });
  }

  if (secondAccount) {
    const { testId, account } = secondAccount;
    test(`[${testId}] Schedule : Schedule Prefrence & Settings E2E Flow`, async ({
      page,
    }) => {
      await openQBOTETab(page, account.credentials);
      await validateScheduleSettings(page);
    });
  }
});
