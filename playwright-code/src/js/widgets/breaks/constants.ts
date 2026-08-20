import {
  Common_DayOfWeek,
  Payroll_Break,
} from 'src/__generated__/oigql/graphql';
import {
  TrackingPoints,
  createTrackingPoints,
} from 'src/js/common/useClickTracking';

export const MAX_BREAK_RULES = 20;
export const DEFAULT_NOTIFY_DURATION = 5;

/**
 * Map of break types to their corresponding NLS keys for proper localization
 */
export const BREAK_TYPE_NLS_MAP: Record<Payroll_Break, string> = {
  [Payroll_Break.Paid]: 'breaks.create.type.paid',
  [Payroll_Break.Unpaid]: 'breaks.create.type.unpaid',
} as const;

// Pagination constants
export const BREAK_PAGINATION_DEFAULTS = {
  DEFAULT_PAGE: 1 as number,
  DEFAULT_PAGE_SIZE: 20 as number,
} as const;

export enum BreakDaysOfWeek {
  MondayToFriday = 'Monday - Friday',
  MondayToSaturday = 'Monday - Saturday',
  AllWeek = 'All week',
}

// Individual days for multiselect dropdown
export const INDIVIDUAL_DAYS_OF_WEEK = [
  {
    value: Common_DayOfWeek.Monday,
    label: 'monday',
  },
  {
    value: Common_DayOfWeek.Tuesday,
    label: 'tuesday',
  },
  {
    value: Common_DayOfWeek.Wednesday,
    label: 'wednesday',
  },
  {
    value: Common_DayOfWeek.Thursday,
    label: 'thursday',
  },
  {
    value: Common_DayOfWeek.Friday,
    label: 'friday',
  },
  {
    value: Common_DayOfWeek.Saturday,
    label: 'saturday',
  },
  {
    value: Common_DayOfWeek.Sunday,
    label: 'sunday',
  },
];

export const BREAK_DAYS_OF_WEEK_OPTIONS = [
  {
    value: BreakDaysOfWeek.MondayToFriday,
    label: 'breaks.create.auto.daysOfWeek.mf',
  },
  {
    value: BreakDaysOfWeek.MondayToSaturday,
    label: 'breaks.create.auto.daysOfWeek.ms',
  },
  {
    value: BreakDaysOfWeek.AllWeek,
    label: 'breaks.create.auto.daysOfWeek.all',
  },
];

// Mapping from BreakDaysOfWeek to Common_DayOfWeek arrays
export const BREAK_DAYS_TO_COMMON_DAYS_MAP = {
  [BreakDaysOfWeek.MondayToFriday]: [
    Common_DayOfWeek.Monday,
    Common_DayOfWeek.Tuesday,
    Common_DayOfWeek.Wednesday,
    Common_DayOfWeek.Thursday,
    Common_DayOfWeek.Friday,
  ],
  [BreakDaysOfWeek.MondayToSaturday]: [
    Common_DayOfWeek.Monday,
    Common_DayOfWeek.Tuesday,
    Common_DayOfWeek.Wednesday,
    Common_DayOfWeek.Thursday,
    Common_DayOfWeek.Friday,
    Common_DayOfWeek.Saturday,
  ],
  [BreakDaysOfWeek.AllWeek]: [
    Common_DayOfWeek.Monday,
    Common_DayOfWeek.Tuesday,
    Common_DayOfWeek.Wednesday,
    Common_DayOfWeek.Thursday,
    Common_DayOfWeek.Friday,
    Common_DayOfWeek.Saturday,
    Common_DayOfWeek.Sunday,
  ],
};

// Worker type constants
export const WORKER_TYPES = {
  EMPLOYEE: 'Employee',
  VENDOR: 'Vendor',
} as const;

export type WorkerType = (typeof WORKER_TYPES)[keyof typeof WORKER_TYPES];

// Break location constants
export const BREAK_LOCATIONS = {
  START: 'start',
  MIDDLE: 'middle',
  END: 'end',
  SPECIFIC: 'specific',
} as const;

export type BreakLocation =
  (typeof BREAK_LOCATIONS)[keyof typeof BREAK_LOCATIONS];

// Break Policy Error Codes
export const BREAK_POLICY_ERROR_CODES = {
  // General Errors
  GENERAL_ERROR: 'GENERAL_ERROR',

  // Break Policy Specific Validation Errors
  BREAK_REQUEST_NULL: 'BREAK_REQUEST_NULL',
  BREAK_ID_NULL_FOR_CREATE: 'BREAK_ID_NULL_FOR_CREATE',
  BREAK_ID_REQUIRED_FOR_UPDATE: 'BREAK_ID_REQUIRED_FOR_UPDATE',
  COMPANY_ACCOUNT_ID_MISMATCH: 'COMPANY_ACCOUNT_ID_MISMATCH',
  COMPANY_ACCOUNT_ID_LENGTH_EXCEEDED: 'COMPANY_ACCOUNT_ID_LENGTH_EXCEEDED',
  COMPANY_ACCOUNT_ID_BLANK_FOR_CREATE: 'COMPANY_ACCOUNT_ID_BLANK_FOR_CREATE',
  POLICY_NAME_REQUIRED_FOR_CREATE: 'POLICY_NAME_REQUIRED_FOR_CREATE',
  POLICY_NAME_BLANK_IF_PROVIDED: 'POLICY_NAME_BLANK_IF_PROVIDED',
  POLICY_NAME_LENGTH_EXCEEDED: 'POLICY_NAME_LENGTH_EXCEEDED',
  BREAK_TYPE_REQUIRED_FOR_CREATE: 'BREAK_TYPE_REQUIRED_FOR_CREATE',
  NO_BREAK_TYPE_ENABLED: 'NO_BREAK_TYPE_ENABLED',
  MANUAL_RULE_REQUIRED: 'MANUAL_RULE_REQUIRED',
  MANUAL_RULE_NOT_ALLOWED: 'MANUAL_RULE_NOT_ALLOWED',
  AUTO_RULE_REQUIRED: 'AUTO_RULE_REQUIRED',
  AUTO_RULE_NOT_ALLOWED: 'AUTO_RULE_NOT_ALLOWED',
  BREAK_DURATION_NULL_FOR_SET_DURATION: 'BREAK_DURATION_NULL_FOR_SET_DURATION',
  BREAK_DURATION_NOT_NULL_FOR_NO_SET_DURATION:
    'BREAK_DURATION_NOT_NULL_FOR_NO_SET_DURATION',
  BREAK_DURATION_RANGE_INVALID: 'BREAK_DURATION_RANGE_INVALID',
  DURATION_UNIT_REQUIRED: 'DURATION_UNIT_REQUIRED',
  REMINDER_TIME_REQUIRED: 'REMINDER_TIME_REQUIRED',
  REMINDER_TIME_RANGE_INVALID: 'REMINDER_TIME_RANGE_INVALID',
  REMINDER_TIME_EXCEEDS_BREAK_DURATION: 'REMINDER_TIME_EXCEEDS_BREAK_DURATION',
  REMINDER_TIME_NOT_NULL_WHEN_DISABLED: 'REMINDER_TIME_NOT_NULL_WHEN_DISABLED',
  AUTO_SHIFT_THRESHOLD_RANGE_INVALID: 'AUTO_SHIFT_THRESHOLD_RANGE_INVALID',
  AUTO_SPECIFIC_TIME_REQUIRED: 'AUTO_SPECIFIC_TIME_REQUIRED',
  AUTO_SPECIFIC_TIME_FORMAT_INVALID: 'AUTO_SPECIFIC_TIME_FORMAT_INVALID',
  AUTO_SPECIFIC_TIME_NOT_NULL_WHEN_NOT_SPECIFIC:
    'AUTO_SPECIFIC_TIME_NOT_NULL_WHEN_NOT_SPECIFIC',
  AUTO_BREAK_POSITION_REQUIRED_WITH_SPECIFIC_TIME:
    'AUTO_BREAK_POSITION_REQUIRED_WITH_SPECIFIC_TIME',
  AUTO_WORK_DAYS_EMPTY: 'AUTO_WORK_DAYS_EMPTY',
  AUTO_WORK_DAY_INVALID: 'AUTO_WORK_DAY_INVALID',
  AUTO_DURATION_UNIT_REQUIRED: 'AUTO_DURATION_UNIT_REQUIRED',
  AUTO_SHIFT_THRESHOLD_LESS_THAN_BREAK_DURATION:
    'AUTO_SHIFT_THRESHOLD_LESS_THAN_BREAK_DURATION',
  EMPLOYER_BREAK_NOT_FOUND: 'EMPLOYER_BREAK_NOT_FOUND',
  BREAK_NAME_ALREADY_EXISTS: 'BREAK_NAME_ALREADY_EXISTS',

  // Batch Assignment Errors
  BATCH_REQUEST_NULL: 'BATCH_REQUEST_NULL',
  BREAK_POLICY_ID_REQUIRED: 'BREAK_POLICY_ID_REQUIRED',
  ASSIGNMENTS_LIST_EMPTY: 'ASSIGNMENTS_LIST_EMPTY',
  ASSIGNMENT_NULL_IN_BATCH: 'ASSIGNMENT_NULL_IN_BATCH',
  ASSIGNEE_ID_REQUIRED: 'ASSIGNEE_ID_REQUIRED',
  ASSIGNMENT_TYPE_REQUIRED: 'ASSIGNMENT_TYPE_REQUIRED',
  DUPLICATE_ASSIGNMENT_IN_BATCH: 'DUPLICATE_ASSIGNMENT_IN_BATCH',
  INVALID_ASSIGNEE_ID_TYPE_FORMAT: 'INVALID_ASSIGNEE_ID_TYPE_FORMAT',
  EMPLOYER_BREAK_NOT_FOUND_FOR_ASSIGNMENT:
    'EMPLOYER_BREAK_NOT_FOUND_FOR_ASSIGNMENT',
} as const;

// Validation Error Codes Array for easy checking
export const BREAK_VALIDATION_ERROR_CODES = [
  // Request structure validation errors
  BREAK_POLICY_ERROR_CODES.BREAK_REQUEST_NULL,
  BREAK_POLICY_ERROR_CODES.BREAK_ID_NULL_FOR_CREATE,
  BREAK_POLICY_ERROR_CODES.BREAK_ID_REQUIRED_FOR_UPDATE,

  // Company account validation errors
  BREAK_POLICY_ERROR_CODES.COMPANY_ACCOUNT_ID_MISMATCH,
  BREAK_POLICY_ERROR_CODES.COMPANY_ACCOUNT_ID_LENGTH_EXCEEDED,
  BREAK_POLICY_ERROR_CODES.COMPANY_ACCOUNT_ID_BLANK_FOR_CREATE,

  // Policy name validation errors
  BREAK_POLICY_ERROR_CODES.POLICY_NAME_REQUIRED_FOR_CREATE,
  BREAK_POLICY_ERROR_CODES.POLICY_NAME_BLANK_IF_PROVIDED,
  BREAK_POLICY_ERROR_CODES.POLICY_NAME_LENGTH_EXCEEDED,
  BREAK_POLICY_ERROR_CODES.BREAK_NAME_ALREADY_EXISTS,

  // Break type configuration validation errors
  BREAK_POLICY_ERROR_CODES.BREAK_TYPE_REQUIRED_FOR_CREATE,
  BREAK_POLICY_ERROR_CODES.NO_BREAK_TYPE_ENABLED,
  BREAK_POLICY_ERROR_CODES.MANUAL_RULE_REQUIRED,
  BREAK_POLICY_ERROR_CODES.MANUAL_RULE_NOT_ALLOWED,
  BREAK_POLICY_ERROR_CODES.AUTO_RULE_REQUIRED,
  BREAK_POLICY_ERROR_CODES.AUTO_RULE_NOT_ALLOWED,

  // Duration validation errors
  BREAK_POLICY_ERROR_CODES.BREAK_DURATION_NULL_FOR_SET_DURATION,
  BREAK_POLICY_ERROR_CODES.BREAK_DURATION_NOT_NULL_FOR_NO_SET_DURATION,
  BREAK_POLICY_ERROR_CODES.BREAK_DURATION_RANGE_INVALID,
  BREAK_POLICY_ERROR_CODES.DURATION_UNIT_REQUIRED,

  // Reminder validation errors
  BREAK_POLICY_ERROR_CODES.REMINDER_TIME_REQUIRED,
  BREAK_POLICY_ERROR_CODES.REMINDER_TIME_RANGE_INVALID,
  BREAK_POLICY_ERROR_CODES.REMINDER_TIME_EXCEEDS_BREAK_DURATION,
  BREAK_POLICY_ERROR_CODES.REMINDER_TIME_NOT_NULL_WHEN_DISABLED,

  // Auto break configuration validation errors
  BREAK_POLICY_ERROR_CODES.AUTO_SHIFT_THRESHOLD_RANGE_INVALID,
  BREAK_POLICY_ERROR_CODES.AUTO_SPECIFIC_TIME_REQUIRED,
  BREAK_POLICY_ERROR_CODES.AUTO_SPECIFIC_TIME_FORMAT_INVALID,
  BREAK_POLICY_ERROR_CODES.AUTO_SPECIFIC_TIME_NOT_NULL_WHEN_NOT_SPECIFIC,
  BREAK_POLICY_ERROR_CODES.AUTO_BREAK_POSITION_REQUIRED_WITH_SPECIFIC_TIME,
  BREAK_POLICY_ERROR_CODES.AUTO_WORK_DAYS_EMPTY,
  BREAK_POLICY_ERROR_CODES.AUTO_WORK_DAY_INVALID,
  BREAK_POLICY_ERROR_CODES.AUTO_DURATION_UNIT_REQUIRED,
  BREAK_POLICY_ERROR_CODES.AUTO_SHIFT_THRESHOLD_LESS_THAN_BREAK_DURATION,

  // Assignment validation errors
  BREAK_POLICY_ERROR_CODES.BATCH_REQUEST_NULL,
  BREAK_POLICY_ERROR_CODES.BREAK_POLICY_ID_REQUIRED,
  BREAK_POLICY_ERROR_CODES.ASSIGNMENTS_LIST_EMPTY,
  BREAK_POLICY_ERROR_CODES.ASSIGNMENT_NULL_IN_BATCH,
  BREAK_POLICY_ERROR_CODES.ASSIGNEE_ID_REQUIRED,
  BREAK_POLICY_ERROR_CODES.ASSIGNMENT_TYPE_REQUIRED,
  BREAK_POLICY_ERROR_CODES.DUPLICATE_ASSIGNMENT_IN_BATCH,
  BREAK_POLICY_ERROR_CODES.INVALID_ASSIGNEE_ID_TYPE_FORMAT,
  BREAK_POLICY_ERROR_CODES.EMPLOYER_BREAK_NOT_FOUND_FOR_ASSIGNMENT,

  // Resource not found validation errors
  BREAK_POLICY_ERROR_CODES.EMPLOYER_BREAK_NOT_FOUND,
] as const;

// Assignment Validation Error Codes Array for easy checking
export const BREAK_ASSIGNMENT_VALIDATION_ERROR_CODES = [
  // Assignment validation errors
  BREAK_POLICY_ERROR_CODES.BATCH_REQUEST_NULL,
  BREAK_POLICY_ERROR_CODES.BREAK_POLICY_ID_REQUIRED,
  BREAK_POLICY_ERROR_CODES.ASSIGNMENTS_LIST_EMPTY,
  BREAK_POLICY_ERROR_CODES.ASSIGNMENT_NULL_IN_BATCH,
  BREAK_POLICY_ERROR_CODES.ASSIGNEE_ID_REQUIRED,
  BREAK_POLICY_ERROR_CODES.ASSIGNMENT_TYPE_REQUIRED,
  BREAK_POLICY_ERROR_CODES.DUPLICATE_ASSIGNMENT_IN_BATCH,
  BREAK_POLICY_ERROR_CODES.INVALID_ASSIGNEE_ID_TYPE_FORMAT,
  BREAK_POLICY_ERROR_CODES.EMPLOYER_BREAK_NOT_FOUND_FOR_ASSIGNMENT,
] as const;

// Break Entry Validation Error Codes Array for easy checking
export const BREAK_ENTRY_VALIDATION_ERROR_CODES = [
  // Break entry validation errors
  'MANUAL_MODE_NOT_ALLOWED',
  'BREAK_RULE_NOT_FOUND',
  'TT_BREAK_DURATION_INVALID',
  'START_END_TIME_AND_DURATION_CANNOT_BE_PROVIDED_TOGETHER',
  'START_END_TIME_OR_DURATION_REQUIRED',
  'DURATION_MUST_BE_LESS_THAN_9999_HOURS',
  'BREAK_DURATION_MUST_BE_LESS_THAN_9999',
  'BREAK_DURATION_INVALID_OR_LESS_THAN_ZERO',
  'CONFLICTING_TIME_ENTRY',
  'CONFLICTING_END_TIME_ENTRY',
  'TIME_FOR_ID_MISSING',
  'START_END_TIME_OR_DURATION_MISSING',
  'MANUAL_RULE_NOT_DEFINED',
  'INVALID_BREAK_DURATION',
  'START_AND_END_TIME_REQUIRED_WHEN_ONE_PRESENT',
  'START_TIME_MUST_BE_BEFORE_END_TIME',
  'START_OR_END_TIME_IN_FUTURE',
  'CONFLICTING_START_TIME_ENTRY',
  'CONFLICTING_START_END_TIME_ENTRY',
] as const;

// Degraded Interaction Message Regex Patterns
// These patterns identify error messages that should mark FCI as degraded instead of failed
export const BREAK_DEGRADED_INTERACTION_MESSAGE_REGEX = [
  /permission denied/i,
  /forbidden/i,
  /IdentityGraphQLErrorResponseException/i,
  /having some technical difficulties. Please try again later/i,
  /Read timed out/i,
] as const;

// Validation Error Message Regex Patterns
// These patterns identify error messages that should be treated as validation errors
export const BREAK_VALIDATION_ERROR_MESSAGE_REGEX = [
  /is already in use/i,
] as const;

// Logging Constants
export const BREAK_LOGGING_CONSTANTS = {
  // API Error Logs
  API_ERRORS: {
    GET_ALL_BREAKS_FAILED: 'GET_ALL_BREAKS_FAILED',
    GET_BREAK_BY_ID_FAILED: 'GET_BREAK_BY_ID_FAILED',
    GET_BREAKS_BY_ASSIGNEE_FAILED: 'GET_BREAKS_BY_ASSIGNEE_FAILED',
    CREATE_BREAK_POLICY_FAILED: 'CREATE_BREAK_POLICY_FAILED',
    UPDATE_BREAK_POLICY_FAILED: 'UPDATE_BREAK_POLICY_FAILED',
    DELETE_BREAK_POLICY_FAILED: 'DELETE_BREAK_POLICY_FAILED',
    CREATE_BREAK_ASSIGNMENT_FAILED: 'CREATE_BREAK_ASSIGNMENT_FAILED',
    GET_BREAK_ASSIGNMENTS_FAILED: 'GET_BREAK_ASSIGNMENTS_FAILED',
    APOLLO_CLIENT_NOT_INITIALIZED: 'APOLLO_CLIENT_NOT_INITIALIZED',
    // Break Entry API Errors
    CREATE_BREAK_ENTRY_FAILED: 'CREATE_BREAK_ENTRY_FAILED',
    UPDATE_BREAK_ENTRY_FAILED: 'UPDATE_BREAK_ENTRY_FAILED',
    GET_BREAK_ENTRIES_FAILED: 'GET_BREAK_ENTRIES_FAILED',
    DELETE_BREAK_ENTRY_FAILED: 'DELETE_BREAK_ENTRY_FAILED',
  },

  // Navigation Logs
  NAVIGATION: {
    BREAKS_WIDGET_MOUNTED: 'BREAKS_WIDGET_MOUNTED',
    PREFERENCES_DRAWER_OPENED: 'PREFERENCES_DRAWER_OPENED',
    PREFERENCES_DRAWER_CLOSED: 'PREFERENCES_DRAWER_CLOSED',
    TOUR_STARTED: 'TOUR_STARTED',
    TOUR_COMPLETED: 'TOUR_COMPLETED',
    TOUR_DISMISSED: 'TOUR_DISMISSED',
    // Break Entry Navigation
    BREAK_ENTRY_FORM_OPENED: 'BREAK_ENTRY_FORM_OPENED',
    BREAK_ENTRY_FORM_CLOSED: 'BREAK_ENTRY_FORM_CLOSED',
    BREAK_ENTRY_EDIT_FORM_OPENED: 'BREAK_ENTRY_EDIT_FORM_OPENED',
    BREAK_ENTRY_EDIT_FORM_CLOSED: 'BREAK_ENTRY_EDIT_FORM_CLOSED',
    TOUR_NOT_STARTED: 'TOUR_NOT_STARTED',
  },

  // User Interaction Logs
  USER_INTERACTIONS: {
    ADD_BREAK_RULE_CLICKED: 'ADD_BREAK_RULE_CLICKED',
    EDIT_BREAK_RULE_CLICKED: 'EDIT_BREAK_RULE_CLICKED',
    DELETE_BREAK_RULE_CLICKED: 'DELETE_BREAK_RULE_CLICKED',
    TOGGLE_BREAK_ACTIVE_CLICKED: 'TOGGLE_BREAK_ACTIVE_CLICKED',
    ASSIGN_TEAM_MEMBERS_CLICKED: 'ASSIGN_TEAM_MEMBERS_CLICKED',
    FORM_SAVE_CLICKED: 'FORM_SAVE_CLICKED',
    FORM_CANCEL_CLICKED: 'FORM_CANCEL_CLICKED',
    FORM_VALIDATION_FAILED: 'FORM_VALIDATION_FAILED',
    TEAM_MEMBERS_SEARCH_PERFORMED: 'TEAM_MEMBERS_SEARCH_PERFORMED',
    TEAM_MEMBER_SELECTED: 'TEAM_MEMBER_SELECTED',
    TEAM_MEMBER_DESELECTED: 'TEAM_MEMBER_DESELECTED',
    BREAK_TYPE_CHANGED: 'BREAK_TYPE_CHANGED',
    BREAK_DURATION_CHANGED: 'BREAK_DURATION_CHANGED',
    BREAK_NAME_CHANGED: 'BREAK_NAME_CHANGED',
    AUTO_RULE_TOGGLED: 'AUTO_RULE_TOGGLED',
    MANUAL_RULE_TOGGLED: 'MANUAL_RULE_TOGGLED',
    NO_SET_DURATION_TOGGLED: 'NO_SET_DURATION_TOGGLED',
    // Break Entry User Interactions
    BREAK_ENTRY_FORM_SAVE_CLICKED: 'BREAK_ENTRY_FORM_SAVE_CLICKED',
    BREAK_ENTRY_FORM_SAVE_AND_NEW_CLICKED:
      'BREAK_ENTRY_FORM_SAVE_AND_NEW_CLICKED',
    BREAK_ENTRY_FORM_CANCEL_CLICKED: 'BREAK_ENTRY_FORM_CANCEL_CLICKED',
    BREAK_ENTRY_EDIT_FORM_SAVE_CLICKED: 'BREAK_ENTRY_EDIT_FORM_SAVE_CLICKED',
    BREAK_ENTRY_EDIT_FORM_CANCEL_CLICKED:
      'BREAK_ENTRY_EDIT_FORM_CANCEL_CLICKED',
    BREAK_ENTRY_FORM_VALIDATION_FAILED: 'BREAK_ENTRY_FORM_VALIDATION_FAILED',
    BREAK_ENTRY_EDIT_FORM_VALIDATION_FAILED:
      'BREAK_ENTRY_EDIT_FORM_VALIDATION_FAILED',
    BREAK_ENTRY_FORM_FIELD_CHANGED: 'BREAK_ENTRY_FORM_FIELD_CHANGED',
    BREAK_ENTRY_EDIT_FORM_FIELD_CHANGED: 'BREAK_ENTRY_EDIT_FORM_FIELD_CHANGED',
  },

  // Form State Logs
  FORM_STATE: {
    FORM_RESET: 'FORM_RESET',
    FORM_DATA_CHANGED: 'FORM_DATA_CHANGED',
    FORM_VALIDATION_PASSED: 'FORM_VALIDATION_PASSED',
    FORM_SUBMISSION_STARTED: 'FORM_SUBMISSION_STARTED',
    FORM_SUBMISSION_COMPLETED: 'FORM_SUBMISSION_COMPLETED',
    FORM_SUBMISSION_FAILED: 'FORM_SUBMISSION_FAILED',
    // Break Entry Form State
    BREAK_ENTRY_FORM_RESET: 'BREAK_ENTRY_FORM_RESET',
    BREAK_ENTRY_FORM_DATA_CHANGED: 'BREAK_ENTRY_FORM_DATA_CHANGED',
    BREAK_ENTRY_FORM_VALIDATION_PASSED: 'BREAK_ENTRY_FORM_VALIDATION_PASSED',
    BREAK_ENTRY_FORM_SUBMISSION_STARTED: 'BREAK_ENTRY_FORM_SUBMISSION_STARTED',
    BREAK_ENTRY_FORM_SUBMISSION_COMPLETED:
      'BREAK_ENTRY_FORM_SUBMISSION_COMPLETED',
    BREAK_ENTRY_FORM_SUBMISSION_FAILED: 'BREAK_ENTRY_FORM_SUBMISSION_FAILED',
    BREAK_ENTRY_EDIT_FORM_RESET: 'BREAK_ENTRY_EDIT_FORM_RESET',
    BREAK_ENTRY_EDIT_FORM_DATA_CHANGED: 'BREAK_ENTRY_EDIT_FORM_DATA_CHANGED',
    BREAK_ENTRY_EDIT_FORM_VALIDATION_PASSED:
      'BREAK_ENTRY_EDIT_FORM_VALIDATION_PASSED',
    BREAK_ENTRY_EDIT_FORM_SUBMISSION_STARTED:
      'BREAK_ENTRY_EDIT_FORM_SUBMISSION_STARTED',
    BREAK_ENTRY_EDIT_FORM_SUBMISSION_COMPLETED:
      'BREAK_ENTRY_EDIT_FORM_SUBMISSION_COMPLETED',
    BREAK_ENTRY_EDIT_FORM_SUBMISSION_FAILED:
      'BREAK_ENTRY_EDIT_FORM_SUBMISSION_FAILED',
  },

  // Success Logs
  SUCCESS: {
    GET_ALL_BREAKS_SUCCESS: 'GET_ALL_BREAKS_SUCCESS',
    GET_BREAKS_BY_ASSIGNEE_SUCCESS: 'GET_BREAKS_BY_ASSIGNEE_SUCCESS',
    CREATE_BREAK_POLICY_SUCCESS: 'CREATE_BREAK_POLICY_SUCCESS',
    UPDATE_BREAK_POLICY_SUCCESS: 'UPDATE_BREAK_POLICY_SUCCESS',
    DELETE_BREAK_POLICY_SUCCESS: 'DELETE_BREAK_POLICY_SUCCESS',
    CREATE_BREAK_ASSIGNMENT_SUCCESS: 'CREATE_BREAK_ASSIGNMENT_SUCCESS',
    GET_BREAK_ASSIGNMENTS_SUCCESS: 'GET_BREAK_ASSIGNMENTS_SUCCESS',
    BREAK_RULE_ACTIVATED: 'BREAK_RULE_ACTIVATED',
    BREAK_RULE_DEACTIVATED: 'BREAK_RULE_DEACTIVATED',
    TEAM_MEMBERS_ASSIGNED: 'TEAM_MEMBERS_ASSIGNED',
    PREFERENCES_SAVED: 'PREFERENCES_SAVED',
    // Break Entry Success
    CREATE_BREAK_ENTRY_SUCCESS: 'CREATE_BREAK_ENTRY_SUCCESS',
    UPDATE_BREAK_ENTRY_SUCCESS: 'UPDATE_BREAK_ENTRY_SUCCESS',
    GET_BREAK_ENTRIES_SUCCESS: 'GET_BREAK_ENTRIES_SUCCESS',
    DELETE_BREAK_ENTRY_SUCCESS: 'DELETE_BREAK_ENTRY_SUCCESS',
  },

  // Performance Logs
  PERFORMANCE: {
    FORM_RENDER_TIME: 'FORM_RENDER_TIME',
    API_RESPONSE_TIME: 'API_RESPONSE_TIME',
    COMPONENT_MOUNT_TIME: 'COMPONENT_MOUNT_TIME',
    DATA_LOAD_TIME: 'DATA_LOAD_TIME',
    // Break Entry Performance
    BREAK_ENTRY_FORM_RENDER_TIME: 'BREAK_ENTRY_FORM_RENDER_TIME',
    BREAK_ENTRY_EDIT_FORM_RENDER_TIME: 'BREAK_ENTRY_EDIT_FORM_RENDER_TIME',
    BREAK_ENTRY_API_RESPONSE_TIME: 'BREAK_ENTRY_API_RESPONSE_TIME',
  },

  // Validation Error Logs
  VALIDATION_ERRORS: {
    CREATE_BREAK_ASSIGNMENT_VALIDATION_ERROR:
      'CREATE_BREAK_ASSIGNMENT_VALIDATION_ERROR',
    UPDATE_BREAK_POLICY_VALIDATION_ERROR:
      'UPDATE_BREAK_POLICY_VALIDATION_ERROR',
    DELETE_BREAK_POLICY_VALIDATION_ERROR:
      'DELETE_BREAK_POLICY_VALIDATION_ERROR',
    CREATE_BREAK_POLICY_VALIDATION_ERROR:
      'CREATE_BREAK_POLICY_VALIDATION_ERROR',
  },
} as const;

export const BREAK_ENTRY_FIELDS_WIDTH = 230;

// Base template for break entry tracking points
// Uses existing QBO key names and structure so QBO doesn't need modifications
export const BASE_BREAK_ENTRY_TRACKING_TEMPLATE = {
  // Navigation & Entry Points
  ADD_BREAK_FROM_ADD_TIME: {
    org: 'sbseg',
    purpose: 'prod',
    scope: 'qbtime',
    scope_area: 'time-tracking',
    object: 'widget',
    object_detail: 'time_entries',
    action: 'engaged',
    ui_object: 'button',
    ui_object_detail: 'add_break',
    ui_action: 'clicked',
    ui_access_point: 'dropdown',
  },
  ADD_BREAK_DRAWER_VIEWED: {
    org: 'sbseg',
    purpose: 'prod',
    scope: 'qbtime',
    scope_area: 'time-tracking',
    object: 'widget',
    object_detail: 'time_entries',
    action: 'viewed',
    ui_object: 'page',
    ui_object_detail: 'break_entry',
    ui_action: 'viewed',
    ui_access_point: 'modal',
  },

  // Form Field Interactions (existing inline tracking points)
  BREAK_TEAM_MEMBER_FIELD: {
    org: 'sbseg',
    purpose: 'prod',
    scope: 'time',
    scope_area: 'breakentrymanagement',
    action: 'engaged',
    object: 'component',
    object_detail: 'break_team_member_field',
    ui_action: 'clicked',
    ui_object: 'dropdown',
    ui_object_detail: 'break_team_member_field',
    ui_access_point: 'modal',
  },
  BREAK_CURRENTLY_WORKING_FIELD: {
    org: 'sbseg',
    purpose: 'prod',
    scope: 'time',
    scope_area: 'breakentrymanagement',
    action: 'engaged',
    object: 'component',
    object_detail: 'break_currently_working_field',
    ui_action: 'clicked',
    ui_object: 'checkbox',
    ui_object_detail: 'break_currently_working_field',
    ui_access_point: 'modal',
  },
  BREAK_START_TIME_FIELD: {
    org: 'sbseg',
    purpose: 'prod',
    scope: 'time',
    scope_area: 'breakentrymanagement',
    action: 'engaged',
    object: 'component',
    object_detail: 'break_start_time_field',
    ui_action: 'clicked',
    ui_object: 'dropdown',
    ui_object_detail: 'break_start_time_field',
    ui_access_point: 'modal',
  },
  BREAK_END_TIME_FIELD: {
    org: 'sbseg',
    purpose: 'prod',
    scope: 'time',
    scope_area: 'breakentrymanagement',
    action: 'engaged',
    object: 'component',
    object_detail: 'break_end_time_field',
    ui_action: 'clicked',
    ui_object: 'dropdown',
    ui_object_detail: 'break_end_time_field',
    ui_access_point: 'modal',
  },
  BREAK_TIMEZONE_FIELD: {
    org: 'sbseg',
    purpose: 'prod',
    scope: 'time',
    scope_area: 'breakentrymanagement',
    action: 'engaged',
    object: 'component',
    object_detail: 'break_timezone_field',
    ui_action: 'clicked',
    ui_object: 'dropdown',
    ui_object_detail: 'break_timezone_field',
    ui_access_point: 'modal',
  },
  BREAK_NOTES_FIELD: {
    org: 'sbseg',
    purpose: 'prod',
    scope: 'time',
    scope_area: 'breakentrymanagement',
    action: 'engaged',
    object: 'component',
    object_detail: 'break_notes_field',
    ui_action: 'clicked',
    ui_object: 'textarea',
    ui_object_detail: 'break_notes_field',
    ui_access_point: 'modal',
  },

  // New tracking points (not currently in QBO but needed for WFS)
  SET_START_END_TIME_TOGGLE: {
    org: 'sbseg',
    purpose: 'prod',
    scope: 'time',
    scope_area: 'breakentrymanagement',
    action: 'enabled',
    object: 'component',
    object_detail: 'set_start_and_end_start_toggle',
    ui_action: '', // enabled | disabled - set dynamically based on toggle state
    ui_object: 'switch',
    ui_object_detail: 'set_start_and_end_start_toggle',
    ui_access_point: 'modal',
  },
  DURATION_FIELD: {
    org: 'sbseg',
    purpose: 'prod',
    scope: 'time',
    scope_area: 'breakentrymanagement',
    action: 'started',
    object: 'component',
    object_detail: 'duration_field',
    ui_action: 'typed',
    ui_object: 'form_field',
    ui_object_detail: 'duration_field',
    ui_access_point: 'modal',
  },

  // Action Buttons
  SAVE_BREAK: {
    org: 'sbseg',
    purpose: 'prod',
    scope: 'qbtime',
    scope_area: 'time-tracking',
    object: 'widget',
    object_detail: 'add_break',
    action: 'engaged',
    ui_object: 'button',
    ui_object_detail: 'save',
    ui_action: 'clicked',
    ui_access_point: 'drawer',
  },
  SAVE_AND_NEW_BREAK: {
    org: 'sbseg',
    purpose: 'prod',
    scope: 'qbtime',
    scope_area: 'time-tracking',
    object: 'widget',
    object_detail: 'add_break',
    action: 'engaged',
    ui_object: 'button',
    ui_object_detail: 'save',
    ui_action: 'clicked',
    ui_access_point: 'drawer',
  },
  EXIT_BREAK: {
    org: 'sbseg',
    purpose: 'prod',
    scope: 'qbtime',
    scope_area: 'time-tracking',
    object: 'widget',
    object_detail: 'add_break',
    action: 'engaged',
    ui_object: 'button',
    ui_object_detail: 'exit',
    ui_action: 'clicked',
    ui_access_point: 'drawer',
  },
  CANCEL_BREAK: {
    org: 'sbseg',
    purpose: 'prod',
    scope: 'qbtime',
    scope_area: 'time-tracking',
    object: 'widget',
    object_detail: 'add_break',
    action: 'engaged',
    ui_object: 'button',
    ui_object_detail: 'X',
    ui_action: 'clicked',
    ui_access_point: 'drawer',
  },
  UNAPPROVE_TIME_FOR_EMPLOYEE: {
    org: 'sbseg',
    purpose: 'prod',
    scope: 'qbtime',
    scope_area: 'time-tracking',
    object: 'widget',
    object_detail: 'add_break',
    action: 'engaged',
    ui_object: 'button',
    ui_object_detail: 'unapprove_time',
    ui_action: 'clicked',
    ui_access_point: 'drawer',
  },

  // Unsaved Changes Modal
  UNSAVED_CHANGES_MODAL_VIEWED: {
    org: 'sbseg',
    purpose: 'prod',
    scope: 'qbtime',
    scope_area: 'time-tracking',
    object: 'component',
    object_detail: 'break_entry_save_page',
    action: 'viewed',
    ui_object: 'page',
    ui_object_detail: 'break_entry_save_page',
    ui_action: 'viewed',
    ui_access_point: 'drawer',
  },
  DONT_SAVE_BUTTON: {
    org: 'sbseg',
    purpose: 'prod',
    scope: 'qbtime',
    scope_area: 'time-tracking',
    object: 'widget',
    object_detail: 'break_entry_dont_save',
    action: 'engaged',
    ui_object: 'button',
    ui_object_detail: 'break_entry_dont_save',
    ui_action: 'clicked',
    ui_access_point: 'drawer',
  },
} as const;

// QBO Break Entry Tracking Points (using break_entries screen for QBO)
// Simply applies the screen name to all base template tracking points
export const BREAKS_TRACKING_POINTS: TrackingPoints = createTrackingPoints(
  'break_entries',
  BASE_BREAK_ENTRY_TRACKING_TEMPLATE,
  {
    // Tour Modal Tracking (QBO-specific, not in base template)
    BREAK_TOUR_MODAL_OPEN: {
      org: 'sbseg',
      purpose: 'prod',
      scope: 'time',
      scope_area: 'breaks',
      screen: 'breaks_drawer',
      action: 'engaged',
      object: 'widget',
      object_detail: 'break_tour_modal_open',
      ui_action: 'viewed',
      ui_object: 'modal',
      ui_object_detail: 'break_tour_modal_open',
      ui_access_point: 'modal',
    },
    BREAK_TOUR_MODAL_CLOSE: {
      org: 'sbseg',
      purpose: 'prod',
      scope: 'time',
      scope_area: 'breaks',
      screen: 'breaks_drawer',
      action: 'engaged',
      object: 'widget',
      object_detail: 'break_tour_modal_close',
      ui_action: 'clicked',
      ui_object: 'button',
      ui_object_detail: 'break_tour_modal_close',
      ui_access_point: 'modal',
    },
    BREAK_TOUR_MODAL_FINISH: {
      org: 'sbseg',
      purpose: 'prod',
      scope: 'time',
      scope_area: 'breaks',
      screen: 'breaks_drawer',
      action: 'engaged',
      object: 'widget',
      object_detail: 'break_tour_modal_completed',
      ui_action: 'clicked',
      ui_object: 'button',
      ui_object_detail: 'break_tour_modal_completed',
      ui_access_point: 'modal',
    },
    BREAK_TOUR_MODAL_FAILED: {
      org: 'sbseg',
      purpose: 'prod',
      scope: 'time',
      scope_area: 'breaks',
      screen: 'breaks_drawer',
      action: 'engaged',
      object: 'widget',
      object_detail: 'break_tour_modal_failed',
      ui_action: 'clicked',
      ui_object: 'button',
      ui_object_detail: 'break_tour_modal_failed',
      ui_access_point: 'modal',
    },
  },
);

// WFS (Workforce Solutions) Break Entry Tracking Points
export const WFS_BREAKS_TRACKING_POINTS: TrackingPoints = createTrackingPoints(
  'add_break_entry',
  BASE_BREAK_ENTRY_TRACKING_TEMPLATE,
  {
    // Override navigation for WFS (from global_create per PDF)
    ADD_BREAK_FROM_ADD_TIME: {
      screen: 'global_create',
      action: 'navigated',
      object: 'component',
      object_detail: 'break_entry',
      ui_object: 'page',
      ui_object_detail: 'break_entry',
      ui_access_point: 'global_create',
    },
    ADD_BREAK_DRAWER_VIEWED: {
      object: 'component',
      object_detail: 'break_entry',
      ui_object: 'page',
      ui_object_detail: 'break_entry',
      action: 'navigated',
      ui_action: 'viewed',
      ui_access_point: 'drawer',
    },
    // Field interactions - change ui_access_point from 'modal' to 'drawer' for WFS
    BREAK_TEAM_MEMBER_FIELD: {
      ui_access_point: 'drawer',
    },
    BREAK_CURRENTLY_WORKING_FIELD: {
      object_detail: 'currently_working_field',
      ui_object_detail: 'currently_working_field',
      ui_access_point: 'drawer',
    },
    BREAK_START_TIME_FIELD: {
      object_detail: 'start_time',
      ui_object: 'form_field',
      ui_object_detail: 'start_time',
      action: 'started',
      ui_access_point: 'drawer',
    },
    BREAK_END_TIME_FIELD: {
      object_detail: 'end_time',
      ui_object: 'form_field',
      ui_object_detail: 'end_time',
      action: 'started',
      ui_access_point: 'drawer',
    },
    BREAK_TIMEZONE_FIELD: {
      object_detail: 'timezone',
      ui_object: 'form_field',
      ui_object_detail: 'timezone',
      action: 'started',
      ui_access_point: 'drawer',
    },
    BREAK_NOTES_FIELD: {
      object_detail: 'time_notes_field',
      ui_object: 'form_field',
      ui_object_detail: 'time_notes_field',
      ui_action: 'typed',
      ui_access_point: 'drawer',
    },
    // New fields for WFS
    SET_START_END_TIME_TOGGLE: {
      ui_access_point: 'drawer',
    },
    DURATION_FIELD: {
      ui_access_point: 'drawer',
    },
    // Action buttons - WFS uses 'component' instead of 'widget'
    SAVE_BREAK: {
      object: 'component',
      object_detail: 'save_break_entry',
      ui_object_detail: 'save_break_entry',
    },
    SAVE_AND_NEW_BREAK: {
      object: 'component',
      object_detail: 'save_new_break_entry',
      ui_object_detail: 'save_new_break_entry',
      ui_access_point: 'drawer',
    },
    EXIT_BREAK: {
      object: 'component',
      object_detail: 'exit_break_entry',
      ui_object_detail: 'exit_break_entry',
    },
    CANCEL_BREAK: {
      object: 'component',
      object_detail: 'cancel_time_sheet',
      ui_object_detail: 'cancel_time_sheet',
    },
    UNAPPROVE_TIME_FOR_EMPLOYEE: {
      object: 'component',
    },
    // Unsaved changes modal
    UNSAVED_CHANGES_MODAL_VIEWED: {
      ui_access_point: 'drawer',
    },
    DONT_SAVE_BUTTON: {
      ui_access_point: 'drawer',
    },
  },
  { scope: 'time', scope_area: 'workforce' }, // Global override for all WFS tracking points
);
export const BREAK_SETTINGS_TRACKING_POINTS: TrackingPoints = {
  EDIT_BREAKS_IN_SETTINGS: {
    org: 'sbseg',
    purpose: 'prod',
    scope: 'qbtime',
    scope_area: 'time-tracking',
    screen: 'break_settings',
    object: 'widget',
    object_detail: 'account_and_settings',
    action: 'engaged',
    ui_object: 'button',
    ui_object_detail: 'edit',
    ui_action: 'clicked',
    ui_access_point: 'center',
  },
  VIEW_MANAGE_BREAKS: {
    org: 'sbseg',
    purpose: 'prod',
    scope: 'qbtime',
    scope_area: 'time-tracking',
    screen: 'break_settings',
    object: 'widget',
    object_detail: 'manage_breaks',
    action: 'viewed',
    ui_object: '',
    ui_object_detail: '',
    ui_action: '',
    ui_access_point: '',
  },
  ASSIGNED_TO_CTA: {
    org: 'sbseg',
    purpose: 'prod',
    scope: 'qbtime',
    scope_area: 'time-tracking',
    screen: 'break_settings',
    object: 'widget',
    object_detail: 'manage_breaks',
    action: 'engaged',
    ui_object: 'button',
    ui_object_detail: 'assigned_to',
    ui_action: 'clicked',
    ui_access_point: 'center',
  },
  ACTIVATE_TOGGLE: {
    org: 'sbseg',
    purpose: 'prod',
    scope: 'qbtime',
    scope_area: 'time-tracking',
    screen: 'break_settings',
    object: 'widget',
    object_detail: 'manage_breaks',
    action: 'engaged',
    ui_object: 'switch',
    ui_object_detail: 'activate',
    ui_action: 'enabled',
    ui_access_point: 'center',
  },
  INACTIVATE_TOGGLE: {
    org: 'sbseg',
    purpose: 'prod',
    scope: 'qbtime',
    scope_area: 'time-tracking',
    screen: 'break_settings',
    object: 'widget',
    object_detail: 'manage_breaks',
    action: 'engaged',
    ui_object: 'switch',
    ui_object_detail: 'inactivate',
    ui_action: 'disabled',
    ui_access_point: 'center',
  },
  EDIT_BREAK_RULE: {
    org: 'sbseg',
    purpose: 'prod',
    scope: 'qbtime',
    scope_area: 'time-tracking',
    screen: 'break_settings',
    object: 'widget',
    object_detail: 'manage_breaks',
    action: 'engaged',
    ui_object: 'button',
    ui_object_detail: 'edit',
    ui_action: 'clicked',
    ui_access_point: 'center',
  },
  DELETE_BREAK: {
    org: 'sbseg',
    purpose: 'prod',
    scope: 'qbtime',
    scope_area: 'time-tracking',
    screen: 'break_settings',
    object: 'widget',
    object_detail: 'manage_breaks',
    action: 'engaged',
    ui_object: 'button',
    ui_object_detail: 'delete',
    ui_action: 'clicked',
    ui_access_point: 'center',
  },
  CANCEL_DELETE_BREAK_RULE: {
    org: 'sbseg',
    purpose: 'prod',
    scope: 'qbtime',
    scope_area: 'time-tracking',
    screen: 'break_settings',
    object: 'widget',
    object_detail: 'manage_breaks',
    action: 'engaged',
    ui_object: 'button',
    ui_object_detail: 'cancel',
    ui_action: 'clicked',
    ui_access_point: '',
  },
  CONFIRM_DELETE_BREAK_RULE: {
    org: 'sbseg',
    purpose: 'prod',
    scope: 'qbtime',
    scope_area: 'time-tracking',
    screen: 'break_settings',
    object: 'widget',
    object_detail: 'manage_breaks',
    action: 'engaged',
    ui_object: 'button',
    ui_object_detail: 'delete',
    ui_action: 'clicked',
    ui_access_point: '',
  },
  ADD_BREAK_RULE: {
    org: 'sbseg',
    purpose: 'prod',
    scope: 'qbtime',
    scope_area: 'time-tracking',
    screen: 'break_settings',
    object: 'widget',
    object_detail: 'manage_breaks',
    action: 'engaged',
    ui_object: 'button',
    ui_object_detail: 'add_break_rule',
    ui_action: 'clicked',
    ui_access_point: 'center',
  },
  VIEW_BREAK_RULE_DRAWER: {
    org: 'sbseg',
    purpose: 'prod',
    scope: 'qbtime',
    scope_area: 'time-tracking',
    screen: 'break_settings',
    object: 'widget',
    object_detail: 'break_rule',
    action: 'viewed',
    ui_object: '',
    ui_object_detail: '',
    ui_action: '',
    ui_access_point: '',
  },
  EXIT_ADD_BREAK_RULE: {
    org: 'sbseg',
    purpose: 'prod',
    scope: 'qbtime',
    scope_area: 'time-tracking',
    screen: 'break_settings',
    object: 'widget',
    object_detail: 'break_rule',
    action: 'engaged',
    ui_object: 'button',
    ui_object_detail: 'X',
    ui_action: 'clicked',
    ui_access_point: 'drawer',
  },
  CANCEL_ADD_BREAK_RULE: {
    org: 'sbseg',
    purpose: 'prod',
    scope: 'qbtime',
    scope_area: 'time-tracking',
    screen: 'break_settings',
    object: 'widget',
    object_detail: 'break_rule',
    action: 'viewed',
    ui_object: 'button',
    ui_object_detail: 'cancel',
    ui_action: 'clicked',
    ui_access_point: 'drawer',
  },
  SAVE_BREAK_RULE: {
    org: 'sbseg',
    purpose: 'prod',
    scope: 'qbtime',
    scope_area: 'time-tracking',
    screen: 'break_settings',
    object: 'widget',
    object_detail: 'break_rule',
    action: 'viewed',
    ui_object: 'button',
    ui_object_detail: 'save',
    ui_action: 'clicked',
    ui_access_point: 'drawer',
    break_type: 'automatic, manual', // event-specific param from column R
  },
  SELECT_ASSIGNMENTS: {
    org: 'sbseg',
    purpose: 'prod',
    scope: 'qbtime',
    scope_area: 'time-tracking',
    screen: 'break_settings',
    object: 'widget',
    object_detail: 'break_rule',
    action: 'viewed',
    ui_object: 'button',
    ui_object_detail: 'edit_access',
    ui_action: 'clicked',
    ui_access_point: 'drawer',
  },
  SAVE_ASSIGNMENTS: {
    org: 'sbseg',
    purpose: 'prod',
    scope: 'qbtime',
    scope_area: 'time-tracking',
    screen: 'break_settings',
    object: 'widget',
    object_detail: 'break_assignments',
    action: 'viewed',
    ui_object: 'button',
    ui_object_detail: 'save',
    ui_action: 'clicked',
    ui_access_point: 'drawer',
  },
  CANCEL_ASSIGNMENTS: {
    org: 'sbseg',
    purpose: 'prod',
    scope: 'qbtime',
    scope_area: 'time-tracking',
    screen: 'break_settings',
    object: 'widget',
    object_detail: 'break_assignments',
    action: 'viewed',
    ui_object: 'button',
    ui_object_detail: 'cancel',
    ui_action: 'clicked',
    ui_access_point: 'drawer',
  },
  EXIT_ASSIGNMENTS: {
    org: 'sbseg',
    purpose: 'prod',
    scope: 'qbtime',
    scope_area: 'time-tracking',
    screen: 'break_settings',
    object: 'widget',
    object_detail: 'break_assignments',
    action: 'engaged',
    ui_object: 'button',
    ui_object_detail: 'X',
    ui_action: 'clicked',
    ui_access_point: 'drawer',
  },
  GO_BACK_FROM_ASSIGNMENTS: {
    org: 'sbseg',
    purpose: 'prod',
    scope: 'qbtime',
    scope_area: 'time-tracking',
    screen: 'break_settings',
    object: 'widget',
    object_detail: 'break_assignments',
    action: 'viewed',
    ui_object: 'button',
    ui_object_detail: 'back',
    ui_action: 'clicked',
    ui_access_point: 'drawer',
  },
};
