import {
  SCHEDULE_MANAGE_VALUE,
  SCHEDULE_VIEW_VALUE,
  type ScheduleManagePreference,
  type ScheduleViewPreference,
} from './constants';

/** View options disabled based on "Manage schedule" (Tsheets parity; API wiring later). */
export function getIsViewOptionDisabled(
  option: ScheduleViewPreference,
  manage: ScheduleManagePreference,
): boolean {
  if (
    manage === SCHEDULE_MANAGE_VALUE.NONE ||
    manage === SCHEDULE_MANAGE_VALUE.THEIR_OWN
  ) {
    return false;
  }
  if (manage === SCHEDULE_MANAGE_VALUE.GROUP) {
    return option === SCHEDULE_VIEW_VALUE.THEIR_OWN;
  }
  return option !== SCHEDULE_VIEW_VALUE.COMPANY;
}

/** Keeps view selection valid when manage level changes. */
export function coerceViewForManage(
  view: ScheduleViewPreference,
  manage: ScheduleManagePreference,
): ScheduleViewPreference {
  if (manage === SCHEDULE_MANAGE_VALUE.COMPANY) {
    return SCHEDULE_VIEW_VALUE.COMPANY;
  }
  if (
    manage === SCHEDULE_MANAGE_VALUE.GROUP &&
    view === SCHEDULE_VIEW_VALUE.THEIR_OWN
  ) {
    return SCHEDULE_VIEW_VALUE.GROUP;
  }
  return view;
}
