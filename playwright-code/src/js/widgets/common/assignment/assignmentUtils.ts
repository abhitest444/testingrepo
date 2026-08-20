import { TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS } from 'src/js/widgets/timeTrackingSettings/constants';

/**
 * Assignment status enum
 */
export enum AssignmentStatus {
  ALL = 'all',
  NONE = 'none',
  PARTIAL = 'partial',
}

/**
 * Assignment display result
 */
export interface AssignmentDisplayResult {
  status: AssignmentStatus;
  text: string;
}

/**
 * Intl interface for formatting messages
 */
export interface IntlFormatter {
  formatMessage: (
    descriptor: { id: string },
    values?: Record<string, any>,
  ) => string;
}

/**
 * Gets the assignment display text based on assignment count and total count
 *
 * @param assignmentCount - Number of items assigned
 * @param totalCount - Total number of items available
 * @param intl - Internationalization formatter for formatting messages
 * @returns Assignment display result with status and text
 */
export const getAssignmentDisplayText = (
  assignmentCount: number,
  totalCount: number,
  intl: IntlFormatter,
): AssignmentDisplayResult => {
  // All assigned (including cases where assignmentCount exceeds totalCount)
  if (assignmentCount >= totalCount && totalCount > 0) {
    return {
      status: AssignmentStatus.ALL,
      text: intl.formatMessage({ id: 'assignments.status.all' }),
    };
  }

  // Partial assignment
  if (assignmentCount > 0 && assignmentCount < totalCount) {
    return {
      status: AssignmentStatus.PARTIAL,
      text: intl.formatMessage(
        { id: 'assignments.status.partial' },
        { count: assignmentCount, total: totalCount },
      ),
    };
  }

  // None assigned (default case)
  return {
    status: AssignmentStatus.NONE,
    text: intl.formatMessage({ id: 'assignments.status.none' }),
  };
};

/**
 * Maps time sheet field keys to their corresponding assignment labels
 * Returns null for fields that should not show assignment data
 *
 * @param fieldKey - The time sheet field key constant
 * @returns The assignment label string or null if no mapping exists
 */
export const getFieldAssignmentLabel = (fieldKey: string): string | null => {
  const fieldLabelMap: Record<string, string> = {
    [TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED]:
      'BILLABLE',
    [TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.BILLING_RATE_FOR_TIME_ENABLED]:
      'BILLABLE_RATE',
    [TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_SERVICE_ENABLE]: 'SERVICE_ITEM',
    [TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES]: 'CLASS',
    [TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.LOCATION_FOR_TIMESHEET_ENABLED]:
      'LOCATION',
  };

  return fieldLabelMap[fieldKey] ?? null;
};
