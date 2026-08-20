import {
  createSlice,
  createEntityAdapter,
  createSelector,
  PayloadAction,
} from '@reduxjs/toolkit';
import { Payroll_BreakAssignment } from 'src/__generated__/oigql/graphql';

export interface BreakAssignment {
  id: string;
  breakPolicyId: string;
  assignmentType: string;
  assignee: {
    id: string;
  };
  isActive: boolean;
}

export interface BreakAssignmentsState {
  entities: ReturnType<typeof breakAssignmentsAdapter.getInitialState>;
  loading: boolean;
  error: string | null;
  createLoading: boolean;
  createError: string | null;
}

const breakAssignmentsAdapter = createEntityAdapter<BreakAssignment>({
  selectId: (assignment) => assignment.id,
  sortComparer: (a, b) => a.id.localeCompare(b.id),
});

const initialState: BreakAssignmentsState = {
  entities: breakAssignmentsAdapter.getInitialState(),
  loading: false,
  error: null,
  createLoading: false,
  createError: null,
};

const breakAssignmentsSlice = createSlice({
  name: 'breakAssignments',
  initialState,
  reducers: {
    setBreakAssignments: (state, action: PayloadAction<BreakAssignment[]>) => {
      breakAssignmentsAdapter.setAll(state.entities, action.payload);
      state.loading = false;
      state.error = null;
    },
    addBreakAssignment: (state, action: PayloadAction<BreakAssignment>) => {
      breakAssignmentsAdapter.addOne(state.entities, action.payload);
    },
    addBreakAssignments: (state, action: PayloadAction<BreakAssignment[]>) => {
      breakAssignmentsAdapter.setAll(state.entities, action.payload);
    },
    updateBreakAssignment: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<BreakAssignment> }>,
    ) => {
      breakAssignmentsAdapter.updateOne(state.entities, action.payload);
    },
    removeBreakAssignment: (state, action: PayloadAction<string>) => {
      breakAssignmentsAdapter.removeOne(state.entities, action.payload);
    },
    removeBreakAssignmentsByPolicyId: (
      state,
      action: PayloadAction<string>,
    ) => {
      const policyId = action.payload;
      const idsToRemove = Object.values(state.entities.entities)
        .filter((assignment) => assignment?.breakPolicyId === policyId)
        .map((assignment) => assignment!.id);
      breakAssignmentsAdapter.removeMany(state.entities, idsToRemove);
    },
    setBreakAssignmentsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setBreakAssignmentsError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setBreakAssignmentsCreateLoading: (
      state,
      action: PayloadAction<boolean>,
    ) => {
      state.createLoading = action.payload;
    },
    setBreakAssignmentsCreateError: (
      state,
      action: PayloadAction<string | null>,
    ) => {
      state.createError = action.payload;
    },
    clearBreakAssignments: (state) => {
      breakAssignmentsAdapter.removeAll(state.entities);
    },
  },
});

export const {
  setBreakAssignments,
  addBreakAssignment,
  addBreakAssignments,
  updateBreakAssignment,
  removeBreakAssignment,
  removeBreakAssignmentsByPolicyId,
  setBreakAssignmentsLoading,
  setBreakAssignmentsError,
  setBreakAssignmentsCreateLoading,
  setBreakAssignmentsCreateError,
  clearBreakAssignments,
} = breakAssignmentsSlice.actions;

// Selectors
export const selectBreakAssignmentsState = (state: {
  breakAssignments: BreakAssignmentsState;
}) => state.breakAssignments;

export const selectBreakAssignments = createSelector(
  selectBreakAssignmentsState,
  (breakAssignmentsState) =>
    breakAssignmentsAdapter
      .getSelectors()
      .selectAll(breakAssignmentsState.entities),
);

export const selectBreakAssignmentsById = createSelector(
  [selectBreakAssignmentsState, (state: any, id: string) => id],
  (breakAssignmentsState, id) =>
    breakAssignmentsAdapter
      .getSelectors()
      .selectById(breakAssignmentsState.entities, id),
);

export const selectBreakAssignmentsByPolicyId = createSelector(
  [selectBreakAssignments, (state: any, policyId: string) => policyId],
  (assignments, policyId) =>
    assignments.filter((assignment) => assignment.breakPolicyId === policyId),
);

export const selectBreakAssignmentsLoading = createSelector(
  selectBreakAssignmentsState,
  (breakAssignmentsState) => breakAssignmentsState.loading,
);

export const selectBreakAssignmentsError = createSelector(
  selectBreakAssignmentsState,
  (breakAssignmentsState) => breakAssignmentsState.error,
);

export const selectBreakAssignmentsCreateLoading = createSelector(
  selectBreakAssignmentsState,
  (breakAssignmentsState) => breakAssignmentsState.createLoading,
);

export const selectBreakAssignmentsCreateError = createSelector(
  selectBreakAssignmentsState,
  (breakAssignmentsState) => breakAssignmentsState.createError,
);

export default breakAssignmentsSlice.reducer;
