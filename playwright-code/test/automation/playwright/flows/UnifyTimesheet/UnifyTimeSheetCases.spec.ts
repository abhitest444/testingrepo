import { test } from '@playwright/test';
import { getRandomTestAccount, getTestAccount } from '../../config/accounts';
import { CompanyTier } from '../../config/types';
import { openQBOTS } from '../../pages/QBOLogin';
import {
  unifyTimeSheetCases,
  cleanupUnifyTimesheetTestData,
  comprehensiveDataValidation,
  sortingSearchColumnTests,
  startEndTimeTests,
  billableValidationTests,
  cleanupComprehensiveTests,
} from '../Util/UnifyTimesheet.util';

test.describe('Unify Timesheet Test Cases', () => {
  test.describe('Time Entry Validation Tests', () => {
    test.beforeEach(async ({ page }) => {
      // Get current test info
      const testInfo = test.info();
      // Login using test-specific credentials
      const testId = testInfo.title.split(' - ')[0];
      const credentials = getTestAccount(testId);
      console.log('Logging in with Elite credentials:', credentials.username);
      await openQBOTS(page, credentials);
      console.log('Login successful');
    });

    test.afterEach(async ({ page }) => {
      const testInfo = test.info();
      const testId = testInfo.title.split(' - ')[0];

      // Skip cleanup for tests that don't create data
      if (testId === 'UNITC07') {
        console.log(
          'Skipping cleanup - no data created (billable validation only)',
        );
        return;
      }

      console.log('Starting post-test cleanup...');
      try {
        await cleanupUnifyTimesheetTestData(page);
        console.log('Post-test cleanup completed successfully');
      } catch (error) {
        console.log('Post-test cleanup failed:', error);
        // Don't fail the test due to cleanup issues
      }
    });

    test('UNITC01 - QB Advanced - Unify Timesheet: STA/WTE, Time Entries, Invoice, Audit Log, Projects, Reports', async ({
      page,
    }) => {
      // Get current test credentials to determine company tier
      const testInfo = test.info();
      const testId = testInfo.title.split(' - ')[0];
      const credentials = getTestAccount(testId);

      // Determine company tier (defaults to Paid if not specified)
      const companyTier = credentials.companyTier || CompanyTier.Paid;

      await unifyTimeSheetCases(page, companyTier, credentials.companyInfo);
      console.log('TEST PASSED: Unify Timesheet validation successful!');
    });

    /* To be uncommented when issues fixed related to permissions */
    test('UNITC02 - QB Time Plus - Unify Timesheet: STA/WTE, Time Entries, Invoice, Audit Log, Projects, Reports', async ({
      page,
    }) => {
      const testInfo = test.info();
      const testId = testInfo.title.split(' - ')[0];
      const credentials = getTestAccount(testId);
      const companyTier = credentials.companyTier || CompanyTier.Paid;

      await unifyTimeSheetCases(page, companyTier, credentials.companyInfo);
      console.log('TEST PASSED: Unify Timesheet validation successful!');
    });

    //   test('UNITC05 - QB Time Plus (Payroll Manager) - Unify Timesheet: STA/WTE, Time Entries, Invoice, Audit Log, Projects, Reports', async ({
    //     page,
    //   }) => {
    //     const testInfo = test.info();
    //     const testId = testInfo.title.split(' - ')[0];
    //     const credentials = getTestAccount(testId);
    //     const companyTier = credentials.companyTier || CompanyTier.Paid;

    //     await unifyTimeSheetCases(page, companyTier, credentials.companyInfo);
    //     console.log(
    //       'TEST PASSED: Unify Timesheet validation successful!',
    //     );
    //   });

    //   test('UNITC06 - QB Time Plus (Standard All Access) - Unify Timesheet: STA/WTE, Time Entries, Invoice, Audit Log, Projects, Reports', async ({
    //     page,
    //   }) => {
    //     const testInfo = test.info();
    //     const testId = testInfo.title.split(' - ')[0];
    //     const credentials = getTestAccount(testId);
    //     const companyTier = credentials.companyTier || CompanyTier.Paid;

    //     await unifyTimeSheetCases(page, companyTier, credentials.companyInfo);
    //     console.log(
    //       'TEST PASSED: Unify Timesheet validation successful!',
    //     );
    //   });

    test('UNITC03 - QB Time Essential - Unify Timesheet: STA/WTE, Time Entries, Invoice, Audit Log, Projects, Reports', async ({
      page,
    }) => {
      const testInfo = test.info();
      const testId = testInfo.title.split(' - ')[0];
      const credentials = getTestAccount(testId);
      const companyTier = credentials.companyTier || CompanyTier.Paid;

      await unifyTimeSheetCases(page, companyTier, credentials.companyInfo);
      console.log('TEST PASSED: Unify Timesheet validation successful!');
    });

    //   test('UNITC07 - QB Time Essential (Payroll Manager) - Unify Timesheet: STA/WTE, Time Entries, Invoice, Audit Log, Projects, Reports', async ({
    //     page,
    //   }) => {
    //     const testInfo = test.info();
    //     const testId = testInfo.title.split(' - ')[0];
    //     const credentials = getTestAccount(testId);
    //     const companyTier = credentials.companyTier || CompanyTier.Paid;

    //     await unifyTimeSheetCases(page, companyTier, credentials.companyInfo);
    //     console.log(
    //       'TEST PASSED: Unify Timesheet validation successful!',
    //     );
    //   });

    //   test('UNITC08 - QB Time Essential (Standard All Access) - Unify Timesheet: STA/WTE, Time Entries, Invoice, Audit Log, Projects, Reports', async ({
    //     page,
    //   }) => {
    //     const testInfo = test.info();
    //     const testId = testInfo.title.split(' - ')[0];
    //     const credentials = getTestAccount(testId);
    //     const companyTier = credentials.companyTier || CompanyTier.Paid;

    //     await unifyTimeSheetCases(page, companyTier, credentials.companyInfo);
    //     console.log(
    //       'TEST PASSED: Unify Timesheet validation successful!',
    //     );
    //   });

    // test('UNITC04 - QB Time SimpleStart - Unify Timesheet: STA/WTE, Time Entries, Invoice, Audit Log, Projects, Reports', async ({
    //   page,
    // }) => {
    //   const testInfo = test.info();
    //   const testId = testInfo.title.split(' - ')[0];
    //   const credentials = getTestAccount(testId);
    //   const companyTier = credentials.companyTier || CompanyTier.Paid;

    //   await unifyTimeSheetCases(page, companyTier, credentials.companyInfo);
    //   console.log('TEST PASSED: Unify Timesheet validation successful!');
    // });

    test('UNITC08 - Billable Duration Data Validation on Date, Employee and Report Screens', async ({
      page,
    }) => {
      await comprehensiveDataValidation(page);
      console.log('TEST PASSED: Billable duration data validation successful!');
    });

    test('UNITC09 - Sorting, Searching, and Column Visibility Validation', async ({
      page,
    }) => {
      await sortingSearchColumnTests(page);
      console.log(
        'TEST PASSED: Sorting, search, and column visibility tests successful!',
      );
    });

    test('UNITC10 - Add, Edit, Delete STA with Start/End Time', async ({
      page,
    }) => {
      await startEndTimeTests(page);
      console.log('TEST PASSED: Start/End time tests successful!');
    });

    test('UNITC07 - Billable Rate and Service Rate Override Validation and Summary Tests', async ({
      page,
    }) => {
      await billableValidationTests(page);
      console.log('TEST PASSED: Billable validation tests successful!');
    });

    test('UNITC05 - IES Standard Parent - Unify Timesheet: STA/WTE, Time Entries, Invoice, Audit Log, Projects, Reports', async ({
      page,
    }) => {
      const testInfo = test.info();
      const testId = testInfo.title.split(' - ')[0];
      const credentials = getTestAccount(testId);
      const companyTier = credentials.companyTier || CompanyTier.Paid;

      await unifyTimeSheetCases(page, companyTier, credentials.companyInfo);
      console.log('TEST PASSED: Unify Timesheet validation successful!');
    });

    test('UNITC06 - IES Standard Child - Unify Timesheet: STA/WTE, Time Entries, Invoice, Audit Log, Projects, Reports', async ({
      page,
    }) => {
      const testInfo = test.info();
      const testId = testInfo.title.split(' - ')[0];
      const credentials = getTestAccount(testId);
      const companyTier = credentials.companyTier || CompanyTier.Paid;

      await unifyTimeSheetCases(page, companyTier, credentials.companyInfo);
      console.log('TEST PASSED: Unify Timesheet validation successful!');
    });
  });
});
