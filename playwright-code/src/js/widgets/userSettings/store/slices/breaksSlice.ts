/**
 * Redux Toolkit slice for breaks - user settings
 * Manages break rules for the worker in user settings page, including VIEW/EDIT modes
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Payroll_Break } from 'src/__generated__/oigql/graphql';
import { BreakRule } from 'src/js/service/hooks/breaks';

// Card mode enum
export enum BreaksCardMode {
  VIEW = 'VIEW',
  EDIT = 'EDIT',
}

// State interface
// TODO: interface schema will be finalised later when we have the final edit flow with us
export interface BreaksState {
  mode: BreaksCardMode;
  breaks: BreakRule[];
  draftBreaks: BreakRule[];
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: BreaksState = {
  mode: BreaksCardMode.VIEW,
  breaks: [],
  draftBreaks: [],
  loading: false,
  error: null,
};

// Create the slice
const breaksSlice = createSlice({
  name: 'breaks',
  initialState,
  reducers: {
    // Set the current mode (VIEW or EDIT)
    setBreaksMode: (state, action: PayloadAction<BreaksCardMode>) => {
      state.mode = action.payload;
      // When entering edit mode, copy current breaks to draft
      if (action.payload === BreaksCardMode.EDIT) {
        state.draftBreaks = [...state.breaks];
      }
    },

    // Set breaks from API response
    setBreaks: (state, action: PayloadAction<BreakRule[]>) => {
      state.breaks = action.payload;
      state.draftBreaks = action.payload;
      state.loading = false;
      state.error = null;
    },

    // Set loading state
    setBreaksLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // Set error state
    setBreaksError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },

    // Update draft breaks (used while editing)
    updateDraftBreaks: (state, action: PayloadAction<BreakRule[]>) => {
      state.draftBreaks = action.payload;
    },

    // Save draft breaks to current breaks
    saveBreaks: (state) => {
      state.breaks = [...state.draftBreaks];
      state.mode = BreaksCardMode.VIEW;
    },

    // Cancel edit mode and discard draft changes
    cancelBreaksEdit: (state) => {
      state.draftBreaks = [...state.breaks];
      state.mode = BreaksCardMode.VIEW;
    },

    // Reset state
    resetBreaksState: (state) => {
      state.mode = BreaksCardMode.VIEW;
      state.breaks = [];
      state.draftBreaks = [];
      state.loading = false;
      state.error = null;
    },
  },
});

// Export actions
export const {
  setBreaksMode,
  setBreaks,
  setBreaksLoading,
  setBreaksError,
  updateDraftBreaks,
  saveBreaks,
  cancelBreaksEdit,
  resetBreaksState,
} = breaksSlice.actions;

// Selectors
export const selectBreaksMode = (state: any) => state.breaks.mode;
export const selectBreaks = (state: any) => state.breaks.breaks;
export const selectDraftBreaks = (state: any) => state.breaks.draftBreaks;
export const selectBreaksLoading = (state: any) => state.breaks.loading;
export const selectBreaksError = (state: any) => state.breaks.error;

// Derived selectors for paid/unpaid breaks
export const selectPaidBreaks = (state: any) =>
  state.breaks.breaks.filter(
    (b: BreakRule) => b.breakType === Payroll_Break.Paid,
  );

export const selectUnpaidBreaks = (state: any) =>
  state.breaks.breaks.filter(
    (b: BreakRule) => b.breakType === Payroll_Break.Unpaid,
  );

// Draft selectors for edit mode
export const selectDraftPaidBreaks = (state: any) =>
  state.breaks.draftBreaks.filter(
    (b: BreakRule) => b.breakType === Payroll_Break.Paid,
  );

export const selectDraftUnpaidBreaks = (state: any) =>
  state.breaks.draftBreaks.filter(
    (b: BreakRule) => b.breakType === Payroll_Break.Unpaid,
  );

// Export reducer
export default breaksSlice.reducer;
