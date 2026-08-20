import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useBreaksDataFetching } from 'src/js/widgets/weeklyTimeEntry/hooks/useBreaksDataFetching';
import breaksReducer from 'src/js/widgets/weeklyTimeEntry/store/breaksSlice';

// Mock the dependencies
jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn(() => ({
    featureFlags: {
      isFeatureEnabled: jest.fn(() => true),
    },
    logger: {
      error: jest.fn(),
      info: jest.fn(),
    },
  })),
}));

jest.mock('src/__generated__/oigql/graphql', () => ({
  useGetEmployerBreaksByAssigneeLazyQuery: jest.fn(),
}));

jest.mock('src/js/common/CustomerInteraction', () => ({
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn(() => ({})),
  TimeCustomerInteraction: {
    BREAK_RULE_READ: 'BREAK_RULE_READ',
  },
}));

// Mock Redux selectors
jest.mock('src/js/widgets/weeklyTimeEntry/store/selectors', () => ({
  selectTeamMember: jest.fn(),
}));

const mockUseGetEmployerBreaksByAssigneeLazyQuery =
  require('src/__generated__/oigql/graphql').useGetEmployerBreaksByAssigneeLazyQuery;
const mockSelectTeamMember =
  require('src/js/widgets/weeklyTimeEntry/store/selectors').selectTeamMember;
const mockCreateCustomerInteraction =
  require('src/js/common/CustomerInteraction').createCustomerInteraction;
const mockEndInteractionWithSuccess =
  require('src/js/common/CustomerInteraction').endInteractionWithSuccess;
const mockEndInteractionWithFailure =
  require('src/js/common/CustomerInteraction').endInteractionWithFailure;
const mockGetCustomerInteractionPropagationHeaders =
  require('src/js/common/CustomerInteraction').getCustomerInteractionPropagationHeaders;

const createTestStore = (initialState = {}) =>
  configureStore({
    reducer: {
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

describe('useBreaksDataFetching', () => {
  let store: any;
  let mockGetBreaks: jest.Mock;
  let mockQueryResult: any;

  beforeEach(() => {
    store = createTestStore({
      breaks: {
        breaks: [],
        loading: false,
        error: null,
      },
    });

    // Reset mocks
    jest.clearAllMocks();

    // Setup default mock for selectTeamMember to return undefined (empty nameId)
    mockSelectTeamMember.mockReturnValue(undefined);

    // Setup default mock query result
    mockQueryResult = {
      loading: false,
      error: null,
    };

    mockGetBreaks = jest.fn();

    mockUseGetEmployerBreaksByAssigneeLazyQuery.mockReturnValue([
      mockGetBreaks,
      mockQueryResult,
    ]);
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useBreaksDataFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should call getBreaks on mount', () => {
    renderHook(() => useBreaksDataFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    expect(mockGetBreaks).toHaveBeenCalledWith({
      context: {
        clientName: 1, // ApolloClientNames.OIGQL enum value
        headers: {},
      },
      variables: {
        filter: {
          assigneeId: '',
        },
      },
    });
  });

  it('should create customer interaction on mount', () => {
    renderHook(() => useBreaksDataFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    expect(mockCreateCustomerInteraction).toHaveBeenCalledWith(
      expect.any(Object),
      'BREAK_RULE_READ',
    );
  });

  it('should set loading state when fetching starts', () => {
    mockQueryResult.loading = true;

    const { result } = renderHook(() => useBreaksDataFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    expect(result.current.loading).toBe(true);
  });

  it('should handle successful data fetch and filter breaks correctly', async () => {
    const mockBreaksData = {
      data: {
        payrollEmployerBreaksByAssigneeId: {
          nodes: [
            {
              id: 'break1',
              breakName: 'Lunch Break',
              isActive: true,
              breakType: 'LUNCH',
              allowManual: true,
              allowAuto: false,
              noSetDuration: false,
              breakDuration: 30,
              durationUnit: 'MINUTES',
              isDeleted: false,
              isDefaultPolicy: true,
              activeBreakAssignmentCount: 5,
              manualRule: 'Manual rule',
              autoRule: null,
            },
            {
              id: 'break2',
              breakName: 'Coffee Break',
              isActive: true,
              breakType: 'COFFEE',
              allowManual: false,
              allowAuto: true,
              noSetDuration: true,
              breakDuration: 15,
              durationUnit: 'MINUTES',
              isDeleted: false,
              isDefaultPolicy: false,
              activeBreakAssignmentCount: 3,
              manualRule: null,
              autoRule: 'Auto coffee rule',
            },
            {
              id: 'break3',
              breakName: 'Inactive Break',
              isActive: false,
              breakType: 'PAID',
              allowManual: true,
              allowAuto: false,
              noSetDuration: false,
              breakDuration: 10,
              durationUnit: 'MINUTES',
              isDeleted: false,
              isDefaultPolicy: false,
              activeBreakAssignmentCount: 0,
              manualRule: null,
              autoRule: null,
            },
            {
              id: 'break4',
              breakName: 'Auto Break',
              isActive: true,
              breakType: 'PAID',
              allowManual: true,
              allowAuto: true,
              noSetDuration: false,
              breakDuration: 20,
              durationUnit: 'MINUTES',
              isDeleted: false,
              isDefaultPolicy: false,
              activeBreakAssignmentCount: 2,
              manualRule: null,
              autoRule: 'Auto rule',
            },
          ],
        },
      },
    };

    mockGetBreaks.mockResolvedValue(mockBreaksData);

    const { result } = renderHook(() => useBreaksDataFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    // Wait for the async operation to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockEndInteractionWithSuccess).toHaveBeenCalledWith(
      expect.any(Object),
      'BREAK_RULE_READ',
    );

    // Check that the store was updated with only the filtered data
    const state = store.getState();
    expect(state.breaks.breaks).toHaveLength(2);
    expect(state.breaks.breaks[0]).toEqual({
      id: 'break1',
      breakName: 'Lunch Break',
      isActive: true,
      breakType: 'LUNCH',
      allowManual: true,
      allowAuto: false,
      noSetDuration: false,
      breakDuration: 30,
      durationUnit: 'MINUTES',
      isDeleted: false,
      isDefaultPolicy: true,
      activeBreakAssignmentCount: 5,
      manualRule: 'Manual rule',
      autoRule: null,
    });
  });

  it('should handle empty data response', async () => {
    const mockEmptyData = {
      data: {
        payrollEmployerBreaksByAssigneeId: {
          nodes: [],
        },
      },
    };

    mockGetBreaks.mockResolvedValue(mockEmptyData);

    const { result } = renderHook(() => useBreaksDataFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockEndInteractionWithSuccess).toHaveBeenCalledWith(
      expect.any(Object),
      'BREAK_RULE_READ',
    );

    const state = store.getState();
    expect(state.breaks.breaks).toHaveLength(0);
  });

  it('should handle data with no breaks matching filter criteria', async () => {
    const mockBreaksData = {
      data: {
        payrollEmployerBreaksByAssigneeId: {
          nodes: [
            // All breaks should be filtered out
            {
              id: 'break1',
              breakName: 'Auto Only Break',
              isActive: true,
              breakType: 'PAID',
              allowManual: false,
              allowAuto: true,
              noSetDuration: false,
              breakDuration: 15,
              durationUnit: 'MINUTES',
              isDeleted: false,
              isDefaultPolicy: true,
              activeBreakAssignmentCount: 2,
              manualRule: null,
              autoRule: { someRule: true },
            },
            {
              id: 'break2',
              breakName: 'Inactive Break',
              isActive: false,
              breakType: 'PAID',
              allowManual: true,
              allowAuto: false,
              noSetDuration: false,
              breakDuration: 10,
              durationUnit: 'MINUTES',
              isDeleted: false,
              isDefaultPolicy: false,
              activeBreakAssignmentCount: 1,
              manualRule: null,
              autoRule: null,
            },
          ],
        },
      },
    };

    mockGetBreaks.mockResolvedValue(mockBreaksData);

    const { result } = renderHook(() => useBreaksDataFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockEndInteractionWithSuccess).toHaveBeenCalledWith(
      expect.any(Object),
      'BREAK_RULE_READ',
    );

    const state = store.getState();
    // Should return empty array since no breaks match the filter criteria
    expect(state.breaks.breaks).toHaveLength(0);
  });

  it('should handle null data response', async () => {
    const mockNullData = {
      data: null,
    };

    mockGetBreaks.mockResolvedValue(mockNullData);

    const { result } = renderHook(() => useBreaksDataFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // When data is null, the success callback should NOT be called
    // because the condition result.data?.payrollEmployerBreaksByAssigneeId?.nodes is falsy
    expect(mockEndInteractionWithSuccess).not.toHaveBeenCalled();

    const state = store.getState();
    expect(state.breaks.breaks).toHaveLength(0);
  });

  it('should handle network error', async () => {
    const mockError = new Error('Network error');
    mockGetBreaks.mockRejectedValue(mockError);

    const { result } = renderHook(() => useBreaksDataFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockEndInteractionWithFailure).toHaveBeenCalledWith(
      expect.any(Object),
      'BREAK_RULE_READ',
      'Network error',
    );

    const state = store.getState();
    expect(state.breaks.error).toBe('Network error');
  });

  it('should handle error with no message', async () => {
    const mockError = new Error();
    mockGetBreaks.mockRejectedValue(mockError);

    const { result } = renderHook(() => useBreaksDataFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockEndInteractionWithFailure).toHaveBeenCalledWith(
      expect.any(Object),
      'BREAK_RULE_READ',
      'Failed to load breaks',
    );

    const state = store.getState();
    expect(state.breaks.error).toBe('Failed to load breaks');
  });

  it('should handle non-Error objects', async () => {
    const mockError = { status: 500, message: 'Server error' };
    mockGetBreaks.mockRejectedValue(mockError);

    const { result } = renderHook(() => useBreaksDataFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockEndInteractionWithFailure).toHaveBeenCalledWith(
      expect.any(Object),
      'BREAK_RULE_READ',
      'Server error',
    );

    const state = store.getState();
    expect(state.breaks.error).toBe('Server error');
  });

  it('should set loading to false after successful fetch', async () => {
    const mockBreaksData = {
      data: {
        payrollEmployerBreaksByAssigneeId: {
          nodes: [
            {
              id: 'break1',
              breakName: 'Lunch Break',
              isActive: true,
              breakType: 'LUNCH',
              allowManual: true,
              allowAuto: false,
              noSetDuration: false,
              breakDuration: 30,
              durationUnit: 'MINUTES',
              isDeleted: false,
              isDefaultPolicy: true,
              activeBreakAssignmentCount: 5,
              manualRule: 'Manual rule',
              autoRule: null,
            },
          ],
        },
      },
    };

    mockGetBreaks.mockResolvedValue(mockBreaksData);

    const { result } = renderHook(() => useBreaksDataFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const state = store.getState();
    expect(state.breaks.loading).toBe(false);
  });

  it('should set loading to false after error', async () => {
    const mockError = new Error('Network error');
    mockGetBreaks.mockRejectedValue(mockError);

    const { result } = renderHook(() => useBreaksDataFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const state = store.getState();
    expect(state.breaks.loading).toBe(false);
  });

  it('should filter breaks correctly - only include allowManual: true, isActive: true', async () => {
    const mockBreaksData = {
      data: {
        payrollEmployerBreaksByAssigneeId: {
          nodes: [
            // Should be included: allowManual: true, isActive: true
            {
              id: 'break1',
              breakName: 'Manual Only Break',
              isActive: true,
              breakType: 'PAID',
              allowManual: true,
              allowAuto: false,
              noSetDuration: false,
              breakDuration: 15,
              durationUnit: 'MINUTES',
              isDeleted: false,
              isDefaultPolicy: true,
              activeBreakAssignmentCount: 2,
              manualRule: { autoEndBreak: true },
              autoRule: null,
            },
            // Should be excluded: allowManual: false
            {
              id: 'break2',
              breakName: 'Auto Only Break',
              isActive: true,
              breakType: 'PAID',
              allowManual: false,
              allowAuto: true,
              noSetDuration: false,
              breakDuration: 10,
              durationUnit: 'MINUTES',
              isDeleted: false,
              isDefaultPolicy: false,
              activeBreakAssignmentCount: 1,
              manualRule: null,
              autoRule: { someRule: true },
            },
            // Should be included: allowManual: true, isActive: true
            {
              id: 'break3',
              breakName: 'Both Manual and Auto',
              isActive: true,
              breakType: 'PAID',
              allowManual: true,
              allowAuto: true,
              noSetDuration: false,
              breakDuration: 20,
              durationUnit: 'MINUTES',
              isDeleted: false,
              isDefaultPolicy: false,
              activeBreakAssignmentCount: 3,
              manualRule: null,
              autoRule: { someRule: true },
            },
            // Should be excluded: isActive: false
            {
              id: 'break4',
              breakName: 'Inactive Break',
              isActive: false,
              breakType: 'PAID',
              allowManual: true,
              allowAuto: false,
              noSetDuration: false,
              breakDuration: 25,
              durationUnit: 'MINUTES',
              isDeleted: false,
              isDefaultPolicy: false,
              activeBreakAssignmentCount: 0,
              manualRule: null,
              autoRule: null,
            },
            // Should be included: matches all criteria
            {
              id: 'break5',
              breakName: 'Another Manual Only',
              isActive: true,
              breakType: 'UNPAID',
              allowManual: true,
              allowAuto: false,
              noSetDuration: true,
              breakDuration: 0,
              durationUnit: 'MINUTES',
              isDeleted: false,
              isDefaultPolicy: false,
              activeBreakAssignmentCount: 1,
              manualRule: null,
              autoRule: null,
            },
          ],
        },
      },
    };

    mockGetBreaks.mockResolvedValue(mockBreaksData);

    const { result } = renderHook(() => useBreaksDataFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const state = store.getState();
    // Should only include 3 breaks that match the criteria
    expect(state.breaks.breaks).toHaveLength(3);

    // Verify the first break
    expect(state.breaks.breaks[0]).toEqual({
      id: 'break1',
      breakName: 'Manual Only Break',
      isActive: true,
      breakType: 'PAID',
      allowManual: true,
      allowAuto: false,
      noSetDuration: false,
      breakDuration: 15,
      durationUnit: 'MINUTES',
      isDeleted: false,
      isDefaultPolicy: true,
      activeBreakAssignmentCount: 2,
      manualRule: { autoEndBreak: true },
      autoRule: null,
    });

    // Verify the second break
    expect(state.breaks.breaks[1]).toEqual({
      id: 'break3',
      breakName: 'Both Manual and Auto',
      isActive: true,
      breakType: 'PAID',
      allowManual: true,
      allowAuto: true,
      noSetDuration: false,
      breakDuration: 20,
      durationUnit: 'MINUTES',
      isDeleted: false,
      isDefaultPolicy: false,
      activeBreakAssignmentCount: 3,
      manualRule: null,
      autoRule: { someRule: true },
    });

    // Verify the third break
    expect(state.breaks.breaks[2]).toEqual({
      id: 'break5',
      breakName: 'Another Manual Only',
      isActive: true,
      breakType: 'UNPAID',
      allowManual: true,
      allowAuto: false,
      noSetDuration: true,
      breakDuration: 0,
      durationUnit: 'MINUTES',
      isDeleted: false,
      isDefaultPolicy: false,
      activeBreakAssignmentCount: 1,
      manualRule: null,
      autoRule: null,
    });
  });

  it('should handle breaks with missing optional fields', async () => {
    const mockBreaksData = {
      data: {
        payrollEmployerBreaksByAssigneeId: {
          nodes: [
            {
              id: 'break1',
              breakName: 'Lunch Break',
              isActive: true,
              breakType: 'LUNCH',
              allowManual: true,
              allowAuto: false,
              noSetDuration: false,
              breakDuration: 30,
              durationUnit: 'MINUTES',
              isDeleted: false,
              isDefaultPolicy: true,
              activeBreakAssignmentCount: 5,
              // Missing manualRule and autoRule
            },
          ],
        },
      },
    };

    mockGetBreaks.mockResolvedValue(mockBreaksData);

    const { result } = renderHook(() => useBreaksDataFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const state = store.getState();
    expect(state.breaks.breaks[0]).toEqual({
      id: 'break1',
      breakName: 'Lunch Break',
      isActive: true,
      breakType: 'LUNCH',
      allowManual: true,
      allowAuto: false,
      noSetDuration: false,
      breakDuration: 30,
      durationUnit: 'MINUTES',
      isDeleted: false,
      isDefaultPolicy: true,
      activeBreakAssignmentCount: 5,
      manualRule: undefined,
      autoRule: undefined,
    });
  });

  it('should return loading state from query', () => {
    mockQueryResult.loading = true;

    const { result } = renderHook(() => useBreaksDataFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    expect(result.current.loading).toBe(true);
  });

  it('should return error state from query', () => {
    const mockError = new Error('Query error');
    mockQueryResult.error = mockError;

    const { result } = renderHook(() => useBreaksDataFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    expect(result.current.error).toBe(mockError);
  });

  it('should call getBreaks with non-empty assigneeId when nameId has a value', () => {
    // Mock selectTeamMember to return a team member with an id
    const mockTeamMember = {
      id: 'team-member-123',
      name: 'John Doe',
      // other team member properties can be added here
    };
    mockSelectTeamMember.mockReturnValue(mockTeamMember);

    renderHook(() => useBreaksDataFetching(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    expect(mockGetBreaks).toHaveBeenCalledWith({
      context: {
        clientName: 1, // ApolloClientNames.OIGQL enum value
        headers: {},
      },
      variables: {
        filter: {
          assigneeId: 'team-member-123',
        },
      },
    });
  });
});
