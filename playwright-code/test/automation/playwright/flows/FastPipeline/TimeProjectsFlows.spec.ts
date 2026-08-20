import { test } from '@playwright/test';
import { openQBOTETab } from '../../pages/QBOLogin';
import {
  runTPFullSuite,
  buildTPAccountsFromMatrix,
  cleanupCreatedProjects,
} from '../Util/FastPipeline/TimeProjectsFlows.Util';

/** Matrix selector for this run — set by the Groovy/Jenkins job. */
const TEST_ACCOUNT = process.env.TEST_ACCOUNT;

// Resolve the selector into its ordered account array and bind test 1 to the
// FIRST account (index 0). Registered only when an account exists there.
const matrixAccounts = buildTPAccountsFromMatrix(TEST_ACCOUNT);
const [firstAccount] = matrixAccounts;

test.describe('TP01 - Time Projects Tab End-to-End', () => {
  // Cap per-action time to 30s. The global config sets actionTimeout to 5 min,
  // so any click/fill on a missing/non-actionable element used to hang the full
  // 5 min; 30s is ample for a single prod UI action and fails fast otherwise.
  test.use({ actionTimeout: 30000 });

  // Projects created during a test — at describe scope so afterEach cleans them
  // up even on failure/timeout. Reset at the start of each test.
  let createdProjects: string[] = [];

  test.afterEach(async ({ page }) => {
    console.log('starting cleanup:');
    await cleanupCreatedProjects(page, createdProjects);
    createdProjects = [];
  });

  if (firstAccount) {
    const { testId, account } = firstAccount;
    test(`[${testId}] Time Projects Tab : Login, Navigation, Structure, Create, Estimates, Workers, Cleanup`, async ({
      page,
    }) => {
      createdProjects = [];
      await openQBOTETab(page, account.credentials);
      await runTPFullSuite(page, account, createdProjects);
    });
  }
});
