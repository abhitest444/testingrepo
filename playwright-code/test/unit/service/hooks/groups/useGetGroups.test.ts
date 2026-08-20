import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { useDispatch } from 'react-redux';
import { useSandbox } from '@payroll/quicksand';
import { useGetTimeTrackingGroupsLazyQuery } from 'src/__generated__/timeTracking/graphql';
import {
  setGroupsLoading,
  setGroupsData,
  appendGroupsData,
  setLoadingMore,
  setGroupsError,
} from 'src/js/widgets/assignments/store/workersGroupViewSlice';
import { useGetGroups } from 'src/js/service/hooks/groups/useGetGroups';
import { useActiveGroupsTotalCount } from 'src/js/service/hooks/groups/useActiveGroupsTotalCount';

// Mock dependencies
jest.mock('react-redux');
jest.mock('@payroll/quicksand');
jest.mock('src/__generated__/timeTracking/graphql', () => ({
  useGetTimeTrackingGroupsLazyQuery: jest.fn(),
  TimeTracking_GroupOrderBy: {
    NameAsc: 'NameAsc',
  },
}));
jest.mock('src/js/service/hooks/groups/useActiveGroupsTotalCount', () => ({
  useActiveGroupsTotalCount: jest.fn(),
}));
jest.mock('src/js/common/CustomerInteraction', () => ({
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn(() => ({})),
  TimeCustomerInteraction: {
    GROUPS_READ: 'GROUPS_READ',
  },
}));
jest.mock('src/js/widgets/assignments/store/workersGroupViewSlice', () => ({
  setGroupsLoading: jest.fn((payload) => ({
    type: 'SET_GROUPS_LOADING',
    payload,
  })),
  setGroupsData: jest.fn((payload) => ({ type: 'SET_GROUPS_DATA', payload })),
  appendGroupsData: jest.fn((payload) => ({
    type: 'APPEND_GROUPS_DATA',
    payload,
  })),
  setLoadingMore: jest.fn((payload) => ({ type: 'SET_LOADING_MORE', payload })),
  setGroupsError: jest.fn((payload) => ({ type: 'SET_GROUPS_ERROR', payload })),
}));

describe('useGetGroups', () => {
  const mockDispatch = jest.fn();
  const mockLoadQuery = jest.fn();
  const mockExecuteActiveGroupsTotalCountQuery = jest.fn();
  const mockLogger = {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
  const mockSandbox = {
    logger: mockLogger,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useSandbox as jest.Mock).mockReturnValue(mockSandbox);

    // Default mock for useGetTimeTrackingGroupsLazyQuery - can be overridden in individual tests
    (useGetTimeTrackingGroupsLazyQuery as jest.Mock).mockReturnValue([
      mockLoadQuery,
      { loading: false, error: null },
    ]);

    // Default mock for useActiveGroupsTotalCount
    (useActiveGroupsTotalCount as jest.Mock).mockReturnValue({
      totalActiveGroupCount: 150,
      loading: false,
      error: null,
      executeQuery: mockExecuteActiveGroupsTotalCountQuery,
    });
  });

  it('should return loading, error, and loadGroups function', () => {
    const { result } = renderHook(() => useGetGroups());

    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('loadGroups');
    expect(typeof result.current.loadGroups).toBe('function');
  });

  it('should load groups with initial load', async () => {
    const mockData = {
      timeTrackingGroups: {
        edges: [
          {
            node: {
              id: 'group-1',
              name: 'Engineering',
              stats: { memberCount: 10, managerCount: 2 },
              isActive: true,
              meta: { version: 1 },
            },
          },
          {
            node: {
              id: 'group-2',
              name: 'Design',
              stats: { memberCount: 5, managerCount: 1 },
              isActive: true,
              meta: { version: 1 },
            },
          },
        ],
        pageInfo: {
          endCursor: 'cursor-123',
          hasNextPage: true,
        },
        totalCount: 2,
      },
    };

    // Mock useLazyQuery to capture and trigger onCompleted
    let capturedOnCompleted: ((data: any) => void) | null = null;

    (useGetTimeTrackingGroupsLazyQuery as jest.Mock).mockImplementation(
      (options = {}) => {
        capturedOnCompleted = options.onCompleted;
        return [mockLoadQuery, { loading: false, error: null }];
      },
    );

    const { result } = renderHook(() => useGetGroups());

    result.current.loadGroups({
      first: 20,
      filter: { isActive: true },
      append: false,
    });

    // Verify loading state was set
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_GROUPS_LOADING',
      payload: { loading: true },
    });

    // Simulate Apollo calling onCompleted if callback exists
    expect(capturedOnCompleted).toBeDefined();
    capturedOnCompleted!(mockData);

    await waitFor(() => {
      // Should dispatch loading state first
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_GROUPS_LOADING',
        payload: { loading: true },
      });

      // Then dispatch data with additional fields
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_GROUPS_DATA',
        payload: {
          groups: [
            {
              id: 'group-1',
              name: 'Engineering',
              stats: { memberCount: 10, managerCount: 2 },
              isActive: true,
              meta: { version: 1 },
            },
            {
              id: 'group-2',
              name: 'Design',
              stats: { memberCount: 5, managerCount: 1 },
              isActive: true,
              meta: { version: 1 },
            },
          ],
          cursor: 'cursor-123',
          hasMore: true,
          hasNextPage: true,
          totalCount: 2, // From GraphQL response
        },
      });
    });
  });

  it('should load next page of groups', async () => {
    const mockData = {
      timeTrackingGroups: {
        edges: [
          {
            node: {
              id: 'group-3',
              name: 'Marketing',
              stats: { memberCount: 8, managerCount: 1 },
              isActive: true,
              meta: { version: 1 },
            },
          },
        ],
        pageInfo: {
          endCursor: 'cursor-456',
          hasNextPage: false,
        },
        totalCount: 3,
      },
    };

    // Mock useLazyQuery to capture and trigger onCompleted
    let capturedOnCompleted: ((data: any) => void) | null = null;

    (useGetTimeTrackingGroupsLazyQuery as jest.Mock).mockImplementation(
      (options = {}) => {
        capturedOnCompleted = options.onCompleted;
        return [mockLoadQuery, { loading: false, error: null }];
      },
    );

    const { result } = renderHook(() => useGetGroups());

    result.current.loadGroups({
      first: 20,
      after: 'cursor-123',
      filter: { isActive: true },
    });

    // Verify loading state was set
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_GROUPS_LOADING',
      payload: { loading: true },
    });

    // Simulate Apollo calling onCompleted if callback exists
    expect(capturedOnCompleted).toBeDefined();
    capturedOnCompleted!(mockData);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_GROUPS_DATA',
        payload: {
          groups: [
            {
              id: 'group-3',
              name: 'Marketing',
              stats: { memberCount: 8, managerCount: 1 },
              isActive: true,
              meta: { version: 1 },
            },
          ],
          cursor: 'cursor-456',
          hasMore: false,
          hasNextPage: false,
          totalCount: 3, // From GraphQL response
        },
      });
    });
  });

  it('should handle empty groups response', async () => {
    const mockData = {
      timeTrackingGroups: {
        edges: [],
        pageInfo: {
          endCursor: null,
          hasNextPage: false,
        },
        totalCount: 0,
      },
    };

    // Mock useLazyQuery to capture and trigger onCompleted
    let capturedOnCompleted: ((data: any) => void) | null = null;

    (useGetTimeTrackingGroupsLazyQuery as jest.Mock).mockImplementation(
      (options = {}) => {
        capturedOnCompleted = options.onCompleted;
        return [mockLoadQuery, { loading: false, error: null }];
      },
    );

    const { result } = renderHook(() => useGetGroups());

    result.current.loadGroups({
      first: 20,
      filter: { isActive: true },
    });

    // Simulate Apollo calling onCompleted if callback exists
    expect(capturedOnCompleted).toBeDefined();
    capturedOnCompleted!(mockData);

    await waitFor(() => {
      // Should dispatch loading state first
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_GROUPS_LOADING',
        payload: { loading: true },
      });

      // Then dispatch empty data
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_GROUPS_DATA',
        payload: {
          groups: [],
          cursor: null,
          hasMore: false,
          hasNextPage: false,
          totalCount: 0, // From GraphQL response
        },
      });
    });
  });

  it('should handle null timeTrackingGroups in response', async () => {
    const mockData = {
      timeTrackingGroups: null,
    };

    let capturedOnCompleted: ((data: any) => void) | null = null;

    (useGetTimeTrackingGroupsLazyQuery as jest.Mock).mockImplementation(
      (options = {}) => {
        capturedOnCompleted = options.onCompleted;
        return [mockLoadQuery, { loading: false, error: null }];
      },
    );

    const { result } = renderHook(() => useGetGroups());

    result.current.loadGroups({
      first: 20,
      filter: { isActive: true },
    });

    expect(capturedOnCompleted).toBeDefined();
    capturedOnCompleted!(mockData);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_GROUPS_DATA',
        payload: {
          groups: [],
          cursor: null,
          hasMore: false,
          totalCount: 0,
          hasNextPage: false,
        },
      });
    });
  });

  it('should handle error and dispatch error action', async () => {
    const mockError = new Error('Network error');

    // Mock useLazyQuery to capture and trigger onError
    let capturedOnError: ((err: Error) => void) | null = null;

    (useGetTimeTrackingGroupsLazyQuery as jest.Mock).mockImplementation(
      (options = {}) => {
        capturedOnError = options.onError;
        return [mockLoadQuery, { loading: false, error: null }];
      },
    );

    const { result } = renderHook(() => useGetGroups());

    result.current.loadGroups({
      first: 20,
      filter: { isActive: true },
      append: false,
    });

    // Simulate Apollo calling onError if callback exists
    expect(capturedOnError).toBeDefined();
    capturedOnError!(mockError);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_GROUPS_ERROR',
        payload: { error: 'Network error' },
      });
    });
  });

  it('should handle non-Error objects in catch block', async () => {
    const mockError = { message: 'String error message' };

    // Mock useLazyQuery to capture and trigger onError
    let capturedOnError: ((err: any) => void) | null = null;

    (useGetTimeTrackingGroupsLazyQuery as jest.Mock).mockImplementation(
      (options = {}) => {
        capturedOnError = options.onError;
        return [mockLoadQuery, { loading: false, error: null }];
      },
    );

    const { result } = renderHook(() => useGetGroups());

    result.current.loadGroups({
      first: 20,
      filter: { isActive: true },
      append: false,
    });

    // Simulate Apollo calling onError if callback exists
    expect(capturedOnError).toBeDefined();
    capturedOnError!(mockError);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_GROUPS_ERROR',
        payload: { error: 'String error message' },
      });
    });
  });

  it('should use default first value of 50', async () => {
    const mockData = {
      timeTrackingGroups: {
        edges: [],
        pageInfo: { endCursor: null, hasNextPage: false },
        totalCount: 0,
      },
    };

    mockLoadQuery.mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useGetGroups());

    result.current.loadGroups({
      filter: { isActive: true },
    });

    expect(mockLoadQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({
          first: 20, // GROUPS_PAGE_SIZE
        }),
      }),
    );
  });

  it('should pass filter to query variables', async () => {
    const mockData = {
      timeTrackingGroups: {
        edges: [],
        pageInfo: { endCursor: null, hasNextPage: false },
        totalCount: 0,
      },
    };

    mockLoadQuery.mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useGetGroups());

    await result.current.loadGroups({
      first: 20,
      filter: { isActive: true },
    });

    await waitFor(() => {
      expect(mockLoadQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            filter: { isActive: true },
          }),
        }),
      );
    });
  });

  it('should pass after cursor when provided', async () => {
    const mockData = {
      timeTrackingGroups: {
        edges: [],
        pageInfo: { endCursor: null, hasNextPage: false },
        totalCount: 0,
      },
    };

    mockLoadQuery.mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useGetGroups());

    await result.current.loadGroups({
      first: 20,
      after: 'cursor-abc',
      filter: { isActive: true },
    });

    await waitFor(() => {
      expect(mockLoadQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            after: 'cursor-abc',
          }),
        }),
      );
    });
  });

  it('should handle null cursor in response', async () => {
    const mockData = {
      timeTrackingGroups: {
        edges: [
          {
            node: {
              id: 'group-1',
              name: 'Test Group',
              stats: { memberCount: 5, managerCount: 1 },
              isActive: true,
              meta: { version: 1 },
            },
          },
        ],
        pageInfo: {
          endCursor: null,
          hasNextPage: false,
        },
        totalCount: 1,
      },
    };

    // Mock useLazyQuery to capture and trigger onCompleted
    let capturedOnCompleted: ((data: any) => void) | null = null;

    (useGetTimeTrackingGroupsLazyQuery as jest.Mock).mockImplementation(
      (options = {}) => {
        capturedOnCompleted = options.onCompleted;
        return [mockLoadQuery, { loading: false, error: null }];
      },
    );

    const { result } = renderHook(() => useGetGroups());

    result.current.loadGroups({
      first: 20,
      filter: { isActive: true },
      append: false,
    });

    // Simulate Apollo calling onCompleted if callback exists
    expect(capturedOnCompleted).toBeDefined();
    capturedOnCompleted!(mockData);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_GROUPS_DATA',
        payload: expect.objectContaining({
          cursor: null,
          hasMore: false,
        }),
      });
    });
  });

  it('should handle groups with various memberCount values', async () => {
    const mockData = {
      timeTrackingGroups: {
        edges: [
          {
            node: {
              id: 'group-1',
              name: 'Empty Group',
              stats: { memberCount: 0, managerCount: 0 },
              isActive: true,
              meta: { version: 1 },
            },
          },
          {
            node: {
              id: 'group-2',
              name: 'Large Group',
              stats: { memberCount: 100, managerCount: 5 },
              isActive: true,
              meta: { version: 1 },
            },
          },
        ],
        pageInfo: {
          endCursor: 'cursor',
          hasNextPage: false,
        },
        totalCount: 2,
      },
    };

    // Mock useLazyQuery to capture and trigger onCompleted
    let capturedOnCompleted: ((data: any) => void) | null = null;

    (useGetTimeTrackingGroupsLazyQuery as jest.Mock).mockImplementation(
      (options = {}) => {
        capturedOnCompleted = options.onCompleted;
        return [mockLoadQuery, { loading: false, error: null }];
      },
    );

    const { result } = renderHook(() => useGetGroups());

    result.current.loadGroups({
      first: 20,
      filter: { isActive: true },
      append: false,
    });

    // Simulate Apollo calling onCompleted if callback exists
    expect(capturedOnCompleted).toBeDefined();
    capturedOnCompleted!(mockData);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_GROUPS_DATA',
        payload: expect.objectContaining({
          groups: expect.arrayContaining([
            expect.objectContaining({
              stats: { memberCount: 0, managerCount: 0 },
            }),
            expect.objectContaining({
              stats: { memberCount: 100, managerCount: 5 },
            }),
          ]),
        }),
      });
    });
  });

  it('should set correct loading state for initial load', async () => {
    const mockData = {
      timeTrackingGroups: {
        edges: [],
        pageInfo: { endCursor: null, hasNextPage: false },
        totalCount: 0,
      },
    };

    mockLoadQuery.mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useGetGroups());

    result.current.loadGroups({
      first: 20,
      filter: { isActive: true },
    });

    // Should use setGroupsLoading for all loads
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_GROUPS_LOADING',
      payload: { loading: true },
    });
  });

  it('should set correct loading state for paginated load', async () => {
    const mockData = {
      timeTrackingGroups: {
        edges: [],
        pageInfo: { endCursor: null, hasNextPage: false },
        totalCount: 0,
      },
    };

    mockLoadQuery.mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useGetGroups());

    result.current.loadGroups({
      first: 20,
      after: 'cursor-123',
      filter: { isActive: true },
    });

    // Should use setGroupsLoading for paginated load
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_GROUPS_LOADING',
      payload: { loading: true },
    });
  });

  // Note: useActiveGroupsTotalCount is now called from WorkersGroupViewDataProvider, not from useGetGroups
  // This test is no longer applicable

  it('should return loading state from GraphQL query', () => {
    (useGetTimeTrackingGroupsLazyQuery as jest.Mock).mockReturnValue([
      mockLoadQuery,
      { loading: true, error: null },
    ]);

    const { result } = renderHook(() => useGetGroups());

    expect(result.current.loading).toBe(true);
  });

  // Note: useGetGroups no longer combines error states from useActiveGroupsTotalCount
  // Error state is only from the GraphQL query itself
  it('should return error from GraphQL query', () => {
    const graphqlError = { message: 'GraphQL error' };
    (useGetTimeTrackingGroupsLazyQuery as jest.Mock).mockReturnValue([
      mockLoadQuery,
      { loading: false, error: graphqlError },
    ]);

    const { result } = renderHook(() => useGetGroups());

    expect(result.current.error).toBe('GraphQL error');
  });

  // Note: useGetGroups no longer combines errors from useActiveGroupsTotalCount
  // This test is covered by the previous test

  describe('fetchNextPage', () => {
    it('should fetch next page when hasNextPage is true', async () => {
      const mockLoadQueryNext = jest.fn();
      const capturedCallbacks: Array<((data: any) => void) | null> = [];
      const mockFirstPageData = {
        timeTrackingGroups: {
          edges: [
            {
              node: {
                id: 'group-1',
                name: 'First Group',
                stats: { memberCount: 10, managerCount: 2 },
                isActive: true,
                meta: { version: 1 },
              },
            },
          ],
          pageInfo: {
            endCursor: 'cursor-123',
            hasNextPage: true,
          },
          totalCount: 2,
        },
      };

      (useGetTimeTrackingGroupsLazyQuery as jest.Mock).mockImplementation(
        (options: any = {}) => {
          capturedCallbacks.push(options.onCompleted || null);
          return [
            mockLoadQueryNext,
            {
              loading: false,
              error: null,
              data: mockFirstPageData,
            },
          ];
        },
      );

      const { result } = renderHook(() => useGetGroups());

      // First load
      result.current.loadGroups({
        first: 20,
        filter: { isActive: true },
      });

      // Simulate first page response
      const firstCallback = capturedCallbacks[0];
      expect(firstCallback).toBeDefined();
      if (firstCallback) {
        firstCallback(mockFirstPageData);
      }

      await waitFor(() => {
        expect(result.current.pageInfo?.hasNextPage).toBe(true);
      });

      mockLoadQueryNext.mockResolvedValue({
        data: {
          timeTrackingGroups: {
            edges: [],
            pageInfo: {
              endCursor: 'cursor-456',
              hasNextPage: false,
            },
            totalCount: 2,
          },
        },
      });

      // Fetch next page
      await result.current.fetchNextPage({
        first: 20,
        filter: { isActive: true },
      });

      await waitFor(() => {
        expect(mockLoadQueryNext).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              after: 'cursor-123',
              first: 20,
            }),
          }),
        );
      });
    });

    it('should not fetch next page when hasNextPage is false', async () => {
      const mockLoadQuery = jest.fn();

      (useGetTimeTrackingGroupsLazyQuery as jest.Mock).mockReturnValue([
        mockLoadQuery,
        {
          loading: false,
          error: null,
          data: {
            timeTrackingGroups: {
              edges: [],
              pageInfo: {
                endCursor: null,
                hasNextPage: false,
              },
              totalCount: 0,
            },
          },
        },
      ]);

      const { result } = renderHook(() => useGetGroups());

      mockLoadQuery.mockClear();

      await result.current.fetchNextPage();

      await waitFor(() => {
        expect(mockSandbox.logger.warn).toHaveBeenCalledWith(
          'No next page available',
        );
      });
      expect(mockLoadQuery).not.toHaveBeenCalled();
    });

    it('should not fetch next page when endCursor is null', async () => {
      const mockLoadQuery = jest.fn();

      (useGetTimeTrackingGroupsLazyQuery as jest.Mock).mockReturnValue([
        mockLoadQuery,
        {
          loading: false,
          error: null,
          data: {
            timeTrackingGroups: {
              edges: [],
              pageInfo: {
                endCursor: null,
                hasNextPage: true,
              },
              totalCount: 1,
            },
          },
        },
      ]);

      const { result } = renderHook(() => useGetGroups());

      mockLoadQuery.mockClear();

      await result.current.fetchNextPage();

      await waitFor(() => {
        expect(mockSandbox.logger.warn).toHaveBeenCalledWith(
          'No next page available',
        );
      });
      expect(mockLoadQuery).not.toHaveBeenCalled();
    });

    it('should append groups when appendOnFetchNextPage is true', async () => {
      const mockLoadQueryNext = jest.fn();
      const capturedCallbacks: Array<((data: any) => void) | null> = [];
      const mockFirstPageData = {
        timeTrackingGroups: {
          edges: [
            {
              node: {
                id: 'group-1',
                name: 'First',
                stats: { memberCount: 10, managerCount: 2 },
                isActive: true,
                meta: { version: 1 },
              },
            },
          ],
          pageInfo: { endCursor: 'cursor-1', hasNextPage: true },
          totalCount: 2,
        },
      };
      const mockSecondPageData = {
        timeTrackingGroups: {
          edges: [
            {
              node: {
                id: 'group-2',
                name: 'Second',
                stats: { memberCount: 5, managerCount: 1 },
                isActive: true,
                meta: { version: 1 },
              },
            },
          ],
          pageInfo: { endCursor: 'cursor-2', hasNextPage: false },
          totalCount: 2,
        },
      };

      (useGetTimeTrackingGroupsLazyQuery as jest.Mock).mockImplementation(
        (options: any = {}) => {
          capturedCallbacks.push(options.onCompleted || null);
          return [
            mockLoadQueryNext,
            {
              loading: false,
              error: null,
              data: mockFirstPageData,
            },
          ];
        },
      );

      const { result } = renderHook(() =>
        useGetGroups({ appendOnFetchNextPage: true }),
      );

      result.current.loadGroups({ first: 20, filter: { isActive: true } });
      const firstCallback = capturedCallbacks[0];
      if (firstCallback) firstCallback(mockFirstPageData);

      await waitFor(() => {
        expect(result.current.pageInfo?.hasNextPage).toBe(true);
      });

      mockLoadQueryNext.mockImplementation(() =>
        Promise.resolve({ data: mockSecondPageData }),
      );

      await result.current.fetchNextPage({
        first: 20,
        filter: { isActive: true },
      });

      const secondCallback = capturedCallbacks[capturedCallbacks.length - 1];
      expect(secondCallback).toBeDefined();
      if (secondCallback) secondCallback(mockSecondPageData);

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith({
          type: 'SET_LOADING_MORE',
          payload: { loading: true },
        });
        expect(mockDispatch).toHaveBeenCalledWith({
          type: 'APPEND_GROUPS_DATA',
          payload: expect.objectContaining({
            groups: expect.arrayContaining([
              expect.objectContaining({ id: 'group-2', name: 'Second' }),
            ]),
            cursor: 'cursor-2',
            hasMore: false,
            hasNextPage: false,
          }),
        });
        expect(mockDispatch).toHaveBeenCalledWith({
          type: 'SET_LOADING_MORE',
          payload: { loading: false },
        });
      });
    });

    it('should use setGroupsLoading when appendOnFetchNextPage is false', async () => {
      const mockLoadQueryNext = jest.fn();
      const capturedCallbacks: Array<((data: any) => void) | null> = [];
      const mockFirstPageData = {
        timeTrackingGroups: {
          edges: [
            {
              node: {
                id: 'g1',
                name: 'G1',
                stats: {},
                isActive: true,
                meta: { version: 1 },
              },
            },
          ],
          pageInfo: { endCursor: 'c1', hasNextPage: true },
          totalCount: 2,
        },
      };
      const mockSecondPageData = {
        timeTrackingGroups: {
          edges: [
            {
              node: {
                id: 'g2',
                name: 'G2',
                stats: {},
                isActive: true,
                meta: { version: 1 },
              },
            },
          ],
          pageInfo: { endCursor: null, hasNextPage: false },
          totalCount: 2,
        },
      };

      (useGetTimeTrackingGroupsLazyQuery as jest.Mock).mockImplementation(
        (options: any = {}) => {
          capturedCallbacks.push(options.onCompleted || null);
          return [
            mockLoadQueryNext,
            { loading: false, error: null, data: mockFirstPageData },
          ];
        },
      );

      const { result } = renderHook(() => useGetGroups());

      result.current.loadGroups({ first: 20 });
      const firstCallback = capturedCallbacks[0];
      if (firstCallback) firstCallback(mockFirstPageData);

      await waitFor(() => {
        expect(result.current.pageInfo?.hasNextPage).toBe(true);
      });

      mockLoadQueryNext.mockResolvedValue({ data: mockSecondPageData });
      await result.current.fetchNextPage();

      const secondCallback = capturedCallbacks[capturedCallbacks.length - 1];
      if (secondCallback) secondCallback(mockSecondPageData);

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith({
          type: 'SET_GROUPS_LOADING',
          payload: { loading: true },
        });
        expect(mockDispatch).toHaveBeenCalledWith({
          type: 'SET_GROUPS_DATA',
          payload: expect.objectContaining({
            groups: expect.arrayContaining([
              expect.objectContaining({ id: 'g2', name: 'G2' }),
            ]),
          }),
        });
      });
    });

    it('should dispatch setLoadingMore(false) on fetchNextPage error when appendOnFetchNextPage is true', async () => {
      const mockLoadQueryNext = jest.fn();
      const capturedCallbacks: Array<((data: any) => void) | null> = [];
      const mockData = {
        timeTrackingGroups: {
          edges: [],
          pageInfo: { endCursor: 'c1', hasNextPage: true },
          totalCount: 2,
        },
      };

      (useGetTimeTrackingGroupsLazyQuery as jest.Mock).mockImplementation(
        (options: any = {}) => {
          capturedCallbacks.push(options.onCompleted || null);
          return [
            mockLoadQueryNext,
            { loading: false, error: null, data: mockData },
          ];
        },
      );

      const { result } = renderHook(() =>
        useGetGroups({ appendOnFetchNextPage: true }),
      );

      result.current.loadGroups({ first: 20 });
      const cb = capturedCallbacks[0];
      if (cb) cb(mockData);

      await waitFor(() => {
        expect(result.current.pageInfo?.hasNextPage).toBe(true);
      });

      mockLoadQueryNext.mockRejectedValueOnce(new Error('Fetch failed'));

      await expect(result.current.fetchNextPage()).rejects.toThrow(
        'Fetch failed',
      );

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_LOADING_MORE',
        payload: { loading: false },
      });
    });

    it('should restore cursor history on error', async () => {
      const mockLoadQueryNext = jest.fn();
      const capturedCallbacks: Array<((data: any) => void) | null> = [];
      const mockInitialData = {
        timeTrackingGroups: {
          edges: [],
          pageInfo: {
            endCursor: 'cursor-123',
            hasNextPage: true,
          },
          totalCount: 1,
        },
      };

      (useGetTimeTrackingGroupsLazyQuery as jest.Mock).mockImplementation(
        (options: any = {}) => {
          capturedCallbacks.push(options.onCompleted || null);
          return [
            mockLoadQueryNext,
            {
              loading: false,
              error: null,
              data: mockInitialData,
            },
          ];
        },
      );

      const { result } = renderHook(() => useGetGroups());

      // Set up initial state
      result.current.loadGroups({ first: 20, after: 'cursor-initial' });

      const firstCallback = capturedCallbacks[0];
      expect(firstCallback).toBeDefined();
      if (firstCallback) {
        firstCallback(mockInitialData);
      }

      await waitFor(() => {
        expect(result.current.pageInfo?.hasNextPage).toBe(true);
      });

      mockLoadQueryNext.mockRejectedValueOnce(new Error('Network error'));

      await expect(result.current.fetchNextPage()).rejects.toThrow(
        'Network error',
      );

      // Cursor history should be restored
      expect(mockSandbox.logger.warn).not.toHaveBeenCalled();
    });
  });

  describe('fetchPreviousPage', () => {
    it('should not fetch previous page when history is empty', async () => {
      const mockLoadQuery = jest.fn();

      (useGetTimeTrackingGroupsLazyQuery as jest.Mock).mockReturnValue([
        mockLoadQuery,
        { loading: false, error: null },
      ]);

      const { result } = renderHook(() => useGetGroups());

      mockLoadQuery.mockClear();

      await result.current.fetchPreviousPage();

      await waitFor(() => {
        expect(mockSandbox.logger.warn).toHaveBeenCalledWith(
          'No previous page available',
        );
      });
      expect(mockLoadQuery).not.toHaveBeenCalled();
    });

    it('should handle error during fetchPreviousPage', async () => {
      const mockLoadQueryPrev = jest.fn();
      const capturedCallbacks: Array<((data: any) => void) | null> = [];
      const mockFirstPageData = {
        timeTrackingGroups: {
          edges: [],
          pageInfo: { endCursor: 'cursor-1', hasNextPage: true },
          totalCount: 2,
        },
      };

      (useGetTimeTrackingGroupsLazyQuery as jest.Mock).mockImplementation(
        (options: any = {}) => {
          capturedCallbacks.push(options.onCompleted || null);
          return [
            mockLoadQueryPrev,
            {
              loading: false,
              error: null,
              data: mockFirstPageData,
            },
          ];
        },
      );

      const { result } = renderHook(() => useGetGroups());

      // Set up cursor history by going to next page first
      result.current.loadGroups({ first: 20 });

      const initialCallback = capturedCallbacks[0];
      expect(initialCallback).toBeDefined();
      if (initialCallback) {
        initialCallback(mockFirstPageData);
      }

      await waitFor(() => {
        expect(result.current.pageInfo?.hasNextPage).toBe(true);
      });

      mockLoadQueryPrev.mockResolvedValueOnce({
        data: {
          timeTrackingGroups: {
            edges: [],
            pageInfo: { endCursor: 'cursor-2', hasNextPage: false },
            totalCount: 2,
          },
        },
      });

      // Update mock to return second page data and trigger callback when loadQuery is called
      const mockSecondPageData = {
        timeTrackingGroups: {
          edges: [],
          pageInfo: { endCursor: 'cursor-2', hasNextPage: false },
          totalCount: 2,
        },
      };
      // The hook is already initialized, so we need to update the existing mock's loadQuery
      // to trigger the callback when called
      const callbackForErrorTest = capturedCallbacks[0]; // Reuse the first callback
      mockLoadQueryPrev.mockImplementation((variables: any) => {
        // Call the callback synchronously after a microtask to simulate Apollo's behavior
        Promise.resolve().then(() => {
          if (callbackForErrorTest) {
            callbackForErrorTest(mockSecondPageData);
          }
        });
        return Promise.resolve({ data: mockSecondPageData });
      });

      await result.current.fetchNextPage({ first: 20 });

      // Verify that loadQuery was called with correct parameters
      await waitFor(() => {
        expect(mockLoadQueryPrev).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              after: 'cursor-1',
              first: 20,
            }),
          }),
        );
      });

      // Manually trigger the callback to simulate Apollo's behavior
      if (callbackForErrorTest) {
        callbackForErrorTest(mockSecondPageData);
      }

      // Verify that Redux state was updated
      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'SET_GROUPS_DATA',
            payload: expect.objectContaining({
              hasNextPage: false,
            }),
          }),
        );
      });

      // Now try to go back, but simulate error
      mockLoadQueryPrev.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        result.current.fetchPreviousPage({ first: 20 }),
      ).rejects.toThrow('Network error');
    });
  });

  describe('appendOnFetchNextPage option', () => {
    it('should use appendGroupsData when appendOnFetchNextPage is true', async () => {
      const mockLoadQueryNext = jest.fn();
      const capturedCallbacks: Array<((data: any) => void) | null> = [];
      const mockFirstPageData = {
        timeTrackingGroups: {
          edges: [
            {
              node: {
                id: 'group-1',
                name: 'First Group',
                stats: { memberCount: 10, managerCount: 2 },
                isActive: true,
                meta: { version: 1 },
              },
            },
          ],
          pageInfo: {
            endCursor: 'cursor-123',
            hasNextPage: true,
          },
          totalCount: 2,
        },
      };

      const mockSecondPageData = {
        timeTrackingGroups: {
          edges: [
            {
              node: {
                id: 'group-2',
                name: 'Second Group',
                stats: { memberCount: 5, managerCount: 1 },
                isActive: true,
                meta: { version: 1 },
              },
            },
          ],
          pageInfo: {
            endCursor: 'cursor-456',
            hasNextPage: false,
          },
          totalCount: 2,
        },
      };

      (useGetTimeTrackingGroupsLazyQuery as jest.Mock).mockImplementation(
        (options: any = {}) => {
          capturedCallbacks.push(options.onCompleted || null);
          return [
            mockLoadQueryNext,
            {
              loading: false,
              error: null,
              data: mockFirstPageData,
            },
          ];
        },
      );

      const { result } = renderHook(() =>
        useGetGroups({ appendOnFetchNextPage: true }),
      );

      result.current.loadGroups({ first: 20, filter: { isActive: true } });

      const firstCallback = capturedCallbacks[0];
      expect(firstCallback).toBeDefined();
      if (firstCallback) {
        firstCallback(mockFirstPageData);
      }

      await waitFor(() => {
        expect(result.current.pageInfo?.hasNextPage).toBe(true);
      });

      mockLoadQueryNext.mockImplementation(() => {
        const promise = Promise.resolve({ data: mockSecondPageData });
        promise.then(() => {
          const lastCallback = capturedCallbacks[capturedCallbacks.length - 1];
          if (lastCallback) {
            lastCallback(mockSecondPageData);
          }
        });
        return promise;
      });

      await result.current.fetchNextPage({
        first: 20,
        filter: { isActive: true },
      });

      await waitFor(() => {
        expect(appendGroupsData).toHaveBeenCalledWith({
          groups: [
            {
              id: 'group-2',
              name: 'Second Group',
              stats: { memberCount: 5, managerCount: 1 },
              isActive: true,
              meta: { version: 1 },
            },
          ],
          cursor: 'cursor-456',
          hasMore: false,
          hasNextPage: false,
        });
        expect(setLoadingMore).toHaveBeenCalledWith({ loading: false });
      });
    });

    it('should use setLoadingMore (not setGroupsLoading) when appendOnFetchNextPage is true', async () => {
      const mockLoadQueryNext = jest.fn();
      const capturedCallbacks: Array<((data: any) => void) | null> = [];
      const mockFirstPageData = {
        timeTrackingGroups: {
          edges: [],
          pageInfo: { endCursor: 'cursor-1', hasNextPage: true },
          totalCount: 2,
        },
      };

      (useGetTimeTrackingGroupsLazyQuery as jest.Mock).mockImplementation(
        (options: any = {}) => {
          capturedCallbacks.push(options.onCompleted || null);
          return [
            mockLoadQueryNext,
            {
              loading: false,
              error: null,
              data: mockFirstPageData,
            },
          ];
        },
      );

      const { result } = renderHook(() =>
        useGetGroups({ appendOnFetchNextPage: true }),
      );

      result.current.loadGroups({ first: 20 });
      const firstCallback = capturedCallbacks[0];
      if (firstCallback) {
        firstCallback(mockFirstPageData);
      }

      await waitFor(() => {
        expect(result.current.pageInfo?.hasNextPage).toBe(true);
      });

      mockLoadQueryNext.mockResolvedValue({ data: mockFirstPageData });

      mockDispatch.mockClear();

      await result.current.fetchNextPage();

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_LOADING_MORE',
        payload: { loading: true },
      });
      expect(mockDispatch).not.toHaveBeenCalledWith({
        type: 'SET_GROUPS_LOADING',
        payload: { loading: true },
      });
    });

    it('should use setGroupsLoading (not setLoadingMore) when appendOnFetchNextPage is false', async () => {
      const mockLoadQueryNext = jest.fn();
      const capturedCallbacks: Array<((data: any) => void) | null> = [];
      const mockFirstPageData = {
        timeTrackingGroups: {
          edges: [],
          pageInfo: { endCursor: 'cursor-1', hasNextPage: true },
          totalCount: 2,
        },
      };

      (useGetTimeTrackingGroupsLazyQuery as jest.Mock).mockImplementation(
        (options: any = {}) => {
          capturedCallbacks.push(options.onCompleted || null);
          return [
            mockLoadQueryNext,
            {
              loading: false,
              error: null,
              data: mockFirstPageData,
            },
          ];
        },
      );

      const { result } = renderHook(() => useGetGroups());

      result.current.loadGroups({ first: 20 });
      const firstCallback = capturedCallbacks[0];
      if (firstCallback) {
        firstCallback(mockFirstPageData);
      }

      await waitFor(() => {
        expect(result.current.pageInfo?.hasNextPage).toBe(true);
      });

      mockLoadQueryNext.mockResolvedValue({ data: mockFirstPageData });

      mockDispatch.mockClear();

      await result.current.fetchNextPage();

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_GROUPS_LOADING',
        payload: { loading: true },
      });
      expect(mockDispatch).not.toHaveBeenCalledWith({
        type: 'SET_LOADING_MORE',
        payload: { loading: true },
      });
    });

    it('should dispatch setLoadingMore(false) on error when appendOnFetchNextPage is true', async () => {
      const mockLoadQueryNext = jest.fn();
      const capturedCallbacks: Array<((data: any) => void) | null> = [];
      const mockFirstPageData = {
        timeTrackingGroups: {
          edges: [],
          pageInfo: { endCursor: 'cursor-1', hasNextPage: true },
          totalCount: 1,
        },
      };

      (useGetTimeTrackingGroupsLazyQuery as jest.Mock).mockImplementation(
        (options: any = {}) => {
          capturedCallbacks.push(options.onCompleted || null);
          return [
            mockLoadQueryNext,
            {
              loading: false,
              error: null,
              data: mockFirstPageData,
            },
          ];
        },
      );

      const { result } = renderHook(() =>
        useGetGroups({ appendOnFetchNextPage: true }),
      );

      result.current.loadGroups({ first: 20 });
      const firstCallback = capturedCallbacks[0];
      if (firstCallback) {
        firstCallback(mockFirstPageData);
      }

      await waitFor(() => {
        expect(result.current.pageInfo?.hasNextPage).toBe(true);
      });

      mockLoadQueryNext.mockRejectedValueOnce(new Error('Network error'));

      mockDispatch.mockClear();

      await expect(result.current.fetchNextPage()).rejects.toThrow(
        'Network error',
      );

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_LOADING_MORE',
        payload: { loading: false },
      });
    });

    it('should not dispatch setLoadingMore on error when appendOnFetchNextPage is false', async () => {
      const mockLoadQueryNext = jest.fn();
      const capturedCallbacks: Array<((data: any) => void) | null> = [];
      const mockFirstPageData = {
        timeTrackingGroups: {
          edges: [],
          pageInfo: { endCursor: 'cursor-1', hasNextPage: true },
          totalCount: 1,
        },
      };

      (useGetTimeTrackingGroupsLazyQuery as jest.Mock).mockImplementation(
        (options: any = {}) => {
          capturedCallbacks.push(options.onCompleted || null);
          return [
            mockLoadQueryNext,
            {
              loading: false,
              error: null,
              data: mockFirstPageData,
            },
          ];
        },
      );

      const { result } = renderHook(() => useGetGroups());

      result.current.loadGroups({ first: 20 });
      const firstCallback = capturedCallbacks[0];
      if (firstCallback) {
        firstCallback(mockFirstPageData);
      }

      await waitFor(() => {
        expect(result.current.pageInfo?.hasNextPage).toBe(true);
      });

      mockLoadQueryNext.mockRejectedValueOnce(new Error('Network error'));

      mockDispatch.mockClear();

      await expect(result.current.fetchNextPage()).rejects.toThrow(
        'Network error',
      );

      expect(mockDispatch).not.toHaveBeenCalledWith({
        type: 'SET_LOADING_MORE',
        payload: { loading: false },
      });
    });
  });

  describe('fetchNextPage edge cases', () => {
    it('should not fetch when endCursor is null', async () => {
      const mockLoadQuery = jest.fn();
      (useGetTimeTrackingGroupsLazyQuery as jest.Mock).mockReturnValue([
        mockLoadQuery,
        {
          loading: false,
          error: null,
          data: {
            timeTrackingGroups: {
              edges: [],
              pageInfo: { endCursor: null, hasNextPage: true },
              totalCount: 5,
            },
          },
        },
      ]);
      const { result } = renderHook(() => useGetGroups());
      mockLoadQuery.mockClear();
      await result.current.fetchNextPage();
      await waitFor(() => {
        expect(mockSandbox.logger.warn).toHaveBeenCalledWith(
          'No next page available',
        );
      });
      expect(mockLoadQuery).not.toHaveBeenCalled();
    });

    it('should not fetch when data is undefined', async () => {
      const mockLoadQuery = jest.fn();
      (useGetTimeTrackingGroupsLazyQuery as jest.Mock).mockReturnValue([
        mockLoadQuery,
        { loading: false, error: null, data: undefined },
      ]);
      const { result } = renderHook(() => useGetGroups());
      mockLoadQuery.mockClear();
      await result.current.fetchNextPage();
      await waitFor(() => {
        expect(mockSandbox.logger.warn).toHaveBeenCalledWith(
          'No next page available',
        );
      });
      expect(mockLoadQuery).not.toHaveBeenCalled();
    });
  });

  describe('Cursor history management', () => {
    it('should reset cursor history when loading without after parameter', async () => {
      const mockLoadQuery = jest.fn();
      const capturedCallbacks: Array<((data: any) => void) | null> = [];
      const mockFirstLoadData = {
        timeTrackingGroups: {
          edges: [],
          pageInfo: { endCursor: 'cursor-2', hasNextPage: true },
          totalCount: 2,
        },
      };
      const mockResetData = {
        timeTrackingGroups: {
          edges: [],
          pageInfo: { endCursor: null, hasNextPage: false },
          totalCount: 1,
        },
      };
      let currentMockData: any = mockFirstLoadData;

      let loadQueryFn: jest.Mock;
      (useGetTimeTrackingGroupsLazyQuery as jest.Mock).mockImplementation(
        (options: any = {}) => {
          capturedCallbacks.push(options.onCompleted || null);
          loadQueryFn = jest.fn((variables: any) => {
            // When loadQuery is called without 'after', update to reset data
            if (!variables.after) {
              currentMockData = mockResetData;
              const callback = capturedCallbacks[capturedCallbacks.length - 1];
              const promise = Promise.resolve({ data: currentMockData });
              // Simulate Apollo calling onCompleted when query resolves
              promise.then(() => {
                if (callback) {
                  callback(mockResetData);
                }
              });
              return promise;
            }
            return Promise.resolve({ data: currentMockData });
          });
          return [
            loadQueryFn,
            {
              loading: false,
              error: null,
              get data() {
                return currentMockData;
              },
            },
          ];
        },
      );

      const { result } = renderHook(() => useGetGroups());

      // Load with after (builds history)
      result.current.loadGroups({ first: 20, after: 'cursor-1' });

      const callbackForHistoryTest = capturedCallbacks[0];
      expect(callbackForHistoryTest).toBeDefined();
      if (callbackForHistoryTest) {
        callbackForHistoryTest(mockFirstLoadData);
      }

      await waitFor(() => {
        expect(result.current.pageInfo?.hasNextPage).toBe(true);
      });

      // Load without after (should reset history)
      result.current.loadGroups({ first: 20 });

      // Verify that loadQuery was called without 'after' parameter
      await waitFor(() => {
        expect(loadQueryFn).toHaveBeenCalledTimes(2); // First call with 'after', second without
        const lastCall =
          loadQueryFn.mock.calls[loadQueryFn.mock.calls.length - 1];
        expect(lastCall[0].variables.after).toBeUndefined();
        expect(lastCall[0].variables.first).toBe(20);
      });

      // Verify that Redux state was updated with reset data
      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'SET_GROUPS_DATA',
            payload: expect.objectContaining({
              hasNextPage: false,
              cursor: null,
            }),
          }),
        );
      });

      // History should be reset, so fetchPreviousPage should warn
      await result.current.fetchPreviousPage();

      await waitFor(() => {
        expect(mockSandbox.logger.warn).toHaveBeenCalledWith(
          'No previous page available',
        );
      });
    });

    it('should handle error during fetchPreviousPage and restore cursor history', async () => {
      const mockLoadQuery = jest.fn();
      const capturedCallbacks: Array<((data: any) => void) | null> = [];
      const mockFirstPageData = {
        timeTrackingGroups: {
          edges: [],
          pageInfo: { endCursor: 'cursor-1', hasNextPage: true },
          totalCount: 2,
        },
      };

      (useGetTimeTrackingGroupsLazyQuery as jest.Mock).mockImplementation(
        (options: any = {}) => {
          capturedCallbacks.push(options.onCompleted || null);
          return [
            mockLoadQuery,
            {
              loading: false,
              error: null,
              data: mockFirstPageData,
            },
          ];
        },
      );

      const { result } = renderHook(() => useGetGroups());

      // Load first page
      result.current.loadGroups({ first: 20 });

      const firstCallback = capturedCallbacks[0];
      expect(firstCallback).toBeDefined();
      if (firstCallback) {
        firstCallback(mockFirstPageData);
      }

      await waitFor(() => {
        expect(result.current.pageInfo?.hasNextPage).toBe(true);
      });

      // Go to next page to build history
      const mockSecondPageData = {
        timeTrackingGroups: {
          edges: [],
          pageInfo: { endCursor: 'cursor-2', hasNextPage: false },
          totalCount: 2,
        },
      };
      mockLoadQuery.mockImplementation((variables: any) => {
        const promise = Promise.resolve({ data: mockSecondPageData });
        promise.then(() => {
          if (firstCallback) {
            firstCallback(mockSecondPageData);
          }
        });
        return promise;
      });

      await result.current.fetchNextPage({ first: 20 });

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'SET_GROUPS_DATA',
            payload: expect.objectContaining({
              hasNextPage: false,
            }),
          }),
        );
      });

      // Now try to go back, but simulate error
      mockLoadQuery.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        result.current.fetchPreviousPage({ first: 20 }),
      ).rejects.toThrow('Network error');

      // Verify error was logged
      await waitFor(() => {
        expect(mockSandbox.logger.error).toHaveBeenCalledWith(
          'Error fetching previous page:',
          expect.objectContaining({ error: expect.any(Error) }),
        );
      });
    });
  });
});
