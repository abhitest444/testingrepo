import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { resetAllSlices } from './globalActions';

/**
 * Interface representing a single time entry
 */
export interface TimeEntry {
  id: number;
  employee: string;
  employeeId?: string;
  isMissingEmployee?: boolean;
  date: string;
  time: string;
  hours: number | string; // Allow string for intermediate typing states
  billable: boolean;
  client: string;
  service: string;
  costRate: number;
  billRate: number;
  location: string;
  class: string;
  notes: string;
  status: 'Valid' | 'Invalid' | 'Needs Review' | 'Approved';
  validationErrors: string[];
}

/**
 * Interface representing save operation result
 */
export interface SaveResult {
  success: boolean;
  message: string;
  savedEntries: number;
  failedEntries: number;
  savedEntryIds?: number[];
  errors?: string[];
}

/**
 * Interface representing the review state
 */
export interface ReviewState {
  // Time entries
  timeEntries: TimeEntry[];

  // Filtering and selection
  selectedFilter:
    | 'all'
    | 'valid'
    | 'missing'
    | 'invalid'
    | 'missingEmployees'
    | 'approved';
  acceptedEmployees: string[];
  checkedEntries: number[];

  // Save operations
  isSaving: boolean;
  isPreparingSave: boolean; // Loading state when Let's Go is clicked
  saveResult: SaveResult | null;
  saveError: string | null;
  isInitialLoadError: boolean; // Flag to differentiate initial load errors from save errors

  // Import operations
  isImporting: boolean;
  importProgress: number;
  importError: string | null;

  // Validation operations
  isValidating: boolean;
  hasUserChanges: boolean;
  needsRevalidation: boolean;

  consentChecked: boolean;

  // Export operations
  isExporting: boolean;
  exportError: string | null;

  // Validation state
  hasValidationErrors: boolean;
  validationErrorCount: number;

  // Failed entries for partial success scenarios
  failedEntries: Array<{
    index: number;
    entryId?: number;
    date: string;
    duration: number;
    errorCode: string;
    message: string;
    subCode?: string;
  }>;
}

const initialState: ReviewState = {
  // Time entries
  timeEntries: [],

  // Filtering and selection
  selectedFilter: 'all',
  acceptedEmployees: [],
  checkedEntries: [],

  // Save operations
  isSaving: false,
  isPreparingSave: false,
  saveResult: null,
  saveError: null,
  isInitialLoadError: false,

  // Import operations
  isImporting: false,
  importProgress: 0,
  importError: null,

  // Validation operations
  isValidating: false,
  hasUserChanges: false,
  needsRevalidation: false,

  consentChecked: false,

  // Export operations
  isExporting: false,
  exportError: null,

  // Validation state
  hasValidationErrors: true,
  validationErrorCount: 2,

  // Failed entries
  failedEntries: [],
};

export const reviewSlice = createSlice({
  name: 'review',
  initialState,
  reducers: {
    // Time entries actions
    setTimeEntries: (state, action: PayloadAction<TimeEntry[]>) => {
      state.timeEntries = action.payload;
      // Default all entries to checked so user can save without re-checking (ids may be number or string)
      const ids = action.payload
        .map((e: TimeEntry & { id?: string | number }) => e.id)
        .filter((id): id is number | string => id != null && id !== '');
      state.checkedEntries = ids as number[];
    },

    addTimeEntry: (state, action: PayloadAction<TimeEntry>) => {
      state.timeEntries.push(action.payload);
    },

    updateTimeEntry: (
      state,
      action: PayloadAction<{ id: number; updates: Partial<TimeEntry> }>,
    ) => {
      const index = state.timeEntries.findIndex(
        (entry) => entry.id === action.payload.id,
      );
      if (index !== -1) {
        state.timeEntries[index] = {
          ...state.timeEntries[index],
          ...action.payload.updates,
        };
      }
    },

    deleteTimeEntry: (state, action: PayloadAction<number>) => {
      state.timeEntries = state.timeEntries.filter(
        (entry) => entry.id !== action.payload,
      );
      state.checkedEntries = state.checkedEntries.filter(
        (entry) => entry !== action.payload,
      );
    },

    // Filtering actions
    setSelectedFilter: (
      state,
      action: PayloadAction<
        | 'all'
        | 'valid'
        | 'missing'
        | 'invalid'
        | 'missingEmployees'
        | 'approved'
      >,
    ) => {
      state.selectedFilter = action.payload;
    },

    // Employee acceptance actions
    setAcceptedEmployees: (state, action: PayloadAction<string[]>) => {
      state.acceptedEmployees = action.payload;
    },

    addAcceptedEmployee: (state, action: PayloadAction<string>) => {
      if (!state.acceptedEmployees.includes(action.payload)) {
        state.acceptedEmployees.push(action.payload);
      }
    },

    removeAcceptedEmployee: (state, action: PayloadAction<string>) => {
      state.acceptedEmployees = state.acceptedEmployees.filter(
        (emp) => emp !== action.payload,
      );
    },

    // Checkbox actions
    setCheckedEntries: (state, action: PayloadAction<number[]>) => {
      state.checkedEntries = action.payload;
    },

    addCheckedEntry: (state, action: PayloadAction<number>) => {
      if (!state.checkedEntries.includes(action.payload)) {
        state.checkedEntries.push(action.payload);
      }
    },

    removeCheckedEntry: (state, action: PayloadAction<number>) => {
      state.checkedEntries = state.checkedEntries.filter(
        (entry) => entry !== action.payload,
      );
    },

    toggleCheckedEntry: (state, action: PayloadAction<number>) => {
      const index = state.checkedEntries.indexOf(action.payload);
      if (index > -1) {
        state.checkedEntries.splice(index, 1);
      } else {
        state.checkedEntries.push(action.payload);
      }
    },

    // Save operations
    setIsSaving: (state, action: PayloadAction<boolean>) => {
      state.isSaving = action.payload;
    },

    setIsPreparingSave: (state, action: PayloadAction<boolean>) => {
      state.isPreparingSave = action.payload;
    },

    setSaveResult: (state, action: PayloadAction<SaveResult | null>) => {
      state.saveResult = action.payload;
    },

    setSaveError: (state, action: PayloadAction<string | null>) => {
      state.saveError = action.payload;
    },

    clearSaveError: (state) => {
      state.saveError = null;
      state.isInitialLoadError = false;
    },

    setIsInitialLoadError: (state, action: PayloadAction<boolean>) => {
      state.isInitialLoadError = action.payload;
    },

    // Import operations
    setIsImporting: (state, action: PayloadAction<boolean>) => {
      state.isImporting = action.payload;
    },

    setImportProgress: (state, action: PayloadAction<number>) => {
      state.importProgress = action.payload;
    },

    setImportError: (state, action: PayloadAction<string | null>) => {
      state.importError = action.payload;
    },

    setConsentChecked: (state, action: PayloadAction<boolean>) => {
      state.consentChecked = action.payload;
    },

    // Export operations
    setIsExporting: (state, action: PayloadAction<boolean>) => {
      state.isExporting = action.payload;
    },

    setExportError: (state, action: PayloadAction<string | null>) => {
      state.exportError = action.payload;
    },

    // Validation actions
    setHasValidationErrors: (state, action: PayloadAction<boolean>) => {
      state.hasValidationErrors = action.payload;
    },

    setValidationErrorCount: (state, action: PayloadAction<number>) => {
      state.validationErrorCount = action.payload;
    },

    setIsValidating: (state, action: PayloadAction<boolean>) => {
      state.isValidating = action.payload;
    },

    setHasUserChanges: (state, action: PayloadAction<boolean>) => {
      state.hasUserChanges = action.payload;
    },

    setNeedsRevalidation: (state, action: PayloadAction<boolean>) => {
      state.needsRevalidation = action.payload;
    },

    // Failed entries actions
    setFailedEntries: (
      state,
      action: PayloadAction<
        Array<{
          index: number;
          entryId?: number;
          date: string;
          duration: number;
          errorCode: string;
          message: string;
          subCode?: string;
        }>
      >,
    ) => {
      state.failedEntries = action.payload;
    },

    clearFailedEntries: (state) => {
      state.failedEntries = [];
    },

    // Remove time entries by IDs
    removeTimeEntries: (state, action: PayloadAction<string[]>) => {
      const idsToRemove = new Set(action.payload);
      state.timeEntries = state.timeEntries.filter(
        (entry) => !idsToRemove.has(entry.id),
      );
      state.checkedEntries = state.checkedEntries.filter(
        (id) => !idsToRemove.has(id),
      );
    },

    // Reset actions
    resetReviewState: () => initialState,

    resetSaveState: (state) => {
      state.isSaving = false;
      state.saveResult = null;
      state.saveError = null;
    },

    resetImportState: (state) => {
      state.isImporting = false;
      state.importProgress = 0;
      state.importError = null;
    },
  },
  extraReducers: (builder) => {
    // Listen to global reset action
    builder.addCase(resetAllSlices, (state) => {
      Object.assign(state, initialState);
    });
  },
});

export const {
  setTimeEntries,
  addTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
  setSelectedFilter,
  setAcceptedEmployees,
  addAcceptedEmployee,
  removeAcceptedEmployee,
  setCheckedEntries,
  addCheckedEntry,
  removeCheckedEntry,
  toggleCheckedEntry,
  setIsSaving,
  setIsPreparingSave,
  setSaveResult,
  setSaveError,
  clearSaveError,
  setIsInitialLoadError,
  setIsImporting,
  setImportProgress,
  setImportError,
  setConsentChecked,
  setIsExporting,
  setExportError,
  setHasValidationErrors,
  setValidationErrorCount,
  setIsValidating,
  setHasUserChanges,
  setNeedsRevalidation,
  setFailedEntries,
  clearFailedEntries,
  removeTimeEntries,
  resetReviewState,
  resetSaveState,
  resetImportState,
} = reviewSlice.actions;

export default reviewSlice.reducer;
