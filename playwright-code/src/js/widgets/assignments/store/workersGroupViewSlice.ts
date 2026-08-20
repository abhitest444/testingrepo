import {
  createSlice,
  createEntityAdapter,
  PayloadAction,
  EntityAdapter,
  EntityState,
} from '@reduxjs/toolkit';
import {
  GetTimeTrackingGroupsQuery_timeTrackingGroups_TimeTracking_GroupConnection_edges_TimeTracking_GroupEdge_node_TimeTracking_Group as QueryGroupNode,
  TimeTracking_TimeForInput,
} from 'src/__generated__/timeTracking/graphql';
import { GroupDrawerContext } from '../types/Groups/GroupDrawer.types';
import { WorkerNameType } from '../types';

/**
 * Redux slice for Workers Group View
 * Manages groups list with normalized state using entity adapter
 * Includes selection state for assigning workers and leads to groups
 */

export interface Worker {
  id: string;
  name: string;
  status: string;
  role?: string;
  isGroupLead?: boolean;
}

/**
 * Enhanced Worker interface for unified drawer list (edit mode only)
 * Includes selection state and all worker details
 */
export interface DrawerWorker {
  id: string;
  type: string; // TimeTracking_TimeForType
  firstName: string;
  lastName: string;
  displayName: string;
  isActive: boolean;
  isSelected: boolean; // Managed by Redux
  memberOfGroup: {
    id: string;
    name: string;
    isActive: boolean;
  } | null;
  managesGroups: Array<{ id: string; name: string }>;
}

interface GroupsState extends EntityState<QueryGroupNode> {
  loading: boolean;
  error: string | null;
  cursor: string | null;
  hasMore: boolean;
  isLoadingMore: boolean;
  totalCount: number; // Total count from GraphQL response (for pagination)
  headerCount: number; // Header count from useActiveGroupsTotalCount (for header display)
  hasNextPage: boolean;
}

export interface WorkersForGroupState {
  ids: string[];
  entities: Record<string, Worker>;
  loading: boolean;
  error: string | null;
  cursor: string | null;
  hasMore: boolean;
  isLoadingMore: boolean;
  isSearchResult: boolean; // true if data is from search API, false if from members API
}

export interface WorkersGroupViewState {
  groups: GroupsState;
  selectedMembers: Record<string, TimeTracking_TimeForInput>;
  selectedLeads: Record<string, TimeTracking_TimeForInput>;
  workersByGroup: Record<string, WorkersForGroupState>;
  expandedGroupIds: string[];

  // Current group being edited/assigned
  currentGroupId: string | null;
  currentGroupName: string | null;
  drawerContext: GroupDrawerContext | null;
  managerCount?: number; // Manager count for optimization
  memberCount?: number; // Member count for optimization

  // Track initial members/leads for change detection
  initialMembers: Record<string, TimeTracking_TimeForInput>;
  initialLeads: Record<string, TimeTracking_TimeForInput>;

  // Store actual worker objects for currently assigned members (for display first)
  currentMemberWorkers: Worker[];
  currentLeadWorkers: Worker[];

  // Unified drawer worker list for edit mode (incremental fetch + sort)
  drawerWorkers: {
    byId: Record<string, DrawerWorker>; // Deduped by ID
    allIds: string[]; // Sorted: selected first, then by displayName
    totalFetched: number;
    hasLoadedInitialManagers: boolean; // Track if managers are loaded
  };

  quickActionDrawerOpen: boolean;
  quickActionDrawerView: string | null; // 'AssignWorkers' | 'AssignLeads'

  deleteModal: {
    open: boolean;
    groupId: string | null;
    groupName: string | null;
    version: number | null;
  };

  unsavedChangesModal: {
    open: boolean;
  };

  groupDetailView: {
    isActive: boolean;
    groupId: string | null;
    groupName: string | null;
    error: string | null; // Error from headerTotalCount (first preference) or workersApiError
  };

  // View toggle state
  viewByGroups: boolean;

  addWorkerDrawerOpen: boolean;

  /** When opening Add Worker drawer from empty state, pass initial type (employee/contractor) */
  addWorkerDrawerNameType: WorkerNameType;

  /** Open state for Create Group drawer (header or empty state CTA) */
  createGroupDrawerOpen: boolean;

  // Error state for drawer operations (Create/Edit Group workflow)
  drawerError: {
    errorTitle: string | null;
    errorMessage: string | null;
  };
}

const groupsAdapter: EntityAdapter<QueryGroupNode> =
  createEntityAdapter<QueryGroupNode>({
    selectId: (group) => group.id,
    sortComparer: (a, b) => a.name.localeCompare(b.name),
  });

const initialState: WorkersGroupViewState = {
  groups: {
    ...groupsAdapter.getInitialState(),
    loading: false,
    error: null,
    cursor: null,
    hasMore: true,
    isLoadingMore: false,
    totalCount: 0,
    headerCount: 0,
    hasNextPage: false,
  },
  selectedMembers: {},
  selectedLeads: {},
  workersByGroup: {},
  expandedGroupIds: [],
  currentGroupId: null,
  currentGroupName: null,
  drawerContext: null,
  initialMembers: {},
  initialLeads: {},
  currentMemberWorkers: [],
  currentLeadWorkers: [],
  drawerWorkers: {
    byId: {},
    allIds: [],
    totalFetched: 0,
    hasLoadedInitialManagers: false,
  },
  quickActionDrawerOpen: false,
  quickActionDrawerView: null,
  deleteModal: {
    open: false,
    groupId: null,
    groupName: null,
    version: null,
  },
  unsavedChangesModal: {
    open: false,
  },
  groupDetailView: {
    isActive: false,
    groupId: null,
    groupName: null,
    error: null,
  },
  viewByGroups: false, // Default to workers list view
  addWorkerDrawerOpen: false,
  addWorkerDrawerNameType: WorkerNameType.EMPLOYEE,
  createGroupDrawerOpen: false,
  drawerError: {
    errorTitle: null,
    errorMessage: null,
  },
};

const workersGroupViewSlice = createSlice({
  name: 'workersGroupView',
  initialState,
  reducers: {
    setGroupsLoading(state, action: PayloadAction<{ loading: boolean }>) {
      state.groups.loading = action.payload.loading;
      if (action.payload.loading) {
        state.groups.error = null;
      }
    },

    setGroupsData(
      state,
      action: PayloadAction<{
        groups: QueryGroupNode[];
        cursor?: string | null;
        hasMore?: boolean;
        totalCount?: number;
        hasNextPage?: boolean;
      }>,
    ) {
      groupsAdapter.setAll(state.groups, action.payload.groups);
      state.groups.loading = false;
      state.groups.error = null;
      state.groups.cursor = action.payload.cursor ?? null;
      state.groups.hasMore = action.payload.hasMore ?? false;
      state.groups.isLoadingMore = false;
      state.groups.totalCount = action.payload.totalCount ?? 0;
      state.groups.hasNextPage = action.payload.hasNextPage ?? false;
    },

    /**
     * Set header count for groups (total active groups count)
     * Used for header display, separate from pagination totalCount
     */
    setGroupsHeaderCount(
      state,
      action: PayloadAction<{ headerCount: number }>,
    ) {
      state.groups.headerCount = action.payload.headerCount;
    },

    appendGroupsData(
      state,
      action: PayloadAction<{
        groups: QueryGroupNode[];
        cursor?: string | null;
        hasMore?: boolean;
        hasNextPage?: boolean;
      }>,
    ) {
      groupsAdapter.addMany(state.groups, action.payload.groups);
      state.groups.cursor = action.payload.cursor ?? null;
      state.groups.hasMore = action.payload.hasMore ?? false;
      state.groups.hasNextPage = action.payload.hasNextPage ?? false;
      state.groups.isLoadingMore = false;
    },

    setLoadingMore(state, action: PayloadAction<{ loading: boolean }>) {
      state.groups.isLoadingMore = action.payload.loading;
    },

    setGroupsError(state, action: PayloadAction<{ error: string }>) {
      state.groups.error = action.payload.error;
      state.groups.loading = false;
      state.groups.isLoadingMore = false;
    },

    removeGroupFromState(state, action: PayloadAction<{ groupId: string }>) {
      groupsAdapter.removeOne(state.groups, action.payload.groupId);
    },

    updateGroupStats(
      state,
      action: PayloadAction<{
        groupId: string;
        stats: { memberCount: number; managerCount: number };
      }>,
    ) {
      const { groupId, stats } = action.payload;
      const existingGroup = state.groups.entities[groupId];
      if (existingGroup) {
        groupsAdapter.updateOne(state.groups, {
          id: groupId,
          changes: { stats },
        });
      }
    },

    openDeleteModal(
      state,
      action: PayloadAction<{
        groupId: string;
        groupName: string;
        version: number;
      }>,
    ) {
      state.deleteModal = {
        open: true,
        groupId: action.payload.groupId,
        groupName: action.payload.groupName,
        version: action.payload.version,
      };
    },

    closeDeleteModal(state) {
      state.deleteModal = {
        open: false,
        groupId: null,
        groupName: null,
        version: null,
      };
    },

    openUnsavedChangesModal(state) {
      state.unsavedChangesModal = {
        open: true,
      };
    },

    closeUnsavedChangesModal(state) {
      state.unsavedChangesModal = {
        open: false,
      };
    },

    resetGroupsView() {
      return initialState;
    },

    /**
     * Set selected members for group assignment
     * Used when saving worker selections in "Assign Workers" drawer
     * Accepts a Record for direct assignment (efficient O(1) operation)
     */
    setSelectedMembers(
      state,
      action: PayloadAction<Record<string, TimeTracking_TimeForInput>>,
    ) {
      state.selectedMembers = action.payload;
    },

    /**
     * Toggle individual member selection
     * Used when checking/unchecking a worker in the list
     */
    toggleMemberSelection(
      state,
      action: PayloadAction<TimeTracking_TimeForInput>,
    ) {
      if (state.selectedMembers[action.payload.id]) {
        delete state.selectedMembers[action.payload.id];
      } else {
        state.selectedMembers[action.payload.id] = action.payload;
      }
    },

    /**
     * Clear all member selections
     * Used when closing drawer without saving or after successful assignment
     */
    clearMemberSelections(state) {
      state.selectedMembers = {};
    },

    /**
     * Set selected leads for group assignment
     * Used when saving lead selections in "Assign Leads" drawer
     * Accepts a Record for direct assignment (efficient O(1) operation)
     */
    setSelectedLeads(
      state,
      action: PayloadAction<Record<string, TimeTracking_TimeForInput>>,
    ) {
      state.selectedLeads = action.payload;
    },

    /**
     * Toggle individual lead selection
     * Used when checking/unchecking a lead in the list
     */
    toggleLeadSelection(
      state,
      action: PayloadAction<TimeTracking_TimeForInput>,
    ) {
      if (state.selectedLeads[action.payload.id]) {
        delete state.selectedLeads[action.payload.id];
      } else {
        state.selectedLeads[action.payload.id] = action.payload;
      }
    },

    /**
     * Clear all lead selections
     * Used when closing drawer without saving or after successful assignment
     */
    clearLeadSelections(state) {
      state.selectedLeads = {};
    },

    /**
     * Clear both member and lead selections
     * Used when closing drawer or resetting assignment state
     */
    clearAllSelections(state) {
      state.selectedMembers = {};
      state.selectedLeads = {};
    },

    /**
     * Set drawer context for context-aware save/navigation
     * Used when opening drawer from different entry points (Quick Action, Edit Group, Create Group)
     */
    setDrawerContext(
      state,
      action: PayloadAction<{
        groupId: string | null;
        groupName?: string | null;
        context: GroupDrawerContext;
        initialMembers?: Record<string, TimeTracking_TimeForInput>;
        initialLeads?: Record<string, TimeTracking_TimeForInput>;
        managerCount?: number; // Manager count for optimization
        memberCount?: number; // Member count for optimization
      }>,
    ) {
      state.currentGroupId = action.payload.groupId;
      state.currentGroupName = action.payload.groupName || null;
      state.drawerContext = action.payload.context;
      state.initialMembers = action.payload.initialMembers || {};
      state.initialLeads = action.payload.initialLeads || {};
      state.managerCount = action.payload.managerCount;
      state.memberCount = action.payload.memberCount;
    },

    /**
     * Clear drawer context
     * Used when closing drawer or completing save operation
     */
    clearDrawerContext(state) {
      state.currentGroupId = null;
      state.currentGroupName = null;
      state.drawerContext = null;
      state.initialMembers = {};
      state.initialLeads = {};
    },

    /**
     * Set initial members for change detection
     * Used to track what members were originally assigned
     */
    setInitialMembers(
      state,
      action: PayloadAction<Record<string, TimeTracking_TimeForInput>>,
    ) {
      state.initialMembers = action.payload;
    },

    /**
     * Set initial leads for change detection
     * Used to track what leads were originally assigned
     */
    setInitialLeads(
      state,
      action: PayloadAction<Record<string, TimeTracking_TimeForInput>>,
    ) {
      state.initialLeads = action.payload;
    },

    /**
     * Set current member workers (full objects for display)
     * Used in edit mode to show currently assigned members first
     */
    setCurrentMemberWorkers(state, action: PayloadAction<Worker[]>) {
      state.currentMemberWorkers = action.payload;
    },

    /**
     * Set current lead workers (full objects for display)
     * Used in edit mode to show currently assigned leads first
     */
    setCurrentLeadWorkers(state, action: PayloadAction<Worker[]>) {
      state.currentLeadWorkers = action.payload;
    },

    /**
     * Open quick action drawer
     * Used when clicking "Assign workers" or "Assign leads" from GroupRow
     */
    openQuickActionDrawer(
      state,
      action: PayloadAction<{ view: string }>, // 'AssignWorkers' | 'AssignLeads'
    ) {
      state.quickActionDrawerOpen = true;
      state.quickActionDrawerView = action.payload.view;
    },

    /**
     * Close quick action drawer
     * Resets drawer state
     */
    closeQuickActionDrawer(state) {
      state.quickActionDrawerOpen = false;
      state.quickActionDrawerView = null;
    },

    /**
     * Open add worker drawer
     * Opens QBO contacts drawer for adding employees/vendors.
     * Optional payload.workerType sets initial type when opening from empty state.
     */
    openAddWorkerDrawer(
      state,
      action: PayloadAction<{ workerType?: WorkerNameType } | undefined>,
    ) {
      state.addWorkerDrawerOpen = true;
      state.addWorkerDrawerNameType =
        action.payload?.workerType ?? WorkerNameType.EMPLOYEE;
    },

    /**
     * Close add worker drawer
     */
    closeAddWorkerDrawer(state) {
      state.addWorkerDrawerOpen = false;
      state.addWorkerDrawerNameType = WorkerNameType.EMPLOYEE;
    },

    /**
     * Open Create Group drawer (from header or empty state CTA)
     */
    openCreateGroupDrawer(state) {
      state.createGroupDrawerOpen = true;
    },

    /**
     * Close Create Group drawer
     */
    closeCreateGroupDrawer(state) {
      state.createGroupDrawerOpen = false;
    },

    toggleGroupExpansion(state, action: PayloadAction<string>) {
      const groupId = action.payload;
      const index = state.expandedGroupIds.indexOf(groupId);
      if (index > -1) {
        state.expandedGroupIds.splice(index, 1);
      } else {
        state.expandedGroupIds.push(groupId);
      }
    },

    setWorkersForGroup(
      state,
      action: PayloadAction<{
        groupId: string;
        workers: Worker[];
        cursor?: string | null;
        hasMore?: boolean;
        isSearchResult?: boolean;
      }>,
    ) {
      const {
        groupId,
        workers,
        cursor,
        hasMore,
        isSearchResult = false,
      } = action.payload;
      // Create a new workersByGroup object to ensure React detects the change
      state.workersByGroup = {
        ...state.workersByGroup,
        [groupId]: {
          ids: workers.map((w) => w.id),
          entities: workers.reduce((acc, w) => ({ ...acc, [w.id]: w }), {}),
          loading: false,
          error: null,
          cursor: cursor ?? null,
          hasMore: hasMore ?? false,
          isLoadingMore: false,
          isSearchResult,
        },
      };
    },

    appendWorkersForGroup(
      state,
      action: PayloadAction<{
        groupId: string;
        workers: Worker[];
        cursor?: string | null;
        hasMore?: boolean;
      }>,
    ) {
      const { groupId, workers, cursor, hasMore } = action.payload;
      const existing = state.workersByGroup[groupId];
      if (existing) {
        // Create new object reference for change detection
        state.workersByGroup = {
          ...state.workersByGroup,
          [groupId]: {
            ...existing,
            ids: [...existing.ids, ...workers.map((w) => w.id)],
            entities: {
              ...existing.entities,
              ...workers.reduce((acc, w) => ({ ...acc, [w.id]: w }), {}),
            },
            cursor: cursor ?? null,
            hasMore: hasMore ?? false,
            isLoadingMore: false,
          },
        };
      }
    },

    setWorkersLoadingForGroup(
      state,
      action: PayloadAction<{ groupId: string; loading: boolean }>,
    ) {
      const { groupId, loading } = action.payload;
      // Initialize workers state if it doesn't exist
      if (!state.workersByGroup[groupId]) {
        state.workersByGroup = {
          ...state.workersByGroup,
          [groupId]: {
            ids: [],
            entities: {},
            loading,
            error: null,
            cursor: null,
            hasMore: true,
            isLoadingMore: loading,
            isSearchResult: false,
          },
        };
      } else {
        // Update existing state with new object reference
        state.workersByGroup = {
          ...state.workersByGroup,
          [groupId]: {
            ...state.workersByGroup[groupId],
            isLoadingMore: loading,
            loading,
          },
        };
      }
    },

    /**
     * Navigate to group detail view (drill-down)
     * Shows workers for a specific group
     */
    openGroupDetailView(
      state,
      action: PayloadAction<{ groupId: string; groupName: string }>,
    ) {
      state.groupDetailView = {
        isActive: true,
        groupId: action.payload.groupId,
        groupName: action.payload.groupName,
        error: null,
      };
    },

    /**
     * Navigate back to groups list view
     * Closes the group detail drill-down
     * Also resets view to "Group by" mode
     */
    closeGroupDetailView(state) {
      state.groupDetailView = {
        isActive: false,
        groupId: null,
        groupName: null,
        error: null,
      };
      state.viewByGroups = true; // Always reset to "Group by" view
    },

    /**
     * Set error for group detail view
     * Prefers errorHeaderTotalCount over workersApiError
     */
    setGroupDetailViewError(
      state,
      action: PayloadAction<{ error: string | null }>,
    ) {
      state.groupDetailView.error = action.payload.error;
    },

    /**
     * Toggle between "Group by" and "List" view
     */
    setViewByGroups(state, action: PayloadAction<boolean>) {
      state.viewByGroups = action.payload;
    },

    /**
     * Add workers to unified drawer list (edit mode only)
     * Merges new workers, dedupes by ID, sorts (selected first)
     */
    addDrawerWorkers(
      state,
      action: PayloadAction<{
        workers: DrawerWorker[];
        markAsManagers?: boolean;
      }>,
    ) {
      const { workers, markAsManagers = false } = action.payload;

      // Merge workers into byId (dedupe)
      // CRITICAL: Never overwrite existing workers (managers are already selected)
      let skipped = 0;
      let added = 0;
      const newWorkerIds: string[] = []; // Track newly added IDs

      workers.forEach((worker) => {
        const exists = !!state.drawerWorkers.byId[worker.id];

        if (!exists) {
          // New worker - add it
          const isSelected = markAsManagers ? true : worker.isSelected;
          state.drawerWorkers.byId[worker.id] = {
            ...worker,
            isSelected,
          };
          newWorkerIds.push(worker.id); // Track new ID
          added += 1;
        } else if (markAsManagers) {
          // Worker exists but we're marking as manager - update isSelected
          state.drawerWorkers.byId[worker.id].isSelected = true;
          added += 1;
        } else {
          // Worker exists and we're NOT marking as manager
          // UPDATE memberOfGroup and managesGroups to reflect fresh API data
          // IMPORTANT: Mutate properties directly (Immer) - don't replace object
          const existingWorker = state.drawerWorkers.byId[worker.id];
          existingWorker.memberOfGroup = worker.memberOfGroup; // Update with fresh group data
          existingWorker.managesGroups = worker.managesGroups; // Update with fresh manages data
          existingWorker.isActive = worker.isActive; // Update active status
          skipped += 1;
        }
      });

      // CRITICAL FIX: Only sort when loading initial managers!
      // After that, just APPEND new workers to preserve user selections and pagination
      if (markAsManagers) {
        // Initial manager load: Sort selected first, then by name
        state.drawerWorkers.allIds = Object.values(state.drawerWorkers.byId)
          .sort((a, b) => {
            if (a.isSelected && !b.isSelected) return -1;
            if (!a.isSelected && b.isSelected) return 1;
            return a.displayName.localeCompare(b.displayName);
          })
          .map((w) => w.id);
      } else {
        // Subsequent worker adds: Just APPEND new IDs (no re-sort to preserve selections)
        const sortedNewIds = newWorkerIds.sort((a, b) => {
          const workerA = state.drawerWorkers.byId[a];
          const workerB = state.drawerWorkers.byId[b];
          return workerA.displayName.localeCompare(workerB.displayName);
        });

        state.drawerWorkers.allIds = [
          ...state.drawerWorkers.allIds,
          ...sortedNewIds,
        ];
      }

      state.drawerWorkers.totalFetched = state.drawerWorkers.allIds.length;

      if (markAsManagers) {
        state.drawerWorkers.hasLoadedInitialManagers = true;
      }
    },

    /**
     * Toggle worker selection in unified drawer list (edit mode only)
     * NOTE: Does NOT re-sort to preserve pagination positions
     */
    toggleDrawerWorkerSelection(
      state,
      action: PayloadAction<{ workerId: string }>,
    ) {
      const { workerId } = action.payload;
      const worker = state.drawerWorkers.byId[workerId];
      if (worker) {
        worker.isSelected = !worker.isSelected;

        // DO NOT re-sort here - it disrupts pagination!
        // Workers should stay in the same position when toggling
        // Sorting only happens when adding/merging workers
      }
    },

    /**
     * Clear unified drawer worker list (on drawer close)
     */
    clearDrawerWorkers(state) {
      state.drawerWorkers = {
        byId: {},
        allIds: [],
        totalFetched: 0,
        hasLoadedInitialManagers: false,
      };
    },

    /**
     * Clear drawer DATA only (preserve context)
     * Clears:
     * - All selections (selectedMembers, selectedLeads)
     * - Initial state tracking (initialMembers, initialLeads)
     * - Current workers (currentMemberWorkers, currentLeadWorkers)
     * - Drawer workers (unified edit mode list)
     *
     * PRESERVES:
     * - currentGroupId, currentGroupName, drawerContext (needed to know which group we're editing)
     *
     * Use this when opening drawer for a new group to prevent state accumulation
     */
    clearDrawerData(state) {
      const prevCount = state.drawerWorkers.allIds.length;
      const prevSelected = state.drawerWorkers.allIds.filter(
        (id) => state.drawerWorkers.byId[id]?.isSelected,
      ).length;

      // CRITICAL DEBUG: Log clearing action
      if (
        typeof window !== 'undefined' &&
        (window as any).__REDUX_CLEAR_LOG__
      ) {
        (window as any).__REDUX_CLEAR_LOG__.push({
          action: 'clearDrawerData',
          prevCount,
          prevSelected,
          groupId: state.currentGroupId,
        });
      }

      // Clear initial state tracking
      state.initialMembers = {};
      state.initialLeads = {};

      // Clear selections
      state.selectedMembers = {};
      state.selectedLeads = {};

      // Clear current workers
      state.currentMemberWorkers = [];
      state.currentLeadWorkers = [];

      // Clear drawer workers
      state.drawerWorkers = {
        byId: {},
        allIds: [],
        totalFetched: 0,
        hasLoadedInitialManagers: false,
      };
    },

    /**
     * Reset all drawer-related state (combined cleanup action)
     * Clears:
     * - Drawer context (groupId, groupName, context, initialMembers, initialLeads)
     * - All selections (selectedMembers, selectedLeads)
     * - Drawer workers (unified edit mode list)
     * - Drawer error state
     *
     * Use this when closing drawer to ensure clean state for next open
     */
    resetDrawerState(state) {
      // Clear drawer context
      state.currentGroupId = null;
      state.currentGroupName = null;
      state.drawerContext = null;
      state.initialMembers = {};
      state.initialLeads = {};

      // Clear selections
      state.selectedMembers = {};
      state.selectedLeads = {};

      // Clear current workers
      state.currentMemberWorkers = [];
      state.currentLeadWorkers = [];

      // Clear drawer workers
      state.drawerWorkers = {
        byId: {},
        allIds: [],
        totalFetched: 0,
        hasLoadedInitialManagers: false,
      };

      // Clear drawer error
      state.drawerError = {
        errorTitle: null,
        errorMessage: null,
      };
    },

    /**
     * Update manager and member counts after successful assign/remove operations
     * Called after API mutations to ensure drawer has fresh counts for next open
     */
    updateGroupCounts(
      state,
      action: PayloadAction<{ managerCount?: number; memberCount?: number }>,
    ) {
      if (action.payload.managerCount !== undefined) {
        state.managerCount = action.payload.managerCount;
      }
      if (action.payload.memberCount !== undefined) {
        state.memberCount = action.payload.memberCount;
      }
    },

    /**
     * Update current group name after successful save
     * Used when group name is updated via EditGroupDrawer
     * Only when group name is updated before navigating to AssignWorkers or AssignLeads views
     */
    updateCurrentGroupName(state, action: PayloadAction<string>) {
      state.currentGroupName = action.payload;
    },

    /**
     * Set error message and title for drawer operations (Edit Group workflow)
     * Used in AssignWorkers and AssignLeads views to display errors
     */
    setDrawerError(
      state,
      action: PayloadAction<{
        errorTitle?: string | null;
        errorMessage: string | null;
      }>,
    ) {
      state.drawerError = {
        errorTitle: action.payload.errorTitle ?? null,
        errorMessage: action.payload.errorMessage,
      };
    },

    /**
     * Clear drawer error state
     * Called when error is dismissed or when drawer is closed
     */
    clearDrawerError(state) {
      state.drawerError = {
        errorTitle: null,
        errorMessage: null,
      };
    },
  },
});

export const {
  setGroupsLoading,
  setGroupsData,
  setGroupsHeaderCount,
  appendGroupsData,
  setLoadingMore,
  setGroupsError,
  removeGroupFromState,
  updateGroupStats,
  openDeleteModal,
  closeDeleteModal,
  openUnsavedChangesModal,
  closeUnsavedChangesModal,
  resetGroupsView,
  setSelectedMembers,
  toggleMemberSelection,
  clearMemberSelections,
  setSelectedLeads,
  toggleLeadSelection,
  clearLeadSelections,
  clearAllSelections,
  setDrawerContext,
  clearDrawerContext,
  setInitialMembers,
  setInitialLeads,
  setCurrentMemberWorkers,
  setCurrentLeadWorkers,
  openQuickActionDrawer,
  closeQuickActionDrawer,
  openAddWorkerDrawer,
  closeAddWorkerDrawer,
  openCreateGroupDrawer,
  closeCreateGroupDrawer,
  toggleGroupExpansion,
  setWorkersForGroup,
  appendWorkersForGroup,
  setWorkersLoadingForGroup,
  openGroupDetailView,
  closeGroupDetailView,
  setGroupDetailViewError,
  setViewByGroups,
  addDrawerWorkers,
  toggleDrawerWorkerSelection,
  clearDrawerWorkers,
  clearDrawerData,
  resetDrawerState,
  updateGroupCounts,
  updateCurrentGroupName,
  setDrawerError,
  clearDrawerError,
} = workersGroupViewSlice.actions;

export const groupsSelectors = groupsAdapter.getSelectors();

/**
 * Selectors for accessing selection state
 */
export const selectSelectedMembers = (state: {
  workersGroupView: WorkersGroupViewState;
}) => state.workersGroupView.selectedMembers;

export const selectSelectedLeads = (state: {
  workersGroupView: WorkersGroupViewState;
}) => state.workersGroupView.selectedLeads;

export const selectSelectedMembersCount = (state: {
  workersGroupView: WorkersGroupViewState;
}) => Object.keys(state.workersGroupView.selectedMembers).length;

export const selectSelectedLeadsCount = (state: {
  workersGroupView: WorkersGroupViewState;
}) => Object.keys(state.workersGroupView.selectedLeads).length;

/**
 * Selectors for accessing drawer context state
 */
export const selectCurrentGroupId = (state: {
  workersGroupView: WorkersGroupViewState;
}) => state.workersGroupView.currentGroupId;

export const selectCurrentGroupName = (state: {
  workersGroupView: WorkersGroupViewState;
}) => state.workersGroupView.currentGroupName;

export const selectDrawerContext = (state: {
  workersGroupView: WorkersGroupViewState;
}) => state.workersGroupView.drawerContext;

export const selectManagerCount = (state: {
  workersGroupView: WorkersGroupViewState;
}) => state.workersGroupView.managerCount;

export const selectMemberCount = (state: {
  workersGroupView: WorkersGroupViewState;
}) => state.workersGroupView.memberCount;

export const selectInitialMembers = (state: {
  workersGroupView: WorkersGroupViewState;
}) => state.workersGroupView.initialMembers;

export const selectInitialLeads = (state: {
  workersGroupView: WorkersGroupViewState;
}) => state.workersGroupView.initialLeads;

/**
 * Selector to get complete group context for drawer
 */
export const selectGroupDrawerContext = (state: {
  workersGroupView: WorkersGroupViewState;
}) => ({
  groupId: state.workersGroupView.currentGroupId,
  groupName: state.workersGroupView.currentGroupName,
  context: state.workersGroupView.drawerContext,
  initialMembers: state.workersGroupView.initialMembers,
  initialLeads: state.workersGroupView.initialLeads,
});

/**
 * Selectors for quick action drawer state
 */
export const selectQuickActionDrawerOpen = (state: {
  workersGroupView: WorkersGroupViewState;
}) => state.workersGroupView.quickActionDrawerOpen;

export const selectQuickActionDrawerView = (state: {
  workersGroupView: WorkersGroupViewState;
}) => state.workersGroupView.quickActionDrawerView;

/**
 * Selectors for group detail view state (drill-down)
 */
export const selectGroupDetailViewActive = (state: {
  workersGroupView: WorkersGroupViewState;
}) => state.workersGroupView.groupDetailView.isActive;

export const selectGroupDetailViewGroupId = (state: {
  workersGroupView: WorkersGroupViewState;
}) => state.workersGroupView.groupDetailView.groupId;

export const selectGroupDetailViewGroupName = (state: {
  workersGroupView: WorkersGroupViewState;
}) => state.workersGroupView.groupDetailView.groupName;

export const selectGroupDetailView = (state: {
  workersGroupView: WorkersGroupViewState;
}) => state.workersGroupView.groupDetailView;

export const selectGroupDetailViewError = (state: {
  workersGroupView: WorkersGroupViewState;
}) => state.workersGroupView.groupDetailView.error;

/**
 * Selector for view toggle state
 */
export const selectViewByGroups = (state: {
  workersGroupView: WorkersGroupViewState;
}) => state.workersGroupView.viewByGroups;

/**
 * Selector for add worker drawer state
 */
export const selectAddWorkerDrawerOpen = (state: {
  workersGroupView: WorkersGroupViewState;
}) => state.workersGroupView.addWorkerDrawerOpen;

/**
 * Selector for initial worker type when Add Worker drawer was opened (e.g. from empty state)
 */
export const selectAddWorkerDrawerNameType = (state: {
  workersGroupView: WorkersGroupViewState;
}) => state.workersGroupView.addWorkerDrawerNameType;

/**
 * Selector for Create Group drawer state
 */
export const selectCreateGroupDrawerOpen = (state: {
  workersGroupView: WorkersGroupViewState;
}) => state.workersGroupView.createGroupDrawerOpen;

/**
 * Selector for groups header count (total active groups)
 */
export const selectGroupsHeaderCount = (state: {
  workersGroupView: WorkersGroupViewState;
}) => state.workersGroupView.groups.headerCount;

/**
 * Selectors for unified drawer workers (edit mode only)
 */
export const selectDrawerWorkers = (state: {
  workersGroupView: WorkersGroupViewState;
}) => state.workersGroupView.drawerWorkers;

export const selectDrawerWorkersById = (state: {
  workersGroupView: WorkersGroupViewState;
}) => state.workersGroupView.drawerWorkers.byId;

export const selectDrawerWorkersAllIds = (state: {
  workersGroupView: WorkersGroupViewState;
}) => state.workersGroupView.drawerWorkers.allIds;

export const selectDrawerWorkersCount = (state: {
  workersGroupView: WorkersGroupViewState;
}) => state.workersGroupView.drawerWorkers.totalFetched;

export const selectDrawerWorkersSelectedCount = (state: {
  workersGroupView: WorkersGroupViewState;
}) =>
  Object.values(state.workersGroupView.drawerWorkers.byId).filter(
    (w) => w.isSelected,
  ).length;

/**
 * Selectors for drawer error state (Edit Group workflow)
 */
export const selectDrawerErrorTitle = (state: {
  workersGroupView: WorkersGroupViewState;
}) => state.workersGroupView.drawerError.errorTitle;

export const selectDrawerErrorMessage = (state: {
  workersGroupView: WorkersGroupViewState;
}) => state.workersGroupView.drawerError.errorMessage;

/**
 * Selector for unsaved changes modal state
 */
export const selectUnsavedChangesModal = (state: {
  workersGroupView: WorkersGroupViewState;
}) => state.workersGroupView.unsavedChangesModal;

export const selectDrawerError = (state: {
  workersGroupView: WorkersGroupViewState;
}) => state.workersGroupView.drawerError;

export default workersGroupViewSlice.reducer;
