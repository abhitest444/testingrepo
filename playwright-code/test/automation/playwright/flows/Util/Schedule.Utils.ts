import { Page, Locator, expect as baseExpect, test } from '@playwright/test';

import * as TimeSettingsPage from '../../pages/TimeSettingsPage';
import { dismissCookieConsent } from '../../pages/MileagePage';
import {
  AccountMatrix,
  ResolvedMatrixAccount,
  resolveMatrixAccounts,
} from './FastPipeline/accountMatrix';

import {
  validateEmployeeWorkerScheduleSettings,
  validateAdminAndGroupLeadWorkerScheduleSettings,
} from '../Util/ScheduleFlows.Util';

// ============================================================================
// Schedule Settings — QBO Account & Settings → Time
//
// Covers the QBO-side Schedule test cases:
//   • ST01 — Schedule Preferences card is visible in view mode
//   • ST02 — Schedule notification settings are visible (company level)
//   • ST05 — Edit Schedule Preferences: Cancel discards, Save persists & reflects
//   • ST06 — View-schedule radios disable when Group / Company is set in Manage
//   • ST07 — Edit Schedule notification settings: Cancel discards, Save persists
//
// ST03 / ST04 are the TSheets equivalents (Company Settings → Notifications and
// Feature Add-ons → Schedule preferences) and live in the TSheets track, not here.
//
// Locators below mirror the recorded flow (test-1.spec.ts):
//   • Schedule Preferences card  → testid `schedules-settings-handle`
//   • Card view/summary          → testid `schedules-settings-handle-view`
//   • View / Manage radio groups → role=group "Workers can view schedules of:" /
//                                   "Workers can manage schedules"
//   • Notifications card         → testid `notifications-settings`
//   • Notifications edit form    → testid `notifications-settings-edit`
// ============================================================================

// Fail fast: cap retrying-assertion timeout well below the 3-min global default
// so a failing assertion surfaces in seconds instead of hanging the run.
const expect = baseExpect.configure({ timeout: 8000 });

// ============================================================================
// Account matrix (mirrors the Time Tab Settings track)
// ============================================================================

export const SCHEDULE_SETTINGS_ACCOUNT_MATRIX: AccountMatrix = {
  IES: ['SCFIES01'],
  PR_ELITE: ['SCFPRE01'],
  PR_PREMIUM: ['SCFPRR01'],
};

// Resolves TEST_ACCOUNT to the ordered account list (exact key or group).
// allowEmpty: the Schedule card is entitlement-gated, so SKUs without an account
// register no tests instead of aborting collection of the whole spec file.
export function buildScheduleSettingsAccountsFromMatrix(
  selector: string | undefined = process.env.TEST_ACCOUNT,
): ResolvedMatrixAccount[] {
  return resolveMatrixAccounts({
    matrix: SCHEDULE_SETTINGS_ACCOUNT_MATRIX,
    param: selector,
    label: 'SCHED',
    allowEmpty: true,
  });
}

// ============================================================================
// Labels & test-ids — single source of truth
// ============================================================================

const PREF = {
  cardTestId: 'schedules-settings-handle',
  viewTestId: 'schedules-settings-handle-view',
  header: 'Preferences',
  viewGroup: 'Workers can view schedules of:',
  manageGroup: 'Workers can manage schedules',
  viewOptions: ['Their own', 'Group', 'Company'] as const,
  manageOptions: ['None', 'Their own', 'Group', 'Company'] as const,
};

const NOTIF = {
  cardTestId: 'notifications-settings',
  editTestId: 'notifications-settings-edit',
  scheduleHeading: 'Schedule',
  // Company-level schedule notification features — each has a mobile + email
  // checkbox; the first feature additionally has the Always/Never/Ask radio set.
  // Regex tolerates minor label drift (e.g. "clock in" vs "clock out" on shift-ended).
  features: [
    /When assigned shift is published or changed/i,
    /One hour before shift starts/i,
    /Forgot to clock in after shift started/i,
    /Forgot to clock (in|out) after shift ended/i,
    /Team member hasn't clocked in after shift started/i,
  ],
  // VIEW-mode row labels, in the SAME order as `features` — used to read each
  // feature's "On, mobile, email" / "Off" value (anchored on the row label).
  viewLabels: [
    'When assigned shift is published or changed',
    'One hour before shift starts',
    'Forgot to clock in after shift started',
    'Forgot to clock out after shift ended',
    "Team member hasn't clocked in after shift started. Notify manager.",
  ],
  sendOptions: ['Always send', 'Never send', 'Ask'] as const,
};

// ============================================================================
// Schedule Preferences locators (recorded flow)
// ============================================================================

const scheduleCard = (page: Page): Locator => page.getByTestId(PREF.cardTestId);
const scheduleCardView = (page: Page): Locator =>
  page.getByTestId(PREF.viewTestId);

const viewGroup = (page: Page): Locator =>
  page.getByRole('group', { name: PREF.viewGroup });
const manageGroup = (page: Page): Locator =>
  page.getByRole('group', { name: PREF.manageGroup });

const viewRadio = (page: Page, option: string): Locator =>
  viewGroup(page).getByLabel(option, { exact: true });
const manageRadio = (page: Page, option: string): Locator =>
  manageGroup(page).getByLabel(option, { exact: true });

// ============================================================================
// Notifications locators (recorded flow)
// ============================================================================

const notifCard = (page: Page): Locator => page.getByTestId(NOTIF.cardTestId);
const notifEdit = (page: Page): Locator => page.getByTestId(NOTIF.editTestId);
const scheduleNotifHeading = (page: Page): Locator =>
  notifEdit(page).getByText(NOTIF.scheduleHeading, { exact: true });

// Innermost row inside the notifications edit form that holds a feature + its
// mobile/email channel checkboxes.
const notifRow = (page: Page, feature: string | RegExp): Locator =>
  notifEdit(page)
    .locator('tr, li, div')
    .filter({ hasText: feature })
    .filter({ has: page.getByRole('checkbox') })
    .last();

const notifCheckbox = (
  page: Page,
  feature: string | RegExp,
  channel: 'mobile' | 'email',
): Locator =>
  notifRow(page, feature)
    .getByRole('checkbox')
    .nth(channel === 'email' ? 0 : 1);

const sendRadio = (page: Page, option: string): Locator =>
  notifEdit(page).getByRole('radio', { name: new RegExp(option, 'i') });

const setNotifChannel = (
  page: Page,
  feature: string | RegExp,
  channel: 'mobile' | 'email',
  checked: boolean,
): Promise<void> =>
  notifCheckbox(page, feature, channel).setChecked(checked, {
    force: true,
    timeout: 8000,
  });

const scheduleNotifViewValue = async (
  page: Page,
  label: string,
): Promise<string> => {
  const value = page
    .locator(
      `//label[contains(normalize-space(.),"${label}")]/following-sibling::span`,
    )
    .first();
  await value.scrollIntoViewIfNeeded().catch(() => {});
  await expect(
    value,
    `view value for "${label}" should be visible`,
  ).toBeVisible();
  return (await value.textContent())?.trim().toLowerCase() ?? '';
};

// ============================================================================
// Shared actions
// ============================================================================

const openSchedulePrefsCard = async (page: Page) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await scheduleCard(page).scrollIntoViewIfNeeded();
  await expect(scheduleCard(page)).toBeVisible();
};

const clickSchedulePrefsEdit = async (page: Page) => {
  await scheduleCardView(page)
    .getByRole('button', { name: 'Edit', exact: true })
    .click();
  await page.waitForTimeout(1000);
};

const clickSchedulePrefsCancel = async (page: Page) => {
  await page.getByRole('button', { name: 'Cancel' }).first().click();
  await page.waitForTimeout(1000);
};

const clickSchedulePrefsSave = async (page: Page) => {
  await page.getByRole('button', { name: 'Save' }).first().click();
  await page.waitForTimeout(1500);
};

const selectedOption = async (
  group: (page: Page) => Locator,
  page: Page,
  options: readonly string[],
): Promise<string | null> => {
  for (const option of options) {
    const checked = await group(page)
      .getByLabel(option, { exact: true })
      .isChecked()
      .catch(() => false);
    if (checked) return option;
  }
  return null;
};

const verifyViewModeReflects = async (
  page: Page,
  viewVal: string,
  manageVal: string,
) => {
  await expect(scheduleCardView(page)).toContainText(`View schedule${viewVal}`);
  await expect(scheduleCardView(page)).toContainText(
    `Manage schedule${manageVal}`,
  );
};

// ============================================================================
// Schedule Preferences — ST01 / ST05 / ST06
// ============================================================================

// ST01 — view mode: card visible with Preferences header + View/Manage summary.
export const verifySchedulePreferencesViewMode = async (page: Page) => {
  console.log('▶ [Schedule Preferences] ST01 — verifying view mode');
  await openSchedulePrefsCard(page);
  await expect(scheduleCard(page)).toContainText('Schedules');
  await expect(scheduleCardView(page)).toContainText(PREF.header);
  await expect(scheduleCardView(page)).toContainText('View schedule');
  await expect(scheduleCardView(page)).toContainText('Manage schedule');
  console.log('  ✓ Schedule Preferences card visible with View/Manage summary');
};

// ST06 — selecting Group/Company in Manage disables the matching View options.
export const verifyViewRadiosDisabledByManage = async (page: Page) => {
  console.log('▶ [Schedule Preferences] ST06 — verifying disabled View radios');
  await openSchedulePrefsCard(page);
  await clickSchedulePrefsEdit(page);

  // Group in Manage → "Their own" in View is disabled.
  await manageRadio(page, 'Group').check();
  await page.waitForTimeout(500);
  await expect(viewRadio(page, 'Their own')).toBeDisabled();
  console.log("  ✓ Manage=Group disables View 'Their own'");

  // Company in Manage → "Their own" and "Group" in View are disabled.
  await manageRadio(page, 'Company').check();
  await page.waitForTimeout(500);
  await expect(viewRadio(page, 'Their own')).toBeDisabled();
  await expect(viewRadio(page, 'Group')).toBeDisabled();
  console.log("  ✓ Manage=Company disables View 'Their own' and 'Group'");

  await clickSchedulePrefsCancel(page);
};

// ST05 — edit: Cancel discards, then edit again, Save persists & reflects in view.
export const editAndVerifySchedulePreferences = async (page: Page) => {
  console.log('▶ [Schedule Preferences] ST05 — edit, cancel, save & verify');
  await openSchedulePrefsCard(page);
  await clickSchedulePrefsEdit(page);

  // Verify all radio options are present in edit mode.
  for (const option of PREF.viewOptions) {
    await expect(viewRadio(page, option)).toBeVisible();
  }
  for (const option of PREF.manageOptions) {
    await expect(manageRadio(page, option)).toBeVisible();
  }

  const originalView = await selectedOption(viewGroup, page, PREF.viewOptions);
  const originalManage = await selectedOption(
    manageGroup,
    page,
    PREF.manageOptions,
  );
  console.log(`  • original View=${originalView}, Manage=${originalManage}`);

  try {
    await test.step('ST05: only one radio selectable per section', async () => {
      // View section is mutually exclusive (Manage=None enables all View options).
      await manageRadio(page, 'None').check();
      await viewRadio(page, 'Group').check();
      await expect(viewRadio(page, 'Group')).toBeChecked();
      await expect(viewRadio(page, 'Their own')).not.toBeChecked();
      await expect(viewRadio(page, 'Company')).not.toBeChecked();

      // Manage section is mutually exclusive.
      await manageRadio(page, 'Their own').check();
      await expect(manageRadio(page, 'Their own')).toBeChecked();
      await expect(manageRadio(page, 'None')).not.toBeChecked();
      await expect(manageRadio(page, 'Group')).not.toBeChecked();
      await expect(manageRadio(page, 'Company')).not.toBeChecked();
      console.log('  ✓ View & Manage each allow only one selection');
    });

    await test.step('ST05: Cancel discards the change', async () => {
      // "Company" is always an enabled View option regardless of Manage.
      await viewRadio(page, 'Company').check();
      await clickSchedulePrefsCancel(page);
      // Reopen edit and confirm the original selection is intact.
      await clickSchedulePrefsEdit(page);
      expect(await selectedOption(viewGroup, page, PREF.viewOptions)).toBe(
        originalView,
      );
      console.log('  ✓ Cancel discarded the View change');
    });

    await test.step('ST05: Save persists and reflects in view mode', async () => {
      // Manage=Company forces View=Company (Their own/Group disabled), matching
      // the recorded flow; select View first, then Manage.
      await viewRadio(page, 'Company').check();
      await manageRadio(page, 'Company').check();
      await clickSchedulePrefsSave(page);
      await verifyViewModeReflects(page, 'Company', 'Company');
      console.log(
        '  ✓ Saved View=Company, Manage=Company reflected in view mode',
      );
    });
  } finally {
    // Cleanup ALWAYS runs — restore the original selection.
    await test.step('ST05: cleanup — restore original selection', async () => {
      try {
        await openSchedulePrefsCard(page);
        await clickSchedulePrefsEdit(page);
        if (originalManage) await manageRadio(page, originalManage).check();
        if (originalView) await viewRadio(page, originalView).check();
        await clickSchedulePrefsSave(page);
        console.log('  ✓ Schedule Preferences restored to original');
      } catch (err) {
        console.log(
          `  ⚠ Schedule Preferences cleanup failed (continuing): ${err}`,
        );
      }
    });
  }
};

// ============================================================================
// Schedule notification settings — ST02 / ST07
// ============================================================================

// Opens the Notifications card edit form and scrolls to the Schedule section.
const openNotificationsEdit = async (page: Page) => {
  await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
  await expect(notifCard(page)).toBeVisible();
  await TimeSettingsPage.clickNotifEditButton(page);
  await page.waitForTimeout(1500);
  await scheduleNotifHeading(page)
    .scrollIntoViewIfNeeded()
    .catch(() => {});
};

// ST02 — every company-level schedule notification setting is listed.
export const verifyScheduleNotificationSettings = async (page: Page) => {
  console.log('▶ [Schedule Notifications] ST02 — verifying schedule settings');
  await openNotificationsEdit(page);
  await expect(scheduleNotifHeading(page)).toBeVisible();
  console.log('  ✓ Schedule section present in the Notifications card');

  for (const feature of NOTIF.features) {
    await expect(
      notifEdit(page).getByText(feature).first(),
      `schedule notification setting ${feature} should be visible`,
    ).toBeVisible();
    console.log(`  ✓ ${feature} visible`);
  }

  // The published/changed shift setting exposes Always/Never/Ask send radios.
  for (const option of NOTIF.sendOptions) {
    await expect(
      notifEdit(page).getByText(option, { exact: false }).first(),
      `send option "${option}" should be visible`,
    ).toBeVisible();
    console.log(`  ✓ send option "${option}" visible`);
  }
};

// ST07 — edit schedule notifications: single/both checkbox select, single send
// radio, Cancel discards, Save persists, and the VIEW mode reflects each
// feature's channels ("On, mobile, email" / "Off" when none).
export const editAndVerifyScheduleNotifications = async (page: Page) => {
  console.log('▶ [Schedule Notifications] ST07 — edit, cancel, save & verify');
  await openNotificationsEdit(page);

  const first = NOTIF.features[0];

  // Capture the original mobile/email state of EVERY feature so cleanup can
  // restore the company level to exactly how it started.
  const original: { mobile: boolean; email: boolean }[] = [];
  for (const feature of NOTIF.features) {
    original.push({
      mobile: await notifCheckbox(page, feature, 'mobile')
        .isChecked({ timeout: 1000 })
        .catch(() => false),
      email: await notifCheckbox(page, feature, 'email')
        .isChecked({ timeout: 1000 })
        .catch(() => false),
    });
  }

  // Per-feature combos exercising both / email-only / mobile-only / none(Off).
  const combos = [
    { mobile: true, email: true }, // [0] shift published — both
    { mobile: false, email: true }, // [1] one hour — email only
    { mobile: true, email: false }, // [2] forgot clock-in started — mobile only
    { mobile: false, email: false }, // [3] forgot clock-out ended — none → Off
    { mobile: true, email: true }, // [4] manager notify — both
  ];

  try {
    await test.step('ST07: Cancel discards the change', async () => {
      const before = await notifCheckbox(page, first, 'mobile')
        .isChecked({ timeout: 1000 })
        .catch(() => false);
      await setNotifChannel(page, first, 'mobile', !before);
      await page
        .getByRole('button', { name: 'Cancel' })
        .first()
        .click({ timeout: 8000 });
      await page.waitForTimeout(1000);
      await openNotificationsEdit(page);
      await expect(notifCheckbox(page, first, 'mobile')).toBeChecked({
        checked: before,
      });
      console.log('  ✓ Cancel discarded the checkbox change');
    });

    await test.step('ST07: only one send radio (Always/Never/Ask) selectable', async () => {
      // A channel must be on for the send-mode radios to be enabled.
      await setNotifChannel(page, first, 'mobile', true);
      await sendRadio(page, 'Always send').check({ timeout: 8000 });
      await expect(sendRadio(page, 'Always send')).toBeChecked();
      await expect(sendRadio(page, 'Never send')).not.toBeChecked();
      await expect(sendRadio(page, 'Ask')).not.toBeChecked();

      await sendRadio(page, 'Ask').check({ timeout: 8000 });
      await expect(sendRadio(page, 'Ask')).toBeChecked();
      await expect(sendRadio(page, 'Always send')).not.toBeChecked();
      console.log('  ✓ Send mode allows only one selection');
    });

    await test.step('ST07: Save reflects each feature in view mode (Off when none)', async () => {
      // Apply the per-feature combos.
      for (let i = 0; i < NOTIF.features.length; i += 1) {
        await setNotifChannel(
          page,
          NOTIF.features[i],
          'mobile',
          combos[i].mobile,
        );
        await setNotifChannel(
          page,
          NOTIF.features[i],
          'email',
          combos[i].email,
        );
      }
      // Always send so the shift-published channels surface in view mode
      // (Never send would hide them — that's ST08).
      await sendRadio(page, 'Always send').check({ timeout: 8000 });
      await page
        .getByRole('button', { name: 'Save' })
        .first()
        .click({ timeout: 8000 });
      await page.waitForTimeout(1500);

      // Reload the settings page so the summary reflects the PERSISTED state
      // rather than the stale inline view rendered right after Save.
      await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
      await expect(notifCard(page)).toBeVisible();
      await notifCard(page)
        .scrollIntoViewIfNeeded()
        .catch(() => {});
      // VIEW mode — each feature reflects ONLY its enabled channels; none → Off.
      for (let i = 0; i < NOTIF.features.length; i += 1) {
        const label = NOTIF.viewLabels[i];
        const value = await scheduleNotifViewValue(page, label);
        const { mobile, email } = combos[i];
        if (!mobile && !email) {
          expect(
            value,
            `"${label}" should show "Off" when no channel is on`,
          ).toContain('off');
        } else {
          expect(
            value.includes('mobile'),
            `"${label}" should ${mobile ? '' : 'NOT '}show mobile`,
          ).toBe(mobile);
          expect(
            value.includes('email'),
            `"${label}" should ${email ? '' : 'NOT '}show email`,
          ).toBe(email);
        }
      }
      console.log(
        '  ✓ View mode reflects per-feature channels (Off when none; only enabled channels shown)',
      );
    });
  } finally {
    // Cleanup ALWAYS runs — restore every feature's original checkbox state.
    await test.step('ST07: cleanup — restore original checkboxes', async () => {
      try {
        await openNotificationsEdit(page);
        for (let i = 0; i < NOTIF.features.length; i += 1) {
          await setNotifChannel(
            page,
            NOTIF.features[i],
            'mobile',
            original[i].mobile,
          );
          await setNotifChannel(
            page,
            NOTIF.features[i],
            'email',
            original[i].email,
          );
        }
        await page
          .getByRole('button', { name: 'Save' })
          .first()
          .click({ timeout: 8000 });
        await page.waitForTimeout(1000);
        console.log('  ✓ Schedule notifications restored to original');
      } catch (err) {
        console.log(
          `  ⚠ Schedule notifications cleanup failed (continuing): ${err}`,
        );
      }
    });
  }
};

// ============================================================================
// TSheets (classic QuickBooks Time) — ST03 / ST04
//
// The classic UI opens in a NEW TAB via the "Go to classic QuickBooks Time"
// link (the `page1` in the recording). Navigation then uses the classic
// shortcuts: `#addons_shortcut` (Feature Add-ons) and Company Settings →
// Notifications. Schedule-preference radios use the recorded element IDs.
// ============================================================================

// Schedule preference radio IDs (from the recorded TSheets flow). Prod classic UI
// may omit these IDs — fall back to labelled radios (view = first match, manage = last).
const TS_PREF = {
  titleHeader: '#addon_schedule_title_header',
  view: {
    'Their own': '#addon_schedule_default_view_permission_their_own',
    Group: '#addon_schedule_default_view_permission_group',
    Company: '#addon_schedule_default_view_permission_company',
  },
  manage: {
    None: '#addon_schedule_default_manage_permission_none',
    'Their own': '#addon_schedule_default_manage_permission_their_own',
    Group: '#addon_schedule_default_manage_permission_group',
    Company: '#addon_schedule_default_manage_permission_company',
  },
} as const;

const tsViewRadio = (
  classicPage: Page,
  option: keyof typeof TS_PREF.view,
): Locator =>
  classicPage
    .locator(TS_PREF.view[option])
    .or(classicPage.getByRole('radio', { name: option, exact: true }).first());

const tsManageRadio = (
  classicPage: Page,
  option: keyof typeof TS_PREF.manage,
): Locator => {
  const byId = classicPage.locator(TS_PREF.manage[option]);
  const byRole =
    option === 'None'
      ? classicPage.getByRole('radio', { name: 'None', exact: true }).first()
      : classicPage.getByRole('radio', { name: option, exact: true }).last();
  return byId.or(byRole);
};

// Company-level schedule notification features in classic TSheets (ST03 wording).
const TS_NOTIF_FEATURES = [
  'When assigned shift is published or changed',
  'One hour before shift starts',
  'Forgot to clock in after shift started',
  'Forgot to clock out after shift ended',
  "Team member hasn't clocked in after shift started",
];

// Opens the classic QuickBooks Time UI in a new tab and returns that page.
// Tries the in-app "Go to classic QuickBooks Time" link first (Account &
// Settings → Time, Overview, Time entries). Post-migration Elite accounts often
// omit that link; fall back to the same login_oii SSO URL the product uses
// (see TSheetsModal.tsx).
const CLASSIC_QBT_LINK = /Go to classic QuickBooks Time/i;

const tsheetsBaseUrl = (): string =>
  process.env.PLAYWRIGHT_ENV === 'prod'
    ? 'https://tsheets.intuit.com'
    : 'https://tsheets-e2e.intuit.com';

const classicLink = (page: Page): Locator =>
  page
    .getByRole('button', { name: CLASSIC_QBT_LINK })
    .or(page.getByText(CLASSIC_QBT_LINK))
    .first();

const resolveRealmId = async (page: Page): Promise<string> => {
  const fromPage = await page.evaluate(() => {
    const w = window as Window & {
      realmId?: string;
      intuit_realmId?: string;
      companyId?: string;
    };
    return (
      w.realmId ||
      w.intuit_realmId ||
      w.companyId ||
      document.querySelector('meta[name="realmId"]')?.getAttribute('content') ||
      document
        .querySelector('meta[name="companyId"]')
        ?.getAttribute('content') ||
      ''
    );
  });
  if (fromPage) return fromPage;

  const fromUrl = new URL(page.url());
  const fromParams =
    fromUrl.searchParams.get('companyId') ||
    fromUrl.searchParams.get('realmId') ||
    fromUrl.searchParams.get('realm_id') ||
    '';
  if (fromParams) return fromParams;

  const cookies = await page.context().cookies();
  const cookieMap = Object.fromEntries(cookies.map((c) => [c.name, c.value]));
  const shellCtxRaw = cookieMap['shell.ctx.id'] || '';
  const shellCtx = decodeURIComponent(shellCtxRaw.replace(/"/g, ''));
  const fromShell = shellCtx.match(/companyId=(\d+)/)?.[1] || '';
  if (fromShell) return fromShell;

  return (
    cookieMap['qbo.ptc.currentcompanyid'] ||
    cookieMap['qbo.currentcompanyid'] ||
    cookieMap['realmId'] ||
    ''
  );
};

const finishClassicPageSetup = async (classicPage: Page): Promise<void> => {
  await classicPage.waitForLoadState();
  await TimeSettingsPage.handleClassicTimesheetPopupsInAnyOrder(classicPage);
  if (
    await classicPage
      .locator(`//div[@class='overlay_content_box']`)
      .isVisible()
      .catch(() => false)
  ) {
    await classicPage
      .getByTitle('Close')
      .click()
      .catch(() => {});
  }
  await expect(
    classicPage
      .locator('#quickbooks_menu_top')
      .or(classicPage.locator('#my_account_shortcut'))
      .first(),
  ).toBeVisible({ timeout: 30000 });
  await TimeSettingsPage.waitForPageReady(classicPage);
  await TimeSettingsPage.handleMergeEmployeePopup(classicPage).catch(() => {});
  await dismissCookieConsent(classicPage).catch(() => {});
};

const openClassicViaLoginOii = async (page: Page): Promise<Page> => {
  const realmId = await resolveRealmId(page);
  if (!realmId) {
    throw new Error(
      'Classic QuickBooks Time link not found and realmId could not be resolved for login_oii fallback',
    );
  }
  const classicUrl = `${tsheetsBaseUrl()}/login_oii?realm_id=${encodeURIComponent(
    realmId,
  )}`;
  const classicPage = await page.context().newPage();
  await classicPage.goto(classicUrl, { waitUntil: 'load', timeout: 60000 });
  await finishClassicPageSetup(classicPage);
  console.log('  ✓ Classic QuickBooks Time opened via login_oii SSO');
  return classicPage;
};

export const openClassicTSheets = async (page: Page): Promise<Page> => {
  const surfaces = [
    () => TimeSettingsPage.navigateToAccountAndSettingsTime(page),
    () =>
      TimeSettingsPage.navigateWithAuthSession(page, '/app/time/overview', {
        waitUntil: 'load',
        postNavigateTimeout: 0,
      }),
    () => TimeSettingsPage.navigateToTimeEntries(page),
  ];

  for (const navigate of surfaces) {
    await navigate().catch(() => {});
    await TimeSettingsPage.waitForPageReady(page).catch(() => {});
    await TimeSettingsPage.handlePopupsInAnyOrder(page).catch(() => {});

    if (
      await classicLink(page)
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      const [classicPage] = await Promise.all([
        page.context().waitForEvent('page'),
        classicLink(page).click({ timeout: 10000 }),
      ]);
      await finishClassicPageSetup(classicPage);
      console.log('  ✓ Classic QuickBooks Time opened in a new tab');
      return classicPage;
    }
  }

  console.log(
    '  • "Go to classic QuickBooks Time" not on QBO surfaces — using login_oii fallback',
  );
  return openClassicViaLoginOii(page);
};

// ST04 — TSheets Schedule preferences: validate headers, options & disabling.
export const validateTSheetsSchedulePreferences = async (classicPage: Page) => {
  console.log('▶ [TSheets Schedule Preferences] ST04 — validating');

  // 1. Feature Add-ons → Schedule Preferences.
  await TimeSettingsPage.clickOnFeatureAddOns(classicPage);
  await classicPage.getByRole('link', { name: 'Schedule Preferences' }).click();
  await expect(classicPage.locator(TS_PREF.titleHeader)).toContainText(
    'Schedule Preferences',
  );
  console.log('  ✓ Schedule Preferences page open (edit mode)');

  // 2. Schedule + Preferences headers and descriptions.
  await expect(
    classicPage
      .getByText('Add shifts and assign team members', { exact: false })
      .first(),
  ).toBeVisible();
  await expect(
    classicPage
      .getByText('Settings are applied to all team members', { exact: false })
      .first(),
  ).toBeVisible();
  console.log('  ✓ Schedule & Preferences headers/descriptions visible');

  await classicPage.waitForTimeout(1500);

  // 3. View & Manage options present.
  for (const option of Object.keys(TS_PREF.view) as Array<
    keyof typeof TS_PREF.view
  >) {
    await expect(tsViewRadio(classicPage, option)).toBeVisible();
  }
  for (const option of Object.keys(TS_PREF.manage) as Array<
    keyof typeof TS_PREF.manage
  >) {
    await expect(tsManageRadio(classicPage, option)).toBeVisible();
  }
  console.log('  ✓ View (3) and Manage (4) options present');

  // 4. Manage=Group → View "Their own" disabled.
  await tsManageRadio(classicPage, 'Group').check();
  await classicPage.waitForTimeout(500);
  await expect(tsViewRadio(classicPage, 'Their own')).toBeDisabled();
  console.log("  ✓ Manage=Group disables View 'Their own'");

  // 5. Manage=Company → View "Their own" and "Group" disabled.
  await tsManageRadio(classicPage, 'Company').check();
  await classicPage.waitForTimeout(500);
  await expect(tsViewRadio(classicPage, 'Their own')).toBeDisabled();
  await expect(tsViewRadio(classicPage, 'Group')).toBeDisabled();
  console.log("  ✓ Manage=Company disables View 'Their own' and 'Group'");

  // 6. Select a radio each (Company is the only enabled View option now) & verify
  //    it retains. Classic add-on prefs persist on change.
  await tsViewRadio(classicPage, 'Company').check();
  await classicPage.waitForTimeout(500);
  await expect(tsViewRadio(classicPage, 'Company')).toBeChecked();
  await expect(tsManageRadio(classicPage, 'Company')).toBeChecked();
  console.log('  ✓ View=Company / Manage=Company selected & retained');
};

// ST03 — TSheets schedule notification settings: validate the schedule section
// in edit mode, select channel checkboxes + a send radio, save.
export const validateTSheetsScheduleNotifications = async (
  classicPage: Page,
) => {
  console.log('▶ [TSheets Notifications] ST03 — validating schedule settings');

  // 1. Company Settings → Notifications.
  await TimeSettingsPage.clickOnCompSettings(classicPage);
  await TimeSettingsPage.waitForPageReady(classicPage);
  await TimeSettingsPage.clickOnNotifications(classicPage);
  await classicPage.waitForTimeout(3000);

  // 2/3. Scroll to the schedule section and validate every feature (edit mode).
  for (const feature of TS_NOTIF_FEATURES) {
    const row = classicPage.getByText(feature, { exact: false }).first();
    await row.scrollIntoViewIfNeeded().catch(() => {});
    await expect(row).toBeVisible();
    console.log(`  ✓ "${feature}" visible`);
  }

  // Always send / Never send / Ask radios for the published-or-changed setting.
  for (const option of ['Always send', 'Never send', 'Ask']) {
    await expect(
      classicPage.getByText(option, { exact: false }).first(),
    ).toBeVisible();
    console.log(`  ✓ send option "${option}" visible`);
  }

  // 4/5. Select email + mobile checkboxes for the first feature and a send radio.
  const firstRow = classicPage
    .locator('tr, li, div')
    .filter({ hasText: TS_NOTIF_FEATURES[0] })
    .filter({ has: classicPage.getByRole('checkbox') })
    .last();
  for (const channel of ['email', 'mobile']) {
    const cb = firstRow.getByRole('checkbox', {
      name: new RegExp(channel, 'i'),
    });
    if (await cb.count()) await cb.first().setChecked(true, { force: true });
  }
  await classicPage
    .getByRole('radio', { name: /Always send/i })
    .first()
    .check()
    .catch(() => {});

  // 6. Save and confirm the 'Settings saved' popup.
  await classicPage.getByRole('button', { name: 'Save' }).first().click();
  await expect(classicPage.getByText(/Settings saved/i).first()).toBeVisible({
    timeout: 15000,
  });
  console.log(
    '  ✓ Schedule notification settings saved (Settings saved shown)',
  );
};

// Orchestrator — opens classic TSheets once and runs ST04 + ST03 on it.
export const validateTSheetsScheduleSettings = async (page: Page) => {
  const classicPage = await test.step('Open classic QuickBooks Time', () =>
    openClassicTSheets(page));
  try {
    await test.step('ST04 — TSheets Schedule preferences', async () => {
      await validateTSheetsSchedulePreferences(classicPage);
    });
    await test.step('ST03 — TSheets schedule notification settings', async () => {
      await validateTSheetsScheduleNotifications(classicPage);
    });
    console.log('✔ [TSheets] ST03 & ST04 complete');
  } finally {
    await classicPage.close().catch(() => {});
  }
};

// ============================================================================
// Orchestrator — runs every QBO Schedule settings case on one account
// ============================================================================

export const validateScheduleSettings = async (page: Page) => {
  await test.step('Land on Time tab', async () => {
    console.log('▶ [Schedule settings] landing on Account & Settings → Time');
    await TimeSettingsPage.navigateToAccountAndSettingsTime(page);
    console.log('  ✓ Time tab loaded');
  });

  await test.step('ST01 — Schedule Preferences card (view mode)', async () => {
    await verifySchedulePreferencesViewMode(page);
  });

  await test.step('ST02 — Schedule notification settings', async () => {
    await verifyScheduleNotificationSettings(page);
  });

  await test.step('ST06 — View radios disabled by Manage selection', async () => {
    await verifyViewRadiosDisabledByManage(page);
  });

  await test.step('ST05 — Edit Schedule Preferences: cancel, save & verify', async () => {
    await editAndVerifySchedulePreferences(page);
  });

  await test.step('ST07 — Edit Schedule notifications: cancel, save & verify', async () => {
    await editAndVerifyScheduleNotifications(page);
  });

  await test.step('ST13 — Worker (employee) schedule notification settings', async () => {
    await validateEmployeeWorkerScheduleSettings(page, 'Test Emp3');
  });

  await test.step('ST14 & ST15 — Admin + group-lead worker schedule notification settings', async () => {
    await validateAdminAndGroupLeadWorkerScheduleSettings(page);
  });

  console.log('✔ [Schedule settings] all QBO Schedule cases complete');
};
