/**
 * Google Maps Constants
 * These constants match Google Maps API values
 * Use these when you need to configure map options before the API loads
 */

/**
 * Google Maps Control Position Values
 * Reference: https://developers.google.com/maps/documentation/javascript/reference/control#ControlPosition
 *
 * Use these numeric values when configuring options before google.maps is available
 * Or use google.maps.ControlPosition enums after the API loads
 */
export const ControlPosition = {
  TOP_CENTER: 1,
  TOP_LEFT: 2,
  TOP_RIGHT: 3,
  LEFT_CENTER: 5,
  LEFT_BOTTOM: 6,
  RIGHT_BOTTOM: 7,
  RIGHT_CENTER: 8,
  RIGHT_TOP: 9,
  BOTTOM_CENTER: 11,
  BOTTOM_LEFT: 12,
  BOTTOM_RIGHT: 13,
} as const;

/**
 * Map Type IDs
 */
export const MapTypeId = {
  ROADMAP: 'roadmap',
  SATELLITE: 'satellite',
  HYBRID: 'hybrid',
  TERRAIN: 'terrain',
} as const;

// Default map center (US Center - referenced from timecapture-whos-working-ui)
export const US_CENTER = { lat: 39.8097343, lng: -98.5556199 };
export const ZOOM_DEFAULT = 4;
export const ZOOM_SINGLE_WORKER = 18; // Street-level zoom for single worker
export const ZOOM_MAX = 22;
export const CLUSTER_RADIUS_PIXELS = 90;

export const EMPLOYEE_LIST_REDIRECT_URL = '/app/time/team?jobId=time';
