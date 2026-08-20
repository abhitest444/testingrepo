import { createSelector } from '@reduxjs/toolkit';
import { RootState } from './index';

// Basic selectors
export const selectValidationState = (state: RootState) => state.validation;
export const selectIsValidationProcessing = (state: RootState) =>
  state.validation.isProcessing;
export const selectEmployeeMappings = (state: RootState) =>
  state.validation.employeeMappings;
export const selectTimeEntryValidation = (state: RootState) =>
  state.validation.timeEntryValidation;

// Complex selectors
export const selectValidationForEmployeeDate = createSelector(
  [
    selectTimeEntryValidation,
    (state: RootState, employeeId: string, date: string) => ({
      employeeId,
      date,
    }),
  ],
  (validation, { employeeId, date }) => {
    const key = `${employeeId}-${date}`;
    return validation[key] || null;
  },
);

export const selectValidationErrorsForEmployee = createSelector(
  [
    selectTimeEntryValidation,
    (state: RootState, employeeId: string) => employeeId,
  ],
  (validation, employeeId) =>
    Object.entries(validation)
      .filter(([key, validation]) => key.startsWith(`${employeeId}-`))
      .map(([key, validation]) => validation.validationErrors)
      .flat(),
);

export const selectHasValidationErrors = createSelector(
  [
    selectTimeEntryValidation,
    (state: RootState, employeeId: string) => employeeId,
  ],
  (validation, employeeId) =>
    Object.entries(validation).some(
      ([key, validation]) =>
        key.startsWith(`${employeeId}-`) && validation.exceeds24Hours,
    ),
);

export const selectTotalHoursForEmployeeDate = createSelector(
  [
    selectTimeEntryValidation,
    (state: RootState, employeeId: string, date: string) => ({
      employeeId,
      date,
    }),
  ],
  (validation, { employeeId, date }) => {
    const key = `${employeeId}-${date}`;
    return validation[key]?.totalHours || 0;
  },
);

export const selectValidTimeEntries = createSelector(
  [
    selectTimeEntryValidation,
    (state: RootState, timeEntries: any[]) => timeEntries,
  ],
  (validation, timeEntries) =>
    timeEntries.filter((entry) => {
      const key = `${entry.employeeId}-${entry.date}`;
      const validationResult = validation[key];
      return !validationResult || !validationResult.exceeds24Hours;
    }),
);

export const selectInvalidTimeEntries = createSelector(
  [
    selectTimeEntryValidation,
    (state: RootState, timeEntries: any[]) => timeEntries,
  ],
  (validation, timeEntries) =>
    timeEntries.filter((entry) => {
      const key = `${entry.employeeId}-${entry.date}`;
      const validationResult = validation[key];
      return validationResult && validationResult.exceeds24Hours;
    }),
);

export const selectValidationSummary = createSelector(
  [selectTimeEntryValidation],
  (validation) => {
    const totalEntries = Object.keys(validation).length;
    const invalidEntries = Object.values(validation).filter(
      (v) => v.exceeds24Hours,
    ).length;
    const validEntries = totalEntries - invalidEntries;

    return {
      totalEntries,
      validEntries,
      invalidEntries,
      hasErrors: invalidEntries > 0,
    };
  },
);

// Filtered data selectors
export const selectFilteredData = (state: RootState) =>
  state.validation.filteredData;
export const selectCurrentFilter = (state: RootState) =>
  state.validation.currentFilter;

export const selectFilteredDataByCurrentFilter = createSelector(
  [selectFilteredData, selectCurrentFilter],
  (filteredData, currentFilter) => filteredData[currentFilter],
);

export const selectValidEmployees = createSelector(
  [selectFilteredData],
  (filteredData) => Object.keys(filteredData.valid),
);

export const selectInvalidEmployees = createSelector(
  [selectFilteredData],
  (filteredData) => Object.keys(filteredData.invalid),
);

export const selectMissingEmployeeEmployees = createSelector(
  [selectFilteredData],
  (filteredData) => Object.keys(filteredData.missingEmployees),
);

export const selectNeedsReviewEmployees = createSelector(
  [selectFilteredData],
  (filteredData) => Object.keys(filteredData.needsReview),
);

export const selectAllEmployees = createSelector(
  [selectFilteredData],
  (filteredData) => Object.keys(filteredData.all),
);
