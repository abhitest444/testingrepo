import { useSandbox } from '@payroll/quicksand';
import { ApolloError } from '@apollo/client';
import {
  RemoveGroupManagersMutation,
  useRemoveGroupManagersMutation,
  RemoveGroupManagersMutation_timeTrackingRemoveGroupManagers_TimeTracking_RemoveGroupManagersPayload_removalResults,
  RemoveGroupManagersMutation_timeTrackingRemoveGroupManagers_TimeTracking_RemoveGroupManagersPayload_removalResults_TimeTracking_GroupManagerRemovalError,
  RemoveGroupManagersMutation_timeTrackingRemoveGroupManagers_TimeTracking_RemoveGroupManagersPayload_removalResults_TimeTracking_GroupManagerRemovalSuccess,
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
 * Type guard for GroupManagerRemovalError
 * Checks for presence of workerId field (errors have workerId, successes have worker)
 */
function isRemovalError(
  result: RemoveGroupManagersMutation_timeTrackingRemoveGroupManagers_TimeTracking_RemoveGroupManagersPayload_removalResults,
): result is RemoveGroupManagersMutation_timeTrackingRemoveGroupManagers_TimeTracking_RemoveGroupManagersPayload_removalResults_TimeTracking_GroupManagerRemovalError {
  return 'workerId' in result;
}

/**
 * Type guard for GroupManagerRemovalSuccess
 * Checks for presence of worker field (successes have worker object, errors have workerId)
 */
function isRemovalSuccess(
  result: RemoveGroupManagersMutation_timeTrackingRemoveGroupManagers_TimeTracking_RemoveGroupManagersPayload_removalResults,
): result is RemoveGroupManagersMutation_timeTrackingRemoveGroupManagers_TimeTracking_RemoveGroupManagersPayload_removalResults_TimeTracking_GroupManagerRemovalSuccess {
  return 'worker' in result;
}

/**
 * Individual removal failure details
 */
export interface ManagerRemovalFailure {
  /** ID of the worker that failed to be removed as manager */
  workerId: string;
  /** Error code identifying the failure type */
  errorCode: string | null;
  /** Human-readable error message */
  errorMessage: string | null;
}

/**
 * Result of the remove group managers operation
 */
export interface RemoveGroupManagersResult {
  /** Whether the operation was successful */
  success: boolean;
  /** Whether the operation had partial success (some managers removed, some failed) */
  partialSuccess: boolean;
  /** Number of managers successfully removed */
  removedCount: number;
  /** Number of managers that failed to be removed */
  failedCount: number;
  /** Details of individual removal failures */
  failures: ManagerRemovalFailure[];
}

/**
 * Arguments for the useRemoveGroupManagers hook
 */
export interface UseRemoveGroupManagersArgs {
  /** Callback fired on successful removal */
  onSuccess: (result: RemoveGroupManagersResult) => void;
  /** Callback fired on removal failure */
  onError: (error: string, errorCode?: string) => void;
}

/**
 * Custom hook for removing managers from a group
 * Supports bulk operations with partial success reporting
 *
 * Key Business Rules:
 * - Removing a manager does NOT remove them as a member of the group
 * - A worker can be removed as manager from multiple groups
 * - Supports bulk operations with individual failure reporting
 *
 * @param args - Success and error callbacks
 * @returns Mutation function with loading and error states
 *
 * @example
 * ```typescript
 * const [removeManagers, { loading }] = useRemoveGroupManagers({
 *   onSuccess: (result) => {
 *     if (result.partialSuccess) {
 *       console.log(`Partial: ${result.removedCount} removed, ${result.failedCount} failed`);
 *     } else {
 *       console.log(`All ${result.removedCount} managers removed!`);
 *     }
 *   },
 *   onError: (error, errorCode) => console.error('Failed:', error, errorCode),
 * });
 *
 * removeManagers({
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
export const useRemoveGroupManagers = ({
  onSuccess,
  onError,
}: UseRemoveGroupManagersArgs) => {
  const sandbox = useSandbox();

  const handleSuccess = (result: RemoveGroupManagersResult) => {
    handleGroupMutationSuccess(
      sandbox,
      TimeCustomerInteraction.GROUP_REMOVE_MANAGERS,
      result,
      {
        partialSuccessEvent:
          'Component=useRemoveGroupManagers Event=Partial success removing managers',
        fullSuccessEvent:
          'Component=useRemoveGroupManagers Event=Successfully removed all managers',
        getLogMeta: (r) =>
          r.partialSuccess
            ? {
                removedCount: r.removedCount,
                failedCount: r.failedCount,
                failures: r.failures,
              }
            : { removedCount: r.removedCount },
        validationDegradedMessage:
          'Some leads could not be removed due to validation errors',
        mixedFailureMessage: 'Failed to remove some leads',
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
      TimeCustomerInteraction.GROUP_REMOVE_MANAGERS,
      error as string,
      errorCode,
      {
        componentEvent:
          'Component=useRemoveGroupManagers Event=Error removing managers',
      },
      onError,
    );
  };

  const handleApolloError = (error: ApolloError) => {
    handleError(error.message);
  };

  const handleCompleted = (result: RemoveGroupManagersMutation) => {
    const response = result.timeTrackingRemoveGroupManagers;

    if (!response) {
      handleError('Null Response');
      return;
    }

    // Type guard: Check if response is success payload (has successCode)
    const isPayload = (
      res: any,
    ): res is {
      successCode: string;
      removalResults: RemoveGroupManagersMutation_timeTrackingRemoveGroupManagers_TimeTracking_RemoveGroupManagersPayload_removalResults[];
    } => res && typeof res.successCode === 'string';

    // Handle error response
    if (isErrorResponse(response)) {
      handleError(response.message || 'Removal failed', response.errorCode);
      return;
    }

    // Handle success payload
    if (isPayload(response)) {
      const removalResults = response.removalResults || [];

      const successes = removalResults.filter(isRemovalSuccess);
      const errors = removalResults.filter(isRemovalError);

      const removedCount = successes.length;
      const failedCount = errors.length;

      const isFailure = response.successCode === 'FAILURE';

      if (isFailure) {
        handleError(
          'Failed to remove leads',
          getErrorCodeForCompleteFailure(errors) ?? '',
        );
        return;
      }

      const failures: ManagerRemovalFailure[] = mapToFailureOutput(errors);

      // Partial Success - some managers removed, some failed
      if (response.successCode === 'PARTIAL_SUCCESS' && failedCount > 0) {
        const partialResult: RemoveGroupManagersResult = {
          success: true,
          partialSuccess: true,
          removedCount,
          failedCount,
          failures,
        };

        handleSuccess(partialResult);
        return;
      }

      // Complete Success - all managers removed
      const successResult: RemoveGroupManagersResult = {
        success: true,
        partialSuccess: false,
        removedCount,
        failedCount: 0,
        failures: [],
      };

      handleSuccess(successResult);
      return;
    }

    // Unexpected response format
    handleError('Unexpected response type');
  };

  return useRemoveGroupManagersMutation({
    context: {
      clientName: ApolloClientNames.TIME_TRACKING,
    },
    onCompleted: handleCompleted,
    onError: handleApolloError,
  });
};
