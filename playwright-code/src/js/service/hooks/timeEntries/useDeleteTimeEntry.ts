import { useIntl, useSandbox } from '@payroll/quicksand';
import { ApolloError } from '@apollo/client';
import {
  DeleteTimeEntryMutation_Mutation,
  useDeleteTimeEntryMutation,
} from 'src/__generated__/timeTracking/graphql';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import { mapError } from 'src/js/service/utils/mapError';
import {
  endInteractionWithFailure,
  endInteractionWithSuccess,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import { mapTimeTrackingMutationError } from 'src/js/service/errors/timeTrackingErrors';

export interface UseDeleteTimeEntryArgs {
  onSuccess: (successCode: string) => void;
  onError: (error: string) => void;
}

export const useDeleteTimeEntry = ({
  onSuccess,
  onError,
}: UseDeleteTimeEntryArgs) => {
  const sandbox = useSandbox();
  const intl = useIntl();

  const handleSuccess = (successCode: string) => {
    sandbox.logger.info(
      'Component=useDeleteTimeEntry Event=Successfully deleted time entry',
    );
    endInteractionWithSuccess(
      sandbox,
      TimeCustomerInteraction.SINGLE_TIME_SHEET_DELETE,
    );
    onSuccess(successCode);
  };

  const handleError = (error: string | ApolloError | undefined) => {
    sandbox.logger.error(
      `Component=useDeleteTimeEntry Event=Error deleting time entry`,
      {
        error,
      },
    );
    endInteractionWithFailure(
      sandbox,
      TimeCustomerInteraction.SINGLE_TIME_SHEET_DELETE,
      error as string,
    );
    const mappedError = mapError({
      sourceComponent: 'useDeleteTimeEntry',
      sandbox,
      intl,
      error,
      customErrorHandler: (error) => mapTimeTrackingMutationError(intl, error),
    });

    if (mappedError) {
      onError(mappedError);
    }
  };

  const handleOnCompleted = (result: DeleteTimeEntryMutation_Mutation) => {
    if (!result.timeTrackingDeleteTimeEntry) {
      handleError('Null Response');
      return;
    }
    if (
      result.timeTrackingDeleteTimeEntry.__typename ===
      'TimeTracking_DeleteTimeEntryError'
    ) {
      handleError(result.timeTrackingDeleteTimeEntry.errorCode);
      return;
    }
    if (
      result.timeTrackingDeleteTimeEntry.__typename ===
      'TimeTracking_DeleteTimeEntryPayload'
    ) {
      handleSuccess(result.timeTrackingDeleteTimeEntry.successCode);
    } else {
      handleError('Unexpected response type');
    }
  };

  return useDeleteTimeEntryMutation({
    context: {
      clientName: ApolloClientNames.TIME_TRACKING,
    },
    onCompleted: handleOnCompleted,
    onError: handleError,
  });
};
