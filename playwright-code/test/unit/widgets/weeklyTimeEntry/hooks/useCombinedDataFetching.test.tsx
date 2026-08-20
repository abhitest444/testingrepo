import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useCombinedDataFetching } from 'src/js/widgets/weeklyTimeEntry/hooks/useCombinedDataFetching';
import customerReducer from 'src/js/widgets/weeklyTimeEntry/store/customerSlice';
import timeEntryGridReducer from 'src/js/widgets/weeklyTimeEntry/store/timeEntryGridSlice';
import timeEntrySettingsReducer from 'src/js/widgets/weeklyTimeEntry/store/timeEntrySettingsSlice';
import contextMenuReducer from 'src/js/widgets/weeklyTimeEntry/store/contextMenuSlice';
import breaksReducer from 'src/js/widgets/weeklyTimeEntry/store/breaksSlice';
import validationReducer from 'src/js/widgets/weeklyTimeEntry/store/validationSlice';
import { UxPreferenceKey } from 'src/js/service/utils/useUXPreferences';
import { getVisibleDaysFromPreferences } from 'src/js/widgets/weeklyTimeEntry/utils/helpers';

// Mock the API hooks
jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn(),
}));
jest.mock('src/js/service/hooks/settings/useCompanySettings');
jest.mock('src/js/service/utils/useUXPreferences');
jest.mock('src/__generated__/oigql/graphql', () => ({
  useGetEmployerBreaksLazyQuery: jest.fn(),
}));

jest.mock('src/js/common/CustomerInteraction', () => ({
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn(),
  TimeCustomerInteraction: {
    BREAK_RULE_READ: 'BREAK_RULE_READ',
  },
}));

jest.mock('src/js/service/utils/sandboxUtils', () => ({
  isWorkforceEnvironment: jest.fn(),
}));

const mockUseSandbox = require('@payroll/quicksand').useSandbox;
const mockUseCompanySettings =
  require('src/js/service/hooks/settings/useCompanySettings').useCompanySettings;
const mockUseUxPreferences =
  require('src/js/service/utils/useUXPreferences').useUxPreferences;
const mockIsWorkforceEnvironment =
  require('src/js/service/utils/sandboxUtils').isWorkforceEnvironment;

const createTestStore = (initialState = {}) =>
  configureStore({
    reducer: {
      customers: customerReducer,
      timeEntryGrid: timeEntryGridReducer,
      timeEntrySettings: timeEntrySettingsReducer,
      contextMenu: contextMenuReducer,
      breaks: breaksReducer,
      validation: validationReducer,
    },
    preloadedState: initialState,
  });

const TestWrapper = ({
  children,
  store,
}: {
  children: React.ReactNode;
  store: any;
}) => <Provider store={store}>{children}</Provider>;

describe('useCombinedDataFetching', () => {
  let store: any;

  beforeEach(() => {
    store = createTestStore({
      timeEntryGrid: {
        weeklyTimeEntries: [],
        teamMember: null,
        dateRange: { start: '2024-01-01', end: '2024-01-07' },
        loading: false,
        error: null,
        selected: null,
        firstEditedCells: {},
        visibleDaysOfTheWeek: [0, 1, 2, 3, 4, 5, 6],
        visibleDaysFromPreferences: [],
      },
      timeEntrySettings: {
        hideTimeEntryFields: {
          isClassFieldEnabled: true,
          isProjectFieldEnabled: true,
          isLocationFieldEnabled: true,
          isPayTypeFieldEnabled: true,
          isCostRateFieldEnabled: true,
          isTaxableFieldEnabled: true,
        },
        hideWeekdays: {
          isSundayHidden: false,
          isMondayHidden: false,
          isTuesdayHidden: false,
          isWednesdayHidden: false,
          isThursdayHidden: false,
          isFridayHidden: false,
          isSaturdayHidden: false,
        },
        timeEntryTimeFor: null,
        isServiceFieldEnabled: false,
        isBillingFieldEnabled: false,
        firstDayOfWeek: 0,
        isClassEnabled: false,
        isLocationEnabled: false,
        classRequired: false,
        locationRequired: false,
        serviceItemRequired: false,
        timeSheetEntryMakesNotesRequiredEnabled: false,
        loading: false,
        error: null,
        panelOpen: true,
        visibleDays: [0, 1, 2, 3, 4, 5, 6],
        weeklyTimesheetTourCompleted: false,
        panelValues: {
          isSundayHidden: false,
          isMondayHidden: false,
          isTuesdayHidden: false,
          isWednesdayHidden: false,
          isThursdayHidden: false,
          isFridayHidden: false,
          isSaturdayHidden: false,
        },
      },
      breaks: {
        breaks: [],
        loading: false,
        error: null,
      },
      validation: {
        showValidationError: false,
        errorMessages: [],
        saveError: null,
        timeEntriesError: null,
        fieldErrors: {},
        rowErrors: {},
        settingsError: null,
        savePayload: null,
        detailedSaveErrors: null,
      },
    });

    // Reset mocks
    jest.clearAllMocks();
    mockUseCompanySettings.mockReturnValue({
      settingsData: null,
      loading: false,
      error: null,
      qlSettings: null,
    });
    mockUseUxPreferences.mockReturnValue({
      data: null,
      loading: false,
      error: null,
      getPreference: jest.fn(),
    });

    mockUseSandbox.mockReturnValue({
      logger: { info: jest.fn(), logException: jest.fn() },
    });
  });

  it('should return initial state when no data', () => {
    const { result } = renderHook(() => useCombinedDataFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    expect(result.current).toEqual({
      loading: false,
      error: undefined,
      settings: null,
      currentWeek: {
        startDate: expect.any(Object),
        endDate: expect.any(Object),
      },
      timeEntrySettings: null,
    });
  });

  it('should handle loading state from settings', () => {
    mockUseCompanySettings.mockReturnValue({
      settingsData: null,
      loading: true,
      error: null,
      qlSettings: null,
    });

    const { result } = renderHook(() => useCombinedDataFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    expect(result.current.loading).toBe(true);
  });

  it('should handle loading state from UX preferences', () => {
    mockUseUxPreferences.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      getPreference: jest.fn(),
    });

    const { result } = renderHook(() => useCombinedDataFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    expect(result.current.loading).toBe(true);
  });

  it('should handle error state from settings', () => {
    const mockError = 'Settings error';
    mockUseCompanySettings.mockReturnValue({
      settingsData: null,
      loading: false,
      error: mockError,
      qlSettings: null,
    });

    const { result } = renderHook(() => useCombinedDataFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    expect(result.current.error).toBe(mockError);
  });

  it('should handle error state from UX preferences', () => {
    const mockError = 'UX preferences error';
    mockUseUxPreferences.mockReturnValue({
      data: null,
      loading: false,
      error: mockError,
      getPreference: jest.fn(),
    });

    const { result } = renderHook(() => useCombinedDataFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    expect(result.current.error).toBe(mockError);
  });

  it('should prioritize UX preferences error over settings error', () => {
    const settingsError = 'Settings error';
    const uxError = 'UX preferences error';

    mockUseCompanySettings.mockReturnValue({
      settingsData: null,
      loading: false,
      error: settingsError,
      qlSettings: null,
    });

    mockUseUxPreferences.mockReturnValue({
      data: null,
      loading: false,
      error: uxError,
      getPreference: jest.fn(),
    });

    const { result } = renderHook(() => useCombinedDataFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    expect(result.current.error).toBe(uxError);
  });

  it('should return data from all hooks', () => {
    const mockSettings = { firstDayOfWeek: 1 };
    const mockUxPreferences = {
      [UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE]: {
        isSundayHidden: true,
        isMondayHidden: false,
        isTuesdayHidden: false,
        isWednesdayHidden: false,
        isThursdayHidden: false,
        isFridayHidden: false,
        isSaturdayHidden: true,
      },
      [UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS]: {
        isClassFieldEnabled: true,
        isProjectFieldEnabled: false,
        isLocationFieldEnabled: true,
        isPayTypeFieldEnabled: false,
        isCostRateFieldEnabled: true,
        isTaxableFieldEnabled: false,
      },
      [UxPreferenceKey.TIME_ENTRY_TIME_FOR]: null,
    };

    mockUseCompanySettings.mockReturnValue({
      settingsData: mockSettings,
      loading: false,
      error: null,
      qlSettings: null,
    });

    mockUseUxPreferences.mockReturnValue({
      data: mockUxPreferences,
      loading: false,
      error: null,
      getPreference: jest.fn(),
    });

    const { result } = renderHook(() => useCombinedDataFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    expect(result.current.settings).toEqual(mockSettings);
    expect(result.current.timeEntrySettings).toEqual(mockUxPreferences);
    expect(result.current.currentWeek).toEqual({
      startDate: expect.any(Object),
      endDate: expect.any(Object),
    });
  });

  it('should call getPreference for required preferences on mount', () => {
    const mockGetPreference = jest.fn();
    mockUseUxPreferences.mockReturnValue({
      data: null,
      loading: false,
      error: null,
      getPreference: mockGetPreference,
    });

    renderHook(() => useCombinedDataFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    expect(mockGetPreference).toHaveBeenCalledWith(
      UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE,
    );
    expect(mockGetPreference).toHaveBeenCalledWith(
      UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS,
    );
    expect(mockGetPreference).toHaveBeenCalledWith(
      UxPreferenceKey.TIME_ENTRY_TIME_FOR,
    );
    expect(mockGetPreference).toHaveBeenCalledWith(
      UxPreferenceKey.WEEKLY_TIMESHEET_TOUR_COMPLETED,
    );
  });

  it('should dispatch setUxPreferences with hideWeekdays when UX preferences data is available', () => {
    const mockUxPreferences = {
      [UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE]: {
        isSundayHidden: true,
        isMondayHidden: false,
        isTuesdayHidden: false,
        isWednesdayHidden: false,
        isThursdayHidden: false,
        isFridayHidden: false,
        isSaturdayHidden: true,
      },
      [UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS]: {
        isClassFieldEnabled: true,
        isProjectFieldEnabled: false,
        isLocationFieldEnabled: true,
        isPayTypeFieldEnabled: false,
        isCostRateFieldEnabled: true,
        isTaxableFieldEnabled: false,
      },
      [UxPreferenceKey.TIME_ENTRY_TIME_FOR]: null,
      [UxPreferenceKey.WEEKLY_TIMESHEET_TOUR_COMPLETED]: true,
    };

    mockUseUxPreferences.mockReturnValue({
      data: mockUxPreferences,
      loading: false,
      error: null,
      getPreference: jest.fn(),
    });

    renderHook(() => useCombinedDataFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    const state = store.getState();
    expect(state.timeEntrySettings.hideWeekdays).toEqual(
      mockUxPreferences[UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE],
    );
    expect(state.timeEntrySettings.hideTimeEntryFields).toEqual(
      mockUxPreferences[UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS],
    );
    expect(state.timeEntrySettings.weeklyTimesheetTourCompleted).toBe(true);
  });

  it('should dispatch setTeamMember when timeEntryTimeFor preference exists', () => {
    const mockTimeFor = {
      id: '123',
      name: 'John Doe',
      type: 'EMPLOYEE',
    };

    const mockUxPreferences = {
      [UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE]: {
        isSundayHidden: false,
        isMondayHidden: false,
        isTuesdayHidden: false,
        isWednesdayHidden: false,
        isThursdayHidden: false,
        isFridayHidden: false,
        isSaturdayHidden: false,
      },
      [UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS]: {
        isClassFieldEnabled: true,
        isProjectFieldEnabled: true,
        isLocationFieldEnabled: true,
        isPayTypeFieldEnabled: true,
        isCostRateFieldEnabled: true,
        isTaxableFieldEnabled: true,
      },
      [UxPreferenceKey.TIME_ENTRY_TIME_FOR]: mockTimeFor,
    };

    mockUseUxPreferences.mockReturnValue({
      data: mockUxPreferences,
      loading: false,
      error: null,
      getPreference: jest.fn(),
    });

    renderHook(() => useCombinedDataFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    const state = store.getState();
    expect(state.timeEntryGrid.teamMember).toEqual(mockTimeFor);
    expect(state.timeEntrySettings.timeEntryTimeFor).toEqual(mockTimeFor);
  });

  it('should call all hooks with correct parameters', () => {
    renderHook(() => useCombinedDataFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    expect(mockUseCompanySettings).toHaveBeenCalled();
    expect(mockUseUxPreferences).toHaveBeenCalled();
  });

  it('should default currentWeek to 7-day span when dateRange is empty', () => {
    const localStore = createTestStore({
      timeEntryGrid: {
        weeklyTimeEntries: [],
        teamMember: null,
        dateRange: { start: '', end: '' },
        loading: false,
        error: null,
        selected: null,
        firstEditedCells: {},
      },
      timeEntrySettings: store.getState().timeEntrySettings,
      breaks: store.getState().breaks,
      validation: store.getState().validation,
    });

    const { result } = renderHook(() => useCombinedDataFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={localStore}>{children}</TestWrapper>
      ),
    });

    const { startDate, endDate } = result.current.currentWeek;
    // Should be 6 days difference for a week
    expect(endDate.diff(startDate, 'day')).toBe(6);
  });

  it('should compute loading based on presence of companySettings', () => {
    const mockSettings = { firstDayOfWeek: 1 };

    // Case A: company settings present and not loading, ux preferences loading => result.loading mirrors ux
    mockUseCompanySettings.mockReturnValue({
      settingsData: mockSettings,
      loading: false,
      error: null,
      qlSettings: null,
    });
    const mockGetPreference = jest.fn();
    mockUseUxPreferences.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      getPreference: mockGetPreference,
    });

    const { result: resultA } = renderHook(() => useCombinedDataFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });
    expect(resultA.current.loading).toBe(true);
    // timeEntryGrid.loading should reflect companySettingsLoading
    expect(store.getState().timeEntryGrid.loading).toBe(false);
    // timeEntrySettings.loading should reflect uxPreferencesLoading
    expect(store.getState().timeEntrySettings.loading).toBe(true);

    // Case B: both loading true => result.loading true
    mockUseCompanySettings.mockReturnValue({
      settingsData: null,
      loading: true,
      error: null,
      qlSettings: null,
    });
    mockUseUxPreferences.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      getPreference: mockGetPreference,
    });
    const { result: resultB } = renderHook(() => useCombinedDataFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });
    expect(resultB.current.loading).toBe(true);
  });

  it('should map error objects to messages and update error slices', () => {
    // uxPreferencesError with message
    mockUseUxPreferences.mockReturnValue({
      data: null,
      loading: false,
      error: { message: 'Boom' },
      getPreference: jest.fn(),
    });

    const { result } = renderHook(() => useCombinedDataFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });
    expect(result.current.error).toBe('Boom');
    expect(store.getState().timeEntrySettings.error).toBe('Boom');

    // companySettingsError sets validation.settingsError
    mockUseCompanySettings.mockReturnValue({
      settingsData: null,
      loading: false,
      error: 'Settings broken',
      qlSettings: null,
    });

    const { rerender } = renderHook(() => useCombinedDataFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });
    expect(store.getState().validation.settingsError).toBe(
      'company_settings_error',
    );

    // Now clear errors
    mockUseUxPreferences.mockReturnValue({
      data: null,
      loading: false,
      error: null,
      getPreference: jest.fn(),
    });
    mockUseCompanySettings.mockReturnValue({
      settingsData: null,
      loading: false,
      error: null,
      qlSettings: null,
    });
    rerender();
    expect(store.getState().timeEntrySettings.error).toBe(null);
    expect(store.getState().validation.settingsError).toBe(null);

    // uxPreferencesError object without message => default
    mockUseUxPreferences.mockReturnValue({
      data: null,
      loading: false,
      error: {},
      getPreference: jest.fn(),
    });
    const { result: resultDefault } = renderHook(
      () => useCombinedDataFetching(),
      {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      },
    );
    expect(resultDefault.current.error).toBe('An error occurred');
  });

  it('should propagate company settings and firstDayOfWeek to store', () => {
    const mockSettings = {
      isServiceFieldEnabled: true,
      isBillingFieldEnabled: true,
      firstDayOfWeek: 2,
      isClassEnabled: false,
      isLocationEnabled: false,
    };
    const mockQlSettings = {
      classRequired: { value: true },
      locationRequired: { value: true },
      serviceItemRequired: { value: true },
      requireBillable: { value: true },
      timeSheetEntryMakesNotesRequiredEnabled: { value: true },
      classForTimeSheetEnabled: { value: true },
      locationForTimeSheetEnabled: { value: true },
    };

    mockUseCompanySettings.mockReturnValue({
      settingsData: mockSettings,
      loading: false,
      error: null,
      qlSettings: mockQlSettings,
    });

    renderHook(() => useCombinedDataFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    const s = store.getState().timeEntrySettings;
    expect(s.isServiceFieldEnabled).toBe(true);
    expect(s.isBillingFieldEnabled).toBe(true);
    expect(s.firstDayOfWeek).toBe(2);
    expect(s.isClassEnabled).toBe(true);
    expect(s.isLocationEnabled).toBe(true);
    expect(s.classRequired).toBe(true);
    expect(s.locationRequired).toBe(true);
    expect(s.serviceItemRequired).toBe(true);
    expect(s.requireBillable).toBe(true);
    expect(s.timeSheetEntryMakesNotesRequiredEnabled).toBe(true);
  });

  it('should seed dateRange to the current week when it is empty and settings arrive', () => {
    const emptyRangeStore = createTestStore({
      timeEntryGrid: {
        weeklyTimeEntries: [],
        teamMember: null,
        dateRange: { start: '', end: '' }, // empty -> should be seeded
        loading: false,
        error: null,
        selected: null,
        firstEditedCells: {},
      },
      timeEntrySettings: {
        firstDayOfWeek: 0,
        visibleDays: [0, 1, 2, 3, 4, 5, 6],
      },
    });

    mockUseCompanySettings.mockReturnValue({
      settingsData: { firstDayOfWeek: 1 },
      loading: false,
      error: null,
      qlSettings: null,
    });

    const dispatchSpy = jest.spyOn(emptyRangeStore, 'dispatch');

    renderHook(() => useCombinedDataFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={emptyRangeStore}>{children}</TestWrapper>
      ),
    });

    const setDateRangeCalls = dispatchSpy.mock.calls.filter(
      (call) =>
        (call[0] as { type?: string })?.type === 'timeEntryGrid/setDateRange',
    );
    expect(setDateRangeCalls.length).toBeGreaterThan(0);

    const { dateRange } = emptyRangeStore.getState().timeEntryGrid;
    expect(dateRange.start).toBeTruthy();
    expect(dateRange.end).toBeTruthy();

    dispatchSpy.mockRestore();
  });

  it('should wait for company settings loading before seeding dateRange', () => {
    const emptyRangeStore = createTestStore({
      timeEntryGrid: {
        weeklyTimeEntries: [],
        teamMember: null,
        dateRange: { start: '', end: '' },
        loading: false,
        error: null,
        selected: null,
        firstEditedCells: {},
      },
      timeEntrySettings: {
        firstDayOfWeek: 0,
        visibleDays: [0, 1, 2, 3, 4, 5, 6],
      },
    });

    const dispatchSpy = jest.spyOn(emptyRangeStore, 'dispatch');

    mockUseCompanySettings.mockReturnValue({
      settingsData: { firstDayOfWeek: 0 },
      loading: true,
      error: null,
      qlSettings: null,
    });

    const { rerender } = renderHook(() => useCombinedDataFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={emptyRangeStore}>{children}</TestWrapper>
      ),
    });

    let setDateRangeCalls = dispatchSpy.mock.calls.filter(
      (call) =>
        (call[0] as { type?: string })?.type === 'timeEntryGrid/setDateRange',
    );
    expect(setDateRangeCalls.length).toBe(0);

    mockUseCompanySettings.mockReturnValue({
      settingsData: { firstDayOfWeek: 2 },
      loading: false,
      error: null,
      qlSettings: null,
    });

    rerender();

    setDateRangeCalls = dispatchSpy.mock.calls.filter(
      (call) =>
        (call[0] as { type?: string })?.type === 'timeEntryGrid/setDateRange',
    );
    expect(setDateRangeCalls.length).toBeGreaterThan(0);

    const { dateRange } = emptyRangeStore.getState().timeEntryGrid;
    expect(dateRange.start).toBeTruthy();
    expect(dateRange.end).toBeTruthy();

    dispatchSpy.mockRestore();
  });

  it('should NOT overwrite an already-set dateRange when settings arrive', () => {
    // Default store has dateRange { 2024-01-01 .. 2024-01-07 } already set.
    mockUseCompanySettings.mockReturnValue({
      settingsData: { firstDayOfWeek: 1 },
      loading: false,
      error: null,
      qlSettings: null,
    });

    const dispatchSpy = jest.spyOn(store, 'dispatch');

    renderHook(() => useCombinedDataFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    const setDateRangeCalls = dispatchSpy.mock.calls.filter(
      (call) =>
        (call[0] as { type?: string })?.type === 'timeEntryGrid/setDateRange',
    );
    expect(setDateRangeCalls.length).toBe(0);

    // Range must be preserved
    const { dateRange } = store.getState().timeEntryGrid;
    expect(dateRange.start).toBe('2024-01-01');
    expect(dateRange.end).toBe('2024-01-07');

    dispatchSpy.mockRestore();
  });

  it('should compute and set visibleDays when prefs and firstDayOfWeek are present', () => {
    const hideWeekdays = {
      isSundayHidden: true,
      isMondayHidden: false,
      isTuesdayHidden: false,
      isWednesdayHidden: false,
      isThursdayHidden: false,
      isFridayHidden: false,
      isSaturdayHidden: true,
    };

    mockUseCompanySettings.mockReturnValue({
      settingsData: { firstDayOfWeek: 1 },
      loading: false,
      error: null,
      qlSettings: null,
    });

    mockUseUxPreferences.mockReturnValue({
      data: {
        [UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE]: hideWeekdays,
      },
      loading: false,
      error: null,
      getPreference: jest.fn(),
    });

    renderHook(() => useCombinedDataFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    const expected = getVisibleDaysFromPreferences(hideWeekdays, 1);
    expect(store.getState().timeEntrySettings.visibleDays).toEqual(expected);
  });

  it('should not set team member when TIME_ENTRY_TIME_FOR is invalid', () => {
    mockUseUxPreferences.mockReturnValue({
      data: {
        [UxPreferenceKey.TIME_ENTRY_TIME_FOR]: {},
      },
      loading: false,
      error: null,
      getPreference: jest.fn(),
    });

    renderHook(() => useCombinedDataFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    expect(store.getState().timeEntryGrid.teamMember).toBeNull();
  });

  it('should request preferences only once across rerenders', () => {
    const mockGetPreference = jest.fn();
    mockUseUxPreferences.mockReturnValue({
      data: null,
      loading: false,
      error: null,
      getPreference: mockGetPreference,
    });

    const { rerender } = renderHook(() => useCombinedDataFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    // First render calls all four preferences
    expect(mockGetPreference).toHaveBeenCalledTimes(4);

    // Rerender should not call them again
    rerender();
    expect(mockGetPreference).toHaveBeenCalledTimes(4);
  });
});

describe('EmployeeId parameter support for Workforce Users', () => {
  let store: any;

  beforeEach(() => {
    store = createTestStore({
      timeEntryGrid: {
        weeklyTimeEntries: [],
        teamMember: null,
        dateRange: { start: '2024-01-01', end: '2024-01-07' },
        loading: false,
        error: null,
        selected: null,
        firstEditedCells: {},
        visibleDaysOfTheWeek: [0, 1, 2, 3, 4, 5, 6],
        visibleDaysFromPreferences: [],
      },
      timeEntrySettings: {
        hideTimeEntryFields: {
          isClassFieldEnabled: true,
          isProjectFieldEnabled: true,
          isLocationFieldEnabled: true,
          isPayTypeFieldEnabled: true,
          isCostRateFieldEnabled: true,
          isTaxableFieldEnabled: true,
        },
        hideWeekdays: {
          isSundayHidden: false,
          isMondayHidden: false,
          isTuesdayHidden: false,
          isWednesdayHidden: false,
          isThursdayHidden: false,
          isFridayHidden: false,
          isSaturdayHidden: false,
        },
        timeEntryTimeFor: null,
        isServiceFieldEnabled: false,
        isBillingFieldEnabled: false,
        firstDayOfWeek: 0,
        isClassEnabled: false,
        isLocationEnabled: false,
        classRequired: false,
        locationRequired: false,
        serviceItemRequired: false,
        timeSheetEntryMakesNotesRequiredEnabled: false,
        loading: false,
        error: null,
        panelOpen: true,
        visibleDays: [0, 1, 2, 3, 4, 5, 6],
        weeklyTimesheetTourCompleted: false,
        panelValues: {
          isSundayHidden: false,
          isMondayHidden: false,
          isTuesdayHidden: false,
          isWednesdayHidden: false,
          isThursdayHidden: false,
          isFridayHidden: false,
          isSaturdayHidden: false,
        },
      },
      breaks: {
        breaks: [],
        loading: false,
        error: null,
      },
      validation: {
        showValidationError: false,
        errorMessages: [],
        saveError: null,
        timeEntriesError: null,
        fieldErrors: {},
        rowErrors: {},
        settingsError: null,
        savePayload: null,
        detailedSaveErrors: null,
      },
    });

    jest.clearAllMocks();
    mockIsWorkforceEnvironment.mockReturnValue(false);
    mockUseCompanySettings.mockReturnValue({
      settingsData: null,
      loading: false,
      error: null,
      qlSettings: null,
    });
    mockUseUxPreferences.mockReturnValue({
      data: null,
      loading: false,
      error: null,
      getPreference: jest.fn(),
    });

    mockUseSandbox.mockReturnValue({
      logger: { info: jest.fn(), logException: jest.fn() },
    });
  });

  it('should accept employeeId as parameter', () => {
    const testEmployeeId = 'emp-test-123';
    const { result } = renderHook(
      () => useCombinedDataFetching(testEmployeeId),
      {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      },
    );

    expect(result.current).toBeDefined();
  });

  it('should set team member with employeeId for workforce users', () => {
    const testEmployeeId = 'emp-wfs-456';
    mockIsWorkforceEnvironment.mockReturnValue(true);

    mockUseUxPreferences.mockReturnValue({
      data: {
        [UxPreferenceKey.TIME_ENTRY_TIME_FOR]: null,
      },
      loading: false,
      error: null,
      getPreference: jest.fn(),
    });

    renderHook(() => useCombinedDataFetching(testEmployeeId), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    const state = store.getState();
    expect(state.timeEntryGrid.teamMember).toEqual({
      id: testEmployeeId,
      name: '',
      type: 'EMPLOYEE',
    });
  });

  it('should prioritize employeeId over preference for workforce users', () => {
    const testEmployeeId = 'emp-priority-789';
    mockIsWorkforceEnvironment.mockReturnValue(true);

    const preferenceTimeFor = {
      id: 'pref-id',
      name: 'Preference User',
      type: 'EMPLOYEE',
    };

    mockUseUxPreferences.mockReturnValue({
      data: {
        [UxPreferenceKey.TIME_ENTRY_TIME_FOR]: preferenceTimeFor,
      },
      loading: false,
      error: null,
      getPreference: jest.fn(),
    });

    renderHook(() => useCombinedDataFetching(testEmployeeId), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    const state = store.getState();
    // Should use employeeId, not preference
    expect(state.timeEntryGrid.teamMember).toEqual({
      id: testEmployeeId,
      name: '',
      type: 'EMPLOYEE',
    });
  });

  it('should use preference when employeeId is not provided for workforce users', () => {
    mockIsWorkforceEnvironment.mockReturnValue(true);

    const preferenceTimeFor = {
      id: 'pref-only-id',
      name: 'Preference Only User',
      type: 'EMPLOYEE',
    };

    mockUseUxPreferences.mockReturnValue({
      data: {
        [UxPreferenceKey.TIME_ENTRY_TIME_FOR]: preferenceTimeFor,
      },
      loading: false,
      error: null,
      getPreference: jest.fn(),
    });

    renderHook(() => useCombinedDataFetching(null), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    const state = store.getState();
    // Should use preference since employeeId is null
    expect(state.timeEntryGrid.teamMember).toEqual(preferenceTimeFor);
  });

  it('should not set team member with employeeId for non-workforce users', () => {
    const testEmployeeId = 'emp-non-wfs-111';
    mockIsWorkforceEnvironment.mockReturnValue(false);

    const preferenceTimeFor = {
      id: 'pref-id',
      name: 'Preference User',
      type: 'EMPLOYEE',
    };

    mockUseUxPreferences.mockReturnValue({
      data: {
        [UxPreferenceKey.TIME_ENTRY_TIME_FOR]: preferenceTimeFor,
      },
      loading: false,
      error: null,
      getPreference: jest.fn(),
    });

    renderHook(() => useCombinedDataFetching(testEmployeeId), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    const state = store.getState();
    // Should use preference for non-workforce users
    expect(state.timeEntryGrid.teamMember).toEqual(preferenceTimeFor);
  });

  it('should log when setting employeeId as default team member for workforce users', () => {
    const testEmployeeId = 'emp-log-test';
    mockIsWorkforceEnvironment.mockReturnValue(true);
    const mockLogger = { info: jest.fn(), logException: jest.fn() };
    mockUseSandbox.mockReturnValue({ logger: mockLogger });

    mockUseUxPreferences.mockReturnValue({
      data: {
        [UxPreferenceKey.TIME_ENTRY_TIME_FOR]: null,
      },
      loading: false,
      error: null,
      getPreference: jest.fn(),
    });

    renderHook(() => useCombinedDataFetching(testEmployeeId), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Component=useCombinedDataFetching Event=SettingEmployeeIdAsDefaultTeamMember',
      {
        employeeId: testEmployeeId,
        source: 'prop',
      },
    );
  });

  it('should handle null employeeId parameter', () => {
    const { result } = renderHook(() => useCombinedDataFetching(null), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    expect(result.current).toBeDefined();
  });

  it('should handle undefined employeeId parameter', () => {
    const { result } = renderHook(() => useCombinedDataFetching(undefined), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    expect(result.current).toBeDefined();
  });

  it('should handle empty string employeeId parameter', () => {
    mockIsWorkforceEnvironment.mockReturnValue(true);

    mockUseUxPreferences.mockReturnValue({
      data: {
        [UxPreferenceKey.TIME_ENTRY_TIME_FOR]: null,
      },
      loading: false,
      error: null,
      getPreference: jest.fn(),
    });

    renderHook(() => useCombinedDataFetching(''), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    const state = store.getState();
    // Empty string should be treated as falsy, should not set team member
    expect(state.timeEntryGrid.teamMember).toBeNull();
  });

  it('should include employeeId in dependency array for useEffect', () => {
    const testEmployeeId1 = 'emp-dep-1';
    const testEmployeeId2 = 'emp-dep-2';
    mockIsWorkforceEnvironment.mockReturnValue(true);

    mockUseUxPreferences.mockReturnValue({
      data: {
        [UxPreferenceKey.TIME_ENTRY_TIME_FOR]: null,
      },
      loading: false,
      error: null,
      getPreference: jest.fn(),
    });

    const { rerender } = renderHook(
      ({ employeeId }) => useCombinedDataFetching(employeeId),
      {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
        initialProps: { employeeId: testEmployeeId1 },
      },
    );

    const state1 = store.getState();
    expect(state1.timeEntryGrid.teamMember?.id).toBe(testEmployeeId1);

    // Rerender with different employeeId
    rerender({ employeeId: testEmployeeId2 });

    const state2 = store.getState();
    expect(state2.timeEntryGrid.teamMember?.id).toBe(testEmployeeId2);
  });
});
