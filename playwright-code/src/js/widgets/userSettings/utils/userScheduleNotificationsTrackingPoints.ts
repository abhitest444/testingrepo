import { TrackingPoint } from 'src/js/common/useClickTracking';

const WORKER_SCHEDULE_NOTIFICATIONS_BASE_CONFIG = {
  org: 'sbseg',
  purpose: 'prod',
  scope: 'time',
  scope_area: 'timeentrymanagement',
  screen: 'assignments',
  object: 'widget',
  object_detail: 'notification_preferences',
  action: 'engaged',
  ui_access_point: 'page',
} as const;

export const USER_SCHEDULE_NOTIFICATIONS_TRACKING_POINTS: {
  [key: string]: TrackingPoint;
} = {
  // Company vs custom settings radios (UI currently commented out — wire when enabled)
  WORKER_NOTIF_USE_COMPANY_SETTINGS: {
    ...WORKER_SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'radio_button',
    ui_object_detail: 'worker_notif_use_company_settings',
    ui_action: 'clicked',
  },
  WORKER_NOTIF_USE_CUSTOM_SETTINGS: {
    ...WORKER_SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'radio_button',
    ui_object_detail: 'worker_notif_use_custom_settings',
    ui_action: 'clicked',
  },

  // Manage company settings link (inside company radio label — UI currently commented out)
  WORKER_NOTIF_MANAGE_COMPANY_LINK: {
    ...WORKER_SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'link',
    ui_object_detail: 'worker_notif_manage_company_link',
    ui_action: 'clicked',
  },

  // 'When assigned shift is published or changed' — Email
  WORKER_SCHEDULE_SHIFT_PUBLISHED_EMAIL_ON: {
    ...WORKER_SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'checkbox',
    ui_object_detail: 'worker_schedule_shift_published_email_on',
    ui_action: 'enabled',
  },
  WORKER_SCHEDULE_SHIFT_PUBLISHED_EMAIL_OFF: {
    ...WORKER_SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'checkbox',
    ui_object_detail: 'worker_schedule_shift_published_email_off',
    ui_action: 'disabled',
  },
  // 'When assigned shift is published or changed' — Mobile
  WORKER_SCHEDULE_SHIFT_PUBLISHED_MOBILE_ON: {
    ...WORKER_SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'checkbox',
    ui_object_detail: 'worker_schedule_shift_published_mobile_on',
    ui_action: 'enabled',
  },
  WORKER_SCHEDULE_SHIFT_PUBLISHED_MOBILE_OFF: {
    ...WORKER_SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'checkbox',
    ui_object_detail: 'worker_schedule_shift_published_mobile_off',
    ui_action: 'disabled',
  },

  // 'One hour before shift starts' — Email
  WORKER_SCHEDULE_SHIFT_START_EMAIL_ON: {
    ...WORKER_SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'checkbox',
    ui_object_detail: 'worker_schedule_shift_start_email_on',
    ui_action: 'enabled',
  },
  WORKER_SCHEDULE_SHIFT_START_EMAIL_OFF: {
    ...WORKER_SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'checkbox',
    ui_object_detail: 'worker_schedule_shift_start_email_off',
    ui_action: 'disabled',
  },
  // 'One hour before shift starts' — Mobile
  WORKER_SCHEDULE_SHIFT_START_MOBILE_ON: {
    ...WORKER_SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'checkbox',
    ui_object_detail: 'worker_schedule_shift_start_mobile_on',
    ui_action: 'enabled',
  },
  WORKER_SCHEDULE_SHIFT_START_MOBILE_OFF: {
    ...WORKER_SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'checkbox',
    ui_object_detail: 'worker_schedule_shift_start_mobile_off',
    ui_action: 'disabled',
  },

  // 'Forgot to clock in after shift started' — Email
  WORKER_SCHEDULE_FORGOT_CLOCK_IN_EMAIL_ON: {
    ...WORKER_SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'checkbox',
    ui_object_detail: 'worker_schedule_forgot_clock_in_email_on',
    ui_action: 'enabled',
  },
  WORKER_SCHEDULE_FORGOT_CLOCK_IN_EMAIL_OFF: {
    ...WORKER_SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'checkbox',
    ui_object_detail: 'worker_schedule_forgot_clock_in_email_off',
    ui_action: 'disabled',
  },
  // 'Forgot to clock in after shift started' — Mobile
  WORKER_SCHEDULE_FORGOT_CLOCK_IN_MOBILE_ON: {
    ...WORKER_SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'checkbox',
    ui_object_detail: 'worker_schedule_forgot_clock_in_mobile_on',
    ui_action: 'enabled',
  },
  WORKER_SCHEDULE_FORGOT_CLOCK_IN_MOBILE_OFF: {
    ...WORKER_SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'checkbox',
    ui_object_detail: 'worker_schedule_forgot_clock_in_mobile_off',
    ui_action: 'disabled',
  },

  // 'Forgot to clock out after shift ended' — Email
  WORKER_SCHEDULE_FORGOT_CLOCK_OUT_EMAIL_ON: {
    ...WORKER_SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'checkbox',
    ui_object_detail: 'worker_schedule_forgot_clock_out_email_on',
    ui_action: 'enabled',
  },
  WORKER_SCHEDULE_FORGOT_CLOCK_OUT_EMAIL_OFF: {
    ...WORKER_SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'checkbox',
    ui_object_detail: 'worker_schedule_forgot_clock_out_email_off',
    ui_action: 'disabled',
  },
  // 'Forgot to clock out after shift ended' — Mobile
  WORKER_SCHEDULE_FORGOT_CLOCK_OUT_MOBILE_ON: {
    ...WORKER_SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'checkbox',
    ui_object_detail: 'worker_schedule_forgot_clock_out_mobile_on',
    ui_action: 'enabled',
  },
  WORKER_SCHEDULE_FORGOT_CLOCK_OUT_MOBILE_OFF: {
    ...WORKER_SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'checkbox',
    ui_object_detail: 'worker_schedule_forgot_clock_out_mobile_off',
    ui_action: 'disabled',
  },

  // 'Team member hasn't clocked in after shift started. Notify manager' — Email
  WORKER_SCHEDULE_NO_CLOCKIN_NOTIFY_MGR_EMAIL_ON: {
    ...WORKER_SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'checkbox',
    ui_object_detail: 'worker_schedule_no_clockin_notify_mgr_email_on',
    ui_action: 'enabled',
  },
  WORKER_SCHEDULE_NO_CLOCKIN_NOTIFY_MGR_EMAIL_OFF: {
    ...WORKER_SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'checkbox',
    ui_object_detail: 'worker_schedule_no_clockin_notify_mgr_email_off',
    ui_action: 'disabled',
  },
  // 'Team member hasn't clocked in after shift started. Notify manager' — Mobile
  WORKER_SCHEDULE_NO_CLOCKIN_NOTIFY_MGR_MOBILE_ON: {
    ...WORKER_SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'checkbox',
    ui_object_detail: 'worker_schedule_no_clockin_notify_mgr_mobile_on',
    ui_action: 'enabled',
  },
  WORKER_SCHEDULE_NO_CLOCKIN_NOTIFY_MGR_MOBILE_OFF: {
    ...WORKER_SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'checkbox',
    ui_object_detail: 'worker_schedule_no_clockin_notify_mgr_mobile_off',
    ui_action: 'disabled',
  },
};
