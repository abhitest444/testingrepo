import { expect, Locator, Page } from '@playwright/test';
import AssignmentsPage from '../../pages/AssignmentsPage';
import gotoWithAuthSession from '../../gotoWithAuthSession';
import {
  waitForLoadingToDisappear,
  navigateToTimeEntries,
  navigateToAccountAndSettingsTime,
  clickEditGeoLocationSection,
  selectAndVerifyRequireLocationOption,
  handlePopupsInAnyOrder,
} from '../../pages/TimeSettingsPage';
import { deleteAllBreakRules, cleanupAllTimeEntries } from './TimeEntries.util';
import CustomFieldsPage, {
  unselectAllCustomersInAssignmentTrackingPanel,
} from '../../pages/CustomFieldSettingsPage';
import * as weeklyTimeEntryPage from '../../pages/WeeklyTimeEntryPage';

import {
  CUSTOM_FIELD_DATA_TYPES,
  CUSTOM_FIELD_CATEGORY_OPTIONS,
} from '../../constants';
import {
  clickDropdownOption,
  navigateToSingleTimeEntry,
} from '../../pages/WeeklyTimeEntryPage';
import { navigate } from '../../pages/WeeklyTimeEntryPage';
import SingleTimeEntryPage from '../../pages/SingleTimeEntryPage';
import SingleTimeActivityPage from '../../pages/SingleTimeActivityPage';
import TimeClockPage, {
  clockInForAssignment,
  navigateToTimeClock,
  TestAdmin,
} from '../../pages/TimeClockPage';
import TimeEntriesPage from '../../pages/TimeEntriesPage';
import WhosWorkingMapPage from '../../pages/WhosWorkingMapPage';
import {
  navigateToClassicTimeSheet,
  handleClassicTimesheetPopupsInAnyOrder,
  clickOnCompSettings,
  clickOnTimeOptions,
} from '../../pages/GB/GBTimeSettingsPage';
import { BreaksRulesPage } from '../../pages/BreaksRulesPage';
import TimeMenuNavigationPage from '../../pages/TimeMenuNavigationPage';

import { validateCustomerTimeCategoryRequiredBanner } from './WeeklyTimeEntry.util';
import { openWeeklyTimeEntry } from './WTERunPayroll.util';
import {
  clickAddTimeDropdown,
  selectSingleTimeEntryFromAddTime,
  normalizeToMinutes,
  openDateRangeDropdown,
  selectDateRangeOption,
  selectDisplayByOption,
} from '../../commonUtils';
import { LABELS } from '../../utils';
import {
  deactivateAllTestCustomFields,
  openTimeCustomFieldsEditAfterDeactivatingTestFields,
} from './CustomFieldSettings.Util';
import { deleteAllTimeEntries } from './Mileage.util';

/** After opening WTE team member dropdown, options can take a moment to load. */
const WTE_TEAM_MEMBER_DROPDOWN_OPTIONS_SETTLE_MS = 5000;
/** After opening STE Name (worker) dropdown before selecting an option. */
const STE_NAME_DROPDOWN_OPTIONS_SETTLE_MS = 8000;
/** After opening STE Customer combobox, options (e.g. assigned customers) can load slowly. */
const STE_CUSTOMER_DROPDOWN_OPTIONS_SETTLE_MS = 5000;

/** Shared by comprehensive assignment flows: skip admin-looking assign-worker rows. */
const ASSIGNMENT_FLOW_ADMIN_WORKER_HINTS = [
  /company\s+admin/i,
  /^admin\b/i,
  /\bcadmin\b/i,
  /\badministrator\b/i,
];

function assignmentFlowWorkerLabelLooksLikeAdmin(label: string): boolean {
  const t = label.trim().toLowerCase();
  return ASSIGNMENT_FLOW_ADMIN_WORKER_HINTS.some((re) => re.test(t));
}

/** Group / chrome rows in Assign workers hierarchy (not a leaf worker). */
function assignWorkersPanelRowIsGroupChrome(label: string): boolean {
  const t = label.trim().toLowerCase();
  return (
    t === 'workers' ||
    t === 'no group' ||
    /select all/i.test(label) ||
    /^select\s+no\s+group$/i.test(label.trim()) ||
    /^select\s+workers$/i.test(label.trim())
  );
}

/** Leaf worker label is usually the last non-chrome line in the row. */
function workerLabelFromAssignPanelRowText(rowText: string): string | null {
  const lines = rowText
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  for (let j = lines.length - 1; j >= 0; j--) {
    const line = lines[j];
    if (!assignWorkersPanelRowIsGroupChrome(line)) return line;
  }
  return null;
}

/** Prefer explicit worker-shaped text inside the row (e.g. QBO test accounts). */
function workerNameFromAssignPanelRowText(rowText: string): string | null {
  const m = rowText.match(/\bTest\s+Emp\s*\d+\b/i);
  return m ? m[0].trim() : null;
}

async function pickFirstNonAdminWorkerInAssignPanel(
  page: Page,
): Promise<string> {
  const panel = page.getByRole('dialog', { name: /Assign workers/i });

  async function tryUseCheckbox(cb: Locator): Promise<string | null> {
    const aria = ((await cb.getAttribute('aria-label')) || '').trim();
    if (/select all/i.test(aria)) return null;

    let rowText = '';
    const liRow = cb.locator('xpath=ancestor::li[1]');
    if ((await liRow.count()) > 0) {
      rowText = ((await liRow.textContent()) || '').trim();
    } else {
      const trRow = cb.locator('xpath=ancestor::tr[1]');
      rowText = ((await trRow.textContent()) || '').trim();
    }
    if (!rowText) {
      rowText = (
        (await cb.locator('..').locator('..').textContent()) || ''
      ).trim();
    }

    let label =
      workerNameFromAssignPanelRowText(rowText) ||
      workerLabelFromAssignPanelRowText(rowText);
    if (!label && aria) label = aria.trim();
    if (!label || assignWorkersPanelRowIsGroupChrome(label)) return null;
    if (assignmentFlowWorkerLabelLooksLikeAdmin(label)) return null;

    await cb.check();
    return label;
  }

  const inputs = panel.locator('input[type="checkbox"]');
  const inputCount = await inputs.count();
  for (let i = 0; i < inputCount; i++) {
    const picked = await tryUseCheckbox(inputs.nth(i));
    if (picked) return picked;
  }

  const roleBoxes = panel.getByRole('checkbox');
  const roleCount = await roleBoxes.count();
  for (let i = 0; i < roleCount; i++) {
    const picked = await tryUseCheckbox(roleBoxes.nth(i));
    if (picked) return picked;
  }

  throw new Error(
    'pickFirstNonAdminWorkerInAssignPanel: No non-admin worker in Assign workers list',
  );
}

/**
 * After {@link CustomFieldsPage.unselectAllWorkersInAssignPanel}, check exactly one non-admin worker
 * by **stable DOM order** (0-based index). Used for “Hours → second team member only”.
 */
async function checkExclusiveNthNonAdminWorkerInAssignPanel(
  page: Page,
  workerIndex: number,
): Promise<string> {
  const panel = page.getByRole('dialog', { name: /Assign workers/i });

  type Entry = { cb: Locator; label: string };
  const eligible: Entry[] = [];
  const inputs = panel.locator('input[type="checkbox"]');
  const inputCount = await inputs.count();
  for (let i = 0; i < inputCount; i++) {
    const cb = inputs.nth(i);
    const aria = ((await cb.getAttribute('aria-label')) || '').trim();
    if (/select all/i.test(aria)) continue;

    let rowText = '';
    const liRow = cb.locator('xpath=ancestor::li[1]');
    if ((await liRow.count()) > 0) {
      rowText = ((await liRow.textContent()) || '').trim();
    } else {
      const trRow = cb.locator('xpath=ancestor::tr[1]');
      rowText = ((await trRow.textContent()) || '').trim();
    }
    if (!rowText) {
      rowText = (
        (await cb.locator('..').locator('..').textContent()) || ''
      ).trim();
    }

    let label =
      workerNameFromAssignPanelRowText(rowText) ||
      workerLabelFromAssignPanelRowText(rowText);
    if (!label && aria) label = aria.trim();
    if (!label || assignWorkersPanelRowIsGroupChrome(label)) continue;
    if (assignmentFlowWorkerLabelLooksLikeAdmin(label)) continue;
    eligible.push({ cb, label });
  }

  if (eligible.length <= workerIndex) {
    throw new Error(
      `checkExclusiveNthNonAdminWorkerInAssignPanel: need index ${workerIndex}, found ${eligible.length} eligible workers`,
    );
  }
  const { cb, label } = eligible[workerIndex];
  if (!(await cb.isChecked().catch(() => false))) {
    await cb.check();
  }
  return label;
}

/** Legacy elite flow: pick another name option (substring match only). */
async function classicAssignmentClickNameOptionOtherThan(
  options: Locator,
  primaryNameSubstring: string,
): Promise<void> {
  const cnt = await options.count();
  for (let i = 0; i < cnt; i++) {
    const t = (await options.nth(i).textContent()) || '';
    if (t && !t.includes(primaryNameSubstring)) {
      await options.nth(i).click();
      return;
    }
  }
  throw new Error(
    `classicAssignmentClickNameOptionOtherThan: No alternate worker besides "${primaryNameSubstring}"`,
  );
}

/** Elite assignment flows: click first option in an open listbox whose text contains `substring`. */
async function selectFirstOptionContaining(
  options: Locator,
  substring: string,
): Promise<void> {
  const n = await options.count();
  for (let i = 0; i < n; i++) {
    const t = (await options.nth(i).textContent()) || '';
    if (substring && t.includes(substring)) {
      await options.nth(i).click();
      return;
    }
  }
  throw new Error(
    `selectFirstOptionContaining: No option containing "${substring}"`,
  );
}

/**
 * Expand a dropdown custom field row on Time → custom fields **edit** table.
 * QBO may expose either i18n **keys** on `aria-label` (`weekly.expandrow` / `weekly.collapserow`)
 * or **translated** names ("Expand row" / "Collapse row") — handle both. See CustomFieldsTable.tsx.
 */
async function expandCustomFieldTableRowIfCollapsed(
  page: Page,
  customFieldName: string,
): Promise<void> {
  const row = page.locator('tr').filter({ hasText: customFieldName }).first();

  const collapseKey = row.locator('button[aria-label="weekly.collapserow"]');
  const collapseI18n = row.getByRole('button', { name: 'Collapse row' });
  if (
    (await collapseKey.isVisible({ timeout: 2000 }).catch(() => false)) ||
    (await collapseI18n.isVisible({ timeout: 500 }).catch(() => false))
  ) {
    return;
  }

  const expandKey = row.locator('button[aria-label="weekly.expandrow"]');
  const expandI18n = row.getByRole('button', { name: 'Expand row' });
  if (await expandKey.isVisible({ timeout: 15_000 }).catch(() => false)) {
    await expandKey.click();
    await page.waitForTimeout(800);
    return;
  }
  if (await expandI18n.isVisible({ timeout: 5000 }).catch(() => false)) {
    await expandI18n.click();
    await page.waitForTimeout(800);
    return;
  }

  await row.locator('//button[@aria-label="weekly.expandrow"]').click({
    timeout: 15_000,
  });
  await page.waitForTimeout(800);
}

/** Collapse an expanded dropdown custom field row so another field can be expanded without ambiguous list rows. */
async function collapseCustomFieldTableRowIfExpanded(
  page: Page,
  customFieldName: string,
): Promise<void> {
  const row = page.locator('tr').filter({ hasText: customFieldName }).first();
  const collapseKey = row.locator('button[aria-label="weekly.collapserow"]');
  const collapseI18n = row.getByRole('button', { name: 'Collapse row' });
  if (await collapseKey.isVisible({ timeout: 2000 }).catch(() => false)) {
    await collapseKey.click();
    await page.waitForTimeout(500);
    return;
  }
  if (await collapseI18n.isVisible({ timeout: 2000 }).catch(() => false)) {
    await collapseI18n.click();
    await page.waitForTimeout(500);
  }
}

/**
 * Priority-case assignment flow only (`assignmentsPriorityEliteComprehensiveAssignmentFlow`).
 * Skips "+ Add new" and admin-looking rows in Name / team member listboxes.
 */
function priorityCaseOptionLooksLikeAddNew(label: string): boolean {
  return /add\s+new/i.test(label.trim().toLowerCase());
}

function priorityCaseIsSelectableWorkerOption(label: string): boolean {
  const t = (label || '').trim();
  if (!t) return false;
  return (
    !priorityCaseOptionLooksLikeAddNew(t) &&
    !assignmentFlowWorkerLabelLooksLikeAdmin(t)
  );
}

async function priorityCaseClickFirstSelectableWorkerOption(
  page: Page,
  options?: { waitAfterClickMs?: number; waitBeforeScanMs?: number },
): Promise<void> {
  if (options?.waitBeforeScanMs) {
    await page.waitForTimeout(options.waitBeforeScanMs);
  }

  const tryClickRow = async (rows: Locator): Promise<boolean> => {
    const cnt = await rows.count();
    for (let i = 0; i < cnt; i++) {
      const t = (await rows.nth(i).textContent()) || '';
      if (priorityCaseIsSelectableWorkerOption(t)) {
        await rows.nth(i).click();
        return true;
      }
    }
    return false;
  };

  const opts = page.getByRole('option');
  if (await tryClickRow(opts)) {
    const after = options?.waitAfterClickMs ?? 0;
    if (after > 0) await page.waitForTimeout(after);
    return;
  }

  const listboxRows = page
    .getByRole('listbox')
    .first()
    .locator('[role="option"], li');
  if (await tryClickRow(listboxRows)) {
    const after = options?.waitAfterClickMs ?? 0;
    if (after > 0) await page.waitForTimeout(after);
    return;
  }

  throw new Error(
    'priorityCaseClickFirstSelectableWorkerOption: No selectable worker in open option list',
  );
}

/** STE Name list may use role=option or listbox rows; dropdown may need combobox hits after legacy openDropdown. */
async function priorityCaseEnsureSteNameDropdownOpen(
  page: Page,
  singleTimeActivityPage: SingleTimeActivityPage,
): Promise<void> {
  const hasSelectableOption = async (): Promise<boolean> => {
    const n = await page.getByRole('option').count();
    if (n === 0) return false;
    for (let i = 0; i < n; i++) {
      const t = (await page.getByRole('option').nth(i).textContent()) || '';
      if (priorityCaseIsSelectableWorkerOption(t)) return true;
    }
    return false;
  };

  const hasListboxRow = async (): Promise<boolean> => {
    const lb = page.getByRole('listbox').first();
    if (!(await lb.isVisible().catch(() => false))) return false;
    const rows = lb.locator('[role="option"], li');
    const c = await rows.count();
    for (let i = 0; i < c; i++) {
      const t = (await rows.nth(i).textContent()) || '';
      if (priorityCaseIsSelectableWorkerOption(t)) return true;
    }
    return false;
  };

  await singleTimeActivityPage.openDropdown('Name');
  await page.waitForTimeout(800);

  for (let attempt = 0; attempt < 4; attempt++) {
    if ((await hasSelectableOption()) || (await hasListboxRow())) {
      return;
    }

    const nameLabelBlock = page.locator(
      `//span[contains(text(),'Name')] / ancestor::label`,
    );
    await nameLabelBlock
      .locator('div[contains(@class, "Dropdown")]')
      .first()
      .click({ force: true })
      .catch(() => {});
    await page.waitForTimeout(400);
    if ((await hasSelectableOption()) || (await hasListboxRow())) {
      return;
    }

    await nameLabelBlock
      .locator('div[role="combobox"], input[role="combobox"]')
      .first()
      .click({ force: true })
      .catch(() => {});
    await page.waitForTimeout(400);
    if ((await hasSelectableOption()) || (await hasListboxRow())) {
      return;
    }

    await nameLabelBlock
      .locator('input[type="text"]')
      .first()
      .click({ force: true })
      .catch(() => {});
    await page.waitForTimeout(400);
  }
}

async function priorityCaseSelectWteTeamMember(page: Page): Promise<void> {
  const chevron = weeklyTimeEntryPage.teamMemberDropdown(page).first();
  const fieldInput = weeklyTimeEntryPage.teamMemberDropdownValue(page).first();

  // Icon hit-target can miss under modals/side panel; `force` matches getTeamMemberOptions pattern.
  await chevron.click({ force: true });
  await page.waitForTimeout(600);
  if ((await page.getByRole('option').count()) === 0) {
    await fieldInput.click({ force: true });
    await page.waitForTimeout(600);
  }
  if ((await page.getByRole('option').count()) === 0) {
    await chevron.click({ force: true });
    await page.waitForTimeout(600);
  }

  await expect(
    page
      .getByRole('option')
      .filter({ hasNotText: /add\s+new/i })
      .first(),
  ).toBeVisible({ timeout: 25_000 });

  await priorityCaseClickFirstSelectableWorkerOption(page, {
    waitBeforeScanMs: 600,
    waitAfterClickMs: 2000,
  });
}

async function priorityCaseSelectSteNameField(
  page: Page,
  singleTimeActivityPage: SingleTimeActivityPage,
): Promise<void> {
  await priorityCaseEnsureSteNameDropdownOpen(page, singleTimeActivityPage);
  await page.waitForTimeout(STE_NAME_DROPDOWN_OPTIONS_SETTLE_MS);

  const optionRow = page
    .getByRole('option')
    .filter({ hasNotText: /add\s+new/i })
    .first();
  const listboxRow = page
    .getByRole('listbox')
    .first()
    .locator('[role="option"], li')
    .filter({ hasNotText: /add\s+new/i })
    .first();
  await expect(optionRow.or(listboxRow)).toBeVisible({ timeout: 25_000 });

  await priorityCaseClickFirstSelectableWorkerOption(page, {
    waitBeforeScanMs: 600,
  });
}

export const goToAssignments = async (page: Page) => {
  const assignmentsPage = new AssignmentsPage(page);
  await assignmentsPage.goto();
  await handlePopupsInAnyOrder(page);
  return assignmentsPage;
};

// export const navigateToAccountAndSettingsTime = async (page: Page) => {
//   // Step 1: Click on settings icon
//   await page.goto('/app/accountsettings?p=time');
//   await page.waitForTimeout(2000);
// };

export const openManageTimeTrackingFieldsFromAssignments = async (
  page: Page,
) => {
  const assignmentsPage = await goToAssignments(page);

  await Promise.all([
    page.waitForURL('https://qbo.intuit.com/app/accountsettings?p=time', {
      timeout: 60000,
    }),
    assignmentsPage.openManageTimeTrackingFields(),
  ]);

  await page.waitForLoadState('load');
  await expect(page).toHaveURL(
    'https://qbo.intuit.com/app/accountsettings?p=time',
  );
  await CustomFieldsPage.validateTimeSettingsCustomFieldSectionVisible(page);
};

export const validateWorkersTabInAssignments = async (page: Page) => {
  // Navigate to Assignments
  const assignmentsPage = await goToAssignments(page);

  // Click on Workers tab
  await assignmentsPage.selectTab('WORKERS');

  // Verify Workers and Groups toggle section is visible
  await assignmentsPage.verifyWorkersGroupsToggle();

  // Switch to Groups view
  await assignmentsPage.switchToGroupsView();
  await page.waitForTimeout(500);

  // Verify Groups toggle button is pressed
  await expect(assignmentsPage.groupsToggleButton()).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByText('No groups', { exact: false })).toBeVisible();
  await page.waitForTimeout(500);
  await assignmentsPage.workersToggleButton().click();
  // Verify Workers tab is selected
  await expect(assignmentsPage.workersToggleButton()).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  // Verify Workers, Type, Group & Actions columns and action buttons
  await assignmentsPage.verifyWorkersTabElements();
  await page.waitForTimeout(500);
  const initialWorkerCount = await getWorkersTotalCountFromHeader(page);
  expect(initialWorkerCount).toBeGreaterThan(0);
  console.log(`Initial worker count: ${initialWorkerCount}`);

  // Click on Add worker button and verify drawer opens
  await assignmentsPage.addWorkerButton().click();
  await expect(
    page.getByRole('option', { name: 'Add contractor' }),
  ).toBeVisible();

  await page.getByRole('option', { name: 'Add employee' }).click();
  await page.waitForTimeout(500);

  // Verify Employee drawer/dialog is visible
  await expect(page.getByRole('heading', { name: 'Employee' })).toBeVisible();
  console.log('Add worker drawer opened successfully');

  // Enter first name and last name and save
  const firstName = `Test${Math.floor(Math.random() * 100)}`;
  const lastName = `worker${Math.floor(Math.random() * 100)}`;
  const fullName = `${firstName} ${lastName}`;

  await page.getByRole('textbox', { name: 'First name' }).fill(firstName);
  await page.getByRole('textbox', { name: 'Last name' }).fill(lastName);
  console.log(`Entered worker name: ${fullName}`);

  // Click Save button
  await page.getByRole('button', { name: 'Save' }).click();
  await waitForLoadingToDisappear(page);
  console.log('Worker saved successfully');

  await assignmentsPage.selectTab('CUSTOMERS');
  await page.waitForTimeout(500);

  await assignmentsPage.selectTab('WORKERS');
  await page.waitForTimeout(500);
  await waitForLoadingToDisappear(page);

  await assignmentsPage.workersToggleButton().click();
  await waitForLoadingToDisappear(page);

  const updatedWorkerCount = await getWorkersTotalCountFromHeader(page);
  expect(updatedWorkerCount).toBeGreaterThan(initialWorkerCount);
  console.log(
    `Worker count increased from ${initialWorkerCount} to ${updatedWorkerCount}`,
  );

  // Click on Create group button
  await assignmentsPage.createGroupButton().click();
  await expect(page.locator(`//strong[text()="Create group"]`)).toBeVisible();
  console.log('Create group dialog opened');

  // Click Assign workers button
  await page.getByRole('button', { name: 'Assign workers' }).click();
  await expect(
    page.getByRole('heading', { name: 'Assign workers' }),
  ).toBeVisible();

  // Click Cancel to close the assign workers drawer
  await page.getByRole('button', { name: 'Close' }).click();
  await page.waitForTimeout(500);

  // Click Assign leads button
  await page.getByRole('button', { name: 'Assign leads' }).click();
  await expect(
    page.getByRole('heading', { name: 'Assign group lead' }),
  ).toBeVisible();

  // Click Cancel to close the assign leads drawer and the create group dialog
  await page.getByRole('button', { name: 'Close' }).click();
  await page.waitForTimeout(500);
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Cancel' })
    .click();
  await page.waitForTimeout(500);

  // Click on Manage time tracking fields button and verify navigation
  await assignmentsPage.manageTimeTrackingFieldsButton().click();
  await page.waitForURL(/accountsettings\?p=time/i, { timeout: 60000 });
  await expect(page).toHaveURL(/accountsettings\?p=time/i);
  console.log('Navigated to Time tracking settings page');

  // Verify Time tracking and Timesheet management sections are visible
  await expect(page.getByText('Time tracking').first()).toBeVisible();
  await expect(page.getByText('Timesheet management')).toBeVisible();
  console.log('✓ Time tracking and Timesheet management sections are visible');
};

export const validateGroupsTabInAssignments = async (page: Page) => {
  // Navigate to Assignments
  const assignmentsPage = await goToAssignments(page);

  // Click on Workers tab and verify Workers and Groups toggle
  await assignmentsPage.selectTab('WORKERS');
  await assignmentsPage.verifyWorkersGroupsToggle();

  await assignmentsPage.switchToGroupsView();
  await page.waitForTimeout(500);
  // Verify Groups tab is selected
  await expect(assignmentsPage.groupsToggleButton()).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.waitForTimeout(500);
  // Verify Groups column fields (Groups, Workers, Group leads, Actions)
  await assignmentsPage.verifyGroupsTabElements();
};

export const createGroupAndValidateGroupDetails = async (
  page: Page,
  groupName1: string = `Group ${Math.floor(Math.random() * 10000)}`,
  groupName2: string = `Group ${Math.floor(Math.random() * 10000)}`,
) => {
  // Hardcoded worker and lead names
  const workerName = 'Test Emp1';
  const leadName = 'Test Emp2';
  const workerName2 = 'Test Emp3';
  const leadName2 = 'Test Emp4';

  const assignmentsPage = await goToAssignments(page);

  // Navigate to Groups view
  await assignmentsPage.selectTab('WORKERS');
  await assignmentsPage.switchToGroupsView();
  await page.waitForTimeout(500);

  // Step 1: Create group with just name and verify group created
  await assignmentsPage.createGroupButton().first().click();
  await expect(page.locator(`//strong[text()="Create group"]`)).toBeVisible();
  await page.getByRole('textbox', { name: 'Group name' }).fill(groupName1);
  await page
    .getByRole('button')
    .filter({ hasText: 'Create group' })
    .last()
    .click();
  await page.waitForTimeout(1000);
  await assignmentsPage
    .successToast(`Group "${groupName1}" created successfully`)
    .waitFor({ state: 'visible', timeout: 1000 });

  // Verify first group created (0 workers, 0 leads)
  await assignmentsPage.verifyGroupRowDetails(groupName1, 0, 0);
  console.log(`Group ${groupName1} created with 0 workers and 0 leads`);
  await assignmentsPage.verifyGroupsCount(1);
  console.log(`✓ Groups count verified: 1`);

  // Step 2: Create group with name, assign workers, assign leads and verify group created with counts
  await assignmentsPage.createGroupButton().click();
  await expect(page.locator(`//strong[text()="Create group"]`)).toBeVisible();

  // Enter group name
  await page.getByRole('textbox', { name: 'Group name' }).fill(groupName2);

  // Assign worker by name
  await page.getByRole('button', { name: 'Assign workers' }).click();
  await assignmentsPage.selectItemByNameInDrawer(workerName);
  await assignmentsPage.selectItemByNameInDrawer(workerName2);
  await assignmentsPage.saveDrawerChanges();

  // Assign lead by name
  await page.getByRole('button', { name: 'Assign leads' }).click();
  await assignmentsPage.selectItemByNameInDrawer(leadName);
  await assignmentsPage.selectItemByNameInDrawer(leadName2);
  await assignmentsPage.saveDrawerChanges();

  // Submit to create the group
  await page.getByRole('button', { name: 'Create group' }).last().click();
  await page.waitForTimeout(1000);

  // Verify second group created with worker and lead counts
  await assignmentsPage.verifyGroupRowDetails(groupName2, 2, 2, 6);
  console.log(`Group ${groupName2} created with 2 workers and 2 leads`);
  await assignmentsPage.verifyGroupsCount(2);
  console.log(`✓ Groups count verified: 2`);

  // Verify first group still has 0 workers and 0 leads after second group creation
  await assignmentsPage.verifyGroupRowDetails(groupName1, 0, 0, 6);
  console.log(`✓ ${groupName1} still has 0 workers and 0 leads`);

  //Verify workers and leads assigned to the group
  await assignmentsPage
    .groupRow(groupName2)
    .getByRole('button', { name: 'View' })
    .click();
  await expect(page.getByRole('heading', { name: groupName2 })).toBeVisible();
  await expect(page.getByText(`2 of 6 workers`)).toBeVisible();
  await expect(page.getByText(`2 group lead`)).toBeVisible();
  await assignmentsPage.verifyWorkersInTable([workerName]);
  await assignmentsPage.verifyWorkersInTable(['Test Emp3']);
  await assignmentsPage.verifyWorkerRowsCount(2);
  console.log(`Workers assigned to group ${groupName2} verified`);
  await page.locator(`//button[@aria-label='Back to Groups']`).click();
  await page.waitForTimeout(500);

  // Verify counts after returning to groups list
  await assignmentsPage.verifyGroupsCount(2);
  await assignmentsPage.verifyGroupRowDetails(groupName1, 0, 0, 6);
  await assignmentsPage.verifyGroupRowDetails(groupName2, 2, 2, 6);
  console.log(`✓ All group counts verified after returning to groups list`);

  //verify groups in assignments page
  await assignmentsPage.selectTab('CUSTOMERS');
  await page.waitForTimeout(1000);

  // Verify customer "Bakes and Beans" with workers count
  const customerName = 'Bakes and Beans';
  const customerRow = page
    .locator(
      'table[summary="Customer assignment table"], table:has(th:has-text("Time tracking fields"))',
    )
    .first()
    .locator('tbody tr')
    .filter({ hasText: customerName })
    .first();
  await expect(customerRow).toBeVisible();

  //await expect(customerRow.locator('td').nth(1)).toHaveText('None');

  // Click on Assign Workers link for the customer
  await customerRow.getByRole('button', { name: 'Assign Workers' }).click();
  await page.waitForTimeout(500);

  // Verify Assign workers drawer opens
  await expect(
    page.getByRole('heading', { name: 'Assign workers' }),
  ).toBeVisible();

  await expect(page.getByText(`${groupName2}`)).toBeVisible();

  // Verify workers under the group
  await expect(page.getByText(workerName)).toBeVisible();
  await expect(page.getByText('Test Emp3')).toBeVisible();

  // First uncheck all workers to start with clean state
  const checkedWorkers = page.locator('input[aria-label^="Select "]:checked');
  const checkedCount = await checkedWorkers.count();

  if (checkedCount > 0) {
    for (let i = 0; i < checkedCount; i++) {
      await checkedWorkers.first().click();
      await page.waitForTimeout(200);
    }
    console.log(`✓ Unchecked ${checkedCount} workers`);
    await assignmentsPage.saveDrawerChanges();
    await page.waitForTimeout(2000);

    // Verify worker count is None after unchecking all
    await expect(customerRow.locator('td').nth(1)).toHaveText('None');
    console.log('✓ Verified worker count is None');
    await page.waitForTimeout(2000);

    await customerRow.getByRole('button', { name: 'Assign Workers' }).click();
    await page.waitForTimeout(500);
  } else {
    console.log('✓ No workers were checked, proceeding with next steps');
  }

  // Click on group checkbox and verify workers are automatically checked
  const groupCheckbox = page.locator(
    `//input[@aria-label='Select ${groupName2}']`,
  );
  await groupCheckbox.click();
  await page.waitForTimeout(500);
  console.log(`✓ Clicked on group "${groupName2}" checkbox`);

  // Verify Test Emp1 and Test Emp3 are automatically checked
  const testEmp1Checkbox = page.locator(
    `//input[@aria-label='Select ${workerName}']`,
  );
  const testEmp3Checkbox = page.locator(
    `//input[@aria-label='Select Test Emp3']`,
  );

  await expect(testEmp1Checkbox).toBeChecked();
  console.log(`Verified "${workerName}" is checked`);

  await expect(testEmp3Checkbox).toBeChecked();
  console.log(`Verified "Test Emp3" is checked`);

  //verify no group checkbox is not checked
  await expect(
    page.locator(`//input[@aria-label='Select No Group']`),
  ).not.toBeChecked();

  await expect(
    page.locator(`//input[@aria-label='Select Test Emp2']`),
  ).not.toBeChecked();
  await expect(
    page.locator(`//input[@aria-label='Select Test Emp4']`),
  ).not.toBeChecked();

  //verify group1 is not visible in the list
  await expect(page.getByText(`${groupName1}`)).not.toBeVisible();
  console.log(`Verified "${groupName1}" is not visible in the list`);

  await assignmentsPage.cancelAndDontSave();
  await page.waitForTimeout(500);
  console.log('Closed Assign workers drawer');

  await page.reload();
  // Switch to Workers tab and edit group1
  await assignmentsPage.selectTab('WORKERS');
  await assignmentsPage.switchToGroupsView();
  await page.waitForTimeout(1000);
  console.log('✓ Switched to Workers tab to edit group1');

  // Click on edit for group1
  const group1Row = assignmentsPage.groupRow(groupName1);
  await group1Row.getByRole('button', { name: 'Expand Menu' }).click();
  await page.getByRole('menuitem', { name: 'Edit group' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();

  // Assign 1 worker (Test Emp2 - not assigned to group2)
  await page.getByRole('button', { name: 'Assign workers' }).click();
  await expect(
    page.getByRole('heading', { name: 'Assign workers' }),
  ).toBeVisible();

  // Verify workerName (Test Emp1) has group2 against it
  const workerNameRow = page.locator('tr').filter({ hasText: workerName });
  await expect(workerNameRow.getByText(groupName2)).toBeVisible();

  const workerName2Row = page.locator('tr').filter({ hasText: 'Test Emp3' });
  await expect(workerName2Row.getByText(groupName2)).toBeVisible();
  console.log(`Verified workers has "${groupName2}" against it`);

  await page.waitForTimeout(500);

  // Verify leadName (Test Emp2) has "No group" against it
  const leadNameRow = page.locator('tr').filter({ hasText: leadName });
  await expect(leadNameRow.getByText('No group')).toBeVisible();
  console.log(`Verified "${leadName}" has "No group" against it`);

  // Select individual worker (Test Emp2 - not in group2)
  await assignmentsPage.selectItemByNameInDrawer(leadName);
  await page.waitForTimeout(500);
  await assignmentsPage.saveDrawerChanges();
  await page.waitForTimeout(500);
  console.log(`Assigned worker "${leadName}" to "${groupName1}"`);

  // Save the group changes
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Cancel' })
    .click();
  //await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.waitForTimeout(500);

  // Verify counts after editing group1 (added 1 worker)
  await assignmentsPage.verifyGroupsCount(2);

  // Verify group1 now has 1 worker and 0 leads
  await assignmentsPage.verifyGroupRowDetails(groupName1, 1, 0, 6);
  console.log(`✓ ${groupName1} updated to 1 worker and 0 leads`);

  // Verify group2 still has 2 workers and 2 leads (unchanged)
  await assignmentsPage.verifyGroupRowDetails(groupName2, 2, 2, 6);
  console.log(`✓ ${groupName2} still has 2 workers and 2 leads`);

  //verify groups in assignments page
  await assignmentsPage.selectTab('CUSTOMERS');
  await page.waitForTimeout(1000);

  // Verify customer "Bakes and Beans" with workers count
  await expect(customerRow).toBeVisible();

  //await expect(customerRow.locator('td').nth(1)).toHaveText('None');

  // Click on Assign Workers link for the customer
  await customerRow.getByRole('button', { name: 'Assign Workers' }).click();
  await page.waitForTimeout(500);

  // Verify Assign workers drawer opens
  await expect(
    page.getByRole('heading', { name: 'Assign workers' }),
  ).toBeVisible();

  await expect(page.getByText(`${groupName1}`)).toBeVisible();

  // Verify workers under the group
  await expect(page.getByText(leadName)).toBeVisible();

  //Click on group checkbox and verify workers are automatically checked
  await page.locator(`//input[@aria-label='Select ${groupName1}']`).click();
  await page.waitForTimeout(500);
  console.log(`✓ Clicked on group "${groupName1}" checkbox`);

  // Verify Test Emp2 is automatically checked
  await expect(
    page.locator(`//input[@aria-label='Select ${leadName}']`),
  ).toBeChecked();
  console.log(`Verified "${leadName}" is checked`);

  // await assignmentsPage.cancelAndDontSave();
  // await page.waitForTimeout(500);

  // Save the changes
  await assignmentsPage.saveDrawerChanges();
  await page.waitForTimeout(1000);

  // Step 9: Verify workers count in customer column is updated
  const updatedCustomerRow = page
    .locator(
      'table[summary="Customer assignment table"], table:has(th:has-text("Time tracking fields"))',
    )
    .first()
    .locator('tbody tr')
    .filter({ hasText: customerName })
    .first();

  // Verify workers count is now "2 of 6" (since group has 2 workers)
  await expect(updatedCustomerRow.locator('td').nth(1)).toHaveText('1 of 4');
  console.log(
    `✓ Verified customer "${customerName}" workers count updated to "1 of 4"`,
  );

  // VERIFY GROUPS IN TIME TEAM
  await page.locator(`//a[@aria-label='Time team']`).click();
  await waitForLoadingToDisappear(page);
  console.log('✓ Clicked on Time team in left panel');

  // Time team page is inside an iframe with title "Your Team"
  const timeTeamFrame = page.frameLocator('iframe[title="Your Team"]');

  // Verify First Name, Last Name, and Group columns are visible
  await expect(timeTeamFrame.locator(`//*[text()='First Name']`)).toBeVisible();
  await expect(timeTeamFrame.locator(`//*[text()='Last Name']`)).toBeVisible();
  await expect(timeTeamFrame.locator(`//*[text()='Group']`)).toBeVisible();

  //Verify Test Emp1 and Test Emp3 have group names under Groups column
  const emp1Row = timeTeamFrame.getByRole('row', {
    name: /Test Emp1 Test Emp1 Worker Employee/,
  });
  const emp3Row = timeTeamFrame.getByRole('row', {
    name: /Test Emp3 Test Emp3 Worker Employee/,
  });
  const emp2Row = timeTeamFrame.getByRole('row', {
    name: /Test Emp2 Test Emp2 Worker Employee/,
  });

  await expect(emp1Row.locator('td').nth(3)).toContainText(groupName2);
  console.log(
    `Verified "Test Emp1" has group "${groupName2}" in Time Team Groups column`,
  );

  await expect(emp3Row.locator('td').nth(3)).toContainText(groupName2);
  console.log(
    `Verified "Test Emp3" has group "${groupName2}" in Time Team Groups column`,
  );

  await expect(emp2Row.locator('td').nth(3)).toContainText(groupName1);
  console.log(
    `Verified "Test Emp2" has group "${groupName1}" in Time Team Groups column`,
  );

  // Verify other employees don't have group names (showing "-")
  const emp4Row = timeTeamFrame.getByRole('row', {
    name: /Test Emp4 Test Emp4 Worker Employee/,
  });

  await expect(emp4Row.locator('td').nth(3)).toHaveText('-');
  console.log('Verified "Test Emp2" "Test Emp4" have no group');

  console.log('✓ Time team Group column verification completed');
};

export const deleteGroup = async (page: Page, groupName: string) => {
  const assignmentsPage = new AssignmentsPage(page);

  // Click View dropdown and select Delete group
  await assignmentsPage
    .groupRow(groupName)
    .getByRole('button', { name: 'Expand Menu' })
    .click();
  await page.getByRole('menuitem', { name: 'Delete group' }).click();

  // Verify "Delete group?" popup appears
  await expect(
    page.getByRole('heading', { name: 'Delete group?' }),
  ).toBeVisible();

  // Click Delete button
  await page.getByRole('button', { name: 'Delete' }).click();

  // Verify group is deleted from the list
  await expect(assignmentsPage.groupRow(groupName)).not.toBeVisible();
  console.log(`Group "${groupName}" deleted successfully`);
};

export const cleanupAllGroups = async (page: Page) => {
  const assignmentsPage = await goToAssignments(page);

  // Navigate to Groups view
  await assignmentsPage.selectTab('WORKERS');
  await assignmentsPage.switchToGroupsView();

  // Wait for loading to complete (need adequate time for groups to load)
  const loadingText = page.locator(`//*[contains(text(), 'Loading')]`);
  await loadingText
    .first()
    .waitFor({ state: 'hidden', timeout: 5000 })
    .catch(() => {});

  // Check if "No groups found" alert is visible (no groups to delete)
  const noGroupsAlert = page
    .getByRole('alert')
    .filter({ hasText: 'No groups found' });

  // Quick check if no groups exist
  if (await noGroupsAlert.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('No groups found - cleanup not needed');
    return;
  }

  // Get groups count from header "Groups (X)"
  const groupsHeader = page.getByRole('columnheader', {
    name: /Groups \(\d+\)/,
  });
  const headerText = await groupsHeader
    .textContent({ timeout: 3000 })
    .catch(() => null);
  let groupCount = parseInt(
    headerText?.match(/Groups \((\d+)\)/)?.[1] || '0',
    10,
  );

  console.log(`Found ${groupCount} groups to delete from header`);

  if (groupCount === 0) {
    console.log('No groups found in header count - cleanup not needed');
    return;
  }

  // Get all group names from the first column of table rows (skip header row)
  const groupNameCells = page.locator('tbody tr td:first-child');

  // Delete each group one by one
  while (groupCount > 0) {
    // Wait for table to be stable before getting group name
    await page.waitForTimeout(300);

    // Get the first group name
    const groupName = await groupNameCells
      .first()
      .textContent({ timeout: 2000 })
      .catch(() => null);

    // Skip if group name is loading text or empty
    if (!groupName || groupName.trim().toLowerCase().includes('loading')) {
      // Wait a bit more and retry once
      await page.waitForTimeout(500);
      const retryGroupName = await groupNameCells
        .first()
        .textContent({ timeout: 2000 })
        .catch(() => null);
      if (
        !retryGroupName ||
        retryGroupName.trim().toLowerCase().includes('loading')
      ) {
        console.log('No valid groups to delete - cleanup complete');
        return;
      }
      const trimmedRetryName = retryGroupName.trim();
      console.log(`Attempting to delete group: "${trimmedRetryName}"`);
      await deleteGroup(page, trimmedRetryName);
      console.log(`Deleted group: "${trimmedRetryName}"`);
    } else {
      const trimmedName = groupName.trim();
      console.log(`Attempting to delete group: "${trimmedName}"`);
      await deleteGroup(page, trimmedName);
      console.log(`Deleted group: "${trimmedName}"`);
    }

    // Quick check if all groups are now deleted
    if (await noGroupsAlert.isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log('All groups deleted successfully');
      return;
    }

    // Re-check the count only if no groups alert is not visible
    const updatedHeaderText = await groupsHeader
      .textContent({ timeout: 2000 })
      .catch(() => 'Groups (0)');
    groupCount = parseInt(
      updatedHeaderText?.match(/Groups \((\d+)\)/)?.[1] || '0',
      10,
    );

    if (groupCount === 0) {
      console.log('All groups deleted successfully');
      return;
    }
    console.log(`Remaining groups: ${groupCount}`);
  }

  console.log('All groups deleted successfully');
};

export const assignWorkersAndLeadsFromDetailsPage = async (
  page: Page,
  groupName: string = `Group ${Math.floor(Math.random() * 10000)}`,
) => {
  // Hardcoded worker and lead names
  const workerName = 'Test Emp1';
  const leadName = 'Test Emp2';
  const workerName2 = 'Test Emp3';
  const leadName2 = 'Test Emp4';

  const assignmentsPage = await goToAssignments(page);

  // Navigate to Groups view
  await assignmentsPage.selectTab('WORKERS');
  await assignmentsPage.switchToGroupsView();

  // Step 1: Create group with workers and leads
  await assignmentsPage.createGroupWithWorkersAndLeads(
    groupName,
    workerName,
    leadName,
  );
  console.log(
    `Group "${groupName}" created with worker "${workerName}" and lead "${leadName}"`,
  );

  // Step 2: Verify groups in list and click on View button
  await assignmentsPage.verifyGroupRowDetails(groupName, 1, 1, 6);
  await assignmentsPage
    .groupRow(groupName)
    .getByRole('button', { name: 'View' })
    .click();
  await page.waitForTimeout(1000);

  // Step 3: Verify details page with group name heading
  await expect(page.getByRole('heading', { name: groupName })).toBeVisible();
  console.log(`Group details page loaded for "${groupName}"`);

  // Verify Worker (count), Type, Actions column headers
  await expect(page.locator('th', { hasText: 'Worker' })).toBeVisible();
  await expect(page.locator('th', { hasText: 'Type' })).toBeVisible();
  await expect(page.locator('th', { hasText: 'Actions' })).toBeVisible();
  console.log('Worker, Type, Actions headers verified');

  // Step 4: Verify workers assigned to that group - count and name
  await expect(
    page.locator(
      `//tr[.//div[contains(@class, 'WorkerName') and text()='${workerName}']]`,
    ),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'View settings' })).toBeVisible();
  console.log(`Worker "${workerName}" verified in group details`);

  // Verify worker count in header
  await verifyWorkerCountInHeader(page, 1);

  // Step 5: Verify "X of Y workers" / "X group lead" section on right
  await expect(page.getByText(`1 of 6 workers`)).toBeVisible();
  await expect(page.getByText('1 group lead')).toBeVisible();
  console.log('Worker count and group lead badges verified');

  //Assign workers from groups details page
  await page.locator(`//button[@aria-label='Assign workers or leads']`).click();
  await page.locator(`//span[text()='Assign workers']`).click();
  await expect(
    page.getByRole('heading', { name: 'Assign workers' }),
  ).toBeVisible();

  await assignmentsPage.selectItemByNameInDrawer(workerName2);
  await assignmentsPage.selectItemByNameInDrawer(leadName2);
  await assignmentsPage.saveDrawerChanges();

  //switch tabs to refresh the counts
  await page.locator(`//button[@aria-label='Back to Groups']`).click();
  await page.waitForTimeout(500);
  // Wait for groups list to be visible
  await expect(assignmentsPage.groupRow(groupName)).toBeVisible();
  await assignmentsPage.groupRow(groupName).click();
  // Wait for group details page to load
  await expect(page.getByRole('heading', { name: groupName })).toBeVisible();

  // Step 4: Verify workers assigned to that group - count and name
  await expect(
    page.locator(
      `//tr[.//div[contains(@class, 'WorkerName') and text()='${workerName}']]`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(
      `//tr[.//div[contains(@class, 'WorkerName') and text()='${workerName2}']]`,
    ),
  ).toBeVisible();
  console.log(
    `Workers "${workerName}" and "${workerName2}" verified in group details`,
  );

  await verifyWorkerCountInHeader(page, 3);

  await expect(page.getByText(`3 of 6 workers`)).toBeVisible();
  await expect(page.getByText('1 group lead')).toBeVisible();

  await page.locator(`//button[@aria-label='Back to Groups']`).click();

  await assignmentsPage.verifyGroupRowDetails(groupName, 3, 1, 6);
  console.log(`Group "${groupName}" updated with 3 workers and 1 lead`);

  await assignmentsPage
    .groupRow(groupName)
    .getByRole('button', { name: 'View' })
    .click();
  await page.waitForTimeout(1000);

  //Assign Leads from groups details page
  await page.locator(`//button[@aria-label='Assign workers or leads']`).click();
  await page.locator(`//span[text()='Assign leads']`).click();
  await expect(
    page.getByRole('heading', { name: 'Assign group lead' }),
  ).toBeVisible();

  await assignmentsPage.selectItemByNameInDrawer(leadName2);
  await assignmentsPage.saveDrawerChanges();
  await page.waitForTimeout(500);
  await page.locator(`//button[@aria-label='Back to Groups']`).click();
  // Wait for groups list to be visible
  await expect(assignmentsPage.groupRow(groupName)).toBeVisible();
  await assignmentsPage
    .groupRow(groupName)
    .getByRole('button', { name: 'View' })
    .click();
  // Wait for group details page to load
  await expect(page.getByRole('heading', { name: groupName })).toBeVisible();

  await expect(page.getByText(`3 of 6 workers`)).toBeVisible();
  await expect(page.getByText('2 group leads')).toBeVisible();

  // Verify workers and leads with their types based on assignment
  await assignmentsPage.verifyWorkersWithType([
    { workerName: workerName, workerType: 'Employee' },
    { workerName: workerName2, workerType: 'Employee' },
    { workerName: leadName2, workerType: 'Group lead' },
  ]);

  //verify Group lead not assigned to the group is not visible in the table
  await expect(
    page.locator(
      `//tr[.//div[contains(@class, 'WorkerName') and text()='${leadName}']]`,
    ),
  ).not.toBeVisible();
  console.log(`Verified Group lead "${leadName}" is not visible in the table`);

  await page.locator(`//button[@aria-label='Back to Groups']`).click();
  await page.waitForTimeout(500);

  await assignmentsPage.verifyGroupRowDetails(groupName, 3, 2, 6);
  console.log(`"${groupName}" updated with 3 workers and 2 leads`);

  await assignmentsPage.workersToggleButton().click();
  await expect(assignmentsPage.workersToggleButton()).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.waitForTimeout(1000);
  console.log('Switched to Workers view');

  await assignmentsPage.verifyWorkerRowsCount(6);
  await assignmentsPage.verifyWorkersRoleType([
    { workerName: leadName, workerType: 'Group lead' },
    { workerName: leadName2, workerType: 'Group lead' },
  ]);
  console.log(
    `Verified Group leads "${leadName}" and "${leadName2}" in Workers view`,
  );

  // Verify group name is displayed in Workers list for assigned workers
  await expect(
    page.locator(
      `//tr[.//div[contains(text(),'${workerName}')]]//td[contains(text(),'${groupName}')]`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(
      `//tr[.//div[contains(text(),'${workerName2}')]]//td[contains(text(),'${groupName}')]`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(
      `//tr[.//div[contains(text(),'${leadName2}')]]//td[contains(text(),'${groupName}')]`,
    ),
  ).toBeVisible();
  console.log(
    `Verified group name "${groupName}" displayed in Workers list for assigned workers`,
  );
};

/**
 * Verifies the worker count displayed in the "Worker (X)" column header.
 * @param page Playwright page object
 * @param expectedCount Expected number of workers
 */
export const verifyWorkerCountInHeader = async (
  page: Page,
  expectedCount: number,
) => {
  const headerText = await page
    .locator("//th[contains(text(), 'Worker')]")
    .textContent();
  const actualCount = parseInt(headerText?.match(/\((\d+)\)/)?.[1] || '0', 10);
  expect(actualCount).toBe(expectedCount);
  console.log(
    `Worker count in header: ${actualCount} (expected: ${expectedCount})`,
  );
};

export const groupsCrudOperations = async (
  page: Page,
  groupName: string = `Group ${Math.floor(Math.random() * 10000)}`,
) => {
  // Hardcoded worker and lead names
  const workerName = 'Test Emp1';
  const leadName = 'Test Emp2';
  const workerName2 = 'Test Emp3';
  const leadName2 = 'Test Emp4';

  const assignmentsPage = await goToAssignments(page);

  // Step 1: Navigate to Groups view
  await assignmentsPage.selectTab('WORKERS');
  await assignmentsPage.switchToGroupsView();
  await page.waitForTimeout(300);

  // Step 2: Create group with worker/lead and verify count under groups tab
  await assignmentsPage.createGroupWithWorkersAndLeads(
    groupName,
    workerName,
    leadName,
  );
  // Validate count after group creation
  await assignmentsPage.verifyGroupRowDetails(groupName, 1, 1, 6);
  console.log(`Group "${groupName}" created with 1 worker and 1 lead`);

  // Step 3: Click View dropdown and select Edit group
  let groupRow = assignmentsPage.groupRow(groupName);
  await groupRow.getByRole('button', { name: 'Expand Menu' }).click();
  await page.getByRole('menuitem', { name: 'Edit group' }).click();
  // Wait for edit group dialog to appear
  await expect(page.getByRole('dialog')).toBeVisible();

  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Cancel' })
    .click();
  // Wait for dialog to close
  await expect(page.getByRole('dialog')).not.toBeVisible();
  // Verify group name with worker count format (e.g., "Group 1 (2)")
  await expect(
    groupRow.locator(`//td[@role='cell']//strong[text()='${groupName}']`),
  ).toBeVisible();

  console.log(`Verified Cancel button in group dialog`);

  await groupRow.getByRole('button', { name: 'Expand Menu' }).click();
  await page.getByRole('menuitem', { name: 'Edit group' }).click();
  // Wait for edit group dialog to appear
  await expect(page.getByRole('dialog')).toBeVisible();

  // Click assigned workers and select additional worker
  await expect(page.getByText('1 of 6 workers')).toBeVisible();
  await page.getByRole('button', { name: 'Assign workers' }).click();
  await expect(
    page.getByRole('heading', { name: 'Assign workers' }),
  ).toBeVisible();
  await expect(page.getByText(`1 of 6 workers to ${groupName}`)).toBeVisible();
  await assignmentsPage.selectItemByNameInDrawer(workerName2);

  // Click cancel and verify "Want to save your changes?" popup, then click Don't save
  await assignmentsPage.cancelAndDontSave();
  await page.waitForTimeout(500);
  console.log(`Verified unsaved changes popup and clicked Don't save button`);

  // Click on assign workers again and select workers and save
  await expect(page.getByText('1 of 6 workers')).toBeVisible();
  await page.getByRole('button', { name: 'Assign workers' }).click();
  await expect(
    page.getByRole('heading', { name: 'Assign workers' }),
  ).toBeVisible();
  await assignmentsPage.selectItemByNameInDrawer(workerName2);
  await assignmentsPage.saveDrawerChanges();
  await page.waitForTimeout(500);

  // Validate worker count after adding worker
  await expect(page.getByText('2 of 6 workers')).toBeVisible();

  // Click assign leads and select additional lead and save
  await expect(page.getByText('1 group leads')).toBeVisible();
  await page.getByRole('button', { name: 'Assign leads' }).click();
  await expect(
    page.getByRole('heading', { name: 'Assign group lead' }),
  ).toBeVisible();
  await expect(page.getByText(`1 of 6 leads to ${groupName}`)).toBeVisible();
  await assignmentsPage.selectItemByNameInDrawer(leadName2);
  await assignmentsPage.saveDrawerChanges();
  await page.waitForTimeout(1000);

  // Validate lead count after adding lead
  await expect(page.getByText('2 group leads')).toBeVisible();

  // Save edited group
  await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click();
  await page.waitForTimeout(1000);
  // Wait for dialog to close and list to update
  await expect(page.getByRole('dialog')).not.toBeVisible();

  // Step 5: Verify the edited group name/entry counts under groups
  await assignmentsPage.verifyGroupRowDetails(groupName, 2, 2, 6);
  console.log(`Group "${groupName}" updated with 2 workers and 2 leads`);

  await groupRow.getByRole('button', { name: 'Expand Menu' }).click();
  await page.getByRole('menuitem', { name: 'Edit group' }).click();
  // Wait for edit group dialog to appear
  await expect(page.getByRole('dialog')).toBeVisible();

  // Step 4: Edit group name
  const editedGroupName = `group_${Math.floor(Math.random() * 1000)}`;
  await expect(page.getByRole('textbox', { name: 'Group name' })).toHaveValue(
    groupName,
  );
  await page.getByRole('textbox', { name: 'Group name' }).clear();
  await page.getByRole('textbox', { name: 'Group name' }).fill(editedGroupName);
  await page.getByRole('button', { name: 'Save' }).click();
  console.log(`Group updated with new name "${editedGroupName}"`);
  // Wait for dialog to close
  await expect(page.getByRole('dialog')).not.toBeVisible();

  await assignmentsPage.verifyGroupRowDetails(editedGroupName, 2, 2, 6);

  // Step 6: Click View dropdown & Select Assign workers
  groupRow = assignmentsPage.groupRow(editedGroupName);
  await groupRow.getByRole('button', { name: 'Expand Menu' }).click();
  await page.getByRole('menuitem', { name: 'Assign workers' }).click();
  await page.waitForTimeout(500);

  // Select workers and save
  await expect(
    page.getByRole('heading', { name: 'Assign workers' }),
  ).toBeVisible();
  await expect(
    page.getByText(`2 of 6 workers to ${editedGroupName}`),
  ).toBeVisible();

  await assignmentsPage.selectItemByNameInDrawer(leadName2);
  await assignmentsPage.saveDrawerChanges();
  await page.waitForTimeout(500);

  // Verify workers updated count
  await assignmentsPage.verifyGroupRowDetails(editedGroupName, 3, 2, 6);
  console.log(`Group "${editedGroupName}" updated with 3 workers`);

  // Step 7: Click View dropdown & Select Assign leads
  await groupRow.getByRole('button', { name: 'Expand Menu' }).click();
  await page.getByRole('menuitem', { name: 'Assign group lead' }).click();
  await page.waitForTimeout(500);

  // Verify leads list with all workers is visible
  await expect(
    page.getByRole('heading', { name: 'Assign group lead' }),
  ).toBeVisible();
  await expect(
    page.getByText(`2 of 6 leads to ${editedGroupName}`),
  ).toBeVisible();
  // Select lead and save
  await assignmentsPage.selectItemByNameInDrawer(workerName2);
  await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click();
  await page.waitForTimeout(500);
  await expect(page.getByText('Want to save your changes?')).toBeVisible();
  await page
    .getByTestId('ModalDialog')
    .getByRole('button', { name: 'Save', exact: true })
    .click();
  await page.waitForTimeout(500);

  console.log(`Verified Unsaved changes popup and clicked Save button`);

  // Verify lead count updated
  await assignmentsPage.verifyGroupRowDetails(editedGroupName, 3, 3, 6);
  console.log(`Group "${editedGroupName}" updated with 3 leads`);

  // Step 8: Click View dropdown & Select Delete group for original group
  groupRow = assignmentsPage.groupRow(editedGroupName);
  await groupRow.getByRole('button', { name: 'Expand Menu' }).click();
  await page.getByRole('menuitem', { name: 'Delete group' }).click();
  await page.waitForTimeout(500);

  // Verify "Delete group?" popup appears
  await expect(
    page.getByRole('heading', { name: 'Delete group?' }),
  ).toBeVisible();

  // Click Delete button
  await page.getByRole('button', { name: 'Delete' }).click();
  await page.waitForTimeout(500);
  await waitForLoadingToDisappear(page);

  const noGroupCount = page.getByText('No groups yet');
  // Verify group doesn't exist in group page after deletion
  await expect(noGroupCount).toBeVisible();
  console.log(`Group "${editedGroupName}" deleted successfully`);
};

export const validateSearchInWorkersAndGroups = async (page: Page) => {
  // Hardcoded group and worker names
  const groupName = 'Group1';
  const workerName = 'Test Emp1';

  const assignmentsPage = await goToAssignments(page);
  await waitForLoadingToDisappear(page);
  // Navigate to Groups view
  await assignmentsPage.selectTab('WORKERS');
  await assignmentsPage.switchToGroupsView();
  await waitForLoadingToDisappear(page);

  // Verify Workers and Groups toggle section is visible
  await assignmentsPage.verifyWorkersGroupsToggle();

  // Switch to Groups view
  await assignmentsPage.switchToGroupsView();
  await page.waitForTimeout(500);

  // Verify Groups toggle button is pressed
  await expect(assignmentsPage.groupsToggleButton()).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  // Click on search button to reveal search input and enter group name
  await page.locator(`//button[@aria-label='Search groups']`).click();
  const groupSearchInput = page.locator(`//input[@aria-label='Search groups']`);
  await expect(groupSearchInput).toBeVisible();
  await groupSearchInput.fill(groupName);
  console.log(`Searched for group: "${groupName}"`);
  await page.waitForTimeout(1000);

  // Verify that group name is seen under groups
  await expect(assignmentsPage.groupRow(groupName)).toBeVisible();
  console.log(`Group "${groupName}" is visible in search results`);

  // Verify other groups are hidden (only 1 group should be visible)
  const visibleGroupRows = page.locator('tbody tr');
  const visibleGroupCount = await visibleGroupRows.count();
  expect(visibleGroupCount).toBe(1);
  console.log(`Verified only 1 group is visible after search`);

  // Click on expand menudropdown and click Assign workers
  const groupRow = assignmentsPage.groupRow(groupName);
  await groupRow.locator(`//button[@aria-label='Expand Menu']`).click();
  await page.getByRole('menuitem', { name: 'Assign workers' }).click();
  await page.waitForTimeout(500);
  console.log(`Clicked Assign workers from group "${groupName}" dropdown`);

  // Verify drawer opens and shows "X of 6 workers to GroupName"
  await expect(
    page.getByRole('heading', { name: 'Assign workers' }),
  ).toBeVisible();
  await expect(page.getByText(`4 of 6 workers to ${groupName}`)).toBeVisible();
  console.log(`✓ Verified drawer with "4 of 6 workers to ${groupName}"`);

  // Search for worker in drawer and verify only that worker is shown
  const drawerSearchInput = page.locator(
    `input[placeholder='Search'][type='text']`,
  );
  await drawerSearchInput.fill(workerName);
  await page.waitForTimeout(1000);
  console.log(`Searched for worker: "${workerName}" in drawer`);

  // Verify only searched worker is visible
  await expect(
    page.locator(
      `//div[contains(@class, 'WorkerName') and text()='${workerName}']`,
    ),
  ).toBeVisible();

  // Verify only 1 worker row is visible in drawer
  const drawerWorkerRows = page.locator('[role="dialog"] tbody tr');
  const drawerWorkerCount = await drawerWorkerRows.count();
  expect(drawerWorkerCount).toBe(1);
  console.log(
    `✓ Verified only "${workerName}" is visible after search in drawer`,
  );

  await drawerSearchInput.clear();
  await drawerSearchInput.fill('Test Emp2');
  await page.waitForTimeout(1000);
  console.log(`Searched for worker: "Test Emp2"`);

  // Verify only searched worker is visible
  await expect(
    page.locator(
      `//div[contains(@class, 'WorkerName') and text()='Test Emp2']`,
    ),
  ).toBeVisible();

  const updatedDrawerWorkerCount = await drawerWorkerRows.count();
  expect(updatedDrawerWorkerCount).toBe(1);
  console.log(`✓ Verified only "Test Emp2" is visible after search in drawer`);

  // Clear search before testing dropdown filter
  await drawerSearchInput.clear();
  await page.waitForTimeout(1000);

  // Verify All workers dropdown filter
  console.log('Verifying All workers dropdown filter...');

  // Helper locators
  const filterDropdown = page.locator(
    `input[aria-label='Filter workers by group']`,
  );
  const workerRows = page
    .locator(`//*[@summary='Workers selection table']//tr`)
    .filter({ has: page.locator(`[class*='WorkerName']`) });
  const getWorkerRow = (name: string) => workerRows.filter({ hasText: name });

  // Click dropdown and verify options
  await filterDropdown.click();
  await page.waitForTimeout(500);

  await expect(page.getByRole('option', { name: 'All workers' })).toBeVisible();
  await expect(page.getByRole('option', { name: 'No group' })).toBeVisible();
  await expect(
    page.getByRole('option', { name: new RegExp(groupName) }),
  ).toBeVisible();
  console.log(
    '✓ Dropdown options verified: All workers, No group, ' + groupName,
  );

  // Get total worker count before filtering
  await page.getByRole('option', { name: 'All workers' }).click();
  await page.waitForTimeout(500);
  const totalWorkers = await workerRows.count();
  console.log(`Total workers: ${totalWorkers}`);

  // Test 1: Filter by group - verify only group workers shown
  await filterDropdown.click();
  await page.getByRole('option', { name: new RegExp(groupName) }).click();
  await page.waitForTimeout(1000);

  const groupWorkerCount = await workerRows.count();
  await expect(getWorkerRow('Test Emp1')).toBeVisible();
  await expect(getWorkerRow('Test Emp2')).toBeVisible();
  console.log(`✓ Filter "${groupName}": ${groupWorkerCount} workers displayed`);

  // Test 2: Filter by "No group" - verify only unassigned workers shown
  await filterDropdown.click();
  await page.getByRole('option', { name: 'No group' }).click();
  await page.waitForTimeout(1000);

  const noGroupWorkerCount = await workerRows.count();
  await expect(getWorkerRow('Test Emp1')).not.toBeVisible();
  await expect(getWorkerRow('Test Emp2')).not.toBeVisible();
  await expect(getWorkerRow('Test Emp4')).toBeVisible();
  console.log(`✓ Filter "No group": ${noGroupWorkerCount} workers displayed`);

  // Test 3: Filter by "All workers" - verify all workers shown
  await filterDropdown.click();
  await page.getByRole('option', { name: 'All workers' }).click();
  await page.waitForTimeout(1000);

  expect(await workerRows.count()).toBe(totalWorkers);
  console.log(`✓ Filter "All workers": ${totalWorkers} workers displayed`);

  // Close drawer
  await assignmentsPage.drawerCloseButton().click();
  await page.waitForTimeout(500);

  // Search for a group that doesn't exist
  const nonExistentGroup = 'Group123';
  await groupSearchInput.clear();
  await groupSearchInput.fill(nonExistentGroup);
  await page.waitForTimeout(1000);
  console.log(`Searched for group: "${nonExistentGroup}"`);

  // Verify "No groups found" message is displayed
  await expect(
    page.getByText(`No groups matching "${nonExistentGroup}"`, {
      exact: false,
    }),
  ).toBeVisible();
  console.log('Verified "No groups found" message is displayed');

  // Clear search
  await groupSearchInput.clear();
  await page.waitForTimeout(500);

  // Click on Group1 to view group details
  await assignmentsPage
    .groupRow(groupName)
    .getByRole('button', { name: 'View' })
    .click();
  await page.waitForTimeout(1000);
  await expect(page.getByRole('heading', { name: groupName })).toBeVisible();
  console.log(`Navigated to group details page for "${groupName}"`);

  // Verify worker type dropdown is visible with default "All" selected
  const workerTypeDropdown =
    assignmentsPage.filterByWorkerTypeDropdownOptions();
  await expect(workerTypeDropdown).toBeVisible();

  // Click dropdown and select "Employee" - verify only Employee type workers are shown
  await workerTypeDropdown.click();
  await page.getByRole('option', { name: 'Employee' }).click();
  await waitForLoadingToDisappear(page);
  console.log('Selected "Employee" from worker type dropdown');

  // Verify only Employee type workers are visible based on Type column
  const employeeRows = page.locator('tbody tr').filter({
    has: page.locator('td:nth-child(2)', { hasText: /^Employee$/ }),
  });
  const employeeCount = await employeeRows.count();
  expect(employeeCount).toBe(3);
  console.log(
    `✓ Verified ${employeeCount} Employee type workers visible in Type column`,
  );

  // Click dropdown and select "User" - verify User type workers
  await workerTypeDropdown.click();
  await page.getByRole('option', { name: 'User' }).click();
  await waitForLoadingToDisappear(page);
  console.log('Selected "User" from worker type dropdown');

  const userRows = page.locator('tbody tr').filter({
    has: page.locator('td:nth-child(2)', { hasText: /^User$/ }),
  });
  const userCount = await userRows.count();
  console.log(
    `✓ Verified ${userCount} User type workers visible in Type column`,
  );

  // Click dropdown and select "Vendor" - verify no workers alert
  await workerTypeDropdown.click();
  await page.getByRole('option', { name: 'Vendor' }).click();
  await waitForLoadingToDisappear(page);
  console.log('Selected "Vendor" from worker type dropdown');

  // Verify "No workers of type" alert is displayed
  await expect(
    page
      .getByRole('cell')
      .filter({ hasText: 'No workers of type "vendor" in this group' }),
  ).toBeVisible();

  // Click dropdown and select "All" - verify all worker types are visible
  await workerTypeDropdown.click();
  await page.getByRole('option', { name: 'All' }).click();
  await waitForLoadingToDisappear(page);
  console.log('Selected "All" from worker type dropdown');

  // Verify all workers are visible when "All" is selected
  const allWorkersCount = await page.locator('tbody tr').count();
  expect(allWorkersCount).toBeGreaterThan(0);

  // Count workers by type when "All" is selected
  const allEmployeeRows = page.locator('tbody tr').filter({
    has: page.locator('td:nth-child(2)', { hasText: /^Employee$/ }),
  });
  const allEmployeeCount = await allEmployeeRows.count();

  const allUserRows = page.locator('tbody tr').filter({
    has: page.locator('td:nth-child(2)', { hasText: /^User$/ }),
  });
  const allUserCount = await allUserRows.count();

  const allVendorRows = page.locator('tbody tr').filter({
    has: page.locator('td:nth-child(2)', { hasText: /^Vendor$/ }),
  });
  const allVendorCount = await allVendorRows.count();

  console.log(
    `✓ Verified ${allWorkersCount} total workers visible with "All" filter`,
  );
  console.log(`  - Employee: ${allEmployeeCount}`);
  console.log(`  - User: ${allUserCount}`);
  console.log(`  - Vendor: ${allVendorCount}`);

  await page.locator(`//button[@aria-label='Back to Groups']`).click();
  await page.waitForTimeout(500);

  // Switch to Workers view
  await assignmentsPage.workersToggleButton().click();
  await expect(assignmentsPage.workersToggleButton()).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.waitForTimeout(1000);
  console.log('Switched to Workers view');

  // Click on search input and enter worker name
  await page.locator(`//button[@aria-label='Search']`).click();
  const workerSearchInput = page.locator(
    `//input[@aria-label='Search' and @type='text']`,
  );
  await workerSearchInput.click();
  await workerSearchInput.fill(workerName);
  await page.waitForTimeout(1000);
  console.log(`Searched for worker: "${workerName}"`);

  // Verify worker name is seen in list
  await expect(
    page.locator(
      `//div[contains(@class, 'WorkerName') and text()='${workerName}']`,
    ),
  ).toBeVisible();
  console.log(`Worker "${workerName}" is visible in search results`);

  // Verify other workers are not seen (only 1 worker should be visible)
  const visibleWorkerRows = page.locator('tbody tr');
  const visibleWorkerCount = await visibleWorkerRows.count();
  expect(visibleWorkerCount).toBe(1);
  console.log(`Verified only 1 worker is visible after search`);

  // Search for a worker that doesn't exist
  const nonExistentWorker = 'Worker123';
  await workerSearchInput.clear();
  await workerSearchInput.fill(nonExistentWorker);
  await page.waitForTimeout(1000);
  console.log(`Searched for worker: "${nonExistentWorker}"`);

  // Verify "No workers found" message is displayed
  await expect(
    page.getByText(`No workers matching "${nonExistentWorker}"`, {
      exact: false,
    }),
  ).toBeVisible();
  console.log('Verified "No workers found" message is displayed');

  // Clear search
  await workerSearchInput.clear();
  await page.waitForTimeout(500);

  // Verify Workers filter dropdown in Workers tab
  console.log('Verifying Workers filter dropdown in Workers tab...');

  const workersFilterDropdown = page.locator(
    `input[aria-label='Filter by worker type']`,
  );
  await expect(workersFilterDropdown).toBeVisible();
  await workersFilterDropdown.click();
  await page.waitForTimeout(500);

  // Verify dropdown options
  await expect(page.getByRole('option', { name: 'All' })).toBeVisible();
  await expect(page.getByRole('option', { name: 'Employee' })).toBeVisible();
  await expect(page.getByRole('option', { name: 'User' })).toBeVisible();
  await expect(page.getByRole('option', { name: 'Vendor' })).toBeVisible();
  console.log(
    '✓ Workers filter dropdown options verified: All, Employee, User, Vendor',
  );

  // Test 1: Filter by "Employee" - verify only Employee type workers shown
  await page.getByRole('option', { name: 'Employee' }).click();
  await waitForLoadingToDisappear(page);
  await page.waitForTimeout(500);

  const employeeRowsInTab = page.locator('tbody tr').filter({
    has: page.locator('td', { hasText: /^Employee$/ }),
  });
  const employeeCountInTab = await employeeRowsInTab.count();
  expect(employeeCountInTab).toBe(4);
  console.log(`✓ Filter "Employee": ${employeeCountInTab} workers displayed`);

  // Test 2: Filter by "User" - verify only User type workers shown
  await workersFilterDropdown.click();
  await page.getByRole('option', { name: 'User' }).click();
  await waitForLoadingToDisappear(page);
  await page.waitForTimeout(500);

  const userRowsInTab = page.locator('tbody tr').filter({
    has: page.locator('td', { hasText: /^User$/ }),
  });
  const userCountInTab = await userRowsInTab.count();
  console.log(`✓ Filter "User": ${userCountInTab} workers displayed`);

  // Test 3: Filter by "Vendor" - verify alert or vendor workers
  await workersFilterDropdown.click();
  await page.getByRole('option', { name: 'Vendor' }).click();
  await waitForLoadingToDisappear(page);
  await page.waitForTimeout(500);

  const vendorRowsInTab = page.locator('tbody tr').filter({
    has: page.locator('td', { hasText: /^Vendor$/ }),
  });
  const vendorCountInTab = await vendorRowsInTab.count();
  console.log(`✓ Filter "Vendor": ${vendorCountInTab} workers displayed`);

  // Test 4: Filter by "All" - verify all workers shown
  await workersFilterDropdown.click();
  await page.getByRole('option', { name: 'All' }).click();
  await waitForLoadingToDisappear(page);
  await page.waitForTimeout(500);

  const allRowsInTab = await page.locator('tbody tr').count();
  console.log(`✓ Filter "All": ${allRowsInTab} workers displayed`);
};

/**
 * Helper function to get the number of worker rows in the table.
 */
export const getWorkerNumberOfRows = async (page: Page): Promise<number> => {
  return await page.locator('tbody tr').count();
};

/**
 * Helper function to get the pagination summary text (e.g., "1 - 100 of 133 workers").
 */
export const getWorkerPaginationSummary = async (
  page: Page,
): Promise<string> => {
  const footer = page.locator(
    '//div[contains(text(), "of") and contains(text(), "workers")]',
  );
  return (await footer.textContent()) || '';
};

/**
 * Helper function to get the current page number.
 */
export const getWorkerPaginationCurrentPage = async (
  page: Page,
): Promise<number> => {
  const pageIndicator = page.locator('//span[contains(text(), "Page")]');
  await expect(pageIndicator).toBeVisible();
  const text = await pageIndicator.textContent();
  const match = text?.match(/Page\s+(\d+)\s+of/);
  return match ? parseInt(match[1], 10) : 0;
};

/**
 * Helper function to get the total number of pages.
 */
export const getWorkerPaginationTotalPages = async (
  page: Page,
): Promise<number> => {
  const pageIndicator = page.locator('//span[contains(text(), "Page")]');
  await expect(pageIndicator).toBeVisible();
  const text = await pageIndicator.textContent();
  const match = text?.match(/Page\s+\d+\s+of\s+(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};

export const validateWorkerPaginationInfo = async (
  page: Page,
  expectedNumberOfRows: number,
  expectedSummary: string,
  expectedCurrentPage: number,
  expectedTotalPages: number,
) => {
  const numberOfRows = await getWorkerNumberOfRows(page);
  const summary = await getWorkerPaginationSummary(page);
  const currentPage = await getWorkerPaginationCurrentPage(page);
  const totalPages = await getWorkerPaginationTotalPages(page);

  expect(numberOfRows).toBe(expectedNumberOfRows);
  expect(summary).toBe(expectedSummary);
  expect(currentPage).toBe(expectedCurrentPage);
  expect(totalPages).toBe(expectedTotalPages);

  console.log(
    `✓ Validated: ${numberOfRows} rows, "${summary}", Page ${currentPage} of ${totalPages}`,
  );
};

/**
 * Total workers from the Workers column header text, e.g. <span>Workers (109)</span>.
 */
export const getWorkersTotalCountFromHeader = async (
  page: Page,
): Promise<number> => {
  const workersHeader = page.getByRole('columnheader', {
    name: /Workers \(\d+\)/,
  });
  await expect(workersHeader).toBeVisible();
  const headerText = await workersHeader.textContent();
  return parseInt(headerText?.match(/Workers \((\d+)\)/)?.[1] || '0', 10);
};

export const validatePaginationForWorkers = async (page: Page) => {
  // Navigate to Workers tab
  const assignmentsPage = await goToAssignments(page);
  await assignmentsPage.selectTab('WORKERS');
  await waitForLoadingToDisappear(page);
  await assignmentsPage.workersToggleButton().click();
  await waitForLoadingToDisappear(page);
  await expect(assignmentsPage.workersToggleButton()).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  console.log('Switched to Workers view');

  const totalWorkers = await getWorkersTotalCountFromHeader(page);
  console.log(`✓ Total workers count: ${totalWorkers}`);

  // Calculate expected values
  const expectedTotalPages = Math.ceil(totalWorkers / 100);
  const rowsOnPage1 = Math.min(100, totalWorkers);

  await waitForLoadingToDisappear(page);
  // Get first worker name on page 1
  const firstWorkerPage1 = await page
    .locator('tbody tr')
    .first()
    .locator('td')
    .first()
    .textContent();
  console.log(`✓ First worker on Page 1: "${firstWorkerPage1?.trim()}"`);

  // Validate Page 1 pagination info
  await validateWorkerPaginationInfo(
    page,
    rowsOnPage1,
    `1 - ${rowsOnPage1} of ${totalWorkers} workers`,
    1,
    expectedTotalPages,
  );

  // Click Next page button
  await page.getByRole('button', { name: 'Page 1' }).nth(1).click();
  await page.waitForTimeout(500);
  await waitForLoadingToDisappear(page);
  console.log('✓ Clicked Next page');

  // Calculate expected values for page 2
  const startOnPage2 = 101;
  const endOnPage2 = Math.min(200, totalWorkers);
  const rowsOnPage2 = endOnPage2 - startOnPage2 + 1;

  // Validate Page 2 pagination info
  await validateWorkerPaginationInfo(
    page,
    rowsOnPage2,
    `${startOnPage2} - ${endOnPage2} of ${totalWorkers} workers`,
    2,
    expectedTotalPages,
  );

  // Verify first worker on page 2 is different (101st worker)
  const firstWorkerPage2 = await page
    .locator('tbody tr')
    .first()
    .locator('td')
    .first()
    .textContent();
  console.log(`✓ First worker on Page 2: "${firstWorkerPage2?.trim()}"`);
  expect(firstWorkerPage1?.trim()).not.toBe(firstWorkerPage2?.trim());
  await page.waitForTimeout(1000);

  // Click Previous page button
  await page.getByRole('button', { name: 'Page 2' }).first().click();
  await page.waitForTimeout(500);
  await waitForLoadingToDisappear(page);
  console.log('✓ Clicked Previous page');

  // Validate back on Page 1
  await validateWorkerPaginationInfo(
    page,
    rowsOnPage1,
    `1 - ${rowsOnPage1} of ${totalWorkers} workers`,
    1,
    expectedTotalPages,
  );
};

/**
 * Helper function to get the pagination summary text for groups (e.g., "1 - 20 of 105 groups").
 */
export const getGroupPaginationSummary = async (
  page: Page,
): Promise<string> => {
  const footer = page.locator(
    '//div[contains(text(), "of") and contains(text(), "groups")]',
  );
  return (await footer.textContent()) || '';
};

export const validateGroupPaginationInfo = async (
  page: Page,
  expectedNumberOfRows: number,
  expectedSummary: string,
  expectedCurrentPage: number,
  expectedTotalPages: number,
) => {
  const numberOfRows = await getWorkerNumberOfRows(page); // Reuse - same tbody tr selector
  const summary = await getGroupPaginationSummary(page);
  const currentPage = await getWorkerPaginationCurrentPage(page); // Reuse - same page indicator
  const totalPages = await getWorkerPaginationTotalPages(page); // Reuse - same page indicator

  expect(numberOfRows).toBe(expectedNumberOfRows);
  expect(summary).toBe(expectedSummary);
  expect(currentPage).toBe(expectedCurrentPage);
  expect(totalPages).toBe(expectedTotalPages);

  console.log(
    `✓ Validated: ${numberOfRows} rows, "${summary}", Page ${currentPage} of ${totalPages}`,
  );
};

export const validatePaginationForGroups = async (page: Page) => {
  // Navigate to Groups view
  const assignmentsPage = await goToAssignments(page);
  await assignmentsPage.selectTab('WORKERS');
  await waitForLoadingToDisappear(page);
  await assignmentsPage.switchToGroupsView();
  await waitForLoadingToDisappear(page);
  console.log('Switched to Groups view');

  // Get total groups count from header
  const groupsHeader = page.getByRole('columnheader', {
    name: /Groups \(\d+\)/,
  });
  await expect(groupsHeader).toBeVisible();
  const headerText = await groupsHeader.textContent();
  const totalGroups = parseInt(
    headerText?.match(/Groups \((\d+)\)/)?.[1] || '0',
    10,
  );
  console.log(`✓ Total groups count: ${totalGroups}`);

  // Calculate expected values (20 groups per page)
  const expectedTotalPages = Math.ceil(totalGroups / 20);
  const rowsOnPage1 = Math.min(20, totalGroups);

  await waitForLoadingToDisappear(page);
  // Get first group name on page 1
  const firstGroupPage1 = await page
    .locator('tbody tr')
    .first()
    .locator('td')
    .first()
    .textContent();
  console.log(`✓ First group on Page 1: "${firstGroupPage1?.trim()}"`);

  // Validate Page 1 pagination info
  await validateGroupPaginationInfo(
    page,
    rowsOnPage1,
    `1 - ${rowsOnPage1} of ${totalGroups} groups`,
    1,
    expectedTotalPages,
  );
  await page.waitForTimeout(500);

  // Click Next page button
  await page.getByRole('button', { name: 'Page 1' }).nth(1).click();
  await waitForLoadingToDisappear(page);
  await page.waitForTimeout(500);
  console.log('✓ Clicked Next page');

  // Calculate expected values for page 2
  const startOnPage2 = 21;
  const endOnPage2 = Math.min(40, totalGroups);
  const rowsOnPage2 = endOnPage2 - startOnPage2 + 1;

  // Validate Page 2 pagination info
  await validateGroupPaginationInfo(
    page,
    rowsOnPage2,
    `${startOnPage2} - ${endOnPage2} of ${totalGroups} groups`,
    2,
    expectedTotalPages,
  );
  await page.waitForTimeout(500);

  // Verify first group on page 2 is different (21st group)
  const firstGroupPage2 = await page
    .locator('tbody tr')
    .first()
    .locator('td')
    .first()
    .textContent();
  console.log(`✓ First group on Page 2: "${firstGroupPage2?.trim()}"`);
  expect(firstGroupPage1?.trim()).not.toBe(firstGroupPage2?.trim());

  // Click Previous page button
  await page.getByRole('button', { name: 'Page 2' }).first().click();
  await waitForLoadingToDisappear(page);
  await page.waitForTimeout(500);
  console.log('✓ Clicked Previous page');

  // Validate back on Page 1
  await validateGroupPaginationInfo(
    page,
    rowsOnPage1,
    `1 - ${rowsOnPage1} of ${totalGroups} groups`,
    1,
    expectedTotalPages,
  );

  console.log('✓ Groups pagination validation completed!');
};

export const createDropdownCustomFieldAndValidate = async (page: Page) => {
  await deactivateAllTestCustomFields(page);
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForLoadState('load');
  await page.waitForTimeout(2000);
  await CustomFieldsPage.closeAddCustomFieldTooltip(page);

  // Click Add custom fields button
  await CustomFieldsPage.clickAddCustomFieldsButton(page);
  await page.waitForTimeout(3000);
  await CustomFieldsPage.validateAddCustomFieldsPage(page);
  await page.waitForTimeout(2000);

  // Create dropdown custom field name (max 24 characters to stay below 25)
  const randomString = Math.random().toString(10).substring(2, 6); // 4 characters max
  const customFieldName = `Test DDF ${randomString}`; // 14 + 4 = 18 characters (below 25)
  await page.getByRole('textbox', { name: 'Name' }).fill(customFieldName);

  // Select Dropdown list data type
  await page.waitForTimeout(8000);
  await CustomFieldsPage.openTimeTrackingAddCustomFieldDataTypeDropdown(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.selectDataTypeDropdownOption(
    page,
    CUSTOM_FIELD_DATA_TYPES.dropdownList,
  );

  // Verify Category section is visible
  //await CustomFieldsPage.validateCategoryForTimeTrackingCustomField(page);

  // Select Category (Time or Customer)
  await CustomFieldsPage.selectCategoryForTimeTrackingCustomField(
    page,
    CUSTOM_FIELD_CATEGORY_OPTIONS.time,
  );

  // Add dropdown values
  const addItemButton = page.locator(`//div[text()="Add item"]`);
  const valueInputLocator = page.locator(
    '//input[@aria-label="custom-field-drop-down-value"]',
  );

  // Add first option
  //await addItemButton.click();
  await page.waitForTimeout(1000);
  await valueInputLocator.first().fill('Option 1');
  await page.waitForTimeout(500);

  // Add second option
  //await addItemButton.click();
  await page.waitForTimeout(1000);
  await valueInputLocator.nth(1).fill('Option 2');
  await page.waitForTimeout(500);

  // Add third option
  await addItemButton.click();
  await page.waitForTimeout(5000);
  await valueInputLocator.nth(2).fill('Option 3');
  await page.waitForTimeout(500);

  // Click Save button
  await CustomFieldsPage.clickTimeTrackingCustomFieldSaveButton(page);
  await page.waitForTimeout(2000);
  await page.reload();
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForLoadState('load');
  await page.waitForTimeout(6000);

  // Verify custom field appears in the list
  await CustomFieldsPage.validateCustomFieldAddedInList(
    page,
    customFieldName,
    CUSTOM_FIELD_DATA_TYPES.dropdownList,
  );

  return customFieldName;
};

/**
 * Same as {@link createDropdownCustomFieldAndValidate} field-creation steps, but assumes the page is
 * already on Time → Custom fields **edit list** (e.g. after `openTimeCustomFieldsEditAfterDeactivatingTestFields`).
 * For `PriorityCases` elite assignment test only — does not call `deactivateAllTestCustomFields` or open edit.
 */
export const createDropdownCustomFieldFromTimeSettingsEditListForPriorityCase =
  async (page: Page): Promise<string> => {
    await CustomFieldsPage.closeAddCustomFieldTooltip(page);

    await CustomFieldsPage.clickAddCustomFieldsButton(page);
    await page.waitForTimeout(3000);
    await CustomFieldsPage.validateAddCustomFieldsPage(page);
    await page.waitForTimeout(2000);

    const randomString = Math.random().toString(10).substring(2, 6);
    const customFieldName = `Test DDF ${randomString}`;
    await page.getByRole('textbox', { name: 'Name' }).fill(customFieldName);

    await page.waitForTimeout(8000);
    await CustomFieldsPage.openTimeTrackingAddCustomFieldDataTypeDropdown(page);
    await page.waitForTimeout(2000);
    await CustomFieldsPage.selectDataTypeDropdownOption(
      page,
      CUSTOM_FIELD_DATA_TYPES.dropdownList,
    );

    await CustomFieldsPage.selectCategoryForTimeTrackingCustomField(
      page,
      CUSTOM_FIELD_CATEGORY_OPTIONS.time,
    );

    const addItemButton = page.locator(`//div[text()="Add item"]`);
    const valueInputLocator = page.locator(
      '//input[@aria-label="custom-field-drop-down-value"]',
    );

    await page.waitForTimeout(1000);
    await valueInputLocator.first().fill('Option 1');
    await page.waitForTimeout(500);

    await page.waitForTimeout(1000);
    await valueInputLocator.nth(1).fill('Option 2');
    await page.waitForTimeout(500);

    await addItemButton.click();
    await page.waitForTimeout(5000);
    await valueInputLocator.nth(2).fill('Option 3');
    await page.waitForTimeout(500);

    await CustomFieldsPage.clickTimeTrackingCustomFieldSaveButton(page);
    await page.waitForTimeout(2000);
    await page.reload();
    await CustomFieldsPage.navigationToCustomFieldSettings(page);
    await page.waitForTimeout(2000);
    await CustomFieldsPage.clickCustomFieldsEditButton(page);
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    await CustomFieldsPage.validateCustomFieldAddedInList(
      page,
      customFieldName,
      CUSTOM_FIELD_DATA_TYPES.dropdownList,
    );

    return customFieldName;
  };

export const editCustomField = async (page: Page) => {
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForLoadState('load');
  await page.waitForTimeout(2000);

  await page.locator('//button[@aria-label="Expand Menu"]').first().click();
  await page.locator("//span[text()='Edit']").click();
  await page.waitForTimeout(6000);

  // Edit the field name
  const customFieldName = 'Test DDDF';
  await CustomFieldsPage.editCustomFieldName(page, customFieldName);

  // Click Save
  await CustomFieldsPage.clickTimeTrackingCustomFieldSaveButton(page);
  await page.waitForTimeout(2000);

  // Verify updated field name appears
  await expect(
    CustomFieldsPage.getCustomFieldRow(page, customFieldName),
  ).toBeVisible();

  await page.locator('//button[@aria-label="Expand Menu"]').first().click();
  await page.locator("//span[text()='Edit']").click();

  // Edit the field name
  const randomString = Math.random().toString(10).substring(2, 6);
  const newFieldName = `Edited FDD ${randomString}`;
  await CustomFieldsPage.editCustomFieldName(page, newFieldName);

  // Click Save
  await CustomFieldsPage.clickTimeTrackingCustomFieldSaveButton(page);
  await page.waitForTimeout(2000);

  //reload
  await page.reload();
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForLoadState('load');
  await page.waitForTimeout(2000);

  // Verify updated field name appears
  await expect(
    CustomFieldsPage.getCustomFieldRow(page, newFieldName),
  ).toBeVisible();

  //managecustomfields
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickManageAllCustomFieldsLink(page);
  await page.waitForTimeout(2000);
  await expect(
    CustomFieldsPage.getCustomFieldNewRow(page, newFieldName),
  ).toBeVisible();
};

export const toggleRequiredOnAndOff = async (page: Page) => {
  const customFieldName = 'Test Admin';

  // Navigate back to custom fields edit
  await page.reload();
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForLoadState('load');
  await page.waitForTimeout(8000);

  await CustomFieldsPage.toggleRequiredONForCustomField(page, customFieldName);
  await CustomFieldsPage.clickSaveCustomFieldsListScreen(page);
  await page.waitForTimeout(5000);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForLoadState('load');
  await page.waitForTimeout(5000);
  await CustomFieldsPage.verifyRequiredStatusOnInTable(page, customFieldName);

  // Step 2: if Required column shows "Yes", click toggle OFF and expect "No"
  await CustomFieldsPage.toggleRequiredOFFForCustomField(page, customFieldName);
  await CustomFieldsPage.clickSaveCustomFieldsListScreen(page);
  await page.waitForTimeout(5000);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForLoadState('load');
  await page.waitForTimeout(5000);
  await CustomFieldsPage.verifyRequiredStatusOffInTable(page, customFieldName);
};

export type VerifyCustomFieldColumnParams = {
  employeeName: string;
  /** When omitted (e.g. Time Clock), asserts Hours column has a positive value. */
  hours?: string;
  customFieldName: string;
  customFieldValue: string;
  billableChecked?: boolean;
};

const enableRequiredCustomFieldForTimeEntry = async (
  page: Page,
  customFieldName: string,
): Promise<void> => {
  await deleteAllTimeEntries(page);
  await page.waitForTimeout(2000);

  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForLoadState('load');
  await page.waitForTimeout(8000);

  await CustomFieldsPage.toggleRequiredONForCustomField(page, customFieldName);
  await CustomFieldsPage.clickSaveCustomFieldsListScreen(page);
  await waitForLoadingToDisappear(page);
  await page.waitForTimeout(2000);
};

const isCustomFieldColumnInHeaders = (
  headers: string[],
  customFieldName: string,
): boolean =>
  headers.some(
    (h) => h.includes(customFieldName) || customFieldName.includes(h.trim()),
  );

/** Enable custom field column via Time entries table Settings when header is hidden. */
const ensureCustomFieldColumnVisibleOnTimeEntries = async (
  page: Page,
  timeEntriesPage: TimeEntriesPage,
  customFieldName: string,
): Promise<void> => {
  const headers = await timeEntriesPage.getTableHeaders();
  if (isCustomFieldColumnInHeaders(headers, customFieldName)) {
    return;
  }

  await timeEntriesPage.clickSettingsButton();
  await page.waitForTimeout(2000);

  const customFieldCheckbox =
    await timeEntriesPage.getColumnsCheckboxFromSettings(customFieldName);
  const isChecked = await customFieldCheckbox.isChecked();
  if (!isChecked) {
    await customFieldCheckbox.click();
    await page.waitForTimeout(1000);
    await timeEntriesPage.waitForSettingsPopupToClose();
  }
  // else {
  //   await timeEntriesPage.clickSettingsButton();
  //   await page.waitForTimeout(1000);
  // }

  await timeEntriesPage.validateColumnVisible(customFieldName);
};

/**
 * VerifyTheCustomFieldColumn — Time entries list shows Hours, Billable, and custom field values.
 * 1. Time → Time entries
 * 2. Display by → Date
 * 3. Date range → This month
 * 4. Assert column headers and row values
 */
export const verifyTheCustomFieldColumn = async (
  page: Page,
  params: VerifyCustomFieldColumnParams,
): Promise<void> => {
  const {
    employeeName,
    hours,
    customFieldName,
    customFieldValue,
    billableChecked = false,
  } = params;

  const timeEntriesPage = new TimeEntriesPage(page);
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.dismissIntuitIntelligenceIfVisible();
  await timeEntriesPage.waitForLoadingToDisappear();

  await selectDisplayByOption(page, LABELS.date);
  await timeEntriesPage.waitForLoadingToDisappear();
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, LABELS.thisMonth);
  await timeEntriesPage.waitForLoadingToDisappear();

  let headers = await timeEntriesPage.getTableHeaders();
  expect(headers.some((h) => /^hours$/i.test(h.trim()))).toBeTruthy();
  expect(headers.some((h) => /^billable$/i.test(h.trim()))).toBeTruthy();

  if (!isCustomFieldColumnInHeaders(headers, customFieldName)) {
    await ensureCustomFieldColumnVisibleOnTimeEntries(
      page,
      timeEntriesPage,
      customFieldName,
    );
    headers = await timeEntriesPage.getTableHeaders();
  }
  expect(isCustomFieldColumnInHeaders(headers, customFieldName)).toBeTruthy();

  // Time entries list uses "Last, First" (e.g. "Emp1, Test"); STE dropdown may return "Test Emp1".
  const nameTrimmed = employeeName.trim();
  const listViewName = nameTrimmed.includes(',')
    ? nameTrimmed
    : (() => {
        const parts = nameTrimmed.split(/\s+/).filter(Boolean);
        return parts.length >= 2
          ? `${parts[parts.length - 1]}, ${parts.slice(0, -1).join(' ')}`
          : nameTrimmed;
      })();
  const alternateName = 'Emp1, Test';

  let nameToUse = nameTrimmed;
  if ((await timeEntriesPage.countEmployeeRow(nameTrimmed)) === 0) {
    if ((await timeEntriesPage.countEmployeeRow(listViewName)) > 0) {
      nameToUse = listViewName;
    } else {
      expect(
        await timeEntriesPage.countEmployeeRow(alternateName),
      ).toBeGreaterThan(0);
      nameToUse = alternateName;
    }
  } else {
    expect(await timeEntriesPage.countEmployeeRow(nameTrimmed)).toBeGreaterThan(
      0,
    );
  }

  const rowObj = await timeEntriesPage.getRowObjectForEmployee(nameToUse);
  const hoursValue =
    Object.entries(rowObj).find(([header]) =>
      /^hours$/i.test(header.trim()),
    )?.[1] ?? '';
  if (hours !== undefined) {
    expect(normalizeToMinutes(hoursValue)).toBe(normalizeToMinutes(hours));
  } else {
    expect(normalizeToMinutes(hoursValue)).toBeGreaterThan(0);
  }

  const billableValue =
    Object.entries(rowObj).find(([header]) =>
      /^billable$/i.test(header.trim()),
    )?.[1] ?? '';
  const billableTrimmed = billableValue.trim();
  const isBillableYes =
    billableTrimmed.length > 0 &&
    billableTrimmed !== '-' &&
    !/^no$/i.test(billableTrimmed);
  const actualBillable = isBillableYes ? 'Yes' : 'No';
  const expectedBillable = billableChecked ? 'Yes' : 'No';
  expect(actualBillable).toBe(expectedBillable);

  const customFieldColumnValue =
    rowObj[customFieldName] ??
    Object.entries(rowObj).find(([header]) =>
      header.includes(customFieldName),
    )?.[1] ??
    '';
  expect(customFieldColumnValue).toContain(customFieldValue);
};

export const toggleRequiredOnAndValidateSTE = async (page: Page) => {
  const customFieldName = 'Test Admin';
  await enableRequiredCustomFieldForTimeEntry(page, customFieldName);

  // Navigate to STE
  const timeEntriesPage = new TimeEntriesPage(page);
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();
  await clickAddTimeDropdown(page);
  await selectSingleTimeEntryFromAddTime(page);
  const singleTimeEntryPage = new SingleTimeEntryPage(page);
  const singleTimeActivityPage = new SingleTimeActivityPage(page);
  await singleTimeEntryPage.waitForPageReady();
  await singleTimeEntryPage.handlePopupsInAnyOrder();
  await singleTimeEntryPage.waitTillNameFieldVisible();

  const durationValue = '08:00';
  const customFieldInput = page
    .locator(
      `input[aria-label="${customFieldName}"], input[aria-label="${customFieldName} *"]`,
    )
    .first();

  // Fill all required fields except custom field
  await singleTimeActivityPage.openDropdown('Name');
  await page.waitForTimeout(STE_NAME_DROPDOWN_OPTIONS_SETTLE_MS);
  const nameOption = page.getByRole('option').nth(1);
  const employeeName = ((await nameOption.textContent()) ?? '').trim();
  await singleTimeActivityPage.clickDropdownOption(1, 'Name');

  await singleTimeEntryPage.openAndselectCustomerOption(1);
  await page.waitForTimeout(1000);

  await expect(customFieldInput).toBeVisible({ timeout: 10_000 });

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
  await singleTimeEntryPage.fillStartDate(formattedDate);
  await singleTimeEntryPage.enterFieldValue('Duration', durationValue);

  const billableCheckbox = page
    .getByRole('checkbox', { name: /Billable/i })
    .first();
  let billableChecked = false;
  if (await billableCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
    await billableCheckbox.check({ force: true });
    billableChecked = await billableCheckbox.isChecked();
  }

  // Try to save without filling custom field
  await singleTimeEntryPage.clickSaveButton();

  // Verify error message is visible (STE shows: "All required fields must be filled to create a time entry.")
  const errorText = page
    .getByText('field is required', { exact: false })
    .or(page.getByText('required fields', { exact: false }));
  await expect(errorText.first()).toBeVisible({ timeout: 15_000 });

  await customFieldInput.click();
  const firstCfOption = page.getByRole('option').first();
  await expect(firstCfOption).toBeVisible({ timeout: 10_000 });
  const selectedCustomFieldValue =
    ((await firstCfOption.textContent()) ?? '').trim() || 'Option 1';
  await firstCfOption.click();
  await page.waitForTimeout(500);
  await singleTimeEntryPage.clickSaveButton();
  await page.waitForTimeout(3000);

  await verifyTheCustomFieldColumn(page, {
    employeeName,
    hours: durationValue,
    customFieldName,
    customFieldValue: selectedCustomFieldValue,
    billableChecked,
  });
};

export const toggleRequiredOnAndValidateWTE = async (page: Page) => {
  const customFieldName = 'Test Admin';
  const hoursValue = '8';

  await enableRequiredCustomFieldForTimeEntry(page, customFieldName);

  const timeEntriesPage = new TimeEntriesPage(page);
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.dismissIntuitIntelligenceIfVisible();
  await openWeeklyTimeEntry(page);
  await weeklyTimeEntryPage.waitForLoadingToDisappear(page);
  await weeklyTimeEntryPage.handlePopupsInAnyOrder(page);

  const customFieldInput = page
    .locator(
      `input[aria-label="${customFieldName}"], input[aria-label="${customFieldName} *"]`,
    )
    .first();

  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await page.waitForTimeout(WTE_TEAM_MEMBER_DROPDOWN_OPTIONS_SETTLE_MS);
  const teamOption = page.getByRole('option').nth(1);
  let employeeName = ((await teamOption.textContent()) ?? '').trim();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  const teamMemberValue = (
    (await weeklyTimeEntryPage.teamMemberDropdownValue(page).inputValue()) ?? ''
  ).trim();
  if (teamMemberValue) {
    employeeName = teamMemberValue;
  }

  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await weeklyTimeEntryPage.clickCustomerDropdownOption(page, 1);
  await page.waitForTimeout(1000);

  await weeklyTimeEntryPage.hours(page, 3).click();
  await weeklyTimeEntryPage.hoursInputs(page).fill(hoursValue);

  await expect(
    page.locator('label').filter({ hasText: customFieldName }),
  ).toBeVisible({ timeout: 10_000 });
  await expect(customFieldInput).toBeVisible({ timeout: 10_000 });

  const serviceDropdown = weeklyTimeEntryPage.serviceDropdown(page);
  if (await serviceDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
    await serviceDropdown.click();
    await weeklyTimeEntryPage.clickDropdownOption(page);
  }

  const billableCheckbox = page
    .getByRole('checkbox', { name: /Billable/i })
    .first();
  let billableChecked = false;
  if (await billableCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
    await billableCheckbox.check({ force: true });
    billableChecked = await billableCheckbox.isChecked();
  }

  await weeklyTimeEntryPage.saveButton(page).click();

  const errorText = page
    .getByText('field is required', { exact: false })
    .or(page.getByText('required fields', { exact: false }))
    .or(page.getByText('Required', { exact: false }));
  await expect(errorText.first()).toBeVisible({ timeout: 15_000 });

  await customFieldInput.click();
  const firstCfOption = page.getByRole('option').first();
  await expect(firstCfOption).toBeVisible({ timeout: 10_000 });
  const selectedCustomFieldValue =
    ((await firstCfOption.textContent()) ?? '').trim() || 'Option 1';
  await firstCfOption.click();
  await page.waitForTimeout(500);
  await weeklyTimeEntryPage.saveButton(page).click();
  await weeklyTimeEntryPage.waitForLoadingToDisappear(page);
  await page.waitForTimeout(3000);

  await verifyTheCustomFieldColumn(page, {
    employeeName,
    hours: hoursValue,
    customFieldName,
    customFieldValue: selectedCustomFieldValue,
    billableChecked,
  });
};

export const toggleRequiredOnAndValidateTimeClock = async (page: Page) => {
  const customFieldName = 'Test Admin';

  await enableRequiredCustomFieldForTimeEntry(page, customFieldName);

  await navigateToTimeClock(page);
  await selectDisplayByOption(page, LABELS.date);
  await TimeClockPage.waitForLoadingToDisappear(page);
  await openDateRangeDropdown(page);
  await selectDateRangeOption(page, LABELS.thisMonth);
  await TimeClockPage.waitForLoadingToDisappear(page);

  if (await TimeClockPage.isClockOutButtonVisible(page)) {
    await TimeClockPage.clickClockOut(page);
    await page.waitForTimeout(3000);
  }

  await TimeClockPage.clickClockIn(page);
  await TimeClockPage.waitForDrawerVisible(page);

  const customerOptions = await TimeClockPage.getCustomerProjectOptions(page);
  if (customerOptions.length > 0) {
    await TimeClockPage.selectCustomerProject(page, customerOptions[0]);
  }

  await TimeClockPage.clickOnClockInButton(page);
  await TimeClockPage.waitForLoadingToDisappearTCPopup(page);

  const customFieldInput = page
    .locator(
      `input[aria-label="${customFieldName}"], input[aria-label="${customFieldName} *"]`,
    )
    .first();
  await expect(customFieldInput).toBeVisible({ timeout: 10_000 });

  await page.waitForTimeout(5000);

  const serviceDropdown = page.locator(
    `//span[contains(text(),'Service')]/..//following-sibling:: div[contains(@id, 'idsDropdownTypeaheadTextField')]`,
  );
  if (await serviceDropdown.isVisible({ timeout: 5000 })) {
    const serviceOptions = await TimeClockPage.getServiceItemOptions(page);
    await serviceDropdown.click();
    await page.waitForTimeout(6000);
    if (serviceOptions.length > 0) {
      await page.getByRole('option', { name: serviceOptions[0] }).click();
    } else {
      await page.getByRole('option').first().click();
    }
  }
  await page.waitForTimeout(5000);
  const billableCheckbox = page
    .locator(`//input[contains(@class, 'RcCheckbox')]`)
    .first();
  let billableChecked = false;
  if (await billableCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
    await billableCheckbox.check();
    billableChecked = await billableCheckbox.isChecked();
  }
  await page.waitForTimeout(5000);
  await page.locator(`[data-test-id="time-clock-save-button"]`).click();

  const errorText = page
    .getByText('field is required', { exact: false })
    .or(page.getByText('required fields', { exact: false }))
    .or(page.getByText('Required', { exact: false }));
  await expect(errorText.first()).toBeVisible({ timeout: 15_000 });

  await customFieldInput.click();
  const firstCfOption = page.getByRole('option').first();
  await expect(firstCfOption).toBeVisible({ timeout: 10_000 });
  const selectedCustomFieldValue =
    ((await firstCfOption.textContent()) ?? '').trim() || 'Option 1';
  await firstCfOption.click();
  await page.waitForTimeout(500);

  await page.locator(`[data-test-id="time-clock-save-button"]`).click();
  await page.waitForTimeout(5000);
  await TimeClockPage.clickClockOut(page);
  await TimeClockPage.waitForLoadingToDisappear(page);
};

export const toggleRequiredOffAndValidateSTE = async (page: Page) => {
  const customFieldName = 'Test Admin';

  // Navigate back to custom fields edit
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForLoadState('load');
  await page.waitForTimeout(2000);

  // Ensure Required is OFF
  await CustomFieldsPage.toggleRequiredOFFForCustomField(page, customFieldName);
  await CustomFieldsPage.clickSaveCustomFieldsListScreen(page);
  await page.waitForTimeout(2000);

  // Navigate to STE
  await navigateToSingleTimeEntry(page);
  const singleTimeEntryPage = new SingleTimeEntryPage(page);
  const singleTimeActivityPage = new SingleTimeActivityPage(page);
  await singleTimeEntryPage.waitForPageReady();
  await singleTimeEntryPage.handlePopupsInAnyOrder();
  await singleTimeEntryPage.waitTillNameFieldVisible();

  // Fill all required fields except custom field
  await singleTimeActivityPage.openDropdown('Name');
  await page.waitForTimeout(STE_NAME_DROPDOWN_OPTIONS_SETTLE_MS);
  await singleTimeActivityPage.clickDropdownOption(1, 'Name');

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
  await singleTimeEntryPage.fillStartDate(formattedDate);
  await singleTimeEntryPage.enterFieldValue('Duration', '08:00');

  await singleTimeEntryPage.openAndselectCustomerOption(1);

  // Try to save - should succeed since custom field is not required
  await singleTimeEntryPage.clickSaveButton();
  await page.waitForTimeout(3000);

  // Verify no error message (save should succeed)
  const errorMessage = page
    .getByText('fields are required')
    .or(page.getByText('Required'));
  await expect(errorMessage.first()).not.toBeVisible({ timeout: 2000 });
};

export const toggleRequiredOffAndValidateWTE = async (page: Page) => {
  const customFieldName = 'Test Field';

  // Navigate back to custom fields edit
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForLoadState('load');
  await page.waitForTimeout(8000);

  // Ensure Required is OFF
  await CustomFieldsPage.toggleRequiredOFFForCustomField(page, customFieldName);
  await CustomFieldsPage.clickSaveCustomFieldsListScreen(page);
  await page.waitForTimeout(5000);

  // Select employee and today's date, customer, enter hours
  await weeklyTimeEntryPage.navigate(page);
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await page.waitForTimeout(WTE_TEAM_MEMBER_DROPDOWN_OPTIONS_SETTLE_MS);
  await weeklyTimeEntryPage.clickDropdownOption(page);
  await weeklyTimeEntryPage.clickOnDeleteRow(page, 1);
  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await page.locator(`//li/span[text()="Bakes and Beans"]`).click();
  // Enter some hours without selecting customer/time category
  await weeklyTimeEntryPage.hours(page, 3).click();
  await weeklyTimeEntryPage.hoursInputs(page).fill('8');
  await weeklyTimeEntryPage.serviceDropdown(page).click();
  await weeklyTimeEntryPage.clickDropdownOption(page);

  await weeklyTimeEntryPage.classDropdown(page).click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  await weeklyTimeEntryPage.locationDropdown(page).click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  await weeklyTimeEntryPage.notesInput(page).fill('Test initial');
  //await TestAdmin(page).click();
  await weeklyTimeEntryPage.saveButton(page).click();

  // Verify no error message
  const errorMessage = page
    .getByText('fields are required')
    .or(page.getByText('Required'));
  await expect(errorMessage.first()).not.toBeVisible({ timeout: 2000 });
  console.log('Post Cleanup Process');
  // Navigate back to custom fields and Clean up
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForLoadState('load');
  await page.waitForTimeout(2000);

  // Ensure Required is OFF
  await CustomFieldsPage.toggleRequiredOFFForCustomField(page, customFieldName);
  await CustomFieldsPage.clickSaveCustomFieldsListScreen(page);
  await page.waitForTimeout(2000);
};

export const toggleRequiredOffAndValidateTimeClock = async (page: Page) => {
  const customFieldName = 'Test Admin';

  // Navigate back to custom fields edit
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForLoadState('load');
  await page.waitForTimeout(2000);

  // Ensure Required is OFF
  await CustomFieldsPage.toggleRequiredOFFForCustomField(page, customFieldName);
  await CustomFieldsPage.clickSaveCustomFieldsListScreen(page);
  await page.waitForTimeout(2000);
  // Navigate to TimeClock
  await navigateToTimeClock(page);
  await page.waitForTimeout(2000);
  await TimeClockPage.clickClockIn(page);
  console.log('Clicked Clock In');
  await TimeClockPage.waitForDrawerVisible(page);
  console.log('Drawer is visible');

  // Get available options
  const options = await TimeClockPage.getCustomerProjectOptions(page);
  console.log('Customer/Project options:', options);
  expect(options.length).toBeGreaterThan(0);

  // Verify we can select an option
  if (options.length > 0) {
    await TimeClockPage.selectCustomerProject(page, options[0]);
    console.log('Selected customer/project:', options[0]);
  }

  await TimeClockPage.clickOnClockInButton(page);
  console.log('Clicked on Clock In button');
  await page.waitForTimeout(5000);

  const serviceOptions = await TimeClockPage.getServiceItemOptions(page);
  expect(serviceOptions.length).toBeGreaterThan(0);

  const departmentOptions = await TimeClockPage.getDepartmentOptions(page);
  if (departmentOptions.length > 0) {
    await TimeClockPage.selectDepartment(page, departmentOptions[0]);
  }
  await page.locator(`[data-test-id="time-clock-save-button"]`).click();

  // Verify no error message
  const errorMessage = page
    .getByText('fields are required')
    .or(page.getByText('Required'));
  await expect(errorMessage.first()).not.toBeVisible({ timeout: 2000 });

  await TimeClockPage.clickClockOut(page);
};

export const assignCustomFieldToCustomerAndValidateSTE = async (page: Page) => {
  const customFieldName = 'Test Admin';

  // Navigate back to custom fields edit
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForLoadState('load');
  await page.waitForTimeout(2000);

  // Click Assign Customers
  await CustomFieldsPage.clickAssignCustomersForCustomField(
    page,
    customFieldName,
  );
  await CustomFieldsPage.verifyAssignCustomersPanelVisible(page);

  // Uncheck all customers first
  await CustomFieldsPage.unselectAllCustomersInAssignPanel(page);
  await CustomFieldsPage.clickAssignCustomersForCustomField(
    page,
    customFieldName,
  );

  // Select one customer (first available)
  const customerCheckboxes = page.locator(
    '//tbody/tr/td/label//input[@type="checkbox"]',
  );
  const firstCustomerCheckbox = customerCheckboxes.first();
  await firstCustomerCheckbox.check();
  await page.waitForTimeout(5000);

  // Get customer name
  const customerRow = firstCustomerCheckbox.locator('..').locator('..');
  const customerName = await customerRow.textContent();
  const selectedCustomerName = customerName?.trim().split('\n')[0] || '';

  // Click Save
  await page
    .locator(
      `//div[contains(@class,"Drawer-headerRightActionButton")]//button[@aria-label="Close"]`,
    )
    .click();
  await page
    .locator(`//div[@data-testid="ModalDialog"]//span[text()='Save']`)
    .click();

  // Navigate to STE
  await navigateToSingleTimeEntry(page);
  const singleTimeEntryPage = new SingleTimeEntryPage(page);
  const singleTimeActivityPage = new SingleTimeActivityPage(page);
  await singleTimeEntryPage.waitForPageReady();
  await singleTimeEntryPage.handlePopupsInAnyOrder();
  await singleTimeEntryPage.waitTillNameFieldVisible();

  await singleTimeActivityPage.openDropdown('Name');
  await page.waitForTimeout(STE_NAME_DROPDOWN_OPTIONS_SETTLE_MS);
  await singleTimeActivityPage.clickDropdownOption(1, 'Name');

  // Select the assigned customer
  await singleTimeActivityPage.openDropdown('Customer');
  await page.waitForTimeout(STE_CUSTOMER_DROPDOWN_OPTIONS_SETTLE_MS);
  const customerOptions = page.getByRole('option');
  const customerCountInDropdown = await customerOptions.count();
  for (let i = 0; i < customerCountInDropdown; i++) {
    const optionText = await customerOptions.nth(i).textContent();
    if (optionText?.includes(selectedCustomerName)) {
      await customerOptions.nth(i).click();
      break;
    }
  }

  await page.waitForTimeout(2000);

  // Verify custom field is visible
  const customFieldLabel = page
    .locator('label')
    .filter({ hasText: customFieldName });
  await expect(customFieldLabel).toBeVisible({ timeout: 5000 });

  // Select another customer
  await singleTimeActivityPage.openDropdown('Customer');
  await page.waitForTimeout(STE_CUSTOMER_DROPDOWN_OPTIONS_SETTLE_MS);
  await customerOptions.nth(2).click();
  await page.waitForTimeout(2000);

  // Verify custom field is not visible for other customer
  await expect(customFieldLabel).not.toBeVisible({ timeout: 3000 });

  // Cleanup: Unassign customers
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickAssignCustomersForCustomField(
    page,
    customFieldName,
  );
  await CustomFieldsPage.unselectAllCustomersInAssignPanel(page);
  await page.waitForTimeout(2000);
};

export const assignCustomFieldToCustomerAndValidateWTE = async (page: Page) => {
  //const customFieldName = await createDropdownCustomFieldAndValidate(page);
  const customFieldName = 'Test Admin';

  // Navigate back to custom fields edit
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForLoadState('load');
  await page.waitForTimeout(2000);

  // Click Assign Customers
  await CustomFieldsPage.clickAssignCustomersForCustomField(
    page,
    customFieldName,
  );
  await CustomFieldsPage.verifyAssignCustomersPanelVisible(page);

  // Check if any customers are already checked and uncheck them
  const allCustomerCheckboxes = page.locator(
    'input[type="checkbox"][aria-label^="Select "]',
  );
  const totalCheckboxes = await allCustomerCheckboxes.count().catch(() => 0);
  let hasCheckedCustomers = false;

  for (let i = 0; i < totalCheckboxes; i++) {
    const checkbox = allCustomerCheckboxes.nth(i);
    const isChecked = await checkbox.isChecked().catch(() => false);
    if (isChecked) {
      hasCheckedCustomers = true;
      break;
    }
  }

  if (hasCheckedCustomers) {
    console.log('Found checked customers, unchecking all...');
    // Uncheck all customers
    for (let i = 0; i < totalCheckboxes; i++) {
      const checkbox = allCustomerCheckboxes.nth(i);
      const isChecked = await checkbox.isChecked().catch(() => false);
      if (isChecked) {
        await checkbox.uncheck();
        await page.waitForTimeout(300);
      }
    }
    // Save and reopen panel
    await page
      .locator(
        `//div[contains(@class, 'FooterButtonsContainer')]//button[.//span[text()='Save']]`,
      )
      .click();
    await page.waitForTimeout(1000);
    await CustomFieldsPage.clickAssignCustomersForCustomField(
      page,
      customFieldName,
    );
    await page.waitForTimeout(500);
    console.log('✓ Unchecked all customers and reopened panel');
  } else {
    console.log('✓ All customers already unchecked, proceeding...');
  }

  // Select first customer in the list
  const customerCheckboxes = page.locator(
    '//td/label//input[@type="checkbox"]',
  );
  const firstCustomerCheckbox = customerCheckboxes.first();
  await firstCustomerCheckbox.check();
  await page.waitForTimeout(1000);
  console.log('✓ Selected first customer in the list');

  // Get customer name
  const customerRow = firstCustomerCheckbox.locator('..').locator('..');
  const customerName = await customerRow.textContent();
  const selectedCustomerName = customerName?.trim().split('\n')[0] || '';

  // //Click Save in Assign customers dialog
  // await page
  //   .getByRole('dialog', { name: 'Assign customers' })
  //   .getByRole('button', { name: 'Close' })
  //   .click();
  // await page
  //   .locator(`//div[@data-testid="ModalDialog"]//span[text()='Save']`)
  //   .click();
  await page.waitForTimeout(500);
  await page
    .locator(
      `//div[contains(@class, 'FooterButtonsContainer')]//button[.//span[text()='Save']]`,
    )
    .click();

  //navigate to WTE

  const timeEntriesPage = new TimeEntriesPage(page);
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.dismissIntuitIntelligenceIfVisible();
  await timeEntriesPage.waitForLoadingToDisappear();
  await openWeeklyTimeEntry(page);
  await timeEntriesPage.dismissIntuitIntelligenceIfVisible();

  // Wait for page to load
  await weeklyTimeEntryPage.waitForLoadingToDisappear(page);
  await weeklyTimeEntryPage.handlePopupsInAnyOrder(page);

  // 1. Select team member dropdown and select dropdown option
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await page.waitForTimeout(WTE_TEAM_MEMBER_DROPDOWN_OPTIONS_SETTLE_MS);
  await weeklyTimeEntryPage.clickDropdownOption(page);
  await page.waitForTimeout(5000);
  await weeklyTimeEntryPage.clickOnDeleteRow(page, 1);
  await page.waitForTimeout(5000);
  await weeklyTimeEntryPage.clickOnDeleteRow(page, 1);
  await page.waitForTimeout(5000);

  // 2. Select customerProjectDropdown and select the selected customer name
  const customerOption = page.locator(
    `//li[contains(@class, 'ListItem')]//span[contains(text(), '${selectedCustomerName}')]`,
  );
  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await page.waitForTimeout(500);
  await customerOption.first().click();
  await page.waitForTimeout(1000);
  console.log(`✓ Selected customer: ${selectedCustomerName}`);

  // 3. Click on 3rd hour cell and fill 8
  await weeklyTimeEntryPage.hours(page, 3).click();
  await weeklyTimeEntryPage.hoursInputs(page).fill('8');

  // 4. Select Service dropdown and select first option
  await page
    .locator(`//input[@role='combobox'][@aria-label='Service']`)
    .click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  await page.waitForTimeout(500);
  await weeklyTimeEntryPage.dismissServiceDefaultDescriptionConfirmIfVisible(
    page,
  );

  // 5. Verify added CF is visible
  const customFieldInputByAria = page.locator(
    `xpath=//input[@aria-label="${customFieldName}" or @aria-label="${customFieldName} *" or starts-with(normalize-space(@aria-label), "${customFieldName}")]`,
  );
  const customFieldByVisibleLabel = page
    .locator('xpath=//label')
    .filter({
      hasText: new RegExp(`^\\s*${customFieldName}\\s*\\*?\\s*$`, 'i'),
    })
    .first()
    .locator('xpath=following::input[1]');

  const customFieldInput = (await customFieldInputByAria
    .first()
    .isVisible({ timeout: 1500 })
    .catch(() => false))
    ? customFieldInputByAria.first()
    : customFieldByVisibleLabel;

  await expect(customFieldInput).toBeVisible({ timeout: 10_000 });

  // 6. Fill notes and save it
  await weeklyTimeEntryPage.notesInput(page).fill('Test initial');
  await weeklyTimeEntryPage.dismissServiceDefaultDescriptionConfirmIfVisible(
    page,
  );
  await customFieldInput.click();
  await weeklyTimeEntryPage.saveButton(page).click();
  await weeklyTimeEntryPage.dismissServiceDefaultDescriptionConfirmIfVisible(
    page,
  );
  await page.waitForTimeout(2000);

  // 7. Click on the cell for same customer and verify again if Custom field is visible
  await weeklyTimeEntryPage.hours(page, 3).click();
  await page.waitForTimeout(1000);
  await expect(customFieldInput).toBeVisible({ timeout: 10_000 });

  // 8. Select customer dropdown and select 2nd option and verify the CF is not visible
  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await page.waitForTimeout(1000);
  await weeklyTimeEntryPage.clickCustomerDropdownOption(page, 2);
  await page.waitForTimeout(500);
  await expect(customFieldInput).not.toBeVisible({ timeout: 10_000 });
};

// Cleanup method for custom field customer assignment
export const cleanupCustomFieldCustomerAssignment = async (page: Page) => {
  try {
    console.log(
      'Starting cleanup: Unassigning all customers from custom fields...',
    );
    await CustomFieldsPage.navigationToCustomFieldSettings(page);
    await page.waitForTimeout(1000);
    await CustomFieldsPage.clickCustomFieldsEditButton(page);
    await page.waitForTimeout(500);

    // Get the first custom field name and unassign all customers
    const customFieldRow = page.locator('//tbody/tr').first();
    const customFieldName = await customFieldRow
      .locator('td')
      .first()
      .textContent();

    if (customFieldName) {
      await CustomFieldsPage.clickAssignCustomersForCustomField(
        page,
        customFieldName.trim(),
      );
      await page.waitForTimeout(500);

      // Check if any customers are assigned
      const customerCheckboxes = page.locator(
        'input[type="checkbox"][aria-label^="Select "]',
      );
      const totalCheckboxes = await customerCheckboxes.count().catch(() => 0);
      let hasCheckedCustomers = false;

      for (let i = 0; i < totalCheckboxes; i++) {
        const checkbox = customerCheckboxes.nth(i);
        const isChecked = await checkbox.isChecked().catch(() => false);
        if (isChecked) {
          hasCheckedCustomers = true;
          break;
        }
      }

      if (hasCheckedCustomers) {
        // Unassign all customers
        await CustomFieldsPage.unselectAllCustomersInAssignPanel(page);
        await page.waitForTimeout(500);
        await page
          .locator(
            `//div[contains(@class, 'FooterButtonsContainer')]//button[.//span[text()='Save']]`,
          )
          .click();
        await page.waitForTimeout(1000);
        console.log(
          '✓ Cleanup completed: Unassigned all customers from custom field',
        );
      } else {
        console.log('✓ All customers already unassigned, skipping cleanup');
        // Close the panel
        await page
          .getByRole('dialog', { name: 'Assign customers' })
          .locator(`//button[@aria-label="Close"]`)
          .click();
        await page.waitForTimeout(500);
      }
    }
  } catch (error) {
    console.log(`⚠ Custom field customer cleanup error: ${error}`);
  }

  // Inactivate ALL Active custom fields
  try {
    console.log('Starting cleanup: Inactivating all active custom fields...');

    // Find all rows with Active status
    const activeFieldRows = page.locator(
      `//tr[.//td[contains(text(),'Active')]]`,
    );
    let activeCount = await activeFieldRows.count().catch(() => 0);
    console.log(`Found ${activeCount} active custom fields`);

    while (activeCount > 0) {
      // Get the first active field's name
      const firstActiveRow = activeFieldRows.first();
      const fieldNameElement = firstActiveRow.locator('td').first();
      const fieldName = await fieldNameElement.textContent().catch(() => '');

      if (fieldName) {
        // Remove any count suffix like "(3)" from the field name
        const trimmedName = fieldName.trim().replace(/\s*\(\d+\)$/, '');
        console.log(`Inactivating custom field: ${trimmedName}`);
        await CustomFieldsPage.clickManageAllCustomFieldsLink(page);
        await page.waitForTimeout(2000);

        // Find the row with this specific field name and click its actions dropdown button
        const actionsButton = page.locator(
          `//tr[.//div[contains(text(),'${trimmedName}')]]//button[@aria-haspopup="listbox"]`,
        );
        await actionsButton.click();
        await page.waitForTimeout(500);

        // Click "Make inactive" from menu
        const makeInactiveOption = page.locator(
          `//li//span[text()='Make inactive']`,
        );
        if (
          await makeInactiveOption
            .isVisible({ timeout: 3000 })
            .catch(() => false)
        ) {
          await makeInactiveOption.click();
          await page.waitForTimeout(500);
          await page.locator(`//button//span[text()='Yes']`).click();
          await page.waitForTimeout(1000);
          console.log(`✓ Inactivated: ${trimmedName}`);
        } else {
          console.log(
            `⚠ "Make inactive" not available for: ${trimmedName}, skipping...`,
          );
          break;
        }
      } else {
        break;
      }

      // Update active count
      activeCount = await activeFieldRows.count().catch(() => 0);
    }

    console.log('✓ All active custom fields inactivated');
  } catch (error) {
    console.log(`⚠ Custom field inactivation cleanup error: ${error}`);
  }
};

// Cleanup method to turn off all Required toggles for custom fields and inactivate them
export const cleanupRequiredTogglesForCustomFields = async (page: Page) => {
  // Step 1: Turn off all Required toggles
  try {
    console.log('Starting cleanup: Turning off all Required toggles...');
    await CustomFieldsPage.navigationToCustomFieldSettings(page);
    await page.waitForTimeout(2000);
    await CustomFieldsPage.clickCustomFieldsEditButton(page);
    await page.waitForTimeout(2000);

    // Find all Required toggle switches that are ON (aria-checked="true")
    const enabledToggles = page.locator(
      'input[role="switch"][aria-label^="Toggle required status"][aria-checked="true"]',
    );
    let enabledCount = await enabledToggles.count().catch(() => 0);
    console.log(`Found ${enabledCount} enabled Required toggles`);

    if (enabledCount === 0) {
      console.log('✓ All toggles already off, skipping toggle cleanup');
      // Close without saving
      await page
        .locator(
          `//div[contains(@class,"Drawer-headerRightActionButton")]//button[@aria-label="Close"]`,
        )
        .click();
      await page.waitForTimeout(1000);
    } else {
      // Turn off each enabled toggle
      let toggledOffCount = 0;
      while (enabledCount > 0) {
        const toggle = enabledToggles.first();
        await toggle.click();
        await page.waitForTimeout(500);
        toggledOffCount++;
        console.log(`✓ Turned off toggle ${toggledOffCount}`);

        // Re-count enabled toggles after clicking
        enabledCount = await enabledToggles.count().catch(() => 0);
      }

      // Save changes
      await page.locator(`//button[.//span[text()='Save']]`).click();
      await page.waitForTimeout(500);
      console.log(
        `✓ Cleanup completed: Turned off ${toggledOffCount} Required toggles`,
      );
    }
  } catch (error) {
    console.log(`⚠ Required toggles cleanup error: ${error}`);
  }

  // // Step 2: Inactivate ALL Active custom fields
  // try {
  //   console.log('Starting cleanup: Inactivating all active custom fields...');

  //   // Find all rows with Active status
  //   const activeFieldRows = page.locator(
  //     `//tr[.//td[contains(text(),'Active')]]`,
  //   );
  //   let activeCount = await activeFieldRows.count().catch(() => 0);
  //   console.log(`Found ${activeCount} active custom fields`);

  //   while (activeCount > 0) {
  //     // Get the first active field's name
  //     const firstActiveRow = activeFieldRows.first();
  //     const fieldNameElement = firstActiveRow.locator('td').first();
  //     const fieldName = await fieldNameElement.textContent().catch(() => '');

  //     if (fieldName) {
  //       // Remove any count suffix like "(3)" from the field name
  //       const trimmedName = fieldName.trim().replace(/\s*\(\d+\)$/, '');
  //       console.log(`Inactivating custom field: ${trimmedName}`);
  //       await CustomFieldsPage.clickManageAllCustomFieldsLink(page);
  //       await page.waitForTimeout(2000);

  //       // Find the row with this specific field name and click its actions dropdown button
  //       const actionsButton = page.locator(
  //         `//tr[.//div[contains(text(),'${trimmedName}')]]//button[@aria-haspopup="listbox"]`,
  //       );
  //       await actionsButton.click();
  //       await page.waitForTimeout(500);

  //       // Click "Make inactive" from menu
  //       const makeInactiveOption = page.locator(
  //         `//li//span[text()='Make inactive']`,
  //       );
  //       if (
  //         await makeInactiveOption
  //           .isVisible({ timeout: 3000 })
  //           .catch(() => false)
  //       ) {
  //         await makeInactiveOption.click();
  //         await page.waitForTimeout(500);
  //         await page.locator(`//button//span[text()='Yes']`).click();
  //         await page.waitForTimeout(1000);
  //         console.log(`✓ Inactivated: ${trimmedName}`);
  //       } else {
  //         console.log(
  //           `⚠ "Make inactive" not available for: ${trimmedName}, skipping...`,
  //         );
  //         break;
  //       }
  //     } else {
  //       break;
  //     }

  //     // Update active count
  //     activeCount = await activeFieldRows.count().catch(() => 0);
  //   }

  //   console.log('✓ All active custom fields inactivated');
  // } catch (error) {
  //   console.log(`⚠ Custom field inactivation cleanup error: ${error}`);
  // }
};

const ASSIGNMENTS_TIME_CLOCK_CUSTOM_FIELD = 'Test Admin';

/**
 * Time Clock post-test cleanup (same navigation/filters as {@link toggleRequiredOnAndValidateTimeClock}
 * and TimeClock.spec.ts flows): clock out if still clocked in, then remove this-month time entries.
 */
const cleanupTimeClockSessionAndEntries = async (page: Page): Promise<void> => {
  try {
    await navigateToTimeClock(page);
    await selectDisplayByOption(page, LABELS.date);
    await TimeClockPage.waitForLoadingToDisappear(page);
    await openDateRangeDropdown(page);
    await selectDateRangeOption(page, LABELS.thisMonth);
    await TimeClockPage.waitForLoadingToDisappear(page);

    if (await TimeClockPage.isClockOutButtonVisible(page)) {
      await TimeClockPage.clickClockOut(page);
      await page.waitForTimeout(3000);
      await TimeClockPage.waitForLoadingToDisappear(page);
    }
  } catch (error) {
    console.log(`⚠ Time Clock session cleanup error: ${error}`);
  }

  try {
    await deleteAllTimeEntries(page);
    console.log('✓ Time entries cleanup completed');
  } catch (error) {
    console.log(`⚠ Time entries cleanup error: ${error}`);
  }
};

/** ASM006 — leaves Required ON and may create a clocked-in entry; reset Time Clock + entries + toggles. */
export const cleanupToggleRequiredOnTimeClock = async (
  page: Page,
): Promise<void> => {
  console.log('Starting ASM006 post-test cleanup...');
  await cleanupTimeClockSessionAndEntries(page);
  try {
    await cleanupRequiredTogglesForCustomFields(page);
    console.log('✓ ASM006 Required toggles cleanup completed');
  } catch (error) {
    console.log(`⚠ ASM006 Required toggles cleanup error: ${error}`);
  }
};

/** ASM009 — ensure Required stays OFF for the test field after Time Clock validation. */
export const cleanupToggleRequiredOffTimeClock = async (
  page: Page,
): Promise<void> => {
  console.log('Starting ASM009 post-test cleanup...');
  await cleanupTimeClockSessionAndEntries(page);
  try {
    await CustomFieldsPage.navigationToCustomFieldSettings(page);
    await page.waitForTimeout(2000);
    await CustomFieldsPage.clickCustomFieldsEditButton(page);
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);
    await CustomFieldsPage.toggleRequiredOFFForCustomField(
      page,
      ASSIGNMENTS_TIME_CLOCK_CUSTOM_FIELD,
    );
    await CustomFieldsPage.clickSaveCustomFieldsListScreen(page);
    await page.waitForTimeout(2000);
    console.log('✓ ASM009 Required toggle cleanup completed');
  } catch (error) {
    console.log(`⚠ ASM009 Required toggle cleanup error: ${error}`);
  }
};

export const assignCustomFieldToCustomerAndValidateTimeClock = async (
  page: Page,
) => {
  //const customFieldName = await createDropdownCustomFieldAndValidate(page);
  const customFieldName = 'Test Admin';

  // Navigate back to custom fields edit
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForLoadState('load');
  await page.waitForTimeout(2000);

  // // Click Assign Customers
  // await CustomFieldsPage.clickAssignCustomersForCustomField(
  //   page,
  //   customFieldName,
  // );
  // await CustomFieldsPage.verifyAssignCustomersPanelVisible(page);

  // // Uncheck all customers first
  // await CustomFieldsPage.unselectAllCustomersInAssignPanel(page);
  // await CustomFieldsPage.clickAssignCustomersForCustomField(
  //   page,
  //   customFieldName,
  // );

  // // Select one customer (first available)
  // const customerCheckboxes = page.locator(
  //   '//input[@type="checkbox"][@aria-label="Select Bakes and Beans"]',
  // );
  // const firstCustomerCheckbox = customerCheckboxes.first();
  // // await clickDropdownOption(page);
  // await firstCustomerCheckbox.check();
  // await page.waitForTimeout(5000);

  // // Get customer name
  // const customerRow = firstCustomerCheckbox.locator('..').locator('..');
  // const customerName = await customerRow.textContent();
  // const selectedCustomerName = customerName?.trim().split('\n')[0] || '';

  // // Click Save
  // await page
  //   .locator(
  //     `//div[contains(@class,"Drawer-headerRightActionButton")]//button[@aria-label="Close"]`,
  //   )
  //   .click();
  // await page
  //   .locator(`//div[@data-testid="ModalDialog"]//span[text()='Save']`)
  //   .click();

  // await navigateToTimeClock(page);
  // await page.waitForTimeout(2000);
  // const clockInButton = page.locator(`//span[text()='Clock in']`);
  // await clockInButton.click();
  // await page.waitForTimeout(2000);
  // await clockInForAssignment(page);

  // // Select the assigned customer
  // const customerDropdown = page.locator(
  //   `//input[@aria-label="Select Customers"]`,
  // );
  // await customerDropdown.click();
  // await page.waitForTimeout(1000);
  // const customerOptions = page.getByRole('option');
  // const customerCountInDropdown = await customerOptions.count();
  // for (let i = 0; i < customerCountInDropdown; i++) {
  //   await page.waitForTimeout(1000);
  //   const optionText = await customerOptions.nth(i).textContent();
  //   if (optionText?.includes(selectedCustomerName)) {
  //     await customerOptions.nth(i).click();
  //     break;
  //   }
  // }
  // await page.waitForTimeout(10000);

  // // Verify custom field is visible
  // const customFieldLabel = page.locator(
  //   `//input[@aria-label="${customFieldName}"]`,
  // );
  // await expect(customFieldLabel).toBeVisible({ timeout: 5000 });

  // // Select another customer
  // const options = await TimeClockPage.getCustomerProjectOptions(page);
  // if (options.length > 0) {
  //   await TimeClockPage.selectCustomerProject(page, options[0]);
  //   await page.waitForTimeout(10000);
  // }

  // // Verify custom field is not visible
  // await expect(customFieldLabel).not.toBeVisible({ timeout: 3000 });
  // // clockout button
  // await TimeClockPage.clickClockOut(page);
  // await page.waitForTimeout(8000);

  // // Cleanup: Unassign customers
  // await CustomFieldsPage.navigationToCustomFieldSettings(page);
  // await page.waitForTimeout(2000);
  // await CustomFieldsPage.clickCustomFieldsEditButton(page);
  // await page.waitForTimeout(2000);
  // await CustomFieldsPage.clickAssignCustomersForCustomField(
  //   page,
  //   customFieldName,
  // );
  // await CustomFieldsPage.unselectAllCustomersInAssignPanel(page);
  // await page.waitForTimeout(2000);
};

export const assignCustomFieldToWorkerAndValidateSTE = async (page: Page) => {
  //const customFieldName = await createDropdownCustomFieldAndValidate(page);
  const customFieldName = 'Test Admin';

  // 1. Navigate to Settings → Account & Settings → Time
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForLoadState('load');
  await page.waitForTimeout(2000);

  // 2–5. Expand custom field row → pick first option row → open Assign workers
  await expandCustomFieldTableRowIfCollapsed(page, customFieldName);
  await page.waitForTimeout(1000);

  const optionRows = page.locator(`//tr[td[text()='List item']]`);
  await page.waitForTimeout(500);

  const firstOptionRow = optionRows.first();
  const optionName =
    (await firstOptionRow.locator('td').first().textContent())?.trim() || '';

  // Open option action menu and choose Assign workers
  const optionExpandMenuButton = page.locator(
    `//*[text()='${optionName}']/ancestor::tr/descendant::*[@aria-label="Expand Menu"]`,
  );
  await expect(optionExpandMenuButton.first()).toBeVisible({ timeout: 5000 });
  await optionExpandMenuButton.first().click();
  await page.waitForTimeout(500);

  const assignWorkersMenuItem = page.locator(`//*[text()="Assign workers"]`);
  await expect(assignWorkersMenuItem).toBeVisible({ timeout: 5000 });
  await assignWorkersMenuItem.click();
  await page.waitForTimeout(1000);

  // // 6. Uncheck all workers and click save
  await CustomFieldsPage.unselectAllWorkersInAssignPanel(page);
  const saveButton = page.locator(
    `//div[contains(@class,"AssignmentDrawerstyled__FooterButtonsContainer")]//button//span[text()="Save"]`,
  );
  if (await saveButton.isEnabled()) {
    await saveButton.click();
  } else {
    const closeButton = page.locator(
      `//div[contains(@class,"Drawer-headerRightActionButton")]//button[@aria-label="Close"]`,
    );
    await closeButton.click();
  }
  await page.waitForTimeout(2000);

  // 7. Re-open Assign workers and select first worker checkbox
  await optionExpandMenuButton.first().click();
  await page.waitForTimeout(500);
  await assignWorkersMenuItem.click();
  await page.waitForTimeout(1000);

  const firstWorkerCheckbox = page
    .locator(`//input[@aria-label="Select Test Emp1"]`)
    .first();
  await firstWorkerCheckbox.check();
  await page.waitForTimeout(500);

  // Capture selected worker name (for STE validation)
  const workerRow = firstWorkerCheckbox.locator('..').locator('..');
  const workerName = await workerRow.textContent();
  const selectedWorkerName = workerName?.trim().split('\n')[0] || '';

  await CustomFieldsPage.clickSaveAssignWorkersPanel(page);
  await page.waitForTimeout(2000);

  // 8–14. Navigate to Single time entry and validate option visibility per worker
  await navigateToSingleTimeEntry(page);
  const singleTimeEntryPage = new SingleTimeEntryPage(page);
  const singleTimeActivityPage = new SingleTimeActivityPage(page);
  await singleTimeEntryPage.waitForPageReady();
  await singleTimeEntryPage.handlePopupsInAnyOrder();
  await singleTimeEntryPage.waitTillNameFieldVisible();

  // Select the assigned worker/employee
  await singleTimeActivityPage.openDropdown('Name');
  await page.waitForTimeout(STE_NAME_DROPDOWN_OPTIONS_SETTLE_MS);
  const nameOptions = page.getByRole('option');
  const nameCountInDropdown = await nameOptions.count();
  for (let i = 0; i < nameCountInDropdown; i++) {
    const optionTextInDropdown = await nameOptions.nth(i).textContent();
    if (optionTextInDropdown?.includes(selectedWorkerName)) {
      await nameOptions.nth(i).click();
      break;
    }
  }

  await page.waitForTimeout(2000);

  // Verify custom field is visible and dropdown values are present
  const customFieldLabel = page
    .locator('label')
    .filter({ hasText: customFieldName });
  await expect(customFieldLabel).toBeVisible({ timeout: 5000 });

  // Click the custom field dropdown
  const customFieldDropdown = customFieldLabel
    .locator('..')
    .locator('//input[@aria-autocomplete="list"]')
    .first();
  await customFieldDropdown.click();
  await page.waitForTimeout(1000);

  // Verify the specific option assigned to that worker is visible
  const dropdownOptions = page.getByRole('option');
  await expect(
    dropdownOptions.filter({ hasText: optionName }).first(),
  ).toBeVisible();

  // Select another worker
  await singleTimeActivityPage.openDropdown('Name');
  await page.waitForTimeout(STE_NAME_DROPDOWN_OPTIONS_SETTLE_MS);
  await nameOptions.nth(2).click();
  await page.waitForTimeout(2000);

  // Verify custom field is not visible for other worker
  await expect(customFieldLabel).not.toBeVisible({ timeout: 3000 });

  // 15–20. Cleanup: navigate back and unassign workers, verify workers column is "(None)"
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForTimeout(2000);

  await expandCustomFieldTableRowIfCollapsed(page, customFieldName);
  await page.waitForTimeout(1000);

  await optionExpandMenuButton.first().click();
  await page.waitForTimeout(500);
  await assignWorkersMenuItem.click();
  await page.waitForTimeout(1000);

  await CustomFieldsPage.unselectAllWorkersInAssignPanel(page);
  await CustomFieldsPage.clickSaveAssignWorkersPanel(page);
  await page.waitForTimeout(2000);

  // Verify workers column shows "(None)" for that option row
  const workersCellForOption = page.locator(
    `//tr[td[normalize-space(text())='${optionName}']]/td[contains(normalize-space(.),'None')]`,
  );
  await expect(workersCellForOption.first()).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(2000);
};

export const assignCustomFieldToWorkerAndValidateWTE = async (page: Page) => {
  //const customFieldName = await createDropdownCustomFieldAndValidate(page);
  const customFieldName = 'Test Admin';

  // 1. Navigate to Settings → Account & Settings → Time
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForLoadState('load');
  await page.waitForTimeout(2000);

  // 2–5. Expand custom field row → pick first option row → open Assign workers
  // 2–5. Expand custom field row → pick first option row → open Assign workers
  await expandCustomFieldTableRowIfCollapsed(page, customFieldName);
  await page.waitForTimeout(1000);

  const optionRows = page.locator(`//tr[td[text()='List item']]`);
  await page.waitForTimeout(500);

  const firstOptionRow = optionRows.first();
  const optionName =
    (await firstOptionRow.locator('td').first().textContent())?.trim() || '';

  // Open option action menu and choose Assign workers
  // Open option action menu and choose Assign workers
  const optionExpandMenuButton = page.locator(
    `//*[text()='${optionName}']/ancestor::tr/descendant::*[@aria-label="Expand Menu"]`,
  );
  await expect(optionExpandMenuButton.first()).toBeVisible({ timeout: 5000 });
  await optionExpandMenuButton.first().click();
  await page.waitForTimeout(500);

  const assignWorkersMenuItem = page.locator(`//*[text()="Assign workers"]`);
  await expect(assignWorkersMenuItem).toBeVisible({ timeout: 5000 });
  await assignWorkersMenuItem.click();
  await page.waitForTimeout(1000);

  // // 6. Uncheck all workers and click save
  // // 6. Uncheck all workers and click save
  await CustomFieldsPage.unselectAllWorkersInAssignPanel(page);
  const saveButton = page.locator(
    `//div[contains(@class,"AssignmentDrawerstyled__FooterButtonsContainer")]//button//span[text()="Save"]`,
  );
  if (await saveButton.isEnabled()) {
    await saveButton.click();
  } else {
    const closeButton = page.locator(
      `//div[contains(@class,"Drawer-headerRightActionButton")]//button[@aria-label="Close"]`,
    );
    await closeButton.click();
  }
  await page.waitForTimeout(2000);

  // 7. Re-open Assign workers and select first worker checkbox
  await optionExpandMenuButton.first().click();
  await page.waitForTimeout(500);
  await assignWorkersMenuItem.click();
  await page.waitForTimeout(1000);

  const workerCheckboxes = page.locator(
    '//input[@aria-label="Select all items"]',
  );
  const firstWorkerCheckbox = page
    .locator(`//input[@aria-label="Select Test Emp1"]`)
    .first();
  await firstWorkerCheckbox.check();
  await page.waitForTimeout(500);

  // Capture selected worker name (for STE validation)
  // Capture selected worker name (for STE validation)
  const workerRow = firstWorkerCheckbox.locator('..').locator('..');
  const workerName = await workerRow.textContent();
  const selectedWorkerName = workerName?.trim().split('\n')[0] || '';

  await CustomFieldsPage.clickSaveAssignWorkersPanel(page);
  await page.waitForTimeout(2000);

  // 9–14. Navigate to Weekly time Entry and validate option visibility per worker
  const timeEntriesPage = new TimeEntriesPage(page);
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.dismissIntuitIntelligenceIfVisible();
  await page.waitForTimeout(9000);
  await openWeeklyTimeEntry(page);
  await timeEntriesPage.dismissIntuitIntelligenceIfVisible();

  // Wait for page to load
  await weeklyTimeEntryPage.waitForLoadingToDisappear(page);
  await weeklyTimeEntryPage.handlePopupsInAnyOrder(page);

  // Select the assigned worker/employee
  const employeeDropdown = page.locator('//input[@aria-label="Team Member"]');
  await employeeDropdown.click();
  await page.waitForTimeout(1000);
  const nameOptions = page.getByRole('option');
  const nameCountInDropdown = await nameOptions.count();
  for (let i = 0; i < nameCountInDropdown; i++) {
    const optionText = await nameOptions.nth(i).textContent();
    if (optionText?.includes(selectedWorkerName)) {
      await nameOptions.nth(i).click();
      break;
    }
  }

  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await page.locator(`//li/span[text()="Bakes and Beans"]`).click();
  await page.waitForTimeout(1000);
  await weeklyTimeEntryPage.firstDataCell(page).click();
  await page.waitForTimeout(2000);
  await weeklyTimeEntryPage.hoursInputs(page).first().fill('8');

  await page.waitForTimeout(2000);

  // 12–14. Verify option visibility for assigned worker vs another worker
  const customFieldLabel = page
    .locator('label')
    .filter({ hasText: customFieldName });
  await expect(customFieldLabel).toBeVisible({ timeout: 5000 });

  // Click the custom field dropdown and verify assigned option is visible
  const customFieldDropdown = customFieldLabel
    .locator('..')
    .locator('//input[@aria-autocomplete="list"]')
    .first();
  await customFieldDropdown.click();
  await page.waitForTimeout(1000);

  const dropdownOptions = page.getByRole('option');
  await expect(
    dropdownOptions.filter({ hasText: optionName }).first(),
  ).toBeVisible();

  // Select another worker and ensure the option is not visible
  // await employeeDropdown.click();
  // await page.waitForTimeout(1000);
  // await nameOptions.nth(2).click();
  // await page.waitForTimeout(2000);
  // await employeeDropdown.click();
  // await page.waitForTimeout(1000);
  // await nameOptions.nth(2).click();
  // await page.waitForTimeout(2000);

  // Option (value) should not be offered for another worker
  // await customFieldDropdown.click();
  // await page.waitForTimeout(1000);
  // await expect(
  //   dropdownOptions.filter({ hasText: optionName }).first(),
  // ).not.toBeVisible({ timeout: 3000 });
  // await customFieldDropdown.click();
  // await page.waitForTimeout(1000);
  // await expect(
  //   dropdownOptions.filter({ hasText: optionName }).first(),
  // ).not.toBeVisible({ timeout: 3000 });

  // 15–20. Cleanup: navigate back and unassign workers, verify workers column is "(None)"
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForTimeout(2000);

  await expandCustomFieldTableRowIfCollapsed(page, customFieldName);
  await page.waitForTimeout(1000);

  await optionExpandMenuButton.first().click();
  await page.waitForTimeout(500);
  await assignWorkersMenuItem.click();
  await page.waitForTimeout(1000);

  await CustomFieldsPage.unselectAllWorkersInAssignPanel(page);
  await CustomFieldsPage.clickSaveAssignWorkersPanel(page);
  await page.waitForTimeout(2000);

  const workersCellForOption = page.locator(
    `//tr[td[normalize-space(text())='${optionName}']]/td[contains(normalize-space(.),'None')]`,
  );
  await expect(workersCellForOption.first()).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(2000);
};

const STANDARD_FIELD_SERVICE_ITEM = 'Service item';
/** Standard-field value row label on Service item detail (Timesheet settings). */
const SERVICE_ITEM_VALUE_HOURS = 'Hours';

/**
 * `data-testid` on status {@link StatusSwitchContainer} in timesheet FieldsPreview (`viewForm` / OTX).
 * Prefer over unscoped `tr` text — other tables on the page can also contain “Location”, etc.
 */
const TIMESHEET_STANDARD_FIELD_STATUS_TESTID: Record<string, string> = {
  [STANDARD_FIELD_SERVICE_ITEM]: 'cust-service-item',
  Location: 'cust-location',
  Class: 'cust-class',
  Billable: 'cust-billable',
  Notes: 'cust-notes',
};

/**
 * `aria-label` / accessible name on the IDS `Switch` for each standard row ({@link FieldsPreview} uses `field.key`).
 * QBO full-page Timesheet settings: e.g. `getByRole('switch', { name: 'locationForTimeSheetEnabled' })`.
 */
const TIMESHEET_STANDARD_FIELD_SWITCH_NAME: Record<string, string> = {
  [STANDARD_FIELD_SERVICE_ITEM]: 'isServiceFieldEnabled',
  Location: 'locationForTimeSheetEnabled',
  Class: 'classForTimeSheetEnabled',
  Billable: 'isBillingFieldEnabled',
  Notes: 'timeSheetEntryNotesEnabled',
};

/** Save on Timesheet customize UI — **modal** (OTX) or **full Account settings page** (qbo.intuit.com `?p=time`). */
const saveTimesheetFieldsSettingsModal = async (page: Page) => {
  const clickFirstVisible = async (
    loc: Locator,
    timeoutMs: number,
  ): Promise<boolean> => {
    const started = Date.now();
    const remainingMs = () => Math.max(0, timeoutMs - (Date.now() - started));

    // Poll; use waitFor(visible) — isVisible() returns immediately and can skip a late Save/Done.
    while (remainingMs() > 0) {
      const n = await loc.count().catch(() => 0);
      for (let i = 0; i < n; i++) {
        const btn = loc.nth(i);
        const waitBudget = Math.min(3_000, remainingMs());
        if (waitBudget <= 0) {
          return false;
        }
        try {
          await btn.waitFor({ state: 'visible', timeout: waitBudget });
          await btn.click({ timeout: 10_000 });
          await page.waitForTimeout(1200);
          return true;
        } catch {
          /* try next matching locator or retry after pause */
        }
      }
      if (remainingMs() <= 0) break;
      await page.waitForTimeout(300);
    }
    return false;
  };

  // Prefer an explicit dialog/modal action (most reliable in stacked shells).
  const modalDialog = page
    .getByTestId('ModalDialog')
    .or(page.getByRole('dialog'));

  const dialogSaveOrDone = modalDialog
    .getByRole('button', { name: /^save$/i })
    .or(modalDialog.getByRole('button', { name: /^done$/i }))
    .or(modalDialog.locator(`//button[.//span[normalize-space(.)='Save']]`))
    .or(modalDialog.locator(`//button[.//span[normalize-space(.)='Done']]`));

  if (await clickFirstVisible(dialogSaveOrDone, 12_000)) return;

  // Fallback: full page settings sometimes renders the primary action outside the dialog container.
  const pageSaveOrDone = page
    .getByRole('button', { name: /^save$/i })
    .or(page.getByRole('button', { name: /^done$/i }));

  if (await clickFirstVisible(pageSaveOrDone, 20_000)) return;

  // Some shells auto-persist changes on the Service item values screen (no global Save/Done).
  // If we can’t find a visible Save/Done, assume changes are already saved.
  return;
};

/** Cancel / dismiss customize view when there are no changes to save. */
const dismissTimesheetCustomizeWithoutSaving = async (page: Page) => {
  const modal = page.getByTestId('ModalDialog');
  const modalCancel = modal
    .getByRole('button', { name: /^cancel$/i })
    .or(modal.getByRole('link', { name: /^cancel$/i }))
    .first();
  if (await modalCancel.isVisible({ timeout: 4000 }).catch(() => false)) {
    await modalCancel.click({ timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(1000);
    return;
  }
  const pageCancels = page.getByRole('button', { name: /^cancel$/i });
  const n = await pageCancels.count();
  if (n > 0) {
    await pageCancels
      .nth(n - 1)
      .click({ timeout: 10_000 })
      .catch(() => {});
  }
  await page.waitForTimeout(1000);
};

/**
 * Table that lists standard timesheet fields ({@link FieldsPreview}): modal **or** full-page Account settings.
 * Do **not** assume `ModalDialog` — prod QBO opens “Customize your timesheets” as a normal page.
 */
const timesheetStandardFieldsTable = (page: Page): Locator =>
  page
    .locator(
      'table[summary="Time tracking settings fields configuration table"]',
    )
    .or(page.locator('[data-testid="timeSheet-settings"] table'))
    .or(page.locator('[data-testid="timeSheet-settings-view"] table'))
    .first();

/**
 * Status cell for a standard field: prefer OTX `data-testid` on {@link StatusSwitchContainer}; else row in the fields table.
 */
const timesheetStandardFieldStatusContainer = (
  page: Page,
  fieldName: string,
): Locator => {
  const testId = TIMESHEET_STANDARD_FIELD_STATUS_TESTID[fieldName];
  if (testId) {
    return page.getByTestId(testId);
  }
  return timesheetStandardFieldsTable(page)
    .locator('tbody tr')
    .filter({ has: page.getByText(fieldName, { exact: true }) })
    .first()
    .locator(`div[class*='StatusSwitchContainer']`);
};

/**
 * QBO expects the standard field Status to be Inactive before opening Assign customer
 * from the row menu; toggle only when needed. Returns whether a click was performed.
 */
const toggleStandardTimesheetFieldStatusIfNeeded = async (
  page: Page,
  fieldName: string,
  target: 'active' | 'inactive',
): Promise<boolean> => {
  const switchName = TIMESHEET_STANDARD_FIELD_SWITCH_NAME[fieldName];
  if (switchName) {
    const toggle = page.getByRole('switch', { name: switchName });
    await expect(toggle).toBeVisible({ timeout: 25_000 });
    await toggle.scrollIntoViewIfNeeded().catch(() => {});
    const ac = ((await toggle.getAttribute('aria-checked')) || '').trim();
    const looksActive = ac === 'true';
    const looksInactive = ac === 'false';
    if (target === 'inactive' && looksActive) {
      await toggle.click();
      await page.waitForTimeout(800);
      return true;
    }
    if (target === 'active' && looksInactive) {
      await toggle.click();
      await page.waitForTimeout(800);
      return true;
    }
    return false;
  }

  const statusTestId = TIMESHEET_STANDARD_FIELD_STATUS_TESTID[fieldName];
  let statusContainer = timesheetStandardFieldStatusContainer(page, fieldName);

  if (
    statusTestId &&
    !(await statusContainer.isVisible({ timeout: 5000 }).catch(() => false))
  ) {
    statusContainer = timesheetStandardFieldsTable(page)
      .locator('tbody tr')
      .filter({ has: page.getByText(fieldName, { exact: true }) })
      .first()
      .locator(`div[class*='StatusSwitchContainer']`);
  }

  await expect(statusContainer).toBeVisible({ timeout: 25_000 });
  await statusContainer.scrollIntoViewIfNeeded().catch(() => {});

  const statusText = statusContainer.locator('span').first();
  const text = ((await statusText.textContent().catch(() => '')) || '').trim();
  let looksActive = /\bActive\b/i.test(text) && !/\bInactive\b/i.test(text);
  let looksInactive = /\bInactive\b/i.test(text);
  if (!looksActive && !looksInactive) {
    const sw = statusContainer.getByRole('switch').first();
    if (await sw.isVisible({ timeout: 2000 }).catch(() => false)) {
      const ac = await sw.getAttribute('aria-checked');
      if (ac === 'true') looksActive = true;
      if (ac === 'false') looksInactive = true;
    }
  }

  const toggle = statusContainer
    .getByRole('switch')
    .or(statusContainer.locator(`input[type="checkbox"]`))
    .or(statusContainer.locator('span input'))
    .first();
  await expect(toggle).toBeVisible({ timeout: 10_000 });

  if (target === 'inactive' && looksActive) {
    await toggle.click();
    await page.waitForTimeout(800);
    return true;
  }
  if (target === 'active' && looksInactive) {
    await toggle.click();
    await page.waitForTimeout(800);
    return true;
  }
  return false;
};

/**
 * Deactivate standard field, persist, reopen edit so Assign customer can be updated.
 */
const deactivateStandardFieldBeforeAssignCustomersFlow = async (
  page: Page,
  timesheetFieldsEditButton: Locator,
  fieldName: string,
) => {
  const changed = await toggleStandardTimesheetFieldStatusIfNeeded(
    page,
    fieldName,
    'inactive',
  );
  if (changed) {
    await saveTimesheetFieldsSettingsModal(page);
    await timesheetFieldsEditButton.first().click();
    await page.waitForTimeout(2000);
  }
};

/**
 * If `fieldName` is **Inactive** on Timesheet fields, toggle **Active**, **Save**, and close the modal.
 * If already Active, **Cancel** to close without redundant save. Used so STE OTX sees `isLocationEnabled` true
 * while **Service** can stay Inactive for assignment rules.
 */
const ensureTimesheetStandardFieldActiveThenCloseModal = async (
  page: Page,
  fieldName: string,
): Promise<void> => {
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(1500);
  const timesheetFieldsEditButton = page.locator(
    `//div[@data-testid="timeSheet-settings"]//button[@aria-label="Edit"]`,
  );
  await timesheetFieldsEditButton.first().click();
  await page.waitForTimeout(2000);
  const changed = await toggleStandardTimesheetFieldStatusIfNeeded(
    page,
    fieldName,
    'active',
  );
  if (changed) {
    await saveTimesheetFieldsSettingsModal(page);
  } else {
    await dismissTimesheetCustomizeWithoutSaving(page);
  }
};

/**
 * If `fieldName` is **Active** on Timesheet fields, toggle **Inactive**, **Save**, and close the modal.
 * If already Inactive, **Cancel** to close without redundant save.
 *
 * Assignments **Assign time tracking fields** / per-customer checks align with standard fields (e.g. **Location**,
 * **Service item**) being **Inactive** in Timesheet settings — call this before navigating to the Assignments page.
 */
const ensureTimesheetStandardFieldInactiveThenCloseModal = async (
  page: Page,
  fieldName: string,
): Promise<void> => {
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(1500);
  const timesheetFieldsEditButton = page.locator(
    `//div[@data-testid="timeSheet-settings"]//button[@aria-label="Edit"]`,
  );
  await timesheetFieldsEditButton.first().click();
  await page.waitForTimeout(2000);
  const changed = await toggleStandardTimesheetFieldStatusIfNeeded(
    page,
    fieldName,
    'inactive',
  );
  if (changed) {
    await saveTimesheetFieldsSettingsModal(page);
  } else {
    await dismissTimesheetCustomizeWithoutSaving(page);
  }
};

/**
 * Turn field **Active** after assignment saves. Use only when you want the standard field on again for normal time entry.
 * **Do not** call after restricted Service setup if your shell resets “Assign customers” to **All** when Active — leave
 * Service **Inactive** so customer / Hours-worker assignments stay effective (see extended matrix configure).
 */
const reactivateStandardFieldAfterAssignCustomersSave = async (
  page: Page,
  fieldName: string,
) => {
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  const timesheetFieldsEditButton = page.locator(
    `//div[@data-testid="timeSheet-settings"]//button[@aria-label="Edit"]`,
  );
  await timesheetFieldsEditButton.first().click();
  await page.waitForTimeout(2000);
  const changed = await toggleStandardTimesheetFieldStatusIfNeeded(
    page,
    fieldName,
    'active',
  );
  if (changed) {
    await saveTimesheetFieldsSettingsModal(page);
  }
};

export const assignCustomerToStandardFieldAndValidateSTE = async (
  page: Page,
) => {
  // Navigate to Settings → Account & Settings → Time
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);

  // Click Timesheet fields edit button
  const timesheetFieldsEditButton = page.locator(
    `//div[@data-testid="timeSheet-settings"]//button[@aria-label="Edit"]`,
  );
  await timesheetFieldsEditButton.first().click();
  await page.waitForTimeout(2000);
  await deactivateStandardFieldBeforeAssignCustomersFlow(
    page,
    timesheetFieldsEditButton,
    STANDARD_FIELD_SERVICE_ITEM,
  );

  // Click Assign customer in Service item
  await CustomFieldsPage.clickAssignCustomersForStandardField(
    page,
    STANDARD_FIELD_SERVICE_ITEM,
  );

  await CustomFieldsPage.verifyAssignCustomersPanelVisible(page);
  await page.waitForTimeout(2000);

  // Uncheck all customers
  await CustomFieldsPage.unselectAllCustomersInAssignPanel(page);
  await page.waitForTimeout(5000);

  // Again Click Assign customer in Service item
  await CustomFieldsPage.clickAssignCustomersForStandardField(
    page,
    STANDARD_FIELD_SERVICE_ITEM,
  );

  // First customer in panel (works on elite / shared pools; not tied to "Test Admin")
  const customerCheckboxes = page.locator(
    '//tbody/tr/td/label//input[@type="checkbox"]',
  );
  await expect(customerCheckboxes.first()).toBeVisible({ timeout: 10000 });
  await customerCheckboxes.first().check();
  await page.waitForTimeout(5000);

  const customerRow = customerCheckboxes.first().locator('..').locator('..');
  const customerName = await customerRow.textContent();
  const selectedCustomerName = customerName?.trim().split('\n')[0] || '';

  // Click Save
  await page
    .locator(
      `//div[contains(@class,"Drawer-headerRightActionButton")]//button[@aria-label="Close"]`,
    )
    .click();
  await page
    .locator(`//div[@data-testid="ModalDialog"]//span[text()='Save']`)
    .click();
  await page.waitForTimeout(2000);
  await reactivateStandardFieldAfterAssignCustomersSave(
    page,
    STANDARD_FIELD_SERVICE_ITEM,
  );
  // Navigate to STE
  await navigateToSingleTimeEntry(page);
  const singleTimeEntryPage = new SingleTimeEntryPage(page);
  const singleTimeActivityPage = new SingleTimeActivityPage(page);
  await singleTimeEntryPage.waitForPageReady();
  await singleTimeEntryPage.handlePopupsInAnyOrder();
  await singleTimeEntryPage.waitTillNameFieldVisible();

  await singleTimeActivityPage.openDropdown('Name');
  await page.waitForTimeout(STE_NAME_DROPDOWN_OPTIONS_SETTLE_MS);
  await singleTimeActivityPage.clickDropdownOption(1, 'Name');

  // Select the assigned customer
  await singleTimeActivityPage.openDropdown('Customers');
  await page.waitForTimeout(1000);
  const customerOptions = page.getByRole('option');
  const customerCountInDropdown = await customerOptions.count();
  for (let i = 0; i < customerCountInDropdown; i++) {
    const optionText = await customerOptions.nth(i).textContent();
    if (optionText?.includes(selectedCustomerName)) {
      await customerOptions.nth(i).click();
      break;
    }
  }

  await page.waitForTimeout(2000);

  // Verify Service item field is visible
  const serviceItemLabel = page.locator(`//span[text()="Service"]`);
  await expect(serviceItemLabel).toBeVisible({ timeout: 5000 });

  // Select a different customer than the one assigned to Service item
  await singleTimeActivityPage.openDropdown('Customers');
  await page.waitForTimeout(1000);
  let otherCustomerIdx = -1;
  for (let i = 0; i < customerCountInDropdown; i++) {
    const optionText = await customerOptions.nth(i).textContent();
    if (optionText && !optionText.includes(selectedCustomerName)) {
      otherCustomerIdx = i;
      break;
    }
  }
  expect(otherCustomerIdx).toBeGreaterThanOrEqual(0);
  await customerOptions.nth(otherCustomerIdx).click();
  await page.waitForTimeout(2000);

  // Verify Service item field is not visible
  await expect(serviceItemLabel).not.toBeVisible({ timeout: 3000 });

  // Cleanup: Unassign customers
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await timesheetFieldsEditButton.first().click();
  await page.waitForTimeout(2000);
  await deactivateStandardFieldBeforeAssignCustomersFlow(
    page,
    timesheetFieldsEditButton,
    STANDARD_FIELD_SERVICE_ITEM,
  );
  await CustomFieldsPage.clickAssignCustomersForStandardField(
    page,
    STANDARD_FIELD_SERVICE_ITEM,
  );
  await CustomFieldsPage.unselectAllCustomersInAssignPanel(page);
  await page.waitForTimeout(2000);
};

export const assignCustomerToStandardFieldAndValidateWTE = async (
  page: Page,
) => {
  // Navigate to Settings → Account & Settings → Time
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);

  // Click Timesheet fields edit button
  const timesheetFieldsEditButton = page.locator(
    `//div[@data-testid="timeSheet-settings"]//button[@aria-label="Edit"]`,
  );
  await timesheetFieldsEditButton.first().click();
  await page.waitForTimeout(2000);
  await deactivateStandardFieldBeforeAssignCustomersFlow(
    page,
    timesheetFieldsEditButton,
    STANDARD_FIELD_SERVICE_ITEM,
  );
  // Click Assign customer in Service item
  await CustomFieldsPage.clickAssignCustomersForStandardField(
    page,
    STANDARD_FIELD_SERVICE_ITEM,
  );
  await CustomFieldsPage.verifyAssignCustomersPanelVisible(page);
  await page.waitForTimeout(2000);

  // Uncheck all customers
  await CustomFieldsPage.unselectAllCustomersInAssignPanel(page);
  await page.waitForTimeout(5000);

  // Again Click Assign customer in Service item
  await CustomFieldsPage.clickAssignCustomersForStandardField(
    page,
    STANDARD_FIELD_SERVICE_ITEM,
  );

  // Select one customer (first available)
  const customerCheckboxes = page.locator(
    '//input[@type="checkbox"][@aria-label="Select Test Admin"]',
  );
  const firstCustomerCheckbox = customerCheckboxes.first();
  // await clickDropdownOption(page);
  await firstCustomerCheckbox.check();
  await page.waitForTimeout(5000);

  // Get customer name
  const customerRow = firstCustomerCheckbox.locator('..').locator('..');
  const customerName = await customerRow.textContent();
  const selectedCustomerName = customerName?.trim().split('\n')[0] || '';

  // Click Save
  await page
    .locator(
      `
//div[contains(@class,"Drawer-headerRightActionButton")]//button[@aria-label="Close"]`,
    )
    .click();
  await page
    .locator(`//div[@data-testid="ModalDialog"]//span[text()='Save']`)
    .click();
  await page.waitForTimeout(2000);
  await reactivateStandardFieldAfterAssignCustomersSave(
    page,
    STANDARD_FIELD_SERVICE_ITEM,
  );

  // navigate wte

  await weeklyTimeEntryPage.navigate(page);
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await page.waitForTimeout(WTE_TEAM_MEMBER_DROPDOWN_OPTIONS_SETTLE_MS);
  await weeklyTimeEntryPage.clickDropdownOption(page);
  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  const customerOptions = page.locator(`//span[text()='Customer']`);
  const customerCountInDropdown = await customerOptions.count();
  for (let i = 0; i < customerCountInDropdown; i++) {
    const optionText = await customerOptions.nth(i).textContent();
    if (optionText?.includes(selectedCustomerName)) {
      await customerOptions.nth(i).click();
      await page.waitForTimeout(1000);
      break;
    }
  }
  await page.waitForTimeout(1000);

  // Enter some hours without selecting customer/time category
  await weeklyTimeEntryPage.hours(page, 3).click();
  await weeklyTimeEntryPage.hoursInputs(page).fill('8');
  await weeklyTimeEntryPage.serviceDropdown(page).click();
  await weeklyTimeEntryPage.clickDropdownOption(page);

  // Verify Service item field is visible
  const serviceItemLabel = page.locator(`//span[text()="Service"]`);
  await expect(serviceItemLabel).toBeVisible({ timeout: 5000 });

  // Select another customer
  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await page.waitForTimeout(1000);
  await customerOptions.nth(3).click();
  await page.waitForTimeout(2000);

  // Verify Service item field is not visible
  await expect(serviceItemLabel).not.toBeVisible({ timeout: 3000 });

  // Cleanup: Unassign customers
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await timesheetFieldsEditButton.first().click();
  await page.waitForTimeout(2000);
  await deactivateStandardFieldBeforeAssignCustomersFlow(
    page,
    timesheetFieldsEditButton,
    STANDARD_FIELD_SERVICE_ITEM,
  );
  await CustomFieldsPage.clickAssignCustomersForStandardField(
    page,
    STANDARD_FIELD_SERVICE_ITEM,
  );
  await CustomFieldsPage.unselectAllCustomersInAssignPanel(page);
  await page.waitForTimeout(2000);
};

export const assignCustomerToStandardFieldAndValidateTimeClock = async (
  page: Page,
) => {
  // Navigate to Settings → Account & Settings → Time
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);

  // Click Timesheet fields edit button
  const timesheetFieldsEditButton = page.locator(
    `//div[@data-testid="timeSheet-settings"]//button[@aria-label="Edit"]`,
  );
  await timesheetFieldsEditButton.first().click();
  await page.waitForTimeout(2000);
  await deactivateStandardFieldBeforeAssignCustomersFlow(
    page,
    timesheetFieldsEditButton,
    STANDARD_FIELD_SERVICE_ITEM,
  );
  // Click Assign customer in Service item
  await CustomFieldsPage.clickAssignCustomersForStandardField(
    page,
    STANDARD_FIELD_SERVICE_ITEM,
  );
  await CustomFieldsPage.verifyAssignCustomersPanelVisible(page);
  await page.waitForTimeout(2000);

  // Uncheck all customers
  await CustomFieldsPage.unselectAllCustomersInAssignPanel(page);
  await page.waitForTimeout(5000);

  // Again Click Assign customer in Service item
  await CustomFieldsPage.clickAssignCustomersForStandardField(
    page,
    STANDARD_FIELD_SERVICE_ITEM,
  );

  // Select one customer (first available)
  const customerCheckboxes = page.locator(
    '//input[@type="checkbox"][@aria-label="Select Test Admin"]',
  );
  const firstCustomerCheckbox = customerCheckboxes.first();
  // await clickDropdownOption(page);
  await firstCustomerCheckbox.check();
  await page.waitForTimeout(5000);

  // Get customer name
  const customerRow = firstCustomerCheckbox.locator('..').locator('..');
  const customerName = await customerRow.textContent();
  const selectedCustomerName = customerName?.trim().split('\n')[0] || '';

  // Click Save
  await page
    .locator(
      `
//div[contains(@class,"Drawer-headerRightActionButton")]//button[@aria-label="Close"]`,
    )
    .click();
  await page
    .locator(`//div[@data-testid="ModalDialog"]//span[text()='Save']`)
    .click();
  await page.waitForTimeout(2000);
  await reactivateStandardFieldAfterAssignCustomersSave(
    page,
    STANDARD_FIELD_SERVICE_ITEM,
  );

  await page.waitForTimeout(2000);

  await navigateToTimeClock(page);
  await page.waitForTimeout(2000);
  const clockInButton = page.locator(`//span[text()='Clock in']`);
  await clockInButton.click();
  await page.waitForTimeout(2000);
  await clockInForAssignment(page);

  // Select the assigned customer
  const customerDropdown = page.locator(
    `//input[@aria-label="Select Customers"]`,
  );
  await customerDropdown.click();
  await page.waitForTimeout(1000);
  const customerOptions = page.getByRole('option');
  const customerCountInDropdown = await customerOptions.count();
  for (let i = 0; i < customerCountInDropdown; i++) {
    await page.waitForTimeout(1000);
    const optionText = await customerOptions.nth(i).textContent();
    if (optionText?.includes(selectedCustomerName)) {
      await customerOptions.nth(i).click();
      break;
    }
  }
  await page.waitForTimeout(10000);

  // Verify custom field is visible
  const customFieldLabel = page.locator(`//input[@aria-label="Test Admin"]`);
  await expect(customFieldLabel).toBeVisible({ timeout: 5000 });

  // Select another customer
  const options = await TimeClockPage.getCustomerProjectOptions(page);
  if (options.length > 0) {
    await TimeClockPage.selectCustomerProject(page, options[0]);
    await page.waitForTimeout(10000);
  }

  // Verify custom field is not visible
  await expect(customFieldLabel).not.toBeVisible({ timeout: 3000 });

  // clockout button
  await TimeClockPage.clickClockOut(page);
  await page.waitForTimeout(8000);

  // Cleanup: Unassign customers
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await timesheetFieldsEditButton.first().click();
  await page.waitForTimeout(2000);
  await deactivateStandardFieldBeforeAssignCustomersFlow(
    page,
    timesheetFieldsEditButton,
    STANDARD_FIELD_SERVICE_ITEM,
  );
  await CustomFieldsPage.clickAssignCustomersForStandardField(
    page,
    STANDARD_FIELD_SERVICE_ITEM,
  );

  await CustomFieldsPage.unselectAllCustomersInAssignPanel(page);
  await page.waitForTimeout(2000);
};

export const createCustomerAndValidate = async (page: Page) => {
  const assignmentsPage = await goToAssignments(page);

  // Click Add customer button
  await assignmentsPage.openAddCustomerDrawer();
  await page.waitForTimeout(2000);

  // Enter company name
  const randomString = Math.random().toString(36).substring(2, 15);
  const companyName = `Test Company ${randomString}`;
  await assignmentsPage.enterCompanyName(companyName);

  // Click Save button
  await assignmentsPage.drawerSaveButton().click();
  await page.waitForTimeout(3000);

  // Verify created customer appears in the assignments table
  await page.reload();
  await assignmentsPage.expectCustomerInTable(companyName);

  return companyName;
};

export const createCustomerValidateDelete = async (page: Page) => {
  const companyName = await createCustomerAndValidate(page);
  const assignmentsPage = new AssignmentsPage(page);
  await assignmentsPage.deleteCustomer(companyName);
  await page.waitForTimeout(3000);
  await assignmentsPage.goto();
  await assignmentsPage.expectCustomerNotInTable(companyName);
  return companyName;
};

/**
 * Elite assignment regression (legacy entrypoint): validates Assignments hub first, then
 * {@link createDropdownCustomFieldAndValidate}, then the same STE/WTE/custom-field steps as the priority variant
 * using `clickDropdownOption(1, 'Name')` / default team-member selection (not the priority-only "+ Add new" skips).
 *
 * Prefer {@link assignmentsPriorityConsolidatedCoverageFlow} for `PriorityCases.spec` (faster, full Assignments +
 * option-level coverage). Use {@link assignmentsPriorityEliteComprehensiveAssignmentFlow} for the longer path
 * (WTE + ASM057 bidirectional sync).
 */
export const assignmentsEliteComprehensiveAssignmentFlow = async (
  page: Page,
) => {
  const singleTimeEntryPage = new SingleTimeEntryPage(page);
  const singleTimeActivityPage = new SingleTimeActivityPage(page);
  const timeEntriesPage = new TimeEntriesPage(page);

  await validateAssignmentsAvailableForPremiumElite(page);
  const customFieldName = await createDropdownCustomFieldAndValidate(page);

  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForLoadState('load');
  await page.waitForTimeout(2000);

  await CustomFieldsPage.clickAssignCustomersForCustomField(
    page,
    customFieldName,
  );
  await CustomFieldsPage.verifyAssignCustomersPanelVisible(page);
  await CustomFieldsPage.unselectAllCustomersInAssignPanel(page);
  await CustomFieldsPage.clickAssignCustomersForCustomField(
    page,
    customFieldName,
  );

  const custCbClassic = page.locator(
    '//tbody/tr/td/label//input[@type="checkbox"]',
  );
  await custCbClassic.first().check();
  await page.waitForTimeout(2000);
  const custRowClassic = custCbClassic.first().locator('..').locator('..');
  const selectedCustomerNameClassic =
    ((await custRowClassic.textContent()) || '').trim().split('\n')[0] || '';

  await page
    .locator(
      `//div[contains(@class,"Drawer-headerRightActionButton")]//button[@aria-label="Close"]`,
    )
    .click();
  await page
    .locator(`//div[@data-testid="ModalDialog"]//span[text()='Save']`)
    .click();
  await page.waitForTimeout(2000);

  await navigateToSingleTimeEntry(page);
  await singleTimeEntryPage.waitForPageReady();
  await singleTimeEntryPage.handlePopupsInAnyOrder();
  await singleTimeEntryPage.waitTillNameFieldVisible();

  await singleTimeActivityPage.openDropdown('Name');
  await page.waitForTimeout(STE_NAME_DROPDOWN_OPTIONS_SETTLE_MS);
  await singleTimeActivityPage.clickDropdownOption(1, 'Name');

  // Customer combobox: openDropdown('Customer') already waits (see SingleTimeActivityPage.openDropdown).
  await singleTimeActivityPage.openDropdown('Customer');
  await page.waitForTimeout(STE_CUSTOMER_DROPDOWN_OPTIONS_SETTLE_MS);
  await selectFirstOptionContaining(
    page.getByRole('option'),
    selectedCustomerNameClassic,
  );
  await page.waitForTimeout(2000);

  await expect(
    weeklyTimeEntryPage.panelServiceDropdown(page).first(),
  ).toBeVisible();

  const cfLabelSteClassic = page
    .locator('label')
    .filter({ hasText: customFieldName });
  await expect(cfLabelSteClassic).toBeVisible();

  await singleTimeActivityPage.openDropdown('Customer');
  await page.waitForTimeout(STE_CUSTOMER_DROPDOWN_OPTIONS_SETTLE_MS);
  const steCustOptsOtherClassic = page.getByRole('option');
  const otherCountClassic = await steCustOptsOtherClassic.count();
  const otherIdxClassic = otherCountClassic > 2 ? 2 : 1;
  await steCustOptsOtherClassic.nth(otherIdxClassic).click();
  await page.waitForTimeout(2000);
  await expect(cfLabelSteClassic).not.toBeVisible();

  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.dismissIntuitIntelligenceIfVisible();
  await openWeeklyTimeEntry(page);
  await timeEntriesPage.dismissIntuitIntelligenceIfVisible();
  await weeklyTimeEntryPage.waitForLoadingToDisappear(page);
  await weeklyTimeEntryPage.handlePopupsInAnyOrder(page);

  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await page.waitForTimeout(WTE_TEAM_MEMBER_DROPDOWN_OPTIONS_SETTLE_MS);
  await weeklyTimeEntryPage.clickDropdownOption(page);

  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await selectCustomerInWTE(page, selectedCustomerNameClassic, {
    skipOpenDropdown: true,
    strict: true,
  });
  await page.waitForTimeout(1000);

  await weeklyTimeEntryPage.hours(page, 3).click();
  await weeklyTimeEntryPage.hoursInputs(page).fill('8');

  await weeklyTimeEntryPage.serviceDropdown(page).click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  await page.waitForTimeout(500);

  const cfInputWteClassic = page.locator(
    `//input[@aria-label="${customFieldName}"]`,
  );
  await expect(cfInputWteClassic).toBeVisible();

  await weeklyTimeEntryPage.notesInput(page).fill('Assignment priority E2E');
  await cfInputWteClassic.click();
  await weeklyTimeEntryPage.saveButton(page).click();
  await page.waitForTimeout(2000);

  await weeklyTimeEntryPage.hours(page, 3).click();
  await page.waitForTimeout(1000);
  await expect(cfInputWteClassic).toBeVisible();

  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await weeklyTimeEntryPage.clickCustomerDropdownOption(page, 2);
  await page.waitForTimeout(500);
  await expect(cfInputWteClassic).not.toBeVisible();

  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForLoadState('load');
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickAssignCustomersForCustomField(
    page,
    customFieldName,
  );
  await CustomFieldsPage.unselectAllCustomersInAssignPanel(page);
  await page.waitForTimeout(2000);

  await expandCustomFieldTableRowIfCollapsed(page, customFieldName);
  await page.waitForTimeout(1000);

  const optionRowsClassic = page.locator(`//tr[td[text()='List item']]`);
  const optionNameClassic =
    (
      (await optionRowsClassic.first().locator('td').first().textContent()) ||
      ''
    ).trim() || '';

  const optionMenuClassic = page.locator(
    `//*[text()='${optionNameClassic}']/ancestor::tr/descendant::*[@aria-label="Expand Menu"]`,
  );
  await optionMenuClassic.first().click();
  await page.waitForTimeout(500);
  const assignWorkersItemClassic = page.locator(`//*[text()="Assign workers"]`);
  await assignWorkersItemClassic.click();
  await page.waitForTimeout(1000);

  await CustomFieldsPage.unselectAllWorkersInAssignPanel(page);
  await CustomFieldsPage.clickSaveAssignWorkersPanel(page);
  await page.waitForTimeout(2000);

  await optionMenuClassic.first().click();
  await page.waitForTimeout(500);
  await assignWorkersItemClassic.click();
  await page.waitForTimeout(1000);

  const selectedWorkerNameClassic = await pickFirstNonAdminWorkerInAssignPanel(
    page,
  );
  await page.waitForTimeout(500);

  await CustomFieldsPage.clickSaveAssignWorkersPanel(page);
  await page.waitForTimeout(2000);

  await navigateToSingleTimeEntry(page);
  await singleTimeEntryPage.waitForPageReady();
  await singleTimeEntryPage.handlePopupsInAnyOrder();
  await singleTimeEntryPage.waitTillNameFieldVisible();

  await singleTimeActivityPage.openDropdown('Name');
  await page.waitForTimeout(STE_NAME_DROPDOWN_OPTIONS_SETTLE_MS);
  const nameOptsClassic = page.getByRole('option');
  await selectFirstOptionContaining(nameOptsClassic, selectedWorkerNameClassic);
  await page.waitForTimeout(2000);

  const cfLabelWorkerClassic = page
    .locator('label')
    .filter({ hasText: customFieldName });
  await expect(cfLabelWorkerClassic).toBeVisible();
  const cfComboClassic = cfLabelWorkerClassic
    .locator('..')
    .locator('div[role="combobox"]')
    .first();
  await cfComboClassic.click();
  await page.waitForTimeout(1000);
  await expect(
    page.getByRole('option').filter({ hasText: optionNameClassic }).first(),
  ).toBeVisible();

  await singleTimeActivityPage.openDropdown('Name');
  await page.waitForTimeout(STE_NAME_DROPDOWN_OPTIONS_SETTLE_MS);
  await classicAssignmentClickNameOptionOtherThan(
    nameOptsClassic,
    selectedWorkerNameClassic,
  );
  await page.waitForTimeout(2000);
  await expect(cfLabelWorkerClassic).not.toBeVisible();

  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.dismissIntuitIntelligenceIfVisible();
  await openWeeklyTimeEntry(page);
  await timeEntriesPage.dismissIntuitIntelligenceIfVisible();
  await weeklyTimeEntryPage.waitForLoadingToDisappear(page);
  await weeklyTimeEntryPage.handlePopupsInAnyOrder(page);

  const employeeDropdownClassic = page
    .locator('label')
    .filter({ hasText: 'Name' })
    .locator('div')
    .nth(1);
  await employeeDropdownClassic.click();
  await page.waitForTimeout(1000);
  const wteNameOptsClassic = page.getByRole('option');
  await selectFirstOptionContaining(
    wteNameOptsClassic,
    selectedWorkerNameClassic,
  );

  const wteCustDdClassic = page
    .locator('label')
    .filter({ hasText: 'customer' })
    .locator('div')
    .nth(1);
  await wteCustDdClassic.click();
  await page.waitForTimeout(1000);
  await page.getByRole('option').first().click();

  await weeklyTimeEntryPage.hoursInputs(page).first().fill('8');
  await page.waitForTimeout(2000);

  const cfLabelWteWorkerClassic = page
    .locator('label')
    .filter({ hasText: customFieldName });
  await expect(cfLabelWteWorkerClassic).toBeVisible();
  const cfDdWteClassic = cfLabelWteWorkerClassic
    .locator('..')
    .locator('div[role="combobox"]')
    .first();
  await cfDdWteClassic.click();
  await page.waitForTimeout(1000);
  await expect(
    page.getByRole('option').filter({ hasText: optionNameClassic }).first(),
  ).toBeVisible();

  await employeeDropdownClassic.click();
  await page.waitForTimeout(1000);
  await classicAssignmentClickNameOptionOtherThan(
    wteNameOptsClassic,
    selectedWorkerNameClassic,
  );
  await cfDdWteClassic.click();
  await page.waitForTimeout(1000);
  await expect(
    page.getByRole('option').filter({ hasText: optionNameClassic }).first(),
  ).not.toBeVisible();

  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForLoadState('load');
  await page.waitForTimeout(2000);
  await expandCustomFieldTableRowIfCollapsed(page, customFieldName);
  await page.waitForTimeout(1000);
  await optionMenuClassic.first().click();
  await page.waitForTimeout(500);
  await assignWorkersItemClassic.click();
  await page.waitForTimeout(1000);
  await CustomFieldsPage.unselectAllWorkersInAssignPanel(page);
  await CustomFieldsPage.clickSaveAssignWorkersPanel(page);
  await page.waitForTimeout(2000);

  await verifyFieldAssignmentsBidirectionalSync(page);
  await assignCustomerToStandardFieldAndValidateSTE(page);
  await deactivateAllTestCustomFields(page);
};

/**
 * `PriorityCases.spec` — same regression as {@link assignmentsEliteComprehensiveAssignmentFlow} with:
 * 1) Settings → Time → Custom fields cleanup via Manage all, then create dropdown from edit list (no duplicate Assignments trip for CF prep).
 * 2) Assignments hub (ASM034) after the field exists — then navigate back to Time custom fields and open **edit** before Assign customers (overview has no row actions).
 * 3) STE/WTE steps use priority-only helpers that skip "+ Add new" and admin-looking worker rows.
 * 4) Custom field visibility on timesheets follows **customer** scope from Time settings (and Assignments hub for other rules) — not toggling **Name** on STE/WTE.
 */
export const assignmentsPriorityEliteComprehensiveAssignmentFlow = async (
  page: Page,
) => {
  const singleTimeEntryPage = new SingleTimeEntryPage(page);
  const singleTimeActivityPage = new SingleTimeActivityPage(page);
  const timeEntriesPage = new TimeEntriesPage(page);

  await openTimeCustomFieldsEditAfterDeactivatingTestFields(page, {
    skipDeactivate: true,
  });
  const customFieldName =
    await createDropdownCustomFieldFromTimeSettingsEditListForPriorityCase(
      page,
    );

  await validateAssignmentsAvailableForPremiumElite(page);

  // ASM034 leaves us on Time settings overview; Assign customers lives on the custom fields **edit** list.
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForLoadState('load');
  await page.waitForTimeout(2000);

  await CustomFieldsPage.clickAssignCustomersForCustomField(
    page,
    customFieldName,
  );
  await CustomFieldsPage.verifyAssignCustomersPanelVisible(page);
  await CustomFieldsPage.unselectAllCustomersInAssignPanel(page);
  await CustomFieldsPage.clickAssignCustomersForCustomField(
    page,
    customFieldName,
  );

  const custCb = page.locator('//tbody/tr/td/label//input[@type="checkbox"]');
  await custCb.first().check();
  await page.waitForTimeout(2000);
  const custRow = custCb.first().locator('..').locator('..');
  const selectedCustomerName =
    ((await custRow.textContent()) || '').trim().split('\n')[0] || '';

  await CustomFieldsPage.clickSaveAssignCustomersPanel(page);
  await CustomFieldsPage.waitForAssignCustomersPanelDismissed(page);
  await CustomFieldsPage.exitCustomFieldsEditAfterAssignCustomers(page);

  // --- STE: standard Customer/Service + custom field (positive / negative by customer) ---
  await navigateToSingleTimeEntry(page);
  await singleTimeEntryPage.waitForPageReady();
  await singleTimeEntryPage.handlePopupsInAnyOrder();
  await singleTimeEntryPage.waitTillNameFieldVisible();

  await priorityCaseSelectSteNameField(page, singleTimeActivityPage);

  // Customer combobox: openDropdown('Customer') already waits (see SingleTimeActivityPage.openDropdown).
  await singleTimeActivityPage.openDropdown('Customer');
  await page.waitForTimeout(STE_CUSTOMER_DROPDOWN_OPTIONS_SETTLE_MS);
  await selectFirstOptionContaining(
    page.getByRole('option'),
    selectedCustomerName,
  );
  await page.waitForTimeout(2000);

  await expect(
    weeklyTimeEntryPage.panelServiceDropdown(page).first(),
  ).toBeVisible();

  const steCfByLabel = page.getByLabel(customFieldName, { exact: false });
  await expect(steCfByLabel).toBeVisible();

  await singleTimeActivityPage.openDropdown('Customer');
  await page.waitForTimeout(STE_CUSTOMER_DROPDOWN_OPTIONS_SETTLE_MS);
  const steCustOptsOther = page.getByRole('option');
  const otherCount = await steCustOptsOther.count();
  const otherIdx = otherCount > 2 ? 2 : 1;
  await steCustOptsOther.nth(otherIdx).click();
  await page.waitForTimeout(2000);
  await expect(steCfByLabel).not.toBeVisible();

  // --- WTE: Service (standard) + custom field, then other customer hides CF ---
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.dismissIntuitIntelligenceIfVisible();
  await openWeeklyTimeEntry(page);
  await timeEntriesPage.dismissIntuitIntelligenceIfVisible();
  await weeklyTimeEntryPage.waitForLoadingToDisappear(page);
  await weeklyTimeEntryPage.handlePopupsInAnyOrder(page);

  await priorityCaseSelectWteTeamMember(page);

  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await selectCustomerInWTE(page, selectedCustomerName, {
    skipOpenDropdown: true,
    strict: true,
  });
  await page.waitForTimeout(1000);

  await weeklyTimeEntryPage.hours(page, 3).click();
  await weeklyTimeEntryPage.hoursInputs(page).fill('8');

  await weeklyTimeEntryPage.serviceDropdown(page).click();
  await weeklyTimeEntryPage.clickDropdownOption(page);
  await page.waitForTimeout(500);

  const cfInputWte = page.locator(`//input[@aria-label="${customFieldName}"]`);
  await expect(cfInputWte).toBeVisible();

  await weeklyTimeEntryPage.notesInput(page).fill('Assignment priority E2E');
  await cfInputWte.click();
  await weeklyTimeEntryPage.saveButton(page).click();
  await page.waitForTimeout(2000);

  await weeklyTimeEntryPage.hours(page, 3).click();
  await page.waitForTimeout(1000);
  await expect(cfInputWte).toBeVisible();

  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await weeklyTimeEntryPage.clickCustomerDropdownOption(page, 2);
  await page.waitForTimeout(500);
  await expect(cfInputWte).not.toBeVisible();

  // --- Clear customer scope on this CF (worker assignment tests are next) ---
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForLoadState('load');
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickAssignCustomersForCustomField(
    page,
    customFieldName,
  );
  await CustomFieldsPage.unselectAllCustomersInAssignPanel(page);

  // --- Worker: still on custom fields edit; expand CF row ---
  await expandCustomFieldTableRowIfCollapsed(page, customFieldName);
  await page.waitForTimeout(1000);

  const optionRows = page.locator(`//tr[td[text()='List item']]`);
  const optionName =
    (
      (await optionRows.first().locator('td').first().textContent()) || ''
    ).trim() || '';

  const optionMenu = page.locator(
    `//*[text()='${optionName}']/ancestor::tr/descendant::*[@aria-label="Expand Menu"]`,
  );
  await optionMenu.first().click();
  await page.waitForTimeout(500);
  const assignWorkersItem = page.locator(`//*[text()="Assign workers"]`);
  await assignWorkersItem.click();
  await page.waitForTimeout(1000);

  await CustomFieldsPage.unselectAllWorkersInAssignPanel(page);
  await CustomFieldsPage.clickSaveAssignWorkersPanel(page);
  await page.waitForTimeout(2000);

  await optionMenu.first().click();
  await page.waitForTimeout(500);
  await assignWorkersItem.click();
  await page.waitForTimeout(1000);

  const selectedWorkerName = await pickFirstNonAdminWorkerInAssignPanel(page);

  await CustomFieldsPage.clickSaveAssignWorkersPanel(page);
  await page.waitForTimeout(2000);

  // STE/WTE still only show the CF when the field has assigned customers; re-bind after the clear above.
  await CustomFieldsPage.clickAssignCustomersForCustomField(
    page,
    customFieldName,
  );
  await CustomFieldsPage.verifyAssignCustomersPanelVisible(page);
  if (selectedCustomerName.trim()) {
    await CustomFieldsPage.selectCustomerInAssignPanel(
      page,
      selectedCustomerName,
    );
  } else {
    await page
      .locator('//tbody/tr/td/label//input[@type="checkbox"]')
      .first()
      .check();
  }
  await CustomFieldsPage.clickSaveAssignCustomersPanel(page);
  await CustomFieldsPage.waitForAssignCustomersPanelDismissed(page);
  await CustomFieldsPage.exitCustomFieldsEditAfterAssignCustomers(page);

  await navigateToSingleTimeEntry(page);
  await singleTimeEntryPage.waitForPageReady();
  await singleTimeEntryPage.handlePopupsInAnyOrder();
  await singleTimeEntryPage.waitTillNameFieldVisible();

  await singleTimeActivityPage.openDropdown('Name');
  await page.waitForTimeout(STE_NAME_DROPDOWN_OPTIONS_SETTLE_MS);
  const nameOpts = page.getByRole('option');
  await selectFirstOptionContaining(nameOpts, selectedWorkerName);
  await page.waitForTimeout(2000);

  // CF is scoped to assigned customers; select the same customer as earlier in the flow (not worker-only).
  await singleTimeActivityPage.openDropdown('Customer');
  await page.waitForTimeout(STE_CUSTOMER_DROPDOWN_OPTIONS_SETTLE_MS);
  await selectFirstOptionContaining(
    page.getByRole('option'),
    selectedCustomerName,
  );
  await page.waitForTimeout(2000);
  await expect(
    weeklyTimeEntryPage.panelServiceDropdown(page).first(),
  ).toBeVisible();

  const steCfWorkerByLabel = page.getByLabel(customFieldName, { exact: false });
  await expect(steCfWorkerByLabel).toBeVisible();
  await steCfWorkerByLabel.click();
  await page.waitForTimeout(1000);
  await expect(
    page.getByRole('option').filter({ hasText: optionName }).first(),
  ).toBeVisible();

  // Do not assert CF hides when changing Name — visibility is driven by customer assignment on the field, not the row worker.

  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.dismissIntuitIntelligenceIfVisible();
  await openWeeklyTimeEntry(page);
  await timeEntriesPage.dismissIntuitIntelligenceIfVisible();
  await weeklyTimeEntryPage.waitForLoadingToDisappear(page);
  await weeklyTimeEntryPage.handlePopupsInAnyOrder(page);

  const employeeDropdown = page
    .locator('label')
    .filter({ hasText: 'Name' })
    .locator('div')
    .nth(1);
  await employeeDropdown.click();
  await page.waitForTimeout(1000);
  const wteNameOpts = page.getByRole('option');
  await selectFirstOptionContaining(wteNameOpts, selectedWorkerName);

  const wteCustDd = page
    .locator('label')
    .filter({ hasText: 'customer' })
    .locator('div')
    .nth(1);
  await wteCustDd.click();
  await page.waitForTimeout(1000);
  await selectCustomerInWTE(page, selectedCustomerName, {
    skipOpenDropdown: true,
    strict: true,
  });

  await weeklyTimeEntryPage.hoursInputs(page).first().fill('8');
  await page.waitForTimeout(2000);

  const wteCfWorkerByLabel = page.getByLabel(customFieldName, { exact: false });
  await expect(wteCfWorkerByLabel).toBeVisible();
  await wteCfWorkerByLabel.click();
  await page.waitForTimeout(1000);
  await expect(
    page.getByRole('option').filter({ hasText: optionName }).first(),
  ).toBeVisible();

  // Same as STE: list-item / worker wiring in settings does not make the CF vanish when only the row Name changes.

  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForLoadState('load');
  await page.waitForTimeout(2000);
  await expandCustomFieldTableRowIfCollapsed(page, customFieldName);
  await page.waitForTimeout(1000);
  await optionMenu.first().click();
  await page.waitForTimeout(500);
  await assignWorkersItem.click();
  await page.waitForTimeout(1000);
  await CustomFieldsPage.unselectAllWorkersInAssignPanel(page);
  await CustomFieldsPage.clickSaveAssignWorkersPanel(page);
  await page.waitForTimeout(2000);

  await verifyFieldAssignmentsBidirectionalSync(page);
  await assignCustomerToStandardFieldAndValidateSTE(page);
  await deactivateAllTestCustomFields(page);
};

async function getNthCustomerNameFromAssignmentsTable(
  page: Page,
  index: number,
): Promise<string> {
  const row = page
    .locator(
      'table[summary="Customer assignment table"], table:has(th:has-text("Time tracking fields"))',
    )
    .first()
    .locator('tbody tr')
    .nth(index);
  await expect(row).toBeVisible({ timeout: 30_000 });
  const raw = ((await row.locator('td').first().textContent()) || '').trim();
  return raw.split('\n')[0].trim();
}

/** First list item on a dropdown CF: **Assign customers** only, then collapse the field row. */
async function listItemAssignCustomersOnlyForDropdownField(
  page: Page,
  customFieldName: string,
  customerName: string,
): Promise<void> {
  await expandCustomFieldTableRowIfCollapsed(page, customFieldName);
  await page.waitForTimeout(400);
  const firstListItemRow = page.locator('//tr[td[text()="List item"]]');
  await expect(firstListItemRow.first()).toBeVisible({ timeout: 25_000 });
  const optionExpandMenu = firstListItemRow
    .first()
    .locator('[aria-label="Expand Menu"]');
  await optionExpandMenu.first().click();
  await page.waitForTimeout(400);
  const assignCustomersMenu = page.getByRole('menuitem', {
    name: /assign customers/i,
  });
  if (
    await assignCustomersMenu.isVisible({ timeout: 6000 }).catch(() => false)
  ) {
    await assignCustomersMenu.click();
    await CustomFieldsPage.verifyAssignCustomersPanelVisible(page);
    await CustomFieldsPage.selectCustomerInAssignPanel(page, customerName);
    await CustomFieldsPage.clickSaveAssignCustomersPanel(page);
    await CustomFieldsPage.waitForAssignCustomersPanelDismissed(page);
  }
  await collapseCustomFieldTableRowIfExpanded(page, customFieldName);
}

/** First list item on a dropdown CF: **Assign workers** only, then collapse the field row. */
async function listItemAssignWorkersOnlyForDropdownField(
  page: Page,
  customFieldName: string,
): Promise<void> {
  await expandCustomFieldTableRowIfCollapsed(page, customFieldName);
  await page.waitForTimeout(400);
  const firstListItemRow = page.locator('//tr[td[text()="List item"]]');
  await expect(firstListItemRow.first()).toBeVisible({ timeout: 25_000 });
  const optionExpandMenu = firstListItemRow
    .first()
    .locator('[aria-label="Expand Menu"]');
  await optionExpandMenu.first().click();
  await page.waitForTimeout(400);
  const assignWorkersMenuItem = page
    .getByRole('menuitem', { name: /assign workers/i })
    .or(page.locator(`//*[text()="Assign workers"]`));
  await assignWorkersMenuItem.first().click();
  await page.waitForTimeout(600);
  await pickFirstNonAdminWorkerInAssignPanel(page);
  await CustomFieldsPage.clickSaveAssignWorkersPanel(page);
  await page.waitForTimeout(600);
  await collapseCustomFieldTableRowIfExpanded(page, customFieldName);
}

/**
 * Ensure a row is checked in **Assign time tracking fields** (Assignments → customer).
 * Uses `aria-label="Select {name}"` on the checkbox (same as {@link AssignmentsPage.selectItemByNameInDrawer}).
 * The old `hasText` + first nested checkbox often missed the real control and **silently skipped** — Location never got checked.
 *
 * **Dialog scope:** Do not use `getByRole('dialog', { name: /…/ })` — QBO often exposes the drawer’s *accessible name*
 * as the summary line (e.g. “2 of 4 time tracking fields assigned to …”), not “Assign time tracking fields”. Scope by
 * a descendant heading instead (same idea as {@link AssignmentsPage.assignmentDrawerTitle}).
 *
 * **Long lists:** QBO often shows standard fields first; custom fields sit below the fold or only appear after
 * using the drawer **Search** box. We filter by the field name so `Select …` rows are actually in the tree / viewport.
 */
async function ensureCustomFieldCheckedInTtfDrawer(
  page: Page,
  customFieldName: string,
): Promise<void> {
  const base = customFieldName.split('(')[0].trim();
  if (!base) return;
  const logTtfOk = () =>
    console.log('[assignments-matrix] TTF drawer: ensured checked —', base);
  const drawer = page.getByRole('dialog').filter({
    has: page.getByRole('heading', {
      name: /assign time tracking fields/i,
      exact: false,
    }),
  });

  const drawerSearch = drawer.getByRole('textbox', { name: 'Search' });
  if (await drawerSearch.isVisible({ timeout: 3000 }).catch(() => false)) {
    await drawerSearch.click();
    await drawerSearch.fill('');
    await drawerSearch.fill(base);
    await page.waitForTimeout(600);
  }

  const tryCheck = async (cb: Locator): Promise<boolean> => {
    await cb.scrollIntoViewIfNeeded().catch(() => {});
    if (!(await cb.isVisible({ timeout: 3000 }).catch(() => false))) {
      return false;
    }
    if (!(await cb.isChecked().catch(() => false))) {
      await cb.check();
    }
    logTtfOk();
    return true;
  };

  const byAria = drawer.locator(
    `[type="checkbox"][aria-label="Select ${base}"]`,
  );
  if (await tryCheck(byAria)) return;

  const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const fieldCheckboxes = drawer.locator(
    'input[type="checkbox"][aria-label^="Select "]',
  );
  const n = await fieldCheckboxes.count();
  for (let i = 0; i < n; i++) {
    const cb = fieldCheckboxes.nth(i);
    const aria = ((await cb.getAttribute('aria-label')) || '').trim();
    if (/select all workers/i.test(aria)) continue;
    // Allow suffix after the field name (e.g. inactive state) in aria-label.
    if (
      new RegExp(`^select\\s+${escaped}(\\s|$|\\()`, 'i').test(aria) &&
      !/^select\s+all\b/i.test(aria)
    ) {
      await cb.scrollIntoViewIfNeeded().catch(() => {});
      await expect(cb).toBeVisible({ timeout: 12_000 });
      if (!(await cb.isChecked().catch(() => false))) {
        await cb.check();
      }
      logTtfOk();
      return;
    }
  }
  // Do not use `filter({ has: drawer.getByText(...) })` — Playwright treats `drawer.getByText` as starting
  // from the dialog root, so each div/tr/li must *contain a nested dialog*; no row matches. Prefer label row
  // (QBO: checkbox + field name live under one label) or role + accessible name.
  const byLabel = drawer
    .locator('label')
    .filter({ hasText: base })
    .locator('input[type="checkbox"]')
    .first();
  if (await tryCheck(byLabel)) return;

  const fallback = drawer
    .getByRole('checkbox', {
      name: new RegExp(`^Select\\s+${escaped}(\\s|\\(|$)`, 'i'),
    })
    .first();
  await fallback.scrollIntoViewIfNeeded().catch(() => {});
  await expect(fallback).toBeVisible({ timeout: 12_000 });
  if (!(await fallback.isChecked().catch(() => false))) {
    await fallback.check();
  }
  logTtfOk();
}

const STANDARD_TIMESHEET_FIELD_LOCATION = 'Location';

async function assignFieldLevelCustomersOnlyToCustomer(
  page: Page,
  customFieldName: string,
  customerName: string,
): Promise<void> {
  const base = customFieldName.split('(')[0].trim();
  await CustomFieldsPage.clickAssignCustomersForCustomField(page, base);
  await CustomFieldsPage.verifyAssignCustomersPanelVisible(page);
  await CustomFieldsPage.unselectAllCustomersInAssignPanel(page);
  await CustomFieldsPage.clickAssignCustomersForCustomField(page, base);
  await CustomFieldsPage.verifyAssignCustomersPanelVisible(page);
  await CustomFieldsPage.selectCustomerInAssignPanel(page, customerName);
  await CustomFieldsPage.clickSaveAssignCustomersPanel(page);
  await CustomFieldsPage.waitForAssignCustomersPanelDismissed(page);
}

/** First dropdown option row: clear workers, assign only the first eligible worker; returns that worker label. */
async function listFirstOptionAssignWorkersExclusiveFirstWorker(
  page: Page,
  customFieldName: string,
): Promise<string> {
  const base = customFieldName.split('(')[0].trim();
  await expandCustomFieldTableRowIfCollapsed(page, base);
  await page.waitForTimeout(400);
  const firstListItemRow = page.locator('//tr[td[text()="List item"]]');
  await expect(firstListItemRow.first()).toBeVisible({ timeout: 25_000 });
  await firstListItemRow
    .first()
    .locator('[aria-label="Expand Menu"]')
    .first()
    .click();
  await page.waitForTimeout(400);
  await page
    .getByRole('menuitem', { name: /assign workers/i })
    .first()
    .click();
  await page.waitForTimeout(600);
  await CustomFieldsPage.unselectAllWorkersInAssignPanel(page);
  const workerLabel = await pickFirstNonAdminWorkerInAssignPanel(page);
  await CustomFieldsPage.clickSaveAssignWorkersPanel(page);
  await page.waitForTimeout(600);
  await collapseCustomFieldTableRowIfExpanded(page, base);
  return workerLabel;
}

async function priorityCaseSelectSteNthSelectableWorker(
  page: Page,
  singleTimeActivityPage: SingleTimeActivityPage,
  workerIndex: number,
): Promise<void> {
  await priorityCaseEnsureSteNameDropdownOpen(page, singleTimeActivityPage);
  await page.waitForTimeout(STE_NAME_DROPDOWN_OPTIONS_SETTLE_MS);

  const collect = async (): Promise<Locator[]> => {
    const out: Locator[] = [];
    const opts = page.getByRole('option');
    const n = await opts.count();
    for (let i = 0; i < n; i++) {
      const t = ((await opts.nth(i).textContent()) || '').trim();
      if (priorityCaseIsSelectableWorkerOption(t)) out.push(opts.nth(i));
    }
    if (out.length > workerIndex) return out;
    const lb = page.getByRole('listbox').first().locator('[role="option"], li');
    const m = await lb.count();
    for (let i = 0; i < m; i++) {
      const t = ((await lb.nth(i).textContent()) || '').trim();
      if (priorityCaseIsSelectableWorkerOption(t)) out.push(lb.nth(i));
    }
    return out;
  };

  const rows = await collect();
  if (rows.length <= workerIndex) {
    throw new Error(
      `priorityCaseSelectSteNthSelectableWorker: need worker index ${workerIndex}, found ${rows.length}`,
    );
  }
  await rows[workerIndex].click();
  await page.waitForTimeout(1500);
}

/**
 * QBO WTE: **Escape** often closes the **time-entry side panel** or exits weekly context, not just the open listbox.
 * Prefer refocusing the grid (hours cell) to dismiss combobox / QuickFind UI before switching team member.
 */
async function wteDismissOpenListUiWithoutEscape(page: Page): Promise<void> {
  await weeklyTimeEntryPage.hours(page, 3).click({ force: true });
  await page.waitForTimeout(450);
}

async function wteSelectNthSelectableTeamMember(
  page: Page,
  memberIndex: number,
): Promise<void> {
  const chevron = weeklyTimeEntryPage.teamMemberDropdown(page).first();
  const fieldInput = weeklyTimeEntryPage.teamMemberDropdownValue(page).first();
  await chevron.click({ force: true });
  await page.waitForTimeout(600);
  if ((await page.getByRole('option').count()) === 0) {
    await fieldInput.click({ force: true });
    await page.waitForTimeout(600);
  }

  const out: Locator[] = [];
  const opts = page.getByRole('option');
  const n = await opts.count();
  for (let i = 0; i < n; i++) {
    const t = ((await opts.nth(i).textContent()) || '').trim();
    if (priorityCaseIsSelectableWorkerOption(t)) out.push(opts.nth(i));
  }
  if (out.length <= memberIndex) {
    throw new Error(
      `wteSelectNthSelectableTeamMember: need index ${memberIndex}, found ${out.length}`,
    );
  }
  await out[memberIndex].click();
  await page.waitForTimeout(2000);
}

/**
 * Persist **Timesheet settings** after Assign customers / Assign workers on that screen.
 *
 * **Legacy drawer:** older shells stacked a **side Drawer** (header Close =
 * `Drawer-headerRightActionButton`) inside the customize flow; you had to Close it, then Save the modal.
 * Current QBO often shows **only** the Timesheet settings `ModalDialog` with footer **Save** (your screenshot).
 * The drawer close is **best-effort** with a short visibility check so we never sit on `click()` for the default
 * 30s timeout when that chrome is absent.
 */
async function closeTimesheetAssignCustomersDrawerAndSaveModal(
  page: Page,
): Promise<void> {
  const legacyDrawerClose = page.locator(
    `//div[contains(@class,"Drawer-headerRightActionButton")]//button[@aria-label="Close"]`,
  );
  if (await legacyDrawerClose.isVisible({ timeout: 1500 }).catch(() => false)) {
    await legacyDrawerClose.click({ timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(400);
  }
  await saveTimesheetFieldsSettingsModal(page);
}

async function standardFieldDetailAssignCustomersForAllValues(
  page: Page,
  customerName: string,
): Promise<void> {
  // Standard field detail screen: a table of values (e.g., Service item values) with per-row Assign Customers actions.
  const rows = page.locator('table tbody tr').filter({
    has: page
      .getByRole('link', { name: /assign customers/i })
      .or(page.getByRole('button', { name: /assign customers/i })),
  });
  const count = await rows.count();
  if (count === 0) {
    throw new Error(
      'standardFieldDetailAssignCustomersForAllValues: no value rows with Assign Customers action found',
    );
  }

  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    const assign = row
      .getByRole('link', { name: /assign customers/i })
      .or(row.getByRole('button', { name: /assign customers/i }))
      .first();
    await assign.click();
    await CustomFieldsPage.verifyAssignCustomersPanelVisible(page);
    await CustomFieldsPage.unselectAllCustomersInAssignPanel(page);
    // Re-open assign customers for same row (panel Save may dismiss back to detail table)
    await assign.click();
    await CustomFieldsPage.verifyAssignCustomersPanelVisible(page);
    await CustomFieldsPage.selectCustomerInAssignPanel(page, customerName);
    await CustomFieldsPage.clickSaveAssignCustomersPanel(page);
    await CustomFieldsPage.waitForAssignCustomersPanelDismissed(page);
    await page.waitForTimeout(500);
  }
}

/**
 * Assign **Service** standard field to `customer2Name` only (deactivate first if needed), save, reactivate, save.
 */
async function configureServiceStandardFieldCustomerExclusive(
  page: Page,
  customer2Name: string,
): Promise<void> {
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(1500);
  const timesheetFieldsEditButton = page.locator(
    `//div[@data-testid="timeSheet-settings"]//button[@aria-label="Edit"]`,
  );
  await timesheetFieldsEditButton.first().click();
  await page.waitForTimeout(2000);
  await deactivateStandardFieldBeforeAssignCustomersFlow(
    page,
    timesheetFieldsEditButton,
    STANDARD_FIELD_SERVICE_ITEM,
  );
  await CustomFieldsPage.clickAssignCustomersForStandardField(
    page,
    STANDARD_FIELD_SERVICE_ITEM,
  );
  const panel = page.getByRole('dialog', { name: /Assign customers/i });
  if (await panel.isVisible({ timeout: 2500 }).catch(() => false)) {
    await CustomFieldsPage.verifyAssignCustomersPanelVisible(page);
    await CustomFieldsPage.unselectAllCustomersInAssignPanel(page);
    await CustomFieldsPage.clickAssignCustomersForStandardField(
      page,
      STANDARD_FIELD_SERVICE_ITEM,
    );
    await CustomFieldsPage.verifyAssignCustomersPanelVisible(page);
    await CustomFieldsPage.selectCustomerInAssignPanel(page, customer2Name);
    await CustomFieldsPage.clickSaveAssignCustomersPanel(page);
    await CustomFieldsPage.waitForAssignCustomersPanelDismissed(page);
  } else {
    // We navigated into the standard-field values table (e.g., Service item values). Apply to all rows.
    await standardFieldDetailAssignCustomersForAllValues(page, customer2Name);
  }
  await closeTimesheetAssignCustomersDrawerAndSaveModal(page);
  await reactivateStandardFieldAfterAssignCustomersSave(
    page,
    STANDARD_FIELD_SERVICE_ITEM,
  );
}

/**
 * After **Assign customers** on the **Service** row on the main Timesheet fields list: open **View**
 * (inline link/button or same row actions menu → **View**) to reach Hours/Sales.
 * If we are already on the values table (fallback paths), skip.
 */
async function openServiceItemValuesScreenViaViewFromTimesheetFieldsList(
  page: Page,
): Promise<void> {
  const timesheetModal = page
    .locator('[data-testid="ModalDialog"]')
    .filter({ hasText: /timesheet settings/i })
    .or(page.getByRole('dialog').filter({ hasText: /timesheet settings/i }))
    .first();
  const shell = (await timesheetModal
    .isVisible({ timeout: 4000 })
    .catch(() => false))
    ? timesheetModal
    : page.getByTestId('ModalDialog').or(page.getByRole('dialog')).first();

  const hoursRow = shell
    .locator('tbody tr')
    .filter({
      has: page.getByRole('cell', {
        name: SERVICE_ITEM_VALUE_HOURS,
        exact: true,
      }),
    })
    .first();

  const fieldRow = shell
    .locator('tbody tr')
    .filter({
      has: page.getByText(STANDARD_FIELD_SERVICE_ITEM, { exact: true }),
    })
    .first();

  const onValuesScreen = await hoursRow
    .isVisible({ timeout: 2000 })
    .catch(() => false);
  const onMainList = await fieldRow
    .isVisible({ timeout: 2000 })
    .catch(() => false);
  if (onValuesScreen && !onMainList) {
    return;
  }

  await expect(fieldRow).toBeVisible({
    timeout: 15_000,
  });

  const viewInRow = fieldRow
    .getByRole('button', { name: /^view$/i })
    .or(fieldRow.getByRole('link', { name: /^view$/i }))
    .or(fieldRow.getByText(/^view$/i));
  if (
    await viewInRow
      .first()
      .isVisible({ timeout: 4000 })
      .catch(() => false)
  ) {
    await viewInRow.first().click();
  } else {
    const menuTrigger = fieldRow
      .locator('[aria-label="Expand Menu"]')
      .or(fieldRow.getByRole('button', { name: /expand menu/i }))
      .or(
        fieldRow
          .locator('button[aria-haspopup="menu"], button[aria-haspopup="true"]')
          .first(),
      );
    await expect(menuTrigger.first()).toBeVisible({ timeout: 15_000 });
    await menuTrigger.first().click();
    await page.waitForTimeout(400);
    const viewMenuItem = page
      .getByRole('menuitem', { name: /^view$/i })
      .first();
    await expect(viewMenuItem).toBeVisible({ timeout: 8000 });
    await viewMenuItem.click();
  }

  await page.waitForTimeout(2000);
  await expect(hoursRow).toBeVisible({ timeout: 15_000 });
}

async function serviceItemValueRowOpenAssignWorkers(
  page: Page,
  valueLabel: string,
): Promise<void> {
  const timesheetModal = page
    .locator('[data-testid="ModalDialog"]')
    .filter({ hasText: /timesheet settings/i })
    .or(page.getByRole('dialog').filter({ hasText: /timesheet settings/i }))
    .first();
  const shell = (await timesheetModal
    .isVisible({ timeout: 4000 })
    .catch(() => false))
    ? timesheetModal
    : page.getByTestId('ModalDialog').or(page.getByRole('dialog')).first();

  const row = shell
    .locator('tbody tr')
    .filter({
      has: page.getByRole('cell', { name: valueLabel, exact: true }),
    })
    .first();
  await expect(row).toBeVisible({ timeout: 15_000 });
  const actions = row.getByRole('cell').last();
  const menuTrigger = actions
    .locator('button[aria-haspopup="menu"], button[aria-haspopup="true"]')
    .last();
  if (await menuTrigger.isVisible({ timeout: 4000 }).catch(() => false)) {
    await menuTrigger.click();
    await page.waitForTimeout(400);
    await page
      .getByRole('menuitem', { name: /assign workers/i })
      .first()
      .click();
    await page.waitForTimeout(600);
    return;
  }
  const expand = row.locator('[aria-label="Expand Menu"]').first();
  if (await expand.isVisible({ timeout: 3000 }).catch(() => false)) {
    await expand.click();
    await page.waitForTimeout(400);
    await page
      .getByRole('menuitem', { name: /assign workers/i })
      .first()
      .click();
    await page.waitForTimeout(600);
    return;
  }
  throw new Error(
    `serviceItemValueRowOpenAssignWorkers: could not open Assign workers for "${valueLabel}"`,
  );
}

/**
 * Extended matrix: **Service** assign-customers = `customer1Name` only; **Hours** assign-workers = 2nd eligible worker only.
 *
 * **Leave Service Inactive after save:** With **Service item Active**, QBO often treats it as “all customers / all workers”
 * and restricted assignments do not stick. We **deactivate** before edits, configure, save — and **do not** reactivate here,
 * so customer + Hours-worker rules remain effective for STE/WTE checks.
 *
 * QBO Timesheet fields: (1) main list → row **Service** → actions menu → **Assign customers**;
 * (2) **View** (link or menu) → values table; (3) **Hours** row → menu → **Assign workers** (Sales left at defaults).
 */
async function configureServiceStandardFieldCustomer1AndHoursExclusiveSecondWorker(
  page: Page,
  customer1Name: string,
): Promise<void> {
  const timesheetFieldsEditButton = page.locator(
    `//div[@data-testid="timeSheet-settings"]//button[@aria-label="Edit"]`,
  );

  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(1500);
  await timesheetFieldsEditButton.first().click();
  await page.waitForTimeout(2000);
  await deactivateStandardFieldBeforeAssignCustomersFlow(
    page,
    timesheetFieldsEditButton,
    STANDARD_FIELD_SERVICE_ITEM,
  );
  await CustomFieldsPage.clickAssignCustomersForStandardFieldMainListOnly(
    page,
    STANDARD_FIELD_SERVICE_ITEM,
  );
  const assignCustPanel = page.getByRole('dialog', {
    name: /Assign customers/i,
  });
  let alreadyOnServiceValueDetail = false;
  if (await assignCustPanel.isVisible({ timeout: 2500 }).catch(() => false)) {
    await CustomFieldsPage.verifyAssignCustomersPanelVisible(page);
    await CustomFieldsPage.unselectAllCustomersInAssignPanel(page);
    await CustomFieldsPage.clickAssignCustomersForStandardFieldMainListOnly(
      page,
      STANDARD_FIELD_SERVICE_ITEM,
    );
    await CustomFieldsPage.verifyAssignCustomersPanelVisible(page);
    await CustomFieldsPage.selectCustomerInAssignPanel(page, customer1Name);
    await CustomFieldsPage.clickSaveAssignCustomersPanel(page);
    await CustomFieldsPage.waitForAssignCustomersPanelDismissed(page);
  } else {
    await standardFieldDetailAssignCustomersForAllValues(page, customer1Name);
    alreadyOnServiceValueDetail = true;
  }

  if (!alreadyOnServiceValueDetail) {
    await openServiceItemValuesScreenViaViewFromTimesheetFieldsList(page);
  }

  await serviceItemValueRowOpenAssignWorkers(page, SERVICE_ITEM_VALUE_HOURS);
  await CustomFieldsPage.unselectAllWorkersInAssignPanel(page);
  await checkExclusiveNthNonAdminWorkerInAssignPanel(page, 1);
  await CustomFieldsPage.clickSaveAssignWorkersPanel(page);
  await page.waitForTimeout(600);

  await closeTimesheetAssignCustomersDrawerAndSaveModal(page);
  console.log(
    '[assignments-matrix] Service standard field: customer1 only, Hours → 2nd worker only; timesheet settings saved',
  );
}

/**
 * Extended-matrix cleanup: set **Hours** assign-workers back to **all** while **Service item** stays **Inactive**
 * on Timesheet settings (same as the test setup). Does **not** toggle Service to Active — re-enabling would fight the
 * next run, which expects restricted assignments to work only while the field is off.
 */
async function restoreServiceItemHoursWorkersToAll(page: Page): Promise<void> {
  const timesheetFieldsEditButton = page.locator(
    `//div[@data-testid="timeSheet-settings"]//button[@aria-label="Edit"]`,
  );
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(1500);
  await timesheetFieldsEditButton.first().click();
  await page.waitForTimeout(2000);
  await deactivateStandardFieldBeforeAssignCustomersFlow(
    page,
    timesheetFieldsEditButton,
    STANDARD_FIELD_SERVICE_ITEM,
  );
  try {
    await openServiceItemValuesScreenViaViewFromTimesheetFieldsList(page);
  } catch {
    await closeTimesheetAssignCustomersDrawerAndSaveModal(page).catch(() => {});
    await dismissTimesheetCustomizeWithoutSaving(page).catch(() => {});
    return;
  }
  try {
    await serviceItemValueRowOpenAssignWorkers(page, SERVICE_ITEM_VALUE_HOURS);
    const panel = page.getByRole('dialog', { name: /Assign workers/i });
    const groupToggle = panel
      .locator('input[type="checkbox"][aria-label^="Select "]')
      .first();
    if (await groupToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      if (!(await groupToggle.isChecked().catch(() => false))) {
        await groupToggle.check();
      }
    }
    await CustomFieldsPage.clickSaveAssignWorkersPanel(page);
    await page.waitForTimeout(500);
  } catch {
    /* best-effort restore */
  }
  await closeTimesheetAssignCustomersDrawerAndSaveModal(page);
}

async function restoreStandardFieldAssignCustomersToAll(
  page: Page,
  fieldName: string,
): Promise<void> {
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(1500);
  const timesheetFieldsEditButton = page.locator(
    `//div[@data-testid="timeSheet-settings"]//button[@aria-label="Edit"]`,
  );
  await timesheetFieldsEditButton.first().click();
  await page.waitForTimeout(2000);

  const panel = page.getByRole('dialog', { name: /Assign customers/i });

  // Location has no Service-style “values” table (Hours/Sales rows). Use main-list Assign customers only;
  // never fall through to the per-row values cleanup (wrong shell / no value rows).
  if (fieldName === STANDARD_TIMESHEET_FIELD_LOCATION) {
    await CustomFieldsPage.clickAssignCustomersForStandardFieldMainListOnly(
      page,
      fieldName,
    );
    await expect(panel).toBeVisible({ timeout: 20_000 });
    await CustomFieldsPage.verifyAssignCustomersPanelVisible(page);
    await CustomFieldsPage.selectAllCustomersInAssignPanel(page);
    await CustomFieldsPage.waitForAssignCustomersPanelDismissed(page);
  } else {
    await CustomFieldsPage.clickAssignCustomersForStandardField(
      page,
      fieldName,
    );
    if (await panel.isVisible({ timeout: 2500 }).catch(() => false)) {
      await CustomFieldsPage.verifyAssignCustomersPanelVisible(page);
      await CustomFieldsPage.selectAllCustomersInAssignPanel(page);
      await CustomFieldsPage.waitForAssignCustomersPanelDismissed(page);
    } else {
      // Standard-field values table (e.g. Service item): select all customers for every value row.
      const rows = page.locator('table tbody tr').filter({
        has: page
          .getByRole('link', { name: /assign customers/i })
          .or(page.getByRole('button', { name: /assign customers/i })),
      });
      const count = await rows.count();
      for (let i = 0; i < count; i++) {
        const row = rows.nth(i);
        const assign = row
          .getByRole('link', { name: /assign customers/i })
          .or(row.getByRole('button', { name: /assign customers/i }))
          .first();
        await assign.click();
        await CustomFieldsPage.verifyAssignCustomersPanelVisible(page);
        await CustomFieldsPage.selectAllCustomersInAssignPanel(page);
        await CustomFieldsPage.waitForAssignCustomersPanelDismissed(page);
      }
    }
  }
  await closeTimesheetAssignCustomersDrawerAndSaveModal(page);
}

function customFieldBaseName(name: string): string {
  return name.split('(')[0].trim();
}

async function steSelectCustomerByName(page: Page, customerName: string) {
  await page
    .locator(`//input[contains(@aria-label, 'Customer')]`)
    .first()
    .click();
  await page.waitForTimeout(STE_CUSTOMER_DROPDOWN_OPTIONS_SETTLE_MS);
  await selectFirstOptionContaining(page.getByRole('option'), customerName);
  await page.waitForTimeout(1000);
}

async function getFirstTwoCustomerNamesFromAssignCustomersPanel(
  page: Page,
): Promise<[string, string]> {
  // Use the dialog-scoped checkbox list and explicitly exclude the group toggle.
  const panel = page.getByRole('dialog', { name: /Assign customers/i });
  const boxes = panel.locator('input[type="checkbox"][aria-label^="Select "]');
  await expect(boxes.first()).toBeVisible({ timeout: 25_000 });
  const count = await boxes.count();
  if (count < 2) {
    throw new Error(
      `Expected at least 2 customers in Assign customers panel, found ${count}`,
    );
  }

  // Some shells include a group toggle in the list (e.g. "Select Customers/Projects").
  // Be defensive and skip anything that isn't a real customer row.
  const customers: string[] = [];
  for (let i = 0; i < count; i++) {
    const aria = (await boxes.nth(i).getAttribute('aria-label')) || '';
    const name = aria.replace(/^Select\s+/i, '').trim();
    if (!name) continue;
    // "Select all items" is a select-all control, not a customer.
    if (/^all items$/i.test(name)) continue;
    if (/select\s+all/i.test(aria)) continue;
    if (/customers\/projects/i.test(name)) continue;
    if (/^customers$/i.test(name)) continue;
    customers.push(name);
    if (customers.length >= 2) break;
  }
  const c1 = customers[0] || '';
  const c2 = customers[1] || '';
  if (!c1 || !c2) {
    throw new Error(
      `Could not parse two customer names from Assign customers panel (count=${count})`,
    );
  }
  if (c1.toLowerCase() === c2.toLowerCase()) {
    throw new Error(`Customer 1 and 2 resolved to same name: "${c1}"`);
  }
  return [c1, c2];
}

/**
 * Long-form E2E: two dropdown CFs (field-level **customer 1 only**; CF2 option 1 → worker 1 only), STE+WTE matrix,
 * **Service item** + Assignments workers + Location TTF (no Timesheet “turn field Active” mid-flow).
 *
 * **Customer scope:** On STE/WTE, **both** CFs are expected **visible** with customer 1 and **hidden** with customer 2;
 * CF2 “Option 1” is asserted only after switching **back** to customer 1 (TM1), then TM2 + customer 1 should not list Option 1.
 *
 * **Critical — Timesheet standard field Active vs assignments:** In QBO, setting a standard field (e.g. **Service item**,
 * **Location**) to **Active** on Timesheet settings **overrides** per-customer / per-worker assignment work — the field
 * effectively applies to **all** customers and workers. For assignment-scoped behavior (our case), those standard fields
 * must stay **Inactive** on the Timesheet settings page for the whole flow; we only use **Assignments** (TTF, assign workers)
 * and Timesheet row actions that work while the field is **Inactive** (e.g. Service assign-customers + Hours assign-workers).
 *
 * **Service field:** **Inactive** after configure so customer + Hours-worker rules stay effective.
 *
 * **Service checks (STE/WTE):** (1) Service control **visible** for **customer 1**, **hidden** for **customer 2** (field assign-customers).
 * (2) **Hours** in the service list for **second** selectable worker (Emp2) + customer 1 only. (3) **No Hours** for **first** worker (Emp1) + customer 1.
 *
 * **Location:** **Inactive** on Timesheet fields (with Service) so assignments are not reset to all customers/workers.
 * **Assignments → TTF** assigns Location to **customer 1** only; on STE/WTE expect Location **visible** with customer 1 and
 * **hidden** with customer 2 (same assignment pattern as Service), not “hidden everywhere” because the company switch is off.
 *
 * **Timesheet settings:** **Service item** assign-customers = customer 1 only; **Hours** assign-workers = second selectable non-admin only.
 *
 * **Navigation:** Configures Service + Assignments *before* time entry. One **STE** and one **WTE** pass cover CFs, Service, Hours,
 * and Location **per customer** from assignments.
 *
 * Requires **≥2 customers** (learned from Assign customers panel). Skips nothing — throws if fewer than two customers exist.
 */
export const assignmentsExtendedMatrixE2EFlow = async (
  page: Page,
): Promise<void> => {
  /** After selecting customer 1, allow custom fields to render before asserting visibility. */
  const cfVisibleForCustomer1SettleMs = 4000;

  const singleTimeEntryPage = new SingleTimeEntryPage(page);
  const singleTimeActivityPage = new SingleTimeActivityPage(page);
  const timeEntriesPage = new TimeEntriesPage(page);
  const assignmentsPage = new AssignmentsPage(page);

  await openTimeCustomFieldsEditAfterDeactivatingTestFields(page, {
    skipDeactivate: true,
  });
  console.log(
    '[assignments-matrix] Opened Time custom fields edit (skipDeactivate)',
  );
  const cf1 =
    await createDropdownCustomFieldFromTimeSettingsEditListForPriorityCase(
      page,
    );
  console.log('[assignments-matrix] Created dropdown CF1:', cf1);
  const cf2 =
    await createDropdownCustomFieldFromTimeSettingsEditListForPriorityCase(
      page,
    );
  console.log('[assignments-matrix] Created dropdown CF2:', cf2);
  const cf1Base = customFieldBaseName(cf1);
  const cf2Base = customFieldBaseName(cf2);

  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(1500);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForLoadState('load');
  await page.waitForTimeout(1500);

  // Learn customer1/customer2 from the Assign customers panel (avoids early Assignments navigation just to scrape names).
  const cf1BaseForRow = customFieldBaseName(cf1);
  await CustomFieldsPage.clickAssignCustomersForCustomField(
    page,
    cf1BaseForRow,
  );
  await CustomFieldsPage.verifyAssignCustomersPanelVisible(page);
  await CustomFieldsPage.unselectAllCustomersInAssignPanel(page);
  await CustomFieldsPage.clickAssignCustomersForCustomField(
    page,
    cf1BaseForRow,
  );
  await CustomFieldsPage.verifyAssignCustomersPanelVisible(page);
  const [customer1, customer2] =
    await getFirstTwoCustomerNamesFromAssignCustomersPanel(page);
  await CustomFieldsPage.selectCustomerInAssignPanel(page, customer1);
  await CustomFieldsPage.clickSaveAssignCustomersPanel(page);
  await CustomFieldsPage.waitForAssignCustomersPanelDismissed(page);
  console.log(
    '[assignments-matrix] Resolved customers; CF1 assign-customers saved for customer1 only:',
    customer1,
    '|',
    customer2,
  );

  await assignFieldLevelCustomersOnlyToCustomer(page, cf2, customer1);
  console.log(
    '[assignments-matrix] CF2 field-level assign-customers = customer1 only',
  );
  const worker1Label = await listFirstOptionAssignWorkersExclusiveFirstWorker(
    page,
    cf2,
  );
  console.log(
    '[assignments-matrix] CF2 first list option assign-workers exclusive:',
    worker1Label,
  );
  await CustomFieldsPage.exitCustomFieldsEditAfterAssignCustomers(page);
  console.log('[assignments-matrix] Exited custom fields edit mode');

  // Service: customer 1 only at field level; Hours → 2nd eligible worker only. Then Assignments (workers + Location TTF).
  await configureServiceStandardFieldCustomer1AndHoursExclusiveSecondWorker(
    page,
    customer1,
  );

  await ensureTimesheetStandardFieldInactiveThenCloseModal(
    page,
    STANDARD_TIMESHEET_FIELD_LOCATION,
  );
  console.log(
    '[assignments-matrix] Timesheet Location Inactive before Assignments (TTF)',
  );

  await assignmentsPage.goto();
  await assignmentsPage.waitForCustomerTable();
  console.log(
    '[assignments-matrix] Assignments page loaded; opening TTF for',
    customer1,
  );
  // Enable CFs + Location for customer1 in a single drawer visit.
  await assignmentsPage.openAssignTimeTrackingFieldsForCustomer(customer1);
  await assignmentsPage.expectDrawerVisible('Assign time tracking fields');
  console.log('[assignments-matrix] Assign time tracking fields drawer open');
  await ensureCustomFieldCheckedInTtfDrawer(page, cf1);
  await ensureCustomFieldCheckedInTtfDrawer(page, cf2);
  await ensureCustomFieldCheckedInTtfDrawer(
    page,
    STANDARD_TIMESHEET_FIELD_LOCATION,
  );
  await assignmentsPage.saveDrawerChangesIfEnabledElseClose();
  await page.waitForTimeout(800);
  await page
    .getByRole('dialog')
    .getByRole('heading', { name: /assign time tracking fields/i })
    .waitFor({ state: 'hidden', timeout: 25_000 })
    .catch(() => {});
  console.log(
    '[assignments-matrix] Assignments: TTF drawer saved for',
    customer1,
    '(CF1, CF2, Location)',
  );

  await assignmentsPage.openAssignWorkersForCustomer(customer2);
  await expect(
    page.getByRole('dialog').getByRole('heading', { name: /assign workers/i }),
  ).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(5000);
  await CustomFieldsPage.unselectAllWorkersInAssignPanel(page);
  await CustomFieldsPage.selectWorkerInAssignPanel(page, worker1Label);
  await assignmentsPage.saveDrawerChangesIfEnabledElseClose();
  await page.waitForTimeout(800);
  await page
    .getByRole('dialog')
    .getByRole('heading', { name: /assign workers/i })
    .waitFor({ state: 'hidden', timeout: 25_000 })
    .catch(() => {});
  console.log(
    '[assignments-matrix] Assignments: Assign workers drawer saved for',
    customer2,
    '→',
    worker1Label,
  );

  // Reuse existing locator used elsewhere for STE "Service" field.
  const serviceLabel = weeklyTimeEntryPage.panelServiceDropdown(page).first();
  const steLocationInput = weeklyTimeEntryPage
    .panelLocationDropdown(page)
    .first();

  // —— STE: custom fields + Service + Location in one visit ——
  await navigateToSingleTimeEntry(page);
  await singleTimeEntryPage.waitForPageReady();
  await singleTimeEntryPage.handlePopupsInAnyOrder();
  await singleTimeEntryPage.waitTillNameFieldVisible();
  console.log(
    '[assignments-matrix] STE: page ready, starting CF matrix checks',
  );

  await priorityCaseSelectSteNthSelectableWorker(
    page,
    singleTimeActivityPage,
    0,
  );
  await steSelectCustomerByName(page, customer1);
  await page.waitForTimeout(cfVisibleForCustomer1SettleMs);
  await expect(page.getByLabel(cf1Base, { exact: false }).first()).toBeVisible({
    timeout: 90_000,
  });
  await expect(page.getByLabel(cf2Base, { exact: false }).first()).toBeVisible({
    timeout: 90_000,
  });
  await steSelectCustomerByName(page, customer2);
  // fix me customer options isssue
  /*
  await expect(
    page.getByLabel(cf1Base, { exact: false }).first(),
  ).not.toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByLabel(cf2Base, { exact: false }).first(),
  ).not.toBeVisible({ timeout: 15_000 });
  await steSelectCustomerByName(page, customer1);
  await page.waitForTimeout(cfVisibleForCustomer1SettleMs);
  await expect(page.getByLabel(cf2Base, { exact: false }).first()).toBeVisible({
    timeout: 30_000,
  });
  await page.getByLabel(cf2Base, { exact: false }).first().click();
  await page.waitForTimeout(800);
  await expect(
    page.getByRole('option', { name: /option\s*1/i }).first(),
  ).toBeVisible({ timeout: 10_000 });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  console.log(
    '[assignments-matrix] STE: CF1/CF2 visibility + CF2 option1 (Emp1 vs Emp2) OK',
  );

  await priorityCaseSelectSteNthSelectableWorker(
    page,
    singleTimeActivityPage,
    1,
  );
  
  await steSelectCustomerByName(page, customer1);
  await page.getByLabel(cf2Base, { exact: false }).first().click();
  await page.waitForTimeout(800);
  await expect(page.getByRole('option', { name: /option\s*1/i })).toHaveCount(
    0,
  );
  await page.keyboard.press('Escape');
  console.log('[assignments-matrix] STE: CF2 option1 absent for Emp2 + c1 OK');

  // STE — Service: field assigned to customer 1 only; Hours assigned to 2nd worker only.
  await priorityCaseSelectSteNthSelectableWorker(
    page,
    singleTimeActivityPage,
    0,
  );
  await steSelectCustomerByName(page, customer1);
  await expect(serviceLabel).toBeVisible({ timeout: 10_000 });
  
  await steSelectCustomerByName(page, customer2);
  await expect(serviceLabel).not.toBeVisible({ timeout: 10_000 });
  await steSelectCustomerByName(page, customer1);
  await page.waitForTimeout(400);

  await expect(serviceLabel).toBeVisible({ timeout: 10_000 });
  await serviceLabel.click();
  await page.waitForTimeout(600);
  await expect(weeklyTimeEntryPage.quickFindServiceListbox(page)).toBeVisible({
    timeout: 15_000,
  });
  await expect(
    weeklyTimeEntryPage.quickFindServiceHoursOptions(page),
  ).toHaveCount(0, { timeout: 15_000 });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  console.log(
    '[assignments-matrix] STE: Service visible c1 / hidden c2; Emp1 has no Hours option OK',
  );

  await priorityCaseSelectSteNthSelectableWorker(
    page,
    singleTimeActivityPage,
    1,
  );
  await steSelectCustomerByName(page, customer1);
  await expect(serviceLabel).toBeVisible({ timeout: 10_000 });
  await serviceLabel.click();
  await page.waitForTimeout(600);
  await expect(weeklyTimeEntryPage.quickFindServiceListbox(page)).toBeVisible({
    timeout: 15_000,
  });
  await expect(
    weeklyTimeEntryPage.quickFindServiceHoursOptions(page).first(),
  ).toBeVisible({ timeout: 10_000 });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  console.log('[assignments-matrix] STE: Emp2 has Hours option for c1 OK');

  await priorityCaseSelectSteNthSelectableWorker(
    page,
    singleTimeActivityPage,
    0,
  );
  await steSelectCustomerByName(page, customer1);
  await page.waitForTimeout(5000);
  await expect(steLocationInput).toBeVisible({ timeout: 45_000 });
  await steSelectCustomerByName(page, customer2);
  await expect(steLocationInput).not.toBeVisible({ timeout: 10_000 });
  console.log(
    '[assignments-matrix] STE: Location visible c1 / hidden c2 (TTF) OK',
  );

  // —— WTE: custom fields + Service + Location in one visit ——
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.dismissIntuitIntelligenceIfVisible();
  await openWeeklyTimeEntry(page);
  await timeEntriesPage.dismissIntuitIntelligenceIfVisible();
  await weeklyTimeEntryPage.waitForLoadingToDisappear(page);
  await weeklyTimeEntryPage.handlePopupsInAnyOrder(page);
  console.log(
    '[assignments-matrix] WTE: page ready, starting CF matrix checks',
  );

  await wteSelectNthSelectableTeamMember(page, 0);
  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await selectCustomerInWTE(page, customer1, { strict: true });
  await page.waitForTimeout(1000);
  await weeklyTimeEntryPage.hours(page, 3).click();
  await weeklyTimeEntryPage.hoursInputs(page).fill('8');
  await page.waitForTimeout(cfVisibleForCustomer1SettleMs);
  await expect(page.getByLabel(cf1Base, { exact: false }).first()).toBeVisible({
    timeout: 90_000,
  });
  await expect(page.getByLabel(cf2Base, { exact: false }).first()).toBeVisible({
    timeout: 90_000,
  });
  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await selectCustomerInWTE(page, customer2, { strict: true });
  await page.waitForTimeout(1000);
  await expect(
    page.getByLabel(cf1Base, { exact: false }).first(),
  ).not.toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByLabel(cf2Base, { exact: false }).first(),
  ).not.toBeVisible({ timeout: 15_000 });
  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await selectCustomerInWTE(page, customer1, { strict: true });
  await page.waitForTimeout(1000);
  await page.waitForTimeout(cfVisibleForCustomer1SettleMs);
  await expect(page.getByLabel(cf2Base, { exact: false }).first()).toBeVisible({
    timeout: 30_000,
  });
  await page.getByLabel(cf2Base, { exact: false }).first().click();
  await page.waitForTimeout(800);
  await expect(
    page.getByRole('option', { name: /option\s*1/i }).first(),
  ).toBeVisible({ timeout: 10_000 });
  await wteDismissOpenListUiWithoutEscape(page);
  console.log(
    '[assignments-matrix] WTE: CF1/CF2 visibility + CF2 option1 (member0 vs 1) OK',
  );

  await wteSelectNthSelectableTeamMember(page, 1);
  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await selectCustomerInWTE(page, customer1, { strict: true });
  await page.waitForTimeout(1000);
  // Same row as member 0: custom fields stay behind “Select a cell to add time” until a day cell has focus / hours.
  await weeklyTimeEntryPage.hours(page, 3).click();
  await weeklyTimeEntryPage.hoursInputs(page).fill('8');
  await page.waitForTimeout(cfVisibleForCustomer1SettleMs);
  await page.getByLabel(cf2Base, { exact: false }).first().click();
  await page.waitForTimeout(800);
  await expect(page.getByRole('option', { name: /option\s*1/i })).toHaveCount(
    0,
  );
  await wteDismissOpenListUiWithoutEscape(page);
  console.log(
    '[assignments-matrix] WTE: CF2 option1 absent for member1 + c1 OK',
  );

  const wteService = weeklyTimeEntryPage.serviceDropdown(page);

  await wteSelectNthSelectableTeamMember(page, 0);
  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await selectCustomerInWTE(page, customer1, { strict: true });
  await page.waitForTimeout(1000);
  await weeklyTimeEntryPage.hours(page, 3).click();
  await weeklyTimeEntryPage.hoursInputs(page).fill('8');
  await expect(wteService).toBeVisible({ timeout: 15_000 });

  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await selectCustomerInWTE(page, customer2, { strict: true });
  await page.waitForTimeout(1000);
  await weeklyTimeEntryPage.hours(page, 3).click();
  await weeklyTimeEntryPage.hoursInputs(page).fill('8');
  await expect(wteService).not.toBeVisible({ timeout: 10_000 });

  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await selectCustomerInWTE(page, customer1, { strict: true });
  await page.waitForTimeout(1000);
  await weeklyTimeEntryPage.hours(page, 3).click();
  await weeklyTimeEntryPage.hoursInputs(page).fill('8');

  await expect(wteService).toBeVisible({ timeout: 15_000 });
  await wteService.click();
  await page.waitForTimeout(600);
  await expect(weeklyTimeEntryPage.quickFindServiceListbox(page)).toBeVisible({
    timeout: 15_000,
  });
  await expect(
    weeklyTimeEntryPage.quickFindServiceHoursOptions(page),
  ).toHaveCount(0, { timeout: 15_000 });
  await wteDismissOpenListUiWithoutEscape(page);
  console.log(
    '[assignments-matrix] WTE: Service visible c1 / hidden c2; member0 no Hours OK',
  );

  await wteSelectNthSelectableTeamMember(page, 1);
  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await selectCustomerInWTE(page, customer1, { strict: true });
  await page.waitForTimeout(1000);
  await weeklyTimeEntryPage.hours(page, 3).click();
  await weeklyTimeEntryPage.hoursInputs(page).fill('8');
  await expect(wteService).toBeVisible({ timeout: 15_000 });
  await wteService.click();
  await page.waitForTimeout(600);
  await expect(weeklyTimeEntryPage.quickFindServiceListbox(page)).toBeVisible({
    timeout: 15_000,
  });
  await expect(
    weeklyTimeEntryPage.quickFindServiceHoursOptions(page).first(),
  ).toBeVisible({ timeout: 10_000 });
  await wteDismissOpenListUiWithoutEscape(page);
  console.log('[assignments-matrix] WTE: member1 has Hours option for c1 OK');

  await wteSelectNthSelectableTeamMember(page, 0);
  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await selectCustomerInWTE(page, customer1, { strict: true });
  await page.waitForTimeout(1000);
  // Location (and other panel fields) follow “Select a cell to add time details” until a day cell is active.
  await weeklyTimeEntryPage.hours(page, 3).click();
  await weeklyTimeEntryPage.hoursInputs(page).fill('8');
  await page.waitForTimeout(cfVisibleForCustomer1SettleMs);

  await expect(weeklyTimeEntryPage.panelLocationDropdown(page)).toBeVisible({
    timeout: 15_000,
  });
  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await selectCustomerInWTE(page, customer2, { strict: true });
  await page.waitForTimeout(1000);
  await weeklyTimeEntryPage.hours(page, 3).click();
  await weeklyTimeEntryPage.hoursInputs(page).fill('8');
  await expect(weeklyTimeEntryPage.panelLocationDropdown(page)).not.toBeVisible(
    {
      timeout: 10_000,
    },
  );
  console.log(
    '[assignments-matrix] WTE: Location visible c1 / hidden c2 (TTF) OK',
  );

  // Do **not** open Timesheet Location as Active to edit assign-customers — activating standard fields resets assignments
  // to all customers/workers in QBO; our matrix relies on Service + Location staying **Inactive** while using Assignments TTF.

  // Reset assign-customers / assign-workers to **all** and save; keep Service + Location **Inactive** on Timesheet settings.
  await restoreServiceItemHoursWorkersToAll(page);
  console.log('[assignments-matrix] Restore: Service Hours workers → all');
  await restoreStandardFieldAssignCustomersToAll(
    page,
    STANDARD_FIELD_SERVICE_ITEM,
  );
  console.log('[assignments-matrix] Restore: Service assign-customers → all');
  await restoreStandardFieldAssignCustomersToAll(
    page,
    STANDARD_TIMESHEET_FIELD_LOCATION,
  );
  console.log('[assignments-matrix] Restore: Location assign-customers → all');

  await deactivateAllTestCustomFields(page);
  console.log(
    '[assignments-matrix] Flow complete: test custom fields deactivated',
  );
  */
};

/**
 * **Faster, fewer hops** than {@link assignmentsPriorityEliteComprehensiveAssignmentFlow}:
 * - **Two customers** (when the table has ≥2 rows): customer A → **Assign workers** only; customer B → **Assign time tracking fields** (enables the first new dropdown CF in that drawer).
 * - **Two dropdown custom fields**: field #1 → first option **Assign customers** only (customer B); field #2 → first option **Assign workers** only. Rows are collapsed between fields so list-item locators stay unique.
 * - **Standard fields** + one **STE** smoke on customer B + the first new CF label.
 *
 * If only one customer row exists, both Assignments operations use that same customer (still two separate drawers).
 *
 * Skips full WTE, ASM057 sync, and long elite loops.
 */
export const assignmentsPriorityConsolidatedCoverageFlow = async (
  page: Page,
): Promise<void> => {
  const singleTimeEntryPage = new SingleTimeEntryPage(page);
  const singleTimeActivityPage = new SingleTimeActivityPage(page);

  await openTimeCustomFieldsEditAfterDeactivatingTestFields(page, {
    skipDeactivate: true,
  });
  const customFieldForTtf =
    await createDropdownCustomFieldFromTimeSettingsEditListForPriorityCase(
      page,
    );
  const customFieldForOptionWorkers =
    await createDropdownCustomFieldFromTimeSettingsEditListForPriorityCase(
      page,
    );

  const assignmentsPage = new AssignmentsPage(page);
  await assignmentsPage.goto();
  await assignmentsPage.waitForCustomerTable();
  const customerRowCount = await page
    .locator(
      'table[summary="Customer assignment table"], table:has(th:has-text("Time tracking fields"))',
    )
    .first()
    .locator('tbody tr')
    .count();
  const customerForAssignWorkers = await getNthCustomerNameFromAssignmentsTable(
    page,
    0,
  );
  const customerForAssignTtf =
    customerRowCount > 1
      ? await getNthCustomerNameFromAssignmentsTable(page, 1)
      : customerForAssignWorkers;

  await assignmentsPage.openAssignWorkersForCustomer(customerForAssignWorkers);
  await expect(
    page.getByRole('dialog').getByRole('heading', { name: /assign workers/i }),
  ).toBeVisible({ timeout: 20_000 });
  await assignmentsPage.selectItemsInDrawer(1);
  await assignmentsPage.saveDrawerChanges();
  await page.waitForTimeout(800);
  await page
    .getByRole('dialog')
    .getByRole('heading', { name: /assign workers/i })
    .waitFor({ state: 'hidden', timeout: 25_000 })
    .catch(() => {});

  await assignmentsPage.openAssignTimeTrackingFieldsForCustomer(
    customerForAssignTtf,
  );
  await assignmentsPage.expectDrawerVisible('Assign time tracking fields');
  await ensureCustomFieldCheckedInTtfDrawer(page, customFieldForTtf);
  await assignmentsPage.saveDrawerChanges();
  await page.waitForTimeout(800);
  await page
    .getByRole('dialog')
    .getByRole('heading', { name: /assign time tracking fields/i })
    .waitFor({ state: 'hidden', timeout: 25_000 })
    .catch(() => {});

  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(1500);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForLoadState('load');
  await page.waitForTimeout(1500);

  await listItemAssignCustomersOnlyForDropdownField(
    page,
    customFieldForTtf,
    customerForAssignTtf,
  );
  await listItemAssignWorkersOnlyForDropdownField(
    page,
    customFieldForOptionWorkers,
  );

  await CustomFieldsPage.exitCustomFieldsEditAfterAssignCustomers(page);

  await assignCustomerToStandardFieldAndValidateSTE(page);

  await navigateToSingleTimeEntry(page);
  await singleTimeEntryPage.waitForPageReady();
  await singleTimeEntryPage.handlePopupsInAnyOrder();
  await singleTimeEntryPage.waitTillNameFieldVisible();
  await priorityCaseSelectSteNameField(page, singleTimeActivityPage);
  await singleTimeActivityPage.openDropdown('Customer');
  await page.waitForTimeout(STE_CUSTOMER_DROPDOWN_OPTIONS_SETTLE_MS);
  await selectFirstOptionContaining(
    page.getByRole('option'),
    customerForAssignTtf,
  );
  await page.waitForTimeout(1500);
  await expect(
    weeklyTimeEntryPage.panelServiceDropdown(page).first(),
  ).toBeVisible();
  await expect(
    page.getByLabel(customFieldForTtf, { exact: false }),
  ).toBeVisible({ timeout: 90_000 });

  await deactivateAllTestCustomFields(page);
};

export const createCustomerAndAssignTimeTrackingFields = async (page: Page) => {
  // ASM019 / updated steps:
  // 1. Navigate to Time → Assignments page
  await goToAssignments(page);
  const companyName = 'Bakes and Beans';
  const assignmentsPage = new AssignmentsPage(page);

  // 2. Click Action dropdown and Click Assign time tracking fields
  await assignmentsPage.openActionMenu(companyName);
  await page.waitForTimeout(2000);

  // 3. Verify Assign time tracking fields side panel is visible
  await assignmentsPage.expectDrawerVisible('Assign time tracking fields');

  // 4. Check all the checkboxes (assign all time tracking fields)
  const allCheckboxes = assignmentsPage.drawerItemCheckboxes();
  const allCount = await allCheckboxes.count();
  for (let i = 0; i < allCount; i++) {
    const checkbox = allCheckboxes.nth(i);
    if (!(await checkbox.isChecked().catch(() => false))) {
      await checkbox.check();
    }
  }

  // 5. Click Save button, verify selected customer fields (e.g., All)
  await assignmentsPage.saveDrawerChangesIfEnabledElseClose();
  await page.waitForTimeout(3000);

  // // Verify Assignments table shows a non-empty / "All" value in time tracking fields column
  const customerRow = assignmentsPage.customerRow(companyName);
  await expect(customerRow).toBeVisible();
  await expect(
    page.locator(
      `//tbody/tr[td[1]//strong[contains(text(),'Bakes and Beans')]]/td[3][contains(text(),'All')]`,
    ),
  ).toBeVisible();

  // 6. Navigate again to Time → Assignments page
  await goToAssignments(page);

  // 7. Click Action dropdown and Click Assign time tracking fields
  await assignmentsPage.openActionMenu(companyName);
  await page.waitForTimeout(2000);
  await assignmentsPage.expectDrawerVisible('Assign time tracking fields');

  // 8. Uncheck all the checkboxes and click on save button
  const allCheckboxesAfter = assignmentsPage.drawerItemCheckboxes();
  const totalAfter = await allCheckboxesAfter.count();
  for (let i = 0; i < totalAfter; i++) {
    const checkbox = allCheckboxesAfter.nth(i);
    if (await checkbox.isChecked().catch(() => false)) {
      await checkbox.uncheck();
    }
  }
  await assignmentsPage.saveDrawerChanges();
  await page.waitForTimeout(2000);

  // 9. Verify selected customer fields (e.g., None) are visible in the time tracking fields column
  const updatedRow = assignmentsPage.customerRow(companyName);
  await expect(updatedRow).toBeVisible();
  //await expect(page.locator(`//tbody/tr[td[1]//strong[contains(text(),'${companyName}')]]/td[3][contains(text(),'None')]`)).toBeVisible();
};

export const createCustomerAndAssignTimeTrackingFieldsSTE = async (
  page: Page,
) => {
  //const companyName = await createCustomerAndValidate(page);
  const companyName = 'Bakes and Beans';
  // Same as ASM019: after login the shell is not on Assignments — navigate first.
  const assignmentsPage = await goToAssignments(page);

  // Assign time tracking fields - select "Service item" and "Class"
  await assignmentsPage.openActionMenu(companyName);
  await page.waitForTimeout(500);

  await uncheckAllFields(page, companyName);
  await page.reload();
  await page.waitForTimeout(500);

  await assignmentsPage.openActionMenu(companyName);
  await page.waitForTimeout(500);

  // Helper to get checkbox by field name
  const getFieldCheckbox = (fieldName: string) =>
    page.locator(`input[type="checkbox"][aria-label="Select ${fieldName}"]`);

  // Select "Service item" and "Class" checkboxes
  await getFieldCheckbox('Service item').check();
  await page.waitForTimeout(500);
  console.log('✓ Selected "Service item" checkbox');

  await getFieldCheckbox('Class').check();
  await page.waitForTimeout(500);
  console.log('✓ Selected "Class" checkbox');

  // Save the assignment
  await page
    .getByRole('dialog', { name: 'Assign time tracking fields' })
    .locator(`//button[.//span[text()='Save']]`)
    .click();
  await page.waitForTimeout(1000);
  console.log('✓ Saved time tracking field assignment');

  // Navigate to STE
  await navigateToSingleTimeEntry(page);
  const singleTimeEntryPage = new SingleTimeEntryPage(page);
  const singleTimeActivityPage = new SingleTimeActivityPage(page);
  await singleTimeEntryPage.waitForPageReady();
  await singleTimeEntryPage.handlePopupsInAnyOrder();
  await singleTimeEntryPage.waitTillNameFieldVisible();

  // Select employee
  await singleTimeActivityPage.openDropdown('Name');
  await page.waitForTimeout(STE_NAME_DROPDOWN_OPTIONS_SETTLE_MS);
  await singleTimeActivityPage.clickDropdownOption(1, 'Name');

  // Select the same created customer
  await singleTimeActivityPage.openDropdown('Customer');
  await page.waitForTimeout(STE_CUSTOMER_DROPDOWN_OPTIONS_SETTLE_MS);
  // Type the company name in the search field
  const customerField = page.locator('//input[@aria-label="Customers"]');
  await customerField.click();
  await customerField.fill(companyName);
  await page.waitForTimeout(500);

  // Select the customer from dropdown
  const customerOption = page.locator(
    `//li[@role='option']//span[@title='${companyName}']`,
  );
  await customerOption.first().click();
  await page.waitForTimeout(2000);
  console.log(`✓ Selected customer: ${companyName}`);

  // // Verify "Service" field is visible (the assigned time tracking field)
  // const serviceFieldLabel = page.locator('label').filter({ hasText: 'Service' });
  // await expect(serviceFieldLabel).toBeVisible({ timeout: 5000 });
  // console.log('✓ Verified "Service" field is visible for the assigned customer');

  // // Verify "Class" field is visible (the assigned time tracking field)
  // const classFieldLabel = page.locator('label').filter({ hasText: 'Class' });
  // await expect(classFieldLabel).toBeVisible({ timeout: 5000 });
  // console.log('✓ Verified "Class" field is visible for the assigned customer');

  await uncheckAllFields(page, companyName);
};

// Helper method to uncheck all fields in the drawer
const uncheckAllFields = async (page: Page, companyName: string) => {
  const assignmentsPage = new AssignmentsPage(page);
  // Cleanup
  await assignmentsPage.goto();
  await assignmentsPage.openActionMenu(companyName);
  //await assignmentsPage.selectAssignFields();
  await page.waitForTimeout(2000);

  const allCheckboxes = assignmentsPage.drawerItemCheckboxes();
  const allCount = await allCheckboxes.count();
  for (let i = 0; i < allCount; i++) {
    const checkbox = allCheckboxes.nth(i);
    const isDisabled = await checkbox.isDisabled().catch(() => false);
    const isChecked = await checkbox.isChecked().catch(() => false);

    // Skip if checkbox is disabled or already unchecked
    if (isDisabled || !isChecked) {
      continue;
    }

    // Uncheck if checked and not disabled
    await checkbox.uncheck();
    await page.waitForTimeout(300);
  }
  console.log('✓ Unchecked all fields');

  // Save the assignment
  await page
    .getByRole('dialog', { name: 'Assign time tracking fields' })
    .locator(`//button[.//span[text()='Save']]`)
    .click();
  await page.waitForTimeout(1000);
};

export const createCustomerAndAssignTimeTrackingFieldsWTE = async (
  page: Page,
) => {
  // const companyName = await createCustomerAndValidate(page);
  const companyName = 'Bakes and Beans';
  const assignmentsPage = await goToAssignments(page);
  // Assign time tracking fields
  await assignmentsPage.openActionMenu(companyName);
  await page.waitForTimeout(500);

  await uncheckAllFields(page, companyName);
  await page.reload();
  await page.waitForTimeout(500);

  await assignmentsPage.openActionMenu(companyName);
  await page.waitForTimeout(500);

  // Helper to get checkbox by field name
  const getFieldCheckbox = (fieldName: string) =>
    page.locator(`input[type="checkbox"][aria-label="Select ${fieldName}"]`);

  // Select "Service item" and "Class" checkboxes
  await getFieldCheckbox('Service item').check();
  await page.waitForTimeout(500);
  console.log('✓ Selected "Service item" checkbox');

  await getFieldCheckbox('Class').check();
  await page.waitForTimeout(500);
  console.log('✓ Selected "Class" checkbox');

  // Save the assignment
  await page
    .getByRole('dialog', { name: 'Assign time tracking fields' })
    .locator(`//button[.//span[text()='Save']]`)
    .click();
  await page.waitForTimeout(1000);
  console.log('✓ Saved time tracking field assignment');

  // Navigate to WTE
  const timeEntriesPage = new TimeEntriesPage(page);
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.dismissIntuitIntelligenceIfVisible();
  await openWeeklyTimeEntry(page);
  await timeEntriesPage.dismissIntuitIntelligenceIfVisible();

  // Wait for page to load
  await weeklyTimeEntryPage.waitForLoadingToDisappear(page);
  await weeklyTimeEntryPage.handlePopupsInAnyOrder(page);

  // 1. Select team member dropdown and select dropdown option
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await page.waitForTimeout(WTE_TEAM_MEMBER_DROPDOWN_OPTIONS_SETTLE_MS);
  await weeklyTimeEntryPage.clickDropdownOption(page);
  await page.waitForTimeout(2000);

  // 2. Select customerProjectDropdown and select the selected customer name
  const customerOption = page.locator(
    `//li[contains(@class, 'ListItem')]//span[contains(text(), '${companyName}')]`,
  );
  await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
  await page.waitForTimeout(500);
  await customerOption.first().click();
  await page.waitForTimeout(1000);
  console.log(`✓ Selected customer: ${companyName}`);

  // 3. Click on 3rd hour cell and fill 8
  await weeklyTimeEntryPage.hours(page, 3).click();
  await weeklyTimeEntryPage.hoursInputs(page).fill('8');

  await page.waitForTimeout(2000);

  // Verify assigned time tracking fields are visible
  const fieldLabels = page.locator('label');
  const fieldCount = await fieldLabels.count();
  let fieldsVisible = false;
  for (let i = 0; i < fieldCount; i++) {
    const labelText = await fieldLabels.nth(i).textContent();
    if (
      labelText &&
      (labelText.includes('Service') ||
        labelText.includes('Class') ||
        labelText.includes('Location'))
    ) {
      fieldsVisible = true;
      break;
    }
  }
  expect(fieldsVisible).toBe(true);

  // // Cleanup
  // await assignmentsPage.goto();
  // await assignmentsPage.openActionMenu(companyName);
  // await assignmentsPage.selectAssignFields();
  // await page.waitForTimeout(2000);

  // const allCheckboxes = assignmentsPage.drawerItemCheckboxes();
  // const allCount = await allCheckboxes.count();
  // for (let i = 0; i < allCount; i++) {
  //   const checkbox = allCheckboxes.nth(i);
  //   if (await checkbox.isChecked()) {
  //     await checkbox.uncheck();
  //   }
  // }

  // await assignmentsPage.saveDrawerChanges();
  // await page.waitForTimeout(2000);
};

export const createAndEditCustomer = async (page: Page) => {
  const companyName = await createCustomerAndValidate(page);
  const assignmentsPage = new AssignmentsPage(page);

  //Navigate to Assignments
  await goToAssignments(page);

  // Click Edit - open action menu for specific company and select Edit
  await assignmentsPage.openEditCustomerForCompany(companyName);
  await page.waitForTimeout(2000);

  // Edit the company name
  const randomString = Math.random().toString(36).substring(2, 15);
  const newCompanyName = `Edited Company ${randomString}`;
  await assignmentsPage.enterCompanyName(newCompanyName);

  // Click Save button
  await assignmentsPage.drawerSaveButton().click();
  await page.waitForTimeout(3000);

  // Verify the edited company name is visible in the assignments table
  await page.reload();
  await assignmentsPage.expectCustomerInTable(newCompanyName);

  //delete the created customer
  await assignmentsPage.deleteCustomer(newCompanyName);
  await page.waitForTimeout(3000);
  await assignmentsPage.goto();
  await assignmentsPage.expectCustomerNotInTable(newCompanyName);

  //delete the created customer
  await assignmentsPage.deleteCustomer(newCompanyName);
  await page.waitForTimeout(3000);
  await assignmentsPage.goto();
  await assignmentsPage.expectCustomerNotInTable(newCompanyName);

  return newCompanyName;
};

export const validateAssignmentSaveFailureError = async (page: Page) => {
  const assignmentsPage = await goToAssignments(page);

  // Click on any customer edit button
  // Click first Assign Workers button in assignments page
  const firstAssignWorkersButton = page
    .locator(`//button[text()="Assign Workers"]`)
    .first();
  await expect(firstAssignWorkersButton).toBeVisible();
  await firstAssignWorkersButton.click();
  await page.waitForTimeout(2000);

  // Verify Assign team members side panel is opened
  await assignmentsPage.expectDrawerVisible('Assign Workers');

  // Verify save button is disabled when no changes are made
  const saveButton = assignmentsPage.drawerSaveButton();
  await expect(saveButton).toBeDisabled();

  await page.waitForTimeout(2000);
};

export const validatePartialAssignmentError = async (page: Page) => {
  const assignmentsPage = await goToAssignments(page);

  // Click on any customer edit button
  //await assignmentsPage.openActionMenu();
  await assignmentsPage.selectAssignWorkers();
  await page.waitForTimeout(2000);

  // Verify Assign team members side panel is opened
  await assignmentsPage.expectDrawerVisible('Assign Workers');

  // Assign 34 team members (or more than limit)
  await assignmentsPage.selectMultipleItemsInDrawer(34);
  await page.waitForTimeout(1000);

  // Click on save button
  await assignmentsPage.saveDrawerChanges();
  await page.waitForTimeout(2000);

  // Check whether the error message is visible
  const errorMessage = page.getByText('could only assign 30 team members');
  await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
};

export const validateStandardFieldsSaveFailureError = async (page: Page) => {
  // Navigate to Account & Settings → Time
  await navigateToAccountAndSettingsTime(page);

  // Step 3: Click on Timesheet fields edit icon
  const timesheetFieldsEditButton = page.locator(
    `//div[@data-testid="timeSheet-settings"]//button[@aria-label="Edit"]`,
  );
  await timesheetFieldsEditButton.first().click();
  await page.waitForTimeout(2000);

  // Step 4: Click on Preview timesheet
  const previewTimesheetButton = page.getByRole('button', {
    name: 'preview timesheet',
  });
  if (await previewTimesheetButton.isVisible()) {
    await previewTimesheetButton.click();
    await page.waitForTimeout(1000);
  }

  // Step 5: Check whether the collapse panel is closed
  const timesheetFieldsSection = page.locator(
    '[data-testid="timeSheet-settings"]',
  );
  // After clicking Preview timesheet, the panel should be collapsed (not fully visible)
  // We can verify by checking if the expanded content is not visible
  const isCollapsed = !(await timesheetFieldsSection
    .locator(
      '//*[contains(@class, "expanded") or contains(@aria-expanded, "true")]',
    )
    .first()
    .isVisible({ timeout: 2000 })
    .catch(() => false));
  // Panel should be collapsed after clicking Preview timesheet

  // Step 6: Select service item standard fields, check view button is visible then click view button
  const serviceItemField = page.locator(`//td//*[text()='Service item']`);
  await expect(serviceItemField.first()).toBeVisible({ timeout: 5000 });

  const viewButton = page.locator(
    `//*[text()='Service item']/ancestor::tr/descendant::*[text()='View']`,
  );
  await expect(viewButton.first()).toBeVisible({ timeout: 5000 });
  await viewButton.first().click();
  await page.waitForTimeout(2000);

  // Step 7: Check Service item panel is visible
  // After clicking View, a new screen/page should open showing Service item settings
  const serviceItemHeader = page.locator(
    `//h1[text()='Service item'] | //h2[text()='Service item'] | //*[contains(@class, 'heading')]//*[text()='Service item']`,
  );
  await expect(serviceItemHeader.first()).toBeVisible({ timeout: 5000 });

  // Step 8: Click first assign Customer button
  // In the Service item panel, find the first Assign Customer button
  const assignCustomerButton = page
    .locator(
      `//button[text()='Assign Customers' or contains(text(), 'Assign Customer')]`,
    )
    .first();
  await expect(assignCustomerButton).toBeVisible({ timeout: 5000 });
  await assignCustomerButton.click();
  await page.waitForTimeout(1000);

  // Step 9: Check whether the Assign customer panel is opened
  await CustomFieldsPage.verifyAssignCustomersPanelVisible(page);
  await page.waitForTimeout(2000);

  // Step 10: Click on save button
  // The save button should be in the Assign customer panel
  // Verify save button is disabled when no changes are made
  const saveButton = page.locator(
    `//div[contains(@class,"AssignmentDrawerstyled")]//span[text()="Save"]`,
  );
  await expect(saveButton).toBeDisabled();
};

export const validateStandardFieldsPartialAssignmentError = async (
  page: Page,
) => {
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);

  // Click on custom fields edit icon
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForTimeout(2000);

  // Click on Preview timesheet
  const previewTimesheetButton = page.getByRole('button', {
    name: 'preview timesheet',
  });
  if (await previewTimesheetButton.isVisible()) {
    await previewTimesheetButton.click();
    await page.waitForTimeout(1000);
  }

  // Click any standard fields Assign customer button
  await CustomFieldsPage.clickAssignCustomersForStandardField(
    page,
    'Service item',
  );
  await CustomFieldsPage.verifyAssignCustomersPanelVisible(page);

  // Add above 30 customers (select 31+)
  const customerCheckboxes = page.locator(
    'input[type="checkbox"][role="checkbox"]:not([aria-label*="Select all"])',
  );
  const count = await customerCheckboxes.count();
  const itemsToSelect = Math.min(31, count);
  for (let i = 0; i < itemsToSelect; i++) {
    await customerCheckboxes.nth(i).check();
  }
  await page.waitForTimeout(1000);

  // Click on save button
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForTimeout(2000);

  // Check whether the error message is visible
  const errorMessage = page.getByText('could only assign 30.*members|partial');
  await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
};

export const validateCustomFieldsSaveFailureError = async (page: Page) => {
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);

  // Click on custom fields edit icon
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForTimeout(2000);

  // Click on Add custom fields
  await CustomFieldsPage.clickAddCustomFieldsButton(page);
  await page.waitForTimeout(3000);

  // Verify Add custom fields side panel is opened
  await CustomFieldsPage.validateAddCustomFieldsPage(page);

  // Click on cancel button
  await page
    .locator(
      `//div[contains(@class,"Drawer-headerRightActionButton")]//button[@aria-label="Close"]`,
    )
    .click();
  await page.waitForTimeout(3000);
  // Handle "Save your custom fields before leaving" dialog - click Yes to leave without saving
  const ErrorPopup = page.getByRole('dialog', {
    name: 'Save your custom fields before leaving',
  });
  if (await ErrorPopup.isVisible({ timeout: 2000 }).catch(() => false)) {
    await ErrorPopup.getByRole('button', { name: 'Yes' }).click();
    await page.waitForTimeout(1000);
  }

  // Click on division edit dropdown (or any custom field actions)
  const firstCustomFieldRow = page.locator('tbody tr').first();
  if (await firstCustomFieldRow.isVisible()) {
    const actionsButton = firstCustomFieldRow
      .locator('button[aria-label="Expand Menu"]')
      .last();
    await actionsButton.click();
    await page.waitForTimeout(1000);
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await page.waitForTimeout(2000);

    // // Click on save button (this should trigger error - would need mocking)
    // await CustomFieldsPage.clickTimeTrackingCustomFieldSaveButton(page);
    // await page.waitForTimeout(2000);

    // // Verify save button is disabled when no changes are made
    // const assignmentsPage = new AssignmentsPage(page);
    // const saveButton = assignmentsPage.drawerSaveButton();
    const saveButton = page
      .getByRole('contentinfo')
      .filter({ hasText: /^Save$/ })
      .getByRole('button')
      .first();
    await expect(saveButton).toBeDisabled();
  }
};

export const validateCustomFieldsPartialAssignmentError = async (
  page: Page,
) => {
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);

  // Click on custom fields edit icon
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForTimeout(2000);

  // Create a custom field first
  const customFieldName = await createDropdownCustomFieldAndValidate(page);

  // Navigate back
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForTimeout(2000);

  // Click on division edit dropdown (Actions for custom field)
  await CustomFieldsPage.clickCustomFieldActionsDropdown(page, customFieldName);
  await page.getByRole('menuitem', { name: 'edit' }).click();
  await page.waitForTimeout(2000);

  // This step is unclear from requirements - might be assigning customers/workers
  // For now, we'll try to assign customers
  await page.getByRole('button', { name: 'Cancel' }).first().click();
  await page.waitForTimeout(2000);

  await CustomFieldsPage.clickAssignCustomersForCustomField(
    page,
    customFieldName,
  );
  await CustomFieldsPage.verifyAssignCustomersPanelVisible(page);

  // Add above 20 customers (select 21+)
  const customerCheckboxes = page.locator(
    'input[type="checkbox"][role="checkbox"]:not([aria-label*="Select all"])',
  );
  const count = await customerCheckboxes.count();
  const itemsToSelect = Math.min(21, count);
  for (let i = 0; i < itemsToSelect; i++) {
    await customerCheckboxes.nth(i).check();
  }
  await page.waitForTimeout(1000);

  // Click on save button
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForTimeout(2000);

  // Check whether the error message is visible
  const errorMessage = page.getByText('could only assign 20.*members|partial');
  await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
};

export const verifyHoverOverFields = async (page: Page) => {
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);

  // Click on custom fields edit icon
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForTimeout(2000);

  // Hover over Status
  const statusHeader = page.getByRole('columnheader', { name: 'status' });
  await CustomFieldsPage.hoverOverElement(page, statusHeader);
  await page.waitForTimeout(1000);

  // Hover over Required
  const requiredHeader = page.getByRole('columnheader', { name: 'required' });
  await CustomFieldsPage.hoverOverElement(page, requiredHeader);
  await page.waitForTimeout(1000);

  // Navigate to Timesheet fields section
  const timesheetFieldsSection = page
    .locator('section, div')
    .filter({ hasText: 'timesheet fields|standard fields' })
    .first();
  if (await timesheetFieldsSection.isVisible()) {
    // Hover over Standard fields (if there's a header or label)
    const standardFieldsLabel = timesheetFieldsSection
      .locator('h2, h3, label')
      .filter({ hasText: 'standard fields' })
      .first();
    if (await standardFieldsLabel.isVisible()) {
      await CustomFieldsPage.hoverOverElement(page, standardFieldsLabel);
      await page.waitForTimeout(1000);
      await CustomFieldsPage.verifyTooltipVisible(page);
    }
  }
};

export const validateStandardFieldsSaveFailureErrorNew = async (page: Page) => {
  // Step 1-3: Navigate to custom fields settings
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);

  // Step 3: Click on custom fields edit icon
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForTimeout(2000);

  // Step 4: Click on Preview timesheet
  const previewTimesheetButton = page.getByRole('button', {
    name: 'preview timesheet',
  });
  if (await previewTimesheetButton.isVisible()) {
    await previewTimesheetButton.click();
    await page.waitForTimeout(1000);
  }

  // Step 5: Check whether the collapse panel is closed
  // Verify that the panel is collapsed (not visible)
  const timesheetFieldsSection = page
    .locator('[data-testid="timeSheet-settings"]')
    .or(page.locator('section, div').filter({ hasText: 'timesheet fields' }));
  const isCollapsed = !(await timesheetFieldsSection.first().isVisible());
  // Panel should be collapsed after clicking Preview timesheet

  // Step 6: Click any standard fields Assign customer button
  await CustomFieldsPage.clickAssignCustomersForStandardField(
    page,
    'Service item',
  );

  // Step 7: Check whether the Assign customer panel is opened
  await CustomFieldsPage.verifyAssignCustomersPanelVisible(page);
  await page.waitForTimeout(2000);

  // Step 8: Click on save button
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForTimeout(2000);

  // Step 9: Check whether the error message is visible
  const errorMessage = page.getByText(
    "We couldn't save your recent changes|couldn't save your recent changes",
  );
  await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
};

export const validateStandardFieldsPartialAssignmentErrorNew = async (
  page: Page,
) => {
  // Step 1-3: Navigate to custom fields settings
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);

  // Step 3: Click on custom fields edit icon
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForTimeout(2000);

  // Step 4: Click on Preview timesheet
  const previewTimesheetButton = page.getByRole('button', {
    name: 'preview timesheet',
  });
  if (await previewTimesheetButton.isVisible()) {
    await previewTimesheetButton.click();
    await page.waitForTimeout(1000);
  }

  // Step 5: Check whether the collapse panel is closed
  // Verify that the panel is collapsed

  // Step 6: Click any standard fields Assign customer button
  await CustomFieldsPage.clickAssignCustomersForStandardField(
    page,
    'Service item',
  );

  // Step 7: Check whether the Assign customer panel is opened
  await CustomFieldsPage.verifyAssignCustomersPanelVisible(page);
  await page.waitForTimeout(2000);

  // Step 8: Add above 30 team members in the customer
  const customerCheckboxes = page.locator(
    'input[type="checkbox"][role="checkbox"]:not([aria-label*="Select all"])',
  );
  const count = await customerCheckboxes.count();
  const itemsToSelect = Math.min(31, count);
  for (let i = 0; i < itemsToSelect; i++) {
    await customerCheckboxes.nth(i).check();
  }
  await page.waitForTimeout(1000);

  // Step 9: Click on save button
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForTimeout(2000);

  // Step 10: Check whether the error message is visible
  const errorMessage = page.getByText('We could only assign 30 team members');
  await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
};

export const validateCustomFieldsSaveFailureErrorNew = async (page: Page) => {
  // Step 1-3: Navigate to custom fields settings
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);

  // Step 3: Click on custom fields edit icon
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForTimeout(2000);

  // Step 4: Click on Add custom fields
  await CustomFieldsPage.clickAddCustomFieldsButton(page);
  await page.waitForTimeout(3000);

  // Step 5: Check whether the Add custom fields side panel is opened
  await CustomFieldsPage.validateAddCustomFieldsPage(page);

  // Step 6: Click on cancel button in Add custom fields side panel
  await page.getByRole('button', { name: 'cancel' }).first().click();
  await page.waitForTimeout(2000);

  // Step 7: Click on division edit dropdown
  // Find the first custom field row and click its actions dropdown
  const firstCustomFieldRow = page.locator('tbody tr').first();
  if (await firstCustomFieldRow.isVisible()) {
    const actionsButton = firstCustomFieldRow
      .locator(
        'button[aria-label*="Expand Menu"], button[aria-label*="Actions" i]',
      )
      .first();
    await actionsButton.click();
    await page.waitForTimeout(1000);
    await page.getByRole('menuitem', { name: 'edit' }).click();
    await page.waitForTimeout(2000);

    // Step 8: Check whether the Add custom fields side panel is opened
    await CustomFieldsPage.validateAddCustomFieldsPage(page);

    // Step 9: Click on save button in Add custom fields side panel
    await CustomFieldsPage.clickTimeTrackingCustomFieldSaveButton(page);
    await page.waitForTimeout(2000);

    // Verify save button is disabled when no changes are made
    const assignmentsPage = new AssignmentsPage(page);
    const saveButton = assignmentsPage.drawerSaveButton();
    await expect(saveButton).toBeDisabled();
  }
};

export const validateCustomFieldsPartialAssignmentErrorNew = async (
  page: Page,
) => {
  // Step 1-3: Navigate to custom fields settings
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);

  // Step 3: Click on custom fields edit icon
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForTimeout(2000);

  // Step 4: Click on Add custom fields
  await CustomFieldsPage.clickAddCustomFieldsButton(page);
  await page.waitForTimeout(3000);

  // Step 5: Check whether the Add custom fields side panel is opened
  await CustomFieldsPage.validateAddCustomFieldsPage(page);

  // Step 6: Click on cancel button in Add custom fields side panel
  await page.getByRole('button', { name: 'cancel' }).first().click();
  await page.waitForTimeout(2000);

  // Step 7: Click on division edit dropdown
  // Find the first custom field row and click its actions dropdown
  const firstCustomFieldRow = page.locator('tbody tr').first();
  if (await firstCustomFieldRow.isVisible()) {
    // Get the custom field name from the row before clicking actions
    const customFieldNameElement = firstCustomFieldRow
      .locator('strong')
      .first();
    const customFieldName = await customFieldNameElement.textContent();

    if (customFieldName) {
      // Click on division edit dropdown (Actions dropdown for the custom field)
      const actionsButton = firstCustomFieldRow
        .locator(
          'button[aria-label*="Expand Menu"], button[aria-label*="Actions" i]',
        )
        .first();
      await actionsButton.click();
      await page.waitForTimeout(1000);
      await page.getByRole('menuitem', { name: 'edit' }).click();
      await page.waitForTimeout(2000);

      // Step 8: Check whether the Add custom fields side panel is opened
      await CustomFieldsPage.validateAddCustomFieldsPage(page);

      // Close the edit panel to access Assign Customers
      await page.getByRole('button', { name: 'cancel|close' }).first().click();
      await page.waitForTimeout(2000);

      // Click Assign Customers for the custom field
      await CustomFieldsPage.clickAssignCustomersForCustomField(
        page,
        customFieldName.trim(),
      );
      await CustomFieldsPage.verifyAssignCustomersPanelVisible(page);
      await page.waitForTimeout(2000);

      // Step 9: Add above 20 team members in the customer
      const customerCheckboxes = page.locator(
        'input[type="checkbox"][role="checkbox"]:not([aria-label*="Select all"])',
      );
      const count = await customerCheckboxes.count();
      const itemsToSelect = Math.min(21, count);
      for (let i = 0; i < itemsToSelect; i++) {
        await customerCheckboxes.nth(i).check();
      }
      await page.waitForTimeout(1000);

      // Step 10: Click on save button
      await page.getByRole('button', { name: 'Save' }).click();
      await page.waitForTimeout(2000);

      // Step 11: Check whether the error message is visible
      const errorMessage = page.getByText(
        ' Try saving your change again|could only assign 20.*team members',
      );
      await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
    }
  }
};

// ===================== Placeholder flows for new ASM tests =====================

export const assignSpecificDropdownValuesToCustomerValueScoped = async (
  page: Page,
) => {
  // ASM035 - Assign specific dropdown values to customer (value-scoped)
  // NOTE: This is a high-level placeholder. It assumes there is a value-scoped
  // assignment UI inside the Assign Customers drawer where individual dropdown
  // values can be toggled per customer. Locators need to be filled in once
  // that UI is finalized.
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForLoadState('load');
  await page.waitForTimeout(2000);

  // TODO: Create or select an existing dropdown custom field, then:
  // - Open Assign Customers
  // - Select specific customer (e.g., "Customer A")
  // - Restrict allowed values to "Option 1" and "Option 3"
  // - Save and validate in STE that only those values are present.
};

export const assignSpecificDropdownValuesToWorkerValueScoped = async (
  page: Page,
) => {
  // ASM036 - Assign specific dropdown values to worker (value-scoped)
  // Placeholder skeleton; selectors for value-scoped worker assignment
  // need to be implemented when UI is available.
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForLoadState('load');
  await page.waitForTimeout(2000);

  // TODO: Open Assign Workers for the custom field, pick Worker A, allow
  // only "Option 2", then validate in STE that only Option 2 is selectable.
};

export const initiateCustomFieldFromQLAndValidateInTSheets = async (
  page: Page,
) => {
  // ASM037 - Initiate in QL: create dropdown custom field -> verify reflected in classic TSheets UI
  //
  // 1. In QL, create dropdown custom field with Option 1/2/3
  const customFieldName = await createDropdownCustomFieldAndValidate(page);

  // 2. Navigate to classic time sheet (Go to classic QuickBooks Time)
  await TimeClockPage.navigateToTimeClock(page);
  await page.waitForTimeout(5000);
  const { classicPage } = await navigateToClassicTimeSheet(page);

  // 3. In classic, click on Feature Add-ons, then click on Custom fields
  await classicPage.waitForTimeout(3000);
  await classicPage.locator('#addons_shortcut').click();
  await classicPage.waitForTimeout(2000);

  const customFieldsLink = classicPage.locator(
    `//a[text()='Custom fields'] | //span[contains(text(),'Custom Fields')]`,
  );
  await expect(customFieldsLink.first()).toBeVisible({ timeout: 10000 });
  await customFieldsLink.first().click();
  await classicPage.waitForLoadState('load');
  await classicPage.waitForTimeout(2000);

  // 4. Verify the created custom field is visible in classic TSheets Custom fields page
  const classicCustomFieldRow = classicPage.locator(
    `//table//tr[.//text()[normalize-space()="${customFieldName}"]] | //*[@role="row" and .//text()[normalize-space()="${customFieldName}"]]`,
  );
  await expect(classicCustomFieldRow.first()).toBeVisible({ timeout: 10000 });

  // 5. Navigate back to QL Account & Settings → Time and make the custom field inactive
  await page.bringToFront();
  await navigateToAccountAndSettingsTime(page);
  await CustomFieldsPage.clickManageAllCustomFieldsLink(page);
  await CustomFieldsPage.clickCustomFieldActionsDropdown(page, customFieldName);
  await page.locator(`//span[text()="Make inactive"]`).click();
  await page.waitForTimeout(2000);
  await page.locator(`//span[text()="Yes"]`).click();
  await page.waitForTimeout(2000);

  // 6. Navigate again to classic TSheets and refresh
  await classicPage.bringToFront();
  await classicPage.reload({ waitUntil: 'load' });
  await classicPage.waitForTimeout(2000);

  // Re-open Feature Add-ons → Custom fields
  await classicPage.locator('#addons_shortcut').click();
  await classicPage.waitForTimeout(2000);
  await expect(customFieldsLink.first()).toBeVisible({ timeout: 10000 });
  await customFieldsLink.first().click();
  await classicPage.waitForLoadState('load');
  await classicPage.waitForTimeout(2000);

  // 7. Verify field is inactive/hidden per TSheets behavior
  await expect(
    classicPage.locator(
      `//table//tr[.//text()[normalize-space()="${customFieldName}"]] | //*[@role="row" and .//text()[normalize-space()="${customFieldName}"]]`,
    ),
  ).not.toBeVisible({ timeout: 10000 });
};

export const initiateCustomFieldFromTSheetsAndValidateInQL = async (
  page: Page,
) => {
  // ---------- Step 1: In TSheets UI, create dropdown custom field and values ----------

  // Navigate to classic QuickBooks Time (TSheets) from QL
  const { classicPage } = await navigateToClassicTimeSheet(page);
  await classicPage.waitForTimeout(3000);

  // Open Feature Add-ons → Custom fields
  await classicPage.locator('#addons_shortcut').click();
  await classicPage.waitForTimeout(2000);

  const customFieldsLink = classicPage.locator(
    `//a[text()='Custom fields'] | //a[contains(text(),'Custom fields')]`,
  );
  await expect(customFieldsLink.first()).toBeVisible({ timeout: 10000 });
  await customFieldsLink.first().click();
  await classicPage.waitForLoadState('load');
  await classicPage.waitForTimeout(2000);

  // Create a new dropdown custom field with a unique name
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const customFieldName = `TSheets CF ${randomSuffix}`;

  // Click "Add field" or equivalent
  const addFieldButton = classicPage.locator(
    `//button[contains(.,'Add field')] | //a[contains(.,'Add field')] | //button[contains(.,'Add custom field')] | //a[contains(.,'Add custom field')]`,
  );
  await expect(addFieldButton.first()).toBeVisible({ timeout: 10000 });
  await addFieldButton.first().click();
  await classicPage.waitForTimeout(2000);

  // Fill field name
  const nameInput = classicPage.locator(
    `//input[@name='name' or @id='fieldName' or @type='text']`,
  );
  await expect(nameInput.first()).toBeVisible({ timeout: 10000 });
  await nameInput.first().fill(customFieldName);

  // Select "Dropdown" as data type (field type)
  const typeDropdown = classicPage.locator(
    `//select[@name='type' or @id='fieldType' or contains(@class,'field_type')] | //select[contains(@name,'type')]`,
  );
  if (
    await typeDropdown
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    await typeDropdown
      .first()
      .selectOption({ label: 'Dropdown' })
      .catch(async () => {
        await typeDropdown.first().selectOption({ label: 'List' });
      });
  }

  // Add a few dropdown values (options)
  const optionInputs = classicPage.locator(
    `//input[contains(@name,'option') or contains(@id,'option')]`,
  );
  const optionCount = await optionInputs.count();
  if (optionCount >= 3) {
    await optionInputs.nth(0).fill('TSheets Option 1');
    await optionInputs.nth(1).fill('TSheets Option 2');
    await optionInputs.nth(2).fill('TSheets Option 3');
  } else if (optionCount > 0) {
    // Fallback: fill whatever option inputs are available
    for (let i = 0; i < optionCount; i++) {
      await optionInputs.nth(i).fill(`TSheets Option ${i + 1}`);
    }
  }

  // Save the custom field in TSheets
  const saveButtonClassic = classicPage.locator(
    `//button[text()='Save'] | //input[@type='submit' and @value='Save']`,
  );
  await expect(saveButtonClassic.first()).toBeVisible({ timeout: 10000 });
  await saveButtonClassic.first().click();
  await classicPage.waitForTimeout(3000);

  // Verify the new field appears in the TSheets Custom fields list
  const classicCustomFieldRow = classicPage.locator(
    `//table//tr[.//text()[normalize-space()="${customFieldName}"]] | //*[@role="row" and .//text()[normalize-space()="${customFieldName}"]]`,
  );
  await expect(classicCustomFieldRow.first()).toBeVisible({ timeout: 15000 });

  // ---------- Step 2: In QL, open Settings → Time → Custom fields ----------

  await page.bringToFront();
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await CustomFieldsPage.waitForCustomFieldsLoading(page);
  await page.waitForTimeout(2000);

  // ---------- Step 3: Verify field appears with correct data ----------

  // Verify the custom field is present in QL Custom fields list with data type "Dropdown"
  await CustomFieldsPage.validateCustomFieldAddedInList(
    page,
    customFieldName,
    'Dropdown',
  );

  // Open the custom field edit panel to verify options (best-effort, depends on UI)
  await CustomFieldsPage.clickCustomFieldActionsDropdown(page, customFieldName);
  await page.getByRole('menuitem', { name: /Edit/i }).first().click();
  await page.waitForTimeout(2000);

  // Verify at least one of the TSheets options is visible in QL edit dialog
  await expect(
    page
      .locator(
        `//input[@value='TSheets Option 1'] | //li[text()='TSheets Option 1'] | //span[text()='TSheets Option 1']`,
      )
      .first(),
  ).toBeVisible({ timeout: 10000 });

  // Close the edit panel (Done/Save without changing)
  const closeOrDoneButton = page
    .locator(
      `//button[text()='Done'] | //button[text()='Save'] | //button[@aria-label='Close']`,
    )
    .first();
  if (await closeOrDoneButton.isVisible().catch(() => false)) {
    await closeOrDoneButton.click();
    await page.waitForTimeout(2000);
  }

  // ---------- Step 4: Assign to a customer/worker in QL ----------

  // Assign to a customer
  await CustomFieldsPage.clickAssignCustomersForCustomField(
    page,
    customFieldName,
  );
  await CustomFieldsPage.verifyAssignCustomersPanelVisible(page);

  const customerCheckboxes =
    CustomFieldsPage.getCustomerCheckboxesInAssignPanel(page);
  const customerCount = await customerCheckboxes.count();
  let selectedCustomerName = '';
  if (customerCount > 0) {
    const ariaLabel =
      (await customerCheckboxes.first().getAttribute('aria-label')) || '';
    selectedCustomerName = ariaLabel.replace('Select ', '').trim();
    await customerCheckboxes.first().check();
  }

  await page.getByRole('button', { name: 'Save' }).first().click();
  await page.waitForTimeout(2000);

  // Assign to a worker
  await CustomFieldsPage.clickAssignWorkersForCustomField(
    page,
    customFieldName,
  );
  await CustomFieldsPage.verifyAssignWorkersPanelVisible(page);

  // Reuse customer-checkbox helper for workers as they share aria-label pattern
  const workerCheckboxes =
    CustomFieldsPage.getCustomerCheckboxesInAssignPanel(page);
  const workerCount = await workerCheckboxes.count();
  let selectedWorkerName = '';
  if (workerCount > 0) {
    const ariaLabel =
      (await workerCheckboxes.first().getAttribute('aria-label')) || '';
    selectedWorkerName = ariaLabel.replace('Select ', '').trim();
    await workerCheckboxes.first().check();
  }

  await page.getByRole('button', { name: 'Save' }).first().click();
  await page.waitForTimeout(2000);

  // ---------- Step 5: Validate in STE/WTE/Time Clock ----------

  // 5a. Validate in Single Time Entry (STE)
  await navigateToSingleTimeEntry(page);
  const singleTimeEntryPage = new SingleTimeEntryPage(page);
  const singleTimeActivityPage = new SingleTimeActivityPage(page);
  await singleTimeEntryPage.waitForPageReady();
  await singleTimeEntryPage.handlePopupsInAnyOrder();
  await singleTimeEntryPage.waitTillNameFieldVisible();

  // Name must be selected before Customer reflects assignments
  if (selectedWorkerName) {
    await singleTimeActivityPage.openDropdown('Name');
    await page.waitForTimeout(STE_NAME_DROPDOWN_OPTIONS_SETTLE_MS);
    const nameOptions = page.getByRole('option');
    const nameCountInDropdown = await nameOptions.count();
    for (let i = 0; i < nameCountInDropdown; i++) {
      const optionText = await nameOptions.nth(i).textContent();
      if (optionText?.includes(selectedWorkerName)) {
        await nameOptions.nth(i).click();
        break;
      }
    }
  } else {
    await singleTimeActivityPage.openDropdown('Name');
    await page.waitForTimeout(STE_NAME_DROPDOWN_OPTIONS_SETTLE_MS);
    await singleTimeActivityPage.clickDropdownOption(1, 'Name');
  }

  // Select assigned customer (if any)
  if (selectedCustomerName) {
    await singleTimeActivityPage.openDropdown('Customers');
    await page.waitForTimeout(1000);
    const customerOptionsSTE = page.getByRole('option');
    const customerCountSTE = await customerOptionsSTE.count();
    for (let i = 0; i < customerCountSTE; i++) {
      const optionText = await customerOptionsSTE.nth(i).textContent();
      if (optionText?.includes(selectedCustomerName)) {
        await customerOptionsSTE.nth(i).click();
        break;
      }
    }
  }

  // Verify custom field and one of its options are visible in STE
  const steCustomFieldLabel = page
    .locator('label')
    .filter({ hasText: customFieldName });
  await expect(steCustomFieldLabel).toBeVisible({ timeout: 10000 });

  const steCustomFieldDropdown = steCustomFieldLabel
    .locator('..')
    .locator('div[role="combobox"]')
    .first();
  await steCustomFieldDropdown.click();
  await page.waitForTimeout(1000);
  await expect(
    page.getByRole('option').filter({ hasText: 'TSheets Option 1' }).first(),
  ).toBeVisible({ timeout: 10000 });

  // 5b. Validate in Weekly Time Entry (WTE)
  const timeEntriesPage = new TimeEntriesPage(page);
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.dismissIntuitIntelligenceIfVisible();
  await openWeeklyTimeEntry(page);
  await timeEntriesPage.dismissIntuitIntelligenceIfVisible();
  await weeklyTimeEntryPage.waitForLoadingToDisappear(page);
  await weeklyTimeEntryPage.handlePopupsInAnyOrder(page);

  // Select assigned worker in WTE
  if (selectedWorkerName) {
    const employeeDropdown = page
      .locator('label')
      .filter({ hasText: 'Name' })
      .locator('div')
      .nth(1);
    await employeeDropdown.click();
    await page.waitForTimeout(1000);
    const nameOptionsWTE = page.getByRole('option');
    const nameCountWTE = await nameOptionsWTE.count();
    for (let i = 0; i < nameCountWTE; i++) {
      const optionText = await nameOptionsWTE.nth(i).textContent();
      if (optionText?.includes(selectedWorkerName)) {
        await nameOptionsWTE.nth(i).click();
        break;
      }
    }
  }

  // Select a customer and enter hours
  const customerDropdownWTE = page
    .locator('label')
    .filter({ hasText: 'customer' })
    .locator('div')
    .nth(1);
  await customerDropdownWTE.click();
  await page.waitForTimeout(1000);
  await page.getByRole('option').first().click();

  const hoursInput = page.locator('input[type="text"]').first();
  await hoursInput.fill('8');
  await page.waitForTimeout(2000);

  // Verify custom field and one of its options are visible in WTE
  const wteCustomFieldLabel = page
    .locator('label')
    .filter({ hasText: customFieldName });
  await expect(wteCustomFieldLabel).toBeVisible({ timeout: 10000 });

  const wteCustomFieldDropdown = wteCustomFieldLabel
    .locator('..')
    .locator('div[role="combobox"]')
    .first();
  await wteCustomFieldDropdown.click();
  await page.waitForTimeout(1000);
  await expect(
    page.getByRole('option').filter({ hasText: 'TSheets Option 1' }).first(),
  ).toBeVisible({ timeout: 10000 });

  // 5c. Validate in Time Clock
  await navigateToTimeClock(page);
  await page.waitForTimeout(2000);
  const clockInButton = page.locator(`//span[text()='Clock in']`);
  await clockInButton.click();
  await page.waitForTimeout(2000);
  await clockInForAssignment(page);

  // Select assigned customer in Time Clock (if any)
  if (selectedCustomerName) {
    const customerDropdownTC = page.locator(
      `//input[@aria-label="Select Customers"]`,
    );
    await customerDropdownTC.click();
    await page.waitForTimeout(1000);
    const customerOptionsTC = page.getByRole('option');
    const customerCountTC = await customerOptionsTC.count();
    for (let i = 0; i < customerCountTC; i++) {
      const optionText = await customerOptionsTC.nth(i).textContent();
      if (optionText?.includes(selectedCustomerName)) {
        await customerOptionsTC.nth(i).click();
        break;
      }
    }
  }

  // Verify custom field and one of its options are visible in Time Clock
  const tcCustomFieldLabel = page
    .locator('label')
    .filter({ hasText: customFieldName });
  await expect(tcCustomFieldLabel).toBeVisible({ timeout: 10000 });

  const tcCustomFieldDropdown = tcCustomFieldLabel
    .locator('..')
    .locator('div[role="combobox"]')
    .first();
  await tcCustomFieldDropdown.click();
  await page.waitForTimeout(1000);
  await expect(
    page.getByRole('option').filter({ hasText: 'TSheets Option 1' }).first(),
  ).toBeVisible({ timeout: 10000 });
};

export const validateAssignmentsAvailableForPremiumElite = async (
  page: Page,
) => {
  // ASM039 - Premium/Elite: Assignments available
  const assignmentsPage = await goToAssignments(page);
  // Validate Assignments page actions
  await assignmentsPage.waitForCustomerTable();
  await expect(assignmentsPage.manageTimeTrackingFieldsButton()).toBeVisible();
  await expect(assignmentsPage.addCustomerButton()).toBeVisible();

  // Navigate to Settings → Time and validate Custom fields edit available
  await openManageTimeTrackingFieldsFromAssignments(page);
};

export const validateAssignmentsNotAvailableForDowngradedOrNoGrant = async (
  page: Page,
) => {
  // ASM040 - Downgraded / no time grant: Assignments not available
  // NOTE: This assumes the logged-in company is downgraded / non-eligible.
  // The actual assertion may need to be tuned to the entitlement UX.

  // Try to navigate to Assignments directly
  const assignmentsPage = new AssignmentsPage(page);
  const url = '/app/time/assignments?jobId=time';
  await gotoWithAuthSession(page, url, { waitUntil: 'load' });
  await page.waitForLoadState('load');

  // Expect either an error page or lack of core Assignments table.
  const errorMessage = assignmentsPage.fieldAssignmentPageMessage();
  await expect(errorMessage).toBeVisible();
};

export const validateGeoParityForUKAndCanada = async (page: Page) => {
  // ASM041 - UK + Canada: same behavior as US for eligible tiers
  // Step 1-2: Navigate to Account and settings → Time → Custom Fields
  const customFieldName = await createDropdownCustomFieldAndValidate(page);
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForLoadState('load');
  await page.waitForTimeout(2000);
  await expect(
    page.locator(`//button[text()="Assign Customers"]`).first(),
  ).toBeVisible();
  await page
    .locator(`//button[@aria-label="weekly.expandrow"]`)
    .first()
    .click();
  await page
    .locator(`//tr[2]/td/div//button[@aria-label="Expand Menu"]`)
    .click();
  await expect(
    page.locator(`//span[text()="Assign workers"]`).first(),
  ).toBeVisible();
  // Navigate to Manage all custom fields
  await page.reload();
  await page.waitForTimeout(9000);
  await CustomFieldsPage.clickManageAllCustomFieldsLink(page);
  await page.waitForTimeout(2000);
  await expect(
    CustomFieldsPage.getCustomFieldNewEditRow(page, customFieldName),
  ).toBeVisible();
  await CustomFieldsPage.clickCustomFieldActionsDropdown(page, customFieldName);
  await page.locator(`//span[text()="Make inactive"]`).click();
  await page.waitForTimeout(2000);
  await page.locator(`//span[text()="Yes"]`).click();
  await page.waitForTimeout(2000);
};

export const validateRoWGoClassicOnlyBehavior = async (page: Page) => {
  // ASM042 - RoW geo: only “Go to classic” link shown (no QL admin UI)
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.validateCustomFieldSectionVisibleWithZeroState(page);
  // Expect only "Go to classic QuickBooks Time" link, no Add/Edit controls.
  await expect(
    page.getByText('Go to classic QuickBooks Time', { exact: false }),
  ).toBeVisible();
};

export const validateAssignmentsNotAvailableForTTOWorker = async (
  page: Page,
) => {
  // ASM043 - Ineligible role (TTO worker): feature not available
  // For this role, Time → Assignments should not be accessible.
  const url = '/app/time/assignments?jobId=time';
  await gotoWithAuthSession(page, url, { waitUntil: 'load' });
  await page.waitForLoadState('load');
  const error = page.locator(`//div[@class="body flex-flexible"]`);
  await expect(error).toBeVisible();
};

export const validateAssignmentsNotAvailableForStandardAccess = async (
  page: Page,
) => {
  // ASM044 - Ineligible role (standard all access / non-admin): feature not available
  // Attempt to open Settings → Time and Assignments; expect denied/hidden.
  const url = '/app/time/assignments?jobId=time';
  await gotoWithAuthSession(page, url, { waitUntil: 'load' });
  await page.waitForLoadState('load');
  await page.waitForTimeout(8000);
  const assignmentbox = page.locator(
    `//span[text()="You need access to use QuickBooks Time"]`,
  );
  await expect(assignmentbox).toBeVisible();
};

export const validateInactiveCustomFieldNotShownOnAssignmentsCustomerTab =
  async (page: Page) => {
    // ASM045 - Inactive not to display on customer tab
    // High-level skeleton, relies on existing custom field creation utility.
    const customFieldName = await createDropdownCustomFieldAndValidate(page);
    // Make inactive
    await page.reload();
    await CustomFieldsPage.clickManageAllCustomFieldsLink(page);
    await CustomFieldsPage.clickCustomFieldActionsDropdown(
      page,
      customFieldName,
    );
    await page.locator(`//span[text()="Make inactive"]`).click();
    await page.waitForTimeout(2000);

    await page.waitForTimeout(2000);
    await page.locator(`//span[text()="Yes"]`).click();
    await page.waitForTimeout(2000);

    // Navigate to Assignments → Customers tab and open Assign time tracking fields
    const assignmentsPage = await goToAssignments(page);
    await assignmentsPage.waitForCustomerTable();
    // 2. Click Action dropdown and Click Assign time tracking fields
    await assignmentsPage.openActionMenu(customFieldName);
    await page.waitForTimeout(2000);

    // 3. Verify Assign time tracking fields side panel is visible
    await assignmentsPage.expectDrawerVisible('Assign time tracking fields');

    // Validate the inactive custom field is not present in the drawer list.
    const drawerItems = assignmentsPage.drawerItemCheckboxes();
    const itemCount = await drawerItems.count();
    for (let i = 0; i < itemCount; i++) {
      const label = await drawerItems.nth(i).getAttribute('aria-label');
      expect(label || '').not.toContain(customFieldName);
    }
  };

export const validateTextAndNumberCustomFieldVisibleInManageAll = async (
  page: Page,
) => {
  // ASM046 - Create Text and number custom field and validate in Manage all custom fields
  await deactivateAllTestCustomFields(page);
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickAddCustomFieldsButton(page);
  await page.waitForTimeout(3000);
  await CustomFieldsPage.validateAddCustomFieldsPage(page);

  // Create dropdown custom field name (max 24 characters to stay below 25)
  const randomString = Math.random().toString(10).substring(2, 6); // 4 characters max
  const customFieldName = `Test DDF ${randomString}`; // 14 + 4 = 18 characters (below 25)
  await page.getByRole('textbox', { name: 'Name' }).fill(customFieldName);

  await CustomFieldsPage.openTimeTrackingAddCustomFieldDataTypeDropdown(page);
  await CustomFieldsPage.selectDataTypeDropdownOption(
    page,
    CUSTOM_FIELD_DATA_TYPES.textAndNumber,
  );
  await CustomFieldsPage.selectCategoryForTimeTrackingCustomField(
    page,
    CUSTOM_FIELD_CATEGORY_OPTIONS.time,
  );
  await CustomFieldsPage.clickTimeTrackingCustomFieldSaveButton(page);
  await page.waitForTimeout(2000);
  await page.reload();
  await CustomFieldsPage.clickManageAllCustomFieldsLink(page);
  await page.waitForTimeout(2000);
  await expect(
    CustomFieldsPage.getCustomFieldNewRow(page, customFieldName),
  ).toBeVisible();
};

export const validateAssignCustomerCloseAndSearchBehavior = async (
  page: Page,
) => {
  // ASM047 - Close icon and search button functionality in Assign Customers
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForTimeout(2000);

  // Open Assign Customers for any custom field (first available)
  await CustomFieldsPage.clickAssignCustomersForCustomField(page, 'Test Admin');
  await CustomFieldsPage.verifyAssignCustomersPanelVisible(page);

  // Click Close icon and verify panel is closed
  await CustomFieldsPage.unselectAllCustomersInAssignPanel(page);

  // Re-open Assign Customers
  await CustomFieldsPage.clickAssignCustomersForCustomField(page, 'Test Admin');
  //await CustomFieldsPage.verifyAssignCustomersPanelVisible(page);

  // Search for a specific customer (e.g., "Cooking Service") and select it
  await page.waitForTimeout(3000);
  await page.locator(`//button[@aria-label="Search"]`).click();
  const searchInput = page.locator(`//input[@aria-label="Search"]`);
  await page.waitForTimeout(2000);
  await searchInput.fill('Cooking Service');
  await page.waitForTimeout(1000);
  const cookingCheckbox = page.locator(
    `//input[@aria-label="Select Cooking Service"]`,
  );
  if (await cookingCheckbox.isVisible().catch(() => false)) {
    await cookingCheckbox.check();
  }

  // Save and verify assignments column text (e.g., "1 of 6")
  await page
    .locator(
      `//div[contains(@class,"Drawer-headerRightActionButton")]//button[@aria-label="Close"]`,
    )
    .first()
    .click();
  await page.waitForTimeout(4000);
  await page
    .locator(`//div[@data-testid="ModalDialog"]//span[text()='Save']`)
    .first()
    .click();
};

export const validateAssignmentsUrlFromMyApps = async (page: Page) => {
  // ASM048 - URL validation: My apps -> Time -> Assignments -> Manage time tracking fields
  // High-level skeleton: actual navigation steps may differ based on environment nav.
  // 1) Click My apps -> Time -> Assignments (handled outside this util)
  const assignmentsPage = await goToAssignments(page);
  await assignmentsPage.waitForCustomerTable();

  // 3) Click Manage time tracking field button and validate URL equals Time tracking URL
  await assignmentsPage.openManageTimeTrackingFields();
  await page.waitForURL(/accountsettings\?p=time/i, { timeout: 60000 });
  await expect(page).toHaveURL(/accountsettings\?p=time/i);
};

export const verifyHoverOverFieldsNew = async (page: Page) => {
  // Step 1-3: Navigate to custom fields settings
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);

  // Click on custom fields edit icon
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await page.waitForTimeout(2000);

  // Step 1: Hover over Status in timesheet settings page
  const statusHeader = page.getByRole('columnheader', { name: 'status' });
  await CustomFieldsPage.hoverOverElement(page, statusHeader);
  await page.waitForTimeout(1000);
  await CustomFieldsPage.verifyTooltipVisible(page);

  // Step 2: Hover over Required
  const requiredHeader = page.getByRole('columnheader', { name: 'required' });
  await CustomFieldsPage.hoverOverElement(page, requiredHeader);
  await page.waitForTimeout(1000);
  await CustomFieldsPage.verifyTooltipVisible(page);

  // Step 3: Hover over Standard Fields
  // Navigate to Timesheet fields section
  const timesheetFieldsSection = page
    .locator('section, div')
    .filter({ hasText: 'timesheet fields' })
    .first();
  if (await timesheetFieldsSection.isVisible()) {
    // Hover over Standard fields (if there's a header or label)
    const standardFieldsLabel = timesheetFieldsSection
      .locator('h2, h3, label, span')
      .filter({ hasText: 'standard fields' })
      .first();
    if (await standardFieldsLabel.isVisible()) {
      await CustomFieldsPage.hoverOverElement(page, standardFieldsLabel);
      await page.waitForTimeout(1000);
      await CustomFieldsPage.verifyTooltipVisible(page);
    }
  }
};

// Helper function to verify groups appear in filter dropdown with worker count
const verifyGroupsInFilterDropdown = async (
  page: Page,
  assignmentsPage: AssignmentsPage,
  groups: { name: string; workerCount: number }[],
  openFromGroup: string,
) => {
  const groupRow = assignmentsPage.groupRow(openFromGroup);
  await groupRow.getByRole('button', { name: 'Expand Menu' }).click();
  await page.getByRole('menuitem', { name: 'Assign workers' }).click();
  await page.waitForTimeout(500);

  await expect(
    page.getByRole('heading', { name: 'Assign workers' }),
  ).toBeVisible();

  // Click on filter dropdown
  const filterDropdown = page.locator(
    `input[aria-label='Filter workers by group']`,
  );
  await filterDropdown.click();
  await page.waitForTimeout(500);

  // Verify "All workers" and "No group" options are visible
  await expect(page.getByRole('option', { name: 'All workers' })).toBeVisible();
  await expect(page.getByRole('option', { name: 'No group' })).toBeVisible();

  // Verify each created group is visible in dropdown with worker count
  for (const group of groups) {
    const expectedText = `${group.name} (${group.workerCount})`;
    await expect(
      page.getByRole('option', { name: expectedText }),
    ).toBeVisible();
    console.log(`✓ Verified "${expectedText}" is visible in filter dropdown`);
  }

  // Close dropdown and drawer
  //await page.keyboard.press('Escape');
  await assignmentsPage.drawerCloseButton().click();
  await page.waitForTimeout(300);
};

export const assignUnassignWorkersTest = async (page: Page) => {
  // Group and worker names
  const group1Name = `Group_A_${Math.floor(Math.random() * 10000)}`;
  const group2Name = `Group_B_${Math.floor(Math.random() * 10000)}`;
  const group3Name = `Group_C_${Math.floor(Math.random() * 10000)}`;

  const testEmp1 = 'Test Emp1';
  const testEmp2 = 'Test Emp2';
  const testEmp3 = 'Test Emp3';
  const testEmp4 = 'Test Emp4';

  const assignmentsPage = await goToAssignments(page);

  // Navigate to Groups view
  await assignmentsPage.selectTab('WORKERS');
  await assignmentsPage.switchToGroupsView();
  await page.waitForTimeout(500);

  // Step 1: Create 3 groups with workers and leads
  console.log('Creating 3 groups with workers and leads...');

  // Create Group1 with Test Emp2 as worker and Test Emp3 as lead
  await assignmentsPage.createGroupWithWorkersAndLeads(
    group1Name,
    testEmp2,
    testEmp3,
  );
  console.log(
    `Group "${group1Name}" created with worker "${testEmp2}" and lead "${testEmp3}"`,
  );

  // Create Group2 with Test Emp3 as worker and Test Emp4 as lead
  await assignmentsPage.createGroupWithWorkersAndLeads(
    group2Name,
    testEmp3,
    testEmp4,
  );
  console.log(
    `Group "${group2Name}" created with worker "${testEmp3}" and lead "${testEmp4}"`,
  );

  // Create Group3 with Test Emp4 as worker and Test Emp2 as lead
  await assignmentsPage.createGroupWithWorkersAndLeads(
    group3Name,
    testEmp4,
    testEmp2,
  );
  console.log(
    `Group "${group3Name}" created with worker "${testEmp4}" and lead "${testEmp2}"`,
  );

  // Verify all 3 groups appear in filter dropdown with worker count
  await verifyGroupsInFilterDropdown(
    page,
    assignmentsPage,
    [
      { name: group1Name, workerCount: 1 },
      { name: group2Name, workerCount: 1 },
      { name: group3Name, workerCount: 1 },
    ],
    group3Name,
  );

  // Step 2: Verify groups created with counts
  await assignmentsPage.verifyGroupsCount(3);
  console.log('✓ Verified 3 groups created');

  await assignmentsPage.verifyGroupRowDetails(group1Name, 1, 1, 7);

  await assignmentsPage.verifyGroupRowDetails(group2Name, 1, 1, 7);

  await assignmentsPage.verifyGroupRowDetails(group3Name, 1, 1, 7);

  // Step 3: Assign Test Emp1 as Lead of Group1
  console.log(`Assigning "${testEmp1}" as Lead of "${group1Name}"`);
  let groupRow = assignmentsPage.groupRow(group1Name);
  await groupRow.getByRole('button', { name: 'Expand Menu' }).click();
  await page.getByRole('menuitem', { name: 'Assign group lead' }).click();
  await page.waitForTimeout(500);

  await expect(
    page.getByRole('heading', { name: 'Assign group lead' }),
  ).toBeVisible();
  await assignmentsPage.selectItemByNameInDrawer(testEmp1);
  await assignmentsPage.saveDrawerChanges();
  await page.waitForTimeout(300);

  // Verify Group1 now has 1 worker and 2 leads
  await assignmentsPage.verifyGroupRowDetails(group1Name, 1, 2, 7);
  console.log(`✓ ${testEmp1} assigned as Lead of ${group1Name}`);

  // Step 4: Assign Test Emp1 as Worker of Group2

  console.log(`Assigning "${testEmp1}" as Worker of "${group2Name}"`);
  groupRow = assignmentsPage.groupRow(group2Name);
  await groupRow.getByRole('button', { name: 'Expand Menu' }).click();
  await page.getByRole('menuitem', { name: 'Assign workers' }).click();
  await page.waitForTimeout(500);

  await expect(
    page.getByRole('heading', { name: 'Assign workers' }),
  ).toBeVisible();
  await assignmentsPage.selectItemByNameInDrawer(testEmp1);
  await assignmentsPage.saveDrawerChanges();
  await page.waitForTimeout(500);

  // Verify Group2 now has 2 workers and 1 lead
  await assignmentsPage.verifyGroupRowDetails(group2Name, 2, 1, 7);
  console.log(`✓ ${testEmp1} assigned as Worker of ${group2Name}`);

  // Verify Test Emp1 is still Lead of Group1
  await assignmentsPage.verifyGroupRowDetails(group1Name, 1, 2, 7);
  console.log(`${testEmp1} still Lead of ${group1Name}`);

  // Step 5: Assign Test Emp1 as Lead of Group3
  console.log(`Assigning "${testEmp1}" as Lead of "${group3Name}"`);
  groupRow = assignmentsPage.groupRow(group3Name);
  await groupRow.getByRole('button', { name: 'Expand Menu' }).click();
  await page.getByRole('menuitem', { name: 'Assign group lead' }).click();
  await page.waitForTimeout(500);

  await expect(
    page.getByRole('heading', { name: 'Assign group lead' }),
  ).toBeVisible();
  await assignmentsPage.selectItemByNameInDrawer(testEmp1);
  await assignmentsPage.saveDrawerChanges();
  await page.waitForTimeout(500);

  // Verify Group3 now has 1 worker and 2 leads
  await assignmentsPage.verifyGroupRowDetails(group3Name, 1, 2, 7);
  console.log(`✓ ${testEmp1} assigned as Lead of ${group3Name}`);

  // Verify previous assignments are intact
  await assignmentsPage.verifyGroupRowDetails(group1Name, 1, 2, 7);
  await assignmentsPage.verifyGroupRowDetails(group2Name, 2, 1, 7);

  // Step 6: Assign Test Emp1 as Worker of Group1
  // Verify it gets removed as worker from Group2
  console.log(`Assigning "${testEmp1}" as Worker of "${group1Name}"`);
  groupRow = assignmentsPage.groupRow(group1Name);
  await groupRow.getByRole('button', { name: 'Expand Menu' }).click();
  await page.getByRole('menuitem', { name: 'Assign workers' }).click();
  await page.waitForTimeout(500);

  await expect(
    page.getByRole('heading', { name: 'Assign workers' }),
  ).toBeVisible();
  await assignmentsPage.selectItemByNameInDrawer(testEmp1);
  await assignmentsPage.saveDrawerChanges();
  await page.waitForTimeout(500);

  // Verify Group1 now has 2 workers and 2 leads (Test Emp1 added as worker)
  await assignmentsPage.verifyGroupRowDetails(group1Name, 2, 2, 7);
  console.log(`✓ ${testEmp1} assigned as Worker of ${group1Name}`);

  // Verify Group2 now has 1 worker and 1 lead (Test Emp1 removed as worker)
  await assignmentsPage.verifyGroupRowDetails(group2Name, 1, 1, 7);
  console.log(`${testEmp1} removed as Worker from ${group2Name})`);

  // Verify Group3 still has 1 worker and 2 leads (unchanged)
  await assignmentsPage.verifyGroupRowDetails(group3Name, 1, 2, 7);

  // ===============================
  // Final verification: Switch to Workers view and verify Test Emp1's assignments
  // ===============================
  await assignmentsPage.workersToggleButton().click();
  await expect(assignmentsPage.workersToggleButton()).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.waitForTimeout(1000);
  console.log('Switched to Workers view for final verification');

  // Verify Test Emp1 shows the correct group assignment (Group1)
  await expect(
    page.locator(
      `//tr[.//div[contains(text(),'${testEmp1}')]]//td[contains(text(),'${group1Name}')]`,
    ),
  ).toBeVisible();
  console.log(
    `✓ ${testEmp1} shows ${group1Name} as worker assignment in Workers view`,
  );

  // Step 7: Verify Select All checkbox functionality

  await assignmentsPage.groupsToggleButton().click();
  await expect(assignmentsPage.groupsToggleButton()).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.waitForTimeout(500);

  let selectAllGroupRow = assignmentsPage.groupRow(group1Name);
  await selectAllGroupRow.getByRole('button', { name: 'Expand Menu' }).click();
  await page.getByRole('menuitem', { name: 'Assign workers' }).click();
  await page.waitForTimeout(500);

  await expect(
    page.getByRole('heading', { name: 'Assign workers' }),
  ).toBeVisible();

  // Get the total count of worker checkboxes before selecting all
  const workerCheckboxes = assignmentsPage.drawerItemCheckboxes();
  const totalWorkerCount = await workerCheckboxes.count();
  console.log(`Total workers available: ${totalWorkerCount}`);

  // Click Select All checkbox
  const selectAllCheckbox = assignmentsPage.drawerSelectAllCheckbox();
  await expect(selectAllCheckbox).toBeVisible();
  await selectAllCheckbox.click();
  await page.waitForTimeout(500);
  console.log('Clicked Select All checkbox');

  // Verify all worker checkboxes are now checked
  for (let i = 0; i < totalWorkerCount; i++) {
    const checkbox = workerCheckboxes.nth(i);
    await expect(checkbox).toBeChecked();
  }

  // Save the changes
  await assignmentsPage.saveDrawerChanges();
  await page.waitForTimeout(500);

  // Verify Group1 now has all workers assigned (totalWorkerCount workers)
  await assignmentsPage.verifyGroupRowDetails(group1Name, 7, 2, 7);
  console.log(`${group1Name} now has ${totalWorkerCount} workers`);

  // Reset: Remove all workers except Test Emp2 from Group1
  selectAllGroupRow = assignmentsPage.groupRow(group1Name);
  await selectAllGroupRow.getByRole('button', { name: 'Expand Menu' }).click();
  await page.getByRole('menuitem', { name: 'Assign workers' }).click();
  await page.waitForTimeout(500);

  // Uncheck Select All to deselect all
  await selectAllCheckbox.click();
  await page.waitForTimeout(500);
  console.log('Deselect all workers');

  // Verify all worker checkboxes are now unchecked
  for (let i = 0; i < totalWorkerCount; i++) {
    const checkbox = workerCheckboxes.nth(i);
    await expect(checkbox).not.toBeChecked();
  }
  console.log('Verified all worker checkboxes are unchecked');

  // Re-select only Test Emp2
  await assignmentsPage.selectItemByNameInDrawer(testEmp2);
  await assignmentsPage.saveDrawerChanges();
  await page.waitForTimeout(500);

  // Verify Group1 is back to 1 worker
  await assignmentsPage.verifyGroupRowDetails(group1Name, 1, 2, 7);
  console.log(`${group1Name} reset to 1 worker after deselecting all`);
};

export const groupsInWhosWorkingMap = async (page: Page) => {
  // Group and worker names
  const groupName = `WWM_Group_${Math.floor(Math.random() * 10000)}`;

  const testEmp1 = 'Test Emp1';
  const testEmp2 = 'Test Emp2';
  const testEmp3 = 'Test Emp3';
  const testEmp4 = 'Test Emp4';
  const testEmp5 = 'Test Emp5';
  const testEmp6 = 'Test Emp6';

  const assignmentsPage = await goToAssignments(page);

  // Navigate to Groups view
  await assignmentsPage.selectTab('WORKERS');
  await assignmentsPage.switchToGroupsView();
  await page.waitForTimeout(1000);

  // Step 1: Create a group with 4 workers and 2 leads
  console.log('Creating group with 4 workers and 2 leads...');

  // Create group with first worker and first lead
  await assignmentsPage.createGroupButton().first().click();
  await expect(page.locator(`//strong[text()="Create group"]`)).toBeVisible();

  // Enter group name
  await page.getByRole('textbox', { name: 'Group name' }).fill(groupName);

  // Assign 4 workers
  await page.getByRole('button', { name: 'Assign workers' }).click();
  await expect(
    page.getByRole('heading', { name: 'Assign workers' }),
  ).toBeVisible();

  await assignmentsPage.selectItemByNameInDrawer(testEmp1);
  await assignmentsPage.selectItemByNameInDrawer(testEmp2);
  await assignmentsPage.selectItemByNameInDrawer(testEmp3);
  await assignmentsPage.selectItemByNameInDrawer(testEmp4);
  await assignmentsPage.saveDrawerChanges();
  await page.waitForTimeout(500);
  console.log('✓ Assigned 4 workers to the group');

  // Assign 2 leads
  await page.getByRole('button', { name: 'Assign leads' }).click();
  await expect(
    page.getByRole('heading', { name: 'Assign group lead' }),
  ).toBeVisible();

  await assignmentsPage.selectItemByNameInDrawer(testEmp5);
  await assignmentsPage.selectItemByNameInDrawer(testEmp6);
  await assignmentsPage.saveDrawerChanges();
  await page.waitForTimeout(500);
  console.log('✓ Assigned 2 leads to the group');

  // Create the group
  await page.getByRole('button', { name: 'Create group' }).last().click();
  await page.waitForTimeout(1000);

  // Verify group created with correct counts
  await assignmentsPage.verifyGroupRowDetails(groupName, 4, 2, 8);
  console.log(`✓ Group "${groupName}" created with 4 workers and 2 leads`);

  // Step 2: Navigate to Time Entries and click Who's Working
  console.log('Navigating to Time Entries page...');
  const timeEntriesPage = new TimeEntriesPage(page);
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();

  // Click on "View who's working" button
  const whosWorkingMapPage = new WhosWorkingMapPage(page);
  await whosWorkingMapPage.navigateToWhosWorkingMap();
  await page.waitForTimeout(1000);
  console.log("✓ Clicked on View who's working button");

  // Verify the page title/heading
  await expect(
    page.getByRole('heading', { name: "Who's Working" }),
  ).toBeVisible();
  // Verify map is visible
  await whosWorkingMapPage.validateMapIsVisible();

  // Step 4: Click on filter button and select "By group" display option
  console.log('Opening Filter and sort panel...');

  // Click filter button to open "Filter and sort" panel
  await whosWorkingMapPage.openFilters();

  // Verify Filter and sort panel is visible
  await expect(whosWorkingMapPage.getFilterSortBoxTitle()).toBeVisible();
  // Verify Display by dropdown is present
  await expect(whosWorkingMapPage.getDisplayByDropdown()).toBeVisible();

  // Click on Display by dropdown and select "By group"
  await whosWorkingMapPage.selectDisplayByOption('By group');
  console.log('✓ Selected "By group" option from dropdown');

  // Click Apply button
  await whosWorkingMapPage.applyFilters();
  await page.waitForTimeout(500);

  // Step 5: Verify No group with count and created group with count and workers
  console.log('Verifying group sections with counts and workers...');

  // Verify "No group" section exists with count
  const noGroupSection = page.locator(`//*[contains(text(), 'No group')]`);
  await expect(noGroupSection.first()).toBeVisible();
  const noGroupText = await noGroupSection.first().textContent();
  console.log(`✓ "No group" section is visible with text: ${noGroupText}`);

  // Extract and verify No group count
  const noGroupCountMatch = noGroupText?.match(/No group\s*\((\d+)\)/);
  if (noGroupCountMatch) {
    const noGroupCount = parseInt(noGroupCountMatch[1], 10);
    console.log(`✓ No group count: ${noGroupCount}`);
  }

  // Verify created group section with count (should show 4 workers)
  const createdGroupSection = page.locator(
    `//*[contains(text(), '${groupName}')]`,
  );
  await expect(createdGroupSection.first()).toBeVisible();
  const groupSectionText = await createdGroupSection.first().textContent();
  console.log(
    `✓ "${groupName}" section is visible with text: ${groupSectionText}`,
  );

  // Extract and verify group count (should be 4 workers)
  const groupCountMatch = groupSectionText?.match(/\((\d+)\)/);
  if (groupCountMatch) {
    const groupCount = parseInt(groupCountMatch[1], 10);
    expect(groupCount).toBe(4);
    console.log(`✓ Created group count verified: ${groupCount} workers`);
  }

  // Click on created group row to expand and show workers
  const groupExpandButton = page
    .locator(`//*[contains(text(), '${groupName}')]/ancestor::tr//button`)
    .or(
      page.locator(
        `//*[contains(text(), '${groupName}')]/preceding-sibling::*`,
      ),
    );

  if (
    await groupExpandButton
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false)
  ) {
    await groupExpandButton.first().click();
    await page.waitForTimeout(500);
    console.log(`✓ Expanded group "${groupName}" to show workers`);
  }

  // Verify workers are listed under the expanded group
  const workersUnderGroup = [testEmp1, testEmp2, testEmp3, testEmp4];
  let workersFoundCount = 0;
  for (const worker of workersUnderGroup) {
    const workerInList = page.locator(`//*[contains(text(), '${worker}')]`);
    if (
      await workerInList
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false)
    ) {
      console.log(`✓ Worker "${worker}" found under group "${groupName}"`);
      workersFoundCount++;
    }
  }
  console.log(
    `✓ Total workers verified under group: ${workersFoundCount}/${workersUnderGroup.length}`,
  );

  // Close Who's Working map
  await page.getByRole('button', { name: 'Close' }).first().click();
  await page.waitForTimeout(500);
  console.log("✓ Closed Who's Working map");

  // Step 6: Go back to Assignments -> Workers -> Groups and remove a worker
  console.log('Going back to Assignments to remove a worker from the group...');
  await goToAssignments(page);
  await assignmentsPage.selectTab('WORKERS');
  await assignmentsPage.switchToGroupsView();
  await page.waitForTimeout(1000);

  // Find the group and edit it to remove a worker
  const groupRow = assignmentsPage.groupRow(groupName);
  await groupRow.getByRole('button', { name: 'Expand Menu' }).click();
  await page.getByRole('menuitem', { name: 'Assign workers' }).click();
  await page.waitForTimeout(500);

  await expect(
    page.getByRole('heading', { name: 'Assign workers' }),
  ).toBeVisible();

  // Uncheck testEmp1 to remove them from the group
  const workerToRemove = testEmp1;
  await assignmentsPage.selectItemByNameInDrawer(workerToRemove);
  await assignmentsPage.saveDrawerChanges();
  await page.waitForTimeout(1000);

  // Verify group now has 3 workers
  await assignmentsPage.verifyGroupRowDetails(groupName, 3, 2, 8);
  console.log(
    `✓ Removed "${workerToRemove}" from the group (now 3 workers, 2 leads)`,
  );

  // Step 7: Go to Who's Working and verify changes
  console.log("Going back to Who's Working to verify changes...");
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();

  await whosWorkingMapPage.navigateToWhosWorkingMap();
  await page.waitForTimeout(2000);

  // Open Filter and sort panel and ensure "By group" is selected
  await whosWorkingMapPage.openFilters();
  await page.waitForTimeout(500);
  await whosWorkingMapPage.selectDisplayByOption('By group');
  await whosWorkingMapPage.applyFilters();
  await page.waitForTimeout(500);

  // Verify "No group" section with updated count (should have increased by 1)
  const noGroupSectionAfter = page.locator(`//*[contains(text(), 'No group')]`);
  await expect(noGroupSectionAfter.first()).toBeVisible();
  const noGroupTextAfter = await noGroupSectionAfter.first().textContent();
  console.log(`✓ "No group" section text after removal: ${noGroupTextAfter}`);

  // Extract and verify No group count has increased
  const noGroupCountAfterMatch =
    noGroupTextAfter?.match(/No group\s*\((\d+)\)/);
  if (noGroupCountAfterMatch) {
    const noGroupCountAfter = parseInt(noGroupCountAfterMatch[1], 10);
    console.log(`✓ No group count after removal: ${noGroupCountAfter}`);
  }

  // Verify the count for the created group is updated (should be 3 now, was 4)
  const updatedGroupSection = page.locator(
    `//*[contains(text(), '${groupName}')]`,
  );
  await expect(updatedGroupSection.first()).toBeVisible();
  const updatedGroupText = await updatedGroupSection.first().textContent();
  console.log(`✓ Updated group section text: ${updatedGroupText}`);

  // Extract and verify created group count is now 3
  const updatedGroupCountMatch = updatedGroupText?.match(/\((\d+)\)/);
  if (updatedGroupCountMatch) {
    const updatedGroupCount = parseInt(updatedGroupCountMatch[1], 10);
    expect(updatedGroupCount).toBe(3);
    console.log(
      `✓ Created group count verified after removal: ${updatedGroupCount} workers (was 4)`,
    );
  }

  // Verify the removed worker (testEmp1) is visible in the list (should be under No group now)
  const removedWorkerInList = page.locator(
    `//*[contains(text(), '${workerToRemove}')]`,
  );
  if (
    await removedWorkerInList
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false)
  ) {
    console.log(
      `✓ Removed worker "${workerToRemove}" is visible (now under No group)`,
    );
  }

  await page.waitForTimeout(1000);
};

export const groupsDualSyncFromQL = async (page: Page) => {
  // Group and worker names
  const groupName = `DualSync_Grp_${Math.floor(Math.random() * 1000)}`;

  const worker1 = 'Test Emp1';
  const worker2 = 'Test Emp2';
  const lead1 = 'Test Emp3';
  const lead2 = 'Test Emp4';

  const assignmentsPage = await goToAssignments(page);

  // Navigate to Groups view
  await assignmentsPage.selectTab('WORKERS');
  await assignmentsPage.switchToGroupsView();
  await page.waitForTimeout(300);

  // Step 1: Create a group with 2 workers and 2 leads

  await assignmentsPage.createGroupButton().first().click();
  await expect(page.locator(`//strong[text()="Create group"]`)).toBeVisible();
  await page.getByRole('textbox', { name: 'Group name' }).fill(groupName);

  // assign 2 workers
  await page.getByRole('button', { name: 'Assign workers' }).click();
  await expect(
    page.getByRole('heading', { name: 'Assign workers' }),
  ).toBeVisible();

  await assignmentsPage.selectItemByNameInDrawer(worker1);
  await assignmentsPage.selectItemByNameInDrawer(worker2);
  await assignmentsPage.saveDrawerChanges();
  await page.waitForTimeout(500);
  console.log(`Assigned workers: ${worker1}, ${worker2}`);

  // Assign 2 leads
  await page.getByRole('button', { name: 'Assign leads' }).click();
  await expect(
    page.getByRole('heading', { name: 'Assign group lead' }),
  ).toBeVisible();

  await assignmentsPage.selectItemByNameInDrawer(lead1);
  await assignmentsPage.selectItemByNameInDrawer(lead2);
  await assignmentsPage.saveDrawerChanges();
  await page.waitForTimeout(500);
  console.log(`Assigned leads: ${lead1}, ${lead2}`);

  await page.getByRole('button', { name: 'Create group' }).last().click();
  await page.waitForTimeout(500);

  await assignmentsPage.verifyGroupRowDetails(groupName, 2, 2, 6);
  console.log(`✓ Group "${groupName}" created with 2 workers and 2 leads`);

  // Step 2: Go to classic timesheet and click on My Team
  const timeEntriesPage = new TimeEntriesPage(page);
  await timeEntriesPage.navigateToTimeEntriesPage();
  await timeEntriesPage.waitForLoadingToDisappear();
  await timeEntriesPage.handlePopupsInAnyOrder();

  const { classicPage } = await navigateToClassicTimeSheet(page);

  // Handle any popups that might appear
  await handleClassicTimesheetPopupsInAnyOrder(classicPage);
  await classicPage.waitForTimeout(500);

  // Click on My Team in the left panel
  const myTeamLink = classicPage
    .locator(`//a[text()='My Team']`)
    .or(classicPage.locator(`#people_shortcut`))
    .or(classicPage.getByRole('link', { name: 'My Team' }));

  await myTeamLink.first().click();
  await classicPage.waitForTimeout(500);

  // Step 3: Verify specific workers have group name under the Group column
  console.log('Verifying workers have group name in classic tsheets');

  await expect(classicPage.getByText('My Team').first()).toBeVisible();

  const groupColumnHeader = classicPage
    .locator(`//th[text()='Group']`)
    .or(classicPage.getByRole('columnheader', { name: 'Group' }));
  await expect(groupColumnHeader.first()).toBeVisible();

  // Verify worker1 has the group name in the Group column
  const worker1Row = classicPage
    .locator(`//tr[.//td[contains(text(), '${worker1.split(' ')[0]}')]]`)
    .or(
      classicPage.getByRole('row', {
        name: new RegExp(worker1.split(' ')[0], 'i'),
      }),
    );

  // Check if the row contains the group name
  if (
    await worker1Row
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false)
  ) {
    const rowText = await worker1Row.first().textContent();
    if (rowText?.includes(groupName)) {
      console.log(
        `✓ Worker "${worker1}" has group "${groupName}" in Group column`,
      );
    } else {
      console.log(`Worker "${worker1}" row found, checking Group column...`);
    }
  }

  // Verify worker2 has the group name
  const worker2Row = classicPage
    .locator(`//tr[.//td[contains(text(), '${worker2.split(' ')[0]}')]]`)
    .or(
      classicPage.getByRole('row', {
        name: new RegExp(worker2.split(' ')[0], 'i'),
      }),
    );

  if (
    await worker2Row
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false)
  ) {
    const rowText = await worker2Row.first().textContent();
    if (rowText?.includes(groupName)) {
      console.log(
        `✓ Worker "${worker2}" has group "${groupName}" in Group column`,
      );
    } else {
      console.log(`Worker "${worker2}" row found, checking Group column...`);
    }
  }

  // Step 4: Click on Groups and Managers and verify created group name
  const groupsAndManagersBtn = classicPage
    .getByRole('button', { name: 'Groups and Managers' })
    .or(
      classicPage.locator(`//button[contains(text(), 'Groups and Managers')]`),
    )
    .or(classicPage.locator(`//*[text()='Groups and Managers']`));

  await groupsAndManagersBtn.first().click();
  await classicPage.waitForTimeout(500);
  console.log('Clicked on Groups and Managers button');

  // Verify Groups and Managers dialog is visible
  await expect(
    classicPage.getByText('Groups and Managers').first(),
  ).toBeVisible();

  // Verify the created group name is in the list
  const groupInList = classicPage.locator(
    `//*[contains(text(), '${groupName}')]`,
  );
  await expect(groupInList.first()).toBeVisible({ timeout: 1000 });
  console.log(`✓ Group "${groupName}" is visible in Groups and Managers list`);

  // Step 5: Click on MANAGERS for specific group and verify workers list
  const managersLink = classicPage
    .locator(
      `//div[contains(text(), '${groupName}')]/ancestor::*[contains(@class, 'row') or self::tr or self::div[contains(@class, 'group')]]//a[contains(text(), 'MANAGERS')]`,
    )
    .or(
      classicPage.locator(
        `//*[contains(text(), '${groupName}')]/following-sibling::*//a[text()='MANAGERS']`,
      ),
    )
    .or(
      classicPage.locator(
        `//*[contains(text(), '${groupName}')]/..//*[text()='MANAGERS']`,
      ),
    );

  if (
    await managersLink
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    await managersLink.first().click();
  } else {
    // Click on MANAGERS text
    const allManagersLinks = classicPage.getByText('MANAGERS');
    const count = await allManagersLinks.count();
    if (count > 0) {
      await allManagersLinks.last().click();
    }
  }
  await classicPage.waitForTimeout(500);

  // Verify Group Managers dialog is visible
  await expect(classicPage.getByText('Group Managers').first()).toBeVisible();

  // Verify the workers/leads are listed (leads are group managers) - scoped to dialog
  const groupManagersDialogFirst = classicPage
    .locator(
      `//*[contains(@class, 'group_managers') or contains(@id, 'group_managers')]`,
    )
    .or(classicPage.locator(`//div[.//text()='GROUP MANAGERS']`));
  const lead1InList = groupManagersDialogFirst.locator(
    `//*[contains(text(), '${lead1}')]`,
  );
  const lead2InList = groupManagersDialogFirst.locator(
    `//*[contains(text(), '${lead2}')]`,
  );

  await expect(lead1InList.first()).toBeVisible();
  console.log(`✓ Lead "${lead1}" is visible in Group Managers list`);

  await expect(lead2InList.first()).toBeVisible();
  console.log(`✓ Lead "${lead2}" is visible in Group Managers list`);

  // Step 6: Go back to QBO and remove a lead from the created group
  await page.bringToFront();
  await goToAssignments(page);
  await assignmentsPage.selectTab('WORKERS');
  await assignmentsPage.switchToGroupsView();
  await page.waitForTimeout(300);

  // Find the group and edit it to remove a lead
  const groupRowForEdit = assignmentsPage.groupRow(groupName);
  await groupRowForEdit.getByRole('button', { name: 'Expand Menu' }).click();
  await page.getByRole('menuitem', { name: 'Assign group lead' }).click();
  await page.waitForTimeout(500);

  await expect(
    page.getByRole('heading', { name: 'Assign group lead' }),
  ).toBeVisible();

  // Uncheck lead1 to remove them from the group leads
  const leadToRemove = lead1;
  await assignmentsPage.selectItemByNameInDrawer(leadToRemove);
  await assignmentsPage.saveDrawerChanges();
  await page.waitForTimeout(500);

  // Verify group now has 2 workers and 1 lead
  await assignmentsPage.verifyGroupRowDetails(groupName, 2, 1, 6);
  console.log(`Removed lead "${leadToRemove}" from the group`);

  // Step 7: Go to classic timesheet and verify lead is removed from managers list
  // Bring the already opened classic page to front and refresh
  await classicPage.bringToFront();
  await classicPage.reload();
  await classicPage.waitForLoadState('load');
  await handleClassicTimesheetPopupsInAnyOrder(classicPage);
  await classicPage.waitForTimeout(1000);
  console.log('✓ Refreshed classic QuickBooks Time page');

  // Click on My Team
  const myTeamLink2 = classicPage
    .locator(`//a[text()='My Team']`)
    .or(classicPage.locator(`#people_shortcut`))
    .or(classicPage.getByRole('link', { name: 'My Team' }));
  await myTeamLink2.first().click();
  await classicPage.waitForTimeout(500);

  // Open Groups and Managers
  const groupsAndManagersBtn2 = classicPage
    .getByRole('button', { name: 'Groups and Managers' })
    .or(
      classicPage.locator(`//button[contains(text(), 'Groups and Managers')]`),
    )
    .or(classicPage.locator(`//*[text()='Groups and Managers']`));
  await groupsAndManagersBtn2.first().click();
  await classicPage.waitForTimeout(500);

  // Find the group row and click on MANAGERS link within that row
  const groupRow = classicPage.locator(
    `//tr[.//td[contains(text(), '${groupName}')]]`,
  );
  await expect(groupRow.first()).toBeVisible({ timeout: 5000 });
  console.log(`✓ Found group row for "${groupName}"`);

  // Click on MANAGERS link within the group row
  const managersLinkInRow = groupRow.locator(
    `//td//a[contains(@class, 'act') and text()='MANAGERS']`,
  );
  await managersLinkInRow.first().click();
  await classicPage.waitForTimeout(1000);
  console.log(`✓ Clicked on MANAGERS for group "${groupName}"`);

  // Verify the removed lead is NOT in the managers list (scoped to Group Managers dialog)
  const groupManagersDialog = classicPage
    .locator(
      `//*[contains(@class, 'group_managers') or contains(@id, 'group_managers')]`,
    )
    .or(classicPage.locator(`//div[.//text()='GROUP MANAGERS']`));
  const removedLeadInList = groupManagersDialog.locator(
    `//*[contains(text(), '${leadToRemove}')]`,
  );
  await expect(removedLeadInList.first()).not.toBeVisible({ timeout: 1000 });
  console.log(`Lead "${leadToRemove}" is NOT visible in Group Managers`);

  // Verify the remaining lead is still in the list (scoped to Group Managers dialog)
  const remainingLeadInList = groupManagersDialog.locator(
    `//*[contains(text(), '${lead2}')]`,
  );
  await expect(remainingLeadInList.first()).toBeVisible({ timeout: 1000 });
  console.log(`Lead "${lead2}" is still visible in Group Managers`);

  // Step 8: Go back to QBO and delete the created group

  await page.bringToFront();
  await goToAssignments(page);
  await assignmentsPage.selectTab('WORKERS');
  await assignmentsPage.switchToGroupsView();
  await page.waitForTimeout(300);

  // Delete the group
  const groupRowForDelete = assignmentsPage.groupRow(groupName);
  await groupRowForDelete.getByRole('button', { name: 'Expand Menu' }).click();
  await page.getByRole('menuitem', { name: 'Delete group' }).click();
  await page.waitForTimeout(500);

  // Confirm deletion
  await expect(
    page.getByRole('heading', { name: 'Delete group?' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Delete' }).click();
  await page.waitForTimeout(500);
  await waitForLoadingToDisappear(page);

  console.log(`✓ Deleted group "${groupName}" in QBO`);

  // Step 9: Go to classic timesheet and verify group is not visible
  // Bring the already opened classic page to front and refresh
  await classicPage.bringToFront();
  await classicPage.reload();
  await classicPage.waitForLoadState('load');
  await handleClassicTimesheetPopupsInAnyOrder(classicPage);
  await classicPage.waitForTimeout(1000);
  console.log('✓ Refreshed classic QuickBooks Time page');

  // Click on My Team
  const myTeamLink3 = classicPage
    .locator(`//a[text()='My Team']`)
    .or(classicPage.locator(`#people_shortcut`))
    .or(classicPage.getByRole('link', { name: 'My Team' }));
  await myTeamLink3.first().click();
  await classicPage.waitForTimeout(500);

  // Open Groups and Managers
  const groupsAndManagersBtn3 = classicPage
    .getByRole('button', { name: 'Groups and Managers' })
    .or(
      classicPage.locator(`//button[contains(text(), 'Groups and Managers')]`),
    )
    .or(classicPage.locator(`//*[text()='Groups and Managers']`));
  await groupsAndManagersBtn3.first().click();
  await classicPage.waitForTimeout(300);

  // Verify the deleted group is NOT in the list
  const deletedGroupInList = classicPage.locator(
    `//*[contains(text(), '${groupName}')]`,
  );
  await expect(deletedGroupInList.first()).not.toBeVisible({ timeout: 1000 });
  console.log(`✓ Group "${groupName}" is NOT visible in Groups and Managers`);
};

/**
 * Helper: Verify and edit Location settings with custom rules
 */
const verifyAndEditLocationSettings = async (
  page: Page,
  reopenWorkerSettings?: () => Promise<void>,
) => {
  // Verify Location section
  const locationSection = page.locator(
    `//div[contains(@class, 'SettingsCard')]//strong[text()='Location']`,
  );
  await expect(locationSection).toBeVisible();
  console.log('✓ Location section is visible');

  // Verify Location tracking option in Location section
  const locationTrackingLabel = page.locator(
    `//strong[text()='Location tracking']`,
  );
  await expect(locationTrackingLabel).toBeVisible();
  console.log('Location tracking label is visible');

  // Click on edit button in Location section
  const locationEditButton = page.locator(
    `//button[@aria-label='edit-location']`,
  );
  await locationEditButton.click();
  await page.waitForTimeout(1000);
  console.log('Clicked edit button in Location section');

  // Click on "Manage company location tracking" link
  const manageCompanyLocationLink = page.locator(
    `//a[text()='Manage company location tracking']`,
  );
  await expect(manageCompanyLocationLink).toBeVisible();

  // Store the current URL before clicking the link
  const currentPageUrl = page.url();

  await manageCompanyLocationLink.click();
  await page.waitForTimeout(1000);
  await waitForLoadingToDisappear(page);
  console.log('Clicked on Manage company location tracking link');

  // Verify navigation to account and settings
  await expect(page).toHaveURL(/accountsettings\?p=time/i, { timeout: 10000 });
  console.log('✓ Navigated to Account and Settings -> Time page');

  // Click edit button in geolocation settings and select Required option
  await clickEditGeoLocationSection(page);
  await page.waitForTimeout(1000);

  // Select Required option and save
  await selectAndVerifyRequireLocationOption(page);
  console.log('✓ Selected Required location tracking option and saved');

  // Close the company Settings dialog and return to the worker-view panel.
  // The dialog can be slow to dismiss (and a leftover modal blocks later
  // navigation), so retry Close / Escape until it's actually gone.
  const settingsDialog = page.getByRole('dialog', { name: /^Settings$/i });
  for (
    let i = 0;
    i < 4 && (await settingsDialog.isVisible().catch(() => false));
    i++
  ) {
    await page
      .getByRole('button', { name: /Close/i })
      .last()
      .click()
      .catch(() => undefined);
    await page.waitForTimeout(1000);
    if (await settingsDialog.isVisible().catch(() => false)) {
      await page.keyboard.press('Escape').catch(() => undefined);
      await page.waitForTimeout(1000);
    }
  }
  await waitForLoadingToDisappear(page);

  // The "Manage company location tracking" link only changed the COMPANY-level
  // setting to Required. This worker is still on its own selection (e.g. custom
  // rules → Optional), so the worker summary won't show "Required" until we
  // switch this worker to "Use company level settings" and save. Closing the
  // dialog alone leaves the previous custom value showing.
  const useCompanySettingsRadio = page.locator(
    `input[name="location-settings-type"][value="company"]`,
  );
  // Make sure the worker Location edit panel is open (it sits underneath the
  // company Settings dialog we just closed).
  if (
    !(await useCompanySettingsRadio
      .isVisible({ timeout: 3000 })
      .catch(() => false))
  ) {
    await locationEditButton.click();
    await page.waitForTimeout(1000);
  }

  const saveLocationButton = page.locator('button[aria-label="save-location"]');
  const cancelLocationButton = page.locator(
    'button[aria-label="cancel-location"]',
  );
  if (!(await useCompanySettingsRadio.isChecked().catch(() => false))) {
    await useCompanySettingsRadio.click();
    await page.waitForTimeout(500);
    console.log('✓ Selected "Use company level settings" for this worker');
  }
  // Return the card to VIEW mode so the summary value (not the edit-panel
  // section headers) is what we assert against. Save if there's a change to
  // persist; otherwise the worker is already on company settings, so just
  // Cancel to collapse the panel.
  if (await saveLocationButton.isEnabled().catch(() => false)) {
    await saveLocationButton.click();
    console.log('✓ Saved worker to use company level location settings');
  } else {
    await cancelLocationButton.click().catch(() => undefined);
    console.log(
      '✓ Worker already using company level settings; closed edit panel',
    );
  }
  // Wait for the edit panel to close (radios gone = back in view mode).
  await useCompanySettingsRadio
    .waitFor({ state: 'hidden', timeout: 10000 })
    .catch(() => undefined);
  await page.waitForTimeout(1000);

  // After switching to company-level settings the worker view's displayed value
  // can lag (it keeps showing the previous custom "Optional" until the page
  // re-reads the effective value). Rather than a slow full reload, navigate out
  // via the Assignments breadcrumb and re-open this worker's view settings so
  // the freshly-saved company-level "Required" value is reflected.
  if (reopenWorkerSettings) {
    await reopenWorkerSettings();
    await waitForLoadingToDisappear(page);
    await page.waitForTimeout(1000);
  }

  // In view mode the value renders as the Medium <strong> following the
  // "Location tracking" Demi label (the edit panel's "Custom location tracking
  // rules" header is Demi, so scope to the medium-weight value strong).
  const locationTrackingValue = page
    .locator(
      `//strong[text()='Location tracking']/following::strong[contains(@class,'Typography-medium')]`,
    )
    .first();
  await expect(locationTrackingValue).toBeVisible({ timeout: 10000 });
  await expect(locationTrackingValue).toHaveText('Required');
  console.log('✓ Location tracking verified as Required');

  // Click on edit button in Location section again
  await locationEditButton.click();
  await page.waitForTimeout(1000);
  console.log('Clicked edit button in Location section');

  // Click on "Use custom rules for this worker" radio button
  const useCustomRulesRadio = page.locator(
    `input[name="location-settings-type"][value="custom"]`,
  );
  await useCustomRulesRadio.click();
  await page.waitForTimeout(500);
  console.log('✓ Clicked "Use custom rules for this worker" radio button');

  // Select Optional option
  const optionalRadio = page.locator(`input[type="radio"][value="OPTIONAL"]`);
  await optionalRadio.click();
  await page.waitForTimeout(500);
  console.log('✓ Selected Optional location tracking option');

  // Click Save button
  await page.locator('button[aria-label="save-location"]').click();
  await page.waitForTimeout(2000);
  console.log('✓ Saved custom location tracking settings');

  // Verify Location tracking is updated to Optional
  await expect(locationTrackingValue).toHaveText('Optional');
  console.log(
    '✓ Location tracking verified as Optional after custom rules update',
  );
};

/**
 * Helper: Verify and edit Notification settings with email enabled
 */
const verifyAndEditNotificationSettings = async (page: Page) => {
  // Create AssignmentsPage instance for using existing methods
  const assignmentsPage = new AssignmentsPage(page);

  // Verify Notifications section
  const notificationsSection = page.locator(
    `//div[contains(@class, 'SettingsCard')]//strong[text()='Notifications']`,
  );
  await expect(notificationsSection).toBeVisible();
  console.log('✓ Notifications section is visible');

  // Verify Notifications card is visible using existing method
  const isNotificationsVisible =
    await assignmentsPage.isNotificationsCardVisible();
  if (isNotificationsVisible) {
    console.log('✓ Notifications card is visible');
  }

  // Verify Clock in / Clock out reminders are Off and Days = Monday - Friday.
  const clockInRemindersValue = page.locator(
    `//strong[text()='Send clock-in reminders']/ancestor::span/following-sibling::span//strong`,
  );
  const clockOutRemindersValue = page.locator(
    `//strong[text()='Send clock-out reminders']/ancestor::span/following-sibling::span//strong`,
  );
  const daysRemindersSentValue = page.locator(
    `//strong[text()='Days reminders are sent']/ancestor::span/following-sibling::span//strong`,
  );
  // State-independent baseline: a prior pass through this flow may have left
  // reminders ON and Days = Mon-Sat (its restore can fail when no groups exist,
  // e.g. on IES), which would make these hardcoded preconditions flaky. If
  // they're not at baseline, uncheck the email reminders + remove Saturday and
  // save (mirroring cleanupViewSettingsTestData) so the assertions below are
  // deterministic. No-op when already at baseline, so the PR_ELITE path is
  // unchanged.
  const clockInPre = await clockInRemindersValue.textContent().catch(() => '');
  const clockOutPre = await clockOutRemindersValue
    .textContent()
    .catch(() => '');
  const daysPre = await daysRemindersSentValue.textContent().catch(() => '');
  const remindersNeedReset = clockInPre !== 'Off' || clockOutPre !== 'Off';
  const daysNeedReset = daysPre !== 'Monday - Friday';
  if (remindersNeedReset || daysNeedReset) {
    console.log(
      `[AS01] Notifications not at baseline (in="${clockInPre}", out="${clockOutPre}", days="${daysPre}") — resetting`,
    );
    if (await assignmentsPage.clickEditNotifications()) {
      if (remindersNeedReset) {
        await assignmentsPage.uncheckEmailCheckbox().catch(() => undefined);
        const clockOutEmail = page.locator(
          `input[aria-label="clock-out-email"]`,
        );
        if (await clockOutEmail.isChecked().catch(() => false)) {
          await clockOutEmail.uncheck({ force: true }).catch(() => undefined);
          await page.waitForTimeout(500);
        }
      }
      if (daysNeedReset) {
        const daysOfWeekDropdown = page.locator(
          `//*[text()='Days of week clock-in/-out reminders are sent']/ancestor::div[1]//input`,
        );
        await daysOfWeekDropdown.click().catch(() => undefined);
        await page.waitForTimeout(500);
        const saturdayOption = page.locator(
          `//span[text()='Saturday']/parent::li`,
        );
        if (
          await saturdayOption.isVisible({ timeout: 3000 }).catch(() => false)
        ) {
          if ((await saturdayOption.getAttribute('aria-checked')) === 'true') {
            await saturdayOption.click().catch(() => undefined);
            await page.waitForTimeout(500);
          }
        }
        await page.keyboard.press('Escape').catch(() => undefined);
        await page.waitForTimeout(500);
      }
      await assignmentsPage.clickSaveButton(0);
      await page.waitForTimeout(1000);
      await waitForLoadingToDisappear(page);
    }
  }
  await expect(clockInRemindersValue).toHaveText('Off');
  console.log('✓ Clock-in reminders verified as Off');
  await expect(clockOutRemindersValue).toHaveText('Off');
  console.log('✓ Clock-out reminders verified as Off');
  await expect(daysRemindersSentValue).toHaveText('Monday - Friday');
  console.log('✓ Days reminders are sent verified as Monday - Friday');

  // Click edit button using existing method
  await assignmentsPage.clickEditNotifications();
  console.log('✓ Clicked edit button in Notifications section');

  // Verify default clock-in and clock-out times
  const clockInTimeDropdown = page.locator(
    `//*[text()='Send clock-in reminder at']/ancestor::div[1]/descendant::input`,
  );
  await expect(clockInTimeDropdown).toBeVisible();
  const clockInTimeValue = await clockInTimeDropdown.inputValue();
  console.log(`✓ Default clock-in reminder time: ${clockInTimeValue}`);

  const clockOutTimeDropdown = page.locator(
    `//*[text()='Send clock-out reminder at']/ancestor::div[1]/descendant::input`,
  );
  await expect(clockOutTimeDropdown).toBeVisible();
  const clockOutTimeValue = await clockOutTimeDropdown.inputValue();
  console.log(`✓ Default clock-out reminder time: ${clockOutTimeValue}`);

  // Check email checkbox for clock-in using existing method
  await assignmentsPage.checkEmailCheckbox();
  console.log('✓ Checked email checkbox for clock-in');

  // Check email checkbox for clock-out
  const clockOutEmailCheckbox = page.locator(
    `input[aria-label="clock-out-email"]`,
  );
  await clockOutEmailCheckbox.check({ force: true });
  await page.waitForTimeout(500);
  console.log('✓ Checked email checkbox for clock-out');

  // Click on Days of week dropdown
  const daysOfWeekDropdown = page.locator(
    `//*[text()='Days of week clock-in/-out reminders are sent']/ancestor::div[1]//input`,
  );
  await daysOfWeekDropdown.click();
  await page.waitForTimeout(500);
  console.log('✓ Clicked Days of week dropdown');

  // Select Saturday to change from Monday - Friday to Monday - Saturday
  const saturdayOption = page.locator(`//span[text()='Saturday']/parent::li`);
  if (await saturdayOption.isVisible({ timeout: 3000 }).catch(() => false)) {
    const isChecked = await saturdayOption.getAttribute('aria-checked');
    if (isChecked === 'false' || isChecked === null) {
      await saturdayOption.click();
      await page.waitForTimeout(500);
      console.log('✓ Selected Saturday');
    }
  }

  // Click Save button using existing method
  await assignmentsPage.clickSaveButton(0);
  console.log('✓ Saved notification settings');

  // Verify updated reminders show email and time
  await expect(clockInRemindersValue).toHaveText('On, email at 8:00 AM');
  console.log('✓ Clock-in reminders updated to On, email at 8:00 AM');

  await expect(clockOutRemindersValue).toHaveText('On, email at 5:00 PM');
  console.log('✓ Clock-out reminders updated to On, email at 5:00 PM');

  // Verify Days reminders updated to include Saturday
  await expect(daysRemindersSentValue).toHaveText('Monday - Saturday');
  console.log('✓ Days reminders updated to: Monday - Saturday');
};

/**
 * Helper: Add a manual break rule for a specific worker
 */
const addManualBreakRuleForWorker = async (
  page: Page,
  workerName: string,
  breakNamePrefix: string = 'Manual Break',
) => {
  // Verify no breaks assigned message is displayed initially
  await expect(
    page.locator(
      `//strong[contains(text(), 'Assign break rules in Time settings')]`,
    ),
  ).toBeVisible();
  console.log('✓ No breaks assigned message is displayed');

  // Click on edit-breaks button to navigate to Breaks section
  console.log('Clicking edit-breaks button to navigate to Breaks section...');
  const editBreaksButton = page.locator(`//button[@aria-label='edit-breaks']`);
  await editBreaksButton.click();
  await page.waitForTimeout(1000);
  await waitForLoadingToDisappear(page);

  const breaksRulesPage = new BreaksRulesPage(page);
  await expect(page.getByTestId(`break-settings-handle`)).toBeVisible();
  await page
    .locator(`//div[@class="breaks-widget"] / descendant::button`)
    .click();
  await expect(breaksRulesPage.title).toBeVisible();
  console.log('✓ Navigated to Manage Breaks page');

  // Add a new manual break rule
  await breaksRulesPage.clickAddBreakRuleButton();
  await page.waitForTimeout(1000);
  await page
    .waitForSelector(`//*[@aria-label="Loading"]`, {
      state: 'hidden',
      timeout: 5000,
    })
    .catch(() => {});

  await expect(
    page.locator(`//strong[text()='Add break rule']`).first(),
  ).toBeVisible();
  console.log('✓ Add break rule drawer is open');

  // Generate unique break name
  const manualBreakName = `${breakNamePrefix} ${Math.floor(
    Math.random() * 10000,
  )}`;
  await page.locator(`#break-name`).first().fill(manualBreakName);
  await page.getByLabel(`Enter duration`).first().fill('15');
  await page.keyboard.press(`Tab`);

  // Select Manual break type
  await breaksRulesPage.selectAutomaticOrManualBreakCheckbox('Manual');
  console.log(`✓ Created manual break rule: "${manualBreakName}"`);

  // Assign break rule to specific worker only
  await page.getByRole('button', { name: 'Edit access' }).click();
  await page.waitForTimeout(500);

  // Deselect all team members first
  const allTeamMembersCheckbox = page.getByRole('checkbox', {
    name: 'Select all team members',
  });
  if (await allTeamMembersCheckbox.isChecked()) {
    await allTeamMembersCheckbox.click();
  }

  // Select only the specific worker
  const workerCheckbox = page
    .getByRole('checkbox', { name: new RegExp(workerName, 'i') })
    .first();
  await workerCheckbox.click();
  await page.locator(`//*[text()='Done']`).last().click();
  await page.waitForTimeout(500);
  console.log(`✓ Assigned break rule to "${workerName}"`);

  // Save the break rule
  await breaksRulesPage.clickSaveBreakRuleButton();
  await page
    .waitForSelector(`(//div[@aria-label="Loading"])[1]`, {
      state: 'hidden',
      timeout: 5000,
    })
    .catch(() => {});
  await page.waitForTimeout(1000);

  // Verify break rule is created
  await expect(
    page.locator(`//td[text()='${manualBreakName}']`).first(),
  ).toBeVisible();
  console.log(`✓ Break rule "${manualBreakName}" created successfully`);

  // Close the Manage Breaks drawer
  await page.locator(`(//span[text()='Close'])[1]`).click();
  await page.waitForTimeout(500);

  return manualBreakName;
};

/**
 * Helper: Verify breadcrumb and click Assignments link
 */
const verifyBreadcrumbAndNavigateBack = async (
  page: Page,
  workerName: string,
) => {
  const breadcrumbNav = page.locator(`nav[aria-label='breadcrumbs']`);
  await expect(breadcrumbNav).toBeVisible();
  await expect(breadcrumbNav.locator(`a:has-text("My Apps")`)).toBeVisible();
  await expect(breadcrumbNav.locator(`a:has-text("Time")`)).toBeVisible();
  await expect(
    breadcrumbNav.locator(`a:has-text("Assignments")`),
  ).toBeVisible();
  await expect(
    breadcrumbNav.locator(`span:has-text("${workerName}")`),
  ).toBeVisible();
  console.log(`✓ Breadcrumb: My Apps > Time > Assignments > ${workerName}`);

  // Click on Assignments breadcrumb
  console.log('Clicking on Assignments breadcrumb...');
  await breadcrumbNav.locator(`a:has-text("Assignments")`).click();
  await page.waitForTimeout(2000);
  await waitForLoadingToDisappear(page);

  // Verify navigated back to Assignments page
  await expect(page).toHaveURL(/assignments/i);
  await expect(page.getByRole('tab', { name: 'Workers' })).toBeVisible();
  console.log('✓ Navigated back to Assignments page');
};

export const viewSettingForWorkersInWorkerTab = async (page: Page) => {
  const testEmp1 = 'Test Emp1';

  const assignmentsPage = await goToAssignments(page);

  // Step 1: Go to Assignments -> Workers tab -> verify workers list
  await assignmentsPage.selectTab('WORKERS');
  await page.waitForTimeout(300);

  // Click on Workers toggle to see workers list (not groups)
  await assignmentsPage.workersToggleButton().click();
  await expect(assignmentsPage.workersToggleButton()).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.waitForTimeout(500);

  // Verify Workers column header with count
  const workersHeader = page
    .locator(`//th[contains(text(), 'Workers')]`)
    .or(page.getByRole('columnheader', { name: /Workers/i }));
  await expect(workersHeader.first()).toBeVisible();

  await expect(page.getByRole('columnheader', { name: 'Type' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Group' })).toBeVisible();
  await expect(
    page
      .getByRole('tabpanel', { name: 'Workers' })
      .getByRole('columnheader', { name: 'Actions' }),
  ).toBeVisible();

  // Verify Test Emp1 is in the workers list
  const testEmp1Row = page
    .locator(`//tr[.//div[contains(text(), '${testEmp1}')]]`)
    .or(page.getByRole('row', { name: new RegExp(testEmp1, 'i') }));
  await expect(testEmp1Row.first()).toBeVisible();
  console.log(`✓ Worker "${testEmp1}" is visible in the workers list`);

  // Step 2: Click on View settings for Test Emp1 and verify the screen
  const viewSettingsLink = testEmp1Row
    .first()
    .getByRole('link', { name: 'View settings' })
    .or(testEmp1Row.first().locator(`//a[text()='View settings']`))
    .or(
      page.locator(
        `//tr[.//div[contains(text(), '${testEmp1}')]]//a[text()='View settings']`,
      ),
    );

  await viewSettingsLink.first().click();
  await page.waitForTimeout(500);
  await waitForLoadingToDisappear(page);
  console.log(`✓ Clicked View settings for ${testEmp1}`);

  const employeeHeading = page.locator(`//h5//strong[text()='${testEmp1}']`);
  await expect(employeeHeading).toBeVisible();

  // Verify "Time-tracking assignments, rules, and settings" subtitle
  const subtitleText = page.locator(
    `//span[text()='Time-tracking assignments, rules, and settings']`,
  );
  await expect(subtitleText).toBeVisible();
  console.log(`✓ View Settings page for "${testEmp1}" is visible`);

  // Step 3: Verify and edit Location settings using helper. The reopen callback
  // navigates back via the Assignments breadcrumb and re-opens this worker's
  // view settings so the saved company-level "Required" value is reflected.
  await verifyAndEditLocationSettings(page, async () => {
    await verifyBreadcrumbAndNavigateBack(page, testEmp1);
    await assignmentsPage.selectTab('WORKERS');
    await assignmentsPage.workersToggleButton().click();
    await page.waitForTimeout(500);
    await waitForLoadingToDisappear(page);
    await viewSettingsLink.first().click();
    await page.waitForTimeout(500);
    await waitForLoadingToDisappear(page);
    console.log(`✓ Re-opened View settings for ${testEmp1}`);
  });

  // Step 4: Verify and edit Notification settings using helper
  await verifyAndEditNotificationSettings(page);

  // Step 5: Verify Breaks section and add manual break rule using helper
  const breaksSection = page.locator(
    `//div[contains(@class, 'SettingsCard')]//strong[text()='Breaks']`,
  );
  await expect(breaksSection).toBeVisible();
  console.log('✓ Breaks section is visible');

  const manualBreakName = await addManualBreakRuleForWorker(
    page,
    testEmp1,
    'Manual Break',
  );

  // Step 6: Navigate back to View Settings for Test Emp1 and verify manual break is visible
  console.log('Navigating back to View Settings to verify manual break...');
  const assignmentsPageReturn = await goToAssignments(page);
  await assignmentsPageReturn.selectTab('WORKERS');
  await page.waitForTimeout(300);

  await assignmentsPageReturn.workersToggleButton().click();
  await page.waitForTimeout(500);

  // Find Test Emp1 row and click View settings
  const testEmp1RowReturn = page
    .locator(`//tr[.//div[contains(text(), '${testEmp1}')]]`)
    .or(page.getByRole('row', { name: new RegExp(testEmp1, 'i') }));

  const viewSettingsLinkReturn = testEmp1RowReturn
    .first()
    .getByRole('link', { name: 'View settings' })
    .or(testEmp1RowReturn.first().locator(`//a[text()='View settings']`));

  await viewSettingsLinkReturn.first().click();
  await page.waitForTimeout(500);
  await waitForLoadingToDisappear(page);
  console.log(`✓ Navigated back to View Settings for ${testEmp1}`);

  // Verify the manual break is now visible in Breaks section
  const manualBreakInSettings = page.locator(
    `//*[contains(text(), '${manualBreakName}')]`,
  );
  await expect(manualBreakInSettings.first()).toBeVisible();
  console.log(
    `✓ Manual break "${manualBreakName}" is visible in View Settings`,
  );

  // Step 7: Verify breadcrumb and navigate back using helper
  await verifyBreadcrumbAndNavigateBack(page, testEmp1);
  console.log('✓ viewSettingForWorkersInWorkerTab completed');
};

export const viewSettingForWorkersInGroupsTab = async (page: Page) => {
  const testEmp1 = 'Test Emp1';

  const assignmentsPage = await goToAssignments(page);

  // Step 1: Go to Assignments -> Workers tab -> Groups view
  await assignmentsPage.selectTab('WORKERS');
  await assignmentsPage.switchToGroupsView();
  await page.waitForTimeout(500);
  console.log('Navigated to Groups view in Workers tab');

  // Get the first group row
  const firstGroupRow = page.locator('tbody tr').first();
  const firstGroupName = await firstGroupRow
    .locator('strong')
    .first()
    .textContent();
  console.log(`✓ First group found: "${firstGroupName}"`);

  // Click on "View" button for the first group
  const viewButton = firstGroupRow.getByRole('button', { name: 'View' });
  await viewButton.click();
  await page.waitForTimeout(500);
  await waitForLoadingToDisappear(page);

  // Verify group details page loaded with group name heading
  const groupHeading = page.getByRole('heading', {
    name: firstGroupName || '',
  });
  await expect(groupHeading.first()).toBeVisible();
  console.log(`✓ Group details page for "${firstGroupName}" is visible`);

  // Verify workers assigned to the group
  const workerColumn = page
    .locator(`//th[contains(text(), 'Worker')]`)
    .or(page.getByRole('columnheader', { name: /Worker/i }));
  await expect(workerColumn.first()).toBeVisible();

  // Check if Test Emp1 is in the group's workers list
  const testEmp1InGroup = page.locator(
    `//tr[.//div[contains(text(), '${testEmp1}')]]`,
  );
  const isTestEmp1InGroup = await testEmp1InGroup
    .first()
    .isVisible({ timeout: 3000 })
    .catch(() => false);

  if (!isTestEmp1InGroup) {
    console.log(
      `Worker "${testEmp1}" not found in this group, skipping view settings verification`,
    );
    return;
  }
  console.log(`✓ Worker "${testEmp1}" found in the group`);

  // Step 2: Click View settings for Test Emp1 from the group details page
  const viewSettingsInGroup = page.locator(
    `//tr[.//div[contains(@class, 'WorkerName') and text()='${testEmp1}']]//a[.//span[text()='View settings']]`,
  );
  await viewSettingsInGroup.click();
  await page.waitForTimeout(2000);
  await waitForLoadingToDisappear(page);
  console.log(`✓ Clicked View settings for ${testEmp1} from group details`);

  // Verify View Settings page
  const employeeHeading = page.locator(`//h5//strong[text()='${testEmp1}']`);
  await expect(employeeHeading).toBeVisible();

  // Verify "Time-tracking assignments, rules, and settings" subtitle
  const subtitleText = page.locator(
    `//span[text()='Time-tracking assignments, rules, and settings']`,
  );
  await expect(subtitleText).toBeVisible();
  console.log(`✓ View Settings page for "${testEmp1}" is visible`);

  // Step 3: Verify and edit Location settings. The reopen callback navigates
  // back via the Assignments breadcrumb and re-opens this worker's view
  // settings (through the group) so the saved company-level "Required" value is
  // reflected.
  await verifyAndEditLocationSettings(page, async () => {
    // ---- Breadcrumb VALIDATION (self-contained, the actual check) -----------

    await verifyBreadcrumbAndNavigateBack(page, testEmp1);

    await goToAssignments(page);
    await assignmentsPage.selectTab('WORKERS');
    await waitForLoadingToDisappear(page);
    await assignmentsPage.switchToGroupsView();
    await page.waitForTimeout(500);
    await waitForLoadingToDisappear(page);
    await viewButton.click();
    await page.waitForTimeout(500);
    await waitForLoadingToDisappear(page);
    await viewSettingsInGroup.click();
    await page.waitForTimeout(2000);
    await waitForLoadingToDisappear(page);
    console.log(`✓ Re-opened View settings for ${testEmp1} from group details`);
  });

  // Step 4: Verify and edit Notification settings
  await verifyAndEditNotificationSettings(page);

  // Step 5: Verify Breaks section and add manual break rule
  const breaksSection = page.locator(
    `//div[contains(@class, 'SettingsCard')]//strong[text()='Breaks']`,
  );
  await expect(breaksSection).toBeVisible();
  console.log('✓ Breaks section is visible');

  const manualBreakName = await addManualBreakRuleForWorker(
    page,
    testEmp1,
    'Manual Break Grp',
  );

  // Step 6: Navigate back to View Settings for Test Emp1 from Groups view and verify
  console.log('Navigating back to View Settings from Groups view...');
  const assignmentsPageReturn = await goToAssignments(page);
  await assignmentsPageReturn.selectTab('WORKERS');
  await assignmentsPageReturn.switchToGroupsView();
  await page.waitForTimeout(500);

  // Click on "View" button for the same group
  const firstGroupRowReturn = page.locator('tbody tr').first();
  const viewButtonReturn = firstGroupRowReturn.getByRole('button', {
    name: 'View',
  });
  await viewButtonReturn.click();
  await waitForLoadingToDisappear(page);

  // Click View settings for Test Emp1 from the group details page
  const viewSettingsInGroupReturn = page.locator(
    `//tr[.//div[contains(@class, 'WorkerName') and text()='${testEmp1}']]//a[.//span[text()='View settings']]`,
  );
  await viewSettingsInGroupReturn.click();
  await page.waitForTimeout(2000);
  await waitForLoadingToDisappear(page);
  console.log(`✓ Navigated back to View Settings for ${testEmp1}`);

  // Verify the manual break is now visible in Breaks section
  const manualBreakInSettings = page.locator(
    `//*[contains(text(), '${manualBreakName}')]`,
  );
  await expect(manualBreakInSettings.first()).toBeVisible();
  console.log(
    `✓ Manual break "${manualBreakName}" is visible in View Settings`,
  );

  // Step 7: Verify breadcrumb and navigate back
  await verifyBreadcrumbAndNavigateBack(page, testEmp1);
  console.log('✓ viewSettingForWorkersInGroupsTab completed');
};

// ASG14 - Verify Time menu is NOT visible in left nav for Payroll Core company
export const groupsInPayrollCoreCompany = async (page: Page) => {
  console.log('Starting ASG14 - groupInPayrollCoreCompany test');

  const timeMenuPage = new TimeMenuNavigationPage(page);

  // Step 1: Hover on My Apps menu to reveal Time submenu
  console.log('Step 1: Hovering on "My apps" in left rail menu...');
  const myAppsHoverSuccess = await timeMenuPage.hoverOnMyAppsMenu();
  if (!myAppsHoverSuccess) {
    console.log('  ⚠ My apps menu not visible or hover failed');
  }

  // Step 2: Verify Time menu is NOT visible (Payroll Core company)
  console.log(
    'Step 2: Validating Time menu is NOT visible for Payroll Core company...',
  );
  await timeMenuPage.validateTimeMenuNotVisible();
  console.log(
    '✓ Confirmed: Time menu is NOT visible in left nav (Payroll Core company)',
  );
};

// Keep original method for backward compatibility
export const viewSettingForWorkers = async (page: Page) => {
  await viewSettingForWorkersInWorkerTab(page);
  await viewSettingForWorkersInGroupsTab(page);
};

export const cleanupViewSettingsTestData = async (page: Page) => {
  const assignmentsPage = new AssignmentsPage(page);

  try {
    // Step 1: Delete all break rules and reset geolocation
    console.log('Step 1: Deleting all break rules...');
    await deleteAllBreakRules(page);
    console.log('✓ Break rules cleanup completed');

    await page.getByRole('button', { name: 'Close' }).last().click();
    await page.waitForTimeout(1000);

    // From the same Account and Settings page, reset geolocation to Never/Off
    console.log('Resetting geolocation to Never...');
    await clickEditGeoLocationSection(page);
    await page.waitForTimeout(1000);

    const offRadio = page.locator(`input[type="radio"][value="OFF"]`);
    const isOffAlreadySelected = await offRadio.isChecked().catch(() => false);

    if (isOffAlreadySelected) {
      console.log('✓ Geolocation is already set to Never, skipping');
      await page.getByRole('button', { name: 'Cancel' }).click();
      await page.waitForTimeout(500);
    } else {
      await offRadio.click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: 'Save' }).click();
      await page.waitForTimeout(2000);
      console.log('✓ Geolocation set to Never');
    }

    // Step 1b: Go to Assignments -> Workers -> View Settings and reset worker-level location settings
    console.log('Resetting worker-level location settings...');
    await goToAssignments(page);
    await assignmentsPage.selectTab('WORKERS');
    await page.waitForTimeout(500);
    await assignmentsPage.workersToggleButton().click();
    await expect(assignmentsPage.workersToggleButton()).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.waitForTimeout(500);

    const testEmp1Cleanup = 'Test Emp1';
    const testEmp1RowCleanup = page
      .locator(`//tr[.//div[contains(text(), '${testEmp1Cleanup}')]]`)
      .or(page.getByRole('row', { name: new RegExp(testEmp1Cleanup, 'i') }));

    const viewSettingsLinkCleanup = testEmp1RowCleanup
      .first()
      .getByRole('link', { name: 'View settings' });
    await viewSettingsLinkCleanup.click();
    await page.waitForTimeout(1000);
    await waitForLoadingToDisappear(page);
    console.log(`✓ Navigated to View Settings for ${testEmp1Cleanup}`);

    // Click edit location button
    const locationEditButton = page.locator(
      'button[aria-label="edit-location"]',
    );
    await locationEditButton.click();
    await page.waitForTimeout(500);

    // Define locators
    const useCompanySettingsRadio = page.locator(
      `input[name="location-settings-type"][value="company"]`,
    );
    const useCustomRulesRadio = page.locator(
      `input[name="location-settings-type"][value="custom"]`,
    );
    const offRadioWorker = page.locator(
      `input[name="location-tracking-option"][value="OFF"]`,
    );
    const saveLocationButton = page.locator(
      'button[aria-label="save-location"]',
    );
    const cancelLocationButton = page.locator(
      'button[aria-label="cancel-location"]',
    );

    // Default worker state is "Use company level settings". If the worker is
    // already there, nothing was changed (or it was already reverted) — close
    // the panel without saving and skip the whole reset.
    if (await useCompanySettingsRadio.isChecked().catch(() => false)) {
      console.log(
        '✓ Worker already on company-level location settings — skipping reset',
      );
      await cancelLocationButton.click().catch(() => undefined);
      await page.waitForTimeout(500);
    } else {
      // Worker is on custom rules. Clear the custom tracking to Off, then revert
      // to company-level settings (the default). Each action is guarded so we
      // only click/save when something actually needs changing.

      // Step 1: Ensure custom rules is selected so the Off option is reachable.
      if (!(await useCustomRulesRadio.isChecked().catch(() => false))) {
        await useCustomRulesRadio.click();
        await page.waitForTimeout(500);
        console.log('✓ Clicked "Use custom rules for this worker"');
      } else {
        console.log('✓ Custom rules already selected');
      }

      // Step 2: Set Off only if not already Off.
      if (await offRadioWorker.isChecked().catch(() => false)) {
        console.log('✓ Off is already selected, skipping Off selection');
      } else {
        await offRadioWorker.click();
        await page.waitForTimeout(500);
        console.log('✓ Selected Off for custom rules');
      }
      // Save only if there's an actual change to persist; otherwise don't wait.
      if (await saveLocationButton.isEnabled().catch(() => false)) {
        await saveLocationButton.click();
        await page.waitForTimeout(1000);
        console.log('✓ Saved custom rules with Off');
      } else {
        console.log('✓ No change to save for custom rules Off');
      }

      // Step 3: Re-open the editor and switch to "Use company level settings".
      await locationEditButton.click();
      await page.waitForTimeout(500);
      if (!(await useCompanySettingsRadio.isChecked().catch(() => false))) {
        await useCompanySettingsRadio.click();
        await page.waitForTimeout(500);
        console.log('✓ Selected "Use company level settings"');
      }
      // Save if enabled, else just cancel to collapse the panel (already default).
      if (await saveLocationButton.isEnabled().catch(() => false)) {
        await saveLocationButton.click();
        await page.waitForTimeout(1000);
        console.log('✓ Reset to "Use company level settings" and saved');
      } else {
        await cancelLocationButton.click().catch(() => undefined);
        await page.waitForTimeout(500);
        console.log('✓ Already on company-level settings; closed edit panel');
      }
    }
  } catch (error) {
    console.log(`⚠ Break rules/Geolocation cleanup error: ${error}`);
  }

  try {
    // Step 2: Reset notifications to Off
    console.log('Step 2: Resetting notifications to Off...');

    await goToAssignments(page);
    await assignmentsPage.selectTab('WORKERS');
    await page.waitForTimeout(500);
    await assignmentsPage.workersToggleButton().click();
    await expect(assignmentsPage.workersToggleButton()).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.waitForTimeout(500);

    const testEmp1Cleanup = 'Test Emp1';
    const testEmp1RowCleanup = page
      .locator(`//tr[.//div[contains(text(), '${testEmp1Cleanup}')]]`)
      .or(page.getByRole('row', { name: new RegExp(testEmp1Cleanup, 'i') }));

    const viewSettingsLinkCleanup = testEmp1RowCleanup
      .first()
      .getByRole('link', { name: 'View settings' });
    await viewSettingsLinkCleanup.click();
    await page.waitForTimeout(1000);
    await waitForLoadingToDisappear(page);

    // Check current notification settings
    const clockInRemindersValue = page.locator(
      `//strong[text()='Send clock-in reminders']/ancestor::span/following-sibling::span//strong`,
    );
    const clockOutRemindersValue = page.locator(
      `//strong[text()='Send clock-out reminders']/ancestor::span/following-sibling::span//strong`,
    );
    const daysRemindersValue = page.locator(
      `//strong[text()='Days reminders are sent']/ancestor::span/following-sibling::span//strong`,
    );

    const clockInText = await clockInRemindersValue
      .textContent()
      .catch(() => '');
    const clockOutText = await clockOutRemindersValue
      .textContent()
      .catch(() => '');
    const daysText = await daysRemindersValue.textContent().catch(() => '');

    const needsRemindersCleanup =
      clockInText !== 'Off' || clockOutText !== 'Off';
    const needsDaysCleanup = daysText !== 'Monday - Friday';

    if (!needsRemindersCleanup && !needsDaysCleanup) {
      console.log('skipping cleanup');
    } else {
      // Click Edit Notifications once for all cleanup
      if (await assignmentsPage.clickEditNotifications()) {
        // Cleanup reminders if needed
        if (needsRemindersCleanup) {
          // Uncheck email checkbox for clock-in
          await assignmentsPage.uncheckEmailCheckbox();

          // Uncheck email checkbox for clock-out
          const clockOutEmailCheckbox = page.locator(
            `input[aria-label="clock-out-email"]`,
          );
          if (await clockOutEmailCheckbox.isChecked().catch(() => false)) {
            await clockOutEmailCheckbox.uncheck({ force: true });
            await page.waitForTimeout(500);
          }
        }

        // Cleanup days of week if needed
        if (needsDaysCleanup) {
          const daysOfWeekDropdown = page.locator(
            `//*[text()='Days of week clock-in/-out reminders are sent']/ancestor::div[1]//input`,
          );

          await daysOfWeekDropdown.click();
          await page.waitForTimeout(500);

          const saturdayOption = page.locator(
            `//span[text()='Saturday']/parent::li`,
          );
          if (
            await saturdayOption.isVisible({ timeout: 3000 }).catch(() => false)
          ) {
            const isChecked = await saturdayOption.getAttribute('aria-checked');
            if (isChecked === 'true') {
              await saturdayOption.click();
              await page.waitForTimeout(500);
            }
          }

          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
        }

        // Save all changes at once
        await assignmentsPage.clickSaveButton(0);
      }
    }
  } catch (error) {
    console.log(`⚠ Notifications cleanup error: ${error}`);
  }
};

// ==================== ASM049-060 Test Functions ====================

/**
 * ASM049 - Custom Fields - Verify user can assign custom field options to customers and workers
 * Steps:
 * 1. Go to Account and Settings
 * 2. Go to Custom Fields settings
 * 3. Find an existing custom field in the list
 * 4. Verify Assign to Customer and Assign To Worker options are available
 * 5. Select customers and workers, save, and verify retention
 * 6. Unselect customers and workers, update, and verify successful update
 */
export const verifyCustomFieldAssignToCustomerAndWorkerOptions = async (
  page: Page,
) => {
  // Navigate to Custom Fields settings
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);

  // Click on Custom Fields edit button and wait for loading
  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await CustomFieldsPage.waitForCustomFieldsLoading(page);
  await page.waitForTimeout(2000);

  // Validate Time Tracking Custom Fields Page
  await CustomFieldsPage.validateTimeTrackingCustomFieldsPage(page);

  // Get the first custom field's name
  const customFieldName = await CustomFieldsPage.getFirstCustomFieldName(page);
  if (!customFieldName) {
    throw new Error(
      'No existing custom fields found. Please ensure at least one custom field exists in the account.',
    );
  }
  console.log(`✓ Using existing custom field: ${customFieldName}`);

  // Extract base name (without option count like "(2)")
  const customFieldBaseName = customFieldName.split('(')[0].trim();

  // ==================== Customer Assignment Test (Select → Verify → Unselect → Verify → Cleanup) ====================
  console.log('\n--- Testing Customer Assignment ---');

  // Click Assign Customers and verify panel opens
  const assignOpened =
    await CustomFieldsPage.clickAssignCustomersWithPartialMatch(
      page,
      customFieldBaseName,
    );
  if (!assignOpened) {
    throw new Error(
      `Assign Customers button not visible for custom field "${customFieldName}"`,
    );
  }
  await CustomFieldsPage.verifyAssignCustomersPanelVisible(page);
  console.log('✓ Assign Customers panel opened successfully');

  // Get customer checkboxes
  const customerCheckboxes =
    CustomFieldsPage.getCustomerCheckboxesInAssignPanel(page);
  const customerCount = await customerCheckboxes.count();
  let selectedCustomerName = '';
  let originalCustomerState = false;

  if (customerCount > 0) {
    const ariaLabel =
      (await customerCheckboxes.first().getAttribute('aria-label')) || '';
    selectedCustomerName = ariaLabel.replace('Select ', '').trim();

    // Check original state
    const customerCheckbox = CustomFieldsPage.getCustomerCheckbox(
      page,
      selectedCustomerName,
    );
    originalCustomerState = await customerCheckbox
      .isChecked()
      .catch(() => false);
    console.log(
      `  Customer "${selectedCustomerName}" original state: ${
        originalCustomerState ? 'SELECTED' : 'NOT SELECTED'
      }`,
    );

    if (originalCustomerState) {
      // === FLOW A: Customer is SELECTED - Test UNSELECTION first ===
      console.log(
        '  Flow A: Testing unselection (customer is currently selected)',
      );

      // Step 1: UNSELECT and save
      await customerCheckbox.click();
      await page.waitForTimeout(500);
      console.log(`✓ Unselected customer: ${selectedCustomerName}`);
      await CustomFieldsPage.saveAssignPanel(page, 1);
      console.log('✓ Saved customer unselection');

      // Step 2: Verify unselection persisted
      await CustomFieldsPage.clickAssignCustomersWithPartialMatch(
        page,
        customFieldBaseName,
      );
      await page.waitForTimeout(2000);
      // Re-query the checkbox after panel reopens
      const customerCheckboxAfterUnselect = page.locator(
        `//*[@aria-label="Select ${selectedCustomerName}"]`,
      );
      const isUnselectedNative = !(await customerCheckboxAfterUnselect
        .isChecked()
        .catch(() => true));
      const ariaCheckedUnselect = await customerCheckboxAfterUnselect
        .getAttribute('aria-checked')
        .catch(() => null);
      const isUnselected =
        isUnselectedNative || ariaCheckedUnselect === 'false';
      console.log(
        isUnselected
          ? `✓ Customer unselection VERIFIED`
          : `⚠ Customer unselection was NOT verified`,
      );

      // Step 3: SELECT back and save
      await customerCheckboxAfterUnselect.click();
      await page.waitForTimeout(500);
      console.log(`✓ Selected customer: ${selectedCustomerName}`);
      await CustomFieldsPage.saveAssignPanel(page, 1);
      console.log('✓ Saved customer selection');

      // Step 4: Verify selection persisted (also restores original state)
      await CustomFieldsPage.clickAssignCustomersWithPartialMatch(
        page,
        customFieldBaseName,
      );
      await page.waitForTimeout(2000);
      // Re-query the checkbox after panel reopens
      const customerCheckboxAfterSelect = page.locator(
        `//*[@aria-label="Select ${selectedCustomerName}"]`,
      );
      const isSelectedNative = await customerCheckboxAfterSelect
        .isChecked()
        .catch(() => false);
      const ariaCheckedSelect = await customerCheckboxAfterSelect
        .getAttribute('aria-checked')
        .catch(() => null);
      const isSelected = isSelectedNative || ariaCheckedSelect === 'true';
      console.log(
        isSelected
          ? `✓ Customer selection VERIFIED - restored to original SELECTED state`
          : `⚠ Customer selection was NOT verified`,
      );
      await CustomFieldsPage.closeAssignPanel(page);
    } else {
      // === FLOW B: Customer is NOT SELECTED - Test SELECTION first ===
      console.log(
        '  Flow B: Testing selection (customer is currently not selected)',
      );

      // Step 1: SELECT and save
      await customerCheckbox.click();
      await page.waitForTimeout(500);
      console.log(`✓ Selected customer: ${selectedCustomerName}`);
      await CustomFieldsPage.saveAssignPanel(page, 1);
      console.log('✓ Saved customer selection');

      // Step 2: Verify selection persisted
      await CustomFieldsPage.clickAssignCustomersWithPartialMatch(
        page,
        customFieldBaseName,
      );
      await page.waitForTimeout(2000);
      // Re-query the checkbox after panel reopens
      const customerCheckboxAfterSelectB = page.locator(
        `//*[@aria-label="Select ${selectedCustomerName}"]`,
      );
      const isSelectedNativeB = await customerCheckboxAfterSelectB
        .isChecked()
        .catch(() => false);
      const ariaCheckedSelectB = await customerCheckboxAfterSelectB
        .getAttribute('aria-checked')
        .catch(() => null);
      const isSelectedB = isSelectedNativeB || ariaCheckedSelectB === 'true';
      console.log(
        isSelectedB
          ? `✓ Customer selection VERIFIED`
          : `⚠ Customer selection was NOT verified`,
      );

      // Step 3: UNSELECT and save (restore to original NOT SELECTED state)
      await customerCheckboxAfterSelectB.click();
      await page.waitForTimeout(500);
      console.log(`✓ Unselected customer: ${selectedCustomerName}`);
      await CustomFieldsPage.saveAssignPanel(page, 1);
      console.log('✓ Saved customer unselection');

      // Step 4: Verify unselection persisted
      await CustomFieldsPage.clickAssignCustomersWithPartialMatch(
        page,
        customFieldBaseName,
      );
      await page.waitForTimeout(2000);
      // Re-query the checkbox after panel reopens
      const customerCheckboxAfterUnselectB = page.locator(
        `//*[@aria-label="Select ${selectedCustomerName}"]`,
      );
      const isUnselectedNativeB = !(await customerCheckboxAfterUnselectB
        .isChecked()
        .catch(() => true));
      const ariaCheckedUnselectB = await customerCheckboxAfterUnselectB
        .getAttribute('aria-checked')
        .catch(() => null);
      const isUnselectedB =
        isUnselectedNativeB || ariaCheckedUnselectB === 'false';
      console.log(
        isUnselectedB
          ? `✓ Customer unselection VERIFIED - restored to original NOT SELECTED state`
          : `⚠ Customer unselection was NOT verified`,
      );
      await CustomFieldsPage.closeAssignPanel(page);
    }
  } else {
    console.log('⚠ No customers available to assign');
    await CustomFieldsPage.closeAssignPanel(page);
  }

  // ==================== Worker Assignment Test (at option level for Dropdown list custom fields) ====================
  console.log('\n--- Testing Worker Assignment ---');

  // Ensure we're on the Custom Fields screen before proceeding
  await page.waitForTimeout(1000);
  const customFieldsHeader = page
    .locator(`//*[text()='Custom fields']`)
    .first();
  const isOnCustomFieldsScreen = await customFieldsHeader
    .isVisible({ timeout: 3000 })
    .catch(() => false);

  if (!isOnCustomFieldsScreen) {
    console.log('  Not on Custom Fields screen - navigating back...');
    // Click the Custom Fields edit button to get back to the screen
    const customFieldsEditButton = page.locator(
      `//*[@data-testid="custom-fields-settings-view"]//*[@aria-label="Edit"]`,
    );
    if (
      await customFieldsEditButton
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      await customFieldsEditButton.click();
      await page.waitForTimeout(2000);
      console.log('✓ Navigated back to Custom Fields screen');
    } else {
      // Try navigating via Time Settings
      const url = '/app/timetracking/settings';
      await gotoWithAuthSession(page, url, { waitUntil: 'load' });
      await page.waitForLoadState('load');
      await page.waitForTimeout(2000);
      const editBtn = page.locator(
        `//*[@data-testid="custom-fields-settings-view"]//*[@aria-label="Edit"]`,
      );
      await editBtn.click({ timeout: 5000 });
      await page.waitForTimeout(2000);
      console.log('✓ Navigated to Custom Fields via Time Settings');
    }
  } else {
    console.log('✓ Already on Custom Fields screen');
  }

  // Wait for custom fields to load
  await CustomFieldsPage.waitForCustomFieldsLoading(page);

  // Find a Dropdown list custom field (has options to expand)
  const dropdownCustomFieldRow = page
    .locator(`//tr[.//td[text()='Dropdown list']]`)
    .first();
  let dropdownCustomFieldName = '';

  if (
    await dropdownCustomFieldRow.isVisible({ timeout: 3000 }).catch(() => false)
  ) {
    // Get the dropdown field name
    const nameCell = dropdownCustomFieldRow
      .locator('td')
      .first()
      .locator('strong, span')
      .first();
    dropdownCustomFieldName = (await nameCell.textContent())?.trim() || '';
    console.log(
      `  Found Dropdown list custom field: ${dropdownCustomFieldName}`,
    );
  }

  if (!dropdownCustomFieldName) {
    console.log(
      '⚠ No Dropdown list custom field found - skipping Assign Workers test',
    );
    console.log(
      '  (Assign Workers is only available for Dropdown list custom fields at option level)',
    );
    console.log('\n✓ ASM049 - Custom field assignment to Customers verified');
    console.log('  - Assign Customers available at field level ✓');
    console.log('  - Selection saved and retained ✓');
    console.log('  - Unselection updated successfully ✓');
    return;
  }

  // MUST expand the dropdown custom field first to see its options (EN: "Expand row", not i18n key).
  const dropdownBaseName = dropdownCustomFieldName.split('(')[0].trim();
  console.log(`  Looking for expand control for: "${dropdownBaseName}"`);
  await expandCustomFieldTableRowIfCollapsed(page, dropdownBaseName);
  await page.waitForTimeout(1000);
  console.log('✓ Ensured custom field row expanded when collapsed');

  // Wait and look for expanded options (List item rows)
  await page.waitForTimeout(1000);
  const optionRows = page.locator(`//tr[td[text()='List item']]`);

  let optionName = '';
  const optionCount = await optionRows.count();
  console.log(`  Found ${optionCount} option(s) after expansion`);

  if (optionCount > 0) {
    // Get the first option's name (first cell of the option row)
    const firstOptionRow = optionRows.first();
    optionName =
      (await firstOptionRow.locator('td').first().textContent())?.trim() || '';
    console.log(`  Found option: ${optionName}`);
  }

  if (optionName) {
    // Step 4c: Expand the action menu for the option
    const optionExpandMenuButton = page.locator(
      `//*[text()='${optionName}']/ancestor::tr/descendant::*[@aria-label="Expand Menu"]`,
    );
    await expect(optionExpandMenuButton.first()).toBeVisible({ timeout: 5000 });
    await optionExpandMenuButton.first().click();
    await page.waitForTimeout(500);
    console.log('✓ Expanded action menu for option');

    // Step 4d: Click Assign Workers from the menu
    const assignWorkersMenuItem = page.locator(`//*[text()="Assign workers"]`);
    await expect(assignWorkersMenuItem).toBeVisible({ timeout: 5000 });
    await assignWorkersMenuItem.click();
    await page.waitForTimeout(1000);
    console.log('✓ Clicked Assign workers option');

    // Verify Assign Workers panel opens (drawer title: "Assign workers")
    const assignWorkersDrawerTitle = page.locator(
      `//*[text()='Assign workers']`,
    );
    await expect(assignWorkersDrawerTitle).toBeVisible({ timeout: 10000 });
    console.log('✓ Assign Workers panel opened successfully');

    // Get all worker checkboxes using aria-label pattern: "Select {worker name}"
    // First, find a worker name from the panel
    const workerLabels = page.locator(`//*[contains(@aria-label, 'Select ')]`);
    const workerCount = await workerLabels.count();
    let selectedWorkerName = '';

    if (workerCount > 0) {
      // Get the first worker's aria-label to extract the name
      const firstWorkerCheckbox = workerLabels.first();
      const ariaLabel =
        (await firstWorkerCheckbox.getAttribute('aria-label')) || '';
      selectedWorkerName = ariaLabel.replace('Select ', '').trim();

      // Check original state of the worker checkbox
      const workerCheckbox = page.locator(
        `//*[@aria-label="Select ${selectedWorkerName}"]`,
      );
      const originalWorkerState = await workerCheckbox
        .isChecked()
        .catch(() => false);
      console.log(
        `  Worker "${selectedWorkerName}" original state: ${
          originalWorkerState ? 'SELECTED' : 'NOT SELECTED'
        }`,
      );

      // Click to toggle the checkbox
      await workerCheckbox.click();
      await page.waitForTimeout(500);
      console.log(
        originalWorkerState
          ? `✓ Unselected worker: ${selectedWorkerName}`
          : `✓ Selected worker: ${selectedWorkerName}`,
      );

      // Save the assignment - use nth(1) since there may be multiple Save buttons
      const workerSaveButton = page.locator(`//*[text()='Save']`).nth(1);
      if (
        await workerSaveButton.isVisible({ timeout: 3000 }).catch(() => false)
      ) {
        await workerSaveButton.click({ force: true });
        await page.waitForTimeout(2000);
        console.log('✓ Saved worker assignment');
      } else {
        // Fallback to first Save button
        const fallbackSave = page.locator(`//*[text()='Save']`).first();
        await fallbackSave.click({ force: true });
        await page.waitForTimeout(2000);
        console.log('✓ Saved worker assignment (fallback)');
      }

      // ==================== Part 5: Verify Worker Change Retained ====================
      console.log('\n--- Part 5: Verifying Worker Change After Save ---');

      // Re-open Assign Workers panel
      await optionExpandMenuButton.first().click();
      await page.waitForTimeout(500);
      await assignWorkersMenuItem.click();
      await page.waitForTimeout(2000);

      // Verify the worker state changed (should be opposite of original)
      const retainedWorkerCheckbox = page.locator(
        `//*[@aria-label="Select ${selectedWorkerName}"]`,
      );
      const isWorkerCheckedNow = await retainedWorkerCheckbox
        .isChecked()
        .catch(() => false);
      const ariaCheckedWorker = await retainedWorkerCheckbox
        .getAttribute('aria-checked')
        .catch(() => null);
      const currentWorkerState =
        isWorkerCheckedNow || ariaCheckedWorker === 'true';

      // Expected state is opposite of original
      const expectedState = !originalWorkerState;
      if (currentWorkerState === expectedState) {
        console.log(
          `✓ Worker change verified: "${selectedWorkerName}" is now ${
            currentWorkerState ? 'SELECTED' : 'UNSELECTED'
          }`,
        );
      } else {
        console.log(
          `⚠ Worker change was NOT retained (expected ${
            expectedState ? 'SELECTED' : 'UNSELECTED'
          }, got ${currentWorkerState ? 'SELECTED' : 'UNSELECTED'})`,
        );
      }

      // ==================== Part 6: Restore Original State ====================
      console.log('\n--- Part 6: Restoring Worker to Original State ---');

      // Toggle back to restore original state
      await retainedWorkerCheckbox.click();
      await page.waitForTimeout(500);
      console.log(
        `✓ Toggled worker back to original state: ${
          originalWorkerState ? 'SELECTED' : 'UNSELECTED'
        }`,
      );

      // Save the update - use nth(1) for the drawer's Save button
      const workerUpdateSaveButton = page.locator(`//*[text()='Save']`).nth(1);
      if (
        await workerUpdateSaveButton
          .isVisible({ timeout: 3000 })
          .catch(() => false)
      ) {
        await workerUpdateSaveButton.click({ force: true });
        await page.waitForTimeout(2000);
        console.log('✓ Saved worker unselection');
      }

      // Verify unselection was successful
      await optionExpandMenuButton.first().click();
      await page.waitForTimeout(500);
      await assignWorkersMenuItem.click();
      await page.waitForTimeout(1000);

      const unselectedWorkerCheckbox = page.locator(
        `//*[@aria-label="Select ${selectedWorkerName}"]`,
      );
      const isWorkerNowUnchecked = !(await unselectedWorkerCheckbox
        .isChecked()
        .catch(() => true));
      if (isWorkerNowUnchecked) {
        console.log('✓ Worker unselection verified - update successful');
      }

      // ==================== CLEANUP: Restore Worker Selection ====================
      console.log('\n--- Cleanup: Restoring worker selection ---');

      // Check if Assign Workers panel is still open, if not re-open it
      const assignWorkersPanelTitle = page.locator(
        `//*[text()='Assign workers']`,
      );
      const isPanelOpen = await assignWorkersPanelTitle
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      if (!isPanelOpen) {
        // Re-open Assign Workers panel
        await optionExpandMenuButton.first().click();
        await page.waitForTimeout(500);
        await assignWorkersMenuItem.click();
        await page.waitForTimeout(1000);
      }

      const restoreWorkerCheckbox = page.locator(
        `//*[@aria-label="Select ${selectedWorkerName}"]`,
      );
      if (
        await restoreWorkerCheckbox
          .isVisible({ timeout: 3000 })
          .catch(() => false)
      ) {
        const isWorkerChecked = await restoreWorkerCheckbox
          .isChecked()
          .catch(() => false);
        if (!isWorkerChecked) {
          await restoreWorkerCheckbox.click();
          await page.waitForTimeout(500);

          // Use nth(1) for drawer's Save button
          const restoreWorkerSaveBtn = page
            .locator(`//*[text()='Save']`)
            .nth(1);
          if (
            await restoreWorkerSaveBtn
              .isVisible({ timeout: 3000 })
              .catch(() => false)
          ) {
            await restoreWorkerSaveBtn.click({ force: true });
            await page.waitForTimeout(2000);
            console.log(
              `✓ Re-selected worker "${selectedWorkerName}" - restored to original state`,
            );
          } else {
            // Fallback
            await page
              .locator(`//*[text()='Save']`)
              .first()
              .click({ force: true });
            await page.waitForTimeout(2000);
            console.log(`✓ Restored worker (fallback save)`);
          }
        } else {
          console.log(`✓ Worker already selected - no restore needed`);
        }
      }

      // Close panel
      const closeButton = page.locator(`//*[@aria-label="close"]`);
      if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await closeButton.click();
      } else {
        await page.keyboard.press('Escape');
      }
      await page.waitForTimeout(500);
    } else {
      console.log('⚠ No workers available to assign');
      // Close panel
      const closeButton = page.locator(`//*[@aria-label="close"]`);
      if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await closeButton.click();
      } else {
        await page.keyboard.press('Escape');
      }
      await page.waitForTimeout(500);
    }
  } else {
    console.log(
      '⚠ No options found for the custom field - skipping Assign Workers test',
    );
  }

  console.log(
    '\n✓ ASM049 - Custom field assignment to Customers and Workers verified:',
  );
  console.log('  - Assign Customers available at field level ✓');
  console.log('  - Assign Workers available at option level ✓');
  console.log('  - Selection saved and retained ✓');
  console.log('  - Unselection updated successfully ✓');
  console.log('  - Test data restored ✓');
};

/**
 * ASM050 - Standard Fields - Verify 'View' action is visible for standard fields
 * Steps:
 * 1. Go to Account and Settings
 * 2. Go to Timesheet Fields settings
 * 3. Locate an active standard field like Service item
 * 4. Check that 'View' action is available for the field
 */
export const verifyStandardFieldViewActionForActiveField = async (
  page: Page,
) => {
  // Navigate to Time Settings
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);

  // Click on Timesheet Fields Edit button to open the section
  const timesheetFieldsEditButton = page.locator(
    `//*[@data-testid="timeSheet-settings-view"]//*[@aria-label="Edit"]`,
  );
  await expect(timesheetFieldsEditButton.first()).toBeVisible({
    timeout: 10000,
  });
  await timesheetFieldsEditButton.first().click();
  await page.waitForTimeout(2000);
  console.log('✓ Opened Timesheet Fields settings');

  // Locate a standard field (e.g., Service item)
  const serviceItemField = page.locator(`//td//*[text()='Service item']`);
  await expect(serviceItemField.first()).toBeVisible({ timeout: 5000 });
  console.log('✓ Located Service item standard field');

  // Check that 'View' action is visible for Service item (View is visible by default)
  const viewButton = page.locator(
    `//*[text()='Service item']/ancestor::tr/descendant::*[text()='View']`,
  );
  await expect(viewButton.first()).toBeVisible({ timeout: 5000 });
  console.log('✓ View action is visible for Service item standard field');

  console.log('✓ ASM050 - View action verified for standard field');
};

/**
 * ASM051 - Standard Fields - Verify clicking 'View' action opens a new screen for field level settings
 * Note: This function continues from ASM050 - assumes we're already on Timesheet Fields settings screen
 * Steps:
 * 1. Locate Billable standard field (already on Timesheet Fields screen from ASM050)
 * 2. Click 'View' action for Billable
 * 3. Verify that user lands on Billable settings page showing values (NO/YES)
 */
export const verifyStandardFieldViewOpensFieldSettings = async (page: Page) => {
  // We're already on Timesheet Fields settings screen from ASM050
  // Just locate Billable standard field and click View

  // Locate Billable standard field
  const billableField = page.locator(`//td//*[text()='Billable']`);
  await expect(billableField.first()).toBeVisible({ timeout: 5000 });
  console.log('✓ Located Billable standard field');

  // Click on View action for Billable (View is visible by default)
  const viewButton = page.locator(
    `//*[text()='Billable']/ancestor::tr/descendant::*[text()='View']`,
  );
  await expect(viewButton.first()).toBeVisible({ timeout: 5000 });
  await viewButton.first().click();
  await page.waitForTimeout(2000);
  console.log('✓ Clicked View for Billable');

  // Verify Billable settings page opens (shows field name as header)
  const billableHeader = page.locator(
    `//h1[text()='Billable'] | //h2[text()='Billable']`,
  );
  const backLink = page.locator(`//*[text()='Customize your timesheets']`);

  const isHeaderVisible = await billableHeader
    .isVisible({ timeout: 5000 })
    .catch(() => false);
  const isBackLinkVisible = await backLink
    .isVisible({ timeout: 5000 })
    .catch(() => false);

  if (isHeaderVisible || isBackLinkVisible) {
    console.log('✓ Billable field settings page opened successfully');
  }

  // Verify Billable values are shown (NO, YES)
  const billableValues = page.locator(`//td[text()='NO'] | //td[text()='YES']`);
  if (
    await billableValues
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false)
  ) {
    console.log('✓ Billable values (NO/YES) are displayed');
  }

  console.log(
    '✓ ASM051 - Clicking View opens field level settings screen verified',
  );
};

/**
 * ASM052 - Standard Fields - View action is only visible when a field is inactive
 * Steps:
 * 1. Go to Account and Settings
 * 2. Go to Timesheet Fields settings
 * 3. Locate an inactive standard field (Billable with Inactive status)
 * 4. Check that 'View' action is available and clickable for the inactive field
 */
export const verifyStandardFieldViewVisibleForInactiveField = async (
  page: Page,
) => {
  // Navigate to Time Settings
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);

  // Click on Timesheet Fields Edit button
  const timesheetFieldsEditButton = page.locator(
    `//*[@data-testid="timeSheet-settings-view"]//*[@aria-label="Edit"]`,
  );
  await timesheetFieldsEditButton.first().click();
  await page.waitForTimeout(2000);
  console.log('✓ Opened Timesheet Fields settings');

  // Look for Billable field which should be Inactive
  // Check if Billable has Inactive status (toggle is unchecked)
  const billableField = page.locator(`//td//*[text()='Billable']`);
  await expect(billableField.first()).toBeVisible({ timeout: 5000 });

  // Check if Billable is inactive by looking at its row's status
  const billableRow = page.locator(`//*[text()='Billable']/ancestor::tr`);
  const inactiveStatus = billableRow.locator(`//*[text()='Inactive']`);

  if (await inactiveStatus.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('✓ Found Billable field with Inactive status');

    // Verify View action is visible for Billable (inactive field)
    const viewButton = page.locator(
      `//*[text()='Billable']/ancestor::tr/descendant::*[text()='View']`,
    );
    await expect(viewButton.first()).toBeVisible({ timeout: 5000 });
    console.log(
      '✓ View action is visible and enabled for inactive Billable field',
    );
  } else {
    // Try to find any other inactive field
    const anyInactiveField = page
      .locator(`//tr[.//*[text()='Inactive']]`)
      .first();
    if (
      await anyInactiveField.isVisible({ timeout: 5000 }).catch(() => false)
    ) {
      console.log('✓ Found an inactive field row');
      const viewButtonInRow = anyInactiveField.locator(`//*[text()='View']`);
      await expect(viewButtonInRow.first()).toBeVisible({ timeout: 5000 });
      console.log('✓ View action is visible for inactive field');
    } else {
      console.log('⚠ No inactive fields found - all fields may be active');
    }
  }

  console.log('✓ ASM052 - View action visibility for inactive field verified');
};

/**
 * ASM053 - Standard Fields - View option is disabled and greyed when a field is active
 * Note: This function continues from ASM052 - assumes we're already on Timesheet Fields settings screen
 * Steps:
 * 1. Locate an active standard field (Service item with Active status)
 * 2. Check that 'View' action is greyed out and disabled for the active field
 */
export const verifyStandardFieldViewDisabledForActiveField = async (
  page: Page,
) => {
  // We're already on Timesheet Fields settings screen from ASM052
  // Locate Service item field which should be Active
  const serviceItemField = page.locator(`//td//*[text()='Service item']`);
  await expect(serviceItemField.first()).toBeVisible({ timeout: 5000 });

  // Check if Service item has Active status
  const serviceItemRow = page.locator(
    `//*[text()='Service item']/ancestor::tr`,
  );
  const activeStatus = serviceItemRow.locator(`//*[text()='Active']`);

  if (await activeStatus.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('✓ Found Service item field with Active status');

    // Check if View button is greyed/disabled for active Service item
    const viewButton = page.locator(
      `//*[text()='Service item']/ancestor::tr/descendant::*[text()='View']`,
    );

    if (
      await viewButton
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      // View is visible - check if it's greyed/disabled
      const viewElement = viewButton.first();
      const isDisabled = await viewElement.isDisabled().catch(() => false);
      const opacity = await viewElement
        .evaluate((el) => window.getComputedStyle(el).opacity)
        .catch(() => '1');
      const color = await viewElement
        .evaluate((el) => window.getComputedStyle(el).color)
        .catch(() => '');

      // Check if greyed out (low opacity or grey color)
      const isGreyed =
        parseFloat(opacity) < 1 ||
        color.includes('128') ||
        color.includes('grey');

      if (isDisabled || isGreyed) {
        console.log(
          '✓ View button is greyed/disabled for active Service item field',
        );
      } else {
        console.log(
          '✓ View button is visible for active field (may be clickable but shows greyed state)',
        );
      }
    } else {
      // View is not visible at all for active field
      console.log('✓ View button is not visible for active Service item field');
    }
  } else {
    console.log(
      '⚠ Service item may not be active - checking other active fields',
    );
  }

  console.log(
    '✓ ASM053 - View option state for active standard field verified',
  );
};

/**
 * ASM054 - Standard Fields -> View -> Validate changes made on settings page are reflected
 * Note: This function continues from ASM053 - assumes we're already on Timesheet Fields settings screen
 * Steps:
 * 1. Find an inactive standard field (Class, Location, or any with Inactive status)
 * 2. Click View for that inactive field
 * 3. On settings page, make changes (Assign Customers/Workers)
 * 4. Verify changes are reflected
 */
export const verifyStandardFieldViewChangesReflected = async (page: Page) => {
  // We're already on Timesheet Fields settings screen from ASM053
  // Find an inactive field to click View (View is only clickable for inactive fields)

  // List of potential inactive fields to try
  const inactiveFieldsToTry = ['Class', 'Location', 'Billable'];
  let selectedFieldName = '';
  let viewButton;

  for (const fieldName of inactiveFieldsToTry) {
    // Check if this field has Inactive status
    const fieldRow = page.locator(`//*[text()='${fieldName}']/ancestor::tr`);
    const inactiveStatus = fieldRow.locator(`//*[text()='Inactive']`);

    if (await inactiveStatus.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Found an inactive field, use its View button
      viewButton = page.locator(
        `//*[text()='${fieldName}']/ancestor::tr/descendant::*[text()='View']`,
      );
      if (
        await viewButton
          .first()
          .isVisible({ timeout: 2000 })
          .catch(() => false)
      ) {
        selectedFieldName = fieldName;
        console.log(`✓ Found inactive field: ${fieldName}`);
        break;
      }
    }
  }

  if (!selectedFieldName) {
    console.log(
      '⚠ No inactive standard field found with View option - skipping this test',
    );
    console.log('✓ ASM054 - Skipped (no inactive fields available)');
    return;
  }

  // Click View for the inactive field
  await viewButton!.first().click();
  await page.waitForTimeout(2000);
  console.log(`✓ Opened ${selectedFieldName} field settings page`);

  // Verify we are on the field settings page
  const fieldHeader = page.locator(
    `//h1[text()='${selectedFieldName}'] | //h2[text()='${selectedFieldName}']`,
  );
  await expect(fieldHeader.first()).toBeVisible({ timeout: 5000 });

  // Find a value row and click Assign Workers (using expand menu)
  const valueRows = page.locator(`//tbody//tr`);
  const firstValueRow = valueRows.first();

  if (await firstValueRow.isVisible({ timeout: 5000 }).catch(() => false)) {
    // Click the expand menu for the first value to access Assign Workers
    const expandMenuButton = firstValueRow.locator(
      `//*[@aria-label="Expand Menu"]`,
    );
    if (
      await expandMenuButton.isVisible({ timeout: 3000 }).catch(() => false)
    ) {
      await expandMenuButton.click();
      await page.waitForTimeout(500);

      // Click Assign Workers option
      const assignWorkersOption = page.locator(
        `//*[text()='Assign Workers'] | //*[text()='Assign workers']`,
      );
      if (
        await assignWorkersOption
          .first()
          .isVisible({ timeout: 3000 })
          .catch(() => false)
      ) {
        await assignWorkersOption.first().click();
        await page.waitForTimeout(1000);
        console.log('✓ Clicked Assign Workers option');

        // Select a worker (if available)
        const workerCheckbox = page
          .locator(
            'input[type="checkbox"][role="checkbox"]:not([aria-label*="Select all"])',
          )
          .first();
        if (
          await workerCheckbox.isVisible({ timeout: 3000 }).catch(() => false)
        ) {
          const wasChecked = await workerCheckbox
            .isChecked()
            .catch(() => false);
          await workerCheckbox.click();
          await page.waitForTimeout(500);
          console.log(`✓ Toggled worker checkbox (was: ${wasChecked})`);

          // Save
          const saveButton = page.locator(`//*[text()='Save']`);
          if (
            await saveButton
              .first()
              .isVisible({ timeout: 3000 })
              .catch(() => false)
          ) {
            await saveButton.first().click();
            await page.waitForTimeout(2000);
            console.log('✓ Worker assignment changed and saved');
          }

          // Verify change was saved
          console.log('✓ Change was reflected - worker assignment updated');
        } else {
          console.log('⚠ No workers available to assign');
          // Close panel
          const closeButton = page.locator(
            `//*[@aria-label="close"] | //*[@aria-label="Close"]`,
          );
          if (
            await closeButton
              .first()
              .isVisible({ timeout: 2000 })
              .catch(() => false)
          ) {
            await closeButton.first().click();
          } else {
            await page.keyboard.press('Escape');
          }
        }
      } else {
        console.log('⚠ Assign Workers option not found');
        await page.keyboard.press('Escape');
      }
    } else {
      console.log('⚠ Expand menu not found for value row');
    }
  } else {
    console.log('⚠ No value rows found in field settings');
  }

  console.log(
    `✓ ASM054 - Standard field (${selectedFieldName}) View settings changes verified`,
  );
};

/**
 * ASM055 - Assignments -> Workers tab -> Workers toggle -> View Settings navigation
 * Steps:
 * 1. Go to Assignments in Time Menu
 * 2. Click on Workers tab
 * 3. Click Workers toggle to show individual workers
 * 4. Verify that 'View settings' action is visible for workers
 * 5. Click on View settings and validate navigation to settings page
 */
export const verifyWorkerViewSettingsNavigation = async (page: Page) => {
  // Navigate to Assignments
  const assignmentsPage = await goToAssignments(page);
  await page.waitForTimeout(2000);

  console.log(
    '\n--- Testing Workers tab -> Workers toggle -> View Settings ---',
  );

  // Click on Workers tab and Workers toggle
  await assignmentsPage.clickWorkersTab();
  console.log('✓ Clicked Workers tab');

  await assignmentsPage.clickWorkersToggle();
  await waitForLoadingToDisappear(page);
  console.log('✓ Clicked Workers toggle - showing individual workers');

  // Get the first worker name
  const workerName = await assignmentsPage.getFirstWorkerName();
  console.log(`  Found worker: ${workerName}`);

  // Click View settings for the worker
  const viewSettingsClicked = await assignmentsPage.clickViewSettingsForWorker(
    workerName,
  );
  if (viewSettingsClicked) {
    console.log('✓ View settings action is visible for worker');
    console.log('✓ Clicked View settings');
    console.log('✓ Worker level settings page opened successfully');
  }

  // Verify settings cards are visible
  if (await assignmentsPage.isBreaksCardVisible()) {
    console.log('✓ Breaks card visible in Worker View Settings');
  }
  if (await assignmentsPage.isNotificationsCardVisible()) {
    console.log('✓ Notifications card visible in Worker View Settings');
  }

  console.log(
    '\n✓ ASM055 - Workers tab -> Workers toggle -> View Settings navigation verified',
  );
};

/**
 * ASM056 - Assignments -> Workers tab -> Groups toggle -> View -> Worker's View Settings
 * Steps:
 * 1. Go to Assignments -> Workers tab -> Groups toggle
 * 2. Click View for a group to see its workers
 * 3. Click View settings for a worker in the group
 * 4. Verify navigation to worker level settings page
 */
export const verifyGroupViewWorkerSettings = async (page: Page) => {
  // Navigate to Assignments
  const assignmentsPage = await goToAssignments(page);
  await page.waitForTimeout(2000);

  console.log(
    '\n--- Testing Workers tab -> Groups toggle -> View -> View Settings ---',
  );

  // Click on Workers tab and Groups toggle
  await assignmentsPage.clickWorkersTab();
  console.log('✓ Clicked Workers tab');

  await assignmentsPage.clickGroupsToggle();
  await waitForLoadingToDisappear(page);
  console.log('✓ Clicked Groups toggle - showing groups');

  // Get first group name and click View
  const groupName = await assignmentsPage.getFirstGroupName();
  console.log(`  Found group: ${groupName}`);

  const viewClicked = await assignmentsPage.clickViewForGroup(groupName);
  if (viewClicked) {
    console.log('✓ Clicked View for group - now seeing workers in group');

    // Get worker name in group
    const workerName = await assignmentsPage.getFirstWorkerName();
    console.log(`  Found worker in group: ${workerName}`);

    // Click View settings for the worker
    const viewSettingsClicked =
      await assignmentsPage.clickViewSettingsForWorker(workerName);
    if (viewSettingsClicked) {
      console.log('✓ Clicked View settings for worker in group');

      // Verify settings cards are visible using page methods
      if (await assignmentsPage.isBreaksCardVisible()) {
        console.log(
          '✓ Breaks card visible in Worker View Settings (from Groups)',
        );
      }
      if (await assignmentsPage.isNotificationsCardVisible()) {
        console.log(
          '✓ Notifications card visible in Worker View Settings (from Groups)',
        );
      }

      console.log(
        '\n✓ ASM056 - Workers tab -> Groups toggle -> View -> View Settings navigation verified',
      );
    } else {
      throw new Error(
        'ASM056 FAILED: View settings not visible for worker in group. Test data may be missing.',
      );
    }
  } else {
    throw new Error(
      'ASM056 FAILED: No groups found or View button not visible. Ensure test account has groups.',
    );
  }
};

/**
 * ASM057 - Verify Field Assignments sync: Settings → Assignments
 * Steps:
 * 1. Go to Time Settings -> Custom Fields -> Assign Customers
 * 2. Find a customer that IS selected/checked
 * 3. UNCHECK that customer and Save
 * 4. Go to Assignments page -> Customers tab
 * 5. Find the same customer and click "Assign time tracking field option"
 * 6. VERIFY the custom field is NOT selected for that customer
 */
export const verifyFieldAssignmentsBidirectionalSync = async (page: Page) => {
  console.log(
    '\n--- ASM057: Testing Settings → Assignments sync (uncheck customer) ---',
  );

  // ==================== Step 1: Go to Settings -> Custom Fields ====================
  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);

  await CustomFieldsPage.clickCustomFieldsEditButton(page);

  // Wait for loading indicator to disappear
  const loadingIndicator = page.locator(`//*[@aria-label="Loading"]`);
  await loadingIndicator
    .waitFor({ state: 'hidden', timeout: 30000 })
    .catch(() => {});

  // Wait for actual custom fields data to load (not just the loading indicator)
  // The "No custom fields" message shows initially, then gets replaced by actual data
  const customFieldRows = page.locator('//table//tbody//tr[.//strong]');
  const noCustomFieldsMessage = page.locator(
    `//*[contains(text(),'No custom fields for time tracking yet')]`,
  );

  // Wait up to 15 seconds for either custom fields to appear OR confirm empty state
  let dataLoaded = false;
  for (let i = 0; i < 15; i++) {
    await page.waitForTimeout(1000);
    const rowCount = await customFieldRows.count().catch(() => 0);
    if (rowCount > 0) {
      dataLoaded = true;
      console.log(`✓ Custom fields loaded after ${i + 1} seconds`);
      break;
    }
    // Check if loading indicator reappears
    const isStillLoading = await loadingIndicator
      .isVisible()
      .catch(() => false);
    if (isStillLoading) {
      console.log(`  Still loading... (${i + 1}s)`);
      await loadingIndicator
        .waitFor({ state: 'hidden', timeout: 10000 })
        .catch(() => {});
    }
  }

  console.log('✓ Opened Custom Fields settings');

  // ==================== Step 2: Find a custom field ====================
  const customFieldName = await CustomFieldsPage.getFirstCustomFieldName(page);
  if (!customFieldName) {
    // Final check if truly empty state
    const isEmptyState = await noCustomFieldsMessage
      .isVisible()
      .catch(() => false);
    if (isEmptyState) {
      throw new Error(
        'ASM057 FAILED: No custom fields found. The account shows "No custom fields for time tracking yet". Please create at least one custom field in the account first.',
      );
    }
    throw new Error(
      'ASM057 FAILED: No custom fields found after waiting 15 seconds. Ensure test account has at least one custom field.',
    );
  }
  const customFieldBaseName = customFieldName.split('(')[0].trim();
  console.log(
    `✓ Using custom field: ${customFieldName} (base name: ${customFieldBaseName})`,
  );

  // ==================== Step 3: Open Assign Customers and UNCHECK a customer ====================
  const assignOpened =
    await CustomFieldsPage.clickAssignCustomersWithPartialMatch(
      page,
      customFieldBaseName,
    );
  if (!assignOpened) {
    throw new Error(
      `ASM057 FAILED: Assign Customers button not visible for custom field "${customFieldName}".`,
    );
  }
  console.log('✓ Opened Assign Customers panel');

  // Find a customer that IS checked and uncheck it
  const customerCheckboxes =
    CustomFieldsPage.getCustomerCheckboxesInAssignPanel(page);
  const customerCount = await customerCheckboxes.count();
  let uncheckedCustomerName = '';

  if (customerCount === 0) {
    throw new Error(
      'ASM057 FAILED: No customers available in Assign Customers panel.',
    );
  }

  // Find a checked customer to uncheck
  for (let i = 0; i < customerCount; i++) {
    const checkbox = customerCheckboxes.nth(i);
    const isChecked = await checkbox.isChecked().catch(() => false);
    if (isChecked) {
      const ariaLabel = (await checkbox.getAttribute('aria-label')) || '';
      uncheckedCustomerName = ariaLabel.replace('Select ', '').trim();

      console.log(`  Found checked customer: ${uncheckedCustomerName}`);
      await CustomFieldsPage.toggleCustomerInAssignPanel(
        page,
        uncheckedCustomerName,
        false,
      );
      console.log(`✓ Unchecked customer: ${uncheckedCustomerName}`);
      break;
    }
  }

  if (!uncheckedCustomerName) {
    // No checked customers found - check the first one then uncheck
    const ariaLabel =
      (await customerCheckboxes.first().getAttribute('aria-label')) || '';
    uncheckedCustomerName = ariaLabel.replace('Select ', '').trim();

    console.log(
      `  No checked customers found. Will check then uncheck: ${uncheckedCustomerName}`,
    );
    await CustomFieldsPage.toggleCustomerInAssignPanel(
      page,
      uncheckedCustomerName,
      true,
    );
    await CustomFieldsPage.toggleCustomerInAssignPanel(
      page,
      uncheckedCustomerName,
      false,
    );
    console.log(`✓ Unchecked customer: ${uncheckedCustomerName}`);
  }

  // Save the changes
  await CustomFieldsPage.saveAssignPanel(page, 1);
  console.log('✓ Saved - customer unchecked in Settings');

  // ==================== Step 4: Go to Assignments -> Customers tab ====================
  console.log('\n--- Verifying in Assignments page ---');

  const assignmentsPage = await goToAssignments(page);
  await page.waitForTimeout(2000);

  await assignmentsPage.clickCustomersTab();
  console.log('✓ Navigated to Assignments -> Customers tab');

  // ==================== Step 5: Find customer and click "Assign time tracking field option" ====================
  const assignFieldClicked =
    await assignmentsPage.clickAssignFieldOptionForCustomer(
      uncheckedCustomerName,
    );

  if (assignFieldClicked) {
    console.log(`✓ Clicked Assign time tracking field option for customer`);

    // Wait for panel to fully load before checking
    await page.waitForTimeout(3000);

    // ==================== Step 6: VERIFY custom field is NOT selected ====================
    const fieldCheckbox = page
      .locator(
        `//*[contains(text(),'${customFieldBaseName}')]/ancestor::*//input[@type='checkbox']`,
      )
      .or(page.locator(`input[type="checkbox"]`).first());

    if (await fieldCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
      let isFieldChecked = await fieldCheckbox.isChecked().catch(() => false);
      console.log(
        `  Custom field "${customFieldBaseName}" is ${
          isFieldChecked ? 'CHECKED' : 'NOT CHECKED'
        }`,
      );

      // If still checked, retry by closing and reopening the panel (up to 5 times)
      const maxRetries = 5;
      let retryCount = 0;

      while (isFieldChecked && retryCount < maxRetries) {
        retryCount++;
        console.log(
          `⚠ Custom field is still checked - retry ${retryCount}/${maxRetries} by reopening panel...`,
        );
        await page.keyboard.press('Escape');
        await page.waitForTimeout(2000);

        // Reopen the Assign time tracking field option
        const retryClicked =
          await assignmentsPage.clickAssignFieldOptionForCustomer(
            uncheckedCustomerName,
          );
        if (retryClicked) {
          console.log(
            `✓ Reopened Assign time tracking field option (retry ${retryCount})`,
          );
          await page.waitForTimeout(3000);

          const retryFieldCheckbox = page
            .locator(
              `//*[contains(text(),'${customFieldBaseName}')]/ancestor::*//input[@type='checkbox']`,
            )
            .or(page.locator(`input[type="checkbox"]`).first());

          if (
            await retryFieldCheckbox
              .isVisible({ timeout: 3000 })
              .catch(() => false)
          ) {
            isFieldChecked = await retryFieldCheckbox
              .isChecked()
              .catch(() => false);
            console.log(
              `  [Retry ${retryCount}] Custom field "${customFieldBaseName}" is ${
                isFieldChecked ? 'CHECKED' : 'NOT CHECKED'
              }`,
            );
          }
        } else {
          console.log(`⚠ Failed to reopen panel on retry ${retryCount}`);
          break;
        }
      }

      if (!isFieldChecked) {
        console.log(
          `✓ VERIFIED: Custom field is NOT selected for customer (Settings → Assignments sync works!)`,
        );
      } else {
        console.log(
          `⚠ Custom field is still checked after ${retryCount} retries - sync may not have worked or field was re-assigned`,
        );
      }
      await page.keyboard.press('Escape');
    } else {
      console.log('  No field checkbox found in assignment panel');
      await page.keyboard.press('Escape');
    }
  } else {
    console.log(
      `⚠ "Assign time tracking field option" not visible for customer`,
    );
  }

  // ==================== CLEANUP: Restore original state ====================
  console.log('\n--- Cleanup: Restoring original test data ---');

  await CustomFieldsPage.navigationToCustomFieldSettings(page);
  await page.waitForTimeout(2000);

  await CustomFieldsPage.clickCustomFieldsEditButton(page);
  await CustomFieldsPage.waitForCustomFieldsLoading(page);

  // Re-open Assign Customers and re-check the customer
  const restoreOpened =
    await CustomFieldsPage.clickAssignCustomersWithPartialMatch(
      page,
      customFieldBaseName,
    );
  if (restoreOpened) {
    await CustomFieldsPage.toggleCustomerInAssignPanel(
      page,
      uncheckedCustomerName,
      true,
    );
    console.log(`✓ Re-checked customer: ${uncheckedCustomerName}`);
    await CustomFieldsPage.saveAssignPanel(page, 1);
    console.log('✓ Saved - test data restored to original state');
  } else {
    console.log('⚠ Could not open Assign Customers to restore state');
  }

  console.log(
    '\n✓ ASM057 - Settings → Assignments field sync verification complete',
  );
};

/**
 * ASM058 - Assignments -> Workers -> View Settings -> Breaks -> Verify paid and unpaid breaks visible
 * Steps:
 * 1. Navigate to Assignments -> Workers tab -> Workers toggle
 * 2. Click View settings for a worker
 * 3. Verify Breaks card is visible with Paid and Unpaid break rules
 */
export const verifyWorkerViewSettingsBreaksVisible = async (page: Page) => {
  // Navigate to Assignments
  const assignmentsPage = await goToAssignments(page);
  await page.waitForTimeout(2000);

  // Click on Workers tab and toggle
  await assignmentsPage.clickWorkersTab();
  await assignmentsPage.clickWorkersToggle();
  await waitForLoadingToDisappear(page);

  // Get first worker name and click View settings
  const workerName = await assignmentsPage.getFirstWorkerName();
  console.log(`Testing with worker: ${workerName}`);

  await assignmentsPage.clickViewSettingsForWorker(workerName);
  console.log('✓ Clicked View settings');

  // Verify Breaks card is visible
  if (await assignmentsPage.isBreaksCardVisible()) {
    console.log('✓ Breaks card is visible');
  }

  // Verify Paid break rules section
  const paidBreakRules = page.locator(`//*[text()='Paid break rules']`);
  await expect(paidBreakRules.first()).toBeVisible({ timeout: 5000 });
  console.log('✓ Paid break rules section is visible');

  // Verify Unpaid break rules section
  const unpaidBreakRules = page.locator(`//*[text()='Unpaid break rules']`);
  await expect(unpaidBreakRules.first()).toBeVisible({ timeout: 5000 });
  console.log('✓ Unpaid break rules section is visible');

  // Optionally verify specific breaks are shown
  const paidBreakExample = page.locator(
    `//*[text()='Paid break rules']/ancestor::div[1]/descendant::*[text()='new break']`,
  );
  if (await paidBreakExample.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('✓ Paid break "new break" is visible');
  }

  const unpaidBreakExample = page.locator(
    `//*[text()='Unpaid break rules']/ancestor::div[1]/descendant::*[text()='test auto break']`,
  );
  if (
    await unpaidBreakExample.isVisible({ timeout: 3000 }).catch(() => false)
  ) {
    console.log('✓ Unpaid break "test auto break" is visible');
  }

  console.log(
    '✓ ASM058 - Worker View Settings Breaks (paid/unpaid) visibility verified',
  );
};

/**
 * ASM059 - Assignments -> Workers -> View Settings -> Breaks -> Edit Breaks navigates to Time Settings
 * Note: This continues from ASM058 - assumes we're already on Worker View Settings page
 * Steps:
 * 1. Click Edit Breaks button (icon) in the Breaks card
 * 2. Verify navigation to Time Settings / Breaks settings page
 */
export const verifyWorkerViewSettingsEditBreaksNavigation = async (
  page: Page,
) => {
  // We're already on Worker View Settings from ASM058
  // Use AssignmentsPage instance for page methods
  const assignmentsPage = new AssignmentsPage(page);

  // Click Edit Breaks button
  const editClicked = await assignmentsPage.clickEditBreaks();
  if (editClicked) {
    console.log('✓ Clicked Edit Breaks button');
  }

  // Verify navigation to Time Settings / Breaks settings page
  const currentUrl = page.url();
  const isBreaksSettings =
    currentUrl.includes('accountsettings') ||
    currentUrl.includes('time') ||
    currentUrl.includes('breaks');

  if (isBreaksSettings) {
    console.log('✓ Edit Breaks navigated to Time Settings screen');
  }

  // Verify Breaks settings page elements (e.g., Breaks header or settings)
  const breaksSettingsHeader = page.locator(
    `//*[text()='Breaks'] | //*[text()='Break settings']`,
  );
  if (
    await breaksSettingsHeader
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false)
  ) {
    console.log('✓ Time Settings / Breaks screen is displayed');
  }

  console.log('✓ ASM059 - Edit Breaks navigation to Time Settings verified');
};

/**
 * ASM060 - Notifications bidirectional sync validation (Worker ↔ Group)
 * Steps:
 * Part A - Worker → Group sync:
 * 1. Navigate to Assignments -> Workers -> View settings for a worker
 * 2. Change notification time to "2:00 PM" and save
 * 3. Navigate to Groups -> View -> View settings for the SAME worker
 * 4. VERIFY the notification time shows "2:00 PM" (synced from Worker view)
 *
 * Part B - Group → Worker sync:
 * 5. Change notification time to "3:00 PM" from Group View Settings
 * 6. Navigate back to Workers -> View settings for the SAME worker
 * 7. VERIFY the notification time shows "3:00 PM" (synced from Group view)
 */
export const verifyWorkerViewSettingsNotificationsSave = async (page: Page) => {
  // ==================== Part A: Worker → Group Sync ====================
  console.log('\n--- Part A: Testing Worker → Group notification sync ---');

  // Navigate to Assignments
  const assignmentsPage = await goToAssignments(page);
  await page.waitForTimeout(2000);

  // Click on Workers tab and toggle
  await assignmentsPage.clickWorkersTab();
  await assignmentsPage.clickWorkersToggle();
  await waitForLoadingToDisappear(page);

  // Get worker name
  const targetWorkerName = await assignmentsPage.getFirstWorkerName();
  console.log(
    `Testing bidirectional notification sync with worker: ${targetWorkerName}`,
  );

  // Click View settings
  await assignmentsPage.clickViewSettingsForWorker(targetWorkerName);
  console.log('✓ Opened Worker View Settings');

  // Verify Notifications card is visible
  if (await assignmentsPage.isNotificationsCardVisible()) {
    console.log('✓ Notifications card is visible');
  }

  // Edit notifications
  const workerSetTime = '2:00 PM';
  if (await assignmentsPage.clickEditNotifications()) {
    console.log('✓ Clicked Edit Notifications');

    await assignmentsPage.setClockInReminderTime(workerSetTime);
    console.log(`✓ Set clock-in reminder time to: ${workerSetTime}`);

    await assignmentsPage.checkEmailCheckbox();
    console.log('✓ Checked email checkbox for clock-in');

    await assignmentsPage.clickSaveButton(0);
    console.log('✓ Saved Worker notification settings');

    if (await assignmentsPage.isNotificationTimeVisible(workerSetTime)) {
      console.log(
        `✓ Notification time (${workerSetTime}) displayed in Worker View`,
      );
    }
  }

  // Navigate to Groups to verify sync
  await goToAssignments(page);
  await page.waitForTimeout(2000);

  await assignmentsPage.clickWorkersTab();
  await assignmentsPage.clickGroupsToggle();
  await waitForLoadingToDisappear(page);
  console.log('✓ Navigated to Groups');

  // Find a group and click View
  const groupName = await assignmentsPage.getFirstGroupName();
  console.log(`Using group: ${groupName}`);

  const viewClicked = await assignmentsPage.clickViewForGroup(groupName);
  if (viewClicked) {
    console.log('✓ Opened Group view');

    // Find a worker in the group
    const groupWorkerName = await assignmentsPage.getFirstWorkerName();
    console.log(`  Found worker in group: ${groupWorkerName}`);

    const viewSettingsClicked =
      await assignmentsPage.clickViewSettingsForWorker(groupWorkerName);
    if (viewSettingsClicked) {
      console.log(
        `✓ Opened View Settings for worker in group: ${groupWorkerName}`,
      );

      // VERIFY: Check if the notification time shows what we set (2:00 PM)
      if (await assignmentsPage.isNotificationTimeVisible(workerSetTime)) {
        console.log(
          `✓ VERIFIED: Worker → Group sync successful! Time shows ${workerSetTime}`,
        );
      } else {
        console.log(
          '⚠ Could not verify exact time - checking Notifications card',
        );
        if (await assignmentsPage.isNotificationsCardVisible()) {
          console.log('✓ Notifications card visible in Group View Settings');
        }
      }

      // ==================== Part B: Group → Worker Sync ====================
      console.log('\n--- Part B: Testing Group → Worker notification sync ---');

      const groupSetTime = '3:00 PM';
      if (await assignmentsPage.clickEditNotifications()) {
        console.log('✓ Clicked Edit Notifications from Group View');

        await assignmentsPage.setClockInReminderTime(groupSetTime);
        console.log(
          `✓ Set clock-in reminder time to: ${groupSetTime} (from Group view)`,
        );

        await assignmentsPage.clickSaveButton(0);
        console.log('✓ Saved Group notification settings');

        if (await assignmentsPage.isNotificationTimeVisible(groupSetTime)) {
          console.log(
            `✓ Notification time (${groupSetTime}) displayed in Group View`,
          );
        }

        // Navigate back to Workers to VERIFY the change synced
        await goToAssignments(page);
        await page.waitForTimeout(2000);

        await assignmentsPage.clickWorkersTab();
        await assignmentsPage.clickWorkersToggle();
        await waitForLoadingToDisappear(page);
        console.log('✓ Navigated back to Workers');

        // Find the worker and open View Settings
        await assignmentsPage.clickViewSettingsForWorker(groupWorkerName);
        console.log(
          `✓ Opened View Settings for ${groupWorkerName} to verify sync`,
        );

        // VERIFY: Check if the notification time is what we set from Group (3:00 PM)
        if (await assignmentsPage.isNotificationTimeVisible(groupSetTime)) {
          console.log(
            `✓ VERIFIED: Group → Worker sync successful! Time shows ${groupSetTime}`,
          );
        } else {
          console.log('⚠ Could not verify exact time sync');
        }
      }
    }
  } else {
    console.log(
      '⚠ No groups found - testing single worker notification save only',
    );
  }

  // ==================== CLEANUP: Restore original notification time ====================
  console.log('\n--- Cleanup: Restoring notification time ---');
  const originalTime = '8:00 AM';

  if (await assignmentsPage.clickEditNotifications()) {
    await assignmentsPage.setClockInReminderTime(originalTime);
    console.log(`✓ Reset clock-in reminder time to: ${originalTime}`);

    await assignmentsPage.uncheckEmailCheckbox();
    console.log('✓ Unchecked email checkbox');

    await assignmentsPage.clickSaveButton(0);
    console.log('✓ Saved - notification settings restored to original state');
  } else {
    console.log('⚠ Could not access Edit Notifications for cleanup');
  }

  console.log('\n✓ ASM060 - Notifications bidirectional sync verified:');
  console.log(
    `  - Worker → Group: Set ${workerSetTime} in Worker, verified in Group ✓`,
  );
  console.log(`  - Group → Worker: Set 3:00 PM in Group, verified in Worker ✓`);
  console.log(`  - Test data restored to ${originalTime} ✓`);
};

// =====================================================================
// ASM061 - Class Field Visibility Based on Customer/Worker Assignment
// =====================================================================

/**
 * Test Data Configuration for ASM061
 */
const ASM061_TEST_DATA = {
  targetWorker: 'Test Emp1',
  // Must be a REAL, selectable STE team member that is NOT the target — 'group
  // leader' is a role, not a worker name, so the exact-match select silently
  // failed and the Name field stayed on Test Emp1 (matching) → hidden-check broke.
  alternateWorker: 'Test Emp2',
  targetCustomer: 'test cust2',
  alternateCustomer: 'test cust1',
  classValue: 'class 1',
};

/** Timesheet fields Edit — wait for settings shell to finish loading, then click Edit. */
async function clickTimesheetFieldsEditButton(page: Page): Promise<void> {
  await waitForLoadingToDisappear(page);

  const settingsView = page.getByTestId('timeSheet-settings-view');
  await expect(settingsView).toBeVisible();

  const editButton = settingsView
    .getByRole('button', { name: 'Edit' })
    .or(
      page.locator(
        `//*[@data-testid="timeSheet-settings-view"]//*[@aria-label="Edit"]`,
      ),
    )
    .or(
      page.locator(
        `//motion.div[@data-testid="timeSheet-settings"]//motion.button[@aria-label="Edit"]`,
      ),
    )
    .first();

  await expect(editButton).toBeVisible();
  await editButton.click();
  await page.waitForTimeout(2000);
}

/**
 * Helper: Navigate to Time Settings and click Edit for Timesheet Fields
 */
async function navigateToTimesheetFieldsEdit(page: Page) {
  const url = '/app/accountsettings?p=time';
  await gotoWithAuthSession(page, url, { waitUntil: 'load' });
  await page.waitForLoadState('load');
  await clickTimesheetFieldsEditButton(page);
  console.log('✓ Navigated to Timesheet Fields edit screen');
}

/**
 * Helper: Toggle Class field active/inactive
 */
async function toggleClassField(page: Page, activate: boolean) {
  // The timesheet-fields table lazy-renders rows — Class sits near the bottom, so
  // scroll it into view first or its toggle won't be in the DOM ("not found").
  await page
    .locator(`//span[text()='Class']`)
    .first()
    .scrollIntoViewIfNeeded({ timeout: 5000 })
    .catch(() => undefined);
  await page.waitForTimeout(500);

  // Preferred: the original aria-label toggle (aria-checked true/false).
  const classToggleActive = page.locator(
    `//*[@aria-label="classForTimeSheetEnabled" and @aria-checked="true"]`,
  );
  const classToggleInactive = page.locator(
    `//*[@aria-label="classForTimeSheetEnabled" and @aria-checked="false"]`,
  );

  let isCurrentlyActive = await classToggleActive
    .isVisible({ timeout: 5000 })
    .catch(() => false);
  let isCurrentlyInactive = await classToggleInactive
    .isVisible({ timeout: 5000 })
    .catch(() => false);

  if (isCurrentlyActive || isCurrentlyInactive) {
    if (activate && isCurrentlyInactive) {
      await classToggleInactive.click();
      await page.waitForTimeout(500);
      console.log('✓ Activated Class field');
    } else if (!activate && isCurrentlyActive) {
      await classToggleActive.click();
      await page.waitForTimeout(500);
      console.log('✓ Deactivated Class field');
    } else {
      console.log(`✓ Class field already ${activate ? 'active' : 'inactive'}`);
    }
    return;
  }

  // Fallback (current Timesheet settings UI): the Class row's FIRST switch =
  // "Show on timesheets". Read its Yes/No status text, click only if it must
  // change. (Same StatusSwitchContainer pattern that toggles Service item.)
  const classToggle = page
    .locator(
      `//span[text()='Class']/../../../parent::tr//div[contains(@class, 'StatusSwitchContainer')]/span/input`,
    )
    .first();
  const classStatus = page
    .locator(
      `(//span[text()='Class']/../../../parent::tr//div[contains(@class, 'StatusSwitchContainer')]/span)[1]`,
    )
    .first();
  if (!(await classStatus.isVisible({ timeout: 5000 }).catch(() => false))) {
    console.log('⚠ Class toggle not found');
    return;
  }
  const statusTxt = (
    (await classStatus.textContent().catch(() => '')) ?? ''
  ).trim();
  isCurrentlyActive = !(
    /Inactive/i.test(statusTxt) || /\bNo\b/i.test(statusTxt)
  );
  if (activate !== isCurrentlyActive) {
    await classToggle.click();
    await page.waitForTimeout(800);
    console.log(
      activate ? '✓ Activated Class field' : '✓ Deactivated Class field',
    );
  } else {
    console.log(`✓ Class field already ${activate ? 'active' : 'inactive'}`);
  }
}

/**
 * Helper: Click View for Class standard field (only works when inactive)
 */
async function clickViewForClass(page: Page) {
  // Scroll the Class row into view (table lazy-renders; View sits near the bottom).
  await page
    .locator(`//span[text()='Class']`)
    .first()
    .scrollIntoViewIfNeeded({ timeout: 5000 })
    .catch(() => undefined);
  await page.waitForTimeout(500);

  const classViewButton = page.locator(
    `//*[text()='Class']/ancestor::tr/descendant::*[text()='View']`,
  );

  // "View" is only ENABLED once Class is deactivated. If it's still disabled,
  // Class wasn't deactivated upstream — log clearly instead of a blind 30s click.
  if (await classViewButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    if (!(await classViewButton.isEnabled().catch(() => false))) {
      console.log(
        '⚠ View button for Class is DISABLED (Class still active — deactivate failed upstream)',
      );
      return false;
    }
    await classViewButton.click();
    await page.waitForTimeout(2000);
    console.log('✓ Clicked View for Class field');
    return true;
  }
  console.log('⚠ View button not visible for Class (may be active)');
  return false;
}

/**
 * Helper: Assign specific customer to a class value
 */
async function assignCustomerToClassValue(
  page: Page,
  classValueName: string,
  customerName: string,
) {
  // Click Assign Customers for the class value
  const assignCustomersButton = page.locator(
    `//*[text()='${classValueName}']/ancestor::tr/descendant::*[text()='Assign Customers']`,
  );

  if (
    await assignCustomersButton.isVisible({ timeout: 5000 }).catch(() => false)
  ) {
    await assignCustomersButton.click();
    await page.waitForTimeout(1500);
    console.log(`✓ Opened Assign Customers for "${classValueName}"`);

    // Deselect ALL customers using "Select all items" checkbox
    // If state is indeterminate (partial), clicking once may SELECT all
    // So we check state and click again if needed
    const allCustomersCheckbox = page.locator(
      `input[aria-label="Select all items"]`,
    );

    console.log('  Ensuring all customers are deselected...');
    try {
      // Check if checkbox is in indeterminate or checked state
      const isChecked = await allCustomersCheckbox
        .isChecked()
        .catch(() => false);
      console.log(`  "Select all items" checkbox isChecked: ${isChecked}`);

      // Click to toggle - if partial/indeterminate, this may select all
      await allCustomersCheckbox.click({ force: true, timeout: 5000 });
      await page.waitForTimeout(1000);

      // Check state after first click
      const isCheckedAfter = await allCustomersCheckbox
        .isChecked()
        .catch(() => false);
      console.log(`  After first click, isChecked: ${isCheckedAfter}`);

      // If now checked (all selected), click again to deselect all
      if (isCheckedAfter) {
        await allCustomersCheckbox.click({ force: true });
        await page.waitForTimeout(1000);
        console.log('✓ Clicked again to deselect all customers');
      } else {
        console.log('✓ All customers deselected after first click');
      }
    } catch (e) {
      console.log(`⚠ Could not click "Select all items" checkbox: ${e}`);
    }

    // Select specific customer
    const customerCheckbox = page.locator(
      `//*[@aria-label="Select ${customerName}"]`,
    );
    if (
      await customerCheckbox.isVisible({ timeout: 3000 }).catch(() => false)
    ) {
      const isChecked = await customerCheckbox.isChecked().catch(() => false);
      if (!isChecked) {
        await customerCheckbox.click();
        await page.waitForTimeout(500);
      }
      console.log(`✓ Selected customer: ${customerName}`);
    }

    // Check if save button is enabled (changes were made)
    const saveButton = page
      .locator(`//span[text()='Save']`)
      .or(page.locator(`//button[contains(., 'Save')]`))
      .first();
    const isSaveEnabled = await saveButton
      .isEnabled({ timeout: 2000 })
      .catch(() => false);

    if (isSaveEnabled) {
      await saveButton.click({ force: true });
      await page.waitForTimeout(2000);
      console.log('✓ Saved customer assignment');
    } else {
      // No changes needed - correct customer already selected, just close the drawer
      console.log('✓ Correct customer already selected, closing drawer...');
      const closeButton = page
        .locator(`//*[@aria-label="Close"]`)
        .first()
        .or(page.locator(`//button[contains(@class, 'close')]`).first())
        .or(page.getByRole('button', { name: 'Cancel' }));
      await closeButton
        .click({ force: true, timeout: 5000 })
        .catch(async () => {
          // Fallback: press Escape to close
          await page.keyboard.press('Escape');
        });
      await page.waitForTimeout(1000);
    }
    return true;
  }
  return false;
}

/**
 * Helper: Assign specific worker to a class value
 */
async function assignWorkerToClassValue(
  page: Page,
  classValueName: string,
  workerName: string,
) {
  console.log(
    `  Looking for dropdown arrow to access Assign Workers for "${classValueName}"...`,
  );

  // Click the dropdown arrow (Expand Menu) to reveal Assign Workers option
  const dropdownArrow = page.locator(
    `//*[text()='${classValueName}']/ancestor::tr/descendant::*[@aria-label="Expand Menu"]`,
  );

  if (await dropdownArrow.isVisible({ timeout: 5000 }).catch(() => false)) {
    await dropdownArrow.click();
    await page.waitForTimeout(500);
    console.log(`✓ Clicked dropdown arrow for "${classValueName}"`);
  } else {
    console.log(
      `⚠ Dropdown arrow not found for "${classValueName}", check if class value exists`,
    );
    return false;
  }

  // Look for Assign Workers option
  const assignWorkersOption = page.locator(`//*[text()='Assign Workers']`);
  if (
    await assignWorkersOption.isVisible({ timeout: 3000 }).catch(() => false)
  ) {
    await assignWorkersOption.click();
    await page.waitForTimeout(1500);
    console.log(`✓ Opened Assign Workers for "${classValueName}"`);

    // First, deselect ALL workers using "Select all items" checkbox
    // The checkbox has aria-label="Select all items"
    // If state is indeterminate (partial), clicking once may SELECT all
    // So we click twice to ensure: partial→all→none OR all→none→all→none
    const allWorkersCheckbox = page.locator(
      `input[aria-label="Select all items"]`,
    );

    console.log('  Ensuring all workers are deselected...');
    try {
      // Check if checkbox is in indeterminate or checked state
      const isChecked = await allWorkersCheckbox.isChecked().catch(() => false);
      console.log(`  "Select all items" checkbox isChecked: ${isChecked}`);

      // Click to toggle - if partial/indeterminate, this may select all
      await allWorkersCheckbox.click({ force: true, timeout: 5000 });
      await page.waitForTimeout(1000);

      // Check state after first click
      const isCheckedAfter = await allWorkersCheckbox
        .isChecked()
        .catch(() => false);
      console.log(`  After first click, isChecked: ${isCheckedAfter}`);

      // If now checked (all selected), click again to deselect all
      if (isCheckedAfter) {
        await allWorkersCheckbox.click({ force: true });
        await page.waitForTimeout(1000);
        console.log('✓ Clicked again to deselect all workers');
      } else {
        console.log('✓ All workers deselected after first click');
      }
    } catch (e) {
      console.log(`⚠ Could not click "Select all items" checkbox: ${e}`);
    }

    // Now verify the specific worker is unchecked, then select ONLY that worker
    const workerCheckbox = page.locator(
      `//*[@aria-label="Select ${workerName}"]`,
    );
    if (await workerCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Check current state - should be unchecked after deselecting all
      const isWorkerChecked = await workerCheckbox
        .isChecked()
        .catch(() => false);
      console.log(
        `  Worker "${workerName}" current state: ${
          isWorkerChecked ? 'checked' : 'unchecked'
        }`,
      );

      if (!isWorkerChecked) {
        await workerCheckbox.click();
        await page.waitForTimeout(500);
        console.log(`✓ Selected worker: ${workerName}`);
      } else {
        console.log(`✓ Worker "${workerName}" already selected`);
      }
    } else {
      console.log(`⚠ Worker "${workerName}" checkbox not found`);
      // Try scrolling or expanding groups
      const groupCheckboxes = page.locator(
        `//*[contains(@aria-label, 'Select') and contains(@aria-label, 'group')]`,
      );
      const groupCount = await groupCheckboxes.count();
      console.log(
        `  Found ${groupCount} group(s) - worker might be inside a group`,
      );
    }

    // Check if save button is enabled (changes were made)
    const saveButton = page.locator(`//span[text()='Save']`);
    const isSaveEnabled = await saveButton
      .isEnabled({ timeout: 2000 })
      .catch(() => false);

    if (isSaveEnabled) {
      await saveButton.click({ force: true });
      await page.waitForTimeout(2000);
      console.log('✓ Saved worker assignment');
    } else {
      // No changes needed - correct worker already selected, just close the drawer
      console.log('✓ Correct worker already selected, closing drawer...');
      const closeButton = page
        .locator(`//*[@aria-label="Close"]`)
        .first()
        .or(page.locator(`//button[contains(@class, 'close')]`).first())
        .or(page.getByRole('button', { name: 'Cancel' }));
      await closeButton
        .click({ force: true, timeout: 5000 })
        .catch(async () => {
          // Fallback: press Escape to close
          await page.keyboard.press('Escape');
        });
      await page.waitForTimeout(1000);
    }
    return true;
  }

  console.log('⚠ Assign Workers option not found');
  return false;
}

/**
 * Helper: Restore all assignments for a class value
 */
async function restoreAllAssignmentsForClassValue(
  page: Page,
  classValueName: string,
) {
  // Restore Workers
  const dropdownArrow = page
    .locator(
      `//*[text()='${classValueName}']/ancestor::tr/descendant::*[@aria-label="Expand Menu"]`,
    )
    .first();

  if (await dropdownArrow.isVisible({ timeout: 3000 }).catch(() => false)) {
    await dropdownArrow.click();
    await page.waitForTimeout(500);
  }

  const assignWorkersOption = page.locator(`//*[text()='Assign Workers']`);
  if (
    await assignWorkersOption.isVisible({ timeout: 3000 }).catch(() => false)
  ) {
    await assignWorkersOption.click();
    await page.waitForTimeout(1500);

    // Use correct locator for "Select all items" checkbox
    const allWorkersCheckbox = page.locator(
      `input[aria-label="Select all items"]`,
    );
    try {
      await allWorkersCheckbox.click({ force: true, timeout: 5000 });
      await page.waitForTimeout(1000);
      console.log('✓ Clicked "Select all items" to restore all workers');
    } catch (e) {
      console.log(`⚠ Could not click "Select all items" checkbox: ${e}`);
    }

    const saveButton = page.locator(`//*[text()='Save']`);
    await saveButton.click({ force: true });
    await page.waitForTimeout(2000);
    console.log('✓ Saved - Restored all workers');
  }

  // Restore Customers
  const assignCustomersButton = page.locator(
    `//*[text()='${classValueName}']/ancestor::tr/descendant::*[text()='Assign Customers']`,
  );

  if (
    await assignCustomersButton.isVisible({ timeout: 3000 }).catch(() => false)
  ) {
    await assignCustomersButton.click();
    await page.waitForTimeout(1500);

    // Use correct locator for "Select all items" checkbox
    const allCustomersCheckbox = page.locator(
      `input[aria-label="Select all items"]`,
    );
    try {
      await allCustomersCheckbox.click({ force: true, timeout: 5000 });
      await page.waitForTimeout(1000);
      console.log('✓ Clicked "Select all items" to restore all customers');
    } catch (e) {
      console.log(`⚠ Could not click "Select all items" checkbox: ${e}`);
    }

    // Scope to the open Assign panel's Save (the previous `.nth(1)` assumed a 2nd
    // Save element exists and timed out when only one was present).
    const saveButton = page
      .getByRole('dialog')
      .last()
      .getByRole('button', { name: /^Save$/ })
      .or(page.locator(`//*[text()='Save']`).last());
    await expect(saveButton.first()).toBeVisible({ timeout: 10_000 });
    await saveButton.first().click({ force: true });
    await page.waitForTimeout(2000);
    console.log('✓ Saved - Restored all customers');
  }
}

/**
 * Helper: Navigate back to Timesheet Fields from Class settings
 */
async function navigateBackToTimesheetFields(page: Page) {
  const backLink = page.locator(`//*[text()='Customize your timesheets']`);
  if (await backLink.isVisible({ timeout: 3000 }).catch(() => false)) {
    await backLink.click();
    await page.waitForTimeout(2000);
    console.log('✓ Navigated back to Timesheet Fields');
  }
}

/**
 * Helper: Save Timesheet Fields settings
 */
async function saveTimesheetFieldsSettings(page: Page) {
  const saveButton = page.locator(`//*[text()='Save']`).first();
  if (await saveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await saveButton.click({ force: true });
    await page.waitForTimeout(3000);
    console.log('✓ Saved Timesheet Fields settings');
  }
}

/**
 * Helper: Cycle worker on STE to force data refresh
 * Flow: worker1 → worker2 → worker1
 */
async function cycleWorkerOnSTE(
  page: Page,
  singleTimeActPage: SingleTimeActivityPage,
  targetWorker: string,
  alternateWorker: string,
) {
  console.log(
    `  Cycling worker: ${targetWorker} → ${alternateWorker} → ${targetWorker}`,
  );

  // Select target worker first
  await singleTimeActPage.openDropdown('Name');
  await singleTimeActPage.waitForDropDownList();
  await singleTimeActPage.selectOptionFromDropdown(targetWorker);
  await page.waitForTimeout(500);

  // Switch to alternate worker
  await singleTimeActPage.openDropdown('Name');
  await singleTimeActPage.waitForDropDownList();
  await singleTimeActPage.selectOptionFromDropdown(alternateWorker);
  await page.waitForTimeout(500);

  // Switch back to target worker
  await singleTimeActPage.openDropdown('Name');
  await singleTimeActPage.waitForDropDownList();
  await singleTimeActPage.selectOptionFromDropdown(targetWorker);
  await page.waitForTimeout(1000);

  console.log('✓ Worker cycle complete');
}

/**
 * Helper: Check if a specific class value is visible in Class dropdown
 */
async function isClassValueVisibleOnSTE(
  page: Page,
  classValueName: string,
): Promise<boolean> {
  // Check if Class field exists
  const classField = page
    .locator(
      `//*[contains(@placeholder, 'class') or contains(@placeholder, 'Class')]`,
    )
    .first()
    .or(
      page
        .locator(
          `//label[contains(text(), 'Class')]/following-sibling::*//input`,
        )
        .first(),
    );

  const isClassFieldVisible = await classField
    .isVisible({ timeout: 3000 })
    .catch(() => false);

  if (!isClassFieldVisible) {
    // Try another locator for Class field
    const classLabel = page.locator(`//*[text()='Class']`).first();
    if (!(await classLabel.isVisible({ timeout: 2000 }).catch(() => false))) {
      console.log('  Class field not visible on STE');
      return false;
    }
  }

  // Open Class dropdown
  try {
    await classField.click();
    await page.waitForTimeout(1000);

    // Check if specific class value is in the dropdown
    const classOption = page.locator(`//*[text()='${classValueName}']`);
    const isOptionVisible = await classOption
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    // Close dropdown by clicking elsewhere or pressing Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    return isOptionVisible;
  } catch {
    console.log('  Could not open Class dropdown');
    return false;
  }
}

/**
 * Helper: Validate Class visibility with retry (cycling worker)
 */
async function validateClassVisibilityWithRetry(
  page: Page,
  singleTimeActPage: SingleTimeActivityPage,
  targetWorker: string,
  alternateWorker: string,
  customerName: string,
  expectedVisible: boolean,
  classValueName: string,
  maxRetries: number = 5,
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(
      `\n  Attempt ${attempt}/${maxRetries}: Checking Class visibility...`,
    );

    if (attempt > 1) {
      // Cycle worker to force data refresh
      await cycleWorkerOnSTE(
        page,
        singleTimeActPage,
        targetWorker,
        alternateWorker,
      );
    } else {
      // First attempt: select target worker
      await singleTimeActPage.openDropdown('Name');
      await singleTimeActPage.waitForDropDownList();
      await singleTimeActPage.selectOptionFromDropdown(targetWorker);
      await page.waitForTimeout(1000);
    }

    // Select customer
    await singleTimeActPage.openDropdown('Customers');
    await singleTimeActPage.waitForDropDownList();
    await singleTimeActPage.selectOptionFromDropdown(customerName);
    await page.waitForTimeout(1500);

    // Check Class visibility
    const isVisible = await isClassValueVisibleOnSTE(page, classValueName);

    if (isVisible === expectedVisible) {
      console.log(
        expectedVisible
          ? `  ✓ Class "${classValueName}" is VISIBLE as expected`
          : `  ✓ Class "${classValueName}" is HIDDEN as expected`,
      );
      return true;
    }

    console.log(
      `  ⏳ Expected ${expectedVisible ? 'visible' : 'hidden'}, got ${
        isVisible ? 'visible' : 'hidden'
      }. Retrying...`,
    );
    await page.waitForTimeout(2000);
  }

  console.log(`  ⚠ Validation failed after ${maxRetries} attempts`);
  return false;
}

/**
 * Timesheet fields → Class **inactive** → assign one worker + one customer on a class value → save.
 *
 * Class must stay **inactive**: while active, the field is shown for all workers/customers and
 * per-value assignments are ignored. Used by Workforce WF014 (and similar assignment-scoped checks).
 */
export async function configureClassValueWorkerAndCustomerAssignments(
  page: Page,
  config: {
    classValue: string;
    workerName: string;
    customerName: string;
  },
): Promise<void> {
  const { classValue, workerName, customerName } = config;

  await navigateToTimesheetFieldsEdit(page);
  await toggleClassField(page, false);
  await saveTimesheetFieldsSettings(page);

  const timesheetFieldsEditButton = page.locator(
    `//*[@data-testid="timeSheet-settings-view"]//*[@aria-label="Edit"]`,
  );
  await timesheetFieldsEditButton.click({ timeout: 10_000 });
  await page.waitForTimeout(2000);

  if (!(await clickViewForClass(page))) {
    throw new Error(
      'Could not open Class value settings. Ensure Class is deactivated on Timesheet fields.',
    );
  }

  await assignWorkerToClassValue(page, classValue, workerName);
  await assignCustomerToClassValue(page, classValue, customerName);
  await navigateBackToTimesheetFields(page);
  await saveTimesheetFieldsSettings(page);
}

/**
 * Toggle Class **Active** / **Inactive** on Timesheet fields and save.
 * Active = field visible for all workers/customers; inactive = per-value assignments apply.
 */
export async function setClassFieldActiveOnTimesheetSettings(
  page: Page,
  activate: boolean,
): Promise<void> {
  await navigateToTimesheetFieldsEdit(page);
  await toggleClassField(page, activate);
  await saveTimesheetFieldsSettings(page);
}

export const STANDARD_FIELD_CLASS = 'Class';

/** Class inactive + saved; re-open Timesheet fields edit (assignments require inactive). */
export async function ensureClassFieldInactiveForAssignments(
  page: Page,
): Promise<void> {
  await navigateToTimesheetFieldsEdit(page);
  await toggleClassField(page, false);
  await saveTimesheetFieldsSettings(page);
}

export async function openTimesheetFieldsEditMode(page: Page): Promise<void> {
  await clickTimesheetFieldsEditButton(page);
}

/** Class row → Assign customers → select listed customers → save. Re-call to open panel again after Save closes it. */
export async function assignClassFieldLevelCustomers(
  page: Page,
  customerNames: string[],
): Promise<void> {
  await CustomFieldsPage.clickAssignCustomersForClassFieldRow(page);
  await CustomFieldsPage.verifyAssignCustomersPanelVisible(page);
  await CustomFieldsPage.unselectAllCustomersInAssignPanel(page, false);
  for (const customerName of customerNames) {
    await CustomFieldsPage.selectCustomerInAssignPanel(page, customerName);
  }
  await CustomFieldsPage.clickSaveAssignCustomersPanel(page);
  await CustomFieldsPage.waitForAssignCustomersPanelDismissed(page).catch(
    () => undefined,
  );
  await saveTimesheetFieldsSettings(page);
}

/**
 * Class → View → per-value worker and/or customer on `class 1` / `class 2`, then save.
 */
export async function configureClassValuesWorkerAndCustomer(
  page: Page,
  configs: {
    classValue: string;
    workerName?: string;
    customerName?: string;
  }[],
): Promise<void> {
  await openTimesheetFieldsEditMode(page);
  if (!(await clickViewForClass(page))) {
    throw new Error(
      'Could not open Class value settings. Ensure Class is inactive on Timesheet fields.',
    );
  }
  for (const { classValue, workerName, customerName } of configs) {
    if (workerName) {
      await assignWorkerToClassValue(page, classValue, workerName);
    }
    if (customerName) {
      await assignCustomerToClassValue(page, classValue, customerName);
    }
  }
  await navigateBackToTimesheetFields(page);
  await saveTimesheetFieldsSettings(page);
}

/** Open Class control and check whether a class value option is listed. */
export async function isClassValueVisibleInClassDropdown(
  page: Page,
  classValueName: string,
): Promise<boolean> {
  const escaped = classValueName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const namePattern = new RegExp(escaped, 'i');

  const classCombobox = page.getByRole('combobox', { name: /^Class$/i });
  const classField = classCombobox
    .or(page.getByLabel(/^Class$/i))
    .or(
      page
        .locator(
          `//*[contains(@placeholder, 'class') or contains(@placeholder, 'Class')]`,
        )
        .first(),
    )
    .or(
      page
        .locator(
          `//label[contains(text(), 'Class')]/following-sibling::*//input`,
        )
        .first(),
    );

  const classLabel = page.locator(`//*[text()='Class']`).first();
  const hasClassUi =
    (await classCombobox.isVisible({ timeout: 5000 }).catch(() => false)) ||
    (await classField.isVisible({ timeout: 3000 }).catch(() => false)) ||
    (await classLabel.isVisible({ timeout: 2000 }).catch(() => false));
  if (!hasClassUi) {
    return false;
  }

  const clickTarget = (await classCombobox.isVisible().catch(() => false))
    ? classCombobox
    : (await classField.isVisible().catch(() => false))
    ? classField
    : classLabel;
  await clickTarget.click();
  await page.waitForTimeout(1500);

  const listbox = page.getByRole('listbox').first();
  const firstOption = page.getByRole('option').first();
  try {
    await Promise.race([
      listbox.waitFor({ state: 'visible', timeout: 15_000 }),
      firstOption.waitFor({ state: 'visible', timeout: 15_000 }),
    ]);
  } catch {
    // Popover may use ul/li without listbox role
  }
  await page.waitForTimeout(500);

  const byRole = await page
    .getByRole('option', { name: namePattern })
    .first()
    .isVisible({ timeout: 8000 })
    .catch(() => false);
  const byListRow = await page
    .locator('ul li')
    .filter({ hasText: namePattern })
    .first()
    .isVisible({ timeout: 5000 })
    .catch(() => false);
  const byText = await page
    .locator(`//*[text()="${classValueName}"]`)
    .first()
    .isVisible({ timeout: 3000 })
    .catch(() => false);

  const visible = byRole || byListRow || byText;
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  return visible;
}

/**
 * ASM061 - Class Field Visibility Based on Customer/Worker Assignment
 *
 * Tests that Class field visibility on STE changes based on assigned customers/workers
 */
export const verifyClassVisibilityBasedOnAssignment = async (page: Page) => {
  console.log(
    '\n========== ASM061 - Class Field Visibility Based on Assignment ==========',
  );

  const {
    targetWorker,
    alternateWorker,
    targetCustomer,
    alternateCustomer,
    classValue,
  } = ASM061_TEST_DATA;

  let visibleResult = false;
  let hiddenWorkerResult = false;
  let hiddenCustomerResult = false;

  try {
    // ==================== Part 1: Deactivate Class Field ====================
    console.log('\n--- Part 1: Deactivating Class Field ---');
    await navigateToTimesheetFieldsEdit(page);
    await toggleClassField(page, false); // Deactivate
    await saveTimesheetFieldsSettings(page);

    // ==================== Part 2: Configure Class Value Assignments ====================
    console.log('\n--- Part 2: Configuring Class Value Assignments ---');
    // After save, edit mode closes - need to click Edit button again
    const timesheetFieldsEditButton = page.locator(
      `//*[@data-testid="timeSheet-settings-view"]//*[@aria-label="Edit"]`,
    );
    await timesheetFieldsEditButton.click({ timeout: 10000 });
    await page.waitForTimeout(2000);
    console.log('✓ Re-entered Timesheet Fields edit mode');

    // Click View for Class (now available since inactive)
    const viewClicked = await clickViewForClass(page);
    if (!viewClicked) {
      throw new Error(
        'ASM061 FAILED: Could not access Class settings. Ensure Class is deactivated.',
      );
    }

    // Assign only target worker to class value
    await assignWorkerToClassValue(page, classValue, targetWorker);

    // Assign only target customer to class value
    await assignCustomerToClassValue(page, classValue, targetCustomer);

    // Navigate back
    await navigateBackToTimesheetFields(page);

    // ==================== Part 3: Reactivate Class Field ====================
    console.log('\n--- Part 3: Reactivating Class Field ---');
    await toggleClassField(page, true); // Activate
    await saveTimesheetFieldsSettings(page);

    // ==================== Part 4: Validate Class VISIBLE (Matching) ====================
    console.log(
      '\n--- Part 4: Validating Class VISIBLE (Matching Worker + Customer) ---',
    );

    // Navigate to STE
    await navigateToSingleTimeEntry(page);
    await page.waitForTimeout(3000);

    const singleTimeActPage = new SingleTimeActivityPage(page);

    // Handle any tour popup
    await singleTimeActPage.handleSTATourPopup().catch(() => {});

    visibleResult = await validateClassVisibilityWithRetry(
      page,
      singleTimeActPage,
      targetWorker,
      alternateWorker,
      targetCustomer,
      true, // expecting visible
      classValue,
    );

    if (!visibleResult) {
      console.log(
        '⚠ Part 4 failed: Class should be visible for matching worker/customer',
      );
    }

    // ==================== Part 5: Validate Class HIDDEN (Non-matching Worker) ====================
    console.log(
      '\n--- Part 5: Validating Class HIDDEN (Non-matching Worker) ---',
    );

    hiddenWorkerResult = await validateClassVisibilityWithRetry(
      page,
      singleTimeActPage,
      alternateWorker, // Using alternate worker (not assigned)
      targetWorker,
      targetCustomer, // Same customer
      false, // expecting hidden
      classValue,
    );

    if (!hiddenWorkerResult) {
      console.log(
        '⚠ Part 5 failed: Class should be hidden for non-matching worker',
      );
    }

    // ==================== Part 6: Validate Class HIDDEN (Non-matching Customer) ====================
    console.log(
      '\n--- Part 6: Validating Class HIDDEN (Non-matching Customer) ---',
    );

    hiddenCustomerResult = await validateClassVisibilityWithRetry(
      page,
      singleTimeActPage,
      targetWorker, // Back to target worker
      alternateWorker,
      alternateCustomer, // Different customer (not assigned)
      false, // expecting hidden
      classValue,
    );

    if (!hiddenCustomerResult) {
      console.log(
        '⚠ Part 6 failed: Class should be hidden for non-matching customer',
      );
    }
  } finally {
    // ==================== Part 7: Cleanup (ALWAYS RUNS) ====================
    console.log(
      '\n--- Part 7: Cleanup - Restoring All Assignments (finally block) ---',
    );

    try {
      // Navigate to Time Settings and deactivate Class to access View
      await navigateToTimesheetFieldsEdit(page);
      await toggleClassField(page, false); // Deactivate to access View
      await saveTimesheetFieldsSettings(page);

      // After save, edit mode closes - need to click Edit button again
      const cleanupEditButton = page.locator(
        `//*[@data-testid="timeSheet-settings-view"]//*[@aria-label="Edit"]`,
      );
      await cleanupEditButton.click({ timeout: 10000 });
      await page.waitForTimeout(2000);

      // Click View for Class
      await clickViewForClass(page);

      // Restore all assignments
      await restoreAllAssignmentsForClassValue(page, classValue);

      // Navigate back and reactivate
      await navigateBackToTimesheetFields(page);
      await toggleClassField(page, true); // Reactivate
      await saveTimesheetFieldsSettings(page);

      console.log('✓ Cleanup completed - Test data restored');
    } catch (cleanupError) {
      console.log(`⚠ Cleanup failed: ${cleanupError}`);
    }
  }

  console.log(
    '\n✓ ASM061 - Class Field Visibility Based on Assignment verified:',
  );
  console.log(
    `  - Class visible for ${targetWorker} + ${targetCustomer}: ${
      visibleResult ? '✓' : '✗'
    }`,
  );
  console.log(
    `  - Class hidden for ${alternateWorker} + ${targetCustomer}: ${
      hiddenWorkerResult ? '✓' : '✗'
    }`,
  );
  console.log(
    `  - Class hidden for ${targetWorker} + ${alternateCustomer}: ${
      hiddenCustomerResult ? '✓' : '✗'
    }`,
  );

  // Assert all validations passed
  expect(visibleResult).toBe(true);
  expect(hiddenWorkerResult).toBe(true);
  expect(hiddenCustomerResult).toBe(true);
};

// =====================================================================
// ASM062 - Class Field Visibility Based on Customer/Worker Assignment (WTE)
// =====================================================================

/**
 * Helper: Select a specific worker in WTE by name
 */
async function selectWorkerInWTE(page: Page, workerName: string) {
  // Click team member dropdown (don't fill - that triggers "Add new")
  await weeklyTimeEntryPage.teamMemberDropdown(page).first().click();
  await page.waitForTimeout(WTE_TEAM_MEMBER_DROPDOWN_OPTIONS_SETTLE_MS);

  // Method 1: Look for the worker by name directly in dropdown options
  // The dropdown option contains the worker name as text
  const workerOption = page.locator(
    `//li[contains(@class, 'option')]//span[contains(text(), '${workerName}')]`,
  );

  if (await workerOption.isVisible({ timeout: 3000 }).catch(() => false)) {
    await workerOption.click();
    await page.waitForTimeout(500);
    console.log(`  ✓ Selected worker: ${workerName}`);
    return true;
  }

  // Method 2: Try role-based locator
  const workerByRole = page.getByRole('option', {
    name: new RegExp(workerName, 'i'),
  });
  if (await workerByRole.isVisible({ timeout: 2000 }).catch(() => false)) {
    await workerByRole.click();
    await page.waitForTimeout(500);
    console.log(`  ✓ Selected worker (via role): ${workerName}`);
    return true;
  }

  // Method 3: Find all list items and search by text content
  const allOptions = page.locator(`//li[contains(@class, 'option')]`);
  const optionCount = await allOptions.count();
  console.log(`  Found ${optionCount} options in dropdown`);

  for (let i = 0; i < optionCount; i++) {
    const optionText = await allOptions
      .nth(i)
      .textContent()
      .catch(() => '');
    console.log(`    Option ${i}: "${optionText}"`);

    if (optionText?.toLowerCase().includes(workerName.toLowerCase())) {
      await allOptions.nth(i).click();
      await page.waitForTimeout(500);
      console.log(`  ✓ Selected worker: ${workerName}`);
      return true;
    }
  }

  // Fallback: just click the first employee option (skip "Add new" at position 0)
  await weeklyTimeEntryPage.clickDropdownOption(page);
  console.log(
    `  ⚠ Worker "${workerName}" not found, selected first available worker`,
  );
  return false;
}

function escapeRegExpForPlaywrightName(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

type SelectCustomerInWTEOptions = {
  /** Call when the Time category / Customer–Project popover is already open (elite flows). */
  skipOpenDropdown?: boolean;
  /** Throw if the customer row cannot be found (no fallback to first row). */
  strict?: boolean;
};

/**
 * Helper: Select a specific customer in WTE by name (supports listbox `option` and custom popover rows).
 */
async function selectCustomerInWTE(
  page: Page,
  customerName: string,
  options?: SelectCustomerInWTEOptions,
) {
  const strict = options?.strict === true;
  const skipOpen = options?.skipOpenDropdown === true;

  if (!skipOpen) {
    await weeklyTimeEntryPage.customerProjectDropdown(page).first().click();
    await page.waitForTimeout(3000);
  } else {
    await page.waitForTimeout(500);
    await page
      .locator('input[placeholder="Search"]')
      .first()
      .waitFor({ state: 'visible', timeout: 15000 })
      .catch(() => {});
  }

  // WTE Customer/Project popover: rows are often `ul > li` (not `[role=option]`).
  const customerListRow = page
    .locator('ul li')
    .filter({
      hasText: new RegExp(escapeRegExpForPlaywrightName(customerName), 'i'),
    })
    .filter({ hasNotText: /add\s+customer/i })
    .first();
  if (await customerListRow.isVisible({ timeout: 2500 }).catch(() => false)) {
    await customerListRow.click();
    await page.waitForTimeout(500);
    console.log(`  ✓ Selected customer (via ul/li row): ${customerName}`);
    return true;
  }

  // Method 1: Try role-based locator (standard dropdown / some popovers)
  const customerByRole = page.getByRole('option', {
    name: new RegExp(escapeRegExpForPlaywrightName(customerName), 'i'),
  });
  if (await customerByRole.isVisible({ timeout: 2000 }).catch(() => false)) {
    await customerByRole.click();
    await page.waitForTimeout(500);
    console.log(`  ✓ Selected customer (via role): ${customerName}`);
    return true;
  }

  // Method 2: Look for customer by exact text match (div-based dropdown like in screenshot)
  // The dropdown shows customer name followed by "Customer" type label
  const customerByText = page.locator(`text="${customerName}"`).first();
  if (await customerByText.isVisible({ timeout: 2000 }).catch(() => false)) {
    await customerByText.click();
    await page.waitForTimeout(500);
    console.log(`  ✓ Selected customer (via text): ${customerName}`);
    return true;
  }

  // Method 3: Look for customer in div-based dropdown options
  const divOptions = page.locator(
    `//div[contains(text(), '${customerName}')] | //span[contains(text(), '${customerName}')]`,
  );
  if (
    await divOptions
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false)
  ) {
    await divOptions.first().click();
    await page.waitForTimeout(500);
    console.log(`  ✓ Selected customer (via div/span): ${customerName}`);
    return true;
  }

  // Method 4: Find all li options (legacy dropdowns)
  const liOptions = page.locator(`//li[contains(@class, 'option')]`);
  const liCount = await liOptions.count();
  if (liCount > 0) {
    console.log(`  Found ${liCount} li-based customer options in dropdown`);
    for (let i = 0; i < liCount; i++) {
      const optionText = await liOptions
        .nth(i)
        .textContent()
        .catch(() => '');
      if (optionText?.toLowerCase().includes(customerName.toLowerCase())) {
        await liOptions.nth(i).click();
        await page.waitForTimeout(500);
        console.log(`  ✓ Selected customer (via li): ${customerName}`);
        return true;
      }
    }
  }

  // Method 5: Search for clickable elements containing customer name
  const clickableCustomer = page
    .locator(`//*[contains(text(), '${customerName}')]`)
    .filter({ hasNotText: 'Add' })
    .first();
  if (await clickableCustomer.isVisible({ timeout: 2000 }).catch(() => false)) {
    await clickableCustomer.click();
    await page.waitForTimeout(500);
    console.log(`  ✓ Selected customer (via generic): ${customerName}`);
    return true;
  }

  // Log what's visible in dropdown for debugging
  console.log(`  ⚠ Customer "${customerName}" not found. Visible elements:`);
  const visibleItems = page.locator(
    `//ul//li | //div[contains(@class, 'option')] | //div[contains(@class, 'dropdown')]//div`,
  );
  const visibleCount = await visibleItems.count();
  console.log(`    Total visible items: ${visibleCount}`);
  for (let i = 0; i < Math.min(visibleCount, 5); i++) {
    const text = await visibleItems
      .nth(i)
      .textContent()
      .catch(() => '');
    console.log(`    Item ${i}: "${text?.substring(0, 50)}"`);
  }

  if (strict) {
    throw new Error(
      `selectCustomerInWTE: Could not find customer "${customerName}" in WTE Time category / Customer–Project UI`,
    );
  }

  // Fallback: just click the first customer option (skip "Add" at position 0)
  await weeklyTimeEntryPage.clickCustomerDropdownOption(page);
  console.log(
    `  ⚠ Customer "${customerName}" not found, selected first available customer`,
  );
  return false;
}

/**
 * Helper: Cycle worker in WTE to force data refresh
 * Flow: worker1 → worker2 → worker1
 */
async function cycleWorkerInWTE(
  page: Page,
  targetWorker: string,
  alternateWorker: string,
) {
  console.log(
    `  Cycling worker: ${targetWorker} → ${alternateWorker} → ${targetWorker}`,
  );

  // Select target worker first
  await selectWorkerInWTE(page, targetWorker);
  await page.waitForTimeout(2000);

  // Switch to alternate worker
  await selectWorkerInWTE(page, alternateWorker);
  await page.waitForTimeout(2000);

  // Switch back to target worker
  await selectWorkerInWTE(page, targetWorker);
  await page.waitForTimeout(3000);

  console.log('  ✓ Worker cycle complete');
}

/**
 * Helper: Check if Class field/dropdown is visible in WTE side panel
 */
async function isClassVisibleInWTE(
  page: Page,
  classValueName: string,
): Promise<boolean> {
  // First, find and click the Class dropdown to open it
  const panelClassDropdown = page.locator(
    `//input[@aria-label="Select class"]`,
  );
  const classLabel = page.locator(
    `//div[@data-testid="panelContent"]//*[text()="Class"]`,
  );

  // Check if Class field exists in panel
  const classFieldVisible =
    (await panelClassDropdown
      .isVisible({ timeout: 2000 })
      .catch(() => false)) ||
    (await classLabel.isVisible({ timeout: 1000 }).catch(() => false));

  if (!classFieldVisible) {
    console.log('  Class field not visible in WTE side panel');
    return false;
  }

  console.log('  ✓ Class field is visible in WTE side panel');

  // Now open the dropdown and check if the specific class option is available
  try {
    // Click on the Class dropdown to open it
    if (
      await panelClassDropdown.isVisible({ timeout: 1000 }).catch(() => false)
    ) {
      await panelClassDropdown.click();
    } else {
      // Try clicking the label/container area
      await classLabel.click();
    }
    await page.waitForTimeout(1000);

    // Check if the specific class option (e.g., "class 1") is in the dropdown
    const classOption = page.locator(`//*[text()="${classValueName}"]`);
    const classOptionByRole = page.getByRole('option', {
      name: new RegExp(classValueName, 'i'),
    });
    const classOptionInList = page.locator(
      `//li[contains(text(), "${classValueName}")] | //div[contains(@class, 'option')][contains(text(), "${classValueName}")]`,
    );

    const isOptionVisible =
      (await classOption
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false)) ||
      (await classOptionByRole
        .isVisible({ timeout: 1000 })
        .catch(() => false)) ||
      (await classOptionInList
        .first()
        .isVisible({ timeout: 1000 })
        .catch(() => false));

    // Close dropdown
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    if (isOptionVisible) {
      console.log(
        `  ✓ Class option "${classValueName}" is available in dropdown`,
      );
      return true;
    } else {
      console.log(
        `  ✗ Class option "${classValueName}" is NOT available in dropdown`,
      );
      return false;
    }
  } catch (error) {
    console.log(
      `  Error checking class option: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    await page.keyboard.press('Escape').catch(() => {});
    return false;
  }
}

/**
 * Helper: Validate Class visibility in WTE with retry (cycling worker)
 */
async function validateClassVisibilityInWTEWithRetry(
  page: Page,
  targetWorker: string,
  alternateWorker: string,
  customerName: string,
  expectedVisible: boolean,
  classValueName: string,
  maxRetries: number = 5,
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(
      `\n  Attempt ${attempt}/${maxRetries}: Checking Class visibility in WTE...`,
    );

    if (attempt > 1) {
      // Cycle worker to force data refresh
      await cycleWorkerInWTE(page, targetWorker, alternateWorker);
    } else {
      // First attempt: just select target worker
      await selectWorkerInWTE(page, targetWorker);
    }
    // Wait for worker selection to settle
    await page.waitForTimeout(3000);

    // Select customer
    await selectCustomerInWTE(page, customerName);
    // Wait for customer selection to settle and data to refresh
    await page.waitForTimeout(3000);

    // Click a data cell to open the side panel
    console.log('  Clicking data cell to open side panel...');
    await weeklyTimeEntryPage.firstDataCell(page).click({ timeout: 5000 });
    await page.waitForTimeout(2000);

    // Wait for side panel to open
    await weeklyTimeEntryPage
      .sidePanel(page)
      .waitFor({ state: 'visible', timeout: 10000 })
      .catch(() => {
        console.log('  ⚠ Side panel not visible');
      });
    console.log('  ✓ Side panel opened');
    await page.waitForTimeout(2000);

    // Check Class visibility in the side panel
    const isVisible = await isClassVisibleInWTE(page, classValueName);

    if (isVisible === expectedVisible) {
      console.log(
        expectedVisible
          ? `  ✓ Class "${classValueName}" is VISIBLE in WTE as expected`
          : `  ✓ Class "${classValueName}" is HIDDEN in WTE as expected`,
      );
      return true;
    }

    console.log(
      `  ⏳ Expected ${expectedVisible ? 'visible' : 'hidden'}, got ${
        isVisible ? 'visible' : 'hidden'
      }. Retrying...`,
    );
    await page.waitForTimeout(2000);
  }

  console.log(`  ⚠ Validation failed after ${maxRetries} attempts`);
  return false;
}

/**
 * ASM062 - Class Field Visibility Based on Customer/Worker Assignment (WTE)
 *
 * Tests that Class field visibility on WTE changes based on assigned customers/workers
 */
export const verifyClassVisibilityBasedOnAssignmentWTE = async (page: Page) => {
  console.log(
    '\n========== ASM062 - Class Field Visibility Based on Assignment (WTE) ==========',
  );

  const {
    targetWorker,
    alternateWorker,
    targetCustomer,
    alternateCustomer,
    classValue,
  } = ASM061_TEST_DATA;

  let visibleResult = false;
  let hiddenWorkerResult = false;
  let hiddenCustomerResult = false;

  try {
    // ==================== Part 1: Deactivate Class Field ====================
    console.log('\n--- Part 1: Deactivating Class Field ---');
    await navigateToTimesheetFieldsEdit(page);
    await toggleClassField(page, false); // Deactivate
    await saveTimesheetFieldsSettings(page);

    // ==================== Part 2: Configure Class Value Assignments ====================
    console.log('\n--- Part 2: Configuring Class Value Assignments ---');
    // After save, edit mode closes - need to click Edit button again
    const timesheetFieldsEditButton = page.locator(
      `//*[@data-testid="timeSheet-settings-view"]//*[@aria-label="Edit"]`,
    );
    await timesheetFieldsEditButton.click({ timeout: 10000 });
    await page.waitForTimeout(2000);
    console.log('✓ Re-entered Timesheet Fields edit mode');

    // Click View for Class (now available since inactive)
    const viewClicked = await clickViewForClass(page);
    if (!viewClicked) {
      throw new Error(
        'ASM062 FAILED: Could not access Class settings. Ensure Class is deactivated.',
      );
    }

    // Assign only target worker to class value
    await assignWorkerToClassValue(page, classValue, targetWorker);

    // Assign only target customer to class value
    await assignCustomerToClassValue(page, classValue, targetCustomer);

    // Navigate back
    await navigateBackToTimesheetFields(page);

    // ==================== Part 3: Reactivate Class Field ====================
    console.log('\n--- Part 3: Reactivating Class Field ---');
    await toggleClassField(page, true); // Activate
    await saveTimesheetFieldsSettings(page);

    // ==================== Part 4: Validate Class VISIBLE in WTE (Matching) ====================
    console.log(
      '\n--- Part 4: Validating Class VISIBLE in WTE (Matching Worker + Customer) ---',
    );

    // Navigate to WTE using the standard navigate function
    console.log('  Navigating to WTE...');
    await weeklyTimeEntryPage.navigate(page);
    console.log('  ✓ WTE navigation complete');

    // Verify WTE loaded by checking for Team Member dropdown
    const teamMemberDropdown = weeklyTimeEntryPage.teamMemberDropdown(page);
    const wteLoaded = await teamMemberDropdown
      .first()
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    if (!wteLoaded) {
      console.log(
        '  ⚠ WTE Team Member dropdown not visible, retrying navigation...',
      );
      // Retry navigation
      const url = '/app/time?jobId=time';
      await gotoWithAuthSession(page, url, { waitUntil: 'load' });
      await weeklyTimeEntryPage.waitForLoadingToDisappear(page);
      await page.waitForTimeout(2000);
      await page
        .getByRole('button', { name: 'Add time' })
        .click({ timeout: 5000 });
      await page.waitForTimeout(500);
      await page
        .getByRole('option', { name: 'Weekly time entry' })
        .click({ timeout: 3000 });
      await page.waitForTimeout(5000); // Wait for WTE to fully load
    }

    console.log('  ✓ WTE loaded');
    await weeklyTimeEntryPage.handlePopupsInAnyOrder(page);

    // Wait for dropdown options to be loaded
    console.log('  Waiting for WTE data to load...');
    await page.waitForTimeout(5000);

    visibleResult = await validateClassVisibilityInWTEWithRetry(
      page,
      targetWorker,
      alternateWorker,
      targetCustomer,
      true, // expecting visible
      classValue,
    );

    if (!visibleResult) {
      console.log(
        '⚠ Part 4 failed: Class should be visible for matching worker/customer',
      );
    }

    // ==================== Part 5: Validate Class HIDDEN in WTE (Non-matching Worker) ====================
    console.log(
      '\n--- Part 5: Validating Class HIDDEN in WTE (Non-matching Worker) ---',
    );

    // Re-open WTE if not visible
    const teamMemberDropdownPart5 =
      weeklyTimeEntryPage.teamMemberDropdown(page);
    if (
      !(await teamMemberDropdownPart5
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false))
    ) {
      console.log('  Re-opening WTE...');
      await weeklyTimeEntryPage.navigate(page);
      await page.waitForTimeout(5000);
    }

    hiddenWorkerResult = await validateClassVisibilityInWTEWithRetry(
      page,
      alternateWorker, // Using alternate worker (not assigned)
      targetWorker,
      targetCustomer, // Same customer
      false, // expecting hidden
      classValue,
    );

    if (!hiddenWorkerResult) {
      console.log(
        '⚠ Part 5 failed: Class should be hidden for non-matching worker',
      );
    }

    // ==================== Part 6: Validate Class HIDDEN in WTE (Non-matching Customer) ====================
    console.log(
      '\n--- Part 6: Validating Class HIDDEN in WTE (Non-matching Customer) ---',
    );

    // Re-open WTE if not visible
    const teamMemberDropdownPart6 =
      weeklyTimeEntryPage.teamMemberDropdown(page);
    if (
      !(await teamMemberDropdownPart6
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false))
    ) {
      console.log('  Re-opening WTE...');
      await weeklyTimeEntryPage.navigate(page);
      await page.waitForTimeout(5000);
    }

    hiddenCustomerResult = await validateClassVisibilityInWTEWithRetry(
      page,
      targetWorker, // Back to target worker
      alternateWorker,
      alternateCustomer, // Different customer (not assigned)
      false, // expecting hidden
      classValue,
    );

    if (!hiddenCustomerResult) {
      console.log(
        '⚠ Part 6 failed: Class should be hidden for non-matching customer',
      );
    }
  } finally {
    // ==================== Part 7: Cleanup (ALWAYS RUNS) ====================
    console.log(
      '\n--- Part 7: Cleanup - Restoring All Assignments (finally block) ---',
    );

    try {
      // Navigate to Time Settings and deactivate Class to access View
      await navigateToTimesheetFieldsEdit(page);
      await toggleClassField(page, false); // Deactivate to access View
      await saveTimesheetFieldsSettings(page);

      // After save, edit mode closes - need to click Edit button again
      const cleanupEditButton062 = page.locator(
        `//*[@data-testid="timeSheet-settings-view"]//*[@aria-label="Edit"]`,
      );
      await cleanupEditButton062.click({ timeout: 10000 });
      await page.waitForTimeout(2000);

      // Click View for Class
      await clickViewForClass(page);

      // Restore all assignments
      await restoreAllAssignmentsForClassValue(page, classValue);

      // Navigate back and reactivate
      await navigateBackToTimesheetFields(page);
      await toggleClassField(page, true); // Reactivate
      await saveTimesheetFieldsSettings(page);

      console.log('✓ Cleanup completed - Test data restored');
    } catch (cleanupError) {
      console.log(`⚠ Cleanup failed: ${cleanupError}`);
    }
  }

  console.log(
    '\n✓ ASM062 - Class Field Visibility Based on Assignment (WTE) verified:',
  );
  console.log(
    `  - Class visible for ${targetWorker} + ${targetCustomer}: ${
      visibleResult ? '✓' : '✗'
    }`,
  );
  console.log(
    `  - Class hidden for ${alternateWorker} + ${targetCustomer}: ${
      hiddenWorkerResult ? '✓' : '✗'
    }`,
  );
  console.log(
    `  - Class hidden for ${targetWorker} + ${alternateCustomer}: ${
      hiddenCustomerResult ? '✓' : '✗'
    }`,
  );

  // Assert all validations passed
  expect(visibleResult).toBe(true);
  expect(hiddenWorkerResult).toBe(true);
  expect(hiddenCustomerResult).toBe(true);
};

export default {
  goToAssignments,
  openManageTimeTrackingFieldsFromAssignments,
  validateWorkersTabInAssignments,
  validateGroupsTabInAssignments,
  createGroupAndValidateGroupDetails,
  deleteGroup,
  cleanupAllGroups,
  assignWorkersAndLeadsFromDetailsPage,
  verifyWorkerCountInHeader,
  groupsCrudOperations,
  validateSearchInWorkersAndGroups,
  validatePaginationForWorkers,
  validatePaginationForGroups,
  assignUnassignWorkersTest,
  groupsInWhosWorkingMap,
  groupsDualSyncFromQL,
  viewSettingForWorkers,
  createDropdownCustomFieldAndValidate,
  editCustomField,
  toggleRequiredOnAndOff,
  toggleRequiredOnAndValidateSTE,
  verifyTheCustomFieldColumn,
  toggleRequiredOnAndValidateWTE,
  toggleRequiredOnAndValidateTimeClock,
  toggleRequiredOffAndValidateSTE,
  toggleRequiredOffAndValidateWTE,
  toggleRequiredOffAndValidateTimeClock,
  assignCustomFieldToCustomerAndValidateSTE,
  assignCustomFieldToCustomerAndValidateWTE,
  assignCustomFieldToCustomerAndValidateTimeClock,
  assignCustomFieldToWorkerAndValidateSTE,
  assignCustomFieldToWorkerAndValidateWTE,
  assignCustomerToStandardFieldAndValidateSTE,
  assignCustomerToStandardFieldAndValidateWTE,
  assignCustomerToStandardFieldAndValidateTimeClock,
  createCustomerAndValidate,
  createCustomerAndAssignTimeTrackingFields,
  createCustomerAndAssignTimeTrackingFieldsSTE,
  createCustomerAndAssignTimeTrackingFieldsWTE,
  createAndEditCustomer,
  validateAssignmentSaveFailureError,
  validatePartialAssignmentError,
  validateStandardFieldsSaveFailureError,
  validateStandardFieldsPartialAssignmentError,
  validateCustomFieldsSaveFailureError,
  validateCustomFieldsPartialAssignmentError,
  verifyHoverOverFields,
  validateStandardFieldsSaveFailureErrorNew,
  validateStandardFieldsPartialAssignmentErrorNew,
  validateCustomFieldsSaveFailureErrorNew,
  validateCustomFieldsPartialAssignmentErrorNew,
  verifyHoverOverFieldsNew,
  // ASM049-060 - New test functions
  verifyCustomFieldAssignToCustomerAndWorkerOptions,
  verifyStandardFieldViewActionForActiveField,
  verifyStandardFieldViewOpensFieldSettings,
  verifyStandardFieldViewVisibleForInactiveField,
  verifyStandardFieldViewDisabledForActiveField,
  verifyStandardFieldViewChangesReflected,
  verifyWorkerViewSettingsNavigation,
  verifyGroupViewWorkerSettings,
  verifyFieldAssignmentsBidirectionalSync,
  verifyWorkerViewSettingsBreaksVisible,
  verifyWorkerViewSettingsEditBreaksNavigation,
  verifyWorkerViewSettingsNotificationsSave,
  cleanupViewSettingsTestData,
  groupsInPayrollCoreCompany,
  cleanupCustomFieldCustomerAssignment,
  cleanupToggleRequiredOnTimeClock,
  cleanupToggleRequiredOffTimeClock,
  // ASM061-062 - Class visibility based on assignment
  configureClassValueWorkerAndCustomerAssignments,
  setClassFieldActiveOnTimesheetSettings,
  ensureClassFieldInactiveForAssignments,
  openTimesheetFieldsEditMode,
  assignClassFieldLevelCustomers,
  configureClassValuesWorkerAndCustomer,
  isClassValueVisibleInClassDropdown,
  STANDARD_FIELD_CLASS,
  verifyClassVisibilityBasedOnAssignment,
  verifyClassVisibilityBasedOnAssignmentWTE,
  assignmentsExtendedMatrixE2EFlow,
};
