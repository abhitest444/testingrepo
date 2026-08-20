import { useForm } from 'react-hook-form';
import { SetQLSettingsArgs } from 'src/js/service/hooks/settings/useSetQLSettings';
import {
  mapDaysOfWeekValueToNumber,
  MappedQLSettings,
  TimeEntryBooleanField,
  TimeEntryNumberField,
} from 'src/js/service/hooks/settings/useGetQLSettings';
import {
  Common_DayOfWeek,
  TimeTracking_LocationTrackingType,
  TimeTracking_NotificationSubscription,
  TimeTracking_NotificationType,
  TimeTracking_OvertimeNotificationRule,
} from 'src/__generated__/timeTracking/graphql';
import {
  convertHourNumberTo12Hour,
  formatTimeTo12Hour,
  mapCustomDimensionsWireToSettings,
  mapDimensionDefinitionsToPreviewFields,
  mapDimensionPreviewFieldsToFormValues,
  mapShiftChangePreferenceToSendMode,
  mapSubscriptionsToScheduleChannels,
} from 'src/js/widgets/timeTrackingSettings/utils';
import {
  TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS,
  TIME_TRACKING_SETTINGS,
  NotificationField,
  NotificationFieldKey,
  APPROVAL_FIELD_KEYS,
} from 'src/js/widgets/timeTrackingSettings/constants';
import {
  combinedApprovalSettings,
  ITimeEntrySettingsFormState,
  ScheduleNotificationChannelsByField,
} from 'src/js/widgets/timeTrackingSettings/types';
import { WEEK_DAYS } from 'src/js/common/constants';
import { DIMENSIONS_FORM_NAME } from 'src/js/widgets/common/dimensions/types';
import {
  createClockRoundingSettings,
  createDateTimeSettings,
  createGeofenceReminderSettings,
  createMutationPayload,
  createNotificationSettings,
  createObjectIfHasValues,
  createTimesheetManagementSettings,
} from './mutationHelper';

export const useTimeEntrySettings = () =>
  useForm<ITimeEntrySettingsFormState>({
    mode: 'onSubmit',
  });

export const comparingTimeEntrySettingsToPreviousTimeEntrySettings =
  (formDirtyFields: { [key: string]: boolean | boolean[] }) => {
    const differentFields: string[] = [];

    Object.keys(formDirtyFields).forEach((key) => {
      switch (key) {
        case NotificationField.CLOCK_IN_EMAIL:
          differentFields.push(
            NotificationField.CLOCK_IN_EMAIL,
            NotificationField.CLOCK_IN_TIME,
            NotificationField.CLOCK_IN_MOBILE,
          );
          break;
        case NotificationField.CLOCK_IN_MOBILE:
          differentFields.push(
            NotificationField.CLOCK_IN_MOBILE,
            NotificationField.CLOCK_IN_EMAIL,
            NotificationField.CLOCK_IN_TIME,
          );
          break;
        case NotificationField.CLOCK_IN_TIME:
          differentFields.push(
            NotificationField.CLOCK_IN_TIME,
            NotificationField.CLOCK_IN_EMAIL,
            NotificationField.CLOCK_IN_MOBILE,
          );
          break;
        case NotificationField.CLOCK_OUT_EMAIL:
          differentFields.push(
            NotificationField.CLOCK_OUT_EMAIL,
            NotificationField.CLOCK_OUT_TIME,
            NotificationField.CLOCK_OUT_MOBILE,
          );
          break;
        case NotificationField.CLOCK_OUT_TIME:
          differentFields.push(
            NotificationField.CLOCK_OUT_TIME,
            NotificationField.CLOCK_OUT_EMAIL,
            NotificationField.CLOCK_OUT_MOBILE,
          );
          break;
        case NotificationField.CLOCK_OUT_MOBILE:
          differentFields.push(
            NotificationField.CLOCK_OUT_MOBILE,
            NotificationField.CLOCK_OUT_EMAIL,
            NotificationField.CLOCK_OUT_TIME,
          );
          break;
        case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED:
        case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_BILLABLE:
          differentFields.push(
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_BILLABLE,
          );
          break;
        case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_SERVICE_ENABLE:
        case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_SERVICE_ITEM:
          differentFields.push(
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_SERVICE_ENABLE,
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_SERVICE_ITEM,
          );
          break;
        case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES:
        case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_CLASS:
          differentFields.push(
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_CLASS,
          );
          break;
        case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.LOCATION_FOR_TIMESHEET_ENABLED:
        case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_LOCATION:
          differentFields.push(
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.LOCATION_FOR_TIMESHEET_ENABLED,
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_LOCATION,
          );
          break;
        case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_NOTES_ENABLE:
        case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_ENTRY_MAKES_NOTES_REQUIRES_ENABLES:
          differentFields.push(
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_NOTES_ENABLE,
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_ENTRY_MAKES_NOTES_REQUIRES_ENABLES,
          );
          break;
        case DIMENSIONS_FORM_NAME:
          differentFields.push(DIMENSIONS_FORM_NAME);
          break;
        default:
          differentFields.push(key);
          break;
      }
    });
    return differentFields;
  };

export const createTimeTrackingSettings = (
  formState: ITimeEntrySettingsFormState,
  settings: MappedQLSettings,
  updatedFields: string[],
): {
  timeTrackingBillingEnabled?: { version: string; value: boolean };
  timeTrackingUseItemForTimeEnabled?: { version: string; value: boolean };
  timeTrackingBillingRateForTimeEnabled?: { version: string; value: boolean };
  timeTrackingStartWorkWeek?: { version: string; value: number };
} => ({
  timeTrackingBillingEnabled: createMutationPayload<boolean>(
    updatedFields.includes(
      TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
    ),
    settings.isBillingFieldEnabled.version,
    formState.isBillingFieldEnabled,
  ),
  timeTrackingUseItemForTimeEnabled: createMutationPayload<boolean>(
    updatedFields.includes(
      TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_SERVICE_ENABLE,
    ),
    settings.useItemForTime.version,
    formState.isServiceFieldEnabled,
  ),
  timeTrackingBillingRateForTimeEnabled: createMutationPayload<boolean>(
    updatedFields.includes(
      TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.BILLING_RATE_FOR_TIME_ENABLED,
    ),
    settings.billingRateForTimeEnabled.version,
    formState.billingRateForTimeEnabled,
  ),
  timeTrackingStartWorkWeek: createMutationPayload<number>(
    updatedFields.includes(TIME_TRACKING_SETTINGS.FIRST_DAY_OF_WEEK),
    settings.firstDayOfWeek.version,
    parseInt(formState.firstDayOfWeek, 10),
  ),
});

export const mappedTimeEntrySettingsForMutation = (
  formState: ITimeEntrySettingsFormState,
  settings: MappedQLSettings,
  updatedFields: string[],
  isUKLocale?: boolean,
): SetQLSettingsArgs => ({
  ...createTimeTrackingSettings(formState, settings, updatedFields),
  coreSettings: createObjectIfHasValues({
    requireBillable: createMutationPayload(
      updatedFields.includes('requireBillable'),
      settings.requireBillable?.version,
      formState.requireBillable,
    ),
    classRequired: createMutationPayload(
      updatedFields.includes('classRequired'),
      settings.classRequired?.version,
      formState.classRequired,
    ),
    locationRequired: createMutationPayload(
      updatedFields.includes('locationRequired'),
      settings.locationRequired?.version,
      formState.locationRequired,
    ),
    serviceItemRequired: createMutationPayload(
      updatedFields.includes('serviceItemRequired'),
      settings.serviceItemRequired?.version,
      formState.serviceItemRequired,
    ),
  }),
  dateTimeSettings: createDateTimeSettings(formState, settings, updatedFields),
  timesheetManagementSettings: createTimesheetManagementSettings(
    formState,
    settings,
    updatedFields,
  ),
  clockRoundingSettings: createClockRoundingSettings(
    formState,
    settings,
    updatedFields,
  ),
  notificationSettings: createNotificationSettings(
    formState,
    settings,
    updatedFields,
    isUKLocale,
  ),
  geofenceSettings: createObjectIfHasValues({
    geofenceReminderSettings: createGeofenceReminderSettings(
      formState,
      settings,
      updatedFields,
      isUKLocale,
    ),
  }),
});

export const removeTimeEntryDirtyFieldsUtils = (
  timeEntrySettingsFormMethod: any,
  updatedFormValue?: combinedApprovalSettings,
  isUKLocale?: boolean,
) => {
  if (!updatedFormValue) return;

  const dirtyFields = {
    ...timeEntrySettingsFormMethod.formState.dirtyFields,
  };

  if (dirtyFields.dimensions && updatedFormValue.customDimensions) {
    const dimensionDefinitions =
      timeEntrySettingsFormMethod.getValues('dimensionDefinitions') ?? [];
    const previewFields = mapDimensionDefinitionsToPreviewFields(
      dimensionDefinitions,
      updatedFormValue.customDimensions,
    );

    timeEntrySettingsFormMethod.setValue(
      DIMENSIONS_FORM_NAME,
      mapDimensionPreviewFieldsToFormValues(previewFields),
      { shouldDirty: false },
    );
    timeEntrySettingsFormMethod.setValue(
      'customDimensions',
      updatedFormValue.customDimensions,
      { shouldDirty: false },
    );
    // Also clear the key from the live formState. `setValue` with
    // shouldDirty:false does not un-dirty an already-dirty field, and the
    // loop below skips `dimensions` (removed from the local copy), so without
    // this the form stays dirty and the close-confirmation modal keeps firing.
    delete timeEntrySettingsFormMethod.formState.dirtyFields.dimensions;
    delete dirtyFields.dimensions;
  }

  const getFieldValue = (
    field: string,
  ): string | boolean | number | string[] => {
    switch (field) {
      case TIME_TRACKING_SETTINGS.FIRST_DAY_OF_WEEK:
        return JSON.stringify(updatedFormValue.firstDayOfWeek.value);

      case NotificationField.CLOCK_IN_TIME: {
        const time =
          updatedFormValue.clockInNotificationReminderTime?.value || '8:00';

        return formatTimeOrDefault(time, isUKLocale);
      }

      case NotificationField.CLOCK_OUT_TIME: {
        const time =
          updatedFormValue.clockOutNotificationReminderTime?.value || '17:00';

        return formatTimeOrDefault(time, isUKLocale);
      }

      case NotificationFieldKey.NOTIFY_WHEN_CLOCK_IN_OUT_UPDATED: {
        const adminEnabled =
          updatedFormValue.notifyAdminOnClockOutOverrideEnabled?.value;
        const managerEnabled =
          updatedFormValue.notifyManagerOnClockOutOverrideEnabled?.value;

        if (adminEnabled && managerEnabled) return 'adminsAndManagers';
        if (adminEnabled) return 'adminsOnly';
        if (managerEnabled) return 'managersOnly';
        return 'none';
      }

      case NotificationFieldKey.NOTIFY_WHEN_NOTES_ARE_ADDED_OR_EDITED: {
        const adminEnabled =
          updatedFormValue.notifyAdminOnTimeSheetNotesEditEnabled?.value;
        const managerEnabled =
          updatedFormValue.notifyGroupManagerOnTimeSheetNotesEditEnabled?.value;

        if (adminEnabled && managerEnabled) return 'adminsAndManagers';
        if (adminEnabled) return 'adminsOnly';
        if (managerEnabled) return 'managersOnly';
        return 'none';
      }

      case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_SERVICE_ENABLE:
        return updatedFormValue.useItemForTime?.value ?? false;

      case NotificationFieldKey.MANAGER_CURRENT_WEEK_REMINDER_HOUR:
        return convertHourNumberTo12Hour(
          updatedFormValue.managerCurrentWeekReminderHour?.value ?? 0,
          isUKLocale,
        );
      case NotificationFieldKey.MANAGER_PREVIOUS_WEEK_REMINDER_HOUR:
        return convertHourNumberTo12Hour(
          updatedFormValue.managerPreviousWeekReminderHour?.value ?? 0,
          isUKLocale,
        );
      case NotificationFieldKey.MANAGER_CURRENT_PAY_PERIOD_REMINDER_HOUR:
        return convertHourNumberTo12Hour(
          updatedFormValue.managerCurrentPayPeriodReminderHour?.value ?? 0,
          isUKLocale,
        );
      case NotificationFieldKey.MANAGER_PREVIOUS_PAY_PERIOD_REMINDER_HOUR:
        return convertHourNumberTo12Hour(
          updatedFormValue.managerPreviousPayPeriodReminderHour?.value ?? 0,
          isUKLocale,
        );
      case NotificationFieldKey.EMPLOYEE_CURRENT_WEEK_REMINDER_HOUR:
        return convertHourNumberTo12Hour(
          updatedFormValue.employeeCurrentWeekReminderHour?.value ?? 0,
          isUKLocale,
        );
      case NotificationFieldKey.EMPLOYEE_PREVIOUS_WEEK_REMINDER_HOUR:
        return convertHourNumberTo12Hour(
          updatedFormValue.employeePreviousWeekReminderHour?.value ?? 0,
          isUKLocale,
        );
      case NotificationFieldKey.EMPLOYEE_CURRENT_PAY_PERIOD_REMINDER_HOUR:
        return convertHourNumberTo12Hour(
          updatedFormValue.employeeCurrentPayPeriodReminderHour?.value ?? 0,
          isUKLocale,
        );
      case NotificationFieldKey.EMPLOYEE_PREVIOUS_PAY_PERIOD_REMINDER_HOUR:
        return convertHourNumberTo12Hour(
          updatedFormValue.employeePreviousPayPeriodReminderHour?.value ?? 0,
          isUKLocale,
        );
      case NotificationFieldKey.EMPLOYEE_DAILY_REMINDER_FIRST_REMINDER_HOUR:
        return convertHourNumberTo12Hour(
          updatedFormValue.employeeDailyReminderFirstReminderHour?.value ?? 0,
          isUKLocale,
        );
      case NotificationFieldKey.EMPLOYEE_DAILY_REMINDER_SECOND_REMINDER_HOUR:
        return convertHourNumberTo12Hour(
          updatedFormValue.employeeDailyReminderSecondReminderHour?.value ?? 0,
          isUKLocale,
        );
      case APPROVAL_FIELD_KEYS.CUSTOM_MESSAGE:
        return updatedFormValue.customMessage?.value || '';

      case NotificationFieldKey.GEOFENCE_REMINDER_START_TIME:
        return formatTimeOrDefault(
          updatedFormValue.geofenceReminderStartTime?.value,
          isUKLocale,
        );
      case NotificationFieldKey.GEOFENCE_REMINDER_END_TIME:
        return formatTimeOrDefault(
          updatedFormValue.geofenceReminderEndTime?.value,
          isUKLocale,
        );

      case NotificationFieldKey.GEOFENCE_REMINDER_DAYS_OF_WEEK:
        return updatedFormValue.geofenceReminderDaysOfWeek?.value || [];

      case NotificationFieldKey.SCHEDULE_SHIFT_PUBLISHED_SEND_MODE:
        return (
          mapShiftChangePreferenceToSendMode(
            updatedFormValue.publishShiftChangePreference?.value,
          ) ?? ''
        );

      // Schedule channel arrays restore from the snapshot's subscriptions (no
      // per-field {value} entry exists for these — they live in the array).
      case NotificationFieldKey.SCHEDULE_SHIFT_PUBLISHED_CHANNELS:
      case NotificationFieldKey.SCHEDULE_ONE_HOUR_CHANNELS:
      case NotificationFieldKey.SCHEDULE_FORGOT_CLOCK_IN_AFTER_STARTED_CHANNELS:
      case NotificationFieldKey.SCHEDULE_FORGOT_CLOCK_IN_AFTER_ENDED_CHANNELS:
      case NotificationFieldKey.SCHEDULE_LATE_CLOCK_IN_NOTIFY_MANAGER_CHANNELS:
        return mapSubscriptionsToScheduleChannels(
          updatedFormValue.scheduleNotificationSubscriptions,
        )[field as keyof ScheduleNotificationChannelsByField];

      default: {
        if (field === 'overtimeNotificationRules') {
          return [];
        }
        const entry = updatedFormValue[field as keyof MappedQLSettings];
        const value =
          entry &&
          typeof entry === 'object' &&
          !Array.isArray(entry) &&
          'value' in entry
            ? (entry as { value: unknown }).value
            : undefined;
        if (value === undefined) {
          // eslint-disable-next-line no-nested-ternary
          return field === 'firstDayOfWeek'
            ? '0'
            : // eslint-disable-next-line no-nested-ternary
            field.includes('Enabled')
            ? false
            : field.includes('Time')
            ? ''
            : [];
        }
        return value as boolean | string | number | string[];
      }
    }
  };

  Object.keys(dirtyFields).forEach((field: string) => {
    const value = getFieldValue(field);
    timeEntrySettingsFormMethod.setValue(field, value, {
      shouldDirty: false,
    });
    delete timeEntrySettingsFormMethod.formState.dirtyFields[field];
  });
};

// Helper function to format time for locale or return default
const formatTimeOrDefault = (
  time: string | undefined,
  isUKLocale?: boolean,
): string => {
  if (time) {
    return formatTimeTo12Hour(time, isUKLocale);
  }
  return isUKLocale ? '00:00' : '12:00 AM';
};

// Helper function to get nested value safely
export const getNestedValue = (obj: any, path: string[]): any =>
  path.reduce((acc, key) => acc?.[key], obj);

// Helper function to get version from result object
export const getVersion = (
  result: any,
  path: string[],
  defaultVersion = '',
): string => {
  const version = getNestedValue(result, [...path, 'meta', 'version']);
  return version || defaultVersion;
};

// Helper function to get value from result object
export const getValue = (
  result: any,
  path: string[],
  defaultValue: any,
): any => {
  const value = getNestedValue(result, [...path, 'value']);
  return value ?? defaultValue;
};

export const getSettingData = (
  result: any,
  updatedFields: string[],
  fieldName: string,
  path: string[],
  defaultValue: any,
  updatedTimeEntryFormValue?: MappedQLSettings,
  updateTimeEntryFormValueKeyName?: string,
) => {
  const isFieldUpdated = updatedFields.includes(fieldName);

  // Special handling for firstDayOfWeek
  if (fieldName === TIME_TRACKING_SETTINGS.FIRST_DAY_OF_WEEK) {
    if (isFieldUpdated) {
      const value = getValue(result, path, null);
      return {
        version: getVersion(result, path, '0'),
        value: value
          ? mapDaysOfWeekValueToNumber(value)
          : mapDaysOfWeekValueToNumber(Common_DayOfWeek.Sunday),
      };
    }
    const existingValue = updatedTimeEntryFormValue?.[
      fieldName as keyof MappedQLSettings
    ] as TimeEntryNumberField | undefined;
    return {
      version: existingValue?.version || '',
      value:
        existingValue?.value ??
        mapDaysOfWeekValueToNumber(Common_DayOfWeek.Sunday),
    };
  }

  if (
    [
      'clockInNotificationReminderEmail',
      'clockInNotificationReminderMobile',
      'clockOutNotificationReminderEmail',
      'clockOutNotificationReminderMobile',
    ].includes(fieldName)
  ) {
    if (isFieldUpdated) {
      const value = getValue(result, path, null);
      const searchValue = fieldName.includes('Mobile')
        ? 'PUSH_NOTIFICATION'
        : 'EMAIL';
      const valueCheck =
        fieldName === 'clockInNotificationReminderEmail'
          ? !!(value && value.length > 0 && value.indexOf(searchValue) !== -1)
          : Boolean(value?.includes(searchValue));

      return {
        version: getVersion(result, path, ''),
        value: valueCheck,
      };
    }
    const existingValue = updatedTimeEntryFormValue?.[
      fieldName as keyof MappedQLSettings
    ] as TimeEntryBooleanField | undefined;
    return {
      version: existingValue?.version || '',
      value: existingValue?.value ?? false,
    };
  }

  // Normal handling for other fields
  if (isFieldUpdated) {
    return {
      version: getVersion(result, path),
      value: getValue(result, path, defaultValue),
    };
  }

  const existingValue =
    fieldName === TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_SERVICE_ENABLE
      ? updatedTimeEntryFormValue?.[
          updateTimeEntryFormValueKeyName as keyof MappedQLSettings
        ]
      : updatedTimeEntryFormValue?.[fieldName as keyof MappedQLSettings];

  const asVersionedSetting = (
    v: MappedQLSettings[keyof MappedQLSettings] | undefined,
  ): { version: string; value: unknown } | undefined => {
    if (
      v === undefined ||
      v === null ||
      Array.isArray(v) ||
      typeof v !== 'object' ||
      !('version' in v && 'value' in v)
    ) {
      return undefined;
    }
    return v as { version: string; value: unknown };
  };

  if (
    !existingValue &&
    updatedTimeEntryFormValue?.[
      updateTimeEntryFormValueKeyName as keyof MappedQLSettings
    ]
  ) {
    const updatedValue =
      updatedTimeEntryFormValue[
        updateTimeEntryFormValueKeyName as keyof MappedQLSettings
      ];

    const v = asVersionedSetting(updatedValue);
    return {
      version: v?.version || '',
      value: v?.value ?? defaultValue,
    };
  }

  const v = asVersionedSetting(existingValue);
  return {
    version: v?.version || '',
    value: v?.value ?? defaultValue,
  };
};

export const mapGetQlSettingsData = (
  result: any,
  updatedFields: string[],
  updatedTimeEntryFormValue?: MappedQLSettings,
) => ({
  // Clock In Notification Settings
  clockInNotificationReminderTime: getSettingData(
    result,
    updatedFields,
    'clockInNotificationReminderTime',
    ['notificationSettings', 'startShiftNotifications', 'reminderTime'],
    '8:00',
    updatedTimeEntryFormValue,
  ),

  clockInNotificationReminderEmail: getSettingData(
    result,
    updatedFields,
    'clockInNotificationReminderEmail',
    ['notificationSettings', 'startShiftNotifications', 'notificationMedium'],
    false,
    updatedTimeEntryFormValue,
  ),

  clockInNotificationReminderMobile: getSettingData(
    result,
    updatedFields,
    'clockInNotificationReminderMobile',
    ['notificationSettings', 'startShiftNotifications', 'notificationMedium'],
    false,
    updatedTimeEntryFormValue,
  ),

  // Clock Out Notification Settings
  clockOutNotificationReminderTime: getSettingData(
    result,
    updatedFields,
    'clockOutNotificationReminderTime',
    ['notificationSettings', 'endShiftNotifications', 'reminderTime'],
    '17:00',
    updatedTimeEntryFormValue,
  ),

  clockOutNotificationReminderEmail: getSettingData(
    result,
    updatedFields,
    'clockOutNotificationReminderEmail',
    ['notificationSettings', 'endShiftNotifications', 'notificationMedium'],
    false,
    updatedTimeEntryFormValue,
  ),

  clockOutNotificationReminderMobile: getSettingData(
    result,
    updatedFields,
    'clockOutNotificationReminderMobile',
    ['notificationSettings', 'endShiftNotifications', 'notificationMedium'],
    false,
    updatedTimeEntryFormValue,
  ),

  // Notification Days Settings
  notificationEnabledForDays: getSettingData(
    result,
    updatedFields,
    'notificationEnabledForDays',
    ['notificationSettings', 'notificationEnabledForDays'],
    WEEK_DAYS,
    updatedTimeEntryFormValue,
  ),

  // Time Management Settings
  firstDayOfWeek: getSettingData(
    result,
    updatedFields,
    'firstDayOfWeek',
    ['startWorkWeek'],
    mapDaysOfWeekValueToNumber(Common_DayOfWeek.Sunday),
    updatedTimeEntryFormValue,
  ),

  timeZone: getSettingData(
    result,
    updatedFields,
    'timeZone',
    ['dateTimeSettings', 'timeZone'],
    '',
    updatedTimeEntryFormValue,
  ),

  timeFormat: getSettingData(
    result,
    updatedFields,
    'timeFormat',
    ['dateTimeSettings', 'clockFormat'],
    24,
    updatedTimeEntryFormValue,
  ),

  // Timesheet Management Settings
  splitTimeSheetAtMidnightEnabled: getSettingData(
    result,
    updatedFields,
    'splitTimeSheetAtMidnightEnabled',
    ['timesheetManagementSettings', 'timesheet', 'splitAtMidnightEnabled'],
    false,
    updatedTimeEntryFormValue,
  ),

  manageOwnTimeSheetsEnabled: getSettingData(
    result,
    updatedFields,
    'manageOwnTimeSheetsEnabled',
    ['timesheetManagementSettings', 'timesheet', 'manageOwnTimesheetEnabled'],
    false,
    updatedTimeEntryFormValue,
  ),

  mobileTimeTrackingEnabled: getSettingData(
    result,
    updatedFields,
    'mobileTimeTrackingEnabled',
    ['timesheetManagementSettings', 'timesheet', 'mobileTimeTrackingEnabled'],
    false,
    updatedTimeEntryFormValue,
  ),

  signatureCaptureEnabled: getSettingData(
    result,
    updatedFields,
    'signatureCaptureEnabled',
    ['timesheetManagementSettings', 'timesheet', 'signatureCaptureEnabled'],
    false,
    updatedTimeEntryFormValue,
  ),

  editClockOutTimeEnabled: getSettingData(
    result,
    updatedFields,
    'editClockOutTimeEnabled',
    ['timesheetManagementSettings', 'timesheet', 'editClockOutTimeEnabled'],
    false,
    updatedTimeEntryFormValue,
  ),

  clockOutOverrideHours: getSettingData(
    result,
    updatedFields,
    'clockOutOverrideHours',
    ['timesheetManagementSettings', 'timesheet', 'clockOutOverrideHours'],
    8,
    updatedTimeEntryFormValue,
  ),

  // Clock Rounding Settings
  clockInRoundDirection: getSettingData(
    result,
    updatedFields,
    'clockInRoundDirection',
    ['clockRoundingSettings', 'startTimeRounding', 'direction'],
    'NEAREST',
    updatedTimeEntryFormValue,
  ),

  clockInRoundInMin: getSettingData(
    result,
    updatedFields,
    'clockInRoundInMin',
    ['clockRoundingSettings', 'startTimeRounding', 'roundInMin'],
    1,
    updatedTimeEntryFormValue,
  ),

  clockOutRoundDirection: getSettingData(
    result,
    updatedFields,
    'clockOutRoundDirection',
    ['clockRoundingSettings', 'endTimeRounding', 'direction'],
    'NEAREST',
    updatedTimeEntryFormValue,
  ),

  clockOutRoundInMin: getSettingData(
    result,
    updatedFields,
    'clockOutRoundInMin',
    ['clockRoundingSettings', 'endTimeRounding', 'roundInMin'],
    1,
    updatedTimeEntryFormValue,
  ),

  // Custom Fields Settings
  customersForTimeSheetEnabled: getSettingData(
    result,
    updatedFields,
    'customersForTimeSheetEnabled',
    ['timesheetManagementSettings', 'customFields', 'customersEnabled'],
    true,
    updatedTimeEntryFormValue,
  ),

  isBillingFieldEnabled: getSettingData(
    result,
    updatedFields,
    'isBillingFieldEnabled',
    ['billingForTimeEnabled'],
    false,
    updatedTimeEntryFormValue,
  ),

  billingRateForTimeEnabled: getSettingData(
    result,
    updatedFields,
    'billingRateForTimeEnabled',
    ['billingRateForTimeEnabled'],
    false,
    updatedTimeEntryFormValue,
  ),

  requireBillable: getSettingData(
    result,
    updatedFields,
    'requireBillable',
    ['coreSettings', 'requireBillable'],
    false,
    updatedTimeEntryFormValue,
  ),

  useItemForTime: getSettingData(
    result,
    updatedFields,
    'isServiceFieldEnabled',
    ['useItemForTime'],
    false,
    updatedTimeEntryFormValue,
    'useItemForTime',
  ),

  classForTimeSheetEnabled: getSettingData(
    result,
    updatedFields,
    'classForTimeSheetEnabled',
    ['timesheetManagementSettings', 'customFields', 'classEnabled'],
    false,
    updatedTimeEntryFormValue,
  ),

  locationForTimeSheetEnabled: getSettingData(
    result,
    updatedFields,
    'locationForTimeSheetEnabled',
    ['timesheetManagementSettings', 'customFields', 'locationEnabled'],
    false,
    updatedTimeEntryFormValue,
  ),

  classRequired: getSettingData(
    result,
    updatedFields,
    'classRequired',
    ['coreSettings', 'classRequired'],
    false,
    updatedTimeEntryFormValue,
  ),

  locationRequired: getSettingData(
    result,
    updatedFields,
    'locationRequired',
    ['coreSettings', 'locationRequired'],
    false,
    updatedTimeEntryFormValue,
  ),

  serviceItemRequired: getSettingData(
    result,
    updatedFields,
    'serviceItemRequired',
    ['coreSettings', 'serviceItemRequired'],
    false,
    updatedTimeEntryFormValue,
  ),

  // Notes Settings
  timeSheetEntryNotesEnabled: getSettingData(
    result,
    updatedFields,
    'timeSheetEntryNotesEnabled',
    ['timesheetManagementSettings', 'notes', 'enabled'],
    false,
    updatedTimeEntryFormValue,
  ),

  timeSheetEntryEditNotesEnabled: getSettingData(
    result,
    updatedFields,
    'timeSheetEntryEditNotesEnabled',
    ['timesheetManagementSettings', 'notes', 'editEnabled'],
    false,
    updatedTimeEntryFormValue,
  ),

  timeSheetEntryMakesNotesRequiredEnabled: getSettingData(
    result,
    updatedFields,
    'timeSheetEntryMakesNotesRequiredEnabled',
    ['timesheetManagementSettings', 'notes', 'requiredEnabled'],
    false,
    updatedTimeEntryFormValue,
  ),

  customDimensions: (() => {
    if (!updatedFields.includes(DIMENSIONS_FORM_NAME)) {
      return updatedTimeEntryFormValue?.customDimensions ?? [];
    }

    return mapCustomDimensionsWireToSettings(
      result?.timesheetManagementSettings?.customFields?.customDimensions,
    );
  })(),

  // Location Tracking Settings
  locationTracking: getSettingData(
    result,
    updatedFields,
    'locationTracking',
    ['timesheetManagementSettings', 'timesheet', 'locationTracking'],
    TimeTracking_LocationTrackingType.Optional,
    updatedTimeEntryFormValue,
  ),

  // Notification Settings
  notifyAdminOnClockOutOverrideEnabled: getSettingData(
    result,
    updatedFields,
    'notifyWhenClockInOutUpdated',
    ['notificationSettings', 'clockOutOverrideNotifications', 'adminEnabled'],
    false,
    updatedTimeEntryFormValue,
    'notifyAdminOnClockOutOverrideEnabled',
  ),

  notifyManagerOnClockOutOverrideEnabled: getSettingData(
    result,
    updatedFields,
    'notifyWhenClockInOutUpdated',
    [
      'notificationSettings',
      'clockOutOverrideNotifications',
      'groupManagerEnabled',
    ],
    false,
    updatedTimeEntryFormValue,
    'notifyManagerOnClockOutOverrideEnabled',
  ),

  notifyAdminOnTimeSheetNotesEditEnabled: getSettingData(
    result,
    updatedFields,
    'notifyWhenNotesAreAddedOrEdited',
    ['notificationSettings', 'timesheetEditNotifications', 'adminEnabled'],
    false,
    updatedTimeEntryFormValue,
    'notifyAdminOnTimeSheetNotesEditEnabled',
  ),

  notifyGroupManagerOnTimeSheetNotesEditEnabled: getSettingData(
    result,
    updatedFields,
    'notifyWhenNotesAreAddedOrEdited',
    [
      'notificationSettings',
      'timesheetEditNotifications',
      'groupManagerEnabled',
    ],
    false,
    updatedTimeEntryFormValue,
    'notifyGroupManagerOnTimeSheetNotesEditEnabled',
  ),

  // Geofence Reminder Settings
  geofenceReminderStartTime: getSettingData(
    result,
    updatedFields,
    'geofenceReminderStartTime',
    ['geofenceSettings', 'geofenceReminderSettings', 'startTime'],
    '08:00',
    updatedTimeEntryFormValue,
  ),

  geofenceReminderEndTime: getSettingData(
    result,
    updatedFields,
    'geofenceReminderEndTime',
    ['geofenceSettings', 'geofenceReminderSettings', 'endTime'],
    '17:00',
    updatedTimeEntryFormValue,
  ),

  geofenceReminderDaysOfWeek: getSettingData(
    result,
    updatedFields,
    'geofenceReminderDaysOfWeek',
    ['geofenceSettings', 'geofenceReminderSettings', 'daysOfWeek'],
    WEEK_DAYS,
    updatedTimeEntryFormValue,
  ),

  overtimeNotificationRules: (() => {
    const fromResult =
      result?.notificationSettings?.overtimeNotifications?.rules;
    if (fromResult != null) {
      return fromResult.filter(
        (r: unknown): r is TimeTracking_OvertimeNotificationRule => r != null,
      );
    }
    return updatedTimeEntryFormValue?.overtimeNotificationRules ?? [];
  })(),

  // Read from the mutation result, falling back to the existing snapshot,
  // so the value persists after save without a fresh GET.
  publishShiftChangePreference: (() => {
    const fromResult =
      result?.notificationSettings?.scheduleNotifications
        ?.publishShiftChangePreference;
    if (fromResult?.value != null) {
      return {
        // Prefer the returned version; if the result omitted it,
        // keep the prior known version so the optimistic-lock token stays valid.
        version:
          fromResult?.meta?.version ??
          updatedTimeEntryFormValue?.publishShiftChangePreference?.version ??
          '0',
        value: fromResult.value,
      };
    }
    return (
      updatedTimeEntryFormValue?.publishShiftChangePreference ?? {
        version: '0',
        value: '',
      }
    );
  })(),

  // The API may return only the affected subscription row(s), so merge the
  // returned rows into the prior snapshot by notificationType (returned row
  // wins; untouched prior rows are preserved). This keeps the view and the
  // per-row versions fresh after save without a fresh GET.
  scheduleNotificationSubscriptions: (() => {
    const fromResult =
      result?.notificationSettings?.scheduleNotifications?.subscriptions;
    if (Array.isArray(fromResult)) {
      const byType = new Map<
        TimeTracking_NotificationType,
        TimeTracking_NotificationSubscription
      >(
        (
          updatedTimeEntryFormValue?.scheduleNotificationSubscriptions ?? []
        ).map((s) => [s.notificationType, s]),
      );
      fromResult
        .filter(
          (s: unknown): s is TimeTracking_NotificationSubscription => s != null,
        )
        .forEach((s) => byType.set(s.notificationType, s));
      return Array.from(byType.values());
    }
    return updatedTimeEntryFormValue?.scheduleNotificationSubscriptions ?? [];
  })(),
});

export const updateTheSelectedFields = (
  isFieldEnable: boolean,
  fieldsArray: string[],
  keyToIdentifyTheField: string,
) => {
  if (isFieldEnable && fieldsArray.indexOf(keyToIdentifyTheField) === -1) {
    fieldsArray.push(keyToIdentifyTheField);
  } else if (
    !isFieldEnable &&
    fieldsArray.indexOf(keyToIdentifyTheField) !== -1
  ) {
    fieldsArray.splice(fieldsArray.indexOf(keyToIdentifyTheField), 1);
  }
};

export const updateTimeSheetFieldsSelectedFields = (
  updatedTimeEntryFormValue: MappedQLSettings,
  selectedCustomTimeSheetFields: string[],
) => {
  Object.keys(updatedTimeEntryFormValue).forEach((timeEntryKey) => {
    switch (timeEntryKey) {
      case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CUSTOMER_FOR_TIMESHEET_ENABLED:
        {
          const isCustomersForTimeSheetEnabled =
            updatedTimeEntryFormValue.customersForTimeSheetEnabled?.value;
          updateTheSelectedFields(
            isCustomersForTimeSheetEnabled ?? false,
            selectedCustomTimeSheetFields,
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CUSTOMER_FOR_TIMESHEET_ENABLED,
          );
        }
        break;

      case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED:
        {
          const isBillingFieldEnabled =
            updatedTimeEntryFormValue.isBillingFieldEnabled?.value;

          updateTheSelectedFields(
            isBillingFieldEnabled,
            selectedCustomTimeSheetFields,
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
          );
        }
        break;

      case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.USE_ITEM_FOR_TIME:
        {
          const isUseItemForTimeEnable =
            updatedTimeEntryFormValue.useItemForTime?.value;

          updateTheSelectedFields(
            isUseItemForTimeEnable,
            selectedCustomTimeSheetFields,
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_SERVICE_ENABLE,
          );
        }
        break;

      case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES:
        {
          const isClassForTimeSheetEnabled =
            updatedTimeEntryFormValue.classForTimeSheetEnabled?.value;

          updateTheSelectedFields(
            isClassForTimeSheetEnabled ?? false,
            selectedCustomTimeSheetFields,
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
          );
        }
        break;

      case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.LOCATION_FOR_TIMESHEET_ENABLED:
        {
          const isLocationForTimeSheetEnabled =
            updatedTimeEntryFormValue.locationForTimeSheetEnabled?.value;

          updateTheSelectedFields(
            isLocationForTimeSheetEnabled ?? false,
            selectedCustomTimeSheetFields,
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.LOCATION_FOR_TIMESHEET_ENABLED,
          );
        }
        break;

      case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_NOTES_ENABLE:
        {
          const isTimeSheetEntryNotesEnabled =
            updatedTimeEntryFormValue.timeSheetEntryNotesEnabled?.value;

          updateTheSelectedFields(
            isTimeSheetEntryNotesEnabled ?? false,
            selectedCustomTimeSheetFields,
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_NOTES_ENABLE,
          );
        }
        break;

      default:
        break;
    }
  });

  return selectedCustomTimeSheetFields;
};
