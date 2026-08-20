import { useSandbox } from '@payroll/quicksand';
import { ApolloError } from '@apollo/client';
import {
  UpdateGroupMutation,
  TimeTracking_Group,
  useUpdateGroupMutation,
} from 'src/__generated__/timeTracking/graphql';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import {
  endInteractionWithSuccess,
  endInteractionWithFailure,
  TimeCustomerInteraction,
  setInteractionDegraded,
  shouldTreatErrorAsDegraded,
} from 'src/js/common/CustomerInteraction';

export interface UseUpdateGroupArgs {
  onSuccess: (group: TimeTracking_Group) => void;
  onError: (error: string, errorCode?: string) => void;
}

/**
 * Custom hook for updating group properties (primarily name)
 * Handles optimistic locking with version field
 *
 * QUANTA-5495 (UI-019): Update Group Mutation & Custom Hook
 *
 * Features:
 * - Customer interaction tracking
 * - Error handling with typed responses
 * - Optimistic locking with version field
 *
 * @param args - Success and error callbacks
 * @returns Mutation function with loading and error states
 */
export const useUpdateGroup = ({ onSuccess, onError }: UseUpdateGroupArgs) => {
  const sandbox = useSandbox();

  const handleSuccess = (group: TimeTracking_Group) => {
    sandbox.logger.info(
      'Component=useUpdateGroup Event=Successfully updated group',
      {
        groupId: group.id,
        groupName: group.name,
        version: group.meta.version,
      },
    );
    endInteractionWithSuccess(sandbox, TimeCustomerInteraction.GROUP_UPDATE);
    onSuccess(group);
  };

  const handleError = (
    error: string | ApolloError | undefined,
    errorCode = '',
  ) => {
    // Check if error should be treated as degraded
    const isDegraded = shouldTreatErrorAsDegraded(errorCode, error as string);

    sandbox.logger.error(
      'Component=useUpdateGroup Event=Error updating group',
      {
        error,
        errorCode,
        isDegraded,
      },
    );

    if (isDegraded) {
      setInteractionDegraded(
        sandbox,
        TimeCustomerInteraction.GROUP_UPDATE,
        error as string,
      );
    } else {
      endInteractionWithFailure(
        sandbox,
        TimeCustomerInteraction.GROUP_UPDATE,
        error as string,
      );
    }
    onError(error as string, errorCode);
  };

  const handleApolloError = (error: ApolloError) => {
    handleError(error.message);
  };

  const handleCompleted = (result: UpdateGroupMutation) => {
    const response = result.timeTrackingUpdateGroup;

    if (!response) {
      handleError('Null Response');
      return;
    }

    // Type guard: Check if response is an error (has errorCode)
    const isError = (
      res: any,
    ): res is { errorCode: string; message?: string } =>
      res && typeof res.errorCode === 'string';

    // Type guard: Check if response is success (has successCode and group)
    const isSuccess = (
      res: any,
    ): res is { successCode: string; group: TimeTracking_Group } =>
      res && typeof res.successCode === 'string' && res.group;

    if (isError(response)) {
      handleError(
        response.message || 'Update group failed',
        response.errorCode,
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

  return useUpdateGroupMutation({
    context: {
      clientName: ApolloClientNames.TIME_TRACKING,
    },
    onCompleted: handleCompleted,
    onError: handleApolloError,
  });
};
