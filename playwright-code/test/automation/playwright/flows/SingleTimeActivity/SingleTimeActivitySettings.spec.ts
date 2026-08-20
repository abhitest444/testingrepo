import { getSingleSettingsLoginData } from '../../logins';
import { setupAndNavigateSingleTA, USER_ROLES } from '../../utils';
import { settingsCases } from '../Util/SingleTimeActivitySettings.util';
import { test } from '@playwright/test';

test.describe(`SingleTimeEntry`, () => {
  test.describe('Settings', () => {
    test(`${USER_ROLES.companyAdmin}`, async ({ page }) => {
      const company = getSingleSettingsLoginData(USER_ROLES.companyAdmin);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await settingsCases(page);
      }
    });

    test(`${USER_ROLES.expenseManager}`, async ({ page }) => {
      const company = getSingleSettingsLoginData(USER_ROLES.expenseManager);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await settingsCases(page);
      }
    });

    test(`${USER_ROLES.accountsPayableManager}`, async ({ page }) => {
      const company = getSingleSettingsLoginData(
        USER_ROLES.accountsPayableManager,
      );
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await settingsCases(page);
      }
    });

    test(`${USER_ROLES.accountsReceivableManager}`, async ({ page }) => {
      const company = getSingleSettingsLoginData(
        USER_ROLES.accountsReceivableManager,
      );
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await settingsCases(page);
      }
    });

    test(`${USER_ROLES.inHouseAccountant}`, async ({ page }) => {
      // class settings not getting saved
      const company = getSingleSettingsLoginData(USER_ROLES.inHouseAccountant);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await settingsCases(page);
      }
    });

    test(`${USER_ROLES.inventoryManager}`, async ({ page }) => {
      const company = getSingleSettingsLoginData(USER_ROLES.inventoryManager);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await settingsCases(page);
      }
    });

    //Commented due to RBAC issues
    /*test(`${USER_ROLES.payrollManager}`, async ({ page }) => {
      const company = getSingleSettingsLoginData(USER_ROLES.payrollManager);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await settingsCases(page);
      }
    });*/

    test(`${USER_ROLES.salesManager}`, async ({ page }) => {
      const company = getSingleSettingsLoginData(USER_ROLES.salesManager);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await settingsCases(page);
      }
    });

    test(`${USER_ROLES.standardAllAccess}`, async ({ page }) => {
      const company = getSingleSettingsLoginData(USER_ROLES.standardAllAccess);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await settingsCases(page);
      }
    });

    test(`${USER_ROLES.standardNoAcces}`, async ({ page }) => {
      const company = getSingleSettingsLoginData(USER_ROLES.standardNoAcces);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await settingsCases(page);
      }
    });

    test(`${USER_ROLES.hrManager}`, async ({ page }) => {
      const company = getSingleSettingsLoginData(USER_ROLES.hrManager);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await settingsCases(page);
      }
    });

    test(`${USER_ROLES.qbPlus}`, async ({ page }) => {
      const company = getSingleSettingsLoginData(USER_ROLES.qbPlus);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await settingsCases(page);
      }
    });

    test(`${USER_ROLES.qbEssential}`, async ({ page }) => {
      const company = getSingleSettingsLoginData(USER_ROLES.qbEssential);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await settingsCases(page);
      }
    });

    test(`${USER_ROLES.qbAdvanced}`, async ({ page }) => {
      // skipping due to role accessing single ta on pipeline
      const company = getSingleSettingsLoginData(USER_ROLES.qbAdvanced);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await settingsCases(page);
      }
    });

    test(`${USER_ROLES.qbPlusWithTimePremium}`, async ({ page }) => {
      const company = getSingleSettingsLoginData(
        USER_ROLES.qbPlusWithTimePremium,
      );
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await settingsCases(page);
      }
    });

    test(`${USER_ROLES.qbAdvancedWithTimeElite}`, async ({ page }) => {
      const company = getSingleSettingsLoginData(
        USER_ROLES.qbAdvancedWithTimeElite,
      );
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await settingsCases(page);
      }
    });

    test(`${USER_ROLES.qbEssentialsWithPayrollPremium}`, async ({ page }) => {
      const company = getSingleSettingsLoginData(
        USER_ROLES.qbEssentialsWithPayrollPremium,
      );
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await settingsCases(page);
      }
    });

    test(`${USER_ROLES.qbAdvancedWithPayrollElite}`, async ({ page }) => {
      const company = getSingleSettingsLoginData(
        USER_ROLES.qbAdvancedWithPayrollElite,
      );
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await settingsCases(page);
      }
    });

    test(`${USER_ROLES.cAQlQBPlusCanada}`, async ({ page }) => {
      const company = getSingleSettingsLoginData(USER_ROLES.cAQlQBPlusCanada);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await settingsCases(page);
      }
    });

    test(`${USER_ROLES.timeTrackOnly}`, async ({ page }) => {
      const company = getSingleSettingsLoginData(USER_ROLES.timeTrackOnly);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await settingsCases(page);
      }
    });

    test(`${USER_ROLES.viewCompanyReports}`, async ({ page }) => {
      const company = getSingleSettingsLoginData(USER_ROLES.viewCompanyReports);
      const hasAccess = await setupAndNavigateSingleTA(page, company);
      if (hasAccess) {
        await settingsCases(page);
      }
    });
  });
});
