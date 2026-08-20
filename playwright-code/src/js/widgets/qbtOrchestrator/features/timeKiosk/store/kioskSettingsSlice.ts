/**
 * kioskSettingsSlice — company-level kiosk settings.
 * =============================================================================
 * First field: inactivity timeout. Values are hydrated from `useGetQLSettings`
 * (passed in via widget options) and persisted via `useSetQLSettings`.
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../../store';
import { KioskSettingsState } from '../types/TimeKiosk.types';
import { INACTIVITY_TIMEOUT } from '../constants/timeKioskConstants';

export const initialKioskSettingsState: KioskSettingsState = {
  inactivityTimeoutSeconds: INACTIVITY_TIMEOUT.DEFAULT_SECONDS,
  inactivityTimeoutVersion: INACTIVITY_TIMEOUT.DEFAULT_VERSION,
  loading: false,
};

const kioskSettingsSlice = createSlice({
  name: 'kioskSettings',
  initialState: initialKioskSettingsState,
  reducers: {
    /** Load saved settings into the store from mapped QL employer settings. */
    hydrateKioskSettings: (
      state,
      action: PayloadAction<{
        inactivityTimeoutSeconds: number;
        inactivityTimeoutVersion?: string;
      }>,
    ) => {
      state.inactivityTimeoutSeconds = action.payload.inactivityTimeoutSeconds;
      if (action.payload.inactivityTimeoutVersion !== undefined) {
        state.inactivityTimeoutVersion =
          action.payload.inactivityTimeoutVersion;
      }
      state.loading = false;
    },

    /** Commit a new inactivity timeout value (after a successful save). */
    setInactivityTimeoutSeconds: (
      state,
      action: PayloadAction<{ value: number; version?: string }>,
    ) => {
      state.inactivityTimeoutSeconds = action.payload.value;
      if (action.payload.version !== undefined) {
        state.inactivityTimeoutVersion = action.payload.version;
      }
    },

    /** Set the loading state of the kiosk settings. */
    setKioskSettingsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const {
  hydrateKioskSettings,
  setInactivityTimeoutSeconds,
  setKioskSettingsLoading,
} = kioskSettingsSlice.actions;

// ── Selectors ───────────────────────────────────────────────────────────────
// `timeKiosk` is injected lazily, so it may be absent on first render; every
// selector falls back to a safe default. Typed against the orchestrator
// RootState (which is index-signature shaped)
export const selectInactivityTimeoutSeconds = (state: RootState): number =>
  state.timeKiosk?.settings?.inactivityTimeoutSeconds ??
  INACTIVITY_TIMEOUT.DEFAULT_SECONDS;

export const selectInactivityTimeoutVersion = (state: RootState): string =>
  state.timeKiosk?.settings?.inactivityTimeoutVersion ??
  INACTIVITY_TIMEOUT.DEFAULT_VERSION;

export const selectKioskSettingsLoading = (state: RootState): boolean =>
  state.timeKiosk?.settings?.loading ?? false;

export default kioskSettingsSlice.reducer;
