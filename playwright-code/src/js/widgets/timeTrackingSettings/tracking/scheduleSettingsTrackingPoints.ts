import { TrackingPoint } from 'src/js/common/useClickTracking';

const SCHEDULE_SETTINGS_BASE_CONFIG = {
  org: 'sbseg',
  purpose: 'prod',
  scope: 'time',
  scope_area: 'time-tracking',
  screen: 'time-settings',
  object: 'widget',
  object_detail: 'schedule_settings_preferences',
} as const;

export const SCHEDULE_SETTINGS_TRACKING_POINTS: {
  [key: string]: TrackingPoint;
} = {
  SCHEDULE_PREFS_SECTION_EDIT: {
    ...SCHEDULE_SETTINGS_BASE_CONFIG,
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'edit',
    ui_access_point: 'center',
  },
  SCHEDULE_PREFS_VIEW: {
    ...SCHEDULE_SETTINGS_BASE_CONFIG,
    action: 'viewed',
    ui_action: 'viewed',
    ui_object: 'section',
    ui_object_detail: 'schedule_preferences',
    ui_access_point: 'page',
  },
  SCHEDULE_VIEW_THEIR_OWN: {
    ...SCHEDULE_SETTINGS_BASE_CONFIG,
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'radio_button',
    ui_object_detail: 'view_schedule_their_own',
    ui_access_point: 'page',
  },
  SCHEDULE_VIEW_GROUP: {
    ...SCHEDULE_SETTINGS_BASE_CONFIG,
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'radio_button',
    ui_object_detail: 'view_schedule_group',
    ui_access_point: 'page',
  },
  SCHEDULE_VIEW_COMPANY: {
    ...SCHEDULE_SETTINGS_BASE_CONFIG,
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'radio_button',
    ui_object_detail: 'view_schedule_company',
    ui_access_point: 'page',
  },
  SCHEDULE_MANAGE_NONE: {
    ...SCHEDULE_SETTINGS_BASE_CONFIG,
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'radio_button',
    ui_object_detail: 'manage_schedule_none',
    ui_access_point: 'page',
  },
  SCHEDULE_MANAGE_THEIR_OWN: {
    ...SCHEDULE_SETTINGS_BASE_CONFIG,
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'radio_button',
    ui_object_detail: 'manage_schedule_their_own',
    ui_access_point: 'page',
  },
  SCHEDULE_MANAGE_GROUP: {
    ...SCHEDULE_SETTINGS_BASE_CONFIG,
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'radio_button',
    ui_object_detail: 'manage_schedule_group',
    ui_access_point: 'page',
  },
  SCHEDULE_MANAGE_COMPANY: {
    ...SCHEDULE_SETTINGS_BASE_CONFIG,
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'radio_button',
    ui_object_detail: 'manage_schedule_company',
    ui_access_point: 'page',
  },
  SCHEDULE_PREFS_SAVE: {
    ...SCHEDULE_SETTINGS_BASE_CONFIG,
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'save',
    ui_access_point: 'page',
  },
  SCHEDULE_PREFS_CANCEL: {
    ...SCHEDULE_SETTINGS_BASE_CONFIG,
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'cancel',
    ui_access_point: 'page',
  },
};
