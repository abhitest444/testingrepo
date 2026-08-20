import reducer, {
  setCompanyTimezone,
  setSettingsLoading,
  setSettingsError,
  resetSettings,
} from 'src/js/widgets/timeProject/store/settingsSlice';
import { SettingsSliceState } from 'src/js/widgets/timeProject/types';

describe('settingsSlice', () => {
  const initialState: SettingsSliceState = {
    timezone: '',
    qboTimezone: '',
    firstDayOfWeek: 0,
    settingsLoading: true,
    settingsReady: false,
    settingsError: null,
  };

  it('should return initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('setCompanyTimezone', () => {
    it('should set timezone, qboTimezone, firstDayOfWeek and mark ready', () => {
      const state = reducer(
        initialState,
        setCompanyTimezone({
          timezone: '(UTC-08:00) Pacific Time (US & Canada)',
          qboTimezone: '(UTC-08:00) Pacific Time (US & Canada)',
          firstDayOfWeek: 0,
        }),
      );

      expect(state.timezone).toBe('(UTC-08:00) Pacific Time (US & Canada)');
      expect(state.qboTimezone).toBe('(UTC-08:00) Pacific Time (US & Canada)');
      expect(state.firstDayOfWeek).toBe(0);
      expect(state.settingsReady).toBe(true);
    });

    it('should handle different timezone values', () => {
      const state = reducer(
        initialState,
        setCompanyTimezone({
          timezone: '(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi',
          qboTimezone: '(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi',
          firstDayOfWeek: 1,
        }),
      );

      expect(state.timezone).toBe(
        '(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi',
      );
      expect(state.firstDayOfWeek).toBe(1);
      expect(state.settingsReady).toBe(true);
    });
  });

  describe('setSettingsLoading', () => {
    it('should set settingsLoading to true', () => {
      const state = reducer(
        { ...initialState, settingsLoading: false },
        setSettingsLoading(true),
      );
      expect(state.settingsLoading).toBe(true);
    });

    it('should set settingsLoading to false', () => {
      const state = reducer(initialState, setSettingsLoading(false));
      expect(state.settingsLoading).toBe(false);
    });
  });

  describe('setSettingsError', () => {
    it('should set error and stop loading', () => {
      const state = reducer(
        initialState,
        setSettingsError('Failed to load settings'),
      );
      expect(state.settingsError).toBe('Failed to load settings');
      expect(state.settingsLoading).toBe(false);
    });

    it('should clear error when set to null', () => {
      const stateWithError: SettingsSliceState = {
        ...initialState,
        settingsError: 'some error',
      };
      const state = reducer(stateWithError, setSettingsError(null));
      expect(state.settingsError).toBeNull();
    });
  });

  describe('resetSettings', () => {
    it('should reset to initial state', () => {
      const modifiedState: SettingsSliceState = {
        timezone: '(UTC-05:00) Eastern Time',
        qboTimezone: '(UTC-05:00) Eastern Time',
        firstDayOfWeek: 1,
        settingsLoading: false,
        settingsReady: true,
        settingsError: null,
      };
      const state = reducer(modifiedState, resetSettings());
      expect(state).toEqual(initialState);
    });
  });
});
