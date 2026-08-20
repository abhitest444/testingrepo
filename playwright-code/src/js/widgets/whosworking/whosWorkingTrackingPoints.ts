import {
  TrackingPoints,
  createTrackingPoints,
} from '../../common/useClickTracking';

/**
 * Who's Working Map Widget Tracking Points
 * Defines all click tracking events for the Who's Working Map widget.
 *
 * Common fields:
 * - org: 'sbseg'
 * - purpose: 'prod'
 * - scope: 'time' (for WFS) or 'qbtime' (for QBO)
 * - scope_area: 'workforce' (for WFS) or 'time-tracking' (for QBO)
 * - screen: 'whos_working_map'
 * - object: 'widget'
 * - object_detail: 'whos_working'
 */

// Base configuration shared across all tracking points (QBO)
const BASE_CONFIG = {
  org: 'sbseg',
  purpose: 'prod',
  scope: 'qbtime',
  scope_area: 'time-tracking',
  screen: 'whos_working_map',
  object: 'widget',
  object_detail: 'whos_working',
} as const;

// Base tracking template for Who's Working widget
const BASE_WHOS_WORKING_TRACKING_TEMPLATE = {
  // Widget viewed on mount
  WIDGET_VIEWED: {
    ...BASE_CONFIG,
    action: 'engaged',
    ui_action: 'viewed',
    ui_object: 'page',
    ui_object_detail: 'whos_working_map',
  },

  // Map view toggle (map/satellite)
  MAP_VIEW_TOGGLE: {
    ...BASE_CONFIG,
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'map',
    // Additional: map_view: 'map' | 'satellite'
  },

  // Select +# cluster when multiple workers in one spot
  MAP_CLUSTER_CLICK: {
    ...BASE_CONFIG,
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'map_multiple_employees',
  },

  // Select location map icon in employee list
  EMPLOYEE_LOCATION_MAP: {
    ...BASE_CONFIG,
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'employee_location_map',
  },

  // Edit time button click
  EDIT_TIME: {
    ...BASE_CONFIG,
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'edit_time',
  },

  // Select Single Time Entry from menu
  SINGLE_TIME_ENTRY: {
    ...BASE_CONFIG,
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'single_time_entry',
  },

  // Select Add Break from menu
  ADD_BREAK: {
    ...BASE_CONFIG,
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'add_break',
  },

  // Select team member row
  TEAM_MEMBER_SELECT: {
    ...BASE_CONFIG,
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'team_member',
  },

  // Refresh button click
  REFRESH: {
    ...BASE_CONFIG,
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'refresh',
  },

  // Search typing
  SEARCH: {
    ...BASE_CONFIG,
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'search',
  },

  // Go to employee list
  GO_TO_EMPLOYEE_LIST: {
    ...BASE_CONFIG,
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'go_to_employee_list',
  },

  // Select filter button
  SELECT_FILTER: {
    ...BASE_CONFIG,
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'select_filter',
  },

  // Filter: select "display by" dropdown
  DISPLAY_BY: {
    ...BASE_CONFIG,
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'display_by',
    // Additional: whos_working_filter: 'on_the_clock_only' | 'by_group' | 'all_employees'
  },

  // Sort: select "sort by" dropdown
  SORT_BY: {
    ...BASE_CONFIG,
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'sort_by',
    // Additional: sort_by: 'most_recent_clocked_in_time' | 'daily_total' | 'team_member' | 'sharing_location'
  },

  // Apply filter and sort button
  APPLY_FILTER: {
    ...BASE_CONFIG,
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'apply_filter',
  },

  // Done button (if applicable)
  DONE: {
    ...BASE_CONFIG,
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'done',
  },

  // Close button
  CLOSE: {
    ...BASE_CONFIG,
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'close',
  },

  // X button (close icon)
  X_CLOSE: {
    ...BASE_CONFIG,
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'x',
  },
} as const;

export const WHOS_WORKING_TRACKING_POINTS: TrackingPoints =
  BASE_WHOS_WORKING_TRACKING_TEMPLATE as TrackingPoints;

// WFS (Workforce Solutions) tracking points with scope: 'time' and scope_area: 'workforce'
export const WFS_WHOS_WORKING_TRACKING_POINTS: TrackingPoints =
  createTrackingPoints(
    'whos_working_map',
    BASE_WHOS_WORKING_TRACKING_TEMPLATE,
    {},
    { scope: 'time', scope_area: 'workforce' }, // Global override applied to ALL fields
  );

/**
 * Get the appropriate tracking points based on environment
 * @param options - Configuration options
 * @param options.isWorkforce - Whether running in Workforce environment
 * @returns The appropriate TrackingPoints object
 */
export const getWhosWorkingTrackingPoints = ({
  isWorkforce,
}: {
  isWorkforce: boolean;
}): TrackingPoints => {
  if (isWorkforce) {
    return WFS_WHOS_WORKING_TRACKING_POINTS;
  }

  return WHOS_WORKING_TRACKING_POINTS;
};
