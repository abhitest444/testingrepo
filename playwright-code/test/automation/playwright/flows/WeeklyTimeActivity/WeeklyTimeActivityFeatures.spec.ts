import { Page, test } from '@playwright/test';
import { LABELS, USER_ROLES } from '../../utils';
import {
  WeeklyTAFeaturesTest,
  WeeklyTAValidationTest,
} from '../Util/WeeklyTimeActivityFeatures.utils';

// once the login and after that all the test should run
// This describe blocks contains all roles with no acces
test.describe(`${LABELS.Weekly}`, () => {
  test.describe(`${LABELS.Features}`, () => {
    test(`${USER_ROLES.expenseManager}`, async ({ page }) => {
      await WeeklyTAValidationTest(page, USER_ROLES.expenseManager);
    });

    test(`${USER_ROLES.inventoryManager}`, async ({ page }) => {
      await WeeklyTAValidationTest(page, USER_ROLES.inventoryManager);
    });

    test(`${USER_ROLES.accountsPayableManager}`, async ({ page }) => {
      await WeeklyTAValidationTest(page, USER_ROLES.accountsPayableManager);
    });

    test(`${USER_ROLES.qbPlus}`, async ({ page }) => {
      await WeeklyTAValidationTest(page, USER_ROLES.qbPlus);
    });

    // Due to this issue commented https://jira.intuit.com/browse/QUANTA-2435
    // test(`${USER_ROLES.qbAdvanced}`, async ({ page }) => {
    //   test.info().fixme(true, 'https://jira.intuit.com/browse/QUANTA-2435');
    //   await WeeklyTAValidationTest(page, USER_ROLES.qbAdvanced);
    // });

    test(`${USER_ROLES.qbEssential}`, async ({ page }) => {
      await WeeklyTAValidationTest(page, USER_ROLES.qbEssential);
    });

    test(`${USER_ROLES.standardNoAcces}`, async ({ page }) => {
      await WeeklyTAValidationTest(page, USER_ROLES.standardNoAcces);
    });

    test(`${USER_ROLES.viewCompanyReports}`, async ({ page }) => {
      await WeeklyTAValidationTest(page, USER_ROLES.viewCompanyReports);
    });
  });
});

// This describe blocks contains all roles having acces
test.describe(`${LABELS.Weekly}`, () => {
  test.describe(`${LABELS.Features}`, () => {
    test(`${USER_ROLES.companyAdmin}`, async ({ page }) => {
      await WeeklyTAFeaturesTest(page, USER_ROLES.companyAdmin);
    });

    // test(`${USER_ROLES.inHouseAccountant}`, async ({ page }) => {
    //   await WeeklyTAFeaturesTest(page, USER_ROLES.inHouseAccountant);
    // });

    test(`${USER_ROLES.salesManager}`, async ({ page }) => {
      await WeeklyTAFeaturesTest(page, USER_ROLES.salesManager);
    });

    test(`${USER_ROLES.standardAllAccess}`, async ({ page }) => {
      await WeeklyTAFeaturesTest(page, USER_ROLES.standardAllAccess);
    });

    // Due to this issue commented https://jira.intuit.com/browse/QUANTA-1840
    // test(`${USER_ROLES.accountsReceivableManager}`, async ({ page }) => {
    //   test.info().fixme(true, 'https://jira.intuit.com/browse/QUANTA-1840');
    //   await WeeklyTAFeaturesTest(page, USER_ROLES.accountsReceivableManager);
    // });

    test(`${USER_ROLES.hrManager}`, async ({ page }) => {
      await WeeklyTAFeaturesTest(page, USER_ROLES.hrManager);
    });

    test(`${USER_ROLES.qbPlusWithTimePremium}`, async ({ page }) => {
      await WeeklyTAFeaturesTest(page, USER_ROLES.qbPlusWithTimePremium);
    });

    test(`${USER_ROLES.qbAdvancedWithTimeElite}`, async ({ page }) => {
      await WeeklyTAFeaturesTest(page, USER_ROLES.qbAdvancedWithTimeElite);
    });

    test(`${USER_ROLES.qbEssentialsWithPayrollPremium}`, async ({ page }) => {
      await WeeklyTAFeaturesTest(
        page,
        USER_ROLES.qbEssentialsWithPayrollPremium,
      );
    });

    test(`${USER_ROLES.qbAdvancedWithPayrollElite}`, async ({ page }) => {
      await WeeklyTAFeaturesTest(page, USER_ROLES.qbAdvancedWithPayrollElite);
    });

    test(`${USER_ROLES.cAQlQBPlusCanada}`, async ({ page }) => {
      await WeeklyTAFeaturesTest(page, USER_ROLES.cAQlQBPlusCanada);
    });

    test(`${USER_ROLES.timeTrackOnly}`, async ({ page }) => {
      await WeeklyTAFeaturesTest(page, USER_ROLES.timeTrackOnly);
    });

    //Commented due to RBAC issues
    /*test(`${USER_ROLES.payrollManager}`, async ({ page }) => {
        await WeeklyTAFeaturesTest1(page, USER_ROLES.payrollManager);
      });*/
  });
});
