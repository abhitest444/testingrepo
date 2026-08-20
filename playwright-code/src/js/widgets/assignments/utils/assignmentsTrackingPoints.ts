import { TrackingPoint } from '../../../common/useClickTracking';
import {
  BASE_TIME_TRACKING_FIELDS,
  TRACKING_ACTIONS,
  UI_ACTIONS,
  UI_OBJECTS,
} from '../../../common/trackingConstants';

/**
 * Assignments Tracking Points
 * Defines all analytics tracking events for the Assignments widget.
 *
 * Common fields:
 * - org: 'sbseg'
 * - purpose: 'prod'
 * - scope: 'time'
 * - scope_area: 'timeentrymanagement'
 * - screen: 'assignments'
 */

// Assignments-specific tracking point interface
export interface AssignmentsTrackingPoint extends TrackingPoint {
  ui_access_point?: string;
}

// Assignments-specific tracking points type
export interface AssignmentsTrackingPoints {
  [key: string]: AssignmentsTrackingPoint;
}

// Base configuration for all assignments tracking points
const ASSIGNMENTS_BASE_CONFIG = {
  ...BASE_TIME_TRACKING_FIELDS,
  screen: 'assignments',
} as const;

// ============================================================================
// CUSTOMER ASSIGNMENTS TAB - Tracking Points
// ============================================================================

/**
 * Customer Assignments Tab Tracking Points
 * Tracks user interactions within the Customer Assignments tab
 */
export const CUSTOMER_ASSIGNMENTS_TRACKING_POINTS: AssignmentsTrackingPoints = {
  // Tab Navigation
  ASSIGNMENTS_TAB_CLICKED: {
    ...ASSIGNMENTS_BASE_CONFIG,
    action: TRACKING_ACTIONS.NAVIGATED,
    object: 'component',
    object_detail: 'assignments_tab',
    ui_action: UI_ACTIONS.CLICKED,
    ui_object: UI_OBJECTS.PAGE,
    ui_object_detail: 'assignments_tab',
  },

  CUSTOMER_TAB_VIEWED: {
    ...ASSIGNMENTS_BASE_CONFIG,
    action: TRACKING_ACTIONS.VIEWED,
    object: 'component',
    object_detail: 'customer_tab',
    ui_action: UI_ACTIONS.VIEWED,
    ui_object: UI_OBJECTS.PAGE,
    ui_object_detail: 'customer_tab',
  },

  // Manage Time Tracking Fields CTA
  MANAGE_TIME_TRACKING_FIELDS_CTA: {
    ...ASSIGNMENTS_BASE_CONFIG,
    action: TRACKING_ACTIONS.ENGAGED,
    object: 'component',
    object_detail: 'customer_tab',
    ui_action: UI_ACTIONS.CLICKED,
    ui_object: UI_OBJECTS.BUTTON,
    ui_object_detail: 'manage_time_tracking_fields',
  },

  // Add Customer CTA
  ADD_CUSTOMER_CTA: {
    ...ASSIGNMENTS_BASE_CONFIG,
    action: TRACKING_ACTIONS.ENGAGED,
    object: 'component',
    object_detail: 'customer_tab',
    ui_action: UI_ACTIONS.CLICKED,
    ui_object: UI_OBJECTS.BUTTON,
    ui_object_detail: 'add_customer',
  },

  // Assign Workers Link
  ASSIGN_WORKERS_LINK: {
    ...ASSIGNMENTS_BASE_CONFIG,
    action: TRACKING_ACTIONS.ENGAGED,
    object: 'component',
    object_detail: 'customer_tab',
    ui_action: UI_ACTIONS.CLICKED,
    ui_object: UI_OBJECTS.LINK,
    ui_object_detail: 'assign_workers',
  },

  // Assign Worker Drawer
  ASSIGN_WORKER_DRAWER_OPEN: {
    ...ASSIGNMENTS_BASE_CONFIG,
    action: TRACKING_ACTIONS.NAVIGATED,
    object: UI_OBJECTS.DRAWER,
    object_detail: 'assign_workers',
    ui_action: UI_ACTIONS.VIEWED,
    ui_object: UI_OBJECTS.DRAWER,
    ui_object_detail: 'assign_worker',
    ui_access_point: 'assign_worker_drawer',
  },

  SELECTED_WORKERS: {
    ...ASSIGNMENTS_BASE_CONFIG,
    action: TRACKING_ACTIONS.ENGAGED,
    object: 'component',
    object_detail: 'assign_workers',
    ui_action: UI_ACTIONS.CLICKED,
    ui_object: 'check_box',
    ui_object_detail: 'worker',
    ui_access_point: 'assign_worker_drawer',
  },

  SAVE_WORKER_ASSIGNMENT: {
    ...ASSIGNMENTS_BASE_CONFIG,
    action: TRACKING_ACTIONS.ENGAGED,
    object: 'component',
    object_detail: 'assign_workers',
    ui_action: UI_ACTIONS.CLICKED,
    ui_object: UI_OBJECTS.BUTTON,
    ui_object_detail: 'save',
    ui_access_point: 'assign_worker_drawer',
  },

  CANCEL_WORKER_ASSIGNMENT: {
    ...ASSIGNMENTS_BASE_CONFIG,
    action: TRACKING_ACTIONS.ENGAGED,
    object: 'component',
    object_detail: 'assign_workers',
    ui_action: UI_ACTIONS.CLICKED,
    ui_object: UI_OBJECTS.BUTTON,
    ui_object_detail: 'cancel',
    ui_access_point: 'assign_worker_drawer',
  },

  // Assign Time Tracking Fields (Edit link)
  ASSIGN_FIELDS_EDIT_LINK: {
    ...ASSIGNMENTS_BASE_CONFIG,
    action: TRACKING_ACTIONS.ENGAGED,
    object: 'component',
    object_detail: 'edit',
    ui_action: UI_ACTIONS.CLICKED,
    ui_object: UI_OBJECTS.LINK,
    ui_object_detail: 'assign_timetracking_fields',
  },

  // Assign Time Tracking Fields Drawer
  ASSIGN_FIELDS_DRAWER_OPEN: {
    ...ASSIGNMENTS_BASE_CONFIG,
    action: TRACKING_ACTIONS.NAVIGATED,
    object: UI_OBJECTS.DRAWER,
    object_detail: 'assign_timetracking_fields',
    ui_action: UI_ACTIONS.VIEWED,
    ui_object: UI_OBJECTS.DRAWER,
    ui_object_detail: 'time_tracking_fields',
    ui_access_point: 'assign_timetracking_fields',
  },

  SELECTED_FIELDS: {
    ...ASSIGNMENTS_BASE_CONFIG,
    action: TRACKING_ACTIONS.ENGAGED,
    object: 'component',
    object_detail: 'assign_timetracking_fields',
    ui_action: UI_ACTIONS.CLICKED,
    ui_object: 'check_box',
    ui_object_detail: 'field',
    ui_access_point: 'assign_timetracking_fields',
  },

  SAVE_FIELDS: {
    ...ASSIGNMENTS_BASE_CONFIG,
    action: TRACKING_ACTIONS.ENGAGED,
    object: 'component',
    object_detail: 'assign_timetracking_fields',
    ui_action: UI_ACTIONS.CLICKED,
    ui_object: UI_OBJECTS.BUTTON,
    ui_object_detail: 'save',
    ui_access_point: 'assign_timetracking_fields',
  },

  CANCEL_FIELDS: {
    ...ASSIGNMENTS_BASE_CONFIG,
    action: TRACKING_ACTIONS.ENGAGED,
    object: 'component',
    object_detail: 'assign_timetracking_fields',
    ui_action: UI_ACTIONS.CLICKED,
    ui_object: UI_OBJECTS.BUTTON,
    ui_object_detail: 'cancel',
    ui_access_point: 'assign_timetracking_fields',
  },
};

// ============================================================================
// WORKER ASSIGNMENTS TAB - Tracking Points
// ============================================================================

/**
 * Worker Assignments Tab Tracking Points
 * Tracks user interactions within the Worker Assignments tab
 */
export const WORKER_ASSIGNMENTS_TRACKING_POINTS: AssignmentsTrackingPoints = {
  // Tab Navigation
  WORKER_TAB_VIEWED: {
    ...ASSIGNMENTS_BASE_CONFIG,
    action: TRACKING_ACTIONS.VIEWED,
    object: 'component',
    object_detail: 'worker_tab',
    ui_action: UI_ACTIONS.VIEWED,
    ui_object: UI_OBJECTS.PAGE,
    ui_object_detail: 'worker_tab',
  },

  // Manage Time Tracking Fields CTA (Worker Tab)
  MANAGE_TIME_TRACKING_FIELDS_CTA: {
    ...ASSIGNMENTS_BASE_CONFIG,
    action: TRACKING_ACTIONS.ENGAGED,
    object: 'component',
    object_detail: 'time_tracking_fields',
    ui_action: UI_ACTIONS.CLICKED,
    ui_object: UI_OBJECTS.BUTTON,
    ui_object_detail: 'manage_time_tracking_fields',
  },

  // Add Worker CTA
  ADD_WORKER_CTA: {
    ...ASSIGNMENTS_BASE_CONFIG,
    action: TRACKING_ACTIONS.ENGAGED,
    object: 'component',
    object_detail: 'worker_tab',
    ui_action: UI_ACTIONS.CLICKED,
    ui_object: UI_OBJECTS.BUTTON,
    ui_object_detail: 'add_worker_cta',
  },

  // Add Group CTA
  ADD_GROUP_CTA: {
    ...ASSIGNMENTS_BASE_CONFIG,
    action: TRACKING_ACTIONS.ENGAGED,
    object: 'component',
    object_detail: 'worker_tab',
    ui_action: UI_ACTIONS.CLICKED,
    ui_object: UI_OBJECTS.BUTTON,
    ui_object_detail: 'add_group_cta',
  },

  // View Settings Link
  VIEW_SETTINGS_LINK: {
    ...ASSIGNMENTS_BASE_CONFIG,
    action: TRACKING_ACTIONS.ENGAGED,
    object: 'component',
    object_detail: 'worker_tab',
    ui_action: UI_ACTIONS.CLICKED,
    ui_object: UI_OBJECTS.LINK,
    ui_object_detail: 'view_settings_link',
  },

  // View Time Worker Profile Page
  VIEW_TIME_WORKER_PROFILE: {
    ...ASSIGNMENTS_BASE_CONFIG,
    action: TRACKING_ACTIONS.NAVIGATED,
    object: UI_OBJECTS.PAGE,
    object_detail: 'time_worker_profile_page',
    ui_action: UI_ACTIONS.CLICKED,
    ui_object: UI_OBJECTS.BUTTON,
    ui_object_detail: 'view_settings_link',
  },
};

// ============================================================================
// WORKER PROFILE - Notification Preferences Tracking Points
// ============================================================================

/**
 * Notification Preferences Tracking Points
 * Tracks user interactions within the notification preferences section of worker profile
 */
export const NOTIFICATION_PREFERENCES_TRACKING_POINTS: AssignmentsTrackingPoints =
  {
    NOTIFICATION_PREFERENCES_EDIT: {
      ...ASSIGNMENTS_BASE_CONFIG,
      action: TRACKING_ACTIONS.ENGAGED,
      object: 'widget',
      object_detail: 'notification_preferences',
      ui_action: UI_ACTIONS.CLICKED,
      ui_object: UI_OBJECTS.BUTTON,
      ui_object_detail: 'edit',
    },

    NOTIFICATION_PREFERENCES_SAVE: {
      ...ASSIGNMENTS_BASE_CONFIG,
      action: TRACKING_ACTIONS.ENGAGED,
      object: 'widget',
      object_detail: 'notification_preferences',
      ui_action: UI_ACTIONS.CLICKED,
      ui_object: UI_OBJECTS.BUTTON,
      ui_object_detail: 'save',
    },

    NOTIFICATION_PREFERENCES_CANCEL: {
      ...ASSIGNMENTS_BASE_CONFIG,
      action: TRACKING_ACTIONS.ENGAGED,
      object: 'widget',
      object_detail: 'notification_preferences',
      ui_action: UI_ACTIONS.CLICKED,
      ui_object: UI_OBJECTS.BUTTON,
      ui_object_detail: 'cancel',
    },

    // Company vs Custom notification settings
    COMPANY_NOTIFICATION_SETTINGS: {
      ...ASSIGNMENTS_BASE_CONFIG,
      action: TRACKING_ACTIONS.ENGAGED,
      object: 'widget',
      object_detail: 'notification_preferences',
      ui_action: UI_ACTIONS.CLICKED,
      ui_object: 'radio_button',
      ui_object_detail: 'company_notification_settings',
      ui_access_point: UI_OBJECTS.PAGE,
    },

    CUSTOM_USER_NOTIFICATION_SETTINGS: {
      ...ASSIGNMENTS_BASE_CONFIG,
      action: TRACKING_ACTIONS.ENGAGED,
      object: 'widget',
      object_detail: 'notification_preferences',
      ui_action: UI_ACTIONS.CLICKED,
      ui_object: 'radio_button',
      ui_object_detail: 'custom_user_notification_settings',
      ui_access_point: UI_OBJECTS.PAGE,
    },

    // Clock In/Out Reminders
    CLOCK_IN_REMINDER_DROPDOWN: {
      ...ASSIGNMENTS_BASE_CONFIG,
      action: TRACKING_ACTIONS.ENGAGED,
      object: 'widget',
      object_detail: 'notification_preferences',
      ui_action: UI_ACTIONS.CLICKED,
      ui_object: UI_OBJECTS.DROPDOWN,
      ui_object_detail: 'clock_in_reminder',
      ui_access_point: UI_OBJECTS.PAGE,
    },

    CLOCK_OUT_REMINDER_DROPDOWN: {
      ...ASSIGNMENTS_BASE_CONFIG,
      action: TRACKING_ACTIONS.ENGAGED,
      object: 'widget',
      object_detail: 'notification_preferences',
      ui_action: UI_ACTIONS.CLICKED,
      ui_object: UI_OBJECTS.DROPDOWN,
      ui_object_detail: 'clock_out_reminder',
      ui_access_point: UI_OBJECTS.PAGE,
    },

    CLOCK_IN_REMINDER_EMAIL: {
      ...ASSIGNMENTS_BASE_CONFIG,
      action: TRACKING_ACTIONS.ENGAGED,
      object: 'widget',
      object_detail: 'notification_preferences',
      ui_action: UI_ACTIONS.CLICKED,
      ui_object: UI_OBJECTS.CHECKBOX,
      ui_object_detail: 'clock_in_reminder_email',
      ui_access_point: UI_OBJECTS.PAGE,
    },

    CLOCK_IN_REMINDER_MOBILE: {
      ...ASSIGNMENTS_BASE_CONFIG,
      action: TRACKING_ACTIONS.ENGAGED,
      object: 'widget',
      object_detail: 'notification_preferences',
      ui_action: UI_ACTIONS.CLICKED,
      ui_object: UI_OBJECTS.CHECKBOX,
      ui_object_detail: 'clock_in_reminder_mobile',
      ui_access_point: UI_OBJECTS.PAGE,
    },

    CLOCK_OUT_REMINDER_EMAIL: {
      ...ASSIGNMENTS_BASE_CONFIG,
      action: TRACKING_ACTIONS.ENGAGED,
      object: 'widget',
      object_detail: 'notification_preferences',
      ui_action: UI_ACTIONS.CLICKED,
      ui_object: UI_OBJECTS.CHECKBOX,
      ui_object_detail: 'clock_out_reminder_email',
      ui_access_point: UI_OBJECTS.PAGE,
    },

    CLOCK_OUT_REMINDER_MOBILE: {
      ...ASSIGNMENTS_BASE_CONFIG,
      action: TRACKING_ACTIONS.ENGAGED,
      object: 'widget',
      object_detail: 'notification_preferences',
      ui_action: UI_ACTIONS.CLICKED,
      ui_object: UI_OBJECTS.CHECKBOX,
      ui_object_detail: 'clock_out_reminder_mobile',
      ui_access_point: UI_OBJECTS.PAGE,
    },

    // Days of Week Reminder
    DAYS_OF_WEEK_REMINDER: {
      ...ASSIGNMENTS_BASE_CONFIG,
      action: TRACKING_ACTIONS.ENGAGED,
      object: 'widget',
      object_detail: 'notification_preferences',
      ui_action: UI_ACTIONS.CLICKED,
      ui_object: UI_OBJECTS.DROPDOWN,
      ui_object_detail: 'days_of_week_reminder',
      ui_access_point: UI_OBJECTS.PAGE,
    },

    // Clocked Time Adjusted
    CLOCKED_TIME_ADJUSTED: {
      ...ASSIGNMENTS_BASE_CONFIG,
      action: TRACKING_ACTIONS.ENGAGED,
      object: 'widget',
      object_detail: 'notification_preferences',
      ui_action: UI_ACTIONS.CLICKED,
      ui_object: UI_OBJECTS.CHECKBOX,
      ui_object_detail: 'clocked_time_adjusted',
      ui_access_point: UI_OBJECTS.PAGE,
    },

    // Schedule Published/Changed
    SCHEDULE_PUBLISHED_CHANGED_EMAIL: {
      ...ASSIGNMENTS_BASE_CONFIG,
      action: TRACKING_ACTIONS.ENGAGED,
      object: 'widget',
      object_detail: 'notification_preferences',
      ui_action: UI_ACTIONS.CLICKED,
      ui_object: UI_OBJECTS.CHECKBOX,
      ui_object_detail: 'schedule_published_changed_email',
      ui_access_point: UI_OBJECTS.PAGE,
    },

    SCHEDULE_PUBLISHED_CHANGED_MOBILE: {
      ...ASSIGNMENTS_BASE_CONFIG,
      action: TRACKING_ACTIONS.ENGAGED,
      object: 'widget',
      object_detail: 'notification_preferences',
      ui_action: UI_ACTIONS.CLICKED,
      ui_object: UI_OBJECTS.CHECKBOX,
      ui_object_detail: 'schedule_published_changed_mobile',
      ui_access_point: UI_OBJECTS.PAGE,
    },

    // Schedule Reminder
    SCHEDULE_REMINDER_EMAIL: {
      ...ASSIGNMENTS_BASE_CONFIG,
      action: TRACKING_ACTIONS.ENGAGED,
      object: 'widget',
      object_detail: 'notification_preferences',
      ui_action: UI_ACTIONS.CLICKED,
      ui_object: UI_OBJECTS.CHECKBOX,
      ui_object_detail: 'schedule_reminder_email',
      ui_access_point: UI_OBJECTS.PAGE,
    },

    SCHEDULE_REMINDER_MOBILE: {
      ...ASSIGNMENTS_BASE_CONFIG,
      action: TRACKING_ACTIONS.ENGAGED,
      object: 'widget',
      object_detail: 'notification_preferences',
      ui_action: UI_ACTIONS.CLICKED,
      ui_object: UI_OBJECTS.CHECKBOX,
      ui_object_detail: 'schedule_reminder_mobile',
      ui_access_point: UI_OBJECTS.PAGE,
    },

    // Schedule Forgot Clock In
    SCHEDULE_FORGOT_CLOCKIN_EMAIL: {
      ...ASSIGNMENTS_BASE_CONFIG,
      action: TRACKING_ACTIONS.ENGAGED,
      object: 'widget',
      object_detail: 'notification_preferences',
      ui_action: UI_ACTIONS.CLICKED,
      ui_object: UI_OBJECTS.CHECKBOX,
      ui_object_detail: 'schedule_forgot_clockin_email',
      ui_access_point: UI_OBJECTS.PAGE,
    },

    SCHEDULE_FORGOT_CLOCKIN_MOBILE: {
      ...ASSIGNMENTS_BASE_CONFIG,
      action: TRACKING_ACTIONS.ENGAGED,
      object: 'widget',
      object_detail: 'notification_preferences',
      ui_action: UI_ACTIONS.CLICKED,
      ui_object: UI_OBJECTS.CHECKBOX,
      ui_object_detail: 'schedule_forgot_clockin_mobile',
      ui_access_point: UI_OBJECTS.PAGE,
    },

    // Schedule Forgot Clock Out
    SCHEDULE_FORGOT_CLOCKOUT_EMAIL: {
      ...ASSIGNMENTS_BASE_CONFIG,
      action: TRACKING_ACTIONS.ENGAGED,
      object: 'widget',
      object_detail: 'notification_preferences',
      ui_action: UI_ACTIONS.CLICKED,
      ui_object: UI_OBJECTS.CHECKBOX,
      ui_object_detail: 'schedule_forgot_clockout_email',
      ui_access_point: UI_OBJECTS.PAGE,
    },

    SCHEDULE_FORGOT_CLOCKOUT_MOBILE: {
      ...ASSIGNMENTS_BASE_CONFIG,
      action: TRACKING_ACTIONS.ENGAGED,
      object: 'widget',
      object_detail: 'notification_preferences',
      ui_action: UI_ACTIONS.CLICKED,
      ui_object: UI_OBJECTS.CHECKBOX,
      ui_object_detail: 'schedule_forgot_clockout_mobile',
      ui_access_point: UI_OBJECTS.PAGE,
    },

    // Time Off Notifications
    TIME_OFF_EMAIL: {
      ...ASSIGNMENTS_BASE_CONFIG,
      action: TRACKING_ACTIONS.ENGAGED,
      object: 'widget',
      object_detail: 'notification_preferences',
      ui_action: UI_ACTIONS.CLICKED,
      ui_object: UI_OBJECTS.CHECKBOX,
      ui_object_detail: 'time_off_email',
      ui_access_point: UI_OBJECTS.PAGE,
    },

    TIME_OFF_MOBILE: {
      ...ASSIGNMENTS_BASE_CONFIG,
      action: TRACKING_ACTIONS.ENGAGED,
      object: 'widget',
      object_detail: 'notification_preferences',
      ui_action: UI_ACTIONS.CLICKED,
      ui_object: UI_OBJECTS.CHECKBOX,
      ui_object_detail: 'time_off_mobile',
      ui_access_point: UI_OBJECTS.PAGE,
    },

    TIME_OFF_WEB: {
      ...ASSIGNMENTS_BASE_CONFIG,
      action: TRACKING_ACTIONS.ENGAGED,
      object: 'widget',
      object_detail: 'notification_preferences',
      ui_action: UI_ACTIONS.CLICKED,
      ui_object: UI_OBJECTS.CHECKBOX,
      ui_object_detail: 'time_off_web',
      ui_access_point: UI_OBJECTS.PAGE,
    },

    // Note Added/Adjusted
    NOTE_ADDED_ADJUSTED: {
      ...ASSIGNMENTS_BASE_CONFIG,
      action: TRACKING_ACTIONS.ENGAGED,
      object: 'widget',
      object_detail: 'notification_preferences',
      ui_action: UI_ACTIONS.CLICKED,
      ui_object: UI_OBJECTS.CHECKBOX,
      ui_object_detail: 'note_added_adjusted',
      ui_access_point: UI_OBJECTS.PAGE,
    },

    // Timesheet Management Clock Out Increment
    TIMESHEET_MANAGEMENT_CLOCK_OUT_INCREMENT: {
      ...ASSIGNMENTS_BASE_CONFIG,
      action: TRACKING_ACTIONS.ENGAGED,
      object: 'widget',
      object_detail: 'notification_preferences',
      ui_action: UI_ACTIONS.CLICKED,
      ui_object: UI_OBJECTS.DROPDOWN,
      ui_object_detail: 'timesheet_management_clock_out_increment',
      ui_access_point: UI_OBJECTS.PAGE,
    },
  };

// ============================================================================
// WORKER PROFILE - Worker Breaks Tracking Points
// ============================================================================

/**
 * Worker Breaks Tracking Points
 * Tracks user interactions within the worker breaks section of worker profile
 */
export const WORKER_BREAKS_TRACKING_POINTS: AssignmentsTrackingPoints = {
  WORKER_BREAKS_EDIT: {
    ...ASSIGNMENTS_BASE_CONFIG,
    action: TRACKING_ACTIONS.ENGAGED,
    object: 'widget',
    object_detail: 'worker_breaks',
    ui_action: UI_ACTIONS.CLICKED,
    ui_object: UI_OBJECTS.BUTTON,
    ui_object_detail: 'edit',
  },

  WORKER_BREAKS_SAVE: {
    ...ASSIGNMENTS_BASE_CONFIG,
    action: TRACKING_ACTIONS.ENGAGED,
    object: 'widget',
    object_detail: 'worker_breaks',
    ui_action: UI_ACTIONS.CLICKED,
    ui_object: UI_OBJECTS.BUTTON,
    ui_object_detail: 'save',
  },

  WORKER_BREAKS_CANCEL: {
    ...ASSIGNMENTS_BASE_CONFIG,
    action: TRACKING_ACTIONS.ENGAGED,
    object: 'widget',
    object_detail: 'worker_breaks',
    ui_action: UI_ACTIONS.CLICKED,
    ui_object: UI_OBJECTS.BUTTON,
    ui_object_detail: 'cancel',
  },
};

// ============================================================================
// WORKER PROFILE - Permissions Tracking Points
// ============================================================================

/**
 * Permissions Tracking Points
 * Tracks user interactions within the permissions section of worker profile
 */
export const PERMISSIONS_TRACKING_POINTS: AssignmentsTrackingPoints = {
  PERMISSIONS_EDIT: {
    ...ASSIGNMENTS_BASE_CONFIG,
    action: TRACKING_ACTIONS.ENGAGED,
    object: 'widget',
    object_detail: 'permissions',
    ui_action: UI_ACTIONS.CLICKED,
    ui_object: UI_OBJECTS.BUTTON,
    ui_object_detail: 'edit',
  },

  PERMISSIONS_SAVE: {
    ...ASSIGNMENTS_BASE_CONFIG,
    action: TRACKING_ACTIONS.ENGAGED,
    object: 'widget',
    object_detail: 'permissions',
    ui_action: UI_ACTIONS.CLICKED,
    ui_object: UI_OBJECTS.BUTTON,
    ui_object_detail: 'save',
  },

  PERMISSIONS_CANCEL: {
    ...ASSIGNMENTS_BASE_CONFIG,
    action: TRACKING_ACTIONS.ENGAGED,
    object: 'widget',
    object_detail: 'permissions',
    ui_action: UI_ACTIONS.CLICKED,
    ui_object: UI_OBJECTS.BUTTON,
    ui_object_detail: 'cancel',
  },
};

// ============================================================================
// WORKER PROFILE - Assignments Section Tracking Points
// ============================================================================

/**
 * Worker Profile Assignments Section Tracking Points
 * Tracks user interactions within the assignments section of worker profile
 */
export const WORKER_PROFILE_ASSIGNMENTS_TRACKING_POINTS: AssignmentsTrackingPoints =
  {
    ASSIGNMENTS_EDIT: {
      ...ASSIGNMENTS_BASE_CONFIG,
      action: TRACKING_ACTIONS.ENGAGED,
      object: 'widget',
      object_detail: 'assignments',
      ui_action: UI_ACTIONS.CLICKED,
      ui_object: UI_OBJECTS.BUTTON,
      ui_object_detail: 'edit',
    },

    ASSIGNMENTS_SAVE: {
      ...ASSIGNMENTS_BASE_CONFIG,
      action: TRACKING_ACTIONS.ENGAGED,
      object: 'widget',
      object_detail: 'assignments',
      ui_action: UI_ACTIONS.CLICKED,
      ui_object: UI_OBJECTS.BUTTON,
      ui_object_detail: 'save',
    },

    ASSIGNMENTS_CANCEL: {
      ...ASSIGNMENTS_BASE_CONFIG,
      action: TRACKING_ACTIONS.ENGAGED,
      object: 'widget',
      object_detail: 'assignments',
      ui_action: UI_ACTIONS.CLICKED,
      ui_object: UI_OBJECTS.BUTTON,
      ui_object_detail: 'cancel',
    },
  };

// ============================================================================
// CUSTOM FIELD SETTINGS - Tracking Points
// ============================================================================

/**
 * Custom Field Settings Tracking Points
 * Tracks user interactions within the Custom Field Settings page
 */
const CUSTOM_FIELD_SETTINGS_BASE_CONFIG = {
  ...BASE_TIME_TRACKING_FIELDS,
  screen: 'custom_field_settings',
} as const;

export const CUSTOM_FIELD_SETTINGS_TRACKING_POINTS: AssignmentsTrackingPoints =
  {
    // Click "Assign Customers" in Custom Fields
    ASSIGN_CUSTOMERS_CUSTOM_FIELD: {
      ...CUSTOM_FIELD_SETTINGS_BASE_CONFIG,
      action: TRACKING_ACTIONS.ENGAGED,
      object_detail: 'assign_custom_fields',
      ui_action: UI_ACTIONS.CLICKED,
      ui_object: UI_OBJECTS.BUTTON,
      ui_object_detail: 'assign_customers',
    },

    // Click "Assign Workers" in Custom Fields
    ASSIGN_WORKERS_CUSTOM_FIELD: {
      ...CUSTOM_FIELD_SETTINGS_BASE_CONFIG,
      action: TRACKING_ACTIONS.ENGAGED,
      object_detail: 'assign_custom_fields',
      ui_action: UI_ACTIONS.CLICKED,
      ui_object: UI_OBJECTS.BUTTON,
      ui_object_detail: 'assign_workers',
    },

    // Select "Edit" custom field
    EDIT_CUSTOM_FIELD: {
      ...CUSTOM_FIELD_SETTINGS_BASE_CONFIG,
      action: TRACKING_ACTIONS.ENGAGED,
      object_detail: 'assign_custom_fields',
      ui_action: UI_ACTIONS.CLICKED,
      ui_object: UI_OBJECTS.BUTTON,
      ui_object_detail: 'edit',
    },

    // Select "Add custom fields"
    ADD_CUSTOM_FIELDS: {
      ...CUSTOM_FIELD_SETTINGS_BASE_CONFIG,
      action: TRACKING_ACTIONS.ENGAGED,
      object_detail: 'assign_custom_fields',
      ui_action: UI_ACTIONS.CLICKED,
      ui_object: UI_OBJECTS.BUTTON,
      ui_object_detail: 'add_custom_fields',
    },
  };

// ============================================================================
// GEOFENCE - Tracking Points
// ============================================================================

const GEOFENCE_BASE_CONFIG = {
  org: 'sbseg',
  purpose: 'prod',
  scope: 'qbtime',
  scope_area: 'timeentrymanagement',
  screen: 'assignments',
  object: 'widget',
} as const;

export const GEOFENCE_TRACKING_POINTS: AssignmentsTrackingPoints = {
  ASSIGN_GEOFENCE_LOCATION: {
    ...GEOFENCE_BASE_CONFIG,
    action: TRACKING_ACTIONS.ENGAGED,
    object_detail: 'customer_tab',
    ui_action: UI_ACTIONS.CLICKED,
    ui_object: UI_OBJECTS.BUTTON,
    ui_object_detail: 'assign_geofence_location',
  },

  EDIT_GEOFENCE_LOCATION: {
    ...GEOFENCE_BASE_CONFIG,
    action: TRACKING_ACTIONS.ENGAGED,
    object_detail: 'customer_tab',
    ui_action: UI_ACTIONS.CLICKED,
    ui_object: UI_OBJECTS.BUTTON,
    ui_object_detail: 'edit_geofence_location',
  },

  VIEW_GEOFENCE_DRAWER: {
    ...GEOFENCE_BASE_CONFIG,
    action: TRACKING_ACTIONS.VIEWED,
    object_detail: 'geofence_drawer',
  },

  TURN_ON_GEOFENCE: {
    ...GEOFENCE_BASE_CONFIG,
    action: TRACKING_ACTIONS.ENGAGED,
    object_detail: 'customer_tab',
    ui_action: UI_ACTIONS.CLICKED,
    ui_object: 'switch',
    ui_object_detail: 'turn_on_geofence',
  },

  TURN_OFF_GEOFENCE: {
    ...GEOFENCE_BASE_CONFIG,
    action: TRACKING_ACTIONS.ENGAGED,
    object_detail: 'customer_tab',
    ui_action: UI_ACTIONS.CLICKED,
    ui_object: 'switch',
    ui_object_detail: 'turn_off_geofence',
  },

  EDIT_GEOFENCE_ADDRESS: {
    ...GEOFENCE_BASE_CONFIG,
    action: TRACKING_ACTIONS.ENGAGED,
    object_detail: 'geofence_drawer',
    ui_action: UI_ACTIONS.TYPED,
    ui_object: UI_OBJECTS.FORM_FIELD,
    ui_object_detail: 'geofence_address',
  },

  SAVE_GEOFENCE: {
    ...GEOFENCE_BASE_CONFIG,
    action: TRACKING_ACTIONS.ENGAGED,
    object_detail: 'geofence_drawer',
    ui_action: UI_ACTIONS.CLICKED,
    ui_object: UI_OBJECTS.BUTTON,
    ui_object_detail: 'save',
  },

  CANCEL_GEOFENCE_DRAWER: {
    ...GEOFENCE_BASE_CONFIG,
    action: TRACKING_ACTIONS.ENGAGED,
    object_detail: 'geofence_drawer',
    ui_action: UI_ACTIONS.CLICKED,
    ui_object: UI_OBJECTS.BUTTON,
    ui_object_detail: 'cancel',
  },

  EDIT_GEOFENCE_RADIUS: {
    ...GEOFENCE_BASE_CONFIG,
    action: TRACKING_ACTIONS.ENGAGED,
    object_detail: 'geofence_drawer',
    ui_action: UI_ACTIONS.CLICKED,
    ui_object: UI_OBJECTS.DROPDOWN,
    ui_object_detail: 'geofence_radius',
  },

  MANAGE_SETTINGS_LINK: {
    ...GEOFENCE_BASE_CONFIG,
    action: TRACKING_ACTIONS.ENGAGED,
    object_detail: 'geofence_drawer',
    ui_action: UI_ACTIONS.CLICKED,
    ui_object: UI_OBJECTS.LINK,
    ui_object_detail: 'manage_settings',
  },

  DONT_SAVE_GEOFENCE: {
    ...GEOFENCE_BASE_CONFIG,
    action: TRACKING_ACTIONS.ENGAGED,
    object_detail: 'geofence_drawer',
    ui_action: UI_ACTIONS.CLICKED,
    ui_object: UI_OBJECTS.BUTTON,
    ui_object_detail: 'dont_save',
  },
};

// ============================================================================
// CUSTOM FIELD ASSIGNMENT DRAWER - Tracking Points
// ============================================================================

/**
 * Custom Field Assignment Drawer Tracking Points
 * Tracks user interactions within the customer assignment drawer opened from custom fields
 * Note: These use screen: 'assignments' as the drawer is part of assignments flow
 */
export const CUSTOM_FIELD_ASSIGNMENT_DRAWER_TRACKING_POINTS: AssignmentsTrackingPoints =
  {
    // View Customer assignment drawer (from custom field)
    VIEW_CUSTOMER_ASSIGNMENT_DRAWER_CUSTOM_FIELD: {
      ...ASSIGNMENTS_BASE_CONFIG,
      action: TRACKING_ACTIONS.VIEWED,
      object_detail: 'assign_customers',
    },

    // Typing in Search customers in assignment drawer
    SEARCH_CUSTOMERS_ASSIGNMENT_DRAWER: {
      ...ASSIGNMENTS_BASE_CONFIG,
      action: TRACKING_ACTIONS.ENGAGED,
      object_detail: 'assign_customers',
      ui_action: UI_ACTIONS.TYPED,
      ui_object: UI_OBJECTS.FORM_FIELD,
      ui_object_detail: 'search',
    },

    // Save customer assignments to fields
    SAVE_CUSTOMER_ASSIGNMENTS_CUSTOM_FIELD: {
      ...ASSIGNMENTS_BASE_CONFIG,
      action: TRACKING_ACTIONS.ENGAGED,
      object_detail: 'assign_customers',
      ui_action: UI_ACTIONS.CLICKED,
      ui_object: UI_OBJECTS.BUTTON,
      ui_object_detail: 'save',
    },

    // Cancel "X" customer assignments to fields
    CANCEL_CUSTOMER_ASSIGNMENTS_CUSTOM_FIELD: {
      ...ASSIGNMENTS_BASE_CONFIG,
      action: TRACKING_ACTIONS.ENGAGED,
      object_detail: 'assign_customers',
      ui_action: UI_ACTIONS.CLICKED,
      ui_object: UI_OBJECTS.BUTTON,
      ui_object_detail: 'X',
    },
  };
