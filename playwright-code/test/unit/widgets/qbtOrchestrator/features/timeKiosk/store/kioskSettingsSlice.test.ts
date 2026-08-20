import kioskSettingsReducer, {
  initialKioskSettingsState,
  hydrateKioskSettings,
  setInactivityTimeoutSeconds,
  setKioskSettingsLoading,
  selectInactivityTimeoutSeconds,
  selectInactivityTimeoutVersion,
  selectKioskSettingsLoading,
} from 'src/js/widgets/qbtOrchestrator/features/timeKiosk/store/kioskSettingsSlice';
import { INACTIVITY_TIMEOUT } from 'src/js/widgets/qbtOrchestrator/features/timeKiosk/constants/timeKioskConstants';

describe('kioskSettingsSlice', () => {
  describe('initial state', () => {
    it('returns the initial state', () => {
      expect(kioskSettingsReducer(undefined, { type: 'unknown' })).toEqual(
        initialKioskSettingsState,
      );
    });
  });

  describe('reducers', () => {
    it('hydrateKioskSettings sets seconds + version and clears loading', () => {
      const state = kioskSettingsReducer(
        { ...initialKioskSettingsState, loading: true },
        hydrateKioskSettings({
          inactivityTimeoutSeconds: 45,
          inactivityTimeoutVersion: '7',
        }),
      );

      expect(state.inactivityTimeoutSeconds).toBe(45);
      expect(state.inactivityTimeoutVersion).toBe('7');
      expect(state.loading).toBe(false);
    });

    it('hydrateKioskSettings keeps existing version when not provided', () => {
      const state = kioskSettingsReducer(
        { ...initialKioskSettingsState, inactivityTimeoutVersion: '3' },
        hydrateKioskSettings({ inactivityTimeoutSeconds: 30 }),
      );

      expect(state.inactivityTimeoutSeconds).toBe(30);
      expect(state.inactivityTimeoutVersion).toBe('3');
    });

    it('setInactivityTimeoutSeconds updates value + version', () => {
      const state = kioskSettingsReducer(
        initialKioskSettingsState,
        setInactivityTimeoutSeconds({ value: 60, version: '9' }),
      );

      expect(state.inactivityTimeoutSeconds).toBe(60);
      expect(state.inactivityTimeoutVersion).toBe('9');
    });

    it('setInactivityTimeoutSeconds keeps version when omitted', () => {
      const state = kioskSettingsReducer(
        { ...initialKioskSettingsState, inactivityTimeoutVersion: '5' },
        setInactivityTimeoutSeconds({ value: 15 }),
      );

      expect(state.inactivityTimeoutSeconds).toBe(15);
      expect(state.inactivityTimeoutVersion).toBe('5');
    });

    it('setKioskSettingsLoading toggles loading', () => {
      const state = kioskSettingsReducer(
        initialKioskSettingsState,
        setKioskSettingsLoading(true),
      );
      expect(state.loading).toBe(true);
    });
  });

  describe('selectors', () => {
    const rootWith = (settings: Partial<typeof initialKioskSettingsState>) =>
      ({
        timeKiosk: { settings: { ...initialKioskSettingsState, ...settings } },
      } as any);

    it('read from populated state', () => {
      const root = rootWith({
        inactivityTimeoutSeconds: 33,
        inactivityTimeoutVersion: '4',
        loading: true,
      });

      expect(selectInactivityTimeoutSeconds(root)).toBe(33);
      expect(selectInactivityTimeoutVersion(root)).toBe('4');
      expect(selectKioskSettingsLoading(root)).toBe(true);
    });

    it('fall back to defaults when timeKiosk slice is absent', () => {
      const root = {} as any;
      expect(selectInactivityTimeoutSeconds(root)).toBe(
        INACTIVITY_TIMEOUT.DEFAULT_SECONDS,
      );
      expect(selectInactivityTimeoutVersion(root)).toBe('0');
      expect(selectKioskSettingsLoading(root)).toBe(false);
    });
  });
});
