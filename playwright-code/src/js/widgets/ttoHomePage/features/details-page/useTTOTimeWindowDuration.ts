import { useSandbox } from '@payroll/quicksand';
import { useCallback } from 'react';
import {
  useGetTotalWorkDurationByTimeWindowLazyQuery,
  TimeTracking_TotalDurationByTimeWindowInput,
} from 'src/__generated__/timeTracking/graphql';
import { EMPLOYEE_TIME_SUMMARY_BY_TIME_WINDOW_QUERY } from 'src/js/service/queries/timeTrackingQueries';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import {
  createCustomerInteraction,
  endInteractionWithSuccess,
  endInteractionWithFailure,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';

/**
 * Custom hook to lazily fetch total duration (in seconds) for a user/entity in a given time window (week or month).
 *
 * @returns [triggerQuery, { duration, loading, error }]
 */
export function useTTOTimeWindowDuration() {
  const logger = useLoggingConfig();
  const sandbox = useSandbox();
  const [triggerQuery, { data, loading, error }] =
    useGetTotalWorkDurationByTimeWindowLazyQuery({
      context: { clientName: ApolloClientNames.TIME_TRACKING },
      fetchPolicy: 'cache-and-network',
      onCompleted: (data) => {
        logger.info(
          'API call success: useGetTotalWorkDurationByTimeWindowLazyQuery',
          { data },
        );
        endInteractionWithSuccess(
          sandbox,
          TimeCustomerInteraction.TOTAL_DURATION_BY_TIME_WINDOW_READ,
        );
      },
      onError: (error) => {
        logger.error(
          'API call failure: useGetTotalWorkDurationByTimeWindowLazyQuery',
          { error },
        );
        endInteractionWithFailure(
          sandbox,
          TimeCustomerInteraction.TOTAL_DURATION_BY_TIME_WINDOW_READ,
          error.message,
          error,
        );
      },
    });

  // Wrap triggerQuery to create the interaction before firing the query
  const wrappedTriggerQuery = useCallback(
    (options?: Record<string, any>) => {
      createCustomerInteraction(
        sandbox,
        TimeCustomerInteraction.TOTAL_DURATION_BY_TIME_WINDOW_READ,
      );
      return triggerQuery({
        ...options,
        context: {
          ...(options?.context ?? {}),
          headers: {
            ...(options?.context?.headers ?? {}),
            ...getCustomerInteractionPropagationHeaders(
              sandbox,
              TimeCustomerInteraction.TOTAL_DURATION_BY_TIME_WINDOW_READ,
            ),
          },
        },
      });
    },
    [sandbox, triggerQuery],
  );

  const duration =
    data?.timeTrackingTotalDurationByTimeWindow?.totalDurationSeconds ?? null;

  return [wrappedTriggerQuery, { duration, loading, error }] as const;
}
