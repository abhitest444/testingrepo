// ==========================================
// Approvals Feature - Logging Constants
// ==========================================

/**
 * Logging constants for Approvals feature
 * Format: Component=<ComponentName> Event=<EventName>
 * Used with sandbox.logger.info() for tracking user interactions and component lifecycle
 */
export const APPROVALS_LOGGING = {
  // ApprovalsFeature (index.tsx) - Main container component
  FEATURE_MOUNTED: 'Component=ApprovalsFeature Event=FeatureMounted',
  UNKNOWN_FUNCTIONALITY: 'Component=Approvals Error=UnknownFunctionality',

  // SubmitTimePanel - Time submission panel component
  SUBMIT_TIME_PANEL_MOUNTED: 'Component=SubmitTimePanel Event=ComponentMounted',
  SUBMIT_TIME_PANEL_UNMOUNTED:
    'Component=SubmitTimePanel Event=ComponentUnmounted',
  SUBMIT_TIME_PANEL_CLOSED: 'Component=SubmitTimePanel Event=PanelClosed',
  SUBMIT_TIME_PANEL_DATE_CHANGED:
    'Component=SubmitTimePanel Event=SubmitThroughDateChanged',
  SUBMIT_TIME_PANEL_WEEK_TOGGLED: 'Component=SubmitTimePanel Event=WeekToggled',
  SUBMIT_TIME_PANEL_CONFIRM: 'Component=SubmitTimePanel Event=ConfirmClicked',
  SUBMIT_TIME_PANEL_SUBMIT_CLICKED:
    'Component=SubmitTimePanel Event=SubmitClicked',

  // API Events
  API_FETCH_TIME_ENTRIES_STARTED:
    'Component=SubmitTimePanel Event=FetchTimeEntriesStarted',
  API_FETCH_TIME_ENTRIES_SUCCESS:
    'Component=SubmitTimePanel Event=FetchTimeEntriesSuccess',
  API_FETCH_TIME_ENTRIES_FAILED:
    'Component=SubmitTimePanel Error=FetchTimeEntriesFailed',

  API_SUBMIT_TIME_STARTED: 'Component=SubmitTimePanel Event=SubmitTimeStarted',
  API_SUBMIT_TIME_SUCCESS: 'Component=SubmitTimePanel Event=SubmitTimeSuccess',
  API_SUBMIT_TIME_FAILED: 'Component=SubmitTimePanel Error=SubmitTimeFailed',
} as const;
