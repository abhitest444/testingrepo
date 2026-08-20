import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useTeamBillableDetailsFetching } from 'src/js/widgets/weeklyTimeEntry/hooks/useTeamBillableDetailsFetching';
import timeEntryGridReducer from 'src/js/widgets/weeklyTimeEntry/store/timeEntryGridSlice';
import { TimeForType } from 'src/js/widgets/weeklyTimeEntry/types';

// Mock the dependencies
jest.mock('src/js/service/hooks/vendor/useLazyGetVendorData');
jest.mock('src/__generated__/oigql/graphql', () => ({
  useGetEmployeeJobCostingLazyQuery: jest.fn(),
}));

const mockUseLazyGetVendorData =
  require('src/js/service/hooks/vendor/useLazyGetVendorData').useLazyGetVendorData;
const mockUseGetEmployeeJobCostingLazyQuery =
  require('src/__generated__/oigql/graphql').useGetEmployeeJobCostingLazyQuery;

const createTestStore = (initialState = {}) =>
  configureStore({
    reducer: {
      timeEntryGrid: timeEntryGridReducer,
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

describe('useTeamBillableDetailsFetching', () => {
  let store: any;
  let mockFetchJobCosting: jest.Mock;
  let mockGetVendorData: jest.Mock;
  let mockJobCostingResult: any;
  let mockVendorResult: any;

  beforeEach(() => {
    store = createTestStore({
      timeEntryGrid: {
        teamMember: null,
        selected: null,
        dateRange: { startDate: '2024-01-01', endDate: '2024-01-07' },
        weeklyTimeEntries: {},
        rowOrder: [],
        loading: false,
        error: null,
        showSelectTeamMemberTooltip: false,
        isTeamMemberDropdownReady: false,
        firstEditedCells: {},
      },
    });

    // Reset mocks
    jest.clearAllMocks();

    // Setup default mock results
    mockJobCostingResult = {
      loading: false,
      error: null,
      data: null,
    };

    mockVendorResult = {
      loading: false,
      data: null,
      error: null,
    };

    mockFetchJobCosting = jest.fn();
    mockGetVendorData = jest.fn();

    mockUseGetEmployeeJobCostingLazyQuery.mockReturnValue([
      mockFetchJobCosting,
      mockJobCostingResult,
    ]);

    mockUseLazyGetVendorData.mockReturnValue({
      getVendorCallback: mockGetVendorData,
      loading: false,
      data: null,
      error: null,
    });
  });

  describe('Initial state', () => {
    it('should return initial state when no team member is selected', () => {
      const { result } = renderHook(() => useTeamBillableDetailsFetching(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      expect(result.current).toEqual({
        fetchTeamBillableDetails: expect.any(Function),
        isLoading: false,
        data: {
          billable: false,
          billableRate: 0,
        },
        error: null,
      });
    });

    it('should return initial state when team member has no id', () => {
      store = createTestStore({
        timeEntryGrid: {
          ...store.getState().timeEntryGrid,
          teamMember: { id: null, type: TimeForType.EMPLOYEE },
        },
      });

      const { result } = renderHook(() => useTeamBillableDetailsFetching(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      expect(result.current.data).toEqual({
        billable: false,
        billableRate: 0,
      });
    });
  });

  describe('Employee scenarios', () => {
    beforeEach(() => {
      store = createTestStore({
        timeEntryGrid: {
          ...store.getState().timeEntryGrid,
          teamMember: { id: 'emp123', type: TimeForType.EMPLOYEE },
        },
      });
    });

    it('should fetch job costing data for employee', () => {
      const { result } = renderHook(() => useTeamBillableDetailsFetching(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      act(() => {
        result.current.fetchTeamBillableDetails();
      });

      expect(mockFetchJobCosting).toHaveBeenCalledWith({
        variables: {
          employeeId: 'emp123',
        },
      });
    });

    it('should return employee billable details when job costing data is available', () => {
      mockJobCostingResult.data = {
        workerManagementEmployeeJobCosting: {
          billable: true,
          billRate: { value: 25.5 },
        },
      };

      mockUseGetEmployeeJobCostingLazyQuery.mockReturnValue([
        mockFetchJobCosting,
        mockJobCostingResult,
      ]);

      const { result } = renderHook(() => useTeamBillableDetailsFetching(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      expect(result.current.data).toEqual({
        billable: true,
        billableRate: 25.5,
      });
    });

    it('should handle employee data with null billRate', () => {
      mockJobCostingResult.data = {
        workerManagementEmployeeJobCosting: {
          billable: false,
          billRate: null,
        },
      };

      mockUseGetEmployeeJobCostingLazyQuery.mockReturnValue([
        mockFetchJobCosting,
        mockJobCostingResult,
      ]);

      const { result } = renderHook(() => useTeamBillableDetailsFetching(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      expect(result.current.data).toEqual({
        billable: false,
        billableRate: 0,
      });
    });

    it('should handle employee data with undefined billRate', () => {
      mockJobCostingResult.data = {
        workerManagementEmployeeJobCosting: {
          billable: true,
          billRate: undefined,
        },
      };

      mockUseGetEmployeeJobCostingLazyQuery.mockReturnValue([
        mockFetchJobCosting,
        mockJobCostingResult,
      ]);

      const { result } = renderHook(() => useTeamBillableDetailsFetching(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      expect(result.current.data).toEqual({
        billable: true,
        billableRate: 0,
      });
    });

    it('should handle employee data with NaN billRate', () => {
      mockJobCostingResult.data = {
        workerManagementEmployeeJobCosting: {
          billable: true,
          billRate: { value: NaN },
        },
      };

      mockUseGetEmployeeJobCostingLazyQuery.mockReturnValue([
        mockFetchJobCosting,
        mockJobCostingResult,
      ]);

      const { result } = renderHook(() => useTeamBillableDetailsFetching(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      expect(result.current.data).toEqual({
        billable: true,
        billableRate: 0,
      });
    });

    it('should return loading state for employee', () => {
      mockJobCostingResult.loading = true;

      mockUseGetEmployeeJobCostingLazyQuery.mockReturnValue([
        mockFetchJobCosting,
        mockJobCostingResult,
      ]);

      const { result } = renderHook(() => useTeamBillableDetailsFetching(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should return error state for employee', () => {
      const mockError = new Error('Job costing fetch failed');
      mockJobCostingResult.error = mockError;

      mockUseGetEmployeeJobCostingLazyQuery.mockReturnValue([
        mockFetchJobCosting,
        mockJobCostingResult,
      ]);

      const { result } = renderHook(() => useTeamBillableDetailsFetching(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      expect(result.current.error).toBe(mockError);
    });

    it('should not fetch data when employee id is null', () => {
      store = createTestStore({
        timeEntryGrid: {
          ...store.getState().timeEntryGrid,
          teamMember: { id: null, type: TimeForType.EMPLOYEE },
        },
      });

      const { result } = renderHook(() => useTeamBillableDetailsFetching(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      act(() => {
        result.current.fetchTeamBillableDetails();
      });

      expect(mockFetchJobCosting).not.toHaveBeenCalled();
    });
  });

  describe('Vendor scenarios', () => {
    beforeEach(() => {
      store = createTestStore({
        timeEntryGrid: {
          ...store.getState().timeEntryGrid,
          teamMember: { id: 'vendor123', type: TimeForType.VENDOR },
        },
      });
    });

    it('should fetch vendor data for vendor', () => {
      const { result } = renderHook(() => useTeamBillableDetailsFetching(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      act(() => {
        result.current.fetchTeamBillableDetails();
      });

      expect(mockGetVendorData).toHaveBeenCalledWith('vendor123');
    });

    it('should return vendor billable details when vendor data is available', () => {
      mockVendorResult.data = {
        Vendor: {
          BillRate: 30.75,
        },
      };

      mockUseLazyGetVendorData.mockReturnValue({
        getVendorCallback: mockGetVendorData,
        loading: false,
        data: mockVendorResult.data,
        error: null,
      });

      const { result } = renderHook(() => useTeamBillableDetailsFetching(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      expect(result.current.data).toEqual({
        billable: true,
        billableRate: 30.75,
      });
    });

    it('should handle vendor data with undefined BillRate', () => {
      mockVendorResult.data = {
        Vendor: {
          BillRate: undefined,
        },
      };

      mockUseLazyGetVendorData.mockReturnValue({
        getVendorCallback: mockGetVendorData,
        loading: false,
        data: mockVendorResult.data,
        error: null,
      });

      const { result } = renderHook(() => useTeamBillableDetailsFetching(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      expect(result.current.data).toEqual({
        billable: false,
        billableRate: 0,
      });
    });

    it('should handle vendor data with NaN BillRate', () => {
      mockVendorResult.data = {
        Vendor: {
          BillRate: NaN,
        },
      };

      mockUseLazyGetVendorData.mockReturnValue({
        getVendorCallback: mockGetVendorData,
        loading: false,
        data: mockVendorResult.data,
        error: null,
      });

      const { result } = renderHook(() => useTeamBillableDetailsFetching(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      expect(result.current.data).toEqual({
        billable: false,
        billableRate: 0,
      });
    });

    it('should return loading state for vendor', () => {
      mockUseLazyGetVendorData.mockReturnValue({
        getVendorCallback: mockGetVendorData,
        loading: true,
        data: null,
        error: null,
      });

      const { result } = renderHook(() => useTeamBillableDetailsFetching(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should return error state for vendor', () => {
      const mockError = new Error('Vendor fetch failed');
      mockUseLazyGetVendorData.mockReturnValue({
        getVendorCallback: mockGetVendorData,
        loading: false,
        data: null,
        error: mockError,
      });

      const { result } = renderHook(() => useTeamBillableDetailsFetching(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      expect(result.current.error).toBe(mockError);
    });

    it('should not fetch data when vendor id is null', () => {
      store = createTestStore({
        timeEntryGrid: {
          ...store.getState().timeEntryGrid,
          teamMember: { id: null, type: TimeForType.VENDOR },
        },
      });

      const { result } = renderHook(() => useTeamBillableDetailsFetching(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      act(() => {
        result.current.fetchTeamBillableDetails();
      });

      expect(mockGetVendorData).not.toHaveBeenCalled();
    });
  });

  describe('Combined loading states', () => {
    it('should return true when job costing is loading', () => {
      store = createTestStore({
        timeEntryGrid: {
          ...store.getState().timeEntryGrid,
          teamMember: { id: 'emp123', type: TimeForType.EMPLOYEE },
        },
      });

      mockJobCostingResult.loading = true;
      mockUseGetEmployeeJobCostingLazyQuery.mockReturnValue([
        mockFetchJobCosting,
        mockJobCostingResult,
      ]);

      const { result } = renderHook(() => useTeamBillableDetailsFetching(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should return true when vendor is loading', () => {
      store = createTestStore({
        timeEntryGrid: {
          ...store.getState().timeEntryGrid,
          teamMember: { id: 'vendor123', type: TimeForType.VENDOR },
        },
      });

      mockUseLazyGetVendorData.mockReturnValue({
        getVendorCallback: mockGetVendorData,
        loading: true,
        data: null,
        error: null,
      });

      const { result } = renderHook(() => useTeamBillableDetailsFetching(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should return false when neither is loading', () => {
      store = createTestStore({
        timeEntryGrid: {
          ...store.getState().timeEntryGrid,
          teamMember: { id: 'emp123', type: TimeForType.EMPLOYEE },
        },
      });

      mockJobCostingResult.loading = false;
      mockUseGetEmployeeJobCostingLazyQuery.mockReturnValue([
        mockFetchJobCosting,
        mockJobCostingResult,
      ]);

      const { result } = renderHook(() => useTeamBillableDetailsFetching(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should return job costing error for employee', () => {
      store = createTestStore({
        timeEntryGrid: {
          ...store.getState().timeEntryGrid,
          teamMember: { id: 'emp123', type: TimeForType.EMPLOYEE },
        },
      });

      const mockError = new Error('Job costing error');
      mockJobCostingResult.error = mockError;
      mockUseGetEmployeeJobCostingLazyQuery.mockReturnValue([
        mockFetchJobCosting,
        mockJobCostingResult,
      ]);

      const { result } = renderHook(() => useTeamBillableDetailsFetching(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      expect(result.current.error).toBe(mockError);
    });

    it('should return vendor error for vendor', () => {
      store = createTestStore({
        timeEntryGrid: {
          ...store.getState().timeEntryGrid,
          teamMember: { id: 'vendor123', type: TimeForType.VENDOR },
        },
      });

      const mockError = new Error('Vendor error');
      mockUseLazyGetVendorData.mockReturnValue({
        getVendorCallback: mockGetVendorData,
        loading: false,
        data: null,
        error: mockError,
      });

      const { result } = renderHook(() => useTeamBillableDetailsFetching(), {
        wrapper: ({ children }) => (
          <TestWrapper store={store}>{children}</TestWrapper>
        ),
      });

      expect(result.current.error).toBe(mockError);
    });
  });

  describe('Data memoization', () => {
    it('should memoize data and only update when dependencies change', () => {
      store = createTestStore({
        timeEntryGrid: {
          ...store.getState().timeEntryGrid,
          teamMember: { id: 'emp123', type: TimeForType.EMPLOYEE },
        },
      });

      mockJobCostingResult.data = {
        workerManagementEmployeeJobCosting: {
          billable: true,
          billRate: { value: 25.5 },
        },
      };

      mockUseGetEmployeeJobCostingLazyQuery.mockReturnValue([
        mockFetchJobCosting,
        mockJobCostingResult,
      ]);

      const { result, rerender } = renderHook(
        () => useTeamBillableDetailsFetching(),
        {
          wrapper: ({ children }) => (
            <TestWrapper store={store}>{children}</TestWrapper>
          ),
        },
      );

      const firstData = result.current.data;

      // Rerender without changing data
      rerender();

      expect(result.current.data).toBe(firstData);

      // Change the data
      mockJobCostingResult.data = {
        workerManagementEmployeeJobCosting: {
          billable: false,
          billRate: { value: 30.0 },
        },
      };

      rerender();

      expect(result.current.data).not.toBe(firstData);
      expect(result.current.data).toEqual({
        billable: false,
        billableRate: 30.0,
      });
    });
  });

  describe('Callback memoization', () => {
    it('should memoize fetchTeamBillableDetails callback', () => {
      store = createTestStore({
        timeEntryGrid: {
          ...store.getState().timeEntryGrid,
          teamMember: { id: 'emp123', type: TimeForType.EMPLOYEE },
        },
      });

      const { result, rerender } = renderHook(
        () => useTeamBillableDetailsFetching(),
        {
          wrapper: ({ children }) => (
            <TestWrapper store={store}>{children}</TestWrapper>
          ),
        },
      );

      const firstCallback = result.current.fetchTeamBillableDetails;

      // Rerender without changing dependencies
      rerender();

      expect(result.current.fetchTeamBillableDetails).toBe(firstCallback);

      // Change team member
      store = createTestStore({
        timeEntryGrid: {
          ...store.getState().timeEntryGrid,
          teamMember: { id: 'emp456', type: TimeForType.EMPLOYEE },
        },
      });

      rerender();

      expect(result.current.fetchTeamBillableDetails).not.toBe(firstCallback);
    });
  });
});
