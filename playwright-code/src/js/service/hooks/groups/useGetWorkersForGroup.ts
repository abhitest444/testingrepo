import { useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useLazyQuery } from '@apollo/client';
import { useSandbox } from '@payroll/quicksand';
import {
  createCustomerInteraction,
  endInteractionWithSuccess,
  endInteractionWithFailure,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import { SEARCH_GROUP_WORKERS_QUERY } from 'src/js/service/queries/timeTrackingGroupQueries';
import {
  setWorkersForGroup,
  appendWorkersForGroup,
  setWorkersLoadingForGroup,
} from 'src/js/widgets/assignments/store/workersGroupViewSlice';
import { WorkerStatus } from 'src/js/widgets/assignments/components/WorkerAssignments/WorkersTableByGroupsView/constants';
import type {
  SearchGroupWorkersQuery,
  SearchGroupWorkersQueryVariables,
  TimeTracking_TimeForType,
} from 'src/__generated__/timeTracking/graphql';

/**
 * Arguments for loading members (workers) for a specific group
 */
export interface UseGetWorkersForGroupArgs {
  groupId: string;
  first?: number;
  after?: string;
  append?: boolean;
  searchText?: string;
  types?: TimeTracking_TimeForType[];
}

/**
 * Custom hook to fetch workers (members) for a specific group
 * Supports cursor-based pagination for infinite scroll
 *
 * ARCHITECTURE: Three-layer slice structure
 * SLICE 1: Groups list with sequential pagination (prev/next)
 * SLICE 2: Nested workers for each group (cursor-based pagination)
 * SLICE 3: Nested workers infinite scroll with cursor-based pagination
 */
export const useGetWorkersForGroup = () => {
  const sandbox = useSandbox();
  const dispatch = useDispatch();

  // Track cursor history for backward pagination
  // Stores the 'after' cursor used to fetch each page
  // When on page N, history has N-1 entries (page 1 has no history)
  const cursorHistoryRef = useRef<(string | undefined)[]>([]);

  // Track the current 'after' cursor (what was used to fetch current page)
  const currentAfterRef = useRef<string | undefined>(undefined);

  const [searchWorkersQuery, { loading, error, data }] = useLazyQuery<
    SearchGroupWorkersQuery,
    SearchGroupWorkersQueryVariables
  >(SEARCH_GROUP_WORKERS_QUERY, {
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  // Get pageInfo and totalCount from the last query result
  const pageInfo = data?.members?.pageInfo || null;
  const totalCount = data?.members?.totalCount ?? null;

  const loadWorkersForGroup = useCallback(
    async ({
      groupId,
      first = 20,
      after,
      append = false,
      searchText,
      types,
    }: UseGetWorkersForGroupArgs) => {
      createCustomerInteraction(
        sandbox,
        TimeCustomerInteraction.GROUP_MEMBERS_READ,
      );

      // Reset cursor history and tracking when loading fresh data
      if (!after) {
        cursorHistoryRef.current = [];
        currentAfterRef.current = undefined;
      } else {
        currentAfterRef.current = after;
      }

      // Set loading state for both initial and append loads
      dispatch(setWorkersLoadingForGroup({ groupId, loading: true }));

      try {
        // Always use search API with optional searchText and types
        const searchResult = await searchWorkersQuery({
          variables: {
            groupId,
            searchText: searchText?.trim() || undefined,
            types: types || undefined,
            first,
            after,
          },
          context: {
            headers: getCustomerInteractionPropagationHeaders(
              sandbox,
              TimeCustomerInteraction.GROUP_MEMBERS_READ,
            ),
          },
        });

        endInteractionWithSuccess(
          sandbox,
          TimeCustomerInteraction.GROUP_MEMBERS_READ,
        );

        // Extract members from search results (no longer need managers separately)
        const membersConnection = searchResult.data?.members;
        const membersList =
          membersConnection?.edges.map((edge) => edge.node) || [];

        // Create workers list - check if worker manages this group
        const workers = membersList.map((member) => {
          const fullName = `${member.firstName || ''} ${
            member.lastName || ''
          }`.trim();
          const isGroupLead =
            member.managesGroups?.some((group) => group.id === groupId) ||
            false;

          return {
            id: member.id,
            name: member.displayName || fullName || '',
            status: member.isActive
              ? WorkerStatus.ACTIVE
              : WorkerStatus.INACTIVE,
            role: member.type,
            isGroupLead,
          };
        });

        const cursor = membersConnection?.pageInfo.endCursor || null;
        const hasMore = membersConnection?.pageInfo.hasNextPage || false;

        // Dispatch results
        if (append) {
          dispatch(
            appendWorkersForGroup({
              groupId,
              workers,
              cursor,
              hasMore,
            }),
          );
        } else {
          dispatch(
            setWorkersForGroup({
              groupId,
              workers,
              cursor,
              hasMore,
              isSearchResult: !!searchText,
            }),
          );
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        sandbox.logger.error('Failed to load members for group', {
          error: errorMessage,
        });
        endInteractionWithFailure(
          sandbox,
          TimeCustomerInteraction.GROUP_MEMBERS_READ,
          errorMessage,
          err,
        );
        throw err;
      }
    },
    [sandbox, searchWorkersQuery, dispatch],
  );

  // Fetch next page for pagination
  const fetchNextPage = useCallback(
    async (args: Omit<UseGetWorkersForGroupArgs, 'append'>) => {
      if (!pageInfo?.hasNextPage || !pageInfo?.endCursor) {
        return undefined;
      }

      // Store the cursor we used to fetch the CURRENT page
      // This allows us to return to the current page when going backward
      cursorHistoryRef.current.push(currentAfterRef.current);

      // Update current cursor to the one we're about to use
      const nextCursor = pageInfo.endCursor;
      currentAfterRef.current = nextCursor;

      try {
        return await loadWorkersForGroup({
          ...args,
          after: nextCursor,
          append: false,
        });
      } catch (err) {
        // Restore on error
        cursorHistoryRef.current.pop();
        currentAfterRef.current =
          cursorHistoryRef.current[cursorHistoryRef.current.length - 1];
        throw err;
      }
    },
    [loadWorkersForGroup, pageInfo],
  );

  // Fetch previous page for pagination
  const fetchPreviousPage = useCallback(
    async (args: Omit<UseGetWorkersForGroupArgs, 'append' | 'after'>) => {
      if (cursorHistoryRef.current.length === 0) {
        return undefined;
      }

      try {
        // Get the cursor from history (this is what we used to fetch the previous page)
        const previousCursor = cursorHistoryRef.current.pop();

        // Update current cursor
        currentAfterRef.current = previousCursor;

        return await loadWorkersForGroup({
          ...args,
          after: previousCursor,
          append: false,
        });
      } catch (err) {
        sandbox.logger.error('Error fetching previous page:', { error: err });
        throw err;
      }
    },
    [loadWorkersForGroup],
  );

  return {
    loading,
    error: error?.message || null,
    pageInfo,
    totalCount,
    loadWorkersForGroup,
    fetchNextPage,
    fetchPreviousPage,
  };
};
