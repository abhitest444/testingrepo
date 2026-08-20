import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ApprovalsState, WeekTimeGroup } from '../types/Approvals.types';

const initialSubmitTimePanelState = {
  isOpen: false,
  submitThroughDate: null as string | null,
  periodStartDate: null as string | null,
  weekGroups: [] as WeekTimeGroup[],
  expandedWeekIds: [] as string[],
  isLoading: false,
  isSubmitting: false,
  error: null as string | null,
};

const initialState: ApprovalsState = {
  submitTimePanel: initialSubmitTimePanelState,
};

interface SubmitTimePanelDataPayload {
  weekGroups: WeekTimeGroup[];
  periodStartDate: string;
}

const approvalsSlice = createSlice({
  name: 'approvals',
  initialState,
  reducers: {
    setSubmitTimePanelOpen: (state, action: PayloadAction<boolean>) => {
      state.submitTimePanel.isOpen = action.payload;
      if (!action.payload) {
        state.submitTimePanel = initialSubmitTimePanelState;
      }
    },

    setSubmitThroughDate: (state, action: PayloadAction<string | null>) => {
      state.submitTimePanel.submitThroughDate = action.payload;
    },

    setSubmitTimePanelData: (
      state,
      action: PayloadAction<SubmitTimePanelDataPayload>,
    ) => {
      state.submitTimePanel.weekGroups = action.payload.weekGroups;
      state.submitTimePanel.periodStartDate = action.payload.periodStartDate;
      // Auto-expand the current week so the daily breakdown matches the design
      state.submitTimePanel.expandedWeekIds = action.payload.weekGroups
        .filter((week) => week.isCurrentWeek)
        .map((week) => week.id);
      state.submitTimePanel.isLoading = false;
      state.submitTimePanel.error = null;
    },

    toggleWeekExpanded: (state, action: PayloadAction<string>) => {
      const weekId = action.payload;
      const { expandedWeekIds } = state.submitTimePanel;
      state.submitTimePanel.expandedWeekIds = expandedWeekIds.includes(weekId)
        ? expandedWeekIds.filter((id) => id !== weekId)
        : [...expandedWeekIds, weekId];
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.submitTimePanel.isLoading = action.payload;
    },

    setSubmitting: (state, action: PayloadAction<boolean>) => {
      state.submitTimePanel.isSubmitting = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.submitTimePanel.error = action.payload;
      state.submitTimePanel.isLoading = false;
      state.submitTimePanel.isSubmitting = false;
    },

    resetSubmitTimePanel: (state) => {
      state.submitTimePanel = initialSubmitTimePanelState;
    },

    resetApprovalsState: () => initialState,
  },
});

export const {
  setSubmitTimePanelOpen,
  setSubmitThroughDate,
  setSubmitTimePanelData,
  toggleWeekExpanded,
  setLoading,
  setSubmitting,
  setError,
  resetSubmitTimePanel,
  resetApprovalsState,
} = approvalsSlice.actions;

export default approvalsSlice.reducer;
