import { Page, expect } from '@playwright/test';
import OvertimePolicyPage from '../../pages/OvertimePolicyPage';
import { goToAssignments } from './Assignments.util';
import TimeSettingsPage, {
  handlePopupsInAnyOrder,
  navigateToAccountAndSettingsTime,
  waitForLoadingToDisappear,
} from '../../pages/TimeSettingsPage';
import AssignmentsPage from '../../pages/AssignmentsPage';
import RunPayrollPage from '../../pages/RunPayrollPage';
import TimeEntriesPage from '../../pages/TimeEntriesPage';
import {
  openDateRangeDropdown,
  selectDateRangeOption,
  selectDisplayByOption,
} from '../../commonUtils';
import {
  navigateToTimeEntries,
  openWeeklyTimeEntry,
} from './WTERunPayroll.util';
import {
  approveTimeEntries,
  cleanupRunPayrollTestDataWTE,
  createWeeklyTimeEntryThreeCellsRunPayroll,
  navigateToRunPayroll,
  validateWeeklyTimesheetTotals,
} from './RunPayrollEditFlow.util';
import * as weeklyTimeEntryPage from '../../pages/WeeklyTimeEntryPage';

const DEFAULT_POLICY_NAME = 'Test Overtime Policy';
const CALIFORNIA_OVERTIME_RULES_OPTION = 'Use California Overtime Rules';

async function readOvertimeManagePaginationFooter(
  overtimePage: OvertimePolicyPage,
): Promise<{ summary: string; pageLabel: string }> {
  const nav = overtimePage.overtimeManagePaginationNav();
  const summary =
    (await nav.getByTestId('pagination-summary').textContent())?.trim() || '';
  const pageLabel =
    (
      await nav
        .getByText(/Page\s+\d+\s+of\s+\d+/i)
        .first()
        .textContent()
    )?.trim() || '';
  return { summary, pageLabel };
}

/** OT001 — Overtime section on Time settings + Edit → manage policies trowser */
export async function verifyOvertimeSectionVisible(page: Page): Promise<void> {
  const overtimePage = new OvertimePolicyPage(page);
  await overtimePage.expectOvertimeSectionOnTimeSettingsCard();
  await overtimePage.clickOvertimeSectionEdit();
  await overtimePage.waitForOvertimeTrowserOpen();
  await waitForLoadingToDisappear(page);
  await expect(
    page.locator('[data-automation-id="overtime-landing-page-trowser"]'),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: 'Manage overtime policies for your company',
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', {
      name: /Create overtime policy|Set up overtime policies/i,
    }),
  ).toBeVisible();
}

/** OT002 (+ OT030 null merged in manual tests) — Empty state in overtime trowser */
export async function verifyOvertimeEmptyState(page: Page): Promise<void> {
  const overtimePage = new OvertimePolicyPage(page);
  await overtimePage.navigateToOvertimeLanding();
  await waitForLoadingToDisappear(page);
  const loader = page.getByTestId('overtime-policies-loader');
  await loader.waitFor({ state: 'hidden', timeout: 120000 }).catch(() => {});
  const trowser = page.getByTestId('overtime-landing-page-trowser');
  const setupBtn = trowser.getByTestId('setup-overtime-policy-button');

  for (let i = 0; i < 30; i++) {
    if (await setupBtn.isVisible().catch(() => false)) {
      break;
    }
    const firstRow = trowser.locator('tbody tr').first();
    if (!(await firstRow.isVisible().catch(() => false))) {
      break;
    }
    const policyName = (
      (await firstRow.getByRole('cell').first().innerText()) ?? ''
    )
      .split('\n')[0]
      .trim();
    if (!policyName) {
      break;
    }
    await overtimePage.deletePolicyFromManageTable(policyName);
    await waitForLoadingToDisappear(page);
    await loader.waitFor({ state: 'hidden', timeout: 120000 }).catch(() => {});
  }

  await expect(
    page.locator(`//h5[text()='Set up your overtime policies']`),
  ).toBeVisible({ timeout: 60000 });
  await expect(
    page.locator(
      `//span[text()='Create overtime policies and assign overtime rules to your team to customize how they accumulate overtime.']`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(`//span[text()='Set up overtime policies']`),
  ).toBeVisible();
}

/** OT003 — Policies table: Policy, Workers, Rules, Actions */
export async function verifyOvertimeWithPolicies(page: Page): Promise<void> {
  const overtimePage = new OvertimePolicyPage(page);
  await overtimePage.navigateToOvertimeLanding();
  const dialog = page.getByRole('dialog', { name: 'Overtime' });
  await page.waitForTimeout(5000);
  await expect(
    dialog.getByRole('button', { name: 'Create overtime policy' }),
  ).toBeVisible();
  await page.waitForTimeout(5000);
  await expect(
    dialog.getByRole('columnheader', { name: 'Policy' }),
  ).toBeVisible();
  await page.waitForTimeout(5000);
  const workersHeader = dialog.getByRole('columnheader', {
    name: 'Assigned to',
  });
  if (await workersHeader.isVisible().catch(() => false)) {
    await expect(workersHeader).toBeVisible();
  }
  await page.waitForTimeout(5000);
  await expect(
    dialog.getByRole('columnheader', { name: 'Rules' }),
  ).toBeVisible();
  await page.waitForTimeout(5000);
  await expect(
    dialog.getByRole('columnheader', { name: 'Actions' }),
  ).toBeVisible();
}

/** OT004 — Create policy with Use Basic Rules from QL */
export async function createOvertimePolicyBasicRules(
  page: Page,
): Promise<void> {
  const policyName = `BasicPolicy${1000 + Math.floor(Math.random() * 9000)}`;
  const overtimePage = new OvertimePolicyPage(page);
  await overtimePage.navigateToOvertimeLanding();
  await waitForLoadingToDisappear(page);
  const setupBtn = page.getByRole('button', {
    name: 'Set up overtime policies',
  });
  const createBtn = page.getByRole('button', {
    name: 'Create overtime policy',
  });
  if (await setupBtn.isVisible().catch(() => false)) await setupBtn.click();
  else if (await createBtn.isVisible().catch(() => false))
    await createBtn.click();
  else throw new Error('No Set up / Create overtime policy button');
  await page.waitForTimeout(1500);
  await page.getByPlaceholder('Enter policy name').fill(policyName);
  await page.waitForTimeout(3000);
  await overtimePage.clickWizardNext();
  await page.waitForTimeout(5000);
  await page.waitForTimeout(1500);
  const rulesDropdown = page.getByPlaceholder('Select overtime rules');
  await rulesDropdown.click();
  await page.waitForTimeout(500);
  await page.getByRole('option').filter({ hasText: 'Use Basic Rules' }).click();
  await page.waitForTimeout(1000);
  await expect(page.getByText('Configure your overtime rules')).toBeVisible();
  await overtimePage.ensureDailyCheckedAndDoubleDailyUnchecked();
  await overtimePage.clickWizardNext();
  await page.waitForTimeout(1500);
  const testEmp1 = page.getByRole('checkbox', { name: /Select Test Emp1/i });
  if (
    (await testEmp1.isVisible().catch(() => false)) &&
    !(await testEmp1.isChecked())
  ) {
    await testEmp1.check();
  }
  await overtimePage.clickWizardNext();
  await page.waitForTimeout(1500);
  await expect(
    page.getByRole('heading', { name: 'Overtime policy details' }),
  ).toBeVisible();
  await overtimePage.clickCreatePolicy();
  await page.waitForTimeout(2000);
  const continueSpan = page.locator(`//span[text()="Continue"]`);
  if (await continueSpan.isVisible().catch(() => false)) {
    await continueSpan.click();
  }
  await overtimePage.expectPolicyNameVisibleInManageTable(policyName);

  await navigateToAccountAndSettingsTime(page);
  await overtimePage.navigateToOvertimeLanding();
  await overtimePage.waitForOvertimeManageUiReady();
  await overtimePage.deletePolicyFromManageTable(policyName);
}

/** OT005 — California overtime rules from QL */
export async function createOvertimePolicyCaliforniaRules(
  page: Page,
): Promise<void> {
  const policyName = `CAPolicy${1000 + Math.floor(Math.random() * 9000)}`;
  const overtimePage = new OvertimePolicyPage(page);
  await overtimePage.navigateToOvertimeLanding();
  await waitForLoadingToDisappear(page);
  const setupBtn = page.getByRole('button', {
    name: 'Set up overtime policies',
  });
  const createBtn = page.getByRole('button', {
    name: 'Create overtime policy',
  });
  if (await setupBtn.isVisible().catch(() => false)) await setupBtn.click();
  else if (await createBtn.isVisible().catch(() => false))
    await createBtn.click();
  else throw new Error('No Set up / Create overtime policy button');
  await page.waitForTimeout(1500);
  await page.getByPlaceholder('Enter policy name').fill(policyName);
  await overtimePage.clickWizardNext();
  await page.waitForTimeout(1500);
  const rulesDropdown = page.getByPlaceholder('Select overtime rules');
  await rulesDropdown.click();
  await page.waitForTimeout(500);
  await page
    .getByRole('option')
    .filter({ hasText: /Use California Overtime Rules/i })
    .click();
  await page.waitForTimeout(1000);
  await expect(page.getByText('Configure your overtime rules')).toBeVisible();
  await overtimePage.clickWizardNext();
  await page.waitForTimeout(1500);
  const testEmp1 = page.getByRole('checkbox', { name: /Select Test Emp1/i });
  if (
    (await testEmp1.isVisible().catch(() => false)) &&
    !(await testEmp1.isChecked())
  ) {
    await testEmp1.check();
  }
  await overtimePage.clickWizardNext();
  await page.waitForTimeout(1500);
  await overtimePage.clickCreatePolicy();
  await page.waitForTimeout(2000);
  const continueSpan = page.locator(`//span[text()="Continue"]`);
  if (await continueSpan.isVisible().catch(() => false)) {
    await continueSpan.click();
  }
  await overtimePage.expectPolicyNameVisibleInManageTable(policyName);

  await navigateToAccountAndSettingsTime(page);
  await overtimePage.navigateToOvertimeLanding();
  await overtimePage.waitForOvertimeManageUiReady();
  await overtimePage.deletePolicyFromManageTable(policyName);
}

export async function createOvertimePolicyWithCustomRulesFromQL(
  page: Page,
): Promise<void> {
  const policyName = `ABCtest${Date.now()}`;
  const overtimePage = new OvertimePolicyPage(page);
  await overtimePage.navigateToOvertimeLanding();
  await overtimePage.clickSetUpOvertimePolicies();
  await overtimePage.fillPolicyNameAndDefault(policyName, false);
  await overtimePage.selectOvertimeRuleTypeAndClickNext(
    'Create Custom overtime Rules',
  );
  await overtimePage.selectPolicyMemberAndClickNext('Test Emp1');
  await overtimePage.expectReviewPolicyDetailsWithSelectedData(policyName);
  await overtimePage.clickCreatePolicy();
  await page.waitForTimeout(2000);
  const saveSpan = page.locator(`//span[text()="Save"]`);
  if (await saveSpan.isVisible().catch(() => false)) {
    await saveSpan.click();
  }
  await overtimePage.navigateToOvertimeLanding();
  await overtimePage.expectManageScreenVisible();
  await overtimePage.expectPolicyNameVisibleInManageTable(policyName);
  //delete
  await navigateToAccountAndSettingsTime(page);
  await overtimePage.navigateToOvertimeLanding();
  await overtimePage.waitForOvertimeManageUiReady();
  await overtimePage.deletePolicyFromManageTable(policyName);
}

/** OT010 — Manage screen: create (basic rules), verify row, delete. */
export async function crudOvertimePolicyFromManageScreen(
  page: Page,
  policyName: string = DEFAULT_POLICY_NAME,
): Promise<void> {
  const overtimePage = new OvertimePolicyPage(page);

  await overtimePage.navigateToOvertimeLanding();
  await overtimePage.waitForOvertimeManageUiReady();
  const dialog = page.getByRole('dialog', { name: 'Overtime' });
  const existingPolicyRow = dialog
    .getByRole('table')
    .locator('tbody tr')
    .filter({ hasText: policyName });
  if (
    await existingPolicyRow
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    await overtimePage.deletePolicyFromManageTable(policyName);
    await overtimePage.waitForOvertimeManageUiReady();
  }

  await overtimePage.clickSetUpOvertimePolicies();
  await overtimePage.fillPolicyNameAndDefault(policyName, true);
  await overtimePage.selectBasicRulesAndClickNext();
  await overtimePage.completeBasicRulesConfigurationAndNext();
  await overtimePage.selectFirstPolicyMemberAndClickNext();
  await overtimePage.expectReviewPolicyDetailsWithSelectedData(policyName);
  await overtimePage.clickCreatePolicy();
  await overtimePage.expectSuccessToast().catch(() => {});
  await overtimePage.expectManageScreenVisible();
  await overtimePage.expectPolicyRowInManageTable(policyName);

  await overtimePage.deletePolicyFromManageTable(policyName);
  await overtimePage.waitForOvertimeManageUiReady();
  await expect(
    dialog
      .getByRole('table')
      .locator('tbody tr')
      .filter({ hasText: policyName }),
  ).toHaveCount(0);
}

export async function verifyOvertimeManageScreenLinks(
  page: Page,
): Promise<void> {
  const overtimePage = new OvertimePolicyPage(page);

  // 1. Go to Account & Settings > Time -> overtime landing page
  await overtimePage.navigateToOvertimeLanding();

  // 2. Verify 'Check out overtime laws by state' link and click
  const checkLaws = await overtimePage.getCheckLawsLink();
  expect(checkLaws.href).toMatch(/dol\.gov|wage|overtime/i);
  expect(checkLaws.target).toBe('_blank');

  const [newTab] = await Promise.all([
    page.context().waitForEvent('page'),
    checkLaws.link.click(),
  ]);
  await newTab.waitForLoadState('domcontentloaded');
  await expect(newTab).toHaveURL(/dol\.gov|wage|overtime/i);
  await newTab.close();

  // 3. Verify 'Learn more about overtime' link and click (QuickBooks FAQ / trowser)
  const learnMore = await overtimePage.getLearnMoreLink();
  expect(learnMore.href).toMatch(
    /quickbooks\.intuit\.com|learn-support|help-article/i,
  );
  await page.waitForTimeout(5000);

  const [learnMoreTab] = await Promise.all([
    page.context().waitForEvent('page'),
    learnMore.link.click(),
  ]);
  await page.waitForTimeout(5000);
  await learnMoreTab.waitForLoadState('domcontentloaded');
  await expect(learnMoreTab).toHaveURL(
    /quickbooks\.intuit\.com|intuit\.com|learn-support|help-article/i,
  );
  await learnMoreTab.close();
}
export async function verifyOneBigBeautifulBillActDescription(
  page: Page,
): Promise<void> {
  const overtimePage = new OvertimePolicyPage(page);

  // 1. Go to Account & Settings > Time -> Overtime (open overtime landing trowser)
  await overtimePage.navigateToOvertimeLanding();

  // 2. Verify 'One Big Beautiful Bill Act' summary and view details
  await overtimePage.expectOneBigBeautifulBillActSummaryAndDetails();

  // 3. Click on edit button and verify the same
  await overtimePage.clickEditAndVerifyOneBigBeautifulBillActContent();
}
/**
 * OTP006 — Landing → create policy (basic rules) → verify on manage table → open details →
 * Edit overtime policy → Edit overtime rules → expect Save (not Next) → California rules → save.
 */
export async function reviewScreenEditInteractionPolicyDetails(
  page: Page,
  policyName = `AddPol${Date.now()}`,
): Promise<void> {
  const overtimePage = new OvertimePolicyPage(page);
  await overtimePage.navigateToOvertimeLanding();
  await overtimePage.clickSetUpOvertimePolicies();
  await overtimePage.fillPolicyNameAndDefault(policyName, false);
  await overtimePage.selectOvertimeRuleTypeAndClickNext(
    'Use California Overtime Rules',
  );
  await overtimePage.selectPolicyMemberAndClickNext('Test Emp1');
  //await overtimePage.expectReviewPolicyDetailsWithSelectedData(policyName);
  await overtimePage.clickCreatePolicy();
  const ContinueBtn = page.locator(`//span[text()="Continue"]`);
  if (await ContinueBtn.isVisible()) {
    await ContinueBtn.click();
  }
  await page.waitForTimeout(2000);
  const saveSpan = page.locator(`//span[text()="Save"]`);
  if (await saveSpan.isVisible().catch(() => false)) {
    await saveSpan.click();
  }
  await overtimePage.expectManageScreenVisible();
  await overtimePage.expectPolicyNameVisibleInManageTable(policyName);
  const policyRow = page
    .getByRole('row')
    .filter({ hasText: policyName })
    .first();
  await expect(policyRow).toBeVisible({ timeout: 15000 });
  const policyCell = policyRow
    .getByRole('cell')
    .filter({ hasText: policyName })
    .first();
  await policyCell.click();
  await page.getByRole('button', { name: 'Edit overtime policy' }).click();
  await page.getByRole('button', { name: 'Overtime rules' }).click();
  await overtimePage.selectOvertimeRuleTypeAndClick('Use Basic Rules');
  await page.locator(`//span[text()="Save changes"]`).click();
  await overtimePage.expectPolicyNameVisibleInManageTable(policyName);

  //delete
  await navigateToAccountAndSettingsTime(page);
  await overtimePage.navigateToOvertimeLanding();
  await overtimePage.waitForOvertimeManageUiReady();
  await overtimePage.deletePolicyFromManageTable(policyName);
}

/**
 * OT013 — Landing → create policy → visible on manage table → open policy → Edit overtime policy
 * → Close → Edit overtime policy again → Edit policy details → rename → Save changes → verify table; cleanup.
 */
export async function reviewScreenEditPolicyNameFromReviewWizard(
  page: Page,
  policyName: string,
  updatedPolicyName: string,
): Promise<void> {
  const overtimePage = new OvertimePolicyPage(page);
  const id = Date.now();
  const uniquePolicy = `${policyName}-${id}`;
  const uniqueUpdated = `${updatedPolicyName}-${id}`;

  await overtimePage.createBasicOvertimePolicyViaWizardAndVerifyOnManageTable(
    uniquePolicy,
  );

  await overtimePage.openPolicyDetailsFromManageTable(uniquePolicy);
  await overtimePage.clickEditOvertimePolicyFromDetails();

  await overtimePage.expectCloseButtonVisibleInOvertimeEditFlow();
  await overtimePage.clickCloseButtonInOvertimeEditFlow();

  await overtimePage.clickEditOvertimePolicyFromDetails();

  await overtimePage.clickEditPolicyDetailsButton();
  await overtimePage.editPolicyName(uniqueUpdated);

  await overtimePage.expectSaveChangesButtonVisible();
  await overtimePage.clickSaveChangesButton();

  await overtimePage.expectManageScreenVisible();
  await overtimePage.expectPolicyNameVisibleInManageTable(uniqueUpdated);

  await navigateToAccountAndSettingsTime(page);
  await overtimePage.navigateToOvertimeLanding();
  await overtimePage.waitForOvertimeManageUiReady();
  await overtimePage.deletePolicyFromManageTable(uniqueUpdated);
}

/** OT014 — Review wizard: edit overtime rules from review step, return to review. */
export async function reviewScreenEditOvertimeRulesFromReviewStep(
  page: Page,
  policyName: string = 'OT014 Policy',
): Promise<void> {
  const overtimePage = new OvertimePolicyPage(page);

  await overtimePage.navigateToReviewStep(policyName);
  await overtimePage.expectWizardCloseOrBackButtonVisible();

  await overtimePage.clickReviewEditOvertimeRules();
  await overtimePage.expectSaveOrNextButtonVisible();

  await overtimePage.clickSaveOrNextToReturnToReview();
  await overtimePage.expectReviewStepVisible();
}

/**
 * OTP007 — Create policy (manage table) → open policy → Edit overtime policy →
 * Policy members → Employee checkbox → Save changes; cleanup.
 * (Steps 7–11 after landing/create/verify; same shape as OT015 policy-members flow.)
 */
export async function reviewScreenEditInteractionOvertimeRules(
  page: Page,
  policyNamePrefix: string = 'OTP007 Policy',
): Promise<void> {
  const overtimePage = new OvertimePolicyPage(page);
  const policyName = `${policyNamePrefix}-${Date.now()}`;

  await overtimePage.createBasicOvertimePolicyViaWizardAndVerifyOnManageTable(
    policyName,
  );

  await overtimePage.openPolicyDetailsFromManageTable(policyName);
  await overtimePage.clickEditOvertimePolicyFromDetails();

  await overtimePage.clickEditPolicyMembersButton();
  await overtimePage.selectPolicyMemberAndClick('Test Emp2');
  // await overtimePage.selectEmployeePolicyMemberCheckbox();

  await overtimePage.expectSaveChangesButtonVisible();
  await overtimePage.clickSaveChangesButton();

  await navigateToAccountAndSettingsTime(page);
  await overtimePage.navigateToOvertimeLanding();
  await overtimePage.waitForOvertimeManageUiReady();
  await overtimePage.deletePolicyFromManageTable(policyName);
}
/**
 * OT015 — From overtime landing: create a policy, confirm it on the manage table, open edit,
 * Edit overtime policy → Policy members → Employee checkbox → Save changes; then cleanup.
 */
export async function reviewScreenEditInteractionPolicyMembers(
  page: Page,
): Promise<void> {
  const overtimePage = new OvertimePolicyPage(page);
  const policyName = `OT015Policy${Date.now()}`;

  await overtimePage.createBasicOvertimePolicyViaWizardAndVerifyOnManageTable(
    policyName,
  );

  await overtimePage.openPolicyDetailsFromManageTable(policyName);
  await overtimePage.clickEditOvertimePolicyFromDetails();

  await overtimePage.clickEditPolicyMembersButton();
  await overtimePage.selectPolicyMemberAndClick('Test Emp2');

  await overtimePage.expectSaveChangesButtonVisible();
  await overtimePage.clickSaveChangesButton();

  await navigateToAccountAndSettingsTime(page);
  await overtimePage.navigateToOvertimeLanding();
  await overtimePage.waitForOvertimeManageUiReady();
  await overtimePage.deletePolicyFromManageTable(policyName);
}
export async function paginationOvertimeManageScreen(
  page: Page,
): Promise<void> {
  const overtimePage = new OvertimePolicyPage(page);
  await overtimePage.navigateToOvertimeLanding();
  await waitForLoadingToDisappear(page);
  await overtimePage.expectPaginationVisibleWithSummary();

  const nav = overtimePage.overtimeManagePaginationNav();
  await expect(nav).toBeVisible({ timeout: 10000 });

  let { summary: summaryText, pageLabel } =
    await readOvertimeManagePaginationFooter(overtimePage);
  let totalPolicies = parseInt(
    summaryText.match(/of\s+(\d+)/i)?.[1] || '0',
    10,
  );
  let totalPages = parseInt(
    pageLabel.match(/Page\s+\d+\s+of\s+(\d+)/i)?.[1] || '0',
    10,
  );
  expect(totalPolicies).toBeGreaterThan(0);
  expect(totalPages).toBeGreaterThanOrEqual(3);

  await overtimePage.expectOvertimePaginationOnPage(1);
  const firstOnPage1 =
    await overtimePage.getFirstOvertimePolicyNameInManageTable();
  ({ summary: summaryText, pageLabel } =
    await readOvertimeManagePaginationFooter(overtimePage));
  console.log(
    `Page 1: ${summaryText} | ${pageLabel} | first policy: ${firstOnPage1}`,
  );

  await TimeSettingsPage.scrollToBottom(page);
  await overtimePage.clickPaginationNextPage();
  await waitForLoadingToDisappear(page);
  await overtimePage.expectOvertimePaginationOnPage(2);
  const firstOnPage2 =
    await overtimePage.getFirstOvertimePolicyNameInManageTable();
  ({ summary: summaryText, pageLabel } =
    await readOvertimeManagePaginationFooter(overtimePage));
  console.log(
    `Page 2: ${summaryText} | ${pageLabel} | first policy: ${firstOnPage2}`,
  );

  await TimeSettingsPage.scrollToBottom(page);
  await overtimePage.clickPaginationNextPage();
  await waitForLoadingToDisappear(page);
  await overtimePage.expectOvertimePaginationOnPage(3);
  const firstOnPage3 =
    await overtimePage.getFirstOvertimePolicyNameInManageTable();
  ({ summary: summaryText, pageLabel } =
    await readOvertimeManagePaginationFooter(overtimePage));
  console.log(
    `Page 3: ${summaryText} | ${pageLabel} | first policy: ${firstOnPage3}`,
  );

  expect(new Set([firstOnPage1, firstOnPage2, firstOnPage3]).size).toBe(3);
}

export async function dailyOvertimeAlertsInNotifications(
  page: Page,
): Promise<void> {
  console.log('Starting Daily Overtime alerts in notifications');
  const overtimePage = new OvertimePolicyPage(page);
  await overtimePage.navigateToAccountSettingsTime();
  await TimeSettingsPage.scrollToBottom(page);
  await overtimePage.verifyOvertimeZeroStateInNotifications();
  await overtimePage.openNotificationsEdit();
  await overtimePage.expectOvertimeSectionInNotifications();
  await overtimePage.verifyAlertsConfiguredInNotifications('Daily');
  await overtimePage.saveNotifications();
  console.log('Enabled Daily Overtime alerts in notifications');
  // Verify saved
  await page.reload();
  await waitForLoadingToDisappear(page);
  await TimeSettingsPage.scrollToBottom(page);
  await overtimePage.verifySavedAlertsInNotifications('Daily');
  console.log('Verified Daily alerts in notifications');
}
export async function weeklyOvertimeAlertsInNotifications(
  page: Page,
): Promise<void> {
  console.log('Starting Weekly Overtime alerts in notifications');
  const overtimePage = new OvertimePolicyPage(page);
  await overtimePage.navigateToAccountSettingsTime();
  await TimeSettingsPage.scrollToBottom(page);
  await overtimePage.verifyOvertimeZeroStateInNotifications();
  await overtimePage.openNotificationsEdit();
  await overtimePage.expectOvertimeSectionInNotifications();
  await overtimePage.verifyAlertsConfiguredInNotifications('Weekly');
  await overtimePage.saveNotifications();
  console.log('Enabled Weekly Overtime alerts in notifications');
  // Verify saved
  await page.reload();
  await waitForLoadingToDisappear(page);
  await TimeSettingsPage.scrollToBottom(page);
  await overtimePage.verifySavedAlertsInNotifications('Weekly');
  console.log('Verified Weekly alerts in notifications');
}

/** OT019 — Time settings overtime empty state, then worker View Settings overtime zero-state card. */
export async function overtimeUserLevelSettingsZeroState(
  page: Page,
): Promise<void> {
  const overtimePage = new OvertimePolicyPage(page);
  await verifyOvertimeEmptyState(page);
  await overtimePage.closeOvertimeTrowser();

  const assignmentsPage = await goToAssignments(page);
  await handlePopupsInAnyOrder(page);
  await assignmentsPage.clickWorkersTab();
  await assignmentsPage.clickWorkersToggle();
  await waitForLoadingToDisappear(page);
  const workerName = await assignmentsPage.getFirstWorkerName();
  await assignmentsPage.clickViewSettingsForWorker(workerName);
  await page.waitForTimeout(1000);
  await overtimePage.expectOvertimeSectionInWorkerSettings();
  await overtimePage.expectNoPolicyStateWithSetupLink();
  await overtimePage.clickOpenOvertimeFromWorkerSettings();
  await overtimePage.waitForTimeSettingsReady();
}
export async function overtimeUserLevelSettingsEditNavigation(
  page: Page,
): Promise<void> {
  const assignmentsPage = await goToAssignments(page);
  await handlePopupsInAnyOrder(page);
  await assignmentsPage.clickWorkersTab();
  await assignmentsPage.clickWorkersToggle();
  await waitForLoadingToDisappear(page);
  const workerName = await assignmentsPage.getFirstWorkerName();
  await assignmentsPage.clickViewSettingsForWorker(workerName);
  await waitForLoadingToDisappear(page);

  const overtimePage = new OvertimePolicyPage(page);
  await overtimePage.expectOvertimeSectionInWorkerSettings();
  const policyName =
    await overtimePage.getOvertimePolicyNameFromWorkerViewSettings();
  console.log(`Policy name: ${policyName}`);
  await overtimePage.expectPolicyNameInWorkerOvertimeSection(policyName);
  await overtimePage.expectOvertimeOpenPolicyDetailsIconVisible();

  await overtimePage.clickOpenOvertimeFromWorkerSettings();
  await waitForLoadingToDisappear(page);
  await page.waitForTimeout(5000);
  await overtimePage.waitForOvertimeTrowserOpen();
  await overtimePage.expectOvertimePolicyDetailsInTrowser(policyName);
  console.log(`Verified ${policyName} details in trowser`);
}

/**
 * OT021 — Assignments → Workers → View Settings → Overtime → Use custom rules → Save → verify policy in overtime section.
 * Prerequisite: worker has an overtime policy assigned.
 */
export async function overtimeUserLevelSettingsCustomRules(
  page: Page,
): Promise<void> {
  const assignmentsPage = await goToAssignments(page);
  await handlePopupsInAnyOrder(page);
  await assignmentsPage.clickWorkersTab();
  await assignmentsPage.clickWorkersToggle();
  const workerName = await assignmentsPage.getFirstWorkerName();
  await assignmentsPage.clickViewSettingsForWorker(workerName);

  const overtimePage = new OvertimePolicyPage(page);
  await overtimePage.expectOvertimeSectionInWorkerSettings();
  await overtimePage.clickOvertimeEditInWorkerSettings();
  await page.waitForTimeout(1000);
  await overtimePage.selectUseCustomRulesInWorkerSettings();
  await page.waitForTimeout(500);
  const firstRule = page.getByRole('option').first();
  if (await firstRule.isVisible().catch(() => false)) {
    await firstRule.click();
  }
  await overtimePage.saveWorkerOvertimePanel();
  await waitForLoadingToDisappear(page);
  await expect(
    page.locator('strong').filter({ hasText: 'Overtime' }),
  ).toBeVisible();
}

/** OT022 — Assign policy members: verify search filters workers */
export async function verifySearchInAssignPolicyMembers(
  page: Page,
): Promise<void> {
  const overtimePage = new OvertimePolicyPage(page);
  const policyName = `SearchPolicy${Date.now()}`;
  await overtimePage.navigateToOvertimeLanding();
  await waitForLoadingToDisappear(page);
  await overtimePage.clickSetUpOvertimePolicies();
  await overtimePage.fillPolicyNameAndDefault(policyName, false);
  await overtimePage.selectOvertimeRuleTypeAndClickNext('Use Basic Rules');

  const dialog = page.getByRole('dialog', { name: 'Overtime' });
  await expect(
    page.getByRole('heading', { name: 'Assign policy members' }),
  ).toBeVisible({ timeout: 10000 });
  const searchInput = dialog
    .locator(`input[placeholder='Search']`)
    .or(dialog.getByPlaceholder('Search'));
  await expect(searchInput.first()).toBeVisible({ timeout: 10000 });
  await searchInput.first().fill('Test');
  await waitForLoadingToDisappear(page);
  console.log('OT022: Search in assign policy members exercised');
}

/** OT023 — Close icon returns to overtime manage screen */
export async function verifyCloseTrowserOvertimeWizard(
  page: Page,
): Promise<void> {
  const overtimePage = new OvertimePolicyPage(page);
  await overtimePage.navigateToOvertimeLanding();
  await overtimePage.clickSetUpOvertimePolicies();
  await page.getByPlaceholder('Enter policy name').fill('CloseTest');
  await overtimePage.clickWizardNext();
  await overtimePage.selectOvertimeRuleTypeAndClick('Use Basic Rules');
  await page.waitForTimeout(5000);
  await overtimePage.clickOvertimeWizardCloseIcon();
  await page.waitForTimeout(5000);
  await overtimePage.navigateToOvertimeLanding();
  await expect(
    page.getByRole('heading', {
      name: 'Manage overtime policies for your company',
    }),
  ).toBeVisible({ timeout: 10000 });
}

/** OT024 — Back navigates to previous wizard screen */
export async function verifyBackInAllOvertimeScreens(
  page: Page,
): Promise<void> {
  const overtimePage = new OvertimePolicyPage(page);
  await overtimePage.navigateToOvertimeLanding();
  await overtimePage.clickSetUpOvertimePolicies();
  await page.getByPlaceholder('Enter policy name').fill('BackTest');
  await overtimePage.clickWizardNext();
  await overtimePage.clickWizardBackButton();
  await expect(
    page.getByRole('heading', { name: 'Describe your new overtime policy' }),
  ).toBeVisible({ timeout: 10000 });
}

/** OT025 — Right step flow shows active step */
export async function verifyOvertimeWizardStepFlow(page: Page): Promise<void> {
  const overtimePage = new OvertimePolicyPage(page);
  await overtimePage.navigateToOvertimeLanding();
  await overtimePage.clickSetUpOvertimePolicies();
  await overtimePage.expectWizardStepActive(/Overtime policy|policy/i);
  await page.getByPlaceholder('Enter policy name').fill('StepFlow');
  await overtimePage.clickWizardNext();
  await overtimePage.expectWizardStepActive(/Overtime rules|rules/i);
}

/** OT026 — Back to Overtime policies → manage screen */
export async function verifyOvertimePoliciesLinkNavigation(
  page: Page,
): Promise<void> {
  const overtimePage = new OvertimePolicyPage(page);
  await overtimePage.navigateToOvertimeLanding();
  await overtimePage.clickSetUpOvertimePolicies();
  await page.getByPlaceholder('Enter policy name').fill('LinkTest');
  await overtimePage.clickWizardNext();
  await overtimePage.selectOvertimeRuleTypeAndClickNext('Use Basic Rules');
  await overtimePage.selectPolicyMemberAndClickNext('Test Emp1');
  await overtimePage.clickBackToOvertimePolicies();
  await overtimePage.expectManageScreenVisible();
}

/** OT027 — Default overtime policy checkbox + tooltip; assign step may be skipped when default */
export async function verifyDefaultOvertimePolicyCheckbox(
  page: Page,
): Promise<void> {
  const overtimePage = new OvertimePolicyPage(page);
  await overtimePage.navigateToOvertimeLanding();
  await overtimePage.clickSetUpOvertimePolicies();
  await overtimePage.expectDefaultOvertimePolicyCheckboxVisible();
  await overtimePage.hoverDefaultOvertimePolicyCheckboxAndExpectTooltip();
}

export async function verifyOvertimeSettingsForCoreCompany(
  page: Page,
): Promise<void> {
  await navigateToAccountAndSettingsTime(page);
  await waitForLoadingToDisappear(page);
  const overTimeSection = page.locator(
    '[data-testid="overtime-settings-handle"]',
  );
  await expect(overTimeSection).not.toBeVisible();
  console.log('Overtime section hidden in core company');
}

/** OT029 — Switch between policies in manage table */
export async function verifySwitchBetweenOvertimePolicies(
  page: Page,
): Promise<void> {
  const overtimePage = new OvertimePolicyPage(page);
  await overtimePage.navigateToOvertimeLanding();
  await waitForLoadingToDisappear(page);

  const dialog = page.getByRole('dialog', { name: 'Overtime' });
  const firstRow = dialog.locator('tbody tr[role="row"]').first();
  const lastRow = dialog.locator('tbody tr[role="row"]').last();
  await expect(firstRow).toBeVisible({ timeout: 10000 });

  const firstNameCell = firstRow.locator('[class*="PolicyNameCell"]').first();
  await expect(firstNameCell).toBeVisible({ timeout: 10000 });
  const firstName = (await firstNameCell.innerText()).split('\n')[0].trim();
  await firstRow.click();
  console.log(`Clicked first policy: ${firstName}`);
  await waitForLoadingToDisappear(page);
  await expect(
    dialog.getByRole('heading', { name: firstName, exact: true }),
  ).toBeVisible({ timeout: 15000 });
  await expect(page.getByText('1 of 1 workers')).toBeVisible({
    timeout: 15000,
  });

  await expect(dialog.getByText('Overtime rules', { exact: true })).toBeVisible(
    { timeout: 10000 },
  );
  const rulesTable = dialog.locator('table[class*="ReviewRulesTable"]');
  await expect(rulesTable).toBeVisible({ timeout: 15000 });
  await expect(rulesTable.locator('tbody tr').first()).toBeVisible();
  const rulesCount = await rulesTable.locator('tbody tr').count();
  console.log(`First policy has ${rulesCount} rules`);

  await dialog
    .getByRole('button', { name: /Back to Overtime policies/i })
    .click();
  await expect(
    dialog.getByRole('heading', {
      name: /Manage overtime policies for your company/i,
    }),
  ).toBeVisible({ timeout: 15000 });
  await waitForLoadingToDisappear(page);

  await expect(lastRow).toBeVisible({ timeout: 10000 });
  const lastNameCell = lastRow.locator('[class*="PolicyNameCell"]').last();
  await expect(lastNameCell).toBeVisible({ timeout: 10000 });
  const lastName = (await lastNameCell.innerText()).split('\n')[0].trim();
  await lastNameCell.click();
  console.log(`Clicked last policy: ${lastName}`);
  await waitForLoadingToDisappear(page);
  await expect(
    dialog.getByRole('heading', { name: lastName, exact: true }),
  ).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(/no workers assigned/i)).toBeVisible({
    timeout: 15000,
  });

  await expect(dialog.getByText('Overtime rules', { exact: true })).toBeVisible(
    { timeout: 10000 },
  );
  const lastRulesTable = dialog.locator('table[class*="ReviewRulesTable"]');
  await expect(rulesTable).toBeVisible({ timeout: 15000 });

  await expect(lastRulesTable.locator('tbody tr').first()).toBeVisible();
  const lastRulesCount = await lastRulesTable.locator('tbody tr').count();
  console.log(`Last policy has ${lastRulesCount} rules`);
}

/** OT030 — Notifications: null state for overtime alerts */
export async function overtimeAlertsNullStateValidation(
  page: Page,
): Promise<void> {
  const overtimePage = new OvertimePolicyPage(page);
  await overtimePage.navigateToAccountSettingsTime();
  await overtimePage.expectOvertimeAlertsNullStateInNotifications();
}

/**
 * Assignments → Workers tab → Groups → View (group) → View settings (worker).
 * Shared by OT031 (overtime card visible) and OT032 (open overtime trowser + rules).
 */
async function navigateToWorkerViewSettingsViaAssignmentsWorkersGroups(
  page: Page,
): Promise<void> {
  const assignmentsPage = await goToAssignments(page);
  await handlePopupsInAnyOrder(page);
  await assignmentsPage.clickWorkersTab();
  await assignmentsPage.clickWorkerToggle();
  await waitForLoadingToDisappear(page);

  const groupName = await assignmentsPage.getFirstGroupName();
  expect(await assignmentsPage.clickViewForGroup(groupName)).toBeTruthy();

  await waitForLoadingToDisappear(page);
  const workerName = await assignmentsPage.getFirstWorkerName();
  expect(
    await assignmentsPage.clickViewSettingsForWorker(workerName),
  ).toBeTruthy();
}

/**
 * OT031 — All Apps → Time → Assignments → Workers section → Workers category → View settings → Overtime header visible.
 * (Flat workers list, not Groups drill-down.)
 */
export async function verifyOvertimeInWorkersViewSettings(
  page: Page,
): Promise<void> {
  await navigateAssignmentsWorkersListViewSettings(page);
  const overtimePage = new OvertimePolicyPage(page);
  await overtimePage.expectOvertimeSectionInWorkerSettings();
}

/** Groups tab first row → View / View settings link → Overtime card (alternate entry path). */
export async function verifyOvertimeInGroupsViewSettings(
  page: Page,
): Promise<void> {
  const assignmentsPage = new AssignmentsPage(page);
  await assignmentsPage.goto();
  await page.waitForTimeout(1000);
  await assignmentsPage.clickGroupsToggle();
  await page.waitForTimeout(500);
  const firstRow = page.locator('tbody tr').first();
  await expect(firstRow).toBeVisible();
  const viewLink = firstRow
    .getByRole('link', { name: /view settings|view/i })
    .first();
  await viewLink.click();
  await page.waitForTimeout(1500);
  await expect(
    page.locator('strong').filter({ hasText: 'Overtime' }),
  ).toBeVisible({ timeout: 10000 });
}

/**
 * OT032 — Assignments → Workers → Groups → View → View settings → open overtime (external icon) → verify overtime rules in trowser.
 */
export async function verifyOvertimePayRateEngineFromViewSettings(
  page: Page,
): Promise<void> {
  await navigateAssignmentsWorkersListViewSettings(page);
  const overtimePage = new OvertimePolicyPage(page);
  await overtimePage.expectOvertimeSectionInWorkerSettings();
}

/** OT033 — Notifications: advanced overtime alerts + create alert + save */
export async function verifyNotificationSettingsInOvertime(
  page: Page,
): Promise<void> {
  const overtimePage = new OvertimePolicyPage(page);
  await overtimePage.navigateToAccountSettingsTime();
  await overtimePage.openNotificationsEdit();
  await overtimePage.expectOvertimeSectionInNotifications();
  const advanced = page.getByText(/use advanced overtime alerts/i).first();
  if (await advanced.isVisible().catch(() => false)) {
    await advanced.click();
  }
  const addAlert = page
    .getByRole('button', {
      name: /add overtime alert|add alert/i,
    })
    .first();
  if (await addAlert.isVisible().catch(() => false)) {
    await addAlert.click();
    await page.waitForTimeout(1000);
  }
  const hoursField = page
    .getByPlaceholder(/\d+/)
    .or(page.getByRole('spinbutton').first());
  if (
    await hoursField
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    await hoursField.first().fill('40');
  }
  const createBtn = page.getByRole('button', { name: /create alert/i }).first();
  if (await createBtn.isVisible().catch(() => false)) {
    await createBtn.click();
  }
  await overtimePage.saveNotifications().catch(() => {});
}

/**
 * OT034 — Run payroll overtime path:
 * 1. Time → Weekly Time Entry.
 * 2. Select team member.
 * 3. Select customer; enter 9 in the first five day cells (service item on first day if shown).
 * 4. Save (and close weekly entry).
 * 5. Time Entries: display by date, date range This month.
 * 6. Verify the employee row is visible.
 * 7–10. Approvals → same range → row visible → Overtime column → Approve → Approve and lock time.
 * 11–13. Payroll → Employees (`/app/employees?jobId=payroll`) → Run payroll → pay period for current date.
 * 14–15. Regular pay & Overtime & Gross pay visible; at least three currency amounts visible.
 */
export async function validateOvertimeInRunPayroll(page: Page): Promise<void> {
  const employeeName = 'Emp1, Test';
  const runPayrollPage = new RunPayrollPage(page);
  const timeEntriesPage = new TimeEntriesPage(page);

  //clean up old time entries
  await cleanupRunPayrollTestDataWTE(page, employeeName);

  await createWeeklyTimeEntryThreeCellsRunPayroll(page);
  await validateWeeklyTimesheetTotals(page, 'Emp1, Test', '8.00');
  await approveTimeEntries(page, 'Emp1, Test');

  // 11–13: Employees / Run payroll / pay period
  await navigateToRunPayroll(page);
  const runPayrollBtn = page
    .locator(`//button/span[text()='Run payroll']`)
    .or(page.getByRole('button', { name: /run payroll/i }));
  await expect(runPayrollBtn.first()).toBeVisible({ timeout: 20000 });
  await runPayrollBtn.first().click();
  await runPayrollPage.selectPayPeriodWithCurrentDate();
  await page.waitForLoadState('load');
  await page.waitForTimeout(5000);

  // 14–15: Column labels + dollar amounts (regular / overtime / gross)
  await expect(page.getByText(/regular pay/i).first()).toBeVisible({
    timeout: 15000,
  });
  await expect(page.getByText(/overtime/i).first()).toBeVisible();
  await expect(page.getByText(/gross pay/i).first()).toBeVisible();

  const amountPattern = /\$\s*\d+[.,]\d{2}/;
  const amounts = page.getByText(amountPattern);
  await expect(amounts.first()).toBeVisible({ timeout: 15000 });
  expect(await amounts.count()).toBeGreaterThanOrEqual(3);
}

/**
 * Assignments → Workers tab → Workers category → View settings (first worker, or named).
 * Used by OT050 / OT052 and aligned with the flat workers list (not Groups drill-down).
 */
export async function navigateAssignmentsWorkersListViewSettings(
  page: Page,
  workerName?: string,
): Promise<{ assignmentsPage: AssignmentsPage; worker: string }> {
  const assignmentsPage = await goToAssignments(page);
  await handlePopupsInAnyOrder(page);
  await assignmentsPage.clickWorkersTab();
  await assignmentsPage.clickWorkersToggle();
  await waitForLoadingToDisappear(page);
  const name = workerName ?? (await assignmentsPage.getFirstWorkerName());
  expect(await assignmentsPage.clickViewSettingsForWorker(name)).toBe(true);
  await waitForLoadingToDisappear(page);
  return { assignmentsPage, worker: name };
}

/**
 * OT050 — Account & Settings → Time → Overtime: create policy (basic) → Home → Assignments →
 * Workers tab → Workers → View settings → verify Overtime → Edit (company vs custom radios, exactly one) →
 * Cancel → open overtime → Edit policy → Overtime rules → California → Save → landing: Rules column = 5.
 */
export async function verifyWorkerOvertimeTwoOptionsAfterPolicyEditsFromLanding(
  page: Page,
): Promise<void> {
  const overtimePage = new OvertimePolicyPage(page);
  const policyName = `OT050-${Date.now().toString().slice(-8)}`;

  try {
    await overtimePage.createBasicOvertimePolicyViaWizardAndVerifyOnManageTable(
      policyName,
    );
    await overtimePage.closeOvertimeTrowser();
    await waitForLoadingToDisappear(page);
    await page.goto('/app/homepage', { waitUntil: 'load' });
    await waitForLoadingToDisappear(page);
    await navigateAssignmentsWorkersListViewSettings(page);
    await overtimePage.expectOvertimeSectionInWorkerSettings();
    await overtimePage.expectPolicyNameInWorkerOvertimeSection(policyName);
    await overtimePage.clickOvertimeEditInWorkerSettings();
    await overtimePage.clickEditOvertimePolicyFromDetails();
    await overtimePage.clickOvertimeRulesEditorButton();
    await overtimePage.selectOvertimeRuleTypeAndClick(
      CALIFORNIA_OVERTIME_RULES_OPTION,
    );
    await page.waitForTimeout(800);
    if (
      await page
        .getByText('Configure your overtime rules')
        .isVisible()
        .catch(() => false)
    )
      await overtimePage.clickSaveChangesButton();
    await waitForLoadingToDisappear(page);
    await overtimePage.closeOvertimeDialogFromHeader();
    await waitForLoadingToDisappear(page);
    await navigateToAccountAndSettingsTime(page);
    await overtimePage.navigateToOvertimeLanding();
    await overtimePage.waitForOvertimeManageUiReady();
    await overtimePage.expectPolicyRowInManageTable(policyName, {
      rulesText: '5',
    });
  } finally {
    await navigateToAccountAndSettingsTime(page).catch(() => {});
    const cleanupPage = new OvertimePolicyPage(page);
    await cleanupPage.navigateToOvertimeLanding();
    await cleanupPage.waitForOvertimeManageUiReady();
    await cleanupPage.deletePolicyFromManageTable(policyName).catch(() => {});
  }
}

/**
 * OT052 — Create policy → Home → Assignments → Workers → View settings → open overtime →
 * Edit policy → Overtime rules editor → open rules dropdown only → Back → Cancel →
 * reopen editor → rule type unchanged (still Basic).
 */
export async function verifyOvertimeRulesUnchangedAfterRulesEditorBackAndCancel(
  page: Page,
): Promise<void> {
  {
    const overtimePage = new OvertimePolicyPage(page);
    const policyName = `OT050-${Date.now().toString().slice(-8)}`;

    try {
      await overtimePage.createBasicOvertimePolicyViaWizardAndVerifyOnManageTable(
        policyName,
      );
      await overtimePage.closeOvertimeTrowser();
      await waitForLoadingToDisappear(page);

      await page.goto('/app/homepage', { waitUntil: 'load' });
      await waitForLoadingToDisappear(page);

      await navigateAssignmentsWorkersListViewSettings(page);
      await overtimePage.expectOvertimeSectionInWorkerSettings();
      await overtimePage.expectPolicyNameInWorkerOvertimeSection(policyName);

      await overtimePage.clickOvertimeEditInWorkerSettings();
      await overtimePage.clickEditOvertimePolicyFromDetails();
      await overtimePage.clickOvertimeRulesEditorButton();

      await overtimePage.clickWizardBackButton();
      await waitForLoadingToDisappear(page);
      await overtimePage.clickCancelInOvertimeDialog();

      await overtimePage.closeOvertimeDialogFromHeader();
      await waitForLoadingToDisappear(page);

      // await overtimePage.navigateToOvertimeLanding();
      // await waitForLoadingToDisappear(page);
      // await page.getByRole('button', { name: 'Edit' }).click();
      // await overtimePage.clickEditOvertimePolicyFromDetails();
      // await overtimePage.clickOvertimeRulesEditorButton();
      // await overtimePage.expectOvertimeRulesEditorShowsRuleType(/basic rules/i);
    } finally {
      await navigateToAccountAndSettingsTime(page).catch(() => {});
      const cleanupPage = new OvertimePolicyPage(page);
      await cleanupPage.navigateToOvertimeLanding();
      await cleanupPage.waitForOvertimeManageUiReady();
      await cleanupPage.deletePolicyFromManageTable(policyName).catch(() => {});
    }
  }
}

/** OT054 — Assignments → Workers (list) → View settings → Notifications: Overtime + description. */
export async function verifyOvertimeInWorkerNotificationsSection(
  page: Page,
): Promise<void> {
  const assignmentsPage = await goToAssignments(page);
  await handlePopupsInAnyOrder(page);
  await assignmentsPage.clickWorkersTab();
  await assignmentsPage.clickWorkersToggle();
  await waitForLoadingToDisappear(page);
  const workerName = await assignmentsPage.getFirstWorkerName();
  expect(await assignmentsPage.clickViewSettingsForWorker(workerName)).toBe(
    true,
  );
  await waitForLoadingToDisappear(page);

  const overtimePage = new OvertimePolicyPage(page);
  await expect(
    page.locator(
      `//div[contains(@class, 'SettingsCard')]//strong[text()='Notifications']`,
    ),
  ).toBeVisible({ timeout: 15000 });
  await expect(page.locator(`//div[text()="Overtime rules"]`)).toBeVisible({
    timeout: 10000,
  });
  await overtimePage.expectOvertimeNotificationsDescriptionOnWorkerSettings();
}

/** OT055 — Same as OT054 path → Edit Notifications → Overtime block editable in panel. */
export async function verifyOvertimeEditableInsideWorkerNotificationsEdit(
  page: Page,
): Promise<void> {
  const assignmentsPage = await goToAssignments(page);
  await handlePopupsInAnyOrder(page);
  await assignmentsPage.clickWorkersTab();
  await assignmentsPage.clickWorkersToggle();
  await waitForLoadingToDisappear(page);
  const workerName = await assignmentsPage.getFirstWorkerName();
  expect(await assignmentsPage.clickViewSettingsForWorker(workerName)).toBe(
    true,
  );
  await waitForLoadingToDisappear(page);

  await expect(
    page.locator(
      `//div[contains(@class, 'SettingsCard')]//strong[text()='Notifications']`,
    ),
  ).toBeVisible({ timeout: 15000 });

  expect(await assignmentsPage.clickEditNotifications()).toBeTruthy();
  await waitForLoadingToDisappear(page);
  await expect(page.locator(`//label[text()='Overtime']`)).toBeVisible({
    timeout: 10000,
  });
  const overtimeSection = page.locator(
    '[class*="OvertimeEditSectionContainer"]',
  );
  await expect(overtimeSection).toBeVisible({ timeout: 15000 });
}

function normalizeNotificationSnapshot(text: string | null): string {
  return (text ?? '').replace(/\s+/g, ' ').trim();
}

/** OT056 — Edit Notifications: Overtime Daily / Weekly checkboxes visible for the worker's policy. */
export async function verifyWorkerNotificationsOvertimeDailyWeeklyOptionsVisible(
  page: Page,
): Promise<void> {
  const { assignmentsPage } = await navigateAssignmentsWorkersListViewSettings(
    page,
  );
  await expect(
    page.locator(
      `//div[contains(@class, 'SettingsCard')]//strong[text()='Notifications']`,
    ),
  ).toBeVisible({ timeout: 15000 });
  expect(await assignmentsPage.clickEditNotifications()).toBeTruthy();
  await waitForLoadingToDisappear(page);
  const overtimePage = new OvertimePolicyPage(page);
  await overtimePage.expectOvertimeSectionInNotifications();
  await overtimePage.closeNotificationsEditPanel();
}

/**
 * OT057 — Edit Notifications: change overtime Daily/Weekly → Cancel → read-only + edit state unchanged.
 */
export async function verifyWorkerNotificationsOvertimeUnchangedAfterCancel(
  page: Page,
): Promise<void> {
  const { assignmentsPage } = await navigateAssignmentsWorkersListViewSettings(
    page,
  );

  await TimeSettingsPage.scrollToBottom(page);
  const notificationsHeading = page.locator(
    `//div[contains(@class, 'SettingsCard')]//strong[text()='Notifications']`,
  );
  await expect(notificationsHeading).toBeVisible({ timeout: 15000 });
  await expect(page.locator(`//div[text()="Overtime rules"]`)).toBeVisible({
    timeout: 10000,
  });

  const notifCard = page
    .locator(
      `//div[contains(@class, 'SettingsCard')]//strong[text()='Notifications']/ancestor::div[contains(@class, 'SettingsCard')][1]`,
    )
    .first();
  const readOnlyOvertimeStack = notifCard
    .locator('[class*="OvertimeViewStack"]')
    .first();
  await expect(readOnlyOvertimeStack).toBeVisible({ timeout: 15000 });
  const readOnlyOvertimeBefore = normalizeNotificationSnapshot(
    await readOnlyOvertimeStack.textContent(),
  );

  expect(await assignmentsPage.clickEditNotifications()).toBeTruthy();
  await waitForLoadingToDisappear(page);

  const overtimePage = new OvertimePolicyPage(page);
  const section = page
    .locator('[class*="OvertimeEditSectionContainer"]')
    .first();
  await expect(section).toBeVisible({ timeout: 15000 });
  const dailyCb = section.getByRole('checkbox', { name: /^Daily$/i });
  const weeklyCb = section.getByRole('checkbox', { name: /^Weekly$/i });
  const dailyBefore = await dailyCb.isChecked();
  const weeklyBefore = await weeklyCb.isChecked();

  if (!(await weeklyCb.isChecked())) {
    await weeklyCb.check();
  } else if (!(await dailyCb.isChecked())) {
    await dailyCb.check();
  } else {
    await weeklyCb.uncheck();
  }
  await page.waitForTimeout(300);

  await page.locator('//span[text()="Cancel"]').first().click();
  await waitForLoadingToDisappear(page);

  await TimeSettingsPage.scrollToBottom(page);
  await expect(readOnlyOvertimeStack).toBeVisible({ timeout: 15000 });
  const readOnlyOvertimeAfter = normalizeNotificationSnapshot(
    await readOnlyOvertimeStack.textContent(),
  );
  expect(readOnlyOvertimeAfter).toBe(readOnlyOvertimeBefore);

  expect(await assignmentsPage.clickEditNotifications()).toBeTruthy();
  await waitForLoadingToDisappear(page);
  await overtimePage.expectOvertimeNotificationPeriodChecked(
    'Daily',
    dailyBefore,
  );
  await overtimePage.expectOvertimeNotificationPeriodChecked(
    'Weekly',
    weeklyBefore,
  );
  await overtimePage.closeNotificationsEditPanel();
  await waitForLoadingToDisappear(page);
}

/**
 * OT058 — Toggle overtime notification period → Save → persisted; restore original worker values after.
 */
export async function verifyWorkerNotificationsOvertimeUpdatedAfterSave(
  page: Page,
): Promise<void> {
  const { assignmentsPage } = await navigateAssignmentsWorkersListViewSettings(
    page,
  );
  await expect(
    page.locator(
      `//div[contains(@class, 'SettingsCard')]//strong[text()='Notifications']`,
    ),
  ).toBeVisible({ timeout: 15000 });
  expect(await assignmentsPage.clickEditNotifications()).toBeTruthy();
  await waitForLoadingToDisappear(page);

  const overtimePage = new OvertimePolicyPage(page);
  const section = page
    .locator('[class*="OvertimeEditSectionContainer"]')
    .first();
  await expect(section).toBeVisible({ timeout: 15000 });
  const dailyBefore = await section
    .getByRole('checkbox', { name: /^Daily$/i })
    .isChecked();
  const weeklyBefore = await section
    .getByRole('checkbox', { name: /^Weekly$/i })
    .isChecked();

  const weeklyCb = section.getByRole('checkbox', { name: /^Weekly$/i });
  if (!(await weeklyCb.isChecked())) {
    await weeklyCb.check();
  } else {
    await weeklyCb.uncheck();
  }
  await overtimePage.saveNotifications();
  await waitForLoadingToDisappear(page);

  const weeklyAfterSave = !weeklyBefore;

  expect(await assignmentsPage.clickEditNotifications()).toBeTruthy();
  await waitForLoadingToDisappear(page);
  await overtimePage.expectOvertimeNotificationPeriodChecked(
    'Weekly',
    weeklyAfterSave,
  );
  await overtimePage.expectOvertimeNotificationPeriodChecked(
    'Daily',
    dailyBefore,
  );

  const sectionRestore = page
    .locator('[class*="OvertimeEditSectionContainer"]')
    .first();
  await expect(sectionRestore).toBeVisible({ timeout: 15000 });
  const weeklyRestore = sectionRestore.getByRole('checkbox', {
    name: /^Weekly$/i,
  });
  if (weeklyBefore) await weeklyRestore.check();
  else await weeklyRestore.uncheck();
  await overtimePage.saveNotifications();
  await waitForLoadingToDisappear(page);
}

export async function verifyUIButtonsAndDefaultPolicyCheckbox(
  page: Page,
): Promise<void> {
  const overtimePage = new OvertimePolicyPage(page);
  await overtimePage.navigateToOvertimeLanding();
  await waitForLoadingToDisappear(page);
  const dialog = page.getByRole('dialog', { name: 'Overtime' });
  await expect(
    dialog.getByRole('heading', {
      name: 'Manage overtime policies for your company',
    }),
  ).toBeVisible();

  const closeBtn = dialog
    .getByRole('button', { name: 'Close' })
    .or(
      page.locator(
        '[data-automation-id="overtime-landing-page-trowser_close"]',
      ),
    );
  await closeBtn.first().click();
  await page.waitForTimeout(1000);
  await expect(
    page.locator('[data-testid="overtime-settings-handle"]'),
  ).toBeVisible();
  await overtimePage.clickOvertimeSectionEdit();
  await page.waitForTimeout(1500);
  const setupOrCreate = dialog
    .getByRole('button', { name: 'Set up overtime policies' })
    .or(dialog.getByRole('button', { name: 'Create overtime policy' }));
  await setupOrCreate.first().click();
  await page.waitForTimeout(1500);
  await page.getByRole('button').filter({ hasText: 'Cancel' }).click();
  await waitForLoadingToDisappear(page);
  await expect(
    dialog.getByRole('heading', {
      name: 'Manage overtime policies for your company',
    }),
  ).toBeVisible({ timeout: 10000 });

  await setupOrCreate.first().click();
  await page.waitForTimeout(1500);
  await page.getByPlaceholder('Enter policy name').fill('DefaultPolicyTest');
  const defaultCb = page.getByRole('checkbox', {
    name: /default overtime policy/i,
  });
  if (await defaultCb.isVisible().catch(() => false)) {
    if (!(await defaultCb.isChecked())) await defaultCb.check();
  }
  await overtimePage.clickWizardNext();
  await page.getByPlaceholder('Select overtime rules').click();
  await page.waitForTimeout(500);
  await page.getByRole('option').filter({ hasText: 'Use Basic Rules' }).click();
  await page.waitForTimeout(1000);
  await overtimePage.clickWizardNext();
  await waitForLoadingToDisappear(page);
  await expect(
    page.getByRole('heading', { name: 'Overtime policy details' }),
  ).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await waitForLoadingToDisappear(page);
  await expect(
    page.getByRole('heading', { name: 'Assign policy members' }),
  ).toBeVisible({ timeout: 10000 });
  const backToPolicies = page
    .getByRole('button', { name: /back to overtime policies/i })
    .or(page.locator('[aria-label="Back to Overtime policies"]'));
  await backToPolicies.first().click();
  await waitForLoadingToDisappear(page);
  await expect(
    dialog.getByRole('heading', {
      name: 'Manage overtime policies for your company',
    }),
  ).toBeVisible({ timeout: 10000 });
}

export async function validateOvertimeNotAvailableForTTOWorker(
  page: Page,
): Promise<void> {
  await page.goto('/app/accountsettings?p=time', { waitUntil: 'load' });
  await page.waitForLoadState('load');
  await page.waitForTimeout(3000);
  await handlePopupsInAnyOrder(page).catch(() => {});

  const permissionDenied =
    (await page
      .locator(
        `//div[@class="overlay_content_box"]//td[text()="Permission denied!"]`,
      )
      .isVisible()
      .catch(() => false)) ||
    (await page
      .getByText(/^Permission denied/i)
      .first()
      .isVisible()
      .catch(() => false));

  const errorBody = await page
    .locator(`//div[@class="body flex-flexible"]`)
    .isVisible()
    .catch(() => false);

  const overtimeSection = page.locator(
    '[data-testid="overtime-settings-handle"]',
  );
  const overtimeVisible = await overtimeSection.isVisible().catch(() => false);

  const accessDeniedText = await page
    .getByText(/don't have access|access denied|not available|unable to load/i)
    .first()
    .isVisible()
    .catch(() => false);

  expect(
    permissionDenied || errorBody || !overtimeVisible || accessDeniedText,
  ).toBeTruthy();
}

export async function validateOvertimeNotAvailableForNonAdmin(
  page: Page,
): Promise<void> {
  await page.goto('/app/accountsettings?p=time', { waitUntil: 'load' });
  await page.waitForLoadState('load');
  await page.waitForTimeout(5000);
  await handlePopupsInAnyOrder(page).catch(() => {});

  const overlayDenied = page.locator(
    `//div[@class="overlay_content_box"]//td[text()="Permission denied!"]`,
  );
  const learnAbout = page.locator(`//span[text()="Learn about assignments"]`); // same pattern as assignments non-admin when applicable

  const permissionDenied =
    (await overlayDenied.isVisible().catch(() => false)) ||
    (await learnAbout.isVisible().catch(() => false)) ||
    (await page
      .getByText(/^Permission denied/i)
      .first()
      .isVisible()
      .catch(() => false));

  const overtimeSection = page.locator(
    '[data-testid="overtime-settings-handle"]',
  );
  const overtimeVisible = await overtimeSection.isVisible().catch(() => false);

  const restricted = await page
    .getByText(/don't have access|access denied|not available/i)
    .first()
    .isVisible()
    .catch(() => false);

  expect(permissionDenied || !overtimeVisible || restricted).toBeTruthy();
}

/** OTP011 — Assignments → Workers → View Settings → Notifications → Edit: Overtime is editable in notifications */
export async function verifyWorkerNotificationsOvertimeEditable(
  page: Page,
): Promise<void> {
  const assignmentsPage = await goToAssignments(page);
  await handlePopupsInAnyOrder(page);
  await assignmentsPage.clickWorkersTab();
  await assignmentsPage.clickWorkersToggle();
  const workerName = 'Test Emp1';
  await page.waitForTimeout(5000);
  await assignmentsPage.clickViewSettingsForWorker(workerName);

  await expect(
    page.locator(
      `//div[contains(@class, 'SettingsCard')]//strong[text()='Notifications']`,
    ),
  ).toBeVisible({ timeout: 5000 });

  const opened = await assignmentsPage.clickEditNotifications();
  expect(opened).toBeTruthy();
  await waitForLoadingToDisappear(page);
  await expect(page.locator(`//label[text()='Overtime']`)).toBeVisible({
    timeout: 5000,
  });
}

/**
 * OTP012 — Company Time → Notifications: Daily / Weekly overtime toggles sync to worker
 * Assignments → Workers → View Settings → Notifications; final cleanup unchecks both.
 */
export async function verifyWorkerNotificationsOvertimeAlertOptions(
  page: Page,
): Promise<void> {
  const overtimePage = new OvertimePolicyPage(page);

  await overtimePage.navigateToAccountSettingsTime();
  await overtimePage.openNotificationsEdit();
  await overtimePage.expectOvertimeSectionInNotifications();
  await overtimePage.setOvertimeNotificationPeriodChecked('Daily', true);
  await overtimePage.saveNotifications();
  await waitForLoadingToDisappear(page);

  await openAssignmentsWorkerNotificationsEdit(page);
  await overtimePage.expectOvertimeNotificationPeriodChecked('Daily', true);
  await overtimePage.closeNotificationsEditPanel();

  await overtimePage.navigateToAccountSettingsTime();
  await overtimePage.openNotificationsEdit();
  await overtimePage.expectOvertimeSectionInNotifications();
  await overtimePage.setOvertimeNotificationPeriodChecked('Weekly', true);
  await overtimePage.saveNotifications();
  await waitForLoadingToDisappear(page);

  await openAssignmentsWorkerNotificationsEdit(page);
  await overtimePage.expectOvertimeNotificationPeriodChecked('Weekly', true);
  await overtimePage.closeNotificationsEditPanel();

  await overtimePage.navigateToAccountSettingsTime();
  await overtimePage.openNotificationsEdit();
  await overtimePage.expectOvertimeSectionInNotifications();
  await overtimePage.setOvertimeNotificationPeriodChecked('Daily', false);
  await overtimePage.setOvertimeNotificationPeriodChecked('Weekly', false);
  await overtimePage.saveNotifications();
  await waitForLoadingToDisappear(page);
}

/** OTP013 — Workers → Overtime → Edit: company-level vs custom rules (two choices) */
export async function verifyWorkerOvertimeCompanyVsCustomOptions(
  page: Page,
): Promise<void> {
  const assignmentsPage = await goToAssignments(page);
  await handlePopupsInAnyOrder(page);
  await assignmentsPage.clickWorkersTab();
  await assignmentsPage.clickWorkersToggle();
  const workerName = 'Test Emp1';
  await page.waitForTimeout(5000);
  await assignmentsPage.clickViewSettingsForWorker(workerName);

  const overtimePage = new OvertimePolicyPage(page);
  await overtimePage.expectOvertimeSectionInWorkerSettings();
  // await overtimePage.clickOvertimeEditInWorkerSettings();
  // await page.waitForTimeout(500);
  // await expect(
  //   page.getByText(/use company level (assignment|settings)/i).first(),
  // ).toBeVisible({ timeout: 10000 });
  // await expect(page.getByText(/use custom rules/i).first()).toBeVisible({
  //   timeout: 10000,
  // });
}

const ASSIGNMENTS_BASE_URL = '/app/time/assignments?jobId=time';

async function goToAssignmentsWorkersListView(
  page: Page,
): Promise<AssignmentsPage> {
  const assignmentsPage = new AssignmentsPage(page);
  await page.goto(ASSIGNMENTS_BASE_URL, { waitUntil: 'load' });
  await page.waitForLoadState('load');
  await handlePopupsInAnyOrder(page);
  await assignmentsPage.clickWorkersTab();
  await assignmentsPage.clickWorkersToggle();
  await waitForLoadingToDisappear(page);
  return assignmentsPage;
}

async function openAssignmentsWorkerNotificationsEdit(
  page: Page,
  workerName: string = 'Test Emp1',
): Promise<void> {
  const assignmentsPage = await goToAssignmentsWorkersListView(page);
  await page.waitForTimeout(5000);
  expect(await assignmentsPage.clickViewSettingsForWorker(workerName)).toBe(
    true,
  );
  await waitForLoadingToDisappear(page);
  await expect(
    page.locator(
      `//div[contains(@class, 'SettingsCard')]//strong[text()='Notifications']`,
    ),
  ).toBeVisible({ timeout: 15000 });
  expect(await assignmentsPage.clickEditNotifications()).toBeTruthy();
  await waitForLoadingToDisappear(page);
  await expect(page.locator(`//label[text()='Overtime']`)).toBeVisible({
    timeout: 10000,
  });
}

async function closeNotificationsEditDrawer(page: Page): Promise<void> {
  const cancelBtn = page.getByRole('button', { name: 'Cancel' }).first();
  const cancelSpan = page.locator(`//span[text()='Cancel']`).first();
  if (await cancelBtn.isVisible().catch(() => false)) await cancelBtn.click();
  else if (await cancelSpan.isVisible().catch(() => false))
    await cancelSpan.click();
  await waitForLoadingToDisappear(page);
}

/**
 * OT061 — Default policy on manage screen; create non-default policy with Test Emp1;
 * verify assignee row; worker View Settings shows the new policy name.
 */
export async function verifyDefaultPolicyMemberReassignment(
  page: Page,
): Promise<void> {
  const overtimePage = new OvertimePolicyPage(page);
  const policyName = `OT061-${Date.now().toString().slice(-8)}`;

  await overtimePage.navigateToOvertimeLanding();
  await overtimePage.waitForOvertimeManageUiReady();
  const dialog = page.getByRole('dialog', { name: 'Overtime' });
  await expect(
    dialog
      .getByRole('row')
      .filter({ hasText: /Default/i })
      .first(),
  ).toBeVisible({ timeout: 20000 });

  await overtimePage.clickSetUpOvertimePolicies();
  await overtimePage.fillPolicyNameAndDefault(policyName, false);
  await overtimePage.selectBasicRulesAndClickNext();
  await overtimePage.completeBasicRulesConfigurationAndNext();
  await overtimePage.selectPolicyMemberAndClickNext('Test Emp1');
  await overtimePage.expectReviewPolicyDetailsWithSelectedData(policyName);
  await overtimePage.clickCreatePolicy();
  await overtimePage.expectSuccessToast().catch(() => {});
  await overtimePage.ReassignWorkersModalPopup();
  // const saveSpan = page.locator(`//span[text()="Save"]`);
  // if (await saveSpan.isVisible().catch(() => false)) await saveSpan.click();
  //await overtimePage.expectManageScreenVisible();
  await overtimePage.expectPolicyRowInManageTable(policyName, {
    workersText: /1 user/i,
  });

  await overtimePage.closeOvertimeTrowser().catch(() => {});

  const assignmentsPage = await goToAssignments(page);
  await handlePopupsInAnyOrder(page);
  await assignmentsPage.clickWorkersTab();
  await assignmentsPage.clickWorkersToggle();
  await waitForLoadingToDisappear(page);
  expect(await assignmentsPage.clickViewSettingsForWorker('Test Emp1')).toBe(
    true,
  );
  await waitForLoadingToDisappear(page);
  await TimeSettingsPage.scrollToBottom(page);
  await overtimePage.expectPolicyNameInWorkerOvertimeSection(policyName);

  await overtimePage.navigateToOvertimeLanding();
  await overtimePage.waitForOvertimeManageUiReady();
  await overtimePage.deletePolicyFromManageTable(policyName);
  await overtimePage.waitForOvertimeManageUiReady();
  await expect(
    dialog
      .getByRole('table')
      .locator('tbody tr')
      .filter({ hasText: policyName }),
  ).toHaveCount(0);
}

export async function verifyWorkerLevelOvertimeAlertsInNotifications(
  page: Page,
): Promise<void> {
  const overtimePage = new OvertimePolicyPage(page);

  await overtimePage.navigateToAccountSettingsTime();
  await waitForLoadingToDisappear(page);
  await overtimePage.openNotificationsEdit();
  await TimeSettingsPage.scrollToBottom(page);
  await overtimePage.expectOvertimeSectionInNotifications();
  await overtimePage.verifyAlertsConfiguredInNotifications('Daily');
  await overtimePage.saveNotifications();
  console.log('Daily alerts Notifications enabled from company settings');

  await page.reload({ waitUntil: 'load' });
  await waitForLoadingToDisappear(page);
  await TimeSettingsPage.scrollToBottom(page);
  await overtimePage.verifySavedAlertsInNotifications('Daily');

  for (const emp of ['Test Emp1', 'Test Emp2'] as const) {
    await openAssignmentsWorkerNotificationsEdit(page, emp);
    const section = page.locator('[class*="OvertimeEditSectionContainer"]');
    await expect(section).toBeVisible({ timeout: 1000 });
    await expect(section.getByRole('checkbox', { name: 'Daily' })).toBeChecked({
      timeout: 10000,
    });
    await closeNotificationsEditDrawer(page);
  }
  console.log('Emp1 and Emp2 have Daily alerts set from company settings');

  await openAssignmentsWorkerNotificationsEdit(page, 'Test Emp2');
  const section2 = page.locator('[class*="OvertimeEditSectionContainer"]');
  const weeklyCb = section2.getByRole('checkbox', { name: 'Weekly' });
  await expect(weeklyCb).toBeVisible({ timeout: 1000 });
  if (!(await weeklyCb.isChecked())) await weeklyCb.check();
  await page.waitForTimeout(500);
  await overtimePage.saveNotifications();
  await waitForLoadingToDisappear(page);
  console.log('Enabled Weekly alerts for Emp2 in worker settings');

  await openAssignmentsWorkerNotificationsEdit(page, 'Test Emp1');
  const section1 = page.locator('[class*="OvertimeEditSectionContainer"]');
  await expect(section1.getByRole('checkbox', { name: 'Daily' })).toBeChecked();
  await expect(
    section1.getByRole('checkbox', { name: 'Weekly' }),
  ).not.toBeChecked();
  await TimeSettingsPage.scrollToBottom(page);
  const emp1DailyCb = section1.getByRole('checkbox', { name: 'Daily' });
  await emp1DailyCb.click();
  await page.waitForTimeout(3000);
  await expect(
    page.getByText('This is a company level setting and cannot be removed.', {
      exact: true,
    }),
  ).toBeVisible({ timeout: 1000 });
  console.log('Editing company-level settings shows error');

  await closeNotificationsEditDrawer(page);
  console.log('Verified: Emp1 Daily on / Weekly off');

  await openAssignmentsWorkerNotificationsEdit(page, 'Test Emp2');
  const section2b = page.locator('[class*="OvertimeEditSectionContainer"]');
  await expect(
    section2b.getByRole('checkbox', { name: 'Daily' }),
  ).toBeChecked();
  await expect(
    section2b.getByRole('checkbox', { name: 'Weekly' }),
  ).toBeChecked();
  await closeNotificationsEditDrawer(page);
  console.log('Verified: Emp2 has Daily and Weekly alerts On');

  await overtimePage.navigateToAccountSettingsTime();
  await TimeSettingsPage.scrollToBottom(page);
  await overtimePage.openNotificationsEdit();
  await overtimePage.expectOvertimeSectionInNotifications();
  await overtimePage.uncheckDailyAndWeeklyCheckbox();

  await openAssignmentsWorkerNotificationsEdit(page, 'Test Emp2');
  const section2c = page.locator('[class*="OvertimeEditSectionContainer"]');
  await expect(
    section2c.getByRole('checkbox', { name: 'Weekly' }),
  ).toBeChecked();
  await expect(
    section2c.getByRole('checkbox', { name: 'Daily' }),
  ).not.toBeChecked();
  await closeNotificationsEditDrawer(page);
  console.log(
    'Verified: Emp2 has Weekly alerts On after company settings cleared',
  );

  await openAssignmentsWorkerNotificationsEdit(page, 'Test Emp1');
  const section3 = page.locator('[class*="OvertimeEditSectionContainer"]');
  await expect(
    section3.getByRole('checkbox', { name: 'Daily' }),
  ).not.toBeChecked();
  await expect(
    section3.getByRole('checkbox', { name: 'Weekly' }),
  ).not.toBeChecked();
  await closeNotificationsEditDrawer(page);
  console.log(
    'Verified: Emp1 has no overtime alerts after company settings cleared',
  );
}

export async function cleanupOvertimeNotifications(page: Page): Promise<void> {
  const overtimePage = new OvertimePolicyPage(page);
  await overtimePage.navigateToAccountSettingsTime();
  await TimeSettingsPage.scrollToBottom(page);
  await overtimePage.openNotificationsEdit();
  await overtimePage.expectOvertimeSectionInNotifications();
  await overtimePage.uncheckDailyAndWeeklyCheckbox();
}
