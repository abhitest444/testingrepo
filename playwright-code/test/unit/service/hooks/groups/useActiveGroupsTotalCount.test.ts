import { renderHook, act } from '@testing-library/react-hooks';
import {
  useGetActiveGroupsTotalCountLazyQuery,
  TimeTracking_GroupFilter,
} from 'src/__generated__/timeTracking/graphql';
import { useActiveGroupsTotalCount } from 'src/js/service/hooks/groups/useActiveGroupsTotalCount';

// Mock the lazy query hook
jest.mock('src/__generated__/timeTracking/graphql', () => ({
  useGetActiveGroupsTotalCountLazyQuery: jest.fn(),
}));

describe('useActiveGroupsTotalCount', () => {
  const mockExecuteQuery = jest.fn();
  const mockUseLazyQuery =
    useGetActiveGroupsTotalCountLazyQuery as jest.MockedFunction<
      typeof useGetActiveGroupsTotalCountLazyQuery
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
      const { result } = renderHook(() => useActiveGroupsTotalCount());

      expect(result.current).toHaveProperty('totalActiveGroupCount');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('executeQuery');
      expect(typeof result.current.executeQuery).toBe('function');
    });

    it('should return default values when no data is available', () => {
      const { result } = renderHook(() => useActiveGroupsTotalCount());

      expect(result.current.totalActiveGroupCount).toBe(0);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Data Extraction', () => {
    it('should extract totalActiveGroupCount from data correctly', () => {
      mockUseLazyQuery.mockReturnValue([
        mockExecuteQuery,
        {
          data: {
            timeTrackingGroups: {
              totalActiveGroupCount: 25,
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

      const { result } = renderHook(() => useActiveGroupsTotalCount());

      expect(result.current.totalActiveGroupCount).toBe(25);
    });

    it('should return 0 when totalActiveGroupCount is null', () => {
      mockUseLazyQuery.mockReturnValue([
        mockExecuteQuery,
        {
          data: {
            timeTrackingGroups: {
              totalActiveGroupCount: null as any,
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

      const { result } = renderHook(() => useActiveGroupsTotalCount());

      expect(result.current.totalActiveGroupCount).toBe(0);
    });

    it('should return 0 when data is null', () => {
      mockUseLazyQuery.mockReturnValue([
        mockExecuteQuery,
        {
          data: null,
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

      const { result } = renderHook(() => useActiveGroupsTotalCount());

      expect(result.current.totalActiveGroupCount).toBe(0);
    });

    it('should return 0 when timeTrackingGroups is undefined', () => {
      mockUseLazyQuery.mockReturnValue([
        mockExecuteQuery,
        {
          data: {
            timeTrackingGroups: undefined,
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

      const { result } = renderHook(() => useActiveGroupsTotalCount());

      expect(result.current.totalActiveGroupCount).toBe(0);
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

      const { result } = renderHook(() => useActiveGroupsTotalCount());

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
          data: null,
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

      const { result } = renderHook(() => useActiveGroupsTotalCount());

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
          data: null,
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

      const { result } = renderHook(() => useActiveGroupsTotalCount());

      expect(result.current.error).toBeNull();
    });
  });

  describe('executeQuery Function', () => {
    it('should call executeQuery with filter from options', () => {
      const filter: TimeTracking_GroupFilter = { isActive: true };

      const { result } = renderHook(() =>
        useActiveGroupsTotalCount({ filter }),
      );

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
      const { result } = renderHook(() => useActiveGroupsTotalCount());

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
      const initialFilter: TimeTracking_GroupFilter = {
        isActive: true,
      };

      const { result, rerender } = renderHook(
        ({ filter }) => useActiveGroupsTotalCount({ filter }),
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

      const newFilter: TimeTracking_GroupFilter = {
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
      const filter: TimeTracking_GroupFilter = { isActive: true };

      const { result, rerender } = renderHook(
        ({ filter }) => useActiveGroupsTotalCount({ filter }),
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
      const initialFilter: TimeTracking_GroupFilter = {
        isActive: true,
      };

      const { result, rerender } = renderHook(
        ({ filter }) => useActiveGroupsTotalCount({ filter }),
        {
          initialProps: { filter: initialFilter },
        },
      );

      const firstExecuteQuery = result.current.executeQuery;

      const newFilter: TimeTracking_GroupFilter = {
        isActive: false,
      };

      rerender({ filter: newFilter });

      const secondExecuteQuery = result.current.executeQuery;

      expect(firstExecuteQuery).not.toBe(secondExecuteQuery);
    });
  });

  describe('Query Configuration', () => {
    it('should configure lazy query with cache-and-network fetch policy', () => {
      renderHook(() => useActiveGroupsTotalCount());

      expect(mockUseLazyQuery).toHaveBeenCalledWith({
        fetchPolicy: 'cache-and-network',
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle filter with all properties', () => {
      const filter: TimeTracking_GroupFilter = {
        isActive: true,
        ids: ['group-1', 'group-2'],
        searchText: 'test search',
      };

      const { result } = renderHook(() =>
        useActiveGroupsTotalCount({ filter }),
      );

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
          data: null,
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
        useActiveGroupsTotalCount({ filter: { isActive: true } }),
      );

      expect(result.current.loading).toBe(false);
      expect(result.current.totalActiveGroupCount).toBe(0);

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
      expect(result.current.totalActiveGroupCount).toBe(0);

      // Success state with data
      mockUseLazyQuery.mockReturnValueOnce([
        mockExecuteQuery,
        {
          data: {
            timeTrackingGroups: {
              totalActiveGroupCount: 50,
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
      expect(result.current.totalActiveGroupCount).toBe(50);
      expect(result.current.error).toBeNull();
    });

    it('should handle complete flow: loading -> error', () => {
      // Initial state
      mockUseLazyQuery.mockReturnValueOnce([
        mockExecuteQuery,
        {
          data: null,
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
        useActiveGroupsTotalCount({ filter: { isActive: true } }),
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
          data: null,
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
      expect(result.current.totalActiveGroupCount).toBe(0);
    });
  });
});
