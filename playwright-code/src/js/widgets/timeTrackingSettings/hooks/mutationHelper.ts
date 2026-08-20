import dayjs from 'dayjs';
import {
  CustomDimensionSetting,
  MappedQLSettings,
} from 'src/js/service/hooks/settings/useGetQLSettings';
import { TimeTracking_NotificationReminderMedium } from 'src/__generated__/timeTracking/graphql';
import { DIMENSIONS_FORM_NAME } from 'src/js/widgets/common/dimensions/types';
import { ITimeEntrySettingsFormState } from '../types';
import {
  CLOCK_ROUNDING_SETTINGS,
  NotificationFieldKey,
  NotificationMedium,
  NotificationRecipient,
  TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS,
  TIME_TRACKING_SETTINGS,
} from '../constants';
import {
  formatTimeTo24Hour,
  mapSendModeToShiftChangePreference,
  SCHEDULE_NOTIFICATION_FIELD_TO_TYPE,
} from '../utils';

export const isNotificationRecipientEnabled = (
  formValue: string,
  recipientTypes: NotificationRecipient[],
): boolean => recipientTypes.includes(formValue as NotificationRecipient);

export const createMutationPayload = <
  T extends boolean | number | string | string[],
>(
  isUpdated: boolean,
  version: string | undefined,
  value: T,
): { version: string; value: T } | undefined =>
  isUpdated ? { version: version || '', value } : undefined;

export const createNotificationMediumData = (
  emailEnabled: boolean,
  mobileEnabled: boolean,
): NotificationMedium[] => {
  if (emailEnabled && mobileEnabled) {
    return [NotificationMedium.EMAIL, NotificationMedium.PUSH_NOTIFICATION];
  }
  if (emailEnabled) {
    return [NotificationMedium.EMAIL];
  }
  if (mobileEnabled) {
    return [NotificationMedium.PUSH_NOTIFICATION];
  }
  return [];
};

export const createObjectIfHasValues = (obj: Record<string, any>) => {
  const filtered = Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined),
  );
  return Object.keys(filtered).length > 0 ? filtered : undefined;
};

/**
 * Builds the customDimensions mutation array from form toggle state.
 * Sends all active dimensions when the `dimensions` form map is dirty.
 */
export const createCustomDimensionsMutationPayload = (
  formState: ITimeEntrySettingsFormState,
): CustomDimensionSetting[] => {
  const dimensionDefinitions = formState.dimensionDefinitions ?? [];
  const savedSettings = formState.customDimensions ?? [];
  const dimensionToggles = formState.dimensions ?? {};
  const settingsById = new Map(
    savedSettings.map((setting) => [setting.dimensionDefinitionId, setting]),
  );

  return dimensionDefinitions
    .filter((definition) => definition.active === true)
    .map((definition) => {
      const toggles = dimensionToggles[definition.id] ?? {
        enabled: false,
        required: false,
      };
      const saved = settingsById.get(definition.id);

      return {
        dimensionDefinitionId: definition.id,
        enabledForTimeTracking: {
          version: saved?.enabledForTimeTracking?.version ?? '0',
          value: toggles.enabled ?? false,
        },
        required: {
          version: saved?.required?.version ?? '0',
          value: toggles.required ?? false,
        },
      };
    });
};

export const createDateTimeSettings = (
  formState: ITimeEntrySettingsFormState,
  settings: MappedQLSettings,
  updatedFields: string[],
) =>
  createObjectIfHasValues({
    timeZone: createMutationPayload(
      updatedFields.includes(TIME_TRACKING_SETTINGS.TIME_ZONE),
      settings.timeZone?.version,
      formState.timeZone,
    ),
    clockFormat: createMutationPayload(
      updatedFields.includes(TIME_TRACKING_SETTINGS.TIME_FORMAT),
      settings.timeFormat?.version,
      parseInt(formState.timeFormat, 10),
    ),
  });

export const createTimesheetManagementSettings = (
  formState: ITimeEntrySettingsFormState,
  settings: MappedQLSettings,
  updatedFields: string[],
) =>
  createObjectIfHasValues({
    notes: createObjectIfHasValues({
      enabled: createMutationPayload(
        updatedFields.includes(
          TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_NOTES_ENABLE,
        ),
        settings.timeSheetEntryNotesEnabled?.version,
        formState.timeSheetEntryNotesEnabled,
      ),
      editEnabled: createMutationPayload(
        updatedFields.includes(
          TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_EDITS_NOTES_ENABLED,
        ),
        settings.timeSheetEntryEditNotesEnabled?.version,
        formState.timeSheetEntryEditNotesEnabled,
      ),
      requiredEnabled: createMutationPayload(
        updatedFields.includes(
          TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_ENTRY_MAKES_NOTES_REQUIRES_ENABLES,
        ),
        settings.timeSheetEntryMakesNotesRequiredEnabled?.version,
        formState.timeSheetEntryMakesNotesRequiredEnabled,
      ),
    }),
    timesheet: createObjectIfHasValues({
      manageOwnTimesheetEnabled: createMutationPayload(
        updatedFields.includes(
          TIME_TRACKING_SETTINGS.MANAGE_OWN_TIME_SHEETS_ENABLED,
        ),
        settings.manageOwnTimeSheetsEnabled?.version,
        formState.manageOwnTimeSheetsEnabled,
      ),
      mobileTimeTrackingEnabled: createMutationPayload(
        updatedFields.includes(
          TIME_TRACKING_SETTINGS.MOBILE_TIME_TRACKING_ENABLED,
        ),
        settings.mobileTimeTrackingEnabled?.version,
        formState.mobileTimeTrackingEnabled,
      ),
      signatureCaptureEnabled: createMutationPayload(
        updatedFields.includes(
          TIME_TRACKING_SETTINGS.SIGNATURE_CAPTURE_ENABLED,
        ),
        settings.signatureCaptureEnabled?.version,
        formState.signatureCaptureEnabled,
      ),
      editClockOutTimeEnabled: createMutationPayload(
        updatedFields.includes(
          TIME_TRACKING_SETTINGS.EDIT_CLOCK_OUT_TIME_ENABLED,
        ),
        settings.editClockOutTimeEnabled?.version,
        formState.editClockOutTimeEnabled,
      ),
      clockOutOverrideHours:
        updatedFields.includes(
          TIME_TRACKING_SETTINGS.CLOCK_OUT_OVERRIDE_HOURS,
        ) && formState.editClockOutTimeEnabled
          ? createMutationPayload(
              true,
              settings.clockOutOverrideHours?.version,
              parseInt(formState.clockOutOverrideHours, 10),
            )
          : undefined,
      splitAtMidnightEnabled: createMutationPayload(
        updatedFields.includes(
          TIME_TRACKING_SETTINGS.SPLIT_TIME_SHEET_AT_MIDNIGET_ENABLED,
        ),
        settings.splitTimeSheetAtMidnightEnabled?.version,
        formState.splitTimeSheetAtMidnightEnabled,
      ),
    }),
    customFields: createObjectIfHasValues({
      customersEnabled: createMutationPayload(
        updatedFields.includes(
          TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CUSTOMER_FOR_TIMESHEET_ENABLED,
        ),
        settings.customersForTimeSheetEnabled?.version,
        formState.customersForTimeSheetEnabled,
      ),
      classEnabled: createMutationPayload(
        updatedFields.includes(
          TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
        ),
        settings.classForTimeSheetEnabled?.version,
        formState.classForTimeSheetEnabled,
      ),
      locationEnabled: createMutationPayload(
        updatedFields.includes(
          TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.LOCATION_FOR_TIMESHEET_ENABLED,
        ),
        settings.locationForTimeSheetEnabled?.version,
        formState.locationForTimeSheetEnabled,
      ),
      customDimensions: updatedFields.includes(DIMENSIONS_FORM_NAME)
        ? createCustomDimensionsMutationPayload(formState)
        : undefined,
    }),
  });

export const createClockRoundingSettings = (
  formState: ITimeEntrySettingsFormState,
  settings: MappedQLSettings,
  updatedFields: string[],
) =>
  createObjectIfHasValues({
    startTimeRounding: createObjectIfHasValues({
      direction: createMutationPayload(
        updatedFields.includes(
          CLOCK_ROUNDING_SETTINGS.CLOCK_IN_ROUND_DIRECTION,
        ),
        settings.clockInRoundDirection?.version,
        formState.clockInRoundDirection,
      ),
      roundInMin: createMutationPayload(
        updatedFields.includes(
          CLOCK_ROUNDING_SETTINGS.CLOCK_IN_ROUND_IN_MINUTE,
        ),
        settings.clockInRoundInMin?.version,
        formState.clockInRoundInMin,
      ),
    }),
    endTimeRounding: createObjectIfHasValues({
      direction: createMutationPayload(
        updatedFields.includes(
          CLOCK_ROUNDING_SETTINGS.CLOCK_OUT_ROUND_DIRECTION,
        ),
        settings.clockOutRoundDirection?.version,
        formState.clockOutRoundDirection,
      ),
      roundInMin: createMutationPayload(
        updatedFields.includes(
          CLOCK_ROUNDING_SETTINGS.CLOCK_OUT_ROUND_IN_MINUTE,
        ),
        settings.clockOutRoundInMin?.version,
        formState.clockOutRoundInMin,
      ),
    }),
  });

export const createNotificationSettings = (
  formState: ITimeEntrySettingsFormState,
  settings: MappedQLSettings,
  updatedFields: string[],
  isUKLocale?: boolean,
) => {
  let clockInValue = formState.clockInNotificationReminderTime;
  if (dayjs.isDayjs(clockInValue)) {
    clockInValue = isUKLocale
      ? clockInValue.format('HH:mm')
      : clockInValue.format('h:mm A');
  }

  let clockOutValue = formState.clockOutNotificationReminderTime;
  if (dayjs.isDayjs(clockOutValue)) {
    clockOutValue = isUKLocale
      ? clockOutValue.format('HH:mm')
      : clockOutValue.format('h:mm A');
  }

  const clockInNotificationReminderTime = formatTimeTo24Hour(
    clockInValue,
    isUKLocale,
  );
  const clockOutNotificationReminderTime = formatTimeTo24Hour(
    clockOutValue,
    isUKLocale,
  );

  const clockInNotificationMediumData = createNotificationMediumData(
    formState.clockInNotificationReminderEmail,
    formState.clockInNotificationReminderMobile,
  );

  const clockOutNotificationMediumData = createNotificationMediumData(
    formState.clockOutNotificationReminderEmail,
    formState.clockOutNotificationReminderMobile,
  );

  const isNotifyAdminOnClockOutOverrideEnabled = isNotificationRecipientEnabled(
    formState.notifyWhenClockInOutUpdated,
    [
      NotificationRecipient.ADMINS_AND_MANAGERS,
      NotificationRecipient.ADMINS_ONLY,
    ],
  );

  const isNotifyManagerOnClockOutOverrideEnabled =
    isNotificationRecipientEnabled(formState.notifyWhenClockInOutUpdated, [
      NotificationRecipient.ADMINS_AND_MANAGERS,
      NotificationRecipient.MANAGERS_ONLY,
    ]);

  const isNotifyAdminOnTimeSheetNotesEditEnabled =
    isNotificationRecipientEnabled(formState.notifyWhenNotesAreAddedOrEdited, [
      NotificationRecipient.ADMINS_AND_MANAGERS,
      NotificationRecipient.ADMINS_ONLY,
    ]);

  const isNotifyGroupManagerOnTimeSheetNotesEditEnabled =
    isNotificationRecipientEnabled(formState.notifyWhenNotesAreAddedOrEdited, [
      NotificationRecipient.ADMINS_AND_MANAGERS,
      NotificationRecipient.MANAGERS_ONLY,
    ]);

  return createObjectIfHasValues({
    startShiftNotifications: createObjectIfHasValues({
      reminderTime: createMutationPayload(
        updatedFields.includes('clockInNotificationReminderTime'),
        settings.clockInNotificationReminderTime?.version,
        clockInNotificationReminderTime,
      ),
      notificationMedium: [
        'clockInNotificationReminderEmail',
        'clockInNotificationReminderMobile',
      ].some((item) => updatedFields.includes(item))
        ? createMutationPayload(
            true,
            settings.clockInNotificationReminderEmail?.version,
            clockInNotificationMediumData,
          )
        : undefined,
    }),
    endShiftNotifications: createObjectIfHasValues({
      reminderTime: createMutationPayload(
        updatedFields.includes('clockOutNotificationReminderTime'),
        settings.clockOutNotificationReminderTime?.version,
        clockOutNotificationReminderTime,
      ),
      notificationMedium: [
        'clockOutNotificationReminderEmail',
        'clockOutNotificationReminderMobile',
      ].some((item) => updatedFields.includes(item))
        ? createMutationPayload(
            true,
            settings.clockOutNotificationReminderEmail?.version,
            clockOutNotificationMediumData,
          )
        : undefined,
    }),
    notificationEnabledForDays: createMutationPayload(
      updatedFields.includes('notificationEnabledForDays'),
      settings.notificationEnabledForDays?.version,
      formState.notificationEnabledForDays || [],
    ),
    clockOutOverrideNotifications: updatedFields.includes(
      'notifyWhenClockInOutUpdated',
    )
      ? {
          adminEnabled: createMutationPayload(
            true,
            settings.notifyAdminOnClockOutOverrideEnabled?.version,
            isNotifyAdminOnClockOutOverrideEnabled,
          ),
          groupManagerEnabled: createMutationPayload(
            true,
            settings.notifyManagerOnClockOutOverrideEnabled?.version,
            isNotifyManagerOnClockOutOverrideEnabled,
          ),
        }
      : undefined,
    timesheetEditNotifications: updatedFields.includes(
      'notifyWhenNotesAreAddedOrEdited',
    )
      ? {
          adminEnabled: createMutationPayload(
            true,
            settings.notifyAdminOnTimeSheetNotesEditEnabled?.version,
            isNotifyAdminOnTimeSheetNotesEditEnabled,
          ),
          groupManagerEnabled: createMutationPayload(
            true,
            settings.notifyGroupManagerOnTimeSheetNotesEditEnabled?.version,
            isNotifyGroupManagerOnTimeSheetNotesEditEnabled,
          ),
        }
      : undefined,
    scheduleNotifications: createScheduleNotificationsInput(
      formState,
      settings,
      updatedFields,
    ),
  });
};

/**
 * Builds the scheduleNotifications mutation input: the publishShiftChangePreference
 * (send mode) plus a subscriptions array for the per-row channel fields. Only the
 * rows the user changed are included, each carrying its optimistic-lock version
 * looked up by notificationType from the settings read. Returns undefined when no
 * schedule field changed.
 */
export const createScheduleNotificationsInput = (
  formState: ITimeEntrySettingsFormState,
  settings: MappedQLSettings,
  updatedFields: string[],
) => {
  const sendModeChanged = updatedFields.includes(
    NotificationFieldKey.SCHEDULE_SHIFT_PUBLISHED_SEND_MODE,
  );

  // version per notificationType, sourced from the prior read (per-row locking).
  const versionByType = new Map(
    (settings.scheduleNotificationSubscriptions ?? []).map((s) => [
      s.notificationType,
      s.meta?.version,
    ]),
  );

  const subscriptions = Object.entries(SCHEDULE_NOTIFICATION_FIELD_TO_TYPE)
    .filter(([field]) => updatedFields.includes(field))
    .map(([field, notificationType]) => {
      // Omit version entirely for first-time creates: the server treats an
      // absent version as a create, whereas '' would be sent as a (stale) value.
      const version = versionByType.get(notificationType);
      return {
        ...(version !== undefined ? { version } : {}),
        notificationType,
        distributionMethods:
          (formState[
            field as keyof ITimeEntrySettingsFormState
          ] as TimeTracking_NotificationReminderMedium[]) ?? [],
      };
    });

  if (!sendModeChanged && subscriptions.length === 0) {
    return undefined;
  }

  return createObjectIfHasValues({
    publishShiftChangePreference: sendModeChanged
      ? createMutationPayload(
          true,
          settings.publishShiftChangePreference?.version,
          mapSendModeToShiftChangePreference(formState.shiftPublishedSendMode),
        )
      : undefined,
    subscriptions: subscriptions.length > 0 ? subscriptions : undefined,
  });
};

/**
 * Creates geofence reminder settings mutation payload
 */
export const createGeofenceReminderSettings = (
  formState: ITimeEntrySettingsFormState,
  settings: MappedQLSettings,
  updatedFields: string[],
  isUKLocale?: boolean,
) => {
  let startTimeValue = formState.geofenceReminderStartTime;
  if (dayjs.isDayjs(startTimeValue)) {
    startTimeValue = isUKLocale
      ? startTimeValue.format('HH:mm')
      : startTimeValue.format('h:mm A');
  }
  const geofenceReminderStartTime = formatTimeTo24Hour(
    startTimeValue,
    isUKLocale,
  );

  let endTimeValue = formState.geofenceReminderEndTime;
  if (dayjs.isDayjs(endTimeValue)) {
    endTimeValue = isUKLocale
      ? endTimeValue.format('HH:mm')
      : endTimeValue.format('h:mm A');
  }
  const geofenceReminderEndTime = formatTimeTo24Hour(endTimeValue, isUKLocale);

  const geofenceReminderDaysOfWeek = formState.geofenceReminderDaysOfWeek || [];

  return createObjectIfHasValues({
    startTime: createMutationPayload(
      updatedFields.includes('geofenceReminderStartTime'),
      settings.geofenceReminderStartTime?.version,
      geofenceReminderStartTime,
    ),
    endTime: createMutationPayload(
      updatedFields.includes('geofenceReminderEndTime'),
      settings.geofenceReminderEndTime?.version,
      geofenceReminderEndTime,
    ),
    daysOfWeek: updatedFields.includes('geofenceReminderDaysOfWeek')
      ? {
          version: settings.geofenceReminderDaysOfWeek?.version || '0',
          value: geofenceReminderDaysOfWeek,
        }
      : undefined,
  });
};
