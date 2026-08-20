import dayjs from 'dayjs';
import {
  NotificationFieldKey,
  NotificationMedium,
  NotificationRecipient,
  ScheduleNotificationSendMode,
  TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS,
  TIME_TRACKING_SETTINGS,
} from 'src/js/widgets/timeTrackingSettings/constants';
import {
  createClockRoundingSettings,
  createCustomDimensionsMutationPayload,
  createDateTimeSettings,
  createGeofenceReminderSettings,
  createMutationPayload,
  createNotificationMediumData,
  createNotificationSettings,
  createObjectIfHasValues,
  createScheduleNotificationsInput,
  createTimesheetManagementSettings,
  isNotificationRecipientEnabled,
} from 'src/js/widgets/timeTrackingSettings/hooks/mutationHelper';
import { DIMENSIONS_FORM_NAME } from 'src/js/widgets/common/dimensions/types';
import { ITimeEntrySettingsFormState } from 'src/js/widgets/timeTrackingSettings/types';
import { MappedQLSettings } from 'src/js/service/hooks/settings/useGetQLSettings';
import {
  TimeTracking_NotificationReminderMedium,
  TimeTracking_NotificationType,
} from 'src/__generated__/timeTracking/graphql';

const baseFormState: ITimeEntrySettingsFormState = {
  geofenceReminderStartTime: '08:00',
  geofenceReminderEndTime: '17:00',
  geofenceReminderDaysOfWeek: ['MONDAY', 'TUESDAY'],
  firstDayOfWeek: '1',
  timeZone: 'UTC',
  timeFormat: '24',
  clockInNotificationReminderTime: '09:00 AM',
  clockInNotificationReminderEmail: true,
  clockInNotificationReminderMobile: true,
  clockOutNotificationReminderTime: '05:00 PM',
  clockOutNotificationReminderEmail: true,
  clockOutNotificationReminderMobile: true,
  notificationEnabledForDays: ['MONDAY', 'TUESDAY'],
  notifyWhenClockInOutUpdated: NotificationRecipient.ADMINS_AND_MANAGERS,
  notifyWhenNotesAreAddedOrEdited: NotificationRecipient.ADMINS_AND_MANAGERS,
  shiftPublishedSendMode: ScheduleNotificationSendMode.ALWAYS_SEND,
  scheduleShiftPublished: [
    TimeTracking_NotificationReminderMedium.Email,
    TimeTracking_NotificationReminderMedium.PushNotification,
  ],
  scheduleOneHour: [TimeTracking_NotificationReminderMedium.Email],
  scheduleForgotClockInAfterStarted: [
    TimeTracking_NotificationReminderMedium.Email,
  ],
  scheduleForgotClockInAfterEnded: [
    TimeTracking_NotificationReminderMedium.PushNotification,
  ],
  scheduleLateClockInNotifyManagerChannels: [],
  timeSheetEntryNotesEnabled: true,
  timeSheetEntryEditNotesEnabled: true,
  timeSheetEntryMakesNotesRequiredEnabled: true,
  manageOwnTimeSheetsEnabled: true,
  mobileTimeTrackingEnabled: false,
  signatureCaptureEnabled: false,
  editClockOutTimeEnabled: true,
  clockOutOverrideHours: '2',
  splitTimeSheetAtMidnightEnabled: true,
  customersForTimeSheetEnabled: true,
  classForTimeSheetEnabled: true,
  locationForTimeSheetEnabled: true,
  clockInRoundDirection: 'UP',
  clockInRoundInMin: 15,
  clockOutRoundDirection: 'DOWN',
  clockOutRoundInMin: 15,
  isBillingFieldEnabled: true,
  billingRateForTimeEnabled: true,
  requireBillable: true,
  isServiceFieldEnabled: true,
  classRequired: false,
  locationRequired: false,
  serviceItemRequired: false,
  requireApprovalForTrackedTime: false,
  requireTeamMembersSubmitTime: false,
  enablePartialWeekSubmission: false,
  customMessage: '',
  managerReminderBasedOn: 'DAY_OF_WEEK',
  managerCurrentWeekReminderDays: ['MONDAY', 'TUESDAY'],
  managerCurrentWeekReminderHour: '9',
  managerCurrentWeekReminderMedium: [NotificationMedium.EMAIL],
  managerPreviousWeekReminderDays: ['MONDAY', 'TUESDAY'],
  managerPreviousWeekReminderHour: '9',
  managerPreviousWeekReminderMedium: [NotificationMedium.EMAIL],
  managerCurrentPayPeriodReminderHour: '9',
  managerCurrentPayPeriodReminderOffsetDays: 1,
  managerCurrentPayPeriodReminderMedium: [NotificationMedium.EMAIL],
  managerPreviousPayPeriodReminderHour: '9',
  managerPreviousPayPeriodReminderOffsetDays: 1,
  managerPreviousPayPeriodReminderMedium: [NotificationMedium.EMAIL],
  employeeReminderBasedOn: 'DAY_OF_WEEK',
  employeeCurrentWeekReminderDays: ['MONDAY', 'TUESDAY'],
  employeeCurrentWeekReminderHour: '9',
  employeeCurrentWeekReminderMedium: [NotificationMedium.EMAIL],
  employeePreviousWeekReminderDays: ['MONDAY', 'TUESDAY'],
  employeePreviousWeekReminderHour: '9',
  employeePreviousWeekReminderMedium: [NotificationMedium.EMAIL],
  employeeCurrentPayPeriodReminderHour: '9',
  employeeCurrentPayPeriodReminderOffsetDays: 1,
  employeeCurrentPayPeriodReminderMedium: [NotificationMedium.EMAIL],
  employeePreviousPayPeriodReminderHour: '9',
  employeePreviousPayPeriodReminderOffsetDays: 1,
  employeePreviousPayPeriodReminderMedium: [NotificationMedium.EMAIL],
  employeeDailyReminderFirstReminderHour: '9',
  employeeDailyReminderFirstReminderMedium: [NotificationMedium.EMAIL],
  employeeDailyReminderSecondReminderHour: '9',
  employeeDailyReminderSecondReminderMedium: [NotificationMedium.EMAIL],
  employeeDailyReminderForTimesheetDays: ['MONDAY', 'TUESDAY'],
  notifyManagerOnSubmit: true,
  notifyManagerOnGroupSubmitted: true,
};

const baseSettings: MappedQLSettings = {
  timeTrackingSupported: { version: 'v1', value: true },
  transactionBillingForTimeEnabled: { version: 'v1', value: true },
  transactionTimeTrackingEnabled: { version: 'v1', value: true },
  firstDayOfWeek: { version: 'v1', value: 1 },
  timeZone: { version: 'v1', value: 'UTC' },
  timeFormat: { version: 'v2', value: 24 },
  timeSheetEntryNotesEnabled: { version: 'v1', value: true },
  timeSheetEntryEditNotesEnabled: { version: 'v2', value: true },
  timeSheetEntryMakesNotesRequiredEnabled: { version: 'v3', value: true },
  manageOwnTimeSheetsEnabled: { version: 'v4', value: true },
  mobileTimeTrackingEnabled: { version: 'v11', value: false },
  signatureCaptureEnabled: { version: 'v12', value: false },
  editClockOutTimeEnabled: { version: 'v5', value: true },
  clockOutOverrideHours: { version: 'v6', value: 2 },
  splitTimeSheetAtMidnightEnabled: { version: 'v7', value: true },
  customersForTimeSheetEnabled: { version: 'v8', value: true },
  classForTimeSheetEnabled: { version: 'v9', value: true },
  locationForTimeSheetEnabled: { version: 'v10', value: true },
  clockInRoundDirection: { version: 'v1', value: 'UP' },
  clockInRoundInMin: { version: 'v2', value: 15 },
  clockOutRoundDirection: { version: 'v3', value: 'DOWN' },
  clockOutRoundInMin: { version: 'v4', value: 15 },
  clockInNotificationReminderTime: { version: 'v1', value: '09:00' },
  clockOutNotificationReminderTime: { version: 'v2', value: '17:00' },
  clockInNotificationReminderEmail: { version: 'v3', value: true },
  clockOutNotificationReminderEmail: { version: 'v4', value: true },
  notificationEnabledForDays: { version: 'v5', value: ['MONDAY', 'TUESDAY'] },
  notifyAdminOnClockOutOverrideEnabled: { version: 'v6', value: true },
  notifyManagerOnClockOutOverrideEnabled: { version: 'v7', value: true },
  notifyAdminOnTimeSheetNotesEditEnabled: { version: 'v8', value: true },
  notifyGroupManagerOnTimeSheetNotesEditEnabled: { version: 'v9', value: true },
  isBillingFieldEnabled: { version: 'v1', value: true },
  billingRateForTimeEnabled: { version: 'v1', value: true },
  requireBillable: { version: 'v1', value: true },
  isServiceFieldEnabled: { version: 'v1', value: true },
  useItemForTime: { version: 'v1', value: true },
  scheduleManagePreference: { version: 'v1', value: 'company' },
  scheduleViewPreference: { version: 'v1', value: 'company' },
  publishShiftChangePreference: { version: 'sched-v1', value: 'ALWAYS' },
  scheduleNotificationSubscriptions: [
    {
      notificationType: TimeTracking_NotificationType.ShiftPublished,
      distributionMethods: [TimeTracking_NotificationReminderMedium.Email],
      meta: { version: 'sub-pub-5' },
    },
    {
      notificationType: TimeTracking_NotificationType.ShiftStartBefore,
      distributionMethods: [TimeTracking_NotificationReminderMedium.Email],
      meta: { version: 'sub-before-5' },
    },
  ] as MappedQLSettings['scheduleNotificationSubscriptions'],
};

describe('mutationHelper', () => {
  describe('isNotificationRecipientEnabled', () => {
    it('should return true when recipient type is included', () => {
      const result = isNotificationRecipientEnabled(
        NotificationRecipient.ADMINS_ONLY,
        [
          NotificationRecipient.ADMINS_ONLY,
          NotificationRecipient.MANAGERS_ONLY,
        ],
      );
      expect(result).toBe(true);
    });
  });

  describe('createMutationPayload', () => {
    it('should create mutation payload when isUpdated is true', () => {
      const result = createMutationPayload(true, 'v1', 'test-value');
      expect(result).toEqual({ version: 'v1', value: 'test-value' });
    });

    it('should return undefined when isUpdated is false', () => {
      const result = createMutationPayload(false, 'v1', 'test-value');
      expect(result).toBeUndefined();
    });
  });

  describe('createNotificationMediumData', () => {
    it('should return both mediums when both are enabled', () => {
      const result = createNotificationMediumData(true, true);
      expect(result).toEqual([
        NotificationMedium.EMAIL,
        NotificationMedium.PUSH_NOTIFICATION,
      ]);
    });

    it('should return only email when email is enabled', () => {
      const result = createNotificationMediumData(true, false);
      expect(result).toEqual([NotificationMedium.EMAIL]);
    });

    it('should return only push notification when mobile is enabled', () => {
      const result = createNotificationMediumData(false, true);
      expect(result).toEqual([NotificationMedium.PUSH_NOTIFICATION]);
    });
  });

  describe('createObjectIfHasValues', () => {
    it('should return object with defined values', () => {
      const result = createObjectIfHasValues({
        key1: 'value1',
        key2: undefined,
        key3: 'value3',
      });
      expect(result).toEqual({
        key1: 'value1',
        key3: 'value3',
      });
    });

    it('should return undefined when all values are undefined', () => {
      const result = createObjectIfHasValues({
        key1: undefined,
        key2: undefined,
      });
      expect(result).toBeUndefined();
    });
  });

  describe('createDateTimeSettings', () => {
    it('should create date time settings when fields are updated', () => {
      const updatedFields = ['timeZone', 'timeFormat'];

      const result = createDateTimeSettings(
        baseFormState,
        baseSettings,
        updatedFields,
      );
      expect(result).toEqual({
        timeZone: { version: 'v1', value: 'UTC' },
        clockFormat: { version: 'v2', value: 24 },
      });
    });
  });

  describe('createTimesheetManagementSettings', () => {
    it('should create timesheet management settings when fields are updated', () => {
      const updatedFields = [
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_NOTES_ENABLE,
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_EDITS_NOTES_ENABLED,
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_ENTRY_MAKES_NOTES_REQUIRES_ENABLES,
        TIME_TRACKING_SETTINGS.MANAGE_OWN_TIME_SHEETS_ENABLED,
        TIME_TRACKING_SETTINGS.EDIT_CLOCK_OUT_TIME_ENABLED,
        TIME_TRACKING_SETTINGS.CLOCK_OUT_OVERRIDE_HOURS,
        TIME_TRACKING_SETTINGS.SPLIT_TIME_SHEET_AT_MIDNIGET_ENABLED,
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CUSTOMER_FOR_TIMESHEET_ENABLED,
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.LOCATION_FOR_TIMESHEET_ENABLED,
      ];

      const result = createTimesheetManagementSettings(
        baseFormState,
        baseSettings,
        updatedFields,
      );
      if (result) {
        expect(result.notes).toBeDefined();
        expect(result.timesheet).toBeDefined();
        expect(result.customFields).toBeDefined();
      }
    });

    it('should include mobileTimeTrackingEnabled and signatureCaptureEnabled in timesheet when updated', () => {
      const updatedFields = [
        TIME_TRACKING_SETTINGS.MOBILE_TIME_TRACKING_ENABLED,
        TIME_TRACKING_SETTINGS.SIGNATURE_CAPTURE_ENABLED,
      ];

      const result = createTimesheetManagementSettings(
        baseFormState,
        baseSettings,
        updatedFields,
      );

      expect(result).toBeDefined();
      if (result) {
        expect(result.timesheet).toBeDefined();
        expect(result.timesheet?.mobileTimeTrackingEnabled).toEqual({
          version: 'v11',
          value: false,
        });
        expect(result.timesheet?.signatureCaptureEnabled).toEqual({
          version: 'v12',
          value: false,
        });
      }
    });

    it('should not include mobileTimeTrackingEnabled and signatureCaptureEnabled in timesheet when neither is in updatedFields', () => {
      const updatedFields = [
        TIME_TRACKING_SETTINGS.MANAGE_OWN_TIME_SHEETS_ENABLED,
      ];

      const result = createTimesheetManagementSettings(
        baseFormState,
        baseSettings,
        updatedFields,
      );

      expect(result).toBeDefined();
      if (result) {
        expect(result.timesheet).toBeDefined();
        expect(result.timesheet?.mobileTimeTrackingEnabled).toBeUndefined();
        expect(result.timesheet?.signatureCaptureEnabled).toBeUndefined();
      }
    });

    it('should include customDimensions when dimensions form map is dirty', () => {
      const formState: ITimeEntrySettingsFormState = {
        ...baseFormState,
        dimensionDefinitions: [
          { id: '1000000023', label: 'Department', active: true },
          { id: '1000000024', label: 'Project', active: true },
        ],
        customDimensions: [
          {
            dimensionDefinitionId: '1000000023',
            enabledForTimeTracking: { version: '5', value: true },
            required: { version: '3', value: false },
          },
        ],
        dimensions: {
          '1000000023': { enabled: true, required: true },
          '1000000024': { enabled: false, required: true },
        },
      };

      const result = createTimesheetManagementSettings(
        formState,
        baseSettings,
        [DIMENSIONS_FORM_NAME],
      );

      expect(result?.customFields?.customDimensions).toEqual([
        {
          dimensionDefinitionId: '1000000023',
          enabledForTimeTracking: { version: '5', value: true },
          required: { version: '3', value: true },
        },
        {
          dimensionDefinitionId: '1000000024',
          enabledForTimeTracking: { version: '0', value: false },
          required: { version: '0', value: true },
        },
      ]);
    });

    it('should omit customDimensions when dimensions form map is not dirty', () => {
      const formState: ITimeEntrySettingsFormState = {
        ...baseFormState,
        dimensionDefinitions: [
          { id: '1000000023', label: 'Department', active: true },
        ],
        dimensions: {
          '1000000023': { enabled: true, required: false },
        },
      };

      const result = createTimesheetManagementSettings(
        formState,
        baseSettings,
        [TIME_TRACKING_SETTINGS.MANAGE_OWN_TIME_SHEETS_ENABLED],
      );

      expect(result?.customFields?.customDimensions).toBeUndefined();
    });
  });

  describe('createCustomDimensionsMutationPayload', () => {
    const dimensionFormState: ITimeEntrySettingsFormState = {
      ...baseFormState,
      dimensionDefinitions: [
        { id: '1000000023', label: 'Department', active: true },
        { id: '1000000024', label: 'Project', active: true },
        { id: '1000000099', label: 'Inactive', active: false },
      ],
      customDimensions: [
        {
          dimensionDefinitionId: '1000000023',
          enabledForTimeTracking: { version: '5', value: true },
          required: { version: '3', value: false },
        },
      ],
      dimensions: {
        '1000000023': { enabled: true, required: true },
        '1000000024': { enabled: false, required: true },
      },
    };

    it('builds a payload for every active dimension from toggle state', () => {
      expect(createCustomDimensionsMutationPayload(dimensionFormState)).toEqual(
        [
          {
            dimensionDefinitionId: '1000000023',
            enabledForTimeTracking: { version: '5', value: true },
            required: { version: '3', value: true },
          },
          {
            dimensionDefinitionId: '1000000024',
            enabledForTimeTracking: { version: '0', value: false },
            required: { version: '0', value: true },
          },
        ],
      );
    });

    it('defaults missing toggles to disabled and not required', () => {
      const formState: ITimeEntrySettingsFormState = {
        ...baseFormState,
        dimensionDefinitions: [
          { id: '1000000099', label: 'New Dimension', active: true },
        ],
      };

      expect(createCustomDimensionsMutationPayload(formState)).toEqual([
        {
          dimensionDefinitionId: '1000000099',
          enabledForTimeTracking: { version: '0', value: false },
          required: { version: '0', value: false },
        },
      ]);
    });

    it('returns an empty array when no active dimension definitions exist', () => {
      const formState: ITimeEntrySettingsFormState = {
        ...baseFormState,
        dimensionDefinitions: [
          { id: '1000000099', label: 'Inactive', active: false },
        ],
      };

      expect(createCustomDimensionsMutationPayload(formState)).toEqual([]);
    });
  });

  describe('createClockRoundingSettings', () => {
    it('should create clock rounding settings when fields are updated', () => {
      const updatedFields = [
        'clockInRoundDirection',
        'clockInRoundInMinute',
        'clockOutRoundDirection',
        'clockOutRoundInMinute',
      ];

      const result = createClockRoundingSettings(
        baseFormState,
        baseSettings,
        updatedFields,
      );
      if (result) {
        expect(result.startTimeRounding).toBeDefined();
        expect(result.endTimeRounding).toBeDefined();
      }
    });
  });

  describe('createNotificationSettings', () => {
    it('should create notification settings when fields are updated', () => {
      const updatedFields = [
        'clockInNotificationReminderTime',
        'clockOutNotificationReminderTime',
        'clockInNotificationReminderEmail',
        'clockInNotificationReminderMobile',
        'clockOutNotificationReminderEmail',
        'clockOutNotificationReminderMobile',
        'notificationEnabledForDays',
        'notifyWhenClockInOutUpdated',
        'notifyWhenNotesAreAddedOrEdited',
      ];

      const result = createNotificationSettings(
        baseFormState,
        baseSettings,
        updatedFields,
      );
      expect(result).toBeDefined();
      if (result) {
        expect(result.startShiftNotifications).toBeDefined();
        expect(result.endShiftNotifications).toBeDefined();
        expect(result.notificationEnabledForDays).toBeDefined();
        expect(result.clockOutOverrideNotifications).toBeDefined();
        expect(result.timesheetEditNotifications).toBeDefined();
      }
    });

    it('should format dayjs clockIn time correctly for UK locale', () => {
      const dayjsTime = dayjs('2023-01-01 09:30:00');
      const formStateWithDayjs = {
        ...baseFormState,
        clockInNotificationReminderTime: dayjsTime as any,
      };

      const updatedFields = ['clockInNotificationReminderTime'];
      const result = createNotificationSettings(
        formStateWithDayjs,
        baseSettings,
        updatedFields,
        true, // isUKLocale = true
      );

      expect(result?.startShiftNotifications?.reminderTime).toEqual({
        version: 'v1',
        value: '09:30',
      });
    });

    it('should format dayjs clockIn time correctly for non-UK locale', () => {
      const dayjsTime = dayjs('2023-01-01 09:30:00');
      const formStateWithDayjs = {
        ...baseFormState,
        clockInNotificationReminderTime: dayjsTime as any,
      };

      const updatedFields = ['clockInNotificationReminderTime'];
      const result = createNotificationSettings(
        formStateWithDayjs,
        baseSettings,
        updatedFields,
        false, // isUKLocale = false
      );

      expect(result?.startShiftNotifications?.reminderTime).toEqual({
        version: 'v1',
        value: '09:30',
      });
    });

    it('should format dayjs clockOut time correctly for UK locale', () => {
      const dayjsTime = dayjs('2023-01-01 17:45:00');
      const formStateWithDayjs = {
        ...baseFormState,
        clockOutNotificationReminderTime: dayjsTime as any,
      };

      const updatedFields = ['clockOutNotificationReminderTime'];
      const result = createNotificationSettings(
        formStateWithDayjs,
        baseSettings,
        updatedFields,
        true, // isUKLocale = true
      );

      expect(result?.endShiftNotifications?.reminderTime).toEqual({
        version: 'v2',
        value: '17:45',
      });
    });

    it('should format dayjs clockOut time correctly for non-UK locale', () => {
      const dayjsTime = dayjs('2023-01-01 17:45:00');
      const formStateWithDayjs = {
        ...baseFormState,
        clockOutNotificationReminderTime: dayjsTime as any,
      };

      const updatedFields = ['clockOutNotificationReminderTime'];
      const result = createNotificationSettings(
        formStateWithDayjs,
        baseSettings,
        updatedFields,
        false, // isUKLocale = false
      );

      expect(result?.endShiftNotifications?.reminderTime).toEqual({
        version: 'v2',
        value: '17:45',
      });
    });

    it('should handle string clockIn time correctly when isUKLocale is undefined', () => {
      const updatedFields = ['clockInNotificationReminderTime'];
      const result = createNotificationSettings(
        baseFormState,
        baseSettings,
        updatedFields,
        undefined, // isUKLocale = undefined
      );

      expect(result?.startShiftNotifications?.reminderTime).toEqual({
        version: 'v1',
        value: '09:00',
      });
    });

    it('should handle string clockOut time correctly when isUKLocale is undefined', () => {
      const updatedFields = ['clockOutNotificationReminderTime'];
      const result = createNotificationSettings(
        baseFormState,
        baseSettings,
        updatedFields,
        undefined, // isUKLocale = undefined
      );

      expect(result?.endShiftNotifications?.reminderTime).toEqual({
        version: 'v2',
        value: '17:00',
      });
    });

    it('should format AM/PM time correctly when dayjs and non-UK locale', () => {
      const dayjsTime = dayjs('2023-01-01 14:30:00'); // 2:30 PM
      const formStateWithDayjs = {
        ...baseFormState,
        clockInNotificationReminderTime: dayjsTime as any,
      };

      const updatedFields = ['clockInNotificationReminderTime'];
      const result = createNotificationSettings(
        formStateWithDayjs,
        baseSettings,
        updatedFields,
        false, // isUKLocale = false
      );

      // Should convert the 12-hour format back to 24-hour
      expect(result?.startShiftNotifications?.reminderTime).toEqual({
        version: 'v1',
        value: '14:30',
      });
    });

    it('should format 24-hour time correctly when dayjs and UK locale', () => {
      const dayjsTime = dayjs('2023-01-01 08:15:00'); // 8:15 AM
      const formStateWithDayjs = {
        ...baseFormState,
        clockInNotificationReminderTime: dayjsTime as any,
      };

      const updatedFields = ['clockInNotificationReminderTime'];
      const result = createNotificationSettings(
        formStateWithDayjs,
        baseSettings,
        updatedFields,
        true, // isUKLocale = true
      );

      expect(result?.startShiftNotifications?.reminderTime).toEqual({
        version: 'v1',
        value: '08:15',
      });
    });
  });

  describe('createScheduleNotificationsInput', () => {
    it('returns undefined when no schedule field changed', () => {
      const result = createScheduleNotificationsInput(
        baseFormState,
        baseSettings,
        ['clockInNotificationReminderTime'],
      );
      expect(result).toBeUndefined();
    });

    it('includes publishShiftChangePreference when the send mode changed', () => {
      const result = createScheduleNotificationsInput(
        baseFormState,
        baseSettings,
        [NotificationFieldKey.SCHEDULE_SHIFT_PUBLISHED_SEND_MODE],
      );
      expect(result?.publishShiftChangePreference).toEqual({
        version: 'sched-v1',
        value: 'ALWAYS',
      });
      expect(result?.subscriptions).toBeUndefined();
    });

    it('builds a subscription only for the changed channel row, with its per-type version', () => {
      const result = createScheduleNotificationsInput(
        baseFormState,
        baseSettings,
        [NotificationFieldKey.SCHEDULE_ONE_HOUR_CHANNELS],
      );
      expect(result?.publishShiftChangePreference).toBeUndefined();
      expect(result?.subscriptions).toEqual([
        {
          version: 'sub-before-5',
          notificationType: TimeTracking_NotificationType.ShiftStartBefore,
          distributionMethods: [TimeTracking_NotificationReminderMedium.Email],
        },
      ]);
    });

    it('handles null scheduleNotificationSubscriptions in settings (omits version for all rows)', () => {
      const settingsWithNullSubs = {
        ...baseSettings,
        scheduleNotificationSubscriptions:
          null as unknown as MappedQLSettings['scheduleNotificationSubscriptions'],
      };
      const result = createScheduleNotificationsInput(
        baseFormState,
        settingsWithNullSubs,
        [NotificationFieldKey.SCHEDULE_ONE_HOUR_CHANNELS],
      );
      // No prior versions → version omitted; distributionMethods still sent.
      expect(result?.subscriptions).toEqual([
        {
          notificationType: TimeTracking_NotificationType.ShiftStartBefore,
          distributionMethods: [TimeTracking_NotificationReminderMedium.Email],
        },
      ]);
      expect(result?.subscriptions?.[0]).not.toHaveProperty('version');
    });

    it('omits version when the row has no prior subscription (first-time create)', () => {
      const result = createScheduleNotificationsInput(
        baseFormState,
        baseSettings,
        [NotificationFieldKey.SCHEDULE_FORGOT_CLOCK_IN_AFTER_ENDED_CHANNELS],
      );
      expect(result?.subscriptions).toEqual([
        {
          notificationType: TimeTracking_NotificationType.ShiftEndAfter,
          distributionMethods: [
            TimeTracking_NotificationReminderMedium.PushNotification,
          ],
        },
      ]);
      // version key must be absent (not '') so the server treats it as a create.
      expect(result?.subscriptions?.[0]).not.toHaveProperty('version');
    });

    it('sends an empty distributionMethods array when the row is cleared', () => {
      const result = createScheduleNotificationsInput(
        baseFormState,
        baseSettings,
        [NotificationFieldKey.SCHEDULE_LATE_CLOCK_IN_NOTIFY_MANAGER_CHANNELS],
      );
      expect(result?.subscriptions).toEqual([
        {
          notificationType:
            TimeTracking_NotificationType.ShiftStartAfterManager,
          distributionMethods: [],
        },
      ]);
    });

    it('combines send mode and multiple changed channel rows', () => {
      const result = createScheduleNotificationsInput(
        baseFormState,
        baseSettings,
        [
          NotificationFieldKey.SCHEDULE_SHIFT_PUBLISHED_SEND_MODE,
          NotificationFieldKey.SCHEDULE_SHIFT_PUBLISHED_CHANNELS,
          NotificationFieldKey.SCHEDULE_ONE_HOUR_CHANNELS,
        ],
      );
      expect(result?.publishShiftChangePreference).toBeDefined();
      expect(result?.subscriptions).toHaveLength(2);
    });
  });

  describe('createGeofenceReminderSettings', () => {
    const geofenceFormState: ITimeEntrySettingsFormState = {
      ...baseFormState,
      geofenceReminderStartTime: '8:00 AM',
      geofenceReminderEndTime: '5:00 PM',
      geofenceReminderDaysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY'],
    };

    const geofenceSettings: MappedQLSettings = {
      ...baseSettings,
      geofenceReminderStartTime: { version: 'v1', value: '08:00' },
      geofenceReminderEndTime: { version: 'v2', value: '17:00' },
      geofenceReminderDaysOfWeek: {
        version: 'v3',
        value: ['MONDAY', 'TUESDAY', 'WEDNESDAY'],
      },
    };

    it('should create geofence reminder settings when all fields are updated', () => {
      const updatedFields = [
        'geofenceReminderStartTime',
        'geofenceReminderEndTime',
        'geofenceReminderDaysOfWeek',
      ];

      const result = createGeofenceReminderSettings(
        geofenceFormState,
        geofenceSettings,
        updatedFields,
      );

      expect(result).toBeDefined();
      if (result) {
        expect(result.startTime).toEqual({
          version: 'v1',
          value: '08:00',
        });
        expect(result.endTime).toEqual({
          version: 'v2',
          value: '17:00',
        });
        expect(result.daysOfWeek).toEqual({
          version: 'v3',
          value: ['MONDAY', 'TUESDAY', 'WEDNESDAY'],
        });
      }
    });

    it('should create geofence reminder settings when only start time is updated', () => {
      const updatedFields = ['geofenceReminderStartTime'];

      const result = createGeofenceReminderSettings(
        geofenceFormState,
        geofenceSettings,
        updatedFields,
      );

      expect(result).toBeDefined();
      if (result) {
        expect(result.startTime).toEqual({
          version: 'v1',
          value: '08:00',
        });
        expect(result.endTime).toBeUndefined();
        expect(result.daysOfWeek).toBeUndefined();
      }
    });

    it('should create geofence reminder settings when only end time is updated', () => {
      const updatedFields = ['geofenceReminderEndTime'];

      const result = createGeofenceReminderSettings(
        geofenceFormState,
        geofenceSettings,
        updatedFields,
      );

      expect(result).toBeDefined();
      if (result) {
        expect(result.startTime).toBeUndefined();
        expect(result.endTime).toEqual({
          version: 'v2',
          value: '17:00',
        });
        expect(result.daysOfWeek).toBeUndefined();
      }
    });

    it('should create geofence reminder settings when only days of week is updated', () => {
      const updatedFields = ['geofenceReminderDaysOfWeek'];

      const result = createGeofenceReminderSettings(
        geofenceFormState,
        geofenceSettings,
        updatedFields,
      );

      expect(result).toBeDefined();
      if (result) {
        expect(result.startTime).toBeUndefined();
        expect(result.endTime).toBeUndefined();
        expect(result.daysOfWeek).toEqual({
          version: 'v3',
          value: ['MONDAY', 'TUESDAY', 'WEDNESDAY'],
        });
      }
    });

    it('should return undefined when no fields are updated', () => {
      const updatedFields: string[] = [];

      const result = createGeofenceReminderSettings(
        geofenceFormState,
        geofenceSettings,
        updatedFields,
      );

      expect(result).toBeUndefined();
    });

    it('should format dayjs start time correctly for UK locale', () => {
      const dayjsTime = dayjs('2023-01-01 08:30:00');
      const formStateWithDayjs = {
        ...geofenceFormState,
        geofenceReminderStartTime: dayjsTime as any,
      };

      const updatedFields = ['geofenceReminderStartTime'];
      const result = createGeofenceReminderSettings(
        formStateWithDayjs,
        geofenceSettings,
        updatedFields,
        true, // isUKLocale = true
      );

      expect(result?.startTime).toEqual({
        version: 'v1',
        value: '08:30',
      });
    });

    it('should format dayjs start time correctly for non-UK locale', () => {
      const dayjsTime = dayjs('2023-01-01 08:30:00');
      const formStateWithDayjs = {
        ...geofenceFormState,
        geofenceReminderStartTime: dayjsTime as any,
      };

      const updatedFields = ['geofenceReminderStartTime'];
      const result = createGeofenceReminderSettings(
        formStateWithDayjs,
        geofenceSettings,
        updatedFields,
        false, // isUKLocale = false
      );

      expect(result?.startTime).toEqual({
        version: 'v1',
        value: '08:30',
      });
    });

    it('should format dayjs end time correctly for UK locale', () => {
      const dayjsTime = dayjs('2023-01-01 17:45:00');
      const formStateWithDayjs = {
        ...geofenceFormState,
        geofenceReminderEndTime: dayjsTime as any,
      };

      const updatedFields = ['geofenceReminderEndTime'];
      const result = createGeofenceReminderSettings(
        formStateWithDayjs,
        geofenceSettings,
        updatedFields,
        true, // isUKLocale = true
      );

      expect(result?.endTime).toEqual({
        version: 'v2',
        value: '17:45',
      });
    });

    it('should format dayjs end time correctly for non-UK locale', () => {
      const dayjsTime = dayjs('2023-01-01 17:45:00');
      const formStateWithDayjs = {
        ...geofenceFormState,
        geofenceReminderEndTime: dayjsTime as any,
      };

      const updatedFields = ['geofenceReminderEndTime'];
      const result = createGeofenceReminderSettings(
        formStateWithDayjs,
        geofenceSettings,
        updatedFields,
        false, // isUKLocale = false
      );

      expect(result?.endTime).toEqual({
        version: 'v2',
        value: '17:45',
      });
    });

    it('should handle string start time correctly when isUKLocale is undefined', () => {
      const updatedFields = ['geofenceReminderStartTime'];
      const result = createGeofenceReminderSettings(
        geofenceFormState,
        geofenceSettings,
        updatedFields,
        undefined, // isUKLocale = undefined
      );

      expect(result?.startTime).toEqual({
        version: 'v1',
        value: '08:00',
      });
    });

    it('should handle string end time correctly when isUKLocale is undefined', () => {
      const updatedFields = ['geofenceReminderEndTime'];
      const result = createGeofenceReminderSettings(
        geofenceFormState,
        geofenceSettings,
        updatedFields,
        undefined, // isUKLocale = undefined
      );

      expect(result?.endTime).toEqual({
        version: 'v2',
        value: '17:00',
      });
    });

    it('should handle empty days of week array', () => {
      const formStateWithEmptyDays = {
        ...geofenceFormState,
        geofenceReminderDaysOfWeek: [],
      };

      const updatedFields = ['geofenceReminderDaysOfWeek'];
      const result = createGeofenceReminderSettings(
        formStateWithEmptyDays,
        geofenceSettings,
        updatedFields,
      );

      expect(result?.daysOfWeek).toEqual({
        version: 'v3',
        value: [],
      });
    });

    it('should handle undefined days of week', () => {
      const formStateWithUndefinedDays = {
        ...geofenceFormState,
        geofenceReminderDaysOfWeek: undefined as any,
      };

      const updatedFields = ['geofenceReminderDaysOfWeek'];
      const result = createGeofenceReminderSettings(
        formStateWithUndefinedDays,
        geofenceSettings,
        updatedFields,
      );

      expect(result?.daysOfWeek).toEqual({
        version: 'v3',
        value: [],
      });
    });

    it('should use version "0" when settings have no geofenceReminderDaysOfWeek version', () => {
      const settingsWithoutDaysVersion = {
        ...geofenceSettings,
        geofenceReminderDaysOfWeek: undefined,
      };

      const updatedFields = ['geofenceReminderDaysOfWeek'];
      const result = createGeofenceReminderSettings(
        geofenceFormState,
        settingsWithoutDaysVersion,
        updatedFields,
      );

      expect(result?.daysOfWeek).toEqual({
        version: '0',
        value: ['MONDAY', 'TUESDAY', 'WEDNESDAY'],
      });
    });

    it('should format AM/PM time correctly when dayjs and non-UK locale', () => {
      const dayjsTime = dayjs('2023-01-01 14:30:00'); // 2:30 PM
      const formStateWithDayjs = {
        ...geofenceFormState,
        geofenceReminderStartTime: dayjsTime as any,
      };

      const updatedFields = ['geofenceReminderStartTime'];
      const result = createGeofenceReminderSettings(
        formStateWithDayjs,
        geofenceSettings,
        updatedFields,
        false, // isUKLocale = false
      );

      // Should convert the 12-hour format back to 24-hour
      expect(result?.startTime).toEqual({
        version: 'v1',
        value: '14:30',
      });
    });

    it('should format 24-hour time correctly when dayjs and UK locale', () => {
      const dayjsTime = dayjs('2023-01-01 08:15:00'); // 8:15 AM
      const formStateWithDayjs = {
        ...geofenceFormState,
        geofenceReminderStartTime: dayjsTime as any,
      };

      const updatedFields = ['geofenceReminderStartTime'];
      const result = createGeofenceReminderSettings(
        formStateWithDayjs,
        geofenceSettings,
        updatedFields,
        true, // isUKLocale = true
      );

      expect(result?.startTime).toEqual({
        version: 'v1',
        value: '08:15',
      });
    });

    it('should handle both dayjs times together', () => {
      const startDayjsTime = dayjs('2023-01-01 08:00:00');
      const endDayjsTime = dayjs('2023-01-01 17:00:00');
      const formStateWithDayjs = {
        ...geofenceFormState,
        geofenceReminderStartTime: startDayjsTime as any,
        geofenceReminderEndTime: endDayjsTime as any,
      };

      const updatedFields = [
        'geofenceReminderStartTime',
        'geofenceReminderEndTime',
      ];
      const result = createGeofenceReminderSettings(
        formStateWithDayjs,
        geofenceSettings,
        updatedFields,
        false,
      );

      expect(result?.startTime).toEqual({
        version: 'v1',
        value: '08:00',
      });
      expect(result?.endTime).toEqual({
        version: 'v2',
        value: '17:00',
      });
    });

    it('should handle all fields with dayjs times and days of week', () => {
      const startDayjsTime = dayjs('2023-01-01 09:00:00');
      const endDayjsTime = dayjs('2023-01-01 18:00:00');
      const formStateWithDayjs = {
        ...geofenceFormState,
        geofenceReminderStartTime: startDayjsTime as any,
        geofenceReminderEndTime: endDayjsTime as any,
        geofenceReminderDaysOfWeek: ['FRIDAY', 'SATURDAY'],
      };

      const updatedFields = [
        'geofenceReminderStartTime',
        'geofenceReminderEndTime',
        'geofenceReminderDaysOfWeek',
      ];
      const result = createGeofenceReminderSettings(
        formStateWithDayjs,
        geofenceSettings,
        updatedFields,
        true,
      );

      expect(result?.startTime).toEqual({
        version: 'v1',
        value: '09:00',
      });
      expect(result?.endTime).toEqual({
        version: 'v2',
        value: '18:00',
      });
      expect(result?.daysOfWeek).toEqual({
        version: 'v3',
        value: ['FRIDAY', 'SATURDAY'],
      });
    });
  });
});
