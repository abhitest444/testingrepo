import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TaskManagement_PriorityType } from 'src/__generated__/oigql/graphql';

export interface ItmTask {
  id: string;
  name: string;
  description?: string;
  status: string;
  type?: string;
  dueDate?: string;
  priority?: TaskManagement_PriorityType;
  references?: Array<{ id: string }>;
}

export interface OverviewState {
  tasks: ItmTask[];
  isLoadingTasks: boolean;
  error: string | null;
  isUpdatingTask: boolean;
  updateTaskError: string | null;
  refetchTasks: boolean;
}

const initialState: OverviewState = {
  tasks: [],
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
      state.tasks = action.payload;
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
      state.tasks.push(action.payload);
    },

    updateTask: (state, action: PayloadAction<ItmTask>) => {
      const index = state.tasks.findIndex((t) => t.id === action.payload.id);
      if (index !== -1) {
        state.tasks[index] = action.payload;
      }
    },

    removeTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter((t) => t.id !== action.payload);
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
  updateTask,
  removeTask,
  setUpdatingTask,
  setUpdateTaskError,
  setRefetchTasks,
  resetOverviewState,
} = overviewSlice.actions;

export default overviewSlice.reducer;
