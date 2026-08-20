/**
 * Custom hook for managing Step 4 Review actions
 * Extracts accept/import logic from Step4Review.tsx
 */

import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  addAcceptedEmployee,
  removeAcceptedEmployee,
  addCheckedEntry,
  removeCheckedEntry,
  setHasUserChanges,
  setNeedsRevalidation,
  setIsPreparingSave,
} from '../../store/reviewSlice';
import {
  selectCheckedEntries,
  selectAcceptedEmployees,
  selectMappedColumnMappings,
} from '../../store/selectors';

interface UseReviewActionsOptions {
  validationEntries?: any;
  customFields?: any[];
  lockedDates?: any[];
  sortedGroupedEntries?: any;
  saveDemoTimeEntries?: (entries: any[]) => Promise<void>;
  has24HourValidationError?: (entry: any) => boolean;
  isEntryLocked?: (entry: any) => boolean;
}

interface UseReviewActionsResult {
  handleAcceptEmployee: (employeeName: string, entries: any[]) => void;
  handleUnacceptEmployee: (employeeName: string, entries: any[]) => void;
  handleAcceptAll: () => void;
  handleLetsGo: () => Promise<void>;
  handleCheckboxChange: (entryId: number, checked: boolean) => void;
}

/**
 * Hook to manage review screen actions
 * Handles:
 * - Accept/Unaccept employee
 * - Accept all valid entries
 * - Import (Let's Go) functionality
 * - Checkbox state management
 */
export const useReviewActions = (
  options: UseReviewActionsOptions,
): UseReviewActionsResult => {
  const {
    validationEntries = {},
    customFields = [],
    lockedDates = [],
    sortedGroupedEntries = {},
    saveDemoTimeEntries,
    has24HourValidationError = () => false,
    isEntryLocked = () => false,
  } = options;

  const dispatch = useDispatch();

  // Redux state
  const checkedEntries = useSelector(selectCheckedEntries);
  const acceptedEmployees = useSelector(selectAcceptedEmployees);
  const columnMappings = useSelector(selectMappedColumnMappings);

  /**
   * Helper to check if a date is locked for an employee
   */
  const isDateLocked = useCallback(
    (employeeId: string, entryDate: string): boolean => {
      if (!employeeId || !entryDate) return false;

      const employeeLockedDates = lockedDates.filter(
        (locked: any) => locked.employeeId === employeeId,
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
      const entryDateObj = new Date(entryDate);
      return entryDateObj <= maxApprovedDate;
    },
    [lockedDates],
  );

  /**
   * Accept all entries for an employee
   */
  const handleAcceptEmployee = useCallback(
    (employeeName: string, entries: any[]) => {
      // Filter entries to only include valid ones (no validation errors, not locked, hours > 0)
      const validEntries = entries.filter((entry) => {
        // Check for validation errors
        const validationResult = validationEntries[entry.id];
        if (validationResult && !validationResult.isValid) {
          return false;
        }

        // Check for missing employee
        if (entry.isMissingEmployee) {
          return false;
        }

        // Check if entry is locked
        if (isEntryLocked(entry)) {
          return false;
        }

        // Check for 0 hours
        const hours = parseFloat(entry.hours) || 0;
        if (hours === 0) {
          return false;
        }

        // Check for custom field errors
        const hasCustomFieldErrors = customFields.some((field: any) => {
          const value = (entry as any)[field.name];
          return field.required && (!value || value.toString().trim() === '');
        });

        if (hasCustomFieldErrors) return false;

        return true; // Entry is valid and can be accepted
      });

      // Add employee to accepted list
      dispatch(addAcceptedEmployee(employeeName));

      // Check only valid entries for this employee
      validEntries.forEach((entry) => {
        dispatch(addCheckedEntry(entry.id));
      });

      // Mark that user has made changes
      dispatch(setHasUserChanges(true));
      dispatch(setNeedsRevalidation(true));
    },
    [dispatch, validationEntries, customFields, isEntryLocked],
  );

  /**
   * Unaccept all entries for an employee
   */
  const handleUnacceptEmployee = useCallback(
    (employeeName: string, entries: any[]) => {
      // Remove employee from accepted list
      dispatch(removeAcceptedEmployee(employeeName));

      // Uncheck all entries for this employee
      entries.forEach((entry) => {
        dispatch(removeCheckedEntry(entry.id));
      });

      // Mark that user has made changes
      dispatch(setHasUserChanges(true));
      dispatch(setNeedsRevalidation(true));
    },
    [dispatch],
  );

  /**
   * Handle checkbox change for individual entry
   */
  const handleCheckboxChange = useCallback(
    (entryId: number, checked: boolean) => {
      if (checked) {
        dispatch(addCheckedEntry(entryId));
      } else {
        dispatch(removeCheckedEntry(entryId));
      }

      // Mark that user has made changes
      dispatch(setHasUserChanges(true));
      dispatch(setNeedsRevalidation(true));
    },
    [dispatch],
  );

  /**
   * Accept all valid entries
   */
  const handleAcceptAll = useCallback(() => {
    const allTimeEntries = Object.values(sortedGroupedEntries).flat() as any[];
    const validEntries = allTimeEntries.filter((entry: any) => {
      const hasEntryValidationErrors =
        entry.validationErrors && entry.validationErrors.length > 0;
      const isNotMissingEmployee = !entry.isMissingEmployee;
      const isLocked = isEntryLocked(entry);
      const hasValidHours = (parseFloat(entry.hours) || 0) > 0;

      return (
        !hasEntryValidationErrors &&
        isNotMissingEmployee &&
        !isLocked &&
        hasValidHours
      );
    });

    // Check all valid entries
    validEntries.forEach((entry: any) => {
      if (!checkedEntries.has(entry.id)) {
        dispatch(addCheckedEntry(entry.id));
      }
    });

    // Mark each employee as accepted if they have valid entries
    const employeeNames = new Set(
      validEntries.map((entry: any) => entry.employee),
    );
    employeeNames.forEach((employeeName) => {
      if (!acceptedEmployees.has(employeeName)) {
        dispatch(addAcceptedEmployee(employeeName));
      }
    });

    dispatch(setHasUserChanges(true));
    dispatch(setNeedsRevalidation(true));
  }, [
    dispatch,
    sortedGroupedEntries,
    checkedEntries,
    acceptedEmployees,
    isEntryLocked,
  ]);

  /**
   * Handle Let's Go button - save valid time entries
   */
  const handleLetsGo = useCallback(async () => {
    if (!saveDemoTimeEntries) {
      return;
    }

    // Show loader immediately
    dispatch(setIsPreparingSave(true));

    // Get all time entries
    const allTimeEntries = Object.values(sortedGroupedEntries).flat() as any[];

    // Filter for ONLY checked entries
    const checkedEntriesOnly = allTimeEntries.filter((entry: any) =>
      checkedEntries.has(entry.id),
    );

    // Further filter to ensure checked entries are valid
    const validEntries = checkedEntriesOnly.filter((entry: any) => {
      const hasEntryValidationErrors =
        entry.validationErrors && entry.validationErrors.length > 0;
      const isNotMissingEmployee = !entry.isMissingEmployee;

      return !hasEntryValidationErrors && isNotMissingEmployee;
    });

    // Map entries to include both Excel column names and QB Time field names
    const entriesToSave = validEntries.map((entry: any) => {
      const mappedEntry: any = {
        ...entry,
        // Explicitly include mapped IDs from Redux state
        timeForId: entry.employeeId || entry.timeForId, // Map employeeId to timeForId for GraphQL
        // Map to the field names expected by useSaveDemoTimeEntries
        classId: entry.classId || entry.classID || '',
        serviceItemId: entry.serviceItemId || entry.serviceItemID || '',
        locationId:
          entry.locationId || entry.locationID || entry.departmentID || '',
        customerId: entry.customerId || entry.customerID || '',
      };

      // Add QB Time field mappings
      Object.entries(columnMappings).forEach(([excelColumn, qbTimeField]) => {
        if (entry[excelColumn] !== undefined) {
          mappedEntry[qbTimeField] = entry[excelColumn];
        }
      });

      return mappedEntry;
    });

    // Save entries
    await saveDemoTimeEntries(entriesToSave);
  }, [
    dispatch,
    sortedGroupedEntries,
    checkedEntries,
    columnMappings,
    saveDemoTimeEntries,
  ]);

  return {
    handleAcceptEmployee,
    handleUnacceptEmployee,
    handleCheckboxChange,
    handleAcceptAll,
    handleLetsGo,
  };
};
