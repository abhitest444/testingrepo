import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { GetTimeTrackingWorkersQuery } from 'src/__generated__/timeTracking/graphql';
import type { RootState } from './index';

/**
 * Worker type from GraphQL query
 */
export type WorkerNode = NonNullable<
  NonNullable<GetTimeTrackingWorkersQuery['timeTrackingWorkers']>['edges']
>[number]['node'];

/**
 * PageInfo type from GraphQL query
 */
export type PageInfo = NonNullable<
  GetTimeTrackingWorkersQuery['timeTrackingWorkers']
>['pageInfo'];

/**
 * Workers List slice state
 */
interface WorkersListState {
  workers: WorkerNode[];
  pageInfo: PageInfo | null;
  loading: boolean;
  error: string | null;
  currentPage: number;
  headerTotalCount: number; // Header count from useWorkersTotalCount (for header display)
}

/**
 * Initial state
 */
const initialState: WorkersListState = {
  workers: [],
  pageInfo: null,
  loading: false,
  error: null,
  currentPage: 1,
  headerTotalCount: 0,
};

/**
 * Workers List slice
 */
const workersListSlice = createSlice({
  name: 'workersList',
  initialState,
  reducers: {
    // Set workers directly (for optimistic updates or manual data management)
    setWorkers: (state, action: PayloadAction<WorkerNode[]>) => {
      state.workers = action.payload;
    },

    // Set error manually
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Set current page
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },

    // Reset current page to 1 (used when filters change)
    resetCurrentPage: (state) => {
      state.currentPage = 1;
    },

    // Set header total count (from useWorkersTotalCount hook)
    setHeaderTotalCount: (state, action: PayloadAction<number>) => {
      state.headerTotalCount = action.payload;
    },
  },
});

// Export actions
export const {
  setWorkers,
  setError,
  setCurrentPage,
  resetCurrentPage,
  setHeaderTotalCount,
} = workersListSlice.actions;

// Selectors
export const selectWorkersListState = (state: RootState) => state.workersList;

export const selectWorkersListWorkers = (state: RootState) =>
  state.workersList.workers;

export const selectWorkersListPageInfo = (state: RootState) =>
  state.workersList.pageInfo;

export const selectWorkersListLoading = (state: RootState) =>
  state.workersList.loading;

export const selectWorkersListError = (state: RootState) =>
  state.workersList.error;

export const selectWorkersListCurrentPage = (state: RootState) =>
  state.workersList.currentPage;

export const selectWorkersListHeaderTotalCount = (state: RootState) =>
  state.workersList.headerTotalCount;

// Memoized selectors
export const selectActiveWorkersListWorkers = createSelector(
  [selectWorkersListWorkers],
  (workers) => workers.filter((worker) => worker.isActive),
);

export const selectInactiveWorkersListWorkers = createSelector(
  [selectWorkersListWorkers],
  (workers) => workers.filter((worker) => !worker.isActive),
);

export default workersListSlice.reducer;
