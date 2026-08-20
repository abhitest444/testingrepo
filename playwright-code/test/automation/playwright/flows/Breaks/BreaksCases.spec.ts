import { test } from '@playwright/test';
import {
  validateCloseAndXButton,
  validateNoSetDurationCheckBox,
  validateNoSetDurationBoxChecked,
  navigateToAssignTeamMembersViaAssignedTo,
  validateAssignTeamMembersPanel,
  validateSelectDeselectAllMembers,
  navigateToAssignTeamMembersViaAddBreakRule,
  validateDeselectTeamMemberAndSave,
  deselectAllTeamMembersAndCancel,
  validateSearchTeamMember,
  validateBreaksForAdmins,
  validateBreaksForNonPayrollOrNonAdminRoles,
  AssignBreakToTeamMember,
  verifyManualBreakForAssignedTeamMember,
  navigateToBreakPreferencesScreen,
  validateBreakSectionPresent,
  validateManageBreaksUIElements,
  addAutomaticBreakRuleAndDeleteIt,
  addManualBreakRuleAndDeleteIt,
} from '../Util/Breaks.Util';
import { getTestAccount } from '../../config/accounts';
import { openQBOTS } from '../../pages/QBOLogin';

test.describe('Break Rules Management & Assignment', () => {
  test.beforeEach(async ({ page }) => {
    // Get current test info
    const testInfo = test.info();
    // Login using test-specific credentials
    const testId = testInfo.title.split(' - ')[0];
    const credentials = getTestAccount(testId);
    await openQBOTS(page, credentials);
  });

  test('BRR001 - Break Rule - Validate No Set Duration & Close Button Functionality', async ({
    page,
  }) => {
    await validateNoSetDurationCheckBox(page);
    await validateNoSetDurationBoxChecked(page);
    await validateCloseAndXButton(page);
  });

  test('BRR002 - Break Rule - Validate Assign Team Members to Break Rule', async ({
    page,
  }) => {
    await navigateToAssignTeamMembersViaAssignedTo(page);
    await validateAssignTeamMembersPanel(page);
    await navigateToAssignTeamMembersViaAddBreakRule(page);
    await validateSelectDeselectAllMembers(page);
  });

  test('BRR003 - Break Rule - Deselect Team Member And Verify Cancel & Save Functionality', async ({
    page,
  }) => {
    await navigateToAssignTeamMembersViaAssignedTo(page);
    await deselectAllTeamMembersAndCancel(page);
    await validateDeselectTeamMemberAndSave(page);
  });

  test('BRR004 - Break Rule - Validate Search Team Member', async ({
    page,
  }) => {
    await navigateToAssignTeamMembersViaAssignedTo(page);
    await validateSearchTeamMember(page);
  });

  test('BRR005 - Break Rule - Assign & Verify Break Rule is Applied only to Assigned Team Members', async ({
    page,
  }) => {
    await navigateToAssignTeamMembersViaAssignedTo(page);
    await AssignBreakToTeamMember(page);
  });

  test('BRR006 - Break Rule - Validate break rules availability for Admin', async ({
    page,
  }) => {
    await validateBreaksForAdmins(page);
  });

  test('BRR007 - Break Rule - Validate break rules availability for non admin roles', async ({
    page,
  }) => {
    await validateBreaksForNonPayrollOrNonAdminRoles(page);
  });

  test('BRR008 - Break Rule - Validate break rules availability for non Payroll Elite & Premium admins', async ({
    page,
  }) => {
    await validateBreaksForNonPayrollOrNonAdminRoles(page);
  });
  test('BRR009 - Break Rule - Assign & Verify Manual Break is Applied only to Assigned Team Members', async ({
    page,
  }) => {
    await navigateToAssignTeamMembersViaAssignedTo(page);
    await verifyManualBreakForAssignedTeamMember(page);
  });
  test('BRR010 - Break Rule - Validate Break Rules and Manage Break Sections', async ({
    page,
  }) => {
    await navigateToBreakPreferencesScreen(page);
    await validateBreakSectionPresent(page);
    await validateManageBreaksUIElements(page);
  });

  test('BRR011 - Break Rule - Add Automatic and Manual Break Rules, Validate and then delete it', async ({
    page,
  }) => {
    await addAutomaticBreakRuleAndDeleteIt(page);
    await addManualBreakRuleAndDeleteIt(page);
  });
});
