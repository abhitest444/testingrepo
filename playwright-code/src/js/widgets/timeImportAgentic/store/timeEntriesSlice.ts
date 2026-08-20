import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { resetAllSlices } from './globalActions';

export interface TimeEntry {
  timeEntryId: string;
  timeForId: string;
  duration: number;
  date: string;
  isExported: boolean;
  approvalStatus?: string;
  locked?: boolean;
}

export interface LockedDateInfo {
  employeeId: string;
  date: string; // YYYY-MM-DD format
  approvalStatus: string;
  reason: string; // e.g., "approved", "submitted", "locked"
}

export interface TimeEntriesState {
  timeEntries: TimeEntry[];
  loading: boolean;
  error: string | null;
  lastFetched: string | null; // ISO timestamp of last fetch
  lockedDates: LockedDateInfo[]; // Track locked/approved dates
}

// Initial state
const initialState: TimeEntriesState = {
  timeEntries: [],
  loading: false,
  error: null,
  lastFetched: null,
  lockedDates: [],
};

// Slice
const timeEntriesSlice = createSlice({
  name: 'timeEntries',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setTimeEntries: (state, action: PayloadAction<TimeEntry[]>) => {
      state.timeEntries = action.payload;
      state.lastFetched = new Date().toISOString();
    },
    addTimeEntries: (state, action: PayloadAction<TimeEntry[]>) => {
      state.timeEntries.push(...action.payload);
      state.lastFetched = new Date().toISOString();
    },
    clearTimeEntries: (state) => {
      state.timeEntries = [];
      state.lastFetched = null;
    },
    setLockedDates: (state, action: PayloadAction<LockedDateInfo[]>) => {
      state.lockedDates = action.payload;
    },
    addLockedDate: (state, action: PayloadAction<LockedDateInfo>) => {
      // Only add if not already present
      const exists = state.lockedDates.some(
        (locked) =>
          locked.employeeId === action.payload.employeeId &&
          locked.date === action.payload.date,
      );
      if (!exists) {
        state.lockedDates.push(action.payload);
      }
    },
    clearLockedDates: (state) => {
      state.lockedDates = [];
    },
    resetTimeEntriesState: (state) => {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(resetAllSlices, (state) => {
      Object.assign(state, initialState);
    });
  },
});

// Export actions
export const {
  setLoading,
  setError,
  setTimeEntries,
  addTimeEntries,
  clearTimeEntries,
  setLockedDates,
  addLockedDate,
  clearLockedDates,
  resetTimeEntriesState,
} = timeEntriesSlice.actions;

// Export reducer
export default timeEntriesSlice.reducer;
