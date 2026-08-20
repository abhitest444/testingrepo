import { createSelector } from '@reduxjs/toolkit';
import dayjs, { Dayjs } from 'dayjs';
import { RootState } from './index';

// Step 1 slice selectors
export const selectStep1State = (state: RootState) => state.step1;
export const selectMaxHoursPerDay = (state: RootState) =>
  state.step1.maxHoursPerDay;
export const selectStep1Loading = (state: RootState) => state.step1.isLoading;
export const selectStep1Error = (state: RootState) => state.step1.error;

// Employee data slice selectors
export const selectEmployeeDataState = (state: RootState) => state.employeeData;
export const selectEmployees = (state: RootState) =>
  state.employeeData.employees;
export const selectIsLoadingEmployees = (state: RootState) =>
  state.employeeData.loading;
export const selectEmployeesError = (state: RootState) =>
  state.employeeData.error;

// Excel data slice selectors
export const selectExcelDataState = (state: RootState) => state.excelData;
export const selectUploadId = (state: RootState) => state.excelData.uploadId;
export const selectUploadFileName = (state: RootState) =>
  state.excelData.uploadFileName;
export const selectExcelColumns = (state: RootState) =>
  state.excelData.excelColumns;
export const selectMappedColumns = (state: RootState) =>
  state.excelData.mappedColumns;
export const selectMappedColumnMappings = (state: RootState) =>
  state.excelData.mappedColumnMappings;
export const selectMappedColumnCheckboxes = (state: RootState) =>
  state.excelData.mappedColumnCheckboxes;
export const selectUnknownColumns = (state: RootState) =>
  state.excelData.unknownColumns;
export const selectUnknownMappings = (state: RootState) =>
  state.excelData.unknownMappings;
export const selectUnknownCheckboxes = (state: RootState) =>
  state.excelData.unknownCheckboxes;
export const selectRawExcelData = (state: RootState) =>
  state.excelData.rawExcelData;
// Computed selector: flattens employeeGroupedTimeEntries into a flat array
export const selectProcessedTimeEntries = createSelector(
  [(state: RootState) => state.excelData.employeeGroupedTimeEntries],
  (employeeGroupedTimeEntries) =>
    Object.values(employeeGroupedTimeEntries).flat(),
);
// Memoized selector to prevent unnecessary re-renders when object reference changes but content is the same
export const selectEmployeeGroupedTimeEntries = createSelector(
  [(state: RootState) => state.excelData.employeeGroupedTimeEntries],
  (employeeGroupedTimeEntries) => employeeGroupedTimeEntries,
);
export const selectEmployeeMappings = (state: RootState) =>
  state.excelData.employeeMappings;
// Weekly time entries selectors (separate slice)
export const selectWeeklyTimeEntriesState = (state: RootState) =>
  state.weeklyTimeEntries;
export const selectWeeklyTimeEntriesByEmployee = (state: RootState) =>
  state.weeklyTimeEntries.entriesByEmployee;
export const selectWeeklyTimeEntriesLoading = (state: RootState) =>
  state.weeklyTimeEntries.loading;

// Scanned data slice selectors
export const selectScannedDataState = (state: RootState) => state.scannedData;
export const selectScannedEntries = (state: RootState) =>
  state.scannedData.entries ?? [];
export const selectIsExtracting = (state: RootState) =>
  state.scannedData.isExtracting;
export const selectExtractionError = (state: RootState) =>
  state.scannedData.extractionError;
export const selectWeeklyTimeEntriesError = (state: RootState) =>
  state.weeklyTimeEntries.error;
export const selectWeeklyTimeEntriesLastFetched = (state: RootState) =>
  state.weeklyTimeEntries.lastFetched;
export const selectIsUploading = (state: RootState) =>
  state.excelData.isUploading;
export const selectUploadProgress = (state: RootState) =>
  state.excelData.uploadProgress;
export const selectUploadError = (state: RootState) =>
  state.excelData.uploadError;
export const selectIsProcessingFile = (state: RootState) =>
  state.excelData.isProcessingFile;
export const selectProcessingError = (state: RootState) =>
  state.excelData.processingError;
export const selectQBTimeFields = (state: RootState) =>
  state.excelData.qbTimeFields;
export const selectIsLoadingQBTimeFields = (state: RootState) =>
  state.excelData.isLoadingQBTimeFields;
export const selectQBTimeFieldsError = (state: RootState) =>
  state.excelData.qbTimeFieldsError;

// Custom fields selectors (separate slice)
export const selectCustomFields = (state: RootState) =>
  state.customFields.customFields;
export const selectCustomFieldsLoading = (state: RootState) =>
  state.customFields.loading;
export const selectCustomFieldsError = (state: RootState) =>
  state.customFields.error;

// Timesheet fields data selectors (separate slice)
export const selectTimesheetFieldsDataState = (state: RootState) =>
  state.timesheetFieldsData;
export const selectCustomers = (state: RootState) =>
  state.timesheetFieldsData.customers;
export const selectServices = (state: RootState) =>
  state.timesheetFieldsData.services;
export const selectClasses = (state: RootState) =>
  state.timesheetFieldsData.classes;
export const selectDepartments = (state: RootState) =>
  state.timesheetFieldsData.departments;
export const selectTimesheetFieldsLoading = (state: RootState) =>
  state.timesheetFieldsData.loading;
export const selectTimesheetFieldsError = (state: RootState) =>
  state.timesheetFieldsData.error;
export const selectTimesheetFieldsHasLoaded = (state: RootState) =>
  state.timesheetFieldsData.hasLoaded;

// Review slice selectors
export const selectReviewState = (state: RootState) => state.review;
export const selectTimeEntries = (state: RootState) => state.review.timeEntries;
export const selectSelectedFilter = (state: RootState) =>
  state.review.selectedFilter;
export const selectAcceptedEmployees = (state: RootState) =>
  new Set(state.review.acceptedEmployees);
export const selectCheckedEntries = (state: RootState) =>
  new Set(
    (state.review.checkedEntries || []).filter((id) => id != null && id !== ''),
  );
export const selectIsSaving = (state: RootState) => state.review.isSaving;
export const selectSaveResult = (state: RootState) => state.review.saveResult;
export const selectSaveError = (state: RootState) => state.review.saveError;
export const selectIsImporting = (state: RootState) => state.review.isImporting;
export const selectImportProgress = (state: RootState) =>
  state.review.importProgress;
export const selectImportError = (state: RootState) => state.review.importError;
export const selectConsentChecked = (state: RootState) =>
  state.review.consentChecked;
export const selectIsExporting = (state: RootState) => state.review.isExporting;
export const selectExportError = (state: RootState) => state.review.exportError;
export const selectHasValidationErrors = (state: RootState) =>
  state.review.hasValidationErrors;
export const selectValidationErrorCount = (state: RootState) =>
  state.review.validationErrorCount;

// Progress slice selectors
export const selectProgressState = (state: RootState) => state.progress;
export const selectCurrentStep = (state: RootState) =>
  state.progress.currentStep;
export const selectTotalSteps = (state: RootState) => state.progress.totalSteps;
export const selectIsTrowserOpen = (state: RootState) =>
  state.progress.isTrowserOpen;
export const selectCardFadeOut = (state: RootState) =>
  state.progress.cardFadeOut;
export const selectIsGlobalProcessing = (state: RootState) =>
  state.progress.isProcessing;
export const selectLoadingMessage = (state: RootState) =>
  state.progress.loadingMessage;
export const selectCompletedSteps = (state: RootState) =>
  state.progress.completedSteps;

export const selectVisitedSteps = (state: RootState) =>
  state.progress.visitedSteps;

// Computed selectors for employee
export const selectEmployeeById = (id: string) => (state: RootState) =>
  state.employeeData.employees.find((emp: any) => emp.id === id);

// Computed selectors for excel data
export const selectHasExcelColumns = createSelector(
  [selectExcelColumns],
  (excelColumns) => excelColumns.length > 0,
);

// These selectors are now direct state selectors, no need for computed selectors

export const selectIsUploadComplete = createSelector(
  [selectIsUploading, selectUploadProgress],
  (isUploading, progress) => !isUploading && progress === 100,
);

// Computed selectors for review
export const selectFilteredTimeEntries = createSelector(
  [selectTimeEntries, selectSelectedFilter],
  (timeEntries, selectedFilter) => {
    switch (selectedFilter) {
      case 'valid':
        return timeEntries.filter(
          (entry) => entry.status === 'Valid' || entry.status === 'Approved',
        );
      case 'missing':
        return timeEntries.filter(
          (entry) =>
            entry.validationErrors.length > 0 &&
            !entry.validationErrors.includes('overtime') &&
            !entry.validationErrors.includes(
              'Total hours exceed 24 hours per day limit',
            ) &&
            !entry.isMissingEmployee,
        );
      case 'invalid':
        return timeEntries.filter(
          (entry) =>
            entry.status === 'Invalid' ||
            entry.validationErrors.includes('overtime'),
        );
      case 'all':
      default:
        return timeEntries;
    }
  },
);

export const selectGroupedTimeEntries = createSelector(
  [selectFilteredTimeEntries],
  (filteredTimeEntries) =>
    filteredTimeEntries.reduce((acc, entry) => {
      if (!acc[entry.employee]) {
        acc[entry.employee] = [];
      }
      acc[entry.employee].push(entry);
      return acc;
    }, {} as Record<string, typeof filteredTimeEntries>),
);

export const selectTimeEntriesByEmployee = (employeeName: string) =>
  createSelector([selectTimeEntries], (timeEntries) =>
    timeEntries.filter((entry) => entry.employee === employeeName),
  );

export const selectValidTimeEntriesCount = createSelector(
  [selectTimeEntries],
  (timeEntries) =>
    timeEntries.filter(
      (entry) => entry.status === 'Valid' || entry.status === 'Approved',
    ).length,
);

export const selectMissingTimeEntriesCount = createSelector(
  [selectTimeEntries],
  (timeEntries) =>
    timeEntries.filter(
      (entry) =>
        entry.validationErrors.length > 0 &&
        !entry.validationErrors.includes('overtime') &&
        !entry.validationErrors.includes(
          'Total hours exceed 24 hours per day limit',
        ) &&
        !entry.isMissingEmployee,
    ).length,
);

export const selectInvalidTimeEntriesCount = createSelector(
  [selectTimeEntries],
  (timeEntries) =>
    timeEntries.filter(
      (entry) =>
        entry.status === 'Invalid' ||
        entry.validationErrors.includes('overtime'),
    ).length,
);

export const selectAllTimeEntriesCount = createSelector(
  [selectTimeEntries],
  (timeEntries) => timeEntries.length,
);

// Computed selectors for progress
export const selectStepProgressPercentage = createSelector(
  [selectCurrentStep, selectTotalSteps],
  (currentStep, totalSteps) => (currentStep / totalSteps) * 100,
);

// Combined selectors for common use cases
export const selectDemoState = createSelector(
  [
    selectStep1State,
    selectExcelDataState,
    selectReviewState,
    selectProgressState,
  ],
  (step1, excelData, review, progress) => ({
    step1,
    excelData,
    review,
    progress,
  }),
);

export const selectIsDemoReady = createSelector(
  [
    selectCurrentStep,
    selectIsUploading,
    selectIsProcessingFile,
    selectIsSaving,
    selectIsImporting,
  ],
  (currentStep, isUploading, isProcessingFile, isSaving, isImporting) =>
    !isUploading && !isProcessingFile && !isSaving && !isImporting,
);

// Time Entries selectors (new slice)
export const selectTimeEntriesState = (state: RootState) => state.timeEntries;
export const selectTimeEntriesData = (state: RootState) =>
  state.timeEntries.timeEntries;
export const selectTimeEntriesLoading = (state: RootState) =>
  state.timeEntries.loading;
export const selectTimeEntriesError = (state: RootState) =>
  state.timeEntries.error;
export const selectTimeEntriesLastFetched = (state: RootState) =>
  state.timeEntries.lastFetched;
export const selectLockedDates = (state: RootState) =>
  state.timeEntries.lockedDates;

// Validation selectors
export const selectIsValidating = (state: RootState) =>
  state.review.isValidating;
export const selectHasUserChanges = (state: RootState) =>
  state.review.hasUserChanges;
export const selectNeedsRevalidation = (state: RootState) =>
  state.review.needsRevalidation;

// UX Preferences selectors (REALM-scoped - company-wide settings)
export const selectUxPreferencesState = (state: RootState) =>
  state.uxPreferences;
export const selectUxPreferencesData = (state: RootState) =>
  state.uxPreferences.data;
export const selectUxPreferencesLoading = (state: RootState) =>
  state.uxPreferences.loading;
export const selectUxPreferencesError = (state: RootState) =>
  state.uxPreferences.error;

// AI Import Preferences selectors (USER-scoped - personal preferences)
export const selectAIImportPreferencesState = (state: RootState) =>
  state.aiImportPreferences;
export const selectAIColumnMappings = (state: RootState) =>
  state.aiImportPreferences.columnMappings;
export const selectAIImpose8HourLimit = (state: RootState) =>
  state.aiImportPreferences.impose8HourLimit;
export const selectAIPreferencesSeen = (state: RootState) =>
  state.aiImportPreferences.preferencesSeen;
export const selectAISkipFieldMapping = (state: RootState) =>
  state.aiImportPreferences.skipFieldMapping;
export const selectAIPreferencesLoading = (state: RootState) =>
  state.aiImportPreferences.loading;
export const selectAIPreferencesError = (state: RootState) =>
  state.aiImportPreferences.error;

// Field mappings selectors
export const selectFieldMappingsState = (state: RootState) =>
  state.fieldMappings;
export const selectUnmatchedClasses = (state: RootState) =>
  state.fieldMappings.unmatchedClasses;
export const selectUnmatchedServices = (state: RootState) =>
  state.fieldMappings.unmatchedServices;
export const selectUnmatchedLocations = (state: RootState) =>
  state.fieldMappings.unmatchedLocations;
export const selectUnmatchedCustomers = (state: RootState) =>
  state.fieldMappings.unmatchedCustomers;
export const selectUnmatchedCustomFieldDropdownValues = (state: RootState) =>
  state.fieldMappings.unmatchedCustomFieldDropdownValues;
export const selectIsProcessingFieldMappings = (state: RootState) =>
  state.fieldMappings.isProcessing;
export const selectFieldMappingsError = (state: RootState) =>
  state.fieldMappings.processingError;

// Selector to check if a time entry has any unmatched fields
export const selectHasUnmatchedFields = createSelector(
  [
    selectUnmatchedClasses,
    selectUnmatchedServices,
    selectUnmatchedLocations,
    selectUnmatchedCustomers,
    (_state: RootState, entryId: string) => entryId,
  ],
  (
    unmatchedClasses,
    unmatchedServices,
    unmatchedLocations,
    unmatchedCustomers,
    entryId,
  ) => {
    // Check if entryId is in any unmatched field's affected entries
    const hasUnmatchedClass = Object.values(unmatchedClasses).some((field) =>
      field.affectedEntryIds.includes(entryId),
    );
    const hasUnmatchedService = Object.values(unmatchedServices).some((field) =>
      field.affectedEntryIds.includes(entryId),
    );
    const hasUnmatchedLocation = Object.values(unmatchedLocations).some(
      (field) => field.affectedEntryIds.includes(entryId),
    );
    const hasUnmatchedCustomer = Object.values(unmatchedCustomers).some(
      (field) => field.affectedEntryIds.includes(entryId),
    );

    return (
      hasUnmatchedClass ||
      hasUnmatchedService ||
      hasUnmatchedLocation ||
      hasUnmatchedCustomer
    );
  },
);

// Combined selector for Step 5 Review screen data
// Reduces number of useSelector calls from 15+ to 1
export const selectReviewScreenData = createSelector(
  [
    selectTimeEntries, // Use review.timeEntries instead of employeeGroupedTimeEntries (has nullification applied)
    selectEmployeeMappings,
    selectAcceptedEmployees,
    selectCheckedEntries,
    selectSelectedFilter,
    selectIsImporting,
    selectHasValidationErrors,
    selectMappedColumnCheckboxes,
    selectMappedColumnMappings,
    selectIsValidating,
    selectHasUserChanges,
    selectNeedsRevalidation,
    (state: RootState) => state.review.isPreparingSave,
    (state: RootState) => state.timeEntries.lockedDates || [],
    (state: RootState) => state.validation.timeEntryValidation,
    (state: RootState) => state.validation.validationResults || {},
  ],
  (
    timeEntries, // Renamed from employeeGroupedTimeEntries
    employeeMappings,
    acceptedEmployees,
    checkedEntries,
    selectedFilter,
    isImporting,
    hasValidationErrors,
    mappedColumnCheckboxes,
    mappedColumnMappings,
    isValidating,
    hasUserChanges,
    needsRevalidation,
    isPreparingSave,
    lockedDates,
    timeEntryValidation,
    validationEntries,
  ) => ({
    timeEntries, // Renamed from employeeGroupedTimeEntries
    employeeMappings,
    acceptedEmployees,
    checkedEntries,
    selectedFilter,
    isImporting,
    hasValidationErrors,
    mappedColumnCheckboxes,
    mappedColumnMappings,
    isValidating,
    hasUserChanges,
    needsRevalidation,
    isPreparingSave,
    lockedDates,
    timeEntryValidation,
    validationEntries,
  }),
);

// Combined selector for timesheet fields data
export const selectTimesheetFieldsData = createSelector(
  [
    selectCustomers,
    selectServices,
    selectClasses,
    selectDepartments,
    selectTimesheetFieldsHasLoaded,
  ],
  (customers, services, classes, departments, hasLoaded) => ({
    customers,
    services,
    classes,
    locations: departments,
    hasLoaded,
  }),
);
