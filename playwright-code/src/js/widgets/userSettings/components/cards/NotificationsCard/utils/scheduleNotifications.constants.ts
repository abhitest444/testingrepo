import { TimeTracking_NotificationType } from 'src/__generated__/timeTracking/graphql';

/**
 * User Settings → Notifications → Schedule — row keys, message ids, and notificationType mapping.
 */

/** NLS message ids for schedule notification row labels (userSettings catalog). */
export const SCHEDULE_NOTIFICATION_USER_SETTINGS_LABEL_IDS = {
  SHIFT_PUBLISHED_OR_CHANGED: 'notifications.schedule.shift.published',
  ONE_HOUR_BEFORE_SHIFT: 'notifications.schedule.shift.reminder',
  FORGOT_CLOCK_IN_AFTER_SHIFT_STARTED:
    'notifications.schedule.row.forgot-clock-in-after-shift-started',
  FORGOT_CLOCK_OUT_AFTER_SHIFT_ENDED:
    'notifications.schedule.row.forgot-clock-out-after-shift-ended',
  LATE_CLOCK_IN_NOTIFY_MANAGER:
    'notifications.schedule.row.late-clock-in-notify-manager',
} as const;

export const SCHEDULE_NOTIFICATION_USER_SETTINGS_ROW_KEYS = [
  'shiftPublishedOrChanged',
  'oneHourBeforeShift',
  'forgotClockInAfterShiftStarted',
  'forgotClockOutAfterShiftEnded',
  'lateClockInNotifyManager',
] as const;

export type ScheduleNotificationUserSettingsRowKey =
  (typeof SCHEDULE_NOTIFICATION_USER_SETTINGS_ROW_KEYS)[number];

export type WorkerScheduleTrackingPrefix =
  | 'WORKER_SCHEDULE_SHIFT_PUBLISHED'
  | 'WORKER_SCHEDULE_SHIFT_START'
  | 'WORKER_SCHEDULE_FORGOT_CLOCK_IN'
  | 'WORKER_SCHEDULE_FORGOT_CLOCK_OUT'
  | 'WORKER_SCHEDULE_NO_CLOCKIN_NOTIFY_MGR';

export const SCHEDULE_NOTIFICATION_ROW_KEY_TO_TRACKING_PREFIX: Record<
  ScheduleNotificationUserSettingsRowKey,
  WorkerScheduleTrackingPrefix
> = {
  shiftPublishedOrChanged: 'WORKER_SCHEDULE_SHIFT_PUBLISHED',
  oneHourBeforeShift: 'WORKER_SCHEDULE_SHIFT_START',
  forgotClockInAfterShiftStarted: 'WORKER_SCHEDULE_FORGOT_CLOCK_IN',
  forgotClockOutAfterShiftEnded: 'WORKER_SCHEDULE_FORGOT_CLOCK_OUT',
  lateClockInNotifyManager: 'WORKER_SCHEDULE_NO_CLOCKIN_NOTIFY_MGR',
};

/** Maps each view/edit row key to the API notificationType it corresponds to. */
export const SCHEDULE_NOTIFICATION_ROW_KEY_TO_TYPE: Record<
  ScheduleNotificationUserSettingsRowKey,
  TimeTracking_NotificationType
> = {
  shiftPublishedOrChanged: TimeTracking_NotificationType.ShiftPublished,
  oneHourBeforeShift: TimeTracking_NotificationType.ShiftStartBefore,
  forgotClockInAfterShiftStarted: TimeTracking_NotificationType.ShiftStartAfter,
  forgotClockOutAfterShiftEnded: TimeTracking_NotificationType.ShiftEndAfter,
  lateClockInNotifyManager:
    TimeTracking_NotificationType.ShiftStartAfterManager,
} as const;
