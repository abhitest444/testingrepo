import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WorkerRow, WorkerSummarySliceState } from '../types';

const initialState: WorkerSummarySliceState = {
  workers: [],
  loading: false,
  error: false,
  page: 1,
  hasNextPage: false,
};

const workerSummarySlice = createSlice({
  name: 'workerSummary',
  initialState,
  reducers: {
    setWorkerSummaryLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setWorkerSummaryError(state, action: PayloadAction<boolean>) {
      state.error = action.payload;
      if (action.payload) {
        state.workers = [];
      }
    },
    setWorkerSummaryPage(
      state,
      action: PayloadAction<{
        workers: WorkerRow[];
        page: number;
        hasNextPage: boolean;
      }>,
    ) {
      state.workers = action.payload.workers;
      state.page = action.payload.page;
      state.hasNextPage = action.payload.hasNextPage;
    },
    resetWorkerSummary() {
      return initialState;
    },
  },
});

export const {
  setWorkerSummaryLoading,
  setWorkerSummaryError,
  setWorkerSummaryPage,
  resetWorkerSummary,
} = workerSummarySlice.actions;

export default workerSummarySlice.reducer;
