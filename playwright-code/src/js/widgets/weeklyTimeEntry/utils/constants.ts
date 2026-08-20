export const WEEKLY_TIME_ENTRY_WIDGET_ID =
  'time-tracking-ui/weeklyTimeEntryTrowser';

export const WEEKLY_TIME_ENTRY_DURATION_PATTERN = /^(\d{1,2}):(\d{1,2})$/;

export const WEEKLY_TIME_ENTRY_DECIMAL_PATTERN = /^-?\d*\.?\d+$/;

export const WEEKLY_SUPER_SEARCH_CUSTOMER_PAGE_SIZE = 100;

// Logging Constants
export const WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS = {
  // Error Logs
  ERRORS: {
    APOLLO_CLIENT_NOT_INITIALIZED:
      'Component=Widget Error=Apollo Client Not Initialized',
    WEEKLY_TIME_ENTRIES_EXPORT_FAILED:
      'Component=useExportAndSave Error=Weekly Time Entries Export Failed',
    NO_DATES_FOR_WEEKLY_TIME_ENTRIES_EXPORT:
      'Component=useExportAndSave Error=Invalid Start or End Date Provided for Exporting Weekly Time Entries',
    WEEKLY_TIME_ENTRIES_PRINT_FAILED:
      'Component=useExportAndSave Error=Weekly Time Entries Print Failed',
    SAVE_TIME_ENTRIES_FAILED:
      'Component=useSaveWeeklyTimeEntries Event=Error saving weekly time entries: ',
    READ_TIME_ENTRIES_FAILED:
      'Component=useReadWeeklyTimeEntries Message=Failed to Fetch Weekly Time Entries',
    ERROR_FETCHING_TIME_ENTRIES:
      'Component=useReadWeeklyTimeEntries Message=An Error Encountered While Fetching Weekly Time Entries',
    BREAKS_DATA_LOAD_FAILED:
      'Component=useBreaksDataFetching Event=Failed Fetching Breaks Data',
    CUSTOMER_DATA_LOAD_FAILED:
      'Component=useCustomerDataFetching Event=Failed Fetching Customer Data',
  },

  // Navigation Logs
  NAVIGATION: {
    WEEKLY_TIME_ENTRY_WIDGET_MOUNTED:
      'Component=Widget Message=Weekly Time Entry Widget Mounted',
  },

  // User Interaction Logs
  USER_INTERACTIONS: {
    UNSAVED_CHANGES_MODAL_OPENED:
      'Component=WeeklyTimeEntryTrowser Event=Unsaved Changes Modal Opened With Action Type: ',
    UNSAVED_CHANGES_MODAL_CLOSED_AFTER_CONFIRM:
      'Component=WeeklyTimeEntryTrowser Event=Unsaved Changes Modal Closed After Clicking Confirm',
    UNSAVED_CHANGES_MODAL_CLOSED_AFTER_CANCEL:
      'Component=WeeklyTimeEntryTrowser Event=Unsaved Changes Modal Closed After Clicking Cancel',
    APPROVED_ENTRIES_MODAL_CLOSED_AFTER_CANCEL:
      'Component=WeeklyTimeEntryTrowser Event=Approved Entries Modal Closed After Clicking Cancel',
    WEEKLY_TIME_ENTRY_TROWSER_CLOSED:
      'Component=WeeklyTimeEntryTrowser Event=Weekly Time Entry Trowser Closed',
    COPY_LAST_TIMESHEET_BUTTON_CLICKED:
      'Component=WeeklyTimeEntryTrowser Event=Copy Last Timesheet Button Clicked',
    COPY_LAST_TIMESHEET_MODAL_CLOSED:
      'Component=WeeklyTimeEntryTrowser Event=Copy Last Timesheet Modal Closed',
    COPY_LAST_TIMESHEET_OVERWRITE_CLICKED:
      'Component=WeeklyTimeEntryTrowser Event=Overwrite Chosen inside Copy Last Timesheet Modal',
    COPY_LAST_TIMESHEET_ADD_CLICKED:
      'Component=WeeklyTimeEntryTrowser Event=Add Chosen inside Copy Last Timesheet Modal',
    FEEDBACK_POPOVER_OPENED:
      'Component=WeeklyTimeEntryTrowser Event=Feedback Popover Opened',
    FEEDBACK_POPOVER_CLOSED:
      'Component=WeeklyTimeEntryTrowser Event=Feedback Popover Closed',
    WEEKLY_TIME_ENTRY_PANEL_OPEN:
      'Component=WeeklyTimeEntryTrowser Event=Weekly Time Entry Panel Opened',
    WEEKLY_TIME_ENTRY_PANEL_CLOSE:
      'Component=WeeklyTimeEntryTrowser Event=Weekly Time Entry Panel Closed',
    WEEKLY_TIME_ENTRY_CONTEXT_MENU_OPEN:
      'Component=WeeklyTimeEntryTable Event=Weekly Time Entry Context Menu Open',
    WEEKLY_TIME_ENTRY_CONTEXT_MENU_CLOSE:
      'Component=WeeklyTimeEntryTable Event=Weekly Time Entry Context Menu Closed',
    TEAM_MEMBER_CHANGED:
      'Component=TeamMemberDropdown Event=Selected Team Member Changed from dropdown',
    DATE_RANGE_CHANGED_USING_WEEK_NAVIGATION:
      'Component=WeekNavigator Event=Selected Date Range Changed Using Week Navigation',
    DATE_RANGE_CHANGED_USING_CALENDAR:
      'Component=WeekNavigator Event=Selected Date Range Changed Using Calendar',
  },

  // Form State Logs
  FORM_STATE: {
    VALIDATION_ERRORS_PRESENT:
      'Component=WeeklyTimeEntryTrowser Message=Validation Errors Present inside Weekly Time Sheet',
  },

  // Success Logs
  SUCCESS: {
    WEEKLY_TIME_ENTRIES_OVERRIDDEN:
      'Component=useCopyLastWeek Message=Weekly Time Entries Successfully Overridden',
    WEEKLY_TIME_ENTRIES_COPIED:
      'Component=useCopyLastWeek Message=Last Week Time Entries Successfully Copied',
    WEEKLY_TIME_ENTRIES_FETCH_SUCCESS:
      'Component=useReadWeeklyTimeEntries Message=Weekly Time Entries Fetched Successfully',
    WEEKLY_TIME_ENTRIES_EXPORT_SUCCESS:
      'Component=useExportAndSave Message=Weekly Time Entries Exported Successfully',
    WEEKLY_TIME_ENTRIES_PRINT_SUCCESS:
      'Component=useExportAndSave Message=Weekly Time Entries Printed Successfully',
    WEEKLY_TIME_ENTRIES_SAVE_SUCCESS:
      'Component=useSaveWeeklyTimeEntries Event=Successfully saved weekly time entries',
    WEEKLY_TIME_ENTRIES_PARTIAL_SUCCESS:
      'Component=useSaveWeeklyTimeEntries Message=Partial Success - Some Time Entries Failed',
    BREAKS_DATA_FETCH_SUCCESS:
      'Component=useBreaksDataFetching Event=Breaks Data Fetched Successfully',
    CUSTOMER_DATA_FETCH_SUCCESS:
      'Component=useCustomerDataFetching Event=Customer Data Fetched Successfully',
  },

  // Performance Logs
  PERFORMANCE: {
    INPUT_DATA_DEBUG_FOR_SAVING_TIME_ENTRIES:
      'Component=useSaveWeeklyTimeEntries Event=inputData debug',
    SAVE_TIME_ENTRIES_HAS_DATA_TO_SAVE:
      'Component=useSaveWeeklyTimeEntries Event=hasDataToSave computed',
    NO_TIME_ENTRIES_TO_SAVE:
      'Component=useSaveWeeklyTimeEntries Event=No time entries to save',
    INITIATE_SAVE_TIME_ENTRIES:
      'Component=useSaveWeeklyTimeEntries Event=Starting save operation for changed and deleted time entries',
  },
} as const;
