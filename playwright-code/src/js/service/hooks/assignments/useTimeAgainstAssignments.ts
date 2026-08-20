import { useCallback, useMemo } from 'react';
import { useSandbox } from '@payroll/quicksand';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import {
  TimeAgainstAssignment,
  PageInfo,
} from 'src/js/service/types/assignmentTypes';
import { useGetTimeAgainstAssignmentsLazyQuery } from 'src/__generated__/timeTracking/graphql';
import { getAssignmentApolloClient } from 'src/js/service/AssignmentApolloClient';

export interface UseTimeAgainstAssignmentsArgs {
  first?: number;
  after?: string;
  input: {
    timeForEntityId?: string;
    standardFieldLabel?: string;
    standardFieldOption?: string;
    customFieldId?: string;
    customFieldOptionId?: string;
  };
  filter?: {
    searchText?: string;
    assigned?: boolean;
  };
  fetchPolicy?:
    | 'cache-first'
    | 'cache-and-network'
    | 'network-only'
    | 'no-cache';
}

export interface UseTimeAgainstAssignmentsResult {
  loading: boolean;
  data: TimeAgainstAssignment[];
  error: string | null;
  loadTimeAgainstAssignments: (args: UseTimeAgainstAssignmentsArgs) => void;
  pageInfo: PageInfo | null;
  totalTimeAgainstCount: number | null;
}

/**
 * Hook to fetch time against assignments
 * Returns time against entities (customers/projects) and their assignment status
 *
 * Fetches 100 records by default. User can manually handle pagination using pageInfo.
 */
export const useTimeAgainstAssignments =
  (): UseTimeAgainstAssignmentsResult => {
    const sandbox = useSandbox();

    // Get assignment Apollo client that removes __typename to prevent backend auto-stitching issues
    const assignmentClient = getAssignmentApolloClient(sandbox);

    const [loadQuery, { data, loading, error }] =
      useGetTimeAgainstAssignmentsLazyQuery({
        client: assignmentClient ?? undefined, // Use assignments client that removes __typename
        fetchPolicy: 'cache-and-network',
        notifyOnNetworkStatusChange: true,
        onCompleted: () => {
          sandbox.logger.info(
            'Component=useTimeAgainstAssignments Event=Successfully fetched time against assignments',
          );
          endInteractionWithSuccess(
            sandbox,
            TimeCustomerInteraction.TIME_AGAINST_ASSIGNMENT_READ,
          );
        },
        onError: (err) => {
          sandbox.logger.error(
            'Component=useTimeAgainstAssignments Event=Error fetching time against assignments',
            { error: err.message },
          );
          endInteractionWithFailure(
            sandbox,
            TimeCustomerInteraction.TIME_AGAINST_ASSIGNMENT_READ,
            err.message,
            err,
          );
        },
      });

    const loadTimeAgainstAssignments = useCallback(
      ({
        first = 100,
        after,
        input,
        filter,
        fetchPolicy = 'cache-and-network',
      }: UseTimeAgainstAssignmentsArgs): void => {
        createCustomerInteraction(
          sandbox,
          TimeCustomerInteraction.TIME_AGAINST_ASSIGNMENT_READ,
        );

        loadQuery({
          variables: { first, after, input, filter },
          context: {
            headers: getCustomerInteractionPropagationHeaders(
              sandbox,
              TimeCustomerInteraction.TIME_AGAINST_ASSIGNMENT_READ,
            ),
          },
          fetchPolicy,
        });
      },
      [sandbox, loadQuery],
    );

    const transformedData = useMemo(() => {
      if (!data?.timeTrackingTimeAgainstAssignments?.edges) {
        return [];
      }

      return data.timeTrackingTimeAgainstAssignments.edges.map(
        (edge) => edge.node,
      );
    }, [data]);

    const pageInfo = useMemo(() => {
      if (!data?.timeTrackingTimeAgainstAssignments?.pageInfo) {
        return null;
      }

      return {
        hasNextPage:
          data.timeTrackingTimeAgainstAssignments.pageInfo.hasNextPage || false,
        hasPreviousPage:
          data.timeTrackingTimeAgainstAssignments.pageInfo.hasPreviousPage ||
          false,
        startCursor:
          data.timeTrackingTimeAgainstAssignments.pageInfo.startCursor ||
          undefined,
        endCursor:
          data.timeTrackingTimeAgainstAssignments.pageInfo.endCursor ||
          undefined,
      };
    }, [data]);

    const totalTimeAgainstCount = useMemo(
      () =>
        data?.timeTrackingTimeAgainstAssignments?.totalTimeAgainstCount ?? null,
      [data],
    );

    return {
      loading,
      data: transformedData,
      error: error?.message || null,
      loadTimeAgainstAssignments,
      pageInfo,
      totalTimeAgainstCount,
    };
  };
