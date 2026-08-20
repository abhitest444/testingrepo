import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SettingsSliceState } from '../types';

const initialState: SettingsSliceState = {
  timezone: '',
  qboTimezone: '',
  firstDayOfWeek: 0,
  settingsLoading: true,
  settingsReady: false,
  settingsError: null,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setCompanyTimezone(
      state,
      action: PayloadAction<{
        timezone: string;
        qboTimezone: string;
        firstDayOfWeek: number;
      }>,
    ) {
      state.timezone = action.payload.timezone;
      state.qboTimezone = action.payload.qboTimezone;
      state.firstDayOfWeek = action.payload.firstDayOfWeek;
      state.settingsReady = true;
    },
    setSettingsLoading(state, action: PayloadAction<boolean>) {
      state.settingsLoading = action.payload;
    },
    setSettingsError(state, action: PayloadAction<string | null>) {
      state.settingsError = action.payload;
      if (action.payload) {
        state.settingsLoading = false;
      }
    },
    resetSettings() {
      return initialState;
    },
  },
});

export const {
  setCompanyTimezone,
  setSettingsLoading,
  setSettingsError,
  resetSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;
