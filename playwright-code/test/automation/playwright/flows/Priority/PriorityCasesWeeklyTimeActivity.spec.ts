import { expect, Page, test } from '@playwright/test';
import { getPrioritySingleLoginData } from '../../logins';
import {
  useWeeklyTimeEntryTest,
  useWeeklyTimeServiceBillableTest,
} from '../Util/WeeklyTimeActivityCRUD.util';
import {
  LABELS,
  setupAndNavigateSingleTA,
  testData,
  WEEK_DAYS,
  NOTES_TEXT,
  USER_ROLES,
} from '../../utils';
import {
  crudCases,
  useSingleTimeEntryServiceTest,
} from '../Util/SingleTimeActivityCRUD.util';

test.describe(`WeeklyTimeEntry`, () => {
  test(`Priority Cases - Company admin`, async ({ page }) => {
    await useWeeklyTimeEntryTest(page, USER_ROLES.p0companyAdmin);
  });
  // test(`Priority Cases - Service Billable`, async ({ page }) => {
  //   await useWeeklyTimeServiceBillableTest(page, USER_ROLES.p0serviceprice);
  // });
});
