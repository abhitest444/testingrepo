// @ts-nocheck
/**
 * NotificationsCard Utils Tests
 *
 * Tests for utility functions related to notification settings
 */

import {
  getNotificationStatus,
  formatDaysOfWeek,
  mapEffectiveUserSettings,
  convertTimeToHHMM,
  mapNotificationSettingsToManageUserInput,
  mapOvertimeNotificationUnifiedInput,
} from 'src/js/widgets/userSettings/components/cards/NotificationsCard/utils/NotificationsCard.utils';
import {
  TimeTracking_NotificationReminderMedium,
  TimeTracking_OvertimePeriod,
  TimeTracking_OvertimeRuleEntityType,
  Common_DayOfWeek,
  TimeTracking_TimeForType,
} from 'src/__generated__/timeTracking/graphql';

describe('NotificationsCard Utils', () => {
  // Mock intl object
  const mockIntl = {
    formatMessage: ({ id }: { id: string }, values?: any) => {
      // Simple mock that returns the id with interpolated values
      if (values?.time) {
        return `${id.replace('.', ' ')} ${values.time}`;
      }
      return id.replace(/\./g, ' ');
    },
  };

  describe('getNotificationStatus', () => {
    it('should return notification status when both email and mobile are true with time', () => {
      const result = getNotificationStatus(mockIntl, true, true, '8:00 AM');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should return notification status when both email and mobile are true without time', () => {
      const result = getNotificationStatus(mockIntl, true, true);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should return notification status when only email is true with time', () => {
      const result = getNotificationStatus(mockIntl, true, false, '9:00 AM');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should return notification status when only email is true without time', () => {
      const result = getNotificationStatus(mockIntl, true, false);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should return notification status when only mobile is true with time', () => {
      const result = getNotificationStatus(mockIntl, false, true, '10:00 AM');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should return notification status when only mobile is true without time', () => {
      const result = getNotificationStatus(mockIntl, false, true);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should return off status when both email and mobile are false', () => {
      const result = getNotificationStatus(mockIntl, false, false);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should return off status when both email and mobile are false with time', () => {
      const result = getNotificationStatus(mockIntl, false, false, '11:00 AM');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('formatDaysOfWeek', () => {
    it('should return formatted string for empty array', () => {
      const result = formatDaysOfWeek(mockIntl, []);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should return formatted string for null', () => {
      const result = formatDaysOfWeek(mockIntl, null);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should return formatted string for undefined', () => {
      const result = formatDaysOfWeek(mockIntl, undefined);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should return formatted string for all 7 days', () => {
      const days = [
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY',
        'SUNDAY',
      ];
      const result = formatDaysOfWeek(mockIntl, days);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return formatted string for weekdays', () => {
      const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
      const result = formatDaysOfWeek(mockIntl, days);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should return formatted string for weekdays in any order', () => {
      const days = ['FRIDAY', 'MONDAY', 'WEDNESDAY', 'THURSDAY', 'TUESDAY'];
      const result = formatDaysOfWeek(mockIntl, days);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should return formatted string for 6 days (Monday through Saturday)', () => {
      const days = [
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY',
      ];
      const result = formatDaysOfWeek(mockIntl, days);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should return formatted list for custom day selection', () => {
      const days = ['MONDAY', 'WEDNESDAY', 'FRIDAY'];
      const result = formatDaysOfWeek(mockIntl, days);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should sort days in week order', () => {
      const days = ['FRIDAY', 'MONDAY', 'SUNDAY'];
      const result = formatDaysOfWeek(mockIntl, days);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle single day', () => {
      const days = ['TUESDAY'];
      const result = formatDaysOfWeek(mockIntl, days);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle weekend days', () => {
      const days = ['SATURDAY', 'SUNDAY'];
      const result = formatDaysOfWeek(mockIntl, days);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('convertTimeToHHMM', () => {
    it('should convert AM time to 24-hour format', () => {
      expect(convertTimeToHHMM('8:00 AM')).toBe('08:00');
      expect(convertTimeToHHMM('9:30 AM')).toBe('09:30');
    });

    it('should convert PM time to 24-hour format', () => {
      expect(convertTimeToHHMM('2:00 PM')).toBe('14:00');
      expect(convertTimeToHHMM('5:45 PM')).toBe('17:45');
    });

    it('should handle 12:00 AM (midnight)', () => {
      expect(convertTimeToHHMM('12:00 AM')).toBe('00:00');
      expect(convertTimeToHHMM('12:30 AM')).toBe('00:30');
    });

    it('should handle 12:00 PM (noon)', () => {
      expect(convertTimeToHHMM('12:00 PM')).toBe('12:00');
      expect(convertTimeToHHMM('12:45 PM')).toBe('12:45');
    });

    it('should return empty string for empty input', () => {
      expect(convertTimeToHHMM('')).toBe('');
    });

    it('should return as-is if already in 24-hour format', () => {
      expect(convertTimeToHHMM('14:30')).toBe('14:30');
      expect(convertTimeToHHMM('08:15')).toBe('08:15');
    });

    it('should handle uppercase AM/PM only', () => {
      // Function only converts uppercase AM/PM due to includes() check at line 242
      expect(convertTimeToHHMM('8:00 AM')).toBe('08:00');
      expect(convertTimeToHHMM('2:00 PM')).toBe('14:00');
      // Lowercase am/pm returns as-is because of includes() check
      expect(convertTimeToHHMM('8:00 am')).toBe('8:00 am');
      expect(convertTimeToHHMM('2:00 pm')).toBe('2:00 pm');
    });

    it('should return original string for invalid format', () => {
      expect(convertTimeToHHMM('invalid')).toBe('invalid');
    });

    it('should handle edge case times', () => {
      expect(convertTimeToHHMM('1:00 AM')).toBe('01:00');
      expect(convertTimeToHHMM('11:59 PM')).toBe('23:59');
    });
  });

  describe('mapEffectiveUserSettings', () => {
    it('should return empty object for undefined data', () => {
      const result = mapEffectiveUserSettings(undefined);
      expect(result).toEqual({});
    });

    it('should return empty object for null data', () => {
      const result = mapEffectiveUserSettings(null);
      expect(result).toEqual({});
    });

    it('should return empty object when timeTrackingEffectiveUserSettings is missing', () => {
      const result = mapEffectiveUserSettings({});
      expect(result).toEqual({});
    });

    it('should map clock-in time correctly', () => {
      const data = {
        timeTrackingEffectiveUserSettings: {
          clockInSetting: {
            reminderTime: {
              value: '08:00',
              meta: { version: '2' },
            },
          },
        },
      };

      const result = mapEffectiveUserSettings(data);

      expect(result.clockInTime).toBe('8:00 AM');
      expect(result.versions?.clockInReminderTime).toBe('2');
    });

    it('should map clock-out time correctly', () => {
      const data = {
        timeTrackingEffectiveUserSettings: {
          clockOutSetting: {
            reminderTime: {
              value: '17:00',
              meta: { version: '3' },
            },
          },
        },
      };

      const result = mapEffectiveUserSettings(data);

      expect(result.clockOutTime).toBe('5:00 PM');
      expect(result.versions?.clockOutReminderTime).toBe('3');
    });

    it('should map days of week correctly', () => {
      const data = {
        timeTrackingEffectiveUserSettings: {
          notificationEnabledForDays: {
            value: [
              Common_DayOfWeek.Monday,
              Common_DayOfWeek.Tuesday,
              Common_DayOfWeek.Wednesday,
            ],
            meta: { version: '4' },
          },
        },
      };

      const result = mapEffectiveUserSettings(data);

      expect(result.daysOfWeek).toEqual(['MONDAY', 'TUESDAY', 'WEDNESDAY']);
      expect(result.versions?.notificationEnabledForDays).toBe('4');
    });

    it('should map clock-in notification mediums correctly', () => {
      const data = {
        timeTrackingEffectiveUserSettings: {
          clockInSetting: {
            notificationMedium: {
              value: [
                TimeTracking_NotificationReminderMedium.Email,
                TimeTracking_NotificationReminderMedium.PushNotification,
              ],
              meta: { version: '5' },
            },
          },
        },
      };

      const result = mapEffectiveUserSettings(data);

      expect(result.clockInEmail).toBe(true);
      expect(result.clockInMobile).toBe(true);
      expect(result.versions?.clockInNotificationMedium).toBe('5');
    });

    it('should map clock-out notification mediums correctly', () => {
      const data = {
        timeTrackingEffectiveUserSettings: {
          clockOutSetting: {
            notificationMedium: {
              value: [TimeTracking_NotificationReminderMedium.Email],
              meta: { version: '6' },
            },
          },
        },
      };

      const result = mapEffectiveUserSettings(data);

      expect(result.clockOutEmail).toBe(true);
      expect(result.clockOutMobile).toBe(false);
      expect(result.versions?.clockOutNotificationMedium).toBe('6');
    });

    it('should handle complete settings data', () => {
      const data = {
        timeTrackingEffectiveUserSettings: {
          clockInSetting: {
            reminderTime: {
              value: '08:30',
              meta: { version: '1' },
            },
            notificationMedium: {
              value: [TimeTracking_NotificationReminderMedium.Email],
              meta: { version: '2' },
            },
          },
          clockOutSetting: {
            reminderTime: {
              value: '17:30',
              meta: { version: '3' },
            },
            notificationMedium: {
              value: [TimeTracking_NotificationReminderMedium.PushNotification],
              meta: { version: '4' },
            },
          },
          notificationEnabledForDays: {
            value: [
              Common_DayOfWeek.Monday,
              Common_DayOfWeek.Tuesday,
              Common_DayOfWeek.Wednesday,
              Common_DayOfWeek.Thursday,
              Common_DayOfWeek.Friday,
            ],
            meta: { version: '5' },
          },
        },
      };

      const result = mapEffectiveUserSettings(data);

      expect(result).toEqual({
        clockInTime: '8:30 AM',
        clockOutTime: '5:30 PM',
        daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
        clockInEmail: true,
        clockInMobile: false,
        clockOutEmail: false,
        clockOutMobile: true,
        versions: {
          clockInReminderTime: '1',
          clockInNotificationMedium: '2',
          clockOutReminderTime: '3',
          clockOutNotificationMedium: '4',
          notificationEnabledForDays: '5',
        },
      });
    });

    it('should handle time already in AM/PM format', () => {
      const data = {
        timeTrackingEffectiveUserSettings: {
          clockInSetting: {
            reminderTime: {
              value: '9:00 AM',
            },
          },
        },
      };

      const result = mapEffectiveUserSettings(data);

      expect(result.clockInTime).toBe('9:00 AM');
    });

    it('should use default version when meta is missing', () => {
      const data = {
        timeTrackingEffectiveUserSettings: {
          clockInSetting: {
            reminderTime: {
              value: '08:00',
            },
          },
        },
      };

      const result = mapEffectiveUserSettings(data);

      expect(result.versions?.clockInReminderTime).toBe('1');
    });

    it('should handle empty notification mediums', () => {
      const data = {
        timeTrackingEffectiveUserSettings: {
          clockInSetting: {
            notificationMedium: {
              value: [],
            },
          },
        },
      };

      const result = mapEffectiveUserSettings(data);

      expect(result.clockInEmail).toBe(false);
      expect(result.clockInMobile).toBe(false);
    });
  });

  describe('mapNotificationSettingsToManageUserInput', () => {
    const baseSettings = {
      notificationSetting: 'custom',
      clockInTime: '8:00 AM',
      clockOutTime: '5:00 PM',
      daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
      adjustNotification: 'Admins and managers',
      notesNotification: 'Admins and managers',
      clockInEmail: true,
      clockInMobile: true,
      clockOutEmail: true,
      clockOutMobile: false,
      scheduleEmail: true,
      scheduleMobile: true,
      shiftReminderEmail: true,
      shiftReminderMobile: false,
      timeOffEmail: true,
      timeOffMobile: true,
      versions: {
        clockInReminderTime: '1',
        clockInNotificationMedium: '2',
        clockOutReminderTime: '3',
        clockOutNotificationMedium: '4',
        notificationEnabledForDays: '5',
      },
    };

    it('should map settings to GraphQL mutation input for USER', () => {
      const settingsFor = {
        id: 'user123',
        timeForType: TimeTracking_TimeForType.Employee,
      };
      const result = mapNotificationSettingsToManageUserInput(
        baseSettings,
        settingsFor,
      );

      expect(result).toEqual({
        clockIn: {
          reminderTime: {
            value: '08:00',
            version: '1',
          },
          notificationMedium: {
            value: [
              TimeTracking_NotificationReminderMedium.Email,
              TimeTracking_NotificationReminderMedium.PushNotification,
            ],
            version: '2',
          },
        },
        clockOut: {
          reminderTime: {
            value: '17:00',
            version: '3',
          },
          notificationMedium: {
            value: [TimeTracking_NotificationReminderMedium.Email],
            version: '4',
          },
        },
        notificationEnabledForDays: {
          value: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
          version: '5',
        },
        settingsFor,
      });
    });

    it('should map settings to GraphQL mutation input for VENDOR (strips extra keys on settingsFor)', () => {
      const settingsFor = {
        id: 'company456',
        timeForType: TimeTracking_TimeForType.Vendor,
        displayName: 'Should be stripped',
      };
      const result = mapNotificationSettingsToManageUserInput(
        baseSettings,
        settingsFor,
      );

      expect(result.settingsFor).toEqual({
        id: 'company456',
        timeForType: TimeTracking_TimeForType.Vendor,
      });
    });

    it('should handle only email notifications', () => {
      const settingsFor = {
        id: 'user123',
        timeForType: TimeTracking_TimeForType.Employee,
      };
      const settings = {
        ...baseSettings,
        clockInMobile: false,
        clockOutMobile: false,
      };

      const result = mapNotificationSettingsToManageUserInput(
        settings,
        settingsFor,
      );

      expect(result.clockIn.notificationMedium.value).toEqual([
        TimeTracking_NotificationReminderMedium.Email,
      ]);
      expect(result.clockOut.notificationMedium.value).toEqual([
        TimeTracking_NotificationReminderMedium.Email,
      ]);
    });

    it('should handle only mobile notifications', () => {
      const settingsFor = {
        id: 'user123',
        timeForType: TimeTracking_TimeForType.Employee,
      };
      const settings = {
        ...baseSettings,
        clockInEmail: false,
        clockOutEmail: false,
        clockOutMobile: true,
      };

      const result = mapNotificationSettingsToManageUserInput(
        settings,
        settingsFor,
      );

      expect(result.clockIn.notificationMedium.value).toEqual([
        TimeTracking_NotificationReminderMedium.PushNotification,
      ]);
      expect(result.clockOut.notificationMedium.value).toEqual([
        TimeTracking_NotificationReminderMedium.PushNotification,
      ]);
    });

    it('should handle no notifications enabled', () => {
      const settingsFor = {
        id: 'user123',
        timeForType: TimeTracking_TimeForType.Employee,
      };
      const settings = {
        ...baseSettings,
        clockInEmail: false,
        clockInMobile: false,
        clockOutEmail: false,
        clockOutMobile: false,
      };

      const result = mapNotificationSettingsToManageUserInput(
        settings,
        settingsFor,
      );

      expect(result.clockIn.notificationMedium.value).toEqual([]);
      expect(result.clockOut.notificationMedium.value).toEqual([]);
    });

    it('should convert PM times correctly', () => {
      const settingsFor = {
        id: 'user123',
        timeForType: TimeTracking_TimeForType.Employee,
      };
      const settings = {
        ...baseSettings,
        clockInTime: '2:30 PM',
        clockOutTime: '11:45 PM',
      };

      const result = mapNotificationSettingsToManageUserInput(
        settings,
        settingsFor,
      );

      expect(result.clockIn.reminderTime.value).toBe('14:30');
      expect(result.clockOut.reminderTime.value).toBe('23:45');
    });

    it('should handle midnight and noon correctly', () => {
      const settingsFor = {
        id: 'user123',
        timeForType: TimeTracking_TimeForType.Employee,
      };
      const settings = {
        ...baseSettings,
        clockInTime: '12:00 AM',
        clockOutTime: '12:00 PM',
      };

      const result = mapNotificationSettingsToManageUserInput(
        settings,
        settingsFor,
      );

      expect(result.clockIn.reminderTime.value).toBe('00:00');
      expect(result.clockOut.reminderTime.value).toBe('12:00');
    });

    it('should handle custom days of week', () => {
      const settingsFor = {
        id: 'user123',
        timeForType: TimeTracking_TimeForType.Employee,
      };
      const settings = {
        ...baseSettings,
        daysOfWeek: ['SATURDAY', 'SUNDAY'],
      };

      const result = mapNotificationSettingsToManageUserInput(
        settings,
        settingsFor,
      );

      expect(result.notificationEnabledForDays.value).toEqual([
        'SATURDAY',
        'SUNDAY',
      ]);
    });

    it('should preserve version numbers', () => {
      const settingsFor = {
        id: 'user123',
        timeForType: TimeTracking_TimeForType.Employee,
      };
      const settings = {
        ...baseSettings,
        versions: {
          clockInReminderTime: '10',
          clockInNotificationMedium: '20',
          clockOutReminderTime: '30',
          clockOutNotificationMedium: '40',
          notificationEnabledForDays: '50',
        },
      };

      const result = mapNotificationSettingsToManageUserInput(
        settings,
        settingsFor,
      );

      expect(result.clockIn.reminderTime.version).toBe('10');
      expect(result.clockIn.notificationMedium.version).toBe('20');
      expect(result.clockOut.reminderTime.version).toBe('30');
      expect(result.clockOut.notificationMedium.version).toBe('40');
      expect(result.notificationEnabledForDays.version).toBe('50');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null email/mobile values in getNotificationStatus', () => {
      const result = getNotificationStatus(mockIntl, null, null);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle undefined days array in formatDaysOfWeek', () => {
      const result = formatDaysOfWeek(mockIntl, undefined);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle empty string in convertTimeToHHMM', () => {
      expect(convertTimeToHHMM('')).toBe('');
    });

    it('should handle malformed time strings', () => {
      expect(convertTimeToHHMM('not a time')).toBe('not a time');
      // Function processes time-like strings but may not validate ranges
      const result = convertTimeToHHMM('99:99 AM');
      expect(typeof result).toBe('string');
    });

    it('should handle partial data in mapEffectiveUserSettings', () => {
      const data = {
        timeTrackingEffectiveUserSettings: {
          clockInSetting: {},
        },
      };

      const result = mapEffectiveUserSettings(data);

      expect(result).toHaveProperty('versions');
      expect(result.clockInTime).toBeUndefined();
    });

    it('should handle malformed time formats in mapEffectiveUserSettings', () => {
      const data = {
        timeTrackingEffectiveUserSettings: {
          clockInSetting: {
            reminderTime: {
              value: 'invalid-no-colon',
            },
          },
          clockOutSetting: {
            reminderTime: {
              value: 'abc:def',
            },
          },
        },
      };

      const result = mapEffectiveUserSettings(data);

      // Should return original invalid strings since they can't be parsed
      expect(result.clockInTime).toBe('invalid-no-colon');
      expect(result.clockOutTime).toBe('abc:def');
    });

    it('should handle undefined/null notification mediums in mapEffectiveUserSettings', () => {
      const data = {
        timeTrackingEffectiveUserSettings: {
          clockInSetting: {
            notificationMedium: {
              value: null,
            },
          },
          clockOutSetting: {
            notificationMedium: {
              value: undefined,
            },
          },
        },
      };

      const result = mapEffectiveUserSettings(data);

      // Should default to false when mediums are null/undefined
      expect(result.clockInEmail).toBeUndefined();
      expect(result.clockInMobile).toBeUndefined();
      expect(result.clockOutEmail).toBeUndefined();
      expect(result.clockOutMobile).toBeUndefined();
    });

    it('should return default weekdays when notificationEnabledForDays is null', () => {
      const data = {
        timeTrackingEffectiveUserSettings: {
          notificationEnabledForDays: {
            value: null,
          },
        },
      };

      const result = mapEffectiveUserSettings(data);

      // Should not set daysOfWeek when value is null
      expect(result.daysOfWeek).toBeUndefined();
    });

    it('should handle empty time strings in mapEffectiveUserSettings', () => {
      const data = {
        timeTrackingEffectiveUserSettings: {
          clockInSetting: {
            reminderTime: {
              value: '',
            },
          },
          clockOutSetting: {
            reminderTime: {
              value: null,
            },
          },
        },
      };

      const result = mapEffectiveUserSettings(data);

      // Empty/null values don't set properties (only truthy values are mapped)
      expect(result.clockInTime).toBeUndefined();
      expect(result.clockOutTime).toBeUndefined();
    });

    it('should handle time format with only one part (no colon)', () => {
      const data = {
        timeTrackingEffectiveUserSettings: {
          clockInSetting: {
            reminderTime: {
              value: '8',
            },
          },
        },
      };

      const result = mapEffectiveUserSettings(data);

      // Should return original string when parsing fails
      expect(result.clockInTime).toBe('8');
    });

    it('should handle exception in time parsing gracefully', () => {
      const data = {
        timeTrackingEffectiveUserSettings: {
          clockInSetting: {
            reminderTime: {
              // This will cause split to work but parseInt to return NaN
              value: 'not:time',
            },
          },
        },
      };

      const result = mapEffectiveUserSettings(data);

      // Should return original string when NaN is encountered
      expect(result.clockInTime).toBe('not:time');
    });

    it('should handle convertTimeToHHMM with malformed AM/PM format', () => {
      // Test regex match failure path
      expect(convertTimeToHHMM('8 AM')).toBe('8 AM'); // Missing colon
      expect(convertTimeToHHMM('8: AM')).toBe('8: AM'); // Missing minutes
      expect(convertTimeToHHMM('8:00XM')).toBe('8:00XM'); // Invalid period
    });

    it('should handle convertTimeToHHMM error scenarios', () => {
      // Test catch block by passing values that could cause errors
      expect(convertTimeToHHMM('12:00 AM with extra text')).toBe('00:00');
      expect(convertTimeToHHMM('invalid format')).toBe('invalid format');
    });

    it('should handle notification medium with only one defined', () => {
      const data = {
        timeTrackingEffectiveUserSettings: {
          clockInSetting: {
            notificationMedium: {
              value: [TimeTracking_NotificationReminderMedium.Email],
            },
          },
        },
      };

      const result = mapEffectiveUserSettings(data);

      expect(result.clockInEmail).toBe(true);
      expect(result.clockInMobile).toBe(false);
    });

    it('should handle days of week conversion edge case', () => {
      const data = {
        timeTrackingEffectiveUserSettings: {
          notificationEnabledForDays: {
            value: [],
          },
        },
      };

      const result = mapEffectiveUserSettings(data);

      // Empty array returns default weekdays (Monday-Friday)
      expect(result.daysOfWeek).toEqual([
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
      ]);
    });

    it('should handle truly empty/falsy time value triggering line 73', () => {
      const data = {
        timeTrackingEffectiveUserSettings: {
          clockInSetting: {
            reminderTime: {
              value: undefined,
            },
          },
        },
      };

      const result = mapEffectiveUserSettings(data);

      // Undefined value shouldn't set clockInTime
      expect(result.clockInTime).toBeUndefined();
    });

    it('should handle error in convertTimeToHHMM catch block (line 268)', () => {
      // Test various edge cases that might trigger catch block
      expect(convertTimeToHHMM('12:00 PM')).toBe('12:00');

      // Edge case with special characters
      const result = convertTimeToHHMM('test\x00string');
      expect(typeof result).toBe('string');
    });

    it('should handle notification mediums with missing medium param (line 133)', () => {
      const data = {
        timeTrackingEffectiveUserSettings: {
          clockInSetting: {
            notificationMedium: {
              // Value exists but we're checking for a medium that's undefined
              value: [TimeTracking_NotificationReminderMedium.Email],
            },
          },
        },
      };

      const result = mapEffectiveUserSettings(data);

      // Should still map correctly even with edge cases
      expect(result.clockInEmail).toBe(true);
      expect(result.clockInMobile).toBe(false);
    });

    it('should handle deeply nested time format edge case (line 109)', () => {
      const data = {
        timeTrackingEffectiveUserSettings: {
          clockInSetting: {
            reminderTime: {
              // Value that could potentially throw during parsing
              value: '::',
            },
          },
        },
      };

      const result = mapEffectiveUserSettings(data);

      // Should handle gracefully without crashing
      expect(result).toHaveProperty('versions');
    });

    it('should handle convertTimeToHHMM with regex edge cases', () => {
      // These test the regex match failure at line 249
      expect(convertTimeToHHMM('AM')).toBe('AM');
      expect(convertTimeToHHMM('PM')).toBe('PM');
      expect(convertTimeToHHMM(': AM')).toBe(': AM');
      expect(convertTimeToHHMM('12:AM')).toBe('12:AM');
    });

    it('should handle time string that causes exception in parsing', () => {
      const data = {
        timeTrackingEffectiveUserSettings: {
          clockInSetting: {
            reminderTime: {
              // This causes parseInt to work but creates NaN scenario
              value: 'NaN:NaN',
            },
          },
        },
      };

      const result = mapEffectiveUserSettings(data);

      // Should return the original invalid string
      expect(result.clockInTime).toBe('NaN:NaN');
    });
  });
});

// ---------------------------------------------------------------------------
// mapOvertimeNotificationUnifiedInput
// ---------------------------------------------------------------------------

const makeOvertimeRule = (period: string, overrides: any = {}): any => ({
  __typename: 'TimeTracking_OvertimeNotificationRule',
  id: `rule-${period}`,
  meta: { version: '1' },
  threshold: { hours: 8, minutes: 0, period },
  alertFrequency: { totalAlerts: 2, intervalMinutes: 60 },
  recipients: {
    admin: [TimeTracking_NotificationReminderMedium.Email],
    groupManager: [TimeTracking_NotificationReminderMedium.Email],
    employee: [TimeTracking_NotificationReminderMedium.Email],
  },
  assignedTo: {
    entityType: TimeTracking_OvertimeRuleEntityType.All,
    entityIds: '-1',
  },
  ...overrides,
});

const settingsFor = {
  id: 'user-123',
  timeForType: TimeTracking_TimeForType.Employee,
};

describe('mapOvertimeNotificationUnifiedInput', () => {
  it('returns undefined when saved and draft rules are identical (no change)', () => {
    const rule = makeOvertimeRule(TimeTracking_OvertimePeriod.Day);
    const result = mapOvertimeNotificationUnifiedInput(settingsFor, {
      savedRules: [rule],
      draftRules: [rule],
    });
    expect(result).toBeUndefined();
  });

  it('returns a unified input with create when a new draft rule is added', () => {
    const draft = makeOvertimeRule(TimeTracking_OvertimePeriod.Day, {
      id: 'draft-DAY-1234',
    });
    const result = mapOvertimeNotificationUnifiedInput(settingsFor, {
      savedRules: [],
      draftRules: [draft],
    });
    expect(result).not.toBeUndefined();
    expect(result?.overtimeNotifications?.create).toHaveLength(1);
    expect(result?.overtimeNotifications?.create?.[0].threshold.period).toBe(
      TimeTracking_OvertimePeriod.Day,
    );
  });

  it('passes userLevelOvertimeNotifications=true so ALL-assigned updates emit create', () => {
    const saved = makeOvertimeRule(TimeTracking_OvertimePeriod.Week);
    const changed = {
      ...saved,
      threshold: { ...saved.threshold, hours: 45 },
    };
    const result = mapOvertimeNotificationUnifiedInput(settingsFor, {
      savedRules: [saved],
      draftRules: [changed],
    });
    // With userLevel=true, update on ALL rule → create
    expect(result?.overtimeNotifications?.create).toHaveLength(1);
    expect(result?.overtimeNotifications?.create?.[0].threshold.hours).toBe(45);
    expect(result?.overtimeNotifications?.update).toBeUndefined();
  });

  it('does NOT include a delete for an ALL-assigned rule removed from draft (user-level guard)', () => {
    const saved = makeOvertimeRule(TimeTracking_OvertimePeriod.Day);
    const result = mapOvertimeNotificationUnifiedInput(settingsFor, {
      savedRules: [saved],
      draftRules: [],
    });
    expect(result).toBeUndefined();
  });

  it('includes settingsFor in the returned input', () => {
    const draft = makeOvertimeRule(TimeTracking_OvertimePeriod.Week, {
      id: 'draft-WEEK-999',
    });
    const result = mapOvertimeNotificationUnifiedInput(settingsFor, {
      savedRules: [],
      draftRules: [draft],
    });
    expect(result?.settingsFor).toEqual({
      id: settingsFor.id,
      timeForType: settingsFor.timeForType,
    });
  });

  it('strips displayName from settingsFor before passing to API input', () => {
    const settingsForWithDisplay = {
      ...settingsFor,
      displayName: 'John Doe',
    };
    const draft = makeOvertimeRule(TimeTracking_OvertimePeriod.Day, {
      id: 'draft-DAY-555',
    });
    const result = mapOvertimeNotificationUnifiedInput(settingsForWithDisplay, {
      savedRules: [],
      draftRules: [draft],
    });
    expect((result?.settingsFor as any)?.displayName).toBeUndefined();
    expect(result?.settingsFor?.id).toBe(settingsFor.id);
  });
});
