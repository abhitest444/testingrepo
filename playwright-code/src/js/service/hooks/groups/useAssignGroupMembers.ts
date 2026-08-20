import { useSandbox } from '@payroll/quicksand';
import { ApolloError } from '@apollo/client';
import {
  AssignGroupMembersMutation,
  useAssignGroupMembersMutation,
  AssignGroupMembersMutation_timeTrackingAssignGroupMembers_TimeTracking_AssignGroupMembersPayload_assignmentResults,
  AssignGroupMembersMutation_timeTrackingAssignGroupMembers_TimeTracking_AssignGroupMembersPayload_assignmentResults_TimeTracking_GroupMemberAssignmentError,
  AssignGroupMembersMutation_timeTrackingAssignGroupMembers_TimeTracking_AssignGroupMembersPayload_assignmentResults_TimeTracking_GroupMemberAssignmentSuccess,
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
 * Type guard for GroupMemberAssignmentError
 * Checks for presence of workerId field (errors have workerId, successes have worker)
 */
function isAssignmentError(
  result: AssignGroupMembersMutation_timeTrackingAssignGroupMembers_TimeTracking_AssignGroupMembersPayload_assignmentResults,
): result is AssignGroupMembersMutation_timeTrackingAssignGroupMembers_TimeTracking_AssignGroupMembersPayload_assignmentResults_TimeTracking_GroupMemberAssignmentError {
  return 'workerId' in result;
}

/**
 * Type guard for GroupMemberAssignmentSuccess
 * Checks for presence of worker field (successes have worker object, errors have workerId)
 */
function isAssignmentSuccess(
  result: AssignGroupMembersMutation_timeTrackingAssignGroupMembers_TimeTracking_AssignGroupMembersPayload_assignmentResults,
): result is AssignGroupMembersMutation_timeTrackingAssignGroupMembers_TimeTracking_AssignGroupMembersPayload_assignmentResults_TimeTracking_GroupMemberAssignmentSuccess {
  return 'worker' in result;
}

/**
 * Individual assignment failure details
 */
export interface AssignmentFailure {
  /** ID of the worker that failed to be assigned */
  workerId: string;
  /** Error code identifying the failure type */
  errorCode: string | null;
  /** Human-readable error message */
  errorMessage: string | null;
}

/**
 * Result of the assign group members operation
 */
export interface AssignGroupMembersResult {
  /** Whether the operation succeeded (SUCCESS or PARTIAL_SUCCESS) */
  success: boolean;
  /** Whether the operation had partial success (some members assigned, some failed) */
  partialSuccess?: boolean;
  /** Number of members successfully assigned */
  assignedCount: number;
  /** Number of members that failed to be assigned */
  failedCount: number;
  /** Array of individual assignment failures (only present for partial success) */
  failures?: AssignmentFailure[];
}

/**
 * Arguments for the useAssignGroupMembers hook
 */
export interface UseAssignGroupMembersArgs {
  /** Callback invoked when members are successfully assigned (including partial success) */
  onSuccess: (result: AssignGroupMembersResult) => void;
  /** Callback invoked when the operation completely fails */
  onError: (error: string, errorCode?: string) => void;
}

/**
 * Custom hook for assigning members to a group
 *
 * **Key Business Rule:** Workers can only be members of ONE active group at a time.
 *
 * Features:
 * - Customer interaction tracking
 * - Handles Success, Partial Success, and Error scenarios
 * - Error handling with typed responses
 *
 * QUANTA-5490 (UI-015): Assign Members Mutation & Custom Hook
 *
 * @param args - Success and error callbacks
 * @returns Mutation function with loading and error states
 *
 * @example
 * ```typescript
 * const [assignMembers, { loading }] = useAssignGroupMembers({
 *   onSuccess: (result) => {
 *     if (result.partialSuccess) {
 *       console.log(`Partial: ${result.assignedCount} assigned, ${result.failedCount} failed`);
 *     } else {
 *       console.log(`All ${result.assignedCount} members assigned!`);
 *     }
 *   },
 *   onError: (error, errorCode) => console.error('Failed:', error, errorCode),
 * });
 *
 * assignMembers({
 *   variables: {
 *     input: {
 *       groupId: 'group-123',
 *       members: [
 *         { id: 'worker-1', timeForType: 'EMPLOYEE' },
 *         { id: 'worker-2', timeForType: 'CONTRACTOR' },
 *       ],
 *     },
 *   },
 * });
 * ```
 */
export const useAssignGroupMembers = ({
  onSuccess,
  onError,
}: UseAssignGroupMembersArgs) => {
  const sandbox = useSandbox();

  const handleSuccess = (result: AssignGroupMembersResult) => {
    handleGroupMutationSuccess(
      sandbox,
      TimeCustomerInteraction.GROUP_ASSIGN_MEMBERS,
      result,
      {
        partialSuccessEvent:
          'Component=useAssignGroupMembers Event=Partial success assigning members',
        fullSuccessEvent:
          'Component=useAssignGroupMembers Event=Successfully assigned all members',
        getLogMeta: (r) =>
          r.partialSuccess
            ? {
                assignedCount: r.assignedCount,
                failedCount: r.failedCount,
                failures: r.failures,
              }
            : { assignedCount: r.assignedCount },
        validationDegradedMessage:
          'Some workers could not be assigned due to validation errors',
        mixedFailureMessage: 'Failed to assign some workers',
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
      TimeCustomerInteraction.GROUP_ASSIGN_MEMBERS,
      error as string,
      errorCode,
      {
        componentEvent:
          'Component=useAssignGroupMembers Event=Error assigning members',
      },
      onError,
    );
  };

  const handleApolloError = (error: ApolloError) => {
    handleError(error.message);
  };

  const handleCompleted = (result: AssignGroupMembersMutation) => {
    const response = result.timeTrackingAssignGroupMembers;

    if (!response) {
      handleError('Null Response');
      return;
    }

    // Type guard: Check if response is success payload (has successCode)
    const isSuccess = (
      res: any,
    ): res is {
      successCode: string;
      assignmentResults: AssignGroupMembersMutation_timeTrackingAssignGroupMembers_TimeTracking_AssignGroupMembersPayload_assignmentResults[];
    } => res && typeof res.successCode === 'string';

    if (isErrorResponse(response)) {
      handleError(
        response.message || 'Assign members failed',
        response.errorCode,
      );
      return;
    }

    if (isSuccess(response)) {
      const { successCode, assignmentResults } = response;

      // Count successes and failures using type guards
      const successfulAssignments =
        assignmentResults.filter(isAssignmentSuccess);
      const failedAssignments = assignmentResults.filter(isAssignmentError);

      const assignedCount = successfulAssignments.length;
      const failedCount = failedAssignments.length;

      const isFailure = successCode === 'FAILURE';

      if (isFailure) {
        handleError(
          'Failed to assign workers',
          getErrorCodeForCompleteFailure(failedAssignments) ?? '',
        );
        return;
      }

      const isPartialSuccess = successCode === 'PARTIAL_SUCCESS';

      if (isPartialSuccess) {
        // Partial Success - some members assigned, some failed
        const failures: AssignmentFailure[] =
          mapToFailureOutput(failedAssignments);

        const partialResult: AssignGroupMembersResult = {
          success: true,
          partialSuccess: true,
          assignedCount,
          failedCount,
          failures,
        };

        handleSuccess(partialResult);
        return;
      }

      // Complete Success - all members assigned
      const successResult: AssignGroupMembersResult = {
        success: true,
        assignedCount,
        failedCount: 0,
      };

      handleSuccess(successResult);
      return;
    }

    // Unexpected response format
    handleError('Unexpected response type');
  };

  return useAssignGroupMembersMutation({
    context: {
      clientName: ApolloClientNames.TIME_TRACKING,
    },
    onCompleted: handleCompleted,
    onError: handleApolloError,
  });
};
