import { Locator, Page, expect } from '@playwright/test';
import OvertimePolicyPage from '../../../pages/OvertimePolicyPage';
import TimeSettingsPage, {
  clickEditApprovalsSection,
  clickNotifEditButton,
  clickResetMessage,
  navigateToAccountAndSettingsTime,
  saveApprovalSettings,
  scrollToBottom,
  scrollToGeofenceReminder,
  toggleGeofenceDay,
  updateGeofenceEndTime,
  updateGeofenceStartTime,
  verifyApprovalsSectionInSettings,
  verifyApprovalsSectionVisible,
  verifySubmissionSectionVisible,
  waitForLoadingToDisappear,
} from '../../../pages/TimeSettingsPage';
import { LoginCredentials } from '../../../config/types';
import { AccountMatrix, resolveMatrixAccounts } from './accountMatrix';
import {
  DashboardAccount,
  validateDashboard,
} from '../../../pages/FastPipeline/DashboardPage';
import { verifyOvertimeSectionVisible } from '../OvertimePolicy.util';

const DEFAULT_POLICY_MEMBER = 'Test Emp1';
const TEAM_SUBMIT_LABEL = 'Team members can review and submit their time';
const FULL_WEEK_LABEL = 'Require submission for a full week';
const CUSTOM_MESSAGE_LABEL = 'Message when team members submit time (custom)';
const DEFAULT_CUSTOM_MESSAGE =
  'By submitting your timesheets you agree that they are complete and accurate.';
const TEST_CUSTOM_MESSAGE = 'TT01 test custom approval message';

const NOTIFY_DROPDOWN_OPTIONS = [
  'Admins and Managers',
  'Admins only',
  'Managers only',
  'None',
] as const;

const REMINDER_AM_TIMES = ['8:15 AM', '9:15 AM', '10:15 AM', '11:15 AM'];
const REMINDER_PM_TIMES = [
  '1:15 PM',
  '2:15 PM',
  '3:15 PM',
  '4:15 PM',
  '5:30 PM',
];
const NOTIFICATION_DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function pickRandomReminderTime(): string {
  const pool = Math.random() > 0.5 ? REMINDER_AM_TIMES : REMINDER_PM_TIMES;
  return pickRandom(pool);
}

function pickRandomEmailMobilePattern(): { email: boolean; mobile: boolean } {
  const patterns = [
    { email: true, mobile: false },
    { email: false, mobile: true },
    { email: true, mobile: true },
  ];
  return pickRandom(patterns);
}

function pickRandomSubset(
  items: readonly string[],
  min = 2,
  max = 4,
): string[] {
  const count = Math.min(
    items.length,
    min + Math.floor(Math.random() * (max - min + 1)),
  );
  return [...items].sort(() => Math.random() - 0.5).slice(0, count);
}

async function selectTimeInReminderSection(
  page: Page,
  testId: string,
  time: string,
  label?: string,
): Promise<void> {
  const notifEdit = page.getByTestId('notifications-settings-edit');
  const section = notifEdit.getByTestId(testId);
  const input = label
    ? notifEdit.getByLabel(label)
    : section.locator('input[data-testid="__textField"]');

  if (await section.isVisible({ timeout: 3000 }).catch(() => false)) {
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeVisible({ timeout: 10000 });
    await section.locator('input[data-testid="__textField"]').click();
  } else {
    await input.scrollIntoViewIfNeeded();
    await expect(input).toBeVisible({ timeout: 10000 });
    await input.click();
  }

  await page.waitForTimeout(500);
  const option = page.getByRole('option', { name: time, exact: true });
  await expect(option).toBeVisible({ timeout: 5000 });
  await option.click();
}

/** Email/mobile checkbox order inside notifications edit (matches TimeSettingsPage). */
const NOTIFICATION_CHANNEL_INDEX: Record<string, number> = {
  'clk-in-email': 0,
  'clk-in-mobile': 1,
  'clk-out-email': 2,
  'clk-out-mobile': 3,
};

async function setNotificationChannelChecked(
  page: Page,
  testId: string,
  checked: boolean,
): Promise<void> {
  const index = NOTIFICATION_CHANNEL_INDEX[testId];
  const notifEdit = page.getByTestId('notifications-settings-edit');
  const checkbox =
    index !== undefined
      ? notifEdit.locator(`input[type='checkbox']`).nth(index)
      : page.getByTestId(testId).getByRole('checkbox');
  await checkbox.scrollIntoViewIfNeeded();
  await expect(checkbox).toBeVisible();
  if (checked && !(await checkbox.isChecked())) {
    await checkbox.check();
  }
  if (!checked && (await checkbox.isChecked())) {
    await checkbox.uncheck();
  }
}

async function verifyDaysRemindersDropdownEnabled(
  page: Page,
  enabled: boolean,
): Promise<void> {
  const daysInput = page
    .getByTestId('notifications-settings-edit')
    .locator('input[aria-label="notificationEnabledForDays"]');
  await expect(daysInput).toBeVisible();
  if (enabled) {
    await expect(daysInput).toBeEnabled();
  } else {
    await expect(daysInput).toBeDisabled();
  }
}

async function verifyDaysRemindersLabel(page: Page): Promise<void> {
  const notifEdit = page.getByTestId('notifications-settings-edit');
  await expect(
    notifEdit.getByText('Days reminders are sent', { exact: true }),
  ).toBeVisible();
  await expect(
    notifEdit.locator('input[aria-label="notificationEnabledForDays"]'),
  ).toBeVisible();
}

async function selectNotificationDays(
  page: Page,
  days: string[],
): Promise<void> {
  const daysInput = page
    .getByTestId('notifications-settings-edit')
    .locator('input[aria-label="notificationEnabledForDays"]');
  await daysInput.scrollIntoViewIfNeeded();
  await daysInput.click();
  await page.waitForTimeout(500);

  for (const day of days) {
    const option = page.getByRole('option', { name: day, exact: true });
    await expect(option).toBeVisible({ timeout: 5000 });
    const checked = (await option.getAttribute('aria-checked')) === 'true';
    if (!checked) {
      await option.click();
    }
  }
  await page.keyboard.press('Escape');
}

async function selectNotifyDropdownOption(
  page: Page,
  testId: string,
  option: string,
): Promise<void> {
  const section = page
    .getByTestId('notifications-settings-edit')
    .getByTestId(testId);
  await expect(section).toBeVisible();
  const input = section.locator('input').first();
  await input.click();
  await page.waitForTimeout(300);
  await page.getByRole('option', { name: option, exact: true }).click();
}

async function verifyNotifyDropdownDefault(
  page: Page,
  testId: string,
  label: string,
  defaultOption: string,
): Promise<void> {
  const section = page
    .getByTestId('notifications-settings-edit')
    .getByTestId(testId);
  await expect(section.getByText(label, { exact: true })).toBeVisible();
  const input = section.locator('input').first();
  await input.click();
  await page.waitForTimeout(300);
  const option = page.getByRole('option', { name: defaultOption, exact: true });
  await expect(option).toBeVisible({ timeout: 5000 });
  await page.keyboard.press('Escape');
}

async function exerciseNotifyDropdownOptions(
  page: Page,
  testId: string,
): Promise<void> {
  for (const option of NOTIFY_DROPDOWN_OPTIONS) {
    await selectNotifyDropdownOption(page, testId, option);
    await page.waitForTimeout(200);
  }
}

/** Approvals reminder block inside Notifications edit (not Approvals settings). */
function notificationsApprovalsSection(page: Page): Locator {
  return page
    .getByTestId('notifications-settings-edit')
    .locator('#notifications-approvals-subsection');
}

async function selectManagerReminderFrequencyInNotifications(
  section: Locator,
  frequency: 'DAY_OF_WEEK' | 'PAYROLL_CLOSE_DATE',
): Promise<void> {
  const radio = section.locator(
    `input[name="managerReminderBasedOn"][value="${frequency}"]`,
  );
  await expect(radio).toBeVisible({ timeout: 15000 });
  await radio.check();
  await expect(radio).toBeChecked();
}

async function ensureManagerReminderCheckboxChecked(
  section: Locator,
  labelFragment: string,
): Promise<void> {
  const checkbox = section
    .locator(`//span[contains(text(),"${labelFragment}")]/..//input`)
    .first();
  await expect(checkbox).toBeVisible({ timeout: 15000 });
  if (!(await checkbox.isChecked())) {
    await checkbox.check();
  }
}

async function setNotificationsApprovalsReminderDropdowns(
  section: Locator,
  page: Page,
  reminderText: string,
  time: string,
  day: string,
): Promise<void> {
  const row = section.locator('[class*="ApprovalContent"]').filter({
    hasText: reminderText,
  });
  await expect(row).toBeVisible({ timeout: 15000 });

  const timeDropdown = row
    .getByText('Reminder time', { exact: true })
    .locator('xpath=following::div[contains(@class, "Dropdown")][1]');
  await timeDropdown.click();
  await page.getByRole('option', { name: time, exact: true }).click();

  const dayDropdown = row
    .getByText('Reminder day', { exact: true })
    .locator('xpath=following::div[contains(@class, "Dropdown")][1]');
  await dayDropdown.click();
  await page.getByRole('option', { name: day, exact: true }).click();
}

async function configureApprovalManagerRemindersDayOfWeek(
  page: Page,
): Promise<void> {
  const approvalsSection = notificationsApprovalsSection(page);
  await approvalsSection.scrollIntoViewIfNeeded();
  await expect(
    approvalsSection.getByText('Remind managers to approve time', {
      exact: true,
    }),
  ).toBeVisible();

  await selectManagerReminderFrequencyInNotifications(
    approvalsSection,
    'DAY_OF_WEEK',
  );

  await ensureManagerReminderCheckboxChecked(
    approvalsSection,
    "Remind when managers have not approved their team's timesheets for the current week",
  );
  await ensureManagerReminderCheckboxChecked(
    approvalsSection,
    "Remind when managers have not approved their team's timesheets for the prior week",
  );
  await setNotificationsApprovalsReminderDropdowns(
    approvalsSection,
    page,
    "Remind when managers have not approved their team's timesheets for the current week",
    '2:00 PM',
    'Monday',
  );
  await setNotificationsApprovalsReminderDropdowns(
    approvalsSection,
    page,
    "Remind when managers have not approved their team's timesheets for the prior week",
    '3:00 PM',
    'Friday',
  );
}

async function configureApprovalManagerRemindersPayPeriod(
  page: Page,
): Promise<void> {
  const approvalsSection = notificationsApprovalsSection(page);
  await approvalsSection.scrollIntoViewIfNeeded();

  await selectManagerReminderFrequencyInNotifications(
    approvalsSection,
    'PAYROLL_CLOSE_DATE',
  );

  await ensureManagerReminderCheckboxChecked(
    approvalsSection,
    'Remind during set time from the payroll close date',
  );
  await setNotificationsApprovalsReminderDropdowns(
    approvalsSection,
    page,
    'Remind during set time from the payroll close date',
    '10:00 AM',
    '1 day after payroll close',
  );

  const notApprovedCheckbox = approvalsSection
    .locator(
      `//span[contains(text(),"Remind when managers have not approved their team members")]/..//input`,
    )
    .first();
  if (await notApprovedCheckbox.isVisible().catch(() => false)) {
    if (!(await notApprovedCheckbox.isChecked())) {
      await notApprovedCheckbox.check();
    }
    await setNotificationsApprovalsReminderDropdowns(
      approvalsSection,
      page,
      "Remind when managers have not approved their team members' time by the payroll close date",
      '4:00 PM',
      '2 days after payroll close',
    );
  }
}

async function configureGeofenceNotificationsIfVisible(
  page: Page,
): Promise<void> {
  const geofenceHeader = page.getByText('Geofence', { exact: true });
  if (!(await geofenceHeader.isVisible().catch(() => false))) {
    console.log('   ℹ Geofence section not visible — skipping');
    return;
  }

  await scrollToGeofenceReminder(page);
  await updateGeofenceStartTime(page, '9:00 AM');
  await updateGeofenceEndTime(page, '5:00 PM');
  await toggleGeofenceDay(page, 'Monday');
  await toggleGeofenceDay(page, 'Tuesday');
  console.log('   ✓ Geofence start/end time and days of week configured');
}

async function configureOvertimeRecipientCheckboxes(
  block: Locator,
  suffix: 'day' | 'week',
): Promise<void> {
  const recipients = [
    {
      email: `overtime-admin-email-${suffix}`,
      mobile: `overtime-admin-mobile-${suffix}`,
    },
    {
      email: `overtime-group-leads-email-${suffix}`,
      mobile: `overtime-group-leads-mobile-${suffix}`,
    },
    {
      email: `overtime-employees-email-${suffix}`,
      mobile: `overtime-employees-mobile-${suffix}`,
    },
  ];

  for (const recipient of recipients) {
    const checkEmail = Math.random() > 0.33;
    const checkMobile = Math.random() > 0.33;
    const emailCb = block.locator(`[aria-label="${recipient.email}"]`);
    const mobileCb = block.locator(`[aria-label="${recipient.mobile}"]`);

    if (await emailCb.isVisible().catch(() => false)) {
      if (checkEmail) {
        await emailCb.check();
      } else {
        await emailCb.uncheck();
      }
    }
    if (await mobileCb.isVisible().catch(() => false)) {
      if (checkMobile) {
        await mobileCb.check();
      } else {
        await mobileCb.uncheck();
      }
    }
  }
}

async function configureOvertimePeriodAlerts(
  page: Page,
  overtimePage: OvertimePolicyPage,
  period: 'Daily' | 'Weekly',
): Promise<void> {
  const suffix = period === 'Daily' ? 'day' : 'week';
  await overtimePage.setOvertimeNotificationPeriodChecked(period, true);

  const block = page.locator('[class*="OvertimeEditPeriodRuleBlock"]').filter({
    has: page.locator(`[aria-label="overtime-threshold-hours-${suffix}"]`),
  });
  await expect(block).toBeVisible({ timeout: 10000 });
  await expect(
    block.getByText('Send alert when users meet or exceed'),
  ).toBeVisible();
  await expect(
    block.getByText('After threshold is crossed, send'),
  ).toBeVisible();
  await expect(block.getByText('Send alerts to:')).toBeVisible();

  await block
    .locator(`[aria-label="overtime-threshold-hours-${suffix}"]`)
    .fill('8');
  await block
    .locator(`[aria-label="overtime-threshold-minutes-${suffix}"]`)
    .fill('30');
  await block
    .locator(`[aria-label="overtime-total-alerts-${suffix}"]`)
    .fill('2');
  await block
    .locator(`[aria-label="overtime-alert-interval-${suffix}"]`)
    .fill('60');

  await configureOvertimeRecipientCheckboxes(block, suffix);
  console.log('   ✓ Configured %s overtime alert options', period);
}

async function configureBasicRulesMonFriDaily8Double16(
  page: Page,
  overtimePage: OvertimePolicyPage,
): Promise<void> {
  const configureHeading = page.getByText('Configure your overtime rules');
  await expect(configureHeading).toBeVisible();
  await configureHeading.scrollIntoViewIfNeeded();

  // Double time (daily) requires a "Double Overtime Pay" pay type on the account.
  await overtimePage.ensureDailyCheckedAndDoubleDailyUnchecked();
  await overtimePage.clickWizardNext();
}

async function dismissOvertimeWizardContinueIfPresent(
  page: Page,
): Promise<void> {
  const continueSpan = page.locator(`//span[text()="Continue"]`);
  if (await continueSpan.isVisible().catch(() => false)) {
    await continueSpan.click();
  }
  const saveSpan = page.locator(`//span[text()="Save"]`);
  if (await saveSpan.isVisible().catch(() => false)) {
    await saveSpan.click();
  }
}

async function uncheckDefaultOvertimePolicyOnEditReview(
  page: Page,
  overtimePage: OvertimePolicyPage,
): Promise<void> {
  const editPolicyDetails = page.getByRole('button', {
    name: 'Edit policy details',
  });
  if (await editPolicyDetails.isVisible({ timeout: 5000 }).catch(() => false)) {
    await overtimePage.clickEditPolicyDetailsButton();
  }

  const defaultCheckbox = page.getByRole('checkbox', {
    name: /default overtime policy/i,
  });
  if (
    (await defaultCheckbox.count()) > 0 &&
    (await defaultCheckbox.isChecked())
  ) {
    await defaultCheckbox.uncheck();
  }

  const saveChanges = page.getByRole('button', { name: 'Save changes' });
  if (await saveChanges.isVisible().catch(() => false)) {
    await overtimePage.clickSaveChangesButton();
    return;
  }
  await overtimePage.clickWizardNext();
}

async function createOvertimePolicyWithBasicRules(
  page: Page,
  overtimePage: OvertimePolicyPage,
  createdPolicies: string[],
): Promise<string> {
  const policyName = `TTPolicy${1000 + Math.floor(Math.random() * 9000)}`;

  await overtimePage.clickSetUpOvertimePolicies();

  // Steps 1–2: policy name + default overtime policy checkbox.
  await overtimePage.fillPolicyNameAndDefault(policyName, true);
  console.log('   ✓ Entered policy name and checked default overtime policy');

  // Step 3: Use Basic Rules.
  await overtimePage.selectOvertimeRuleTypeAndClick('Use Basic Rules');
  await expect(page.getByText('Configure your overtime rules')).toBeVisible();
  console.log('   ✓ Selected Use Basic Rules');

  // Step 4: Daily Mon–Fri @ 8 hrs; Double time Mon–Fri @ 16 hrs → Next.
  await configureBasicRulesMonFriDaily8Double16(page, overtimePage);
  console.log(
    '   ✓ Configured basic overtime rules (Daily only, no double time)',
  );

  // Step 5: Assign policy members → Next.
  await overtimePage.selectPolicyMemberAndClickNext(DEFAULT_POLICY_MEMBER);
  await overtimePage.ReassignWorkersModalPopup();
  console.log('   ✓ Assigned policy members');

  // Step 6: Review overtime policy → Create policy.
  await overtimePage.expectReviewPolicyDetailsWithSelectedData(policyName);
  await overtimePage.clickCreatePolicy();
  await page.waitForTimeout(2000);
  await dismissOvertimeWizardContinueIfPresent(page);
  await overtimePage.expectPolicyNameVisibleInManageTable(policyName);
  createdPolicies.push(policyName);
  console.log('   ✓ Created overtime policy: %s', policyName);
  return policyName;
}

async function openOvertimePolicyEditReview(
  page: Page,
  overtimePage: OvertimePolicyPage,
  policyName: string,
): Promise<void> {
  await overtimePage.clickEditDropdownEdit(policyName);
  const editOvertimeBtn = page.getByRole('button', {
    name: 'Edit overtime policy',
  });
  if (await editOvertimeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await editOvertimeBtn.click();
  }
  await expect(
    page.getByText('Overtime policy details', { exact: true }),
  ).toBeVisible({ timeout: 15000 });
}

async function editOvertimePolicyOnReview(
  page: Page,
  overtimePage: OvertimePolicyPage,
  policyName: string,
): Promise<void> {
  await openOvertimePolicyEditReview(page, overtimePage, policyName);
  console.log('   ✓ Opened edit overtime policy wizard');

  // Review → Edit policy details → uncheck default → Save changes.
  await uncheckDefaultOvertimePolicyOnEditReview(page, overtimePage);
  await overtimePage.expectPolicyNameVisibleInManageTable(policyName);
  console.log('   ✓ Edited overtime policy (unchecked default on review)');
}

async function deleteOvertimePolicyAndVerify(
  page: Page,
  overtimePage: OvertimePolicyPage,
  policyName: string,
  createdPolicies: string[],
): Promise<void> {
  await overtimePage.deletePolicyFromManageTable(policyName);
  await overtimePage.expectPolicyNameNotInManageTable(policyName);
  const idx = createdPolicies.indexOf(policyName);
  if (idx >= 0) {
    createdPolicies.splice(idx, 1);
  }
  console.log(
    '   ✓ Deleted overtime policy and verified removal: %s',
    policyName,
  );
}

// ============================================================================
// TT01 — Time Settings (Approvals + Notifications + Overtime) Full Suite
// ============================================================================

export interface TTEntitlements {
  canViewApprovalSettings: boolean;
  canEditApprovalSettings: boolean;
  canViewNotifications: boolean;
  canEditNotifications: boolean;
  canViewOvertimePolicies: boolean;
  canManageOvertimePolicies: boolean;
}

export interface TTTestAccount {
  credentials: LoginCredentials;
  role: 'admin' | 'manager' | 'employee' | 'vendor';
  companyType?: 'elite' | 'premium' | 'ies' | 'standard';
  region?: 'us' | 'ca';
  entitlements: TTEntitlements;
}

export interface TTMatrixAccount {
  testId: string;
  account: TTTestAccount;
}

function asDashboardAccount(account: TTTestAccount): DashboardAccount {
  return { role: account.role, companyType: account.companyType };
}

export function buildTTAccount(
  credentials: LoginCredentials,
  overrides: {
    role?: TTTestAccount['role'];
    companyType?: TTTestAccount['companyType'];
    entitlements?: Partial<TTEntitlements>;
  } = {},
): TTTestAccount {
  const resolvedCompanyType: TTTestAccount['companyType'] =
    overrides.companyType ??
    (credentials.companyType as TTTestAccount['companyType'] | undefined) ??
    'elite';

  return {
    credentials,
    role: overrides.role ?? 'admin',
    companyType: resolvedCompanyType,
    region: 'us',
    entitlements: {
      canViewApprovalSettings: true,
      canEditApprovalSettings: true,
      canViewNotifications: true,
      canEditNotifications: true,
      canViewOvertimePolicies: true,
      canManageOvertimePolicies: true,
      ...overrides.entitlements,
    },
  };
}

/** Time Settings (TT01) FastPipeline account matrix — one account per SKU. */
const TT_ACCOUNT_MATRIX: AccountMatrix = {
  IES: ['TOFES01', 'SCFIES01'],
  PR_ELITE: ['TOFEL01', 'SCFPE01'],
  PR_PREMIUM: ['TOFPR01', 'SCFPP01'],
};

export function buildTTAccountsFromMatrix(
  selector: string | undefined = process.env.TEST_ACCOUNT,
): TTMatrixAccount[] {
  const combined = (selector ?? '').toUpperCase();
  const companyType: TTTestAccount['companyType'] = combined.includes('IES')
    ? 'ies'
    : combined.includes('PREMIUM')
    ? 'premium'
    : combined.includes('ELITE')
    ? 'elite'
    : 'elite';

  return resolveMatrixAccounts({
    matrix: TT_ACCOUNT_MATRIX,
    param: selector,
    label: 'TOF',
    allowEmpty: true,
  }).map(({ testId, credentials }) => ({
    testId,
    account: buildTTAccount(credentials, {
      role: credentials.expectedRole ?? 'admin',
      companyType,
    }),
  }));
}

async function navigateToTimeSettings(page: Page): Promise<void> {
  await navigateToAccountAndSettingsTime(page);
  await waitForLoadingToDisappear(page);
}

async function resetApprovalSettingsToDefault(page: Page): Promise<void> {
  try {
    await navigateToAccountAndSettingsTime(page);
    await waitForLoadingToDisappear(page);
    await clickEditApprovalsSection(page);
    await page.waitForTimeout(1000);

    const parentToggle = teamSubmitCheckbox(page);
    if (await parentToggle.isVisible().catch(() => false)) {
      if (await parentToggle.isChecked()) {
        await parentToggle.uncheck();
        await saveApprovalSettings(page);
        console.log('Approvals have been disabled successfully');
        return;
      }
    }

    const cancelBtn = page.getByRole('button', { name: 'Cancel' });
    if (await cancelBtn.isVisible().catch(() => false)) {
      await cancelBtn.click();
    }
    console.log('[TT] Approval settings cleanup skipped (install-only UI)');
  } catch (error) {
    console.warn(
      '[TT] Approval settings cleanup skipped — %s',
      error instanceof Error ? error.message : error,
    );
  }
}

export async function revertTimeTabSettingsChanges(
  page: Page,
  createdPolicies: string[],
): Promise<void> {
  console.log('[TT] Reverting Time Settings changes...');
  await resetApprovalSettingsToDefault(page);
  await revertOvertimePolicyChanges(page, createdPolicies);
}

export async function revertOvertimePolicyChanges(
  page: Page,
  createdPolicies: string[],
): Promise<void> {
  if (createdPolicies.length === 0) {
    return;
  }

  console.log(
    '[TT] Reverting overtime policy changes (%d policies)...',
    createdPolicies.length,
  );

  const overtimePage = new OvertimePolicyPage(page);
  try {
    await navigateToAccountAndSettingsTime(page);
    await overtimePage.navigateToOvertimeLanding();
    await overtimePage.waitForOvertimeManageUiReady();

    for (const policyName of createdPolicies) {
      try {
        await overtimePage.deletePolicyFromManageTable(policyName);
        console.log('[TT] Deleted overtime policy: %s', policyName);
      } catch (error) {
        console.warn(
          '[TT] Failed to delete policy "%s" — %s',
          policyName,
          error instanceof Error ? error.message : error,
        );
      }
    }
  } catch (error) {
    console.warn(
      '[TT] Overtime policy cleanup skipped — %s',
      error instanceof Error ? error.message : error,
    );
  }
}

function approvalsSettingsSection(page: Page) {
  return page.getByTestId('approvals-settings');
}

function teamSubmitCheckbox(page: Page) {
  const section = approvalsSettingsSection(page);
  return section
    .getByTestId('require-approval-for-tracked-time')
    .getByRole('checkbox')
    .or(section.getByRole('checkbox', { name: TEAM_SUBMIT_LABEL }));
}

function fullWeekCheckbox(page: Page) {
  const section = approvalsSettingsSection(page);
  return section
    .getByTestId('require-submission-for-full-week')
    .getByRole('checkbox')
    .or(section.getByRole('checkbox', { name: FULL_WEEK_LABEL }));
}

function customMessageTextarea(page: Page) {
  const section = approvalsSettingsSection(page);
  return section
    .getByTestId('custom-message')
    .or(
      section.locator(
        `//label[text()='${CUSTOM_MESSAGE_LABEL}']/parent::div//textarea`,
      ),
    );
}

function approvalInstalledCheckbox(page: Page) {
  const section = approvalsSettingsSection(page);
  return section
    .getByTestId('install-approval')
    .getByRole('checkbox')
    .or(
      section.getByRole('checkbox', {
        name: 'Require approval for tracked time',
      }),
    );
}

async function openApprovalsEditMode(page: Page): Promise<void> {
  await navigateToTimeSettings(page);
  await clickEditApprovalsSection(page);
  await expect(
    approvalsSettingsSection(page).getByRole('button', { name: 'Save' }),
  ).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(500);
}

async function setCheckboxChecked(
  checkbox: Locator,
  checked: boolean,
): Promise<void> {
  await expect(checkbox).toBeVisible({ timeout: 15000 });
  if (checked && !(await checkbox.isChecked())) {
    await checkbox.check();
  }
  if (!checked && (await checkbox.isChecked())) {
    await checkbox.uncheck();
  }
}

async function verifyApprovalToggleValue(
  page: Page,
  label: string,
  expected: 'On' | 'Off',
): Promise<void> {
  await expect(page.locator(`//label[text()='${label}']/../span`)).toHaveText(
    expected,
  );
}

async function verifyCustomMessageInViewMode(
  page: Page,
  expectedMessage: string,
): Promise<void> {
  const value = page.locator(
    `//label[text()='${CUSTOM_MESSAGE_LABEL}']/../span`,
  );
  await value.scrollIntoViewIfNeeded();
  await expect(value).toHaveText(expectedMessage);
}

type ApprovalsEditUi = 'install-only' | 'premium' | 'full';

async function detectApprovalsEditUi(page: Page): Promise<ApprovalsEditUi> {
  const section = approvalsSettingsSection(page);
  const parentVisible = await teamSubmitCheckbox(page)
    .isVisible({ timeout: 5000 })
    .catch(() => false);

  if (!parentVisible) {
    return 'install-only';
  }

  const innerTeamSubmitVisible = await section
    .getByTestId('require-team-members-submit-time')
    .isVisible()
    .catch(() => false);
  const installVisible = await approvalInstalledCheckbox(page)
    .isVisible()
    .catch(() => false);

  if (installVisible && !innerTeamSubmitVisible) {
    return 'premium';
  }
  return 'full';
}

async function exitApprovalsEditWithoutSaving(page: Page): Promise<void> {
  const cancelBtn = page.getByRole('button', { name: 'Cancel' });
  if (await cancelBtn.isVisible().catch(() => false)) {
    await cancelBtn.click();
    await waitForLoadingToDisappear(page);
  }
}

/** US Payroll Premium / NTTF: edit shows disabled install checkbox + Cancel/Save only. */
async function runApprovalsInstallOnlyFlow(page: Page): Promise<void> {
  console.log(
    '   ℹ Approvals edit is install-only (disabled checkbox, Save/Cancel only)',
  );
  const installCb = approvalInstalledCheckbox(page);
  await expect(installCb).toBeVisible({ timeout: 15000 });
  await expect(installCb).toBeDisabled();
  await expect(installCb).toBeChecked();
  await exitApprovalsEditWithoutSaving(page);
  console.log(
    '   ✓ Verified disabled Require approval for tracked time (install-only UI)',
  );
}

/** US Payroll Premium: parent toggle + custom message + full week (no inner team-submit row). */
async function runApprovalsPremiumEditFlow(page: Page): Promise<void> {
  console.log('   ℹ US Payroll Premium approvals edit flow');
  const installCb = approvalInstalledCheckbox(page);
  await expect(installCb).toBeDisabled();
  await expect(installCb).toBeChecked();

  const parentToggle = teamSubmitCheckbox(page);
  await setCheckboxChecked(parentToggle, true);
  const customMessage = customMessageTextarea(page);
  await expect(customMessage).toBeVisible();
  await expect(customMessage).toBeEnabled();
  await customMessage.fill(TEST_CUSTOM_MESSAGE);
  await saveApprovalSettings(page);
  await waitForLoadingToDisappear(page);
  await navigateToTimeSettings(page);
  await verifyCustomMessageInViewMode(page, TEST_CUSTOM_MESSAGE);
  console.log('   ✓ Custom message saved on premium');

  await openApprovalsEditMode(page);
  await setCheckboxChecked(parentToggle, false);
  await expect(customMessageTextarea(page)).not.toBeVisible();
  await saveApprovalSettings(page);
  await waitForLoadingToDisappear(page);
  await navigateToTimeSettings(page);
  await expect(
    page.locator(`//label[text()='${CUSTOM_MESSAGE_LABEL}']`),
  ).not.toBeVisible();
  console.log('   ✓ Custom message hidden when approval toggle is off');

  await openApprovalsEditMode(page);
  await setCheckboxChecked(parentToggle, true);
  await customMessageTextarea(page).fill(TEST_CUSTOM_MESSAGE);
  await clickResetMessage(page);
  await expect(customMessageTextarea(page)).toHaveValue(DEFAULT_CUSTOM_MESSAGE);
  await saveApprovalSettings(page);
  await waitForLoadingToDisappear(page);
  await navigateToTimeSettings(page);
  await verifyCustomMessageInViewMode(page, DEFAULT_CUSTOM_MESSAGE);
  console.log('   ✓ Custom message reset to default on premium');

  await openApprovalsEditMode(page);
  await setCheckboxChecked(fullWeekCheckbox(page), true);
  await saveApprovalSettings(page);
  await waitForLoadingToDisappear(page);
  await navigateToTimeSettings(page);
  await verifyApprovalToggleValue(page, FULL_WEEK_LABEL, 'On');
  console.log('   ✓ Require submission for a full week enabled');

  await openApprovalsEditMode(page);
  await setCheckboxChecked(fullWeekCheckbox(page), false);
  await saveApprovalSettings(page);
  await waitForLoadingToDisappear(page);
  await navigateToTimeSettings(page);
  await verifyApprovalToggleValue(page, FULL_WEEK_LABEL, 'Off');
  console.log('   ✓ Require submission for a full week disabled after edit');
}

async function runApprovalsFullEditFlow(page: Page): Promise<void> {
  await setCheckboxChecked(teamSubmitCheckbox(page), true);
  const customMessage = customMessageTextarea(page);
  await expect(customMessage).toBeVisible();
  await expect(customMessage).toBeEnabled();
  await customMessage.fill(TEST_CUSTOM_MESSAGE);
  await saveApprovalSettings(page);
  await waitForLoadingToDisappear(page);
  await navigateToTimeSettings(page);
  await verifyApprovalToggleValue(page, TEAM_SUBMIT_LABEL, 'On');
  await verifyCustomMessageInViewMode(page, TEST_CUSTOM_MESSAGE);
  console.log('   ✓ Custom message saved when team submission is enabled');

  await openApprovalsEditMode(page);
  await setCheckboxChecked(teamSubmitCheckbox(page), false);
  await expect(customMessageTextarea(page)).not.toBeVisible();
  await saveApprovalSettings(page);
  await waitForLoadingToDisappear(page);
  await navigateToTimeSettings(page);
  await verifyApprovalToggleValue(page, TEAM_SUBMIT_LABEL, 'Off');
  await expect(
    page.locator(`//label[text()='${CUSTOM_MESSAGE_LABEL}']`),
  ).not.toBeVisible();
  console.log('   ✓ Custom message hidden when team submission is disabled');

  await openApprovalsEditMode(page);
  await setCheckboxChecked(teamSubmitCheckbox(page), true);
  await customMessageTextarea(page).fill(TEST_CUSTOM_MESSAGE);
  await clickResetMessage(page);
  await expect(customMessageTextarea(page)).toHaveValue(DEFAULT_CUSTOM_MESSAGE);
  await saveApprovalSettings(page);
  await waitForLoadingToDisappear(page);
  await navigateToTimeSettings(page);
  await verifyCustomMessageInViewMode(page, DEFAULT_CUSTOM_MESSAGE);
  console.log('   ✓ Custom message reset to default');

  await openApprovalsEditMode(page);
  await setCheckboxChecked(fullWeekCheckbox(page), true);
  await saveApprovalSettings(page);
  await waitForLoadingToDisappear(page);
  await navigateToTimeSettings(page);
  await verifyApprovalToggleValue(page, FULL_WEEK_LABEL, 'On');
  console.log('   ✓ Require submission for a full week enabled');

  await openApprovalsEditMode(page);
  await setCheckboxChecked(fullWeekCheckbox(page), false);
  await saveApprovalSettings(page);
  await waitForLoadingToDisappear(page);
  await navigateToTimeSettings(page);
  await verifyApprovalToggleValue(page, FULL_WEEK_LABEL, 'Off');
  console.log('   ✓ Require submission for a full week disabled after edit');

  await verifySubmissionSectionVisible(page);
  console.log('   ✓ Submissions section visible with team submission on');
}

async function runApprovalSettingsFlow(
  page: Page,
  companyType: TTTestAccount['companyType'] = 'elite',
): Promise<void> {
  console.log(' — Approval settings');
  await navigateToTimeSettings(page);
  await verifyApprovalsSectionInSettings(page);
  await verifyApprovalsSectionVisible(page);
  console.log('   ✓ Approvals section visible');

  await openApprovalsEditMode(page);
  const editUi = await detectApprovalsEditUi(page);
  console.log(
    '   ℹ Approvals edit UI: %s (companyType=%s)',
    editUi,
    companyType,
  );

  if (editUi === 'install-only') {
    await runApprovalsInstallOnlyFlow(page);
    return;
  }

  if (editUi === 'premium' || companyType === 'premium') {
    await runApprovalsPremiumEditFlow(page);
    return;
  }

  await runApprovalsFullEditFlow(page);
}

async function runNotificationsFlow(page: Page): Promise<void> {
  console.log(' — Notifications');
  const overtimePage = new OvertimePolicyPage(page);

  await navigateToTimeSettings(page);
  await scrollToBottom(page);
  await TimeSettingsPage.verifyReadOnlyNotifSection(page);
  console.log('   ✓ Read-only notifications section verified');

  await clickNotifEditButton(page);
  await page.waitForTimeout(1000);

  // 1. Time tracking heading in edit mode.
  await expect(
    page
      .getByTestId('notifications-settings-edit')
      .getByText('Time tracking', { exact: true }),
  ).toBeVisible();
  console.log('   ✓ Time tracking heading visible in edit mode');

  // 2. Send clock-in reminder at — random AM or PM time.
  const notifEdit = page.getByTestId('notifications-settings-edit');
  await notifEdit.scrollIntoViewIfNeeded();
  const clockInInput = notifEdit.getByLabel('Send clock-in reminder at');
  await expect(clockInInput).toBeVisible();
  const clockInTime = pickRandomReminderTime();
  await selectTimeInReminderSection(
    page,
    'clk-in-reminder',
    clockInTime,
    'Send clock-in reminder at',
  );
  console.log('   ✓ Selected clock-in reminder time: %s', clockInTime);

  // 3. Email/mobile checkboxes — days dropdown enabled only when a channel is checked.
  await setNotificationChannelChecked(page, 'clk-in-email', false);
  await setNotificationChannelChecked(page, 'clk-in-mobile', false);
  await setNotificationChannelChecked(page, 'clk-out-email', false);
  await setNotificationChannelChecked(page, 'clk-out-mobile', false);
  await verifyDaysRemindersDropdownEnabled(page, false);

  const channelPattern = pickRandomEmailMobilePattern();
  await setNotificationChannelChecked(
    page,
    'clk-in-email',
    channelPattern.email,
  );
  await setNotificationChannelChecked(
    page,
    'clk-in-mobile',
    channelPattern.mobile,
  );
  await setNotificationChannelChecked(
    page,
    'clk-out-email',
    channelPattern.email,
  );
  await setNotificationChannelChecked(
    page,
    'clk-out-mobile',
    channelPattern.mobile,
  );
  await verifyDaysRemindersDropdownEnabled(page, true);
  console.log(
    '   ✓ Email/mobile channels configured (email=%s, mobile=%s)',
    channelPattern.email,
    channelPattern.mobile,
  );

  // 4–5. Days reminders are sent — select days.
  await verifyDaysRemindersLabel(page);
  const selectedDays = pickRandomSubset(NOTIFICATION_DAYS);
  await selectNotificationDays(page, selectedDays);
  console.log('   ✓ Selected reminder days: %s', selectedDays.join(', '));

  // 6. Notify when clock-in/-out time is adjusted — default Admins only.
  const clockAdjustVisible = await page
    .getByTestId('notifications-settings-edit')
    .getByTestId('clk-in-out-adjust')
    .isVisible()
    .catch(() => false);
  if (clockAdjustVisible) {
    await verifyNotifyDropdownDefault(
      page,
      'clk-in-out-adjust',
      'Notify when clock-in/-out time is adjusted',
      'Admins only',
    );
    await exerciseNotifyDropdownOptions(page, 'clk-in-out-adjust');
    await selectNotifyDropdownOption(page, 'clk-in-out-adjust', 'Admins only');
    console.log('   ✓ Clock-in/out adjusted notify options exercised');
  }

  // 7. Notify when notes are added or edited — default None.
  const notesVisible = await page
    .getByTestId('notifications-settings-edit')
    .getByTestId('notes-add-adjust')
    .isVisible()
    .catch(() => false);
  if (notesVisible) {
    await verifyNotifyDropdownDefault(
      page,
      'notes-add-adjust',
      'Notify when notes are added or edited',
      'None',
    );
    await exerciseNotifyDropdownOptions(page, 'notes-add-adjust');
    await selectNotifyDropdownOption(page, 'notes-add-adjust', 'None');
    console.log('   ✓ Notes notify options exercised (default None)');
  }

  // 8. Notifications → Approvals subsection (manager reminders only).
  await configureApprovalManagerRemindersDayOfWeek(page);
  console.log('   ✓ Approval manager reminders configured (On day of week)');
  await configureApprovalManagerRemindersPayPeriod(page);
  console.log(
    '   ✓ Approval manager reminders configured (Based on pay period)',
  );

  // 9. Geofence — start/end time and days of week (when geofence is enabled).
  await configureGeofenceNotificationsIfVisible(page);

  // 10. Overtime — Daily and Weekly alert configuration.
  const overtimeVisible = await page
    .locator('[class*="OvertimeEditSectionContainer"]')
    .isVisible()
    .catch(() => false);
  if (overtimeVisible) {
    await overtimePage.expectOvertimeSectionInNotifications();
    await configureOvertimePeriodAlerts(page, overtimePage, 'Daily');
    await configureOvertimePeriodAlerts(page, overtimePage, 'Weekly');
  } else {
    console.log('   ℹ Overtime notifications section not visible — skipping');
  }

  // Save notification changes.
  await overtimePage.saveNotifications();
  await waitForLoadingToDisappear(page);
  console.log('   ✓ Notifications changes saved');
}

async function runOvertimePolicyFlow(
  page: Page,
  createdPolicies: string[],
): Promise<void> {
  console.log(' — Overtime policy');
  const overtimePage = new OvertimePolicyPage(page);

  await verifyOvertimeSectionVisible(page);
  console.log('   ✓ Overtime section visible on Time settings');

  await overtimePage.navigateToOvertimeLanding();
  const policyHeader = page
    .getByRole('dialog', { name: 'Overtime' })
    .getByRole('columnheader', { name: 'Policy' });
  if (await policyHeader.isVisible().catch(() => false)) {
    console.log('   ✓ Existing overtime policies table visible');
  } else {
    console.log('   ℹ No existing policies — proceeding with create flow');
  }

  const policyName = await createOvertimePolicyWithBasicRules(
    page,
    overtimePage,
    createdPolicies,
  );

  await editOvertimePolicyOnReview(page, overtimePage, policyName);
  await deleteOvertimePolicyAndVerify(
    page,
    overtimePage,
    policyName,
    createdPolicies,
  );
}

/**
 * TT01 — Combined Time Settings end-to-end: Approvals, Notifications, Overtime.
 */
export async function runTimeTabSettingsSuite(
  page: Page,
  account: TTTestAccount,
  createdPolicies: string[],
): Promise<void> {
  console.log(
    'Starting Time Settings suite — role=%s companyType=%s',
    account.role,
    account.companyType,
  );

  await validateDashboard(page, asDashboardAccount(account));

  await resetApprovalSettingsToDefault(page);
  await runApprovalSettingsFlow(page, account.companyType);

  await runNotificationsFlow(page);
  await runOvertimePolicyFlow(page, createdPolicies);

  console.log(' ✓ Time Settings suite complete');
}
