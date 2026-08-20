import { MappedQLSettings } from 'src/js/service/hooks/settings/useGetQLSettings';
import {
  FieldOption,
  IFormConfig,
  IIsFieldsVisible,
  ITimeEntrySettingsFormState,
  ITimeSheetFieldOption,
} from '../types';
import {
  CLOCK_ROUNDING_SETTINGS,
  NotificationField,
  NotificationFieldKey,
  NotificationRecipient,
  TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS,
  TIME_TRACKING_SETTINGS,
} from '../constants';
import {
  formatChannelsFor,
  formatScheduleNotificationSummaryValue,
  formatTimeTo12Hour,
  getWeekDay,
  hasEmailChannel,
  hasMobileChannel,
  mapShiftChangePreferenceToSendMode,
  mapSubscriptionsToScheduleChannels,
  uppercaseToPascalcase,
} from '../utils';

export const updateTimeSheetField = (
  fieldKey: string,
  fieldValue: boolean,
  editTimeSheetFields: ITimeSheetFieldOption[],
  subFieldKey?: string,
) => {
  const field = editTimeSheetFields.find(
    (timeSheetField) => timeSheetField.key === fieldKey,
  );

  if (field && !subFieldKey) {
    field.value = fieldValue;
  } else {
    const subField =
      field &&
      field.subFields &&
      field.subFields.find((subField) => subField.key === subFieldKey);

    if (subField) {
      subField.value = fieldValue;
    }
  }

  return editTimeSheetFields;
};

export const updateTimeTrackingFields = ({
  timeTrackingFields,
  updatedQlSettingsData,
  setFormFieldValue,
  timezoneConversions,
  intl,
  isFieldsVisible,
  setNotificationFields,
  updateVisibleFields,
  notificationFields,
}: {
  timeTrackingFields: IFormConfig;
  updatedQlSettingsData: MappedQLSettings;
  setFormFieldValue: (
    fieldName: keyof ITimeEntrySettingsFormState,
    fieldValue: string | boolean | number | string[],
  ) => void;
  timezoneConversions: { name: string; longFormName: string }[];
  intl: any;
  isFieldsVisible: IIsFieldsVisible;
  setNotificationFields: (notificationFields: IFormConfig) => void;
  updateVisibleFields: (visibleFields: IIsFieldsVisible) => void;
  notificationFields: IFormConfig;
}) => {
  Object.keys(timeTrackingFields).forEach((key) => {
    const formField = timeTrackingFields[key];

    formField.forEach((field: FieldOption) => {
      switch (field.key) {
        case TIME_TRACKING_SETTINGS.FIRST_DAY_OF_WEEK:
          {
            const weekDay = getWeekDay(
              Number(updatedQlSettingsData.firstDayOfWeek.value),
            );

            if (weekDay) {
              field.value = weekDay;
            }

            setFormFieldValue(
              TIME_TRACKING_SETTINGS.FIRST_DAY_OF_WEEK,
              JSON.stringify(updatedQlSettingsData.firstDayOfWeek.value),
            );
          }
          break;

        case TIME_TRACKING_SETTINGS.TIME_ZONE:
          {
            const timeZone = updatedQlSettingsData.timeZone?.value;

            const conversion = timezoneConversions.find(
              (item) => item.name === timeZone,
            );

            field.value = conversion ? conversion.longFormName : timeZone ?? '';

            setFormFieldValue(TIME_TRACKING_SETTINGS.TIME_ZONE, timeZone ?? '');
          }
          break;

        case TIME_TRACKING_SETTINGS.TIME_FORMAT:
          {
            const timeFormat = updatedQlSettingsData.timeFormat?.value;

            field.value =
              timeFormat === 24
                ? intl.formatMessage({ id: 'twentyFourHourFormat' })
                : intl.formatMessage({ id: 'twelveHourFormat' });
            setFormFieldValue(
              TIME_TRACKING_SETTINGS.TIME_FORMAT,
              timeFormat ?? 24,
            );
          }
          break;

        case TIME_TRACKING_SETTINGS.SPLIT_TIME_SHEET_AT_MIDNIGET_ENABLED:
          {
            const isSplitTimeSheet =
              updatedQlSettingsData.splitTimeSheetAtMidnightEnabled?.value;

            field.value = !isSplitTimeSheet
              ? intl.formatMessage({ id: 'off' })
              : intl.formatMessage({ id: 'on' });
            setFormFieldValue(
              TIME_TRACKING_SETTINGS.SPLIT_TIME_SHEET_AT_MIDNIGET_ENABLED,
              isSplitTimeSheet ?? false,
            );
          }
          break;

        case TIME_TRACKING_SETTINGS.MANAGE_OWN_TIME_SHEETS_ENABLED:
          {
            const isAllowTeamMemberToAddEditTimeSheets =
              updatedQlSettingsData.manageOwnTimeSheetsEnabled?.value;

            field.value = !isAllowTeamMemberToAddEditTimeSheets
              ? intl.formatMessage({ id: 'off' })
              : intl.formatMessage({ id: 'on' });
            setFormFieldValue(
              TIME_TRACKING_SETTINGS.MANAGE_OWN_TIME_SHEETS_ENABLED,
              isAllowTeamMemberToAddEditTimeSheets ?? false,
            );
          }
          break;

        case TIME_TRACKING_SETTINGS.MOBILE_TIME_TRACKING_ENABLED:
          {
            const isMobileTimeTrackingEnabled =
              updatedQlSettingsData.mobileTimeTrackingEnabled?.value;

            field.value = !isMobileTimeTrackingEnabled
              ? intl.formatMessage({ id: 'off' })
              : intl.formatMessage({ id: 'on' });
            setFormFieldValue(
              TIME_TRACKING_SETTINGS.MOBILE_TIME_TRACKING_ENABLED,
              isMobileTimeTrackingEnabled ?? false,
            );
          }
          break;

        case TIME_TRACKING_SETTINGS.SIGNATURE_CAPTURE_ENABLED:
          {
            const isSignatureCaptureEnabled =
              updatedQlSettingsData.signatureCaptureEnabled?.value;

            field.value = !isSignatureCaptureEnabled
              ? intl.formatMessage({ id: 'off' })
              : intl.formatMessage({ id: 'on' });
            setFormFieldValue(
              TIME_TRACKING_SETTINGS.SIGNATURE_CAPTURE_ENABLED,
              isSignatureCaptureEnabled ?? false,
            );
          }
          break;

        case TIME_TRACKING_SETTINGS.EDIT_CLOCK_OUT_TIME_ENABLED:
          {
            const allowTeamMemberToEditClockOutTime =
              updatedQlSettingsData.editClockOutTimeEnabled?.value;

            const clockOutOverrideHours =
              updatedQlSettingsData.clockOutOverrideHours?.value;

            if (
              notificationFields['time-entries.section.title.notifications']
            ) {
              const fieldVisibilityValue =
                updatedQlSettingsData?.editClockOutTimeEnabled?.value &&
                updatedQlSettingsData.editClockOutTimeEnabled?.value;

              const notifyWhenClockInOutField = notificationFields[
                'time-entries.section.title.notifications'
              ].find((field) => field.key === 'notifyWhenClockInOutUpdated');

              if (notifyWhenClockInOutField) {
                notifyWhenClockInOutField.isVisible =
                  fieldVisibilityValue ?? false;

                isFieldsVisible.notifyWhenClockInOutTimeAdjusted =
                  fieldVisibilityValue ?? false;

                setNotificationFields({ ...notificationFields });
                updateVisibleFields({ ...isFieldsVisible });
              }
            }

            field.value = allowTeamMemberToEditClockOutTime
              ? `${intl.formatMessage({ id: 'on' })}, ${intl.formatMessage({
                  id: 'after',
                })} ${clockOutOverrideHours} ${intl.formatMessage({
                  id: 'hours',
                })}`
              : intl.formatMessage({ id: 'off' });
            setFormFieldValue(
              TIME_TRACKING_SETTINGS.EDIT_CLOCK_OUT_TIME_ENABLED,
              allowTeamMemberToEditClockOutTime ?? false,
            );
            setFormFieldValue(
              TIME_TRACKING_SETTINGS.CLOCK_OUT_OVERRIDE_HOURS,
              clockOutOverrideHours ?? 8,
            );
          }
          break;

        case TIME_TRACKING_SETTINGS.ROUND_CLOCK_IN_TIME:
          {
            const roundClockInTimeDirection =
              updatedQlSettingsData.clockInRoundDirection?.value;

            const roundClockInTimeDuration =
              updatedQlSettingsData.clockInRoundInMin?.value;

            field.value = `${uppercaseToPascalcase(
              roundClockInTimeDirection ?? '',
            )}, ${roundClockInTimeDuration} ${intl.formatMessage({
              id: 'minute',
            })}`;
            setFormFieldValue(
              CLOCK_ROUNDING_SETTINGS.CLOCK_IN_ROUND_DIRECTION,
              roundClockInTimeDirection ?? '',
            );
            setFormFieldValue(
              CLOCK_ROUNDING_SETTINGS.CLOCK_IN_ROUND_IN_MINUTE,
              roundClockInTimeDuration ?? 1,
            );
          }
          break;

        case TIME_TRACKING_SETTINGS.ROUND_CLOCK_OUT_TIME:
          {
            const roundClockOutTimeDirection =
              updatedQlSettingsData.clockOutRoundDirection?.value;

            const roundClockOutTimeDuration =
              updatedQlSettingsData.clockOutRoundInMin?.value;

            field.value = `${uppercaseToPascalcase(
              roundClockOutTimeDirection ?? '',
            )}, ${roundClockOutTimeDuration} ${intl.formatMessage({
              id: 'minute',
            })}`;
            setFormFieldValue(
              CLOCK_ROUNDING_SETTINGS.CLOCK_OUT_ROUND_DIRECTION,
              roundClockOutTimeDirection ?? '',
            );
            setFormFieldValue(
              CLOCK_ROUNDING_SETTINGS.CLOCK_OUT_ROUND_IN_MINUTE,
              roundClockOutTimeDuration ?? 1,
            );
          }
          break;

        default:
          break;
      }
    });
  });

  return timeTrackingFields;
};

export const updateTimeSheetFields = ({
  editTimeSheetFields,
  updatedQlSettingsData,
  setFormFieldValue,
  notificationFields,
  isFieldsVisible,
  setNotificationFields,
  updateVisibleFields,
}: {
  editTimeSheetFields: ITimeSheetFieldOption[];
  updatedQlSettingsData: MappedQLSettings;
  setFormFieldValue: (
    fieldName: keyof ITimeEntrySettingsFormState,
    fieldValue: string | boolean | number | string[],
  ) => void;
  notificationFields: IFormConfig;
  isFieldsVisible: IIsFieldsVisible;
  setNotificationFields: (notificationFields: IFormConfig) => void;
  updateVisibleFields: (visibleFields: IIsFieldsVisible) => void;
}) => {
  const fieldKeys: string[] = [];

  editTimeSheetFields.forEach((timeSheetFields) => {
    fieldKeys.push(timeSheetFields.key);
    if (timeSheetFields.subFields && timeSheetFields.subFields.length > 0) {
      timeSheetFields.subFields.forEach((subField) =>
        fieldKeys.push(subField.key),
      );
    }
  });

  fieldKeys.forEach((timesheetField) => {
    switch (timesheetField) {
      case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CUSTOMER_FOR_TIMESHEET_ENABLED:
        {
          const isCustomerForTimeSheet =
            updatedQlSettingsData.customersForTimeSheetEnabled?.value ?? false;

          updateTimeSheetField(
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CUSTOMER_FOR_TIMESHEET_ENABLED,
            isCustomerForTimeSheet,
            editTimeSheetFields,
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CUSTOMER_FOR_TIMESHEET_ENABLED,
          );
          setFormFieldValue(
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CUSTOMER_FOR_TIMESHEET_ENABLED,
            isCustomerForTimeSheet,
          );
        }
        break;

      case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED:
        {
          const isBillingFieldEnable =
            updatedQlSettingsData.isBillingFieldEnabled?.value ?? false;

          updateTimeSheetField(
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
            isBillingFieldEnable,
            editTimeSheetFields,
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
          );
          setFormFieldValue(
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
            isBillingFieldEnable,
          );
        }
        break;

      case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.BILLING_RATE_FOR_TIME_ENABLED:
        {
          const isBillingRateForTimeEnables =
            updatedQlSettingsData.billingRateForTimeEnabled?.value ?? false;
          updateTimeSheetField(
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
            isBillingRateForTimeEnables,
            editTimeSheetFields,
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.BILLING_RATE_FOR_TIME_ENABLED,
          );
          setFormFieldValue(
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.BILLING_RATE_FOR_TIME_ENABLED,
            isBillingRateForTimeEnables,
          );
        }
        break;
      case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_BILLABLE:
        {
          const isRequireBillable =
            updatedQlSettingsData.requireBillable?.value ?? false;

          updateTimeSheetField(
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
            isRequireBillable,
            editTimeSheetFields,
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_BILLABLE,
          );
          setFormFieldValue(
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_BILLABLE,
            isRequireBillable,
          );
        }
        break;
      case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_SERVICE_ENABLE:
        {
          const isServiceFieldEnabled =
            updatedQlSettingsData.useItemForTime?.value ?? false;

          updateTimeSheetField(
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_SERVICE_ENABLE,
            isServiceFieldEnabled,
            editTimeSheetFields,
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_SERVICE_ENABLE,
          );
          setFormFieldValue(
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_SERVICE_ENABLE,
            isServiceFieldEnabled,
          );
        }
        break;
      case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES:
        {
          const isClassForTimeSheetEnabled =
            updatedQlSettingsData.classForTimeSheetEnabled?.value ?? false;

          updateTimeSheetField(
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
            isClassForTimeSheetEnabled,
            editTimeSheetFields,
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
          );
          setFormFieldValue(
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
            isClassForTimeSheetEnabled,
          );
        }
        break;
      case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.LOCATION_FOR_TIMESHEET_ENABLED:
        {
          const isLocationForTimeSheetEnabled =
            updatedQlSettingsData.locationForTimeSheetEnabled?.value ?? false;

          updateTimeSheetField(
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.LOCATION_FOR_TIMESHEET_ENABLED,
            isLocationForTimeSheetEnabled,
            editTimeSheetFields,
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.LOCATION_FOR_TIMESHEET_ENABLED,
          );
          setFormFieldValue(
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.LOCATION_FOR_TIMESHEET_ENABLED,
            isLocationForTimeSheetEnabled,
          );
        }
        break;
      case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_NOTES_ENABLE:
        {
          const isTimeSheetEntryNotesEnabled =
            updatedQlSettingsData.timeSheetEntryNotesEnabled?.value ?? false;

          if (notificationFields['time-entries.section.title.notifications']) {
            const fieldVisibilityValue = isTimeSheetEntryNotesEnabled;
            const notifyWhenNotesAreAddedOrEdited = notificationFields[
              'time-entries.section.title.notifications'
            ].find((field) => field.key === 'notifyWhenNotesAreAddedOrEdited');
            if (notifyWhenNotesAreAddedOrEdited) {
              notifyWhenNotesAreAddedOrEdited.isVisible = fieldVisibilityValue;
              isFieldsVisible.notifyWhenNotesAreAddedOrEdited =
                fieldVisibilityValue;
              setNotificationFields({ ...notificationFields });
              updateVisibleFields({ ...isFieldsVisible });
            }
          }
          updateTimeSheetField(
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_NOTES_ENABLE,
            isTimeSheetEntryNotesEnabled,
            editTimeSheetFields,
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_NOTES_ENABLE,
          );
          setFormFieldValue(
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_NOTES_ENABLE,
            isTimeSheetEntryNotesEnabled,
          );
        }
        break;
      case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_EDITS_NOTES_ENABLED:
        {
          const isTimeSheetEntryEditNotesEnabled =
            updatedQlSettingsData.timeSheetEntryEditNotesEnabled?.value ??
            false;

          updateTimeSheetField(
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_NOTES_ENABLE,
            isTimeSheetEntryEditNotesEnabled,
            editTimeSheetFields,
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_EDITS_NOTES_ENABLED,
          );
          setFormFieldValue(
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_EDITS_NOTES_ENABLED,
            isTimeSheetEntryEditNotesEnabled,
          );
        }
        break;
      case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_ENTRY_MAKES_NOTES_REQUIRES_ENABLES:
        {
          const isTimeSheetEntryMakesNotesRequiredEnabled =
            updatedQlSettingsData.timeSheetEntryMakesNotesRequiredEnabled
              ?.value ?? false;

          updateTimeSheetField(
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_NOTES_ENABLE,
            isTimeSheetEntryMakesNotesRequiredEnabled,
            editTimeSheetFields,
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_ENTRY_MAKES_NOTES_REQUIRES_ENABLES,
          );
          setFormFieldValue(
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_ENTRY_MAKES_NOTES_REQUIRES_ENABLES,
            isTimeSheetEntryMakesNotesRequiredEnabled,
          );
        }
        break;
      case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_CLASS:
        {
          const isRequireClass =
            updatedQlSettingsData.classRequired?.value ?? false;

          updateTimeSheetField(
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_CLASS,
            isRequireClass,
            editTimeSheetFields,
          );
          setFormFieldValue(
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_CLASS,
            isRequireClass,
          );
        }
        break;
      case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_LOCATION:
        {
          const isRequireLocation =
            updatedQlSettingsData.locationRequired?.value ?? false;

          updateTimeSheetField(
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_LOCATION,
            isRequireLocation,
            editTimeSheetFields,
          );
          setFormFieldValue(
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_LOCATION,
            isRequireLocation,
          );
        }
        break;
      case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_SERVICE_ITEM:
        {
          const isRequireServiceItem =
            updatedQlSettingsData.serviceItemRequired?.value ?? false;

          updateTimeSheetField(
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_SERVICE_ITEM,
            isRequireServiceItem,
            editTimeSheetFields,
          );
          setFormFieldValue(
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_SERVICE_ITEM,
            isRequireServiceItem,
          );
        }
        break;
      default:
        break;
    }
  });
  return editTimeSheetFields;
};

export const updateNotificationFields = ({
  notificationFields,
  updatedQlSettingsData,
  intl,
  setFormFieldValue,
  isFieldsVisible,
  updateVisibleFields,
  isUKLocale,
}: {
  notificationFields: IFormConfig;
  updatedQlSettingsData: MappedQLSettings;
  intl: any;
  setFormFieldValue: (
    fieldName: keyof ITimeEntrySettingsFormState,
    fieldValue: string | boolean | number | string[],
  ) => void;
  isFieldsVisible: IIsFieldsVisible;
  updateVisibleFields: (visibleFields: IIsFieldsVisible) => void;
  isUKLocale: boolean;
}) => {
  Object.keys(notificationFields).forEach((key) => {
    const formField = notificationFields[key];

    const isSendClockInReminderEmail =
      updatedQlSettingsData.clockInNotificationReminderEmail?.value ?? false;
    const isSendClockInReminderMobile =
      updatedQlSettingsData.clockInNotificationReminderMobile?.value ?? false;
    const isSendClockOutReminderEmail =
      updatedQlSettingsData.clockOutNotificationReminderEmail?.value ?? false;
    const isSendClockOutReminderMobile =
      updatedQlSettingsData.clockOutNotificationReminderMobile?.value ?? false;

    // Schedule channel arrays from the saved subscriptions, used to repaint the
    // Schedule rows and re-sync their RHF fields after a successful save.
    const scheduleChannels = mapSubscriptionsToScheduleChannels(
      updatedQlSettingsData.scheduleNotificationSubscriptions,
    );

    formField.forEach((field) => {
      switch (field.key) {
        case NotificationFieldKey.SEND_CLOCK_IN_NOTIFICATION_REMINDERS:
          {
            const clockInNotificationReminderTime =
              updatedQlSettingsData.clockInNotificationReminderTime?.value ??
              '';

            const sendClockInReminders =
              isSendClockInReminderEmail || isSendClockInReminderMobile;

            const formattedClockInTime = formatTimeTo12Hour(
              clockInNotificationReminderTime,
              isUKLocale,
            );

            field.value = sendClockInReminders
              ? `${intl.formatMessage({ id: 'on' })}${
                  isSendClockInReminderEmail
                    ? `, ${intl.formatMessage({ id: 'email' })}`
                    : ''
                }${
                  isSendClockInReminderMobile
                    ? `, ${intl.formatMessage({ id: 'mobile' })}`
                    : ''
                }, ${formattedClockInTime}`
              : intl.formatMessage({ id: 'off' });
            setFormFieldValue(
              NotificationField.CLOCK_IN_TIME,
              formattedClockInTime,
            );
            setFormFieldValue(
              NotificationField.CLOCK_IN_EMAIL,
              isSendClockInReminderEmail,
            );
            setFormFieldValue(
              NotificationField.CLOCK_IN_MOBILE,
              isSendClockInReminderMobile,
            );
          }
          break;

        case NotificationFieldKey.SEND_CLOCK_OUT_NOTIFICATION_REMINDERS:
          {
            const clockOutNotificationReminderTime =
              updatedQlSettingsData.clockOutNotificationReminderTime?.value ??
              '';

            const sendClockInReminders =
              isSendClockOutReminderEmail || isSendClockOutReminderMobile;

            const formattedClockOutTime = formatTimeTo12Hour(
              clockOutNotificationReminderTime,
              isUKLocale,
            );

            field.value = sendClockInReminders
              ? `${intl.formatMessage({ id: 'on' })}${
                  isSendClockOutReminderEmail
                    ? `, ${intl.formatMessage({ id: 'email' })}`
                    : ''
                }${
                  isSendClockOutReminderMobile
                    ? `, ${intl.formatMessage({ id: 'mobile' })}`
                    : ''
                }, ${formattedClockOutTime}`
              : intl.formatMessage({ id: 'off' });
            setFormFieldValue(
              NotificationField.CLOCK_OUT_TIME,
              formattedClockOutTime,
            );
            setFormFieldValue(
              NotificationField.CLOCK_OUT_EMAIL,
              isSendClockOutReminderEmail,
            );
            setFormFieldValue(
              NotificationField.CLOCK_OUT_MOBILE,
              isSendClockOutReminderMobile,
            );
          }
          break;

        // Repaint the row in view mode + re-sync the RHF radio and channel field
        // from the mutation result.
        case NotificationFieldKey.SCHEDULE_SHIFT_PUBLISHED_SEND_MODE:
          {
            const shiftChangeSendMode = mapShiftChangePreferenceToSendMode(
              updatedQlSettingsData.publishShiftChangePreference?.value,
            );
            field.value = shiftChangeSendMode
              ? formatScheduleNotificationSummaryValue(
                  intl,
                  shiftChangeSendMode,
                  hasMobileChannel(scheduleChannels.scheduleShiftPublished),
                  hasEmailChannel(scheduleChannels.scheduleShiftPublished),
                )
              : '';
            if (shiftChangeSendMode) {
              setFormFieldValue(
                NotificationFieldKey.SCHEDULE_SHIFT_PUBLISHED_SEND_MODE,
                shiftChangeSendMode,
              );
            }
            setFormFieldValue(
              NotificationFieldKey.SCHEDULE_SHIFT_PUBLISHED_CHANNELS,
              scheduleChannels.scheduleShiftPublished,
            );
          }
          break;

        case NotificationFieldKey.SCHEDULE_ONE_HOUR_BEFORE_SHIFT:
          field.value = formatChannelsFor(
            intl,
            scheduleChannels,
            NotificationFieldKey.SCHEDULE_ONE_HOUR_CHANNELS,
          );
          setFormFieldValue(
            NotificationFieldKey.SCHEDULE_ONE_HOUR_CHANNELS,
            scheduleChannels.scheduleOneHour,
          );
          break;

        case NotificationFieldKey.SCHEDULE_FORGOT_CLOCK_IN_AFTER_SHIFT_STARTED:
          field.value = formatChannelsFor(
            intl,
            scheduleChannels,
            NotificationFieldKey.SCHEDULE_FORGOT_CLOCK_IN_AFTER_STARTED_CHANNELS,
          );
          setFormFieldValue(
            NotificationFieldKey.SCHEDULE_FORGOT_CLOCK_IN_AFTER_STARTED_CHANNELS,
            scheduleChannels.scheduleForgotClockInAfterStarted,
          );
          break;

        case NotificationFieldKey.SCHEDULE_FORGOT_CLOCK_IN_AFTER_SHIFT_ENDED:
          field.value = formatChannelsFor(
            intl,
            scheduleChannels,
            NotificationFieldKey.SCHEDULE_FORGOT_CLOCK_IN_AFTER_ENDED_CHANNELS,
          );
          setFormFieldValue(
            NotificationFieldKey.SCHEDULE_FORGOT_CLOCK_IN_AFTER_ENDED_CHANNELS,
            scheduleChannels.scheduleForgotClockInAfterEnded,
          );
          break;

        case NotificationFieldKey.SCHEDULE_LATE_CLOCK_IN_NOTIFY_MANAGER:
          field.value = formatChannelsFor(
            intl,
            scheduleChannels,
            NotificationFieldKey.SCHEDULE_LATE_CLOCK_IN_NOTIFY_MANAGER_CHANNELS,
          );
          setFormFieldValue(
            NotificationFieldKey.SCHEDULE_LATE_CLOCK_IN_NOTIFY_MANAGER_CHANNELS,
            scheduleChannels.scheduleLateClockInNotifyManagerChannels,
          );
          break;

        case NotificationFieldKey.NOTIFICATION_ENABLED_FOR_DAYS:
          {
            const notificationEnabledDays =
              updatedQlSettingsData.notificationEnabledForDays?.value ?? [];

            field.value =
              isSendClockInReminderEmail ||
              isSendClockInReminderMobile ||
              isSendClockOutReminderEmail ||
              isSendClockOutReminderMobile
                ? notificationEnabledDays
                    .map((day) => uppercaseToPascalcase(day))
                    .join(', ')
                : intl.formatMessage({ id: 'off' });

            setFormFieldValue(
              NotificationFieldKey.NOTIFICATION_ENABLED_FOR_DAYS,
              notificationEnabledDays ?? [],
            );
          }
          break;

        case NotificationFieldKey.NOTIFY_WHEN_CLOCK_IN_OUT_UPDATED:
          {
            const notifyToAdmin =
              updatedQlSettingsData.notifyAdminOnClockOutOverrideEnabled
                ?.value ?? false;
            const notifyToManager =
              updatedQlSettingsData.notifyManagerOnClockOutOverrideEnabled
                ?.value ?? false;

            const fieldVisibilityValue =
              updatedQlSettingsData?.editClockOutTimeEnabled?.value &&
              updatedQlSettingsData.editClockOutTimeEnabled.value;

            field.isVisible = fieldVisibilityValue;
            isFieldsVisible.notifyWhenClockInOutTimeAdjusted =
              fieldVisibilityValue ?? false;

            field.value =
              // eslint-disable-next-line no-nested-ternary
              notifyToAdmin && notifyToManager
                ? `${intl.formatMessage({
                    id: NotificationRecipient.ADMINS_AND_MANAGERS,
                  })}`
                : // eslint-disable-next-line no-nested-ternary
                notifyToAdmin
                ? `${intl.formatMessage({
                    id: NotificationRecipient.ADMINS_ONLY,
                  })}`
                : notifyToManager
                ? `${intl.formatMessage({
                    id: NotificationRecipient.MANAGERS_ONLY,
                  })}`
                : `${intl.formatMessage({ id: NotificationRecipient.NONE })}`;

            setFormFieldValue(
              NotificationFieldKey.NOTIFY_WHEN_CLOCK_IN_OUT_UPDATED,
              // eslint-disable-next-line no-nested-ternary
              notifyToAdmin && notifyToManager
                ? NotificationRecipient.ADMINS_AND_MANAGERS
                : // eslint-disable-next-line no-nested-ternary
                notifyToAdmin
                ? NotificationRecipient.ADMINS_ONLY
                : notifyToManager
                ? NotificationRecipient.MANAGERS_ONLY
                : NotificationRecipient.NONE,
            );
          }
          break;

        case NotificationFieldKey.NOTIFY_WHEN_NOTES_ARE_ADDED_OR_EDITED:
          {
            const notifyToAdmin =
              updatedQlSettingsData.notifyAdminOnTimeSheetNotesEditEnabled
                ?.value ?? false;
            const notifyToManager =
              updatedQlSettingsData
                .notifyGroupManagerOnTimeSheetNotesEditEnabled?.value ?? false;

            const fieldVisibilityValue = !!(
              updatedQlSettingsData?.timeSheetEntryNotesEnabled &&
              updatedQlSettingsData.timeSheetEntryNotesEnabled?.value
            );

            field.isVisible = fieldVisibilityValue;
            isFieldsVisible.notifyWhenNotesAreAddedOrEdited =
              fieldVisibilityValue;

            field.value =
              // eslint-disable-next-line no-nested-ternary
              notifyToAdmin && notifyToManager
                ? `${intl.formatMessage({
                    id: NotificationRecipient.ADMINS_AND_MANAGERS,
                  })}`
                : // eslint-disable-next-line no-nested-ternary
                notifyToAdmin
                ? `${intl.formatMessage({
                    id: NotificationRecipient.ADMINS_ONLY,
                  })}`
                : notifyToManager
                ? `${intl.formatMessage({
                    id: NotificationRecipient.MANAGERS_ONLY,
                  })}`
                : `${intl.formatMessage({ id: NotificationRecipient.NONE })}`;
            setFormFieldValue(
              NotificationFieldKey.NOTIFY_WHEN_NOTES_ARE_ADDED_OR_EDITED,
              // eslint-disable-next-line no-nested-ternary
              notifyToAdmin && notifyToManager
                ? NotificationRecipient.ADMINS_AND_MANAGERS
                : // eslint-disable-next-line no-nested-ternary
                notifyToAdmin
                ? NotificationRecipient.ADMINS_ONLY
                : notifyToManager
                ? NotificationRecipient.MANAGERS_ONLY
                : NotificationRecipient.NONE,
            );
          }
          break;

        case NotificationFieldKey.GEOFENCE_REMINDER_SETTINGS:
          {
            const geofenceReminderStartTime =
              updatedQlSettingsData.geofenceReminderStartTime?.value ?? '';
            const geofenceReminderEndTime =
              updatedQlSettingsData.geofenceReminderEndTime?.value ?? '';
            const geofenceReminderDaysOfWeek =
              updatedQlSettingsData.geofenceReminderDaysOfWeek?.value ?? [];

            const formattedStartTime = formatTimeTo12Hour(
              geofenceReminderStartTime,
              isUKLocale,
            );
            const formattedEndTime = formatTimeTo12Hour(
              geofenceReminderEndTime,
              isUKLocale,
            );

            const formattedDays = geofenceReminderDaysOfWeek
              .map((day) => uppercaseToPascalcase(day))
              .join(', ');

            field.value = `${formattedStartTime} - ${formattedEndTime}, ${formattedDays}`;

            setFormFieldValue('geofenceReminderStartTime', formattedStartTime);
            setFormFieldValue('geofenceReminderEndTime', formattedEndTime);
            setFormFieldValue(
              'geofenceReminderDaysOfWeek',
              geofenceReminderDaysOfWeek,
            );
          }
          break;

        default:
          break;
      }
    });
  });

  updateVisibleFields({ ...isFieldsVisible });

  return notificationFields;
};

export const updateTimeSheetFieldTitle = (
  fieldKey: string,
  fieldTitle: string,
  editTimeSheetFields: ITimeSheetFieldOption[],
) => {
  const field = editTimeSheetFields.find(
    (timeSheetField) => timeSheetField.key === fieldKey,
  );

  if (field) {
    field.title = fieldTitle;
  }

  return editTimeSheetFields;
};
