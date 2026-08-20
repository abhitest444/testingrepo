import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { resetAllSlices } from './globalActions';

// Interface for individual weekly time entry (from useReadWeeklyTimeEntries)
export interface WeeklyTimeEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  hours: number;
  client?: string;
  service?: string;
  billableRate?: number;
  costRate?: number;
  notes?: string;
  taxable?: boolean;
  billableStatus?: string;
  timeZone?: string;
  class?: string;
  serviceItem?: string;
  department?: string;
  location?: string;
  // Add other fields as needed based on the actual WeeklyTimeEntry type
}

// Interface for storing weekly time entries by employee
export interface WeeklyTimeEntriesByEmployee {
  [employeeId: string]: WeeklyTimeEntry[];
}

// State interface
export interface WeeklyTimeEntriesState {
  entriesByEmployee: WeeklyTimeEntriesByEmployee;
  loading: boolean;
  error: string | null;
  lastFetched: string | null; // ISO timestamp of last fetch
}

// Initial state
const initialState: WeeklyTimeEntriesState = {
  entriesByEmployee: {},
  loading: false,
  error: null,
  lastFetched: null,
};

// Slice
const weeklyTimeEntriesSlice = createSlice({
  name: 'weeklyTimeEntries',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setEntriesForEmployee: (
      state,
      action: PayloadAction<{ employeeId: string; entries: WeeklyTimeEntry[] }>,
    ) => {
      const { employeeId, entries } = action.payload;
      state.entriesByEmployee[employeeId] = entries;
      state.lastFetched = new Date().toISOString();
    },
    addEntriesForEmployee: (
      state,
      action: PayloadAction<{ employeeId: string; entries: WeeklyTimeEntry[] }>,
    ) => {
      const { employeeId, entries } = action.payload;
      if (!state.entriesByEmployee[employeeId]) {
        state.entriesByEmployee[employeeId] = [];
      }
      state.entriesByEmployee[employeeId].push(...entries);
      state.lastFetched = new Date().toISOString();
    },
    clearEntriesForEmployee: (state, action: PayloadAction<string>) => {
      const employeeId = action.payload;
      delete state.entriesByEmployee[employeeId];
    },
    clearAllEntries: (state) => {
      state.entriesByEmployee = {};
      state.lastFetched = null;
    },
    resetWeeklyTimeEntriesState: (state) => {
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
  setEntriesForEmployee,
  addEntriesForEmployee,
  clearEntriesForEmployee,
  clearAllEntries,
  resetWeeklyTimeEntriesState,
} = weeklyTimeEntriesSlice.actions;

// Export reducer
export default weeklyTimeEntriesSlice.reducer;
