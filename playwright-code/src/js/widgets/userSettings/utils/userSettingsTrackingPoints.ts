import { TrackingPoint } from '../../../common/useClickTracking';
import {
  BASE_TIME_TRACKING_FIELDS,
  TRACKING_ACTIONS,
  UI_ACTIONS,
  UI_OBJECTS,
} from '../../../common/trackingConstants';

// User Settings-specific tracking point interface that extends the base TrackingPoint
export interface UserSettingsTrackingPoint extends TrackingPoint {
  previous_screen?: string;
}

// User Settings-specific tracking points type
export interface UserSettingsTrackingPoints {
  [key: string]: UserSettingsTrackingPoint;
}

// Base fields for User Settings Location tracking
const BASE_USER_SETTINGS_LOCATION_FIELDS = {
  ...BASE_TIME_TRACKING_FIELDS,
  scope: 'qbtime',
  scope_area: 'time-tracking',
  screen: 'time_user_settings',
  object: 'widget',
  object_detail: 'location_user settings',
} as const;

// Location Card View Tracking Points
export const LOCATION_CARD_VIEW_TRACKING_POINTS: UserSettingsTrackingPoints = {
  EDIT_LOCATION_CARD: {
    ...BASE_USER_SETTINGS_LOCATION_FIELDS,
    action: TRACKING_ACTIONS.ENGAGED,
    ui_action: UI_ACTIONS.CLICKED,
    ui_object: UI_OBJECTS.BUTTON,
    ui_object_detail: 'edit',
  },
};

// Location Card Edit Tracking Points
export const LOCATION_CARD_EDIT_TRACKING_POINTS: UserSettingsTrackingPoints = {
  MANAGE_COMPANY_LOCATION_TRACKING: {
    ...BASE_USER_SETTINGS_LOCATION_FIELDS,
    action: TRACKING_ACTIONS.ENGAGED,
    ui_action: UI_ACTIONS.CLICKED,
    ui_object: UI_OBJECTS.LINK,
    ui_object_detail: 'manage_company_location_tracking',
  },
  USE_COMPANY_LEVEL_SETTINGS: {
    ...BASE_USER_SETTINGS_LOCATION_FIELDS,
    action: TRACKING_ACTIONS.ENGAGED,
    ui_action: UI_ACTIONS.CLICKED,
    ui_object: 'radio_button',
    ui_object_detail: 'use_company_level_settings',
  },
  USE_CUSTOM_RULES_FOR_THIS_WORKER: {
    ...BASE_USER_SETTINGS_LOCATION_FIELDS,
    action: TRACKING_ACTIONS.ENGAGED,
    ui_action: UI_ACTIONS.CLICKED,
    ui_object: 'radio_button',
    ui_object_detail: 'use_custom_rules_for_this_worker',
  },
  LOCATION_TRACKING_REQUIRED: {
    ...BASE_USER_SETTINGS_LOCATION_FIELDS,
    action: TRACKING_ACTIONS.ENGAGED,
    ui_action: UI_ACTIONS.CLICKED,
    ui_object: 'radio_button',
    ui_object_detail: 'required',
  },
  LOCATION_TRACKING_OPTIONAL: {
    ...BASE_USER_SETTINGS_LOCATION_FIELDS,
    action: TRACKING_ACTIONS.ENGAGED,
    ui_action: UI_ACTIONS.CLICKED,
    ui_object: 'radio_button',
    ui_object_detail: 'optional',
  },
  LOCATION_TRACKING_OFF: {
    ...BASE_USER_SETTINGS_LOCATION_FIELDS,
    action: TRACKING_ACTIONS.ENGAGED,
    ui_action: UI_ACTIONS.CLICKED,
    ui_object: 'radio_button',
    ui_object_detail: 'off',
  },
  CANCEL_LOCATION_CARD: {
    ...BASE_USER_SETTINGS_LOCATION_FIELDS,
    action: TRACKING_ACTIONS.ENGAGED,
    ui_action: UI_ACTIONS.CLICKED,
    ui_object: UI_OBJECTS.BUTTON,
    ui_object_detail: 'cancel',
  },
  SAVE_LOCATION_CARD: {
    ...BASE_USER_SETTINGS_LOCATION_FIELDS,
    action: TRACKING_ACTIONS.ENGAGED,
    ui_action: UI_ACTIONS.CLICKED,
    ui_object: UI_OBJECTS.BUTTON,
    ui_object_detail: 'save',
  },
};

// Base fields for Worker Notifications Card tracking
const BASE_WORKER_NOTIFICATIONS_FIELDS = {
  org: 'sbseg',
  purpose: 'prod',
  scope: 'time',
  scope_area: 'timeentrymanagement',
  screen: 'assignments',
  object: 'widget',
  object_detail: 'notification_preferences',
  action: TRACKING_ACTIONS.ENGAGED,
  ui_access_point: 'page',
} as const;

// Worker Notifications Card Tracking Points
export const WORKER_NOTIFICATIONS_CARD_TRACKING_POINTS: UserSettingsTrackingPoints =
  {
    WORKER_NOTIF_EDIT: {
      ...BASE_WORKER_NOTIFICATIONS_FIELDS,
      ui_object: UI_OBJECTS.BUTTON,
      ui_object_detail: 'edit',
      ui_action: UI_ACTIONS.CLICKED,
    },
    WORKER_NOTIF_SAVE: {
      ...BASE_WORKER_NOTIFICATIONS_FIELDS,
      ui_object: UI_OBJECTS.BUTTON,
      ui_object_detail: 'save',
      ui_action: UI_ACTIONS.CLICKED,
    },
    WORKER_NOTIF_CANCEL: {
      ...BASE_WORKER_NOTIFICATIONS_FIELDS,
      ui_object: UI_OBJECTS.BUTTON,
      ui_object_detail: 'cancel',
      ui_action: UI_ACTIONS.CLICKED,
    },
  };
