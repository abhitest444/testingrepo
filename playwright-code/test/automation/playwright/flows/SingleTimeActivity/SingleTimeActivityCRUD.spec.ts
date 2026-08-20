import { test } from '@playwright/test';
import { getLoginData } from '../../logins';
import SingleTimeActivityPage from '../../pages/SingleTimeActivityPage';
import {
  LABELS,
  setupAndNavigateSingleTA,
  testData,
  USER_ROLES,
} from '../../utils';
import { crudCases } from '../Util/SingleTimeActivityCRUD.util';

test.describe('SingleTimeEntry', () => {
  test.describe('CRUD', () => {
    test(`${USER_ROLES.companyAdmin}`, async ({ page }) => {
      const company = getLoginData(USER_ROLES.companyAdmin);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await crudCases(page);
      }
    });

    // Free data company admin flow for time summary
    test(`${USER_ROLES.freeDataCompanyAdmin}`, async ({ page }) => {
      const company = getLoginData(USER_ROLES.freeDataCompanyAdmin);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await crudCases(page);
      }
    });

    test(`${USER_ROLES.accountsPayableManager}`, async ({ page }) => {
      const company = getLoginData(USER_ROLES.accountsPayableManager);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await crudCases(page);
      }
    });

    //Intermittent performance issue with weekly timesheet that needs investigation
    // test(`${USER_ROLES.accountsReceivableManager}`, async ({ page }) => {
    //   const company = getLoginData(USER_ROLES.accountsReceivableManager);
    //   const hasAccess = await setupAndNavigateSingleTA(page, company);
    //   if (hasAccess) {
    //     await crudCases(page);
    //   }
    // });

    test(`${USER_ROLES.inHouseAccountant}`, async ({ page }) => {
      const company = getLoginData(USER_ROLES.inHouseAccountant);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await crudCases(page);
      }
    });

    test(`${USER_ROLES.expenseManager}`, async ({ page }) => {
      const company = getLoginData(USER_ROLES.expenseManager);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await crudCases(page);
      }
    });

    test(`${USER_ROLES.inventoryManager}`, async ({ page }) => {
      const company = getLoginData(USER_ROLES.inventoryManager);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await crudCases(page);
      }
    });

    //Commented due to RBAC issues
    /*test(`${USER_ROLES.payrollManager}`, async ({ page }) => {
      const singleTimeActPage = new SingleTimeActivityPage(page);
      const company = getLoginData(USER_ROLES.payrollManager);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await singleTimeActPage.openDropdown(LABELS.Name);
        await singleTimeActPage.clickDropdownOption(
          testData.option1,
          LABELS.Name
        );
        await singleTimeActPage.fillData(LABELS.Duration, testData.duration);
        await singleTimeActPage.clickButton(LABELS.Save);
        await singleTimeActPage.waitTillLoaderDisappears();
        if (await singleTimeActPage.userNotAllowedActionError()) {
          return;
        } else {
          // else execute the case for the role
          await crudCases(page);
        }
      }
    });*/

    test(`${USER_ROLES.salesManager}`, async ({ page }) => {
      const company = getLoginData(USER_ROLES.salesManager);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await crudCases(page);
      }
    });

    test(`${USER_ROLES.standardAllAccess}`, async ({ page }) => {
      const company = getLoginData(USER_ROLES.standardAllAccess);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await crudCases(page);
      }
    });

    test(`${USER_ROLES.standardNoAcces}`, async ({ page }) => {
      const company = getLoginData(USER_ROLES.standardNoAcces);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await crudCases(page);
      }
    });

    test(`${USER_ROLES.hrManager}`, async ({ page }) => {
      const company = getLoginData(USER_ROLES.hrManager);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await crudCases(page);
      }
    });

    test(`${USER_ROLES.qbAdvanced}`, async ({ page }) => {
      const company = getLoginData(USER_ROLES.qbAdvanced);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await crudCases(page);
      }
    });

    test(`${USER_ROLES.qbAdvancedWithPayrollElite}`, async ({ page }) => {
      const company = getLoginData(USER_ROLES.qbAdvancedWithPayrollElite);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await crudCases(page);
      }
    });

    test(`${USER_ROLES.qbAdvancedWithTimeElite}`, async ({ page }) => {
      const company = getLoginData(USER_ROLES.qbAdvancedWithTimeElite);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await crudCases(page);
      }
    });

    test(`${USER_ROLES.qbEssential}`, async ({ page }) => {
      const company = getLoginData(USER_ROLES.qbEssential);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await crudCases(page);
      }
    });

    test(`${USER_ROLES.qbEssentialsWithPayrollPremium}`, async ({ page }) => {
      const company = getLoginData(USER_ROLES.qbEssentialsWithPayrollPremium);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await crudCases(page);
      }
    });

    test(`${USER_ROLES.qbPlus}`, async ({ page }) => {
      const company = getLoginData(USER_ROLES.qbPlus);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await crudCases(page);
      }
    });

    test(`${USER_ROLES.qbPlusWithTimePremium}`, async ({ page }) => {
      const company = getLoginData(USER_ROLES.qbPlusWithTimePremium);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await crudCases(page);
      }
    });

    test(`${USER_ROLES.timeTrackOnly}`, async ({ page }) => {
      const company = getLoginData(USER_ROLES.timeTrackOnly);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await crudCases(page, USER_ROLES.timeTrackOnly);
      }
    });

    test(`${USER_ROLES.cAQlQBPlusCanada}`, async ({ page }) => {
      const company = getLoginData(USER_ROLES.cAQlQBPlusCanada);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await crudCases(page);
      }
    });

    test(`${USER_ROLES.viewCompanyReports}`, async ({ page }) => {
      const company = getLoginData(USER_ROLES.viewCompanyReports);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await crudCases(page);
      }
    });
  });
});
