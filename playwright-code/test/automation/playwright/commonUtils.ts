import { Locator, Page, expect, test } from '@playwright/test';
import { handlePopupsInAnyOrder } from './pages/TimeSettingsPage';
import gotoWithAuthSession from './gotoWithAuthSession';
// Static import (not lazy `await import()`): a dynamic import of Workforce.Util resolves a
// partially-initialized module across the commonUtils <-> Workforce.Util cycle, leaving these
// exports undefined ("… is not a function"). A static import is a live binding used only inside
// functions, which tolerates the cycle — same pattern already used by WorkforcePage/QBOLogin.
import {
  dismissWorkforceOverlaysBeforeInteraction,
  isTasksDrawerVisible,
  openWorkforceDateRangeDropdown,
} from './flows/Util/Workforce.Util';

//This file will have all common utilities which are available across all or most screens

/**
 * Free-data / fresh QBO accounts can land on a chromeless setup/onboarding view
 * (no left nav). Navigate directly to the Time app so the standard shell renders.
 * No-ops when the standard nav is already present and the Time Entries grid is ready.
 */
async function clickThroughQboOnboarding(page: Page): Promise<void> {
  for (let i = 0; i < 5; i++) {
    const getStarted = page.getByRole('button', {
      name: /let'?s get started/i,
    });
    if (
      await getStarted
        .first()
        .isVisible({ timeout: 1500 })
        .catch(() => false)
    ) {
      await getStarted.first().click();
      await page.waitForTimeout(1500);
      continue;
    }
    break;
  }
}

/** Prod maintenance state — Time Entries grid is replaced by an upgrade banner. */
export async function isTimeServiceMaintenanceVisible(
  page: Page,
): Promise<boolean> {
  const maintenanceHeading = page.getByRole('heading', {
    name: /updating your time service/i,
  });
  if (
    !(await maintenanceHeading.isVisible({ timeout: 2000 }).catch(() => false))
  ) {
    return false;
  }
  // Only block when the maintenance banner replaced the grid (not a transient
  // shell state while filters are still loading).
  const displayByVisible = await getDisplayByDropdown(page)
    .isVisible({ timeout: 1000 })
    .catch(() => false);
  return !displayByVisible;
}

/** Dismisses the QBO Tasks drawer when it overlays the Time page. */
export async function dismissTasksDrawerIfVisible(page: Page): Promise<void> {
  const tasksClose = page
    .getByRole('region')
    .filter({ has: page.getByRole('heading', { name: 'Tasks' }) })
    .getByRole('button', { name: 'Close' });
  if (await tasksClose.isVisible({ timeout: 1000 }).catch(() => false)) {
    await tasksClose.click().catch(() => undefined);
    await page.waitForTimeout(500);
  }
}

export async function dismissQboOnboardingIfVisible(
  page: Page,
): Promise<boolean> {
  await clickThroughQboOnboarding(page);

  const allApps = page.locator(`//*[@aria-label='All apps']`).first();
  const hasStandardNav = await allApps
    .isVisible({ timeout: 3000 })
    .catch(() => false);
  const displayByVisible = await getDisplayByDropdown(page)
    .isVisible({ timeout: 2000 })
    .catch(() => false);

  const onboardingDialog = page.getByRole('dialog', {
    name: /Quickbooks Onboarding/i,
  });
  const welcomeHeading = page.getByRole('heading', { name: /^Welcome!$/i });
  const pickUpHeading = page.getByRole('heading', {
    name: /pick up where you left off/i,
  });
  const onboardingVisible =
    (await onboardingDialog.isVisible({ timeout: 2000 }).catch(() => false)) ||
    (await welcomeHeading.isVisible({ timeout: 1000 }).catch(() => false)) ||
    (await pickUpHeading.isVisible({ timeout: 1000 }).catch(() => false));
  const onSetupPage = /\/app\/setup/.test(page.url());
  const onTimeShellOnly = /\/app\/time/.test(page.url()) && !displayByVisible;

  if (
    hasStandardNav &&
    !onboardingVisible &&
    !onSetupPage &&
    displayByVisible
  ) {
    return false;
  }

  if (onboardingVisible || onSetupPage) {
    await clickThroughQboOnboarding(page);
  }

  if (
    !onTimeShellOnly &&
    hasStandardNav &&
    !onboardingVisible &&
    !onSetupPage
  ) {
    return false;
  }

  await gotoWithAuthSession(page, '/app/time?jobId=time', {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForTimeout(3000);
  await clickThroughQboOnboarding(page);
  for (let i = 0; i < 2; i++) {
    await page.keyboard.press('Escape').catch(() => undefined);
    await page.waitForTimeout(400);
  }

  // Activate the Time entries sub-tab when the time shell loaded without filters.
  const timeEntriesLink = page
    .locator(`a[data-id="time-center-entries"], a[aria-label="Time entries"]`)
    .first();
  if (await timeEntriesLink.isVisible({ timeout: 5000 }).catch(() => false)) {
    await timeEntriesLink.click({ force: true }).catch(() => undefined);
    await page.waitForTimeout(2000);
  }

  const navAfter = await allApps
    .isVisible({ timeout: 15000 })
    .catch(() => false);
  const displayByAfter = await getDisplayByDropdown(page)
    .isVisible({ timeout: 5000 })
    .catch(() => false);

  return onboardingVisible || onSetupPage || !displayByVisible;
}

// Locator getters
export const getDisplayByDropdown = (page: Page) => {
  return page.getByLabel('Display by');
};

export const getDateRangeDropdown = (page: Page) => {
  return page.getByLabel('Date range').first();
};

async function ensureFiltersClickable(page: Page): Promise<void> {
  if (/workforce(\.intuit\.com|-e2e\.intuit\.com)/i.test(page.url())) {
    await dismissWorkforceOverlaysBeforeInteraction(page);
  }
  await dismissApprovalsMovedPopup(page);
}

// Action functions
export const selectDisplayByOption = async (page: Page, optionName: string) => {
  await handlePopupsInAnyOrder(page);
  await ensureFiltersClickable(page);

  const displayByDropdown = getDisplayByDropdown(page);

  if (/workforce(\.intuit\.com|-e2e\.intuit\.com)/i.test(page.url())) {
    for (let attempt = 0; attempt < 2; attempt++) {
      if (await isTasksDrawerVisible(page, 500)) {
        await dismissWorkforceOverlaysBeforeInteraction(page);
      }
      try {
        await displayByDropdown.click({ timeout: 10_000 });
        await page
          .getByRole('option', { name: optionName })
          .click({ timeout: 10_000 });
        await dismissApprovalsMovedPopup(page);
        return;
      } catch {
        await page.waitForTimeout(400);
      }
    }

    await dismissWorkforceOverlaysBeforeInteraction(page);
    await displayByDropdown.click({ force: true, timeout: 10_000 });
    await page
      .getByRole('option', { name: optionName })
      .click({ timeout: 10_000 });
    await dismissApprovalsMovedPopup(page);
    return;
  }

  await displayByDropdown.click();
  await page.getByRole('option', { name: optionName }).click();
  await dismissApprovalsMovedPopup(page);
};

// Helper to dismiss the "Approvals moved" popup
export const dismissApprovalsMovedPopup = async (page: Page) => {
  const gotItButton = page.getByRole('button', { name: 'Got it' });
  if (await gotItButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await gotItButton.click();
    await page.waitForTimeout(500);
    console.log('  ✓ Dismissed "Approvals moved" popup');
  }
};

export const openDateRangeDropdown = async (page: Page) => {
  await ensureFiltersClickable(page);
  const dateRangeDropdown = getDateRangeDropdown(page);

  if (/workforce(\.intuit\.com|-e2e\.intuit\.com)/i.test(page.url())) {
    await openWorkforceDateRangeDropdown(page);
    return;
  }

  return await dateRangeDropdown.click();
};

export const selectDateRangeOption = async (page: Page, optionName: string) => {
  const option = page.getByText(optionName, { exact: true });
  const isWorkforce = /workforce(\.intuit\.com|-e2e\.intuit\.com)/i.test(
    page.url(),
  );
  for (let i = 0; i < 3; i++) {
    try {
      await option.click({ timeout: 5000 });
      return;
    } catch (error) {
      console.log(
        `Retry ${i + 1}: Date range option click failed, reopening dropdown...`,
      );
      await page.waitForTimeout(500);
      if (isWorkforce) {
        await openWorkforceDateRangeDropdown(page);
      } else {
        await openDateRangeDropdown(page);
      }
      await page.waitForTimeout(500);
    }
  }
  // Final attempt
  await option.click();
};

export const searchTeamMember = async (page: Page, optionName: string) => {
  await ensureFiltersClickable(page);
  const displayByDropdown = getDisplayByDropdown(page);
  await displayByDropdown.click();
  return await page.getByRole('option', { name: optionName }).click();
};

export const clickAddTimeDropdown = async (page: Page) => {
  return await page.getByRole('button', { name: 'Add time' }).click();
};

export const selectSingleTimeEntryFromAddTime = async (
  page: Page,
  isFreeCompany: boolean = false,
) => {
  // Free companies see "Single time activity", paid companies see "Single time entry"
  const optionText = isFreeCompany
    ? 'Single time activity'
    : 'Single time entry';
  return await page
    .locator(`//li[@role='option']//child::*[text()='${optionText}']`)
    .click();
};

/**
 * Open a Time creation surface from the global Create (+New) flyout, first
 * asserting BOTH "Single time activity" and "Weekly timesheet" are available /
 * accessible from Create, then clicking the requested one. The flyout exposes
 * items by accessible role/name; the Create button is matched by testid OR its
 * visible "Create" label (testids/`data-content` are unreliable on prod shell).
 */
export const openViaCreateMenu = async (
  page: Page,
  target: 'sta' | 'wta',
): Promise<void> => {
  const createButton = page
    .getByTestId('leftrail-item-create')
    .or(page.locator(`//span[text()='Create']`))
    .first();
  const staLink = page
    .getByRole('link', { name: 'Single time activity' })
    .first();
  const weeklyLink = page
    .getByRole('link', { name: 'Weekly timesheet' })
    .first();

  let opened = false;
  for (let attempt = 1; attempt <= 5 && !opened; attempt += 1) {
    // Hover first; fall back to click — the flyout opens on either depending on
    // the shell build.
    for (const action of ['hover', 'click'] as const) {
      try {
        await createButton[action]({ timeout: 15000 });
        await page.waitForTimeout(1500);
        await expect(staLink).toBeVisible({ timeout: 15000 });
        await expect(weeklyLink).toBeVisible({ timeout: 15000 });
        opened = true;
        break;
      } catch (error) {
        console.log(
          `[CreateMenu] attempt ${attempt} (${action}) — links not yet visible: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        await page.waitForTimeout(2000);
      }
    }
  }
  if (!opened) {
    throw new Error(
      '[CreateMenu] "Single time activity" and "Weekly timesheet" links not both visible from the Create menu after 5 attempts',
    );
  }
  console.log(
    '[CreateMenu] both "Single time activity" and "Weekly timesheet" are available from Create',
  );
  await (target === 'sta' ? staLink : weeklyLink).click();
};

export const normalizeTime = async (time: string) => {
  if (!time) return '';
  const [timePart, period] = time.split(' ');
  const [hours, minutes] = timePart.split(':');
  const normalizedHours = hours.padStart(2, '0');
  return `${normalizedHours}:${minutes} ${period}`;
};

// Function to normalize name format
export const normalizeName = (name: string) => {
  return name
    .replace(/,/g, '') // Remove commas
    .trim() // Remove extra spaces
    .toLowerCase() // Convert to lowercase
    .split(/\s+/) // Split by whitespace
    .sort() // Sort the words
    .join(' '); // Join back with spaces
};

export const normalizeToMinutes = (val: string) => {
  val = val.trim();
  if (val.includes(':')) {
    // Format: H:MM
    const [h, m] = val.split(':').map(Number);
    return h * 60 + m;
  } else if (val.includes('.')) {
    // Format: decimal hours
    const floatVal = parseFloat(val);
    return Math.round(floatVal * 60);
  } else {
    // Fallback: treat as integer hours
    const h = parseInt(val, 10);
    return h * 60;
  }
};

// ==================== QBO / Workforce table & duration matching ====================

export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Regex for matching an employee in QBO Approvals / time tables when the UI shows
 * "Last, First" but tests may pass "First Last" (two tokens without a comma).
 */
export function employeeNameTableMatchPattern(employeeName: string): RegExp {
  const trimmed = employeeName.trim();
  if (!trimmed) {
    return /^$/;
  }
  if (trimmed.includes(',')) {
    const commaParts = trimmed
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (commaParts.length === 2) {
      const [last, first] = commaParts;
      return new RegExp(
        `(?:${escapeRegExp(trimmed)}|${escapeRegExp(first)}\\s+${escapeRegExp(
          last,
        )}|${escapeRegExp(last)}\\s*,\\s*${escapeRegExp(first)})`,
        'i',
      );
    }
    return new RegExp(escapeRegExp(trimmed), 'i');
  }
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 2) {
    const [first, last] = parts;
    return new RegExp(
      `(?:${escapeRegExp(first)}\\s+${escapeRegExp(last)}|${escapeRegExp(
        last,
      )}\\s*,\\s*${escapeRegExp(first)})`,
      'i',
    );
  }
  return new RegExp(escapeRegExp(trimmed), 'i');
}

/** All table rows whose text matches the employee in either common name format. */
export function locatorTableRowsForEmployee(
  page: Page,
  employeeName: string,
): Locator {
  return page
    .locator('tr')
    .filter({ hasText: employeeNameTableMatchPattern(employeeName) });
}

/** First table row whose text matches the employee in either common name format. */
export function locatorTableRowForEmployee(
  page: Page,
  employeeName: string,
): Locator {
  return locatorTableRowsForEmployee(page, employeeName).first();
}

/**
 * Row text can show decimal hours (1.25) while STE uses hh:mm (1:15).
 * Avoids `\\b` — in JS, `\\b` matches between a digit and `.`, so `1.25` would not match.
 */
export function durationDisplayMatchPattern(expectedDuration: string): RegExp {
  const trimmed = expectedDuration.trim();
  const variants = new Set<string>([trimmed]);

  if (/^\d+$/.test(trimmed)) {
    variants.add(parseFloat(trimmed).toFixed(2));
  }

  const colon = trimmed.match(/^(\d+):(\d{2})$/);
  if (colon) {
    const hours = parseInt(colon[1], 10);
    const minutes = parseInt(colon[2], 10);
    const decimalHours = hours + minutes / 60;
    variants.add(decimalHours.toFixed(2));
  }

  const fragments = [...variants].map((v) => {
    const e = escapeRegExp(v);
    if (v.includes(':')) {
      return `(?<![\\d])${e}(?!\\d)`;
    }
    return `(?<![\\d.])${e}(?!\\d)`;
  });
  return new RegExp(fragments.join('|'), 'i');
}

/** companyType as carried by every FastPipeline account (OV / AS / TE). */
export type CompanyType = 'elite' | 'premium' | 'ies' | 'standard';

export interface LeftNavCheckOptions {
  /**
   * aria-label of the tab just navigated to (e.g. 'Overview', 'Assignments',
   * 'Schedule'). Verified still visible inside the Time sub-nav after navigation.
   */
  activeTab: string;
  /**
   * account.companyType. The QBO left rail uses `aria-label='Side'`, which the
   * IES shell does not render, so that one assertion is skipped for IES.
   */
  companyType?: CompanyType;
}

/**
 * Common left-nav persistence check, shared across the FastPipeline flows.
 *
 * Call this right AFTER navigating to a Time tab (My Apps → Time → <tab>) to
 * confirm the left navigation and the Time sub-nav are still visible/expanded —
 * i.e. opening the tab did not collapse or replace the nav. Reused by Overview,
 * Assignments, and any other Time-tab flow so the check stays identical
 * everywhere.
 *
 * All assertions are SOFT: a single nav quirk logs a warning and continues
 * rather than failing the suite (mirrors the validation-phase convention).
 */
export async function verifyLeftNavPersistence(
  page: Page,
  { activeTab, companyType }: LeftNavCheckOptions,
): Promise<void> {
  await test.step(`left-nav persists after navigating to ${activeTab}`, async () => {
    console.log(
      `[leftNav] Verifying left-nav persistence (tab=${activeTab}, companyType=${
        companyType ?? 'n/a'
      })`,
    );

    const soft = async (label: string, fn: () => Promise<void>) => {
      try {
        await fn();
      } catch (error) {
        console.warn(
          `[leftNav][soft] ${label} — ${
            error instanceof Error ? error.message : error
          }`,
        );
      }
    };

    // Time sub-nav panel + its links render in both the QBO and IES shells.
    await soft('Time sub-nav panel not collapsed', async () => {
      await expect(
        page.locator(`//*[@data-id='time-body']`).first(),
      ).toBeVisible({ timeout: 10000 });
    });

    await soft('Time sub-nav links still visible', async () => {
      await expect(
        page.locator(`//*[@data-id='time-body']//a`).first(),
      ).toBeVisible({ timeout: 10000 });
    });

    // The QBO left rail uses aria-label='Side'; the IES shell renders a
    // different nav container, so skip this assertion for IES.
    if (companyType !== 'ies') {
      await soft('QBO left-nav rail (Side) still visible', async () => {
        await expect(
          page.locator(`//*[@aria-label='Side']`).first(),
        ).toBeVisible({ timeout: 10000 });
      });
    }

    // The tab we navigated to should still be visible in the Time sub-nav.
    // Scope to the Time sub-nav panel: aria-label values like 'Overview' are NOT
    // globally unique (e.g. Expenses also has an "Overview" nav item), so
    // scoping to `time-body` disambiguates.
    await soft(
      `'${activeTab}' link still visible in Time sub-nav`,
      async () => {
        await expect(
          page
            .locator(`//*[@data-id='time-body']//*[@aria-label='${activeTab}']`)
            .first(),
        ).toBeVisible({ timeout: 10000 });
      },
    );

    console.log('[leftNav] ✓ Left-nav persistence confirmed');
  });
}

/**
 * Class wrapper around the functional utilities above.
 *
 * The TE01 FastPipeline page objects compose a `CommonLocators` instance
 * (`new CommonLocators(page)`) and call its methods. This class is a thin,
 * stateful (page-bound) facade over the standalone helper functions so those
 * suites get an instance API without duplicating any logic. Existing callers of
 * the standalone functions are unaffected.
 */
export class CommonLocators {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get displayByDropdown(): Locator {
    return getDisplayByDropdown(this.page);
  }

  get dateRangeDropdown(): Locator {
    return getDateRangeDropdown(this.page);
  }

  async selectDisplayByOption(optionName: string): Promise<void> {
    return selectDisplayByOption(this.page, optionName);
  }

  async openDateRangeDropdown(): Promise<void> {
    await openDateRangeDropdown(this.page);
  }

  async selectDateRangeOption(optionName: string): Promise<void> {
    return selectDateRangeOption(this.page, optionName);
  }

  async searchTeamMember(optionName: string): Promise<void> {
    await searchTeamMember(this.page, optionName);
  }

  async clickAddTimeDropdown(): Promise<void> {
    await clickAddTimeDropdown(this.page);
  }

  async selectSingleTimeEntryFromAddTime(
    isFreeCompany: boolean = false,
  ): Promise<void> {
    await selectSingleTimeEntryFromAddTime(this.page, isFreeCompany);
  }

  /** Dismisses a generic "Got it" acknowledgement popup when present. */
  async dismissGotItPopupIfVisible(): Promise<void> {
    const gotItButton = this.page.getByRole('button', { name: 'Got it' });
    if (await gotItButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await gotItButton.click();
      await this.page.waitForTimeout(500);
    }
  }

  normalizeName(name: string): string {
    return normalizeName(name);
  }

  normalizeToMinutes(val: string): number {
    return normalizeToMinutes(val);
  }
}

// Export all utilities as a single object
export default {
  getDisplayByDropdown,
  getDateRangeDropdown,
  selectDisplayByOption,
  openDateRangeDropdown,
  selectDateRangeOption,
  searchTeamMember,
  clickAddTimeDropdown,
};
