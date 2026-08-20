import { useEffect, useState, useCallback } from 'react';
import { useSandbox } from '@payroll/quicksand';
import moment from 'moment';
import {
  SearchTimeEntriesQuery_Query,
  TimeTracking_BillableStatus,
  TimeTracking_TimeEntriesInput,
  TimeTracking_TimeEntry,
  TimeTracking_TimeEntryFilter,
  TimeTracking_TimeEntryOrderOn,
  useSearchTimeEntriesLazyQuery,
} from 'src/__generated__/timeTracking/graphql';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import { Week } from 'src/js/widgets/weeklyTimeTrowser/components/WeekSelector';
import { Common_SortOrder } from 'src/__generated__/oigql/graphql';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import {
  hasAnyGraphQLError,
  extractGraphQLError,
} from 'src/js/service/utils/apolloErrorUtils';
import {
  FEATURE_FLAGS,
  TIME_SUMMARY_API_OPERATION,
  TIME_SUMMARY_API_STATUS,
} from 'src/js/common/constants';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import {
  computeHasTSheets,
  useGetEntitlements,
} from 'src/js/service/hooks/entitlements/useGetEntitlements';
import {
  buildTimeSummaryTimeActivityHeaders,
  logTimeSummaryTimeActivityApiConsumption,
  TIME_SUMMARY_API_NAMES,
} from 'src/js/service/utils/timeSummaryHeaderUtils';

export const mapSearchTimeEntriesResult = (
  data?: SearchTimeEntriesQuery_Query,
): TimeTracking_TimeEntry[] =>
  data?.timeTrackingTimeEntries?.edges?.map(
    (edge) => edge.node as TimeTracking_TimeEntry,
  ) || [];

export const getSearchTimeEntriesInput_byTransactionId = (
  transactionId?: string,
): TimeTracking_TimeEntriesInput => ({
  orderBy: [
    {
      orderOn: TimeTracking_TimeEntryOrderOn.Date,
      orderDirection: Common_SortOrder.Asc,
    },
  ],
  timeEntryFilter: {
    timeChargeTransactionId: {
      equals: transactionId,
    },
  },
});

// TRANSACTION_TIME_SEARCH
export const getAllSearchTimeEntriesInput = (
  isExported?: boolean,
  timeTrackingOnlyId?: string,
  timeSummaryFlow: boolean = false,
): TimeTracking_TimeEntriesInput => {
  const timeEntryFilter: TimeTracking_TimeEntryFilter = {
    billableStatus: {
      notEquals: TimeTracking_BillableStatus.NotBillable,
    },
  };

  if (timeTrackingOnlyId) {
    timeEntryFilter.timeForEntityId = {
      equals: timeTrackingOnlyId,
    };
  }

  // Add isExported filter only if it's explicitly provided
  if (isExported !== undefined) {
    timeEntryFilter.isExported = isExported;
  }

  return {
    orderBy: [
      {
        // Sort by Created time when time summary flow is active
        // TODO: Once time summary flow is 100% live, we can remove the time entry id based sorting
        orderOn: timeSummaryFlow
          ? TimeTracking_TimeEntryOrderOn.CreatedTime
          : TimeTracking_TimeEntryOrderOn.TimeEntryId,
        orderDirection: Common_SortOrder.Desc,
      },
    ],
    timeEntryFilter,
  };
};

// LAST_TIMESHEET_SEARCH
export const getLastWeekTimeEntriesInput = (
  week: Week,
  nameId: string,
  interval: number,
): TimeTracking_TimeEntriesInput => ({
  orderBy: [
    {
      orderOn: TimeTracking_TimeEntryOrderOn.Date,
      orderDirection: Common_SortOrder.Desc,
    },
    {
      orderOn: TimeTracking_TimeEntryOrderOn.TimeEntryId,
      orderDirection: Common_SortOrder.Asc,
    },
  ],
  timeEntryFilter: {
    date: {
      onOrAfter: moment(week.startDate.toDate())
        .subtract(interval, 'month')
        .format('YYYY-MM-DD'),
      before: week.startDate.format('YYYY-MM-DD'),
    },
    timeForEntityId: {
      equals: nameId,
    },
  },
});

export const getSearchTimeEntriesInput = (
  week: Week,
  nameId: string,
): TimeTracking_TimeEntriesInput => ({
  orderBy: [
    {
      orderOn: TimeTracking_TimeEntryOrderOn.TimeEntryId,
      orderDirection: Common_SortOrder.Asc,
    },
  ],
  timeEntryFilter: {
    date: {
      onOrAfter: week.startDate.format('YYYY-MM-DD'),
      onOrBefore: week.endDate.format('YYYY-MM-DD'),
    },
    timeForEntityId: {
      equals: nameId,
    },
  },
});

interface UseSearchTimeEntriesArgs {
  input: TimeTracking_TimeEntriesInput;
  txnId?: string;
  first?: number;
}

interface UseSearchTimeEntriesResult {
  loading: boolean;
  data?: TimeTracking_TimeEntry[];
  resetData: () => void;
}

export const useSearchTimeEntries = ({
  input,
  txnId,
}: UseSearchTimeEntriesArgs): UseSearchTimeEntriesResult => {
  const sandbox = useSandbox();
  const loggingConfigLogger = useLoggingConfig();
  const [localData, setLocalData] = useState<TimeTracking_TimeEntry[]>([]);

  const { isEnabled: isTimeEntryPrimaryDataSourceEnabled, settled } =
    useIXPFeatureFlag({
      flagName:
        FEATURE_FLAGS.QB_TIME_TRACKING_UI_TIME_ENTRY_PRIMARY_DATA_SOURCE,
    });

  const { data: entitlementGrants, loading: entitlementsLoading } =
    useGetEntitlements();

  const entitlementsIncludeTSheets = computeHasTSheets(entitlementGrants);

  const isTimeActivity = input.timeEntryFilter?.isExported !== false;
  // Check if entitlements are needed for the time activity header
  const needsEntitlementsForTimeActivityHeader =
    isTimeEntryPrimaryDataSourceEnabled && isTimeActivity;

  const resetData = useCallback(() => {
    setLocalData([]);
  }, []);

  const [searchTimeEntries, { loading }] = useSearchTimeEntriesLazyQuery({
    variables: {
      input,
    },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  const handleSuccess = useCallback(
    (result: SearchTimeEntriesQuery_Query | undefined) => {
      endInteractionWithSuccess(
        sandbox,
        TimeCustomerInteraction.SINGLE_TIME_SEARCH_BY_TXN_ID,
      );
      setLocalData(mapSearchTimeEntriesResult(result));
    },
    [sandbox],
  );

  const handleFailure = useCallback(
    (error) => {
      if (error) {
        endInteractionWithFailure(
          sandbox,
          TimeCustomerInteraction.SINGLE_TIME_SEARCH_BY_TXN_ID,
          error.message,
          error,
        );
      }
    },
    [sandbox],
  );

  useEffect(() => {
    // If the feature flag is not settled or the txn ID is not provided, return early
    // This makes sure that the query is not executed until we know how to proceed with the request
    if (!settled || !txnId) {
      return;
    }
    // If entitlements are needed for the time activity header and entitlements are still loading, return early
    if (needsEntitlementsForTimeActivityHeader && entitlementsLoading) {
      return;
    }

    createCustomerInteraction(
      sandbox,
      TimeCustomerInteraction.SINGLE_TIME_SEARCH_BY_TXN_ID,
    );
    const timeSummaryTAHeaders = buildTimeSummaryTimeActivityHeaders({
      isTimeEntryPrimaryDataSourceEnabled,
      isTimeActivityRequest: isTimeActivity,
      entitlementGrants,
      entitlementsReady: !entitlementsLoading,
    });
    searchTimeEntries({
      context: {
        clientName: ApolloClientNames.TIME_TRACKING,
        headers: {
          ...getCustomerInteractionPropagationHeaders(
            sandbox,
            TimeCustomerInteraction.SINGLE_TIME_SEARCH_BY_TXN_ID,
          ),
          ...timeSummaryTAHeaders,
        },
      },
    })
      .then((response) => {
        if (hasAnyGraphQLError(response)) {
          const errorToHandle = extractGraphQLError(response)!;
          logTimeSummaryTimeActivityApiConsumption(
            loggingConfigLogger,
            timeSummaryTAHeaders,
            {
              api: TIME_SUMMARY_API_NAMES.TIME_ACTIVITY_SEARCH,
              operation: TIME_SUMMARY_API_OPERATION.READ,
              status: TIME_SUMMARY_API_STATUS.FAILED,
              errorMessage: errorToHandle.message,
            },
          );
          handleFailure(errorToHandle);
        } else if (response.data) {
          logTimeSummaryTimeActivityApiConsumption(
            loggingConfigLogger,
            timeSummaryTAHeaders,
            {
              api: TIME_SUMMARY_API_NAMES.TIME_ACTIVITY_SEARCH,
              operation: TIME_SUMMARY_API_OPERATION.READ,
              status: TIME_SUMMARY_API_STATUS.SUCCESS,
            },
          );
          handleSuccess(response.data);
        }
        // Note: If no error and no data, we don't call handleFailure
        // Empty search results are valid (not an error condition)
      })
      .catch((err) => {
        logTimeSummaryTimeActivityApiConsumption(
          loggingConfigLogger,
          timeSummaryTAHeaders,
          {
            api: TIME_SUMMARY_API_NAMES.TIME_ACTIVITY_SEARCH,
            operation: TIME_SUMMARY_API_OPERATION.READ,
            status: TIME_SUMMARY_API_STATUS.FAILED,
            errorMessage:
              err instanceof Error ? err.message : String(err ?? ''),
          },
        );
        handleFailure(err);
      });
    // entitlementGrants omitted from deps: Apollo cache-and-network yields new array refs; entitlementsIncludeTSheets captures header-relevant changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    handleFailure,
    handleSuccess,
    loggingConfigLogger,
    sandbox,
    searchTimeEntries,
    txnId,
    settled,
    needsEntitlementsForTimeActivityHeader,
    entitlementsLoading,
    entitlementsIncludeTSheets,
    isTimeEntryPrimaryDataSourceEnabled,
    isTimeActivity,
  ]);

  return {
    loading,
    data: localData,
    resetData,
  };
};

export const useSearchTransactionTimeEntries = ({
  input,
  first,
}: UseSearchTimeEntriesArgs): UseSearchTimeEntriesResult => {
  const sandbox = useSandbox();
  const loggingConfigLogger = useLoggingConfig();
  const [localData, setLocalData] = useState<TimeTracking_TimeEntry[]>([]);
  const { isEnabled: isTimeEntryPrimaryDataSourceEnabled, settled } =
    useIXPFeatureFlag({
      flagName:
        FEATURE_FLAGS.QB_TIME_TRACKING_UI_TIME_ENTRY_PRIMARY_DATA_SOURCE,
      defaultValue: false,
    });

  const { data: txnEntitlementGrants, loading: txnEntitlementsLoading } =
    useGetEntitlements();

  const txnIsTimeActivity = input.timeEntryFilter?.isExported !== false;
  const txnNeedsEntitlementsForTimeActivityHeader =
    isTimeEntryPrimaryDataSourceEnabled && txnIsTimeActivity;

  const txnEntitlementsIncludeTSheets = computeHasTSheets(txnEntitlementGrants);

  const resetData = useCallback(() => {
    setLocalData([]);
  }, []);

  const [searchTimeEntries, { loading }] = useSearchTimeEntriesLazyQuery({
    variables: {
      input,
      first,
    },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  const handleSuccess = useCallback(
    (result: SearchTimeEntriesQuery_Query | undefined) => {
      endInteractionWithSuccess(
        sandbox,
        TimeCustomerInteraction.TRANSACTION_TIME_SEARCH,
      );
      setLocalData(mapSearchTimeEntriesResult(result));
    },
    [sandbox],
  );

  const handleFailure = useCallback(
    (error) => {
      if (error) {
        endInteractionWithFailure(
          sandbox,
          TimeCustomerInteraction.TRANSACTION_TIME_SEARCH,
          error.message,
          error,
        );
      }
    },
    [sandbox],
  );

  useEffect(() => {
    // If the feature flag is not settled, return early
    // This makes sure that the query is not executed until we know how to proceed with the request
    if (!settled) {
      return;
    }
    if (txnNeedsEntitlementsForTimeActivityHeader && txnEntitlementsLoading) {
      return;
    }
    createCustomerInteraction(
      sandbox,
      TimeCustomerInteraction.TRANSACTION_TIME_SEARCH,
    );
    const txnTimeSummaryTAHeaders = buildTimeSummaryTimeActivityHeaders({
      isTimeEntryPrimaryDataSourceEnabled,
      isTimeActivityRequest: txnIsTimeActivity,
      entitlementGrants: txnEntitlementGrants,
      entitlementsReady: !txnEntitlementsLoading,
    });
    searchTimeEntries({
      context: {
        clientName: ApolloClientNames.TIME_TRACKING,
        headers: {
          ...getCustomerInteractionPropagationHeaders(
            sandbox,
            TimeCustomerInteraction.TRANSACTION_TIME_SEARCH,
          ),
          ...txnTimeSummaryTAHeaders,
        },
      },
    })
      .then((response) => {
        if (hasAnyGraphQLError(response)) {
          const errorToHandle = extractGraphQLError(response)!;
          logTimeSummaryTimeActivityApiConsumption(
            loggingConfigLogger,
            txnTimeSummaryTAHeaders,
            {
              api: TIME_SUMMARY_API_NAMES.TIME_ACTIVITY_SEARCH,
              operation: TIME_SUMMARY_API_OPERATION.READ,
              status: TIME_SUMMARY_API_STATUS.FAILED,
              errorMessage: errorToHandle.message,
            },
          );
          handleFailure(errorToHandle);
        } else if (response.data) {
          logTimeSummaryTimeActivityApiConsumption(
            loggingConfigLogger,
            txnTimeSummaryTAHeaders,
            {
              api: TIME_SUMMARY_API_NAMES.TIME_ACTIVITY_SEARCH,
              operation: TIME_SUMMARY_API_OPERATION.READ,
              status: TIME_SUMMARY_API_STATUS.SUCCESS,
            },
          );
          handleSuccess(response.data);
        }
        // Note: If no error and no data, we don't call handleFailure
        // Empty search results are valid (not an error condition)
      })
      .catch((error) => {
        logTimeSummaryTimeActivityApiConsumption(
          loggingConfigLogger,
          txnTimeSummaryTAHeaders,
          {
            api: TIME_SUMMARY_API_NAMES.TIME_ACTIVITY_SEARCH,
            operation: TIME_SUMMARY_API_OPERATION.READ,
            status: TIME_SUMMARY_API_STATUS.FAILED,
            errorMessage:
              error instanceof Error ? error.message : String(error ?? ''),
          },
        );
        handleFailure(error);
      });
    // txnEntitlementGrants omitted from deps: Apollo cache-and-network yields new array refs; txnEntitlementsIncludeTSheets captures header-relevant changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    handleFailure,
    handleSuccess,
    loggingConfigLogger,
    sandbox,
    searchTimeEntries,
    settled,
    txnNeedsEntitlementsForTimeActivityHeader,
    txnEntitlementsLoading,
    txnEntitlementsIncludeTSheets,
    isTimeEntryPrimaryDataSourceEnabled,
    txnIsTimeActivity,
  ]);
  return {
    loading,
    data: localData,
    resetData,
  };
};

export const getReadWeeklyTimeEntriesInput = (
  week: Week,
  nameId: string,
): TimeTracking_TimeEntriesInput => {
  const baseFilter = {
    date: {
      onOrAfter: week.startDate.format('YYYY-MM-DD'),
      onOrBefore: week.endDate.format('YYYY-MM-DD'),
    },
    isExported: false,
  };

  // Only add timeForEntityId filter if nameId is provided and not empty
  if (nameId && nameId.trim() !== '') {
    return {
      orderBy: [
        {
          orderOn: TimeTracking_TimeEntryOrderOn.TimeEntryId,
          orderDirection: Common_SortOrder.Asc,
        },
      ],
      timeEntryFilter: {
        ...baseFilter,
        timeForEntityId: {
          equals: nameId,
        },
      },
    };
  }

  // Return filter without timeForEntityId when nameId is empty
  return {
    orderBy: [
      {
        orderOn: TimeTracking_TimeEntryOrderOn.TimeEntryId,
        orderDirection: Common_SortOrder.Asc,
      },
    ],
    timeEntryFilter: baseFilter,
  };
};
