// @ts-nocheck
// This file is using @ts-nocheck to bypass the tsconfig.json parsing error
import { act, renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import React from 'react';
import { buildSandbox } from '@payroll/quicksand';
import { renderHookWithQuicksandProvider } from 'test/unit/testUtils';
import {
  mapDaysOfWeekValueToNumber,
  MappedQLSettings,
  useGetQLSettings,
  timeEntrySettingsDefaultState,
  mapQlCompanySettings,
} from 'src/js/service/hooks/settings/useGetQLSettings';
import {
  Common_DayOfWeek,
  TimeTracking_EmployerSettings,
  TimeTracking_NotificationReminderMedium,
  TimeTracking_NotificationType,
  TimeTracking_ScheduleShiftChangeNotificationPreference,
} from 'src/__generated__/timeTracking/graphql';
import * as customerInteraction from 'src/js/common/CustomerInteraction';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import { WEEK_DAYS } from 'src/js/common/constants';
import { Sandbox } from 'src/js/common/sandbox';

// Mock the Apollo hooks
const mockQueryFn = jest.fn();
jest.mock('src/__generated__/timeTracking/graphql', () => {
  const originalModule = jest.requireActual(
    'src/__generated__/timeTracking/graphql',
  );

  return {
    ...originalModule,
    useEmployerSettingLazyQuery: () => [
      mockQueryFn,
      {
        loading: false,
        error: null,
        data: { timeTrackingEmployerSettings: {} },
      },
    ],
  };
});

// Mock the CustomerInteraction module
jest.mock('src/js/common/CustomerInteraction', () => ({
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn().mockReturnValue({}),
  TimeCustomerInteraction: {
    EMPLOYER_SETTINGS_GET: 'EMPLOYER_SETTINGS_GET',
  },
}));

describe('useGetQLSettings', () => {
  let sandbox: Sandbox;

  beforeEach(() => {
    sandbox = buildSandbox();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('mapDaysOfWeekValueToNumber', () => {
    it('should map SUNDAY to 0', () => {
      expect(mapDaysOfWeekValueToNumber(Common_DayOfWeek.Sunday)).toBe(0);
    });

    it('should map MONDAY to 1', () => {
      expect(mapDaysOfWeekValueToNumber(Common_DayOfWeek.Monday)).toBe(1);
    });

    it('should map TUESDAY to 2', () => {
      expect(mapDaysOfWeekValueToNumber(Common_DayOfWeek.Tuesday)).toBe(2);
    });

    it('should map WEDNESDAY to 3', () => {
      expect(mapDaysOfWeekValueToNumber(Common_DayOfWeek.Wednesday)).toBe(3);
    });

    it('should map THURSDAY to 4', () => {
      expect(mapDaysOfWeekValueToNumber(Common_DayOfWeek.Thursday)).toBe(4);
    });

    it('should map FRIDAY to 5', () => {
      expect(mapDaysOfWeekValueToNumber(Common_DayOfWeek.Friday)).toBe(5);
    });

    it('should map SATURDAY to 6', () => {
      expect(mapDaysOfWeekValueToNumber(Common_DayOfWeek.Saturday)).toBe(6);
    });

    it('should return 0 for unknown day', () => {
      expect(mapDaysOfWeekValueToNumber('UNKNOWN' as Common_DayOfWeek)).toBe(0);
    });
  });

  describe('mapQlCompanySettings', () => {
    it('should map complete settings data correctly', () => {
      const mockData: TimeTracking_EmployerSettings = {
        timeTrackingEnabled: { meta: { version: '1' }, value: true },
        billingForTimeEnabled: { meta: { version: '2' }, value: true },
        startWorkWeek: {
          meta: { version: '3' },
          value: Common_DayOfWeek.Monday,
        },
        billingRateForTimeEnabled: { meta: { version: '4' }, value: true },
        timeTrackingSupported: { meta: { version: '5' }, value: true },
        transactionBillingForTimeEnabled: {
          meta: { version: '6' },
          value: true,
        },
        transactionTimeTrackingEnabled: { meta: { version: '7' }, value: true },
        useItemForTime: { meta: { version: '8' }, value: true },
        notificationSettings: {
          startShiftNotifications: {
            reminderTime: { meta: { version: '9' }, value: '9:00' },
            notificationMedium: {
              meta: { version: '10' },
              value: [TimeTracking_NotificationReminderMedium.Email],
            },
          },
          endShiftNotifications: {
            reminderTime: { meta: { version: '11' }, value: '18:00' },
            notificationMedium: {
              meta: { version: '12' },
              value: [TimeTracking_NotificationReminderMedium.PushNotification],
            },
          },
          notificationEnabledForDays: {
            meta: { version: '13' },
            value: ['MONDAY', 'TUESDAY'],
          },
          clockOutOverrideNotifications: {
            adminEnabled: { meta: { version: '14' }, value: true },
            groupManagerEnabled: { meta: { version: '15' }, value: true },
          },
          timesheetEditNotifications: {
            adminEnabled: { meta: { version: '16' }, value: true },
            groupManagerEnabled: { meta: { version: '17' }, value: true },
          },
        },
        dateTimeSettings: {
          timeZone: { meta: { version: '18' }, value: 'America/Los_Angeles' },
          clockFormat: { meta: { version: '19' }, value: 12 },
        },
        timesheetManagementSettings: {
          timesheet: {
            splitAtMidnightEnabled: { meta: { version: '20' }, value: false },
            manageOwnTimesheetEnabled: {
              meta: { version: '21' },
              value: false,
            },
            editClockOutTimeEnabled: { meta: { version: '22' }, value: false },
            clockOutOverrideHours: { meta: { version: '23' }, value: 10 },
            locationTracking: {
              meta: { version: '38' },
              value: 'REQUIRED' as any,
            },
            mileageTrackingEnabled: { meta: { version: '39' }, value: true },
            mobileTimeTrackingEnabled: { meta: { version: '44' }, value: true },
            signatureCaptureEnabled: { meta: { version: '45' }, value: false },
          },
          customFields: {
            customersEnabled: { meta: { version: '24' }, value: false },
            classEnabled: { meta: { version: '25' }, value: true },
            locationEnabled: { meta: { version: '26' }, value: true },
          },
          notes: {
            enabled: { meta: { version: '27' }, value: true },
            editEnabled: { meta: { version: '28' }, value: true },
            requiredEnabled: { meta: { version: '29' }, value: true },
          },
        },
        clockRoundingSettings: {
          startTimeRounding: {
            direction: { meta: { version: '30' }, value: 'UP' },
            roundInMin: { meta: { version: '31' }, value: 5 },
          },
          endTimeRounding: {
            direction: { meta: { version: '32' }, value: 'DOWN' },
            roundInMin: { meta: { version: '33' }, value: 10 },
          },
        },
        coreSettings: {
          requireBillable: { meta: { version: '34' }, value: true },
          serviceItemRequired: { meta: { version: '35' }, value: true },
          classRequired: { meta: { version: '36' }, value: true },
          locationRequired: { meta: { version: '37' }, value: true },
        },
        geofenceSettings: {
          geofenceEnabled: { meta: { version: '40' }, value: true },
          geofenceReminderSettings: {
            startTime: { meta: { version: '41' }, value: '09:00' },
            endTime: { meta: { version: '42' }, value: '18:00' },
            daysOfWeek: {
              meta: { version: '43' },
              value: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
            },
          },
        },
      };

      const result = mapQlCompanySettings(mockData);

      expect(result.isServiceFieldEnabled).toEqual({
        version: '1',
        value: true,
      });
      expect(result.isBillingFieldEnabled).toEqual({
        version: '2',
        value: true,
      });
      expect(result.firstDayOfWeek).toEqual({
        version: '3',
        value: 1, // Monday
      });
      expect(result.billingRateForTimeEnabled).toEqual({
        version: '4',
        value: true,
      });
      expect(result.timeTrackingSupported).toEqual({
        version: '5',
        value: true,
      });
      expect(result.transactionBillingForTimeEnabled).toEqual({
        version: '6',
        value: true,
      });
      expect(result.transactionTimeTrackingEnabled).toEqual({
        version: '7',
        value: true,
      });
      expect(result.useItemForTime).toEqual({
        version: '8',
        value: true,
      });
      expect(result.clockInNotificationReminderTime).toEqual({
        version: '9',
        value: '9:00',
      });
      expect(result.clockInNotificationReminderEmail.value).toBe(true);
      expect(result.clockInNotificationReminderMobile.value).toBe(false);
      expect(result.clockOutNotificationReminderTime).toEqual({
        version: '11',
        value: '18:00',
      });
      expect(result.clockOutNotificationReminderEmail.value).toBe(false);
      expect(result.clockOutNotificationReminderMobile.value).toBe(true);
      expect(result.notificationEnabledForDays).toEqual({
        version: '13',
        value: ['MONDAY', 'TUESDAY'],
      });
      expect(result.notifyAdminOnClockOutOverrideEnabled).toEqual({
        version: '14',
        value: true,
      });
      expect(result.notifyManagerOnClockOutOverrideEnabled).toEqual({
        version: '15',
        value: true,
      });
      expect(result.notifyAdminOnTimeSheetNotesEditEnabled).toEqual({
        version: '16',
        value: true,
      });
      expect(result.notifyGroupManagerOnTimeSheetNotesEditEnabled).toEqual({
        version: '17',
        value: true,
      });
      expect(result.timeZone).toEqual({
        version: '18',
        value: 'America/Los_Angeles',
      });
      expect(result.timeFormat).toEqual({
        version: '19',
        value: 12,
      });
      expect(result.splitTimeSheetAtMidnightEnabled).toEqual({
        version: '20',
        value: false,
      });
      expect(result.manageOwnTimeSheetsEnabled).toEqual({
        version: '21',
        value: false,
      });
      expect(result.editClockOutTimeEnabled).toEqual({
        version: '22',
        value: false,
      });
      expect(result.clockOutOverrideHours).toEqual({
        version: '23',
        value: 10,
      });
      expect(result.clockInRoundDirection).toEqual({
        version: '30',
        value: 'UP',
      });
      expect(result.clockInRoundInMin).toEqual({
        version: '31',
        value: 5,
      });
      expect(result.clockOutRoundDirection).toEqual({
        version: '32',
        value: 'DOWN',
      });
      expect(result.clockOutRoundInMin).toEqual({
        version: '33',
        value: 10,
      });
      expect(result.customersForTimeSheetEnabled).toEqual({
        version: '24',
        value: false,
      });
      expect(result.requireBillable).toEqual({
        version: '34',
        value: true,
      });
      expect(result.classForTimeSheetEnabled).toEqual({
        version: '25',
        value: true,
      });
      expect(result.locationForTimeSheetEnabled).toEqual({
        version: '26',
        value: true,
      });
      expect(result.timeSheetEntryNotesEnabled).toEqual({
        version: '27',
        value: true,
      });
      expect(result.timeSheetEntryEditNotesEnabled).toEqual({
        version: '28',
        value: true,
      });
      expect(result.timeSheetEntryMakesNotesRequiredEnabled).toEqual({
        version: '29',
        value: true,
      });
      expect(result.serviceItemRequired).toEqual({
        version: '35',
        value: true,
      });
      expect(result.classRequired).toEqual({
        version: '36',
        value: true,
      });
      expect(result.locationRequired).toEqual({
        version: '37',
        value: true,
      });
      expect(result.locationTracking).toEqual({
        version: '38',
        value: 'REQUIRED',
      });
      expect(result.mileageTrackingEnabled).toEqual({
        version: '39',
        value: true,
      });
      expect(result.mobileTimeTrackingEnabled).toEqual({
        version: '44',
        value: true,
      });
      expect(result.signatureCaptureEnabled).toEqual({
        version: '45',
        value: false,
      });
      expect(result.geofenceEnabled).toEqual({
        version: '40',
        value: true,
      });
      expect(result.geofenceReminderStartTime).toEqual({
        version: '41',
        value: '09:00',
      });
      expect(result.geofenceReminderEndTime).toEqual({
        version: '42',
        value: '18:00',
      });
      expect(result.geofenceReminderDaysOfWeek).toEqual({
        version: '43',
        value: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
      });
    });

    it('should handle empty data with default values', () => {
      const result = mapQlCompanySettings({} as TimeTracking_EmployerSettings);

      expect(result.isServiceFieldEnabled).toEqual({
        version: '0',
        value: false,
      });
      expect(result.isBillingFieldEnabled).toEqual({
        version: '0',
        value: false,
      });
      expect(result.firstDayOfWeek).toEqual({
        version: '0',
        value: 0, // Sunday default
      });
      expect(result.timeTrackingSupported).toEqual({
        version: '0',
        value: false,
      });
      expect(result.clockInNotificationReminderTime).toEqual({
        version: '0',
        value: '8:00',
      });
      expect(result.clockOutNotificationReminderTime).toEqual({
        version: '0',
        value: '17:00',
      });
      expect(result.notificationEnabledForDays).toEqual({
        version: '0',
        value: WEEK_DAYS,
      });
      expect(result.timeZone).toEqual({
        version: '0',
        value: '',
      });
      expect(result.timeFormat).toEqual({
        version: '0',
        value: 24,
      });
      expect(result.geofenceEnabled).toEqual({
        version: '0',
        value: false,
      });
      expect(result.geofenceReminderStartTime).toEqual({
        version: '0',
        value: '08:00',
      });
      expect(result.geofenceReminderEndTime).toEqual({
        version: '0',
        value: '17:00',
      });
      expect(result.geofenceReminderDaysOfWeek).toEqual({
        version: '0',
        value: WEEK_DAYS,
      });
    });

    it('should handle notification medium arrays correctly', () => {
      const mockData: TimeTracking_EmployerSettings = {
        notificationSettings: {
          startShiftNotifications: {
            notificationMedium: {
              meta: { version: '1' },
              value: [
                TimeTracking_NotificationReminderMedium.Email,
                TimeTracking_NotificationReminderMedium.PushNotification,
              ],
            },
          },
          endShiftNotifications: {
            notificationMedium: {
              meta: { version: '2' },
              value: [],
            },
          },
        },
      } as TimeTracking_EmployerSettings;

      const result = mapQlCompanySettings(mockData);

      expect(result.clockInNotificationReminderEmail.value).toBe(true);
      expect(result.clockInNotificationReminderMobile.value).toBe(true);
      expect(result.clockOutNotificationReminderEmail.value).toBe(false);
      expect(result.clockOutNotificationReminderMobile.value).toBe(false);
    });

    it('should handle null/undefined notification settings gracefully', () => {
      const mockData: TimeTracking_EmployerSettings = {
        notificationSettings: {
          startShiftNotifications: null,
          endShiftNotifications: null,
        },
      } as TimeTracking_EmployerSettings;

      const result = mapQlCompanySettings(mockData);

      expect(result.clockInNotificationReminderEmail.value).toBe(false);
      expect(result.clockInNotificationReminderMobile.value).toBe(false);
      expect(result.clockOutNotificationReminderEmail.value).toBe(false);
      expect(result.clockOutNotificationReminderMobile.value).toBe(false);
    });

    it('should map locationTracking field with default value when not provided', () => {
      const result = mapQlCompanySettings({} as TimeTracking_EmployerSettings);

      expect(result.locationTracking).toEqual({
        version: '0',
        value: 'OPTIONAL',
      });
    });

    it('should map mileageTrackingEnabled field with default value when not provided', () => {
      const result = mapQlCompanySettings({} as TimeTracking_EmployerSettings);

      expect(result.mileageTrackingEnabled).toEqual({
        version: '0',
        value: false,
      });
    });

    it('should map locationTracking with REQUIRED value correctly', () => {
      const mockData: TimeTracking_EmployerSettings = {
        timesheetManagementSettings: {
          timesheet: {
            locationTracking: {
              meta: { version: '5' },
              value: 'REQUIRED' as any,
            },
          },
        },
      } as TimeTracking_EmployerSettings;

      const result = mapQlCompanySettings(mockData);

      expect(result.locationTracking).toEqual({
        version: '5',
        value: 'REQUIRED',
      });
    });

    it('should map locationTracking with OFF value correctly', () => {
      const mockData: TimeTracking_EmployerSettings = {
        timesheetManagementSettings: {
          timesheet: {
            locationTracking: {
              meta: { version: '3' },
              value: 'OFF' as any,
            },
          },
        },
      } as TimeTracking_EmployerSettings;

      const result = mapQlCompanySettings(mockData);

      expect(result.locationTracking).toEqual({
        version: '3',
        value: 'OFF',
      });
    });

    it('should map mileageTrackingEnabled to true when provided', () => {
      const mockData: TimeTracking_EmployerSettings = {
        timesheetManagementSettings: {
          timesheet: {
            mileageTrackingEnabled: {
              meta: { version: '2' },
              value: true,
            },
          },
        },
      } as TimeTracking_EmployerSettings;

      const result = mapQlCompanySettings(mockData);

      expect(result.mileageTrackingEnabled).toEqual({
        version: '2',
        value: true,
      });
    });

    it('should map mileageTrackingEnabled to false when provided', () => {
      const mockData: TimeTracking_EmployerSettings = {
        timesheetManagementSettings: {
          timesheet: {
            mileageTrackingEnabled: {
              meta: { version: '1' },
              value: false,
            },
          },
        },
      } as TimeTracking_EmployerSettings;

      const result = mapQlCompanySettings(mockData);

      expect(result.mileageTrackingEnabled).toEqual({
        version: '1',
        value: false,
      });
    });

    it('should map mobileTimeTrackingEnabled with default value when not provided', () => {
      const result = mapQlCompanySettings({} as TimeTracking_EmployerSettings);

      expect(result.mobileTimeTrackingEnabled).toEqual({
        version: '0',
        value: false,
      });
    });

    it('should map mobileTimeTrackingEnabled to true when provided', () => {
      const mockData: TimeTracking_EmployerSettings = {
        timesheetManagementSettings: {
          timesheet: {
            mobileTimeTrackingEnabled: {
              meta: { version: '2' },
              value: true,
            },
          },
        },
      } as TimeTracking_EmployerSettings;

      const result = mapQlCompanySettings(mockData);

      expect(result.mobileTimeTrackingEnabled).toEqual({
        version: '2',
        value: true,
      });
    });

    it('should map signatureCaptureEnabled with default value when not provided', () => {
      const result = mapQlCompanySettings({} as TimeTracking_EmployerSettings);

      expect(result.signatureCaptureEnabled).toEqual({
        version: '0',
        value: false,
      });
    });

    it('should map signatureCaptureEnabled to true when provided', () => {
      const mockData: TimeTracking_EmployerSettings = {
        timesheetManagementSettings: {
          timesheet: {
            signatureCaptureEnabled: {
              meta: { version: '3' },
              value: true,
            },
          },
        },
      } as TimeTracking_EmployerSettings;

      const result = mapQlCompanySettings(mockData);

      expect(result.signatureCaptureEnabled).toEqual({
        version: '3',
        value: true,
      });
    });

    it('should map geofenceEnabled with default value when not provided', () => {
      const result = mapQlCompanySettings({} as TimeTracking_EmployerSettings);

      expect(result.geofenceEnabled).toEqual({
        version: '0',
        value: false,
      });
    });

    it('should map geofenceEnabled to true when provided', () => {
      const mockData: TimeTracking_EmployerSettings = {
        geofenceSettings: {
          geofenceEnabled: {
            meta: { version: '5' },
            value: true,
          },
        },
      } as TimeTracking_EmployerSettings;

      const result = mapQlCompanySettings(mockData);

      expect(result.geofenceEnabled).toEqual({
        version: '5',
        value: true,
      });
    });

    it('should map geofenceEnabled to false when provided', () => {
      const mockData: TimeTracking_EmployerSettings = {
        geofenceSettings: {
          geofenceEnabled: {
            meta: { version: '3' },
            value: false,
          },
        },
      } as TimeTracking_EmployerSettings;

      const result = mapQlCompanySettings(mockData);

      expect(result.geofenceEnabled).toEqual({
        version: '3',
        value: false,
      });
    });

    it('should map geofenceReminderStartTime with default value when not provided', () => {
      const result = mapQlCompanySettings({} as TimeTracking_EmployerSettings);

      expect(result.geofenceReminderStartTime).toEqual({
        version: '0',
        value: '08:00',
      });
    });

    it('should map geofenceReminderStartTime when provided', () => {
      const mockData: TimeTracking_EmployerSettings = {
        geofenceSettings: {
          geofenceReminderSettings: {
            startTime: {
              meta: { version: '2' },
              value: '07:30',
            },
          },
        },
      } as TimeTracking_EmployerSettings;

      const result = mapQlCompanySettings(mockData);

      expect(result.geofenceReminderStartTime).toEqual({
        version: '2',
        value: '07:30',
      });
    });

    it('should map geofenceReminderEndTime with default value when not provided', () => {
      const result = mapQlCompanySettings({} as TimeTracking_EmployerSettings);

      expect(result.geofenceReminderEndTime).toEqual({
        version: '0',
        value: '17:00',
      });
    });

    it('should map geofenceReminderEndTime when provided', () => {
      const mockData: TimeTracking_EmployerSettings = {
        geofenceSettings: {
          geofenceReminderSettings: {
            endTime: {
              meta: { version: '4' },
              value: '19:00',
            },
          },
        },
      } as TimeTracking_EmployerSettings;

      const result = mapQlCompanySettings(mockData);

      expect(result.geofenceReminderEndTime).toEqual({
        version: '4',
        value: '19:00',
      });
    });

    it('should map geofenceReminderDaysOfWeek with default value when not provided', () => {
      const result = mapQlCompanySettings({} as TimeTracking_EmployerSettings);

      expect(result.geofenceReminderDaysOfWeek).toEqual({
        version: '0',
        value: WEEK_DAYS,
      });
    });

    it('should map geofenceReminderDaysOfWeek when provided', () => {
      const mockData: TimeTracking_EmployerSettings = {
        geofenceSettings: {
          geofenceReminderSettings: {
            daysOfWeek: {
              meta: { version: '6' },
              value: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
            },
          },
        },
      } as TimeTracking_EmployerSettings;

      const result = mapQlCompanySettings(mockData);

      expect(result.geofenceReminderDaysOfWeek).toEqual({
        version: '6',
        value: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
      });
    });

    it('should handle null geofenceSettings gracefully', () => {
      const mockData: TimeTracking_EmployerSettings = {
        geofenceSettings: null,
      } as TimeTracking_EmployerSettings;

      const result = mapQlCompanySettings(mockData);

      expect(result.geofenceEnabled).toEqual({
        version: '0',
        value: false,
      });
      expect(result.geofenceReminderStartTime).toEqual({
        version: '0',
        value: '08:00',
      });
      expect(result.geofenceReminderEndTime).toEqual({
        version: '0',
        value: '17:00',
      });
      expect(result.geofenceReminderDaysOfWeek).toEqual({
        version: '0',
        value: WEEK_DAYS,
      });
    });

    it('should handle null geofenceReminderSettings gracefully', () => {
      const mockData: TimeTracking_EmployerSettings = {
        geofenceSettings: {
          geofenceEnabled: { meta: { version: '1' }, value: true },
          geofenceReminderSettings: null,
        },
      } as TimeTracking_EmployerSettings;

      const result = mapQlCompanySettings(mockData);

      expect(result.geofenceEnabled).toEqual({
        version: '1',
        value: true,
      });
      expect(result.geofenceReminderStartTime).toEqual({
        version: '0',
        value: '08:00',
      });
      expect(result.geofenceReminderEndTime).toEqual({
        version: '0',
        value: '17:00',
      });
      expect(result.geofenceReminderDaysOfWeek).toEqual({
        version: '0',
        value: WEEK_DAYS,
      });
    });

    it.each([
      [TimeTracking_ScheduleShiftChangeNotificationPreference.Always, 'ALWAYS'],
      [TimeTracking_ScheduleShiftChangeNotificationPreference.Ask, 'ASK'],
      [TimeTracking_ScheduleShiftChangeNotificationPreference.Never, 'NEVER'],
    ])(
      'should map publishShiftChangePreference (%s) with version',
      (preference, expectedValue) => {
        const mockData: TimeTracking_EmployerSettings = {
          notificationSettings: {
            scheduleNotifications: {
              publishShiftChangePreference: {
                meta: { version: '7' },
                value: preference,
              },
            },
          },
        } as TimeTracking_EmployerSettings;

        const result = mapQlCompanySettings(mockData);

        expect(result.publishShiftChangePreference).toEqual({
          version: '7',
          value: expectedValue,
        });
      },
    );

    it('should default publishShiftChangePreference to empty when scheduleNotifications is absent', () => {
      const result = mapQlCompanySettings({} as TimeTracking_EmployerSettings);

      expect(result.publishShiftChangePreference).toEqual({
        version: '0',
        value: '',
      });
    });

    it('should default publishShiftChangePreference to empty when value is null', () => {
      const mockData: TimeTracking_EmployerSettings = {
        notificationSettings: {
          scheduleNotifications: {
            publishShiftChangePreference: {
              meta: { version: '3' },
              value: null,
            },
          },
        },
      } as TimeTracking_EmployerSettings;

      const result = mapQlCompanySettings(mockData);

      expect(result.publishShiftChangePreference).toEqual({
        version: '3',
        value: '',
      });
    });

    it('maps subscriptions to scheduleNotificationSubscriptions when present', () => {
      const mockData: TimeTracking_EmployerSettings = {
        notificationSettings: {
          scheduleNotifications: {
            subscriptions: [
              {
                notificationType: TimeTracking_NotificationType.ShiftPublished,
                distributionMethods: [
                  TimeTracking_NotificationReminderMedium.Email,
                ],
                meta: { version: '5' },
              },
            ],
          },
        },
      } as TimeTracking_EmployerSettings;

      const result = mapQlCompanySettings(mockData);

      expect(result.scheduleNotificationSubscriptions).toEqual([
        {
          notificationType: TimeTracking_NotificationType.ShiftPublished,
          distributionMethods: [TimeTracking_NotificationReminderMedium.Email],
          meta: { version: '5' },
        },
      ]);
    });

    // New users have no subscriptions yet — the API returns null for this field.
    it('defaults scheduleNotificationSubscriptions to [] when subscriptions is null (new user)', () => {
      const mockData: TimeTracking_EmployerSettings = {
        notificationSettings: {
          scheduleNotifications: {
            subscriptions: null,
          },
        },
      } as TimeTracking_EmployerSettings;

      const result = mapQlCompanySettings(mockData);

      expect(result.scheduleNotificationSubscriptions).toEqual([]);
    });

    it('defaults scheduleNotificationSubscriptions to [] when scheduleNotifications is absent', () => {
      const result = mapQlCompanySettings({} as TimeTracking_EmployerSettings);

      expect(result.scheduleNotificationSubscriptions).toEqual([]);
    });

    it('filters out null entries within the subscriptions array', () => {
      const mockData: TimeTracking_EmployerSettings = {
        notificationSettings: {
          scheduleNotifications: {
            subscriptions: [
              null,
              {
                notificationType:
                  TimeTracking_NotificationType.ShiftStartBefore,
                distributionMethods: [],
                meta: { version: '2' },
              },
            ],
          },
        },
      } as unknown as TimeTracking_EmployerSettings;

      const result = mapQlCompanySettings(mockData);

      expect(result.scheduleNotificationSubscriptions).toEqual([
        {
          notificationType: TimeTracking_NotificationType.ShiftStartBefore,
          distributionMethods: [],
          meta: { version: '2' },
        },
      ]);
    });

    it('maps customDimensions from timesheetManagementSettings.customFields', () => {
      const mockData: TimeTracking_EmployerSettings = {
        timesheetManagementSettings: {
          customFields: {
            customDimensions: [
              {
                dimensionDefinition: { id: '1000000023' },
                enabledForTimeTracking: {
                  meta: { version: '1' },
                  value: true,
                },
                required: {
                  meta: { version: '2' },
                  value: false,
                },
              },
              {
                dimensionDefinition: { id: '1000000024' },
                enabledForTimeTracking: {
                  meta: { version: '3' },
                  value: false,
                },
                required: {
                  meta: { version: '4' },
                  value: true,
                },
              },
            ],
          },
        },
      } as TimeTracking_EmployerSettings;

      const result = mapQlCompanySettings(mockData);

      expect(result.customDimensions).toEqual([
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
      ]);
    });

    it('defaults customDimensions to [] when customFields is absent', () => {
      const result = mapQlCompanySettings({} as TimeTracking_EmployerSettings);

      expect(result.customDimensions).toEqual([]);
    });

    it('defaults customDimensions to [] when customDimensions is null', () => {
      const mockData: TimeTracking_EmployerSettings = {
        timesheetManagementSettings: {
          customFields: {
            customDimensions: null,
          },
        },
      } as TimeTracking_EmployerSettings;

      const result = mapQlCompanySettings(mockData);

      expect(result.customDimensions).toEqual([]);
    });

    it('filters out null entries within the customDimensions array', () => {
      const mockData: TimeTracking_EmployerSettings = {
        timesheetManagementSettings: {
          customFields: {
            customDimensions: [
              null,
              {
                dimensionDefinition: { id: '1000000023' },
                enabledForTimeTracking: {
                  meta: { version: '1' },
                  value: true,
                },
                required: {
                  meta: { version: '2' },
                  value: false,
                },
              },
            ],
          },
        },
      } as unknown as TimeTracking_EmployerSettings;

      const result = mapQlCompanySettings(mockData);

      expect(result.customDimensions).toEqual([
        {
          dimensionDefinitionId: '1000000023',
          enabledForTimeTracking: { version: '1', value: true },
          required: { version: '2', value: false },
        },
      ]);
    });

    it('filters out customDimensions without a dimensionDefinition id', () => {
      const mockData: TimeTracking_EmployerSettings = {
        timesheetManagementSettings: {
          customFields: {
            customDimensions: [
              {
                dimensionDefinition: null,
                enabledForTimeTracking: {
                  meta: { version: '1' },
                  value: true,
                },
                required: {
                  meta: { version: '2' },
                  value: false,
                },
              },
              {
                dimensionDefinition: { id: '1000000023' },
                enabledForTimeTracking: {
                  meta: { version: '3' },
                  value: false,
                },
                required: {
                  meta: { version: '4' },
                  value: true,
                },
              },
            ],
          },
        },
      } as unknown as TimeTracking_EmployerSettings;

      const result = mapQlCompanySettings(mockData);

      expect(result.customDimensions).toEqual([
        {
          dimensionDefinitionId: '1000000023',
          enabledForTimeTracking: { version: '3', value: false },
          required: { version: '4', value: true },
        },
      ]);
    });

    it('defaults missing customDimension toggle values to false', () => {
      const mockData: TimeTracking_EmployerSettings = {
        timesheetManagementSettings: {
          customFields: {
            customDimensions: [
              {
                dimensionDefinition: { id: '1000000099' },
                enabledForTimeTracking: {
                  meta: { version: '0' },
                  value: undefined,
                },
                required: {
                  meta: { version: '0' },
                  value: undefined,
                },
              },
            ],
          },
        },
      } as unknown as TimeTracking_EmployerSettings;

      const result = mapQlCompanySettings(mockData);

      expect(result.customDimensions).toEqual([
        {
          dimensionDefinitionId: '1000000099',
          enabledForTimeTracking: { version: '0', value: false },
          required: { version: '0', value: false },
        },
      ]);
    });
  });

  describe('timeEntrySettingsDefaultState', () => {
    it('should have correct default values', () => {
      expect(timeEntrySettingsDefaultState.isServiceFieldEnabled).toEqual({
        version: '0',
        value: false,
      });
      expect(timeEntrySettingsDefaultState.isBillingFieldEnabled).toEqual({
        version: '0',
        value: false,
      });
      expect(timeEntrySettingsDefaultState.firstDayOfWeek).toEqual({
        version: '0',
        value: 0,
      });
      expect(timeEntrySettingsDefaultState.timeTrackingSupported).toEqual({
        version: '0',
        value: false,
      });
      expect(
        timeEntrySettingsDefaultState.clockInNotificationReminderTime,
      ).toEqual({
        version: '0',
        value: '8:00',
      });
      expect(
        timeEntrySettingsDefaultState.clockOutNotificationReminderTime,
      ).toEqual({
        version: '0',
        value: '17:00',
      });
      expect(timeEntrySettingsDefaultState.notificationEnabledForDays).toEqual({
        version: '0',
        value: WEEK_DAYS,
      });
      expect(timeEntrySettingsDefaultState.timeZone).toEqual({
        version: '0',
        value: 'America/New_York',
      });
      expect(timeEntrySettingsDefaultState.timeFormat).toEqual({
        version: '0',
        value: 24,
      });
      expect(
        timeEntrySettingsDefaultState.splitTimeSheetAtMidnightEnabled,
      ).toEqual({
        version: '0',
        value: false,
      });
      expect(timeEntrySettingsDefaultState.manageOwnTimeSheetsEnabled).toEqual({
        version: '0',
        value: false,
      });
      expect(timeEntrySettingsDefaultState.editClockOutTimeEnabled).toEqual({
        version: '0',
        value: false,
      });
      expect(timeEntrySettingsDefaultState.clockOutOverrideHours).toEqual({
        version: '0',
        value: 8,
      });
      expect(timeEntrySettingsDefaultState.clockInRoundDirection).toEqual({
        version: '0',
        value: 'NEAREST',
      });
      expect(timeEntrySettingsDefaultState.clockInRoundInMin).toEqual({
        version: '0',
        value: 1,
      });
      expect(timeEntrySettingsDefaultState.clockOutRoundDirection).toEqual({
        version: '0',
        value: 'NEAREST',
      });
      expect(timeEntrySettingsDefaultState.clockOutRoundInMin).toEqual({
        version: '0',
        value: 1,
      });
      expect(
        timeEntrySettingsDefaultState.customersForTimeSheetEnabled,
      ).toEqual({
        version: '0',
        value: true,
      });
      expect(timeEntrySettingsDefaultState.requireBillable).toEqual({
        version: '0',
        value: false,
      });
      expect(timeEntrySettingsDefaultState.classForTimeSheetEnabled).toEqual({
        version: '0',
        value: false,
      });
      expect(timeEntrySettingsDefaultState.locationForTimeSheetEnabled).toEqual(
        {
          version: '0',
          value: false,
        },
      );
      expect(timeEntrySettingsDefaultState.customDimensions).toEqual([]);
      expect(timeEntrySettingsDefaultState.timeSheetEntryNotesEnabled).toEqual({
        version: '0',
        value: false,
      });
      expect(
        timeEntrySettingsDefaultState.timeSheetEntryEditNotesEnabled,
      ).toEqual({
        version: '0',
        value: false,
      });
      expect(
        timeEntrySettingsDefaultState.timeSheetEntryMakesNotesRequiredEnabled,
      ).toEqual({
        version: '0',
        value: false,
      });
      expect(timeEntrySettingsDefaultState.serviceItemRequired).toEqual({
        version: '0',
        value: false,
      });
      expect(timeEntrySettingsDefaultState.classRequired).toEqual({
        version: '0',
        value: false,
      });
      expect(timeEntrySettingsDefaultState.locationRequired).toEqual({
        version: '0',
        value: false,
      });
      expect(timeEntrySettingsDefaultState.locationTracking).toEqual({
        version: '0',
        value: 'OPTIONAL',
      });
      expect(timeEntrySettingsDefaultState.mileageTrackingEnabled).toEqual({
        version: '0',
        value: false,
      });
      expect(timeEntrySettingsDefaultState.mobileTimeTrackingEnabled).toEqual({
        version: '0',
        value: false,
      });
      expect(timeEntrySettingsDefaultState.signatureCaptureEnabled).toEqual({
        version: '0',
        value: false,
      });
      expect(timeEntrySettingsDefaultState.geofenceEnabled).toEqual({
        version: '0',
        value: false,
      });
      expect(timeEntrySettingsDefaultState.geofenceReminderStartTime).toEqual({
        version: '0',
        value: '08:00',
      });
      expect(timeEntrySettingsDefaultState.geofenceReminderEndTime).toEqual({
        version: '0',
        value: '17:00',
      });
      expect(timeEntrySettingsDefaultState.geofenceReminderDaysOfWeek).toEqual({
        version: '0',
        value: WEEK_DAYS,
      });
      expect(
        timeEntrySettingsDefaultState.publishShiftChangePreference,
      ).toEqual({
        version: '0',
        value: '',
      });
    });
  });

  describe('useGetQLSettings hook', () => {
    it('should fetch settings on mount', async () => {
      const mockSettings: TimeTracking_EmployerSettings = {
        timeTrackingEnabled: { meta: { version: '1' }, value: true },
        billingForTimeEnabled: { meta: { version: '2' }, value: true },
        startWorkWeek: {
          meta: { version: '3' },
          value: Common_DayOfWeek.Monday,
        },
        timeTrackingSupported: { meta: { version: '4' }, value: true },
        transactionBillingForTimeEnabled: {
          meta: { version: '5' },
          value: true,
        },
        transactionTimeTrackingEnabled: { meta: { version: '6' }, value: true },
        useItemForTime: { meta: { version: '7' }, value: true },
        billingRateForTimeEnabled: { meta: { version: '8' }, value: true },
      } as TimeTracking_EmployerSettings;

      mockQueryFn.mockResolvedValue({
        data: { timeTrackingEmployerSettings: mockSettings },
        error: null,
      });

      const { result } = renderHookWithQuicksandProvider(
        () => useGetQLSettings(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockQueryFn).toHaveBeenCalledWith({
        variables: {
          input: {
            isExported: false,
          },
        },
        context: {
          clientName: ApolloClientNames.TIME_TRACKING,
          headers: {},
        },
      });
      expect(
        customerInteraction.createCustomerInteraction,
      ).toHaveBeenCalledWith(
        expect.any(Object),
        customerInteraction.TimeCustomerInteraction.EMPLOYER_SETTINGS_GET,
      );
      expect(
        customerInteraction.endInteractionWithSuccess,
      ).toHaveBeenCalledWith(
        expect.any(Object),
        customerInteraction.TimeCustomerInteraction.EMPLOYER_SETTINGS_GET,
      );
      expect(result.current.qlSettings.isServiceFieldEnabled.value).toBe(true);
      expect(result.current.qlSettings.isBillingFieldEnabled.value).toBe(true);
      expect(result.current.qlSettings.firstDayOfWeek.value).toBe(1);
    });

    it('should handle query error', async () => {
      const mockError = new Error('Network error');
      mockQueryFn.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const { result } = renderHookWithQuicksandProvider(
        () => useGetQLSettings(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
      expect(
        customerInteraction.endInteractionWithFailure,
      ).toHaveBeenCalledWith(
        expect.any(Object),
        customerInteraction.TimeCustomerInteraction.EMPLOYER_SETTINGS_GET,
        'Network error',
        mockError,
      );
    });

    it('should refetch settings when refetch is called', async () => {
      const mockSettings: TimeTracking_EmployerSettings = {
        timeTrackingEnabled: { meta: { version: '1' }, value: true },
        billingForTimeEnabled: { meta: { version: '2' }, value: true },
        startWorkWeek: {
          meta: { version: '3' },
          value: Common_DayOfWeek.Monday,
        },
        timeTrackingSupported: { meta: { version: '4' }, value: true },
        transactionBillingForTimeEnabled: {
          meta: { version: '5' },
          value: true,
        },
        transactionTimeTrackingEnabled: { meta: { version: '6' }, value: true },
        useItemForTime: { meta: { version: '7' }, value: true },
        billingRateForTimeEnabled: { meta: { version: '8' }, value: true },
      } as TimeTracking_EmployerSettings;

      mockQueryFn.mockResolvedValue({
        data: { timeTrackingEmployerSettings: mockSettings },
        error: null,
      });

      const { result } = renderHookWithQuicksandProvider(
        () => useGetQLSettings(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Reset mock to verify refetch
      mockQueryFn.mockClear();
      customerInteraction.createCustomerInteraction.mockClear();
      customerInteraction.endInteractionWithSuccess.mockClear();

      // Call refetch
      await act(async () => {
        await result.current.refetch();
      });

      expect(mockQueryFn).toHaveBeenCalledWith({
        variables: {
          input: {
            isExported: false,
          },
        },
        context: {
          clientName: ApolloClientNames.TIME_TRACKING,
          headers: {},
        },
      });
      expect(
        customerInteraction.createCustomerInteraction,
      ).toHaveBeenCalledWith(
        expect.any(Object),
        customerInteraction.TimeCustomerInteraction.EMPLOYER_SETTINGS_GET,
      );
      expect(
        customerInteraction.endInteractionWithSuccess,
      ).toHaveBeenCalledWith(
        expect.any(Object),
        customerInteraction.TimeCustomerInteraction.EMPLOYER_SETTINGS_GET,
      );
    });

    it('should handle loading state correctly', async () => {
      let resolveQuery: (value: any) => void;
      const queryPromise = new Promise((resolve) => {
        resolveQuery = resolve;
      });

      mockQueryFn.mockReturnValue(queryPromise);

      const { result } = renderHookWithQuicksandProvider(
        () => useGetQLSettings(),
        sandbox,
      );

      // Should be loading initially
      expect(result.current.loading).toBe(true);

      // Resolve the query
      resolveQuery!({
        data: { timeTrackingEmployerSettings: {} },
        error: null,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle error state correctly', async () => {
      const mockError = new Error('Test error');
      mockQueryFn.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const { result } = renderHookWithQuicksandProvider(
        () => useGetQLSettings(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Test error');
      expect(result.current.qlSettings).toEqual(timeEntrySettingsDefaultState);
    });

    it('should handle null error gracefully', async () => {
      mockQueryFn.mockResolvedValue({
        data: null,
        error: null,
      });

      const { result } = renderHookWithQuicksandProvider(
        () => useGetQLSettings(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('');
      expect(
        customerInteraction.endInteractionWithFailure,
      ).not.toHaveBeenCalled();
    });

    it('should handle error without message gracefully', async () => {
      const mockError = { message: undefined };
      mockQueryFn.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const { result } = renderHookWithQuicksandProvider(
        () => useGetQLSettings(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe(undefined);
      expect(
        customerInteraction.endInteractionWithFailure,
      ).toHaveBeenCalledWith(
        expect.any(Object),
        customerInteraction.TimeCustomerInteraction.EMPLOYER_SETTINGS_GET,
        undefined,
        mockError,
      );
    });
  });
});
