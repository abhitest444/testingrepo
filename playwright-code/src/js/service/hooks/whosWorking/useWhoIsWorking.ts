import { useLazyQuery } from '@apollo/client';
import { useSandbox } from '@payroll/quicksand';
import gql from 'graphql-tag';
import { useCallback, useMemo } from 'react';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';
import {
  WhoIsWorkingFilter,
  WhoIsWorkingOrderBy,
  WhoIsWorkingQueryData,
  WhoIsWorkingQueryVariables,
  WhoIsWorkingWorker,
  WhoIsWorkingSummary,
  PageInfo,
} from './types';
import { WHOS_WORKING_MAP_UNKNOWN_ERROR } from '../../../widgets/whosworking/constants';

/**
 * Who's Working related queries for Time Tracking
 * Defines queries inline to avoid codegen dependency on federated schema
 *
 * QUANTA-6283: Who's Working API Integration
 */

/**
 * Fragment for active time entry details
 * Includes fields needed for displaying current work context
 */
const WHO_IS_WORKING_TIME_ENTRY_FRAGMENT = gql`
  fragment WhoIsWorkingTimeEntryParts on TimeTracking_TimeEntry {
    id
    startTime
    duration
    isOpen
    timeAgainstContactDAS {
      customer {
        id
        displayName
      }
      project {
        id
        displayName
      }
    }
  }
`;

/**
 * Query to fetch workers with their current working status
 * Supports filtering by clock status, search, and date range
 * Supports ordering by various fields (ON_THE_CLOCK, CLOCK_IN_TIME, etc.)
 * Returns paginated results with cursor-based pagination
 */
const GET_WHO_IS_WORKING_QUERY = gql`
  query getWhoIsWorking(
    $first: Int = 20
    $after: String
    $filter: TimeTracking_WhoIsWorkingFilter!
    $orderBy: [TimeTracking_WhoIsWorkingOrderBy!]
  ) {
    timeTrackingWhoIsWorking(
      first: $first
      after: $after
      filter: $filter
      orderBy: $orderBy
    ) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      summary {
        totalOnClock
        totalWorkers
      }
      edges {
        cursor
        node {
          timeForContactDAS {
            id
          }
          firstName
          lastName
          displayName
          timeForType
          group {
            groupId
            groupName
          }
          totalDaySeconds
          activeTimeEntry {
            ...WhoIsWorkingTimeEntryParts
          }
          currentLocation {
            latitude
            longitude
          }
        }
      }
    }
  }
  ${WHO_IS_WORKING_TIME_ENTRY_FRAGMENT}
`;

/** Default page size for who's working query */
export const WHO_IS_WORKING_PAGE_SIZE = 100;

export interface UseWhoIsWorkingArgs {
  first?: number;
  after?: string;
  filter: WhoIsWorkingFilter;
  orderBy?: WhoIsWorkingOrderBy[];
}

export interface UseWhoIsWorkingResult {
  loading: boolean;
  workers: WhoIsWorkingWorker[];
  pageInfo: PageInfo | null;
  summary: WhoIsWorkingSummary | null;
  error: string | null;
  loadWhoIsWorking: (args: UseWhoIsWorkingArgs) => void;
  refetch: (args: UseWhoIsWorkingArgs) => Promise<void>;
}

/**
 * Custom hook to fetch workers with their current working status
 * Used in "Who's Working" feature to display workers on map and list
 * Supports filtering by clock status, search, and ordering
 *
 * QUANTA-6283: Who's Working API Integration
 */
export const useWhoIsWorking = (): UseWhoIsWorkingResult => {
  const sandbox = useSandbox();
  const isWorkforceUser = isWorkforceEnvironment(sandbox);

  const [loadQuery, { data, loading, error, refetch: apolloRefetch }] =
    useLazyQuery<WhoIsWorkingQueryData, WhoIsWorkingQueryVariables>(
      GET_WHO_IS_WORKING_QUERY,
      {
        fetchPolicy: 'no-cache',
        notifyOnNetworkStatusChange: true,
        ...(isWorkforceUser && {
          context: {
            headers: {
              'intuit-is-workforce-user': 'true',
            },
          },
        }),
        onCompleted: (response) => {
          if (response?.timeTrackingWhoIsWorking) {
            endInteractionWithSuccess(
              sandbox,
              TimeCustomerInteraction.WHO_IS_WORKING_LOAD,
            );
          }
        },
        onError: (err) => {
          const errorMessage = err?.message || WHOS_WORKING_MAP_UNKNOWN_ERROR;
          endInteractionWithFailure(
            sandbox,
            TimeCustomerInteraction.WHO_IS_WORKING_LOAD,
            errorMessage,
            err,
          );
        },
      },
    );

  // Extract workers from edges
  const workers = useMemo(
    () => data?.timeTrackingWhoIsWorking?.edges?.map((edge) => edge.node) || [],
    [data],
  );

  const pageInfo = data?.timeTrackingWhoIsWorking?.pageInfo || null;
  const summary = data?.timeTrackingWhoIsWorking?.summary || null;

  /**
   * Load workers with filter and optional pagination
   */
  const loadWhoIsWorking = useCallback(
    ({
      first = WHO_IS_WORKING_PAGE_SIZE,
      after,
      filter,
      orderBy,
    }: UseWhoIsWorkingArgs): void => {
      createCustomerInteraction(
        sandbox,
        TimeCustomerInteraction.WHO_IS_WORKING_LOAD,
      );

      loadQuery({
        variables: { first, after, filter, orderBy },
        context: {
          headers: getCustomerInteractionPropagationHeaders(
            sandbox,
            TimeCustomerInteraction.WHO_IS_WORKING_LOAD,
          ),
        },
      });
    },
    [loadQuery, sandbox],
  );

  /**
   * Refetch workers - refresh data
   */
  const refetch = useCallback(
    async (args: UseWhoIsWorkingArgs): Promise<void> => {
      createCustomerInteraction(
        sandbox,
        TimeCustomerInteraction.WHO_IS_WORKING_LOAD,
      );

      try {
        const variables = {
          first: args.first || WHO_IS_WORKING_PAGE_SIZE,
          after: args.after,
          filter: args.filter,
          orderBy: args.orderBy,
        };

        await apolloRefetch(variables);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        sandbox.logger.error('Error refetching who is working:', {
          error: err,
        });
        endInteractionWithFailure(
          sandbox,
          TimeCustomerInteraction.WHO_IS_WORKING_LOAD,
          errorMessage,
          err,
        );
      }
    },
    [apolloRefetch, sandbox],
  );

  return {
    loading,
    workers,
    pageInfo,
    summary,
    error: error?.message || null,
    loadWhoIsWorking,
    refetch,
  };
};

// Re-export types for convenience
export type {
  WhoIsWorkingFilter,
  WhoIsWorkingOrderBy,
  WhoIsWorkingWorker,
  WhoIsWorkingSummary,
  PageInfo,
} from './types';
