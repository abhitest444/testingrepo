import { renderHook, act } from '@testing-library/react-hooks';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';
import { useAssignmentSummary } from 'src/js/widgets/timeProject/hooks/useAssignmentSummary';

const mockLoadQuery = jest.fn();

jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useLazyQuery: jest.fn(() => [mockLoadQuery]),
}));

jest.mock('src/js/service/utils/sandboxUtils', () => ({
  ...jest.requireActual('src/js/service/utils/sandboxUtils'),
  isWorkforceEnvironment: jest.fn(() => false),
}));

const buildSuccessResponse = (
  assignedTimeForCount = 19,
  assignedStandardFieldCount = 1,
  assignedCustomFieldCount = 6,
  totalTimeForAssignments = 25,
  totalStandardFieldAssignments = 4,
  totalCustomFieldAssignments = 12,
) => ({
  data: {
    timeTrackingTimeAgainstAssignmentSummary: {
      edges: [
        {
          node: {
            assignedTimeForCount,
            assignedStandardFieldCount,
            assignedCustomFieldCount,
          },
        },
      ],
      totalTimeForAssignments,
      totalStandardFieldAssignments,
      totalCustomFieldAssignments,
      totalTimeAgainstCount: 1,
    },
  },
});

describe('useAssignmentSummary', () => {
  const mockIsWorkforceEnvironment =
    isWorkforceEnvironment as jest.MockedFunction<
      typeof isWorkforceEnvironment
    >;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsWorkforceEnvironment.mockReturnValue(false);
  });

  it('should return null counts initially', () => {
    const { result } = renderHook(() => useAssignmentSummary());
    expect(result.current.counts).toBeNull();
    expect(result.current.error).toBe(false);
  });

  it('should extract edge-level counts as assigned and connection-level as totals', async () => {
    mockLoadQuery.mockResolvedValue(buildSuccessResponse(19, 1, 6, 25, 4, 12));
    const { result } = renderHook(() => useAssignmentSummary());

    await act(async () => {
      await result.current.fetchAssignmentSummary('cust-1');
    });

    expect(mockLoadQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          first: 100,
          filter: { timeAgainstEntityIds: ['cust-1'] },
        },
        // Hook is intentionally cache-free, so every call uses network-only.
        fetchPolicy: 'network-only',
      }),
    );
    expect(result.current.counts).toEqual({
      assignedTimeForCount: 19,
      assignedStandardFieldCount: 1,
      assignedCustomFieldCount: 6,
      totalTimeForAssignments: 25,
      totalStandardFieldAssignments: 4,
      totalCustomFieldAssignments: 12,
    });
    expect(result.current.error).toBe(false);
  });

  it('should set counts to null when response has no data', async () => {
    mockLoadQuery.mockResolvedValue({ data: null });
    const { result } = renderHook(() => useAssignmentSummary());

    await act(async () => {
      await result.current.fetchAssignmentSummary('cust-1');
    });

    expect(result.current.counts).toBeNull();
    expect(result.current.error).toBe(false);
  });

  it('should set counts to null when summary connection is undefined', async () => {
    mockLoadQuery.mockResolvedValue({
      data: { timeTrackingTimeAgainstAssignmentSummary: undefined },
    });
    const { result } = renderHook(() => useAssignmentSummary());

    await act(async () => {
      await result.current.fetchAssignmentSummary('cust-1');
    });

    expect(result.current.counts).toBeNull();
  });

  it('should set error to true when query throws', async () => {
    mockLoadQuery.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useAssignmentSummary());

    await act(async () => {
      await result.current.fetchAssignmentSummary('cust-1');
    });

    expect(result.current.counts).toBeNull();
    expect(result.current.error).toBe(true);
  });

  it('should clear error on subsequent successful fetch', async () => {
    mockLoadQuery.mockRejectedValueOnce(new Error('fail'));
    const { result } = renderHook(() => useAssignmentSummary());

    await act(async () => {
      await result.current.fetchAssignmentSummary('cust-1');
    });
    expect(result.current.error).toBe(true);

    mockLoadQuery.mockResolvedValueOnce(
      buildSuccessResponse(10, 5, 3, 20, 8, 6),
    );
    await act(async () => {
      await result.current.fetchAssignmentSummary('cust-1');
    });
    expect(result.current.error).toBe(false);
    expect(result.current.counts?.assignedTimeForCount).toBe(10);
    expect(result.current.counts?.totalTimeForAssignments).toBe(20);
  });

  it('should default to 0 when edge node fields are null', async () => {
    mockLoadQuery.mockResolvedValue({
      data: {
        timeTrackingTimeAgainstAssignmentSummary: {
          edges: [
            {
              node: {
                assignedTimeForCount: null,
                assignedStandardFieldCount: null,
                assignedCustomFieldCount: null,
              },
            },
          ],
          totalTimeForAssignments: null,
          totalStandardFieldAssignments: null,
          totalCustomFieldAssignments: null,
          totalTimeAgainstCount: null,
        },
      },
    });
    const { result } = renderHook(() => useAssignmentSummary());

    await act(async () => {
      await result.current.fetchAssignmentSummary('cust-1');
    });

    expect(result.current.counts).toEqual({
      assignedTimeForCount: 0,
      assignedStandardFieldCount: 0,
      assignedCustomFieldCount: 0,
      totalTimeForAssignments: 0,
      totalStandardFieldAssignments: 0,
      totalCustomFieldAssignments: 0,
    });
  });

  it('falls back to connection-level totals when edges array is empty', async () => {
    // Backend "summary-only" responses come back with `edges: []` but the
    // connection-level totals populated. We expect the hook to surface those
    // totals as the assigned counts so the chips render correctly instead of
    // being hidden behind a 0-count check.
    mockLoadQuery.mockResolvedValue({
      data: {
        timeTrackingTimeAgainstAssignmentSummary: {
          edges: [],
          totalTimeForAssignments: 25,
          totalStandardFieldAssignments: 4,
          totalCustomFieldAssignments: 12,
          totalTimeAgainstCount: 0,
        },
      },
    });
    const { result } = renderHook(() => useAssignmentSummary());

    await act(async () => {
      await result.current.fetchAssignmentSummary('cust-1');
    });

    expect(result.current.counts).toEqual({
      assignedTimeForCount: 25,
      assignedStandardFieldCount: 4,
      assignedCustomFieldCount: 12,
      totalTimeForAssignments: 25,
      totalStandardFieldAssignments: 4,
      totalCustomFieldAssignments: 12,
    });
  });

  it('hits the network on every call (no caching) for the same customerId', async () => {
    mockLoadQuery.mockResolvedValue(buildSuccessResponse(19, 1, 6, 25, 4, 12));
    const { result } = renderHook(() => useAssignmentSummary());

    await act(async () => {
      await result.current.fetchAssignmentSummary('cust-cache');
    });
    expect(mockLoadQuery).toHaveBeenCalledTimes(1);

    // Second call with the same id MUST also hit the network - the hook is
    // intentionally cache-free.
    mockLoadQuery.mockResolvedValue(buildSuccessResponse(7, 2, 1, 12, 4, 3));
    await act(async () => {
      await result.current.fetchAssignmentSummary('cust-cache');
    });
    expect(mockLoadQuery).toHaveBeenCalledTimes(2);
    expect(mockLoadQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({
        variables: {
          first: 100,
          filter: { timeAgainstEntityIds: ['cust-cache'] },
        },
        fetchPolicy: 'network-only',
      }),
    );
    expect(result.current.counts?.assignedTimeForCount).toBe(7);
  });

  it('surfaces the error and resets counts when the network call fails', async () => {
    mockLoadQuery.mockResolvedValue(buildSuccessResponse(19, 1, 6, 25, 4, 12));
    const { result } = renderHook(() => useAssignmentSummary());

    await act(async () => {
      await result.current.fetchAssignmentSummary('cust-force-fail');
    });
    expect(result.current.counts?.assignedTimeForCount).toBe(19);

    mockLoadQuery.mockRejectedValueOnce(new Error('boom'));
    await act(async () => {
      await result.current.fetchAssignmentSummary('cust-force-fail');
    });
    expect(result.current.error).toBe(true);
    expect(result.current.counts).toBeNull();
  });

  it('should fetch from network for a different customerId', async () => {
    mockLoadQuery.mockResolvedValue(buildSuccessResponse(19, 1, 6, 25, 4, 12));
    const { result } = renderHook(() => useAssignmentSummary());

    await act(async () => {
      await result.current.fetchAssignmentSummary('cust-a');
    });
    expect(mockLoadQuery).toHaveBeenCalledTimes(1);

    mockLoadQuery.mockResolvedValue(buildSuccessResponse(5, 2, 3, 10, 5, 8));
    await act(async () => {
      await result.current.fetchAssignmentSummary('cust-b');
    });
    expect(mockLoadQuery).toHaveBeenCalledTimes(2);
    expect(result.current.counts?.assignedTimeForCount).toBe(5);
  });

  it('passes intuit-qbtime-worker header in WFS', async () => {
    mockIsWorkforceEnvironment.mockReturnValue(true);
    mockLoadQuery.mockResolvedValue(buildSuccessResponse(19, 1, 6, 25, 4, 12));
    const { result } = renderHook(() => useAssignmentSummary());

    await act(async () => {
      await result.current.fetchAssignmentSummary('cust-wfs');
    });

    expect(mockLoadQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          first: 100,
          filter: { timeAgainstEntityIds: ['cust-wfs'] },
        },
        fetchPolicy: 'network-only',
        context: { headers: { 'intuit-qbtime-worker': 'true' } },
      }),
    );
  });
});
