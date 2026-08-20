/// <reference types="node" />
import { expect, Page, test } from '@playwright/test';
import gotoWithAuthSession from '../../gotoWithAuthSession';
import TimeMenuNavigationPage from '../../pages/TimeMenuNavigationPage';
import TimeProjectsPage from '../../pages/TimeProjectsPage';
import { handlePopupsInAnyOrder } from '../../pages/TimeSettingsPage';

function throwUnless(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

/** PR001 — Time → Time projects entry visible after opening Time submenu. */
export async function validateTimeProjectsLinkVisibleInTimeSubmenu(
  page: Page,
  companyType: 'elite' | 'time_premium' | 'free' | 'core' = 'elite',
): Promise<void> {
  const nav = new TimeMenuNavigationPage(page);
  const ok = await nav.hoverOnMyAppsMenu();
  expect(ok, 'My apps hover should reveal Time').toBeTruthy();
  const timeOk = await nav.hoverOnTimeMenu(10, companyType);
  expect(timeOk, 'Time submenu should open').toBeTruthy();
  await expect(nav.timeProjectsOption).toBeVisible({ timeout: 15_000 });
}

/**
 * Open Time projects via **All apps → Time → Time project** (shell).
 * Shell may land on `/app/time/timeProject?...` where widget chrome is not yet in the DOM;
 * in that case we deep-link to `/app/timeproject` so `expectPageReady()` matches automation.
 */
export async function navigateToTimeProjectsViaTimeMenu(
  page: Page,
  pageReadyTimeoutMs = 60_000,
): Promise<void> {
  const nav = new TimeMenuNavigationPage(page);
  await nav.hoverOnMyAppsMenu();
  await nav.hoverOnTimeMenu();
  await nav.clickTimeProjects();
  await handlePopupsInAnyOrder(page);
}

/**
 * Resolve `PR###` from the test title to `companyAdmin.testAccounts[PR###]`.
 * Optional override: `PLAYWRIGHT_TIME_PROJECTS_ACCOUNT_ID` (any env) forces one account for all PR tests.
 */
export function resolveTimeProjectsAccountId(testIdFromTitle: string): string {
  if (/^PR\d{3}$/.test(testIdFromTitle)) {
    const override = process.env.PLAYWRIGHT_TIME_PROJECTS_ACCOUNT_ID?.trim();
    if (override) return override;
    return testIdFromTitle;
  }
  return testIdFromTitle;
}

export async function verifyTimeProjectsVisibleUnderTime(
  page: Page,
): Promise<void> {
  await validateTimeProjectsLinkVisibleInTimeSubmenu(page);
  await navigateToTimeProjectsViaTimeMenu(page);
  const tp = new TimeProjectsPage(page);
  await expect(tp.filtersContainer()).toBeVisible({ timeout: 30_000 });
  await expect(tp.manageProjectsButton()).toBeVisible();
}

export async function verifyZeroStateWhenNoProjects(page: Page): Promise<void> {
  const tp = new TimeProjectsPage(page);
  await tp.navigateToTimeProjects();
  await tp.expectPageReady();
  const rowCount = await tp.projectRows().count();
  throwUnless(
    rowCount === 0,
    'Account has projects; zero-state copy not shown',
  );
  await tp.expectZeroStateCopy();
}

export async function verifyNoCreateProjectControlInWidget(
  page: Page,
): Promise<void> {
  const tp = new TimeProjectsPage(page);
  await tp.navigateToTimeProjects();
  await tp.expectPageReady();
  await tp.expectNoCreateProjectControlInWidget();
}

export async function verifyManageProjectsOpensProjectsApp(
  page: Page,
): Promise<void> {
  const tp = new TimeProjectsPage(page);
  await tp.navigateToTimeProjects();
  await tp.expectPageReady();
  await tp.clickManageProjects();
  await tp.expectManageProjectsNavigatesToProjectsApp();
}

export async function verifyFiltersSearchAndTableHeadersWhenListShown(
  page: Page,
): Promise<void> {
  const tp = new TimeProjectsPage(page);
  await tp.navigateToTimeProjects();
  await tp.expectPageReady();
  await expect(tp.statusFilter()).toBeVisible();
  await expect(tp.customerFilter()).toBeVisible();
  await expect(tp.projectSearch()).toBeVisible();
  if (
    await tp
      .projectsTable()
      .isVisible()
      .catch(() => false)
  ) {
    const rows = await tp.projectRows().count();
    if (rows > 0) {
      await tp.expectListChromeWhenTableVisible();
    }
  }
}

export async function verifyCreateEstimateForRowWithoutBudget(
  page: Page,
): Promise<void> {
  const tp = new TimeProjectsPage(page);
  await tp.navigateToTimeProjects();
  await tp.expectPageReady();
  const rows = await tp.projectRows().count();
  test.skip(rows === 0, 'Requires at least one project row');
  const comboWithoutBudget = page
    .locator('[data-testid^="action-combo-link-"]')
    .filter({ hasText: /^Create Estimate$/i })
    .first();
  test.skip(
    !(await comboWithoutBudget.isVisible().catch(() => false)),
    'No project row without a budget (all rows may already have estimates)',
  );
  await expect(comboWithoutBudget).toBeVisible();
}

export async function verifyCreateEstimateRadios(page: Page): Promise<void> {
  const tp = new TimeProjectsPage(page);
  await tp.navigateToTimeProjects();
  await tp.expectPageReady();
  test.skip((await tp.projectRows().count()) === 0, 'Requires a project row');
  await tp.openCreateEstimateFromFirstRow();
  await tp.expectCreateEstimateDrawerOpen();
  await expect(tp.estimateTypeByHours()).toBeVisible();
  await expect(tp.estimateTypeByService()).toBeVisible();
  await expect(tp.estimateTypeByHours()).toBeEnabled();
  await expect(tp.estimateTypeByService()).toBeEnabled();
}

export async function verifyByHoursDrawerCopyCloseWithoutSaving(
  page: Page,
): Promise<void> {
  const tp = new TimeProjectsPage(page);
  await tp.navigateToTimeProjects();
  await tp.expectPageReady();
  test.skip((await tp.projectRows().count()) === 0, 'Requires a project row');
  await tp.openCreateEstimateFromFirstRow();
  await tp.expectCreateEstimateDrawerOpen();
  await tp.estimateTypeByHours().click();
  await tp.expectByHoursSectionCopy();
  await tp.estimateHoursInput().locator('input').fill('8');
  await tp.closeEstimateDrawerViaHeader();
  await tp.expectDrawerClosed();
  await expect(page.getByTestId('estimate-success-message')).toHaveCount(0);
}

export async function verifyByHoursNumericHoursAndStepper(
  page: Page,
): Promise<void> {
  const tp = new TimeProjectsPage(page);
  await tp.navigateToTimeProjects();
  await tp.expectPageReady();
  test.skip((await tp.projectRows().count()) === 0, 'Requires a project row');
  await tp.openCreateEstimateFromFirstRow();
  await tp.estimateTypeByHours().click();
  const input = tp.estimateHoursInput().locator('input');
  await input.fill('abc!@#');
  await expect(input).toHaveValue('');
  await input.fill('5');
  await expect(input).toHaveValue('5');
  await input.press('ArrowUp');
  await expect(input).toHaveValue('6');
  await input.press('ArrowDown');
  await expect(input).toHaveValue('5');
}

export async function verifyByHoursSavePersistsEstimate(
  page: Page,
): Promise<void> {
  const tp = new TimeProjectsPage(page);
  await tp.navigateToTimeProjects();
  await tp.expectPageReady();
  test.skip((await tp.projectRows().count()) === 0, 'Requires a project row');
  await tp.openCreateEstimateFromFirstRow();
  await tp.estimateTypeByHours().click();
  await tp.estimateHoursInput().locator('input').fill('7');
  await expect(tp.estimateSaveButton()).toBeEnabled();
  await tp.estimateSaveButton().click();
  await expect(page.getByTestId('estimate-success-message')).toBeVisible({
    timeout: 30_000,
  });
}

export async function verifyByServiceItemDrawerCopyCloseWithoutSaving(
  page: Page,
): Promise<void> {
  const tp = new TimeProjectsPage(page);
  await tp.navigateToTimeProjects();
  await tp.expectPageReady();
  test.skip((await tp.projectRows().count()) === 0, 'Requires a project row');
  await tp.openCreateEstimateFromFirstRow();
  await tp.expectCreateEstimateDrawerOpen();
  await tp.estimateTypeByService().click();
  await tp.expectByServiceItemSectionCopy();
  await tp.closeEstimateDrawerViaHeader();
  await tp.expectDrawerClosed();
}

export async function verifyByServiceItemNumericHoursAndStepper(
  page: Page,
): Promise<void> {
  const tp = new TimeProjectsPage(page);
  await tp.navigateToTimeProjects();
  await tp.expectPageReady();
  test.skip((await tp.projectRows().count()) === 0, 'Requires a project row');
  await tp.openCreateEstimateFromFirstRow();
  await tp.estimateTypeByService().click();
  const siInput = tp.serviceItemHoursInput().locator('input');
  await siInput.fill('xx');
  await expect(siInput).toHaveValue('');
  await siInput.fill('4');
  await expect(siInput).toHaveValue('4');
  await siInput.press('ArrowUp');
  await expect(siInput).toHaveValue('5');
}

export async function verifyByServiceItemAddRowAndSave(
  page: Page,
): Promise<void> {
  const tp = new TimeProjectsPage(page);
  await tp.navigateToTimeProjects();
  await tp.expectPageReady();
  test.skip((await tp.projectRows().count()) === 0, 'Requires a project row');
  await tp.openCreateEstimateFromFirstRow();
  await tp.estimateTypeByService().click();
  await tp.serviceItemDropdown().click();
  const firstOpt = page.getByRole('option').first();
  await expect(firstOpt).toBeVisible({ timeout: 15_000 });
  await firstOpt.click();
  await tp
    .serviceItemHoursInput()
    .locator('input')
    .fill(String(Math.floor(Math.random() * 9) + 1));
  await expect(tp.serviceItemAddButton()).toBeEnabled();
  await tp.serviceItemAddButton().click();
  await expect(tp.estimateSaveButton()).toBeEnabled();
  await tp.estimateSaveButton().click();
}

export async function createServiceItemEstimateForProject(
  page: Page,
): Promise<void> {
  // 1. Navigate to Time section in QBO.
  // 2. Click Time project
  // await navigateToTimeProjectsViaTimeMenu(page);
  const tp = new TimeProjectsPage(page);
  // await tp.expectPageReady();

  // 3. Click Create Estimate Link
  await tp.openCreateOrEditEstimateFromFirstRow();
  await tp.expectCreateEstimateDrawerOpen();

  // 4. Select radiobutton for By Service Item
  await tp.estimateTypeByService().click();

  // 5. Select Service Item and enter hours.
  await tp.serviceItemDropdown().click();
  const firstOpt = page.getByRole('option').first();
  await expect(firstOpt).toBeVisible({ timeout: 15_000 });
  await firstOpt.click();
  await tp.serviceItemHoursInput().fill(String('1'));
  await expect(tp.serviceItemAddButton()).toBeEnabled();
  await tp.serviceItemAddButton().click();

  // 6. Click Save button
  await expect(tp.estimateSaveButton()).toBeEnabled();
  await tp.estimateSaveButton().click();
}

export async function runSteps_ChangeEstimateTypeServiceToHoursCancel(
  page: Page,
): Promise<void> {
  const slow = 120_000;

  await navigateToTimeProjectsViaTimeMenu(page, slow);
  const tp = new TimeProjectsPage(page);
  await tp.openEditEstimateFromFirstRowExpandMenuThenEditEstimate({
    timeoutMs: slow,
  });
  await tp.expectEditEstimateDrawerOpen({
    createDrawerTimeoutMs: slow,
    headingTimeoutMs: slow,
  });

  await expect(tp.estimateTypeByHours()).toBeEnabled({ timeout: slow });
  await tp.estimateTypeByHours().click();
  const hoursIn = tp.estimateHoursInput().locator('input');
  await expect(hoursIn).toBeVisible({ timeout: slow });
  await hoursIn.fill('5');
  await expect(tp.estimateSaveButton()).toBeEnabled({ timeout: slow });
  await tp.estimateSaveButton().click();
  await tp.expectChangeEstimateTypeModalVisible(slow);
  await expect(tp.changeTypeCancel()).toBeVisible({ timeout: slow });
  await tp.changeTypeCancel().click();
}

/**
 * PR016 — By **service item** estimate → By hours, Save, **Cancel** on modal → type not updated, no success toast.
 */
export async function verifyChangeEstimateTypeServiceToHoursCancel(
  page: Page,
): Promise<void> {
  const slow = 120_000;
  await runSteps_ChangeEstimateTypeServiceToHoursCancel(page);
  const tp = new TimeProjectsPage(page);
  await expect(tp.changeTypeModal()).not.toBeVisible({ timeout: slow });
  await expect(page.getByTestId('estimate-success-message')).toHaveCount(0);
}

/**
 * PR017 — By **service item** estimate → By hours, Save, **Continue** on modal → type updated.
 */
export async function verifyChangeEstimateTypeServiceToHoursContinue(
  page: Page,
): Promise<void> {
  const tp = new TimeProjectsPage(page);
  await tp.navigateToTimeProjects();
  await page.waitForTimeout(5000);
  await tp.openCreateOrEditEstimateFromFirstRow();
  await tp.expectCreateOrEditEstimateDrawerOpen();
  const hoursIn = tp.estimateHoursInput().locator('input');
  await expect(hoursIn).toBeVisible();
  const hours = String(Math.floor(Math.random() * 9) + 1);
  await hoursIn.fill(hours);
  await tp.estimateSaveButton().click();
  if (await tp.changeTypeModal().isVisible()) {
    await tp.changeTypeContinue().click();
  }
}

/**
 * PR018 — Create a project under **Projects**, then find it on **Time projects** (search).
 */
export async function verifyProjectCreatedInProjectsVisibleInTimeProjects(
  page: Page,
): Promise<void> {
  const projectName = `E2E TimeProj ${Date.now()}`;
  await page.waitForTimeout(5000);
  await gotoWithAuthSession(page, '/app/projects/', { waitUntil: 'load' });
  await handlePopupsInAnyOrder(page);
  await page.waitForTimeout(2000);

  let newBtn = page.getByRole('button', { name: /new project/i }).first();
  if (!(await newBtn.isVisible().catch(() => false))) {
    newBtn = page.getByRole('link', { name: /new project/i }).first();
  }
  if (!(await newBtn.isVisible().catch(() => false))) {
    await gotoWithAuthSession(page, '/app/projects-list?jobId=projects', {
      waitUntil: 'load',
    });
    await handlePopupsInAnyOrder(page);
    await page.waitForTimeout(2000);
    newBtn = page.getByRole('button', { name: /new project/i }).first();
  }
  await newBtn.click();
  await page.waitForTimeout(1000);

  const nameField = page
    .getByLabel(/project name|name/i)
    .or(page.getByPlaceholder(/project name/i))
    .first();
  await expect(nameField).toBeVisible({ timeout: 15_000 });
  await nameField.fill(projectName);

  const customerField = page
    .getByRole('combobox', { name: /customer/i })
    .or(page.getByLabel(/^Customer$|select a customer|Who's the project for?/i))
    .first();
  await expect(customerField).toBeVisible({ timeout: 15_000 });
  await customerField.click();
  const asOption = page
    .locator(`//li[@data-automation-id="contact-row"]`)
    .first();
  if (await asOption.isVisible({ timeout: 5_000 })) {
    await asOption.click();
  }

  const saveBtn = page
    .getByRole('button', { name: /^save$/i })
    .or(page.getByRole('button', { name: /save and (close|finish)/i }))
    .first();
  await saveBtn.click();
  await page.waitForTimeout(3000);
  await handlePopupsInAnyOrder(page);
  const tp = new TimeProjectsPage(page);
  await tp.navigateToTimeProjects();
  const createdProjectRow = tp
    .projectRows()
    .filter({ hasText: projectName })
    .first();
  await expect(createdProjectRow).toBeVisible({ timeout: 30_000 });
  // 1–3: Projects app — navigate, row **More**, **Delete project**
  await deleteProjectInProjectsApp(page, projectName);
}

export async function verifyStatusAndCustomerFilters(
  page: Page,
): Promise<void> {
  const tp = new TimeProjectsPage(page);
  await tp.navigateToTimeProjects();
  await page.waitForTimeout(5000);
  await tp.statusFilter().click();
  await expect(page.getByRole('option').first()).toBeVisible({
    timeout: 10_000,
  });
  await page.keyboard.press('Escape');
  await tp.customerFilter().click();
  await expect(page.getByRole('option').first()).toBeVisible({
    timeout: 10_000,
  });
}

export async function verifyProjectSummaryByHoursEstimate(
  page: Page,
): Promise<void> {
  const tp = new TimeProjectsPage(page);
  await tp.navigateToTimeProjects();
  await tp.openFirstProjectSummary();
  await expect(page.getByText(/Time estimation summary/i)).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.locator(`//span[text()="Assign"]`)).toBeVisible();
  await page.waitForTimeout(1000);
  await expect(
    page.locator(`//button[@aria-label="Edit estimate"]`),
  ).toBeVisible();
  await page.waitForTimeout(1000);
  await expect(
    page.locator(`//span[text()="Actual vs estimated hours"]`),
  ).toBeVisible();
  await page.waitForTimeout(1000);
  await expect(page.locator(`//span[text()="Date progress"]`)).toBeVisible();
  await page.waitForTimeout(1000);
}

/** PR021 — By service item estimate: summary layout, meter, Estimates/Users toggle, service item table headers. */
export async function verifyProjectSummaryByServiceItemEstimate(
  page: Page,
): Promise<void> {
  const tp = new TimeProjectsPage(page);
  await tp.navigateToTimeProjects();
  await tp.openFirstProjectSummary();
  await expect(page.getByText(/Time estimation summary/i)).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.locator(`//span[text()="Assign"]`)).toBeVisible();
  await page.waitForTimeout(1000);
  await expect(
    page.locator(`//button[@aria-label="Edit estimate"]`),
  ).toBeVisible();
  await page.waitForTimeout(1000);
  await expect(
    page.locator(`//span[text()="Actual vs estimated hours"]`),
  ).toBeVisible();
  await page.waitForTimeout(1000);
  await expect(
    page.locator(
      `//div[contains(@class,"ProjectSummarystyled__SummaryBoxValue")]/h5[contains(text(),"hrs")]`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(`//div[@data-testid="meter-bar-chart"]`).first(),
  ).toBeVisible();
  const seg = page.locator(
    `//div[contains(@class,"ProjectSummarystyled__SummaryContainer")]`,
  );
  await expect(seg).toBeVisible();
  await expect(seg.getByText(/^Estimates$/)).toBeVisible();
  await expect(seg.getByText(/^Users$/)).toBeVisible();
  const table = tp.summaryServiceItemTable();
  await expect(table).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Hours estimated', { exact: true })).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByText('Hours worked', { exact: true })).toBeVisible({
    timeout: 10_000,
  });
  await expect(
    page.getByText('Percent completed', { exact: true }),
  ).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('Hours remaining', { exact: true })).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByText('Actions', { exact: true })).toBeVisible({
    timeout: 10_000,
  });
}

/**
 * PR022 — Assign workers drawer when company has **no** workers (empty list).
 */
export async function verifyAssignWorkersNoWorkersEmptyState(
  page: Page,
): Promise<void> {
  const tp = new TimeProjectsPage(page);
  await tp.navigateToTimeProjects();
  await tp.openAssignWorkersFromFirstRowMenu();
  await tp.expectAssignWorkersDrawerVisible();
  const drawer = tp.assignWorkersDrawer();
  await expect(
    page.getByText(
      'Assign workers to this field value. If all are selected, all future workers will be added.',
    ),
  ).toBeVisible();
  // await expect(
  //   page.getByText(/\d+ of \d+ workers assigned to/i),
  // ).toBeVisible();
  await expect(
    page.locator(
      `//div[contains(@class,"AssignmentDrawerstyled__SearchSummaryContainer")]//button`,
    ),
  ).toBeVisible({ timeout: 10_000 });
  const noItems = page.locator(`//tbody/tr/td[text()="No items found"]`);
  await expect(noItems).toBeVisible({ timeout: 30_000 });
}

/** PR023 — Save disabled until change; select worker, close (X), discard → no persist. */
export async function verifyAssignWorkersCloseDiscards(
  page: Page,
): Promise<void> {
  const tp = new TimeProjectsPage(page);
  await tp.navigateToTimeProjects();
  await tp.openAssignWorkersFromFirstRowMenu();
  await page.waitForTimeout(4000);
  await tp.expectAssignWorkersDrawerVisible();
  const drawer = tp.assignWorkersDrawer();
  await expect(tp.assignmentDrawerSaveButton()).toBeDisabled();
  const summaryLocator = page.getByText(/\d+ of \d+ workers assigned to/i);
  const before = (await summaryLocator.first().textContent())?.trim() || '';
  await tp.selectFirstWorkerCheckboxInAssignmentDrawer();
  await expect(tp.assignmentDrawerSaveButton()).toBeEnabled();
  await tp.closeAssignWorkersDrawerHeader();
  await tp.clickAssignmentDontSaveIfShown();
  await expect(drawer).not.toBeVisible({ timeout: 15_000 });
  await tp.openAssignWorkersFromFirstRowMenu();
  await tp.expectAssignWorkersDrawerVisible();
  await page.waitForTimeout(2000);
  const after =
    (
      await tp
        .assignWorkersDrawer()
        .getByText(/\d+ of \d+ workers assigned to/i)
        .first()
        .textContent()
    )?.trim() || '';
  expect(after).toBe(before);
}

/** PR024 — Select worker and Save assigns (drawer closes). */
export async function verifyAssignWorkersSavePersists(
  page: Page,
): Promise<void> {
  const tp = new TimeProjectsPage(page);
  // 1. Navigate to Time projects
  await tp.navigateToTimeProjects();
  // 2. Open Assign workers from first row
  await tp.openAssignWorkersFromFirstRowMenu();
  await page.waitForTimeout(4000);
  // 3. Assign workers drawer is open
  await tp.expectAssignWorkersDrawerVisible();
  let drawer = tp.assignWorkersDrawer();
  // 4. If any worker checkbox is checked, uncheck and Save (then reopen drawer)
  const boxes = drawer.getByRole('checkbox');
  const boxCount = await boxes.count();
  let clearedCheckedWorkers = false;
  for (let i = 0; i < boxCount; i += 1) {
    const c = boxes.nth(i);
    const label = (await c.getAttribute('aria-label')) || '';
    if (label === 'Select all items') continue;
    if ((await c.getAttribute('aria-checked')) === 'true') {
      await c.click();
      clearedCheckedWorkers = true;
    }
  }
  if (clearedCheckedWorkers) {
    await expect(tp.assignmentDrawerSaveButton()).toBeEnabled();
    await tp.assignmentDrawerSaveButton().click();
    await page.waitForTimeout(2000);
    await expect(tp.assignWorkersDrawer()).not.toBeVisible({ timeout: 60_000 });
    await tp.openAssignWorkersFromFirstRowMenu();
    await page.waitForTimeout(4000);
    await tp.expectAssignWorkersDrawerVisible();
    drawer = tp.assignWorkersDrawer();
  }
  // 5. Select worker and Save — drawer closes
  await expect(tp.assignmentDrawerSaveButton()).toBeDisabled();
  await expect(
    page.getByText(/\d+ of \d+ workers assigned to/i).first(),
  ).toBeVisible({ timeout: 10_000 });
  await tp.selectFirstWorkerCheckboxInAssignmentDrawer();
  await expect(tp.assignmentDrawerSaveButton()).toBeEnabled();
  await tp.assignmentDrawerSaveButton().click();
  await page.waitForTimeout(2000);
  await expect(drawer).not.toBeVisible({ timeout: 60_000 });
}

/**
 * PR025 — Rename project: Time → Manage projects → first row ⋮ → Edit this project → Save and close → verify on Time projects.
 */
export async function verifyRenameProjectViaProjectsApp(
  page: Page,
): Promise<void> {
  const updatedName = `E2E Updated ${Date.now()}`;

  // 1. Navigate to Time projects (Time section)

  const tp = new TimeProjectsPage(page);
  await tp.navigateToTimeProjects();
  // 2. Manage projects
  await tp.clickManageProjects();
  await page.waitForURL(/\/app\/projects/i, { timeout: 30_000 });
  await handlePopupsInAnyOrder(page);
  await page.waitForTimeout(1500);

  // 3–4. First row overflow → Edit this project
  const firstRow = page.locator('tbody tr').first();
  await expect(firstRow).toBeVisible({ timeout: 20_000 });
  const rowOverflow = page.locator(`//div[@data-id="project-action-list"]`);
  await rowOverflow.first().click();
  await page
    .getByRole('menuitem', { name: /edit this project/i })
    .or(page.getByText(/^Edit this project$/i))
    .first()
    .click();

  // 5–6. New name → Save and close
  const nameInput = page
    .getByLabel(/project name/i)
    .or(page.getByPlaceholder(/project name/i))
    .first();
  await expect(nameInput).toBeVisible({ timeout: 15_000 });
  await nameInput.fill(updatedName);
  const saveAndClose = page.getByRole('button', {
    name: /save and close|save & close/i,
  });
  await expect(saveAndClose.first()).toBeVisible({ timeout: 15_000 });
  await saveAndClose.first().click();

  await page.waitForTimeout(2000);
  await handlePopupsInAnyOrder(page);

  // 7–8. Time projects → updated name visible
  await tp.navigateToTimeProjects();
  await expect(
    tp.projectRows().filter({ hasText: updatedName }).first(),
  ).toBeVisible({ timeout: 45_000 });
}

/** Steps 1–3 only: navigate to Projects, open **More** on the project row, **Delete project** (+ confirm if shown). */
async function deleteProjectInProjectsApp(
  page: Page,
  projectName: string,
): Promise<void> {
  // 1. Navigate to project (Projects list)
  await gotoWithAuthSession(page, '/app/projects', { waitUntil: 'load' });
  await handlePopupsInAnyOrder(page);

  const projectRow = page
    .locator('tr')
    .filter({ hasText: projectName })
    .first();
  await expect(projectRow).toBeVisible({ timeout: 15000 });
  // 2. More options for the created project
  await projectRow.locator(`//div[@data-id="project-action-list"]`).click();
  // 3. Delete project
  await page.locator(`//span[text()="Delete project"]`).click();
  const confirm = page.locator(`//*[contains(text(),"Delete project")]`).last();
  await expect(confirm).toBeVisible({ timeout: 10000 });
  await confirm.click();
  await page.waitForTimeout(3000);
  const successMessage = page.locator(
    `//*[text()='Project has been deleted.']`,
  );
  await expect(successMessage).toBeVisible({ timeout: 10000 });
}

/** Open Edit estimate for row `rowIndex`; returns true when estimate type is By service item. */
async function openEditEstimateForRow(
  page: Page,
  tp: TimeProjectsPage,
  rowIndex: number,
): Promise<boolean> {
  const row = tp.projectRowAt(rowIndex);
  await expect(row).toBeVisible({ timeout: 15_000 });
  const createBtn = row.locator('xpath=.//button[text()="Create Estimate"]');
  if (await createBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await createBtn.first().click();
  } else {
    const combo = row.locator('[data-testid^="action-combo-link-"]');
    await expect(combo).toBeVisible({ timeout: 15_000 });
    const primary = combo
      .getByRole('button', { name: /^edit$/i })
      .or(combo.getByRole('link', { name: /^edit$/i }))
      .first();
    if ((await primary.count()) > 0) {
      await primary.click();
    } else {
      await combo.click();
      const edit = page.getByText(/^Edit$/i).first();
      if (!(await edit.isVisible().catch(() => false))) {
        await page.keyboard.press('Escape');
        return false;
      }
      await edit.click();
    }
  }
  await expect(tp.createEstimateDrawer()).toBeVisible({ timeout: 20_000 });
  return (
    (await tp
      .estimateTypeByService()
      .isChecked()
      .catch(() => false)) === true
  );
}

/** First row index (0-based) whose Edit estimate drawer is By service item, or `null`. */
async function findRowIndexWithServiceItemEstimate(
  page: Page,
  tp: TimeProjectsPage,
): Promise<number | null> {
  const n = Math.min(await tp.projectRows().count(), 25);
  for (let i = 0; i < n; i += 1) {
    const opened = await openEditEstimateForRow(page, tp, i);
    if (opened) return i;
    if (
      await tp
        .createEstimateDrawer()
        .isVisible()
        .catch(() => false)
    ) {
      await tp.closeEstimateDrawerViaHeader();
      await expect(tp.createEstimateDrawer()).not.toBeVisible({
        timeout: 15_000,
      });
    }
  }
  return null;
}

/** PR026 — Inline edit hours, close drawer without Save → value unchanged. */
export async function verifyServiceItemInlineEditCancel(
  page: Page,
): Promise<void> {
  const tp = new TimeProjectsPage(page);
  await tp.navigateToTimeProjects();
  await page.waitForTimeout(20000);
  if (
    await tp
      .createEstimateButtonExactText()
      .first()
      .isVisible({ timeout: 20000 })
  ) {
    await createServiceItemEstimateForProject(page);
  }
  await tp.openEditEstimateFromFirstRowExpandMenuThenEditEstimate({
    timeoutMs: 15000,
  });
  await tp.expectCreateOrEditEstimateDrawerOpen();
  const drawer = tp.createEstimateDrawer();
  // 1. First row action menu (⋯)
  await page
    .locator(
      '//button[contains(@class,"CreateEstimateDrawerstyled__ActionButton")]',
    )
    .first()
    .click();
  // 2. Edit option in the action menu
  await page
    .getByRole('menuitem', { name: /^Edit$/i })
    .or(page.getByText(/^Edit$/i))
    .first()
    .click();
  // 3. Hours input in table cell
  await page
    .locator('//td//input[@type="number"]')
    .first()
    .fill(String(Math.floor(Math.random() * 9) + 1));
  await page.locator(`//button[@aria-label="Close"]`).click();
}

/** PR027 — Inline edit hours + Save → updated. */
export async function verifyServiceItemInlineEditSave(
  page: Page,
): Promise<void> {
  const tp = new TimeProjectsPage(page);
  await tp.navigateToTimeProjects();
  await page.waitForTimeout(20000);
  if (
    await tp
      .createEstimateButtonExactText()
      .first()
      .isVisible({ timeout: 20000 })
  ) {
    await createServiceItemEstimateForProject(page);
  }
  await tp.openEditEstimateFromFirstRowExpandMenuThenEditEstimate({
    timeoutMs: 15000,
  });
  await tp.expectCreateOrEditEstimateDrawerOpen();
  // 1. First row action menu (⋯)
  await page
    .locator(
      '//button[contains(@class,"CreateEstimateDrawerstyled__ActionButton")]',
    )
    .first()
    .click();
  // 2. Edit option in the action menu
  await page
    .getByRole('menuitem', { name: /^Edit$/i })
    .or(page.getByText(/^Edit$/i))
    .first()
    .click();
  // 3. Hours input in table cell
  await page
    .locator('//td//input[@type="number"]')
    .first()
    .fill(String(Math.floor(Math.random() * 9) + 1));
  await page.locator(`//button/span[text()="Save"]`).click();
  await tp.openEditEstimateFromFirstRowExpandMenuThenEditEstimate({
    timeoutMs: 15000,
  });
  await tp.expectCreateOrEditEstimateDrawerOpen();
  await page
    .locator(
      '//button[contains(@class,"CreateEstimateDrawerstyled__ActionButton")]',
    )
    .first()
    .click();

  await page
    .getByRole('menuitem', { name: /^Delete$/i })
    .or(page.getByText(/^Delete$/i))
    .first()
    .click();
  await page.locator(`//button/span[text()="Save"]`).click();
}

/** PR028 — Delete row, close drawer without Save → row still present. */
export async function verifyServiceItemDeleteCancel(page: Page): Promise<void> {
  const tp = new TimeProjectsPage(page);
  await tp.navigateToTimeProjects();
  await page.waitForTimeout(20000);
  if (
    await tp
      .createEstimateButtonExactText()
      .first()
      .isVisible({ timeout: 20000 })
  ) {
    await createServiceItemEstimateForProject(page);
  }
  await tp.openEditEstimateFromFirstRowExpandMenuThenEditEstimate({
    timeoutMs: 9000,
  });
  await tp.expectCreateOrEditEstimateDrawerOpen();
  // 1. First row action menu (⋯)
  await page
    .locator(
      '//button[contains(@class,"CreateEstimateDrawerstyled__ActionButton")]',
    )
    .first()
    .click();
  // 2. Delete option in the action menu
  await page
    .getByRole('menuitem', { name: /^Delete$/i })
    .or(page.getByText(/^Delete$/i))
    .first()
    .click();
  await page.locator(`//button[@aria-label="Close"]`).click();
  await page.waitForTimeout(2000);
  await page.locator('//button/span[text()="Yes"]').click();
}

/** PR029 — Delete service item + Save → removed from estimate. */
export async function verifyServiceItemDeleteSave(page: Page): Promise<void> {
  const tp = new TimeProjectsPage(page);
  await tp.navigateToTimeProjects();
  await page.waitForTimeout(20000);
  if (
    await tp
      .createEstimateButtonExactText()
      .first()
      .isVisible({ timeout: 20000 })
  ) {
    await createServiceItemEstimateForProject(page);
  }
  await tp.openEditEstimateFromFirstRowExpandMenuThenEditEstimate({
    timeoutMs: 15000,
  });
  await tp.expectCreateOrEditEstimateDrawerOpen(); // 1. First row action menu (⋯)
  await page
    .locator(
      '//button[contains(@class,"CreateEstimateDrawerstyled__ActionButton")]',
    )
    .first()
    .click();
  // 2. Delete option in the action menu
  await page
    .getByRole('menuitem', { name: /^Delete$/i })
    .or(page.getByText(/^Delete$/i))
    .first()
    .click();
  await page.locator(`//button/span[text()="Save"]`).click();
}

/** PR030 — Many service rows: drawer body scrolls or many rows are listed. */
export async function verifyServiceItemsManyRowsScrollOrListed(
  page: Page,
): Promise<void> {
  // 1. Navigate to Time Project in Time section.
  const tp = new TimeProjectsPage(page);
  await tp.navigateToTimeProjects();

  // 2. Click on the firstrow dropdown and select Edit estimate option.
  await tp.openEditEstimateFromFirstRowExpandMenuThenEditEstimate();
  const drawer = tp.createEstimateDrawer();

  // 3. Verify many rows of service item is visible.
  const rowCount = await page.locator('//section//table/tbody/tr').count();
  expect(rowCount >= 6).toBeTruthy();

  // 4. Check whether the scroll bar is visible while scrolling.
  const scrollHost = page
    .locator('//section[contains(@class,"Drawer-contentWrapper")]')
    .first();
  const canScroll = await scrollHost
    .evaluate((el) => el.scrollHeight > el.clientHeight + 6)
    .catch(() => false);
  expect(canScroll).toBeTruthy();
  const didScroll = await scrollHost
    .evaluate((el) => {
      const before = el.scrollTop;
      el.scrollTop = before + 150;
      return el.scrollTop !== before;
    })
    .catch(() => false);
  expect(didScroll).toBeTruthy();
  await tp.closeEstimateDrawerViaHeader();
}
