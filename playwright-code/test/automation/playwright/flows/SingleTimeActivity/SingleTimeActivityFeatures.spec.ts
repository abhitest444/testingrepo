import { test } from '@playwright/test';
import { getSingleFeaturesLoginData } from '../../logins';

import { setupAndNavigateSingleTA, USER_ROLES } from '../../utils';
import { featureCases } from '../Util/SingleTimeActivityFeatures.util';

test.describe(`SingleTimeEntry`, () => {
  test.describe('Features and Validations', () => {
    // Set timeout for all tests in this suite to 30 minutes
    test.describe.configure({ timeout: 30 * 60 * 1000 });

    test(`${USER_ROLES.companyAdmin}`, async ({ page }) => {
      const company = getSingleFeaturesLoginData(USER_ROLES.companyAdmin);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await featureCases(page, USER_ROLES.companyAdmin);
      }
    });

    test(`${USER_ROLES.accountsPayableManager}`, async ({ page }) => {
      const company = getSingleFeaturesLoginData(
        USER_ROLES.accountsPayableManager,
      );
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await featureCases(page, USER_ROLES.accountsPayableManager);
      }
    });

    // test(`${USER_ROLES.accountsReceivableManager}`, async ({ page }) => {
    //   const company = getSingleFeaturesLoginData(

    //     USER_ROLES.accountsReceivableManager
    //   );
    //   const hasAccess = await setupAndNavigateSingleTA(page, company);
    //   if (hasAccess) {
    //     await featureCases(page, USER_ROLES.accountsReceivableManager);
    //   }
    // });

    test(`${USER_ROLES.expenseManager}`, async ({ page }) => {
      const company = getSingleFeaturesLoginData(USER_ROLES.expenseManager);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await featureCases(page, USER_ROLES.expenseManager);
      }
    });

    test(`${USER_ROLES.inHouseAccountant}`, async ({ page }) => {
      const company = getSingleFeaturesLoginData(USER_ROLES.inHouseAccountant);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await featureCases(page, USER_ROLES.inHouseAccountant);
      }
    });

    test(`${USER_ROLES.inventoryManager}`, async ({ page }) => {
      const company = getSingleFeaturesLoginData(USER_ROLES.inventoryManager);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await featureCases(page, USER_ROLES.inventoryManager);
      }
    });

    //Commented due to RBAC issues
    /*test(`${USER_ROLES.payrollManager}`, async ({ page }) => {
      const company = getSingleFeaturesLoginData(USER_ROLES.payrollManager);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await featureCases(page, USER_ROLES.payrollManager);
      }
    });*/

    test(`${USER_ROLES.salesManager}`, async ({ page }) => {
      const company = getSingleFeaturesLoginData(USER_ROLES.salesManager);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await featureCases(page, USER_ROLES.salesManager);
      }
    });

    test(`${USER_ROLES.standardAllAccess}`, async ({ page }) => {
      const company = getSingleFeaturesLoginData(USER_ROLES.standardAllAccess);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await featureCases(page, USER_ROLES.standardAllAccess);
      }
    });

    test(`${USER_ROLES.standardNoAcces}`, async ({ page }) => {
      const company = getSingleFeaturesLoginData(USER_ROLES.standardNoAcces);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await featureCases(page, USER_ROLES.standardNoAcces);
      }
    });

    test(`${USER_ROLES.qbEssential}`, async ({ page }) => {
      const company = getSingleFeaturesLoginData(USER_ROLES.qbEssential);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await featureCases(page, USER_ROLES.qbEssential);
      }
    });

    test(`${USER_ROLES.qbAdvanced}`, async ({ page }) => {
      const company = getSingleFeaturesLoginData(USER_ROLES.qbAdvanced);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await featureCases(page, USER_ROLES.qbAdvanced);
      }
    });

    test(`${USER_ROLES.qbAdvancedWithPayrollElite}`, async ({ page }) => {
      const company = getSingleFeaturesLoginData(
        USER_ROLES.qbAdvancedWithPayrollElite,
      );
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await featureCases(page, USER_ROLES.qbAdvancedWithPayrollElite);
      }
    });

    // test(`${USER_ROLES.qbAdvancedWithTimeElite}`, async ({ page }) => {
    //   const company = getSingleFeaturesLoginData(
    //     USER_ROLES.qbAdvancedWithTimeElite,
    //   );
    //   const hasAccess = await setupAndNavigateSingleTA(page, company);
    //   if (hasAccess) {
    //     await featureCases(page, USER_ROLES.qbAdvancedWithTimeElite);
    //   }
    // });

    test(`${USER_ROLES.qbEssentialsWithPayrollPremium}`, async ({ page }) => {
      const company = getSingleFeaturesLoginData(
        USER_ROLES.qbEssentialsWithPayrollPremium,
      );
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await featureCases(page, USER_ROLES.qbEssentialsWithPayrollPremium);
      }
    });

    test(`${USER_ROLES.qbPlusWithTimePremium}`, async ({ page }) => {
      const company = getSingleFeaturesLoginData(
        USER_ROLES.qbPlusWithTimePremium,
      );
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await featureCases(page, USER_ROLES.qbPlusWithTimePremium);
      }
    });

    test(`${USER_ROLES.qbPlus}`, async ({ page }) => {
      const company = getSingleFeaturesLoginData(USER_ROLES.qbPlus);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await featureCases(page, USER_ROLES.qbPlus);
      }
    });

    test(`${USER_ROLES.hrManager}`, async ({ page }) => {
      const company = getSingleFeaturesLoginData(USER_ROLES.hrManager);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await featureCases(page, USER_ROLES.hrManager);
      }
    });

    test(`${USER_ROLES.cAQlQBPlusCanada}`, async ({ page }) => {
      const company = getSingleFeaturesLoginData(USER_ROLES.cAQlQBPlusCanada);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await featureCases(page, USER_ROLES.cAQlQBPlusCanada);
      }
    });

    test(`${USER_ROLES.timeTrackOnly}`, async ({ page }) => {
      const company = getSingleFeaturesLoginData(USER_ROLES.timeTrackOnly);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await featureCases(page, USER_ROLES.timeTrackOnly);
      }
    });

    test(`${USER_ROLES.viewCompanyReports}`, async ({ page }) => {
      const company = getSingleFeaturesLoginData(USER_ROLES.viewCompanyReports);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await featureCases(page, USER_ROLES.viewCompanyReports);
      }
    });
  });
});
