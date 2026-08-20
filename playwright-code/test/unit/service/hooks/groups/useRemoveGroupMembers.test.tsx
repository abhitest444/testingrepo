/* eslint-disable camelcase */
import { act } from '@testing-library/react-hooks';
import { renderHookWithApolloProvider } from 'test/unit/testUtils';
import { REMOVE_GROUP_MEMBERS_MUTATION } from 'src/js/service/queries/timeTrackingGroupMutations';
import {
  useRemoveGroupMembers,
  RemoveGroupMembersResult,
} from 'src/js/service/hooks/groups/useRemoveGroupMembers';
import { TimeTracking_TimeForType } from 'src/__generated__/timeTracking/graphql';
import { TimeCustomerInteraction } from 'src/js/common/CustomerInteraction';

// Mock the customer interaction functions so setInteractionDegraded branch is covered
jest.mock('src/js/common/CustomerInteraction', () => {
  const actual = jest.requireActual<
    typeof import('src/js/common/CustomerInteraction')
  >('src/js/common/CustomerInteraction');
  return {
    ...actual,
    createCustomerInteraction: jest.fn(),
    endInteractionWithSuccess: jest.fn(),
    endInteractionWithFailure: jest.fn(),
    setInteractionDegraded: jest.fn(),
    shouldTreatErrorAsDegraded: jest.fn(
      (errorCode?: string, errorMessage?: string) =>
        actual.shouldTreatErrorAsDegraded(errorCode, errorMessage),
    ),
  };
});

describe('useRemoveGroupMembers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the hook interface with mutation function, loading state, and error', () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const { result } = renderHookWithApolloProvider(
      () => useRemoveGroupMembers({ onSuccess, onError }),
      [],
    );

    const [mutate, { loading, error }] = result.current;

    expect(mutate).toBeDefined();
    expect(typeof mutate).toBe('function');
    expect(loading).toBe(false);
    expect(error).toBeUndefined();
  });

  it('should handle successful removal of all members (SUCCESS)', async () => {
    const groupId = 'group-123';
    const members = [
      { id: 'worker-1', timeForType: TimeTracking_TimeForType.Employee },
      { id: 'worker-2', timeForType: TimeTracking_TimeForType.Vendor },
    ];
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const successMock = {
      request: {
        query: REMOVE_GROUP_MEMBERS_MUTATION,
        variables: {
          input: { groupId, members },
        },
      },
      result: {
        data: {
          timeTrackingRemoveGroupMembers: {
            successCode: 'SUCCESS',
            group: {
              id: groupId,
              name: 'California Team',
              meta: {
                version: 2,
              },
              stats: {
                memberCount: 0,
              },
            },
            removalResults: [
              {
                worker: {
                  id: 'worker-1',
                  type: TimeTracking_TimeForType.Employee,
                  isActive: true,
                  firstName: 'John',
                  lastName: 'Doe',
                  displayName: 'John Doe',
                },
              },
              {
                worker: {
                  id: 'worker-2',
                  type: TimeTracking_TimeForType.Vendor,
                  isActive: true,
                  firstName: 'Jane',
                  lastName: 'Smith',
                  displayName: 'Jane Smith',
                },
              },
            ],
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useRemoveGroupMembers({ onSuccess, onError }),
      [successMock],
    );

    const [mutate] = result.current;

    await act(async () => {
      await mutate({
        variables: {
          input: { groupId, members },
        },
      });
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith<[RemoveGroupMembersResult]>({
      success: true,
      removedCount: 2,
      failedCount: 0,
    });
    expect(onError).not.toHaveBeenCalled();
  });

  it('should handle partial success with some failures (PARTIAL_SUCCESS)', async () => {
    const groupId = 'group-123';
    const members = [
      { id: 'worker-1', timeForType: TimeTracking_TimeForType.Employee },
      { id: 'worker-2', timeForType: TimeTracking_TimeForType.Vendor },
      { id: 'worker-3', timeForType: TimeTracking_TimeForType.Employee },
    ];
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const partialSuccessMock = {
      request: {
        query: REMOVE_GROUP_MEMBERS_MUTATION,
        variables: {
          input: { groupId, members },
        },
      },
      result: {
        data: {
          timeTrackingRemoveGroupMembers: {
            successCode: 'PARTIAL_SUCCESS',
            group: {
              id: groupId,
              name: 'California Team',
              meta: {
                version: 2,
              },
              stats: {
                memberCount: 1,
              },
            },
            removalResults: [
              {
                worker: {
                  id: 'worker-1',
                  type: TimeTracking_TimeForType.Employee,
                  isActive: true,
                  firstName: 'John',
                  lastName: 'Doe',
                  displayName: 'John Doe',
                },
              },
              {
                workerId: 'worker-2',
                errorCode: 'WORKER_NOT_FOUND',
                errorMessage: 'Worker not found in group',
              },
              {
                worker: {
                  id: 'worker-3',
                  type: TimeTracking_TimeForType.Employee,
                  isActive: true,
                  firstName: 'Bob',
                  lastName: 'Wilson',
                  displayName: 'Bob Wilson',
                },
              },
            ],
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useRemoveGroupMembers({ onSuccess, onError }),
      [partialSuccessMock],
    );

    const [mutate] = result.current;

    await act(async () => {
      await mutate({
        variables: {
          input: { groupId, members },
        },
      });
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith<[RemoveGroupMembersResult]>({
      success: true,
      partialSuccess: true,
      removedCount: 2,
      failedCount: 1,
      failures: [
        {
          workerId: 'worker-2',
          errorCode: 'WORKER_NOT_FOUND',
          errorMessage: 'Worker not found in group',
        },
      ],
    });
    expect(onError).not.toHaveBeenCalled();
  });

  it('should call setInteractionDegraded when partial success has all WORKER_VALIDATION_FAILED failures', async () => {
    const groupId = 'group-123';
    const members = [
      { id: 'worker-1', timeForType: TimeTracking_TimeForType.Employee },
      { id: 'worker-2', timeForType: TimeTracking_TimeForType.Employee },
    ];
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const partialSuccessAllValidationMock = {
      request: {
        query: REMOVE_GROUP_MEMBERS_MUTATION,
        variables: { input: { groupId, members } },
      },
      result: {
        data: {
          timeTrackingRemoveGroupMembers: {
            successCode: 'PARTIAL_SUCCESS',
            group: {
              id: groupId,
              name: 'Team',
              meta: { version: 1 },
              stats: { memberCount: 1 },
            },
            removalResults: [
              {
                worker: {
                  id: 'worker-1',
                  type: TimeTracking_TimeForType.Employee,
                  isActive: true,
                  firstName: 'A',
                  lastName: 'A',
                  displayName: 'A A',
                },
              },
              {
                workerId: 'worker-2',
                errorCode: 'WORKER_VALIDATION_FAILED',
                errorMessage: "Worker 'B' is inactive",
              },
            ],
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useRemoveGroupMembers({ onSuccess, onError }),
      [partialSuccessAllValidationMock],
    );

    await act(async () => {
      await result.current[0]({ variables: { input: { groupId, members } } });
    });

    expect(onSuccess).toHaveBeenCalled();
    const {
      setInteractionDegraded,
    } = require('src/js/common/CustomerInteraction');
    expect(setInteractionDegraded).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.GROUP_REMOVE_MEMBERS,
      'Some workers could not be removed due to validation errors',
    );
  });

  it('should call setInteractionDegraded when successCode is FAILURE and all failures are WORKER_VALIDATION_FAILED', async () => {
    const groupId = 'group-123';
    const members = [
      { id: 'worker-1', timeForType: TimeTracking_TimeForType.Employee },
      { id: 'worker-2', timeForType: TimeTracking_TimeForType.Employee },
    ];
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const totalFailureValidationMock = {
      request: {
        query: REMOVE_GROUP_MEMBERS_MUTATION,
        variables: { input: { groupId, members } },
      },
      result: {
        data: {
          timeTrackingRemoveGroupMembers: {
            successCode: 'FAILURE',
            group: {
              id: groupId,
              name: 'Team',
              meta: { version: 1 },
              stats: { memberCount: 0 },
            },
            removalResults: [
              {
                workerId: 'worker-1',
                errorCode: 'WORKER_VALIDATION_FAILED',
                errorMessage: 'Worker is inactive',
              },
              {
                workerId: 'worker-2',
                errorCode: 'WORKER_VALIDATION_FAILED',
                errorMessage: 'Worker is inactive',
              },
            ],
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useRemoveGroupMembers({ onSuccess, onError }),
      [totalFailureValidationMock],
    );

    await act(async () => {
      await result.current[0]({ variables: { input: { groupId, members } } });
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      'Failed to remove workers',
      'WORKER_VALIDATION_FAILED',
    );
    const {
      setInteractionDegraded,
    } = require('src/js/common/CustomerInteraction');
    expect(setInteractionDegraded).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.GROUP_REMOVE_MEMBERS,
      'Failed to remove workers',
    );
  });

  it('should call endInteractionWithFailure when successCode is FAILURE and failures are mixed (not all WORKER_VALIDATION_FAILED)', async () => {
    const groupId = 'group-123';
    const members = [
      { id: 'worker-1', timeForType: TimeTracking_TimeForType.Employee },
      { id: 'worker-2', timeForType: TimeTracking_TimeForType.Employee },
    ];
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const totalFailureMixedMock = {
      request: {
        query: REMOVE_GROUP_MEMBERS_MUTATION,
        variables: { input: { groupId, members } },
      },
      result: {
        data: {
          timeTrackingRemoveGroupMembers: {
            successCode: 'FAILURE',
            group: {
              id: groupId,
              name: 'Team',
              meta: { version: 1 },
              stats: { memberCount: 0 },
            },
            removalResults: [
              {
                workerId: 'worker-1',
                errorCode: 'WORKER_VALIDATION_FAILED',
                errorMessage: 'Worker is inactive',
              },
              {
                workerId: 'worker-2',
                errorCode: 'NOT_IN_GROUP',
                errorMessage: 'Worker not in group',
              },
            ],
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useRemoveGroupMembers({ onSuccess, onError }),
      [totalFailureMixedMock],
    );

    await act(async () => {
      await result.current[0]({ variables: { input: { groupId, members } } });
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      'Failed to remove workers',
      expect.anything(),
    );
    const {
      endInteractionWithFailure,
    } = require('src/js/common/CustomerInteraction');
    expect(endInteractionWithFailure).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.GROUP_REMOVE_MEMBERS,
      'Failed to remove workers',
    );
  });

  it('should call setInteractionDegraded when error has WORKER_VALIDATION_FAILED code', async () => {
    const groupId = 'group-123';
    const members = [
      { id: 'worker-1', timeForType: TimeTracking_TimeForType.Employee },
    ];
    const errorMessage = 'Some workers are inactive';
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const validationErrorMock = {
      request: {
        query: REMOVE_GROUP_MEMBERS_MUTATION,
        variables: { input: { groupId, members } },
      },
      result: {
        data: {
          timeTrackingRemoveGroupMembers: {
            errorCode: 'WORKER_VALIDATION_FAILED',
            message: errorMessage,
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useRemoveGroupMembers({ onSuccess, onError }),
      [validationErrorMock],
    );

    await act(async () => {
      await result.current[0]({ variables: { input: { groupId, members } } });
    });

    expect(onError).toHaveBeenCalledWith(
      errorMessage,
      'WORKER_VALIDATION_FAILED',
    );
    const {
      setInteractionDegraded,
    } = require('src/js/common/CustomerInteraction');
    expect(setInteractionDegraded).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.GROUP_REMOVE_MEMBERS,
      errorMessage,
    );
  });

  it('should handle complete error result', async () => {
    const groupId = 'group-123';
    const members = [
      { id: 'worker-1', timeForType: TimeTracking_TimeForType.Employee },
    ];
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const errorMock = {
      request: {
        query: REMOVE_GROUP_MEMBERS_MUTATION,
        variables: {
          input: { groupId, members },
        },
      },
      result: {
        data: {
          timeTrackingRemoveGroupMembers: {
            errorCode: 'GROUP_NOT_FOUND',
            message: 'Group with ID group-123 not found',
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useRemoveGroupMembers({ onSuccess, onError }),
      [errorMock],
    );

    const [mutate] = result.current;

    await act(async () => {
      await mutate({
        variables: {
          input: { groupId, members },
        },
      });
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      'Group with ID group-123 not found',
      'GROUP_NOT_FOUND',
    );
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('should handle network/Apollo errors', async () => {
    const groupId = 'group-123';
    const members = [
      { id: 'worker-1', timeForType: TimeTracking_TimeForType.Employee },
    ];
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const networkErrorMock = {
      request: {
        query: REMOVE_GROUP_MEMBERS_MUTATION,
        variables: {
          input: { groupId, members },
        },
      },
      error: new Error('Network error'),
    };

    const { result } = renderHookWithApolloProvider(
      () => useRemoveGroupMembers({ onSuccess, onError }),
      [networkErrorMock],
    );

    const [mutate] = result.current;

    await act(async () => {
      await mutate({
        variables: {
          input: { groupId, members },
        },
      });
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith('Network error', '');
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('should handle null response', async () => {
    const groupId = 'group-123';
    const members = [
      { id: 'worker-1', timeForType: TimeTracking_TimeForType.Employee },
    ];
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const nullResponseMock = {
      request: {
        query: REMOVE_GROUP_MEMBERS_MUTATION,
        variables: {
          input: { groupId, members },
        },
      },
      result: {
        data: {
          timeTrackingRemoveGroupMembers: null,
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useRemoveGroupMembers({ onSuccess, onError }),
      [nullResponseMock],
    );

    const [mutate] = result.current;

    await act(async () => {
      await mutate({
        variables: {
          input: { groupId, members },
        },
      });
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith('Null Response', '');
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('should handle null error codes and messages in failures', async () => {
    const groupId = 'group-123';
    const members = [
      { id: 'worker-1', timeForType: TimeTracking_TimeForType.Employee },
      { id: 'worker-2', timeForType: TimeTracking_TimeForType.Vendor },
    ];
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const partialSuccessMock = {
      request: {
        query: REMOVE_GROUP_MEMBERS_MUTATION,
        variables: {
          input: { groupId, members },
        },
      },
      result: {
        data: {
          timeTrackingRemoveGroupMembers: {
            successCode: 'PARTIAL_SUCCESS',
            group: {
              id: groupId,
              name: 'California Team',
              meta: {
                version: 2,
              },
              stats: {
                memberCount: 1,
              },
            },
            removalResults: [
              {
                worker: {
                  id: 'worker-1',
                  type: TimeTracking_TimeForType.Employee,
                  isActive: true,
                  firstName: 'John',
                  lastName: 'Doe',
                  displayName: 'John Doe',
                },
              },
              {
                workerId: 'worker-2',
                errorCode: null,
                errorMessage: null,
              },
            ],
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useRemoveGroupMembers({ onSuccess, onError }),
      [partialSuccessMock],
    );

    const [mutate] = result.current;

    await act(async () => {
      await mutate({
        variables: {
          input: { groupId, members },
        },
      });
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith<[RemoveGroupMembersResult]>({
      success: true,
      partialSuccess: true,
      removedCount: 1,
      failedCount: 1,
      failures: [
        {
          workerId: 'worker-2',
          errorCode: null,
          errorMessage: null,
        },
      ],
    });
    expect(onError).not.toHaveBeenCalled();
  });

  it('should handle error without message field', async () => {
    const groupId = 'group-123';
    const members = [
      { id: 'worker-1', timeForType: TimeTracking_TimeForType.Employee },
    ];
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const errorMock = {
      request: {
        query: REMOVE_GROUP_MEMBERS_MUTATION,
        variables: {
          input: { groupId, members },
        },
      },
      result: {
        data: {
          timeTrackingRemoveGroupMembers: {
            errorCode: 'UNKNOWN_ERROR',
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useRemoveGroupMembers({ onSuccess, onError }),
      [errorMock],
    );

    const [mutate] = result.current;

    await act(async () => {
      await mutate({
        variables: {
          input: { groupId, members },
        },
      });
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      'Remove members failed',
      'UNKNOWN_ERROR',
    );
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('should handle unexpected response type', async () => {
    const groupId = 'group-123';
    const members = [
      { id: 'worker-1', timeForType: TimeTracking_TimeForType.Employee },
    ];
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const unexpectedResponseMock = {
      request: {
        query: REMOVE_GROUP_MEMBERS_MUTATION,
        variables: {
          input: { groupId, members },
        },
      },
      result: {
        data: {
          timeTrackingRemoveGroupMembers: {
            unexpected: 'response',
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useRemoveGroupMembers({ onSuccess, onError }),
      [unexpectedResponseMock],
    );

    const [mutate] = result.current;

    await act(async () => {
      await mutate({
        variables: {
          input: { groupId, members },
        },
      });
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith('Unexpected response type', '');
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('should handle degraded error with OPTIMISTIC_LOCK_FAILURE', async () => {
    const groupId = 'group-123';
    const members = [
      { id: 'worker-1', timeForType: TimeTracking_TimeForType.Employee },
    ];
    const errorMessage = 'Group was modified by another user';
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const errorMock = {
      request: {
        query: REMOVE_GROUP_MEMBERS_MUTATION,
        variables: {
          input: { groupId, members },
        },
      },
      result: {
        data: {
          timeTrackingRemoveGroupMembers: {
            errorCode: 'OPTIMISTIC_LOCK_FAILURE',
            message: errorMessage,
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useRemoveGroupMembers({ onSuccess, onError }),
      [errorMock],
    );

    const [mutate] = result.current;

    await act(async () => {
      await mutate({
        variables: {
          input: { groupId, members },
        },
      });
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      errorMessage,
      'OPTIMISTIC_LOCK_FAILURE',
    );

    // Verify degraded interaction tracking
    const {
      setInteractionDegraded,
    } = require('src/js/common/CustomerInteraction');
    expect(setInteractionDegraded).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.GROUP_REMOVE_MEMBERS,
      errorMessage,
    );
  });
});
