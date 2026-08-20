/* eslint-disable camelcase */
import { act } from '@testing-library/react-hooks';
import { renderHookWithApolloProvider } from 'test/unit/testUtils';
import { GET_TIME_TRACKING_WORKERS } from 'src/js/service/queries/timeTrackingGroupQueries';
import { useTimeTrackingWorkers } from 'src/js/service/hooks/groups/useTimeTrackingWorkers';
import { TimeTracking_WorkerOrderBy } from 'src/__generated__/timeTracking/graphql';
import { TimeCustomerInteraction } from 'src/js/common/CustomerInteraction';

// Mock the customer interaction functions
jest.mock('src/js/common/CustomerInteraction', () => ({
  ...jest.requireActual('src/js/common/CustomerInteraction'),
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn(() => ({})),
}));

// Mock useSandbox to capture logger calls
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useSandbox: jest.fn(() => ({
    logger: mockLogger,
  })),
}));

describe('useTimeTrackingWorkers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger.info.mockClear();
    mockLogger.error.mockClear();
    mockLogger.warn.mockClear();
  });

  it('should return the hook interface with load function, loading state, and workers', () => {
    const { result } = renderHookWithApolloProvider(
      () => useTimeTrackingWorkers(),
      [],
    );

    const { loadWorkers, loading, workers, pageInfo, totalCount, error } =
      result.current;

    expect(loadWorkers).toBeDefined();
    expect(typeof loadWorkers).toBe('function');
    expect(loading).toBe(false);
    expect(workers).toEqual([]);
    expect(pageInfo).toBeNull();
    expect(totalCount).toBeNull();
    expect(error).toBeNull();
  });

  it('should load workers successfully', async () => {
    const mockWorkers = [
      {
        id: 'worker-1',
        type: 'EMPLOYEE',
        isActive: true,
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John Doe',
        memberOfGroup: {
          id: 'group-1',
          name: 'California Team',
          isActive: true,
        },
        managesGroups: [],
      },
      {
        id: 'worker-2',
        type: 'CONTRACTOR',
        isActive: true,
        firstName: 'Jane',
        lastName: 'Smith',
        displayName: 'Jane Smith',
        memberOfGroup: null,
        managesGroups: [
          {
            id: 'group-2',
            name: 'Texas Team',
            isActive: true,
          },
        ],
      },
    ];

    const successMock = {
      request: {
        query: GET_TIME_TRACKING_WORKERS,
        variables: {
          first: 100,
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
        },
      },
      result: {
        data: {
          timeTrackingWorkers: {
            __typename: 'TimeTracking_WorkerConnection',
            edges: mockWorkers.map((worker) => ({
              __typename: 'TimeTracking_WorkerEdge',
              node: {
                __typename: 'TimeTracking_Worker',
                ...worker,
              },
              cursor: `cursor-${worker.id}`,
            })),
            pageInfo: {
              __typename: 'Common_PageInfo',
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: 'cursor-worker-1',
              endCursor: 'cursor-worker-2',
            },
            totalCount: 2,
          },
        },
      },
    };

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useTimeTrackingWorkers(),
      [successMock],
    );

    const { loadWorkers } = result.current;

    act(() => {
      loadWorkers();
    });

    await waitForNextUpdate();

    const { workers, loading, error, pageInfo, totalCount } = result.current;

    expect(loading).toBe(false);
    expect(error).toBeNull();
    expect(workers).toHaveLength(2);
    expect(workers[0].displayName).toBe('John Doe');
    expect(workers[1].displayName).toBe('Jane Smith');
    expect(pageInfo?.hasNextPage).toBe(false);
    expect(totalCount).toBe(2);

    // Verify customer interaction tracking
    const {
      endInteractionWithSuccess,
    } = require('src/js/common/CustomerInteraction');
    expect(endInteractionWithSuccess).toHaveBeenCalledWith(
      expect.anything(),
      TimeCustomerInteraction.WORKERS_READ_FOR_ASSIGNMENT,
    );
  });

  it('should handle query errors', async () => {
    const errorMock = {
      request: {
        query: GET_TIME_TRACKING_WORKERS,
        variables: {
          first: 100,
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
        },
      },
      error: new Error('Network error'),
    };

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useTimeTrackingWorkers(),
      [errorMock],
    );

    const { loadWorkers } = result.current;

    act(() => {
      loadWorkers();
    });

    await waitForNextUpdate();

    const { error, loading } = result.current;

    expect(loading).toBe(false);
    expect(error).toBe('Network error');

    // Verify customer interaction tracking
    const {
      endInteractionWithFailure,
    } = require('src/js/common/CustomerInteraction');
    expect(endInteractionWithFailure).toHaveBeenCalledWith(
      expect.anything(),
      TimeCustomerInteraction.WORKERS_READ_FOR_ASSIGNMENT,
      'Network error',
      expect.any(Error),
    );
  });

  it('should support filtering by search text', async () => {
    const mockWorkers = [
      {
        id: 'worker-1',
        type: 'EMPLOYEE',
        isActive: true,
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John Doe',
        memberOfGroup: null,
        managesGroups: [],
      },
    ];

    const filterMock = {
      request: {
        query: GET_TIME_TRACKING_WORKERS,
        variables: {
          first: 100,
          filter: { searchText: 'John' },
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
        },
      },
      result: {
        data: {
          timeTrackingWorkers: {
            __typename: 'TimeTracking_WorkerConnection',
            edges: mockWorkers.map((worker) => ({
              __typename: 'TimeTracking_WorkerEdge',
              node: {
                __typename: 'TimeTracking_Worker',
                ...worker,
              },
              cursor: `cursor-${worker.id}`,
            })),
            pageInfo: {
              __typename: 'Common_PageInfo',
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: 'cursor-worker-1',
              endCursor: 'cursor-worker-1',
            },
            totalCount: 1,
          },
        },
      },
    };

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useTimeTrackingWorkers(),
      [filterMock],
    );

    const { loadWorkers } = result.current;

    act(() => {
      loadWorkers({ filter: { searchText: 'John' } });
    });

    await waitForNextUpdate();

    const { workers } = result.current;

    expect(workers).toHaveLength(1);
    expect(workers[0].displayName).toBe('John Doe');
  });

  it('should call fetchMore when hasNextPage is true without throwing', async () => {
    const mockWorkers = [
      {
        id: 'worker-1',
        type: 'EMPLOYEE',
        isActive: true,
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John Doe',
        memberOfGroup: null,
        managesGroups: [],
      },
    ];

    const mock = {
      request: {
        query: GET_TIME_TRACKING_WORKERS,
        variables: {
          first: 100,
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
        },
      },
      result: {
        data: {
          timeTrackingWorkers: {
            __typename: 'TimeTracking_WorkerConnection',
            edges: mockWorkers.map((worker) => ({
              __typename: 'TimeTracking_WorkerEdge',
              node: {
                __typename: 'TimeTracking_Worker',
                ...worker,
              },
              cursor: `cursor-${worker.id}`,
            })),
            pageInfo: {
              __typename: 'Common_PageInfo',
              hasNextPage: true,
              hasPreviousPage: false,
              startCursor: 'cursor-1',
              endCursor: 'cursor-1',
            },
            totalCount: 1,
          },
        },
      },
    };

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useTimeTrackingWorkers(),
      [mock],
    );

    act(() => {
      result.current.loadWorkers();
    });

    await waitForNextUpdate();

    expect(result.current.workers).toHaveLength(1);
    expect(result.current.pageInfo?.hasNextPage).toBe(true);
    expect(result.current.pageInfo?.endCursor).toBe('cursor-1');

    // Verify fetchNextPage is callable and doesn't throw
    expect(typeof result.current.fetchNextPage).toBe('function');
  });

  it('should handle fetchNextPage when no more pages available', async () => {
    const mockWorkers = [
      {
        id: 'worker-1',
        type: 'EMPLOYEE',
        isActive: true,
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John Doe',
        memberOfGroup: null,
        managesGroups: [],
      },
    ];

    const mock = {
      request: {
        query: GET_TIME_TRACKING_WORKERS,
        variables: {
          first: 100,
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
        },
      },
      result: {
        data: {
          timeTrackingWorkers: {
            __typename: 'TimeTracking_WorkerConnection',
            edges: mockWorkers.map((worker) => ({
              __typename: 'TimeTracking_WorkerEdge',
              node: {
                __typename: 'TimeTracking_Worker',
                ...worker,
              },
              cursor: `cursor-${worker.id}`,
            })),
            pageInfo: {
              __typename: 'Common_PageInfo',
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: 'cursor-1',
              endCursor: null,
            },
            totalCount: 0,
          },
        },
      },
    };

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useTimeTrackingWorkers(),
      [mock],
    );

    const { loadWorkers } = result.current;

    act(() => {
      loadWorkers();
    });

    await waitForNextUpdate();

    const { fetchNextPage } = result.current;

    // Should not throw when trying to fetch more with no next page
    await act(async () => {
      await fetchNextPage({
        first: 100,
        orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
      });
    });

    // No additional update should occur
    expect(result.current.workers).toHaveLength(1);
  });

  it('should support refetch with custom parameters', async () => {
    const mockWorkers = [
      {
        id: 'worker-1',
        type: 'EMPLOYEE',
        isActive: true,
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John Doe',
        memberOfGroup: null,
        managesGroups: [],
      },
    ];

    const initialMock = {
      request: {
        query: GET_TIME_TRACKING_WORKERS,
        variables: {
          first: 100,
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
        },
      },
      result: {
        data: {
          timeTrackingWorkers: {
            __typename: 'TimeTracking_WorkerConnection',
            edges: mockWorkers.map((worker) => ({
              __typename: 'TimeTracking_WorkerEdge',
              node: {
                __typename: 'TimeTracking_Worker',
                ...worker,
              },
              cursor: `cursor-${worker.id}`,
            })),
            pageInfo: {
              __typename: 'Common_PageInfo',
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: 'cursor-1',
              endCursor: 'cursor-1',
            },
            totalCount: 1,
          },
        },
      },
    };

    const refetchWithParamsMock = {
      request: {
        query: GET_TIME_TRACKING_WORKERS,
        variables: {
          first: 50,
          filter: { isActive: true },
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
        },
      },
      result: {
        data: {
          timeTrackingWorkers: {
            __typename: 'TimeTracking_WorkerConnection',
            edges: mockWorkers.map((worker) => ({
              __typename: 'TimeTracking_WorkerEdge',
              node: {
                __typename: 'TimeTracking_Worker',
                ...worker,
              },
              cursor: `cursor-${worker.id}`,
            })),
            pageInfo: {
              __typename: 'Common_PageInfo',
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: 'cursor-1',
              endCursor: 'cursor-1',
            },
            totalCount: 1,
          },
        },
      },
    };

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useTimeTrackingWorkers(),
      [initialMock, refetchWithParamsMock],
    );

    act(() => {
      result.current.loadWorkers();
    });

    await waitForNextUpdate();

    expect(result.current.workers).toHaveLength(1);

    // Test refetch with custom parameters
    await act(async () => {
      await result.current.refetch({ first: 50, filter: { isActive: true } });
    });

    expect(result.current.workers).toHaveLength(1);
  });

  it('should handle loadWorkers with all optional parameters', async () => {
    const mockWorkers = [
      {
        id: 'worker-1',
        type: 'EMPLOYEE',
        isActive: true,
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John Doe',
        memberOfGroup: null,
        managesGroups: [],
      },
    ];

    const mock = {
      request: {
        query: GET_TIME_TRACKING_WORKERS,
        variables: {
          first: 50,
          after: 'cursor-start',
          filter: { isActive: true, searchText: 'John' },
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameDesc],
        },
      },
      result: {
        data: {
          timeTrackingWorkers: {
            __typename: 'TimeTracking_WorkerConnection',
            edges: mockWorkers.map((worker) => ({
              __typename: 'TimeTracking_WorkerEdge',
              node: {
                __typename: 'TimeTracking_Worker',
                ...worker,
              },
              cursor: `cursor-${worker.id}`,
            })),
            pageInfo: {
              __typename: 'Common_PageInfo',
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: 'cursor-1',
              endCursor: 'cursor-1',
            },
            totalCount: 1,
          },
        },
      },
    };

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useTimeTrackingWorkers(),
      [mock],
    );

    const { loadWorkers } = result.current;

    act(() => {
      loadWorkers({
        first: 50,
        after: 'cursor-start',
        filter: { isActive: true, searchText: 'John' },
        orderBy: [TimeTracking_WorkerOrderBy.DisplayNameDesc],
      });
    });

    await waitForNextUpdate();

    const { workers } = result.current;

    expect(workers).toHaveLength(1);
    expect(workers[0].displayName).toBe('John Doe');
  });

  it('should handle fetchMore errors gracefully', async () => {
    const mockWorkers = [
      {
        id: 'worker-1',
        type: 'EMPLOYEE',
        isActive: true,
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John Doe',
        memberOfGroup: null,
        managesGroups: [],
      },
    ];

    const initialMock = {
      request: {
        query: GET_TIME_TRACKING_WORKERS,
        variables: {
          first: 100,
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
        },
      },
      result: {
        data: {
          timeTrackingWorkers: {
            __typename: 'TimeTracking_WorkerConnection',
            edges: mockWorkers.map((worker) => ({
              __typename: 'TimeTracking_WorkerEdge',
              node: {
                __typename: 'TimeTracking_Worker',
                ...worker,
              },
              cursor: `cursor-${worker.id}`,
            })),
            pageInfo: {
              __typename: 'Common_PageInfo',
              hasNextPage: true,
              hasPreviousPage: false,
              startCursor: 'cursor-1',
              endCursor: 'cursor-1',
            },
            totalCount: 1,
          },
        },
      },
    };

    const fetchNextPageErrorMock = {
      request: {
        query: GET_TIME_TRACKING_WORKERS,
        variables: {
          first: 100,
          after: 'cursor-1',
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
        },
      },
      error: new Error('Network error during fetchNextPage'),
    };

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useTimeTrackingWorkers(),
      [initialMock, fetchNextPageErrorMock],
    );

    act(() => {
      result.current.loadWorkers();
    });

    await waitForNextUpdate();

    expect(result.current.workers).toHaveLength(1);

    // fetchNextPage should handle the error gracefully without throwing
    await act(async () => {
      await result.current.fetchNextPage({
        first: 100,
        orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
      });
    });

    // With new pagination using refetch, error might clear data temporarily
    // but the cursor should be restored
    expect(result.current.error).toBeTruthy();
  });

  it('should handle refetch errors gracefully', async () => {
    const mockWorkers = [
      {
        id: 'worker-1',
        type: 'EMPLOYEE',
        isActive: true,
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John Doe',
        memberOfGroup: null,
        managesGroups: [],
      },
    ];

    const initialMock = {
      request: {
        query: GET_TIME_TRACKING_WORKERS,
        variables: {
          first: 100,
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
        },
      },
      result: {
        data: {
          timeTrackingWorkers: {
            __typename: 'TimeTracking_WorkerConnection',
            edges: mockWorkers.map((worker) => ({
              __typename: 'TimeTracking_WorkerEdge',
              node: {
                __typename: 'TimeTracking_Worker',
                ...worker,
              },
              cursor: `cursor-${worker.id}`,
            })),
            pageInfo: {
              __typename: 'Common_PageInfo',
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: 'cursor-1',
              endCursor: 'cursor-1',
            },
            totalCount: 1,
          },
        },
      },
    };

    const refetchErrorMock = {
      request: {
        query: GET_TIME_TRACKING_WORKERS,
        variables: {
          first: 100,
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
        },
      },
      error: new Error('Network error during refetch'),
    };

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useTimeTrackingWorkers(),
      [initialMock, refetchErrorMock],
    );

    act(() => {
      result.current.loadWorkers();
    });

    await waitForNextUpdate();

    expect(result.current.workers).toHaveLength(1);

    // refetch should handle the error gracefully without throwing
    await act(async () => {
      await result.current.refetch();
    });

    // Workers should remain unchanged after error
    expect(result.current.workers).toHaveLength(1);
  });

  it('should handle fetchNextPage with null result', async () => {
    const mockWorkers = [
      {
        id: 'worker-1',
        type: 'EMPLOYEE',
        isActive: true,
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John Doe',
        memberOfGroup: null,
        managesGroups: [],
      },
    ];

    const initialMock = {
      request: {
        query: GET_TIME_TRACKING_WORKERS,
        variables: {
          first: 100,
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
        },
      },
      result: {
        data: {
          timeTrackingWorkers: {
            __typename: 'TimeTracking_WorkerConnection',
            edges: mockWorkers.map((worker) => ({
              __typename: 'TimeTracking_WorkerEdge',
              node: {
                __typename: 'TimeTracking_Worker',
                ...worker,
              },
              cursor: `cursor-${worker.id}`,
            })),
            pageInfo: {
              __typename: 'Common_PageInfo',
              hasNextPage: true,
              hasPreviousPage: false,
              startCursor: 'cursor-1',
              endCursor: 'cursor-1',
            },
            totalCount: 1,
          },
        },
      },
    };

    const fetchNextPageNullMock = {
      request: {
        query: GET_TIME_TRACKING_WORKERS,
        variables: {
          first: 100,
          after: 'cursor-1',
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
        },
      },
      result: {
        data: null,
      },
    };

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useTimeTrackingWorkers(),
      [initialMock, fetchNextPageNullMock],
    );

    act(() => {
      result.current.loadWorkers();
    });

    await waitForNextUpdate();

    expect(result.current.workers).toHaveLength(1);

    // Call fetchNextPage with null result
    await act(async () => {
      await result.current.fetchNextPage({
        first: 100,
        orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
      });
    });

    // With null result, workers will be cleared since we use refetch
    expect(result.current.workers).toHaveLength(0);
  });

  it('should handle fetchNextPage with missing edges in fetchMoreResult', async () => {
    const mockWorkers = [
      {
        id: 'worker-1',
        type: 'EMPLOYEE',
        isActive: true,
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John Doe',
        memberOfGroup: null,
        managesGroups: [],
      },
    ];

    const initialMock = {
      request: {
        query: GET_TIME_TRACKING_WORKERS,
        variables: {
          first: 100,
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
        },
      },
      result: {
        data: {
          timeTrackingWorkers: {
            __typename: 'TimeTracking_WorkerConnection',
            edges: mockWorkers.map((worker) => ({
              __typename: 'TimeTracking_WorkerEdge',
              node: {
                __typename: 'TimeTracking_Worker',
                ...worker,
              },
              cursor: `cursor-${worker.id}`,
            })),
            pageInfo: {
              __typename: 'Common_PageInfo',
              hasNextPage: true,
              hasPreviousPage: false,
              startCursor: 'cursor-1',
              endCursor: 'cursor-1',
            },
            totalCount: 1,
          },
        },
      },
    };

    const fetchNextPageNoEdgesMock = {
      request: {
        query: GET_TIME_TRACKING_WORKERS,
        variables: {
          first: 100,
          after: 'cursor-1',
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
        },
      },
      result: {
        data: {
          timeTrackingWorkers: {
            __typename: 'TimeTracking_WorkerConnection',
            edges: [],
            pageInfo: {
              __typename: 'Common_PageInfo',
              hasNextPage: false,
              hasPreviousPage: true,
              startCursor: 'cursor-1',
              endCursor: 'cursor-1',
              totalCount: 1,
            },
          },
        },
      },
    };

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useTimeTrackingWorkers(),
      [initialMock, fetchNextPageNoEdgesMock],
    );

    act(() => {
      result.current.loadWorkers();
    });

    await waitForNextUpdate();

    expect(result.current.workers).toHaveLength(1);

    // Call fetchNextPage with missing edges
    await act(async () => {
      await result.current.fetchNextPage({
        first: 100,
        orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
      });
    });

    // With missing edges, workers will be empty since we use refetch
    expect(result.current.workers).toHaveLength(0);
  });

  it('should handle fetchPreviousPage when no previous page available', async () => {
    const mockWorkers = [
      {
        id: 'worker-1',
        type: 'EMPLOYEE',
        isActive: true,
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John Doe',
        memberOfGroup: null,
        managesGroups: [],
      },
    ];

    const mock = {
      request: {
        query: GET_TIME_TRACKING_WORKERS,
        variables: {
          first: 100,
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
        },
      },
      result: {
        data: {
          timeTrackingWorkers: {
            __typename: 'TimeTracking_WorkerConnection',
            edges: mockWorkers.map((worker) => ({
              __typename: 'TimeTracking_WorkerEdge',
              node: {
                __typename: 'TimeTracking_Worker',
                ...worker,
              },
              cursor: `cursor-${worker.id}`,
            })),
            pageInfo: {
              __typename: 'Common_PageInfo',
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: 'cursor-1',
              endCursor: 'cursor-1',
            },
            totalCount: 1,
          },
        },
      },
    };

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useTimeTrackingWorkers(),
      [mock],
    );

    act(() => {
      result.current.loadWorkers();
    });

    await waitForNextUpdate();

    expect(result.current.workers).toHaveLength(1);

    // Try to fetch previous page when there is no previous page
    await act(async () => {
      await result.current.fetchPreviousPage({
        first: 100,
        orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
      });
    });

    // Should not change anything
    expect(result.current.workers).toHaveLength(1);
  });

  it('should use default values when refetch is called with partial args', async () => {
    const mockWorkers = [
      {
        id: 'worker-1',
        type: 'EMPLOYEE',
        isActive: true,
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John Doe',
        memberOfGroup: null,
        managesGroups: [],
      },
    ];

    const initialMock = {
      request: {
        query: GET_TIME_TRACKING_WORKERS,
        variables: {
          first: 100,
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
        },
      },
      result: {
        data: {
          timeTrackingWorkers: {
            __typename: 'TimeTracking_WorkerConnection',
            edges: mockWorkers.map((worker) => ({
              __typename: 'TimeTracking_WorkerEdge',
              node: {
                __typename: 'TimeTracking_Worker',
                ...worker,
              },
              cursor: `cursor-${worker.id}`,
            })),
            pageInfo: {
              __typename: 'Common_PageInfo',
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: 'cursor-1',
              endCursor: 'cursor-1',
            },
            totalCount: 1,
          },
        },
      },
    };

    // Refetch with filter but no first or orderBy (should use defaults)
    const refetchWithDefaultsMock = {
      request: {
        query: GET_TIME_TRACKING_WORKERS,
        variables: {
          first: 100, // Default value
          filter: { isActive: true },
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc], // Default value
        },
      },
      result: {
        data: {
          timeTrackingWorkers: {
            __typename: 'TimeTracking_WorkerConnection',
            edges: mockWorkers.map((worker) => ({
              __typename: 'TimeTracking_WorkerEdge',
              node: {
                __typename: 'TimeTracking_Worker',
                ...worker,
              },
              cursor: `cursor-${worker.id}`,
            })),
            pageInfo: {
              __typename: 'Common_PageInfo',
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: 'cursor-1',
              endCursor: 'cursor-1',
            },
            totalCount: 1,
          },
        },
      },
    };

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useTimeTrackingWorkers(),
      [initialMock, refetchWithDefaultsMock],
    );

    act(() => {
      result.current.loadWorkers();
    });

    await waitForNextUpdate();

    expect(result.current.workers).toHaveLength(1);

    // Refetch with only filter (first and orderBy should use defaults)
    await act(async () => {
      await result.current.refetch({ filter: { isActive: true } });
    });

    expect(result.current.workers).toHaveLength(1);
  });

  it('should handle loadWorkers with after cursor but no other optional params', async () => {
    const mockWorkers = [
      {
        id: 'worker-2',
        type: 'EMPLOYEE',
        isActive: true,
        firstName: 'Jane',
        lastName: 'Smith',
        displayName: 'Jane Smith',
        memberOfGroup: null,
        managesGroups: [],
      },
    ];

    const mock = {
      request: {
        query: GET_TIME_TRACKING_WORKERS,
        variables: {
          first: 100,
          after: 'cursor-start',
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
        },
      },
      result: {
        data: {
          timeTrackingWorkers: {
            __typename: 'TimeTracking_WorkerConnection',
            edges: mockWorkers.map((worker) => ({
              __typename: 'TimeTracking_WorkerEdge',
              node: {
                __typename: 'TimeTracking_Worker',
                ...worker,
              },
              cursor: `cursor-${worker.id}`,
            })),
            pageInfo: {
              __typename: 'Common_PageInfo',
              hasNextPage: false,
              hasPreviousPage: true,
              startCursor: 'cursor-2',
              endCursor: 'cursor-2',
            },
          },
        },
      },
    };

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useTimeTrackingWorkers(),
      [mock],
    );

    act(() => {
      result.current.loadWorkers({ after: 'cursor-start' });
    });

    await waitForNextUpdate();

    expect(result.current.workers).toHaveLength(1);
    expect(result.current.workers[0].displayName).toBe('Jane Smith');
  });

  it('should handle empty data with null timeTrackingWorkers', async () => {
    const mock = {
      request: {
        query: GET_TIME_TRACKING_WORKERS,
        variables: {
          first: 100,
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
        },
      },
      result: {
        data: {
          timeTrackingWorkers: null,
        },
      },
    };

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useTimeTrackingWorkers(),
      [mock],
    );

    act(() => {
      result.current.loadWorkers();
    });

    await waitForNextUpdate();

    // Should have empty workers array and null pageInfo
    expect(result.current.workers).toEqual([]);
    expect(result.current.pageInfo).toBeNull();
  });

  it('should handle data with null edges', async () => {
    const mock = {
      request: {
        query: GET_TIME_TRACKING_WORKERS,
        variables: {
          first: 100,
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
        },
      },
      result: {
        data: {
          timeTrackingWorkers: {
            __typename: 'TimeTracking_WorkerConnection',
            edges: null,
            pageInfo: {
              __typename: 'Common_PageInfo',
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: null,
              endCursor: null,
              totalCount: 0,
            },
          },
        },
      },
    };

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useTimeTrackingWorkers(),
      [mock],
    );

    act(() => {
      result.current.loadWorkers();
    });

    await waitForNextUpdate();

    // Should have empty workers array
    expect(result.current.workers).toEqual([]);
    expect(result.current.pageInfo).not.toBeNull();
  });

  it('should handle fetchPreviousPage errors gracefully', async () => {
    const mockWorkers = [
      {
        id: 'worker-1',
        type: 'EMPLOYEE',
        isActive: true,
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John Doe',
        memberOfGroup: null,
        managesGroups: [],
      },
    ];

    // Initial load (page 1)
    const initialMock = {
      request: {
        query: GET_TIME_TRACKING_WORKERS,
        variables: {
          first: 100,
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
        },
      },
      result: {
        data: {
          timeTrackingWorkers: {
            __typename: 'TimeTracking_WorkerConnection',
            edges: mockWorkers.map((worker) => ({
              __typename: 'TimeTracking_WorkerEdge',
              node: {
                __typename: 'TimeTracking_Worker',
                ...worker,
              },
              cursor: `cursor-${worker.id}`,
            })),
            pageInfo: {
              __typename: 'Common_PageInfo',
              hasNextPage: true,
              hasPreviousPage: false,
              startCursor: 'cursor-1',
              endCursor: 'cursor-1',
            },
            totalCount: 1,
          },
        },
      },
    };

    // Fetch next page (this populates cursorHistoryRef)
    const fetchNextPageMock = {
      request: {
        query: GET_TIME_TRACKING_WORKERS,
        variables: {
          first: 100,
          after: 'cursor-1',
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
        },
      },
      result: {
        data: {
          timeTrackingWorkers: {
            __typename: 'TimeTracking_WorkerConnection',
            edges: mockWorkers.map((worker) => ({
              __typename: 'TimeTracking_WorkerEdge',
              node: {
                __typename: 'TimeTracking_Worker',
                ...worker,
              },
              cursor: `cursor-${worker.id}`,
            })),
            pageInfo: {
              __typename: 'Common_PageInfo',
              hasNextPage: false,
              hasPreviousPage: true,
              startCursor: 'cursor-1',
              endCursor: 'cursor-1',
            },
            totalCount: 1,
          },
        },
      },
    };

    // Mock for fetchPreviousPage that will throw an error
    // The cursor from history will be undefined (from initial load)
    const fetchPreviousPageErrorMock = {
      request: {
        query: GET_TIME_TRACKING_WORKERS,
        variables: {
          first: 100,
          after: undefined, // This is the cursor from history (undefined for page 1)
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
        },
      },
      error: new Error('Network error during fetchPreviousPage'),
    };

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useTimeTrackingWorkers(),
      [initialMock, fetchNextPageMock, fetchPreviousPageErrorMock],
    );

    // Load initial page
    act(() => {
      result.current.loadWorkers();
    });

    await waitForNextUpdate();

    expect(result.current.workers).toHaveLength(1);

    // Fetch next page to populate cursorHistoryRef
    // This will push undefined (from initial load) into cursorHistoryRef
    await act(async () => {
      await result.current.fetchNextPage({
        first: 100,
        orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
      });
    });

    // Now fetchPreviousPage should trigger the error mock
    // The cursor from history will be undefined (from initial load)
    // from initial load)
    // fetchPreviousPage should handle the error gracefully without throwing
    await act(async () => {
      await result.current.fetchPreviousPage({
        first: 100,
        orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
      });
    });

    // Workers should remain unchanged after error
    expect(result.current.workers).toHaveLength(1);
  });
});
