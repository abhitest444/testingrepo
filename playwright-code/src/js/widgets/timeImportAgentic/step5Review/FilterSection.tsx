import React, { useMemo, memo } from 'react';
import { useSelector } from 'react-redux';
import { Button } from '@ids-ts/button';
import { B3 } from '@ids-ts/typography';
import { normalizeDate } from '../utils/timezoneUtils';

interface FilterSectionProps {
  timeEntries: any[];
  selectedFilter: 'all' | 'valid' | 'missing' | 'invalid' | 'approved';
  setSelectedFilter: (
    filter: 'all' | 'valid' | 'missing' | 'invalid' | 'approved',
  ) => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  timeEntries,
  selectedFilter,
  setSelectedFilter,
}) => {
  const filterRenderStart = performance.now();

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

  // PERFORMANCE: Build a map of max approved dates per employee
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

  // Helper function to check if entry is locked
  // An entry is locked if its date is on or before the max approved date for that employee
  const isEntryLocked = (entry: any): boolean => {
    if (!entry.employeeId || !entry.date) return false;

    const maxApprovedDate = maxApprovedDateByEmployee.get(entry.employeeId);
    if (!maxApprovedDate) return false;

    const entryDate = new Date(normalizeDate(entry.date));
    return entryDate <= maxApprovedDate;
  };

  // Helper function to check for 24-hour validation errors from Redux
  const has24HourValidationError = (entry: any): boolean => {
    // Skip 24-hour validation in replace mode
    if (importMode === 'replace') {
      return false;
    }

    if (!entry.employeeId || !entry.date) return false;

    // Normalize the date to match the format used in validation keys
    const normalizedDate = normalizeDate(entry.date);
    const key = `${entry.employeeId}-${normalizedDate}`;
    const validation = timeEntryValidation[key];

    return validation ? validation.exceeds24Hours : false;
  };

  // Memoize expensive filter calculations
  const validCount = useMemo(() => {
    const validStart = performance.now();
    const count = timeEntries.filter((entry) => {
      // Exclude locked entries from count
      if (isEntryLocked(entry)) {
        return false;
      }

      const hasEntryValidationErrors =
        entry.validationErrors && entry.validationErrors.length > 0;
      const has24HourError = has24HourValidationError(entry);
      const isNotMissingEmployee = !entry.isMissingEmployee;

      return (
        (entry.status === 'Valid' || entry.status === 'Approved') &&
        !hasEntryValidationErrors &&
        !has24HourError &&
        isNotMissingEmployee
      );
    }).length;
    return count;
  }, [
    timeEntries,
    maxApprovedDateByEmployee,
    timeEntryValidation,
    importMode,
    isEntryLocked,
    has24HourValidationError,
  ]);

  const missingCount = useMemo(
    () =>
      timeEntries.filter((entry) => {
        // Exclude locked entries from count
        if (isEntryLocked(entry)) {
          return false;
        }

        const hasValidationErrors =
          entry.validationErrors && entry.validationErrors.length > 0;
        const hasOvertimeError =
          entry.validationErrors && entry.validationErrors.includes('overtime');
        const has24HourError = has24HourValidationError(entry);
        const hasApprovedError =
          entry.validationErrors &&
          entry.validationErrors.some((error: string) =>
            error.includes('already approved'),
          );
        const isNotMissingEmployee = !entry.isMissingEmployee;

        return (
          hasValidationErrors &&
          !hasOvertimeError &&
          !has24HourError &&
          !hasApprovedError &&
          isNotMissingEmployee
        );
      }).length,
    [
      timeEntries,
      maxApprovedDateByEmployee,
      timeEntryValidation,
      importMode,
      isEntryLocked,
      has24HourValidationError,
    ],
  );

  const invalidCount = useMemo(
    () =>
      timeEntries.filter((entry) => {
        // Exclude locked entries from count
        if (isEntryLocked(entry)) {
          return false;
        }

        const isInvalidStatus = entry.status === 'Invalid';
        const hasOvertimeError =
          entry.validationErrors && entry.validationErrors.includes('overtime');
        const has24HourError = has24HourValidationError(entry);
        const hasApprovedError =
          entry.validationErrors &&
          entry.validationErrors.some((error: string) =>
            error.includes('already approved'),
          );
        const isNotMissingEmployee = !entry.isMissingEmployee;

        return (
          (isInvalidStatus ||
            (entry.validationErrors &&
              (hasOvertimeError || hasApprovedError)) ||
            has24HourError) &&
          isNotMissingEmployee
        );
      }).length,
    [
      timeEntries,
      maxApprovedDateByEmployee,
      timeEntryValidation,
      importMode,
      isEntryLocked,
      has24HourValidationError,
    ],
  );

  const approvedCount = useMemo(
    () =>
      timeEntries.filter((entry) => {
        // Only include locked entries
        if (!isEntryLocked(entry)) {
          return false;
        }

        // Check for validation errors
        const hasValidationErrors =
          entry.validationErrors && entry.validationErrors.length > 0;

        // Check for custom field errors
        const hasCustomFieldErrors = entry.customFields?.some(
          (field: any) => field.hasError || field.error,
        );

        // Must be valid or approved status (not invalid or missing employee)
        // and have no validation or custom field errors
        return (
          (entry.status === 'Valid' || entry.status === 'Approved') &&
          !entry.isMissingEmployee &&
          !hasValidationErrors &&
          !hasCustomFieldErrors
        );
      }).length,
    [timeEntries, maxApprovedDateByEmployee, isEntryLocked],
  );

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <Button
        priority={selectedFilter === 'all' ? 'primary' : 'secondary'}
        purpose="passive"
        theme="gbsgexperimental"
        onClick={() => setSelectedFilter('all')}
        size="small"
      >
        {`All (${timeEntries.length})`}
      </Button>

      <Button
        priority={selectedFilter === 'valid' ? 'primary' : 'secondary'}
        purpose="passive"
        theme="gbsgexperimental"
        onClick={() => setSelectedFilter('valid')}
        size="small"
      >
        {`Valid (${validCount})`}
      </Button>

      <Button
        priority={selectedFilter === 'missing' ? 'primary' : 'secondary'}
        purpose="passive"
        theme="gbsgexperimental"
        onClick={() => setSelectedFilter('missing')}
        size="small"
      >
        {`Missing (${missingCount})`}
      </Button>

      <Button
        priority={selectedFilter === 'invalid' ? 'primary' : 'secondary'}
        purpose="passive"
        theme="gbsgexperimental"
        onClick={() => setSelectedFilter('invalid')}
        size="small"
      >
        {`Invalid (${invalidCount})`}
      </Button>

      <Button
        priority={selectedFilter === 'approved' ? 'primary' : 'secondary'}
        purpose="passive"
        theme="gbsgexperimental"
        onClick={() => setSelectedFilter('approved')}
        size="small"
      >
        {`Approved/Locked (${approvedCount})`}
      </Button>
    </div>
  );
};

// Wrap in memo to prevent unnecessary re-renders
export default memo(FilterSection);
