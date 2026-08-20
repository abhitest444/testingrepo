import {
  getTrackingFieldName,
  buildNotificationTrackingData,
} from 'src/js/widgets/timeTrackingSettings/hooks/trackingHelper';
import {
  ReminderRole,
  ReminderPosition,
  ReminderFieldType,
  ApprovalRemindersbasedOn,
  TrackingElementType,
} from 'src/js/widgets/timeTrackingSettings/constants';
import { APPROVAL_SETTINGS_TRACKING_FIELDS } from 'src/js/common/useClickTracking';

describe('trackingHelper', () => {
  describe('getTrackingFieldName', () => {
    describe('MANAGER role', () => {
      describe('DAY_OF_WEEK mode', () => {
        it('should return correct field name for FIRST reminder TIME field', () => {
          const result = getTrackingFieldName(
            ReminderRole.MANAGER,
            ApprovalRemindersbasedOn.DAY_OF_WEEK,
            ReminderPosition.FIRST,
            ReminderFieldType.TIME,
          );
          expect(result).toBe('dow_remind_managers_time');
        });

        it('should return correct field name for FIRST reminder DAY field', () => {
          const result = getTrackingFieldName(
            ReminderRole.MANAGER,
            ApprovalRemindersbasedOn.DAY_OF_WEEK,
            ReminderPosition.FIRST,
            ReminderFieldType.DAY,
          );
          expect(result).toBe('dow_remind_managers_day');
        });

        it('should return correct field name for FIRST reminder checkbox', () => {
          const result = getTrackingFieldName(
            ReminderRole.MANAGER,
            ApprovalRemindersbasedOn.DAY_OF_WEEK,
            ReminderPosition.FIRST,
            'checkbox',
          );
          expect(result).toBe('dow_remind_managers_approve');
        });

        it('should return correct field name for SECOND reminder TIME field', () => {
          const result = getTrackingFieldName(
            ReminderRole.MANAGER,
            ApprovalRemindersbasedOn.DAY_OF_WEEK,
            ReminderPosition.SECOND,
            ReminderFieldType.TIME,
          );
          expect(result).toBe('dow_remind_managers_time_prior_week');
        });

        it('should return correct field name for SECOND reminder DAY field', () => {
          const result = getTrackingFieldName(
            ReminderRole.MANAGER,
            ApprovalRemindersbasedOn.DAY_OF_WEEK,
            ReminderPosition.SECOND,
            ReminderFieldType.DAY,
          );
          expect(result).toBe('dow_remind_managers_day_prior_week');
        });

        it('should return correct field name for SECOND reminder checkbox', () => {
          const result = getTrackingFieldName(
            ReminderRole.MANAGER,
            ApprovalRemindersbasedOn.DAY_OF_WEEK,
            ReminderPosition.SECOND,
            'checkbox',
          );
          expect(result).toBe('dow_remind_managers_approve_prior_week');
        });
      });

      describe('PAYROLL_CLOSE_DATE mode', () => {
        it('should return correct field name for FIRST reminder TIME field', () => {
          const result = getTrackingFieldName(
            ReminderRole.MANAGER,
            ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
            ReminderPosition.FIRST,
            ReminderFieldType.TIME,
          );
          expect(result).toBe('pay_period_remind_set_time_reminder_time');
        });

        it('should return correct field name for FIRST reminder DAY field', () => {
          const result = getTrackingFieldName(
            ReminderRole.MANAGER,
            ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
            ReminderPosition.FIRST,
            ReminderFieldType.DAY,
          );
          expect(result).toBe('pay_period_remind_set_time_reminder_day');
        });

        it('should return correct field name for FIRST reminder checkbox', () => {
          const result = getTrackingFieldName(
            ReminderRole.MANAGER,
            ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
            ReminderPosition.FIRST,
            'checkbox',
          );
          expect(result).toBe('pay_period_remind_set_time_payroll_close_date');
        });

        it('should return correct field name for SECOND reminder TIME field', () => {
          const result = getTrackingFieldName(
            ReminderRole.MANAGER,
            ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
            ReminderPosition.SECOND,
            ReminderFieldType.TIME,
          );
          expect(result).toBe(
            'pay_period_remind_payroll_close_date_reminder_time',
          );
        });

        it('should return correct field name for SECOND reminder DAY field', () => {
          const result = getTrackingFieldName(
            ReminderRole.MANAGER,
            ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
            ReminderPosition.SECOND,
            ReminderFieldType.DAY,
          );
          expect(result).toBe(
            'pay_period_remind_payroll_close_date_reminder_day',
          );
        });

        it('should return correct field name for SECOND reminder checkbox', () => {
          const result = getTrackingFieldName(
            ReminderRole.MANAGER,
            ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
            ReminderPosition.SECOND,
            'checkbox',
          );
          expect(result).toBe(
            'pay_period_remind_if_not_approved_by_payroll_close',
          );
        });
      });
    });

    describe('EMPLOYEE role', () => {
      describe('DAY_OF_WEEK mode', () => {
        it('should return correct field name for FIRST reminder TIME field', () => {
          const result = getTrackingFieldName(
            ReminderRole.EMPLOYEE,
            ApprovalRemindersbasedOn.DAY_OF_WEEK,
            ReminderPosition.FIRST,
            ReminderFieldType.TIME,
          );
          expect(result).toBe('dow_remind_submission_time');
        });

        it('should return correct field name for FIRST reminder DAY field', () => {
          const result = getTrackingFieldName(
            ReminderRole.EMPLOYEE,
            ApprovalRemindersbasedOn.DAY_OF_WEEK,
            ReminderPosition.FIRST,
            ReminderFieldType.DAY,
          );
          expect(result).toBe('dow_remind_submission_day');
        });

        it('should return correct field name for FIRST reminder checkbox', () => {
          const result = getTrackingFieldName(
            ReminderRole.EMPLOYEE,
            ApprovalRemindersbasedOn.DAY_OF_WEEK,
            ReminderPosition.FIRST,
            'checkbox',
          );
          expect(result).toBe('dow_remind_when_not_submitted');
        });

        it('should return correct field name for SECOND reminder TIME field', () => {
          const result = getTrackingFieldName(
            ReminderRole.EMPLOYEE,
            ApprovalRemindersbasedOn.DAY_OF_WEEK,
            ReminderPosition.SECOND,
            ReminderFieldType.TIME,
          );
          expect(result).toBe('dow_remind_submission_time_prior_week');
        });

        it('should return correct field name for SECOND reminder DAY field', () => {
          const result = getTrackingFieldName(
            ReminderRole.EMPLOYEE,
            ApprovalRemindersbasedOn.DAY_OF_WEEK,
            ReminderPosition.SECOND,
            ReminderFieldType.DAY,
          );
          expect(result).toBe('dow_remind_submission_day_prior_week');
        });

        it('should return correct field name for SECOND reminder checkbox', () => {
          const result = getTrackingFieldName(
            ReminderRole.EMPLOYEE,
            ApprovalRemindersbasedOn.DAY_OF_WEEK,
            ReminderPosition.SECOND,
            'checkbox',
          );
          expect(result).toBe('dow_remind_when_not_submitted_prior_week');
        });
      });

      describe('PAYROLL_CLOSE_DATE mode', () => {
        it('should return correct field name for FIRST reminder TIME field', () => {
          const result = getTrackingFieldName(
            ReminderRole.EMPLOYEE,
            ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
            ReminderPosition.FIRST,
            ReminderFieldType.TIME,
          );
          expect(result).toBe(
            'pay_period_submission_remind_set_time_reminder_time',
          );
        });

        it('should return correct field name for FIRST reminder DAY field', () => {
          const result = getTrackingFieldName(
            ReminderRole.EMPLOYEE,
            ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
            ReminderPosition.FIRST,
            ReminderFieldType.DAY,
          );
          expect(result).toBe(
            'pay_period_submission_remind_set_time_reminder_day',
          );
        });

        it('should return correct field name for FIRST reminder checkbox', () => {
          const result = getTrackingFieldName(
            ReminderRole.EMPLOYEE,
            ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
            ReminderPosition.FIRST,
            'checkbox',
          );
          expect(result).toBe('pay_period_remind_set_time_payroll_close_date');
        });

        it('should return correct field name for SECOND reminder TIME field', () => {
          const result = getTrackingFieldName(
            ReminderRole.EMPLOYEE,
            ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
            ReminderPosition.SECOND,
            ReminderFieldType.TIME,
          );
          expect(result).toBe(
            'pay_period_submission_remind_payroll_close_date_reminder_time',
          );
        });

        it('should return correct field name for SECOND reminder DAY field', () => {
          const result = getTrackingFieldName(
            ReminderRole.EMPLOYEE,
            ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
            ReminderPosition.SECOND,
            ReminderFieldType.DAY,
          );
          expect(result).toBe(
            'pay_period_submission_remind_payroll_close_date_reminder_day',
          );
        });

        it('should return correct field name for SECOND reminder checkbox', () => {
          const result = getTrackingFieldName(
            ReminderRole.EMPLOYEE,
            ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
            ReminderPosition.SECOND,
            'checkbox',
          );
          expect(result).toBe(
            'pay_period_Submission_remind_if_not_submitted_by_payroll_close',
          );
        });
      });

      describe('DAILY mode', () => {
        it('should return correct field name for FIRST reminder TIME field', () => {
          const result = getTrackingFieldName(
            ReminderRole.EMPLOYEE,
            ApprovalRemindersbasedOn.DAILY,
            ReminderPosition.FIRST,
            ReminderFieldType.TIME,
          );
          expect(result).toBe('daily_first_reminder_time');
        });

        it('should return correct field name for FIRST reminder DAY field', () => {
          const result = getTrackingFieldName(
            ReminderRole.EMPLOYEE,
            ApprovalRemindersbasedOn.DAILY,
            ReminderPosition.FIRST,
            ReminderFieldType.DAY,
          );
          expect(result).toBe('daily_days_of_week');
        });

        it('should return correct field name for FIRST reminder checkbox', () => {
          const result = getTrackingFieldName(
            ReminderRole.EMPLOYEE,
            ApprovalRemindersbasedOn.DAILY,
            ReminderPosition.FIRST,
            'checkbox',
          );
          expect(result).toBe('daily_first_reminder');
        });

        it('should return correct field name for SECOND reminder TIME field', () => {
          const result = getTrackingFieldName(
            ReminderRole.EMPLOYEE,
            ApprovalRemindersbasedOn.DAILY,
            ReminderPosition.SECOND,
            ReminderFieldType.TIME,
          );
          expect(result).toBe('daily_second_reminder_time');
        });

        it('should return correct field name for SECOND reminder DAY field', () => {
          const result = getTrackingFieldName(
            ReminderRole.EMPLOYEE,
            ApprovalRemindersbasedOn.DAILY,
            ReminderPosition.SECOND,
            ReminderFieldType.DAY,
          );
          expect(result).toBe('daily_days_of_week');
        });

        it('should return correct field name for SECOND reminder checkbox', () => {
          const result = getTrackingFieldName(
            ReminderRole.EMPLOYEE,
            ApprovalRemindersbasedOn.DAILY,
            ReminderPosition.SECOND,
            'checkbox',
          );
          expect(result).toBe('daily_second_reminder');
        });
      });
    });

    describe('error handling', () => {
      it('should return empty string for invalid role', () => {
        const result = getTrackingFieldName(
          'invalid_role' as ReminderRole,
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          ReminderPosition.FIRST,
          ReminderFieldType.TIME,
        );
        expect(result).toBe('');
      });

      it('should return empty string for invalid mode', () => {
        const result = getTrackingFieldName(
          ReminderRole.MANAGER,
          'invalid_mode',
          ReminderPosition.FIRST,
          ReminderFieldType.TIME,
        );
        expect(result).toBe('');
      });

      it('should return empty string for invalid position', () => {
        const result = getTrackingFieldName(
          ReminderRole.MANAGER,
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          'invalid_position' as ReminderPosition,
          ReminderFieldType.TIME,
        );
        expect(result).toBe('');
      });

      it('should return empty string for invalid field type', () => {
        const result = getTrackingFieldName(
          ReminderRole.MANAGER,
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          ReminderPosition.FIRST,
          'invalid_field' as ReminderFieldType,
        );
        expect(result).toBe('');
      });

      it('should return empty string when position mapping does not exist', () => {
        const result = getTrackingFieldName(
          ReminderRole.MANAGER,
          ApprovalRemindersbasedOn.DAILY,
          ReminderPosition.FIRST,
          ReminderFieldType.TIME,
        );
        expect(result).toBe('');
      });
    });
  });

  describe('buildNotificationTrackingData', () => {
    describe('CHECKBOX element type', () => {
      it('should build correct tracking data for enabled checkbox', () => {
        const result = buildNotificationTrackingData(
          TrackingElementType.CHECKBOX,
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          ReminderPosition.FIRST,
          ReminderRole.MANAGER,
          'notifications_approvals',
          true,
        );

        expect(result).toEqual({
          ...APPROVAL_SETTINGS_TRACKING_FIELDS.NOTIFICATION_REMINDER_CHECKBOX,
          object_detail: 'notifications_approvals',
          ui_object_detail: 'dow_remind_managers_approve',
          ui_action: 'enabled',
        });
      });

      it('should build correct tracking data for disabled checkbox', () => {
        const result = buildNotificationTrackingData(
          TrackingElementType.CHECKBOX,
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          ReminderPosition.FIRST,
          ReminderRole.MANAGER,
          'notifications_approvals',
          false,
        );

        expect(result).toEqual({
          ...APPROVAL_SETTINGS_TRACKING_FIELDS.NOTIFICATION_REMINDER_CHECKBOX,
          object_detail: 'notifications_approvals',
          ui_object_detail: 'dow_remind_managers_approve',
          ui_action: 'disabled',
        });
      });

      it('should build correct tracking data for employee submissions checkbox', () => {
        const result = buildNotificationTrackingData(
          TrackingElementType.CHECKBOX,
          ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
          ReminderPosition.SECOND,
          ReminderRole.EMPLOYEE,
          'notifications_submissions',
          true,
        );

        expect(result).toEqual({
          ...APPROVAL_SETTINGS_TRACKING_FIELDS.NOTIFICATION_REMINDER_CHECKBOX,
          object_detail: 'notifications_submissions',
          ui_object_detail:
            'pay_period_Submission_remind_if_not_submitted_by_payroll_close',
          ui_action: 'enabled',
        });
      });
    });

    describe('TIME_DROPDOWN element type', () => {
      it('should build correct tracking data for time dropdown', () => {
        const result = buildNotificationTrackingData(
          TrackingElementType.TIME_DROPDOWN,
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          ReminderPosition.FIRST,
          ReminderRole.MANAGER,
          'notifications_approvals',
        );

        expect(result).toEqual({
          ...APPROVAL_SETTINGS_TRACKING_FIELDS.NOTIFICATION_TIME_DROPDOWN,
          object_detail: 'notifications_approvals',
          ui_object_detail: 'dow_remind_managers_time',
        });
        expect(result.ui_action).not.toContain('enabled');
        expect(result.ui_action).not.toContain('disabled');
      });

      it('should build correct tracking data for employee daily reminder time dropdown', () => {
        const result = buildNotificationTrackingData(
          TrackingElementType.TIME_DROPDOWN,
          ApprovalRemindersbasedOn.DAILY,
          ReminderPosition.SECOND,
          ReminderRole.EMPLOYEE,
          'notifications_submissions',
        );

        expect(result).toEqual({
          ...APPROVAL_SETTINGS_TRACKING_FIELDS.NOTIFICATION_TIME_DROPDOWN,
          object_detail: 'notifications_submissions',
          ui_object_detail: 'daily_second_reminder_time',
        });
      });

      it('should build correct tracking data for payroll close date time dropdown', () => {
        const result = buildNotificationTrackingData(
          TrackingElementType.TIME_DROPDOWN,
          ApprovalRemindersbasedOn.PAYROLL_CLOSE_DATE,
          ReminderPosition.FIRST,
          ReminderRole.MANAGER,
          'notifications_approvals',
        );

        expect(result).toEqual({
          ...APPROVAL_SETTINGS_TRACKING_FIELDS.NOTIFICATION_TIME_DROPDOWN,
          object_detail: 'notifications_approvals',
          ui_object_detail: 'pay_period_remind_set_time_reminder_time',
        });
      });
    });

    describe('DAY_DROPDOWN element type', () => {
      it('should build correct tracking data for day dropdown', () => {
        const result = buildNotificationTrackingData(
          TrackingElementType.DAY_DROPDOWN,
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          ReminderPosition.SECOND,
          ReminderRole.MANAGER,
          'notifications_approvals',
        );

        expect(result).toEqual({
          ...APPROVAL_SETTINGS_TRACKING_FIELDS.NOTIFICATION_DAY_DROPDOWN,
          object_detail: 'notifications_approvals',
          ui_object_detail: 'dow_remind_managers_day_prior_week',
        });
      });

      it('should build correct tracking data for employee submission day dropdown', () => {
        const result = buildNotificationTrackingData(
          TrackingElementType.DAY_DROPDOWN,
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          ReminderPosition.FIRST,
          ReminderRole.EMPLOYEE,
          'notifications_submissions',
        );

        expect(result).toEqual({
          ...APPROVAL_SETTINGS_TRACKING_FIELDS.NOTIFICATION_DAY_DROPDOWN,
          object_detail: 'notifications_submissions',
          ui_object_detail: 'dow_remind_submission_day',
        });
      });

      it('should build correct tracking data for daily days of week dropdown', () => {
        const result = buildNotificationTrackingData(
          TrackingElementType.DAY_DROPDOWN,
          ApprovalRemindersbasedOn.DAILY,
          ReminderPosition.FIRST,
          ReminderRole.EMPLOYEE,
          'notifications_submissions',
        );

        expect(result).toEqual({
          ...APPROVAL_SETTINGS_TRACKING_FIELDS.NOTIFICATION_DAY_DROPDOWN,
          object_detail: 'notifications_submissions',
          ui_object_detail: 'daily_days_of_week',
        });
      });
    });

    describe('error handling', () => {
      it('should throw error for unknown element type', () => {
        expect(() => {
          buildNotificationTrackingData(
            'invalid_element' as TrackingElementType,
            ApprovalRemindersbasedOn.DAY_OF_WEEK,
            ReminderPosition.FIRST,
            ReminderRole.MANAGER,
            'notifications_approvals',
          );
        }).toThrow('Unknown element type: invalid_element');
      });
    });

    describe('isEnabled parameter handling', () => {
      it('should not add ui_action for TIME_DROPDOWN when isEnabled is provided', () => {
        const result = buildNotificationTrackingData(
          TrackingElementType.TIME_DROPDOWN,
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          ReminderPosition.FIRST,
          ReminderRole.MANAGER,
          'notifications_approvals',
          true,
        );

        expect(result.ui_action).toBeDefined();
        expect(result.ui_action).not.toBe('enabled');
      });

      it('should not add ui_action for DAY_DROPDOWN when isEnabled is provided', () => {
        const result = buildNotificationTrackingData(
          TrackingElementType.DAY_DROPDOWN,
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          ReminderPosition.FIRST,
          ReminderRole.MANAGER,
          'notifications_approvals',
          false,
        );

        expect(result.ui_action).toBeDefined();
        expect(result.ui_action).not.toBe('disabled');
      });
    });

    describe('comprehensive scenarios', () => {
      it('should handle manager approval first reminder for all element types', () => {
        const checkboxResult = buildNotificationTrackingData(
          TrackingElementType.CHECKBOX,
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          ReminderPosition.FIRST,
          ReminderRole.MANAGER,
          'notifications_approvals',
          true,
        );

        const timeResult = buildNotificationTrackingData(
          TrackingElementType.TIME_DROPDOWN,
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          ReminderPosition.FIRST,
          ReminderRole.MANAGER,
          'notifications_approvals',
        );

        const dayResult = buildNotificationTrackingData(
          TrackingElementType.DAY_DROPDOWN,
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          ReminderPosition.FIRST,
          ReminderRole.MANAGER,
          'notifications_approvals',
        );

        expect(checkboxResult.ui_object_detail).toBe(
          'dow_remind_managers_approve',
        );
        expect(timeResult.ui_object_detail).toBe('dow_remind_managers_time');
        expect(dayResult.ui_object_detail).toBe('dow_remind_managers_day');
      });

      it('should handle employee submission second reminder for all element types', () => {
        const checkboxResult = buildNotificationTrackingData(
          TrackingElementType.CHECKBOX,
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          ReminderPosition.SECOND,
          ReminderRole.EMPLOYEE,
          'notifications_submissions',
          false,
        );

        const timeResult = buildNotificationTrackingData(
          TrackingElementType.TIME_DROPDOWN,
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          ReminderPosition.SECOND,
          ReminderRole.EMPLOYEE,
          'notifications_submissions',
        );

        const dayResult = buildNotificationTrackingData(
          TrackingElementType.DAY_DROPDOWN,
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          ReminderPosition.SECOND,
          ReminderRole.EMPLOYEE,
          'notifications_submissions',
        );

        expect(checkboxResult.ui_object_detail).toBe(
          'dow_remind_when_not_submitted_prior_week',
        );
        expect(timeResult.ui_object_detail).toBe(
          'dow_remind_submission_time_prior_week',
        );
        expect(dayResult.ui_object_detail).toBe(
          'dow_remind_submission_day_prior_week',
        );
      });

      it('should preserve all base tracking field properties', () => {
        const result = buildNotificationTrackingData(
          TrackingElementType.CHECKBOX,
          ApprovalRemindersbasedOn.DAY_OF_WEEK,
          ReminderPosition.FIRST,
          ReminderRole.MANAGER,
          'notifications_approvals',
          true,
        );

        // Check that base properties from APPROVAL_SETTINGS_TRACKING_FIELDS are preserved
        expect(result.org).toBe(
          APPROVAL_SETTINGS_TRACKING_FIELDS.NOTIFICATION_REMINDER_CHECKBOX.org,
        );
        expect(result.purpose).toBe(
          APPROVAL_SETTINGS_TRACKING_FIELDS.NOTIFICATION_REMINDER_CHECKBOX
            .purpose,
        );
        expect(result.scope).toBe(
          APPROVAL_SETTINGS_TRACKING_FIELDS.NOTIFICATION_REMINDER_CHECKBOX
            .scope,
        );
        expect(result.scope_area).toBe(
          APPROVAL_SETTINGS_TRACKING_FIELDS.NOTIFICATION_REMINDER_CHECKBOX
            .scope_area,
        );
        expect(result.action).toBe(
          APPROVAL_SETTINGS_TRACKING_FIELDS.NOTIFICATION_REMINDER_CHECKBOX
            .action,
        );
        expect(result.object).toBe(
          APPROVAL_SETTINGS_TRACKING_FIELDS.NOTIFICATION_REMINDER_CHECKBOX
            .object,
        );
        expect(result.ui_object).toBe(
          APPROVAL_SETTINGS_TRACKING_FIELDS.NOTIFICATION_REMINDER_CHECKBOX
            .ui_object,
        );
      });
    });
  });
});
