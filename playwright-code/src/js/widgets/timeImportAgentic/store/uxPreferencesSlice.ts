import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { resetAllSlices } from './globalActions';

export interface UxPreferencesState {
  data: Record<string, any>;
  loading: boolean;
  error: string | null;
  lastLoaded: number | null;
}

const initialState: UxPreferencesState = {
  data: {},
  loading: false,
  error: null,
  lastLoaded: null,
};

/**
 * NOTE: This slice now only manages REALM-SCOPED AI import preferences:
 * - Preferences seen (company-wide)
 * - Skip field mapping (company-wide)
 *
 * USER-SCOPED preferences (column mappings, employee mappings, 8-hour limit)
 * now use sandbox persistent storage directly (see useAIImportPreferences hook)
 *
 * This slice is still needed for other UX preferences (tours, UI settings, etc.)
 * and for REALM-scoped AI import settings that need to be shared across all users in a company.
 */
export const uxPreferencesSlice = createSlice({
  name: 'uxPreferences',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },

    setUxPreferencesData: (
      state,
      action: PayloadAction<Record<string, any>>,
    ) => {
      state.data = action.payload;
      state.loading = false;
      state.error = null;
      state.lastLoaded = Date.now();
    },

    updateUxPreference: (
      state,
      action: PayloadAction<{ key: string; value: any }>,
    ) => {
      state.data[action.payload.key] = action.payload.value;
    },

    clearUxPreferences: (state) => {
      state.data = {};
      state.loading = false;
      state.error = null;
      state.lastLoaded = null;
    },
  },
});

export const {
  setLoading,
  setError,
  setUxPreferencesData,
  updateUxPreference,
  clearUxPreferences,
} = uxPreferencesSlice.actions;

export default uxPreferencesSlice.reducer;
