import { renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { useSandbox } from '@payroll/quicksand';
import { useStandardFieldAssignmentSummary } from 'src/js/service/hooks/settings/useStandardFieldAssignmentSummary';

// Mock all dependencies
jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn(),
}));

jest.mock('src/js/common/CustomerInteraction', () => ({
  getCustomerInteractionPropagationHeaders: jest.fn(() => ({})),
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  setInteractionDegraded: jest.fn(),
  TimeCustomerInteraction: {
    STANDARD_FIELD_ASSIGNMENT_SUMMARY_READ:
      'standard-field-assignment-summary-read',
  },
}));

jest.mock('src/js/service/ApolloClientBuilderUtils', () => ({
  ApolloClientNames: {
    TIME_TRACKING: 'TIME_TRACKING',
  },
}));

// Simple mock of the GraphQL hook
jest.mock('src/__generated__/timeTracking/graphql', () => ({
  useTimeTrackingStandardFieldAssignmentSummaryLazyQuery: jest.fn(() => [
    jest.fn(), // fetch function
    { loading: false }, // result
  ]),
}));

// Mock the feature flag hook
jest.mock('src/js/common/useIXPFeatureFlag', () => ({
  useIXPFeatureFlag: jest.fn(() => ({
    isEnabled: true, // Default to enabled for existing tests
    settled: true,
  })),
}));

// Mock constants
jest.mock('src/js/common/constants', () => ({
  FEATURE_FLAGS: {
    SBSEG_QBO_R4_ASSIGNMENTS: 'SBSEG-QBO-R4-assignments',
  },
}));

describe('useStandardFieldAssignmentSummary', () => {
  const mockSandbox = {
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    },
    navigation: {
      navigate: jest.fn(),
    },
    featureFlags: {
      isFeatureEnabled: jest.fn(() => false),
    },
  };

  const mockFetchAssignmentSummary = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useSandbox as jest.Mock).mockReturnValue(mockSandbox);

    // Reset GraphQL mock
    const {
      useTimeTrackingStandardFieldAssignmentSummaryLazyQuery,
    } = require('src/__generated__/timeTracking/graphql');
    useTimeTrackingStandardFieldAssignmentSummaryLazyQuery.mockReturnValue([
      mockFetchAssignmentSummary,
      { loading: false },
    ]);
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useStandardFieldAssignmentSummary());

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.totalTimeAgainstAssignments).toBe(0);
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should call the hook without errors', () => {
    expect(() => {
      renderHook(() => useStandardFieldAssignmentSummary());
    }).not.toThrow();
  });

  it('should return default values when feature flag is disabled', () => {
    // Mock feature flag as disabled
    const { useIXPFeatureFlag } = require('src/js/common/useIXPFeatureFlag');
    useIXPFeatureFlag.mockReturnValue({
      isEnabled: false,
      settled: true,
    });

    const { result } = renderHook(() => useStandardFieldAssignmentSummary());

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.totalTimeAgainstAssignments).toBe(0);
    expect(typeof result.current.refetch).toBe('function');

    // Reset mock for other tests
    useIXPFeatureFlag.mockReturnValue({
      isEnabled: true,
      settled: true,
    });
  });

  it('handles successful data fetch and calls success handler', async () => {
    // Mock feature flag as enabled
    const { useIXPFeatureFlag } = require('src/js/common/useIXPFeatureFlag');
    useIXPFeatureFlag.mockReturnValue({
      isEnabled: true,
      settled: true,
    });

    const mockData = {
      timeTrackingStandardFieldAssignmentSummary: {
        edges: [
          { node: { id: '1', name: 'Customer 1' } },
          { node: { id: '2', name: 'Customer 2' } },
        ],
        totalTimeAgainstAssignments: 5,
      },
    };

    // Mock successful response
    mockFetchAssignmentSummary.mockResolvedValue({
      data: mockData,
      error: null,
    });

    const { result, waitForNextUpdate } = renderHook(() =>
      useStandardFieldAssignmentSummary(),
    );

    // Wait for the effect to complete
    await waitForNextUpdate();

    expect(mockSandbox.logger.info).toHaveBeenCalledWith(
      'Component=useStandardFieldAssignmentSummary Event=Successfully fetched standard field assignment summary',
    );
  });

  it('handles empty/null data response', async () => {
    const { useIXPFeatureFlag } = require('src/js/common/useIXPFeatureFlag');
    useIXPFeatureFlag.mockReturnValue({
      isEnabled: true,
      settled: true,
    });

    const mockData = {
      timeTrackingStandardFieldAssignmentSummary: null,
    };

    mockFetchAssignmentSummary.mockResolvedValue({
      data: mockData,
      error: null,
    });

    const { result, waitForNextUpdate } = renderHook(() =>
      useStandardFieldAssignmentSummary(),
    );

    await waitForNextUpdate();

    expect(result.current.data).toEqual([]);
    expect(result.current.totalTimeAgainstAssignments).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it('handles refetch when feature flag is disabled', async () => {
    const { useIXPFeatureFlag } = require('src/js/common/useIXPFeatureFlag');
    useIXPFeatureFlag.mockReturnValue({
      isEnabled: false,
      settled: true,
    });

    const { result } = renderHook(() => useStandardFieldAssignmentSummary());

    // Call refetch
    await result.current.refetch();

    // Should not call the fetch function when feature flag is disabled
    expect(mockFetchAssignmentSummary).not.toHaveBeenCalled();
  });

  it('handles refetch with successful response', async () => {
    const { useIXPFeatureFlag } = require('src/js/common/useIXPFeatureFlag');
    useIXPFeatureFlag.mockReturnValue({
      isEnabled: true,
      settled: true,
    });

    const mockData = {
      timeTrackingStandardFieldAssignmentSummary: {
        edges: [{ node: { id: '3', name: 'Customer 3' } }],
        totalTimeAgainstAssignments: 10,
      },
    };

    mockFetchAssignmentSummary.mockResolvedValue({
      data: mockData,
      error: null,
    });

    const { result } = renderHook(() => useStandardFieldAssignmentSummary());

    // Call refetch
    await result.current.refetch();

    expect(mockFetchAssignmentSummary).toHaveBeenCalledWith({
      variables: { first: 20 },
      context: {
        clientName: 'TIME_TRACKING',
        headers: {},
      },
      fetchPolicy: 'cache-and-network',
    });
  });

  it('handles refetch with error response', async () => {
    const { useIXPFeatureFlag } = require('src/js/common/useIXPFeatureFlag');
    useIXPFeatureFlag.mockReturnValue({
      isEnabled: true,
      settled: true,
    });

    const {
      setInteractionDegraded,
    } = require('src/js/common/CustomerInteraction');
    const mockError = new Error('Network error');
    mockFetchAssignmentSummary.mockResolvedValue({
      data: null,
      error: mockError,
    });

    const { result } = renderHook(() => useStandardFieldAssignmentSummary());

    await result.current.refetch();

    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
    });
    expect(setInteractionDegraded).toHaveBeenCalledWith(
      mockSandbox,
      'standard-field-assignment-summary-read',
      'Network error',
    );
  });

  it('handles refetch with thrown exception', async () => {
    const { useIXPFeatureFlag } = require('src/js/common/useIXPFeatureFlag');
    useIXPFeatureFlag.mockReturnValue({
      isEnabled: true,
      settled: true,
    });

    const {
      setInteractionDegraded,
    } = require('src/js/common/CustomerInteraction');
    const mockError = new Error('Thrown error');
    mockFetchAssignmentSummary.mockRejectedValue(mockError);

    const { result } = renderHook(() => useStandardFieldAssignmentSummary());

    await result.current.refetch();

    await waitFor(() => {
      expect(result.current.error).toBe('Thrown error');
    });
    expect(setInteractionDegraded).toHaveBeenCalledWith(
      mockSandbox,
      'standard-field-assignment-summary-read',
      'Thrown error',
    );
  });
});
