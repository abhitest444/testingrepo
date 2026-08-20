import { useIntl, useSandbox } from '@payroll/quicksand';
import { ApolloError } from '@apollo/client';
import {
  CreateTimeEntryMutation_Mutation,
  TimeTracking_TimeEntry,
  useCreateTimeEntryMutation,
} from 'src/__generated__/timeTracking/graphql';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import { mapError } from 'src/js/service/utils/mapError';
import {
  endInteractionWithFailure,
  endInteractionWithSuccess,
  setInteractionDegraded,
  shouldTreatErrorAsDegraded,
  TimeCustomerInteraction,
} from '../../../common/CustomerInteraction';
import {
  processTSheetSyncError,
  createTSheetSyncErrorHandler,
} from '../../utils/tsheetErrorUtils';

export interface UseCreateTimeEntryArgs {
  onSuccess: (data: TimeTracking_TimeEntry[]) => void;
  onError: (error: string) => void;
}

export const useCreateTimeEntry = ({
  onSuccess,
  onError,
}: UseCreateTimeEntryArgs) => {
  const sandbox = useSandbox();
  const intl = useIntl();

  const handleSuccess = (timeEntries: TimeTracking_TimeEntry[]) => {
    sandbox.logger.info(
      'Component=useCreateTimeEntry Event=Successfully created time entry',
    );
    endInteractionWithSuccess(
      sandbox,
      TimeCustomerInteraction.SINGLE_TIME_SHEET_CREATE,
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
      `Component=useCreateTimeEntry Event=Error creating time entry`,
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
        TimeCustomerInteraction.SINGLE_TIME_SHEET_CREATE,
        errorCode || 'Unknown degraded error',
      );
    } else {
      endInteractionWithFailure(
        sandbox,
        TimeCustomerInteraction.SINGLE_TIME_SHEET_CREATE,
        error as string,
      );
    }

    const mappedError = mapError({
      sourceComponent: 'useCreateTimeEntry',
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

  const handleCompleted = (result: CreateTimeEntryMutation_Mutation) => {
    if (!result.timeTrackingCreateTimeEntry) {
      handleError('Null Response');
      return;
    }
    if (
      result.timeTrackingCreateTimeEntry.__typename ===
      'TimeTracking_CreateTimeEntryError'
    ) {
      const errorResponse = result.timeTrackingCreateTimeEntry;

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
      result.timeTrackingCreateTimeEntry.__typename ===
      'TimeTracking_CreateTimeEntryPayload'
    ) {
      handleSuccess(
        result.timeTrackingCreateTimeEntry
          .timeEntries as TimeTracking_TimeEntry[],
      );
    } else {
      handleError('Unexpected response type');
    }
  };

  return useCreateTimeEntryMutation({
    context: {
      clientName: ApolloClientNames.TIME_TRACKING,
    },
    onCompleted: handleCompleted,
    onError: handleApolloError,
  });
};
