import { test } from '@playwright/test';
import { getTestAccount } from '../../config/accounts';
import { openWorkforce } from '../../pages/QBOLogin';
import {
  verifyAdminApprovesSteWorkforceShowsApproved,
  verifyAdminCreatesSteWorkforceDisplaysEntry,
  verifyAdminEditsSteWorkforceShowsUpdated,
  verifyAdminUnapprovesWorkforceShowsUnapproved,
  verifyBreakEntryCompleteFlow,
  verifyClockInOutFlow,
  verifyEditAndDeleteEntryFlow,
  verifyEmployeeCreatesAdminSeesEntry,
  verifySteCompleteFlow,
  verifyWorkforceLoginDashboardAndFilters,
  verifyWteCompleteFlow,
  verifyAdminCreatesBreakEntryWorkforceDisplaysEntry,
  verifyEmployeeCreatesBreakEntryAdminSeesEntry,
  verifyAdminApprovesWteWorkforceShowsApproved,
  verifyAdminClassAssignmentWorkforceSync,
  verifyAdminCustomerAssignmentWorkforceSync,
  verifyAdminCustomFieldAssignmentWorkforceSync,
  verifyAdminWteWorkforceSync,
} from '../Util/Workforce.Util';

/**
 * Workforce Web App P0 Test Cases
 * URL: https://workforce.intuit.com (prod) / https://workforce-e2e.intuit.com (preprod)
 *
 * Combined test cases to reduce navigation overhead:
 *
 * WF001: Login, Dashboard & Page Elements
 *   - Dashboard access validation (URL, My Profile, Time tracking nav)
 *   - Time tracking page elements visibility
 *   - Add time dropdown options (STE, WTE, Break)
 *   - Empty state validation
 *   - Filter dropdown options (Display by, Date range, Status)
 *
 * WF002: Clock In/Out Complete Flow
 *   - Clock in functionality
 *   - "Currently working" indicator
 *   - Clock out functionality
 *
 * WF003: Break Entry Complete Flow
 *   - Break drawer access & visibility
 *   - Add break with duration + validate on screen
 *   - Add break with start/end time + validate on screen
 *   - Edit break entry
 *   - Delete break entry
 *
 * WF004: STE Complete Flow
 *   - STE drawer access & visibility
 *   - Add STE with duration + validate on screen
 *   - Add STE with start/end time + validate on screen
 *   - Validate notes on screen
 *
 * WF005: Edit + Delete Entry Flow (merged former WF005 + WF006)
 *   - Create STE, edit duration, validate on screen, delete via action menu, validate removed, cleanup
 *
 * WF007: WTE Complete Flow
 *   - WTE drawer access & visibility
 *   - Add WTE with hours + validate on screen
 *   - Edit WTE entry
 *   - Delete WTE entry
 *
 * WF008–WF012: QBO Admin ↔ Workforce sync (second describe block below; no shared beforeEach)
 */

test.describe('Workforce Web App P0 Test Cases', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    const testId = testInfo.title.split(' ')[0];
    const credentials = getTestAccount(testId);
    console.log(`[${testId}] Logging in with account: ${credentials.username}`);

    await openWorkforce(page, credentials);
    console.log('Workforce login successful');
  });

  test('WF001 - Login, Dashboard & Page Elements', async ({ page }) => {
    await verifyWorkforceLoginDashboardAndFilters(page);
  });

  test('WF002 - Clock In/Out Complete Flow', async ({ page }) => {
    await verifyClockInOutFlow(page);
  });

  test('WF003 - Break Entry Complete Flow', async ({ page }) => {
    await verifyBreakEntryCompleteFlow(page);
  });

  test('WF004 - STE Complete Flow', async ({ page }) => {
    await verifySteCompleteFlow(page);
  });

  test('WF005 - Edit and delete entry flow', async ({ page }) => {
    await verifyEditAndDeleteEntryFlow(page);
  });

  test('WF007 - WTE Complete Flow', async ({ page }) => {
    await verifyWteCompleteFlow(page);
  });
});

/**
 * QBO Admin ↔ Workforce sync — uses browser + paired WF00x / WF00x_ADMIN accounts.
 */
test.describe('Workforce ↔ QBO Sync Test Cases', () => {
  test('WF008 - Admin Approves STE → Workforce Shows Approved', async ({
    browser,
  }) => {
    const adminCredentials = getTestAccount('WF008_ADMIN');
    const employeeCredentials = getTestAccount('WF008');
    const employeeName = 'Zack Efron';

    await verifyAdminApprovesSteWorkforceShowsApproved(
      browser,
      adminCredentials,
      employeeCredentials,
      employeeName,
    );
  });

  test('WF009 - Admin Creates STE → Workforce Displays Entry', async ({
    browser,
  }) => {
    const adminCredentials = getTestAccount('WF009_ADMIN');
    const employeeCredentials = getTestAccount('WF009');
    const employeeName = 'Tyrone Woodley';

    await verifyAdminCreatesSteWorkforceDisplaysEntry(
      browser,
      adminCredentials,
      employeeCredentials,
      employeeName,
    );
  });

  test('WF010 - Admin Edits STE → Workforce Shows Updated', async ({
    browser,
  }) => {
    const adminCredentials = getTestAccount('WF010_ADMIN');
    const employeeCredentials = getTestAccount('WF010');
    const employeeName = 'Karl Max';

    await verifyAdminEditsSteWorkforceShowsUpdated(
      browser,
      adminCredentials,
      employeeCredentials,
      employeeName,
    );
  });

  test('WF011 - Admin Unapproves → Workforce Shows Unapproved', async ({
    browser,
  }) => {
    const adminCredentials = getTestAccount('WF011_ADMIN');
    const employeeCredentials = getTestAccount('WF011');
    const employeeName = 'Henry Sean';

    await verifyAdminUnapprovesWorkforceShowsUnapproved(
      browser,
      adminCredentials,
      employeeCredentials,
      employeeName,
    );
  });

  test('WF012 - Employee Creates → Admin Sees Entry', async ({ browser }) => {
    const adminCredentials = getTestAccount('WF012_ADMIN');
    const employeeCredentials = getTestAccount('WF012');
    const employeeName = 'Walter White';

    await verifyEmployeeCreatesAdminSeesEntry(
      browser,
      adminCredentials,
      employeeCredentials,
      employeeName,
    );
  });

  test('WF015 - Admin Creates Break Entry → Workforce Displays Entry', async ({
    browser,
  }) => {
    const adminCredentials = getTestAccount('WF015_ADMIN');
    const employeeCredentials = getTestAccount('WF015');
    const employeeName = 'Test Emp1';

    await verifyAdminCreatesBreakEntryWorkforceDisplaysEntry(
      browser,
      adminCredentials,
      employeeCredentials,
      employeeName,
    );
  });

  test('WF019 - Employee Creates Break Entry → Admin Sees Entry', async ({
    browser,
  }) => {
    const adminCredentials = getTestAccount('WF019_ADMIN');
    const employeeCredentials = getTestAccount('WF019');
    const employeeName = 'Test Emp1';

    await verifyEmployeeCreatesBreakEntryAdminSeesEntry(
      browser,
      adminCredentials,
      employeeCredentials,
      employeeName,
    );
  });

  test('WF013 - Admin Assigns Customer → Workforce STE + WTE', async ({
    browser,
  }) => {
    await verifyAdminCustomerAssignmentWorkforceSync(
      browser,
      getTestAccount('WF013_ADMIN'),
      getTestAccount('WF013'),
      'Ashton Hall',
    );
  });

  test.fixme(
    'WF014 - Admin Assigns Class → Workforce STE + WTE',
    async ({ browser }) => {
      await verifyAdminClassAssignmentWorkforceSync(
        browser,
        getTestAccount('WF014_ADMIN'),
        getTestAccount('WF014'),
      );
    },
  );

  test('WF021 - Admin Assigns Custom Field Customers → Workforce STE + WTE', async ({
    browser,
  }) => {
    await verifyAdminCustomFieldAssignmentWorkforceSync(
      browser,
      getTestAccount('WF021_ADMIN'),
      getTestAccount('WF021'),
    );
  });

  test('WF017 - Admin WTE Create, Edit, Delete → Workforce', async ({
    browser,
  }) => {
    await verifyAdminWteWorkforceSync(
      browser,
      getTestAccount('WF017_ADMIN'),
      getTestAccount('WF017'),
    );
  });

  test('WF018 - Admin Approves WTE → Workforce Shows Approved', async ({
    browser,
  }) => {
    await verifyAdminApprovesWteWorkforceShowsApproved(
      browser,
      getTestAccount('WF018_ADMIN'),
      getTestAccount('WF018'),
      'Lloyd Matty',
    );
  });
});
