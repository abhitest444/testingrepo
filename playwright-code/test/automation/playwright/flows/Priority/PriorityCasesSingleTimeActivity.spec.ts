import { test } from '@playwright/test';
import { getPrioritySingleLoginData } from '../../logins';
import { setupAndNavigateSingleTA, USER_ROLES } from '../../utils';
import {
  crudCases,
  useSingleTimeEntryServiceTest,
} from '../Util/SingleTimeActivityCRUD.util';

// NOTE: STE QBO-user coverage moved to flows/QBO/SingleTimeEntryQBO.spec.ts
// (one case per QBO SKU account).

test.describe(`SingleTimeEntry`, () => {
  test(`Priority Cases - Company admin`, async ({ page }) => {
    const company = getPrioritySingleLoginData(USER_ROLES.companyAdmin);
    const hasAccess = await setupAndNavigateSingleTA(page, company);
    if (hasAccess) {
      await crudCases(page);
    }
  });

  test(`Priority Cases - Service Billable`, async ({ page }) => {
    const company = getPrioritySingleLoginData(USER_ROLES.p0serviceprice);
    const hasAccess = await setupAndNavigateSingleTA(page, company);
    if (hasAccess) {
      await useSingleTimeEntryServiceTest(page);
    }
  });
});
