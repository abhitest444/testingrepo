import { test } from '@playwright/test';
import { getTestAccount } from '../../config/accounts';
import { openQBOTE } from '../../pages/QBOLogin';
import { validateWteQboUserLifecycle } from '../Util/WeeklyTimeEntry.util';

/**
 * =============================================================================
 * Weekly Time Entry (WTE) — QBO user cases across SKUs
 * =============================================================================
 *
 * Runs the existing WTE QBO-user lifecycle case (`validateWteQboUserLifecycle`,
 * WTE ↔ Time Entries) once per QBO account/SKU. The account key is the first
 * token of the test title (`<key> - …`), resolved via getTestAccount. Every key
 * here is a QBO multi-company account, so login uses the fast company picker.
 *
 *   WTEPQBO             — QB Adv Payroll Elite (existing)
 *   WTEQBO_PAYPREM      — QB Adv Payroll Premium
 *   WTEQBO_TIMEPREM     — QB Adv Time Premium
 *   WTEQBO_TIMEELITE    — QB Time Elite
 *   WTEQBO_IESPREM      — IES Payroll Premium
 *   WTEQBO_UKPAYELITE   — UK QB Adv Payroll Elite
 * =============================================================================
 */
const WTE_QBO_ACCOUNTS = [
  'WTEPQBO',
  'WTEQBO_PAYPREM',
  'WTEQBO_TIMEPREM',
  'WTEQBO_TIMEELITE',
  'WTEQBO_IESPREM',
  'WTEQBO_UKPAYELITE',
];

test.describe('WeeklyTimeEntry - QBO users', () => {
  for (const testId of WTE_QBO_ACCOUNTS) {
    test(`${testId} - Weekly time entry QBO user lifecycle (WTE ↔ Time Entries)`, async ({
      page,
    }) => {
      const credentials = getTestAccount(testId);
      // Fast company picker: every account here is a multi-company QBO login.
      await openQBOTE(page, credentials, false, true);
      await validateWteQboUserLifecycle(page, [
        'cadmin',
        ...(credentials.username ? [credentials.username] : []),
      ]);
    });
  }
});
