import { useSandbox } from '@payroll/quicksand';
import { ApolloError } from '@apollo/client';
import {
  DeleteGroupMutation,
  DeleteGroupMutation_timeTrackingDeleteGroup_TimeTracking_DeleteGroupError,
  DeleteGroupMutation_timeTrackingDeleteGroup_TimeTracking_DeleteGroupPayload,
  DeleteGroupMutation_timeTrackingDeleteGroup_TimeTracking_DeleteGroupPayload_group_TimeTracking_Group,
  useDeleteGroupMutation,
} from 'src/__generated__/timeTracking/graphql';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import {
  createCustomerInteraction,
  endInteractionWithSuccess,
  endInteractionWithFailure,
  TimeCustomerInteraction,
  shouldTreatErrorAsDegraded,
  setInteractionDegraded,
  getCustomerInteractionPropagationHeaders,
} from 'src/js/common/CustomerInteraction';

export interface UseDeleteGroupArgs {
  onSuccess: (
    group: DeleteGroupMutation_timeTrackingDeleteGroup_TimeTracking_DeleteGroupPayload_group_TimeTracking_Group,
  ) => void;
  onError: (error: string, errorCode?: string, details?: string) => void;
}

/**
 * Custom hook for soft-deleting a group
 *
 * Features:
 * - Soft delete: Sets isActive to false without removing from database
 * - Optimistic concurrency control via version field
 * - Customer interaction tracking
 * - Error handling with typed responses
 *
 * Business Rules:
 * - Deleted groups are excluded from default queries
 * - All member and manager assignments are automatically removed
 * - Requires version number for optimistic locking
 *
 * @param args - Success and error callbacks
 * @returns Mutation function with loading and error states
 *
 * @example
 * ```typescript
 * const [deleteGroup, { loading }] = useDeleteGroup({
 *   onSuccess: (group) => {
 *     console.log(`Group ${group.name} deleted successfully`);
 *   },
 *   onError: (error, errorCode) => {
 *     if (errorCode === 'VERSION_MISMATCH') {
 *       console.error('Group was modified by another user. Please refresh.');
 *     } else {
 *       console.error('Failed to delete group:', error);
 *     }
 *   },
 * });
 *
 * deleteGroup({
 *   variables: {
 *     input: {
 *       id: 'group-123',
 *       version: 5,
 *     },
 *   },
 * });
 * ```
 */
export const useDeleteGroup = ({ onSuccess, onError }: UseDeleteGroupArgs) => {
  const sandbox = useSandbox();

  const handleSuccess = (
    group: DeleteGroupMutation_timeTrackingDeleteGroup_TimeTracking_DeleteGroupPayload_group_TimeTracking_Group,
  ) => {
    sandbox.logger.info(
      'Component=useDeleteGroup Event=Successfully deleted group',
      {
        groupId: group.id,
        groupName: group.name,
      },
    );
    endInteractionWithSuccess(sandbox, TimeCustomerInteraction.GROUP_DELETE);
    onSuccess(group);
  };

  const handleError = (
    error: string | ApolloError | undefined,
    errorCode = '',
    details = '',
  ) => {
    // Check if error should be treated as degraded
    const isDegraded = shouldTreatErrorAsDegraded(errorCode, error as string);

    sandbox.logger.error(
      'Component=useDeleteGroup Event=Error deleting group',
      {
        error,
        errorCode,
        details,
        isDegraded,
      },
    );

    if (isDegraded) {
      setInteractionDegraded(
        sandbox,
        TimeCustomerInteraction.GROUP_DELETE,
        error as string,
      );
    } else {
      endInteractionWithFailure(
        sandbox,
        TimeCustomerInteraction.GROUP_DELETE,
        error as string,
      );
    }
    onError(error as string, errorCode, details);
  };

  const handleApolloError = (error: ApolloError) => {
    handleError(error.message);
  };

  const handleCompleted = (result: DeleteGroupMutation) => {
    const response = result.timeTrackingDeleteGroup;

    if (!response) {
      handleError('Null Response');
      return;
    }

    // Type guard: Check if response is an error (has errorCode)
    const isError = (
      res: typeof response,
    ): res is DeleteGroupMutation_timeTrackingDeleteGroup_TimeTracking_DeleteGroupError =>
      'errorCode' in res && typeof res.errorCode === 'string';

    // Type guard: Check if response is success (has successCode and group)
    const isSuccess = (
      res: typeof response,
    ): res is DeleteGroupMutation_timeTrackingDeleteGroup_TimeTracking_DeleteGroupPayload =>
      'successCode' in res &&
      typeof res.successCode === 'string' &&
      'group' in res;

    if (isError(response)) {
      handleError(
        response.message || 'Delete group failed',
        response.errorCode,
        response.details || '',
      );
      return;
    }

    if (isSuccess(response)) {
      handleSuccess(response.group);
      return;
    }

    // Unexpected response format
    handleError('Unexpected response type');
  };

  const [deleteGroupMutation, { loading }] = useDeleteGroupMutation({
    context: {
      clientName: ApolloClientNames.TIME_TRACKING,
    },
    onCompleted: handleCompleted,
    onError: handleApolloError,
  });

  const deleteGroup = (variables: { groupId: string; version: number }) => {
    sandbox.logger.info('useDeleteGroup: Initiating delete', variables);
    createCustomerInteraction(sandbox, TimeCustomerInteraction.GROUP_DELETE);
    return deleteGroupMutation({
      variables: {
        input: {
          id: variables.groupId,
          version: variables.version,
        },
      },
      context: {
        headers: getCustomerInteractionPropagationHeaders(
          sandbox,
          TimeCustomerInteraction.GROUP_DELETE,
        ),
      },
    });
  };

  return {
    deleteGroup,
    isDeleting: loading,
  };
};
