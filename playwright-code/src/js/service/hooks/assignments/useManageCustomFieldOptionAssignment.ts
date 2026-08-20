import { useSandbox, useIntl } from '@payroll/quicksand';
import { ApolloError } from '@apollo/client';
import {
  useManageCustomFieldOptionAssignmentMutation,
  ManageCustomFieldOptionAssignmentMutation,
  TimeTracking_ManageCustomFieldOptionAssignmentInput,
  ManageCustomFieldOptionAssignmentMutation_timeTrackingManageCustomFieldOptionAssignment_TimeTracking_PartialCustomFieldOptionAssignmentPayload,
  ManageCustomFieldOptionAssignmentMutation_timeTrackingManageCustomFieldOptionAssignment_TimeTracking_ManageCustomFieldOptionAssignmentError,
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

export interface UseManageCustomFieldOptionAssignmentArgs {
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
  responseData: ManageCustomFieldOptionAssignmentMutation_timeTrackingManageCustomFieldOptionAssignment_TimeTracking_PartialCustomFieldOptionAssignmentPayload,
  input: TimeTracking_ManageCustomFieldOptionAssignmentInput,
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
 * Hook to manage worker and group assignments for a custom field option
 *
 * This mutation allows you to:
 * - Assign/unassign workers (timeFor) to/from a custom field option
 * - Assign/unassign groups to/from a custom field option
 * - Perform both operations in a single API call
 * - Assign all workers using assignToAll flag
 *
 * @example
 * const [manageCustomFieldOptionAssignment, { loading }] = useManageCustomFieldOptionAssignment({
 *   onSuccess: () => console.log('Success'),
 *   onError: (err) => console.error(err),
 * });
 *
 * // Assign workers to a custom field option
 * manageCustomFieldOptionAssignment({
 *   variables: {
 *     input: {
 *       customFieldId: 'field-123',
 *       customFieldOptionId: 'option-456',
 *       timeForAssignments: {
 *         timeForToAssign: [{ id: 'worker-1' }, { id: 'worker-2' }],
 *       },
 *     },
 *   },
 * });
 */
export const useManageCustomFieldOptionAssignment = ({
  onSuccess,
  onPartialSuccess,
  onError,
}: UseManageCustomFieldOptionAssignmentArgs = {}) => {
  const sandbox = useSandbox();
  const intl = useIntl();

  // Use OIGQL Apollo client which includes __typename
  const oigqlClient = getApolloClientInstance(sandbox);

  const handleSuccess = () => {
    sandbox.logger.info(
      'Component=useManageCustomFieldOptionAssignment Event=Successfully managed custom field option assignments',
    );
    endInteractionWithSuccess(
      sandbox,
      TimeCustomerInteraction.CUSTOM_FIELD_OPTION_ASSIGNMENT_MANAGE,
    );
    onSuccess?.();
  };

  const handlePartialSuccess = (
    payload: ManageCustomFieldOptionAssignmentMutation_timeTrackingManageCustomFieldOptionAssignment_TimeTracking_PartialCustomFieldOptionAssignmentPayload,
    input: TimeTracking_ManageCustomFieldOptionAssignmentInput,
  ) => {
    sandbox.logger.info(
      'Component=useManageCustomFieldOptionAssignment Event=Partial success managing custom field option assignments',
      { payload: JSON.stringify(payload) },
    );
    endInteractionWithSuccess(
      sandbox,
      TimeCustomerInteraction.CUSTOM_FIELD_OPTION_ASSIGNMENT_MANAGE,
    );

    const metrics = calculatePartialSuccessMetrics(payload, input, intl);
    onPartialSuccess?.(metrics);
  };

  const handleError = (errorMessage: string, error?: unknown) => {
    sandbox.logger.error(
      `Component=useManageCustomFieldOptionAssignment Event=Error managing custom field option assignments: ${errorMessage}`,
      { error },
    );
    endInteractionWithFailure(
      sandbox,
      TimeCustomerInteraction.CUSTOM_FIELD_OPTION_ASSIGNMENT_MANAGE,
      errorMessage,
    );
    onError?.(errorMessage);
  };

  const handleCompleted = (
    result: ManageCustomFieldOptionAssignmentMutation,
    input: TimeTracking_ManageCustomFieldOptionAssignmentInput,
  ) => {
    const response = result.timeTrackingManageCustomFieldOptionAssignment;

    if (!response) {
      handleError(
        intl.formatMessage({
          id: 'assignments.genericError',
        }),
      );
      return;
    }

    switch (response.__typename) {
      case 'TimeTracking_ManageCustomFieldOptionAssignmentPayload':
        handleSuccess();
        break;

      case 'TimeTracking_PartialCustomFieldOptionAssignmentPayload':
        handlePartialSuccess(
          response as ManageCustomFieldOptionAssignmentMutation_timeTrackingManageCustomFieldOptionAssignment_TimeTracking_PartialCustomFieldOptionAssignmentPayload,
          input,
        );
        break;

      case 'TimeTracking_ManageCustomFieldOptionAssignmentError': {
        const errorResponse =
          response as ManageCustomFieldOptionAssignmentMutation_timeTrackingManageCustomFieldOptionAssignment_TimeTracking_ManageCustomFieldOptionAssignmentError;
        const errorMessage =
          errorResponse.message ||
          intl.formatMessage({
            id: 'assignments.genericError',
          });
        sandbox.logger.error(
          'Component=useManageCustomFieldOptionAssignment Event=Full error response',
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
    useManageCustomFieldOptionAssignmentMutation(
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
      TimeCustomerInteraction.CUSTOM_FIELD_OPTION_ASSIGNMENT_MANAGE,
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
              TimeCustomerInteraction.CUSTOM_FIELD_OPTION_ASSIGNMENT_MANAGE,
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
