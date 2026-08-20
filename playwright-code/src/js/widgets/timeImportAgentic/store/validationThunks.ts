import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  validate24HourLimits,
  validateMissingFields,
  filterAndCategorizeTimeEntries,
  mapTimeEntriesWithEmployee,
  mapEmployeeName,
  getValidTimeEntries,
} from '../services/validationService';
import {
  validateAllTimeEntries,
  setEmployeeMapping,
  setFilteredData,
  setTimeEntryValidation,
} from './validationSlice';
import { normalizeDate } from '../utils/timezoneUtils';

// Thunk to handle complete validation process
export const performCompleteValidation = createAsyncThunk(
  'validation/performCompleteValidation',
  async (
    payload: {
      originalName: string;
      dasEmployees: any[];
      uxEmployeeMappings: Record<string, any>;
      existingTimeEntries: any[];
      uploadedTimeEntries: any[];
      customers: any[];
      services: any[];
      classes: any[];
      locations: any[];
    },
    { dispatch },
  ) => {
    const {
      originalName,
      dasEmployees,
      uxEmployeeMappings,
      existingTimeEntries,
      uploadedTimeEntries,
      customers,
      services,
      classes,
      locations,
    } = payload;

    // Step 1: Map employee name
    const mappingResult = await mapEmployeeName(
      originalName,
      dasEmployees,
      uxEmployeeMappings,
    );

    if (
      mappingResult.matched &&
      mappingResult.employeeId &&
      mappingResult.employeeName
    ) {
      // Step 2: Set employee mapping in Redux
      dispatch(
        setEmployeeMapping({
          originalName,
          employeeId: mappingResult.employeeId,
          employeeName: mappingResult.employeeName,
        }),
      );

      // Step 3: Map time entries with employee ID
      const mappedTimeEntries = mapTimeEntriesWithEmployee(
        uploadedTimeEntries,
        {
          [originalName]: {
            employeeId: mappingResult.employeeId,
            employeeName: mappingResult.employeeName,
          },
        },
      );

      // Step 4: Validate 24-hour limits
      const validationResults = validate24HourLimits(
        existingTimeEntries,
        mappedTimeEntries,
      );

      // Step 5: Validate missing fields
      const validatedTimeEntries = validateMissingFields(
        mappedTimeEntries,
        customers,
        services,
        classes,
        locations,
        {}, // No column mappings available in this context
      );

      // Step 6: Dispatch validation results
      dispatch(
        validateAllTimeEntries({
          existingTimeEntries,
          uploadedTimeEntries: validatedTimeEntries,
          employeeMappings: {
            [originalName]: {
              employeeId: mappingResult.employeeId,
              employeeName: mappingResult.employeeName,
            },
          },
        }),
      );

      // Step 7: Filter and categorize entries
      const filteredData = filterAndCategorizeTimeEntries(
        validatedTimeEntries,
        validationResults,
      );
      dispatch(setFilteredData(filteredData));

      return {
        mappingResult,
        validationResults,
        validatedTimeEntries,
        filteredData,
      };
    }

    return {
      mappingResult,
      validationResults: {},
      validatedTimeEntries: uploadedTimeEntries,
    };
  },
);

// Thunk to validate all time entries at once
export const validateAllTimeEntriesThunk = createAsyncThunk(
  'validation/validateAllTimeEntriesThunk',
  async (
    payload: {
      existingTimeEntries: any[];
      uploadedTimeEntries: any[];
      customers: any[];
      services: any[];
      classes: any[];
      locations: any[];
      columnMappings?: Record<string, string>;
      companySettings?: any;
    },
    { dispatch, getState },
  ) => {
    const {
      existingTimeEntries,
      customers,
      services,
      classes,
      locations,
      columnMappings = {},
      companySettings = null,
    } = payload;

    // IMPORTANT: Get fresh uploaded entries from Redux state instead of using stale parameter
    // This ensures we validate the most up-to-date data (e.g., after locationId/classId updates)
    const state: any = getState();
    const allUploadedTimeEntries = Object.values(
      state.excelData.employeeGroupedTimeEntries || {},
    ).flat();

    // PERFORMANCE: Filter out locked entries early to reduce validation dataset
    const lockedDates = state.timeEntries.lockedDates || [];

    const uploadedTimeEntries = allUploadedTimeEntries.filter((entry: any) => {
      // Skip locked entries - they don't need validation as they can't be saved
      if (entry.employeeId && entry.date) {
        const entryDate = normalizeDate(entry.date);
        const isLocked = lockedDates.some(
          (locked: any) =>
            locked.employeeId === entry.employeeId && locked.date === entryDate,
        );
        return !isLocked;
      }
      return true; // Keep entries without employeeId/date for validation
    });

    // Validate 24-hour limits using the service (with proper date normalization)
    const validationResults = validate24HourLimits(
      existingTimeEntries,
      uploadedTimeEntries,
    );

    // Validate missing fields - this returns entries with validationErrors array
    const validatedTimeEntries = validateMissingFields(
      uploadedTimeEntries,
      customers,
      services,
      classes,
      locations,
      columnMappings,
      companySettings || state.companySettings.settings,
    );

    // Update employeeGroupedTimeEntries with validation results
    // Import the updateTimeEntry action dynamically to avoid circular dependency
    const { updateTimeEntry } = await import('./excelDataSlice');

    validatedTimeEntries.forEach((validatedEntry: any) => {
      dispatch(
        updateTimeEntry({
          id: validatedEntry.id,
          updates: {
            validationErrors: validatedEntry.validationErrors || [],
            status: validatedEntry.status || 'Valid',
          },
        }),
      );
    });

    // Set the validation results directly instead of using the slice's logic
    // We need to set each validation result individually
    Object.entries(validationResults).forEach(([key, validation]) => {
      dispatch(
        setTimeEntryValidation({
          key,
          employeeId: validation.employeeId,
          date: validation.date,
          totalHours: validation.totalHours,
          exceeds24Hours: validation.exceeds24Hours,
          validationErrors: validation.validationErrors,
        }),
      );
    });

    // Filter and categorize entries
    const filteredData = filterAndCategorizeTimeEntries(
      validatedTimeEntries,
      validationResults,
    );
    dispatch(setFilteredData(filteredData));

    return {
      validationResults,
      validatedTimeEntries,
      filteredData,
    };
  },
);

// Thunk to get valid time entries for accept all
export const getValidTimeEntriesThunk = createAsyncThunk(
  'validation/getValidTimeEntriesThunk',
  async (
    payload: {
      timeEntries: any[];
      validationResults: Record<string, any>;
    },
    { getState },
  ) => {
    const { timeEntries, validationResults } = payload;

    const validTimeEntries = getValidTimeEntries(
      timeEntries,
      validationResults,
    );

    return validTimeEntries;
  },
);
