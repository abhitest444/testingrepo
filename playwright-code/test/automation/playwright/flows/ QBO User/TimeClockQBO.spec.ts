import { test } from '@playwright/test';
import { getTestAccount } from '../../config/accounts';
import { openQBOTE } from '../../pages/QBOLogin';
import { validateTimeClockPriorityCasesForQBOUsers } from '../Util/PriorityCasesOTX.util';

/**
 * =============================================================================
 * Time Clock — QBO user cases across SKUs
 * =============================================================================
 *
 * Runs the existing Time Clock QBO-user case
 * (`validateTimeClockPriorityCasesForQBOUsers`) once per QBO account/SKU. The
 * account key is the first token of the test title (`<key> - …`), resolved via
 * getTestAccount. Every key here is a QBO multi-company account, so login uses
 * the fast company picker.
 *
 *   TCPQBO01            — QB Adv Payroll Elite (existing)
 *   TCQBO_PAYPREM       — QB Adv Payroll Premium
 *   TCQBO_TIMEPREM      — QB Adv Time Premium
 *   TCQBO_TIMEELITE     — QB Time Elite
 *   TCQBO_IESPREM       — IES Payroll Premium
 *   TCQBO_UKPAYELITE    — UK QB Adv Payroll Elite
 * =============================================================================
 */
const TC_QBO_ACCOUNTS = [
  'TCPQBO01',
  'TCQBO_PAYPREM',
  'TCQBO_TIMEPREM',
  'TCQBO_TIMEELITE',
  'TCQBO_IESPREM',
  'TCQBO_UKPAYELITE',
];

test.describe('TimeClock - QBO users', () => {
  for (const testId of TC_QBO_ACCOUNTS) {
    test(`${testId} - Time Clock priority cases for QBO users`, async ({
      page,
    }) => {
      const credentials = getTestAccount(testId);
      // Fast company picker: every account here is a multi-company QBO login.
      await openQBOTE(page, credentials, false, true);
      await validateTimeClockPriorityCasesForQBOUsers(page);
    });
  }
});
