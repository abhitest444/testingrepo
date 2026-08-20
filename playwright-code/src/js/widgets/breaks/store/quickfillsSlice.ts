import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BreakRule } from '../types';

interface BreaksByAssignee {
  [assigneeId: string]: {
    breaks: BreakRule[];
    filteredBreaks?: BreakRule[];
    loading: boolean;
    errorCode: string | null;
  };
}

interface QuickfillsState {
  breaksByAssignee: BreaksByAssignee;
}

const initialState: QuickfillsState = {
  breaksByAssignee: {},
};

const quickfillsSlice = createSlice({
  name: 'quickfills',
  initialState,
  reducers: {
    setBreaksByAssignee: (
      state,
      action: PayloadAction<{ assigneeId: string; breaks: BreakRule[] }>,
    ) => {
      const { assigneeId, breaks } = action.payload;
      if (!state.breaksByAssignee[assigneeId]) {
        state.breaksByAssignee[assigneeId] = {
          breaks: [],
          loading: false,
          errorCode: null,
        };
      }
      state.breaksByAssignee[assigneeId].breaks = breaks;
      state.breaksByAssignee[assigneeId].errorCode = null;
    },
    setFilteredBreaksByAssignee: (
      state,
      action: PayloadAction<{
        assigneeId: string;
        filteredBreaks: BreakRule[];
      }>,
    ) => {
      const { assigneeId, filteredBreaks } = action.payload;
      if (!state.breaksByAssignee[assigneeId]) {
        state.breaksByAssignee[assigneeId] = {
          breaks: [],
          loading: false,
          errorCode: null,
        };
      }
      state.breaksByAssignee[assigneeId].filteredBreaks = filteredBreaks;
    },
    setBreaksByAssigneeLoading: (
      state,
      action: PayloadAction<{ assigneeId: string; loading: boolean }>,
    ) => {
      const { assigneeId, loading } = action.payload;
      if (!state.breaksByAssignee[assigneeId]) {
        state.breaksByAssignee[assigneeId] = {
          breaks: [],
          loading: false,
          errorCode: null,
        };
      }
      state.breaksByAssignee[assigneeId].loading = loading;
    },
    setBreaksByAssigneeError: (
      state,
      action: PayloadAction<{ assigneeId: string; errorCode: string | null }>,
    ) => {
      const { assigneeId, errorCode } = action.payload;
      if (!state.breaksByAssignee[assigneeId]) {
        state.breaksByAssignee[assigneeId] = {
          breaks: [],
          loading: false,
          errorCode: null,
        };
      }
      state.breaksByAssignee[assigneeId].errorCode = errorCode;
      state.breaksByAssignee[assigneeId].loading = false;
    },
    clearBreaksByAssignee: (state, action: PayloadAction<string>) => {
      const assigneeId = action.payload;
      delete state.breaksByAssignee[assigneeId];
    },
    clearAllBreaksByAssignee: (state) => {
      state.breaksByAssignee = {};
    },
  },
});

export const {
  setBreaksByAssignee,
  setFilteredBreaksByAssignee,
  setBreaksByAssigneeLoading,
  setBreaksByAssigneeError,
  clearBreaksByAssignee,
  clearAllBreaksByAssignee,
} = quickfillsSlice.actions;

// Selectors
export const selectBreaksByAssignee = (state: {
  quickfills: ReturnType<typeof quickfillsSlice.reducer>;
}) => state.quickfills.breaksByAssignee;

export const selectBreaksForAssignee = (
  state: {
    quickfills: ReturnType<typeof quickfillsSlice.reducer>;
  },
  assigneeId: string,
) => state.quickfills.breaksByAssignee[assigneeId]?.breaks || [];

export const selectFilteredBreaksForAssignee = (
  state: {
    quickfills: ReturnType<typeof quickfillsSlice.reducer>;
  },
  assigneeId: string,
) => state.quickfills.breaksByAssignee[assigneeId]?.filteredBreaks;

export const selectBreaksByAssigneeLoading = (
  state: {
    quickfills: ReturnType<typeof quickfillsSlice.reducer>;
  },
  assigneeId: string,
) => state.quickfills.breaksByAssignee[assigneeId]?.loading || false;

export const selectBreaksByAssigneeError = (
  state: {
    quickfills: ReturnType<typeof quickfillsSlice.reducer>;
  },
  assigneeId: string,
) => state.quickfills.breaksByAssignee[assigneeId]?.errorCode || null;

export default quickfillsSlice.reducer;
