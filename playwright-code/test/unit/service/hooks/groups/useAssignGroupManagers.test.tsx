/* eslint-disable camelcase */
import { act } from '@testing-library/react-hooks';
import { renderHookWithApolloProvider } from 'test/unit/testUtils';
import { ASSIGN_GROUP_MANAGERS_MUTATION } from 'src/js/service/queries/timeTrackingGroupMutations';
import {
  useAssignGroupManagers,
  AssignGroupManagersResult,
} from 'src/js/service/hooks/groups/useAssignGroupManagers';
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

describe('useAssignGroupManagers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the hook interface with mutation function, loading state, and error', () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const { result } = renderHookWithApolloProvider(
      () => useAssignGroupManagers({ onSuccess, onError }),
      [],
    );

    const [mutate, { loading, error }] = result.current;

    expect(mutate).toBeDefined();
    expect(typeof mutate).toBe('function');
    expect(loading).toBe(false);
    expect(error).toBeUndefined();
  });

  it('should handle successful assignment of all managers (SUCCESS)', async () => {
    const groupId = 'group-123';
    const managers = [
      { id: 'worker-1', type: TimeTracking_TimeForType.Employee },
      { id: 'worker-2', type: TimeTracking_TimeForType.Vendor },
    ];
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const successMock = {
      request: {
        query: ASSIGN_GROUP_MANAGERS_MUTATION,
        variables: {
          input: { groupId, managers },
        },
      },
      result: {
        data: {
          timeTrackingAssignGroupManagers: {
            __typename: 'TimeTracking_AssignGroupManagersPayload',
            successCode: 'SUCCESS',
            group: {
              id: groupId,
              name: 'California Team',
              isActive: true,
              stats: {
                memberCount: 5,
                managerCount: 2,
              },
            },
            assignmentResults: [
              {
                __typename: 'TimeTracking_GroupManagerAssignmentSuccess',
                worker: {
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
                __typename: 'TimeTracking_GroupManagerAssignmentSuccess',
                worker: {
                  id: 'worker-2',
                  type: TimeTracking_TimeForType.Vendor,
                  isActive: true,
                  firstName: 'Jane',
                  lastName: 'Smith',
                  displayName: 'Jane Smith',
                  identityAuthId: 'auth-2',
                  intuitProfileId: 'profile-2',
                },
              },
            ],
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useAssignGroupManagers({ onSuccess, onError }),
      [successMock],
    );

    const [mutate] = result.current;

    await act(async () => {
      await mutate({
        variables: {
          input: { groupId, managers },
        },
      });
    });

    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining<AssignGroupManagersResult>({
        success: true,
        partialSuccess: false,
        assignedCount: 2,
        failedCount: 0,
        failures: [],
      }),
    );
    expect(onError).not.toHaveBeenCalled();

    // Verify customer interaction tracking
    const {
      endInteractionWithSuccess,
    } = require('src/js/common/CustomerInteraction');
    expect(endInteractionWithSuccess).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.GROUP_ASSIGN_MANAGERS,
    );
  });

  it('should handle partial success (PARTIAL_SUCCESS) with some failures', async () => {
    const groupId = 'group-123';
    const managers = [
      { id: 'worker-1', type: TimeTracking_TimeForType.Employee },
      { id: 'worker-2', type: TimeTracking_TimeForType.Vendor },
      { id: 'worker-3', type: TimeTracking_TimeForType.Employee },
    ];
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const partialSuccessMock = {
      request: {
        query: ASSIGN_GROUP_MANAGERS_MUTATION,
        variables: {
          input: { groupId, managers },
        },
      },
      result: {
        data: {
          timeTrackingAssignGroupManagers: {
            __typename: 'TimeTracking_AssignGroupManagersPayload',
            successCode: 'PARTIAL_SUCCESS',
            group: {
              id: groupId,
              name: 'California Team',
              isActive: true,
              stats: {
                memberCount: 5,
                managerCount: 2,
              },
            },
            assignmentResults: [
              {
                __typename: 'TimeTracking_GroupManagerAssignmentSuccess',
                worker: {
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
                __typename: 'TimeTracking_GroupManagerAssignmentSuccess',
                worker: {
                  id: 'worker-2',
                  type: TimeTracking_TimeForType.Vendor,
                  isActive: true,
                  firstName: 'Jane',
                  lastName: 'Smith',
                  displayName: 'Jane Smith',
                  identityAuthId: 'auth-2',
                  intuitProfileId: 'profile-2',
                },
              },
              {
                __typename: 'TimeTracking_GroupManagerAssignmentError',
                workerId: 'worker-3',
                errorCode: 'WORKER_NOT_FOUND',
                errorMessage: 'Worker not found in the system',
              },
            ],
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useAssignGroupManagers({ onSuccess, onError }),
      [partialSuccessMock],
    );

    const [mutate] = result.current;

    await act(async () => {
      await mutate({
        variables: {
          input: { groupId, managers },
        },
      });
    });

    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining<AssignGroupManagersResult>({
        success: true,
        partialSuccess: true,
        assignedCount: 2,
        failedCount: 1,
        failures: [
          {
            workerId: 'worker-3',
            errorCode: 'WORKER_NOT_FOUND',
            errorMessage: 'Worker not found in the system',
          },
        ],
      }),
    );
    expect(onError).not.toHaveBeenCalled();
  });

  it('should call setInteractionDegraded when partial success has all WORKER_VALIDATION_FAILED failures', async () => {
    const groupId = 'group-123';
    const managers = [
      { id: 'worker-1', type: TimeTracking_TimeForType.Employee },
      { id: 'worker-2', type: TimeTracking_TimeForType.Employee },
    ];
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const partialSuccessAllValidationMock = {
      request: {
        query: ASSIGN_GROUP_MANAGERS_MUTATION,
        variables: { input: { groupId, managers } },
      },
      result: {
        data: {
          timeTrackingAssignGroupManagers: {
            __typename: 'TimeTracking_AssignGroupManagersPayload',
            successCode: 'PARTIAL_SUCCESS',
            group: {
              id: groupId,
              name: 'Team',
              isActive: true,
              stats: { memberCount: 0, managerCount: 1 },
            },
            assignmentResults: [
              {
                __typename: 'TimeTracking_GroupManagerAssignmentSuccess',
                worker: {
                  id: 'worker-1',
                  type: TimeTracking_TimeForType.Employee,
                  isActive: true,
                  firstName: 'A',
                  lastName: 'A',
                  displayName: 'A A',
                  identityAuthId: 'a',
                  intuitProfileId: 'p1',
                },
              },
              {
                __typename: 'TimeTracking_GroupManagerAssignmentError',
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
      () => useAssignGroupManagers({ onSuccess, onError }),
      [partialSuccessAllValidationMock],
    );

    await act(async () => {
      await result.current[0]({ variables: { input: { groupId, managers } } });
    });

    expect(onSuccess).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        partialSuccess: true,
        assignedCount: 1,
        failedCount: 1,
        failures: expect.arrayContaining([
          expect.objectContaining({
            workerId: 'worker-2',
            errorCode: 'WORKER_VALIDATION_FAILED',
            errorMessage: "Worker 'B' is inactive",
          }),
        ]),
      }),
    );
  });

  it('should call setInteractionDegraded when successCode is FAILURE and all failures are WORKER_VALIDATION_FAILED', async () => {
    const groupId = 'group-123';
    const managers = [
      { id: 'worker-1', type: TimeTracking_TimeForType.Employee },
      { id: 'worker-2', type: TimeTracking_TimeForType.Employee },
    ];
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const totalFailureValidationMock = {
      request: {
        query: ASSIGN_GROUP_MANAGERS_MUTATION,
        variables: { input: { groupId, managers } },
      },
      result: {
        data: {
          timeTrackingAssignGroupManagers: {
            __typename: 'TimeTracking_AssignGroupManagersPayload',
            successCode: 'FAILURE',
            group: {
              id: groupId,
              name: 'Team',
              isActive: true,
              stats: { memberCount: 0, managerCount: 0 },
            },
            assignmentResults: [
              {
                __typename: 'TimeTracking_GroupManagerAssignmentError',
                workerId: 'worker-1',
                errorCode: 'WORKER_VALIDATION_FAILED',
                errorMessage: 'Worker is inactive',
              },
              {
                __typename: 'TimeTracking_GroupManagerAssignmentError',
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
      () => useAssignGroupManagers({ onSuccess, onError }),
      [totalFailureValidationMock],
    );

    await act(async () => {
      await result.current[0]({ variables: { input: { groupId, managers } } });
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      'Failed to assign leads',
      'WORKER_VALIDATION_FAILED',
    );
    const {
      setInteractionDegraded,
    } = require('src/js/common/CustomerInteraction');
    expect(setInteractionDegraded).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.GROUP_ASSIGN_MANAGERS,
      'Failed to assign leads',
    );
  });

  it('should call endInteractionWithFailure when successCode is FAILURE and failures are mixed (not all WORKER_VALIDATION_FAILED)', async () => {
    const groupId = 'group-123';
    const managers = [
      { id: 'worker-1', type: TimeTracking_TimeForType.Employee },
      { id: 'worker-2', type: TimeTracking_TimeForType.Employee },
    ];
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const totalFailureMixedMock = {
      request: {
        query: ASSIGN_GROUP_MANAGERS_MUTATION,
        variables: { input: { groupId, managers } },
      },
      result: {
        data: {
          timeTrackingAssignGroupManagers: {
            __typename: 'TimeTracking_AssignGroupManagersPayload',
            successCode: 'FAILURE',
            group: {
              id: groupId,
              name: 'Team',
              isActive: true,
              stats: { memberCount: 0, managerCount: 0 },
            },
            assignmentResults: [
              {
                __typename: 'TimeTracking_GroupManagerAssignmentError',
                workerId: 'worker-1',
                errorCode: 'WORKER_VALIDATION_FAILED',
                errorMessage: 'Worker is inactive',
              },
              {
                __typename: 'TimeTracking_GroupManagerAssignmentError',
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
      () => useAssignGroupManagers({ onSuccess, onError }),
      [totalFailureMixedMock],
    );

    await act(async () => {
      await result.current[0]({ variables: { input: { groupId, managers } } });
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      'Failed to assign leads',
      expect.anything(),
    );
    const {
      endInteractionWithFailure,
    } = require('src/js/common/CustomerInteraction');
    expect(endInteractionWithFailure).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.GROUP_ASSIGN_MANAGERS,
      'Failed to assign leads',
    );
  });

  it('should call setInteractionDegraded when error has WORKER_VALIDATION_FAILED code', async () => {
    const groupId = 'group-123';
    const managers = [
      { id: 'worker-1', type: TimeTracking_TimeForType.Employee },
    ];
    const errorMessage = 'Some workers are inactive';
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const validationErrorMock = {
      request: {
        query: ASSIGN_GROUP_MANAGERS_MUTATION,
        variables: { input: { groupId, managers } },
      },
      result: {
        data: {
          timeTrackingAssignGroupManagers: {
            __typename: 'TimeTracking_AssignGroupManagersError',
            errorCode: 'WORKER_VALIDATION_FAILED',
            message: errorMessage,
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useAssignGroupManagers({ onSuccess, onError }),
      [validationErrorMock],
    );

    await act(async () => {
      await result.current[0]({ variables: { input: { groupId, managers } } });
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
      TimeCustomerInteraction.GROUP_ASSIGN_MANAGERS,
      errorMessage,
    );
  });

  it('should handle complete failure error (GROUP_NOT_FOUND)', async () => {
    const groupId = 'non-existent-group';
    const managers = [
      { id: 'worker-1', type: TimeTracking_TimeForType.Employee },
    ];
    const errorMessage = 'Group not found';
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const errorMock = {
      request: {
        query: ASSIGN_GROUP_MANAGERS_MUTATION,
        variables: {
          input: { groupId, managers },
        },
      },
      result: {
        data: {
          timeTrackingAssignGroupManagers: {
            __typename: 'TimeTracking_AssignGroupManagersError',
            errorCode: 'GROUP_NOT_FOUND',
            message: errorMessage,
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useAssignGroupManagers({ onSuccess, onError }),
      [errorMock],
    );

    const [mutate] = result.current;

    await act(async () => {
      await mutate({
        variables: {
          input: { groupId, managers },
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
      TimeCustomerInteraction.GROUP_ASSIGN_MANAGERS,
      errorMessage,
    );
  });

  it('should handle INVALID_INPUT error', async () => {
    const groupId = 'group-123';
    const managers: any[] = [];
    const errorMessage = 'Managers list cannot be empty';
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const errorMock = {
      request: {
        query: ASSIGN_GROUP_MANAGERS_MUTATION,
        variables: {
          input: { groupId, managers },
        },
      },
      result: {
        data: {
          timeTrackingAssignGroupManagers: {
            __typename: 'TimeTracking_AssignGroupManagersError',
            errorCode: 'INVALID_INPUT',
            message: errorMessage,
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useAssignGroupManagers({ onSuccess, onError }),
      [errorMock],
    );

    const [mutate] = result.current;

    await act(async () => {
      await mutate({
        variables: {
          input: { groupId, managers },
        },
      });
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(errorMessage, 'INVALID_INPUT');
  });

  it('should handle network/Apollo errors', async () => {
    const groupId = 'group-123';
    const managers = [
      { id: 'worker-1', type: TimeTracking_TimeForType.Employee },
    ];
    const networkError = new Error('Network request failed');
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const errorMock = {
      request: {
        query: ASSIGN_GROUP_MANAGERS_MUTATION,
        variables: {
          input: { groupId, managers },
        },
      },
      error: networkError,
    };

    const { result } = renderHookWithApolloProvider(
      () => useAssignGroupManagers({ onSuccess, onError }),
      [errorMock],
    );

    const [mutate] = result.current;

    await act(async () => {
      await mutate({
        variables: {
          input: { groupId, managers },
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
    const managers = [
      { id: 'worker-1', type: TimeTracking_TimeForType.Employee },
    ];
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const nullResponseMock = {
      request: {
        query: ASSIGN_GROUP_MANAGERS_MUTATION,
        variables: {
          input: { groupId, managers },
        },
      },
      result: {
        data: {
          timeTrackingAssignGroupManagers: null,
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useAssignGroupManagers({ onSuccess, onError }),
      [nullResponseMock],
    );

    const [mutate] = result.current;

    await act(async () => {
      await mutate({
        variables: {
          input: { groupId, managers },
        },
      });
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith('Null Response', '');
  });

  it('should handle partial success with null error codes and messages', async () => {
    const groupId = 'group-123';
    const managers = [
      { id: 'worker-1', type: TimeTracking_TimeForType.Employee },
      { id: 'worker-2', type: TimeTracking_TimeForType.Vendor },
    ];
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const partialSuccessMock = {
      request: {
        query: ASSIGN_GROUP_MANAGERS_MUTATION,
        variables: {
          input: { groupId, managers },
        },
      },
      result: {
        data: {
          timeTrackingAssignGroupManagers: {
            __typename: 'TimeTracking_AssignGroupManagersPayload',
            successCode: 'PARTIAL_SUCCESS',
            group: {
              id: groupId,
              name: 'California Team',
              isActive: true,
              stats: {
                memberCount: 5,
                managerCount: 1,
              },
            },
            assignmentResults: [
              {
                __typename: 'TimeTracking_GroupManagerAssignmentSuccess',
                worker: {
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
                __typename: 'TimeTracking_GroupManagerAssignmentError',
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
      () => useAssignGroupManagers({ onSuccess, onError }),
      [partialSuccessMock],
    );

    const [mutate] = result.current;

    await act(async () => {
      await mutate({
        variables: {
          input: { groupId, managers },
        },
      });
    });

    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining<AssignGroupManagersResult>({
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
    const managers = [
      { id: 'worker-1', type: TimeTracking_TimeForType.Employee },
    ];
    const errorMessage = 'Group was modified by another user';
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const errorMock = {
      request: {
        query: ASSIGN_GROUP_MANAGERS_MUTATION,
        variables: {
          input: { groupId, managers },
        },
      },
      result: {
        data: {
          timeTrackingAssignGroupManagers: {
            __typename: 'TimeTracking_AssignGroupManagersError',
            errorCode: 'OPTIMISTIC_LOCK_FAILURE',
            message: errorMessage,
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useAssignGroupManagers({ onSuccess, onError }),
      [errorMock],
    );

    const [mutate] = result.current;

    await act(async () => {
      await mutate({
        variables: {
          input: { groupId, managers },
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
      TimeCustomerInteraction.GROUP_ASSIGN_MANAGERS,
      errorMessage,
    );
  });

  it('should handle unexpected response type', async () => {
    const groupId = 'group-123';
    const managers = [
      { id: 'worker-1', type: TimeTracking_TimeForType.Employee },
    ];
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const unexpectedResponseMock = {
      request: {
        query: ASSIGN_GROUP_MANAGERS_MUTATION,
        variables: {
          input: { groupId, managers },
        },
      },
      result: {
        data: {
          timeTrackingAssignGroupManagers: {
            __typename: 'UnexpectedType',
            unexpectedField: 'unexpected value',
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useAssignGroupManagers({ onSuccess, onError }),
      [unexpectedResponseMock],
    );

    const [mutate] = result.current;

    await act(async () => {
      await mutate({
        variables: {
          input: { groupId, managers },
        },
      });
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith('Unexpected response type', '');
  });

  it('should handle error response without message (fallback to "Assignment failed")', async () => {
    const groupId = 'group-123';
    const managers = [
      { id: 'worker-1', type: TimeTracking_TimeForType.Employee },
    ];
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const errorMock = {
      request: {
        query: ASSIGN_GROUP_MANAGERS_MUTATION,
        variables: {
          input: { groupId, managers },
        },
      },
      result: {
        data: {
          timeTrackingAssignGroupManagers: {
            __typename: 'TimeTracking_AssignGroupManagersError',
            errorCode: 'SOME_ERROR',
            message: undefined,
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useAssignGroupManagers({ onSuccess, onError }),
      [errorMock],
    );

    const [mutate] = result.current;

    await act(async () => {
      await mutate({
        variables: {
          input: { groupId, managers },
        },
      });
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith('Assignment failed', 'SOME_ERROR');
  });

  it('should handle success response with null assignmentResults (fallback to [])', async () => {
    const groupId = 'group-123';
    const managers = [
      { id: 'worker-1', type: TimeTracking_TimeForType.Employee },
    ];
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const successMock = {
      request: {
        query: ASSIGN_GROUP_MANAGERS_MUTATION,
        variables: {
          input: { groupId, managers },
        },
      },
      result: {
        data: {
          timeTrackingAssignGroupManagers: {
            __typename: 'TimeTracking_AssignGroupManagersPayload',
            successCode: 'SUCCESS',
            group: {
              id: groupId,
              name: 'California Team',
              isActive: true,
              stats: {
                memberCount: 5,
                managerCount: 0,
              },
            },
            assignmentResults: null,
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useAssignGroupManagers({ onSuccess, onError }),
      [successMock],
    );

    const [mutate] = result.current;

    await act(async () => {
      await mutate({
        variables: {
          input: { groupId, managers },
        },
      });
    });

    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining<AssignGroupManagersResult>({
        success: true,
        partialSuccess: false,
        assignedCount: 0,
        failedCount: 0,
        failures: [],
      }),
    );
    expect(onError).not.toHaveBeenCalled();
  });
});
