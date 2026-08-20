/**
 * Types for NotificationsCard component
 * Structured to be easily convertible to Redux actions/state
 */

export enum DayOfWeek {
  SUNDAY = 'SUNDAY',
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
}

export enum NotificationsCardMode {
  VIEW = 'VIEW',
  EDIT = 'EDIT',
}
export interface NotificationSettings {
  clockInTime: string;
  clockOutTime: string;
  daysOfWeek: string[];
  clockInEmail: boolean;
  clockInMobile: boolean;
  clockOutEmail: boolean;
  clockOutMobile: boolean;
  // TODO: Enable these settings once they are implemented and available from the API
  // notificationSetting: string;
  // adjustNotification: string;
  // notesNotification: string;
  // scheduleEmail: boolean;
  // scheduleMobile: boolean;
  // shiftReminderEmail: boolean;
  // shiftReminderMobile: boolean;
  // timeOffEmail: boolean;
  // timeOffMobile: boolean;
  // Version tracking for optimistic concurrency control
  versions: {
    clockInReminderTime: string;
    clockInNotificationMedium: string;
    clockOutReminderTime: string;
    clockOutNotificationMedium: string;
    notificationEnabledForDays: string;
  };
}

export interface NotificationState {
  mode: NotificationsCardMode;
  settings: NotificationSettings;
  draftSettings: NotificationSettings;
}

// Redux-ready action types (for future implementation)
export const NOTIFICATION_ACTIONS = {
  SET_MODE: 'notifications/setMode',
  UPDATE_SETTINGS: 'notifications/updateSettings',
  UPDATE_DRAFT: 'notifications/updateDraft',
  SAVE_SETTINGS: 'notifications/saveSettings',
  CANCEL_EDIT: 'notifications/cancelEdit',
  RESET_STATE: 'notifications/resetState',
} as const;

export type NotificationActionType =
  (typeof NOTIFICATION_ACTIONS)[keyof typeof NOTIFICATION_ACTIONS];

export type {
  ManageUserScheduleNotificationsMutation_timeTrackingManageUnifiedUserSettings_TimeTracking_ManageUnifiedUserSettingsPayload_userSettings_TimeTracking_UnifiedUserSettings_scheduleNotifications_TimeTracking_UnifiedUserScheduleNotificationSettings_subscriptions_TimeTracking_NotificationSubscription as ManageScheduleSubscriptionApiResponse,
  ManageUserScheduleNotificationsMutation_timeTrackingManageUnifiedUserSettings_TimeTracking_ManageUnifiedUserSettingsPayload_userSettings_TimeTracking_UnifiedUserSettings as ManageScheduleNotificationsUserSettings,
} from 'src/__generated__/timeTracking/graphql';
