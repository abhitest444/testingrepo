import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { quickFuzzyMatch } from '../utils/EmployeeNameMatcher';
import { resetAllSlices } from './globalActions';

export interface TimeSheetEntry {
  id: string;
  employee: string;
  date: string;
  hours: number;
  customer?: string;
  client?: string;
  costRate?: number;
  billable?: boolean;
  billRate?: number;
  notes?: string;
  serviceItem?: string;
  serviceItemId?: string;
  mileage?: number;
  [key: string]: any; // For custom fields
}

export interface ProcessedTimeEntry {
  employeeId: string;
  employeeName: string;
  [key: string]: any; // All other fields from Excel
}

export interface EmployeeGroupedTimeEntries {
  [employeeName: string]: ProcessedTimeEntry[];
}

export interface ExcelDataState {
  // Upload tracking
  uploadId: string; // Unique ID for each file upload (UUID)
  uploadFileName: string; // Original file name for preview (e.g. "timesheet.xlsx")
  uploadStartTime: number | null; // Timestamp when upload started (for performance tracking)

  // Excel file data
  excelColumns: string[];
  rawExcelData: any[][];
  // processedTimeEntries removed - use Object.values(employeeGroupedTimeEntries).flat() instead
  employeeGroupedTimeEntries: EmployeeGroupedTimeEntries;

  // File processing state
  isUploading: boolean;
  uploadProgress: number;
  uploadError: string | null;
  isProcessingFile: boolean;
  processingError: string | null;

  // Column mapping data
  mappedColumns: string[];
  mappedColumnMappings: Record<string, string>;
  mappedColumnCheckboxes: Record<string, boolean>;

  unknownColumns: string[];
  unknownMappings: Record<string, string>;
  unknownCheckboxes: Record<string, boolean>;

  // QB Time fields
  qbTimeFields: string[];
  isLoadingQBTimeFields: boolean;
  qbTimeFieldsError: string | null;

  // Employee mapping - store complete employee objects
  employeeMappings: Record<
    string,
    {
      id: string;
      name: string;
      type: string;
      [key: string]: any; // Allow additional fields from backend
    }
  >;
  uxEmployeeMappings: Record<
    string,
    {
      id: string;
      name: string;
      type: string;
      [key: string]: any; // Allow additional fields from backend
    }
  >;
}

const initialState: ExcelDataState = {
  // Upload tracking
  uploadId: '', // Will be set when file is uploaded
  uploadFileName: '',
  uploadStartTime: null, // Will be set when upload starts

  // Excel file data
  excelColumns: [],
  rawExcelData: [],
  employeeGroupedTimeEntries: {},

  // File processing state
  isUploading: false,
  uploadProgress: 0,
  uploadError: null,
  isProcessingFile: false,
  processingError: null,

  // Column mapping data
  mappedColumns: [],
  mappedColumnMappings: {},
  mappedColumnCheckboxes: {},

  unknownColumns: [],
  unknownMappings: {},
  unknownCheckboxes: {},

  // QB Time fields
  qbTimeFields: [
    'employee',
    'date',
    'start time',
    'end time',
    'hours',
    'cost rate',
    'billable',
    'bill rate',
    'notes',
    'service item',
    'class',
    'location',
  ],
  isLoadingQBTimeFields: false,
  qbTimeFieldsError: null,

  // Employee mapping
  employeeMappings: {},
  uxEmployeeMappings: {},
};

export const excelDataSlice = createSlice({
  name: 'excelData',
  initialState,
  reducers: {
    // Excel columns actions
    setExcelColumns: (state, action: PayloadAction<string[]>) => {
      // Generate new upload ID when new columns are set (new file uploaded)
      state.uploadId = uuidv4();
      state.uploadStartTime = Date.now(); // Track performance

      state.excelColumns = action.payload;

      // Initialize required columns as mapped
      const requiredColumns = ['username', 'date', 'hours'];
      const mappedCols: string[] = [];
      const unknownCols: string[] = [];

      action.payload.forEach((column) => {
        // Extract the base column name (remove suffix like -1, -2, etc.)
        const baseColumnName = column.replace(/-\d+$/, '').toLowerCase();

        if (requiredColumns.includes(baseColumnName)) {
          // Required columns go to mapped columns
          mappedCols.push(column);
          state.mappedColumnCheckboxes[column] = true;

          // Set required mappings
          switch (baseColumnName) {
            case 'username':
              state.mappedColumnMappings[column] = 'employee';
              break;
            case 'date':
              state.mappedColumnMappings[column] = 'date';
              break;
            case 'hours':
              state.mappedColumnMappings[column] = 'hours';
              break;
            default:
              // Handle other cases
              break;
          }
        } else {
          // Non-required columns go to unknown columns
          unknownCols.push(column);
          state.unknownCheckboxes[column] = false;
        }
      });

      state.mappedColumns = mappedCols;
      state.unknownColumns = unknownCols;
    },

    // Update excel columns during re-processing WITHOUT changing uploadId (prevents infinite loop)
    updateExcelColumnsForDisplay: (state, action: PayloadAction<string[]>) => {
      state.excelColumns = action.payload;
    },

    // Mapped columns actions
    addMappedColumn: (state, action: PayloadAction<string>) => {
      if (!state.mappedColumns.includes(action.payload)) {
        state.mappedColumns.push(action.payload);
        // Remove from unknown columns if it exists there
        state.unknownColumns = state.unknownColumns.filter(
          (col) => col !== action.payload,
        );
      }
    },

    removeMappedColumn: (state, action: PayloadAction<string>) => {
      state.mappedColumns = state.mappedColumns.filter(
        (col) => col !== action.payload,
      );
      // Add to unknown columns
      if (!state.unknownColumns.includes(action.payload)) {
        state.unknownColumns.push(action.payload);
      }
    },

    updateMappedColumnMapping: (
      state,
      action: PayloadAction<{ column: string; mapping: string }>,
    ) => {
      const { column, mapping } = action.payload;

      if (mapping) {
        // Mapping exists - add to mapped columns
        state.mappedColumnMappings[column] = mapping;

        if (!state.mappedColumns.includes(column)) {
          state.mappedColumns.push(column);
        }

        // Remove from unknown columns
        state.unknownColumns = state.unknownColumns.filter(
          (col) => col !== column,
        );

        // Ensure checkbox is set
        if (state.mappedColumnCheckboxes[column] === undefined) {
          state.mappedColumnCheckboxes[column] = true;
        }
      } else {
        // No mapping - remove from mapped columns
        delete state.mappedColumnMappings[column];
        state.mappedColumns = state.mappedColumns.filter(
          (col) => col !== column,
        );

        // Add to unknown columns if not already there
        if (!state.unknownColumns.includes(column)) {
          state.unknownColumns.push(column);
        }

        // Clear checkbox
        state.mappedColumnCheckboxes[column] = false;
      }
    },

    updateMappedColumnCheckbox: (
      state,
      action: PayloadAction<{ column: string; checked: boolean }>,
    ) => {
      state.mappedColumnCheckboxes[action.payload.column] =
        action.payload.checked;

      // If unchecked, move to unknown columns and clear mapping
      if (!action.payload.checked) {
        // Remove from mapped columns
        state.mappedColumns = state.mappedColumns.filter(
          (col) => col !== action.payload.column,
        );
        // Add to unknown columns if not already there
        if (!state.unknownColumns.includes(action.payload.column)) {
          state.unknownColumns.push(action.payload.column);
        }
        // Clear the mapping and checkbox for unknown columns
        delete state.unknownMappings[action.payload.column];
        state.unknownCheckboxes[action.payload.column] = false;
        // Also clear the mapped column mapping to remove any required field logic
        delete state.mappedColumnMappings[action.payload.column];
      }
    },

    setMappedColumnMappings: (
      state,
      action: PayloadAction<Record<string, string>>,
    ) => {
      state.mappedColumnMappings = action.payload;
    },

    setMappedColumnCheckboxes: (
      state,
      action: PayloadAction<Record<string, boolean>>,
    ) => {
      state.mappedColumnCheckboxes = action.payload;
    },

    // Unknown columns actions
    updateUnknownMapping: (
      state,
      action: PayloadAction<{ column: string; mapping: string }>,
    ) => {
      state.unknownMappings[action.payload.column] = action.payload.mapping;
    },

    updateUnknownCheckbox: (
      state,
      action: PayloadAction<{ column: string; checked: boolean }>,
    ) => {
      state.unknownCheckboxes[action.payload.column] = action.payload.checked;

      // If checked, move to mapped columns
      if (action.payload.checked) {
        // Remove from unknown columns
        state.unknownColumns = state.unknownColumns.filter(
          (col) => col !== action.payload.column,
        );
        // Add to mapped columns if not already there
        if (!state.mappedColumns.includes(action.payload.column)) {
          state.mappedColumns.push(action.payload.column);
        }
        // Initialize mapping and checkbox for mapped columns
        state.mappedColumnMappings[action.payload.column] = '';
        state.mappedColumnCheckboxes[action.payload.column] = true;
      } else {
        // If unchecked, clear the mapping
        delete state.unknownMappings[action.payload.column];
      }
    },

    // Excel data processing
    setRawExcelData: (state, action: PayloadAction<any[][]>) => {
      state.rawExcelData = action.payload;
    },

    // processTimeEntries: Removed - processing now handled in useProcessMappingToReviewEntries hook

    setIsUploading: (state, action: PayloadAction<boolean>) => {
      state.isUploading = action.payload;
    },

    setUploadProgress: (state, action: PayloadAction<number>) => {
      state.uploadProgress = action.payload;
    },

    setUploadFileName: (state, action: PayloadAction<string>) => {
      state.uploadFileName = action.payload;
    },

    setUploadError: (state, action: PayloadAction<string | null>) => {
      state.uploadError = action.payload;
    },

    setIsProcessingFile: (state, action: PayloadAction<boolean>) => {
      state.isProcessingFile = action.payload;
    },

    setProcessingError: (state, action: PayloadAction<string | null>) => {
      state.processingError = action.payload;
    },

    // QB Time fields actions
    setQBTimeFields: (state, action: PayloadAction<string[]>) => {
      state.qbTimeFields = action.payload;
    },

    setIsLoadingQBTimeFields: (state, action: PayloadAction<boolean>) => {
      state.isLoadingQBTimeFields = action.payload;
    },

    setQBTimeFieldsError: (state, action: PayloadAction<string | null>) => {
      state.qbTimeFieldsError = action.payload;
    },

    // Employee grouped time entries actions
    setEmployeeGroupedTimeEntries: (
      state,
      action: PayloadAction<EmployeeGroupedTimeEntries>,
    ) => {
      state.employeeGroupedTimeEntries = action.payload;
    },

    processEmployeeGroupedTimeEntries: (
      state,
      action: PayloadAction<{
        employees: any[];
        rawExcelData: any[][];
        excelColumns: string[];
        employeeGroupedData?: Record<string, any[]>;
      }>,
    ) => {
      const { employees, rawExcelData, excelColumns, employeeGroupedData } =
        action.payload;

      // If employeeGroupedData is provided, use it directly
      if (employeeGroupedData) {
        state.employeeGroupedTimeEntries = employeeGroupedData;
        return;
      }

      // Fallback to processing raw data (legacy behavior)
      if (!rawExcelData || rawExcelData.length === 0) {
        state.employeeGroupedTimeEntries = {};
        return;
      }

      const headers = rawExcelData[0];
      const dataRows = rawExcelData.slice(1);

      const groupedEntries: EmployeeGroupedTimeEntries = {};

      dataRows.forEach((row, rowIndex) => {
        // Find employee name column (assuming it's the first column or named 'username', 'employee', etc.)
        const employeeNameCol = headers.find((col, index) => {
          const lowerCol = col.toLowerCase();
          return (
            lowerCol.includes('username') ||
            lowerCol.includes('employee') ||
            lowerCol.includes('name')
          );
        });

        if (!employeeNameCol) return;

        const employeeNameColIndex = headers.indexOf(employeeNameCol);
        const employeeName = String(row[employeeNameColIndex] || '').trim();

        if (!employeeName) return;

        // Enhanced employee matching with fuzzy matching
        let matchingEmployee = employees.find(
          (emp) => emp.name.toLowerCase() === employeeName.toLowerCase(),
        );

        // If no exact match found, try fuzzy matching
        if (!matchingEmployee) {
          const fuzzyMatch = quickFuzzyMatch(employeeName, employees);
          if (fuzzyMatch && fuzzyMatch.confidence !== 'low') {
            matchingEmployee = fuzzyMatch.employee;
          }
        }

        if (!matchingEmployee) return;

        // Create processed time entry
        const processedEntry: ProcessedTimeEntry = {
          employeeId: matchingEmployee.id,
          employeeName: matchingEmployee.name,
        };

        // Add all other columns as key-value pairs
        headers.forEach((column, colIndex) => {
          if (column !== employeeNameCol && row[colIndex] !== undefined) {
            processedEntry[column] = row[colIndex];
          }
        });

        // Add to grouped entries
        if (!groupedEntries[matchingEmployee.id]) {
          groupedEntries[matchingEmployee.id] = [];
        }
        groupedEntries[matchingEmployee.id].push(processedEntry);
      });

      state.employeeGroupedTimeEntries = groupedEntries;
    },

    // Update time entry in employeeGroupedTimeEntries
    updateTimeEntry: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<any> }>,
    ) => {
      const { id, updates } = action.payload;

      // Find and update the entry in employeeGroupedTimeEntries
      Object.keys(state.employeeGroupedTimeEntries).forEach((employeeName) => {
        const entries = state.employeeGroupedTimeEntries[employeeName];
        const entryIndex = entries.findIndex((entry) => entry.id === id);
        if (entryIndex !== -1) {
          state.employeeGroupedTimeEntries[employeeName][entryIndex] = {
            ...state.employeeGroupedTimeEntries[employeeName][entryIndex],
            ...updates,
          };
        }
      });
    },

    // Initialize column mappings based on UX preferences or auto-mapping
    initializeColumnMappings: (
      state,
      action: PayloadAction<{
        uxPreferencesMapping?: Record<string, string | string[]>;
        excelColumns: string[];
      }>,
    ) => {
      const { uxPreferencesMapping, excelColumns } = action.payload;

      // Clear existing mappings
      state.mappedColumns = [];
      state.mappedColumnMappings = {};
      state.mappedColumnCheckboxes = {};
      state.unknownColumns = [...excelColumns];
      state.unknownMappings = {};
      state.unknownCheckboxes = {};

      // Track which QB fields are already mapped
      const currentMappings: string[] = [];

      // Step 1: UX preferences have highest priority - apply them first
      // UX preferences format: { qbField: string | string[] }
      // e.g., { "employee": ["name", "ee"], "date": "date" }
      if (
        uxPreferencesMapping &&
        Object.keys(uxPreferencesMapping).length > 0
      ) {
        // First pass: Check if hours/duration is mapped
        let hasHoursMapped = false;
        Object.entries(uxPreferencesMapping).forEach(([qbTimeField]) => {
          const qbTimeFieldLower = String(qbTimeField).toLowerCase();
          if (qbTimeFieldLower === 'hours' || qbTimeFieldLower === 'duration') {
            hasHoursMapped = true;
          }
        });

        Object.entries(uxPreferencesMapping).forEach(
          ([qbTimeField, excelColumnOrArray]) => {
            const qbTimeFieldLower = String(qbTimeField).toLowerCase();

            // Skip start time and end time if hours is already mapped
            if (
              hasHoursMapped &&
              (qbTimeFieldLower === 'start time' ||
                qbTimeFieldLower === 'end time')
            ) {
              return;
            }

            // Handle both string and array formats
            const excelColumnsToMap = Array.isArray(excelColumnOrArray)
              ? excelColumnOrArray
              : [excelColumnOrArray];

            // Try to match each Excel column from the list
            excelColumnsToMap.forEach((excelColumn) => {
              // Find the exact column match (case-insensitive)
              const matchingColumn = excelColumns.find(
                (col) =>
                  col.toLowerCase().trim() ===
                  String(excelColumn).toLowerCase().trim(),
              );

              if (matchingColumn) {
                // Check if this Excel column is already used
                const isExcelColumnUsed =
                  state.mappedColumns.includes(matchingColumn);

                if (!isExcelColumnUsed) {
                  // SMART MAPPING: Check if this column name has an exact match with a different QB field
                  // This prevents incorrect historical UX preferences from overriding obvious matches
                  // e.g., "start time" column should map to "start time" QB field, not "date"
                  const matchingColumnLower = matchingColumn
                    .toLowerCase()
                    .trim();
                  const qbTimeFieldLower = String(qbTimeField)
                    .toLowerCase()
                    .trim();

                  // List of QB fields that should take priority for exact name matches
                  const exactMatchQBFields = [
                    'employee',
                    'date',
                    'hours',
                    'start time',
                    'end time',
                    'customer',
                    'service item',
                    'class',
                    'location',
                    'notes',
                    'billable',
                    'cost rate',
                    'bill rate',
                  ];

                  // Check if the column name exactly matches a different QB field
                  const hasExactMatchElsewhere = exactMatchQBFields.some(
                    (qbField) => {
                      const qbFieldLower = qbField.toLowerCase().trim();
                      return (
                        qbFieldLower === matchingColumnLower &&
                        qbFieldLower !== qbTimeFieldLower
                      );
                    },
                  );

                  // Skip this UX preference mapping if there's a better exact match elsewhere
                  if (hasExactMatchElsewhere) {
                    return; // Skip this mapping - let fuzzy matching handle it
                  }

                  // Excel column not yet used - add it
                  state.mappedColumns.push(matchingColumn);
                  state.mappedColumnMappings[matchingColumn] =
                    String(qbTimeField);
                  state.mappedColumnCheckboxes[matchingColumn] = true;

                  // Track that this QB field is mapped (allow multiple columns per QB field)
                  if (!currentMappings.includes(String(qbTimeField))) {
                    currentMappings.push(String(qbTimeField));
                  }

                  // Remove from unknown columns
                  state.unknownColumns = state.unknownColumns.filter(
                    (col) => col !== matchingColumn,
                  );
                } else {
                  // Excel column is already mapped to a different QB field
                  // This happens when UX prefs have: {"customer": "Employee ID", "class": "Employee ID"}
                  // In this case, use the LAST mapping (most recent)
                  // Update the existing mapping to the new QB field
                  const oldQbField = state.mappedColumnMappings[matchingColumn];
                  state.mappedColumnMappings[matchingColumn] =
                    String(qbTimeField);

                  // Update currentMappings - remove old QB field if it's not used elsewhere
                  if (oldQbField) {
                    const isOldQbFieldUsedElsewhere =
                      Object.values(state.mappedColumnMappings).filter(
                        (qb) => qb === oldQbField,
                      ).length > 0;

                    if (!isOldQbFieldUsedElsewhere) {
                      const oldQbFieldIndex = currentMappings.findIndex(
                        (mapped) =>
                          mapped.toLowerCase() ===
                          String(oldQbField).toLowerCase(),
                      );
                      if (oldQbFieldIndex !== -1) {
                        currentMappings.splice(oldQbFieldIndex, 1);
                      }
                    }
                  }

                  // Add new QB field if not already tracked
                  if (!currentMappings.includes(String(qbTimeField))) {
                    currentMappings.push(String(qbTimeField));
                  }
                }
              }
            });
          },
        );
      }

      // Step 2: Auto-map required fields using fuzzy matching (only if not already mapped by UX preferences)
      try {
        const {
          autoMapRequiredFields,
        } = require('../utils/fuzzyColumnMatcher');

        // Get auto-mappings for required fields that aren't already mapped
        const autoMappings = autoMapRequiredFields(
          excelColumns,
          state.mappedColumnMappings,
        );

        // Apply auto-mappings
        Object.entries(autoMappings).forEach(([excelColumn, qbTimeField]) => {
          // Check if this QBTime field is already mapped
          const qbTimeFieldLower = String(qbTimeField).toLowerCase();
          const isAlreadyMapped = currentMappings.some(
            (mapped) => mapped.toLowerCase() === qbTimeFieldLower,
          );

          if (!isAlreadyMapped) {
            // Move to mapped columns with auto-mapping
            state.mappedColumns.push(excelColumn);
            state.mappedColumnMappings[excelColumn] = String(qbTimeField);
            state.mappedColumnCheckboxes[excelColumn] = true;
            currentMappings.push(String(qbTimeField));

            // Remove from unknown columns
            state.unknownColumns = state.unknownColumns.filter(
              (col) => col !== excelColumn,
            );
          }
        });
      } catch (error) {
        // Fuzzy column matching failed silently
      }

      // Remaining columns stay in unknownColumns for manual mapping
    },

    // Employee mapping actions
    setEmployeeMapping: (
      state,
      action: PayloadAction<{
        originalName: string;
        employee: {
          id: string;
          name: string;
          type: string;
          [key: string]: any;
        };
      }>,
    ) => {
      const { originalName, employee } = action.payload;
      state.employeeMappings[originalName] = employee;
    },

    setUxEmployeeMappings: (
      state,
      action: PayloadAction<
        Record<
          string,
          {
            id: string;
            name: string;
            type: string;
            [key: string]: any;
          }
        >
      >,
    ) => {
      state.uxEmployeeMappings = action.payload;
    },

    clearEmployeeMapping: (state, action: PayloadAction<string>) => {
      delete state.employeeMappings[action.payload];
    },

    updateEmployeeMapping: (
      state,
      action: PayloadAction<{
        originalName: string;
        employee: {
          id: string;
          name: string;
          type: string;
          [key: string]: any;
        };
      }>,
    ) => {
      const { originalName, employee } = action.payload;

      // Update employee grouped time entries
      if (state.employeeGroupedTimeEntries[originalName]) {
        const entries = state.employeeGroupedTimeEntries[originalName];

        // Update each entry to mark employee as found
        entries.forEach((entry) => {
          entry.employeeId = employee.id;
          entry.employee = employee.name; // Update the employee name in grouped entries too
          entry.isMissingEmployee = false;
          entry.status = 'Valid';
          entry.validationErrors =
            entry.validationErrors?.filter(
              (error: string) => error !== 'missingEmployee',
            ) || [];
        });

        // Update the employee name in the grouped entries
        if (originalName !== employee.name) {
          // Check if there are already entries for the target employee name
          if (state.employeeGroupedTimeEntries[employee.name]) {
            // Merge with existing entries
            state.employeeGroupedTimeEntries[employee.name] = [
              ...state.employeeGroupedTimeEntries[employee.name],
              ...entries,
            ];
          } else {
            // Create new entry
            state.employeeGroupedTimeEntries[employee.name] = entries;
          }

          delete state.employeeGroupedTimeEntries[originalName];
        } else {
          // If the original name is the same as employee name, just update the entries in place
          state.employeeGroupedTimeEntries[employee.name] = entries;
        }
      }

      // Note: employeeGroupedTimeEntries already updated above, no need for processedTimeEntries
    },

    // Update a specific field for a time entry (used by field mapping)
    updateTimeEntryField: (
      state,
      action: PayloadAction<{
        entryId: string;
        field: string;
        value: any;
      }>,
    ) => {
      const { entryId, field, value } = action.payload;

      // Update in employeeGroupedTimeEntries
      Object.values(state.employeeGroupedTimeEntries).forEach((entries) => {
        const entry = entries.find((e) => e.id === entryId);
        if (entry) {
          entry[field] = value;
        }
      });

      // Note: employeeGroupedTimeEntries is the single source of truth now
    },

    // Remove entries from the source data (used after partial save success)
    removeEntriesFromExcelData: (state, action: PayloadAction<string[]>) => {
      const idsToRemove = new Set(action.payload);

      // Remove from employeeGroupedTimeEntries
      Object.keys(state.employeeGroupedTimeEntries).forEach((employeeName) => {
        state.employeeGroupedTimeEntries[employeeName] =
          state.employeeGroupedTimeEntries[employeeName].filter(
            (entry) => !idsToRemove.has(entry.id),
          );

        // Remove empty employee groups
        if (state.employeeGroupedTimeEntries[employeeName].length === 0) {
          delete state.employeeGroupedTimeEntries[employeeName];
        }
      });
    },

    // Reset actions
    resetExcelDataState: (state) => {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    // Listen to global reset action
    builder.addCase(resetAllSlices, (state) => {
      Object.assign(state, initialState);
    });
  },
});

export const {
  setExcelColumns,
  updateExcelColumnsForDisplay,
  addMappedColumn,
  removeMappedColumn,
  updateMappedColumnMapping,
  updateMappedColumnCheckbox,
  setMappedColumnMappings,
  setMappedColumnCheckboxes,
  updateUnknownMapping,
  updateUnknownCheckbox,
  setRawExcelData,
  setIsUploading,
  setUploadProgress,
  setUploadFileName,
  setUploadError,
  setIsProcessingFile,
  setProcessingError,
  setQBTimeFields,
  setIsLoadingQBTimeFields,
  setQBTimeFieldsError,
  setEmployeeGroupedTimeEntries,
  processEmployeeGroupedTimeEntries,
  updateTimeEntry,
  initializeColumnMappings,
  setEmployeeMapping,
  setUxEmployeeMappings,
  clearEmployeeMapping,
  updateEmployeeMapping,
  updateTimeEntryField,
  removeEntriesFromExcelData,
  resetExcelDataState,
} = excelDataSlice.actions;

export default excelDataSlice.reducer;
