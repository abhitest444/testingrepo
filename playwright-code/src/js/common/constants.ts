import { Sandbox } from 'src/js/common/sandbox';

// feature flags
export const FEATURE_FLAGS = Object.freeze({
  QB_TIME_TRACKING_UI_EMPLOYER_SETTING: 'time-tracking-ui-employer-settings',
  QB_GLOBAL_SETTINGS_TIME_TRACKING_UI_T_SHEET:
    'SBSEG-QBO-enable-external-time-settings-widget',
  QB_GEO_LOCATION_SETTINGS_UI: 'SBSEG-QBO-location-tracking',
  QB_OVERTIME_SETTINGS_UI: 'SBSEG-QBO-qb-time-tracking-overtime-enabled',
  QB_GLOBAL_SETTINGS_TIME_TRACKING_UI_T_SHEET_QBT:
    'SBSEG-QBO-enable-external-time-settings-widget-qbt',
  QB_COREAPP_VARIABILITY_ENFORCE_TIME_TRACKING_UI:
    'SBSEG-QBO-coreapp-variability-enforce-time-tracking-ui',
  QB_TIME_TRACKING_UI_TE_SETTINGS_REQUIRED_TIME_SHEET_FIELDS:
    'time-tracking-ui-te-settings-required-time-sheet-fields',
  QB_TIME_TRACKING_UI_TIME_CLOCK_TOUR: 'qbtime-r2-timeclock-tour',
  QB_TIME_TRACKING_USERVOICE_FEEDBACK: 'time-tracking-ui-uservoice-feedback',
  SBSEG_QBO_R4_ASSIGNMENTS: 'SBSEG-QBO-R4-assignments',
  QB_TIME_ALLOW_NEGATIVE_BILL_RATE_TIME_ACTIVITY:
    'SBSEG-qbo-allow-negative-bill-rate-time-entries',
  QB_TIME_TRACKING_UI_TIME_OFF_SETTINGS:
    'SBSEG-QBO-enable-time-off-policy-goco-integration-beta',
  QB_TIME_SHOW_BREAKS_IN_USER_SETTINGS:
    'SBSEG-QB-Time-show-breaks-in-user-settings',
  QB_TIME_SHOW_LOCATION_IN_USER_SETTINGS:
    'SBSEG-QB-Time-show-location-user-settings',
  QB_TIME_SHOW_NOTIFICATIONS_IN_USER_SETTINGS:
    'SBSEG-QB-Time-show-notifications-in-user-settings',
  QB_TIME_SHOW_PERMISSIONS_IN_USER_SETTINGS:
    'SBSEG-QBO-show-permissions-in-user-settings',
  QB_TIME_TRACKING_UI_R2_RELEASE: 'SBSEG-QBO-QBTIME-R2-RELEASE',
  QB_TIME_TRACKING_UI_ENABLE_PAYTYPE_DROPDOWN_FOR_NON_ADMIN:
    'SBSEG-QBO-ENABLE_PAYTYPE_DROPDOWN_FOR_NON_ADMIN',
  QB_TIME_TRACKING_UI_ENABLE_IES_FEATURE_FLAGS: 'SBSEG-QBO-ENABLE-QL-FOR-IES',
  QB_TIME_TRACKING_UI_TIME_ENTRY_PRIMARY_DATA_SOURCE:
    'SBSEG-QBO-TimeEntry-As-Primary-Data-Source',
  SBSEG_QBO_ENABLE_SPLIT_SCREEN_VIEW: 'SBSEG-QBO-enable-split-screen-view',
  SBSEG_QBO_R6_GEOFENCE: 'qb-time-tracking-geofencing-settings-enabled',
  QB_TIME_ENABLE_SCHEDULE_SETTINGS: 'SBSEG-QBO-Enable-Time-Schedule-Settings',
  ENABLE_TIME_KIOSK_SETTINGS: 'SBSEG-QBO-Enable-Time-Kiosk-Settings',
  QB_TIME_ACCOUNT_SETTINGS_DEEPLINK:
    'SBSEG-QBO-QBTIME_ACCOUNT_SETTINGS_DEEPLINK_NAVIGATION',
  SBSEG_QBO_WORKER_TRACK_ENABLE_WORKER_INVITE:
    'SBSEG-QBO-workforce-time-tracking-invite-enabled',
  SBSEG_QBO_QBTIME_OVERVIEW_MODERNISATION:
    'SBSEG-QBO-QBTIME-OVERVIEW-MODERNISATION',
  SBSEG_QBO_FIT_AND_FINISH_ADMIN_SETTINGS:
    'SBSEG-QBO-FIT-AND-FINISH-ADMIN-SETTINGS',
  FEATURE_FLAG_PAYROLL_FIRST_ENABLED:
    'SBSEG-QBO-qb-time-tracking-payroll-first-enabled',
  QB_TIME_TRACKING_UI_ENABLE_LEGACY_QBO_USER:
    'SBSEG-QBO-qb-time-tracking-legacy-qbo-user-enabled',
  SBSEG_QBO_ENABLE_TIME_TAB_TEAM_MEMBERS:
    'SBSEG-QBO-Enable-Time-Tab-Team-Members',
  QB_TIME_TRACKING_UI_DIMENSIONS: 'SBSEG-QBO-time-dimensions',
  SBSEG_QBO_SHOW_PROJECT_POST: 'SBSEG-QBO-SHOW-PROJECT-POST',
  SBSEG_QBO_QBTIME_WORKFLOW_PROJECTS_API:
    'SBSEG-QBO-ACOUNTANT-WORKFLOW-PROJECTS-API-ENABLED',
  SBSEG_WFS_QBTIME_WORKFLOW_PROJECTS_API:
    'SBSEG-QBO-WORKFORCE-ACOUNTANT-WORKFLOW-PROJECTS-API-ENABLED',
  SBSEG_QBO_QBTIME_MAINTENANCE_FULL_PAGE:
    'SBSEG-QBO-SBSEG-QBO-QBTIME-MAINTENANCE-FULL-PAGE',
  SBSEG_QBO_GEOFENCE_FLAGS: 'SBSEG-QBO-geofence-flags',
});

// variability decisions
export const VARIABILITY_DECISIONS = Object.freeze({
  SHOW_ADVANCED_TIME_OFF_MANAGEMENT: 'showAdvancedTimeOffManagement',
  IS_IES_COMPANY: 'isIESCompany',
  IS_PAYROLL_ELITE: 'isPayrollElite',
  IS_QBOA: 'isQBOAccountantAttached',
} as const);

// FODE after-task modal: cross-plugin flag consumed by timecapture-timeentries-ui
const AFTERTASK_MODAL_PENDING_KEY = 'fode-timeentry-aftertask-modal-pending';
const AFTERTASK_MODAL_STORAGE_NAMESPACE = 'timecapture';

export function setAfterTaskModalPending(sandbox: Sandbox): void {
  // TODO: Optional chaining added to handle cases where webStorage is unavailable in Workforce environment.
  // Remove this defensive check once follow-up PR to #2259 eliminates webStorage dependency.
  sandbox?.extensions?.qbo?.webStorage
    ?.persistent(AFTERTASK_MODAL_STORAGE_NAMESPACE)
    ?.setItemByPersonaId(AFTERTASK_MODAL_PENDING_KEY, Date.now().toString());
}

// Header constants
export const TIME_TRACKING_HEADERS = {
  TIME_SUMMARY_TIME_ACTIVITY_FLOW: 'intuit-is-time-activity', // TIME SUMMARY FLOW: To indicate that the request is for a time activity
};

/** Dashboard `TIME_SUMMARY_API_CALL` log: `operation=` segment */
export const TIME_SUMMARY_API_OPERATION = Object.freeze({
  READ: 'READ',
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
} as const);

export type TimeSummaryApiOperation =
  (typeof TIME_SUMMARY_API_OPERATION)[keyof typeof TIME_SUMMARY_API_OPERATION];

/** Dashboard `TIME_SUMMARY_API_CALL` log: `status=` segment */
export const TIME_SUMMARY_API_STATUS = Object.freeze({
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
} as const);

export type TimeSummaryApiStatus =
  (typeof TIME_SUMMARY_API_STATUS)[keyof typeof TIME_SUMMARY_API_STATUS];

export const TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE = {
  ATLAS: 'ATLAS',
  CA: 'CA',
  PAYROLL_FIRST: 'PAYROLL_FIRST',
  UK: 'UK',
  US: 'US',
};

export const INTUIT_TID = 'intuit_tid';

// endpoints
export const PREFERENCES_ENDPOINT = 'preferences?minorversion=74';
export const VENDOR_ENDPOINT = 'vendor';
export const VENDOR_ENDPOINT_MINORVERSION = '73';

// CSS related constants
export const MAX_NOTES_LENGTH = 4000;
export const TEAM_MEMBER_FIELD_WIDTH = 224;
export const WEEK_FIELD_WIDTH = 214;
export const NOTES_FIELD_ROWS = 2;
export const JOB_DETAIL_WIDTH = 177;

// duration related constants
export const MAX_BREAK_DURATION = 86400; // 24 hours
export const MAX_TIME_ENTRY_DURATION = 86400; // 24 hours
export const MAX_WORK_DURATION_MINUTES = 525600; // 365 days
export const LOOKUP_INTERVAL_FOR_COPY_LAST_TIMESHEET_IN_MONTHS = 2; // 2 months
export const RECENT_TIME_RECORDS_LIMIT = 20;

// distance related constants
export const METERS_PER_MILE = 1609.34;

export const QUICKBOOKS_JOB_GROUP = 'quickbooks';

export const LOCALS = {
  UK: 'en-gb',
};

export const TIME_CLOCK_FIELDS_WIDTH = 540;
export const TIME_CLOCK_DATE_WIDTH = 250;
export const TIME_CLOCK_OUT_FIELDS_WIDTH = 530;

export const TIME_CLOCK_EVENTS = {
  CLOSE: 'time-clock-close-event',
};

export const SINGLE_TIME_TROWSER_EVENTS = {
  CLOSE: 'single-time-trowser-close-event',
};

export const WEEKLY_TIME_TROWSER_EVENTS = {
  CLOSE: 'weekly-time-trowser-close-event',
};

export const DEEP_LINK_NAVIGATION_EVENTS = {
  COMPLETE: 'deep-link-navigation-complete',
};

// Single event for section readiness with payload { section: string }
export const SECTION_READY_EVENT = 'section-ready';

// Section keys for SECTION_READY_EVENT payload (must match SECTION_KEYS in sectionNavigation.ts)
export const SECTION_READY_KEYS = {
  // Trowser sections
  BREAKS: 'breaks',
  OVERTIME: 'overtime',
  GEO_LOCATION: 'geolocation',
  CUSTOM_FIELDS: 'customfields',
  // Inline edit sections
  TIME_TRACKING: 'timetracking',
  TIMESHEET: 'timesheet',
  NOTIFICATIONS: 'notifications',
  APPROVALS: 'approvals',
  // View-only/external sections
  SCHEDULES: 'schedules',
  KIOSK: 'kiosk',
  TIME_OFF: 'timeoff',
} as const;

export const WEEK_DAYS = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

export const WORKFLOWS = {
  TIME: 'TIME',
};

export const OBILL_UPGRADE_CONF = {
  MENU_ID: 27,
  UPGRADE: 'u', // upgrade
  ROUTE_NAME: 'obillupgrade',
};

export const ENTITLEMENTS = {
  QB_TSHEETS_ELITE: 'QB_TSHEETS_ELITE',
  PR_ELITE: 'PR_ELITE',
};

export const TIMECHARGE_PENDING_LOCK_REASON = 'TIMECHARGE_PENDING';
export const TIME_ACTIVITY_EDIT_BLOCKED_ERROR_CODE =
  'TIME_ACTIVITY_EDIT_BLOCKED';

/**
 * Stable error-ID constants used as the first argument to
 * `sandbox.logger.logException`. A stable ID lets the error be:
 *   - assigned an alert threshold in Sentry (group-level filtering)
 *   - correlated across sessions on a single dashboard query
 *   - used as a structured Splunk event key for proactive monitoring
 */
export const ERROR_IDS = Object.freeze({
  VARIABILITY_IS_QBOA_FAILED: 'variability.is_qboa.failed',
  TSHEETS_CURRENT_USER_FAILED: 'tsheets.current_user.failed',
} as const);
