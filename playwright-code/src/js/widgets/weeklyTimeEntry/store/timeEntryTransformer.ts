import {
  TimeTracking_TimeEntry,
  TimeTracking_BillableStatus,
} from 'src/__generated__/timeTracking/graphql';
import { DataAccess_ContactType } from 'src/__generated__/oigql/graphql';
import { TimesheetRow, timeEntryDetails } from './timeEntryGridSlice';
import {
  hasApprovedEntries,
  isBreakRow,
  hasValidBillable,
} from '../utils/helpers';
import { WeeklyTimeEntry } from '../types/weeklyTimeEntryQueryTypes';
import type { Week } from '../hooks/useCombinedDataFetching';
import { getOptionIdByLabel } from '../../common/customFields/utils';
import { mapCustomExtensionsToDimensionValues } from '../../common/dimensions';
import type { CustomExtensionsWire } from '../../common/dimensions';
import type { CustomFieldDefinition } from './customFieldsSlice';

/**
 * TIMEZONE FIX IMPLEMENTATION
 *
 * This module contains optimizations to handle timezone-related issues in time entry processing.
 *
 * PROBLEM:
 * - JavaScript Date objects are timezone-aware and can cause date shifts when comparing dates
 * - When a user is in Los Angeles timezone, a time entry for 7/16 might show up under 7/15
 * - This happens because Date objects are interpreted in the local timezone
 *
 * SOLUTION:
 * - Parse date strings manually to avoid timezone interference
 * - Create Date objects using local timezone constructors
 * - Use consistent date comparison methods
 * - Add comprehensive validation and error handling
 *
 * OPTIMIZATIONS:
 * - Caching for performance
 * - Input validation for robustness
 * - Error handling for graceful degradation
 * - Performance monitoring for debugging
 * - Memory management to prevent leaks
 */

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

/**
 * Cache for date calculations to avoid repeated date arithmetic
 * Maps date strings to calculated day indices and dates
 * Reduces CPU usage for date operations
 */
const dateCache = new Map<string, { dayIndex: number; date: string }>();

/**
 * Cache for customer key generation to avoid repeated string operations
 */
const customerKeyCache = new Map<string, string>();

/**
 * Cache for empty time entry details to reduce object creation
 */
const emptyTimeEntryDetails: timeEntryDetails = {
  timeEntryId: '',
  date: '',
  startTime: undefined,
  endTime: undefined,
  hours: 0,
  notes: '',
  metaInfo: undefined,
  billableInfo: undefined,
  isApproved: false,
  customFields: [],
};

/**
 * Maximum cache size to prevent memory leaks
 */
const MAX_CACHE_SIZE = 1000;

/**
 * Cleans up cache if it exceeds the maximum size
 */
const cleanupCache = (cache: Map<string, any>) => {
  if (cache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(cache.entries());
    const entriesToRemove = entries.slice(0, Math.floor(MAX_CACHE_SIZE / 2));
    entriesToRemove.forEach(([key]) => cache.delete(key));
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Utility function to create a date object without timezone interference
 * @param year - Year
 * @param month - Month (1-12)
 * @param day - Day of month
 * @returns Date object in local timezone
 */
const createLocalDate = (year: number, month: number, day: number): Date =>
  new Date(year, month - 1, day); // month is 0-indexed in Date constructor
/**
 * Utility function to parse date string safely
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Parsed date parts or null if invalid
 */
const parseDateString = (
  dateString: string,
): { year: number; month: number; day: number } | null => {
  const parts = dateString.split('-');
  if (parts.length !== 3) return null;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day))
    return null;

  return { year, month, day };
};

/**
 * Utility function to validate date values
 * @param year - Year
 * @param month - Month (1-12)
 * @param day - Day of month
 * @returns True if date is valid
 */
const isValidDate = (year: number, month: number, day: number): boolean =>
  !Number.isNaN(year) &&
  !Number.isNaN(month) &&
  !Number.isNaN(day) &&
  year >= 1900 &&
  year <= 2100 &&
  month >= 1 &&
  month <= 12 &&
  day >= 1 &&
  day <= 31;

/**
 * Calculates day index and date for a given entry date within a week
 * Caches results to avoid repeated date calculations
 *
 * @param entryDate - Date string from time entry
 * @param weekStart - Start date of the week
 * @returns Object with dayIndex (0-6) and formatted date
 */
const getDayIndexAndDate = (
  entryDate: string,
  weekStart: Date,
): { dayIndex: number; date: string } => {
  // Input validation
  if (!entryDate || typeof entryDate !== 'string') {
    return { dayIndex: -1, date: entryDate || '' };
  }

  if (
    !weekStart ||
    !(weekStart instanceof Date) ||
    Number.isNaN(weekStart.getTime())
  ) {
    return { dayIndex: -1, date: entryDate };
  }

  const cacheKey = `${entryDate}-${weekStart.toISOString()}`;

  // Return cached result if available
  if (dateCache.has(cacheKey)) {
    return dateCache.get(cacheKey)!;
  }

  try {
    // Parse dates consistently without timezone interference
    const parsedEntryDate = parseDateString(entryDate);
    if (!parsedEntryDate) {
      return { dayIndex: -1, date: entryDate };
    }

    // Validate date values
    if (
      !isValidDate(
        parsedEntryDate.year,
        parsedEntryDate.month,
        parsedEntryDate.day,
      )
    ) {
      return { dayIndex: -1, date: entryDate };
    }

    // Get week start date parts to create a consistent date object
    const weekStartYear = weekStart.getFullYear();
    const weekStartMonth = weekStart.getMonth() + 1; // Convert to 1-indexed
    const weekStartDay = weekStart.getDate();

    // Validate week start date
    if (!isValidDate(weekStartYear, weekStartMonth, weekStartDay)) {
      return { dayIndex: -1, date: entryDate };
    }

    // Use Date.UTC to compute day difference so DST transitions
    // (which make a local day 23 or 25 hours) don't shift the index.
    const utcEntry = Date.UTC(
      parsedEntryDate.year,
      parsedEntryDate.month - 1,
      parsedEntryDate.day,
    );
    const utcWeekStart = Date.UTC(
      weekStartYear,
      weekStartMonth - 1,
      weekStartDay,
    );
    const dayDiff = Math.round(
      (utcEntry - utcWeekStart) / (1000 * 60 * 60 * 24),
    );

    const result = {
      dayIndex: dayDiff >= 0 && dayDiff < 7 ? dayDiff : -1,
      date: entryDate,
    };

    // Cache the result for future use
    dateCache.set(cacheKey, result);
    cleanupCache(dateCache);
    return result;
  } catch (error) {
    // Fallback for any unexpected errors
    return { dayIndex: -1, date: entryDate };
  }
};

/**
 * Generates customer key for grouping entries
 * Caches results to avoid repeated string operations
 */
const getCustomerKey = (entry: WeeklyTimeEntry): string => {
  if (entry.isTimeOffEntry && entry.timeOffCategoryName) {
    const key = `time-off-${entry.timeOffCategoryName}`;
    if (!customerKeyCache.has(key)) {
      customerKeyCache.set(key, key);
      cleanupCache(customerKeyCache);
    }
    return customerKeyCache.get(key)!;
  }

  const customerProjectId =
    entry.timeAgainstContactDAS?.customer?.id ||
    entry.timeAgainstContactDAS?.project?.id ||
    entry.timeBreakId ||
    null;

  const key = customerProjectId || 'no-project';

  // Cache the result
  if (!customerKeyCache.has(key)) {
    customerKeyCache.set(key, key);
    cleanupCache(customerKeyCache);
  }

  return customerKeyCache.get(key)!;
};

/**
 * Creates empty time entries for visible days
 * Optimized to reuse empty object structure
 */
const createEmptyTimeEntries = (
  week: Week,
  visibleDays?: number[],
): { [dayIndex: number]: timeEntryDetails } => {
  const timeEntries: { [dayIndex: number]: timeEntryDetails } = {};

  // Use visible days if provided, otherwise default to all days for backward compatibility
  const daysToCreate = visibleDays ?? [0, 1, 2, 3, 4, 5, 6];

  daysToCreate.forEach((dayIdx) => {
    const dayDate = week.startDate.add(dayIdx, 'days').format('YYYY-MM-DD');
    timeEntries[dayIdx] = {
      ...emptyTimeEntryDetails,
      date: dayDate,
    };
  });

  return timeEntries;
};

/**
 * Helper function to create metaInfo object from time entry
 * Optimized to avoid unnecessary object creation
 */
const createMetaInfo = (entry: WeeklyTimeEntry) => {
  if (!entry.serviceItemDAS && !entry.classDAS && !entry.departmentDAS) {
    return undefined;
  }

  return {
    service: entry.serviceItemDAS
      ? {
          id: entry.serviceItemDAS.id,
          name: entry.serviceItemDAS.fullName,
          description: entry.serviceItemDAS.saleDetails.description,
        }
      : undefined,
    class: entry.classDAS
      ? { id: entry.classDAS.id, name: entry.classDAS.fullName }
      : undefined,
    location: entry.departmentDAS
      ? { id: entry.departmentDAS.id, name: entry.departmentDAS.fullName }
      : undefined,
  };
};

/**
 * Helper function to create billableInfo object from time entry
 * Optimized to avoid unnecessary object creation
 */
const createBillableInfo = (entry: WeeklyTimeEntry) => {
  if (!entry.billableStatus) {
    return undefined;
  }

  return {
    billable:
      entry.billableStatus === TimeTracking_BillableStatus.Billable ||
      entry.billableStatus === TimeTracking_BillableStatus.HasBeenBilled,
    billableRate: entry.billableRate?.toString(),
  };
};

/**
 * Helper function to create timeEntryDetails from time entry
 * Optimized to reduce object creation and support optionID derivation
 */
const createTimeEntryDetails = (
  entry: WeeklyTimeEntry,
  date: string,
  durationHours: number,
  customFieldDefinitions?: CustomFieldDefinition[], // Optional for optionID derivation
) => {
  const metaInfo = createMetaInfo(entry);
  const billableInfo = createBillableInfo(entry);
  const notes = entry.notes || '';

  // Map legacy custom fields to our format with optional optionID derivation
  const customFields =
    entry.legacyCustomFields?.map((field) => {
      const baseField = {
        id: field.id,
        name: field.name.trim(),
        value: field.value,
        optionID: (field as any).optionID, // Include optionID for dropdown fields (may be undefined for existing entries)
      };

      // If we have custom field definitions and no optionID, try to derive it
      if (!baseField.optionID && baseField.value && customFieldDefinitions) {
        const customFieldDef = customFieldDefinitions.find(
          (def) => def.id === field.id,
        );
        if (
          customFieldDef &&
          customFieldDef.options &&
          customFieldDef.options.length > 0
        ) {
          const optionID = getOptionIdByLabel(
            customFieldDef.options,
            String(field.value),
          );
          if (optionID) {
            baseField.optionID = optionID;
          }
        }
      }

      return baseField;
    }) || [];

  // Map persisted custom dimensions from the standard AppFoundations
  // `customExtensions` shape (mirrors the STE edit mapping). Requires the read
  // fragment to request `customExtensions { dimensions { definition { id } values } }`.
  const dimensionValues = mapCustomExtensionsToDimensionValues(
    (entry as unknown as { customExtensions?: CustomExtensionsWire | null })
      .customExtensions,
  );
  const dimensions = Object.values(dimensionValues).map((dim) => ({
    id: dim.id,
    optionID: dim.optionID ?? undefined,
    // Keep the removed-default flag so an unchanged '-1' echoes back as ['-1']
    // on save instead of degrading to [].
    ...(dim.activeValueIsDefault ? { activeValueIsDefault: true } : {}),
  }));

  const timeEntryDetails: timeEntryDetails = {
    timeEntryId: entry.id || '',
    date,
    startTime: entry.startTime,
    endTime: entry.endTime,
    isApproved: entry.approvalStatus === 'APPROVED',
    isExternalTimeOff: entry.isTimeOffEntry && !!entry.timeOffRequestExternalId,
    hours: durationHours,
    notes,
    metaInfo,
    billableInfo,
    customFields,
    dimensions,
    // Store original values for change detection
    originalValues: {
      hours: durationHours,
      notes,
      startTime: entry.startTime,
      endTime: entry.endTime,
      metaInfo,
      billableInfo,
      customFields,
      dimensions,
    },
  };

  return timeEntryDetails;
};

/**
 * Helper function to calculate row totals
 * Optimized to use more efficient loop
 */
const calculateRowTotals = (timeEntries: {
  [dayIndex: number]: timeEntryDetails;
}) => {
  let totalHours = 0;
  let billableTotal = 0;

  // Use Object.values for better performance
  const entries = Object.values(timeEntries);
  for (let i = 0; i < entries.length; i += 1) {
    const day = entries[i];
    if (day) {
      const hours = day.hours || 0;
      totalHours += hours;
      if (day.billableInfo?.billable && hours > 0) {
        const rate = parseFloat(day.billableInfo.billableRate || '0');
        billableTotal += hours * rate;
      }
    }
  }

  return { totalHours, billableTotal };
};

/**
 * Determines the type of time entry
 * Memoized to avoid repeated calculations
 */
const getTimeEntryType = (entry: WeeklyTimeEntry, breaksData: any[] = []) => {
  if (entry.isTimeOffEntry && entry.timeOffCategoryName) {
    return 'TIME_OFF';
  }
  if (entry.timeBreakId) {
    // Look up the break type from the breaks data
    const breakData = breaksData.find((b) => b.id === entry.timeBreakId);

    return breakData?.breakType || 'PAID'; // Default to PAID if not found
  }
  if (entry.timeAgainstContactDAS?.customer) {
    return DataAccess_ContactType.Customer;
  }
  return 'PROJECT';
};

const getTimeAgainstDisplayName = (entry: WeeklyTimeEntry): string | null => {
  if (entry.isTimeOffEntry && entry.timeOffCategoryName) {
    return entry.timeOffCategoryName;
  }
  if (entry.timeAgainstContactDAS?.customer?.id) {
    return entry.timeAgainstContactDAS.customer.displayName || null;
  }
  if (entry.timeAgainstContactDAS?.project?.id) {
    return `${entry.timeAgainstContactDAS.project.firstName}  ${entry.timeAgainstContactDAS.project.lastName}`;
  }
  return null;
};

/**
 * Transforms raw time entry data into a normalized array of TimesheetRow objects for the weekly grid.
 *
 * LOGIC OVERVIEW:
 * 1. Filter entries to only include those that fall within visible days
 * 2. Sort all entries by date and customer/project to ensure consistent ordering
 * 3. Process each entry individually, creating new rows when needed
 * 4. Track row totals for display purposes
 * 5. Each time entry maintains its individual identity for separate deletion
 * 6. No artificial row limits - only create rows as needed
 *
 * ROW FILLING STRATEGY:
 * - Process each entry individually in chronological order
 * - Try to add to existing rows with same customer/project first
 * - If the row already has data for all 7 days, create a new row
 * - Each time entry gets its own cell for independent deletion/saving
 * - Track row totals for display purposes
 *
 * KEY FEATURE: MULTIPLE ROWS FOR SAME CUSTOMER/PROJECT
 * - Same customer/project can have multiple rows if needed
 * - New row is created when current row already has data for all 7 days
 * - This prevents data overwriting and maintains individual entry identity
 *
 * OPTIMIZATIONS:
 * - Removed unnecessary batching for better performance
 * - Cached customer key generation
 * - Optimized date calculations with better caching
 * - Reduced object creation with reusable empty objects
 * - Improved loop efficiency
 * - Memoized expensive operations
 *
 * @param timeEntries - Array of raw time entry objects from the API
 * @param week - Week object containing start and end dates
 * @param visibleDays - Array of visible day indices (optional - defaults to all days for backward compatibility)
 * @returns Array of TimesheetRow objects ready for grid display
 */
export const transformTimeEntriesToTimesheetRows = (
  timeEntries: WeeklyTimeEntry[],
  week: Week,
  visibleDays?: number[],
  breaksData?: any[],
  customFieldDefinitions?: CustomFieldDefinition[], // Optional for optionID derivation optimization
): TimesheetRow[] => {
  // 1. Early return for empty data
  if (!timeEntries || timeEntries.length === 0) return [];

  // 2. Pre-calculate week start for date math
  const weekStart = week.startDate.toDate();

  // 3. FILTER ENTRIES BY VISIBLE DAYS
  // Only process entries that fall within the visible days
  const filteredEntries = timeEntries.filter((entry) => {
    if (!entry.date) return false;

    // Filter out entries with 0 hours
    const durationHours = entry.duration ? entry.duration / 3600 : 0;
    if (durationHours <= 0) return false;

    const { dayIndex } = getDayIndexAndDate(entry.date, weekStart);

    // If visibleDays is provided, only include entries for visible days
    // Otherwise, include all entries for backward compatibility
    if (visibleDays && visibleDays.length > 0) {
      return dayIndex >= 0 && visibleDays.includes(dayIndex);
    }

    // Default to all days if no visible days specified
    return dayIndex >= 0 && dayIndex < 7;
  });

  // Early return if no entries match visible days
  if (filteredEntries.length === 0) return [];

  // 4. SORT ENTRIES BY DATE AND CUSTOMER/PROJECT
  // Sort entries by date first, then by customer/project for consistent ordering
  // This ensures that entries are processed in chronological order and grouped logically
  filteredEntries.sort((a, b) => {
    if (!a.date || !b.date) return 0;
    const dateComparison = a.date.localeCompare(b.date);
    if (dateComparison !== 0) return dateComparison;

    // If same date, sort by customer/project for consistent grouping
    const aKey = getCustomerKey(a);
    const bKey = getCustomerKey(b);
    return aKey.localeCompare(bKey);
  });

  // 5. PROCESS ENTRIES INDIVIDUALLY
  // This is the core logic that handles creating separate rows for same customer/project
  const finalRows: TimesheetRow[] = [];

  // Track rows by customer/project to find existing rows for the same type
  const customerRowMap = new Map<string, TimesheetRow[]>();

  filteredEntries.forEach((entry) => {
    if (!entry.date) return;

    const { dayIndex } = getDayIndexAndDate(entry.date, weekStart);
    if (dayIndex < 0 || dayIndex >= 7) return;

    const durationHours = entry.duration ? entry.duration / 3600 : 0;
    const customerKey = getCustomerKey(entry);

    // Get existing rows for this customer/project
    // This allows multiple rows for the same customer/project when needed
    const customerRows = customerRowMap.get(customerKey) || [];

    // Find a suitable row for this entry
    let targetRow: TimesheetRow | null = null;
    let targetRowIndex = -1;

    // Look for an existing row that can accommodate this entry
    // This prevents overwriting existing data
    for (let i = 0; i < customerRows.length; i += 1) {
      const row = customerRows[i];
      const dayHasData = row.timeEntries[dayIndex].timeEntryId;
      if (!dayHasData) {
        // Use this row if the day doesn't have data
        targetRow = row;
        targetRowIndex = i;
        break;
      }
    }

    // If no suitable row found, create a new one
    // This is where we create separate rows for the same customer/project
    if (!targetRow) {
      const timeEntries = createEmptyTimeEntries(week, visibleDays);

      targetRow = {
        rowId: crypto.randomUUID(),
        timeAgainst: {
          type: getTimeEntryType(entry, breaksData) as any,
          id:
            entry.timeAgainstContactDAS?.customer?.id ||
            entry.timeAgainstContactDAS?.project?.id ||
            entry.timeBreakId ||
            null,
          displayName: getTimeAgainstDisplayName(entry),
        },
        timeEntries,
        totalHours: 0,
        billableTotal: 0,
        hasApprovedEntries: false,
        isTimeOffRow: entry.isTimeOffEntry ?? false,
      };

      customerRows.push(targetRow);
      customerRowMap.set(customerKey, customerRows);
      finalRows.push(targetRow);
    }

    // Add the entry to the target row
    // Each entry gets its own cell, maintaining individual identity
    const timeEntryDetails = createTimeEntryDetails(
      entry,
      entry.date,
      durationHours,
      customFieldDefinitions, // Pass custom field definitions for optionID derivation
    );

    targetRow.timeEntries[dayIndex] = timeEntryDetails;

    // Recalculate row totals and approval status to keep them accurate
    const { totalHours, billableTotal } = calculateRowTotals(
      targetRow.timeEntries,
    );
    targetRow.totalHours = totalHours;
    targetRow.billableTotal = billableTotal;
    targetRow.hasApprovedEntries = hasApprovedEntries(targetRow.timeEntries);
  });

  // Copy meta info across rows after all entries have been processed
  finalRows.forEach((targetRow) => {
    if (targetRow && targetRow.timeEntries) {
      const { timeEntries } = targetRow;

      // Find the first cell in the row that has data (service, class, location, billable info, or custom fields)
      let sourceCell: timeEntryDetails | null = null;
      let sourceDayIdx = -1;

      for (let i = 0; i < 7; i += 1) {
        const cell = timeEntries[i];
        if (
          cell &&
          ((cell.metaInfo &&
            (cell.metaInfo.service ||
              cell.metaInfo.class ||
              cell.metaInfo.location)) ||
            cell.billableInfo ||
            (cell.customFields && cell.customFields.length > 0))
        ) {
          sourceCell = cell;
          sourceDayIdx = i;
          break;
        }
      }

      // If we found a source cell with data, copy its meta info to all other cells that have no timeEntryId
      if (sourceCell && sourceDayIdx !== -1) {
        Object.keys(timeEntries).forEach((dayIdx) => {
          const targetDayIdx = parseInt(dayIdx, 10);

          // Skip the source cell (it already has the data)
          if (targetDayIdx === sourceDayIdx) {
            return;
          }

          // Only copy to cells that have no timeEntryId (empty cells)
          const targetCell = timeEntries[targetDayIdx];
          if (targetCell && !targetCell.timeEntryId && sourceCell) {
            const updates: any = {};

            // Copy metaInfo fields if target doesn't have them
            if (!targetCell.metaInfo?.service && sourceCell.metaInfo?.service) {
              updates.metaInfo = {
                ...targetCell.metaInfo,
                service: sourceCell.metaInfo.service,
              };
            }

            if (!targetCell.metaInfo?.class && sourceCell.metaInfo?.class) {
              updates.metaInfo = {
                ...(updates.metaInfo || targetCell.metaInfo),
                class: sourceCell.metaInfo.class,
              };
            }

            if (
              !targetCell.metaInfo?.location &&
              sourceCell.metaInfo?.location
            ) {
              updates.metaInfo = {
                ...(updates.metaInfo || targetCell.metaInfo),
                location: sourceCell.metaInfo.location,
              };
            }

            // Copy service description to notes if target has no notes and source has service with description
            // Only copy when target doesn't have a service or has the same service as source
            if (
              !targetCell.notes &&
              sourceCell.metaInfo?.service?.description &&
              (!targetCell.metaInfo?.service ||
                targetCell.metaInfo.service.id ===
                  sourceCell.metaInfo.service.id)
            ) {
              updates.notes = sourceCell.metaInfo.service.description;
            }

            // Copy billable info alongside service. Skip when the target
            // already has its own service — that service's rate takes
            // precedence. Aligned with useOptimizedCellClick copy logic.
            const isCurrentRowBreak = isBreakRow(targetRow.timeAgainst);
            const shouldCopyBillableInfo =
              !isCurrentRowBreak &&
              !targetCell.timeEntryId &&
              !targetCell.metaInfo?.service &&
              sourceCell.billableInfo;

            if (
              shouldCopyBillableInfo &&
              hasValidBillable(sourceCell.billableInfo)
            ) {
              updates.billableInfo = {
                billable: sourceCell.billableInfo!.billable,
                billableRate: sourceCell.billableInfo!.billableRate,
              };
            }

            // Copy customFields if source has them and target doesn't have them
            if (
              !targetCell.customFields?.length &&
              sourceCell.customFields?.length
            ) {
              updates.customFields = sourceCell.customFields;
            }

            // Apply updates if any
            if (Object.keys(updates).length > 0) {
              timeEntries[targetDayIdx] = {
                ...targetCell,
                ...updates,
                // Preserve the original hours and other state to maintain editability
                // Only preserve existing notes if no notes update was made
                hours: targetCell.hours,
                notes:
                  updates.notes !== undefined
                    ? updates.notes
                    : targetCell.notes,
                isApproved: targetCell.isApproved,
                operation: targetCell.operation,
                originalValues: targetCell.originalValues,
              };
            }
          }
        });
      }
    }
  });

  return finalRows;
};

// ============================================================================
// CACHE UTILITIES
// ============================================================================

/**
 * Clears the date calculation cache
 * Useful for testing, memory management, or when data becomes stale
 * Should be called when switching between different weeks or when cache invalidation is needed
 */
export const clearTransformationCache = (): void => {
  dateCache.clear();
  customerKeyCache.clear();
};

/**
 * Derives optionID for custom fields that have a value but no optionID
 * This is needed when loading existing time entries where backend only provides value (display label)
 */
export const deriveCustomFieldOptionIds = (
  timesheetRows: TimesheetRow[],
  customFieldDefinitions: CustomFieldDefinition[],
): TimesheetRow[] => {
  if (!customFieldDefinitions || customFieldDefinitions.length === 0) {
    return timesheetRows;
  }

  return timesheetRows.map((row) => ({
    ...row,
    timeEntries: Object.keys(row.timeEntries).reduce((acc, dayKey) => {
      const dayEntry = row.timeEntries[parseInt(dayKey, 10)];

      if (dayEntry.customFields && dayEntry.customFields.length > 0) {
        const updatedCustomFields = dayEntry.customFields.map((field: any) => {
          // Only derive optionID if we have a value but no optionID
          if (field.value && !field.optionID) {
            const customFieldDef = customFieldDefinitions.find(
              (def) => def.id === field.id,
            );
            if (
              customFieldDef &&
              customFieldDef.options &&
              customFieldDef.options.length > 0
            ) {
              const optionID = getOptionIdByLabel(
                customFieldDef.options,
                String(field.value),
              );
              return {
                ...field,
                optionID: optionID || undefined,
              };
            }
          }
          return field;
        });

        acc[parseInt(dayKey, 10)] = {
          ...dayEntry,
          customFields: updatedCustomFields,
        };
      } else {
        acc[parseInt(dayKey, 10)] = dayEntry;
      }

      return acc;
    }, {} as typeof row.timeEntries),
  }));
};
