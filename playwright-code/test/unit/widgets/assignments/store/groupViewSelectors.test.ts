import {
  selectAllGroups,
  selectGroupsLoading,
  selectGroupsError,
  selectGroupsCount,
} from 'src/js/widgets/assignments/store/groupViewSelectors';
import { RootState } from 'src/js/widgets/assignments/store';
import { TimeTracking_Group } from 'src/__generated__/timeTracking/graphql';
import { WorkerNameType } from 'src/js/widgets/assignments/types';

describe('groupViewSelectors', () => {
  const mockGroup1: TimeTracking_Group = {
    __typename: 'TimeTracking_Group',
    id: 'group-1',
    name: 'Engineering',
    isActive: true,
    stats: {
      __typename: 'TimeTracking_GroupStats',
      memberCount: 10,
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
    ...mockGroup1,
    id: 'group-2',
    name: 'Sales',
    stats: {
      __typename: 'TimeTracking_GroupStats',
      memberCount: 5,
      managerCount: 1,
      assignedTimeAgainstCount: 0,
    },
  };

  const mockState: RootState = {
    workers: {
      workers: {
        ids: [],
        entities: {},
      },
      selectedWorkerIds: [],
      filters: {
        searchText: '',
        workerStatus: 'all',
        roleFilter: [],
      },
      loading: false,
      error: null,
      showInactiveWorkers: false,
    },
    ui: {
      isAssignmentDrawerOpen: false,
      assignmentDrawerType: 'create',
      selectedAssignmentId: null,
      deleteModalOpen: false,
      bulkDeleteModalOpen: false,
      confirmationModalOpen: false,
      isFilterPanelOpen: false,
      pageMessage: {
        show: false,
        type: 'error',
        message: '',
        title: undefined,
        titleNlsKey: undefined,
        descriptionNlsKey: undefined,
        code: undefined,
      },
      unsavedChangesModal: {
        isOpen: false,
        pendingActionType: null,
      },
      isDataGridLoading: false,
      bulkActionMode: false,
    },
    workersGroupView: {
      groups: {
        ids: ['group-1', 'group-2'],
        entities: {
          'group-1': mockGroup1,
          'group-2': mockGroup2,
        },
        loading: false,
        error: null,
        cursor: null,
        hasMore: true,
        isLoadingMore: false,
        totalCount: 2,
        hasNextPage: false,
        headerCount: 0,
      },
      workersByGroup: {},
      expandedGroupIds: [],
      selectedMembers: {},
      selectedLeads: {},
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
    },
    workersList: {
      workers: [],
      pageInfo: null,
      loading: false,
      error: null,
      currentPage: 1,
      headerTotalCount: 0,
    },
    customerWorkerAssignments: {
      allItems: [],
      totalCount: 0,
      loading: false,
      error: null,
      hasMore: true,
      endCursor: null,
      lastFetchArgs: null,
      customerId: null,
      projectId: null,
    },
    customerAssignments: {
      allItems: [],
      totalCount: 0,
      loading: false,
      error: null,
      hasMore: true,
      endCursor: null,
      totalTimeForAssignments: 0,
      totalCustomFieldAssignments: 0,
      totalStandardFieldAssignments: 0,
      pageBeforeSearch: 1,
    },
    geofenceConfiguration: {
      nodes: [],
      loading: false,
      error: null,
      overrides: {},
    },
    geofenceLocationSearch: {
      selectedPlace: null,
      addressInput: '',
      predictions: [],
      radiusSearchText: null,
      mapReady: false,
      addressError: false,
      radiusError: false,
      resolvedPlaceId: '',
      geofenceOn: false,
      radius: 100,
      saveError: null,
    },
  };

  const emptyState: RootState = {
    workers: {
      workers: {
        ids: [],
        entities: {},
      },
      selectedWorkerIds: [],
      filters: {
        searchText: '',
        workerStatus: 'all',
        roleFilter: [],
      },
      loading: false,
      error: null,
      showInactiveWorkers: false,
    },
    ui: {
      isAssignmentDrawerOpen: false,
      assignmentDrawerType: 'create',
      selectedAssignmentId: null,
      deleteModalOpen: false,
      bulkDeleteModalOpen: false,
      confirmationModalOpen: false,
      isFilterPanelOpen: false,
      pageMessage: {
        show: false,
        type: 'error',
        message: '',
        title: undefined,
        titleNlsKey: undefined,
        descriptionNlsKey: undefined,
        code: undefined,
      },
      unsavedChangesModal: {
        isOpen: false,
        pendingActionType: null,
      },
      isDataGridLoading: false,
      bulkActionMode: false,
    },
    workersGroupView: {
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
      workersByGroup: {},
      expandedGroupIds: [],
      selectedMembers: {},
      selectedLeads: {},
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
    },
    workersList: {
      workers: [],
      pageInfo: null,
      loading: false,
      error: null,
      currentPage: 1,
      headerTotalCount: 0,
    },
    customerWorkerAssignments: {
      allItems: [],
      totalCount: 0,
      loading: false,
      error: null,
      hasMore: true,
      endCursor: null,
      lastFetchArgs: null,
      customerId: null,
      projectId: null,
    },
    customerAssignments: {
      allItems: [],
      totalCount: 0,
      loading: false,
      error: null,
      hasMore: true,
      endCursor: null,
      totalTimeForAssignments: 0,
      totalCustomFieldAssignments: 0,
      totalStandardFieldAssignments: 0,
      pageBeforeSearch: 1,
    },
    geofenceConfiguration: {
      nodes: [],
      loading: false,
      error: null,
      overrides: {},
    },
    geofenceLocationSearch: {
      selectedPlace: null,
      addressInput: '',
      predictions: [],
      radiusSearchText: null,
      mapReady: false,
      addressError: false,
      radiusError: false,
      resolvedPlaceId: '',
      geofenceOn: false,
      radius: 100,
      saveError: null,
    },
  };

  describe('selectAllGroups', () => {
    it('should return all groups', () => {
      const result = selectAllGroups(mockState);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockGroup1);
      expect(result[1]).toEqual(mockGroup2);
    });

    it('should return empty array when no groups', () => {
      const result = selectAllGroups(emptyState);
      expect(result).toEqual([]);
    });

    it('should memoize results', () => {
      const result1 = selectAllGroups(mockState);
      const result2 = selectAllGroups(mockState);
      expect(result1).toBe(result2);
    });
  });

  describe('selectGroupsLoading', () => {
    it('should return loading state', () => {
      expect(selectGroupsLoading(mockState)).toBe(false);
    });

    it('should return true when loading', () => {
      const loadingState = {
        ...mockState,
        workersGroupView: {
          ...mockState.workersGroupView,
          groups: {
            ...mockState.workersGroupView.groups,
            loading: true,
          },
        },
      };
      expect(selectGroupsLoading(loadingState)).toBe(true);
    });
  });

  describe('selectGroupsError', () => {
    it('should return null when no error', () => {
      expect(selectGroupsError(mockState)).toBe(null);
    });

    it('should return error message when error exists', () => {
      const errorState = {
        ...mockState,
        workersGroupView: {
          ...mockState.workersGroupView,
          groups: {
            ...mockState.workersGroupView.groups,
            error: 'Failed to load groups',
          },
        },
      };
      expect(selectGroupsError(errorState)).toBe('Failed to load groups');
    });
  });

  describe('selectGroupsCount', () => {
    it('should return headerCount when available', () => {
      const stateWithHeaderCount = {
        ...mockState,
        workersGroupView: {
          ...mockState.workersGroupView,
          groups: {
            ...mockState.workersGroupView.groups,
            headerCount: 150,
          },
        },
      };
      expect(selectGroupsCount(stateWithHeaderCount)).toBe(150);
    });

    it('should return 0 for empty state', () => {
      expect(selectGroupsCount(emptyState)).toBe(0);
    });

    it('should fallback to selectTotal when headerCount is 0', () => {
      const stateWithZeroHeaderCount = {
        ...mockState,
        workersGroupView: {
          ...mockState.workersGroupView,
          groups: {
            ...mockState.workersGroupView.groups,
            headerCount: 0,
          },
        },
      };
      expect(selectGroupsCount(stateWithZeroHeaderCount)).toBe(2);
    });
  });

  describe('selectGroupsTotalCount', () => {
    it('should return totalCount when available', () => {
      const {
        selectGroupsTotalCount,
      } = require('src/js/widgets/assignments/store/groupViewSelectors');
      const stateWithTotalCount = {
        ...mockState,
        workersGroupView: {
          ...mockState.workersGroupView,
          groups: {
            ...mockState.workersGroupView.groups,
            totalCount: 200,
          },
        },
      };
      expect(selectGroupsTotalCount(stateWithTotalCount)).toBe(200);
    });

    it('should return 0 for empty state', () => {
      const {
        selectGroupsTotalCount,
      } = require('src/js/widgets/assignments/store/groupViewSelectors');
      expect(selectGroupsTotalCount(emptyState)).toBe(0);
    });

    it('should fallback to selectTotal when totalCount is 0', () => {
      const {
        selectGroupsTotalCount,
      } = require('src/js/widgets/assignments/store/groupViewSelectors');
      const stateWithZeroTotalCount = {
        ...mockState,
        workersGroupView: {
          ...mockState.workersGroupView,
          groups: {
            ...mockState.workersGroupView.groups,
            totalCount: 0,
          },
        },
      };
      expect(selectGroupsTotalCount(stateWithZeroTotalCount)).toBe(2);
    });
  });

  describe('selectWorkersGroupView', () => {
    it('should return the entire workersGroupView state', () => {
      const workersGroupView =
        require('src/js/widgets/assignments/store/groupViewSelectors').selectWorkersGroupView(
          mockState,
        );
      expect(workersGroupView).toEqual(mockState.workersGroupView);
    });
  });

  describe('selectGroupById', () => {
    it('should return the correct group by id', () => {
      const selectGroup1 =
        require('src/js/widgets/assignments/store/groupViewSelectors').selectGroupById(
          'group-1',
        );
      const result = selectGroup1(mockState);
      expect(result).toEqual(mockGroup1);
    });

    it('should return undefined for non-existent group id', () => {
      const selectNonExistent =
        require('src/js/widgets/assignments/store/groupViewSelectors').selectGroupById(
          'non-existent',
        );
      const result = selectNonExistent(mockState);
      expect(result).toBeUndefined();
    });
  });

  describe('selectHasNextPage', () => {
    it('should return hasNextPage value', () => {
      expect(
        require('src/js/widgets/assignments/store/groupViewSelectors').selectHasNextPage(
          mockState,
        ),
      ).toBe(false);
    });

    it('should return true when hasNextPage is true', () => {
      const stateWithNextPage = {
        ...mockState,
        workersGroupView: {
          ...mockState.workersGroupView,
          groups: {
            ...mockState.workersGroupView.groups,
            hasNextPage: true,
          },
        },
      };
      expect(
        require('src/js/widgets/assignments/store/groupViewSelectors').selectHasNextPage(
          stateWithNextPage,
        ),
      ).toBe(true);
    });
  });

  describe('selectGroupsCursor', () => {
    it('should return cursor value', () => {
      expect(
        require('src/js/widgets/assignments/store/groupViewSelectors').selectGroupsCursor(
          mockState,
        ),
      ).toBe(null);
    });

    it('should return cursor when available', () => {
      const stateWithCursor = {
        ...mockState,
        workersGroupView: {
          ...mockState.workersGroupView,
          groups: {
            ...mockState.workersGroupView.groups,
            cursor: 'cursor-123',
          },
        },
      };
      expect(
        require('src/js/widgets/assignments/store/groupViewSelectors').selectGroupsCursor(
          stateWithCursor,
        ),
      ).toBe('cursor-123');
    });
  });

  describe('selectHasMoreGroups', () => {
    it('should return hasMore value', () => {
      expect(
        require('src/js/widgets/assignments/store/groupViewSelectors').selectHasMoreGroups(
          mockState,
        ),
      ).toBe(true);
    });

    it('should return false when no more groups', () => {
      const stateWithNoMore = {
        ...mockState,
        workersGroupView: {
          ...mockState.workersGroupView,
          groups: {
            ...mockState.workersGroupView.groups,
            hasMore: false,
          },
        },
      };
      expect(
        require('src/js/widgets/assignments/store/groupViewSelectors').selectHasMoreGroups(
          stateWithNoMore,
        ),
      ).toBe(false);
    });
  });

  describe('selectIsLoadingMoreGroups', () => {
    it('should return isLoadingMore value', () => {
      expect(
        require('src/js/widgets/assignments/store/groupViewSelectors').selectIsLoadingMoreGroups(
          mockState,
        ),
      ).toBe(false);
    });

    it('should return true when loading more', () => {
      const stateLoadingMore = {
        ...mockState,
        workersGroupView: {
          ...mockState.workersGroupView,
          groups: {
            ...mockState.workersGroupView.groups,
            isLoadingMore: true,
          },
        },
      };
      expect(
        require('src/js/widgets/assignments/store/groupViewSelectors').selectIsLoadingMoreGroups(
          stateLoadingMore,
        ),
      ).toBe(true);
    });
  });

  describe('selectWorkersByGroup', () => {
    it('should return workersByGroup object', () => {
      const result =
        require('src/js/widgets/assignments/store/groupViewSelectors').selectWorkersByGroup(
          mockState,
        );
      expect(result).toEqual({});
    });

    it('should return workersByGroup with data', () => {
      const stateWithWorkers = {
        ...mockState,
        workersGroupView: {
          ...mockState.workersGroupView,
          workersByGroup: {
            'group-1': [{ id: 'worker-1', name: 'Worker 1' }],
          },
        },
      };
      const result =
        require('src/js/widgets/assignments/store/groupViewSelectors').selectWorkersByGroup(
          stateWithWorkers,
        );
      expect(result).toEqual({
        'group-1': [{ id: 'worker-1', name: 'Worker 1' }],
      });
    });
  });

  describe('selectExpandedGroupIds', () => {
    it('should return expandedGroupIds array', () => {
      const result =
        require('src/js/widgets/assignments/store/groupViewSelectors').selectExpandedGroupIds(
          mockState,
        );
      expect(result).toEqual([]);
    });

    it('should return expanded group ids when available', () => {
      const stateWithExpanded = {
        ...mockState,
        workersGroupView: {
          ...mockState.workersGroupView,
          expandedGroupIds: ['group-1', 'group-2'],
        },
      };
      const result =
        require('src/js/widgets/assignments/store/groupViewSelectors').selectExpandedGroupIds(
          stateWithExpanded,
        );
      expect(result).toEqual(['group-1', 'group-2']);
    });
  });

  describe('selectWorkersForGroup', () => {
    it('should return null when no workers for group', () => {
      const selectWorkers =
        require('src/js/widgets/assignments/store/groupViewSelectors').selectWorkersForGroup(
          'group-1',
        );
      const result = selectWorkers(mockState);
      expect(result).toBe(null);
    });

    it('should return workers array when available', () => {
      const stateWithWorkers = {
        ...mockState,
        workersGroupView: {
          ...mockState.workersGroupView,
          workersByGroup: {
            'group-1': [{ id: 'worker-1', name: 'Worker 1' }],
          },
        },
      };
      const selectWorkers =
        require('src/js/widgets/assignments/store/groupViewSelectors').selectWorkersForGroup(
          'group-1',
        );
      const result = selectWorkers(stateWithWorkers);
      expect(result).toEqual([{ id: 'worker-1', name: 'Worker 1' }]);
    });
  });
});
