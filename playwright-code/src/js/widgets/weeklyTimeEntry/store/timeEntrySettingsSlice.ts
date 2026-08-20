import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  UxPreferenceData,
  UxPreferenceKey,
  DEFAULT_UX_PREFERENCE_DATA_STATE,
  UxPreferenceHideTimeEntryFieldsData,
  UxPreferenceHideWeekdaysData,
} from 'src/js/service/utils/useUXPreferences';
import { TeamMember } from './timeEntryGridSlice';
import { getVisibleDaysFromPreferences } from '../utils/helpers';

/**
 * State interface for time entry settings and user preferences
 * Manages user experience preferences, panel visibility, calendar settings, and visible days
 */
export interface TimeEntrySettingsState {
  // UX Preferences data
  hideTimeEntryFields: UxPreferenceHideTimeEntryFieldsData;
  hideWeekdays: UxPreferenceHideWeekdaysData;
  timeEntryTimeFor: TeamMember | null; // Store the full TeamMember object

  // Tour preferences
  weeklyTimesheetTourCompleted: boolean;

  // Settings Panel state tracking
  panelValues: UxPreferenceHideWeekdaysData; // Current panel state values

  // Company settings from useCompanySettings
  isServiceFieldEnabled: boolean;
  isBillingFieldEnabled: boolean;
  billingRateForTimeEnabled?: boolean; // Controls whether to show billable rate field
  firstDayOfWeek: number; // 0 (Sunday) to 6 (Saturday)
  isClassEnabled: boolean;
  isLocationEnabled: boolean;
  classRequired?: boolean;
  locationRequired?: boolean;
  serviceItemRequired?: boolean;
  requireBillable?: boolean;
  timeSheetEntryMakesNotesRequiredEnabled?: boolean;

  // Loading states
  loading: boolean; // Loading state for settings operations

  // Error states
  error: any; // Error object if settings fail to load or save

  // UI state
  panelOpen: boolean; // Whether the settings panel is currently visible
  visibleDays: number[]; // Days that should be displayed in the grid (0-6)
}

// Initial state with default values
const initialState: TimeEntrySettingsState = {
  // UX Preferences defaults
  hideTimeEntryFields: {
    isClassFieldEnabled: true,
    isProjectFieldEnabled: true,
    isLocationFieldEnabled: true,
    isPayTypeFieldEnabled: true,
    isCostRateFieldEnabled: true,
    isTaxableFieldEnabled: true,
  },
  hideWeekdays: {
    isSundayHidden: false,
    isMondayHidden: false,
    isTuesdayHidden: false,
    isWednesdayHidden: false,
    isThursdayHidden: false,
    isFridayHidden: false,
    isSaturdayHidden: false,
  },
  timeEntryTimeFor: null,

  // Tour preferences defaults
  weeklyTimesheetTourCompleted: false,

  // Panel state defaults
  panelValues: {
    isSundayHidden: false,
    isMondayHidden: false,
    isTuesdayHidden: false,
    isWednesdayHidden: false,
    isThursdayHidden: false,
    isFridayHidden: false,
    isSaturdayHidden: false,
  },

  // Company settings defaults
  isServiceFieldEnabled: false,
  isBillingFieldEnabled: false,
  billingRateForTimeEnabled: false,
  firstDayOfWeek: 0, // Default to Sunday as first day of week
  isClassEnabled: false,
  isLocationEnabled: false,
  classRequired: false,
  requireBillable: false,
  locationRequired: false,
  serviceItemRequired: false,
  timeSheetEntryMakesNotesRequiredEnabled: false,

  // State defaults
  loading: false,
  error: null,
  panelOpen: true, // Settings panel is open by default
  visibleDays: [0, 1, 2, 3, 4, 5, 6], // Show all days by default
};

/**
 * Redux slice for managing time entry settings and user preferences
 * Handles UX preferences, company settings, panel visibility state, and visible days
 */
const timeEntrySettingsSlice = createSlice({
  name: 'timeEntrySettings',
  initialState,
  reducers: {
    /**
     * Sets an error object for time entry settings operations
     * Used when loading or saving settings fails
     * @param state - Current settings state
     * @param action - Payload containing error object or null
     */
    setTimeEntrySettingsError(state, action: PayloadAction<any>) {
      state.error = action.payload;
    },

    /**
     * Sets the loading state for time entry settings operations
     * @param state - Current settings state
     * @param action - Payload containing loading boolean
     */
    setTimeEntrySettingsLoading(
      state,
      action: PayloadAction<{ loading: boolean }>,
    ) {
      state.loading = action.payload.loading;
    },

    /**
     * Updates UX preferences data
     * @param state - Current settings state
     * @param action - Payload containing UX preferences data
     */
    setUxPreferences(
      state,
      action: PayloadAction<{
        hideTimeEntryFields?: UxPreferenceHideTimeEntryFieldsData;
        hideWeekdays?: UxPreferenceHideWeekdaysData;
        timeEntryTimeFor?: TeamMember;
        weeklyTimesheetTourCompleted?: boolean;
      }>,
    ) {
      if (action.payload.hideTimeEntryFields) {
        state.hideTimeEntryFields = action.payload.hideTimeEntryFields;
      }
      if (action.payload.hideWeekdays) {
        state.hideWeekdays = action.payload.hideWeekdays;
      }
      if (action.payload.timeEntryTimeFor !== undefined) {
        state.timeEntryTimeFor = action.payload.timeEntryTimeFor;
      }
      if (action.payload.weeklyTimesheetTourCompleted !== undefined) {
        state.weeklyTimesheetTourCompleted =
          action.payload.weeklyTimesheetTourCompleted;
      }
    },

    /**
     * Sets the weekly timesheet tour completion status
     * @param state - Current settings state
     * @param action - Payload containing tour completion status
     */
    setWeeklyTimesheetTourCompleted(state, action: PayloadAction<boolean>) {
      state.weeklyTimesheetTourCompleted = action.payload;
    },

    /**
     * Updates company settings data
     * @param state - Current settings state
     * @param action - Payload containing company settings data
     */
    setCompanySettings(
      state,
      action: PayloadAction<{
        isServiceFieldEnabled?: boolean;
        isBillingFieldEnabled?: boolean;
        billingRateForTimeEnabled?: boolean;
        firstDayOfWeek?: number;
        isClassEnabled?: boolean;
        isLocationEnabled?: boolean;
        classRequired?: boolean;
        requireBillable?: boolean;
        locationRequired?: boolean;
        serviceItemRequired?: boolean;
        billableRequired?: boolean;
        timeSheetEntryMakesNotesRequiredEnabled?: boolean;
      }>,
    ) {
      if (action.payload.isServiceFieldEnabled !== undefined) {
        state.isServiceFieldEnabled = action.payload.isServiceFieldEnabled;
      }
      if (action.payload.isBillingFieldEnabled !== undefined) {
        state.isBillingFieldEnabled = action.payload.isBillingFieldEnabled;
      }
      if (action.payload.billingRateForTimeEnabled !== undefined) {
        state.billingRateForTimeEnabled =
          action.payload.billingRateForTimeEnabled;
      }
      if (action.payload.firstDayOfWeek !== undefined) {
        state.firstDayOfWeek = action.payload.firstDayOfWeek;
      }
      if (action.payload.isClassEnabled !== undefined) {
        state.isClassEnabled = action.payload.isClassEnabled;
      }
      if (action.payload.isLocationEnabled !== undefined) {
        state.isLocationEnabled = action.payload.isLocationEnabled;
      }
      if (action.payload.classRequired !== undefined) {
        state.classRequired = action.payload.classRequired;
      }
      if (action.payload.locationRequired !== undefined) {
        state.locationRequired = action.payload.locationRequired;
      }
      if (action.payload.serviceItemRequired !== undefined) {
        state.serviceItemRequired = action.payload.serviceItemRequired;
      }
      if (action.payload.requireBillable !== undefined) {
        state.requireBillable = action.payload.requireBillable;
      }
      if (
        action.payload.timeSheetEntryMakesNotesRequiredEnabled !== undefined
      ) {
        state.timeSheetEntryMakesNotesRequiredEnabled =
          action.payload.timeSheetEntryMakesNotesRequiredEnabled;
      }
    },

    /**
     * Sets the first day of the week for calendar display
     * Affects how the weekly grid is displayed (Sunday vs Monday start)
     * @param state - Current settings state
     * @param action - Payload containing day number (0 = Sunday, 1 = Monday, etc.)
     */
    setFirstDayOfWeek(state, action: PayloadAction<number>) {
      state.firstDayOfWeek = action.payload;
    },

    /**
     * Sets the visible days configuration
     * Controls which days of the week are shown in the grid
     * @param state - Current settings state
     * @param action - Payload containing array of visible day indices
     */
    setVisibleDays(state, action: PayloadAction<{ visibleIndices: number[] }>) {
      state.visibleDays = action.payload.visibleIndices;
    },

    /**
     * Initializes panel values with current hideWeekdays state
     * Called when the settings panel is mounted to set the initial panel state
     * @param state - Current settings state
     */
    initializePanelValues(state) {
      state.panelValues = { ...state.hideWeekdays };
    },

    /**
     * Updates panel values for a specific weekday
     * Used when user changes a weekday setting in the panel
     * @param state - Current settings state
     * @param action - Payload containing weekday name and new value
     */
    updatePanelValue(
      state,
      action: PayloadAction<{
        weekday: keyof UxPreferenceHideWeekdaysData;
        value: boolean;
      }>,
    ) {
      const { weekday, value } = action.payload;
      state.panelValues[weekday] = value;
    },

    /**
     * Resets panel values to match current hideWeekdays state
     * Used when panel is reset or when settings are cancelled
     * @param state - Current settings state
     */
    resetPanelValues(state) {
      state.panelValues = { ...state.hideWeekdays };
    },

    /**
     * Toggles visibility of a specific day
     * Adds or removes the day from the visible days array
     * Maintains sorted order of visible days
     * @param state - Current settings state
     * @param action - Payload containing the day index to toggle
     */
    toggleDayVisibility(state, action: PayloadAction<{ dayIdx: number }>) {
      const { dayIdx } = action.payload;
      const currentIndex = state.visibleDays.indexOf(dayIdx);
      if (currentIndex > -1) {
        state.visibleDays.splice(currentIndex, 1);
      } else {
        state.visibleDays.push(dayIdx);
      }
      state.visibleDays.sort();
    },

    /**
     * Opens the settings panel
     * Makes the settings panel visible to the user
     * @param state - Current settings state
     */
    openPanel(state) {
      state.panelOpen = true;
    },

    /**
     * Closes the settings panel
     * Hides the settings panel from the user
     * @param state - Current settings state
     */
    closePanel(state) {
      state.panelOpen = false;
    },

    /**
     * Resets time entry settings to current slice state
     * Restores current UX preferences and recalculates visible days
     * @param state - Current settings state
     */
    resetTimeEntrySettings(state) {
      // Keep the current company settings and UX preferences data
      // but reset other state properties to initial values
      const currentCompanySettings = {
        isServiceFieldEnabled: state.isServiceFieldEnabled,
        isBillingFieldEnabled: state.isBillingFieldEnabled,
        billingRateForTimeEnabled: state.billingRateForTimeEnabled,
        firstDayOfWeek: state.firstDayOfWeek,
        isClassEnabled: state.isClassEnabled,
        isLocationEnabled: state.isLocationEnabled,
        classRequired: state.classRequired,
        requireBillable: state.requireBillable,
        locationRequired: state.locationRequired,
        serviceItemRequired: state.serviceItemRequired,
        billableRequired: state.requireBillable,
        timeSheetEntryMakesNotesRequiredEnabled:
          state.timeSheetEntryMakesNotesRequiredEnabled,
      };

      const currentUxPreferences = {
        hideTimeEntryFields: { ...state.hideTimeEntryFields },
        hideWeekdays: { ...state.hideWeekdays },
        timeEntryTimeFor: state.timeEntryTimeFor,
      };

      // Then restore the current company settings and UX preferences
      Object.assign(state, currentCompanySettings);
      Object.assign(state, currentUxPreferences);

      // Calculate visible days based on current UX preferences
      if (state.hideWeekdays) {
        const visibleDays = getVisibleDaysFromPreferences(
          state.hideWeekdays,
          state.firstDayOfWeek,
        );
        state.visibleDays = visibleDays;
      } else {
        // Fallback to showing all days
        state.visibleDays = [0, 1, 2, 3, 4, 5, 6];
      }

      // Reset error and panel state
      state.error = null;
      state.panelOpen = true;
      state.panelValues = { ...state.hideWeekdays };
    },

    // Legacy actions for backward compatibility
    /**
     * @deprecated Use setUxPreferences instead
     */
    setTimeEntrySettingsData(
      state,
      action: PayloadAction<Partial<UxPreferenceData>>,
    ) {
      // This is now handled by setUxPreferences
    },

    /**
     * @deprecated Use setUxPreferences instead
     */
    setTimeEntrySetting(
      state,
      action: PayloadAction<{ key: UxPreferenceKey; value: any }>,
    ) {
      // This is now handled by setUxPreferences
    },
  },
});

// Export actions for use in components
export const {
  setTimeEntrySettingsError,
  setTimeEntrySettingsLoading,
  setUxPreferences,
  setWeeklyTimesheetTourCompleted,
  setCompanySettings,
  setFirstDayOfWeek,
  setVisibleDays,
  initializePanelValues,
  updatePanelValue,
  resetPanelValues,
  toggleDayVisibility,
  openPanel,
  closePanel,
  resetTimeEntrySettings,
  // Legacy actions for backward compatibility
  setTimeEntrySettingsData,
  setTimeEntrySetting,
} = timeEntrySettingsSlice.actions;

// Export the reducer for store configuration
export default timeEntrySettingsSlice.reducer;
