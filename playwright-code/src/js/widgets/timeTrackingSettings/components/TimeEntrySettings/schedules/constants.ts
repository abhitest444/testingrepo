/**
 * Schedule settings option keys and NLS ids.
 * View/edit values come from employer settings;
 * literals here are for options and labels only.
 */

/** Payroll `SettingsSection` `mode` prop — avoid magic strings at call sites */
export const PAYROLL_SETTINGS_SECTION_MODE = {
  VIEW: 'VIEW',
  EDIT: 'EDIT',
} as const;

/** Single source for preference literals used in rules, utils, and tests */
export const SCHEDULE_VIEW_VALUE = {
  THEIR_OWN: 'their_own',
  GROUP: 'group',
  COMPANY: 'company',
} as const;

export const SCHEDULE_MANAGE_VALUE = {
  NONE: 'none',
  THEIR_OWN: 'their_own',
  GROUP: 'group',
  COMPANY: 'company',
} as const;

const SCHEDULE_OPTION_LABEL_IDS = {
  none: 'time-entries.section.title.schedules.option.none',
  their_own: 'time-entries.section.title.schedules.option.their_own',
  group: 'time-entries.section.title.schedules.option.group',
  company: 'time-entries.section.title.schedules.option.company',
} as const;

export type ScheduleViewPreference = 'their_own' | 'group' | 'company';

export type ScheduleManagePreference =
  | 'none'
  | 'their_own'
  | 'group'
  | 'company';

export const SCHEDULE_VIEW_OPTIONS: ScheduleViewPreference[] = [
  SCHEDULE_VIEW_VALUE.THEIR_OWN,
  SCHEDULE_VIEW_VALUE.GROUP,
  SCHEDULE_VIEW_VALUE.COMPANY,
];

export const SCHEDULE_MANAGE_OPTIONS: ScheduleManagePreference[] = [
  SCHEDULE_MANAGE_VALUE.NONE,
  SCHEDULE_MANAGE_VALUE.THEIR_OWN,
  SCHEDULE_MANAGE_VALUE.GROUP,
  SCHEDULE_MANAGE_VALUE.COMPANY,
];

export const SCHEDULE_VIEW_PREFERENCE_MESSAGE_IDS: Record<
  ScheduleViewPreference,
  string
> = {
  [SCHEDULE_VIEW_VALUE.THEIR_OWN]: SCHEDULE_OPTION_LABEL_IDS.their_own,
  [SCHEDULE_VIEW_VALUE.GROUP]: SCHEDULE_OPTION_LABEL_IDS.group,
  [SCHEDULE_VIEW_VALUE.COMPANY]: SCHEDULE_OPTION_LABEL_IDS.company,
};

export const SCHEDULE_MANAGE_PREFERENCE_MESSAGE_IDS: Record<
  ScheduleManagePreference,
  string
> = {
  [SCHEDULE_MANAGE_VALUE.NONE]: SCHEDULE_OPTION_LABEL_IDS.none,
  [SCHEDULE_MANAGE_VALUE.THEIR_OWN]: SCHEDULE_OPTION_LABEL_IDS.their_own,
  [SCHEDULE_MANAGE_VALUE.GROUP]: SCHEDULE_OPTION_LABEL_IDS.group,
  [SCHEDULE_MANAGE_VALUE.COMPANY]: SCHEDULE_OPTION_LABEL_IDS.company,
};
