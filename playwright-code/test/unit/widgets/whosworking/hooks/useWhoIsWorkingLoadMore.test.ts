import { renderHook, act } from '@testing-library/react-hooks';
import {
  useWhoIsWorkingLoadMore,
  WhoIsWorkingWorkerNode,
} from 'src/js/widgets/whosworking/hooks/useWhoIsWorkingLoadMore';
import {
  useWhoIsWorking,
  WHO_IS_WORKING_PAGE_SIZE,
} from 'src/js/service/hooks/whosWorking/useWhoIsWorking';

// Mock the underlying useWhoIsWorking hook
jest.mock('src/js/service/hooks/whosWorking/useWhoIsWorking', () => ({
  useWhoIsWorking: jest.fn(),
  WHO_IS_WORKING_PAGE_SIZE: 20,
}));

describe('useWhoIsWorkingLoadMore', () => {
  const mockLoadWhoIsWorkingBase = jest.fn();

  // Helper to create mock worker nodes
  const createMockWorker = (
    id: string,
    firstName: string,
    overrides?: Partial<WhoIsWorkingWorkerNode>,
  ): WhoIsWorkingWorkerNode =>
    ({
      timeForContactDAS: { id },
      firstName,
      lastName: 'Test',
      displayName: `${firstName} Test`,
      timeForType: 'EMPLOYEE',
      group: null,
      totalDaySeconds: 3600,
      activeTimeEntry: null,
      currentLocation: null,
      ...overrides,
    } as WhoIsWorkingWorkerNode);

  const mockWorkers = [
    createMockWorker('worker-1', 'John'),
    createMockWorker('worker-2', 'Jane'),
  ];

  const mockPageInfo = {
    hasNextPage: true,
    hasPreviousPage: false,
    startCursor: 'cursor-start',
    endCursor: 'cursor-end',
  };

  const mockSummary = {
    totalOnClock: 10,
    totalWorkers: 50,
  };

  const createMockUseWhoIsWorking = (overrides = {}) => ({
    loading: false,
    workers: [],
    pageInfo: null,
    summary: null,
    error: null,
    loadWhoIsWorking: mockLoadWhoIsWorkingBase,
    refetch: jest.fn(),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (useWhoIsWorking as jest.Mock).mockReturnValue(createMockUseWhoIsWorking());
  });

  describe('Initialization', () => {
    it('should return initial state with empty workers', () => {
      const { result } = renderHook(() => useWhoIsWorkingLoadMore());

      expect(result.current.workers).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.summary).toBeNull();
      expect(result.current.hasMore).toBe(false);
      expect(typeof result.current.loadWhoIsWorking).toBe('function');
      expect(typeof result.current.loadMore).toBe('function');
      expect(typeof result.current.refetch).toBe('function');
    });

    it('should use default page size from WHO_IS_WORKING_PAGE_SIZE', () => {
      const { result } = renderHook(() => useWhoIsWorkingLoadMore());
      const filter = { clockedInTimeForOnly: true };

      act(() => {
        result.current.loadWhoIsWorking(filter);
      });

      expect(mockLoadWhoIsWorkingBase).toHaveBeenCalledWith({
        first: WHO_IS_WORKING_PAGE_SIZE,
        after: undefined,
        filter,
        orderBy: undefined,
      });
    });

    it('should use custom page size when provided', () => {
      const { result } = renderHook(() =>
        useWhoIsWorkingLoadMore({ pageSize: 50 }),
      );
      const filter = { clockedInTimeForOnly: true };

      act(() => {
        result.current.loadWhoIsWorking(filter);
      });

      expect(mockLoadWhoIsWorkingBase).toHaveBeenCalledWith({
        first: 50,
        after: undefined,
        filter,
        orderBy: undefined,
      });
    });
  });

  describe('loadWhoIsWorking', () => {
    it('should call base hook loadWhoIsWorking with filter', () => {
      const { result } = renderHook(() => useWhoIsWorkingLoadMore());
      const filter = { clockedInTimeForOnly: true };

      act(() => {
        result.current.loadWhoIsWorking(filter);
      });

      expect(mockLoadWhoIsWorkingBase).toHaveBeenCalledWith({
        first: WHO_IS_WORKING_PAGE_SIZE,
        after: undefined,
        filter,
        orderBy: undefined,
      });
    });

    it('should call base hook loadWhoIsWorking with filter and orderBy', () => {
      const { result } = renderHook(() => useWhoIsWorkingLoadMore());
      const filter = { clockedInTimeForOnly: false };
      const orderBy = [{ orderOn: 'CLOCK_IN_TIME', orderDirection: 'ASC' }];

      act(() => {
        result.current.loadWhoIsWorking(filter, orderBy as any);
      });

      expect(mockLoadWhoIsWorkingBase).toHaveBeenCalledWith({
        first: WHO_IS_WORKING_PAGE_SIZE,
        after: undefined,
        filter,
        orderBy,
      });
    });

    it('should reset pagination state when loading new filter', () => {
      const { result, rerender } = renderHook(() => useWhoIsWorkingLoadMore());

      // Set up initial data
      (useWhoIsWorking as jest.Mock).mockReturnValue(
        createMockUseWhoIsWorking({
          workers: mockWorkers,
          pageInfo: mockPageInfo,
        }),
      );
      rerender();

      // Load with new filter - should reset
      act(() => {
        result.current.loadWhoIsWorking({ clockedInTimeForOnly: false });
      });

      expect(mockLoadWhoIsWorkingBase).toHaveBeenCalledWith({
        first: WHO_IS_WORKING_PAGE_SIZE,
        after: undefined,
        filter: { clockedInTimeForOnly: false },
        orderBy: undefined,
      });
    });
  });

  describe('Data Accumulation', () => {
    it('should accumulate workers from initial load', async () => {
      const { result, rerender } = renderHook(() => useWhoIsWorkingLoadMore());

      // Initial load
      act(() => {
        result.current.loadWhoIsWorking({ clockedInTimeForOnly: true });
      });

      // Simulate data arrival
      (useWhoIsWorking as jest.Mock).mockReturnValue(
        createMockUseWhoIsWorking({
          workers: mockWorkers,
          pageInfo: mockPageInfo,
          summary: mockSummary,
        }),
      );
      rerender();

      expect(result.current.workers).toHaveLength(2);
      expect(result.current.workers[0].firstName).toBe('John');
      expect(result.current.workers[1].firstName).toBe('Jane');
    });

    it('should replace workers on new filter load', async () => {
      const { result, rerender } = renderHook(() => useWhoIsWorkingLoadMore());

      // Initial load with first set of workers
      act(() => {
        result.current.loadWhoIsWorking({ clockedInTimeForOnly: true });
      });

      (useWhoIsWorking as jest.Mock).mockReturnValue(
        createMockUseWhoIsWorking({
          workers: mockWorkers,
          pageInfo: mockPageInfo,
        }),
      );
      rerender();

      expect(result.current.workers).toHaveLength(2);

      // Load with new filter
      act(() => {
        result.current.loadWhoIsWorking({ clockedInTimeForOnly: false });
      });

      // New data arrives
      const newWorkers = [createMockWorker('worker-3', 'Bob')];
      (useWhoIsWorking as jest.Mock).mockReturnValue(
        createMockUseWhoIsWorking({
          workers: newWorkers,
          pageInfo: { ...mockPageInfo, hasNextPage: false },
        }),
      );
      rerender();

      expect(result.current.workers).toHaveLength(1);
      expect(result.current.workers[0].firstName).toBe('Bob');
    });

    it('should append workers on load more', async () => {
      const { result, rerender } = renderHook(() => useWhoIsWorkingLoadMore());

      // Initial load
      act(() => {
        result.current.loadWhoIsWorking({ clockedInTimeForOnly: true });
      });

      (useWhoIsWorking as jest.Mock).mockReturnValue(
        createMockUseWhoIsWorking({
          workers: mockWorkers,
          pageInfo: mockPageInfo,
        }),
      );
      rerender();

      // Load more
      act(() => {
        result.current.loadMore();
      });

      // New page data arrives
      const moreWorkers = [
        createMockWorker('worker-3', 'Bob'),
        createMockWorker('worker-4', 'Alice'),
      ];
      (useWhoIsWorking as jest.Mock).mockReturnValue(
        createMockUseWhoIsWorking({
          workers: moreWorkers,
          pageInfo: { ...mockPageInfo, endCursor: 'cursor-end-2' },
        }),
      );
      rerender();

      expect(result.current.workers).toHaveLength(4);
      expect(result.current.workers[2].firstName).toBe('Bob');
      expect(result.current.workers[3].firstName).toBe('Alice');
    });

    it('should deduplicate workers by ID on load more', async () => {
      const { result, rerender } = renderHook(() => useWhoIsWorkingLoadMore());

      // Initial load
      act(() => {
        result.current.loadWhoIsWorking({ clockedInTimeForOnly: true });
      });

      (useWhoIsWorking as jest.Mock).mockReturnValue(
        createMockUseWhoIsWorking({
          workers: mockWorkers,
          pageInfo: mockPageInfo,
        }),
      );
      rerender();

      expect(result.current.workers).toHaveLength(2);

      // Load more with duplicate
      act(() => {
        result.current.loadMore();
      });

      const moreWorkersWithDuplicate = [
        createMockWorker('worker-1', 'John'), // Duplicate
        createMockWorker('worker-3', 'Bob'),
      ];
      (useWhoIsWorking as jest.Mock).mockReturnValue(
        createMockUseWhoIsWorking({
          workers: moreWorkersWithDuplicate,
          pageInfo: { ...mockPageInfo, endCursor: 'cursor-end-2' },
        }),
      );
      rerender();

      expect(result.current.workers).toHaveLength(3);
      expect(
        result.current.workers.filter(
          (w) => w.timeForContactDAS?.id === 'worker-1',
        ),
      ).toHaveLength(1);
    });

    it('should handle workers with null timeForContactDAS.id when deduplicating', async () => {
      const { result, rerender } = renderHook(() => useWhoIsWorkingLoadMore());

      // Initial load with workers that have null id in timeForContactDAS
      const workersWithNullIds = [
        createMockWorker('worker-1', 'John'),
        {
          ...createMockWorker('worker-2', 'Jane'),
          timeForContactDAS: { id: null },
        } as unknown as WhoIsWorkingWorkerNode,
      ];

      act(() => {
        result.current.loadWhoIsWorking({ clockedInTimeForOnly: true });
      });

      (useWhoIsWorking as jest.Mock).mockReturnValue(
        createMockUseWhoIsWorking({
          workers: workersWithNullIds,
          pageInfo: mockPageInfo,
        }),
      );
      rerender();

      expect(result.current.workers).toHaveLength(2);

      // Load more with another worker with null id
      act(() => {
        result.current.loadMore();
      });

      const moreWorkersWithNullIds = [
        createMockWorker('worker-3', 'Bob'),
        {
          ...createMockWorker('worker-4', 'Alice'),
          timeForContactDAS: { id: null },
        } as unknown as WhoIsWorkingWorkerNode,
      ];
      (useWhoIsWorking as jest.Mock).mockReturnValue(
        createMockUseWhoIsWorking({
          workers: moreWorkersWithNullIds,
          pageInfo: { ...mockPageInfo, endCursor: 'cursor-end-2' },
        }),
      );
      rerender();

      // Worker with null id from second batch should be deduplicated
      // because null === null in Set comparisons
      expect(result.current.workers).toHaveLength(3);
      // Only one worker with null id should exist
      expect(
        result.current.workers.filter((w) => w.timeForContactDAS?.id === null),
      ).toHaveLength(1);
    });
  });

  describe('loadMore', () => {
    it('should call base hook with cursor for pagination', async () => {
      const { result, rerender } = renderHook(() => useWhoIsWorkingLoadMore());

      // Initial load
      act(() => {
        result.current.loadWhoIsWorking({ clockedInTimeForOnly: true });
      });

      (useWhoIsWorking as jest.Mock).mockReturnValue(
        createMockUseWhoIsWorking({
          workers: mockWorkers,
          pageInfo: mockPageInfo,
        }),
      );
      rerender();

      mockLoadWhoIsWorkingBase.mockClear();

      // Load more
      act(() => {
        result.current.loadMore();
      });

      expect(mockLoadWhoIsWorkingBase).toHaveBeenCalledWith({
        first: WHO_IS_WORKING_PAGE_SIZE,
        after: 'cursor-end',
        filter: { clockedInTimeForOnly: true },
        orderBy: undefined,
      });
    });

    it('should not call loadMore when hasMore is false', async () => {
      const { result, rerender } = renderHook(() => useWhoIsWorkingLoadMore());

      // Initial load
      act(() => {
        result.current.loadWhoIsWorking({ clockedInTimeForOnly: true });
      });

      (useWhoIsWorking as jest.Mock).mockReturnValue(
        createMockUseWhoIsWorking({
          workers: mockWorkers,
          pageInfo: { ...mockPageInfo, hasNextPage: false },
        }),
      );
      rerender();

      mockLoadWhoIsWorkingBase.mockClear();

      act(() => {
        result.current.loadMore();
      });

      expect(mockLoadWhoIsWorkingBase).not.toHaveBeenCalled();
    });

    it('should not call loadMore when loading', async () => {
      const { result, rerender } = renderHook(() => useWhoIsWorkingLoadMore());

      // Initial load
      act(() => {
        result.current.loadWhoIsWorking({ clockedInTimeForOnly: true });
      });

      (useWhoIsWorking as jest.Mock).mockReturnValue(
        createMockUseWhoIsWorking({
          workers: mockWorkers,
          pageInfo: mockPageInfo,
          loading: true,
        }),
      );
      rerender();

      mockLoadWhoIsWorkingBase.mockClear();

      act(() => {
        result.current.loadMore();
      });

      expect(mockLoadWhoIsWorkingBase).not.toHaveBeenCalled();
    });

    it('should not call loadMore when no cursor', async () => {
      const { result, rerender } = renderHook(() => useWhoIsWorkingLoadMore());

      // Initial load but pageInfo has no endCursor
      act(() => {
        result.current.loadWhoIsWorking({ clockedInTimeForOnly: true });
      });

      (useWhoIsWorking as jest.Mock).mockReturnValue(
        createMockUseWhoIsWorking({
          workers: mockWorkers,
          pageInfo: { ...mockPageInfo, endCursor: null },
        }),
      );
      rerender();

      mockLoadWhoIsWorkingBase.mockClear();

      act(() => {
        result.current.loadMore();
      });

      expect(mockLoadWhoIsWorkingBase).not.toHaveBeenCalled();
    });

    it('should not call loadMore when no filter has been set', async () => {
      const { result } = renderHook(() => useWhoIsWorkingLoadMore());

      // Don't call loadWhoIsWorking first
      mockLoadWhoIsWorkingBase.mockClear();

      act(() => {
        result.current.loadMore();
      });

      expect(mockLoadWhoIsWorkingBase).not.toHaveBeenCalled();
    });

    it('should not call loadMore when filter ref is not set even with pageInfo', async () => {
      // This tests the edge case where pageInfo has cursor but filter was never set
      // (e.g., if hook state got out of sync somehow)
      const { result, rerender } = renderHook(() => useWhoIsWorkingLoadMore());

      // Mock having pageInfo without ever calling loadWhoIsWorking
      // This simulates an edge case where hasMore/endCursor are set but filter is not
      (useWhoIsWorking as jest.Mock).mockReturnValue(
        createMockUseWhoIsWorking({
          workers: mockWorkers,
          pageInfo: mockPageInfo, // has endCursor and hasNextPage: true
          loading: false,
        }),
      );
      rerender();

      mockLoadWhoIsWorkingBase.mockClear();

      // loadMore should not call base hook since filter ref is never set
      act(() => {
        result.current.loadMore();
      });

      expect(mockLoadWhoIsWorkingBase).not.toHaveBeenCalled();
    });

    it('should preserve orderBy when loading more', async () => {
      const { result, rerender } = renderHook(() => useWhoIsWorkingLoadMore());
      const orderBy = [{ orderOn: 'CLOCK_IN_TIME', orderDirection: 'DESC' }];

      // Initial load with orderBy
      act(() => {
        result.current.loadWhoIsWorking(
          { clockedInTimeForOnly: true },
          orderBy as any,
        );
      });

      (useWhoIsWorking as jest.Mock).mockReturnValue(
        createMockUseWhoIsWorking({
          workers: mockWorkers,
          pageInfo: mockPageInfo,
        }),
      );
      rerender();

      mockLoadWhoIsWorkingBase.mockClear();

      // Load more should use same orderBy
      act(() => {
        result.current.loadMore();
      });

      expect(mockLoadWhoIsWorkingBase).toHaveBeenCalledWith({
        first: WHO_IS_WORKING_PAGE_SIZE,
        after: 'cursor-end',
        filter: { clockedInTimeForOnly: true },
        orderBy,
      });
    });
  });

  describe('refetch', () => {
    it('should call loadWhoIsWorking (reset pagination)', () => {
      const { result } = renderHook(() => useWhoIsWorkingLoadMore());
      const filter = { clockedInTimeForOnly: true };
      const orderBy = [{ orderOn: 'NAME', orderDirection: 'ASC' }];

      act(() => {
        result.current.refetch(filter, orderBy as any);
      });

      expect(mockLoadWhoIsWorkingBase).toHaveBeenCalledWith({
        first: WHO_IS_WORKING_PAGE_SIZE,
        after: undefined,
        filter,
        orderBy,
      });
    });
  });

  describe('hasMore State', () => {
    it('should set hasMore true when hasNextPage is true', async () => {
      const { result, rerender } = renderHook(() => useWhoIsWorkingLoadMore());

      act(() => {
        result.current.loadWhoIsWorking({ clockedInTimeForOnly: true });
      });

      (useWhoIsWorking as jest.Mock).mockReturnValue(
        createMockUseWhoIsWorking({
          workers: mockWorkers,
          pageInfo: { ...mockPageInfo, hasNextPage: true },
        }),
      );
      rerender();

      expect(result.current.hasMore).toBe(true);
    });

    it('should set hasMore false when hasNextPage is false', async () => {
      const { result, rerender } = renderHook(() => useWhoIsWorkingLoadMore());

      act(() => {
        result.current.loadWhoIsWorking({ clockedInTimeForOnly: true });
      });

      (useWhoIsWorking as jest.Mock).mockReturnValue(
        createMockUseWhoIsWorking({
          workers: mockWorkers,
          pageInfo: { ...mockPageInfo, hasNextPage: false },
        }),
      );
      rerender();

      expect(result.current.hasMore).toBe(false);
    });
  });

  describe('Summary', () => {
    it('should return summary from base hook', async () => {
      const { result, rerender } = renderHook(() => useWhoIsWorkingLoadMore());

      act(() => {
        result.current.loadWhoIsWorking({ clockedInTimeForOnly: true });
      });

      (useWhoIsWorking as jest.Mock).mockReturnValue(
        createMockUseWhoIsWorking({
          workers: mockWorkers,
          pageInfo: mockPageInfo,
          summary: mockSummary,
        }),
      );
      rerender();

      expect(result.current.summary).toEqual(mockSummary);
    });
  });

  describe('Error Handling', () => {
    it('should return error from base hook', async () => {
      const { result, rerender } = renderHook(() => useWhoIsWorkingLoadMore());

      (useWhoIsWorking as jest.Mock).mockReturnValue(
        createMockUseWhoIsWorking({
          error: 'Network error',
        }),
      );
      rerender();

      expect(result.current.error).toBe('Network error');
    });
  });

  describe('Loading State', () => {
    it('should pass through loading state', async () => {
      const { result, rerender } = renderHook(() => useWhoIsWorkingLoadMore());

      (useWhoIsWorking as jest.Mock).mockReturnValue(
        createMockUseWhoIsWorking({
          loading: true,
        }),
      );
      rerender();

      expect(result.current.loading).toBe(true);
    });

    it('should not update workers while loading', async () => {
      const { result, rerender } = renderHook(() => useWhoIsWorkingLoadMore());

      // Initial load
      act(() => {
        result.current.loadWhoIsWorking({ clockedInTimeForOnly: true });
      });

      // Data arrives
      (useWhoIsWorking as jest.Mock).mockReturnValue(
        createMockUseWhoIsWorking({
          workers: mockWorkers,
          pageInfo: mockPageInfo,
          loading: false,
        }),
      );
      rerender();

      expect(result.current.workers).toHaveLength(2);

      // Start loading more
      act(() => {
        result.current.loadMore();
      });

      // Still loading
      (useWhoIsWorking as jest.Mock).mockReturnValue(
        createMockUseWhoIsWorking({
          workers: [], // Empty during loading
          pageInfo: mockPageInfo,
          loading: true,
        }),
      );
      rerender();

      // Workers should be preserved while loading
      expect(result.current.workers).toHaveLength(2);
    });
  });

  describe('Options', () => {
    it('should accept initial filter option', () => {
      const initialFilter = { clockedInTimeForOnly: true };
      renderHook(() => useWhoIsWorkingLoadMore({ filter: initialFilter }));

      // The initial filter is stored but doesn't trigger a query
      expect(useWhoIsWorking).toHaveBeenCalled();
    });

    it('should accept initial orderBy option', () => {
      const initialOrderBy = [{ orderOn: 'NAME', orderDirection: 'ASC' }];
      renderHook(() =>
        useWhoIsWorkingLoadMore({ orderBy: initialOrderBy as any }),
      );

      expect(useWhoIsWorking).toHaveBeenCalled();
    });
  });

  describe('Empty Results', () => {
    it('should handle empty results on initial load', async () => {
      const { result, rerender } = renderHook(() => useWhoIsWorkingLoadMore());

      act(() => {
        result.current.loadWhoIsWorking({ clockedInTimeForOnly: true });
      });

      (useWhoIsWorking as jest.Mock).mockReturnValue(
        createMockUseWhoIsWorking({
          workers: [],
          pageInfo: { ...mockPageInfo, hasNextPage: false, endCursor: null },
          summary: { totalOnClock: 0, totalWorkers: 0 },
        }),
      );
      rerender();

      expect(result.current.workers).toEqual([]);
      expect(result.current.hasMore).toBe(false);
      expect(result.current.summary?.totalWorkers).toBe(0);
    });

    it('should handle empty results on load more (no new data)', async () => {
      const { result, rerender } = renderHook(() => useWhoIsWorkingLoadMore());

      // Initial load with data
      act(() => {
        result.current.loadWhoIsWorking({ clockedInTimeForOnly: true });
      });

      (useWhoIsWorking as jest.Mock).mockReturnValue(
        createMockUseWhoIsWorking({
          workers: mockWorkers,
          pageInfo: mockPageInfo,
        }),
      );
      rerender();

      expect(result.current.workers).toHaveLength(2);

      // Load more returns empty
      act(() => {
        result.current.loadMore();
      });

      (useWhoIsWorking as jest.Mock).mockReturnValue(
        createMockUseWhoIsWorking({
          workers: [],
          pageInfo: { ...mockPageInfo, hasNextPage: false },
        }),
      );
      rerender();

      // Original workers should remain (empty new workers are not added)
      expect(result.current.workers).toHaveLength(2);
    });
  });
});
