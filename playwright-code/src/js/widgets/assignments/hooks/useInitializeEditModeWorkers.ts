import { useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSandbox } from '@payroll/quicksand';
import { useGetGroupMembers } from 'src/js/service/hooks/groups/useGetGroupMembers';
import { useTimeTrackingWorkers } from 'src/js/service/hooks/groups/useTimeTrackingWorkers';
import {
  TimeTracking_TimeForInput,
  TimeTracking_WorkerOrderBy,
} from 'src/__generated__/timeTracking/graphql';
import {
  setSelectedMembers,
  setInitialMembers,
  setCurrentMemberWorkers,
  addDrawerWorkers,
  clearDrawerWorkers,
  clearDrawerData,
  DrawerWorker,
  WorkersGroupViewState,
} from '../store/workersGroupViewSlice';
import { GroupDrawerView } from '../types/Groups/GroupDrawer.types';

/**
 * Edit Mode Initialization Hook for MEMBERS (Assign Workers)
 * Fetches FRESH data every time drawer opens OR view changes to AssignWorkers
 * Production-ready - EXACT COPY of useInitializeEditMode pattern for managers
 */
export const useInitializeEditModeWorkers = (
  mode: 'create' | 'edit',
  groupId: string | undefined,
  open: boolean,
  memberCount?: number,
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
  const isFetchingMembersRef = useRef(false);
  const previousMemberCountRef = useRef(0);

  // Track if we've initialized this mount (component remounts via key prop for fresh start)
  const hasInitializedRef = useRef(false);

  // Hooks for fetching members (workers)
  const {
    loadMembers,
    members,
    groupInfo,
    pageInfo: membersPageInfo,
    fetchMore: fetchMoreMembers,
  } = useGetGroupMembers();

  // Hook for fetching all company workers
  const { loadWorkers, workers: companyWorkers } = useTimeTrackingWorkers();

  /**
   * INITIALIZATION STRATEGY:
   * - GroupDrawer has dynamic key prop that changes on every open (forces remount)
   * - This hook runs fresh on every mount
   * - We clear drawer data ONCE per mount to ensure fresh state
   * - No complex state tracking needed - remount handles it
   */
  useLayoutEffect(() => {
    if (
      mode === 'edit' &&
      open &&
      currentGroupIdInRedux &&
      !hasInitializedRef.current
    ) {
      sandbox.logger.info(
        'Component="useInitializeEditModeWorkers" Event="WORKERS HOOK: Fresh component mount - clearing stale data"',
        {
          groupId: currentGroupIdInRedux,
          mode,
        },
      );

      // Clear any stale drawer data from previous sessions
      dispatch(clearDrawerData());
      hasInitializedRef.current = true;

      // Reset fetch protection refs
      isFetchingMembersRef.current = false;
      previousMemberCountRef.current = 0;
    }
  }, [mode, open, currentGroupIdInRedux, dispatch, sandbox]);

  // Callback: Dispatch company workers after members are loaded
  const handleCompanyWorkersLoaded = useCallback(() => {
    if (!companyWorkers || companyWorkers.length === 0) {
      return;
    }

    if (!members) {
      return;
    }

    // Filter out already-selected members
    const existingIds = new Set(members.map((w: any) => w.id));
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
  }, [companyWorkers, members, dispatch]);

  // Callback: Process and dispatch members
  const handleMembersLoaded = useCallback(() => {
    if (!members || members.length === 0) {
      return;
    }

    const expectedCount = memberCount || members.length;
    const currentCount = members.length;

    // Anti-loop guard: Check if count is stuck
    if (
      currentCount === previousMemberCountRef.current &&
      isFetchingMembersRef.current
    ) {
      sandbox.logger.warn(
        'Component="useInitializeEditModeWorkers" Event="Member count unchanged during fetch - stopping to prevent loop"',
        {
          currentCount,
          expectedCount,
        },
      );
      isFetchingMembersRef.current = false;
      // Don't return - proceed to dispatch what we have
    }

    // Need more pages?
    if (
      currentCount < expectedCount &&
      membersPageInfo?.hasNextPage &&
      !isFetchingMembersRef.current
    ) {
      sandbox.logger.info(
        'Component="useInitializeEditModeWorkers" Event="Fetching more members"',
        {
          currentCount,
          expectedCount,
          remaining: expectedCount - currentCount,
        },
      );
      isFetchingMembersRef.current = true;
      previousMemberCountRef.current = currentCount;
      fetchMoreMembers();
      return;
    }

    // Reset fetching flag
    isFetchingMembersRef.current = false;

    // All members loaded - dispatch to Redux
    sandbox.logger.info(
      'Component="useInitializeEditModeWorkers" Event="All members loaded - dispatching to Redux"',
      {
        totalMembers: currentCount,
      },
    );

    const selectedMembers: Record<string, TimeTracking_TimeForInput> = {};
    const memberWorkers: any[] = [];
    // Pre-selected members belong to this group (groupInfo), so populate memberOfGroup
    const memberOfGroupInfo = groupInfo
      ? { id: groupInfo.id, name: groupInfo.name, isActive: groupInfo.isActive }
      : null;
    const drawerWorkers: DrawerWorker[] = members.map((member: any) => {
      selectedMembers[member.id] = {
        id: member.id,
        timeForType: member.type,
      };
      memberWorkers.push(member);

      return {
        id: member.id,
        type: member.type,
        firstName: member.firstName || '',
        lastName: member.lastName || '',
        displayName: member.displayName,
        isActive: member.isActive,
        isSelected: true,
        memberOfGroup: memberOfGroupInfo, // Use group info since these are members of this group
        managesGroups: member.managesGroups || [],
      };
    });

    dispatch(setSelectedMembers(selectedMembers));
    dispatch(setInitialMembers(selectedMembers));
    dispatch(setCurrentMemberWorkers(memberWorkers));
    dispatch(
      addDrawerWorkers({ workers: drawerWorkers, markAsManagers: true }),
    );

    // Fetch company workers for pagination
    loadWorkers({
      first: 100,
      filter: { isActive: true },
      orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members, memberCount, groupInfo, dispatch, loadWorkers, sandbox]);

  // Reset refs when drawer closes (clearing handled by useInitializeEditMode)
  useEffect(() => {
    if (!open) {
      isFetchingMembersRef.current = false;
      previousMemberCountRef.current = 0;
    }
  }, [open]);

  // FRESH FETCH: Trigger when view changes to AssignWorkers
  useEffect(() => {
    // Check both enum value and string value for compatibility
    const isAssignWorkersView =
      currentView === GroupDrawerView.AssignWorkers ||
      currentView === 'assign-workers';

    sandbox.logger.info(
      'Component="useInitializeEditModeWorkers" Event="Fetch effect triggered"',
      {
        mode,
        groupId,
        open,
        memberCount,
        currentView,
        expectedView: GroupDrawerView.AssignWorkers,
        isAssignWorkersView,
        conditions: {
          modeEdit: mode === 'edit',
          hasGroupId: !!groupId,
          isOpen: open,
          isCorrectView: isAssignWorkersView,
        },
      },
    );

    // Only trigger for edit mode with AssignWorkers view
    if (mode !== 'edit' || !groupId || !open || !isAssignWorkersView) {
      sandbox.logger.info(
        'Component="useInitializeEditModeWorkers" Event="Skipping fetch - conditions not met"',
        {
          mode,
          groupId,
          open,
          currentView,
          isAssignWorkersView,
        },
      );
      return;
    }

    sandbox.logger.info(
      'Component="useInitializeEditModeWorkers" Event="Conditions met - fetching members"',
      {
        groupId,
        memberCount,
      },
    );

    // Fetch members
    if (memberCount === 0) {
      sandbox.logger.info(
        'Component="useInitializeEditModeWorkers" Event="No members - dispatching empty array"',
      );
      dispatch(addDrawerWorkers({ workers: [], markAsManagers: true }));
      loadWorkers({
        first: 100,
        filter: { isActive: true },
        orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
      });
    } else {
      sandbox.logger.info(
        'Component="useInitializeEditModeWorkers" Event="Loading members"',
        {
          groupId,
          count: memberCount,
        },
      );
      loadMembers({ groupId, first: memberCount || 100 });
    }
  }, [
    mode,
    groupId,
    open,
    memberCount,
    currentView,
    dispatch,
    loadMembers,
    loadWorkers,
    sandbox,
  ]);

  // Process members when they arrive
  useEffect(() => {
    const isAssignWorkersView =
      currentView === GroupDrawerView.AssignWorkers ||
      currentView === 'assign-workers';

    if (!groupId || !open || mode !== 'edit' || !isAssignWorkersView) {
      return;
    }
    handleMembersLoaded();
  }, [members, groupId, open, mode, currentView, handleMembersLoaded]);

  // Process company workers when they arrive
  useEffect(() => {
    const isAssignWorkersView =
      currentView === GroupDrawerView.AssignWorkers ||
      currentView === 'assign-workers';

    if (!groupId || !open || mode !== 'edit' || !isAssignWorkersView) {
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
