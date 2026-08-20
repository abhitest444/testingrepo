import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { useDispatch } from 'react-redux';
import { useLazyQuery } from '@apollo/client';
import { useSandbox } from '@payroll/quicksand';
import {
  setWorkersForGroup,
  appendWorkersForGroup,
  setWorkersLoadingForGroup,
} from 'src/js/widgets/assignments/store/workersGroupViewSlice';
import { WorkerStatus } from 'src/js/widgets/assignments/components/WorkerAssignments/WorkersTableByGroupsView/constants';
import { TimeTracking_TimeForType } from 'src/__generated__/timeTracking/graphql';
import { useGetWorkersForGroup } from 'src/js/service/hooks/groups/useGetWorkersForGroup';

// Mock dependencies
jest.mock('react-redux');
jest.mock('@apollo/client');
jest.mock('@payroll/quicksand');
jest.mock('src/js/common/CustomerInteraction', () => ({
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn(() => ({})),
  TimeCustomerInteraction: {
    GROUP_MEMBERS_READ: 'GROUP_MEMBERS_READ',
  },
}));
jest.mock('src/js/widgets/assignments/store/workersGroupViewSlice', () => ({
  setWorkersForGroup: jest.fn((payload) => ({
    type: 'setWorkersForGroup',
    payload,
  })),
  appendWorkersForGroup: jest.fn((payload) => ({
    type: 'appendWorkersForGroup',
    payload,
  })),
  setWorkersLoadingForGroup: jest.fn((payload) => ({
    type: 'setWorkersLoadingForGroup',
    payload,
  })),
}));

describe('useGetWorkersForGroup', () => {
  const mockDispatch = jest.fn();
  const mockSearchQuery = jest.fn();
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
    (useLazyQuery as jest.Mock).mockReturnValue([
      mockSearchQuery,
      {
        loading: false,
        error: null,
        data: {
          members: {
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: null,
              endCursor: null,
            },
            totalCount: 0,
          },
        },
      },
    ]);
  });

  it('should return loading, error, pageInfo, totalCount and function exports', () => {
    const { result } = renderHook(() => useGetWorkersForGroup());

    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('pageInfo');
    expect(result.current).toHaveProperty('totalCount');
    expect(result.current).toHaveProperty('loadWorkersForGroup');
    expect(result.current).toHaveProperty('fetchNextPage');
    expect(result.current).toHaveProperty('fetchPreviousPage');
    expect(typeof result.current.loadWorkersForGroup).toBe('function');
    expect(typeof result.current.fetchNextPage).toBe('function');
    expect(typeof result.current.fetchPreviousPage).toBe('function');
  });

  it('should load workers for a group with initial load', async () => {
    const mockData = {
      members: {
        edges: [
          {
            node: {
              id: 'worker-1',
              displayName: 'John Doe',
              firstName: 'John',
              lastName: 'Doe',
              isActive: true,
              type: TimeTracking_TimeForType.Employee,
              managesGroups: [],
            },
          },
          {
            node: {
              id: 'worker-2',
              displayName: null,
              firstName: 'Jane',
              lastName: 'Smith',
              isActive: false,
              type: TimeTracking_TimeForType.Vendor,
              managesGroups: [],
            },
          },
        ],
        pageInfo: {
          endCursor: 'cursor-123',
          hasNextPage: true,
        },
      },
    };

    mockSearchQuery.mockResolvedValueOnce({ data: mockData });

    const { result } = renderHook(() => useGetWorkersForGroup());

    await result.current.loadWorkersForGroup({
      groupId: 'group-1',
      first: 20,
      append: false,
    });

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        setWorkersLoadingForGroup({ groupId: 'group-1', loading: true }),
      );
    });

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        setWorkersForGroup({
          groupId: 'group-1',
          workers: [
            {
              id: 'worker-1',
              name: 'John Doe',
              status: WorkerStatus.ACTIVE,
              role: TimeTracking_TimeForType.Employee,
              isGroupLead: false,
            },
            {
              id: 'worker-2',
              name: 'Jane Smith',
              status: WorkerStatus.INACTIVE,
              role: TimeTracking_TimeForType.Vendor,
              isGroupLead: false,
            },
          ],
          cursor: 'cursor-123',
          hasMore: true,
          isSearchResult: false,
        }),
      );
    });
  });

  it('should append workers when append is true', async () => {
    const mockData = {
      members: {
        edges: [
          {
            node: {
              id: 'worker-3',
              displayName: 'Bob Johnson',
              firstName: 'Bob',
              lastName: 'Johnson',
              isActive: true,
              type: TimeTracking_TimeForType.Employee,
              managesGroups: [],
            },
          },
        ],
        pageInfo: {
          endCursor: 'cursor-456',
          hasNextPage: false,
        },
      },
    };

    mockSearchQuery.mockResolvedValueOnce({ data: mockData });

    const { result } = renderHook(() => useGetWorkersForGroup());

    await result.current.loadWorkersForGroup({
      groupId: 'group-1',
      first: 20,
      after: 'cursor-123',
      append: true,
    });

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        appendWorkersForGroup({
          groupId: 'group-1',
          workers: [
            {
              id: 'worker-3',
              name: 'Bob Johnson',
              status: WorkerStatus.ACTIVE,
              role: TimeTracking_TimeForType.Employee,
              isGroupLead: false,
            },
          ],
          cursor: 'cursor-456',
          hasMore: false,
        }),
      );
    });
  });

  it('should handle empty name by constructing from firstName and lastName', async () => {
    const mockData = {
      members: {
        edges: [
          {
            node: {
              id: 'worker-4',
              displayName: null,
              firstName: 'Alice',
              lastName: 'Wonder',
              isActive: true,
              type: TimeTracking_TimeForType.Employee,
              managesGroups: [],
            },
          },
        ],
        pageInfo: {
          endCursor: null,
          hasNextPage: false,
        },
      },
    };

    mockSearchQuery.mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useGetWorkersForGroup());

    await result.current.loadWorkersForGroup({
      groupId: 'group-1',
      first: 20,
    });

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        setWorkersForGroup(
          expect.objectContaining({
            workers: expect.arrayContaining([
              expect.objectContaining({
                name: 'Alice Wonder',
              }),
            ]),
          }),
        ),
      );
    });
  });

  it('should return empty string when all name fields are missing', async () => {
    const mockData = {
      members: {
        edges: [
          {
            node: {
              id: 'worker-5',
              displayName: null,
              firstName: null,
              lastName: null,
              isActive: true,
              type: TimeTracking_TimeForType.Employee,
              managesGroups: [],
            },
          },
        ],
        pageInfo: {
          endCursor: null,
          hasNextPage: false,
        },
      },
    };

    mockSearchQuery.mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useGetWorkersForGroup());

    await result.current.loadWorkersForGroup({
      groupId: 'group-1',
      first: 20,
    });

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        setWorkersForGroup(
          expect.objectContaining({
            workers: expect.arrayContaining([
              expect.objectContaining({
                name: '',
              }),
            ]),
          }),
        ),
      );
    });
  });

  it('should handle empty members gracefully', async () => {
    const mockData = {
      members: null,
    };

    mockSearchQuery.mockResolvedValueOnce({ data: mockData });

    const { result } = renderHook(() => useGetWorkersForGroup());

    await result.current.loadWorkersForGroup({
      groupId: 'group-1',
      first: 20,
    });

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        setWorkersForGroup({
          groupId: 'group-1',
          workers: [],
          cursor: null,
          hasMore: false,
          isSearchResult: false,
        }),
      );
    });
  });

  it('should use correct WorkerStatus enum values', async () => {
    const mockData = {
      members: {
        edges: [
          {
            node: {
              id: 'worker-6',
              displayName: 'Active Worker',
              firstName: 'Active',
              lastName: 'Worker',
              isActive: true,
              type: TimeTracking_TimeForType.Employee,
              managesGroups: [],
            },
          },
          {
            node: {
              id: 'worker-7',
              displayName: 'Inactive Worker',
              firstName: 'Inactive',
              lastName: 'Worker',
              isActive: false,
              type: TimeTracking_TimeForType.Employee,
              managesGroups: [],
            },
          },
        ],
        pageInfo: {
          endCursor: null,
          hasNextPage: false,
        },
      },
    };

    mockSearchQuery.mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useGetWorkersForGroup());

    await result.current.loadWorkersForGroup({
      groupId: 'group-1',
      first: 20,
    });

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        setWorkersForGroup(
          expect.objectContaining({
            workers: [
              expect.objectContaining({ status: WorkerStatus.ACTIVE }),
              expect.objectContaining({ status: WorkerStatus.INACTIVE }),
            ],
          }),
        ),
      );
    });
  });

  it('should log error and rethrow when query fails', async () => {
    const mockError = new Error('Network error');
    mockSearchQuery.mockRejectedValue(mockError);

    const { result } = renderHook(() => useGetWorkersForGroup());

    await expect(
      result.current.loadWorkersForGroup({
        groupId: 'group-1',
        first: 20,
      }),
    ).rejects.toThrow('Network error');

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to load members for group',
      { error: 'Network error' },
    );
  });

  it('should handle non-Error objects in catch block', async () => {
    const mockError = 'String error';
    mockSearchQuery.mockRejectedValue(mockError);

    const { result } = renderHook(() => useGetWorkersForGroup());

    await expect(
      result.current.loadWorkersForGroup({
        groupId: 'group-1',
        first: 20,
      }),
    ).rejects.toBe('String error');

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to load members for group',
      { error: 'String error' },
    );
  });

  it('should use default first value of 20', async () => {
    const mockData = {
      members: {
        edges: [],
        pageInfo: {
          endCursor: null,
          hasNextPage: false,
        },
      },
    };

    mockSearchQuery.mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useGetWorkersForGroup());

    await result.current.loadWorkersForGroup({
      groupId: 'group-1',
    });

    await waitFor(() => {
      expect(mockSearchQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            first: 20,
          }),
        }),
      );
    });
  });

  describe('Search Functionality', () => {
    it('should use search API with searchText', async () => {
      const mockData = {
        members: {
          edges: [
            {
              node: {
                id: 'worker-1',
                displayName: 'John Doe',
                firstName: 'John',
                lastName: 'Doe',
                isActive: true,
                type: TimeTracking_TimeForType.Employee,
                managesGroups: [],
              },
            },
          ],
          pageInfo: {
            endCursor: 'search-cursor',
            hasNextPage: false,
          },
        },
      };

      mockSearchQuery.mockResolvedValue({ data: mockData });

      const { result } = renderHook(() => useGetWorkersForGroup());

      await result.current.loadWorkersForGroup({
        groupId: 'group-1',
        searchText: 'John',
      });

      await waitFor(() => {
        expect(mockSearchQuery).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              searchText: 'John',
            }),
          }),
        );
      });
    });

    it('should trim searchText before querying', async () => {
      const mockData = {
        members: {
          edges: [],
          pageInfo: { endCursor: null, hasNextPage: false },
        },
      };

      mockSearchQuery.mockResolvedValue({ data: mockData });

      const { result } = renderHook(() => useGetWorkersForGroup());

      await result.current.loadWorkersForGroup({
        groupId: 'group-1',
        searchText: '  John  ',
      });

      await waitFor(() => {
        expect(mockSearchQuery).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              searchText: 'John',
            }),
          }),
        );
      });
    });

    it('should mark workers as group leads when they manage the group', async () => {
      const mockData = {
        members: {
          edges: [
            {
              node: {
                id: 'worker-1',
                displayName: 'John Doe',
                firstName: 'John',
                lastName: 'Doe',
                isActive: true,
                type: TimeTracking_TimeForType.Employee,
                managesGroups: [{ id: 'group-1', name: 'Test Group' }],
              },
            },
          ],
          pageInfo: { endCursor: null, hasNextPage: false },
        },
      };

      mockSearchQuery.mockResolvedValue({ data: mockData });

      const { result } = renderHook(() => useGetWorkersForGroup());

      await result.current.loadWorkersForGroup({
        groupId: 'group-1',
        searchText: 'John',
      });

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: expect.objectContaining({
              workers: expect.arrayContaining([
                expect.objectContaining({
                  id: 'worker-1',
                  isGroupLead: true,
                }),
              ]),
            }),
          }),
        );
      });
    });

    it('should set isSearchResult flag to true for search results', async () => {
      const mockData = {
        members: {
          edges: [],
          pageInfo: { endCursor: null, hasNextPage: false },
        },
      };

      mockSearchQuery.mockResolvedValue({ data: mockData });

      const { result } = renderHook(() => useGetWorkersForGroup());

      await result.current.loadWorkersForGroup({
        groupId: 'group-1',
        searchText: 'test',
      });

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: expect.objectContaining({
              isSearchResult: true,
            }),
          }),
        );
      });
    });

    it('should handle search with null members connection', async () => {
      const mockData = {
        members: null,
      };

      mockSearchQuery.mockResolvedValue({ data: mockData });

      const { result } = renderHook(() => useGetWorkersForGroup());

      await result.current.loadWorkersForGroup({
        groupId: 'group-1',
        searchText: 'John',
      });

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: expect.objectContaining({
              workers: [],
              isSearchResult: true,
            }),
          }),
        );
      });
    });

    it('should support types filter', async () => {
      const mockData = {
        members: {
          edges: [],
          pageInfo: { endCursor: null, hasNextPage: false },
        },
      };

      mockSearchQuery.mockResolvedValue({ data: mockData });

      const { result } = renderHook(() => useGetWorkersForGroup());

      await result.current.loadWorkersForGroup({
        groupId: 'group-1',
        types: [TimeTracking_TimeForType.Employee],
      });

      await waitFor(() => {
        expect(mockSearchQuery).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              types: [TimeTracking_TimeForType.Employee],
            }),
          }),
        );
      });
    });
  });

  describe('Pagination', () => {
    it('should provide pageInfo from query result', () => {
      const mockPageInfo = {
        hasNextPage: true,
        hasPreviousPage: false,
        startCursor: 'start',
        endCursor: 'end',
      };

      (useLazyQuery as jest.Mock).mockReturnValue([
        mockSearchQuery,
        {
          loading: false,
          error: null,
          data: {
            members: {
              pageInfo: mockPageInfo,
              totalCount: 100,
            },
          },
        },
      ]);

      const { result } = renderHook(() => useGetWorkersForGroup());

      expect(result.current.pageInfo).toEqual(mockPageInfo);
      expect(result.current.totalCount).toBe(100);
    });

    it('should return null totalCount when data is not available', () => {
      (useLazyQuery as jest.Mock).mockReturnValue([
        mockSearchQuery,
        {
          loading: false,
          error: null,
          data: null,
        },
      ]);

      const { result } = renderHook(() => useGetWorkersForGroup());

      expect(result.current.totalCount).toBeNull();
    });

    it('should return totalCount from query result', () => {
      (useLazyQuery as jest.Mock).mockReturnValue([
        mockSearchQuery,
        {
          loading: false,
          error: null,
          data: {
            members: {
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: null,
                endCursor: null,
              },
              totalCount: 250,
            },
          },
        },
      ]);

      const { result } = renderHook(() => useGetWorkersForGroup());

      expect(result.current.totalCount).toBe(250);
    });

    it('should call fetchNextPage and load next page', async () => {
      const mockPageInfo = {
        hasNextPage: true,
        endCursor: 'cursor-1',
      };

      const mockData = {
        members: {
          edges: [
            {
              node: {
                id: 'worker-1',
                displayName: 'Worker 1',
                firstName: 'Worker',
                lastName: '1',
                isActive: true,
                type: TimeTracking_TimeForType.Employee,
                managesGroups: [],
              },
            },
          ],
          pageInfo: mockPageInfo,
        },
      };

      // First call returns data with pageInfo
      (useLazyQuery as jest.Mock).mockReturnValue([
        mockSearchQuery,
        {
          loading: false,
          error: null,
          data: mockData,
        },
      ]);

      mockSearchQuery.mockResolvedValue({ data: mockData });

      const { result } = renderHook(() => useGetWorkersForGroup());

      await result.current.fetchNextPage({
        groupId: 'group-1',
        first: 20,
      });

      await waitFor(() => {
        expect(mockSearchQuery).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              after: 'cursor-1',
            }),
          }),
        );
      });
    });

    it('should not fetch next page when hasNextPage is false', async () => {
      const mockPageInfo = {
        hasNextPage: false,
        endCursor: null,
      };

      (useLazyQuery as jest.Mock).mockReturnValue([
        mockSearchQuery,
        {
          loading: false,
          error: null,
          data: { members: { pageInfo: mockPageInfo } },
        },
      ]);

      const { result } = renderHook(() => useGetWorkersForGroup());

      const res = await result.current.fetchNextPage({
        groupId: 'group-1',
        first: 20,
      });

      expect(res).toBeUndefined();
      expect(mockSearchQuery).not.toHaveBeenCalled();
    });

    it('should not fetch previous page when cursor history is empty', async () => {
      const { result } = renderHook(() => useGetWorkersForGroup());

      const res = await result.current.fetchPreviousPage({
        groupId: 'group-1',
        first: 20,
      });

      expect(res).toBeUndefined();
      expect(mockSearchQuery).not.toHaveBeenCalled();
    });

    it('should reset cursor history when loading without after cursor', async () => {
      const mockData = {
        members: {
          edges: [],
          pageInfo: { endCursor: 'cursor-1', hasNextPage: true },
        },
      };

      mockSearchQuery.mockResolvedValue({ data: mockData });

      const { result } = renderHook(() => useGetWorkersForGroup());

      // First load
      await result.current.loadWorkersForGroup({
        groupId: 'group-1',
        first: 20,
      });

      // Second load without after should reset history
      await result.current.loadWorkersForGroup({
        groupId: 'group-1',
        first: 20,
      });

      await waitFor(() => {
        expect(mockSearchQuery).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Error Scenarios', () => {
    it('should return error message from Apollo error', () => {
      const mockError = { message: 'GraphQL error' };
      (useLazyQuery as jest.Mock).mockReturnValue([
        mockSearchQuery,
        { loading: false, error: mockError, data: null },
      ]);

      const { result } = renderHook(() => useGetWorkersForGroup());

      expect(result.current.error).toBe('GraphQL error');
    });

    it('should return null error when no error', () => {
      const { result } = renderHook(() => useGetWorkersForGroup());

      expect(result.current.error).toBe(null);
    });

    it('should handle error in fetchNextPage', async () => {
      const mockError = new Error('Pagination error');
      const mockPageInfo = {
        hasNextPage: true,
        endCursor: 'cursor-1',
      };

      (useLazyQuery as jest.Mock).mockReturnValue([
        mockSearchQuery,
        {
          loading: false,
          error: null,
          data: { members: { pageInfo: mockPageInfo } },
        },
      ]);

      mockSearchQuery.mockRejectedValue(mockError);

      const { result } = renderHook(() => useGetWorkersForGroup());

      await expect(
        result.current.fetchNextPage({
          groupId: 'group-1',
          first: 20,
        }),
      ).rejects.toThrow('Pagination error');
    });

    it('should handle error in fetchPreviousPage and log it', async () => {
      const mockError = new Error('Previous page error');
      const mockData = {
        members: {
          edges: [],
          pageInfo: { endCursor: 'cursor-1', hasNextPage: true },
        },
      };

      (useLazyQuery as jest.Mock).mockReturnValue([
        mockSearchQuery,
        {
          loading: false,
          error: null,
          data: mockData,
        },
      ]);

      mockSearchQuery
        .mockResolvedValueOnce({ data: mockData })
        .mockResolvedValueOnce({ data: mockData })
        .mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useGetWorkersForGroup());

      // Load initial page
      await result.current.loadWorkersForGroup({
        groupId: 'group-1',
        first: 20,
      });

      // Load next page (this will add to history)
      await result.current.fetchNextPage({
        groupId: 'group-1',
        first: 20,
      });

      // Try to go back (should fail)
      await expect(
        result.current.fetchPreviousPage({
          groupId: 'group-1',
          first: 20,
        }),
      ).rejects.toThrow('Previous page error');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error fetching previous page:',
        { error: mockError },
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle null members connection gracefully', async () => {
      const mockData = {
        members: null,
      };

      mockSearchQuery.mockResolvedValue({ data: mockData });

      const { result } = renderHook(() => useGetWorkersForGroup());

      await result.current.loadWorkersForGroup({
        groupId: 'group-1',
      });

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: expect.objectContaining({
              workers: [],
            }),
          }),
        );
      });
    });

    it('should handle empty string searchText as undefined', async () => {
      const mockData = {
        members: {
          edges: [],
          pageInfo: { endCursor: null, hasNextPage: false },
        },
      };

      mockSearchQuery.mockResolvedValue({ data: mockData });

      const { result } = renderHook(() => useGetWorkersForGroup());

      await result.current.loadWorkersForGroup({
        groupId: 'group-1',
        searchText: '   ',
      });

      await waitFor(() => {
        expect(mockSearchQuery).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              searchText: undefined,
            }),
          }),
        );
      });
    });

    it('should handle workers with missing firstName and lastName', async () => {
      const mockData = {
        members: {
          edges: [
            {
              node: {
                id: 'worker-1',
                displayName: null,
                firstName: null,
                lastName: null,
                isActive: true,
                type: TimeTracking_TimeForType.Employee,
                managesGroups: [],
              },
            },
          ],
          pageInfo: { endCursor: null, hasNextPage: false },
        },
      };

      mockSearchQuery.mockResolvedValue({ data: mockData });

      const { result } = renderHook(() => useGetWorkersForGroup());

      await result.current.loadWorkersForGroup({
        groupId: 'group-1',
      });

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: expect.objectContaining({
              workers: expect.arrayContaining([
                expect.objectContaining({
                  id: 'worker-1',
                  name: '',
                }),
              ]),
            }),
          }),
        );
      });
    });

    it('should not mark worker as group lead if managesGroups is empty', async () => {
      const mockData = {
        members: {
          edges: [
            {
              node: {
                id: 'worker-1',
                displayName: 'John Doe',
                firstName: 'John',
                lastName: 'Doe',
                isActive: true,
                type: TimeTracking_TimeForType.Employee,
                managesGroups: [],
              },
            },
          ],
          pageInfo: { endCursor: null, hasNextPage: false },
        },
      };

      mockSearchQuery.mockResolvedValue({ data: mockData });

      const { result } = renderHook(() => useGetWorkersForGroup());

      await result.current.loadWorkersForGroup({
        groupId: 'group-1',
      });

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: expect.objectContaining({
              workers: expect.arrayContaining([
                expect.objectContaining({
                  isGroupLead: false,
                }),
              ]),
            }),
          }),
        );
      });
    });

    it('should not mark worker as group lead if they manage a different group', async () => {
      const mockData = {
        members: {
          edges: [
            {
              node: {
                id: 'worker-1',
                displayName: 'John Doe',
                firstName: 'John',
                lastName: 'Doe',
                isActive: true,
                type: TimeTracking_TimeForType.Employee,
                managesGroups: [{ id: 'group-2', name: 'Other Group' }],
              },
            },
          ],
          pageInfo: { endCursor: null, hasNextPage: false },
        },
      };

      mockSearchQuery.mockResolvedValue({ data: mockData });

      const { result } = renderHook(() => useGetWorkersForGroup());

      await result.current.loadWorkersForGroup({
        groupId: 'group-1',
      });

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: expect.objectContaining({
              workers: expect.arrayContaining([
                expect.objectContaining({
                  isGroupLead: false,
                }),
              ]),
            }),
          }),
        );
      });
    });
  });
});
