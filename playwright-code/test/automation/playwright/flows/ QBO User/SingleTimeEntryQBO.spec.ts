import { test } from '@playwright/test';
import { getTestAccount } from '../../config/accounts';
import { openQBOTE } from '../../pages/QBOLogin';
import { addEditViewSte } from '../Util/TimeEntries.util';

/**
 * =============================================================================
 * Single Time Entry (STE) — QBO user cases across SKUs
 * =============================================================================
 *
 * Runs the existing STE QBO-user case (`addEditViewSte` against Time Entries →
 * Single time entry) once per QBO account/SKU. The account key is the first
 * token of the test title (`<key> - …`), resolved via getTestAccount. Every key
 * here is a QBO multi-company account, so login uses the fast company picker.
 *
 *   STEPQBO01           — QB Adv Payroll Elite (existing)
 *   STEQBO_PAYPREM      — QB Adv Payroll Premium
 *   STEQBO_TIMEPREM     — QB Adv Time Premium
 *   STEQBO_TIMEELITE    — QB Time Elite
 *   STEQBO_IESPREM      — IES Payroll Premium
 *   STEQBO_UKPAYELITE   — UK QB Adv Payroll Elite
 * =============================================================================
 */
const STE_QBO_ACCOUNTS = [
  'STEPQBO01',
  'STEQBO_PAYPREM',
  'STEQBO_TIMEPREM',
  'STEQBO_TIMEELITE',
  'STEQBO_IESPREM',
  'STEQBO_UKPAYELITE',
];

test.describe('SingleTimeEntry - QBO users', () => {
  for (const testId of STE_QBO_ACCOUNTS) {
    test(`${testId} - STE (Time Entries) QBO user`, async ({ page }) => {
      const credentials = getTestAccount(testId);
      // Fast company picker: every account here is a multi-company QBO login.
      await openQBOTE(page, credentials, false, true);
      await addEditViewSte(page, {
        teamMemberTypeLabel: 'QBO user',
        // Name column is display text; sign-in email is optional — list
        // display-friendly substrings first.
        timeEntriesTableEmployeeMatch: [
          'cadmin',
          ...(credentials.username ? [credentials.username] : []),
        ],
      });
    });
  }
});
