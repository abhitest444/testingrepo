import { renderHook, act } from '@testing-library/react-hooks';
import { MockedProvider } from '@apollo/client/testing';
import React from 'react';
import { MockQuicksandProvider } from '@payroll/quicksand';
import { useManageStandardFieldAssignment } from 'src/js/service/hooks/assignments/useManageStandardFieldAssignment';
import { useManageCustomFieldAssignment } from 'src/js/service/hooks/assignments/useManageCustomFieldAssignment';
import {
  MANAGE_STANDARD_FIELD_ASSIGNMENT_MUTATION,
  MANAGE_CUSTOM_FIELD_ASSIGNMENT_MUTATION,
} from 'src/js/service/queries/timeTrackingAssignmentQueries';
import { getDefaultSandbox } from 'test/unit/testUtils';
import {
  mockStandardManageSuccessResponse,
  mockStandardManagePartialSuccessResponse,
  mockStandardManageErrorResponse,
  mockCustomManageSuccessResponse,
  mockCustomManagePartialSuccessResponse,
  mockCustomManageErrorResponse,
} from 'test/unit/fixtures';
import {
  createCustomerInteraction,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';

// Mock getApolloClientInstance to return undefined so tests use MockedProvider's client
jest.mock('src/js/service/ApolloClientBuilder', () => ({
  getApolloClientInstance: jest.fn(() => undefined),
}));

// Mock CustomerInteraction module — both variants share the same mock shape
jest.mock('src/js/common/CustomerInteraction', () => ({
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn(() => ({
    'x-customer-interaction-id': 'test-interaction-id',
  })),
  TimeCustomerInteraction: {
    STANDARD_FIELD_ASSIGNMENT_MANAGE: 'standard-field-assignment-manage',
    CUSTOM_FIELD_ASSIGNMENT_MANAGE: 'custom-field-assignment-manage',
  },
}));

describe.each([
  {
    label: 'standard field',
    hookFn: useManageStandardFieldAssignment,
    mutation: MANAGE_STANDARD_FIELD_ASSIGNMENT_MUTATION,
    manageFnName: 'manageStandardFieldAssignment',
    successResponseKey: 'timeTrackingManageStandardFieldAssignment',
    ciInteractionKey: TimeCustomerInteraction.STANDARD_FIELD_ASSIGNMENT_MANAGE,
    mockSuccessResponse: mockStandardManageSuccessResponse,
    mockPartialSuccessResponse: mockStandardManagePartialSuccessResponse,
    mockErrorResponse: mockStandardManageErrorResponse,
    // Standard-specific input shape — uses standardFieldLabel
    buildInput: (overrides?: any): any => ({
      standardFieldLabel: 'CLASS',
      timeAgainstAssignments: {
        timeAgainstToAssign: [{ customerId: 'customer-1' }],
      },
      ...overrides,
    }),
  },
  {
    label: 'custom field',
    hookFn: useManageCustomFieldAssignment,
    mutation: MANAGE_CUSTOM_FIELD_ASSIGNMENT_MUTATION,
    manageFnName: 'manageCustomFieldAssignment',
    successResponseKey: 'timeTrackingManageCustomFieldAssignment',
    ciInteractionKey: TimeCustomerInteraction.CUSTOM_FIELD_ASSIGNMENT_MANAGE,
    mockSuccessResponse: mockCustomManageSuccessResponse,
    mockPartialSuccessResponse: mockCustomManagePartialSuccessResponse,
    mockErrorResponse: mockCustomManageErrorResponse,
    // Custom-specific input shape — uses customFieldId
    buildInput: (overrides?: any): any => ({
      customFieldId: 'cf-123',
      timeAgainstAssignments: {
        timeAgainstToAssign: [{ customerId: 'customer-1' }],
      },
      ...overrides,
    }),
  },
])(
  '$label',
  ({
    hookFn,
    mutation,
    successResponseKey,
    ciInteractionKey,
    mockSuccessResponse,
    mockPartialSuccessResponse,
    mockErrorResponse,
    buildInput,
  }) => {
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
      it('returns initial state with manage function', () => {
        const { result } = renderHook(() => (hookFn as any)(), {
          wrapper: createWrapper([]),
        });

        const [mutationFn, mutationState] = result.current as any;

        expect(mutationState.loading).toBe(false);
        expect(mutationState.error).toBeUndefined();
        expect(typeof mutationFn).toBe('function');
      });
    });

    describe('Success Cases', () => {
      it('assigns customers to field successfully', async () => {
        const onSuccess = jest.fn();
        const input = buildInput({
          timeAgainstAssignments: {
            timeAgainstToAssign: [
              { customerId: 'customer-1' },
              { customerId: 'customer-2' },
            ],
          },
        });

        const mocks = [
          {
            request: {
              query: mutation,
              variables: { input },
            },
            result: { data: mockSuccessResponse },
          },
        ];

        const { result, waitForNextUpdate } = renderHook(
          () => (hookFn as any)({ onSuccess }),
          { wrapper: createWrapper(mocks) },
        );

        act(() => {
          (result.current as any)[0]({ variables: { input } });
        });

        await waitForNextUpdate();

        expect(onSuccess).toHaveBeenCalled();
      });

      it('unassigns customers from field successfully', async () => {
        const onSuccess = jest.fn();
        const input = buildInput({
          timeAgainstAssignments: {
            timeAgainstToUnassign: [{ customerId: 'customer-1' }],
          },
        });

        // Build variant-specific unassign success response
        const unassignResponse = {
          [successResponseKey]: {
            ...(mockSuccessResponse as any)[successResponseKey],
            assignedCustomers: [],
            unassignedCustomers: [{ id: 'customer-1' }],
          },
        };

        const mocks = [
          {
            request: {
              query: mutation,
              variables: { input },
            },
            result: { data: unassignResponse },
          },
        ];

        const { result, waitForNextUpdate } = renderHook(
          () => (hookFn as any)({ onSuccess }),
          { wrapper: createWrapper(mocks) },
        );

        act(() => {
          (result.current as any)[0]({ variables: { input } });
        });

        await waitForNextUpdate();

        expect(onSuccess).toHaveBeenCalled();
      });

      it('handles assignToAll flag successfully', async () => {
        const onSuccess = jest.fn();

        // Standard uses standardFieldLabel key; custom uses customFieldId key
        const assignToAllInput =
          successResponseKey === 'timeTrackingManageStandardFieldAssignment'
            ? { standardFieldLabel: 'BILLABLE', assignToAll: true }
            : { customFieldId: 'cf-456', assignToAll: true };

        const assignToAllResponse = {
          [successResponseKey]: {
            ...(mockSuccessResponse as any)[successResponseKey],
            assignToAll: true,
            assignedCustomers: [],
            unassignedCustomers: [],
          },
        };

        const mocks = [
          {
            request: {
              query: mutation,
              variables: { input: assignToAllInput },
            },
            result: { data: assignToAllResponse },
          },
        ];

        const { result, waitForNextUpdate } = renderHook(
          () => (hookFn as any)({ onSuccess }),
          { wrapper: createWrapper(mocks) },
        );

        act(() => {
          (result.current as any)[0]({
            variables: { input: assignToAllInput },
          });
        });

        await waitForNextUpdate();

        expect(onSuccess).toHaveBeenCalled();
      });

      it('handles partial success response', async () => {
        const onPartialSuccess = jest.fn();
        const input = buildInput({
          timeAgainstAssignments: {
            timeAgainstToAssign: [
              { customerId: 'customer-1' },
              { customerId: 'customer-2' },
            ],
          },
        });

        const mocks = [
          {
            request: {
              query: mutation,
              variables: { input },
            },
            result: { data: mockPartialSuccessResponse },
          },
        ];

        const { result, waitForNextUpdate } = renderHook(
          () => (hookFn as any)({ onPartialSuccess }),
          { wrapper: createWrapper(mocks) },
        );

        act(() => {
          (result.current as any)[0]({ variables: { input } });
        });

        await waitForNextUpdate();

        expect(onPartialSuccess).toHaveBeenCalledWith({
          successCount: 1,
          failedCustomers: ['customer-2'],
          errorMessages: ['Customer not found'],
        });
      });

      it('handles projects assignment successfully', async () => {
        const onSuccess = jest.fn();
        const projectInput = buildInput({
          timeAgainstAssignments: {
            timeAgainstToAssign: [{ projectId: 'project-1' }],
          },
        });

        const projectResponse = {
          [successResponseKey]: {
            ...(mockSuccessResponse as any)[successResponseKey],
            assignedCustomers: [{ id: 'project-1' }],
            unassignedCustomers: [],
          },
        };

        const mocks = [
          {
            request: {
              query: mutation,
              variables: { input: projectInput },
            },
            result: { data: projectResponse },
          },
        ];

        const { result, waitForNextUpdate } = renderHook(
          () => (hookFn as any)({ onSuccess }),
          { wrapper: createWrapper(mocks) },
        );

        act(() => {
          (result.current as any)[0]({ variables: { input: projectInput } });
        });

        await waitForNextUpdate();

        expect(onSuccess).toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      it('handles GraphQL error response', async () => {
        const onError = jest.fn();
        const invalidInput =
          successResponseKey === 'timeTrackingManageStandardFieldAssignment'
            ? {
                standardFieldLabel: 'INVALID',
                timeAgainstAssignments: {
                  timeAgainstToAssign: [{ customerId: 'customer-1' }],
                },
              }
            : {
                customFieldId: 'cf-invalid',
                timeAgainstAssignments: {
                  timeAgainstToAssign: [{ customerId: 'customer-1' }],
                },
              };

        const mocks = [
          {
            request: {
              query: mutation,
              variables: { input: invalidInput },
            },
            result: { data: mockErrorResponse },
          },
        ];

        const { result, waitForNextUpdate } = renderHook(
          () => (hookFn as any)({ onError }),
          { wrapper: createWrapper(mocks) },
        );

        act(() => {
          (result.current as any)[0]({ variables: { input: invalidInput } });
        });

        await waitForNextUpdate();

        expect(onError).toHaveBeenCalledWith(
          (mockErrorResponse as any)[successResponseKey].message,
        );
      });

      it('handles network error', async () => {
        const onError = jest.fn();
        const input = buildInput();

        const mocks = [
          {
            request: {
              query: mutation,
              variables: { input },
            },
            error: new Error('Network error'),
          },
        ];

        const { result, waitForNextUpdate } = renderHook(
          () => (hookFn as any)({ onError }),
          { wrapper: createWrapper(mocks) },
        );

        act(() => {
          (result.current as any)[0]({ variables: { input } });
        });

        await waitForNextUpdate();

        expect(onError).toHaveBeenCalled();
      });

      it('handles error without message', async () => {
        const onError = jest.fn();
        const input = buildInput();

        const errorWithoutMessage = {
          [successResponseKey]: {
            __typename: (mockErrorResponse as any)[successResponseKey]
              .__typename,
            errorCode: 'UNKNOWN_ERROR',
            message: null,
            details: null,
            subCode: null,
          },
        };

        const mocks = [
          {
            request: {
              query: mutation,
              variables: { input },
            },
            result: { data: errorWithoutMessage },
          },
        ];

        const { result, waitForNextUpdate } = renderHook(
          () => (hookFn as any)({ onError }),
          { wrapper: createWrapper(mocks) },
        );

        act(() => {
          (result.current as any)[0]({ variables: { input } });
        });

        await waitForNextUpdate();

        expect(onError).toHaveBeenCalled();
        expect(onError.mock.calls[0][0]).toContain('assignments.genericError');
      });

      it('handles null response from server', async () => {
        const onError = jest.fn();
        const input = buildInput();

        const mocks = [
          {
            request: {
              query: mutation,
              variables: { input },
            },
            result: {
              data: { [successResponseKey]: null },
            },
          },
        ];

        const { result, waitForNextUpdate } = renderHook(
          () => (hookFn as any)({ onError }),
          { wrapper: createWrapper(mocks) },
        );

        act(() => {
          (result.current as any)[0]({ variables: { input } });
        });

        await waitForNextUpdate();

        expect(onError).toHaveBeenCalled();
        expect(onError.mock.calls[0][0]).toContain('assignments.genericError');
      });

      it('handles unexpected response typename', async () => {
        const onError = jest.fn();
        const input = buildInput();

        const mocks = [
          {
            request: {
              query: mutation,
              variables: { input },
            },
            result: {
              data: {
                [successResponseKey]: { __typename: 'UnexpectedType' },
              },
            },
          },
        ];

        const { result, waitForNextUpdate } = renderHook(
          () => (hookFn as any)({ onError }),
          { wrapper: createWrapper(mocks) },
        );

        act(() => {
          (result.current as any)[0]({ variables: { input } });
        });

        await waitForNextUpdate();

        expect(onError).toHaveBeenCalled();
        expect(onError.mock.calls[0][0]).toContain('assignments.genericError');
      });

      // Standard-variant-only error cases: these test the result.errors array path
      // which is only covered in standard field's original test suite
      if (successResponseKey === 'timeTrackingManageStandardFieldAssignment') {
        it('handles GraphQL errors in result.errors array', async () => {
          const onError = jest.fn();
          const input = buildInput();

          const mocks = [
            {
              request: {
                query: mutation,
                variables: { input },
              },
              result: {
                data: null,
                errors: [{ message: 'GraphQL validation error' }],
              },
            },
          ];

          const { result, waitForNextUpdate } = renderHook(
            () => (hookFn as any)({ onError }),
            { wrapper: createWrapper(mocks) },
          );

          act(() => {
            (result.current as any)[0]({ variables: { input } });
          });

          await waitForNextUpdate();

          expect(onError).toHaveBeenCalledWith('GraphQL validation error');
        });

        it('handles GraphQL errors without message', async () => {
          const onError = jest.fn();
          const input = buildInput();

          const mocks = [
            {
              request: {
                query: mutation,
                variables: { input },
              },
              result: {
                data: null,
                errors: [{ message: null }],
              },
            },
          ];

          const { result, waitForNextUpdate } = renderHook(
            () => (hookFn as any)({ onError }),
            { wrapper: createWrapper(mocks) },
          );

          act(() => {
            (result.current as any)[0]({ variables: { input } });
          });

          await waitForNextUpdate();

          expect(onError).toHaveBeenCalled();
          const errorArg = onError.mock.calls[0][0];
          expect(errorArg).toBeTruthy();
        });
      }
    });

    describe('Without Callbacks', () => {
      it('works without onSuccess callback', async () => {
        const input = buildInput({
          timeAgainstAssignments: {
            timeAgainstToAssign: [{ customerId: 'customer-1' }],
          },
        });

        const mocks = [
          {
            request: {
              query: mutation,
              variables: { input },
            },
            result: { data: mockSuccessResponse },
          },
        ];

        const { result, waitForNextUpdate } = renderHook(
          () => (hookFn as any)(),
          { wrapper: createWrapper(mocks) },
        );

        act(() => {
          (result.current as any)[0]({ variables: { input } });
        });

        await waitForNextUpdate();

        expect((result.current as any)[1].loading).toBe(false);
      });

      it('works without onError callback', async () => {
        const input = buildInput({
          timeAgainstAssignments: {
            timeAgainstToAssign: [{ customerId: 'customer-1' }],
          },
        });

        const mocks = [
          {
            request: {
              query: mutation,
              variables: { input },
            },
            result: { data: mockErrorResponse },
          },
        ];

        const { result, waitForNextUpdate } = renderHook(
          () => (hookFn as any)(),
          { wrapper: createWrapper(mocks) },
        );

        act(() => {
          (result.current as any)[0]({ variables: { input } });
        });

        await waitForNextUpdate();

        expect((result.current as any)[1].loading).toBe(false);
      });

      it('works without onPartialSuccess callback', async () => {
        const input = buildInput({
          timeAgainstAssignments: {
            timeAgainstToAssign: [
              { customerId: 'customer-1' },
              { customerId: 'customer-2' },
            ],
          },
        });

        const mocks = [
          {
            request: {
              query: mutation,
              variables: { input },
            },
            result: { data: mockPartialSuccessResponse },
          },
        ];

        const { result, waitForNextUpdate } = renderHook(
          () => (hookFn as any)(),
          { wrapper: createWrapper(mocks) },
        );

        act(() => {
          (result.current as any)[0]({ variables: { input } });
        });

        await waitForNextUpdate();

        expect((result.current as any)[1].loading).toBe(false);
      });
    });

    describe('Partial Success Edge Cases', () => {
      it('handles partial success with unassign results', async () => {
        const onPartialSuccess = jest.fn();
        const input = buildInput({
          timeAgainstAssignments: {
            timeAgainstToUnassign: [
              { customerId: 'customer-1' },
              { customerId: 'customer-2' },
            ],
          },
        });

        const partialUnassignResponse = {
          [successResponseKey]: {
            __typename: (mockPartialSuccessResponse as any)[successResponseKey]
              .__typename,
            successCode: 'PARTIAL_SUCCESS',
            assignResults: [],
            unassignResults: [
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
              query: mutation,
              variables: { input },
            },
            result: { data: partialUnassignResponse },
          },
        ];

        const { result, waitForNextUpdate } = renderHook(
          () => (hookFn as any)({ onPartialSuccess }),
          { wrapper: createWrapper(mocks) },
        );

        act(() => {
          (result.current as any)[0]({ variables: { input } });
        });

        await waitForNextUpdate();

        expect(onPartialSuccess).toHaveBeenCalledWith({
          successCount: 1,
          failedCustomers: ['customer-2'],
          errorMessages: ['Customer not found'],
        });
      });

      it('handles partial success with both assign and unassign results', async () => {
        const onPartialSuccess = jest.fn();
        const input = buildInput({
          timeAgainstAssignments: {
            timeAgainstToAssign: [
              { customerId: 'customer-1' },
              { customerId: 'customer-2' },
            ],
            timeAgainstToUnassign: [{ customerId: 'customer-3' }],
          },
        });

        const mixedResponse = {
          [successResponseKey]: {
            __typename: (mockPartialSuccessResponse as any)[successResponseKey]
              .__typename,
            successCode: 'PARTIAL_SUCCESS',
            assignResults: [
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
            unassignResults: [
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
              query: mutation,
              variables: { input },
            },
            result: { data: mixedResponse },
          },
        ];

        const { result, waitForNextUpdate } = renderHook(
          () => (hookFn as any)({ onPartialSuccess }),
          { wrapper: createWrapper(mocks) },
        );

        act(() => {
          (result.current as any)[0]({ variables: { input } });
        });

        await waitForNextUpdate();

        expect(onPartialSuccess).toHaveBeenCalledWith({
          successCount: 2,
          failedCustomers: ['customer-2'],
          errorMessages: ['Invalid customer'],
        });
      });
    });

    describe('CustomerInteraction Integration', () => {
      it('calls createCustomerInteraction before executing mutation', async () => {
        const input = buildInput();

        const mocks = [
          {
            request: {
              query: mutation,
              variables: { input },
            },
            result: { data: mockSuccessResponse },
          },
        ];

        const { result, waitForNextUpdate } = renderHook(
          () => (hookFn as any)(),
          { wrapper: createWrapper(mocks) },
        );

        act(() => {
          (result.current as any)[0]({ variables: { input } });
        });

        expect(createCustomerInteraction).toHaveBeenCalledWith(
          sandbox,
          ciInteractionKey,
        );

        await waitForNextUpdate();
      });

      it('calls getCustomerInteractionPropagationHeaders and adds headers to context', async () => {
        const mockHeaders = {
          'x-customer-interaction-id': 'test-interaction-id',
          'x-customer-interaction-name':
            ciInteractionKey ===
            TimeCustomerInteraction.STANDARD_FIELD_ASSIGNMENT_MANAGE
              ? 'standard-field-assignment-manage'
              : 'custom-field-assignment-manage',
        };

        (getCustomerInteractionPropagationHeaders as jest.Mock).mockReturnValue(
          mockHeaders,
        );

        const input = buildInput();

        const mocks = [
          {
            request: {
              query: mutation,
              variables: { input },
              context: { headers: mockHeaders },
            },
            result: { data: mockSuccessResponse },
          },
        ];

        const { result, waitForNextUpdate } = renderHook(
          () => (hookFn as any)(),
          { wrapper: createWrapper(mocks) },
        );

        act(() => {
          (result.current as any)[0]({ variables: { input } });
        });

        expect(getCustomerInteractionPropagationHeaders).toHaveBeenCalledWith(
          sandbox,
          ciInteractionKey,
        );

        await waitForNextUpdate();
      });

      // Standard-only CustomerInteraction cases
      if (successResponseKey === 'timeTrackingManageStandardFieldAssignment') {
        it('preserves existing context headers when adding CustomerInteraction headers', async () => {
          const existingHeaders = { 'x-existing-header': 'existing-value' };
          const ciHeaders = {
            'x-customer-interaction-id': 'test-interaction-id',
          };

          (
            getCustomerInteractionPropagationHeaders as jest.Mock
          ).mockReturnValue(ciHeaders);

          const input = buildInput();

          const mocks = [
            {
              request: {
                query: mutation,
                variables: { input },
                context: {
                  headers: { ...existingHeaders, ...ciHeaders },
                },
              },
              result: { data: mockSuccessResponse },
            },
          ];

          const { result, waitForNextUpdate } = renderHook(
            () => (hookFn as any)(),
            { wrapper: createWrapper(mocks) },
          );

          act(() => {
            (result.current as any)[0]({
              variables: { input },
              context: { headers: existingHeaders },
            });
          });

          await waitForNextUpdate();

          expect(getCustomerInteractionPropagationHeaders).toHaveBeenCalled();
        });

        it('calls createCustomerInteraction even when mutation fails', async () => {
          const input = buildInput();

          const mocks = [
            {
              request: {
                query: mutation,
                variables: { input },
              },
              result: { data: mockErrorResponse },
            },
          ];

          const { result, waitForNextUpdate } = renderHook(
            () => (hookFn as any)(),
            { wrapper: createWrapper(mocks) },
          );

          act(() => {
            (result.current as any)[0]({ variables: { input } });
          });

          expect(createCustomerInteraction).toHaveBeenCalledWith(
            sandbox,
            ciInteractionKey,
          );

          await waitForNextUpdate();
        });
      }
    });
  },
);
