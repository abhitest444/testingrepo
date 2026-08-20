import kioskDevicesReducer, {
  initialKioskDevicesState,
  setKioskDevices,
  setKioskDevicesPageInfo,
  setKioskDevicesCurrentPage,
  setKioskDevicesTotalCount,
  setKioskDevicesLoading,
  setKioskDevicesError,
  selectKioskDevicesState,
  selectKioskDevices,
  selectKioskDevicesLoading,
} from 'src/js/widgets/qbtOrchestrator/features/timeKiosk/store/kioskDevicesSlice';
import { KioskDevice } from 'src/js/widgets/qbtOrchestrator/features/timeKiosk/types/TimeKiosk.types';

const device: KioskDevice = { id: 'd-1', name: 'Front tablet' };

describe('kioskDevicesSlice', () => {
  it('returns the initial state', () => {
    expect(kioskDevicesReducer(undefined, { type: 'unknown' })).toEqual(
      initialKioskDevicesState,
    );
  });

  it('setKioskDevices stores devices and clears loading/error', () => {
    const state = kioskDevicesReducer(
      { ...initialKioskDevicesState, loading: true, error: 'x' },
      setKioskDevices([device]),
    );
    expect(state.devices).toEqual([device]);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('setKioskDevicesPageInfo stores + clears page info', () => {
    const pageInfo = { hasNextPage: true, endCursor: 'abc' };
    const s1 = kioskDevicesReducer(
      initialKioskDevicesState,
      setKioskDevicesPageInfo(pageInfo),
    );
    expect(s1.pageInfo).toEqual(pageInfo);

    const s2 = kioskDevicesReducer(s1, setKioskDevicesPageInfo(null));
    expect(s2.pageInfo).toBeNull();
  });

  it('setKioskDevicesCurrentPage updates the page', () => {
    const state = kioskDevicesReducer(
      initialKioskDevicesState,
      setKioskDevicesCurrentPage(4),
    );
    expect(state.currentPage).toBe(4);
  });

  it('setKioskDevicesTotalCount updates the count', () => {
    const state = kioskDevicesReducer(
      initialKioskDevicesState,
      setKioskDevicesTotalCount(12),
    );
    expect(state.totalCount).toBe(12);
  });

  it('setKioskDevicesLoading toggles loading', () => {
    const state = kioskDevicesReducer(
      initialKioskDevicesState,
      setKioskDevicesLoading(true),
    );
    expect(state.loading).toBe(true);
  });

  it('setKioskDevicesError sets error and stops loading', () => {
    const state = kioskDevicesReducer(
      { ...initialKioskDevicesState, loading: true },
      setKioskDevicesError('nope'),
    );
    expect(state.error).toBe('nope');
    expect(state.loading).toBe(false);
  });

  describe('selectors', () => {
    it('read from populated state', () => {
      const root = {
        timeKiosk: {
          devices: {
            ...initialKioskDevicesState,
            devices: [device],
            loading: true,
          },
        },
      } as any;
      expect(selectKioskDevicesState(root).devices).toEqual([device]);
      expect(selectKioskDevices(root)).toEqual([device]);
      expect(selectKioskDevicesLoading(root)).toBe(true);
    });

    it('fall back to defaults when slice absent', () => {
      const root = {} as any;
      expect(selectKioskDevicesState(root)).toEqual(initialKioskDevicesState);
      expect(selectKioskDevices(root)).toEqual([]);
      expect(selectKioskDevicesLoading(root)).toBe(false);
    });
  });
});
