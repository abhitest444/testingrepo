import { useSandbox, useIntl } from '@payroll/quicksand';
import { ApolloError } from '@apollo/client';
import {
  useManageStandardFieldAssignmentMutation,
  ManageStandardFieldAssignmentMutation,
  TimeTracking_ManageStandardFieldAssignmentInput,
  ManageStandardFieldAssignmentMutation_timeTrackingManageStandardFieldAssignment_TimeTracking_PartialStandardFieldAssignmentPayload,
  ManageStandardFieldAssignmentMutation_timeTrackingManageStandardFieldAssignment_TimeTracking_ManageStandardFieldAssignmentError,
} from 'src/__generated__/timeTracking/graphql';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import { getApolloClientInstance } from 'src/js/service/ApolloClientBuilder';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';

export interface PartialSuccessErrorInfo {
  successCount: number;
  failedCustomers: string[];
  errorMessages: string[];
}

export interface UseManageStandardFieldAssignmentArgs {
  onSuccess?: () => void;
  onPartialSuccess?: (errorInfo: PartialSuccessErrorInfo) => void;
  onError?: (error: string) => void;
}

/**
 * Helper function to calculate partial success metrics
 */
const calculatePartialSuccessMetrics = (
  responseData: ManageStandardFieldAssignmentMutation_timeTrackingManageStandardFieldAssignment_TimeTracking_PartialStandardFieldAssignmentPayload,
  intl: any,
): PartialSuccessErrorInfo => {
  let successCount = 0;
  const failedCustomers: string[] = [];
  const errorMessages: string[] = [];

  // Process assign results
  if (responseData.assignResults) {
    responseData.assignResults.forEach((result) => {
      if (result.__typename === 'TimeTracking_AssignedCustomer') {
        successCount += 1;
      } else if (result.__typename === 'TimeTracking_AssignmentItemError') {
        if (result.element) {
          failedCustomers.push(result.element);
        }
        errorMessages.push(
          result.message ||
            intl.formatMessage({
              id: 'assignments.genericError',
            }),
        );
      }
    });
  }

  // Process unassign results
  if (responseData.unassignResults) {
    responseData.unassignResults.forEach((result) => {
      if (result.__typename === 'TimeTracking_AssignedCustomer') {
        successCount += 1;
      } else if (result.__typename === 'TimeTracking_AssignmentItemError') {
        if (result.element) {
          failedCustomers.push(result.element);
        }
        errorMessages.push(
          result.message ||
            intl.formatMessage({
              id: 'assignments.genericError',
            }),
        );
      }
    });
  }

  return {
    successCount,
    failedCustomers,
    errorMessages,
  };
};

/**
 * Hook to manage standard field assignments for customers
 *
 * This mutation allows you to:
 * - Assign/unassign customers/projects to/from a standard field
 * - Support assignToAll flag to assign all customers
 *
 * @example
 * const [manageStandardFieldAssignment, { loading }] = useManageStandardFieldAssignment({
 *   onSuccess: () => console.log('Success'),
 *   onError: (err) => console.error(err),
 * });
 *
 * // Assign customers to a standard field
 * manageStandardFieldAssignment({
 *   variables: {
 *     input: {
 *       standardFieldLabel: 'CLASS',
 *       timeAgainstAssignments: {
 *         timeAgainstToAssign: [{ customerId: 'customer-123' }],
 *       },
 *     },
 *   },
 * });
 */
export const useManageStandardFieldAssignment = ({
  onSuccess,
  onPartialSuccess,
  onError,
}: UseManageStandardFieldAssignmentArgs = {}) => {
  const sandbox = useSandbox();
  const intl = useIntl();

  // Use OIGQL Apollo client which includes __typename
  const oigqlClient = getApolloClientInstance(sandbox);

  // Customer Interaction marked as success when the mutation is successful and onSuccess is called
  const handleSuccess = () => {
    sandbox.logger.info(
      'Component=useManageStandardFieldAssignment Event=Successfully managed standard field assignments',
    );
    endInteractionWithSuccess(
      sandbox,
      TimeCustomerInteraction.STANDARD_FIELD_ASSIGNMENT_MANAGE,
    );
    onSuccess?.();
  };

  // Customer Interaction marked as success when the mutation is successful and onPartialSuccess is called
  const handlePartialSuccess = (
    payload: ManageStandardFieldAssignmentMutation_timeTrackingManageStandardFieldAssignment_TimeTracking_PartialStandardFieldAssignmentPayload,
  ) => {
    sandbox.logger.info(
      'Component=useManageStandardFieldAssignment Event=Partial success managing standard field assignments',
      { payload: JSON.stringify(payload) },
    );
    endInteractionWithSuccess(
      sandbox,
      TimeCustomerInteraction.STANDARD_FIELD_ASSIGNMENT_MANAGE,
    );

    const metrics = calculatePartialSuccessMetrics(payload, intl);
    onPartialSuccess?.(metrics);
  };

  // Customer Interaction marked as failure when the mutation is unsuccessful and onError is called
  const handleError = (errorMessage: string, error?: unknown) => {
    sandbox.logger.error(
      `Component=useManageStandardFieldAssignment Event=Error managing standard field assignments: ${errorMessage}`,
      { error },
    );
    endInteractionWithFailure(
      sandbox,
      TimeCustomerInteraction.STANDARD_FIELD_ASSIGNMENT_MANAGE,
      errorMessage,
    );
    onError?.(errorMessage);
  };

  const handleCompleted = (
    result: ManageStandardFieldAssignmentMutation,
    input: TimeTracking_ManageStandardFieldAssignmentInput,
  ) => {
    const response = result.timeTrackingManageStandardFieldAssignment;

    if (!response) {
      handleError(
        intl.formatMessage({
          id: 'assignments.genericError',
        }),
      );
      return;
    }

    switch (response.__typename) {
      case 'TimeTracking_ManageStandardFieldAssignmentPayload':
        handleSuccess();
        break;

      case 'TimeTracking_PartialStandardFieldAssignmentPayload':
        handlePartialSuccess(
          response as ManageStandardFieldAssignmentMutation_timeTrackingManageStandardFieldAssignment_TimeTracking_PartialStandardFieldAssignmentPayload,
        );
        break;

      case 'TimeTracking_ManageStandardFieldAssignmentError': {
        const errorResponse =
          response as ManageStandardFieldAssignmentMutation_timeTrackingManageStandardFieldAssignment_TimeTracking_ManageStandardFieldAssignmentError;
        const errorMessage =
          errorResponse.message ||
          intl.formatMessage({
            id: 'assignments.genericError',
          });
        sandbox.logger.error(
          'Component=useManageStandardFieldAssignment Event=Full error response',
          { errorResponse: JSON.stringify(errorResponse) },
        );
        handleError(errorMessage);
        break;
      }

      default:
        handleError(
          intl.formatMessage({
            id: 'assignments.genericError',
          }),
        );
    }
  };

  const handleApolloError = (error: ApolloError) => {
    handleError(
      error.message ||
        intl.formatMessage({
          id: 'assignments.genericError',
        }),
      error,
    );
  };

  const [mutationFunction, mutationResult] =
    useManageStandardFieldAssignmentMutation(
      oigqlClient
        ? {
            client: oigqlClient,
            onCompleted: (result, options) => {
              handleCompleted(result, options?.variables?.input);
            },
            onError: handleApolloError,
          }
        : {
            context: {
              clientName: ApolloClientNames.TIME_TRACKING,
            },
            onCompleted: (result, options) => {
              handleCompleted(result, options?.variables?.input);
            },
            onError: handleApolloError,
          },
    );

  // Wrap the mutation function to create CustomerInteraction before execution
  // This matches the pattern used in query hooks like useStandardFieldAssignments
  // The wrapper preserves the exact signature and return type of the original mutation function
  const wrappedMutationFunction: typeof mutationFunction = (
    options?: Parameters<typeof mutationFunction>[0],
  ) => {
    // Create CustomerInteraction before executing the mutation
    // (Same pattern as loadStandardFieldAssignments in useStandardFieldAssignments)
    createCustomerInteraction(
      sandbox,
      TimeCustomerInteraction.STANDARD_FIELD_ASSIGNMENT_MANAGE,
    );

    // Add CustomerInteraction headers to context if options provided
    // (Same pattern as useStandardFieldAssignments line 107-110)
    if (options) {
      const mutationOptions = {
        ...options,
        context: {
          ...options.context,
          clientName:
            options.context?.clientName || ApolloClientNames.TIME_TRACKING,
          headers: {
            ...options.context?.headers,
            ...getCustomerInteractionPropagationHeaders(
              sandbox,
              TimeCustomerInteraction.STANDARD_FIELD_ASSIGNMENT_MANAGE,
            ),
          },
        },
      };
      return mutationFunction(mutationOptions);
    }

    // If no options provided, call mutation function as-is
    return mutationFunction();
  };

  return [wrappedMutationFunction, mutationResult] as [
    typeof mutationFunction,
    typeof mutationResult,
  ];
};
