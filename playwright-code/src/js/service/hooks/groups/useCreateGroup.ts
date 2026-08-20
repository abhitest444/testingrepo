import { useSandbox } from '@payroll/quicksand';
import { ApolloError } from '@apollo/client';
import {
  CreateGroupMutation,
  TimeTracking_Group,
  useCreateGroupMutation,
} from 'src/__generated__/timeTracking/graphql';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import {
  endInteractionWithSuccess,
  endInteractionWithFailure,
  TimeCustomerInteraction,
  setInteractionDegraded,
  shouldTreatErrorAsDegraded,
} from 'src/js/common/CustomerInteraction';

export interface UseCreateGroupArgs {
  onSuccess: (group: TimeTracking_Group) => void;
  onError: (error: string, errorCode?: string, details?: string) => void;
}

/**
 * Custom hook for creating a new group
 *
 * Features:
 * - Customer interaction tracking
 * - Error handling with typed responses
 *
 * @param args - Success and error callbacks
 * @returns Mutation function with loading and error states
 */
export const useCreateGroup = ({ onSuccess, onError }: UseCreateGroupArgs) => {
  const sandbox = useSandbox();

  const handleSuccess = (group: TimeTracking_Group) => {
    sandbox.logger.info(
      'Component=useCreateGroup Event=Successfully created group',
    );
    endInteractionWithSuccess(sandbox, TimeCustomerInteraction.GROUP_CREATE);
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
      'Component=useCreateGroup Event=Error creating group',
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
        TimeCustomerInteraction.GROUP_CREATE,
        error as string,
      );
    } else {
      endInteractionWithFailure(
        sandbox,
        TimeCustomerInteraction.GROUP_CREATE,
        error as string,
      );
    }
    onError(error as string, errorCode, details);
  };

  const handleApolloError = (error: ApolloError) => {
    handleError(error.message);
  };

  const handleCompleted = (result: CreateGroupMutation) => {
    const response = result.timeTrackingCreateGroup;

    if (!response) {
      handleError('Null Response');
      return;
    }

    // Type guard: Check if response is an error (has errorCode)
    const isError = (
      res: any,
    ): res is { errorCode: string; message?: string; details?: string } =>
      res && typeof res.errorCode === 'string';

    // Type guard: Check if response is success (has successCode and group)
    const isSuccess = (
      res: any,
    ): res is { successCode: string; group: TimeTracking_Group } =>
      res && typeof res.successCode === 'string' && res.group;

    if (isError(response)) {
      handleError(
        response.message || 'Create group failed',
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

  return useCreateGroupMutation({
    context: {
      clientName: ApolloClientNames.TIME_TRACKING,
    },
    onCompleted: handleCompleted,
    onError: handleApolloError,
  });
};
