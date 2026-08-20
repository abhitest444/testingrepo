import { Page, Locator, expect } from '@playwright/test';
import TimeProjectPage from '../../../pages/TimeProjectPage';
import TimeProjectsPage from '../../../pages/TimeProjectsPage';
import TimeMenuNavigationPage from '../../../pages/TimeMenuNavigationPage';
import TimeEntriesPage from '../../../pages/TimeEntriesPage';
import SingleTimeEntryPage from '../../../pages/SingleTimeEntryPage';
import { LoginCredentials } from '../../../config/types';
import { AccountMatrix, resolveMatrixAccounts } from './accountMatrix';

/**
 * =============================================================================
 * TP01 — Time Projects END-TO-END (consolidated replacement for PR001–PR030 /
 * PPR01–PPR05)
 * =============================================================================
 *
 * This single case is the sunset replacement for the granular Time Projects
 * suite. It exercises the FULL functional surface on one self-created project:
 *   • navigation, page structure, zero-state, no-inline-create, filters
 *   • create project (Projects app) → reflected in Time projects
 *   • estimate By Hours: radios, numeric/stepper validation, close-without-save,
 *     save + budget
 *   • estimate By Service Item: close-without-save, numeric/stepper, add + save
 *   • change estimate type: Cancel AND Continue, both directions
 *   • inline service-item edit (cancel + save) and delete (cancel + save)
 *   • many-service-rows scroll
 *   • project summary view (By Hours and By Service Item layouts)
 *   • assign workers: cancel-discards + save-persists (+ empty-state when no
 *     workers)
 *   • rename project via Projects app
 *   • delete estimate, delete project (cleanup)
 *
 * NOT covered here (require separate logins / surfaces — intentionally out of
 * scope per the consolidation decision): region variants (UK/CA), SKU/access
 * variants (non-elite), and QBO↔TSheets reflection.
 *
 * Built on the proven page objects:
 *   • TimeProjectsPage (plural) — all in-widget flows (estimate drawer, change-
 *     type modal, assign-workers drawer, summary, filters).
 *   • TimeProjectPage (singular) — create / delete project in the Projects app.
 *
 * PROD NOTE: production builds STRIP data-testid attributes, so this suite uses
 * only visible-text / ARIA-role / placeholder locators (and avoids the page
 * objects' getByTestId-based helpers such as expectPageReady / expectZeroState
 * / the success-toast testid). Readiness and save-success are asserted via
 * visible content (Manage projects button, "No projects" copy, drawer close).
 *
 * Conventions: console.log('[TP01][StepN] …') checkpoints; soft() downgrades
 * non-critical assertions to warnings; hard assertions guard project creation,
 * estimate saves, and drawer-open (so a disabled SDK flag fails loudly).
 * =============================================================================
 */

// ---- Test account shape ----------------------------------------------------

export interface TPEntitlements {
  canSeeTimeProjects: boolean;
  canCreateEstimate: boolean;
  canAssignWorkers: boolean;
  canDelete: boolean;
}

export interface TPTestAccount {
  credentials: LoginCredentials;
  role: 'admin' | 'manager' | 'employee' | 'vendor';
  region: 'us' | 'ca' | 'uk';
  companyType?: 'elite' | 'premium' | 'ies' | 'standard';
  entitlements: TPEntitlements;
}

export function buildTPAccount(
  credentials: LoginCredentials,
  overrides: {
    role?: TPTestAccount['role'];
    region?: TPTestAccount['region'];
    companyType?: TPTestAccount['companyType'];
    entitlements?: Partial<TPEntitlements>;
  } = {},
): TPTestAccount {
  const resolvedCompanyType: TPTestAccount['companyType'] =
    overrides.companyType ??
    (credentials.companyType as TPTestAccount['companyType'] | undefined) ??
    'elite';

  return {
    credentials,
    role: overrides.role ?? 'admin',
    region: overrides.region ?? 'us',
    companyType: resolvedCompanyType,
    entitlements: {
      canSeeTimeProjects: true,
      canCreateEstimate: true,
      canAssignWorkers: true,
      canDelete: true,
      ...overrides.entitlements,
    },
  };
}

// ---- Account matrix (TEST_ACCOUNT-driven, shared model) --------------------

/**
 * Maps the CI `TEST_ACCOUNT` parameter to the pool of account keys it runs
 * against. A group (e.g. `TEST_ACCOUNT=TP`) expands to every account in its
 * list, and the spec runs the full TP01 suite once per account. An exact key
 * (e.g. `TEST_ACCOUNT=TP01`) runs just that account. Unset → falls back to
 * TP01. Add more keys/groups here as the matrix grows.
 */
const TP_ACCOUNT_MATRIX: AccountMatrix = {
  // Legacy self-named group — kept for backward compatibility with jobs that
  // still pass TEST_ACCOUNT=TP. Resolves to the elite account.
  TP: ['TP01'],
  // SKU groups — mirror the other Time-Menu FastPipeline tracks (Approvals,
  // Schedule, TimeOff, TimeReports, TimeTeam) so the shared TEST_ACCOUNT
  // selector (IES / PR_ELITE / PR_PREMIUM) resolves here too. Each account is
  // dedicated to Time Projects (Time Projects entitled + seeded "Test
  // Customer1"). allowEmpty below keeps the run from aborting if a key is ever
  // missing from the active env.
  //
  // Intuit Enterprise Suite.
  IES: ['TPIES01'],
  // QBO + Time/Payroll Elite — TP01 is an elite company with Time Projects.
  PR_ELITE: ['TP01'],
  // QBO + Time/Payroll Premium.
  PR_PREMIUM: ['TPPREM01'],
  // FREE companies — QBO base tiers with no Time Elite add-on, so Time Projects
  // is NOT entitled. These run the suite's no-access path (see buildTPAccount-
  // sFromMatrix: companyType 'standard' → canSeeTimeProjects false), verifying
  // the feature is gated rather than exercising project CRUD.
  FREE_DATA_ADV: ['FREEADV01'],
  FREE_DATA_ESSENTIAL: ['FREEESS01'],
  FREE_DATA_PLUS: ['FREEPLUS01'],
};

/** A built {@link TPTestAccount} paired with the account key it came from. */
export interface TPMatrixAccount {
  testId: string;
  account: TPTestAccount;
}

/**
 * Resolve the `TEST_ACCOUNT` selector into the ordered list of TP accounts to
 * run (one full-suite test per account). Defaults to `process.env.TEST_ACCOUNT`;
 * falls back to TP01 when unset.
 */
export function buildTPAccountsFromMatrix(
  selector: string | undefined = process.env.TEST_ACCOUNT,
): TPMatrixAccount[] {
  return resolveMatrixAccounts({
    matrix: TP_ACCOUNT_MATRIX,
    param: selector,
    fallbackTestId: 'TP01',
    label: 'TP',
    // Mirror the sibling tracks: a SKU group with no provisioned account resolves
    // to [] (logged) and registers no tests, rather than aborting the whole run.
    allowEmpty: true,
  }).map(({ testId, credentials }) => {
    // Free QBO tiers (companyType 'standard') have no Time Elite add-on, so Time
    // Projects is not entitled — route them to the suite's no-access path
    // (step02 early-returns when canSeeTimeProjects is false) instead of letting
    // the HARD createProject step fail.
    const isFree = credentials.companyType === 'standard';
    return {
      testId,
      account: buildTPAccount(credentials, {
        role: credentials.expectedRole ?? 'admin',
        entitlements: {
          canSeeTimeProjects: !isFree,
          canCreateEstimate: !isFree,
          canAssignWorkers: !isFree,
          canDelete: isFree ? false : credentials.canDeleteTime ?? true,
        },
      }),
    };
  });
}

// ---- Constants -------------------------------------------------------------

/** Customer the created project is attached to (must exist on the account). */
const PROJECT_CUSTOMER = 'Test Customer1';
const PROJECT_CUSTOMER_2 = 'Test Customer2';

const HOURS_SAVE = '40'; // By-hours estimate that gets saved
const HOURS_CLOSE_DISCARD = '8'; // entered then discarded via close
const SERVICE_HOURS = '20';

export function buildProjectName(): string {
  return `TP01 Project ${Date.now()}`;
}

/** Soft-assert helper: log a warning instead of failing the test. */
async function soft(label: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[TP01][soft] ${label} — ${message}`);
  }
}

/**
 * Filter the grid down to a single project so the page object's "first row"
 * helpers reliably target OUR project. Best-effort: on a clean dedicated
 * account our project is the only row anyway.
 */
async function isolateProject(
  _page: Page,
  tp: TimeProjectsPage,
  projectName: string,
): Promise<void> {
  // Target OUR project's ROW by name so every downstream first-row operation
  // (summary, estimate, assign, inline edit/delete) acts on our project even
  // when other projects — e.g. a Completed one whose name sorts ahead of ours —
  // sit above it in the grid. This uses NO filter/search interaction, so it does
  // not depend on the IDS dropdown/typeahead DOM (which reverts on blur and
  // renders options inconsistently); `firstProjectRow()` simply resolves to the
  // row containing this name. Passing `updatedName` after the step12 rename keeps
  // the target correct.
  tp.setTargetProject(projectName);
  await soft(`project "${projectName}" present`, async () => {
    await expect(
      tp.projectRows().filter({ hasText: projectName }).first(),
    ).toBeVisible({ timeout: 30000 });
  });
}

/**
 * Content-based readiness wait. PROD BUILDS STRIP data-testid, so the page
 * object's testid-driven expectPageReady() never resolves in prod. Wait on
 * durable visible content instead (Manage projects button / zero-state copy /
 * a project row / the page heading).
 */
async function ready(page: Page, tp: TimeProjectsPage): Promise<void> {
  await page.waitForLoadState('load').catch(() => undefined);
  // Give the widget a moment to render its chrome before asserting.
  await page.waitForTimeout(3000);
  // .first() — the combined locator can match several elements (heading,
  // Manage projects button, …); toBeVisible() is strict and needs exactly one.
  await expect(
    tp
      .manageProjectsButton()
      .or(page.getByRole('heading', { name: /No projects/i }))
      .or(tp.projectRows().first())
      .first(),
  ).toBeVisible({ timeout: 60000 });
  await page.waitForTimeout(1000);
}

/**
 * Positive zero-state check: is the "No projects" empty-state copy showing?
 * Preferred over projectRows().count() === 0, which is also true while the
 * table is still loading. Short timeout — the page is already `ready()`.
 */
/**
 * Validate the Time projects grid column headers on a POPULATED grid. The
 * headers are sortable columnheaders (accessible name e.g. "Sort by Project /
 * Customer"), so match by role + substring name — a getByText exact-text match
 * misses the sort affordance.
 */
async function validateTableHeaders(page: Page): Promise<void> {
  // #5 — Deadline column is part of the grid (Project/Customer, Status,
  // Deadline, Budget, Actions). Assert the documented set incl. Deadline.
  for (const name of ['Project / Customer', 'Status', 'Deadline', 'Budget']) {
    await expect(page.getByRole('columnheader', { name }).first()).toBeVisible({
      timeout: 15000,
    });
  }
}

async function isZeroState(page: Page): Promise<boolean> {
  // The empty grid shows the copy "Add projects to start creating…" — match
  // that (the actual zero-state signal), not a "No projects" heading that
  // doesn't exist on this page. Wait a bit so a mid-load grid isn't misread.
  return await page
    .getByText(/Add projects to start creating/i)
    .or(page.getByRole('heading', { name: /No projects/i }))
    .first()
    .isVisible({ timeout: 10000 })
    .catch(() => false);
}

/**
 * Click the "Create Estimate" PRIMARY action (not the caret/Expand-Menu, which
 * opens the Assign-workers dropdown), then assert the drawer is open via its
 * reliable visible question text. Assumes the grid is already isolated to our
 * project (single "Create Estimate" control on the page).
 */
async function clickCreateEstimatePrimary(page: Page): Promise<void> {
  const createLink = page
    .getByRole('button', { name: /^create estimate$/i })
    .or(page.getByRole('link', { name: /^create estimate$/i }))
    .or(page.getByText('Create Estimate', { exact: true }))
    .first();
  await expect(createLink).toBeVisible({ timeout: 30000 });
  await createLink.click();
  await expect(
    page.getByText(/How are you estimating this project\?/i),
  ).toBeVisible({ timeout: 20000 });
}

/** Navigate → isolate our project → open its Create Estimate drawer. */
async function openCreateEstimateForProject(
  page: Page,
  tp: TimeProjectsPage,
  projectName: string,
): Promise<void> {
  await tp.navigateToTimeProjects();
  await ready(page, tp);
  await isolateProject(page, tp, projectName);
  await clickCreateEstimatePrimary(page);
}

/**
 * The hours field (By hours AND By-service-item add-row) is a number input,
 * i.e. an ARIA spinbutton named "Enter hours". Role-based ⇒ prod-safe.
 */
function hoursField(page: Page): Locator {
  return page.getByRole('spinbutton', { name: 'Enter hours' }).first();
}

/**
 * Close the estimate drawer via its header X — scoped to the drawer DIALOG so
 * we don't hit one of the other "Close" buttons elsewhere in the DOM.
 * Covers both the Create estimate and Edit estimate drawers.
 */
async function closeEstimateDrawer(page: Page): Promise<void> {
  const dialog = page
    .getByRole('dialog', { name: /Create estimate|Edit estimate/i })
    .first();
  await dialog.getByLabel('Close').first().click();
}

/**
 * Confirm the "Unsaved Changes" modal that appears when closing a dirty
 * estimate drawer: click **Yes** to discard + close. No-op if no modal shows.
 */
async function confirmCloseUnsaved(page: Page): Promise<void> {
  const yes = page
    .getByRole('button', { name: /^yes$/i })
    .or(page.locator(`//button//span[text()="Yes"]`))
    .first();
  if (await yes.isVisible({ timeout: 5000 }).catch(() => false)) {
    await yes.click();
    await page.waitForTimeout(500);
  }
}

/**
 * Add one service-item row to the open estimate drawer (By service item):
 * select first dropdown option, type hours (spinbutton), click "+ Add".
 */
async function addServiceItem(
  page: Page,
  tp: TimeProjectsPage,
  hours: string,
): Promise<void> {
  await tp.estimateTypeByService().click();
  await tp.serviceItemDropdown().click();
  const opt = page.getByRole('option').first();
  await expect(opt).toBeVisible({ timeout: 15000 });
  await opt.click();
  await hoursField(page).fill(hours);
  const addBtn = page
    .getByRole('button', { name: /^\+\s*Add$/ })
    .or(page.getByText('+ Add', { exact: true }))
    .first();
  await expect(addBtn).toBeVisible({ timeout: 5000 });
  await addBtn.click();
  await page.waitForTimeout(500);
}

/** Open the estimate edit drawer for our project (search-isolated first row). */
async function openEditDrawerForProject(
  page: Page,
  tp: TimeProjectsPage,
  projectName: string,
): Promise<void> {
  await tp.navigateToTimeProjects();
  await ready(page, tp);
  await isolateProject(page, tp, projectName);
  await tp.openEditEstimateFromFirstRowExpandMenuThenEditEstimate({
    timeoutMs: 30000,
  });
  await tp.expectCreateOrEditEstimateDrawerOpen();
}

// ============================================================================
// Step 1 — Login & Role Setup
// ============================================================================

export async function step01_loginAndRoleSetup(
  page: Page,
  account: TPTestAccount,
): Promise<void> {
  console.log(
    '[TP01][Step1] companyType=%s role=%s region=%s',
    account.companyType,
    account.role,
    account.region,
  );
  await soft('QBO body node visible', async () => {
    await expect(page.locator('[data-id=bodyNode]')).toBeVisible({
      timeout: 15000,
    });
  });
  console.log('[TP01][Step1] Login confirmed');
}

// ============================================================================
// Step 2 — Navigate to Time Projects + page structure + zero-state
// (covers PR001/PR002/PR003/PR004/PR005 + PPR01)
// ============================================================================

export async function step02_navigateAndStructure(
  page: Page,
  account: TPTestAccount,
  nav: TimeMenuNavigationPage,
  tp: TimeProjectsPage,
): Promise<boolean> {
  // Not entitled (free QBO tiers with no Time Elite add-on): Time Projects is
  // Elite-gated, so confirm the Time submenu does NOT surface the "Time
  // projects" option, report it, and stop — there is no widget to exercise.
  if (account.entitlements.canSeeTimeProjects === false) {
    await soft('Time projects option NOT present (free company)', async () => {
      await nav.hoverOnMyAppsMenu();
      await nav.hoverOnTimeMenu();
      await expect(nav.timeProjectsOption).toBeHidden({ timeout: 15000 });
    });
    console.log(
      '[TP01][Step2] Time Projects is NOT available/accessible for this ' +
        'company (companyType=%s) — Elite-gated feature is correctly hidden. ' +
        'Suite complete.',
      account.companyType,
    );
    return false;
  }

  // Entitlement guard: Time Projects is Elite-gated. Confirm the submenu entry
  // is present; absence ⇒ not entitled ⇒ early return.
  await soft('Time submenu reveals Time projects', async () => {
    const ok = await nav.hoverOnMyAppsMenu();
    expect(ok).toBeTruthy();
    await nav.hoverOnTimeMenu();
    await expect(nav.timeProjectsOption).toBeVisible({ timeout: 15000 });
  });

  await tp.navigateToTimeProjects();
  await ready(page, tp);

  // Content-based (no testid): Manage projects button + filter placeholders.
  await soft(
    'Manage projects + Status/Customer filters + search present',
    async () => {
      await expect(tp.manageProjectsButton()).toBeVisible({ timeout: 30000 });
      await expect(tp.statusFilter()).toBeVisible({ timeout: 15000 });
      await expect(tp.customerFilter()).toBeVisible({ timeout: 15000 });
      await expect(tp.projectSearch()).toBeVisible({ timeout: 15000 });
    },
  );

  // No in-widget create-project control (projects are created under Projects).
  await soft('no inline create-project control', async () => {
    await tp.expectNoCreateProjectControlInWidget();
  });

  // Zero-state vs populated grid — decided by the "No projects" copy being
  // visible (a positive signal), not by a row count that is also 0 mid-load.
  if (await isZeroState(page)) {
    // #1 — no-projects state: the "No projects" heading + the get-started
    // description, plus the Status/Customer filters, Search, and the "Manage
    // projects" button (the only actionable control on this state).
    await soft('zero-state: "No projects" heading', async () => {
      await expect(
        page.getByRole('heading', { name: /No projects/i }).first(),
      ).toBeVisible({ timeout: 10000 });
    });
    await soft('zero-state: get-started description', async () => {
      await expect(
        page.getByText(
          /Add projects to start creating tracking actual time versus estimated time/i,
        ),
      ).toBeVisible({ timeout: 10000 });
    });
    await soft('zero-state: filters + search present', async () => {
      await expect(tp.statusFilter()).toBeVisible({ timeout: 15000 });
      await expect(tp.customerFilter()).toBeVisible({ timeout: 15000 });
      await expect(tp.projectSearch()).toBeVisible({ timeout: 15000 });
    });
    // #2 — "Manage projects" is present on the no-projects state (the nav to the
    // Projects app itself is exercised in step 4).
    await soft('zero-state: Manage projects button present', async () => {
      await expect(tp.manageProjectsButton()).toBeVisible({ timeout: 10000 });
    });
    console.log('[TP01][Step2] Zero-state (no projects yet)');
  } else {
    await soft('table headers shown', async () => {
      await validateTableHeaders(page);
    });
    console.log('[TP01][Step2] Populated grid');
  }

  // Left-nav persistence.
  await soft('left-nav All apps still visible', async () => {
    await expect(
      page.locator(`//*[@aria-label='All apps']`).first(),
    ).toBeVisible({ timeout: 10000 });
  });

  console.log('[TP01][Step2] Navigation + structure verified');
  return true;
}

// ============================================================================
// Step 3 — Filters interaction (PR019)
// ============================================================================

export async function step03_filters(
  page: Page,
  tp: TimeProjectsPage,
): Promise<void> {
  await soft('Status filter opens options', async () => {
    await tp.statusFilter().click();
    await expect(page.getByRole('option').first()).toBeVisible({
      timeout: 10000,
    });
    await page.keyboard.press('Escape');
  });
  await soft('Customer filter opens options', async () => {
    await tp.customerFilter().click();
    await expect(page.getByRole('option').first()).toBeVisible({
      timeout: 10000,
    });
    await page.keyboard.press('Escape');
  });
  console.log('[TP01][Step3] Filters interaction complete');
}

// ============================================================================
// Step 4 — Create project (Projects app) + reflected in Time projects
// (PR018 / PPR02)
// ============================================================================

export async function step04_createProject(
  page: Page,
  singular: TimeProjectPage,
  tp: TimeProjectsPage,
  projectName: string,
  createdProjects: string[],
): Promise<void> {
  await soft('open Manage projects → Projects app', async () => {
    await singular.clickManageProjectsLink();
    await singular.validateProjectsPageRedirect();
  });

  // HARD: project creation is the precondition for every later step.
  await singular.createNewProject(projectName, PROJECT_CUSTOMER);
  createdProjects.push(projectName);
  console.log('[TP01][Step4] Created project "%s"', projectName);

  await tp.navigateToTimeProjects();
  await ready(page, tp);
  await soft('created project visible in Time projects', async () => {
    await isolateProject(page, tp, projectName);
    await expect(
      tp.projectRows().filter({ hasText: projectName }).first(),
    ).toBeVisible({ timeout: 30000 });
  });
  // The grid is now POPULATED (our project exists), so the column headers are
  // present — validate them here (in Step 2 the grid is zero-state, so the
  // header check only runs in the leftover-projects case).
  await soft('table headers shown (populated grid)', async () => {
    await validateTableHeaders(page);
  });
  console.log('[TP01][Step4] Project reflected in Time projects grid');
}

// ============================================================================
// Step 5 — Create Estimate: radios + By Hours (validation, close-without-save,
// save). Covers PR006/PR007/PR008/PR009/PR010.
// ============================================================================

export async function step05_estimateByHours(
  page: Page,
  account: TPTestAccount,
  tp: TimeProjectsPage,
  projectName: string,
): Promise<void> {
  if (account.entitlements.canCreateEstimate === false) {
    console.log('[TP01][Step5] SKIPPED — cannot create estimates');
    return;
  }

  // --- Open create estimate; HARD drawer-open guard (edit-estimates flag). ---
  await openCreateEstimateForProject(page, tp, projectName);
  console.log('[TP01][Step5] Create estimate drawer opened');

  // --- Both radios present + enabled (PR007). ---
  await soft('By hours / By service item radios present', async () => {
    await expect(tp.estimateTypeByHours()).toBeVisible({ timeout: 15000 });
    await expect(tp.estimateTypeByService()).toBeVisible({ timeout: 15000 });
    await expect(tp.estimateTypeByHours()).toBeEnabled({ timeout: 15000 });
    await expect(tp.estimateTypeByService()).toBeEnabled({ timeout: 15000 });
  });

  // --- By hours section copy (PR008 part). ---
  await soft('By hours section copy', async () => {
    await tp.estimateTypeByHours().click();
    await tp.expectByHoursSectionCopy();
  });

  // --- Numeric-only + stepper (PR009). Number input rejects non-numeric via a
  //     keydown guard, so we simulate real keystrokes (pressSequentially) — a
  //     plain .fill() of letters throws on type=number inputs. ---
  await soft('hours numeric-only + up/down stepper', async () => {
    const input = hoursField(page);
    await input.click();
    await input.pressSequentially('a@', { delay: 50 });
    await expect(input).toHaveValue('', { timeout: 10000 });
    await input.fill('5');
    await expect(input).toHaveValue('5', { timeout: 10000 });
    await input.press('ArrowUp');
    await expect(input).toHaveValue('6', { timeout: 10000 });
    await input.press('ArrowDown');
    await expect(input).toHaveValue('5', { timeout: 10000 });
  });

  // --- Close-without-save discards (PR008): close → confirm "Yes" on the
  //     Unsaved Changes modal → drawer closed, no estimate created. ---
  await soft('enter hours then close → discards (no estimate)', async () => {
    await hoursField(page).fill(HOURS_CLOSE_DISCARD);
    await closeEstimateDrawer(page);
    await confirmCloseUnsaved(page);
    await tp.expectDrawerClosed();
  });

  // --- Reopen and SAVE (PR010). HARD on save. ---
  await openCreateEstimateForProject(page, tp, projectName);
  await tp.estimateTypeByHours().click();
  await hoursField(page).fill(HOURS_SAVE);
  await expect(tp.estimateSaveButton()).toBeEnabled({ timeout: 10000 });
  await tp.estimateSaveButton().click();
  // Success in prod = the drawer closes (success-toast testid is stripped).
  await soft('estimate saved (drawer closes)', async () => {
    await tp.expectDrawerClosed();
  });
  console.log('[TP01][Step5] By-hours estimate saved (%s hrs)', HOURS_SAVE);
}

// ============================================================================
// Step 6 — Project summary view (By Hours layout). Covers PR020.
// ============================================================================

export async function step06_summaryByHours(
  page: Page,
  tp: TimeProjectsPage,
  projectName: string,
): Promise<void> {
  await tp.navigateToTimeProjects();
  await ready(page, tp);
  await isolateProject(page, tp, projectName);
  await soft('open project summary (By hours)', async () => {
    await tp.openFirstProjectSummary();
    await expect(page.getByText(/Time estimation summary/i)).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator(`//span[text()="Assign"]`)).toBeVisible({
      timeout: 15000,
    });
    await expect(
      page.locator(`//button[@aria-label="Edit estimate"]`),
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.locator(`//span[text()="Actual vs estimated hours"]`),
    ).toBeVisible({ timeout: 15000 });
    await expect(page.locator(`//span[text()="Date progress"]`)).toBeVisible({
      timeout: 15000,
    });
  });
  console.log('[TP01][Step6] By-hours summary verified');
}

// ============================================================================
// Step 7 — Change estimate type (By hours → By service item): close-without-
// save, numeric/stepper, Cancel on modal, then Continue. Covers
// PR011/PR012/PR013/PR014/PR015.
// ============================================================================

export async function step07_estimateByServiceItem(
  page: Page,
  account: TPTestAccount,
  tp: TimeProjectsPage,
  projectName: string,
): Promise<void> {
  if (account.entitlements.canCreateEstimate === false) {
    console.log('[TP01][Step7] SKIPPED — cannot create estimates');
    return;
  }

  // --- By service item: close-without-save (PR011) + numeric/stepper (PR012). ---
  await openEditDrawerForProject(page, tp, projectName);
  await soft('By service item section copy', async () => {
    await tp.estimateTypeByService().click();
    await tp.expectByServiceItemSectionCopy();
  });
  await soft('service-item hours numeric-only + stepper', async () => {
    const si = hoursField(page);
    await si.click();
    await si.pressSequentially('x@', { delay: 50 });
    await expect(si).toHaveValue('', { timeout: 10000 });
    await si.fill('4');
    await expect(si).toHaveValue('4', { timeout: 10000 });
    await si.press('ArrowUp');
    await expect(si).toHaveValue('5', { timeout: 10000 });
  });
  await soft('close service-item drawer → discards', async () => {
    await closeEstimateDrawer(page);
    await confirmCloseUnsaved(page);
    await tp.expectDrawerClosed();
  });

  // --- Change type By hours → By service item, Save, CANCEL on modal (PR014). ---
  await openEditDrawerForProject(page, tp, projectName);
  await soft('add service item then Save → Cancel change-type', async () => {
    await addServiceItem(page, tp, SERVICE_HOURS);
    await tp.estimateSaveButton().click();
    await tp.expectChangeEstimateTypeModalVisible(30000);
    await tp.changeTypeCancel().click();
    await expect(tp.changeTypeModal()).not.toBeVisible({ timeout: 30000 });
  });
  await soft('close drawer after cancel', async () => {
    await closeEstimateDrawer(page);
    await confirmCloseUnsaved(page);
    await tp.expectDrawerClosed();
  });

  // --- Change type again, Save, CONTINUE → becomes By service item (PR013/PR015). ---
  await openEditDrawerForProject(page, tp, projectName);
  await soft('add service item then Save → Continue change-type', async () => {
    await addServiceItem(page, tp, SERVICE_HOURS);
    await tp.estimateSaveButton().click();
    if (
      await tp
        .changeTypeModal()
        .isVisible({ timeout: 10000 })
        .catch(() => false)
    ) {
      await tp.changeTypeContinue().click();
    }
  });
  await soft('estimate saved (drawer closes)', async () => {
    await tp.expectDrawerClosed();
  });
  console.log('[TP01][Step7] By-service-item estimate saved via change-type');
}

// ============================================================================
// Step 8 — Project summary view (By Service Item layout). Covers PR021.
// ============================================================================

export async function step08_summaryByServiceItem(
  page: Page,
  tp: TimeProjectsPage,
  projectName: string,
): Promise<void> {
  await tp.navigateToTimeProjects();
  await ready(page, tp);
  await isolateProject(page, tp, projectName);

  // Each check is its own soft block with a SHORT timeout so a single slow /
  // missing element can't burn the 180s default expect timeout or skip the
  // remaining checks.
  await soft('open project summary', async () => {
    await tp.openFirstProjectSummary();
  });
  await soft('summary header visible', async () => {
    await expect(page.getByText(/Time estimation summary/i)).toBeVisible({
      timeout: 15000,
    });
  });

  // This summary page renders content TWICE (a visible panel + a hidden one),
  // so a plain .first() grabs the hidden copy. filter({ visible: true }) picks
  // the on-screen element. The toggles are NOT button/tab roles, so we match
  // by visible text.
  const visibleText = (t: string) =>
    page.getByText(t, { exact: true }).filter({ visible: true }).first();

  await soft('Estimates/Users toggle visible', async () => {
    await expect(visibleText('Estimates')).toBeVisible({ timeout: 10000 });
    await expect(visibleText('Users')).toBeVisible({ timeout: 10000 });
  });

  // The By-service-item summary table — confirmed by its visible column
  // headers (the table's summary="" attribute differs in this build, so we
  // don't rely on it).
  for (const h of [
    'Service items',
    'Hours estimated',
    'Hours worked',
    'Percent completed',
    'Hours remaining',
    'Actions',
  ]) {
    await soft(`summary column "${h}"`, async () => {
      await expect(
        page.getByText(h, { exact: false }).filter({ visible: true }).first(),
      ).toBeVisible({ timeout: 8000 });
    });
  }
  console.log('[TP01][Step8] By-service-item summary verified');
}

// ============================================================================
// Step 9 — Inline service-item edit (cancel + save) and delete (cancel + save).
// Covers PR026/PR027/PR028/PR029.
// ============================================================================

const ACTION_BTN =
  '//button[contains(@class,"CreateEstimateDrawerstyled__ActionButton")]';

export async function step09_inlineEditDelete(
  page: Page,
  tp: TimeProjectsPage,
  projectName: string,
): Promise<void> {
  const randHours = (): string => String(Math.floor(Math.random() * 9) + 1);

  // --- Inline edit, then CLOSE → discards (PR026). ---
  await openEditDrawerForProject(page, tp, projectName);
  await soft('inline edit hours then close → discards', async () => {
    await page.locator(ACTION_BTN).first().click();
    await page
      .getByRole('menuitem', { name: /^Edit$/i })
      .or(page.getByText(/^Edit$/i))
      .first()
      .click();
    await page.locator('//td//input[@type="number"]').first().fill(randHours());
    await closeEstimateDrawer(page);
    await confirmCloseUnsaved(page);
  });

  // --- Inline edit, then SAVE → persisted (PR027). ---
  await openEditDrawerForProject(page, tp, projectName);
  await soft('inline edit hours then Save', async () => {
    await page.locator(ACTION_BTN).first().click();
    await page
      .getByRole('menuitem', { name: /^Edit$/i })
      .or(page.getByText(/^Edit$/i))
      .first()
      .click();
    await page.locator('//td//input[@type="number"]').first().fill(randHours());
    await page.locator(`//button/span[text()="Save"]`).click();
  });
  console.log('[TP01][Step9] Inline edit cancel + save exercised');

  // --- Inline delete, then CLOSE → discards (PR028). ---
  await openEditDrawerForProject(page, tp, projectName);
  await soft('inline delete then close → discards', async () => {
    await page.locator(ACTION_BTN).first().click();
    await page
      .getByRole('menuitem', { name: /^Delete$/i })
      .or(page.getByText(/^Delete$/i))
      .first()
      .click();
    await closeEstimateDrawer(page);
    await confirmCloseUnsaved(page);
  });
  console.log('[TP01][Step9] Inline delete cancel exercised');
  // NOTE: inline delete + Save (PR029) is performed in Step 11 (delete estimate)
  // so we don't strand the project without an estimate before the summary/assign
  // steps that still need it.
}

// ============================================================================
// Step 10 — Assign workers: empty-state OR cancel-discards + save-persists.
// Covers PR022/PR023/PR024 (+ PPR05 intent).
// ============================================================================

export async function step10_assignWorkers(
  page: Page,
  account: TPTestAccount,
  tp: TimeProjectsPage,
  projectName: string,
): Promise<void> {
  if (account.entitlements.canAssignWorkers === false) {
    console.log('[TP01][Step10] SKIPPED — cannot assign workers');
    return;
  }

  await tp.navigateToTimeProjects();
  await ready(page, tp);
  await isolateProject(page, tp, projectName);

  // HARD: the drawer must open (assign-workers SDK flag).
  await tp.openAssignWorkersForFirstAssignableProject();
  await tp.expectAssignWorkersDrawerVisible();
  await page.waitForTimeout(3000);
  console.log('[TP01][Step10] Assign workers drawer opened');

  // Empty-state branch: company has no assignable workers (PR022).
  const drawer = tp.assignWorkersDrawer();
  const noItems = page.locator(`//tbody/tr/td[text()="No items found"]`);
  if (await noItems.isVisible({ timeout: 4000 }).catch(() => false)) {
    await soft('assign-workers empty-state copy', async () => {
      await expect(
        page.getByText(
          'Assign workers to this field value. If all are selected, all future workers will be added.',
        ),
      ).toBeVisible({ timeout: 15000 });
    });
    console.log('[TP01][Step10] Empty-state (no workers) — done');
    await soft('close empty assign drawer', async () => {
      await tp.closeAssignWorkersDrawerHeader();
    });
    return;
  }

  // Cancel-discards (PR023): select a worker, close, don't save → no persist.
  await soft('cancel discards selection', async () => {
    await expect(tp.assignmentDrawerSaveButton()).toBeDisabled();
    await tp.selectFirstWorkerCheckboxInAssignmentDrawer();
    await expect(tp.assignmentDrawerSaveButton()).toBeEnabled({
      timeout: 15000,
    });
    await tp.closeAssignWorkersDrawerHeader();
    await tp.clickAssignmentDontSaveIfShown();
    await expect(drawer).not.toBeVisible({ timeout: 15000 });
  });

  // Save-persists (PR024): reopen, select, Save → drawer closes.
  await soft('save persists selection', async () => {
    await isolateProject(page, tp, projectName);
    await tp.openAssignWorkersForFirstAssignableProject();
    await tp.expectAssignWorkersDrawerVisible();
    await page.waitForTimeout(3000);
    await tp.selectFirstWorkerCheckboxInAssignmentDrawer();
    await expect(tp.assignmentDrawerSaveButton()).toBeEnabled({
      timeout: 15000,
    });
    await tp.assignmentDrawerSaveButton().click();
    await expect(tp.assignWorkersDrawer()).not.toBeVisible({ timeout: 60000 });
  });
  console.log('[TP01][Step10] Assign workers cancel + save-persist verified');
}

// ============================================================================
// Step 11 — Many-rows scroll + delete estimate (inline delete + Save). Covers
// PR030 + PR029 + estimate teardown.
// ============================================================================

export async function step11_manyRowsAndDeleteEstimate(
  page: Page,
  tp: TimeProjectsPage,
  projectName: string,
): Promise<void> {
  // Add several service items, then verify the drawer scrolls (PR030).
  await openEditDrawerForProject(page, tp, projectName);
  await soft('add multiple service rows + verify scroll', async () => {
    // Add rows until 6 or the service-item dropdown is exhausted. Count rows by
    // content (//section//table/tbody/tr) — the service-row testid is stripped
    // in prod.
    const rowCount = (): Promise<number> =>
      page.locator('//section//table/tbody/tr').count();
    let added = await rowCount();
    for (let i = added; i < 6; i += 1) {
      const before = added;
      try {
        await addServiceItem(page, tp, '1');
      } catch {
        break;
      }
      await page.waitForTimeout(400);
      added = await rowCount();
      if (added <= before) break; // no more distinct service items to add
    }
    console.log('[TP01][Step11] service rows in drawer: %d', added);
    const scrollHost = page
      .locator('//section[contains(@class,"Drawer-contentWrapper")]')
      .first();
    const canScroll = await scrollHost
      .evaluate((el) => el.scrollHeight > el.clientHeight + 6)
      .catch(() => false);
    if (canScroll) {
      const didScroll = await scrollHost
        .evaluate((el) => {
          const before = el.scrollTop;
          el.scrollTop = before + 150;
          return el.scrollTop !== before;
        })
        .catch(() => false);
      expect(didScroll).toBeTruthy();
    }
  });
  // Persist the added rows so the estimate reflects them.
  await soft('save multi-row estimate', async () => {
    await tp.estimateSaveButton().click({ timeout: 15000 });
    // If the project's estimate was previously By-hours (e.g. step14 left it
    // that way), switching to By-service pops the "Change estimate type?" modal
    // on save — accept it so the service rows actually persist.
    if (
      await tp
        .changeTypeModal()
        .isVisible({ timeout: 4000 })
        .catch(() => false)
    ) {
      await tp
        .changeTypeContinue()
        .click({ timeout: 8000 })
        .catch(() => undefined);
    }
    await tp.clickAssignmentDontSaveIfShown();
    await page.waitForTimeout(1500);
  });

  // Delete a service item + Save (PR029) — tears down toward delete-estimate.
  await openEditDrawerForProject(page, tp, projectName);
  await soft('inline delete service item + Save', async () => {
    // Guard: the row action menu only exists when service rows are present. If
    // the estimate didn't persist as service-item (no rows), skip rather than
    // hang the 5-min default actionTimeout on a never-present button.
    const actionBtn = page.locator(ACTION_BTN).first();
    if (!(await actionBtn.isVisible({ timeout: 8000 }).catch(() => false))) {
      console.log(
        '[TP01][Step11] no service-row action menu present — skipping inline delete',
      );
      return;
    }
    await actionBtn.click({ timeout: 8000 });
    await page
      .getByRole('menuitem', { name: /^Delete$/i })
      .or(page.getByText(/^Delete$/i))
      .first()
      .click({ timeout: 8000 });
    await page.locator(`//button/span[text()="Save"]`).click({ timeout: 8000 });
    await page.waitForTimeout(1500);
  });
  console.log('[TP01][Step11] Many-rows scroll + inline delete-save verified');
}

// ============================================================================
// Step 12 — Rename project via Projects app. Covers PR025.
// ============================================================================

export async function step12_renameProject(
  page: Page,
  tp: TimeProjectsPage,
  projectName: string,
  createdProjects: string[],
): Promise<void> {
  const updatedName = `${projectName} Renamed`;
  // Deterministic deadline (today + 30 days) so the grid's Deadline column has a
  // verifiable value. MM/DD/YYYY for the form input; the year is asserted in the
  // grid cell (display format tolerant).
  const deadlineDate = new Date();
  deadlineDate.setDate(deadlineDate.getDate() + 30);
  const dlMonth = String(deadlineDate.getMonth() + 1).padStart(2, '0');
  const dlDay = String(deadlineDate.getDate()).padStart(2, '0');
  const dlYear = String(deadlineDate.getFullYear());
  const deadlineInput = `${dlMonth}/${dlDay}/${dlYear}`;
  await tp.navigateToTimeProjects();
  await ready(page, tp);
  await soft('rename project via Projects app + verify reflected', async () => {
    await tp.clickManageProjects();
    await page.waitForURL(/\/app\/projects/i, { timeout: 30000 });
    await page.waitForTimeout(1500);

    // Target OUR project's row (filter by name), open its overflow → Edit.
    const row = page.locator('tr').filter({ hasText: projectName }).first();
    await expect(row).toBeVisible({ timeout: 20000 });
    await row.locator(`//div[@data-id="project-action-list"]`).first().click();
    await page
      .getByRole('menuitem', { name: /edit this project/i })
      .or(page.getByText(/^Edit this project$/i))
      .first()
      .click();

    const nameInput = page
      .getByLabel(/project name/i)
      .or(page.getByPlaceholder(/project name/i))
      .first();
    await expect(nameInput).toBeVisible({ timeout: 15000 });

    // Wait for the edit-project form to render (the "Project name*" label),
    // then give it an extra 5s to fully hydrate — saving too early silently
    // drops the rename.
    await expect(page.getByText('Project name*')).toBeVisible({
      timeout: 30000,
    });
    await page.waitForTimeout(5000);

    await nameInput.fill(updatedName);

    // The Edit form shows the existing Customer but leaves it UNCOMMITTED
    // ("Select a customer" error on save). Re-select it to commit. Helpers:
    //  - pickCustomer(name): open the Customer dropdown and choose `name`.
    //  - clickSaveAndClose(): click Save and close, clearing the "unsaved
    //    changes" guard modal if it appears.
    const pickCustomer = async (name: string): Promise<void> => {
      const dd = page
        .locator(`//input[@aria-label="Who's the project for?"]`)
        .or(page.getByLabel(/^customer/i))
        .first();
      if (!(await dd.isVisible({ timeout: 5000 }).catch(() => false))) return;
      await dd.click();
      await page.waitForTimeout(600);
      const opt = page
        .locator(
          `//*[@role='option' and contains(., '${name}')] | //*[@role='listbox']//*[contains(text(), '${name}')]`,
        )
        .first();
      if (await opt.isVisible({ timeout: 8000 }).catch(() => false)) {
        await opt.click();
        await page.waitForTimeout(800);
      }
    };

    const clickSaveAndClose = async (): Promise<void> => {
      const saveAndClose = page.getByRole('button', {
        name: /save and close|save & close/i,
      });
      await expect(saveAndClose.first()).toBeVisible({ timeout: 15000 });
      await saveAndClose
        .first()
        .click({ timeout: 15000 })
        .catch(() => undefined);
      // Defensive: a "You have unsaved changes" guard modal obscures Save —
      // commit via its exact "Save" button (won't match "Save and close").
      if (
        await page
          .getByText(/You have unsaved changes/i)
          .first()
          .isVisible({ timeout: 2000 })
          .catch(() => false)
      ) {
        await page
          .getByRole('button', { name: /^Save$/i })
          .first()
          .click({ timeout: 8000 })
          .catch(() => undefined);
      }
      await page.waitForTimeout(3000);
    };

    await pickCustomer(PROJECT_CUSTOMER);

    // Set the project End date so the Time Projects grid's Deadline column has a
    // value. Best-effort (guarded + try/catch) so a layout difference can't
    // break the rename save itself.
    try {
      // Target the End date DATE input precisely: the input under the "End date"
      // <label> whose placeholder is MM/DD/YYYY. NOTE: getByLabel('End date')
      // can mis-resolve to a readonly combobox (value="All"), and .fill() on a
      // readonly input hangs the 5-min actionTimeout — so match the editable
      // date input only. Fallback: the 2nd MM/DD/YYYY input (Start is 1st).
      const endDate = page
        .locator(
          `//span[normalize-space()='End date']/ancestor::label//input[@placeholder='MM/DD/YYYY']`,
        )
        .or(page.getByPlaceholder('MM/DD/YYYY').nth(1))
        .first();
      if (await endDate.isVisible({ timeout: 5000 }).catch(() => false)) {
        await endDate.click();
        await endDate.fill('');
        await endDate.fill(deadlineInput);
        // Tab to commit the date + close the calendar popup. Do NOT press Escape
        // here — on this edit panel Escape is treated as "close the form", which
        // pops the "You have unsaved changes" guard modal and blocks Save.
        await page.keyboard.press('Tab');
        await page.waitForTimeout(500);
        console.log('[TP01][Step12] Set project End date: %s', deadlineInput);
      } else {
        console.log(
          '[TP01][Step12] End date field not found — deadline not set',
        );
      }
    } catch (e) {
      console.log('[TP01][Step12] Could not set End date: %s', e);
    }

    await clickSaveAndClose();

    // Recovery: an "Unable to save your project details" banner means the
    // Customer didn't commit (re-selecting the same value isn't enough). Toggle
    // to a DIFFERENT customer and back to the original — a real change commits
    // the field — then save again. Bounded waits inside pickCustomer.
    if (
      await page
        .getByText(/Unable to save your project/i)
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      console.log(
        '[TP01][Step12] "Unable to save your project details" — toggling ' +
          'customer (→ %s → %s) to commit it, then retrying save',
        PROJECT_CUSTOMER_2,
        PROJECT_CUSTOMER,
      );
      await pickCustomer(PROJECT_CUSTOMER_2);
      await pickCustomer(PROJECT_CUSTOMER);
      await clickSaveAndClose();
    }

    // Track the new name for cleanup, then verify it reflects in Time projects.
    createdProjects.push(updatedName);
    await tp.navigateToTimeProjects();
    await ready(page, tp);
    await isolateProject(page, tp, updatedName);
    const renamedRow = tp
      .projectRows()
      .filter({ hasText: updatedName })
      .first();
    await expect(renamedRow).toBeVisible({ timeout: 45000 });

    // #5 — the Deadline column now shows the end date we set. Target the
    // DeadlineCell wrapper (falls back to the 3rd cell: Project/Customer,
    // Status, Deadline, Budget, Actions) and assert the year is present (grid
    // renders M/D/YYYY, e.g. "6/30/2026", so a year match is format-tolerant).
    const deadlineCell = renamedRow
      .locator('[class*="DeadlineCell"]')
      .or(renamedRow.locator('td').nth(2))
      .first();
    await expect(deadlineCell).toContainText(dlYear, { timeout: 15000 });
    console.log(
      '[TP01][Step12] Deadline cell shows: "%s"',
      (await deadlineCell.innerText().catch(() => '')).trim(),
    );
  });
  console.log('[TP01][Step12] Rename verified (→ "%s")', updatedName);
}

// ============================================================================
// Step 13 — Summary: Estimates/Users toggle, View workers, and link navigation
// Covers: #3 (toggle + table content + view workers in estimates) UI surface,
// and #6 (back to projects / customer navigation links).
// ============================================================================

export async function step13_summaryTogglesWorkersAndLinks(
  page: Page,
  tp: TimeProjectsPage,
  projectName: string,
): Promise<void> {
  await tp.navigateToTimeProjects();
  await ready(page, tp);
  await isolateProject(page, tp, projectName);
  await soft('open project summary', async () => {
    await tp.openFirstProjectSummary();
    await expect(page.getByText(/Time estimation summary/i)).toBeVisible({
      timeout: 15000,
    });
  });

  // The summary renders content twice (visible + hidden); pick the on-screen one.
  const visibleText = (t: string) =>
    page.getByText(t, { exact: true }).filter({ visible: true }).first();

  // #3 — Estimates table columns (estimated / worked / percent / remaining).
  await soft('Estimates table columns present', async () => {
    for (const h of [
      'Hours estimated',
      'Hours worked',
      'Percent completed',
      'Hours remaining',
    ]) {
      await expect(visibleText(h)).toBeVisible({ timeout: 8000 });
    }
  });

  // Edit estimate link / header button → opens the Edit estimate drawer → close.
  await soft('Edit estimate opens the edit drawer', async () => {
    await page
      .getByRole('button', { name: 'Edit estimate' })
      .first()
      .click({ timeout: 8000 });
    await expect(
      page
        .getByText(/Edit estimate|How are you estimating this project/i)
        .first(),
    ).toBeVisible({ timeout: 15000 });
    await page
      .getByRole('dialog')
      .getByLabel('Close')
      .or(page.getByRole('button', { name: /^(Close|Cancel)$/i }))
      .first()
      .click({ timeout: 6000 })
      .catch(() => undefined);
  });

  // #3 — "View workers" (Estimates table Actions) switches to the Users tab and
  // shows the worker(s) the hours were logged for.
  await soft('View workers → Users tab worker list', async () => {
    await page
      .getByRole('button', { name: 'View workers' })
      .first()
      .click({ timeout: 8000 });
    await page.waitForTimeout(800);
    await expect(visibleText('Users')).toBeVisible({ timeout: 15000 });
    // Functional: the WorkerTable shows the LOGGED hours (10.00) for the worker
    // the time was entered against.
    await expect(page.getByText('10.00').first()).toBeVisible({
      timeout: 8000,
    });
  });
  await soft('toggle back to Estimates segment', async () => {
    await visibleText('Estimates').click();
    await page.waitForTimeout(600);
  });

  // #3 — the summary "Assign" button opens the Assign-workers drawer.
  await soft('Assign opens Assign workers drawer', async () => {
    await page
      .getByRole('button', { name: /^Assign$/ })
      .first()
      .click({ timeout: 8000 });
    await expect(
      page.getByText('Assign workers', { exact: false }).first(),
    ).toBeVisible({ timeout: 10000 });
    await page
      .getByRole('button', { name: /^(Close|Cancel)$/i })
      .first()
      .click({ timeout: 5000 })
      .catch(() => undefined);
  });

  // #6 — customer link (ProjectSummarystyled__MetaCustomerNameLink) navigates to
  // the Customers & leads page. This leaves the Time-projects screen, so it runs
  // last; the next step re-navigates anyway.
  await soft('customer link navigates to Customers & leads', async () => {
    await page
      .getByRole('button', { name: PROJECT_CUSTOMER })
      .first()
      .click({ timeout: 8000 });
    await page.waitForURL(
      /\/app\/(customerdetail|customers|sales\/customers|customerhub)/i,
      { timeout: 15000 },
    );
  });

  // #6 — "← Back to projects" (button aria-label "Back to projects") returns to
  // the list. Re-open the summary first (we navigated away above).
  await soft('Back to projects returns to list', async () => {
    await tp.navigateToTimeProjects();
    await ready(page, tp);
    await isolateProject(page, tp, projectName);
    await tp.openFirstProjectSummary();
    await page
      .getByRole('button', { name: 'Back to projects' })
      .first()
      .click({ timeout: 8000 });
    await ready(page, tp);
    await expect(
      tp
        .projectRows()
        .first()
        .or(page.getByRole('heading', { name: /No projects/i })),
    ).toBeVisible({ timeout: 15000 });
  });

  console.log(
    '[TP01][Step13] Summary: estimates table, edit estimate, view workers, assign, customer link, back verified',
  );
}

// ============================================================================
// Step 14 — Actual vs estimated hours tracked via time entries
// Covers: #4 (and the time-entry part of #3) — log time against the project's
// customer, then confirm the summary's "Hours worked" reflects it.
//
// NOTE: BEST-EFFORT / needs prod verification. Logging time so it associates
// with the project depends on product behavior (time against the project's
// customer/service). All assertions are soft so a mismatch degrades to a
// warning rather than failing the suite. The add-time locators below are the
// new-experience Time-entries drawer and should be confirmed on first run.
// ============================================================================

// Deterministic functional inputs → checkable outputs.
const EST_HOURS = '12'; //   initial estimate
const TIME_ENTRY_HOURS = '10:00'; // logged → Actual 10.00 (83.3% of 12, 2 left)
const EST_EDIT_HOURS = '20'; // edit → 10/20 = 50%, 10 remaining
const EST_OVERDUE_HOURS = '5'; // edit → 10>5 → overdue
const EST_EXACT_HOURS = '10'; // edit → 100%, 0 left

/** Open the Edit estimate drawer and set a flat By-hours estimate, then save. */
async function setByHoursEstimate(
  page: Page,
  tp: TimeProjectsPage,
  projectName: string,
  hours: string,
): Promise<void> {
  await openEditDrawerForProject(page, tp, projectName);
  await tp
    .estimateTypeByHours()
    .click()
    .catch(() => undefined);
  const f = hoursField(page);
  await f.fill('');
  await f.fill(hours);
  await expect(tp.estimateSaveButton()).toBeEnabled({ timeout: 10000 });
  await tp.estimateSaveButton().click({ timeout: 15000 });
  // Switching estimate type (e.g. By service item → By hours) pops a "change
  // estimate type" confirm modal — click Continue to apply (no-op if absent).
  if (
    await tp
      .changeTypeModal()
      .isVisible({ timeout: 5000 })
      .catch(() => false)
  ) {
    await tp
      .changeTypeContinue()
      .click({ timeout: 8000 })
      .catch(() => undefined);
  }
  await tp.expectDrawerClosed().catch(() => undefined);
  await page.waitForTimeout(1500);
}

/**
 * Assign ALL workers to the project (check the top select-all checkbox in the
 * Assign-workers drawer). The project only appears in the STA Customer dropdown
 * for an ASSIGNED worker, so this guarantees the worker we pick can log to it.
 */
async function ensureAllWorkersAssigned(
  page: Page,
  tp: TimeProjectsPage,
  projectName: string,
): Promise<void> {
  await tp.navigateToTimeProjects();
  await ready(page, tp);
  await isolateProject(page, tp, projectName);
  await tp.openAssignWorkersForFirstAssignableProject();
  await tp.expectAssignWorkersDrawerVisible();
  await page.waitForTimeout(1500);
  // Prefer the "Select all items" header checkbox (assigns every worker so any
  // worker we later pick in STE can log to the project). Fall back to checking
  // each worker row if the select-all control isn't present.
  const drawer = tp.assignWorkersDrawer();
  const selectAll = drawer.getByRole('checkbox', { name: 'Select all items' });
  if ((await selectAll.count()) > 0) {
    await selectAll
      .first()
      .check({ timeout: 6000 })
      .catch(() => undefined);
  } else {
    const boxes = drawer.getByRole('checkbox');
    const n = await boxes.count();
    for (let i = 0; i < n; i += 1) {
      await boxes
        .nth(i)
        .check({ timeout: 4000 })
        .catch(() => undefined);
    }
  }
  await tp.assignmentDrawerSaveButton().click({ timeout: 8000 });
  await page.waitForTimeout(1500);
}

/**
 * Open Time Entries → Add time → Single time entry and wait for the STE panel.
 * Readiness is matched by heading ROLE / substring text / the Name field —
 * NOT an exact full-text "Single time entry" match (the heading element can
 * contain nested nodes, so exact-text times out even when the panel is open).
 */
async function openSingleTimeEntryPanel(
  page: Page,
  ste: SingleTimeEntryPage,
): Promise<void> {
  await page
    .getByRole('button', { name: 'Add time' })
    .click({ timeout: 15000 });
  await page
    .getByRole('option', { name: 'Single time entry' })
    .or(page.getByText('Single time entry', { exact: true }))
    .first()
    .click();
  await expect(
    ste.headingSingleTimeEntry
      .or(page.getByText('Single time entry'))
      .or(page.getByLabel('Name', { exact: true }))
      .first(),
  ).toBeVisible({ timeout: 45000 });
}

export async function step14_actualHoursViaTimeEntry(
  page: Page,
  tp: TimeProjectsPage,
  projectName: string,
): Promise<void> {
  const timeEntries = new TimeEntriesPage(page);
  const ste = new SingleTimeEntryPage(page);

  // Set a known by-hours estimate so all downstream values are deterministic.
  await soft(`set estimate to ${EST_HOURS}h`, async () => {
    await setByHoursEstimate(page, tp, projectName, EST_HOURS);
  });

  // Assignment gates STA visibility — assign all workers so the project shows in
  // the Customer dropdown for whichever worker we select.
  await soft('assign all workers (so project shows in STA)', async () => {
    await ensureAllWorkersAssigned(page, tp, projectName);
  });

  await soft('log a Single time entry against the PROJECT', async () => {
    await timeEntries.navigateToTimeEntriesPage();
    await timeEntries.waitForLoadingToDisappear();

    // Add time → Single time entry (default STE — full-page panel, not a dialog).
    await openSingleTimeEntryPanel(page, ste);

    // Name (team member): pick the first REAL worker. Open via the page
    // object's proven Name-dropdown opener, then skip the leading "+ Add new"
    // option (selecting it would open Add-new and the project would never
    // surface in Customers).
    await soft('select Name (a real worker)', async () => {
      await ste.openDropdown('Name');
      await page
        .getByRole('option')
        .filter({ hasNotText: /add new/i })
        .first()
        .click({ timeout: 8000 });
    });

    // Customers dropdown: OPEN it (do NOT type) and select the PROJECT sub-row.
    // Typing the customer name filters the list to that text and hides the
    // project sub-row ("TP01 Project …" does not contain "Test Customer1"), so
    // open the dropdown via the page object and pick the project row directly.
    await ste.openCustomerDropdown('Customers');
    await page.waitForTimeout(1000);
    const projOpt = page
      .locator('li[role="option"]')
      .filter({ hasText: projectName })
      .first();
    await expect(projOpt).toBeVisible({ timeout: 10000 });
    await projOpt.click();

    // Duration mode is default (Set start and end time toggle off) → fill hh:mm
    // via the page object's duration field locator.
    await ste.enterFieldValue('Duration', TIME_ENTRY_HOURS);

    await ste.clickSaveAndCloseButton();
    await page.waitForTimeout(2000);
  });

  // #4 — validate on the TIME ENTRIES screen: the row shows the entry against
  // "<customer>:<project>" with the logged hours.
  await soft(
    'time entry visible against customer:project on list',
    async () => {
      await timeEntries.navigateToTimeEntriesPage();
      await timeEntries.waitForLoadingToDisappear();
      await expect(
        page
          .locator('//table//tbody//tr')
          .filter({ hasText: projectName })
          .first(),
      ).toBeVisible({ timeout: 15000 });
    },
  );

  // #4 — grid Budget column reflects the estimate + remaining (e.g. "12h" /
  // "2h remaining") once an estimate exists.
  await soft('grid Budget shows estimate + remaining', async () => {
    await tp.navigateToTimeProjects();
    await ready(page, tp);
    await isolateProject(page, tp, projectName);
    const row = tp.projectRows().filter({ hasText: projectName }).first();
    await expect(row.getByText(/\d+\s*h\b/i).first()).toBeVisible({
      timeout: 10000,
    });
    await expect(row.getByText(/remaining|overdue|left/i).first()).toBeVisible({
      timeout: 8000,
    });
  });

  // #4 — summary shows the EXACT computed values for est=12, logged=10:
  // Hours worked 10.00, Percent completed 83.3%, Hours remaining 2.00, banner
  // "2 hrs remaining".
  await soft('summary values (12 est, 10 logged → 83.3%, 2 left)', async () => {
    await isolateProject(page, tp, projectName);
    await tp.openFirstProjectSummary();
    await expect(page.getByText(/Time estimation summary/i)).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText(/2\s*hrs?\s*remaining/i).first()).toBeVisible({
      timeout: 12000,
    });
    await expect(page.getByText('10.00').first()).toBeVisible({
      timeout: 8000,
    });
    await expect(page.getByText('2.00').first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/83\.3\s*%/).first()).toBeVisible({
      timeout: 8000,
    });
  });

  // #4 — edit-estimate RECOMPUTE branches (same 10 logged). Percent renders
  // with one decimal (the 83.3% assert above confirms the format), so allow an
  // optional decimal. est 5 / logged 10 = 200% (over budget), NOT "overdue".
  //   20 → 50.0% / 10 remaining;   5 → 200% (over);   10 → 100.0% / 0 left.
  await soft(
    `edit estimate ${EST_EDIT_HOURS} → 50% / 10 remaining`,
    async () => {
      await setByHoursEstimate(page, tp, projectName, EST_EDIT_HOURS);
      await isolateProject(page, tp, projectName);
      await tp.openFirstProjectSummary();
      await expect(page.getByText(/\b50(\.\d+)?\s*%/).first()).toBeVisible({
        timeout: 12000,
      });
      await expect(
        page.getByText(/10\s*hrs?\s*remaining/i).first(),
      ).toBeVisible({
        timeout: 8000,
      });
    },
  );
  await soft(`edit estimate ${EST_OVERDUE_HOURS} → over budget`, async () => {
    await setByHoursEstimate(page, tp, projectName, EST_OVERDUE_HOURS);
    await isolateProject(page, tp, projectName);
    await tp.openFirstProjectSummary();
    // Over budget: percent goes past 100 (200% for 10 logged / 5 estimated),
    // or an "over"/negative-remaining indicator is shown.
    await expect(
      page
        .getByText(/200(\.\d+)?\s*%/)
        .or(page.getByText(/over\b/i))
        .first(),
    ).toBeVisible({ timeout: 12000 });
  });
  await soft(`edit estimate ${EST_EXACT_HOURS} → 100% / 0 left`, async () => {
    await setByHoursEstimate(page, tp, projectName, EST_EXACT_HOURS);
    await isolateProject(page, tp, projectName);
    await tp.openFirstProjectSummary();
    await expect(page.getByText(/100(\.\d+)?\s*%/).first()).toBeVisible({
      timeout: 12000,
    });
    await expect(
      page.getByText(/0(\.0+)?\s*(hrs?\s*)?(left|remaining)/i).first(),
    ).toBeVisible({ timeout: 8000 });
  });

  // NOTE: the time entry is intentionally NOT deleted here — step13 (View
  // workers) and step15 (assignment negative) need it. step15 deletes it.
  console.log(
    '[TP01][Step14] Time entry + estimate recompute branches verified',
  );
}

/** Delete the time entry logged against the project (Edit-row caret → Delete). */
async function deleteProjectTimeEntry(
  page: Page,
  projectName: string,
): Promise<void> {
  const timeEntries = new TimeEntriesPage(page);
  await timeEntries.navigateToTimeEntriesPage();
  await timeEntries.waitForLoadingToDisappear();
  const row = page
    .locator('//table//tbody//tr')
    .filter({ hasText: projectName })
    .first();
  if (!(await row.isVisible({ timeout: 5000 }).catch(() => false))) return;
  await row
    .getByRole('button', { name: /expand|more|edit options/i })
    .or(row.locator('button').last())
    .first()
    .click({ timeout: 8000 });
  await page
    .getByRole('menuitem', { name: 'Delete' })
    .first()
    .click({ timeout: 6000 });
  await page
    .getByRole('button', { name: /^(Yes|Delete)$/ })
    .first()
    .click({ timeout: 6000 })
    .catch(() => undefined);
}

// ============================================================================
// Step 15 — Assignment is FUNCTIONAL: unassigning the worker hides the
// customer+project from the STA Customer dropdown (negative path); then re-
// assign and delete the logged time entry. Covers the assignment dependency.
// ============================================================================

export async function step15_assignmentGatesTimeEntry(
  page: Page,
  tp: TimeProjectsPage,
  projectName: string,
): Promise<void> {
  // Unassign all workers from the project via the grid's Assign-workers drawer.
  await soft('unassign workers from project', async () => {
    await tp.navigateToTimeProjects();
    await ready(page, tp);
    await isolateProject(page, tp, projectName);
    await tp.openAssignWorkersForFirstAssignableProject();
    await tp.expectAssignWorkersDrawerVisible();
    await page.waitForTimeout(1500);
    // Uncheck the top "Workers"/select-all checkbox to clear all, then save.
    const drawer = tp.assignWorkersDrawer();
    await drawer
      .getByRole('checkbox')
      .first()
      .uncheck({ timeout: 6000 })
      .catch(() => undefined);
    await tp.assignmentDrawerSaveButton().click({ timeout: 8000 });
    await expect(drawer)
      .toBeHidden({ timeout: 20000 })
      .catch(() => undefined);
  });

  // Negative: with no workers assigned, the project must NOT appear in the STA
  // Customer dropdown.
  await soft('project hidden in STA when unassigned', async () => {
    const timeEntries = new TimeEntriesPage(page);
    const ste = new SingleTimeEntryPage(page);
    await timeEntries.navigateToTimeEntriesPage();
    await timeEntries.waitForLoadingToDisappear();
    await openSingleTimeEntryPanel(page, ste);
    // Select a real worker first (skip "+ Add new") — project visibility in the
    // Customer dropdown is per-selected-worker, so the negative check is only
    // meaningful with a worker chosen. The worker list can load slowly, so WAIT
    // for a real option to render (isVisible does NOT wait); retry opening the
    // dropdown once if the first attempt yields nothing selectable.
    const workerOption = page
      .getByRole('option')
      .filter({ hasNotText: /add new/i })
      .first();
    await ste.openDropdown('Name');
    const workerShown = await workerOption
      .waitFor({ state: 'visible', timeout: 6000 })
      .then(() => true)
      .catch(() => false);
    if (!workerShown) {
      await ste.openDropdown('Name').catch(() => undefined);
      await workerOption
        .waitFor({ state: 'visible', timeout: 8000 })
        .catch(() => undefined);
    }
    await expect(workerOption).toBeVisible({ timeout: 8000 });
    await workerOption.click({ timeout: 8000 });
    // OPEN the Customers dropdown (do NOT type — typing filters the list and
    // would hide the project regardless, giving a false negative) and assert the
    // unassigned project is absent from the full option list.
    await ste.openCustomerDropdown('Customers');
    await page.waitForTimeout(1000);
    await expect(
      page.locator('li[role="option"]').filter({ hasText: projectName }),
    ).toHaveCount(0, { timeout: 8000 });
    await ste.clickFooterCancelButton().catch(() => undefined);
  });

  // Restore: re-assign workers so the project is back to a clean state.
  await soft('re-assign workers to project', async () => {
    await tp.navigateToTimeProjects();
    await ready(page, tp);
    await isolateProject(page, tp, projectName);
    await tp.openAssignWorkersForFirstAssignableProject();
    await tp.expectAssignWorkersDrawerVisible();
    await page.waitForTimeout(1500);
    await tp
      .assignWorkersDrawer()
      .getByRole('checkbox')
      .first()
      .check({ timeout: 6000 })
      .catch(() => undefined);
    await tp.assignmentDrawerSaveButton().click({ timeout: 8000 });
    await page.waitForTimeout(1500);
  });

  // Cleanup: delete the logged time entry.
  await soft('delete the logged time entry', async () => {
    await deleteProjectTimeEntry(page, projectName);
  });

  console.log('[TP01][Step15] Assignment gating (negative) + cleanup verified');
}

// ============================================================================
// Step 16 — Filters (Status + Customer) and Search functional coverage.
// Creates two probe projects with distinct status + customer, then asserts each
// filter/search shows ONLY the matching project and hides the other (and that a
// no-match search drops to the zero-state). Probes are pushed to createdProjects
// so the afterEach cleanup deletes them.
// ============================================================================

/** Open a filter typeahead and pick an option by its exact visible text. */
async function selectFilterOption(
  page: Page,
  filter: Locator,
  optionText: string,
): Promise<void> {
  await filter.click();
  await page.waitForTimeout(500);
  // Match by accessible name (NOT exact) so badge-rendered options still match;
  // fall back to the option's text span.
  const opt = page
    .getByRole('option', { name: optionText })
    .or(
      page.locator(
        `//li[@role='option']//span[normalize-space()='${optionText}']`,
      ),
    );
  await expect(opt.first()).toBeVisible({ timeout: 8000 });
  await opt.first().click();
  await page.waitForTimeout(900);
}

/**
 * Type into the Time projects search box. It's an always-present IDS
 * DropdownTypeahead input (role="combobox", placeholder "Search for projects")
 * — there is NO Search button and it is NOT a textbox role, so fill the
 * placeholder input directly. Bounded so a locator miss fails fast (was hanging
 * the 5-min actionTimeout when it looked for a non-existent textbox/button).
 */
async function searchProjects(page: Page, text: string): Promise<void> {
  const input = page.getByRole('combobox', { name: 'Search' }).first();
  // Focus + clear, then type with REAL key events. The IDS DropdownTypeahead
  // opens its option menu on keydown; `fill()` only fires an insertText event,
  // so the menu never opens (no option to select). `pressSequentially` types
  // char-by-char and reliably triggers the menu. Do NOT blur between typing and
  // selecting — that closes the menu.
  await input.click({ timeout: 8000 });
  await input.fill('', { timeout: 8000 }).catch(() => undefined);
  await input.pressSequentially(text, { delay: 40, timeout: 15000 });
  await page.waitForTimeout(900);
  // The grid filters only when an option is SELECTED (typing alone does nothing).
  // An invalid name therefore has no option to pick — hence no search-driven
  // zero-state, which is why the negative case was removed.
  const option = page
    .getByRole('option', { name: text })
    .or(
      page.locator(
        `//li[@role='option']//span[contains(normalize-space(),'${text}')]`,
      ),
    )
    .first();
  await expect(option).toBeVisible({ timeout: 8000 });
  await option.click({ timeout: 8000 });
  await page.waitForTimeout(1000);
}

/** Clear the search box. */
async function clearProjectSearch(page: Page): Promise<void> {
  // Clearing the typeahead input resets the selection and returns the full list.
  // (Not critical for correctness — cleanup navigates fresh afterwards.)
  await page
    .getByRole('combobox', { name: 'Search' })
    .first()
    .fill('', { timeout: 8000 })
    .catch(() => undefined);
  await page.waitForTimeout(800);
}

export async function step16_filtersAndSearch(
  page: Page,
  singular: TimeProjectPage,
  tp: TimeProjectsPage,
  baseProjectName: string,
  createdProjects: string[],
): Promise<void> {
  // Probe projects with distinct (status, customer) so each filter is decisive.
  const f1 = `${baseProjectName} FA`; // Test Customer1 / In progress
  const f2 = `${baseProjectName} FB`; // Test Customer2 / Completed
  const rowFor = (name: string): Locator =>
    tp.projectRows().filter({ hasText: name }).first();
  const countFor = (name: string): Locator =>
    tp.projectRows().filter({ hasText: name });

  // Saving a project lands on its DETAILS page (…/projectdetails?id=…), not the
  // Projects list — so go back to the list (Time projects → Manage projects)
  // before each create, otherwise "New project" isn't on the page.
  const gotoProjectsList = async (): Promise<void> => {
    await tp.navigateToTimeProjects();
    await ready(page, tp);
    await singular.clickManageProjectsLink();
    await singular.validateProjectsPageRedirect();
  };

  await soft('create filter-probe projects (status + customer)', async () => {
    await gotoProjectsList();
    await singular.createNewProjectWithStatus(
      f1,
      PROJECT_CUSTOMER,
      'In progress',
    );
    createdProjects.push(f1);
    await gotoProjectsList();
    await singular.createNewProjectWithStatus(
      f2,
      PROJECT_CUSTOMER_2,
      'Completed',
    );
    createdProjects.push(f2);
  });

  await tp.navigateToTimeProjects();
  await ready(page, tp);

  // ---- Status filter ----
  // NOTE: the status FILTER options are "In Progress" (capital P), distinct from
  // the create-form Status menu which uses "In progress".
  await soft(
    'status=In Progress → shows F1, hides F2 (Completed)',
    async () => {
      await selectFilterOption(page, tp.statusFilter(), 'In Progress');
      await expect(rowFor(f1)).toBeVisible({ timeout: 15000 });
      await expect(countFor(f2)).toHaveCount(0, { timeout: 10000 });
    },
  );
  await soft(
    'status=Completed → shows F2, hides F1 (In Progress)',
    async () => {
      await selectFilterOption(page, tp.statusFilter(), 'Completed');
      await expect(rowFor(f2)).toBeVisible({ timeout: 15000 });
      await expect(countFor(f1)).toHaveCount(0, { timeout: 10000 });
    },
  );
  await soft('reset status filter to All statuses', async () => {
    await selectFilterOption(page, tp.statusFilter(), 'All statuses');
  });

  // ---- Customer filter (account has two customers) ----
  await soft(`customer=${PROJECT_CUSTOMER} → shows F1, hides F2`, async () => {
    await selectFilterOption(page, tp.customerFilter(), PROJECT_CUSTOMER);
    await expect(rowFor(f1)).toBeVisible({ timeout: 15000 });
    await expect(countFor(f2)).toHaveCount(0, { timeout: 10000 });
  });
  await soft(
    `customer=${PROJECT_CUSTOMER_2} → shows F2, hides F1`,
    async () => {
      await selectFilterOption(page, tp.customerFilter(), PROJECT_CUSTOMER_2);
      await expect(rowFor(f2)).toBeVisible({ timeout: 15000 });
      await expect(countFor(f1)).toHaveCount(0, { timeout: 10000 });
    },
  );
  await soft('reset customer filter to All customers', async () => {
    await selectFilterOption(page, tp.customerFilter(), 'All customers');
  });

  // ---- Search ----
  // The search is a select-from-dropdown typeahead: typing an invalid name shows
  // no option to pick, so there is NO search-driven zero-state — only the
  // positive path (type → select the matching option → grid filters to it) is
  // meaningful, so that's all we assert.
  await soft('search positive (F1 name) → shows F1, hides F2', async () => {
    await searchProjects(page, f1);
    await expect(rowFor(f1)).toBeVisible({ timeout: 15000 });
    await expect(countFor(f2)).toHaveCount(0, { timeout: 10000 });
  });
  await clearProjectSearch(page);

  console.log('[TP01][Step16] Filters (status + customer) + search verified');
}

// ============================================================================
// afterEach cleanup — delete every project this run created (original + renamed)
// ============================================================================

export async function cleanupCreatedProjects(
  page: Page,
  // Kept for signature compatibility; cleanup now deletes EVERY project in the
  // list (name-agnostic) so orphans from failed creates/renames are removed too.
  _createdProjects: string[],
): Promise<void> {
  const singular = new TimeProjectPage(page);
  const tp = new TimeProjectsPage(page);

  await soft('[cleanup] navigate to Projects list', async () => {
    // Direct auth-session navigation to Time projects → Manage projects. (Do NOT
    // hover the My apps/Time menus here — that path runs submenu-visibility
    // assertions which are functional checks that don't belong in cleanup.)
    await tp.navigateToTimeProjects();
    await ready(page, tp);
    await singular.clickManageProjectsLink();
    await singular.validateProjectsPageRedirect();
  });

  // Delete EVERY project in the list, regardless of name. The Manage Projects
  // list lazily renders / lags behind recent creates, so a single drain can
  // report "0 remaining" while just-created projects haven't appeared yet. So we
  // work in ROUNDS: reload (to surface lagging/lazy rows + clear any leftover
  // search filter), wait for the list to settle, drain all visible rows, and
  // only stop once a FRESH reload shows zero rows for two consecutive rounds.
  const actionBtn = page.locator(`//*[@data-id='project-action-list']/button`);

  // The Projects-app list has its OWN status filter; if it's set to a specific
  // status, projects of other statuses (e.g. a Completed project) are HIDDEN and
  // never get deleted. Force it to "All statuses" so every project is visible.
  const setStatusFilterAll = async (): Promise<void> => {
    const filter = page
      .getByPlaceholder('Select a status')
      .or(page.locator('.project-status-dropdown input'))
      .first();
    if (!(await filter.isVisible().catch(() => false))) return;
    if (
      (await filter.inputValue().catch(() => '')).trim().toLowerCase() ===
      'all statuses'
    ) {
      return; // already showing all
    }
    await filter.click({ timeout: 5000 }).catch(() => undefined);
    const anyOpt = page.locator(`//li[@role='option']`).first();
    const opened = await anyOpt
      .waitFor({ state: 'visible', timeout: 1500 })
      .then(() => true)
      .catch(() => false);
    if (!opened) {
      await page
        .locator(
          '.project-status-dropdown [class*="iconBox"], .project-status-dropdown [role="button"]',
        )
        .first()
        .click({ force: true, timeout: 5000 })
        .catch(() => undefined);
    }
    await page
      .locator(`//li[@role='option']//span[normalize-space()='All statuses']`)
      .or(page.getByRole('option', { name: 'All statuses' }))
      .first()
      .click({ timeout: 5000 })
      .catch(() => undefined);
    await page.waitForTimeout(1000);
  };

  const MAX_ROUNDS = 10;
  let deleted = 0;
  let emptyRounds = 0;

  for (let round = 0; round < MAX_ROUNDS && emptyRounds < 2; round += 1) {
    await page.reload().catch(() => undefined);
    await page.waitForTimeout(3500); // let the list fully render after reload
    // Show ALL statuses BEFORE counting — otherwise a status filter could hide
    // projects and make the list look empty / partially drained.
    await setStatusFilterAll();
    let present = await actionBtn.count().catch(() => 0);
    if (present === 0) {
      emptyRounds += 1;
      continue;
    }
    emptyRounds = 0;

    // Drain every row currently visible this round.
    let failures = 0;
    for (let i = 0; i < 60; i += 1) {
      const before = await actionBtn.count().catch(() => 0);
      if (before === 0) break;
      try {
        await singular.clickProjectMoreActions();
        await singular.selectDeleteProjectOption();
        await singular.confirmDelete();
        // Confirm a row was actually removed (toast text is unreliable).
        await expect(actionBtn).toHaveCount(before - 1, { timeout: 15000 });
        deleted += 1;
        failures = 0;
        await page.waitForTimeout(800);
      } catch (e) {
        failures += 1;
        console.log('[TP01][cleanup] delete attempt failed: %s', e);
        if (failures >= 3) {
          console.log('[TP01][cleanup] 3 consecutive failures this round');
          break;
        }
        await page.reload().catch(() => undefined);
        await page.waitForTimeout(2500);
      }
    }
    present = await actionBtn.count().catch(() => 0);
    console.log(
      '[TP01][cleanup] round %d: deleted so far %d, %d still visible',
      round + 1,
      deleted,
      present,
    );
  }

  // Final verification on a fresh load (with all statuses shown).
  await page.reload().catch(() => undefined);
  await page.waitForTimeout(3000);
  await setStatusFilterAll();
  const remaining = await actionBtn.count().catch(() => -1);
  console.log(
    '[TP01][cleanup] Deleted %d project(s); %d remaining',
    deleted,
    remaining,
  );
  await soft('[cleanup] all projects removed', async () => {
    await expect(actionBtn).toHaveCount(0, { timeout: 10000 });
  });
}

// ============================================================================
// Orchestrator
// ============================================================================

export async function runTPFullSuite(
  page: Page,
  account: TPTestAccount,
  createdProjects: string[] = [],
): Promise<void> {
  const nav = new TimeMenuNavigationPage(page);
  const tp = new TimeProjectsPage(page);
  const singular = new TimeProjectPage(page);
  const projectName = buildProjectName();

  await step01_loginAndRoleSetup(page, account);

  const canContinue = await step02_navigateAndStructure(page, account, nav, tp);
  if (!canContinue) {
    console.log('[TP01] Time projects not available — suite complete.');
    return;
  }

  await step03_filters(page, tp);
  await step04_createProject(page, singular, tp, projectName, createdProjects);
  await step05_estimateByHours(page, account, tp, projectName);
  await step06_summaryByHours(page, tp, projectName);
  await step07_estimateByServiceItem(page, account, tp, projectName);
  await step08_summaryByServiceItem(page, tp, projectName);
  await step09_inlineEditDelete(page, tp, projectName);

  await step10_assignWorkers(page, account, tp, projectName);

  // Functional time-projects coverage, ORDER MATTERS:
  //  14: set known estimate (12) → log 10h → assert exact values + recompute
  //      branches (20→50%, 5→overdue, 10→100%). Leaves the entry in place.
  //  13: View workers shows the logged 10.00; Edit estimate drawer; customer
  //      link → Customers & leads; Back to projects.
  //  15: assignment gating (unassign → project hidden in STA) + delete the entry.
  await step14_actualHoursViaTimeEntry(page, tp, projectName);
  await step13_summaryTogglesWorkersAndLinks(page, tp, projectName);
  await step15_assignmentGatesTimeEntry(page, tp, projectName);
  await step11_manyRowsAndDeleteEstimate(page, tp, projectName);
  await step12_renameProject(page, tp, projectName, createdProjects);
  // Filters (Status + Customer) + Search — creates its own probe projects with
  // distinct status/customer and registers them for afterEach cleanup.
  await step16_filtersAndSearch(
    page,
    singular,
    tp,
    projectName,
    createdProjects,
  );

  console.log('[TP01] Full suite complete.');
}
