import { renderHook, act } from '@testing-library/react-hooks';
import { MockedProvider } from '@apollo/client/testing';
import React from 'react';
import { MockQuicksandProvider } from '@payroll/quicksand';
import { useManageCustomFieldOptionAssignment } from 'src/js/service/hooks/assignments/useManageCustomFieldOptionAssignment';
import { MANAGE_CUSTOM_FIELD_OPTION_ASSIGNMENT_MUTATION } from 'src/js/service/queries/timeTrackingAssignmentQueries';
import { getDefaultSandbox } from 'test/unit/testUtils';
import {
  createCustomerInteraction,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';

// Mock getApolloClientInstance to return undefined so tests use MockedProvider's client
jest.mock('src/js/service/ApolloClientBuilder', () => ({
  getApolloClientInstance: jest.fn(() => undefined),
}));

// Mock CustomerInteraction module
jest.mock('src/js/common/CustomerInteraction', () => ({
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn(() => ({
    'x-customer-interaction-id': 'test-interaction-id',
  })),
  TimeCustomerInteraction: {
    CUSTOM_FIELD_OPTION_ASSIGNMENT_MANAGE:
      'custom-field-option-assignment-manage',
  },
}));

const mockSuccessResponse = {
  timeTrackingManageCustomFieldOptionAssignment: {
    __typename: 'TimeTracking_ManageCustomFieldOptionAssignmentPayload',
    successCode: 'SUCCESS',
    customField: {
      id: 'field-123',
    },
    customFieldOption: {
      id: 'option-456',
    },
    assignedTimeFor: [{ id: 'worker-1' }, { id: 'worker-2' }],
    unassignedTimeFor: [],
    assignedGroups: [],
    unassignedGroups: [],
  },
};

const mockPartialSuccessResponse = {
  timeTrackingManageCustomFieldOptionAssignment: {
    __typename: 'TimeTracking_PartialCustomFieldOptionAssignmentPayload',
    successCode: 'PARTIAL_SUCCESS',
    customFieldOption: {
      id: 'option-456',
    },
    timeForAssignResults: [
      {
        __typename: 'TimeTracking_AssignedWorker',
        id: 'worker-1',
      },
      {
        __typename: 'TimeTracking_AssignmentItemError',
        errorCode: 'VALIDATION_ERROR',
        message: 'Worker assignment failed',
        details: null,
        subCode: null,
        element: 'worker-2',
      },
    ],
    timeForUnassignResults: [],
    groupAssignResults: [],
    groupUnassignResults: [],
  },
};

const mockErrorResponse = {
  timeTrackingManageCustomFieldOptionAssignment: {
    __typename: 'TimeTracking_ManageCustomFieldOptionAssignmentError',
    errorCode: 'VALIDATION_ERROR',
    message: 'Failed to manage custom field option assignments',
    details: 'Invalid input provided',
    subCode: 'INVALID_INPUT',
  },
};

describe('useManageCustomFieldOptionAssignment', () => {
  const sandbox = getDefaultSandbox();

  const createWrapper =
    (mocks: any[]) =>
    ({ children }: any) =>
      (
        <MockQuicksandProvider sandbox={sandbox}>
          <MockedProvider mocks={mocks} addTypename>
            {children}
          </MockedProvider>
        </MockQuicksandProvider>
      );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Initial State', () => {
    it('returns mutation tuple with function and state', () => {
      const { result } = renderHook(
        () => useManageCustomFieldOptionAssignment(),
        {
          wrapper: createWrapper([]),
        },
      );

      const [mutationFn, mutationState] = result.current;
      expect(mutationState.loading).toBe(false);
      expect(mutationState.error).toBeUndefined();
      expect(typeof mutationFn).toBe('function');
    });
  });

  describe('Success Cases', () => {
    it('manages worker assignments for a custom field option successfully', async () => {
      const onSuccess = jest.fn();
      const mocks = [
        {
          request: {
            query: MANAGE_CUSTOM_FIELD_OPTION_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                customFieldId: 'field-123',
                customFieldOptionId: 'option-456',
                timeForAssignments: {
                  timeForToAssign: [{ id: 'worker-1' }, { id: 'worker-2' }],
                },
              },
            },
          },
          result: { data: mockSuccessResponse },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageCustomFieldOptionAssignment({ onSuccess }),
        {
          wrapper: createWrapper(mocks),
        },
      );

      act(() => {
        result.current[0]({
          variables: {
            input: {
              customFieldId: 'field-123',
              customFieldOptionId: 'option-456',
              timeForAssignments: {
                timeForToAssign: [{ id: 'worker-1' }, { id: 'worker-2' }],
              },
            },
          },
        });
      });

      await waitForNextUpdate();

      expect(onSuccess).toHaveBeenCalled();
    });

    it('manages worker and group assignments together', async () => {
      const onSuccess = jest.fn();
      const mocks = [
        {
          request: {
            query: MANAGE_CUSTOM_FIELD_OPTION_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                customFieldId: 'field-123',
                customFieldOptionId: 'option-456',
                timeForAssignments: {
                  timeForToAssign: [{ id: 'worker-1' }],
                  timeForToUnassign: [{ id: 'worker-2' }],
                  groupIdsToAssign: ['group-1'],
                  groupIdsToUnassign: ['group-2'],
                },
              },
            },
          },
          result: { data: mockSuccessResponse },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageCustomFieldOptionAssignment({ onSuccess }),
        {
          wrapper: createWrapper(mocks),
        },
      );

      act(() => {
        result.current[0]({
          variables: {
            input: {
              customFieldId: 'field-123',
              customFieldOptionId: 'option-456',
              timeForAssignments: {
                timeForToAssign: [{ id: 'worker-1' }],
                timeForToUnassign: [{ id: 'worker-2' }],
                groupIdsToAssign: ['group-1'],
                groupIdsToUnassign: ['group-2'],
              },
            },
          },
        });
      });

      await waitForNextUpdate();

      expect(onSuccess).toHaveBeenCalled();
    });

    it('handles assignToAll flag successfully', async () => {
      const onSuccess = jest.fn();
      const mocks = [
        {
          request: {
            query: MANAGE_CUSTOM_FIELD_OPTION_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                customFieldId: 'field-123',
                customFieldOptionId: 'option-456',
                assignToAll: true,
              },
            },
          },
          result: { data: mockSuccessResponse },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageCustomFieldOptionAssignment({ onSuccess }),
        {
          wrapper: createWrapper(mocks),
        },
      );

      act(() => {
        result.current[0]({
          variables: {
            input: {
              customFieldId: 'field-123',
              customFieldOptionId: 'option-456',
              assignToAll: true,
            },
          },
        });
      });

      await waitForNextUpdate();

      expect(onSuccess).toHaveBeenCalled();
    });

    it('handles partial success response', async () => {
      const onPartialSuccess = jest.fn();
      const mocks = [
        {
          request: {
            query: MANAGE_CUSTOM_FIELD_OPTION_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                customFieldId: 'field-123',
                customFieldOptionId: 'option-456',
                timeForAssignments: {
                  timeForToAssign: [{ id: 'worker-1' }, { id: 'worker-2' }],
                },
              },
            },
          },
          result: { data: mockPartialSuccessResponse },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageCustomFieldOptionAssignment({ onPartialSuccess }),
        {
          wrapper: createWrapper(mocks),
        },
      );

      act(() => {
        result.current[0]({
          variables: {
            input: {
              customFieldId: 'field-123',
              customFieldOptionId: 'option-456',
              timeForAssignments: {
                timeForToAssign: [{ id: 'worker-1' }, { id: 'worker-2' }],
              },
            },
          },
        });
      });

      await waitForNextUpdate();

      expect(onPartialSuccess).toHaveBeenCalledWith({
        workers: {
          successCount: 1,
          failed: ['worker-2'],
          errorMessages: ['Worker assignment failed'],
        },
        groups: {
          successCount: 0,
          failed: [],
          errorMessages: [],
        },
      });
    });

    it('unassigns workers successfully', async () => {
      const onSuccess = jest.fn();
      const mocks = [
        {
          request: {
            query: MANAGE_CUSTOM_FIELD_OPTION_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                customFieldId: 'field-123',
                customFieldOptionId: 'option-456',
                timeForAssignments: {
                  timeForToUnassign: [{ id: 'worker-1' }, { id: 'worker-2' }],
                },
              },
            },
          },
          result: { data: mockSuccessResponse },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageCustomFieldOptionAssignment({ onSuccess }),
        {
          wrapper: createWrapper(mocks),
        },
      );

      act(() => {
        result.current[0]({
          variables: {
            input: {
              customFieldId: 'field-123',
              customFieldOptionId: 'option-456',
              timeForAssignments: {
                timeForToUnassign: [{ id: 'worker-1' }, { id: 'worker-2' }],
              },
            },
          },
        });
      });

      await waitForNextUpdate();

      expect(onSuccess).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('handles GraphQL error response', async () => {
      const onError = jest.fn();
      const mocks = [
        {
          request: {
            query: MANAGE_CUSTOM_FIELD_OPTION_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                customFieldId: 'field-123',
                customFieldOptionId: 'option-456',
                timeForAssignments: {
                  timeForToAssign: [{ id: 'invalid-worker' }],
                },
              },
            },
          },
          result: { data: mockErrorResponse },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageCustomFieldOptionAssignment({ onError }),
        {
          wrapper: createWrapper(mocks),
        },
      );

      act(() => {
        result.current[0]({
          variables: {
            input: {
              customFieldId: 'field-123',
              customFieldOptionId: 'option-456',
              timeForAssignments: {
                timeForToAssign: [{ id: 'invalid-worker' }],
              },
            },
          },
        });
      });

      await waitForNextUpdate();

      expect(onError).toHaveBeenCalledWith(
        'Failed to manage custom field option assignments',
      );
    });

    it('handles network error', async () => {
      const onError = jest.fn();
      const mocks = [
        {
          request: {
            query: MANAGE_CUSTOM_FIELD_OPTION_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                customFieldId: 'field-123',
                customFieldOptionId: 'option-456',
                timeForAssignments: {
                  timeForToAssign: [{ id: 'worker-1' }],
                },
              },
            },
          },
          error: new Error('Network error'),
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageCustomFieldOptionAssignment({ onError }),
        {
          wrapper: createWrapper(mocks),
        },
      );

      act(() => {
        result.current[0]({
          variables: {
            input: {
              customFieldId: 'field-123',
              customFieldOptionId: 'option-456',
              timeForAssignments: {
                timeForToAssign: [{ id: 'worker-1' }],
              },
            },
          },
        });
      });

      await waitForNextUpdate();

      expect(onError).toHaveBeenCalled();
    });

    it('handles error without message', async () => {
      const onError = jest.fn();
      const mocks = [
        {
          request: {
            query: MANAGE_CUSTOM_FIELD_OPTION_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                customFieldId: 'field-123',
                customFieldOptionId: 'option-456',
                timeForAssignments: {
                  timeForToAssign: [{ id: 'worker-1' }],
                },
              },
            },
          },
          result: {
            data: {
              timeTrackingManageCustomFieldOptionAssignment: {
                __typename:
                  'TimeTracking_ManageCustomFieldOptionAssignmentError',
                errorCode: 'UNKNOWN_ERROR',
                message: null,
                details: null,
                subCode: null,
              },
            },
          },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageCustomFieldOptionAssignment({ onError }),
        {
          wrapper: createWrapper(mocks),
        },
      );

      act(() => {
        result.current[0]({
          variables: {
            input: {
              customFieldId: 'field-123',
              customFieldOptionId: 'option-456',
              timeForAssignments: {
                timeForToAssign: [{ id: 'worker-1' }],
              },
            },
          },
        });
      });

      await waitForNextUpdate();

      expect(onError).toHaveBeenCalled();
      expect(onError.mock.calls[0][0]).toContain('assignments.genericError');
    });
  });

  describe('Without Callbacks', () => {
    it('works without onSuccess callback', async () => {
      const mocks = [
        {
          request: {
            query: MANAGE_CUSTOM_FIELD_OPTION_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                customFieldId: 'field-123',
                customFieldOptionId: 'option-456',
                timeForAssignments: {
                  timeForToAssign: [{ id: 'worker-1' }],
                },
              },
            },
          },
          result: { data: mockSuccessResponse },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageCustomFieldOptionAssignment(),
        {
          wrapper: createWrapper(mocks),
        },
      );

      act(() => {
        result.current[0]({
          variables: {
            input: {
              customFieldId: 'field-123',
              customFieldOptionId: 'option-456',
              timeForAssignments: {
                timeForToAssign: [{ id: 'worker-1' }],
              },
            },
          },
        });
      });

      await waitForNextUpdate();

      expect(result.current[1].loading).toBe(false);
    });

    it('works without onError callback', async () => {
      const mocks = [
        {
          request: {
            query: MANAGE_CUSTOM_FIELD_OPTION_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                customFieldId: 'field-123',
                customFieldOptionId: 'option-456',
                timeForAssignments: {
                  timeForToAssign: [{ id: 'worker-1' }],
                },
              },
            },
          },
          result: { data: mockErrorResponse },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageCustomFieldOptionAssignment(),
        {
          wrapper: createWrapper(mocks),
        },
      );

      act(() => {
        result.current[0]({
          variables: {
            input: {
              customFieldId: 'field-123',
              customFieldOptionId: 'option-456',
              timeForAssignments: {
                timeForToAssign: [{ id: 'worker-1' }],
              },
            },
          },
        });
      });

      await waitForNextUpdate();

      expect(result.current[1].loading).toBe(false);
    });

    it('works without onPartialSuccess callback', async () => {
      const mocks = [
        {
          request: {
            query: MANAGE_CUSTOM_FIELD_OPTION_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                customFieldId: 'field-123',
                customFieldOptionId: 'option-456',
                timeForAssignments: {
                  timeForToAssign: [{ id: 'worker-1' }],
                },
              },
            },
          },
          result: { data: mockPartialSuccessResponse },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageCustomFieldOptionAssignment(),
        {
          wrapper: createWrapper(mocks),
        },
      );

      act(() => {
        result.current[0]({
          variables: {
            input: {
              customFieldId: 'field-123',
              customFieldOptionId: 'option-456',
              timeForAssignments: {
                timeForToAssign: [{ id: 'worker-1' }],
              },
            },
          },
        });
      });

      await waitForNextUpdate();

      expect(result.current[1].loading).toBe(false);
    });
  });

  describe('Additional Edge Cases', () => {
    it('handles null response from server', async () => {
      const onError = jest.fn();
      const mocks = [
        {
          request: {
            query: MANAGE_CUSTOM_FIELD_OPTION_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                customFieldId: 'field-123',
                customFieldOptionId: 'option-456',
                timeForAssignments: {
                  timeForToAssign: [{ id: 'worker-1' }],
                },
              },
            },
          },
          result: {
            data: {
              timeTrackingManageCustomFieldOptionAssignment: null,
            },
          },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageCustomFieldOptionAssignment({ onError }),
        {
          wrapper: createWrapper(mocks),
        },
      );

      act(() => {
        result.current[0]({
          variables: {
            input: {
              customFieldId: 'field-123',
              customFieldOptionId: 'option-456',
              timeForAssignments: {
                timeForToAssign: [{ id: 'worker-1' }],
              },
            },
          },
        });
      });

      await waitForNextUpdate();

      expect(onError).toHaveBeenCalled();
      expect(onError.mock.calls[0][0]).toContain('assignments.genericError');
    });

    it('handles unexpected response typename', async () => {
      const onError = jest.fn();
      const mocks = [
        {
          request: {
            query: MANAGE_CUSTOM_FIELD_OPTION_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                customFieldId: 'field-123',
                customFieldOptionId: 'option-456',
                timeForAssignments: {
                  timeForToAssign: [{ id: 'worker-1' }],
                },
              },
            },
          },
          result: {
            data: {
              timeTrackingManageCustomFieldOptionAssignment: {
                __typename: 'UnexpectedType',
              },
            },
          },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageCustomFieldOptionAssignment({ onError }),
        {
          wrapper: createWrapper(mocks),
        },
      );

      act(() => {
        result.current[0]({
          variables: {
            input: {
              customFieldId: 'field-123',
              customFieldOptionId: 'option-456',
              timeForAssignments: {
                timeForToAssign: [{ id: 'worker-1' }],
              },
            },
          },
        });
      });

      await waitForNextUpdate();

      expect(onError).toHaveBeenCalled();
      expect(onError.mock.calls[0][0]).toContain('assignments.genericError');
    });

    it('handles partial success with group errors', async () => {
      const onPartialSuccess = jest.fn();
      const partialSuccessWithGroupError = {
        timeTrackingManageCustomFieldOptionAssignment: {
          __typename: 'TimeTracking_PartialCustomFieldOptionAssignmentPayload',
          successCode: 'PARTIAL_SUCCESS',
          customFieldOption: {
            id: 'option-456',
          },
          timeForAssignResults: [],
          timeForUnassignResults: [],
          groupAssignResults: [
            {
              __typename: 'TimeTracking_AssignedGroup',
              id: 'group-1',
            },
            {
              __typename: 'TimeTracking_AssignmentItemError',
              errorCode: 'VALIDATION_ERROR',
              message: 'Group assignment failed',
              details: null,
              subCode: null,
              element: 'group-2',
            },
          ],
          groupUnassignResults: [],
        },
      };

      const mocks = [
        {
          request: {
            query: MANAGE_CUSTOM_FIELD_OPTION_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                customFieldId: 'field-123',
                customFieldOptionId: 'option-456',
                timeForAssignments: {
                  groupIdsToAssign: ['group-1', 'group-2'],
                },
              },
            },
          },
          result: { data: partialSuccessWithGroupError },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageCustomFieldOptionAssignment({ onPartialSuccess }),
        {
          wrapper: createWrapper(mocks),
        },
      );

      act(() => {
        result.current[0]({
          variables: {
            input: {
              customFieldId: 'field-123',
              customFieldOptionId: 'option-456',
              timeForAssignments: {
                groupIdsToAssign: ['group-1', 'group-2'],
              },
            },
          },
        });
      });

      await waitForNextUpdate();

      expect(onPartialSuccess).toHaveBeenCalledWith({
        workers: {
          successCount: 0,
          failed: [],
          errorMessages: [],
        },
        groups: {
          successCount: 1,
          failed: ['group-2'],
          errorMessages: ['Group assignment failed'],
        },
      });
    });

    it('calculates success and failure counts correctly for partial success', async () => {
      const onPartialSuccess = jest.fn();
      const complexPartialSuccess = {
        timeTrackingManageCustomFieldOptionAssignment: {
          __typename: 'TimeTracking_PartialCustomFieldOptionAssignmentPayload',
          successCode: 'PARTIAL_SUCCESS',
          customFieldOption: {
            id: 'option-456',
          },
          timeForAssignResults: [
            {
              __typename: 'TimeTracking_AssignedWorker',
              id: 'worker-1',
            },
            {
              __typename: 'TimeTracking_AssignedWorker',
              id: 'worker-2',
            },
          ],
          timeForUnassignResults: [
            {
              __typename: 'TimeTracking_AssignmentItemError',
              errorCode: 'VALIDATION_ERROR',
              message: 'Failed to unassign worker',
              details: null,
              subCode: null,
              element: 'worker-3',
            },
          ],
          groupAssignResults: [],
          groupUnassignResults: [],
        },
      };

      const mocks = [
        {
          request: {
            query: MANAGE_CUSTOM_FIELD_OPTION_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                customFieldId: 'field-123',
                customFieldOptionId: 'option-456',
                timeForAssignments: {
                  timeForToAssign: [{ id: 'worker-1' }, { id: 'worker-2' }],
                  timeForToUnassign: [{ id: 'worker-3' }],
                },
              },
            },
          },
          result: { data: complexPartialSuccess },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageCustomFieldOptionAssignment({ onPartialSuccess }),
        {
          wrapper: createWrapper(mocks),
        },
      );

      act(() => {
        result.current[0]({
          variables: {
            input: {
              customFieldId: 'field-123',
              customFieldOptionId: 'option-456',
              timeForAssignments: {
                timeForToAssign: [{ id: 'worker-1' }, { id: 'worker-2' }],
                timeForToUnassign: [{ id: 'worker-3' }],
              },
            },
          },
        });
      });

      await waitForNextUpdate();

      expect(onPartialSuccess).toHaveBeenCalledWith({
        workers: {
          successCount: 2,
          failed: ['worker-3'],
          errorMessages: ['Failed to unassign worker'],
        },
        groups: {
          successCount: 0,
          failed: [],
          errorMessages: [],
        },
      });
    });
  });

  describe('CustomerInteraction Integration', () => {
    it('calls createCustomerInteraction before executing mutation', async () => {
      const mocks = [
        {
          request: {
            query: MANAGE_CUSTOM_FIELD_OPTION_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                customFieldId: 'cf-123',
                customFieldOptionId: 'option-456',
                timeForAssignments: {
                  timeForToAssign: [{ id: 'worker-1' }],
                },
              },
            },
          },
          result: { data: mockSuccessResponse },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageCustomFieldOptionAssignment(),
        {
          wrapper: createWrapper(mocks),
        },
      );

      act(() => {
        result.current[0]({
          variables: {
            input: {
              customFieldId: 'cf-123',
              customFieldOptionId: 'option-456',
              timeForAssignments: {
                timeForToAssign: [{ id: 'worker-1' }],
              },
            },
          },
        });
      });

      expect(createCustomerInteraction).toHaveBeenCalledWith(
        sandbox,
        TimeCustomerInteraction.CUSTOM_FIELD_OPTION_ASSIGNMENT_MANAGE,
      );

      await waitForNextUpdate();
    });

    it('calls getCustomerInteractionPropagationHeaders and adds headers to context', async () => {
      const mockHeaders = {
        'x-customer-interaction-id': 'test-interaction-id',
      };

      (getCustomerInteractionPropagationHeaders as jest.Mock).mockReturnValue(
        mockHeaders,
      );

      const mocks = [
        {
          request: {
            query: MANAGE_CUSTOM_FIELD_OPTION_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                customFieldId: 'cf-123',
                customFieldOptionId: 'option-456',
                timeForAssignments: {
                  timeForToAssign: [{ id: 'worker-1' }],
                },
              },
            },
            context: {
              headers: mockHeaders,
            },
          },
          result: { data: mockSuccessResponse },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageCustomFieldOptionAssignment(),
        {
          wrapper: createWrapper(mocks),
        },
      );

      act(() => {
        result.current[0]({
          variables: {
            input: {
              customFieldId: 'cf-123',
              customFieldOptionId: 'option-456',
              timeForAssignments: {
                timeForToAssign: [{ id: 'worker-1' }],
              },
            },
          },
        });
      });

      expect(getCustomerInteractionPropagationHeaders).toHaveBeenCalledWith(
        sandbox,
        TimeCustomerInteraction.CUSTOM_FIELD_OPTION_ASSIGNMENT_MANAGE,
      );

      await waitForNextUpdate();
    });
  });
});
