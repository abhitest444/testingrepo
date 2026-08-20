import { useSandbox, useIntl } from '@payroll/quicksand';
import { ApolloError } from '@apollo/client';
import {
  useManageCustomFieldAssignmentMutation,
  ManageCustomFieldAssignmentMutation,
  TimeTracking_ManageCustomFieldAssignmentInput,
  ManageCustomFieldAssignmentMutation_timeTrackingManageCustomFieldAssignment_TimeTracking_PartialCustomFieldAssignmentPayload,
  ManageCustomFieldAssignmentMutation_timeTrackingManageCustomFieldAssignment_TimeTracking_ManageCustomFieldAssignmentError,
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

export interface UseManageCustomFieldAssignmentArgs {
  onSuccess?: () => void;
  onPartialSuccess?: (errorInfo: PartialSuccessErrorInfo) => void;
  onError?: (error: string) => void;
}

/**
 * Helper function to process assignment results (assign or unassign)
 */
const processResults = (
  results: any[] | null | undefined,
  intl: any,
  metrics: {
    successCount: number;
    failedCustomers: string[];
    errorMessages: string[];
  },
) => {
  if (!results) return;

  results.forEach((result) => {
    if (result.__typename === 'TimeTracking_AssignedCustomer') {
      metrics.successCount += 1;
    } else if (result.__typename === 'TimeTracking_AssignmentItemError') {
      if (result.element) {
        metrics.failedCustomers.push(result.element);
      }
      metrics.errorMessages.push(
        result.message ||
          intl.formatMessage({
            id: 'assignments.genericError',
          }),
      );
    }
  });
};

/**
 * Helper function to calculate partial success metrics
 */
const calculatePartialSuccessMetrics = (
  responseData: ManageCustomFieldAssignmentMutation_timeTrackingManageCustomFieldAssignment_TimeTracking_PartialCustomFieldAssignmentPayload,
  intl: any,
): PartialSuccessErrorInfo => {
  const metrics = {
    successCount: 0,
    failedCustomers: [] as string[],
    errorMessages: [] as string[],
  };

  // Process both assign and unassign results using the same logic
  processResults(responseData.assignResults, intl, metrics);
  processResults(responseData.unassignResults, intl, metrics);

  return metrics;
};

/**
 * Hook to manage custom field assignments for customers
 *
 * This mutation allows you to:
 * - Assign/unassign customers/projects to/from a custom field
 * - Support assignToAll flag to assign all customers
 *
 * @example
 * const [manageCustomFieldAssignment, { loading }] = useManageCustomFieldAssignment({
 *   onSuccess: () => console.log('Success'),
 *   onError: (err) => console.error(err),
 * });
 *
 * // Assign customers to a custom field
 * manageCustomFieldAssignment({
 *   variables: {
 *     input: {
 *       customFieldId: 'cf-123',
 *       timeAgainstAssignments: {
 *         timeAgainstToAssign: [{ customerId: 'customer-123' }],
 *       },
 *     },
 *   },
 * });
 */
export const useManageCustomFieldAssignment = ({
  onSuccess,
  onPartialSuccess,
  onError,
}: UseManageCustomFieldAssignmentArgs = {}) => {
  const sandbox = useSandbox();
  const intl = useIntl();

  // Use OIGQL Apollo client which includes __typename
  const oigqlClient = getApolloClientInstance(sandbox);

  const handleSuccess = () => {
    sandbox.logger.info(
      'Component=useManageCustomFieldAssignment Event=Successfully managed custom field assignments',
    );
    endInteractionWithSuccess(
      sandbox,
      TimeCustomerInteraction.CUSTOM_FIELD_ASSIGNMENT_MANAGE,
    );
    onSuccess?.();
  };

  const handlePartialSuccess = (
    payload: ManageCustomFieldAssignmentMutation_timeTrackingManageCustomFieldAssignment_TimeTracking_PartialCustomFieldAssignmentPayload,
  ) => {
    sandbox.logger.info(
      'Component=useManageCustomFieldAssignment Event=Partial success managing custom field assignments',
      { payload: JSON.stringify(payload) },
    );
    endInteractionWithSuccess(
      sandbox,
      TimeCustomerInteraction.CUSTOM_FIELD_ASSIGNMENT_MANAGE,
    );

    const metrics = calculatePartialSuccessMetrics(payload, intl);
    onPartialSuccess?.(metrics);
  };

  const handleError = (errorMessage: string, error?: unknown) => {
    sandbox.logger.error(
      `Component=useManageCustomFieldAssignment Event=Error managing custom field assignments: ${errorMessage}`,
      { error },
    );
    endInteractionWithFailure(
      sandbox,
      TimeCustomerInteraction.CUSTOM_FIELD_ASSIGNMENT_MANAGE,
      errorMessage,
    );
    onError?.(errorMessage);
  };

  const handleCompleted = (
    result: ManageCustomFieldAssignmentMutation,
    input: TimeTracking_ManageCustomFieldAssignmentInput,
  ) => {
    const response = result.timeTrackingManageCustomFieldAssignment;

    if (!response) {
      handleError(
        intl.formatMessage({
          id: 'assignments.genericError',
        }),
      );
      return;
    }

    switch (response.__typename) {
      case 'TimeTracking_ManageCustomFieldAssignmentPayload':
        handleSuccess();
        break;

      case 'TimeTracking_PartialCustomFieldAssignmentPayload':
        handlePartialSuccess(
          response as ManageCustomFieldAssignmentMutation_timeTrackingManageCustomFieldAssignment_TimeTracking_PartialCustomFieldAssignmentPayload,
        );
        break;

      case 'TimeTracking_ManageCustomFieldAssignmentError': {
        const errorResponse =
          response as ManageCustomFieldAssignmentMutation_timeTrackingManageCustomFieldAssignment_TimeTracking_ManageCustomFieldAssignmentError;
        const errorMessage =
          errorResponse.message ||
          intl.formatMessage({
            id: 'assignments.genericError',
          });
        sandbox.logger.error(
          'Component=useManageCustomFieldAssignment Event=Full error response',
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
    useManageCustomFieldAssignmentMutation(
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
              clientName: ApolloClientNames.OIGQL,
            },
            onCompleted: (result, options) => {
              handleCompleted(result, options?.variables?.input);
            },
            onError: handleApolloError,
          },
    );

  // Wrap the mutation function to create CustomerInteraction before execution
  const wrappedMutationFunction: typeof mutationFunction = (
    options?: Parameters<typeof mutationFunction>[0],
  ) => {
    createCustomerInteraction(
      sandbox,
      TimeCustomerInteraction.CUSTOM_FIELD_ASSIGNMENT_MANAGE,
    );

    if (options) {
      const mutationOptions = {
        ...options,
        context: {
          ...options.context,
          clientName: options.context?.clientName || ApolloClientNames.OIGQL,
          headers: {
            ...options.context?.headers,
            ...getCustomerInteractionPropagationHeaders(
              sandbox,
              TimeCustomerInteraction.CUSTOM_FIELD_ASSIGNMENT_MANAGE,
            ),
          },
        },
      };
      return mutationFunction(mutationOptions);
    }

    return mutationFunction();
  };

  return [wrappedMutationFunction, mutationResult] as [
    typeof mutationFunction,
    typeof mutationResult,
  ];
};
