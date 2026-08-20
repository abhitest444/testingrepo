import { TrackingPoint } from 'src/js/common/useClickTracking';

const SCHEDULE_NOTIFICATIONS_BASE_CONFIG = {
  org: 'sbseg',
  purpose: 'prod',
  scope: 'time',
  scope_area: 'time-tracking',
  screen: 'time-settings',
  object: 'widget',
  object_detail: 'notifications_schedule',
  action: 'engaged',
  ui_access_point: 'page',
} as const;

export const SCHEDULE_NOTIFICATIONS_TRACKING_POINTS: {
  [key: string]: TrackingPoint;
} = {
  // 'When assigned shift is published or changed' — Email
  SCHEDULE_SHIFT_PUBLISHED_EMAIL_ON: {
    ...SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'checkbox',
    ui_object_detail: 'schedule_shift_published_email_on',
    ui_action: 'enabled',
  },
  SCHEDULE_SHIFT_PUBLISHED_EMAIL_OFF: {
    ...SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'checkbox',
    ui_object_detail: 'schedule_shift_published_email_off',
    ui_action: 'disabled',
  },
  // 'When assigned shift is published or changed' — Mobile
  SCHEDULE_SHIFT_PUBLISHED_MOBILE_ON: {
    ...SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'checkbox',
    ui_object_detail: 'schedule_shift_published_mobile_on',
    ui_action: 'enabled',
  },
  SCHEDULE_SHIFT_PUBLISHED_MOBILE_OFF: {
    ...SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'checkbox',
    ui_object_detail: 'schedule_shift_published_mobile_off',
    ui_action: 'disabled',
  },
  // 'When assigned shift is published or changed' — Send mode radios
  SCHEDULE_SHIFT_PUBLISHED_ALWAYS_SEND: {
    ...SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'radio_button',
    ui_object_detail: 'schedule_shift_published_always_send',
    ui_action: 'clicked',
  },
  SCHEDULE_SHIFT_PUBLISHED_NEVER_SEND: {
    ...SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'radio_button',
    ui_object_detail: 'schedule_shift_published_never_send',
    ui_action: 'clicked',
  },
  SCHEDULE_SHIFT_PUBLISHED_ASK: {
    ...SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'radio_button',
    ui_object_detail: 'schedule_shift_published_ask',
    ui_action: 'clicked',
  },
  // 'One hour before shift starts' — Email
  SCHEDULE_SHIFT_START_EMAIL_ON: {
    ...SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'checkbox',
    ui_object_detail: 'schedule_shift_start_email_on',
    ui_action: 'enabled',
  },
  SCHEDULE_SHIFT_START_EMAIL_OFF: {
    ...SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'checkbox',
    ui_object_detail: 'schedule_shift_start_email_off',
    ui_action: 'disabled',
  },
  // 'One hour before shift starts' — Mobile
  SCHEDULE_SHIFT_START_MOBILE_ON: {
    ...SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'checkbox',
    ui_object_detail: 'schedule_shift_start_mobile_on',
    ui_action: 'enabled',
  },
  SCHEDULE_SHIFT_START_MOBILE_OFF: {
    ...SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'checkbox',
    ui_object_detail: 'schedule_shift_start_mobile_off',
    ui_action: 'disabled',
  },
  // 'Forgot to clock in after shift started' — Email
  SCHEDULE_FORGOT_CLOCK_IN_EMAIL_ON: {
    ...SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'checkbox',
    ui_object_detail: 'schedule_forgot_clock_in_email_on',
    ui_action: 'enabled',
  },
  SCHEDULE_FORGOT_CLOCK_IN_EMAIL_OFF: {
    ...SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'checkbox',
    ui_object_detail: 'schedule_forgot_clock_in_email_off',
    ui_action: 'disabled',
  },
  // 'Forgot to clock in after shift started' — Mobile
  SCHEDULE_FORGOT_CLOCK_IN_MOBILE_ON: {
    ...SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'checkbox',
    ui_object_detail: 'schedule_forgot_clock_in_mobile_on',
    ui_action: 'enabled',
  },
  SCHEDULE_FORGOT_CLOCK_IN_MOBILE_OFF: {
    ...SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'checkbox',
    ui_object_detail: 'schedule_forgot_clock_in_mobile_off',
    ui_action: 'disabled',
  },
  // 'Forgot to clock out after shift ended' — Email
  SCHEDULE_FORGOT_CLOCK_OUT_EMAIL_ON: {
    ...SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'checkbox',
    ui_object_detail: 'schedule_forgot_clock_out_email_on',
    ui_action: 'enabled',
  },
  SCHEDULE_FORGOT_CLOCK_OUT_EMAIL_OFF: {
    ...SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'checkbox',
    ui_object_detail: 'schedule_forgot_clock_out_email_off',
    ui_action: 'disabled',
  },
  // 'Forgot to clock out after shift ended' — Mobile
  SCHEDULE_FORGOT_CLOCK_OUT_MOBILE_ON: {
    ...SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'checkbox',
    ui_object_detail: 'schedule_forgot_clock_out_mobile_on',
    ui_action: 'enabled',
  },
  SCHEDULE_FORGOT_CLOCK_OUT_MOBILE_OFF: {
    ...SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'checkbox',
    ui_object_detail: 'schedule_forgot_clock_out_mobile_off',
    ui_action: 'disabled',
  },
  // 'Team member hasn't clocked in after shift started. Notify manager' — Email
  SCHEDULE_NO_CLOCKIN_NOTIFY_MGR_EMAIL_ON: {
    ...SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'checkbox',
    ui_object_detail: 'schedule_no_clockin_notify_mgr_email_on',
    ui_action: 'enabled',
  },
  SCHEDULE_NO_CLOCKIN_NOTIFY_MGR_EMAIL_OFF: {
    ...SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'checkbox',
    ui_object_detail: 'schedule_no_clockin_notify_mgr_email_off',
    ui_action: 'disabled',
  },
  // 'Team member hasn't clocked in after shift started. Notify manager' — Mobile
  SCHEDULE_NO_CLOCKIN_NOTIFY_MGR_MOBILE_ON: {
    ...SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'checkbox',
    ui_object_detail: 'schedule_no_clockin_notify_mgr_mobile_on',
    ui_action: 'enabled',
  },
  SCHEDULE_NO_CLOCKIN_NOTIFY_MGR_MOBILE_OFF: {
    ...SCHEDULE_NOTIFICATIONS_BASE_CONFIG,
    ui_object: 'checkbox',
    ui_object_detail: 'schedule_no_clockin_notify_mgr_mobile_off',
    ui_action: 'disabled',
  },
};
