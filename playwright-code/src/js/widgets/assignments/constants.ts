// Assignments Widget Constants

// Pagination constants
export const ASSIGNMENT_PAGINATION_DEFAULTS = {
  DEFAULT_PAGE: 1 as number,
  PAGE_SIZE: 100 as number,
} as const;

// Action constants for customer/project assignment operations
export const ASSIGNMENT_ACTIONS = {
  EDIT_CUSTOMER: 'editCustomer',
  ASSIGN_TEAM_MEMBERS: 'assignTeamMembers',
  ASSIGN_FIELDS: 'assignFields',
  ASSIGN_WORKERS: 'assignWorkers',
  ASSIGN_GEOFENCE: 'assignGeofence',
  EDIT: 'edit',
} as const;

// Geofence constants
export const GEOFENCE_RADIUS = {
  MIN: 100,
  MAX: 1000,
  DEFAULT: 100,
  STEP: 10,
} as const;

/** Accent color for geofence UI (drawer, map circle). */
export const GEOFENCE_ACCENT_COLOR = '#037c6b';

/** Map ID required for Advanced Markers. */
export const GEOFENCE_MAP_ID = 'geofence-map';

/** Default map center (San Francisco) used before an address is geocoded. */
export const DEFAULT_MAP_CENTER: { lat: number; lng: number } = {
  lat: 37.7749,
  lng: -122.4194,
};

// Navigation routes
export const ASSIGNMENT_NAVIGATION_ROUTES = {
  TIME_SETTINGS: '/app/accountsettings?p=time',
} as const;

// Logging Constants
export const ASSIGNMENT_LOGGING_CONSTANTS = {
  // API Error Logs
  API_ERRORS: {
    APOLLO_CLIENT_NOT_INITIALIZED: 'APOLLO_CLIENT_NOT_INITIALIZED',
    GET_TIME_AGAINST_ASSIGNMENT_SUMMARY_FAILED:
      'GET_TIME_AGAINST_ASSIGNMENT_SUMMARY_FAILED',
  },

  // Navigation Logs
  NAVIGATION: {
    ASSIGNMENTS_WIDGET_MOUNTED: 'ASSIGNMENTS_WIDGET_MOUNTED',
  },
} as const;
