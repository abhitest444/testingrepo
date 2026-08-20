import workersGroupViewReducer, {
  addDrawerWorkers,
  toggleDrawerWorkerSelection,
  clearDrawerWorkers,
  updateGroupCounts,
  selectDrawerWorkers,
  selectDrawerWorkersById,
  selectDrawerWorkersAllIds,
  selectDrawerWorkersSelectedCount,
  selectManagerCount,
  selectMemberCount,
  DrawerWorker,
  WorkersGroupViewState,
} from 'src/js/widgets/assignments/store/workersGroupViewSlice';
import { TimeTracking_TimeForType } from 'src/__generated__/timeTracking/graphql';
import { WorkerNameType } from 'src/js/widgets/assignments/types';

describe('workersGroupViewSlice - DrawerWorkers', () => {
  const initialState: WorkersGroupViewState = {
    groups: {
      ids: [],
      entities: {},
      loading: false,
      error: null,
      cursor: null,
      hasMore: true,
      isLoadingMore: false,
      totalCount: 0,
      hasNextPage: false,
      headerCount: 0,
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
    quickActionDrawerOpen: false,
    quickActionDrawerView: null,
    deleteModal: {
      open: false,
      groupId: null,
      groupName: null,
      version: null,
    },
    groupDetailView: {
      isActive: false,
      groupId: null,
      groupName: null,
      error: null,
    },
    viewByGroups: true,
    drawerWorkers: {
      byId: {},
      allIds: [],
      totalFetched: 0,
      hasLoadedInitialManagers: false,
    },
    managerCount: undefined,
    memberCount: undefined,
    addWorkerDrawerOpen: false,
    addWorkerDrawerNameType: WorkerNameType.EMPLOYEE,
    createGroupDrawerOpen: false,
    drawerError: {
      errorTitle: null,
      errorMessage: null,
    },
    unsavedChangesModal: {
      open: false,
    },
  };

  const mockWorker1: DrawerWorker = {
    id: '1',
    type: TimeTracking_TimeForType.Employee,
    firstName: 'John',
    lastName: 'Doe',
    displayName: 'John Doe',
    isActive: true,
    isSelected: false,
    memberOfGroup: null,
    managesGroups: [],
  };

  const mockWorker2: DrawerWorker = {
    id: '2',
    type: TimeTracking_TimeForType.Employee,
    firstName: 'Jane',
    lastName: 'Smith',
    displayName: 'Jane Smith',
    isActive: true,
    isSelected: false,
    memberOfGroup: null,
    managesGroups: [],
  };

  const mockWorker3: DrawerWorker = {
    id: '3',
    type: TimeTracking_TimeForType.Vendor,
    firstName: 'Bob',
    lastName: 'Johnson',
    displayName: 'Bob Johnson',
    isActive: true,
    isSelected: false,
    memberOfGroup: null,
    managesGroups: [],
  };

  describe('addDrawerWorkers', () => {
    it('should add workers and mark them as managers', () => {
      const state = workersGroupViewReducer(
        initialState,
        addDrawerWorkers({
          workers: [mockWorker1, mockWorker2],
          markAsManagers: true,
        }),
      );

      expect(state.drawerWorkers.allIds).toHaveLength(2);
      expect(state.drawerWorkers.byId['1'].isSelected).toBe(true);
      expect(state.drawerWorkers.byId['2'].isSelected).toBe(true);
      expect(state.drawerWorkers.hasLoadedInitialManagers).toBe(true);
      expect(state.drawerWorkers.totalFetched).toBe(2);
    });

    it('should add workers without marking as managers', () => {
      const state = workersGroupViewReducer(
        initialState,
        addDrawerWorkers({
          workers: [mockWorker1, mockWorker2],
          markAsManagers: false,
        }),
      );

      expect(state.drawerWorkers.allIds).toHaveLength(2);
      expect(state.drawerWorkers.byId['1'].isSelected).toBe(false);
      expect(state.drawerWorkers.byId['2'].isSelected).toBe(false);
      expect(state.drawerWorkers.hasLoadedInitialManagers).toBe(false);
      expect(state.drawerWorkers.totalFetched).toBe(2);
    });

    it('should deduplicate workers and preserve selected status', () => {
      let state = workersGroupViewReducer(
        initialState,
        addDrawerWorkers({
          workers: [{ ...mockWorker1, isSelected: true }],
          markAsManagers: true,
        }),
      );

      // Add same worker again with markAsManagers: false
      state = workersGroupViewReducer(
        state,
        addDrawerWorkers({
          workers: [{ ...mockWorker1, isSelected: false }],
          markAsManagers: false,
        }),
      );

      // Should have only one worker, and isSelected should remain true
      expect(state.drawerWorkers.allIds).toHaveLength(1);
      expect(state.drawerWorkers.byId['1'].isSelected).toBe(true);
      expect(state.drawerWorkers.totalFetched).toBe(1);
    });

    it('should sort selected workers first when marking as managers', () => {
      const unselectedWorker = { ...mockWorker1, displayName: 'Zack Last' };
      const selectedWorker = { ...mockWorker2, displayName: 'Amy First' };

      const state = workersGroupViewReducer(
        initialState,
        addDrawerWorkers({
          workers: [unselectedWorker, selectedWorker],
          markAsManagers: true,
        }),
      );

      // Selected workers should come first regardless of name
      const firstWorker =
        state.drawerWorkers.byId[state.drawerWorkers.allIds[0]];
      expect(firstWorker.isSelected).toBe(true);
      expect(firstWorker.displayName).toBe('Amy First');
    });

    it('should append workers without re-sorting when not marking as managers', () => {
      let state = workersGroupViewReducer(
        initialState,
        addDrawerWorkers({
          workers: [mockWorker1],
          markAsManagers: true,
        }),
      );

      state = workersGroupViewReducer(
        state,
        addDrawerWorkers({
          workers: [mockWorker2],
          markAsManagers: false,
        }),
      );

      // Worker2 should be appended, not sorted
      expect(state.drawerWorkers.allIds).toEqual(['1', '2']);
    });

    it('should handle empty workers array', () => {
      const state = workersGroupViewReducer(
        initialState,
        addDrawerWorkers({
          workers: [],
          markAsManagers: true,
        }),
      );

      expect(state.drawerWorkers.allIds).toHaveLength(0);
      expect(state.drawerWorkers.hasLoadedInitialManagers).toBe(true);
    });

    it('should merge workers from multiple calls', () => {
      let state = workersGroupViewReducer(
        initialState,
        addDrawerWorkers({
          workers: [mockWorker1],
          markAsManagers: true,
        }),
      );

      state = workersGroupViewReducer(
        state,
        addDrawerWorkers({
          workers: [mockWorker2, mockWorker3],
          markAsManagers: false,
        }),
      );

      expect(state.drawerWorkers.allIds).toHaveLength(3);
      expect(state.drawerWorkers.byId['1'].isSelected).toBe(true);
      expect(state.drawerWorkers.byId['2'].isSelected).toBe(false);
      expect(state.drawerWorkers.byId['3'].isSelected).toBe(false);
    });

    it('should handle large batches of workers', () => {
      const manyWorkers: DrawerWorker[] = Array.from(
        { length: 150 },
        (_, i) => ({
          id: `worker-${i}`,
          type: TimeTracking_TimeForType.Employee,
          firstName: `First${i}`,
          lastName: `Last${i}`,
          displayName: `First${i} Last${i}`,
          isActive: true,
          isSelected: false,
          memberOfGroup: null,
          managesGroups: [],
        }),
      );

      const state = workersGroupViewReducer(
        initialState,
        addDrawerWorkers({
          workers: manyWorkers,
          markAsManagers: true,
        }),
      );

      expect(state.drawerWorkers.allIds).toHaveLength(150);
      expect(state.drawerWorkers.totalFetched).toBe(150);
      // All should be selected since markAsManagers is true
      expect(
        Object.values(state.drawerWorkers.byId).every((w) => w.isSelected),
      ).toBe(true);
    });

    it('should mark existing worker as selected when adding with markAsManagers=true', () => {
      // First, add worker without marking as manager
      let state = workersGroupViewReducer(
        initialState,
        addDrawerWorkers({
          workers: [mockWorker1],
          markAsManagers: false,
        }),
      );

      expect(state.drawerWorkers.byId['1'].isSelected).toBe(false);
      expect(state.drawerWorkers.totalFetched).toBe(1);

      // Now add same worker with markAsManagers: true
      state = workersGroupViewReducer(
        state,
        addDrawerWorkers({
          workers: [mockWorker1],
          markAsManagers: true,
        }),
      );

      // Worker should now be selected, but totalFetched should remain 1 (not incremented)
      expect(state.drawerWorkers.byId['1'].isSelected).toBe(true);
      expect(state.drawerWorkers.allIds).toHaveLength(1);
      expect(state.drawerWorkers.totalFetched).toBe(1);
      expect(state.drawerWorkers.hasLoadedInitialManagers).toBe(true);
    });
  });

  describe('toggleDrawerWorkerSelection', () => {
    it('should toggle worker selection from false to true', () => {
      let state = workersGroupViewReducer(
        initialState,
        addDrawerWorkers({
          workers: [mockWorker1],
          markAsManagers: false,
        }),
      );

      expect(state.drawerWorkers.byId['1'].isSelected).toBe(false);

      state = workersGroupViewReducer(
        state,
        toggleDrawerWorkerSelection({ workerId: '1' }),
      );

      expect(state.drawerWorkers.byId['1'].isSelected).toBe(true);
    });

    it('should toggle worker selection from true to false', () => {
      let state = workersGroupViewReducer(
        initialState,
        addDrawerWorkers({
          workers: [mockWorker1],
          markAsManagers: true,
        }),
      );

      expect(state.drawerWorkers.byId['1'].isSelected).toBe(true);

      state = workersGroupViewReducer(
        state,
        toggleDrawerWorkerSelection({ workerId: '1' }),
      );

      expect(state.drawerWorkers.byId['1'].isSelected).toBe(false);
    });

    it('should not re-sort workers after toggle', () => {
      let state = workersGroupViewReducer(
        initialState,
        addDrawerWorkers({
          workers: [mockWorker1, mockWorker2],
          markAsManagers: false,
        }),
      );

      const initialOrder = [...state.drawerWorkers.allIds];

      state = workersGroupViewReducer(
        state,
        toggleDrawerWorkerSelection({ workerId: '1' }),
      );

      // Order should remain the same
      expect(state.drawerWorkers.allIds).toEqual(initialOrder);
    });

    it('should handle toggling non-existent worker gracefully', () => {
      const state = workersGroupViewReducer(
        initialState,
        toggleDrawerWorkerSelection({ workerId: '999' }),
      );

      // Should not crash or modify state
      expect(state.drawerWorkers.allIds).toHaveLength(0);
    });

    it('should toggle multiple workers independently', () => {
      let state = workersGroupViewReducer(
        initialState,
        addDrawerWorkers({
          workers: [mockWorker1, mockWorker2, mockWorker3],
          markAsManagers: false,
        }),
      );

      state = workersGroupViewReducer(
        state,
        toggleDrawerWorkerSelection({ workerId: '1' }),
      );

      state = workersGroupViewReducer(
        state,
        toggleDrawerWorkerSelection({ workerId: '3' }),
      );

      expect(state.drawerWorkers.byId['1'].isSelected).toBe(true);
      expect(state.drawerWorkers.byId['2'].isSelected).toBe(false);
      expect(state.drawerWorkers.byId['3'].isSelected).toBe(true);
    });
  });

  describe('clearDrawerWorkers', () => {
    it('should clear all drawer workers', () => {
      let state = workersGroupViewReducer(
        initialState,
        addDrawerWorkers({
          workers: [mockWorker1, mockWorker2],
          markAsManagers: true,
        }),
      );

      expect(state.drawerWorkers.allIds).toHaveLength(2);

      state = workersGroupViewReducer(state, clearDrawerWorkers());

      expect(state.drawerWorkers.allIds).toHaveLength(0);
      expect(state.drawerWorkers.byId).toEqual({});
      expect(state.drawerWorkers.hasLoadedInitialManagers).toBe(false);
      expect(state.drawerWorkers.totalFetched).toBe(0);
    });

    it('should not affect other state', () => {
      let state = workersGroupViewReducer(
        initialState,
        addDrawerWorkers({
          workers: [mockWorker1],
          markAsManagers: true,
        }),
      );

      state = {
        ...state,
        selectedMembers: {
          '1': { id: '1', timeForType: TimeTracking_TimeForType.Employee },
        },
      };

      state = workersGroupViewReducer(state, clearDrawerWorkers());

      // selectedMembers should remain
      expect(Object.keys(state.selectedMembers).length).toBe(1);
    });

    it('should work on already empty state', () => {
      const state = workersGroupViewReducer(initialState, clearDrawerWorkers());

      expect(state.drawerWorkers.allIds).toHaveLength(0);
      expect(state.drawerWorkers.byId).toEqual({});
    });
  });

  describe('updateGroupCounts', () => {
    it('should update manager count', () => {
      const state = workersGroupViewReducer(
        initialState,
        updateGroupCounts({ managerCount: 10 }),
      );

      expect(state.managerCount).toBe(10);
      expect(state.memberCount).toBeUndefined();
    });

    it('should update member count', () => {
      const state = workersGroupViewReducer(
        initialState,
        updateGroupCounts({ memberCount: 5 }),
      );

      expect(state.memberCount).toBe(5);
      expect(state.managerCount).toBeUndefined();
    });

    it('should update both counts', () => {
      const state = workersGroupViewReducer(
        initialState,
        updateGroupCounts({ managerCount: 10, memberCount: 5 }),
      );

      expect(state.managerCount).toBe(10);
      expect(state.memberCount).toBe(5);
    });

    it('should overwrite existing counts', () => {
      let state = workersGroupViewReducer(
        initialState,
        updateGroupCounts({ managerCount: 10, memberCount: 5 }),
      );

      state = workersGroupViewReducer(
        state,
        updateGroupCounts({ managerCount: 20, memberCount: 15 }),
      );

      expect(state.managerCount).toBe(20);
      expect(state.memberCount).toBe(15);
    });
  });

  describe('DrawerWorkers Selectors', () => {
    it('should select drawer workers', () => {
      const state = {
        workersGroupView: {
          ...initialState,
          drawerWorkers: {
            byId: {
              '1': mockWorker1,
              '2': mockWorker2,
            },
            allIds: ['1', '2'],
            totalFetched: 2,
            hasLoadedInitialManagers: true,
          },
        },
      };

      const result = selectDrawerWorkers(state);
      expect(result.allIds).toEqual(['1', '2']);
      expect(result.byId['1']).toEqual(mockWorker1);
      expect(result.totalFetched).toBe(2);
    });

    it('should select drawer workers by id', () => {
      const state = {
        workersGroupView: {
          ...initialState,
          drawerWorkers: {
            byId: {
              '1': mockWorker1,
              '2': mockWorker2,
            },
            allIds: ['1', '2'],
            totalFetched: 2,
            hasLoadedInitialManagers: true,
          },
        },
      };

      const result = selectDrawerWorkersById(state);
      expect(result['1']).toEqual(mockWorker1);
      expect(result['2']).toEqual(mockWorker2);
    });

    it('should select drawer workers all ids', () => {
      const state = {
        workersGroupView: {
          ...initialState,
          drawerWorkers: {
            byId: {
              '1': mockWorker1,
              '2': mockWorker2,
            },
            allIds: ['1', '2'],
            totalFetched: 2,
            hasLoadedInitialManagers: true,
          },
        },
      };

      const result = selectDrawerWorkersAllIds(state);
      expect(result).toEqual(['1', '2']);
    });

    it('should select drawer workers selected count', () => {
      const state = {
        workersGroupView: {
          ...initialState,
          drawerWorkers: {
            byId: {
              '1': { ...mockWorker1, isSelected: true },
              '2': { ...mockWorker2, isSelected: false },
              '3': { ...mockWorker3, isSelected: true },
            },
            allIds: ['1', '2', '3'],
            totalFetched: 3,
            hasLoadedInitialManagers: true,
          },
        },
      };

      const result = selectDrawerWorkersSelectedCount(state);
      expect(result).toBe(2);
    });

    it('should return 0 for selected count when no workers', () => {
      const state = {
        workersGroupView: initialState,
      };

      const result = selectDrawerWorkersSelectedCount(state);
      expect(result).toBe(0);
    });

    it('should select manager count', () => {
      const state = {
        workersGroupView: {
          ...initialState,
          managerCount: 10,
        },
      };

      const result = selectManagerCount(state);
      expect(result).toBe(10);
    });

    it('should select member count', () => {
      const state = {
        workersGroupView: {
          ...initialState,
          memberCount: 5,
        },
      };

      const result = selectMemberCount(state);
      expect(result).toBe(5);
    });

    it('should return undefined for counts when not set', () => {
      const state = {
        workersGroupView: initialState,
      };

      expect(selectManagerCount(state)).toBeUndefined();
      expect(selectMemberCount(state)).toBeUndefined();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete edit mode flow for managers', () => {
      let state = initialState;

      // 1. Load managers (mark as selected)
      state = workersGroupViewReducer(
        state,
        addDrawerWorkers({
          workers: [mockWorker1, mockWorker2],
          markAsManagers: true,
        }),
      );

      expect(state.drawerWorkers.allIds).toHaveLength(2);
      expect(state.drawerWorkers.hasLoadedInitialManagers).toBe(true);

      // 2. Load company workers (not selected)
      state = workersGroupViewReducer(
        state,
        addDrawerWorkers({
          workers: [mockWorker3],
          markAsManagers: false,
        }),
      );

      expect(state.drawerWorkers.allIds).toHaveLength(3);
      // Selected managers should be first
      expect(
        state.drawerWorkers.byId[state.drawerWorkers.allIds[0]].isSelected,
      ).toBe(true);
      expect(
        state.drawerWorkers.byId[state.drawerWorkers.allIds[1]].isSelected,
      ).toBe(true);
      expect(
        state.drawerWorkers.byId[state.drawerWorkers.allIds[2]].isSelected,
      ).toBe(false);

      // 3. Toggle selection
      state = workersGroupViewReducer(
        state,
        toggleDrawerWorkerSelection({ workerId: '1' }),
      );

      expect(state.drawerWorkers.byId['1'].isSelected).toBe(false);

      // 4. Clear on drawer close
      state = workersGroupViewReducer(state, clearDrawerWorkers());

      expect(state.drawerWorkers.allIds).toHaveLength(0);
    });

    it('should handle pagination scenario', () => {
      let state = initialState;

      // First page of managers (100)
      const firstPageManagers: DrawerWorker[] = Array.from(
        { length: 100 },
        (_, i) => ({
          id: `manager-${i}`,
          type: TimeTracking_TimeForType.Employee,
          firstName: `Manager${i}`,
          lastName: `Last${i}`,
          displayName: `Manager${i} Last${i}`,
          isActive: true,
          isSelected: false,
          memberOfGroup: null,
          managesGroups: [],
        }),
      );

      state = workersGroupViewReducer(
        state,
        addDrawerWorkers({
          workers: firstPageManagers,
          markAsManagers: true,
        }),
      );

      expect(state.drawerWorkers.allIds).toHaveLength(100);
      expect(state.drawerWorkers.hasLoadedInitialManagers).toBe(true);

      // Second page of managers (50)
      const secondPageManagers: DrawerWorker[] = Array.from(
        { length: 50 },
        (_, i) => ({
          id: `manager-${100 + i}`,
          type: TimeTracking_TimeForType.Employee,
          firstName: `Manager${100 + i}`,
          lastName: `Last${100 + i}`,
          displayName: `Manager${100 + i} Last${100 + i}`,
          isActive: true,
          isSelected: false,
          memberOfGroup: null,
          managesGroups: [],
        }),
      );

      state = workersGroupViewReducer(
        state,
        addDrawerWorkers({
          workers: secondPageManagers,
          markAsManagers: true, // Mark as managers (they're the second page of managers)
        }),
      );

      expect(state.drawerWorkers.allIds).toHaveLength(150);
      // All should be selected since both batches were marked as managers
      expect(
        Object.values(state.drawerWorkers.byId).every((w) => w.isSelected),
      ).toBe(true);

      // Add unselected workers
      const workers: DrawerWorker[] = Array.from({ length: 50 }, (_, i) => ({
        id: `worker-${i}`,
        type: TimeTracking_TimeForType.Employee,
        firstName: `Worker${i}`,
        lastName: `Last${i}`,
        displayName: `Worker${i} Last${i}`,
        isActive: true,
        isSelected: false,
        memberOfGroup: null,
        managesGroups: [],
      }));

      state = workersGroupViewReducer(
        state,
        addDrawerWorkers({
          workers,
          markAsManagers: false,
        }),
      );

      expect(state.drawerWorkers.allIds).toHaveLength(200);
      // First 150 should be selected
      expect(state.drawerWorkers.byId['manager-0'].isSelected).toBe(true);
      expect(state.drawerWorkers.byId['manager-149'].isSelected).toBe(true);
      expect(state.drawerWorkers.byId['worker-0'].isSelected).toBe(false);
    });
  });
});
