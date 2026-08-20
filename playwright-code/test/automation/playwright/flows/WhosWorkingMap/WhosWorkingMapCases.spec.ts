import { test, Page, expect } from '@playwright/test';
import { getTestAccount } from '../../config/accounts';
import { openQBOTE } from '../../pages/QBOLogin';
import {
  setupCompleteTestData,
  teardownCompleteTestData,
  TestDataContext,
  validateNavigationAndCloseMethods,
  validateCompleteUI,
  validateSearchFilterAndTarget,
  validateTimeEntryActions,
  validateWorkerListInteractions,
  validateMultipleClockedInEmployees,
  editTimeAndValidateOnTimeEntries,
  addTimeSTEAndValidateOnTimeEntries,
  addBreakAndValidateOnTimeEntries,
  cleanupTestEntriesViaUI,
  validateErrorHandling,
  validateEmployeeLocationScenarios,
} from '../Util/WhosWorkingMap.util';
import TimeEntriesPage from '../../pages/TimeEntriesPage';

/**
 * Who's Working Map Test Cases
 *
 * Test ID Mapping (CSV Test IDs → Account IDs):
 * - QL_WM001, QL_WM006, QL_WM031 → WWM001 (Navigation, Empty State, Close)
 * - QL_WM002-005, QL_WM011, QL_WM018, QL_WM032, QL_WM040 → WWM002 (Complete UI)
 * - QL_WM007, QL_WM009-016 → WWM003 (Search, Filter, Target)
 * - QL_WM021 → WWM004 (Time Entry Actions)
 * - QL_WM029 → WWM005 (Worker List Interactions)
 * - QL_WM042 → WWM006 (Multiple Employees, Breaks Integration)
 * - QL_WM039 → WWM007 (Error Handling)
 * - QL_WM008 → WWM002 (Employee location scenarios: same & different locations)
 */

test.describe("Who's Working Map - Test Cases", () => {
  let page: Page;
  let testContext: TestDataContext | null = null;
  let isProdEnvironment = false;

  test.beforeEach(async ({ browser }, testInfo) => {
    page = await browser.newPage();

    // Extract test ID from test title - supports both QL_WM### and WWM### formats
    // Map QL_WM test IDs to WWM account IDs for credential lookup
    const qlMatch = testInfo.title.match(/QL_WM(\d{3})/);
    const wwmMatch = testInfo.title.match(/WWM(\d{3})/);

    let testId = 'WWM001'; // default
    if (qlMatch) {
      // Map QL_WM test IDs to WWM account IDs
      const qlNum = parseInt(qlMatch[1], 10);
      if ([1, 6, 31].includes(qlNum)) testId = 'WWM001';
      else if ([2, 3, 4, 5, 8, 11, 18, 32, 40].includes(qlNum))
        testId = 'WWM002'; // Added 8 for location tests
      else if ([7, 9, 10, 12, 13, 14, 15, 16].includes(qlNum))
        testId = 'WWM003';
      else if (qlNum === 21) testId = 'WWM004';
      else if (qlNum === 29) testId = 'WWM005';
      else if (qlNum === 42) testId = 'WWM006';
      else if (qlNum === 39) testId = 'WWM007';
      else testId = `WWM00${Math.min(7, Math.ceil(qlNum / 6))}`;
    } else if (wwmMatch) {
      testId = `WWM${wwmMatch[1]}`;
    }

    // Get credentials using the test ID
    const credentials = getTestAccount(testId);
    console.log(`[${testId}] Logging in with account: ${credentials.username}`);

    // Login
    await openQBOTE(page, credentials);
    console.log('Login successful');

    // Detect environment (prod vs e2e) - prod URL doesn't contain 'e2e'
    const currentUrl = page.url();
    isProdEnvironment = !currentUrl.includes('e2e');
    console.log(`Environment: ${isProdEnvironment ? 'PROD' : 'E2E'}`);

    // Navigate to Time Entries page (where "View who's working" button is located)
    const timeEntriesPage = new TimeEntriesPage(page);
    await timeEntriesPage.navigateToTimeEntriesPage();
    await timeEntriesPage.waitForLoadingToDisappear();
    await timeEntriesPage.validateDisplayByDropdownVisible();
    console.log('Navigated to Time Entries page');

    // Only setup location data for tests that need it
    // Navigation/Empty State and Error Handling tests don't need location data
    const testsNeedingLocationData = [
      'WWM002', // Complete UI
      'WWM003', // Search, Filter, Target
      'WWM004', // Time Entry Actions
      'WWM005', // Worker List
      'WWM006', // Multiple Employees
    ];

    if (testsNeedingLocationData.includes(testId)) {
      console.log(
        `[${testId}] Setting up test data (clock in + location points)...`,
      );
      // Wait longer for app/shell to fully initialize before making GraphQL calls
      await page.waitForTimeout(5000);

      try {
        testContext = await setupCompleteTestData(page, {
          employeeName: 'Emp1', // Explicitly select Test Emp1
          numberOfLocationPoints: 10,
        });
      } catch (setupError: any) {
        if (isProdEnvironment && setupError.message?.includes('401')) {
          // PROD: GraphQL API auth failed - skip this test
          console.log(
            `⚠️ [${testId}] PROD: GraphQL setup failed (401) - skipping test`,
          );
          console.log(
            `  → Location points require GraphQL API which needs derived CSRF token`,
          );
          console.log(`  → Consider running this test only on E2E environment`);
          test.skip();
          return;
        }
        throw setupError;
      }
    } else {
      console.log(
        `[${testId}] Skipping test data setup (not needed for this test)`,
      );
      testContext = null; // Reset to prevent cleanup of previous test's data
    }
  });

  test.afterEach(async () => {
    // Cleanup test data if it was created
    if (testContext) {
      try {
        console.log('Cleaning up test data...');
        await teardownCompleteTestData(page, testContext, {
          clockOutFirst: true,
          deleteTimeEntry: true,
        });
      } catch (cleanupError) {
        console.log(
          '⚠️ Cleanup failed (may be expected on prod):',
          cleanupError,
        );
      }
    }

    if (page) {
      await page.close();
    }
  });

  /**
   * Test 1: QL_WM001, QL_WM006, QL_WM031
   * - QL_WM001: Validate Who's Working Map entry point is accessible from Time Entries
   * - QL_WM006: Validate Empty state displays when no workers are on clock
   * - QL_WM031: Validate Navigate back to Time Entries from map
   */
  test('QL_WM001: Navigation, Empty State, and Close Methods', async () => {
    await validateNavigationAndCloseMethods(page);
  });

  /**
   * Test 2: QL_WM002, QL_WM003, QL_WM004, QL_WM005, QL_WM011, QL_WM018, QL_WM032, QL_WM040
   * - QL_WM002: Validate map displays correct worker information
   * - QL_WM003: Validate Core map UI loads correctly
   * - QL_WM004: Validate Direction controls work correctly
   * - QL_WM005: Validate Satellite view toggle
   * - QL_WM011: Validate Core map UI search bar
   * - QL_WM018: Validate Location tracking details panel
   * - QL_WM032: Validate Map tooltip shows complete worker info
   * - QL_WM040: Validate Fullscreen map mode
   */
  test('QL_WM002: Complete UI Validation', async () => {
    await validateCompleteUI(page);
  });

  /**
   * Test 3: QL_WM007, QL_WM009, QL_WM010, QL_WM012-QL_WM016
   * - QL_WM007: Validate Target worker functionality
   * - QL_WM009: Validate Search functionality in Who's Working Map
   * - QL_WM010: Validate Search with no results
   * - QL_WM012: Validate Default filter selections
   * - QL_WM013: Validate Filter by clocked in/out status
   * - QL_WM014: Validate Filter by Team member/Group
   * - QL_WM015: Validate Filter by All employees
   * - QL_WM016: Validate Filter combinations work correctly
   */
  test('QL_WM007: Search, Filter, and Target Worker', async () => {
    await validateSearchFilterAndTarget(page);
  });

  /**
   * Test 4: QL_WM021
   * - QL_WM021: Validate Edit/Add time from map view
   */
  test('QL_WM021: Time Entry Actions', async () => {
    if (!testContext) {
      test.skip();
      return;
    }
    await validateTimeEntryActions(page, testContext.employee.displayName);
  });

  /**
   * Test 5: QL_WM029
   * - QL_WM029: Validate Time on clock display updates
   */
  test('QL_WM029: Worker List Interactions', async () => {
    if (!testContext) {
      test.skip();
      return;
    }
    await validateWorkerListInteractions(
      page,
      testContext.employee.displayName,
    );
  });

  /**
   * Test 6: QL_WM042
   * - QL_WM042: Validate Integration with breaks tracking
   * Also covers multiple clocked-in employees validation
   */
  test('QL_WM042: Multiple Employees and Entry Validation', async () => {
    // Test will be skipped in beforeEach if GraphQL setup fails on prod
    if (!testContext) {
      test.skip();
      return;
    }

    console.log('Testing multiple employees and entry validation...');

    // Setup second employee with clock-in and location points
    console.log('  Setting up second employee...');
    const context2 = await setupCompleteTestData(page, {
      employeeName: 'Emp2',
      numberOfLocationPoints: 5,
    });
    console.log(
      `  ✓ Second employee clocked in: ${context2.employee.displayName}`,
    );

    try {
      // Part 1: Validate multiple clocked-in employees on map
      await validateMultipleClockedInEmployees(
        page,
        testContext.employee.displayName,
        context2.employee.displayName,
      );

      // Part 2: Edit Time → STE → Validate on Time Entries
      const rowCount = await editTimeAndValidateOnTimeEntries(
        page,
        testContext.employee.displayName,
        'WWM Edit Test',
      );

      // Part 3: Add Time → STE → Validate on Time Entries
      await addTimeSTEAndValidateOnTimeEntries(
        page,
        rowCount,
        'WWM Add Time Test',
      );

      // Part 4: Add Break → Validate on Time Entries
      await addBreakAndValidateOnTimeEntries(page, 'test man');

      console.log('✅ Multiple employees and entry validation complete');
    } finally {
      console.log('  Cleaning up test data...');

      // Clock out both employees
      try {
        if (testContext) {
          await teardownCompleteTestData(page, testContext, {
            deleteTimeEntry: false,
          });
          console.log('    ✓ First employee clocked out');
        }
        await teardownCompleteTestData(page, context2, {
          deleteTimeEntry: false,
        });
        console.log('    ✓ Second employee clocked out');
      } catch (e) {
        console.log('    ⚠️ Could not clock out employees:', e);
      }

      // Delete all test entries via UI
      await cleanupTestEntriesViaUI(page, 50);
    }
  });

  /**
   * Test 7: QL_WM039
   * - QL_WM039: Validate Map handles GPS errors gracefully
   * Tests graceful degradation when API errors occur
   */
  // test('QL_WM039: Error Handling', async () => {
  //   const errorTestContext = await validateErrorHandling(page);

  //   // Cleanup if test data was created
  //   if (errorTestContext) {
  //     try {
  //       await teardownCompleteTestData(page, errorTestContext, {
  //         deleteTimeEntry: true,
  //       });
  //       console.log('  ✓ Error test data cleaned up');
  //     } catch (e) {
  //       console.log('  ⚠️ Could not cleanup error test data:', e);
  //     }
  //   }
  // });

  /**
   * Test 8: QL_WM008
   * - Validates Multiple people location handling on the map
   * - Part A: Two employees at SAME GPS coordinates (pins may overlap/cluster)
   * - Part B: Two employees at DIFFERENT locations (SF vs NY, map zooms to show both)
   */
  test('QL_WM008: Employee Location Scenarios (Same & Different)', async () => {
    await validateEmployeeLocationScenarios(page);
  });
});
