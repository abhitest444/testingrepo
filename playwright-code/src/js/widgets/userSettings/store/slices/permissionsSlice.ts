/** Redux Toolkit slice for the Permissions card (persisted + draft + status flags). */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  TimeTracking_ProjectPermission,
  TimeTracking_ScheduleLevel,
  TimeTracking_WorkerPermissions,
} from 'src/__generated__/timeTracking/graphql';
import {
  PERMISSIONS_ROLE_VALUE,
  PROJECTS_ACCESS_VALUE,
  PermissionsRole,
  PermissionsSettings,
  ProjectsAccess,
  SCHEDULE_SCOPE_RANK,
  SCHEDULE_SCOPE_VALUE,
  ScheduleScope,
  WHOS_WORKING_SCOPE_VALUE,
} from '../../components/cards/PermissionsCard/constants';
import { PermissionsCardMode } from '../../components/cards/PermissionsCard/types/PermissionsCard.types';
import type { RootState } from '..';

/** Maps GQL `TimeTracking_WorkerPermissions` (query or mutation payload) into the card view-model. */
const scheduleLevelToScope = (
  level: TimeTracking_ScheduleLevel,
): ScheduleScope => {
  switch (level) {
    case TimeTracking_ScheduleLevel.Company:
      return SCHEDULE_SCOPE_VALUE.COMPANY;
    case TimeTracking_ScheduleLevel.Group:
      return SCHEDULE_SCOPE_VALUE.GROUP;
    case TimeTracking_ScheduleLevel.Self:
    case TimeTracking_ScheduleLevel.None:
    default:
      return SCHEDULE_SCOPE_VALUE.THEIR_OWN;
  }
};

const projectPermissionToAccess = (
  level: TimeTracking_ProjectPermission,
): ProjectsAccess => {
  switch (level) {
    case TimeTracking_ProjectPermission.Manage:
      return PROJECTS_ACCESS_VALUE.CREATE_EDIT;
    case TimeTracking_ProjectPermission.View:
      return PROJECTS_ACCESS_VALUE.VIEW_ONLY;
    case TimeTracking_ProjectPermission.None:
    default:
      return PROJECTS_ACCESS_VALUE.NO_ACCESS;
  }
};

/** Maps BE `admin: Boolean` to the card's role radio (time_admin / worker). */
const adminToRole = (admin: boolean): PermissionsRole =>
  admin ? PERMISSIONS_ROLE_VALUE.TIME_ADMIN : PERMISSIONS_ROLE_VALUE.WORKER;

export const mapGqlToPermissionsSettings = (
  perms: Pick<
    TimeTracking_WorkerPermissions,
    | 'admin'
    | 'managementPermissions'
    | 'schedulePermissions'
    | 'projectPermission'
    | 'featurePermissions'
  >,
): PermissionsSettings => ({
  role: adminToRole(perms.admin),
  timesheets: {
    mobileTimeEntry: perms.featurePermissions.mobileEnabled,
    manageMyTimesheets: perms.managementPermissions.manageMyTimesheets,
  },
  schedule: {
    viewSchedule:
      perms.schedulePermissions.viewLevel !== TimeTracking_ScheduleLevel.None,
    viewScheduleScope: scheduleLevelToScope(
      perms.schedulePermissions.viewLevel,
    ),
    manageSchedule:
      perms.schedulePermissions.manageLevel !== TimeTracking_ScheduleLevel.None,
    manageScheduleScope: scheduleLevelToScope(
      perms.schedulePermissions.manageLevel,
    ),
  },
  projectsAccess: projectPermissionToAccess(perms.projectPermission),
  company: {
    viewWhosWorking: perms.featurePermissions.whosWorkingEnabled,
    viewWhosWorkingScope: WHOS_WORKING_SCOPE_VALUE.ALL_WORKERS,
  },
});

/** Nullable until the first successful fetch — never seed fake defaults. */
export interface PermissionsState {
  mode: PermissionsCardMode;
  permissions: PermissionsSettings | null;
  draftPermissions: PermissionsSettings | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: PermissionsState = {
  mode: PermissionsCardMode.VIEW,
  permissions: null,
  draftPermissions: null,
  loading: false,
  saving: false,
  error: null,
};

const permissionsSlice = createSlice({
  name: 'permissions',
  initialState,
  reducers: {
    setPermissionsMode: (state, action: PayloadAction<PermissionsCardMode>) => {
      state.mode = action.payload;
      if (action.payload === PermissionsCardMode.EDIT) {
        state.draftPermissions = state.permissions;
      }
    },

    setPermissions: (state, action: PayloadAction<PermissionsSettings>) => {
      state.permissions = action.payload;
      state.draftPermissions = action.payload;
      state.loading = false;
      state.error = null;
    },

    setPermissionsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },

    setPermissionsSaving: (state, action: PayloadAction<boolean>) => {
      state.saving = action.payload;
    },

    setPermissionsError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
      state.saving = false;
    },

    // Field-level draft updates; each is a no-op when draft is null (defensive guard).
    setDraftRole: (state, action: PayloadAction<PermissionsRole>) => {
      if (!state.draftPermissions) return;
      state.draftPermissions.role = action.payload;
    },
    setDraftMobileTimeEntry: (state, action: PayloadAction<boolean>) => {
      if (!state.draftPermissions) return;
      state.draftPermissions.timesheets.mobileTimeEntry = action.payload;
    },
    setDraftManageMyTimesheets: (state, action: PayloadAction<boolean>) => {
      if (!state.draftPermissions) return;
      state.draftPermissions.timesheets.manageMyTimesheets = action.payload;
    },
    setDraftViewSchedule: (state, action: PayloadAction<boolean>) => {
      if (!state.draftPermissions) return;
      state.draftPermissions.schedule.viewSchedule = action.payload;
      // Unchecking view also clears manage — UI invariant: manage ⇒ view.
      if (!action.payload) {
        state.draftPermissions.schedule.manageSchedule = false;
      }
    },
    setDraftViewScheduleScope: (
      state,
      action: PayloadAction<ScheduleScope>,
    ) => {
      if (!state.draftPermissions) return;
      state.draftPermissions.schedule.viewScheduleScope = action.payload;
    },
    setDraftManageSchedule: (state, action: PayloadAction<boolean>) => {
      if (!state.draftPermissions) return;
      state.draftPermissions.schedule.manageSchedule = action.payload;
      // Manage ⇒ view; also widen view scope to ≥ manage scope (their_own ⊂ group ⊂ company).
      if (action.payload) {
        state.draftPermissions.schedule.viewSchedule = true;
        const manageScope = state.draftPermissions.schedule.manageScheduleScope;
        const viewScope = state.draftPermissions.schedule.viewScheduleScope;
        if (SCHEDULE_SCOPE_RANK[viewScope] < SCHEDULE_SCOPE_RANK[manageScope]) {
          state.draftPermissions.schedule.viewScheduleScope = manageScope;
        }
      }
    },
    setDraftManageScheduleScope: (
      state,
      action: PayloadAction<ScheduleScope>,
    ) => {
      if (!state.draftPermissions) return;
      state.draftPermissions.schedule.manageScheduleScope = action.payload;
      // Auto-widen view scope to keep view ⊇ manage (BE RPAS containment).
      if (
        SCHEDULE_SCOPE_RANK[state.draftPermissions.schedule.viewScheduleScope] <
        SCHEDULE_SCOPE_RANK[action.payload]
      ) {
        state.draftPermissions.schedule.viewScheduleScope = action.payload;
      }
    },
    setDraftProjectsAccess: (state, action: PayloadAction<ProjectsAccess>) => {
      if (!state.draftPermissions) return;
      state.draftPermissions.projectsAccess = action.payload;
    },
    setDraftViewWhosWorking: (state, action: PayloadAction<boolean>) => {
      if (!state.draftPermissions) return;
      state.draftPermissions.company.viewWhosWorking = action.payload;
    },

    /** Commit draft as server-truth; pass the BE-confirmed payload to capture any normalization. */
    commitDraftPermissions: (
      state,
      action: PayloadAction<PermissionsSettings | undefined>,
    ) => {
      const next = action.payload ?? state.draftPermissions;
      if (!next) return;
      state.permissions = next;
      state.draftPermissions = next;
      state.mode = PermissionsCardMode.VIEW;
      state.saving = false;
      state.error = null;
    },

    cancelPermissionsEdit: (state) => {
      state.draftPermissions = state.permissions;
      state.mode = PermissionsCardMode.VIEW;
      state.error = null;
    },

    resetPermissionsState: () => initialState,
  },
});

export const {
  setPermissionsMode,
  setPermissions,
  setPermissionsLoading,
  setPermissionsSaving,
  setPermissionsError,
  setDraftRole,
  setDraftMobileTimeEntry,
  setDraftManageMyTimesheets,
  setDraftViewSchedule,
  setDraftViewScheduleScope,
  setDraftManageSchedule,
  setDraftManageScheduleScope,
  setDraftProjectsAccess,
  setDraftViewWhosWorking,
  commitDraftPermissions,
  cancelPermissionsEdit,
  resetPermissionsState,
} = permissionsSlice.actions;

// Selectors
export const selectPermissionsMode = (state: RootState) =>
  state.permissions.mode;
export const selectPermissions = (state: RootState) =>
  state.permissions.permissions;
export const selectDraftPermissions = (state: RootState) =>
  state.permissions.draftPermissions;
export const selectPermissionsLoading = (state: RootState) =>
  state.permissions.loading;
export const selectPermissionsSaving = (state: RootState) =>
  state.permissions.saving;
export const selectPermissionsError = (state: RootState) =>
  state.permissions.error;

export default permissionsSlice.reducer;
