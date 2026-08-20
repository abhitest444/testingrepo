import moment from 'moment';

export enum DueDateFilterType {
  TODAY = 'TODAY',
  YESTERDAY = 'YESTERDAY',
  THIS_WEEK = 'THIS_WEEK',
  THIS_MONTH = 'THIS_MONTH',
  THIS_YEAR = 'THIS_YEAR',
  NEXT_WEEK = 'NEXT_WEEK',
  NEXT_THIRTY_DAYS = 'NEXT_THIRTY_DAYS',
  NEXT_MONTH = 'NEXT_MONTH',
  LAST_WEEK = 'LAST_WEEK',
  LAST_THIRTY_DAYS = 'LAST_THIRTY_DAYS',
  LAST_MONTH = 'LAST_MONTH',
  CUSTOM_RANGE = 'CUSTOM_RANGE',
}

export interface DueDateRange {
  filterType: DueDateFilterType;
  fromDate: string;
  toDate: string;
}

export const DATE_RANGE_MONTHS_LIMIT = 36;
export const DATE_DISPLAY_FORMAT = 'MM/DD/YYYY';

const MOMENT_DAY = 'day';
const MOMENT_WEEK = 'week';
const MOMENT_MONTH = 'month';
const MOMENT_YEAR = 'year';

export function getFilterDateRange(
  filterType: DueDateFilterType,
): DueDateRange {
  const fromDate = moment();
  const toDate = moment();

  switch (filterType) {
    case DueDateFilterType.TODAY:
      break;
    case DueDateFilterType.YESTERDAY:
      fromDate.subtract(1, MOMENT_DAY);
      toDate.subtract(1, MOMENT_DAY);
      break;
    case DueDateFilterType.THIS_WEEK:
      fromDate.startOf(MOMENT_WEEK);
      toDate.endOf(MOMENT_WEEK);
      break;
    case DueDateFilterType.THIS_MONTH:
      fromDate.startOf(MOMENT_MONTH);
      toDate.endOf(MOMENT_MONTH);
      break;
    case DueDateFilterType.THIS_YEAR:
      fromDate.startOf(MOMENT_YEAR);
      toDate.endOf(MOMENT_YEAR);
      break;
    case DueDateFilterType.NEXT_WEEK:
      fromDate.add(7, MOMENT_DAY).startOf(MOMENT_WEEK);
      toDate.add(7, MOMENT_DAY).endOf(MOMENT_WEEK);
      break;
    case DueDateFilterType.NEXT_THIRTY_DAYS:
      toDate.add(30, MOMENT_DAY);
      break;
    case DueDateFilterType.NEXT_MONTH:
      fromDate.add(1, MOMENT_MONTH).startOf(MOMENT_MONTH);
      toDate.add(1, MOMENT_MONTH).endOf(MOMENT_MONTH);
      break;
    case DueDateFilterType.LAST_WEEK:
      fromDate.subtract(7, MOMENT_DAY).startOf(MOMENT_WEEK);
      toDate.subtract(7, MOMENT_DAY).endOf(MOMENT_WEEK);
      break;
    case DueDateFilterType.LAST_THIRTY_DAYS:
      fromDate.subtract(30, MOMENT_DAY);
      break;
    case DueDateFilterType.LAST_MONTH:
      fromDate.subtract(1, MOMENT_MONTH).startOf(MOMENT_MONTH);
      toDate.subtract(1, MOMENT_MONTH).endOf(MOMENT_MONTH);
      break;
    case DueDateFilterType.CUSTOM_RANGE:
      fromDate.subtract(3, MOMENT_MONTH);
      toDate.add(9, MOMENT_MONTH);
      break;
    default:
      break;
  }

  return {
    filterType,
    fromDate: fromDate.format('YYYY-MM-DD'),
    toDate: toDate.format('YYYY-MM-DD'),
  };
}

export function getCustomDateRange(
  startDate: string,
  endDate: string,
): DueDateRange {
  return {
    filterType: DueDateFilterType.CUSTOM_RANGE,
    fromDate: startDate,
    toDate: endDate,
  };
}

export function isInvalidDateRange(
  fromDate?: string,
  toDate?: string,
): boolean {
  if (!fromDate || !toDate) return true;
  const from = moment(fromDate, 'YYYY-MM-DD', true);
  const to = moment(toDate, 'YYYY-MM-DD', true);
  if (!from.isValid() || !to.isValid()) return true;
  return from.isAfter(to);
}

/**
 * Returns true when the given `dueDateRange` represents the baseline
 * (i.e. "no additional filtering") for the current user type.
 *
 * - Non-accountant / non-Workflow paths: baseline is no due-date filter (null).
 * - QBOA accountants on the Workflow path: baseline is CUSTOM_RANGE.
 *   The specific fromDate/toDate are intentionally NOT compared here because
 *   they are relative to "today" and would drift across sessions. The filter
 *   type alone captures the user's intent.
 */
export function isDefaultDueDateRangeForUser(
  dueDateRange: DueDateRange | null | undefined,
  isWorkflowApiEnabled: boolean,
  isAccountant: boolean,
): boolean {
  if (!isWorkflowApiEnabled || !isAccountant) {
    return !dueDateRange;
  }
  return (
    !dueDateRange || dueDateRange.filterType === DueDateFilterType.CUSTOM_RANGE
  );
}

export const DUE_DATE_FILTER_OPTIONS: {
  value: DueDateFilterType;
  nlsKey: string;
}[] = [
  {
    value: DueDateFilterType.CUSTOM_RANGE,
    nlsKey: 'timeProject.filter.dueDate.customRange',
  },
  {
    value: DueDateFilterType.TODAY,
    nlsKey: 'timeProject.filter.dueDate.today',
  },
  {
    value: DueDateFilterType.YESTERDAY,
    nlsKey: 'timeProject.filter.dueDate.yesterday',
  },
  {
    value: DueDateFilterType.THIS_WEEK,
    nlsKey: 'timeProject.filter.dueDate.thisWeek',
  },
  {
    value: DueDateFilterType.THIS_MONTH,
    nlsKey: 'timeProject.filter.dueDate.thisMonth',
  },
  {
    value: DueDateFilterType.THIS_YEAR,
    nlsKey: 'timeProject.filter.dueDate.thisYear',
  },
  {
    value: DueDateFilterType.NEXT_WEEK,
    nlsKey: 'timeProject.filter.dueDate.nextWeek',
  },
  {
    value: DueDateFilterType.NEXT_THIRTY_DAYS,
    nlsKey: 'timeProject.filter.dueDate.nextThirtyDays',
  },
  {
    value: DueDateFilterType.NEXT_MONTH,
    nlsKey: 'timeProject.filter.dueDate.nextMonth',
  },
  {
    value: DueDateFilterType.LAST_WEEK,
    nlsKey: 'timeProject.filter.dueDate.lastWeek',
  },
  {
    value: DueDateFilterType.LAST_THIRTY_DAYS,
    nlsKey: 'timeProject.filter.dueDate.lastThirtyDays',
  },
  {
    value: DueDateFilterType.LAST_MONTH,
    nlsKey: 'timeProject.filter.dueDate.lastMonth',
  },
];
