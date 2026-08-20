import { test } from '@playwright/test';
import { getTestAccount } from '../../config/accounts';
import { openQBOTS } from '../../pages/QBOLogin';
import {
  createOvertimePolicyBasicRules,
  createOvertimePolicyCaliforniaRules,
  createOvertimePolicyWithCustomRulesFromQL,
  reviewScreenEditInteractionOvertimeRules,
  reviewScreenEditInteractionPolicyDetails,
  verifyOvertimeEmptyState,
  verifyOvertimeSectionVisible,
  verifyWorkerNotificationsOvertimeAlertOptions,
  verifyWorkerNotificationsOvertimeEditable,
  verifyWorkerOvertimeCompanyVsCustomOptions,
} from '../Util/OvertimePolicy.util';
import {
  addPolicyFromQboVerifyInClassicPage,
  deletePolicyFromQboVerifyInClassicPage,
  editPolicyFromQboVerifyInClassicPage,
} from '../Util/TSheetsOvertimePolicy.util';

test.describe('Overtime Policy — Priority (OTP)', () => {
  test.beforeEach(async ({ page }) => {
    const testInfo = test.info();
    // Full title includes parent describe (e.g. "… › OTP001 - …"); use leaf segment for the ID.
    const leafTitle = testInfo.title.includes(' › ')
      ? testInfo.title.split(' › ').pop() ?? testInfo.title
      : testInfo.title;
    const testId = leafTitle.split(' - ')[0];
    const credentials = getTestAccount(testId);
    await openQBOTS(page, credentials);
  });

  test('OTP001 - Verify Overtime section is visible in settings', async ({
    page,
  }) => {
    await verifyOvertimeSectionVisible(page);
  });

  test('OTP002 - Verify Overtime in settings with no policies', async ({
    page,
  }) => {
    await verifyOvertimeEmptyState(page);
  });

  test('OTP003 - Create overtime policy with basic rules from QL', async ({
    page,
  }) => {
    await createOvertimePolicyBasicRules(page);
  });

  test('OTP004 - Create overtime policy with California overtime rules from QL', async ({
    page,
  }) => {
    await createOvertimePolicyCaliforniaRules(page);
  });

  test('OTP005 - Create overtime policy with custom overtime rules from QL', async ({
    page,
  }) => {
    await createOvertimePolicyWithCustomRulesFromQL(page);
  });

  test('OTP006 - Create policy, edit overtime rules to California from manage', async ({
    page,
  }) => {
    await reviewScreenEditInteractionPolicyDetails(page);
  });

  test('OTP007 - Review screen edit interaction for overtime rules', async ({
    page,
  }) => {
    await reviewScreenEditInteractionOvertimeRules(page, 'OTP007 Policy');
  });

  test('OTP008 - Add policy from QBO and verify from both QBO and ClassicPage', async ({
    page,
  }) => {
    await addPolicyFromQboVerifyInClassicPage(page);
  });

  test('OTP009 - Edit existing policy from QBO and verify from both QBO and ClassicPage', async ({
    page,
  }) => {
    await editPolicyFromQboVerifyInClassicPage(page);
  });

  test('OTP010 - Delete policy from QBO and verify from both QBO and ClassicPage', async ({
    page,
  }) => {
    await deletePolicyFromQboVerifyInClassicPage(page);
  });

  test('OTP011 - Workers settings: Notifications edit includes editable Overtime', async ({
    page,
  }) => {
    await verifyWorkerNotificationsOvertimeEditable(page);
  });

  test('OTP012 - Workers settings: Overtime notification rule options', async ({
    page,
  }) => {
    await verifyWorkerNotificationsOvertimeAlertOptions(page);
  });

  test('OTP013 - Workers settings: two options to update Overtime rules', async ({
    page,
  }) => {
    await verifyWorkerOvertimeCompanyVsCustomOptions(page);
  });
});
