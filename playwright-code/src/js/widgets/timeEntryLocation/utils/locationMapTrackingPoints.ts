import { TrackingPoints } from '../../../common/useClickTracking';

/**
 * Time Entry Location Map Widget Tracking Points
 * Defines all analytics tracking events for the Time Entry Location Map widget.
 *
 * Common fields:
 * - org: 'sbseg'
 * - purpose: 'prod'
 * - scope: 'qbtime'
 * - scope_area: 'time-tracking'
 * - screen: 'location_map_timesheet'
 * - object: 'widget'
 * - object_detail: 'location_map'
 */

// Base configuration shared across all tracking points
const BASE_CONFIG = {
  org: 'sbseg',
  purpose: 'prod',
  scope: 'qbtime',
  scope_area: 'time-tracking',
  screen: 'location_map_timesheet',
  object: 'widget',
  object_detail: 'location_map',
} as const;

export const LOCATION_MAP_TRACKING_POINTS: TrackingPoints = {
  // Widget viewed on mount
  VIEW_LOCATION_MAP: {
    ...BASE_CONFIG,
    action: 'viewed',
    ui_action: 'viewed',
    ui_object: 'widget',
    ui_object_detail: 'location_map',
  },

  // Play location points button
  PLAY_LOCATION_POINTS: {
    ...BASE_CONFIG,
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'play_location',
  },

  // Replay button
  REPLAY: {
    ...BASE_CONFIG,
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'replay_location',
  },

  // Select map view button
  SELECT_MAP_VIEW: {
    ...BASE_CONFIG,
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'map',
    // Additional: map_view: 'map' | 'satellite' (populated dynamically)
  },

  // Select location point on the map
  SELECT_LOCATION_POINT: {
    ...BASE_CONFIG,
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'location_point',
  },

  // Expand all location points button
  EXPAND_ALL_LOCATION_POINTS: {
    ...BASE_CONFIG,
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'expand_all_location_points',
  },

  // Close button (for both X and cancel footer button)
  CLOSE: {
    ...BASE_CONFIG,
    action: 'engaged',
    ui_action: 'clicked',
    ui_object: 'button',
    ui_object_detail: 'close',
  },

  // Something went wrong page view
  SOMETHING_WENT_WRONG_VIEWED: {
    ...BASE_CONFIG,
    action: 'viewed',
    object_detail: 'location_map_went_wrong',
    ui_action: 'viewed',
    ui_object: 'widget',
    ui_object_detail: 'location_map_went_wrong',
  },
};
