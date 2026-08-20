import { useMemo } from 'react';
import { useAppSelector } from '../store';
import { selectWeeklyTimeEntriesMap } from '../store/selectors';
import { hasTimeEntryChanges } from '../utils/helpers';

/**
 * Hook to detect if there are any unsaved changes in the time entry grid
 * Compares current values with original values to determine if data has been modified
 */
export const useUnsavedChangesDetection = () => {
  const weeklyTimeEntriesMap = useAppSelector(selectWeeklyTimeEntriesMap);

  const hasUnsavedChanges = useMemo(() => {
    // Check if there are any entries in the map
    if (
      !weeklyTimeEntriesMap ||
      Object.keys(weeklyTimeEntriesMap).length === 0
    ) {
      return false;
    }

    // Check if any row has unsaved changes
    return Object.keys(weeklyTimeEntriesMap).some((rowId) => {
      const row = weeklyTimeEntriesMap[rowId];
      if (!row || !row.timeEntries) {
        return false;
      }

      if (row.deleted) {
        return true;
      }

      // Check if any day's time entry has unsaved changes
      return Object.keys(row.timeEntries).some((dayIdx) => {
        const timeEntry = row.timeEntries[parseInt(dayIdx, 10)];
        if (!timeEntry) {
          return false;
        }

        // Use the shared utility function to detect changes
        return hasTimeEntryChanges(timeEntry);
      });
    });
  }, [weeklyTimeEntriesMap]);

  return { hasUnsavedChanges };
};
