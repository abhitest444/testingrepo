import { useSandbox, useIntl } from '@payroll/quicksand';
import { ApolloError } from '@apollo/client';
import {
  useManageTimeAgainstTimeForAssignmentMutation,
  ManageTimeAgainstTimeForAssignmentMutation,
  TimeTracking_ManageTimeAgainstTimeForAssignmentInput,
  ManageTimeAgainstTimeForAssignmentMutation_timeTrackingManageTimeAgainstTimeForAssignment_TimeTracking_PartialTimeAgainstTimeForAssignmentPayload,
  ManageTimeAgainstTimeForAssignmentMutation_timeTrackingManageTimeAgainstTimeForAssignment_TimeTracking_ManageTimeAgainstTimeForAssignmentError,
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
  workers: {
    successCount: number;
    failed: string[];
    errorMessages: string[];
  };
  groups: {
    successCount: number;
    failed: string[];
    errorMessages: string[];
  };
}

export interface UseManageTimeAgainstTimeForAssignmentArgs {
  onSuccess?: () => void;
  onPartialSuccess?: (errorInfo: PartialSuccessErrorInfo) => void;
  onError?: (error: string) => void;
}

/**
 * Helper function to process assignment results
 */
const processAssignmentResults = (
  results: any[] | null | undefined,
  successTypename: string,
  failedElements: string[],
  errorMessages: string[],
): number => {
  let successCount = 0;

  if (results) {
    results.forEach((result) => {
      if (result.__typename === successTypename) {
        successCount += 1;
      } else if (result.__typename === 'TimeTracking_AssignmentItemError') {
        if (result.element) {
          failedElements.push(result.element);
        }
        if (result.message) {
          errorMessages.push(result.message);
        }
      }
    });
  }

  return successCount;
};

/**
 * Helper function to calculate partial success metrics
 */
const calculatePartialSuccessMetrics = (
  responseData: ManageTimeAgainstTimeForAssignmentMutation_timeTrackingManageTimeAgainstTimeForAssignment_TimeTracking_PartialTimeAgainstTimeForAssignmentPayload,
  input: TimeTracking_ManageTimeAgainstTimeForAssignmentInput,
  intl: any,
): PartialSuccessErrorInfo => {
  const workerFailedElements: string[] = [];
  const workerErrorMessages: string[] = [];
  const groupFailedElements: string[] = [];
  const groupErrorMessages: string[] = [];

  // Process worker assign and unassign results
  const workerSuccessCount =
    processAssignmentResults(
      responseData.timeForAssignResults,
      'TimeTracking_AssignedWorker',
      workerFailedElements,
      workerErrorMessages,
    ) +
    processAssignmentResults(
      responseData.timeForUnassignResults,
      'TimeTracking_AssignedWorker',
      workerFailedElements,
      workerErrorMessages,
    );

  // Process group assign and unassign results
  const groupSuccessCount =
    processAssignmentResults(
      responseData.groupAssignResults,
      'TimeTracking_AssignedGroup',
      groupFailedElements,
      groupErrorMessages,
    ) +
    processAssignmentResults(
      responseData.groupUnassignResults,
      'TimeTracking_AssignedGroup',
      groupFailedElements,
      groupErrorMessages,
    );

  // Add generic error message if there are failures but no specific messages
  if (workerErrorMessages.length === 0 && workerFailedElements.length > 0) {
    workerErrorMessages.push(
      intl.formatMessage({
        id: 'assignments.genericError',
      }),
    );
  }

  if (groupErrorMessages.length === 0 && groupFailedElements.length > 0) {
    groupErrorMessages.push(
      intl.formatMessage({
        id: 'assignments.genericError',
      }),
    );
  }

  return {
    workers: {
      successCount: workerSuccessCount,
      failed: workerFailedElements,
      errorMessages: workerErrorMessages,
    },
    groups: {
      successCount: groupSuccessCount,
      failed: groupFailedElements,
      errorMessages: groupErrorMessages,
    },
  };
};

/**
 * Hook to manage worker and group assignments for a time-against entity (customer/project)
 *
 * This mutation allows you to:
 * - Assign/unassign workers (timeFor) to/from a customer or project
 * - Assign/unassign groups to/from a customer or project
 * - Perform both operations in a single API call
 * - Assign all workers using assignToAll flag
 *
 * @example
 * const [manageTimeAgainstTimeForAssignment, { loading }] = useManageTimeAgainstTimeForAssignment({
 *   onSuccess: () => console.log('Success'),
 *   onError: (err) => console.error(err),
 * });
 *
 * // Assign workers to a customer
 * manageTimeAgainstTimeForAssignment({
 *   variables: {
 *     input: {
 *       timeAgainst: { customerId: 'customer-123' },
 *       timeForAssignments: {
 *         workerIdsToAssign: ['worker-1', 'worker-2'],
 *       },
 *     },
 *   },
 * });
 */
export const useManageTimeAgainstTimeForAssignment = ({
  onSuccess,
  onPartialSuccess,
  onError,
}: UseManageTimeAgainstTimeForAssignmentArgs = {}) => {
  const sandbox = useSandbox();
  const intl = useIntl();

  // Use OIGQL Apollo client which includes __typename
  const oigqlClient = getApolloClientInstance(sandbox);

  const handleSuccess = () => {
    sandbox.logger.info(
      'Component=useManageTimeAgainstTimeForAssignment Event=Successfully managed timeFor assignments',
    );
    endInteractionWithSuccess(
      sandbox,
      TimeCustomerInteraction.TIME_AGAINST_TIME_FOR_ASSIGNMENT_MANAGE,
    );
    onSuccess?.();
  };

  const handlePartialSuccess = (
    payload: ManageTimeAgainstTimeForAssignmentMutation_timeTrackingManageTimeAgainstTimeForAssignment_TimeTracking_PartialTimeAgainstTimeForAssignmentPayload,
    input: TimeTracking_ManageTimeAgainstTimeForAssignmentInput,
  ) => {
    sandbox.logger.info(
      'Component=useManageTimeAgainstTimeForAssignment Event=Partial success managing timeFor assignments',
      { payload: JSON.stringify(payload) },
    );
    endInteractionWithSuccess(
      sandbox,
      TimeCustomerInteraction.TIME_AGAINST_TIME_FOR_ASSIGNMENT_MANAGE,
    );

    const metrics = calculatePartialSuccessMetrics(payload, input, intl);
    onPartialSuccess?.(metrics);
  };

  const handleError = (errorMessage: string, error?: unknown) => {
    sandbox.logger.error(
      `Component=useManageTimeAgainstTimeForAssignment Event=Error managing timeFor assignments: ${errorMessage}`,
      { error },
    );
    endInteractionWithFailure(
      sandbox,
      TimeCustomerInteraction.TIME_AGAINST_TIME_FOR_ASSIGNMENT_MANAGE,
      errorMessage,
    );
    onError?.(errorMessage);
  };

  const handleCompleted = (
    result: ManageTimeAgainstTimeForAssignmentMutation,
    input: TimeTracking_ManageTimeAgainstTimeForAssignmentInput,
  ) => {
    const response = result.timeTrackingManageTimeAgainstTimeForAssignment;

    if (!response) {
      handleError(
        intl.formatMessage({
          id: 'assignments.genericError',
        }),
      );
      return;
    }

    switch (response.__typename) {
      case 'TimeTracking_ManageTimeAgainstTimeForAssignmentPayload':
        handleSuccess();
        break;

      case 'TimeTracking_PartialTimeAgainstTimeForAssignmentPayload':
        handlePartialSuccess(
          response as ManageTimeAgainstTimeForAssignmentMutation_timeTrackingManageTimeAgainstTimeForAssignment_TimeTracking_PartialTimeAgainstTimeForAssignmentPayload,
          input,
        );
        break;

      case 'TimeTracking_ManageTimeAgainstTimeForAssignmentError': {
        const errorResponse =
          response as ManageTimeAgainstTimeForAssignmentMutation_timeTrackingManageTimeAgainstTimeForAssignment_TimeTracking_ManageTimeAgainstTimeForAssignmentError;
        const errorMessage =
          errorResponse.message ||
          intl.formatMessage({
            id: 'assignments.genericError',
          });
        sandbox.logger.error(
          'Component=useManageTimeAgainstTimeForAssignment Event=Full error response',
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
    useManageTimeAgainstTimeForAssignmentMutation(
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
      TimeCustomerInteraction.TIME_AGAINST_TIME_FOR_ASSIGNMENT_MANAGE,
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
              TimeCustomerInteraction.TIME_AGAINST_TIME_FOR_ASSIGNMENT_MANAGE,
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
