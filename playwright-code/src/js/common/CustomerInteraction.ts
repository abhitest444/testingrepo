import { CustomerInteraction } from '@appfabric/sandbox-spec';
import { Sandbox } from 'src/js/common/sandbox';
import { isErrorNoise } from '../service/utils/mapError';

export enum TimeCustomerInteraction {
  SINGLE_TIME_CREATE = 'single-time-entry-create',
  SINGLE_TIME_READ = 'single-time-entry-read',
  SINGLE_TIME_SEARCH_BY_TXN_ID = 'single-time-entry-search-by-txn-id',
  SINGLE_TIME_UPDATE = 'single-time-entry-update',
  SINGLE_TIME_DELETE = 'single-time-entry-delete',
  WEEKLY_TIME_READ = 'weekly-time-entry-read',
  WEEKLY_TIME_SAVE = 'weekly-time-entry-save',
  // Here single-time-entry = time activity (above interactions) and single-time-sheet = time entry (below interactions)
  // this change was done to avoid breaking existing analytics dashboards
  SINGLE_TIME_SHEET_CREATE = 'single-time-sheet-create',
  SINGLE_TIME_SHEET_READ = 'single-time-sheet-read',
  SINGLE_TIME_SHEET_UPDATE = 'single-time-sheet-update',
  SINGLE_TIME_SHEET_DELETE = 'single-time-sheet-delete',
  WEEKLY_TIME_SHEET_READ = 'weekly-time-sheet-read',
  WEEKLY_TIME_SHEET_SAVE = 'weekly-time-sheet-save',
  WEEKLY_TIME_SHEET_PARTIAL_SAVE = 'weekly-time-sheet-partial-save',
  WEEKLY_TIME_SHEET_COPY_LAST_WEEK = 'weekly-time-sheet-copy-last-week',
  WEEKLY_TIME_SHEET_EXPORT = 'weekly-time-sheet-export',
  WEEKLY_TIME_SHEET_PRINT = 'weekly-time-sheet-print',
  SETTINGS_GET = 'settings-get',
  SETTINGS_SAVE = 'settings-save',
  EMPLOYER_SETTINGS_GET = 'employer-settings-get',
  EMPLOYER_SETTINGS_SAVE = 'employer-settings-save',
  TRANSACTION_TIME_SEARCH = 'single-txn-time-entry-read',
  CLOCK_IN = 'time-clock-in',
  CLOCK_OUT = 'time-clock-out',
  EMPLOYEE_READ = 'employee-read',
  TIME_ACTION_BUTTON_CLICK = 'time-action-button-click',
  ACTIVE_TIME_ENTRY_READ = 'active-time-entry-read',
  CLOCK_OUT_SWITCH_JOB = 'clock-out-switch-job',
  CLOCK_IN_SAVE = 'clock-in-save',
  TOTAL_DURATION_BY_DATE_OR_WEEK_READ = 'total-duration-by-date-or-week-read',
  TOTAL_DURATION_BY_TIME_WINDOW_READ = 'total-duration-by-time-window-read',
  WORKER_READ = 'worker-employee-and-vendor-read',
  BREAK_RULE_READ = 'break-rule-read',
  BREAK_RULE_CREATE = 'break-rule-create',
  BREAK_RULE_UPDATE = 'break-rule-update',
  BREAK_RULE_DELETE = 'break-rule-delete',
  BREAK_ASSIGNMENT_READ = 'break-assignment-read',
  BREAK_ASSIGNMENT_CREATE = 'break-assignment-create',
  BREAK_ASSIGNMENT_READ_BY_ASSIGNEE = 'break-assignment-read-by-assignee',
  CUSTOM_FIELDS_REQUIRED_UPDATE = 'custom-fields-required-update',
  GET_DIMENSIONS = 'get-dimensions', // success / degraded
  BREAK_START = 'break-start',
  BREAK_END = 'break-end',
  STANDARD_FIELD_ASSIGNMENT_SUMMARY_READ = 'standard-field-assignment-summary-read',
  STANDARD_FIELD_OPTION_SUMMARY_READ = 'standard-field-option-summary-read',
  TIME_AGAINST_ASSIGNMENT_SUMMARY_READ = 'time-against-assignment-summary-read',
  TIME_AGAINST_ASSIGNMENT_READ = 'time-against-assignment-read',
  TIME_FOR_ASSIGNMENT_READ = 'time-for-assignment-read',
  CUSTOM_FIELD_ASSIGNMENT_READ = 'custom-field-assignment-read',
  CUSTOM_FIELD_OPTION_ASSIGNMENT_READ = 'custom-field-option-assignment-read',
  STANDARD_FIELD_OPTION_ASSIGNMENT_READ = 'standard-field-option-assignment-read',
  GROUPS_READ = 'groups-read',
  UNASSIGNED_WORKERS_READ = 'unassigned-workers-read',
  WORKERS_READ_FOR_ASSIGNMENT = 'workers-read-for-assignment',
  STANDARD_FIELD_ASSIGNMENT_READ = 'standard-field-assignment-read',
  TIME_AGAINST_FIELD_ASSIGNMENT_MANAGE = 'time-against-field-assignment-manage',
  TIME_AGAINST_TIME_FOR_ASSIGNMENT_MANAGE = 'time-against-time-for-assignment-manage',
  STANDARD_FIELD_ASSIGNMENT_MANAGE = 'standard-field-assignment-manage',
  STANDARD_FIELD_OPTION_TIME_FOR_ASSIGNMENT_MANAGE = 'standard-field-option-time-for-assignment-manage',
  STANDARD_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MANAGE = 'standard-field-option-time-against-assignment-manage',
  CUSTOM_FIELD_ASSIGNMENT_MANAGE = 'custom-field-assignment-manage',
  CUSTOM_FIELD_OPTION_ASSIGNMENT_MANAGE = 'custom-field-option-assignment-manage',
  CUSTOM_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MANAGE = 'custom-field-option-time-against-assignment-manage',
  GET_APPROVAL_SETTINGS = 'get-approval-settings',
  UPDATE_APPROVAL_SETTINGS = 'update-approval-settings',
  SUBMIT_TIME_PANEL_SUMMARY_LISTED = 'submit-time-panel-summary-listed',
  SUBMIT_TIME_PANEL_ENTRY_SUBMITTED = 'submit-time-panel-entry-submitted',
  GROUP_CREATE = 'group-create',
  GROUP_DELETE = 'group-delete',
  GROUP_UPDATE = 'group-update',
  GROUP_ASSIGN_MEMBERS = 'group-assign-members',
  GROUP_ASSIGN_MANAGERS = 'group-assign-managers',
  GROUP_MEMBERS_READ = 'group-members-read',
  GROUP_MANAGERS_READ = 'group-managers-read',
  GROUP_REMOVE_MEMBERS = 'group-remove-members',
  GROUP_REMOVE_MANAGERS = 'group-remove-managers',
  WHO_IS_WORKING_LOAD = 'who-is-working-load',
  USER_LOCATION_SETTINGS_READ = 'user-location-settings-read',
  USER_LOCATION_SETTINGS_SAVE = 'user-location-settings-save',
  USER_UNIFIED_SETTINGS_READ = 'user-unified-settings-read',
  TIME_ENTRY_LOCATION_READ = 'time-entry-location-read',
  USER_NOTIFICATION_SETTINGS_READ = 'user-notification-settings-read',
  USER_NOTIFICATION_SETTINGS_SAVE = 'user-notification-settings-save',
  USER_PERMISSIONS_READ = 'user-permissions-read',
  USER_PERMISSIONS_SAVE = 'user-permissions-save',

  // Overtime Policy Interactions
  OVERTIME_POLICIES_READ = 'overtime-policies-read',
  OVERTIME_POLICY_READ = 'overtime-policy-read',
  USER_OVERTIME_POLICY_READ = 'user-overtime-policy-read',
  OVERTIME_POLICY_CREATE = 'overtime-policy-create',
  OVERTIME_POLICY_UPDATE = 'overtime-policy-update',
  OVERTIME_POLICY_DELETE = 'overtime-policy-delete',
  OVERTIME_POLICY_ASSIGNMENT_MANAGE = 'overtime-policy-assignment-manage',
  OVERTIME_SETTINGS_GET = 'overtime-settings-get',

  // Geofence Interactions
  GEOFENCE_CONFIGURATION_READ = 'geofence-configuration-read',
  GEOFENCE_RADIUS_READ = 'geofence-radius-read',
  GEOFENCE_CONFIGURATION_UPDATE = 'geofence-configuration-update',

  // ITM (Intuit Task Management) Interactions
  ITM_TASKS_READ = 'itm-tasks-read',
  ITM_TASK_UPDATE = 'itm-task-update',

  TIME_PROJECT_LIST_READ = 'time-project-list-read',
  TIME_PROJECT_ESTIMATES_READ = 'time-project-estimates-read',
  TIME_PROJECT_ESTIMATE_CREATE = 'time-project-estimate-create',
  TIME_PROJECT_ESTIMATE_UPDATE = 'time-project-estimate-update',
  TIME_PROJECT_ESTIMATE_DELETE = 'time-project-estimate-delete',
  TIME_PROJECT_ASSIGNMENT_SUMMARY_READ = 'time-project-assignment-summary-read',
  TIME_PROJECT_WORKER_TIME_SUMMARY_READ = 'time-project-worker-time-summary-read',
  TIME_PROJECT_FETCH_BY_ID = 'time-project-fetch-by-id',
  TIME_PROJECT_NAME_SEARCH = 'time-project-name-search',

  // Time Project — Posts feature.
  // Reads:
  TIME_PROJECT_POSTS_UNREAD_COUNT_READ = 'time-project-posts-unread-count-read', // success / degraded
  TIME_PROJECT_POSTS_FEED_READ = 'time-project-posts-feed-read',
  TIME_PROJECT_POSTS_REPLIES_READ = 'time-project-posts-replies-read',
  TIME_PROJECT_POST_MENTION_SEARCH = 'time-project-post-mention-search', // success / degraded
  // Mutations:
  TIME_PROJECT_POST_CREATE = 'time-project-post-create',
  TIME_PROJECT_POST_UPDATE = 'time-project-post-update',
  TIME_PROJECT_POST_DELETE = 'time-project-post-delete',
  TIME_PROJECT_POSTS_MARK_READ = 'time-project-posts-mark-read',
  TIME_PROJECT_POST_ATTACHMENTS_CREATE = 'time-project-post-attachments-create',
  TIME_PROJECT_POST_ATTACHMENTS_DELETE = 'time-project-post-attachments-delete',
}

export const REASON_NOISY_ERROR = 'NOISY_ERROR';

export const createCustomerInteraction = (
  sandbox: Sandbox,
  interactionName: string,
  metaData: any = undefined,
) =>
  sandbox.performance.createCustomerInteraction(interactionName, metaData, {
    returnExistingCI: true,
  });

export const getCustomerInteraction = (
  sandbox: Sandbox,
  interactionName: string,
) => sandbox.performance.getCustomerInteraction(interactionName);

/**
 * Get trace propagation headers of given customer interaction
 * WILL FAIL AND CRASH SCREEN if no customer interaction is present, this on purpose.
 * Make sure a customer interaction is correctly created in your code
 *
 * @param sandbox
 * @param interactionName
 */
export const getCustomerInteractionPropagationHeaders = (
  sandbox: Sandbox,
  interactionName: string,
) =>
  sandbox.performance
    .getCustomerInteraction(interactionName)!
    .getTracePropagationHeaders();

export const endInteractionWithSuccess = (
  sandbox: Sandbox,
  interactionName: string,
) => {
  const { performance } = sandbox;
  const interaction = getCustomerInteraction(sandbox, interactionName);
  if (interaction) {
    interaction.success();
    performance.record(interaction);
    sandbox.logger.log(
      `CustomerInteraction ${interactionName} marked as success.`,
    );
  }
};

export const setInteractionDegraded = (
  sandbox: Sandbox,
  interactionName: string,
  reason: string,
) => {
  const { performance } = sandbox;
  const interaction = getCustomerInteraction(sandbox, interactionName);
  if (interaction) {
    interaction.setDegraded(reason);
    // When an interaction is degraded, set the interaction as degraded by using setDegraded() and then calling success() once the interaction is complete.
    // Successful interactions marked as degraded will be categorized as degraded.
    // Failed interactions marked as degraded will be categorized as a failure.
    interaction.success();
    performance.record(interaction);
    sandbox.logger.log(
      `CustomerInteraction ${interactionName} marked as degraded with reason: ${reason}`,
    );
  }
};

/**
 * Degraded error codes for:
 * 1. Time Entry operations (SINGLE_TIME_SHEET_CREATE/UPDATE)
 * 2. Group operations (duplicate group name, invalid group name)
 * These errors should mark the interaction as degraded instead of failed
 * Note: In Context of entries, This ONLY applies to Time Entry (exported entries), NOT Time Activity (non-exported entries)
 */
const DEGRADED_ERROR_CODES = [
  'CONFLICTING_END_TIME_ENTRY',
  'CONFLICTING_START_END_TIME_ENTRY',
  'CONFLICTING_START_TIME_ENTRY',
  'DURATION_MUST_BE_LESS_THAN_24_HOURS',
  'START_OR_END_TIME_IN_FUTURE',
  'TSHEET_SYNC_FAILED_FOR_CREATE_TIMESHEET',
  'GROUP_NAME_ALREADY_EXISTS',
  'GROUP_NAME_INVALID',
  'OPTIMISTIC_LOCK_FAILURE',
  'GROUP_ALREADY_INACTIVE',
  'INACTIVE_GROUP',
  'WORKER_VALIDATION_FAILED',
];

/**
 * Checks if an error should be treated as degraded for Time Entry operations and Group operations
 * Note: In Context of entries, This ONLY applies to Time Entry (exported entries), NOT Time Activity (non-exported entries)
 * @param errorCode - The error code from the API
 * @param errorMessage - Optional error message for pattern matching
 * @returns true if the error should be treated as degraded
 */
export const shouldTreatErrorAsDegraded = (
  errorCode?: string,
  errorMessage?: string,
): boolean => {
  // Check if error code is in the degraded list
  if (errorCode && DEGRADED_ERROR_CODES.includes(errorCode)) {
    return true;
  }

  // Check if error message contains duplicate key violation
  if (
    errorMessage &&
    errorMessage.toLowerCase().includes('duplicate key value violates')
  ) {
    return true;
  }

  return false;
};

/**
 * Checks if an error should be treated as degraded for Weekly Timesheet Save operations
 * @param errorMessage - Error message or details to check
 * @returns true if the error should be treated as degraded
 */
export const shouldTreatWeeklyTimesheetErrorAsDegraded = (
  errorMessage?: string,
): boolean => {
  // Check if error message contains DataSyncWorkflowActivityType
  if (errorMessage && errorMessage.includes('DataSyncWorkflowActivityType')) {
    return true;
  }

  return false;
};

export const endInteractionWithFailure = (
  sandbox: Sandbox,
  interactionName: string,
  reason: string,
  error: any = null,
) => {
  const { performance } = sandbox;
  const interaction = getCustomerInteraction(sandbox, interactionName);
  if (interaction) {
    let interactionResult;
    // Pass the actual error object to isErrorNoise when available for better noise detection
    // (e.g., checking ApolloError graphQLErrors for EntityNotFoundException).
    // Falls back to the reason string for backward compatibility with existing callers.
    if (isErrorNoise(error ?? reason)) {
      interaction.abort(`${REASON_NOISY_ERROR}: ${reason}`);
      interactionResult = 'aborted';
    } else {
      interaction.fail(reason);
      interactionResult = 'failed';
    }

    if (error) {
      interaction.addMetadata(error);
    }

    performance.record(interaction);
    sandbox.logger.log(
      `CustomerInteraction ${interactionName} marked as ${interactionResult}.`,
    );
  }
};
