/* eslint-disable camelcase */
import { act } from '@testing-library/react-hooks';
import { renderHookWithApolloProvider } from 'test/unit/testUtils';
import { ASSIGN_GROUP_MEMBERS_MUTATION } from 'src/js/service/queries/timeTrackingGroupMutations';
import {
  useAssignGroupMembers,
  AssignGroupMembersResult,
} from 'src/js/service/hooks/groups/useAssignGroupMembers';
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

describe('useAssignGroupMembers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the hook interface with mutation function, loading state, and error', () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const { result } = renderHookWithApolloProvider(
      () => useAssignGroupMembers({ onSuccess, onError }),
      [],
    );

    const [mutate, { loading, error }] = result.current;

    expect(mutate).toBeDefined();
    expect(typeof mutate).toBe('function');
    expect(loading).toBe(false);
    expect(error).toBeUndefined();
  });

  it('should handle successful assignment of all members (SUCCESS)', async () => {
    const groupId = 'group-123';
    const members = [
      { id: 'worker-1', timeForType: TimeTracking_TimeForType.Employee },
      { id: 'worker-2', timeForType: TimeTracking_TimeForType.Vendor },
    ];
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const successMock = {
      request: {
        query: ASSIGN_GROUP_MEMBERS_MUTATION,
        variables: {
          input: { groupId, members },
        },
      },
      result: {
        data: {
          timeTrackingAssignGroupMembers: {
            successCode: 'SUCCESS',
            group: {
              id: groupId,
              name: 'California Team',
              meta: {
                version: 1,
              },
              stats: {
                memberCount: 2,
              },
            },
            assignmentResults: [
              {
                worker: {
                  id: 'worker-1',
                  displayName: 'John Doe',
                  type: TimeTracking_TimeForType.Employee,
                },
              },
              {
                worker: {
                  id: 'worker-2',
                  displayName: 'Jane Smith',
                  type: TimeTracking_TimeForType.Vendor,
                },
              },
            ],
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useAssignGroupMembers({ onSuccess, onError }),
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

    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining<AssignGroupMembersResult>({
        success: true,
        assignedCount: 2,
        failedCount: 0,
      }),
    );
    expect(onError).not.toHaveBeenCalled();

    // Verify customer interaction tracking
    const {
      endInteractionWithSuccess,
    } = require('src/js/common/CustomerInteraction');
    expect(endInteractionWithSuccess).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.GROUP_ASSIGN_MEMBERS,
    );
  });

  it('should handle partial success (PARTIAL_SUCCESS) with some failures', async () => {
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
        query: ASSIGN_GROUP_MEMBERS_MUTATION,
        variables: {
          input: { groupId, members },
        },
      },
      result: {
        data: {
          timeTrackingAssignGroupMembers: {
            successCode: 'PARTIAL_SUCCESS',
            group: {
              id: groupId,
              name: 'California Team',
              meta: {
                version: 1,
              },
              stats: {
                memberCount: 2,
              },
            },
            assignmentResults: [
              {
                worker: {
                  id: 'worker-1',
                  displayName: 'John Doe',
                  type: TimeTracking_TimeForType.Employee,
                },
              },
              {
                worker: {
                  id: 'worker-2',
                  displayName: 'Jane Smith',
                  type: TimeTracking_TimeForType.Vendor,
                },
              },
              {
                workerId: 'worker-3',
                errorCode: 'MEMBER_ALREADY_IN_GROUP',
                errorMessage:
                  'Worker is already a member of another active group',
              },
            ],
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useAssignGroupMembers({ onSuccess, onError }),
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

    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining<AssignGroupMembersResult>({
        success: true,
        partialSuccess: true,
        assignedCount: 2,
        failedCount: 1,
        failures: [
          {
            workerId: 'worker-3',
            errorCode: 'MEMBER_ALREADY_IN_GROUP',
            errorMessage: 'Worker is already a member of another active group',
          },
        ],
      }),
    );
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
        query: ASSIGN_GROUP_MEMBERS_MUTATION,
        variables: { input: { groupId, members } },
      },
      result: {
        data: {
          timeTrackingAssignGroupMembers: {
            successCode: 'PARTIAL_SUCCESS',
            group: {
              id: groupId,
              name: 'Team',
              meta: { version: 1 },
              stats: { memberCount: 1 },
            },
            assignmentResults: [
              {
                worker: {
                  id: 'worker-1',
                  displayName: 'A',
                  type: TimeTracking_TimeForType.Employee,
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
      () => useAssignGroupMembers({ onSuccess, onError }),
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
      TimeCustomerInteraction.GROUP_ASSIGN_MEMBERS,
      'Some workers could not be assigned due to validation errors',
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
        query: ASSIGN_GROUP_MEMBERS_MUTATION,
        variables: { input: { groupId, members } },
      },
      result: {
        data: {
          timeTrackingAssignGroupMembers: {
            successCode: 'FAILURE',
            group: {
              id: groupId,
              name: 'Team',
              meta: { version: 1 },
              stats: { memberCount: 0 },
            },
            assignmentResults: [
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
      () => useAssignGroupMembers({ onSuccess, onError }),
      [totalFailureValidationMock],
    );

    await act(async () => {
      await result.current[0]({ variables: { input: { groupId, members } } });
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      'Failed to assign workers',
      'WORKER_VALIDATION_FAILED',
    );
    const {
      setInteractionDegraded,
    } = require('src/js/common/CustomerInteraction');
    expect(setInteractionDegraded).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.GROUP_ASSIGN_MEMBERS,
      'Failed to assign workers',
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
        query: ASSIGN_GROUP_MEMBERS_MUTATION,
        variables: { input: { groupId, members } },
      },
      result: {
        data: {
          timeTrackingAssignGroupMembers: {
            successCode: 'FAILURE',
            group: {
              id: groupId,
              name: 'Team',
              meta: { version: 1 },
              stats: { memberCount: 0 },
            },
            assignmentResults: [
              {
                workerId: 'worker-1',
                errorCode: 'WORKER_VALIDATION_FAILED',
                errorMessage: 'Worker is inactive',
              },
              {
                workerId: 'worker-2',
                errorCode: 'WORKER_NOT_FOUND',
                errorMessage: 'Worker not found',
              },
            ],
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useAssignGroupMembers({ onSuccess, onError }),
      [totalFailureMixedMock],
    );

    await act(async () => {
      await result.current[0]({ variables: { input: { groupId, members } } });
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      'Failed to assign workers',
      expect.anything(),
    );
    const {
      endInteractionWithFailure,
    } = require('src/js/common/CustomerInteraction');
    expect(endInteractionWithFailure).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.GROUP_ASSIGN_MEMBERS,
      'Failed to assign workers',
    );
  });

  it('should handle complete failure error (GROUP_NOT_FOUND)', async () => {
    const groupId = 'non-existent-group';
    const members = [
      { id: 'worker-1', timeForType: TimeTracking_TimeForType.Employee },
    ];
    const errorMessage = 'Group not found';
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const errorMock = {
      request: {
        query: ASSIGN_GROUP_MEMBERS_MUTATION,
        variables: {
          input: { groupId, members },
        },
      },
      result: {
        data: {
          timeTrackingAssignGroupMembers: {
            message: errorMessage,
            errorCode: 'GROUP_NOT_FOUND',
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useAssignGroupMembers({ onSuccess, onError }),
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
    expect(onError).toHaveBeenCalledWith(errorMessage, 'GROUP_NOT_FOUND');

    // Verify error interaction tracking
    const {
      endInteractionWithFailure,
    } = require('src/js/common/CustomerInteraction');
    expect(endInteractionWithFailure).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.GROUP_ASSIGN_MEMBERS,
      errorMessage,
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
        query: ASSIGN_GROUP_MEMBERS_MUTATION,
        variables: { input: { groupId, members } },
      },
      result: {
        data: {
          timeTrackingAssignGroupMembers: {
            message: errorMessage,
            errorCode: 'WORKER_VALIDATION_FAILED',
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useAssignGroupMembers({ onSuccess, onError }),
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
      TimeCustomerInteraction.GROUP_ASSIGN_MEMBERS,
      errorMessage,
    );
  });

  it('should handle INVALID_INPUT error', async () => {
    const groupId = 'group-123';
    const members: any[] = [];
    const errorMessage = 'Members list cannot be empty';
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const errorMock = {
      request: {
        query: ASSIGN_GROUP_MEMBERS_MUTATION,
        variables: {
          input: { groupId, members },
        },
      },
      result: {
        data: {
          timeTrackingAssignGroupMembers: {
            message: errorMessage,
            errorCode: 'INVALID_INPUT',
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useAssignGroupMembers({ onSuccess, onError }),
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
    expect(onError).toHaveBeenCalledWith(errorMessage, 'INVALID_INPUT');
  });

  it('should handle GENERAL_ERROR', async () => {
    const groupId = 'group-123';
    const members = [
      { id: 'worker-1', timeForType: TimeTracking_TimeForType.Employee },
    ];
    const errorMessage = 'An unexpected error occurred';
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const errorMock = {
      request: {
        query: ASSIGN_GROUP_MEMBERS_MUTATION,
        variables: {
          input: { groupId, members },
        },
      },
      result: {
        data: {
          timeTrackingAssignGroupMembers: {
            message: errorMessage,
            errorCode: 'GENERAL_ERROR',
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useAssignGroupMembers({ onSuccess, onError }),
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
    expect(onError).toHaveBeenCalledWith(errorMessage, 'GENERAL_ERROR');
  });

  it('should handle network/Apollo errors', async () => {
    const groupId = 'group-123';
    const members = [
      { id: 'worker-1', timeForType: TimeTracking_TimeForType.Employee },
    ];
    const networkError = new Error('Network request failed');
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const errorMock = {
      request: {
        query: ASSIGN_GROUP_MEMBERS_MUTATION,
        variables: {
          input: { groupId, members },
        },
      },
      error: networkError,
    };

    const { result } = renderHookWithApolloProvider(
      () => useAssignGroupMembers({ onSuccess, onError }),
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
    expect(onError).toHaveBeenCalledWith('Network request failed', '');

    // Verify error interaction tracking
    const {
      endInteractionWithFailure,
    } = require('src/js/common/CustomerInteraction');
    expect(endInteractionWithFailure).toHaveBeenCalled();
  });

  it('should handle null response from mutation', async () => {
    const groupId = 'group-123';
    const members = [
      { id: 'worker-1', timeForType: TimeTracking_TimeForType.Employee },
    ];
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const nullResponseMock = {
      request: {
        query: ASSIGN_GROUP_MEMBERS_MUTATION,
        variables: {
          input: { groupId, members },
        },
      },
      result: {
        data: {
          timeTrackingAssignGroupMembers: null,
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useAssignGroupMembers({ onSuccess, onError }),
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

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith('Null Response', '');
  });

  it('should handle error response with undefined message', async () => {
    const groupId = 'group-123';
    const members = [
      { id: 'worker-1', timeForType: TimeTracking_TimeForType.Employee },
    ];
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const errorMock = {
      request: {
        query: ASSIGN_GROUP_MEMBERS_MUTATION,
        variables: {
          input: { groupId, members },
        },
      },
      result: {
        data: {
          timeTrackingAssignGroupMembers: {
            message: undefined,
            errorCode: 'GENERAL_ERROR',
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useAssignGroupMembers({ onSuccess, onError }),
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
    expect(onError).toHaveBeenCalled();

    // Verify it uses fallback error message
    const {
      endInteractionWithFailure,
    } = require('src/js/common/CustomerInteraction');
    expect(endInteractionWithFailure).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.GROUP_ASSIGN_MEMBERS,
      'Assign members failed',
    );
  });

  it('should handle partial success with null error codes and messages', async () => {
    const groupId = 'group-123';
    const members = [
      { id: 'worker-1', timeForType: TimeTracking_TimeForType.Employee },
      { id: 'worker-2', timeForType: TimeTracking_TimeForType.Vendor },
    ];
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const partialSuccessMock = {
      request: {
        query: ASSIGN_GROUP_MEMBERS_MUTATION,
        variables: {
          input: { groupId, members },
        },
      },
      result: {
        data: {
          timeTrackingAssignGroupMembers: {
            successCode: 'PARTIAL_SUCCESS',
            group: {
              id: groupId,
              name: 'California Team',
              meta: {
                version: 1,
              },
              stats: {
                memberCount: 1,
              },
            },
            assignmentResults: [
              {
                worker: {
                  id: 'worker-1',
                  displayName: 'John Doe',
                  type: TimeTracking_TimeForType.Employee,
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
      () => useAssignGroupMembers({ onSuccess, onError }),
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

    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining<AssignGroupMembersResult>({
        success: true,
        partialSuccess: true,
        assignedCount: 1,
        failedCount: 1,
        failures: [
          {
            workerId: 'worker-2',
            errorCode: null,
            errorMessage: null,
          },
        ],
      }),
    );
    expect(onError).not.toHaveBeenCalled();
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
        query: ASSIGN_GROUP_MEMBERS_MUTATION,
        variables: {
          input: { groupId, members },
        },
      },
      result: {
        data: {
          timeTrackingAssignGroupMembers: {
            message: errorMessage,
            errorCode: 'OPTIMISTIC_LOCK_FAILURE',
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useAssignGroupMembers({ onSuccess, onError }),
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
      TimeCustomerInteraction.GROUP_ASSIGN_MEMBERS,
      errorMessage,
    );
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
        query: ASSIGN_GROUP_MEMBERS_MUTATION,
        variables: {
          input: { groupId, members },
        },
      },
      result: {
        data: {
          timeTrackingAssignGroupMembers: {
            unexpectedField: 'unexpected value',
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useAssignGroupMembers({ onSuccess, onError }),
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

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith('Unexpected response type', '');
  });
});
