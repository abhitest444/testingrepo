import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Worker {
  id: string;
  name: string;
  email?: string;
  workerType?: string;
  isActive?: boolean;
}

interface WorkersState {
  workers: Worker[];
  isLoading: boolean;
  error: string | null;
}

const initialState: WorkersState = {
  workers: [],
  isLoading: false,
  error: null,
};

const workersSlice = createSlice({
  name: 'workers',
  initialState,
  reducers: {
    setWorkers: (state, action: PayloadAction<Worker[]>) => {
      state.workers = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    setWorkersLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setWorkersError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    resetWorkers: () => initialState,
  },
});

export const { setWorkers, setWorkersLoading, setWorkersError, resetWorkers } =
  workersSlice.actions;

export default workersSlice.reducer;
