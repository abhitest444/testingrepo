import { test } from '@playwright/test';
import { getTestAccount } from '../../config/accounts';
import { openQBOTS } from '../../pages/QBOLogin';
import CustomFieldUtil from '../Util/CustomFieldSettings.Util';

//========================================== Custom Field Settings Test Cases ===============================================

test.describe('Custom Field Settings Test Cases', () => {
  test.beforeEach(async ({ page }: { page: any }) => {
    // Get current test info
    const testInfo = test.info();
    // Login using test-specific credentials
    const testId = testInfo.title.split(' - ')[0];
    const credentials = getTestAccount(testId);
    await openQBOTS(page, credentials);
  });

  test('CF0001 - Verify Custom Field settings page and validate UI elements', async ({
    page,
  }) => {
    await CustomFieldUtil.validateCustomFieldSettingsView(page);
  });

  test('CF0002 - Validate Manage All Custom Fields Link', async ({ page }) => {
    await CustomFieldUtil.validateManageAllCustomFieldsLink(page);
  });

  // Issue raised will enable
  test('CF0003 - Add Time Tracking Custom Field', async ({ page }) => {
    test.info().fixme(true, 'https://jira.cloud.intuit.com/browse/QUANTA-9964');
    await CustomFieldUtil.CreateAndDeactivateNewCustomField(page);
  });

  // test('CF0004 - Make the custom field require field toggle on and off', async ({
  //   page,
  // }) => {
  //   test.info().fixme(true, 'https://jira.intuit.com/browse/QUANTA-3848');
  //   await CustomFieldUtil.makeCustomFieldRequireFieldToggleOnAndOff(page);
  // });

  // test('CF0005 - Validate Custom field settings confirmation model', async ({
  //   page,
  // }) => {
  //   test.info().fixme(true, 'https://jira.intuit.com/browse/QUANTA-3848');
  //   await CustomFieldUtil.validateCustomFieldSettingsConfirmationModel(page);
  // });

  test('CF0006 - Validate Add Custom field page confirmation model', async ({
    page,
  }) => {
    // test.info().fixme(true, 'https://jira.intuit.com/browse/QUANTA-3848');
    await CustomFieldUtil.validateAddCustomFieldPageConfirmationModel(page);
  });

  // test('CF0007 - Validate Custom field pagination functionality', async ({
  //   page,
  // }) => {
  //   test.info().fixme(true, 'https://jira.intuit.com/browse/QUANTA-3848');
  //   await CustomFieldUtil.validateCustomFieldPaginationFunctionality(page);
  // });
});
