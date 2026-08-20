import {
  createSlice,
  createEntityAdapter,
  PayloadAction,
  EntityAdapter,
  EntityState,
  createSelector,
} from '@reduxjs/toolkit';

/**
 * Worker interface representing a team member
 */
export interface Worker {
  id: string;
  name: string;
  email?: string;
  role?: string;
  isActive: boolean;
  assignmentCount?: number;
  lastAssignedDate?: string;
}

/**
 * Filter options for worker list
 */
export interface WorkerFilters {
  searchText: string;
  workerStatus: 'all' | 'active' | 'inactive';
  roleFilter: string[];
}

/**
 * Worker slice state
 */
interface WorkerState {
  workers: EntityState<Worker>;
  selectedWorkerIds: string[];
  filters: WorkerFilters;
  loading: boolean;
  error: string | null;
  showInactiveWorkers: boolean;
}

/**
 * Entity adapter for normalized worker state
 */
const workersAdapter: EntityAdapter<Worker> = createEntityAdapter<Worker>({
  selectId: (worker) => worker.id,
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});

/**
 * Initial state for worker slice
 */
const initialState: WorkerState = {
  workers: workersAdapter.getInitialState(),
  selectedWorkerIds: [],
  filters: {
    searchText: '',
    workerStatus: 'all',
    roleFilter: [],
  },
  loading: false,
  error: null,
  showInactiveWorkers: false,
};

/**
 * Worker slice for managing worker data and filters
 */
const workerSlice = createSlice({
  name: 'workers',
  initialState,
  reducers: {
    // Worker CRUD operations
    setWorkers: (state, action: PayloadAction<Worker[]>) => {
      workersAdapter.setAll(state.workers, action.payload);
    },
    addWorker: (state, action: PayloadAction<Worker>) => {
      workersAdapter.addOne(state.workers, action.payload);
    },
    updateWorker: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<Worker> }>,
    ) => {
      workersAdapter.updateOne(state.workers, action.payload);
    },
    removeWorker: (state, action: PayloadAction<string>) => {
      workersAdapter.removeOne(state.workers, action.payload);
      // Remove from selected if present
      state.selectedWorkerIds = state.selectedWorkerIds.filter(
        (id) => id !== action.payload,
      );
    },

    // Selection operations
    setSelectedWorkers: (state, action: PayloadAction<string[]>) => {
      state.selectedWorkerIds = action.payload;
    },
    toggleWorkerSelection: (state, action: PayloadAction<string>) => {
      const workerId = action.payload;
      const index = state.selectedWorkerIds.indexOf(workerId);
      if (index > -1) {
        state.selectedWorkerIds.splice(index, 1);
      } else {
        state.selectedWorkerIds.push(workerId);
      }
    },
    clearSelectedWorkers: (state) => {
      state.selectedWorkerIds = [];
    },

    // Filter operations
    setSearchText: (state, action: PayloadAction<string>) => {
      state.filters.searchText = action.payload;
    },
    setWorkerStatus: (
      state,
      action: PayloadAction<'all' | 'active' | 'inactive'>,
    ) => {
      state.filters.workerStatus = action.payload;
    },
    setRoleFilter: (state, action: PayloadAction<string[]>) => {
      state.filters.roleFilter = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {
        searchText: '',
        workerStatus: 'all',
        roleFilter: [],
      };
    },

    // Toggle show inactive workers
    toggleShowInactiveWorkers: (state) => {
      state.showInactiveWorkers = !state.showInactiveWorkers;
    },
    setShowInactiveWorkers: (state, action: PayloadAction<boolean>) => {
      state.showInactiveWorkers = action.payload;
    },

    // Loading and error states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

// Export actions
export const {
  setWorkers,
  addWorker,
  updateWorker,
  removeWorker,
  setSelectedWorkers,
  toggleWorkerSelection,
  clearSelectedWorkers,
  setSearchText,
  setWorkerStatus,
  setRoleFilter,
  clearFilters,
  toggleShowInactiveWorkers,
  setShowInactiveWorkers,
  setLoading,
  setError,
  clearError,
} = workerSlice.actions;

// Base selectors
export const selectWorkersState = (state: { workers: WorkerState }) =>
  state.workers;

export const selectWorkersEntity = (state: { workers: WorkerState }) =>
  state.workers.workers;

export const selectSelectedWorkerIds = (state: { workers: WorkerState }) =>
  state.workers.selectedWorkerIds;

export const selectFilters = (state: { workers: WorkerState }) =>
  state.workers.filters;

export const selectLoading = (state: { workers: WorkerState }) =>
  state.workers.loading;

export const selectError = (state: { workers: WorkerState }) =>
  state.workers.error;

export const selectShowInactiveWorkers = (state: { workers: WorkerState }) =>
  state.workers.showInactiveWorkers;

// Memoized selectors using entity adapter
const workersSelectors = workersAdapter.getSelectors(
  (state: { workers: WorkerState }) => state.workers.workers,
);

export const selectAllWorkers = workersSelectors.selectAll;
export const selectWorkerById = workersSelectors.selectById;
export const selectWorkerEntities = workersSelectors.selectEntities;
export const selectWorkersIds = workersSelectors.selectIds;

// Complex memoized selectors
export const selectFilteredWorkers = createSelector(
  [selectAllWorkers, selectFilters, selectShowInactiveWorkers],
  (workers, filters, showInactive) =>
    workers.filter((worker) => {
      // Filter by search text
      const matchesSearch =
        filters.searchText === '' ||
        worker.name.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        worker.email?.toLowerCase().includes(filters.searchText.toLowerCase());

      // Filter by worker status
      const matchesStatus =
        filters.workerStatus === 'all' ||
        (filters.workerStatus === 'active' && worker.isActive) ||
        (filters.workerStatus === 'inactive' && !worker.isActive);

      // Filter by role
      const matchesRole =
        filters.roleFilter.length === 0 ||
        (worker.role && filters.roleFilter.includes(worker.role));

      // Filter by show inactive toggle
      const matchesInactiveToggle = showInactive || worker.isActive;

      return (
        matchesSearch && matchesStatus && matchesRole && matchesInactiveToggle
      );
    }),
);

export const selectActiveWorkers = createSelector(
  [selectAllWorkers],
  (workers) => workers.filter((worker) => worker.isActive),
);

export const selectInactiveWorkers = createSelector(
  [selectAllWorkers],
  (workers) => workers.filter((worker) => !worker.isActive),
);

export const selectSelectedWorkers = createSelector(
  [selectAllWorkers, selectSelectedWorkerIds],
  (workers, selectedIds) =>
    workers.filter((worker) => selectedIds.includes(worker.id)),
);

export const selectWorkersCount = createSelector(
  [selectAllWorkers],
  (workers) => workers.length,
);

export const selectFilteredWorkersCount = createSelector(
  [selectFilteredWorkers],
  (workers) => workers.length,
);

export const selectSelectedWorkersCount = createSelector(
  [selectSelectedWorkerIds],
  (selectedIds) => selectedIds.length,
);

export default workerSlice.reducer;
