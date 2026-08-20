/* eslint-disable camelcase */
import { act } from '@testing-library/react-hooks';
import { renderHookWithApolloProvider } from 'test/unit/testUtils';
import { GET_CURRENT_GROUP_MANAGERS } from 'src/js/service/queries/timeTrackingGroupQueries';
import { useGetGroupManagers } from 'src/js/service/hooks/groups/useGetGroupManagers';
import { TimeTracking_TimeForType } from 'src/__generated__/timeTracking/graphql';
import { TimeCustomerInteraction } from 'src/js/common/CustomerInteraction';

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

// Mock the customer interaction of functions
jest.mock('src/js/common/CustomerInteraction', () => ({
  ...jest.requireActual('src/js/common/CustomerInteraction'),
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn(() => ({})),
}));

describe('useGetGroupManagers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the hook interface with initial state', () => {
    const { result } = renderHookWithApolloProvider(
      () => useGetGroupManagers(),
      [],
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.managers).toEqual([]);
    expect(result.current.groupInfo).toBeNull();
    expect(result.current.pageInfo).toBeNull();
    expect(result.current.error).toBeNull();
    expect(typeof result.current.loadManagers).toBe('function');
    expect(typeof result.current.fetchMore).toBe('function');
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should successfully load group managers', async () => {
    const groupId = 'group-123';
    const successMock = {
      request: {
        query: GET_CURRENT_GROUP_MANAGERS,
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
                  name: 'California Team',
                  isActive: true,
                  stats: {
                    memberCount: 10,
                    managerCount: 2,
                  },
                  managers: {
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
                          memberOfGroup: {
                            id: 'group-abc',
                            name: 'Alpha Team',
                            isActive: true,
                          },
                        },
                      },
                      {
                        cursor: 'cursor-2',
                        node: {
                          id: 'worker-2',
                          type: TimeTracking_TimeForType.Vendor,
                          isActive: true,
                          firstName: 'Jane',
                          lastName: 'Smith',
                          displayName: 'Jane Smith',
                          identityAuthId: 'auth-2',
                          intuitProfileId: 'profile-2',
                          memberOfGroup: null,
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

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useGetGroupManagers(),
      [successMock],
    );

    act(() => {
      result.current.loadManagers({ groupId });
    });

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.managers).toHaveLength(2);
    expect(result.current.managers[0].id).toBe('worker-1');
    expect(result.current.managers[0].displayName).toBe('John Doe');
    expect(result.current.managers[1].id).toBe('worker-2');
    expect(result.current.managers[1].displayName).toBe('Jane Smith');

    expect(result.current.groupInfo).toEqual({
      id: groupId,
      name: 'California Team',
      isActive: true,
      memberCount: 10,
      managerCount: 2,
    });

    expect(result.current.pageInfo).toEqual({
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: 'cursor-1',
      endCursor: 'cursor-2',
    });

    expect(result.current.error).toBeNull();

    // Verify customer interaction tracking
    const {
      endInteractionWithSuccess,
    } = require('src/js/common/CustomerInteraction');
    expect(endInteractionWithSuccess).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.GROUP_MANAGERS_READ,
    );
  });

  it('should load managers with custom first parameter', async () => {
    const groupId = 'group-123';
    const customFirst = 50;

    const successMock = {
      request: {
        query: GET_CURRENT_GROUP_MANAGERS,
        variables: {
          groupId,
          first: customFirst,
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
                  name: 'California Team',
                  isActive: true,
                  stats: {
                    memberCount: 10,
                    managerCount: 1,
                  },
                  managers: {
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
                          memberOfGroup: null,
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

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useGetGroupManagers(),
      [successMock],
    );

    act(() => {
      result.current.loadManagers({ groupId, first: customFirst });
    });

    await waitForNextUpdate();

    expect(result.current.managers).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it('should handle group with no managers', async () => {
    const groupId = 'group-123';
    const emptyMock = {
      request: {
        query: GET_CURRENT_GROUP_MANAGERS,
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
                  name: 'Empty Team',
                  isActive: true,
                  stats: {
                    memberCount: 5,
                    managerCount: 0,
                  },
                  managers: {
                    edges: [],
                    pageInfo: {
                      hasNextPage: false,
                      hasPreviousPage: false,
                      startCursor: null,
                      endCursor: null,
                    },
                  },
                },
              },
            ],
          },
        },
      },
    };

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useGetGroupManagers(),
      [emptyMock],
    );

    act(() => {
      result.current.loadManagers({ groupId });
    });

    await waitForNextUpdate();

    expect(result.current.managers).toEqual([]);
    expect(result.current.groupInfo?.managerCount).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it('should handle pagination with hasNextPage', async () => {
    const groupId = 'group-123';
    const paginationMock = {
      request: {
        query: GET_CURRENT_GROUP_MANAGERS,
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
                  name: 'Large Team',
                  isActive: true,
                  stats: {
                    memberCount: 200,
                    managerCount: 150,
                  },
                  managers: {
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
                          memberOfGroup: null,
                        },
                      },
                    ],
                    pageInfo: {
                      hasNextPage: true,
                      hasPreviousPage: false,
                      startCursor: 'cursor-1',
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

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useGetGroupManagers(),
      [paginationMock],
    );

    act(() => {
      result.current.loadManagers({ groupId });
    });

    await waitForNextUpdate();

    expect(result.current.pageInfo?.hasNextPage).toBe(true);
    expect(result.current.pageInfo?.endCursor).toBe('cursor-100');
  });

  it('should handle network errors', async () => {
    const groupId = 'group-123';
    const networkError = new Error('Network request failed');

    const errorMock = {
      request: {
        query: GET_CURRENT_GROUP_MANAGERS,
        variables: {
          groupId,
          first: 100,
          after: undefined,
        },
      },
      error: networkError,
    };

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useGetGroupManagers(),
      [errorMock],
    );

    act(() => {
      result.current.loadManagers({ groupId });
    });

    await waitForNextUpdate();

    expect(result.current.error).toBe('Network request failed');
    expect(result.current.managers).toEqual([]);

    // Verify error interaction tracking
    const {
      endInteractionWithFailure,
    } = require('src/js/common/CustomerInteraction');
    expect(endInteractionWithFailure).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.GROUP_MANAGERS_READ,
      'Network request failed',
      expect.any(Error),
    );
  });

  it('should handle group not found (empty edges)', async () => {
    const groupId = 'non-existent-group';
    const notFoundMock = {
      request: {
        query: GET_CURRENT_GROUP_MANAGERS,
        variables: {
          groupId,
          first: 100,
          after: undefined,
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

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useGetGroupManagers(),
      [notFoundMock],
    );

    act(() => {
      result.current.loadManagers({ groupId });
    });

    await waitForNextUpdate();

    expect(result.current.managers).toEqual([]);
    expect(result.current.groupInfo).toBeNull();
    expect(result.current.pageInfo).toBeNull();
  });

  it('should handle pagination cursor', async () => {
    const groupId = 'group-123';
    const after = 'cursor-100';

    const paginationMock = {
      request: {
        query: GET_CURRENT_GROUP_MANAGERS,
        variables: {
          groupId,
          first: 100,
          after,
        },
      },
      result: {
        data: {
          timeTrackingGroups: {
            edges: [
              {
                node: {
                  id: groupId,
                  name: 'California Team',
                  isActive: true,
                  stats: {
                    memberCount: 10,
                    managerCount: 2,
                  },
                  managers: {
                    edges: [
                      {
                        cursor: 'cursor-101',
                        node: {
                          id: 'worker-101',
                          type: TimeTracking_TimeForType.Employee,
                          isActive: true,
                          firstName: 'Next',
                          lastName: 'Worker',
                          displayName: 'Next Worker',
                          identityAuthId: 'auth-101',
                          intuitProfileId: 'profile-101',
                          memberOfGroup: null,
                        },
                      },
                    ],
                    pageInfo: {
                      hasNextPage: false,
                      hasPreviousPage: true,
                      startCursor: 'cursor-101',
                      endCursor: 'cursor-101',
                    },
                  },
                },
              },
            ],
          },
        },
      },
    };

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useGetGroupManagers(),
      [paginationMock],
    );

    act(() => {
      result.current.loadManagers({ groupId, after });
    });

    await waitForNextUpdate();

    expect(result.current.managers).toHaveLength(1);
    expect(result.current.managers[0].id).toBe('worker-101');
    expect(result.current.pageInfo?.hasPreviousPage).toBe(true);
  });

  it('should fetch more managers successfully', async () => {
    const groupId = 'group-123';
    const initialMock = {
      request: {
        query: GET_CURRENT_GROUP_MANAGERS,
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
                  name: 'California Team',
                  isActive: true,
                  stats: {
                    memberCount: 10,
                    managerCount: 4,
                  },
                  managers: {
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
                          memberOfGroup: null,
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
        query: GET_CURRENT_GROUP_MANAGERS,
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
                  name: 'California Team',
                  isActive: true,
                  stats: {
                    memberCount: 10,
                    managerCount: 4,
                  },
                  managers: {
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
                          memberOfGroup: null,
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

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useGetGroupManagers(),
      [initialMock, fetchMoreMock],
    );

    act(() => {
      result.current.loadManagers({ groupId });
    });

    await waitForNextUpdate();

    expect(result.current.managers).toHaveLength(1);
    expect(result.current.managers[0].id).toBe('worker-1');

    // Call fetchMore
    await act(async () => {
      await result.current.fetchMore();
    });

    await waitFor(() => {
      expect(result.current.managers).toHaveLength(2);
    });

    // Should have both managers now
    expect(result.current.managers[0].id).toBe('worker-1');
    expect(result.current.managers[1].id).toBe('worker-2');
    expect(result.current.pageInfo?.hasNextPage).toBe(false);
  });

  it('should not fetch more when hasNextPage is false', async () => {
    const groupId = 'group-123';
    const successMock = {
      request: {
        query: GET_CURRENT_GROUP_MANAGERS,
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
                  name: 'California Team',
                  isActive: true,
                  stats: {
                    memberCount: 10,
                    managerCount: 2,
                  },
                  managers: {
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
                          memberOfGroup: null,
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

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useGetGroupManagers(),
      [successMock],
    );

    act(() => {
      result.current.loadManagers({ groupId });
    });

    await waitForNextUpdate();

    expect(result.current.managers).toHaveLength(1);

    // Call fetchMore when there's no next page - should do nothing
    await act(async () => {
      await result.current.fetchMore();
    });

    // Should still have only 1 manager
    expect(result.current.managers).toHaveLength(1);
  });

  it('should not fetch more when data is not loaded', async () => {
    const { result } = renderHookWithApolloProvider(
      () => useGetGroupManagers(),
      [],
    );

    // Call fetchMore without loading data first
    await act(async () => {
      await result.current.fetchMore();
    });

    // Should still be empty
    expect(result.current.managers).toHaveLength(0);
  });

  it('should handle fetchMore errors gracefully', async () => {
    const groupId = 'group-123';
    const initialMock = {
      request: {
        query: GET_CURRENT_GROUP_MANAGERS,
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
                  name: 'California Team',
                  isActive: true,
                  stats: {
                    memberCount: 10,
                    managerCount: 4,
                  },
                  managers: {
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
                          memberOfGroup: null,
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
        query: GET_CURRENT_GROUP_MANAGERS,
        variables: {
          groupId,
          first: 100,
          after: 'cursor-1',
        },
      },
      error: new Error('Network error'),
    };

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useGetGroupManagers(),
      [initialMock, fetchMoreErrorMock],
    );

    act(() => {
      result.current.loadManagers({ groupId });
    });

    await waitForNextUpdate();

    expect(result.current.managers).toHaveLength(1);

    // Call fetchMore - should handle error gracefully
    await act(async () => {
      await result.current.fetchMore();
    });

    // Should still have the original manager
    expect(result.current.managers).toHaveLength(1);
  });

  it('should handle fetchMore with incomplete data', async () => {
    const groupId = 'group-123';
    const initialMock = {
      request: {
        query: GET_CURRENT_GROUP_MANAGERS,
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
                  name: 'California Team',
                  isActive: true,
                  stats: {
                    memberCount: 10,
                    managerCount: 4,
                  },
                  managers: {
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
                          memberOfGroup: null,
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
        query: GET_CURRENT_GROUP_MANAGERS,
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

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useGetGroupManagers(),
      [initialMock, fetchMoreEmptyMock],
    );

    act(() => {
      result.current.loadManagers({ groupId });
    });

    await waitForNextUpdate();

    expect(result.current.managers).toHaveLength(1);

    // Call fetchMore with empty result - should handle gracefully
    await act(async () => {
      await result.current.fetchMore();
    });

    // Should still have the original manager
    expect(result.current.managers).toHaveLength(1);
  });

  it('should handle group without stats', async () => {
    const groupId = 'group-123';
    const noStatsMock = {
      request: {
        query: GET_CURRENT_GROUP_MANAGERS,
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
                  name: 'Team Without Stats',
                  isActive: true,
                  stats: null, // No stats
                  managers: {
                    edges: [],
                    pageInfo: {
                      hasNextPage: false,
                      hasPreviousPage: false,
                      startCursor: null,
                      endCursor: null,
                    },
                  },
                },
              },
            ],
          },
        },
      },
    };

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useGetGroupManagers(),
      [noStatsMock],
    );

    act(() => {
      result.current.loadManagers({ groupId });
    });

    await waitForNextUpdate();

    expect(result.current.groupInfo?.memberCount).toBe(0);
    expect(result.current.groupInfo?.managerCount).toBe(0);
  });

  it('should handle fetchMore with malformed edges', async () => {
    const groupId = 'group-123';
    const initialMock = {
      request: {
        query: GET_CURRENT_GROUP_MANAGERS,
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
                  name: 'California Team',
                  isActive: true,
                  stats: {
                    memberCount: 10,
                    managerCount: 4,
                  },
                  managers: {
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
                          memberOfGroup: null,
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
        query: GET_CURRENT_GROUP_MANAGERS,
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

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useGetGroupManagers(),
      [initialMock, fetchMoreMalformedMock],
    );

    act(() => {
      result.current.loadManagers({ groupId });
    });

    await waitForNextUpdate();

    expect(result.current.managers).toHaveLength(1);

    // Call fetchMore with malformed result - should handle gracefully
    await act(async () => {
      await result.current.fetchMore();
    });

    // Should still have the original manager
    expect(result.current.managers).toHaveLength(1);
  });

  it('should refetch managers without args', async () => {
    const groupId = 'group-123';
    const initialMock = {
      request: {
        query: GET_CURRENT_GROUP_MANAGERS,
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
                  name: 'California Team',
                  isActive: true,
                  stats: {
                    memberCount: 10,
                    managerCount: 2,
                  },
                  managers: {
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
                          memberOfGroup: null,
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
        query: GET_CURRENT_GROUP_MANAGERS,
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
                  name: 'California Team',
                  isActive: true,
                  stats: {
                    memberCount: 10,
                    managerCount: 3,
                  },
                  managers: {
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
                          memberOfGroup: null,
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
                          memberOfGroup: null,
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

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useGetGroupManagers(),
      [initialMock, refetchMock],
    );

    act(() => {
      result.current.loadManagers({ groupId });
    });

    await waitForNextUpdate();

    expect(result.current.managers).toHaveLength(1);

    // Refetch without args
    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.managers).toHaveLength(2);
    });

    // Should have updated data
    expect(result.current.groupInfo?.managerCount).toBe(3);
  });

  it('should refetch managers with new args', async () => {
    const groupId = 'group-123';
    const newGroupId = 'group-456';

    const initialMock = {
      request: {
        query: GET_CURRENT_GROUP_MANAGERS,
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
                  name: 'California Team',
                  isActive: true,
                  stats: {
                    memberCount: 10,
                    managerCount: 2,
                  },
                  managers: {
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
                          memberOfGroup: null,
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
        query: GET_CURRENT_GROUP_MANAGERS,
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
                  name: 'Texas Team',
                  isActive: true,
                  stats: {
                    memberCount: 5,
                    managerCount: 1,
                  },
                  managers: {
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
                          memberOfGroup: null,
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

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useGetGroupManagers(),
      [initialMock, refetchMock],
    );

    act(() => {
      result.current.loadManagers({ groupId });
    });

    await waitForNextUpdate();

    expect(result.current.managers).toHaveLength(1);
    expect(result.current.groupInfo?.name).toBe('California Team');

    // Refetch with new groupId
    await act(async () => {
      await result.current.refetch({ groupId: newGroupId, first: 100 });
    });

    await waitFor(() => {
      expect(result.current.managers[0].id).toBe('worker-100');
    });

    // Should have new group's data
    expect(result.current.managers).toHaveLength(1);
    expect(result.current.groupInfo?.name).toBe('Texas Team');
  });
});
