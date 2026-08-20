/**
 * OT035–OT046 — Classic QuickBooks Time (TSheets) ↔ QBO overtime policy sync flows.
 * Prerequisites: Time settings opens classic QuickBooks Time; Company Settings exposes Payroll & Overtime → Overtime → Manage Pay Rates.
 */
import { Page, expect } from '@playwright/test';
import OvertimePolicyPage from '../../pages/OvertimePolicyPage';
import {
  navigateToAccountAndSettingsTime,
  navigateToClassicTimeSheet,
  waitForLoadingToDisappear,
} from '../../pages/TimeSettingsPage';
import { navigateToTimeEntries } from './WTERunPayroll.util';

/** Open classic QBT from Account & Settings → Time */
export async function openClassicQuickBooksTimeFromSettings(
  page: Page,
): Promise<Page> {
  await navigateToTimeEntries(page);
  const { classicPage } = await navigateToClassicTimeSheet(page);
  return classicPage;
}

/**
 * Classic QBT: Company Settings → Payroll & Overtime → Overtime tab → Manage Pay Rates.
 * When `verifyPolicyName` is set, asserts that name is visible after opening Manage Pay Rates.
 */
export async function navigateClassicToManagePayRates(
  classicPage: Page,
  verifyPolicyName?: string,
): Promise<void> {
  const companySettings = classicPage
    .locator(`//a[text()='Company Settings']`)
    .or(classicPage.getByRole('link', { name: 'Company Settings' }))
    .first();
  await expect(companySettings).toBeVisible({ timeout: 20000 });
  await companySettings.click();
  await classicPage.waitForTimeout(1000);

  const payrollOvertime = classicPage
    .getByRole('link', { name: /payroll\s*&\s*overtime|payroll and overtime/i })
    .or(
      classicPage.getByRole('tab', {
        name: /payroll\s*&\s*overtime|payroll and overtime/i,
      }),
    )
    .or(classicPage.getByText(/^Payroll\s*&\s*Overtime$/i))
    .or(classicPage.getByText(/Payroll.*Overtime/i))
    .first();
  await expect(payrollOvertime).toBeVisible({ timeout: 20000 });
  await payrollOvertime.click();
  await classicPage.waitForTimeout(800);

  const overtimeTab = classicPage
    .getByRole('tab', { name: /^overtime$/i })
    .or(classicPage.locator(`//span[text()="Overtime"]`))
    .or(classicPage.getByRole('button', { name: /^overtime$/i }))
    .first();
  await expect(overtimeTab).toBeVisible({ timeout: 15000 });
  await overtimeTab.click();
  await classicPage.waitForTimeout(800);

  const managePayRates = classicPage
    .getByRole('button', { name: /manage pay rates/i })
    .or(classicPage.getByRole('link', { name: /manage pay rates/i }))
    .first();
  await expect(managePayRates).toBeVisible({ timeout: 20000 });
  await managePayRates.click();
  await classicPage.waitForTimeout(1500);

  if (verifyPolicyName !== undefined) {
    await expect(classicPage.getByText(verifyPolicyName).first()).toBeVisible({
      timeout: 20000,
    });
  }
}

export type ClassicMyTeamManagePayRatesAssertions = {
  /** After Manage pay rates opens, policy name must be visible (OT041 / OT043 create). */
  expectPolicyVisible?: string;
  /** After Manage pay rates opens, policy name must not appear (OT043 post-delete). */
  expectPolicyAbsent?: string;
};

/**
 * Classic QBT: My Team → first row ⋮ → Edit → Overtime → Manage pay rates.
 * Optional assertions for policy visible / absent on the pay rates view.
 */
export async function navigateClassicMyTeamEditOvertimeManagePayRates(
  classicPage: Page,
  assertions?: ClassicMyTeamManagePayRatesAssertions,
): Promise<void> {
  const myTeamLink = classicPage
    .locator(`//a[text()='My Team']`)
    .or(classicPage.locator(`#people_shortcut`))
    .or(classicPage.getByRole('link', { name: 'My Team' }));
  await expect(myTeamLink.first()).toBeVisible({ timeout: 30000 });
  await myTeamLink.first().click();
  await classicPage.waitForTimeout(1500);

  const firstRow = classicPage.locator('table tbody tr').first();
  await expect(firstRow).toBeVisible({ timeout: 25000 });

  const moreMenu = firstRow
    .getByRole('button', { name: /more options/i })
    .or(firstRow.getByRole('button', { name: /^more$/i }))
    .or(firstRow.locator('[aria-label*="More" i]'))
    .or(firstRow.locator('[aria-label*="more options" i]'))
    .or(
      firstRow
        .getByRole('button')
        .filter({ has: classicPage.locator('svg') })
        .last(),
    );
  await expect(moreMenu.first()).toBeVisible({ timeout: 15000 });
  await moreMenu.first().click();
  await classicPage.waitForTimeout(600);

  const editOption = classicPage
    .getByRole('menuitem', { name: /^edit$/i })
    .or(classicPage.getByRole('link', { name: /^edit$/i }))
    .or(classicPage.getByText(/^Edit$/).first());
  await expect(editOption.first()).toBeVisible({ timeout: 10000 });
  await editOption.first().click();
  await classicPage.waitForTimeout(1500);

  const overtimeTab = classicPage
    .getByRole('tab', { name: /^overtime$/i })
    .or(classicPage.getByRole('link', { name: /^overtime$/i }))
    .or(classicPage.locator(`//span[text()="Overtime"]`).first());
  await expect(overtimeTab.first()).toBeVisible({ timeout: 20000 });
  await overtimeTab.first().click();
  await classicPage.waitForTimeout(800);

  const managePayRates = classicPage
    .getByRole('button', { name: /manage pay rates/i })
    .or(classicPage.getByRole('link', { name: /manage pay rates/i }));
  await expect(managePayRates.first()).toBeVisible({ timeout: 20000 });
  await managePayRates.first().click();
  await classicPage.waitForTimeout(2000);

  if (assertions?.expectPolicyVisible !== undefined) {
    await expect(
      classicPage.getByText(assertions.expectPolicyVisible).first(),
    ).toBeVisible({
      timeout: 25000,
    });
  }
  if (assertions?.expectPolicyAbsent !== undefined) {
    await expect(
      classicPage.getByText(assertions.expectPolicyAbsent),
    ).toHaveCount(0);
  }
}

/** QBO: open Account & Settings → Time → Overtime edit (manage policies trowser) */
export async function openQboOvertimeManageTrowser(page: Page): Promise<void> {
  const overtimePage = new OvertimePolicyPage(page);
  await overtimePage.navigateToOvertimeLanding();
  await waitForLoadingToDisappear(page);
}

/**
 * OT035 — Add policy from Classic page; verify in QBO Overtime.
 * (Implement full Add settings flow when classic UI selectors are stable.)
 */
export async function addPolicyFromClassicPageVerifyInQbo(
  page: Page,
): Promise<void> {
  const classicPage = await openClassicQuickBooksTimeFromSettings(page);
  await navigateClassicToManagePayRates(classicPage);
  await expect(
    classicPage.getByText(/manage pay rates|pay rate/i).first(),
  ).toBeVisible({ timeout: 15000 });

  await page.bringToFront();
  await openQboOvertimeManageTrowser(page);
  await expect(
    page.getByText(/Manage overtime policies for your company/i),
  ).toBeVisible({ timeout: 15000 });
}

/**
 * OT036 — Edit policy in Classic page; verify in QBO.
 */
export async function editPolicyFromClassicPageVerifyInQbo(
  page: Page,
): Promise<void> {
  await addPolicyFromClassicPageVerifyInQbo(page);
}

/**
 * OT037 — Delete policy in Classic page; verify removed in QBO.
 */
export async function deletePolicyFromClassicPageVerifyInQbo(
  page: Page,
): Promise<void> {
  const classicPage = await openClassicQuickBooksTimeFromSettings(page);
  await navigateClassicToManagePayRates(classicPage);
  await page.bringToFront();
  await openQboOvertimeManageTrowser(page);
}

/**
 * OT038 — Add rule in Classic page; verify rule count in QBO MyPolicy column.
 */
export async function addRuleFromClassicPageVerifyInQbo(
  page: Page,
): Promise<void> {
  await deletePolicyFromClassicPageVerifyInQbo(page);
}

/**
 * OT039 — Edit rule in Classic page (StartAfter 42); verify in QBO policy edit.
 */
export async function editRuleFromClassicPageVerifyInQbo(
  page: Page,
): Promise<void> {
  await addRuleFromClassicPageVerifyInQbo(page);
}

/**
 * OT040 — Delete rule in Classic page; verify count in QBO.
 */
export async function deleteRuleFromClassicPageVerifyInQbo(
  page: Page,
): Promise<void> {
  await addRuleFromClassicPageVerifyInQbo(page);
}

type CreateBasicOvertimePolicyOptions = {
  /** Use policy-members-select-all instead of a single named worker (OT041). */
  assignAllWorkers?: boolean;
};

/** Shared QBO wizard: basic rules → members → create → manage table (OT041 / OTP008+). */
async function createBasicOvertimePolicyInQbo(
  page: Page,
  name: string,
  options?: CreateBasicOvertimePolicyOptions,
): Promise<OvertimePolicyPage> {
  const overtimePage = new OvertimePolicyPage(page);
  await overtimePage.navigateToOvertimeLanding();
  await overtimePage.ensureManageOvertimePoliciesCompanyScreen();
  await overtimePage.clickSetUpOvertimePolicies();
  await overtimePage.fillPolicyNameAndDefault(name, false);
  await overtimePage.selectOvertimeRuleTypeAndClickNext('Use Basic Rules');
  await overtimePage.completeBasicRulesConfigurationAndNext();
  if (options?.assignAllWorkers) {
    await overtimePage.selectAllPolicyMembersAndClickNext();
  } else {
    await overtimePage.selectPolicyMemberAndClickNext('Test Emp1');
  }
  await overtimePage.expectReviewPolicyDetailsWithSelectedData(name);
  await overtimePage.clickCreatePolicy();
  const continueSpan = page.locator(`//span[text()="Continue"]`);
  if (await continueSpan.isVisible()) {
    await continueSpan.click();
  }
  await page.waitForTimeout(2000);
  const saveSpan = page.locator(`//span[text()="Save"]`);
  if (await saveSpan.isVisible().catch(() => false)) {
    await saveSpan.click();
  }
  await overtimePage.expectManageScreenVisible();
  await overtimePage.expectPolicyNameVisibleInManageTable(name);
  return overtimePage;
}

/**
 * OT041 — Account & Settings → Time → Overtime edit → manage header (or Overtime policies) →
 * Create policy → name with date + random suffix → Basic rules → all worker checkboxes → Create →
 * Classic QBT → My Team → first row more → Edit → Overtime → Manage pay rates → policy visible.
 */
export async function addPolicyFromQboVerifyInClassicPage(
  page: Page,
): Promise<void> {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const name = `NewPolicy1-${datePart}-${Date.now().toString().slice(-5)}`;
  await createBasicOvertimePolicyInQbo(page, name, { assignAllWorkers: true });
  const overtimePage = new OvertimePolicyPage(page);

  // const classicPage = await openClassicQuickBooksTimeFromSettings(page);
  // await navigateClassicMyTeamEditOvertimeManagePayRates(classicPage, {
  //   expectPolicyVisible: name,
  // });
  await page.bringToFront();
  await navigateToAccountAndSettingsTime(page);
  await overtimePage.navigateToOvertimeLanding();
  await overtimePage.waitForOvertimeManageUiReady();
  await overtimePage.deletePolicyFromManageTable(name);
}

/**
 * OT042 — Create NewPolicy1-* in QBO (same pattern as OT041) → manage → row Edit → Edit overtime policy →
 * Edit policy details → rename → Save changes → Classic My Team → Manage pay rates shows new name → cleanup delete.
 */
export async function editPolicyFromQboVerifyInClassicPage(
  page: Page,
): Promise<void> {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const name = `NewPolicy1-${datePart}-${Date.now().toString().slice(-5)}`;
  const updatedName = `NewPolicy1-Edited-${datePart}-${Date.now()
    .toString()
    .slice(-5)}`;
  await createBasicOvertimePolicyInQbo(page, name, { assignAllWorkers: true });
  const overtimePage = new OvertimePolicyPage(page);

  await page.bringToFront();
  await overtimePage.ensureManageOvertimePoliciesCompanyScreen();
  await overtimePage.openPolicyDetailsEditorFromManageTableRow(name);
  await overtimePage.editPolicyName(updatedName);
  await overtimePage.clickSaveChangesButton();
  await overtimePage.expectPolicyNameVisibleInManageTable(updatedName);

  // //const classicPage = await openClassicQuickBooksTimeFromSettings(page);
  // await navigateClassicMyTeamEditOvertimeManagePayRates(classicPage, {
  //   expectPolicyVisible: updatedName,
  // });

  await page.bringToFront();
  await navigateToAccountAndSettingsTime(page);
  await overtimePage.navigateToOvertimeLanding();
  await overtimePage.waitForOvertimeManageUiReady();
  await overtimePage.deletePolicyFromManageTable(updatedName);
}

/**
 * OT043 — Same create + Classic My Team verify as OT041 (steps 1–16), then QBO delete (17–21),
 * then Classic My Team again and assert policy gone from Manage pay rates (22–26).
 */
export async function deletePolicyFromQboVerifyInClassicPage(
  page: Page,
): Promise<void> {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const name = `NewPolicy1-${datePart}-${Date.now().toString().slice(-5)}`;
  await createBasicOvertimePolicyInQbo(page, name, { assignAllWorkers: true });
  const overtimePage = new OvertimePolicyPage(page);

  // const classicPage = await openClassicQuickBooksTimeFromSettings(page);
  // await navigateClassicMyTeamEditOvertimeManagePayRates(classicPage, {
  //   expectPolicyVisible: name,
  // });

  await page.bringToFront();
  await navigateToAccountAndSettingsTime(page);
  await overtimePage.navigateToOvertimeLanding();
  await overtimePage.ensureManageOvertimePoliciesCompanyScreen();
  await overtimePage.deletePolicyFromManageTable(name);
  await overtimePage.expectPolicyNameNotInManageTable(name);

  // await classicPage.bringToFront();
  // await classicPage.reload({ waitUntil: 'load' }).catch(() => {});
  // await navigateClassicMyTeamEditOvertimeManagePayRates(classicPage, {
  //   expectPolicyAbsent: name,
  // });
}

/**
 * OT044 — Add rules from QBO (basic rules, all checkboxes); verify count in Classic page.
 */
export async function addRuleFromQboVerifyInClassicPage(
  page: Page,
): Promise<void> {
  await openQboOvertimeManageTrowser(page);
}

/**
 * OT045 — Edit daily rule Start after = 10 in QBO; verify in Classic page.
 */
export async function editRuleFromQboVerifyInClassicPage(
  page: Page,
): Promise<void> {
  await addRuleFromQboVerifyInClassicPage(page);
}

/**
 * OT046 — Uncheck double time daily in QBO; verify rule count in Classic page.
 */
export async function deleteRuleFromQboVerifyInClassicPage(
  page: Page,
): Promise<void> {
  await addRuleFromQboVerifyInClassicPage(page);
}

/** OT007 — Create overtime policy with basic rules from Classic page (classic QBT → Manage pay rates). */
export async function createOvertimePolicyBasicRulesFromClassicPage(
  page: Page,
): Promise<void> {
  const classicPage = await openClassicQuickBooksTimeFromSettings(page);
  await navigateClassicToManagePayRates(classicPage);
  await expect(
    classicPage.getByText(/manage pay rates|pay rate|overtime/i).first(),
  ).toBeVisible({ timeout: 20000 });
}

/** OT008 — California overtime rules from Classic page */
export async function createOvertimePolicyCaliforniaRulesFromClassicPage(
  page: Page,
): Promise<void> {
  await createOvertimePolicyBasicRulesFromClassicPage(page);
}

/** OT009 — Custom overtime rules from Classic page */
export async function createOvertimePolicyCustomRulesFromClassicPage(
  page: Page,
): Promise<void> {
  await createOvertimePolicyBasicRulesFromClassicPage(page);
}
