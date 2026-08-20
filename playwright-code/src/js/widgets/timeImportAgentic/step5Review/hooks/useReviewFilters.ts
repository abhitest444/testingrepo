/**
 * Custom hook for managing Step 4 Review filters
 * Extracts filter logic and computations from Step4Review.tsx
 */

import { useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedFilter } from '../../store/reviewSlice';
import { selectSelectedFilter } from '../../store/selectors';

interface UseReviewFiltersOptions {
  groupedEntries: Record<string, any[]>;
  lockedDates?: any[];
}

interface UseReviewFiltersResult {
  selectedFilter: string;
  handleFilterChange: (
    filter: 'all' | 'valid' | 'missing' | 'invalid' | 'approved',
  ) => void;
  filteredGroupedEntries: Record<string, any[]>;
  validEntriesCount: number;
  invalidEntriesCount: number;
  approvedEntriesCount: number;
}

/**
 * Hook to manage review screen filters
 * Handles:
 * - Filter state management
 * - Entry filtering by criteria
 * - Count calculations for each filter
 */
export const useReviewFilters = (
  options: UseReviewFiltersOptions,
): UseReviewFiltersResult => {
  const { groupedEntries, lockedDates = [] } = options;

  const dispatch = useDispatch();
  const selectedFilter = useSelector(selectSelectedFilter);

  /**
   * Helper to check if an entry is locked
   */
  const isEntryLocked = useCallback(
    (entry: any): boolean => {
      if (!entry.employeeId || !entry.date) return false;

      const employeeLockedDates = lockedDates.filter(
        (locked: any) => locked.employeeId === entry.employeeId,
      );

      if (employeeLockedDates.length === 0) return false;

      // Find the maximum (latest) approved date
      const maxApprovedDate = employeeLockedDates
        .map((locked: any) => new Date(locked.date))
        .reduce(
          (max: Date, date: Date) => (date > max ? date : max),
          new Date(0),
        );

      // Check if entry date is on or before the max approved date
      const entryDate = new Date(entry.date);
      return entryDate <= maxApprovedDate;
    },
    [lockedDates],
  );

  /**
   * Filter entries based on selected criteria
   * Simplified: Just show all entries, no validation filtering
   */
  const filteredGroupedEntries = useMemo(
    () =>
      // Just return all entries, no filtering
      groupedEntries,
    [groupedEntries],
  );

  /**
   * Calculate counts for each filter
   * Simplified: Only count approved/locked entries
   */
  const { validEntriesCount, invalidEntriesCount, approvedEntriesCount } =
    useMemo(() => {
      const allEntries = Object.values(groupedEntries).flat();
      const approved = allEntries.filter((entry) =>
        isEntryLocked(entry),
      ).length;
      const notApproved = allEntries.length - approved;

      return {
        validEntriesCount: notApproved,
        invalidEntriesCount: 0,
        approvedEntriesCount: approved,
      };
    }, [groupedEntries, isEntryLocked]);

  /**
   * Handle filter change
   */
  const handleFilterChange = useCallback(
    (filter: 'all' | 'valid' | 'missing' | 'invalid' | 'approved') => {
      dispatch(setSelectedFilter(filter));
    },
    [dispatch],
  );

  return {
    selectedFilter,
    handleFilterChange,
    filteredGroupedEntries,
    validEntriesCount,
    invalidEntriesCount,
    approvedEntriesCount,
  };
};
