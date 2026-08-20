import {
  GENERAL_VIEW_FORM_CONFIG,
  TIME_TRACKING_FORM_CONFIG,
  TIMESHEET_SETTINGS_FIELDS,
} from '../../../../../src/js/widgets/timeTrackingSettings/common/viewForm';

describe('Time Tracking Settings View Form', () => {
  describe('GENERAL_VIEW_FORM_CONFIG', () => {
    it('should have correct structure for general section', () => {
      const generalSection =
        GENERAL_VIEW_FORM_CONFIG['time-settings.section.title.general'];
      expect(generalSection).toBeDefined();
      expect(generalSection[0].id).toBe('timeTrackingGeneral');
      expect(generalSection[0].key).toBe('generalTracking');
      expect(generalSection[0].title).toBe(
        'location-settings.fields.general-settings',
      );
      expect(generalSection[0].ariaLabel).toBe('');
      expect(generalSection[0].tooltipText).toBe('');
      expect(generalSection[0].detail).toEqual({
        title: '',
        subtitle: '',
        ariaLabel: '',
      });
      expect(generalSection[0].disabled).toBe(false);
      expect(generalSection[0].value).toBe('');
      expect(generalSection[0].subFields).toEqual([]);
    });

    it('should have correct structure for timesheet section', () => {
      const timesheetSection =
        GENERAL_VIEW_FORM_CONFIG['time-settings.section.title.timesheet'];
      expect(timesheetSection).toBeDefined();
      expect(timesheetSection).toHaveLength(2);

      // Test first entry (Service)
      expect(timesheetSection[0].id).toBe('timeTrackingTimeSheetService');
      expect(timesheetSection[0].key).toBe('timesheetTrackingService');
      expect(timesheetSection[0].title).toBe(
        'location-settings.fields.timesheet-settings-service',
      );
      expect(timesheetSection[0].ariaLabel).toBe('');
      expect(timesheetSection[0].tooltipText).toBe('');
      expect(timesheetSection[0].detail).toEqual({
        title: '',
        subtitle: '',
        ariaLabel: '',
      });
      expect(timesheetSection[0].disabled).toBe(false);
      expect(timesheetSection[0].value).toBe('');
      expect(timesheetSection[0].subFields).toEqual([]);

      // Test second entry (Billable)
      expect(timesheetSection[1].id).toBe('timeTrackingTimeSheetBillable');
      expect(timesheetSection[1].key).toBe('timesheetTrackingBillable');
      expect(timesheetSection[1].title).toBe(
        'location-settings.fields.timesheet-settings-billable',
      );
    });
  });

  describe('TIME_TRACKING_FORM_CONFIG', () => {
    describe('time-tracking section', () => {
      const timeTrackingSection =
        TIME_TRACKING_FORM_CONFIG['time-entries.section.title.time-tracking'];

      it('should have correct structure for time tracking management', () => {
        const managementField = timeTrackingSection[0];
        expect(managementField.id).toBe('timeEntriesTimeTrackingManagement');
        expect(managementField.key).toBe('timeEntryTimeTrackingManagement');
        expect(managementField.title).toBe(
          'time-entries.section.title.time-management',
        );
        expect(managementField.isEditable).toBe(false);
      });

      it('should have correct structure for first day of week', () => {
        const firstDayField = timeTrackingSection[1];
        expect(firstDayField.id).toBe('timeEntriesFirstDayOfWeek');
        expect(firstDayField.key).toBe('firstDayOfWeek');
        expect(firstDayField.title).toBe(
          'location-settings.fields.general-settings',
        );
        expect(firstDayField.isEditable).toBe(true);
      });

      it('should have correct structure for time zone', () => {
        const timeZoneField = timeTrackingSection[2];
        expect(timeZoneField.id).toBe('timeEntriesTimeZone');
        expect(timeZoneField.key).toBe('timeZone');
        expect(timeZoneField.title).toBe(
          'time-entries.section.title.time-management.time-zone',
        );
        expect(timeZoneField.isEditable).toBe(true);
      });

      it('should have correct structure for split timesheets at midnight', () => {
        const splitField = timeTrackingSection[3];
        expect(splitField.id).toBe('timeEntriesSplitTimesheetsAtMidnight');
        expect(splitField.key).toBe('splitTimeSheetAtMidnightEnabled');
        expect(splitField.title).toBe(
          'time-entries.section.title.time-management.split-time-sheet',
        );
        expect(splitField.isEditable).toBe(true);
      });

      it('should have correct structure for team member timesheet permissions', () => {
        const teamMemberField = timeTrackingSection[4];
        expect(teamMemberField.id).toBe(
          'timeEntriesAllowTeamMemberToAddAndEditTimeSheets',
        );
        expect(teamMemberField.key).toBe('manageOwnTimeSheetsEnabled');
        expect(teamMemberField.title).toBe(
          'time-entries.section.title.time-management.allow-team-member-to-add-and-edit-time-sheet',
        );
        expect(teamMemberField.isEditable).toBe(true);
      });

      it('should have correct structure for mobile time tracking', () => {
        const mobileTrackingField = timeTrackingSection[5];
        expect(mobileTrackingField.id).toBe(
          'timeEntriesMobileTimeTrackingEnabled',
        );
        expect(mobileTrackingField.key).toBe('mobileTimeTrackingEnabled');
        expect(mobileTrackingField.title).toBe(
          'time-entries.section.title.time-management.allow-team-member-to-track-time-on-mobile',
        );
        expect(mobileTrackingField.isEditable).toBe(true);
      });

      it('should have correct structure for signature capture', () => {
        const signatureCaptureField = timeTrackingSection[6];
        expect(signatureCaptureField.id).toBe(
          'timeEntriesSignatureCaptureEnabled',
        );
        expect(signatureCaptureField.key).toBe('signatureCaptureEnabled');
        expect(signatureCaptureField.title).toBe(
          'time-entries.section.title.time-management.capture-signatures-for-timesheets',
        );
        expect(signatureCaptureField.isEditable).toBe(true);
      });

      it('should have correct structure for clock out time editing', () => {
        const clockOutField = timeTrackingSection[7];
        expect(clockOutField.id).toBe(
          'timeEntriesAllowTeamMemberToEditClockOutTime',
        );
        expect(clockOutField.key).toBe('editClockOutTimeEnabled');
        expect(clockOutField.title).toBe(
          'time-entries.section.title.time-management.allow-team-member-to-edit-clock-out-time',
        );
        expect(clockOutField.isEditable).toBe(true);
      });

      it('should have correct structure for timesheet rounding', () => {
        const roundingField = timeTrackingSection[8];
        expect(roundingField.id).toBe('timeEntriesTimesheetRounding');
        expect(roundingField.key).toBe('timesheetRounding');
        expect(roundingField.title).toBe(
          'time-entries.section.title.timesheet-rounding',
        );
        expect(roundingField.isEditable).toBe(false);
      });

      it('should have correct structure for round clock in times', () => {
        const roundClockInField = timeTrackingSection[9];
        expect(roundClockInField.id).toBe('timeEntriesRoundClockInTimes');
        expect(roundClockInField.key).toBe('roundClockInTime');
        expect(roundClockInField.title).toBe(
          'time-entries.section.title.timesheet-rounding.round-clock-in-times',
        );
        expect(roundClockInField.isEditable).toBe(true);
      });

      it('should have correct structure for round clock out times', () => {
        const roundClockOutField = timeTrackingSection[10];
        expect(roundClockOutField.id).toBe('timeEntriesRoundClockOutTimes');
        expect(roundClockOutField.key).toBe('roundClockOutTime');
        expect(roundClockOutField.title).toBe(
          'time-entries.section.title.timesheet-rounding.round-clock-out-times',
        );
        expect(roundClockOutField.isEditable).toBe(true);
      });
    });

    describe('time-sheet section', () => {
      const timeSheetSection =
        TIME_TRACKING_FORM_CONFIG['time-entries.section.title.time-sheet'];

      it('should have correct structure for team tracking configuration', () => {
        const teamTrackField = timeSheetSection[0];
        expect(teamTrackField.id).toBe('timeSheetConfigureWhatYourTeamTrack');
        expect(teamTrackField.key).toBe('configureWhatYourTeamTrack');
        expect(teamTrackField.title).toBe(
          'time-entries.section.title.time-sheet.configure-what-your-team-track',
        );
        expect(teamTrackField.isEditable).toBe(true);
      });
    });

    describe('notifications section', () => {
      const notificationsSection =
        TIME_TRACKING_FORM_CONFIG['time-entries.section.title.notifications'];

      it('should have correct structure for notification management', () => {
        const managementField = notificationsSection[0];
        expect(managementField.id).toBe(
          'notificationTimeEntriesNotificationManagement',
        );
        expect(managementField.key).toBe(
          'notificationTimeEntriesNotificationManagement',
        );
        expect(managementField.title).toBe(
          'time-entries.section.title.time-tracking',
        );
        expect(managementField.isEditable).toBe(false);
      });

      it('should have correct structure for clock in reminders', () => {
        const clockInField = notificationsSection[1];
        expect(clockInField.id).toBe('timeEntriesSendClockInReminders');
        expect(clockInField.key).toBe('sendClockInNotificationReminders');
        expect(clockInField.title).toBe(
          'time-entries.section.title.notifications.time-tracking.send-clock-in-reminders',
        );
        expect(clockInField.isEditable).toBe(true);
      });

      it('should have correct structure for clock out reminders', () => {
        const clockOutField = notificationsSection[2];
        expect(clockOutField.id).toBe('timeEntriesSendClockOutReminders');
        expect(clockOutField.key).toBe('sendClockOutNotificationReminders');
        expect(clockOutField.title).toBe(
          'time-entries.section.title.notifications.time-tracking.send-clock-out-reminders',
        );
        expect(clockOutField.isEditable).toBe(true);
      });

      it('should have correct structure for reminder days', () => {
        const daysField = notificationsSection[3];
        expect(daysField.id).toBe('daysRemindersAreSend');
        expect(daysField.key).toBe('notificationEnabledForDays');
        expect(daysField.title).toBe(
          'time-entries.section.title.notifications.time-tracking.days-reminders-are-sent',
        );
        expect(daysField.isEditable).toBe(true);
      });

      it('should have correct structure for clock in/out update notifications', () => {
        const updateField = notificationsSection[4];
        expect(updateField.id).toBe('notifyWhenClockInOutUpdated');
        expect(updateField.key).toBe('notifyWhenClockInOutUpdated');
        expect(updateField.title).toBe(
          'time-entries.section.title.notifications.time-tracking.notify-when-clock-in-out-is-adjusted',
        );
        expect(updateField.isEditable).toBe(true);
      });

      it('should have correct structure for notes update notifications', () => {
        const notesField = notificationsSection[5];
        expect(notesField.id).toBe('notifyWhenNotesAreAddedOrEdited');
        expect(notesField.key).toBe('notifyWhenNotesAreAddedOrEdited');
        expect(notesField.title).toBe(
          'time-entries.section.title.notifications.time-tracking.notify-when-notes-are-added-or-edited',
        );
        expect(notesField.isEditable).toBe(true);
      });

      it('should include schedule notifications block before approvals', () => {
        const scheduleHeader = notificationsSection[6];
        expect(scheduleHeader.key).toBe('scheduleSectionHeader');
        expect(scheduleHeader.isEditable).toBe(false);
        expect(scheduleHeader.title).toBe(
          'time-entries.section.title.notifications.schedule',
        );

        expect(notificationsSection[7].key).toBe('shiftPublishedSendMode');
        expect(notificationsSection[8].key).toBe('scheduleOneHourBeforeShift');
        expect(notificationsSection[9].key).toBe(
          'scheduleForgotClockInAfterShiftStarted',
        );
        expect(notificationsSection[10].key).toBe(
          'scheduleForgotClockInAfterShiftEnded',
        );
        expect(notificationsSection[11].key).toBe(
          'scheduleLateClockInNotifyManager',
        );

        expect(notificationsSection[12].key).toBe('approvalsSectionHeader');
      });
    });
  });

  describe('TIMESHEET_SETTINGS_FIELDS', () => {
    it('should have correct structure for customers field', () => {
      const customersField = TIMESHEET_SETTINGS_FIELDS.find(
        (field) => field.id === 'shareCustomers',
      );
      expect(customersField).toBeDefined();
      expect(customersField?.key).toBe('customersForTimeSheetEnabled');
      expect(customersField?.title).toBe(
        'time-entries.section.title.time-sheet.customer-and-sub-customer',
      );
      expect(customersField?.disabled).toBe(true);
      expect(customersField?.value).toBe(false);
      expect(customersField?.detail).toEqual({
        title:
          'time-entries.section.title.time-sheet.mobile-preview.item.customers.title',
        subtitle:
          'time-entries.section.title.time-sheet.mobile-preview.item.customers.subtitle',
        ariaLabel: '',
      });
    });

    it('should have correct structure for billable field with subfields', () => {
      const billableField = TIMESHEET_SETTINGS_FIELDS.find(
        (field) => field.id === 'showBillable',
      );
      expect(billableField).toBeDefined();
      expect(billableField?.key).toBe('isBillingFieldEnabled');
      expect(billableField?.title).toBe(
        'time-entries.section.title.time-sheet.billable',
      );
      expect(billableField?.tooltipText).toBe(
        'time-entries.section.title.time-sheet.billable.tool-tip',
      );
      expect(billableField?.disabled).toBe(false);
      expect(billableField?.value).toBe(false);
      expect(billableField?.subFields).toHaveLength(2);

      // Test rate per hour subfield
      const ratePerHourSubfield = billableField?.subFields?.find(
        (subfield) => subfield.id === 'ratePerHour',
      );
      expect(ratePerHourSubfield).toBeDefined();
      expect(ratePerHourSubfield?.key).toBe('billingRateForTimeEnabled');
      expect(ratePerHourSubfield?.title).toBe(
        'time-entries.section.title.time-sheet.billable.rate-per-hour',
      );
      expect(ratePerHourSubfield?.tooltipText).toBe(
        'time-entries.section.title.time-sheet.billable.rate-per-hour.tool-tip',
      );
      expect(ratePerHourSubfield?.disabled).toBe(false);
      expect(ratePerHourSubfield?.value).toBe(false);

      // Test require billable subfield
      const requireBillableSubfield = billableField?.subFields?.find(
        (subfield) => subfield.id === 'requireBillable',
      );
      expect(requireBillableSubfield).toBeDefined();
      expect(requireBillableSubfield?.key).toBe('requireBillable');
      expect(requireBillableSubfield?.title).toBe(
        'time-entries.section.title.time-sheet.billable.require-billable',
      );
      expect(requireBillableSubfield?.disabled).toBe(false);
      expect(requireBillableSubfield?.value).toBe(false);
    });

    it('should have correct structure for service field', () => {
      const serviceField = TIMESHEET_SETTINGS_FIELDS.find(
        (field) => field.id === 'service',
      );
      expect(serviceField).toBeDefined();
      expect(serviceField?.key).toBe('isServiceFieldEnabled');
      expect(serviceField?.title).toBe(
        'time-entries.section.title.time-sheet.service-item',
      );
      expect(serviceField?.disabled).toBe(false);
      expect(serviceField?.value).toBe(false);
    });

    it('should have correct structure for class field', () => {
      const classField = TIMESHEET_SETTINGS_FIELDS.find(
        (field) => field.id === 'class',
      );
      expect(classField).toBeDefined();
      expect(classField?.key).toBe('classForTimeSheetEnabled');
      expect(classField?.title).toBe(
        'time-entries.section.title.time-sheet.class',
      );
      expect(classField?.disabled).toBe(false);
      expect(classField?.value).toBe(false);
    });

    it('should have correct structure for location field', () => {
      const locationField = TIMESHEET_SETTINGS_FIELDS.find(
        (field) => field.id === 'location',
      );
      expect(locationField).toBeDefined();
      expect(locationField?.key).toBe('locationForTimeSheetEnabled');
      expect(locationField?.title).toBe(
        'time-entries.section.title.time-sheet.location',
      );
      expect(locationField?.disabled).toBe(false);
      expect(locationField?.value).toBe(false);
    });

    it('should have correct structure for notes field with subfields', () => {
      const notesField = TIMESHEET_SETTINGS_FIELDS.find(
        (field) => field.id === 'notes',
      );
      expect(notesField).toBeDefined();
      expect(notesField?.key).toBe('timeSheetEntryNotesEnabled');
      expect(notesField?.title).toBe(
        'time-entries.section.title.time-sheet.notes',
      );
      expect(notesField?.disabled).toBe(false);
      expect(notesField?.value).toBe(false);
      expect(notesField?.subFields).toHaveLength(2);

      // Test allow team member to edit notes subfield
      const editNotesSubfield = notesField?.subFields?.find(
        (subfield) => subfield.id === 'allowTeamMemberTOEditExistingNotes',
      );
      expect(editNotesSubfield).not.toBeDefined();
      expect(editNotesSubfield?.key).not.toBeDefined();
      expect(editNotesSubfield?.title).not.toBeDefined();
      expect(editNotesSubfield?.disabled).not.toBeDefined();
      expect(editNotesSubfield?.value).not.toBeDefined();

      // Test require notes subfield
      const requireNotesSubfield = notesField?.subFields?.find(
        (subfield) => subfield.id === 'requireNotes',
      );
      expect(requireNotesSubfield).toBeDefined();
      expect(requireNotesSubfield?.key).toBe(
        'timeSheetEntryMakesNotesRequiredEnabled',
      );
      expect(requireNotesSubfield?.title).toBe(
        'time-entries.section.title.time-sheet.billable.require-notes',
      );
      expect(requireNotesSubfield?.disabled).toBe(false);
      expect(requireNotesSubfield?.value).toBe(false);
    });
  });
});
