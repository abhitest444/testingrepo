import { useSandbox, useIntl } from '@payroll/quicksand';
import { ApolloError } from '@apollo/client';
import {
  useManageCustomFieldOptionTimeAgainstAssignmentMutation,
  ManageCustomFieldOptionTimeAgainstAssignmentMutation,
  TimeTracking_ManageCustomFieldOptionTimeAgainstAssignmentInput,
  ManageCustomFieldOptionTimeAgainstAssignmentMutation_timeTrackingManageCustomFieldOptionTimeAgainstAssignment_TimeTracking_PartialCustomFieldOptionTimeAgainstAssignmentPayload,
  ManageCustomFieldOptionTimeAgainstAssignmentMutation_timeTrackingManageCustomFieldOptionTimeAgainstAssignment_TimeTracking_ManageCustomFieldOptionTimeAgainstAssignmentError,
  ManageCustomFieldOptionTimeAgainstAssignmentMutation_timeTrackingManageCustomFieldOptionTimeAgainstAssignment_TimeTracking_PartialCustomFieldOptionTimeAgainstAssignmentPayload_timeAgainstAssignResults,
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
import { IntlFormatter } from 'src/js/widgets/common/assignment/assignmentUtils';

export interface PartialSuccessErrorInfo {
  customers: {
    successCount: number;
    failed: string[];
    errorMessages: string[];
  };
}

export interface UseManageCustomFieldOptionTimeAgainstAssignmentArgs {
  onSuccess?: () => void;
  onPartialSuccess?: (errorInfo: PartialSuccessErrorInfo) => void;
  onError?: (error: string) => void;
}

/**
 * Helper function to process assignment results
 */
const processAssignmentResults = (
  results:
    | ManageCustomFieldOptionTimeAgainstAssignmentMutation_timeTrackingManageCustomFieldOptionTimeAgainstAssignment_TimeTracking_PartialCustomFieldOptionTimeAgainstAssignmentPayload_timeAgainstAssignResults[]
    | null
    | undefined,
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
  responseData: ManageCustomFieldOptionTimeAgainstAssignmentMutation_timeTrackingManageCustomFieldOptionTimeAgainstAssignment_TimeTracking_PartialCustomFieldOptionTimeAgainstAssignmentPayload,
  intl: IntlFormatter,
): PartialSuccessErrorInfo => {
  const customerFailedElements: string[] = [];
  const customerErrorMessages: string[] = [];

  // Process customer/project assign and unassign results
  const customerSuccessCount =
    processAssignmentResults(
      responseData.timeAgainstAssignResults,
      'TimeTracking_AssignedCustomer',
      customerFailedElements,
      customerErrorMessages,
    ) +
    processAssignmentResults(
      responseData.timeAgainstUnassignResults,
      'TimeTracking_AssignedCustomer',
      customerFailedElements,
      customerErrorMessages,
    );

  // Add generic error message if there are failures but no specific messages
  if (customerErrorMessages.length === 0 && customerFailedElements.length > 0) {
    customerErrorMessages.push(
      intl.formatMessage({
        id: 'assignments.genericError',
      }),
    );
  }

  return {
    customers: {
      successCount: customerSuccessCount,
      failed: customerFailedElements,
      errorMessages: customerErrorMessages,
    },
  };
};

/**
 * Hook to manage customer/project (time against) assignments for a custom field option
 *
 * This mutation allows you to:
 * - Assign/unassign customers/projects (timeAgainst) to/from a custom field option
 * - Perform both operations in a single API call
 * - Assign all customers using assignToAll flag
 *
 * @example
 * const [manageCustomFieldOptionTimeAgainstAssignment, { loading }] = useManageCustomFieldOptionTimeAgainstAssignment({
 *   onSuccess: () => console.log('Success'),
 *   onError: (err) => console.error(err),
 * });
 *
 * // Assign customers to a custom field option
 * manageCustomFieldOptionTimeAgainstAssignment({
 *   variables: {
 *     input: {
 *       customFieldId: 'field-123',
 *       customFieldOptionId: 'option-456',
 *       timeAgainstAssignments: {
 *         timeAgainstToAssign: [
 *           { customerId: 'customer-1' },
 *           { projectId: 'project-1' }
 *         ],
 *       },
 *     },
 *   },
 * });
 */
export const useManageCustomFieldOptionTimeAgainstAssignment = ({
  onSuccess,
  onPartialSuccess,
  onError,
}: UseManageCustomFieldOptionTimeAgainstAssignmentArgs = {}) => {
  const sandbox = useSandbox();
  const intl = useIntl();

  // Use OIGQL Apollo client which includes __typename
  const oigqlClient = getApolloClientInstance(sandbox);

  const handleSuccess = () => {
    sandbox.logger.info(
      'Component=useManageCustomFieldOptionTimeAgainstAssignment Event=Successfully managed custom field option time against assignments',
    );
    endInteractionWithSuccess(
      sandbox,
      TimeCustomerInteraction.CUSTOM_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MANAGE,
    );
    onSuccess?.();
  };

  const handlePartialSuccess = (
    payload: ManageCustomFieldOptionTimeAgainstAssignmentMutation_timeTrackingManageCustomFieldOptionTimeAgainstAssignment_TimeTracking_PartialCustomFieldOptionTimeAgainstAssignmentPayload,
    input: TimeTracking_ManageCustomFieldOptionTimeAgainstAssignmentInput,
  ) => {
    sandbox.logger.info(
      'Component=useManageCustomFieldOptionTimeAgainstAssignment Event=Partial success managing custom field option time against assignments',
      { payload: JSON.stringify(payload) },
    );
    endInteractionWithSuccess(
      sandbox,
      TimeCustomerInteraction.CUSTOM_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MANAGE,
    );

    const metrics = calculatePartialSuccessMetrics(payload, intl);
    onPartialSuccess?.(metrics);
  };

  const handleError = (errorMessage: string, error?: unknown) => {
    sandbox.logger.error(
      `Component=useManageCustomFieldOptionTimeAgainstAssignment Event=Error managing custom field option time against assignments: ${errorMessage}`,
      { error },
    );
    endInteractionWithFailure(
      sandbox,
      TimeCustomerInteraction.CUSTOM_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MANAGE,
      errorMessage,
    );
    onError?.(errorMessage);
  };

  const handleCompleted = (
    result: ManageCustomFieldOptionTimeAgainstAssignmentMutation,
    input: TimeTracking_ManageCustomFieldOptionTimeAgainstAssignmentInput,
  ) => {
    const response =
      result.timeTrackingManageCustomFieldOptionTimeAgainstAssignment;

    if (!response) {
      handleError(
        intl.formatMessage({
          id: 'assignments.genericError',
        }),
      );
      return;
    }

    switch (response.__typename) {
      case 'TimeTracking_ManageCustomFieldOptionTimeAgainstAssignmentPayload':
        handleSuccess();
        break;

      case 'TimeTracking_PartialCustomFieldOptionTimeAgainstAssignmentPayload':
        handlePartialSuccess(
          response as ManageCustomFieldOptionTimeAgainstAssignmentMutation_timeTrackingManageCustomFieldOptionTimeAgainstAssignment_TimeTracking_PartialCustomFieldOptionTimeAgainstAssignmentPayload,
          input,
        );
        break;

      case 'TimeTracking_ManageCustomFieldOptionTimeAgainstAssignmentError': {
        const errorResponse =
          response as ManageCustomFieldOptionTimeAgainstAssignmentMutation_timeTrackingManageCustomFieldOptionTimeAgainstAssignment_TimeTracking_ManageCustomFieldOptionTimeAgainstAssignmentError;
        const errorMessage =
          errorResponse.message ||
          intl.formatMessage({
            id: 'assignments.genericError',
          });
        sandbox.logger.error(
          'Component=useManageCustomFieldOptionTimeAgainstAssignment Event=Full error response',
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
    useManageCustomFieldOptionTimeAgainstAssignmentMutation(
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
      TimeCustomerInteraction.CUSTOM_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MANAGE,
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
              TimeCustomerInteraction.CUSTOM_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MANAGE,
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
