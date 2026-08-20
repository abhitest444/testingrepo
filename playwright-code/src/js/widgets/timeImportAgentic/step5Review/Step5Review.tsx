import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { H4, B2, B3 } from '@ids-ts/typography';
import TextField from '@ids-ts/text-field';
import Dropdown, { MenuItem } from '@ids-ts/dropdown';
import Widget from 'web-shell-core/widgets/HOCWidget';
import Button from '@ids-ts/button';
import {
  parseDate,
  formatDateForAPI,
  normalizeDate,
} from '../utils/timezoneUtils';
import ReviewStickyTable from './ReviewStickyTable';
import LoadingOverlay from '../components/LoadingOverlay';
import BackButton from '../components/BackButton';
import { useValidation } from '../hooks/useValidation';
import { useUxPreferencesRedux } from '../hooks/useUxPreferencesRedux';
import { useReviewData } from './hooks/useReviewData';
import { useReviewActions } from './hooks/useReviewActions';
import { useReviewFilters } from './hooks/useReviewFilters';
import {
  deleteTimeEntry,
  setIsValidating,
  setHasUserChanges,
  setNeedsRevalidation,
  updateTimeEntry as updateTimeEntryReview,
  setTimeEntries,
  TimeEntry,
  removeCheckedEntry,
  addCheckedEntry,
  setIsPreparingSave,
} from '../store/reviewSlice';
import { updateTimeEntry } from '../store/excelDataSlice';
import {
  selectReviewScreenData,
  selectTimesheetFieldsData,
  selectUploadId,
  selectSaveResult,
  selectSaveError,
} from '../store/selectors';
import { setCurrentStep } from '../store/progressSlice';
import { useTimesheetFieldsData } from '../hooks/useTimesheetFieldsData';
import { useSaveBulkTimeEntries } from '../hooks/useSaveBulkTimeEntries';
import { exportTimeEntriesToExcel } from '../utils/excelExport';

interface Step4ReviewProps {
  /** @deprecated No longer navigates to Step 6 - kept for API compatibility */
  onImport?: () => void;
  /** When true, hide title and subtitle (e.g. in split-screen view). */
  hideTitle?: boolean;
  /** When true, render only the table (filters + table + save), no title, no BackButton (e.g. split-screen left panel). */
  tableOnly?: boolean;
}

// Track render count outside component to persist across renders
let step4RenderCount = 0;

const Step4Review: React.FC<Step4ReviewProps> = ({
  onImport,
  hideTitle = false,
  tableOnly = false,
}) => {
  const renderStart = performance.now();
  step4RenderCount += 1;

  const dispatch = useDispatch();
  const { refetch: timesheetFieldsDataRefetch } = useTimesheetFieldsData({
    autoLoad: true,
    first: 250,
  });

  // Get uploadId from Redux
  const uploadId = useSelector(selectUploadId);

  // Local state to keep loading active until navigation
  const [isNavigating, setIsNavigating] = useState(false);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Display mode state (Employee or Date)
  const [displayMode, setDisplayMode] = useState<'employee' | 'date'>(
    'employee',
  );

  // Use combined selectors (reduces re-renders)
  const reviewData = useSelector(selectReviewScreenData);
  const timesheetFields = useSelector(selectTimesheetFieldsData);
  const customFields = useSelector(
    (state: any) => state.customFields.customFields || [],
  );
  const companySettings = useSelector(
    (state: any) => state.companySettings.settings,
  );

  const {
    timeEntries: reviewTimeEntries, // Use review.timeEntries (has nullification applied)
    acceptedEmployees,
    checkedEntries,
    selectedFilter,
    isImporting,
    hasValidationErrors,
    mappedColumnCheckboxes,
    mappedColumnMappings,
    isValidating,
    hasUserChanges,
    isPreparingSave,
    lockedDates,
    validationEntries,
  } = reviewData;

  const { customers, services, classes, locations } = timesheetFields;

  // Get max hours per day from Redux for overtime highlighting
  const maxHoursPerDay =
    useSelector((state: any) => state.step1.maxHoursPerDay) || 8;

  // Save result and failed entries for row styling (green/red)
  const saveResult = useSelector(selectSaveResult);
  const failedEntries = useSelector(
    (state: any) => state.review.failedEntries || [],
  );
  const saveError = useSelector(selectSaveError);

  // Use the save hook for demo time entries - table stays in place; success/failure shown via row styling
  const { saveDemoTimeEntries, loading: isSaving } = useSaveBulkTimeEntries({
    onSaveSuccess: () => {
      setIsNavigating(false);
      dispatch(setIsPreparingSave(false));
      // After 5 seconds show the success screen (View time entries, etc.)
      setTimeout(() => {
        dispatch(setCurrentStep(6));
      }, 5000);
    },
    onPartialSuccess: () => {
      setIsNavigating(false);
      dispatch(setIsPreparingSave(false));
    },
    onSaveFailure: () => {
      setIsNavigating(false);
      dispatch(setIsPreparingSave(false));
    },
  });

  // Product Service Drawer State
  const [showAddServiceDrawer, setShowAddServiceDrawer] = useState(false);
  const [newMissingService, setNewMissingService] = useState('');

  // Product Service Drawer Handlers
  const handleProductServiceDrawerCancel = () => {
    setShowAddServiceDrawer(false);
  };

  // Location Drawer State
  const [showAddLocationDrawer, setShowAddLocationDrawer] = useState(false);
  const [newMissingLocation, setNewMissingLocation] = useState('');

  // Class Drawer State
  const [showAddClassDrawer, setShowAddClassDrawer] = useState(false);
  const [newMissingClass, setNewMissingClass] = useState('');

  // Location Drawer Handlers
  const handleLocationDrawerCancel = () => {
    setShowAddLocationDrawer(false);
  };

  // Class Drawer Handlers
  const handleClassDrawerCancel = () => {
    setShowAddClassDrawer(false);
  };

  // Debounce search term (300ms delay)
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);

  const handleShowAddServiceDrawer = (serviceName: string) => {
    setNewMissingService(serviceName);
    setShowAddServiceDrawer(true);
  };

  const handleShowAddLocationDrawer = (locationName: string) => {
    setNewMissingLocation(locationName);
    setShowAddLocationDrawer(true);
  };

  const handleShowAddClassDrawer = (className: string) => {
    setNewMissingClass(className);
    setShowAddClassDrawer(true);
  };

  // Use custom hooks for data fetching, actions, and filters
  const { timeEntriesLoading, timeEntriesError } = useReviewData({
    enabled: true,
  });

  // Handle field changes for editable columns (hours, start time, end time)
  const handleFieldChange = useCallback(
    (entryId: number, field: string, value: any) => {
      // Update in review slice (where time entries are read from)
      dispatch(
        updateTimeEntryReview({ id: entryId, updates: { [field]: value } }),
      );

      // If hours are changed to 0, automatically uncheck the entry
      if (field === 'hours' && (parseFloat(value) || 0) === 0) {
        dispatch(removeCheckedEntry(entryId));
      }
    },
    [dispatch],
  );

  // Grouped entries memoization - group by employee from review state
  const groupedEntries = useMemo(() => {
    if (!reviewTimeEntries || reviewTimeEntries.length === 0) return {};

    // Group entries by employee name
    const grouped: Record<string, any[]> = {};

    reviewTimeEntries.forEach((entry: any) => {
      const employeeName = entry.employee || 'Unknown';
      if (!grouped[employeeName]) {
        grouped[employeeName] = [];
      }
      grouped[employeeName].push(entry);
    });

    return grouped;
  }, [reviewTimeEntries]);

  // Helper function to check if entry is locked
  const isEntryLocked = useCallback(
    (entry: any): boolean => {
      if (!entry.employeeId || !entry.date) return false;

      const employeeLockedDates = lockedDates.filter(
        (locked: any) => locked.employeeId === entry.employeeId,
      );

      if (employeeLockedDates.length === 0) return false;

      const maxApprovedDate = employeeLockedDates
        .map((locked: any) => new Date(normalizeDate(locked.date)))
        .reduce(
          (max: Date, date: Date) => (date > max ? date : max),
          new Date(0),
        );

      const entryDate = new Date(normalizeDate(entry.date));
      return entryDate <= maxApprovedDate;
    },
    [lockedDates],
  );

  // Initialize checked entries when time entries are loaded
  // This runs only once when reviewTimeEntries is first populated
  const hasInitializedChecked = useRef(false);
  const hasInitializedCheckboxes = useRef(false);
  const prevUploadIdRef = useRef<string>('');

  // Reset refs when uploadId changes (new file uploaded)
  useEffect(() => {
    if (uploadId && uploadId !== prevUploadIdRef.current) {
      hasInitializedChecked.current = false;
      hasInitializedCheckboxes.current = false;
      prevUploadIdRef.current = uploadId;
    }
  }, [uploadId]);

  useEffect(() => {
    // Only initialize if:
    // 1. We have time entries
    // 2. Checked entries is empty (was cleared by setTimeEntries)
    // 3. We haven't already initialized
    if (
      reviewTimeEntries &&
      reviewTimeEntries.length > 0 &&
      checkedEntries.size === 0 &&
      !hasInitializedChecked.current
    ) {
      hasInitializedChecked.current = true;

      // Auto-check all valid, unlocked entries with non-zero hours
      reviewTimeEntries.forEach((entry: any) => {
        const hours = parseFloat(entry.hours) || 0;
        const shouldCheck =
          entry.status === 'Valid' &&
          entry.validationErrors?.length === 0 &&
          !isEntryLocked(entry) &&
          hours > 0; // Exclude 0-hour entries

        if (shouldCheck) {
          dispatch(addCheckedEntry(entry.id));
        }
      });
    }

    // Reset flag when entries change (new import)
    if (reviewTimeEntries.length === 0) {
      hasInitializedChecked.current = false;
    }
  }, [reviewTimeEntries, checkedEntries.size, dispatch, isEntryLocked]);

  // Initialize checkboxes - check all valid entries on mount
  useEffect(() => {
    if (!hasInitializedCheckboxes.current && reviewTimeEntries.length > 0) {
      hasInitializedCheckboxes.current = true;

      const notesRequired =
        companySettings?.timeSheetEntryMakesNotesRequiredEnabled || false;

      // Check all valid entries (not locked, no validation errors, no missing required notes)
      reviewTimeEntries.forEach((entry: any) => {
        const hasValidationErrors =
          entry.validationErrors && entry.validationErrors.length > 0;
        const isMissing = entry.isMissingEmployee;
        const isLocked = isEntryLocked(entry);
        const isMissingRequiredNotes =
          notesRequired && (!entry.notes || entry.notes === '');

        if (
          !hasValidationErrors &&
          !isMissing &&
          !isLocked &&
          !isMissingRequiredNotes &&
          !checkedEntries.has(entry.id)
        ) {
          dispatch({ type: 'review/addCheckedEntry', payload: entry.id });
        }
      });
    }
  }, [
    reviewTimeEntries,
    isEntryLocked,
    checkedEntries,
    dispatch,
    companySettings,
  ]);

  // Uncheck locked entries when lockedDates changes (to handle late-loading locked dates)
  // This ensures locked entries are never in the checked set
  useEffect(() => {
    if (lockedDates.length > 0 && reviewTimeEntries.length > 0) {
      reviewTimeEntries.forEach((entry: any) => {
        const isLocked = isEntryLocked(entry);
        if (isLocked && checkedEntries.has(entry.id)) {
          dispatch(removeCheckedEntry(entry.id));
        }
      });
    }
  }, [lockedDates, reviewTimeEntries, isEntryLocked, checkedEntries, dispatch]);

  // Filter grouped entries based on debounced search term and filter dropdown
  const searchFilteredGroupedEntries = useMemo(() => {
    let filtered = groupedEntries;

    // Apply search filter
    if (debouncedSearchTerm.trim()) {
      const searchFiltered: Record<string, any[]> = {};
      const searchLower = debouncedSearchTerm.toLowerCase();

      Object.entries(filtered).forEach(([employeeName, entries]) => {
        if (employeeName.toLowerCase().includes(searchLower)) {
          searchFiltered[employeeName] = entries;
        }
      });
      filtered = searchFiltered;
    }

    // Apply status filter (All, Accepted, Unaccepted, Locked)
    if (selectedFilter !== 'all') {
      const statusFiltered: Record<string, any[]> = {};

      Object.entries(filtered).forEach(([employeeName, entries]) => {
        let filteredEntries = entries;

        if (selectedFilter === 'approved') {
          // Show only locked/approved entries
          filteredEntries = entries.filter((entry: any) =>
            isEntryLocked(entry),
          );
        } else if (selectedFilter === 'valid') {
          // Show only accepted (non-locked) entries
          filteredEntries = entries.filter(
            (entry: any) =>
              checkedEntries.has(entry.id) && !isEntryLocked(entry),
          );
        } else if (selectedFilter === 'invalid') {
          // Show only unaccepted entries
          filteredEntries = entries.filter(
            (entry: any) =>
              !checkedEntries.has(entry.id) && !isEntryLocked(entry),
          );
        }

        if (filteredEntries.length > 0) {
          statusFiltered[employeeName] = filteredEntries;
        }
      });

      filtered = statusFiltered;
    }

    return filtered;
  }, [
    groupedEntries,
    debouncedSearchTerm,
    selectedFilter,
    checkedEntries,
    isEntryLocked,
  ]);

  // Helper functions for validation
  const has24HourValidationError = useCallback(
    (entry: any) => {
      const validationResult = validationEntries[entry.id];
      if (validationResult && !validationResult.isValid) {
        return validationResult.errors?.some((error: string) =>
          error.includes('24 hour'),
        );
      }
      return false;
    },
    [validationEntries],
  );

  // Use review filters hook for handleFilterChange
  const { handleFilterChange } = useReviewFilters({
    groupedEntries,
    lockedDates,
  });

  // Sort grouped entries by employee name (using search-filtered entries)
  const sortedGroupedEntries = useMemo(() => {
    const filtered = searchFilteredGroupedEntries;
    const sorted: Record<string, any[]> = {};
    Object.keys(filtered)
      .sort()
      .forEach((key) => {
        sorted[key] = filtered[key];
      });
    return sorted;
  }, [searchFilteredGroupedEntries]);

  // Use review actions hook AFTER sortedGroupedEntries is defined
  const {
    handleAcceptEmployee,
    handleUnacceptEmployee,
    handleCheckboxChange,
    handleAcceptAll,
    handleLetsGo,
  } = useReviewActions({
    validationEntries,
    customFields,
    lockedDates,
    sortedGroupedEntries,
    saveDemoTimeEntries,
    has24HourValidationError,
    isEntryLocked,
  });

  // Local handlers for delete and update
  const handleDeleteEntry = useCallback(
    (entryId: number) => {
      dispatch(deleteTimeEntry(entryId));
      dispatch(removeCheckedEntry(entryId));
      dispatch(setHasUserChanges(true));
      dispatch(setNeedsRevalidation(true));
    },
    [dispatch],
  );

  const handleTimeEntryUpdate = useCallback(
    (entryId: number, field: string, value: any) => {
      // Parse and normalize date if it's a date field
      let normalizedValue = value;
      if (field === 'date' && value) {
        const parsedDate = parseDate(value);
        if (parsedDate) {
          normalizedValue = formatDateForAPI(parsedDate);
        }
      }

      // Update time entry in review slice
      dispatch(
        updateTimeEntryReview({
          id: entryId,
          updates: {
            [field]: normalizedValue,
          },
        }),
      );

      // Also update in excelData slice to keep them in sync
      dispatch(
        updateTimeEntry({
          id: entryId.toString(),
          updates: {
            [field]: normalizedValue,
          },
        }),
      );

      // Mark that user has made changes
      dispatch(setHasUserChanges(true));
      dispatch(setNeedsRevalidation(true));
    },
    [dispatch],
  );

  // UX Preferences hook for employee mappings
  useUxPreferencesRedux();

  const totalEmployees = Object.keys(sortedGroupedEntries).length;
  const totalEntries = Object.values(sortedGroupedEntries).flat().length;

  // Get visible columns based on step 2 mapping (exclude employee column)
  const visibleColumns = useMemo(() => {
    const columns: string[] = [];
    const addedFields = new Set<string>();

    Object.entries(mappedColumnCheckboxes).forEach(
      ([excelColumn, isChecked]) => {
        if (isChecked) {
          const mappedField = mappedColumnMappings[excelColumn];
          const isEmployeeColumn = mappedField === 'employee';

          if (
            !isEmployeeColumn &&
            mappedField &&
            !addedFields.has(mappedField)
          ) {
            columns.push(mappedField);
            addedFields.add(mappedField);
          }
        }
      },
    );

    return columns;
  }, [mappedColumnCheckboxes, mappedColumnMappings]);

  // Flatten grouped entries into a single array
  const flatTimeEntries = useMemo(
    () => Object.values(sortedGroupedEntries).flat(),
    [sortedGroupedEntries],
  );

  // Handler for accepting an individual entry
  const handleAcceptSingleEntry = useCallback(
    (entryId: number) => {
      handleCheckboxChange(entryId, true);
    },
    [handleCheckboxChange],
  );

  // Show loading overlay when saving or validating
  const showLoadingOverlay =
    (isSaving && isNavigating) || isPreparingSave || isImporting;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
        padding: '0',
        position: 'relative',
      }}
    >
      {/* Loading Overlay */}
      <LoadingOverlay
        isLoading={showLoadingOverlay}
        primaryText={(() => {
          if (isSaving || isPreparingSave) return 'Saving time entries';
          if (isValidating) return 'Validating time entries';
          return 'Loading time entries';
        })()}
        secondaryText=""
      />

      <>
        {saveError && (
          <div
            style={{
              padding: '12px 16px',
              marginBottom: '16px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#b91c1c',
            }}
          >
            <B2>{saveError}</B2>
          </div>
        )}
        {!hideTitle && (
          <>
            <H4
              weight="demi"
              style={{ marginTop: '16px', marginBottom: '20px' }}
            >
              Voila, here&apos;re your imported time entries
            </H4>
            <B2 style={{ marginBottom: '24px' }}>
              Select the ones you&apos;d like to add to your time entries.
            </B2>
          </>
        )}

        {/* Search and Filter Section */}
        <div style={{ marginBottom: '16px' }}>
          {/* Controls row with labels on top */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'flex-end', gap: '16px' }}
            >
              {/* Display by Dropdown */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <B3 weight="demi">Display by</B3>
                <Dropdown
                  value={displayMode}
                  onChange={(e) =>
                    setDisplayMode(
                      (e.target as HTMLSelectElement).value as
                        | 'employee'
                        | 'date',
                    )
                  }
                  style={{ minWidth: '120px', width: '100%' }}
                >
                  <MenuItem value="employee">Employee</MenuItem>
                  <MenuItem value="date">Date</MenuItem>
                </Dropdown>
              </div>

              {/* Search Bar */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <B3 weight="demi">Search</B3>
                <TextField
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ minWidth: '200px' }}
                />
              </div>

              {/* Filter Dropdown */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <B3 weight="demi">Filter</B3>
                <Dropdown
                  value={selectedFilter}
                  onChange={(e) =>
                    handleFilterChange(
                      (e.target as HTMLSelectElement).value as any,
                    )
                  }
                  style={{ minWidth: '150px', width: '100%' }}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="valid">Accepted</MenuItem>
                  <MenuItem value="invalid">Unaccepted</MenuItem>
                  <MenuItem value="approved">Locked</MenuItem>
                </Dropdown>
              </div>
            </div>
          </div>
        </div>

        {/* Review Table */}
        <div>
          {flatTimeEntries.length > 0 ? (
            <ReviewStickyTable
              timeEntries={flatTimeEntries}
              mappedColumns={visibleColumns}
              mappedColumnMappings={mappedColumnMappings}
              checkedEntries={checkedEntries}
              onCheckboxChange={(id, checked) =>
                handleCheckboxChange(Number(id), checked)
              }
              isEntryLocked={isEntryLocked}
              onFieldChange={handleFieldChange}
              maxHoursPerDay={maxHoursPerDay}
              groupBy={displayMode}
              notesRequired={
                companySettings?.timeSheetEntryMakesNotesRequiredEnabled ||
                false
              }
              companySettings={companySettings}
              customFields={customFields}
              saveResult={saveResult}
              failedEntries={failedEntries}
            />
          ) : (
            <div
              style={{
                padding: '40px',
                textAlign: 'center',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef',
              }}
            >
              <B2>
                {searchTerm.trim()
                  ? `No employees found matching "${searchTerm}"`
                  : 'No time entries found'}
              </B2>
            </div>
          )}
        </div>

        {/* Product Service Drawer */}
        {showAddServiceDrawer && (
          <Widget
            widgetId="qbo-ps-drawer-ui/product-service-drawer"
            defaultName={newMissingService}
            handleCancel={handleProductServiceDrawerCancel}
            handleSaveSuccess={() => {
              setShowAddServiceDrawer(false);
              timesheetFieldsDataRefetch();
            }}
            showTaxCategories
            showClass
          />
        )}

        {/* Location Drawer */}
        {showAddLocationDrawer && (
          <Widget
            widgetId="qbo-location-drawer/locationdrawer"
            defaultName={newMissingLocation}
            handleCancel={handleLocationDrawerCancel}
            handleSaveSuccess={() => {
              setShowAddLocationDrawer(false);
              timesheetFieldsDataRefetch();
            }}
            showSublocation={false}
          />
        )}

        {/* Class Drawer */}
        {showAddClassDrawer && (
          <Widget
            widgetId="qbo-class-drawer/classdrawer"
            defaultName={newMissingClass}
            handleCancel={handleClassDrawerCancel}
            handleSaveSuccess={async () => {
              setShowAddClassDrawer(false);
              timesheetFieldsDataRefetch();
            }}
          />
        )}

        {/* Save and Export Buttons */}
        <div
          style={{
            marginTop: '24px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            alignItems: 'center',
          }}
        >
          {!tableOnly && <BackButton />}
          <Button
            priority="secondary"
            purpose="standard"
            theme="gbsgexperimental"
            onClick={() =>
              exportTimeEntriesToExcel(flatTimeEntries, 'time_entries.xlsx')
            }
            disabled={flatTimeEntries.length === 0}
          >
            Export to Excel
          </Button>
          <Button
            priority="primary"
            purpose="standard"
            theme="gbsgexperimental"
            onClick={handleLetsGo}
            disabled={
              checkedEntries.size === 0 ||
              isSaving ||
              isPreparingSave ||
              saveResult?.success === true
            }
          >
            {`Save ${checkedEntries.size} out of ${
              reviewTimeEntries.filter((entry: any) => !isEntryLocked(entry))
                .length
            } time ${checkedEntries.size === 1 ? 'entry' : 'entries'}`}
          </Button>
        </div>
      </>
    </div>
  );
};

export default Step4Review;
