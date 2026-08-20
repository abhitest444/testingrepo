import { test } from '@playwright/test';
import { getTestAccount } from '../../config/accounts';
import { openQBOTS } from '../../pages/QBOLogin';
import {
  createOvertimePolicyBasicRules,
  createOvertimePolicyCaliforniaRules,
  createOvertimePolicyWithCustomRulesFromQL,
  crudOvertimePolicyFromManageScreen,
  dailyOvertimeAlertsInNotifications,
  weeklyOvertimeAlertsInNotifications,
  overtimeAlertsNullStateValidation,
  overtimeUserLevelSettingsEditNavigation,
  overtimeUserLevelSettingsZeroState,
  paginationOvertimeManageScreen,
  reviewScreenEditPolicyNameFromReviewWizard,
  reviewScreenEditInteractionPolicyMembers,
  reviewScreenEditInteractionOvertimeRules,
  reviewScreenEditOvertimeRulesFromReviewStep,
  validateOvertimeInRunPayroll,
  validateOvertimeNotAvailableForNonAdmin,
  validateOvertimeNotAvailableForTTOWorker,
  verifyOvertimeEditableInsideWorkerNotificationsEdit,
  verifyOvertimeInWorkerNotificationsSection,
  verifyWorkerNotificationsOvertimeDailyWeeklyOptionsVisible,
  verifyWorkerNotificationsOvertimeUnchangedAfterCancel,
  verifyWorkerNotificationsOvertimeUpdatedAfterSave,
  verifyWorkerOvertimeTwoOptionsAfterPolicyEditsFromLanding,
  verifyOvertimeRulesUnchangedAfterRulesEditorBackAndCancel,
  verifyBackInAllOvertimeScreens,
  verifyCloseTrowserOvertimeWizard,
  verifyDefaultOvertimePolicyCheckbox,
  verifyNotificationSettingsInOvertime,
  verifyOneBigBeautifulBillActDescription,
  verifyOvertimeEmptyState,
  verifyOvertimeInWorkersViewSettings,
  verifyOvertimeManageScreenLinks,
  verifyOvertimePayRateEngineFromViewSettings,
  verifyOvertimePoliciesLinkNavigation,
  verifyOvertimeSectionVisible,
  verifyOvertimeSettingsForCoreCompany,
  verifyOvertimeWizardStepFlow,
  verifyOvertimeWithPolicies,
  verifySearchInAssignPolicyMembers,
  verifySwitchBetweenOvertimePolicies,
  verifyDefaultPolicyMemberReassignment,
  verifyWorkerLevelOvertimeAlertsInNotifications,
  cleanupOvertimeNotifications,
} from '../Util/OvertimePolicy.util';
import {
  addPolicyFromClassicPageVerifyInQbo,
  addPolicyFromQboVerifyInClassicPage,
  addRuleFromClassicPageVerifyInQbo,
  addRuleFromQboVerifyInClassicPage,
  createOvertimePolicyBasicRulesFromClassicPage,
  createOvertimePolicyCaliforniaRulesFromClassicPage,
  createOvertimePolicyCustomRulesFromClassicPage,
  deletePolicyFromClassicPageVerifyInQbo,
  deletePolicyFromQboVerifyInClassicPage,
  deleteRuleFromClassicPageVerifyInQbo,
  deleteRuleFromQboVerifyInClassicPage,
  editPolicyFromClassicPageVerifyInQbo,
  editPolicyFromQboVerifyInClassicPage,
  editRuleFromClassicPageVerifyInQbo,
  editRuleFromQboVerifyInClassicPage,
} from '../Util/TSheetsOvertimePolicy.util';

test.describe('Overtime Policy', () => {
  test.beforeEach(async ({ page }) => {
    const testInfo = test.info();
    const testId = testInfo.title.split(' - ')[0];
    const credentials = getTestAccount(testId);
    await openQBOTS(page, credentials);
    console.log('Logged in with credentials:', credentials.username);
  });

  test.afterEach(async ({ page }) => {
    const testInfo = test.info();
    const testId = testInfo.title.split(' - ')[0];
    if (testId == 'OT017' || testId == 'OT018' || testId == 'OT062') {
      try {
        console.log('Starting post-test cleanup...');
        await cleanupOvertimeNotifications(page);
        console.log('Post-test cleanup completed successfully');
      } catch (error) {
        console.log('Post-test cleanup failed:', error);
      }
    }
  });
  test('OT001 - Verify Overtime section is visible in settings', async ({
    page,
  }) => {
    await verifyOvertimeSectionVisible(page);
  });

  test('OT002 - Verify Overtime in settings with no policies', async ({
    page,
  }) => {
    await verifyOvertimeEmptyState(page);
  });

  test('OT003 - Verify Overtime in settings with policies', async ({
    page,
  }) => {
    await verifyOvertimeWithPolicies(page);
  });

  test('OT004 - Create overtime policy with basic rules from QL', async ({
    page,
  }) => {
    await createOvertimePolicyBasicRules(page);
  });

  test('OT005 - Create overtime policy with California overtime rules from QL', async ({
    page,
  }) => {
    await createOvertimePolicyCaliforniaRules(page);
  });

  test('OT006 - Create overtime policy with custom overtime rules from QL', async ({
    page,
  }) => {
    await createOvertimePolicyWithCustomRulesFromQL(page);
  });

  // test('OT007 - Create overtime policy with basic rules from ClassicPage', async ({
  //   page,
  // }) => {
  //   await createOvertimePolicyBasicRulesFromClassicPage(page);
  // });

  // test('OT008 - Create overtime policy with California overtime rules from ClassicPage', async ({
  //   page,
  // }) => {
  //   await createOvertimePolicyCaliforniaRulesFromClassicPage(page);
  // });

  // test('OT009 - Create overtime policy with custom overtime rules from ClassicPage', async ({
  //   page,
  // }) => {
  //   await createOvertimePolicyCustomRulesFromClassicPage(page);
  // });

  // test('OT010 - CRUD for overtime from manage screen', async ({ page }) => {
  //   await crudOvertimePolicyFromManageScreen(page, 'Test Overtime Policy');
  // });

  test('OT011 - Verify overtime manage screen links', async ({ page }) => {
    await verifyOvertimeManageScreenLinks(page);
  });

  // test('OT012 - Verify One Big Beautiful Bill Act description', async ({
  //   page,
  // }) => {
  //   await verifyOneBigBeautifulBillActDescription(page);
  // });

  test('OT013 - Review screen edit interaction for overtime policy details', async ({
    page,
  }) => {
    await reviewScreenEditPolicyNameFromReviewWizard(
      page,
      'OT013 Policy',
      'OT013 Policy Updated',
    );
  });

  test('OT014 - Review screen edit interaction for overtime rules', async ({
    page,
  }) => {
    await reviewScreenEditOvertimeRulesFromReviewStep(page, 'OT014 Policy');
  });

  test('OT015 - Review screen edit interaction for policy members', async ({
    page,
  }) => {
    await reviewScreenEditInteractionPolicyMembers(page);
  });

  // test('OT016 - Pagination for overtime manage screen', async ({ page }) => {
  //   await paginationOvertimeManageScreen(page);
  // });

  // test('OT017 - Validate Daily Overtime alerts in Notifications', async ({
  //   page,
  // }) => {
  //   await dailyOvertimeAlertsInNotifications(page);
  // });

  // test('OT018 - Validate Weekly Overtime alerts in Notifications', async ({
  //   page,
  // }) => {
  //   await weeklyOvertimeAlertsInNotifications(page);
  // });

  // test('OT019 - Overtime user level settings for zero state', async ({
  //   page,
  // }) => {
  //   await overtimeUserLevelSettingsZeroState(page);
  // });

  // test('OT020 - Overtime user level settings Edit navigation', async ({
  //   page,
  // }) => {
  //   await overtimeUserLevelSettingsEditNavigation(page);
  // });

  // test('OT022 - Validate search in assign policy members', async ({ page }) => {
  //   await verifySearchInAssignPolicyMembers(page);
  // });

  test('OT023 - Validate close trowser', async ({ page }) => {
    await verifyCloseTrowserOvertimeWizard(page);
  });

  test('OT024 - Validate Back in all overtime screens', async ({ page }) => {
    await verifyBackInAllOvertimeScreens(page);
  });

  test('OT025 - Validate overtime step flow section', async ({ page }) => {
    await verifyOvertimeWizardStepFlow(page);
  });

  test('OT026 - Validate overtime policies link', async ({ page }) => {
    await verifyOvertimePoliciesLinkNavigation(page);
  });

  test('OT027 - Validate default overtime policies checkbox', async ({
    page,
  }) => {
    await verifyDefaultOvertimePolicyCheckbox(page);
  });

  // test('OT028 - Verify Overtime settings access for different company types', async ({
  //   page,
  // }) => {
  //   await verifyOvertimeSettingsForCoreCompany(page);
  // });

  // test('OT029 - Selection interaction - Switch between multiple overtime policies', async ({
  //   page,
  // }) => {
  //   await verifySwitchBetweenOvertimePolicies(page);
  // });

  // test('OT030 - Overtime alerts null state validation', async ({ page }) => {
  //   await overtimeAlertsNullStateValidation(page);
  // });

  test('OT031 - Assignments → Workers → Groups → View → View settings → Overtime section visible', async ({
    page,
  }) => {
    await verifyOvertimeInWorkersViewSettings(page);
  });

  test('OT032 - Assignments → Workers → Groups → View → View settings → Open overtime → Overtime rules', async ({
    page,
  }) => {
    await verifyOvertimePayRateEngineFromViewSettings(page);
  });

  // test('OT033 - Notification settings in overtime', async ({ page }) => {
  //   await verifyNotificationSettingsInOvertime(page);
  // });

  test('OT034 - Validate overtime in Run payroll', async ({ page }) => {
    await validateOvertimeInRunPayroll(page);
  });

  // test('OT035 - Add policy from ClassicPage and verify into QBO screen', async ({
  //   page,
  // }) => {
  //   await addPolicyFromClassicPageVerifyInQbo(page);
  // });

  // test('OT036 - Edit existing policy from ClassicPage and verify from QBO screen', async ({
  //   page,
  // }) => {
  //   await editPolicyFromClassicPageVerifyInQbo(page);
  // });

  // test('OT037 - Delete policy from ClassicPage and verify from QBO screen', async ({
  //   page,
  // }) => {
  //   await deletePolicyFromClassicPageVerifyInQbo(page);
  // });

  // test('OT038 - Add rule from ClassicPage and verify from QBO screen', async ({
  //   page,
  // }) => {
  //   await addRuleFromClassicPageVerifyInQbo(page);
  // });

  // test('OT039 - Edit existing rule from ClassicPage and verify from QBO screen', async ({
  //   page,
  // }) => {
  //   await editRuleFromClassicPageVerifyInQbo(page);
  // });

  // test('OT040 - Delete rule from ClassicPage and verify from QBO screen', async ({
  //   page,
  // }) => {
  //   await deleteRuleFromClassicPageVerifyInQbo(page);
  // });

  test('OT041 - Add policy from QBO and verify in TSheets (Classic Manage pay rates)', async ({
    page,
  }) => {
    await addPolicyFromQboVerifyInClassicPage(page);
  });

  test('OT042 - Edit policy from QBO and verify in TSheets (Classic Manage pay rates)', async ({
    page,
  }) => {
    await editPolicyFromQboVerifyInClassicPage(page);
  });

  test('OT043 - Delete policy from QBO and verify removed in TSheets (Classic Manage pay rates)', async ({
    page,
  }) => {
    await deletePolicyFromQboVerifyInClassicPage(page);
  });

  // test('OT044 - Add rule from QBO and verify from ClassicPage screen', async ({
  //   page,
  // }) => {
  //   await addRuleFromQboVerifyInClassicPage(page);
  // });

  // test('OT045 - Edit existing rule from QBO and verify from ClassicPage screen', async ({
  //   page,
  // }) => {
  //   await editRuleFromQboVerifyInClassicPage(page);
  // });

  // test('OT046 - Delete rule from QBO and verify from ClassicPage screen', async ({
  //   page,
  // }) => {
  //   await deleteRuleFromQboVerifyInClassicPage(page);
  // });

  // test('OT047 - Ineligible role (TTO worker): overtime / Time settings not available', async ({
  //   page,
  // }) => {
  //   await validateOvertimeNotAvailableForTTOWorker(page);
  // });

  // test('OT048 - Ineligible role (standard all access / non-admin): overtime / Time settings not available', async ({
  //   page,
  // }) => {
  //   await validateOvertimeNotAvailableForNonAdmin(page);
  // });

  test('OT050 - Worker overtime: company vs custom options; California rules; Rules column shows 5', async ({
    page,
  }) => {
    await verifyWorkerOvertimeTwoOptionsAfterPolicyEditsFromLanding(page);
  });

  test('OT052 - Overtime rules unchanged after rules dropdown Back and Cancel', async ({
    page,
  }) => {
    await verifyOvertimeRulesUnchangedAfterRulesEditorBackAndCancel(page);
  });

  test('OT054 - Overtime in Notifications on worker View settings (copy + label)', async ({
    page,
  }) => {
    await verifyOvertimeInWorkerNotificationsSection(page);
  });

  test('OT055 - Overtime editable inside Notifications edit drawer', async ({
    page,
  }) => {
    await verifyOvertimeEditableInsideWorkerNotificationsEdit(page);
  });

  test('OT056 - Edit Notifications shows Daily / Weekly overtime checkboxes', async ({
    page,
  }) => {
    await verifyWorkerNotificationsOvertimeDailyWeeklyOptionsVisible(page);
  });

  test('OT057 - Cancel on Notifications edit discards overtime notification changes', async ({
    page,
  }) => {
    await verifyWorkerNotificationsOvertimeUnchangedAfterCancel(page);
  });

  test('OT058 - Save on Notifications edit persists overtime notification changes', async ({
    page,
  }) => {
    await verifyWorkerNotificationsOvertimeUpdatedAfterSave(page);
  });

  // test('OT061 - Verify default policy member reassignment', async ({
  //   page,
  // }) => {
  //   await verifyDefaultPolicyMemberReassignment(page);
  // });

  // test('OT062 - Verify worker level overtime alert settings in notification', async ({
  //   page,
  // }) => {
  //   await verifyWorkerLevelOvertimeAlertsInNotifications(page);
  // });
});
