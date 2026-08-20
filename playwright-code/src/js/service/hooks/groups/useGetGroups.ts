import { useSandbox } from '@payroll/quicksand';
import { useCallback, useRef } from 'react';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import {
  TimeTracking_GroupFilter,
  TimeTracking_GroupOrderBy,
  useGetTimeTrackingGroupsLazyQuery,
  GetTimeTrackingGroupsQuery,
  GetTimeTrackingGroupsQuery_timeTrackingGroups_TimeTracking_GroupConnection_edges_TimeTracking_GroupEdge_node_TimeTracking_Group as QueryGroupNode,
} from 'src/__generated__/timeTracking/graphql';
import { GROUPS_PAGE_SIZE } from 'src/js/widgets/assignments/components/WorkerAssignments/WorkersTableByGroupsView/constants';
import { useAppDispatch } from '../../../widgets/assignments/store';
import {
  setGroupsLoading,
  setGroupsData,
  setGroupsError,
  appendGroupsData,
  setLoadingMore,
} from '../../../widgets/assignments/store/workersGroupViewSlice';

export interface UseGetGroupsArgs {
  first?: number;
  after?: string;
  filter?: TimeTracking_GroupFilter;
  orderBy?: TimeTracking_GroupOrderBy[];
  append?: boolean;
}

export interface UseGetGroupsResult {
  loading: boolean;
  data: GetTimeTrackingGroupsQuery['timeTrackingGroups'] | null;
  error: string | null;
  pageInfo:
    | NonNullable<GetTimeTrackingGroupsQuery['timeTrackingGroups']>['pageInfo']
    | null;
  loadGroups: (args?: UseGetGroupsArgs) => void;
  fetchNextPage: (
    args?: Omit<UseGetGroupsArgs, 'append' | 'after'>,
  ) => Promise<void>;
  fetchPreviousPage: (
    args?: Omit<UseGetGroupsArgs, 'append' | 'after'>,
  ) => Promise<void>;
}

export interface UseGetGroupsOptions {
  /**
   * When true, fetchNextPage appends new groups to existing data (e.g. for dropdown Load More).
   * When false (default), fetchNextPage replaces data with the next page.
   */
  appendOnFetchNextPage?: boolean;
}

/**
 * Hook to fetch groups with their members and managers
 * Supports cursor-based pagination with backward navigation using cursor history
 */
export const useGetGroups = (
  options: UseGetGroupsOptions = {},
): UseGetGroupsResult => {
  const appendOnFetchNextPage = options.appendOnFetchNextPage ?? false;
  const sandbox = useSandbox();
  const dispatch = useAppDispatch();

  // Track cursor history for backward pagination
  // Stores the 'after' cursor used to fetch each page
  // When on page N, history has N-1 entries (page 1 has no history)
  const cursorHistoryRef = useRef<(string | undefined)[]>([]);

  // Track the current 'after' cursor (what was used to fetch current page)
  const currentAfterRef = useRef<string | undefined>(undefined);

  // Track when fetching next page (append) vs initial/fresh load (replace)
  const isAppendingRef = useRef(false);

  const [loadQuery, { data, loading, error, refetch: apolloRefetch }] =
    useGetTimeTrackingGroupsLazyQuery({
      fetchPolicy: 'network-only',
      notifyOnNetworkStatusChange: true,
      onCompleted: (response) => {
        if (!response.timeTrackingGroups) {
          dispatch(
            setGroupsData({
              groups: [],
              cursor: null,
              hasMore: false,
              totalCount: 0,
              hasNextPage: false,
            }),
          );
          return;
        }

        const groups: QueryGroupNode[] = response.timeTrackingGroups.edges.map(
          (edge) => edge.node,
        );

        const cursor = response.timeTrackingGroups.pageInfo.endCursor;
        const { hasNextPage } = response.timeTrackingGroups.pageInfo;
        const { totalCount } = response.timeTrackingGroups;

        if (isAppendingRef.current) {
          isAppendingRef.current = false;
          dispatch(
            appendGroupsData({
              groups,
              cursor,
              hasMore: hasNextPage,
              hasNextPage,
            }),
          );
          dispatch(setLoadingMore({ loading: false }));
        } else {
          dispatch(
            setGroupsData({
              groups,
              cursor,
              hasMore: hasNextPage,
              totalCount, // From GraphQL response (for pagination)
              hasNextPage,
            }),
          );
        }

        endInteractionWithSuccess(sandbox, TimeCustomerInteraction.GROUPS_READ);
      },
      onError: (err) => {
        dispatch(setGroupsError({ error: err.message }));

        endInteractionWithFailure(
          sandbox,
          TimeCustomerInteraction.GROUPS_READ,
          err.message,
          err,
        );
      },
    });

  const loadGroups = useCallback(
    ({
      first = GROUPS_PAGE_SIZE,
      after,
      filter,
      orderBy = [TimeTracking_GroupOrderBy.NameAsc],
    }: UseGetGroupsArgs = {}) => {
      dispatch(setGroupsLoading({ loading: true }));

      // Reset cursor history and tracking when loading fresh data
      if (!after) {
        cursorHistoryRef.current = [];
        currentAfterRef.current = undefined;
      } else {
        currentAfterRef.current = after;
      }

      createCustomerInteraction(sandbox, TimeCustomerInteraction.GROUPS_READ);
      loadQuery({
        variables: { first, after, filter, orderBy },
        context: {
          headers: getCustomerInteractionPropagationHeaders(
            sandbox,
            TimeCustomerInteraction.GROUPS_READ,
          ),
        },
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loadQuery, dispatch],
  );

  // Fetch next page for pagination
  const fetchNextPage = useCallback(
    async (args?: Omit<UseGetGroupsArgs, 'append' | 'after'>) => {
      const pageInfo = data?.timeTrackingGroups?.pageInfo;
      if (!pageInfo?.hasNextPage || !pageInfo?.endCursor) {
        sandbox.logger.warn('No next page available');
        return;
      }

      // Store the cursor we used to fetch the CURRENT page
      // This allows us to return to the current page when going backward
      cursorHistoryRef.current.push(currentAfterRef.current);

      // Update current cursor to the one we're about to use
      const nextCursor = pageInfo.endCursor;
      currentAfterRef.current = nextCursor;

      const {
        first = GROUPS_PAGE_SIZE,
        filter,
        orderBy = [TimeTracking_GroupOrderBy.NameAsc],
      } = args || {};

      try {
        isAppendingRef.current = appendOnFetchNextPage;
        if (appendOnFetchNextPage) {
          dispatch(setLoadingMore({ loading: true }));
        } else {
          dispatch(setGroupsLoading({ loading: true }));
        }

        createCustomerInteraction(sandbox, TimeCustomerInteraction.GROUPS_READ);
        await loadQuery({
          variables: { first, after: nextCursor, filter, orderBy },
          context: {
            headers: getCustomerInteractionPropagationHeaders(
              sandbox,
              TimeCustomerInteraction.GROUPS_READ,
            ),
          },
        });
      } catch (err) {
        isAppendingRef.current = false;
        if (appendOnFetchNextPage) {
          dispatch(setLoadingMore({ loading: false }));
        }
        // Restore on error
        cursorHistoryRef.current.pop();
        currentAfterRef.current =
          cursorHistoryRef.current[cursorHistoryRef.current.length - 1];
        throw err;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loadQuery, data, dispatch, appendOnFetchNextPage],
  );

  // Fetch previous page for pagination
  const fetchPreviousPage = useCallback(
    async (args?: Omit<UseGetGroupsArgs, 'append' | 'after'>) => {
      if (cursorHistoryRef.current.length === 0) {
        sandbox.logger.warn('No previous page available');
        return;
      }

      const {
        first = GROUPS_PAGE_SIZE,
        filter,
        orderBy = [TimeTracking_GroupOrderBy.NameAsc],
      } = args || {};

      try {
        // Get the cursor from history (this is what we used to fetch the previous page)
        const previousCursor = cursorHistoryRef.current.pop();

        // Update current cursor
        currentAfterRef.current = previousCursor;

        dispatch(setGroupsLoading({ loading: true }));

        createCustomerInteraction(sandbox, TimeCustomerInteraction.GROUPS_READ);
        await loadQuery({
          variables: { first, after: previousCursor, filter, orderBy },
          context: {
            headers: getCustomerInteractionPropagationHeaders(
              sandbox,
              TimeCustomerInteraction.GROUPS_READ,
            ),
          },
        });
      } catch (err) {
        sandbox.logger.error('Error fetching previous page:', { error: err });
        throw err;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loadQuery, dispatch],
  );

  return {
    loading,
    data: data?.timeTrackingGroups || null,
    error: error?.message || null,
    pageInfo: data?.timeTrackingGroups?.pageInfo || null,
    loadGroups,
    fetchNextPage,
    fetchPreviousPage,
  };
};
