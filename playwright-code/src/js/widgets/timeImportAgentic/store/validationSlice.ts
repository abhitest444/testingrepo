import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { resetAllSlices } from './globalActions';

export interface ValidationState {
  isProcessing: boolean;
  validationResults: Record<string, any>;
  employeeMappings: Record<
    string,
    { employeeId: string; employeeName: string }
  >;
  timeEntryValidation: Record<
    string,
    {
      employeeId: string;
      date: string;
      totalHours: number;
      exceeds24Hours: boolean;
      validationErrors: string[];
    }
  >;
  // Pending validation for debounced validation
  pendingValidation: string[];
  // Filtered data based on status
  filteredData: {
    valid: Record<string, any[]>;
    invalid: Record<string, any[]>;
    missingEmployees: Record<string, any[]>;
    needsReview: Record<string, any[]>;
    all: Record<string, any[]>;
  };
  // Current filter
  currentFilter:
    | 'all'
    | 'valid'
    | 'invalid'
    | 'missingEmployees'
    | 'needsReview';
}

const initialState: ValidationState = {
  isProcessing: false,
  validationResults: {},
  employeeMappings: {},
  timeEntryValidation: {},
  pendingValidation: [],
  filteredData: {
    valid: {},
    invalid: {},
    missingEmployees: {},
    needsReview: {},
    all: {},
  },
  currentFilter: 'all',
};

const validationSlice = createSlice({
  name: 'validation',
  initialState,
  reducers: {
    setProcessing: (state, action: PayloadAction<boolean>) => {
      state.isProcessing = action.payload;
    },

    setEmployeeMapping: (
      state,
      action: PayloadAction<{
        originalName: string;
        employeeId: string;
        employeeName: string;
      }>,
    ) => {
      const { originalName, employeeId, employeeName } = action.payload;
      state.employeeMappings[originalName] = { employeeId, employeeName };
    },

    clearEmployeeMapping: (state, action: PayloadAction<string>) => {
      delete state.employeeMappings[action.payload];
    },

    setTimeEntryValidation: (
      state,
      action: PayloadAction<{
        key: string;
        employeeId: string;
        date: string;
        totalHours: number;
        exceeds24Hours: boolean;
        validationErrors: string[];
      }>,
    ) => {
      const { key, ...validationData } = action.payload;
      state.timeEntryValidation[key] = validationData;
    },

    clearTimeEntryValidation: (state, action: PayloadAction<string>) => {
      delete state.timeEntryValidation[action.payload];
    },

    // Pending validation actions
    addPendingValidation: (state, action: PayloadAction<string>) => {
      if (!state.pendingValidation.includes(action.payload)) {
        state.pendingValidation.push(action.payload);
      }
    },

    removePendingValidation: (state, action: PayloadAction<string>) => {
      state.pendingValidation = state.pendingValidation.filter(
        (id) => id !== action.payload,
      );
    },

    clearPendingValidation: (state) => {
      state.pendingValidation = [];
    },

    // Main validation action that handles all the logic
    validateAllTimeEntries: (
      state,
      action: PayloadAction<{
        existingTimeEntries: any[];
        uploadedTimeEntries: any[];
        employeeMappings: Record<
          string,
          { employeeId: string; employeeName: string }
        >;
      }>,
    ) => {
      state.isProcessing = true;
      state.validationResults = {};
      state.timeEntryValidation = {};

      const { existingTimeEntries, uploadedTimeEntries, employeeMappings } =
        action.payload;

      // Step 1: Group existing time entries by employee and date
      const existingByEmployeeAndDate: Record<
        string,
        Record<string, any[]>
      > = {};
      existingTimeEntries.forEach((entry) => {
        if (!existingByEmployeeAndDate[entry.timeForId]) {
          existingByEmployeeAndDate[entry.timeForId] = {};
        }
        if (!existingByEmployeeAndDate[entry.timeForId][entry.date]) {
          existingByEmployeeAndDate[entry.timeForId][entry.date] = [];
        }
        existingByEmployeeAndDate[entry.timeForId][entry.date].push(entry);
      });

      // Step 2: Group uploaded entries by employee and date
      const uploadedByEmployeeAndDate: Record<
        string,
        Record<string, any[]>
      > = {};
      uploadedTimeEntries.forEach((entry) => {
        const { employeeId } = entry;
        if (!uploadedByEmployeeAndDate[employeeId]) {
          uploadedByEmployeeAndDate[employeeId] = {};
        }
        if (!uploadedByEmployeeAndDate[employeeId][entry.date]) {
          uploadedByEmployeeAndDate[employeeId][entry.date] = [];
        }
        uploadedByEmployeeAndDate[employeeId][entry.date].push(entry);
      });

      // Step 3: Validate existing + uploaded combinations
      Object.entries(existingByEmployeeAndDate).forEach(
        ([employeeId, dateEntries]) => {
          Object.entries(dateEntries).forEach(([date, existingEntries]) => {
            const existingHours = existingEntries.reduce(
              (sum, entry) => sum + (entry.duration || 0),
              0,
            );
            const uploadedEntries =
              uploadedByEmployeeAndDate[employeeId]?.[date] || [];
            const uploadedHours = uploadedEntries.reduce((sum, entry) => {
              const hours = entry.calculatedHours || entry.hours || 0;
              return (
                sum +
                (typeof hours === 'number' ? hours : parseFloat(hours) || 0)
              );
            }, 0);

            const totalHours = existingHours + uploadedHours;
            const key = `${employeeId}-${date}`;

            state.timeEntryValidation[key] = {
              employeeId,
              date,
              totalHours,
              exceeds24Hours: totalHours >= 24,
              validationErrors:
                totalHours >= 24
                  ? [
                      `Total hours exceed 24 hours per day limit (Total: ${totalHours.toFixed(
                        2,
                      )}hrs)`,
                    ]
                  : [],
            };
          });
        },
      );

      // Step 4: Validate uploaded entries against each other
      Object.entries(uploadedByEmployeeAndDate).forEach(
        ([employeeId, dateEntries]) => {
          Object.entries(dateEntries).forEach(([date, entries]) => {
            const totalHours = entries.reduce((sum, entry) => {
              const hours = entry.calculatedHours || entry.hours || 0;
              return (
                sum +
                (typeof hours === 'number' ? hours : parseFloat(hours) || 0)
              );
            }, 0);

            const key = `${employeeId}-${date}`;

            // Only set if not already set by existing + uploaded validation
            if (!state.timeEntryValidation[key]) {
              state.timeEntryValidation[key] = {
                employeeId,
                date,
                totalHours,
                exceeds24Hours: totalHours >= 24,
                validationErrors:
                  totalHours >= 24
                    ? [
                        `Total hours exceed 24 hours per day limit (Uploaded total: ${totalHours.toFixed(
                          2,
                        )}hrs)`,
                      ]
                    : [],
              };
            }
          });
        },
      );

      state.isProcessing = false;
    },

    // Action to set filtered data
    setFilteredData: (
      state,
      action: PayloadAction<{
        valid: Record<string, any[]>;
        invalid: Record<string, any[]>;
        missingEmployees: Record<string, any[]>;
        needsReview: Record<string, any[]>;
        all: Record<string, any[]>;
      }>,
    ) => {
      state.filteredData = action.payload;
    },

    // Action to set current filter
    setCurrentFilter: (
      state,
      action: PayloadAction<
        'all' | 'valid' | 'invalid' | 'missingEmployees' | 'needsReview'
      >,
    ) => {
      state.currentFilter = action.payload;
    },

    // Action to update filtered data for a specific employee
    updateEmployeeFilteredData: (
      state,
      action: PayloadAction<{
        employeeName: string;
        entries: any[];
        status:
          | 'valid'
          | 'invalid'
          | 'missingEmployees'
          | 'needsReview'
          | 'all';
      }>,
    ) => {
      const { employeeName, entries, status } = action.payload;
      state.filteredData[status][employeeName] = entries;
    },

    // Action to remove employee from filtered data
    removeEmployeeFromFilteredData: (
      state,
      action: PayloadAction<{
        employeeName: string;
        status:
          | 'valid'
          | 'invalid'
          | 'missingEmployees'
          | 'needsReview'
          | 'all';
      }>,
    ) => {
      const { employeeName, status } = action.payload;
      delete state.filteredData[status][employeeName];
    },

    // Action to clear all filtered data
    clearFilteredData: (state) => {
      state.filteredData = {
        valid: {},
        invalid: {},
        missingEmployees: {},
        needsReview: {},
        all: {},
      };
    },

    // Action to clear all validation
    clearAllValidation: (state) => {
      state.validationResults = {};
      state.timeEntryValidation = {};
      state.filteredData = {
        valid: {},
        invalid: {},
        missingEmployees: {},
        needsReview: {},
        all: {},
      };
      state.isProcessing = false;
    },

    // Reset to initial state
    resetValidationState: (state) => {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(resetAllSlices, (state) => {
      Object.assign(state, initialState);
    });
  },
});

export const {
  setProcessing,
  setEmployeeMapping,
  clearEmployeeMapping,
  setTimeEntryValidation,
  clearTimeEntryValidation,
  addPendingValidation,
  removePendingValidation,
  clearPendingValidation,
  validateAllTimeEntries,
  setFilteredData,
  setCurrentFilter,
  updateEmployeeFilteredData,
  removeEmployeeFromFilteredData,
  clearFilteredData,
  clearAllValidation,
  resetValidationState,
} = validationSlice.actions;

export default validationSlice.reducer;
