import { useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSandbox } from '@payroll/quicksand';
import { useGetGroupManagers } from 'src/js/service/hooks/groups/useGetGroupManagers';
import { useTimeTrackingWorkers } from 'src/js/service/hooks/groups/useTimeTrackingWorkers';
import {
  TimeTracking_TimeForInput,
  TimeTracking_WorkerOrderBy,
} from 'src/__generated__/timeTracking/graphql';
import {
  setSelectedLeads,
  setInitialLeads,
  setCurrentLeadWorkers,
  addDrawerWorkers,
  clearDrawerWorkers,
  clearDrawerData,
  DrawerWorker,
  WorkersGroupViewState,
} from '../store/workersGroupViewSlice';
import { GroupDrawerView } from '../types/Groups/GroupDrawer.types';

/**
 * Edit Mode Initialization Hook for MANAGERS (Assign Leads)
 * Fetches FRESH data every time drawer opens OR view changes to AssignLeads
 * Production-ready - copies EXACT pattern that was working
 */
export const useInitializeEditMode = (
  mode: 'create' | 'edit',
  groupId: string | undefined,
  open: boolean,
  managerCount?: number,
  currentView?: string,
) => {
  const sandbox = useSandbox();
  const dispatch = useDispatch();

  // CRITICAL: Read currentGroupId from Redux to detect group changes
  const currentGroupIdInRedux = useSelector(
    (state: { workersGroupView: WorkersGroupViewState }) =>
      state.workersGroupView.currentGroupId,
  );

  // CRITICAL: Anti-loop refs to prevent infinite fetchMore calls
  const isFetchingManagersRef = useRef(false);
  const previousManagerCountRef = useRef(0);

  // Track if we've initialized this mount (component remounts via key prop for fresh start)
  const hasInitializedRef = useRef(false);

  // Track if we've already fetched managers for this group to prevent infinite loop
  const hasFetchedManagersRef = useRef(false);

  // Hooks for fetching managers (leads)
  const {
    loadManagers,
    managers,
    pageInfo: managersPageInfo,
    fetchMore: fetchMoreManagers,
  } = useGetGroupManagers();

  // Hook for fetching all company workers
  const { loadWorkers, workers: companyWorkers } = useTimeTrackingWorkers();

  /**
   * INITIALIZATION STRATEGY:
   * - GroupDrawer has dynamic key prop that changes on every open (forces remount)
   * - This hook runs fresh on every mount
   * - We clear drawer data ONCE per mount to ensure fresh state
   * - No complex state tracking needed - remount handles it
   */
  // Track the previous groupId to detect changes
  const previousGroupIdRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (
      mode === 'edit' &&
      open &&
      currentGroupIdInRedux &&
      !hasInitializedRef.current
    ) {
      sandbox.logger.info(
        'Component="useInitializeEditMode" Event="MANAGERS HOOK: Fresh component mount - clearing stale data"',
        {
          groupId: currentGroupIdInRedux,
          mode,
        },
      );

      // Clear any stale drawer data from previous sessions
      dispatch(clearDrawerData());
      hasInitializedRef.current = true;

      // Reset fetch protection refs
      isFetchingManagersRef.current = false;
      previousManagerCountRef.current = 0;
      hasFetchedManagersRef.current = false; // Reset fetch tracker
      previousGroupIdRef.current = currentGroupIdInRedux;
    }

    // Reset fetch tracker when drawer closes to allow refetch on reopen
    if (!open) {
      hasInitializedRef.current = false;
      hasFetchedManagersRef.current = false;
    }
  }, [mode, open, currentGroupIdInRedux, dispatch, sandbox]);

  // Reset fetch tracker when switching TO AssignLeads view to force fresh data load
  useEffect(() => {
    const isAssignLeadsView =
      currentView === GroupDrawerView.AssignLeads ||
      currentView === 'assign-leads';

    if (open && isAssignLeadsView && hasFetchedManagersRef.current) {
      sandbox.logger.info(
        'Component="useInitializeEditMode" Event="View switched to AssignLeads - resetting fetch tracker for fresh data"',
        {
          groupId,
          currentView,
        },
      );
      // Reset to allow fresh fetch with updated group memberships
      hasFetchedManagersRef.current = false;
    }
  }, [currentView, open, groupId, sandbox]);

  // Callback: Dispatch company workers after managers are loaded
  const handleCompanyWorkersLoaded = useCallback(() => {
    if (!companyWorkers || companyWorkers.length === 0) {
      return;
    }

    if (!managers) {
      return;
    }

    // Filter out already-selected managers
    const existingIds = new Set(managers.map((w: any) => w.id));
    const newWorkersOnly = companyWorkers.filter(
      (w: any) => !existingIds.has(w.id),
    );

    const workerDrawerWorkers: DrawerWorker[] = newWorkersOnly.map(
      (worker: any) => ({
        id: worker.id,
        type: worker.type,
        firstName: worker.firstName || '',
        lastName: worker.lastName || '',
        displayName: worker.displayName,
        isActive: worker.isActive,
        isSelected: false,
        memberOfGroup: worker.memberOfGroup || null, // Keep full object
        managesGroups: worker.managesGroups || [],
      }),
    );

    dispatch(
      addDrawerWorkers({ workers: workerDrawerWorkers, markAsManagers: false }),
    );
  }, [companyWorkers, managers, dispatch]);

  // Callback: Process and dispatch managers
  const handleManagersLoaded = useCallback(() => {
    if (!managers || managers.length === 0) {
      return;
    }

    const expectedCount = managerCount || managers.length;
    const currentCount = managers.length;

    // Anti-loop guard: Check if count is stuck
    if (
      currentCount === previousManagerCountRef.current &&
      isFetchingManagersRef.current
    ) {
      sandbox.logger.warn(
        'Manager count unchanged during fetch - stopping to prevent loop',
        {
          currentCount,
          expectedCount,
        },
      );
      isFetchingManagersRef.current = false;
      // Don't return - proceed to dispatch what we have
    }

    // Need more pages?
    if (
      currentCount < expectedCount &&
      managersPageInfo?.hasNextPage &&
      !isFetchingManagersRef.current
    ) {
      sandbox.logger.info(
        'Component="useInitializeEditMode" Event="Fetching more managers"',
        {
          currentCount,
          expectedCount,
          remaining: expectedCount - currentCount,
        },
      );
      isFetchingManagersRef.current = true;
      previousManagerCountRef.current = currentCount;
      fetchMoreManagers();
      return;
    }

    // Reset fetching flag
    isFetchingManagersRef.current = false;

    // All managers loaded - dispatch to Redux
    sandbox.logger.info(
      'Component="useInitializeEditMode" Event="All managers loaded - dispatching to Redux"',
      {
        totalManagers: currentCount,
      },
    );

    const selectedLeads: Record<string, TimeTracking_TimeForInput> = {};
    const leadWorkers: any[] = [];
    const drawerWorkers: DrawerWorker[] = managers.map((manager: any) => {
      selectedLeads[manager.id] = {
        id: manager.id,
        timeForType: manager.type,
      };
      leadWorkers.push(manager);

      return {
        id: manager.id,
        type: manager.type,
        firstName: manager.firstName || '',
        lastName: manager.lastName || '',
        displayName: manager.displayName,
        isActive: manager.isActive,
        isSelected: true,
        memberOfGroup: manager.memberOfGroup || null, // Keep full object
        managesGroups: manager.managesGroups || [],
      };
    });

    dispatch(setSelectedLeads(selectedLeads));
    dispatch(setInitialLeads(selectedLeads));
    dispatch(setCurrentLeadWorkers(leadWorkers));
    dispatch(
      addDrawerWorkers({ workers: drawerWorkers, markAsManagers: true }),
    );

    // Load company workers to get fresh group membership data
    loadWorkers({
      first: 100,
      filter: { isActive: true },
      orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [managers, managerCount, dispatch, loadWorkers, sandbox]);

  // FRESH FETCH: Trigger when view changes to AssignLeads
  useEffect(() => {
    // Check both enum value and string value for compatibility
    const isAssignLeadsView =
      currentView === GroupDrawerView.AssignLeads ||
      currentView === 'assign-leads';

    sandbox.logger.info(
      'Component="useInitializeEditMode" Event="Fetch effect triggered"',
      {
        mode,
        groupId,
        open,
        managerCount,
        currentView,
        expectedView: GroupDrawerView.AssignLeads,
        isAssignLeadsView,
        conditions: {
          modeEdit: mode === 'edit',
          hasGroupId: !!groupId,
          isOpen: open,
          isCorrectView: isAssignLeadsView,
        },
      },
    );

    // Only trigger for edit mode with AssignLeads view
    if (mode !== 'edit' || !groupId || !open || !isAssignLeadsView) {
      sandbox.logger.info(
        'Component="useInitializeEditMode" Event="Skipping fetch - conditions not met"',
        {
          mode,
          groupId,
          open,
          currentView,
          isAssignLeadsView,
        },
      );
      return;
    }

    // Check if groupId has changed - if so, allow refetch
    if (previousGroupIdRef.current !== groupId) {
      sandbox.logger.info(
        'Component="useInitializeEditMode" Event="Group ID changed - resetting fetch tracker"',
        {
          previousGroupId: previousGroupIdRef.current,
          newGroupId: groupId,
        },
      );
      hasFetchedManagersRef.current = false;
      previousGroupIdRef.current = groupId;
    }

    // Anti-loop: Only fetch once per mount
    if (hasFetchedManagersRef.current) {
      sandbox.logger.info(
        'Component="useInitializeEditMode" Event="Already fetched managers for this mount - skipping"',
        {
          groupId,
        },
      );
      return;
    }

    sandbox.logger.info(
      'Component="useInitializeEditMode" Event="Conditions met - fetching managers"',
      {
        groupId,
        managerCount,
      },
    );

    // Mark as fetched to prevent re-fetch
    hasFetchedManagersRef.current = true;

    // Fetch managers and force refresh company workers to get updated group memberships
    if (managerCount === 0) {
      sandbox.logger.info(
        'Component="useInitializeEditMode" Event="No managers - dispatching empty array"',
      );
      dispatch(addDrawerWorkers({ workers: [], markAsManagers: true }));
      // Load fresh data from network with updated group memberships
      loadWorkers({
        first: 100,
        filter: { isActive: true },
        orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
      });
    } else {
      sandbox.logger.info(
        'Component="useInitializeEditMode" Event="Loading managers"',
        {
          groupId,
          count: managerCount,
        },
      );
      loadManagers({ groupId, first: managerCount || 100 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    mode,
    groupId,
    open,
    currentView,
    // REMOVED managerCount from dependencies to prevent infinite loop
    dispatch,
    loadManagers,
    loadWorkers,
    sandbox,
  ]);

  // Process managers when they arrive
  useEffect(() => {
    const isAssignLeadsView =
      currentView === GroupDrawerView.AssignLeads ||
      currentView === 'assign-leads';

    if (!groupId || !open || mode !== 'edit' || !isAssignLeadsView) {
      return;
    }
    handleManagersLoaded();
  }, [managers, groupId, open, mode, currentView, handleManagersLoaded]);

  // Process company workers when they arrive
  useEffect(() => {
    const isAssignLeadsView =
      currentView === GroupDrawerView.AssignLeads ||
      currentView === 'assign-leads';

    if (!groupId || !open || mode !== 'edit' || !isAssignLeadsView) {
      return;
    }
    handleCompanyWorkersLoaded();
  }, [
    companyWorkers,
    groupId,
    open,
    mode,
    currentView,
    handleCompanyWorkersLoaded,
  ]);
};
