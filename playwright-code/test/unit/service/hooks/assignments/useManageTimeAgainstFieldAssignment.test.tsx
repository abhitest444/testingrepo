import { renderHook, act } from '@testing-library/react-hooks';
import { MockedProvider } from '@apollo/client/testing';
import React from 'react';
import { MockQuicksandProvider } from '@payroll/quicksand';
import { useManageTimeAgainstFieldAssignment } from 'src/js/service/hooks/assignments/useManageTimeAgainstFieldAssignment';
import { MANAGE_TIME_AGAINST_FIELD_ASSIGNMENT_MUTATION } from 'src/js/service/queries/timeTrackingAssignmentQueries';
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
    TIME_AGAINST_FIELD_ASSIGNMENT_MANAGE:
      'time-against-field-assignment-manage',
  },
}));

const mockSuccessResponse = {
  timeTrackingManageTimeAgainstFieldAssignment: {
    __typename: 'TimeTracking_ManageTimeAgainstFieldAssignmentPayload',
    successCode: 'SUCCESS',
    timeAgainst: {
      customer: {
        id: 'customer-123',
      },
      project: null,
    },
    customFieldResult: {
      __typename: 'TimeTracking_ManageTimeAgainstCustomFieldAssignmentPayload',
      successCode: 'SUCCESS',
    },
    standardFieldResult: {
      __typename:
        'TimeTracking_ManageTimeAgainstStandardFieldAssignmentPayload',
      successCode: 'SUCCESS',
    },
  },
};

const mockPartialSuccessResponse = {
  timeTrackingManageTimeAgainstFieldAssignment: {
    __typename: 'TimeTracking_PartialTimeAgainstFieldAssignmentPayload',
    successCode: 'PARTIAL_SUCCESS',
    timeAgainst: {
      customer: {
        id: 'customer-123',
      },
      project: null,
    },
    customFieldResult: {
      __typename: 'TimeTracking_ManageTimeAgainstCustomFieldAssignmentPayload',
      successCode: 'SUCCESS',
    },
    standardFieldResult: {
      __typename: 'TimeTracking_ManageTimeAgainstStandardFieldAssignmentError',
      errorCode: 'VALIDATION_ERROR',
      message: 'Standard field assignment failed',
      details: null,
      subCode: null,
    },
  },
};

const mockErrorResponse = {
  timeTrackingManageTimeAgainstFieldAssignment: {
    __typename: 'TimeTracking_ManageTimeAgainstFieldAssignmentError',
    errorCode: 'VALIDATION_ERROR',
    message: 'Failed to manage field assignments',
    details: 'Invalid input provided',
    subCode: 'INVALID_INPUT',
  },
};

describe('useManageTimeAgainstFieldAssignment', () => {
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
        () => useManageTimeAgainstFieldAssignment(),
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
    it('manages custom field assignments for a customer successfully', async () => {
      const onSuccess = jest.fn();
      const mocks = [
        {
          request: {
            query: MANAGE_TIME_AGAINST_FIELD_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                timeAgainst: { customerId: 'customer-123' },
                timeAgainstList: [],
                customFieldAssignments: {
                  customFieldIdsToAssign: ['cf-1', 'cf-2'],
                },
              },
            },
          },
          result: { data: mockSuccessResponse },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageTimeAgainstFieldAssignment({ onSuccess }),
        {
          wrapper: createWrapper(mocks),
        },
      );

      act(() => {
        result.current[0]({
          variables: {
            input: {
              timeAgainst: { customerId: 'customer-123' },
              timeAgainstList: [],
              customFieldAssignments: {
                customFieldIdsToAssign: ['cf-1', 'cf-2'],
              },
            },
          },
        });
      });

      await waitForNextUpdate();

      expect(onSuccess).toHaveBeenCalled();
    });

    it('manages standard field assignments for a project successfully', async () => {
      const onSuccess = jest.fn();
      const mocks = [
        {
          request: {
            query: MANAGE_TIME_AGAINST_FIELD_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                timeAgainst: { projectId: 'project-456' },
                timeAgainstList: [],
                standardFieldAssignments: {
                  standardFieldsToAssign: ['Customer', 'Service'],
                },
              },
            },
          },
          result: { data: mockSuccessResponse },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageTimeAgainstFieldAssignment({ onSuccess }),
        {
          wrapper: createWrapper(mocks),
        },
      );

      act(() => {
        result.current[0]({
          variables: {
            input: {
              timeAgainst: { projectId: 'project-456' },
              timeAgainstList: [],
              standardFieldAssignments: {
                standardFieldsToAssign: ['Customer', 'Service'],
              },
            },
          },
        });
      });

      await waitForNextUpdate();

      expect(onSuccess).toHaveBeenCalled();
    });

    it('manages both custom and standard field assignments together', async () => {
      const onSuccess = jest.fn();
      const mocks = [
        {
          request: {
            query: MANAGE_TIME_AGAINST_FIELD_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                timeAgainst: { customerId: 'customer-123' },
                timeAgainstList: [],
                customFieldAssignments: {
                  customFieldIdsToAssign: ['cf-1'],
                  customFieldIdsToUnassign: ['cf-2'],
                },
                standardFieldAssignments: {
                  standardFieldsToAssign: ['Customer'],
                  standardFieldsToUnassign: ['Service'],
                },
              },
            },
          },
          result: { data: mockSuccessResponse },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageTimeAgainstFieldAssignment({ onSuccess }),
        {
          wrapper: createWrapper(mocks),
        },
      );

      act(() => {
        result.current[0]({
          variables: {
            input: {
              timeAgainst: { customerId: 'customer-123' },
              timeAgainstList: [],
              customFieldAssignments: {
                customFieldIdsToAssign: ['cf-1'],
                customFieldIdsToUnassign: ['cf-2'],
              },
              standardFieldAssignments: {
                standardFieldsToAssign: ['Customer'],
                standardFieldsToUnassign: ['Service'],
              },
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
            query: MANAGE_TIME_AGAINST_FIELD_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                timeAgainst: { customerId: 'customer-123' },
                timeAgainstList: [],
                customFieldAssignments: {
                  customFieldIdsToAssign: ['cf-1'],
                },
                standardFieldAssignments: {
                  standardFieldsToAssign: ['InvalidField'],
                },
              },
            },
          },
          result: { data: mockPartialSuccessResponse },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageTimeAgainstFieldAssignment({ onPartialSuccess }),
        {
          wrapper: createWrapper(mocks),
        },
      );

      act(() => {
        result.current[0]({
          variables: {
            input: {
              timeAgainst: { customerId: 'customer-123' },
              timeAgainstList: [],
              customFieldAssignments: {
                customFieldIdsToAssign: ['cf-1'],
              },
              standardFieldAssignments: {
                standardFieldsToAssign: ['InvalidField'],
              },
            },
          },
        });
      });

      await waitForNextUpdate();

      expect(onPartialSuccess).toHaveBeenCalledWith({
        successCount: 1,
        errorMessages: ['Standard field assignment failed'],
        failedFields: [],
      });
    });

    it('unassigns fields successfully', async () => {
      const onSuccess = jest.fn();
      const mocks = [
        {
          request: {
            query: MANAGE_TIME_AGAINST_FIELD_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                timeAgainst: { customerId: 'customer-123' },
                timeAgainstList: [],
                customFieldAssignments: {
                  customFieldIdsToUnassign: ['cf-1', 'cf-2'],
                },
                standardFieldAssignments: {
                  standardFieldsToUnassign: ['Customer', 'Service'],
                },
              },
            },
          },
          result: { data: mockSuccessResponse },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageTimeAgainstFieldAssignment({ onSuccess }),
        {
          wrapper: createWrapper(mocks),
        },
      );

      act(() => {
        result.current[0]({
          variables: {
            input: {
              timeAgainst: { customerId: 'customer-123' },
              timeAgainstList: [],
              customFieldAssignments: {
                customFieldIdsToUnassign: ['cf-1', 'cf-2'],
              },
              standardFieldAssignments: {
                standardFieldsToUnassign: ['Customer', 'Service'],
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
            query: MANAGE_TIME_AGAINST_FIELD_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                timeAgainst: { customerId: 'customer-123' },
                timeAgainstList: [],
                customFieldAssignments: {
                  customFieldIdsToAssign: ['invalid-cf'],
                },
              },
            },
          },
          result: { data: mockErrorResponse },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageTimeAgainstFieldAssignment({ onError }),
        {
          wrapper: createWrapper(mocks),
        },
      );

      act(() => {
        result.current[0]({
          variables: {
            input: {
              timeAgainst: { customerId: 'customer-123' },
              timeAgainstList: [],
              customFieldAssignments: {
                customFieldIdsToAssign: ['invalid-cf'],
              },
            },
          },
        });
      });

      await waitForNextUpdate();

      expect(onError).toHaveBeenCalledWith(
        'Failed to manage field assignments',
      );
    });

    it('handles network error', async () => {
      const onError = jest.fn();
      const mocks = [
        {
          request: {
            query: MANAGE_TIME_AGAINST_FIELD_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                timeAgainst: { customerId: 'customer-123' },
                timeAgainstList: [],
                customFieldAssignments: {
                  customFieldIdsToAssign: ['cf-1'],
                },
              },
            },
          },
          error: new Error('Network error'),
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageTimeAgainstFieldAssignment({ onError }),
        {
          wrapper: createWrapper(mocks),
        },
      );

      act(() => {
        result.current[0]({
          variables: {
            input: {
              timeAgainst: { customerId: 'customer-123' },
              timeAgainstList: [],
              customFieldAssignments: {
                customFieldIdsToAssign: ['cf-1'],
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
            query: MANAGE_TIME_AGAINST_FIELD_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                timeAgainst: { customerId: 'customer-123' },
                timeAgainstList: [],
                customFieldAssignments: {
                  customFieldIdsToAssign: ['cf-1'],
                },
              },
            },
          },
          result: {
            data: {
              timeTrackingManageTimeAgainstFieldAssignment: {
                __typename:
                  'TimeTracking_ManageTimeAgainstFieldAssignmentError',
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
        () => useManageTimeAgainstFieldAssignment({ onError }),
        {
          wrapper: createWrapper(mocks),
        },
      );

      act(() => {
        result.current[0]({
          variables: {
            input: {
              timeAgainst: { customerId: 'customer-123' },
              timeAgainstList: [],
              customFieldAssignments: {
                customFieldIdsToAssign: ['cf-1'],
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
            query: MANAGE_TIME_AGAINST_FIELD_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                timeAgainst: { customerId: 'customer-123' },
                timeAgainstList: [],
                customFieldAssignments: {
                  customFieldIdsToAssign: ['cf-1'],
                },
              },
            },
          },
          result: { data: mockSuccessResponse },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageTimeAgainstFieldAssignment(),
        {
          wrapper: createWrapper(mocks),
        },
      );

      act(() => {
        result.current[0]({
          variables: {
            input: {
              timeAgainst: { customerId: 'customer-123' },
              timeAgainstList: [],
              customFieldAssignments: {
                customFieldIdsToAssign: ['cf-1'],
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
            query: MANAGE_TIME_AGAINST_FIELD_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                timeAgainst: { customerId: 'customer-123' },
                timeAgainstList: [],
                customFieldAssignments: {
                  customFieldIdsToAssign: ['cf-1'],
                },
              },
            },
          },
          result: { data: mockErrorResponse },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageTimeAgainstFieldAssignment(),
        {
          wrapper: createWrapper(mocks),
        },
      );

      act(() => {
        result.current[0]({
          variables: {
            input: {
              timeAgainst: { customerId: 'customer-123' },
              timeAgainstList: [],
              customFieldAssignments: {
                customFieldIdsToAssign: ['cf-1'],
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
            query: MANAGE_TIME_AGAINST_FIELD_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                timeAgainst: { customerId: 'customer-123' },
                timeAgainstList: [],
                customFieldAssignments: {
                  customFieldIdsToAssign: ['cf-1'],
                },
              },
            },
          },
          result: { data: mockPartialSuccessResponse },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageTimeAgainstFieldAssignment(),
        {
          wrapper: createWrapper(mocks),
        },
      );

      act(() => {
        result.current[0]({
          variables: {
            input: {
              timeAgainst: { customerId: 'customer-123' },
              timeAgainstList: [],
              customFieldAssignments: {
                customFieldIdsToAssign: ['cf-1'],
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
    it('handles GraphQL errors in result.errors array', async () => {
      const onError = jest.fn();
      const mocks = [
        {
          request: {
            query: MANAGE_TIME_AGAINST_FIELD_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                timeAgainst: { customerId: 'customer-123' },
                timeAgainstList: [],
                customFieldAssignments: {
                  customFieldIdsToAssign: ['cf-1'],
                },
              },
            },
          },
          result: {
            data: null,
            errors: [{ message: 'GraphQL validation error' }],
          },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageTimeAgainstFieldAssignment({ onError }),
        {
          wrapper: createWrapper(mocks),
        },
      );

      act(() => {
        result.current[0]({
          variables: {
            input: {
              timeAgainst: { customerId: 'customer-123' },
              timeAgainstList: [],
              customFieldAssignments: {
                customFieldIdsToAssign: ['cf-1'],
              },
            },
          },
        });
      });

      await waitForNextUpdate();

      expect(onError).toHaveBeenCalledWith('GraphQL validation error');
    });

    it('handles GraphQL errors without message in result.errors', async () => {
      const onError = jest.fn();
      const mocks = [
        {
          request: {
            query: MANAGE_TIME_AGAINST_FIELD_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                timeAgainst: { customerId: 'customer-123' },
                timeAgainstList: [],
                customFieldAssignments: {
                  customFieldIdsToAssign: ['cf-1'],
                },
              },
            },
          },
          result: {
            data: null,
            errors: [{ message: null }],
          },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageTimeAgainstFieldAssignment({ onError }),
        {
          wrapper: createWrapper(mocks),
        },
      );

      act(() => {
        result.current[0]({
          variables: {
            input: {
              timeAgainst: { customerId: 'customer-123' },
              timeAgainstList: [],
              customFieldAssignments: {
                customFieldIdsToAssign: ['cf-1'],
              },
            },
          },
        });
      });

      await waitForNextUpdate();

      expect(onError).toHaveBeenCalled();
    });

    it('handles GraphQL errors with empty message', async () => {
      const onError = jest.fn();
      const mocks = [
        {
          request: {
            query: MANAGE_TIME_AGAINST_FIELD_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                timeAgainst: { customerId: 'customer-123' },
                timeAgainstList: [],
                customFieldAssignments: {
                  customFieldIdsToAssign: ['cf-1'],
                },
              },
            },
          },
          result: {
            data: null,
            errors: [{ message: '' }],
          },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageTimeAgainstFieldAssignment({ onError }),
        {
          wrapper: createWrapper(mocks),
        },
      );

      act(() => {
        result.current[0]({
          variables: {
            input: {
              timeAgainst: { customerId: 'customer-123' },
              timeAgainstList: [],
              customFieldAssignments: {
                customFieldIdsToAssign: ['cf-1'],
              },
            },
          },
        });
      });

      await waitForNextUpdate();

      expect(onError).toHaveBeenCalled();
      // When message is empty, it should use fallback
      const errorArg = onError.mock.calls[0][0];
      expect(errorArg).toBeTruthy();
    });

    it('handles multiple GraphQL errors', async () => {
      const onError = jest.fn();
      const mocks = [
        {
          request: {
            query: MANAGE_TIME_AGAINST_FIELD_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                timeAgainst: { customerId: 'customer-123' },
                timeAgainstList: [],
                customFieldAssignments: {
                  customFieldIdsToAssign: ['cf-1'],
                },
              },
            },
          },
          result: {
            data: null,
            errors: [{ message: 'First error' }, { message: 'Second error' }],
          },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageTimeAgainstFieldAssignment({ onError }),
        {
          wrapper: createWrapper(mocks),
        },
      );

      act(() => {
        result.current[0]({
          variables: {
            input: {
              timeAgainst: { customerId: 'customer-123' },
              timeAgainstList: [],
              customFieldAssignments: {
                customFieldIdsToAssign: ['cf-1'],
              },
            },
          },
        });
      });

      await waitForNextUpdate();

      expect(onError).toHaveBeenCalled();
      // Should receive error message(s)
      const errorArg = onError.mock.calls[0][0];
      expect(errorArg).toContain('error');
    });

    it('handles null response from server', async () => {
      const onError = jest.fn();
      const mocks = [
        {
          request: {
            query: MANAGE_TIME_AGAINST_FIELD_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                timeAgainst: { customerId: 'customer-123' },
                timeAgainstList: [],
                customFieldAssignments: {
                  customFieldIdsToAssign: ['cf-1'],
                },
              },
            },
          },
          result: {
            data: {
              timeTrackingManageTimeAgainstFieldAssignment: null,
            },
          },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageTimeAgainstFieldAssignment({ onError }),
        {
          wrapper: createWrapper(mocks),
        },
      );

      act(() => {
        result.current[0]({
          variables: {
            input: {
              timeAgainst: { customerId: 'customer-123' },
              timeAgainstList: [],
              customFieldAssignments: {
                customFieldIdsToAssign: ['cf-1'],
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
            query: MANAGE_TIME_AGAINST_FIELD_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                timeAgainst: { customerId: 'customer-123' },
                timeAgainstList: [],
                customFieldAssignments: {
                  customFieldIdsToAssign: ['cf-1'],
                },
              },
            },
          },
          result: {
            data: {
              timeTrackingManageTimeAgainstFieldAssignment: {
                __typename: 'UnexpectedType',
              },
            },
          },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageTimeAgainstFieldAssignment({ onError }),
        {
          wrapper: createWrapper(mocks),
        },
      );

      act(() => {
        result.current[0]({
          variables: {
            input: {
              timeAgainst: { customerId: 'customer-123' },
              timeAgainstList: [],
              customFieldAssignments: {
                customFieldIdsToAssign: ['cf-1'],
              },
            },
          },
        });
      });

      await waitForNextUpdate();

      expect(onError).toHaveBeenCalled();
      expect(onError.mock.calls[0][0]).toContain('assignments.genericError');
    });

    it('calculates success and failure counts correctly for partial success', async () => {
      const onPartialSuccess = jest.fn();
      const mocks = [
        {
          request: {
            query: MANAGE_TIME_AGAINST_FIELD_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                timeAgainst: { customerId: 'customer-123' },
                timeAgainstList: [],
                customFieldAssignments: {
                  customFieldIdsToAssign: ['cf-1', 'cf-2'],
                },
                standardFieldAssignments: {
                  standardFieldsToAssign: ['SERVICE_ITEM'],
                },
              },
            },
          },
          result: { data: mockPartialSuccessResponse },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageTimeAgainstFieldAssignment({ onPartialSuccess }),
        {
          wrapper: createWrapper(mocks),
        },
      );

      act(() => {
        result.current[0]({
          variables: {
            input: {
              timeAgainst: { customerId: 'customer-123' },
              timeAgainstList: [],
              customFieldAssignments: {
                customFieldIdsToAssign: ['cf-1', 'cf-2'],
              },
              standardFieldAssignments: {
                standardFieldsToAssign: ['SERVICE_ITEM'],
              },
            },
          },
        });
      });

      await waitForNextUpdate();

      expect(onPartialSuccess).toHaveBeenCalledWith({
        successCount: 2,
        errorMessages: ['Standard field assignment failed'],
        failedFields: [],
      });
    });

    it('handles partial success with custom field error', async () => {
      const onPartialSuccess = jest.fn();
      const partialSuccessWithCustomFieldError = {
        timeTrackingManageTimeAgainstFieldAssignment: {
          __typename: 'TimeTracking_PartialTimeAgainstFieldAssignmentPayload',
          customFieldResult: {
            __typename:
              'TimeTracking_ManageTimeAgainstCustomFieldAssignmentError',
            errorCode: 'VALIDATION_ERROR',
            message: 'Custom field assignment failed',
            details: null,
            subCode: null,
          },
          standardFieldResult: {
            __typename:
              'TimeTracking_ManageTimeAgainstStandardFieldAssignmentPayload',
            successCode: 'SUCCESS',
          },
        },
      };

      const mocks = [
        {
          request: {
            query: MANAGE_TIME_AGAINST_FIELD_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                timeAgainst: { customerId: 'customer-123' },
                timeAgainstList: [],
                customFieldAssignments: {
                  customFieldIdsToAssign: ['cf-1'],
                },
                standardFieldAssignments: {
                  standardFieldsToAssign: ['SERVICE_ITEM'],
                },
              },
            },
          },
          result: { data: partialSuccessWithCustomFieldError },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageTimeAgainstFieldAssignment({ onPartialSuccess }),
        {
          wrapper: createWrapper(mocks),
        },
      );

      act(() => {
        result.current[0]({
          variables: {
            input: {
              timeAgainst: { customerId: 'customer-123' },
              timeAgainstList: [],
              customFieldAssignments: {
                customFieldIdsToAssign: ['cf-1'],
              },
              standardFieldAssignments: {
                standardFieldsToAssign: ['SERVICE_ITEM'],
              },
            },
          },
        });
      });

      await waitForNextUpdate();

      expect(onPartialSuccess).toHaveBeenCalledWith({
        successCount: 1,
        errorMessages: ['Custom field assignment failed'],
        failedFields: [],
      });
    });

    it('handles unassign operations in partial success', async () => {
      const onPartialSuccess = jest.fn();
      const mocks = [
        {
          request: {
            query: MANAGE_TIME_AGAINST_FIELD_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                timeAgainst: { customerId: 'customer-123' },
                timeAgainstList: [],
                customFieldAssignments: {
                  customFieldIdsToUnassign: ['cf-1'],
                },
                standardFieldAssignments: {
                  standardFieldsToUnassign: ['SERVICE_ITEM'],
                },
              },
            },
          },
          result: { data: mockPartialSuccessResponse },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageTimeAgainstFieldAssignment({ onPartialSuccess }),
        {
          wrapper: createWrapper(mocks),
        },
      );

      act(() => {
        result.current[0]({
          variables: {
            input: {
              timeAgainst: { customerId: 'customer-123' },
              timeAgainstList: [],
              customFieldAssignments: {
                customFieldIdsToUnassign: ['cf-1'],
              },
              standardFieldAssignments: {
                standardFieldsToUnassign: ['SERVICE_ITEM'],
              },
            },
          },
        });
      });

      await waitForNextUpdate();

      expect(onPartialSuccess).toHaveBeenCalledWith({
        successCount: 1,
        errorMessages: ['Standard field assignment failed'],
        failedFields: [],
      });
    });
  });

  describe('CustomerInteraction Integration', () => {
    it('calls createCustomerInteraction before executing mutation', async () => {
      const mocks = [
        {
          request: {
            query: MANAGE_TIME_AGAINST_FIELD_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                timeAgainst: { customerId: 'customer-123' },
                customFieldAssignments: {
                  customFieldIdsToAssign: ['cf-1'],
                },
              },
            },
          },
          result: { data: mockSuccessResponse },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageTimeAgainstFieldAssignment(),
        {
          wrapper: createWrapper(mocks),
        },
      );

      act(() => {
        result.current[0]({
          variables: {
            input: {
              timeAgainst: { customerId: 'customer-123' },
              timeAgainstList: [],
              customFieldAssignments: {
                customFieldIdsToAssign: ['cf-1'],
              },
            },
          },
        });
      });

      expect(createCustomerInteraction).toHaveBeenCalledWith(
        sandbox,
        TimeCustomerInteraction.TIME_AGAINST_FIELD_ASSIGNMENT_MANAGE,
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
            query: MANAGE_TIME_AGAINST_FIELD_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                timeAgainst: { customerId: 'customer-123' },
                customFieldAssignments: {
                  customFieldIdsToAssign: ['cf-1'],
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
        () => useManageTimeAgainstFieldAssignment(),
        {
          wrapper: createWrapper(mocks),
        },
      );

      act(() => {
        result.current[0]({
          variables: {
            input: {
              timeAgainst: { customerId: 'customer-123' },
              timeAgainstList: [],
              customFieldAssignments: {
                customFieldIdsToAssign: ['cf-1'],
              },
            },
          },
        });
      });

      expect(getCustomerInteractionPropagationHeaders).toHaveBeenCalledWith(
        sandbox,
        TimeCustomerInteraction.TIME_AGAINST_FIELD_ASSIGNMENT_MANAGE,
      );

      await waitForNextUpdate();
    });

    it('calls createCustomerInteraction even when mutation fails', async () => {
      const mockErrorResponse = {
        timeTrackingManageTimeAgainstFieldAssignment: {
          __typename: 'TimeTracking_ManageTimeAgainstFieldAssignmentError',
          errorCode: 'VALIDATION_ERROR',
          message: 'Failed to manage field assignments',
        },
      };

      const mocks = [
        {
          request: {
            query: MANAGE_TIME_AGAINST_FIELD_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                timeAgainst: { customerId: 'customer-123' },
                customFieldAssignments: {
                  customFieldIdsToAssign: ['cf-1'],
                },
              },
            },
          },
          result: { data: mockErrorResponse },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageTimeAgainstFieldAssignment(),
        {
          wrapper: createWrapper(mocks),
        },
      );

      act(() => {
        result.current[0]({
          variables: {
            input: {
              timeAgainst: { customerId: 'customer-123' },
              timeAgainstList: [],
              customFieldAssignments: {
                customFieldIdsToAssign: ['cf-1'],
              },
            },
          },
        });
      });

      expect(createCustomerInteraction).toHaveBeenCalledWith(
        sandbox,
        TimeCustomerInteraction.TIME_AGAINST_FIELD_ASSIGNMENT_MANAGE,
      );

      await waitForNextUpdate();
    });
  });
});
