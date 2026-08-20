/* eslint-disable react/no-children-prop */
import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useCombinedGroupsDataFetching } from 'src/js/widgets/assignments/components/WorkerAssignments/WorkersTableByGroupsView/hooks/useCombinedGroupsDataFetching';
import { GROUPS_PAGE_SIZE } from 'src/js/widgets/assignments/components/WorkerAssignments/WorkersTableByGroupsView/constants';
import workersGroupViewReducer from 'src/js/widgets/assignments/store/workersGroupViewSlice';
import workersListReducer from 'src/js/widgets/assignments/store/workersListSlice';

// Mock the hooks
jest.mock('src/js/service/hooks/groups/useGetGroups');
jest.mock('src/js/service/hooks/groups/useWorkersTotalCount');
jest.mock('src/js/service/hooks/groups/useActiveGroupsTotalCount');

const { useGetGroups } = require('src/js/service/hooks/groups/useGetGroups');
const {
  useWorkersTotalCount,
} = require('src/js/service/hooks/groups/useWorkersTotalCount');
const {
  useActiveGroupsTotalCount,
} = require('src/js/service/hooks/groups/useActiveGroupsTotalCount');

describe('useCombinedGroupsDataFetching', () => {
  const mockGroups = [
    { id: 'group-1', name: 'Engineering', stats: { memberCount: 10 } },
    { id: 'group-2', name: 'Design', stats: { memberCount: 5 } },
  ];

  const createMockStore = (preloadedState?: any) =>
    configureStore({
      reducer: {
        workersGroupView: workersGroupViewReducer,
        workersList: workersListReducer,
      },
      preloadedState,
    });

  const mockLoadGroups = jest.fn();
  const mockFetchNextPage = jest.fn();
  const mockFetchPreviousPage = jest.fn();
  const mockExecuteHeaderCountQuery = jest.fn();
  const mockExecuteActiveGroupsTotalCountQuery = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useGetGroups hook
    useGetGroups.mockReturnValue({
      loadGroups: mockLoadGroups,
      fetchNextPage: mockFetchNextPage,
      fetchPreviousPage: mockFetchPreviousPage,
      loading: false,
      error: null,
    });

    // Mock useWorkersTotalCount hook
    useWorkersTotalCount.mockReturnValue({
      totalCount: 150,
      loading: false,
      error: null,
      executeQuery: mockExecuteHeaderCountQuery,
    });

    // Mock useActiveGroupsTotalCount hook
    useActiveGroupsTotalCount.mockReturnValue({
      totalActiveGroupCount: 100,
      loading: false,
      error: null,
      executeQuery: mockExecuteActiveGroupsTotalCountQuery,
    });
  });

  describe('Initialization', () => {
    it('should fetch initial data on mount with isActive filter', () => {
      const store = createMockStore();
      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      renderHook(() => useCombinedGroupsDataFetching(''), { wrapper });

      expect(mockExecuteHeaderCountQuery).toHaveBeenCalled();
      expect(mockExecuteActiveGroupsTotalCountQuery).toHaveBeenCalled();
      expect(mockLoadGroups).toHaveBeenCalledWith({
        first: GROUPS_PAGE_SIZE,
        filter: { isActive: true },
      });
    });

    it('should fetch initial data with search text', () => {
      const store = createMockStore();
      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      renderHook(() => useCombinedGroupsDataFetching('Engineering'), {
        wrapper,
      });

      expect(mockLoadGroups).toHaveBeenCalledWith({
        first: GROUPS_PAGE_SIZE,
        filter: { isActive: true, searchText: 'Engineering' },
      });
    });

    it('should only initialize once', () => {
      const store = createMockStore();
      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      const { rerender } = renderHook(() => useCombinedGroupsDataFetching(''), {
        wrapper,
      });

      expect(mockLoadGroups).toHaveBeenCalledTimes(1);
      expect(mockExecuteHeaderCountQuery).toHaveBeenCalledTimes(1);

      rerender();

      expect(mockLoadGroups).toHaveBeenCalledTimes(1);
      expect(mockExecuteHeaderCountQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe('Return Values', () => {
    it('should return groups data from Redux', () => {
      const store = createMockStore({
        workersGroupView: {
          groups: {
            ids: ['group-1'],
            entities: { 'group-1': mockGroups[0] },
            loading: false,
            error: null,
            cursor: null,
            hasMore: false,
            isLoadingMore: false,
            totalCount: 100,
            headerCount: 50,
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
          unsavedChangesModal: { open: false },
          groupDetailView: {
            isActive: false,
            groupId: null,
            groupName: null,
            error: null,
          },
          viewByGroups: true,
          addWorkerDrawerOpen: false,
          drawerError: { errorTitle: null, errorMessage: null },
        },
        workersList: {
          workers: { ids: [], entities: {} },
          currentPage: 1,
          loading: false,
          error: null,
          totalCount: 0,
          hasNextPage: false,
          hasPreviousPage: false,
          headerTotalCount: 0,
          sortOrder: 'DisplayNameAsc',
          searchTerm: '',
          lastSearchTerm: '',
        },
      });
      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useCombinedGroupsDataFetching(''), {
        wrapper,
      });

      // groupsCount uses headerCount from useActiveGroupsTotalCount mock (100)
      expect(result.current.groupsCount).toBe(100);
      expect(result.current.groupsTotalCount).toBe(100);
    });

    it('should return header counts', () => {
      const store = createMockStore();
      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useCombinedGroupsDataFetching(''), {
        wrapper,
      });

      expect(result.current.totalActiveWorkerCount).toBe(150);
      expect(result.current.totalActiveGroupCount).toBe(100);
    });

    it('should return loading state', () => {
      useGetGroups.mockReturnValue({
        loadGroups: mockLoadGroups,
        fetchNextPage: mockFetchNextPage,
        fetchPreviousPage: mockFetchPreviousPage,
        loading: true,
        error: null,
      });

      const store = createMockStore();
      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useCombinedGroupsDataFetching(''), {
        wrapper,
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.groupsLoading).toBe(true);
    });

    it('should return error state', () => {
      useGetGroups.mockReturnValue({
        loadGroups: mockLoadGroups,
        fetchNextPage: mockFetchNextPage,
        fetchPreviousPage: mockFetchPreviousPage,
        loading: false,
        error: 'Failed to load groups',
      });

      const store = createMockStore();
      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useCombinedGroupsDataFetching(''), {
        wrapper,
      });

      expect(result.current.error).toBe('Failed to load groups');
      expect(result.current.groupsError).toBe('Failed to load groups');
    });

    it('should return action functions', () => {
      const store = createMockStore();
      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useCombinedGroupsDataFetching(''), {
        wrapper,
      });

      expect(result.current.loadGroups).toBe(mockLoadGroups);
      expect(result.current.fetchNextPage).toBe(mockFetchNextPage);
      expect(result.current.fetchPreviousPage).toBe(mockFetchPreviousPage);
      expect(typeof result.current.refetchHeaderCounts).toBe('function');
    });
  });

  describe('Combined Loading State', () => {
    it('should be loading when groups are loading', () => {
      useGetGroups.mockReturnValue({
        loadGroups: mockLoadGroups,
        fetchNextPage: mockFetchNextPage,
        fetchPreviousPage: mockFetchPreviousPage,
        loading: true,
        error: null,
      });

      const store = createMockStore();
      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useCombinedGroupsDataFetching(''), {
        wrapper,
      });

      expect(result.current.loading).toBe(true);
    });

    it('should be loading when worker count is loading', () => {
      useWorkersTotalCount.mockReturnValue({
        totalCount: undefined,
        loading: true,
        error: null,
        executeQuery: mockExecuteHeaderCountQuery,
      });

      const store = createMockStore();
      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useCombinedGroupsDataFetching(''), {
        wrapper,
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.headerCountsLoading).toBe(true);
    });

    it('should be loading when groups count is loading', () => {
      useActiveGroupsTotalCount.mockReturnValue({
        totalActiveGroupCount: undefined,
        loading: true,
        error: null,
        executeQuery: mockExecuteActiveGroupsTotalCountQuery,
      });

      const store = createMockStore();
      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useCombinedGroupsDataFetching(''), {
        wrapper,
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.headerCountsLoading).toBe(true);
    });

    it('should not be loading when all data is loaded', () => {
      const store = createMockStore();
      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useCombinedGroupsDataFetching(''), {
        wrapper,
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('Combined Error State', () => {
    it('should prioritize groups error', () => {
      useGetGroups.mockReturnValue({
        loadGroups: mockLoadGroups,
        fetchNextPage: mockFetchNextPage,
        fetchPreviousPage: mockFetchPreviousPage,
        loading: false,
        error: 'Groups error',
      });

      useActiveGroupsTotalCount.mockReturnValue({
        totalActiveGroupCount: undefined,
        loading: false,
        error: 'Groups count error',
        executeQuery: mockExecuteActiveGroupsTotalCountQuery,
      });

      const store = createMockStore();
      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useCombinedGroupsDataFetching(''), {
        wrapper,
      });

      expect(result.current.error).toBe('Groups error');
    });

    it('should show groups count error when no groups error', () => {
      useActiveGroupsTotalCount.mockReturnValue({
        totalActiveGroupCount: undefined,
        loading: false,
        error: 'Groups count error',
        executeQuery: mockExecuteActiveGroupsTotalCountQuery,
      });

      const store = createMockStore();
      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useCombinedGroupsDataFetching(''), {
        wrapper,
      });

      expect(result.current.error).toBe('Groups count error');
    });

    it('should return null when no errors', () => {
      const store = createMockStore();
      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useCombinedGroupsDataFetching(''), {
        wrapper,
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Header Counts Error State', () => {
    it('should capture header counts error', () => {
      useActiveGroupsTotalCount.mockReturnValue({
        totalActiveGroupCount: undefined,
        loading: false,
        error: 'Groups count error',
        executeQuery: mockExecuteActiveGroupsTotalCountQuery,
      });

      const store = createMockStore();
      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useCombinedGroupsDataFetching(''), {
        wrapper,
      });

      expect(result.current.headerCountsError).toBe('Groups count error');
    });

    it('should capture worker count error', () => {
      useWorkersTotalCount.mockReturnValue({
        totalCount: undefined,
        loading: false,
        error: 'Worker count error',
        executeQuery: mockExecuteHeaderCountQuery,
      });

      const store = createMockStore();
      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useCombinedGroupsDataFetching(''), {
        wrapper,
      });

      expect(result.current.headerCountsError).toBe('Worker count error');
    });
  });

  describe('Refetch Header Counts', () => {
    it('should call both header count queries', () => {
      const store = createMockStore();
      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useCombinedGroupsDataFetching(''), {
        wrapper,
      });

      // Clear initial calls
      mockExecuteHeaderCountQuery.mockClear();
      mockExecuteActiveGroupsTotalCountQuery.mockClear();

      act(() => {
        result.current.refetchHeaderCounts();
      });

      expect(mockExecuteHeaderCountQuery).toHaveBeenCalledTimes(1);
      expect(mockExecuteActiveGroupsTotalCountQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe('Default Values', () => {
    it('should return 0 for undefined totalActiveWorkerCount', () => {
      useWorkersTotalCount.mockReturnValue({
        totalCount: undefined,
        loading: false,
        error: null,
        executeQuery: mockExecuteHeaderCountQuery,
      });

      const store = createMockStore();
      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useCombinedGroupsDataFetching(''), {
        wrapper,
      });

      expect(result.current.totalActiveWorkerCount).toBe(0);
    });

    it('should return 0 for undefined totalActiveGroupCount', () => {
      useActiveGroupsTotalCount.mockReturnValue({
        totalActiveGroupCount: undefined,
        loading: false,
        error: null,
        executeQuery: mockExecuteActiveGroupsTotalCountQuery,
      });

      const store = createMockStore();
      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useCombinedGroupsDataFetching(''), {
        wrapper,
      });

      expect(result.current.totalActiveGroupCount).toBe(0);
    });
  });

  describe('Redux Sync', () => {
    it('should dispatch setHeaderTotalCount when worker count changes', async () => {
      useWorkersTotalCount.mockReturnValue({
        totalCount: 200,
        loading: false,
        error: null,
        executeQuery: mockExecuteHeaderCountQuery,
      });

      const store = createMockStore();
      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      renderHook(() => useCombinedGroupsDataFetching(''), { wrapper });

      // Check Redux state was updated
      const state = store.getState() as any;
      expect(state.workersList.headerTotalCount).toBe(200);
    });

    it('should dispatch setGroupsHeaderCount when groups count changes', async () => {
      useActiveGroupsTotalCount.mockReturnValue({
        totalActiveGroupCount: 50,
        loading: false,
        error: null,
        executeQuery: mockExecuteActiveGroupsTotalCountQuery,
      });

      const store = createMockStore();
      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      renderHook(() => useCombinedGroupsDataFetching(''), { wrapper });

      // Check Redux state was updated
      const state = store.getState() as any;
      expect(state.workersGroupView.groups.headerCount).toBe(50);
    });
  });
});
