import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { resetAllSlices } from './globalActions';

/**
 * Redux slice for AI Import preferences
 *
 * IMPORTANT: This slice stores preferences that should persist ONLY during the widget session.
 * When the widget is closed/reset, all data in this slice is cleared.
 *
 * This is NOT saved to sandbox storage (no cross-session persistence).
 *
 * Contains:
 * - Column mappings (current session's Excel column → QB field mappings)
 * - 8-hour limit preference (current session)
 * - Preferences seen flag (current session)
 * - Skip field mapping flag (current session)
 *
 * NOTE: Field mappings (employee, customer, class, service, location, custom fields)
 * are stored in fieldMappingsSlice, NOT here. This slice only keeps UI/UX preferences.
 */

export interface AIImportPreferencesState {
  // Column mappings: { "Excel Column Name": "qbFieldId" }
  columnMappings: Record<string, string>;

  // Whether to impose 8-hour daily limit (default: true)
  impose8HourLimit: boolean;

  // Whether user has seen preferences screen (default: false)
  preferencesSeen: boolean;

  // Whether to skip Step 2 (Field Mapping) when all required fields are mapped (default: false)
  skipFieldMapping: boolean;

  // Loading state
  loading: boolean;

  // Error state
  error: string | null;

  // Last time data was loaded
  lastLoaded: number | null;
}

const initialState: AIImportPreferencesState = {
  columnMappings: {},
  impose8HourLimit: true, // Default to imposing 8-hour limit
  preferencesSeen: false,
  skipFieldMapping: false,
  loading: false,
  error: null,
  lastLoaded: null,
};

export const aiImportPreferencesSlice = createSlice({
  name: 'aiImportPreferences',
  initialState,
  reducers: {
    // Set loading state
    setAIPreferencesLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // Set error state
    setAIPreferencesError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Update column mappings
    setColumnMappings: (
      state,
      action: PayloadAction<Record<string, string>>,
    ) => {
      state.columnMappings = action.payload;
      state.lastLoaded = Date.now();
    },

    // Update 8-hour limit preference
    setImpose8HourLimit: (state, action: PayloadAction<boolean>) => {
      state.impose8HourLimit = action.payload;
      state.lastLoaded = Date.now();
    },

    // Update preferences seen flag
    setPreferencesSeen: (state, action: PayloadAction<boolean>) => {
      state.preferencesSeen = action.payload;
      state.lastLoaded = Date.now();
    },

    // Update skip field mapping flag
    setSkipFieldMapping: (state, action: PayloadAction<boolean>) => {
      state.skipFieldMapping = action.payload;
      state.lastLoaded = Date.now();
    },

    // Bulk update all preferences at once (when loading from sandbox storage)
    setAllAIPreferences: (
      state,
      action: PayloadAction<Partial<AIImportPreferencesState>>,
    ) => {
      Object.assign(state, action.payload);
      state.lastLoaded = Date.now();
      state.loading = false;
      state.error = null;
    },

    // Clear all preferences
    clearAIPreferences: (state) => {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    // Listen to global reset and clear AI preferences
    builder.addCase(resetAllSlices, (state) => {
      Object.assign(state, initialState);
    });
  },
});

export const {
  setAIPreferencesLoading,
  setAIPreferencesError,
  setColumnMappings,
  setImpose8HourLimit,
  setPreferencesSeen,
  setSkipFieldMapping,
  setAllAIPreferences,
  clearAIPreferences,
} = aiImportPreferencesSlice.actions;

export default aiImportPreferencesSlice.reducer;
