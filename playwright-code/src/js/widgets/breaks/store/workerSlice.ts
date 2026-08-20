import {
  createSlice,
  createEntityAdapter,
  PayloadAction,
  EntityAdapter,
  EntityState,
  createSelector,
} from '@reduxjs/toolkit';
import { TeamMember } from '../types';

interface WorkerState {
  teamMembers: EntityState<TeamMember>;
  loading: boolean;
  error: string | null;
}

const teamMembersAdapter = createEntityAdapter<TeamMember>({
  sortComparer: (a, b) => a.id.localeCompare(b.id),
});

const initialState: WorkerState = {
  teamMembers: teamMembersAdapter.getInitialState(),
  loading: false,
  error: null,
};

const workerSlice = createSlice({
  name: 'workers',
  initialState,
  reducers: {
    setTeamMembers: (state, action: PayloadAction<TeamMember[]>) => {
      teamMembersAdapter.setAll(state.teamMembers, action.payload);
    },
    addTeamMember: (state, action: PayloadAction<TeamMember>) => {
      teamMembersAdapter.addOne(state.teamMembers, action.payload);
    },
    updateTeamMember: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<TeamMember> }>,
    ) => {
      teamMembersAdapter.updateOne(state.teamMembers, action.payload);
    },
    removeTeamMember: (state, action: PayloadAction<string>) => {
      teamMembersAdapter.removeOne(state.teamMembers, action.payload);
    },
  },
});

export const {
  setTeamMembers,
  addTeamMember,
  updateTeamMember,
  removeTeamMember,
} = workerSlice.actions;

// Memoized selector for team members
export const selectTeamMembers = createSelector(
  (state: { workers: WorkerState }) => state.workers.teamMembers,
  (teamMembersState) =>
    teamMembersAdapter.getSelectors().selectAll(teamMembersState),
);

export const selectTotalTeamMembersCount = (state: { workers: WorkerState }) =>
  state.workers.teamMembers.ids.length;

export default workerSlice.reducer;
