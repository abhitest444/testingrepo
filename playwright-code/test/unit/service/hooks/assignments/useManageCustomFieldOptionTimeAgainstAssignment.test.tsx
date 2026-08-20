import { renderHook, act } from '@testing-library/react-hooks';
import { MockedProvider } from '@apollo/client/testing';
import React from 'react';
import { MockQuicksandProvider } from '@payroll/quicksand';
import { useManageCustomFieldOptionTimeAgainstAssignment } from 'src/js/service/hooks/assignments/useManageCustomFieldOptionTimeAgainstAssignment';
import { MANAGE_CUSTOM_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MUTATION } from 'src/js/service/queries/timeTrackingAssignmentQueries';
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
    CUSTOM_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MANAGE:
      'custom-field-option-time-against-assignment-manage',
  },
}));

const mockSuccessResponse = {
  timeTrackingManageCustomFieldOptionTimeAgainstAssignment: {
    __typename:
      'TimeTracking_ManageCustomFieldOptionTimeAgainstAssignmentPayload',
    successCode: 'SUCCESS',
    customField: {
      id: 'field-123',
    },
    customFieldOption: {
      id: 'option-456',
      name: 'Option A',
      deleted: false,
    },
    assignedTimeAgainst: [{ id: 'customer-1' }, { id: 'customer-2' }],
    unassignedTimeAgainst: [],
  },
};

const mockPartialSuccessResponse = {
  timeTrackingManageCustomFieldOptionTimeAgainstAssignment: {
    __typename:
      'TimeTracking_PartialCustomFieldOptionTimeAgainstAssignmentPayload',
    successCode: 'PARTIAL_SUCCESS',
    customFieldOption: {
      id: 'option-456',
      name: 'Option A',
    },
    timeAgainstAssignResults: [
      {
        __typename: 'TimeTracking_AssignedCustomer',
        id: 'customer-1',
      },
      {
        __typename: 'TimeTracking_AssignmentItemError',
        errorCode: 'VALIDATION_ERROR',
        message: 'Customer assignment failed',
        details: null,
        subCode: null,
        element: 'customer-2',
      },
    ],
    timeAgainstUnassignResults: [],
  },
};

const mockErrorResponse = {
  timeTrackingManageCustomFieldOptionTimeAgainstAssignment: {
    __typename:
      'TimeTracking_ManageCustomFieldOptionTimeAgainstAssignmentError',
    errorCode: 'VALIDATION_ERROR',
    message: 'Failed to manage custom field option time against assignments',
    details: 'Invalid input provided',
    subCode: 'INVALID_INPUT',
  },
};

describe('useManageCustomFieldOptionTimeAgainstAssignment', () => {
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
        () => useManageCustomFieldOptionTimeAgainstAssignment(),
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
    it('manages customer assignments for a custom field option successfully', async () => {
      const onSuccess = jest.fn();
      const mocks = [
        {
          request: {
            query: MANAGE_CUSTOM_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                customFieldId: 'field-123',
                customFieldOptionId: 'option-456',
                timeAgainstAssignments: {
                  timeAgainstToAssign: [
                    { customerId: 'customer-1' },
                    { customerId: 'customer-2' },
                  ],
                },
              },
            },
          },
          result: { data: mockSuccessResponse },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageCustomFieldOptionTimeAgainstAssignment({ onSuccess }),
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
              timeAgainstAssignments: {
                timeAgainstToAssign: [
                  { customerId: 'customer-1' },
                  { customerId: 'customer-2' },
                ],
              },
            },
          },
        });
      });

      await waitForNextUpdate();

      expect(onSuccess).toHaveBeenCalled();
    });

    it('manages project assignments for a custom field option successfully', async () => {
      const onSuccess = jest.fn();
      const projectResponse = {
        timeTrackingManageCustomFieldOptionTimeAgainstAssignment: {
          __typename:
            'TimeTracking_ManageCustomFieldOptionTimeAgainstAssignmentPayload',
          successCode: 'SUCCESS',
          customField: {
            id: 'field-123',
          },
          customFieldOption: {
            id: 'option-456',
            name: 'Option A',
            deleted: false,
          },
          assignedTimeAgainst: [{ id: 'project-1' }],
          unassignedTimeAgainst: [],
        },
      };

      const mocks = [
        {
          request: {
            query: MANAGE_CUSTOM_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                customFieldId: 'field-123',
                customFieldOptionId: 'option-456',
                timeAgainstAssignments: {
                  timeAgainstToAssign: [{ projectId: 'project-1' }],
                },
              },
            },
          },
          result: { data: projectResponse },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageCustomFieldOptionTimeAgainstAssignment({ onSuccess }),
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
              timeAgainstAssignments: {
                timeAgainstToAssign: [{ projectId: 'project-1' }],
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
            query: MANAGE_CUSTOM_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MUTATION,
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
        () => useManageCustomFieldOptionTimeAgainstAssignment({ onSuccess }),
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

    it('unassigns customers successfully', async () => {
      const onSuccess = jest.fn();
      const unassignResponse = {
        timeTrackingManageCustomFieldOptionTimeAgainstAssignment: {
          __typename:
            'TimeTracking_ManageCustomFieldOptionTimeAgainstAssignmentPayload',
          successCode: 'SUCCESS',
          customField: {
            id: 'field-123',
          },
          customFieldOption: {
            id: 'option-456',
            name: 'Option A',
            deleted: false,
          },
          assignedTimeAgainst: [],
          unassignedTimeAgainst: [{ id: 'customer-1' }, { id: 'customer-2' }],
        },
      };

      const mocks = [
        {
          request: {
            query: MANAGE_CUSTOM_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                customFieldId: 'field-123',
                customFieldOptionId: 'option-456',
                timeAgainstAssignments: {
                  timeAgainstToUnassign: [
                    { customerId: 'customer-1' },
                    { customerId: 'customer-2' },
                  ],
                },
              },
            },
          },
          result: { data: unassignResponse },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageCustomFieldOptionTimeAgainstAssignment({ onSuccess }),
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
              timeAgainstAssignments: {
                timeAgainstToUnassign: [
                  { customerId: 'customer-1' },
                  { customerId: 'customer-2' },
                ],
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
            query: MANAGE_CUSTOM_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                customFieldId: 'field-123',
                customFieldOptionId: 'option-456',
                timeAgainstAssignments: {
                  timeAgainstToAssign: [
                    { customerId: 'customer-1' },
                    { customerId: 'customer-2' },
                  ],
                },
              },
            },
          },
          result: { data: mockPartialSuccessResponse },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () =>
          useManageCustomFieldOptionTimeAgainstAssignment({ onPartialSuccess }),
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
              timeAgainstAssignments: {
                timeAgainstToAssign: [
                  { customerId: 'customer-1' },
                  { customerId: 'customer-2' },
                ],
              },
            },
          },
        });
      });

      await waitForNextUpdate();

      expect(onPartialSuccess).toHaveBeenCalledWith({
        customers: {
          successCount: 1,
          failed: ['customer-2'],
          errorMessages: ['Customer assignment failed'],
        },
      });
    });
  });

  describe('Error Handling', () => {
    it('handles GraphQL error response', async () => {
      const onError = jest.fn();
      const mocks = [
        {
          request: {
            query: MANAGE_CUSTOM_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                customFieldId: 'field-123',
                customFieldOptionId: 'option-456',
                timeAgainstAssignments: {
                  timeAgainstToAssign: [{ customerId: 'invalid-customer' }],
                },
              },
            },
          },
          result: { data: mockErrorResponse },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageCustomFieldOptionTimeAgainstAssignment({ onError }),
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
              timeAgainstAssignments: {
                timeAgainstToAssign: [{ customerId: 'invalid-customer' }],
              },
            },
          },
        });
      });

      await waitForNextUpdate();

      expect(onError).toHaveBeenCalledWith(
        'Failed to manage custom field option time against assignments',
      );
    });

    it('handles network error', async () => {
      const onError = jest.fn();
      const mocks = [
        {
          request: {
            query: MANAGE_CUSTOM_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                customFieldId: 'field-123',
                customFieldOptionId: 'option-456',
                timeAgainstAssignments: {
                  timeAgainstToAssign: [{ customerId: 'customer-1' }],
                },
              },
            },
          },
          error: new Error('Network error'),
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageCustomFieldOptionTimeAgainstAssignment({ onError }),
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
              timeAgainstAssignments: {
                timeAgainstToAssign: [{ customerId: 'customer-1' }],
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
            query: MANAGE_CUSTOM_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                customFieldId: 'field-123',
                customFieldOptionId: 'option-456',
                timeAgainstAssignments: {
                  timeAgainstToAssign: [{ customerId: 'customer-1' }],
                },
              },
            },
          },
          result: {
            data: {
              timeTrackingManageCustomFieldOptionTimeAgainstAssignment: {
                __typename:
                  'TimeTracking_ManageCustomFieldOptionTimeAgainstAssignmentError',
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
        () => useManageCustomFieldOptionTimeAgainstAssignment({ onError }),
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
              timeAgainstAssignments: {
                timeAgainstToAssign: [{ customerId: 'customer-1' }],
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
            query: MANAGE_CUSTOM_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                customFieldId: 'field-123',
                customFieldOptionId: 'option-456',
                timeAgainstAssignments: {
                  timeAgainstToAssign: [{ customerId: 'customer-1' }],
                },
              },
            },
          },
          result: { data: mockSuccessResponse },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageCustomFieldOptionTimeAgainstAssignment(),
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
              timeAgainstAssignments: {
                timeAgainstToAssign: [{ customerId: 'customer-1' }],
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
            query: MANAGE_CUSTOM_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                customFieldId: 'field-123',
                customFieldOptionId: 'option-456',
                timeAgainstAssignments: {
                  timeAgainstToAssign: [{ customerId: 'customer-1' }],
                },
              },
            },
          },
          result: { data: mockErrorResponse },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageCustomFieldOptionTimeAgainstAssignment(),
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
              timeAgainstAssignments: {
                timeAgainstToAssign: [{ customerId: 'customer-1' }],
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
            query: MANAGE_CUSTOM_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                customFieldId: 'field-123',
                customFieldOptionId: 'option-456',
                timeAgainstAssignments: {
                  timeAgainstToAssign: [{ customerId: 'customer-1' }],
                },
              },
            },
          },
          result: { data: mockPartialSuccessResponse },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageCustomFieldOptionTimeAgainstAssignment(),
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
              timeAgainstAssignments: {
                timeAgainstToAssign: [{ customerId: 'customer-1' }],
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
            query: MANAGE_CUSTOM_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                customFieldId: 'field-123',
                customFieldOptionId: 'option-456',
                timeAgainstAssignments: {
                  timeAgainstToAssign: [{ customerId: 'customer-1' }],
                },
              },
            },
          },
          result: {
            data: {
              timeTrackingManageCustomFieldOptionTimeAgainstAssignment: null,
            },
          },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageCustomFieldOptionTimeAgainstAssignment({ onError }),
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
              timeAgainstAssignments: {
                timeAgainstToAssign: [{ customerId: 'customer-1' }],
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
            query: MANAGE_CUSTOM_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                customFieldId: 'field-123',
                customFieldOptionId: 'option-456',
                timeAgainstAssignments: {
                  timeAgainstToAssign: [{ customerId: 'customer-1' }],
                },
              },
            },
          },
          result: {
            data: {
              timeTrackingManageCustomFieldOptionTimeAgainstAssignment: {
                __typename: 'UnexpectedType',
              },
            },
          },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageCustomFieldOptionTimeAgainstAssignment({ onError }),
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
              timeAgainstAssignments: {
                timeAgainstToAssign: [{ customerId: 'customer-1' }],
              },
            },
          },
        });
      });

      await waitForNextUpdate();

      expect(onError).toHaveBeenCalled();
      expect(onError.mock.calls[0][0]).toContain('assignments.genericError');
    });

    it('handles partial success with unassign results', async () => {
      const onPartialSuccess = jest.fn();
      const partialUnassignResponse = {
        timeTrackingManageCustomFieldOptionTimeAgainstAssignment: {
          __typename:
            'TimeTracking_PartialCustomFieldOptionTimeAgainstAssignmentPayload',
          successCode: 'PARTIAL_SUCCESS',
          customFieldOption: {
            id: 'option-456',
            name: 'Option A',
          },
          timeAgainstAssignResults: [],
          timeAgainstUnassignResults: [
            {
              __typename: 'TimeTracking_AssignedCustomer',
              id: 'customer-1',
            },
            {
              __typename: 'TimeTracking_AssignmentItemError',
              errorCode: 'NOT_FOUND',
              message: 'Customer not found',
              details: null,
              subCode: null,
              element: 'customer-2',
            },
          ],
        },
      };

      const mocks = [
        {
          request: {
            query: MANAGE_CUSTOM_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                customFieldId: 'field-123',
                customFieldOptionId: 'option-456',
                timeAgainstAssignments: {
                  timeAgainstToUnassign: [
                    { customerId: 'customer-1' },
                    { customerId: 'customer-2' },
                  ],
                },
              },
            },
          },
          result: { data: partialUnassignResponse },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () =>
          useManageCustomFieldOptionTimeAgainstAssignment({ onPartialSuccess }),
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
              timeAgainstAssignments: {
                timeAgainstToUnassign: [
                  { customerId: 'customer-1' },
                  { customerId: 'customer-2' },
                ],
              },
            },
          },
        });
      });

      await waitForNextUpdate();

      expect(onPartialSuccess).toHaveBeenCalledWith({
        customers: {
          successCount: 1,
          failed: ['customer-2'],
          errorMessages: ['Customer not found'],
        },
      });
    });

    it('handles partial success with both assign and unassign results', async () => {
      const onPartialSuccess = jest.fn();
      const mixedResponse = {
        timeTrackingManageCustomFieldOptionTimeAgainstAssignment: {
          __typename:
            'TimeTracking_PartialCustomFieldOptionTimeAgainstAssignmentPayload',
          successCode: 'PARTIAL_SUCCESS',
          customFieldOption: {
            id: 'option-456',
            name: 'Option A',
          },
          timeAgainstAssignResults: [
            {
              __typename: 'TimeTracking_AssignedCustomer',
              id: 'customer-1',
            },
            {
              __typename: 'TimeTracking_AssignmentItemError',
              errorCode: 'VALIDATION_ERROR',
              message: 'Invalid customer',
              details: null,
              subCode: null,
              element: 'customer-2',
            },
          ],
          timeAgainstUnassignResults: [
            {
              __typename: 'TimeTracking_AssignedCustomer',
              id: 'customer-3',
            },
          ],
        },
      };

      const mocks = [
        {
          request: {
            query: MANAGE_CUSTOM_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                customFieldId: 'field-123',
                customFieldOptionId: 'option-456',
                timeAgainstAssignments: {
                  timeAgainstToAssign: [
                    { customerId: 'customer-1' },
                    { customerId: 'customer-2' },
                  ],
                  timeAgainstToUnassign: [{ customerId: 'customer-3' }],
                },
              },
            },
          },
          result: { data: mixedResponse },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () =>
          useManageCustomFieldOptionTimeAgainstAssignment({ onPartialSuccess }),
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
              timeAgainstAssignments: {
                timeAgainstToAssign: [
                  { customerId: 'customer-1' },
                  { customerId: 'customer-2' },
                ],
                timeAgainstToUnassign: [{ customerId: 'customer-3' }],
              },
            },
          },
        });
      });

      await waitForNextUpdate();

      expect(onPartialSuccess).toHaveBeenCalledWith({
        customers: {
          successCount: 2, // 1 from assign + 1 from unassign
          failed: ['customer-2'],
          errorMessages: ['Invalid customer'],
        },
      });
    });

    it('adds generic error message when failures have no specific messages', async () => {
      const onPartialSuccess = jest.fn();
      const partialWithNoErrorMessage = {
        timeTrackingManageCustomFieldOptionTimeAgainstAssignment: {
          __typename:
            'TimeTracking_PartialCustomFieldOptionTimeAgainstAssignmentPayload',
          successCode: 'PARTIAL_SUCCESS',
          customFieldOption: {
            id: 'option-456',
            name: 'Option A',
          },
          timeAgainstAssignResults: [
            {
              __typename: 'TimeTracking_AssignedCustomer',
              id: 'customer-1',
            },
            {
              __typename: 'TimeTracking_AssignmentItemError',
              errorCode: 'UNKNOWN_ERROR',
              message: null,
              details: null,
              subCode: null,
              element: 'customer-2',
            },
          ],
          timeAgainstUnassignResults: [],
        },
      };

      const mocks = [
        {
          request: {
            query: MANAGE_CUSTOM_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                customFieldId: 'field-123',
                customFieldOptionId: 'option-456',
                timeAgainstAssignments: {
                  timeAgainstToAssign: [
                    { customerId: 'customer-1' },
                    { customerId: 'customer-2' },
                  ],
                },
              },
            },
          },
          result: { data: partialWithNoErrorMessage },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () =>
          useManageCustomFieldOptionTimeAgainstAssignment({ onPartialSuccess }),
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
              timeAgainstAssignments: {
                timeAgainstToAssign: [
                  { customerId: 'customer-1' },
                  { customerId: 'customer-2' },
                ],
              },
            },
          },
        });
      });

      await waitForNextUpdate();

      expect(onPartialSuccess).toHaveBeenCalled();
      const callArgs = onPartialSuccess.mock.calls[0][0];
      expect(callArgs.customers.failed).toContain('customer-2');
      expect(callArgs.customers.errorMessages.length).toBeGreaterThan(0);
      expect(callArgs.customers.errorMessages[0]).toContain(
        'assignments.genericError',
      );
    });

    it('handles mixed customers and projects in assignments', async () => {
      const onSuccess = jest.fn();
      const mixedAssignmentsResponse = {
        timeTrackingManageCustomFieldOptionTimeAgainstAssignment: {
          __typename:
            'TimeTracking_ManageCustomFieldOptionTimeAgainstAssignmentPayload',
          successCode: 'SUCCESS',
          customField: {
            id: 'field-123',
          },
          customFieldOption: {
            id: 'option-456',
            name: 'Option A',
            deleted: false,
          },
          assignedTimeAgainst: [
            { id: 'customer-1' },
            { id: 'project-1' },
            { id: 'project-2' },
          ],
          unassignedTimeAgainst: [],
        },
      };

      const mocks = [
        {
          request: {
            query: MANAGE_CUSTOM_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                customFieldId: 'field-123',
                customFieldOptionId: 'option-456',
                timeAgainstAssignments: {
                  timeAgainstToAssign: [
                    { customerId: 'customer-1' },
                    { projectId: 'project-1' },
                    { projectId: 'project-2' },
                  ],
                },
              },
            },
          },
          result: { data: mixedAssignmentsResponse },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageCustomFieldOptionTimeAgainstAssignment({ onSuccess }),
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
              timeAgainstAssignments: {
                timeAgainstToAssign: [
                  { customerId: 'customer-1' },
                  { projectId: 'project-1' },
                  { projectId: 'project-2' },
                ],
              },
            },
          },
        });
      });

      await waitForNextUpdate();

      expect(onSuccess).toHaveBeenCalled();
    });

    it('calculates success counts correctly with multiple successes', async () => {
      const onPartialSuccess = jest.fn();
      const multipleSuccessResponse = {
        timeTrackingManageCustomFieldOptionTimeAgainstAssignment: {
          __typename:
            'TimeTracking_PartialCustomFieldOptionTimeAgainstAssignmentPayload',
          successCode: 'PARTIAL_SUCCESS',
          customFieldOption: {
            id: 'option-456',
            name: 'Option A',
          },
          timeAgainstAssignResults: [
            {
              __typename: 'TimeTracking_AssignedCustomer',
              id: 'customer-1',
            },
            {
              __typename: 'TimeTracking_AssignedCustomer',
              id: 'customer-2',
            },
            {
              __typename: 'TimeTracking_AssignedCustomer',
              id: 'customer-3',
            },
          ],
          timeAgainstUnassignResults: [
            {
              __typename: 'TimeTracking_AssignedCustomer',
              id: 'customer-4',
            },
            {
              __typename: 'TimeTracking_AssignmentItemError',
              errorCode: 'VALIDATION_ERROR',
              message: 'Failed to unassign',
              details: null,
              subCode: null,
              element: 'customer-5',
            },
          ],
        },
      };

      const mocks = [
        {
          request: {
            query: MANAGE_CUSTOM_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                customFieldId: 'field-123',
                customFieldOptionId: 'option-456',
                timeAgainstAssignments: {
                  timeAgainstToAssign: [
                    { customerId: 'customer-1' },
                    { customerId: 'customer-2' },
                    { customerId: 'customer-3' },
                  ],
                  timeAgainstToUnassign: [
                    { customerId: 'customer-4' },
                    { customerId: 'customer-5' },
                  ],
                },
              },
            },
          },
          result: { data: multipleSuccessResponse },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () =>
          useManageCustomFieldOptionTimeAgainstAssignment({ onPartialSuccess }),
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
              timeAgainstAssignments: {
                timeAgainstToAssign: [
                  { customerId: 'customer-1' },
                  { customerId: 'customer-2' },
                  { customerId: 'customer-3' },
                ],
                timeAgainstToUnassign: [
                  { customerId: 'customer-4' },
                  { customerId: 'customer-5' },
                ],
              },
            },
          },
        });
      });

      await waitForNextUpdate();

      expect(onPartialSuccess).toHaveBeenCalledWith({
        customers: {
          successCount: 4, // 3 from assign + 1 from unassign
          failed: ['customer-5'],
          errorMessages: ['Failed to unassign'],
        },
      });
    });
  });

  describe('CustomerInteraction Integration', () => {
    it('calls createCustomerInteraction before executing mutation', async () => {
      const mocks = [
        {
          request: {
            query: MANAGE_CUSTOM_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                customFieldId: 'cf-123',
                customFieldOptionId: 'option-456',
                timeAgainstAssignments: {
                  timeAgainstToAssign: [{ customerId: 'customer-1' }],
                },
              },
            },
          },
          result: { data: mockSuccessResponse },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageCustomFieldOptionTimeAgainstAssignment(),
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
              timeAgainstAssignments: {
                timeAgainstToAssign: [{ customerId: 'customer-1' }],
              },
            },
          },
        });
      });

      expect(createCustomerInteraction).toHaveBeenCalledWith(
        sandbox,
        TimeCustomerInteraction.CUSTOM_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MANAGE,
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
            query: MANAGE_CUSTOM_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MUTATION,
            variables: {
              input: {
                customFieldId: 'cf-123',
                customFieldOptionId: 'option-456',
                timeAgainstAssignments: {
                  timeAgainstToAssign: [{ customerId: 'customer-1' }],
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
        () => useManageCustomFieldOptionTimeAgainstAssignment(),
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
              timeAgainstAssignments: {
                timeAgainstToAssign: [{ customerId: 'customer-1' }],
              },
            },
          },
        });
      });

      expect(getCustomerInteractionPropagationHeaders).toHaveBeenCalledWith(
        sandbox,
        TimeCustomerInteraction.CUSTOM_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MANAGE,
      );

      await waitForNextUpdate();
    });
  });
});
