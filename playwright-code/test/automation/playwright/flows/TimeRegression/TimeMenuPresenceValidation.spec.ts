import { test } from '@playwright/test';
import { getTestAccount } from '../../config/accounts';
import { openQBOTS } from '../../pages/QBOLogin';
import { validateTimeMenuLinksAndLandingPages } from '../Util/TimePayrollRegression.util';

test.describe('Time Menu Navigation Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Get test info and login with test-specific credentials
    const testInfo = test.info();
    const testId = testInfo.title.split(' - ')[0];
    const credentials = getTestAccount(testId);
    console.log('Logging in with credentials:', credentials.username);
    await openQBOTS(page, credentials);
    console.log('Login successful');
  });

  test('RP011 - Regression: Validate Time menu for Payroll Elite company (all 7 options)', async ({
    page,
  }) => {
    await validateTimeMenuLinksAndLandingPages(page, 'elite');
    console.log(
      'TEST PASSED: Time menu navigation validation for Payroll Elite company completed successfully!',
    );
  });

  test('RP012 - Regression: Validate Time menu for Payroll Premium company (all 7 options)', async ({
    page,
  }) => {
    await validateTimeMenuLinksAndLandingPages(page, 'elite');
    console.log(
      'TEST PASSED: Time menu navigation validation for Payroll Premium company completed successfully!',
    );
  });

  test('RP013 - Regression: Validate Time menu is NOT available for Payroll Core company', async ({
    page,
  }) => {
    await validateTimeMenuLinksAndLandingPages(page, 'core');
    console.log(
      'TEST PASSED: Confirmed Time menu is not available for Payroll Core company!',
    );
  });

  test('RP014 - Regression: Validate Time menu for Time Premium company (access denied on all pages)', async ({
    page,
  }) => {
    await validateTimeMenuLinksAndLandingPages(page, 'time_premium');
    console.log(
      'TEST PASSED: Time menu navigation validation for Time Premium company completed successfully!',
    );
  });

  test('RP015 - Regression: Validate Time menu for Time Elite company (all 7 options)', async ({
    page,
  }) => {
    await validateTimeMenuLinksAndLandingPages(page, 'elite');
    console.log(
      'TEST PASSED: Time menu navigation validation for Time Elite company completed successfully!',
    );
  });

  test('RP016 - Regression: Validate Time menu for Free company (Time entries & Schedule only)', async ({
    page,
  }) => {
    await validateTimeMenuLinksAndLandingPages(page, 'free');
    console.log(
      'TEST PASSED: Time menu navigation validation for Free company completed successfully!',
    );
  });

  test('RP017 - Regression: Validate Time menu for IES - Payroll Elite company (all 7 options)', async ({
    page,
  }) => {
    await validateTimeMenuLinksAndLandingPages(page, 'elite');
    console.log(
      'TEST PASSED: Time menu navigation validation for IES - Payroll Elite company completed successfully!',
    );
  });
});
