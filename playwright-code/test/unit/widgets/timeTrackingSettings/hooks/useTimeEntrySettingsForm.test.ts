import { renderHook } from '@testing-library/react-hooks';
import {
  Common_DayOfWeek,
  TimeTracking_NotificationReminderMedium,
  TimeTracking_NotificationType,
} from 'src/__generated__/timeTracking/graphql';
import type {
  MappedQLSettings as IUpdateTimeEntrySettingResponse,
  MappedQLSettings,
} from '../../../../../src/js/service/hooks/settings/useGetQLSettings';
import type { ITimeEntrySettingsFormState } from '../../../../../src/js/widgets/timeTrackingSettings/types';
import {
  comparingTimeEntrySettingsToPreviousTimeEntrySettings,
  useTimeEntrySettings,
  createTimeTrackingSettings,
  mappedTimeEntrySettingsForMutation,
  removeTimeEntryDirtyFieldsUtils,
  mapGetQlSettingsData,
  updateTheSelectedFields,
  updateTimeSheetFieldsSelectedFields,
  getNestedValue,
  getVersion,
  getValue,
  getSettingData,
} from '../../../../../src/js/widgets/timeTrackingSettings/hooks/useTimeEntrySettingsForm';
import {
  NotificationField,
  NotificationFieldKey,
  NotificationMedium,
  NotificationRecipient,
  TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS,
  TIME_TRACKING_SETTINGS,
  CLOCK_ROUNDING_SETTINGS,
  NOTIFY_OPTIONS,
  TIME_FORMATS,
  CLOCK_IN_OUT_DIRECTIONS,
  NOTIFICATION_DAYS_OF_WEEK,
  TimeEntriesFormType,
  ROUNDING_INCREMENT_CLOCK_IN_OUT,
} from '../../../../../src/js/widgets/timeTrackingSettings/constants';
import { DIMENSIONS_FORM_NAME } from '../../../../../src/js/widgets/common/dimensions/types';

// Import helper functions from mutationHelper
import {
  createMutationPayload,
  createNotificationMediumData,
  createObjectIfHasValues,
  createDateTimeSettings,
  createTimesheetManagementSettings,
  createClockRoundingSettings,
  createNotificationSettings,
  isNotificationRecipientEnabled,
} from '../../../../../src/js/widgets/timeTrackingSettings/hooks/mutationHelper';

describe('useTimeEntrySettingsForm', () => {
  describe('useTimeEntrySettings', () => {
    it('should return a form instance configured for onSubmit mode', () => {
      const { result } = renderHook(() => useTimeEntrySettings());

      expect(result.current).toBeDefined();
      expect(result.current.getValues()).toBeDefined();
      expect(result.current.formState).toBeDefined();
    });
  });

  describe('createObjectIfHasValues', () => {
    it('should return undefined when all values are undefined', () => {
      const input = {
        field1: undefined,
        field2: undefined,
      };
      expect(createObjectIfHasValues(input)).toBeUndefined();
    });

    it('should return object with only defined values', () => {
      const input = {
        field1: 'value1',
        field2: undefined,
        field3: 'value3',
        field4: undefined,
      };
      expect(createObjectIfHasValues(input)).toEqual({
        field1: 'value1',
        field3: 'value3',
      });
    });

    it('should handle nested objects with defined values', () => {
      const input = {
        field1: {
          nested1: 'value1',
          nested2: undefined,
        },
        field2: undefined,
      };
      expect(createObjectIfHasValues(input)).toEqual({
        field1: {
          nested1: 'value1',
          nested2: undefined,
        },
      });
    });

    it('should handle falsy values except undefined', () => {
      const input = {
        field1: false,
        field2: 0,
        field3: '',
        field4: null,
        field5: undefined,
      };
      expect(createObjectIfHasValues(input)).toEqual({
        field1: false,
        field2: 0,
        field3: '',
        field4: null,
      });
    });
  });

  describe('createMutationPayload', () => {
    it('should return undefined when isUpdated is false', () => {
      expect(createMutationPayload(false, 'v1', 'test')).toBeUndefined();
    });

    it('should create payload with empty version when version is undefined', () => {
      const result = createMutationPayload(true, undefined, 'test');
      expect(result).toEqual({
        version: '',
        value: 'test',
      });
    });

    it('should create payload with provided version and value', () => {
      const result = createMutationPayload(true, 'v1', 'test');
      expect(result).toEqual({
        version: 'v1',
        value: 'test',
      });
    });

    it('should handle different value types', () => {
      // Boolean
      expect(createMutationPayload(true, 'v1', true)).toEqual({
        version: 'v1',
        value: true,
      });

      // Number
      expect(createMutationPayload(true, 'v1', 42)).toEqual({
        version: 'v1',
        value: 42,
      });

      // String array
      expect(createMutationPayload(true, 'v1', ['a', 'b'])).toEqual({
        version: 'v1',
        value: ['a', 'b'],
      });
    });
  });

  describe('createNotificationMediumData', () => {
    it('should return both email and push notification when both are enabled', () => {
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

    it('should return empty array when both are disabled', () => {
      const result = createNotificationMediumData(false, false);
      expect(result).toEqual([]);
    });
  });

  // Test exported functions
  describe('comparingTimeEntrySettingsToPreviousTimeEntrySettings', () => {
    describe('Positive Cases - Multiple Fields Changed', () => {
      it('should handle multiple notification fields changed together', () => {
        const dirtyFields = {
          [NotificationField.CLOCK_IN_EMAIL]: true,
          [NotificationField.CLOCK_OUT_MOBILE]: true,
          timeFormat: true,
        };

        const result =
          comparingTimeEntrySettingsToPreviousTimeEntrySettings(dirtyFields);
        const uniqueResult = Array.from(new Set(result));

        // Should include all related fields for clock in email
        expect(uniqueResult).toContain(NotificationField.CLOCK_IN_EMAIL);
        expect(uniqueResult).toContain(NotificationField.CLOCK_IN_TIME);
        expect(uniqueResult).toContain(NotificationField.CLOCK_IN_MOBILE);

        // Should include all related fields for clock out mobile
        expect(uniqueResult).toContain(NotificationField.CLOCK_OUT_MOBILE);
        expect(uniqueResult).toContain(NotificationField.CLOCK_OUT_EMAIL);
        expect(uniqueResult).toContain(NotificationField.CLOCK_OUT_TIME);

        // Should include independent field as is
        expect(uniqueResult).toContain('timeFormat');
      });

      it('should handle all clock in notification fields changed', () => {
        const dirtyFields = {
          [NotificationField.CLOCK_IN_EMAIL]: true,
          [NotificationField.CLOCK_IN_MOBILE]: true,
          [NotificationField.CLOCK_IN_TIME]: true,
        };

        const result =
          comparingTimeEntrySettingsToPreviousTimeEntrySettings(dirtyFields);
        const uniqueClockInFields = new Set(
          result.filter(
            (field) =>
              field === NotificationField.CLOCK_IN_EMAIL ||
              field === NotificationField.CLOCK_IN_MOBILE ||
              field === NotificationField.CLOCK_IN_TIME,
          ),
        );

        // Should include all clock in fields exactly once after deduplication
        expect(uniqueClockInFields.size).toBe(3);
        expect(uniqueClockInFields).toContain(NotificationField.CLOCK_IN_EMAIL);
        expect(uniqueClockInFields).toContain(
          NotificationField.CLOCK_IN_MOBILE,
        );
        expect(uniqueClockInFields).toContain(NotificationField.CLOCK_IN_TIME);
      });

      it('should handle all clock out notification fields changed', () => {
        const dirtyFields = {
          [NotificationField.CLOCK_OUT_EMAIL]: true,
          [NotificationField.CLOCK_OUT_MOBILE]: true,
          [NotificationField.CLOCK_OUT_TIME]: true,
        };

        const result =
          comparingTimeEntrySettingsToPreviousTimeEntrySettings(dirtyFields);
        const uniqueClockOutFields = new Set(
          result.filter(
            (field) =>
              field === NotificationField.CLOCK_OUT_EMAIL ||
              field === NotificationField.CLOCK_OUT_MOBILE ||
              field === NotificationField.CLOCK_OUT_TIME,
          ),
        );

        // Should include all clock out fields exactly once after deduplication
        expect(uniqueClockOutFields.size).toBe(3);
        expect(uniqueClockOutFields).toContain(
          NotificationField.CLOCK_OUT_EMAIL,
        );
        expect(uniqueClockOutFields).toContain(
          NotificationField.CLOCK_OUT_MOBILE,
        );
        expect(uniqueClockOutFields).toContain(
          NotificationField.CLOCK_OUT_TIME,
        );
      });
    });

    describe('Clock In Notification Fields', () => {
      it('should handle clockInNotificationReminderEmail changes', () => {
        const dirtyFields = {
          clockInNotificationReminderEmail: true,
        };

        const result =
          comparingTimeEntrySettingsToPreviousTimeEntrySettings(dirtyFields);

        expect(result).toEqual([
          'clockInNotificationReminderEmail',
          'clockInNotificationReminderTime',
          'clockInNotificationReminderMobile',
        ]);
      });

      it('should handle clockInNotificationReminderMobile changes', () => {
        const dirtyFields = {
          clockInNotificationReminderMobile: true,
        };

        const result =
          comparingTimeEntrySettingsToPreviousTimeEntrySettings(dirtyFields);

        expect(result).toEqual([
          'clockInNotificationReminderMobile',
          'clockInNotificationReminderEmail',
          'clockInNotificationReminderTime',
        ]);
      });
    });

    describe('Clock Out Notification Fields', () => {
      it('should handle clockOutNotificationReminderEmail changes', () => {
        const dirtyFields = {
          clockOutNotificationReminderEmail: true,
        };

        const result =
          comparingTimeEntrySettingsToPreviousTimeEntrySettings(dirtyFields);

        expect(result).toEqual([
          'clockOutNotificationReminderEmail',
          'clockOutNotificationReminderTime',
          'clockOutNotificationReminderMobile',
        ]);
      });

      it('should handle clockOutNotificationReminderMobile changes', () => {
        const dirtyFields = {
          clockOutNotificationReminderMobile: true,
        };

        const result =
          comparingTimeEntrySettingsToPreviousTimeEntrySettings(dirtyFields);

        expect(result).toEqual([
          'clockOutNotificationReminderMobile',
          'clockOutNotificationReminderEmail',
          'clockOutNotificationReminderTime',
        ]);
      });
    });

    describe('Time Settings Fields', () => {
      it('should handle timeFormat changes', () => {
        const dirtyFields = {
          timeFormat: true,
        };
        expect(
          comparingTimeEntrySettingsToPreviousTimeEntrySettings(dirtyFields),
        ).toEqual(['timeFormat']);
      });

      it('should handle firstDayOfWeek changes', () => {
        const dirtyFields = {
          firstDayOfWeek: true,
        };
        expect(
          comparingTimeEntrySettingsToPreviousTimeEntrySettings(dirtyFields),
        ).toEqual(['firstDayOfWeek']);
      });

      it('should handle timeZone changes', () => {
        const dirtyFields = {
          timeZone: true,
        };
        expect(
          comparingTimeEntrySettingsToPreviousTimeEntrySettings(dirtyFields),
        ).toEqual(['timeZone']);
      });
    });

    describe('Time Sheet Fields', () => {
      it('should handle timesheet related field changes', () => {
        const dirtyFields = {
          splitTimeSheetAtMidnightEnabled: true,
          manageOwnTimeSheetsEnabled: true,
          editClockOutTimeEnabled: true,
          clockOutOverrideHours: true,
        };

        const result =
          comparingTimeEntrySettingsToPreviousTimeEntrySettings(dirtyFields);

        expect(result).toEqual([
          'splitTimeSheetAtMidnightEnabled',
          'manageOwnTimeSheetsEnabled',
          'editClockOutTimeEnabled',
          'clockOutOverrideHours',
        ]);
      });
    });

    describe('Billing and Custom Fields', () => {
      it('should handle billing related field changes', () => {
        const dirtyFields = {
          isBillingFieldEnabled: true,
          billingRateForTimeEnabled: true,
          requireBillable: true,
          isServiceFieldEnabled: true,
        };

        const result =
          comparingTimeEntrySettingsToPreviousTimeEntrySettings(dirtyFields);
        const unique = Array.from(new Set(result));

        expect(unique).toEqual(
          expect.arrayContaining([
            'isBillingFieldEnabled',
            'requireBillable',
            'billingRateForTimeEnabled',
            'isServiceFieldEnabled',
            'serviceItemRequired',
          ]),
        );
      });

      it('should handle custom fields changes', () => {
        const dirtyFields = {
          customersForTimeSheetEnabled: true,
          classForTimeSheetEnabled: true,
          locationForTimeSheetEnabled: true,
        };

        const result =
          comparingTimeEntrySettingsToPreviousTimeEntrySettings(dirtyFields);
        const unique = Array.from(new Set(result));

        expect(unique).toEqual(
          expect.arrayContaining([
            'customersForTimeSheetEnabled',
            'classForTimeSheetEnabled',
            'classRequired',
            'locationForTimeSheetEnabled',
            'locationRequired',
          ]),
        );
      });
    });

    describe('Paired parent/required timesheet fields', () => {
      it.each([
        ['isBillingFieldEnabled', 'requireBillable'],
        ['requireBillable', 'isBillingFieldEnabled'],
        ['isServiceFieldEnabled', 'serviceItemRequired'],
        ['serviceItemRequired', 'isServiceFieldEnabled'],
        ['classForTimeSheetEnabled', 'classRequired'],
        ['classRequired', 'classForTimeSheetEnabled'],
        ['locationForTimeSheetEnabled', 'locationRequired'],
        ['locationRequired', 'locationForTimeSheetEnabled'],
        [
          'timeSheetEntryNotesEnabled',
          'timeSheetEntryMakesNotesRequiredEnabled',
        ],
        [
          'timeSheetEntryMakesNotesRequiredEnabled',
          'timeSheetEntryNotesEnabled',
        ],
      ])('should pair %s with %s in the mutation payload', (dirty, paired) => {
        const result = comparingTimeEntrySettingsToPreviousTimeEntrySettings({
          [dirty]: true,
        });

        expect(result).toContain(dirty);
        expect(result).toContain(paired);
      });
    });

    it('should include dimensions in updated fields when the dimensions form map is dirty', () => {
      const result = comparingTimeEntrySettingsToPreviousTimeEntrySettings({
        [DIMENSIONS_FORM_NAME]: true,
      });

      expect(result).toEqual([DIMENSIONS_FORM_NAME]);
    });
  });

  describe('isNotificationRecipientEnabled', () => {
    it('should return true when recipient type matches', () => {
      expect(
        isNotificationRecipientEnabled(NotificationRecipient.ADMINS_ONLY, [
          NotificationRecipient.ADMINS_ONLY,
          NotificationRecipient.ADMINS_AND_MANAGERS,
        ]),
      ).toBe(true);
    });

    it('should return false when recipient type does not match', () => {
      expect(
        isNotificationRecipientEnabled(NotificationRecipient.MANAGERS_ONLY, [
          NotificationRecipient.ADMINS_ONLY,
        ]),
      ).toBe(false);
    });

    it('should handle empty recipient types array', () => {
      expect(
        isNotificationRecipientEnabled(NotificationRecipient.ADMINS_ONLY, []),
      ).toBe(false);
    });
  });

  describe('createTimeTrackingSettings', () => {
    const mockFormState: Partial<ITimeEntrySettingsFormState> = {
      isBillingFieldEnabled: true,
      isServiceFieldEnabled: true,
      billingRateForTimeEnabled: false,
      firstDayOfWeek: '1',
    };

    const mockSettings: Partial<MappedQLSettings> = {
      isBillingFieldEnabled: { version: 'v1', value: false },
      useItemForTime: { version: 'v2', value: false },
      billingRateForTimeEnabled: { version: 'v3', value: false },
      firstDayOfWeek: { version: 'v4', value: 0 },
    };

    it('should create settings when fields are updated', () => {
      const updatedFields = [
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_SERVICE_ENABLE,
        TIME_TRACKING_SETTINGS.FIRST_DAY_OF_WEEK,
      ];

      const result = createTimeTrackingSettings(
        mockFormState as ITimeEntrySettingsFormState,
        mockSettings as MappedQLSettings,
        updatedFields,
      );

      expect(result).toEqual({
        timeTrackingBillingEnabled: { version: 'v1', value: true },
        timeTrackingUseItemForTimeEnabled: { version: 'v2', value: true },
        timeTrackingBillingRateForTimeEnabled: undefined,
        timeTrackingStartWorkWeek: { version: 'v4', value: 1 },
      });
    });

    it('should not include settings when fields are not updated', () => {
      const updatedFields: string[] = [];

      const result = createTimeTrackingSettings(
        mockFormState as ITimeEntrySettingsFormState,
        mockSettings as MappedQLSettings,
        updatedFields,
      );

      expect(result).toEqual({
        timeTrackingBillingEnabled: undefined,
        timeTrackingUseItemForTimeEnabled: undefined,
        timeTrackingBillingRateForTimeEnabled: undefined,
        timeTrackingStartWorkWeek: undefined,
      });
    });
  });

  describe('createDateTimeSettings', () => {
    const mockFormState: Partial<ITimeEntrySettingsFormState> = {
      timeZone: 'America/Los_Angeles',
      timeFormat: '12',
    };

    const mockSettings: Partial<MappedQLSettings> = {
      timeZone: { version: 'v1', value: 'UTC' },
      timeFormat: { version: 'v2', value: 24 },
    };

    it('should handle settings with undefined version', () => {
      const settingsWithoutVersion: Partial<MappedQLSettings> = {
        timeZone: { value: 'UTC' } as any, // Missing version
        timeFormat: undefined, // Completely undefined
      };

      const result = createDateTimeSettings(
        mockFormState as ITimeEntrySettingsFormState,
        settingsWithoutVersion as MappedQLSettings,
        [TIME_TRACKING_SETTINGS.TIME_ZONE, TIME_TRACKING_SETTINGS.TIME_FORMAT],
      );

      expect(result).toEqual({
        timeZone: { version: '', value: 'America/Los_Angeles' },
        clockFormat: { version: '', value: 12 },
      });
    });

    it('should handle completely undefined settings', () => {
      const settingsWithUndefined: Partial<MappedQLSettings> = {
        timeZone: undefined,
        timeFormat: undefined,
      };

      const result = createDateTimeSettings(
        mockFormState as ITimeEntrySettingsFormState,
        settingsWithUndefined as MappedQLSettings,
        [TIME_TRACKING_SETTINGS.TIME_ZONE, TIME_TRACKING_SETTINGS.TIME_FORMAT],
      );

      expect(result).toEqual({
        timeZone: { version: '', value: 'America/Los_Angeles' },
        clockFormat: { version: '', value: 12 },
      });
    });

    it('should handle settings with null version', () => {
      const settingsWithNullVersion: Partial<MappedQLSettings> = {
        timeZone: { version: null as any, value: 'UTC' },
        timeFormat: { version: null as any, value: 24 },
      };

      const result = createDateTimeSettings(
        mockFormState as ITimeEntrySettingsFormState,
        settingsWithNullVersion as MappedQLSettings,
        [TIME_TRACKING_SETTINGS.TIME_ZONE, TIME_TRACKING_SETTINGS.TIME_FORMAT],
      );

      expect(result).toEqual({
        timeZone: { version: '', value: 'America/Los_Angeles' },
        clockFormat: { version: '', value: 12 },
      });
    });

    it('should create settings when fields are updated', () => {
      const updatedFields = [
        TIME_TRACKING_SETTINGS.TIME_ZONE,
        TIME_TRACKING_SETTINGS.TIME_FORMAT,
      ];

      const result = createDateTimeSettings(
        mockFormState as ITimeEntrySettingsFormState,
        mockSettings as MappedQLSettings,
        updatedFields,
      );

      expect(result).toEqual({
        timeZone: { version: 'v1', value: 'America/Los_Angeles' },
        clockFormat: { version: 'v2', value: 12 },
      });
    });

    it('should return undefined when no fields are updated', () => {
      const result = createDateTimeSettings(
        mockFormState as ITimeEntrySettingsFormState,
        mockSettings as MappedQLSettings,
        [],
      );

      expect(result).toBeUndefined();
    });

    it('should handle partial updates', () => {
      const result = createDateTimeSettings(
        mockFormState as ITimeEntrySettingsFormState,
        mockSettings as MappedQLSettings,
        [TIME_TRACKING_SETTINGS.TIME_ZONE],
      );

      expect(result).toEqual({
        timeZone: { version: 'v1', value: 'America/Los_Angeles' },
      });
    });
  });

  describe('createTimesheetManagementSettings', () => {
    const mockFormState: Partial<ITimeEntrySettingsFormState> = {
      timeSheetEntryNotesEnabled: true,
      timeSheetEntryEditNotesEnabled: true,
      timeSheetEntryMakesNotesRequiredEnabled: true,
      manageOwnTimeSheetsEnabled: true,
      editClockOutTimeEnabled: true,
      clockOutOverrideHours: '8',
      splitTimeSheetAtMidnightEnabled: true,
      customersForTimeSheetEnabled: true,
      classForTimeSheetEnabled: true,
      locationForTimeSheetEnabled: true,
    };

    it('should correctly handle all version properties when present', () => {
      const mockSettings: Partial<MappedQLSettings> = {
        timeSheetEntryNotesEnabled: { version: 'v1', value: false },
        timeSheetEntryEditNotesEnabled: { version: 'v2', value: false },
        timeSheetEntryMakesNotesRequiredEnabled: {
          version: 'v3',
          value: false,
        },
        manageOwnTimeSheetsEnabled: { version: 'v4', value: false },
        editClockOutTimeEnabled: { version: 'v5', value: false },
        clockOutOverrideHours: { version: 'v6', value: 4 },
        splitTimeSheetAtMidnightEnabled: { version: 'v7', value: false },
        customersForTimeSheetEnabled: { version: 'v8', value: false },
        classForTimeSheetEnabled: { version: 'v9', value: false },
        locationForTimeSheetEnabled: { version: 'v10', value: false },
      };

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
        mockFormState as ITimeEntrySettingsFormState,
        mockSettings as MappedQLSettings,
        updatedFields,
      );

      // Verify all version properties are correctly accessed and used
      expect(result).toEqual({
        notes: {
          enabled: { version: 'v1', value: true },
          editEnabled: { version: 'v2', value: true },
          requiredEnabled: { version: 'v3', value: true },
        },
        timesheet: {
          manageOwnTimesheetEnabled: { version: 'v4', value: true },
          editClockOutTimeEnabled: { version: 'v5', value: true },
          clockOutOverrideHours: { version: 'v6', value: 8 },
          splitAtMidnightEnabled: { version: 'v7', value: true },
        },
        customFields: {
          customersEnabled: { version: 'v8', value: true },
          classEnabled: { version: 'v9', value: true },
          locationEnabled: { version: 'v10', value: true },
        },
      });
    });

    it('should handle mixed presence of version properties', () => {
      // Some settings have version, others have undefined version
      const mixedSettings: Partial<MappedQLSettings> = {
        timeSheetEntryNotesEnabled: { version: 'v1', value: false },
        timeSheetEntryEditNotesEnabled: { version: '', value: false },
        timeSheetEntryMakesNotesRequiredEnabled: {
          version: 'v3',
          value: false,
        },
        manageOwnTimeSheetsEnabled: { version: '', value: false },
        editClockOutTimeEnabled: { version: 'v5', value: false },
        clockOutOverrideHours: { version: '', value: 4 },
        splitTimeSheetAtMidnightEnabled: { version: 'v7', value: false },
        customersForTimeSheetEnabled: { version: '', value: false },
        classForTimeSheetEnabled: { version: 'v9', value: false },
        locationForTimeSheetEnabled: { version: '', value: false },
      };

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
        mockFormState as ITimeEntrySettingsFormState,
        mixedSettings as MappedQLSettings,
        updatedFields,
      );

      // Verify version properties are correctly handled whether present or not
      expect(result).toEqual({
        notes: {
          enabled: { version: 'v1', value: true },
          editEnabled: { version: '', value: true },
          requiredEnabled: { version: 'v3', value: true },
        },
        timesheet: {
          manageOwnTimesheetEnabled: { version: '', value: true },
          editClockOutTimeEnabled: { version: 'v5', value: true },
          clockOutOverrideHours: { version: '', value: 8 },
          splitAtMidnightEnabled: { version: 'v7', value: true },
        },
        customFields: {
          customersEnabled: { version: '', value: true },
          classEnabled: { version: 'v9', value: true },
          locationEnabled: { version: '', value: true },
        },
      });
    });

    it('should handle clockOutOverrideHours conditional logic', () => {
      const mockSettings: Partial<MappedQLSettings> = {
        editClockOutTimeEnabled: { version: 'v5', value: true },
        clockOutOverrideHours: { version: 'v6', value: 4 },
      };

      // Test when editClockOutTimeEnabled is true
      const resultWithEnabled = createTimesheetManagementSettings(
        mockFormState as ITimeEntrySettingsFormState,
        mockSettings as MappedQLSettings,
        [TIME_TRACKING_SETTINGS.CLOCK_OUT_OVERRIDE_HOURS],
      );

      expect(resultWithEnabled?.timesheet?.clockOutOverrideHours).toEqual({
        version: 'v6',
        value: 8,
      });

      // Test when editClockOutTimeEnabled is false
      const formStateWithDisabled = {
        ...mockFormState,
        editClockOutTimeEnabled: false,
      };

      const resultWithDisabled = createTimesheetManagementSettings(
        formStateWithDisabled as ITimeEntrySettingsFormState,
        mockSettings as MappedQLSettings,
        [TIME_TRACKING_SETTINGS.CLOCK_OUT_OVERRIDE_HOURS],
      );

      expect(
        resultWithDisabled?.timesheet?.clockOutOverrideHours,
      ).toBeUndefined();
    });
  });

  describe('createClockRoundingSettings', () => {
    const mockFormState: Partial<ITimeEntrySettingsFormState> = {
      clockInRoundDirection: 'UP',
      clockInRoundInMin: 15,
      clockOutRoundDirection: 'DOWN',
      clockOutRoundInMin: 30,
    };

    const mockSettings: Partial<MappedQLSettings> = {
      clockInRoundDirection: { version: 'v1', value: 'NEAREST' },
      clockInRoundInMin: { version: 'v2', value: 5 },
      clockOutRoundDirection: { version: 'v3', value: 'NEAREST' },
      clockOutRoundInMin: { version: 'v4', value: 10 },
    };

    it('should create complete settings when all fields are updated', () => {
      const updatedFields = [
        CLOCK_ROUNDING_SETTINGS.CLOCK_IN_ROUND_DIRECTION,
        CLOCK_ROUNDING_SETTINGS.CLOCK_IN_ROUND_IN_MINUTE,
        CLOCK_ROUNDING_SETTINGS.CLOCK_OUT_ROUND_DIRECTION,
        CLOCK_ROUNDING_SETTINGS.CLOCK_OUT_ROUND_IN_MINUTE,
      ];

      const result = createClockRoundingSettings(
        mockFormState as ITimeEntrySettingsFormState,
        mockSettings as MappedQLSettings,
        updatedFields,
      );

      expect(result).toEqual({
        startTimeRounding: {
          direction: { version: 'v1', value: 'UP' },
          roundInMin: { version: 'v2', value: 15 },
        },
        endTimeRounding: {
          direction: { version: 'v3', value: 'DOWN' },
          roundInMin: { version: 'v4', value: 30 },
        },
      });
    });

    it('should handle no updated fields', () => {
      const result = createClockRoundingSettings(
        mockFormState as ITimeEntrySettingsFormState,
        mockSettings as MappedQLSettings,
        [],
      );

      expect(result).toBeUndefined();
    });

    it('should handle only start time rounding updates', () => {
      const result = createClockRoundingSettings(
        mockFormState as ITimeEntrySettingsFormState,
        mockSettings as MappedQLSettings,
        [
          CLOCK_ROUNDING_SETTINGS.CLOCK_IN_ROUND_DIRECTION,
          CLOCK_ROUNDING_SETTINGS.CLOCK_IN_ROUND_IN_MINUTE,
        ],
      );

      expect(result).toEqual({
        startTimeRounding: {
          direction: { version: 'v1', value: 'UP' },
          roundInMin: { version: 'v2', value: 15 },
        },
      });
    });

    it('should handle only end time rounding updates', () => {
      const result = createClockRoundingSettings(
        mockFormState as ITimeEntrySettingsFormState,
        mockSettings as MappedQLSettings,
        [
          CLOCK_ROUNDING_SETTINGS.CLOCK_OUT_ROUND_DIRECTION,
          CLOCK_ROUNDING_SETTINGS.CLOCK_OUT_ROUND_IN_MINUTE,
        ],
      );

      expect(result).toEqual({
        endTimeRounding: {
          direction: { version: 'v3', value: 'DOWN' },
          roundInMin: { version: 'v4', value: 30 },
        },
      });
    });

    it('should handle partial updates within each rounding group', () => {
      const result = createClockRoundingSettings(
        mockFormState as ITimeEntrySettingsFormState,
        mockSettings as MappedQLSettings,
        [
          CLOCK_ROUNDING_SETTINGS.CLOCK_IN_ROUND_DIRECTION,
          CLOCK_ROUNDING_SETTINGS.CLOCK_OUT_ROUND_IN_MINUTE,
        ],
      );

      expect(result).toEqual({
        startTimeRounding: {
          direction: { version: 'v1', value: 'UP' },
        },
        endTimeRounding: {
          roundInMin: { version: 'v4', value: 30 },
        },
      });
    });
  });

  describe('createNotificationSettings', () => {
    const mockFormState: Partial<ITimeEntrySettingsFormState> = {
      clockInNotificationReminderTime: '8:00 AM',
      clockInNotificationReminderEmail: true,
      clockInNotificationReminderMobile: true,
      clockOutNotificationReminderTime: '5:00 PM',
      clockOutNotificationReminderEmail: true,
      clockOutNotificationReminderMobile: false,
      notificationEnabledForDays: ['MONDAY', 'TUESDAY'],
      notifyWhenClockInOutUpdated: NotificationRecipient.ADMINS_AND_MANAGERS,
      notifyWhenNotesAreAddedOrEdited: NotificationRecipient.ADMINS_ONLY,
    };

    const mockSettings: Partial<MappedQLSettings> = {
      clockInNotificationReminderTime: { version: 'v1', value: '09:00' },
      clockInNotificationReminderEmail: { version: 'v2', value: false },
      clockOutNotificationReminderTime: { version: 'v3', value: '17:00' },
      clockOutNotificationReminderEmail: { version: 'v4', value: false },
      notificationEnabledForDays: { version: 'v5', value: ['WEDNESDAY'] },
      notifyAdminOnClockOutOverrideEnabled: { version: 'v6', value: false },
      notifyManagerOnClockOutOverrideEnabled: { version: 'v7', value: false },
      notifyAdminOnTimeSheetNotesEditEnabled: { version: 'v8', value: false },
      notifyGroupManagerOnTimeSheetNotesEditEnabled: {
        version: 'v9',
        value: false,
      },
    };

    it('should create complete notification settings when all fields are updated', () => {
      const updatedFields = [
        'clockInNotificationReminderTime',
        'clockInNotificationReminderEmail',
        'clockInNotificationReminderMobile',
        'clockOutNotificationReminderTime',
        'clockOutNotificationReminderEmail',
        'clockOutNotificationReminderMobile',
        'notificationEnabledForDays',
        'notifyWhenClockInOutUpdated',
        'notifyWhenNotesAreAddedOrEdited',
      ];

      const result = createNotificationSettings(
        mockFormState as ITimeEntrySettingsFormState,
        mockSettings as MappedQLSettings,
        updatedFields,
      );

      expect(result).toEqual({
        startShiftNotifications: {
          reminderTime: { version: 'v1', value: '08:00' },
          notificationMedium: {
            version: 'v2',
            value: [
              NotificationMedium.EMAIL,
              NotificationMedium.PUSH_NOTIFICATION,
            ],
          },
        },
        endShiftNotifications: {
          reminderTime: { version: 'v3', value: '17:00' },
          notificationMedium: {
            version: 'v4',
            value: [NotificationMedium.EMAIL],
          },
        },
        notificationEnabledForDays: {
          version: 'v5',
          value: ['MONDAY', 'TUESDAY'],
        },
        clockOutOverrideNotifications: {
          adminEnabled: { version: 'v6', value: true },
          groupManagerEnabled: { version: 'v7', value: true },
        },
        timesheetEditNotifications: {
          adminEnabled: { version: 'v8', value: true },
          groupManagerEnabled: { version: 'v9', value: false },
        },
      });
    });

    it('should handle no updated fields', () => {
      const result = createNotificationSettings(
        mockFormState as ITimeEntrySettingsFormState,
        mockSettings as MappedQLSettings,
        [],
      );

      expect(result).toBeUndefined();
    });

    it('should handle only start shift notification updates', () => {
      const result = createNotificationSettings(
        mockFormState as ITimeEntrySettingsFormState,
        mockSettings as MappedQLSettings,
        [
          'clockInNotificationReminderTime',
          'clockInNotificationReminderEmail',
          'clockInNotificationReminderMobile',
        ],
      );

      expect(result).toEqual({
        startShiftNotifications: {
          reminderTime: { version: 'v1', value: '08:00' },
          notificationMedium: {
            version: 'v2',
            value: [
              NotificationMedium.EMAIL,
              NotificationMedium.PUSH_NOTIFICATION,
            ],
          },
        },
      });
    });

    it('should handle only end shift notification updates', () => {
      const result = createNotificationSettings(
        mockFormState as ITimeEntrySettingsFormState,
        mockSettings as MappedQLSettings,
        [
          'clockOutNotificationReminderTime',
          'clockOutNotificationReminderEmail',
          'clockOutNotificationReminderMobile',
        ],
      );

      expect(result).toEqual({
        endShiftNotifications: {
          reminderTime: { version: 'v3', value: '17:00' },
          notificationMedium: {
            version: 'v4',
            value: [NotificationMedium.EMAIL],
          },
        },
      });
    });

    it('should handle empty notification days array', () => {
      const formState = {
        ...mockFormState,
        notificationEnabledForDays: [],
      };

      const result = createNotificationSettings(
        formState as ITimeEntrySettingsFormState,
        mockSettings as MappedQLSettings,
        ['notificationEnabledForDays'],
      );

      expect(result).toEqual({
        notificationEnabledForDays: { version: 'v5', value: [] },
      });
    });

    it('should handle different notification recipient combinations', () => {
      // Test ADMINS_ONLY
      const adminOnlyFormState = {
        ...mockFormState,
        notifyWhenClockInOutUpdated: NotificationRecipient.ADMINS_ONLY,
        notifyWhenNotesAreAddedOrEdited: NotificationRecipient.ADMINS_ONLY,
      };

      const adminOnlyResult = createNotificationSettings(
        adminOnlyFormState as ITimeEntrySettingsFormState,
        mockSettings as MappedQLSettings,
        ['notifyWhenClockInOutUpdated', 'notifyWhenNotesAreAddedOrEdited'],
      );

      expect(adminOnlyResult).toEqual({
        clockOutOverrideNotifications: {
          adminEnabled: { version: 'v6', value: true },
          groupManagerEnabled: { version: 'v7', value: false },
        },
        timesheetEditNotifications: {
          adminEnabled: { version: 'v8', value: true },
          groupManagerEnabled: { version: 'v9', value: false },
        },
      });

      // Test MANAGERS_ONLY
      const managerOnlyFormState = {
        ...mockFormState,
        notifyWhenClockInOutUpdated: NotificationRecipient.MANAGERS_ONLY,
        notifyWhenNotesAreAddedOrEdited: NotificationRecipient.MANAGERS_ONLY,
      };

      const managerOnlyResult = createNotificationSettings(
        managerOnlyFormState as ITimeEntrySettingsFormState,
        mockSettings as MappedQLSettings,
        ['notifyWhenClockInOutUpdated', 'notifyWhenNotesAreAddedOrEdited'],
      );

      expect(managerOnlyResult).toEqual({
        clockOutOverrideNotifications: {
          adminEnabled: { version: 'v6', value: false },
          groupManagerEnabled: { version: 'v7', value: true },
        },
        timesheetEditNotifications: {
          adminEnabled: { version: 'v8', value: false },
          groupManagerEnabled: { version: 'v9', value: true },
        },
      });
    });
  });

  describe('mappedTimeEntrySettingsForMutation', () => {
    const mockFormState: Partial<ITimeEntrySettingsFormState> = {
      // Time tracking settings
      isBillingFieldEnabled: true,
      isServiceFieldEnabled: true,
      billingRateForTimeEnabled: true,
      firstDayOfWeek: '1',

      // Core settings
      requireBillable: true,

      // DateTime settings
      timeZone: 'America/Los_Angeles',
      timeFormat: '12',

      // Timesheet management settings
      timeSheetEntryNotesEnabled: true,
      timeSheetEntryEditNotesEnabled: true,
      manageOwnTimeSheetsEnabled: true,
      editClockOutTimeEnabled: true,
      clockOutOverrideHours: '8',
      customersForTimeSheetEnabled: true,

      // Clock rounding settings
      clockInRoundDirection: 'UP',
      clockInRoundInMin: 15,
      clockOutRoundDirection: 'DOWN',
      clockOutRoundInMin: 30,

      // Notification settings
      clockInNotificationReminderTime: '8:00 AM',
      clockInNotificationReminderEmail: true,
      clockInNotificationReminderMobile: true,
      clockOutNotificationReminderTime: '5:00 PM',
      clockOutNotificationReminderEmail: true,
      notificationEnabledForDays: ['MONDAY', 'TUESDAY'],
      notifyWhenClockInOutUpdated: NotificationRecipient.ADMINS_AND_MANAGERS,
      notifyWhenNotesAreAddedOrEdited: NotificationRecipient.ADMINS_ONLY,
    };

    const mockSettings: Partial<MappedQLSettings> = {
      // Time tracking settings
      isBillingFieldEnabled: { version: 'v1', value: false },
      useItemForTime: { version: 'v2', value: false },
      billingRateForTimeEnabled: { version: 'v3', value: false },
      firstDayOfWeek: { version: 'v4', value: 0 },

      // Core settings
      requireBillable: { version: 'v5', value: false },

      // DateTime settings
      timeZone: { version: 'v6', value: 'UTC' },
      timeFormat: { version: 'v7', value: 24 },

      // Timesheet management settings
      timeSheetEntryNotesEnabled: { version: 'v8', value: false },
      timeSheetEntryEditNotesEnabled: { version: 'v9', value: false },
      manageOwnTimeSheetsEnabled: { version: 'v10', value: false },
      editClockOutTimeEnabled: { version: 'v11', value: false },
      clockOutOverrideHours: { version: 'v12', value: 4 },
      customersForTimeSheetEnabled: { version: 'v13', value: false },

      // Clock rounding settings
      clockInRoundDirection: { version: 'v14', value: 'NEAREST' },
      clockInRoundInMin: { version: 'v15', value: 5 },
      clockOutRoundDirection: { version: 'v16', value: 'NEAREST' },
      clockOutRoundInMin: { version: 'v17', value: 10 },

      // Notification settings
      clockInNotificationReminderTime: { version: 'v18', value: '09:00' },
      clockInNotificationReminderEmail: { version: 'v19', value: false },
      clockOutNotificationReminderTime: { version: 'v20', value: '17:00' },
      clockOutNotificationReminderEmail: { version: 'v21', value: false },
      notificationEnabledForDays: { version: 'v22', value: ['WEDNESDAY'] },
      notifyAdminOnClockOutOverrideEnabled: { version: 'v6', value: false },
      notifyManagerOnClockOutOverrideEnabled: { version: 'v7', value: false },
      notifyAdminOnTimeSheetNotesEditEnabled: { version: 'v8', value: false },
      notifyGroupManagerOnTimeSheetNotesEditEnabled: {
        version: 'v9',
        value: false,
      },
    };

    it('should create complete mutation payload when all fields are updated', () => {
      const updatedFields = [
        // Time tracking settings
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_SERVICE_ENABLE,
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.BILLING_RATE_FOR_TIME_ENABLED,
        TIME_TRACKING_SETTINGS.FIRST_DAY_OF_WEEK,

        // Core settings
        'requireBillable',

        // DateTime settings
        TIME_TRACKING_SETTINGS.TIME_ZONE,
        TIME_TRACKING_SETTINGS.TIME_FORMAT,

        // Timesheet management settings
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_NOTES_ENABLE,
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_EDITS_NOTES_ENABLED,
        TIME_TRACKING_SETTINGS.MANAGE_OWN_TIME_SHEETS_ENABLED,
        TIME_TRACKING_SETTINGS.EDIT_CLOCK_OUT_TIME_ENABLED,
        TIME_TRACKING_SETTINGS.CLOCK_OUT_OVERRIDE_HOURS,
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CUSTOMER_FOR_TIMESHEET_ENABLED,

        // Clock rounding settings
        CLOCK_ROUNDING_SETTINGS.CLOCK_IN_ROUND_DIRECTION,
        CLOCK_ROUNDING_SETTINGS.CLOCK_IN_ROUND_IN_MINUTE,
        CLOCK_ROUNDING_SETTINGS.CLOCK_OUT_ROUND_DIRECTION,
        CLOCK_ROUNDING_SETTINGS.CLOCK_OUT_ROUND_IN_MINUTE,

        // Notification settings
        'clockInNotificationReminderTime',
        'clockInNotificationReminderEmail',
        'clockInNotificationReminderMobile',
        'clockOutNotificationReminderTime',
        'clockOutNotificationReminderEmail',
        'notificationEnabledForDays',
        'notifyWhenClockInOutUpdated',
        'notifyWhenNotesAreAddedOrEdited',
      ];

      const result = mappedTimeEntrySettingsForMutation(
        mockFormState as ITimeEntrySettingsFormState,
        mockSettings as MappedQLSettings,
        updatedFields,
      );

      expect(result).toMatchObject({
        timeTrackingBillingEnabled: { version: 'v1', value: true },
        timeTrackingUseItemForTimeEnabled: { version: 'v2', value: true },
        timeTrackingBillingRateForTimeEnabled: { version: 'v3', value: true },
        timeTrackingStartWorkWeek: { version: 'v4', value: 1 },
        coreSettings: {
          requireBillable: { version: 'v5', value: true },
        },
        dateTimeSettings: {
          timeZone: { version: 'v6', value: 'America/Los_Angeles' },
          clockFormat: { version: 'v7', value: 12 },
        },
        timesheetManagementSettings: {
          notes: {
            enabled: { version: 'v8', value: true },
            editEnabled: { version: 'v9', value: true },
          },
          timesheet: {
            manageOwnTimesheetEnabled: { version: 'v10', value: true },
            editClockOutTimeEnabled: { version: 'v11', value: true },
            clockOutOverrideHours: { version: 'v12', value: 8 },
          },
          customFields: {
            customersEnabled: { version: 'v13', value: true },
          },
        },
        clockRoundingSettings: {
          startTimeRounding: {
            direction: { version: 'v14', value: 'UP' },
            roundInMin: { version: 'v15', value: 15 },
          },
          endTimeRounding: {
            direction: { version: 'v16', value: 'DOWN' },
            roundInMin: { version: 'v17', value: 30 },
          },
        },
        notificationSettings: {
          startShiftNotifications: {
            reminderTime: { version: 'v18', value: '08:00' },
            notificationMedium: {
              version: 'v19',
              value: [
                NotificationMedium.EMAIL,
                NotificationMedium.PUSH_NOTIFICATION,
              ],
            },
          },
          endShiftNotifications: {
            reminderTime: { version: 'v20', value: '17:00' },
            notificationMedium: {
              version: 'v21',
              value: [NotificationMedium.EMAIL],
            },
          },
          notificationEnabledForDays: {
            version: 'v22',
            value: ['MONDAY', 'TUESDAY'],
          },
          clockOutOverrideNotifications: {
            adminEnabled: { version: 'v6', value: true },
            groupManagerEnabled: { version: 'v7', value: true },
          },
          timesheetEditNotifications: {
            adminEnabled: { version: 'v8', value: true },
            groupManagerEnabled: { version: 'v9', value: false },
          },
        },
      });
    });

    it('should handle no updated fields', () => {
      const result = mappedTimeEntrySettingsForMutation(
        mockFormState as ITimeEntrySettingsFormState,
        mockSettings as MappedQLSettings,
        [],
      );

      expect(result).toEqual({
        timeTrackingBillingEnabled: undefined,
        timeTrackingUseItemForTimeEnabled: undefined,
        timeTrackingBillingRateForTimeEnabled: undefined,
        timeTrackingStartWorkWeek: undefined,
        coreSettings: undefined,
        dateTimeSettings: undefined,
        timesheetManagementSettings: undefined,
        clockRoundingSettings: undefined,
        notificationSettings: undefined,
      });
    });

    it('should handle partial updates across different setting groups', () => {
      const updatedFields = [
        // One field from each major group
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
        'requireBillable',
        TIME_TRACKING_SETTINGS.TIME_ZONE,
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_NOTES_ENABLE,
        CLOCK_ROUNDING_SETTINGS.CLOCK_IN_ROUND_DIRECTION,
        'clockInNotificationReminderTime',
      ];

      const result = mappedTimeEntrySettingsForMutation(
        mockFormState as ITimeEntrySettingsFormState,
        mockSettings as MappedQLSettings,
        updatedFields,
      );

      expect(result).toEqual({
        timeTrackingBillingEnabled: { version: 'v1', value: true },
        timeTrackingUseItemForTimeEnabled: undefined,
        timeTrackingBillingRateForTimeEnabled: undefined,
        timeTrackingStartWorkWeek: undefined,
        coreSettings: {
          requireBillable: { version: 'v5', value: true },
        },
        dateTimeSettings: {
          timeZone: { version: 'v6', value: 'America/Los_Angeles' },
        },
        timesheetManagementSettings: {
          notes: {
            enabled: { version: 'v8', value: true },
          },
        },
        clockRoundingSettings: {
          startTimeRounding: {
            direction: { version: 'v14', value: 'UP' },
          },
        },
        notificationSettings: {
          startShiftNotifications: {
            reminderTime: { version: 'v18', value: '08:00' },
          },
        },
      });
    });
  });

  describe('removeTimeEntryDirtyFieldsUtils', () => {
    const baseFormValue: IUpdateTimeEntrySettingResponse = {
      timeTrackingSupported: { version: '', value: true },
      transactionBillingForTimeEnabled: { version: '', value: true },
      transactionTimeTrackingEnabled: { version: '', value: true },
      isServiceFieldEnabled: { version: '', value: false },
      customersForTimeSheetEnabled: { version: '', value: false },
      isBillingFieldEnabled: { version: '', value: false },
      useItemForTime: { version: '', value: false },
      classForTimeSheetEnabled: { version: '', value: false },
      locationForTimeSheetEnabled: { version: '', value: false },
      timeSheetEntryNotesEnabled: { version: '', value: false },
      clockInNotificationReminderTime: { version: '', value: '08:00' },
      clockInNotificationReminderEmail: { version: '', value: false },
      clockInNotificationReminderMobile: { version: '', value: false },
      clockOutNotificationReminderTime: { version: '', value: '17:00' },
      clockOutNotificationReminderEmail: { version: '', value: false },
      clockOutNotificationReminderMobile: { version: '', value: false },
      notificationEnabledForDays: { version: '', value: [] },
      notifyAdminOnClockOutOverrideEnabled: { version: '', value: false },
      notifyManagerOnClockOutOverrideEnabled: { version: '', value: false },
      notifyAdminOnTimeSheetNotesEditEnabled: { version: '', value: false },
      notifyGroupManagerOnTimeSheetNotesEditEnabled: {
        version: '',
        value: false,
      },
      firstDayOfWeek: { version: '', value: 0 },
      timeZone: { version: '', value: '' },
      timeFormat: { version: '', value: 24 },
      splitTimeSheetAtMidnightEnabled: { version: '', value: false },
      manageOwnTimeSheetsEnabled: { version: '', value: false },
      editClockOutTimeEnabled: { version: '', value: false },
      clockOutOverrideHours: { version: '', value: 8 },
      clockInRoundDirection: { version: '', value: 'NEAREST' },
      clockInRoundInMin: { version: '', value: 1 },
      clockOutRoundDirection: { version: '', value: 'NEAREST' },
      clockOutRoundInMin: { version: '', value: 1 },
      billingRateForTimeEnabled: { version: '', value: false },
      requireBillable: { version: '', value: false },
      timeSheetEntryEditNotesEnabled: { version: '', value: false },
      timeSheetEntryMakesNotesRequiredEnabled: { version: '', value: false },
    };

    it('should correctly update form values with notification settings', () => {
      const mockTimeEntrySettingsFormMethod = {
        formState: {
          dirtyFields: {
            firstDayOfWeek: true,
            clockInNotificationReminderTime: true,
            clockOutNotificationReminderTime: true,
            notifyWhenClockInOutUpdated: true,
            notifyWhenNotesAreAddedOrEdited: true,
            isServiceFieldEnabled: true,
          },
        },
        setValue: jest.fn(),
      };

      const updatedFormValue: IUpdateTimeEntrySettingResponse = {
        ...baseFormValue,
        firstDayOfWeek: { version: '1', value: 1 },
        clockInNotificationReminderTime: { version: '2', value: '09:00' },
        clockOutNotificationReminderTime: { version: '3', value: '17:00' },
        notifyAdminOnClockOutOverrideEnabled: { version: '4', value: true },
        notifyManagerOnClockOutOverrideEnabled: { version: '4', value: true },
        notifyAdminOnTimeSheetNotesEditEnabled: { version: '5', value: true },
        notifyGroupManagerOnTimeSheetNotesEditEnabled: {
          version: '5',
          value: true,
        },
        useItemForTime: { version: '6', value: true },
      };

      removeTimeEntryDirtyFieldsUtils(
        mockTimeEntrySettingsFormMethod,
        updatedFormValue,
      );

      // Verify all setValue calls in order
      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledTimes(6);

      // First day of week
      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        'firstDayOfWeek',
        '1',
        { shouldDirty: false },
      );

      // Clock in notification time
      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        'clockInNotificationReminderTime',
        '9:00 AM',
        { shouldDirty: false },
      );

      // Clock out notification time
      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        'clockOutNotificationReminderTime',
        '5:00 PM',
        { shouldDirty: false },
      );

      // Clock in/out notifications - both admin and manager enabled
      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        'notifyWhenClockInOutUpdated',
        'adminsAndManagers',
        { shouldDirty: false },
      );

      // Notes notifications - both admin and manager enabled
      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        'notifyWhenNotesAreAddedOrEdited',
        'adminsAndManagers',
        { shouldDirty: false },
      );

      // Service field enabled
      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        'isServiceFieldEnabled',
        true,
        { shouldDirty: false },
      );

      // Verify dirty fields are removed
      expect(mockTimeEntrySettingsFormMethod.formState.dirtyFields).toEqual({});
    });

    it('should handle notification settings with different combinations', () => {
      const mockTimeEntrySettingsFormMethod = {
        formState: {
          dirtyFields: {
            notifyWhenClockInOutUpdated: true,
            notifyWhenNotesAreAddedOrEdited: true,
          },
        },
        setValue: jest.fn(),
      };

      // Test case 1: Only admin notifications enabled
      const adminOnlyFormValue: IUpdateTimeEntrySettingResponse = {
        ...baseFormValue,
        notifyAdminOnClockOutOverrideEnabled: { version: '1', value: true },
        notifyManagerOnClockOutOverrideEnabled: { version: '1', value: false },
        notifyAdminOnTimeSheetNotesEditEnabled: { version: '2', value: true },
        notifyGroupManagerOnTimeSheetNotesEditEnabled: {
          version: '2',
          value: false,
        },
      };

      removeTimeEntryDirtyFieldsUtils(
        mockTimeEntrySettingsFormMethod,
        adminOnlyFormValue,
      );

      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        'notifyWhenClockInOutUpdated',
        'adminsOnly',
        { shouldDirty: false },
      );

      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        'notifyWhenNotesAreAddedOrEdited',
        'adminsOnly',
        { shouldDirty: false },
      );

      // Reset mock
      jest.clearAllMocks();
      mockTimeEntrySettingsFormMethod.formState.dirtyFields = {
        notifyWhenClockInOutUpdated: true,
        notifyWhenNotesAreAddedOrEdited: true,
      };

      // Test case 2: Only manager notifications enabled
      const managerOnlyFormValue: IUpdateTimeEntrySettingResponse = {
        ...baseFormValue,
        notifyAdminOnClockOutOverrideEnabled: { version: '1', value: false },
        notifyManagerOnClockOutOverrideEnabled: { version: '1', value: true },
        notifyAdminOnTimeSheetNotesEditEnabled: { version: '2', value: false },
        notifyGroupManagerOnTimeSheetNotesEditEnabled: {
          version: '2',
          value: true,
        },
      };

      removeTimeEntryDirtyFieldsUtils(
        mockTimeEntrySettingsFormMethod,
        managerOnlyFormValue,
      );

      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        'notifyWhenClockInOutUpdated',
        'managersOnly',
        { shouldDirty: false },
      );

      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        'notifyWhenNotesAreAddedOrEdited',
        'managersOnly',
        { shouldDirty: false },
      );

      // Reset mock
      jest.clearAllMocks();
      mockTimeEntrySettingsFormMethod.formState.dirtyFields = {
        notifyWhenClockInOutUpdated: true,
        notifyWhenNotesAreAddedOrEdited: true,
      };

      // Test case 3: No notifications enabled
      const noNotificationsFormValue: IUpdateTimeEntrySettingResponse = {
        ...baseFormValue,
        notifyAdminOnClockOutOverrideEnabled: { version: '1', value: false },
        notifyManagerOnClockOutOverrideEnabled: { version: '1', value: false },
        notifyAdminOnTimeSheetNotesEditEnabled: { version: '2', value: false },
        notifyGroupManagerOnTimeSheetNotesEditEnabled: {
          version: '2',
          value: false,
        },
      };

      removeTimeEntryDirtyFieldsUtils(
        mockTimeEntrySettingsFormMethod,
        noNotificationsFormValue,
      );

      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        'notifyWhenClockInOutUpdated',
        'none',
        { shouldDirty: false },
      );

      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        'notifyWhenNotesAreAddedOrEdited',
        'none',
        { shouldDirty: false },
      );
    });

    it('should handle default field value cases correctly', () => {
      const mockTimeEntrySettingsFormMethod = {
        formState: {
          dirtyFields: {
            [TIME_TRACKING_SETTINGS.FIRST_DAY_OF_WEEK]: true,
            defaultFirstDayOfWeek: true, // This will hit the default case
            someEnabledField: true,
            someTimeField: true,
            otherField: true,
          },
        },
        setValue: jest.fn(),
      };

      // Mock the data structure to match the actual implementation
      const updatedFormValue = {
        timeTrackingSupported: { version: '', value: true },
        transactionBillingForTimeEnabled: { version: '', value: true },
        transactionTimeTrackingEnabled: { version: '', value: true },
        firstDayOfWeek: { version: '', value: undefined },
        someEnabledField: { version: '', value: undefined },
        someTimeField: { version: '', value: undefined },
        otherField: { version: '', value: undefined },
      } as unknown as MappedQLSettings;

      removeTimeEntryDirtyFieldsUtils(
        mockTimeEntrySettingsFormMethod,
        updatedFormValue,
      );

      // Verify each setValue call individually
      const setValueCalls = mockTimeEntrySettingsFormMethod.setValue.mock.calls;

      // Special case: TIME_TRACKING_SETTINGS.FIRST_DAY_OF_WEEK
      expect(setValueCalls).toContainEqual([
        'firstDayOfWeek',
        undefined,
        { shouldDirty: false },
      ]);

      // Default case: field name is 'defaultFirstDayOfWeek'
      expect(setValueCalls).toContainEqual([
        'defaultFirstDayOfWeek',
        [],
        { shouldDirty: false },
      ]);

      // Default case: field includes 'Enabled'
      expect(setValueCalls).toContainEqual([
        'someEnabledField',
        false,
        { shouldDirty: false },
      ]);

      // Default case: field includes 'Time'
      expect(setValueCalls).toContainEqual([
        'someTimeField',
        '',
        { shouldDirty: false },
      ]);

      // Default case: other fields
      expect(setValueCalls).toContainEqual([
        'otherField',
        [],
        { shouldDirty: false },
      ]);
    });

    it('should handle clock in notification time field correctly for UK locale', () => {
      const mockTimeEntrySettingsFormMethod = {
        formState: {
          dirtyFields: {
            [NotificationField.CLOCK_IN_TIME]: true,
          },
        },
        setValue: jest.fn(),
      };

      // Test case 1: With time value in UK locale
      const updatedFormValueWithTime: IUpdateTimeEntrySettingResponse = {
        ...baseFormValue,
        clockInNotificationReminderTime: { version: '1', value: '09:30' },
      };

      removeTimeEntryDirtyFieldsUtils(
        mockTimeEntrySettingsFormMethod,
        updatedFormValueWithTime,
        true, // UK locale
      );

      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        'clockInNotificationReminderTime',
        '09:30',
        { shouldDirty: false },
      );

      // Reset for next test
      jest.clearAllMocks();
      mockTimeEntrySettingsFormMethod.formState.dirtyFields = {
        [NotificationField.CLOCK_IN_TIME]: true,
      };

      // Test case 2: Without time value in UK locale (empty string uses default)
      const updatedFormValueWithoutTime: IUpdateTimeEntrySettingResponse = {
        ...baseFormValue,
        clockInNotificationReminderTime: { version: '1', value: '' },
      };

      removeTimeEntryDirtyFieldsUtils(
        mockTimeEntrySettingsFormMethod,
        updatedFormValueWithoutTime,
        true, // UK locale
      );

      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        'clockInNotificationReminderTime',
        '8:00',
        { shouldDirty: false },
      );

      // Reset for next test
      jest.clearAllMocks();
      mockTimeEntrySettingsFormMethod.formState.dirtyFields = {
        [NotificationField.CLOCK_IN_TIME]: true,
      };

      // Test case 3: With undefined time value in UK locale (should use default)
      const updatedFormValueUndefinedTime: IUpdateTimeEntrySettingResponse = {
        ...baseFormValue,
        clockInNotificationReminderTime: {
          version: '1',
          value: undefined as any,
        },
      };

      removeTimeEntryDirtyFieldsUtils(
        mockTimeEntrySettingsFormMethod,
        updatedFormValueUndefinedTime,
        true, // UK locale
      );

      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        'clockInNotificationReminderTime',
        '8:00',
        { shouldDirty: false },
      );
    });

    it('should handle clock in notification time field correctly for non-UK locale', () => {
      const mockTimeEntrySettingsFormMethod = {
        formState: {
          dirtyFields: {
            [NotificationField.CLOCK_IN_TIME]: true,
          },
        },
        setValue: jest.fn(),
      };

      // Test case 1: With time value in non-UK locale
      const updatedFormValueWithTime: IUpdateTimeEntrySettingResponse = {
        ...baseFormValue,
        clockInNotificationReminderTime: { version: '1', value: '14:30' },
      };

      removeTimeEntryDirtyFieldsUtils(
        mockTimeEntrySettingsFormMethod,
        updatedFormValueWithTime,
        false, // non-UK locale
      );

      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        'clockInNotificationReminderTime',
        '2:30 PM',
        { shouldDirty: false },
      );

      // Reset for next test
      jest.clearAllMocks();
      mockTimeEntrySettingsFormMethod.formState.dirtyFields = {
        [NotificationField.CLOCK_IN_TIME]: true,
      };

      // Test case 2: Without time value in non-UK locale (empty string uses default)
      const updatedFormValueWithoutTime: IUpdateTimeEntrySettingResponse = {
        ...baseFormValue,
        clockInNotificationReminderTime: { version: '1', value: '' },
      };

      removeTimeEntryDirtyFieldsUtils(
        mockTimeEntrySettingsFormMethod,
        updatedFormValueWithoutTime,
        false, // non-UK locale
      );

      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        'clockInNotificationReminderTime',
        '8:00 AM',
        { shouldDirty: false },
      );

      // Reset for next test
      jest.clearAllMocks();
      mockTimeEntrySettingsFormMethod.formState.dirtyFields = {
        [NotificationField.CLOCK_IN_TIME]: true,
      };

      // Test case 3: With undefined time value in non-UK locale (should use default)
      const updatedFormValueUndefinedTime: IUpdateTimeEntrySettingResponse = {
        ...baseFormValue,
        clockInNotificationReminderTime: {
          version: '1',
          value: undefined as any,
        },
      };

      removeTimeEntryDirtyFieldsUtils(
        mockTimeEntrySettingsFormMethod,
        updatedFormValueUndefinedTime,
        false, // non-UK locale
      );

      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        'clockInNotificationReminderTime',
        '8:00 AM',
        { shouldDirty: false },
      );
    });

    it('should handle clock out notification time field correctly for UK locale', () => {
      const mockTimeEntrySettingsFormMethod = {
        formState: {
          dirtyFields: {
            [NotificationField.CLOCK_OUT_TIME]: true,
          },
        },
        setValue: jest.fn(),
      };

      // Test case 1: With time value in UK locale
      const updatedFormValueWithTime: IUpdateTimeEntrySettingResponse = {
        ...baseFormValue,
        clockOutNotificationReminderTime: { version: '1', value: '18:45' },
      };

      removeTimeEntryDirtyFieldsUtils(
        mockTimeEntrySettingsFormMethod,
        updatedFormValueWithTime,
        true, // UK locale
      );

      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        'clockOutNotificationReminderTime',
        '18:45',
        { shouldDirty: false },
      );

      // Reset for next test
      jest.clearAllMocks();
      mockTimeEntrySettingsFormMethod.formState.dirtyFields = {
        [NotificationField.CLOCK_OUT_TIME]: true,
      };

      // Test case 2: Without time value in UK locale (empty string uses default)
      const updatedFormValueWithoutTime: IUpdateTimeEntrySettingResponse = {
        ...baseFormValue,
        clockOutNotificationReminderTime: { version: '1', value: '' },
      };

      removeTimeEntryDirtyFieldsUtils(
        mockTimeEntrySettingsFormMethod,
        updatedFormValueWithoutTime,
        true, // UK locale
      );

      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        'clockOutNotificationReminderTime',
        '17:00',
        { shouldDirty: false },
      );

      // Reset for next test
      jest.clearAllMocks();
      mockTimeEntrySettingsFormMethod.formState.dirtyFields = {
        [NotificationField.CLOCK_OUT_TIME]: true,
      };

      // Test case 3: With undefined time value in UK locale (should use default)
      const updatedFormValueUndefinedTime: IUpdateTimeEntrySettingResponse = {
        ...baseFormValue,
        clockOutNotificationReminderTime: {
          version: '1',
          value: undefined as any,
        },
      };

      removeTimeEntryDirtyFieldsUtils(
        mockTimeEntrySettingsFormMethod,
        updatedFormValueUndefinedTime,
        true, // UK locale
      );

      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        'clockOutNotificationReminderTime',
        '17:00',
        { shouldDirty: false },
      );
    });

    it('should handle clock out notification time field correctly for non-UK locale', () => {
      const mockTimeEntrySettingsFormMethod = {
        formState: {
          dirtyFields: {
            [NotificationField.CLOCK_OUT_TIME]: true,
          },
        },
        setValue: jest.fn(),
      };

      // Test case 1: With time value in non-UK locale
      const updatedFormValueWithTime: IUpdateTimeEntrySettingResponse = {
        ...baseFormValue,
        clockOutNotificationReminderTime: { version: '1', value: '16:30' },
      };

      removeTimeEntryDirtyFieldsUtils(
        mockTimeEntrySettingsFormMethod,
        updatedFormValueWithTime,
        false, // non-UK locale
      );

      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        'clockOutNotificationReminderTime',
        '4:30 PM',
        { shouldDirty: false },
      );

      // Reset for next test
      jest.clearAllMocks();
      mockTimeEntrySettingsFormMethod.formState.dirtyFields = {
        [NotificationField.CLOCK_OUT_TIME]: true,
      };

      // Test case 2: Without time value in non-UK locale (empty string uses default)
      const updatedFormValueWithoutTime: IUpdateTimeEntrySettingResponse = {
        ...baseFormValue,
        clockOutNotificationReminderTime: { version: '1', value: '' },
      };

      removeTimeEntryDirtyFieldsUtils(
        mockTimeEntrySettingsFormMethod,
        updatedFormValueWithoutTime,
        false, // non-UK locale
      );

      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        'clockOutNotificationReminderTime',
        '5:00 PM',
        { shouldDirty: false },
      );

      // Reset for next test
      jest.clearAllMocks();
      mockTimeEntrySettingsFormMethod.formState.dirtyFields = {
        [NotificationField.CLOCK_OUT_TIME]: true,
      };

      // Test case 3: With undefined time value in non-UK locale (should use default)
      const updatedFormValueUndefinedTime: IUpdateTimeEntrySettingResponse = {
        ...baseFormValue,
        clockOutNotificationReminderTime: {
          version: '1',
          value: undefined as any,
        },
      };

      removeTimeEntryDirtyFieldsUtils(
        mockTimeEntrySettingsFormMethod,
        updatedFormValueUndefinedTime,
        false, // non-UK locale
      );

      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        'clockOutNotificationReminderTime',
        '5:00 PM',
        { shouldDirty: false },
      );
    });

    it('should handle edge cases for clock in/out notification time fields', () => {
      const mockTimeEntrySettingsFormMethod = {
        formState: {
          dirtyFields: {
            [NotificationField.CLOCK_IN_TIME]: true,
            [NotificationField.CLOCK_OUT_TIME]: true,
          },
        },
        setValue: jest.fn(),
      };

      // Test case 1: midnight times
      const updatedFormValueMidnight: IUpdateTimeEntrySettingResponse = {
        ...baseFormValue,
        clockInNotificationReminderTime: { version: '1', value: '00:00' },
        clockOutNotificationReminderTime: { version: '1', value: '00:00' },
      };

      removeTimeEntryDirtyFieldsUtils(
        mockTimeEntrySettingsFormMethod,
        updatedFormValueMidnight,
        false, // non-UK locale
      );

      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        'clockInNotificationReminderTime',
        '12:00 AM',
        { shouldDirty: false },
      );

      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        'clockOutNotificationReminderTime',
        '12:00 AM',
        { shouldDirty: false },
      );

      // Reset for next test
      jest.clearAllMocks();
      mockTimeEntrySettingsFormMethod.formState.dirtyFields = {
        [NotificationField.CLOCK_IN_TIME]: true,
        [NotificationField.CLOCK_OUT_TIME]: true,
      };

      // Test case 2: noon times
      const updatedFormValueNoon: IUpdateTimeEntrySettingResponse = {
        ...baseFormValue,
        clockInNotificationReminderTime: { version: '1', value: '12:00' },
        clockOutNotificationReminderTime: { version: '1', value: '12:00' },
      };

      removeTimeEntryDirtyFieldsUtils(
        mockTimeEntrySettingsFormMethod,
        updatedFormValueNoon,
        false, // non-UK locale
      );

      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        'clockInNotificationReminderTime',
        '12:00 PM',
        { shouldDirty: false },
      );

      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        'clockOutNotificationReminderTime',
        '12:00 PM',
        { shouldDirty: false },
      );

      // Reset for next test
      jest.clearAllMocks();
      mockTimeEntrySettingsFormMethod.formState.dirtyFields = {
        [NotificationField.CLOCK_IN_TIME]: true,
        [NotificationField.CLOCK_OUT_TIME]: true,
      };

      // Test case 3: null values (uses default)
      const updatedFormValueNull: IUpdateTimeEntrySettingResponse = {
        ...baseFormValue,
        clockInNotificationReminderTime: { version: '1', value: null as any },
        clockOutNotificationReminderTime: { version: '1', value: null as any },
      };

      removeTimeEntryDirtyFieldsUtils(
        mockTimeEntrySettingsFormMethod,
        updatedFormValueNull,
        false, // non-UK locale
      );

      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        'clockInNotificationReminderTime',
        '8:00 AM',
        { shouldDirty: false },
      );

      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        'clockOutNotificationReminderTime',
        '5:00 PM',
        { shouldDirty: false },
      );
    });

    it('should handle fallback behavior when time evaluation is falsy', () => {
      // This test covers the theoretical case where the time would be falsy after the OR operation
      // In practice, this is unlikely to happen due to the hardcoded defaults, but we test it for completeness
      const mockTimeEntrySettingsFormMethod = {
        formState: {
          dirtyFields: {
            [NotificationField.CLOCK_IN_TIME]: true,
            [NotificationField.CLOCK_OUT_TIME]: true,
          },
        },
        setValue: jest.fn(),
      };

      // Mock the getFieldValue function to test the fallback behavior
      const originalGetFieldValue =
        require('../../../../../src/js/widgets/timeTrackingSettings/hooks/useTimeEntrySettingsForm').getFieldValue;

      // Create a scenario where time would be falsy by mocking the data structure
      const updatedFormValueWithMissingTime: IUpdateTimeEntrySettingResponse = {
        ...baseFormValue,
        // Setting up a scenario where the default values would be overridden in the code
        clockInNotificationReminderTime: { version: '1', value: false as any },
        clockOutNotificationReminderTime: { version: '1', value: false as any },
      };

      removeTimeEntryDirtyFieldsUtils(
        mockTimeEntrySettingsFormMethod,
        updatedFormValueWithMissingTime,
        true, // UK locale
      );

      // Since false || '8:00' results in '8:00', the actual behavior will still use defaults
      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        'clockInNotificationReminderTime',
        '8:00',
        { shouldDirty: false },
      );

      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        'clockOutNotificationReminderTime',
        '17:00',
        { shouldDirty: false },
      );

      // Test non-UK locale as well
      jest.clearAllMocks();
      mockTimeEntrySettingsFormMethod.formState.dirtyFields = {
        [NotificationField.CLOCK_IN_TIME]: true,
        [NotificationField.CLOCK_OUT_TIME]: true,
      };

      removeTimeEntryDirtyFieldsUtils(
        mockTimeEntrySettingsFormMethod,
        updatedFormValueWithMissingTime,
        false, // non-UK locale
      );

      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        'clockInNotificationReminderTime',
        '8:00 AM',
        { shouldDirty: false },
      );

      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        'clockOutNotificationReminderTime',
        '5:00 PM',
        { shouldDirty: false },
      );
    });

    it('should return early when updatedFormValue is undefined', () => {
      const mockTimeEntrySettingsFormMethod = {
        formState: {
          dirtyFields: {
            firstDayOfWeek: true,
            clockInNotificationReminderTime: true,
          },
        },
        setValue: jest.fn(),
      };

      // Call with undefined updatedFormValue
      removeTimeEntryDirtyFieldsUtils(
        mockTimeEntrySettingsFormMethod,
        undefined,
      );

      // Verify setValue was never called
      expect(mockTimeEntrySettingsFormMethod.setValue).not.toHaveBeenCalled();

      // Verify dirty fields remain unchanged
      expect(mockTimeEntrySettingsFormMethod.formState.dirtyFields).toEqual({
        firstDayOfWeek: true,
        clockInNotificationReminderTime: true,
      });
    });

    it('should return early when updatedFormValue is null', () => {
      const mockTimeEntrySettingsFormMethod = {
        formState: {
          dirtyFields: {
            firstDayOfWeek: true,
            clockInNotificationReminderTime: true,
          },
        },
        setValue: jest.fn(),
      };

      // Call with null updatedFormValue
      removeTimeEntryDirtyFieldsUtils(
        mockTimeEntrySettingsFormMethod,
        null as any,
      );

      // Verify setValue was never called
      expect(mockTimeEntrySettingsFormMethod.setValue).not.toHaveBeenCalled();

      // Verify dirty fields remain unchanged
      expect(mockTimeEntrySettingsFormMethod.formState.dirtyFields).toEqual({
        firstDayOfWeek: true,
        clockInNotificationReminderTime: true,
      });
    });

    it('should correctly handle CUSTOM_MESSAGE field with value', () => {
      const mockTimeEntrySettingsFormMethod = {
        formState: {
          dirtyFields: {
            customMessage: true,
          },
        },
        setValue: jest.fn(),
      };

      const updatedFormValue: any = {
        ...baseFormValue,
        customMessage: { version: '1', value: 'Custom approval message text' },
      };

      removeTimeEntryDirtyFieldsUtils(
        mockTimeEntrySettingsFormMethod,
        updatedFormValue,
      );

      // Verify setValue was called with the custom message
      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        'customMessage',
        'Custom approval message text',
        { shouldDirty: false },
      );

      // Verify the dirty field was deleted
      expect(mockTimeEntrySettingsFormMethod.formState.dirtyFields).toEqual({});
    });

    it('should correctly handle CUSTOM_MESSAGE field with empty string', () => {
      const mockTimeEntrySettingsFormMethod = {
        formState: {
          dirtyFields: {
            customMessage: true,
          },
        },
        setValue: jest.fn(),
      };

      const updatedFormValue: any = {
        ...baseFormValue,
        customMessage: { version: '1', value: '' },
      };

      removeTimeEntryDirtyFieldsUtils(
        mockTimeEntrySettingsFormMethod,
        updatedFormValue,
      );

      // Verify setValue was called with empty string
      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        'customMessage',
        '',
        { shouldDirty: false },
      );

      // Verify the dirty field was deleted
      expect(mockTimeEntrySettingsFormMethod.formState.dirtyFields).toEqual({});
    });

    it('should correctly handle CUSTOM_MESSAGE field when value is undefined', () => {
      const mockTimeEntrySettingsFormMethod = {
        formState: {
          dirtyFields: {
            customMessage: true,
          },
        },
        setValue: jest.fn(),
      };

      const updatedFormValue: any = {
        ...baseFormValue,
        customMessage: { version: '1', value: undefined },
      };

      removeTimeEntryDirtyFieldsUtils(
        mockTimeEntrySettingsFormMethod,
        updatedFormValue,
      );

      // Verify setValue was called with empty string (fallback)
      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        'customMessage',
        '',
        { shouldDirty: false },
      );

      // Verify the dirty field was deleted
      expect(mockTimeEntrySettingsFormMethod.formState.dirtyFields).toEqual({});
    });

    it('should correctly handle CUSTOM_MESSAGE field when customMessage object is undefined', () => {
      const mockTimeEntrySettingsFormMethod = {
        formState: {
          dirtyFields: {
            customMessage: true,
          },
        },
        setValue: jest.fn(),
      };

      const updatedFormValue: any = {
        ...baseFormValue,
        customMessage: undefined,
      };

      removeTimeEntryDirtyFieldsUtils(
        mockTimeEntrySettingsFormMethod,
        updatedFormValue,
      );

      // Verify setValue was called with empty string (fallback)
      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        'customMessage',
        '',
        { shouldDirty: false },
      );

      // Verify the dirty field was deleted
      expect(mockTimeEntrySettingsFormMethod.formState.dirtyFields).toEqual({});
    });

    it('restores a dirty schedule channel field from the snapshot subscriptions', () => {
      const mockTimeEntrySettingsFormMethod = {
        formState: {
          dirtyFields: {
            [NotificationFieldKey.SCHEDULE_ONE_HOUR_CHANNELS]: true,
          },
        },
        setValue: jest.fn(),
      };

      const updatedFormValue: IUpdateTimeEntrySettingResponse = {
        ...baseFormValue,
        scheduleNotificationSubscriptions: [
          {
            notificationType: TimeTracking_NotificationType.ShiftStartBefore,
            distributionMethods: [
              TimeTracking_NotificationReminderMedium.Email,
              TimeTracking_NotificationReminderMedium.PushNotification,
            ],
            meta: { version: 'before-1' },
          },
        ],
      } as unknown as IUpdateTimeEntrySettingResponse;

      removeTimeEntryDirtyFieldsUtils(
        mockTimeEntrySettingsFormMethod,
        updatedFormValue,
      );

      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        NotificationFieldKey.SCHEDULE_ONE_HOUR_CHANNELS,
        [
          TimeTracking_NotificationReminderMedium.Email,
          TimeTracking_NotificationReminderMedium.PushNotification,
        ],
        { shouldDirty: false },
      );
    });

    it('restores a dirty schedule channel field to [] when snapshot subscriptions is null', () => {
      const mockTimeEntrySettingsFormMethod = {
        formState: {
          dirtyFields: {
            [NotificationFieldKey.SCHEDULE_SHIFT_PUBLISHED_CHANNELS]: true,
          },
        },
        setValue: jest.fn(),
      };

      const updatedFormValue: IUpdateTimeEntrySettingResponse = {
        ...baseFormValue,
        scheduleNotificationSubscriptions: null,
      } as unknown as IUpdateTimeEntrySettingResponse;

      removeTimeEntryDirtyFieldsUtils(
        mockTimeEntrySettingsFormMethod,
        updatedFormValue,
      );

      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        NotificationFieldKey.SCHEDULE_SHIFT_PUBLISHED_CHANNELS,
        [],
        { shouldDirty: false },
      );
    });

    it('resets dimensions toggle state and customDimensions after save when dimensions is dirty', () => {
      const customDimensions = [
        {
          dimensionDefinitionId: '1000000023',
          enabledForTimeTracking: { version: '1', value: true },
          required: { version: '2', value: false },
        },
      ];
      const dimensionDefinitions = [
        { id: '1000000023', label: 'Department', active: true },
      ];
      const mockTimeEntrySettingsFormMethod = {
        formState: {
          dirtyFields: {
            [DIMENSIONS_FORM_NAME]: true,
          },
        },
        getValues: jest.fn((field: string) =>
          field === 'dimensionDefinitions' ? dimensionDefinitions : undefined,
        ),
        setValue: jest.fn(),
      };

      removeTimeEntryDirtyFieldsUtils(mockTimeEntrySettingsFormMethod, {
        ...baseFormValue,
        customDimensions,
      } as unknown as IUpdateTimeEntrySettingResponse);

      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        DIMENSIONS_FORM_NAME,
        {
          '1000000023': { enabled: true, required: false },
        },
        { shouldDirty: false },
      );
      expect(mockTimeEntrySettingsFormMethod.setValue).toHaveBeenCalledWith(
        'customDimensions',
        customDimensions,
        { shouldDirty: false },
      );
      expect(
        mockTimeEntrySettingsFormMethod.formState.dirtyFields[
          DIMENSIONS_FORM_NAME
        ],
      ).toBeUndefined();
    });
  });

  describe('mapGetQlSettingsData', () => {
    describe('Positive Paths - First Conditions', () => {
      it('should map all fields when result contains complete data', () => {
        const mockResult = {
          notificationSettings: {
            startShiftNotifications: {
              reminderTime: {
                value: '09:00',
                meta: { version: '1' },
              },
              notificationMedium: {
                value: ['EMAIL', 'PUSH_NOTIFICATION'],
                meta: { version: '2' },
              },
            },
            endShiftNotifications: {
              reminderTime: {
                value: '17:00',
                meta: { version: '3' },
              },
              notificationMedium: {
                value: ['EMAIL'],
                meta: { version: '4' },
              },
            },
            notificationEnabledForDays: {
              value: ['MONDAY', 'TUESDAY'],
              meta: { version: '5' },
            },
            clockOutOverrideNotifications: {
              adminEnabled: {
                value: true,
                meta: { version: '6' },
              },
              groupManagerEnabled: {
                value: true,
                meta: { version: '7' },
              },
            },
            timesheetEditNotifications: {
              adminEnabled: {
                value: true,
                meta: { version: '8' },
              },
              groupManagerEnabled: {
                value: true,
                meta: { version: '9' },
              },
            },
          },
          startWorkWeek: {
            value: Common_DayOfWeek.Monday,
            meta: { version: '10' },
          },
          dateTimeSettings: {
            timeZone: {
              value: 'America/New_York',
              meta: { version: '11' },
            },
            clockFormat: {
              value: 24,
              meta: { version: '12' },
            },
          },
          timesheetManagementSettings: {
            timesheet: {
              splitAtMidnightEnabled: {
                value: true,
                meta: { version: '13' },
              },
              manageOwnTimesheetEnabled: {
                value: true,
                meta: { version: '14' },
              },
              mobileTimeTrackingEnabled: {
                value: true,
                meta: { version: '14a' },
              },
              signatureCaptureEnabled: {
                value: true,
                meta: { version: '14b' },
              },
              editClockOutTimeEnabled: {
                value: true,
                meta: { version: '15' },
              },
              clockOutOverrideHours: {
                value: 8,
                meta: { version: '16' },
              },
            },
            notes: {
              enabled: {
                value: true,
                meta: { version: '17' },
              },
              editEnabled: {
                value: true,
                meta: { version: '18' },
              },
              requiredEnabled: {
                value: true,
                meta: { version: '19' },
              },
            },
            customFields: {
              customersEnabled: {
                value: true,
                meta: { version: '20' },
              },
              classEnabled: {
                value: true,
                meta: { version: '21' },
              },
              locationEnabled: {
                value: true,
                meta: { version: '22' },
              },
            },
          },
          clockRoundingSettings: {
            startTimeRounding: {
              direction: {
                value: 'UP',
                meta: { version: '23' },
              },
              roundInMin: {
                value: 15,
                meta: { version: '24' },
              },
            },
            endTimeRounding: {
              direction: {
                value: 'DOWN',
                meta: { version: '25' },
              },
              roundInMin: {
                value: 15,
                meta: { version: '26' },
              },
            },
          },
          billingForTimeEnabled: {
            value: true,
            meta: { version: '27' },
          },
          billingRateForTimeEnabled: {
            value: true,
            meta: { version: '28' },
          },
          useItemForTime: {
            value: true,
            meta: { version: '29' },
          },
          coreSettings: {
            requireBillable: {
              value: true,
              meta: { version: '30' },
            },
          },
        };

        const updatedFields = [
          'clockInNotificationReminderTime',
          'clockInNotificationReminderEmail',
          'clockInNotificationReminderMobile',
          'clockOutNotificationReminderTime',
          'clockOutNotificationReminderEmail',
          'clockOutNotificationReminderMobile',
          'notificationEnabledForDays',
          'notifyWhenClockInOutUpdated',
          'notifyWhenNotesAreAddedOrEdited',
          'firstDayOfWeek',
          'timeZone',
          'timeFormat',
          'splitTimeSheetAtMidnightEnabled',
          'manageOwnTimeSheetsEnabled',
          'mobileTimeTrackingEnabled',
          'signatureCaptureEnabled',
          'editClockOutTimeEnabled',
          'clockOutOverrideHours',
          'clockInRoundDirection',
          'clockInRoundInMin',
          'clockOutRoundDirection',
          'clockOutRoundInMin',
          'customersForTimeSheetEnabled',
          'isBillingFieldEnabled',
          'billingRateForTimeEnabled',
          'requireBillable',
          'isServiceFieldEnabled',
          'classForTimeSheetEnabled',
          'locationForTimeSheetEnabled',
          'timeSheetEntryNotesEnabled',
          'timeSheetEntryEditNotesEnabled',
          'timeSheetEntryMakesNotesRequiredEnabled',
        ];

        const result = mapGetQlSettingsData(mockResult, updatedFields);

        // Verify all fields are mapped correctly with their versions and values
        expect(result.clockInNotificationReminderTime).toEqual({
          version: '1',
          value: '09:00',
        });
        expect(result.clockInNotificationReminderEmail).toEqual({
          version: '2',
          value: true,
        });
        expect(result.clockInNotificationReminderMobile).toEqual({
          version: '2',
          value: true,
        });
        expect(result.clockOutNotificationReminderTime).toEqual({
          version: '3',
          value: '17:00',
        });
        expect(result.clockOutNotificationReminderEmail).toEqual({
          version: '4',
          value: true,
        });
        expect(result.clockOutNotificationReminderMobile).toEqual({
          version: '4',
          value: false,
        });
        expect(result.notificationEnabledForDays).toEqual({
          version: '5',
          value: ['MONDAY', 'TUESDAY'],
        });
        expect(result.notifyAdminOnClockOutOverrideEnabled).toEqual({
          version: '6',
          value: true,
        });
        expect(result.notifyManagerOnClockOutOverrideEnabled).toEqual({
          version: '7',
          value: true,
        });
        expect(result.notifyAdminOnTimeSheetNotesEditEnabled).toEqual({
          version: '8',
          value: true,
        });
        expect(result.notifyGroupManagerOnTimeSheetNotesEditEnabled).toEqual({
          version: '9',
          value: true,
        });
        expect(result.firstDayOfWeek).toEqual({
          version: '10',
          value: 1,
        });
        expect(result.timeZone).toEqual({
          version: '11',
          value: 'America/New_York',
        });
        expect(result.timeFormat).toEqual({
          version: '12',
          value: 24,
        });
        expect(result.splitTimeSheetAtMidnightEnabled).toEqual({
          version: '13',
          value: true,
        });
        expect(result.manageOwnTimeSheetsEnabled).toEqual({
          version: '14',
          value: true,
        });
        expect(result.mobileTimeTrackingEnabled).toEqual({
          version: '14a',
          value: true,
        });
        expect(result.signatureCaptureEnabled).toEqual({
          version: '14b',
          value: true,
        });
        expect(result.editClockOutTimeEnabled).toEqual({
          version: '15',
          value: true,
        });
        expect(result.clockOutOverrideHours).toEqual({
          version: '16',
          value: 8,
        });
        expect(result.timeSheetEntryNotesEnabled).toEqual({
          version: '17',
          value: true,
        });
        expect(result.timeSheetEntryEditNotesEnabled).toEqual({
          version: '18',
          value: true,
        });
        expect(result.timeSheetEntryMakesNotesRequiredEnabled).toEqual({
          version: '19',
          value: true,
        });
        expect(result.customersForTimeSheetEnabled).toEqual({
          version: '20',
          value: true,
        });
        expect(result.classForTimeSheetEnabled).toEqual({
          version: '21',
          value: true,
        });
        expect(result.locationForTimeSheetEnabled).toEqual({
          version: '22',
          value: true,
        });
        expect(result.clockInRoundDirection).toEqual({
          version: '23',
          value: 'UP',
        });
        expect(result.clockInRoundInMin).toEqual({
          version: '24',
          value: 15,
        });
        expect(result.clockOutRoundDirection).toEqual({
          version: '25',
          value: 'DOWN',
        });
        expect(result.clockOutRoundInMin).toEqual({
          version: '26',
          value: 15,
        });
        expect(result.isBillingFieldEnabled).toEqual({
          version: '27',
          value: true,
        });
        expect(result.billingRateForTimeEnabled).toEqual({
          version: '28',
          value: true,
        });
        expect(result.useItemForTime).toEqual({
          version: '29',
          value: true,
        });
        expect(result.requireBillable).toEqual({
          version: '30',
          value: true,
        });
      });
    });

    it('should use updatedTimeEntryFormValue when field not in updatedFields', () => {
      const result = {};
      const updatedFields: string[] = ['someOtherField'];
      const updatedTimeEntryFormValue = {
        clockInNotificationReminderTime: {
          version: '123',
          value: '08:00',
        },
      } as IUpdateTimeEntrySettingResponse;

      const mappedData = mapGetQlSettingsData(
        result,
        updatedFields,
        updatedTimeEntryFormValue,
      );

      expect(mappedData.clockInNotificationReminderTime.version).toBe('123');
      expect(mappedData.clockInNotificationReminderTime.value).toBe('08:00');
    });

    it('should return empty string for version when field not in updatedFields and no updatedTimeEntryFormValue', () => {
      const result = {
        notificationSettings: {
          startShiftNotifications: {
            reminderTime: {
              meta: {
                version: '123',
              },
              value: '08:00',
            },
          },
        },
      };

      const updatedFields: string[] = []; // Empty array means clockInNotificationReminderTime not in updatedFields
      const updatedTimeEntryFormValue = undefined; // No updatedTimeEntryFormValue provided

      const mappedData = mapGetQlSettingsData(
        result,
        updatedFields,
        updatedTimeEntryFormValue,
      );

      expect(mappedData.clockInNotificationReminderTime.version).toBe('');
      expect(mappedData.clockInNotificationReminderTime.value).toBe('8:00');
    });

    describe('scheduleNotificationSubscriptions merge', () => {
      const priorSubs = [
        {
          notificationType: TimeTracking_NotificationType.ShiftPublished,
          distributionMethods: [TimeTracking_NotificationReminderMedium.Email],
          meta: { version: 'pub-1' },
        },
        {
          notificationType: TimeTracking_NotificationType.ShiftStartBefore,
          distributionMethods: [TimeTracking_NotificationReminderMedium.Email],
          meta: { version: 'before-1' },
        },
      ];

      it('merges only-affected returned rows over the prior snapshot, preserving untouched rows', () => {
        // Mutation responds with ONLY the changed row (SHIFT_START_BEFORE).
        const result = {
          notificationSettings: {
            scheduleNotifications: {
              subscriptions: [
                {
                  notificationType:
                    TimeTracking_NotificationType.ShiftStartBefore,
                  distributionMethods: [
                    TimeTracking_NotificationReminderMedium.Email,
                    TimeTracking_NotificationReminderMedium.PushNotification,
                  ],
                  meta: { version: 'before-2' },
                },
              ],
            },
          },
        };

        const mapped = mapGetQlSettingsData(result, [], {
          scheduleNotificationSubscriptions: priorSubs,
        } as unknown as IUpdateTimeEntrySettingResponse);

        const byType = new Map(
          (mapped.scheduleNotificationSubscriptions ?? []).map((s) => [
            s.notificationType,
            s,
          ]),
        );
        // Untouched SHIFT_PUBLISHED preserved from the prior snapshot.
        expect(
          byType.get(TimeTracking_NotificationType.ShiftPublished),
        ).toMatchObject({ meta: { version: 'pub-1' } });
        // Changed SHIFT_START_BEFORE updated from the result.
        expect(
          byType.get(TimeTracking_NotificationType.ShiftStartBefore),
        ).toMatchObject({
          meta: { version: 'before-2' },
          distributionMethods: [
            TimeTracking_NotificationReminderMedium.Email,
            TimeTracking_NotificationReminderMedium.PushNotification,
          ],
        });
        // No rows dropped.
        expect(mapped.scheduleNotificationSubscriptions).toHaveLength(2);
      });

      it('falls back to the prior snapshot when the result has no subscriptions', () => {
        const mapped = mapGetQlSettingsData({ notificationSettings: {} }, [], {
          scheduleNotificationSubscriptions: priorSubs,
        } as unknown as IUpdateTimeEntrySettingResponse);
        expect(mapped.scheduleNotificationSubscriptions).toEqual(priorSubs);
      });

      it('falls back to the prior snapshot when the result subscriptions is null', () => {
        const result = {
          notificationSettings: {
            scheduleNotifications: { subscriptions: null },
          },
        };
        const mapped = mapGetQlSettingsData(result, [], {
          scheduleNotificationSubscriptions: priorSubs,
        } as unknown as IUpdateTimeEntrySettingResponse);
        expect(mapped.scheduleNotificationSubscriptions).toEqual(priorSubs);
      });

      it('returns [] when both the result and the prior snapshot are null (no subscriptions yet)', () => {
        const result = {
          notificationSettings: {
            scheduleNotifications: { subscriptions: null },
          },
        };
        const mapped = mapGetQlSettingsData(result, [], {
          scheduleNotificationSubscriptions: null,
        } as unknown as IUpdateTimeEntrySettingResponse);
        expect(mapped.scheduleNotificationSubscriptions).toEqual([]);
      });
    });

    describe('customDimensions', () => {
      const wireCustomDimensions = [
        {
          dimensionDefinition: { id: '1000000023' },
          enabledForTimeTracking: { meta: { version: '1' }, value: true },
          required: { meta: { version: '2' }, value: false },
        },
      ];
      const priorCustomDimensions = [
        {
          dimensionDefinitionId: '1000000024',
          enabledForTimeTracking: { version: '9', value: false },
          required: { version: '8', value: true },
        },
      ];

      it('maps customDimensions from the mutation response when dimensions were updated', () => {
        const result = {
          timesheetManagementSettings: {
            customFields: {
              customDimensions: wireCustomDimensions,
            },
          },
        };

        const mapped = mapGetQlSettingsData(result, [DIMENSIONS_FORM_NAME]);

        expect(mapped.customDimensions).toEqual([
          {
            dimensionDefinitionId: '1000000023',
            enabledForTimeTracking: { version: '1', value: true },
            required: { version: '2', value: false },
          },
        ]);
      });

      it('keeps the prior customDimensions snapshot when dimensions were not updated', () => {
        const mapped = mapGetQlSettingsData(
          { timesheetManagementSettings: { customFields: {} } },
          [],
          {
            customDimensions: priorCustomDimensions,
          } as unknown as IUpdateTimeEntrySettingResponse,
        );

        expect(mapped.customDimensions).toEqual(priorCustomDimensions);
      });

      it('returns an empty array when dimensions were not updated and no prior snapshot exists', () => {
        const mapped = mapGetQlSettingsData(
          { timesheetManagementSettings: { customFields: {} } },
          [],
        );

        expect(mapped.customDimensions).toEqual([]);
      });
    });
  });

  describe('updateTheSelectedFields', () => {
    it('should add field when enabled', () => {
      const fieldsArray: string[] = [];
      updateTheSelectedFields(true, fieldsArray, 'testField');
      expect(fieldsArray).toContain('testField');
    });

    it('should remove field when disabled', () => {
      const fieldsArray = ['testField'];
      updateTheSelectedFields(false, fieldsArray, 'testField');
      expect(fieldsArray).not.toContain('testField');
    });

    it('should not modify array when field status matches current state', () => {
      const fieldsArray = ['existingField'];
      updateTheSelectedFields(false, fieldsArray, 'nonExistentField');
      expect(fieldsArray).toEqual(['existingField']);

      updateTheSelectedFields(true, fieldsArray, 'existingField');
      expect(fieldsArray).toEqual(['existingField']);
    });

    it('should handle nullish values with coalescing operator', () => {
      const fieldsArray = ['testField'];
      const undefinedValue = undefined;
      const nullValue = null;

      // Test undefined ?? false
      updateTheSelectedFields(
        undefinedValue ?? false,
        fieldsArray,
        'testField',
      );
      expect(fieldsArray).not.toContain('testField');

      // Add field back and test null ?? false
      fieldsArray.push('testField');
      updateTheSelectedFields(nullValue ?? false, fieldsArray, 'testField');
      expect(fieldsArray).not.toContain('testField');
    });
  });

  describe('updateTimeSheetFieldsSelectedFields', () => {
    const baseFormValue: IUpdateTimeEntrySettingResponse = {
      timeTrackingSupported: { version: '', value: true },
      transactionBillingForTimeEnabled: { version: '', value: true },
      transactionTimeTrackingEnabled: { version: '', value: true },
      isServiceFieldEnabled: { version: '', value: false },
      customersForTimeSheetEnabled: { version: '', value: false },
      isBillingFieldEnabled: { version: '', value: false },
      useItemForTime: { version: '', value: false },
      classForTimeSheetEnabled: { version: '', value: false },
      locationForTimeSheetEnabled: { version: '', value: false },
      timeSheetEntryNotesEnabled: { version: '', value: false },
      clockInNotificationReminderTime: { version: '', value: '08:00' },
      clockInNotificationReminderEmail: { version: '', value: false },
      clockInNotificationReminderMobile: { version: '', value: false },
      clockOutNotificationReminderTime: { version: '', value: '17:00' },
      clockOutNotificationReminderEmail: { version: '', value: false },
      clockOutNotificationReminderMobile: { version: '', value: false },
      notificationEnabledForDays: { version: '', value: [] },
      notifyAdminOnClockOutOverrideEnabled: { version: '', value: false },
      notifyManagerOnClockOutOverrideEnabled: { version: '', value: false },
      notifyAdminOnTimeSheetNotesEditEnabled: { version: '', value: false },
      notifyGroupManagerOnTimeSheetNotesEditEnabled: {
        version: '',
        value: false,
      },
      firstDayOfWeek: { version: '', value: 0 },
      timeZone: { version: '', value: '' },
      timeFormat: { version: '', value: 24 },
      splitTimeSheetAtMidnightEnabled: { version: '', value: false },
      manageOwnTimeSheetsEnabled: { version: '', value: false },
      editClockOutTimeEnabled: { version: '', value: false },
      clockOutOverrideHours: { version: '', value: 8 },
      clockInRoundDirection: { version: '', value: 'NEAREST' },
      clockInRoundInMin: { version: '', value: 1 },
      clockOutRoundDirection: { version: '', value: 'NEAREST' },
      clockOutRoundInMin: { version: '', value: 1 },
      billingRateForTimeEnabled: { version: '', value: false },
      requireBillable: { version: '', value: false },
      timeSheetEntryEditNotesEnabled: { version: '', value: false },
      timeSheetEntryMakesNotesRequiredEnabled: { version: '', value: false },
    };

    it('should correctly update selected fields when all fields are enabled', () => {
      const updatedTimeEntryFormValue: IUpdateTimeEntrySettingResponse = {
        ...baseFormValue,
        customersForTimeSheetEnabled: {
          version: '1',
          value: true,
        },
        isBillingFieldEnabled: {
          version: '2',
          value: true,
        },
        useItemForTime: {
          version: '3',
          value: true,
        },
        classForTimeSheetEnabled: {
          version: '4',
          value: true,
        },
        locationForTimeSheetEnabled: {
          version: '5',
          value: true,
        },
        timeSheetEntryNotesEnabled: {
          version: '6',
          value: true,
        },
      };

      const selectedCustomTimeSheetFields: string[] = [];

      const updatedFields = updateTimeSheetFieldsSelectedFields(
        updatedTimeEntryFormValue,
        selectedCustomTimeSheetFields,
      );

      // Verify all enabled fields are added to the array
      expect(updatedFields).toContain('customersForTimeSheetEnabled');
      expect(updatedFields).toContain('isBillingFieldEnabled');
      expect(updatedFields).toContain('isServiceFieldEnabled');
      expect(updatedFields).toContain('classForTimeSheetEnabled');
      expect(updatedFields).toContain('locationForTimeSheetEnabled');
      expect(updatedFields).toContain('timeSheetEntryNotesEnabled');

      // Verify the array contains exactly these fields
      expect(updatedFields).toHaveLength(6);

      // Verify the order of fields (if order matters)
      expect(updatedFields).toEqual([
        'customersForTimeSheetEnabled',
        'isBillingFieldEnabled',
        'isServiceFieldEnabled',
        'classForTimeSheetEnabled',
        'locationForTimeSheetEnabled',
        'timeSheetEntryNotesEnabled',
      ]);
    });

    it('should handle adding fields incrementally', () => {
      const selectedCustomTimeSheetFields: string[] = [];

      // First update with just customers enabled
      const firstUpdate = updateTimeSheetFieldsSelectedFields(
        {
          ...baseFormValue,
          customersForTimeSheetEnabled: { version: '1', value: true },
        },
        selectedCustomTimeSheetFields,
      );

      expect(firstUpdate).toEqual(['customersForTimeSheetEnabled']);

      // Second update adds billing field
      const secondUpdate = updateTimeSheetFieldsSelectedFields(
        {
          ...baseFormValue,
          customersForTimeSheetEnabled: { version: '1', value: true },
          isBillingFieldEnabled: { version: '2', value: true },
        },
        firstUpdate,
      );

      expect(secondUpdate).toEqual([
        'customersForTimeSheetEnabled',
        'isBillingFieldEnabled',
      ]);
    });
  });
  // Test constants
  describe('Constants', () => {
    it('should have correct NOTIFY_OPTIONS', () => {
      expect(NOTIFY_OPTIONS).toEqual([
        'adminsAndManagers',
        'adminsOnly',
        'managersOnly',
        'none',
      ]);
    });

    it('should have correct TIME_FORMATS', () => {
      expect(TIME_FORMATS).toEqual({
        twelveHourFormat: 12,
        twentyFourHourFormat: 24,
      });
    });

    it('should have correct CLOCK_IN_OUT_DIRECTIONS', () => {
      expect(CLOCK_IN_OUT_DIRECTIONS).toEqual({
        up: 'UP',
        down: 'DOWN',
        nearest: 'NEAREST',
      });
    });

    it('should have correct NOTIFICATION_DAYS_OF_WEEK', () => {
      expect(NOTIFICATION_DAYS_OF_WEEK).toEqual({
        sunday: 'SUNDAY',
        monday: 'MONDAY',
        tuesday: 'TUESDAY',
        wednesday: 'WEDNESDAY',
        thursday: 'THURSDAY',
        friday: 'FRIDAY',
        saturday: 'SATURDAY',
      });
    });

    it('should have correct TimeEntriesFormType enum', () => {
      expect(TimeEntriesFormType).toEqual({
        TIMETRACKING: 'Timetracking',
        TIMESHEET: 'Timesheet',
        NOTIFICATION: 'Notification',
        CUSTOM_FIELDS: 'CustomFields',
        APPROVALS: 'Approvals',
        GEO_LOCATIONS: 'GeoLocations',
        OVERTIME: 'Overtime',
      });
    });

    it('should have correct ROUNDING_INCREMENT_CLOCK_IN_OUT', () => {
      expect(ROUNDING_INCREMENT_CLOCK_IN_OUT).toEqual({
        oneMin: 1,
        threeMin: 3,
        fiveMin: 5,
        sixMin: 6,
        tenMin: 10,
        fifteenMin: 15,
        thirtyMin: 30,
      });
    });
  });

  describe('Helper Functions', () => {
    describe('getNestedValue', () => {
      it('should safely get nested value from object', () => {
        const obj = {
          a: {
            b: {
              c: 'value',
            },
          },
        };
        expect(getNestedValue(obj, ['a', 'b', 'c'])).toBe('value');
      });

      it('should return undefined for non-existent path', () => {
        const obj = {
          a: {
            b: 'value',
          },
        };
        expect(getNestedValue(obj, ['a', 'b', 'c'])).toBeUndefined();
      });

      it('should handle empty path', () => {
        const obj = { value: 'test' };
        expect(getNestedValue(obj, [])).toEqual(obj);
      });

      it('should handle null or undefined object', () => {
        expect(getNestedValue(null, ['a', 'b'])).toBeUndefined();
        expect(getNestedValue(undefined, ['a', 'b'])).toBeUndefined();
      });
    });

    describe('getVersion', () => {
      it('should get version from nested meta object', () => {
        const result = {
          settings: {
            field: {
              meta: {
                version: 'v1',
              },
            },
          },
        };
        expect(getVersion(result, ['settings', 'field'])).toBe('v1');
      });

      it('should return default version when version not found', () => {
        const result = {
          settings: {
            field: {},
          },
        };
        expect(getVersion(result, ['settings', 'field'], 'default')).toBe(
          'default',
        );
      });

      it('should return empty string when no default provided and version not found', () => {
        const result = {};
        expect(getVersion(result, ['nonexistent', 'path'])).toBe('');
      });

      it('should handle null or undefined result', () => {
        expect(getVersion(null, ['path'])).toBe('');
        expect(getVersion(undefined, ['path'])).toBe('');
      });
    });

    describe('getValue', () => {
      it('should get value from nested object', () => {
        const result = {
          settings: {
            field: {
              value: 'test',
            },
          },
        };
        expect(getValue(result, ['settings', 'field'], 'default')).toBe('test');
      });

      it('should return default value when value not found', () => {
        const result = {
          settings: {},
        };
        expect(getValue(result, ['settings', 'field'], 'default')).toBe(
          'default',
        );
      });

      it('should handle null values correctly', () => {
        const result = {
          settings: {
            field: {
              value: null,
            },
          },
        };
        expect(getValue(result, ['settings', 'field'], 'default')).toBe(
          'default',
        );
      });

      it('should handle undefined values correctly', () => {
        const result = {
          settings: {
            field: {
              value: undefined,
            },
          },
        };
        expect(getValue(result, ['settings', 'field'], 'default')).toBe(
          'default',
        );
      });
    });

    describe('getSettingData', () => {
      it('should handle firstDayOfWeek field correctly', () => {
        const result = {
          startWorkWeek: {
            meta: { version: 'v1' },
            value: Common_DayOfWeek.Monday,
          },
        };

        const data = getSettingData(
          result,
          ['firstDayOfWeek'],
          'firstDayOfWeek',
          ['startWorkWeek'],
          0,
        );

        expect(data).toEqual({
          version: 'v1',
          value: 1, // Monday maps to 1
        });
      });

      it('should handle notification medium fields correctly', () => {
        const result = {
          notificationSettings: {
            startShiftNotifications: {
              notificationMedium: {
                meta: { version: 'v1' },
                value: ['EMAIL', 'PUSH_NOTIFICATION'],
              },
            },
          },
        };

        const emailData = getSettingData(
          result,
          ['clockInNotificationReminderEmail'],
          'clockInNotificationReminderEmail',
          [
            'notificationSettings',
            'startShiftNotifications',
            'notificationMedium',
          ],
          false,
        );

        expect(emailData).toEqual({
          version: 'v1',
          value: true,
        });

        const mobileData = getSettingData(
          result,
          ['clockInNotificationReminderMobile'],
          'clockInNotificationReminderMobile',
          [
            'notificationSettings',
            'startShiftNotifications',
            'notificationMedium',
          ],
          false,
        );

        expect(mobileData).toEqual({
          version: 'v1',
          value: true,
        });
      });

      it('should handle normal fields correctly', () => {
        const result = {
          settings: {
            field: {
              meta: { version: 'v1' },
              value: 'test',
            },
          },
        };

        const data = getSettingData(
          result,
          ['normalField'],
          'normalField',
          ['settings', 'field'],
          'default',
        );

        expect(data).toEqual({
          version: 'v1',
          value: 'test',
        });
      });

      it('should use existing value from updatedTimeEntryFormValue when field not updated', () => {
        const result = {};
        const updatedTimeEntryFormValue: Partial<MappedQLSettings> = {
          timeFormat: {
            version: 'v2',
            value: 12,
          },
        };

        const data = getSettingData(
          result,
          [],
          'timeFormat',
          ['path'],
          24,
          updatedTimeEntryFormValue as MappedQLSettings,
        );

        expect(data).toEqual({
          version: 'v2',
          value: 12,
        });
      });

      it('should handle updateTimeEntryFormValueKeyName correctly', () => {
        const result = {};
        const updatedTimeEntryFormValue: Partial<MappedQLSettings> = {
          timeZone: {
            version: 'v3',
            value: 'America/New_York',
          },
        };

        const data = getSettingData(
          result,
          [],
          'timeFormat',
          ['path'],
          24,
          updatedTimeEntryFormValue as MappedQLSettings,
          'timeZone',
        );

        expect(data).toEqual({
          version: 'v3',
          value: 'America/New_York',
        });
      });

      it('should handle missing values with defaults', () => {
        const result = {};
        const data = getSettingData(
          result,
          [],
          'testField',
          ['path'],
          'default',
        );

        expect(data).toEqual({
          version: '',
          value: 'default',
        });
      });
    });
  });
});
