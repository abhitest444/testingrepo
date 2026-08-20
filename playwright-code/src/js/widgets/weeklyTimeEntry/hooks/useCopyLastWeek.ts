import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import { useIntl, useSandbox } from '@payroll/quicksand';
import { useReadWeeklyTimeEntries } from 'src/js/service/hooks/weeklyTimeEntries/useReadWeeklyTimeEntries';
import { Week } from 'src/js/widgets/weeklyTimeTrowser/components/WeekSelector';
import {
  createCustomerInteraction,
  endInteractionWithSuccess,
  endInteractionWithFailure,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import { transformTimeEntriesToTimesheetRows } from '../store/timeEntryTransformer';
import { useAppDispatch, useAppSelector } from '../store';
import {
  selectTeamMember,
  selectDateRange,
  selectAllTimesheetRows,
  selectVisibleDays,
} from '../store/selectors';
import { mergeTimeEntries, TimesheetRow } from '../store/timeEntryGridSlice';
import { createEmptyRow } from '../utils/helpers';
import { WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS } from '../utils/constants';
import { WeeklyTimeEntry } from '../types/weeklyTimeEntryQueryTypes';

/**
 * Copy action types for the copy last week functionality
 */
export enum CopyAction {
  OVERWRITE = 'overwrite',
  ADD = 'add',
}

/**
 * Copy source types for identifying what data to copy
 */
export enum CopySource {
  ALL_ENTRIES = 'all_entries',
  CUSTOMERS_AND_BREAKS = 'customers_and_breaks',
}

/**
 * Hook for copying last week's time entries
 * Reuses useReadWeeklyTimeEntries for efficient data fetching
 */
export const useCopyLastWeek = () => {
  const intl = useIntl();
  const sandbox = useSandbox();
  const dispatch = useAppDispatch();

  // Get current state from Redux
  const teamMember = useAppSelector(selectTeamMember);
  const dateRange = useAppSelector(selectDateRange);
  const currentRows = useAppSelector(selectAllTimesheetRows);
  const visibleDays = useAppSelector(selectVisibleDays);

  // State for copy functionality
  const [copyLastWeekModalOpen, setCopyLastWeekModalOpen] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [shouldFetchCopyData, setShouldFetchCopyData] = useState(false);
  const [copyAction, setCopyAction] = useState<CopyAction | null>(null);
  const [copySource, setCopySource] = useState<CopySource | null>(null);

  // Tracks whether the gated previous-week fetch has actually begun (loading
  // observed true) since the current copy was triggered. Now that the fetch is
  // gated behind shouldFetchCopyData, copyLastWeekEntries starts empty until the
  // request resolves. Apollo's `loading` flag only flips true on the render
  // AFTER query() is called, so there is a one-render window where
  // shouldFetchCopyData is true but loading is still false and entries are still
  // []. Without this guard the consumption effect would fire in that window,
  // copy zero rows, and close the modal — silently aborting the copy. We only
  // allow consumption once the fetch has started AND finished (loading went
  // true then back to false). Reset to false whenever shouldFetchCopyData is
  // false so the next copy starts clean.
  const copyFetchStartedRef = useRef(false);

  // Calculate the current week based on Redux date range
  const currentWeek: Week = useMemo(
    () => ({
      startDate: dayjs(dateRange.start),
      endDate: dayjs(dateRange.end),
    }),
    [dateRange.start, dateRange.end],
  );

  // Calculate the previous week (7 days before current week)
  const previousWeek: Week = {
    startDate: currentWeek.startDate.subtract(7, 'day'),
    endDate: currentWeek.endDate.subtract(7, 'day'),
  };

  // Use the existing hook for fetching previous week's data.
  // Gate the fetch behind shouldFetchCopyData (only set true when the user
  // actually triggers a copy action) by passing an empty nameId until then —
  // useReadWeeklyTimeEntries no-ops on empty nameId. Without this gate the
  // previous week was fetched eagerly on every open even though it is consumed
  // only inside the copy effect below, adding a spurious "last week" request
  // and extra re-renders that contributed to the first-open flicker.
  const {
    entries: copyLastWeekEntries,
    loading: copyLastWeekTimeEntriesLoading,
  } = useReadWeeklyTimeEntries(
    shouldFetchCopyData ? teamMember?.id || '' : '',
    previousWeek,
  );

  // Record that the gated fetch has begun (loading observed true) for the
  // current copy, and reset the flag when no copy is in progress. The
  // consumption effect below only proceeds once this is true and loading has
  // returned to false — i.e. the fetch genuinely ran. Centralized here so every
  // copy handler benefits without each having to touch the ref.
  useEffect(() => {
    if (!shouldFetchCopyData) {
      copyFetchStartedRef.current = false;
    } else if (copyLastWeekTimeEntriesLoading) {
      copyFetchStartedRef.current = true;
    }
  }, [shouldFetchCopyData, copyLastWeekTimeEntriesLoading]);

  /**
   * Create minimal break entry with only essential fields
   */
  const createMinimalBreakEntry = useCallback(
    (entry: WeeklyTimeEntry): WeeklyTimeEntry =>
      ({
        id: entry.id,
        alternateIds: entry.alternateIds,
        timeForContactDAS: entry.timeForContactDAS,
        timeForType: entry.timeForType,
        date: entry.date,
        timeBreakId: entry.timeBreakId,
        duration: entry.duration,
      } as WeeklyTimeEntry),
    [],
  );

  /**
   * Create minimal customer entry with only essential fields
   */
  const createMinimalCustomerEntry = useCallback(
    (entry: WeeklyTimeEntry): WeeklyTimeEntry =>
      ({
        id: entry.id,
        alternateIds: entry.alternateIds,
        timeForContactDAS: entry.timeForContactDAS,
        timeForType: entry.timeForType,
        date: entry.date,
        duration: entry.duration,
        timeAgainstContactDAS: entry.timeAgainstContactDAS,
      } as WeeklyTimeEntry),
    [],
  );

  /**
   * Filter entries to only include customers and breaks, creating minimal clean objects
   * Excludes duplicate customers and breaks based on their identifiers
   */
  const filterCustomersAndBreaks = useCallback(
    (entries: WeeklyTimeEntry[]): WeeklyTimeEntry[] => {
      const seenBreaks = new Set<string>();
      const seenCustomers = new Set<string>();

      return entries
        .filter((entry) => {
          // First check if entry is a break or customer
          if (!entry.timeBreakId && !entry.timeAgainstContactDAS?.customer) {
            return false;
          }

          // For break entries, check if we've seen this break ID before
          if (entry.timeBreakId) {
            if (seenBreaks.has(entry.timeBreakId)) {
              return false; // Skip duplicate break
            }
            seenBreaks.add(entry.timeBreakId);
            return true;
          }

          // For customer entries, check if we've seen this customer before
          if (entry.timeAgainstContactDAS?.customer) {
            const customerId = entry.timeAgainstContactDAS.customer.id;
            if (seenCustomers.has(customerId)) {
              return false; // Skip duplicate customer
            }
            seenCustomers.add(customerId);
            return true;
          }

          return false;
        })
        .map((entry) => {
          if (entry.timeBreakId) {
            return createMinimalBreakEntry(entry);
          }
          return createMinimalCustomerEntry(entry);
        });
    },
    [createMinimalBreakEntry, createMinimalCustomerEntry],
  );

  /**
   * Handle copy last week button click (all entries)
   */
  const handleCopyLastWeek = useCallback(() => {
    if (!teamMember?.id) {
      return;
    }

    // Open modal
    setCopyLastWeekModalOpen(true);
  }, [teamMember?.id]);

  /**
   * Handle copy customers and breaks from last week button click
   */
  const handleCopyCustomersAndBreaksLastWeek = useCallback(() => {
    if (!teamMember?.id) {
      return;
    }

    // Open modal
    setCopyLastWeekModalOpen(true);
  }, [teamMember?.id]);

  /**
   * Handle copy last week modal close
   */
  const handleCopyLastWeekModalClose = useCallback(() => {
    setCopyLastWeekModalOpen(false);
    setIsCopying(false);
    setShouldFetchCopyData(false);
    setCopyAction(null);
    setCopySource(null);
  }, []);

  /**
   * Handle overwrite option in copy modal (all entries)
   */
  const handleCopyLastWeekModalOverwrite = useCallback(() => {
    setIsCopying(true);
    setShouldFetchCopyData(true);
    setCopyAction(CopyAction.OVERWRITE);
    setCopySource(CopySource.ALL_ENTRIES);

    // The data will be fetched and applied in the useEffect
  }, []);

  /**
   * Handle add option in copy modal (all entries)
   */
  const handleCopyLastWeekModalAdd = useCallback(() => {
    setIsCopying(true);
    setShouldFetchCopyData(true);
    setCopyAction(CopyAction.ADD);
    setCopySource(CopySource.ALL_ENTRIES);

    // The data will be fetched and applied in the useEffect
  }, []);

  /**
   * Handle overwrite option in copy modal (customers and breaks only)
   */
  const handleCopyCustomersAndBreaksLastWeekModalOverwrite = useCallback(() => {
    setIsCopying(true);
    setShouldFetchCopyData(true);
    setCopyAction(CopyAction.OVERWRITE);
    setCopySource(CopySource.CUSTOMERS_AND_BREAKS);

    // The data will be fetched and applied in the useEffect
  }, []);

  /**
   * Handle add option in copy modal (customers and breaks only)
   */
  const handleCopyCustomersAndBreaksLastWeekModalAdd = useCallback(() => {
    setIsCopying(true);
    setShouldFetchCopyData(true);
    setCopyAction(CopyAction.ADD);
    setCopySource(CopySource.CUSTOMERS_AND_BREAKS);

    // The data will be fetched and applied in the useEffect
  }, []);

  /**
   * Transform copied entries by adding 7 days to dates
   */
  const transformCopiedEntries = useCallback(
    (entries: WeeklyTimeEntry[]) =>
      entries.map((entry) => {
        const originalDate = entry.date!;
        const originalDateObj = dayjs(originalDate);

        // Check if the original date is already in the current week
        const isInCurrentWeek =
          originalDateObj.isAfter(currentWeek.startDate.subtract(1, 'day')) &&
          originalDateObj.isBefore(currentWeek.endDate.add(1, 'day'));

        // Only transform if the date is NOT in the current week (i.e., it's from previous week)
        const transformedDate = isInCurrentWeek
          ? originalDate
          : originalDateObj.add(7, 'days').format('YYYY-MM-DD');

        return {
          ...entry,
          date: transformedDate,
          // Clear approval status and start/end times when copying from previous week
          startTime: undefined,
          endTime: undefined,
          v3StartTime: undefined,
          v3EndTime: undefined,
          approvalStatus: undefined,
          isSubmitted: false,
          isOpen: true,
        };
      }),
    [currentWeek.startDate, currentWeek.endDate],
  );

  /**
   * Apply CREATE operation to all copied entries and clear IDs
   * For CUSTOMERS_AND_BREAKS: copy structure only (0 hours, no notes)
   * For ALL_ENTRIES: copy everything including time data
   */
  const markEntriesAsCreate = useCallback(
    (transformedRows: TimesheetRow[], source: CopySource) =>
      transformedRows.map((row) => ({
        ...row,
        timeEntries: Object.fromEntries(
          Object.entries(row.timeEntries).map(([dayIndex, entry]) => [
            dayIndex,
            {
              ...entry,
              timeEntryId: '', // Clear the ID so entries are treated as new (CREATE operation)
              operation: 'CREATE' as const, // Mark all copied entries as new
              // Only reset hours and notes for CUSTOMERS_AND_BREAKS
              hours:
                source === CopySource.CUSTOMERS_AND_BREAKS ? 0 : entry.hours,
              notes:
                source === CopySource.CUSTOMERS_AND_BREAKS ? '' : entry.notes,
              // Clear approval status and start/end times when copying
              startTime: undefined,
              endTime: undefined,
              isApproved: false, // Clear approval status
            },
          ]),
        ),
      })),
    [],
  );

  /**
   * Mark existing entries for deletion and clear UI fields
   */
  const markExistingEntriesForDeletion = useCallback(
    (existingRows: TimesheetRow[]) =>
      existingRows.map((row) => {
        const hasEntriesToDelete = Object.values(row.timeEntries).some(
          (entry) =>
            // Only mark for deletion if entry has a timeEntryId (saved entries from database)
            entry.timeEntryId && entry.timeEntryId.trim() !== '',
        );

        return {
          ...row,
          deleted: hasEntriesToDelete,
          timeEntries: Object.fromEntries(
            Object.entries(row.timeEntries).map(([dayIndex, entry]) => [
              dayIndex,
              {
                ...entry,
                operation:
                  entry.timeEntryId && entry.timeEntryId.trim() !== ''
                    ? ('DELETE' as const)
                    : undefined,
                // Clear UI fields for entries that should be overwritten
                // This includes both saved entries (marked for deletion) and CREATE entries (to be overwritten)
                hours:
                  (entry.timeEntryId && entry.timeEntryId.trim() !== '') ||
                  entry.operation === 'CREATE'
                    ? 0
                    : entry.hours,
                notes:
                  (entry.timeEntryId && entry.timeEntryId.trim() !== '') ||
                  entry.operation === 'CREATE'
                    ? ''
                    : entry.notes,
                metaInfo:
                  (entry.timeEntryId && entry.timeEntryId.trim() !== '') ||
                  entry.operation === 'CREATE'
                    ? undefined
                    : entry.metaInfo,
                billableInfo:
                  (entry.timeEntryId && entry.timeEntryId.trim() !== '') ||
                  entry.operation === 'CREATE'
                    ? undefined
                    : entry.billableInfo,
              },
            ]),
          ),
        };
      }),
    [],
  );

  /**
   * Handle overwrite operation
   */
  const handleOverwrite = useCallback(
    (copiedRows: TimesheetRow[]) => {
      const existingRows = currentRows || [];

      // For overwrite, we need to handle existing entries that should be deleted
      // We'll create a combined array that includes:
      // 1. New copied rows (to be created)
      // 2. Existing rows with timeEntryId marked for deletion
      // 3. Existing rows without timeEntryId (CREATE operations) will be overwritten by new data

      const existingRowsToDelete = existingRows.filter((row) =>
        Object.values(row.timeEntries).some(
          (entry) => entry.timeEntryId && entry.timeEntryId.trim() !== '',
        ),
      );

      // Mark existing saved entries for deletion (but don't mark row as deleted for UI display)
      const existingRowsMarkedDeleted = existingRowsToDelete.map((row) => ({
        ...row,
        // Don't mark row as deleted so it shows in UI, but mark individual entries for deletion
        deleted: false,
        timeEntries: Object.fromEntries(
          Object.entries(row.timeEntries).map(([dayIndex, entry]) => [
            dayIndex,
            {
              ...entry,
              operation: 'DELETE' as const,
              hours: 0,
              notes: '',
              metaInfo: undefined,
              billableInfo: undefined,
            },
          ]),
        ),
      }));

      // Combine new copied rows with existing rows marked for deletion
      const combinedRows = [...copiedRows, ...existingRowsMarkedDeleted];

      // Create customer interaction for FCI tracking
      createCustomerInteraction(
        sandbox,
        TimeCustomerInteraction.WEEKLY_TIME_SHEET_COPY_LAST_WEEK,
        { intuitInteractionNoBackendCalls: 'true' },
      );

      try {
        sandbox.logger.info(
          WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS.SUCCESS
            .WEEKLY_TIME_ENTRIES_OVERRIDDEN,
          {
            rowsCopied: copiedRows.length,
            rowsMarkedForDelete: existingRowsMarkedDeleted.length,
          },
        );

        // End customer interaction with success
        endInteractionWithSuccess(
          sandbox,
          TimeCustomerInteraction.WEEKLY_TIME_SHEET_COPY_LAST_WEEK,
        );

        dispatch(mergeTimeEntries({ entries: combinedRows, visibleDays }));
      } catch (error) {
        // End customer interaction with failure
        endInteractionWithFailure(
          sandbox,
          TimeCustomerInteraction.WEEKLY_TIME_SHEET_COPY_LAST_WEEK,
          'Failed to overwrite time entries',
          error,
        );
        throw error;
      }
    },
    [currentRows, sandbox, dispatch, visibleDays],
  );

  /**
   * Check if a row is blank (has no actual time entries with data)
   */
  const isRowBlank = useCallback(
    (row: TimesheetRow): boolean => row.totalHours === 0,
    [],
  );

  /**
   * Handle add operation
   */
  const handleAdd = useCallback(
    (copiedRows: TimesheetRow[]) => {
      const existingRows = currentRows || [];

      // Filter out blank rows from existing rows
      const nonBlankExistingRows = existingRows.filter(
        (row) => !isRowBlank(row),
      );

      // Combine non-blank existing rows with copied rows
      const combinedRows = [...nonBlankExistingRows, ...copiedRows];

      sandbox.logger.info(
        WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS.SUCCESS.WEEKLY_TIME_ENTRIES_COPIED,
        {
          existingRows: nonBlankExistingRows.length,
          appendedRows: copiedRows.length,
        },
      );

      // Ensure minimum 6 rows
      while (combinedRows.length < 6) {
        const emptyRow = createEmptyRow(currentWeek, combinedRows.length);
        combinedRows.push(emptyRow);
      }

      dispatch(mergeTimeEntries({ entries: combinedRows, visibleDays }));
    },
    [
      currentRows,
      sandbox.logger,
      dispatch,
      visibleDays,
      isRowBlank,
      currentWeek,
    ],
  );

  // Effect to handle copy data changes
  useEffect(() => {
    // Only process if we should fetch data, we have a copy action and source, we've initiated a copy, and the appropriate data source is loaded
    // copyFetchStartedRef guards the one-render window after a copy is triggered
    // but before the gated fetch's loading flag flips — without it the effect
    // would copy the still-empty entries and close the modal, aborting the copy.
    // Requiring it ensures the fetch actually ran (loading went true) before we
    // treat copyLastWeekEntries as the real previous-week result.
    if (
      copyAction &&
      copySource &&
      shouldFetchCopyData &&
      copyFetchStartedRef.current &&
      !copyLastWeekTimeEntriesLoading
    ) {
      // Determine which data source and loading state to use based on copy source
      const isAllEntriesSource = copySource === CopySource.ALL_ENTRIES;
      const sourceEntries = isAllEntriesSource
        ? copyLastWeekEntries
        : filterCustomersAndBreaks(copyLastWeekEntries);

      // Process copy data and apply to grid
      const processCopyData = (entries: WeeklyTimeEntry[]) => {
        // Transform entries for current week
        const modifiedEntries = transformCopiedEntries(entries);

        const transformedRows = transformTimeEntriesToTimesheetRows(
          modifiedEntries,
          currentWeek,
          visibleDays,
        );

        const copiedRows = markEntriesAsCreate(transformedRows, copySource);

        // If grid is completely empty, treat as overwrite regardless of action
        const existingRows = currentRows || [];
        const effectiveAction =
          existingRows.length === 0 ? CopyAction.OVERWRITE : copyAction;

        // Log which source we're copying from
        const logPrefix = isAllEntriesSource
          ? CopySource.ALL_ENTRIES
          : CopySource.CUSTOMERS_AND_BREAKS;

        sandbox.logger.info(
          `${logPrefix} - ${WEEKLY_TIME_ENTRY_LOGGING_CONSTANTS.SUCCESS.WEEKLY_TIME_ENTRIES_COPIED}`,
          {
            copySource,
            copyAction: effectiveAction,
            entriesCount: entries.length,
            transformedRowsCount: copiedRows.length,
          },
        );

        // Apply based on effective copy action
        if (effectiveAction === CopyAction.OVERWRITE) {
          handleOverwrite(copiedRows);
        } else {
          handleAdd(copiedRows);
        }
        // Close modal after processing (regardless of whether entries were empty or not)
        handleCopyLastWeekModalClose();
      };

      processCopyData(sourceEntries);
    }
  }, [
    shouldFetchCopyData,
    copyAction,
    copySource,
    copyLastWeekEntries,
    copyLastWeekTimeEntriesLoading,
    intl,
    sandbox.logger,
    handleCopyLastWeekModalClose,
    dateRange.start,
    dateRange.end,
    transformCopiedEntries,
    currentWeek,
    visibleDays,
    markEntriesAsCreate,
    handleOverwrite,
    handleAdd,
    currentRows,
    filterCustomersAndBreaks,
  ]);

  return {
    // State
    copyLastWeekModalOpen,
    copyLastWeekTimeEntriesLoading,
    isCopying,

    // Actions for all entries
    handleCopyLastWeek,
    handleCopyLastWeekModalClose,
    handleCopyLastWeekModalOverwrite,
    handleCopyLastWeekModalAdd,

    // Actions for customers and breaks
    handleCopyCustomersAndBreaksLastWeek,
    handleCopyCustomersAndBreaksLastWeekModalOverwrite,
    handleCopyCustomersAndBreaksLastWeekModalAdd,

    // Additional data
    copySource,
    teamMember,
  };
};
