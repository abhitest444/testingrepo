import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { resetAllSlices } from './globalActions';

/**
 * Interface representing an employee
 */
export interface Employee {
  id: string;
  name: string;
  email?: string;
  department?: string;
  type?: 'EMPLOYEE' | 'VENDOR';
}

/**
 * Interface representing the Step 1 state (upload configuration)
 */
export interface Step1State {
  // Configuration options
  maxHoursPerDay: number;

  // Loading states
  isLoading: boolean;
  error: string | null;
}

const initialState: Step1State = {
  // Configuration options
  maxHoursPerDay: 8,

  // Loading states
  isLoading: false,
  error: null,
};

export const step1Slice = createSlice({
  name: 'step1',
  initialState,
  reducers: {
    // Configuration actions
    setMaxHoursPerDay: (state, action: PayloadAction<number>) => {
      state.maxHoursPerDay = action.payload;
    },

    // Loading states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Reset actions
    resetStep1State: (state) => {
      state.maxHoursPerDay = 8;
      state.isLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(resetAllSlices, (state) => {
      Object.assign(state, initialState);
    });
  },
});

export const { setMaxHoursPerDay, setLoading, setError, resetStep1State } =
  step1Slice.actions;

export default step1Slice.reducer;
