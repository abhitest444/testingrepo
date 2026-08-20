import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useSandbox } from '@payroll/quicksand';
import { useGroupDetailData } from 'src/js/widgets/assignments/components/WorkerAssignments/GroupDetailView/hooks/useGroupDetailData';
import { useGetWorkersForGroup } from 'src/js/service/hooks/groups/useGetWorkersForGroup';
import { useGetGroups } from 'src/js/service/hooks/groups/useGetGroups';
import workersGroupViewReducer from 'src/js/widgets/assignments/store/workersGroupViewSlice';
import { WorkerType } from 'src/js/widgets/assignments/components/WorkerAssignments/SearchFilterBar/types';
import { GROUP_DETAILS_TRACKING_POINTS } from 'src/js/widgets/assignments/utils/groupsTrackingPoints';

// Create stable mock functions outside the mock
const mockTrack = jest.fn();
const mockSandbox = {
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
};

// Mock dependencies
jest.mock('@payroll/quicksand', () => ({
  useSandbox: () => mockSandbox,
  useTracking: () => mockTrack,
}));
jest.mock('src/js/service/hooks/groups/useGetWorkersForGroup');
jest.mock('src/js/service/hooks/groups/useGetGroups');
jest.mock('src/js/service/hooks/groups/useWorkersTotalCount');

describe('useGroupDetailData', () => {
  const mockLoadWorkersForGroup = jest.fn();
  const mockFetchNextPage = jest.fn();
  const mockFetchPreviousPage = jest.fn();
  const mockLoadGroups = jest.fn();
  const mockExecuteHeaderCountQuery = jest.fn();

  const createMockStore = (initialState: any = {}) =>
    configureStore({
      reducer: {
        workersGroupView: workersGroupViewReducer,
      },
      preloadedState: {
        workersGroupView: {
          groups: {
            ids: ['group-1'],
            entities: {
              'group-1': {
                id: 'group-1',
                name: 'Engineering Team',
                isActive: true,
                stats: {
                  memberCount: 5,
                  managerCount: 2,
                },
                meta: {
                  version: 1,
                  createdAt: '2024-01-01T00:00:00Z',
                  updatedAt: '2024-01-01T00:00:00Z',
                  createdBy: 'user-1',
                  updatedBy: 'user-1',
                },
              },
            },
            loading: false,
            error: null,
            cursor: null,
            hasMore: false,
            isLoadingMore: false,
            totalCount: 1,
            hasNextPage: false,
          },
          workersByGroup: {
            'group-1': {
              ids: ['worker-1', 'worker-2'],
              entities: {
                'worker-1': {
                  id: 'worker-1',
                  name: 'John Doe',
                  status: 'Active',
                  role: 'EMPLOYEE',
                  isGroupLead: false,
                },
                'worker-2': {
                  id: 'worker-2',
                  name: 'Jane Manager',
                  status: 'Active',
                  role: 'EMPLOYEE',
                  isGroupLead: true,
                },
              },
              loading: false,
              error: null,
              cursor: null,
              hasMore: false,
              isLoadingMore: false,
              isSearchResult: false,
            },
          },
          groupDetailView: {
            isActive: true,
            groupId: 'group-1',
            groupName: 'Engineering Team',
          },
          selectedMembers: {},
          selectedLeads: {},
          expandedGroupIds: [],
          currentGroupId: null,
          currentGroupName: null,
          drawerContext: null,
          initialMembers: {},
          initialLeads: {},
          quickActionDrawerOpen: false,
          quickActionDrawerView: null,
          deleteModal: {
            open: false,
            groupId: null,
            groupName: null,
            version: null,
          },
          viewByGroups: true,
          currentMemberWorkers: [],
          currentLeadWorkers: [],
          drawerWorkers: {
            byId: {},
            allIds: [],
            totalFetched: 0,
            hasLoadedInitialManagers: false,
          },
          ...initialState,
        },
      },
    });

  const wrapper = ({ children, store }: any) => (
    <Provider store={store}>{children}</Provider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockTrack.mockClear();
    mockSandbox.logger.info.mockClear();
    (useGetWorkersForGroup as jest.Mock).mockReturnValue({
      loadWorkersForGroup: mockLoadWorkersForGroup,
      loading: false,
      pageInfo: null,
      totalCount: null,
      fetchNextPage: mockFetchNextPage,
      fetchPreviousPage: mockFetchPreviousPage,
    });
    (useGetGroups as jest.Mock).mockReturnValue({
      loadGroups: mockLoadGroups,
      loading: false,
      hasMore: false,
      loadMore: jest.fn(),
    });
    const {
      useWorkersTotalCount,
    } = require('src/js/service/hooks/groups/useWorkersTotalCount');
    (useWorkersTotalCount as jest.Mock).mockReturnValue({
      totalCount: 150,
      loading: false,
      error: null,
      executeQuery: mockExecuteHeaderCountQuery,
    });
  });

  describe('Initial State', () => {
    it('should return initial data correctly', () => {
      const store = createMockStore();
      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      expect(result.current.selectedGroup).toBeDefined();
      expect(result.current.selectedGroup.name).toBe('Engineering Team');
      expect(result.current.memberCount).toBe(5);
      expect(result.current.managerCount).toBe(2);
      expect(result.current.workers).toHaveLength(2);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.searchText).toBe('');
      expect(result.current.filterType).toBe(WorkerType.ALL);
      expect(result.current.currentPage).toBe(1);
      expect(result.current.headerTotalCount).toBe(150);
    });

    it('should return null for selectedGroup when no group is selected', () => {
      const store = createMockStore({
        groupDetailView: {
          isActive: true,
          groupId: null,
          groupName: null,
        },
      });
      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      expect(result.current.selectedGroup).toBeNull();
    });

    it('should return null for selectedGroup when groupId does not exist in entities', () => {
      const store = createMockStore({
        groupDetailView: {
          isActive: true,
          groupId: 'non-existent-group',
          groupName: 'Non-existent Group',
        },
      });
      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      expect(result.current.selectedGroup).toBeNull();
    });

    it('should return empty workers array when no workers data', () => {
      const store = createMockStore({
        workersByGroup: {},
      });
      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      expect(result.current.workers).toEqual([]);
    });
  });

  describe('Data Loading', () => {
    it('should call loadWorkersForGroup on mount when groupDetailView is active', () => {
      const store = createMockStore();
      renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      expect(mockLoadWorkersForGroup).toHaveBeenCalledWith({
        groupId: 'group-1',
        first: 100,
        searchText: undefined,
        types: undefined,
      });
    });

    it('should not call loadWorkersForGroup when groupDetailView is not active', () => {
      const store = createMockStore({
        groupDetailView: {
          isActive: false,
          groupId: 'group-1',
          groupName: 'Engineering Team',
        },
      });
      renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      expect(mockLoadWorkersForGroup).not.toHaveBeenCalled();
    });

    it('should show loading state when loadingWorkers is true', () => {
      (useGetWorkersForGroup as jest.Mock).mockReturnValue({
        loadWorkersForGroup: mockLoadWorkersForGroup,
        loading: true,
        pageInfo: null,
        totalCount: null,
        fetchNextPage: mockFetchNextPage,
        fetchPreviousPage: mockFetchPreviousPage,
      });

      const store = createMockStore();
      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should show loading state when loadingHeaderTotalCount is true', () => {
      const {
        useWorkersTotalCount,
      } = require('src/js/service/hooks/groups/useWorkersTotalCount');
      (useWorkersTotalCount as jest.Mock).mockReturnValue({
        totalCount: 150,
        loading: true,
        error: null,
        executeQuery: mockExecuteHeaderCountQuery,
      });

      const store = createMockStore();
      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should show loading state when workersByGroup is loading', () => {
      const store = createMockStore({
        workersByGroup: {
          'group-1': {
            ids: [],
            entities: {},
            loading: true,
            error: null,
            cursor: null,
            hasMore: false,
            isLoadingMore: false,
            isSearchResult: false,
          },
        },
      });
      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('handleSearchChange', () => {
    it('should update search text', () => {
      const store = createMockStore();
      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      act(() => {
        result.current.handleSearchChange('John');
      });

      expect(result.current.searchText).toBe('John');
    });

    it('should reset current page to 1 when search text changes', async () => {
      const store = createMockStore();
      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      // Set to page 2 first
      act(() => {
        result.current.handlePageChange(2);
      });

      expect(result.current.currentPage).toBe(2);

      // Change search text
      act(() => {
        result.current.handleSearchChange('test');
      });

      await waitFor(() => {
        expect(result.current.currentPage).toBe(1);
      });
    });

    it('should trigger loadWorkersForGroup with search text', async () => {
      const store = createMockStore();
      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      mockLoadWorkersForGroup.mockClear();

      act(() => {
        result.current.handleSearchChange('John');
      });

      await waitFor(() => {
        expect(mockLoadWorkersForGroup).toHaveBeenCalledWith({
          groupId: 'group-1',
          first: 100,
          searchText: 'John',
          types: undefined,
        });
      });
    });

    it('should trim search text before passing to loadWorkersForGroup', async () => {
      const store = createMockStore();
      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      mockLoadWorkersForGroup.mockClear();

      act(() => {
        result.current.handleSearchChange('  John  ');
      });

      await waitFor(() => {
        expect(mockLoadWorkersForGroup).toHaveBeenCalledWith({
          groupId: 'group-1',
          first: 100,
          searchText: 'John',
          types: undefined,
        });
      });
    });
  });

  describe('handleFilterChange', () => {
    it('should update filter type', () => {
      const store = createMockStore();
      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      act(() => {
        result.current.handleFilterChange(WorkerType.EMPLOYEE);
      });

      expect(result.current.filterType).toBe(WorkerType.EMPLOYEE);
    });

    it('should reset current page to 1 when filter changes', async () => {
      const store = createMockStore();
      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      // Set to page 2 first
      act(() => {
        result.current.handlePageChange(2);
      });

      expect(result.current.currentPage).toBe(2);

      // Change filter
      act(() => {
        result.current.handleFilterChange(WorkerType.EMPLOYEE);
      });

      await waitFor(() => {
        expect(result.current.currentPage).toBe(1);
      });
    });

    it('should trigger loadWorkersForGroup with filter types', async () => {
      const store = createMockStore();
      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      mockLoadWorkersForGroup.mockClear();

      act(() => {
        result.current.handleFilterChange(WorkerType.EMPLOYEE);
      });

      await waitFor(() => {
        expect(mockLoadWorkersForGroup).toHaveBeenCalledWith({
          groupId: 'group-1',
          first: 100,
          searchText: undefined,
          types: expect.any(Array),
        });
      });
    });
  });

  describe('handlePageChange', () => {
    it('should not call fetch methods when groupId is null', () => {
      const store = createMockStore({
        groupDetailView: {
          isActive: true,
          groupId: null,
          groupName: null,
        },
      });
      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      act(() => {
        result.current.handlePageChange(2);
      });

      expect(mockFetchNextPage).not.toHaveBeenCalled();
      expect(mockFetchPreviousPage).not.toHaveBeenCalled();
    });

    it('should call fetchNextPage when moving forward with hasNextPage', () => {
      (useGetWorkersForGroup as jest.Mock).mockReturnValue({
        loadWorkersForGroup: mockLoadWorkersForGroup,
        loading: false,
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: false,
        },
        fetchNextPage: mockFetchNextPage,
        fetchPreviousPage: mockFetchPreviousPage,
      });

      const store = createMockStore();
      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      act(() => {
        result.current.handlePageChange(2);
      });

      expect(mockFetchNextPage).toHaveBeenCalledWith({
        groupId: 'group-1',
        first: 100,
        searchText: undefined,
        types: undefined,
      });
    });

    it('should call fetchPreviousPage when moving backward with hasPreviousPage', () => {
      // Setup with both hasNextPage and hasPreviousPage true
      (useGetWorkersForGroup as jest.Mock).mockReturnValue({
        loadWorkersForGroup: mockLoadWorkersForGroup,
        loading: false,
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: true,
        },
        fetchNextPage: mockFetchNextPage,
        fetchPreviousPage: mockFetchPreviousPage,
      });

      const store = createMockStore();
      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      // Set to page 2 first (going forward)
      act(() => {
        result.current.handlePageChange(2);
      });

      expect(mockFetchNextPage).toHaveBeenCalled();
      mockFetchPreviousPage.mockClear();

      // Move back to page 1 (going backward) - now currentPage is 2
      act(() => {
        result.current.handlePageChange(1);
      });

      expect(mockFetchPreviousPage).toHaveBeenCalledWith({
        groupId: 'group-1',
        first: 100,
        searchText: undefined,
        types: undefined,
      });
    });

    it('should not call fetchNextPage when hasNextPage is false', () => {
      (useGetWorkersForGroup as jest.Mock).mockReturnValue({
        loadWorkersForGroup: mockLoadWorkersForGroup,
        loading: false,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
        },
        fetchNextPage: mockFetchNextPage,
        fetchPreviousPage: mockFetchPreviousPage,
      });

      const store = createMockStore();
      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      mockFetchNextPage.mockClear();

      act(() => {
        result.current.handlePageChange(2);
      });

      expect(mockFetchNextPage).not.toHaveBeenCalled();
    });

    it('should include search text in pagination calls', () => {
      (useGetWorkersForGroup as jest.Mock).mockReturnValue({
        loadWorkersForGroup: mockLoadWorkersForGroup,
        loading: false,
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: false,
        },
        fetchNextPage: mockFetchNextPage,
        fetchPreviousPage: mockFetchPreviousPage,
      });

      const store = createMockStore();
      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      act(() => {
        result.current.handleSearchChange('John');
      });

      mockFetchNextPage.mockClear();

      act(() => {
        result.current.handlePageChange(2);
      });

      expect(mockFetchNextPage).toHaveBeenCalledWith(
        expect.objectContaining({
          searchText: 'John',
        }),
      );
    });

    it('should include filter types in pagination calls', () => {
      (useGetWorkersForGroup as jest.Mock).mockReturnValue({
        loadWorkersForGroup: mockLoadWorkersForGroup,
        loading: false,
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: false,
        },
        fetchNextPage: mockFetchNextPage,
        fetchPreviousPage: mockFetchPreviousPage,
      });

      const store = createMockStore();
      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      act(() => {
        result.current.handleFilterChange(WorkerType.EMPLOYEE);
      });

      mockFetchNextPage.mockClear();

      act(() => {
        result.current.handlePageChange(2);
      });

      expect(mockFetchNextPage).toHaveBeenCalledWith(
        expect.objectContaining({
          types: expect.any(Array),
        }),
      );
    });
  });

  describe('handleBack', () => {
    it('should dispatch closeGroupDetailView', () => {
      const store = createMockStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      act(() => {
        result.current.handleBack();
      });

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'workersGroupView/closeGroupDetailView',
        }),
      );
    });

    it('should clear search text when going back', () => {
      const store = createMockStore();
      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      act(() => {
        result.current.handleSearchChange('test');
      });

      expect(result.current.searchText).toBe('test');

      act(() => {
        result.current.handleBack();
      });

      expect(result.current.searchText).toBe('');
    });
  });

  describe('handleAssignWorkers', () => {
    it('should not proceed when selectedGroup is null', async () => {
      const store = createMockStore({
        groupDetailView: {
          isActive: true,
          groupId: null,
          groupName: null,
        },
      });
      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      await act(async () => {
        await result.current.handleAssignWorkers();
      });

      expect(mockSandbox.logger.info).not.toHaveBeenCalled();
    });

    it('should dispatch actions to open assign workers drawer', async () => {
      const store = createMockStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      await act(async () => {
        await result.current.handleAssignWorkers();
      });

      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        'Component="GroupDetailView" Event="Opening assign workers drawer"',
        { groupId: 'group-1', memberCount: 5 },
      );

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'workersGroupView/setDrawerContext',
        }),
      );

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'workersGroupView/setSelectedMembers',
        }),
      );

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'workersGroupView/setInitialMembers',
        }),
      );

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'workersGroupView/openQuickActionDrawer',
        }),
      );
    });

    it('should log error when drawer fails to open', async () => {
      const mockError = new Error('Failed to open');
      const store = createMockStore();

      // Set up spy before hook initialization
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      // Set up the hook
      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      // Wait for hook to initialize
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Now modify the spy to throw on setDrawerContext
      const originalMockImpl = dispatchSpy.getMockImplementation();
      dispatchSpy.mockImplementation((action: any) => {
        // Throw error when dispatching setDrawerContext
        if (action?.type === 'workersGroupView/setDrawerContext') {
          throw mockError;
        }
        // Call through to original implementation for other actions
        if (originalMockImpl) {
          return originalMockImpl(action);
        }
        return store.dispatch(action);
      });

      await act(async () => {
        await result.current.handleAssignWorkers();
      });

      expect(mockSandbox.logger.error).toHaveBeenCalledWith(
        'Component="GroupDetailView" Event="Failed to open assign workers drawer"',
        {
          groupId: 'group-1',
          error: mockError,
        },
      );
    });
  });

  describe('Pagination Calculations', () => {
    it('should calculate totalPages correctly', () => {
      const store = createMockStore({
        groups: {
          ids: ['group-1'],
          entities: {
            'group-1': {
              id: 'group-1',
              name: 'Large Team',
              stats: {
                memberCount: 250,
                managerCount: 10,
              },
            },
          },
          loading: false,
          error: null,
          cursor: null,
          hasMore: false,
          isLoadingMore: false,
          totalCount: 1,
          hasNextPage: false,
        },
      });

      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      expect(result.current.totalItems).toBe(250);
      expect(result.current.totalPages).toBe(3); // ceil(250 / 100) = 3
    });

    it('should use apiTotalCount when available', () => {
      (useGetWorkersForGroup as jest.Mock).mockReturnValue({
        loadWorkersForGroup: mockLoadWorkersForGroup,
        loading: false,
        pageInfo: null,
        totalCount: 75,
        fetchNextPage: mockFetchNextPage,
        fetchPreviousPage: mockFetchPreviousPage,
      });

      const store = createMockStore();
      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      expect(result.current.totalItems).toBe(75);
    });

    it('should handle zero memberCount', () => {
      const store = createMockStore({
        groups: {
          ids: ['group-1'],
          entities: {
            'group-1': {
              id: 'group-1',
              name: 'Empty Group',
              stats: {
                memberCount: 0,
                managerCount: 0,
              },
            },
          },
          loading: false,
          error: null,
          cursor: null,
          hasMore: false,
          isLoadingMore: false,
          totalCount: 1,
          hasNextPage: false,
        },
      });

      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      expect(result.current.totalItems).toBe(0);
      expect(result.current.totalPages).toBe(0);
    });

    it('should handle missing stats', () => {
      const store = createMockStore({
        groups: {
          ids: ['group-1'],
          entities: {
            'group-1': {
              id: 'group-1',
              name: 'Group Without Stats',
              stats: undefined,
            },
          },
          loading: false,
          error: null,
          cursor: null,
          hasMore: false,
          isLoadingMore: false,
          totalCount: 1,
          hasNextPage: false,
        },
      });

      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      expect(result.current.memberCount).toBe(0);
      expect(result.current.managerCount).toBe(0);
      expect(result.current.totalPages).toBe(0);
    });
  });

  describe('Workers Data Transformation', () => {
    it('should transform workers data correctly', () => {
      const store = createMockStore();
      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      expect(result.current.workers).toEqual([
        {
          id: 'worker-1',
          displayName: 'John Doe',
          type: 'EMPLOYEE',
          isGroupLead: false,
        },
        {
          id: 'worker-2',
          displayName: 'Jane Manager',
          type: 'EMPLOYEE',
          isGroupLead: true,
        },
      ]);
    });

    it('should handle missing worker role', () => {
      const store = createMockStore({
        workersByGroup: {
          'group-1': {
            ids: ['worker-3'],
            entities: {
              'worker-3': {
                id: 'worker-3',
                name: 'No Role Worker',
                status: 'Active',
                role: null,
                isGroupLead: false,
              },
            },
            loading: false,
            error: null,
            cursor: null,
            hasMore: false,
            isLoadingMore: false,
            isSearchResult: false,
          },
        },
      });

      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      expect(result.current.workers[0].type).toBe('Unknown');
    });
  });

  describe('handleAssignLeads', () => {
    it('should not proceed when selectedGroup is null', async () => {
      const store = createMockStore({
        groupDetailView: {
          isActive: true,
          groupId: null,
          groupName: null,
        },
      });
      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      await act(async () => {
        await result.current.handleAssignLeads();
      });

      expect(mockSandbox.logger.info).not.toHaveBeenCalled();
    });

    it('should dispatch actions to open assign leads drawer', async () => {
      const store = createMockStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      await act(async () => {
        await result.current.handleAssignLeads();
      });

      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        'Component="GroupDetailView" Event="Opening assign leads drawer"',
        { groupId: 'group-1', managerCount: 2 },
      );

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'workersGroupView/setDrawerContext',
          payload: expect.objectContaining({
            groupId: 'group-1',
            groupName: 'Engineering Team',
            context: 'quick-action',
            initialMembers: {},
            initialLeads: {},
            managerCount: 2,
          }),
        }),
      );

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'workersGroupView/openQuickActionDrawer',
          payload: expect.objectContaining({
            view: 'assign-leads',
          }),
        }),
      );

      // Log success
      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        'Component="GroupDetailView" Event="Opened assign leads drawer"',
        { groupId: 'group-1', managerCount: 2 },
      );
    });

    it('should log error when drawer fails to open', async () => {
      const mockError = new Error('Failed to open');
      const store = createMockStore();

      // Set up spy before hook initialization
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      // Set up the hook
      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      // Wait for hook to initialize
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Now modify the spy to throw on setDrawerContext
      const originalMockImpl = dispatchSpy.getMockImplementation();
      dispatchSpy.mockImplementation((action: any) => {
        // Throw error when dispatching setDrawerContext
        if (action?.type === 'workersGroupView/setDrawerContext') {
          throw mockError;
        }
        // Call through to original implementation for other actions
        if (originalMockImpl) {
          return originalMockImpl(action);
        }
        return store.dispatch(action);
      });

      await act(async () => {
        await result.current.handleAssignLeads();
      });

      expect(mockSandbox.logger.error).toHaveBeenCalledWith(
        'Component="GroupDetailView" Event="Failed to open assign leads drawer"',
        {
          groupId: 'group-1',
          error: mockError,
        },
      );
    });
  });

  describe('refetchWorkers', () => {
    it('should refetch group and workers when groupDetailView is active', () => {
      const store = createMockStore();
      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      mockLoadGroups.mockClear();
      mockLoadWorkersForGroup.mockClear();

      act(() => {
        result.current.refetchWorkers();
      });

      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        'Component="GroupDetailView" Event="Refetching group and workers after assignment"',
        { groupId: 'group-1' },
      );

      expect(mockLoadGroups).toHaveBeenCalledWith({
        first: 1,
        filter: {
          ids: ['group-1'],
          isActive: true,
        },
      });

      expect(mockLoadWorkersForGroup).toHaveBeenCalledWith({
        groupId: 'group-1',
        first: 100,
        searchText: undefined,
        types: undefined,
      });
    });

    it('should not refetch when groupDetailView is not active', () => {
      const store = createMockStore({
        groupDetailView: {
          isActive: false,
          groupId: 'group-1',
          groupName: 'Engineering Team',
        },
      });
      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      mockLoadGroups.mockClear();
      mockLoadWorkersForGroup.mockClear();
      mockSandbox.logger.info.mockClear();

      act(() => {
        result.current.refetchWorkers();
      });

      expect(mockSandbox.logger.info).not.toHaveBeenCalled();
      expect(mockLoadGroups).not.toHaveBeenCalled();
      expect(mockLoadWorkersForGroup).not.toHaveBeenCalled();
    });

    it('should not refetch when groupId is null', () => {
      const store = createMockStore({
        groupDetailView: {
          isActive: true,
          groupId: null,
          groupName: null,
        },
      });
      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      mockLoadGroups.mockClear();
      mockLoadWorkersForGroup.mockClear();
      mockSandbox.logger.info.mockClear();

      act(() => {
        result.current.refetchWorkers();
      });

      expect(mockSandbox.logger.info).not.toHaveBeenCalled();
      expect(mockLoadGroups).not.toHaveBeenCalled();
      expect(mockLoadWorkersForGroup).not.toHaveBeenCalled();
    });

    it('should include search text when refetching workers', () => {
      const store = createMockStore();
      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      act(() => {
        result.current.handleSearchChange('John');
      });

      mockLoadGroups.mockClear();
      mockLoadWorkersForGroup.mockClear();

      act(() => {
        result.current.refetchWorkers();
      });

      expect(mockLoadWorkersForGroup).toHaveBeenCalledWith({
        groupId: 'group-1',
        first: 100,
        searchText: 'John',
        types: undefined,
      });
    });

    it('should include filter types when refetching workers', () => {
      const store = createMockStore();
      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      act(() => {
        result.current.handleFilterChange(WorkerType.EMPLOYEE);
      });

      mockLoadGroups.mockClear();
      mockLoadWorkersForGroup.mockClear();

      act(() => {
        result.current.refetchWorkers();
      });

      expect(mockLoadWorkersForGroup).toHaveBeenCalledWith({
        groupId: 'group-1',
        first: 100,
        searchText: undefined,
        types: expect.any(Array),
      });
    });

    it('should call executeHeaderCountQuery when refetchHeaderCount option is true', () => {
      const store = createMockStore();
      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      mockLoadGroups.mockClear();
      mockLoadWorkersForGroup.mockClear();
      mockExecuteHeaderCountQuery.mockClear();

      act(() => {
        result.current.refetchWorkers({ refetchHeaderCount: true });
      });

      expect(mockExecuteHeaderCountQuery).toHaveBeenCalled();
    });

    it('should not call executeHeaderCountQuery when refetchHeaderCount option is false', () => {
      const store = createMockStore();
      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      mockLoadGroups.mockClear();
      mockLoadWorkersForGroup.mockClear();
      mockExecuteHeaderCountQuery.mockClear();

      act(() => {
        result.current.refetchWorkers({ refetchHeaderCount: false });
      });

      expect(mockExecuteHeaderCountQuery).not.toHaveBeenCalled();
    });

    it('should not call executeHeaderCountQuery when refetchHeaderCount option is not provided', () => {
      const store = createMockStore();
      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      mockLoadGroups.mockClear();
      mockLoadWorkersForGroup.mockClear();
      mockExecuteHeaderCountQuery.mockClear();

      act(() => {
        result.current.refetchWorkers();
      });

      expect(mockExecuteHeaderCountQuery).not.toHaveBeenCalled();
    });
  });

  describe('Header Total Count', () => {
    it('should execute header count query on mount when groupDetailView is active', () => {
      const store = createMockStore();
      renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      expect(mockExecuteHeaderCountQuery).toHaveBeenCalled();
    });

    it('should not execute header count query when groupDetailView is not active', () => {
      const store = createMockStore({
        groupDetailView: {
          isActive: false,
          groupId: null,
          groupName: null,
        },
      });
      mockExecuteHeaderCountQuery.mockClear();

      renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      // The query should not be called when groupId is null (filter is undefined)
      expect(mockExecuteHeaderCountQuery).not.toHaveBeenCalled();
    });

    it('should return headerTotalCount from useWorkersTotalCount', () => {
      const {
        useWorkersTotalCount,
      } = require('src/js/service/hooks/groups/useWorkersTotalCount');
      (useWorkersTotalCount as jest.Mock).mockReturnValue({
        totalCount: 200,
        loading: false,
        error: null,
        executeQuery: mockExecuteHeaderCountQuery,
      });

      const store = createMockStore();
      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      expect(result.current.headerTotalCount).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should dispatch errorHeaderTotalCount to Redux when it exists', () => {
      const {
        useWorkersTotalCount,
      } = require('src/js/service/hooks/groups/useWorkersTotalCount');
      (useWorkersTotalCount as jest.Mock).mockReturnValue({
        totalCount: 150,
        loading: false,
        error: 'Failed to load header count',
        executeQuery: mockExecuteHeaderCountQuery,
      });

      const store = createMockStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'workersGroupView/setGroupDetailViewError',
          payload: { error: 'Failed to load header count' },
        }),
      );
    });

    it('should dispatch workersApiError to Redux when errorHeaderTotalCount is null', () => {
      (useGetWorkersForGroup as jest.Mock).mockReturnValue({
        loadWorkersForGroup: mockLoadWorkersForGroup,
        loading: false,
        pageInfo: null,
        totalCount: null,
        error: 'Failed to load workers',
        fetchNextPage: mockFetchNextPage,
        fetchPreviousPage: mockFetchPreviousPage,
      });

      const store = createMockStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'workersGroupView/setGroupDetailViewError',
          payload: { error: 'Failed to load workers' },
        }),
      );
    });

    it('should prefer errorHeaderTotalCount over workersApiError', () => {
      const {
        useWorkersTotalCount,
      } = require('src/js/service/hooks/groups/useWorkersTotalCount');
      (useWorkersTotalCount as jest.Mock).mockReturnValue({
        totalCount: 150,
        loading: false,
        error: 'Header count error',
        executeQuery: mockExecuteHeaderCountQuery,
      });
      (useGetWorkersForGroup as jest.Mock).mockReturnValue({
        loadWorkersForGroup: mockLoadWorkersForGroup,
        loading: false,
        pageInfo: null,
        totalCount: null,
        error: 'Workers API error',
        fetchNextPage: mockFetchNextPage,
        fetchPreviousPage: mockFetchPreviousPage,
      });

      const store = createMockStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'workersGroupView/setGroupDetailViewError',
          payload: { error: 'Header count error' },
        }),
      );
    });
  });

  describe('Analytics Tracking', () => {
    beforeEach(() => {
      mockTrack.mockClear();
      mockSandbox.logger.info.mockClear();
    });

    it('should track VIEW_GROUP_DETAILS when group detail view becomes active', () => {
      const store = createMockStore();

      renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      expect(mockTrack).toHaveBeenCalledWith(
        GROUP_DETAILS_TRACKING_POINTS.VIEW_GROUP_DETAILS,
      );
      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        'Component="GroupDetailView" Event="Group details page viewed"',
      );
    });

    it('should track VIEW_GROUP_DETAILS only once per view activation', async () => {
      const store = createMockStore({
        groupDetailView: {
          isActive: false,
          groupId: null,
          groupName: null,
        },
      });

      const { rerender } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      // Initially not active - no tracking
      expect(mockTrack).not.toHaveBeenCalled();

      // Update store to make view active
      const newStore = createMockStore({
        groupDetailView: {
          isActive: true,
          groupId: 'group-1',
          groupName: 'Engineering Team',
        },
      });

      mockTrack.mockClear();

      rerender({ store: newStore });

      await waitFor(() => {
        expect(mockTrack).toHaveBeenCalledWith(
          GROUP_DETAILS_TRACKING_POINTS.VIEW_GROUP_DETAILS,
        );
      });

      // Should only be called once
      expect(mockTrack).toHaveBeenCalledTimes(1);
    });

    it('should track SEARCH_WORKERS_DETAIL when search text is entered', () => {
      const store = createMockStore();

      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      mockTrack.mockClear();

      act(() => {
        result.current.handleSearchChange('John');
      });

      expect(mockTrack).toHaveBeenCalledWith(
        GROUP_DETAILS_TRACKING_POINTS.SEARCH_WORKERS_DETAIL,
      );
      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        'Component="GroupDetailView" Event="Group workers searched"',
      );
    });

    it('should not track SEARCH_WORKERS_DETAIL for empty search text', () => {
      const store = createMockStore();

      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      mockTrack.mockClear();

      act(() => {
        result.current.handleSearchChange('');
      });

      expect(mockTrack).not.toHaveBeenCalledWith(
        GROUP_DETAILS_TRACKING_POINTS.SEARCH_WORKERS_DETAIL,
      );
    });

    it('should track FILTER_WORKERS_DETAIL when filter is changed from ALL', () => {
      const store = createMockStore();

      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      mockTrack.mockClear();

      act(() => {
        result.current.handleFilterChange(WorkerType.EMPLOYEE);
      });

      expect(mockTrack).toHaveBeenCalledWith(
        GROUP_DETAILS_TRACKING_POINTS.FILTER_WORKERS_DETAIL,
      );
      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        'Component="GroupDetailView" Event="Group workers filtered"',
      );
    });

    it('should not track FILTER_WORKERS_DETAIL when filter is set to ALL', () => {
      const store = createMockStore();

      const { result } = renderHook(() => useGroupDetailData(), {
        wrapper,
        initialProps: { store },
      });

      mockTrack.mockClear();

      act(() => {
        result.current.handleFilterChange(WorkerType.ALL);
      });

      expect(mockTrack).not.toHaveBeenCalledWith(
        GROUP_DETAILS_TRACKING_POINTS.FILTER_WORKERS_DETAIL,
      );
    });

    it('should verify previous_screen values for all tracking points', () => {
      expect(
        GROUP_DETAILS_TRACKING_POINTS.VIEW_GROUP_DETAILS.previous_screen,
      ).toBe('group_name_link');
      expect(
        GROUP_DETAILS_TRACKING_POINTS.SEARCH_WORKERS_DETAIL.previous_screen,
      ).toBe('group_details_header');
      expect(
        GROUP_DETAILS_TRACKING_POINTS.FILTER_WORKERS_DETAIL.previous_screen,
      ).toBe('group_details_header');
    });
  });
});
