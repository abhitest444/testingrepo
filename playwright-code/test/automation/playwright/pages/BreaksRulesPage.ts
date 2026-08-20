import { Page, Locator, expect } from '@playwright/test';
import { validateBreakSectionPresent } from '../flows/Util/Breaks.Util';
import { handlePopupsInAnyOrder, waitForPageReady } from './TimeSettingsPage';

export class BreaksRulesPage {
  readonly page: Page;
  readonly addRuleButton: Locator;
  //readonly pagination: Locator;
  readonly closeButton: Locator;
  // readonly helpIcon: Locator;
  readonly closeIcon: Locator;
  readonly title: Locator;
  readonly heading: Locator;
  readonly description: Locator;
  readonly table: Locator;
  readonly allTeamMembersLink: Locator;
  readonly AllteamMembersCheckbox: Locator;
  readonly teamMemberCheckbox: Locator;
  readonly assignTeamMembersText: Locator;
  readonly searchTeamMember: Locator;
  readonly teamMember2Checkbox: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addRuleButton = page
      .locator(`//span[text()="Add break rule"]`)
      .first();
    this.table = page.locator(`//table`).first();
    // this.pagination = page.locator('.pagination').first();
    this.closeButton = page.locator(`(//span[text()='Close'])[1]`);
    // this.helpIcon = page.locator('[aria-label="Help"]').first();
    this.closeIcon = page.locator('[aria-label="Close"]').first();
    this.title = page.locator(`(//h2[text()='Manage breaks'])[1]`);
    this.heading = page.locator(
      `(//h2[text()="Manage your team's break rules"])[1]`,
    );
    this.description = page.getByText(/break rules/i, { exact: false }).first();
    // Match "All team members" OR "X team member" / "X team members" in the Assigned to column
    this.allTeamMembersLink = page
      .getByText('All team members')
      .or(page.getByText(/\d+ team members?/))
      .first();
    this.AllteamMembersCheckbox = page.getByRole('checkbox', {
      name: 'Select all team members',
    });
    this.teamMemberCheckbox = page
      .getByRole('checkbox', { name: 'Team member: test emp1' })
      .first();
    this.teamMember2Checkbox = page
      .getByRole('checkbox', { name: 'Team member: test emp2' })
      .first();
    this.assignTeamMembersText = page.getByText('Assign team members');
    this.searchTeamMember = page.getByPlaceholder('Search team member');
    this.saveButton = page.getByRole('button', { name: 'Save' });
  }

  async goto() {
    // Implement navigation to Manage Breaks screen
    await this.page.goto('app/accountsettings?p=time');
    await this.page.waitForTimeout(2000);
    // Wait for the page to be ready before checking for popups
    await waitForPageReady(this.page);
    await handlePopupsInAnyOrder(this.page);
    await this.page
      .locator(`//div[@class="breaks-widget"] / descendant::button`)
      .click();
    await validateBreakSectionPresent(this.page);

    //await this.page.locator(`//button[@aria-label="edit"]`).click();
    await expect(this.title).toBeVisible();
  }

  async assertUIElements() {
    await expect(this.title).toBeVisible();
    await expect(this.heading).toBeVisible();
    await expect(this.description).toBeVisible();
    await expect(this.addRuleButton).toBeVisible();
    // await expect(this.pagination).toBeVisible();
    await expect(this.closeButton).toBeVisible();
    // await expect(this.helpIcon).toBeVisible();
    await expect(this.closeIcon).toBeVisible();
    // Check table columns
    for (const col of [
      'Break name',
      'Duration',
      'Type',
      'Auto/Manual',
      'Assigned to',
      'Status',
      'Actions',
    ]) {
      await expect(
        this.page.locator(
          `(//table[@role="table"])[1] / descendant::th[text()='${col}']`,
        ),
      ).toBeVisible();
    }
  }

  async assertTableData(expectedRows: { [key: string]: string }[]) {
    for (const row of expectedRows) {
      for (const [col, value] of Object.entries(row)) {
        await expect(
          this.table.getByRole('cell', { name: value }),
        ).toBeVisible();
      }
    }
  }

  // async assertPaginationControls() {
  //   await expect(this.pagination).toBeVisible();
  //   await expect(
  //     this.pagination.getByRole('button', { name: /next/i }),
  //   ).toBeVisible();
  //   await expect(
  //     this.pagination.getByRole('button', { name: /previous/i }),
  //   ).toBeVisible();
  // }

  /**
   * Toggle the active/inactive status of a break rule by name.
   * @param ruleName The name of the break rule
   * @param activate true to activate, false to deactivate
   */
  async toggleRuleStatus(ruleName: string, activate: boolean) {
    // Find the row for the rule
    const row = this.table.getByRole('row', {
      name: new RegExp(ruleName, 'i'),
    });
    // Assume the toggle is a checkbox or switch in the 'Status' column
    // Try to find a toggle by role or label in the row
    const toggle = row.locator('input[type="checkbox"], [role="switch"]');
    // Check current state
    const isChecked =
      (await toggle.getAttribute('aria-checked')) === 'true' ||
      (await toggle.isChecked?.());
    if (activate && !isChecked) {
      await toggle.click();
    } else if (!activate && isChecked) {
      await toggle.click();
    }
    // Optionally, wait for a save or confirmation if needed
  }

  async openHelpPanel() {
    await this.page.getByRole('button', { name: /help/i }).click();
  }

  async searchHelpPanel(query: string) {
    await this.page.getByPlaceholder(/search/i).fill(query);
  }

  async closeHelpPanel() {
    await this.page
      .locator(
        '[aria-label="Help Panel"] [aria-label="Close"], [aria-label*="help"] [aria-label="Close"]',
      )
      .click();
  }

  async clickContactUs() {
    await this.page.getByRole('button', { name: /contact us/i }).click();
  }

  async clickAddBreakRuleButton() {
    await this.page.getByRole('button', { name: 'add-break-rule-btn' }).click();
  }

  async verifyAssignTeamMembersPanel() {
    await expect(this.assignTeamMembersText).toBeVisible();
    await expect(this.searchTeamMember).toBeVisible();
    await expect(
      this.page.getByRole('checkbox', { name: 'Select all team members' }),
    ).toBeVisible();
    await expect(
      this.page.getByRole('checkbox', { name: 'Team member: test emp1' }),
    ).toBeVisible();
  }

  async selectDeselectTeamMembersCheckbox() {
    await this.AllteamMembersCheckbox.click();
    await expect(this.teamMemberCheckbox).not.toBeChecked();

    await this.teamMemberCheckbox.click();
    await expect(this.teamMemberCheckbox).toBeChecked();
  }

  async deselectTeamMemberAndSave() {
    await this.teamMemberCheckbox.click();
    await this.saveButton.click();
    // Use flexible locator that matches any team member count
    await expect(this.allTeamMembersLink).toBeVisible();
    await this.allTeamMembersLink.click();

    // TODO: Uncomment this when we have to delesect second team member
    // await this.teamMember2Checkbox.click();
    // await expect(this.AllteamMembersCheckbox).not.toBeChecked();
    // await (this.saveButton).click();

    // const noTeamMember = this.page.getByText('No team member').nth(1);
    // await expect(noTeamMember).toBeVisible();
    // await noTeamMember.click();

    // Restore to all team members
    const isAllChecked = await this.AllteamMembersCheckbox.isChecked();
    if (!isAllChecked) {
      await this.AllteamMembersCheckbox.click();
    }
    await this.saveButton.click();
    await expect(this.page.getByText('All team members')).toBeVisible();
  }

  async deselectAllTeamMembersAndCancel() {
    await this.AllteamMembersCheckbox.click();
    await expect(this.teamMemberCheckbox).not.toBeChecked();
    await expect(this.teamMember2Checkbox).not.toBeChecked();
    await this.page.getByRole('button', { name: /cancel/i }).click();
    await this.allTeamMembersLink.click();
    await expect(this.AllteamMembersCheckbox).toBeChecked();
  }

  async SuccessfullTeamMemberSearch(empName1: string) {
    await this.searchTeamMember.isEditable();
    await this.searchTeamMember.fill(empName1);
    await expect(this.teamMemberCheckbox).toBeVisible();
    await expect(this.teamMember2Checkbox).not.toBeVisible();
  }

  async NoResultTeamMemberSearch(empName2: string) {
    await this.searchTeamMember.clear();
    await this.searchTeamMember.fill(empName2);
    await expect(this.teamMemberCheckbox).not.toBeVisible();
    await expect(this.teamMember2Checkbox).not.toBeVisible();
  }

  async selectAutomaticOrManualBreakCheckbox(
    breakType: 'Automatic' | 'Manual',
  ) {
    await this.page
      .locator(
        `//span[text()='${breakType} break'] / ancestor::label / descendant::input`,
      )
      .click();
  }

  async clickSaveBreakRuleButton() {
    await this.page.locator(`//span[text()='Save']`).click();
  }

  /**
   * Verify that the "No set duration" checkbox is not checked
   */
  async verifyNoSetDurationNotChecked() {
    await expect(this.page.getByText('No set duration')).not.toBeChecked();
  }

  /**
   * Verify that the "No set duration" checkbox is checked
   */
  async verifyNoSetDurationChecked() {
    await expect(this.page.getByText('No set duration')).toBeChecked();
  }

  /**
   * Click the "No set duration" checkbox
   */
  async clickNoSetDurationCheckbox() {
    await this.page.getByLabel('No set duration').click();
  }

  /**
   * Verify that the "Automatic break" checkbox is disabled
   */
  async verifyAutomaticAndManualBreakDisabled() {
    await expect(
      this.page
        .locator('label:has-text("Automatic break") input[type="checkbox"]')
        .first(),
    ).toBeDisabled();
    await expect(
      this.page
        .locator('label:has-text("Manual break") input[type="checkbox"]')
        .first(),
    ).toBeDisabled();
  }

  async verifyHourAndMinuteDropdownDisabled() {
    await expect(
      this.page.locator('//input[@aria-label="Enter duration"]').first(),
    ).toBeDisabled();
    await expect(
      this.page.locator('//input[@value="Minutes"]').first(),
    ).toBeDisabled();
  }

  /**
   * Assigns an already-created break rule (visible in the rules table) to a
   * SINGLE team member. Opens that rule row's "Assigned to" panel, clears the
   * default "all team members" selection, selects only the given member, and
   * saves.
   * @param ruleName   Exact break rule name — identifies the table row.
   * @param memberName Team member as shown in the checkbox label (lowercase,
   *                   e.g. 'test emp1' → aria-label "Team member: test emp1").
   */
  async assignBreakRuleToSingleTeamMember(
    ruleName: string,
    memberName: string,
  ) {
    // Open the assignment panel for this rule's row via its "Assigned to" link.
    const assignedToLink = this.page
      .locator(`//td[text()='${ruleName}']/ancestor::tr`)
      .getByText(/All team members|\d+ team members?/)
      .first();
    await assignedToLink.click();
    await expect(this.AllteamMembersCheckbox).toBeVisible({ timeout: 10000 });

    // Clear the default selection so only the chosen member ends up assigned.
    if (await this.AllteamMembersCheckbox.isChecked()) {
      await this.AllteamMembersCheckbox.click();
    }

    // Filter to and select the specific member.
    await this.searchTeamMember.fill(memberName);
    await this.page.waitForTimeout(1000);
    const memberCheckbox = this.page
      .getByRole('checkbox', { name: `Team member: ${memberName}` })
      .first();
    await expect(memberCheckbox).toBeVisible({ timeout: 10000 });
    if (!(await memberCheckbox.isChecked())) {
      await memberCheckbox.click();
    }

    await this.saveButton.click();
    await this.page.waitForTimeout(2000);
  }
}
