// ==========================================
// Assignment Constants
// ==========================================

/**
 * The entityName value returned by the API for assignments whose user
 * no longer exists in the system (deleted / orphaned accounts).
 * Used to filter phantom assignments out of member counts and wizard pre-selection.
 */
export const USER_NOT_FOUND_ENTITY_NAME = 'User Not Found';

// ==========================================
// Feature Names
// ==========================================
export const FEATURE_NAMES = {
  OVERTIME: 'overtime',
  APPROVALS: 'approvals',
  WORKERS: 'workers',
  TIME_KIOSK: 'time-kiosk',
} as const;

// ==========================================
// Functionality Names
// ==========================================
export const FUNCTIONALITY_NAMES = {
  // Overtime functionalities
  SETTINGS_HANDLE: 'settings-handle',
  LANDING_PAGE: 'landing-page',
  SETUP_POLICY: 'setup-policy',
  POLICY_DETAILS: 'policy-details',
  // Approvals functionalities
  SUBMIT_TIME_PANEL: 'submit-time-panel',
  // Time kiosk functionalities
  KIOSK_SETTINGS_HANDLE: 'kiosk-settings-handle',
} as const;

// ==========================================
// Logging Constants
// ==========================================
export const ORCHESTRATOR_LOGGING = {
  WIDGET_MOUNTED:
    'Plugin=time-tracking-ui Event=QBT_ORCHESTRATOR_WIDGET_MOUNTED',
  WIDGET_CRASH: 'Plugin=time-tracking-ui Error=QBT_ORCHESTRATOR_WIDGET_CRASH',
  APOLLO_CLIENT_ERROR:
    'Plugin=time-tracking-ui Error=QBT_ORCHESTRATOR_APOLLO_CLIENT_NOT_INITIALIZED',
  FEATURE_LOADED:
    'Plugin=time-tracking-ui Event=QBT_ORCHESTRATOR_FEATURE_LOADED',
  FEATURE_ERROR: 'Plugin=time-tracking-ui Error=QBT_ORCHESTRATOR_FEATURE_ERROR',
  REDUCER_INJECTED:
    'Plugin=time-tracking-ui Event=QBT_ORCHESTRATOR_REDUCER_INJECTED',
  SCREEN_NAVIGATION:
    'Plugin=time-tracking-ui Event=QBT_ORCHESTRATOR_SCREEN_NAVIGATION',
  ERROR_BOUNDARY_CAUGHT:
    'Plugin=time-tracking-ui Error=QBT_ORCHESTRATOR_ERROR_BOUNDARY_CAUGHT',
} as const;
