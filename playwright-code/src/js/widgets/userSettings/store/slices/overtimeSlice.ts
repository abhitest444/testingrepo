/**
 * Redux Toolkit slice for overtime user settings
 * Manages the worker's effective overtime policy and VIEW/EDIT mode state
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  OvertimePolicy,
  OvertimeRuleType,
  OvertimeRule,
} from 'src/js/widgets/qbtOrchestrator/features/overtime/types/Overtime.types';
import { filterEnabledRules } from 'src/js/widgets/qbtOrchestrator/features/overtime/utils/overtimeMutationUtils';
import { resolveOvertimeRuleType } from 'src/js/widgets/qbtOrchestrator/features/overtime/components/PolicySetupWizard/constants/overtimeRulesConstants';
import { OvertimeCardMode } from '../../components/cards/OvertimeCard/types/OvertimeCard.types';
import type { RootState } from '../index';

// State interface
export interface OvertimeCardState {
  mode: OvertimeCardMode;
  policy: OvertimePolicy | null;
  loading: boolean;
  error: string | null;
  // Form state for edit mode (Phase 3)
  overtimeRuleType: OvertimeRuleType;
  draftRules: OvertimeRule[];
}

// Initial state
const initialState: OvertimeCardState = {
  mode: OvertimeCardMode.VIEW,
  policy: null,
  loading: false,
  error: null,
  overtimeRuleType: '',
  draftRules: [],
};

// Create the slice
const overtimeSlice = createSlice({
  name: 'overtime',
  initialState,
  reducers: {
    // Set the current mode (VIEW or EDIT)
    setOvertimeMode: (state, action: PayloadAction<OvertimeCardMode>) => {
      state.mode = action.payload;
    },

    // Set policy from API response
    setOvertimePolicy: (
      state,
      action: PayloadAction<OvertimePolicy | null>,
    ) => {
      state.policy = action.payload;
      state.loading = false;
      state.error = null;
    },

    // Set loading state
    setOvertimeLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // Set error state
    setOvertimeError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },

    // Reset to VIEW mode and discard draft changes
    cancelOvertimeEdit: (state) => {
      state.mode = OvertimeCardMode.VIEW;
      state.overtimeRuleType = '';
      state.draftRules = [];
    },

    // Reset the entire slice (e.g. when worker changes)
    resetOvertimeState: () => initialState,

    // Set draft rule type (used when user changes the rule type dropdown in edit mode)
    setDraftRuleType: (state, action: PayloadAction<OvertimeRuleType>) => {
      state.overtimeRuleType = action.payload;
    },

    // Set draft rules (used when OvertimeRulesConfig calls onRulesChange)
    setDraftRules: (state, action: PayloadAction<OvertimeRule[]>) => {
      state.draftRules = action.payload;
    },

    // Initialize edit mode draft from current policy (called when entering EDIT mode)
    // If policy exists and has a user-level override, pre-populate rule type and rules.
    // Called before setting mode to EDIT so draft is ready when edit UI renders.
    initializeEditDraft: (
      state,
      action: PayloadAction<OvertimePolicy | null>,
    ) => {
      const policy = action.payload;
      if (policy) {
        const enabledRules = filterEnabledRules(policy.rules?.values ?? []);
        // Detect rule type from policy — heuristic: california if has consecutive_daily rule
        state.overtimeRuleType = resolveOvertimeRuleType(enabledRules);
        state.draftRules = enabledRules;
      } else {
        state.overtimeRuleType = '';
        state.draftRules = [];
      }
    },
  },
});

// Export actions
export const {
  setOvertimeMode,
  setOvertimePolicy,
  setOvertimeLoading,
  setOvertimeError,
  cancelOvertimeEdit,
  resetOvertimeState,
  setDraftRuleType,
  setDraftRules,
  initializeEditDraft,
} = overtimeSlice.actions;

// Selectors
export const selectOvertimeMode = (state: RootState) => state.overtime.mode;
export const selectOvertimePolicy = (state: RootState) => state.overtime.policy;
export const selectOvertimeLoading = (state: RootState) =>
  state.overtime.loading;
export const selectOvertimeError = (state: RootState) => state.overtime.error;
export const selectDraftRuleType = (state: RootState) =>
  state.overtime.overtimeRuleType;
export const selectDraftRules = (state: RootState) => state.overtime.draftRules;

// Export reducer
export default overtimeSlice.reducer;
