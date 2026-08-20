/* eslint-disable camelcase */
import { act } from '@testing-library/react-hooks';
import { renderHookWithApolloProvider } from 'test/unit/testUtils';
import { GET_GROUP_MEMBERS_QUERY } from 'src/js/service/queries/timeTrackingGroupQueries';
import { useGetGroupMembers } from 'src/js/service/hooks/groups/useGetGroupMembers';
import { TimeTracking_TimeForType } from 'src/__generated__/timeTracking/graphql';

const waitFor = (callback: () => void, options?: { timeout?: number }) =>
  new Promise<void>((resolve) => {
    const checkCondition = () => {
      try {
        callback();
        resolve();
      } catch (error) {
        setTimeout(checkCondition, 50);
      }
    };
    checkCondition();
  });

// Mock the customer interaction functions
jest.mock('src/js/common/CustomerInteraction', () => ({
  ...jest.requireActual('src/js/common/CustomerInteraction'),
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn(() => ({})),
}));

describe('useGetGroupMembers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load members successfully', async () => {
    const groupId = 'group-123';
    const successMock = {
      request: {
        query: GET_GROUP_MEMBERS_QUERY,
        variables: {
          groupId,
          first: 100,
          after: undefined,
        },
      },
      result: {
        data: {
          timeTrackingGroups: {
            edges: [
              {
                node: {
                  id: groupId,
                  name: 'Test Group',
                  isActive: true,
                  stats: {
                    __typename: 'TimeTracking_GroupStats',
                    memberCount: 2,
                    managerCount: 0,
                    assignedTimeAgainstCount: 0,
                  },
                  members: {
                    __typename: 'TimeTracking_WorkerConnection',
                    edges: [
                      {
                        __typename: 'TimeTracking_WorkerEdge',
                        node: {
                          __typename: 'TimeTracking_Worker',
                          id: '1',
                          type: TimeTracking_TimeForType.Employee,
                          firstName: 'John',
                          lastName: 'Doe',
                          displayName: 'John Doe',
                          isActive: true,
                        },
                        cursor: 'cursor-1',
                      },
                      {
                        __typename: 'TimeTracking_WorkerEdge',
                        node: {
                          __typename: 'TimeTracking_Worker',
                          id: '2',
                          type: TimeTracking_TimeForType.Employee,
                          firstName: 'Jane',
                          lastName: 'Smith',
                          displayName: 'Jane Smith',
                          isActive: true,
                        },
                        cursor: 'cursor-2',
                      },
                    ],
                    pageInfo: {
                      __typename: 'Common_PageInfo',
                      hasNextPage: false,
                      hasPreviousPage: false,
                      startCursor: 'cursor-1',
                      endCursor: 'cursor-2',
                    },
                  },
                },
              },
            ],
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetGroupMembers(),
      [successMock],
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.members).toEqual([]);

    // Load members
    act(() => {
      result.current.loadMembers({ groupId, first: 100 });
    });

    await waitFor(() => {
      expect(result.current.members).toHaveLength(2);
    });

    expect(result.current.members[0].displayName).toBe('John Doe');
    expect(result.current.groupInfo?.memberCount).toBe(2);
  });

  it('should handle fetchMore for pagination', async () => {
    const groupId = 'group-123';
    const firstPageMock = {
      request: {
        query: GET_GROUP_MEMBERS_QUERY,
        variables: {
          groupId,
          first: 1,
          after: undefined,
        },
      },
      result: {
        data: {
          timeTrackingGroups: {
            edges: [
              {
                node: {
                  id: groupId,
                  name: 'Test Group',
                  isActive: true,
                  stats: {
                    __typename: 'TimeTracking_GroupStats',
                    memberCount: 2,
                    managerCount: 0,
                    assignedTimeAgainstCount: 0,
                  },
                  members: {
                    __typename: 'TimeTracking_WorkerConnection',
                    edges: [
                      {
                        __typename: 'TimeTracking_WorkerEdge',
                        node: {
                          __typename: 'TimeTracking_Worker',
                          id: '1',
                          type: TimeTracking_TimeForType.Employee,
                          firstName: 'John',
                          lastName: 'Doe',
                          displayName: 'John Doe',
                          isActive: true,
                        },
                        cursor: 'cursor-1',
                      },
                    ],
                    pageInfo: {
                      __typename: 'Common_PageInfo',
                      hasNextPage: true,
                      hasPreviousPage: false,
                      startCursor: 'cursor-1',
                      endCursor: 'cursor-1',
                    },
                  },
                },
              },
            ],
          },
        },
      },
    };

    const secondPageMock = {
      request: {
        query: GET_GROUP_MEMBERS_QUERY,
        variables: {
          groupId,
          first: 100,
          after: 'cursor-1',
        },
      },
      result: {
        data: {
          timeTrackingGroups: {
            edges: [
              {
                node: {
                  id: groupId,
                  name: 'Test Group',
                  isActive: true,
                  stats: {
                    __typename: 'TimeTracking_GroupStats',
                    memberCount: 2,
                    managerCount: 0,
                    assignedTimeAgainstCount: 0,
                  },
                  members: {
                    __typename: 'TimeTracking_WorkerConnection',
                    edges: [
                      {
                        __typename: 'TimeTracking_WorkerEdge',
                        node: {
                          __typename: 'TimeTracking_Worker',
                          id: '2',
                          type: TimeTracking_TimeForType.Employee,
                          firstName: 'Jane',
                          lastName: 'Smith',
                          displayName: 'Jane Smith',
                          isActive: true,
                        },
                        cursor: 'cursor-2',
                      },
                    ],
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
            ],
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetGroupMembers(),
      [firstPageMock, secondPageMock],
    );

    // Load first page
    act(() => {
      result.current.loadMembers({ groupId, first: 1 });
    });

    await waitFor(() => {
      expect(result.current.members).toHaveLength(1);
    });

    expect(result.current.pageInfo?.hasNextPage).toBe(true);

    // Fetch more
    await act(async () => {
      await result.current.fetchMore();
    });

    await waitFor(() => {
      expect(result.current.members).toHaveLength(2);
    });

    expect(result.current.pageInfo?.hasNextPage).toBe(false);
  });

  it('should handle errors', async () => {
    const groupId = 'group-123';
    const errorMock = {
      request: {
        query: GET_GROUP_MEMBERS_QUERY,
        variables: {
          groupId,
          first: 100,
          after: undefined,
        },
      },
      error: new Error('Network error'),
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetGroupMembers(),
      [errorMock],
    );

    act(() => {
      result.current.loadMembers({ groupId, first: 100 });
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });

  it('should fetch more members successfully', async () => {
    const groupId = 'group-123';
    const initialMock = {
      request: {
        query: GET_GROUP_MEMBERS_QUERY,
        variables: {
          groupId,
          first: 100,
          after: undefined,
        },
      },
      result: {
        data: {
          timeTrackingGroups: {
            edges: [
              {
                node: {
                  id: groupId,
                  name: 'Test Group',
                  isActive: true,
                  stats: {
                    memberCount: 4,
                    managerCount: 1,
                  },
                  members: {
                    edges: [
                      {
                        cursor: 'cursor-1',
                        node: {
                          id: 'worker-1',
                          type: TimeTracking_TimeForType.Employee,
                          isActive: true,
                          firstName: 'John',
                          lastName: 'Doe',
                          displayName: 'John Doe',
                          identityAuthId: 'auth-1',
                          intuitProfileId: 'profile-1',
                        },
                      },
                    ],
                    pageInfo: {
                      hasNextPage: true,
                      hasPreviousPage: false,
                      startCursor: 'cursor-1',
                      endCursor: 'cursor-1',
                    },
                  },
                },
              },
            ],
          },
        },
      },
    };

    const fetchMoreMock = {
      request: {
        query: GET_GROUP_MEMBERS_QUERY,
        variables: {
          groupId,
          first: 100,
          after: 'cursor-1',
        },
      },
      result: {
        data: {
          timeTrackingGroups: {
            edges: [
              {
                node: {
                  id: groupId,
                  name: 'Test Group',
                  isActive: true,
                  stats: {
                    memberCount: 4,
                    managerCount: 1,
                  },
                  members: {
                    edges: [
                      {
                        cursor: 'cursor-2',
                        node: {
                          id: 'worker-2',
                          type: TimeTracking_TimeForType.Employee,
                          isActive: true,
                          firstName: 'Jane',
                          lastName: 'Smith',
                          displayName: 'Jane Smith',
                          identityAuthId: 'auth-2',
                          intuitProfileId: 'profile-2',
                        },
                      },
                    ],
                    pageInfo: {
                      hasNextPage: false,
                      hasPreviousPage: true,
                      startCursor: 'cursor-2',
                      endCursor: 'cursor-2',
                    },
                  },
                },
              },
            ],
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetGroupMembers(),
      [initialMock, fetchMoreMock],
    );

    act(() => {
      result.current.loadMembers({ groupId, first: 100 });
    });

    await waitFor(() => {
      expect(result.current.members).toHaveLength(1);
    });

    expect(result.current.members[0].id).toBe('worker-1');

    // Call fetchMore
    await act(async () => {
      await result.current.fetchMore();
    });

    await waitFor(() => {
      expect(result.current.members).toHaveLength(2);
    });

    expect(result.current.members[0].id).toBe('worker-1');
    expect(result.current.members[1].id).toBe('worker-2');
    expect(result.current.pageInfo?.hasNextPage).toBe(false);
  });

  it('should not fetch more when hasNextPage is false', async () => {
    const groupId = 'group-123';
    const successMock = {
      request: {
        query: GET_GROUP_MEMBERS_QUERY,
        variables: {
          groupId,
          first: 100,
          after: undefined,
        },
      },
      result: {
        data: {
          timeTrackingGroups: {
            edges: [
              {
                node: {
                  id: groupId,
                  name: 'Test Group',
                  isActive: true,
                  stats: {
                    memberCount: 1,
                    managerCount: 1,
                  },
                  members: {
                    edges: [
                      {
                        cursor: 'cursor-1',
                        node: {
                          id: 'worker-1',
                          type: TimeTracking_TimeForType.Employee,
                          isActive: true,
                          firstName: 'John',
                          lastName: 'Doe',
                          displayName: 'John Doe',
                          identityAuthId: 'auth-1',
                          intuitProfileId: 'profile-1',
                        },
                      },
                    ],
                    pageInfo: {
                      hasNextPage: false,
                      hasPreviousPage: false,
                      startCursor: 'cursor-1',
                      endCursor: 'cursor-1',
                    },
                  },
                },
              },
            ],
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetGroupMembers(),
      [successMock],
    );

    act(() => {
      result.current.loadMembers({ groupId, first: 100 });
    });

    await waitFor(() => {
      expect(result.current.members).toHaveLength(1);
    });

    // Call fetchMore when there's no next page - should do nothing
    await act(async () => {
      await result.current.fetchMore();
    });

    // Should still have only 1 member
    expect(result.current.members).toHaveLength(1);
  });

  it('should not fetch more when data is not loaded', async () => {
    const { result } = renderHookWithApolloProvider(
      () => useGetGroupMembers(),
      [],
    );

    // Call fetchMore without loading data first
    await act(async () => {
      await result.current.fetchMore();
    });

    // Should still be empty
    expect(result.current.members).toHaveLength(0);
  });

  it('should handle fetchMore errors gracefully', async () => {
    const groupId = 'group-123';
    const initialMock = {
      request: {
        query: GET_GROUP_MEMBERS_QUERY,
        variables: {
          groupId,
          first: 100,
          after: undefined,
        },
      },
      result: {
        data: {
          timeTrackingGroups: {
            edges: [
              {
                node: {
                  id: groupId,
                  name: 'Test Group',
                  isActive: true,
                  stats: {
                    memberCount: 4,
                    managerCount: 1,
                  },
                  members: {
                    edges: [
                      {
                        cursor: 'cursor-1',
                        node: {
                          id: 'worker-1',
                          type: TimeTracking_TimeForType.Employee,
                          isActive: true,
                          firstName: 'John',
                          lastName: 'Doe',
                          displayName: 'John Doe',
                          identityAuthId: 'auth-1',
                          intuitProfileId: 'profile-1',
                        },
                      },
                    ],
                    pageInfo: {
                      hasNextPage: true,
                      hasPreviousPage: false,
                      startCursor: 'cursor-1',
                      endCursor: 'cursor-1',
                    },
                  },
                },
              },
            ],
          },
        },
      },
    };

    const fetchMoreErrorMock = {
      request: {
        query: GET_GROUP_MEMBERS_QUERY,
        variables: {
          groupId,
          first: 100,
          after: 'cursor-1',
        },
      },
      error: new Error('Network error'),
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetGroupMembers(),
      [initialMock, fetchMoreErrorMock],
    );

    act(() => {
      result.current.loadMembers({ groupId, first: 100 });
    });

    await waitFor(() => {
      expect(result.current.members).toHaveLength(1);
    });

    // Call fetchMore - should handle error gracefully
    await act(async () => {
      await result.current.fetchMore();
    });

    // Should still have the original member
    expect(result.current.members).toHaveLength(1);
  });

  it('should handle fetchMore with incomplete data', async () => {
    const groupId = 'group-123';
    const initialMock = {
      request: {
        query: GET_GROUP_MEMBERS_QUERY,
        variables: {
          groupId,
          first: 100,
          after: undefined,
        },
      },
      result: {
        data: {
          timeTrackingGroups: {
            edges: [
              {
                node: {
                  id: groupId,
                  name: 'Test Group',
                  isActive: true,
                  stats: {
                    memberCount: 4,
                    managerCount: 1,
                  },
                  members: {
                    edges: [
                      {
                        cursor: 'cursor-1',
                        node: {
                          id: 'worker-1',
                          type: TimeTracking_TimeForType.Employee,
                          isActive: true,
                          firstName: 'John',
                          lastName: 'Doe',
                          displayName: 'John Doe',
                          identityAuthId: 'auth-1',
                          intuitProfileId: 'profile-1',
                        },
                      },
                    ],
                    pageInfo: {
                      hasNextPage: true,
                      hasPreviousPage: false,
                      startCursor: 'cursor-1',
                      endCursor: 'cursor-1',
                    },
                  },
                },
              },
            ],
          },
        },
      },
    };

    const fetchMoreEmptyMock = {
      request: {
        query: GET_GROUP_MEMBERS_QUERY,
        variables: {
          groupId,
          first: 100,
          after: 'cursor-1',
        },
      },
      result: {
        data: {
          timeTrackingGroups: null,
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetGroupMembers(),
      [initialMock, fetchMoreEmptyMock],
    );

    act(() => {
      result.current.loadMembers({ groupId, first: 100 });
    });

    await waitFor(() => {
      expect(result.current.members).toHaveLength(1);
    });

    // Call fetchMore with empty result - should handle gracefully
    await act(async () => {
      await result.current.fetchMore();
    });

    // Should still have the original member
    expect(result.current.members).toHaveLength(1);
  });

  it('should handle fetchMore with malformed edges', async () => {
    const groupId = 'group-123';
    const initialMock = {
      request: {
        query: GET_GROUP_MEMBERS_QUERY,
        variables: {
          groupId,
          first: 100,
          after: undefined,
        },
      },
      result: {
        data: {
          timeTrackingGroups: {
            edges: [
              {
                node: {
                  id: groupId,
                  name: 'Test Group',
                  isActive: true,
                  stats: {
                    memberCount: 4,
                    managerCount: 1,
                  },
                  members: {
                    edges: [
                      {
                        cursor: 'cursor-1',
                        node: {
                          id: 'worker-1',
                          type: TimeTracking_TimeForType.Employee,
                          isActive: true,
                          firstName: 'John',
                          lastName: 'Doe',
                          displayName: 'John Doe',
                          identityAuthId: 'auth-1',
                          intuitProfileId: 'profile-1',
                        },
                      },
                    ],
                    pageInfo: {
                      hasNextPage: true,
                      hasPreviousPage: false,
                      startCursor: 'cursor-1',
                      endCursor: 'cursor-1',
                    },
                  },
                },
              },
            ],
          },
        },
      },
    };

    const fetchMoreMalformedMock = {
      request: {
        query: GET_GROUP_MEMBERS_QUERY,
        variables: {
          groupId,
          first: 100,
          after: 'cursor-1',
        },
      },
      result: {
        data: {
          timeTrackingGroups: {
            edges: [],
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetGroupMembers(),
      [initialMock, fetchMoreMalformedMock],
    );

    act(() => {
      result.current.loadMembers({ groupId, first: 100 });
    });

    await waitFor(() => {
      expect(result.current.members).toHaveLength(1);
    });

    // Call fetchMore with malformed result - should handle gracefully
    await act(async () => {
      await result.current.fetchMore();
    });

    // Should still have the original member
    expect(result.current.members).toHaveLength(1);
  });

  it('should refetch members without args', async () => {
    const groupId = 'group-123';
    const initialMock = {
      request: {
        query: GET_GROUP_MEMBERS_QUERY,
        variables: {
          groupId,
          first: 100,
          after: undefined,
        },
      },
      result: {
        data: {
          timeTrackingGroups: {
            edges: [
              {
                node: {
                  id: groupId,
                  name: 'Test Group',
                  isActive: true,
                  stats: {
                    memberCount: 1,
                    managerCount: 1,
                  },
                  members: {
                    edges: [
                      {
                        cursor: 'cursor-1',
                        node: {
                          id: 'worker-1',
                          type: TimeTracking_TimeForType.Employee,
                          isActive: true,
                          firstName: 'John',
                          lastName: 'Doe',
                          displayName: 'John Doe',
                          identityAuthId: 'auth-1',
                          intuitProfileId: 'profile-1',
                        },
                      },
                    ],
                    pageInfo: {
                      hasNextPage: false,
                      hasPreviousPage: false,
                      startCursor: 'cursor-1',
                      endCursor: 'cursor-1',
                    },
                  },
                },
              },
            ],
          },
        },
      },
    };

    const refetchMock = {
      request: {
        query: GET_GROUP_MEMBERS_QUERY,
        variables: {
          groupId,
          first: 100,
          after: undefined,
        },
      },
      result: {
        data: {
          timeTrackingGroups: {
            edges: [
              {
                node: {
                  id: groupId,
                  name: 'Test Group',
                  isActive: true,
                  stats: {
                    memberCount: 2,
                    managerCount: 1,
                  },
                  members: {
                    edges: [
                      {
                        cursor: 'cursor-1',
                        node: {
                          id: 'worker-1',
                          type: TimeTracking_TimeForType.Employee,
                          isActive: true,
                          firstName: 'John',
                          lastName: 'Doe',
                          displayName: 'John Doe',
                          identityAuthId: 'auth-1',
                          intuitProfileId: 'profile-1',
                        },
                      },
                      {
                        cursor: 'cursor-2',
                        node: {
                          id: 'worker-2',
                          type: TimeTracking_TimeForType.Employee,
                          isActive: true,
                          firstName: 'Jane',
                          lastName: 'Smith',
                          displayName: 'Jane Smith',
                          identityAuthId: 'auth-2',
                          intuitProfileId: 'profile-2',
                        },
                      },
                    ],
                    pageInfo: {
                      hasNextPage: false,
                      hasPreviousPage: false,
                      startCursor: 'cursor-1',
                      endCursor: 'cursor-2',
                    },
                  },
                },
              },
            ],
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetGroupMembers(),
      [initialMock, refetchMock],
    );

    act(() => {
      result.current.loadMembers({ groupId, first: 100 });
    });

    await waitFor(() => {
      expect(result.current.members).toHaveLength(1);
    });

    // Refetch without args
    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.members).toHaveLength(2);
    });

    expect(result.current.groupInfo?.memberCount).toBe(2);
  });

  it('should refetch members with new args', async () => {
    const groupId = 'group-123';
    const newGroupId = 'group-456';

    const initialMock = {
      request: {
        query: GET_GROUP_MEMBERS_QUERY,
        variables: {
          groupId,
          first: 100,
          after: undefined,
        },
      },
      result: {
        data: {
          timeTrackingGroups: {
            edges: [
              {
                node: {
                  id: groupId,
                  name: 'Test Group',
                  isActive: true,
                  stats: {
                    memberCount: 1,
                    managerCount: 1,
                  },
                  members: {
                    edges: [
                      {
                        cursor: 'cursor-1',
                        node: {
                          id: 'worker-1',
                          type: TimeTracking_TimeForType.Employee,
                          isActive: true,
                          firstName: 'John',
                          lastName: 'Doe',
                          displayName: 'John Doe',
                          identityAuthId: 'auth-1',
                          intuitProfileId: 'profile-1',
                        },
                      },
                    ],
                    pageInfo: {
                      hasNextPage: false,
                      hasPreviousPage: false,
                      startCursor: 'cursor-1',
                      endCursor: 'cursor-1',
                    },
                  },
                },
              },
            ],
          },
        },
      },
    };

    const refetchMock = {
      request: {
        query: GET_GROUP_MEMBERS_QUERY,
        variables: {
          groupId: newGroupId,
          first: 100,
          after: undefined,
        },
      },
      result: {
        data: {
          timeTrackingGroups: {
            edges: [
              {
                node: {
                  id: newGroupId,
                  name: 'New Test Group',
                  isActive: true,
                  stats: {
                    memberCount: 1,
                    managerCount: 1,
                  },
                  members: {
                    edges: [
                      {
                        cursor: 'cursor-100',
                        node: {
                          id: 'worker-100',
                          type: TimeTracking_TimeForType.Employee,
                          isActive: true,
                          firstName: 'Bob',
                          lastName: 'Wilson',
                          displayName: 'Bob Wilson',
                          identityAuthId: 'auth-100',
                          intuitProfileId: 'profile-100',
                        },
                      },
                    ],
                    pageInfo: {
                      hasNextPage: false,
                      hasPreviousPage: false,
                      startCursor: 'cursor-100',
                      endCursor: 'cursor-100',
                    },
                  },
                },
              },
            ],
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetGroupMembers(),
      [initialMock, refetchMock],
    );

    act(() => {
      result.current.loadMembers({ groupId, first: 100 });
    });

    await waitFor(() => {
      expect(result.current.members).toHaveLength(1);
    });

    expect(result.current.groupInfo?.name).toBe('Test Group');

    // Refetch with new groupId
    await act(async () => {
      await result.current.refetch({ groupId: newGroupId, first: 100 });
    });

    await waitFor(() => {
      expect(result.current.members[0].id).toBe('worker-100');
    });

    expect(result.current.groupInfo?.name).toBe('New Test Group');
  });
});
