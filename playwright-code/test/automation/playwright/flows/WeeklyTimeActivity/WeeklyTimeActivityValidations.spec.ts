import { Page, test } from '@playwright/test';
import { LABELS, USER_ROLES } from '../../utils';
import {
  WeeklyTAFeaturesTest,
  WeeklyTAValidationTest,
} from '../Util/WeeklyTimeActivityFeatures.utils';

test.describe(`${LABELS.Weekly}`, () => {
  test.describe(`${LABELS.Validations}`, () => {
    // test(`${USER_ROLES.companyAdmin}`, async ({ page }) => {
    //   await WeeklyTAValidationTest(page, USER_ROLES.companyAdmin);
    // });
    // Due to this issue commented https://jira.intuit.com/browse/QUANTA-2008
    // test(`${USER_ROLES.inHouseAccountant}`, async ({ page }) => {
    //   test.info().fixme(true, 'https://jira.intuit.com/browse/QUANTA-2008');
    //   await WeeklyTAValidationTest(page, USER_ROLES.inHouseAccountant);
    // });
    // Intermittent findings for this role
    // test(`${USER_ROLES.salesManager}`, async ({ page }) => {
    //   await WeeklyTAValidationTest(page, USER_ROLES.salesManager);
    // });
    //Intermittent performance issue for this role
    // test.only(`${USER_ROLES.standardAllAccess}`, async ({ page }) => {
    //   await WeeklyTAValidationTest(page, USER_ROLES.standardAllAccess);
    // });
    //Intermittent performance issue with weekly timesheet that needs investigation
    // test(`${USER_ROLES.accountsReceivableManager}`, async ({ page }) => {
    //   await WeeklyTAValidationTest(page, USER_ROLES.accountsReceivableManager);
    // });
    // Due to this issue commented https://jira.intuit.com/browse/QUANTA-2906
    // test(`${USER_ROLES.hrManager}`, async ({ page }) => {
    //   test.info().fixme(true, 'https://jira.intuit.com/browse/QUANTA-2906');
    //   await WeeklyTAValidationTest(page, USER_ROLES.hrManager);
    // });
    //Intermittent performance issue with weekly timesheet that needs investigation
    // test(`${USER_ROLES.qbPlusWithTimePremium}`, async ({ page }) => {
    //   await WeeklyTAValidationTest(page, USER_ROLES.qbPlusWithTimePremium);
    // });
    // test(`${USER_ROLES.qbAdvancedWithTimeElite}`, async ({ page }) => {
    //   await WeeklyTAValidationTest(page, USER_ROLES.qbAdvancedWithTimeElite);
    // });
    //Intermittent performance issue with weekly timesheet that needs investigation
    /*test(`${USER_ROLES.qbEssentialsWithPayrollPremium}`, async ({ page }) => {
          await WeeklyTAValidationTest(page, USER_ROLES.qbEssentialsWithPayrollPremium);
        });
  
        //Intermittent performance issue with weekly timesheet that needs investigation
        test(`${USER_ROLES.qbAdvancedWithPayrollElite}`, async ({ page }) => {
          await WeeklyTAValidationTest(page, USER_ROLES.qbAdvancedWithPayrollElite);
        });
  
        //Intermittent performance issue with weekly timesheet that needs investigation      
        test(`${USER_ROLES.cAQlQBPlusCanada}`, async ({ page }) => {
          await WeeklyTAValidationTest(page, USER_ROLES.cAQlQBPlusCanada);
        }); 
  
        //Commented due to RBAC issues
        /*test(`${USER_ROLES.payrollManager}`, async ({ page }) => {
          await WeeklyTAFeaturesTest2(page, USER_ROLES.payrollManager);
        });*/
  });
});
