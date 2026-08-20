import { test, expect } from '@playwright/test';
import { getTestAccount } from '../../config/accounts';
import { openQBOTS } from '../../pages/QBOLogin';
import {
  verifyApprovalsInTimeTab,
  verifyApprovalsNavigationFromTimeEntriesTab,
  verifyViewDetailsLinkInApprovals,
  validateTeamMemberSearchInApprovals,
  validateRunPayrollFlowInApprovals,
  ApprovalsRunpayrollcleanup,
} from '../Util/TimeEntries.util';
import {
  navigateToApprovals,
  preTestCleanup,
  postTestCleanup,
  testApproveAndUnapproveFromApprovals,
  testViewDetailsApprovalAndEditVerification,
  testSelectDeselectAndApproveViaBanner,
  testAddBreakAndWTEFromApprovals,
  testBulkApproveAll,
} from '../Util/Approvals.util';

/**
 * Time Approvals Test Cases
 * URL: /app/time/approval?jobId=time
 *
 * Test Coverage:
 * - APT01: Verify Approvals in Time Tab
 * - APT02: Verify Approvals navigation from Time Entries Tab
 * - APT03: Verify View details link in Approvals
 * - APT04-05: Approve and UnApprove Entries from Approvals
 * - APT06-07-13: Approve/UnApprove from View Details + Edit Verification (combined)
 * - APT08: Select & deselect employee and approve time via action banner
 * - APT10-11: Add Break and WTE from Approvals (combined)
 * - APT12: Bulk approve multiple employees (select all)
 * - APT14: Team member search - valid/invalid
 * - APT15: Validate Run Payroll flow in approvals page
 */

test.describe('Approvals Test Cases', () => {
  // Account mapping for our new cases
  const caseAccountMap: Record<string, string> = {
    'APT04-05': 'APT001',
    'APT06-07-13': 'APT002',
    APT08: 'APT003',
    'APT10-11': 'APT004', // Has manual break configured
    APT12: 'APT005',
  };
  const newCases = Object.keys(caseAccountMap);

  test.beforeEach(async ({ page }, testInfo) => {
    const testId = testInfo.title.split(' ')[0];

    // Use mapped account for new cases, otherwise use test ID
    const matchedCase = newCases.find((c) => testInfo.title.includes(c));
    const accountId = matchedCase ? caseAccountMap[matchedCase] : testId;

    const credentials = getTestAccount(accountId);
    console.log(`[${testId}] Logging in with account: ${credentials.username}`);

    await openQBOTS(page, credentials);
    console.log('Login successful');

    // Pre-test cleanup
    try {
      if (testId === 'APT15') {
        await ApprovalsRunpayrollcleanup(page);
      }
      if (newCases.some((c) => testInfo.title.includes(c))) {
        await navigateToApprovals(page);
        await preTestCleanup(page);
      }
    } catch (error) {
      console.log('Pre-test cleanup failed:', error);
    }
  });

  test.afterEach(async ({ page }, testInfo) => {
    const testId = testInfo.title.split(' ')[0];

    console.log('Starting post-test cleanup...');
    try {
      if (testId === 'APT15') {
        await ApprovalsRunpayrollcleanup(page);
      }
      if (newCases.some((c) => testInfo.title.includes(c))) {
        await postTestCleanup(page);
      }
    } catch (error) {
      console.log('Post-test cleanup failed:', error);
    }
  });

  // ==================== UI Navigation Cases ====================

  test('APT01 - Verify Approvals in Time Tab', async ({ page }) => {
    await verifyApprovalsInTimeTab(page);
  });

  test('APT02 - Verify Approvals navigation from Time entries Tab', async ({
    page,
  }) => {
    await verifyApprovalsNavigationFromTimeEntriesTab(page);
  });

  test('APT03 - Verify View details link in Approvals', async ({ page }) => {
    await verifyViewDetailsLinkInApprovals(page);
  });

  test('APT04-05 - Approve and UnApprove Entries from Approvals', async ({
    page,
  }) => {
    await testApproveAndUnapproveFromApprovals(page);
  });

  test('APT06-07-13 - View Details: Approve, Unapprove, and Edit Verification', async ({
    page,
  }) => {
    await testViewDetailsApprovalAndEditVerification(page);
  });

  test('APT08 - Select Deselect Employee and Approve via Banner', async ({
    page,
  }) => {
    await testSelectDeselectAndApproveViaBanner(page);
  });

  test('APT10-11 - Add Break and WTE from Approvals', async ({ page }) => {
    await testAddBreakAndWTEFromApprovals(page);
  });

  test('APT12 - Bulk Approve All', async ({ page }) => {
    await testBulkApproveAll(page);
  });

  test('APT14 - Validate Team Member Search in approvals page - Valid/Invalid Search', async ({
    page,
  }) => {
    await validateTeamMemberSearchInApprovals(page);
  });

  test('APT15 - Validate Run Payroll flow in approvals page', async ({
    page,
  }) => {
    await validateRunPayrollFlowInApprovals(page);
  });
});
