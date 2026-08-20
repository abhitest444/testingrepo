import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { renderHook, act } from '@testing-library/react-hooks';
import timeKioskReducer from 'src/js/widgets/qbtOrchestrator/features/timeKiosk/store';
import { useKioskUi } from 'src/js/widgets/qbtOrchestrator/features/timeKiosk/store/hooks';
import {
  KioskDrawerType,
  KioskModalType,
} from 'src/js/widgets/qbtOrchestrator/features/timeKiosk/types/TimeKiosk.types';

const createWrapper = () => {
  const store = configureStore({ reducer: { timeKiosk: timeKioskReducer } });
  const wrapper: React.FC = ({ children }) => (
    <Provider store={store}>{children}</Provider>
  );
  return { store, wrapper };
};

describe('useKioskUi', () => {
  it('exposes initial UI state', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useKioskUi(), { wrapper });

    expect(result.current.activeModal).toBe(KioskModalType.NONE);
    expect(result.current.activeDrawer).toBe(KioskDrawerType.NONE);
    expect(result.current.selectedDeviceId).toBeNull();
    expect(result.current.toast).toEqual({ open: false, message: '' });
  });

  it('openModal / closeModal update the active modal', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useKioskUi(), { wrapper });

    act(() => {
      result.current.openModal(KioskModalType.INACTIVITY_TIMEOUT);
    });
    expect(result.current.activeModal).toBe(KioskModalType.INACTIVITY_TIMEOUT);

    act(() => {
      result.current.closeModal();
    });
    expect(result.current.activeModal).toBe(KioskModalType.NONE);
  });

  it('openDrawer / closeDrawer update drawer + device', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useKioskUi(), { wrapper });

    act(() => {
      result.current.openDrawer(KioskDrawerType.EDIT_DEVICE, 'device-1');
    });
    expect(result.current.activeDrawer).toBe(KioskDrawerType.EDIT_DEVICE);
    expect(result.current.selectedDeviceId).toBe('device-1');

    act(() => {
      result.current.closeDrawer();
    });
    expect(result.current.activeDrawer).toBe(KioskDrawerType.NONE);
    expect(result.current.selectedDeviceId).toBeNull();
  });

  it('showToast / hideToast drive the shared toast', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useKioskUi(), { wrapper });

    act(() => {
      result.current.showToast('Inactivity timeout saved');
    });
    expect(result.current.toast).toEqual({
      open: true,
      message: 'Inactivity timeout saved',
    });

    act(() => {
      result.current.hideToast();
    });
    expect(result.current.toast.open).toBe(false);
  });

  it('resetUi clears modal, drawer and toast at once', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useKioskUi(), { wrapper });

    act(() => {
      result.current.openModal(KioskModalType.INACTIVITY_TIMEOUT);
      result.current.openDrawer(KioskDrawerType.EDIT_DEVICE, 'd-1');
      result.current.showToast('hi');
    });
    act(() => {
      result.current.resetUi();
    });

    expect(result.current.activeModal).toBe(KioskModalType.NONE);
    expect(result.current.activeDrawer).toBe(KioskDrawerType.NONE);
    expect(result.current.selectedDeviceId).toBeNull();
    expect(result.current.toast).toEqual({ open: false, message: '' });
  });
});
