/** Tests for `buildUpdateWorkerPermissionsInput` (sparse-diff builder). Forward mapper is tested in `permissionsSlice.test.ts`. */

import {
  TimeTracking_ProjectPermission,
  TimeTracking_ScheduleLevel,
  TimeTracking_TimeForType,
} from 'src/__generated__/timeTracking/graphql';
import {
  PERMISSIONS_ROLE_VALUE,
  PROJECTS_ACCESS_VALUE,
  PermissionsSettings,
  SCHEDULE_SCOPE_VALUE,
  WHOS_WORKING_SCOPE_VALUE,
} from 'src/js/widgets/userSettings/components/cards/PermissionsCard/constants';
import { buildUpdateWorkerPermissionsInput } from 'src/js/widgets/userSettings/service/permissions/permissionsMapper';

const baseUiPermissions: PermissionsSettings = {
  role: PERMISSIONS_ROLE_VALUE.WORKER,
  timesheets: { mobileTimeEntry: false, manageMyTimesheets: false },
  schedule: {
    viewSchedule: false,
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

describe('buildUpdateWorkerPermissionsInput', () => {
  const baseArgs = {
    workerId: 'w1',
    workerType: TimeTracking_TimeForType.Employee,
  };

  it('emits only identifying fields when nothing changed', () => {
    const input = buildUpdateWorkerPermissionsInput({
      ...baseArgs,
      next: baseUiPermissions,
      previous: baseUiPermissions,
    });
    expect(input).toEqual({
      workerId: 'w1',
      workerType: TimeTracking_TimeForType.Employee,
    });
  });

  it('sets admin=true when role flips to time_admin', () => {
    const input = buildUpdateWorkerPermissionsInput({
      ...baseArgs,
      next: { ...baseUiPermissions, role: PERMISSIONS_ROLE_VALUE.TIME_ADMIN },
      previous: baseUiPermissions,
    });
    expect(input.admin).toBe(true);
    expect(input.managementPermissions).toBeUndefined();
  });

  it('sets admin=false when role flips from time_admin to worker', () => {
    const input = buildUpdateWorkerPermissionsInput({
      ...baseArgs,
      next: baseUiPermissions,
      previous: {
        ...baseUiPermissions,
        role: PERMISSIONS_ROLE_VALUE.TIME_ADMIN,
      },
    });
    expect(input.admin).toBe(false);
  });

  it('emits featurePermissions only when feature axis changed', () => {
    const input = buildUpdateWorkerPermissionsInput({
      ...baseArgs,
      next: {
        ...baseUiPermissions,
        timesheets: { mobileTimeEntry: true, manageMyTimesheets: false },
        company: {
          viewWhosWorking: true,
          viewWhosWorkingScope: WHOS_WORKING_SCOPE_VALUE.ALL_WORKERS,
        },
      },
      previous: baseUiPermissions,
    });
    expect(input.featurePermissions).toEqual({
      mobileEnabled: true,
      whosWorkingEnabled: true,
    });
    expect(input.managementPermissions).toBeUndefined();
    expect(input.schedulePermissions).toBeUndefined();
  });

  it('emits managementPermissions only for manageMyTimesheets diffs', () => {
    const input = buildUpdateWorkerPermissionsInput({
      ...baseArgs,
      next: {
        ...baseUiPermissions,
        timesheets: { mobileTimeEntry: false, manageMyTimesheets: true },
      },
      previous: baseUiPermissions,
    });
    expect(input.managementPermissions).toEqual({ manageMyTimesheets: true });
  });

  it('translates schedule view checkbox + scope into TimeTracking_ScheduleLevel', () => {
    const input = buildUpdateWorkerPermissionsInput({
      ...baseArgs,
      next: {
        ...baseUiPermissions,
        schedule: {
          ...baseUiPermissions.schedule,
          viewSchedule: true,
          viewScheduleScope: SCHEDULE_SCOPE_VALUE.GROUP,
        },
      },
      previous: baseUiPermissions,
    });
    expect(input.schedulePermissions).toEqual({
      viewLevel: TimeTracking_ScheduleLevel.Group,
    });
  });

  it('emits NONE for an unchecked view-schedule that was previously SELF', () => {
    const input = buildUpdateWorkerPermissionsInput({
      ...baseArgs,
      next: {
        ...baseUiPermissions,
        schedule: {
          ...baseUiPermissions.schedule,
          viewSchedule: false,
          viewScheduleScope: SCHEDULE_SCOPE_VALUE.THEIR_OWN,
        },
      },
      previous: {
        ...baseUiPermissions,
        schedule: {
          ...baseUiPermissions.schedule,
          viewSchedule: true,
          viewScheduleScope: SCHEDULE_SCOPE_VALUE.THEIR_OWN,
        },
      },
    });
    expect(input.schedulePermissions).toEqual({
      viewLevel: TimeTracking_ScheduleLevel.None,
    });
  });

  it('emits projectPermission only when projects axis changed', () => {
    const input = buildUpdateWorkerPermissionsInput({
      ...baseArgs,
      next: {
        ...baseUiPermissions,
        projectsAccess: PROJECTS_ACCESS_VALUE.VIEW_ONLY,
      },
      previous: baseUiPermissions,
    });
    expect(input.projectPermission).toBe(TimeTracking_ProjectPermission.View);

    const revokeAccess = buildUpdateWorkerPermissionsInput({
      ...baseArgs,
      next: baseUiPermissions,
      previous: {
        ...baseUiPermissions,
        projectsAccess: PROJECTS_ACCESS_VALUE.VIEW_ONLY,
      },
    });
    expect(revokeAccess.projectPermission).toBe(
      TimeTracking_ProjectPermission.None,
    );

    const noChange = buildUpdateWorkerPermissionsInput({
      ...baseArgs,
      next: baseUiPermissions,
      previous: baseUiPermissions,
    });
    expect(noChange.projectPermission).toBeUndefined();
  });

  it('emits manageLevel only when manage schedule changes', () => {
    const input = buildUpdateWorkerPermissionsInput({
      ...baseArgs,
      next: {
        ...baseUiPermissions,
        schedule: {
          viewSchedule: true,
          viewScheduleScope: SCHEDULE_SCOPE_VALUE.THEIR_OWN,
          manageSchedule: true,
          manageScheduleScope: SCHEDULE_SCOPE_VALUE.GROUP,
        },
      },
      previous: {
        ...baseUiPermissions,
        schedule: {
          viewSchedule: true,
          viewScheduleScope: SCHEDULE_SCOPE_VALUE.THEIR_OWN,
          manageSchedule: false,
          manageScheduleScope: SCHEDULE_SCOPE_VALUE.THEIR_OWN,
        },
      },
    });
    expect(input.schedulePermissions).toEqual({
      manageLevel: TimeTracking_ScheduleLevel.Group,
    });
  });

  it('combines multiple axes into one sparse input', () => {
    const input = buildUpdateWorkerPermissionsInput({
      ...baseArgs,
      next: {
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
      },
      previous: baseUiPermissions,
    });

    expect(input).toEqual({
      workerId: 'w1',
      workerType: TimeTracking_TimeForType.Employee,
      admin: true,
      featurePermissions: { mobileEnabled: true, whosWorkingEnabled: true },
      managementPermissions: { manageMyTimesheets: true },
      schedulePermissions: {
        viewLevel: TimeTracking_ScheduleLevel.Company,
        manageLevel: TimeTracking_ScheduleLevel.Group,
      },
      projectPermission: TimeTracking_ProjectPermission.Manage,
    });
  });
});
