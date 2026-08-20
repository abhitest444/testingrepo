import workersGroupViewReducer, {
  setGroupsLoading,
  setGroupsData,
  setGroupsHeaderCount,
  appendGroupsData,
  setLoadingMore,
  setGroupsError,
  resetGroupsView,
  toggleGroupExpansion,
  setWorkersForGroup,
  appendWorkersForGroup,
  setWorkersLoadingForGroup,
  setSelectedMembers,
  toggleMemberSelection,
  clearMemberSelections,
  setSelectedLeads,
  toggleLeadSelection,
  clearLeadSelections,
  clearAllSelections,
  selectSelectedMembers,
  selectSelectedLeads,
  selectSelectedMembersCount,
  selectSelectedLeadsCount,
  removeGroupFromState,
  openDeleteModal,
  closeDeleteModal,
  updateGroupStats,
  setDrawerContext,
  clearDrawerContext,
  setInitialMembers,
  setInitialLeads,
  openQuickActionDrawer,
  closeQuickActionDrawer,
  openGroupDetailView,
  closeGroupDetailView,
  setGroupDetailViewError,
  setViewByGroups,
  selectGroupDrawerContext,
  selectQuickActionDrawerOpen,
  selectQuickActionDrawerView,
  selectGroupDetailViewActive,
  selectGroupDetailViewGroupId,
  selectGroupDetailViewGroupName,
  selectGroupDetailView,
  selectGroupDetailViewError,
  selectViewByGroups,
  selectCurrentGroupId,
  selectCurrentGroupName,
  selectDrawerContext,
  selectInitialMembers,
  selectInitialLeads,
  setCurrentMemberWorkers,
  setCurrentLeadWorkers,
  clearDrawerData,
  clearDrawerWorkers,
  resetDrawerState,
  selectDrawerWorkersCount,
  openUnsavedChangesModal,
  closeUnsavedChangesModal,
  selectUnsavedChangesModal,
  openAddWorkerDrawer,
  closeAddWorkerDrawer,
  openCreateGroupDrawer,
  closeCreateGroupDrawer,
  addDrawerWorkers,
  toggleDrawerWorkerSelection,
  updateGroupCounts,
  updateCurrentGroupName,
  setDrawerError,
  clearDrawerError,
  selectAddWorkerDrawerOpen,
  selectCreateGroupDrawerOpen,
  selectGroupsHeaderCount,
  selectDrawerWorkers,
  selectDrawerWorkersById,
  selectDrawerWorkersAllIds,
  selectDrawerWorkersSelectedCount,
  selectDrawerErrorTitle,
  selectDrawerErrorMessage,
  selectDrawerError,
  selectManagerCount,
  selectMemberCount,
  WorkersGroupViewState,
  Worker,
} from 'src/js/widgets/assignments/store/workersGroupViewSlice';
import type { DrawerWorker } from 'src/js/widgets/assignments/store/workersGroupViewSlice';
import {
  TimeTracking_Group,
  TimeTracking_TimeForType,
} from 'src/__generated__/timeTracking/graphql';
import { WorkerNameType } from 'src/js/widgets/assignments/types';

describe('workersGroupViewSlice', () => {
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
    groupDetailView: {
      isActive: false,
      groupId: null,
      groupName: null,
      error: null,
    },
    viewByGroups: false,
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

  const mockGroup: TimeTracking_Group = {
    __typename: 'TimeTracking_Group',
    id: 'group-1',
    name: 'Engineering Team',
    isActive: true,
    stats: {
      __typename: 'TimeTracking_GroupStats',
      memberCount: 5,
      managerCount: 2,
      assignedTimeAgainstCount: 0,
    },
    meta: {
      __typename: 'TimeTracking_GroupMeta',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'user-1',
      updatedBy: 'user-1',
      version: 1,
    },
    managers: {
      __typename: 'TimeTracking_WorkerConnection',
      edges: [],
      pageInfo: {
        __typename: 'Common_PageInfo',
        hasNextPage: false,
        hasPreviousPage: false,
      },
      totalCount: 0,
    },
    members: {
      __typename: 'TimeTracking_WorkerConnection',
      edges: [],
      pageInfo: {
        __typename: 'Common_PageInfo',
        hasNextPage: false,
        hasPreviousPage: false,
      },
      totalCount: 0,
    },
  };

  const mockGroup2: TimeTracking_Group = {
    __typename: 'TimeTracking_Group',
    id: 'group-2',
    name: 'Sales Team',
    isActive: true,
    stats: {
      __typename: 'TimeTracking_GroupStats',
      memberCount: 3,
      managerCount: 1,
      assignedTimeAgainstCount: 0,
    },
    meta: {
      __typename: 'TimeTracking_GroupMeta',
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
      createdBy: 'user-2',
      updatedBy: 'user-2',
      version: 1,
    },
    managers: {
      __typename: 'TimeTracking_WorkerConnection',
      edges: [],
      pageInfo: {
        __typename: 'Common_PageInfo',
        hasNextPage: false,
        hasPreviousPage: false,
      },
      totalCount: 0,
    },
    members: {
      __typename: 'TimeTracking_WorkerConnection',
      edges: [],
      pageInfo: {
        __typename: 'Common_PageInfo',
        hasNextPage: false,
        hasPreviousPage: false,
      },
      totalCount: 0,
    },
  };

  describe('initial state', () => {
    it('should return the initial state', () => {
      expect(workersGroupViewReducer(undefined, { type: 'unknown' })).toEqual(
        initialState,
      );
    });
  });

  describe('setGroupsLoading', () => {
    test.each([
      {
        description: 'should set loading to true',
        payload: true,
        expected: true,
      },
      {
        description: 'should set loading to false',
        payload: false,
        expected: false,
      },
    ])('$description', ({ payload, expected }) => {
      const state = workersGroupViewReducer(
        initialState,
        setGroupsLoading({ loading: payload }),
      );
      expect(state.groups.loading).toBe(expected);
    });
  });

  describe('setGroupsData', () => {
    it('should set groups data and clear loading/error', () => {
      const groups = [mockGroup];
      const action = setGroupsData({
        groups,
        cursor: null,
        hasMore: false,
        totalCount: 1,
        hasNextPage: false,
      });
      let state = workersGroupViewReducer(initialState, action);

      // Set header count separately
      state = workersGroupViewReducer(
        state,
        setGroupsHeaderCount({ headerCount: 150 }),
      );

      expect(state.groups.ids).toEqual(['group-1']);
      expect(state.groups.entities['group-1']).toEqual(mockGroup);
      expect(state.groups.loading).toBe(false);
      expect(state.groups.error).toBe(null);
      expect(state.groups.totalCount).toBe(1);
      expect(state.groups.headerCount).toBe(150);
    });

    it('should replace existing groups', () => {
      const existingState = {
        ...initialState,
        groups: {
          ...initialState.groups,
          ids: ['old-group'],
          entities: { 'old-group': mockGroup },
        },
      };

      const newGroups = [{ ...mockGroup, id: 'group-2', name: 'Sales Team' }];
      const action = setGroupsData({
        groups: newGroups,
        cursor: null,
        hasMore: false,
        totalCount: 1,
        hasNextPage: false,
      });
      let state = workersGroupViewReducer(existingState, action);

      // Set header count separately
      state = workersGroupViewReducer(
        state,
        setGroupsHeaderCount({ headerCount: 150 }),
      );

      expect(state.groups.ids).toEqual(['group-2']);
      expect(state.groups.entities['group-2']).toBeDefined();
      expect(state.groups.entities['old-group']).toBeUndefined();
      expect(state.groups.totalCount).toBe(1);
      expect(state.groups.headerCount).toBe(150);
    });

    it('should handle empty groups array', () => {
      const action = setGroupsData({
        groups: [],
        cursor: null,
        hasMore: false,
        totalCount: 0,
        hasNextPage: false,
      });
      const state = workersGroupViewReducer(initialState, action);

      expect(state.groups.ids).toEqual([]);
      expect(state.groups.entities).toEqual({});
      expect(state.groups.loading).toBe(false);
      expect(state.groups.error).toBe(null);
      expect(state.groups.totalCount).toBe(0);
      expect(state.groups.headerCount).toBe(0);
    });

    it('should set totalCount and headerCount correctly', () => {
      const groups = [mockGroup];
      const action = setGroupsData({
        groups,
        cursor: 'cursor-123',
        hasMore: true,
        totalCount: 200,
        hasNextPage: true,
      });
      let state = workersGroupViewReducer(initialState, action);

      // Set header count separately
      state = workersGroupViewReducer(
        state,
        setGroupsHeaderCount({ headerCount: 150 }),
      );

      expect(state.groups.totalCount).toBe(200);
      expect(state.groups.headerCount).toBe(150);
    });

    it('should default hasMore to false when not provided', () => {
      const action = setGroupsData({
        groups: [mockGroup],
      });
      const state = workersGroupViewReducer(initialState, action);

      expect(state.groups.hasMore).toBe(false);
    });
  });

  describe('setGroupsError', () => {
    it('should set error and stop loading', () => {
      const loadingState = {
        ...initialState,
        groups: { ...initialState.groups, loading: true },
      };
      const errorMessage = 'Failed to fetch groups';
      const action = setGroupsError({ error: errorMessage });
      const state = workersGroupViewReducer(loadingState, action);

      expect(state.groups.error).toBe(errorMessage);
      expect(state.groups.loading).toBe(false);
    });
  });

  describe('resetGroupsView', () => {
    it('should reset to initial state', () => {
      const modifiedState: WorkersGroupViewState = {
        groups: {
          ids: ['group-1'],
          entities: { 'group-1': mockGroup },
          loading: true,
          error: 'Some error',
          cursor: 'some-cursor',
          hasMore: false,
          isLoadingMore: true,
          totalCount: 100,
          hasNextPage: true,
          headerCount: 0,
        },
        selectedMembers: {
          'worker-1': {
            id: 'worker-1',
            timeForType: TimeTracking_TimeForType.Employee,
          },
        },
        selectedLeads: {
          'lead-1': {
            id: 'lead-1',
            timeForType: TimeTracking_TimeForType.Employee,
          },
        },
        workersByGroup: {},
        expandedGroupIds: ['group-1'],
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
          open: true,
          groupId: 'group-1',
          groupName: 'Engineering Team',
          version: 1,
        },
        groupDetailView: {
          isActive: false,
          groupId: null,
          groupName: null,
          error: null,
        },
        viewByGroups: true,
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

      const state = workersGroupViewReducer(modifiedState, resetGroupsView());

      expect(state).toEqual(initialState);
    });
  });

  describe('sorting', () => {
    it('should sort groups by name', () => {
      const groups = [
        { ...mockGroup, id: 'group-3', name: 'Zebra Team' },
        { ...mockGroup, id: 'group-1', name: 'Alpha Team' },
        { ...mockGroup, id: 'group-2', name: 'Beta Team' },
      ];
      const action = setGroupsData({
        groups,
        cursor: null,
        hasMore: false,
        totalCount: 3,
        hasNextPage: false,
      });
      const state = workersGroupViewReducer(initialState, action);

      expect(state.groups.ids).toEqual(['group-1', 'group-2', 'group-3']);
    });
  });

  describe('appendGroupsData', () => {
    it('should append groups to existing data', () => {
      const existingState = {
        ...initialState,
        groups: {
          ...initialState.groups,
          ids: ['group-1'],
          entities: { 'group-1': mockGroup },
        },
      };

      const newGroups = [{ ...mockGroup, id: 'group-2', name: 'Sales Team' }];
      const action = appendGroupsData({
        groups: newGroups,
        cursor: 'new-cursor',
        hasMore: false,
      });
      const state = workersGroupViewReducer(existingState, action);

      expect(state.groups.ids).toEqual(['group-1', 'group-2']);
      expect(state.groups.entities['group-1']).toBeDefined();
      expect(state.groups.entities['group-2']).toBeDefined();
      expect(state.groups.cursor).toBe('new-cursor');
      expect(state.groups.hasMore).toBe(false);
      expect(state.groups.isLoadingMore).toBe(false);
    });

    it('should handle appending empty groups array', () => {
      const existingState = {
        ...initialState,
        groups: {
          ...initialState.groups,
          ids: ['group-1'],
          entities: { 'group-1': mockGroup },
          cursor: 'old-cursor',
          hasMore: true,
        },
      };

      const action = appendGroupsData({ groups: [] });
      const state = workersGroupViewReducer(existingState, action);

      expect(state.groups.ids).toEqual(['group-1']);
      expect(state.groups.cursor).toBe(null);
      expect(state.groups.hasMore).toBe(false);
    });

    it('should set hasNextPage when provided in payload', () => {
      const existingState = {
        ...initialState,
        groups: {
          ...initialState.groups,
          ids: ['group-1'],
          entities: { 'group-1': mockGroup },
          hasNextPage: false,
        },
      };

      const newGroups = [{ ...mockGroup, id: 'group-2', name: 'Sales Team' }];
      const action = appendGroupsData({
        groups: newGroups,
        cursor: 'new-cursor',
        hasMore: true,
        hasNextPage: true,
      });
      const state = workersGroupViewReducer(existingState, action);

      expect(state.groups.hasNextPage).toBe(true);
      expect(state.groups.hasMore).toBe(true);
      expect(state.groups.cursor).toBe('new-cursor');
    });

    it('should set hasNextPage to false when hasNextPage is false in payload', () => {
      const existingState = {
        ...initialState,
        groups: {
          ...initialState.groups,
          ids: ['group-1'],
          entities: { 'group-1': mockGroup },
          hasNextPage: true,
        },
      };

      const newGroups = [{ ...mockGroup, id: 'group-2', name: 'Sales Team' }];
      const action = appendGroupsData({
        groups: newGroups,
        cursor: 'new-cursor',
        hasMore: false,
        hasNextPage: false,
      });
      const state = workersGroupViewReducer(existingState, action);

      expect(state.groups.hasNextPage).toBe(false);
      expect(state.groups.hasMore).toBe(false);
    });
  });

  describe('setLoadingMore', () => {
    it('should set isLoadingMore to true', () => {
      const action = setLoadingMore({ loading: true });
      const state = workersGroupViewReducer(initialState, action);
      expect(state.groups.isLoadingMore).toBe(true);
    });

    it('should set isLoadingMore to false', () => {
      const loadingState = {
        ...initialState,
        groups: { ...initialState.groups, isLoadingMore: true },
      };
      const action = setLoadingMore({ loading: false });
      const state = workersGroupViewReducer(loadingState, action);
      expect(state.groups.isLoadingMore).toBe(false);
    });
  });

  describe('toggleGroupExpansion', () => {
    it('should add group to expanded list when not expanded', () => {
      const action = toggleGroupExpansion('group-1');
      const state = workersGroupViewReducer(initialState, action);
      expect(state.expandedGroupIds).toEqual(['group-1']);
    });

    it('should remove group from expanded list when already expanded', () => {
      const expandedState = {
        ...initialState,
        expandedGroupIds: ['group-1', 'group-2'],
      };
      const action = toggleGroupExpansion('group-1');
      const state = workersGroupViewReducer(expandedState, action);
      expect(state.expandedGroupIds).toEqual(['group-2']);
    });

    it('should handle toggling multiple groups', () => {
      let state = workersGroupViewReducer(
        initialState,
        toggleGroupExpansion('group-1'),
      );
      state = workersGroupViewReducer(state, toggleGroupExpansion('group-2'));
      state = workersGroupViewReducer(state, toggleGroupExpansion('group-3'));

      expect(state.expandedGroupIds).toEqual(['group-1', 'group-2', 'group-3']);

      state = workersGroupViewReducer(state, toggleGroupExpansion('group-2'));
      expect(state.expandedGroupIds).toEqual(['group-1', 'group-3']);
    });
  });

  describe('setWorkersForGroup', () => {
    const mockWorkers: Worker[] = [
      { id: 'worker-1', name: 'John Doe', status: 'Active', role: 'Employee' },
      { id: 'worker-2', name: 'Jane Smith', status: 'Active', role: 'Manager' },
    ];

    it('should set workers for a group', () => {
      const action = setWorkersForGroup({
        groupId: 'group-1',
        workers: mockWorkers,
        cursor: 'worker-cursor',
        hasMore: true,
      });
      const state = workersGroupViewReducer(initialState, action);

      expect(state.workersByGroup['group-1']).toBeDefined();
      expect(state.workersByGroup['group-1'].ids).toEqual([
        'worker-1',
        'worker-2',
      ]);
      expect(state.workersByGroup['group-1'].entities['worker-1']).toEqual(
        mockWorkers[0],
      );
      expect(state.workersByGroup['group-1'].entities['worker-2']).toEqual(
        mockWorkers[1],
      );
      expect(state.workersByGroup['group-1'].cursor).toBe('worker-cursor');
      expect(state.workersByGroup['group-1'].hasMore).toBe(true);
      expect(state.workersByGroup['group-1'].loading).toBe(false);
      expect(state.workersByGroup['group-1'].error).toBe(null);
      expect(state.workersByGroup['group-1'].isLoadingMore).toBe(false);
    });

    it('should handle empty workers array', () => {
      const action = setWorkersForGroup({
        groupId: 'group-1',
        workers: [],
      });
      const state = workersGroupViewReducer(initialState, action);

      expect(state.workersByGroup['group-1'].ids).toEqual([]);
      expect(state.workersByGroup['group-1'].entities).toEqual({});
      expect(state.workersByGroup['group-1'].cursor).toBe(null);
      expect(state.workersByGroup['group-1'].hasMore).toBe(false);
    });

    it('should replace existing workers for a group', () => {
      const existingState = {
        ...initialState,
        workersByGroup: {
          'group-1': {
            ids: ['old-worker'],
            entities: {
              'old-worker': {
                id: 'old-worker',
                name: 'Old Worker',
                status: 'Inactive',
              },
            },
            loading: false,
            error: null,
            cursor: 'old-cursor',
            hasMore: false,
            isLoadingMore: false,
            isSearchResult: false,
          },
        },
      };

      const action = setWorkersForGroup({
        groupId: 'group-1',
        workers: mockWorkers,
      });
      const state = workersGroupViewReducer(existingState, action);

      expect(state.workersByGroup['group-1'].ids).toEqual([
        'worker-1',
        'worker-2',
      ]);
      expect(
        state.workersByGroup['group-1'].entities['old-worker'],
      ).toBeUndefined();
      expect(
        state.workersByGroup['group-1'].entities['worker-1'],
      ).toBeDefined();
    });
  });

  describe('appendWorkersForGroup', () => {
    const mockWorkers: Worker[] = [
      { id: 'worker-1', name: 'John Doe', status: 'Active', role: 'Employee' },
      { id: 'worker-2', name: 'Jane Smith', status: 'Active', role: 'Manager' },
    ];

    it('should append workers to existing group', () => {
      const existingState = {
        ...initialState,
        workersByGroup: {
          'group-1': {
            ids: ['existing-worker'],
            entities: {
              'existing-worker': {
                id: 'existing-worker',
                name: 'Existing Worker',
                status: 'Active',
              },
            },
            loading: false,
            error: null,
            cursor: 'old-cursor',
            hasMore: true,
            isLoadingMore: false,
            isSearchResult: false,
          },
        },
      };

      const action = appendWorkersForGroup({
        groupId: 'group-1',
        workers: mockWorkers,
        cursor: 'new-cursor',
        hasMore: false,
      });
      const state = workersGroupViewReducer(existingState, action);

      expect(state.workersByGroup['group-1'].ids).toEqual([
        'existing-worker',
        'worker-1',
        'worker-2',
      ]);
      expect(
        state.workersByGroup['group-1'].entities['existing-worker'],
      ).toBeDefined();
      expect(state.workersByGroup['group-1'].entities['worker-1']).toEqual(
        mockWorkers[0],
      );
      expect(state.workersByGroup['group-1'].entities['worker-2']).toEqual(
        mockWorkers[1],
      );
      expect(state.workersByGroup['group-1'].cursor).toBe('new-cursor');
      expect(state.workersByGroup['group-1'].hasMore).toBe(false);
      expect(state.workersByGroup['group-1'].isLoadingMore).toBe(false);
    });

    it('should not append workers if group does not exist', () => {
      const action = appendWorkersForGroup({
        groupId: 'non-existent-group',
        workers: mockWorkers,
      });
      const state = workersGroupViewReducer(initialState, action);

      expect(state.workersByGroup['non-existent-group']).toBeUndefined();
    });

    it('should handle appending empty workers array', () => {
      const existingState = {
        ...initialState,
        workersByGroup: {
          'group-1': {
            ids: ['existing-worker'],
            entities: {
              'existing-worker': {
                id: 'existing-worker',
                name: 'Existing Worker',
                status: 'Active',
              },
            },
            loading: false,
            error: null,
            cursor: 'old-cursor',
            hasMore: true,
            isLoadingMore: false,
            isSearchResult: false,
          },
        },
      };

      const action = appendWorkersForGroup({
        groupId: 'group-1',
        workers: [],
      });
      const state = workersGroupViewReducer(existingState, action);

      expect(state.workersByGroup['group-1'].ids).toEqual(['existing-worker']);
      expect(state.workersByGroup['group-1'].cursor).toBe(null);
      expect(state.workersByGroup['group-1'].hasMore).toBe(false);
    });
  });

  describe('setWorkersLoadingForGroup', () => {
    it('should initialize workers state when group does not exist', () => {
      const action = setWorkersLoadingForGroup({
        groupId: 'group-1',
        loading: true,
      });
      const state = workersGroupViewReducer(initialState, action);

      expect(state.workersByGroup['group-1']).toBeDefined();
      expect(state.workersByGroup['group-1'].ids).toEqual([]);
      expect(state.workersByGroup['group-1'].entities).toEqual({});
      expect(state.workersByGroup['group-1'].loading).toBe(true);
      expect(state.workersByGroup['group-1'].error).toBe(null);
      expect(state.workersByGroup['group-1'].cursor).toBe(null);
      expect(state.workersByGroup['group-1'].hasMore).toBe(true);
      expect(state.workersByGroup['group-1'].isLoadingMore).toBe(true);
    });

    it('should update existing workers state', () => {
      const existingState = {
        ...initialState,
        workersByGroup: {
          'group-1': {
            ids: ['worker-1'],
            entities: {
              'worker-1': {
                id: 'worker-1',
                name: 'John Doe',
                status: 'Active',
              },
            },
            loading: false,
            error: null,
            cursor: 'cursor-123',
            hasMore: true,
            isLoadingMore: false,
            isSearchResult: false,
          },
        },
      };

      const action = setWorkersLoadingForGroup({
        groupId: 'group-1',
        loading: true,
      });
      const state = workersGroupViewReducer(existingState, action);

      expect(state.workersByGroup['group-1'].ids).toEqual(['worker-1']);
      expect(
        state.workersByGroup['group-1'].entities['worker-1'],
      ).toBeDefined();
      expect(state.workersByGroup['group-1'].loading).toBe(true);
      expect(state.workersByGroup['group-1'].isLoadingMore).toBe(true);
      expect(state.workersByGroup['group-1'].cursor).toBe('cursor-123');
    });

    it('should set loading to false', () => {
      const existingState = {
        ...initialState,
        workersByGroup: {
          'group-1': {
            ids: [],
            entities: {},
            loading: true,
            error: null,
            cursor: null,
            hasMore: true,
            isLoadingMore: true,
            isSearchResult: false,
          },
        },
      };

      const action = setWorkersLoadingForGroup({
        groupId: 'group-1',
        loading: false,
      });
      const state = workersGroupViewReducer(existingState, action);

      expect(state.workersByGroup['group-1'].loading).toBe(false);
      expect(state.workersByGroup['group-1'].isLoadingMore).toBe(false);
    });
  });

  describe('complex state interactions', () => {
    it('should handle setting groups data with cursor and hasMore', () => {
      const groups = [mockGroup];
      const action = setGroupsData({
        groups,
        cursor: 'test-cursor',
        hasMore: true,
      });
      const state = workersGroupViewReducer(initialState, action);

      expect(state.groups.cursor).toBe('test-cursor');
      expect(state.groups.hasMore).toBe(true);
      expect(state.groups.isLoadingMore).toBe(false);
    });

    it('should handle setGroupsLoading clearing error', () => {
      const errorState = {
        ...initialState,
        groups: { ...initialState.groups, error: 'Previous error' },
      };
      const action = setGroupsLoading({ loading: true });
      const state = workersGroupViewReducer(errorState, action);

      expect(state.groups.loading).toBe(true);
      expect(state.groups.error).toBe(null);
    });

    it('should handle setGroupsError stopping loading and loadingMore', () => {
      const loadingState = {
        ...initialState,
        groups: {
          ...initialState.groups,
          loading: true,
          isLoadingMore: true,
        },
      };
      const action = setGroupsError({ error: 'Network error' });
      const state = workersGroupViewReducer(loadingState, action);

      expect(state.groups.error).toBe('Network error');
      expect(state.groups.loading).toBe(false);
      expect(state.groups.isLoadingMore).toBe(false);
    });

    it('should maintain immutability for workersByGroup updates', () => {
      const existingState = {
        ...initialState,
        workersByGroup: {
          'group-1': {
            ids: ['worker-1'],
            entities: {
              'worker-1': { id: 'worker-1', name: 'John', status: 'Active' },
            },
            loading: false,
            error: null,
            cursor: null,
            hasMore: false,
            isLoadingMore: false,
            isSearchResult: false,
          },
        },
      };

      const originalWorkersByGroup = existingState.workersByGroup;

      const action = setWorkersForGroup({
        groupId: 'group-2',
        workers: [{ id: 'worker-2', name: 'Jane', status: 'Active' }],
      });
      const state = workersGroupViewReducer(existingState, action);

      // Should create new object reference
      expect(state.workersByGroup).not.toBe(originalWorkersByGroup);
      expect(state.workersByGroup['group-1']).toBe(
        originalWorkersByGroup['group-1'],
      );
      expect(state.workersByGroup['group-2']).toBeDefined();
    });
  });

  describe('Worker/Lead Selection Actions', () => {
    describe('setSelectedMembers', () => {
      it('should set selected members', () => {
        const members = {
          'worker-1': {
            id: 'worker-1',
            timeForType: TimeTracking_TimeForType.Employee,
          },
          'worker-2': {
            id: 'worker-2',
            timeForType: TimeTracking_TimeForType.Vendor,
          },
        };
        const action = setSelectedMembers(members);
        const state = workersGroupViewReducer(initialState, action);

        expect(Object.keys(state.selectedMembers).length).toBe(2);
        expect(state.selectedMembers['worker-1']).toEqual(members['worker-1']);
        expect(state.selectedMembers['worker-2']).toEqual(members['worker-2']);
      });

      it('should replace existing selected members', () => {
        const existingState = {
          ...initialState,
          selectedMembers: {
            'old-worker': {
              id: 'old-worker',
              timeForType: TimeTracking_TimeForType.Employee,
            },
          },
        };

        const newMembers = {
          'worker-1': {
            id: 'worker-1',
            timeForType: TimeTracking_TimeForType.Employee,
          },
        };
        const action = setSelectedMembers(newMembers);
        const state = workersGroupViewReducer(existingState, action);

        expect(Object.keys(state.selectedMembers).length).toBe(1);
        expect(state.selectedMembers['worker-1']).toEqual(
          newMembers['worker-1'],
        );
        expect(state.selectedMembers['old-worker']).toBeUndefined();
      });

      it('should handle empty object', () => {
        const existingState = {
          ...initialState,
          selectedMembers: {
            'worker-1': {
              id: 'worker-1',
              timeForType: TimeTracking_TimeForType.Employee,
            },
          },
        };

        const action = setSelectedMembers({});
        const state = workersGroupViewReducer(existingState, action);

        expect(Object.keys(state.selectedMembers).length).toBe(0);
      });
    });

    describe('toggleMemberSelection', () => {
      it('should add member when not selected', () => {
        const member = {
          id: 'worker-1',
          timeForType: TimeTracking_TimeForType.Employee,
        };
        const action = toggleMemberSelection(member);
        const state = workersGroupViewReducer(initialState, action);

        expect(Object.keys(state.selectedMembers).length).toBe(1);
        expect(state.selectedMembers['worker-1']).toEqual(member);
      });

      it('should remove member when already selected', () => {
        const existingState = {
          ...initialState,
          selectedMembers: {
            'worker-1': {
              id: 'worker-1',
              timeForType: TimeTracking_TimeForType.Employee,
            },
            'worker-2': {
              id: 'worker-2',
              timeForType: TimeTracking_TimeForType.Vendor,
            },
          },
        };

        const action = toggleMemberSelection({
          id: 'worker-1',
          timeForType: TimeTracking_TimeForType.Employee,
        });
        const state = workersGroupViewReducer(existingState, action);

        expect(Object.keys(state.selectedMembers).length).toBe(1);
        expect(state.selectedMembers['worker-1']).toBeUndefined();
        expect(state.selectedMembers['worker-2']?.id).toBe('worker-2');
      });

      it('should handle toggling multiple members', () => {
        let state = initialState;

        // Add first member
        state = workersGroupViewReducer(
          state,
          toggleMemberSelection({
            id: 'worker-1',
            timeForType: TimeTracking_TimeForType.Employee,
          }),
        );
        expect(Object.keys(state.selectedMembers).length).toBe(1);

        // Add second member
        state = workersGroupViewReducer(
          state,
          toggleMemberSelection({
            id: 'worker-2',
            timeForType: TimeTracking_TimeForType.Vendor,
          }),
        );
        expect(Object.keys(state.selectedMembers).length).toBe(2);

        // Remove first member
        state = workersGroupViewReducer(
          state,
          toggleMemberSelection({
            id: 'worker-1',
            timeForType: TimeTracking_TimeForType.Employee,
          }),
        );
        expect(Object.keys(state.selectedMembers).length).toBe(1);
        expect(state.selectedMembers['worker-2']?.id).toBe('worker-2');
      });
    });

    describe('clearMemberSelections', () => {
      it('should clear all selected members', () => {
        const existingState = {
          ...initialState,
          selectedMembers: {
            'worker-1': {
              id: 'worker-1',
              timeForType: TimeTracking_TimeForType.Employee,
            },
            'worker-2': {
              id: 'worker-2',
              timeForType: TimeTracking_TimeForType.Vendor,
            },
          },
        };

        const action = clearMemberSelections();
        const state = workersGroupViewReducer(existingState, action);

        expect(Object.keys(state.selectedMembers).length).toBe(0);
      });

      it('should work when already empty', () => {
        const action = clearMemberSelections();
        const state = workersGroupViewReducer(initialState, action);

        expect(Object.keys(state.selectedMembers).length).toBe(0);
      });
    });

    describe('setSelectedLeads', () => {
      it('should set selected leads', () => {
        const leads = {
          'lead-1': {
            id: 'lead-1',
            timeForType: TimeTracking_TimeForType.Employee,
          },
          'lead-2': {
            id: 'lead-2',
            timeForType: TimeTracking_TimeForType.Vendor,
          },
        };
        const action = setSelectedLeads(leads);
        const state = workersGroupViewReducer(initialState, action);

        expect(Object.keys(state.selectedLeads).length).toBe(2);
        expect(state.selectedLeads['lead-1']).toEqual(leads['lead-1']);
        expect(state.selectedLeads['lead-2']).toEqual(leads['lead-2']);
      });

      it('should replace existing selected leads', () => {
        const existingState = {
          ...initialState,
          selectedLeads: {
            'old-lead': {
              id: 'old-lead',
              timeForType: TimeTracking_TimeForType.Employee,
            },
          },
        };

        const newLeads = {
          'lead-1': {
            id: 'lead-1',
            timeForType: TimeTracking_TimeForType.Employee,
          },
        };
        const action = setSelectedLeads(newLeads);
        const state = workersGroupViewReducer(existingState, action);

        expect(Object.keys(state.selectedLeads).length).toBe(1);
        expect(state.selectedLeads['lead-1']).toEqual(newLeads['lead-1']);
        expect(state.selectedLeads['old-lead']).toBeUndefined();
      });

      it('should handle empty object', () => {
        const existingState = {
          ...initialState,
          selectedLeads: {
            'lead-1': {
              id: 'lead-1',
              timeForType: TimeTracking_TimeForType.Employee,
            },
          },
        };

        const action = setSelectedLeads({});
        const state = workersGroupViewReducer(existingState, action);

        expect(Object.keys(state.selectedLeads).length).toBe(0);
      });
    });

    describe('toggleLeadSelection', () => {
      it('should add lead when not selected', () => {
        const lead = {
          id: 'lead-1',
          timeForType: TimeTracking_TimeForType.Employee,
        };
        const action = toggleLeadSelection(lead);
        const state = workersGroupViewReducer(initialState, action);

        expect(Object.keys(state.selectedLeads).length).toBe(1);
        expect(state.selectedLeads['lead-1']).toEqual(lead);
      });

      it('should remove lead when already selected', () => {
        const existingState = {
          ...initialState,
          selectedLeads: {
            'lead-1': {
              id: 'lead-1',
              timeForType: TimeTracking_TimeForType.Employee,
            },
            'lead-2': {
              id: 'lead-2',
              timeForType: TimeTracking_TimeForType.Vendor,
            },
          },
        };

        const action = toggleLeadSelection({
          id: 'lead-1',
          timeForType: TimeTracking_TimeForType.Employee,
        });
        const state = workersGroupViewReducer(existingState, action);

        expect(Object.keys(state.selectedLeads).length).toBe(1);
        expect(state.selectedLeads['lead-1']).toBeUndefined();
        expect(state.selectedLeads['lead-2']?.id).toBe('lead-2');
      });

      it('should handle toggling multiple leads', () => {
        let state = initialState;

        // Add first lead
        state = workersGroupViewReducer(
          state,
          toggleLeadSelection({
            id: 'lead-1',
            timeForType: TimeTracking_TimeForType.Employee,
          }),
        );
        expect(Object.keys(state.selectedLeads).length).toBe(1);

        // Add second lead
        state = workersGroupViewReducer(
          state,
          toggleLeadSelection({
            id: 'lead-2',
            timeForType: TimeTracking_TimeForType.Vendor,
          }),
        );
        expect(Object.keys(state.selectedLeads).length).toBe(2);

        // Remove first lead
        state = workersGroupViewReducer(
          state,
          toggleLeadSelection({
            id: 'lead-1',
            timeForType: TimeTracking_TimeForType.Employee,
          }),
        );
        expect(Object.keys(state.selectedLeads).length).toBe(1);
        expect(state.selectedLeads['lead-2']?.id).toBe('lead-2');
      });
    });

    describe('clearLeadSelections', () => {
      it('should clear all selected leads', () => {
        const existingState = {
          ...initialState,
          selectedLeads: {
            'lead-1': {
              id: 'lead-1',
              timeForType: TimeTracking_TimeForType.Employee,
            },
            'lead-2': {
              id: 'lead-2',
              timeForType: TimeTracking_TimeForType.Vendor,
            },
          },
        };

        const action = clearLeadSelections();
        const state = workersGroupViewReducer(existingState, action);

        expect(Object.keys(state.selectedLeads).length).toBe(0);
      });

      it('should work when already empty', () => {
        const action = clearLeadSelections();
        const state = workersGroupViewReducer(initialState, action);

        expect(Object.keys(state.selectedLeads).length).toBe(0);
      });
    });

    describe('clearAllSelections', () => {
      it('should clear both members and leads', () => {
        const existingState = {
          ...initialState,
          selectedMembers: {
            'worker-1': {
              id: 'worker-1',
              timeForType: TimeTracking_TimeForType.Employee,
            },
          },
          selectedLeads: {
            'lead-1': {
              id: 'lead-1',
              timeForType: TimeTracking_TimeForType.Employee,
            },
          },
        };

        const action = clearAllSelections();
        const state = workersGroupViewReducer(existingState, action);

        expect(Object.keys(state.selectedMembers).length).toBe(0);
        expect(Object.keys(state.selectedLeads).length).toBe(0);
      });

      it('should work when already empty', () => {
        const action = clearAllSelections();
        const state = workersGroupViewReducer(initialState, action);

        expect(Object.keys(state.selectedMembers).length).toBe(0);
        expect(Object.keys(state.selectedLeads).length).toBe(0);
      });

      it('should not affect other state', () => {
        const existingState = {
          ...initialState,
          selectedMembers: {
            'worker-1': {
              id: 'worker-1',
              timeForType: TimeTracking_TimeForType.Employee,
            },
          },
          selectedLeads: {
            'lead-1': {
              id: 'lead-1',
              timeForType: TimeTracking_TimeForType.Employee,
            },
          },
          expandedGroupIds: ['group-1'],
          groups: {
            ...initialState.groups,
            ids: ['group-1'],
            entities: { 'group-1': mockGroup },
          },
        };

        const action = clearAllSelections();
        const state = workersGroupViewReducer(existingState, action);

        expect(state.expandedGroupIds).toEqual(['group-1']);
        expect(state.groups.ids).toEqual(['group-1']);
      });
    });
  });

  describe('Selection Selectors', () => {
    it('should select selected members', () => {
      const members = {
        'worker-1': {
          id: 'worker-1',
          timeForType: TimeTracking_TimeForType.Employee,
        },
        'worker-2': {
          id: 'worker-2',
          timeForType: TimeTracking_TimeForType.Vendor,
        },
      };
      const state = {
        workersGroupView: {
          ...initialState,
          selectedMembers: members,
        },
      };

      const result = selectSelectedMembers(state);
      expect(result).toEqual(members);
      expect(Object.keys(result).length).toBe(2);
    });

    it('should select selected leads', () => {
      const leads = {
        'lead-1': {
          id: 'lead-1',
          timeForType: TimeTracking_TimeForType.Employee,
        },
      };
      const state = {
        workersGroupView: {
          ...initialState,
          selectedLeads: leads,
        },
      };

      const result = selectSelectedLeads(state);
      expect(result).toEqual(leads);
      expect(Object.keys(result).length).toBe(1);
    });

    it('should select selected members count', () => {
      const members = {
        'worker-1': {
          id: 'worker-1',
          timeForType: TimeTracking_TimeForType.Employee,
        },
        'worker-2': {
          id: 'worker-2',
          timeForType: TimeTracking_TimeForType.Vendor,
        },
      };
      const state = {
        workersGroupView: {
          ...initialState,
          selectedMembers: members,
        },
      };

      const result = selectSelectedMembersCount(state);
      expect(result).toBe(2);
    });

    it('should select selected leads count', () => {
      const leads = {
        'lead-1': {
          id: 'lead-1',
          timeForType: TimeTracking_TimeForType.Employee,
        },
      };
      const state = {
        workersGroupView: {
          ...initialState,
          selectedLeads: leads,
        },
      };

      const result = selectSelectedLeadsCount(state);
      expect(result).toBe(1);
    });

    it('should return 0 when no members selected', () => {
      const state = {
        workersGroupView: initialState,
      };

      expect(selectSelectedMembersCount(state)).toBe(0);
    });

    it('should return 0 when no leads selected', () => {
      const state = {
        workersGroupView: initialState,
      };

      expect(selectSelectedLeadsCount(state)).toBe(0);
    });
  });

  describe('Delete Group Actions', () => {
    describe('removeGroupFromState', () => {
      it('should remove group from state by id', () => {
        const stateWithGroups = workersGroupViewReducer(
          initialState,
          setGroupsData({
            groups: [mockGroup, mockGroup2],
            cursor: null,
            hasMore: false,
          }),
        );

        const result = workersGroupViewReducer(
          stateWithGroups,
          removeGroupFromState({ groupId: 'group-1' }),
        );

        expect(result.groups.ids).toEqual(['group-2']);
        expect(result.groups.entities['group-1']).toBeUndefined();
        expect(result.groups.entities['group-2']).toBeDefined();
      });

      it('should handle removing non-existent group gracefully', () => {
        const stateWithGroups = workersGroupViewReducer(
          initialState,
          setGroupsData({
            groups: [mockGroup],
            cursor: null,
            hasMore: false,
          }),
        );

        const result = workersGroupViewReducer(
          stateWithGroups,
          removeGroupFromState({ groupId: 'non-existent-id' }),
        );

        expect(result.groups.ids).toEqual(['group-1']);
        expect(result.groups.entities['group-1']).toBeDefined();
      });

      it('should work with empty groups list', () => {
        const result = workersGroupViewReducer(
          initialState,
          removeGroupFromState({ groupId: 'group-1' }),
        );

        expect(result.groups.ids).toEqual([]);
        expect(result.groups.entities).toEqual({});
      });
    });

    describe('openDeleteModal', () => {
      it('should open delete modal with group details', () => {
        const result = workersGroupViewReducer(
          initialState,
          openDeleteModal({
            groupId: 'group-1',
            groupName: 'Engineering Team',
            version: 5,
          }),
        );

        expect(result.deleteModal).toEqual({
          open: true,
          groupId: 'group-1',
          groupName: 'Engineering Team',
          version: 5,
        });
      });

      it('should overwrite previous modal state', () => {
        const stateWithModal = {
          ...initialState,
          deleteModal: {
            open: true,
            groupId: 'old-group',
            groupName: 'Old Group',
            version: 1,
          },
        };

        const result = workersGroupViewReducer(
          stateWithModal,
          openDeleteModal({
            groupId: 'new-group',
            groupName: 'New Group',
            version: 10,
          }),
        );

        expect(result.deleteModal).toEqual({
          open: true,
          groupId: 'new-group',
          groupName: 'New Group',
          version: 10,
        });
      });
    });

    describe('closeDeleteModal', () => {
      it('should close delete modal and reset state', () => {
        const stateWithModal = {
          ...initialState,
          deleteModal: {
            open: true,
            groupId: 'group-1',
            groupName: 'Engineering Team',
            version: 5,
          },
        };

        const result = workersGroupViewReducer(
          stateWithModal,
          closeDeleteModal(),
        );

        expect(result.deleteModal).toEqual({
          open: false,
          groupId: null,
          groupName: null,
          version: null,
        });
      });

      it('should work when modal is already closed', () => {
        const result = workersGroupViewReducer(
          initialState,
          closeDeleteModal(),
        );

        expect(result.deleteModal).toEqual({
          open: false,
          groupId: null,
          groupName: null,
          version: null,
        });
      });
    });

    describe('Delete Modal Integration', () => {
      it('should handle full delete flow', () => {
        // 1. Add groups to state
        let state = workersGroupViewReducer(
          initialState,
          setGroupsData({
            groups: [mockGroup, mockGroup2],
            cursor: null,
            hasMore: false,
          }),
        );

        expect(state.groups.ids).toHaveLength(2);

        // 2. Open delete modal for group-1
        state = workersGroupViewReducer(
          state,
          openDeleteModal({
            groupId: 'group-1',
            groupName: 'Engineering Team',
            version: 1,
          }),
        );

        expect(state.deleteModal.open).toBe(true);
        expect(state.deleteModal.groupId).toBe('group-1');

        // 3. Remove group from state (after successful delete)
        state = workersGroupViewReducer(
          state,
          removeGroupFromState({ groupId: 'group-1' }),
        );

        expect(state.groups.ids).toEqual(['group-2']);
        expect(state.groups.entities['group-1']).toBeUndefined();

        // 4. Close modal
        state = workersGroupViewReducer(state, closeDeleteModal());

        expect(state.deleteModal.open).toBe(false);
        expect(state.deleteModal.groupId).toBeNull();
      });

      it('should handle canceling delete', () => {
        // 1. Add groups to state
        let state = workersGroupViewReducer(
          initialState,
          setGroupsData({
            groups: [mockGroup],
            cursor: null,
            hasMore: false,
          }),
        );

        // 2. Open delete modal
        state = workersGroupViewReducer(
          state,
          openDeleteModal({
            groupId: 'group-1',
            groupName: 'Engineering Team',
            version: 1,
          }),
        );

        expect(state.deleteModal.open).toBe(true);

        // 3. Close modal without deleting
        state = workersGroupViewReducer(state, closeDeleteModal());

        expect(state.deleteModal.open).toBe(false);
        expect(state.groups.ids).toEqual(['group-1']); // Group still exists
        expect(state.groups.entities['group-1']).toBeDefined();
      });
    });
  });

  describe('Drawer Context Actions', () => {
    describe('setDrawerContext', () => {
      it('should set drawer context with all fields', () => {
        const context = {
          groupId: 'group-1',
          groupName: 'Engineering Team',
          context: 'EditGroup' as any,
          initialMembers: {
            'worker-1': {
              id: 'worker-1',
              timeForType: TimeTracking_TimeForType.Employee,
            },
          },
          initialLeads: {
            'lead-1': {
              id: 'lead-1',
              timeForType: TimeTracking_TimeForType.Employee,
            },
          },
        };

        const action = setDrawerContext(context);
        const state = workersGroupViewReducer(initialState, action);

        expect(state.currentGroupId).toBe('group-1');
        expect(state.currentGroupName).toBe('Engineering Team');
        expect(state.drawerContext).toBe('EditGroup');
        expect(state.initialMembers).toEqual(context.initialMembers);
        expect(state.initialLeads).toEqual(context.initialLeads);
      });

      it('should handle null groupName', () => {
        const action = setDrawerContext({
          groupId: 'group-1',
          groupName: null,
          context: 'QuickAction' as any,
        });
        const state = workersGroupViewReducer(initialState, action);

        expect(state.currentGroupName).toBeNull();
      });

      it('should handle missing initialMembers and initialLeads', () => {
        const action = setDrawerContext({
          groupId: 'group-1',
          context: 'CreateGroup' as any,
        });
        const state = workersGroupViewReducer(initialState, action);

        expect(state.initialMembers).toEqual({});
        expect(state.initialLeads).toEqual({});
      });
    });

    describe('clearDrawerContext', () => {
      it('should clear all drawer context fields', () => {
        const stateWithContext = {
          ...initialState,
          currentGroupId: 'group-1',
          currentGroupName: 'Engineering Team',
          drawerContext: 'EditGroup' as any,
          initialMembers: {
            'worker-1': {
              id: 'worker-1',
              timeForType: TimeTracking_TimeForType.Employee,
            },
          },
          initialLeads: {
            'lead-1': {
              id: 'lead-1',
              timeForType: TimeTracking_TimeForType.Employee,
            },
          },
        };

        const action = clearDrawerContext();
        const state = workersGroupViewReducer(stateWithContext, action);

        expect(state.currentGroupId).toBeNull();
        expect(state.currentGroupName).toBeNull();
        expect(state.drawerContext).toBeNull();
        expect(state.initialMembers).toEqual({});
        expect(state.initialLeads).toEqual({});
      });
    });

    describe('setInitialMembers', () => {
      it('should set initial members', () => {
        const members = {
          'worker-1': {
            id: 'worker-1',
            timeForType: TimeTracking_TimeForType.Employee,
          },
          'worker-2': {
            id: 'worker-2',
            timeForType: TimeTracking_TimeForType.Vendor,
          },
        };

        const action = setInitialMembers(members);
        const state = workersGroupViewReducer(initialState, action);

        expect(state.initialMembers).toEqual(members);
      });
    });

    describe('setInitialLeads', () => {
      it('should set initial leads', () => {
        const leads = {
          'lead-1': {
            id: 'lead-1',
            timeForType: TimeTracking_TimeForType.Employee,
          },
        };

        const action = setInitialLeads(leads);
        const state = workersGroupViewReducer(initialState, action);

        expect(state.initialLeads).toEqual(leads);
      });
    });
  });

  describe('Quick Action Drawer Actions', () => {
    describe('openQuickActionDrawer', () => {
      it('should open drawer with AssignWorkers view', () => {
        const action = openQuickActionDrawer({ view: 'AssignWorkers' });
        const state = workersGroupViewReducer(initialState, action);

        expect(state.quickActionDrawerOpen).toBe(true);
        expect(state.quickActionDrawerView).toBe('AssignWorkers');
      });

      it('should open drawer with AssignLeads view', () => {
        const action = openQuickActionDrawer({ view: 'AssignLeads' });
        const state = workersGroupViewReducer(initialState, action);

        expect(state.quickActionDrawerOpen).toBe(true);
        expect(state.quickActionDrawerView).toBe('AssignLeads');
      });
    });

    describe('closeQuickActionDrawer', () => {
      it('should close drawer and reset view', () => {
        const stateWithDrawer = {
          ...initialState,
          quickActionDrawerOpen: true,
          quickActionDrawerView: 'AssignWorkers',
        };

        const action = closeQuickActionDrawer();
        const state = workersGroupViewReducer(stateWithDrawer, action);

        expect(state.quickActionDrawerOpen).toBe(false);
        expect(state.quickActionDrawerView).toBeNull();
      });
    });
  });

  describe('Group Detail View Actions', () => {
    describe('openGroupDetailView', () => {
      it('should open group detail view', () => {
        const action = openGroupDetailView({
          groupId: 'group-1',
          groupName: 'Engineering Team',
        });
        const state = workersGroupViewReducer(initialState, action);

        expect(state.groupDetailView.isActive).toBe(true);
        expect(state.groupDetailView.groupId).toBe('group-1');
        expect(state.groupDetailView.groupName).toBe('Engineering Team');
      });
    });

    describe('closeGroupDetailView', () => {
      it('should close group detail view and reset to group by view', () => {
        const stateWithDetailView = {
          ...initialState,
          groupDetailView: {
            isActive: true,
            groupId: 'group-1',
            groupName: 'Engineering Team',
            error: null,
          },
          viewByGroups: false,
        };

        const action = closeGroupDetailView();
        const state = workersGroupViewReducer(stateWithDetailView, action);

        expect(state.groupDetailView.isActive).toBe(false);
        expect(state.groupDetailView.groupId).toBeNull();
        expect(state.groupDetailView.groupName).toBeNull();
        expect(state.viewByGroups).toBe(true);
      });
    });
  });

  describe('View Toggle Actions', () => {
    describe('setViewByGroups', () => {
      test.each([
        {
          description: 'should set viewByGroups to true',
          payload: true,
          expected: true,
        },
        {
          description: 'should set viewByGroups to false',
          payload: false,
          expected: false,
        },
      ])('$description', ({ payload, expected }) => {
        const state = workersGroupViewReducer(
          initialState,
          setViewByGroups(payload),
        );
        expect(state.viewByGroups).toBe(expected);
      });
    });
  });

  describe('Update Group Stats', () => {
    describe('updateGroupStats', () => {
      it('should update group stats', () => {
        const stateWithGroups = workersGroupViewReducer(
          initialState,
          setGroupsData({
            groups: [mockGroup],
            cursor: null,
            hasMore: false,
          }),
        );

        const action = updateGroupStats({
          groupId: 'group-1',
          stats: {
            memberCount: 20,
            managerCount: 5,
          },
        });
        const state = workersGroupViewReducer(stateWithGroups, action);

        expect(state.groups.entities['group-1']?.stats.memberCount).toBe(20);
        expect(state.groups.entities['group-1']?.stats.managerCount).toBe(5);
      });

      it('should not update stats for non-existent group', () => {
        const action = updateGroupStats({
          groupId: 'non-existent',
          stats: {
            memberCount: 20,
            managerCount: 5,
          },
        });
        const state = workersGroupViewReducer(initialState, action);

        expect(state.groups.entities['non-existent']).toBeUndefined();
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete group detail view flow', () => {
      let state = initialState;

      // 1. Add groups
      state = workersGroupViewReducer(
        state,
        setGroupsData({ groups: [mockGroup], cursor: null, hasMore: false }),
      );

      // 2. Open detail view
      state = workersGroupViewReducer(
        state,
        openGroupDetailView({
          groupId: 'group-1',
          groupName: 'Engineering Team',
        }),
      );
      expect(state.groupDetailView.isActive).toBe(true);

      // 3. Load workers for group
      state = workersGroupViewReducer(
        state,
        setWorkersForGroup({
          groupId: 'group-1',
          workers: [
            {
              id: 'worker-1',
              name: 'John',
              status: 'Active',
              role: 'EMPLOYEE',
            },
          ],
        }),
      );
      expect(state.workersByGroup['group-1']).toBeDefined();

      // 4. Close detail view
      state = workersGroupViewReducer(state, closeGroupDetailView());
      expect(state.groupDetailView.isActive).toBe(false);
      expect(state.viewByGroups).toBe(true);
    });

    it('should handle complete quick action flow', () => {
      let state = initialState;

      // 1. Set drawer context
      state = workersGroupViewReducer(
        state,
        setDrawerContext({
          groupId: 'group-1',
          groupName: 'Engineering Team',
          context: 'QuickAction' as any,
        }),
      );

      // 2. Open quick action drawer
      state = workersGroupViewReducer(
        state,
        openQuickActionDrawer({ view: 'AssignWorkers' }),
      );
      expect(state.quickActionDrawerOpen).toBe(true);

      // 3. Set selected members
      state = workersGroupViewReducer(
        state,
        setSelectedMembers({
          'worker-1': {
            id: 'worker-1',
            timeForType: TimeTracking_TimeForType.Employee,
          },
        }),
      );

      // 4. Close drawer
      state = workersGroupViewReducer(state, closeQuickActionDrawer());
      expect(state.quickActionDrawerOpen).toBe(false);

      // 5. Clear context
      state = workersGroupViewReducer(state, clearDrawerContext());
      expect(state.currentGroupId).toBeNull();
    });

    it('should handle view toggle with detail view', () => {
      let state = initialState;

      // 1. Switch to list view
      state = workersGroupViewReducer(state, setViewByGroups(false));
      expect(state.viewByGroups).toBe(false);

      // 2. Open detail view (should not affect viewByGroups)
      state = workersGroupViewReducer(
        state,
        openGroupDetailView({
          groupId: 'group-1',
          groupName: 'Engineering Team',
        }),
      );
      expect(state.viewByGroups).toBe(false);

      // 3. Close detail view (should reset to group by view)
      state = workersGroupViewReducer(state, closeGroupDetailView());
      expect(state.viewByGroups).toBe(true);
    });
  });

  describe('Selectors', () => {
    it('should select drawer context', () => {
      const state = {
        workersGroupView: {
          ...initialState,
          currentGroupId: 'group-1',
          currentGroupName: 'Engineering Team',
          drawerContext: 'EditGroup' as any,
          initialMembers: {},
          initialLeads: {},
        },
      };

      const result = selectGroupDrawerContext(state);
      expect(result.groupId).toBe('group-1');
      expect(result.groupName).toBe('Engineering Team');
      expect(result.context).toBe('EditGroup');
    });

    it('should select quick action drawer state', () => {
      const state = {
        workersGroupView: {
          ...initialState,
          quickActionDrawerOpen: true,
          quickActionDrawerView: 'AssignWorkers',
        },
      };

      expect(selectQuickActionDrawerOpen(state)).toBe(true);
      expect(selectQuickActionDrawerView(state)).toBe('AssignWorkers');
    });

    it('should select group detail view state', () => {
      const state = {
        workersGroupView: {
          ...initialState,
          groupDetailView: {
            isActive: true,
            groupId: 'group-1',
            groupName: 'Engineering Team',
            error: null,
          },
        },
      };

      expect(selectGroupDetailViewActive(state)).toBe(true);
      expect(selectGroupDetailViewGroupId(state)).toBe('group-1');
      expect(selectGroupDetailViewGroupName(state)).toBe('Engineering Team');
      expect(selectGroupDetailView(state)).toEqual({
        isActive: true,
        groupId: 'group-1',
        groupName: 'Engineering Team',
        error: null,
      });
    });

    it('should select view toggle state', () => {
      const state = {
        workersGroupView: {
          ...initialState,
          viewByGroups: false,
        },
      };

      expect(selectViewByGroups(state)).toBe(false);
    });

    it('should select current group context', () => {
      const state = {
        workersGroupView: {
          ...initialState,
          currentGroupId: 'group-1',
          currentGroupName: 'Engineering Team',
          drawerContext: 'EditGroup' as any,
        },
      };

      expect(selectCurrentGroupId(state)).toBe('group-1');
      expect(selectCurrentGroupName(state)).toBe('Engineering Team');
      expect(selectDrawerContext(state)).toBe('EditGroup');
    });

    it('should select initial members and leads', () => {
      const members = {
        'worker-1': {
          id: 'worker-1',
          timeForType: TimeTracking_TimeForType.Employee,
        },
      };
      const leads = {
        'lead-1': {
          id: 'lead-1',
          timeForType: TimeTracking_TimeForType.Employee,
        },
      };

      const state = {
        workersGroupView: {
          ...initialState,
          initialMembers: members,
          initialLeads: leads,
        },
      };

      expect(selectInitialMembers(state)).toEqual(members);
      expect(selectInitialLeads(state)).toEqual(leads);
    });
  });

  describe('setCurrentMemberWorkers', () => {
    it('should set current member workers', () => {
      const workers: Worker[] = [
        { id: 'W1', name: 'Worker 1', status: 'Active' },
        { id: 'W2', name: 'Worker 2', status: 'Active' },
      ];
      const state = workersGroupViewReducer(
        undefined,
        setCurrentMemberWorkers(workers),
      );
      expect(state.currentMemberWorkers).toEqual(workers);
    });
  });

  describe('setCurrentLeadWorkers', () => {
    it('should set current lead workers', () => {
      const workers: Worker[] = [
        { id: 'L1', name: 'Lead 1', status: 'Active' },
        { id: 'L2', name: 'Lead 2', status: 'Active' },
      ];
      const state = workersGroupViewReducer(
        undefined,
        setCurrentLeadWorkers(workers),
      );
      expect(state.currentLeadWorkers).toEqual(workers);
    });
  });

  describe('clearDrawerData', () => {
    it('should clear all drawer data while preserving context', () => {
      const initialState: WorkersGroupViewState = {
        ...workersGroupViewReducer(undefined, { type: '' }),
        currentGroupId: 'G1',
        currentGroupName: 'Test Group',
        drawerContext: 'quick-assign-leads' as any,
        initialMembers: { M1: { id: 'M1', timeForType: 'Employee' as any } },
        initialLeads: { L1: { id: 'L1', timeForType: 'Employee' as any } },
        selectedMembers: { M2: { id: 'M2', timeForType: 'Employee' as any } },
        selectedLeads: { L2: { id: 'L2', timeForType: 'Employee' as any } },
        currentMemberWorkers: [
          { id: 'M1', name: 'Member 1', status: 'Active' },
        ],
        currentLeadWorkers: [{ id: 'L1', name: 'Lead 1', status: 'Active' }],
        drawerWorkers: {
          byId: {
            W1: {
              id: 'W1',
              name: 'Worker 1',
              status: 'Active',
              isActive: true,
              isSelected: true,
            } as any,
          },
          allIds: ['W1'],
          totalFetched: 1,
          hasLoadedInitialManagers: true,
        },
      };

      const state = workersGroupViewReducer(initialState, clearDrawerData());

      // Context should be preserved
      expect(state.currentGroupId).toBe('G1');
      expect(state.currentGroupName).toBe('Test Group');
      expect(state.drawerContext).toBe('quick-assign-leads');

      // All data should be cleared
      expect(state.initialMembers).toEqual({});
      expect(state.initialLeads).toEqual({});
      expect(state.selectedMembers).toEqual({});
      expect(state.selectedLeads).toEqual({});
      expect(state.currentMemberWorkers).toEqual([]);
      expect(state.currentLeadWorkers).toEqual([]);
      expect(state.drawerWorkers.byId).toEqual({});
      expect(state.drawerWorkers.allIds).toEqual([]);
      expect(state.drawerWorkers.totalFetched).toBe(0);
      expect(state.drawerWorkers.hasLoadedInitialManagers).toBe(false);
    });

    it('should log to window.__REDUX_CLEAR_LOG__ when available', () => {
      // Setup debug logging
      (window as any).__REDUX_CLEAR_LOG__ = [];

      const initialState: WorkersGroupViewState = {
        ...workersGroupViewReducer(undefined, { type: '' }),
        currentGroupId: 'G1',
        drawerWorkers: {
          byId: {
            W1: {
              id: 'W1',
              name: 'Worker 1',
              status: 'Active',
              isActive: true,
              isSelected: true,
            } as any,
            W2: {
              id: 'W2',
              name: 'Worker 2',
              status: 'Active',
              isActive: true,
              isSelected: false,
            } as any,
          },
          allIds: ['W1', 'W2'],
          totalFetched: 2,
          hasLoadedInitialManagers: false,
        },
      };

      workersGroupViewReducer(initialState, clearDrawerData());

      // Verify logging occurred
      expect((window as any).__REDUX_CLEAR_LOG__.length).toBe(1);
      expect((window as any).__REDUX_CLEAR_LOG__[0]).toMatchObject({
        action: 'clearDrawerData',
        prevCount: 2,
        prevSelected: 1,
        groupId: 'G1',
      });

      // Cleanup
      delete (window as any).__REDUX_CLEAR_LOG__;
    });

    it('should handle drawer allIds entries missing from byId', () => {
      const stateWithDanglingIds: WorkersGroupViewState = {
        ...workersGroupViewReducer(undefined, { type: '' }),
        currentGroupId: 'G2',
        drawerWorkers: {
          byId: {},
          allIds: ['missing-id'],
          totalFetched: 1,
          hasLoadedInitialManagers: false,
        },
      };

      expect(() =>
        workersGroupViewReducer(stateWithDanglingIds, clearDrawerData()),
      ).not.toThrow();
    });
  });

  describe('resetDrawerState', () => {
    it('should reset all drawer state including context', () => {
      const initialState: WorkersGroupViewState = {
        ...workersGroupViewReducer(undefined, { type: '' }),
        currentGroupId: 'G1',
        currentGroupName: 'Test Group',
        drawerContext: 'quick-assign-leads' as any,
        initialMembers: { M1: { id: 'M1', timeForType: 'Employee' as any } },
        initialLeads: { L1: { id: 'L1', timeForType: 'Employee' as any } },
        selectedMembers: { M2: { id: 'M2', timeForType: 'Employee' as any } },
        selectedLeads: { L2: { id: 'L2', timeForType: 'Employee' as any } },
        currentMemberWorkers: [
          { id: 'M1', name: 'Member 1', status: 'Active' },
        ],
        currentLeadWorkers: [{ id: 'L1', name: 'Lead 1', status: 'Active' }],
        drawerWorkers: {
          byId: {
            W1: {
              id: 'W1',
              name: 'Worker 1',
              status: 'Active',
              isActive: true,
              isSelected: true,
            } as any,
          },
          allIds: ['W1'],
          totalFetched: 1,
          hasLoadedInitialManagers: true,
        },
      };

      const state = workersGroupViewReducer(initialState, resetDrawerState());

      // Everything should be reset
      expect(state.currentGroupId).toBeNull();
      expect(state.currentGroupName).toBeNull();
      expect(state.drawerContext).toBeNull();
      expect(state.initialMembers).toEqual({});
      expect(state.initialLeads).toEqual({});
      expect(state.selectedMembers).toEqual({});
      expect(state.selectedLeads).toEqual({});
      expect(state.currentMemberWorkers).toEqual([]);
      expect(state.currentLeadWorkers).toEqual([]);
      expect(state.drawerWorkers.byId).toEqual({});
      expect(state.drawerWorkers.allIds).toEqual([]);
      expect(state.drawerWorkers.totalFetched).toBe(0);
      expect(state.drawerWorkers.hasLoadedInitialManagers).toBe(false);
    });
  });

  describe('clearDrawerWorkers', () => {
    it('should reset drawerWorkers to initial empty state', () => {
      const initialState: WorkersGroupViewState = {
        ...workersGroupViewReducer(undefined, { type: '' }),
        drawerWorkers: {
          byId: {
            W1: {
              id: 'W1',
              name: 'Worker 1',
              status: 'Active',
              isActive: true,
              isSelected: true,
            } as any,
            W2: {
              id: 'W2',
              name: 'Worker 2',
              status: 'Active',
              isActive: true,
              isSelected: false,
            } as any,
          },
          allIds: ['W1', 'W2'],
          totalFetched: 2,
          hasLoadedInitialManagers: true,
        },
      };

      const state = workersGroupViewReducer(initialState, clearDrawerWorkers());

      expect(state.drawerWorkers.byId).toEqual({});
      expect(state.drawerWorkers.allIds).toEqual([]);
      expect(state.drawerWorkers.totalFetched).toBe(0);
      expect(state.drawerWorkers.hasLoadedInitialManagers).toBe(false);
    });
  });

  describe('selectDrawerWorkersCount', () => {
    it('should return totalFetched count from drawer workers', () => {
      const state = {
        workersGroupView: {
          ...workersGroupViewReducer(undefined, { type: '' }),
          drawerWorkers: {
            byId: {},
            allIds: ['W1', 'W2', 'W3'],
            totalFetched: 3,
            hasLoadedInitialManagers: false,
          },
        },
      };

      expect(selectDrawerWorkersCount(state)).toBe(3);
    });
  });

  describe('setGroupDetailViewError', () => {
    it('should set error in groupDetailView', () => {
      const action = setGroupDetailViewError({
        error: 'Failed to load header count',
      });
      const state = workersGroupViewReducer(initialState, action);

      expect(state.groupDetailView.error).toBe('Failed to load header count');
    });

    it('should clear error when set to null', () => {
      const stateWithError = {
        ...initialState,
        groupDetailView: {
          isActive: true,
          groupId: 'group-1',
          groupName: 'Engineering Team',
          error: 'Previous error',
        },
      };
      const action = setGroupDetailViewError({ error: null });
      const state = workersGroupViewReducer(stateWithError, action);

      expect(state.groupDetailView.error).toBe(null);
    });
  });

  describe('openGroupDetailView', () => {
    it('should reset error when opening group detail view', () => {
      const stateWithError = {
        ...initialState,
        groupDetailView: {
          isActive: false,
          groupId: null,
          groupName: null,
          error: 'Previous error',
        },
      };
      const action = openGroupDetailView({
        groupId: 'group-1',
        groupName: 'Engineering Team',
      });
      const state = workersGroupViewReducer(stateWithError, action);

      expect(state.groupDetailView.isActive).toBe(true);
      expect(state.groupDetailView.groupId).toBe('group-1');
      expect(state.groupDetailView.groupName).toBe('Engineering Team');
      expect(state.groupDetailView.error).toBe(null);
    });
  });

  describe('closeGroupDetailView', () => {
    it('should reset error when closing group detail view', () => {
      const stateWithError = {
        ...initialState,
        groupDetailView: {
          isActive: true,
          groupId: 'group-1',
          groupName: 'Engineering Team',
          error: 'Some error',
        },
      };
      const action = closeGroupDetailView();
      const state = workersGroupViewReducer(stateWithError, action);

      expect(state.groupDetailView.isActive).toBe(false);
      expect(state.groupDetailView.groupId).toBe(null);
      expect(state.groupDetailView.groupName).toBe(null);
      expect(state.groupDetailView.error).toBe(null);
    });
  });

  describe('selectGroupDetailViewError', () => {
    it('should select error from groupDetailView', () => {
      const stateWithError = {
        ...initialState,
        groupDetailView: {
          isActive: true,
          groupId: 'group-1',
          groupName: 'Engineering Team',
          error: 'Failed to load header count',
        },
      };
      const rootState = { workersGroupView: stateWithError } as any;
      expect(selectGroupDetailViewError(rootState)).toBe(
        'Failed to load header count',
      );
    });

    it('should return null when no error', () => {
      const rootState = { workersGroupView: initialState } as any;
      expect(selectGroupDetailViewError(rootState)).toBe(null);
    });
  });

  describe('Unsaved Changes Modal Actions', () => {
    test.each([
      {
        description: 'should open unsaved changes modal',
        dispatchedAction: openUnsavedChangesModal(),
        expectedOpen: true,
      },
      {
        description: 'should close unsaved changes modal',
        dispatchedAction: closeUnsavedChangesModal(),
        expectedOpen: false,
      },
    ])('$description', ({ dispatchedAction, expectedOpen }) => {
      const state = workersGroupViewReducer(initialState, dispatchedAction);
      expect(state.unsavedChangesModal.open).toBe(expectedOpen);
    });

    describe('resetDrawerState includes unsaved changes modal', () => {
      it('should reset drawer state and close unsaved changes modal when both actions are dispatched', () => {
        const stateWithOpenModal = {
          ...initialState,
          unsavedChangesModal: {
            open: true,
          },
          currentGroupId: 'group-1',
          currentGroupName: 'Test Group',
          drawerContext: 'EditGroup' as any,
        };

        // First close the modal, then reset drawer state (as done in handleDontSave)
        const closeAction = closeUnsavedChangesModal();
        const stateAfterClose = workersGroupViewReducer(
          stateWithOpenModal,
          closeAction,
        );

        const resetAction = resetDrawerState();
        const finalState = workersGroupViewReducer(
          stateAfterClose,
          resetAction,
        );

        expect(finalState.unsavedChangesModal.open).toBe(false);
        expect(finalState.currentGroupId).toBeNull();
        expect(finalState.currentGroupName).toBeNull();
        expect(finalState.drawerContext).toBeNull();
      });
    });
  });

  describe('Unsaved Changes Modal Selectors', () => {
    describe('selectUnsavedChangesModal', () => {
      test.each([
        {
          description: 'should select unsaved changes modal state when open',
          open: true,
        },
        {
          description: 'should select unsaved changes modal state when closed',
          open: false,
        },
      ])('$description', ({ open }) => {
        const state = {
          workersGroupView: {
            ...initialState,
            unsavedChangesModal: { open },
          },
        };
        expect(selectUnsavedChangesModal(state)).toEqual({ open });
      });
    });
  });

  describe('Add Worker Drawer Actions', () => {
    test.each([
      {
        description: 'should open add worker drawer',
        dispatchedAction: openAddWorkerDrawer(),
        expectedOpen: true,
      },
      {
        description: 'should close add worker drawer',
        dispatchedAction: closeAddWorkerDrawer(),
        expectedOpen: false,
      },
    ])('$description', ({ dispatchedAction, expectedOpen }) => {
      const state = workersGroupViewReducer(initialState, dispatchedAction);
      expect(state.addWorkerDrawerOpen).toBe(expectedOpen);
    });
  });

  describe('Create Group Drawer Actions', () => {
    test.each([
      {
        description: 'should open create group drawer',
        dispatchedAction: openCreateGroupDrawer(),
        expectedOpen: true,
      },
      {
        description: 'should close create group drawer',
        dispatchedAction: closeCreateGroupDrawer(),
        expectedOpen: false,
      },
    ])('$description', ({ dispatchedAction, expectedOpen }) => {
      const state = workersGroupViewReducer(initialState, dispatchedAction);
      expect(state.createGroupDrawerOpen).toBe(expectedOpen);
    });
  });

  describe('Drawer Workers Actions', () => {
    describe('addDrawerWorkers', () => {
      const mockWorkers: DrawerWorker[] = [
        {
          id: 'worker-1',
          type: 'Employee',
          firstName: 'Worker',
          lastName: '1',
          displayName: 'Worker 1',
          isActive: true,
          isSelected: false,
          memberOfGroup: null,
          managesGroups: [],
        },
        {
          id: 'worker-2',
          type: 'Employee',
          firstName: 'Worker',
          lastName: '2',
          displayName: 'Worker 2',
          isActive: true,
          isSelected: true,
          memberOfGroup: null,
          managesGroups: [],
        },
      ];

      it('should add drawer workers without marking as managers', () => {
        const action = addDrawerWorkers({
          workers: mockWorkers,
          markAsManagers: false,
        });
        const state = workersGroupViewReducer(initialState, action);

        expect(state.drawerWorkers.byId['worker-1']).toBeDefined();
        expect(state.drawerWorkers.byId['worker-2']).toBeDefined();
        expect(state.drawerWorkers.byId['worker-1'].isSelected).toBe(false);
        expect(state.drawerWorkers.byId['worker-2'].isSelected).toBe(true);
        expect(state.drawerWorkers.allIds.length).toBe(2);
        expect(state.drawerWorkers.totalFetched).toBe(2);
        expect(state.drawerWorkers.hasLoadedInitialManagers).toBe(false);
      });

      it('should add drawer workers and mark as managers', () => {
        const action = addDrawerWorkers({
          workers: mockWorkers,
          markAsManagers: true,
        });
        const state = workersGroupViewReducer(initialState, action);

        expect(state.drawerWorkers.byId['worker-1']).toBeDefined();
        expect(state.drawerWorkers.byId['worker-2']).toBeDefined();
        expect(state.drawerWorkers.byId['worker-1'].isSelected).toBe(true);
        expect(state.drawerWorkers.byId['worker-2'].isSelected).toBe(true);
        expect(state.drawerWorkers.hasLoadedInitialManagers).toBe(true);
      });

      it('should merge workers without overwriting existing ones', () => {
        const existingState = {
          ...initialState,
          drawerWorkers: {
            byId: {
              'worker-1': {
                id: 'worker-1',
                type: 'Employee',
                firstName: 'Worker',
                lastName: '1',
                displayName: 'Worker 1',
                isActive: true,
                isSelected: true,
                memberOfGroup: null,
                managesGroups: [],
              },
            },
            allIds: ['worker-1'],
            totalFetched: 1,
            hasLoadedInitialManagers: false,
          },
        };

        const newWorkers: DrawerWorker[] = [
          {
            id: 'worker-2',
            type: 'Employee',
            firstName: 'Worker',
            lastName: '2',
            displayName: 'Worker 2',
            isActive: true,
            isSelected: false,
            memberOfGroup: null,
            managesGroups: [],
          },
        ];

        const action = addDrawerWorkers({
          workers: newWorkers,
          markAsManagers: false,
        });
        const state = workersGroupViewReducer(existingState, action);

        // Existing worker should be preserved
        expect(state.drawerWorkers.byId['worker-1'].isSelected).toBe(true);
        // New worker should be added
        expect(state.drawerWorkers.byId['worker-2']).toBeDefined();
        expect(state.drawerWorkers.allIds).toContain('worker-1');
        expect(state.drawerWorkers.allIds).toContain('worker-2');
      });

      it('should update existing worker selection when marking as managers', () => {
        const existingState = {
          ...initialState,
          drawerWorkers: {
            byId: {
              'worker-1': {
                id: 'worker-1',
                type: 'Employee',
                firstName: 'Worker',
                lastName: '1',
                displayName: 'Worker 1',
                isActive: true,
                isSelected: false,
                memberOfGroup: null,
                managesGroups: [],
              },
            },
            allIds: ['worker-1'],
            totalFetched: 1,
            hasLoadedInitialManagers: false,
          },
        };

        const action = addDrawerWorkers({
          workers: [
            {
              id: 'worker-1',
              type: 'Employee',
              firstName: 'Worker',
              lastName: '1',
              displayName: 'Worker 1',
              isActive: true,
              isSelected: false,
              memberOfGroup: null,
              managesGroups: [],
            },
          ],
          markAsManagers: true,
        });
        const state = workersGroupViewReducer(existingState, action);

        expect(state.drawerWorkers.byId['worker-1'].isSelected).toBe(true);
      });

      it('should update memberOfGroup for existing worker when not marking as manager', () => {
        const existingState = {
          ...initialState,
          drawerWorkers: {
            byId: {
              'worker-1': {
                id: 'worker-1',
                type: 'Employee',
                firstName: 'Worker',
                lastName: '1',
                displayName: 'Worker 1',
                isActive: true,
                isSelected: true, // Keep this selection
                memberOfGroup: {
                  id: 'group-1',
                  name: 'Old Group',
                  isActive: true,
                },
                managesGroups: [],
              },
            },
            allIds: ['worker-1'],
            totalFetched: 1,
            hasLoadedInitialManagers: false,
          },
        };

        const action = addDrawerWorkers({
          workers: [
            {
              id: 'worker-1',
              type: 'Employee',
              firstName: 'Worker',
              lastName: '1',
              displayName: 'Worker 1',
              isActive: true,
              isSelected: false,
              memberOfGroup: {
                id: 'group-2',
                name: 'New Group',
                isActive: true,
              },
              managesGroups: [{ id: 'group-3', name: 'Group 3' }],
            },
          ],
          markAsManagers: false,
        });
        const state = workersGroupViewReducer(existingState, action);

        // Should preserve isSelected but update memberOfGroup and managesGroups
        expect(state.drawerWorkers.byId['worker-1'].isSelected).toBe(true);
        expect(state.drawerWorkers.byId['worker-1'].memberOfGroup).toEqual({
          id: 'group-2',
          name: 'New Group',
          isActive: true,
        });
        expect(state.drawerWorkers.byId['worker-1'].managesGroups).toEqual([
          { id: 'group-3', name: 'Group 3' },
        ]);
      });

      it('should use default markAsManagers value when omitted', () => {
        const action = addDrawerWorkers({
          workers: [mockWorkers[0]],
        });
        const state = workersGroupViewReducer(initialState, action);

        expect(state.drawerWorkers.byId['worker-1'].isSelected).toBe(false);
        expect(state.drawerWorkers.hasLoadedInitialManagers).toBe(false);
      });

      it('should sort selected workers before unselected on manager load', () => {
        const existingState = {
          ...initialState,
          drawerWorkers: {
            byId: {
              'worker-old': {
                id: 'worker-old',
                type: 'Employee',
                firstName: 'Old',
                lastName: 'Worker',
                displayName: 'Old Worker',
                isActive: true,
                isSelected: false,
                memberOfGroup: null,
                managesGroups: [],
              },
            },
            allIds: ['worker-old'],
            totalFetched: 1,
            hasLoadedInitialManagers: false,
          },
        };

        const action = addDrawerWorkers({
          workers: [mockWorkers[0]],
          markAsManagers: true,
        });
        const state = workersGroupViewReducer(existingState, action);

        expect(state.drawerWorkers.allIds[0]).toBe('worker-1');
        expect(state.drawerWorkers.allIds[1]).toBe('worker-old');
      });

      it('should keep unselected workers after selected workers during sort', () => {
        const existingState = {
          ...initialState,
          drawerWorkers: {
            byId: {
              'worker-unselected': {
                id: 'worker-unselected',
                type: 'Employee',
                firstName: 'Unselected',
                lastName: 'Worker',
                displayName: 'Z Worker',
                isActive: true,
                isSelected: false,
                memberOfGroup: null,
                managesGroups: [],
              },
              'worker-selected': {
                id: 'worker-selected',
                type: 'Employee',
                firstName: 'Selected',
                lastName: 'Worker',
                displayName: 'A Worker',
                isActive: true,
                isSelected: true,
                memberOfGroup: null,
                managesGroups: [],
              },
            },
            allIds: ['worker-unselected', 'worker-selected'],
            totalFetched: 2,
            hasLoadedInitialManagers: false,
          },
        };

        const action = addDrawerWorkers({
          workers: [],
          markAsManagers: true,
        });
        const state = workersGroupViewReducer(existingState, action);

        expect(state.drawerWorkers.allIds).toEqual([
          'worker-selected',
          'worker-unselected',
        ]);
      });

      it('should execute comparator branch for unselected then selected workers', () => {
        const nativeSort = Array.prototype.sort;
        const sortSpy = jest
          .spyOn(Array.prototype, 'sort')
          .mockImplementation(function mockSort(
            this: any[],
            compareFn?: (a: any, b: any) => number,
          ) {
            if (compareFn) {
              compareFn(
                { isSelected: false, displayName: 'Z Worker' },
                { isSelected: true, displayName: 'A Worker' },
              );
            }
            return nativeSort.call(this, compareFn as any);
          });

        workersGroupViewReducer(
          initialState,
          addDrawerWorkers({
            workers: [mockWorkers[0]],
            markAsManagers: true,
          }),
        );

        sortSpy.mockRestore();
      });
    });

    describe('toggleDrawerWorkerSelection', () => {
      it('should toggle worker selection', () => {
        const existingState = {
          ...initialState,
          drawerWorkers: {
            byId: {
              'worker-1': {
                id: 'worker-1',
                name: 'Worker 1',
                displayName: 'Worker 1',
                status: 'Active',
                isSelected: false,
              } as any,
            },
            allIds: ['worker-1'],
            totalFetched: 1,
            hasLoadedInitialManagers: false,
          },
        };

        const action = toggleDrawerWorkerSelection({ workerId: 'worker-1' });
        const state = workersGroupViewReducer(existingState, action);

        expect(state.drawerWorkers.byId['worker-1'].isSelected).toBe(true);
      });

      it('should toggle worker selection from true to false', () => {
        const existingState = {
          ...initialState,
          drawerWorkers: {
            byId: {
              'worker-1': {
                id: 'worker-1',
                name: 'Worker 1',
                displayName: 'Worker 1',
                status: 'Active',
                isSelected: true,
              } as any,
            },
            allIds: ['worker-1'],
            totalFetched: 1,
            hasLoadedInitialManagers: false,
          },
        };

        const action = toggleDrawerWorkerSelection({ workerId: 'worker-1' });
        const state = workersGroupViewReducer(existingState, action);

        expect(state.drawerWorkers.byId['worker-1'].isSelected).toBe(false);
      });

      it('should not affect worker if not found', () => {
        const existingState = {
          ...initialState,
          drawerWorkers: {
            byId: {},
            allIds: [],
            totalFetched: 0,
            hasLoadedInitialManagers: false,
          },
        };

        const action = toggleDrawerWorkerSelection({
          workerId: 'non-existent',
        });
        const state = workersGroupViewReducer(existingState, action);

        expect(state.drawerWorkers.byId['non-existent']).toBeUndefined();
      });
    });
  });

  describe('Update Group Counts', () => {
    describe('updateGroupCounts', () => {
      it('should update manager count', () => {
        const action = updateGroupCounts({ managerCount: 5 });
        const state = workersGroupViewReducer(initialState, action);

        expect(state.managerCount).toBe(5);
      });

      it('should update member count', () => {
        const action = updateGroupCounts({ memberCount: 10 });
        const state = workersGroupViewReducer(initialState, action);

        expect(state.memberCount).toBe(10);
      });

      it('should update both counts', () => {
        const action = updateGroupCounts({
          managerCount: 3,
          memberCount: 15,
        });
        const state = workersGroupViewReducer(initialState, action);

        expect(state.managerCount).toBe(3);
        expect(state.memberCount).toBe(15);
      });

      it('should not update if value is undefined', () => {
        const stateWithCounts = {
          ...initialState,
          managerCount: 2,
          memberCount: 5,
        };
        const action = updateGroupCounts({});
        const state = workersGroupViewReducer(stateWithCounts, action);

        expect(state.managerCount).toBe(2);
        expect(state.memberCount).toBe(5);
      });
    });

    describe('updateCurrentGroupName', () => {
      it('should update current group name', () => {
        const stateWithGroup = {
          ...initialState,
          currentGroupId: 'group-1',
          currentGroupName: 'Old Group Name',
        };
        const action = updateCurrentGroupName('New Group Name');
        const state = workersGroupViewReducer(stateWithGroup, action);

        expect(state.currentGroupName).toBe('New Group Name');
        expect(state.currentGroupId).toBe('group-1'); // Should remain unchanged
      });

      it('should set group name when initially null', () => {
        const action = updateCurrentGroupName('Updated Group Name');
        const state = workersGroupViewReducer(initialState, action);

        expect(state.currentGroupName).toBe('Updated Group Name');
      });
    });
  });

  describe('Drawer Error Actions', () => {
    describe('setDrawerError', () => {
      it('should set drawer error with title and message', () => {
        const action = setDrawerError({
          errorTitle: 'Error Title',
          errorMessage: 'Error Message',
        });
        const state = workersGroupViewReducer(initialState, action);

        expect(state.drawerError.errorTitle).toBe('Error Title');
        expect(state.drawerError.errorMessage).toBe('Error Message');
      });

      it('should set drawer error without title', () => {
        const action = setDrawerError({
          errorMessage: 'Error Message',
        });
        const state = workersGroupViewReducer(initialState, action);

        expect(state.drawerError.errorTitle).toBeNull();
        expect(state.drawerError.errorMessage).toBe('Error Message');
      });

      it('should set drawer error with null title', () => {
        const action = setDrawerError({
          errorTitle: null,
          errorMessage: 'Error Message',
        });
        const state = workersGroupViewReducer(initialState, action);

        expect(state.drawerError.errorTitle).toBeNull();
        expect(state.drawerError.errorMessage).toBe('Error Message');
      });
    });

    describe('clearDrawerError', () => {
      it('should clear drawer error', () => {
        const stateWithError = {
          ...initialState,
          drawerError: {
            errorTitle: 'Error Title',
            errorMessage: 'Error Message',
          },
        };
        const action = clearDrawerError();
        const state = workersGroupViewReducer(stateWithError, action);

        expect(state.drawerError.errorTitle).toBeNull();
        expect(state.drawerError.errorMessage).toBeNull();
      });

      it('should work when error is already cleared', () => {
        const action = clearDrawerError();
        const state = workersGroupViewReducer(initialState, action);

        expect(state.drawerError.errorTitle).toBeNull();
        expect(state.drawerError.errorMessage).toBeNull();
      });
    });
  });

  describe('Additional Selectors', () => {
    describe('selectAddWorkerDrawerOpen', () => {
      it('should select add worker drawer open state', () => {
        const state = {
          workersGroupView: {
            ...initialState,
            addWorkerDrawerOpen: true,
          },
        };

        expect(selectAddWorkerDrawerOpen(state)).toBe(true);
      });

      it('should select add worker drawer closed state', () => {
        const state = {
          workersGroupView: {
            ...initialState,
            addWorkerDrawerOpen: false,
          },
        };

        expect(selectAddWorkerDrawerOpen(state)).toBe(false);
      });
    });

    describe('selectCreateGroupDrawerOpen', () => {
      it('should select create group drawer open state', () => {
        const state = {
          workersGroupView: {
            ...initialState,
            createGroupDrawerOpen: true,
          },
        };

        expect(selectCreateGroupDrawerOpen(state)).toBe(true);
      });

      it('should select create group drawer closed state', () => {
        const state = {
          workersGroupView: {
            ...initialState,
            createGroupDrawerOpen: false,
          },
        };

        expect(selectCreateGroupDrawerOpen(state)).toBe(false);
      });
    });

    describe('selectGroupsHeaderCount', () => {
      it('should select groups header count', () => {
        const state = {
          workersGroupView: {
            ...initialState,
            groups: {
              ...initialState.groups,
              headerCount: 150,
            },
          },
        };

        expect(selectGroupsHeaderCount(state)).toBe(150);
      });
    });

    describe('selectDrawerWorkers', () => {
      it('should select drawer workers', () => {
        const drawerWorkers = {
          byId: {
            'worker-1': {
              id: 'worker-1',
              name: 'Worker 1',
              displayName: 'Worker 1',
              status: 'Active',
              isSelected: true,
            } as any,
          },
          allIds: ['worker-1'],
          totalFetched: 1,
          hasLoadedInitialManagers: false,
        };
        const state = {
          workersGroupView: {
            ...initialState,
            drawerWorkers,
          },
        };

        expect(selectDrawerWorkers(state)).toEqual(drawerWorkers);
      });
    });

    describe('selectDrawerWorkersById', () => {
      it('should select drawer workers by id', () => {
        const byId = {
          'worker-1': {
            id: 'worker-1',
            name: 'Worker 1',
            displayName: 'Worker 1',
            status: 'Active',
            isSelected: true,
          } as any,
        };
        const state = {
          workersGroupView: {
            ...initialState,
            drawerWorkers: {
              byId,
              allIds: ['worker-1'],
              totalFetched: 1,
              hasLoadedInitialManagers: false,
            },
          },
        };

        expect(selectDrawerWorkersById(state)).toEqual(byId);
      });
    });

    describe('selectDrawerWorkersAllIds', () => {
      it('should select drawer workers all ids', () => {
        const allIds = ['worker-1', 'worker-2'];
        const state = {
          workersGroupView: {
            ...initialState,
            drawerWorkers: {
              byId: {},
              allIds,
              totalFetched: 2,
              hasLoadedInitialManagers: false,
            },
          },
        };

        expect(selectDrawerWorkersAllIds(state)).toEqual(allIds);
      });
    });

    describe('selectDrawerWorkersSelectedCount', () => {
      it('should select drawer workers selected count', () => {
        const state = {
          workersGroupView: {
            ...initialState,
            drawerWorkers: {
              byId: {
                'worker-1': {
                  id: 'worker-1',
                  name: 'Worker 1',
                  displayName: 'Worker 1',
                  status: 'Active',
                  isSelected: true,
                } as any,
                'worker-2': {
                  id: 'worker-2',
                  name: 'Worker 2',
                  displayName: 'Worker 2',
                  status: 'Active',
                  isSelected: false,
                } as any,
              },
              allIds: ['worker-1', 'worker-2'],
              totalFetched: 2,
              hasLoadedInitialManagers: false,
            },
          },
        };

        expect(selectDrawerWorkersSelectedCount(state)).toBe(1);
      });
    });

    describe('selectDrawerErrorTitle', () => {
      it('should select drawer error title', () => {
        const state = {
          workersGroupView: {
            ...initialState,
            drawerError: {
              errorTitle: 'Error Title',
              errorMessage: 'Error Message',
            },
          },
        };

        expect(selectDrawerErrorTitle(state)).toBe('Error Title');
      });
    });

    describe('selectDrawerErrorMessage', () => {
      it('should select drawer error message', () => {
        const state = {
          workersGroupView: {
            ...initialState,
            drawerError: {
              errorTitle: 'Error Title',
              errorMessage: 'Error Message',
            },
          },
        };

        expect(selectDrawerErrorMessage(state)).toBe('Error Message');
      });
    });

    describe('selectDrawerError', () => {
      it('should select drawer error', () => {
        const drawerError = {
          errorTitle: 'Error Title',
          errorMessage: 'Error Message',
        };
        const state = {
          workersGroupView: {
            ...initialState,
            drawerError,
          },
        };

        expect(selectDrawerError(state)).toEqual(drawerError);
      });
    });

    describe('selectManagerCount', () => {
      it('should select manager count', () => {
        const state = {
          workersGroupView: {
            ...initialState,
            managerCount: 5,
          },
        };

        expect(selectManagerCount(state)).toBe(5);
      });
    });

    describe('selectMemberCount', () => {
      it('should select member count', () => {
        const state = {
          workersGroupView: {
            ...initialState,
            memberCount: 10,
          },
        };

        expect(selectMemberCount(state)).toBe(10);
      });
    });
  });
});
