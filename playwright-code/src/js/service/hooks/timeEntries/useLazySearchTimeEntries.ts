import { useCallback, useEffect, useState } from 'react';
import { useIntl, useSandbox } from '@payroll/quicksand';
import { LazyQueryExecFunction } from '@apollo/client';
import {
  Exact,
  SearchTimeEntriesQuery_Query,
  TimeTracking_TimeEntriesInput,
  TimeTracking_TimeEntry,
  useSearchTimeEntriesLazyQuery,
} from 'src/__generated__/timeTracking/graphql';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import { mapError } from 'src/js/service/utils/mapError';
import { mapSearchTimeEntriesResult } from 'src/js/service/hooks/timeEntries/useSearchTimeEntries';
import {
  endInteractionWithFailure,
  endInteractionWithSuccess,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction'; // TODO map the additional inputs for search

// TODO map the additional inputs for search
type QueryType = LazyQueryExecFunction<
  SearchTimeEntriesQuery_Query,
  Exact<{
    input: TimeTracking_TimeEntriesInput;
    first?: number | undefined;
    after?: string | undefined;
    offset?: number | undefined;
  }>
>;

interface UseLazySearchTimeEntriesResult {
  query: QueryType;
  loading: boolean;
  error?: string;
  // since need to show error in empty array scenario, this can be undefined to start
  data?: TimeTracking_TimeEntry[];
  resetData: () => void;
}

export const useLazySearchTimeEntries = (): UseLazySearchTimeEntriesResult => {
  const sandbox = useSandbox();
  const intl = useIntl();

  const [query, { loading, error, data: queryData }] =
    useSearchTimeEntriesLazyQuery({
      context: {
        clientName: ApolloClientNames.TIME_TRACKING,
      },
      fetchPolicy: 'cache-and-network',
      notifyOnNetworkStatusChange: true,
    });

  const [data, setData] = useState<TimeTracking_TimeEntry[] | undefined>(
    undefined,
  );

  const handleSuccess = (TimeEntries: TimeTracking_TimeEntry[]) => {
    endInteractionWithSuccess(
      sandbox,
      TimeCustomerInteraction.WEEKLY_TIME_READ,
    );
    setData(TimeEntries);
  };

  const handleFailure = (): string | undefined => {
    if (error) {
      endInteractionWithFailure(
        sandbox,
        TimeCustomerInteraction.WEEKLY_TIME_READ,
        error.message as string,
      );
    }
    return mapError({
      sourceComponent: 'useLazySearchTimeEntries',
      sandbox,
      intl,
      error,
    });
  };

  useEffect(() => {
    if (!loading && queryData) {
      handleSuccess(mapSearchTimeEntriesResult(queryData));
    }
  }, [queryData, loading]);

  // Function to reset the data state
  const resetData = useCallback(() => {
    setData(undefined);
  }, []);

  return {
    query,
    loading,
    error: handleFailure(),
    data,
    resetData,
  };
};
