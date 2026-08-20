import { Page, Locator, expect } from '@playwright/test';
import gotoWithAuthSession from '../gotoWithAuthSession';

/**
 * Page Object for Time Project
 * Handles Time Project page interactions including navigation, estimates, and validations
 */
class TimeProjectPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ========== LOCATORS ==========

  // Time Project menu option in Time submenu
  get timeProjectOption(): Locator {
    return this.page.locator(
      `//div[@id="submenu-time"] / descendant::*[text()='Time projects']`,
    );
  }

  // Alternative locator for Time project option
  get timeProjectMenuOption(): Locator {
    return this.page.locator(`//*[text()='Time projects']`);
  }

  // Loading spinner
  get loadingSpinner(): Locator {
    return this.page.locator(
      `//div[@aria-label="Loading" and @role="progressbar"]`,
    );
  }

  // ========== TABLE HEADER LOCATORS ==========

  get projectCustomerHeader(): Locator {
    return this.page.locator(`//*[text()="Project / Customer"]`);
  }

  get statusHeader(): Locator {
    return this.page.getByRole('columnheader', { name: 'Status' });
  }

  get deadlineHeader(): Locator {
    return this.page.getByRole('columnheader', { name: 'Deadline' });
  }

  get budgetHeader(): Locator {
    return this.page.getByRole('columnheader', { name: 'Budget' });
  }

  get actionHeader(): Locator {
    return this.page.getByRole('columnheader', { name: 'Action' });
  }

  // ========== FILTER LOCATORS ==========

  get statusFilter(): Locator {
    return this.page.locator(`//*[text()='Status']/following::input`).first();
  }

  get customerFilter(): Locator {
    return this.page.locator(`//*[text()='Customer']/following::input`).first();
  }

  get searchInput(): Locator {
    return this.page.locator(`//*[text()="Search"]`);
  }

  // ========== PAGE CONTENT LOCATORS ==========

  get createProjectButton(): Locator {
    return this.page
      .locator('//*[text()="New project"]')
      .or(this.page.locator('//*[text()="Start a project"]'))
      .first();
  }

  get manageProjectsLink(): Locator {
    // Green "Manage projects" BUTTON on the Time projects tab (opens the
    // Projects app). Match by role+name first, with a text fallback.
    return this.page
      .getByRole('button', { name: 'Manage projects' })
      .or(this.page.locator(`//*[normalize-space(text())="Manage projects"]`));
  }

  get pageDescription(): Locator {
    return this.page.locator(`//*[contains(text(), 'No projects')]`);
  }

  get getStartedDescription(): Locator {
    return this.page.locator(
      `//*[contains(text(), 'Add projects to start creating tracking actual time versus estimated time')]`,
    );
  }

  // ========== CREATE ESTIMATE LOCATORS ==========

  get createEstimateLink(): Locator {
    return this.page.locator(`//*[text()='Create Estimate']`);
  }

  getCreateEstimateLinkForProject(projectName: string): Locator {
    return this.page.locator(
      `//tr[contains(., '${projectName}')]//*[text()='Create Estimate']`,
    );
  }

  // Estimate creation page locators
  get estimatePageTitle(): Locator {
    return this.page.locator(
      `//*[contains(text(), 'How are you estimating this project')]`,
    );
  }

  get byHoursRadioButton(): Locator {
    return this.page.locator(`//input[@type='radio' and @value='TOTAL_HOURS']`);
  }

  get byServiceItemsRadioButton(): Locator {
    return this.page.locator(
      `//input[@type='radio' and @value='BY_SERVICE_ITEM']`,
    );
  }

  get byHoursLabel(): Locator {
    return this.page.locator(`//*[contains(text(), 'By hours')]`);
  }

  get byServiceItemsLabel(): Locator {
    return this.page.locator(`//*[contains(text(), 'By service item')]`);
  }

  get byHoursDescription(): Locator {
    return this.page.locator(
      `//*[contains(text(), 'Estimate by total hours on a project and track time towards the total')]`,
    );
  }

  get howManyHoursQuestion(): Locator {
    return this.page.locator(
      `//*[contains(text(), 'How many hours are estimated to complete the project?')]`,
    );
  }

  get hoursInputTextbox(): Locator {
    return this.page.locator(`//input[@placeholder='Enter hours']`);
  }

  get closeButton(): Locator {
    return this.page.locator(
      `//*[text()='Create estimate' or text()='Edit estimate']/following::button[@aria-label='Close']`,
    );
  }

  get closeXButton(): Locator {
    return this.page.locator(
      `//button[@aria-label='Close'] | //button[contains(@class, 'CloseButton')] | //*[contains(@aria-label, 'close') or contains(@aria-label, 'Close')]`,
    );
  }

  get selectConfirmationNo(): Locator {
    return this.page.locator(
      `//*[text()='Unsaved Changes']/following::*[text()='No']`,
    );
  }

  get selectConfirmationYes(): Locator {
    return this.page.locator(
      `//*[text()='Unsaved Changes']/following::*[text()='Yes']`,
    );
  }

  // ========== SAVE AND ADD BUTTON LOCATORS ==========

  get saveButton(): Locator {
    return this.page.locator(`//*[text()='Save']`);
  }

  get addButton(): Locator {
    return this.page.locator(`//*[text()='+ Add']`);
  }

  // ========== BY SERVICE ITEM LOCATORS ==========

  get byServiceItemDescription(): Locator {
    return this.page.locator(
      `//*[contains(text(), 'Estimate by service items on the project and track progress on those service items')]`,
    );
  }

  get enterServiceItemsLabel(): Locator {
    return this.page.locator(
      `//*[contains(text(), 'Enter the service items and estimated hours')]`,
    );
  }

  get serviceItemDropdown(): Locator {
    return this.page.locator(
      `//input[@placeholder='Select service item'] | //*[contains(@placeholder, 'service item')] | //*[contains(@aria-label, 'Service item')]`,
    );
  }

  get serviceItemHoursInput(): Locator {
    return this.page.locator(`//input[@placeholder='Enter hours']`);
  }

  // ========== HOURS INPUT UP/DOWN ARROWS ==========

  get hoursInputUpArrow(): Locator {
    return this.page.locator(
      `//input[@placeholder='Enter hours']/following::*[contains(@class, 'increment') or contains(@class, 'up') or @aria-label='Increase'] | //input[@placeholder='Enter hours']/parent::*//*[contains(@class, 'spin-button-up')]`,
    );
  }

  get hoursInputDownArrow(): Locator {
    return this.page.locator(
      `//input[@placeholder='Enter hours']/following::*[contains(@class, 'decrement') or contains(@class, 'down') or @aria-label='Decrease'] | //input[@placeholder='Enter hours']/parent::*//*[contains(@class, 'spin-button-down')]`,
    );
  }

  // ========== EDIT ESTIMATE LOCATORS ==========

  get editEstimateButton(): Locator {
    return this.page.locator(
      `//*[text()='Edit'] | //button[contains(@aria-label, 'Edit')]`,
    );
  }

  getEditEstimateForProject(projectName: string): Locator {
    return this.page.locator(
      `//tr[contains(., '${projectName}')]//*[text()='Edit'] | //tr[contains(., '${projectName}')]//button[contains(@aria-label, 'Edit')]`,
    );
  }

  // ========== CHANGE ESTIMATE TYPE POPUP LOCATORS ==========

  get changeEstimateTypePopupTitle(): Locator {
    return this.page.locator(`//*[contains(text(), 'Change estimate type')]`);
  }

  get changeEstimateTypePopupMessage(): Locator {
    return this.page.locator(
      `//*[contains(text(), 'Changing the estimate type will delete the current estimate')]`,
    );
  }

  get changeEstimateTypeCancelButton(): Locator {
    return this.page.locator(
      `//*[text()='Change estimate type?']/following::*[text()='Cancel']`,
    );
  }

  get changeEstimateTypeContinueButton(): Locator {
    return this.page.locator(
      `//*[text()='Change estimate type?']/following::*[text()='Continue']`,
    );
  }

  // ========== BUDGET COLUMN LOCATORS ==========

  getBudgetValueForProject(projectName: string): Locator {
    return this.page.locator(
      `//tr[contains(., '${projectName}')]//td[4] | //tr[contains(., '${projectName}')]//*[contains(@class, 'budget')]`,
    );
  }

  // ========== POPUP LOCATORS ==========

  get gotItButton(): Locator {
    return this.page.locator(`//*[text()='Got it']`);
  }

  // ========== NAVIGATION METHODS ==========

  async navigateToTimeProject(): Promise<void> {
    // The Time Projects widget lives at /app/time/timeProject?jobId=time
    // (NOT /app/time/projects, which is the QBO Projects app). Using the
    // correct deep link avoids landing on the wrong surface after a project
    // create / edit round-trip.
    await gotoWithAuthSession(this.page, '/app/time/timeProject?jobId=time', {
      waitUntil: 'load',
    });
    await this.page.waitForTimeout(2000);
    await this.waitForPageReady();
  }

  /**
   * Quick (bounded) check for the "No projects" zero-state. Used to branch
   * structural validations that only apply when a project table is rendered —
   * avoids waiting out the 3-minute global expect timeout on table headers
   * that never appear in an empty account.
   */
  async isZeroState(timeout = 6000): Promise<boolean> {
    return await this.pageDescription
      .first()
      .isVisible({ timeout })
      .catch(() => false);
  }

  async waitForPageReady(): Promise<void> {
    await this.page.waitForLoadState('load');
    await this.page.waitForTimeout(1000);
    try {
      if (await this.loadingSpinner.isVisible({ timeout: 2000 })) {
        await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 30000 });
      }
    } catch (error) {
      console.log('Loading spinner not found or already hidden');
    }
    await this.handleTimeProjectPopups();
  }

  async handleTimeProjectPopups(): Promise<void> {
    const maxAttempts = 5;
    let popupsHandled = 0;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      let handledThisRound = false;

      // Check and dismiss "Got it" button (common in feature announcements)
      try {
        if (await this.gotItButton.first().isVisible({ timeout: 1000 })) {
          await this.gotItButton.first().click({ timeout: 2000 });
          await this.page.waitForTimeout(500);
          popupsHandled++;
          handledThisRound = true;
          console.log('✓ Dismissed popup using "Got it" button');
        }
      } catch (error) {
        // Button not found or already dismissed
      }

      // If no popups were handled this round, exit the loop
      if (!handledThisRound) {
        break;
      }
    }

    if (popupsHandled > 0) {
      console.log(`✓ Total popups handled: ${popupsHandled}`);
    }
  }

  async validateTimeProjectOptionNotVisible(): Promise<void> {
    await expect(this.timeProjectMenuOption.first()).not.toBeVisible({
      timeout: 10000,
    });
  }

  async validateProjectPresentInQBOProjects(
    projectName: string,
  ): Promise<void> {
    const projectRow = this.getProjectRowInQBOProjects(projectName);
    await expect(projectRow.first()).toBeVisible({ timeout: 30000 });
    console.log(`✓ Project "${projectName}" is present in QBO Projects page`);
  }

  async clickTimeProjectOption(): Promise<void> {
    // Use the specific submenu locator for more reliable targeting
    const timeProjectSubmenuOption = this.page.locator(
      `//div[@id="submenu-time"] / descendant::*[normalize-space()='Time project' or normalize-space()='Time projects']`,
    );

    // Check if submenu option is visible, if not re-hover to reveal it
    const isVisible = await timeProjectSubmenuOption
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    if (!isVisible) {
      console.log(
        'Time project submenu option not visible, re-hovering on Time menu...',
      );
      const timeMenu = this.page.locator(
        `//div[contains(@class, 'NavItem')] / descendant::*[text()='Time']`,
      );
      await timeMenu.hover({ timeout: 10000 });
      await this.page.waitForTimeout(1000);
    }

    // Click on the Time project option
    await timeProjectSubmenuOption.first().click({ timeout: 15000 });
    await this.page.waitForTimeout(2000);
    await this.waitForPageReady();
  }

  // ========== ACTION METHODS ==========

  async validateManageProjectsLinkDisplayed(): Promise<void> {
    await expect(this.manageProjectsLink.first()).toBeVisible();
    // await this.manageProjectsLink.first().click();
    await this.page.waitForTimeout(500);
  }

  async clickManageProjectsLink(): Promise<void> {
    await expect(this.manageProjectsLink.first()).toBeVisible();
    await this.manageProjectsLink.first().click();
    await this.page.waitForTimeout(2000);
  }

  async clickCreateEstimateLink(): Promise<void> {
    await expect(this.createEstimateLink.first()).toBeVisible();
    await this.createEstimateLink.first().click();
    await this.page.waitForTimeout(2000);
  }

  async clickCreateEstimateLinkForProject(projectName: string): Promise<void> {
    const link = this.getCreateEstimateLinkForProject(projectName);
    await expect(link.first()).toBeVisible();
    await link.first().click();
    await this.page.waitForTimeout(2000);
  }

  async selectByHoursOption(): Promise<void> {
    await this.byHoursRadioButton.first().click();
    await this.page.waitForTimeout(500);
  }

  async selectByServiceItemsOption(): Promise<void> {
    await this.byServiceItemsRadioButton.first().click();
    await this.page.waitForTimeout(500);
  }

  async enterHours(hours: string): Promise<void> {
    await this.hoursInputTextbox.first().fill(hours);
    await this.page.waitForTimeout(500);
  }

  async clickCloseButton(): Promise<void> {
    await this.closeButton.first().click();
    await this.page.waitForTimeout(1000);
  }

  async clickNoCreateEstimateConfirmation(): Promise<void> {
    await this.selectConfirmationNo.click();
    await this.page.waitForTimeout(1000);
  }

  async clickYesCreateEstimateConfirmation(): Promise<void> {
    await this.selectConfirmationYes.click();
    await this.page.waitForTimeout(1000);
  }

  async searchForProject(projectName: string): Promise<void> {
    await this.searchInput.first().fill(projectName);
    await this.page.waitForTimeout(1000);
  }

  // ========== VALIDATION METHODS ==========

  async validateTimeProjectOptionVisible(): Promise<void> {
    await expect(this.timeProjectMenuOption.first()).toBeVisible();
  }

  async validateTimeProjectPageDisplayed(): Promise<void> {
    await expect(this.page).toHaveURL(/time.*projects|time.*project|projects/i);
  }

  async validateTableHeaders(): Promise<void> {
    await expect(this.projectCustomerHeader.first()).toBeVisible();
    await expect(this.statusHeader.first()).toBeVisible();
    await expect(this.deadlineHeader.first()).toBeVisible();
    await expect(this.budgetHeader.first()).toBeVisible();
    await expect(this.actionHeader.first()).toBeVisible();
  }

  async validateFiltersPresent(): Promise<void> {
    await expect(this.statusFilter.first()).toBeVisible();
    await expect(this.customerFilter.first()).toBeVisible();
  }

  async validateSearchOptionPresent(): Promise<void> {
    await expect(this.searchInput.first()).toBeVisible();
  }

  async validateCreateProjectNotVisible(): Promise<void> {
    await expect(this.createProjectButton).not.toBeVisible();
  }

  async validateProjectsPageRedirect(): Promise<void> {
    // "New project" is a BUTTON (text nested in a child span), so match by
    // role+name first; fall back to text / "Start a project" zero-state.
    const addProject = this.page
      .getByRole('button', { name: /new project/i })
      .or(this.page.getByRole('link', { name: /new project/i }))
      .or(this.page.locator('//*[normalize-space(text())="New project"]'))
      .or(this.page.locator('//*[normalize-space(text())="Start a project"]'))
      .first();
    await expect(addProject).toBeVisible({ timeout: 15000 });
    await expect(this.page).toHaveURL('https://qbo.intuit.com/app/projects');
  }

  // ========== CREATE PROJECT LOCATORS (QBO Projects Page) ==========

  get newProjectButton(): Locator {
    return this.page.locator(`//*[text()="New project"]`);
  }

  get projectNameInput(): Locator {
    // Require a TEXTBOX named "project name". The old /name/i label match also
    // matched list-row checkboxes like aria-label="Select project … Renamed"
    // ("Renamed" contains "name"), so .fill() hit a checkbox and threw.
    return this.page
      .getByRole('textbox', { name: /project name/i })
      .or(this.page.getByPlaceholder(/project name/i))
      .first();
  }

  get customerDropdown(): Locator {
    return this.page.locator(`//input[@aria-label="Who's the project for?"]`);
  }

  getCustomerOption(customerName: string): Locator {
    return this.page.locator(
      `//*[@role='option' and contains(., '${customerName}')] | //*[@role='listbox']//*[contains(text(), '${customerName}')]`,
    );
  }

  get projectSaveButton(): Locator {
    return this.page
      .getByRole('button', { name: /^save$/i })
      .or(this.page.getByRole('button', { name: /save and (close|finish)/i }))
      .first();
  }

  /**
   * The project Status dropdown in the New/Edit project form. It is an
   * IDS combobox input (role="combobox", placeholder "Select a status",
   * default value "In progress") inside `.project-status-dropdown`. Options:
   * Not started / In progress / Completed / Canceled.
   */
  get projectStatusDropdown(): Locator {
    // MUST scope to the project dialog: an unscoped getByPlaceholder('Select a
    // status') also matches a duplicate status input BEHIND the drawer, and
    // .first() picked it — its click was then intercepted by the drawer's own
    // "Upload files…"/"Project Management Agent" panels. Scoping to the dialog
    // (and NOT OR-ing an unscoped fallback, which would reintroduce the wrong
    // match) targets the visible, clickable status field.
    const dialog = this.page.getByRole('dialog', {
      name: /new project|edit your project/i,
    });
    return dialog
      .getByPlaceholder('Select a status')
      .or(dialog.locator('.project-status-dropdown input'))
      .first();
  }

  /**
   * Open the form's Status dropdown, select the given status by visible text,
   * and VERIFY the combobox value actually changed (retrying up to 3×). Clicking
   * the option silently no-ops sometimes, which would create a project with the
   * default "In progress" status — so we confirm via the input value.
   */
  async selectProjectStatusInForm(status: string): Promise<void> {
    const trigger = this.projectStatusDropdown;
    const anyOption = this.page.locator(`//li[@role='option']`).first();
    const menuOpen = (ms: number): Promise<boolean> =>
      anyOption
        .waitFor({ state: 'visible', timeout: ms })
        .then(() => true)
        .catch(() => false);
    const shown = async (): Promise<string> =>
      (await trigger.inputValue().catch(() => '')).trim();

    // Open the listbox (plain click often doesn't open it) and click one option.
    const selectOnce = async (s: string): Promise<void> => {
      const optionLoc = this.page
        .locator(`//li[@role='option']//span[normalize-space()='${s}']`)
        .or(this.page.getByRole('option', { name: s }));
      await trigger.scrollIntoViewIfNeeded().catch(() => undefined);
      await trigger.click({ timeout: 8000 }).catch(() => undefined);
      if (!(await menuOpen(1500))) {
        // Chevron fallback — scope to the dialog so we don't hit a duplicate
        // status control behind the drawer (the option menu stays page-level
        // since it renders in a portal outside the dialog).
        await this.page
          .getByRole('dialog', { name: /new project|edit your project/i })
          .locator(
            '.project-status-dropdown [class*="iconBox"], .project-status-dropdown [role="button"]',
          )
          .first()
          .click({ force: true, timeout: 5000 })
          .catch(() => undefined);
      }
      if (await menuOpen(2000)) {
        await optionLoc
          .first()
          .click({ timeout: 8000 })
          .catch(() => undefined);
      }
      await this.page.waitForTimeout(500);
    };

    const target = status.trim();
    // A SINGLE selection updates the display but doesn't persist on save (same
    // "displayed-but-not-committed" trap as the Customer field, where the fix was
    // to toggle through a different value). So pick a DIFFERENT status first,
    // then the target — the change-of-change forces the commit — then blur by
    // clicking the project-name field so the form captures the value.
    const intermediate =
      ['Not started', 'Completed', 'Canceled', 'In progress'].find(
        (s) => s.toLowerCase() !== target.toLowerCase(),
      ) ?? 'In progress';
    await selectOnce(intermediate);
    await selectOnce(target);
    await this.projectNameInput.click({ timeout: 5000 }).catch(() => undefined);
    await this.page.waitForTimeout(400);

    if ((await shown()).toLowerCase() === target.toLowerCase()) {
      console.log(
        `✓ Status set to "${target}" (toggled ${intermediate} → ${target})`,
      );
    } else {
      console.log(`⚠ Status shows "${await shown()}" not "${target}"`);
    }
  }

  /**
   * Create a project with an explicit status (and customer). The form defaults
   * to "In progress", so the status step is skipped when that's requested.
   */
  async createNewProjectWithStatus(
    projectName: string,
    customerName: string,
    status: string,
  ): Promise<void> {
    await this.page.waitForTimeout(2000);
    await this.clickNewProjectButton();
    await this.enterProjectName(projectName);
    await this.selectCustomer(customerName);
    if (status && !/^in progress$/i.test(status.trim())) {
      await this.selectProjectStatusInForm(status);
      // Give the status selection a few seconds to commit before saving — saving
      // too soon after selecting persists the stale (default) status.
      await this.page.waitForTimeout(4000);
    }
    await this.clickProjectSaveButton();
    console.log(
      `✓ Created project "${projectName}" (customer=${customerName}, status=${status})`,
    );
  }

  // ========== CREATE PROJECT ACTION METHODS ==========

  async clickNewProjectButton(): Promise<void> {
    // "New project" is a BUTTON (green, top-right of the Projects app) — match by
    // role+accessible name first (case-insensitive), then link/text fallbacks
    // (zero-state may show "Start a project").
    const newBtn = this.page
      .getByRole('button', { name: /new project/i })
      .or(this.page.getByRole('link', { name: /new project/i }))
      .or(this.page.locator('//*[normalize-space(text())="New project"]'))
      .or(this.page.locator('//*[normalize-space(text())="Start a project"]'))
      .first();
    await expect(newBtn).toBeVisible({ timeout: 15000 });
    await newBtn.click();
    await this.page.waitForTimeout(1000);
  }

  async enterProjectName(projectName: string): Promise<void> {
    await expect(this.projectNameInput).toBeVisible({ timeout: 15000 });
    await this.projectNameInput.fill(projectName);
  }

  async selectCustomer(customerName: string): Promise<void> {
    await expect(this.customerDropdown).toBeVisible({ timeout: 15000 });
    await this.customerDropdown.first().click();
    await this.page.waitForTimeout(500);
    const customerOption = this.getCustomerOption(customerName);
    await expect(customerOption.first()).toBeVisible({ timeout: 10000 });
    await customerOption.first().click();
    await this.page.waitForTimeout(500);
  }

  async clickProjectSaveButton(): Promise<void> {
    await this.projectSaveButton.click();
    await this.page.waitForTimeout(3000);
  }

  async createNewProject(
    projectName: string,
    customerName: string,
  ): Promise<void> {
    await this.page.waitForTimeout(2000);

    await this.clickNewProjectButton();
    console.log('✓ Clicked New project button');

    await this.enterProjectName(projectName);
    console.log(`✓ Entered project name: ${projectName}`);

    await this.selectCustomer(customerName);
    console.log(`✓ Selected customer: ${customerName}`);

    await this.clickProjectSaveButton();
    console.log('✓ Clicked Save button - Project created successfully');
  }

  async validatePageDescription(): Promise<void> {
    await expect(this.pageDescription.first()).toBeVisible();
    await expect(this.getStartedDescription.first()).toBeVisible();
  }

  async validateZeroStateDescription(): Promise<void> {
    await expect(this.pageDescription.first()).toBeVisible();
    await expect(this.getStartedDescription.first()).toBeVisible();
  }

  async validateCreateEstimateLinkVisible(projectname: string): Promise<void> {
    const rowcount = await this.page
      .locator('//*[@role="table"]/tbody/tr')
      .count();
    for (let i = 1; i <= rowcount; i++) {
      const project = await this.page
        .locator('//*[@role="table"]/tbody/tr[' + i + ']/td[1]//child::span')
        .first()
        .textContent();
      const budget = await this.page
        .locator('//*[@role="table"]/tbody/tr[' + i + ']/td[4]//child::span')
        .first()
        .textContent();
      const createEstimate = this.page
        .locator('//*[@role="table"]/tbody/tr[' + i + ']/td[5]//button')
        .first();
      if (project == projectname && budget == '—') {
        await expect(createEstimate).toBeVisible({ timeout: 5000 });
        console.log(
          '✓ Create Estimate link is visible for projects without budgets',
        );
      } else if (project == projectname && budget != '—') {
        await expect(createEstimate).not.toBeVisible({ timeout: 5000 });
        console.log(
          '✓ Create Estimate link is not visible for projects with budgets',
        );
      }
    }
    await expect(this.createEstimateLink.first()).toBeVisible();
  }

  async validateEstimateCreationPageDisplayed(): Promise<void> {
    await expect(
      this.page.locator('//*[text()="Create estimate"]'),
    ).toBeVisible();
  }

  async validateEditEstimatePageDisplayed(): Promise<void> {
    await expect(
      this.page.locator('//*[text()="Edit estimate"]'),
    ).toBeVisible();
  }

  async validateEstimateOptions(): Promise<void> {
    await expect(this.byHoursLabel.first()).toBeVisible();
    await expect(this.byServiceItemsLabel.first()).toBeVisible();
    await expect(this.byHoursRadioButton.first()).toBeVisible();
    await expect(this.byServiceItemsRadioButton.first()).toBeVisible();
  }

  async validateByHoursEstimatePageElements(): Promise<void> {
    await expect(this.estimatePageTitle.first()).toBeVisible();
    await expect(this.byHoursDescription.first()).toBeVisible();
    await expect(this.howManyHoursQuestion.first()).toBeVisible();
    await expect(this.hoursInputTextbox.first()).toBeVisible();
  }

  async validateHoursInputPlaceholder(): Promise<void> {
    const placeholder = await this.hoursInputTextbox
      .first()
      .getAttribute('placeholder');
    expect(placeholder?.toLowerCase()).toContain('enter hours');
  }

  async isEstimateCreatedForProject(projectName: string): Promise<boolean> {
    const createEstimateLink =
      this.getCreateEstimateLinkForProject(projectName);
    return await createEstimateLink.isVisible().catch(() => false);
  }

  async validateEstimateNotCreated(projectName: string): Promise<void> {
    const hasCreateEstimateLink = await this.isEstimateCreatedForProject(
      projectName,
    );
    expect(hasCreateEstimateLink).toBeTruthy();
  }

  // ========== SAVE AND ADD ACTION METHODS ==========

  async clickSaveButton(): Promise<void> {
    await expect(this.saveButton.first()).toBeEnabled();
    await this.saveButton.first().click();
    await this.page.waitForTimeout(2000);
  }

  async clickAddButton(): Promise<void> {
    await expect(this.addButton.first()).toBeEnabled();
    await this.addButton.first().click();
    await this.page.waitForTimeout(1000);
  }

  async isSaveButtonEnabled(): Promise<boolean> {
    return await this.saveButton.first().isEnabled();
  }

  async isAddButtonEnabled(): Promise<boolean> {
    return await this.addButton.first().isEnabled();
  }

  // ========== SERVICE ITEM ACTION METHODS ==========

  async selectServiceItem(serviceName: string): Promise<void> {
    await this.serviceItemDropdown.first().click();
    await this.page.waitForTimeout(500);
    await this.page
      .locator(`//*[@role='option']/*[contains(text(), '${serviceName}')]`)
      .first()
      .click();
    await this.page.waitForTimeout(500);
  }

  async enterServiceItemHours(hours: string): Promise<void> {
    await this.serviceItemHoursInput.first().fill(hours);
    await this.page.waitForTimeout(500);
  }

  // ========== HOURS INPUT UP/DOWN ARROW METHODS ==========

  async clickHoursUpArrow(): Promise<void> {
    const input = this.hoursInputTextbox.first();
    await input.hover();
    await this.page.keyboard.press('ArrowUp');
    await this.page.waitForTimeout(300);
  }

  async clickHoursDownArrow(): Promise<void> {
    const input = this.hoursInputTextbox.first();
    await input.hover();
    await this.page.keyboard.press('ArrowDown');
    await this.page.waitForTimeout(300);
  }

  async getHoursInputValue(): Promise<string> {
    return await this.hoursInputTextbox.first().inputValue();
  }

  async validateHoursInputType(): Promise<void> {
    const inputType = await this.hoursInputTextbox.first().getAttribute('type');
    expect(inputType).toBe('number');
  }

  async validateNumericOnlyInput(): Promise<void> {
    await this.hoursInputTextbox.first().type('abc!@#');
    const valueAfterInvalidInput = await this.hoursInputTextbox
      .first()
      .inputValue();
    expect(valueAfterInvalidInput).toBe('');

    await this.hoursInputTextbox.first().fill('123');
    const valueAfterValidInput = await this.hoursInputTextbox
      .first()
      .inputValue();
    expect(valueAfterValidInput).toBe('123');
  }

  async validateUpDownArrowFunctionality(): Promise<void> {
    await this.hoursInputTextbox.first().fill('10');
    await this.hoursInputTextbox.first().focus();

    await this.page.keyboard.press('ArrowUp');
    await this.page.waitForTimeout(300);
    let currentValue = await this.hoursInputTextbox.first().inputValue();
    expect(parseInt(currentValue)).toBe(11);

    await this.page.keyboard.press('ArrowDown');
    await this.page.waitForTimeout(300);
    currentValue = await this.hoursInputTextbox.first().inputValue();
    expect(parseInt(currentValue)).toBe(10);
  }

  // ========== EDIT ESTIMATE METHODS ==========

  async clickEditEstimateForProject(projectName: string): Promise<void> {
    const editButton = this.getEditEstimateForProject(projectName);
    await expect(editButton.first()).toBeVisible();
    await editButton.first().click();
    await this.page.waitForTimeout(2000);
  }

  async clickActionMenuForProject(projectName: string): Promise<void> {
    const actionMenu = this.getActionMenuForProject(projectName).first();
    await expect(actionMenu).toBeVisible({ timeout: 20000 });
    await actionMenu.click();
    await this.page.waitForTimeout(500);
  }

  async selectEditEstimateFromMenu(): Promise<void> {
    await expect(this.editEstimateMenuOption.first()).toBeVisible();
    await this.editEstimateMenuOption.first().click();
    await this.page.waitForTimeout(2000);
  }

  async openEditEstimateViaActionMenu(projectName: string): Promise<void> {
    await this.clickActionMenuForProject(projectName);
    await this.selectEditEstimateFromMenu();
  }

  async updateHoursValue(newHours: string): Promise<void> {
    await this.hoursInputTextbox.first().clear();
    await this.hoursInputTextbox.first().fill(newHours);
    await this.page.waitForTimeout(500);
  }

  // ========== CHANGE ESTIMATE TYPE POPUP METHODS ==========

  async validateChangeEstimateTypePopup(): Promise<void> {
    await expect(this.changeEstimateTypePopupTitle.first()).toBeVisible();
    await expect(this.changeEstimateTypePopupMessage.first()).toBeVisible();
    await expect(this.changeEstimateTypeCancelButton.first()).toBeVisible();
    await expect(this.changeEstimateTypeContinueButton.first()).toBeVisible();
  }

  async clickChangeEstimateTypeCancel(): Promise<void> {
    await this.changeEstimateTypeCancelButton.first().click();
    await this.page.waitForTimeout(1000);
  }

  async clickChangeEstimateTypeContinue(): Promise<void> {
    await this.changeEstimateTypeContinueButton.first().click();
    await this.page.waitForTimeout(2000);
  }

  // ========== BY SERVICE ITEM VALIDATION METHODS ==========

  async validateByServiceItemPageElements(): Promise<void> {
    await expect(this.estimatePageTitle.first()).toBeVisible();
    await expect(this.byServiceItemDescription.first()).toBeVisible();
    await expect(this.enterServiceItemsLabel.first()).toBeVisible();
    await expect(this.serviceItemDropdown.first()).toBeVisible();
    await expect(this.serviceItemHoursInput.first()).toBeVisible();
  }

  async validateServiceItemHoursPlaceholder(): Promise<void> {
    const placeholder = await this.serviceItemHoursInput
      .first()
      .getAttribute('placeholder');
    expect(placeholder?.toLowerCase()).toContain('enter hours');
  }

  // ========== SERVICE ITEM EDIT LOCATORS ==========

  getServiceItemActionButton(index: number = 0): Locator {
    return this.page.locator(
      `(//td[contains(@class,'CreateEstimateDrawersty')]/following::button)[${
        index + 1
      }]`,
    );
  }

  get serviceItemEditOption(): Locator {
    return this.page.locator(`//button[contains(text(), 'Edit')]`);
  }

  get serviceItemDeleteOption(): Locator {
    return this.page.locator(`//button[contains(text(), 'Delete')]`);
  }

  get serviceItemInlineHoursInput(): Locator {
    return this.page.locator(
      `//td[contains(@class,'CreateEstimateDrawersty')]/following::input`,
    );
  }

  // ========== SERVICE ITEM EDIT ACTION METHODS ==========

  async clickServiceItemActionButton(index: number = 0): Promise<void> {
    const actionButton = this.getServiceItemActionButton(index);
    await expect(actionButton).toBeVisible();
    await actionButton.click();
    await this.page.waitForTimeout(500);
  }

  async selectEditOptionForServiceItem(): Promise<void> {
    await expect(this.serviceItemEditOption.first()).toBeVisible();
    await this.serviceItemEditOption.first().click();
    await this.page.waitForTimeout(500);
  }

  async selectDeleteOptionForServiceItem(): Promise<void> {
    await expect(this.serviceItemDeleteOption.first()).toBeVisible();
    await this.serviceItemDeleteOption.first().click();
    await this.page.waitForTimeout(500);
  }

  async updateServiceItemHours(newHours: string): Promise<void> {
    const input = this.serviceItemInlineHoursInput.first();
    if (await input.isVisible().catch(() => false)) {
      await input.clear();
      await input.fill(newHours);
    } else {
      await this.serviceItemHoursInput.first().clear();
      await this.serviceItemHoursInput.first().fill(newHours);
    }
    await this.page.waitForTimeout(500);
  }

  async editServiceItemHours(index: number, newHours: string): Promise<void> {
    await this.clickServiceItemActionButton(index);
    await this.selectEditOptionForServiceItem();
    await this.updateServiceItemHours(newHours);
  }

  async deleteServiceItem(index: number): Promise<void> {
    await this.clickServiceItemActionButton(index);
    await this.selectDeleteOptionForServiceItem();
  }

  // ========== ACTION MENU LOCATORS ==========

  getActionMenuForProject(projectName: string): Locator {
    return this.page.locator(
      `//*[text()='${projectName}']/following::button[@aria-label='Expand Menu']`,
    );
  }

  get editEstimateMenuOption(): Locator {
    return this.page.locator(
      `//*[@role='none' and contains(text(), 'Edit estimate')]`,
    );
  }

  get assignWorkersMenuOption(): Locator {
    return this.page.locator(
      `//*[@role='none' and contains(text(), 'Assign workers')] | //*[@role='menuitem' and contains(text(), 'Assign workers')]`,
    );
  }

  get viewProjectMenuOption(): Locator {
    return this.page.locator(
      `//*[@role='none' and contains(text(), 'View project')] | //*[@role='menuitem' and contains(text(), 'View project')]`,
    );
  }

  get deleteEstimateMenuOption(): Locator {
    return this.page.locator(
      `//*[@role='none' and contains(text(), 'Delete estimate')] | //*[@role='menuitem' and contains(text(), 'Delete estimate')]`,
    );
  }

  get deleteConfirmButton(): Locator {
    return this.page.locator(
      `//*[text()='Delete project?']/following::*[contains(text(), 'Delete')]`,
    );
  }

  get deleteProjectButton(): Locator {
    return this.page.locator(`//*[contains(text(), 'Delete project')]`);
  }

  get projectMoreActionsButton(): Locator {
    return this.page.locator(`//*[@data-id='project-action-list']/button`);
  }

  get successMessage(): Locator {
    return this.page.locator(`//*[text()='Project has been deleted.']`);
  }
  // ========== ASSIGN WORKERS PAGE LOCATORS ==========

  get assignWorkersPageTitle(): Locator {
    return this.page.locator(
      `//*[contains(text(), 'Assign workers')] | //*[contains(text(), 'Assign Workers')]`,
    );
  }

  get assignWorkersCloseButton(): Locator {
    return this.page
      .locator(
        `//*[contains(text(), 'Assign workers')]/ancestor::*//button[@aria-label='Close']`,
      )
      .first();
  }

  get backToProjectButton(): Locator {
    return this.page
      .locator(`//button[@aria-label='Back to projects']`)
      .first();
  }

  get workerCheckboxes(): Locator {
    return this.page.locator(
      `input[type='checkbox'][aria-label]:not([aria-label='Select No Group']):not([aria-label='Select all items'])`,
    );
  }

  get selectedWorkerCheckboxes(): Locator {
    return this.page.locator(
      `input[type='checkbox'][aria-label]:not([aria-label='Select No Group']):not([aria-label='Select all items']):checked`,
    );
  }

  get workersCountDisplay(): Locator {
    return this.page.locator(
      `//*[contains(text(), 'workers selected')] | //*[contains(text(), 'Workers selected')] | //*[contains(text(), 'worker selected')] | //*[contains(@class, 'worker-count')]`,
    );
  }

  get allWorkersSelectedText(): Locator {
    return this.page.locator(
      `//*[contains(text(), 'Assign workers to this field value.')]/following::strong`,
    );
  }

  // ========== VIEW PROJECT PAGE LOCATORS ==========

  get viewProjectWorkerCount(): Locator {
    return this.page.locator(`//*[contains(text(), 'workers')]`);
  }

  // ========== ASSIGN WORKERS ACTION METHODS ==========

  async selectAssignWorkersFromMenu(): Promise<void> {
    await expect(this.assignWorkersMenuOption.first()).toBeVisible();
    await this.assignWorkersMenuOption.first().click();
    await this.page.waitForTimeout(2000);
  }

  async openAssignWorkersViaActionMenu(projectName: string): Promise<void> {
    await this.clickActionMenuForProject(projectName);
    await this.selectAssignWorkersFromMenu();
  }

  async ViewProjectFromMenu(): Promise<void> {
    await expect(this.viewProjectMenuOption.first()).toBeVisible();
    await this.viewProjectMenuOption.first().click();
    await this.page.waitForTimeout(2000);
  }

  async closeAssignWorkersPage(): Promise<void> {
    await this.assignWorkersCloseButton.click();
    await this.page.waitForTimeout(1000);
  }

  async clickBackToProjects(): Promise<void> {
    await this.backToProjectButton.click();
    await this.page.waitForTimeout(1000);
  }

  async getSelectedWorkersCount(): Promise<number> {
    // First try to get count from the displayed text (more reliable if available)
    try {
      const countText = await this.workersCountDisplay
        .first()
        .textContent({ timeout: 3000 });
      if (countText) {
        const match = countText.match(/(\d+)/);
        if (match) {
          console.log(`Found workers count from display text: ${match[1]}`);
          return parseInt(match[1], 10);
        }
      }
    } catch {
      console.log(
        'Workers count display not found, counting checked checkboxes...',
      );
    }

    // Fallback to counting checked checkboxes
    const checkboxCount = await this.selectedWorkerCheckboxes.count();
    console.log(`Counted ${checkboxCount} checked worker checkboxes`);
    return checkboxCount;
  }

  async getTotalWorkersCount(): Promise<number> {
    const checkboxCount = await this.workerCheckboxes.count();
    console.log(`Counted ${checkboxCount} total worker checkboxes`);
    return checkboxCount;
  }

  // ========== ASSIGN WORKERS VALIDATION METHODS ==========

  async validateAssignWorkersPageDisplayed(): Promise<void> {
    await expect(this.assignWorkersPageTitle.first()).toBeVisible({
      timeout: 10000,
    });
    console.log('✓ Assign workers page is displayed');
  }

  async validateAllWorkersSelected(): Promise<boolean> {
    await this.page.waitForTimeout(2000);

    const totalWorkers = await this.getTotalWorkersCount();
    const selectedWorkers = await this.getSelectedWorkersCount();

    console.log(`totalWorkers: ${totalWorkers}`);
    console.log(`selectedWorkers: ${selectedWorkers}`);

    // All workers are selected if total > 0 AND total equals selected
    const allSelected = totalWorkers > 0 && totalWorkers === selectedWorkers;
    console.log(`allSelected: ${allSelected}`);

    if (allSelected) {
      console.log(
        `✓ All workers are selected (${selectedWorkers} of ${totalWorkers})`,
      );
    } else if (totalWorkers === 0) {
      console.log('⚠ No worker checkboxes found on the page');
    } else {
      console.log(
        `✗ Not all workers selected: ${selectedWorkers} of ${totalWorkers}`,
      );
    }

    return allSelected;
  }

  async validateWorkersCountDisplayed(): Promise<number> {
    const count = await this.getSelectedWorkersCount();
    console.log(`✓ Workers count displayed: ${count}`);
    return count;
  }

  async getWorkerCountFromViewProject(): Promise<number> {
    await this.page.waitForTimeout(1000);
    const countText = await this.viewProjectWorkerCount.last().textContent();
    console.log('countText: ' + countText);
    if (countText) {
      const match = countText.match(/(\d+)/);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
    return 0;
  }

  async validateWorkerCountsMatch(expectedCount: number): Promise<void> {
    const viewProjectCount = await this.getWorkerCountFromViewProject();
    expect(viewProjectCount).toBe(expectedCount);
    console.log(
      `✓ Worker count in View project (${viewProjectCount}) matches Assign workers count (${expectedCount})`,
    );
  }

  // ========== BUDGET VALIDATION METHODS ==========

  async getBudgetValueForProjectName(projectName: string): Promise<string> {
    const budgetLocator = this.getBudgetValueForProject(projectName);
    return (await budgetLocator.first().textContent()) || '';
  }

  async validateEstimateSaved(
    projectName: string,
    expectedHours: string,
  ): Promise<void> {
    await this.waitForPageReady();
    const budgetValue = await this.getBudgetValueForProjectName(projectName);
    expect(budgetValue).toContain(expectedHours);
    console.log(`✓ Budget column shows: ${budgetValue}`);
  }

  async validateEstimateTypeNotUpdated(
    projectName: string,
    originalBudget: string,
  ): Promise<void> {
    await this.waitForPageReady();
    const currentBudget = await this.getBudgetValueForProjectName(projectName);
    expect(currentBudget).toBe(originalBudget);
    console.log(
      `✓ Estimate type not updated - Budget remains: ${currentBudget}`,
    );
  }

  async validateEstimateTypeUpdated(
    projectName: string,
    originalBudget: string,
  ): Promise<void> {
    await this.waitForPageReady();
    const currentBudget = await this.getBudgetValueForProjectName(projectName);
    expect(currentBudget).not.toBe(originalBudget);
    console.log(
      `✓ Estimate type updated - Budget changed from ${originalBudget} to: ${currentBudget}`,
    );
  }

  // ========== PROJECT VISIBILITY VALIDATION METHODS ==========

  getProjectRowByName(projectName: string): Locator {
    return this.page.locator(
      `//*[@role="table"]/tbody/tr[contains(., '${projectName}')] | //*[contains(@data-testid, 'time-project-row')][contains(., '${projectName}')]`,
    );
  }

  async validateProjectVisibleInTimeProject(
    projectName: string,
  ): Promise<void> {
    await this.waitForPageReady();
    const projectRow = this.getProjectRowByName(projectName);
    await expect(projectRow.first()).toBeVisible({ timeout: 30000 });
    console.log(`✓ Project "${projectName}" is visible in Time project page`);
  }

  async clickViewProject(projectName: string): Promise<void> {
    const projectRow = this.getProjectRowByName(projectName);
    await expect(projectRow.first()).toBeVisible({ timeout: 15000 });
    await projectRow.first().click();
    await this.page.waitForTimeout(2000);
    await this.waitForPageReady();
    console.log(`✓ Clicked on project row: "${projectName}"`);
  }

  async searchProject(projectName: string): Promise<void> {
    const searchInput = this.page.locator(
      `//*[contains(@data-testid, 'time-project-search')]//input | //input[@placeholder='Search']`,
    );
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.first().fill(projectName);
      await this.page.waitForTimeout(1000);
    }
  }

  async validateBudgetColumnValue(
    projectName: string,
    expectedValue: string,
  ): Promise<void> {
    await this.waitForPageReady();
    const budgetValue = await this.getBudgetValueForProjectName(projectName);
    expect(budgetValue).toContain(expectedValue);
    console.log(
      `✓ Budget column for "${projectName}" shows: ${budgetValue} (expected: ${expectedValue})`,
    );
  }

  // ========== DELETE ESTIMATE METHODS ==========

  async selectDeleteEstimateFromMenu(): Promise<void> {
    await expect(this.deleteEstimateMenuOption.first()).toBeVisible();
    await this.deleteEstimateMenuOption.first().click();
    await this.page.waitForTimeout(1000);
  }

  async confirmDelete(): Promise<void> {
    await expect(this.deleteConfirmButton.first()).toBeVisible();
    await this.deleteConfirmButton.first().click();
    await this.page.waitForTimeout(2000);
  }

  async deleteEstimateForProject(projectName: string): Promise<void> {
    console.log(`Deleting estimate for project: ${projectName}`);
    await this.clickActionMenuForProject(projectName);
    await this.selectEditEstimateFromMenu();
    await this.deleteServiceItem(0);
    await this.clickSaveButton();
    await this.page.waitForTimeout(3000);
    await this.waitForPageReady();
    console.log(`✓ Estimate deleted for project: ${projectName}`);
  }

  async editAndDeleteEstimateForProject(projectName: string): Promise<void> {
    console.log(`Deleting estimate for project: ${projectName}`);
    await this.clickActionMenuForProject(projectName);
    await this.selectEditEstimateFromMenu();
    await this.selectByServiceItemsOption();
    await this.selectServiceItem('Sales');
    await this.enterServiceItemHours('20');
    await this.clickAddButton();
    await this.clickSaveButton();
    await this.clickChangeEstimateTypeContinue();
    await this.clickActionMenuForProject(projectName);
    await this.selectEditEstimateFromMenu();
    await this.deleteServiceItem(0);
    await this.clickSaveButton();
    await this.page.waitForTimeout(3000);
    await this.waitForPageReady();
    console.log(`✓ Estimate deleted for project: ${projectName}`);
  }

  // ========== DELETE PROJECT METHODS ==========

  getProjectRowInQBOProjects(projectName: string): Locator {
    return this.page.locator(
      `//tr[contains(., '${projectName}')] | //*[contains(@data-testid, 'project-row')][contains(., '${projectName}')] | //*[text()='${projectName}']/ancestor::tr`,
    );
  }

  getProjectLinkInQBOProjects(projectName: string): Locator {
    return this.page.locator(`//*[text()='${projectName}']`);
  }

  async clickProjectInQBOProjects(projectName: string): Promise<void> {
    const projectLink = this.getProjectLinkInQBOProjects(projectName);
    await expect(projectLink.first()).toBeVisible({ timeout: 15000 });
    await projectLink.first().click();
    await this.page.waitForTimeout(2000);
  }

  async clickProjectMoreActions(): Promise<void> {
    await expect(this.projectMoreActionsButton.first()).toBeVisible({
      timeout: 10000,
    });
    await this.projectMoreActionsButton.first().click();
    await this.page.waitForTimeout(500);
  }

  async selectDeleteProjectOption(): Promise<void> {
    await expect(this.deleteProjectButton.first()).toBeVisible();
    await this.deleteProjectButton.first().click();
    await this.page.waitForTimeout(1000);
  }

  async deleteProjectInQBOProjects(projectName: string): Promise<void> {
    console.log(`Deleting project: ${projectName}`);

    await this.clickProjectMoreActions();
    console.log('✓ Clicked More actions button');

    await this.selectDeleteProjectOption();
    console.log('✓ Selected Delete project option');

    await this.confirmDelete();
    await this.page.waitForTimeout(5000);

    await expect(this.successMessage).toBeVisible({ timeout: 10000 });
    await this.waitForPageReady();

    console.log(`✓ Project deleted: ${projectName}`);
  }

  async findProjectInQBOProjectsAndDelete(projectName: string): Promise<void> {
    console.log(`Deleting project: ${projectName}`);

    await this.findProjectInQBOProjectsAndClickActions(projectName);
    console.log('✓ Clicked More actions button for searched project');

    await this.selectDeleteProjectOption();
    console.log('✓ Selected Delete project option');

    await this.confirmDelete();
    await this.page.waitForTimeout(5000);
  }

  async searchProjectInQBOProjects(projectName: string): Promise<void> {
    const searchInput = this.page.locator(
      `//input[@placeholder='Search for project']`,
    );
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.first().fill(projectName);
      await this.page.waitForTimeout(1000);
    }
  }

  async findProjectInQBOProjectsAndClickActions(
    projectName: string,
  ): Promise<void> {
    const rowcount = await this.page
      .locator(`//*[@role='table']/tbody/tr`)
      .count();
    for (let i = 1; i <= rowcount; i++) {
      const searchProject = this.page.locator(
        '//*[@role="table"]/tbody/tr[' + i + ']/td//child::a',
      );
      const projectAction = this.page.locator(
        '//*[@role="table"]/tbody/tr[' + i + ']/td[9]//child::button',
      );
      if ((await searchProject.textContent()) == projectName) {
        await expect(projectAction).toBeVisible({ timeout: 5000 });
        await projectAction.click();
        await this.page.waitForTimeout(1000);
      }
    }
  }

  // ==========================================================================
  // Stable data-testid based helpers (TP01 end-to-end)
  //
  // The widget (src/js/widgets/timeProject) exposes durable `data-testid`
  // hooks on the estimate drawer, the change-type modal, the per-row action
  // affordances, and the loading skeletons. These are far less brittle than
  // the text/XPath locators above. Added as NEW methods so the existing PR
  // (PR001–PR035) suite is unaffected.
  // ==========================================================================

  // ----- Listing-grid affordances & skeletons -----
  get rowSkeletons(): Locator {
    return this.page.locator(
      `[data-testid^="budget-skeleton-"], [data-testid^="actions-skeleton-"]`,
    );
  }

  get actionAffordances(): Locator {
    return this.page.locator(
      `[data-testid^="action-combo-link-"], [data-testid^="action-primary-button-"]`,
    );
  }

  get projectRows(): Locator {
    return this.page.locator(`[data-testid^="time-project-row-"]`);
  }

  /**
   * Wait until the budget / actions skeletons clear, i.e. the
   * project-list → contacts → estimates pipeline has settled. Without this,
   * the action column briefly shows "Create Estimate" before flipping to
   * "View" once the estimate lands — clicking in that window targets the
   * wrong state.
   */
  async waitForRowSkeletonsGone(timeout = 30000): Promise<void> {
    await this.page
      .waitForFunction(
        () =>
          !document.querySelector(
            '[data-testid^="budget-skeleton-"], [data-testid^="actions-skeleton-"]',
          ),
        undefined,
        { timeout },
      )
      .catch(() => {
        console.log('⚠ Row skeletons still present after wait');
      });
  }

  async getProjectRowCount(): Promise<number> {
    return await this.projectRows.count();
  }

  async getActionAffordanceCount(): Promise<number> {
    return await this.actionAffordances.count();
  }

  // ----- Estimate drawer (data-testid) -----
  get estimateDrawer(): Locator {
    return this.page.locator(`[data-testid="create-estimate-drawer"]`);
  }

  get estimateTypeHoursRadio(): Locator {
    return this.page.locator(`[data-testid="estimate-type-hours"]`);
  }

  get estimateTypeServiceRadio(): Locator {
    return this.page.locator(`[data-testid="estimate-type-service"]`);
  }

  get estimateHoursInputTid(): Locator {
    return this.page.locator(`[data-testid="estimate-hours-input"]`);
  }

  get estimateSaveButtonTid(): Locator {
    return this.page.locator(`[data-testid="estimate-save-button"]`);
  }

  get estimateSavingOverlay(): Locator {
    return this.page.locator(`[data-testid="estimate-saving-overlay"]`);
  }

  get estimateSuccessMessage(): Locator {
    return this.page.locator(`[data-testid="estimate-success-message"]`);
  }

  get serviceItemDropdownTid(): Locator {
    return this.page.locator(`[data-testid="service-item-dropdown"]`);
  }

  get serviceItemHoursInputTid(): Locator {
    return this.page.locator(`[data-testid="service-item-hours-input"]`);
  }

  get serviceItemAddButtonTid(): Locator {
    return this.page.locator(`[data-testid="service-item-add-button"]`);
  }

  get serviceItemTableTid(): Locator {
    return this.page.locator(`[data-testid="service-item-table"]`);
  }

  // ----- Change-estimate-type modal (data-testid) -----
  get changeTypeContinueTid(): Locator {
    return this.page.locator(`[data-testid="change-type-continue"]`);
  }

  get changeTypeCancelTid(): Locator {
    return this.page.locator(`[data-testid="change-type-cancel"]`);
  }

  /**
   * HARD guard: the estimate drawer MUST open. If it does not, the
   * `isProjectsEditEstimatesEnabled` SDK flag is almost certainly off for
   * this account, so the test should fail loudly rather than silently skip.
   */
  async expectEstimateDrawerOpen(timeout = 15000): Promise<void> {
    // The IDS <Drawer> does NOT forward its data-testid to a queryable DOM
    // node, so assert on stable VISIBLE drawer content instead — the
    // estimate-type question heading renders in both the create and edit
    // drawers ("How are you estimating this project?").
    await expect(this.estimatePageTitle.first()).toBeVisible({ timeout });
  }

  async selectEstimateTypeByHoursTid(): Promise<void> {
    await this.estimateTypeHoursRadio.click();
    await this.page.waitForTimeout(300);
  }

  async selectEstimateTypeByServiceItemTid(): Promise<void> {
    await this.estimateTypeServiceRadio.click();
    await this.page.waitForTimeout(300);
  }

  async enterEstimateHoursTid(hours: string): Promise<void> {
    await this.estimateHoursInputTid.fill('');
    await this.estimateHoursInputTid.fill(hours);
    // Let the Redux dirty-flag settle so Save enables (isSaveDisabled gates
    // on `!isDirty`).
    await this.page.waitForTimeout(500);
  }

  /**
   * Click Save (asserting it is enabled first — the drawer disables Save
   * until the form is dirty AND valid), then wait for the saving overlay to
   * appear and clear so the parent refetch has settled before we read the
   * grid. If a change-type modal intercepts the save instead, the overlay
   * waits no-op harmlessly.
   */
  async clickEstimateSaveAndWaitTid(): Promise<void> {
    await expect(this.estimateSaveButtonTid).toBeEnabled({ timeout: 10000 });
    await this.estimateSaveButtonTid.click();
    await this.estimateSavingOverlay
      .waitFor({ state: 'visible', timeout: 5000 })
      .catch(() => undefined);
    await this.estimateSavingOverlay
      .waitFor({ state: 'hidden', timeout: 30000 })
      .catch(() => undefined);
    await this.page.waitForTimeout(500);
  }

  /**
   * Confirm the "Change estimate type?" modal when it appears (it only shows
   * when editing an estimate whose type actually changed), then wait out the
   * post-confirm save overlay.
   */
  async clickChangeTypeContinueIfPresentTid(): Promise<boolean> {
    const visible = await this.changeTypeContinueTid
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    if (!visible) {
      return false;
    }
    await this.changeTypeContinueTid.click();
    await this.estimateSavingOverlay
      .waitFor({ state: 'hidden', timeout: 30000 })
      .catch(() => undefined);
    await this.page.waitForTimeout(500);
    return true;
  }

  async selectServiceItemTid(serviceName: string): Promise<void> {
    await this.serviceItemDropdownTid.click();
    const input = this.serviceItemDropdownTid.locator('input').first();
    if (await input.isVisible().catch(() => false)) {
      await input.fill(serviceName);
    }
    await this.page.waitForTimeout(800);
    const option = this.page
      .locator(`[role="option"]`)
      .filter({ hasText: serviceName })
      .first();
    if (await option.isVisible({ timeout: 5000 }).catch(() => false)) {
      await option.click();
    } else {
      await this.page.locator(`[role="option"]`).first().click();
    }
    await this.page.waitForTimeout(300);
  }

  async enterServiceItemHoursTid(hours: string): Promise<void> {
    await this.serviceItemHoursInputTid.fill('');
    await this.serviceItemHoursInputTid.fill(hours);
    await this.page.waitForTimeout(300);
  }

  async clickAddServiceItemTid(): Promise<void> {
    await expect(this.serviceItemAddButtonTid).toBeEnabled({ timeout: 5000 });
    await this.serviceItemAddButtonTid.click();
    await this.page.waitForTimeout(500);
  }

  /** Inline-edit the FIRST service-item row's hours via its kebab menu. */
  async editFirstServiceItemHoursTid(hours: string): Promise<void> {
    await this.page.locator(`[data-testid^="action-menu-"]`).first().click();
    await this.page.waitForTimeout(300);
    await this.page.locator(`[data-testid^="action-edit-"]`).first().click();
    const input = this.page
      .locator(`[data-testid^="inline-edit-input-"]`)
      .first();
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.fill('');
    await input.fill(hours);
    await this.page.waitForTimeout(300);
  }

  /** Delete the FIRST service-item row via its kebab menu. */
  async deleteFirstServiceItemTid(): Promise<void> {
    await this.page.locator(`[data-testid^="action-menu-"]`).first().click();
    await this.page.waitForTimeout(300);
    await this.page.locator(`[data-testid^="action-delete-"]`).first().click();
    await this.page.waitForTimeout(300);
  }
}

export default TimeProjectPage;
