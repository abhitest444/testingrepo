import { expect, Page, test } from '@playwright/test';
import {
  getGBPrioritySingleLoginData,
  getPrioritySingleLoginData,
} from '../../../logins';
import {
  useWeeklyTimeEntryTest,
  useWeeklyTimeServiceBillableTest,
} from '../../Util/WeeklyTimeActivityCRUD.util';
import { setupAndNavigateSingleTA, USER_ROLES } from '../../../utils';
import {
  crudCases,
  useSingleTimeEntryServiceTest,
} from '../../Util/GB/GBSingleTimeActivityCRUD.util';

test.describe(`SingleTimeEntry`, () => {
  test(`Priority Cases - Company admin`, async ({ page }) => {
    const company = getGBPrioritySingleLoginData(USER_ROLES.companyAdmin);
    const hasAccess = await setupAndNavigateSingleTA(page, company);
    if (hasAccess) {
      await crudCases(page);
    }
  });
  test(`Priority Cases - Service Billable`, async ({ page }) => {
    const company = getGBPrioritySingleLoginData(USER_ROLES.p0serviceprice);
    console.log('company', company);
    const hasAccess = await setupAndNavigateSingleTA(page, company);
    if (hasAccess) {
      await useSingleTimeEntryServiceTest(page);
    }
  });
});
