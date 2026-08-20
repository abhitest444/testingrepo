import kioskUiReducer, {
  initialKioskUiState,
  openKioskModal,
  closeKioskModal,
  openKioskDrawer,
  closeKioskDrawer,
  setSelectedDeviceId,
  showKioskToast,
  hideKioskToast,
  resetKioskUi,
  selectActiveKioskModal,
  selectActiveKioskDrawer,
  selectSelectedDeviceId,
  selectKioskToast,
} from 'src/js/widgets/qbtOrchestrator/features/timeKiosk/store/kioskUiSlice';
import {
  KioskDrawerType,
  KioskModalType,
} from 'src/js/widgets/qbtOrchestrator/features/timeKiosk/types/TimeKiosk.types';

describe('kioskUiSlice', () => {
  it('returns the initial state', () => {
    expect(kioskUiReducer(undefined, { type: 'unknown' })).toEqual(
      initialKioskUiState,
    );
  });

  describe('modal', () => {
    it('openKioskModal sets active modal', () => {
      const state = kioskUiReducer(
        initialKioskUiState,
        openKioskModal(KioskModalType.INACTIVITY_TIMEOUT),
      );
      expect(state.activeModal).toBe(KioskModalType.INACTIVITY_TIMEOUT);
    });

    it('closeKioskModal resets active modal to NONE', () => {
      const state = kioskUiReducer(
        {
          ...initialKioskUiState,
          activeModal: KioskModalType.INACTIVITY_TIMEOUT,
        },
        closeKioskModal(),
      );
      expect(state.activeModal).toBe(KioskModalType.NONE);
    });
  });

  describe('drawer', () => {
    it('openKioskDrawer sets drawer + deviceId', () => {
      const state = kioskUiReducer(
        initialKioskUiState,
        openKioskDrawer({ type: KioskDrawerType.EDIT_DEVICE, deviceId: 'd-1' }),
      );
      expect(state.activeDrawer).toBe(KioskDrawerType.EDIT_DEVICE);
      expect(state.selectedDeviceId).toBe('d-1');
    });

    it('openKioskDrawer defaults deviceId to null', () => {
      const state = kioskUiReducer(
        initialKioskUiState,
        openKioskDrawer({ type: KioskDrawerType.ASSIGN_MEMBERS }),
      );
      expect(state.selectedDeviceId).toBeNull();
    });

    it('closeKioskDrawer clears drawer + deviceId', () => {
      const state = kioskUiReducer(
        {
          ...initialKioskUiState,
          activeDrawer: KioskDrawerType.EDIT_DEVICE,
          selectedDeviceId: 'd-1',
        },
        closeKioskDrawer(),
      );
      expect(state.activeDrawer).toBe(KioskDrawerType.NONE);
      expect(state.selectedDeviceId).toBeNull();
    });

    it('setSelectedDeviceId updates the selected device', () => {
      const state = kioskUiReducer(
        initialKioskUiState,
        setSelectedDeviceId('d-9'),
      );
      expect(state.selectedDeviceId).toBe('d-9');
    });
  });

  describe('toast', () => {
    it('showKioskToast opens the toast with a message', () => {
      const state = kioskUiReducer(
        initialKioskUiState,
        showKioskToast('Saved!'),
      );
      expect(state.toast).toEqual({ open: true, message: 'Saved!' });
    });

    it('hideKioskToast closes the toast but keeps the message', () => {
      const state = kioskUiReducer(
        { ...initialKioskUiState, toast: { open: true, message: 'Saved!' } },
        hideKioskToast(),
      );
      expect(state.toast.open).toBe(false);
      expect(state.toast.message).toBe('Saved!');
    });
  });

  describe('resetKioskUi', () => {
    it('resets every transient surface to initial', () => {
      const dirty = {
        activeModal: KioskModalType.INACTIVITY_TIMEOUT,
        activeDrawer: KioskDrawerType.EDIT_DEVICE,
        selectedDeviceId: 'd-1',
        toast: { open: true, message: 'Saved!' },
      };
      expect(kioskUiReducer(dirty, resetKioskUi())).toEqual(
        initialKioskUiState,
      );
    });
  });

  describe('selectors', () => {
    it('read from populated state', () => {
      const root = {
        timeKiosk: {
          ui: {
            activeModal: KioskModalType.INACTIVITY_TIMEOUT,
            activeDrawer: KioskDrawerType.ASSIGN_MEMBERS,
            selectedDeviceId: 'd-2',
            toast: { open: true, message: 'hi' },
          },
        },
      } as any;
      expect(selectActiveKioskModal(root)).toBe(
        KioskModalType.INACTIVITY_TIMEOUT,
      );
      expect(selectActiveKioskDrawer(root)).toBe(
        KioskDrawerType.ASSIGN_MEMBERS,
      );
      expect(selectSelectedDeviceId(root)).toBe('d-2');
      expect(selectKioskToast(root)).toEqual({ open: true, message: 'hi' });
    });

    it('fall back to defaults when slice absent', () => {
      const root = {} as any;
      expect(selectActiveKioskModal(root)).toBe(KioskModalType.NONE);
      expect(selectActiveKioskDrawer(root)).toBe(KioskDrawerType.NONE);
      expect(selectSelectedDeviceId(root)).toBeNull();
      expect(selectKioskToast(root)).toEqual({ open: false, message: '' });
    });
  });
});
