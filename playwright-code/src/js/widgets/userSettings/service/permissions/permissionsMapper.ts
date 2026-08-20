/** Sparse-diff builder for `timeTrackingUpdateWorkerPermissions` mutation input (UI → GQL). */

import {
  TimeTracking_ProjectPermission,
  TimeTracking_ScheduleLevel,
  TimeTracking_UpdateWorkerPermissionsInput,
} from 'src/__generated__/timeTracking/graphql';
import {
  PERMISSIONS_ROLE_VALUE,
  PROJECTS_ACCESS_VALUE,
  PermissionsSettings,
  ProjectsAccess,
  SCHEDULE_SCOPE_VALUE,
  ScheduleScope,
} from '../../components/cards/PermissionsCard/constants';

const scheduleScopeToLevel = (
  scope: ScheduleScope,
): TimeTracking_ScheduleLevel => {
  switch (scope) {
    case SCHEDULE_SCOPE_VALUE.COMPANY:
      return TimeTracking_ScheduleLevel.Company;
    case SCHEDULE_SCOPE_VALUE.GROUP:
      return TimeTracking_ScheduleLevel.Group;
    case SCHEDULE_SCOPE_VALUE.THEIR_OWN:
    default:
      return TimeTracking_ScheduleLevel.Self;
  }
};

const projectAccessToPermission = (
  access: ProjectsAccess,
): TimeTracking_ProjectPermission => {
  switch (access) {
    case PROJECTS_ACCESS_VALUE.CREATE_EDIT:
      return TimeTracking_ProjectPermission.Manage;
    case PROJECTS_ACCESS_VALUE.VIEW_ONLY:
      return TimeTracking_ProjectPermission.View;
    case PROJECTS_ACCESS_VALUE.NO_ACCESS:
    default:
      return TimeTracking_ProjectPermission.None;
  }
};

interface BuildUpdateInputArgs {
  workerId: string;
  workerType: TimeTracking_UpdateWorkerPermissionsInput['workerType'];
  next: PermissionsSettings;
  /** Last server-truth permissions; used to compute the sparse diff. */
  previous: PermissionsSettings;
}

const diffBoolean = (next: boolean, prev: boolean): boolean | undefined =>
  next === prev ? undefined : next;

/** Build a sparse `TimeTracking_UpdateWorkerPermissionsInput` — only changed groups are emitted. */
export const buildUpdateWorkerPermissionsInput = ({
  workerId,
  workerType,
  next,
  previous,
}: BuildUpdateInputArgs): TimeTracking_UpdateWorkerPermissionsInput => {
  const input: TimeTracking_UpdateWorkerPermissionsInput = {
    workerId,
    workerType,
  };

  if (next.role !== previous.role) {
    input.admin = next.role === PERMISSIONS_ROLE_VALUE.TIME_ADMIN;
  }

  const mobileEnabled = diffBoolean(
    next.timesheets.mobileTimeEntry,
    previous.timesheets.mobileTimeEntry,
  );
  const whosWorkingEnabled = diffBoolean(
    next.company.viewWhosWorking,
    previous.company.viewWhosWorking,
  );
  if (mobileEnabled !== undefined || whosWorkingEnabled !== undefined) {
    input.featurePermissions = {
      ...(mobileEnabled !== undefined ? { mobileEnabled } : {}),
      ...(whosWorkingEnabled !== undefined ? { whosWorkingEnabled } : {}),
    };
  }

  const manageMyTimesheets = diffBoolean(
    next.timesheets.manageMyTimesheets,
    previous.timesheets.manageMyTimesheets,
  );
  if (manageMyTimesheets !== undefined) {
    input.managementPermissions = { manageMyTimesheets };
  }

  const desiredViewLevel = next.schedule.viewSchedule
    ? scheduleScopeToLevel(next.schedule.viewScheduleScope)
    : TimeTracking_ScheduleLevel.None;
  const previousViewLevel = previous.schedule.viewSchedule
    ? scheduleScopeToLevel(previous.schedule.viewScheduleScope)
    : TimeTracking_ScheduleLevel.None;
  const desiredManageLevel = next.schedule.manageSchedule
    ? scheduleScopeToLevel(next.schedule.manageScheduleScope)
    : TimeTracking_ScheduleLevel.None;
  const previousManageLevel = previous.schedule.manageSchedule
    ? scheduleScopeToLevel(previous.schedule.manageScheduleScope)
    : TimeTracking_ScheduleLevel.None;

  if (
    desiredViewLevel !== previousViewLevel ||
    desiredManageLevel !== previousManageLevel
  ) {
    input.schedulePermissions = {
      ...(desiredViewLevel !== previousViewLevel
        ? { viewLevel: desiredViewLevel }
        : {}),
      ...(desiredManageLevel !== previousManageLevel
        ? { manageLevel: desiredManageLevel }
        : {}),
    };
  }

  if (next.projectsAccess !== previous.projectsAccess) {
    input.projectPermission = projectAccessToPermission(next.projectsAccess);
  }

  return input;
};
