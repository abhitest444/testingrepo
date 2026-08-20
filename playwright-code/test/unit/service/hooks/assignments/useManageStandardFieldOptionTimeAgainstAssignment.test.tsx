import { renderHook, act } from '@testing-library/react-hooks';
import { MockedProvider } from '@apollo/client/testing';
import React from 'react';
import { MockQuicksandProvider } from '@payroll/quicksand';
import {
  useManageStandardFieldOptionTimeAgainstAssignment,
  PartialSuccessErrorInfo,
} from 'src/js/service/hooks/assignments/useManageStandardFieldOptionTimeAgainstAssignment';
import { MANAGE_STANDARD_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MUTATION } from 'src/js/service/queries/timeTrackingAssignmentQueries';
import { getDefaultSandbox } from 'test/unit/testUtils';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';

// Mock getApolloClientInstance to return undefined so tests use MockedProvider's client
jest.mock('src/js/service/ApolloClientBuilder', () => ({
  getApolloClientInstance: jest.fn(() => undefined),
}));

jest.mock('src/js/common/CustomerInteraction', () => ({
  ...jest.requireActual('src/js/common/CustomerInteraction'),
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn(() => ({
    'x-customer-interaction-id': 'test-interaction-id',
  })),
}));

describe('useManageStandardFieldOptionTimeAgainstAssignment', () => {
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

  it('should return mutation function and loading state', () => {
    const { result } = renderHook(
      () => useManageStandardFieldOptionTimeAgainstAssignment(),
      { wrapper: createWrapper([]) },
    );

    const [mutationFn, { loading }] = result.current;

    expect(mutationFn).toBeDefined();
    expect(typeof mutationFn).toBe('function');
    expect(loading).toBe(false);
  });

  it('should call onSuccess callback on successful mutation', async () => {
    const onSuccess = jest.fn();
    const input = {
      standardFieldLabel: 'CLASS',
      standardFieldOptionId: 'option-123',
      timeAgainstAssignments: {
        timeAgainstToAssign: [{ customerId: 'customer-1' }],
      },
    };

    const mocks = [
      {
        request: {
          query: MANAGE_STANDARD_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MUTATION,
          variables: { input },
        },
        result: {
          data: {
            timeTrackingManageStandardFieldOptionTimeAgainstAssignment: {
              __typename:
                'TimeTracking_ManageStandardFieldOptionTimeAgainstAssignmentPayload',
              successCode: 'SUCCESS',
            },
          },
        },
      },
    ];

    const { result, waitForNextUpdate } = renderHook(
      () => useManageStandardFieldOptionTimeAgainstAssignment({ onSuccess }),
      { wrapper: createWrapper(mocks) },
    );

    const [mutationFn] = result.current;

    act(() => {
      mutationFn({ variables: { input } });
    });

    await waitForNextUpdate();

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(endInteractionWithSuccess).toHaveBeenCalled();
  });

  it('should call onPartialSuccess callback with metrics on partial success', async () => {
    const onPartialSuccess = jest.fn();
    const input = {
      standardFieldLabel: 'CLASS',
      standardFieldOptionId: 'option-123',
      timeAgainstAssignments: {
        timeAgainstToAssign: [
          { customerId: 'customer-1' },
          { customerId: 'customer-2' },
          { customerId: 'customer-3' },
        ],
      },
    };

    const mocks = [
      {
        request: {
          query: MANAGE_STANDARD_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MUTATION,
          variables: { input },
        },
        result: {
          data: {
            timeTrackingManageStandardFieldOptionTimeAgainstAssignment: {
              __typename:
                'TimeTracking_PartialStandardFieldOptionTimeAgainstAssignmentPayload',
              successCode: 'PARTIAL_SUCCESS',
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
                  __typename: 'TimeTracking_AssignmentItemError',
                  element: 'customer-3',
                  message: 'Customer not found',
                },
              ],
              timeAgainstUnassignResults: [],
            },
          },
        },
      },
    ];

    const { result, waitForNextUpdate } = renderHook(
      () =>
        useManageStandardFieldOptionTimeAgainstAssignment({ onPartialSuccess }),
      { wrapper: createWrapper(mocks) },
    );

    const [mutationFn] = result.current;

    act(() => {
      mutationFn({ variables: { input } });
    });

    await waitForNextUpdate();

    expect(onPartialSuccess).toHaveBeenCalledTimes(1);
    const metrics: PartialSuccessErrorInfo = onPartialSuccess.mock.calls[0][0];
    expect(metrics.successCount).toBe(2);
    expect(metrics.failedCustomers).toEqual(['customer-3']);
    expect(metrics.errorMessages).toEqual(['Customer not found']);
    expect(endInteractionWithSuccess).toHaveBeenCalled();
  });

  it('should call onError callback on mutation error', async () => {
    const onError = jest.fn();
    const input = {
      standardFieldLabel: 'CLASS',
      standardFieldOptionId: 'option-123',
      timeAgainstAssignments: {
        timeAgainstToAssign: [{ customerId: 'customer-1' }],
      },
    };

    const mocks = [
      {
        request: {
          query: MANAGE_STANDARD_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MUTATION,
          variables: { input },
        },
        result: {
          data: {
            timeTrackingManageStandardFieldOptionTimeAgainstAssignment: {
              __typename:
                'TimeTracking_ManageStandardFieldOptionTimeAgainstAssignmentError',
              errorCode: 'INVALID_STANDARD_FIELD_LABEL',
              message: 'Invalid standard field label',
            },
          },
        },
      },
    ];

    const { result, waitForNextUpdate } = renderHook(
      () => useManageStandardFieldOptionTimeAgainstAssignment({ onError }),
      { wrapper: createWrapper(mocks) },
    );

    const [mutationFn] = result.current;

    act(() => {
      mutationFn({ variables: { input } });
    });

    await waitForNextUpdate();

    expect(onError).toHaveBeenCalledWith('Invalid standard field label');
    expect(endInteractionWithFailure).toHaveBeenCalled();
  });

  it('should call onError callback on Apollo error', async () => {
    const onError = jest.fn();
    const input = {
      standardFieldLabel: 'CLASS',
      standardFieldOptionId: 'option-123',
      timeAgainstAssignments: {
        timeAgainstToAssign: [{ customerId: 'customer-1' }],
      },
    };

    const mocks = [
      {
        request: {
          query: MANAGE_STANDARD_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MUTATION,
          variables: { input },
        },
        error: new Error('Network error'),
      },
    ];

    const { result, waitForNextUpdate } = renderHook(
      () => useManageStandardFieldOptionTimeAgainstAssignment({ onError }),
      { wrapper: createWrapper(mocks) },
    );

    const [mutationFn] = result.current;

    act(() => {
      mutationFn({ variables: { input } });
    });

    await waitForNextUpdate();

    expect(onError).toHaveBeenCalledWith('Network error');
    expect(endInteractionWithFailure).toHaveBeenCalled();
  });

  it('should handle null response', async () => {
    const onError = jest.fn();
    const input = {
      standardFieldLabel: 'CLASS',
      standardFieldOptionId: 'option-123',
      timeAgainstAssignments: {
        timeAgainstToAssign: [{ customerId: 'customer-1' }],
      },
    };

    const mocks = [
      {
        request: {
          query: MANAGE_STANDARD_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MUTATION,
          variables: { input },
        },
        result: {
          data: {
            timeTrackingManageStandardFieldOptionTimeAgainstAssignment: null,
          },
        },
      },
    ];

    const { result, waitForNextUpdate } = renderHook(
      () => useManageStandardFieldOptionTimeAgainstAssignment({ onError }),
      { wrapper: createWrapper(mocks) },
    );

    const [mutationFn] = result.current;

    act(() => {
      mutationFn({ variables: { input } });
    });

    await waitForNextUpdate();

    expect(onError.mock.calls[0][0]).toContain('assignments.genericError');
    expect(endInteractionWithFailure).toHaveBeenCalled();
  });

  it('should handle both assign and unassign in partial success', async () => {
    const onPartialSuccess = jest.fn();
    const input = {
      standardFieldLabel: 'CLASS',
      standardFieldOptionId: 'option-123',
      timeAgainstAssignments: {
        timeAgainstToAssign: [{ customerId: 'customer-1' }],
        timeAgainstToUnassign: [{ customerId: 'customer-2' }],
      },
    };

    const mocks = [
      {
        request: {
          query: MANAGE_STANDARD_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MUTATION,
          variables: { input },
        },
        result: {
          data: {
            timeTrackingManageStandardFieldOptionTimeAgainstAssignment: {
              __typename:
                'TimeTracking_PartialStandardFieldOptionTimeAgainstAssignmentPayload',
              successCode: 'PARTIAL_SUCCESS',
              timeAgainstAssignResults: [
                {
                  __typename: 'TimeTracking_AssignedCustomer',
                  id: 'customer-1',
                },
              ],
              timeAgainstUnassignResults: [
                {
                  __typename: 'TimeTracking_AssignedCustomer',
                  id: 'customer-2',
                },
              ],
            },
          },
        },
      },
    ];

    const { result, waitForNextUpdate } = renderHook(
      () =>
        useManageStandardFieldOptionTimeAgainstAssignment({ onPartialSuccess }),
      { wrapper: createWrapper(mocks) },
    );

    const [mutationFn] = result.current;

    act(() => {
      mutationFn({ variables: { input } });
    });

    await waitForNextUpdate();

    expect(onPartialSuccess).toHaveBeenCalledTimes(1);
    const metrics: PartialSuccessErrorInfo = onPartialSuccess.mock.calls[0][0];
    expect(metrics.successCount).toBe(2); // 1 assign + 1 unassign
    expect(metrics.failedCustomers).toEqual([]);
  });

  it('should use generic error message when error message is missing', async () => {
    const onPartialSuccess = jest.fn();
    const input = {
      standardFieldLabel: 'CLASS',
      standardFieldOptionId: 'option-123',
      timeAgainstAssignments: {
        timeAgainstToAssign: [{ customerId: 'customer-1' }],
      },
    };

    const mocks = [
      {
        request: {
          query: MANAGE_STANDARD_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MUTATION,
          variables: { input },
        },
        result: {
          data: {
            timeTrackingManageStandardFieldOptionTimeAgainstAssignment: {
              __typename:
                'TimeTracking_PartialStandardFieldOptionTimeAgainstAssignmentPayload',
              successCode: 'PARTIAL_SUCCESS',
              timeAgainstAssignResults: [
                {
                  __typename: 'TimeTracking_AssignmentItemError',
                  element: 'customer-1',
                  message: null,
                },
              ],
              timeAgainstUnassignResults: [],
            },
          },
        },
      },
    ];

    const { result, waitForNextUpdate } = renderHook(
      () =>
        useManageStandardFieldOptionTimeAgainstAssignment({ onPartialSuccess }),
      { wrapper: createWrapper(mocks) },
    );

    const [mutationFn] = result.current;

    act(() => {
      mutationFn({ variables: { input } });
    });

    await waitForNextUpdate();

    expect(onPartialSuccess).toHaveBeenCalledTimes(1);
    const metrics: PartialSuccessErrorInfo = onPartialSuccess.mock.calls[0][0];
    expect(metrics.errorMessages[0]).toContain('assignments.genericError');
  });

  it('should handle error response without message', async () => {
    const onError = jest.fn();
    const input = {
      standardFieldLabel: 'CLASS',
      standardFieldOptionId: 'option-123',
      timeAgainstAssignments: {
        timeAgainstToAssign: [{ customerId: 'customer-1' }],
      },
    };

    const mocks = [
      {
        request: {
          query: MANAGE_STANDARD_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MUTATION,
          variables: { input },
        },
        result: {
          data: {
            timeTrackingManageStandardFieldOptionTimeAgainstAssignment: {
              __typename:
                'TimeTracking_ManageStandardFieldOptionTimeAgainstAssignmentError',
              errorCode: 'INVALID_STANDARD_FIELD_LABEL',
              message: null,
            },
          },
        },
      },
    ];

    const { result, waitForNextUpdate } = renderHook(
      () => useManageStandardFieldOptionTimeAgainstAssignment({ onError }),
      { wrapper: createWrapper(mocks) },
    );

    const [mutationFn] = result.current;

    act(() => {
      mutationFn({ variables: { input } });
    });

    await waitForNextUpdate();

    expect(onError.mock.calls[0][0]).toContain('assignments.genericError');
  });

  describe('CustomerInteraction Integration', () => {
    it('calls createCustomerInteraction before executing mutation', async () => {
      const input = {
        standardFieldLabel: 'CLASS',
        standardFieldOptionId: 'option-123',
        timeAgainstAssignments: {
          timeAgainstToAssign: [{ customerId: 'customer-1' }],
        },
      };

      const mocks = [
        {
          request: {
            query:
              MANAGE_STANDARD_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MUTATION,
            variables: { input },
          },
          result: {
            data: {
              timeTrackingManageStandardFieldOptionTimeAgainstAssignment: {
                __typename:
                  'TimeTracking_ManageStandardFieldOptionTimeAgainstAssignmentPayload',
                successCode: 'SUCCESS',
              },
            },
          },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageStandardFieldOptionTimeAgainstAssignment(),
        { wrapper: createWrapper(mocks) },
      );

      const [mutationFn] = result.current;

      act(() => {
        mutationFn({ variables: { input } });
      });

      expect(createCustomerInteraction).toHaveBeenCalledWith(
        sandbox,
        TimeCustomerInteraction.STANDARD_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MANAGE,
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

      const input = {
        standardFieldLabel: 'CLASS',
        standardFieldOptionId: 'option-123',
        timeAgainstAssignments: {
          timeAgainstToAssign: [{ customerId: 'customer-1' }],
        },
      };

      const mocks = [
        {
          request: {
            query:
              MANAGE_STANDARD_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MUTATION,
            variables: { input },
            context: {
              headers: mockHeaders,
            },
          },
          result: {
            data: {
              timeTrackingManageStandardFieldOptionTimeAgainstAssignment: {
                __typename:
                  'TimeTracking_ManageStandardFieldOptionTimeAgainstAssignmentPayload',
                successCode: 'SUCCESS',
              },
            },
          },
        },
      ];

      const { result, waitForNextUpdate } = renderHook(
        () => useManageStandardFieldOptionTimeAgainstAssignment(),
        { wrapper: createWrapper(mocks) },
      );

      const [mutationFn] = result.current;

      act(() => {
        mutationFn({ variables: { input } });
      });

      expect(getCustomerInteractionPropagationHeaders).toHaveBeenCalledWith(
        sandbox,
        TimeCustomerInteraction.STANDARD_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MANAGE,
      );

      await waitForNextUpdate();
    });
  });
});
