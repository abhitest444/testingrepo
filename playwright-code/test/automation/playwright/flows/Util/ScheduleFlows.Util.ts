import { Page, expect } from '@playwright/test';
import AssignmentsPage from '../../pages/AssignmentsPage';
import ScheduleSettingsPage, {
  SCHEDULE_SETTINGS,
  MANAGER_SETTING,
  ScheduleSettingsState,
} from '../../pages/ScheduleSettingsPage';

/**
 * Schedule User Settings — ST13 and ST14 (ST14 merges the former ST14 + ST15).
 *
 * All cases share the same worker-level flow. The only difference is whether the
 * manager-only setting ("Team member hasn't clocked in after shift started.
 * Notify manager.") is expected:
 *   • ST13 — employee worker                         → manager setting NOT visible
 *   • ST14 — admin (first) worker AND group-lead worker → manager setting visible + editable
 *
 * IMPORTANT — worker (user) settings ALWAYS take precedence over the company
 * level. Because the last step edits the worker level, a naive "worker matches
 * company" check would fail on the *second* run (the previous run's edit
 * persists). To stay idempotent, the worker level is first RESET to the company
 * baseline at the start of the worker step — so the match is deterministic on
 * every run — and reset again at the end as best-effort cleanup.
 */

interface ScheduleSettingsCaseOptions {
  /** Whether the manager-only setting should be visible for this worker role. */
  expectManagerSetting: boolean;
  /**
   * Worker to open settings for. When omitted the first worker in the table is
   * used (lets the test run on stub accounts before the worker is seeded).
   */
  workerName?: string;
  /** Human-readable role for logging (e.g. "admin", "group lead"). */
  roleLabel?: string;
}

/** Labels expected for this worker role (core 4, plus manager-only when applicable). */
function expectedLabels(expectManagerSetting: boolean): string[] {
  return expectManagerSetting
    ? [...SCHEDULE_SETTINGS, MANAGER_SETTING]
    : [...SCHEDULE_SETTINGS];
}

/** Steps 1–2: verify the schedule settings at company level and capture them as the baseline. */
async function captureCompanyBaseline(
  page: Page,
): Promise<ScheduleSettingsState> {
  const settings = new ScheduleSettingsPage(page);
  await settings.openCompanyNotifications();
  console.log('Verifying company-level schedule notification settings');
  // Company level ALWAYS shows all 5 settings (including the manager-only one),
  // regardless of role — that role distinction only applies at the worker level.
  await settings.validateAllSettingsVisible(true);
  // Snapshot the company state — this is what the worker level must match.
  const baseline = await settings.readState();
  console.log('✓ Captured company baseline');

  // ST08 — "Never send" for the assigned-shift setting must collapse the
  // view-mode value to only "Never send", hiding Email/Mobile detail regardless
  // of the checkbox state. This mutates company settings, so we restore them.
  const originalSendMode =
    await settings.validateNeverSendHidesChannelsInViewMode();
  await settings.restoreCompanyScheduleDefaults(baseline, originalSendMode);

  return baseline;
}

/**
 * Step 3: Assignments → Workers → open a worker's View settings. This re-navigates
 * from scratch every call, so it doubles as a "refresh" that proves saved values
 * are persisted. By default it enters Notifications edit mode (checkboxes are
 * interactive); pass `{ editMode: false }` to stay in VIEW mode (read-only text).
 */
async function openWorkerScheduleSettings(
  page: Page,
  workerName?: string,
  options: { editMode?: boolean } = {},
): Promise<string> {
  const { editMode = true } = options;
  const assignments = new AssignmentsPage(page);
  await assignments.gotoWorkersList();

  // Default to the first worker when no explicit name is given (stub accounts).
  const name = workerName ?? (await assignments.getFirstWorkerName());
  const opened = await assignments.clickViewSettingsForWorker(name);
  expect(opened, `View settings should open for worker "${name}"`).toBe(true);

  if (editMode) {
    // Edit mode makes the schedule checkboxes interactive (view mode only labels).
    await assignments.clickEditNotifications();
  }
  console.log(
    `✓ Opened schedule settings for worker "${name}" (${
      editMode ? 'edit' : 'view'
    } mode)`,
  );
  return name;
}

/**
 * Navigates to the Workers list and returns the name of a worker OTHER than
 * `excludeName` (or '' if there isn't a second worker). Used to prove that
 * user-level edits to one worker don't leak to another.
 */
async function getOtherWorkerName(
  page: Page,
  excludeName: string,
): Promise<string> {
  const assignments = new AssignmentsPage(page);
  await assignments.gotoWorkersList();
  return assignments.getWorkerNameOtherThan(excludeName);
}

/**
 * The full worker-level validation, run against an already-captured company
 * baseline. Reused for every worker role (employee / admin / group-lead) — the
 * only difference is `expectManagerSetting` and which worker is opened.
 *
 * NOTE: any assertion failure throws and ENDS the test immediately — we
 * intentionally do NOT run end-cleanup on failure (no try/finally) so a failing
 * run terminates fast instead of hanging on a slow restore. Idempotency is still
 * guaranteed by the reset-to-baseline at the START of the worker steps below:
 * the next run wipes whatever a failed run left behind before it asserts.
 */
async function validateWorkerScheduleSettings(
  page: Page,
  companyBaseline: ScheduleSettingsState,
  options: ScheduleSettingsCaseOptions,
): Promise<void> {
  const { expectManagerSetting, workerName, roleLabel = 'worker' } = options;
  const labels = expectedLabels(expectManagerSetting);
  const settings = new ScheduleSettingsPage(page);

  // Step 3–6: worker level shows the same fields + Mobile/Email checkboxes.
  const name = await openWorkerScheduleSettings(page, workerName);
  console.log(`── Validating ${roleLabel}: "${name}" ──`);
  await settings.validateAllSettingsVisible(expectManagerSetting);

  // Reset the worker to the company baseline so the match check is deterministic
  // every run (this is also the idempotency guarantee for the NEXT run).
  await settings.applyState(companyBaseline);
  await settings.save();
  console.log('✓ Reset worker settings to company baseline');

  // Step 4: re-open and verify the worker now matches the company level.
  await openWorkerScheduleSettings(page, name);
  await settings.expectStateMatches(companyBaseline, labels);
  console.log('✓ Worker settings match company baseline');

  // Step 5 (cross-worker setup): capture ANOTHER worker's current state BEFORE we
  // edit this one, so we can later prove our edits didn't leak to it. We compare
  // the other worker against ITS OWN snapshot (not the company baseline) — other
  // workers may legitimately have their own user-level settings.
  const otherWorker = await getOtherWorkerName(page, name);
  let otherWorkerBefore: ScheduleSettingsState | null = null;
  if (otherWorker) {
    // Edit mode — readState() reads checkbox states, which only exist in edit mode.
    await openWorkerScheduleSettings(page, otherWorker);
    otherWorkerBefore = await settings.readState();
    console.log(`✓ Captured "${otherWorker}" state before editing "${name}"`);
  }

  // Step 7: override company — set EVERY setting's Email to false for this worker, save.
  await openWorkerScheduleSettings(page, name);
  const overriddenLabels = await settings.setAllSettingsChannel('Email', false);
  await settings.save();
  console.log(
    `✓ Worker override: Email set to false for ${overriddenLabels.length} settings`,
  );

  // Step 7b: REFRESH first (re-open the worker settings from scratch in VIEW
  // mode) so we read the PERSISTED values, not the in-memory UI. The displayed
  // text must then reflect the saved channel state — "Off" when no channel is
  // on, otherwise "On" listing ONLY the enabled channels (email is off now, so
  // it must NOT appear).
  await openWorkerScheduleSettings(page, name, { editMode: false });
  for (const label of overriddenLabels) {
    await settings.expectViewModeReflectsChannels(label, {
      email: false, // saved as off
      mobile: companyBaseline[label]?.mobile ?? false, // mobile unchanged from baseline
    });
  }
  console.log(
    '✓ Retained after refresh — view reflects saved channels (Off when none; hides unchecked email/mobile)',
  );

  // Step 8: the OTHER worker must be UNCHANGED by our edits — user-level settings
  // are per-worker, so editing this worker must not leak to anyone else.
  if (otherWorker && otherWorkerBefore) {
    // Edit mode — expectStateMatches() reads checkbox states.
    await openWorkerScheduleSettings(page, otherWorker);
    await settings.expectStateMatches(
      otherWorkerBefore,
      Object.keys(otherWorkerBefore),
    );
    console.log(
      `✓ Other worker "${otherWorker}" unchanged by edits to "${name}" (per-worker isolation)`,
    );
  } else {
    console.log(
      '⚠ Only one worker present — skipped cross-worker isolation validation',
    );
  }

  // Cleanup on SUCCESS only — restore the worker to the company baseline so the
  // next run starts clean. (On failure we skip this and end immediately; the
  // reset-to-baseline at the start of the next run still guarantees idempotency.)
  await openWorkerScheduleSettings(page, name);
  await settings.applyState(companyBaseline);
  await settings.save();
  console.log('✓ Cleanup: worker reset to company baseline (default)');
}

/** Captures the company baseline (Steps 1–2 + ST08) then validates ONE worker. */
async function runScheduleSettingsCase(
  page: Page,
  options: ScheduleSettingsCaseOptions,
): Promise<void> {
  const companyBaseline = await captureCompanyBaseline(page);
  await validateWorkerScheduleSettings(page, companyBaseline, options);
}

/** Navigates to the Workers list and returns the worker flagged "Group lead" (or ''). */
async function getGroupLeadWorkerName(page: Page): Promise<string> {
  const assignments = new AssignmentsPage(page);
  await assignments.gotoWorkersList();
  return assignments.getGroupLeadWorkerName();
}

// ==================== Per-case entry points ====================

/** ST13 — employee worker: manager setting must NOT be visible. */
export async function validateEmployeeWorkerScheduleSettings(
  page: Page,
  workerName?: string,
): Promise<void> {
  await runScheduleSettingsCase(page, {
    expectManagerSetting: false,
    workerName,
  });
}

export async function validateAdminAndGroupLeadWorkerScheduleSettings(
  page: Page,
): Promise<void> {
  const companyBaseline = await captureCompanyBaseline(page);

  // Admin worker — the first worker in the list.
  await validateWorkerScheduleSettings(page, companyBaseline, {
    expectManagerSetting: true,
    roleLabel: 'admin',
  });

  // Group-lead worker — the one flagged "Group lead" in the workers table.
  const groupLeadName = await getGroupLeadWorkerName(page);
  expect(
    groupLeadName,
    'A "Group lead" worker should exist for the group-manager validation',
  ).not.toBe('');
  await validateWorkerScheduleSettings(page, companyBaseline, {
    expectManagerSetting: true,
    workerName: groupLeadName,
    roleLabel: 'group lead',
  });
}
