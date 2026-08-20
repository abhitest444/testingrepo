import { useEffect, useCallback, useMemo } from 'react';
import { useSandbox, useTracking } from '@payroll/quicksand';
import { useTimeTrackingWorkers } from 'src/js/service/hooks/groups/useTimeTrackingWorkers';
import { useWorkersTotalCount } from 'src/js/service/hooks/groups/useWorkersTotalCount';
import { useActiveGroupsTotalCount } from 'src/js/service/hooks/groups/useActiveGroupsTotalCount';
import { WORKER_ASSIGNMENTS_TRACKING_POINTS } from 'src/js/widgets/assignments/utils/assignmentsTrackingPoints';
import {
  useWorkersListState,
  useAppSelector,
} from 'src/js/widgets/assignments/store/hooks';
import {
  setWorkers,
  setError,
  setCurrentPage,
  resetCurrentPage,
  selectWorkersListHeaderTotalCount,
  setHeaderTotalCount,
} from 'src/js/widgets/assignments/store/workersListSlice';
import { setGroupsHeaderCount } from 'src/js/widgets/assignments/store/workersGroupViewSlice';
import { TimeTracking_WorkersQueryFilter } from 'src/__generated__/timeTracking/graphql';
import { WORKERS_PAGE_SIZE } from 'src/js/widgets/assignments/utils/constants';
import {
  convertWorkerTypeToApiTypes,
  navigateToWorkerSettings,
  sanitizeErrorMessage,
} from 'src/js/widgets/assignments/utils/helpers';
import { WorkerType } from 'src/js/widgets/assignments/components/WorkerAssignments/SearchFilterBar/types';
import {
  AssignmentsMainTabs,
  WorkersTabViews,
} from 'src/js/widgets/assignments/types';
import TabPersistence from 'src/js/widgets/assignments/utils/tabPersistence';
import { Worker } from './types';

/**
 * Custom hook for managing workers list data fetching and state
 *
 * This hook encapsulates all data fetching logic, Redux state management,
 * pagination, and filtering for the Workers List View.
 *
 * @param searchText - Search filter text
 * @param workerType - Worker type filter (ALL, EMPLOYEE, VENDOR)
 * @returns Object containing workers data, loading state, pagination handlers, and action handlers
 */
export const useWorkersListData = (
  searchText: string = '',
  workerType: WorkerType = WorkerType.ALL,
) => {
  const sandbox = useSandbox();
  const track = useTracking();

  // Redux state
  const { currentPage, dispatch } = useWorkersListState();
  const headerTotalCount = useAppSelector(selectWorkersListHeaderTotalCount);

  // Memoize filter for header count queries (stable reference)
  const headerCountFilter = useMemo(() => ({ isActive: true }), []);

  // API hook for data fetching
  const {
    loadWorkers,
    fetchNextPage,
    fetchPreviousPage,
    workers,
    loading: loadingWorkers,
    error: apiError,
    pageInfo,
    totalCount: apiTotalCount,
  } = useTimeTrackingWorkers();

  // Fetch total count for header display (only active workers, no search/type filters)
  const {
    totalCount: totalActiveWorkerCount,
    executeQuery: executeHeaderCountQuery,
  } = useWorkersTotalCount({
    filter: headerCountFilter,
  });

  // Fetch total active groups count for groups header display
  const {
    totalActiveGroupCount,
    loading: loadingActiveGroupsTotalCount,
    executeQuery: executeActiveGroupsTotalCountQuery,
  } = useActiveGroupsTotalCount({
    filter: headerCountFilter,
  });

  // Build filter object for GraphQL query
  const graphqlFilter = useMemo(():
    | TimeTracking_WorkersQueryFilter
    | undefined => {
    const filterObj: TimeTracking_WorkersQueryFilter = { isActive: true };

    // Add search filter if provided
    if (searchText && searchText.trim()) {
      filterObj.searchText = searchText.trim();
    }

    // Add worker type filter if not 'ALL'
    const types = convertWorkerTypeToApiTypes(workerType);
    if (types) {
      filterObj.types = types;
    }

    return filterObj;
  }, [searchText, workerType]);

  // Loading state
  const loading = loadingWorkers || loadingActiveGroupsTotalCount;

  // Load workers with current filters
  const loadWorkersWithFilters = useCallback(() => {
    // Reset to page 1 when filters change
    dispatch(resetCurrentPage());

    // Execute header count query
    executeHeaderCountQuery();
    executeActiveGroupsTotalCountQuery();

    loadWorkers({
      first: WORKERS_PAGE_SIZE,
      filter: graphqlFilter,
    });
  }, [
    loadWorkers,
    graphqlFilter,
    dispatch,
    executeHeaderCountQuery,
    executeActiveGroupsTotalCountQuery,
  ]);

  // Load workers on mount and when filters change
  useEffect(() => {
    loadWorkersWithFilters();
  }, [loadWorkersWithFilters]);

  // Sync API data to Redux store when it changes
  useEffect(() => {
    if (workers.length > 0) {
      dispatch(setWorkers(workers));
    }
  }, [workers, dispatch]);

  // Sync error to Redux after sanitizing it
  useEffect(() => {
    if (apiError) {
      const cleanedError = sanitizeErrorMessage(apiError);
      dispatch(setError(cleanedError));
    }
  }, [apiError, dispatch]);

  // Sync totalActiveWorkerCount to Redux (workers count for header)
  useEffect(() => {
    if (totalActiveWorkerCount !== undefined) {
      dispatch(setHeaderTotalCount(totalActiveWorkerCount));
    }
  }, [totalActiveWorkerCount, dispatch]);

  // Sync totalActiveGroupCount to Redux (groups count for headers)
  useEffect(() => {
    if (totalActiveGroupCount !== undefined) {
      dispatch(setGroupsHeaderCount({ headerCount: totalActiveGroupCount }));
    }
  }, [totalActiveGroupCount, dispatch]);

  // Use totalCount from API response, fallback to 0 if not available
  const totalItems = useMemo(() => apiTotalCount ?? 0, [apiTotalCount]);

  const totalPages = useMemo(
    () => (totalItems > 0 ? Math.ceil(totalItems / WORKERS_PAGE_SIZE) : 0),
    [totalItems],
  );

  // Handle page change (no try-catch - errors handled at GraphQL level)
  const handlePageChange = useCallback(
    async (newPage: number) => {
      if (newPage === currentPage) return;

      if (newPage > currentPage) {
        // Moving forward
        await fetchNextPage({
          first: WORKERS_PAGE_SIZE,
          filter: graphqlFilter,
        });
      } else {
        // Moving backward
        await fetchPreviousPage({
          first: WORKERS_PAGE_SIZE,
          filter: graphqlFilter,
        });
      }
      dispatch(setCurrentPage(newPage));
    },
    [currentPage, fetchNextPage, fetchPreviousPage, graphqlFilter, dispatch],
  );

  // Handle view settings action
  const handleViewSettings = useCallback(
    (worker: Worker) => {
      track(WORKER_ASSIGNMENTS_TRACKING_POINTS.VIEW_SETTINGS_LINK);
      track(WORKER_ASSIGNMENTS_TRACKING_POINTS.VIEW_TIME_WORKER_PROFILE);

      // Save tab selection, view preference to web storage for persistence
      // To be used when user navigates back from the user settings page.
      TabPersistence.setMainTab(sandbox, AssignmentsMainTabs.WORKERS);
      TabPersistence.setWorkersView(sandbox, WorkersTabViews.WORKERS);

      navigateToWorkerSettings(worker, sandbox, 'WorkersListView');
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return {
    // Data
    workers,
    loading,
    pageInfo,

    // Pagination
    currentPage,
    totalPages,
    totalItems,
    headerTotalCount,
    handlePageChange,

    // Action handlers
    handleViewSettings,

    // Refetch function
    refetch: loadWorkersWithFilters,
  };
};
