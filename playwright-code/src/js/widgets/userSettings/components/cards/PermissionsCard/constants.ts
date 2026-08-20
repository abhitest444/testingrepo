/** Permissions card constants — view-model shapes + NLS ids; message ids live in `userSettings.json`. */

export type PermissionsRole = 'worker' | 'time_admin';

export type ScheduleScope = 'their_own' | 'group' | 'company';

export type ProjectsAccess = 'no_access' | 'view_only' | 'create_edit';

export type WhosWorkingScope = 'all_workers';

export interface PermissionsTimesheets {
  mobileTimeEntry: boolean;
  manageMyTimesheets: boolean;
}

export interface PermissionsSchedule {
  viewSchedule: boolean;
  viewScheduleScope: ScheduleScope;
  manageSchedule: boolean;
  manageScheduleScope: ScheduleScope;
}

export interface PermissionsCompany {
  viewWhosWorking: boolean;
  viewWhosWorkingScope: WhosWorkingScope;
}

export interface PermissionsSettings {
  role: PermissionsRole;
  timesheets: PermissionsTimesheets;
  schedule: PermissionsSchedule;
  projectsAccess: ProjectsAccess;
  company: PermissionsCompany;
}

export const PERMISSIONS_ROLE_VALUE = {
  WORKER: 'worker',
  TIME_ADMIN: 'time_admin',
} as const;

export const SCHEDULE_SCOPE_VALUE = {
  THEIR_OWN: 'their_own',
  GROUP: 'group',
  COMPANY: 'company',
} as const;

export const PROJECTS_ACCESS_VALUE = {
  NO_ACCESS: 'no_access',
  VIEW_ONLY: 'view_only',
  CREATE_EDIT: 'create_edit',
} as const;

export const WHOS_WORKING_SCOPE_VALUE = {
  ALL_WORKERS: 'all_workers',
} as const;

export const PERMISSIONS_ROLE_OPTIONS: PermissionsRole[] = [
  PERMISSIONS_ROLE_VALUE.WORKER,
  PERMISSIONS_ROLE_VALUE.TIME_ADMIN,
];

export const SCHEDULE_SCOPE_OPTIONS: ScheduleScope[] = [
  SCHEDULE_SCOPE_VALUE.THEIR_OWN,
  SCHEDULE_SCOPE_VALUE.GROUP,
  SCHEDULE_SCOPE_VALUE.COMPANY,
];

/** Scope containment rank (their_own ⊂ group ⊂ company); used to enforce view ⊇ manage. */
export const SCHEDULE_SCOPE_RANK: Record<ScheduleScope, number> = {
  [SCHEDULE_SCOPE_VALUE.THEIR_OWN]: 0,
  [SCHEDULE_SCOPE_VALUE.GROUP]: 1,
  [SCHEDULE_SCOPE_VALUE.COMPANY]: 2,
};

export const PROJECTS_ACCESS_OPTIONS: ProjectsAccess[] = [
  PROJECTS_ACCESS_VALUE.NO_ACCESS,
  PROJECTS_ACCESS_VALUE.VIEW_ONLY,
  PROJECTS_ACCESS_VALUE.CREATE_EDIT,
];

/** Worker edit UI — excludes Manage (`create_edit`); admins still render the full set read-only. */
export const PROJECTS_ACCESS_EDIT_OPTIONS: ProjectsAccess[] = [
  PROJECTS_ACCESS_VALUE.NO_ACCESS,
  PROJECTS_ACCESS_VALUE.VIEW_ONLY,
];

export const PERMISSIONS_CARD_NLS = {
  title: 'permissions.title',
  workforceAccess: 'permissions.workforceAccess',
  role: 'permissions.role.label',
  timesheets: 'permissions.timesheets.label',
  mobileTimeEntry: 'permissions.timesheets.mobileTimeEntry',
  manageMyTimesheets: 'permissions.timesheets.manageMyTimesheets',
  manageTimesheets: 'permissions.timesheets.manageTimesheets',
  mobileTimeEntryHelp: 'permissions.timesheets.mobileTimeEntry.help',
  manageMyTimesheetsHelp: 'permissions.timesheets.manageMyTimesheets.help',
  schedule: 'permissions.schedule.label',
  viewSchedule: 'permissions.schedule.viewSchedule',
  manageSchedule: 'permissions.schedule.manageSchedule',
  scheduleOnWithScope: 'permissions.schedule.onWithScope',
  projects: 'permissions.projects.label',
  viewProjects: 'permissions.projects.viewProjects',
  company: 'permissions.company.label',
  viewWhosWorking: 'permissions.company.viewWhosWorking',
  viewWhosWorkingAllWorkers: 'permissions.company.viewWhosWorking.allWorkers',
  viewWhosWorkingHelp: 'permissions.company.viewWhosWorking.help',
  valueOn: 'permissions.value.on',
  valueOff: 'permissions.value.off',
  errorTitle: 'permissions.error.title',
  errorLoad: 'permissions.error.load',
  errorStateMessage: 'permissions.card.error.state.message',
} as const;

export const PERMISSIONS_ROLE_NLS_ID: Record<PermissionsRole, string> = {
  [PERMISSIONS_ROLE_VALUE.WORKER]: 'permissions.role.option.worker',
  [PERMISSIONS_ROLE_VALUE.TIME_ADMIN]: 'permissions.role.option.timeAdmin',
};

export const SCHEDULE_SCOPE_NLS_ID: Record<ScheduleScope, string> = {
  [SCHEDULE_SCOPE_VALUE.THEIR_OWN]: 'permissions.schedule.scope.theirOwn',
  [SCHEDULE_SCOPE_VALUE.GROUP]: 'permissions.schedule.scope.group',
  [SCHEDULE_SCOPE_VALUE.COMPANY]: 'permissions.schedule.scope.company',
};

/** Lowercase variant used in view-mode summary copy ("On, their own"); edit uses the capitalized map. */
export const SCHEDULE_SCOPE_LOWER_NLS_ID: Record<ScheduleScope, string> = {
  [SCHEDULE_SCOPE_VALUE.THEIR_OWN]: 'permissions.schedule.scope.theirOwn.lower',
  [SCHEDULE_SCOPE_VALUE.GROUP]: 'permissions.schedule.scope.group.lower',
  [SCHEDULE_SCOPE_VALUE.COMPANY]: 'permissions.schedule.scope.company.lower',
};

export const PROJECTS_ACCESS_NLS_ID: Record<ProjectsAccess, string> = {
  [PROJECTS_ACCESS_VALUE.NO_ACCESS]: 'permissions.projects.option.noAccess',
  [PROJECTS_ACCESS_VALUE.VIEW_ONLY]: 'permissions.projects.option.viewOnly',
  [PROJECTS_ACCESS_VALUE.CREATE_EDIT]: 'permissions.projects.option.createEdit',
};
