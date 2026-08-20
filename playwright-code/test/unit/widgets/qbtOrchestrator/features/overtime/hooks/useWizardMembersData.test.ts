/* eslint-disable react/no-children-prop */
import { renderHook, act } from '@testing-library/react-hooks';
import React from 'react';
import { MockQuicksandProvider } from '@payroll/quicksand';
import { Provider } from 'react-redux';
import {
  createQbtOrchestratorStore,
  getDefaultSandbox,
} from 'test/unit/testUtils';
import { useWizardMembersData } from 'src/js/widgets/qbtOrchestrator/features/overtime/hooks/useWizardMembersData';
import {
  TimeTracking_WorkerOrderBy,
  TimeTracking_TimeForType,
  useGetTimeTrackingGroupsLazyQuery,
} from 'src/__generated__/timeTracking/graphql';
import {
  setWizardCachedGroups,
  setWizardCachedWorkers,
  setWizardGroupsLoading,
  setWizardWorkersLoading,
  pushWizardCursorHistory,
} from 'src/js/widgets/qbtOrchestrator/features/overtime/store';

import { useTimeTrackingWorkers } from 'src/js/service/hooks/groups';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockLoadWorkers = jest.fn();
const mockFetchNextPage = jest.fn();
const mockFetchPreviousPage = jest.fn();

const defaultWorkersHookResult = {
  workers: [],
  loading: false,
  error: null,
  totalCount: null,
  pageInfo: null,
  loadWorkers: mockLoadWorkers,
  fetchNextPage: mockFetchNextPage,
  fetchPreviousPage: mockFetchPreviousPage,
  refetch: jest.fn(),
};

jest.mock('src/js/service/hooks/groups', () => ({
  useTimeTrackingWorkers: jest.fn(() => defaultWorkersHookResult),
}));

const mockLoadGroupsQuery = jest.fn();
let mockGroupsQueryState = { data: undefined as any, loading: false };

jest.mock('src/__generated__/timeTracking/graphql', () => ({
  ...jest.requireActual('src/__generated__/timeTracking/graphql'),
  useGetTimeTrackingGroupsLazyQuery: jest.fn(() => [
    mockLoadGroupsQuery,
    mockGroupsQueryState,
  ]),
}));

jest.mock('src/js/common/CustomerInteraction', () => ({
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn(() => ({})),
  TimeCustomerInteraction: {
    GROUPS_READ: 'groups-read',
    WORKERS_READ_FOR_ASSIGNMENT: 'workers-read-for-assignment',
  },
}));

const mockUseTimeTrackingWorkers = useTimeTrackingWorkers as jest.Mock;
const mockUseGetGroupsLazyQuery =
  useGetTimeTrackingGroupsLazyQuery as jest.Mock;

// ── Helpers ───────────────────────────────────────────────────────────────────

const sandbox = getDefaultSandbox();
let store: ReturnType<typeof createQbtOrchestratorStore>;

const createWrapper = () => {
  const Wrapper = ({ children }: { children?: React.ReactNode }) => {
    const inner = React.createElement(Provider, { store, children });
    return React.createElement(MockQuicksandProvider, {
      sandbox,
      children: inner,
    });
  };
  return Wrapper;
};

const defaultParams = {
  filter: undefined,
  sortOrder: TimeTracking_WorkerOrderBy.DisplayNameAsc,
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useWizardMembersData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    store = createQbtOrchestratorStore();
    mockGroupsQueryState = { data: undefined, loading: false };
    mockUseTimeTrackingWorkers.mockReturnValue({ ...defaultWorkersHookResult });
    mockUseGetGroupsLazyQuery.mockReturnValue([
      mockLoadGroupsQuery,
      mockGroupsQueryState,
    ]);
  });

  describe('initial state', () => {
    it('returns empty groups and workers with correct defaults', () => {
      const { result } = renderHook(() => useWizardMembersData(defaultParams), {
        wrapper: createWrapper(),
      });

      expect(result.current.groups).toEqual([]);
      expect(result.current.workers).toEqual([]);
      expect(result.current.groupsLoading).toBe(false);
      expect(result.current.workersLoading).toBe(false);
      expect(result.current.workersError).toBeUndefined();
      expect(result.current.totalWorkerCount).toBe(0);
    });

    it('pagination defaults: hasNextPage=false, hasPreviousPage=false, isLoading=false', () => {
      const { result } = renderHook(() => useWizardMembersData(defaultParams), {
        wrapper: createWrapper(),
      });

      expect(result.current.pagination.hasNextPage).toBe(false);
      expect(result.current.pagination.hasPreviousPage).toBe(false);
      expect(result.current.pagination.isLoading).toBe(false);
    });
  });

  describe('fetching groups', () => {
    it('creates groups interaction and propagates interaction headers on groups load', () => {
      const {
        createCustomerInteraction,
        getCustomerInteractionPropagationHeaders,
      } = require('src/js/common/CustomerInteraction');

      renderHook(() => useWizardMembersData(defaultParams), {
        wrapper: createWrapper(),
      });

      expect(createCustomerInteraction).toHaveBeenCalledWith(
        sandbox,
        'groups-read',
      );
      expect(getCustomerInteractionPropagationHeaders).toHaveBeenCalledWith(
        sandbox,
        'groups-read',
      );
    });

    it('ends groups interaction with success when groups query completes', () => {
      const {
        endInteractionWithSuccess,
      } = require('src/js/common/CustomerInteraction');

      renderHook(() => useWizardMembersData(defaultParams), {
        wrapper: createWrapper(),
      });

      const options = mockUseGetGroupsLazyQuery.mock.calls[0][0];
      options.onCompleted();

      expect(endInteractionWithSuccess).toHaveBeenCalledWith(
        sandbox,
        'groups-read',
      );
    });

    it('ends groups interaction with failure when groups query errors', () => {
      const {
        endInteractionWithFailure,
      } = require('src/js/common/CustomerInteraction');
      const groupsError = new Error('Groups fetch failed');

      renderHook(() => useWizardMembersData(defaultParams), {
        wrapper: createWrapper(),
      });

      const options = mockUseGetGroupsLazyQuery.mock.calls[0][0];
      options.onError(groupsError);

      expect(endInteractionWithFailure).toHaveBeenCalledWith(
        sandbox,
        'groups-read',
        'Groups fetch failed',
        groupsError,
      );
    });

    it('stores groups in Redux when groupsData has edges', async () => {
      const groupsDataWithEdges = {
        timeTrackingGroups: {
          edges: [
            {
              node: {
                id: 'g-1',
                name: 'Engineering',
                isActive: true,
                stats: { memberCount: 10 },
              },
            },
            {
              node: {
                id: 'g-2',
                name: 'Design',
                isActive: false,
                stats: { memberCount: 5 },
              },
            },
          ],
        },
      };

      mockUseGetGroupsLazyQuery.mockReturnValue([
        mockLoadGroupsQuery,
        { data: groupsDataWithEdges, loading: false },
      ]);

      const { result } = renderHook(() => useWizardMembersData(defaultParams), {
        wrapper: createWrapper(),
      });

      // After the effect runs, the Redux store should have the groups cached
      expect(result.current.groups).toHaveLength(2);
      expect(result.current.groups[0].id).toBe('g-1');
      expect(result.current.groups[0].name).toBe('Engineering');
      expect(result.current.groups[0].isActive).toBe(true);
      expect(result.current.groups[0].stats.memberCount).toBe(10);
      expect(result.current.groups[1].id).toBe('g-2');
      expect(result.current.groups[1].name).toBe('Design');
    });

    it('calls loadGroupsQuery on mount when groups are not loaded', () => {
      renderHook(() => useWizardMembersData(defaultParams), {
        wrapper: createWrapper(),
      });

      expect(mockLoadGroupsQuery).toHaveBeenCalledTimes(1);
      expect(mockLoadGroupsQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            filter: { isActive: true },
          }),
        }),
      );
    });

    it('does NOT call loadGroupsQuery when groups are already cached', () => {
      store = createQbtOrchestratorStore();
      store.dispatch(
        setWizardCachedGroups([
          {
            id: 'g-1',
            name: 'Group 1',
            isActive: true,
            stats: { memberCount: 5 },
          },
        ]),
      );

      renderHook(() => useWizardMembersData(defaultParams), {
        wrapper: createWrapper(),
      });

      expect(mockLoadGroupsQuery).not.toHaveBeenCalled();
    });

    it('maps cached groups to QueryGroupNode shape with correct __typename', () => {
      store = createQbtOrchestratorStore();
      store.dispatch(
        setWizardCachedGroups([
          {
            id: 'g-1',
            name: 'Team Alpha',
            isActive: true,
            stats: { memberCount: 3 },
          },
        ]),
      );

      const { result } = renderHook(() => useWizardMembersData(defaultParams), {
        wrapper: createWrapper(),
      });

      expect(result.current.groups).toHaveLength(1);
      const group = result.current.groups[0];
      expect(group.id).toBe('g-1');
      expect(group.name).toBe('Team Alpha');
      expect(group.isActive).toBe(true);
      expect(group.__typename).toBe('TimeTracking_Group');
      expect(group.stats.memberCount).toBe(3);
      expect(group.stats.managerCount).toBe(0);
    });

    it('reflects groupsLoading when groups lazy query is loading', () => {
      // Mock the lazy query returning loading: true so the hook propagates it
      mockUseGetGroupsLazyQuery.mockReturnValue([
        mockLoadGroupsQuery,
        { data: undefined, loading: true },
      ]);

      const { result } = renderHook(() => useWizardMembersData(defaultParams), {
        wrapper: createWrapper(),
      });

      expect(result.current.groupsLoading).toBe(true);
    });
  });

  describe('fetching workers', () => {
    it('calls loadWorkers on mount with overtimeFilter including isActive and worker types', () => {
      renderHook(() => useWizardMembersData(defaultParams), {
        wrapper: createWrapper(),
      });

      expect(mockLoadWorkers).toHaveBeenCalledWith({
        first: expect.any(Number),
        filter: {
          isActive: true,
          types: [
            TimeTracking_TimeForType.Employee,
            TimeTracking_TimeForType.Vendor,
          ],
        },
        orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
      });
    });

    it('overrides caller-supplied isActive: false with isActive: true', () => {
      const callerFilter = { isActive: false } as any;

      renderHook(
        () =>
          useWizardMembersData({
            filter: callerFilter,
            sortOrder: TimeTracking_WorkerOrderBy.DisplayNameAsc,
          }),
        { wrapper: createWrapper() },
      );

      expect(mockLoadWorkers).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({ isActive: true }),
        }),
      );
    });

    it('overrides caller-supplied types with OVERTIME_WORKER_TYPES', () => {
      const callerFilter = { types: ['LEGACY_QBO_USER'] } as any;

      renderHook(
        () =>
          useWizardMembersData({
            filter: callerFilter,
            sortOrder: TimeTracking_WorkerOrderBy.DisplayNameAsc,
          }),
        { wrapper: createWrapper() },
      );

      expect(mockLoadWorkers).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({
            types: [
              TimeTracking_TimeForType.Employee,
              TimeTracking_TimeForType.Vendor,
            ],
          }),
        }),
      );
    });

    it('merges custom filter with overtimeFilter including isActive and worker types', () => {
      const customFilter = { searchText: 'alice' } as any;

      renderHook(
        () =>
          useWizardMembersData({
            filter: customFilter,
            sortOrder: TimeTracking_WorkerOrderBy.DisplayNameAsc,
          }),
        {
          wrapper: createWrapper(),
        },
      );

      expect(mockLoadWorkers).toHaveBeenCalledWith({
        first: expect.any(Number),
        filter: {
          searchText: 'alice',
          isActive: true,
          types: [
            TimeTracking_TimeForType.Employee,
            TimeTracking_TimeForType.Vendor,
          ],
        },
        orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
      });
    });

    it('re-loads workers when sort order changes', () => {
      const { rerender } = renderHook(
        ({ sortOrder }) =>
          useWizardMembersData({
            filter: undefined,
            sortOrder,
          }),
        {
          initialProps: {
            sortOrder: TimeTracking_WorkerOrderBy.DisplayNameAsc,
          },
          wrapper: createWrapper(),
        },
      );

      expect(mockLoadWorkers).toHaveBeenCalledTimes(1);

      rerender({
        sortOrder: TimeTracking_WorkerOrderBy.DisplayNameDesc,
      });

      expect(mockLoadWorkers).toHaveBeenCalledTimes(2);
      expect(mockLoadWorkers).toHaveBeenLastCalledWith({
        first: expect.any(Number),
        filter: {
          isActive: true,
          types: [
            TimeTracking_TimeForType.Employee,
            TimeTracking_TimeForType.Vendor,
          ],
        },
        orderBy: [TimeTracking_WorkerOrderBy.DisplayNameDesc],
      });
    });

    it('re-loads workers when filter changes', () => {
      const { rerender } = renderHook(
        ({ filter }: { filter: any }) =>
          useWizardMembersData({
            filter,
            sortOrder: TimeTracking_WorkerOrderBy.DisplayNameAsc,
          }),
        {
          initialProps: { filter: undefined as any },
          wrapper: createWrapper(),
        },
      );

      expect(mockLoadWorkers).toHaveBeenCalledTimes(1);

      rerender({ filter: { searchText: 'bob' } });

      expect(mockLoadWorkers).toHaveBeenCalledTimes(2);
      expect(mockLoadWorkers).toHaveBeenLastCalledWith({
        first: expect.any(Number),
        filter: {
          searchText: 'bob',
          isActive: true,
          types: [
            TimeTracking_TimeForType.Employee,
            TimeTracking_TimeForType.Vendor,
          ],
        },
        orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
      });
    });

    it('calls loadWorkers even when workers are already cached', () => {
      store = createQbtOrchestratorStore();
      store.dispatch(
        setWizardCachedWorkers({
          workers: [
            {
              id: 'w-1',
              type: 'EMPLOYEE',
              isActive: true,
            },
          ],
          totalCount: 1,
          pageInfo: { hasNextPage: false },
        }),
      );

      renderHook(() => useWizardMembersData(defaultParams), {
        wrapper: createWrapper(),
      });

      expect(mockLoadWorkers).toHaveBeenCalledWith({
        first: expect.any(Number),
        filter: {
          isActive: true,
          types: [
            TimeTracking_TimeForType.Employee,
            TimeTracking_TimeForType.Vendor,
          ],
        },
        orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
      });
    });

    it('maps cached workers to SelectableWorker shape', () => {
      store = createQbtOrchestratorStore();
      store.dispatch(
        setWizardCachedWorkers({
          workers: [
            {
              id: 'w-1',
              type: 'EMPLOYEE',
              isActive: true,
              firstName: 'Jane',
              lastName: 'Doe',
              displayName: 'Jane Doe',
              memberOfGroup: { id: 'g-1', name: 'Team A', isActive: true },
            },
          ],
          totalCount: 1,
          pageInfo: { hasNextPage: false },
        }),
      );

      const { result } = renderHook(() => useWizardMembersData(defaultParams), {
        wrapper: createWrapper(),
      });

      expect(result.current.workers).toHaveLength(1);
      const worker = result.current.workers[0];
      expect(worker.id).toBe('w-1');
      expect(worker.firstName).toBe('Jane');
      expect(worker.lastName).toBe('Doe');
      expect(worker.displayName).toBe('Jane Doe');
      expect(worker.memberOfGroup?.name).toBe('Team A');
    });

    it('reflects workersLoading when workers hook is loading', () => {
      // Mock useTimeTrackingWorkers returning loading: true
      mockUseTimeTrackingWorkers.mockReturnValue({
        ...defaultWorkersHookResult,
        loading: true,
      });

      const { result } = renderHook(() => useWizardMembersData(defaultParams), {
        wrapper: createWrapper(),
      });

      expect(result.current.workersLoading).toBe(true);
    });

    it('caches fetched workers in Redux when fetchedWorkers has items', () => {
      mockUseTimeTrackingWorkers.mockReturnValue({
        ...defaultWorkersHookResult,
        workers: [
          {
            id: 'w-fetched-1',
            type: 'EMPLOYEE',
            isActive: true,
            firstName: 'Alice',
            lastName: 'Smith',
            displayName: 'Alice Smith',
            memberOfGroup: { id: 'g-1', name: 'Team Alpha', isActive: true },
          },
        ],
        totalCount: 1,
        pageInfo: { hasNextPage: false, endCursor: 'cursor-end' },
      });

      const { result } = renderHook(() => useWizardMembersData(defaultParams), {
        wrapper: createWrapper(),
      });

      expect(result.current.workers).toHaveLength(1);
      expect(result.current.workers[0].id).toBe('w-fetched-1');
      expect(result.current.workers[0].memberOfGroup?.name).toBe('Team Alpha');
      expect(result.current.totalWorkerCount).toBe(1);
    });

    it('caches fetched workers without memberOfGroup (null memberOfGroup branch)', () => {
      mockUseTimeTrackingWorkers.mockReturnValue({
        ...defaultWorkersHookResult,
        workers: [
          {
            id: 'w-no-group',
            type: 'EMPLOYEE',
            isActive: true,
            firstName: 'Bob',
            lastName: 'Jones',
            displayName: 'Bob Jones',
            memberOfGroup: null,
          },
        ],
        totalCount: 1,
        pageInfo: { hasNextPage: false, endCursor: null },
      });

      const { result } = renderHook(() => useWizardMembersData(defaultParams), {
        wrapper: createWrapper(),
      });

      expect(result.current.workers).toHaveLength(1);
      expect(result.current.workers[0].id).toBe('w-no-group');
      expect(result.current.workers[0].memberOfGroup).toBeUndefined();
    });

    it('caches workers with pageInfo=null (fallback to hasNextPage:false)', () => {
      mockUseTimeTrackingWorkers.mockReturnValue({
        ...defaultWorkersHookResult,
        workers: [
          {
            id: 'w-null-page',
            type: 'EMPLOYEE',
            isActive: true,
          },
        ],
        totalCount: 1,
        pageInfo: null,
      });

      const { result } = renderHook(() => useWizardMembersData(defaultParams), {
        wrapper: createWrapper(),
      });

      expect(result.current.pagination.hasNextPage).toBe(false);
    });

    it('caches workers when fetchedTotalCount is non-null but workers array is empty', () => {
      mockUseTimeTrackingWorkers.mockReturnValue({
        ...defaultWorkersHookResult,
        workers: [],
        totalCount: 0,
        pageInfo: null,
      });

      const { result } = renderHook(() => useWizardMembersData(defaultParams), {
        wrapper: createWrapper(),
      });

      expect(result.current.totalWorkerCount).toBe(0);
    });

    it('converts error string from useTimeTrackingWorkers to ApolloError', () => {
      mockUseTimeTrackingWorkers.mockReturnValue({
        ...defaultWorkersHookResult,
        error: 'Network error',
      });

      const { result } = renderHook(() => useWizardMembersData(defaultParams), {
        wrapper: createWrapper(),
      });

      expect(result.current.workersError).toBeDefined();
      expect(result.current.workersError?.message).toContain('Network error');
    });

    it('returns undefined workersError when no error', () => {
      mockUseTimeTrackingWorkers.mockReturnValue({
        ...defaultWorkersHookResult,
        error: null,
      });

      const { result } = renderHook(() => useWizardMembersData(defaultParams), {
        wrapper: createWrapper(),
      });

      expect(result.current.workersError).toBeUndefined();
    });
  });

  describe('totalWorkerCount', () => {
    it('uses cached total count from Redux', () => {
      store = createQbtOrchestratorStore();
      store.dispatch(
        setWizardCachedWorkers({
          workers: [],
          totalCount: 42,
          pageInfo: { hasNextPage: false },
        }),
      );

      const { result } = renderHook(() => useWizardMembersData(defaultParams), {
        wrapper: createWrapper(),
      });

      expect(result.current.totalWorkerCount).toBe(42);
    });

    it('uses cached totalCount after workers are stored from fetch', () => {
      // Pre-seed store with a cached total count to simulate workers already fetched
      store = createQbtOrchestratorStore();
      store.dispatch(
        setWizardCachedWorkers({
          workers: [],
          totalCount: 25,
          pageInfo: { hasNextPage: false },
        }),
      );

      const { result } = renderHook(() => useWizardMembersData(defaultParams), {
        wrapper: createWrapper(),
      });

      expect(result.current.totalWorkerCount).toBe(25);
    });
  });

  describe('pagination', () => {
    it('hasNextPage is true when pageInfo.hasNextPage is true in cache', () => {
      store = createQbtOrchestratorStore();
      store.dispatch(
        setWizardCachedWorkers({
          workers: [],
          totalCount: 50,
          pageInfo: { hasNextPage: true, endCursor: 'cursor-abc' },
        }),
      );

      const { result } = renderHook(() => useWizardMembersData(defaultParams), {
        wrapper: createWrapper(),
      });

      expect(result.current.pagination.hasNextPage).toBe(true);
    });

    it('hasPreviousPage is true when cursorHistory has entries', () => {
      store = createQbtOrchestratorStore();
      store.dispatch(pushWizardCursorHistory('cursor-1'));

      const { result } = renderHook(() => useWizardMembersData(defaultParams), {
        wrapper: createWrapper(),
      });

      expect(result.current.pagination.hasPreviousPage).toBe(true);
    });

    it('hasPreviousPage is false when cursorHistory is empty', () => {
      const { result } = renderHook(() => useWizardMembersData(defaultParams), {
        wrapper: createWrapper(),
      });

      expect(result.current.pagination.hasPreviousPage).toBe(false);
    });

    it('handleNextPage sets paginationLoading and calls fetchNextPage with overtime filter', async () => {
      store = createQbtOrchestratorStore();
      store.dispatch(
        setWizardCachedWorkers({
          workers: [],
          totalCount: 50,
          pageInfo: { hasNextPage: true, endCursor: 'cursor-xyz' },
        }),
      );
      mockFetchNextPage.mockResolvedValue(undefined);

      const { result } = renderHook(() => useWizardMembersData(defaultParams), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.pagination.onNextPage();
      });

      expect(mockFetchNextPage).toHaveBeenCalledWith({
        first: expect.any(Number),
        filter: {
          isActive: true,
          types: [
            TimeTracking_TimeForType.Employee,
            TimeTracking_TimeForType.Vendor,
          ],
        },
        orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
      });
      // Loading should be false after completion
      expect(result.current.pagination.isLoading).toBe(false);
    });

    it('handlePreviousPage does nothing when cursorHistory is empty', async () => {
      const { result } = renderHook(() => useWizardMembersData(defaultParams), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.pagination.onPreviousPage();
      });

      expect(mockFetchPreviousPage).not.toHaveBeenCalled();
    });

    it('handlePreviousPage calls fetchPreviousPage with overtime filter when history has entries', async () => {
      store = createQbtOrchestratorStore();
      store.dispatch(pushWizardCursorHistory('cursor-prev'));
      mockFetchPreviousPage.mockResolvedValue(undefined);

      const { result } = renderHook(() => useWizardMembersData(defaultParams), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.pagination.onPreviousPage();
      });

      expect(mockFetchPreviousPage).toHaveBeenCalledWith({
        first: expect.any(Number),
        filter: {
          isActive: true,
          types: [
            TimeTracking_TimeForType.Employee,
            TimeTracking_TimeForType.Vendor,
          ],
        },
        orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
      });
    });
  });
});
