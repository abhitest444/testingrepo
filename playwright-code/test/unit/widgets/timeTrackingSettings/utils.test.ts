import React from 'react';
import {
  TimeTracking_NotificationReminderMedium,
  TimeTracking_NotificationSubscription,
  TimeTracking_NotificationType,
  TimeTracking_ScheduleManagePreference,
  TimeTracking_ScheduleShiftChangeNotificationPreference,
  TimeTracking_ScheduleViewPreference,
} from 'src/__generated__/timeTracking/graphql';
import {
  convertTo12Hour,
  convertTo24Hour,
  formatTimeTo12Hour,
  formatTimeTo24Hour,
  uppercaseToPascalcase,
  createFieldUpdate,
  getWeekDay,
  filterSubFieldsByIXP,
  getTimeSheetFieldTitle,
  findConfigByName,
  mapFieldApprovalSettingsField,
  mapScheduleManagePreferenceFromApi,
  mapScheduleManagePreferenceToApi,
  mapScheduleViewPreferenceFromApi,
  mapScheduleViewPreferenceToApi,
  mapShiftChangePreferenceToSendMode,
  getPayPeriodLabel,
  formatArrayToTitleCase,
  getReminderMessageKey,
  getReminderData,
  createReminderFieldNames,
  getReminderFieldNames,
  isNotificationMediumEnabled,
  toggleNotificationMedium,
  convertHourNumberTo12Hour,
  convertHourNumberTo24Hour,
  FieldAssignmentTourSteps,
  formatScheduleNotificationChannelsValue,
  formatScheduleNotificationOnOffChannelValue,
  formatScheduleNotificationSummaryValue,
  hasEmailChannel,
  hasMobileChannel,
  mapSubscriptionsToScheduleChannels,
  toggleScheduleChannel,
  mapEmployerDimensionSettingsToPreviewFields,
  mapDimensionDefinitionsToPreviewFields,
  mapDimensionPreviewFieldsToFormValues,
  mapCustomDimensionsWireToSettings,
  mergeActiveDimensionsWithQLSettings,
  createTimesheetDimensionPreviewField,
  getManageKioskWidgetId,
  type ScheduleNotificationsIntl,
} from 'src/js/widgets/timeTrackingSettings/utils';
import firstStep from 'src/assets/animations/assignments/custom-field-settings/step-1.json';
import secondStep from 'src/assets/animations/assignments/custom-field-settings/step-2.json';
import thirdStep from 'src/assets/animations/assignments/custom-field-settings/step-3.json';
import { DAYS_OF_WEEK } from 'src/js/widgets/timeTrackingSettings/hooks/useTimeTrackingSettingsForm';
import { MappedQLSettings } from 'src/js/service/hooks/settings/useGetQLSettings';
import type { CustomDimensionSetting } from 'src/js/service/hooks/settings/useGetQLSettings';
import type { DimensionFormDefinition } from 'src/js/widgets/timeTrackingSettings/types';
import {
  ITimeSheetFieldOption,
  NamedConfigEntry,
} from 'src/js/widgets/timeTrackingSettings/types';
import {
  TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS,
  ApprovalRemindersbasedOn,
  ApprovalReminderPrefix,
  NotificationMedium,
  ReminderRole,
  NotificationFieldKey,
  ScheduleNotificationChannel,
  ScheduleNotificationSendMode,
  MANAGE_KIOSK_LEGACY_WIDGET_ID,
  MANAGE_KIOSK_ORCHESTRATOR_WIDGET_ID,
} from 'src/js/widgets/timeTrackingSettings/constants';
import { TIME_ENTRY_SETTINGS_CONFIG } from 'src/js/widgets/timeTrackingSettings/config';
import {
  SCHEDULE_MANAGE_VALUE,
  SCHEDULE_VIEW_VALUE,
  type ScheduleManagePreference,
  type ScheduleViewPreference,
} from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/schedules/constants';

describe('Time Tracking Settings Utils', () => {
  describe('convertTo12Hour', () => {
    it('should convert 24-hour time to 12-hour format', () => {
      expect(convertTo12Hour('13:30')).toBe('1:30 PM');
      expect(convertTo12Hour('00:00')).toBe('12:00 AM');
      expect(convertTo12Hour('12:00')).toBe('12:00 PM');
      expect(convertTo12Hour('09:15')).toBe('9:15 AM');
    });

    it('should handle empty or invalid input', () => {
      expect(convertTo12Hour('')).toBe('12:00 AM');
      expect(convertTo12Hour(null as any)).toBe('12:00 AM');
    });
  });

  describe('convertTo24Hour', () => {
    it('should convert 12-hour time to 24-hour format', () => {
      expect(convertTo24Hour('1:30 PM')).toBe('13:30');
      expect(convertTo24Hour('12:00 AM')).toBe('00:00');
      expect(convertTo24Hour('12:00 PM')).toBe('12:00');
      expect(convertTo24Hour('9:15 AM')).toBe('09:15');
    });

    it('should handle empty or invalid input', () => {
      expect(convertTo24Hour('')).toBe('00:00');
      expect(convertTo24Hour(null as any)).toBe('00:00');
    });
  });

  describe('formatTimeTo12Hour', () => {
    it('should return original time when isUKLocale is true', () => {
      expect(formatTimeTo12Hour('13:30', true)).toBe('13:30');
      expect(formatTimeTo12Hour('00:00', true)).toBe('00:00');
      expect(formatTimeTo12Hour('23:59', true)).toBe('23:59');
      expect(formatTimeTo12Hour('12:15', true)).toBe('12:15');
    });

    it('should convert to 12-hour format when isUKLocale is false', () => {
      expect(formatTimeTo12Hour('13:30', false)).toBe('1:30 PM');
      expect(formatTimeTo12Hour('00:00', false)).toBe('12:00 AM');
      expect(formatTimeTo12Hour('12:00', false)).toBe('12:00 PM');
      expect(formatTimeTo12Hour('09:15', false)).toBe('9:15 AM');
    });

    it('should convert to 12-hour format when isUKLocale is undefined', () => {
      expect(formatTimeTo12Hour('13:30')).toBe('1:30 PM');
      expect(formatTimeTo12Hour('00:00')).toBe('12:00 AM');
      expect(formatTimeTo12Hour('12:00')).toBe('12:00 PM');
      expect(formatTimeTo12Hour('09:15')).toBe('9:15 AM');
    });

    it('should handle empty string input', () => {
      expect(formatTimeTo12Hour('', true)).toBe('');
      expect(formatTimeTo12Hour('', false)).toBe('12:00 AM');
      expect(formatTimeTo12Hour('')).toBe('12:00 AM');
    });

    it('should handle null/undefined time input', () => {
      expect(formatTimeTo12Hour(null as any, true)).toBe(null);
      expect(formatTimeTo12Hour(null as any, false)).toBe('12:00 AM');
      expect(formatTimeTo12Hour(null as any)).toBe('12:00 AM');
    });

    it('should preserve UK locale time formats', () => {
      // Test that UK locale times are returned as-is
      expect(formatTimeTo12Hour('08:30', true)).toBe('08:30');
      expect(formatTimeTo12Hour('16:45', true)).toBe('16:45');
      expect(formatTimeTo12Hour('01:00', true)).toBe('01:00');
    });

    it('should handle edge time values', () => {
      expect(formatTimeTo12Hour('23:59', false)).toBe('11:59 PM');
      expect(formatTimeTo12Hour('00:01', false)).toBe('12:01 AM');
      expect(formatTimeTo12Hour('12:01', false)).toBe('12:01 PM');
      expect(formatTimeTo12Hour('11:59', false)).toBe('11:59 AM');
    });
  });

  describe('formatTimeTo24Hour', () => {
    it('should return original time when isUKLocale is true', () => {
      expect(formatTimeTo24Hour('1:30 PM', true)).toBe('1:30 PM');
      expect(formatTimeTo24Hour('12:00 AM', true)).toBe('12:00 AM');
      expect(formatTimeTo24Hour('11:59 PM', true)).toBe('11:59 PM');
      expect(formatTimeTo24Hour('9:15 AM', true)).toBe('9:15 AM');
    });

    it('should convert to 24-hour format when isUKLocale is false', () => {
      expect(formatTimeTo24Hour('1:30 PM', false)).toBe('13:30');
      expect(formatTimeTo24Hour('12:00 AM', false)).toBe('00:00');
      expect(formatTimeTo24Hour('12:00 PM', false)).toBe('12:00');
      expect(formatTimeTo24Hour('9:15 AM', false)).toBe('09:15');
    });

    it('should convert to 24-hour format when isUKLocale is undefined', () => {
      expect(formatTimeTo24Hour('1:30 PM')).toBe('13:30');
      expect(formatTimeTo24Hour('12:00 AM')).toBe('00:00');
      expect(formatTimeTo24Hour('12:00 PM')).toBe('12:00');
      expect(formatTimeTo24Hour('9:15 AM')).toBe('09:15');
    });

    it('should handle empty string input', () => {
      expect(formatTimeTo24Hour('', true)).toBe('');
      expect(formatTimeTo24Hour('', false)).toBe('00:00');
      expect(formatTimeTo24Hour('')).toBe('00:00');
    });

    it('should handle null/undefined time input', () => {
      expect(formatTimeTo24Hour(null as any, true)).toBe(null);
      expect(formatTimeTo24Hour(null as any, false)).toBe('00:00');
      expect(formatTimeTo24Hour(null as any)).toBe('00:00');
    });

    it('should preserve UK locale time formats', () => {
      // Test that UK locale times are returned as-is (even if they're 12-hour format)
      expect(formatTimeTo24Hour('8:30 AM', true)).toBe('8:30 AM');
      expect(formatTimeTo24Hour('4:45 PM', true)).toBe('4:45 PM');
      expect(formatTimeTo24Hour('12:00 PM', true)).toBe('12:00 PM');
    });

    it('should handle edge time values', () => {
      expect(formatTimeTo24Hour('11:59 PM', false)).toBe('23:59');
      expect(formatTimeTo24Hour('12:01 AM', false)).toBe('00:01');
      expect(formatTimeTo24Hour('12:01 PM', false)).toBe('12:01');
      expect(formatTimeTo24Hour('11:59 AM', false)).toBe('11:59');
    });
  });

  describe('convertHourNumberTo12Hour', () => {
    describe('UK locale (24-hour format)', () => {
      it('should return 24-hour format with leading zeros for UK locale', () => {
        expect(convertHourNumberTo12Hour(0, true)).toBe('00:00');
        expect(convertHourNumberTo12Hour(1, true)).toBe('01:00');
        expect(convertHourNumberTo12Hour(9, true)).toBe('09:00');
        expect(convertHourNumberTo12Hour(10, true)).toBe('10:00');
        expect(convertHourNumberTo12Hour(12, true)).toBe('12:00');
        expect(convertHourNumberTo12Hour(13, true)).toBe('13:00');
        expect(convertHourNumberTo12Hour(23, true)).toBe('23:00');
      });

      it('should pad single-digit hours with leading zero', () => {
        expect(convertHourNumberTo12Hour(0, true)).toBe('00:00');
        expect(convertHourNumberTo12Hour(5, true)).toBe('05:00');
        expect(convertHourNumberTo12Hour(9, true)).toBe('09:00');
      });

      it('should not pad double-digit hours', () => {
        expect(convertHourNumberTo12Hour(10, true)).toBe('10:00');
        expect(convertHourNumberTo12Hour(15, true)).toBe('15:00');
        expect(convertHourNumberTo12Hour(23, true)).toBe('23:00');
      });
    });

    describe('Non-UK locale (12-hour format)', () => {
      it('should convert to 12-hour format with AM/PM', () => {
        expect(convertHourNumberTo12Hour(0)).toBe('12:00 AM');
        expect(convertHourNumberTo12Hour(1)).toBe('1:00 AM');
        expect(convertHourNumberTo12Hour(11)).toBe('11:00 AM');
        expect(convertHourNumberTo12Hour(12)).toBe('12:00 PM');
        expect(convertHourNumberTo12Hour(13)).toBe('1:00 PM');
        expect(convertHourNumberTo12Hour(23)).toBe('11:00 PM');
      });

      it('should handle midnight correctly (0 -> 12 AM)', () => {
        expect(convertHourNumberTo12Hour(0)).toBe('12:00 AM');
        expect(convertHourNumberTo12Hour(0, false)).toBe('12:00 AM');
      });

      it('should handle noon correctly (12 -> 12 PM)', () => {
        expect(convertHourNumberTo12Hour(12)).toBe('12:00 PM');
        expect(convertHourNumberTo12Hour(12, false)).toBe('12:00 PM');
      });

      it('should convert morning hours (1-11) to AM', () => {
        expect(convertHourNumberTo12Hour(1)).toBe('1:00 AM');
        expect(convertHourNumberTo12Hour(6)).toBe('6:00 AM');
        expect(convertHourNumberTo12Hour(11)).toBe('11:00 AM');
      });

      it('should convert afternoon/evening hours (13-23) to PM', () => {
        expect(convertHourNumberTo12Hour(13)).toBe('1:00 PM');
        expect(convertHourNumberTo12Hour(18)).toBe('6:00 PM');
        expect(convertHourNumberTo12Hour(23)).toBe('11:00 PM');
      });

      it('should handle all 24 hours correctly', () => {
        const expected = [
          '12:00 AM',
          '1:00 AM',
          '2:00 AM',
          '3:00 AM',
          '4:00 AM',
          '5:00 AM',
          '6:00 AM',
          '7:00 AM',
          '8:00 AM',
          '9:00 AM',
          '10:00 AM',
          '11:00 AM',
          '12:00 PM',
          '1:00 PM',
          '2:00 PM',
          '3:00 PM',
          '4:00 PM',
          '5:00 PM',
          '6:00 PM',
          '7:00 PM',
          '8:00 PM',
          '9:00 PM',
          '10:00 PM',
          '11:00 PM',
        ];

        for (let hour = 0; hour < 24; hour += 1) {
          expect(convertHourNumberTo12Hour(hour, false)).toBe(expected[hour]);
        }
      });

      it('should default to 12-hour format when isUKLocale is undefined', () => {
        expect(convertHourNumberTo12Hour(0)).toBe('12:00 AM');
        expect(convertHourNumberTo12Hour(13)).toBe('1:00 PM');
      });
    });
  });

  describe('convertHourNumberTo24Hour', () => {
    describe('AM times', () => {
      it('should convert AM times correctly', () => {
        expect(convertHourNumberTo24Hour('1:00 AM')).toBe(1);
        expect(convertHourNumberTo24Hour('6:00 AM')).toBe(6);
        expect(convertHourNumberTo24Hour('11:00 AM')).toBe(11);
      });

      it('should convert 12 AM to 0 (midnight)', () => {
        expect(convertHourNumberTo24Hour('12:00 AM')).toBe(0);
        expect(convertHourNumberTo24Hour('12:30 AM')).toBe(0);
        expect(convertHourNumberTo24Hour('12:59 AM')).toBe(0);
      });

      it('should handle all AM hours (1-11)', () => {
        for (let hour = 1; hour <= 11; hour += 1) {
          expect(convertHourNumberTo24Hour(`${hour}:00 AM`)).toBe(hour);
        }
      });
    });

    describe('PM times', () => {
      it('should convert PM times correctly', () => {
        expect(convertHourNumberTo24Hour('1:00 PM')).toBe(13);
        expect(convertHourNumberTo24Hour('6:00 PM')).toBe(18);
        expect(convertHourNumberTo24Hour('11:00 PM')).toBe(23);
      });

      it('should keep 12 PM as 12 (noon)', () => {
        expect(convertHourNumberTo24Hour('12:00 PM')).toBe(12);
        expect(convertHourNumberTo24Hour('12:30 PM')).toBe(12);
        expect(convertHourNumberTo24Hour('12:59 PM')).toBe(12);
      });

      it('should handle all PM hours (1-11) by adding 12', () => {
        for (let hour = 1; hour <= 11; hour += 1) {
          expect(convertHourNumberTo24Hour(`${hour}:00 PM`)).toBe(hour + 12);
        }
      });
    });

    describe('different time formats', () => {
      it('should handle times without spaces', () => {
        expect(convertHourNumberTo24Hour('1:00AM')).toBe(1);
        expect(convertHourNumberTo24Hour('1:00PM')).toBe(13);
        expect(convertHourNumberTo24Hour('12:00AM')).toBe(0);
        expect(convertHourNumberTo24Hour('12:00PM')).toBe(12);
      });

      it('should handle lowercase am/pm', () => {
        expect(convertHourNumberTo24Hour('1:00 am')).toBe(1);
        expect(convertHourNumberTo24Hour('1:00 pm')).toBe(13);
      });

      it('should handle mixed case am/pm', () => {
        expect(convertHourNumberTo24Hour('1:00 Am')).toBe(1);
        expect(convertHourNumberTo24Hour('1:00 pM')).toBe(13);
      });

      it('should handle multiple spaces', () => {
        expect(convertHourNumberTo24Hour('1:00  AM')).toBe(1);
        expect(convertHourNumberTo24Hour('1:00   PM')).toBe(13);
      });

      it('should ignore minutes when converting', () => {
        expect(convertHourNumberTo24Hour('3:15 AM')).toBe(3);
        expect(convertHourNumberTo24Hour('3:45 PM')).toBe(15);
        expect(convertHourNumberTo24Hour('12:30 AM')).toBe(0);
        expect(convertHourNumberTo24Hour('12:30 PM')).toBe(12);
      });
    });

    describe('edge cases', () => {
      it('should handle midnight (12 AM)', () => {
        expect(convertHourNumberTo24Hour('12:00 AM')).toBe(0);
      });

      it('should handle noon (12 PM)', () => {
        expect(convertHourNumberTo24Hour('12:00 PM')).toBe(12);
      });

      it('should handle 1 AM (first hour after midnight)', () => {
        expect(convertHourNumberTo24Hour('1:00 AM')).toBe(1);
      });

      it('should handle 11 PM (last hour before midnight)', () => {
        expect(convertHourNumberTo24Hour('11:00 PM')).toBe(23);
      });

      it('should handle all 12 hours for AM', () => {
        const amHours = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        for (let i = 1; i <= 12; i += 1) {
          const hour = i === 12 ? 0 : i;
          expect(convertHourNumberTo24Hour(`${i}:00 AM`)).toBe(hour);
        }
      });

      it('should handle all 12 hours for PM', () => {
        for (let i = 1; i <= 12; i += 1) {
          const expected = i === 12 ? 12 : i + 12;
          expect(convertHourNumberTo24Hour(`${i}:00 PM`)).toBe(expected);
        }
      });
    });

    describe('complete 12-hour cycle', () => {
      it('should correctly convert all times in a 24-hour period', () => {
        const testCases = [
          { input: '12:00 AM', expected: 0 },
          { input: '1:00 AM', expected: 1 },
          { input: '2:00 AM', expected: 2 },
          { input: '3:00 AM', expected: 3 },
          { input: '4:00 AM', expected: 4 },
          { input: '5:00 AM', expected: 5 },
          { input: '6:00 AM', expected: 6 },
          { input: '7:00 AM', expected: 7 },
          { input: '8:00 AM', expected: 8 },
          { input: '9:00 AM', expected: 9 },
          { input: '10:00 AM', expected: 10 },
          { input: '11:00 AM', expected: 11 },
          { input: '12:00 PM', expected: 12 },
          { input: '1:00 PM', expected: 13 },
          { input: '2:00 PM', expected: 14 },
          { input: '3:00 PM', expected: 15 },
          { input: '4:00 PM', expected: 16 },
          { input: '5:00 PM', expected: 17 },
          { input: '6:00 PM', expected: 18 },
          { input: '7:00 PM', expected: 19 },
          { input: '8:00 PM', expected: 20 },
          { input: '9:00 PM', expected: 21 },
          { input: '10:00 PM', expected: 22 },
          { input: '11:00 PM', expected: 23 },
        ];

        testCases.forEach(({ input, expected }) => {
          expect(convertHourNumberTo24Hour(input)).toBe(expected);
        });
      });
    });
  });

  describe('uppercaseToPascalcase', () => {
    it('should convert uppercase strings to PascalCase', () => {
      expect(uppercaseToPascalcase('HELLO_WORLD')).toBe('HelloWorld');
      expect(uppercaseToPascalcase('TEST-CASE')).toBe('TestCase');
      expect(uppercaseToPascalcase('SOME TEXT')).toBe('SomeText');
      expect(uppercaseToPascalcase('ALREADY_PascalCase')).toBe(
        'AlreadyPascalcase',
      );
    });

    it('should handle empty or single word input', () => {
      expect(uppercaseToPascalcase('')).toBe('');
      expect(uppercaseToPascalcase('SINGLE')).toBe('Single');
    });
  });

  describe('createFieldUpdate', () => {
    const mockSettings = {
      timeTrackingSupported: { version: '1.0' },
      isBillingFieldEnabled: { version: '2.0' },
    };
    const mockFormState = {
      timeTrackingSupported: true,
      isBillingFieldEnabled: false,
    };

    it('should create field update for updated fields', () => {
      const result = createFieldUpdate(
        'timeTrackingSupported',
        ['timeTrackingSupported'],
        mockSettings as any,
        mockFormState,
      );

      expect(result).toEqual({
        version: '1.0',
        value: true,
      });
    });

    it('should return undefined for non-updated fields', () => {
      const result = createFieldUpdate(
        'timeTrackingSupported',
        ['isBillingFieldEnabled'],
        mockSettings as any,
        mockFormState,
      );

      expect(result).toBeUndefined();
    });

    it('should handle custom value parsing', () => {
      const parseValue = (value: boolean) => !value;
      const result = createFieldUpdate(
        'timeTrackingSupported',
        ['timeTrackingSupported'],
        mockSettings as any,
        mockFormState,
        parseValue,
      );

      expect(result).toEqual({
        version: '1.0',
        value: false,
      });
    });

    it('should return undefined for fields without version', () => {
      const settingsWithoutVersion = {
        timeTrackingSupported: {},
      };
      const result = createFieldUpdate(
        'timeTrackingSupported',
        ['timeTrackingSupported'],
        settingsWithoutVersion as any,
        mockFormState,
      );

      expect(result).toBeUndefined();
    });

    it('should return undefined when field does not exist in settings', () => {
      const result = createFieldUpdate(
        'nonExistentField' as keyof MappedQLSettings,
        ['nonExistentField'],
        mockSettings as any,
        mockFormState,
      );

      expect(result).toBeUndefined();
    });

    it('should handle undefined settings object', () => {
      const result = createFieldUpdate(
        'timeTrackingSupported',
        ['timeTrackingSupported'],
        undefined as any,
        mockFormState,
      );

      expect(result).toBeUndefined();
    });
  });

  describe('getWeekDay', () => {
    it('should return the correct day name for a given index', () => {
      // Assuming DAYS_OF_WEEK is an object like { SUNDAY: 0, MONDAY: 1, ... }
      Object.entries(DAYS_OF_WEEK).forEach(([day, index]) => {
        expect(getWeekDay(index)).toBe(day);
      });
    });

    it('should return undefined for invalid day index', () => {
      expect(getWeekDay(-1)).toBeUndefined();
      expect(getWeekDay(7)).toBeUndefined();
    });
  });

  describe('filterSubFieldsByIXP', () => {
    const subFields: ITimeSheetFieldOption[] = [
      {
        id: '1',
        key: 'requireBillable',
        title: '',
        ariaLabel: '',
        tooltipText: '',
        disabled: false,
        value: false,
        detail: { title: '', subtitle: '', ariaLabel: '' },
      },
      {
        id: '2',
        key: 'otherField',
        title: '',
        ariaLabel: '',
        tooltipText: '',
        disabled: false,
        value: false,
        detail: { title: '', subtitle: '', ariaLabel: '' },
      },
      {
        id: '3',
        key: 'timeSheetEntryMakesNotesRequiredEnabled',
        title: '',
        ariaLabel: '',
        tooltipText: '',
        disabled: false,
        value: false,
        detail: { title: '', subtitle: '', ariaLabel: '' },
      },
    ];

    it('returns all subfields if isRequiredIXP is false', () => {
      const result = filterSubFieldsByIXP(
        subFields,
        'isBillingFieldEnabled',
        false,
      );
      expect(result).toEqual(subFields);
    });

    it('filters out requireBillable for isBillingFieldEnabled when isRequiredIXP is true', () => {
      const result = filterSubFieldsByIXP(
        subFields,
        'isBillingFieldEnabled',
        true,
      );
      expect(result).toEqual([
        subFields[1], // otherField
        subFields[2], // timeSheetEntryMakesNotesRequiredEnabled
      ]);
    });

    it('filters out timeSheetEntryMakesNotesRequiredEnabled for timeSheetEntryNotesEnabled when isRequiredIXP is true', () => {
      const result = filterSubFieldsByIXP(
        subFields,
        'timeSheetEntryNotesEnabled',
        true,
      );
      expect(result).toEqual([
        subFields[0], // requireBillable
        subFields[1], // otherField
      ]);
    });

    it('returns all subfields if parentFieldKey does not match filter and isRequiredIXP is true', () => {
      const result = filterSubFieldsByIXP(subFields, 'someOtherKey', true);
      expect(result).toEqual(subFields);
    });

    it('returns empty array if subFields is empty', () => {
      const result = filterSubFieldsByIXP([], 'isBillingFieldEnabled', true);
      expect(result).toEqual([]);
    });

    it('handles subfields with duplicate keys', () => {
      const dupFields: ITimeSheetFieldOption[] = [
        {
          id: '1',
          key: 'requireBillable',
          title: '',
          ariaLabel: '',
          tooltipText: '',
          disabled: false,
          value: false,
          detail: { title: '', subtitle: '', ariaLabel: '' },
        },
        {
          id: '2',
          key: 'requireBillable',
          title: '',
          ariaLabel: '',
          tooltipText: '',
          disabled: false,
          value: false,
          detail: { title: '', subtitle: '', ariaLabel: '' },
        },
        {
          id: '3',
          key: 'otherField',
          title: '',
          ariaLabel: '',
          tooltipText: '',
          disabled: false,
          value: false,
          detail: { title: '', subtitle: '', ariaLabel: '' },
        },
      ];
      const result = filterSubFieldsByIXP(
        dupFields,
        'isBillingFieldEnabled',
        true,
      );
      expect(result).toEqual([
        dupFields[2], // otherField
      ]);
    });

    it('handles subfields with keys not present in the filter', () => {
      const customFields: ITimeSheetFieldOption[] = [
        {
          id: '1',
          key: 'custom1',
          title: '',
          ariaLabel: '',
          tooltipText: '',
          disabled: false,
          value: false,
          detail: { title: '', subtitle: '', ariaLabel: '' },
        },
        {
          id: '2',
          key: 'custom2',
          title: '',
          ariaLabel: '',
          tooltipText: '',
          disabled: false,
          value: false,
          detail: { title: '', subtitle: '', ariaLabel: '' },
        },
      ];
      const result = filterSubFieldsByIXP(
        customFields,
        'isBillingFieldEnabled',
        true,
      );
      expect(result).toEqual(customFields);
    });
  });

  describe('getTimeSheetFieldTitle', () => {
    const createMockField = (
      key: string,
      title: string,
    ): ITimeSheetFieldOption => ({
      id: '1',
      key,
      title,
      ariaLabel: '',
      tooltipText: '',
      disabled: false,
      value: false,
      detail: { title: '', subtitle: '', ariaLabel: '' },
    });

    it('returns standard title for non-customer fields', () => {
      const mockText = jest.fn().mockReturnValue('Standard Field Title');
      const field = createMockField('someOtherField', 'field.title.key');

      const result = getTimeSheetFieldTitle(field, mockText);

      expect(result).toBe('Standard Field Title');
      expect(mockText).toHaveBeenCalledWith({ id: 'field.title.key' });
    });

    it('returns dynamic title when different from static title for customer field', () => {
      const mockText = jest
        .fn()
        .mockReturnValueOnce('Customer') // First call for standard title
        .mockReturnValueOnce('Dynamic Customer Title') // Second call for dynamic title
        .mockReturnValueOnce('Static Title'); // Third call for static title

      const field = createMockField(
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CUSTOMER_FOR_TIMESHEET_ENABLED,
        'Customer',
      );

      const result = getTimeSheetFieldTitle(field, mockText);

      expect(result).toBe('Dynamic Customer Title');
      expect(mockText).toHaveBeenCalledTimes(3);
      expect(mockText).toHaveBeenNthCalledWith(1, { id: 'Customer' });
      expect(mockText).toHaveBeenNthCalledWith(
        2,
        {
          id: 'time-entries.section.title.time-sheet.customer-and-sub-customer.dynamic',
        },
        {
          customer: 'Customer',
          subCustomer: 'customer',
        },
      );
      expect(mockText).toHaveBeenNthCalledWith(3, {
        id: 'time-entries.section.title.time-sheet.customer-and-sub-customer',
      });
    });

    it('returns static title when dynamic title equals static title for customer field', () => {
      const mockText = jest
        .fn()
        .mockReturnValueOnce('Customer') // First call for standard title
        .mockReturnValueOnce('Same Title') // Second call for dynamic title
        .mockReturnValueOnce('Same Title'); // Third call for static title

      const field = createMockField(
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CUSTOMER_FOR_TIMESHEET_ENABLED,
        'Customer',
      );

      const result = getTimeSheetFieldTitle(field, mockText);

      expect(result).toBe('Same Title');
      expect(mockText).toHaveBeenCalledTimes(3);
    });

    it('handles customer field with uppercase title', () => {
      const mockText = jest
        .fn()
        .mockReturnValueOnce('CUSTOMER') // First call for standard title
        .mockReturnValueOnce('Dynamic CUSTOMER Title') // Second call for dynamic title
        .mockReturnValueOnce('Static Title'); // Third call for static title

      const field = createMockField(
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CUSTOMER_FOR_TIMESHEET_ENABLED,
        'CUSTOMER',
      );

      const result = getTimeSheetFieldTitle(field, mockText);

      expect(result).toBe('Dynamic CUSTOMER Title');
      expect(mockText).toHaveBeenNthCalledWith(
        2,
        {
          id: 'time-entries.section.title.time-sheet.customer-and-sub-customer.dynamic',
        },
        {
          customer: 'CUSTOMER',
          subCustomer: 'customer', // Should be lowercase
        },
      );
    });

    it('handles customer field with empty title', () => {
      const mockText = jest
        .fn()
        .mockReturnValueOnce('') // First call for standard title
        .mockReturnValueOnce('Dynamic Title') // Second call for dynamic title
        .mockReturnValueOnce('Static Title'); // Third call for static title

      const field = createMockField(
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CUSTOMER_FOR_TIMESHEET_ENABLED,
        '',
      );

      const result = getTimeSheetFieldTitle(field, mockText);

      expect(result).toBe('Dynamic Title');
      expect(mockText).toHaveBeenNthCalledWith(
        2,
        {
          id: 'time-entries.section.title.time-sheet.customer-and-sub-customer.dynamic',
        },
        {
          customer: '',
          subCustomer: '',
        },
      );
    });

    it('handles customer field with special characters in title', () => {
      const mockText = jest
        .fn()
        .mockReturnValueOnce('Customer & Co.') // First call for standard title
        .mockReturnValueOnce('Dynamic Customer & Co. Title') // Second call for dynamic title
        .mockReturnValueOnce('Static Title'); // Third call for static title

      const field = createMockField(
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CUSTOMER_FOR_TIMESHEET_ENABLED,
        'Customer & Co.',
      );

      const result = getTimeSheetFieldTitle(field, mockText);

      expect(result).toBe('Dynamic Customer & Co. Title');
      expect(mockText).toHaveBeenNthCalledWith(
        2,
        {
          id: 'time-entries.section.title.time-sheet.customer-and-sub-customer.dynamic',
        },
        {
          customer: 'Customer & Co.',
          subCustomer: 'customer & co.',
        },
      );
    });

    it('handles text function throwing error', () => {
      const mockText = jest.fn().mockImplementation(() => {
        throw new Error('Translation error');
      });

      const field = createMockField('someOtherField', 'field.title.key');

      expect(() => getTimeSheetFieldTitle(field, mockText)).toThrow(
        'Translation error',
      );
    });

    it('verifies exact constant value used for customer field check', () => {
      const mockText = jest.fn().mockReturnValue('Title');

      // Test with the exact constant value
      const customerField = createMockField(
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CUSTOMER_FOR_TIMESHEET_ENABLED,
        'Customer',
      );

      // Test with a similar but different value
      const nonCustomerField = createMockField(
        'customersForTimeSheetEnabled_different',
        'Customer',
      );

      // Customer field should trigger special logic
      getTimeSheetFieldTitle(customerField, mockText);
      expect(mockText).toHaveBeenCalledTimes(3); // Called 3 times for customer field

      mockText.mockClear();

      // Non-customer field should only call text once
      getTimeSheetFieldTitle(nonCustomerField, mockText);
      expect(mockText).toHaveBeenCalledTimes(1); // Called only once for non-customer field
    });
  });

  describe('findConfigByName', () => {
    it('finds config entry by exact name match', () => {
      const result = findConfigByName(
        'time-entries.section.title.time-tracking',
      );

      expect(result).toBeDefined();
      expect(result?.name).toBe('time-entries.section.title.time-tracking');
      expect(result?.isNew).toBe(true);
      expect(result?.id).toBe('general-time');
    });

    it('finds config entry with isNew false', () => {
      const result = findConfigByName('time-entries.section.title.breaks');

      expect(result).toBeDefined();
      expect(result?.name).toBe('time-entries.section.title.breaks');
      expect(result?.isNew).toBe(false);
      expect(result?.id).toBe('breaks');
    });

    it('finds config entry and includes additional properties', () => {
      const result = findConfigByName('time-entries.section.title.time-sheet');

      expect(result).toBeDefined();
      expect(result?.name).toBe('time-entries.section.title.time-sheet');
      expect(result?.isNew).toBe(true);
      expect(result?.id).toBe('timesheet-fields');
      // The actual config has additional properties like supportedLists, isEnabled
      expect((result as any)?.supportedLists).toBeDefined();
      expect(typeof (result as any)?.isEnabled).toBe('function');
    });

    it('returns undefined for non-existent name', () => {
      const result = findConfigByName('non.existent.name');

      expect(result).toBeUndefined();
    });

    it('returns undefined for empty string', () => {
      const result = findConfigByName('');

      expect(result).toBeUndefined();
    });

    it('returns undefined for entries without name property', () => {
      // MANAGE_KIOSK in the actual config doesn't have name property
      const result = findConfigByName('manage-kiosk');

      expect(result).toBeUndefined();
    });

    it('returns undefined for entries that do not have both name and isNew properties', () => {
      // Test with a name that doesn't exist in the actual config
      const result = findConfigByName('some.non.existent.name');

      expect(result).toBeUndefined();
    });

    it('is case sensitive', () => {
      const result = findConfigByName(
        'TIME-ENTRIES.SECTION.TITLE.TIME-TRACKING',
      );

      expect(result).toBeUndefined();
    });

    it('handles partial matches correctly', () => {
      const result = findConfigByName('time-entries.section.title');

      expect(result).toBeUndefined();
    });

    it('uses Object.values to iterate through config entries', () => {
      // Test that the function properly uses Object.values
      const originalValues = Object.values;
      const mockValues = jest.fn().mockReturnValue([
        { id: 'test', name: 'test.name', isNew: true },
        { id: 'test2', enabled: true }, // missing name/isNew
      ]);
      Object.values = mockValues;

      const result = findConfigByName('test.name');

      expect(mockValues).toHaveBeenCalledWith(TIME_ENTRY_SETTINGS_CONFIG);
      expect(result).toBeDefined();
      expect(result?.name).toBe('test.name');

      // Restore original Object.values
      Object.values = originalValues;
    });

    it('works with all actual TIME_ENTRY_SETTINGS_CONFIG entries', () => {
      // Test with the actual config to ensure it works in real scenarios
      const timeTrackingResult = findConfigByName(
        'time-entries.section.title.time-tracking',
      );
      const timeSheetResult = findConfigByName(
        'time-entries.section.title.time-sheet',
      );
      const customFieldsResult = findConfigByName(
        'time-entries.section.title.custom-fields',
      );
      const notificationsResult = findConfigByName(
        'time-entries.section.title.notifications',
      );
      const breaksResult = findConfigByName(
        'time-entries.section.title.breaks',
      );

      expect(timeTrackingResult).toBeDefined();
      expect(timeTrackingResult?.name).toBe(
        'time-entries.section.title.time-tracking',
      );
      expect(timeTrackingResult?.isNew).toBe(true);

      expect(timeSheetResult).toBeDefined();
      expect(timeSheetResult?.name).toBe(
        'time-entries.section.title.time-sheet',
      );
      expect(timeSheetResult?.isNew).toBe(true);

      expect(customFieldsResult).toBeDefined();
      expect(customFieldsResult?.name).toBe(
        'time-entries.section.title.custom-fields',
      );
      expect(customFieldsResult?.isNew).toBe(true);

      expect(notificationsResult).toBeDefined();
      expect(notificationsResult?.name).toBe(
        'time-entries.section.title.notifications',
      );
      expect(notificationsResult?.isNew).toBe(true);

      expect(breaksResult).toBeDefined();
      expect(breaksResult?.name).toBe('time-entries.section.title.breaks');
      expect(breaksResult?.isNew).toBe(false);
    });

    it('verifies return type structure', () => {
      const result = findConfigByName(
        'time-entries.section.title.time-tracking',
      );

      expect(result).toBeDefined();
      expect(typeof result?.name).toBe('string');
      expect(typeof result?.isNew).toBe('boolean');

      // Should have NamedConfigEntry structure
      const namedConfigEntry = result as NamedConfigEntry;
      expect(namedConfigEntry.name).toBeDefined();
      expect(namedConfigEntry.isNew).toBeDefined();
    });

    it('handles edge case inputs', () => {
      // Test various edge case inputs
      expect(findConfigByName(null as any)).toBeUndefined();
      expect(findConfigByName(undefined as any)).toBeUndefined();
      expect(findConfigByName(' ')).toBeUndefined();
      expect(findConfigByName('\t')).toBeUndefined();
      expect(findConfigByName('\n')).toBeUndefined();
    });
  });

  describe('mapFieldApprovalSettingsField', () => {
    describe('version extraction', () => {
      it('should extract version when field has meta.version', () => {
        const field = {
          meta: { version: '1.5.0' },
          value: true,
        };
        const result = mapFieldApprovalSettingsField(field, false);
        expect(result.version).toBe('1.5.0');
      });

      it('should use default version "0" when field is null', () => {
        const result = mapFieldApprovalSettingsField(null, 'default');
        expect(result.version).toBe('0');
      });

      it('should use default version "0" when field is undefined', () => {
        const result = mapFieldApprovalSettingsField(undefined, 'default');
        expect(result.version).toBe('0');
      });

      it('should use default version "0" when meta is null', () => {
        const field = {
          meta: null,
          value: 'test',
        };
        const result = mapFieldApprovalSettingsField(field, 'default');
        expect(result.version).toBe('0');
      });

      it('should use default version "0" when meta is undefined', () => {
        const field = {
          meta: undefined,
          value: 'test',
        };
        const result = mapFieldApprovalSettingsField(field, 'default');
        expect(result.version).toBe('0');
      });

      it('should use default version "0" when meta.version is null', () => {
        const field = {
          meta: { version: null },
          value: 'test',
        };
        const result = mapFieldApprovalSettingsField(field, 'default');
        expect(result.version).toBe('0');
      });

      it('should use default version "0" when meta.version is undefined', () => {
        const field = {
          meta: { version: undefined },
          value: 'test',
        };
        const result = mapFieldApprovalSettingsField(field, 'default');
        expect(result.version).toBe('0');
      });

      it('should handle empty string version', () => {
        const field = {
          meta: { version: '' },
          value: 'test',
        };
        const result = mapFieldApprovalSettingsField(field, 'default');
        expect(result.version).toBe('');
      });

      it('should handle numeric string version', () => {
        const field = {
          meta: { version: '123' },
          value: 'test',
        };
        const result = mapFieldApprovalSettingsField(field, 'default');
        expect(result.version).toBe('123');
      });

      it('should handle semantic version strings', () => {
        const field = {
          meta: { version: '2.1.3-beta' },
          value: 'test',
        };
        const result = mapFieldApprovalSettingsField(field, 'default');
        expect(result.version).toBe('2.1.3-beta');
      });
    });

    describe('value extraction with different types', () => {
      it('should extract boolean value when present', () => {
        const field = {
          meta: { version: '1.0' },
          value: true,
        };
        const result = mapFieldApprovalSettingsField(field, false);
        expect(result.value).toBe(true);
      });

      it('should use default boolean value when value is null', () => {
        const field = {
          meta: { version: '1.0' },
          value: null,
        };
        const result = mapFieldApprovalSettingsField(field, false);
        expect(result.value).toBe(false);
      });

      it('should use default boolean value when value is undefined', () => {
        const field = {
          meta: { version: '1.0' },
          value: undefined,
        };
        const result = mapFieldApprovalSettingsField(field, true);
        expect(result.value).toBe(true);
      });

      it('should extract string value when present', () => {
        const field = {
          meta: { version: '1.0' },
          value: 'test string',
        };
        const result = mapFieldApprovalSettingsField(field, 'default');
        expect(result.value).toBe('test string');
      });

      it('should use default string value when value is null', () => {
        const field = {
          meta: { version: '1.0' },
          value: null,
        };
        const result = mapFieldApprovalSettingsField(field, 'default string');
        expect(result.value).toBe('default string');
      });

      it('should handle empty string value', () => {
        const field = {
          meta: { version: '1.0' },
          value: '',
        };
        const result = mapFieldApprovalSettingsField(field, 'default');
        expect(result.value).toBe('');
      });

      it('should extract number value when present', () => {
        const field = {
          meta: { version: '1.0' },
          value: 42,
        };
        const result = mapFieldApprovalSettingsField(field, 0);
        expect(result.value).toBe(42);
      });

      it('should use default number value when value is null', () => {
        const field = {
          meta: { version: '1.0' },
          value: null,
        };
        const result = mapFieldApprovalSettingsField(field, 100);
        expect(result.value).toBe(100);
      });

      it('should handle zero as a valid number value', () => {
        const field = {
          meta: { version: '1.0' },
          value: 0,
        };
        const result = mapFieldApprovalSettingsField(field, 100);
        expect(result.value).toBe(0);
      });

      it('should handle negative number value', () => {
        const field = {
          meta: { version: '1.0' },
          value: -5,
        };
        const result = mapFieldApprovalSettingsField(field, 10);
        expect(result.value).toBe(-5);
      });

      it('should extract array value when present', () => {
        const field = {
          meta: { version: '1.0' },
          value: ['item1', 'item2', 'item3'],
        };
        const result = mapFieldApprovalSettingsField(field, []);
        expect(result.value).toEqual(['item1', 'item2', 'item3']);
      });

      it('should use default array value when value is null', () => {
        const field = {
          meta: { version: '1.0' },
          value: null,
        };
        const result = mapFieldApprovalSettingsField(field, ['default']);
        expect(result.value).toEqual(['default']);
      });

      it('should handle empty array value', () => {
        const field = {
          meta: { version: '1.0' },
          value: [],
        };
        const result = mapFieldApprovalSettingsField(field, ['default']);
        expect(result.value).toEqual([]);
      });

      it('should extract object value when present', () => {
        const field = {
          meta: { version: '1.0' },
          value: { key: 'value', count: 5 },
        };
        const result = mapFieldApprovalSettingsField(field, {
          key: 'default',
          count: 0,
        });
        expect(result.value).toEqual({ key: 'value', count: 5 });
      });

      it('should use default object value when value is null', () => {
        const field = {
          meta: { version: '1.0' },
          value: null,
        };
        const result = mapFieldApprovalSettingsField(field, { default: true });
        expect(result.value).toEqual({ default: true });
      });
    });

    describe('combined scenarios', () => {
      it('should use both defaults when field is null', () => {
        const result = mapFieldApprovalSettingsField(null, 'default value');
        expect(result).toEqual({
          version: '0',
          value: 'default value',
        });
      });

      it('should use both defaults when field is undefined', () => {
        const result = mapFieldApprovalSettingsField(undefined, true);
        expect(result).toEqual({
          version: '0',
          value: true,
        });
      });

      it('should extract both version and value when present', () => {
        const field = {
          meta: { version: '2.0.0' },
          value: 'actual value',
        };
        const result = mapFieldApprovalSettingsField(field, 'default');
        expect(result).toEqual({
          version: '2.0.0',
          value: 'actual value',
        });
      });

      it('should use default value but custom version', () => {
        const field = {
          meta: { version: '3.0.0' },
          value: null,
        };
        const result = mapFieldApprovalSettingsField(field, 'fallback');
        expect(result).toEqual({
          version: '3.0.0',
          value: 'fallback',
        });
      });

      it('should use default version but custom value', () => {
        const field = {
          meta: null,
          value: 'custom value',
        };
        const result = mapFieldApprovalSettingsField(field, 'default');
        expect(result).toEqual({
          version: '0',
          value: 'custom value',
        });
      });

      it('should handle field with no meta property at all', () => {
        const field = {
          value: 'test',
        } as any;
        const result = mapFieldApprovalSettingsField(field, 'default');
        expect(result).toEqual({
          version: '0',
          value: 'test',
        });
      });

      it('should handle field with no value property at all', () => {
        const field = {
          meta: { version: '1.0' },
        } as any;
        const result = mapFieldApprovalSettingsField(field, 'default');
        expect(result).toEqual({
          version: '1.0',
          value: 'default',
        });
      });

      it('should handle completely empty field object', () => {
        const field = {} as any;
        const result = mapFieldApprovalSettingsField(field, 'default');
        expect(result).toEqual({
          version: '0',
          value: 'default',
        });
      });
    });

    describe('edge cases', () => {
      it('should handle false as a valid boolean value', () => {
        const field = {
          meta: { version: '1.0' },
          value: false,
        };
        const result = mapFieldApprovalSettingsField(field, true);
        expect(result.value).toBe(false);
      });

      it('should handle null default value', () => {
        const field = {
          meta: { version: '1.0' },
          value: null,
        };
        const result = mapFieldApprovalSettingsField(field, null);
        expect(result.value).toBe(null);
      });

      it('should handle undefined default value', () => {
        const field = {
          meta: { version: '1.0' },
          value: null,
        };
        const result = mapFieldApprovalSettingsField(field, undefined);
        expect(result.value).toBe(undefined);
      });

      it('should work with complex nested objects', () => {
        const complexValue = {
          nested: {
            deep: {
              value: 'test',
              array: [1, 2, 3],
            },
          },
        };
        const defaultValue = {
          nested: {
            deep: {
              value: 'default',
              array: [],
            },
          },
        };
        const field = {
          meta: { version: '1.0' },
          value: complexValue,
        };
        const result = mapFieldApprovalSettingsField(field, defaultValue);
        expect(result.value).toEqual(complexValue);
      });

      it('should work with mixed-type arrays', () => {
        const mixedArray = [1, 'string', true, null, { key: 'value' }];
        const field = {
          meta: { version: '1.0' },
          value: mixedArray,
        };
        const result = mapFieldApprovalSettingsField(field, []);
        expect(result.value).toEqual(mixedArray);
      });

      it('should preserve reference to the same array instance', () => {
        const arrayValue = ['test1', 'test2'];
        const field = {
          meta: { version: '1.0' },
          value: arrayValue,
        };
        const result = mapFieldApprovalSettingsField(field, []);
        expect(result.value).toBe(arrayValue);
      });

      it('should preserve reference to the same object instance', () => {
        const objectValue = { key: 'value' };
        const field = {
          meta: { version: '1.0' },
          value: objectValue,
        };
        const result = mapFieldApprovalSettingsField(field, { key: 'default' });
        expect(result.value).toBe(objectValue);
      });
    });

    describe('return type structure', () => {
      it('should always return an object with version and value properties', () => {
        const result = mapFieldApprovalSettingsField(null, 'default');
        expect(result).toHaveProperty('version');
        expect(result).toHaveProperty('value');
        expect(Object.keys(result)).toEqual(['version', 'value']);
      });

      it('should return version as string type', () => {
        const field = {
          meta: { version: '1.0' },
          value: 'test',
        };
        const result = mapFieldApprovalSettingsField(field, 'default');
        expect(typeof result.version).toBe('string');
      });

      it('should maintain type consistency for generic value', () => {
        const field = {
          meta: { version: '1.0' },
          value: 123,
        };
        const result = mapFieldApprovalSettingsField<number>(field, 0);
        expect(typeof result.value).toBe('number');
      });
    });
  });

  describe('getPayPeriodLabel', () => {
    const createMockIntl = () => ({
      formatMessage: jest.fn(({ id }) => {
        const messages: Record<string, string> = {
          'time-entries.approvals.payroll-close-date.on':
            'By payroll close date',
          'time-entries.approvals.payroll-close-date.1-day-after':
            '1 day after payroll close date',
          'time-entries.approvals.payroll-close-date.2-days-after':
            '2 days after payroll close date',
          'time-entries.approvals.payroll-close-date.3-days-after':
            '3 days after payroll close date',
          'time-entries.approvals.payroll-close-date.4-days-after':
            '4 days after payroll close date',
          'time-entries.approvals.payroll-close-date.5-days-after':
            '5 days after payroll close date',
          'time-entries.section.title.approvals.days-after-payroll-close-date':
            'days after payroll close date',
        };
        return messages[id] || id;
      }),
    });

    it('should return "By payroll close date" for offset 0', () => {
      const mockIntl = createMockIntl() as any;
      const result = getPayPeriodLabel(0, mockIntl);

      expect(result).toBe('By payroll close date');
      expect(mockIntl.formatMessage).toHaveBeenCalledWith({
        id: 'time-entries.approvals.payroll-close-date.on',
      });
    });

    it('should return "1 day after payroll close date" for offset 1', () => {
      const mockIntl = createMockIntl() as any;
      const result = getPayPeriodLabel(1, mockIntl);

      expect(result).toBe('1 day after payroll close date');
      expect(mockIntl.formatMessage).toHaveBeenCalledWith({
        id: 'time-entries.approvals.payroll-close-date.1-day-after',
      });
    });

    it('should return correct label for offset 2', () => {
      const mockIntl = createMockIntl() as any;
      const result = getPayPeriodLabel(2, mockIntl);

      expect(result).toBe('2 days after payroll close date');
      expect(mockIntl.formatMessage).toHaveBeenCalledWith({
        id: 'time-entries.approvals.payroll-close-date.2-days-after',
      });
    });

    it('should return correct label for offset 3', () => {
      const mockIntl = createMockIntl() as any;
      const result = getPayPeriodLabel(3, mockIntl);

      expect(result).toBe('3 days after payroll close date');
      expect(mockIntl.formatMessage).toHaveBeenCalledWith({
        id: 'time-entries.approvals.payroll-close-date.3-days-after',
      });
    });

    it('should return correct label for offset 4', () => {
      const mockIntl = createMockIntl() as any;
      const result = getPayPeriodLabel(4, mockIntl);

      expect(result).toBe('4 days after payroll close date');
      expect(mockIntl.formatMessage).toHaveBeenCalledWith({
        id: 'time-entries.approvals.payroll-close-date.4-days-after',
      });
    });

    it('should return correct label for offset 5', () => {
      const mockIntl = createMockIntl() as any;
      const result = getPayPeriodLabel(5, mockIntl);

      expect(result).toBe('5 days after payroll close date');
      expect(mockIntl.formatMessage).toHaveBeenCalledWith({
        id: 'time-entries.approvals.payroll-close-date.5-days-after',
      });
    });

    it('should return generic format for offsets beyond 5', () => {
      const mockIntl = createMockIntl() as any;
      const result = getPayPeriodLabel(6, mockIntl);

      expect(result).toBe('6 days after payroll close date');
      expect(mockIntl.formatMessage).toHaveBeenCalledWith({
        id: 'time-entries.section.title.approvals.days-after-payroll-close-date',
      });
    });

    it('should handle large offset values', () => {
      const mockIntl = createMockIntl() as any;
      const result = getPayPeriodLabel(10, mockIntl);

      expect(result).toBe('10 days after payroll close date');
    });

    it('should handle negative offset values', () => {
      const mockIntl = createMockIntl() as any;
      const result = getPayPeriodLabel(-1, mockIntl);

      expect(result).toBe('-1 days after payroll close date');
    });

    it('should find correct option from APPROVAL_PAY_PERIOD_OPTIONS for valid offsets', () => {
      const mockIntl = createMockIntl() as any;

      // Test all valid options (0-5)
      for (let i = 0; i <= 5; i += 1) {
        mockIntl.formatMessage.mockClear();
        getPayPeriodLabel(i, mockIntl);
        expect(mockIntl.formatMessage).toHaveBeenCalledTimes(1);
      }
    });

    it('should convert numeric offset to string when looking up in options', () => {
      const mockIntl = createMockIntl() as any;
      const result = getPayPeriodLabel(1, mockIntl);

      // Verify it's looking up string value
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle formatMessage returning translation key as fallback', () => {
      const mockIntl = {
        formatMessage: jest.fn(({ id }) => id),
      } as any;

      const result = getPayPeriodLabel(0, mockIntl);

      expect(result).toBe('time-entries.approvals.payroll-close-date.on');
    });
  });

  describe('formatArrayToTitleCase', () => {
    it('should format single lowercase word to title case', () => {
      const result = formatArrayToTitleCase(['monday']);
      expect(result).toBe('Monday');
    });

    it('should format multiple lowercase words to title case', () => {
      const result = formatArrayToTitleCase(['monday', 'tuesday', 'wednesday']);
      expect(result).toBe('Monday, Tuesday, Wednesday');
    });

    it('should handle uppercase words', () => {
      const result = formatArrayToTitleCase(['MONDAY', 'TUESDAY']);
      expect(result).toBe('Monday, Tuesday');
    });

    it('should handle mixed case words', () => {
      const result = formatArrayToTitleCase(['MoNdAy', 'TuEsDaY']);
      expect(result).toBe('Monday, Tuesday');
    });

    it('should return empty string for empty array', () => {
      const result = formatArrayToTitleCase([]);
      expect(result).toBe('');
    });

    it('should return empty string for null input', () => {
      const result = formatArrayToTitleCase(null as any);
      expect(result).toBe('');
    });

    it('should return empty string for undefined input', () => {
      const result = formatArrayToTitleCase(undefined as any);
      expect(result).toBe('');
    });

    it('should handle single character strings', () => {
      const result = formatArrayToTitleCase(['a', 'b', 'c']);
      expect(result).toBe('A, B, C');
    });

    it('should handle empty strings in array', () => {
      const result = formatArrayToTitleCase(['monday', '', 'tuesday']);
      expect(result).toBe('Monday, , Tuesday');
    });

    it('should preserve single word without comma', () => {
      const result = formatArrayToTitleCase(['hello']);
      expect(result).toBe('Hello');
    });

    it('should join multiple words with comma and space', () => {
      const result = formatArrayToTitleCase(['one', 'two', 'three', 'four']);
      expect(result).toBe('One, Two, Three, Four');
    });

    it('should handle words with numbers', () => {
      const result = formatArrayToTitleCase(['day1', 'day2']);
      expect(result).toBe('Day1, Day2');
    });

    it('should handle special characters', () => {
      const result = formatArrayToTitleCase(['hello-world', 'test_case']);
      expect(result).toBe('Hello-world, Test_case');
    });

    it('should handle very long strings', () => {
      const longString = 'verylongstringthatkeepsgoing';
      const result = formatArrayToTitleCase([longString]);
      expect(result).toBe('Verylongstringthatkeepsgoing');
    });

    it('should handle words with spaces (title cases only first letter)', () => {
      const result = formatArrayToTitleCase(['hello world']);
      expect(result).toBe('Hello world');
    });

    it('should format notification medium values', () => {
      const result = formatArrayToTitleCase(['EMAIL']);
      expect(result).toBe('Email');
    });

    it('should format day of week values', () => {
      const result = formatArrayToTitleCase(['monday', 'wednesday', 'friday']);
      expect(result).toBe('Monday, Wednesday, Friday');
    });

    it('should handle array with one empty element', () => {
      const result = formatArrayToTitleCase(['']);
      expect(result).toBe('');
    });

    it('should handle all uppercase notification mediums', () => {
      const result = formatArrayToTitleCase(['EMAIL', 'SMS', 'PUSH']);
      expect(result).toBe('Email, Sms, Push');
    });

    it('should not add extra spaces between commas', () => {
      const result = formatArrayToTitleCase(['a', 'b', 'c']);
      expect(result).not.toContain('  ');
      expect(result).toBe('A, B, C');
    });

    it('should handle camelCase words', () => {
      const result = formatArrayToTitleCase(['camelCase', 'anotherWord']);
      expect(result).toBe('Camelcase, Anotherword');
    });

    it('should handle PascalCase words', () => {
      const result = formatArrayToTitleCase(['PascalCase', 'AnotherWord']);
      expect(result).toBe('Pascalcase, Anotherword');
    });

    it('should handle array with multiple empty strings', () => {
      const result = formatArrayToTitleCase(['', '', '']);
      expect(result).toBe(', , ');
    });

    it('should handle consecutive values without losing any', () => {
      const input = ['a', 'b', 'c', 'd', 'e'];
      const result = formatArrayToTitleCase(input);
      const parts = result.split(', ');
      expect(parts).toHaveLength(5);
      expect(parts).toEqual(['A', 'B', 'C', 'D', 'E']);
    });

    it('should not mutate the original array', () => {
      const input = ['monday', 'tuesday'];
      const originalInput = [...input];
      formatArrayToTitleCase(input);
      expect(input).toEqual(originalInput);
    });

    it('should handle unicode characters', () => {
      const result = formatArrayToTitleCase(['café', 'naïve']);
      expect(result).toBe('Café, Naïve');
    });
  });

  describe('getReminderMessageKey', () => {
    describe('Manager role', () => {
      describe('PAYROLL_CLOSE_DATE frequency', () => {
        it('should return correct key for first reminder', () => {
          const result = getReminderMessageKey(
            ReminderRole.MANAGER,
            ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
            true,
          );

          expect(result).toBe(
            'time-entries.section.title.approvals.remind-if-time-not-approved-by-payroll-close',
          );
        });

        it('should return correct key for second reminder', () => {
          const result = getReminderMessageKey(
            ReminderRole.MANAGER,
            ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
            false,
          );

          expect(result).toBe(
            'time-entries.section.title.approvals.remind-second-time-not-approved-by-payroll-close',
          );
        });
      });

      describe('DAY_OF_WEEK frequency', () => {
        it('should return correct key for first reminder', () => {
          const result = getReminderMessageKey(
            ReminderRole.MANAGER,
            ApprovalRemindersbasedOn.DAY_OF_WEEK,
            true,
          );

          expect(result).toBe(
            'time-entries.section.title.approvals.remind-if-time-not-approved-current-week',
          );
        });

        it('should return correct key for second reminder', () => {
          const result = getReminderMessageKey(
            ReminderRole.MANAGER,
            ApprovalRemindersbasedOn.DAY_OF_WEEK,
            false,
          );

          expect(result).toBe(
            'time-entries.section.title.approvals.remind-if-time-not-approved-prior-week',
          );
        });
      });

      describe('DAILY frequency', () => {
        it('should return empty string for first reminder', () => {
          const result = getReminderMessageKey(
            ReminderRole.MANAGER,
            ApprovalRemindersbasedOn.DAILY,
            true,
          );

          expect(result).toBe('');
        });

        it('should return empty string for second reminder', () => {
          const result = getReminderMessageKey(
            ReminderRole.MANAGER,
            ApprovalRemindersbasedOn.DAILY,
            false,
          );

          expect(result).toBe('');
        });
      });
    });

    describe('Employee role', () => {
      describe('DAILY frequency', () => {
        it('should return correct key for first reminder', () => {
          const result = getReminderMessageKey(
            ReminderRole.EMPLOYEE,
            ApprovalRemindersbasedOn.DAILY,
            true,
          );

          expect(result).toBe(
            'time-entries.section.title.submissions.remind-if-time-not-submitted-daily',
          );
        });

        it('should return correct key for second reminder', () => {
          const result = getReminderMessageKey(
            ReminderRole.EMPLOYEE,
            ApprovalRemindersbasedOn.DAILY,
            false,
          );

          expect(result).toBe(
            'time-entries.section.title.submissions.remind-second-time-not-submitted-daily',
          );
        });
      });

      describe('PAYROLL_CLOSE_DATE frequency', () => {
        it('should return correct key for first reminder', () => {
          const result = getReminderMessageKey(
            ReminderRole.EMPLOYEE,
            ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
            true,
          );

          expect(result).toBe(
            'time-entries.section.title.submissions.remind-if-time-not-submitted-by-payroll-close',
          );
        });

        it('should return correct key for second reminder', () => {
          const result = getReminderMessageKey(
            ReminderRole.EMPLOYEE,
            ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
            false,
          );

          expect(result).toBe(
            'time-entries.section.title.submissions.remind-second-time-not-submitted-by-payroll-close',
          );
        });
      });

      describe('DAY_OF_WEEK frequency', () => {
        it('should return correct key for first reminder', () => {
          const result = getReminderMessageKey(
            ReminderRole.EMPLOYEE,
            ApprovalRemindersbasedOn.DAY_OF_WEEK,
            true,
          );

          expect(result).toBe(
            'time-entries.section.title.submissions.remind-if-time-not-submitted',
          );
        });

        it('should return correct key for second reminder', () => {
          const result = getReminderMessageKey(
            ReminderRole.EMPLOYEE,
            ApprovalRemindersbasedOn.DAY_OF_WEEK,
            false,
          );

          expect(result).toBe(
            'time-entries.section.title.submissions.remind-second-time-not-submitted',
          );
        });
      });
    });

    describe('Return type and consistency', () => {
      it('should always return a string', () => {
        const result = getReminderMessageKey(
          ReminderRole.MANAGER,
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          true,
        );

        expect(typeof result).toBe('string');
      });

      it('should return consistent results for same inputs', () => {
        const result1 = getReminderMessageKey(
          ReminderRole.EMPLOYEE,
          ApprovalRemindersbasedOn.DAILY,
          true,
        );
        const result2 = getReminderMessageKey(
          ReminderRole.EMPLOYEE,
          ApprovalRemindersbasedOn.DAILY,
          true,
        );

        expect(result1).toBe(result2);
      });

      it('should return different keys for first vs second reminders', () => {
        const firstReminder = getReminderMessageKey(
          ReminderRole.MANAGER,
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          true,
        );
        const secondReminder = getReminderMessageKey(
          ReminderRole.MANAGER,
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          false,
        );

        expect(firstReminder).not.toBe(secondReminder);
        expect(firstReminder).toContain('current-week');
        expect(secondReminder).toContain('prior-week');
      });

      it('should return different keys for manager vs employee', () => {
        const managerKey = getReminderMessageKey(
          ReminderRole.MANAGER,
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          true,
        );
        const employeeKey = getReminderMessageKey(
          ReminderRole.EMPLOYEE,
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          true,
        );

        expect(managerKey).not.toBe(employeeKey);
        expect(managerKey).toContain('approvals');
        expect(employeeKey).toContain('submissions');
      });

      it('should return different keys for different frequencies', () => {
        const dayOfWeekKey = getReminderMessageKey(
          ReminderRole.EMPLOYEE,
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          true,
        );
        const payrollKey = getReminderMessageKey(
          ReminderRole.EMPLOYEE,
          ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
          true,
        );
        const dailyKey = getReminderMessageKey(
          ReminderRole.EMPLOYEE,
          ApprovalRemindersbasedOn.DAILY,
          true,
        );

        expect(dayOfWeekKey).not.toBe(payrollKey);
        expect(dayOfWeekKey).not.toBe(dailyKey);
        expect(payrollKey).not.toBe(dailyKey);
      });
    });

    describe('Edge cases', () => {
      it('should handle all combinations of role, frequency, and order', () => {
        const roles = [ReminderRole.MANAGER, ReminderRole.EMPLOYEE];
        const frequencies = [
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
          ApprovalRemindersbasedOn.DAILY,
        ];
        const orders = [true, false];

        roles.forEach((role) => {
          frequencies.forEach((frequency) => {
            orders.forEach((isFirst) => {
              const result = getReminderMessageKey(role, frequency, isFirst);

              // Should always return a string
              expect(typeof result).toBe('string');

              // Manager + DAILY should return empty string
              if (
                role === ReminderRole.MANAGER &&
                frequency === ApprovalRemindersbasedOn.DAILY
              ) {
                expect(result).toBe('');
              } else {
                // All other combinations should return a non-empty translation key
                expect(result).toBeTruthy();
                expect(result).toContain('time-entries.section.title');
              }
            });
          });
        });
      });

      it('should return empty string for unsupported manager + DAILY combination', () => {
        const firstReminder = getReminderMessageKey(
          ReminderRole.MANAGER,
          ApprovalRemindersbasedOn.DAILY,
          true,
        );
        const secondReminder = getReminderMessageKey(
          ReminderRole.MANAGER,
          ApprovalRemindersbasedOn.DAILY,
          false,
        );

        expect(firstReminder).toBe('');
        expect(secondReminder).toBe('');
      });

      it('should return valid translation keys that contain correct domain', () => {
        const managerKey = getReminderMessageKey(
          ReminderRole.MANAGER,
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          true,
        );
        const employeeKey = getReminderMessageKey(
          ReminderRole.EMPLOYEE,
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          true,
        );

        expect(managerKey).toContain('.approvals.');
        expect(employeeKey).toContain('.submissions.');
      });

      it('should differentiate between current and previous/second reminders in keys', () => {
        const managerFirstWeek = getReminderMessageKey(
          ReminderRole.MANAGER,
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          true,
        );
        const managerSecondWeek = getReminderMessageKey(
          ReminderRole.MANAGER,
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          false,
        );

        const employeeFirstDaily = getReminderMessageKey(
          ReminderRole.EMPLOYEE,
          ApprovalRemindersbasedOn.DAILY,
          true,
        );
        const employeeSecondDaily = getReminderMessageKey(
          ReminderRole.EMPLOYEE,
          ApprovalRemindersbasedOn.DAILY,
          false,
        );

        // Manager DAY_OF_WEEK: first has "current-week", second has "prior-week"
        expect(managerFirstWeek).toContain('current-week');
        expect(managerSecondWeek).toContain('prior-week');

        // Employee DAILY: first doesn't contain 'second', second does
        expect(employeeFirstDaily).not.toContain('second');
        expect(employeeSecondDaily).toContain('second');
      });
    });
  });

  describe('getReminderData', () => {
    const mockIntl = {
      formatMessage: jest.fn(({ id }) => {
        if (id === 'off') return 'Off';
        if (
          id ===
          'time-entries.section.title.approvals.days-after-payroll-close-date'
        ) {
          return 'days after payroll close date';
        }
        // Handle payroll close date specific keys
        if (id === 'time-entries.approvals.payroll-close-date.on') {
          return 'By payroll close date';
        }
        if (id === 'time-entries.approvals.payroll-close-date.1-day-after') {
          return '1 day after payroll close date';
        }
        if (id === 'time-entries.approvals.payroll-close-date.2-days-after') {
          return '2 days after payroll close date';
        }
        if (id === 'time-entries.approvals.payroll-close-date.3-days-after') {
          return '3 days after payroll close date';
        }
        if (id === 'time-entries.approvals.payroll-close-date.4-days-after') {
          return '4 days after payroll close date';
        }
        if (id === 'time-entries.approvals.payroll-close-date.5-days-after') {
          return '5 days after payroll close date';
        }
        return id;
      }),
    };

    beforeEach(() => {
      mockIntl.formatMessage.mockClear();
    });

    describe('Manager role', () => {
      describe('day of week reminders', () => {
        it('should format day of week reminder data correctly with EMAIL medium', () => {
          const mockSettings: any = {
            managerCurrentWeekReminderDays: { value: ['monday', 'friday'] },
            managerCurrentWeekReminderHour: { value: 9 },
            managerCurrentWeekReminderMedium: { value: ['EMAIL'] },
          };

          const result = getReminderData(
            mockSettings,
            ReminderRole.MANAGER,
            ApprovalReminderPrefix.CURRENT,
            ApprovalRemindersbasedOn.DAY_OF_WEEK,
            false,
            mockIntl,
          );

          expect(result.fieldValue).toContain('Monday, Friday');
          expect(result.fieldValue).toContain('9:00 AM');
          expect(result.fieldValue).toContain('Email');
          expect(result.formValues.managerCurrentWeekReminderDays).toEqual([
            'monday',
            'friday',
          ]);
          expect(result.formValues.managerCurrentWeekReminderHour).toBe(
            '9:00 AM',
          );
        });

        it('should show "Off" when EMAIL medium is not present for day of week', () => {
          const mockSettings: any = {
            managerCurrentWeekReminderDays: { value: ['monday'] },
            managerCurrentWeekReminderHour: { value: 9 },
            managerCurrentWeekReminderMedium: { value: ['PUSH_NOTIFICATION'] },
          };

          const result = getReminderData(
            mockSettings,
            ReminderRole.MANAGER,
            ApprovalReminderPrefix.CURRENT,
            ApprovalRemindersbasedOn.DAY_OF_WEEK,
            false,
            mockIntl,
          );

          expect(result.fieldValue).toBe('Off');
          expect(mockIntl.formatMessage).toHaveBeenCalledWith({ id: 'off' });
        });
      });

      describe('payroll close date reminders', () => {
        it('should format payroll close date reminder data correctly with EMAIL medium', () => {
          const mockSettings: any = {
            managerCurrentPayPeriodReminderHour: { value: 15 },
            managerCurrentPayPeriodReminderOffsetDays: { value: 3 },
            managerCurrentPayPeriodReminderMedium: { value: ['EMAIL'] },
          };

          const result = getReminderData(
            mockSettings,
            ReminderRole.MANAGER,
            ApprovalReminderPrefix.CURRENT,
            ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
            false,
            mockIntl,
          );

          expect(result.fieldValue).toContain('3');
          expect(result.fieldValue).toContain('3:00 PM');
          // Should contain the translated payroll close date label
          expect(result.fieldValue).toMatch(/3 days after|3-days-after/);
          expect(
            result.formValues.managerCurrentPayPeriodReminderOffsetDays,
          ).toBe(3);
          // Verify fieldTitle differentiates current reminder
          expect(mockIntl.formatMessage).toHaveBeenCalledWith({
            id: 'time-entries.section.title.approvals.remind-if-time-not-approved-by-payroll-close',
          });
        });

        it('should show "Off" when EMAIL medium is not present for payroll close date', () => {
          const mockSettings: any = {
            managerCurrentPayPeriodReminderHour: { value: 15 },
            managerCurrentPayPeriodReminderOffsetDays: { value: 3 },
            managerCurrentPayPeriodReminderMedium: { value: [] },
          };

          const result = getReminderData(
            mockSettings,
            ReminderRole.MANAGER,
            ApprovalReminderPrefix.CURRENT,
            ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
            false,
            mockIntl,
          );

          expect(result.fieldValue).toBe('Off');
        });

        it('should differentiate between CURRENT and PREVIOUS reminder titles for payroll close date', () => {
          const mockSettings: any = {
            managerCurrentPayPeriodReminderHour: { value: 15 },
            managerCurrentPayPeriodReminderOffsetDays: { value: 3 },
            managerCurrentPayPeriodReminderMedium: { value: ['EMAIL'] },
            managerPreviousPayPeriodReminderHour: { value: 16 },
            managerPreviousPayPeriodReminderOffsetDays: { value: 4 },
            managerPreviousPayPeriodReminderMedium: { value: ['EMAIL'] },
          };

          const currentResult = getReminderData(
            mockSettings,
            ReminderRole.MANAGER,
            ApprovalReminderPrefix.CURRENT,
            ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
            false,
            mockIntl,
          );

          const previousResult = getReminderData(
            mockSettings,
            ReminderRole.MANAGER,
            ApprovalReminderPrefix.PREVIOUS,
            ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
            false,
            mockIntl,
          );

          // Verify current reminder uses first/current key
          expect(mockIntl.formatMessage).toHaveBeenCalledWith({
            id: 'time-entries.section.title.approvals.remind-if-time-not-approved-by-payroll-close',
          });

          // Verify previous reminder uses second/previous key
          expect(mockIntl.formatMessage).toHaveBeenCalledWith({
            id: 'time-entries.section.title.approvals.remind-second-time-not-approved-by-payroll-close',
          });
        });
      });

      describe('locale handling', () => {
        it('should handle UK locale time format', () => {
          const mockSettings: any = {
            managerPreviousWeekReminderHour: { value: 14 },
            managerPreviousWeekReminderDays: { value: ['tuesday'] },
            managerPreviousWeekReminderMedium: { value: ['EMAIL'] },
          };

          const result = getReminderData(
            mockSettings,
            ReminderRole.MANAGER,
            ApprovalReminderPrefix.PREVIOUS,
            ApprovalRemindersbasedOn.DAY_OF_WEEK,
            true,
            mockIntl,
          );

          expect(result.formValues.managerPreviousWeekReminderHour).toBe(
            '14:00',
          );
          expect(result.fieldValue).toContain('14:00');
        });

        it('should handle US locale time format', () => {
          const mockSettings: any = {
            managerCurrentWeekReminderHour: { value: 14 },
            managerCurrentWeekReminderDays: { value: ['monday'] },
            managerCurrentWeekReminderMedium: { value: ['EMAIL'] },
          };

          const result = getReminderData(
            mockSettings,
            ReminderRole.MANAGER,
            ApprovalReminderPrefix.CURRENT,
            ApprovalRemindersbasedOn.DAY_OF_WEEK,
            false,
            mockIntl,
          );

          expect(result.formValues.managerCurrentWeekReminderHour).toBe(
            '2:00 PM',
          );
        });
      });
    });

    describe('Employee role', () => {
      describe('day of week reminders', () => {
        it('should show formatted value when EMAIL medium is present', () => {
          const mockSettings: any = {
            employeeCurrentWeekReminderDays: { value: ['monday'] },
            employeeCurrentWeekReminderHour: { value: 10 },
            employeeCurrentWeekReminderMedium: { value: ['EMAIL'] },
          };

          const result = getReminderData(
            mockSettings,
            ReminderRole.EMPLOYEE,
            ApprovalReminderPrefix.CURRENT,
            ApprovalRemindersbasedOn.DAY_OF_WEEK,
            false,
            mockIntl,
          );

          expect(result.fieldValue).toContain('Monday');
          expect(result.fieldValue).toContain('10:00 AM');
          expect(result.formValues.employeeCurrentWeekReminderDays).toEqual([
            'monday',
          ]);
        });

        it('should show "Off" when EMAIL medium is not present', () => {
          const mockSettings: any = {
            employeeCurrentWeekReminderDays: { value: ['monday'] },
            employeeCurrentWeekReminderHour: { value: 10 },
            employeeCurrentWeekReminderMedium: { value: ['PUSH_NOTIFICATION'] },
          };

          const result = getReminderData(
            mockSettings,
            ReminderRole.EMPLOYEE,
            ApprovalReminderPrefix.CURRENT,
            ApprovalRemindersbasedOn.DAY_OF_WEEK,
            false,
            mockIntl,
          );

          expect(result.fieldValue).toBe('Off');
        });
      });

      describe('payroll close date reminders', () => {
        it('should handle payroll close date reminders with EMAIL medium', () => {
          const mockSettings: any = {
            employeeCurrentPayPeriodReminderHour: { value: 16 },
            employeeCurrentPayPeriodReminderOffsetDays: { value: 3 },
            employeeCurrentPayPeriodReminderMedium: { value: ['EMAIL'] },
          };

          const result = getReminderData(
            mockSettings,
            ReminderRole.EMPLOYEE,
            ApprovalReminderPrefix.CURRENT,
            ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
            false,
            mockIntl,
          );

          expect(result.fieldValue).toContain('4:00 PM');
          expect(result.fieldValue).toContain('3');
          // Should contain the translated payroll close date label
          expect(result.fieldValue).toMatch(/3 days after|3-days-after/);
          expect(
            result.formValues.employeeCurrentPayPeriodReminderOffsetDays,
          ).toBe(3);
          // Verify fieldTitle differentiates current reminder
          expect(mockIntl.formatMessage).toHaveBeenCalledWith({
            id: 'time-entries.section.title.submissions.remind-if-time-not-submitted-by-payroll-close',
          });
        });

        it('should show "Off" when EMAIL medium is not present for payroll', () => {
          const mockSettings: any = {
            employeeCurrentPayPeriodReminderHour: { value: 16 },
            employeeCurrentPayPeriodReminderOffsetDays: { value: 3 },
            employeeCurrentPayPeriodReminderMedium: { value: [] },
          };

          const result = getReminderData(
            mockSettings,
            ReminderRole.EMPLOYEE,
            ApprovalReminderPrefix.CURRENT,
            ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
            false,
            mockIntl,
          );

          expect(result.fieldValue).toBe('Off');
        });

        it('should differentiate between CURRENT and PREVIOUS reminder titles for employee payroll close date', () => {
          const mockSettings: any = {
            employeeCurrentPayPeriodReminderHour: { value: 16 },
            employeeCurrentPayPeriodReminderOffsetDays: { value: 3 },
            employeeCurrentPayPeriodReminderMedium: { value: ['EMAIL'] },
            employeePreviousPayPeriodReminderHour: { value: 17 },
            employeePreviousPayPeriodReminderOffsetDays: { value: 4 },
            employeePreviousPayPeriodReminderMedium: { value: ['EMAIL'] },
          };

          const currentResult = getReminderData(
            mockSettings,
            ReminderRole.EMPLOYEE,
            ApprovalReminderPrefix.CURRENT,
            ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
            false,
            mockIntl,
          );

          const previousResult = getReminderData(
            mockSettings,
            ReminderRole.EMPLOYEE,
            ApprovalReminderPrefix.PREVIOUS,
            ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
            false,
            mockIntl,
          );

          // Verify current reminder uses first/current key
          expect(mockIntl.formatMessage).toHaveBeenCalledWith({
            id: 'time-entries.section.title.submissions.remind-if-time-not-submitted-by-payroll-close',
          });

          // Verify previous reminder uses second/previous key
          expect(mockIntl.formatMessage).toHaveBeenCalledWith({
            id: 'time-entries.section.title.submissions.remind-second-time-not-submitted-by-payroll-close',
          });
        });
      });

      describe('daily reminders', () => {
        it('should handle daily reminders with CURRENT prefix (First)', () => {
          const mockSettings: any = {
            employeeDailyReminderFirstReminderHour: { value: 11 },
            employeeDailyReminderFirstReminderMedium: { value: ['EMAIL'] },
          };

          const result = getReminderData(
            mockSettings,
            ReminderRole.EMPLOYEE,
            ApprovalReminderPrefix.CURRENT,
            ApprovalRemindersbasedOn.DAILY,
            false,
            mockIntl,
          );

          expect(result.fieldValue).toContain('11:00 AM');
          expect(result.formValues).toHaveProperty(
            'employeeDailyReminderFirstReminderHour',
            '11:00 AM',
          );
          expect(result.formValues).toHaveProperty(
            'employeeDailyReminderFirstReminderMedium',
            ['EMAIL'],
          );
        });

        it('should handle daily reminders with PREVIOUS prefix (Second)', () => {
          const mockSettings: any = {
            employeeDailyReminderSecondReminderHour: { value: 15 },
            employeeDailyReminderSecondReminderMedium: { value: ['EMAIL'] },
          };

          const result = getReminderData(
            mockSettings,
            ReminderRole.EMPLOYEE,
            ApprovalReminderPrefix.PREVIOUS,
            ApprovalRemindersbasedOn.DAILY,
            false,
            mockIntl,
          );

          expect(result.fieldValue).toContain('3:00 PM');
          expect(result.formValues).toHaveProperty(
            'employeeDailyReminderSecondReminderHour',
            '3:00 PM',
          );
          expect(result.formValues).not.toHaveProperty(
            'employeeDailyReminderFirstReminderHour',
          );
        });

        it('should show "Off" when EMAIL medium is not present for daily', () => {
          const mockSettings: any = {
            employeeDailyReminderFirstReminderHour: { value: 11 },
            employeeDailyReminderFirstReminderMedium: { value: [] },
          };

          const result = getReminderData(
            mockSettings,
            ReminderRole.EMPLOYEE,
            ApprovalReminderPrefix.CURRENT,
            ApprovalRemindersbasedOn.DAILY,
            false,
            mockIntl,
          );

          expect(result.fieldValue).toBe('Off');
        });
      });

      describe('locale handling', () => {
        it('should handle UK locale', () => {
          const mockSettings: any = {
            employeePreviousWeekReminderHour: { value: 15 },
            employeePreviousWeekReminderDays: { value: ['tuesday'] },
            employeePreviousWeekReminderMedium: { value: ['EMAIL'] },
          };

          const result = getReminderData(
            mockSettings,
            ReminderRole.EMPLOYEE,
            ApprovalReminderPrefix.PREVIOUS,
            ApprovalRemindersbasedOn.DAY_OF_WEEK,
            true,
            mockIntl,
          );

          expect(result.formValues.employeePreviousWeekReminderHour).toBe(
            '15:00',
          );
        });
      });
    });

    describe('edge cases', () => {
      it('should handle missing values with defaults', () => {
        const mockSettings: any = {};

        const result = getReminderData(
          mockSettings,
          ReminderRole.MANAGER,
          ApprovalReminderPrefix.CURRENT,
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          false,
          mockIntl,
        );

        expect(result.fieldValue).toBe('Off');
        expect(result.formValues.managerCurrentWeekReminderDays).toEqual([]);
        expect(result.formValues.managerCurrentWeekReminderMedium).toEqual([]);
      });

      it('should not include daily reminder fields for manager role', () => {
        const mockSettings: any = {
          managerCurrentWeekReminderDays: { value: ['monday'] },
          managerCurrentWeekReminderHour: { value: 9 },
          managerCurrentWeekReminderMedium: { value: ['EMAIL'] },
        };

        const result = getReminderData(
          mockSettings,
          ReminderRole.MANAGER,
          ApprovalReminderPrefix.CURRENT,
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          false,
          mockIntl,
        );

        expect(result.formValues).not.toHaveProperty(
          'employeeDailyReminderFirstReminderHour',
        );
        expect(result.formValues).not.toHaveProperty(
          'managerDailyReminderFirstReminderHour',
        );
      });

      it('should handle empty medium array', () => {
        const mockSettings: any = {
          managerCurrentWeekReminderDays: { value: ['monday'] },
          managerCurrentWeekReminderHour: { value: 9 },
          managerCurrentWeekReminderMedium: { value: [] },
        };

        const result = getReminderData(
          mockSettings,
          ReminderRole.MANAGER,
          ApprovalReminderPrefix.CURRENT,
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          false,
          mockIntl,
        );

        expect(result.fieldValue).toBe('Off');
      });
    });
  });

  describe('createReminderFieldNames', () => {
    it('should create a ReminderFieldNames object with all three fields', () => {
      const result = createReminderFieldNames(
        NotificationFieldKey.EMPLOYEE_CURRENT_WEEK_REMINDER_MEDIUM,
        NotificationFieldKey.EMPLOYEE_CURRENT_WEEK_REMINDER_HOUR,
        NotificationFieldKey.EMPLOYEE_CURRENT_WEEK_REMINDER_DAYS,
      );

      expect(result).toEqual({
        medium: NotificationFieldKey.EMPLOYEE_CURRENT_WEEK_REMINDER_MEDIUM,
        hour: NotificationFieldKey.EMPLOYEE_CURRENT_WEEK_REMINDER_HOUR,
        day: NotificationFieldKey.EMPLOYEE_CURRENT_WEEK_REMINDER_DAYS,
      });
    });

    it('should create a ReminderFieldNames object with empty string for day when not provided', () => {
      const result = createReminderFieldNames(
        NotificationFieldKey.EMPLOYEE_DAILY_REMINDER_FIRST_REMINDER_MEDIUM,
        NotificationFieldKey.EMPLOYEE_DAILY_REMINDER_FIRST_REMINDER_HOUR,
      );

      expect(result).toEqual({
        medium:
          NotificationFieldKey.EMPLOYEE_DAILY_REMINDER_FIRST_REMINDER_MEDIUM,
        hour: NotificationFieldKey.EMPLOYEE_DAILY_REMINDER_FIRST_REMINDER_HOUR,
        day: '',
      });
    });

    it('should create a ReminderFieldNames object with explicit empty string for day', () => {
      const result = createReminderFieldNames(
        NotificationFieldKey.EMPLOYEE_DAILY_REMINDER_SECOND_REMINDER_MEDIUM,
        NotificationFieldKey.EMPLOYEE_DAILY_REMINDER_SECOND_REMINDER_HOUR,
        '',
      );

      expect(result).toEqual({
        medium:
          NotificationFieldKey.EMPLOYEE_DAILY_REMINDER_SECOND_REMINDER_MEDIUM,
        hour: NotificationFieldKey.EMPLOYEE_DAILY_REMINDER_SECOND_REMINDER_HOUR,
        day: '',
      });
    });

    it('should handle manager payroll close date fields', () => {
      const result = createReminderFieldNames(
        NotificationFieldKey.MANAGER_CURRENT_PAY_PERIOD_REMINDER_MEDIUM,
        NotificationFieldKey.MANAGER_CURRENT_PAY_PERIOD_REMINDER_HOUR,
        NotificationFieldKey.MANAGER_CURRENT_PAY_PERIOD_REMINDER_OFFSET_DAYS,
      );

      expect(result).toEqual({
        medium: NotificationFieldKey.MANAGER_CURRENT_PAY_PERIOD_REMINDER_MEDIUM,
        hour: NotificationFieldKey.MANAGER_CURRENT_PAY_PERIOD_REMINDER_HOUR,
        day: NotificationFieldKey.MANAGER_CURRENT_PAY_PERIOD_REMINDER_OFFSET_DAYS,
      });
    });

    it('should handle employee payroll close date fields', () => {
      const result = createReminderFieldNames(
        NotificationFieldKey.EMPLOYEE_PREVIOUS_PAY_PERIOD_REMINDER_MEDIUM,
        NotificationFieldKey.EMPLOYEE_PREVIOUS_PAY_PERIOD_REMINDER_HOUR,
        NotificationFieldKey.EMPLOYEE_PREVIOUS_PAY_PERIOD_REMINDER_OFFSET_DAYS,
      );

      expect(result).toEqual({
        medium:
          NotificationFieldKey.EMPLOYEE_PREVIOUS_PAY_PERIOD_REMINDER_MEDIUM,
        hour: NotificationFieldKey.EMPLOYEE_PREVIOUS_PAY_PERIOD_REMINDER_HOUR,
        day: NotificationFieldKey.EMPLOYEE_PREVIOUS_PAY_PERIOD_REMINDER_OFFSET_DAYS,
      });
    });

    it('should handle manager week reminder fields', () => {
      const result = createReminderFieldNames(
        NotificationFieldKey.MANAGER_PREVIOUS_WEEK_REMINDER_MEDIUM,
        NotificationFieldKey.MANAGER_PREVIOUS_WEEK_REMINDER_HOUR,
        NotificationFieldKey.MANAGER_PREVIOUS_WEEK_REMINDER_DAYS,
      );

      expect(result).toEqual({
        medium: NotificationFieldKey.MANAGER_PREVIOUS_WEEK_REMINDER_MEDIUM,
        hour: NotificationFieldKey.MANAGER_PREVIOUS_WEEK_REMINDER_HOUR,
        day: NotificationFieldKey.MANAGER_PREVIOUS_WEEK_REMINDER_DAYS,
      });
    });

    it('should return an object with correct structure', () => {
      const result = createReminderFieldNames(
        NotificationFieldKey.EMPLOYEE_CURRENT_WEEK_REMINDER_MEDIUM,
        NotificationFieldKey.EMPLOYEE_CURRENT_WEEK_REMINDER_HOUR,
        NotificationFieldKey.EMPLOYEE_CURRENT_WEEK_REMINDER_DAYS,
      );

      expect(result).toHaveProperty('medium');
      expect(result).toHaveProperty('hour');
      expect(result).toHaveProperty('day');
      expect(Object.keys(result)).toHaveLength(3);
    });

    it('should handle different field key combinations', () => {
      const testCases = [
        {
          medium: NotificationFieldKey.EMPLOYEE_CURRENT_WEEK_REMINDER_MEDIUM,
          hour: NotificationFieldKey.EMPLOYEE_CURRENT_WEEK_REMINDER_HOUR,
          day: NotificationFieldKey.EMPLOYEE_CURRENT_WEEK_REMINDER_DAYS,
        },
        {
          medium: NotificationFieldKey.MANAGER_CURRENT_WEEK_REMINDER_MEDIUM,
          hour: NotificationFieldKey.MANAGER_CURRENT_WEEK_REMINDER_HOUR,
          day: NotificationFieldKey.MANAGER_CURRENT_WEEK_REMINDER_DAYS,
        },
        {
          medium:
            NotificationFieldKey.EMPLOYEE_DAILY_REMINDER_FIRST_REMINDER_MEDIUM,
          hour: NotificationFieldKey.EMPLOYEE_DAILY_REMINDER_FIRST_REMINDER_HOUR,
          day: '' as const,
        },
      ];

      testCases.forEach((testCase) => {
        const result = createReminderFieldNames(
          testCase.medium,
          testCase.hour,
          testCase.day,
        );

        expect(result).toEqual({
          medium: testCase.medium,
          hour: testCase.hour,
          day: testCase.day,
        });
      });
    });

    it('should maintain type safety for form state paths', () => {
      const result = createReminderFieldNames(
        NotificationFieldKey.EMPLOYEE_CURRENT_WEEK_REMINDER_MEDIUM,
        NotificationFieldKey.EMPLOYEE_CURRENT_WEEK_REMINDER_HOUR,
        NotificationFieldKey.EMPLOYEE_CURRENT_WEEK_REMINDER_DAYS,
      );

      // These should be valid form state paths
      expect(typeof result.medium).toBe('string');
      expect(typeof result.hour).toBe('string');
      expect(typeof result.day).toBe('string');
    });
  });

  describe('getReminderFieldNames', () => {
    describe('DAILY mode (employee only)', () => {
      it('should return correct field names for first daily reminder', () => {
        const result = getReminderFieldNames(
          ReminderRole.EMPLOYEE,
          ApprovalRemindersbasedOn.DAILY,
          true,
        );

        expect(result).toEqual({
          medium:
            NotificationFieldKey.EMPLOYEE_DAILY_REMINDER_FIRST_REMINDER_MEDIUM,
          hour: NotificationFieldKey.EMPLOYEE_DAILY_REMINDER_FIRST_REMINDER_HOUR,
          day: '', // No day field for DAILY mode
        });
      });

      it('should return correct field names for second daily reminder', () => {
        const result = getReminderFieldNames(
          ReminderRole.EMPLOYEE,
          ApprovalRemindersbasedOn.DAILY,
          false,
        );

        expect(result).toEqual({
          medium:
            NotificationFieldKey.EMPLOYEE_DAILY_REMINDER_SECOND_REMINDER_MEDIUM,
          hour: NotificationFieldKey.EMPLOYEE_DAILY_REMINDER_SECOND_REMINDER_HOUR,
          day: '', // No day field for DAILY mode
        });
      });

      it('should handle manager role with DAILY mode (returns employee fields)', () => {
        // Even if manager role is passed with DAILY, it should return employee fields
        // since DAILY mode is only for employees
        const result = getReminderFieldNames(
          ReminderRole.MANAGER,
          ApprovalRemindersbasedOn.DAILY,
          true,
        );

        expect(result).toEqual({
          medium:
            NotificationFieldKey.EMPLOYEE_DAILY_REMINDER_FIRST_REMINDER_MEDIUM,
          hour: NotificationFieldKey.EMPLOYEE_DAILY_REMINDER_FIRST_REMINDER_HOUR,
          day: '',
        });
      });

      it('should always return empty string for day field in DAILY mode', () => {
        const firstReminder = getReminderFieldNames(
          ReminderRole.EMPLOYEE,
          ApprovalRemindersbasedOn.DAILY,
          true,
        );
        const secondReminder = getReminderFieldNames(
          ReminderRole.EMPLOYEE,
          ApprovalRemindersbasedOn.DAILY,
          false,
        );

        expect(firstReminder.day).toBe('');
        expect(secondReminder.day).toBe('');
      });
    });

    describe('PAYROLL_CLOSE_DATE mode', () => {
      describe('Manager role', () => {
        it('should return correct field names for first reminder (current pay period)', () => {
          const result = getReminderFieldNames(
            ReminderRole.MANAGER,
            ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
            true,
          );

          expect(result).toEqual({
            medium:
              NotificationFieldKey.MANAGER_CURRENT_PAY_PERIOD_REMINDER_MEDIUM,
            hour: NotificationFieldKey.MANAGER_CURRENT_PAY_PERIOD_REMINDER_HOUR,
            day: NotificationFieldKey.MANAGER_CURRENT_PAY_PERIOD_REMINDER_OFFSET_DAYS,
          });
        });

        it('should return correct field names for second reminder (previous pay period)', () => {
          const result = getReminderFieldNames(
            ReminderRole.MANAGER,
            ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
            false,
          );

          expect(result).toEqual({
            medium:
              NotificationFieldKey.MANAGER_PREVIOUS_PAY_PERIOD_REMINDER_MEDIUM,
            hour: NotificationFieldKey.MANAGER_PREVIOUS_PAY_PERIOD_REMINDER_HOUR,
            day: NotificationFieldKey.MANAGER_PREVIOUS_PAY_PERIOD_REMINDER_OFFSET_DAYS,
          });
        });

        it('should have valid day field (not empty string)', () => {
          const firstReminder = getReminderFieldNames(
            ReminderRole.MANAGER,
            ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
            true,
          );
          const secondReminder = getReminderFieldNames(
            ReminderRole.MANAGER,
            ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
            false,
          );

          expect(firstReminder.day).not.toBe('');
          expect(secondReminder.day).not.toBe('');
          expect(typeof firstReminder.day).toBe('string');
          expect(typeof secondReminder.day).toBe('string');
        });
      });

      describe('Employee role', () => {
        it('should return correct field names for first reminder (current pay period)', () => {
          const result = getReminderFieldNames(
            ReminderRole.EMPLOYEE,
            ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
            true,
          );

          expect(result).toEqual({
            medium:
              NotificationFieldKey.EMPLOYEE_CURRENT_PAY_PERIOD_REMINDER_MEDIUM,
            hour: NotificationFieldKey.EMPLOYEE_CURRENT_PAY_PERIOD_REMINDER_HOUR,
            day: NotificationFieldKey.EMPLOYEE_CURRENT_PAY_PERIOD_REMINDER_OFFSET_DAYS,
          });
        });

        it('should return correct field names for second reminder (previous pay period)', () => {
          const result = getReminderFieldNames(
            ReminderRole.EMPLOYEE,
            ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
            false,
          );

          expect(result).toEqual({
            medium:
              NotificationFieldKey.EMPLOYEE_PREVIOUS_PAY_PERIOD_REMINDER_MEDIUM,
            hour: NotificationFieldKey.EMPLOYEE_PREVIOUS_PAY_PERIOD_REMINDER_HOUR,
            day: NotificationFieldKey.EMPLOYEE_PREVIOUS_PAY_PERIOD_REMINDER_OFFSET_DAYS,
          });
        });

        it('should have valid day field (not empty string)', () => {
          const firstReminder = getReminderFieldNames(
            ReminderRole.EMPLOYEE,
            ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
            true,
          );
          const secondReminder = getReminderFieldNames(
            ReminderRole.EMPLOYEE,
            ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
            false,
          );

          expect(firstReminder.day).not.toBe('');
          expect(secondReminder.day).not.toBe('');
          expect(typeof firstReminder.day).toBe('string');
          expect(typeof secondReminder.day).toBe('string');
        });
      });

      it('should return different field names for manager vs employee', () => {
        const managerFirst = getReminderFieldNames(
          ReminderRole.MANAGER,
          ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
          true,
        );
        const employeeFirst = getReminderFieldNames(
          ReminderRole.EMPLOYEE,
          ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
          true,
        );

        expect(managerFirst.medium).not.toBe(employeeFirst.medium);
        expect(managerFirst.hour).not.toBe(employeeFirst.hour);
        expect(managerFirst.day).not.toBe(employeeFirst.day);
      });
    });

    describe('DAY_OF_WEEK mode (default)', () => {
      describe('Manager role', () => {
        it('should return correct field names for first reminder (current week)', () => {
          const result = getReminderFieldNames(
            ReminderRole.MANAGER,
            ApprovalRemindersbasedOn.DAY_OF_WEEK,
            true,
          );

          expect(result).toEqual({
            medium: NotificationFieldKey.MANAGER_CURRENT_WEEK_REMINDER_MEDIUM,
            hour: NotificationFieldKey.MANAGER_CURRENT_WEEK_REMINDER_HOUR,
            day: NotificationFieldKey.MANAGER_CURRENT_WEEK_REMINDER_DAYS,
          });
        });

        it('should return correct field names for second reminder (previous week)', () => {
          const result = getReminderFieldNames(
            ReminderRole.MANAGER,
            ApprovalRemindersbasedOn.DAY_OF_WEEK,
            false,
          );

          expect(result).toEqual({
            medium: NotificationFieldKey.MANAGER_PREVIOUS_WEEK_REMINDER_MEDIUM,
            hour: NotificationFieldKey.MANAGER_PREVIOUS_WEEK_REMINDER_HOUR,
            day: NotificationFieldKey.MANAGER_PREVIOUS_WEEK_REMINDER_DAYS,
          });
        });

        it('should have valid day field (not empty string)', () => {
          const firstReminder = getReminderFieldNames(
            ReminderRole.MANAGER,
            ApprovalRemindersbasedOn.DAY_OF_WEEK,
            true,
          );
          const secondReminder = getReminderFieldNames(
            ReminderRole.MANAGER,
            ApprovalRemindersbasedOn.DAY_OF_WEEK,
            false,
          );

          expect(firstReminder.day).not.toBe('');
          expect(secondReminder.day).not.toBe('');
          expect(typeof firstReminder.day).toBe('string');
          expect(typeof secondReminder.day).toBe('string');
        });
      });

      describe('Employee role', () => {
        it('should return correct field names for first reminder (current week)', () => {
          const result = getReminderFieldNames(
            ReminderRole.EMPLOYEE,
            ApprovalRemindersbasedOn.DAY_OF_WEEK,
            true,
          );

          expect(result).toEqual({
            medium: NotificationFieldKey.EMPLOYEE_CURRENT_WEEK_REMINDER_MEDIUM,
            hour: NotificationFieldKey.EMPLOYEE_CURRENT_WEEK_REMINDER_HOUR,
            day: NotificationFieldKey.EMPLOYEE_CURRENT_WEEK_REMINDER_DAYS,
          });
        });

        it('should return correct field names for second reminder (previous week)', () => {
          const result = getReminderFieldNames(
            ReminderRole.EMPLOYEE,
            ApprovalRemindersbasedOn.DAY_OF_WEEK,
            false,
          );

          expect(result).toEqual({
            medium: NotificationFieldKey.EMPLOYEE_PREVIOUS_WEEK_REMINDER_MEDIUM,
            hour: NotificationFieldKey.EMPLOYEE_PREVIOUS_WEEK_REMINDER_HOUR,
            day: NotificationFieldKey.EMPLOYEE_PREVIOUS_WEEK_REMINDER_DAYS,
          });
        });

        it('should have valid day field (not empty string)', () => {
          const firstReminder = getReminderFieldNames(
            ReminderRole.EMPLOYEE,
            ApprovalRemindersbasedOn.DAY_OF_WEEK,
            true,
          );
          const secondReminder = getReminderFieldNames(
            ReminderRole.EMPLOYEE,
            ApprovalRemindersbasedOn.DAY_OF_WEEK,
            false,
          );

          expect(firstReminder.day).not.toBe('');
          expect(secondReminder.day).not.toBe('');
          expect(typeof firstReminder.day).toBe('string');
          expect(typeof secondReminder.day).toBe('string');
        });
      });

      it('should return different field names for manager vs employee', () => {
        const managerFirst = getReminderFieldNames(
          ReminderRole.MANAGER,
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          true,
        );
        const employeeFirst = getReminderFieldNames(
          ReminderRole.EMPLOYEE,
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          true,
        );

        expect(managerFirst.medium).not.toBe(employeeFirst.medium);
        expect(managerFirst.hour).not.toBe(employeeFirst.hour);
        expect(managerFirst.day).not.toBe(employeeFirst.day);
      });
    });

    describe('Return type structure', () => {
      it('should always return an object with medium, hour, and day properties', () => {
        const result = getReminderFieldNames(
          ReminderRole.MANAGER,
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          true,
        );

        expect(result).toHaveProperty('medium');
        expect(result).toHaveProperty('hour');
        expect(result).toHaveProperty('day');
        expect(Object.keys(result).sort()).toEqual(['day', 'hour', 'medium']);
      });

      it('should return string values for all properties', () => {
        const result = getReminderFieldNames(
          ReminderRole.EMPLOYEE,
          ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
          true,
        );

        expect(typeof result.medium).toBe('string');
        expect(typeof result.hour).toBe('string');
        // day can be empty string for DAILY mode
        expect(typeof result.day).toBe('string');
      });

      it('should return NotificationFieldKey enum values for all non-empty fields', () => {
        const result = getReminderFieldNames(
          ReminderRole.MANAGER,
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          true,
        );

        // Check that returned values are actual NotificationFieldKey enum values
        const fieldKeyValues = Object.values(NotificationFieldKey);
        expect(fieldKeyValues).toContain(result.medium);
        expect(fieldKeyValues).toContain(result.hour);
        if (result.day) {
          expect(fieldKeyValues).toContain(result.day);
        }
      });
    });

    describe('Edge cases and consistency', () => {
      it('should return different fields for first vs second reminder', () => {
        const first = getReminderFieldNames(
          ReminderRole.MANAGER,
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          true,
        );
        const second = getReminderFieldNames(
          ReminderRole.MANAGER,
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          false,
        );

        expect(first.medium).not.toBe(second.medium);
        expect(first.hour).not.toBe(second.hour);
        expect(first.day).not.toBe(second.day);
      });

      it('should return consistent results for the same inputs', () => {
        const result1 = getReminderFieldNames(
          ReminderRole.EMPLOYEE,
          ApprovalRemindersbasedOn.DAILY,
          true,
        );
        const result2 = getReminderFieldNames(
          ReminderRole.EMPLOYEE,
          ApprovalRemindersbasedOn.DAILY,
          true,
        );

        expect(result1).toEqual(result2);
      });

      it('should handle all combinations of roles and frequencies', () => {
        const roles = [ReminderRole.MANAGER, ReminderRole.EMPLOYEE];
        const frequencies = [
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
          ApprovalRemindersbasedOn.DAILY,
        ];
        const orders = [true, false];

        roles.forEach((role) => {
          frequencies.forEach((frequency) => {
            orders.forEach((isFirst) => {
              const result = getReminderFieldNames(role, frequency, isFirst);

              // Should always return valid structure
              expect(result).toHaveProperty('medium');
              expect(result).toHaveProperty('hour');
              expect(result).toHaveProperty('day');

              // Medium and hour should never be empty
              expect(result.medium).toBeTruthy();
              expect(result.hour).toBeTruthy();

              // Day should only be empty for DAILY mode
              if (frequency === ApprovalRemindersbasedOn.DAILY) {
                expect(result.day).toBe('');
              } else {
                expect(result.day).toBeTruthy();
              }
            });
          });
        });
      });

      it('should differentiate between current and previous reminders', () => {
        const managerCurrentWeek = getReminderFieldNames(
          ReminderRole.MANAGER,
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          true,
        );
        const managerPreviousWeek = getReminderFieldNames(
          ReminderRole.MANAGER,
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          false,
        );

        // Verify naming convention reflects current vs previous
        expect(managerCurrentWeek.medium).toContain('Current');
        expect(managerPreviousWeek.medium).toContain('Previous');
      });

      it('should use offset days for payroll close date mode', () => {
        const managerPayroll = getReminderFieldNames(
          ReminderRole.MANAGER,
          ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
          true,
        );
        const employeePayroll = getReminderFieldNames(
          ReminderRole.EMPLOYEE,
          ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
          true,
        );

        // Verify it uses offset days field
        expect(managerPayroll.day).toContain('OffsetDays');
        expect(employeePayroll.day).toContain('OffsetDays');
      });

      it('should use days (plural) for day of week mode', () => {
        const managerDayOfWeek = getReminderFieldNames(
          ReminderRole.MANAGER,
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          true,
        );
        const employeeDayOfWeek = getReminderFieldNames(
          ReminderRole.EMPLOYEE,
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          true,
        );

        // Verify it uses days field (can be multiple days)
        expect(managerDayOfWeek.day).toContain('Days');
        expect(employeeDayOfWeek.day).toContain('Days');
      });
    });
  });

  describe('isNotificationMediumEnabled', () => {
    it('should return true when EMAIL is in the array', () => {
      expect(
        isNotificationMediumEnabled(['EMAIL'], NotificationMedium.EMAIL),
      ).toBe(true);
    });

    it('should return false when array is empty', () => {
      expect(isNotificationMediumEnabled([], NotificationMedium.EMAIL)).toBe(
        false,
      );
    });

    it('should return false when value is not an array', () => {
      expect(
        isNotificationMediumEnabled('EMAIL', NotificationMedium.EMAIL),
      ).toBe(false);
      expect(
        isNotificationMediumEnabled(undefined, NotificationMedium.EMAIL),
      ).toBe(false);
      expect(isNotificationMediumEnabled(null, NotificationMedium.EMAIL)).toBe(
        false,
      );
      expect(isNotificationMediumEnabled({}, NotificationMedium.EMAIL)).toBe(
        false,
      );
    });
  });

  describe('toggleNotificationMedium', () => {
    it('should return empty array when EMAIL is currently enabled', () => {
      expect(
        toggleNotificationMedium(['EMAIL'], NotificationMedium.EMAIL),
      ).toEqual([]);
    });

    it('should return array with EMAIL when currently disabled', () => {
      expect(toggleNotificationMedium([], NotificationMedium.EMAIL)).toEqual([
        'EMAIL',
      ]);
    });

    it('should return array with EMAIL when value is not an array', () => {
      expect(
        toggleNotificationMedium(undefined, NotificationMedium.EMAIL),
      ).toEqual(['EMAIL']);
      expect(toggleNotificationMedium(null, NotificationMedium.EMAIL)).toEqual([
        'EMAIL',
      ]);
      expect(
        toggleNotificationMedium('EMAIL', NotificationMedium.EMAIL),
      ).toEqual(['EMAIL']);
    });

    it('should use EMAIL as default medium', () => {
      expect(toggleNotificationMedium(['EMAIL'])).toEqual([]);
      expect(toggleNotificationMedium([])).toEqual(['EMAIL']);
    });
  });

  describe('FieldAssignmentTourSteps', () => {
    const mockIntl = {
      formatMessage: jest.fn(({ id }: { id: string }) => `translated:${id}`),
    };

    const createMockRef = () =>
      ({
        current: document.createElement('div'),
      } as React.RefObject<HTMLElement>);

    let standardFieldColumnRef: React.RefObject<HTMLElement>;
    let customersColumnRef: React.RefObject<HTMLElement>;
    let firstRowActionRef: React.RefObject<HTMLElement>;

    beforeEach(() => {
      jest.clearAllMocks();
      standardFieldColumnRef = createMockRef();
      customersColumnRef = createMockRef();
      firstRowActionRef = createMockRef();
    });

    it('should return an array of 3 tour steps', () => {
      const steps = FieldAssignmentTourSteps(
        standardFieldColumnRef,
        customersColumnRef,
        firstRowActionRef,
        mockIntl as any,
      );

      expect(steps).toHaveLength(3);
    });

    it('should have correct step ids', () => {
      const steps = FieldAssignmentTourSteps(
        standardFieldColumnRef,
        customersColumnRef,
        firstRowActionRef,
        mockIntl as any,
      );

      expect(steps[0].id).toBe('step-1');
      expect(steps[1].id).toBe('step-2');
      expect(steps[2].id).toBe('step-3');
    });

    it('should use intl to format step 1 title and description', () => {
      FieldAssignmentTourSteps(
        standardFieldColumnRef,
        customersColumnRef,
        firstRowActionRef,
        mockIntl as any,
      );

      expect(mockIntl.formatMessage).toHaveBeenCalledWith({
        id: 'fieldAssignment.tour.step.1.title',
      });
      expect(mockIntl.formatMessage).toHaveBeenCalledWith({
        id: 'fieldAssignment.tour.step.1.description',
      });
      expect(mockIntl.formatMessage).toHaveBeenCalledWith({
        id: 'fieldAssignment.tour.step.1.nextLabel',
      });
    });

    it('should use intl to format step 2 title and description', () => {
      FieldAssignmentTourSteps(
        standardFieldColumnRef,
        customersColumnRef,
        firstRowActionRef,
        mockIntl as any,
      );

      expect(mockIntl.formatMessage).toHaveBeenCalledWith({
        id: 'fieldAssignment.tour.step.2.title',
      });
      expect(mockIntl.formatMessage).toHaveBeenCalledWith({
        id: 'fieldAssignment.tour.step.2.description',
      });
      expect(mockIntl.formatMessage).toHaveBeenCalledWith({
        id: 'fieldAssignment.tour.step.2.nextLabel',
      });
    });

    it('should use intl to format step 3 title and description', () => {
      FieldAssignmentTourSteps(
        standardFieldColumnRef,
        customersColumnRef,
        firstRowActionRef,
        mockIntl as any,
      );

      expect(mockIntl.formatMessage).toHaveBeenCalledWith({
        id: 'fieldAssignment.tour.step.3.title',
      });
      expect(mockIntl.formatMessage).toHaveBeenCalledWith({
        id: 'fieldAssignment.tour.step.3.description',
      });
      expect(mockIntl.formatMessage).toHaveBeenCalledWith({
        id: 'fieldAssignment.tour.step.3.nextLabel',
      });
    });

    it('should assign correct targetRef to each step', () => {
      const steps = FieldAssignmentTourSteps(
        standardFieldColumnRef,
        customersColumnRef,
        firstRowActionRef,
        mockIntl as any,
      );

      expect(steps[0].targetRef).toBe(standardFieldColumnRef);
      expect(steps[1].targetRef).toBe(customersColumnRef);
      expect(steps[2].targetRef).toBe(firstRowActionRef);
    });

    it('should set showOverlay to false for all steps', () => {
      const steps = FieldAssignmentTourSteps(
        standardFieldColumnRef,
        customersColumnRef,
        firstRowActionRef,
        mockIntl as any,
      );

      steps.forEach((step) => {
        expect(step.showOverlay).toBe(false);
      });
    });

    it('should set alignment to center for all steps', () => {
      const steps = FieldAssignmentTourSteps(
        standardFieldColumnRef,
        customersColumnRef,
        firstRowActionRef,
        mockIntl as any,
      );

      steps.forEach((step) => {
        expect(step.alignment).toBe('center');
      });
    });

    it('should have correct positions for each step', () => {
      const steps = FieldAssignmentTourSteps(
        standardFieldColumnRef,
        customersColumnRef,
        firstRowActionRef,
        mockIntl as any,
      );

      expect(steps[0].position).toBe('left');
      expect(steps[1].position).toBe('right');
      expect(steps[2].position).toBe('left');
    });

    it('should assign correct lottie animation data to each step', () => {
      const steps = FieldAssignmentTourSteps(
        standardFieldColumnRef,
        customersColumnRef,
        firstRowActionRef,
        mockIntl as any,
      );

      expect(steps[0].lottieData).toBe(firstStep);
      expect(steps[1].lottieData).toBe(secondStep);
      expect(steps[2].lottieData).toBe(thirdStep);
    });

    it('should return steps with all required TourStep properties', () => {
      const steps = FieldAssignmentTourSteps(
        standardFieldColumnRef,
        customersColumnRef,
        firstRowActionRef,
        mockIntl as any,
      );

      steps.forEach((step) => {
        expect(step).toHaveProperty('id');
        expect(step).toHaveProperty('title');
        expect(step).toHaveProperty('description');
        expect(step).toHaveProperty('showOverlay');
        expect(step).toHaveProperty('position');
        expect(step).toHaveProperty('alignment');
        expect(step).toHaveProperty('targetRef');
        expect(step).toHaveProperty('nextLabel');
        expect(step).toHaveProperty('lottieData');
      });
    });

    it('should handle refs with null current value', () => {
      const nullRef = { current: null } as React.RefObject<HTMLElement>;

      const steps = FieldAssignmentTourSteps(
        nullRef,
        nullRef,
        nullRef,
        mockIntl as any,
      );

      expect(steps).toHaveLength(3);
      expect(steps[0].targetRef?.current).toBeNull();
      expect(steps[1].targetRef?.current).toBeNull();
      expect(steps[2].targetRef?.current).toBeNull();
    });

    it('should return translated values for title, description, and nextLabel', () => {
      const steps = FieldAssignmentTourSteps(
        standardFieldColumnRef,
        customersColumnRef,
        firstRowActionRef,
        mockIntl as any,
      );

      expect(steps[0].title).toBe(
        'translated:fieldAssignment.tour.step.1.title',
      );
      expect(steps[0].description).toBe(
        'translated:fieldAssignment.tour.step.1.description',
      );
      expect(steps[0].nextLabel).toBe(
        'translated:fieldAssignment.tour.step.1.nextLabel',
      );

      expect(steps[1].title).toBe(
        'translated:fieldAssignment.tour.step.2.title',
      );
      expect(steps[1].description).toBe(
        'translated:fieldAssignment.tour.step.2.description',
      );
      expect(steps[1].nextLabel).toBe(
        'translated:fieldAssignment.tour.step.2.nextLabel',
      );

      expect(steps[2].title).toBe(
        'translated:fieldAssignment.tour.step.3.title',
      );
      expect(steps[2].description).toBe(
        'translated:fieldAssignment.tour.step.3.description',
      );
      expect(steps[2].nextLabel).toBe(
        'translated:fieldAssignment.tour.step.3.nextLabel',
      );
    });
  });

  describe('schedule notification display formatters', () => {
    const scheduleMessageMap: Record<string, string> = {
      'time-entries.section.title.notifications.schedule.view.never-send':
        'Never send',
      'time-entries.section.title.notifications.schedule.view.always-send':
        'Always send',
      'time-entries.section.title.notifications.schedule.view.ask': 'Ask',
      notificationMobile: 'Mobile',
      notificationEmail: 'email',
      on: 'On',
      off: 'Off',
    };

    const scheduleIntl = {
      formatMessage: ({ id }: { id: string }) => scheduleMessageMap[id] ?? id,
    } as ScheduleNotificationsIntl;

    describe('formatScheduleNotificationSummaryValue', () => {
      it('returns only never-send when mode is NEVER_SEND', () => {
        expect(
          formatScheduleNotificationSummaryValue(
            scheduleIntl,
            ScheduleNotificationSendMode.NEVER_SEND,
            true,
            true,
          ),
        ).toBe('Never send');
      });

      it('joins always-send with mobile and email', () => {
        expect(
          formatScheduleNotificationSummaryValue(
            scheduleIntl,
            ScheduleNotificationSendMode.ALWAYS_SEND,
            true,
            true,
          ),
        ).toBe('Always send, Mobile, email');
      });

      it('joins ask with mobile only', () => {
        expect(
          formatScheduleNotificationSummaryValue(
            scheduleIntl,
            ScheduleNotificationSendMode.ASK,
            true,
            false,
          ),
        ).toBe('Ask, Mobile');
      });
    });

    describe('formatScheduleNotificationOnOffChannelValue', () => {
      it('returns Off when not on or channel is null', () => {
        expect(
          formatScheduleNotificationOnOffChannelValue(
            scheduleIntl,
            false,
            ScheduleNotificationChannel.EMAIL,
          ),
        ).toBe('Off');
        expect(
          formatScheduleNotificationOnOffChannelValue(scheduleIntl, true, null),
        ).toBe('Off');
      });

      it('returns On with email or mobile label', () => {
        expect(
          formatScheduleNotificationOnOffChannelValue(
            scheduleIntl,
            true,
            ScheduleNotificationChannel.EMAIL,
          ),
        ).toBe('On, email');
        expect(
          formatScheduleNotificationOnOffChannelValue(
            scheduleIntl,
            true,
            ScheduleNotificationChannel.MOBILE,
          ),
        ).toBe('On, Mobile');
      });
    });

    // Signature is (intl, hasMobile, hasEmail) — mobile-first, matching
    // formatScheduleNotificationSummaryValue.
    describe('formatScheduleNotificationChannelsValue', () => {
      it('returns Off when neither channel is on', () => {
        expect(
          formatScheduleNotificationChannelsValue(scheduleIntl, false, false),
        ).toBe('Off');
      });

      it('returns On, email when only email is on', () => {
        expect(
          formatScheduleNotificationChannelsValue(scheduleIntl, false, true),
        ).toBe('On, email');
      });

      it('returns On, Mobile when only mobile is on', () => {
        expect(
          formatScheduleNotificationChannelsValue(scheduleIntl, true, false),
        ).toBe('On, Mobile');
      });

      it('returns On, Mobile, email (mobile-first) when both are on', () => {
        expect(
          formatScheduleNotificationChannelsValue(scheduleIntl, true, true),
        ).toBe('On, Mobile, email');
      });
    });
  });

  describe('schedule channel helpers', () => {
    const { Email, PushNotification } = TimeTracking_NotificationReminderMedium;

    describe('hasEmailChannel / hasMobileChannel', () => {
      it('detects EMAIL presence', () => {
        expect(hasEmailChannel([Email])).toBe(true);
        expect(hasEmailChannel([PushNotification])).toBe(false);
        expect(hasEmailChannel([])).toBe(false);
      });

      it('detects PUSH_NOTIFICATION presence', () => {
        expect(hasMobileChannel([PushNotification])).toBe(true);
        expect(hasMobileChannel([Email])).toBe(false);
        expect(hasMobileChannel([])).toBe(false);
      });
    });

    describe('toggleScheduleChannel', () => {
      it('adds the medium when absent', () => {
        expect(toggleScheduleChannel([], Email)).toEqual([Email]);
        expect(toggleScheduleChannel([Email], PushNotification)).toEqual([
          Email,
          PushNotification,
        ]);
      });

      it('removes the medium when present', () => {
        expect(toggleScheduleChannel([Email, PushNotification], Email)).toEqual(
          [PushNotification],
        );
        expect(toggleScheduleChannel([Email], Email)).toEqual([]);
      });

      it('does not mutate the input array', () => {
        const input = [Email];
        toggleScheduleChannel(input, PushNotification);
        expect(input).toEqual([Email]);
      });
    });

    describe('mapSubscriptionsToScheduleChannels', () => {
      const subscriptions = [
        {
          notificationType: TimeTracking_NotificationType.ShiftPublished,
          distributionMethods: [Email, PushNotification],
        },
        {
          notificationType: TimeTracking_NotificationType.ShiftStartBefore,
          distributionMethods: [Email],
        },
        {
          notificationType: TimeTracking_NotificationType.ShiftStartAfter,
          distributionMethods: [PushNotification],
        },
        {
          notificationType: TimeTracking_NotificationType.ShiftEndAfter,
          distributionMethods: [],
        },
      ] as TimeTracking_NotificationSubscription[];

      it('maps each notificationType to its row channel array', () => {
        const result = mapSubscriptionsToScheduleChannels(subscriptions);
        expect(result).toEqual({
          scheduleShiftPublished: [Email, PushNotification],
          scheduleOneHour: [Email],
          scheduleForgotClockInAfterStarted: [PushNotification],
          scheduleForgotClockInAfterEnded: [],
          // SHIFT_START_AFTER_MANAGER absent → empty
          scheduleLateClockInNotifyManagerChannels: [],
        });
      });

      it('returns all-empty arrays when given null/undefined', () => {
        expect(mapSubscriptionsToScheduleChannels(null)).toEqual({
          scheduleShiftPublished: [],
          scheduleOneHour: [],
          scheduleForgotClockInAfterStarted: [],
          scheduleForgotClockInAfterEnded: [],
          scheduleLateClockInNotifyManagerChannels: [],
        });
        expect(mapSubscriptionsToScheduleChannels(undefined)).toEqual({
          scheduleShiftPublished: [],
          scheduleOneHour: [],
          scheduleForgotClockInAfterStarted: [],
          scheduleForgotClockInAfterEnded: [],
          scheduleLateClockInNotifyManagerChannels: [],
        });
      });
    });
  });

  describe('schedule employer settings API mappers', () => {
    it.each([
      [TimeTracking_ScheduleManagePreference.None, SCHEDULE_MANAGE_VALUE.NONE],
      [
        TimeTracking_ScheduleManagePreference.Self,
        SCHEDULE_MANAGE_VALUE.THEIR_OWN,
      ],
      [
        TimeTracking_ScheduleManagePreference.Group,
        SCHEDULE_MANAGE_VALUE.GROUP,
      ],
      [
        TimeTracking_ScheduleManagePreference.Company,
        SCHEDULE_MANAGE_VALUE.COMPANY,
      ],
    ])('mapScheduleManagePreferenceFromApi maps %s to UI', (api, ui) => {
      expect(mapScheduleManagePreferenceFromApi(api)).toBe(ui);
    });

    it('mapScheduleManagePreferenceFromApi uses their_own when null/undefined', () => {
      expect(mapScheduleManagePreferenceFromApi(null)).toBe(
        SCHEDULE_MANAGE_VALUE.THEIR_OWN,
      );
      expect(mapScheduleManagePreferenceFromApi(undefined)).toBe(
        SCHEDULE_MANAGE_VALUE.THEIR_OWN,
      );
    });

    it.each([
      [TimeTracking_ScheduleViewPreference.Self, SCHEDULE_VIEW_VALUE.THEIR_OWN],
      [TimeTracking_ScheduleViewPreference.Group, SCHEDULE_VIEW_VALUE.GROUP],
      [
        TimeTracking_ScheduleViewPreference.Company,
        SCHEDULE_VIEW_VALUE.COMPANY,
      ],
    ])('mapScheduleViewPreferenceFromApi maps %s to UI', (api, ui) => {
      expect(mapScheduleViewPreferenceFromApi(api)).toBe(ui);
    });

    it('mapScheduleViewPreferenceFromApi uses their_own when null/undefined', () => {
      expect(mapScheduleViewPreferenceFromApi(null)).toBe(
        SCHEDULE_VIEW_VALUE.THEIR_OWN,
      );
      expect(mapScheduleViewPreferenceFromApi(undefined)).toBe(
        SCHEDULE_VIEW_VALUE.THEIR_OWN,
      );
    });

    it.each([
      [SCHEDULE_MANAGE_VALUE.NONE, TimeTracking_ScheduleManagePreference.None],
      [
        SCHEDULE_MANAGE_VALUE.THEIR_OWN,
        TimeTracking_ScheduleManagePreference.Self,
      ],
      [
        SCHEDULE_MANAGE_VALUE.GROUP,
        TimeTracking_ScheduleManagePreference.Group,
      ],
      [
        SCHEDULE_MANAGE_VALUE.COMPANY,
        TimeTracking_ScheduleManagePreference.Company,
      ],
    ])('mapScheduleManagePreferenceToApi maps UI %s to API', (ui, api) => {
      expect(mapScheduleManagePreferenceToApi(ui)).toBe(api);
    });

    it.each([
      [SCHEDULE_VIEW_VALUE.THEIR_OWN, TimeTracking_ScheduleViewPreference.Self],
      [SCHEDULE_VIEW_VALUE.GROUP, TimeTracking_ScheduleViewPreference.Group],
      [
        SCHEDULE_VIEW_VALUE.COMPANY,
        TimeTracking_ScheduleViewPreference.Company,
      ],
    ])('mapScheduleViewPreferenceToApi maps UI %s to API', (ui, api) => {
      expect(mapScheduleViewPreferenceToApi(ui)).toBe(api);
    });

    it('mapScheduleManagePreferenceToApi falls back to Self for unknown UI value', () => {
      expect(
        mapScheduleManagePreferenceToApi('invalid' as ScheduleManagePreference),
      ).toBe(TimeTracking_ScheduleManagePreference.Self);
    });

    it('mapScheduleViewPreferenceToApi falls back to Self for unknown UI value', () => {
      expect(
        mapScheduleViewPreferenceToApi('invalid' as ScheduleViewPreference),
      ).toBe(TimeTracking_ScheduleViewPreference.Self);
    });

    it.each([
      [
        TimeTracking_ScheduleShiftChangeNotificationPreference.Always,
        ScheduleNotificationSendMode.ALWAYS_SEND,
      ],
      [
        TimeTracking_ScheduleShiftChangeNotificationPreference.Ask,
        ScheduleNotificationSendMode.ASK,
      ],
      [
        TimeTracking_ScheduleShiftChangeNotificationPreference.Never,
        ScheduleNotificationSendMode.NEVER_SEND,
      ],
    ])(
      'mapShiftChangePreferenceToSendMode maps %s to send mode',
      (api, sendMode) => {
        expect(mapShiftChangePreferenceToSendMode(api)).toBe(sendMode);
      },
    );

    it('mapShiftChangePreferenceToSendMode returns null for null/undefined/empty/unknown', () => {
      expect(mapShiftChangePreferenceToSendMode(null)).toBeNull();
      expect(mapShiftChangePreferenceToSendMode(undefined)).toBeNull();
      expect(mapShiftChangePreferenceToSendMode('')).toBeNull();
      expect(mapShiftChangePreferenceToSendMode('SOMETHING_ELSE')).toBeNull();
    });
  });

  describe('timesheet dimension preview mapping', () => {
    const employerDimensionSettings: CustomDimensionSetting[] = [
      {
        dimensionDefinitionId: '1000000023',
        enabledForTimeTracking: { version: '1', value: true },
        required: { version: '2', value: true },
      },
      {
        dimensionDefinitionId: '1000000024',
        enabledForTimeTracking: { version: '3', value: false },
        required: { version: '4', value: false },
      },
    ];

    it('mapEmployerDimensionSettingsToPreviewFields returns an empty array when no settings are provided', () => {
      expect(mapEmployerDimensionSettingsToPreviewFields()).toEqual([]);
      expect(mapEmployerDimensionSettingsToPreviewFields([])).toEqual([]);
    });

    it('mapEmployerDimensionSettingsToPreviewFields maps employer settings into preview field rows', () => {
      const previewFields = mapEmployerDimensionSettingsToPreviewFields(
        employerDimensionSettings,
      );

      expect(previewFields).toHaveLength(2);
      expect(previewFields[0]).toMatchObject({
        id: '1000000023',
        key: 'dimensions.1000000023.enabled',
        title: '1000000023',
        value: true,
        automationId: 'dimension-1000000023',
        requiredField: {
          id: '1000000023Required',
          key: 'dimensions.1000000023.required',
          value: true,
        },
      });
      expect(previewFields[1]).toMatchObject({
        id: '1000000024',
        key: 'dimensions.1000000024.enabled',
        title: '1000000024',
        value: false,
        requiredField: {
          id: '1000000024Required',
          key: 'dimensions.1000000024.required',
          value: false,
        },
      });
    });

    it('mapEmployerDimensionSettingsToPreviewFields defaults missing toggle values to false', () => {
      const previewFields = mapEmployerDimensionSettingsToPreviewFields([
        {
          dimensionDefinitionId: '1000000099',
          enabledForTimeTracking: { version: '0', value: undefined as never },
          required: { version: '0', value: undefined as never },
        },
      ]);

      expect(previewFields[0].value).toBe(false);
      expect(previewFields[0].requiredField?.value).toBe(false);
    });

    it('mapDimensionPreviewFieldsToFormValues returns an empty object for no preview fields', () => {
      expect(mapDimensionPreviewFieldsToFormValues([])).toEqual({});
    });

    it('mapDimensionPreviewFieldsToFormValues builds the nested dimensions form map', () => {
      const previewFields = mapEmployerDimensionSettingsToPreviewFields(
        employerDimensionSettings,
      );

      expect(mapDimensionPreviewFieldsToFormValues(previewFields)).toEqual({
        '1000000023': { enabled: true, required: true },
        '1000000024': { enabled: false, required: false },
      });
    });

    it('mapDimensionPreviewFieldsToFormValues coerces falsy toggle values to false', () => {
      const previewFields = [
        createTimesheetDimensionPreviewField({
          id: 'dim-1',
          label: 'Department',
          enabled: undefined,
          required: undefined,
        }),
      ];

      expect(mapDimensionPreviewFieldsToFormValues(previewFields)).toEqual({
        'dim-1': { enabled: false, required: false },
      });
    });
  });

  describe('mergeActiveDimensionsWithQLSettings', () => {
    const dimensionDefinitions: DimensionFormDefinition[] = [
      { id: '1000000023', label: 'Department', active: true },
      { id: '1000000024', label: 'Project', active: true },
      { id: '1000000025', label: 'Inactive', active: false },
    ];

    const qlSettings: CustomDimensionSetting[] = [
      {
        dimensionDefinitionId: '1000000023',
        enabledForTimeTracking: { version: '1', value: true },
        required: { version: '2', value: true },
      },
      {
        dimensionDefinitionId: '1000000024',
        enabledForTimeTracking: { version: '3', value: false },
        required: { version: '4', value: false },
      },
    ];

    it('returns an empty array when no definitions are provided', () => {
      expect(mergeActiveDimensionsWithQLSettings()).toEqual([]);
      expect(mergeActiveDimensionsWithQLSettings([])).toEqual([]);
    });

    it('filters out inactive definitions and merges QL toggle values', () => {
      expect(
        mergeActiveDimensionsWithQLSettings(dimensionDefinitions, qlSettings),
      ).toEqual([
        {
          id: '1000000023',
          label: 'Department',
          active: true,
          enabledForTimeTracking: true,
          required: true,
        },
        {
          id: '1000000024',
          label: 'Project',
          active: true,
          enabledForTimeTracking: false,
          required: false,
        },
      ]);
    });

    it('defaults toggles to false when QL has no row for an active definition', () => {
      expect(
        mergeActiveDimensionsWithQLSettings(
          [{ id: '1000000099', label: 'New Dimension', active: true }],
          qlSettings,
        ),
      ).toEqual([
        {
          id: '1000000099',
          label: 'New Dimension',
          active: true,
          enabledForTimeTracking: false,
          required: false,
        },
      ]);
    });

    it('defaults toggles to false when QL toggle values are missing', () => {
      expect(
        mergeActiveDimensionsWithQLSettings(
          [{ id: '1000000023', label: 'Department', active: true }],
          [
            {
              dimensionDefinitionId: '1000000023',
              enabledForTimeTracking: {},
              required: {},
            },
          ],
        ),
      ).toEqual([
        {
          id: '1000000023',
          label: 'Department',
          active: true,
          enabledForTimeTracking: false,
          required: false,
        },
      ]);
    });
  });

  describe('createTimesheetDimensionPreviewField', () => {
    it('builds a preview field with nested form keys and defaults', () => {
      expect(
        createTimesheetDimensionPreviewField({
          id: '1000000023',
          label: 'Department',
        }),
      ).toEqual({
        id: '1000000023',
        key: 'dimensions.1000000023.enabled',
        title: 'Department',
        ariaLabel: '1000000023',
        tooltipText: '',
        disabled: false,
        value: false,
        detail: {
          title: 'Department',
          subtitle: 'time-entries.section.dimensions.mobile-subtitle',
          ariaLabel: '',
        },
        automationId: 'dimension-1000000023',
        requiredField: {
          id: '1000000023Required',
          key: 'dimensions.1000000023.required',
          disabled: false,
          value: false,
        },
      });
    });

    it('honours enabled, required, and custom mobile subtitle overrides', () => {
      expect(
        createTimesheetDimensionPreviewField({
          id: '1000000024',
          label: 'Project',
          enabled: true,
          required: true,
          mobileSubtitleId: 'custom.subtitle.id',
        }),
      ).toMatchObject({
        value: true,
        detail: { subtitle: 'custom.subtitle.id' },
        requiredField: { value: true },
      });
    });
  });

  describe('mapDimensionDefinitionsToPreviewFields', () => {
    const dimensionDefinitions: DimensionFormDefinition[] = [
      { id: '1000000023', label: 'Department', active: true },
      { id: '1000000024', label: 'Project', active: true },
      { id: '1000000025', label: 'Inactive', active: false },
    ];

    const customDimensionSettings: CustomDimensionSetting[] = [
      {
        dimensionDefinitionId: '1000000023',
        enabledForTimeTracking: { version: '1', value: true },
        required: { version: '2', value: false },
      },
      {
        dimensionDefinitionId: '1000000024',
        enabledForTimeTracking: { version: '3', value: false },
        required: { version: '4', value: true },
      },
    ];

    it('returns an empty array when no active definitions exist', () => {
      expect(
        mapDimensionDefinitionsToPreviewFields(
          [{ id: '1000000025', label: 'Inactive', active: false }],
          customDimensionSettings,
        ),
      ).toEqual([]);
    });

    it('maps only active definitions with merged QL toggle values', () => {
      const previewFields = mapDimensionDefinitionsToPreviewFields(
        dimensionDefinitions,
        customDimensionSettings,
      );

      expect(previewFields).toHaveLength(2);
      expect(previewFields[0]).toMatchObject({
        id: '1000000023',
        title: 'Department',
        value: true,
        requiredField: { value: false },
      });
      expect(previewFields[1]).toMatchObject({
        id: '1000000024',
        title: 'Project',
        value: false,
        requiredField: { value: true },
      });
    });
  });

  describe('mapCustomDimensionsWireToSettings', () => {
    it('returns an empty array for null, undefined, or empty wire payloads', () => {
      expect(mapCustomDimensionsWireToSettings(null)).toEqual([]);
      expect(mapCustomDimensionsWireToSettings(undefined)).toEqual([]);
      expect(mapCustomDimensionsWireToSettings([])).toEqual([]);
    });

    it('filters out null entries and rows without a dimension definition id', () => {
      expect(
        mapCustomDimensionsWireToSettings([
          null,
          { dimensionDefinition: null },
          { dimensionDefinition: { id: '' } },
          {
            dimensionDefinition: { id: '1000000023' },
            enabledForTimeTracking: { meta: { version: '1' }, value: true },
            required: { meta: { version: '2' }, value: false },
          },
        ]),
      ).toEqual([
        {
          dimensionDefinitionId: '1000000023',
          enabledForTimeTracking: { version: '1', value: true },
          required: { version: '2', value: false },
        },
      ]);
    });

    it('defaults missing versions and values to version "0" and false', () => {
      expect(
        mapCustomDimensionsWireToSettings([
          {
            dimensionDefinition: { id: '1000000099' },
            enabledForTimeTracking: null,
            required: null,
          },
        ]),
      ).toEqual([
        {
          dimensionDefinitionId: '1000000099',
          enabledForTimeTracking: { version: '0', value: false },
          required: { version: '0', value: false },
        },
      ]);
    });
  });
});

describe('getManageKioskWidgetId', () => {
  it('returns legacy widget when flag is off', () => {
    expect(getManageKioskWidgetId(false)).toBe(MANAGE_KIOSK_LEGACY_WIDGET_ID);
  });

  it('returns orchestrator widget when flag is on', () => {
    expect(getManageKioskWidgetId(true)).toBe(
      MANAGE_KIOSK_ORCHESTRATOR_WIDGET_ID,
    );
  });
});
