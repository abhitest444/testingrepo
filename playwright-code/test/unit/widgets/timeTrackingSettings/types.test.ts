import {
  FieldOption,
  ITimeSheetFieldOption,
  ITimeSheetRequiredFieldOption,
  IFormConfig,
  IIsFieldsVisible,
  ITimeEntriesFormEditing,
  ITimeEntrySettingsFormState,
  ISuccessUpdateCompanySettings,
  combinedApprovalSettings,
} from '../../../../src/js/widgets/timeTrackingSettings/types';
import {
  IconSize,
  MenuButtonPriority,
  MenuButtonPurpose,
  NotificationMedium,
  ScheduleNotificationSendMode,
} from '../../../../src/js/widgets/timeTrackingSettings/constants';
import { TimeTracking_NotificationReminderMedium } from '../../../../src/__generated__/timeTracking/graphql';

describe('TimeTrackingSettings Types', () => {
  describe('FieldOption', () => {
    it('should validate required FieldOption properties', () => {
      const fieldOption: FieldOption = {
        id: 'customer-field',
        key: 'customer',
        title: 'Customer Field',
        ariaLabel: 'Select customer for time entry',
        tooltipText: 'Choose the customer this time entry is for',
        disabled: false,
        detail: {
          title: 'Customer Selection',
          subtitle: 'Select a customer from your list',
          ariaLabel: 'Customer selection details',
        },
        value: 'customer-1',
      };

      expect(fieldOption).toHaveProperty('id');
      expect(fieldOption).toHaveProperty('key');
      expect(fieldOption).toHaveProperty('value');
      expect(fieldOption.detail).toHaveProperty('title');
    });

    it('should handle optional FieldOption properties', () => {
      const fieldOption: FieldOption = {
        id: 'custom-field',
        key: 'custom-rate',
        title: 'Billing Rate',
        ariaLabel: 'Custom billing rate field',
        tooltipText: 'Enter custom billing rate',
        disabled: false,
        detail: {
          title: 'Custom Rate',
          subtitle: 'Enter billing rate per hour',
          ariaLabel: 'Custom rate input',
        },
        value: '150',
        isCustom: true,
        isEditable: true,
        isVisible: true,
        subFields: [
          {
            id: 'currency',
            key: 'currency-type',
            title: 'Currency',
            ariaLabel: 'Select currency',
            tooltipText: 'Select billing currency',
            disabled: false,
            value: 'USD',
            detail: {
              title: 'Currency Selection',
              subtitle: 'Select billing currency',
              ariaLabel: 'Currency selector',
            },
          },
        ],
      };

      expect(fieldOption.isCustom).toBe(true);
      expect(fieldOption.isEditable).toBe(true);
      expect(fieldOption.isVisible).toBe(true);
      expect(fieldOption.subFields).toHaveLength(1);
    });
  });

  describe('ITimeSheetRequiredFieldOption', () => {
    it('should validate ITimeSheetRequiredFieldOption properties', () => {
      const requiredFieldOption: ITimeSheetRequiredFieldOption = {
        id: 'customer-required',
        key: 'customer-required-field',
        disabled: false,
        value: true,
      };

      expect(requiredFieldOption.id).toBe('customer-required');
      expect(requiredFieldOption.key).toBe('customer-required-field');
      expect(requiredFieldOption.disabled).toBe(false);
      expect(typeof requiredFieldOption.value).toBe('boolean');
    });

    it('should handle disabled state', () => {
      const requiredFieldOption: ITimeSheetRequiredFieldOption = {
        id: 'service-required',
        key: 'service-required-field',
        disabled: true,
        value: false,
      };

      expect(requiredFieldOption.disabled).toBe(true);
      expect(requiredFieldOption.value).toBe(false);
    });
  });

  describe('ITimeSheetFieldOption', () => {
    it('should validate ITimeSheetFieldOption with boolean value', () => {
      const timeSheetFieldOption: ITimeSheetFieldOption = {
        id: 'billable-field',
        key: 'is-billable',
        title: 'Billable Time',
        ariaLabel: 'Mark time as billable',
        tooltipText: 'Toggle whether this time entry is billable',
        disabled: false,
        value: true,
        detail: {
          title: 'Billable Status',
          subtitle: 'Mark if the time should be billed to customer',
          ariaLabel: 'Billable time toggle',
        },
        automationId: 'billable-field-toggle',
      };

      expect(typeof timeSheetFieldOption.value).toBe('boolean');
      expect(timeSheetFieldOption.disabled).toBe(false);
      expect(timeSheetFieldOption.automationId).toBe('billable-field-toggle');
    });

    it('should handle nested subFields in ITimeSheetFieldOption', () => {
      const timeSheetFieldOption: ITimeSheetFieldOption = {
        id: 'location',
        key: 'work-location',
        title: 'Work Location',
        ariaLabel: 'Select work location',
        tooltipText: 'Choose where the work was performed',
        disabled: false,
        value: false,
        detail: {
          title: 'Location Details',
          subtitle: 'Specify work location details',
          ariaLabel: 'Location selection',
        },
        subFields: [
          {
            id: 'remote',
            key: 'is-remote',
            title: 'Remote Work',
            ariaLabel: 'Remote work selection',
            tooltipText: 'Select if work was done remotely',
            disabled: false,
            value: true,
            detail: {
              title: 'Remote Status',
              subtitle: 'Indicate if work was remote',
              ariaLabel: 'Remote work indicator',
            },
          },
        ],
      };

      expect(timeSheetFieldOption.subFields).toBeDefined();
      expect(timeSheetFieldOption.subFields![0].value).toBe(true);
    });
  });

  describe('IFormConfig', () => {
    it('should validate complex form configuration', () => {
      const formConfig: IFormConfig = {
        timeTracking: [
          {
            id: 'time-format',
            key: 'format',
            title: '24-Hour Format',
            ariaLabel: 'Time format selection',
            tooltipText: 'Choose between 12 or 24 hour format',
            disabled: false,
            value: '24h',
            detail: {
              title: 'Time Format',
              subtitle: 'Select your preferred time format',
              ariaLabel: 'Time format selector',
            },
          },
        ],
        notifications: [
          {
            id: 'email-notify',
            key: 'email',
            title: 'Email Notifications',
            ariaLabel: 'Email notification settings',
            tooltipText: 'Configure email notifications',
            disabled: false,
            value: 'all',
            detail: {
              title: 'Email Settings',
              subtitle: 'Configure when to receive emails',
              ariaLabel: 'Email settings configuration',
            },
          },
        ],
      };

      expect(Object.keys(formConfig)).toContain('timeTracking');
      expect(Object.keys(formConfig)).toContain('notifications');
      expect(formConfig.timeTracking).toHaveLength(1);
      expect(formConfig.notifications).toHaveLength(1);
    });
  });

  describe('ITimeEntrySettingsFormState', () => {
    it('should validate complete form state with all settings', () => {
      const formState: ITimeEntrySettingsFormState = {
        geofenceReminderStartTime: '08:00',
        geofenceReminderEndTime: '17:00',
        geofenceReminderDaysOfWeek: ['MONDAY', 'TUESDAY'],
        clockInNotificationReminderTime: '09:00',
        clockInNotificationReminderEmail: true,
        clockInNotificationReminderMobile: true,
        clockOutNotificationReminderTime: '17:00',
        clockOutNotificationReminderEmail: true,
        clockOutNotificationReminderMobile: true,
        notificationEnabledForDays: ['Monday', 'Wednesday', 'Friday'],
        notifyWhenClockInOutUpdated: 'immediate',
        notifyWhenNotesAreAddedOrEdited: 'daily',
        shiftPublishedSendMode: ScheduleNotificationSendMode.ALWAYS_SEND,
        scheduleShiftPublished: [TimeTracking_NotificationReminderMedium.Email],
        scheduleOneHour: [TimeTracking_NotificationReminderMedium.Email],
        scheduleForgotClockInAfterStarted: [],
        scheduleForgotClockInAfterEnded: [],
        scheduleLateClockInNotifyManagerChannels: [],
        firstDayOfWeek: 'Monday',
        timeZone: 'America/New_York',
        timeFormat: '24h',
        splitTimeSheetAtMidnightEnabled: true,
        manageOwnTimeSheetsEnabled: true,
        mobileTimeTrackingEnabled: false,
        signatureCaptureEnabled: false,
        editClockOutTimeEnabled: true,
        clockOutOverrideHours: '12',
        clockInRoundDirection: 'nearest',
        clockInRoundInMin: 15,
        clockOutRoundDirection: 'up',
        clockOutRoundInMin: 30,
        customersForTimeSheetEnabled: true,
        isBillingFieldEnabled: true,
        billingRateForTimeEnabled: true,
        requireBillable: true,
        isServiceFieldEnabled: true,
        classForTimeSheetEnabled: true,
        locationForTimeSheetEnabled: true,
        timeSheetEntryNotesEnabled: true,
        timeSheetEntryEditNotesEnabled: true,
        timeSheetEntryMakesNotesRequiredEnabled: true,
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

      // Test time-related settings
      expect(formState.clockInNotificationReminderTime).toMatch(
        /^\d{2}:\d{2}$/,
      );
      expect(formState.clockOutNotificationReminderTime).toMatch(
        /^\d{2}:\d{2}$/,
      );

      // Test notification settings
      expect(formState.notificationEnabledForDays).toBeInstanceOf(Array);
      expect(formState.notifyWhenClockInOutUpdated).toBeDefined();

      // Test rounding settings
      expect(formState.clockInRoundInMin).toBeGreaterThan(0);
      expect(formState.clockOutRoundInMin).toBeGreaterThan(0);

      // Test boolean flags
      expect(typeof formState.splitTimeSheetAtMidnightEnabled).toBe('boolean');
      expect(typeof formState.timeSheetEntryMakesNotesRequiredEnabled).toBe(
        'boolean',
      );
    });
  });

  describe('ITimeEntriesFormEditing', () => {
    it('should validate form editing state', () => {
      const editingState: ITimeEntriesFormEditing = {
        isNotificationEditing: true,
        isTimeTrackingEditing: false,
        isTimeSheetFieldsEditing: true,
        isApprovalEditing: false,
        isGeoLocationsEditing: false,
      };

      expect(
        Object.values(editingState).every((val) => typeof val === 'boolean'),
      ).toBe(true);
    });
  });

  describe('IIsFieldsVisible', () => {
    it('should validate fields visibility state', () => {
      const visibilityState: IIsFieldsVisible = {
        notifyWhenClockInOutTimeAdjusted: true,
        notifyWhenNotesAreAddedOrEdited: false,
      };

      expect(
        Object.values(visibilityState).every((val) => typeof val === 'boolean'),
      ).toBe(true);
    });
  });
});
