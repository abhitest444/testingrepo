import { useSandbox } from '@payroll/quicksand';
import { ApolloError } from '@apollo/client';
import {
  AssignGroupManagersMutation,
  useAssignGroupManagersMutation,
  AssignGroupManagersMutation_timeTrackingAssignGroupManagers_TimeTracking_AssignGroupManagersPayload_assignmentResults,
  AssignGroupManagersMutation_timeTrackingAssignGroupManagers_TimeTracking_AssignGroupManagersPayload_assignmentResults_TimeTracking_GroupManagerAssignmentError,
  AssignGroupManagersMutation_timeTrackingAssignGroupManagers_TimeTracking_AssignGroupManagersPayload_assignmentResults_TimeTracking_GroupManagerAssignmentSuccess,
} from 'src/__generated__/timeTracking/graphql';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import { TimeCustomerInteraction } from 'src/js/common/CustomerInteraction';
import {
  getErrorCodeForCompleteFailure,
  handleGroupMutationSuccess,
  handleGroupMutationError,
  isErrorResponse,
  mapToFailureOutput,
} from './groupMutationUtils';

/**
 * Type guard for GroupManagerAssignmentError
 * Checks for presence of workerId field (errors have workerId, successes have worker)
 */
function isAssignmentError(
  result: AssignGroupManagersMutation_timeTrackingAssignGroupManagers_TimeTracking_AssignGroupManagersPayload_assignmentResults,
): result is AssignGroupManagersMutation_timeTrackingAssignGroupManagers_TimeTracking_AssignGroupManagersPayload_assignmentResults_TimeTracking_GroupManagerAssignmentError {
  return 'workerId' in result;
}

/**
 * Type guard for GroupManagerAssignmentSuccess
 * Checks for presence of worker field (successes have worker object, errors have workerId)
 */
function isAssignmentSuccess(
  result: AssignGroupManagersMutation_timeTrackingAssignGroupManagers_TimeTracking_AssignGroupManagersPayload_assignmentResults,
): result is AssignGroupManagersMutation_timeTrackingAssignGroupManagers_TimeTracking_AssignGroupManagersPayload_assignmentResults_TimeTracking_GroupManagerAssignmentSuccess {
  return 'worker' in result;
}

/**
 * Individual assignment failure details
 */
export interface ManagerAssignmentFailure {
  /** ID of the worker that failed to be assigned as manager */
  workerId: string;
  /** Error code identifying the failure type */
  errorCode: string | null;
  /** Human-readable error message */
  errorMessage: string | null;
}

/**
 * Result of the assign group managers operation
 */
export interface AssignGroupManagersResult {
  /** Whether the operation was successful */
  success: boolean;
  /** Whether the operation had partial success (some managers assigned, some failed) */
  partialSuccess: boolean;
  /** Number of managers successfully assigned */
  assignedCount: number;
  /** Number of managers that failed to be assigned */
  failedCount: number;
  /** Details of individual assignment failures */
  failures: ManagerAssignmentFailure[];
}

/**
 * Arguments for the useAssignGroupManagers hook
 */
export interface UseAssignGroupManagersArgs {
  /** Callback fired on successful assignment */
  onSuccess: (result: AssignGroupManagersResult) => void;
  /** Callback fired on assignment failure */
  onError: (error: string, errorCode?: string) => void;
}

/**
 * Custom hook for assigning managers to a group
 * Supports bulk operations with partial success reporting
 *
 * Key Business Rules:
 * - A worker can manage MULTIPLE groups simultaneously
 * - Managers do NOT need to be members of the group they manage
 * - Supports bulk operations with individual failure reporting
 *
 * @param args - Success and error callbacks
 * @returns Mutation function with loading and error states
 *
 * @example
 * ```typescript
 * const [assignManagers, { loading }] = useAssignGroupManagers({
 *   onSuccess: (result) => {
 *     if (result.partialSuccess) {
 *       console.log(`Partial: ${result.assignedCount} assigned, ${result.failedCount} failed`);
 *     } else {
 *       console.log(`All ${result.assignedCount} managers assigned!`);
 *     }
 *   },
 *   onError: (error, errorCode) => console.error('Failed:', error, errorCode),
 * });
 *
 * assignManagers({
 *   variables: {
 *     input: {
 *       groupId: 'group-123',
 *       managers: [
 *         { id: 'worker-1', type: 'EMPLOYEE' },
 *         { id: 'worker-2', type: 'VENDOR' },
 *       ],
 *     },
 *   },
 * });
 * ```
 */
export const useAssignGroupManagers = ({
  onSuccess,
  onError,
}: UseAssignGroupManagersArgs) => {
  const sandbox = useSandbox();

  const handleSuccess = (result: AssignGroupManagersResult) => {
    handleGroupMutationSuccess(
      sandbox,
      TimeCustomerInteraction.GROUP_ASSIGN_MANAGERS,
      result,
      {
        partialSuccessEvent:
          'Component=useAssignGroupManagers Event=Partial success assigning managers',
        fullSuccessEvent:
          'Component=useAssignGroupManagers Event=Successfully assigned all managers',
        getLogMeta: (r) =>
          r.partialSuccess
            ? {
                assignedCount: r.assignedCount,
                failedCount: r.failedCount,
                failures: r.failures,
              }
            : { assignedCount: r.assignedCount },
        validationDegradedMessage:
          'Some leads could not be assigned due to validation errors',
        mixedFailureMessage: 'Failed to assign some leads',
      },
      onSuccess,
    );
  };

  const handleError = (
    error: string | ApolloError | undefined,
    errorCode = '',
  ) => {
    handleGroupMutationError(
      sandbox,
      TimeCustomerInteraction.GROUP_ASSIGN_MANAGERS,
      error as string,
      errorCode,
      {
        componentEvent:
          'Component=useAssignGroupManagers Event=Error assigning managers',
      },
      onError,
    );
  };

  const handleApolloError = (error: ApolloError) => {
    handleError(error.message);
  };

  const handleCompleted = (result: AssignGroupManagersMutation) => {
    const response = result.timeTrackingAssignGroupManagers;

    if (!response) {
      handleError('Null Response');
      return;
    }

    // Type guard: Check if response is success payload (has successCode)
    const isPayload = (
      res: any,
    ): res is {
      successCode: string;
      assignmentResults: AssignGroupManagersMutation_timeTrackingAssignGroupManagers_TimeTracking_AssignGroupManagersPayload_assignmentResults[];
    } => res && typeof res.successCode === 'string';

    // Handle error response
    if (isErrorResponse(response)) {
      handleError(response.message || 'Assignment failed', response.errorCode);
      return;
    }

    // Handle success payload
    if (isPayload(response)) {
      const assignmentResults = response.assignmentResults || [];

      const successes = assignmentResults.filter(isAssignmentSuccess);
      const errors = assignmentResults.filter(isAssignmentError);

      const assignedCount = successes.length;
      const failedCount = errors.length;

      const isFailure = response.successCode === 'FAILURE';

      if (isFailure) {
        handleError(
          'Failed to assign leads',
          getErrorCodeForCompleteFailure(errors) ?? '',
        );
        return;
      }
      const failures: ManagerAssignmentFailure[] = mapToFailureOutput(errors);

      // Partial Success - some managers assigned, some failed
      if (response.successCode === 'PARTIAL_SUCCESS' && failedCount > 0) {
        const partialResult: AssignGroupManagersResult = {
          success: true,
          partialSuccess: true,
          assignedCount,
          failedCount,
          failures,
        };

        handleSuccess(partialResult);
        return;
      }

      // Complete Success - all managers assigned
      const successResult: AssignGroupManagersResult = {
        success: true,
        partialSuccess: false,
        assignedCount,
        failedCount: 0,
        failures: [],
      };

      handleSuccess(successResult);
      return;
    }

    // Unexpected response format
    handleError('Unexpected response type');
  };

  return useAssignGroupManagersMutation({
    context: {
      clientName: ApolloClientNames.TIME_TRACKING,
    },
    onCompleted: handleCompleted,
    onError: handleApolloError,
  });
};
