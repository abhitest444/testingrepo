import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Button } from '@ids-ts/button';
import { normalizeDate } from '../utils/timezoneUtils';

interface ActionBarProps {
  onAcceptAll: () => void;
  onLetsGo: () => void;
  hasValidationErrors: boolean;
  timeEntries: any[];
  groupedEntries: Record<string, any[]>;
  acceptedEmployees: Set<string>;
  checkedEntries: Set<number>;
  hasUserChanges: boolean;
  isValidating: boolean;
}

const ActionBar: React.FC<ActionBarProps> = ({
  onAcceptAll,
  onLetsGo,
  hasValidationErrors,
  timeEntries,
  groupedEntries,
  acceptedEmployees,
  checkedEntries,
  hasUserChanges,
  isValidating,
}) => {
  // Get time entry validation from Redux
  const timeEntryValidation = useSelector(
    (state: any) => state.validation.timeEntryValidation,
  );

  // Get import mode from Redux
  const importMode = useSelector((state: any) => state.step1.importMode);

  // Get locked dates from Redux
  const lockedDates = useSelector(
    (state: any) => state.timeEntries.lockedDates || [],
  );

  // Check if any non-locked entries have validation errors (for button text)
  const hasAnyValidationErrors = timeEntries.some((entry) => {
    // Skip locked entries - they're not editable/acceptable anyway
    if (entry.employeeId && entry.date) {
      const entryDate = normalizeDate(entry.date);
      const isEntryLocked = lockedDates.some(
        (locked: any) =>
          locked.employeeId === entry.employeeId && locked.date === entryDate,
      );

      if (isEntryLocked) {
        return false; // Don't count locked entries as validation errors
      }
    }

    // Check for entry-level validation errors (missing required fields)
    const hasEntryErrors =
      entry.validationErrors && entry.validationErrors.length > 0;

    // In replace mode, ignore 24-hour validation errors
    // Only check for actual field validation errors (missing service item, class, etc.)
    if (importMode === 'replace') {
      return hasEntryErrors;
    }

    // In add mode, check for both entry errors and 24-hour validation errors
    let has24HourError = false;
    if (entry.employeeId && entry.date) {
      const normalizedDate = normalizeDate(entry.date);
      const key = `${entry.employeeId}-${normalizedDate}`;
      const validation = timeEntryValidation[key];
      has24HourError = validation ? validation.exceeds24Hours : false;
    }

    return hasEntryErrors || has24HourError;
  });

  // Check if all employees are already accepted
  const allEmployeesAccepted = Object.keys(groupedEntries).every((employee) =>
    acceptedEmployees.has(employee),
  );

  // Check if any time entries are accepted or manually checked
  const hasAcceptedEntries = acceptedEmployees.size > 0;
  const hasCheckedEntries = checkedEntries.size > 0;
  const hasAnyEntriesToSave = hasAcceptedEntries || hasCheckedEntries;

  // Build map of max approved dates per employee
  const maxApprovedDateByEmployee = useMemo(() => {
    const map = new Map<string, Date>();

    lockedDates.forEach((locked: any) => {
      const { employeeId } = locked;
      const lockedDate = new Date(normalizeDate(locked.date));

      const currentMax = map.get(employeeId);
      if (!currentMax || lockedDate > currentMax) {
        map.set(employeeId, lockedDate);
      }
    });

    return map;
  }, [lockedDates]);

  // Count valid entries (entries without validation errors and with existing employees)
  const validEntriesCount = timeEntries.filter((entry) => {
    // Check if this entry's date is locked/approved using max approved date logic
    if (entry.employeeId && entry.date) {
      const maxApprovedDate = maxApprovedDateByEmployee.get(entry.employeeId);
      if (maxApprovedDate) {
        const entryDate = new Date(normalizeDate(entry.date));
        const isEntryLocked = entryDate <= maxApprovedDate;

        // Exclude locked entries from valid count
        if (isEntryLocked) {
          return false;
        }
      }
    }

    // Check for entry-level validation errors (missing required fields)
    const hasEntryErrors =
      entry.validationErrors && entry.validationErrors.length > 0;

    // In replace mode, ignore 24-hour validation errors
    let has24HourError = false;
    if (importMode !== 'replace' && entry.employeeId && entry.date) {
      // Only check 24-hour errors in add mode
      const normalizedDate = normalizeDate(entry.date);
      const key = `${entry.employeeId}-${normalizedDate}`;
      const validation = timeEntryValidation[key];
      has24HourError = validation ? validation.exceeds24Hours : false;
    }

    // Check if employee is missing
    const { isMissingEmployee } = entry;

    // Entry is valid if it has no errors and employee exists
    return !hasEntryErrors && !has24HourError && !isMissingEmployee;
  }).length;

  // Accept All should be enabled only if there are valid entries
  const shouldDisableAcceptAll = validEntriesCount === 0;

  // Let's Go button should be enabled if there are accepted employees OR checked entries
  const shouldDisableLetsGo = !hasAnyEntriesToSave;

  // Calculate total time entries count (excluding locked)
  const totalEntriesCount = timeEntries.filter((entry) => {
    // Exclude locked entries
    if (entry.employeeId && entry.date) {
      const maxApprovedDate = maxApprovedDateByEmployee.get(entry.employeeId);
      if (maxApprovedDate) {
        const entryDate = new Date(normalizeDate(entry.date));
        const isEntryLocked = entryDate <= maxApprovedDate;
        if (isEntryLocked) {
          return false;
        }
      }
    }
    return true;
  }).length;

  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <Button
        priority="secondary"
        purpose="standard"
        theme="gbsgexperimental"
        onClick={onAcceptAll}
        disabled={shouldDisableAcceptAll}
      >
        {totalEntriesCount === 0
          ? 'No valid entries'
          : `Accept ${validEntriesCount || 0} out of ${totalEntriesCount}`}
      </Button>

      <Button
        priority="primary"
        purpose="standard"
        theme="gbsgexperimental"
        onClick={onLetsGo}
        disabled={shouldDisableLetsGo}
      >
        Add time entries
      </Button>
    </div>
  );
};

export default ActionBar;
