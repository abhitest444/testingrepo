import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import {
  useWorkersGroupView,
  useWorkersListState,
} from 'src/js/widgets/assignments/store/hooks';
import workersGroupViewReducer from 'src/js/widgets/assignments/store/workersGroupViewSlice';
import workerReducer from 'src/js/widgets/assignments/store/workerSlice';
import uiReducer from 'src/js/widgets/assignments/store/uiSlice';
import workersListReducer from 'src/js/widgets/assignments/store/workersListSlice';
import {
  TimeTracking_Group,
  TimeTracking_TimeForType,
} from 'src/__generated__/timeTracking/graphql';

// Create a test store factory
const createTestStore = (initialState?: any) =>
  configureStore({
    reducer: {
      workers: workerReducer,
      ui: uiReducer,
      workersGroupView: workersGroupViewReducer,
      workersList: workersListReducer,
    },
    preloadedState: initialState,
  });

describe('useWorkersGroupView', () => {
  const mockGroup: TimeTracking_Group = {
    __typename: 'TimeTracking_Group',
    id: 'group-1',
    name: 'Engineering',
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

  const createWrapper = (store: any) => {
    const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
      React.createElement(Provider, { store } as any, children);
    return Wrapper;
  };

  it('should return initial empty state', () => {
    const store = createTestStore();
    const { result } = renderHook(() => useWorkersGroupView(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.groups).toEqual([]);
    expect(result.current.groupsLoading).toBe(false);
    expect(result.current.groupsError).toBe(null);
    expect(result.current.groupsCount).toBe(0);
    expect(result.current.groupsTotalCount).toBe(0);
  });

  it('should return groups from selector', () => {
    const store = createTestStore({
      workersGroupView: {
        groups: {
          ids: ['group-1'],
          entities: {
            'group-1': mockGroup,
          },
          loading: false,
          error: null,
        },
      },
    });

    const { result } = renderHook(() => useWorkersGroupView(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.groups).toHaveLength(1);
    expect(result.current.groups[0]).toEqual(mockGroup);
    expect(result.current.groupsCount).toBe(1);
    expect(result.current.groupsTotalCount).toBe(1);
  });

  it('should return loading state', () => {
    const store = createTestStore({
      workersGroupView: {
        groups: {
          ids: [],
          entities: {},
          loading: true,
          error: null,
        },
      },
    });

    const { result } = renderHook(() => useWorkersGroupView(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.groupsLoading).toBe(true);
  });

  it('should return error state', () => {
    const errorMessage = 'Failed to load groups';
    const store = createTestStore({
      workersGroupView: {
        groups: {
          ids: [],
          entities: {},
          loading: false,
          error: errorMessage,
        },
      },
    });

    const { result } = renderHook(() => useWorkersGroupView(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.groupsError).toBe(errorMessage);
  });

  it('should return all required properties', () => {
    const store = createTestStore();
    const { result } = renderHook(() => useWorkersGroupView(), {
      wrapper: createWrapper(store),
    });

    expect(result.current).toHaveProperty('groups');
    expect(result.current).toHaveProperty('groupsLoading');
    expect(result.current).toHaveProperty('groupsError');
    expect(result.current).toHaveProperty('groupsCount');
    expect(result.current).toHaveProperty('groupsTotalCount');
  });

  it('should handle multiple groups', () => {
    const mockGroup2: TimeTracking_Group = {
      ...mockGroup,
      id: 'group-2',
      name: 'Sales',
    };

    const store = createTestStore({
      workersGroupView: {
        groups: {
          ids: ['group-1', 'group-2'],
          entities: {
            'group-1': mockGroup,
            'group-2': mockGroup2,
          },
          loading: false,
          error: null,
        },
      },
    });

    const { result } = renderHook(() => useWorkersGroupView(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.groups).toHaveLength(2);
    expect(result.current.groupsCount).toBe(2);
    expect(result.current.groupsTotalCount).toBe(2);
  });

  it('should return groupsTotalCount from selector', () => {
    const store = createTestStore({
      workersGroupView: {
        groups: {
          ids: ['group-1'],
          entities: {
            'group-1': mockGroup,
          },
          loading: false,
          error: null,
          totalCount: 100,
          headerCount: 150,
        },
      },
    });

    const { result } = renderHook(() => useWorkersGroupView(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.groupsCount).toBe(150); // headerCount
    expect(result.current.groupsTotalCount).toBe(100); // totalCount
  });
});

describe('useWorkersListState', () => {
  const mockWorker1 = {
    id: '1',
    displayName: 'Alice Johnson',
    firstName: 'Alice',
    lastName: 'Johnson',
    type: TimeTracking_TimeForType.Employee,
    isActive: true,
    memberOfGroup: { id: 'g1', name: 'Engineering', isActive: true },
    managesGroups: [],
  };

  const mockWorker2 = {
    id: '2',
    displayName: 'Bob Smith',
    firstName: 'Bob',
    lastName: 'Smith',
    type: TimeTracking_TimeForType.Vendor,
    isActive: true,
    memberOfGroup: null,
    managesGroups: [],
  };

  const createWrapper = (store: any) => {
    const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
      React.createElement(Provider, { store } as any, children);
    return Wrapper;
  };

  it('should return initial empty state', () => {
    const store = createTestStore();
    const { result } = renderHook(() => useWorkersListState(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.workers).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.currentPage).toBe(1);
    expect(result.current.pageInfo).toBe(null);
    expect(result.current.dispatch).toBeDefined();
  });

  it('should return workers from state', () => {
    const store = createTestStore({
      workersList: {
        workers: [mockWorker1, mockWorker2],
        pageInfo: null,
        loading: false,
        error: null,
        currentPage: 1,
      },
    });

    const { result } = renderHook(() => useWorkersListState(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.workers).toHaveLength(2);
    expect(result.current.workers[0].displayName).toBe('Alice Johnson');
    expect(result.current.workers[1].displayName).toBe('Bob Smith');
    expect(result.current.currentPage).toBe(1);
  });

  it('should return loading state', () => {
    const store = createTestStore({
      workersList: {
        workers: [],
        pageInfo: null,
        loading: true,
        error: null,
        currentPage: 1,
      },
    });

    const { result } = renderHook(() => useWorkersListState(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.loading).toBe(true);
  });

  it('should return error state', () => {
    const errorMessage = 'Failed to fetch workers';
    const store = createTestStore({
      workersList: {
        workers: [],
        pageInfo: null,
        loading: false,
        error: errorMessage,
        currentPage: 1,
      },
    });

    const { result } = renderHook(() => useWorkersListState(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.error).toBe(errorMessage);
  });

  it('should return pageInfo', () => {
    const mockPageInfo = {
      hasNextPage: true,
      hasPreviousPage: false,
      startCursor: 'cursor-1',
      endCursor: 'cursor-2',
    };

    const store = createTestStore({
      workersList: {
        workers: [mockWorker1],
        pageInfo: mockPageInfo,
        loading: false,
        error: null,
        currentPage: 1,
      },
    });

    const { result } = renderHook(() => useWorkersListState(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.pageInfo).toEqual(mockPageInfo);
  });

  it('should return dispatch function', () => {
    const store = createTestStore();
    const { result } = renderHook(() => useWorkersListState(), {
      wrapper: createWrapper(store),
    });

    expect(typeof result.current.dispatch).toBe('function');
  });

  it('should update workers when state changes', () => {
    const store = createTestStore({
      workersList: {
        workers: [mockWorker1],
        pageInfo: null,
        loading: false,
        error: null,
        currentPage: 1,
      },
    });

    const { result, rerender } = renderHook(() => useWorkersListState(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.workers).toHaveLength(1);
    expect(result.current.currentPage).toBe(1);

    // Set new workers
    store.dispatch({
      type: 'workersList/setWorkers',
      payload: [mockWorker1, mockWorker2],
    });

    rerender();

    expect(result.current.workers).toHaveLength(2);
  });

  it('should update current page when changed', () => {
    const store = createTestStore({
      workersList: {
        workers: [mockWorker1],
        pageInfo: null,
        loading: false,
        error: null,
        currentPage: 1,
      },
    });

    const { result, rerender } = renderHook(() => useWorkersListState(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.currentPage).toBe(1);

    // Change page
    store.dispatch({
      type: 'workersList/setCurrentPage',
      payload: 3,
    });

    rerender();

    expect(result.current.currentPage).toBe(3);
  });
});

describe('useWorkers', () => {
  const createWrapper = (store: any) => {
    const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
      React.createElement(Provider, { store } as any, children);
    return Wrapper;
  };

  it('should return initial empty state', () => {
    const store = createTestStore();
    const { useWorkers } = require('src/js/widgets/assignments/store/hooks');
    const { result } = renderHook(() => useWorkers(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.allWorkers).toEqual([]);
    expect(result.current.filteredWorkers).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should return workers from state', () => {
    const { useWorkers } = require('src/js/widgets/assignments/store/hooks');
    const store = createTestStore({
      workers: {
        workers: {
          ids: ['1'],
          entities: {
            '1': {
              id: '1',
              name: 'Alice Johnson',
              email: 'alice@example.com',
              role: 'developer',
              isActive: true,
              assignmentCount: 5,
            },
          },
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
    });

    const { result } = renderHook(() => useWorkers(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.allWorkers).toHaveLength(1);
    expect(result.current.allWorkers[0].name).toBe('Alice Johnson');
  });

  it('should provide action functions', () => {
    const { useWorkers } = require('src/js/widgets/assignments/store/hooks');
    const store = createTestStore();
    const { result } = renderHook(() => useWorkers(), {
      wrapper: createWrapper(store),
    });

    expect(typeof result.current.setWorkers).toBe('function');
    expect(typeof result.current.addWorker).toBe('function');
    expect(typeof result.current.updateWorker).toBe('function');
    expect(typeof result.current.removeWorker).toBe('function');
    expect(typeof result.current.setSelectedWorkers).toBe('function');
    expect(typeof result.current.toggleWorkerSelection).toBe('function');
    expect(typeof result.current.clearSelectedWorkers).toBe('function');
    expect(typeof result.current.setSearchText).toBe('function');
    expect(typeof result.current.setWorkerStatus).toBe('function');
    expect(typeof result.current.setRoleFilter).toBe('function');
    expect(typeof result.current.clearFilters).toBe('function');
    expect(typeof result.current.toggleShowInactiveWorkers).toBe('function');
    expect(typeof result.current.setShowInactiveWorkers).toBe('function');
    expect(typeof result.current.setLoading).toBe('function');
    expect(typeof result.current.setError).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
  });

  it('should dispatch actions when called', () => {
    const { useWorkers } = require('src/js/widgets/assignments/store/hooks');
    const store = createTestStore();
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    const { result } = renderHook(() => useWorkers(), {
      wrapper: createWrapper(store),
    });

    result.current.setSearchText('test');
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'workers/setSearchText',
        payload: 'test',
      }),
    );

    result.current.setWorkerStatus('active');
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'workers/setWorkerStatus',
        payload: 'active',
      }),
    );

    result.current.clearFilters();
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'workers/clearFilters',
      }),
    );
  });

  it('should dispatch all worker actions correctly', () => {
    const { useWorkers } = require('src/js/widgets/assignments/store/hooks');
    const store = createTestStore();
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    const { result } = renderHook(() => useWorkers(), {
      wrapper: createWrapper(store),
    });

    const mockWorker = {
      id: '1',
      name: 'Test Worker',
      email: 'test@example.com',
      role: 'developer',
      isActive: true,
      assignmentCount: 5,
    };

    result.current.setWorkers([mockWorker]);
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'workers/setWorkers',
        payload: [mockWorker],
      }),
    );

    result.current.addWorker(mockWorker);
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'workers/addWorker',
        payload: mockWorker,
      }),
    );

    result.current.updateWorker('1', { name: 'Updated' });
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'workers/updateWorker',
        payload: { id: '1', changes: { name: 'Updated' } },
      }),
    );

    result.current.removeWorker('1');
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'workers/removeWorker',
        payload: '1',
      }),
    );

    result.current.setSelectedWorkers(['1', '2']);
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'workers/setSelectedWorkers',
        payload: ['1', '2'],
      }),
    );

    result.current.toggleWorkerSelection('1');
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'workers/toggleWorkerSelection',
        payload: '1',
      }),
    );

    result.current.clearSelectedWorkers();
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'workers/clearSelectedWorkers',
      }),
    );

    result.current.setRoleFilter(['developer', 'designer']);
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'workers/setRoleFilter',
        payload: ['developer', 'designer'],
      }),
    );

    result.current.toggleShowInactiveWorkers();
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'workers/toggleShowInactiveWorkers',
      }),
    );

    result.current.setShowInactiveWorkers(true);
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'workers/setShowInactiveWorkers',
        payload: true,
      }),
    );

    result.current.setLoading(true);
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'workers/setLoading',
        payload: true,
      }),
    );

    result.current.setError('Test error');
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'workers/setError',
        payload: 'Test error',
      }),
    );

    result.current.clearError();
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'workers/clearError',
      }),
    );
  });
});

describe('useAssignmentsUI', () => {
  const createWrapper = (store: any) => {
    const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
      React.createElement(Provider, { store } as any, children);
    return Wrapper;
  };

  it('should return initial UI state', () => {
    const {
      useAssignmentsUI,
    } = require('src/js/widgets/assignments/store/hooks');
    const store = createTestStore();
    const { result } = renderHook(() => useAssignmentsUI(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.isAssignmentDrawerOpen).toBe(false);
    expect(result.current.deleteModalOpen).toBe(false);
    expect(result.current.isFilterPanelOpen).toBe(false);
    expect(result.current.pageMessage).toEqual({
      show: false,
      type: 'error',
      message: '',
      titleNlsKey: undefined,
      title: undefined,
      descriptionNlsKey: undefined,
      code: undefined,
    });
  });

  it('should provide action functions', () => {
    const {
      useAssignmentsUI,
    } = require('src/js/widgets/assignments/store/hooks');
    const store = createTestStore();
    const { result } = renderHook(() => useAssignmentsUI(), {
      wrapper: createWrapper(store),
    });

    expect(typeof result.current.openAssignmentDrawer).toBe('function');
    expect(typeof result.current.closeAssignmentDrawer).toBe('function');
    expect(typeof result.current.setDeleteModalOpen).toBe('function');
    expect(typeof result.current.toggleFilterPanel).toBe('function');
    expect(typeof result.current.setPageMessage).toBe('function');
    expect(typeof result.current.clearPageMessage).toBe('function');
    expect(typeof result.current.showSuccessMessage).toBe('function');
    expect(typeof result.current.showErrorMessage).toBe('function');
    expect(typeof result.current.showWarningMessage).toBe('function');
  });

  it('should dispatch actions when called', () => {
    const {
      useAssignmentsUI,
    } = require('src/js/widgets/assignments/store/hooks');
    const store = createTestStore();
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    const { result } = renderHook(() => useAssignmentsUI(), {
      wrapper: createWrapper(store),
    });

    result.current.openAssignmentDrawer('create');
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ui/openAssignmentDrawer',
      }),
    );

    result.current.setDeleteModalOpen(true);
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ui/setDeleteModalOpen',
        payload: true,
      }),
    );

    result.current.toggleFilterPanel();
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ui/toggleFilterPanel',
      }),
    );
  });

  it('should dispatch all UI actions correctly', () => {
    const {
      useAssignmentsUI,
    } = require('src/js/widgets/assignments/store/hooks');
    const store = createTestStore();
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    const { result } = renderHook(() => useAssignmentsUI(), {
      wrapper: createWrapper(store),
    });

    result.current.closeAssignmentDrawer();
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ui/closeAssignmentDrawer',
      }),
    );

    result.current.setBulkDeleteModalOpen(true);
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ui/setBulkDeleteModalOpen',
        payload: true,
      }),
    );

    result.current.setConfirmationModalOpen(true);
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ui/setConfirmationModalOpen',
        payload: true,
      }),
    );

    result.current.setFilterPanelOpen(true);
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ui/setFilterPanelOpen',
        payload: true,
      }),
    );

    const mockPageMessage = {
      show: true,
      type: 'error' as const,
      message: 'Test message',
    };
    result.current.setPageMessage(mockPageMessage);
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ui/setPageMessage',
        payload: mockPageMessage,
      }),
    );

    result.current.clearPageMessage();
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ui/clearPageMessage',
      }),
    );

    result.current.showSuccessMessage('Success!', 'Title');
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ui/showSuccessMessage',
        payload: {
          message: 'Success!',
          title: 'Title',
          titleNlsKey: undefined,
        },
      }),
    );

    result.current.showErrorMessage(
      'Error!',
      'Error Title',
      'error.title',
      'ERR001',
    );
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ui/showErrorMessage',
        payload: {
          message: 'Error!',
          title: 'Error Title',
          titleNlsKey: 'error.title',
          code: 'ERR001',
        },
      }),
    );

    result.current.showWarningMessage('Warning!', 'Warning Title');
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ui/showWarningMessage',
        payload: {
          message: 'Warning!',
          title: 'Warning Title',
          titleNlsKey: undefined,
        },
      }),
    );

    result.current.openUnsavedChangesModal('save');
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ui/openUnsavedChangesModal',
        payload: 'save',
      }),
    );

    result.current.closeUnsavedChangesModal();
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ui/closeUnsavedChangesModal',
      }),
    );

    result.current.setDataGridLoading(true);
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ui/setDataGridLoading',
        payload: true,
      }),
    );

    result.current.setBulkActionMode(true);
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ui/setBulkActionMode',
        payload: true,
      }),
    );

    result.current.toggleBulkActionMode();
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ui/toggleBulkActionMode',
      }),
    );

    result.current.resetUIState();
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ui/resetUIState',
      }),
    );
  });
});
