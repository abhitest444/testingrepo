import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import { SuccessToast } from 'src/js/widgets/common/SuccessToast';
import {
  WorkerNameType,
  WorkersTabViews,
} from 'src/js/widgets/assignments/types';
import {
  GROUPS_LIST_TRACKING_POINTS,
  CREATE_GROUP_TRACKING_POINTS,
} from 'src/js/widgets/assignments/utils/groupsTrackingPoints';
import { WORKER_ASSIGNMENTS_TRACKING_POINTS } from 'src/js/widgets/assignments/utils/assignmentsTrackingPoints';
import { TabPersistence } from 'src/js/widgets/assignments/utils/tabPersistence';
import { FEATURE_FLAGS } from 'src/js/common/constants';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import { WorkersTabHeader } from './WorkersTabHeader/WorkersTabHeader';
import { SearchFilterBar } from './SearchFilterBar/SearchFilterBar';
import { WorkersGroupViewDataProvider as WorkersTableByGroupsView } from './WorkersTableByGroupsView/WorkersGroupViewDataProvider';
import { CreateGroupDrawer } from '../Groups/CreateGroupDrawer';
import { EditGroupDrawer } from '../Groups/EditGroupDrawer';
import { AddWorkerDrawer } from './AddWorkerDrawer';
import WorkersListView from './WorkersListView/WorkersListView';
import { GroupDetailView } from './GroupDetailView';
import { WorkerAssignmentsContainer } from '../styles/WorkerAssignments.styled';
import { WorkerType } from './SearchFilterBar/types';
import {
  GroupDrawerView,
  GroupDrawerContext,
} from '../../types/Groups/GroupDrawer.types';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectQuickActionDrawerOpen,
  selectQuickActionDrawerView,
  selectCurrentGroupId,
  selectCurrentGroupName,
  closeQuickActionDrawer,
  selectGroupDetailView,
  selectViewByGroups,
  setViewByGroups,
  resetDrawerState,
  selectAddWorkerDrawerOpen,
  selectAddWorkerDrawerNameType,
  openAddWorkerDrawer,
  closeAddWorkerDrawer,
  selectCreateGroupDrawerOpen,
  openCreateGroupDrawer,
  closeCreateGroupDrawer,
  selectDrawerContext,
  closeGroupDetailView,
} from '../../store/workersGroupViewSlice';
import InviteWorkerDrawer from './InviteWorkerDrawer';

/**
 * Worker Assignments Tab Component
 * Three-layer structure with Create Group functionality:
 *
 * Layer 1: Tab Header Actions (Manage fields, Add worker, Create group buttons)
 * Layer 2: Search & Filter Bar (Worker type dropdown, Search field, View toggle)
 * Layer 3: Conditional View - Groups view (toggle ON) or List view (toggle OFF)
 */
interface WorkerAssignmentsTabProps {
  initialView?: string;
}

const WorkerAssignmentsTab: React.FC<WorkerAssignmentsTabProps> = ({
  initialView,
}) => {
  const intl = useIntl();
  const sandbox = useSandbox();
  const dispatch = useAppDispatch();
  const track = useTracking();

  // State for search/filter functionality
  const [searchText, setSearchText] = useState('');
  const [workerType, setWorkerType] = useState<WorkerType>(WorkerType.ALL);
  const [inviteWorkerType, setInviteWorkerType] = useState<
    WorkerNameType | undefined
  >();

  const { isEnabled: isInviteWorkerEnabled } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.SBSEG_QBO_WORKER_TRACK_ENABLE_WORKER_INVITE,
    defaultValue: false,
  });

  // Get view toggle state from Redux (always defaults to true - "Group by" view)
  const viewByGroups = useAppSelector(selectViewByGroups);

  // Get group detail view state from Redux
  const groupDetailView = useAppSelector(selectGroupDetailView);

  // Redux state for Create Group drawer (opened from header or empty state)
  const showCreateDrawer = useAppSelector(selectCreateGroupDrawerOpen);

  // Redux state for Quick Action drawer
  const showQuickActionDrawer = useAppSelector(selectQuickActionDrawerOpen);
  const quickActionView = useAppSelector(
    selectQuickActionDrawerView,
  ) as GroupDrawerView;
  const quickActionGroupId = useAppSelector(selectCurrentGroupId) || '';
  const quickActionGroupName = useAppSelector(selectCurrentGroupName) || '';
  const drawerContext = useAppSelector(selectDrawerContext);

  // Redux state for Add Worker drawer (initialType set when opening from header or empty state)
  const showAddWorkerDrawer = useAppSelector(selectAddWorkerDrawerOpen);
  const addWorkerDrawerNameType = useAppSelector(selectAddWorkerDrawerNameType);

  // State for success toast notification
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Store refetch callbacks (ref is appropriate for callbacks)
  const refetchGroupsRef = useRef<(() => void) | null>(null);
  const refetchWorkersListRef = useRef<(() => void) | null>(null);

  // Store refetch callback from group detail view (for refreshing after assignment)
  const refetchGroupDetailRef = useRef<
    ((options?: { refetchHeaderCount?: boolean }) => void) | null
  >(null);

  // Force GroupDrawer to remount every time it opens by changing key
  const [drawerRenderKey, setDrawerRenderKey] = useState(0);

  const [isGroupsLoading, setIsGroupsLoading] = useState(false);
  const [isWorkersListLoading, setIsWorkersListLoading] = useState(true);

  // Track if we've initialized view from web storage (prevents re-reading on every render)
  const hasInitializedFromStorage = useRef<boolean>(false);

  // Handler functions for tab header action buttons
  const handleManageFields = useCallback(() => {
    try {
      // Track manage fields click
      sandbox.logger.info(
        'Component="WorkerAssignmentsTab" Event="Manage Fields clicked"',
      );
      track(GROUPS_LIST_TRACKING_POINTS.MANAGE_FIELDS);

      // Navigate to time tracking settings page
      sandbox.navigation.navigate('/app/accountsettings?p=time');
    } catch (error) {
      sandbox.logger.error('Navigation to time tracking settings failed', {
        error,
      });
    }
  }, [sandbox, track]);

  const handleAddWorker = useCallback(
    (workerType: WorkerNameType) => {
      sandbox.logger.info(
        `Component="WorkerAssignmentsTab" Event="Add Worker button clicked" WorkerType="${workerType}"`,
      );
      track(WORKER_ASSIGNMENTS_TRACKING_POINTS.ADD_WORKER_CTA);
      dispatch(openAddWorkerDrawer({ workerType }));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Handle successful worker addition
  const handleAddWorkerSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    setShowSuccessToast(true);
  }, []);

  // Get refetch function based on current view
  const getRefetchFunction = useCallback(() => {
    if (viewByGroups && refetchGroupsRef.current) {
      return refetchGroupsRef.current;
    }
    if (!viewByGroups && refetchWorkersListRef.current) {
      return refetchWorkersListRef.current;
    }
    return undefined;
  }, [viewByGroups]);

  // Open Create Group drawer (header CTA)
  const handleCreateGroup = useCallback(() => {
    sandbox.logger.info(
      'Component="WorkerAssignmentsTab" Event="Create group button clicked"',
    );
    track(CREATE_GROUP_TRACKING_POINTS.START_CREATE_GROUP);
    dispatch(openCreateGroupDrawer());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle successful group creation
  const handleCreateSuccess = useCallback(
    (message?: string) => {
      dispatch(closeCreateGroupDrawer());

      // Refetch groups to show new group in table
      if (refetchGroupsRef.current) {
        refetchGroupsRef.current();
      }

      // Set success message and show toast
      if (message) {
        setSuccessMessage(message);
      }
      setShowSuccessToast(true);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Close Create Group drawer
  const handleCloseDrawer = useCallback(() => {
    dispatch(closeCreateGroupDrawer());

    // Always refetch groups when drawer closes to ensure fresh data
    if (refetchGroupsRef.current) {
      refetchGroupsRef.current();
    }

    // Also refetch group detail workers if we're in group detail view
    if (refetchGroupDetailRef.current) {
      refetchGroupDetailRef.current();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close Quick Action drawer and refetch groups
  const handleCloseQuickActionDrawer = useCallback(() => {
    // Capture the current view before closing (state will be reset)
    const wasAssignWorkersView =
      quickActionView === GroupDrawerView.AssignWorkers;

    dispatch(closeQuickActionDrawer());

    // CRITICAL: Clear all drawer state to prevent stale data on next open
    dispatch(resetDrawerState());

    // Always refetch groups when drawer closes to ensure fresh data
    if (refetchGroupsRef.current) {
      refetchGroupsRef.current();
    }

    // Also refetch group detail workers if we're in group detail view
    // Only refetch header count for Assign Workers operation
    if (refetchGroupDetailRef.current) {
      refetchGroupDetailRef.current({
        refetchHeaderCount: wasAssignWorkersView,
      });
    }
  }, [dispatch, quickActionView]);

  // Handle successful quick action (assign workers/leads)
  const handleQuickActionSuccess = useCallback(
    (message?: string) => {
      // Set success message and show toast
      if (message) {
        setSuccessMessage(message);
      }
      setShowSuccessToast(true);

      // Only close drawer if it's QuickAction mode
      // In Edit Group mode, the drawer should stay open and navigate back to Details
      if (drawerContext === GroupDrawerContext.QuickAction) {
        dispatch(closeQuickActionDrawer()); // This triggers handleCloseQuickActionDrawer which refetches
      }
    },
    [dispatch, drawerContext],
  );

  // Handler functions for search/filter bar
  const handleSearchChange = (text: string) => {
    setSearchText(text);

    // Track search groups interaction
    if (text) {
      sandbox.logger.info(
        'Component="WorkerAssignmentsTab" Event="Search Groups interaction"',
      );
      track(GROUPS_LIST_TRACKING_POINTS.SEARCH_GROUPS);
    }
  };

  const handleWorkerTypeChange = (type: WorkerType) => {
    setWorkerType(type);
  };

  const handleViewToggle = (checked: boolean) => {
    // Clear search when switching views to prevent state bleeding between views
    setSearchText('');
    dispatch(setViewByGroups(checked));
  };

  // Initialize view with fallback priority:
  // 1. initialView prop from URL query param (if provided)
  // 2. localStorage saved value (loaded below)
  // 3. Default to Groups view
  // This ensures user's last selected view (Groups or Workers) is restored in case it was persisted before user settings navigation.
  useEffect(() => {
    if (!hasInitializedFromStorage.current) {
      hasInitializedFromStorage.current = true;

      if (initialView === WorkersTabViews.GROUPS) {
        dispatch(setViewByGroups(true));
      } else {
        // Read saved view preference from web storage
        const savedView = TabPersistence.getWorkersView(sandbox);
        // Convert 'groups' | 'workers' to boolean for Redux
        const savedViewByGroups = savedView === WorkersTabViews.GROUPS;
        dispatch(setViewByGroups(savedViewByGroups));

        // Clear saved view preference from web storage
        TabPersistence.clearWorkersView(sandbox);
      }

      // Track groups tab entry on mount
      sandbox.logger.info(
        'Component="WorkerAssignmentsTab" Event="Workers tab entry"',
      );
      track(GROUPS_LIST_TRACKING_POINTS.GROUPS_ENTRY);
    }

    // Cleanup: Clear group detail view when navigating away from Workers tab
    return () => {
      dispatch(closeGroupDetailView());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, track, sandbox]);

  // Track groups list view when viewByGroups is true
  useEffect(() => {
    if (viewByGroups && !groupDetailView.isActive) {
      sandbox.logger.info(
        'Component="WorkerAssignmentsTab" Event="Groups list view displayed"',
      );
      track(GROUPS_LIST_TRACKING_POINTS.GROUPS_LIST_VIEW);
    }
  }, [viewByGroups, groupDetailView.isActive, track, sandbox]);

  // Force drawer remount whenever it opens by incrementing the key
  useEffect(() => {
    if (showQuickActionDrawer || showCreateDrawer) {
      setDrawerRenderKey((prev) => prev + 1);
    }
  }, [showQuickActionDrawer, showCreateDrawer]);

  // If group detail view is active, replace the entire tab content
  if (groupDetailView.isActive) {
    return (
      <WorkerAssignmentsContainer>
        {/* Success Toast Notification */}
        <SuccessToast
          message={successMessage}
          open={showSuccessToast}
          onClose={() => setShowSuccessToast(false)}
        />

        {/* Group Detail View - Replaces entire tab (self-contained) */}
        <GroupDetailView
          onRefetchAvailable={(refetch) => {
            refetchGroupDetailRef.current = refetch;
          }}
        />

        {/* Quick Action Drawer (Assign workers/leads from group detail view) */}
        <EditGroupDrawer
          key={`quick-action-detail-${drawerRenderKey}-${quickActionGroupId}`}
          open={showQuickActionDrawer}
          onClose={handleCloseQuickActionDrawer}
          onSuccess={handleQuickActionSuccess}
          groupId={quickActionGroupId}
          initialGroupName={quickActionGroupName}
          groupVersion={1}
          initialView={quickActionView}
        />

        {/* Add Worker Drawer - QBO Contacts Integration (Group Detail View) */}
        <AddWorkerDrawer
          open={showAddWorkerDrawer}
          onClose={() => dispatch(closeAddWorkerDrawer())}
          onSuccess={handleAddWorkerSuccess}
          context="detail"
          nameTypes={[addWorkerDrawerNameType]}
        />
      </WorkerAssignmentsContainer>
    );
  }

  // Normal view (groups list or workers list)
  return (
    <WorkerAssignmentsContainer>
      {/* Success Toast Notification */}
      <SuccessToast
        message={successMessage}
        open={showSuccessToast}
        onClose={() => setShowSuccessToast(false)}
      />

      {/* Layer 1: Tab Header Actions */}
      <WorkersTabHeader
        onManageFields={handleManageFields}
        onAddWorker={handleAddWorker}
        onCreateGroup={handleCreateGroup}
        setInviteWorkerType={setInviteWorkerType}
      />

      {/* Layer 2: Search & Filter Bar */}
      <SearchFilterBar
        searchText={searchText}
        onSearchChange={handleSearchChange}
        workerType={workerType}
        onWorkerTypeChange={handleWorkerTypeChange}
        viewByGroups={viewByGroups}
        onViewToggle={handleViewToggle}
      />

      {/* Layer 3: Conditional View - Toggle between grouped and flat list */}
      {viewByGroups ? (
        <WorkersTableByGroupsView
          searchText={searchText}
          onRefetchAvailable={(refetch) => {
            refetchGroupsRef.current = refetch;
          }}
          onLoadingChange={setIsGroupsLoading}
        />
      ) : (
        <WorkersListView
          searchText={searchText}
          workerType={workerType}
          onRefetchAvailable={(refetch) => {
            refetchWorkersListRef.current = refetch;
          }}
          onLoadingChange={setIsWorkersListLoading}
        />
      )}

      {/* Create Group Drawer */}
      <CreateGroupDrawer
        key={`create-drawer-${drawerRenderKey}`}
        open={showCreateDrawer}
        onClose={handleCloseDrawer}
        onSuccess={handleCreateSuccess}
      />

      {/* Quick Action Drawer (Assign workers/leads from table) */}
      <EditGroupDrawer
        key={`quick-action-table-${drawerRenderKey}-${quickActionGroupId}`}
        open={showQuickActionDrawer}
        onClose={handleCloseQuickActionDrawer}
        onSuccess={handleQuickActionSuccess}
        groupId={quickActionGroupId}
        initialGroupName={quickActionGroupName}
        groupVersion={1}
        initialView={quickActionView}
      />

      {/* Add Worker Drawer - QBO Contacts Integration */}
      <AddWorkerDrawer
        open={showAddWorkerDrawer}
        onClose={() => dispatch(closeAddWorkerDrawer())}
        onSuccess={handleAddWorkerSuccess}
        onRefetchData={getRefetchFunction()}
        context="normal"
        nameTypes={[addWorkerDrawerNameType]}
      />

      {isInviteWorkerEnabled && (
        <InviteWorkerDrawer
          setInviteWorkerType={setInviteWorkerType}
          inviteWorkerType={inviteWorkerType}
        />
      )}
    </WorkerAssignmentsContainer>
  );
};

export default WorkerAssignmentsTab;
