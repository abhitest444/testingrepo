import { useSandbox, useIntl } from '@payroll/quicksand';
import { ApolloError } from '@apollo/client';
import {
  useManageStandardFieldOptionTimeAgainstAssignmentMutation,
  ManageStandardFieldOptionTimeAgainstAssignmentMutation,
  TimeTracking_ManageStandardFieldOptionTimeAgainstAssignmentInput,
  ManageStandardFieldOptionTimeAgainstAssignmentMutation_timeTrackingManageStandardFieldOptionTimeAgainstAssignment_TimeTracking_PartialStandardFieldOptionTimeAgainstAssignmentPayload,
  ManageStandardFieldOptionTimeAgainstAssignmentMutation_timeTrackingManageStandardFieldOptionTimeAgainstAssignment_TimeTracking_ManageStandardFieldOptionTimeAgainstAssignmentError,
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

export interface UseManageStandardFieldOptionTimeAgainstAssignmentArgs {
  onSuccess?: () => void;
  onPartialSuccess?: (errorInfo: PartialSuccessErrorInfo) => void;
  onError?: (error: string) => void;
}

/**
 * Helper function to calculate partial success metrics
 */
const calculatePartialSuccessMetrics = (
  responseData: ManageStandardFieldOptionTimeAgainstAssignmentMutation_timeTrackingManageStandardFieldOptionTimeAgainstAssignment_TimeTracking_PartialStandardFieldOptionTimeAgainstAssignmentPayload,
  intl: any,
): PartialSuccessErrorInfo => {
  let successCount = 0;
  const failedCustomers: string[] = [];
  const errorMessages: string[] = [];

  // Process assign results
  if (responseData.timeAgainstAssignResults) {
    responseData.timeAgainstAssignResults.forEach((result) => {
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
  if (responseData.timeAgainstUnassignResults) {
    responseData.timeAgainstUnassignResults.forEach((result) => {
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
 * Hook to manage customer/project assignments for a standard field option (e.g., Class, Service Item, Location)
 *
 * This mutation allows you to:
 * - Assign/unassign customers/projects (timeAgainst) to/from a standard field option
 * - Support assignToAll flag to assign all customers
 *
 * @example
 * const [manageStandardFieldOptionTimeAgainstAssignment, { loading }] = useManageStandardFieldOptionTimeAgainstAssignment({
 *   onSuccess: () => console.log('Success'),
 *   onError: (err) => console.error(err),
 * });
 *
 * // Assign customers to a standard field option
 * manageStandardFieldOptionTimeAgainstAssignment({
 *   variables: {
 *     input: {
 *       standardFieldLabel: 'CLASS',
 *       standardFieldOptionId: 'option-123',
 *       timeAgainstAssignments: {
 *         timeAgainstToAssign: [{ customerId: 'customer-1' }],
 *       },
 *     },
 *   },
 * });
 */
export const useManageStandardFieldOptionTimeAgainstAssignment = ({
  onSuccess,
  onPartialSuccess,
  onError,
}: UseManageStandardFieldOptionTimeAgainstAssignmentArgs = {}) => {
  const sandbox = useSandbox();
  const intl = useIntl();

  // Use OIGQL Apollo client which includes __typename
  const oigqlClient = getApolloClientInstance(sandbox);

  const handleSuccess = () => {
    sandbox.logger.info(
      'Component=useManageStandardFieldOptionTimeAgainstAssignment Event=Successfully managed timeAgainst assignments',
    );
    endInteractionWithSuccess(
      sandbox,
      TimeCustomerInteraction.STANDARD_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MANAGE,
    );
    onSuccess?.();
  };

  const handlePartialSuccess = (
    payload: ManageStandardFieldOptionTimeAgainstAssignmentMutation_timeTrackingManageStandardFieldOptionTimeAgainstAssignment_TimeTracking_PartialStandardFieldOptionTimeAgainstAssignmentPayload,
  ) => {
    sandbox.logger.info(
      'Component=useManageStandardFieldOptionTimeAgainstAssignment Event=Partial success managing timeAgainst assignments',
      { payload: JSON.stringify(payload) },
    );
    endInteractionWithSuccess(
      sandbox,
      TimeCustomerInteraction.STANDARD_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MANAGE,
    );

    const metrics = calculatePartialSuccessMetrics(payload, intl);
    onPartialSuccess?.(metrics);
  };

  const handleError = (errorMessage: string, error?: unknown) => {
    sandbox.logger.error(
      `Component=useManageStandardFieldOptionTimeAgainstAssignment Event=Error managing timeAgainst assignments: ${errorMessage}`,
      { error },
    );
    endInteractionWithFailure(
      sandbox,
      TimeCustomerInteraction.STANDARD_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MANAGE,
      errorMessage,
    );
    onError?.(errorMessage);
  };

  const handleCompleted = (
    result: ManageStandardFieldOptionTimeAgainstAssignmentMutation,
    input: TimeTracking_ManageStandardFieldOptionTimeAgainstAssignmentInput,
  ) => {
    const response =
      result.timeTrackingManageStandardFieldOptionTimeAgainstAssignment;

    if (!response) {
      handleError(
        intl.formatMessage({
          id: 'assignments.genericError',
        }),
      );
      return;
    }

    switch (response.__typename) {
      case 'TimeTracking_ManageStandardFieldOptionTimeAgainstAssignmentPayload':
        handleSuccess();
        break;

      case 'TimeTracking_PartialStandardFieldOptionTimeAgainstAssignmentPayload':
        handlePartialSuccess(
          response as ManageStandardFieldOptionTimeAgainstAssignmentMutation_timeTrackingManageStandardFieldOptionTimeAgainstAssignment_TimeTracking_PartialStandardFieldOptionTimeAgainstAssignmentPayload,
        );
        break;

      case 'TimeTracking_ManageStandardFieldOptionTimeAgainstAssignmentError': {
        const errorResponse =
          response as ManageStandardFieldOptionTimeAgainstAssignmentMutation_timeTrackingManageStandardFieldOptionTimeAgainstAssignment_TimeTracking_ManageStandardFieldOptionTimeAgainstAssignmentError;
        const errorMessage =
          errorResponse.message ||
          intl.formatMessage({
            id: 'assignments.genericError',
          });
        sandbox.logger.error(
          'Component=useManageStandardFieldOptionTimeAgainstAssignment Event=Full error response',
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
    useManageStandardFieldOptionTimeAgainstAssignmentMutation(
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
  const wrappedMutationFunction: typeof mutationFunction = (
    options?: Parameters<typeof mutationFunction>[0],
  ) => {
    createCustomerInteraction(
      sandbox,
      TimeCustomerInteraction.STANDARD_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MANAGE,
    );

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
              TimeCustomerInteraction.STANDARD_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MANAGE,
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
