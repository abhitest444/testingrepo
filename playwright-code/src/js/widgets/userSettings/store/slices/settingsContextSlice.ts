/**
 * Redux Toolkit slice for Settings Context
 * Stores the context information (timeForType and id) for user settings
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TimeTracking_TimeForType } from 'src/__generated__/timeTracking/graphql';

// Settings context interface
export interface SettingsFor {
  timeForType: TimeTracking_TimeForType;
  id: string;
  displayName?: string;
}

// State interface
export interface SettingsContextState {
  settingsFor: SettingsFor | null;
}

// Initial state
const initialState: SettingsContextState = {
  settingsFor: null,
};

// Create the slice
const settingsContextSlice = createSlice({
  name: 'settingsContext',
  initialState,
  reducers: {
    // Set the settings context
    setSettingsFor: (state, action: PayloadAction<SettingsFor>) => {
      state.settingsFor = action.payload;
    },

    // Clear the settings context
    clearSettingsFor: (state) => {
      state.settingsFor = null;
    },
  },
});

// Export actions
export const { setSettingsFor, clearSettingsFor } =
  settingsContextSlice.actions;

// Selectors
export const selectSettingsFor = (state: any) =>
  state.settingsContext.settingsFor;

// Export reducer
export default settingsContextSlice.reducer;
