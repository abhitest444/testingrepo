import { useCallback, useMemo } from 'react';
import { useSandbox } from '@payroll/quicksand';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  setInteractionDegraded,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import {
  TimeForAssignment,
  PageInfo,
} from 'src/js/service/types/assignmentTypes';
import { useGetTimeForAssignmentsLazyQuery } from 'src/__generated__/timeTracking/graphql';
import { getAssignmentApolloClient } from 'src/js/service/AssignmentApolloClient';

export interface UseTimeForAssignmentsArgs {
  first?: number;
  after?: string;
  input: {
    projectId?: string;
    customerId?: string;
    customFieldOptionId?: string;
    customFieldId?: string;
    standardFieldLabel?: string;
    standardFieldOption?: string;
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

export interface UseTimeForAssignmentsResult {
  loading: boolean;
  data: TimeForAssignment[];
  error: string | null;
  loadTimeForAssignments: (args: UseTimeForAssignmentsArgs) => void;
  pageInfo: PageInfo | null;
  totalTimeForCount: number | null;
}

/** Optional FCI overrides for callers that need a different interaction name
 * or degraded-instead-of-failure semantics (e.g. the @-mention worker search,
 * a secondary non-blocking read). Defaults preserve the original behavior:
 * the shared TIME_FOR_ASSIGNMENT_READ interaction, hard-failure on error. */
export interface UseTimeForAssignmentsOptions {
  interactionName?: TimeCustomerInteraction;
  degradeOnFailure?: boolean;
}

/**
 * Hook to fetch time for assignments
 * Returns workers and their assignment status for a given scope
 *
 * Fetches 100 records by default. User can manually handle pagination using pageInfo.
 */
export const useTimeForAssignments = (
  options?: UseTimeForAssignmentsOptions,
): UseTimeForAssignmentsResult => {
  const sandbox = useSandbox();
  const interactionName =
    options?.interactionName ??
    TimeCustomerInteraction.TIME_FOR_ASSIGNMENT_READ;
  const degradeOnFailure = options?.degradeOnFailure ?? false;

  // Get assignment Apollo client that removes __typename to prevent backend auto-stitching issues
  const assignmentClient = getAssignmentApolloClient(sandbox);

  const [loadQuery, { data, loading, error }] =
    useGetTimeForAssignmentsLazyQuery({
      client: assignmentClient ?? undefined, // Use assignments client that removes __typename
      fetchPolicy: 'cache-and-network',
      notifyOnNetworkStatusChange: true,
      onCompleted: () => {
        sandbox.logger.info(
          'Component=useTimeForAssignments Event=Successfully fetched time for assignments',
        );
        endInteractionWithSuccess(sandbox, interactionName);
      },
      onError: (err) => {
        sandbox.logger.error(
          'Component=useTimeForAssignments Event=Error fetching time for assignments',
          { error: err.message },
        );
        // Secondary reads (e.g. @-mention search) report degraded, not failure.
        if (degradeOnFailure) {
          setInteractionDegraded(sandbox, interactionName, err.message);
        } else {
          endInteractionWithFailure(sandbox, interactionName, err.message, err);
        }
      },
    });

  const loadTimeForAssignments = useCallback(
    ({
      first = 100,
      after,
      input,
      filter,
      fetchPolicy = 'cache-and-network',
    }: UseTimeForAssignmentsArgs): void => {
      createCustomerInteraction(sandbox, interactionName);

      loadQuery({
        variables: { first, after, input, filter },
        context: {
          headers: getCustomerInteractionPropagationHeaders(
            sandbox,
            interactionName,
          ),
        },
        fetchPolicy,
      });
    },
    [sandbox, loadQuery, interactionName],
  );

  const transformedData = useMemo(() => {
    if (!data?.timeTrackingTimeForAssignments?.edges) {
      return [];
    }

    return data.timeTrackingTimeForAssignments.edges.map((edge) => edge.node);
  }, [data]);

  const pageInfo = useMemo(() => {
    if (!data?.timeTrackingTimeForAssignments?.pageInfo) {
      return null;
    }

    return {
      hasNextPage:
        data.timeTrackingTimeForAssignments.pageInfo.hasNextPage || false,
      hasPreviousPage:
        data.timeTrackingTimeForAssignments.pageInfo.hasPreviousPage || false,
      startCursor:
        data.timeTrackingTimeForAssignments.pageInfo.startCursor || undefined,
      endCursor:
        data.timeTrackingTimeForAssignments.pageInfo.endCursor || undefined,
    };
  }, [data]);

  const totalTimeForCount = useMemo(
    () => data?.timeTrackingTimeForAssignments?.totalTimeForCount ?? null,
    [data],
  );

  return {
    loading,
    data: transformedData,
    error: error?.message || null,
    loadTimeForAssignments,
    pageInfo,
    totalTimeForCount,
  };
};
