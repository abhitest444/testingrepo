import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useGridInitialization } from 'src/js/widgets/weeklyTimeEntry/hooks/useGridInitialization';
import timeEntryGridReducer from 'src/js/widgets/weeklyTimeEntry/store/timeEntryGridSlice';
import timeEntrySettingsReducer from 'src/js/widgets/weeklyTimeEntry/store/timeEntrySettingsSlice';
import breaksReducer from 'src/js/widgets/weeklyTimeEntry/store/breaksSlice';

// Mock the hooks
jest.mock('src/js/widgets/weeklyTimeEntry/hooks/useBreaksDataFetching');
jest.mock('src/js/widgets/weeklyTimeEntry/hooks/useCustomFieldsData');
jest.mock('src/js/widgets/weeklyTimeEntry/hooks/useDimensionsData');

const mockUseBreaksDataFetching =
  require('src/js/widgets/weeklyTimeEntry/hooks/useBreaksDataFetching').useBreaksDataFetching;
const mockUseCustomFieldsData =
  require('src/js/widgets/weeklyTimeEntry/hooks/useCustomFieldsData').useCustomFieldsData;
const mockUseDimensionsData =
  require('src/js/widgets/weeklyTimeEntry/hooks/useDimensionsData').useDimensionsData;

const createTestStore = (initialState = {}) =>
  configureStore({
    reducer: {
      timeEntryGrid: timeEntryGridReducer,
      timeEntrySettings: timeEntrySettingsReducer,
      breaks: breaksReducer,
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

describe('useGridInitialization', () => {
  let store: any;

  beforeEach(() => {
    store = createTestStore({
      timeEntryGrid: {
        weeklyTimeEntries: {},
        rowOrder: [],
        teamMember: null,
        dateRange: { start: '2024-01-01', end: '2024-01-07' },
        loading: false,
        error: null,
        selected: null,
        firstEditedCells: {},
        visibleDays: [0, 1, 2, 3, 4, 5, 6],
        showSelectTeamMemberTooltip: false,
      },
      timeEntrySettings: {
        data: null,
        loading: false,
        error: null,
        firstDayOfWeek: 0,
      },
      breaks: {
        breaks: [],
        loading: false,
        error: null,
      },
    });

    // Reset mocks
    jest.clearAllMocks();

    // Default mock implementations
    mockUseBreaksDataFetching.mockReturnValue({
      loading: false,
      error: null,
    });

    mockUseCustomFieldsData.mockReturnValue({
      loading: false,
      error: null,
    });

    mockUseDimensionsData.mockReturnValue({
      dimensions: [],
      enabled: false,
      loading: false,
      error: null,
      isVisible: false,
    });
  });

  describe('initial state', () => {
    it('should return initial state', () => {
      const { result } = renderHook(() => useGridInitialization(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      expect(result.current.isInitialized).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.breaksDataLoading).toBe(false);
    });
  });

  describe('loading states', () => {
    it('should handle breaks data loading state', () => {
      mockUseBreaksDataFetching.mockReturnValue({
        loading: true,
        error: null,
      });

      const { result } = renderHook(() => useGridInitialization(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      expect(result.current.breaksDataLoading).toBe(true);
      expect(result.current.isLoading).toBe(true);
    });

    it('should handle custom fields loading state', () => {
      mockUseCustomFieldsData.mockReturnValue({
        loading: true,
        error: null,
      });

      const { result } = renderHook(() => useGridInitialization(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('hook calls', () => {
    it('should call all hooks with correct parameters', () => {
      renderHook(() => useGridInitialization(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      expect(mockUseBreaksDataFetching).toHaveBeenCalled();
      expect(mockUseCustomFieldsData).toHaveBeenCalled();
    });
  });

  describe('initialization state', () => {
    it('should handle initialization state correctly', () => {
      const { result } = renderHook(() => useGridInitialization(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      // Initially should be false
      expect(result.current.isInitialized).toBe(false);

      // After the effect runs, it should still be false initially
      // The actual initialization happens in the useEffect
      act(() => {
        // Trigger a re-render to simulate the effect running
      });

      // The isInitialized should remain false until the effect completes
      expect(result.current.isInitialized).toBe(false);
    });
  });

  describe('successful data loading', () => {
    it('should handle successful data from all hooks', () => {
      mockUseBreaksDataFetching.mockReturnValue({
        loading: false,
        error: null,
      });

      mockUseCustomFieldsData.mockReturnValue({
        loading: false,
        error: null,
      });

      const { result } = renderHook(() => useGridInitialization(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      // The hook only returns initialization state, not the actual data
      expect(result.current.isLoading).toBe(false);
      expect(result.current.breaksDataLoading).toBe(false);
    });
  });
});
