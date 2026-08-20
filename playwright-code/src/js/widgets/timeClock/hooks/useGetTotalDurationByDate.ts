import { useEffect, useState, useCallback, useRef } from 'react';
import { useIntl, useSandbox } from '@payroll/quicksand';
import { ApolloError, useLazyQuery } from '@apollo/client';
import {
  TimeTracking_TotalDurationByDate,
  TimeTracking_TotalDurationByDateInput,
  TimeTracking_TotalDurationByDateEdge,
} from 'src/__generated__/timeTracking/graphql';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import { mapError } from 'src/js/service/utils/mapError';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import { mapTimeTrackingMutationError } from 'src/js/service/errors/timeTrackingErrors';
import { GET_TOTAL_DURATION_BY_DATE_QUERY } from 'src/js/service/queries/timeTrackingQueries';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';

export interface UseGetTotalDurationByDateArgs {
  input?: TimeTracking_TotalDurationByDateInput;
  onSuccess?: (data: TimeTracking_TotalDurationByDate[]) => void;
  onError?: (error: string) => void;
}

interface UseGetTotalDurationByDateResult {
  loading: boolean;
  error?: string;
  data?: TimeTracking_TotalDurationByDate[];
  refetch: () => void;
}

export const useGetTotalDurationByDate = ({
  input,
  onSuccess,
  onError,
}: UseGetTotalDurationByDateArgs): UseGetTotalDurationByDateResult => {
  const sandbox = useSandbox();
  const intl = useIntl();
  const [data, setData] = useState<TimeTracking_TotalDurationByDate[]>([]);
  const [error, setError] = useState<string | undefined>(undefined);
  // In Workforce, `input` is valid on first render (employeeId is supplied
  // synchronously by WidgetLoader). Initialize the ref to `undefined` so the
  // first effect run detects a change and fires the fetch. QBO retains the
  // legacy behavior of seeding the ref with the first input value.
  const inputRef = useRef<TimeTracking_TotalDurationByDateInput | undefined>(
    isWorkforceEnvironment(sandbox) ? undefined : input,
  );

  const [getTotalDurationByDate, { loading }] = useLazyQuery(
    GET_TOTAL_DURATION_BY_DATE_QUERY,
    {
      variables: {
        input,
      },
      fetchPolicy: 'cache-and-network',
      notifyOnNetworkStatusChange: true,
    },
  );

  const handleSuccess = useCallback(
    (result: TimeTracking_TotalDurationByDate[] | undefined) => {
      endInteractionWithSuccess(
        sandbox,
        TimeCustomerInteraction.TOTAL_DURATION_BY_DATE_OR_WEEK_READ,
      );
      setData(result || []);
      setError(undefined);
      if (onSuccess) {
        onSuccess(result || []);
        sandbox.logger.info(
          '[Clock In/Out Flow] - useGetTotalDurationByDate - Success',
          { result },
        );
      }
    },
    [sandbox, onSuccess],
  );

  const handleError = useCallback(
    (error: string | ApolloError | undefined) => {
      if (error) {
        sandbox.logger.logException(
          '[Clock In/Out Flow] - useGetTotalDurationByDate - Error',
          error instanceof Error ? error : new Error(error),
        );
        endInteractionWithFailure(
          sandbox,
          TimeCustomerInteraction.TOTAL_DURATION_BY_DATE_OR_WEEK_READ,
          error instanceof ApolloError ? error.message : error,
        );
        const mappedError = mapError({
          sourceComponent: 'useGetTotalDurationByDate',
          sandbox,
          intl,
          error,
          customErrorHandler: (error) =>
            mapTimeTrackingMutationError(intl, error),
        });
        setError(mappedError);
        if (onError && mappedError) {
          onError(mappedError);
        }
      }
    },
    [sandbox, intl, onError],
  );

  const fetchData = useCallback(async () => {
    sandbox.logger.info(
      '[Clock In/Out Flow] - useGetTotalDurationByDate - Fetching data',
      { input },
    );
    createCustomerInteraction(
      sandbox,
      TimeCustomerInteraction.TOTAL_DURATION_BY_DATE_OR_WEEK_READ,
    );
    try {
      const response = await getTotalDurationByDate({
        context: {
          clientName: ApolloClientNames.TIME_TRACKING,
          headers: getCustomerInteractionPropagationHeaders(
            sandbox,
            TimeCustomerInteraction.TOTAL_DURATION_BY_DATE_OR_WEEK_READ,
          ),
        },
      });

      if (response.error) {
        handleError(response.error);
      } else {
        handleSuccess(
          response.data?.timeTrackingTotalDurationByDate?.edges?.map(
            (edge: TimeTracking_TotalDurationByDateEdge) => edge.node,
          ),
        );
      }
    } catch (error) {
      handleError(error as ApolloError);
    }
  }, [getTotalDurationByDate, sandbox, handleSuccess, handleError]);

  useEffect(() => {
    // Check if input has actually changed to prevent unnecessary data fetches
    const inputChanged =
      JSON.stringify(inputRef.current) !== JSON.stringify(input);

    if (input && inputChanged) {
      inputRef.current = input;
      fetchData();
    }
  }, [input, fetchData]);

  return {
    loading,
    error,
    data,
    refetch: fetchData,
  };
};
