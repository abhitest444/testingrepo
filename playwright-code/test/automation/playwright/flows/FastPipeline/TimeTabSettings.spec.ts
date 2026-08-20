import { test } from '@playwright/test';

import { openQBOTS } from '../../pages/QBOLogin';
import {
  buildTimeTabAccountsFromMatrix,
  validateAllTimeTabSettings,
  validateFreeDataTimeTabSettings,
} from '../Util/TimeTabSettings.Util';

const TEST_ACCOUNT = process.env.TEST_ACCOUNT;

// FREE_DATA companies show a minimal Time tab (General + Timesheet only), so they
// run a different validation than the full card-based tab.
const FREE_DATA_ACCOUNT_KEYS = [
  'FREE_DATA_ADV',
  'FREE_DATA_ESSENTIAL',
  'FREE_DATA_PLUS',
] as const;
const isFreeDataAccount = FREE_DATA_ACCOUNT_KEYS.includes(
  TEST_ACCOUNT as (typeof FREE_DATA_ACCOUNT_KEYS)[number],
);

// Resolve the selector into its ordered account array; the test picks BY POSITION.
const matrixAccounts = buildTimeTabAccountsFromMatrix(TEST_ACCOUNT);
const [firstAccount] = matrixAccounts;

test.describe('Time Tab Settings — all cards', () => {
  if (firstAccount) {
    const { testId, credentials } = firstAccount;
    test(`[${testId}] Verify Time tab End-to-End Flows`, async ({ page }) => {
      await openQBOTS(page, credentials);
      if (isFreeDataAccount) {
        // Free-data: only General + Timesheet cards; all others must be hidden.
        await validateFreeDataTimeTabSettings(page);
      } else {
        await validateAllTimeTabSettings(page);
      }
    });
  }
});
