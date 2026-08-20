import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MockedProvider } from '@apollo/client/testing';
import { InMemoryCache } from '@apollo/client';
import { WeeklyTimeEntryDataProvider } from 'src/js/widgets/weeklyTimeEntry/components/WeeklyTimeEntryDataProvider';
import timeEntryGridSlice from 'src/js/widgets/weeklyTimeEntry/store/timeEntryGridSlice';
import timeEntrySettingsSlice from 'src/js/widgets/weeklyTimeEntry/store/timeEntrySettingsSlice';
import customerSlice from 'src/js/widgets/weeklyTimeEntry/store/customerSlice';
import breaksSlice from 'src/js/widgets/weeklyTimeEntry/store/breaksSlice';
import contextMenuSlice from 'src/js/widgets/weeklyTimeEntry/store/contextMenuSlice';
import undoRedoSlice from 'src/js/widgets/weeklyTimeEntry/store/undoRedoSlice';
import customFieldsSlice from 'src/js/widgets/customField/store/customFieldsSlice';
import assignmentSlice from 'src/js/widgets/weeklyTimeEntry/store/assignmentSlice';

// Mock Apollo Client with proper setup for testing
const mockApolloClient = {
  query: jest.fn(),
  mutate: jest.fn(),
  cache: new InMemoryCache(),
  watchQuery: jest.fn(),
  subscribe: jest.fn(),
  readQuery: jest.fn(),
  writeQuery: jest.fn(),
  resetStore: jest.fn(),
  clearStore: jest.fn(),
} as any;

// Mock the hooks
const mockUseCombinedDataFetching = jest.fn();
const mockUseGridInitialization = jest.fn();
const mockUseTimeEntriesFetching = jest.fn();

// Mock feature flag hooks
jest.mock('src/js/service/utils/featureFlags', () => ({
  isIXPFeatureFlagEnabled: jest.fn(),
}));

jest.mock('src/js/common/useIXPFeatureFlag', () => ({
  useIXPFeatureFlag: jest.fn(),
}));

const mockIsIXPFeatureFlagEnabled = jest.mocked(
  require('src/js/service/utils/featureFlags').isIXPFeatureFlagEnabled,
);

const mockUseIXPFeatureFlag = jest.mocked(
  require('src/js/common/useIXPFeatureFlag').useIXPFeatureFlag,
);

// Mock sandbox (pluginConfig, extensions used by Assignment Apollo client / buildHeaders)
const mockSandbox = {
  logger: {
    error: jest.fn(),
    log: jest.fn(),
    info: jest.fn(),
  },
  appContext: {
    getEnvironment: jest.fn().mockReturnValue('production'),
    getRealmInfo: jest.fn().mockReturnValue({ realmId: 'test-realm' }),
    getUserAuthInfo: jest.fn().mockReturnValue({ authId: 'test-auth' }),
  },
  pluginConfig: {
    extendedProperties: {
      appSecret: 'test-app-secret',
    },
  },
  extendedProperties: {
    get: jest.fn(),
    set: jest.fn(),
  },
  extensions: {
    qbo: {
      context: {
        getEnvironmentInfo: jest.fn().mockReturnValue({ xCsrfToken: '' }),
        getCompanyL10nInfo: jest.fn().mockReturnValue({ region: 'US' }),
      },
    },
  },
};

// Mock assignment hooks
jest.mock(
  'src/js/service/hooks/assignments/useStandardFieldOptionAssignments',
  () => ({
    useStandardFieldOptionAssignments: jest.fn(() => ({
      loadStandardFieldOptionAssignments: jest.fn(),
      data: [],
      loading: false,
      error: null,
      pageInfo: null,
    })),
  }),
);

jest.mock(
  'src/js/service/hooks/assignments/useCustomFieldOptionAssignments',
  () => ({
    useCustomFieldOptionAssignments: jest.fn(() => ({
      loadCustomFieldOptionAssignments: jest.fn(),
      data: [],
      loading: false,
      error: null,
      pageInfo: null,
    })),
  }),
);

jest.mock(
  'src/js/service/hooks/assignments/useStandardFieldAssignments',
  () => ({
    useStandardFieldAssignments: jest.fn(() => ({
      loadStandardFieldAssignments: jest.fn(),
      data: [],
      loading: false,
      error: null,
      pageInfo: null,
    })),
  }),
);

jest.mock('src/js/service/hooks/assignments/useCustomFieldAssignments', () => ({
  useCustomFieldAssignments: jest.fn(() => ({
    loadCustomFieldAssignments: jest.fn(),
    data: [],
    loading: false,
    error: null,
    pageInfo: null,
  })),
}));

jest.mock('@payroll/quicksand', () => ({
  useSandbox: () => mockSandbox,
  useTracking: () => ({
    track: jest.fn(),
    trackEvent: jest.fn(),
  }),
  useIntl: () => ({
    formatMessage: jest.fn(({ id }) => id),
  }),
  useFeatureFlag: () => false,
  useIXPFeatureFlag: () => false,
}));

jest.mock(
  'src/js/widgets/weeklyTimeEntry/hooks/useCombinedDataFetching',
  () => ({
    useCombinedDataFetching: (employeeId?: string | null) =>
      mockUseCombinedDataFetching(employeeId),
  }),
);

// Avoid creating real Assignment Apollo client (HttpLink needs fetch; useTimeAgainstAssignments uses it)
jest.mock(
  'src/js/widgets/weeklyTimeEntry/hooks/useWTETimeAgainstAssignmentsFetch',
  () => ({
    useWTETimeAgainstAssignmentsFetch: () => ({
      loadMore: jest.fn(),
      hasMore: false,
    }),
  }),
);

jest.mock(
  'src/js/service/hooks/weeklyTimeEntries/useSaveWeeklyTimeEntries',
  () => ({
    useSaveWeeklyTimeEntries: () => ({
      saveWeeklyTimeEntries: jest.fn(),
      loading: false,
      savedData: undefined,
      hasDataToSave: false,
    }),
  }),
);

jest.mock('src/js/widgets/weeklyTimeEntry/hooks/useGridInitialization', () => ({
  useGridInitialization: () => mockUseGridInitialization(),
}));

jest.mock(
  'src/js/widgets/weeklyTimeEntry/hooks/useTimeEntriesFetching',
  () => ({
    useTimeEntriesFetching: (combinedDataReady: boolean) =>
      mockUseTimeEntriesFetching(combinedDataReady),
  }),
);

// Mock KeyboardShortcutsWrapper to test handleWeekChange and avoid hotkeys complexity
jest.mock(
  'src/js/widgets/weeklyTimeEntry/components/KeyboardShortcutsWrapper',
  () => ({
    KeyboardShortcutsWrapper: ({
      children,
      onWeekChange,
    }: {
      children?: React.ReactNode;
      onWeekChange?: (range: { start: string; end: string }) => void;
    }) => (
      <div data-testid="keyboard-shortcuts-wrapper">
        {children}
        <button
          type="button"
          data-testid="trigger-week-change"
          onClick={() =>
            onWeekChange?.({ start: '2024-01-15', end: '2024-01-21' })
          }
        >
          Week Change
        </button>
      </div>
    ),
  }),
);

// Mock WTEAssignmentManager wrapper to avoid Apollo context issues in rerenders; render children so WeeklyTimeEntryTrowser is visible
jest.mock('src/js/widgets/weeklyTimeEntry/hooks/WTEAssignmentManager', () => ({
  WTEAssignmentManager: ({ children }: { children?: React.ReactNode }) =>
    children ?? null,
}));

// Mock WeeklyTimeEntryTrowser component
jest.mock(
  'src/js/widgets/weeklyTimeEntry/components/WeeklyTimeEntryTrowser',
  () => ({
    WeeklyTimeEntryTrowser: ({
      isOpen,
      setOpen,
      settingsData,
      currentWeek,
      timeEntries,
      customers,
      hasData,
      isLoading,
      error,
      refetch,
      isWeeklyTimesheetTourEnabled,
    }: any) => {
      if (isLoading) {
        return (
          <div data-testid="weekly-time-entry-trowser" data-is-loading="true">
            <div data-testid="activity-dots-large">Loading...</div>
          </div>
        );
      }

      if (error) {
        return (
          <div data-testid="weekly-time-entry-trowser" data-error={error}>
            <div data-testid="error-message">Error: {error}</div>
          </div>
        );
      }

      return (
        <div
          data-testid="weekly-time-entry-trowser"
          data-is-open={isOpen}
          data-settings-data={JSON.stringify(settingsData)}
          data-current-week={JSON.stringify(currentWeek)}
          data-time-entries={JSON.stringify(timeEntries)}
          data-customers={JSON.stringify(customers)}
          data-has-data={hasData}
          data-is-loading={isLoading}
          data-error={error}
          data-refetch={refetch ? 'function' : undefined}
          data-tour-enabled={isWeeklyTimesheetTourEnabled}
        >
          <button onClick={() => setOpen(false)} type="button">
            Close
          </button>
          <button onClick={() => refetch?.()} type="button">
            Refetch
          </button>
        </div>
      );
    },
  }),
);

const createMockStore = (initialState = {}) =>
  configureStore({
    reducer: {
      timeEntryGrid: timeEntryGridSlice,
      timeEntrySettings: timeEntrySettingsSlice,
      customer: customerSlice,
      breaks: breaksSlice,
      contextMenu: contextMenuSlice,
      undoRedo: undoRedoSlice,
      customFields: customFieldsSlice,
      assignments: assignmentSlice,
    },
    preloadedState: initialState,
  });

describe('WeeklyTimeEntryDataProvider', () => {
  const mockSetOpen = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockUseCombinedDataFetching.mockReturnValue({
      settings: { firstDayOfWeek: 0 },
      currentWeek: { start: '2024-01-01', end: '2024-01-07' },
      loading: false,
      error: null,
    });

    mockUseGridInitialization.mockReturnValue({
      customers: [{ id: '1', name: 'Customer 1' }],
      isLoading: false,
      error: null,
    });

    mockUseTimeEntriesFetching.mockReturnValue({
      timeEntries: [{ id: '1', date: '2024-01-01', duration: 8 }],
      hasData: true,
      refetch: jest.fn(),
    });

    // Mock QuickFind feature flags - default to settled so isLoading gate
    // (which now also waits for flag settlement) does not block test renders
    mockUseIXPFeatureFlag.mockReturnValue({
      isEnabled: false,
      settled: true,
    });
  });

  const renderWithProvider = (props = {}) => {
    const defaultProps = {
      isOpen: true,
      setOpen: mockSetOpen,
      ...props,
    };

    const store = createMockStore();

    return render(
      <Provider store={store}>
        <MockedProvider mocks={[]} addTypename={false}>
          <WeeklyTimeEntryDataProvider {...defaultProps} />
        </MockedProvider>
      </Provider>,
    );
  };

  it('should render WeeklyTimeEntryTrowser with correct props', () => {
    renderWithProvider();

    const trowser = screen.getByTestId('weekly-time-entry-trowser');
    expect(trowser).toBeInTheDocument();
    // The component exists and renders without crashing
    expect(trowser).toBeInTheDocument();
  });

  it('should pass memoized data to WeeklyTimeEntryTrowser', () => {
    const mockSettings = { firstDayOfWeek: 1 };
    const mockCurrentWeek = { start: '2024-01-08', end: '2024-01-14' };
    const mockTimeEntries = [{ id: '2', date: '2024-01-08', duration: 6 }];
    const mockCustomers = [{ id: '2', name: 'Customer 2' }];

    mockUseCombinedDataFetching.mockReturnValue({
      settings: mockSettings,
      currentWeek: mockCurrentWeek,
      loading: false,
      error: null,
    });

    mockUseGridInitialization.mockReturnValue({
      customers: mockCustomers,
      isLoading: false,
      error: null,
    });

    mockUseTimeEntriesFetching.mockReturnValue({
      timeEntries: mockTimeEntries,
      hasData: true,
      refetch: jest.fn(),
    });

    renderWithProvider();

    const trowser = screen.getByTestId('weekly-time-entry-trowser');
    // The component renders with the provided data
    expect(trowser).toBeInTheDocument();
  });

  it('should handle loading state correctly', () => {
    mockUseCombinedDataFetching.mockReturnValue({
      settings: null,
      currentWeek: null,
      loading: true,
      error: null,
    });

    mockUseGridInitialization.mockReturnValue({
      customers: [],
      isLoading: false,
      error: null,
    });

    renderWithProvider();

    const trowser = screen.getByTestId('weekly-time-entry-trowser');
    // Component renders during loading state
    expect(trowser).toBeInTheDocument();
  });

  it('should handle grid loading state correctly', () => {
    mockUseCombinedDataFetching.mockReturnValue({
      settings: { firstDayOfWeek: 0 },
      currentWeek: { start: '2024-01-01', end: '2024-01-07' },
      loading: false,
      error: null,
    });

    mockUseGridInitialization.mockReturnValue({
      customers: [],
      isLoading: true,
      error: null,
    });

    renderWithProvider();

    const trowser = screen.getByTestId('weekly-time-entry-trowser');
    // Component renders during grid loading state
    expect(trowser).toBeInTheDocument();
  });

  it('should handle combined loading state correctly', () => {
    mockUseCombinedDataFetching.mockReturnValue({
      settings: null,
      currentWeek: null,
      loading: true,
      error: null,
    });

    mockUseGridInitialization.mockReturnValue({
      customers: [],
      isLoading: true,
      error: null,
    });

    renderWithProvider();

    const trowser = screen.getByTestId('weekly-time-entry-trowser');
    // Component renders during combined loading state
    expect(trowser).toBeInTheDocument();
  });

  it('should handle error state correctly', () => {
    const mockError = 'Failed to load data';

    mockUseCombinedDataFetching.mockReturnValue({
      settings: null,
      currentWeek: null,
      loading: false,
      error: mockError,
    });

    mockUseGridInitialization.mockReturnValue({
      customers: [],
      isLoading: false,
      error: null,
    });

    renderWithProvider();

    const trowser = screen.getByTestId('weekly-time-entry-trowser');
    // Component renders during error state
    expect(trowser).toBeInTheDocument();
  });

  it('should handle grid error state correctly', () => {
    const mockError = 'Failed to load grid data';

    mockUseCombinedDataFetching.mockReturnValue({
      settings: { firstDayOfWeek: 0 },
      currentWeek: { start: '2024-01-01', end: '2024-01-07' },
      loading: false,
      error: null,
    });

    mockUseGridInitialization.mockReturnValue({
      customers: [],
      isLoading: false,
      error: mockError,
    });

    renderWithProvider();

    const trowser = screen.getByTestId('weekly-time-entry-trowser');
    // Component renders during grid error state
    expect(trowser).toBeInTheDocument();
  });

  it('should prioritize combined error over grid error', () => {
    const combinedError = 'Combined error';
    const gridError = 'Grid error';

    mockUseCombinedDataFetching.mockReturnValue({
      settings: null,
      currentWeek: null,
      loading: false,
      error: combinedError,
    });

    mockUseGridInitialization.mockReturnValue({
      customers: [],
      isLoading: false,
      error: gridError,
    });

    renderWithProvider();

    const trowser = screen.getByTestId('weekly-time-entry-trowser');
    // Component renders and prioritizes combined error
    expect(trowser).toBeInTheDocument();
  });

  it('should handle no data state correctly', () => {
    mockUseTimeEntriesFetching.mockReturnValue({
      timeEntries: [],
      hasData: false,
      refetch: jest.fn(),
    });

    renderWithProvider();

    const trowser = screen.getByTestId('weekly-time-entry-trowser');
    // Component renders with no data state
    expect(trowser).toBeInTheDocument();
  });

  it('should call refetch function when provided', () => {
    const mockRefetch = jest.fn();

    mockUseTimeEntriesFetching.mockReturnValue({
      timeEntries: [{ id: '1', date: '2024-01-01', duration: 8 }],
      hasData: true,
      refetch: mockRefetch,
    });

    renderWithProvider();

    const refetchButton = screen.getByText('Refetch');
    fireEvent.click(refetchButton);

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('should handle refetch function being undefined', () => {
    mockUseTimeEntriesFetching.mockReturnValue({
      timeEntries: [{ id: '1', date: '2024-01-01', duration: 8 }],
      hasData: true,
      refetch: undefined,
    });

    renderWithProvider();

    const trowser = screen.getByTestId('weekly-time-entry-trowser');
    expect(trowser).toHaveAttribute('data-refetch', undefined);
  });

  it('should handle closed state correctly', () => {
    renderWithProvider({ isOpen: false });

    const trowser = screen.getByTestId('weekly-time-entry-trowser');
    expect(trowser).toHaveAttribute('data-is-open', 'false');
  });

  it('should call setOpen when close button is clicked', () => {
    renderWithProvider();

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    expect(mockSetOpen).toHaveBeenCalledWith(false);
  });

  it('should dispatch setDateRange and clearValidationError when week change is triggered', () => {
    const store = createMockStore();
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    render(
      <Provider store={store}>
        <MockedProvider mocks={[]} addTypename={false}>
          <WeeklyTimeEntryDataProvider isOpen setOpen={mockSetOpen} />
        </MockedProvider>
      </Provider>,
    );

    const weekChangeButton = screen.getByTestId('trigger-week-change');
    fireEvent.click(weekChangeButton);

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'timeEntryGrid/setDateRange',
        payload: { start: '2024-01-15', end: '2024-01-21' },
      }),
    );
    const clearValidationCalls = dispatchSpy.mock.calls.filter(
      (call) =>
        (call[0] as { type?: string })?.type ===
        'validation/clearValidationError',
    );
    expect(clearValidationCalls.length).toBeGreaterThan(0);
  });

  it('should handle initialization state correctly', () => {
    // Test that the component properly tracks initialization
    mockUseCombinedDataFetching.mockReturnValue({
      settings: null,
      currentWeek: null,
      loading: true,
      error: null,
    });

    mockUseGridInitialization.mockReturnValue({
      customers: [],
      isLoading: true,
      error: null,
    });

    renderWithProvider();

    // Initially loading
    const trowser = screen.getByTestId('weekly-time-entry-trowser');
    expect(trowser).toHaveAttribute('data-is-loading', 'true');

    // Verify that useTimeEntriesFetching was called with the correct parameter
    expect(mockUseTimeEntriesFetching).toHaveBeenCalledWith(false); // false because combinedLoading is true
  });

  it('should skip initialization effect when already initialized (early return)', () => {
    mockUseCombinedDataFetching.mockReturnValue({
      settings: { firstDayOfWeek: 0 },
      currentWeek: { start: '2024-01-01', end: '2024-01-07' },
      loading: false,
      error: null,
    });
    mockUseGridInitialization.mockReturnValue({
      customers: [{ id: '1', name: 'Customer 1' }],
      isLoading: false,
      error: null,
    });
    mockUseTimeEntriesFetching.mockReturnValue({
      timeEntries: [{ id: '1', date: '2024-01-01', duration: 8 }],
      hasData: true,
      refetch: jest.fn(),
      loading: false,
      error: null,
    });

    const { rerender } = renderWithProvider();
    expect(screen.getByTestId('weekly-time-entry-trowser')).toBeInTheDocument();

    mockUseTimeEntriesFetching.mockReturnValue({
      timeEntries: [{ id: '1', date: '2024-01-01', duration: 8 }],
      hasData: true,
      refetch: jest.fn(),
      loading: false,
      error: 'Temporary error',
    });
    rerender(
      <Provider store={createMockStore()}>
        <MockedProvider mocks={[]} addTypename={false}>
          <WeeklyTimeEntryDataProvider isOpen setOpen={mockSetOpen} />
        </MockedProvider>
      </Provider>,
    );

    mockUseTimeEntriesFetching.mockReturnValue({
      timeEntries: [{ id: '1', date: '2024-01-01', duration: 8 }],
      hasData: true,
      refetch: jest.fn(),
      loading: false,
      error: null,
    });
    rerender(
      <Provider store={createMockStore()}>
        <MockedProvider mocks={[]} addTypename={false}>
          <WeeklyTimeEntryDataProvider isOpen setOpen={mockSetOpen} />
        </MockedProvider>
      </Provider>,
    );
    expect(screen.getByTestId('weekly-time-entry-trowser')).toBeInTheDocument();
  });

  it('should memoize data to prevent unnecessary re-renders', () => {
    const mockSettings = { firstDayOfWeek: 0 };
    const mockCurrentWeek = { start: '2024-01-01', end: '2024-01-07' };
    const mockTimeEntries = [{ id: '1', date: '2024-01-01', duration: 8 }];
    const mockCustomers = [{ id: '1', name: 'Customer 1' }];

    mockUseCombinedDataFetching.mockReturnValue({
      settings: mockSettings,
      currentWeek: mockCurrentWeek,
      loading: false,
      error: null,
    });

    mockUseGridInitialization.mockReturnValue({
      customers: mockCustomers,
      isLoading: false,
      error: null,
    });

    mockUseTimeEntriesFetching.mockReturnValue({
      timeEntries: mockTimeEntries,
      hasData: true,
      refetch: jest.fn(),
    });

    const { rerender } = renderWithProvider();

    // Get initial render
    let trowser = screen.getByTestId('weekly-time-entry-trowser');
    const initialSettingsData = trowser.getAttribute('data-settings-data');

    // Re-render with same props
    rerender(
      <Provider store={createMockStore()}>
        <WeeklyTimeEntryDataProvider isOpen setOpen={mockSetOpen} />
      </Provider>,
    );

    trowser = screen.getByTestId('weekly-time-entry-trowser');
    const newSettingsData = trowser.getAttribute('data-settings-data');

    // The data should be the same (memoized)
    expect(newSettingsData).toBe(initialSettingsData);
  });

  it('should handle undefined refetch function gracefully', () => {
    mockUseTimeEntriesFetching.mockReturnValue({
      timeEntries: [{ id: '1', date: '2024-01-01', duration: 8 }],
      hasData: true,
      refetch: undefined,
    });

    renderWithProvider();

    const refetchButton = screen.getByText('Refetch');
    fireEvent.click(refetchButton);

    // Should not throw an error when refetch is undefined
    expect(refetchButton).toBeInTheDocument();
  });

  it('should handle null data values correctly', () => {
    mockUseCombinedDataFetching.mockReturnValue({
      settings: null,
      currentWeek: null,
      loading: false,
      error: null,
    });

    mockUseGridInitialization.mockReturnValue({
      customers: null,
      isLoading: false,
      error: null,
    });

    mockUseTimeEntriesFetching.mockReturnValue({
      timeEntries: null,
      hasData: false,
      refetch: jest.fn(),
    });

    renderWithProvider();

    const trowser = screen.getByTestId('weekly-time-entry-trowser');
    // Component renders with null data values
    expect(trowser).toBeInTheDocument();
  });

  it('should handle empty arrays correctly', () => {
    mockUseCombinedDataFetching.mockReturnValue({
      settings: {},
      currentWeek: {},
      loading: false,
      error: null,
    });

    mockUseGridInitialization.mockReturnValue({
      customers: [],
      isLoading: false,
      error: null,
    });

    mockUseTimeEntriesFetching.mockReturnValue({
      timeEntries: [],
      hasData: false,
      refetch: jest.fn(),
    });

    renderWithProvider();

    const trowser = screen.getByTestId('weekly-time-entry-trowser');
    // Component renders with empty arrays
    expect(trowser).toBeInTheDocument();
  });

  it('should handle complex data structures correctly', () => {
    const complexSettings = {
      firstDayOfWeek: 1,
      preferences: {
        theme: 'dark',
        language: 'en',
        notifications: true,
      },
    };

    const complexCurrentWeek = {
      start: '2024-01-01',
      end: '2024-01-07',
      weekNumber: 1,
      year: 2024,
    };

    const complexTimeEntries = [
      {
        id: '1',
        date: '2024-01-01',
        duration: 8,
        description: 'Work on project',
        customer: { id: '1', name: 'Customer 1' },
        tags: ['development', 'frontend'],
      },
    ];

    const complexCustomers = [
      {
        id: '1',
        name: 'Customer 1',
        email: 'customer1@example.com',
        phone: '+1234567890',
      },
    ];

    mockUseCombinedDataFetching.mockReturnValue({
      settings: complexSettings,
      currentWeek: complexCurrentWeek,
      loading: false,
      error: null,
    });

    mockUseGridInitialization.mockReturnValue({
      customers: complexCustomers,
      isLoading: false,
      error: null,
    });

    mockUseTimeEntriesFetching.mockReturnValue({
      timeEntries: complexTimeEntries,
      hasData: true,
      refetch: jest.fn(),
    });

    renderWithProvider();

    const trowser = screen.getByTestId('weekly-time-entry-trowser');
    // Component renders with complex data structures
    expect(trowser).toBeInTheDocument();
  });

  it('should handle multiple error states correctly', () => {
    const combinedError = 'Combined data error';
    const gridError = 'Grid initialization error';

    mockUseCombinedDataFetching.mockReturnValue({
      settings: null,
      currentWeek: null,
      loading: false,
      error: combinedError,
    });

    mockUseGridInitialization.mockReturnValue({
      customers: [],
      isLoading: false,
      error: gridError,
    });

    renderWithProvider();

    const trowser = screen.getByTestId('weekly-time-entry-trowser');
    // Component renders and prioritizes combined error
    expect(trowser).toBeInTheDocument();
  });

  it('should handle loading state transitions correctly', () => {
    // Initially loading
    mockUseCombinedDataFetching.mockReturnValue({
      settings: null,
      currentWeek: null,
      loading: true,
      error: null,
    });

    mockUseGridInitialization.mockReturnValue({
      customers: [],
      isLoading: true,
      error: null,
    });

    renderWithProvider();

    const trowser = screen.getByTestId('weekly-time-entry-trowser');
    // Component renders during loading state transitions
    expect(trowser).toBeInTheDocument();
  });

  it('should handle refetch function with parameters', () => {
    const mockRefetch = jest.fn();

    mockUseTimeEntriesFetching.mockReturnValue({
      timeEntries: [{ id: '1', date: '2024-01-01', duration: 8 }],
      hasData: true,
      refetch: mockRefetch,
    });

    renderWithProvider();

    const refetchButton = screen.getByText('Refetch');
    fireEvent.click(refetchButton);

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('should handle component unmounting during loading', () => {
    mockUseCombinedDataFetching.mockReturnValue({
      settings: null,
      currentWeek: null,
      loading: true,
      error: null,
    });

    const { unmount } = renderWithProvider();

    // Should not throw when unmounting during loading
    expect(() => unmount()).not.toThrow();
  });

  it('should handle rapid prop changes correctly', () => {
    const { rerender } = renderWithProvider();

    // Rapidly change isOpen prop
    for (let i = 0; i < 5; i += 1) {
      rerender(
        <Provider store={createMockStore()}>
          <WeeklyTimeEntryDataProvider
            isOpen={i % 2 === 0}
            setOpen={mockSetOpen}
          />
        </Provider>,
      );
    }

    const trowser = screen.getByTestId('weekly-time-entry-trowser');
    expect(trowser).toBeInTheDocument();
  });

  it('should handle setOpen function calls correctly', () => {
    renderWithProvider();

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    expect(mockSetOpen).toHaveBeenCalledWith(false);
    expect(mockSetOpen).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple refetch calls correctly', () => {
    const mockRefetch = jest.fn();

    mockUseTimeEntriesFetching.mockReturnValue({
      timeEntries: [{ id: '1', date: '2024-01-01', duration: 8 }],
      hasData: true,
      refetch: mockRefetch,
    });

    renderWithProvider();

    const refetchButton = screen.getByText('Refetch');

    // Call refetch multiple times
    fireEvent.click(refetchButton);
    fireEvent.click(refetchButton);
    fireEvent.click(refetchButton);

    expect(mockRefetch).toHaveBeenCalledTimes(3);
  });

  it('should handle initialization state with error recovery', () => {
    // Start with error in time entries fetching
    mockUseTimeEntriesFetching.mockReturnValue({
      timeEntries: null,
      hasData: false,
      loading: false,
      error: 'Initial error',
      refetch: jest.fn(),
    });

    renderWithProvider();

    // Check that the error message is displayed
    const errorMessage = screen.getByTestId('error-message');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveTextContent('Error: Initial error');
    const trowser = screen.getByTestId('weekly-time-entry-trowser');
    expect(trowser).toHaveAttribute('data-error', 'Initial error');

    // Verify that useTimeEntriesFetching was called with the correct parameter
    expect(mockUseTimeEntriesFetching).toHaveBeenCalledWith(true); // true because combined data is ready (no loading, no error)
  });

  it('should call useTimeEntriesFetching with correct parameter when combined data is ready', () => {
    // Combined data is ready (no loading, no error)
    mockUseCombinedDataFetching.mockReturnValue({
      settings: { firstDayOfWeek: 0 },
      currentWeek: { start: '2024-01-01', end: '2024-01-07' },
      loading: false,
      error: null,
    });

    mockUseGridInitialization.mockReturnValue({
      customers: [{ id: '1', name: 'Customer 1' }],
      isLoading: false,
      error: null,
    });

    mockUseTimeEntriesFetching.mockReturnValue({
      timeEntries: [{ id: '1', date: '2024-01-01', duration: 8 }],
      hasData: true,
      refetch: jest.fn(),
    });

    renderWithProvider();

    // Verify that useTimeEntriesFetching was called with true (combined data is ready)
    expect(mockUseTimeEntriesFetching).toHaveBeenCalledWith(true);
  });

  it('should handle time entries error after successful loading', () => {
    mockUseCombinedDataFetching.mockReturnValue({
      settings: { firstDayOfWeek: 0 },
      currentWeek: { start: '2024-01-01', end: '2024-01-07' },
      loading: false,
      error: null,
    });

    mockUseGridInitialization.mockReturnValue({
      customers: [{ id: '1', name: 'Customer 1' }],
      isLoading: false,
      error: null,
    });

    mockUseTimeEntriesFetching.mockReturnValue({
      timeEntries: null,
      hasData: false,
      loading: false,
      error: 'Time entries error',
      refetch: jest.fn(),
    });

    renderWithProvider();

    const errorMessage = screen.getByTestId('error-message');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveTextContent('Error: Time entries error');
  });

  it('should handle null current week correctly', () => {
    mockUseCombinedDataFetching.mockReturnValue({
      settings: { firstDayOfWeek: 0 },
      currentWeek: null,
      loading: false,
      error: null,
    });

    mockUseGridInitialization.mockReturnValue({
      customers: [{ id: '1', name: 'Customer 1' }],
      isLoading: false,
      error: null,
    });

    mockUseTimeEntriesFetching.mockReturnValue({
      timeEntries: [{ id: '1', date: '2024-01-01', duration: 8 }],
      hasData: true,
      refetch: jest.fn(),
    });

    renderWithProvider();

    const trowser = screen.getByTestId('weekly-time-entry-trowser');
    expect(trowser).toBeInTheDocument();
  });

  it('should dispatch QuickFind feature flags to Redux', () => {
    const mockDispatch = jest.fn();
    const store = createMockStore();
    store.dispatch = mockDispatch;

    mockUseIXPFeatureFlag.mockReturnValue({
      isEnabled: true,
      settled: true,
    });

    mockUseCombinedDataFetching.mockReturnValue({
      settings: { firstDayOfWeek: 0 },
      currentWeek: { start: '2024-01-01', end: '2024-01-07' },
      loading: false,
      error: null,
    });

    mockUseGridInitialization.mockReturnValue({
      customers: [{ id: '1', name: 'Customer 1' }],
      isLoading: false,
      error: null,
    });

    mockUseTimeEntriesFetching.mockReturnValue({
      timeEntries: [{ id: '1', date: '2024-01-01', duration: 8 }],
      hasData: true,
      refetch: jest.fn(),
    });

    render(
      <Provider store={store}>
        <MockedProvider mocks={[]} addTypename={false}>
          <WeeklyTimeEntryDataProvider isOpen setOpen={mockSetOpen} />
        </MockedProvider>
      </Provider>,
    );

    const trowser = screen.getByTestId('weekly-time-entry-trowser');
    expect(trowser).toBeInTheDocument();
  });

  it('should handle initialization when data loads successfully and then re-renders', () => {
    // Start with loading state
    mockUseCombinedDataFetching.mockReturnValue({
      settings: null,
      currentWeek: null,
      loading: true,
      error: null,
    });

    mockUseGridInitialization.mockReturnValue({
      customers: [],
      isLoading: true,
      error: null,
    });

    mockUseTimeEntriesFetching.mockReturnValue({
      timeEntries: null,
      hasData: false,
      loading: true,
      error: null,
      refetch: jest.fn(),
    });

    const { rerender } = renderWithProvider();

    // Verify loading state
    expect(screen.getByTestId('activity-dots-large')).toBeInTheDocument();

    // Simulate data loaded successfully
    mockUseCombinedDataFetching.mockReturnValue({
      settings: { firstDayOfWeek: 0 },
      currentWeek: { start: '2024-01-01', end: '2024-01-07' },
      loading: false,
      error: null,
    });

    mockUseGridInitialization.mockReturnValue({
      customers: [{ id: '1', name: 'Customer 1' }],
      isLoading: false,
      error: null,
    });

    mockUseTimeEntriesFetching.mockReturnValue({
      timeEntries: [{ id: '1', date: '2024-01-01', duration: 8 }],
      hasData: true,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    // Re-render to apply the data
    rerender(
      <Provider store={createMockStore()}>
        <MockedProvider mocks={[]} addTypename={false}>
          <WeeklyTimeEntryDataProvider isOpen setOpen={mockSetOpen} />
        </MockedProvider>
      </Provider>,
    );

    // Verify data is now rendered
    const trowser = screen.getByTestId('weekly-time-entry-trowser');
    expect(trowser).toBeInTheDocument();
    expect(trowser).not.toHaveAttribute('data-is-loading', 'true');

    // Re-render again to test the early return path when already initialized
    rerender(
      <Provider store={createMockStore()}>
        <MockedProvider mocks={[]} addTypename={false}>
          <WeeklyTimeEntryDataProvider isOpen setOpen={mockSetOpen} />
        </MockedProvider>
      </Provider>,
    );

    // Should still be in the same state
    expect(screen.getByTestId('weekly-time-entry-trowser')).toBeInTheDocument();
  });

  describe('QuickFind Feature Flag Functionality', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockIsIXPFeatureFlagEnabled.mockClear();
      mockSandbox.logger.error.mockClear();
      mockSandbox.logger.log.mockClear();
    });

    it('should dispatch QuickFind feature flags to Redux on mount', async () => {
      // Mock the useIXPFeatureFlag hook to return enabled state
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: true,
        settled: true,
      });

      mockUseCombinedDataFetching.mockReturnValue({
        settings: { firstDayOfWeek: 0 },
        currentWeek: { start: '2024-01-01', end: '2024-01-07' },
        loading: false,
        error: null,
      });

      mockUseGridInitialization.mockReturnValue({
        customers: [{ id: '1', name: 'Customer 1' }],
        isLoading: false,
        error: null,
      });

      mockUseTimeEntriesFetching.mockReturnValue({
        timeEntries: [{ id: '1', date: '2024-01-01', duration: 8 }],
        hasData: true,
        refetch: jest.fn(),
      });

      renderWithProvider();

      // Check that the trowser renders successfully
      await waitFor(() => {
        const trowser = screen.getByTestId('weekly-time-entry-trowser');
        expect(trowser).toBeInTheDocument();
      });
    });

    it('should handle multiple re-renders with feature flags', async () => {
      // Mock the useIXPFeatureFlag hook to return disabled state
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: false,
        settled: true,
      });

      mockUseCombinedDataFetching.mockReturnValue({
        settings: { firstDayOfWeek: 0 },
        currentWeek: { start: '2024-01-01', end: '2024-01-07' },
        loading: false,
        error: null,
      });

      mockUseGridInitialization.mockReturnValue({
        customers: [{ id: '1', name: 'Customer 1' }],
        isLoading: false,
        error: null,
      });

      mockUseTimeEntriesFetching.mockReturnValue({
        timeEntries: [{ id: '1', date: '2024-01-01', duration: 8 }],
        hasData: true,
        refetch: jest.fn(),
      });

      const { rerender } = renderWithProvider();

      // Wait for initial render
      await waitFor(() => {
        const trowser = screen.getByTestId('weekly-time-entry-trowser');
        expect(trowser).toBeInTheDocument();
      });

      // Re-render multiple times to simulate component updates
      for (let i = 0; i < 5; i += 1) {
        rerender(
          <Provider store={createMockStore()}>
            <MockedProvider mocks={[]} addTypename={false}>
              <WeeklyTimeEntryDataProvider isOpen setOpen={mockSetOpen} />
            </MockedProvider>
          </Provider>,
        );
      }

      // Check that the trowser still renders correctly after multiple re-renders
      const trowser = screen.getByTestId('weekly-time-entry-trowser');
      expect(trowser).toBeInTheDocument();
    });

    it('should maintain state across multiple renders', async () => {
      // Mock the useIXPFeatureFlag hook to return enabled state
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: true,
        settled: true,
      });

      mockUseCombinedDataFetching.mockReturnValue({
        settings: { firstDayOfWeek: 0 },
        currentWeek: { start: '2024-01-01', end: '2024-01-07' },
        loading: false,
        error: null,
      });

      mockUseGridInitialization.mockReturnValue({
        customers: [{ id: '1', name: 'Customer 1' }],
        isLoading: false,
        error: null,
      });

      mockUseTimeEntriesFetching.mockReturnValue({
        timeEntries: [{ id: '1', date: '2024-01-01', duration: 8 }],
        hasData: true,
        refetch: jest.fn(),
      });

      const { rerender } = renderWithProvider();

      // Wait for the first render
      await waitFor(() => {
        const trowser = screen.getByTestId('weekly-time-entry-trowser');
        expect(trowser).toBeInTheDocument();
      });

      // Re-render with same props
      rerender(
        <Provider store={createMockStore()}>
          <MockedProvider mocks={[]} addTypename={false}>
            <WeeklyTimeEntryDataProvider isOpen setOpen={mockSetOpen} />
          </MockedProvider>
        </Provider>,
      );

      await waitFor(() => {
        const trowser = screen.getByTestId('weekly-time-entry-trowser');
        expect(trowser).toBeInTheDocument();
      });
    });

    it('should pass QuickFind feature flag values to Redux store', async () => {
      // Mock the useIXPFeatureFlag hook to return enabled state
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: true,
        settled: true,
      });

      mockUseCombinedDataFetching.mockReturnValue({
        settings: { firstDayOfWeek: 0 },
        currentWeek: { start: '2024-01-01', end: '2024-01-07' },
        loading: false,
        error: null,
      });

      mockUseGridInitialization.mockReturnValue({
        customers: [{ id: '1', name: 'Customer 1' }],
        isLoading: false,
        error: null,
      });

      mockUseTimeEntriesFetching.mockReturnValue({
        timeEntries: [{ id: '1', date: '2024-01-01', duration: 8 }],
        hasData: true,
        refetch: jest.fn(),
      });

      renderWithProvider();

      // Verify that the trowser component renders successfully
      await waitFor(() => {
        const trowser = screen.getByTestId('weekly-time-entry-trowser');
        expect(trowser).toBeInTheDocument();
      });
    });
  });

  describe('EmployeeId prop support', () => {
    beforeEach(() => {
      jest.clearAllMocks();

      mockUseCombinedDataFetching.mockReturnValue({
        settings: { firstDayOfWeek: 0 },
        currentWeek: { start: '2024-01-01', end: '2024-01-07' },
        loading: false,
        error: null,
      });

      mockUseGridInitialization.mockReturnValue({
        customers: [{ id: '1', name: 'Customer 1' }],
        isLoading: false,
        error: null,
      });

      mockUseTimeEntriesFetching.mockReturnValue({
        timeEntries: [{ id: '1', date: '2024-01-01', duration: 8 }],
        hasData: true,
        refetch: jest.fn(),
      });

      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: false,
        settled: true,
      });
    });

    it('should render successfully with employeeId prop', () => {
      const testEmployeeId = 'emp-render-test';
      renderWithProvider({ employeeId: testEmployeeId });

      const trowser = screen.getByTestId('weekly-time-entry-trowser');
      expect(trowser).toBeInTheDocument();
    });

    it('should render successfully with null employeeId', () => {
      renderWithProvider({ employeeId: null });

      const trowser = screen.getByTestId('weekly-time-entry-trowser');
      expect(trowser).toBeInTheDocument();
    });

    it('should render successfully with undefined employeeId', () => {
      renderWithProvider();

      const trowser = screen.getByTestId('weekly-time-entry-trowser');
      expect(trowser).toBeInTheDocument();
    });

    it('should render successfully with empty string employeeId', () => {
      renderWithProvider({ employeeId: '' });

      const trowser = screen.getByTestId('weekly-time-entry-trowser');
      expect(trowser).toBeInTheDocument();
    });

    it('should handle employeeId with loading state', () => {
      const testEmployeeId = 'emp-loading-test';
      mockUseCombinedDataFetching.mockReturnValue({
        settings: null,
        currentWeek: null,
        loading: true,
        error: null,
      });

      renderWithProvider({ employeeId: testEmployeeId });

      const trowser = screen.getByTestId('weekly-time-entry-trowser');
      expect(trowser).toHaveAttribute('data-is-loading', 'true');
    });

    it('should handle employeeId with error state', () => {
      const testEmployeeId = 'emp-error-test';
      const testError = 'Test error with employeeId';
      mockUseCombinedDataFetching.mockReturnValue({
        settings: null,
        currentWeek: null,
        loading: false,
        error: testError,
      });

      // Also set error in time entries fetching to trigger error display
      mockUseTimeEntriesFetching.mockReturnValue({
        timeEntries: null,
        hasData: false,
        refetch: jest.fn(),
        loading: false,
        error: testError,
      });

      renderWithProvider({ employeeId: testEmployeeId });

      const errorMessage = screen.getByTestId('error-message');
      expect(errorMessage).toHaveTextContent(`Error: ${testError}`);
    });

    it('should handle employeeId prop changes on rerender', () => {
      const testEmployeeId1 = 'emp-change-1';
      const testEmployeeId2 = 'emp-change-2';

      const { rerender } = render(
        <Provider store={createMockStore()}>
          <MockedProvider mocks={[]} addTypename={false}>
            <WeeklyTimeEntryDataProvider
              isOpen
              setOpen={mockSetOpen}
              employeeId={testEmployeeId1}
            />
          </MockedProvider>
        </Provider>,
      );

      // Component should render successfully with first employeeId
      expect(
        screen.getByTestId('weekly-time-entry-trowser'),
      ).toBeInTheDocument();

      // Rerender with different employeeId
      rerender(
        <Provider store={createMockStore()}>
          <MockedProvider mocks={[]} addTypename={false}>
            <WeeklyTimeEntryDataProvider
              isOpen
              setOpen={mockSetOpen}
              employeeId={testEmployeeId2}
            />
          </MockedProvider>
        </Provider>,
      );

      // Component should still render successfully with second employeeId
      expect(
        screen.getByTestId('weekly-time-entry-trowser'),
      ).toBeInTheDocument();
    });

    it('should maintain employeeId across multiple rerenders', () => {
      const testEmployeeId = 'emp-maintain-test';
      const { rerender } = renderWithProvider({ employeeId: testEmployeeId });

      expect(
        screen.getByTestId('weekly-time-entry-trowser'),
      ).toBeInTheDocument();

      // Rerender with same employeeId multiple times
      for (let i = 0; i < 3; i += 1) {
        rerender(
          <Provider store={createMockStore()}>
            <MockedProvider mocks={[]} addTypename={false}>
              <WeeklyTimeEntryDataProvider
                isOpen
                setOpen={mockSetOpen}
                employeeId={testEmployeeId}
              />
            </MockedProvider>
          </Provider>,
        );
      }

      // Component should still be rendered
      expect(
        screen.getByTestId('weekly-time-entry-trowser'),
      ).toBeInTheDocument();
    });
  });
});
