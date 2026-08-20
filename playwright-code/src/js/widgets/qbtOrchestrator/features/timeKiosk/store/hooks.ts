/**
 * Kiosk UI hooks — thin convenience wrappers over the kioskUi slice.
 * =============================================================================
 * Keeps modal/drawer intent out of components. Modal controls are used today;
 * drawer controls are ready for the devices/assignment tickets.
 */
import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { KioskDrawerType, KioskModalType } from '../types/TimeKiosk.types';
import {
  closeKioskDrawer,
  closeKioskModal,
  hideKioskToast,
  openKioskDrawer,
  openKioskModal,
  resetKioskUi,
  selectActiveKioskDrawer,
  selectActiveKioskModal,
  selectKioskToast,
  selectSelectedDeviceId,
  showKioskToast,
} from './kioskUiSlice';

export const useKioskUi = () => {
  const dispatch = useAppDispatch();
  const activeModal = useAppSelector(selectActiveKioskModal);
  const activeDrawer = useAppSelector(selectActiveKioskDrawer);
  const selectedDeviceId = useAppSelector(selectSelectedDeviceId);
  const toast = useAppSelector(selectKioskToast);

  const openModal = useCallback(
    (type: KioskModalType) => dispatch(openKioskModal(type)),
    [dispatch],
  );
  const closeModal = useCallback(() => dispatch(closeKioskModal()), [dispatch]);

  // Shared success toast. Callers pass their own message so the same toast is
  // reused across kiosk surfaces (inactivity timeout now, location later).
  const showToast = useCallback(
    (message: string) => dispatch(showKioskToast(message)),
    [dispatch],
  );
  const hideToast = useCallback(() => dispatch(hideKioskToast()), [dispatch]);

  // Reset all transient UI (modal/drawer/toast) — used on trowser close.
  const resetUi = useCallback(() => dispatch(resetKioskUi()), [dispatch]);

  // TODO(kiosk): drawer controls are ready for the devices/assignment tickets.
  const openDrawer = useCallback(
    (type: KioskDrawerType, deviceId?: string | null) =>
      dispatch(openKioskDrawer({ type, deviceId })),
    [dispatch],
  );
  const closeDrawer = useCallback(
    () => dispatch(closeKioskDrawer()),
    [dispatch],
  );

  return {
    activeModal,
    activeDrawer,
    selectedDeviceId,
    toast,
    openModal,
    closeModal,
    openDrawer,
    closeDrawer,
    showToast,
    hideToast,
    resetUi,
  };
};
