import { renderHook, act } from '@testing-library/react-hooks';
import {
  useGetWorkersTotalCountLazyQuery,
  TimeTracking_WorkersQueryFilter,
  TimeTracking_TimeForType,
} from 'src/__generated__/timeTracking/graphql';
import { useWorkersTotalCount } from 'src/js/service/hooks/groups/useWorkersTotalCount';

// Mock the lazy query hook
jest.mock('src/__generated__/timeTracking/graphql', () => {
  const actual = jest.requireActual('src/__generated__/timeTracking/graphql');
  return {
    ...actual,
    useGetWorkersTotalCountLazyQuery: jest.fn(),
  };
});

describe('useWorkersTotalCount', () => {
  const mockExecuteQuery = jest.fn();
  const mockUseLazyQuery =
    useGetWorkersTotalCountLazyQuery as jest.MockedFunction<
      typeof useGetWorkersTotalCountLazyQuery
    >;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLazyQuery.mockReturnValue([
      mockExecuteQuery,
      {
        data: undefined,
        loading: false,
        error: undefined,
        called: false,
        client: {} as any,
        refetch: jest.fn(),
        fetchMore: jest.fn(),
        updateQuery: jest.fn(),
        startPolling: jest.fn(),
        stopPolling: jest.fn(),
        subscribeToMore: jest.fn(),
        observable: {} as any,
        networkStatus: 7,
        reobserve: jest.fn(),
        variables: undefined,
      } as any,
    ]);
  });

  describe('Hook Interface', () => {
    it('should return the correct interface with all required properties', () => {
      const { result } = renderHook(() => useWorkersTotalCount());

      expect(result.current).toHaveProperty('totalCount');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('executeQuery');
      expect(typeof result.current.executeQuery).toBe('function');
    });

    it('should return default values when no data is available', () => {
      const { result } = renderHook(() => useWorkersTotalCount());

      expect(result.current.totalCount).toBe(0);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Data Extraction', () => {
    it('should extract totalCount from data correctly', () => {
      mockUseLazyQuery.mockReturnValue([
        mockExecuteQuery,
        {
          data: {
            timeTrackingWorkers: {
              totalCount: 42,
            },
          },
          loading: false,
          error: undefined,
          called: true,
          client: {} as any,
          refetch: jest.fn(),
          fetchMore: jest.fn(),
          updateQuery: jest.fn(),
          startPolling: jest.fn(),
          stopPolling: jest.fn(),
          subscribeToMore: jest.fn(),
          observable: {} as any,
          networkStatus: 7,
          reobserve: jest.fn(),
          variables: undefined,
        } as any,
      ]);

      const { result } = renderHook(() => useWorkersTotalCount());

      expect(result.current.totalCount).toBe(42);
    });

    it('should return 0 when totalCount is null', () => {
      mockUseLazyQuery.mockReturnValue([
        mockExecuteQuery,
        {
          data: {
            timeTrackingWorkers: {
              totalCount: null as any,
            },
          },
          loading: false,
          error: undefined,
          called: true,
          client: {} as any,
          refetch: jest.fn(),
          fetchMore: jest.fn(),
          updateQuery: jest.fn(),
          startPolling: jest.fn(),
          stopPolling: jest.fn(),
          subscribeToMore: jest.fn(),
          observable: {} as any,
          networkStatus: 7,
          reobserve: jest.fn(),
          variables: undefined,
        } as any,
      ]);

      const { result } = renderHook(() => useWorkersTotalCount());

      expect(result.current.totalCount).toBe(0);
    });

    it('should return 0 when data is null', () => {
      mockUseLazyQuery.mockReturnValue([
        mockExecuteQuery,
        {
          data: undefined,
          loading: false,
          error: undefined,
          called: false,
          client: {} as any,
          refetch: jest.fn(),
          fetchMore: jest.fn(),
          updateQuery: jest.fn(),
          startPolling: jest.fn(),
          stopPolling: jest.fn(),
          subscribeToMore: jest.fn(),
          observable: {} as any,
          networkStatus: 7,
          reobserve: jest.fn(),
          variables: undefined,
        } as any,
      ]);

      const { result } = renderHook(() => useWorkersTotalCount());

      expect(result.current.totalCount).toBe(0);
    });

    it('should return 0 when timeTrackingWorkers is undefined', () => {
      mockUseLazyQuery.mockReturnValue([
        mockExecuteQuery,
        {
          data: {
            timeTrackingWorkers: undefined,
          },
          loading: false,
          error: undefined,
          called: true,
          client: {} as any,
          refetch: jest.fn(),
          fetchMore: jest.fn(),
          updateQuery: jest.fn(),
          startPolling: jest.fn(),
          stopPolling: jest.fn(),
          subscribeToMore: jest.fn(),
          observable: {} as any,
          networkStatus: 7,
          reobserve: jest.fn(),
          variables: undefined,
        } as any,
      ]);

      const { result } = renderHook(() => useWorkersTotalCount());

      expect(result.current.totalCount).toBe(0);
    });
  });

  describe('Loading State', () => {
    it('should return loading state from query', () => {
      mockUseLazyQuery.mockReturnValue([
        mockExecuteQuery,
        {
          data: undefined,
          loading: true,
          error: undefined,
          called: false,
          client: {} as any,
          refetch: jest.fn(),
          fetchMore: jest.fn(),
          updateQuery: jest.fn(),
          startPolling: jest.fn(),
          stopPolling: jest.fn(),
          subscribeToMore: jest.fn(),
          observable: {} as any,
          networkStatus: 7,
          reobserve: jest.fn(),
          variables: undefined,
        } as any,
      ]);

      const { result } = renderHook(() => useWorkersTotalCount());

      expect(result.current.loading).toBe(true);
    });
  });

  describe('Error State', () => {
    it('should extract error message from Apollo error', () => {
      const mockError = {
        message: 'GraphQL error occurred',
        name: 'ApolloError',
        graphQLErrors: [],
        networkError: null,
        extraInfo: undefined,
        protocolErrors: [],
        clientErrors: [],
      } as any;

      mockUseLazyQuery.mockReturnValue([
        mockExecuteQuery,
        {
          data: undefined,
          loading: false,
          error: mockError,
          called: false,
          client: {} as any,
          refetch: jest.fn(),
          fetchMore: jest.fn(),
          updateQuery: jest.fn(),
          startPolling: jest.fn(),
          stopPolling: jest.fn(),
          subscribeToMore: jest.fn(),
          observable: {} as any,
          networkStatus: 7,
          reobserve: jest.fn(),
          variables: undefined,
        } as any,
      ]);

      const { result } = renderHook(() => useWorkersTotalCount());

      expect(result.current.error).toBe('GraphQL error occurred');
    });

    it('should return null when error message is undefined', () => {
      const mockError = {
        message: undefined,
        name: 'ApolloError',
        graphQLErrors: [],
        networkError: null,
        extraInfo: undefined,
      };

      mockUseLazyQuery.mockReturnValue([
        mockExecuteQuery,
        {
          data: undefined,
          loading: false,
          error: mockError as any,
          called: false,
          client: {} as any,
          refetch: jest.fn(),
          fetchMore: jest.fn(),
          updateQuery: jest.fn(),
          startPolling: jest.fn(),
          stopPolling: jest.fn(),
          subscribeToMore: jest.fn(),
          observable: {} as any,
          networkStatus: 7,
          reobserve: jest.fn(),
          variables: undefined,
        } as any,
      ]);

      const { result } = renderHook(() => useWorkersTotalCount());

      expect(result.current.error).toBeNull();
    });
  });

  describe('executeQuery Function', () => {
    it('should call executeQuery with filter from options', () => {
      const filter: TimeTracking_WorkersQueryFilter = { isActive: true };

      const { result } = renderHook(() => useWorkersTotalCount({ filter }));

      act(() => {
        result.current.executeQuery();
      });

      expect(mockExecuteQuery).toHaveBeenCalledTimes(1);
      expect(mockExecuteQuery).toHaveBeenCalledWith({
        variables: {
          filter,
        },
      });
    });

    it('should call executeQuery with undefined filter when no filter provided', () => {
      const { result } = renderHook(() => useWorkersTotalCount());

      act(() => {
        result.current.executeQuery();
      });

      expect(mockExecuteQuery).toHaveBeenCalledTimes(1);
      expect(mockExecuteQuery).toHaveBeenCalledWith({
        variables: {
          filter: undefined,
        },
      });
    });

    it('should update when filter changes', () => {
      const initialFilter: TimeTracking_WorkersQueryFilter = {
        isActive: true,
      };

      const { result, rerender } = renderHook(
        ({ filter }) => useWorkersTotalCount({ filter }),
        {
          initialProps: { filter: initialFilter },
        },
      );

      act(() => {
        result.current.executeQuery();
      });

      expect(mockExecuteQuery).toHaveBeenCalledWith({
        variables: {
          filter: initialFilter,
        },
      });

      const newFilter: TimeTracking_WorkersQueryFilter = {
        isActive: false,
        searchText: 'test',
      };

      rerender({ filter: newFilter });

      act(() => {
        result.current.executeQuery();
      });

      expect(mockExecuteQuery).toHaveBeenCalledWith({
        variables: {
          filter: newFilter,
        },
      });
    });
  });

  describe('useCallback Memoization', () => {
    it('should maintain stable executeQuery reference when filter does not change', () => {
      const filter: TimeTracking_WorkersQueryFilter = { isActive: true };

      const { result, rerender } = renderHook(
        ({ filter }) => useWorkersTotalCount({ filter }),
        {
          initialProps: { filter },
        },
      );

      const firstExecuteQuery = result.current.executeQuery;

      rerender({ filter });

      const secondExecuteQuery = result.current.executeQuery;

      expect(firstExecuteQuery).toBe(secondExecuteQuery);
    });

    it('should create new executeQuery reference when filter changes', () => {
      const initialFilter: TimeTracking_WorkersQueryFilter = {
        isActive: true,
      };

      const { result, rerender } = renderHook(
        ({ filter }) => useWorkersTotalCount({ filter }),
        {
          initialProps: { filter: initialFilter },
        },
      );

      const firstExecuteQuery = result.current.executeQuery;

      const newFilter: TimeTracking_WorkersQueryFilter = {
        isActive: false,
      };

      rerender({ filter: newFilter });

      const secondExecuteQuery = result.current.executeQuery;

      expect(firstExecuteQuery).not.toBe(secondExecuteQuery);
    });
  });

  describe('Query Configuration', () => {
    it('should configure lazy query with cache-and-network fetch policy', () => {
      renderHook(() => useWorkersTotalCount());

      expect(mockUseLazyQuery).toHaveBeenCalledWith({
        fetchPolicy: 'cache-and-network',
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle filter with all properties', () => {
      const filter: TimeTracking_WorkersQueryFilter = {
        isActive: true,
        groupId: 'group-123',
        searchText: 'test search',
        types: [
          TimeTracking_TimeForType.Employee,
          TimeTracking_TimeForType.Vendor,
        ],
        hasGroup: true,
      };

      const { result } = renderHook(() => useWorkersTotalCount({ filter }));

      act(() => {
        result.current.executeQuery();
      });

      expect(mockExecuteQuery).toHaveBeenCalledWith({
        variables: {
          filter,
        },
      });
    });
  });

  describe('Integration', () => {
    it('should handle complete flow: loading -> success -> data', () => {
      // Initial state: not called
      mockUseLazyQuery.mockReturnValueOnce([
        mockExecuteQuery,
        {
          data: undefined,
          loading: false,
          error: undefined,
          called: false,
          client: {} as any,
          refetch: jest.fn(),
          fetchMore: jest.fn(),
          updateQuery: jest.fn(),
          startPolling: jest.fn(),
          stopPolling: jest.fn(),
          subscribeToMore: jest.fn(),
          observable: {} as any,
          networkStatus: 7,
          reobserve: jest.fn(),
          variables: undefined,
        } as any,
      ]);

      const { result, rerender } = renderHook(() =>
        useWorkersTotalCount({ filter: { isActive: true } }),
      );

      expect(result.current.loading).toBe(false);
      expect(result.current.totalCount).toBe(0);

      // Loading state
      mockUseLazyQuery.mockReturnValueOnce([
        mockExecuteQuery,
        {
          data: undefined,
          loading: true,
          error: undefined,
          called: true,
          client: {} as any,
          refetch: jest.fn(),
          fetchMore: jest.fn(),
          updateQuery: jest.fn(),
          startPolling: jest.fn(),
          stopPolling: jest.fn(),
          subscribeToMore: jest.fn(),
          observable: {} as any,
          networkStatus: 7,
          reobserve: jest.fn(),
          variables: undefined,
        } as any,
      ]);

      rerender();

      expect(result.current.loading).toBe(true);
      expect(result.current.totalCount).toBe(0);

      // Success state with data
      mockUseLazyQuery.mockReturnValueOnce([
        mockExecuteQuery,
        {
          data: {
            timeTrackingWorkers: {
              totalCount: 100,
            },
          },
          loading: false,
          error: undefined,
          called: true,
          client: {} as any,
          refetch: jest.fn(),
          fetchMore: jest.fn(),
          updateQuery: jest.fn(),
          startPolling: jest.fn(),
          stopPolling: jest.fn(),
          subscribeToMore: jest.fn(),
          observable: {} as any,
          networkStatus: 7,
          reobserve: jest.fn(),
          variables: undefined,
        } as any,
      ]);

      rerender();

      expect(result.current.loading).toBe(false);
      expect(result.current.totalCount).toBe(100);
      expect(result.current.error).toBeNull();
    });

    it('should handle complete flow: loading -> error', () => {
      // Initial state
      mockUseLazyQuery.mockReturnValueOnce([
        mockExecuteQuery,
        {
          data: undefined,
          loading: false,
          error: undefined,
          called: false,
          client: {} as any,
          refetch: jest.fn(),
          fetchMore: jest.fn(),
          updateQuery: jest.fn(),
          startPolling: jest.fn(),
          stopPolling: jest.fn(),
          subscribeToMore: jest.fn(),
          observable: {} as any,
          networkStatus: 7,
          reobserve: jest.fn(),
          variables: undefined,
        } as any,
      ]);

      const { result, rerender } = renderHook(() =>
        useWorkersTotalCount({ filter: { isActive: true } }),
      );

      // Loading state
      mockUseLazyQuery.mockReturnValueOnce([
        mockExecuteQuery,
        {
          data: undefined,
          loading: true,
          error: undefined,
          called: true,
          client: {} as any,
          refetch: jest.fn(),
          fetchMore: jest.fn(),
          updateQuery: jest.fn(),
          startPolling: jest.fn(),
          stopPolling: jest.fn(),
          subscribeToMore: jest.fn(),
          observable: {} as any,
          networkStatus: 7,
          reobserve: jest.fn(),
          variables: undefined,
        } as any,
      ]);

      rerender();

      expect(result.current.loading).toBe(true);

      // Error state
      const mockError = {
        message: 'Network error',
        name: 'ApolloError',
        graphQLErrors: [],
        networkError: null,
        extraInfo: undefined,
      };

      mockUseLazyQuery.mockReturnValueOnce([
        mockExecuteQuery,
        {
          data: undefined,
          loading: false,
          error: mockError,
          called: true,
          client: {} as any,
          refetch: jest.fn(),
          fetchMore: jest.fn(),
          updateQuery: jest.fn(),
          startPolling: jest.fn(),
          stopPolling: jest.fn(),
          subscribeToMore: jest.fn(),
          observable: {} as any,
          networkStatus: 7,
          reobserve: jest.fn(),
          variables: undefined,
        } as any,
      ]);

      rerender();

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Network error');
      expect(result.current.totalCount).toBe(0);
    });
  });
});
