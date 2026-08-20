import { useSandbox, useIntl } from '@payroll/quicksand';
import { ApolloError } from '@apollo/client';
import {
  useManageTimeAgainstFieldAssignmentMutation,
  ManageTimeAgainstFieldAssignmentMutation,
  TimeTracking_ManageTimeAgainstFieldAssignmentInput,
  ManageTimeAgainstFieldAssignmentMutation_timeTrackingManageTimeAgainstFieldAssignment_TimeTracking_PartialTimeAgainstFieldAssignmentPayload,
  ManageTimeAgainstFieldAssignmentMutation_timeTrackingManageTimeAgainstFieldAssignment_TimeTracking_ManageTimeAgainstFieldAssignmentError,
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
  failedFields: string[];
  errorMessages: string[];
}

export interface UseManageTimeAgainstFieldAssignmentArgs {
  onSuccess?: () => void;
  onPartialSuccess?: (errorInfo: PartialSuccessErrorInfo) => void;
  onError?: (error: string) => void;
}

/**
 * Helper function to calculate partial success metrics
 */
const calculatePartialSuccessMetrics = (
  responseData: ManageTimeAgainstFieldAssignmentMutation_timeTrackingManageTimeAgainstFieldAssignment_TimeTracking_PartialTimeAgainstFieldAssignmentPayload,
  input: TimeTracking_ManageTimeAgainstFieldAssignmentInput,
  intl: any,
): PartialSuccessErrorInfo => {
  let successCount = 0;
  const errorMessages: string[] = [];

  // Check custom field result
  if (responseData.customFieldResult) {
    if (
      responseData.customFieldResult.__typename ===
      'TimeTracking_ManageTimeAgainstCustomFieldAssignmentPayload'
    ) {
      // Custom fields succeeded
      successCount +=
        input.customFieldAssignments?.customFieldIdsToAssign?.length || 0;
      successCount +=
        input.customFieldAssignments?.customFieldIdsToUnassign?.length || 0;
    } else if (
      responseData.customFieldResult.__typename ===
      'TimeTracking_ManageTimeAgainstCustomFieldAssignmentError'
    ) {
      // Custom fields failed
      errorMessages.push(
        responseData.customFieldResult.message ||
          intl.formatMessage({
            id: 'assignments.genericError',
          }),
      );
    }
  }

  // Check standard field result
  if (responseData.standardFieldResult) {
    if (
      responseData.standardFieldResult.__typename ===
      'TimeTracking_ManageTimeAgainstStandardFieldAssignmentPayload'
    ) {
      // Standard fields succeeded
      successCount +=
        input.standardFieldAssignments?.standardFieldsToAssign?.length || 0;
      successCount +=
        input.standardFieldAssignments?.standardFieldsToUnassign?.length || 0;
    } else if (
      responseData.standardFieldResult.__typename ===
      'TimeTracking_ManageTimeAgainstStandardFieldAssignmentError'
    ) {
      // Standard fields failed
      errorMessages.push(
        responseData.standardFieldResult.message ||
          intl.formatMessage({
            id: 'assignments.genericError',
          }),
      );
    }
  }

  return {
    successCount,
    failedFields: [], // Will be filled by integration component
    errorMessages,
  };
};

/**
 * Hook to manage custom and standard field assignments for a time-against entity (customer/project)
 *
 * This mutation allows you to:
 * - Assign/unassign custom fields to/from a customer or project
 * - Assign/unassign standard fields to/from a customer or project
 * - Perform both operations in a single API call
 *
 * @example
 * const [manageTimeAgainstFieldAssignment, { loading }] = useManageTimeAgainstFieldAssignment({
 *   onSuccess: () => console.log('Success'),
 *   onError: (err) => console.error(err),
 * });
 *
 * // Assign custom fields to a customer
 * manageTimeAgainstFieldAssignment({
 *   variables: {
 *     input: {
 *       timeAgainst: { customerId: 'customer-123' },
 *       customFieldAssignments: {
 *         customFieldIdsToAssign: ['cf-1', 'cf-2'],
 *       },
 *     },
 *   },
 * });
 */
export const useManageTimeAgainstFieldAssignment = ({
  onSuccess,
  onPartialSuccess,
  onError,
}: UseManageTimeAgainstFieldAssignmentArgs = {}) => {
  const sandbox = useSandbox();
  const intl = useIntl();

  // Use OIGQL Apollo client which includes __typename
  const oigqlClient = getApolloClientInstance(sandbox);

  const handleSuccess = () => {
    sandbox.logger.info(
      'Component=useManageTimeAgainstFieldAssignment Event=Successfully managed field assignments',
    );
    endInteractionWithSuccess(
      sandbox,
      TimeCustomerInteraction.TIME_AGAINST_FIELD_ASSIGNMENT_MANAGE,
    );
    onSuccess?.();
  };

  const handlePartialSuccess = (
    payload: ManageTimeAgainstFieldAssignmentMutation_timeTrackingManageTimeAgainstFieldAssignment_TimeTracking_PartialTimeAgainstFieldAssignmentPayload,
    input: TimeTracking_ManageTimeAgainstFieldAssignmentInput,
  ) => {
    sandbox.logger.info(
      'Component=useManageTimeAgainstFieldAssignment Event=Partial success managing field assignments',
      { payload: JSON.stringify(payload) },
    );
    endInteractionWithSuccess(
      sandbox,
      TimeCustomerInteraction.TIME_AGAINST_FIELD_ASSIGNMENT_MANAGE,
    );

    const metrics = calculatePartialSuccessMetrics(payload, input, intl);
    onPartialSuccess?.(metrics);
  };

  const handleError = (errorMessage: string, error?: unknown) => {
    sandbox.logger.error(
      `Component=useManageTimeAgainstFieldAssignment Event=Error managing field assignments: ${errorMessage}`,
      { error },
    );
    endInteractionWithFailure(
      sandbox,
      TimeCustomerInteraction.TIME_AGAINST_FIELD_ASSIGNMENT_MANAGE,
      errorMessage,
    );
    onError?.(errorMessage);
  };

  const handleCompleted = (
    result: ManageTimeAgainstFieldAssignmentMutation,
    input: TimeTracking_ManageTimeAgainstFieldAssignmentInput,
  ) => {
    const response = result.timeTrackingManageTimeAgainstFieldAssignment;

    if (!response) {
      handleError(
        intl.formatMessage({
          id: 'assignments.genericError',
        }),
      );
      return;
    }

    switch (response.__typename) {
      case 'TimeTracking_ManageTimeAgainstFieldAssignmentPayload':
        handleSuccess();
        break;

      case 'TimeTracking_PartialTimeAgainstFieldAssignmentPayload':
        handlePartialSuccess(
          response as ManageTimeAgainstFieldAssignmentMutation_timeTrackingManageTimeAgainstFieldAssignment_TimeTracking_PartialTimeAgainstFieldAssignmentPayload,
          input,
        );
        break;

      case 'TimeTracking_ManageTimeAgainstFieldAssignmentError': {
        const errorResponse =
          response as ManageTimeAgainstFieldAssignmentMutation_timeTrackingManageTimeAgainstFieldAssignment_TimeTracking_ManageTimeAgainstFieldAssignmentError;
        const errorMessage =
          errorResponse.message ||
          intl.formatMessage({
            id: 'assignments.genericError',
          });
        sandbox.logger.error(
          'Component=useManageTimeAgainstFieldAssignment Event=Full error response',
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
    useManageTimeAgainstFieldAssignmentMutation(
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
      TimeCustomerInteraction.TIME_AGAINST_FIELD_ASSIGNMENT_MANAGE,
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
              TimeCustomerInteraction.TIME_AGAINST_FIELD_ASSIGNMENT_MANAGE,
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
