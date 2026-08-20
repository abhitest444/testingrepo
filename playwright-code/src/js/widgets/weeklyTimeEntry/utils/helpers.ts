import dayjs, { Dayjs } from 'dayjs';
import { QuickbooksOnlineSandbox } from '@appfabric/sandbox-spec';
import { DataAccess_ContactType } from 'src/__generated__/oigql/graphql';
import { Sandbox } from 'src/js/common/sandbox';
import { UxPreferenceHideWeekdaysData } from '../../../service/utils/useUXPreferences';
import { HeaderData, CellData } from '../types';
import type {
  TimesheetRow,
  timeEntryDetails,
} from '../store/timeEntryGridSlice';
import type { Week } from '../hooks/useCombinedDataFetching';
import {
  WEEKLY_TIME_ENTRY_DECIMAL_PATTERN,
  WEEKLY_TIME_ENTRY_DURATION_PATTERN,
} from './constants';

/**
 * Maps day index to weekday name based on firstDayOfWeek setting
 * @param dayIndex - Index of the day in the week (0-6)
 * @param firstDayOfWeek - The first day of the week (0 = Sunday, 1 = Monday, etc.)
 * @returns Weekday name as string
 */

/**
 * Updates the weekdaysWithData object based on the day of week
 * @param dayOfWeek - Day of week (0 = Sunday, 1 = Monday, etc.)
 * @param weekdaysWithData - Object containing weekday flags to update
 */
export const updateWeekdayDataFlag = (
  dayOfWeek: number,
  weekdaysWithData: {
    hasSundayData: boolean;
    hasMondayData: boolean;
    hasTuesdayData: boolean;
    hasWednesdayData: boolean;
    hasThursdayData: boolean;
    hasFridayData: boolean;
    hasSaturdayData: boolean;
  },
): void => {
  switch (dayOfWeek) {
    case 0: // Sunday
      weekdaysWithData.hasSundayData = true;
      break;
    case 1: // Monday
      weekdaysWithData.hasMondayData = true;
      break;
    case 2: // Tuesday
      weekdaysWithData.hasTuesdayData = true;
      break;
    case 3: // Wednesday
      weekdaysWithData.hasWednesdayData = true;
      break;
    case 4: // Thursday
      weekdaysWithData.hasThursdayData = true;
      break;
    case 5: // Friday
      weekdaysWithData.hasFridayData = true;
      break;
    case 6: // Saturday
      weekdaysWithData.hasSaturdayData = true;
      break;
    default:
      // Invalid weekday, ignore
      break;
  }
};

/**
 * Determines which days of the week should be visible based on UX preferences
 * @param hideWeekdays - UX preference data for hiding weekdays
 * @param firstDayOfWeek - The first day of the week (0 = Sunday, 1 = Monday, etc.)
 * @returns Array of day indices that should be visible (0-6)
 */
export const getVisibleDaysFromPreferences = (
  hideWeekdays: UxPreferenceHideWeekdaysData,
  firstDayOfWeek: number,
): number[] => {
  const dayVisibility = [
    !hideWeekdays.isSundayHidden,
    !hideWeekdays.isMondayHidden,
    !hideWeekdays.isTuesdayHidden,
    !hideWeekdays.isWednesdayHidden,
    !hideWeekdays.isThursdayHidden,
    !hideWeekdays.isFridayHidden,
    !hideWeekdays.isSaturdayHidden,
  ];

  // Rotate the visibility array based on firstDayOfWeek
  const rotatedVisibility = [
    ...dayVisibility.slice(firstDayOfWeek),
    ...dayVisibility.slice(0, firstDayOfWeek),
  ];

  // Return indices of visible days
  return rotatedVisibility
    .map((isVisible, index) => ({ isVisible, index }))
    .filter(({ isVisible }) => isVisible)
    .map(({ index }) => index);
};

/**
 * Checks if at least one weekday is selected/enabled
 * @param weekdays - Object containing weekday enabled states
 * @returns Boolean indicating if at least one weekday is selected
 */
export const hasAtLeastOneWeekdaySelected = (weekdays: any): boolean =>
  Object.values(weekdays).some((enabled: any) => enabled);

/**
 * Generates cell style object with width and height
 * @param width - Cell width in pixels
 * @param height - Cell height in pixels
 * @returns Style object with width and height
 */
export const getCellStyle = (width: number = 94.43, height: number = 40) => ({
  width: `${width}px`,
  height: `${height}px`,
});

/**
 * Generates duration value in hh:mm format
 * @param value - Decimal value for hours
 */
const getDurationInHHMMFormat = (value: number): string => {
  const hours = Math.floor(value);
  const minutes = Math.round((value - hours) * 60);
  return minutes < 10 ? `${hours}:0${minutes}` : `${hours}:${minutes}`;
};

/**
 * Generates duration value in hours
 * @param value - Any string value
 * @returns Positive decimal number denoting hours in case of valid input (hh:mm format or decimal number)
 * @returns -1 if input is invalid
 */
export const getFormattedCellHours = (value: string): number => {
  let hours: number;

  // Handle empty string - return 0
  if (value.trim() === '') {
    return 0;
  }

  // Check if value is in duration format (hh:mm)
  const durationMatch = value.match(WEEKLY_TIME_ENTRY_DURATION_PATTERN);

  if (durationMatch) {
    // Parse duration format
    const hoursFromDuration = parseInt(durationMatch[1], 10);
    const minutes = parseInt(durationMatch[2], 10);

    // Validate minutes are within 0-59 range
    if (minutes > 59) {
      return -1; // Don't update if invalid minutes
    }

    // Convert to decimal hours
    hours = hoursFromDuration + minutes / 60;
  } else {
    // Check for minutes-only format (e.g., ":15" should become "00:15")
    const minutesOnlyMatch = value.match(/^:(\d{1,2})$/);
    if (minutesOnlyMatch) {
      const minutes = parseInt(minutesOnlyMatch[1], 10);

      // Validate minutes are within 0-59 range
      if (minutes > 59) {
        return -1; // Don't update if invalid minutes
      }

      // Convert to decimal hours (0 hours + minutes)
      hours = minutes / 60;
    } else {
      // Validate numeric format first (only digits, decimal point, and optional minus sign)
      if (!WEEKLY_TIME_ENTRY_DECIMAL_PATTERN.test(value)) {
        return -1; // Don't update if invalid format
      }

      // Try to parse as numeric value
      const numericValue = parseFloat(value);

      // Check if it's a valid number
      if (Number.isNaN(numericValue)) {
        return -1; // Don't update if invalid
      }

      hours = numericValue;
    }
  }

  // Limit to 24 hours per cell and ensure non-negative
  hours = Math.max(0, Math.min(24, hours));
  return hours;
};

/**
 * Formats cell value for display
 * @param value - Cell value to format
 * @returns Formatted display value
 */
export const formatCellValue = (value: any): string => {
  // Always show empty for 0 hours, regardless of operation
  if (value === 0) return '';
  if (typeof value === 'number') {
    return getDurationInHHMMFormat(value);
  }
  return value;
};

/**
 * Returns header data for the table
 * Defines column headers with labels and dynamic dates
 */
export const getHeaderData = (
  dateRange: { start: string; end: string },
  visibleDaysOfTheWeek: number[],
  timeEntries: TimesheetRow[],
  firstDayOfWeek: number,
  currencySymbol: string = '$',
): HeaderData[] => {
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const rotatedDayLabels = [
    ...dayLabels.slice(firstDayOfWeek),
    ...dayLabels.slice(0, firstDayOfWeek),
  ];

  // Calculate total hours and billable amount for all visible days
  const totalHours = timeEntries.reduce(
    (sum, row) =>
      sum +
      visibleDaysOfTheWeek.reduce((daySum, dayIndex) => {
        const dayData = row.timeEntries[dayIndex];
        return daySum + (dayData?.hours || 0);
      }, 0),
    0,
  );

  const totalBillable = timeEntries.reduce(
    (sum, row) =>
      sum +
      visibleDaysOfTheWeek.reduce((daySum, dayIndex) => {
        const dayData = row.timeEntries[dayIndex];
        const hours = dayData?.hours || 0;
        const rate = dayData?.billableInfo?.billableRate
          ? parseFloat(dayData.billableInfo.billableRate)
          : 0;
        return daySum + hours * rate;
      }, 0),
    0,
  );

  // Generate dynamic day headers based on dateRange and visible days
  const dayHeaders = visibleDaysOfTheWeek.map((dayIndex) => {
    // Use dateRange.start to calculate the week dates
    const startDate = dayjs(dateRange.start);
    const dayDate = startDate.add(dayIndex, 'day');
    const dayLabel = rotatedDayLabels[dayIndex];
    const formattedDate = dayDate.format('M/D');

    // Calculate column totals for each day
    const dayTotal = timeEntries.reduce((sum, row) => {
      const dayData = row.timeEntries[dayIndex];
      return sum + (dayData?.hours || 0);
    }, 0);

    // Check if day total exceeds 24 hours
    const hasError = dayTotal > 24;

    return {
      label: `${dayLabel} ${formattedDate}`,
      value: getDurationInHHMMFormat(dayTotal), // Show total hours in hh:mm format
      hasError,
    };
  });

  return [
    {
      label: 'Time category',
      value: '',
      width: 170,
      height: 58,
    },
    ...dayHeaders,
    { label: 'Total', value: getDurationInHHMMFormat(totalHours) },
    {
      label: 'Billable',
      value: `${currencySymbol}${totalBillable.toFixed(2)}`,
    },
  ];
};

/**
 * Generates cell data for a row
 * @param row - TimesheetRow object containing row data
 * @param visibleDaysOfTheWeek - Array of visible day indices
 * @param firstDayOfWeek - The first day of the week
 * @param currencySymbol - Currency symbol for billable amount display
 * @returns Array of CellData objects for the row
 */
export const getRowData = (
  row: TimesheetRow,
  visibleDaysOfTheWeek: number[],
  firstDayOfWeek: number,
  currencySymbol: string = '$',
): CellData[] => {
  if (!row) {
    return Array(10).fill({ id: '', value: '' });
  }

  const dayIds = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const rotatedDayIds = [
    ...dayIds.slice(firstDayOfWeek),
    ...dayIds.slice(0, firstDayOfWeek),
  ];

  // Use visibleDaysOfTheWeek for rendering
  const visibleDays = visibleDaysOfTheWeek.map((dayIndex: number) => ({
    dayIndex,
    data: row.timeEntries[dayIndex] || {
      timeEntryId: '',
      date: '',
      hours: 0,
      notes: '',
      metaInfo: undefined,
      billableInfo: undefined,
    },
  }));

  // Calculate totals for ONLY visible days to match UI display
  const visibleDayIndices = visibleDaysOfTheWeek;
  const totalHoursForVisibleDays = calculateRowTotalHours(
    row,
    visibleDayIndices,
  );
  const billableTotalForVisibleDays = calculateRowBillableAmount(
    row,
    visibleDayIndices,
  );

  return [
    {
      id: 'customer',
      value: row.timeAgainst?.id || 'Select customer',
    },
    ...visibleDays.map(({ dayIndex, data }) => ({
      id: rotatedDayIds[dayIndex],
      value: data.hours ?? 0,
    })),
    { id: 'total', value: getDurationInHHMMFormat(totalHoursForVisibleDays) },
    {
      id: 'billable',
      value: `${currencySymbol}${billableTotalForVisibleDays.toFixed(2)}`,
    },
  ];
};

/**
 * Helper function to check if any time entries have approval status 'APPROVED'
 * Used to show lock icon for the row and freeze the customer/break selection dropdown
 * Note: Individual cell locking is handled at the cell level based on the week's max approved date
 * Optimized to use efficient loop with early return
 * @param timeEntries - needed to determine if any one entry is approved for a customer/break or not
 * @returns boolean indicating if the timeEntries for the week contain approved entries
 */
export const hasApprovedEntries = (timeEntries: {
  [dayIndex: number]: timeEntryDetails;
}): boolean => {
  // Use Object.values for better performance
  const entries = Object.values(timeEntries);
  for (let i = 0; i < entries.length; i += 1) {
    const day = entries[i];
    // Check if the entry has a timeEntryId (actual entry) and approval status is 'APPROVED'
    if (day && day.timeEntryId && day.isApproved) {
      return true; // Early return for performance
    }
  }
  return false;
};

/**
 * Helper function to check if a specific cell should be locked based on the week's maximum approved date
 * A cell is locked if its date is on or before the maximum approved date across ALL rows in the week
 * This ensures consistent locking across all rows for a given employee/week
 * @param cellDate - the date of the specific cell (YYYY-MM-DD format)
 * @param maxApprovedDate - the maximum approved date across all rows for the week (or null if none)
 * @returns boolean indicating if the cell should be locked
 */
export const isCellLocked = (
  cellDate: string | undefined | null,
  maxApprovedDate: string | null,
): boolean => {
  if (!cellDate || !maxApprovedDate) return false;

  // Lock this cell if its date is on or before the maximum approved date
  return cellDate <= maxApprovedDate;
};

/**
 * Weekly cell lock state composed from approved lock + submit-time lock + row lock.
 * Submit-time lock is applied only when the submit-time feature is enabled.
 */
export const isWeeklyCellLocked = (
  cellDate: string | undefined | null,
  maxApprovedDate: string | null,
  rowIsTimeOff: boolean | undefined,
  minSelectableDate?: Dayjs,
  isSubmitTimeEnabled?: boolean,
): boolean => {
  if (rowIsTimeOff) {
    return true;
  }

  const isApprovedLocked = isCellLocked(cellDate, maxApprovedDate);
  const isSubmittedDateLocked =
    isSubmitTimeEnabled === true &&
    !!cellDate &&
    !!minSelectableDate &&
    dayjs(cellDate).isBefore(minSelectableDate, 'day');

  return isApprovedLocked || isSubmittedDateLocked;
};

/**
 * Row lock state used for time category and row-level actions.
 * For submit-time, only rows with existing data in submitted dates are locked.
 */
export const isWeeklyRowLocked = (
  rowHasApprovedEntries: boolean,
  rowIsTimeOff: boolean | undefined,
  timeEntries: { [dayIndex: number]: timeEntryDetails },
  minSelectableDate?: Dayjs,
  isSubmitTimeEnabled?: boolean,
): boolean => {
  if (rowHasApprovedEntries || rowIsTimeOff) {
    return true;
  }

  if (isSubmitTimeEnabled !== true || !minSelectableDate) {
    return false;
  }

  return Object.values(timeEntries).some((entry) => {
    const hasPersistedOrEnteredData =
      (!!entry.timeEntryId && entry.timeEntryId.trim() !== '') ||
      (!!entry.hours && entry.hours > 0);

    return (
      hasPersistedOrEnteredData &&
      !!entry.date &&
      dayjs(entry.date).isBefore(minSelectableDate, 'day')
    );
  });
};

export function createEmptyRow(currentWeek: Week, index = 0): TimesheetRow {
  const timeEntries: { [key: number]: timeEntryDetails } = {};

  // Ensure currentWeek.startDate is a dayjs object
  const startDate = dayjs.isDayjs(currentWeek.startDate)
    ? currentWeek.startDate
    : dayjs(currentWeek.startDate);

  for (let i = 0; i < 7; i += 1) {
    timeEntries[i] = {
      timeEntryId: '',
      date: startDate.add(i, 'day').format('YYYY-MM-DD'),
      hours: 0,
      notes: '',
      metaInfo: undefined,
      billableInfo: undefined,
      isApproved: false,
    };
  }
  return {
    rowId: crypto.randomUUID(),
    timeAgainst: {
      type: null,
      id: null,
      displayName: null,
    },
    timeEntries,
    totalHours: 0,
    billableTotal: 0,
    hasApprovedEntries: false,
  };
}

/**
 * Formats hours to HH:MM format for display
 */
export const formatHoursToTime = (hours: number): string => {
  if (!hours || hours === 0) return '0:00';

  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  return `${wholeHours}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Calculates total hours for a row across all visible days
 */
export const calculateRowTotalHours = (
  row: TimesheetRow,
  visibleDays: number[],
): number =>
  visibleDays.reduce((total, dayIdx) => {
    const dayEntry = row.timeEntries[dayIdx];
    return total + (dayEntry?.hours || 0);
  }, 0);

/**
 * Calculates total billable amount for a row
 */
export const calculateRowBillableAmount = (
  row: TimesheetRow,
  visibleDays: number[],
): number =>
  visibleDays.reduce((total, dayIdx) => {
    const dayEntry = row.timeEntries[dayIdx];
    if (
      dayEntry?.billableInfo?.billable &&
      dayEntry?.billableInfo?.billableRate
    ) {
      const rate = parseFloat(dayEntry.billableInfo.billableRate) || 0;
      return total + (dayEntry.hours || 0) * rate;
    }
    return total;
  }, 0);

/**
 * Gets service name from metaInfo
 */
export const getServiceName = (row: TimesheetRow): string => {
  for (let dayIdx = 0; dayIdx < 7; dayIdx += 1) {
    const dayEntry = row.timeEntries[dayIdx];
    if (dayEntry?.metaInfo?.service?.name) {
      return dayEntry.metaInfo.service.name;
    }
  }
  return '';
};

/**
 * Gets billable rate from any day in the row
 */
export const getBillableRate = (row: TimesheetRow): string => {
  for (let dayIdx = 0; dayIdx < 7; dayIdx += 1) {
    const dayEntry = row.timeEntries[dayIdx];
    if (dayEntry?.billableInfo?.billableRate) {
      return dayEntry.billableInfo.billableRate;
    }
  }
  return '';
};

/**
 * Gets billable status from any day in the row
 */
export const getBillableStatus = (row: TimesheetRow): string => {
  for (let dayIdx = 0; dayIdx < 7; dayIdx += 1) {
    const dayEntry = row.timeEntries[dayIdx];
    if (dayEntry?.billableInfo?.billable !== undefined) {
      return dayEntry.billableInfo.billable ? 'Yes' : 'No';
    }
  }
  return 'No';
};

/**
 * Gets notes from any day in the row
 */
export const getNotes = (row: TimesheetRow): string => {
  for (let dayIdx = 0; dayIdx < 7; dayIdx += 1) {
    const dayEntry = row.timeEntries[dayIdx];
    if (dayEntry?.notes) {
      return dayEntry.notes;
    }
  }
  return '';
};

/**
 * Gets class name from metaInfo
 */
export const getClassName = (row: TimesheetRow): string => {
  for (let dayIdx = 0; dayIdx < 7; dayIdx += 1) {
    const dayEntry = row.timeEntries[dayIdx];
    if (dayEntry?.metaInfo?.class?.name) {
      return dayEntry.metaInfo.class.name;
    }
  }
  return '';
};

/**
 * Gets location name from metaInfo
 */
export const getLocationName = (row: TimesheetRow): string => {
  for (let dayIdx = 0; dayIdx < 7; dayIdx += 1) {
    const dayEntry = row.timeEntries[dayIdx];
    if (dayEntry?.metaInfo?.location?.name) {
      return dayEntry.metaInfo.location.name;
    }
  }
  return '';
};

/**
 * Generates filename with week range
 */
export const generateFilename = (dateRange: {
  start: string;
  end: string;
}): string => {
  const startDate = dayjs(dateRange.start);
  const endDate = dayjs(dateRange.end);

  const startMonth = startDate.format('MMM');
  const startDay = startDate.format('DD');
  const endDay = endDate.format('DD');

  return `weekly_timesheet_${startDate.format(
    'YYYY',
  )}_${startMonth}_${startDay}-${endDay}.xlsx`;
};

/**
 * Gets customer display name/label from customerData using timeAgainst.id
 * @param row - TimesheetRow object containing timeAgainst data
 * @param customerData - Array of customer data from Redux state
 * @param breaksData - Array of breaks data from Redux state
 * @param fallbackText - Optional fallback text for customer not found (defaults to 'Unknown Customer')
 * @returns Customer display name or appropriate label for the timeAgainst type
 */
export const getCustomerName = (
  row: TimesheetRow,
  customerData: any[],
  breaksData: any[] = [],
  fallbackText: string = 'Select ...',
): string => {
  if (
    row.timeAgainst?.type === DataAccess_ContactType.Customer ||
    row.timeAgainst?.type === 'PROJECT'
  ) {
    const selectedCustomer = row.timeAgainst?.id
      ? customerData.find((c) => c.id === row.timeAgainst.id)
      : null;
    // Use displayName from store if available, otherwise fall back to displayName
    // stored in timeAgainst (for items selected via search that aren't in the store)
    return (
      selectedCustomer?.displayName ||
      row.timeAgainst?.displayName ||
      fallbackText
    );
  }

  if (row.timeAgainst?.type === 'PAID' || row.timeAgainst?.type === 'UNPAID') {
    const selectedBreak = row.timeAgainst?.id
      ? breaksData.find((b) => b.id === row.timeAgainst.id)
      : null;

    return selectedBreak?.breakName || fallbackText;
  }

  if (row.timeAgainst?.type === 'TIME_OFF') {
    if (row.timeAgainst?.displayName) {
      return row.timeAgainst.displayName;
    }
    if (row.timeAgainst?.id === 'paid') {
      return 'Paid';
    }
    if (row.timeAgainst?.id === 'unpaid') {
      return 'Unpaid';
    }
    return 'Time off';
  }

  return fallbackText;
};

/**
 * Transforms customer data from the contact drawer widget format to the expected GraphQL format
 * @param customerData - Raw customer data from the contact drawer widget
 * @returns Transformed customer data in the expected format
 */
export const transformCustomerData = (customerData: any) => ({
  type: DataAccess_ContactType.Customer,
  displayName: customerData.displayName || customerData.name || '',
  firstName: customerData.firstName || null,
  id: customerData.externalIds?.[0]?.localId || customerData.id,
});

/**
 * Utility function to detect if a time entry has unsaved changes
 * Compares current values with original values to determine if data has been modified
 * This is the same logic used in the Redux slice and useUnsavedChangesDetection hook
 */
export const hasTimeEntryChanges = (timeEntry: timeEntryDetails): boolean => {
  // Check if there's an operation - this indicates unsaved changes
  if (timeEntry.operation) {
    return true;
  }

  // If no operation, there are no unsaved changes
  return false;
};

/**
 * Utility function to check if a time category type is a break type
 * @param timeAgainstType - The time category type to check
 * @returns true if the type is PAID or UNPAID (break types), false otherwise
 */
export const isBreakType = (timeAgainstType: string | null): boolean =>
  timeAgainstType === 'PAID' || timeAgainstType === 'UNPAID';

/**
 * Utility function to check if a row is a break row based on its timeAgainst type
 * @param timeAgainst - The timeAgainst object containing type information
 * @returns true if the row is a break row (PAID or UNPAID), false otherwise
 */
export const isBreakRow = (
  timeAgainst: { type: string | null } | null | undefined,
): boolean => (timeAgainst ? isBreakType(timeAgainst.type) : false);

/**
 * Utility function to clear all non-applicable fields for break entries
 * @param cell - The time entry cell to clear fields from
 * @returns The cell with all break-incompatible fields cleared
 */
export const clearBreakIncompatibleFields = (cell: any): any => ({
  ...cell,
  metaInfo: undefined, // Removes service, class, location
  billableInfo: undefined, // Removes billable status and rate
  customFields: undefined, // Removes custom field values
});

/**
 * Utility function to set default billable information for customer/project entries
 * @param cell - The time entry cell to set billable info for
 * @param teamMember - The team member object containing default billable settings
 * @returns The cell with default billable information set
 */
export const setDefaultBillableInfo = (cell: any, teamMember: any): any => {
  if (!cell.billableInfo && teamMember) {
    return {
      ...cell,
      billableInfo: {
        billable: teamMember.billable || false,
        billableRate: teamMember.billableRate?.toString() || '0',
      },
    };
  }
  return cell;
};

/**
 * Utility function to determine the appropriate operation for a cell based on timeEntryId
 * @param cell - The time entry cell to determine operation for
 * @returns 'UPDATE' if cell has timeEntryId, 'CREATE' otherwise
 */
export const determineCellOperation = (cell: any): 'UPDATE' | 'CREATE' =>
  cell.timeEntryId && cell.timeEntryId.trim() !== '' ? 'UPDATE' : 'CREATE';

/**
 * Whether a cell's billableInfo carries a non-default value worth copying/
 * preserving, as opposed to `{billable: false, billableRate: '0'}` (or
 * missing rate), which is indistinguishable from "never set".
 * @param billableInfo - The billableInfo to check
 */
export const hasValidBillable = (
  billableInfo?: { billable?: boolean; billableRate?: string } | null,
): boolean =>
  !!billableInfo &&
  (billableInfo.billable === true ||
    (!!billableInfo.billableRate && billableInfo.billableRate !== '0'));

/**
 * Resolves the billable rate to use for a cell when a stored rate is
 * missing/zero: the selected service's price takes priority, falling back
 * to the team member's default billable rate. Returns '0' if neither applies.
 */
export const resolveBillableRate = (
  teamMember?: { billableRate?: number } | null,
  servicePrice?: number | null,
): string => {
  if (servicePrice && servicePrice > 0) return String(servicePrice);
  if (teamMember?.billableRate && teamMember.billableRate > 0) {
    return String(teamMember.billableRate);
  }
  return '0';
};

/**
 * Utility function to handle time category changes for cells with hours > 0
 * @param cell - The time entry cell to process
 * @param isNewBreakType - Whether the new time category is a break type
 * @param teamMember - The team member object for default billable settings
 * @returns The processed cell with appropriate field updates and operations
 */
export const processTimeCategoryChange = (
  cell: any,
  isNewBreakType: boolean,
  teamMember: any,
): any => {
  if (!cell.hours || cell.hours <= 0) {
    return cell; // No processing needed for cells without hours
  }

  let processedCell = { ...cell };

  if (isNewBreakType) {
    // Clear all fields for break entries, including notes
    processedCell = clearBreakIncompatibleFields(processedCell);
    processedCell.notes = ''; // Explicitly clear notes when converting to break type
  } else {
    // For non-break types, set default billable info if not present
    processedCell = setDefaultBillableInfo(processedCell, teamMember);
  }

  // Mark cell for appropriate operation
  processedCell.operation = determineCellOperation(processedCell);

  return processedCell;
};

/**
 * Enrich CFO option names from the custom field definition when the API returns only ids.
 * Used so dropdowns show "opt 1" instead of "1000000009_1".
 */
export function enrichCFOOptionsWithNamesFromCF<
  T extends { id: string; name: string; assigned: boolean },
>(
  options: T[],
  customFieldId: string,
  allCustomFields: Array<{
    id: string;
    options?: Array<{ id: string; name?: string }>;
  }>,
  sandbox?: Sandbox,
): T[] {
  const cf = allCustomFields.find((f) => f.id === customFieldId);
  const cfOptions = cf?.options && Array.isArray(cf.options) ? cf.options : [];
  return options.map((opt) => {
    let def = cfOptions.find((o: { id: string }) => o.id === opt.id);
    // Fallback: when CFO option id (from QL) and CF option id (from CES) differ by prefix, match on last part after underscore
    if (!def && opt.id?.includes('_')) {
      const optionIdSuffix = opt.id.split('_').pop();
      def = cfOptions.find(
        (o: { id: string }) =>
          o.id?.includes('_') && o.id.split('_').pop() === optionIdSuffix,
      );
      // log out the information that the suffix fallback was used for this custom field options mapping
      if (def) {
        sandbox?.logger.info(
          'Event=WTEAssignments Message=Suffix fallback was used as CFO ids provided by CES and QL dont match',
          { customFieldId },
        );
      }
    }
    const name = def?.name ?? (opt.name || opt.id);
    return { ...opt, name };
  });
}

/**
 * Read LIVE metaInfo (from the current Redux state), not a render-time
 * `currentCell` snapshot. Service/Class/Location share one sidebar and can
 * auto-select the same cell within one tick; a snapshot would drop a
 * sibling field written microseconds earlier and clobber it. In every
 * non-concurrent path (manual select/clear/add-new) live equals the
 * snapshot. Falls back to the snapshot when there is no selected cell
 * (display-only render).
 */
export function getLiveCellMetaInfo(
  weeklyTimeEntriesMap: Record<string, TimesheetRow>,
  selectedCell: { rowId: string; dayIdx: number } | null | undefined,
  currentCell: timeEntryDetails | null | undefined,
): timeEntryDetails['metaInfo'] {
  if (!selectedCell) return currentCell?.metaInfo;
  return weeklyTimeEntriesMap[selectedCell.rowId]?.timeEntries[
    selectedCell.dayIdx
  ]?.metaInfo;
}
