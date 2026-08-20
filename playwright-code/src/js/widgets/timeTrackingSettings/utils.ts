import React from 'react';
import { useIntl } from '@payroll/quicksand/dist/IntlProvider/IntlProvider';
import type {
  CustomDimensionSetting,
  MappedQLSettings,
} from 'src/js/service/hooks/settings/useGetQLSettings';
import {
  TimeTracking_NotificationReminderMedium,
  TimeTracking_NotificationSubscription,
  TimeTracking_NotificationType,
  TimeTracking_ScheduleManagePreference,
  TimeTracking_ScheduleShiftChangeNotificationPreference,
  TimeTracking_ScheduleViewPreference,
} from 'src/__generated__/timeTracking/graphql';
import { mappedApprovalSettings } from 'src/js/service/hooks/settings/useGetApprovalSettings';
import { TourStep } from 'src/js/widgets/common/TourFramework/types';
import firstStep from 'src/assets/animations/assignments/custom-field-settings/step-1.json';
import secondStep from 'src/assets/animations/assignments/custom-field-settings/step-2.json';
import thirdStep from 'src/assets/animations/assignments/custom-field-settings/step-3.json';
import { TIME_ENTRY_SETTINGS_CONFIG } from './config';
import {
  APPROVAL_PAY_PERIOD_OPTIONS,
  ApprovalReminderPrefix,
  ApprovalRemindersbasedOn,
  NotificationFieldKey,
  NotificationMedium,
  ReminderRole,
  SCHEDULE_NOTIFICATION_VIEW_PREFIX,
  ScheduleNotificationChannel,
  ScheduleNotificationSendMode,
  TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS,
  MANAGE_KIOSK_LEGACY_WIDGET_ID,
  MANAGE_KIOSK_ORCHESTRATOR_WIDGET_ID,
} from './constants';
import { DAYS_OF_WEEK } from './hooks/useTimeTrackingSettingsForm';
import {
  ITimeSheetFieldOption,
  IDimensionInput,
  DimensionFormDefinition,
  NamedConfigEntry,
  IFormConfig,
  ApprovalSettingsField,
  ReminderFieldNames,
  REMINDER_KEY_MAP,
  ScheduleNotificationChannelsByField,
} from './types';
import {
  SCHEDULE_MANAGE_VALUE,
  SCHEDULE_VIEW_VALUE,
  type ScheduleManagePreference,
  type ScheduleViewPreference,
} from './components/TimeEntrySettings/schedules/constants';

export const convertTo12Hour = (timeString: string): string => {
  if (timeString) {
    const [hourString, minute] = timeString.split(':');
    const hour = +hourString % 24;
    return `${hour % 12 || 12}:${minute} ${hour < 12 ? 'AM' : 'PM'}`;
  }
  return '12:00 AM';
};

export const convertTo24Hour = (timeString: string): string => {
  if (timeString) {
    const [time, modifier] = timeString.split(' ');
    const [hours, minutes] = time.split(':');

    let twentyFourHour: number | string;

    if (hours === '12') {
      twentyFourHour = modifier.toLowerCase() === 'am' ? '00' : hours;
    } else {
      twentyFourHour =
        modifier.toLowerCase() === 'pm' ? parseInt(hours, 10) + 12 : hours;
    }
    // Pad single-digit hours with leading zero
    twentyFourHour = twentyFourHour.toString().padStart(2, '0');
    return `${twentyFourHour}:${minutes}`;
  }
  return '00:00';
};

export const formatTimeTo12Hour = (
  time: string,
  isUKLocale?: boolean,
): string => (isUKLocale ? time : convertTo12Hour(time));

export const formatTimeTo24Hour = (
  time: string,
  isUKLocale?: boolean,
): string => (isUKLocale ? time : convertTo24Hour(time));

type FieldUpdate<T> = {
  version: string;
  value: T;
};

export const uppercaseToPascalcase = (str: string) =>
  str
    .toLowerCase()
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

export const createFieldUpdate = <
  T extends boolean | number | string | string[],
>(
  fieldName: keyof MappedQLSettings,
  updatedFields: string[],
  settings: MappedQLSettings,
  formState: Record<string, any>,
  parseValue?: (value: any) => T,
): FieldUpdate<T> | undefined => {
  if (!settings || updatedFields.indexOf(fieldName as string) === -1) {
    return undefined;
  }

  if (fieldName === 'overtimeNotificationRules') {
    return undefined;
  }

  const raw = settings[fieldName];
  if (
    raw === undefined ||
    Array.isArray(raw) ||
    typeof raw !== 'object' ||
    !('version' in raw)
  ) {
    return undefined;
  }

  const { version } = raw as { version: string };
  const value = formState[fieldName as string];

  if (version === undefined) {
    return undefined;
  }

  return {
    version,
    value: parseValue ? parseValue(value) : (value as T),
  };
};

export const getWeekDay = (dayIndex: number) =>
  Object.keys(DAYS_OF_WEEK).find((key) => DAYS_OF_WEEK[key] === dayIndex);

// Helper function to find config entry by name
export const findConfigByName = (
  name: string,
): NamedConfigEntry | undefined => {
  const entries = Object.values(TIME_ENTRY_SETTINGS_CONFIG);
  const found = entries.find(
    (entry) => 'name' in entry && 'isNew' in entry && entry.name === name,
  );
  return found as NamedConfigEntry | undefined;
};

// Generic function to filter subfields based on requiredIXP and converts required billable/notes from subfields to toggle switches
export const filterSubFieldsByIXP = (
  subFields: ITimeSheetFieldOption[],
  parentFieldKey: string,
  isRequiredIXP: boolean,
): ITimeSheetFieldOption[] => {
  if (!isRequiredIXP) {
    return subFields;
  }

  const fieldsToFilter: Record<string, string[]> = {
    isBillingFieldEnabled: ['requireBillable'],
    timeSheetEntryNotesEnabled: ['timeSheetEntryMakesNotesRequiredEnabled'],
  };
  const fieldsToExclude = fieldsToFilter[parentFieldKey] || [];
  return subFields.filter(
    (subField) => !fieldsToExclude.includes(subField.key),
  );
};

// Function to get the formatted field title
export const getTimeSheetFieldTitle = (
  field: ITimeSheetFieldOption,
  text: Function,
) => {
  const isCustomerField =
    field.key ===
    TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CUSTOMER_FOR_TIMESHEET_ENABLED;
  const standardTitle = text({ id: field.title });

  if (!isCustomerField) return standardTitle;

  const customerParams = {
    customer: field.title,
    subCustomer: field.title.toLowerCase(),
  };
  const titleWithParams = text(
    {
      id: 'time-entries.section.title.time-sheet.customer-and-sub-customer.dynamic',
    },
    customerParams,
  );
  const staticTitle = text({
    id: 'time-entries.section.title.time-sheet.customer-and-sub-customer',
  });

  return titleWithParams !== staticTitle ? titleWithParams : staticTitle;
};

// Helper function to extract version and value from nested approval settings objects
export const mapFieldApprovalSettingsField = <T>(
  field: ApprovalSettingsField<T>,
  defaultValue: T,
): { version: string; value: T } => ({
  version: field?.meta?.version ?? '0',
  value: field?.value ?? defaultValue,
});

export const convertHourNumberTo12Hour = (
  hour: number,
  isUKLocale?: boolean,
): string => {
  if (isUKLocale) {
    // Return 24-hour format for UK locale
    const paddedHour = hour.toString().padStart(2, '0');
    return `${paddedHour}:00`;
  }
  // Return 12-hour format for non-UK locales
  const hour12 = hour % 12 || 12;
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${hour12}:00 ${ampm}`;
};

export const convertHourNumberTo24Hour = (timeString: string): number => {
  // Remove any spaces and make uppercase for easier parsing
  const normalizedTime = timeString.replace(/\s+/g, '').toUpperCase();

  // Extract AM/PM
  const isAM = normalizedTime.includes('AM');
  const isPM = normalizedTime.includes('PM');

  // Remove AM/PM and extract hour
  const timeWithoutModifier = normalizedTime.replace(/AM|PM/g, '');

  // Split by colon if present, otherwise just parse the number
  const parts = timeWithoutModifier.split(':');
  let hour = parseInt(parts[0], 10);

  // Convert to 24-hour format
  if (isPM && hour !== 12) {
    hour += 12;
  } else if (isAM && hour === 12) {
    hour = 0;
  }

  return hour;
};

/**
 * Helper function to get the formatted label for payroll close date offset days
 * @param offsetDays - Number of days after payroll close date (0-5)
 * @param intl - Intl object for formatting messages
 * @returns Formatted label string
 */
export const getPayPeriodLabel = (
  offsetDays: number,
  intl: ReturnType<typeof useIntl>,
): string => {
  const payPeriodOption = APPROVAL_PAY_PERIOD_OPTIONS.find(
    (option: { value: string }) => option.value === String(offsetDays),
  );

  return payPeriodOption
    ? intl.formatMessage({ id: payPeriodOption.labelKey })
    : `${offsetDays} ${intl.formatMessage({
        id: 'time-entries.section.title.approvals.days-after-payroll-close-date',
      })}`;
};

export const formatArrayToTitleCase = (values: string[]): string => {
  if (!values || values.length === 0) {
    return '';
  }

  return values
    .map(
      (value) => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(),
    )
    .join(', ');
};

/**
 * Get the translation key for reminder messages based on role, frequency, and order
 * @param role - The role (MANAGER for approvals or EMPLOYEE for submissions)
 * @param frequency - The reminder frequency mode (DAY_OF_WEEK, PAYROLL_CLOSE_DATE, or DAILY)
 * @param isFirst - Whether this is the first or second reminder
 * @returns Translation key string for the reminder message
 */
export const getReminderMessageKey = (
  role: ReminderRole,
  frequency: ApprovalRemindersbasedOn,
  isFirst: boolean,
): string => {
  const frequencyKeys = REMINDER_KEY_MAP[role]?.[frequency];
  if (!frequencyKeys) {
    return '';
  }
  return isFirst ? frequencyKeys.first : frequencyKeys.second;
};
// Helper function to extract and format reminder data for both manager and employee
export const getReminderData = (
  approvalSettings: mappedApprovalSettings,
  role: ReminderRole,
  prefix: ApprovalReminderPrefix,
  basedOn: string,
  isUKLocale: boolean,
  intl: any,
) => {
  const weekReminderDays =
    approvalSettings[`${role}${prefix}WeekReminderDays`]?.value || [];
  const weekReminderHour = convertHourNumberTo12Hour(
    approvalSettings[`${role}${prefix}WeekReminderHour`]?.value || 0,
    isUKLocale,
  );
  const weekReminderMedium =
    approvalSettings[`${role}${prefix}WeekReminderMedium`]?.value || [];
  const payPeriodReminderHour = convertHourNumberTo12Hour(
    approvalSettings[`${role}${prefix}PayPeriodReminderHour`]?.value || 0,
    isUKLocale,
  );
  const payPeriodReminderOffsetDays =
    approvalSettings[`${role}${prefix}PayPeriodReminderOffsetDays`]?.value || 0;
  const payPeriodReminderMedium =
    approvalSettings[`${role}${prefix}PayPeriodReminderMedium`]?.value || [];

  // Employee-specific: daily reminder fields
  const reminderType =
    prefix === ApprovalReminderPrefix.CURRENT ? 'First' : 'Second';
  const dailyReminderHour =
    role === ReminderRole.EMPLOYEE
      ? convertHourNumberTo12Hour(
          approvalSettings[`employeeDailyReminder${reminderType}ReminderHour`]
            ?.value || 0,
          isUKLocale,
        )
      : undefined;
  const dailyReminderMedium =
    role === ReminderRole.EMPLOYEE
      ? approvalSettings[`employeeDailyReminder${reminderType}ReminderMedium`]
          ?.value || []
      : undefined;

  // Calculate field value based on mode
  let fieldValue = 'Off';
  if (basedOn === ApprovalRemindersbasedOn.DAY_OF_WEEK) {
    fieldValue =
      weekReminderMedium.length > 0 &&
      weekReminderMedium[0] === NotificationMedium.EMAIL
        ? `${formatArrayToTitleCase(
            weekReminderDays,
          )}, ${weekReminderHour}, ${formatArrayToTitleCase(
            weekReminderMedium,
          )}`
        : intl.formatMessage({ id: 'off' });
  } else if (basedOn === ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE) {
    const payPeriodLabel = getPayPeriodLabel(payPeriodReminderOffsetDays, intl);
    fieldValue =
      payPeriodReminderMedium.length > 0 &&
      payPeriodReminderMedium[0] === NotificationMedium.EMAIL
        ? `${payPeriodLabel}, ${payPeriodReminderHour}, ${formatArrayToTitleCase(
            payPeriodReminderMedium,
          )}`
        : intl.formatMessage({ id: 'off' });
  } else if (
    basedOn === ApprovalRemindersbasedOn.DAILY &&
    role === ReminderRole.EMPLOYEE
  ) {
    fieldValue =
      dailyReminderMedium &&
      dailyReminderMedium.length > 0 &&
      dailyReminderMedium[0] === NotificationMedium.EMAIL
        ? `${dailyReminderHour}, ${formatArrayToTitleCase(dailyReminderMedium)}`
        : intl.formatMessage({ id: 'off' });
  }

  // Get field title using the utility function
  const isFirstReminder = prefix === ApprovalReminderPrefix.CURRENT;
  const titleKey = getReminderMessageKey(
    role,
    basedOn as ApprovalRemindersbasedOn,
    isFirstReminder,
  );
  const fieldTitle = titleKey ? intl.formatMessage({ id: titleKey }) : '';

  // Build form values
  const formValues: Record<string, any> = {
    [`${role}${prefix}WeekReminderDays`]: weekReminderDays,
    [`${role}${prefix}WeekReminderHour`]: weekReminderHour,
    [`${role}${prefix}WeekReminderMedium`]: weekReminderMedium,
    [`${role}${prefix}PayPeriodReminderHour`]: payPeriodReminderHour,
    [`${role}${prefix}PayPeriodReminderOffsetDays`]:
      payPeriodReminderOffsetDays,
    [`${role}${prefix}PayPeriodReminderMedium`]: payPeriodReminderMedium,
  };
  // Add employee-specific daily reminder fields
  if (role === ReminderRole.EMPLOYEE) {
    formValues[`employeeDailyReminder${reminderType}ReminderHour`] =
      dailyReminderHour;
    formValues[`employeeDailyReminder${reminderType}ReminderMedium`] =
      dailyReminderMedium;
  }
  return {
    fieldValue,
    fieldTitle,
    formValues,
  };
};

/**
 * Helper function to create a ReminderFieldNames object
 * Ensures consistency and follows DRY principle
 *
 * @param medium - The notification medium field key
 * @param hour - The reminder hour field key
 * @param day - The reminder day/offset field key (optional, defaults to empty string)
 * @returns ReminderFieldNames object
 */
export const createReminderFieldNames = (
  medium: NotificationFieldKey,
  hour: NotificationFieldKey,
  day: NotificationFieldKey | '' = '',
): ReminderFieldNames => ({
  medium: medium as ReminderFieldNames['medium'],
  hour: hour as ReminderFieldNames['hour'],
  day: day as ReminderFieldNames['day'],
});

/**
 * Get reminder field names based on reminder type, frequency, and order
 * This utility function provides type-safe field name resolution for notification reminder settings
 *
 * @param reminderType - 'manager' for approvals or 'employee' for submissions
 * @param frequency - The reminder frequency mode (DAY_OF_WEEK, PAYROLL_CLOSE_DATE, or DAILY)
 * @param isFirst - Whether this is the first or second reminder
 * @returns ReminderFieldNames object with medium, hour, and day field names
 */
export const getReminderFieldNames = (
  reminderType: ReminderRole,
  frequency: ApprovalRemindersbasedOn,
  isFirst: boolean,
): ReminderFieldNames => {
  // Handle DAILY mode (employee only)
  if (frequency === ApprovalRemindersbasedOn.DAILY) {
    return isFirst
      ? createReminderFieldNames(
          NotificationFieldKey.EMPLOYEE_DAILY_REMINDER_FIRST_REMINDER_MEDIUM,
          NotificationFieldKey.EMPLOYEE_DAILY_REMINDER_FIRST_REMINDER_HOUR,
        )
      : createReminderFieldNames(
          NotificationFieldKey.EMPLOYEE_DAILY_REMINDER_SECOND_REMINDER_MEDIUM,
          NotificationFieldKey.EMPLOYEE_DAILY_REMINDER_SECOND_REMINDER_HOUR,
        );
  }

  // Handle PAYROLL_CLOSE_DATE mode
  if (frequency === ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE) {
    if (reminderType === ReminderRole.MANAGER) {
      return isFirst
        ? createReminderFieldNames(
            NotificationFieldKey.MANAGER_CURRENT_PAY_PERIOD_REMINDER_MEDIUM,
            NotificationFieldKey.MANAGER_CURRENT_PAY_PERIOD_REMINDER_HOUR,
            NotificationFieldKey.MANAGER_CURRENT_PAY_PERIOD_REMINDER_OFFSET_DAYS,
          )
        : createReminderFieldNames(
            NotificationFieldKey.MANAGER_PREVIOUS_PAY_PERIOD_REMINDER_MEDIUM,
            NotificationFieldKey.MANAGER_PREVIOUS_PAY_PERIOD_REMINDER_HOUR,
            NotificationFieldKey.MANAGER_PREVIOUS_PAY_PERIOD_REMINDER_OFFSET_DAYS,
          );
    }
    return isFirst
      ? createReminderFieldNames(
          NotificationFieldKey.EMPLOYEE_CURRENT_PAY_PERIOD_REMINDER_MEDIUM,
          NotificationFieldKey.EMPLOYEE_CURRENT_PAY_PERIOD_REMINDER_HOUR,
          NotificationFieldKey.EMPLOYEE_CURRENT_PAY_PERIOD_REMINDER_OFFSET_DAYS,
        )
      : createReminderFieldNames(
          NotificationFieldKey.EMPLOYEE_PREVIOUS_PAY_PERIOD_REMINDER_MEDIUM,
          NotificationFieldKey.EMPLOYEE_PREVIOUS_PAY_PERIOD_REMINDER_HOUR,
          NotificationFieldKey.EMPLOYEE_PREVIOUS_PAY_PERIOD_REMINDER_OFFSET_DAYS,
        );
  }

  // Handle DAY_OF_WEEK mode (default)
  if (reminderType === ReminderRole.MANAGER) {
    return isFirst
      ? createReminderFieldNames(
          NotificationFieldKey.MANAGER_CURRENT_WEEK_REMINDER_MEDIUM,
          NotificationFieldKey.MANAGER_CURRENT_WEEK_REMINDER_HOUR,
          NotificationFieldKey.MANAGER_CURRENT_WEEK_REMINDER_DAYS,
        )
      : createReminderFieldNames(
          NotificationFieldKey.MANAGER_PREVIOUS_WEEK_REMINDER_MEDIUM,
          NotificationFieldKey.MANAGER_PREVIOUS_WEEK_REMINDER_HOUR,
          NotificationFieldKey.MANAGER_PREVIOUS_WEEK_REMINDER_DAYS,
        );
  }
  return isFirst
    ? createReminderFieldNames(
        NotificationFieldKey.EMPLOYEE_CURRENT_WEEK_REMINDER_MEDIUM,
        NotificationFieldKey.EMPLOYEE_CURRENT_WEEK_REMINDER_HOUR,
        NotificationFieldKey.EMPLOYEE_CURRENT_WEEK_REMINDER_DAYS,
      )
    : createReminderFieldNames(
        NotificationFieldKey.EMPLOYEE_PREVIOUS_WEEK_REMINDER_MEDIUM,
        NotificationFieldKey.EMPLOYEE_PREVIOUS_WEEK_REMINDER_HOUR,
        NotificationFieldKey.EMPLOYEE_PREVIOUS_WEEK_REMINDER_DAYS,
      );
};

/**
 * Checks if a notification medium is enabled in the value array
 * @param value - The current value (could be an array of notification mediums)
 * @param medium - The notification medium to check (defaults to EMAIL)
 * @returns true if the medium is enabled, false otherwise
 */
export const isNotificationMediumEnabled = (
  value: string[] | unknown,
  medium: NotificationMedium = NotificationMedium.EMAIL,
): boolean => Array.isArray(value) && value.length > 0 && value[0] === medium;

/**
 * Toggles a notification medium in the value array
 * @param value - The current value (could be an array of notification mediums)
 * @param medium - The notification medium to toggle (defaults to EMAIL)
 * @returns An array with the medium if it was off, or an empty array if it was on
 */
export const toggleNotificationMedium = (
  value: string[] | unknown,
  medium: NotificationMedium = NotificationMedium.EMAIL,
): string[] => (isNotificationMediumEnabled(value, medium) ? [] : [medium]);

/**
 * Field Assignment tour steps for Standard Field Assignment Detail View
 * Shows users how to navigate the standard field options assignment table
 *
 * @param standardFieldColumnRef - Ref to the status column header
 * @param customersColumnRef - Ref to the customers column header
 * @param firstRowActionRef - Ref to the view/action button in the first row
 * @param intl - Intl object for formatting messages
 * @returns Array of tour steps
 */
export const FieldAssignmentTourSteps = (
  standardFieldColumnRef: React.RefObject<HTMLElement>,
  customersColumnRef: React.RefObject<HTMLElement>,
  firstRowActionRef: React.RefObject<HTMLElement>,
  intl: ReturnType<typeof useIntl>,
): TourStep[] => [
  {
    id: 'step-1',
    title: intl.formatMessage({ id: 'fieldAssignment.tour.step.1.title' }),
    description: intl.formatMessage({
      id: 'fieldAssignment.tour.step.1.description',
    }),
    showOverlay: false,
    position: 'left',
    alignment: 'center',
    targetRef: standardFieldColumnRef,
    nextLabel: intl.formatMessage({
      id: 'fieldAssignment.tour.step.1.nextLabel',
    }),
    lottieData: firstStep,
  },
  {
    id: 'step-2',
    title: intl.formatMessage({ id: 'fieldAssignment.tour.step.2.title' }),
    description: intl.formatMessage({
      id: 'fieldAssignment.tour.step.2.description',
    }),
    showOverlay: false,
    position: 'right',
    alignment: 'center',
    targetRef: customersColumnRef,
    nextLabel: intl.formatMessage({
      id: 'fieldAssignment.tour.step.2.nextLabel',
    }),
    lottieData: secondStep,
  },
  {
    id: 'step-3',
    title: intl.formatMessage({ id: 'fieldAssignment.tour.step.3.title' }),
    description: intl.formatMessage({
      id: 'fieldAssignment.tour.step.3.description',
    }),
    showOverlay: false,
    position: 'left',
    alignment: 'center',
    targetRef: firstRowActionRef,
    nextLabel: intl.formatMessage({
      id: 'fieldAssignment.tour.step.3.nextLabel',
    }),
    lottieData: thirdStep,
  },
];

export type ScheduleNotificationsIntl = ReturnType<typeof useIntl>;

/** Schedule notification summary line: mode + optional channels (same NLS pattern as clock-in reminders). */
export const formatScheduleNotificationSummaryValue = (
  intl: ScheduleNotificationsIntl,
  mode: ScheduleNotificationSendMode,
  includeMobile: boolean,
  includeEmail: boolean,
): string => {
  if (mode === ScheduleNotificationSendMode.NEVER_SEND) {
    return intl.formatMessage({
      id: `${SCHEDULE_NOTIFICATION_VIEW_PREFIX}.never-send`,
    });
  }
  const modeLabel =
    mode === ScheduleNotificationSendMode.ALWAYS_SEND
      ? intl.formatMessage({
          id: `${SCHEDULE_NOTIFICATION_VIEW_PREFIX}.always-send`,
        })
      : intl.formatMessage({
          id: `${SCHEDULE_NOTIFICATION_VIEW_PREFIX}.ask`,
        });
  return `${modeLabel}${
    includeMobile ? `, ${intl.formatMessage({ id: 'notificationMobile' })}` : ''
  }${
    includeEmail ? `, ${intl.formatMessage({ id: 'notificationEmail' })}` : ''
  }`;
};

/**
 * On + enabled channels, or Off. A schedule subscription can have both EMAIL and
 * PUSH_NOTIFICATION active, so this renders "On, Mobile, Email" / "On, Email" /
 * "On, Mobile" / "Off" (mobile-first, matching the summary formatter ordering).
 */
export const formatScheduleNotificationChannelsValue = (
  intl: ScheduleNotificationsIntl,
  hasMobile: boolean,
  hasEmail: boolean,
): string => {
  if (!hasEmail && !hasMobile) {
    return intl.formatMessage({ id: 'off' });
  }
  return `${intl.formatMessage({ id: 'on' })}${
    hasMobile ? `, ${intl.formatMessage({ id: 'notificationMobile' })}` : ''
  }${hasEmail ? `, ${intl.formatMessage({ id: 'notificationEmail' })}` : ''}`;
};

/** On + channel or Off (same NLS pattern as clock-in reminder rows). */
export const formatScheduleNotificationOnOffChannelValue = (
  intl: ScheduleNotificationsIntl,
  isOn: boolean,
  channel: ScheduleNotificationChannel | null,
): string => {
  if (!isOn || channel == null) {
    return intl.formatMessage({ id: 'off' });
  }
  const channelLabel =
    channel === ScheduleNotificationChannel.EMAIL
      ? intl.formatMessage({ id: 'notificationEmail' })
      : intl.formatMessage({ id: 'notificationMobile' });
  return `${intl.formatMessage({ id: 'on' })}, ${channelLabel}`;
};

/**
 * Maps the company-settings `publishShiftChangePreference` enum (ALWAYS/ASK/NEVER)
 * to the view-layer send mode used by `formatScheduleNotificationSummaryValue`.
 * Returns `null` when the API value is missing/unknown so the row renders empty.
 */
export function mapShiftChangePreferenceToSendMode(
  value?:
    | TimeTracking_ScheduleShiftChangeNotificationPreference
    | string
    | null,
): ScheduleNotificationSendMode | null {
  switch (value) {
    case TimeTracking_ScheduleShiftChangeNotificationPreference.Always:
      return ScheduleNotificationSendMode.ALWAYS_SEND;
    case TimeTracking_ScheduleShiftChangeNotificationPreference.Ask:
      return ScheduleNotificationSendMode.ASK;
    case TimeTracking_ScheduleShiftChangeNotificationPreference.Never:
      return ScheduleNotificationSendMode.NEVER_SEND;
    default:
      return null;
  }
}

/**
 * Maps the edit-form send mode to the API enum for update mutation.
 */
export function mapSendModeToShiftChangePreference(
  mode: ScheduleNotificationSendMode,
): TimeTracking_ScheduleShiftChangeNotificationPreference {
  switch (mode) {
    case ScheduleNotificationSendMode.ALWAYS_SEND:
      return TimeTracking_ScheduleShiftChangeNotificationPreference.Always;
    case ScheduleNotificationSendMode.ASK:
      return TimeTracking_ScheduleShiftChangeNotificationPreference.Ask;
    case ScheduleNotificationSendMode.NEVER_SEND:
      return TimeTracking_ScheduleShiftChangeNotificationPreference.Never;
    // Default as fallback - defensive approach
    default:
      return TimeTracking_ScheduleShiftChangeNotificationPreference.Always;
  }
}

/** Maps each schedule row's RHF field name to the API notificationType it persists as. */
export const SCHEDULE_NOTIFICATION_FIELD_TO_TYPE: Record<
  string,
  TimeTracking_NotificationType
> = {
  [NotificationFieldKey.SCHEDULE_SHIFT_PUBLISHED_CHANNELS]:
    TimeTracking_NotificationType.ShiftPublished,
  [NotificationFieldKey.SCHEDULE_ONE_HOUR_CHANNELS]:
    TimeTracking_NotificationType.ShiftStartBefore,
  [NotificationFieldKey.SCHEDULE_FORGOT_CLOCK_IN_AFTER_STARTED_CHANNELS]:
    TimeTracking_NotificationType.ShiftStartAfter,
  [NotificationFieldKey.SCHEDULE_FORGOT_CLOCK_IN_AFTER_ENDED_CHANNELS]:
    TimeTracking_NotificationType.ShiftEndAfter,
  [NotificationFieldKey.SCHEDULE_LATE_CLOCK_IN_NOTIFY_MANAGER_CHANNELS]:
    TimeTracking_NotificationType.ShiftStartAfterManager,
};

/**
 * Maps the company-settings schedule-notification `subscriptions` array into the
 * per-row channel arrays used as RHF field values. Each row keys off a
 * `notificationType` (see SCHEDULE_NOTIFICATION_FIELD_TO_TYPE); the value is the
 * subscription's `distributionMethods` (EMAIL / PUSH_NOTIFICATION). A missing
 * subscription yields an empty array (no channels active).
 */
export function mapSubscriptionsToScheduleChannels(
  subscriptions?: TimeTracking_NotificationSubscription[] | null,
): ScheduleNotificationChannelsByField {
  const byType = new Map<
    TimeTracking_NotificationType,
    TimeTracking_NotificationReminderMedium[]
  >(
    (subscriptions ?? []).map((s) => [
      s.notificationType,
      s.distributionMethods,
    ]),
  );

  const channelsForField = (
    field: string,
  ): TimeTracking_NotificationReminderMedium[] => [
    ...(byType.get(SCHEDULE_NOTIFICATION_FIELD_TO_TYPE[field]) ?? []),
  ];

  return {
    scheduleShiftPublished: channelsForField(
      NotificationFieldKey.SCHEDULE_SHIFT_PUBLISHED_CHANNELS,
    ),
    scheduleOneHour: channelsForField(
      NotificationFieldKey.SCHEDULE_ONE_HOUR_CHANNELS,
    ),
    scheduleForgotClockInAfterStarted: channelsForField(
      NotificationFieldKey.SCHEDULE_FORGOT_CLOCK_IN_AFTER_STARTED_CHANNELS,
    ),
    scheduleForgotClockInAfterEnded: channelsForField(
      NotificationFieldKey.SCHEDULE_FORGOT_CLOCK_IN_AFTER_ENDED_CHANNELS,
    ),
    scheduleLateClockInNotifyManagerChannels: channelsForField(
      NotificationFieldKey.SCHEDULE_LATE_CLOCK_IN_NOTIFY_MANAGER_CHANNELS,
    ),
  };
}

/** True when the channel array includes EMAIL. */
export const hasEmailChannel = (
  channels: TimeTracking_NotificationReminderMedium[],
): boolean => channels.includes(TimeTracking_NotificationReminderMedium.Email);

/** True when the channel array includes PUSH_NOTIFICATION (mobile). */
export const hasMobileChannel = (
  channels: TimeTracking_NotificationReminderMedium[],
): boolean =>
  channels.includes(TimeTracking_NotificationReminderMedium.PushNotification);

/** Toggles a single medium in/out of a channel array (immutably). */
export const toggleScheduleChannel = (
  channels: TimeTracking_NotificationReminderMedium[],
  medium: TimeTracking_NotificationReminderMedium,
): TimeTracking_NotificationReminderMedium[] =>
  channels.includes(medium)
    ? channels.filter((c) => c !== medium)
    : [...channels, medium];

/**
 * Renders a schedule row's view value ("On, Mobile, Email" / "Off") from the
 * channels object produced by `mapSubscriptionsToScheduleChannels`, keyed by the
 * row's channel field. Single source of truth for the view-load and post-save
 * repaint paths (avoids the per-row hasEmail/hasMobile/format copy-paste).
 */
export const formatChannelsFor = (
  intl: ScheduleNotificationsIntl,
  channels: ScheduleNotificationChannelsByField,
  field: keyof ScheduleNotificationChannelsByField,
): string =>
  formatScheduleNotificationChannelsValue(
    intl,
    hasMobileChannel(channels[field]),
    hasEmailChannel(channels[field]),
  );

export function mapScheduleManagePreferenceFromApi(
  value?: TimeTracking_ScheduleManagePreference | null,
): ScheduleManagePreference {
  switch (value) {
    case TimeTracking_ScheduleManagePreference.None:
      return SCHEDULE_MANAGE_VALUE.NONE;
    case TimeTracking_ScheduleManagePreference.Self:
      return SCHEDULE_MANAGE_VALUE.THEIR_OWN;
    case TimeTracking_ScheduleManagePreference.Group:
      return SCHEDULE_MANAGE_VALUE.GROUP;
    case TimeTracking_ScheduleManagePreference.Company:
      return SCHEDULE_MANAGE_VALUE.COMPANY;
    default:
      return SCHEDULE_MANAGE_VALUE.THEIR_OWN;
  }
}

export function mapScheduleViewPreferenceFromApi(
  value?: TimeTracking_ScheduleViewPreference | null,
): ScheduleViewPreference {
  switch (value) {
    case TimeTracking_ScheduleViewPreference.Self:
      return SCHEDULE_VIEW_VALUE.THEIR_OWN;
    case TimeTracking_ScheduleViewPreference.Group:
      return SCHEDULE_VIEW_VALUE.GROUP;
    case TimeTracking_ScheduleViewPreference.Company:
      return SCHEDULE_VIEW_VALUE.COMPANY;
    default:
      return SCHEDULE_VIEW_VALUE.THEIR_OWN;
  }
}

export function mapScheduleManagePreferenceToApi(
  preference: ScheduleManagePreference,
): TimeTracking_ScheduleManagePreference {
  switch (preference) {
    case SCHEDULE_MANAGE_VALUE.NONE:
      return TimeTracking_ScheduleManagePreference.None;
    case SCHEDULE_MANAGE_VALUE.THEIR_OWN:
      return TimeTracking_ScheduleManagePreference.Self;
    case SCHEDULE_MANAGE_VALUE.GROUP:
      return TimeTracking_ScheduleManagePreference.Group;
    case SCHEDULE_MANAGE_VALUE.COMPANY:
      return TimeTracking_ScheduleManagePreference.Company;
    default:
      return TimeTracking_ScheduleManagePreference.Self;
  }
}

export function mapScheduleViewPreferenceToApi(
  preference: ScheduleViewPreference,
): TimeTracking_ScheduleViewPreference {
  switch (preference) {
    case SCHEDULE_VIEW_VALUE.THEIR_OWN:
      return TimeTracking_ScheduleViewPreference.Self;
    case SCHEDULE_VIEW_VALUE.GROUP:
      return TimeTracking_ScheduleViewPreference.Group;
    case SCHEDULE_VIEW_VALUE.COMPANY:
      return TimeTracking_ScheduleViewPreference.Company;
    default:
      return TimeTracking_ScheduleViewPreference.Self;
  }
}

/** Minimal shape from `useGetQLSettings.customDimensions`. */
export interface DimensionQLSettingSource {
  dimensionDefinitionId: string;
  enabledForTimeTracking?: { value?: boolean };
  required?: { value?: boolean };
}

/** Active dimension row with time-tracking toggles merged from QL settings. */
export interface MergedDimensionForSettings {
  id: string;
  label: string;
  active: boolean;
  enabledForTimeTracking: boolean;
  required: boolean;
}

/**
 * Builds the Dimensions settings list from two sources:
 *   • definitions (`dimensionDefinitions` form field) — id, label, active
 *   • QL settings (`customDimensions` form field) — enabledForTimeTracking, required
 *
 * Only active definitions are returned. When QL has no row for a dimension id,
 * both toggles default to `false`.
 */
export const mergeActiveDimensionsWithQLSettings = (
  dimensions: DimensionFormDefinition[] = [],
  qlSettings: DimensionQLSettingSource[] = [],
): MergedDimensionForSettings[] => {
  const settingsById = new Map(
    qlSettings.map((setting) => [setting.dimensionDefinitionId, setting]),
  );

  return dimensions
    .filter((dimension) => dimension.active === true)
    .map((dimension) => {
      const qlSetting = settingsById.get(dimension.id);
      return {
        id: dimension.id,
        label: dimension.label,
        active: dimension.active,
        enabledForTimeTracking:
          qlSetting?.enabledForTimeTracking?.value ?? false,
        required: qlSetting?.required?.value ?? false,
      };
    });
};

export const createTimesheetDimensionPreviewField = ({
  id,
  label,
  enabled = false,
  required = false,
  mobileSubtitleId = 'time-entries.section.dimensions.mobile-subtitle',
}: IDimensionInput): ITimeSheetFieldOption => ({
  id,
  key: `dimensions.${id}.enabled`,
  title: label,
  ariaLabel: id,
  tooltipText: '',
  disabled: false,
  value: enabled,
  detail: {
    title: label,
    subtitle: mobileSubtitleId,
    ariaLabel: '',
  },
  automationId: `dimension-${id}`,
  requiredField: {
    id: `${id}Required`,
    key: `dimensions.${id}.required`,
    disabled: false,
    value: required,
  },
});

export const mapEmployerDimensionSettingsToPreviewFields = (
  customDimensionSettings: CustomDimensionSetting[] = [],
): ITimeSheetFieldOption[] =>
  customDimensionSettings.map((setting) =>
    createTimesheetDimensionPreviewField({
      id: setting.dimensionDefinitionId,
      label: setting.dimensionDefinitionId,
      enabled: setting.enabledForTimeTracking?.value ?? false,
      required: setting.required?.value ?? false,
    }),
  );

export const mapDimensionDefinitionsToPreviewFields = (
  dimensions: DimensionFormDefinition[] = [],
  customDimensionSettings: CustomDimensionSetting[] = [],
): ITimeSheetFieldOption[] =>
  mergeActiveDimensionsWithQLSettings(dimensions, customDimensionSettings).map(
    (mergedDimension) =>
      createTimesheetDimensionPreviewField({
        id: mergedDimension.id,
        label: mergedDimension.label,
        enabled: mergedDimension.enabledForTimeTracking,
        required: mergedDimension.required,
      }),
  );

export const mapDimensionPreviewFieldsToFormValues = (
  previewFields: ITimeSheetFieldOption[],
): Record<string, { enabled: boolean; required: boolean }> =>
  previewFields.reduce((acc, previewField) => {
    acc[previewField.id] = {
      enabled: !!previewField.value,
      required: !!previewField.requiredField?.value,
    };
    return acc;
  }, {} as Record<string, { enabled: boolean; required: boolean }>);

export const mapCustomDimensionsWireToSettings = (
  dimensions:
    | Array<{
        dimensionDefinition?: { id?: string } | null;
        enabledForTimeTracking?: {
          meta?: { version?: string };
          value?: boolean;
        } | null;
        required?: {
          meta?: { version?: string };
          value?: boolean;
        } | null;
      } | null>
    | null
    | undefined,
): CustomDimensionSetting[] =>
  (dimensions ?? [])
    .filter(
      (dimension): dimension is NonNullable<typeof dimension> =>
        dimension != null && !!dimension.dimensionDefinition?.id,
    )
    .map((dimension) => ({
      dimensionDefinitionId: dimension.dimensionDefinition!.id!,
      enabledForTimeTracking: {
        version: dimension.enabledForTimeTracking?.meta?.version ?? '0',
        value: dimension.enabledForTimeTracking?.value ?? false,
      },
      required: {
        version: dimension.required?.meta?.version ?? '0',
        value: dimension.required?.value ?? false,
      },
    }));

/** Orchestrator widget when kiosk IXP is on; otherwise legacy qbtime-setup-ui widget. */
// TODO: check if the kiosk add on is also installed, the data will come via QL employer settings API
export const getManageKioskWidgetId = (
  isTimeKioskSettingsEnabled: boolean,
): string =>
  isTimeKioskSettingsEnabled
    ? MANAGE_KIOSK_ORCHESTRATOR_WIDGET_ID
    : MANAGE_KIOSK_LEGACY_WIDGET_ID;
