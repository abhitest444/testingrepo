import { TIME_ENTRY_SETTINGS_TRACKING_POINTS } from 'src/js/widgets/timeTrackingSettings/timeEntrySettingsTrackingPoints';

describe('Time Entry Settings Tracking Points', () => {
  describe('TIME_ENTRY_SETTINGS_TRACKING_POINTS structure', () => {
    it('should have valid tracking point structure for all fields', () => {
      Object.entries(TIME_ENTRY_SETTINGS_TRACKING_POINTS).forEach(
        ([key, point]) => {
          expect(point).toHaveProperty('org');
          expect(point).toHaveProperty('purpose');
          expect(point).toHaveProperty('scope');
          expect(point).toHaveProperty('scope_area');
          expect(point).toHaveProperty('action');
          expect(point).toHaveProperty('object');
          expect(point).toHaveProperty('ui_action');
          expect(point).toHaveProperty('ui_object');

          // Check types
          expect(typeof point.org).toBe('string');
          expect(typeof point.purpose).toBe('string');
          expect(typeof point.scope).toBe('string');
          expect(typeof point.scope_area).toBe('string');
          expect(typeof point.action).toBe('string');
          expect(typeof point.object).toBe('string');
          expect(typeof point.ui_action).toBe('string');
          expect(typeof point.ui_object).toBe('string');

          // Optional properties
          if (point.screen) {
            expect(typeof point.screen).toBe('string');
          }
          if (point.ui_access_point) {
            expect(typeof point.ui_access_point).toBe('string');
          }
        },
      );
    });

    it('should have correct number of tracking points', () => {
      const keys = Object.keys(TIME_ENTRY_SETTINGS_TRACKING_POINTS);
      // Update count based on actual number of tracking points
      expect(keys.length).toBeGreaterThan(45);
    });

    it('should have most tracking points with account-settings-time screen', () => {
      let accountSettingsCount = 0;
      Object.values(TIME_ENTRY_SETTINGS_TRACKING_POINTS).forEach((point) => {
        if (point.screen === 'account-settings-time') {
          accountSettingsCount += 1;
        }
      });
      // Most points should have account-settings-time as screen
      expect(accountSettingsCount).toBeGreaterThan(40);
    });
  });

  describe('Core tracking points', () => {
    it('should have ON_MOUNT tracking point', () => {
      expect(TIME_ENTRY_SETTINGS_TRACKING_POINTS).toHaveProperty('ON_MOUNT');
      expect(TIME_ENTRY_SETTINGS_TRACKING_POINTS.ON_MOUNT.action).toBe(
        'navigated',
      );
      expect(TIME_ENTRY_SETTINGS_TRACKING_POINTS.ON_MOUNT.ui_action).toBe(
        'viewed',
      );
      expect(TIME_ENTRY_SETTINGS_TRACKING_POINTS.ON_MOUNT.object_detail).toBe(
        'view_time_entry_settings',
      );
    });

    it('should have TIME_TRACKING_SECTION_SAVE tracking point', () => {
      expect(TIME_ENTRY_SETTINGS_TRACKING_POINTS).toHaveProperty(
        'TIME_TRACKING_SECTION_SAVE',
      );
      expect(
        TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIME_TRACKING_SECTION_SAVE
          .ui_action,
      ).toBe('clicked');
      expect(
        TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIME_TRACKING_SECTION_SAVE
          .ui_object,
      ).toBe('button');
    });

    it('should have TIME_TRACKING_SECTION_EDIT tracking point', () => {
      expect(TIME_ENTRY_SETTINGS_TRACKING_POINTS).toHaveProperty(
        'TIME_TRACKING_SECTION_EDIT',
      );
    });
  });

  describe('Timesheet fields tracking points', () => {
    it('should have all timesheet fields tracking points', () => {
      const timesheetFields = [
        'TIMESHEET_FIELDS_SECTION_SAVE',
        'TIMESHEET_FIELDS_SECTION_EDIT',
        'TIMESHEET_FIELDS_CUSTOMERS_AND_SUBCUSTOMERS',
        'TIMESHEET_FIELDS_CUSTOMERS_AND_SUBCUSTOMERS_REQUIRED',
        'TIMESHEET_FIELDS_SERVICE_ITEM',
        'TIME_SHEET_FIELD_SERVICE_ITEM_REQUIRED',
        'TIMESHEET_FIELDS_BILLABLE',
        'TIMESHEET_FIELDS_RATE_PER_HOUR',
        'TIMESHEET_FIELDS_BILLABLE_REQUIRED',
        'TIMESHEET_FIELDS_CLASS',
        'TIMESHEET_FIELDS_CLASS_REQUIRED',
        'TIMESHEET_FIELDS_LOCATION',
        'TIMESHEET_FIELDS_LOCATION_REQUIRED',
        'TIMESHEET_FIELDS_NOTES',
        'TIMESHEET_FIELDS_MAKE_NOTES_REQUIRED',
        'TIMESHEET_FIELDS_EDIT_NOTES',
      ];

      timesheetFields.forEach((field) => {
        expect(TIME_ENTRY_SETTINGS_TRACKING_POINTS).toHaveProperty(field);
      });
    });

    it('should have correct ui_object types for required field toggles', () => {
      expect(
        TIME_ENTRY_SETTINGS_TRACKING_POINTS
          .TIMESHEET_FIELDS_CUSTOMERS_AND_SUBCUSTOMERS_REQUIRED.ui_object,
      ).toBe('toggle');
      expect(
        TIME_ENTRY_SETTINGS_TRACKING_POINTS
          .TIME_SHEET_FIELD_SERVICE_ITEM_REQUIRED.ui_object,
      ).toBe('toggle');
      expect(
        TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_FIELDS_CLASS_REQUIRED
          .ui_object,
      ).toBe('toggle');
    });
  });

  describe('Timesheet management tracking points', () => {
    it('should have all timesheet management tracking points', () => {
      const managementFields = [
        'TIMESHEET_MANAGEMENT_FIRST_DAY_OF_WEEK',
        'TIMESHEET_MANAGEMENT_TIME_ZONE',
        'TIMESHEET_MANAGEMENT_TIME_FORMAT',
        'TIMESHEET_MANAGEMENT_SPLIT_AT_MIDNIGHT',
        'TIMESHEET_MANAGEMENT_EDIT_OWN_TIMESHEET',
        'TIMESHEET_MANAGEMENT_MOBILE_TIME_TRACKING',
        'TIMESHEET_MANAGEMENT_SIGNATURE_CAPTURE',
        'TIMESHEET_MANAGEMENT_EDIT_CLOCKOUT_OVERRIDE_HOURS',
        'TIMESHEET_MANAGEMENT_EDIT_CLOCKOUT_OVERRIDE_ENABLED',
        'TIMESHEET_MANAGEMENT_CLOCK_IN_DIRECTION',
        'TIMESHEET_MANAGEMENT_CLOCK_OUT_DIRECTION',
        'TIMESHEET_MANAGEMENT_CLOCK_IN_INCREMENT',
        'TIMESHEET_MANAGEMENT_CLOCK_OUT_INCREMENT',
      ];

      managementFields.forEach((field) => {
        expect(TIME_ENTRY_SETTINGS_TRACKING_POINTS).toHaveProperty(field);
      });
    });

    it('should have correct ui_object types for dropdowns', () => {
      expect(
        TIME_ENTRY_SETTINGS_TRACKING_POINTS
          .TIMESHEET_MANAGEMENT_FIRST_DAY_OF_WEEK.ui_object,
      ).toBe('dropdown');
      expect(
        TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_MANAGEMENT_TIME_ZONE
          .ui_object,
      ).toBe('dropdown');
    });

    it('should have correct ui_object types for checkboxes', () => {
      expect(
        TIME_ENTRY_SETTINGS_TRACKING_POINTS
          .TIMESHEET_MANAGEMENT_SPLIT_AT_MIDNIGHT.ui_object,
      ).toBe('checkbox');
      expect(
        TIME_ENTRY_SETTINGS_TRACKING_POINTS
          .TIMESHEET_MANAGEMENT_EDIT_OWN_TIMESHEET.ui_object,
      ).toBe('checkbox');
      expect(
        TIME_ENTRY_SETTINGS_TRACKING_POINTS
          .TIMESHEET_MANAGEMENT_MOBILE_TIME_TRACKING.ui_object,
      ).toBe('checkbox');
      expect(
        TIME_ENTRY_SETTINGS_TRACKING_POINTS
          .TIMESHEET_MANAGEMENT_SIGNATURE_CAPTURE.ui_object,
      ).toBe('checkbox');
    });

    it('should have correct properties for mobile time tracking', () => {
      const mobileTracking =
        TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_MANAGEMENT_MOBILE_TIME_TRACKING;

      expect(mobileTracking.org).toBe('sbseg');
      expect(mobileTracking.purpose).toBe('prod');
      expect(mobileTracking.scope).toBe('time');
      expect(mobileTracking.scope_area).toBe('time-tracking');
      expect(mobileTracking.action).toBe('engaged');
      expect(mobileTracking.object).toBe('widget');
      expect(mobileTracking.ui_action).toBe(''); // enabled | disabled
      expect(mobileTracking.ui_object).toBe('checkbox');
    });

    it('should have correct properties for signature capture', () => {
      const signatureCapture =
        TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_MANAGEMENT_SIGNATURE_CAPTURE;

      expect(signatureCapture.org).toBe('sbseg');
      expect(signatureCapture.purpose).toBe('prod');
      expect(signatureCapture.scope).toBe('time');
      expect(signatureCapture.scope_area).toBe('time-tracking');
      expect(signatureCapture.action).toBe('engaged');
      expect(signatureCapture.object).toBe('widget');
      expect(signatureCapture.ui_action).toBe(''); // enabled | disabled
      expect(signatureCapture.ui_object).toBe('checkbox');
    });
  });

  describe('Notification tracking points', () => {
    it('should have all notification tracking points', () => {
      const notificationFields = [
        'NOTIFICATION_SECTION_SAVE',
        'NOTIFICATION_SECTION_EDIT',
        'NOTIFICATION_CLOCK_IN_EMAIL',
        'NOTIFICATION_CLOCK_OUT_EMAIL',
        'NOTIFICATION_CLOCK_IN_MOBILE',
        'NOTIFICATION_CLOCK_OUT_MOBILE',
        'NOTIFICATION_NOTES_ADJUSTED',
        'NOTIFICATION_CLOCK_IN_OUT_ADJUSTED',
        'NOTIFICATION_DAYS_OF_WEEK',
        'NOTIFICATION_CLOCK_IN_REMINDER_TIME',
        'NOTIFICATION_CLOCK_OUT_REMINDER_TIME',
      ];

      notificationFields.forEach((field) => {
        expect(TIME_ENTRY_SETTINGS_TRACKING_POINTS).toHaveProperty(field);
      });
    });
  });

  describe('Geo-location tracking points', () => {
    it('should have all geo-location tracking points', () => {
      const geoLocationFields = [
        'GEO_LOCATIONS_SECTION_SAVE',
        'GEO_LOCATIONS_SECTION_EDIT',
        'GEO_LOCATIONS_TROWSER_VIEWED',
        'GEO_LOCATIONS_SECTION_CANCEL',
        'GEO_LOCATIONS_CARD_REQUIRED_CLICKED',
        'GEO_LOCATIONS_CARD_OPTIONAL_CLICKED',
        'GEO_LOCATIONS_CARD_NEVER_CLICKED',
        'GEO_LOCATIONS_MODAL_SAVE_CLICKED',
        'GEO_LOCATIONS_MODAL_DONT_SAVE_CLICKED',
      ];

      geoLocationFields.forEach((field) => {
        expect(TIME_ENTRY_SETTINGS_TRACKING_POINTS).toHaveProperty(field);
      });
    });

    it('should have correct ui_object for geo-location cards', () => {
      expect(
        TIME_ENTRY_SETTINGS_TRACKING_POINTS.GEO_LOCATIONS_CARD_REQUIRED_CLICKED
          .ui_object,
      ).toBe('card');
      expect(
        TIME_ENTRY_SETTINGS_TRACKING_POINTS.GEO_LOCATIONS_CARD_OPTIONAL_CLICKED
          .ui_object,
      ).toBe('card');
    });
  });

  describe('Mileage tracking toggle', () => {
    it('should have MILEAGE_TRACKING_TOGGLE tracking point', () => {
      expect(TIME_ENTRY_SETTINGS_TRACKING_POINTS).toHaveProperty(
        'MILEAGE_TRACKING_TOGGLE',
      );
    });

    it('should have correct properties for mileage tracking toggle', () => {
      const mileageToggle =
        TIME_ENTRY_SETTINGS_TRACKING_POINTS.MILEAGE_TRACKING_TOGGLE;

      expect(mileageToggle.org).toBe('sbseg');
      expect(mileageToggle.purpose).toBe('prod');
      expect(mileageToggle.scope).toBe('qbtime');
      expect(mileageToggle.scope_area).toBe('time-tracking');
      expect(mileageToggle.action).toBe('engaged');
      expect(mileageToggle.object).toBe('widget');
      expect(mileageToggle.object_detail).toBe('mileage_toggle');
      expect(mileageToggle.ui_action).toBe(''); // enabled | disabled
      expect(mileageToggle.ui_object).toBe('switch');
      expect(mileageToggle.ui_object_detail).toBe('mileage_tracking');
    });
  });

  describe('Custom fields tracking points', () => {
    it('should have all custom fields tracking points', () => {
      const customFieldsFields = [
        'CUSTOM_FIELDS_SECTION',
        'MANAGE_ALL_CUSTOM_FIELDS',
        'CUSTOM_FIELD_EDIT',
      ];

      customFieldsFields.forEach((field) => {
        expect(TIME_ENTRY_SETTINGS_TRACKING_POINTS).toHaveProperty(field);
      });
    });

    it('should have MANAGE_ALL_CUSTOM_FIELDS with correct screen', () => {
      expect(
        TIME_ENTRY_SETTINGS_TRACKING_POINTS.MANAGE_ALL_CUSTOM_FIELDS.screen,
      ).toBe('custom_fields_page');
      expect(
        TIME_ENTRY_SETTINGS_TRACKING_POINTS.MANAGE_ALL_CUSTOM_FIELDS.scope_area,
      ).toBe('custom-field');
    });
  });

  describe('Cancel buttons tracking points', () => {
    it('should have all cancel button tracking points', () => {
      const cancelFields = [
        'TIME_TRACKING_SECTION_CANCEL',
        'TIMESHEET_FIELDS_SECTION_CANCEL',
        'NOTIFICATION_SECTION_CANCEL',
        'GEO_LOCATIONS_SECTION_CANCEL',
      ];

      cancelFields.forEach((field) => {
        expect(TIME_ENTRY_SETTINGS_TRACKING_POINTS).toHaveProperty(field);
      });
    });

    it('should have correct ui_object for all cancel buttons', () => {
      expect(
        TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIME_TRACKING_SECTION_CANCEL
          .ui_object,
      ).toBe('button');
      expect(
        TIME_ENTRY_SETTINGS_TRACKING_POINTS.TIMESHEET_FIELDS_SECTION_CANCEL
          .ui_object,
      ).toBe('button');
    });
  });

  describe('Confirmation modal tracking point', () => {
    it('should have CONFIRMATION_MODAL_SAVE tracking point', () => {
      expect(TIME_ENTRY_SETTINGS_TRACKING_POINTS).toHaveProperty(
        'CONFIRMATION_MODAL_SAVE',
      );
    });

    it('should have correct properties for confirmation modal', () => {
      const confirmationModal =
        TIME_ENTRY_SETTINGS_TRACKING_POINTS.CONFIRMATION_MODAL_SAVE;

      expect(confirmationModal.screen).toBe('single_time_entry');
      expect(confirmationModal.scope_area).toBe('timeentrymanagement');
      expect(confirmationModal.ui_access_point).toBe('modal');
    });
  });
});
