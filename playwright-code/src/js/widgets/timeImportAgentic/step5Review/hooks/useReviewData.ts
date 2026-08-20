/**
 * Custom hook for managing Step 4 Review data fetching
 * Extracts data fetching logic from Step4Review.tsx
 */

import { useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useTimeEntriesQuery } from '../../hooks/useTimeEntriesQuery';
import {
  selectEmployeeGroupedTimeEntries,
  selectEmployeeMappings,
  selectUploadId,
} from '../../store/selectors';

interface UseReviewDataOptions {
  enabled?: boolean;
}

interface UseReviewDataResult {
  timeEntries: any[];
  timeEntriesLoading: boolean;
  timeEntriesError: any;
  hasFetchedTimeEntries: boolean;
  refetchTimeEntries: () => Promise<void>;
}

/**
 * Hook to manage time entries data fetching for review step
 * Handles:
 * - Initial fetch of existing time entries
 * - Refetch when employee mappings change
 */
export const useReviewData = (
  options: UseReviewDataOptions = {},
): UseReviewDataResult => {
  const { enabled = true } = options;

  // Data fetching hook
  const {
    timeEntries,
    loading: timeEntriesLoading,
    error: timeEntriesError,
    fetchTimeEntries,
  } = useTimeEntriesQuery();

  // Redux state
  const employeeGroupedTimeEntries = useSelector(
    selectEmployeeGroupedTimeEntries,
  );
  const employeeMappings = useSelector(selectEmployeeMappings);
  const uploadId = useSelector(selectUploadId);

  // Tracking refs
  const hasFetchedTimeEntries = useRef(false);
  const previousMappingsCount = useRef(0);
  const prevUploadIdRef = useRef<string>('');

  // Reset refs when uploadId changes (new file uploaded)
  useEffect(() => {
    if (uploadId && uploadId !== prevUploadIdRef.current) {
      hasFetchedTimeEntries.current = false;
      previousMappingsCount.current = 0;
      prevUploadIdRef.current = uploadId;
    }
  }, [uploadId]);

  /**
   * Fetch time entries for all employees
   */
  const fetchTimeEntriesForEmployees = useCallback(async () => {
    // Skip if disabled
    if (!enabled) {
      return;
    }

    // Get all unique employee IDs from the grouped entries
    const employeeIds = Object.keys(employeeGroupedTimeEntries)
      .map((employeeName) => {
        const entries = employeeGroupedTimeEntries[employeeName];
        if (entries && entries.length > 0) {
          return entries[0].employeeId;
        }
        return null;
      })
      .filter((id): id is string => id !== null && id !== undefined);

    // Get time entries from uploaded document to calculate date range
    const uploadedTimeEntries = Object.values(
      employeeGroupedTimeEntries,
    ).flat();

    // Fetch time entries for all employees at once
    if (employeeIds.length > 0) {
      try {
        await fetchTimeEntries(employeeIds, uploadedTimeEntries);
        hasFetchedTimeEntries.current = true;
        previousMappingsCount.current = Object.keys(employeeMappings).length;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Fetch time entries failed:', error);
      }
    }
  }, [enabled, employeeGroupedTimeEntries, employeeMappings, fetchTimeEntries]);

  /**
   * Refetch time entries when new employee mappings are added
   */
  const refetchForNewMappings = useCallback(async () => {
    const currentMappingsCount = Object.keys(employeeMappings).length;

    // Check if a new mapping was added (count increased)
    if (
      currentMappingsCount > previousMappingsCount.current &&
      hasFetchedTimeEntries.current
    ) {
      // Get all current employee IDs
      const currentEmployeeIds = Object.keys(employeeGroupedTimeEntries)
        .map((employeeName) => {
          const entries = employeeGroupedTimeEntries[employeeName];
          if (entries && entries.length > 0) {
            return entries[0].employeeId;
          }
          return null;
        })
        .filter((id): id is string => id !== null && id !== undefined);

      // Get time entries from uploaded document
      const uploadedTimeEntries = Object.values(
        employeeGroupedTimeEntries,
      ).flat();

      // Refetch with all current employee IDs
      if (currentEmployeeIds.length > 0) {
        await fetchTimeEntries(currentEmployeeIds, uploadedTimeEntries);
        previousMappingsCount.current = currentMappingsCount;
      }
    }
  }, [employeeMappings, employeeGroupedTimeEntries, fetchTimeEntries]);

  /**
   * Manual refetch function
   */
  const refetchTimeEntries = useCallback(async () => {
    hasFetchedTimeEntries.current = false;
    await fetchTimeEntriesForEmployees();
  }, [fetchTimeEntriesForEmployees]);

  // Initial fetch on mount
  useEffect(() => {
    if (
      Object.keys(employeeGroupedTimeEntries).length > 0 &&
      !hasFetchedTimeEntries.current &&
      enabled
    ) {
      fetchTimeEntriesForEmployees();
    }
  }, [employeeGroupedTimeEntries, enabled, fetchTimeEntriesForEmployees]);

  // Refetch when employee mappings change
  useEffect(() => {
    if (hasFetchedTimeEntries.current && enabled) {
      refetchForNewMappings();
    }
  }, [employeeMappings, enabled, refetchForNewMappings]);

  return {
    timeEntries,
    timeEntriesLoading,
    timeEntriesError,
    hasFetchedTimeEntries: hasFetchedTimeEntries.current,
    refetchTimeEntries,
  };
};
