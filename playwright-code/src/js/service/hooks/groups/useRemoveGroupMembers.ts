import { useSandbox } from '@payroll/quicksand';
import { ApolloError } from '@apollo/client';
import {
  RemoveGroupMembersMutation,
  useRemoveGroupMembersMutation,
  RemoveGroupMembersMutation_timeTrackingRemoveGroupMembers_TimeTracking_RemoveGroupMembersPayload_removalResults,
  RemoveGroupMembersMutation_timeTrackingRemoveGroupMembers_TimeTracking_RemoveGroupMembersPayload_removalResults_TimeTracking_GroupMemberRemovalError,
  RemoveGroupMembersMutation_timeTrackingRemoveGroupMembers_TimeTracking_RemoveGroupMembersPayload_removalResults_TimeTracking_GroupMemberRemovalSuccess,
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
 * Type guard for GroupMemberRemovalError
 * Checks for presence of workerId field (errors have workerId, successes have worker)
 */
function isRemovalError(
  result: RemoveGroupMembersMutation_timeTrackingRemoveGroupMembers_TimeTracking_RemoveGroupMembersPayload_removalResults,
): result is RemoveGroupMembersMutation_timeTrackingRemoveGroupMembers_TimeTracking_RemoveGroupMembersPayload_removalResults_TimeTracking_GroupMemberRemovalError {
  return 'workerId' in result;
}

/**
 * Type guard for GroupMemberRemovalSuccess
 * Checks for presence of worker field (successes have worker object, errors have workerId)
 */
function isRemovalSuccess(
  result: RemoveGroupMembersMutation_timeTrackingRemoveGroupMembers_TimeTracking_RemoveGroupMembersPayload_removalResults,
): result is RemoveGroupMembersMutation_timeTrackingRemoveGroupMembers_TimeTracking_RemoveGroupMembersPayload_removalResults_TimeTracking_GroupMemberRemovalSuccess {
  return 'worker' in result;
}

/**
 * Individual removal failure details
 */
export interface RemovalFailure {
  /** ID of the worker that failed to be removed */
  workerId: string;
  /** Error code identifying the failure type */
  errorCode: string | null;
  /** Human-readable error message */
  errorMessage: string | null;
}

/**
 * Result of the remove group members operation
 */
export interface RemoveGroupMembersResult {
  /** Whether the operation succeeded (SUCCESS or PARTIAL_SUCCESS) */
  success: boolean;
  /** Whether the operation had partial success (some members removed, some failed) */
  partialSuccess?: boolean;
  /** Number of members successfully removed */
  removedCount: number;
  /** Number of members that failed to be removed */
  failedCount: number;
  /** Array of individual removal failures (only present for partial success) */
  failures?: RemovalFailure[];
}

/**
 * Arguments for the useRemoveGroupMembers hook
 */
export interface UseRemoveGroupMembersArgs {
  /** Callback invoked when members are successfully removed (including partial success) */
  onSuccess: (result: RemoveGroupMembersResult) => void;
  /** Callback invoked when the operation completely fails */
  onError: (error: string, errorCode?: string) => void;
}

/**
 * Custom hook for removing members from a group
 *
 * **Key Business Rule:** Workers can only be members of ONE active group at a time.
 * Removing a member frees them up to be assigned to another group.
 *
 * Features:
 * - Customer interaction tracking
 * - Handles Success, Partial Success, and Error scenarios
 * - Error handling with typed responses
 *
 * QUANTA-5492 (UI-016): Remove Members Mutation & Custom Hook
 *
 * @param args - Success and error callbacks
 * @returns Mutation function with loading and error states
 *
 * @example
 * ```typescript
 * const [removeMembers, { loading }] = useRemoveGroupMembers({
 *   onSuccess: (result) => {
 *     if (result.partialSuccess) {
 *       console.log(`Partial: ${result.removedCount} removed, ${result.failedCount} failed`);
 *     } else {
 *       console.log(`All ${result.removedCount} members removed!`);
 *     }
 *   },
 *   onError: (error, errorCode) => console.error('Failed:', error, errorCode),
 * });
 *
 * removeMembers({
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
export const useRemoveGroupMembers = ({
  onSuccess,
  onError,
}: UseRemoveGroupMembersArgs) => {
  const sandbox = useSandbox();

  const handleSuccess = (result: RemoveGroupMembersResult) => {
    handleGroupMutationSuccess(
      sandbox,
      TimeCustomerInteraction.GROUP_REMOVE_MEMBERS,
      result,
      {
        partialSuccessEvent:
          'Component=useRemoveGroupMembers Event=Partial success removing members',
        fullSuccessEvent:
          'Component=useRemoveGroupMembers Event=Successfully removed all members',
        getLogMeta: (r) =>
          r.partialSuccess
            ? {
                removedCount: r.removedCount,
                failedCount: r.failedCount,
                failures: r.failures,
              }
            : { removedCount: r.removedCount },
        validationDegradedMessage:
          'Some workers could not be removed due to validation errors',
        mixedFailureMessage: 'Failed to remove some workers',
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
      TimeCustomerInteraction.GROUP_REMOVE_MEMBERS,
      error as string,
      errorCode,
      {
        componentEvent:
          'Component=useRemoveGroupMembers Event=Error removing members',
      },
      onError,
    );
  };

  const handleApolloError = (error: ApolloError) => {
    handleError(error.message);
  };

  const handleCompleted = (result: RemoveGroupMembersMutation) => {
    const response = result.timeTrackingRemoveGroupMembers;

    if (!response) {
      handleError('Null Response');
      return;
    }

    // Type guard: Check if response is success payload (has successCode)
    const isSuccess = (
      res: any,
    ): res is {
      successCode: string;
      removalResults: RemoveGroupMembersMutation_timeTrackingRemoveGroupMembers_TimeTracking_RemoveGroupMembersPayload_removalResults[];
    } => res && typeof res.successCode === 'string';

    if (isErrorResponse(response)) {
      handleError(
        response.message || 'Remove members failed',
        response.errorCode,
      );
      return;
    }

    if (isSuccess(response)) {
      const { successCode, removalResults } = response;

      // Count successes and failures using type guards
      const successfulRemovals = removalResults.filter(isRemovalSuccess);
      const failedRemovals = removalResults.filter(isRemovalError);

      const removedCount = successfulRemovals.length;
      const failedCount = failedRemovals.length;

      const isFailure = successCode === 'FAILURE';

      if (isFailure) {
        handleError(
          'Failed to remove workers',
          getErrorCodeForCompleteFailure(failedRemovals) ?? '',
        );
        return;
      }

      const isPartialSuccess = successCode === 'PARTIAL_SUCCESS';

      if (isPartialSuccess) {
        // Partial Success - some members removed, some failed
        const failures: RemovalFailure[] = mapToFailureOutput(failedRemovals);

        const partialResult: RemoveGroupMembersResult = {
          success: true,
          partialSuccess: true,
          removedCount,
          failedCount,
          failures,
        };

        handleSuccess(partialResult);
        return;
      }

      // Complete Success - all members removed
      const successResult: RemoveGroupMembersResult = {
        success: true,
        removedCount,
        failedCount: 0,
      };

      handleSuccess(successResult);
      return;
    }

    // Unexpected response format
    handleError('Unexpected response type');
  };

  return useRemoveGroupMembersMutation({
    context: {
      clientName: ApolloClientNames.TIME_TRACKING,
    },
    onCompleted: handleCompleted,
    onError: handleApolloError,
  });
};
