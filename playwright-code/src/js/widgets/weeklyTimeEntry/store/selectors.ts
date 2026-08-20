import { createSelector } from '@reduxjs/toolkit';
import {
  getFallbackStandardFieldsVisibility,
  getStandardFieldsVisibilityWithAssignmentOverride,
} from 'src/js/common/assignmentFieldUtils';
import type { RootState } from './index';
import { selectDimensionsState } from './dimensionsSlice';
import { updateWeekdayDataFlag } from '../utils/helpers';

// ============================================================================
// BASE SELECTORS - Direct state access selectors
// ============================================================================

/**
 * Selects the currently selected cell in the time entry grid
 * @param state - Root state of the application
 * @returns Selected cell information or null if no cell is selected
 */
export const selectSelectedCell = (state: RootState) =>
  state.timeEntryGrid.selected;

/**
 * Selects the state for modal seeking confirmation of conversion of start-end time entry to duration time entry
 * @param state - Root state of the application
 * @returns Boolean indicating whether the modal is open or not
 */
export const selectConfirmTimeEntryConversionModal = (state: RootState) =>
  state.timeEntryGrid.confirmTimeEntryConversionModal;

/**
 * Selects whether the settings panel is currently open
 * @param state - Root state of the application
 * @returns Boolean indicating if the settings panel is visible
 */
export const selectPanelOpen = (state: RootState) =>
  state.timeEntrySettings.panelOpen;

// ============================================================================
// TEAM MEMBER AND DATE RANGE SELECTORS
// ============================================================================

/**
 * Selects the currently selected team member for time entry viewing
 * @param state - Root state of the application
 * @returns Team member information or null if no team member is selected
 */
export const selectTeamMember = (state: RootState) =>
  state.timeEntryGrid.teamMember;

/**
 * Selects the visibility state of the team member selection tooltip
 * @param state - Root state of the application
 * @returns Boolean indicating if the team member selection tooltip should be shown
 */
export const selectShowSelectTeamMemberTooltip = (state: RootState) =>
  state.timeEntryGrid.showSelectTeamMemberTooltip;

/**
 * Selects the team member dropdown ready state
 * @param state - Root state of the application
 * @returns Boolean indicating if the team member dropdown is ready for tour
 */
export const selectTeamMemberDropdownReady = (state: RootState) =>
  state.timeEntryGrid.isTeamMemberDropdownReady;

/**
 * Selects the time category selector ready state
 * @param state - Root state of the application
 * @returns Boolean indicating if time category selector is ready for tour
 */
export const selectTimeCategorySelectorReady = (state: RootState) =>
  Boolean(state.timeEntryGrid.isTimeCategorySelectorReady);

/**
 * Selects the QuickFind feature flag enabled state (for team member dropdown)
 * @param state - Root state of the application
 * @returns Boolean indicating if QuickFind feature is enabled
 */
export const selectQuickFindEnabled = (state: RootState) =>
  state.timeEntryGrid.isQuickFindEnabled;

/**
 * Selects the QuickFind feature flag settled state (for team member dropdown)
 * @param state - Root state of the application
 * @returns Boolean indicating if QuickFind feature flag has settled
 */
export const selectQuickFindSettled = (state: RootState) =>
  state.timeEntryGrid.isQuickFindSettled;

/**
 * Selects the current date range for the weekly time entry view
 * @param state - Root state of the application
 * @returns Object containing start and end dates for the week
 */
export const selectDateRange = (state: RootState) =>
  state.timeEntryGrid.dateRange;

/**
 * Selects the first day of the week setting for calendar display
 * @param state - Root state of the application
 * @returns Number representing the first day of the week (0 = Sunday, 1 = Monday, etc.)
 */
export const selectFirstDayOfWeek = (state: RootState) =>
  state.timeEntrySettings.firstDayOfWeek;

/**
 * Selects the visible days configuration
 * @param state - Root state of the application
 * @returns Array of day indices that should be displayed in the grid
 */
export const selectVisibleDays = (state: RootState) =>
  state.timeEntrySettings.visibleDays;

/**
 * Selects the first edited cells tracking for change detection
 * @param state - Root state of the application
 * @returns Object tracking the first edited state of cells
 */
export const selectFirstEditedCells = (state: RootState) =>
  state.timeEntryGrid.firstEditedCells;

// ============================================================================
// HASHMAP-BASED SELECTORS - Convert hashmap to arrays for backward compatibility
// ============================================================================

/**
 * Converts hashmap-based weeklyTimeEntries to array format for backward compatibility
 * @param state - Root state of the application
 * @returns Array of timesheet rows in display order
 */
export const selectTimesheetRowsMap = (state: RootState) => {
  const { weeklyTimeEntries, rowOrder } = state.timeEntryGrid;

  return rowOrder
    .map((rowId) => weeklyTimeEntries[rowId])
    .filter((row): row is NonNullable<typeof row> => row !== undefined);
};

/**
 * Memoized selector for timesheet rows data (excluding deleted rows)
 * Caches the result to prevent unnecessary re-renders
 * @param state - Root state of the application
 * @returns Array of time entry rows excluding deleted ones
 */
export const selectTimesheetRows = createSelector(
  [selectTimesheetRowsMap],
  (rows) => rows.filter((row) => !row.deleted),
);

/**
 * Memoized selector for ALL timesheet rows including deleted ones
 * Used by save operations to find entries marked for deletion
 * @param state - Root state of the application
 * @returns Array of all timesheet rows including deleted ones
 */
export const selectAllTimesheetRows = createSelector(
  [selectTimesheetRowsMap],
  (rows) => rows,
);

/**
 * Memoized selector that checks if there are time entries with actual data in the grid
 * Used to determine if the copy last week modal should show or just overwrite by default
 * @param state - Root state of the application
 * @returns Boolean indicating if there are time entries with data
 */
export const selectHasTimeEntriesWithData = createSelector(
  [selectAllTimesheetRows],
  (rows) => {
    if (!rows || rows.length === 0) return false;

    return rows.some((row) =>
      // Check if any day in the row has actual time entry data
      Object.values(row.timeEntries).some(
        (dayEntry) =>
          // Check if the day has a time entry ID (indicating it's a saved entry)
          // or if it has hours greater than 0 (indicating user has entered data)
          // Note: We don't consider CREATE operations as having data for modal purposes
          // since we want to show modal only when there are actual saved entries
          (dayEntry.timeEntryId && dayEntry.timeEntryId.trim() !== '') ||
          (dayEntry.hours && dayEntry.hours > 0),
      ),
    );
  },
);

/**
 * Selects the hashmap of weekly time entries for direct access
 * @param state - Root state of the application
 * @returns Hashmap of rowId to TimesheetRow
 */
export const selectWeeklyTimeEntriesMap = (state: RootState) =>
  state.timeEntryGrid.weeklyTimeEntries;

/**
 * Selects the row order array for display purposes
 * @param state - Root state of the application
 * @returns Array of rowIds in display order
 */
export const selectRowOrder = (state: RootState) =>
  state.timeEntryGrid.rowOrder;

/**
 * Memoized selector that generates week dates from the date range
 * Creates an array of 7 dates starting from the selected week's start date
 * @param state - Root state of the application
 * @returns Array of date strings in YYYY-MM-DD format
 */
export const selectWeekDates = createSelector(
  [selectDateRange],
  (dateRange) => {
    if (!dateRange.start || !dateRange.end) return [];

    // Generate 7 dates from the start date
    const dates = [];

    try {
      // Parse the start date to avoid timezone issues
      const startDateParts = dateRange.start.split('-');

      // Validate date format
      if (startDateParts.length !== 3) {
        return [];
      }

      const startYear = parseInt(startDateParts[0], 10);
      const startMonth = parseInt(startDateParts[1], 10) - 1; // Month is 0-indexed
      const startDay = parseInt(startDateParts[2], 10);

      // Validate parsed values
      if (
        Number.isNaN(startYear) ||
        Number.isNaN(startMonth) ||
        Number.isNaN(startDay)
      ) {
        return [];
      }

      // Create start date in local timezone to avoid timezone shifts
      const startDate = new Date(startYear, startMonth, startDay);

      // Generate 7 dates from the start date
      for (let i = 0; i < 7; i += 1) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        // Format as YYYY-MM-DD
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');

        dates.push(`${year}-${month}-${day}`);
      }

      return dates;
    } catch (error) {
      // Return empty array if date parsing fails
      return [];
    }
  },
);

// ============================================================================
// TIME ENTRY SETTINGS SELECTORS
// ============================================================================

/**
 * Selects all company settings data
 * @param state - Root state of the application
 * @returns Object containing all company settings
 */
export const selectCompanySettings = createSelector(
  [
    (state: RootState) => state.timeEntrySettings.isServiceFieldEnabled,
    (state: RootState) => state.timeEntrySettings.isBillingFieldEnabled,
    (state: RootState) => state.timeEntrySettings.billingRateForTimeEnabled,
    (state: RootState) => state.timeEntrySettings.firstDayOfWeek,
    (state: RootState) => state.timeEntrySettings.isClassEnabled,
    (state: RootState) => state.timeEntrySettings.isLocationEnabled,
    (state: RootState) => state.timeEntrySettings.classRequired,
    (state: RootState) => state.timeEntrySettings.locationRequired,
    (state: RootState) => state.timeEntrySettings.serviceItemRequired,
    (state: RootState) => state.timeEntrySettings.requireBillable,
    (state: RootState) =>
      state.timeEntrySettings.timeSheetEntryMakesNotesRequiredEnabled,
  ],
  (
    isServiceFieldEnabled,
    isBillingFieldEnabled,
    billingRateForTimeEnabled,
    firstDayOfWeek,
    isClassEnabled,
    isLocationEnabled,
    classRequired,
    locationRequired,
    serviceItemRequired,
    requireBillable,
    timeSheetEntryMakesNotesRequiredEnabled,
  ) => ({
    isServiceFieldEnabled,
    isBillingFieldEnabled,
    billingRateForTimeEnabled,
    firstDayOfWeek,
    isClassEnabled,
    isLocationEnabled,
    classRequired,
    locationRequired,
    serviceItemRequired,
    requireBillable,
    timeSheetEntryMakesNotesRequiredEnabled,
  }),
);

/**
 * Memoized per-customer standard field visibility (from SF assignment response).
 * Used so WTE panel updates correctly when the selected row's customer changes.
 * Call as: selectBaseStandardFieldsVisibilityForCustomer(state, customerId).
 */
export const selectBaseStandardFieldsVisibilityForCustomer = createSelector(
  [
    (state: RootState) => selectCompanySettings(state),
    (state: RootState) => state.assignments.customerAssignments,
    (_state: RootState, customerId: string | null) => customerId,
  ],
  (companySettings, customerAssignments, customerId) => {
    const fallback = getFallbackStandardFieldsVisibility(companySettings);
    if (!customerId) return fallback;
    const data = customerAssignments[customerId];
    if (!data) return fallback;
    return getStandardFieldsVisibilityWithAssignmentOverride(
      companySettings,
      data.standardFieldAssignments ?? [],
    );
  },
);

/**
 * Selects enabled fields from time entry settings
 * @param state - Root state of the application
 * @returns Object containing enabled field settings
 */
export const selectEnabledFields = createSelector(
  [
    (state: RootState) => state.timeEntrySettings.isClassEnabled,
    (state: RootState) => state.timeEntrySettings.isLocationEnabled,
  ],
  (isClassEnabled, isLocationEnabled) => ({
    isClassEnabled,
    isLocationEnabled,
  }),
);

/**
 * Selects any error that occurred while loading UX preferences
 * @param state - Root state of the application
 * @returns Error object or null if no error occurred
 */
export const selectUxPreferencesError = (state: RootState) =>
  state.timeEntrySettings.error;

/**
 * Selects the hide time entry fields preference setting
 * @param state - Root state of the application
 * @returns Boolean indicating if time entry fields should be hidden
 */
export const selectHideTimeEntryFields = (state: RootState) =>
  state.timeEntrySettings.hideTimeEntryFields;

/**
 * Selects the hide weekdays preference setting
 * @param state - Root state of the application
 * @returns Object containing weekday visibility preferences
 */
export const selectHideWeekdays = (state: RootState) =>
  state.timeEntrySettings.hideWeekdays;

/**
 * Selects the current panel values for weekday settings
 * @param state - Root state of the application
 * @returns Object containing current panel weekday settings
 */
export const selectPanelValues = (state: RootState) =>
  state.timeEntrySettings.panelValues;

/**
 * Selects the time entry time for setting
 * @param state - Root state of the application
 * @returns TeamMember object indicating the selected time for entry
 */
export const selectTimeEntryTimeFor = (state: RootState) =>
  state.timeEntrySettings.timeEntryTimeFor;

/**
 * Selects the loading state for UX preferences operations
 * @param state - Root state of the application
 * @returns Boolean indicating if UX preferences are currently loading
 */
export const selectTimeEntrySettingsLoading = (state: RootState) =>
  state.timeEntrySettings.loading;

/**
 * Selects any error that occurred while loading time entry settings
 * @param state - Root state of the application
 * @returns Error object or null if no error occurred
 */
export const selectTimeEntrySettingsError = (state: RootState) =>
  state.timeEntrySettings.error;

/**
 * Selects the time entry settings state
 * @param state - Root state of the application
 * @returns TimeEntrySettingsState object
 */
export const selectTimeEntrySettings = (state: RootState) =>
  state.timeEntrySettings;

// ============================================================================
// CUSTOMER DATA SELECTORS
// ============================================================================

/**
 * Base selector for customer data IDs
 * @param state - Root state of the application
 * @returns Array of customer IDs
 */
const selectCustomerDataIds = (state: RootState) =>
  state.customers.customers.ids;

/**
 * Base selector for customer data entities
 * @param state - Root state of the application
 * @returns Object mapping customer IDs to customer data
 */
const selectCustomerDataEntities = (state: RootState) =>
  state.customers.customers.entities;

/**
 * Memoized selector for customer data for the current context using entity adapter
 * @param state - Root state of the application
 * @returns Array of customer information (normalized, in API response order)
 */
export const selectCustomerData = createSelector(
  [selectCustomerDataIds, selectCustomerDataEntities],
  (ids, entities) => ids.map((id) => entities[id]).filter(Boolean),
);

/**
 * Selects any error that occurred while loading customer data
 * @param state - Root state of the application
 * @returns Error object or null if no error occurred
 */
export const selectCustomerDataError = (state: RootState) =>
  state.customers.error;

/**
 * Selects the loading state for customer data operations
 * @param state - Root state of the application
 * @returns Boolean indicating if customer data is currently loading
 */
export const selectCustomerDataLoading = (state: RootState) =>
  state.customers.loading;

/**
 * Selects the loading state for time entry grid operations
 * @param state - Root state of the application
 * @returns Boolean indicating if time entry grid is currently loading
 */
export const selectTimeEntryGridLoading = (state: RootState) =>
  state.timeEntryGrid.loading;

// ============================================================================
// BREAKS SELECTORS
// ============================================================================

/**
 * Selects all breaks data
 * @param state - Root state of the application
 * @returns Array of breaks
 */
export const selectBreaks = (state: RootState) => state.breaks.breaks;

/**
 * Selects the loading state for breaks operations
 * @param state - Root state of the application
 * @returns Boolean indicating if breaks are currently loading
 */
export const selectBreaksLoading = (state: RootState) => state.breaks.loading;

/**
 * Selects any error that occurred while loading breaks
 * @param state - Root state of the application
 * @returns Error string or null if no error occurred
 */
export const selectBreaksError = (state: RootState) => state.breaks.error;

/**
 * Selects active breaks only
 * @param state - Root state of the application
 * @returns Array of active breaks
 */
export const selectActiveBreaks = createSelector([selectBreaks], (breaks) =>
  breaks.filter((breakItem) => breakItem.isActive && !breakItem.isDeleted),
);

/**
 * Selects paid breaks only
 * @param state - Root state of the application
 * @returns Array of paid breaks
 */
export const selectPaidBreaks = createSelector([selectActiveBreaks], (breaks) =>
  breaks.filter((breakItem) => breakItem.breakType === 'PAID'),
);

/**
 * Selects unpaid breaks only
 * @param state - Root state of the application
 * @returns Array of unpaid breaks
 */
export const selectUnpaidBreaks = createSelector(
  [selectActiveBreaks],
  (breaks) => breaks.filter((breakItem) => breakItem.breakType === 'UNPAID'),
);

// ============================================================================
// TIME ENTRY GRID SELECTORS
// ============================================================================

// ============================================================================
// CUSTOM FIELDS SELECTORS
// ============================================================================

/**
 * Selects all custom field definitions
 * @param state - Root state of the application
 * @returns Array of custom field definitions
 */
export const selectCustomFields = (state: RootState) =>
  state.customFields.customFields;

/**
 * Selects the custom fields loading state
 * @param state - Root state of the application
 * @returns Boolean indicating if custom fields are being loaded
 */
export const selectCustomFieldsLoading = (state: RootState) =>
  state.customFields.loading;

/**
 * Selects the custom fields error state
 * @param state - Root state of the application
 * @returns Error message or null if no error occurred
 */
export const selectCustomFieldsError = (state: RootState) =>
  state.customFields.error;

// ============================================================================
// DIMENSIONS SELECTORS
// ============================================================================

/**
 * Selects all custom dimension definitions
 * @param state - Root state of the application
 * @returns Array of dimension definitions
 */
export const selectDimensions = (state: RootState) =>
  selectDimensionsState(state).dimensions;

/**
 * Selects whether the dimensions feature is enabled for this customer
 * @param state - Root state of the application
 * @returns Boolean indicating if dimensions are enabled
 */
export const selectDimensionsEnabled = (state: RootState) =>
  selectDimensionsState(state).enabled;

/**
 * Selects the dimensions loading state
 * @param state - Root state of the application
 * @returns Boolean indicating if dimensions are being loaded
 */
export const selectDimensionsLoading = (state: RootState) =>
  selectDimensionsState(state).loading;

/**
 * Selects the dimensions error state
 * @param state - Root state of the application
 * @returns Error message or null if no error occurred
 */
export const selectDimensionsError = (state: RootState) =>
  selectDimensionsState(state).error;

// ============================================================================
// VALIDATION SELECTORS
// ============================================================================

/**
 * Selects the validation error messages
 * @param state - Root state of the application
 * @returns Array of validation error messages
 */
export const selectValidationErrorMessages = (state: RootState) =>
  state.validation.errorMessages;

/**
 * Selects whether to show validation error
 * @param state - Root state of the application
 * @returns Boolean indicating if validation error should be shown
 */
export const selectShowValidationError = (state: RootState) =>
  state.validation.showValidationError;

/**
 * Selects the settings error message
 * @param state - Root state of the application
 * @returns Settings error message or null if no error
 */
export const selectSettingsError = (state: RootState) =>
  state.validation.settingsError;

/**
 * Selects field-specific validation errors
 * @param state - Root state of the application
 * @returns Object mapping cell keys to field errors
 */
export const selectFieldErrors = (state: RootState) =>
  state.validation.fieldErrors;

/**
 * Selects row-specific validation errors
 * @param state - Root state of the application
 * @returns Object mapping row IDs to row errors
 */
export const selectRowErrors = (state: RootState) => state.validation.rowErrors;

export const selectSaveError = (state: RootState) => state.validation.saveError;

/**
 * Selects the save loading state
 * @param state - Root state of the application
 * @returns Boolean indicating if a save operation is in progress
 */
export const selectSaveLoading = (state: RootState) =>
  state.validation.isSaveLoading;

/**
 * Selects the weekly timesheet tour completion status
 * @param state - Root state of the application
 * @returns Boolean indicating if the weekly timesheet tour has been completed
 */
export const selectWeeklyTimesheetTourCompleted = (state: RootState) =>
  state.timeEntrySettings.weeklyTimesheetTourCompleted;

export const selectTimeEntriesError = (state: RootState) =>
  state.validation.timeEntriesError;

export const selectWeekdaysWithData = (state: RootState) => {
  const { weeklyTimeEntries } = state.timeEntryGrid;

  const weekdaysWithData = {
    hasSundayData: false,
    hasMondayData: false,
    hasTuesdayData: false,
    hasWednesdayData: false,
    hasThursdayData: false,
    hasFridayData: false,
    hasSaturdayData: false,
  };

  // Check all time entries across all rows
  // OPTIMIZATION: Early exit strategy using nested .some() methods
  // 1. Outer .some() iterates through rows and exits when inner .some() returns true
  // 2. Inner .some() iterates through time entries and exits when all weekdays are found
  // 3. Conditional checks (!weekdaysWithData.hasXData) prevent redundant processing once data is found
  // 4. Returns true immediately when all 7 weekdays are detected, if not we will continue to check till last time entry
  Object.values(weeklyTimeEntries).some((row) =>
    Object.values(row.timeEntries).some((timeEntry) => {
      // Check if the time entry has hours greater than 0
      const hasHours = timeEntry.hours && timeEntry.hours > 0;

      if (hasHours && timeEntry.date) {
        // Parse date manually to avoid new Date(string) interpreting
        // date-only strings as UTC, which shifts the day in western timezones.
        const dateParts = timeEntry.date.split('-');
        const dayOfWeek = new Date(
          parseInt(dateParts[0], 10),
          parseInt(dateParts[1], 10) - 1,
          parseInt(dateParts[2], 10),
        ).getDay();

        // Early return if all weekdays are found - optimisation
        if (
          weekdaysWithData.hasSundayData &&
          weekdaysWithData.hasMondayData &&
          weekdaysWithData.hasTuesdayData &&
          weekdaysWithData.hasWednesdayData &&
          weekdaysWithData.hasThursdayData &&
          weekdaysWithData.hasFridayData &&
          weekdaysWithData.hasSaturdayData
        ) {
          return true;
        }

        // Update the appropriate weekday flag using the utility function
        updateWeekdayDataFlag(dayOfWeek, weekdaysWithData);
      }

      return false;
    }),
  );

  return weekdaysWithData;
};

// ============================================================================
// KEYBOARD SHORTCUTS SELECTORS
// ============================================================================

/**
 * Selects the last pressed keyboard shortcut
 * @param state - Root state of the application
 * @returns String representing the last pressed key or null if no key was pressed
 */
export const selectLastPressedKey = (state: RootState) =>
  state.keyboardShortcuts.lastPressedKey;

/**
 * Selects whether keyboard shortcuts are enabled
 * @param state - Root state of the application
 * @returns Boolean indicating if keyboard shortcuts are enabled
 */
export const selectKeyboardShortcutsEnabled = (state: RootState) =>
  state.keyboardShortcuts.isEnabled;

// ============================================================================
// APPROVAL DATE SELECTORS
// ============================================================================

/**
 * Selects the maximum (latest) approved date across all rows for the current week
 * This is used to determine which cells should be locked - all cells on or before
 * this date should be locked, regardless of which row they're in
 * @param state - Root state of the application
 * @returns The latest approved date string (YYYY-MM-DD) or null if no approvals
 */
export const selectMaxApprovedDate = createSelector(
  [selectWeeklyTimeEntriesMap],
  (weeklyTimeEntriesMap): string | null => {
    let maxApprovedDate: string | null = null;

    Object.values(weeklyTimeEntriesMap).forEach((row) => {
      if (!row) return;

      Object.values(row.timeEntries).forEach((entry) => {
        if (
          entry &&
          entry.timeEntryId &&
          entry.isApproved &&
          entry.date &&
          !entry.isExternalTimeOff
        ) {
          if (!maxApprovedDate || entry.date > maxApprovedDate) {
            maxApprovedDate = entry.date;
          }
        }
      });
    });

    return maxApprovedDate;
  },
);
