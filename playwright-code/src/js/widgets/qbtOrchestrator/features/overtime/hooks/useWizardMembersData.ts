/**
 * Hook to manage wizard members data with Redux caching
 * Encapsulates Redux state, GraphQL fetching, and data transformation
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApolloError } from '@apollo/client';
import { useSandbox } from '@payroll/quicksand';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import {
  TimeTracking_WorkerOrderBy,
  TimeTracking_GroupOrderBy,
  TimeTracking_WorkersQueryFilter,
  TimeTracking_TimeForType,
  useGetTimeTrackingGroupsLazyQuery,
} from 'src/__generated__/timeTracking/graphql';
import type { GetTimeTrackingGroupsQuery_timeTrackingGroups_TimeTracking_GroupConnection_edges_TimeTracking_GroupEdge_node_TimeTracking_Group as QueryGroupNode } from 'src/__generated__/timeTracking/graphql';
import { useTimeTrackingWorkers } from 'src/js/service/hooks/groups';
import { WORKERS_PAGE_SIZE } from 'src/js/widgets/assignments/utils/constants';
import { GROUPS_PAGE_SIZE } from 'src/js/widgets/assignments/components/WorkerAssignments/WorkersTableByGroupsView/constants';
import type {
  SelectableWorker,
  PaginationProps,
} from 'src/js/widgets/common/WorkerSelection';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  setWizardCachedGroups,
  setWizardGroupsLoading,
  setWizardCachedWorkers,
  setWizardWorkersLoading,
  pushWizardCursorHistory,
  popWizardCursorHistory,
} from '../store';
import {
  selectWizardCachedGroups,
  selectWizardGroupsLoaded,
  selectWizardGroupsLoading,
  selectWizardCachedWorkers,
  selectWizardWorkersLoading,
  selectWizardWorkersTotalCount,
  selectWizardWorkersPageInfo,
  selectWizardCursorHistory,
} from '../store/overtimeSelectors';
import type { Group, Worker } from '../types/Overtime.types';
import { OVERTIME_WORKER_TYPES } from '../constants/overtimeWorkerTypes';

export interface UseWizardMembersDataParams {
  /**
   * Additional filter criteria merged into the overtime query filter.
   * Note: `isActive` and `types` are always enforced as `true` and
   * `OVERTIME_WORKER_TYPES` respectively and cannot be overridden by callers.
   * This filter must be referentially stable (memoized by the caller) —
   * a new object reference on every render will cause loadWorkers to re-fire continuously.
   */
  filter: TimeTracking_WorkersQueryFilter | undefined;
  sortOrder: TimeTracking_WorkerOrderBy;
}

export interface UseWizardMembersDataResult {
  groups: QueryGroupNode[];
  groupsLoading: boolean;
  workers: SelectableWorker[];
  workersLoading: boolean;
  workersError: ApolloError | undefined;
  totalWorkerCount: number;
  pagination: PaginationProps;
}

export function useWizardMembersData({
  filter,
  sortOrder,
}: UseWizardMembersDataParams): UseWizardMembersDataResult {
  const sandbox = useSandbox();
  const dispatch = useAppDispatch();
  const [paginationLoading, setPaginationLoading] = useState(false);

  // This ensures only active Employee and Vendor types are fetched for overtime policies
  const overtimeFilter: TimeTracking_WorkersQueryFilter = useMemo(
    () => ({
      ...filter,
      isActive: true,
      types: OVERTIME_WORKER_TYPES,
    }),
    [filter],
  );

  // Redux cached state
  const cachedGroups = useAppSelector(selectWizardCachedGroups);
  const groupsLoaded = useAppSelector(selectWizardGroupsLoaded);
  const groupsLoadingFromRedux = useAppSelector(selectWizardGroupsLoading);
  const cachedWorkers = useAppSelector(selectWizardCachedWorkers);
  const workersLoadingFromRedux = useAppSelector(selectWizardWorkersLoading);
  const cachedWorkersTotalCount = useAppSelector(selectWizardWorkersTotalCount);
  const cachedWorkersPageInfo = useAppSelector(selectWizardWorkersPageInfo);
  const cachedCursorHistory = useAppSelector(selectWizardCursorHistory);

  // Groups: fetch via GraphQL, store in Redux
  const [loadGroupsQuery, { data: groupsData, loading: groupsQueryLoading }] =
    useGetTimeTrackingGroupsLazyQuery({
      fetchPolicy: 'cache-first',
      onCompleted: () => {
        endInteractionWithSuccess(sandbox, TimeCustomerInteraction.GROUPS_READ);
      },
      onError: (error) => {
        endInteractionWithFailure(
          sandbox,
          TimeCustomerInteraction.GROUPS_READ,
          error.message,
          error,
        );
      },
    });

  // Store groups in Redux when fetched
  useEffect(() => {
    if (groupsData?.timeTrackingGroups?.edges) {
      const groupsToCache: Group[] = groupsData.timeTrackingGroups.edges.map(
        (edge) => ({
          id: edge.node.id,
          name: edge.node.name,
          isActive: edge.node.isActive,
          stats: {
            memberCount: edge.node.stats.memberCount,
          },
        }),
      );
      dispatch(setWizardCachedGroups(groupsToCache));
    }
  }, [groupsData, dispatch]);

  // Update groups loading state
  useEffect(() => {
    dispatch(setWizardGroupsLoading(groupsQueryLoading));
  }, [groupsQueryLoading, dispatch]);

  // Fetch groups only if not already cached
  useEffect(() => {
    if (!groupsLoaded && !groupsLoadingFromRedux) {
      createCustomerInteraction(sandbox, TimeCustomerInteraction.GROUPS_READ);
      loadGroupsQuery({
        variables: {
          first: GROUPS_PAGE_SIZE,
          filter: { isActive: true },
          orderBy: [TimeTracking_GroupOrderBy.NameAsc],
        },
        context: {
          headers: getCustomerInteractionPropagationHeaders(
            sandbox,
            TimeCustomerInteraction.GROUPS_READ,
          ),
        },
      });
    }
  }, [groupsLoaded, groupsLoadingFromRedux, loadGroupsQuery, sandbox]);

  // Map cached groups for the dropdown (compatible with QueryGroupNode)
  // Note: managerCount is not stored in our simplified Group type but is required by QueryGroupNode
  const groups: QueryGroupNode[] = useMemo(
    () =>
      cachedGroups.map((g) => ({
        __typename: 'TimeTracking_Group' as const,
        id: g.id,
        name: g.name,
        isActive: g.isActive,
        meta: { __typename: 'TimeTracking_GroupMeta' as const, version: 0 },
        stats: {
          __typename: 'TimeTracking_GroupStats' as const,
          memberCount: g.stats?.memberCount ?? 0,
          managerCount: 0, // Not used by GroupFilterDropdown
        },
      })),
    [cachedGroups],
  );

  // Workers: use the existing hook
  const {
    workers: fetchedWorkers,
    loading: workersQueryLoading,
    error: workersErrorRaw,
    totalCount: fetchedTotalCount,
    pageInfo: fetchedPageInfo,
    loadWorkers,
    fetchNextPage,
    fetchPreviousPage,
  } = useTimeTrackingWorkers();

  // Convert error string to ApolloError-like object if needed
  const workersError = workersErrorRaw
    ? (new ApolloError({ errorMessage: workersErrorRaw }) as ApolloError)
    : undefined;

  // Store workers in Redux when fetched
  useEffect(() => {
    if (fetchedWorkers.length > 0 || fetchedTotalCount !== null) {
      const workersToCache: Worker[] = fetchedWorkers.map((w) => ({
        id: w.id,
        type: w.type,
        isActive: w.isActive,
        firstName: w.firstName ?? undefined,
        lastName: w.lastName ?? undefined,
        displayName: w.displayName ?? undefined,
        memberOfGroup: w.memberOfGroup
          ? {
              id: w.memberOfGroup.id,
              name: w.memberOfGroup.name,
              isActive: w.memberOfGroup.isActive,
            }
          : undefined,
      }));
      dispatch(
        setWizardCachedWorkers({
          workers: workersToCache,
          totalCount: fetchedTotalCount ?? 0,
          pageInfo: fetchedPageInfo
            ? {
                hasNextPage: fetchedPageInfo.hasNextPage,
                endCursor: fetchedPageInfo.endCursor ?? undefined,
              }
            : { hasNextPage: false },
        }),
      );
    }
  }, [fetchedWorkers, fetchedTotalCount, fetchedPageInfo, dispatch]);

  // Update workers loading state
  useEffect(() => {
    dispatch(setWizardWorkersLoading(workersQueryLoading));
  }, [workersQueryLoading, dispatch]);

  // Fetch workers on mount and whenever filter/sort changes.
  useEffect(() => {
    loadWorkers({
      first: WORKERS_PAGE_SIZE,
      filter: overtimeFilter,
      orderBy: [sortOrder],
    });
  }, [loadWorkers, overtimeFilter, sortOrder]);

  // Use cached data with fallback to fetched data
  const rawWorkers = cachedWorkers.length > 0 ? cachedWorkers : fetchedWorkers;
  const totalCount = cachedWorkersTotalCount ?? fetchedTotalCount;
  const pageInfo = cachedWorkersPageInfo ?? fetchedPageInfo;
  const groupsLoading = groupsLoadingFromRedux || groupsQueryLoading;
  const workersLoading = workersLoadingFromRedux || workersQueryLoading;

  // Map workers to SelectableWorker type
  const workers: SelectableWorker[] = useMemo(
    () =>
      rawWorkers.map((w) => ({
        id: w.id,
        type: w.type as TimeTracking_TimeForType,
        isActive: w.isActive,
        displayName: w.displayName ?? undefined,
        firstName: w.firstName ?? undefined,
        lastName: w.lastName ?? undefined,
        memberOfGroup: w.memberOfGroup
          ? {
              id: w.memberOfGroup.id,
              name: w.memberOfGroup.name,
              isActive: w.memberOfGroup.isActive,
            }
          : undefined,
      })),
    [rawWorkers],
  );

  // Pagination handlers
  const handleNextPage = useCallback(async () => {
    setPaginationLoading(true);
    try {
      dispatch(pushWizardCursorHistory(pageInfo?.endCursor ?? undefined));
      await fetchNextPage({
        first: WORKERS_PAGE_SIZE,
        filter: overtimeFilter,
        orderBy: [sortOrder],
      });
    } finally {
      setPaginationLoading(false);
    }
  }, [dispatch, fetchNextPage, overtimeFilter, sortOrder, pageInfo?.endCursor]);

  const handlePreviousPage = useCallback(async () => {
    if (cachedCursorHistory.length === 0) return;

    setPaginationLoading(true);
    try {
      dispatch(popWizardCursorHistory());
      await fetchPreviousPage({
        first: WORKERS_PAGE_SIZE,
        filter: overtimeFilter,
        orderBy: [sortOrder],
      });
    } finally {
      setPaginationLoading(false);
    }
  }, [
    dispatch,
    cachedCursorHistory.length,
    fetchPreviousPage,
    overtimeFilter,
    sortOrder,
  ]);

  // Pagination props
  const pagination: PaginationProps = useMemo(
    () => ({
      hasNextPage: pageInfo?.hasNextPage ?? false,
      hasPreviousPage: cachedCursorHistory.length > 0,
      onNextPage: handleNextPage,
      onPreviousPage: handlePreviousPage,
      isLoading: paginationLoading,
    }),
    [
      pageInfo?.hasNextPage,
      cachedCursorHistory.length,
      handleNextPage,
      handlePreviousPage,
      paginationLoading,
    ],
  );

  const totalWorkerCount = totalCount ?? rawWorkers.length;

  return {
    groups,
    groupsLoading,
    workers,
    workersLoading,
    workersError,
    totalWorkerCount,
    pagination,
  };
}
