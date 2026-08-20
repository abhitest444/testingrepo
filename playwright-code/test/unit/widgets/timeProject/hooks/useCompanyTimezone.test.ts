import { renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import projectsReducer from 'src/js/widgets/timeProject/store/projectsSlice';
import filtersReducer from 'src/js/widgets/timeProject/store/filtersSlice';
import uiReducer from 'src/js/widgets/timeProject/store/uiSlice';
import settingsReducer from 'src/js/widgets/timeProject/store/settingsSlice';
import { useCompanyTimezone } from 'src/js/widgets/timeProject/hooks/useCompanyTimezone';

const mockSettingsData = {
  timezone: '(UTC-08:00) Pacific Time (US & Canada)',
  qboTimezone: '(UTC-08:00) Pacific Time (US & Canada)',
  firstDayOfWeek: 0,
  isServiceFieldEnabled: false,
  isBillingFieldEnabled: false,
  isClassEnabled: false,
  isLocationEnabled: false,
  isTaxableFieldEnabled: false,
  entityVersion: '0',
  isCloseBookDateEnabled: false,
  isCloseBookPasswordEnabled: false,
  closeBookDate: {} as any,
};

let mockLoading = false;
let mockError = '';

jest.mock('src/js/service/hooks/settings/useCompanySettings', () => ({
  useCompanySettings: () => ({
    settingsData: mockSettingsData,
    refetch: jest.fn(),
    loading: mockLoading,
    error: mockError,
    qlSettings: {},
    qboSettings: {},
  }),
}));

const createTestStore = () =>
  configureStore({
    reducer: {
      projects: projectsReducer,
      filters: filtersReducer,
      ui: uiReducer,
      settings: settingsReducer,
    },
  });

const createWrapper =
  (store: ReturnType<typeof createTestStore>): React.FC =>
  ({ children }) =>
    React.createElement(Provider, { store } as any, children);

describe('useCompanyTimezone', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoading = false;
    mockError = '';
  });

  it('should return initial state when settings are loading', () => {
    mockLoading = true;
    mockSettingsData.timezone = '';
    const store = createTestStore();
    const { result } = renderHook(() => useCompanyTimezone(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.settingsLoading).toBe(true);
    expect(result.current.settingsReady).toBe(false);
  });

  it('should store timezone in Redux when settings load', () => {
    mockLoading = false;
    mockSettingsData.timezone = '(UTC-08:00) Pacific Time (US & Canada)';
    mockSettingsData.qboTimezone = '(UTC-08:00) Pacific Time (US & Canada)';
    mockSettingsData.firstDayOfWeek = 0;

    const store = createTestStore();
    const { result } = renderHook(() => useCompanyTimezone(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.timezone).toBe(
      '(UTC-08:00) Pacific Time (US & Canada)',
    );
    expect(result.current.settingsReady).toBe(true);
    expect(result.current.settingsLoading).toBe(false);
  });

  it('should handle settings error', () => {
    mockError = 'Failed to load company settings';
    const store = createTestStore();
    const { result } = renderHook(() => useCompanyTimezone(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.settingsError).toBe(
      'Failed to load company settings',
    );
  });

  it('should mark settingsReady true even when timezone is empty', () => {
    // Some entry points (e.g. cold deep-link loads from `?jobId=time`) come
    // back without a timezone. We still need the page to render instead of
    // hanging on the spinner forever - the dayjs helpers fall back to the
    // local zone when the company timezone is empty.
    mockLoading = false;
    mockSettingsData.timezone = '';
    const store = createTestStore();
    const { result } = renderHook(() => useCompanyTimezone(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.settingsReady).toBe(true);
    expect(result.current.timezone).toBe('');
  });

  it('should use timezone as qboTimezone fallback when qboTimezone is empty', () => {
    mockLoading = false;
    mockSettingsData.timezone = '(UTC-05:00) Eastern Time (US & Canada)';
    mockSettingsData.qboTimezone = '';
    const store = createTestStore();
    const { result } = renderHook(() => useCompanyTimezone(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.timezone).toBe(
      '(UTC-05:00) Eastern Time (US & Canada)',
    );
    expect(result.current.settingsReady).toBe(true);
  });

  it('should not dispatch timezone when still loading', () => {
    mockLoading = true;
    mockSettingsData.timezone = '(UTC-08:00) Pacific Time (US & Canada)';
    const store = createTestStore();
    renderHook(() => useCompanyTimezone(), {
      wrapper: createWrapper(store),
    });

    expect(store.getState().settings.settingsLoading).toBe(true);
  });
});
