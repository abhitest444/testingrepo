import { useEffect, useState, useCallback } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { LazyQueryExecFunction } from '@apollo/client';
import {
  Exact,
  GetTimeEntryQuery_Query,
  TimeTracking_TimeEntry,
  TimeTracking_TimeEntryInput,
  useGetTimeEntryLazyQuery,
} from 'src/__generated__/timeTracking/graphql';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import { UNIFICATION_EXPERIMENT_NAMESPACE } from 'src/js/common/ixpExperimentConfigs';
import { useIxpExperiment } from 'src/js/service/hooks/ixp/useIxpExperiment';
import { useGetTSheetsAccountInfo } from 'src/js/service/hooks/settings/useGetTSheetsAccountInfo';
import {
  hasAnyGraphQLError,
  extractGraphQLError,
} from 'src/js/service/utils/apolloErrorUtils';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';

export interface UseGetTimeEntryArgs {
  id?: string;
  isExported?: boolean;
}

type QueryType = LazyQueryExecFunction<
  GetTimeEntryQuery_Query,
  Exact<{
    input: TimeTracking_TimeEntryInput;
  }>
>;

interface UseGetTimeEntryResult {
  query: QueryType;
  loading: boolean;
  error?: string;
  data?: TimeTracking_TimeEntry;
  resetData: () => void;
}

export const useGetTimeEntry = ({
  id,
  isExported = true, // by default, will be used to get Single Time Activity (true)
}: UseGetTimeEntryArgs): UseGetTimeEntryResult => {
  const sandbox = useSandbox();
  const isWorkforceUser = isWorkforceEnvironment(sandbox);

  const {
    data: { isFreedata },
    loading: isFreedataLoading,
  } = useGetTSheetsAccountInfo();
  // Check if unification IXP feature flag is enabled
  const {
    isInTreatment: isIxpUnificationInTreatment,
    settled: isIxpUnificationSettled,
  } = useIxpExperiment(sandbox, {
    experimentNamespace: UNIFICATION_EXPERIMENT_NAMESPACE,
    namespace: 'timecapture-timeentries-ui',
    businessUnit: 'SBSEG',
  });

  const [getTimeEntry, { loading }] = useGetTimeEntryLazyQuery({
    variables: {
      input: {
        id: id!,
        isExported,
      },
    },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  const [localData, setLocalData] = useState<
    TimeTracking_TimeEntry | undefined
  >(undefined);

  const [localError, setLocalError] = useState<string | undefined>(undefined);

  // Determine customer interaction type based on isExported flag
  // isExported = true (default) → Time Activity → SINGLE_TIME_READ
  // isExported = false → Time Entry → SINGLE_TIME_SHEET_READ
  const customerInteractionType = isExported
    ? TimeCustomerInteraction.SINGLE_TIME_READ
    : TimeCustomerInteraction.SINGLE_TIME_SHEET_READ;

  const resetData = useCallback(() => {
    sandbox.logger.info(
      'Component=useGetTimeEntry Event=Resetting time entry data',
    );
    setLocalData(undefined);
    setLocalError(undefined);
  }, [sandbox, setLocalData, setLocalError]);

  const handleSuccess = useCallback(
    (timeEntry: TimeTracking_TimeEntry | undefined) => {
      // Here, single time entry is essentially a time entry with exported = false
      // Here, time entry is essentially a time activity with exported = true
      // the following nomenclature is not changed as it might impact existing dashboards
      const entryType =
        isExported === false ? 'single time entry' : 'time entry';
      sandbox.logger.info(
        `Component=useGetTimeEntry Event=Successfully fetched ${entryType} for timeEntryId=${id}`,
      );
      endInteractionWithSuccess(sandbox, customerInteractionType);
      setLocalData(timeEntry);
      setLocalError(undefined); // Clear any previous errors on success
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sandbox, isExported, customerInteractionType],
  );

  const handleFailure = useCallback(
    (error) => {
      if (error) {
        // single time entry is essentially a time entry with exported = false
        // time entry is essentially a time activity with exported = true
        // the following nomenclature is not changed as it might impact existing dashboards
        const entryType =
          isExported === false ? 'single time entry' : 'time entry';
        const errorMessage = error.message || 'Unknown error occurred';

        sandbox.logger.error(
          `Component=useGetTimeEntry Event=Error fetching ${entryType} for timeEntryId=${id}`,
          {
            error: errorMessage,
          },
        );
        endInteractionWithFailure(
          sandbox,
          customerInteractionType,
          errorMessage,
          error,
        );
        setLocalError(errorMessage); // Set the local error state
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sandbox, isExported, customerInteractionType],
  );

  useEffect(() => {
    if (!isIxpUnificationSettled || isFreedataLoading) {
      return;
    }
    sandbox.logger.info(
      `Component=useGetTimeEntry Event=Initiating time entry fetch timeEntryId=${id}, isIxpUnificationSettled=${isIxpUnificationSettled}, isFreedataLoading=${isFreedataLoading}`,
    );
    // if there is no id then we return early with no loading or error
    if (id) {
      sandbox.logger.info(
        `Component=useGetTimeEntry Event=Executing GraphQL query with timeEntryId=${id} and isExported=${isExported}`,
      );
      createCustomerInteraction(sandbox, customerInteractionType);
      getTimeEntry({
        context: {
          clientName: ApolloClientNames.TIME_TRACKING,
          headers: {
            ...getCustomerInteractionPropagationHeaders(
              sandbox,
              customerInteractionType,
            ),
            ...(isWorkforceUser && {
              'intuit-is-workforce-user': 'true',
            }),
            ...(isIxpUnificationInTreatment &&
              isFreedata && {
                'intuit-qbtime-unification': 'true',
              }),
          },
        },
      })
        .then((response) => {
          if (hasAnyGraphQLError(response)) {
            const errorToHandle = extractGraphQLError(response)!;
            handleFailure(errorToHandle);
          } else if (response.data?.timeTrackingTimeEntry) {
            // Only call success if we actually have data
            handleSuccess(
              response.data.timeTrackingTimeEntry as TimeTracking_TimeEntry,
            );
          } else {
            // Data is null but no errors array - shouldn't happen but handle defensively
            sandbox.logger.warn(
              `Component=useGetTimeEntry Event=No data returned from server for timeEntryId=${id}`,
            );
            handleFailure({
              message: 'No data returned from server',
              name: 'NoDataError',
            });
          }
        })
        .catch(handleFailure);
    }
  }, [
    id,
    isExported,
    isIxpUnificationSettled,
    isFreedataLoading,
    isFreedata,
    getTimeEntry,
    sandbox,
    handleSuccess,
    handleFailure,
    isIxpUnificationInTreatment,
    customerInteractionType,
  ]);

  // Wrap the query to be able to handle manual calls as well
  // This ensures handleSuccess/handleFailure are called to update localData, localError properly
  const getTimeEntryQuery: QueryType = useCallback(
    (options) =>
      getTimeEntry(options)
        .then((response) => {
          if (hasAnyGraphQLError(response)) {
            const errorToHandle = extractGraphQLError(response)!;
            handleFailure(errorToHandle);
          } else if (response.data?.timeTrackingTimeEntry) {
            // Only call success if we actually have data
            handleSuccess(
              response.data.timeTrackingTimeEntry as TimeTracking_TimeEntry,
            );
          } else {
            // Data is null but no errors array - shouldn't happen but handle defensively
            handleFailure({
              message: 'No data returned from server',
              name: 'NoDataError',
            });
          }
          return response;
        })
        .catch((error) => {
          handleFailure(error);
          throw error;
        }),
    [getTimeEntry, handleSuccess, handleFailure],
  );

  return {
    query: getTimeEntryQuery,
    loading,
    error: localError,
    data: localData,
    resetData,
  };
};
