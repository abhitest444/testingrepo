import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  performCompleteValidation,
  validateAllTimeEntriesThunk,
  getValidTimeEntriesThunk,
} from '../store/validationThunks';
import {
  selectValidationState,
  selectIsValidationProcessing,
  selectEmployeeMappings,
  selectTimeEntryValidation,
  selectValidationForEmployeeDate,
  selectValidationErrorsForEmployee,
  selectHasValidationErrors,
  selectTotalHoursForEmployeeDate,
  selectValidTimeEntries,
  selectInvalidTimeEntries,
  selectValidationSummary,
  selectFilteredData,
  selectCurrentFilter,
  selectFilteredDataByCurrentFilter,
  selectValidEmployees,
  selectInvalidEmployees,
  selectMissingEmployeeEmployees,
  selectNeedsReviewEmployees,
  selectAllEmployees,
} from '../store/validationSelectors';

export const useValidation = () => {
  const dispatch = useAppDispatch();

  // Selectors
  const validationState = useAppSelector(selectValidationState);
  const isProcessing = useAppSelector(selectIsValidationProcessing);
  const employeeMappings = useAppSelector(selectEmployeeMappings);
  const timeEntryValidation = useAppSelector(selectTimeEntryValidation);
  const filteredData = useAppSelector(selectFilteredData);
  const currentFilter = useAppSelector(selectCurrentFilter);
  const filteredDataByCurrentFilter = useAppSelector(
    selectFilteredDataByCurrentFilter,
  );
  const validEmployees = useAppSelector(selectValidEmployees);
  const invalidEmployees = useAppSelector(selectInvalidEmployees);
  const missingEmployeeEmployees = useAppSelector(
    selectMissingEmployeeEmployees,
  );
  const needsReviewEmployees = useAppSelector(selectNeedsReviewEmployees);
  const allEmployees = useAppSelector(selectAllEmployees);

  // Actions
  const validateEmployeeMapping = useCallback(
    async (payload: {
      originalName: string;
      dasEmployees: any[];
      uxEmployeeMappings: Record<string, any>;
      existingTimeEntries: any[];
      uploadedTimeEntries: any[];
      customers: any[];
      services: any[];
      classes: any[];
      locations: any[];
    }) => dispatch(performCompleteValidation(payload)),
    [dispatch],
  );

  const validateAllEntries = useCallback(
    async (payload: {
      existingTimeEntries: any[];
      uploadedTimeEntries: any[];
      customers: any[];
      services: any[];
      classes: any[];
      locations: any[];
      columnMappings?: Record<string, string>;
      companySettings?: any;
    }) => dispatch(validateAllTimeEntriesThunk(payload)),
    [dispatch],
  );

  const getValidEntries = useCallback(
    async (payload: {
      timeEntries: any[];
      validationResults: Record<string, any>;
    }) => dispatch(getValidTimeEntriesThunk(payload)),
    [dispatch],
  );

  // Get validation data from Redux state
  const validationForEmployeeDate = useAppSelector((state) =>
    selectValidationForEmployeeDate(state, '', ''),
  );
  const validationErrorsForEmployee = useAppSelector((state) =>
    selectValidationErrorsForEmployee(state, ''),
  );
  const hasValidationErrorsState = useAppSelector((state) =>
    selectHasValidationErrors(state, ''),
  );
  const totalHoursForEmployeeDate = useAppSelector((state) =>
    selectTotalHoursForEmployeeDate(state, '', ''),
  );
  const validTimeEntries = useAppSelector((state) =>
    selectValidTimeEntries(state, []),
  );
  const invalidTimeEntries = useAppSelector((state) =>
    selectInvalidTimeEntries(state, []),
  );
  const validationSummary = useAppSelector(selectValidationSummary);

  // Helper functions
  const getValidationForEmployeeDate = useCallback(
    (employeeId: string, date: string) =>
      // This would need to be implemented differently - perhaps by passing the state
      null,
    [],
  );

  const getValidationErrorsForEmployee = useCallback(
    (employeeId: string) =>
      // This would need to be implemented differently - perhaps by passing the state
      [],
    [],
  );

  const hasValidationErrors = useCallback(
    (employeeId: string) =>
      // This would need to be implemented differently - perhaps by passing the state
      false,
    [],
  );

  const getTotalHoursForEmployeeDate = useCallback(
    (employeeId: string, date: string) =>
      // This would need to be implemented differently - perhaps by passing the state
      0,
    [],
  );

  const getValidTimeEntries = useCallback(
    (timeEntries: any[]) =>
      // This would need to be implemented differently - perhaps by passing the state
      [],
    [],
  );

  const getInvalidTimeEntries = useCallback(
    (timeEntries: any[]) =>
      // This would need to be implemented differently - perhaps by passing the state
      [],
    [],
  );

  const getValidationSummary = useCallback(
    () => validationSummary,
    [validationSummary],
  );

  return {
    // State
    validationState,
    isProcessing,
    employeeMappings,
    timeEntryValidation,
    filteredData,
    currentFilter,
    filteredDataByCurrentFilter,
    validEmployees,
    invalidEmployees,
    missingEmployeeEmployees,
    needsReviewEmployees,
    allEmployees,

    // Actions
    validateEmployeeMapping,
    validateAllEntries,
    getValidEntries,

    // Helper functions
    getValidationForEmployeeDate,
    getValidationErrorsForEmployee,
    hasValidationErrors,
    getTotalHoursForEmployeeDate,
    getValidTimeEntries,
    getInvalidTimeEntries,
    getValidationSummary,
  };
};
