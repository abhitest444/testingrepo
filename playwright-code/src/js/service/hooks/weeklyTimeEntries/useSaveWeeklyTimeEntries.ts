import { useIntl, useSandbox } from '@payroll/quicksand';
import { ApolloError } from '@apollo/client';
import { useCallback, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  useBatchSaveTimeEntriesMutation,
  TimeTracking_PartialBatchManageTimeEntriesPayload,
  TimeTracking_BatchManageTimeEntriesResult,
} from 'src/__generated__/timeTracking/graphql';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import { mapError } from 'src/js/service/utils/mapError';
import { mapTimeTrackingMutationError } from 'src/js/service/errors/timeTrackingErrors';
import {
  createCustomerInteraction,
  endInteractionWithSuccess,
  endInteractionWithFailure,
  setInteractionDegraded,
  shouldTreatWeeklyTimesheetErrorAsDegraded,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
// Import Redux selectors for accessing time entry grid state
import {
  selectAllTimesheetRows,
  selectTeamMember,
  selectDateRange,
  selectCompanySettings,
  selectDimensions,
} from 'src/js/widgets/weeklyTimeEntry/store/selectors';
import type { RootState } from 'src/js/widgets/weeklyTimeEntry/store';
import { useAppDispatch } from 'src/js/widgets/weeklyTimeEntry/store';
import {
  clearDeletedTimeEntryIds,
  markAllEntriesAsSaved,
} from 'src/js/widgets/weeklyTimeEntry/store/timeEntryGridSlice';
import {
  setSaveError,
  clearSaveError,
  setSavePayload,
  clearSavePayload,
  setDetailedSaveErrors,
  clearDetailedSaveErrors,
} from 'src/js/widgets/weeklyTimeEntry/store/validationSlice';
import { WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS } from 'src/js/widgets/weeklyTimeEntry/utils/constants';
import { useTransformTimeEntries } from './useTransformTimeEntries';

/**
 * Utility function to format detailed error messages for failed time entries
 */
const formatDetailedErrorMessages = (
  detailedErrors: Array<{
    index: number;
    date: string;
    duration: number;
    errorCode: string;
    message: string;
    subCode?: string;
  }>,
  intl: any,
): string => {
  if (!detailedErrors || detailedErrors.length === 0) {
    return intl.formatMessage({
      id: 'weekly.time.entry.save.error.general',
      defaultMessage: 'Something went wrong',
    });
  }

  const errorMessages = detailedErrors.map((error, index) => {
    const hours = Math.round((error.duration / 3600) * 100) / 100; // Convert seconds to hours
    const formattedDate = new Date(error.date).toLocaleDateString();

    // Use the actual error message from the API response
    let errorMessage = error.message;

    // Clean up the message if it's a raw API response
    if (errorMessage) {
      errorMessage = errorMessage
        .replace(/.*Details:\\n/, '') // Remove everything before "Details:"
        .replace(/\\n/g, '<br>') // Convert escaped newlines to HTML br tags
        .replace(
          /^The following fields are required:/,
          'the following fields are required:',
        ) // Convert "The" to "the"
        .trim();
    }

    // If the cleaned message is empty or just whitespace, fall back to mapped error
    if (!errorMessage || errorMessage.trim() === '') {
      const mappedError = mapTimeTrackingMutationError(
        intl,
        error.errorCode,
        error.subCode,
      );
      if (mappedError && mappedError !== 'catch.all.error.content') {
        errorMessage = mappedError;
      } else {
        errorMessage = intl.formatMessage({
          id: 'weekly.time.entry.save.error.unknown',
          defaultMessage: 'Unknown error occurred',
        });
      }
    }

    return intl.formatMessage(
      {
        id: 'weekly.time.entry.save.error.detail',
        defaultMessage:
          '{index}. date {date} for {hours} hours failed due to: {errorMessage}',
      },
      {
        index: index + 1,
        date: formattedDate,
        hours,
        errorMessage,
      },
    );
  });

  return intl.formatMessage(
    {
      id: 'weekly.time.entry.save.error.header',
      defaultMessage: 'Time entries(s) failed to save:<br>{errorMessages}',
    },
    {
      errorMessages: errorMessages.join('<br>'),
    },
  );
};

/**
 * Interface defining the shape of the hook's return value
 * @interface UseSaveWeeklyTimeEntriesResult
 */
interface UseSaveWeeklyTimeEntriesResult {
  /** Function to trigger the save operation for weekly time entries */
  saveWeeklyTimeEntries: () => Promise<void>;
  /** Boolean indicating if the save operation is currently in progress */
  loading: boolean;
  /** The saved time entries data from the last successful operation, undefined if no save has completed */
  savedData: TimeTracking_BatchManageTimeEntriesResult | undefined;
  /** Boolean indicating if there are any time entries to save */
  hasDataToSave: boolean;
}

/**
 * Interface for the hook's input parameters
 * @interface UseSaveWeeklyTimeEntriesParams
 */
interface UseSaveWeeklyTimeEntriesParams {
  /** Optional callback to trigger data refetch after successful save */
  onSaveSuccess?: () => void;
}

/**
 * Custom hook for saving weekly time entries
 *
 * This hook provides functionality to save weekly time entries using Apollo GraphQL mutations.
 * It handles input data transformation from Redux state, error processing, loading states, and success callbacks.
 *
 * Key Features:
 * - Automatic input data transformation from Redux timeEntryGrid state
 * - Memoized input data to prevent unnecessary API calls
 * - Comprehensive error handling with logging
 * - Apollo Client integration with proper context configuration
 * - Redux integration ready (currently commented out)
 * - Duplicate call prevention through React's memoization
 * - Validation to ensure only valid time entries are saved
 *
 * @returns {UseSaveWeeklyTimeEntriesResult} Object containing save function, loading state, saved data, and validation status
 *
 */
export const useSaveWeeklyTimeEntries = (
  params: UseSaveWeeklyTimeEntriesParams = {},
): UseSaveWeeklyTimeEntriesResult => {
  const { onSaveSuccess } = params;
  const sandbox = useSandbox();
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const { transformToTimeEntries, extractTimeEntriesToDelete } =
    useTransformTimeEntries();

  // Get Redux state data
  const weeklyTimeEntries = useSelector((state: RootState) =>
    selectAllTimesheetRows(state),
  );
  const teamMember = useSelector((state: RootState) => selectTeamMember(state));
  const dateRange = useSelector((state: RootState) => selectDateRange(state));

  // Billable gating: company settings and customer assignments.
  const companySettings = useSelector((state: RootState) =>
    selectCompanySettings(state),
  );
  const customerAssignmentsMap = useSelector(
    (state: RootState) => state.assignments.customerAssignments,
  );

  // Dimension definitions drive create-time seeding of worker defaults in the
  // transform (untouched default → [defaultId], no default → []).
  const dimensionDefinitions = useSelector((state: RootState) =>
    selectDimensions(state),
  );

  /**
   * Memoized input data from Redux state for the save operation
   *
   * This data is automatically transformed from the current Redux timeEntryGrid state and only
   * regenerates when the state changes. This prevents unnecessary
   * API calls and ensures efficient re-rendering behavior.
   *
   * Structure:
   * - timeEntries: Array of transformed time entry objects ready for GraphQL mutation (CREATE/UPDATE)
   * - timeEntriesToDelete: Array of time entry IDs to be deleted (DELETE operations)
   */
  const inputData = useMemo(() => {
    // Only transform if we have valid team member data
    if (!teamMember || !weeklyTimeEntries) {
      return {
        timeEntries: [],
        timeEntriesToDelete: [],
        isExported: false,
      };
    }

    const timeEntryGridState = {
      weeklyTimeEntries,
      teamMember,
      dateRange, // Include current week from Redux state
    };

    const billableContext = {
      isBillingFieldEnabled: companySettings.isBillingFieldEnabled ?? false,
      customerAssignmentsMap,
    };

    const result = {
      timeEntries: transformToTimeEntries(
        timeEntryGridState,
        billableContext,
        dimensionDefinitions,
      ),
      timeEntriesToDelete: extractTimeEntriesToDelete(timeEntryGridState),
      isExported: false,
    };

    return result;
  }, [
    weeklyTimeEntries,
    teamMember,
    dateRange,
    transformToTimeEntries,
    extractTimeEntriesToDelete,
    sandbox, // Add sandbox to dependencies for logging
    companySettings,
    customerAssignmentsMap,
    dimensionDefinitions,
  ]);

  /**
   * Computed property to check if there are any time entries to save or delete
   * This helps prevent empty save operations
   * Now only considers changed entries and deletions
   */
  const hasDataToSave = useMemo(() => {
    sandbox.logger.info(
      WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS.PERFORMANCE
        .INPUT_DATA_DEBUG_FOR_SAVING_TIME_ENTRIES,
      inputData,
    );
    const hasTimeEntries = inputData.timeEntries.length > 0;
    const hasTimeEntriesToDelete = inputData.timeEntriesToDelete.length > 0;
    const result = hasTimeEntries || hasTimeEntriesToDelete;

    // Debug logging to help identify the issue
    sandbox.logger.info(
      WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS.PERFORMANCE
        .SAVE_TIME_ENTRIES_HAS_DATA_TO_SAVE,
      {
        hasTimeEntries,
        timeEntries: inputData.timeEntries.length,
        hasTimeEntriesToDelete,
        timeEntriesToDelete: inputData.timeEntriesToDelete.length,
        result,
      },
    );

    return result;
  }, [inputData.timeEntries, inputData.timeEntriesToDelete, sandbox]);

  /**
   * Error handler for Apollo mutations and general error processing
   *
   * Handles multiple error scenarios:
   * - Apollo GraphQL errors
   * - Custom time tracking mutation errors
   * - General V3/V1 errors with sub-codes
   *
   * @param errorCode - The error code or Apollo error object
   * @param message - Optional error message
   * @param details - Optional detailed error information
   * @param subCode - Optional sub-error code for specific error types
   */
  const handleError = useCallback(
    (
      errorCode: string | ApolloError | undefined,
      message = '',
      details = '',
      subCode = '',
    ) => {
      // Log the error for debugging and monitoring
      sandbox.logger.error(
        WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS.ERRORS.SAVE_TIME_ENTRIES_FAILED,
        {
          errorCode,
        },
      );

      /**
       * Custom error handler for specific error types
       * Handles GENERAL_V3_ERROR and GENERAL_V1_ERROR with special sub-code processing
       */
      const customErrorHandler = (error: string) => {
        if (
          (error === 'GENERAL_V3_ERROR' || error === 'GENERAL_V1_ERROR') &&
          subCode.trim()?.length > 0
        ) {
          return `${message} ${details}`;
        }
        // For TSHEET_SYNC_FAILED_FOR_WEEKLY_TIMESHEET, use only the details field if available
        if (
          error === 'TSHEET_SYNC_FAILED_FOR_WEEKLY_TIMESHEET' &&
          details.trim()?.length > 0
        ) {
          // Convert the details message to HTML format and remove everything before "Details:"
          const cleanedDetails = details.replace(/.*Details:\\n/, '');
          const htmlDetails = cleanedDetails.replace(/\\n/g, '<br>');
          return htmlDetails;
        }
        return mapTimeTrackingMutationError(intl, error);
      };

      // Map the error to a user-friendly message
      const mappedError = mapError({
        sourceComponent: 'useSaveWeeklyTimeEntries',
        sandbox,
        intl,
        error: errorCode,
        customErrorHandler,
      });
      if (mappedError) {
        sandbox.logger.error(mappedError);

        // Dispatch error to Redux store for global error state management
        dispatch(setSaveError(mappedError));
      }
    },
    [sandbox, intl],
  );

  /**
   * Apollo GraphQL mutation hook configuration
   *
   * Configured with:
   * - TIME_TRACKING client context for proper GraphQL endpoint routing
   * - cache-and-network fetch policy for optimal caching behavior
   * - Network status change notifications for loading state updates
   * - Completion and error callbacks for result processing
   */
  const [saveTimeEntries, { loading: saveLoading, error: saveError, data }] =
    useBatchSaveTimeEntriesMutation({
      context: {
        clientName: ApolloClientNames.TIME_TRACKING,
        fetchPolicy: 'cache-and-network',
        notifyOnNetworkStatusChange: true,
      },
      onError: (error) => {
        handleError(error);
      },
    });

  /**
   * Main save function for weekly time entries
   *
   * This function is memoized and only recreates when its dependencies change,
   * providing automatic duplicate call prevention through React's memoization.
   *
   * The function:
   * 1. Validates that there is data to save
   * 2. Triggers the Apollo GraphQL mutation with current input data
   * 3. Handles any thrown errors through the catch block
   * 4. Processes results through the onCompleted callback (clears deleted IDs on success)
   *
   * @returns Promise that resolves when the save operation completes
   */
  const saveWeeklyTimeEntries = useCallback(async () => {
    // Clear any previous save errors when starting a new save operation
    dispatch(clearSaveError());
    dispatch(clearDetailedSaveErrors());

    // Validate that we have data to save
    if (!hasDataToSave) {
      sandbox.logger.warn(
        WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS.PERFORMANCE.NO_TIME_ENTRIES_TO_SAVE,
      );
      return;
    }

    // Validate team member data
    if (!teamMember) {
      const error = new Error(
        'Team member is required for saving time entries',
      );
      handleError(
        'MISSING_TEAM_MEMBER',
        'Team member is required for saving time entries',
      );
      throw error;
    }

    // Create customer interaction for FCI tracking
    createCustomerInteraction(
      sandbox,
      TimeCustomerInteraction.WEEKLY_TIME_SHEET_SAVE,
    );

    try {
      // Store the payload in Redux for comparison with response
      dispatch(setSavePayload(inputData));

      // Log the save operation for debugging
      sandbox.logger.info(
        WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS.PERFORMANCE
          .INITIATE_SAVE_TIME_ENTRIES,
        {
          changedTimeEntries: inputData.timeEntries.length,
          timeEntriesToDelete: inputData.timeEntriesToDelete.length,
        },
      );

      // Execute the GraphQL mutation with current input data
      const result = await saveTimeEntries({
        variables: {
          input: inputData,
        },
        context: {
          headers: getCustomerInteractionPropagationHeaders(
            sandbox,
            TimeCustomerInteraction.WEEKLY_TIME_SHEET_SAVE,
          ),
        },
      });

      if (!result.data?.timeTrackingBatchManageTimeEntries) {
        handleError('Null Response');
        return; // Return early instead of throwing
      }

      // Check if the result contains an error
      if (
        result.data.timeTrackingBatchManageTimeEntries.__typename ===
        'TimeTracking_BatchManageTimeEntriesError'
      ) {
        const errorResponse = result.data.timeTrackingBatchManageTimeEntries;
        const errorMessage = errorResponse.message || 'Save operation failed';
        const errorDetails = errorResponse.details || '';

        handleError(
          errorResponse.errorCode,
          errorResponse.message,
          errorResponse.details,
          errorResponse.subCode,
        );

        // Check if error should be treated as degraded
        const isDegraded =
          shouldTreatWeeklyTimesheetErrorAsDegraded(errorDetails) ||
          shouldTreatWeeklyTimesheetErrorAsDegraded(errorMessage);

        if (isDegraded) {
          setInteractionDegraded(
            sandbox,
            TimeCustomerInteraction.WEEKLY_TIME_SHEET_SAVE,
            errorMessage,
          );
          sandbox.logger.info(
            'Weekly timesheet save marked as degraded due to DataSyncWorkflowActivityType error',
            {
              errorCode: errorResponse.errorCode,
              errorMessage,
              errorDetails,
            },
          );
        } else {
          endInteractionWithFailure(
            sandbox,
            TimeCustomerInteraction.WEEKLY_TIME_SHEET_SAVE,
            errorMessage,
          );
        }
        return; // Return early instead of throwing
      }

      // Handle success case
      if (
        result.data?.timeTrackingBatchManageTimeEntries?.__typename ===
        'TimeTracking_BatchManageTimeEntriesPayload'
      ) {
        // Success case - log the successful operation
        sandbox.logger.info(
          WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS.SUCCESS
            .WEEKLY_TIME_ENTRIES_SAVE_SUCCESS,
          {
            totalEntriesProcessed: inputData.timeEntries.length,
            successfulEntries:
              result.data.timeTrackingBatchManageTimeEntries.timeEntries
                ?.length || 0,
            failedEntries: 0,
            entriesToDelete: inputData.timeEntriesToDelete.length,
          },
        );

        // End customer interaction with success
        endInteractionWithSuccess(
          sandbox,
          TimeCustomerInteraction.WEEKLY_TIME_SHEET_SAVE,
        );

        // Clear any save errors on successful save
        dispatch(clearSaveError());
        dispatch(clearDetailedSaveErrors());
        dispatch(clearSavePayload());

        // Mark all existing entries as saved first
        dispatch(markAllEntriesAsSaved());

        // Clear CRUD operations only after successful save
        dispatch(clearDeletedTimeEntryIds());

        // Trigger data refetch to get the latest data from the server
        if (onSaveSuccess) {
          onSaveSuccess();
        }
      } else if (
        result.data?.timeTrackingBatchManageTimeEntries?.__typename ===
        'TimeTracking_PartialBatchManageTimeEntriesPayload'
      ) {
        // Partial success case - handle detailed errors
        const partialPayload = result.data.timeTrackingBatchManageTimeEntries;

        // Check if this is actually a successful response (all entries have IDs)
        const allEntriesHaveIds = partialPayload.timeEntries?.every(
          (entry: any) =>
            entry.id && entry.__typename === 'TimeTracking_TimeEntry',
        );

        if (allEntriesHaveIds) {
          // This is actually a successful response, not a partial success
          sandbox.logger.info(
            WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS.SUCCESS
              .WEEKLY_TIME_ENTRIES_SAVE_SUCCESS,
            {
              totalEntriesProcessed: inputData.timeEntries.length,
              successfulEntries: partialPayload.timeEntries?.length || 0,
              failedEntries: 0,
              entriesToDelete: inputData.timeEntriesToDelete.length,
            },
          );

          // End customer interaction with success
          endInteractionWithSuccess(
            sandbox,
            TimeCustomerInteraction.WEEKLY_TIME_SHEET_SAVE,
          );

          // Clear any save errors on successful save
          dispatch(clearSaveError());
          dispatch(clearDetailedSaveErrors());
          dispatch(clearSavePayload());

          // Mark all existing entries as saved first
          dispatch(markAllEntriesAsSaved());

          // Clear CRUD operations only after successful save
          dispatch(clearDeletedTimeEntryIds());

          // Trigger data refetch to get the latest data from the server
          if (onSaveSuccess) {
            onSaveSuccess();
          }
        } else {
          // This is a true partial success with some errors
          // Compare response with stored payload to identify failed entries
          const detailedErrors: Array<{
            index: number;
            date: string;
            duration: number;
            errorCode: string;
            message: string;
            subCode?: string;
          }> = [];

          // Get the stored payload for comparison
          const storedPayload = inputData; // We can access this from the closure

          // Compare each response entry with the corresponding payload entry
          partialPayload.timeEntries?.forEach(
            (responseEntry: any, index: number) => {
              if (
                responseEntry.__typename === 'TimeTracking_UpdateTimeEntryError'
              ) {
                // This entry failed - get the corresponding payload entry
                const payloadEntry = storedPayload.timeEntries?.[index];
                if (payloadEntry) {
                  detailedErrors.push({
                    index,
                    date: payloadEntry.date,
                    duration: payloadEntry.duration || 0,
                    errorCode: responseEntry.errorCode,
                    message: responseEntry.message,
                    subCode: responseEntry.subCode,
                  });
                }
              }
            },
          );

          // Log partial success with detailed counts
          sandbox.logger.info(
            WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS.SUCCESS
              .WEEKLY_TIME_ENTRIES_PARTIAL_SUCCESS,
            {
              totalEntriesProcessed: inputData.timeEntries.length,
              successfulEntries:
                (partialPayload.timeEntries?.length || 0) -
                detailedErrors.length,
              failedEntries: detailedErrors.length,
              entriesToDelete: inputData.timeEntriesToDelete.length,
              failedEntryDetails: detailedErrors.map((error) => ({
                index: error.index,
                date: error.date,
                errorCode: error.errorCode,
                message: error.message,
              })),
            },
          );

          // End customer interaction with partial success
          endInteractionWithSuccess(
            sandbox,
            TimeCustomerInteraction.WEEKLY_TIME_SHEET_PARTIAL_SAVE,
          );

          // Store detailed errors in Redux
          dispatch(setDetailedSaveErrors(detailedErrors));

          // Format and set the error message
          const errorMessage = formatDetailedErrorMessages(
            detailedErrors,
            intl,
          );
          dispatch(setSaveError(errorMessage));

          // Mark all existing entries as saved first
          dispatch(markAllEntriesAsSaved());

          // Clear CRUD operations only after successful save
          dispatch(clearDeletedTimeEntryIds());

          // Trigger data refetch to get the latest data from the server
          if (onSaveSuccess) {
            onSaveSuccess();
          }
        }
      }
    } catch (error) {
      // Handle any errors that occur during the mutation execution
      const apolloError = error as ApolloError;
      const errorMessage = apolloError.message || 'Unknown error occurred';

      handleError(apolloError);

      // Check if error should be treated as degraded
      const isDegraded =
        shouldTreatWeeklyTimesheetErrorAsDegraded(errorMessage);

      if (isDegraded) {
        setInteractionDegraded(
          sandbox,
          TimeCustomerInteraction.WEEKLY_TIME_SHEET_SAVE,
          errorMessage,
        );
        sandbox.logger.info(
          'Weekly timesheet save marked as degraded due to DataSyncWorkflowActivityType error in catch block',
          {
            errorMessage,
          },
        );
      } else {
        // End customer interaction with failure
        endInteractionWithFailure(
          sandbox,
          TimeCustomerInteraction.WEEKLY_TIME_SHEET_SAVE,
          errorMessage,
          error,
        );
      }

      // Re-throw the error to ensure the promise rejects
      throw error;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    inputData,
    saveTimeEntries,
    handleError,
    hasDataToSave,
    teamMember,
    intl,
    sandbox,
  ]);

  // Return the public API of the hook
  return {
    saveWeeklyTimeEntries,
    loading: saveLoading,
    savedData:
      data?.timeTrackingBatchManageTimeEntries as TimeTracking_PartialBatchManageTimeEntriesPayload,
    hasDataToSave,
  };
};
