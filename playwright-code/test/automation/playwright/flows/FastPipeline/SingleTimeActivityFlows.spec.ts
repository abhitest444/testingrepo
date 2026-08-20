import { test } from '@playwright/test';
import { openQBOTETab } from '../../pages/QBOLogin';
import { TimeActivityExperience } from '../../config/types';
import {
  runSTAFullSuite,
  buildSTAAccountsFromMatrix,
  cleanupCreatedActivities,
} from '../Util/FastPipeline/SingleTimeActivityFlows.Util';
import {
  runSTALegacySuite,
  cleanupSTALegacyEntries,
} from '../Util/FastPipeline/SingleTimeActivityLegacyFlows.Util';

/** Matrix selector for this run — set by the Groovy/Jenkins job. */
const TEST_ACCOUNT = process.env.TEST_ACCOUNT;

// Resolve the selector into its ordered account array and bind test 1 to the
// FIRST account (index 0). Registered only when an account exists there.
const matrixAccounts = buildSTAAccountsFromMatrix(TEST_ACCOUNT);
const [firstAccount] = matrixAccounts;

// Payroll First companies use the LEGACY "Add time" drawer experience; every
// other SKU uses the new trowser suite.
const isLegacy =
  firstAccount?.account.credentials.timeActivityExperience ===
  TimeActivityExperience.Legacy;

test.describe('STA01 - Single Time Activity End-to-End', () => {
  // afterEach (describe scope) so cleanup runs on pass, failure, AND timeout.
  test.afterEach(async ({ page }) => {
    console.log('starting cleanup:');
    if (isLegacy) {
      await cleanupSTALegacyEntries(page);
    } else {
      await cleanupCreatedActivities(page);
    }
  });

  if (firstAccount) {
    const { testId, account } = firstAccount;
    const title = isLegacy
      ? `[${testId}] Single Time Activity (Legacy / Payroll First) : Add-time drawer, Entry types, Save variants, CRUD (list-verified)`
      : `[${testId}] Single Time Activity : Create, Billable/Bill rate, Taxable, Start/End, Save variants, Edit, History, Reports, Validation, Delete`;
    test(title, async ({ page }) => {
      await openQBOTETab(page, account.credentials);
      if (isLegacy) {
        await runSTALegacySuite(page, account);
      } else {
        await runSTAFullSuite(page, account);
      }
    });
  }
});
