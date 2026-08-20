import {
  createSlice,
  createEntityAdapter,
  PayloadAction,
  EntityState,
} from '@reduxjs/toolkit';
import { BreakRule } from '../types';

const breakRulesAdapter = createEntityAdapter<BreakRule>();

const initialState = breakRulesAdapter.getInitialState({
  loading: false,
  error: null as string | null,
  createLoading: false,
  createError: null as string | null,
  updateLoading: false,
  updateError: null as string | null,
  deleteLoading: false,
  deleteError: null as string | null,
  refetch: undefined as boolean | undefined,
});

const breakRulesSlice = createSlice({
  name: 'breakRules',
  initialState,
  reducers: {
    setRules: (state, action: PayloadAction<BreakRule[]>) => {
      breakRulesAdapter.setAll(state, action.payload);
    },
    addRule: (state, action: PayloadAction<BreakRule>) => {
      breakRulesAdapter.addOne(state, action.payload);

      // to make sure new break added always comes on top
      const newId = action.payload.id;
      const currentIndex = state.ids.indexOf(newId);
      if (currentIndex !== -1 && currentIndex !== 0) {
        state.ids.splice(currentIndex, 1);
        state.ids.unshift(newId);
      }
    },
    updateRule: (state, action: PayloadAction<BreakRule>) => {
      breakRulesAdapter.updateOne(state, {
        id: action.payload.id,
        changes: action.payload,
      });
    },
    removeRule: (state, action: PayloadAction<string>) => {
      breakRulesAdapter.removeOne(state, action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setDeleteLoading: (state, action: PayloadAction<boolean>) => {
      state.deleteLoading = action.payload;
    },
    setDeleteError: (state, action: PayloadAction<string | null>) => {
      state.deleteError = action.payload;
    },
    setCreateLoading: (state, action: PayloadAction<boolean>) => {
      state.createLoading = action.payload;
    },
    setCreateError: (state, action: PayloadAction<string | null>) => {
      state.createError = action.payload;
    },
    setUpdateLoading: (state, action: PayloadAction<boolean>) => {
      state.updateLoading = action.payload;
    },
    setUpdateError: (state, action: PayloadAction<string | null>) => {
      state.updateError = action.payload;
    },
    setRefetchBreakPolicies: (state, action: PayloadAction<boolean>) => {
      state.refetch = action.payload;
    },
  },
});

export const {
  setRules,
  addRule,
  updateRule,
  removeRule,
  setLoading,
  setError,
  setCreateLoading,
  setCreateError,
  setUpdateLoading,
  setUpdateError,
  setDeleteLoading,
  setDeleteError,
  setRefetchBreakPolicies,
} = breakRulesSlice.actions;

// Selectors
export const {
  selectAll: selectBreakRules,
  selectById: selectBreakRuleById,
  selectIds: selectBreakRuleIds,
} = breakRulesAdapter.getSelectors(
  (state: { breakRules: ReturnType<typeof breakRulesSlice.reducer> }) =>
    state.breakRules,
);

export const selectBreakRulesLoading = (state: {
  breakRules: ReturnType<typeof breakRulesSlice.reducer>;
}) => state.breakRules.loading;
export const selectBreakRulesError = (state: {
  breakRules: ReturnType<typeof breakRulesSlice.reducer>;
}) => state.breakRules.error;
export const selectBreakRulesDeleteLoading = (state: {
  breakRules: ReturnType<typeof breakRulesSlice.reducer>;
}) => state.breakRules.deleteLoading;
export const selectBreakRulesDeleteError = (state: {
  breakRules: ReturnType<typeof breakRulesSlice.reducer>;
}) => state.breakRules.deleteError;
export const selectBreakRulesCreateLoading = (state: {
  breakRules: ReturnType<typeof breakRulesSlice.reducer>;
}) => state.breakRules.createLoading;
export const selectBreakRulesCreateError = (state: {
  breakRules: ReturnType<typeof breakRulesSlice.reducer>;
}) => state.breakRules.createError;
export const selectBreakRulesUpdateLoading = (state: {
  breakRules: ReturnType<typeof breakRulesSlice.reducer>;
}) => state.breakRules.updateLoading;
export const selectBreakRulesUpdateError = (state: {
  breakRules: ReturnType<typeof breakRulesSlice.reducer>;
}) => state.breakRules.updateError;
export const selectBreakRulesRefetch = (state: {
  breakRules: ReturnType<typeof breakRulesSlice.reducer>;
}) => state.breakRules.refetch;

export default breakRulesSlice.reducer;
