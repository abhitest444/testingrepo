import dayjs from 'dayjs';
import { FUNCTIONALITY_NAMES } from '../../../constants';

// ==========================================
// Approvals Feature - Constants
// ==========================================

/**
 * Functionality names for the approvals feature
 */
export const APPROVALS_FUNCTIONALITY = {
  SUBMIT_TIME_PANEL: FUNCTIONALITY_NAMES.SUBMIT_TIME_PANEL,
} as const;
/**
 * Default panel configuration
 */
export const SUBMIT_TIME_PANEL_DEFAULTS = {
  TITLE: 'Submit time',
} as const;

const ISO_DATE_FORMAT = 'YYYY-MM-DD';

export const SUCCESS_TOAST_CLOSE_DELAY_MS = 1000;

export const formatHoursMinutes = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
};

export const getWeekEndDateIso = (
  isoDate: string,
  weekStartDay: number,
): string => {
  const selectedDate = dayjs(isoDate).startOf('day');
  const dayOfWeek = selectedDate.day(); // 0=Sun...6=Sat
  const startOffset = (dayOfWeek - weekStartDay + 7) % 7;
  return selectedDate
    .subtract(startOffset, 'day')
    .add(6, 'day')
    .format(ISO_DATE_FORMAT);
};
