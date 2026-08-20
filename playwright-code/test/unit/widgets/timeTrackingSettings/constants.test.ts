import {
  TimeEntriesFormType,
  IS_TIME_ENTRIES_FORM_EDITING,
  TIME_TRACKING_SETTINGS,
  TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS,
  CLOCK_ROUNDING_SETTINGS,
  CLOCK_IN_OUT_DIRECTIONS,
  ROUNDING_INCREMENT_CLOCK_IN_OUT,
  TIME_FORMATS,
  NotificationFieldType,
  NotificationMedium,
  NotificationField,
  NotificationRecipient,
  NOTIFY_OPTIONS,
  NOTIFICATION_DAYS_OF_WEEK,
  NotificationFieldKey,
} from 'src/js/widgets/timeTrackingSettings/constants';

describe('Time Tracking Settings Constants', () => {
  describe('TimeEntriesFormType', () => {
    it('should have the correct enum values', () => {
      expect(TimeEntriesFormType.TIMETRACKING).toBe('Timetracking');
      expect(TimeEntriesFormType.TIMESHEET).toBe('Timesheet');
      expect(TimeEntriesFormType.NOTIFICATION).toBe('Notification');
      expect(TimeEntriesFormType.CUSTOM_FIELDS).toBe('CustomFields');
    });
  });

  describe('IS_TIME_ENTRIES_FORM_EDITING', () => {
    it('should have the correct default values', () => {
      expect(IS_TIME_ENTRIES_FORM_EDITING.isNotificationEditing).toBe(false);
      expect(IS_TIME_ENTRIES_FORM_EDITING.isTimeTrackingEditing).toBe(false);
      expect(IS_TIME_ENTRIES_FORM_EDITING.isTimeSheetFieldsEditing).toBe(false);
    });
  });

  describe('TIME_TRACKING_SETTINGS', () => {
    it('should have the correct enum values', () => {
      expect(TIME_TRACKING_SETTINGS.FIRST_DAY_OF_WEEK).toBe('firstDayOfWeek');
      expect(TIME_TRACKING_SETTINGS.TIME_ZONE).toBe('timeZone');
      expect(TIME_TRACKING_SETTINGS.TIME_FORMAT).toBe('timeFormat');
      expect(TIME_TRACKING_SETTINGS.SPLIT_TIME_SHEET_AT_MIDNIGET_ENABLED).toBe(
        'splitTimeSheetAtMidnightEnabled',
      );
      expect(TIME_TRACKING_SETTINGS.MANAGE_OWN_TIME_SHEETS_ENABLED).toBe(
        'manageOwnTimeSheetsEnabled',
      );
      expect(TIME_TRACKING_SETTINGS.EDIT_CLOCK_OUT_TIME_ENABLED).toBe(
        'editClockOutTimeEnabled',
      );
      expect(TIME_TRACKING_SETTINGS.ROUND_CLOCK_IN_TIME).toBe(
        'roundClockInTime',
      );
      expect(TIME_TRACKING_SETTINGS.ROUND_CLOCK_OUT_TIME).toBe(
        'roundClockOutTime',
      );
      expect(TIME_TRACKING_SETTINGS.CLOCK_OUT_OVERRIDE_HOURS).toBe(
        'clockOutOverrideHours',
      );
    });
  });

  describe('TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS', () => {
    it('should have the correct enum values', () => {
      expect(
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_NOTES_ENABLE,
      ).toBe('timeSheetEntryNotesEnabled');
      expect(
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_EDITS_NOTES_ENABLED,
      ).toBe('timeSheetEntryEditNotesEnabled');
      expect(
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_ENTRY_MAKES_NOTES_REQUIRES_ENABLES,
      ).toBe('timeSheetEntryMakesNotesRequiredEnabled');
      expect(
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CUSTOMER_FOR_TIMESHEET_ENABLED,
      ).toBe('customersForTimeSheetEnabled');
      expect(TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES).toBe(
        'classForTimeSheetEnabled',
      );
      expect(
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.LOCATION_FOR_TIMESHEET_ENABLED,
      ).toBe('locationForTimeSheetEnabled');
      expect(
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLOCK_IN_NOTIFICATION_REMINDER_EMAIL,
      ).toBe('clockInNotificationReminderEmail');
      expect(
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
      ).toBe('isBillingFieldEnabled');
      expect(
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.BILLING_RATE_FOR_TIME_ENABLED,
      ).toBe('billingRateForTimeEnabled');
      expect(TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_BILLABLE).toBe(
        'requireBillable',
      );
      expect(TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_SERVICE_ENABLE).toBe(
        'isServiceFieldEnabled',
      );
      expect(TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.USE_ITEM_FOR_TIME).toBe(
        'useItemForTime',
      );
    });
  });

  describe('CLOCK_ROUNDING_SETTINGS', () => {
    it('should have the correct enum values', () => {
      expect(CLOCK_ROUNDING_SETTINGS.CLOCK_IN_ROUND_DIRECTION).toBe(
        'clockInRoundDirection',
      );
      expect(CLOCK_ROUNDING_SETTINGS.CLOCK_IN_ROUND_IN_MINUTE).toBe(
        'clockInRoundInMin',
      );
      expect(CLOCK_ROUNDING_SETTINGS.CLOCK_OUT_ROUND_DIRECTION).toBe(
        'clockOutRoundDirection',
      );
      expect(CLOCK_ROUNDING_SETTINGS.CLOCK_OUT_ROUND_IN_MINUTE).toBe(
        'clockOutRoundInMin',
      );
    });
  });

  describe('CLOCK_IN_OUT_DIRECTIONS', () => {
    it('should have the correct direction values', () => {
      expect(CLOCK_IN_OUT_DIRECTIONS.up).toBe('UP');
      expect(CLOCK_IN_OUT_DIRECTIONS.down).toBe('DOWN');
      expect(CLOCK_IN_OUT_DIRECTIONS.nearest).toBe('NEAREST');
    });
  });

  describe('ROUNDING_INCREMENT_CLOCK_IN_OUT', () => {
    it('should have the correct increment values', () => {
      expect(ROUNDING_INCREMENT_CLOCK_IN_OUT.oneMin).toBe(1);
      expect(ROUNDING_INCREMENT_CLOCK_IN_OUT.threeMin).toBe(3);
      expect(ROUNDING_INCREMENT_CLOCK_IN_OUT.fiveMin).toBe(5);
      expect(ROUNDING_INCREMENT_CLOCK_IN_OUT.sixMin).toBe(6);
      expect(ROUNDING_INCREMENT_CLOCK_IN_OUT.tenMin).toBe(10);
      expect(ROUNDING_INCREMENT_CLOCK_IN_OUT.fifteenMin).toBe(15);
      expect(ROUNDING_INCREMENT_CLOCK_IN_OUT.thirtyMin).toBe(30);
    });
  });

  describe('TIME_FORMATS', () => {
    it('should have the correct format values', () => {
      expect(TIME_FORMATS.twelveHourFormat).toBe(12);
      expect(TIME_FORMATS.twentyFourHourFormat).toBe(24);
    });
  });

  describe('NotificationFieldType', () => {
    it('should have the correct enum values', () => {
      expect(NotificationFieldType.CLOCK_IN).toBe('clockIn');
      expect(NotificationFieldType.CLOCK_OUT).toBe('clockOut');
    });
  });

  describe('NotificationMedium', () => {
    it('should have the correct enum values', () => {
      expect(NotificationMedium.EMAIL).toBe('EMAIL');
      expect(NotificationMedium.PUSH_NOTIFICATION).toBe('PUSH_NOTIFICATION');
    });
  });

  describe('NotificationField', () => {
    it('should have the correct enum values', () => {
      expect(NotificationField.CLOCK_IN_EMAIL).toBe(
        'clockInNotificationReminderEmail',
      );
      expect(NotificationField.CLOCK_IN_MOBILE).toBe(
        'clockInNotificationReminderMobile',
      );
      expect(NotificationField.CLOCK_IN_TIME).toBe(
        'clockInNotificationReminderTime',
      );
      expect(NotificationField.CLOCK_OUT_EMAIL).toBe(
        'clockOutNotificationReminderEmail',
      );
      expect(NotificationField.CLOCK_OUT_MOBILE).toBe(
        'clockOutNotificationReminderMobile',
      );
      expect(NotificationField.CLOCK_OUT_TIME).toBe(
        'clockOutNotificationReminderTime',
      );
    });
  });

  describe('NotificationRecipient', () => {
    it('should have the correct enum values', () => {
      expect(NotificationRecipient.ADMINS_AND_MANAGERS).toBe(
        'adminsAndManagers',
      );
      expect(NotificationRecipient.ADMINS_ONLY).toBe('adminsOnly');
      expect(NotificationRecipient.MANAGERS_ONLY).toBe('managersOnly');
      expect(NotificationRecipient.NONE).toBe('none');
    });
  });

  describe('NOTIFY_OPTIONS', () => {
    it('should contain all notification recipient options', () => {
      expect(NOTIFY_OPTIONS).toEqual([
        'adminsAndManagers',
        'adminsOnly',
        'managersOnly',
        'none',
      ]);
    });
  });

  describe('NOTIFICATION_DAYS_OF_WEEK', () => {
    it('should have the correct day values', () => {
      expect(NOTIFICATION_DAYS_OF_WEEK.sunday).toBe('SUNDAY');
      expect(NOTIFICATION_DAYS_OF_WEEK.monday).toBe('MONDAY');
      expect(NOTIFICATION_DAYS_OF_WEEK.tuesday).toBe('TUESDAY');
      expect(NOTIFICATION_DAYS_OF_WEEK.wednesday).toBe('WEDNESDAY');
      expect(NOTIFICATION_DAYS_OF_WEEK.thursday).toBe('THURSDAY');
      expect(NOTIFICATION_DAYS_OF_WEEK.friday).toBe('FRIDAY');
      expect(NOTIFICATION_DAYS_OF_WEEK.saturday).toBe('SATURDAY');
    });
  });

  describe('NotificationFieldKey', () => {
    it('should have the correct enum values', () => {
      expect(NotificationFieldKey.SEND_CLOCK_IN_NOTIFICATION_REMINDERS).toBe(
        'sendClockInNotificationReminders',
      );
      expect(NotificationFieldKey.SEND_CLOCK_OUT_NOTIFICATION_REMINDERS).toBe(
        'sendClockOutNotificationReminders',
      );
      expect(NotificationFieldKey.NOTIFICATION_ENABLED_FOR_DAYS).toBe(
        'notificationEnabledForDays',
      );
      expect(NotificationFieldKey.NOTIFY_WHEN_CLOCK_IN_OUT_UPDATED).toBe(
        'notifyWhenClockInOutUpdated',
      );
      expect(NotificationFieldKey.NOTIFY_WHEN_NOTES_ARE_ADDED_OR_EDITED).toBe(
        'notifyWhenNotesAreAddedOrEdited',
      );
    });
  });
});
