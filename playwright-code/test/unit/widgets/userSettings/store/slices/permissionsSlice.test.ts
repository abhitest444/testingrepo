/** Tests for permissionsSlice mapper, reducers, and selectors. */

import {
  TimeTracking_ProjectPermission,
  TimeTracking_ScheduleLevel,
  TimeTracking_TimeForType,
  TimeTracking_WorkerPermissions,
} from 'src/__generated__/timeTracking/graphql';
import {
  PERMISSIONS_ROLE_VALUE,
  PROJECTS_ACCESS_VALUE,
  PermissionsSettings,
  SCHEDULE_SCOPE_VALUE,
  WHOS_WORKING_SCOPE_VALUE,
} from 'src/js/widgets/userSettings/components/cards/PermissionsCard/constants';
import { PermissionsCardMode } from 'src/js/widgets/userSettings/components/cards/PermissionsCard/types/PermissionsCard.types';
import permissionsReducer, {
  cancelPermissionsEdit,
  commitDraftPermissions,
  mapGqlToPermissionsSettings,
  resetPermissionsState,
  selectDraftPermissions,
  selectPermissions,
  selectPermissionsError,
  selectPermissionsLoading,
  selectPermissionsMode,
  selectPermissionsSaving,
  setDraftManageMyTimesheets,
  setDraftManageSchedule,
  setDraftManageScheduleScope,
  setDraftMobileTimeEntry,
  setDraftProjectsAccess,
  setDraftRole,
  setDraftViewSchedule,
  setDraftViewScheduleScope,
  setDraftViewWhosWorking,
  setPermissions,
  setPermissionsError,
  setPermissionsLoading,
  setPermissionsMode,
  setPermissionsSaving,
} from 'src/js/widgets/userSettings/store/slices/permissionsSlice';

const gqlAdminWorker: TimeTracking_WorkerPermissions = {
  __typename: 'TimeTracking_WorkerPermissions',
  workerId: 'w1',
  workerType: TimeTracking_TimeForType.Employee,
  admin: true,
  managementPermissions: {
    __typename: 'TimeTracking_ManagementPermissions',
    manageTimesheets: true,
    manageMyTimesheets: true,
    manageUsers: false,
    manageStandardFields: false,
    manageAuthorization: false,
    approveTimesheets: false,
    viewReports: false,
  },
  schedulePermissions: {
    __typename: 'TimeTracking_SchedulePermissions',
    manageLevel: TimeTracking_ScheduleLevel.Group,
    viewLevel: TimeTracking_ScheduleLevel.Company,
  },
  projectPermission: TimeTracking_ProjectPermission.Manage,
  featurePermissions: {
    __typename: 'TimeTracking_FeaturePermissions',
    mobileEnabled: true,
    whosWorkingEnabled: true,
    pinLoginEnabled: false,
    externalAccessEnabled: false,
  },
};

describe('permissionsSlice', () => {
  describe('mapGqlToPermissionsSettings', () => {
    it('projects an admin worker permissions payload into the UI view-model', () => {
      expect(mapGqlToPermissionsSettings(gqlAdminWorker)).toEqual({
        role: PERMISSIONS_ROLE_VALUE.TIME_ADMIN,
        timesheets: { mobileTimeEntry: true, manageMyTimesheets: true },
        schedule: {
          viewSchedule: true,
          viewScheduleScope: SCHEDULE_SCOPE_VALUE.COMPANY,
          manageSchedule: true,
          manageScheduleScope: SCHEDULE_SCOPE_VALUE.GROUP,
        },
        projectsAccess: PROJECTS_ACCESS_VALUE.CREATE_EDIT,
        company: {
          viewWhosWorking: true,
          viewWhosWorkingScope: WHOS_WORKING_SCOPE_VALUE.ALL_WORKERS,
        },
      });
    });

    it('maps NONE schedule levels into unchecked view/manage with default scope', () => {
      const mapped = mapGqlToPermissionsSettings({
        ...gqlAdminWorker,
        admin: false,
        schedulePermissions: {
          __typename: 'TimeTracking_SchedulePermissions',
          manageLevel: TimeTracking_ScheduleLevel.None,
          viewLevel: TimeTracking_ScheduleLevel.None,
        },
      });

      expect(mapped.role).toBe(PERMISSIONS_ROLE_VALUE.WORKER);
      expect(mapped.schedule).toEqual({
        viewSchedule: false,
        viewScheduleScope: SCHEDULE_SCOPE_VALUE.THEIR_OWN,
        manageSchedule: false,
        manageScheduleScope: SCHEDULE_SCOPE_VALUE.THEIR_OWN,
      });
    });

    it('maps SELF schedule level to their_own scope', () => {
      const mapped = mapGqlToPermissionsSettings({
        ...gqlAdminWorker,
        schedulePermissions: {
          __typename: 'TimeTracking_SchedulePermissions',
          manageLevel: TimeTracking_ScheduleLevel.Self,
          viewLevel: TimeTracking_ScheduleLevel.Self,
        },
      });

      expect(mapped.schedule.viewScheduleScope).toBe(
        SCHEDULE_SCOPE_VALUE.THEIR_OWN,
      );
      expect(mapped.schedule.manageScheduleScope).toBe(
        SCHEDULE_SCOPE_VALUE.THEIR_OWN,
      );
    });

    it('maps every project permission enum value', () => {
      expect(
        mapGqlToPermissionsSettings({
          ...gqlAdminWorker,
          projectPermission: TimeTracking_ProjectPermission.None,
        }).projectsAccess,
      ).toBe(PROJECTS_ACCESS_VALUE.NO_ACCESS);

      expect(
        mapGqlToPermissionsSettings({
          ...gqlAdminWorker,
          projectPermission: TimeTracking_ProjectPermission.View,
        }).projectsAccess,
      ).toBe(PROJECTS_ACCESS_VALUE.VIEW_ONLY);

      expect(
        mapGqlToPermissionsSettings({
          ...gqlAdminWorker,
          projectPermission: TimeTracking_ProjectPermission.Manage,
        }).projectsAccess,
      ).toBe(PROJECTS_ACCESS_VALUE.CREATE_EDIT);
    });
  });

  describe('reducer', () => {
    const basePermissions: PermissionsSettings = {
      role: PERMISSIONS_ROLE_VALUE.WORKER,
      timesheets: { mobileTimeEntry: false, manageMyTimesheets: false },
      schedule: {
        viewSchedule: true,
        viewScheduleScope: SCHEDULE_SCOPE_VALUE.THEIR_OWN,
        manageSchedule: false,
        manageScheduleScope: SCHEDULE_SCOPE_VALUE.THEIR_OWN,
      },
      projectsAccess: PROJECTS_ACCESS_VALUE.NO_ACCESS,
      company: {
        viewWhosWorking: false,
        viewWhosWorkingScope: WHOS_WORKING_SCOPE_VALUE.ALL_WORKERS,
      },
    };

    it('runs the full edit lifecycle and schedule scope invariants', () => {
      let state = permissionsReducer(undefined, { type: '@@INIT' });

      state = permissionsReducer(
        { ...state, error: 'stale' },
        setPermissionsLoading(true),
      );
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();

      state = permissionsReducer(state, setPermissions(basePermissions));
      state = permissionsReducer(
        state,
        setPermissionsMode(PermissionsCardMode.EDIT),
      );
      expect(state.mode).toBe(PermissionsCardMode.EDIT);
      expect(state.draftPermissions).toEqual(basePermissions);

      state = permissionsReducer(
        state,
        setDraftRole(PERMISSIONS_ROLE_VALUE.TIME_ADMIN),
      );
      state = permissionsReducer(state, setDraftMobileTimeEntry(true));
      state = permissionsReducer(state, setDraftManageMyTimesheets(true));
      state = permissionsReducer(
        state,
        setDraftViewScheduleScope(SCHEDULE_SCOPE_VALUE.GROUP),
      );
      state = permissionsReducer(state, setDraftManageSchedule(true));
      expect(state.draftPermissions?.schedule.viewSchedule).toBe(true);
      expect(state.draftPermissions?.schedule.viewScheduleScope).toBe(
        SCHEDULE_SCOPE_VALUE.GROUP,
      );

      state = permissionsReducer(
        state,
        setDraftManageScheduleScope(SCHEDULE_SCOPE_VALUE.COMPANY),
      );
      expect(state.draftPermissions?.schedule.viewScheduleScope).toBe(
        SCHEDULE_SCOPE_VALUE.COMPANY,
      );

      state = permissionsReducer(state, setPermissions(basePermissions));
      state = permissionsReducer(
        state,
        setPermissionsMode(PermissionsCardMode.EDIT),
      );
      state = permissionsReducer(
        state,
        setDraftManageScheduleScope(SCHEDULE_SCOPE_VALUE.GROUP),
      );
      state = permissionsReducer(state, setDraftManageSchedule(true));
      expect(state.draftPermissions?.schedule.viewScheduleScope).toBe(
        SCHEDULE_SCOPE_VALUE.GROUP,
      );

      state = permissionsReducer(
        state,
        setDraftViewScheduleScope(SCHEDULE_SCOPE_VALUE.COMPANY),
      );
      state = permissionsReducer(state, setDraftManageSchedule(true));
      expect(state.draftPermissions?.schedule.viewScheduleScope).toBe(
        SCHEDULE_SCOPE_VALUE.COMPANY,
      );

      state = permissionsReducer(
        state,
        setDraftViewScheduleScope(SCHEDULE_SCOPE_VALUE.THEIR_OWN),
      );
      state = permissionsReducer(state, setDraftManageSchedule(false));
      state = permissionsReducer(state, setDraftManageSchedule(true));
      expect(state.draftPermissions?.schedule.viewScheduleScope).toBe(
        SCHEDULE_SCOPE_VALUE.GROUP,
      );

      state = permissionsReducer(state, setDraftViewSchedule(false));
      expect(state.draftPermissions?.schedule.manageSchedule).toBe(false);

      state = permissionsReducer(
        state,
        setDraftProjectsAccess(PROJECTS_ACCESS_VALUE.VIEW_ONLY),
      );
      state = permissionsReducer(state, setDraftViewWhosWorking(true));
      state = permissionsReducer(state, setPermissionsSaving(true));
      expect(state.saving).toBe(true);

      const committed = state.draftPermissions!;
      state = permissionsReducer(state, commitDraftPermissions(committed));
      expect(state.mode).toBe(PermissionsCardMode.VIEW);
      expect(state.permissions).toEqual(committed);
      expect(state.saving).toBe(false);

      state = permissionsReducer(
        { ...state, mode: PermissionsCardMode.EDIT, error: 'edit-error' },
        cancelPermissionsEdit(),
      );
      expect(state.mode).toBe(PermissionsCardMode.VIEW);
      expect(state.draftPermissions).toEqual(committed);
      expect(state.error).toBeNull();

      state = permissionsReducer(state, setPermissionsError('load failed'));
      expect(state.error).toBe('load failed');
      expect(state.loading).toBe(false);
      expect(state.saving).toBe(false);

      expect(permissionsReducer(state, resetPermissionsState())).toEqual({
        mode: PermissionsCardMode.VIEW,
        permissions: null,
        draftPermissions: null,
        loading: false,
        saving: false,
        error: null,
      });
    });

    it('no-ops draft mutators and commit when draft is null', () => {
      let state = permissionsReducer(undefined, { type: '@@INIT' });

      state = permissionsReducer(
        state,
        setDraftRole(PERMISSIONS_ROLE_VALUE.TIME_ADMIN),
      );
      state = permissionsReducer(state, setDraftMobileTimeEntry(true));
      state = permissionsReducer(state, setDraftManageMyTimesheets(true));
      state = permissionsReducer(state, setDraftViewSchedule(true));
      state = permissionsReducer(
        state,
        setDraftViewScheduleScope(SCHEDULE_SCOPE_VALUE.GROUP),
      );
      state = permissionsReducer(state, setDraftManageSchedule(true));
      state = permissionsReducer(
        state,
        setDraftManageScheduleScope(SCHEDULE_SCOPE_VALUE.GROUP),
      );
      state = permissionsReducer(
        state,
        setDraftProjectsAccess(PROJECTS_ACCESS_VALUE.CREATE_EDIT),
      );
      state = permissionsReducer(state, setDraftViewWhosWorking(true));
      state = permissionsReducer(state, commitDraftPermissions());

      expect(state.draftPermissions).toBeNull();
      expect(state.permissions).toBeNull();
    });

    it('commits draft without payload using current draft', () => {
      let state = permissionsReducer(
        undefined,
        setPermissions(basePermissions),
      );
      state = permissionsReducer(
        state,
        setPermissionsMode(PermissionsCardMode.EDIT),
      );
      state = permissionsReducer(
        state,
        setDraftRole(PERMISSIONS_ROLE_VALUE.TIME_ADMIN),
      );

      state = permissionsReducer(state, commitDraftPermissions());
      expect(state.permissions?.role).toBe(PERMISSIONS_ROLE_VALUE.TIME_ADMIN);
      expect(state.mode).toBe(PermissionsCardMode.VIEW);
    });
  });

  describe('selectors', () => {
    const rootState = {
      permissions: {
        mode: PermissionsCardMode.EDIT,
        permissions: null,
        draftPermissions: null,
        loading: true,
        saving: false,
        error: 'err',
      },
    } as any;

    it('reads slice fields from root state', () => {
      expect(selectPermissionsMode(rootState)).toBe(PermissionsCardMode.EDIT);
      expect(selectPermissions(rootState)).toBeNull();
      expect(selectDraftPermissions(rootState)).toBeNull();
      expect(selectPermissionsLoading(rootState)).toBe(true);
      expect(selectPermissionsSaving(rootState)).toBe(false);
      expect(selectPermissionsError(rootState)).toBe('err');
    });
  });
});
