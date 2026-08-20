import { TIME_ENTRY_SETTINGS_TRACKING_POINTS } from 'src/js/widgets/timeTrackingSettings/timeEntrySettingsTrackingPoints';
import { ITimeEntriesFormEditing } from './types';

export const TWENTY_FOUR_HOUR_FORMAT = 24;

export enum TimeEntriesFormType {
  TIMETRACKING = 'Timetracking',
  TIMESHEET = 'Timesheet',
  NOTIFICATION = 'Notification',
  CUSTOM_FIELDS = 'CustomFields',
  OVERTIME = 'Overtime',
  GEO_LOCATIONS = 'GeoLocations',
  APPROVALS = 'Approvals',
}

/**
 * Optional entry point for the `timeTrackingSettings` widget. When a caller
 * (a different page) mounts the widget with `trowserKey` set, the widget skips
 * the full settings page and opens directly into the requested settings trowser
 * in a standalone (trowser-only) mode. Closing the trowser invokes the widget's
 * `onClose` callback so the caller can navigate back to itself.
 */
export type SettingsTrowserKey = 'timesheet-settings';

/**
 * Identifies the caller/context that launched the `timeTrackingSettings` widget.
 * When set to `'payroll_defaults'`, the standalone timesheet settings trowser
 * is closed (control is handed back to the caller via `onClose`).
 */

export const PAYROLL_DEFAULTS_SOURCE = 'payroll_defaults';

/**
 * Canonical `data-search-section` keys for the Time tab.
 *
 * These are the cross-repo contract for In-page Settings Search (SET-08): the
 * host (`qbo-settings-ui-v2`) reads its `timeTabIndex.json` source of truth and
 * deep-links + scrolls to the section whose anchor matches one of these keys.
 * Keep them stable, lowercase `snake_case`, and defined here only — a single
 * source of truth so the anchors rendered across the tab can never diverge.
 *
 * Note: these intentionally differ from the widget's internal compact deep-link
 * keys (`timetracking`, `timeoff`, `geolocation`, `customfields`) used by
 * `sectionNavigation.ts`; the host search index uses the snake_case form.
 */
export const SEARCH_SECTION_KEYS = Object.freeze({
  TIME_TRACKING: 'time_tracking',
  TIME_OFF: 'time_off',
  TIMESHEET_FIELDS: 'timesheet_fields',
  CUSTOM_FIELDS: 'custom_fields',
  BREAKS: 'breaks',
  OVERTIME: 'overtime',
  SCHEDULES: 'schedules',
  GEO_LOCATIONS: 'geo_locations',
  KIOSK: 'kiosk',
  NOTIFICATIONS: 'notifications',
  APPROVALS: 'approvals',
} as const);

export const IS_TIME_ENTRIES_FORM_EDITING: ITimeEntriesFormEditing = {
  isNotificationEditing: false,
  isTimeTrackingEditing: false,
  isTimeSheetFieldsEditing: false,
  isGeoLocationsEditing: false,
  isApprovalEditing: false,
};

// Time tracking settings constants
export enum TIME_TRACKING_SETTINGS {
  FIRST_DAY_OF_WEEK = 'firstDayOfWeek',
  TIME_ZONE = 'timeZone',
  TIME_FORMAT = 'timeFormat',
  SPLIT_TIME_SHEET_AT_MIDNIGET_ENABLED = 'splitTimeSheetAtMidnightEnabled',
  MANAGE_OWN_TIME_SHEETS_ENABLED = 'manageOwnTimeSheetsEnabled',
  MOBILE_TIME_TRACKING_ENABLED = 'mobileTimeTrackingEnabled',
  SIGNATURE_CAPTURE_ENABLED = 'signatureCaptureEnabled',
  EDIT_CLOCK_OUT_TIME_ENABLED = 'editClockOutTimeEnabled',
  ROUND_CLOCK_IN_TIME = 'roundClockInTime',
  ROUND_CLOCK_OUT_TIME = 'roundClockOutTime',
  CLOCK_OUT_OVERRIDE_HOURS = 'clockOutOverrideHours',
}

// Timesheet management constants
export enum TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS {
  TIME_SHEET_ENTRY_NOTES_ENABLE = 'timeSheetEntryNotesEnabled',
  TIME_SHEET_ENTRY_EDITS_NOTES_ENABLED = 'timeSheetEntryEditNotesEnabled',
  TIME_ENTRY_MAKES_NOTES_REQUIRES_ENABLES = 'timeSheetEntryMakesNotesRequiredEnabled',
  CUSTOMER_FOR_TIMESHEET_ENABLED = 'customersForTimeSheetEnabled',
  CLASS_ENABLES = 'classForTimeSheetEnabled',
  LOCATION_FOR_TIMESHEET_ENABLED = 'locationForTimeSheetEnabled',
  CLOCK_IN_NOTIFICATION_REMINDER_EMAIL = 'clockInNotificationReminderEmail',
  IS_BILLING_FIELD_ENABLED = 'isBillingFieldEnabled',
  BILLING_RATE_FOR_TIME_ENABLED = 'billingRateForTimeEnabled',
  REQUIRE_BILLABLE = 'requireBillable',
  IS_SERVICE_ENABLE = 'isServiceFieldEnabled',
  USE_ITEM_FOR_TIME = 'useItemForTime',
  REQUIRE_CLASS = 'classRequired',
  REQUIRE_LOCATION = 'locationRequired',
  REQUIRE_SERVICE_ITEM = 'serviceItemRequired',
}

// Time Tracking rounding constants
export enum CLOCK_ROUNDING_SETTINGS {
  CLOCK_IN_ROUND_DIRECTION = 'clockInRoundDirection',
  CLOCK_IN_ROUND_IN_MINUTE = 'clockInRoundInMin',
  CLOCK_OUT_ROUND_DIRECTION = 'clockOutRoundDirection',
  CLOCK_OUT_ROUND_IN_MINUTE = 'clockOutRoundInMin',
}

export const CLOCK_IN_OUT_DIRECTIONS: { [key: string]: string } = {
  up: 'UP',
  down: 'DOWN',
  nearest: 'NEAREST',
};

export const ROUNDING_INCREMENT_CLOCK_IN_OUT: { [key: string]: number } = {
  oneMin: 1,
  threeMin: 3,
  fiveMin: 5,
  sixMin: 6,
  tenMin: 10,
  fifteenMin: 15,
  thirtyMin: 30,
};

export const TIME_FORMATS: { [key: string]: number } = {
  twelveHourFormat: 12,
  twentyFourHourFormat: 24,
};

// Notification constants
export enum NotificationFieldType {
  CLOCK_IN = 'clockIn',
  CLOCK_OUT = 'clockOut',
}

export enum NotificationMedium {
  EMAIL = 'EMAIL',
  PUSH_NOTIFICATION = 'PUSH_NOTIFICATION',
}

export enum NotificationField {
  CLOCK_IN_EMAIL = 'clockInNotificationReminderEmail',
  CLOCK_IN_MOBILE = 'clockInNotificationReminderMobile',
  CLOCK_IN_TIME = 'clockInNotificationReminderTime',
  CLOCK_OUT_EMAIL = 'clockOutNotificationReminderEmail',
  CLOCK_OUT_MOBILE = 'clockOutNotificationReminderMobile',
  CLOCK_OUT_TIME = 'clockOutNotificationReminderTime',
}

export enum NotificationRecipient {
  ADMINS_AND_MANAGERS = 'adminsAndManagers',
  ADMINS_ONLY = 'adminsOnly',
  MANAGERS_ONLY = 'managersOnly',
  NONE = 'none',
}

export const NOTIFY_OPTIONS = [
  'adminsAndManagers',
  'adminsOnly',
  'managersOnly',
  'none',
];

export const NOTIFICATION_DAYS_OF_WEEK: { [key: string]: string } = {
  sunday: 'SUNDAY',
  monday: 'MONDAY',
  tuesday: 'TUESDAY',
  wednesday: 'WEDNESDAY',
  thursday: 'THURSDAY',
  friday: 'FRIDAY',
  saturday: 'SATURDAY',
};

export enum NotificationFieldKey {
  SEND_CLOCK_IN_NOTIFICATION_REMINDERS = 'sendClockInNotificationReminders',
  SEND_CLOCK_OUT_NOTIFICATION_REMINDERS = 'sendClockOutNotificationReminders',
  NOTIFICATION_ENABLED_FOR_DAYS = 'notificationEnabledForDays',
  NOTIFY_WHEN_CLOCK_IN_OUT_UPDATED = 'notifyWhenClockInOutUpdated',
  NOTIFY_WHEN_NOTES_ARE_ADDED_OR_EDITED = 'notifyWhenNotesAreAddedOrEdited',

  // Schedule header
  SCHEDULE_SECTION_HEADER = 'scheduleSectionHeader',

  // Schedule notifications
  // Shared key: view-form row key AND RHF form field name for the send-mode radio
  SCHEDULE_SHIFT_PUBLISHED_SEND_MODE = 'shiftPublishedSendMode',
  SCHEDULE_ONE_HOUR_BEFORE_SHIFT = 'scheduleOneHourBeforeShift',
  SCHEDULE_FORGOT_CLOCK_IN_AFTER_SHIFT_STARTED = 'scheduleForgotClockInAfterShiftStarted',
  SCHEDULE_FORGOT_CLOCK_IN_AFTER_SHIFT_ENDED = 'scheduleForgotClockInAfterShiftEnded',
  SCHEDULE_LATE_CLOCK_IN_NOTIFY_MANAGER = 'scheduleLateClockInNotifyManager',

  // RHF field names for the schedule channel arrays (distributionMethods per row).
  SCHEDULE_SHIFT_PUBLISHED_CHANNELS = 'scheduleShiftPublished',
  SCHEDULE_ONE_HOUR_CHANNELS = 'scheduleOneHour',
  SCHEDULE_FORGOT_CLOCK_IN_AFTER_STARTED_CHANNELS = 'scheduleForgotClockInAfterStarted',
  SCHEDULE_FORGOT_CLOCK_IN_AFTER_ENDED_CHANNELS = 'scheduleForgotClockInAfterEnded',
  SCHEDULE_LATE_CLOCK_IN_NOTIFY_MANAGER_CHANNELS = 'scheduleLateClockInNotifyManagerChannels',

  // Section headers
  APPROVALS_SECTION_HEADER = 'approvalsSectionHeader',
  SUBMISSIONS_SECTION_HEADER = 'submissionsSectionHeader',
  // Approval notification fields
  REMIND_MANAGERS_APPROVE_TIME = 'remindManagersApproveTime',
  REMIND_IF_TIME_NOT_APPROVED = 'remindIfTimeNotApproved',
  REMIND_SECOND_TIME_NOT_APPROVED = 'remindSecondTimeNotApproved',
  // Submission notification fields
  SEND_REMINDER_TEAM_SUBMIT_TIME = 'sendReminderTeamSubmitTime',
  REMIND_IF_TIME_NOT_SUBMITTED = 'remindIfTimeNotSubmitted',
  REMIND_SECOND_TIME_NOT_SUBMITTED = 'remindSecondTimeNotSubmitted',
  EMAIL_MANAGERS_TEAM_MEMBER_SUBMITS = 'emailManagersTeamMemberSubmits',
  EMAIL_MANAGERS_ENTIRE_TEAM_SUBMITS = 'emailManagersEntireTeamSubmits',

  MANAGER_REMINDER_BASED_ON = 'managerReminderBasedOn',
  MANAGER_FIRST_REMINDER = 'remindIfTimeNotApproved',
  MANAGER_SECOND_REMINDER = 'remindSecondTimeNotApproved',

  EMPLOYEE_REMINDER_BASED_ON = 'employeeReminderBasedOn',
  EMPLOYEE_FIRST_REMINDER = 'remindIfTimeNotSubmitted',
  EMPLOYEE_SECOND_REMINDER = 'remindSecondTimeNotSubmitted',

  NOTIFY_MANAGER_ON_GROUP_SUBMITTED = 'notifyManagerOnGroupSubmitted',
  NOTIFY_MANAGER_ON_SUBMIT = 'notifyManagerOnSubmit',

  MANAGER_CURRENT_WEEK_REMINDER_HOUR = 'managerCurrentWeekReminderHour',
  MANAGER_CURRENT_WEEK_REMINDER_MEDIUM = 'managerCurrentWeekReminderMedium',
  MANAGER_CURRENT_WEEK_REMINDER_DAYS = 'managerCurrentWeekReminderDays',

  MANAGER_PREVIOUS_WEEK_REMINDER_HOUR = 'managerPreviousWeekReminderHour',
  MANAGER_PREVIOUS_WEEK_REMINDER_MEDIUM = 'managerPreviousWeekReminderMedium',
  MANAGER_PREVIOUS_WEEK_REMINDER_DAYS = 'managerPreviousWeekReminderDays',

  MANAGER_CURRENT_PAY_PERIOD_REMINDER_HOUR = 'managerCurrentPayPeriodReminderHour',
  MANAGER_CURRENT_PAY_PERIOD_REMINDER_MEDIUM = 'managerCurrentPayPeriodReminderMedium',
  MANAGER_CURRENT_PAY_PERIOD_REMINDER_OFFSET_DAYS = 'managerCurrentPayPeriodReminderOffsetDays',

  MANAGER_PREVIOUS_PAY_PERIOD_REMINDER_HOUR = 'managerPreviousPayPeriodReminderHour',
  MANAGER_PREVIOUS_PAY_PERIOD_REMINDER_MEDIUM = 'managerPreviousPayPeriodReminderMedium',
  MANAGER_PREVIOUS_PAY_PERIOD_REMINDER_OFFSET_DAYS = 'managerPreviousPayPeriodReminderOffsetDays',

  EMPLOYEE_CURRENT_WEEK_REMINDER_HOUR = 'employeeCurrentWeekReminderHour',
  EMPLOYEE_CURRENT_WEEK_REMINDER_MEDIUM = 'employeeCurrentWeekReminderMedium',
  EMPLOYEE_CURRENT_WEEK_REMINDER_DAYS = 'employeeCurrentWeekReminderDays',

  EMPLOYEE_PREVIOUS_WEEK_REMINDER_HOUR = 'employeePreviousWeekReminderHour',
  EMPLOYEE_PREVIOUS_WEEK_REMINDER_MEDIUM = 'employeePreviousWeekReminderMedium',
  EMPLOYEE_PREVIOUS_WEEK_REMINDER_DAYS = 'employeePreviousWeekReminderDays',

  EMPLOYEE_CURRENT_PAY_PERIOD_REMINDER_HOUR = 'employeeCurrentPayPeriodReminderHour',
  EMPLOYEE_CURRENT_PAY_PERIOD_REMINDER_MEDIUM = 'employeeCurrentPayPeriodReminderMedium',
  EMPLOYEE_CURRENT_PAY_PERIOD_REMINDER_OFFSET_DAYS = 'employeeCurrentPayPeriodReminderOffsetDays',

  EMPLOYEE_PREVIOUS_PAY_PERIOD_REMINDER_HOUR = 'employeePreviousPayPeriodReminderHour',
  EMPLOYEE_PREVIOUS_PAY_PERIOD_REMINDER_MEDIUM = 'employeePreviousPayPeriodReminderMedium',
  EMPLOYEE_PREVIOUS_PAY_PERIOD_REMINDER_OFFSET_DAYS = 'employeePreviousPayPeriodReminderOffsetDays',

  EMPLOYEE_DAILY_REMINDER_FIRST_REMINDER_HOUR = 'employeeDailyReminderFirstReminderHour',
  EMPLOYEE_DAILY_REMINDER_FIRST_REMINDER_MEDIUM = 'employeeDailyReminderFirstReminderMedium',
  EMPLOYEE_DAILY_REMINDER_SECOND_REMINDER_HOUR = 'employeeDailyReminderSecondReminderHour',
  EMPLOYEE_DAILY_REMINDER_SECOND_REMINDER_MEDIUM = 'employeeDailyReminderSecondReminderMedium',
  SUBMISSION_REMINDER_DAYS_OF_WEEK = 'employeeDailyReminderForTimesheetDays',
  // Geofence notification fields
  GEOFENCE_SETTINGS_HEADER = 'geofenceSettingsHeader',
  GEOFENCE_REMINDER_SETTINGS = 'geofenceReminderSettings',
  GEOFENCE_REMINDER_START_TIME = 'geofenceReminderStartTime',
  GEOFENCE_REMINDER_END_TIME = 'geofenceReminderEndTime',
  GEOFENCE_REMINDER_DAYS_OF_WEEK = 'geofenceReminderDaysOfWeek',
}

// Tracking map for field keys to tracking points
export const FIELD_TRACKING_MAP: { [key: string]: any } = {
  // Main timesheet fields
  customersForTimeSheetEnabled:
    TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_FIELDS_CUSTOMERS_AND_SUBCUSTOMERS,
  isBillingFieldEnabled:
    TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_FIELDS_BILLABLE,
  isServiceFieldEnabled:
    TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_FIELDS_SERVICE_ITEM,
  classForTimeSheetEnabled:
    TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_FIELDS_CLASS,
  locationForTimeSheetEnabled:
    TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_FIELDS_LOCATION,
  timeSheetEntryNotesEnabled:
    TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_FIELDS_NOTES,
  // Sub-fields
  customersRequired:
    TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_FIELDS_CUSTOMERS_AND_SUBCUSTOMERS_REQUIRED,
  billingRateForTimeEnabled:
    TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_FIELDS_RATE_PER_HOUR,
  requireBillable:
    TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_FIELDS_BILLABLE_REQUIRED,
  timeSheetEntryEditNotesEnabled:
    TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_FIELDS_EDIT_NOTES,
  timeSheetEntryMakesNotesRequiredEnabled:
    TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_FIELDS_MAKE_NOTES_REQUIRED,
  serviceItemRequired:
    TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIME_SHEET_FIELD_SERVICE_ITEM_REQUIRED,
  classRequired:
    TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_FIELDS_CLASS_REQUIRED,
  locationRequired:
    TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_FIELDS_LOCATION_REQUIRED,
};
export enum IconSize {
  XSMALL = 'xsmall',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  XLARGE = 'xlarge',
  XXLARGE = 'xxlarge',
}

export enum MenuButtonPriority {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  TERTIARY = 'tertiary',
}

export enum MenuButtonPurpose {
  STANDARD = 'standard',
  PASSIVE = 'passive',
}

export enum CustomFieldActions {
  ADD = 'add',
  EDIT = 'edit',
  MANAGE = 'manage',
}

export enum ApprovalRemindersbasedOn {
  DAY_OF_WEEK = 'DAY_OF_WEEK',
  PAYROLL_CLOSE_DATE = 'PAYROLL_CLOSE_DATE',
  DAILY = 'DAILY',
}

export enum ApprovalReminderPrefix {
  CURRENT = 'Current',
  PREVIOUS = 'Previous',
}

export enum ReminderRole {
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
}

export enum ReminderPosition {
  FIRST = 'first',
  SECOND = 'second',
}

export enum ReminderFieldType {
  TIME = 'time',
  DAY = 'day',
}

export const APPROVAL_PAY_PERIOD_OPTIONS = [
  { value: '0', labelKey: 'time-entries.approvals.payroll-close-date.on' },
  {
    value: '1',
    labelKey: 'time-entries.approvals.payroll-close-date.1-day-after',
  },
  {
    value: '2',
    labelKey: 'time-entries.approvals.payroll-close-date.2-days-after',
  },
  {
    value: '3',
    labelKey: 'time-entries.approvals.payroll-close-date.3-days-after',
  },
  {
    value: '4',
    labelKey: 'time-entries.approvals.payroll-close-date.4-days-after',
  },
  {
    value: '5',
    labelKey: 'time-entries.approvals.payroll-close-date.5-days-after',
  },
];

export enum APPROVAL_FIELD_KEYS {
  REQUIRE_APPROVAL_FOR_TRACKED_TIME = 'requireApprovalForTrackedTime',
  ENABLE_PARTIAL_WEEK_SUBMISSION = 'enablePartialWeekSubmission',
  REQUIRE_TEAM_MEMBERS_SUBMIT_TIME = 'requireTeamMembersSubmitTime',
  CUSTOM_MESSAGE = 'customMessage',
}

// List of all form field names that are part of approval settings
export const APPROVAL_FIELD_NAMES = [
  'requireApprovalForTrackedTime',
  'enablePartialWeekSubmission',
  'requireTeamMembersSubmitTime',
  'customMessage',
  'managerReminderBasedOn',
  'managerCurrentWeekReminderDays',
  'managerCurrentWeekReminderHour',
  'managerCurrentWeekReminderMedium',
  'managerPreviousWeekReminderDays',
  'managerPreviousWeekReminderHour',
  'managerPreviousWeekReminderMedium',
  'managerCurrentPayPeriodReminderHour',
  'managerCurrentPayPeriodReminderOffsetDays',
  'managerCurrentPayPeriodReminderMedium',
  'managerPreviousPayPeriodReminderHour',
  'managerPreviousPayPeriodReminderOffsetDays',
  'managerPreviousPayPeriodReminderMedium',
  'employeeReminderBasedOn',
  'employeeCurrentWeekReminderDays',
  'employeeCurrentWeekReminderHour',
  'employeeCurrentWeekReminderMedium',
  'employeePreviousWeekReminderDays',
  'employeePreviousWeekReminderHour',
  'employeePreviousWeekReminderMedium',
  'employeeCurrentPayPeriodReminderHour',
  'employeeCurrentPayPeriodReminderOffsetDays',
  'employeeCurrentPayPeriodReminderMedium',
  'employeePreviousPayPeriodReminderHour',
  'employeePreviousPayPeriodReminderOffsetDays',
  'employeePreviousPayPeriodReminderMedium',
  'employeeDailyReminderFirstReminderHour',
  'employeeDailyReminderFirstReminderMedium',
  'employeeDailyReminderSecondReminderHour',
  'employeeDailyReminderSecondReminderMedium',
  'employeeDailyReminderForTimesheetDays',
  'notifyManagerOnSubmit',
  'notifyManagerOnGroupSubmitted',
];

/**
 * Element types for tracking
 */
export enum TrackingElementType {
  CHECKBOX = 'checkbox',
  TIME_DROPDOWN = 'time_dropdown',
  DAY_DROPDOWN = 'day_dropdown',
}

/**
 * Type definitions for tracking field mapping
 */
export type FieldTypeMapping = {
  [ReminderFieldType.TIME]: string;
  [ReminderFieldType.DAY]: string;
  checkbox: string;
};

export type PositionMapping = {
  [ReminderPosition.FIRST]: FieldTypeMapping;
  [ReminderPosition.SECOND]: FieldTypeMapping;
};

export type ModeMapping = {
  [key: string]: PositionMapping;
};

export type RoleMapping = {
  [ReminderRole.MANAGER]: ModeMapping;
  [ReminderRole.EMPLOYEE]: ModeMapping;
};
/**
 * Tracking field name mapping based on role, mode, position, and field type
 */
export const TRACKING_FIELD_MAPPING = {
  [ReminderRole.MANAGER]: {
    [ApprovalRemindersbasedOn.DAY_OF_WEEK]: {
      [ReminderPosition.FIRST]: {
        [ReminderFieldType.TIME]: 'dow_remind_managers_time',
        [ReminderFieldType.DAY]: 'dow_remind_managers_day',
        checkbox: 'dow_remind_managers_approve',
      },
      [ReminderPosition.SECOND]: {
        [ReminderFieldType.TIME]: 'dow_remind_managers_time_prior_week',
        [ReminderFieldType.DAY]: 'dow_remind_managers_day_prior_week',
        checkbox: 'dow_remind_managers_approve_prior_week',
      },
    },
    [ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE]: {
      [ReminderPosition.FIRST]: {
        [ReminderFieldType.TIME]: 'pay_period_remind_set_time_reminder_time',
        [ReminderFieldType.DAY]: 'pay_period_remind_set_time_reminder_day',
        checkbox: 'pay_period_remind_set_time_payroll_close_date',
      },
      [ReminderPosition.SECOND]: {
        [ReminderFieldType.TIME]:
          'pay_period_remind_payroll_close_date_reminder_time',
        [ReminderFieldType.DAY]:
          'pay_period_remind_payroll_close_date_reminder_day',
        checkbox: 'pay_period_remind_if_not_approved_by_payroll_close',
      },
    },
  },
  [ReminderRole.EMPLOYEE]: {
    [ApprovalRemindersbasedOn.DAY_OF_WEEK]: {
      [ReminderPosition.FIRST]: {
        [ReminderFieldType.TIME]: 'dow_remind_submission_time',
        [ReminderFieldType.DAY]: 'dow_remind_submission_day',
        checkbox: 'dow_remind_when_not_submitted',
      },
      [ReminderPosition.SECOND]: {
        [ReminderFieldType.TIME]: 'dow_remind_submission_time_prior_week',
        [ReminderFieldType.DAY]: 'dow_remind_submission_day_prior_week',
        checkbox: 'dow_remind_when_not_submitted_prior_week',
      },
    },
    [ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE]: {
      [ReminderPosition.FIRST]: {
        [ReminderFieldType.TIME]:
          'pay_period_submission_remind_set_time_reminder_time',
        [ReminderFieldType.DAY]:
          'pay_period_submission_remind_set_time_reminder_day',
        checkbox: 'pay_period_remind_set_time_payroll_close_date',
      },
      [ReminderPosition.SECOND]: {
        [ReminderFieldType.TIME]:
          'pay_period_submission_remind_payroll_close_date_reminder_time',
        [ReminderFieldType.DAY]:
          'pay_period_submission_remind_payroll_close_date_reminder_day',
        checkbox:
          'pay_period_Submission_remind_if_not_submitted_by_payroll_close',
      },
    },
    [ApprovalRemindersbasedOn.DAILY]: {
      [ReminderPosition.FIRST]: {
        [ReminderFieldType.TIME]: 'daily_first_reminder_time',
        [ReminderFieldType.DAY]: 'daily_days_of_week',
        checkbox: 'daily_first_reminder',
      },
      [ReminderPosition.SECOND]: {
        [ReminderFieldType.TIME]: 'daily_second_reminder_time',
        [ReminderFieldType.DAY]: 'daily_days_of_week',
        checkbox: 'daily_second_reminder',
      },
    },
  },
};

// Field Assignment Detail Table Columns
export const FIELD_ASSIGNMENT_TABLE_COLUMNS = [
  {
    key: 'name',
    translationKey: 'time-entries.table.header.standardFieldName',
  },
  {
    key: 'customers',
    translationKey: 'time-entries.table.header.customers-assigned',
  },
  { key: 'workers', translationKey: 'time-entries.table.header.workers' },
  { key: 'actions', translationKey: 'time-entries.table.header.actions' },
] as const;

// Links to be used throughout the time-tracking-ui plugin
export const LINKS = {
  // TODO : to be updated with the actual help URL once provided by Product team
  MILEAGE_TRACKING_HELP_URL:
    'https://quickbooks.intuit.com/learn-support/en-us/help-article/track-mileage/quickbooks-time-mileage-tracking/L71aqD2WE_US_en_US',
  ASSIGNMENTS_URL: '/app/time/assignments',
  MANAGE_DIMENSIONS_URL: '/app/class',
};

// Action constants for standard field option assignment operations
export const STANDARD_FIELD_ACTIONS = {
  ASSIGN_CUSTOMERS: 'assignCustomers',
  ASSIGN_WORKERS: 'assignWorkers',
} as const;

/** Kiosk settings embedded widget (legacy qbtime-setup-ui). */
export const MANAGE_KIOSK_LEGACY_WIDGET_ID = 'qbtime-setup-ui/settings/kiosk';

/** Kiosk settings via QBT orchestrator (time-tracking-ui). */
export const MANAGE_KIOSK_ORCHESTRATOR_WIDGET_ID =
  'time-tracking-ui/orchestrator';

// Payroll defaults widget source identifier
export const TIME_SETTINGS_WIDGET_SOURCE = 'TIME_SETTINGS';

// -----------------------------------------------------------------------------
// TEMPORARY - Schedule notifications (Time settings -> Notifications) placeholders.
// Remove once company settings / API own schedule data; view copy is composed at runtime
// in utils + NotificationsTimeEntrySettings using SCHEDULE_NOTIFICATION_VIEW_PREFIX keys.
// -----------------------------------------------------------------------------

export const SCHEDULE_NOTIFICATION_VIEW_PREFIX =
  'time-entries.section.title.notifications.schedule.view';

/**
 * TEMPORARY - Enum placeholders for edit form / API mapping. Replace with company settings types.
 */
export enum ScheduleNotificationSendMode {
  ALWAYS_SEND = 'ALWAYS_SEND',
  NEVER_SEND = 'NEVER_SEND',
  ASK = 'ASK',
}

/**
 * TEMPORARY - Enum placeholders for edit form / API mapping. Replace with company settings fields.
 */
export enum ScheduleNotificationChannel {
  MOBILE = 'MOBILE',
  EMAIL = 'EMAIL',
}
