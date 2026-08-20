import {
  createSlice,
  createEntityAdapter,
  PayloadAction,
  EntityState,
  EntityId,
  Update,
} from '@reduxjs/toolkit';
import type { ItmTask } from '../types/Overview.types';

export const tasksAdapter = createEntityAdapter<ItmTask>({
  selectId: (task) => task.id,
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});

export interface OverviewState {
  tasks: EntityState<ItmTask>;
  isLoadingTasks: boolean;
  error: string | null;
  isUpdatingTask: boolean;
  updateTaskError: string | null;
  refetchTasks: boolean;
}

const initialState: OverviewState = {
  tasks: tasksAdapter.getInitialState(),
  isLoadingTasks: false,
  error: null,
  isUpdatingTask: false,
  updateTaskError: null,
  refetchTasks: false,
};

const overviewSlice = createSlice({
  name: 'overview',
  initialState,
  reducers: {
    setTasks: (state, action: PayloadAction<ItmTask[]>) => {
      tasksAdapter.setAll(state.tasks, action.payload);
      state.isLoadingTasks = false;
      state.error = null;
    },

    setLoadingTasks: (state, action: PayloadAction<boolean>) => {
      state.isLoadingTasks = action.payload;
    },

    setTasksError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoadingTasks = false;
    },

    addTask: (state, action: PayloadAction<ItmTask>) => {
      tasksAdapter.addOne(state.tasks, action.payload);
    },

    addTasks: (state, action: PayloadAction<ItmTask[]>) => {
      tasksAdapter.addMany(state.tasks, action.payload);
    },

    updateTask: (state, action: PayloadAction<Update<ItmTask>>) => {
      tasksAdapter.updateOne(state.tasks, action.payload);
    },

    updateTasks: (state, action: PayloadAction<Update<ItmTask>[]>) => {
      tasksAdapter.updateMany(state.tasks, action.payload);
    },

    removeTask: (state, action: PayloadAction<EntityId>) => {
      tasksAdapter.removeOne(state.tasks, action.payload);
    },

    removeTasks: (state, action: PayloadAction<EntityId[]>) => {
      tasksAdapter.removeMany(state.tasks, action.payload);
    },

    clearTasks: (state) => {
      tasksAdapter.removeAll(state.tasks);
    },

    setUpdatingTask: (state, action: PayloadAction<boolean>) => {
      state.isUpdatingTask = action.payload;
      if (action.payload) {
        state.updateTaskError = null;
      }
    },

    setUpdateTaskError: (state, action: PayloadAction<string | null>) => {
      state.updateTaskError = action.payload;
      state.isUpdatingTask = false;
    },

    setRefetchTasks: (state, action: PayloadAction<boolean>) => {
      state.refetchTasks = action.payload;
    },

    resetOverviewState: () => initialState,
  },
});

export const {
  setTasks,
  setLoadingTasks,
  setTasksError,
  addTask,
  addTasks,
  updateTask,
  updateTasks,
  removeTask,
  removeTasks,
  clearTasks,
  setUpdatingTask,
  setUpdateTaskError,
  setRefetchTasks,
  resetOverviewState,
} = overviewSlice.actions;

export default overviewSlice.reducer;
