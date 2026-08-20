import {
  updateTimeSheetField,
  updateTimeTrackingFields,
  updateTimeSheetFields,
  updateNotificationFields,
} from 'src/js/widgets/timeTrackingSettings/hooks/mapTimeTrackingSettings';
import {
  CLOCK_ROUNDING_SETTINGS,
  NotificationField,
  NotificationFieldKey,
  NotificationRecipient,
  TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS,
  TIME_TRACKING_SETTINGS,
} from 'src/js/widgets/timeTrackingSettings/constants';
import {
  IFormConfig,
  IIsFieldsVisible,
  ITimeSheetFieldOption,
} from 'src/js/widgets/timeTrackingSettings/types';
import { MappedQLSettings } from 'src/js/service/hooks/settings/useGetQLSettings';

describe('mapTimeTrackingSettings', () => {
  const mockIntl = {
    formatMessage: ({ id }: { id: string }) => id,
  };

  const mockBaseNotificationFields: IFormConfig = {
    'time-entries.section.title.notifications': [
      {
        key: NotificationFieldKey.SEND_CLOCK_IN_NOTIFICATION_REMINDERS,
        value: '',
        id: 'clockInReminders',
        title: 'Clock In Reminders',
        ariaLabel: 'Clock In Reminders',
        tooltipText: 'Clock In Reminders',
        disabled: false,
        detail: {
          title: 'Clock In Reminders',
          subtitle: 'Clock In Reminders',
          ariaLabel: 'Clock In Reminders',
        },
        isVisible: true,
      },
      {
        key: NotificationFieldKey.SEND_CLOCK_OUT_NOTIFICATION_REMINDERS,
        value: '',
        id: 'clockOutReminders',
        title: 'Clock Out Reminders',
        ariaLabel: 'Clock Out Reminders',
        tooltipText: 'Clock Out Reminders',
        disabled: false,
        detail: {
          title: 'Clock Out Reminders',
          subtitle: 'Clock Out Reminders',
          ariaLabel: 'Clock Out Reminders',
        },
        isVisible: true,
      },
      {
        key: NotificationFieldKey.NOTIFICATION_ENABLED_FOR_DAYS,
        value: '',
        id: 'notificationEnabledDays',
        title: 'Notification Enabled Days',
        ariaLabel: 'Notification Enabled Days',
        tooltipText: 'Notification Enabled Days',
        disabled: false,
        detail: {
          title: 'Notification Enabled Days',
          subtitle: 'Notification Enabled Days',
          ariaLabel: 'Notification Enabled Days',
        },
        isVisible: true,
      },
      {
        key: NotificationFieldKey.NOTIFY_WHEN_CLOCK_IN_OUT_UPDATED,
        value: '',
        id: 'notifyWhenClockInOutUpdated',
        title: 'Notify When Clock In/Out Updated',
        ariaLabel: 'Notify When Clock In/Out Updated',
        tooltipText: 'Notify When Clock In/Out Updated',
        disabled: false,
        detail: {
          title: 'Notify When Clock In/Out Updated',
          subtitle: 'Notify When Clock In/Out Updated',
          ariaLabel: 'Notify When Clock In/Out Updated',
        },
        isVisible: false,
      },
      {
        key: NotificationFieldKey.NOTIFY_WHEN_NOTES_ARE_ADDED_OR_EDITED,
        value: '',
        id: 'notifyWhenNotesAreAddedOrEdited',
        title: 'Notify When Notes Are Added or Edited',
        ariaLabel: 'Notify When Notes Are Added or Edited',
        tooltipText: 'Notify When Notes Are Added or Edited',
        disabled: false,
        detail: {
          title: 'Notify When Notes Are Added or Edited',
          subtitle: 'Notify When Notes Are Added or Edited',
          ariaLabel: 'Notify When Notes Are Added or Edited',
        },
        isVisible: true,
      },
    ],
  };

  const mockIsFieldsVisible: IIsFieldsVisible = {
    notifyWhenClockInOutTimeAdjusted: false,
    notifyWhenNotesAreAddedOrEdited: false,
  };

  const mockIsUKLocale = false;

  describe('updateTimeSheetField', () => {
    it('should update main field value when no subFieldKey is provided', () => {
      const editTimeSheetFields: ITimeSheetFieldOption[] = [
        {
          key: 'testField',
          value: false,
          id: 'testField',
          title: 'Test Field',
          ariaLabel: 'Test Field',
          tooltipText: 'Test Field',
          disabled: false,
          detail: {
            title: 'Test Field',
            subtitle: 'Test Field',
            ariaLabel: 'Test Field',
          },
        },
      ];

      const result = updateTimeSheetField(
        'testField',
        true,
        editTimeSheetFields,
      );
      expect(result[0].value).toBe(true);
    });

    it('should update subfield value when subFieldKey is provided', () => {
      const editTimeSheetFields: ITimeSheetFieldOption[] = [
        {
          key: 'testField',
          value: false,
          id: 'testField',
          title: 'Test Field',
          ariaLabel: 'Test Field',
          tooltipText: 'Test Field',
          disabled: false,
          detail: {
            title: 'Test Field',
            subtitle: 'Test Field',
            ariaLabel: 'Test Field',
          },
          subFields: [
            {
              key: 'subTestField',
              value: false,
              id: 'subTestField',
              title: 'Sub Test Field',
              ariaLabel: 'Sub Test Field',
              tooltipText: 'Sub Test Field',
              disabled: false,
              detail: {
                title: 'Sub Test Field',
                subtitle: 'Sub Test Field',
                ariaLabel: 'Sub Test Field',
              },
            },
          ],
        },
      ];

      const result = updateTimeSheetField(
        'testField',
        true,
        editTimeSheetFields,
        'subTestField',
      );
      expect(result[0].subFields![0].value).toBe(true);
    });

    it('should handle non-existent field keys gracefully', () => {
      const editTimeSheetFields: ITimeSheetFieldOption[] = [
        {
          key: 'testField',
          value: false,
          id: 'testField',
          title: 'Test Field',
          ariaLabel: 'Test Field',
          tooltipText: 'Test Field',
          disabled: false,
          detail: {
            title: 'Test Field',
            subtitle: 'Test Field',
            ariaLabel: 'Test Field',
          },
        },
      ];

      const result = updateTimeSheetField(
        'nonExistentField',
        true,
        editTimeSheetFields,
      );
      expect(result).toEqual(editTimeSheetFields);
    });
  });

  describe('updateTimeTrackingFields', () => {
    const mockSetFormFieldValue = jest.fn();
    const mockSetNotificationFields = jest.fn();
    const mockUpdateVisibleFields = jest.fn();
    const mockTimezoneConversions = [
      { name: 'UTC', longFormName: 'Coordinated Universal Time' },
    ];

    const baseTimeTrackingFields: IFormConfig = {
      'time-tracking.section.title': [
        {
          key: TIME_TRACKING_SETTINGS.FIRST_DAY_OF_WEEK,
          value: '',
          id: 'firstDayOfWeek',
          title: 'First Day of Week',
          ariaLabel: 'First Day of Week',
          tooltipText: 'First Day of Week',
          disabled: false,
          detail: {
            title: 'First Day of Week',
            subtitle: 'First Day of Week',
            ariaLabel: 'First Day of Week',
          },
        },
        {
          key: TIME_TRACKING_SETTINGS.TIME_ZONE,
          value: '',
          id: 'timeZone',
          title: 'Time Zone',
          ariaLabel: 'Time Zone',
          tooltipText: 'Time Zone',
          disabled: false,
          detail: {
            title: 'Time Zone',
            subtitle: 'Time Zone',
            ariaLabel: 'Time Zone',
          },
        },
        {
          key: TIME_TRACKING_SETTINGS.TIME_FORMAT,
          value: '',
          id: 'timeFormat',
          title: 'Time Format',
          ariaLabel: 'Time Format',
          tooltipText: 'Time Format',
          disabled: false,
          detail: {
            title: 'Time Format',
            subtitle: 'Time Format',
            ariaLabel: 'Time Format',
          },
        },
        {
          key: TIME_TRACKING_SETTINGS.EDIT_CLOCK_OUT_TIME_ENABLED,
          value: '',
          id: 'editClockOutTime',
          title: 'Edit Clock Out Time',
          ariaLabel: 'Edit Clock Out Time',
          tooltipText: 'Edit Clock Out Time',
          disabled: false,
          detail: {
            title: 'Edit Clock Out Time',
            subtitle: 'Edit Clock Out Time',
            ariaLabel: 'Edit Clock Out Time',
          },
        },
        {
          key: TIME_TRACKING_SETTINGS.SPLIT_TIME_SHEET_AT_MIDNIGET_ENABLED,
          value: '',
          id: 'splitTimeSheet',
          title: 'Split Time Sheet at Midnight',
          ariaLabel: 'Split Time Sheet at Midnight',
          tooltipText: 'Split Time Sheet at Midnight',
          disabled: false,
          detail: {
            title: 'Split Time Sheet at Midnight',
            subtitle: 'Split Time Sheet at Midnight',
            ariaLabel: 'Split Time Sheet at Midnight',
          },
        },
        {
          key: TIME_TRACKING_SETTINGS.MANAGE_OWN_TIME_SHEETS_ENABLED,
          value: '',
          id: 'manageOwnTimeSheets',
          title: 'Manage Own Time Sheets',
          ariaLabel: 'Manage Own Time Sheets',
          tooltipText: 'Manage Own Time Sheets',
          disabled: false,
          detail: {
            title: 'Manage Own Time Sheets',
            subtitle: 'Manage Own Time Sheets',
            ariaLabel: 'Manage Own Time Sheets',
          },
        },
        {
          key: TIME_TRACKING_SETTINGS.MOBILE_TIME_TRACKING_ENABLED,
          value: '',
          id: 'mobileTimeTracking',
          title: 'Mobile Time Tracking',
          ariaLabel: 'Mobile Time Tracking',
          tooltipText: 'Mobile Time Tracking',
          disabled: false,
          detail: {
            title: 'Mobile Time Tracking',
            subtitle: 'Mobile Time Tracking',
            ariaLabel: 'Mobile Time Tracking',
          },
        },
        {
          key: TIME_TRACKING_SETTINGS.SIGNATURE_CAPTURE_ENABLED,
          value: '',
          id: 'signatureCapture',
          title: 'Signature Capture',
          ariaLabel: 'Signature Capture',
          tooltipText: 'Signature Capture',
          disabled: false,
          detail: {
            title: 'Signature Capture',
            subtitle: 'Signature Capture',
            ariaLabel: 'Signature Capture',
          },
        },
        {
          key: TIME_TRACKING_SETTINGS.ROUND_CLOCK_IN_TIME,
          value: '',
          id: 'roundClockInTime',
          title: 'Round Clock In Time',
          ariaLabel: 'Round Clock In Time',
          tooltipText: 'Round Clock In Time',
          disabled: false,
          detail: {
            title: 'Round Clock In Time',
            subtitle: 'Round Clock In Time',
            ariaLabel: 'Round Clock In Time',
          },
        },
        {
          key: TIME_TRACKING_SETTINGS.ROUND_CLOCK_OUT_TIME,
          value: '',
          id: 'roundClockOutTime',
          title: 'Round Clock Out Time',
          ariaLabel: 'Round Clock Out Time',
          tooltipText: 'Round Clock Out Time',
          disabled: false,
          detail: {
            title: 'Round Clock Out Time',
            subtitle: 'Round Clock Out Time',
            ariaLabel: 'Round Clock Out Time',
          },
        },
      ],
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should update first day of week settings', () => {
      const updatedQlSettingsData: Partial<MappedQLSettings> = {
        firstDayOfWeek: { value: 1, version: '1' },
        timeTrackingSupported: { value: true, version: '1' },
        transactionBillingForTimeEnabled: { value: true, version: '1' },
        transactionTimeTrackingEnabled: { value: true, version: '1' },
        isBillingFieldEnabled: { value: true, version: '1' },
      };

      updateTimeTrackingFields({
        timeTrackingFields: baseTimeTrackingFields,
        updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
        setFormFieldValue: mockSetFormFieldValue,
        timezoneConversions: mockTimezoneConversions,
        intl: mockIntl,
        isFieldsVisible: mockIsFieldsVisible,
        setNotificationFields: mockSetNotificationFields,
        updateVisibleFields: mockUpdateVisibleFields,
        notificationFields: mockBaseNotificationFields,
      });

      expect(mockSetFormFieldValue).toHaveBeenCalledWith(
        TIME_TRACKING_SETTINGS.FIRST_DAY_OF_WEEK,
        '1',
      );
    });

    it('should update timezone settings', () => {
      const updatedQlSettingsData: Partial<MappedQLSettings> = {
        timeZone: { value: 'UTC', version: '1' },
        timeTrackingSupported: { value: true, version: '1' },
        transactionBillingForTimeEnabled: { value: true, version: '1' },
        transactionTimeTrackingEnabled: { value: true, version: '1' },
        firstDayOfWeek: { value: 1, version: '1' },
        isBillingFieldEnabled: { value: true, version: '1' },
      };

      updateTimeTrackingFields({
        timeTrackingFields: baseTimeTrackingFields,
        updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
        setFormFieldValue: mockSetFormFieldValue,
        timezoneConversions: mockTimezoneConversions,
        intl: mockIntl,
        isFieldsVisible: mockIsFieldsVisible,
        setNotificationFields: mockSetNotificationFields,
        updateVisibleFields: mockUpdateVisibleFields,
        notificationFields: mockBaseNotificationFields,
      });

      expect(mockSetFormFieldValue).toHaveBeenCalledWith(
        TIME_TRACKING_SETTINGS.TIME_ZONE,
        'UTC',
      );
    });

    it('should update time format settings to 24-hour format', () => {
      const updatedQlSettingsData: Partial<MappedQLSettings> = {
        timeFormat: { value: 24, version: '1' },
        timeTrackingSupported: { value: true, version: '1' },
        transactionBillingForTimeEnabled: { value: true, version: '1' },
        transactionTimeTrackingEnabled: { value: true, version: '1' },
        firstDayOfWeek: { value: 1, version: '1' },
        isBillingFieldEnabled: { value: true, version: '1' },
      };

      updateTimeTrackingFields({
        timeTrackingFields: baseTimeTrackingFields,
        updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
        setFormFieldValue: mockSetFormFieldValue,
        timezoneConversions: mockTimezoneConversions,
        intl: mockIntl,
        isFieldsVisible: mockIsFieldsVisible,
        setNotificationFields: mockSetNotificationFields,
        updateVisibleFields: mockUpdateVisibleFields,
        notificationFields: mockBaseNotificationFields,
      });

      expect(mockSetFormFieldValue).toHaveBeenCalledWith(
        TIME_TRACKING_SETTINGS.TIME_FORMAT,
        24,
      );
    });

    it('should update time format settings to 12-hour format', () => {
      const updatedQlSettingsData: Partial<MappedQLSettings> = {
        timeFormat: { value: 12, version: '1' },
        timeTrackingSupported: { value: true, version: '1' },
        transactionBillingForTimeEnabled: { value: true, version: '1' },
        transactionTimeTrackingEnabled: { value: true, version: '1' },
        firstDayOfWeek: { value: 1, version: '1' },
        isBillingFieldEnabled: { value: true, version: '1' },
      };

      updateTimeTrackingFields({
        timeTrackingFields: baseTimeTrackingFields,
        updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
        setFormFieldValue: mockSetFormFieldValue,
        timezoneConversions: mockTimezoneConversions,
        intl: mockIntl,
        isFieldsVisible: mockIsFieldsVisible,
        setNotificationFields: mockSetNotificationFields,
        updateVisibleFields: mockUpdateVisibleFields,
        notificationFields: mockBaseNotificationFields,
      });

      expect(mockSetFormFieldValue).toHaveBeenCalledWith(
        TIME_TRACKING_SETTINGS.TIME_FORMAT,
        12,
      );
    });

    it('should default to 24-hour format when time format is missing', () => {
      const updatedQlSettingsData: Partial<MappedQLSettings> = {
        timeTrackingSupported: { value: true, version: '1' },
        transactionBillingForTimeEnabled: { value: true, version: '1' },
        transactionTimeTrackingEnabled: { value: true, version: '1' },
        firstDayOfWeek: { value: 1, version: '1' },
        isBillingFieldEnabled: { value: true, version: '1' },
      };

      updateTimeTrackingFields({
        timeTrackingFields: baseTimeTrackingFields,
        updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
        setFormFieldValue: mockSetFormFieldValue,
        timezoneConversions: mockTimezoneConversions,
        intl: mockIntl,
        isFieldsVisible: mockIsFieldsVisible,
        setNotificationFields: mockSetNotificationFields,
        updateVisibleFields: mockUpdateVisibleFields,
        notificationFields: mockBaseNotificationFields,
      });

      expect(mockSetFormFieldValue).toHaveBeenCalledWith(
        TIME_TRACKING_SETTINGS.TIME_FORMAT,
        24,
      );
    });

    it('should update split timesheet settings when enabled and set correct message', () => {
      const updatedQlSettingsData: Partial<MappedQLSettings> = {
        splitTimeSheetAtMidnightEnabled: { value: true, version: '1' },
        timeTrackingSupported: { value: true, version: '1' },
        transactionBillingForTimeEnabled: { value: true, version: '1' },
        transactionTimeTrackingEnabled: { value: true, version: '1' },
        firstDayOfWeek: { value: 1, version: '1' },
        isBillingFieldEnabled: { value: true, version: '1' },
      };

      const result = updateTimeTrackingFields({
        timeTrackingFields: baseTimeTrackingFields,
        updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
        setFormFieldValue: mockSetFormFieldValue,
        timezoneConversions: mockTimezoneConversions,
        intl: mockIntl,
        isFieldsVisible: mockIsFieldsVisible,
        setNotificationFields: mockSetNotificationFields,
        updateVisibleFields: mockUpdateVisibleFields,
        notificationFields: mockBaseNotificationFields,
      });

      // Verify form field value is set correctly
      expect(mockSetFormFieldValue).toHaveBeenCalledWith(
        TIME_TRACKING_SETTINGS.SPLIT_TIME_SHEET_AT_MIDNIGET_ENABLED,
        true,
      );

      // Verify the display message is set correctly
      const splitTimeSheetField = result['time-tracking.section.title'].find(
        (field) =>
          field.key ===
          TIME_TRACKING_SETTINGS.SPLIT_TIME_SHEET_AT_MIDNIGET_ENABLED,
      );
      expect(splitTimeSheetField?.value).toBe('on');
    });

    it('should update split timesheet settings when disabled and set correct message', () => {
      const updatedQlSettingsData: Partial<MappedQLSettings> = {
        splitTimeSheetAtMidnightEnabled: { value: false, version: '1' },
        timeTrackingSupported: { value: true, version: '1' },
        transactionBillingForTimeEnabled: { value: true, version: '1' },
        transactionTimeTrackingEnabled: { value: true, version: '1' },
        firstDayOfWeek: { value: 1, version: '1' },
        isBillingFieldEnabled: { value: true, version: '1' },
      };

      const result = updateTimeTrackingFields({
        timeTrackingFields: baseTimeTrackingFields,
        updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
        setFormFieldValue: mockSetFormFieldValue,
        timezoneConversions: mockTimezoneConversions,
        intl: mockIntl,
        isFieldsVisible: mockIsFieldsVisible,
        setNotificationFields: mockSetNotificationFields,
        updateVisibleFields: mockUpdateVisibleFields,
        notificationFields: mockBaseNotificationFields,
      });

      // Verify form field value is set correctly
      expect(mockSetFormFieldValue).toHaveBeenCalledWith(
        TIME_TRACKING_SETTINGS.SPLIT_TIME_SHEET_AT_MIDNIGET_ENABLED,
        false,
      );

      // Verify the display message is set correctly
      const splitTimeSheetField = result['time-tracking.section.title'].find(
        (field) =>
          field.key ===
          TIME_TRACKING_SETTINGS.SPLIT_TIME_SHEET_AT_MIDNIGET_ENABLED,
      );
      expect(splitTimeSheetField?.value).toBe('off');
    });

    it('should handle missing split timesheet setting and set correct message', () => {
      const updatedQlSettingsData: Partial<MappedQLSettings> = {
        timeTrackingSupported: { value: true, version: '1' },
        transactionBillingForTimeEnabled: { value: true, version: '1' },
        transactionTimeTrackingEnabled: { value: true, version: '1' },
        firstDayOfWeek: { value: 1, version: '1' },
        isBillingFieldEnabled: { value: true, version: '1' },
      };

      const result = updateTimeTrackingFields({
        timeTrackingFields: baseTimeTrackingFields,
        updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
        setFormFieldValue: mockSetFormFieldValue,
        timezoneConversions: mockTimezoneConversions,
        intl: mockIntl,
        isFieldsVisible: mockIsFieldsVisible,
        setNotificationFields: mockSetNotificationFields,
        updateVisibleFields: mockUpdateVisibleFields,
        notificationFields: mockBaseNotificationFields,
      });

      // Verify form field value defaults to false
      expect(mockSetFormFieldValue).toHaveBeenCalledWith(
        TIME_TRACKING_SETTINGS.SPLIT_TIME_SHEET_AT_MIDNIGET_ENABLED,
        false,
      );

      // Verify the display message defaults to off
      const splitTimeSheetField = result['time-tracking.section.title'].find(
        (field) =>
          field.key ===
          TIME_TRACKING_SETTINGS.SPLIT_TIME_SHEET_AT_MIDNIGET_ENABLED,
      );
      expect(splitTimeSheetField?.value).toBe('off');
    });

    it('should update manage own timesheets settings when enabled and set correct message', () => {
      const updatedQlSettingsData: Partial<MappedQLSettings> = {
        manageOwnTimeSheetsEnabled: { value: true, version: '1' },
        timeTrackingSupported: { value: true, version: '1' },
        transactionBillingForTimeEnabled: { value: true, version: '1' },
        transactionTimeTrackingEnabled: { value: true, version: '1' },
        firstDayOfWeek: { value: 1, version: '1' },
        isBillingFieldEnabled: { value: true, version: '1' },
      };

      const result = updateTimeTrackingFields({
        timeTrackingFields: baseTimeTrackingFields,
        updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
        setFormFieldValue: mockSetFormFieldValue,
        timezoneConversions: mockTimezoneConversions,
        intl: mockIntl,
        isFieldsVisible: mockIsFieldsVisible,
        setNotificationFields: mockSetNotificationFields,
        updateVisibleFields: mockUpdateVisibleFields,
        notificationFields: mockBaseNotificationFields,
      });

      // Verify form field value is set correctly
      expect(mockSetFormFieldValue).toHaveBeenCalledWith(
        TIME_TRACKING_SETTINGS.MANAGE_OWN_TIME_SHEETS_ENABLED,
        true,
      );

      // Verify the display message is set correctly
      const manageOwnTimeSheetsField = result[
        'time-tracking.section.title'
      ].find(
        (field) =>
          field.key === TIME_TRACKING_SETTINGS.MANAGE_OWN_TIME_SHEETS_ENABLED,
      );
      expect(manageOwnTimeSheetsField?.value).toBe('on');
    });

    it('should update manage own timesheets settings when disabled and set correct message', () => {
      const updatedQlSettingsData: Partial<MappedQLSettings> = {
        manageOwnTimeSheetsEnabled: { value: false, version: '1' },
        timeTrackingSupported: { value: true, version: '1' },
        transactionBillingForTimeEnabled: { value: true, version: '1' },
        transactionTimeTrackingEnabled: { value: true, version: '1' },
        firstDayOfWeek: { value: 1, version: '1' },
        isBillingFieldEnabled: { value: true, version: '1' },
      };

      const result = updateTimeTrackingFields({
        timeTrackingFields: baseTimeTrackingFields,
        updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
        setFormFieldValue: mockSetFormFieldValue,
        timezoneConversions: mockTimezoneConversions,
        intl: mockIntl,
        isFieldsVisible: mockIsFieldsVisible,
        setNotificationFields: mockSetNotificationFields,
        updateVisibleFields: mockUpdateVisibleFields,
        notificationFields: mockBaseNotificationFields,
      });

      // Verify form field value is set correctly
      expect(mockSetFormFieldValue).toHaveBeenCalledWith(
        TIME_TRACKING_SETTINGS.MANAGE_OWN_TIME_SHEETS_ENABLED,
        false,
      );

      // Verify the display message is set correctly
      const manageOwnTimeSheetsField = result[
        'time-tracking.section.title'
      ].find(
        (field) =>
          field.key === TIME_TRACKING_SETTINGS.MANAGE_OWN_TIME_SHEETS_ENABLED,
      );
      expect(manageOwnTimeSheetsField?.value).toBe('off');
    });

    it('should handle missing manage own timesheets setting and set correct message', () => {
      const updatedQlSettingsData: Partial<MappedQLSettings> = {
        timeTrackingSupported: { value: true, version: '1' },
        transactionBillingForTimeEnabled: { value: true, version: '1' },
        transactionTimeTrackingEnabled: { value: true, version: '1' },
        firstDayOfWeek: { value: 1, version: '1' },
        isBillingFieldEnabled: { value: true, version: '1' },
      };

      const result = updateTimeTrackingFields({
        timeTrackingFields: baseTimeTrackingFields,
        updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
        setFormFieldValue: mockSetFormFieldValue,
        timezoneConversions: mockTimezoneConversions,
        intl: mockIntl,
        isFieldsVisible: mockIsFieldsVisible,
        setNotificationFields: mockSetNotificationFields,
        updateVisibleFields: mockUpdateVisibleFields,
        notificationFields: mockBaseNotificationFields,
      });

      // Verify form field value defaults to false
      expect(mockSetFormFieldValue).toHaveBeenCalledWith(
        TIME_TRACKING_SETTINGS.MANAGE_OWN_TIME_SHEETS_ENABLED,
        false,
      );

      // Verify the display message defaults to off
      const manageOwnTimeSheetsField = result[
        'time-tracking.section.title'
      ].find(
        (field) =>
          field.key === TIME_TRACKING_SETTINGS.MANAGE_OWN_TIME_SHEETS_ENABLED,
      );
      expect(manageOwnTimeSheetsField?.value).toBe('off');
    });

    it('should update mobile time tracking settings when enabled', () => {
      const updatedQlSettingsData: Partial<MappedQLSettings> = {
        mobileTimeTrackingEnabled: { value: true, version: '1' },
        timeTrackingSupported: { value: true, version: '1' },
        transactionBillingForTimeEnabled: { value: true, version: '1' },
        transactionTimeTrackingEnabled: { value: true, version: '1' },
        firstDayOfWeek: { value: 1, version: '1' },
        isBillingFieldEnabled: { value: true, version: '1' },
      };

      const result = updateTimeTrackingFields({
        timeTrackingFields: baseTimeTrackingFields,
        updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
        setFormFieldValue: mockSetFormFieldValue,
        timezoneConversions: mockTimezoneConversions,
        intl: mockIntl,
        isFieldsVisible: mockIsFieldsVisible,
        setNotificationFields: mockSetNotificationFields,
        updateVisibleFields: mockUpdateVisibleFields,
        notificationFields: mockBaseNotificationFields,
      });

      // Verify form field value is set correctly
      expect(mockSetFormFieldValue).toHaveBeenCalledWith(
        TIME_TRACKING_SETTINGS.MOBILE_TIME_TRACKING_ENABLED,
        true,
      );

      // Verify the display message is set correctly
      const mobileTrackingField = result['time-tracking.section.title'].find(
        (field) =>
          field.key === TIME_TRACKING_SETTINGS.MOBILE_TIME_TRACKING_ENABLED,
      );
      expect(mobileTrackingField?.value).toBe('on');
    });

    it('should update mobile time tracking settings when disabled', () => {
      const updatedQlSettingsData: Partial<MappedQLSettings> = {
        mobileTimeTrackingEnabled: { value: false, version: '1' },
        timeTrackingSupported: { value: true, version: '1' },
        transactionBillingForTimeEnabled: { value: true, version: '1' },
        transactionTimeTrackingEnabled: { value: true, version: '1' },
        firstDayOfWeek: { value: 1, version: '1' },
        isBillingFieldEnabled: { value: true, version: '1' },
      };

      const result = updateTimeTrackingFields({
        timeTrackingFields: baseTimeTrackingFields,
        updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
        setFormFieldValue: mockSetFormFieldValue,
        timezoneConversions: mockTimezoneConversions,
        intl: mockIntl,
        isFieldsVisible: mockIsFieldsVisible,
        setNotificationFields: mockSetNotificationFields,
        updateVisibleFields: mockUpdateVisibleFields,
        notificationFields: mockBaseNotificationFields,
      });

      // Verify form field value is set correctly
      expect(mockSetFormFieldValue).toHaveBeenCalledWith(
        TIME_TRACKING_SETTINGS.MOBILE_TIME_TRACKING_ENABLED,
        false,
      );

      // Verify the display message is set correctly
      const mobileTrackingField = result['time-tracking.section.title'].find(
        (field) =>
          field.key === TIME_TRACKING_SETTINGS.MOBILE_TIME_TRACKING_ENABLED,
      );
      expect(mobileTrackingField?.value).toBe('off');
    });

    it('should update signature capture settings when enabled', () => {
      const updatedQlSettingsData: Partial<MappedQLSettings> = {
        signatureCaptureEnabled: { value: true, version: '1' },
        timeTrackingSupported: { value: true, version: '1' },
        transactionBillingForTimeEnabled: { value: true, version: '1' },
        transactionTimeTrackingEnabled: { value: true, version: '1' },
        firstDayOfWeek: { value: 1, version: '1' },
        isBillingFieldEnabled: { value: true, version: '1' },
      };

      const result = updateTimeTrackingFields({
        timeTrackingFields: baseTimeTrackingFields,
        updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
        setFormFieldValue: mockSetFormFieldValue,
        timezoneConversions: mockTimezoneConversions,
        intl: mockIntl,
        isFieldsVisible: mockIsFieldsVisible,
        setNotificationFields: mockSetNotificationFields,
        updateVisibleFields: mockUpdateVisibleFields,
        notificationFields: mockBaseNotificationFields,
      });

      // Verify form field value is set correctly
      expect(mockSetFormFieldValue).toHaveBeenCalledWith(
        TIME_TRACKING_SETTINGS.SIGNATURE_CAPTURE_ENABLED,
        true,
      );

      // Verify the display message is set correctly
      const signatureCaptureField = result['time-tracking.section.title'].find(
        (field) =>
          field.key === TIME_TRACKING_SETTINGS.SIGNATURE_CAPTURE_ENABLED,
      );
      expect(signatureCaptureField?.value).toBe('on');
    });

    it('should update signature capture settings when disabled', () => {
      const updatedQlSettingsData: Partial<MappedQLSettings> = {
        signatureCaptureEnabled: { value: false, version: '1' },
        timeTrackingSupported: { value: true, version: '1' },
        transactionBillingForTimeEnabled: { value: true, version: '1' },
        transactionTimeTrackingEnabled: { value: true, version: '1' },
        firstDayOfWeek: { value: 1, version: '1' },
        isBillingFieldEnabled: { value: true, version: '1' },
      };

      const result = updateTimeTrackingFields({
        timeTrackingFields: baseTimeTrackingFields,
        updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
        setFormFieldValue: mockSetFormFieldValue,
        timezoneConversions: mockTimezoneConversions,
        intl: mockIntl,
        isFieldsVisible: mockIsFieldsVisible,
        setNotificationFields: mockSetNotificationFields,
        updateVisibleFields: mockUpdateVisibleFields,
        notificationFields: mockBaseNotificationFields,
      });

      // Verify form field value is set correctly
      expect(mockSetFormFieldValue).toHaveBeenCalledWith(
        TIME_TRACKING_SETTINGS.SIGNATURE_CAPTURE_ENABLED,
        false,
      );

      // Verify the display message is set correctly
      const signatureCaptureField = result['time-tracking.section.title'].find(
        (field) =>
          field.key === TIME_TRACKING_SETTINGS.SIGNATURE_CAPTURE_ENABLED,
      );
      expect(signatureCaptureField?.value).toBe('off');
    });

    it('should update edit clock out time settings when enabled with override hours', () => {
      const updatedQlSettingsData: Partial<MappedQLSettings> = {
        editClockOutTimeEnabled: { value: true, version: '1' },
        clockOutOverrideHours: { value: 12, version: '1' },
        timeTrackingSupported: { value: true, version: '1' },
        transactionBillingForTimeEnabled: { value: true, version: '1' },
        transactionTimeTrackingEnabled: { value: true, version: '1' },
        firstDayOfWeek: { value: 1, version: '1' },
        isBillingFieldEnabled: { value: true, version: '1' },
      };

      jest.clearAllMocks();
      const result = updateTimeTrackingFields({
        timeTrackingFields: baseTimeTrackingFields,
        updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
        setFormFieldValue: mockSetFormFieldValue,
        timezoneConversions: mockTimezoneConversions,
        intl: mockIntl,
        isFieldsVisible: mockIsFieldsVisible,
        setNotificationFields: mockSetNotificationFields,
        updateVisibleFields: mockUpdateVisibleFields,
        notificationFields: mockBaseNotificationFields,
      });

      // Verify notification field visibility is updated first
      expect(mockSetNotificationFields).toHaveBeenCalled();
      expect(mockUpdateVisibleFields).toHaveBeenCalledWith({
        ...mockIsFieldsVisible,
        notifyWhenClockInOutTimeAdjusted: true,
      });

      // Then verify form field values
      expect(mockSetFormFieldValue).toHaveBeenCalledWith(
        TIME_TRACKING_SETTINGS.EDIT_CLOCK_OUT_TIME_ENABLED,
        true,
      );
      expect(mockSetFormFieldValue).toHaveBeenCalledWith(
        TIME_TRACKING_SETTINGS.CLOCK_OUT_OVERRIDE_HOURS,
        12,
      );

      // Finally verify the display message
      const editClockOutField = result['time-tracking.section.title'].find(
        (field) =>
          field.key === TIME_TRACKING_SETTINGS.EDIT_CLOCK_OUT_TIME_ENABLED,
      );
      expect(editClockOutField?.value).toBe('on, after 12 hours');
    });

    it('should update edit clock out time settings when disabled', () => {
      const updatedQlSettingsData: Partial<MappedQLSettings> = {
        editClockOutTimeEnabled: { value: false, version: '1' },
        clockOutOverrideHours: { value: 8, version: '1' },
        timeTrackingSupported: { value: true, version: '1' },
        transactionBillingForTimeEnabled: { value: true, version: '1' },
        transactionTimeTrackingEnabled: { value: true, version: '1' },
        firstDayOfWeek: { value: 1, version: '1' },
        isBillingFieldEnabled: { value: true, version: '1' },
      };

      jest.clearAllMocks();
      const result = updateTimeTrackingFields({
        timeTrackingFields: baseTimeTrackingFields,
        updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
        setFormFieldValue: mockSetFormFieldValue,
        timezoneConversions: mockTimezoneConversions,
        intl: mockIntl,
        isFieldsVisible: mockIsFieldsVisible,
        setNotificationFields: mockSetNotificationFields,
        updateVisibleFields: mockUpdateVisibleFields,
        notificationFields: mockBaseNotificationFields,
      });

      // Verify notification field visibility is updated first
      expect(mockSetNotificationFields).toHaveBeenCalled();
      expect(mockUpdateVisibleFields).toHaveBeenCalledWith({
        ...mockIsFieldsVisible,
        notifyWhenClockInOutTimeAdjusted: false,
      });

      // Then verify form field values
      expect(mockSetFormFieldValue).toHaveBeenCalledWith(
        TIME_TRACKING_SETTINGS.EDIT_CLOCK_OUT_TIME_ENABLED,
        false,
      );
      expect(mockSetFormFieldValue).toHaveBeenCalledWith(
        TIME_TRACKING_SETTINGS.CLOCK_OUT_OVERRIDE_HOURS,
        8,
      );

      // Finally verify the display message
      const editClockOutField = result['time-tracking.section.title'].find(
        (field) =>
          field.key === TIME_TRACKING_SETTINGS.EDIT_CLOCK_OUT_TIME_ENABLED,
      );
      expect(editClockOutField?.value).toBe('off');
    });

    it('should handle missing edit clock out time settings with default values', () => {
      const updatedQlSettingsData: Partial<MappedQLSettings> = {
        timeTrackingSupported: { value: true, version: '1' },
        transactionBillingForTimeEnabled: { value: true, version: '1' },
        transactionTimeTrackingEnabled: { value: true, version: '1' },
        firstDayOfWeek: { value: 1, version: '1' },
        isBillingFieldEnabled: { value: true, version: '1' },
      };

      jest.clearAllMocks();
      const result = updateTimeTrackingFields({
        timeTrackingFields: baseTimeTrackingFields,
        updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
        setFormFieldValue: mockSetFormFieldValue,
        timezoneConversions: mockTimezoneConversions,
        intl: mockIntl,
        isFieldsVisible: mockIsFieldsVisible,
        setNotificationFields: mockSetNotificationFields,
        updateVisibleFields: mockUpdateVisibleFields,
        notificationFields: mockBaseNotificationFields,
      });

      // Verify notification field visibility is updated first
      expect(mockSetNotificationFields).toHaveBeenCalled();
      expect(mockUpdateVisibleFields).toHaveBeenCalledWith({
        ...mockIsFieldsVisible,
        notifyWhenClockInOutTimeAdjusted: false,
      });

      // Then verify form field values
      expect(mockSetFormFieldValue).toHaveBeenCalledWith(
        TIME_TRACKING_SETTINGS.EDIT_CLOCK_OUT_TIME_ENABLED,
        false,
      );
      expect(mockSetFormFieldValue).toHaveBeenCalledWith(
        TIME_TRACKING_SETTINGS.CLOCK_OUT_OVERRIDE_HOURS,
        8,
      );

      // Finally verify the display message
      const editClockOutField = result['time-tracking.section.title'].find(
        (field) =>
          field.key === TIME_TRACKING_SETTINGS.EDIT_CLOCK_OUT_TIME_ENABLED,
      );
      expect(editClockOutField?.value).toBe('off');
    });

    describe('Clock Rounding Settings', () => {
      beforeEach(() => {
        jest.clearAllMocks();
      });

      it('should update round clock in time settings with UP direction', () => {
        const updatedQlSettingsData: Partial<MappedQLSettings> = {
          clockInRoundDirection: { value: 'UP', version: '1' },
          clockInRoundInMin: { value: 15, version: '1' },
          timeTrackingSupported: { value: true, version: '1' },
          transactionBillingForTimeEnabled: { value: true, version: '1' },
          transactionTimeTrackingEnabled: { value: true, version: '1' },
          firstDayOfWeek: { value: 1, version: '1' },
          isBillingFieldEnabled: { value: true, version: '1' },
        };

        const result = updateTimeTrackingFields({
          timeTrackingFields: baseTimeTrackingFields,
          updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
          setFormFieldValue: mockSetFormFieldValue,
          timezoneConversions: mockTimezoneConversions,
          intl: mockIntl,
          isFieldsVisible: mockIsFieldsVisible,
          setNotificationFields: mockSetNotificationFields,
          updateVisibleFields: mockUpdateVisibleFields,
          notificationFields: mockBaseNotificationFields,
        });

        expect(mockSetFormFieldValue).toHaveBeenCalledWith(
          CLOCK_ROUNDING_SETTINGS.CLOCK_IN_ROUND_DIRECTION,
          'UP',
        );
        expect(mockSetFormFieldValue).toHaveBeenCalledWith(
          CLOCK_ROUNDING_SETTINGS.CLOCK_IN_ROUND_IN_MINUTE,
          15,
        );

        const roundClockInField = result['time-tracking.section.title'].find(
          (field) => field.key === TIME_TRACKING_SETTINGS.ROUND_CLOCK_IN_TIME,
        );
        expect(roundClockInField?.value).toBe('Up, 15 minute');
      });

      it('should update round clock in time settings with DOWN direction', () => {
        const updatedQlSettingsData: Partial<MappedQLSettings> = {
          clockInRoundDirection: { value: 'DOWN', version: '1' },
          clockInRoundInMin: { value: 30, version: '1' },
          timeTrackingSupported: { value: true, version: '1' },
          transactionBillingForTimeEnabled: { value: true, version: '1' },
          transactionTimeTrackingEnabled: { value: true, version: '1' },
          firstDayOfWeek: { value: 1, version: '1' },
          isBillingFieldEnabled: { value: true, version: '1' },
        };

        const result = updateTimeTrackingFields({
          timeTrackingFields: baseTimeTrackingFields,
          updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
          setFormFieldValue: mockSetFormFieldValue,
          timezoneConversions: mockTimezoneConversions,
          intl: mockIntl,
          isFieldsVisible: mockIsFieldsVisible,
          setNotificationFields: mockSetNotificationFields,
          updateVisibleFields: mockUpdateVisibleFields,
          notificationFields: mockBaseNotificationFields,
        });

        expect(mockSetFormFieldValue).toHaveBeenCalledWith(
          CLOCK_ROUNDING_SETTINGS.CLOCK_IN_ROUND_DIRECTION,
          'DOWN',
        );
        expect(mockSetFormFieldValue).toHaveBeenCalledWith(
          CLOCK_ROUNDING_SETTINGS.CLOCK_IN_ROUND_IN_MINUTE,
          30,
        );

        const roundClockInField = result['time-tracking.section.title'].find(
          (field) => field.key === TIME_TRACKING_SETTINGS.ROUND_CLOCK_IN_TIME,
        );
        expect(roundClockInField?.value).toBe('Down, 30 minute');
      });

      it('should handle missing round clock in time settings', () => {
        const updatedQlSettingsData: Partial<MappedQLSettings> = {
          timeTrackingSupported: { value: true, version: '1' },
          transactionBillingForTimeEnabled: { value: true, version: '1' },
          transactionTimeTrackingEnabled: { value: true, version: '1' },
          firstDayOfWeek: { value: 1, version: '1' },
          isBillingFieldEnabled: { value: true, version: '1' },
          clockInRoundDirection: { value: '', version: '1' },
          clockInRoundInMin: { value: 1, version: '1' },
        };

        const result = updateTimeTrackingFields({
          timeTrackingFields: baseTimeTrackingFields,
          updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
          setFormFieldValue: mockSetFormFieldValue,
          timezoneConversions: mockTimezoneConversions,
          intl: mockIntl,
          isFieldsVisible: mockIsFieldsVisible,
          setNotificationFields: mockSetNotificationFields,
          updateVisibleFields: mockUpdateVisibleFields,
          notificationFields: mockBaseNotificationFields,
        });

        expect(mockSetFormFieldValue).toHaveBeenCalledWith(
          CLOCK_ROUNDING_SETTINGS.CLOCK_IN_ROUND_DIRECTION,
          '',
        );
        expect(mockSetFormFieldValue).toHaveBeenCalledWith(
          CLOCK_ROUNDING_SETTINGS.CLOCK_IN_ROUND_IN_MINUTE,
          1,
        );

        const roundClockInField = result['time-tracking.section.title'].find(
          (field) => field.key === TIME_TRACKING_SETTINGS.ROUND_CLOCK_IN_TIME,
        );
        expect(roundClockInField?.value).toBe(', 1 minute');
      });

      it('should update round clock out time settings with UP direction', () => {
        const updatedQlSettingsData: Partial<MappedQLSettings> = {
          clockOutRoundDirection: { value: 'UP', version: '1' },
          clockOutRoundInMin: { value: 15, version: '1' },
          timeTrackingSupported: { value: true, version: '1' },
          transactionBillingForTimeEnabled: { value: true, version: '1' },
          transactionTimeTrackingEnabled: { value: true, version: '1' },
          firstDayOfWeek: { value: 1, version: '1' },
          isBillingFieldEnabled: { value: true, version: '1' },
        };

        const result = updateTimeTrackingFields({
          timeTrackingFields: baseTimeTrackingFields,
          updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
          setFormFieldValue: mockSetFormFieldValue,
          timezoneConversions: mockTimezoneConversions,
          intl: mockIntl,
          isFieldsVisible: mockIsFieldsVisible,
          setNotificationFields: mockSetNotificationFields,
          updateVisibleFields: mockUpdateVisibleFields,
          notificationFields: mockBaseNotificationFields,
        });

        expect(mockSetFormFieldValue).toHaveBeenCalledWith(
          CLOCK_ROUNDING_SETTINGS.CLOCK_OUT_ROUND_DIRECTION,
          'UP',
        );
        expect(mockSetFormFieldValue).toHaveBeenCalledWith(
          CLOCK_ROUNDING_SETTINGS.CLOCK_OUT_ROUND_IN_MINUTE,
          15,
        );

        const roundClockOutField = result['time-tracking.section.title'].find(
          (field) => field.key === TIME_TRACKING_SETTINGS.ROUND_CLOCK_OUT_TIME,
        );
        expect(roundClockOutField?.value).toBe('Up, 15 minute');
      });

      it('should update round clock out time settings with DOWN direction', () => {
        const updatedQlSettingsData: Partial<MappedQLSettings> = {
          clockOutRoundDirection: { value: 'DOWN', version: '1' },
          clockOutRoundInMin: { value: 30, version: '1' },
          timeTrackingSupported: { value: true, version: '1' },
          transactionBillingForTimeEnabled: { value: true, version: '1' },
          transactionTimeTrackingEnabled: { value: true, version: '1' },
          firstDayOfWeek: { value: 1, version: '1' },
          isBillingFieldEnabled: { value: true, version: '1' },
        };

        const result = updateTimeTrackingFields({
          timeTrackingFields: baseTimeTrackingFields,
          updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
          setFormFieldValue: mockSetFormFieldValue,
          timezoneConversions: mockTimezoneConversions,
          intl: mockIntl,
          isFieldsVisible: mockIsFieldsVisible,
          setNotificationFields: mockSetNotificationFields,
          updateVisibleFields: mockUpdateVisibleFields,
          notificationFields: mockBaseNotificationFields,
        });

        expect(mockSetFormFieldValue).toHaveBeenCalledWith(
          CLOCK_ROUNDING_SETTINGS.CLOCK_OUT_ROUND_DIRECTION,
          'DOWN',
        );
        expect(mockSetFormFieldValue).toHaveBeenCalledWith(
          CLOCK_ROUNDING_SETTINGS.CLOCK_OUT_ROUND_IN_MINUTE,
          30,
        );

        const roundClockOutField = result['time-tracking.section.title'].find(
          (field) => field.key === TIME_TRACKING_SETTINGS.ROUND_CLOCK_OUT_TIME,
        );
        expect(roundClockOutField?.value).toBe('Down, 30 minute');
      });

      it('should handle missing round clock out time settings', () => {
        const updatedQlSettingsData: Partial<MappedQLSettings> = {
          timeTrackingSupported: { value: true, version: '1' },
          transactionBillingForTimeEnabled: { value: true, version: '1' },
          transactionTimeTrackingEnabled: { value: true, version: '1' },
          firstDayOfWeek: { value: 1, version: '1' },
          isBillingFieldEnabled: { value: true, version: '1' },
          clockOutRoundDirection: { value: '', version: '1' },
          clockOutRoundInMin: { value: 1, version: '1' },
        };

        const result = updateTimeTrackingFields({
          timeTrackingFields: baseTimeTrackingFields,
          updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
          setFormFieldValue: mockSetFormFieldValue,
          timezoneConversions: mockTimezoneConversions,
          intl: mockIntl,
          isFieldsVisible: mockIsFieldsVisible,
          setNotificationFields: mockSetNotificationFields,
          updateVisibleFields: mockUpdateVisibleFields,
          notificationFields: mockBaseNotificationFields,
        });

        expect(mockSetFormFieldValue).toHaveBeenCalledWith(
          CLOCK_ROUNDING_SETTINGS.CLOCK_OUT_ROUND_DIRECTION,
          '',
        );
        expect(mockSetFormFieldValue).toHaveBeenCalledWith(
          CLOCK_ROUNDING_SETTINGS.CLOCK_OUT_ROUND_IN_MINUTE,
          1,
        );

        const roundClockOutField = result['time-tracking.section.title'].find(
          (field) => field.key === TIME_TRACKING_SETTINGS.ROUND_CLOCK_OUT_TIME,
        );
        expect(roundClockOutField?.value).toBe(', 1 minute');
      });
    });
  });

  describe('updateTimeSheetFields', () => {
    const mockSetFormFieldValue = jest.fn();
    const mockSetNotificationFields = jest.fn();
    const mockUpdateVisibleFields = jest.fn();

    const baseTimeSheetFields: ITimeSheetFieldOption[] = [
      {
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
        value: false,
        id: 'isBillingFieldEnabled',
        title: 'Billing Field',
        ariaLabel: 'Billing Field',
        tooltipText: 'Billing Field',
        disabled: false,
        detail: {
          title: 'Billing Field',
          subtitle: 'Billing Field',
          ariaLabel: 'Billing Field',
        },
        subFields: [
          {
            key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
            value: false,
            id: 'isBillingFieldEnabled',
            title: 'Billing Field',
            ariaLabel: 'Billing Field',
            tooltipText: 'Billing Field',
            disabled: false,
            detail: {
              title: 'Billing Field',
              subtitle: 'Billing Field',
              ariaLabel: 'Billing Field',
            },
          },
        ],
      },
      {
        key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CUSTOMER_FOR_TIMESHEET_ENABLED,
        value: false,
        id: 'customerForTimesheet',
        title: 'Customer For Timesheet',
        ariaLabel: 'Customer For Timesheet',
        tooltipText: 'Customer For Timesheet',
        disabled: false,
        detail: {
          title: 'Customer For Timesheet',
          subtitle: 'Customer For Timesheet',
          ariaLabel: 'Customer For Timesheet',
        },
        subFields: [
          {
            key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CUSTOMER_FOR_TIMESHEET_ENABLED,
            value: false,
            id: 'customerForTimesheet',
            title: 'Customer For Timesheet',
            ariaLabel: 'Customer For Timesheet',
            tooltipText: 'Customer For Timesheet',
            disabled: false,
            detail: {
              title: 'Customer For Timesheet',
              subtitle: 'Customer For Timesheet',
              ariaLabel: 'Customer For Timesheet',
            },
          },
        ],
      },
    ];

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should update billing field settings when enabled', () => {
      const updatedQlSettingsData: Partial<MappedQLSettings> = {
        isBillingFieldEnabled: { value: true, version: '1' },
        timeTrackingSupported: { value: true, version: '1' },
        transactionBillingForTimeEnabled: { value: true, version: '1' },
        transactionTimeTrackingEnabled: { value: true, version: '1' },
        firstDayOfWeek: { value: 1, version: '1' },
      };

      const result = updateTimeSheetFields({
        editTimeSheetFields: baseTimeSheetFields,
        updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
        setFormFieldValue: mockSetFormFieldValue,
        notificationFields: mockBaseNotificationFields,
        isFieldsVisible: mockIsFieldsVisible,
        setNotificationFields: mockSetNotificationFields,
        updateVisibleFields: mockUpdateVisibleFields,
      });

      expect(mockSetFormFieldValue).toHaveBeenCalledWith(
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
        true,
      );

      const billingField = result.find(
        (field) =>
          field.key ===
          TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
      );
      expect(billingField?.subFields?.[0].value).toBe(true);
    });

    it('should update billing field settings when disabled', () => {
      const updatedQlSettingsData: Partial<MappedQLSettings> = {
        isBillingFieldEnabled: { value: false, version: '1' },
        timeTrackingSupported: { value: true, version: '1' },
        transactionBillingForTimeEnabled: { value: true, version: '1' },
        transactionTimeTrackingEnabled: { value: true, version: '1' },
        firstDayOfWeek: { value: 1, version: '1' },
      };

      const result = updateTimeSheetFields({
        editTimeSheetFields: baseTimeSheetFields,
        updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
        setFormFieldValue: mockSetFormFieldValue,
        notificationFields: mockBaseNotificationFields,
        isFieldsVisible: mockIsFieldsVisible,
        setNotificationFields: mockSetNotificationFields,
        updateVisibleFields: mockUpdateVisibleFields,
      });

      expect(mockSetFormFieldValue).toHaveBeenCalledWith(
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
        false,
      );

      const billingField = result.find(
        (field) =>
          field.key ===
          TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
      );
      expect(billingField?.subFields?.[0].value).toBe(false);
    });

    it('should update customer for timesheet settings when enabled', () => {
      const updatedQlSettingsData: Partial<MappedQLSettings> = {
        customersForTimeSheetEnabled: { value: true, version: '1' },
        timeTrackingSupported: { value: true, version: '1' },
        transactionBillingForTimeEnabled: { value: true, version: '1' },
        transactionTimeTrackingEnabled: { value: true, version: '1' },
        firstDayOfWeek: { value: 1, version: '1' },
      };

      const result = updateTimeSheetFields({
        editTimeSheetFields: baseTimeSheetFields,
        updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
        setFormFieldValue: mockSetFormFieldValue,
        notificationFields: mockBaseNotificationFields,
        isFieldsVisible: mockIsFieldsVisible,
        setNotificationFields: mockSetNotificationFields,
        updateVisibleFields: mockUpdateVisibleFields,
      });

      expect(mockSetFormFieldValue).toHaveBeenCalledWith(
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CUSTOMER_FOR_TIMESHEET_ENABLED,
        true,
      );

      const customerField = result.find(
        (field) =>
          field.key ===
          TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CUSTOMER_FOR_TIMESHEET_ENABLED,
      );
      expect(customerField?.subFields?.[0].value).toBe(true);
    });

    it('should update customer for timesheet settings when disabled', () => {
      const updatedQlSettingsData: Partial<MappedQLSettings> = {
        customersForTimeSheetEnabled: { value: false, version: '1' },
        timeTrackingSupported: { value: true, version: '1' },
        transactionBillingForTimeEnabled: { value: true, version: '1' },
        transactionTimeTrackingEnabled: { value: true, version: '1' },
        firstDayOfWeek: { value: 1, version: '1' },
      };

      const result = updateTimeSheetFields({
        editTimeSheetFields: baseTimeSheetFields,
        updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
        setFormFieldValue: mockSetFormFieldValue,
        notificationFields: mockBaseNotificationFields,
        isFieldsVisible: mockIsFieldsVisible,
        setNotificationFields: mockSetNotificationFields,
        updateVisibleFields: mockUpdateVisibleFields,
      });

      expect(mockSetFormFieldValue).toHaveBeenCalledWith(
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CUSTOMER_FOR_TIMESHEET_ENABLED,
        false,
      );

      const customerField = result.find(
        (field) =>
          field.key ===
          TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CUSTOMER_FOR_TIMESHEET_ENABLED,
      );
      expect(customerField?.subFields?.[0].value).toBe(false);
    });

    it('should handle missing customer and billing field settings', () => {
      const updatedQlSettingsData: Partial<MappedQLSettings> = {
        timeTrackingSupported: { value: true, version: '1' },
        transactionBillingForTimeEnabled: { value: true, version: '1' },
        transactionTimeTrackingEnabled: { value: true, version: '1' },
        firstDayOfWeek: { value: 1, version: '1' },
      };

      const result = updateTimeSheetFields({
        editTimeSheetFields: baseTimeSheetFields,
        updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
        setFormFieldValue: mockSetFormFieldValue,
        notificationFields: mockBaseNotificationFields,
        isFieldsVisible: mockIsFieldsVisible,
        setNotificationFields: mockSetNotificationFields,
        updateVisibleFields: mockUpdateVisibleFields,
      });

      expect(mockSetFormFieldValue).toHaveBeenCalledWith(
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
        false,
      );
      expect(mockSetFormFieldValue).toHaveBeenCalledWith(
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CUSTOMER_FOR_TIMESHEET_ENABLED,
        false,
      );

      const billingField = result.find(
        (field) =>
          field.key ===
          TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
      );
      const customerField = result.find(
        (field) =>
          field.key ===
          TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CUSTOMER_FOR_TIMESHEET_ENABLED,
      );
      expect(billingField?.subFields?.[0].value).toBe(false);
      expect(customerField?.subFields?.[0].value).toBe(false);
    });

    it('should correctly process all field keys including subfields', () => {
      const fieldsWithSubfields: ITimeSheetFieldOption[] = [
        {
          key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
          value: false,
          id: 'isBillingFieldEnabled',
          title: 'Billing Field',
          ariaLabel: 'Billing Field',
          tooltipText: 'Billing Field',
          disabled: false,
          detail: {
            title: 'Billing Field',
            subtitle: 'Billing Field',
            ariaLabel: 'Billing Field',
          },
          subFields: [
            {
              key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.BILLING_RATE_FOR_TIME_ENABLED,
              value: false,
              id: 'billingRateForTime',
              title: 'Billing Rate',
              ariaLabel: 'Billing Rate',
              tooltipText: 'Billing Rate',
              disabled: false,
              detail: {
                title: 'Billing Rate',
                subtitle: 'Billing Rate',
                ariaLabel: 'Billing Rate',
              },
            },
            {
              key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_BILLABLE,
              value: false,
              id: 'requireBillable',
              title: 'Require Billable',
              ariaLabel: 'Require Billable',
              tooltipText: 'Require Billable',
              disabled: false,
              detail: {
                title: 'Require Billable',
                subtitle: 'Require Billable',
                ariaLabel: 'Require Billable',
              },
            },
          ],
        },
      ];

      const updatedQlSettingsData: Partial<MappedQLSettings> = {
        isBillingFieldEnabled: { value: true, version: '1' },
        billingRateForTimeEnabled: { value: true, version: '1' },
        requireBillable: { value: true, version: '1' },
        timeTrackingSupported: { value: true, version: '1' },
        transactionBillingForTimeEnabled: { value: true, version: '1' },
        transactionTimeTrackingEnabled: { value: true, version: '1' },
      };

      const result = updateTimeSheetFields({
        editTimeSheetFields: fieldsWithSubfields,
        updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
        setFormFieldValue: mockSetFormFieldValue,
        notificationFields: mockBaseNotificationFields,
        isFieldsVisible: mockIsFieldsVisible,
        setNotificationFields: mockSetNotificationFields,
        updateVisibleFields: mockUpdateVisibleFields,
      });

      // Verify main field was processed
      expect(mockSetFormFieldValue).toHaveBeenCalledWith(
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
        true,
      );

      // Verify first subfield was processed
      expect(mockSetFormFieldValue).toHaveBeenCalledWith(
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.BILLING_RATE_FOR_TIME_ENABLED,
        true,
      );

      // Verify second subfield was processed
      expect(mockSetFormFieldValue).toHaveBeenCalledWith(
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_BILLABLE,
        true,
      );

      // Verify the values were correctly set in the result
      const billingField = result.find(
        (field) =>
          field.key ===
          TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
      );

      expect(billingField?.subFields).toBeDefined();
      expect(billingField?.subFields?.length).toBe(2);
      expect(billingField?.subFields?.[0].value).toBe(true);
      expect(billingField?.subFields?.[1].value).toBe(true);
    });

    it('should process service field settings', () => {
      const serviceFields: ITimeSheetFieldOption[] = [
        {
          key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_SERVICE_ENABLE,
          value: false,
          id: 'isServiceEnabled',
          title: 'Service Field',
          ariaLabel: 'Service Field',
          tooltipText: 'Service Field',
          disabled: false,
          detail: {
            title: 'Service Field',
            subtitle: 'Service Field',
            ariaLabel: 'Service Field',
          },
          subFields: [
            {
              key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_SERVICE_ENABLE,
              value: false,
              id: 'isServiceEnabled',
              title: 'Service Field',
              ariaLabel: 'Service Field',
              tooltipText: 'Service Field',
              disabled: false,
              detail: {
                title: 'Service Field',
                subtitle: 'Service Field',
                ariaLabel: 'Service Field',
              },
            },
          ],
        },
      ];

      const updatedQlSettingsData: Partial<MappedQLSettings> = {
        useItemForTime: { value: true, version: '1' },
        timeTrackingSupported: { value: true, version: '1' },
        transactionBillingForTimeEnabled: { value: true, version: '1' },
        transactionTimeTrackingEnabled: { value: true, version: '1' },
      };

      const result = updateTimeSheetFields({
        editTimeSheetFields: serviceFields,
        updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
        setFormFieldValue: mockSetFormFieldValue,
        notificationFields: mockBaseNotificationFields,
        isFieldsVisible: mockIsFieldsVisible,
        setNotificationFields: mockSetNotificationFields,
        updateVisibleFields: mockUpdateVisibleFields,
      });

      // Verify form field value is set
      expect(mockSetFormFieldValue).toHaveBeenCalledWith(
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_SERVICE_ENABLE,
        true,
      );

      // Verify the field is updated in the result
      const serviceField = result.find(
        (field) =>
          field.key === TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_SERVICE_ENABLE,
      );
      expect(serviceField?.subFields?.[0].value).toBe(true);
    });

    describe('Billing Rate and Required Billable Settings', () => {
      const billingFieldsWithSubfields: ITimeSheetFieldOption[] = [
        {
          key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
          value: false,
          id: 'isBillingFieldEnabled',
          title: 'Billing Field',
          ariaLabel: 'Billing Field',
          tooltipText: 'Billing Field',
          disabled: false,
          detail: {
            title: 'Billing Field',
            subtitle: 'Billing Field',
            ariaLabel: 'Billing Field',
          },
          subFields: [
            {
              key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.BILLING_RATE_FOR_TIME_ENABLED,
              value: false,
              id: 'billingRateForTime',
              title: 'Billing Rate',
              ariaLabel: 'Billing Rate',
              tooltipText: 'Billing Rate',
              disabled: false,
              detail: {
                title: 'Billing Rate',
                subtitle: 'Billing Rate',
                ariaLabel: 'Billing Rate',
              },
            },
            {
              key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_BILLABLE,
              value: false,
              id: 'requireBillable',
              title: 'Require Billable',
              ariaLabel: 'Require Billable',
              tooltipText: 'Require Billable',
              disabled: false,
              detail: {
                title: 'Require Billable',
                subtitle: 'Require Billable',
                ariaLabel: 'Require Billable',
              },
            },
          ],
        },
      ];

      beforeEach(() => {
        jest.clearAllMocks();
      });

      it('should update billing rate settings when enabled', () => {
        const updatedQlSettingsData: Partial<MappedQLSettings> = {
          billingRateForTimeEnabled: { value: true, version: '1' },
          timeTrackingSupported: { value: true, version: '1' },
          transactionBillingForTimeEnabled: { value: true, version: '1' },
          transactionTimeTrackingEnabled: { value: true, version: '1' },
        };

        const result = updateTimeSheetFields({
          editTimeSheetFields: billingFieldsWithSubfields,
          updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
          setFormFieldValue: mockSetFormFieldValue,
          notificationFields: mockBaseNotificationFields,
          isFieldsVisible: mockIsFieldsVisible,
          setNotificationFields: mockSetNotificationFields,
          updateVisibleFields: mockUpdateVisibleFields,
        });

        // Verify form field value is set
        expect(mockSetFormFieldValue).toHaveBeenCalledWith(
          TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.BILLING_RATE_FOR_TIME_ENABLED,
          true,
        );

        // Verify the field is updated in the result
        const billingField = result.find(
          (field) =>
            field.key ===
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
        );
        const billingRateSubfield = billingField?.subFields?.find(
          (field) =>
            field.key ===
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.BILLING_RATE_FOR_TIME_ENABLED,
        );
        expect(billingRateSubfield?.value).toBe(true);
      });

      it('should update require billable settings when enabled', () => {
        const updatedQlSettingsData: Partial<MappedQLSettings> = {
          requireBillable: { value: true, version: '1' },
          timeTrackingSupported: { value: true, version: '1' },
          transactionBillingForTimeEnabled: { value: true, version: '1' },
          transactionTimeTrackingEnabled: { value: true, version: '1' },
        };

        const result = updateTimeSheetFields({
          editTimeSheetFields: billingFieldsWithSubfields,
          updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
          setFormFieldValue: mockSetFormFieldValue,
          notificationFields: mockBaseNotificationFields,
          isFieldsVisible: mockIsFieldsVisible,
          setNotificationFields: mockSetNotificationFields,
          updateVisibleFields: mockUpdateVisibleFields,
        });

        // Verify form field value is set
        expect(mockSetFormFieldValue).toHaveBeenCalledWith(
          TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_BILLABLE,
          true,
        );

        // Verify the field is updated in the result
        const billingField = result.find(
          (field) =>
            field.key ===
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
        );
        const requireBillableSubfield = billingField?.subFields?.find(
          (field) =>
            field.key ===
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_BILLABLE,
        );
        expect(requireBillableSubfield?.value).toBe(true);
      });

      it('should handle both billing rate and require billable settings together', () => {
        const updatedQlSettingsData: Partial<MappedQLSettings> = {
          billingRateForTimeEnabled: { value: true, version: '1' },
          requireBillable: { value: true, version: '1' },
          timeTrackingSupported: { value: true, version: '1' },
          transactionBillingForTimeEnabled: { value: true, version: '1' },
          transactionTimeTrackingEnabled: { value: true, version: '1' },
        };

        const result = updateTimeSheetFields({
          editTimeSheetFields: billingFieldsWithSubfields,
          updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
          setFormFieldValue: mockSetFormFieldValue,
          notificationFields: mockBaseNotificationFields,
          isFieldsVisible: mockIsFieldsVisible,
          setNotificationFields: mockSetNotificationFields,
          updateVisibleFields: mockUpdateVisibleFields,
        });

        // Verify both form field values are set
        expect(mockSetFormFieldValue).toHaveBeenCalledWith(
          TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.BILLING_RATE_FOR_TIME_ENABLED,
          true,
        );
        expect(mockSetFormFieldValue).toHaveBeenCalledWith(
          TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_BILLABLE,
          true,
        );

        // Verify both fields are updated in the result
        const billingField = result.find(
          (field) =>
            field.key ===
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
        );
        const billingRateSubfield = billingField?.subFields?.find(
          (field) =>
            field.key ===
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.BILLING_RATE_FOR_TIME_ENABLED,
        );
        const requireBillableSubfield = billingField?.subFields?.find(
          (field) =>
            field.key ===
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_BILLABLE,
        );
        expect(billingRateSubfield?.value).toBe(true);
        expect(requireBillableSubfield?.value).toBe(true);
      });
    });

    describe('Class and Location Settings', () => {
      const classAndLocationFields: ITimeSheetFieldOption[] = [
        {
          key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
          value: false,
          id: 'classEnabled',
          title: 'Class Field',
          ariaLabel: 'Class Field',
          tooltipText: 'Class Field',
          disabled: false,
          detail: {
            title: 'Class Field',
            subtitle: 'Class Field',
            ariaLabel: 'Class Field',
          },
          subFields: [
            {
              key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
              value: false,
              id: 'classEnabled',
              title: 'Class Field',
              ariaLabel: 'Class Field',
              tooltipText: 'Class Field',
              disabled: false,
              detail: {
                title: 'Class Field',
                subtitle: 'Class Field',
                ariaLabel: 'Class Field',
              },
            },
          ],
        },
        {
          key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.LOCATION_FOR_TIMESHEET_ENABLED,
          value: false,
          id: 'locationEnabled',
          title: 'Location Field',
          ariaLabel: 'Location Field',
          tooltipText: 'Location Field',
          disabled: false,
          detail: {
            title: 'Location Field',
            subtitle: 'Location Field',
            ariaLabel: 'Location Field',
          },
          subFields: [
            {
              key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.LOCATION_FOR_TIMESHEET_ENABLED,
              value: false,
              id: 'locationEnabled',
              title: 'Location Field',
              ariaLabel: 'Location Field',
              tooltipText: 'Location Field',
              disabled: false,
              detail: {
                title: 'Location Field',
                subtitle: 'Location Field',
                ariaLabel: 'Location Field',
              },
            },
          ],
        },
      ];

      beforeEach(() => {
        jest.clearAllMocks();
      });

      it('should update class settings when enabled', () => {
        const updatedQlSettingsData: Partial<MappedQLSettings> = {
          classForTimeSheetEnabled: { value: true, version: '1' },
          timeTrackingSupported: { value: true, version: '1' },
          transactionBillingForTimeEnabled: { value: true, version: '1' },
          transactionTimeTrackingEnabled: { value: true, version: '1' },
        };

        const result = updateTimeSheetFields({
          editTimeSheetFields: classAndLocationFields,
          updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
          setFormFieldValue: mockSetFormFieldValue,
          notificationFields: mockBaseNotificationFields,
          isFieldsVisible: mockIsFieldsVisible,
          setNotificationFields: mockSetNotificationFields,
          updateVisibleFields: mockUpdateVisibleFields,
        });

        // Verify form field value is set
        expect(mockSetFormFieldValue).toHaveBeenCalledWith(
          TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
          true,
        );

        // Verify the field is updated in the result
        const classField = result.find(
          (field) =>
            field.key === TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
        );
        expect(classField?.subFields?.[0].value).toBe(true);
      });

      it('should update location settings when enabled', () => {
        const updatedQlSettingsData: Partial<MappedQLSettings> = {
          locationForTimeSheetEnabled: { value: true, version: '1' },
          timeTrackingSupported: { value: true, version: '1' },
          transactionBillingForTimeEnabled: { value: true, version: '1' },
          transactionTimeTrackingEnabled: { value: true, version: '1' },
        };

        const result = updateTimeSheetFields({
          editTimeSheetFields: classAndLocationFields,
          updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
          setFormFieldValue: mockSetFormFieldValue,
          notificationFields: mockBaseNotificationFields,
          isFieldsVisible: mockIsFieldsVisible,
          setNotificationFields: mockSetNotificationFields,
          updateVisibleFields: mockUpdateVisibleFields,
        });

        // Verify form field value is set
        expect(mockSetFormFieldValue).toHaveBeenCalledWith(
          TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.LOCATION_FOR_TIMESHEET_ENABLED,
          true,
        );

        // Verify the field is updated in the result
        const locationField = result.find(
          (field) =>
            field.key ===
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.LOCATION_FOR_TIMESHEET_ENABLED,
        );
        expect(locationField?.subFields?.[0].value).toBe(true);
      });

      it('should handle both class and location settings together', () => {
        const updatedQlSettingsData: Partial<MappedQLSettings> = {
          classForTimeSheetEnabled: { value: true, version: '1' },
          locationForTimeSheetEnabled: { value: true, version: '1' },
          timeTrackingSupported: { value: true, version: '1' },
          transactionBillingForTimeEnabled: { value: true, version: '1' },
          transactionTimeTrackingEnabled: { value: true, version: '1' },
        };

        const result = updateTimeSheetFields({
          editTimeSheetFields: classAndLocationFields,
          updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
          setFormFieldValue: mockSetFormFieldValue,
          notificationFields: mockBaseNotificationFields,
          isFieldsVisible: mockIsFieldsVisible,
          setNotificationFields: mockSetNotificationFields,
          updateVisibleFields: mockUpdateVisibleFields,
        });

        // Verify both form field values are set
        expect(mockSetFormFieldValue).toHaveBeenCalledWith(
          TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
          true,
        );
        expect(mockSetFormFieldValue).toHaveBeenCalledWith(
          TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.LOCATION_FOR_TIMESHEET_ENABLED,
          true,
        );

        // Verify both fields are updated in the result
        const classField = result.find(
          (field) =>
            field.key === TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
        );
        const locationField = result.find(
          (field) =>
            field.key ===
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.LOCATION_FOR_TIMESHEET_ENABLED,
        );
        expect(classField?.subFields?.[0].value).toBe(true);
        expect(locationField?.subFields?.[0].value).toBe(true);
      });
    });

    describe('Timesheet Entry Notes Settings', () => {
      const notesFields: ITimeSheetFieldOption[] = [
        {
          key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_NOTES_ENABLE,
          value: false,
          id: 'timeSheetEntryNotes',
          title: 'Time Sheet Entry Notes',
          ariaLabel: 'Time Sheet Entry Notes',
          tooltipText: 'Time Sheet Entry Notes',
          disabled: false,
          detail: {
            title: 'Time Sheet Entry Notes',
            subtitle: 'Time Sheet Entry Notes',
            ariaLabel: 'Time Sheet Entry Notes',
          },
          subFields: [
            {
              key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_NOTES_ENABLE,
              value: false,
              id: 'timeSheetEntryNotes',
              title: 'Time Sheet Entry Notes',
              ariaLabel: 'Time Sheet Entry Notes',
              tooltipText: 'Time Sheet Entry Notes',
              disabled: false,
              detail: {
                title: 'Time Sheet Entry Notes',
                subtitle: 'Time Sheet Entry Notes',
                ariaLabel: 'Time Sheet Entry Notes',
              },
            },
            {
              key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_EDITS_NOTES_ENABLED,
              value: false,
              id: 'timeSheetEntryEditNotes',
              title: 'Time Sheet Entry Edit Notes',
              ariaLabel: 'Time Sheet Entry Edit Notes',
              tooltipText: 'Time Sheet Entry Edit Notes',
              disabled: false,
              detail: {
                title: 'Time Sheet Entry Edit Notes',
                subtitle: 'Time Sheet Entry Edit Notes',
                ariaLabel: 'Time Sheet Entry Edit Notes',
              },
            },
            {
              key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_ENTRY_MAKES_NOTES_REQUIRES_ENABLES,
              value: false,
              id: 'timeSheetEntryMakesNotesRequired',
              title: 'Time Sheet Entry Makes Notes Required',
              ariaLabel: 'Time Sheet Entry Makes Notes Required',
              tooltipText: 'Time Sheet Entry Makes Notes Required',
              disabled: false,
              detail: {
                title: 'Time Sheet Entry Makes Notes Required',
                subtitle: 'Time Sheet Entry Makes Notes Required',
                ariaLabel: 'Time Sheet Entry Makes Notes Required',
              },
            },
          ],
        },
      ];

      beforeEach(() => {
        jest.clearAllMocks();
      });

      it('should update timesheet entry notes settings and notification visibility when enabled', () => {
        const updatedQlSettingsData: Partial<MappedQLSettings> = {
          timeSheetEntryNotesEnabled: { value: true, version: '1' },
          timeTrackingSupported: { value: true, version: '1' },
          transactionBillingForTimeEnabled: { value: true, version: '1' },
          transactionTimeTrackingEnabled: { value: true, version: '1' },
        };

        const result = updateTimeSheetFields({
          editTimeSheetFields: notesFields,
          updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
          setFormFieldValue: mockSetFormFieldValue,
          notificationFields: mockBaseNotificationFields,
          isFieldsVisible: mockIsFieldsVisible,
          setNotificationFields: mockSetNotificationFields,
          updateVisibleFields: mockUpdateVisibleFields,
        });

        // Verify form field value is set
        expect(mockSetFormFieldValue).toHaveBeenCalledWith(
          TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_NOTES_ENABLE,
          true,
        );

        // Verify notification fields are updated
        expect(mockSetNotificationFields).toHaveBeenCalled();
        expect(mockUpdateVisibleFields).toHaveBeenCalledWith({
          ...mockIsFieldsVisible,
          notifyWhenNotesAreAddedOrEdited: true,
        });

        // Verify the field is updated in the result
        const notesField = result.find(
          (field) =>
            field.key ===
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_NOTES_ENABLE,
        );
        expect(notesField?.subFields?.[0].value).toBe(true);
      });

      it('should update timesheet entry notes settings and notification visibility when disabled', () => {
        const updatedQlSettingsData: Partial<MappedQLSettings> = {
          timeSheetEntryNotesEnabled: { value: false, version: '1' },
          timeTrackingSupported: { value: true, version: '1' },
          transactionBillingForTimeEnabled: { value: true, version: '1' },
          transactionTimeTrackingEnabled: { value: true, version: '1' },
        };

        const result = updateTimeSheetFields({
          editTimeSheetFields: notesFields,
          updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
          setFormFieldValue: mockSetFormFieldValue,
          notificationFields: mockBaseNotificationFields,
          isFieldsVisible: mockIsFieldsVisible,
          setNotificationFields: mockSetNotificationFields,
          updateVisibleFields: mockUpdateVisibleFields,
        });

        // Verify form field value is set
        expect(mockSetFormFieldValue).toHaveBeenCalledWith(
          TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_NOTES_ENABLE,
          false,
        );

        // Verify notification fields are updated
        expect(mockSetNotificationFields).toHaveBeenCalled();
        expect(mockUpdateVisibleFields).toHaveBeenCalledWith({
          ...mockIsFieldsVisible,
          notifyWhenNotesAreAddedOrEdited: false,
        });

        // Verify the field is updated in the result
        const notesField = result.find(
          (field) =>
            field.key ===
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_NOTES_ENABLE,
        );
        expect(notesField?.subFields?.[0].value).toBe(false);
      });

      it('should handle missing timesheet entry notes settings', () => {
        const updatedQlSettingsData: Partial<MappedQLSettings> = {
          timeTrackingSupported: { value: true, version: '1' },
          transactionBillingForTimeEnabled: { value: true, version: '1' },
          transactionTimeTrackingEnabled: { value: true, version: '1' },
        };

        const result = updateTimeSheetFields({
          editTimeSheetFields: notesFields,
          updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
          setFormFieldValue: mockSetFormFieldValue,
          notificationFields: mockBaseNotificationFields,
          isFieldsVisible: mockIsFieldsVisible,
          setNotificationFields: mockSetNotificationFields,
          updateVisibleFields: mockUpdateVisibleFields,
        });

        // Verify form field value defaults to false
        expect(mockSetFormFieldValue).toHaveBeenCalledWith(
          TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_NOTES_ENABLE,
          false,
        );

        // Verify notification fields are updated
        expect(mockSetNotificationFields).toHaveBeenCalled();
        expect(mockUpdateVisibleFields).toHaveBeenCalledWith({
          ...mockIsFieldsVisible,
          notifyWhenNotesAreAddedOrEdited: false,
        });

        // Verify the field is updated in the result
        const notesField = result.find(
          (field) =>
            field.key ===
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_NOTES_ENABLE,
        );
        expect(notesField?.subFields?.[0].value).toBe(false);
      });
    });

    describe('Required Field Settings', () => {
      const requiredFields: ITimeSheetFieldOption[] = [
        {
          key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_CLASS,
          value: false,
          id: 'requireClass',
          title: 'Require Class',
          ariaLabel: 'Require Class',
          tooltipText: 'Require Class',
          disabled: false,
          detail: {
            title: 'Require Class',
            subtitle: 'Require Class',
            ariaLabel: 'Require Class',
          },
        },
        {
          key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_LOCATION,
          value: false,
          id: 'requireLocation',
          title: 'Require Location',
          ariaLabel: 'Require Location',
          tooltipText: 'Require Location',
          disabled: false,
          detail: {
            title: 'Require Location',
            subtitle: 'Require Location',
            ariaLabel: 'Require Location',
          },
        },
        {
          key: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_SERVICE_ITEM,
          value: false,
          id: 'requireServiceItem',
          title: 'Require Service Item',
          ariaLabel: 'Require Service Item',
          tooltipText: 'Require Service Item',
          disabled: false,
          detail: {
            title: 'Require Service Item',
            subtitle: 'Require Service Item',
            ariaLabel: 'Require Service Item',
          },
        },
      ];

      beforeEach(() => {
        jest.clearAllMocks();
      });

      // Parameterized test configuration for required fields
      const requiredFieldTestCases = [
        {
          fieldName: 'class',
          fieldKey: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_CLASS,
          qlSettingKey: 'classRequired',
          testCases: [
            {
              description: 'when enabled',
              qlValue: true,
              expectedValue: true,
            },
            {
              description: 'when disabled',
              qlValue: false,
              expectedValue: false,
            },
            {
              description: 'when missing',
              qlValue: undefined,
              expectedValue: false,
            },
          ],
        },
        {
          fieldName: 'location',
          fieldKey: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_LOCATION,
          qlSettingKey: 'locationRequired',
          testCases: [
            {
              description: 'when enabled',
              qlValue: true,
              expectedValue: true,
            },
            {
              description: 'when disabled',
              qlValue: false,
              expectedValue: false,
            },
            {
              description: 'when missing',
              qlValue: undefined,
              expectedValue: false,
            },
          ],
        },
        {
          fieldName: 'service item',
          fieldKey: TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_SERVICE_ITEM,
          qlSettingKey: 'serviceItemRequired',
          testCases: [
            {
              description: 'when enabled',
              qlValue: true,
              expectedValue: true,
            },
            {
              description: 'when disabled',
              qlValue: false,
              expectedValue: false,
            },
            {
              description: 'when missing',
              qlValue: undefined,
              expectedValue: false,
            },
          ],
        },
      ];

      // Parameterized tests for individual required fields
      requiredFieldTestCases.forEach(
        ({ fieldName, fieldKey, qlSettingKey, testCases }) => {
          describe(`${fieldName} required field`, () => {
            testCases.forEach(({ description, qlValue, expectedValue }) => {
              it(`should update require ${fieldName} settings ${description}`, () => {
                const updatedQlSettingsData: Partial<MappedQLSettings> = {
                  timeTrackingSupported: { value: true, version: '1' },
                  transactionBillingForTimeEnabled: {
                    value: true,
                    version: '1',
                  },
                  transactionTimeTrackingEnabled: { value: true, version: '1' },
                };

                // Add the specific field setting if it's not undefined
                if (qlValue !== undefined) {
                  (updatedQlSettingsData as any)[qlSettingKey] = {
                    value: qlValue,
                    version: '1',
                  };
                }

                const result = updateTimeSheetFields({
                  editTimeSheetFields: requiredFields,
                  updatedQlSettingsData:
                    updatedQlSettingsData as MappedQLSettings,
                  setFormFieldValue: mockSetFormFieldValue,
                  notificationFields: mockBaseNotificationFields,
                  isFieldsVisible: mockIsFieldsVisible,
                  setNotificationFields: mockSetNotificationFields,
                  updateVisibleFields: mockUpdateVisibleFields,
                });

                // Verify form field value is set
                expect(mockSetFormFieldValue).toHaveBeenCalledWith(
                  fieldKey,
                  expectedValue,
                );

                // Verify the field is updated in the result
                const field = result.find((field) => field.key === fieldKey);
                expect(field?.value).toBe(expectedValue);
              });
            });
          });
        },
      );

      it('should handle all required field settings together', () => {
        const updatedQlSettingsData: Partial<MappedQLSettings> = {
          classRequired: { value: true, version: '1' },
          locationRequired: { value: true, version: '1' },
          serviceItemRequired: { value: true, version: '1' },
          timeTrackingSupported: { value: true, version: '1' },
          transactionBillingForTimeEnabled: { value: true, version: '1' },
          transactionTimeTrackingEnabled: { value: true, version: '1' },
        };

        const result = updateTimeSheetFields({
          editTimeSheetFields: requiredFields,
          updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
          setFormFieldValue: mockSetFormFieldValue,
          notificationFields: mockBaseNotificationFields,
          isFieldsVisible: mockIsFieldsVisible,
          setNotificationFields: mockSetNotificationFields,
          updateVisibleFields: mockUpdateVisibleFields,
        });

        // Verify all form field values are set
        expect(mockSetFormFieldValue).toHaveBeenCalledWith(
          TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_CLASS,
          true,
        );
        expect(mockSetFormFieldValue).toHaveBeenCalledWith(
          TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_LOCATION,
          true,
        );
        expect(mockSetFormFieldValue).toHaveBeenCalledWith(
          TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_SERVICE_ITEM,
          true,
        );

        // Verify all fields are updated in the result
        const requireClassField = result.find(
          (field) =>
            field.key === TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_CLASS,
        );
        const requireLocationField = result.find(
          (field) =>
            field.key ===
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_LOCATION,
        );
        const requireServiceItemField = result.find(
          (field) =>
            field.key ===
            TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_SERVICE_ITEM,
        );
        expect(requireClassField?.value).toBe(true);
        expect(requireLocationField?.value).toBe(true);
        expect(requireServiceItemField?.value).toBe(true);
      });
    });
  });

  describe('updateNotificationFields', () => {
    const mockSetFormFieldValue = jest.fn();
    const mockUpdateVisibleFields = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should update clock in notification settings', () => {
      const updatedQlSettingsData: Partial<MappedQLSettings> = {
        clockInNotificationReminderEmail: { value: true, version: '1' },
        clockInNotificationReminderMobile: { value: true, version: '1' },
        clockInNotificationReminderTime: { value: '09:00', version: '1' },
        timeTrackingSupported: { value: true, version: '1' },
        transactionBillingForTimeEnabled: { value: true, version: '1' },
        transactionTimeTrackingEnabled: { value: true, version: '1' },
        firstDayOfWeek: { value: 1, version: '1' },
        isBillingFieldEnabled: { value: true, version: '1' },
      };

      updateNotificationFields({
        notificationFields: mockBaseNotificationFields,
        updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
        intl: mockIntl,
        setFormFieldValue: mockSetFormFieldValue,
        isFieldsVisible: mockIsFieldsVisible,
        updateVisibleFields: mockUpdateVisibleFields,
        isUKLocale: mockIsUKLocale,
      });

      expect(mockSetFormFieldValue).toHaveBeenCalledWith(
        NotificationField.CLOCK_IN_TIME,
        '9:00 AM',
      );
      expect(mockSetFormFieldValue).toHaveBeenCalledWith(
        NotificationField.CLOCK_IN_EMAIL,
        true,
      );
      expect(mockSetFormFieldValue).toHaveBeenCalledWith(
        NotificationField.CLOCK_IN_MOBILE,
        true,
      );
    });

    it('should update clock out notification settings', () => {
      const updatedQlSettingsData: Partial<MappedQLSettings> = {
        clockOutNotificationReminderEmail: { value: true, version: '1' },
        clockOutNotificationReminderMobile: { value: true, version: '1' },
        clockOutNotificationReminderTime: { value: '17:00', version: '1' },
        timeTrackingSupported: { value: true, version: '1' },
        transactionBillingForTimeEnabled: { value: true, version: '1' },
        transactionTimeTrackingEnabled: { value: true, version: '1' },
        firstDayOfWeek: { value: 1, version: '1' },
        isBillingFieldEnabled: { value: true, version: '1' },
      };

      updateNotificationFields({
        notificationFields: mockBaseNotificationFields,
        updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
        intl: mockIntl,
        setFormFieldValue: mockSetFormFieldValue,
        isFieldsVisible: mockIsFieldsVisible,
        updateVisibleFields: mockUpdateVisibleFields,
        isUKLocale: mockIsUKLocale,
      });

      expect(mockSetFormFieldValue).toHaveBeenCalledWith(
        NotificationField.CLOCK_OUT_TIME,
        '5:00 PM',
      );
      expect(mockSetFormFieldValue).toHaveBeenCalledWith(
        NotificationField.CLOCK_OUT_EMAIL,
        true,
      );
      expect(mockSetFormFieldValue).toHaveBeenCalledWith(
        NotificationField.CLOCK_OUT_MOBILE,
        true,
      );
    });

    it('should update notification enabled days', () => {
      const updatedQlSettingsData: Partial<MappedQLSettings> = {
        clockInNotificationReminderEmail: { value: true, version: '1' },
        notificationEnabledForDays: {
          value: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
          version: '1',
        },
        timeTrackingSupported: { value: true, version: '1' },
        transactionBillingForTimeEnabled: { value: true, version: '1' },
        transactionTimeTrackingEnabled: { value: true, version: '1' },
        firstDayOfWeek: { value: 1, version: '1' },
        isBillingFieldEnabled: { value: true, version: '1' },
      };

      updateNotificationFields({
        notificationFields: mockBaseNotificationFields,
        updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
        intl: mockIntl,
        setFormFieldValue: mockSetFormFieldValue,
        isFieldsVisible: mockIsFieldsVisible,
        updateVisibleFields: mockUpdateVisibleFields,
        isUKLocale: mockIsUKLocale,
      });

      expect(mockSetFormFieldValue).toHaveBeenCalledWith(
        NotificationFieldKey.NOTIFICATION_ENABLED_FOR_DAYS,
        ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
      );
    });

    it('should update notes update notification settings', () => {
      const updatedQlSettingsData: Partial<MappedQLSettings> = {
        timeSheetEntryNotesEnabled: { value: true, version: '1' },
        notifyAdminOnTimeSheetNotesEditEnabled: { value: true, version: '1' },
        notifyGroupManagerOnTimeSheetNotesEditEnabled: {
          value: true,
          version: '1',
        },
        timeTrackingSupported: { value: true, version: '1' },
        transactionBillingForTimeEnabled: { value: true, version: '1' },
        transactionTimeTrackingEnabled: { value: true, version: '1' },
        firstDayOfWeek: { value: 1, version: '1' },
        isBillingFieldEnabled: { value: true, version: '1' },
      };

      updateNotificationFields({
        notificationFields: mockBaseNotificationFields,
        updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
        intl: mockIntl,
        setFormFieldValue: mockSetFormFieldValue,
        isFieldsVisible: mockIsFieldsVisible,
        updateVisibleFields: mockUpdateVisibleFields,
        isUKLocale: mockIsUKLocale,
      });

      expect(mockSetFormFieldValue).toHaveBeenCalledWith(
        NotificationFieldKey.NOTIFY_WHEN_NOTES_ARE_ADDED_OR_EDITED,
        NotificationRecipient.ADMINS_AND_MANAGERS,
      );
    });

    describe('Clock In/Out Update Notifications', () => {
      beforeEach(() => {
        jest.clearAllMocks();
      });

      it('should notify both admins and managers when both are enabled', () => {
        const updatedQlSettingsData: Partial<MappedQLSettings> = {
          notifyAdminOnClockOutOverrideEnabled: { value: true, version: '1' },
          notifyManagerOnClockOutOverrideEnabled: { value: true, version: '1' },
          editClockOutTimeEnabled: { value: true, version: '1' },
          timeTrackingSupported: { value: true, version: '1' },
          transactionBillingForTimeEnabled: { value: true, version: '1' },
          transactionTimeTrackingEnabled: { value: true, version: '1' },
        };

        updateNotificationFields({
          notificationFields: mockBaseNotificationFields,
          updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
          intl: mockIntl,
          setFormFieldValue: mockSetFormFieldValue,
          isFieldsVisible: mockIsFieldsVisible,
          updateVisibleFields: mockUpdateVisibleFields,
          isUKLocale: mockIsUKLocale,
        });

        // Verify notification field is visible
        expect(mockUpdateVisibleFields).toHaveBeenCalledWith({
          ...mockIsFieldsVisible,
          notifyWhenClockInOutTimeAdjusted: true,
        });

        // Verify correct notification recipient is set
        expect(mockSetFormFieldValue).toHaveBeenCalledWith(
          NotificationFieldKey.NOTIFY_WHEN_CLOCK_IN_OUT_UPDATED,
          NotificationRecipient.ADMINS_AND_MANAGERS,
        );
      });

      it('should notify only admins when only admin notification is enabled', () => {
        const updatedQlSettingsData: Partial<MappedQLSettings> = {
          notifyAdminOnClockOutOverrideEnabled: { value: true, version: '1' },
          notifyManagerOnClockOutOverrideEnabled: {
            value: false,
            version: '1',
          },
          editClockOutTimeEnabled: { value: true, version: '1' },
          timeTrackingSupported: { value: true, version: '1' },
          transactionBillingForTimeEnabled: { value: true, version: '1' },
          transactionTimeTrackingEnabled: { value: true, version: '1' },
        };

        updateNotificationFields({
          notificationFields: mockBaseNotificationFields,
          updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
          intl: mockIntl,
          setFormFieldValue: mockSetFormFieldValue,
          isFieldsVisible: mockIsFieldsVisible,
          updateVisibleFields: mockUpdateVisibleFields,
          isUKLocale: mockIsUKLocale,
        });

        // Verify notification field is visible
        expect(mockUpdateVisibleFields).toHaveBeenCalledWith({
          ...mockIsFieldsVisible,
          notifyWhenClockInOutTimeAdjusted: true,
        });

        // Verify correct notification recipient is set
        expect(mockSetFormFieldValue).toHaveBeenCalledWith(
          NotificationFieldKey.NOTIFY_WHEN_CLOCK_IN_OUT_UPDATED,
          NotificationRecipient.ADMINS_ONLY,
        );
      });

      it('should notify only managers when only manager notification is enabled', () => {
        const updatedQlSettingsData: Partial<MappedQLSettings> = {
          notifyAdminOnClockOutOverrideEnabled: { value: false, version: '1' },
          notifyManagerOnClockOutOverrideEnabled: { value: true, version: '1' },
          editClockOutTimeEnabled: { value: true, version: '1' },
          timeTrackingSupported: { value: true, version: '1' },
          transactionBillingForTimeEnabled: { value: true, version: '1' },
          transactionTimeTrackingEnabled: { value: true, version: '1' },
        };

        updateNotificationFields({
          notificationFields: mockBaseNotificationFields,
          updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
          intl: mockIntl,
          setFormFieldValue: mockSetFormFieldValue,
          isFieldsVisible: mockIsFieldsVisible,
          updateVisibleFields: mockUpdateVisibleFields,
          isUKLocale: mockIsUKLocale,
        });

        // Verify notification field is visible
        expect(mockUpdateVisibleFields).toHaveBeenCalledWith({
          ...mockIsFieldsVisible,
          notifyWhenClockInOutTimeAdjusted: true,
        });

        // Verify correct notification recipient is set
        expect(mockSetFormFieldValue).toHaveBeenCalledWith(
          NotificationFieldKey.NOTIFY_WHEN_CLOCK_IN_OUT_UPDATED,
          NotificationRecipient.MANAGERS_ONLY,
        );
      });

      it('should notify no one when both notifications are disabled', () => {
        const updatedQlSettingsData: Partial<MappedQLSettings> = {
          notifyAdminOnClockOutOverrideEnabled: { value: false, version: '1' },
          notifyManagerOnClockOutOverrideEnabled: {
            value: false,
            version: '1',
          },
          editClockOutTimeEnabled: { value: true, version: '1' },
          timeTrackingSupported: { value: true, version: '1' },
          transactionBillingForTimeEnabled: { value: true, version: '1' },
          transactionTimeTrackingEnabled: { value: true, version: '1' },
        };

        updateNotificationFields({
          notificationFields: mockBaseNotificationFields,
          updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
          intl: mockIntl,
          setFormFieldValue: mockSetFormFieldValue,
          isFieldsVisible: mockIsFieldsVisible,
          updateVisibleFields: mockUpdateVisibleFields,
          isUKLocale: mockIsUKLocale,
        });

        // Verify notification field is visible
        expect(mockUpdateVisibleFields).toHaveBeenCalledWith({
          ...mockIsFieldsVisible,
          notifyWhenClockInOutTimeAdjusted: true,
        });

        // Verify correct notification recipient is set
        expect(mockSetFormFieldValue).toHaveBeenCalledWith(
          NotificationFieldKey.NOTIFY_WHEN_CLOCK_IN_OUT_UPDATED,
          NotificationRecipient.NONE,
        );
      });

      it('should hide notification field when edit clock out time is disabled', () => {
        const updatedQlSettingsData: Partial<MappedQLSettings> = {
          notifyAdminOnClockOutOverrideEnabled: { value: true, version: '1' },
          notifyManagerOnClockOutOverrideEnabled: { value: true, version: '1' },
          editClockOutTimeEnabled: { value: false, version: '1' },
          timeTrackingSupported: { value: true, version: '1' },
          transactionBillingForTimeEnabled: { value: true, version: '1' },
          transactionTimeTrackingEnabled: { value: true, version: '1' },
        };

        updateNotificationFields({
          notificationFields: mockBaseNotificationFields,
          updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
          intl: mockIntl,
          setFormFieldValue: mockSetFormFieldValue,
          isFieldsVisible: mockIsFieldsVisible,
          updateVisibleFields: mockUpdateVisibleFields,
          isUKLocale: mockIsUKLocale,
        });

        // Verify notification field is hidden
        expect(mockUpdateVisibleFields).toHaveBeenCalledWith({
          ...mockIsFieldsVisible,
          notifyWhenClockInOutTimeAdjusted: false,
        });

        // Verify correct notification recipient is still set
        expect(mockSetFormFieldValue).toHaveBeenCalledWith(
          NotificationFieldKey.NOTIFY_WHEN_CLOCK_IN_OUT_UPDATED,
          NotificationRecipient.ADMINS_AND_MANAGERS,
        );
      });

      it('should handle missing notification settings and default to none', () => {
        const updatedQlSettingsData: Partial<MappedQLSettings> = {
          editClockOutTimeEnabled: { value: true, version: '1' },
          timeTrackingSupported: { value: true, version: '1' },
          transactionBillingForTimeEnabled: { value: true, version: '1' },
          transactionTimeTrackingEnabled: { value: true, version: '1' },
        };

        updateNotificationFields({
          notificationFields: mockBaseNotificationFields,
          updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
          intl: mockIntl,
          setFormFieldValue: mockSetFormFieldValue,
          isFieldsVisible: mockIsFieldsVisible,
          updateVisibleFields: mockUpdateVisibleFields,
          isUKLocale: mockIsUKLocale,
        });

        // Verify notification field is visible
        expect(mockUpdateVisibleFields).toHaveBeenCalledWith({
          ...mockIsFieldsVisible,
          notifyWhenClockInOutTimeAdjusted: true,
        });

        // Verify defaults to no notifications
        expect(mockSetFormFieldValue).toHaveBeenCalledWith(
          NotificationFieldKey.NOTIFY_WHEN_CLOCK_IN_OUT_UPDATED,
          NotificationRecipient.NONE,
        );
      });
    });

    describe('Timesheet Notes Update Notifications', () => {
      beforeEach(() => {
        jest.clearAllMocks();
      });

      it('should notify both admins and managers when both are enabled and notes feature is enabled', () => {
        const updatedQlSettingsData: Partial<MappedQLSettings> = {
          notifyAdminOnTimeSheetNotesEditEnabled: { value: true, version: '1' },
          notifyGroupManagerOnTimeSheetNotesEditEnabled: {
            value: true,
            version: '1',
          },
          timeSheetEntryNotesEnabled: { value: true, version: '1' },
          timeTrackingSupported: { value: true, version: '1' },
          transactionBillingForTimeEnabled: { value: true, version: '1' },
          transactionTimeTrackingEnabled: { value: true, version: '1' },
        };

        updateNotificationFields({
          notificationFields: mockBaseNotificationFields,
          updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
          intl: mockIntl,
          setFormFieldValue: mockSetFormFieldValue,
          isFieldsVisible: mockIsFieldsVisible,
          updateVisibleFields: mockUpdateVisibleFields,
          isUKLocale: mockIsUKLocale,
        });

        // Verify notification field is visible
        expect(mockUpdateVisibleFields).toHaveBeenCalledWith({
          ...mockIsFieldsVisible,
          notifyWhenNotesAreAddedOrEdited: true,
        });

        // Verify correct notification recipient is set
        expect(mockSetFormFieldValue).toHaveBeenCalledWith(
          NotificationFieldKey.NOTIFY_WHEN_NOTES_ARE_ADDED_OR_EDITED,
          NotificationRecipient.ADMINS_AND_MANAGERS,
        );
      });

      it('should notify only admins when only admin notification is enabled and notes feature is enabled', () => {
        const updatedQlSettingsData: Partial<MappedQLSettings> = {
          notifyAdminOnTimeSheetNotesEditEnabled: { value: true, version: '1' },
          notifyGroupManagerOnTimeSheetNotesEditEnabled: {
            value: false,
            version: '1',
          },
          timeSheetEntryNotesEnabled: { value: true, version: '1' },
          timeTrackingSupported: { value: true, version: '1' },
          transactionBillingForTimeEnabled: { value: true, version: '1' },
          transactionTimeTrackingEnabled: { value: true, version: '1' },
        };

        updateNotificationFields({
          notificationFields: mockBaseNotificationFields,
          updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
          intl: mockIntl,
          setFormFieldValue: mockSetFormFieldValue,
          isFieldsVisible: mockIsFieldsVisible,
          updateVisibleFields: mockUpdateVisibleFields,
          isUKLocale: mockIsUKLocale,
        });

        // Verify notification field is visible
        expect(mockUpdateVisibleFields).toHaveBeenCalledWith({
          ...mockIsFieldsVisible,
          notifyWhenNotesAreAddedOrEdited: true,
        });

        // Verify correct notification recipient is set
        expect(mockSetFormFieldValue).toHaveBeenCalledWith(
          NotificationFieldKey.NOTIFY_WHEN_NOTES_ARE_ADDED_OR_EDITED,
          NotificationRecipient.ADMINS_ONLY,
        );
      });

      it('should notify only managers when only manager notification is enabled and notes feature is enabled', () => {
        const updatedQlSettingsData: Partial<MappedQLSettings> = {
          notifyAdminOnTimeSheetNotesEditEnabled: {
            value: false,
            version: '1',
          },
          notifyGroupManagerOnTimeSheetNotesEditEnabled: {
            value: true,
            version: '1',
          },
          timeSheetEntryNotesEnabled: { value: true, version: '1' },
          timeTrackingSupported: { value: true, version: '1' },
          transactionBillingForTimeEnabled: { value: true, version: '1' },
          transactionTimeTrackingEnabled: { value: true, version: '1' },
        };

        updateNotificationFields({
          notificationFields: mockBaseNotificationFields,
          updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
          intl: mockIntl,
          setFormFieldValue: mockSetFormFieldValue,
          isFieldsVisible: mockIsFieldsVisible,
          updateVisibleFields: mockUpdateVisibleFields,
          isUKLocale: mockIsUKLocale,
        });

        // Verify notification field is visible
        expect(mockUpdateVisibleFields).toHaveBeenCalledWith({
          ...mockIsFieldsVisible,
          notifyWhenNotesAreAddedOrEdited: true,
        });

        // Verify correct notification recipient is set
        expect(mockSetFormFieldValue).toHaveBeenCalledWith(
          NotificationFieldKey.NOTIFY_WHEN_NOTES_ARE_ADDED_OR_EDITED,
          NotificationRecipient.MANAGERS_ONLY,
        );
      });

      it('should notify no one when both notifications are disabled but notes feature is enabled', () => {
        const updatedQlSettingsData: Partial<MappedQLSettings> = {
          notifyAdminOnTimeSheetNotesEditEnabled: {
            value: false,
            version: '1',
          },
          notifyGroupManagerOnTimeSheetNotesEditEnabled: {
            value: false,
            version: '1',
          },
          timeSheetEntryNotesEnabled: { value: true, version: '1' },
          timeTrackingSupported: { value: true, version: '1' },
          transactionBillingForTimeEnabled: { value: true, version: '1' },
          transactionTimeTrackingEnabled: { value: true, version: '1' },
        };

        updateNotificationFields({
          notificationFields: mockBaseNotificationFields,
          updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
          intl: mockIntl,
          setFormFieldValue: mockSetFormFieldValue,
          isFieldsVisible: mockIsFieldsVisible,
          updateVisibleFields: mockUpdateVisibleFields,
          isUKLocale: mockIsUKLocale,
        });

        // Verify notification field is visible
        expect(mockUpdateVisibleFields).toHaveBeenCalledWith({
          ...mockIsFieldsVisible,
          notifyWhenNotesAreAddedOrEdited: true,
        });

        // Verify correct notification recipient is set
        expect(mockSetFormFieldValue).toHaveBeenCalledWith(
          NotificationFieldKey.NOTIFY_WHEN_NOTES_ARE_ADDED_OR_EDITED,
          NotificationRecipient.NONE,
        );
      });

      it('should hide notification field when notes feature is disabled', () => {
        const updatedQlSettingsData: Partial<MappedQLSettings> = {
          notifyAdminOnTimeSheetNotesEditEnabled: { value: true, version: '1' },
          notifyGroupManagerOnTimeSheetNotesEditEnabled: {
            value: true,
            version: '1',
          },
          timeSheetEntryNotesEnabled: { value: false, version: '1' },
          timeTrackingSupported: { value: true, version: '1' },
          transactionBillingForTimeEnabled: { value: true, version: '1' },
          transactionTimeTrackingEnabled: { value: true, version: '1' },
        };

        updateNotificationFields({
          notificationFields: mockBaseNotificationFields,
          updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
          intl: mockIntl,
          setFormFieldValue: mockSetFormFieldValue,
          isFieldsVisible: mockIsFieldsVisible,
          updateVisibleFields: mockUpdateVisibleFields,
          isUKLocale: mockIsUKLocale,
        });

        // Verify notification field is hidden
        expect(mockUpdateVisibleFields).toHaveBeenCalledWith({
          ...mockIsFieldsVisible,
          notifyWhenNotesAreAddedOrEdited: false,
        });

        // Verify correct notification recipient is still set
        expect(mockSetFormFieldValue).toHaveBeenCalledWith(
          NotificationFieldKey.NOTIFY_WHEN_NOTES_ARE_ADDED_OR_EDITED,
          NotificationRecipient.ADMINS_AND_MANAGERS,
        );
      });

      it('should handle missing timesheet notes feature setting and hide notification field', () => {
        const updatedQlSettingsData: Partial<MappedQLSettings> = {
          notifyAdminOnTimeSheetNotesEditEnabled: { value: true, version: '1' },
          notifyGroupManagerOnTimeSheetNotesEditEnabled: {
            value: true,
            version: '1',
          },
          timeTrackingSupported: { value: true, version: '1' },
          transactionBillingForTimeEnabled: { value: true, version: '1' },
          transactionTimeTrackingEnabled: { value: true, version: '1' },
        };

        updateNotificationFields({
          notificationFields: mockBaseNotificationFields,
          updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
          intl: mockIntl,
          setFormFieldValue: mockSetFormFieldValue,
          isFieldsVisible: mockIsFieldsVisible,
          updateVisibleFields: mockUpdateVisibleFields,
          isUKLocale: mockIsUKLocale,
        });

        // Verify notification field is hidden when feature setting is missing
        expect(mockUpdateVisibleFields).toHaveBeenCalledWith({
          ...mockIsFieldsVisible,
          notifyWhenNotesAreAddedOrEdited: false,
        });

        // Verify correct notification recipient is still set
        expect(mockSetFormFieldValue).toHaveBeenCalledWith(
          NotificationFieldKey.NOTIFY_WHEN_NOTES_ARE_ADDED_OR_EDITED,
          NotificationRecipient.ADMINS_AND_MANAGERS,
        );
      });

      it('should handle missing notification settings and default to none when notes feature is enabled', () => {
        const updatedQlSettingsData: Partial<MappedQLSettings> = {
          timeSheetEntryNotesEnabled: { value: true, version: '1' },
          timeTrackingSupported: { value: true, version: '1' },
          transactionBillingForTimeEnabled: { value: true, version: '1' },
          transactionTimeTrackingEnabled: { value: true, version: '1' },
        };

        updateNotificationFields({
          notificationFields: mockBaseNotificationFields,
          updatedQlSettingsData: updatedQlSettingsData as MappedQLSettings,
          intl: mockIntl,
          setFormFieldValue: mockSetFormFieldValue,
          isFieldsVisible: mockIsFieldsVisible,
          updateVisibleFields: mockUpdateVisibleFields,
          isUKLocale: mockIsUKLocale,
        });

        // Verify notification field is visible
        expect(mockUpdateVisibleFields).toHaveBeenCalledWith({
          ...mockIsFieldsVisible,
          notifyWhenNotesAreAddedOrEdited: true,
        });

        // Verify defaults to no notifications
        expect(mockSetFormFieldValue).toHaveBeenCalledWith(
          NotificationFieldKey.NOTIFY_WHEN_NOTES_ARE_ADDED_OR_EDITED,
          NotificationRecipient.NONE,
        );
      });
    });
  });
});
