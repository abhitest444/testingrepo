import { test } from '@playwright/test';
import { openQBOTETab } from '../../pages/QBOLogin';
import { TimeActivityExperience } from '../../config/types';
import {
  runWTAFullSuite,
  buildWTAAccountsFromMatrix,
  cleanupCreatedActivities,
} from '../Util/FastPipeline/WeeklyTimeActivityFlows.Util';
import {
  runWTALegacySuite,
  cleanupWTALegacyEntries,
} from '../Util/FastPipeline/WeeklyTimeActivityLegacyFlows.Util';

/** Matrix selector for this run — set by the Groovy/Jenkins job. */
const TEST_ACCOUNT = process.env.TEST_ACCOUNT;

// Resolve the selector into its ordered account array and bind test 1 to the
// FIRST account (index 0). Registered only when an account exists there.
const matrixAccounts = buildWTAAccountsFromMatrix(TEST_ACCOUNT);
const [firstAccount] = matrixAccounts;

// Payroll First companies use the LEGACY classic weekly-grid experience; every
// other SKU uses the new trowser suite.
const isLegacy =
  firstAccount?.account.credentials.timeActivityExperience ===
  TimeActivityExperience.Legacy;

test.describe('WTA01 - Weekly Time Activity End-to-End', () => {
  // afterEach (describe scope) so cleanup runs on pass, failure, AND timeout.
  test.afterEach(async ({ page }) => {
    console.log('starting cleanup:');
    if (isLegacy) {
      await cleanupWTALegacyEntries(page);
    } else {
      await cleanupCreatedActivities(page);
    }
  });

  if (firstAccount) {
    const { testId, account } = firstAccount;
    const title = isLegacy
      ? `[${testId}] Weekly Time Activity (Legacy / Payroll First) : Classic weekly grid, Customer/job, Daily durations, Save/Reset, CRUD (list-verified)`
      : `[${testId}] Weekly Time Activity : Create, Billable/Bill rate, Taxable, Multi-day, Save variants, Edit, Reopen, Reports, Validation, Delete`;
    test(title, async ({ page }) => {
      await openQBOTETab(page, account.credentials);
      if (isLegacy) {
        await runWTALegacySuite(page, account);
      } else {
        await runWTAFullSuite(page, account);
      }
    });
  }
});
