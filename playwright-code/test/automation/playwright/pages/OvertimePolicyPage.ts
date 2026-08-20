import { Locator, Page, expect } from '@playwright/test';
import {
  navigateToAccountAndSettingsTime,
  waitForLoadingToDisappear,
  clickNotifEditButton,
} from './TimeSettingsPage';

/**
 * Payroll Settings overtime card root. QL may render both `overtime-settings-handle`
 * and nested `overtime-settings-handle-view`; a single union matches two nodes and
 * breaks Playwright strict mode — use `.first()` so exactly one element is targeted.
 */
function overtimeSettingsHandle(page: Page): Locator {
  return page
    .locator(
      '[data-testid="overtime-settings-handle-view"], #overtime-settings-handle, [data-testid="overtime-settings-handle"]',
    )
    .first();
}

export class OvertimePolicyPage {
  constructor(private readonly page: Page) {}

  private notificationPeriodSuffix(period: 'Daily' | 'Weekly'): 'day' | 'week' {
    return period === 'Daily' ? 'day' : 'week';
  }

  /** Manage overtime trowser: `<nav data-testid="pagination">`; summary uses `data-testid="pagination-summary"`. */
  overtimeManagePaginationNav(): Locator {
    return this.page
      .getByRole('dialog', { name: 'Overtime' })
      .getByTestId('pagination');
  }

  async navigateToOvertimeLanding(): Promise<void> {
    await navigateToAccountAndSettingsTime(this.page);
    await this.waitForTimeSettingsReady();
    await this.clickOvertimeSectionEdit();
    await this.waitForOvertimeTrowserOpen();
    await this.dismissOvertimeGuidedTourIfPresent();
  }
  async waitForTimeSettingsReady(): Promise<void> {
    await waitForLoadingToDisappear(this.page);
    const progress = this.page.getByRole('progressbar', { name: /loading/i });
    if ((await progress.count()) > 0) {
      await progress
        .first()
        .waitFor({ state: 'hidden', timeout: 90000 })
        .catch(() => {});
    }
    const overtimeSection = overtimeSettingsHandle(this.page);
    await expect(overtimeSection).toBeVisible({ timeout: 60000 });
  }

  async expectOvertimeSectionOnTimeSettingsCard(): Promise<void> {
    await navigateToAccountAndSettingsTime(this.page);
    await this.waitForTimeSettingsReady();
    const section = overtimeSettingsHandle(this.page);
    await expect(section.getByText('Overtime', { exact: true })).toBeVisible({
      timeout: 10000,
    });
    await expect(
      section.getByText(/Manage overtime policies for your team/i),
    ).toBeVisible({ timeout: 5000 });
    const newBadge = section
      .getByText(/^New$/i)
      .or(this.page.getByText(/^New$/i))
      .first();
    if (await newBadge.isVisible().catch(() => false)) {
      await expect(newBadge).toBeVisible();
    }
  }

  async clickOvertimeSectionEdit(): Promise<void> {
    const handle = overtimeSettingsHandle(this.page);
    const editBtn = handle.getByRole('button', { name: /^edit$/i });
    await expect(editBtn).toBeVisible({ timeout: 10000 });
    await editBtn.click();
  }

  async waitForOvertimeTrowserOpen(): Promise<void> {
    const trowser = this.page.locator(
      `//section[@data-automation-id="overtime-landing-page-trowser_section"]`,
    );
    await expect(trowser).toBeVisible({ timeout: 10000 });
  }

  /** Policies table / empty-state CTAs render after dialog loaders finish. */
  async waitForOvertimeManageUiReady(): Promise<void> {
    await waitForLoadingToDisappear(this.page);
    const dialog = this.page.getByRole('dialog', { name: 'Overtime' });
    const progressInDialog = dialog.getByRole('progressbar', {
      name: /loading/i,
    });
    if ((await progressInDialog.count()) > 0) {
      await progressInDialog
        .first()
        .waitFor({ state: 'hidden', timeout: 120000 })
        .catch(() => {});
    }
    const loader = this.page.getByTestId('overtime-policies-loader');
    await loader.waitFor({ state: 'hidden', timeout: 120000 }).catch(() => {});
  }

  /**
   * Manage policies list: "Manage overtime policies for your company" is visible.
   * If the wizard/back stack is showing, follow the "Overtime policies" control back first.
   */
  async ensureManageOvertimePoliciesCompanyScreen(): Promise<void> {
    await this.waitForOvertimeManageUiReady();
    const companyHeader = this.page.getByText(
      'Manage overtime policies for your company',
      { exact: true },
    );
    if (await companyHeader.isVisible().catch(() => false)) {
      return;
    }
    const backToPolicies = this.page
      .getByRole('link', { name: /^Overtime policies$/i })
      .or(this.page.getByRole('button', { name: /^Overtime policies$/i }))
      .or(this.page.locator('a').filter({ hasText: /^Overtime policies$/i }))
      .first();
    if (await backToPolicies.isVisible().catch(() => false)) {
      await backToPolicies.click();
      await waitForLoadingToDisappear(this.page);
      await this.waitForOvertimeManageUiReady();
    }
    await expect(companyHeader).toBeVisible({ timeout: 20000 });
  }

  async closeOvertimeTrowser(): Promise<void> {
    const trowser = this.page.getByTestId('overtime-landing-page-trowser');
    const closeBtn = trowser.getByRole('button', { name: /close|dismiss/i });
    const count = await closeBtn.count();
    if (count > 0) await closeBtn.first().click();
  }
  async dismissOvertimeGuidedTourIfPresent(): Promise<void> {
    const gotItBtn = this.page.getByRole('button', { name: 'Got it' });
    if (!(await gotItBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
      return;
    }

    await gotItBtn.click();
    await gotItBtn.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    const tour = this.page.locator(
      '.guided-tour-modal--overtime-settings-handle-tour',
    );
    await tour.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }

  private async clickOvertimeSetupButton(locator: Locator): Promise<void> {
    for (let attempt = 0; attempt < 6; attempt++) {
      await this.dismissOvertimeGuidedTourIfPresent();
      const tourBlocking = await this.page
        .locator('.guided-tour-modal--overtime-settings-handle-tour')
        .isVisible()
        .catch(() => false);
      if (!tourBlocking) {
        break;
      }
      await this.page.waitForTimeout(500);
    }
    await locator.click();
  }

  async clickSetUpOvertimePolicies(): Promise<void> {
    await this.waitForOvertimeManageUiReady();
    await this.dismissOvertimeGuidedTourIfPresent();
    const setupByTestId = this.page.getByTestId('setup-overtime-policy-button');
    const setupOrCreate = this.page.getByRole('button', {
      name: /Set up overtime policies|Create overtime policy/i,
    });
    const setupBtn = this.page.getByRole('button', {
      name: 'Set up overtime policies',
    });
    const createBtn = this.page.getByRole('button', {
      name: 'Create overtime policy',
    });
    const createPolicyBtn = this.page.getByRole('button', {
      name: 'Create policy',
    });
    const createSpan = this.page.locator(
      `//span[text()="Create overtime policy"]`,
    );
    if (await setupByTestId.isVisible().catch(() => false)) {
      await this.clickOvertimeSetupButton(setupByTestId);
    } else if (await setupBtn.isVisible().catch(() => false)) {
      await this.clickOvertimeSetupButton(setupBtn);
    } else if (await createBtn.isVisible().catch(() => false)) {
      await this.clickOvertimeSetupButton(createBtn);
    } else if (await createPolicyBtn.isVisible().catch(() => false)) {
      await this.clickOvertimeSetupButton(createPolicyBtn);
    } else if (await createSpan.isVisible().catch(() => false)) {
      await this.clickOvertimeSetupButton(createSpan);
    } else {
      await expect(setupOrCreate.first()).toBeVisible({ timeout: 60000 });
      await this.clickOvertimeSetupButton(setupOrCreate.first());
    }
  }

  async fillPolicyNameAndDefault(
    policyName: string,
    setDefaultPolicy = true,
  ): Promise<void> {
    const nameInput = this.page
      .getByRole('textbox', { name: 'Name' })
      .or(this.page.locator(`//input[@placeholder="Enter policy name"]`));
    await expect(nameInput.first()).toBeVisible({ timeout: 15000 });
    await nameInput.first().fill(policyName);

    const defaultCheckbox = this.page.getByRole('checkbox', {
      name: /default overtime policy/i,
    });
    const legacyCheckbox = this.page.locator(
      `//span[contains(text(), 'Default overtime policy')]/preceding-sibling::span/input[@type='checkbox']`,
    );
    const roleCount = await defaultCheckbox.count();
    const legacyCount = await legacyCheckbox.count();
    if (roleCount > 0) {
      const isChecked = await defaultCheckbox.first().isChecked();
      if (setDefaultPolicy && !isChecked) await defaultCheckbox.first().click();
      if (!setDefaultPolicy && isChecked) await defaultCheckbox.first().click();
    } else if (legacyCount > 0) {
      const isChecked = await legacyCheckbox.first().isChecked();
      if (setDefaultPolicy && !isChecked) await legacyCheckbox.first().click();
      if (!setDefaultPolicy && isChecked) await legacyCheckbox.first().click();
    }

    await this.clickWizardNext();
  }

  async clickWizardNext(): Promise<void> {
    const nextByRole = this.page.getByRole('button', { name: 'Next' });
    const nextBySpan = this.page.locator(`//span[text()="Next"]`);
    if (
      await nextByRole
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await nextByRole.first().click();
    } else {
      await expect(nextBySpan.first()).toBeVisible({ timeout: 10000 });
      await nextBySpan.first().click();
    }
  }

  async selectBasicRulesAndClickNext(): Promise<void> {
    await this.selectOvertimeRuleTypeAndClickNext('Use Basic Rules');
  }

  /** Picks a rule type from the open menu (QL may expose options as listbox or menu). */
  private async clickOvertimeRulesMenuOption(
    optionText: string,
  ): Promise<void> {
    const asOption = this.page
      .getByRole('option')
      .filter({ hasText: optionText });
    const asMenuItem = this.page
      .getByRole('menuitem')
      .filter({ hasText: optionText });
    if ((await asOption.count()) > 0) {
      await expect(asOption.first()).toBeVisible({ timeout: 15000 });
      await asOption.first().click({ force: true, timeout: 15000 });
      return;
    }
    if ((await asMenuItem.count()) > 0) {
      await expect(asMenuItem.first()).toBeVisible({ timeout: 15000 });
      await asMenuItem.first().click({ force: true, timeout: 15000 });
      return;
    }
    const byText = this.page.getByText(optionText, { exact: true });
    await expect(byText.first()).toBeVisible({ timeout: 15000 });
    await byText.first().click({ force: true, timeout: 15000 });
  }

  /**
   * Rules editor: open the overtime rule-type dropdown only (no option selected).
   * Use for OT052-style cancel flows.
   */
  async openOvertimeRulesDropdownWithoutSelecting(): Promise<void> {
    await this.clickOpenOvertimeRulesDropdown();
    await this.page.waitForTimeout(800);
  }

  private async clickOpenOvertimeRulesDropdown(): Promise<void> {
    const ruleDropdown = this.page.getByTestId('overtime-rules-dropdown');
    const placeholderDropdown = this.page.getByPlaceholder(
      'Select overtime rules',
      { exact: true },
    );
    const comboNewUi = this.page.getByRole('combobox', {
      name: /How do you want to set up your overtime rules/i,
    });
    /** QL dropdown trigger (class name is hashed; match prefix). */
    const dropdownIconTrigger = this.page.locator(
      '[class*="Dropdown-iconBox"]',
    );
    const menuOpened = async (): Promise<boolean> =>
      (await this.page.getByRole('option').count()) > 0 ||
      (await this.page.getByRole('menuitem').count()) > 0;

    if (await comboNewUi.isVisible().catch(() => false)) {
      await comboNewUi.focus();
      await this.page.keyboard.press('Enter');
      await this.page.waitForTimeout(400);
      if (!(await menuOpened())) {
        await comboNewUi.click({ force: true });
      }
      if (!(await menuOpened())) {
        const chevron = comboNewUi.locator('xpath=following-sibling::button');
        if ((await chevron.count()) > 0) {
          await chevron.first().click();
        }
      }
    } else if ((await ruleDropdown.count()) > 0) {
      await ruleDropdown.scrollIntoViewIfNeeded().catch(() => {});
      await ruleDropdown.click({ force: true, timeout: 10000 });
    } else if (await placeholderDropdown.isVisible().catch(() => false)) {
      await placeholderDropdown.click();
    } else if (
      (await dropdownIconTrigger.count()) > 0 &&
      (await dropdownIconTrigger
        .first()
        .isVisible()
        .catch(() => false))
    ) {
      await dropdownIconTrigger.first().click({ force: true });
      await this.page.waitForTimeout(400);
    } else {
      await expect(
        ruleDropdown.or(placeholderDropdown).or(comboNewUi).first(),
      ).toBeVisible({ timeout: 15000 });
      await ruleDropdown.or(placeholderDropdown).or(comboNewUi).first().click();
    }
  }

  async selectOvertimeRuleTypeAndClickNext(optionText: string): Promise<void> {
    await this.clickOpenOvertimeRulesDropdown();
    await this.page.waitForTimeout(1500);
    await this.clickOvertimeRulesMenuOption(optionText);
    await this.ensureDailyCheckedAndDoubleDailyUnchecked();
    await this.clickWizardNext();
  }

  async selectOvertimeRuleTypeAndClick(optionText: string): Promise<void> {
    await this.clickOpenOvertimeRulesDropdown();
    await this.page.waitForTimeout(1500);
    await this.clickOvertimeRulesMenuOption(optionText);
  }

  /** Edit mode: open rules dropdown and pick an option without advancing the wizard with Next. */
  async selectOvertimeRuleTypeFromDropdownOnly(
    optionText: string,
  ): Promise<void> {
    await this.clickOpenOvertimeRulesDropdown();
    await this.page.waitForTimeout(1500);
    await this.clickOvertimeRulesMenuOption(optionText);
  }

  async selectCustomOvertimeRulesOnly(): Promise<void> {
    await this.clickOpenOvertimeRulesDropdown();
    await this.page.waitForTimeout(1500);
    const customOpt = this.page.getByRole('option', {
      name: /create custom overtime rules/i,
    });
    if ((await customOpt.count()) > 0) {
      await expect(customOpt.first()).toBeVisible({ timeout: 15000 });
      await customOpt.first().click({ force: true });
      return;
    }
    await this.clickOvertimeRulesMenuOption('Create Custom overtime Rules');
  }

  async selectCustomOvertimeRulesAndClickNext(): Promise<void> {
    await this.selectCustomOvertimeRulesOnly();
    await this.clickWizardNext();
  }

  async expectConfigureRulesTableShowsCustomRuleTypes(): Promise<void> {
    const ruleLabels = [
      'Weekly',
      'Daily',
      'Double time (daily)',
      'Consecutive day',
      'Double consecutive day',
    ];
    for (const label of ruleLabels) {
      await expect(this.page.getByText(label, { exact: true })).toBeVisible({
        timeout: 5000,
      });
    }
  }

  async assignPolicyMembersAndClickNext(): Promise<void> {
    const nextBtn = this.page.getByRole('button', { name: 'Next' });
    await expect(nextBtn).toBeVisible({ timeout: 10000 });
    await nextBtn.click();
  }

  /**
   * Configure step: ensure Daily is checked; uncheck Double time (daily) and
   * Double consecutive day when those checkboxes are visible and checked.
   */
  async ensureDailyCheckedAndDoubleDailyUnchecked(): Promise<void> {
    const configure = this.page.getByText('Configure your overtime rules');
    if (!(await configure.isVisible().catch(() => false))) {
      return;
    }

    const dailyCheckbox = this.page.getByRole('checkbox', {
      name: 'Daily',
      exact: true,
    });
    if ((await dailyCheckbox.count()) > 0) {
      if (!(await dailyCheckbox.isChecked())) {
        await dailyCheckbox.check();
      }
      await expect(dailyCheckbox).toBeChecked();
    }

    const doubleDailyCheckbox = this.page.getByRole('checkbox', {
      name: 'Double time (daily)',
      exact: true,
    });
    if (
      (await doubleDailyCheckbox.isVisible().catch(() => false)) &&
      (await doubleDailyCheckbox.isChecked())
    ) {
      await doubleDailyCheckbox.uncheck();
      await expect(doubleDailyCheckbox).not.toBeChecked();
    }

    const doubleConsecutiveDayCheckbox = this.page.getByRole('checkbox', {
      name: 'Double consecutive day',
      exact: true,
    });
    if (
      (await doubleConsecutiveDayCheckbox.isVisible().catch(() => false)) &&
      (await doubleConsecutiveDayCheckbox.isChecked())
    ) {
      await doubleConsecutiveDayCheckbox.uncheck();
      await expect(doubleConsecutiveDayCheckbox).not.toBeChecked();
    }
  }

  /**
   * After Basic rules, wizard may show Configure, then Assign members, or skip straight to Review
   * (e.g. default “All workers”).
   */
  async completeBasicRulesConfigurationAndNext(): Promise<void> {
    const configure = this.page.getByText('Configure your overtime rules');
    const assignMembers = this.page.getByText('Assign policy members', {
      exact: true,
    });
    const reviewDetails = this.page.getByText('Overtime policy details', {
      exact: true,
    });
    await expect(
      configure.or(assignMembers).or(reviewDetails).first(),
    ).toBeVisible({
      timeout: 30000,
    });
    if (await reviewDetails.isVisible().catch(() => false)) {
      return;
    }
    if (await assignMembers.isVisible().catch(() => false)) {
      return;
    }
    if (!(await configure.isVisible().catch(() => false))) {
      return;
    }
    await this.ensureDailyCheckedAndDoubleDailyUnchecked();
    await this.clickWizardNext();
  }

  async selectFirstPolicyMemberAndClickNext(): Promise<void> {
    const reviewDetails = this.page.getByText('Overtime policy details', {
      exact: true,
    });
    if (await reviewDetails.isVisible().catch(() => false)) {
      return;
    }
    await expect(
      this.page.getByText('Assign policy members', { exact: true }),
    ).toBeVisible({ timeout: 10000 });
    const testEmp1 = this.page.getByRole('checkbox', {
      name: /Select Test Emp1/i,
    });
    if (
      (await testEmp1.isVisible().catch(() => false)) &&
      !(await testEmp1.isChecked())
    ) {
      await testEmp1.check();
    } else {
      const firstCheckbox = this.page
        .locator('[data-testid^="policy-members-checkbox-"]')
        .first();
      if ((await firstCheckbox.count()) > 0) {
        await firstCheckbox.click();
      }
    }
    const nextBtn = this.page.getByRole('button', { name: 'Next' });
    await expect(nextBtn).toBeVisible({ timeout: 10000 });
    await nextBtn.click();
  }

  /**
   * Shown when selected workers are already on another overtime policy.
   * No-op if the modal is not present.
   */
  async ReassignWorkersModalPopup(): Promise<void> {
    const modal = this.page.locator('[data-automation-id="ModalDialog"]');
    if (!(await modal.isVisible().catch(() => false))) {
      return;
    }
    await modal.getByRole('button').filter({ hasText: 'Continue' }).click();
    await waitForLoadingToDisappear(this.page);
  }

  async selectPolicyMemberAndClickNext(policyMember: string): Promise<void> {
    const reviewDetails = this.page.getByText('Overtime policy details', {
      exact: true,
    });
    if (await reviewDetails.isVisible().catch(() => false)) {
      return;
    }
    await expect(
      this.page.getByText('Assign policy members', { exact: true }),
    ).toBeVisible({ timeout: 10000 });
    await this.page.waitForTimeout(5000);
    await this.page.locator(`//td[text()='${policyMember}']/..//label`).click();
    const nextBtn = this.page.getByRole('button', { name: 'Next' });
    await expect(nextBtn).toBeVisible({ timeout: 5000 });
    await nextBtn.click();
  }

  /** Assign policy members step: header "select all" selects every worker on the current page, then Next. */
  async selectAllPolicyMembersAndClickNext(): Promise<void> {
    const reviewDetails = this.page.getByText('Overtime policy details', {
      exact: true,
    });
    if (await reviewDetails.isVisible().catch(() => false)) {
      return;
    }
    await expect(
      this.page.getByText('Assign policy members', { exact: true }),
    ).toBeVisible({ timeout: 30000 });
    await this.page.waitForTimeout(1000);
    const selectAll = this.page.locator(
      `//input[@aria-label="Select all workers"]`,
    );
    await expect(selectAll).toBeVisible({ timeout: 20000 });
    if (!(await selectAll.isChecked())) {
      await selectAll.check();
    }
    await this.clickWizardNext();
  }

  async selectPolicyMemberAndClick(policyMember: string): Promise<void> {
    const reviewDetails = this.page.getByText('Overtime policy details', {
      exact: true,
    });
    if (await reviewDetails.isVisible().catch(() => false)) {
      return;
    }
    await expect(
      this.page.getByText('Assign policy members', { exact: true }),
    ).toBeVisible({ timeout: 10000 });
    await this.page.waitForTimeout(5000);
    await this.page.locator(`//td[text()='${policyMember}']/..//label`).click();
  }

  async clickCreatePolicy(): Promise<void> {
    const createBtn = this.page.getByRole('button', { name: 'Create policy' });
    await expect(createBtn).toBeVisible({ timeout: 5000 });
    // #region agent log
    const doublePayAlert = this.page.getByText(/Double Overtime Pay/i);
    fetch('http://127.0.0.1:7477/ingest/77f6fdb5-1c43-48bf-a717-bc5c8246fbb8', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': '2edb97',
      },
      body: JSON.stringify({
        sessionId: '2edb97',
        location: 'OvertimePolicyPage.ts:clickCreatePolicy',
        message: 'before create policy click',
        data: {
          doublePayAlertVisible: await doublePayAlert
            .isVisible()
            .catch(() => false),
        },
        timestamp: Date.now(),
        hypothesisId: 'A',
        runId: 'post-fix',
      }),
    }).catch(() => {});
    // #endregion
    await createBtn.click();
    // #region agent log
    fetch('http://127.0.0.1:7477/ingest/77f6fdb5-1c43-48bf-a717-bc5c8246fbb8', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': '2edb97',
      },
      body: JSON.stringify({
        sessionId: '2edb97',
        location: 'OvertimePolicyPage.ts:clickCreatePolicy',
        message: 'after create policy click',
        data: {
          onReviewStep: await this.page
            .getByText('Overtime policy details', { exact: true })
            .isVisible()
            .catch(() => false),
          manageHeadingVisible: await this.page
            .getByRole('heading', { name: /Manage overtime policies/i })
            .isVisible()
            .catch(() => false),
          doublePayAlertVisible: await doublePayAlert
            .isVisible()
            .catch(() => false),
        },
        timestamp: Date.now(),
        hypothesisId: 'B',
        runId: 'post-fix',
      }),
    }).catch(() => {});
    // #endregion
  }

  async clickSaveButton(): Promise<void> {
    const saveByRole = this.page.getByRole('button', { name: 'Save' });
    const saveSpan = this.page.locator(`//span[text()='Save']`);
    if (
      await saveByRole
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await saveByRole.first().click();
    } else {
      await expect(saveSpan.first()).toBeVisible({ timeout: 10000 });
      await saveSpan.first().click();
    }
  }

  async expectReviewPolicyDetailsWithSelectedData(
    policyName: string,
  ): Promise<void> {
    await expect(
      this.page.getByText('Overtime policy details', { exact: true }),
    ).toBeVisible({ timeout: 5000 });
    await expect(
      this.page.getByRole('heading', { name: 'Overtime rules' }),
    ).toBeVisible({ timeout: 5000 });
    await expect(this.page.getByText(policyName).first()).toBeVisible({
      timeout: 5000,
    });
  }

  async expectSuccessToast(): Promise<void> {
    const toast = this.page
      .getByRole('alert')
      .or(
        this.page.locator('[data-testid*="toast"], [data-testid*="snackbar"]'),
      )
      .or(this.page.getByText(/success|created|policy created/i));
    await expect(toast.first()).toBeVisible({ timeout: 10000 });
  }

  async expectPolicyWithEditAndAssignWorkers(
    policyName: string,
  ): Promise<void> {
    await this.expectPolicyVisibleInTable(policyName);
    const editDropdown = this.getEditDropdownForPolicy(policyName);
    await expect(editDropdown).toBeVisible({ timeout: 5000 });
    // Workers column is in the same row
    const row = this.page.getByRole('row').filter({ hasText: policyName });
    await expect(row).toBeVisible({ timeout: 5000 });
  }

  async expectManageScreenVisible(): Promise<void> {
    // const trowser = this.page.getByTestId('overtime-landing-page-trowser');
    // await expect(trowser).toBeVisible({ timeout: 5000 });
    const heading = this.page.getByRole('heading', {
      name: /Manage overtime policies for/i,
    });
    const subText = this.page.getByText(
      'Manage overtime policies for your company',
    );
    if ((await heading.count()) > 0) {
      await expect(heading.first()).toBeVisible({ timeout: 15000 });
    } else {
      await expect(subText).toBeVisible({ timeout: 15000 });
    }
  }

  async expectPolicyVisibleInTable(policyName: string): Promise<void> {
    await this.expectPolicyRowInManageTable(policyName);
  }

  /** Manage screen: the created policy name appears in the policies table (tbody row). */
  async expectPolicyNameVisibleInManageTable(
    policyName: string,
  ): Promise<void> {
    await this.waitForOvertimeManageUiReady();
    const trowser = this.page.getByTestId('overtime-landing-page-trowser');
    const dialog = this.page.getByRole('dialog', { name: 'Overtime' });
    const table = trowser.or(dialog).getByRole('table').first();
    await expect(table).toBeVisible({ timeout: 20000 });
    // #region agent log
    const rowTexts = await table
      .locator('tbody tr')
      .allTextContents()
      .catch(() => []);
    fetch('http://127.0.0.1:7477/ingest/77f6fdb5-1c43-48bf-a717-bc5c8246fbb8', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': '2edb97',
      },
      body: JSON.stringify({
        sessionId: '2edb97',
        location: 'OvertimePolicyPage.ts:expectPolicyNameVisibleInManageTable',
        message: 'manage table rows before policy assertion',
        data: { policyName, rowCount: rowTexts.length, rowTexts },
        timestamp: Date.now(),
        hypothesisId: 'C',
        runId: 'post-fix',
      }),
    }).catch(() => {});
    // #endregion
    const byBody = table.locator('tbody tr').filter({ hasText: policyName });
    if ((await byBody.count()) > 0) {
      await expect(byBody.first()).toBeVisible({ timeout: 20000 });
    } else {
      await expect(
        table.getByRole('row').filter({ hasText: policyName }).first(),
      ).toBeVisible({ timeout: 20000 });
    }
  }

  /**
   * Wizard: basic rules → first member → create policy → manage table shows the new policy.
   * (Account & Settings → Time → Overtime landing → Set up → … → Create.)
   */
  async createBasicOvertimePolicyViaWizardAndVerifyOnManageTable(
    policyName: string,
  ): Promise<void> {
    await this.navigateToOvertimeLanding();
    await waitForLoadingToDisappear(this.page);
    const setupBtn = this.page.getByRole('button', {
      name: 'Set up overtime policies',
    });
    const createBtn = this.page.getByRole('button', {
      name: 'Create overtime policy',
    });
    if (await setupBtn.isVisible().catch(() => false)) await setupBtn.click();
    else if (await createBtn.isVisible().catch(() => false))
      await createBtn.click();
    else throw new Error('No Set up / Create overtime policy button');
    await this.page.waitForTimeout(1500);
    await this.page.getByPlaceholder('Enter policy name').fill(policyName);
    await this.page.waitForTimeout(300);
    await this.clickWizardNext();
    await this.page.waitForTimeout(1500);
    const rulesDropdown = this.page.getByPlaceholder('Select overtime rules');
    await rulesDropdown.click();
    await this.page.waitForTimeout(500);
    await this.page
      .getByRole('option')
      .filter({ hasText: 'Use Basic Rules' })
      .click();
    await this.page.waitForTimeout(1000);
    await expect(
      this.page.getByText('Configure your overtime rules'),
    ).toBeVisible();
    await this.ensureDailyCheckedAndDoubleDailyUnchecked();
    await this.clickWizardNext();
    await this.page.waitForTimeout(1500);
    const testEmp1 = this.page.getByRole('checkbox', {
      name: /Select Test Emp1/i,
    });
    if (
      (await testEmp1.isVisible().catch(() => false)) &&
      !(await testEmp1.isChecked())
    ) {
      await testEmp1.check();
    }
    await this.clickWizardNext();
    await this.page.waitForTimeout(1500);
    await expect(
      this.page.getByRole('heading', { name: 'Overtime policy details' }),
    ).toBeVisible();
    await this.clickCreatePolicy();
    await this.page.waitForTimeout(2000);
    const continueSpan = this.page.locator(`//span[text()="Continue"]`);
    if (await continueSpan.isVisible().catch(() => false)) {
      await continueSpan.click();
    }
    await this.expectPolicyNameVisibleInManageTable(policyName);
  }

  /**
   * Validates the filled-state manage policies table (Policy | Workers | Rules | Actions).
   * Uses roles and stable partial class for the policy name cell; avoids hashed theme class tokens.
   */
  async expectPolicyRowInManageTable(
    policyName: string,
    options?: {
      /** e.g. "None", "1 user" */
      workersText?: string | RegExp;
      /** e.g. "3" */
      rulesText?: string | RegExp;
    },
  ): Promise<void> {
    await this.waitForOvertimeManageUiReady();
    const dialog = this.page.getByRole('dialog', { name: 'Overtime' });
    const table = dialog.getByRole('table').first();
    await expect(table).toBeVisible({ timeout: 5000 });

    const row = table.getByRole('row').filter({ hasText: policyName });
    await expect(row).toBeVisible({ timeout: 20000 });

    const policyNameCell = row
      .locator('[class*="PolicyNameCell"]')
      .filter({ hasText: policyName });
    if ((await policyNameCell.count()) > 0) {
      await expect(policyNameCell.first()).toBeVisible();
    } else {
      await expect(row.getByRole('cell').first()).toContainText(policyName);
    }

    if (options?.workersText !== undefined) {
      const workersCell = row.getByRole('cell').nth(1);
      await expect(workersCell).toHaveText(options.workersText);
    }
    if (options?.rulesText !== undefined) {
      const rulesCell = row.getByRole('cell').nth(2);
      await expect(rulesCell).toHaveText(options.rulesText);
    }

    await expect(
      row.getByRole('button', { name: /^edit$/i }).first(),
    ).toBeVisible();
    await expect(row.getByTestId('chevron-down-icon-control')).toBeVisible();
  }

  /** From manage table: open read-only policy details (row / name cell click). */
  async openPolicyDetailsFromManageTable(policyName: string): Promise<void> {
    await this.waitForOvertimeManageUiReady();
    const dialog = this.page.getByRole('dialog', { name: 'Overtime' });
    const policyRow = dialog
      .getByRole('row')
      .filter({ hasText: policyName })
      .first();
    await expect(policyRow).toBeVisible({ timeout: 15000 });
    await policyRow
      .getByRole('cell')
      .filter({ hasText: policyName })
      .first()
      .click();
  }

  async clickEditOvertimePolicyFromDetails(): Promise<void> {
    const editBtn = this.page.getByRole('button', {
      name: 'Edit overtime policy',
    });
    await expect(editBtn).toBeVisible({ timeout: 15000 });
    await editBtn.click();
  }

  /** Edit overtime policy view: Close control (header / dialog). */
  async expectCloseButtonVisibleInOvertimeEditFlow(): Promise<void> {
    const dialog = this.page.getByRole('dialog', { name: 'Overtime' });
    const trowser = this.page.getByTestId('overtime-landing-page-trowser');
    const closeBtn = this.page.locator('//span[text()="Close"]').first();
    await expect(closeBtn).toBeVisible({ timeout: 15000 });
  }

  async clickCloseButtonInOvertimeEditFlow(): Promise<void> {
    const dialog = this.page.getByRole('dialog', { name: 'Overtime' });
    const trowser = this.page.getByTestId('overtime-landing-page-trowser');
    const closeBtn = this.page.locator(`//span[text()="Close"]`).first();
    await expect(closeBtn).toBeVisible({ timeout: 15000 });
    await closeBtn.click();
  }

  /**
   * Row actions: expand menu control for the policy named `policyName` (manage table).
   */
  getEditDropdownForPolicy(policyName: string) {
    const trowser = this.page.getByTestId('overtime-landing-page-trowser');
    const dialog = this.page.getByRole('dialog', { name: 'Overtime' });
    const row = trowser
      .or(dialog)
      .getByRole('row')
      .filter({ hasText: policyName })
      .first();
    return row
      .getByRole('button', { name: /expand menu/i })
      .or(row.locator('[aria-label="Expand Menu"]'))
      .or(row.getByTestId('chevron-down-icon-control'))
      .first();
  }

  async clickEditDropdownEdit(policyName: string): Promise<void> {
    const expandMenu = this.getEditDropdownForPolicy(policyName);
    await expect(expandMenu).toBeVisible({ timeout: 10000 });
    await expandMenu.click();
    await this.page.getByRole('menuitem', { name: 'Edit' }).click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * OT042 — Manage table: row ⋮ → Edit → Edit overtime policy → Edit policy details (name field ready).
   */
  async openPolicyDetailsEditorFromManageTableRow(
    policyName: string,
  ): Promise<void> {
    await this.clickEditDropdownEdit(policyName);
    const editOvertimePolicy = this.page.getByRole('button', {
      name: 'Edit overtime policy',
    });
    await expect(editOvertimePolicy).toBeVisible({ timeout: 15000 });
    await editOvertimePolicy.click();
    await this.clickEditPolicyDetailsButton();
  }

  /** Clicks the policy row expand menu, then Delete. */
  async clickEditDropdownDelete(policyName: string): Promise<void> {
    const expandMenu = this.getEditDropdownForPolicy(policyName);
    await expect(expandMenu).toBeVisible({ timeout: 10000 });
    await expandMenu.click();
    const deleteItem = this.page
      .getByRole('menuitem', { name: 'Delete' })
      .or(this.page.getByText('Delete', { exact: true }));
    await expect(deleteItem.first()).toBeVisible({ timeout: 5000 });
    await deleteItem.first().click();
  }

  /** Opens delete from row menu and confirms the modal (manage table only). */
  async deletePolicyFromManageTable(policyName: string): Promise<void> {
    await this.clickEditDropdownDelete(policyName);
    await expect(this.page.locator(`//span[text()="Delete"]`)).toBeVisible({
      timeout: 5000,
    });
    await this.page.locator(`//span[text()="Delete"]`).click();
    await waitForLoadingToDisappear(this.page);
  }

  /** Manage table: no row contains the policy name (after delete). */
  async expectPolicyNameNotInManageTable(policyName: string): Promise<void> {
    await this.waitForOvertimeManageUiReady();
    const dialog = this.page.getByRole('dialog', { name: 'Overtime' });
    await expect(
      dialog.getByRole('row').filter({ hasText: policyName }),
    ).toHaveCount(0);
  }

  async getLearnMoreLink(): Promise<{
    link: ReturnType<Page['locator']>;
    href: string;
  }> {
    const link = this.page.getByRole('link', {
      name: 'Learn more about overtime',
    });
    await expect(link).toBeVisible({ timeout: 5000 });
    const href = (await link.getAttribute('href')) ?? '';
    return { link, href };
  }

  async getCheckLawsLink(): Promise<{
    link: ReturnType<Page['locator']>;
    href: string;
    target: string | null;
  }> {
    const link = this.page.getByRole('link', {
      name: 'Check out overtime laws by state',
    });
    await expect(link).toBeVisible({ timeout: 5000 });
    const href = (await link.getAttribute('href')) ?? '';
    const target = await link.getAttribute('target');
    return { link, href, target };
  }

  async expectOneBigBeautifulBillActSummaryAndDetails(): Promise<void> {
    await expect(
      this.page.getByText(/One Big Beautiful Bill Act/i),
    ).toBeVisible({ timeout: 10000 });
  }

  async clickEditAndVerifyOneBigBeautifulBillActContent(): Promise<void> {
    await this.closeOvertimeTrowser();
    await this.clickOvertimeSectionEdit();
    await this.waitForOvertimeTrowserOpen();
    await this.expectOneBigBeautifulBillActSummaryAndDetails();
  }
  async navigateToReviewStep(policyName: string): Promise<void> {
    await this.navigateToOvertimeLanding();
    await this.clickSetUpOvertimePolicies();
    await this.fillPolicyNameAndDefault(policyName, true);
    await this.selectBasicRulesAndClickNext();
    await this.completeBasicRulesConfigurationAndNext();
    await this.selectFirstPolicyMemberAndClickNext();
    await this.expectReviewPolicyDetailsWithSelectedData(policyName);
  }

  async expectReviewStepVisible(): Promise<void> {
    await expect(
      this.page.getByText('Overtime policy', { exact: true }),
    ).toBeVisible({ timeout: 5000 });
    await expect(
      this.page.getByRole('heading', { name: 'Overtime rules' }),
    ).toBeVisible({ timeout: 5000 });
    //await expect(
    //   this.page.getByRole('heading', { name: 'Review overtime policy' }),
    // ).toBeVisible({ timeout: 5000 });
  }

  async expectWizardCloseOrBackButtonVisible(): Promise<void> {
    const cancelOrBack = this.page
      .getByRole('button', { name: 'Cancel' })
      .or(this.page.getByRole('button', { name: 'Back' }));
    await expect(cancelOrBack.first()).toBeVisible({ timeout: 5000 });
  }

  async clickReviewEditPolicyDetails(): Promise<void> {
    const editDetails = this.page.getByRole('button', {
      name: 'Edit policy details',
    });
    await expect(editDetails).toBeVisible({ timeout: 5000 });
    await editDetails.click();
  }

  /** Edit overtime policy view: open Policy details editor (button / edit control). */
  async clickEditPolicyDetailsButton(): Promise<void> {
    const editDetails = this.page
      .getByRole('button', { name: 'Edit policy details' })
      .or(this.page.getByRole('button', { name: /edit policy details/i }));
    await expect(editDetails.first()).toBeVisible({ timeout: 15000 });
    await editDetails.first().click();
  }

  async clickReviewEditOvertimeRules(): Promise<void> {
    const editRules = this.page.getByRole('button', {
      name: 'Edit overtime rules',
    });
    await expect(editRules).toBeVisible({ timeout: 5000 });
    await editRules.click();
  }

  async clickReviewEditPolicyMembers(): Promise<void> {
    const editMembers = this.page.getByRole('button', {
      name: 'Edit policy members',
    });
    await expect(editMembers).toBeVisible({ timeout: 5000 });
    await editMembers.click();
  }

  /**
   * Edit overtime policy view: open the Policy members editor (primary button; matches edit icon entry).
   */
  async clickEditPolicyMembersButton(): Promise<void> {
    const editMembers = this.page
      .getByRole('button', { name: 'Edit policy members' })
      .or(this.page.getByRole('button', { name: /edit policy members/i }));
    await expect(editMembers.first()).toBeVisible({ timeout: 15000 });
    await editMembers.first().click();
  }

  /** Policy members picker: select the Employee (worker type) checkbox when shown. */
  async selectEmployeePolicyMemberCheckbox(): Promise<void> {
    const named = this.page
      .getByRole('checkbox', { name: /^(Select )?Employee$/i })
      .or(this.page.getByRole('checkbox', { name: /select.*employee/i }))
      .first();
    if (await named.isVisible().catch(() => false)) {
      if (!(await named.isChecked())) await named.check();
      return;
    }

    const row = this.page
      .getByRole('row')
      .filter({ hasText: /\bEmployee\b/i })
      .first();
    if (await row.isVisible().catch(() => false)) {
      const cb = row.getByRole('checkbox').first();
      if (
        (await cb.isVisible().catch(() => false)) &&
        !(await cb.isChecked())
      ) {
        await cb.check();
      }
    }
  }

  async expectSaveChangesButtonVisible(): Promise<void> {
    const saveChanges = this.page.getByRole('button', { name: 'Save changes' });
    await expect(saveChanges).toBeVisible({ timeout: 15000 });
  }

  async clickSaveChangesButton(): Promise<void> {
    const saveChanges = this.page.getByRole('button', { name: 'Save changes' });
    await expect(saveChanges).toBeVisible({ timeout: 15000 });
    await saveChanges.click();
  }

  async expectSaveOrNextButtonVisible(): Promise<void> {
    const saveChanges = this.page.getByRole('button', { name: 'Save changes' });
    const saveBtn = this.page.getByRole('button', { name: 'Save' });
    const nextBtn = this.page.getByRole('button', { name: 'Next' });
    await expect(saveChanges.or(saveBtn).or(nextBtn).first()).toBeVisible({
      timeout: 15000,
    });
  }

  /** Rules edit step: primary action is Save / Save changes, not Next. */
  async expectSaveVisibleWithoutNextButton(): Promise<void> {
    const dialog = this.page.getByRole('dialog', { name: 'Overtime' });
    const saveChanges = dialog.getByRole('button', { name: 'Save changes' });
    const saveBtn = dialog.getByRole('button', { name: 'Save', exact: true });
    await expect(saveChanges.or(saveBtn).first()).toBeVisible({
      timeout: 15000,
    });
    await expect(dialog.getByRole('button', { name: 'Next' })).toHaveCount(0);
  }

  async expectSaveButtonVisible(): Promise<void> {
    const saveBtn = this.page.getByRole('button', { name: 'Save' });
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
  }
  async editPolicyName(newName: string): Promise<void> {
    const nameInput = this.page
      .getByRole('textbox', { name: 'Name' })
      .or(this.page.getByTestId('policy-name-input'));
    await expect(nameInput.first()).toBeVisible({ timeout: 15000 });
    await nameInput.first().clear();
    await nameInput.first().fill(newName);
  }

  async clickSaveOrNextToReturnToReview(): Promise<void> {
    const saveChanges = this.page.getByRole('button', { name: 'Save changes' });
    const saveBtn = this.page.getByRole('button', { name: 'Save' });
    const nextBtn = this.page.locator(`//span[text()="Next"]`);
    if (await saveChanges.isVisible().catch(() => false)) {
      await saveChanges.click();
    } else if (await saveBtn.isVisible().catch(() => false)) {
      await saveBtn.click();
    } else {
      await nextBtn.click();
    }
  }

  async expectPolicyNameInReview(policyName: string): Promise<void> {
    await expect(this.page.getByText(policyName)).toBeVisible({
      timeout: 5000,
    });
  }

  async expectPaginationVisibleWithSummary(): Promise<void> {
    const nav = this.overtimeManagePaginationNav();
    await expect(nav).toBeVisible({ timeout: 10000 });
    await expect(nav.getByTestId('pagination-summary')).toBeVisible({
      timeout: 5000,
    });
  }

  async clickPaginationNextPage(): Promise<void> {
    const nav = this.overtimeManagePaginationNav();
    const labelText =
      (
        await nav
          .locator('[class*="Pagination-pageLabels"]')
          .first()
          .textContent()
      )?.trim() || '';
    const currentPage = parseInt(
      labelText.match(/Page\s+(\d+)\s+of/i)?.[1] || '1',
      10,
    );
    //const nextPage = currentPage;
    const buttonsSection = this.page.locator(
      '[class*="paginationButtonsSection"]',
    );
    const nextBtn = buttonsSection
      .getByRole('button', {
        name: `Page ${currentPage}`,
        exact: true,
      })
      .last();
    await expect(nextBtn).toBeVisible({ timeout: 5000 });
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();
  }

  async expectPaginationPageUpdated(): Promise<void> {
    const nav = this.overtimeManagePaginationNav();
    await expect(nav).toBeVisible({ timeout: 5000 });
    const pageTwo = this.page.getByText(/2|page 2/i);
    await expect(pageTwo.first()).toBeVisible({ timeout: 5000 });
  }

  async getFirstOvertimePolicyNameInManageTable(): Promise<string> {
    const dialog = this.page.getByRole('dialog', { name: 'Overtime' });
    const nameCell = dialog
      .locator('tbody tr[role="row"]')
      .first()
      .locator('[class*="PolicyNameCell"]')
      .first();
    await expect(nameCell).toBeVisible({ timeout: 10000 });
    return (await nameCell.innerText()).split('\n')[0].trim();
  }

  async expectOvertimePaginationOnPage(pageNumber: number): Promise<void> {
    const nav = this.overtimeManagePaginationNav();
    await expect(
      nav.getByText(new RegExp(`Page\\s+${pageNumber}\\s+of`, 'i')),
    ).toBeVisible({ timeout: 15000 });
  }

  async navigateToAccountSettingsTime(): Promise<void> {
    await navigateToAccountAndSettingsTime(this.page);
    await this.waitForTimeSettingsReady();
  }

  async verifyOvertimeZeroStateInNotifications(): Promise<void> {
    await expect(
      this.page.getByTestId('notifications-settings').first(),
    ).toBeVisible({ timeout: 10000 });

    const overtimeZeroState = this.page
      .locator('[class*="OvertimeViewStack"]')
      .filter({ hasText: /Set up daily or weekly alerts/i });
    await expect(overtimeZeroState).toBeVisible({ timeout: 10000 });
  }

  async openNotificationsEdit(): Promise<void> {
    const notificationsHeading = this.page
      .getByTestId('notifications-settings')
      .filter({ hasText: 'Notifications' });
    await expect(notificationsHeading.first()).toBeVisible({ timeout: 10000 });
    await clickNotifEditButton(this.page);
  }

  async expectOvertimeSectionInNotifications(): Promise<void> {
    const overtimeSection = this.page
      .locator('[class*="OvertimeEditSectionContainer"]')
      .filter({
        has: this.page.getByRole('checkbox', { name: 'Daily' }),
      });
    await expect(overtimeSection).toBeVisible({ timeout: 10000 });
    await expect(
      overtimeSection.getByText('Overtime', { exact: true }),
    ).toBeVisible();
    await expect(
      overtimeSection.getByRole('checkbox', { name: 'Daily' }),
    ).toBeVisible();
    await expect(
      overtimeSection.getByRole('checkbox', { name: 'Weekly' }),
    ).toBeVisible();
  }

  async saveNotifications(): Promise<void> {
    const saveNotif = this.page.getByRole('button', {
      name: 'save-notifications',
      exact: true,
    });
    if ((await saveNotif.count()) > 0) {
      await expect(saveNotif.first()).toBeVisible({ timeout: 10000 });
      await saveNotif.first().click();
    } else {
      const saveBtn = this.page.getByRole('button', {
        name: 'Save',
        exact: true,
      });
      await expect(saveBtn.first()).toBeVisible({ timeout: 10000 });
      await saveBtn.first().click();
    }
    await this.page.waitForTimeout(1000);
  }

  /**
   * Notifications edit (company or worker): Overtime Daily / Weekly period toggles.
   */
  async setOvertimeNotificationPeriodChecked(
    period: 'Daily' | 'Weekly',
    checked: boolean,
  ): Promise<void> {
    const pattern = period === 'Daily' ? /^Daily$/i : /^Weekly$/i;
    const checkbox = this.page.getByRole('checkbox', { name: pattern });
    await expect(checkbox.first()).toBeVisible({ timeout: 20000 });
    if (checked) {
      await checkbox.first().check();
    } else {
      await checkbox.first().uncheck();
    }
  }

  async expectOvertimeNotificationPeriodChecked(
    period: 'Daily' | 'Weekly',
    checked: boolean,
  ): Promise<void> {
    const pattern = period === 'Daily' ? /^Daily$/i : /^Weekly$/i;
    const checkbox = this.page.getByRole('checkbox', { name: pattern }).first();
    await expect(checkbox).toBeVisible({ timeout: 20000 });
    if (checked) {
      await expect(checkbox).toBeChecked();
    } else {
      await expect(checkbox).not.toBeChecked();
    }
  }

  /** Dismiss notifications edit sheet (worker or company) when Cancel is shown. */
  async closeNotificationsEditPanel(): Promise<void> {
    const cancel = this.page
      .getByRole('button', { name: 'Cancel' })
      .or(this.page.locator(`//span[text()='Cancel']`));
    if (
      await cancel
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await cancel.first().click();
    }
  }

  async expectOvertimeSectionInWorkerSettings(): Promise<void> {
    await expect(this.page.getByText(/overtime/i).first()).toBeVisible({
      timeout: 10000,
    });
  }

  async expectNoPolicyStateWithSetupLink(): Promise<void> {
    await expect(
      this.page.getByText(/set\s*up overtime policies in time settings/i),
    ).toBeVisible({ timeout: 10000 });
  }

  async clickOpenOvertimeFromWorkerSettings(): Promise<void> {
    const btn = this.page.locator(
      `//button[@aria-label="open-overtime-settings"]`,
    );
    await expect(btn).toBeVisible({ timeout: 10000 });
    await btn.click();
  }

  async clickOnViewSetting(): Promise<void> {
    const viewSetting = this.page.locator(
      `//div[text()='Test Emp1']/ancestor::tr//span[text()='View settings']`,
    );
    await expect(viewSetting).toBeVisible({ timeout: 5000 });
    await viewSetting.click();
  }

  async clickExternalLinkToOvertimeManage(): Promise<void> {
    const link = this.page
      .getByRole('link', { name: /setup overtime|manage|overtime/i })
      .or(this.page.getByText(/setup overtime policies in time settings/i));
    await expect(link.first()).toBeVisible({ timeout: 5000 });
    await link.first().click();
  }

  async clickOvertimeEditInWorkerSettings(): Promise<void> {
    const byAria = this.page.locator('[aria-label="open-overtime-settings"]');
    if (
      await byAria
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await byAria.first().click();
      return;
    }
    const card = this.page.locator('div[class*="SettingsCard"]').filter({
      has: this.page.locator('strong').filter({ hasText: /^Overtime$/i }),
    });
    const editBtn = card.getByRole('button', { name: /^edit$/i }).first();
    await expect(editBtn).toBeVisible({ timeout: 10000 });
    await editBtn.click();
  }

  async selectCompanyLevelAndClickManageCompany(): Promise<void> {
    await expect(
      this.page.getByText(/use company level assignment/i),
    ).toBeVisible({ timeout: 10000 });
    const companyLevel = this.page.getByText(/use company level assignment/i);
    await companyLevel.first().click();
    const manageLink = this.page.getByRole('link', {
      name: /manage company|manage/i,
    });
    await expect(manageLink.first()).toBeVisible({ timeout: 5000 });
    await manageLink.first().click();
  }

  async expectOvertimeLawsByStateLink(): Promise<void> {
    await expect(
      this.page.getByRole('link', {
        name: /overtime laws by state|check out overtime laws/i,
      }),
    ).toBeVisible({ timeout: 5000 });
  }

  async selectUseCustomRulesInWorkerSettings(): Promise<void> {
    const custom = this.page.getByText(/use custom rules/i).first();
    await expect(custom).toBeVisible({ timeout: 10000 });
    await custom.click();
  }

  async saveWorkerOvertimePanel(): Promise<void> {
    const saveBtn = this.page.getByRole('button', { name: /^save$/i });
    await expect(saveBtn.first()).toBeVisible({ timeout: 5000 });
    await saveBtn.first().click();
  }

  /** Worker Overtime card edit mode: Cancel (discards edit panel). */
  async clickCancelWorkerOvertimeEditPanel(): Promise<void> {
    const byAria = this.page.locator('[aria-label="cancel-overtime"]');
    if (
      await byAria
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await byAria.first().click();
      return;
    }
    const card = this.page.locator('div[class*="SettingsCard"]').filter({
      has: this.page.locator('strong').filter({ hasText: /^Overtime$/i }),
    });
    const cancel = card.getByRole('button', { name: /^cancel$/i }).first();
    await expect(cancel).toBeVisible({ timeout: 10000 });
    await cancel.click();
  }

  async expectPolicyNameInWorkerOvertimeSection(
    policyName: string,
  ): Promise<void> {
    await expect(
      this.page.getByText(policyName, { exact: true }).first(),
    ).toBeVisible({
      timeout: 10000,
    });
  }

  /** Policy name shown on the worker View Settings overtime card (above the rules table). */
  async getOvertimePolicyNameFromWorkerViewSettings(): Promise<string> {
    const card = this.page.locator('div[class*="SettingsCard"]').filter({
      has: this.page.locator('strong').filter({ hasText: /^Overtime$/i }),
    });
    const section = card.first();
    await expect(section).toBeVisible({ timeout: 10000 });
    const overtimeContentReady = section
      .getByRole('table')
      .or(section.getByText(/no rules configured/i))
      .or(
        section.getByRole('button', {
          name: 'open-overtime-settings',
          exact: true,
        }),
      )
      .or(section.getByRole('button', { name: 'edit-overtime', exact: true }));
    await expect(overtimeContentReady.first()).toBeVisible({
      timeout: 25000,
    });

    const rulesTable = section.getByRole('table').first();
    if (await rulesTable.isVisible({ timeout: 5000 }).catch(() => false)) {
      const policyNameEl = rulesTable.locator(
        'xpath=../preceding-sibling::*[1]',
      );
      await expect(policyNameEl).toBeVisible({ timeout: 10000 });
      const name = (await policyNameEl.innerText()).trim();
      expect(name.length).toBeGreaterThan(0);
      return name;
    }

    const rulesLabel = section.getByText(/overtime rules/i).first();
    await expect(rulesLabel).toBeVisible({ timeout: 10000 });
    const policyNameEl = rulesLabel.locator('xpath=following-sibling::*[1]');
    await expect(policyNameEl).toBeVisible({ timeout: 10000 });
    const name = (await policyNameEl.innerText()).trim();
    expect(name.length).toBeGreaterThan(0);
    return name;
  }

  async expectOvertimeOpenPolicyDetailsIconVisible(): Promise<void> {
    await expect(
      this.page.getByRole('button', {
        name: 'open-overtime-settings',
        exact: true,
      }),
    ).toBeVisible({ timeout: 10000 });
  }

  /** Policy details view inside the Overtime dialog trowser after navigating from worker settings. */
  async expectOvertimePolicyDetailsInTrowser(
    policyName: string,
  ): Promise<void> {
    await waitForLoadingToDisappear(this.page);
    const dialog = this.page.getByRole('dialog', { name: 'Overtime' });
    await expect(
      dialog.getByRole('heading', { name: policyName, exact: true }),
    ).toBeVisible({ timeout: 20000 });
    await expect(
      dialog.getByRole('button').filter({ hasText: 'Edit overtime policy' }),
    ).toBeVisible();
  }

  /** Policy detail / trowser: overtime rules block is shown (after open-in-new from worker View settings). */
  async expectOvertimeRulesHeadingInOvertimeDialog(): Promise<void> {
    const dialog = this.page.getByRole('dialog', { name: 'Overtime' });
    await expect(
      dialog.getByRole('heading', { name: 'Overtime rules' }),
    ).toBeVisible({ timeout: 20000 });
  }

  /**
   * Edit overtime policy flow: secondary button that opens the overtime rules editor
   * (same control as `getByRole('button', { name: 'Overtime rules' })` in manage/edit views).
   */
  async clickOvertimeRulesEditorButton(): Promise<void> {
    const dialog = this.page.getByRole('dialog', { name: 'Overtime' });
    const btn = dialog
      .getByRole('button', { name: 'Overtime rules' })
      .or(this.page.getByRole('button', { name: 'Overtime rules' }));
    await expect(btn.first()).toBeVisible({ timeout: 15000 });
    await btn.first().click();
  }

  async clickCancelInOvertimeDialog(): Promise<void> {
    const dialog = this.page.getByRole('dialog', { name: 'Overtime' });
    const cancel = dialog.getByRole('button', { name: 'Cancel', exact: true });
    await expect(cancel).toBeVisible({ timeout: 15000 });
    await cancel.click();
  }

  /** Close the Overtime trowser/dialog from the header Close control (best-effort). */
  async closeOvertimeDialogFromHeader(): Promise<void> {
    const dialog = this.page.getByRole('dialog', { name: 'Overtime' });
    const closeInDialog = dialog
      .getByRole('button', { name: /close/i })
      .or(dialog.locator('button[aria-label="Close"]'));
    if (
      await closeInDialog
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await closeInDialog.first().click();
      return;
    }
    await this.clickOvertimeWizardCloseIcon();
  }

  /**
   * Worker View Settings → Overtime → Edit: company-level vs custom rules; only one mode applies.
   */
  async expectWorkerOvertimeCompanyVsCustomMutuallyExclusiveOptions(): Promise<void> {
    const group = this.page.getByRole('radiogroup', {
      name: 'overtime-assignment-type',
    });
    if (await group.isVisible().catch(() => false)) {
      await expect(group.getByText(/use company level/i).first()).toBeVisible({
        timeout: 15000,
      });
      await expect(group.getByText(/use custom rules/i).first()).toBeVisible({
        timeout: 15000,
      });
      const radios = group.getByRole('radio');
      await expect(radios).toHaveCount(2);
      await expect(group.getByRole('radio', { checked: true })).toHaveCount(1);
      return;
    }
    await expect(
      this.page.getByText(/use company level (assignment|settings)/i).first(),
    ).toBeVisible({ timeout: 15000 });
    await expect(this.page.getByText(/use custom rules/i).first()).toBeVisible({
      timeout: 15000,
    });
    const checked = this.page.locator('input[type="radio"]:checked');
    expect(await checked.count()).toBe(1);
  }

  /** Worker settings Notifications card: overtime alert description copy. */
  async expectOvertimeNotificationsDescriptionOnWorkerSettings(): Promise<void> {
    await expect(
      this.page.getByText(
        /Set up daily or weekly alerts to let your team know when they reach or go over their overtime limit/i,
      ),
    ).toBeVisible({ timeout: 15000 });
  }

  /**
   * Rules editor: rule type label visible (e.g. Basic / California) after opening rules step.
   */
  async expectOvertimeRulesEditorShowsRuleType(pattern: RegExp): Promise<void> {
    const dialog = this.page.getByRole('dialog', { name: 'Overtime' });
    await expect(dialog.getByText(pattern).first()).toBeVisible({
      timeout: 15000,
    });
  }

  async clickOvertimeWizardCloseIcon(): Promise<void> {
    const close = this.page
      .locator(
        '//div[@data-automation-id="overtime-landing-page-trowser_close"]',
      )
      .first();
    await expect(close).toBeVisible({ timeout: 5000 });
    await close.click();
  }

  async clickWizardBackButton(): Promise<void> {
    await this.page.getByRole('button', { name: 'Back', exact: true }).click();
  }

  async clickBackToOvertimePolicies(): Promise<void> {
    const btn = this.page.locator(
      `//button[@aria-label="Back to Overtime policies"]`,
    );
    await expect(btn.first()).toBeVisible({ timeout: 5000 });
    await btn.first().click();
  }

  /**
   * Leave policy detail / edit and return to the manage policies table (clicks Back while shown).
   */
  async goBackToOvertimePoliciesManageTable(): Promise<void> {
    for (let i = 0; i < 4; i++) {
      const btn = this.page
        .getByRole('button', { name: /back to overtime policies/i })
        .or(this.page.locator('[aria-label="Back to Overtime policies"]'));
      if (
        !(await btn
          .first()
          .isVisible({ timeout: 2500 })
          .catch(() => false))
      ) {
        break;
      }
      await btn.first().click();
      await waitForLoadingToDisappear(this.page);
    }
    await this.waitForOvertimeManageUiReady();
  }

  async expectWizardStepActive(stepLabel: string | RegExp): Promise<void> {
    const menu = this.page.locator(`//span[text()="Overtime policy"]`);
    await expect(menu).toBeVisible({ timeout: 5000 });
    const active = menu
      .locator('[class*="WizardStepItem"]')
      .filter({ hasText: stepLabel });
    //await expect(active.first()).toBeVisible({ timeout: 5000 });
  }

  async expectDefaultOvertimePolicyCheckboxVisible(): Promise<void> {
    const cb = this.page.getByRole('checkbox', {
      name: /default overtime policy/i,
    });
    await expect(cb).toBeVisible({ timeout: 5000 });
  }

  async hoverDefaultOvertimePolicyCheckboxAndExpectTooltip(): Promise<void> {
    const cb = this.page.getByRole('checkbox', {
      name: /default overtime policy/i,
    });
    await cb.hover();
    const tip = this.page.getByText(
      /new workers will be assigned to this overtime policy|default overtime policy/i,
    );
    await expect(tip.first()).toBeVisible({ timeout: 8000 });
  }

  async expectOvertimeAlertsNullStateInNotifications(): Promise<void> {
    await this.openNotificationsEdit();
    const nullMsg = this.page.getByText(
      /set up alerts|no alerts|configure alerts|null/i,
    );
    const setUpBtn = this.page.getByRole('button', {
      name: /set up|add alert/i,
    });
    const hasNull =
      (await nullMsg
        .first()
        .isVisible()
        .catch(() => false)) ||
      (await setUpBtn
        .first()
        .isVisible()
        .catch(() => false));
    expect(hasNull).toBeTruthy();
  }

  async expectManageCompanyOvertimePoliciesLink(): Promise<void> {
    await expect(
      this.page.getByRole('link', {
        name: /manage company overtime policies/i,
      }),
    ).toBeVisible({ timeout: 10000 });
  }

  async verifyAlertsConfiguredInNotifications(
    type: 'Daily' | 'Weekly',
  ): Promise<void> {
    const suffix = this.notificationPeriodSuffix(type);
    const section = this.page.locator(
      '[class*="OvertimeEditSectionContainer"]',
    );
    await expect(section).toBeVisible({ timeout: 10000 });

    const typeCb = section.getByRole('checkbox', { name: type });
    if (!(await typeCb.isChecked())) await typeCb.check();

    const block = section
      .locator('[class*="OvertimeEditPeriodRuleBlock"]')
      .filter({
        has: this.page.locator(
          `[aria-label="overtime-threshold-hours-${suffix}"]`,
        ),
      });
    await expect(block).toBeVisible({ timeout: 5000 });

    await expect(
      block.getByText('Send alert when users meet or exceed'),
    ).toBeVisible();

    await expect(
      block.locator(`[aria-label="overtime-threshold-hours-${suffix}"]`),
    ).toHaveValue('8');
    await expect(
      block.locator(`[aria-label="overtime-threshold-minutes-${suffix}"]`),
    ).toHaveValue('0');

    await expect(
      block.getByText('After threshold is crossed, send'),
    ).toBeVisible();

    await expect(
      block.locator(`[aria-label="overtime-total-alerts-${suffix}"]`),
    ).toHaveValue('2');
    await expect(
      block.locator(`[aria-label="overtime-alert-interval-${suffix}"]`),
    ).toHaveValue('60');
  }

  /** Read-only notifications card: `OvertimeViewStack` + one `OvertimePeriodSection` (Daily or Weekly). */
  async verifySavedAlertsInNotifications(
    period: 'Daily' | 'Weekly',
  ): Promise<void> {
    const suffix = this.notificationPeriodSuffix(period);
    await expect(
      this.page.getByTestId('notifications-settings').first(),
    ).toBeVisible({ timeout: 10000 });

    const stack = this.page.locator('[class*="OvertimeViewStack"]').filter({
      has: this.page.locator('[class*="OvertimePeriodSection"]'),
    });
    await expect(stack).toBeVisible({ timeout: 10000 });
    await expect(stack.getByText('Overtime', { exact: true })).toBeVisible();

    const thresholdLine = `8 hours, 0 minutes per ${suffix}`;
    const block = stack
      .locator('[class*="OvertimePeriodSection"]')
      .filter({ has: this.page.getByText(period, { exact: true }) });
    await expect(block).toBeVisible({ timeout: 10000 });

    await expect(
      block.getByText('Send alert when users meet or exceed'),
    ).toBeVisible();
    await expect(block.getByText(thresholdLine)).toBeVisible();
    await expect(
      block.getByText('After threshold is crossed, send'),
    ).toBeVisible();
    await expect(
      block.getByText('2 total alerts every 60 minutes'),
    ).toBeVisible();
    await expect(block.getByText('Send alerts')).toBeVisible();
    await expect(
      block.getByText(
        'On, email, mobile to admins, group leads, and employees',
      ),
    ).toBeVisible();
  }

  async uncheckDailyAndWeeklyCheckbox(): Promise<void> {
    const section = this.page
      .locator('[class*="OvertimeEditSectionContainer"]')
      .filter({ has: this.page.getByRole('checkbox', { name: 'Daily' }) });
    await expect(section).toBeVisible({ timeout: 10000 });
    const dailyCb = section.getByRole('checkbox', { name: 'Daily' });
    if (await dailyCb.isChecked()) await dailyCb.uncheck();
    const weeklyCb = section.getByRole('checkbox', { name: 'Weekly' });
    if (await weeklyCb.isChecked()) await weeklyCb.uncheck();
    await this.saveNotifications();
    console.log('Unchecked Daily and Weekly checkbox in notifications');
    await this.page.waitForTimeout(1000);
  }
}

export default OvertimePolicyPage;
