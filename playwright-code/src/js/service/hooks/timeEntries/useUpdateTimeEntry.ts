import { ApolloError } from '@apollo/client';
import { useIntl, useSandbox } from '@payroll/quicksand';
import {
  TimeTracking_TimeEntry,
  UpdateTimeEntryMutation_Mutation,
  useUpdateTimeEntryMutation,
} from 'src/__generated__/timeTracking/graphql';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import { mapError } from 'src/js/service/utils/mapError';
import {
  endInteractionWithFailure,
  endInteractionWithSuccess,
  setInteractionDegraded,
  shouldTreatErrorAsDegraded,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import {
  processTSheetSyncError,
  createTSheetSyncErrorHandler,
} from 'src/js/service/utils/tsheetErrorUtils';

export interface UseUpdateTimeEntryArgs {
  onSuccess: (data: TimeTracking_TimeEntry[]) => void;
  onError: (error: string) => void;
}

export const useUpdateTimeEntry = ({
  onSuccess,
  onError,
}: UseUpdateTimeEntryArgs) => {
  const sandbox = useSandbox();
  const intl = useIntl();

  const handleSuccess = (timeEntries: TimeTracking_TimeEntry[]) => {
    sandbox.logger.info(
      'Component=useUpdateTimeEntry Event=Successfully updated time entry',
    );
    endInteractionWithSuccess(
      sandbox,
      TimeCustomerInteraction.SINGLE_TIME_SHEET_UPDATE,
    );
    onSuccess(timeEntries);
  };

  const handleError = (
    error: string | ApolloError | undefined,
    subCode = '',
    details = '',
  ) => {
    const errorCode = typeof error === 'string' ? error : error?.message;
    const errorMessage =
      details || (error instanceof ApolloError ? error.message : '');

    // Check if error should be treated as degraded
    const isDegraded = shouldTreatErrorAsDegraded(errorCode, errorMessage);

    sandbox.logger.error(
      `Component=useUpdateTimeEntry Event=Error updating time entry`,
      {
        error,
        isDegraded,
        errorCode,
      },
    );

    // Mark interaction as degraded or failed based on error type
    if (isDegraded) {
      setInteractionDegraded(
        sandbox,
        TimeCustomerInteraction.SINGLE_TIME_SHEET_UPDATE,
        errorCode || 'Unknown degraded error',
      );
    } else {
      endInteractionWithFailure(
        sandbox,
        TimeCustomerInteraction.SINGLE_TIME_SHEET_UPDATE,
        error as string,
      );
    }

    const mappedError = mapError({
      sourceComponent: 'updateTimeEntry',
      sandbox,
      intl,
      error,
      customErrorHandler: createTSheetSyncErrorHandler(intl, details),
    });

    if (mappedError) {
      onError(mappedError);
    }
  };

  const handleApolloError = (error: ApolloError) => {
    handleError(error);
  };

  const handleCompleted = (result: UpdateTimeEntryMutation_Mutation) => {
    if (!result.timeTrackingUpdateTimeEntry) {
      handleError('Null Response');
      return;
    }
    if (
      result.timeTrackingUpdateTimeEntry.__typename ===
      'TimeTracking_UpdateTimeEntryError'
    ) {
      const errorResponse = result.timeTrackingUpdateTimeEntry;

      // Try to process TSheet sync error
      const processedError = processTSheetSyncError(errorResponse);

      if (processedError) {
        // Handle TSheet sync error with cleaned details
        handleError(
          processedError.errorCode,
          processedError.subCode,
          processedError.cleanedDetails,
        );
      } else {
        // Handle regular error
        handleError(errorResponse.errorCode, errorResponse.subCode || '');
      }
    } else if (
      result.timeTrackingUpdateTimeEntry.__typename ===
      'TimeTracking_UpdateTimeEntryPayload'
    ) {
      handleSuccess(
        result.timeTrackingUpdateTimeEntry
          .timeEntries as TimeTracking_TimeEntry[],
      );
    } else {
      handleError('Unexpected response type');
    }
  };

  return useUpdateTimeEntryMutation({
    context: {
      clientName: ApolloClientNames.TIME_TRACKING,
    },
    onCompleted: handleCompleted,
    onError: handleApolloError,
  });
};
