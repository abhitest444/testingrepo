import { expect, Page, test } from '@playwright/test';
import { LABELS, USER_ROLES, WEEK_DAYS, NOTES_TEXT } from '../../utils';
import { useWeeklyTimeEntryTest } from '../Util/WeeklyTimeActivityCRUD.util';

test.describe(`${LABELS.Weekly}`, () => {
  test.describe(`${LABELS.CRUD}`, () => {
    test(`${USER_ROLES.companyAdmin}`, async ({ page }) => {
      await useWeeklyTimeEntryTest(page, USER_ROLES.companyAdmin);
    });

    // Free data company admin flow for time summary
    test(`${USER_ROLES.freeDataCompanyAdmin}`, async ({ page }) => {
      await useWeeklyTimeEntryTest(page, USER_ROLES.freeDataCompanyAdmin);
    });
  });
});

test.describe(`${LABELS.Weekly}`, () => {
  test.describe(`${LABELS.CRUD}`, () => {
    test(`${USER_ROLES.expenseManager}`, async ({ page }) => {
      await useWeeklyTimeEntryTest(page, USER_ROLES.expenseManager);
    });
  });
});

test.describe(`${LABELS.Weekly}`, () => {
  test.describe(`${LABELS.CRUD}`, () => {
    test(`${USER_ROLES.inHouseAccountant}`, async ({ page }) => {
      await useWeeklyTimeEntryTest(page, USER_ROLES.inHouseAccountant);
    });
  });
});

test.describe(`${LABELS.Weekly}`, () => {
  test.describe(`${LABELS.CRUD}`, () => {
    test(`${USER_ROLES.inventoryManager}`, async ({ page }) => {
      await useWeeklyTimeEntryTest(page, USER_ROLES.inventoryManager);
    });
  });
});

//Commented due to RBAC issues
/*test.describe(`${LABELS.Weekly}`, () => {
  test.describe(`${LABELS.CRUD}`, () => {
    test(`${USER_ROLES.payrollManager}`, async ({ page }) => {
      await useWeeklyTimeEntryTest(page, USER_ROLES.payrollManager);
    });
  });
});*/

test.describe(`${LABELS.Weekly}`, () => {
  test.describe(`${LABELS.CRUD}`, () => {
    test(`${USER_ROLES.salesManager}`, async ({ page }) => {
      await useWeeklyTimeEntryTest(page, USER_ROLES.salesManager);
    });
  });
});

// Due to this issue commented https://jira.intuit.com/browse/QUANTA-1840
// test.describe(`${LABELS.Weekly}`, () => {
//   test.describe(`${LABELS.CRUD}`, () => {
//     test(`${USER_ROLES.standardAllAccess}`, async ({ page }) => {
//       test.info().fixme(true, 'https://jira.intuit.com/browse/QUANTA-1840');
//       await useWeeklyTimeEntryTest(page, USER_ROLES.standardAllAccess);
//     });
//   });
// });

test.describe(`${LABELS.Weekly}`, () => {
  test.describe(`${LABELS.CRUD}`, () => {
    test(`${USER_ROLES.accountsPayableManager}`, async ({ page }) => {
      await useWeeklyTimeEntryTest(page, USER_ROLES.accountsPayableManager);
    });
  });
});

// Due to this issue commented https://jira.intuit.com/browse/QUANTA-1840
// test.describe(`${LABELS.Weekly}`, () => {
//   test.describe(`${LABELS.CRUD}`, () => {
//     test(`${USER_ROLES.accountsReceivableManager}`, async ({ page }) => {
//       test.info().fixme(true, 'https://jira.intuit.com/browse/QUANTA-1840');
//       await useWeeklyTimeEntryTest(page, USER_ROLES.accountsReceivableManager);
//     });
//   });
// });

test.describe(`${LABELS.Weekly}`, () => {
  test.describe(`${LABELS.CRUD}`, () => {
    test(`${USER_ROLES.hrManager}`, async ({ page }) => {
      await useWeeklyTimeEntryTest(page, USER_ROLES.hrManager);
    });
  });
});

test.describe(`${LABELS.Weekly}`, () => {
  test.describe(`${LABELS.CRUD}`, () => {
    test(`${USER_ROLES.viewCompanyReports}`, async ({ page }) => {
      await useWeeklyTimeEntryTest(page, USER_ROLES.viewCompanyReports);
    });
  });
});

test.describe(`${LABELS.Weekly}`, () => {
  test.describe(`${LABELS.CRUD}`, () => {
    test(`${USER_ROLES.qbPlus}`, async ({ page }) => {
      await useWeeklyTimeEntryTest(page, USER_ROLES.qbPlus);
    });
  });
});

// Due to this issue commented https://jira.intuit.com/browse/QUANTA-2435
// test.describe(`${LABELS.Weekly}`, () => {
//   test.describe(`${LABELS.CRUD}`, () => {
//     test(`${USER_ROLES.qbAdvanced}`, async ({ page }) => {
//       test.info().fixme(true, 'https://jira.intuit.com/browse/QUANTA-2435');
//       await useWeeklyTimeEntryTest(page, USER_ROLES.qbAdvanced);
//     });
//   });
// });

test.describe(`${LABELS.Weekly}`, () => {
  test.describe(`${LABELS.CRUD}`, () => {
    test(`${USER_ROLES.qbEssential}`, async ({ page }) => {
      await useWeeklyTimeEntryTest(page, USER_ROLES.qbEssential);
    });
  });
});

test.describe(`${LABELS.Weekly}`, () => {
  test.describe(`${LABELS.CRUD}`, () => {
    test(`${USER_ROLES.qbPlusWithTimePremium}`, async ({ page }) => {
      await useWeeklyTimeEntryTest(page, USER_ROLES.qbPlusWithTimePremium);
    });
  });
});

test.describe(`${LABELS.Weekly}`, () => {
  test.describe(`${LABELS.CRUD}`, () => {
    test(`${USER_ROLES.qbAdvancedWithTimeElite}`, async ({ page }) => {
      await useWeeklyTimeEntryTest(page, USER_ROLES.qbAdvancedWithTimeElite);
    });
  });
});

test.describe(`${LABELS.Weekly}`, () => {
  test.describe(`${LABELS.CRUD}`, () => {
    test(`${USER_ROLES.qbEssentialsWithPayrollPremium}`, async ({ page }) => {
      await useWeeklyTimeEntryTest(
        page,
        USER_ROLES.qbEssentialsWithPayrollPremium,
      );
    });
  });
});

//Intermittent performance issue with weekly timesheet that needs investigation
// test.describe(`${LABELS.Weekly}`, () => {
//   test.describe(`${LABELS.CRUD}`, () => {
//     test(`${USER_ROLES.qbAdvancedWithPayrollElite}`, async ({ page }) => {
//       await useWeeklyTimeEntryTest(page, USER_ROLES.qbAdvancedWithPayrollElite);
//     });
//   });
// });

// Intermittent performance issue with weekly timesheet that needs investigation
test.describe(`${LABELS.Weekly}`, () => {
  test.describe(`${LABELS.CRUD}`, () => {
    test(`${USER_ROLES.timeTrackOnly}`, async ({ page }) => {
      await useWeeklyTimeEntryTest(page, USER_ROLES.timeTrackOnly);
    });
  });
});
test.describe(`${LABELS.Weekly}`, () => {
  test.describe(`${LABELS.CRUD}`, () => {
    test(`${USER_ROLES.standardNoAcces}`, async ({ page }) => {
      await useWeeklyTimeEntryTest(page, USER_ROLES.standardNoAcces);
    });
  });
});

test.describe(`${LABELS.Weekly}`, () => {
  test.describe(`${LABELS.CRUD}`, () => {
    test(`${USER_ROLES.cAQlQBPlusCanada}`, async ({ page }) => {
      // test.info().fixme(true, 'https://jira.intuit.com/browse/QUANTA-2224');
      await useWeeklyTimeEntryTest(page, USER_ROLES.cAQlQBPlusCanada);
    });
  });
});
