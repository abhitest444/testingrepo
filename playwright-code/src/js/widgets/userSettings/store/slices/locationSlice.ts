/**
 * Redux Toolkit slice for Location settings
 * Manages location tracking preferences for the worker in user settings page
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  TimeTrackingUnifiedUserSettingsQuery,
  TimeTracking_LocationTrackingType,
  TimeTracking_UserLocationTrackingType,
} from 'src/__generated__/timeTracking/graphql';
import { LocationCardMode } from '../../components/cards/LocationCard/types/LocationCard.types';
import type { RootState } from '../index';

// Location settings interface
export interface LocationSettings {
  /** User's location tracking preference (includes USE_COMPANY_SETTING) */
  value: TimeTracking_UserLocationTrackingType;
  /** The effective value that applies to the user */
  effectiveValue: TimeTracking_LocationTrackingType;
  /** Version for optimistic locking */
  version?: string;
}

// Default settings
const DEFAULT_SETTINGS: LocationSettings = {
  value: TimeTracking_UserLocationTrackingType.UseCompanySetting,
  effectiveValue: TimeTracking_LocationTrackingType.Optional,
  version: undefined,
};

// State interface
export interface LocationState {
  mode: LocationCardMode;
  settings: LocationSettings;
  draftSettings: LocationSettings;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: LocationState = {
  mode: LocationCardMode.VIEW,
  settings: DEFAULT_SETTINGS,
  draftSettings: DEFAULT_SETTINGS,
  loading: false,
  error: null,
};

/**
 * Maps API response to LocationSettings
 */
const mapUnifiedUserSettings = (
  data: TimeTrackingUnifiedUserSettingsQuery | undefined,
): LocationSettings => {
  if (!data?.timeTrackingUnifiedUserSettings?.locationTracking) {
    return DEFAULT_SETTINGS;
  }

  const { locationTracking } = data.timeTrackingUnifiedUserSettings;

  return {
    value: locationTracking.value,
    effectiveValue: locationTracking.effectiveValue,
    version: locationTracking.meta?.version ?? undefined,
  };
};

// Create the slice
const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    // Set the current mode (VIEW or EDIT)
    setLocationMode: (state, action: PayloadAction<LocationCardMode>) => {
      state.mode = action.payload;
      // When entering edit mode, copy current settings to draft
      if (action.payload === LocationCardMode.EDIT) {
        state.draftSettings = { ...state.settings };
      }
    },

    // Update draft settings (used while editing)
    updateLocationDraft: (
      state,
      action: PayloadAction<Partial<LocationSettings>>,
    ) => {
      state.draftSettings = { ...state.draftSettings, ...action.payload };
    },

    // Save draft settings to current settings
    saveLocationSettings: (
      state,
      action: PayloadAction<TimeTrackingUnifiedUserSettingsQuery | undefined>,
    ) => {
      // If API data is provided, populate settings from API response
      if (action.payload?.timeTrackingUnifiedUserSettings?.locationTracking) {
        const { locationTracking } =
          action.payload.timeTrackingUnifiedUserSettings;

        // Update settings with values from API response
        state.settings.value = locationTracking.value;
        state.settings.effectiveValue = locationTracking.effectiveValue;
        state.draftSettings.value = locationTracking.value;
        state.draftSettings.effectiveValue = locationTracking.effectiveValue;

        if (locationTracking.meta?.version) {
          state.settings.version = locationTracking.meta.version;
          state.draftSettings.version = locationTracking.meta.version;
        }
      } else {
        // Fallback to draft settings if no API data
        state.settings = { ...state.draftSettings };
      }

      state.mode = LocationCardMode.VIEW;
    },

    // Cancel edit mode and discard draft changes
    cancelLocationEdit: (state) => {
      state.draftSettings = { ...state.settings };
      state.mode = LocationCardMode.VIEW;
    },

    // Reset state with data from API
    resetLocationState: (
      state,
      action: PayloadAction<TimeTrackingUnifiedUserSettingsQuery | undefined>,
    ) => {
      const apiSettings = mapUnifiedUserSettings(action.payload);
      const mergedSettings = { ...DEFAULT_SETTINGS, ...apiSettings };

      state.mode = LocationCardMode.VIEW;
      state.settings = mergedSettings;
      state.draftSettings = mergedSettings;
      state.loading = false;
      state.error = null;
    },

    // Initialize with default settings
    initializeLocationDefaults: (state) => {
      state.mode = LocationCardMode.VIEW;
      state.settings = DEFAULT_SETTINGS;
      state.draftSettings = DEFAULT_SETTINGS;
      state.loading = false;
      state.error = null;
    },

    // Set loading state
    setLocationLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // Set error state
    setLocationError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

// Export actions
export const {
  setLocationMode,
  updateLocationDraft,
  saveLocationSettings,
  cancelLocationEdit,
  resetLocationState,
  initializeLocationDefaults,
  setLocationLoading,
  setLocationError,
} = locationSlice.actions;

// Selectors
export const selectLocationMode = (state: RootState) => state.location.mode;
export const selectLocationSettings = (state: RootState) =>
  state.location.settings;
export const selectLocationDraftSettings = (state: RootState) =>
  state.location.draftSettings;
export const selectLocationState = (state: RootState) => state.location;
export const selectLocationLoading = (state: RootState) =>
  state.location.loading;
export const selectLocationError = (state: RootState) => state.location.error;

// Export reducer
export default locationSlice.reducer;
