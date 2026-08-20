import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Payroll_EmployerBreak } from 'src/__generated__/oigql/graphql';

export interface Break {
  id: string;
  breakName: string;
  isActive: boolean;
  breakType: 'PAID' | 'UNPAID';
  allowManual: boolean;
  allowAuto: boolean;
  noSetDuration: boolean;
  breakDuration?: number;
  durationUnit?: string;
  isDeleted: boolean;
  isDefaultPolicy: boolean;
  activeBreakAssignmentCount: number;
  manualRule?: any;
  autoRule?: any;
}

export interface BreaksState {
  breaks: Break[];
  loading: boolean;
  error: string | null;
}

const initialState: BreaksState = {
  breaks: [],
  loading: false,
  error: null,
};

const breaksSlice = createSlice({
  name: 'breaks',
  initialState,
  reducers: {
    setBreaks: (state, action: PayloadAction<Break[]>) => {
      state.breaks = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearBreaks: (state) => {
      state.breaks = [];
      state.loading = false;
      state.error = null;
    },
  },
});

export const { setBreaks, setLoading, setError, clearBreaks } =
  breaksSlice.actions;

// Selectors
export const selectBreaks = (state: { breaks: BreaksState }) =>
  state.breaks.breaks;
export const selectBreaksLoading = (state: { breaks: BreaksState }) =>
  state.breaks.loading;
export const selectBreaksError = (state: { breaks: BreaksState }) =>
  state.breaks.error;

export default breaksSlice.reducer;
