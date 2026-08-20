import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import { useTeamMembers } from 'src/js/widgets/breaks/hooks/useTeamMembers';
import workerSlice from 'src/js/widgets/breaks/store/workerSlice';
import {
  TimeTracking_TimeForType,
  TimeTracking_WorkerOrderBy,
} from 'src/__generated__/timeTracking/graphql';

// --- mock useTimeTrackingWorkers ---
const mockLoadWorkers = jest.fn();
const mockUseTimeTrackingWorkers = jest.fn();
jest.mock('src/js/service/hooks/groups/useTimeTrackingWorkers', () => ({
  useTimeTrackingWorkers: () => mockUseTimeTrackingWorkers(),
}));

// --- mock CustomerInteraction ---
jest.mock('src/js/common/CustomerInteraction', () => ({
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn(() => ({})),
  TimeCustomerInteraction: { WORKER_READ: 'worker-employee-and-vendor-read' },
}));

const createStore = () => configureStore({ reducer: { workers: workerSlice } });

const wrapper =
  (store: ReturnType<typeof createStore>) =>
  ({ children }: { children: React.ReactNode }) => {
    const ProviderComponent = Provider as any;
    return React.createElement(ProviderComponent, { store }, children);
  };

const ttWorkersDefault = {
  workers: [],
  loading: false,
  loadWorkers: mockLoadWorkers,
  fetchNextPage: jest.fn(),
  fetchPreviousPage: jest.fn(),
  refetch: jest.fn(),
  pageInfo: null,
  totalCount: null,
  error: null,
};

const TT_WORKERS_CALL_ARGS = {
  first: 200,
  filter: {
    types: [TimeTracking_TimeForType.Employee, TimeTracking_TimeForType.Vendor],
    isTimeTrackingEnabled: true,
    isActive: true,
  },
  orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseTimeTrackingWorkers.mockReturnValue(ttWorkersDefault);
});

describe('useTeamMembers', () => {
  it('calls loadWorkers with first:200 and correct filter on mount', () => {
    const store = createStore();
    renderHook(() => useTeamMembers(), { wrapper: wrapper(store) });

    expect(mockLoadWorkers).toHaveBeenCalledTimes(1);
    expect(mockLoadWorkers).toHaveBeenCalledWith(TT_WORKERS_CALL_ARGS);
  });

  it('maps Employee worker to TeamMember with workerType Employee', () => {
    mockUseTimeTrackingWorkers.mockReturnValue({
      ...ttWorkersDefault,
      workers: [
        {
          id: 'tt-emp-1',
          type: TimeTracking_TimeForType.Employee,
          displayName: 'Alice Johnson',
          firstName: 'Alice',
          isActive: true,
        },
      ],
    });

    const store = createStore();
    const { result } = renderHook(() => useTeamMembers(), {
      wrapper: wrapper(store),
    });

    expect(result.current.teamMembers).toEqual([
      { id: 'tt-emp-1', name: 'Alice Johnson', workerType: 'Employee' },
    ]);
  });

  it('maps Vendor worker to TeamMember with workerType Vendor', () => {
    mockUseTimeTrackingWorkers.mockReturnValue({
      ...ttWorkersDefault,
      workers: [
        {
          id: 'tt-ven-1',
          type: TimeTracking_TimeForType.Vendor,
          displayName: 'Bob Smith',
          firstName: 'Bob',
          isActive: true,
        },
      ],
    });

    const store = createStore();
    const { result } = renderHook(() => useTeamMembers(), {
      wrapper: wrapper(store),
    });

    expect(result.current.teamMembers).toEqual([
      { id: 'tt-ven-1', name: 'Bob Smith', workerType: 'Vendor' },
    ]);
  });

  it('falls back to firstName when displayName is absent', () => {
    mockUseTimeTrackingWorkers.mockReturnValue({
      ...ttWorkersDefault,
      workers: [
        {
          id: 'tt-emp-2',
          type: TimeTracking_TimeForType.Employee,
          displayName: null,
          firstName: 'Carol',
          isActive: true,
        },
      ],
    });

    const store = createStore();
    const { result } = renderHook(() => useTeamMembers(), {
      wrapper: wrapper(store),
    });

    expect(result.current.teamMembers[0].name).toBe('Carol');
  });

  it('dispatches setTeamMembers to Redux when teamMembers are non-empty', () => {
    mockUseTimeTrackingWorkers.mockReturnValue({
      ...ttWorkersDefault,
      workers: [
        {
          id: 'tt-emp-1',
          type: TimeTracking_TimeForType.Employee,
          displayName: 'Alice',
          firstName: 'Alice',
          isActive: true,
        },
      ],
    });

    const store = createStore();
    renderHook(() => useTeamMembers(), { wrapper: wrapper(store) });

    const state = store.getState().workers;
    expect(state.teamMembers.ids).toContain('tt-emp-1');
  });

  it('returns loading state from TT Workers hook', () => {
    mockUseTimeTrackingWorkers.mockReturnValue({
      ...ttWorkersDefault,
      loading: true,
    });

    const store = createStore();
    const { result } = renderHook(() => useTeamMembers(), {
      wrapper: wrapper(store),
    });

    expect(result.current.loading).toBe(true);
  });

  it('loadTeamMembers re-calls loadWorkers with first:200 and correct filter', () => {
    const store = createStore();
    const { result } = renderHook(() => useTeamMembers(), {
      wrapper: wrapper(store),
    });

    act(() => {
      result.current.loadTeamMembers();
    });

    expect(mockLoadWorkers).toHaveBeenCalledWith(TT_WORKERS_CALL_ARGS);
  });
});
