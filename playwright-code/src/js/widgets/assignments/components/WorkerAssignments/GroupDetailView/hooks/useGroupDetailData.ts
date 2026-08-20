import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSandbox, useTracking } from '@payroll/quicksand';
import { useGetWorkersForGroup } from 'src/js/service/hooks/groups/useGetWorkersForGroup';
import { useGetGroups } from 'src/js/service/hooks/groups/useGetGroups';
import { useWorkersTotalCount } from 'src/js/service/hooks/groups/useWorkersTotalCount';
import { WORKERS_PAGE_SIZE } from 'src/js/widgets/assignments/utils/constants';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  closeGroupDetailView,
  selectGroupDetailView,
  setGroupDetailViewError,
  setDrawerContext,
  setSelectedMembers,
  setInitialMembers,
  openQuickActionDrawer,
} from '../../../../store/workersGroupViewSlice';
import {
  GroupDrawerContext,
  GroupDrawerView,
} from '../../../../types/Groups/GroupDrawer.types';
import { WorkerType } from '../../SearchFilterBar/types';
import { convertWorkerTypeToApiTypes } from '../../../../utils/helpers';
import { GROUP_DETAILS_TRACKING_POINTS } from '../../../../utils/groupsTrackingPoints';

export interface GroupDetailWorker {
  id: string;
  displayName: string;
  type: string;
  isGroupLead: boolean;
}

export interface UseGroupDetailDataReturn {
  // Group data
  selectedGroup: any | null;
  memberCount: number;
  managerCount: number;

  // Workers data
  workers: GroupDetailWorker[];
  isLoading: boolean;

  // Filter state
  searchText: string;
  filterType: WorkerType;

  // Pagination state
  currentPage: number;
  totalPages: number;
  totalItems: number;
  headerTotalCount: number;
  pageInfo: any;

  // Handlers
  handleBack: () => void;
  handleSearchChange: (value: string) => void;
  handleFilterChange: (value: WorkerType) => void;
  handlePageChange: (page: number) => void;
  handleAssignWorkers: () => Promise<void>;
  handleAssignLeads: () => Promise<void>;
  refetchWorkers: (options?: { refetchHeaderCount?: boolean }) => void;
}

/**
 * Custom hook for Group Detail View data management
 * Handles all data fetching, state management, and business logic
 * for the group detail drill-down view
 */
export const useGroupDetailData = (): UseGroupDetailDataReturn => {
  const sandbox = useSandbox();
  const dispatch = useAppDispatch();
  const track = useTracking();
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState(WorkerType.ALL);
  const [currentPage, setCurrentPage] = useState(1);
  const hasTrackedView = useRef(false);

  // Get group detail view state from Redux
  const groupDetailView = useAppSelector(selectGroupDetailView);

  // Hook to fetch workers for a specific group
  const {
    loadWorkersForGroup,
    loading: loadingWorkers,
    error: workersApiError,
    pageInfo,
    totalCount: apiTotalCount,
    fetchNextPage,
    fetchPreviousPage,
  } = useGetWorkersForGroup();

  // Hook to refetch the specific group (for updated stats)
  const { loadGroups } = useGetGroups();

  // Build filter for header count query (active workers in the selected group)
  const headerCountFilter = useMemo(() => {
    if (!groupDetailView.groupId) {
      return undefined;
    }
    return {
      isActive: true,
      groupId: groupDetailView.groupId,
    };
  }, [groupDetailView.groupId]);

  // Fetch total count for header display (active workers in the selected group)
  const {
    totalCount: headerTotalCount,
    loading: loadingHeaderTotalCount,
    error: errorHeaderTotalCount,
    executeQuery: executeHeaderCountQuery,
  } = useWorkersTotalCount({
    filter: headerCountFilter,
  });

  // Execute header count query on mount and when filter changes
  useEffect(() => {
    if (headerCountFilter) {
      executeHeaderCountQuery();
    }
  }, [executeHeaderCountQuery, headerCountFilter]);

  // Sync error to Redux (prefer errorHeaderTotalCount over workersApiError)
  useEffect(() => {
    const errorToSet = errorHeaderTotalCount || workersApiError || null;
    dispatch(setGroupDetailViewError({ error: errorToSet }));
  }, [errorHeaderTotalCount, workersApiError, dispatch]);

  // Track VIEW_GROUP_DETAILS when view becomes active
  useEffect(() => {
    if (
      groupDetailView.isActive &&
      groupDetailView.groupId &&
      !hasTrackedView.current
    ) {
      sandbox.logger.info(
        'Component="GroupDetailView" Event="Group details page viewed"',
      );
      track(GROUP_DETAILS_TRACKING_POINTS.VIEW_GROUP_DETAILS);
      hasTrackedView.current = true;
    }
    // Reset tracking flag when view is closed
    if (!groupDetailView.isActive) {
      hasTrackedView.current = false;
    }
  }, [groupDetailView.isActive, groupDetailView.groupId, track, sandbox]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, filterType]);

  // Fetch workers when group detail view opens, search text changes, or filter type changes
  useEffect(() => {
    if (groupDetailView.isActive && groupDetailView.groupId) {
      loadWorkersForGroup({
        groupId: groupDetailView.groupId,
        first: WORKERS_PAGE_SIZE,
        searchText: searchText.trim() || undefined,
        types: convertWorkerTypeToApiTypes(filterType),
      });
    }
  }, [
    groupDetailView.isActive,
    groupDetailView.groupId,
    searchText,
    filterType,
    loadWorkersForGroup,
  ]);

  // Get workers for the selected group from Redux
  const workersForGroup = useAppSelector((state) => {
    if (groupDetailView.groupId) {
      return state.workersGroupView.workersByGroup[groupDetailView.groupId];
    }
    return null;
  });

  // Get the selected group data
  const selectedGroup = useAppSelector((state) => {
    if (groupDetailView.groupId) {
      const groupEntity =
        state.workersGroupView.groups.entities[groupDetailView.groupId];
      return groupEntity || null;
    }
    return null;
  });

  // Prepare workers data for display
  const workers: GroupDetailWorker[] = workersForGroup
    ? workersForGroup.ids.map((id) => {
        const worker = workersForGroup.entities[id];
        return {
          id: worker.id,
          displayName: worker.name,
          type: worker.role || 'Unknown',
          isGroupLead: worker.isGroupLead || false,
        };
      })
    : [];

  const isLoading =
    loadingWorkers ||
    (workersForGroup?.loading ?? false) ||
    loadingHeaderTotalCount;

  const handleBack = useCallback(() => {
    dispatch(closeGroupDetailView());
    setSearchText(''); // Clear search when going back
  }, [dispatch]);

  const handleSearchChange = useCallback(
    (value: string) => {
      // Track search only when user types (value is not empty)
      if (value.trim()) {
        sandbox.logger.info(
          'Component="GroupDetailView" Event="Group workers searched"',
        );
        track(GROUP_DETAILS_TRACKING_POINTS.SEARCH_WORKERS_DETAIL);
      }
      setSearchText(value);
    },
    [track, sandbox],
  );

  const handleFilterChange = useCallback(
    (value: WorkerType) => {
      // Track filter change (excluding initial "ALL" selection)
      if (value !== WorkerType.ALL) {
        sandbox.logger.info(
          'Component="GroupDetailView" Event="Group workers filtered"',
        );
        track(GROUP_DETAILS_TRACKING_POINTS.FILTER_WORKERS_DETAIL);
      }
      setFilterType(value);
    },
    [track, sandbox],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      if (!groupDetailView.groupId) return;

      setCurrentPage(page);

      const types = convertWorkerTypeToApiTypes(filterType);

      if (page > currentPage && pageInfo?.hasNextPage) {
        // Going forward
        fetchNextPage({
          groupId: groupDetailView.groupId,
          first: WORKERS_PAGE_SIZE,
          searchText: searchText.trim() || undefined,
          types,
        });
      } else if (page < currentPage && pageInfo?.hasPreviousPage) {
        // Going backward
        fetchPreviousPage({
          groupId: groupDetailView.groupId,
          first: WORKERS_PAGE_SIZE,
          searchText: searchText.trim() || undefined,
          types,
        });
      }
    },
    [
      currentPage,
      groupDetailView.groupId,
      searchText,
      filterType,
      pageInfo,
      fetchNextPage,
      fetchPreviousPage,
    ],
  );

  const handleAssignWorkers = useCallback(async () => {
    if (!selectedGroup) {
      return;
    }

    sandbox.logger.info(
      'Component="GroupDetailView" Event="Opening assign workers drawer"',
      {
        groupId: selectedGroup.id,
        memberCount: selectedGroup.stats?.memberCount,
      },
    );

    try {
      const membersRecord = {};

      // Set drawer context for Quick Action flow
      dispatch(
        setDrawerContext({
          groupId: selectedGroup.id,
          groupName: selectedGroup.name,
          context: GroupDrawerContext.QuickAction,
          initialMembers: membersRecord,
          initialLeads: {}, // Not relevant for workers view
          memberCount: selectedGroup.stats?.memberCount, // Pass member count for optimization
        }),
      );

      // Pre-populate selections with existing members
      dispatch(setSelectedMembers(membersRecord));
      dispatch(setInitialMembers(membersRecord));

      // Open drawer via Redux action
      dispatch(openQuickActionDrawer({ view: GroupDrawerView.AssignWorkers }));

      sandbox.logger.info(
        'Component="GroupDetailView" Event="Opened assign workers drawer"',
        {
          groupId: selectedGroup.id,
          existingMemberCount: Object.keys(membersRecord).length,
        },
      );
    } catch (error) {
      sandbox.logger.error(
        'Component="GroupDetailView" Event="Failed to open assign workers drawer"',
        {
          groupId: selectedGroup.id,
          error,
        },
      );
    }
  }, [selectedGroup, dispatch, sandbox]);

  const handleAssignLeads = useCallback(async () => {
    if (!selectedGroup) {
      return;
    }

    sandbox.logger.info(
      'Component="GroupDetailView" Event="Opening assign leads drawer"',
      {
        groupId: selectedGroup.id,
        managerCount: selectedGroup.stats?.managerCount,
      },
    );

    try {
      // Set drawer context for Quick Action flow
      dispatch(
        setDrawerContext({
          groupId: selectedGroup.id,
          groupName: selectedGroup.name,
          context: GroupDrawerContext.QuickAction,
          initialMembers: {}, // Not relevant for leads view
          initialLeads: {}, // Empty - useInitializeEditMode will populate
          managerCount: selectedGroup.stats?.managerCount, // Pass manager count for optimization
        }),
      );

      // Open drawer via Redux action
      dispatch(openQuickActionDrawer({ view: GroupDrawerView.AssignLeads }));

      sandbox.logger.info(
        'Component="GroupDetailView" Event="Opened assign leads drawer"',
        {
          groupId: selectedGroup.id,
          managerCount: selectedGroup.stats?.managerCount,
        },
      );
    } catch (error) {
      sandbox.logger.error(
        'Component="GroupDetailView" Event="Failed to open assign leads drawer"',
        {
          groupId: selectedGroup.id,
          error,
        },
      );
    }
  }, [selectedGroup, dispatch, sandbox]);

  const memberCount = selectedGroup?.stats?.memberCount || 0;
  const managerCount = selectedGroup?.stats?.managerCount || 0;

  // Use totalCount from API response (respects filters), fallback to memberCount
  const totalItems = useMemo(
    () => apiTotalCount ?? memberCount,
    [apiTotalCount, memberCount],
  );

  const totalPages = useMemo(
    () => (totalItems > 0 ? Math.ceil(totalItems / WORKERS_PAGE_SIZE) : 0),
    [totalItems],
  );

  // Refetch workers and group stats - useful after successful assignment
  const refetchWorkers = useCallback(
    (options?: { refetchHeaderCount?: boolean }) => {
      if (groupDetailView.isActive && groupDetailView.groupId) {
        sandbox.logger.info(
          'Component="GroupDetailView" Event="Refetching group and workers after assignment"',
          {
            groupId: groupDetailView.groupId,
          },
        );

        // Refetch the specific group to get updated stats (memberCount, managerCount)
        loadGroups({
          first: 1,
          filter: {
            ids: [groupDetailView.groupId],
            isActive: true,
          },
        });

        // Refetch workers list
        loadWorkersForGroup({
          groupId: groupDetailView.groupId,
          first: WORKERS_PAGE_SIZE,
          searchText: searchText.trim() || undefined,
          types: convertWorkerTypeToApiTypes(filterType),
        });

        // Refetch header total count only after successful Assign/Remove Workers operation
        if (options?.refetchHeaderCount) {
          executeHeaderCountQuery();
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      groupDetailView.isActive,
      groupDetailView.groupId,
      searchText,
      filterType,
      loadWorkersForGroup,
      loadGroups,
      executeHeaderCountQuery,
    ],
  );

  return {
    // Group data
    selectedGroup,
    memberCount,
    managerCount,

    // Workers data
    workers,
    isLoading,

    // Filter state
    searchText,
    filterType,

    // Pagination state
    currentPage,
    totalPages,
    totalItems,
    headerTotalCount,
    pageInfo,

    // Handlers
    handleBack,
    handleSearchChange,
    handleFilterChange,
    handlePageChange,
    handleAssignWorkers,
    handleAssignLeads,
    refetchWorkers,
  };
};
