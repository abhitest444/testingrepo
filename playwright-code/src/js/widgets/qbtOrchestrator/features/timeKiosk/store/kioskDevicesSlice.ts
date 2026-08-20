/**
 * kioskDevicesSlice — kiosk device list (exoskeleton).
 * =============================================================================
 * Scaffolded for the Manage-Devices ticket. The list actions/pagination are
 * ready to consume; the Edit-Kiosk drawer's working copy will be folded in here
 * (see KioskDevicesState TODO in TimeKiosk.types) rather than a separate slice,
 * following the weeklyTimeEntry timeEntrySettingsSlice pattern. Not consumed by
 * any UI yet.
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../../store';
import {
  KioskDevice,
  KioskDevicePageInfo,
  KioskDevicesState,
} from '../types/TimeKiosk.types';

export const initialKioskDevicesState: KioskDevicesState = {
  devices: [],
  pageInfo: null,
  currentPage: 1,
  totalCount: 0,
  loading: false,
  error: null,
};

const kioskDevicesSlice = createSlice({
  name: 'kioskDevices',
  initialState: initialKioskDevicesState,
  reducers: {
    setKioskDevices: (state, action: PayloadAction<KioskDevice[]>) => {
      state.devices = action.payload;
      state.loading = false;
      state.error = null;
    },
    setKioskDevicesPageInfo: (
      state,
      action: PayloadAction<KioskDevicePageInfo | null>,
    ) => {
      state.pageInfo = action.payload;
    },
    setKioskDevicesCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    setKioskDevicesTotalCount: (state, action: PayloadAction<number>) => {
      state.totalCount = action.payload;
    },
    setKioskDevicesLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setKioskDevicesError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    // TODO(kiosk): Edit-Kiosk drawer :
    //   initializeEditDevice / updateEditDeviceField / resetEditDevice
    //   + savingDevice / saveDeviceError
  },
});

export const {
  setKioskDevices,
  setKioskDevicesPageInfo,
  setKioskDevicesCurrentPage,
  setKioskDevicesTotalCount,
  setKioskDevicesLoading,
  setKioskDevicesError,
} = kioskDevicesSlice.actions;

// ── Selectors ───────────────────────────────────────────────────────────────
export const selectKioskDevicesState = (state: RootState): KioskDevicesState =>
  state.timeKiosk?.devices ?? initialKioskDevicesState;

export const selectKioskDevices = (state: RootState): KioskDevice[] =>
  state.timeKiosk?.devices?.devices ?? [];

export const selectKioskDevicesLoading = (state: RootState): boolean =>
  state.timeKiosk?.devices?.loading ?? false;

export default kioskDevicesSlice.reducer;
