import { useMemo, useRef, useEffect, useCallback } from 'react';
import { useGetGroups } from 'src/js/service/hooks/groups/useGetGroups';
import { useWorkersTotalCount } from 'src/js/service/hooks/groups/useWorkersTotalCount';
import { useActiveGroupsTotalCount } from 'src/js/service/hooks/groups/useActiveGroupsTotalCount';
import { useWorkersGroupView, useAppDispatch } from '../../../../store/hooks';
import { setHeaderTotalCount } from '../../../../store/workersListSlice';
import { setGroupsHeaderCount } from '../../../../store/workersGroupViewSlice';
import { GROUPS_PAGE_SIZE } from '../constants';

export interface CombinedGroupsDataState {
  // Groups data (from Redux)
  groups: ReturnType<typeof useWorkersGroupView>['groups'];
  groupsCount: number;
  groupsTotalCount: number;
  groupsLoading: boolean;
  groupsError: string | null;

  // Header counts
  totalActiveWorkerCount: number;
  totalActiveGroupCount: number;
  headerCountsLoading: boolean;
  headerCountsError: string | null;

  // Combined state
  loading: boolean;
  error: string | null;

  // Actions
  loadGroups: ReturnType<typeof useGetGroups>['loadGroups'];
  fetchNextPage: ReturnType<typeof useGetGroups>['fetchNextPage'];
  fetchPreviousPage: ReturnType<typeof useGetGroups>['fetchPreviousPage'];
  refetchHeaderCounts: () => void;
}

/**
 * Combined data fetching hook that loads all initial data for Workers Group View
 * Only runs header count queries once during component lifecycle and returns stable results
 * Follows the pattern from Weekly Time Entries Widget's useCombinedDataFetching
 *
 * @param searchText - Optional search text for filtering groups
 * @returns CombinedGroupsDataState with all data, loading states, and actions
 */
export const useCombinedGroupsDataFetching = (
  searchText: string = '',
): CombinedGroupsDataState => {
  const dispatch = useAppDispatch();
  const hasInitializedRef = useRef(false);

  // Get groups data from Redux store (already populated by useGetGroups)
  const { groups, groupsCount, groupsTotalCount } = useWorkersGroupView();

  // Memoize filter for header count queries (stable reference)
  const headerCountFilter = useMemo(() => ({ isActive: true }), []);

  // Get groups hook functions and loading/error state
  const {
    loadGroups,
    fetchNextPage,
    fetchPreviousPage,
    loading: groupsLoading,
    error: groupsError,
  } = useGetGroups();

  // Fetch total count for header display (only active workers, no search/type filters)
  const {
    totalCount: totalActiveWorkerCount,
    loading: loadingActiveWorkerTotalCount,
    error: errorActiveWorkerTotalCount,
    executeQuery: executeHeaderCountQuery,
  } = useWorkersTotalCount({
    filter: headerCountFilter,
  });

  // Fetch total active groups count for header display
  const {
    totalActiveGroupCount,
    loading: loadingActiveGroupsTotalCount,
    error: errorActiveGroupsTotalCount,
    executeQuery: executeActiveGroupsTotalCountQuery,
  } = useActiveGroupsTotalCount({
    filter: headerCountFilter,
  });

  // Initialize data fetching on mount (only once)
  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;

      // Execute header count queries
      executeHeaderCountQuery();
      executeActiveGroupsTotalCountQuery();

      // Load initial groups
      loadGroups({
        first: GROUPS_PAGE_SIZE,
        filter: {
          isActive: true,
          ...(searchText && { searchText }),
        },
      });
    }
    // Intentionally empty deps - only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync totalActiveWorkerCount to Redux (workers count)
  useEffect(() => {
    if (totalActiveWorkerCount !== undefined) {
      dispatch(setHeaderTotalCount(totalActiveWorkerCount));
    }
  }, [totalActiveWorkerCount, dispatch]);

  // Sync groups headerCount to Redux (active groups count)
  useEffect(() => {
    if (totalActiveGroupCount !== undefined) {
      dispatch(setGroupsHeaderCount({ headerCount: totalActiveGroupCount }));
    }
  }, [totalActiveGroupCount, dispatch]);

  // Combined loading state
  const loading = useMemo(
    () =>
      groupsLoading ||
      loadingActiveWorkerTotalCount ||
      loadingActiveGroupsTotalCount,
    [
      groupsLoading,
      loadingActiveWorkerTotalCount,
      loadingActiveGroupsTotalCount,
    ],
  );

  // Combined error state (prioritize groups error, then header counts errors)
  const error = useMemo(
    () => groupsError || errorActiveGroupsTotalCount || null,
    [groupsError, errorActiveGroupsTotalCount],
  );

  // Refetch header counts function
  const refetchHeaderCounts = useCallback(() => {
    executeHeaderCountQuery();
    executeActiveGroupsTotalCountQuery();
  }, [executeHeaderCountQuery, executeActiveGroupsTotalCountQuery]);

  return {
    // Groups data (from Redux)
    groups,
    groupsCount,
    groupsTotalCount,
    groupsLoading,
    groupsError,

    // Header counts
    totalActiveWorkerCount: totalActiveWorkerCount ?? 0,
    totalActiveGroupCount: totalActiveGroupCount ?? 0,
    headerCountsLoading:
      loadingActiveWorkerTotalCount || loadingActiveGroupsTotalCount,
    headerCountsError:
      errorActiveGroupsTotalCount || errorActiveWorkerTotalCount,

    // Combined state
    loading,
    error,

    // Actions
    loadGroups,
    fetchNextPage,
    fetchPreviousPage,
    refetchHeaderCounts,
  };
};
