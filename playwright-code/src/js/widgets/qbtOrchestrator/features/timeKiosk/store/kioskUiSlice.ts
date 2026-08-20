/**
 * kioskUiSlice — cross-cutting kiosk UI state.
 * =============================================================================
 * Tracks which modal/drawer is open and the device the open surface applies to.
 * Modal control is wired today (inactivity timeout). Drawer control is
 * scaffolded for the devices/assignment tickets:
 *  - ASSIGN_MEMBERS reuses the shared common/AssignmentDrawer (stateless), so
 *    only visibility is tracked here.
 *  - EDIT_DEVICE opens the per-device form; its working copy lives in
 *    kioskDevices (see KioskDevicesState TODO).
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../../store';
import {
  KioskDrawerType,
  KioskModalType,
  KioskToastState,
  KioskUiState,
} from '../types/TimeKiosk.types';

export const initialKioskUiState: KioskUiState = {
  activeModal: KioskModalType.NONE,
  activeDrawer: KioskDrawerType.NONE,
  selectedDeviceId: null,
  toast: { open: false, message: '' },
};

const kioskUiSlice = createSlice({
  name: 'kioskUi',
  initialState: initialKioskUiState,
  reducers: {
    openKioskModal: (state, action: PayloadAction<KioskModalType>) => {
      state.activeModal = action.payload;
    },
    closeKioskModal: (state) => {
      state.activeModal = KioskModalType.NONE;
    },
    // TODO(kiosk): drawer controls are ready for the devices/assignment tickets.
    openKioskDrawer: (
      state,
      action: PayloadAction<{
        type: KioskDrawerType;
        deviceId?: string | null;
      }>,
    ) => {
      state.activeDrawer = action.payload.type;
      state.selectedDeviceId = action.payload.deviceId ?? null;
    },
    closeKioskDrawer: (state) => {
      state.activeDrawer = KioskDrawerType.NONE;
      state.selectedDeviceId = null;
    },
    setSelectedDeviceId: (state, action: PayloadAction<string | null>) => {
      state.selectedDeviceId = action.payload;
    },
    // Shared success toast — any kiosk action passes its own message on success.
    showKioskToast: (state, action: PayloadAction<string>) => {
      state.toast = { open: true, message: action.payload };
    },
    hideKioskToast: (state) => {
      state.toast.open = false;
    },
    // Close every transient surface at once. Called when the kiosk trowser
    // closes so nothing (modal/drawer/toast) lingers into the next open.
    resetKioskUi: () => initialKioskUiState,
  },
});

export const {
  openKioskModal,
  closeKioskModal,
  openKioskDrawer,
  closeKioskDrawer,
  setSelectedDeviceId,
  showKioskToast,
  hideKioskToast,
  resetKioskUi,
} = kioskUiSlice.actions;

// ── Selectors ───────────────────────────────────────────────────────────────
export const selectActiveKioskModal = (state: RootState): KioskModalType =>
  state.timeKiosk?.ui?.activeModal ?? KioskModalType.NONE;

export const selectActiveKioskDrawer = (state: RootState): KioskDrawerType =>
  state.timeKiosk?.ui?.activeDrawer ?? KioskDrawerType.NONE;

export const selectSelectedDeviceId = (state: RootState): string | null =>
  state.timeKiosk?.ui?.selectedDeviceId ?? null;

export const selectKioskToast = (state: RootState): KioskToastState =>
  state.timeKiosk?.ui?.toast ?? { open: false, message: '' };

export default kioskUiSlice.reducer;
