import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { resetAllSlices } from './globalActions';

/**
 * Represents an unmapped field value and the entries that use it
 */
export interface UnmappedField {
  /** The original value from the Excel file */
  value: string;
  /** IDs of time entries that use this value */
  affectedEntryIds: string[];
  /** The matched/mapped ID (if mapped) */
  mappedId?: string;
  /** The matched/mapped name (if different from value) */
  mappedName?: string;
  /** Fuzzy suggestions for employees (optional) */
  fuzzySuggestions?: any[];
  /** For custom field dropdown values, the field ID and name */
  customFieldId?: string;
  customFieldName?: string;
}

/**
 * Redux state for field mappings
 */
export interface FieldMappingsState {
  /** Unmatched class values: key is the original class name */
  unmatchedClasses: Record<string, UnmappedField>;
  /** Unmatched service values */
  unmatchedServices: Record<string, UnmappedField>;
  /** Unmatched location values */
  unmatchedLocations: Record<string, UnmappedField>;
  /** Unmatched customer values */
  unmatchedCustomers: Record<string, UnmappedField>;
  /** Unmatched employee values */
  unmatchedEmployees: Record<string, UnmappedField>;
  /** Unmatched custom field dropdown values: key is `${customFieldName}:${value}` */
  unmatchedCustomFieldDropdownValues: Record<string, UnmappedField>;
  /** Whether field mapping processing is in progress */
  isProcessing: boolean;
  /** Error during processing */
  processingError: string | null;
  /** Version number that increments on each mapping change */
  mappingVersion: number;
}

const initialState: FieldMappingsState = {
  unmatchedClasses: {},
  unmatchedServices: {},
  unmatchedLocations: {},
  unmatchedCustomers: {},
  unmatchedEmployees: {},
  unmatchedCustomFieldDropdownValues: {},
  isProcessing: false,
  processingError: null,
  mappingVersion: 0,
};

const fieldMappingsSlice = createSlice({
  name: 'fieldMappings',
  initialState,
  reducers: {
    // Set unmatched classes
    setUnmatchedClasses: (
      state,
      action: PayloadAction<Record<string, UnmappedField>>,
    ) => {
      state.unmatchedClasses = action.payload;
    },

    // Set unmatched services
    setUnmatchedServices: (
      state,
      action: PayloadAction<Record<string, UnmappedField>>,
    ) => {
      state.unmatchedServices = action.payload;
    },

    // Set unmatched locations
    setUnmatchedLocations: (
      state,
      action: PayloadAction<Record<string, UnmappedField>>,
    ) => {
      state.unmatchedLocations = action.payload;
    },

    // Set unmatched customers
    setUnmatchedCustomers: (
      state,
      action: PayloadAction<Record<string, UnmappedField>>,
    ) => {
      state.unmatchedCustomers = action.payload;
    },

    // Set unmatched employees
    setUnmatchedEmployees: (
      state,
      action: PayloadAction<Record<string, UnmappedField>>,
    ) => {
      state.unmatchedEmployees = action.payload;
    },

    // Set unmatched custom field dropdown values
    setUnmatchedCustomFieldDropdownValues: (
      state,
      action: PayloadAction<Record<string, UnmappedField>>,
    ) => {
      state.unmatchedCustomFieldDropdownValues = action.payload;
    },

    // Map a specific field value to an ID
    mapClassField: (
      state,
      action: PayloadAction<{
        value: string;
        mappedId: string;
        mappedName: string;
      }>,
    ) => {
      const { value, mappedId, mappedName } = action.payload;
      const key = value.toLowerCase();
      if (state.unmatchedClasses[key]) {
        state.unmatchedClasses[key].mappedId = mappedId;
        state.unmatchedClasses[key].mappedName = mappedName;
        state.mappingVersion += 1;
      }
    },

    mapServiceField: (
      state,
      action: PayloadAction<{
        value: string;
        mappedId: string;
        mappedName: string;
      }>,
    ) => {
      const { value, mappedId, mappedName } = action.payload;
      const key = value.toLowerCase();
      if (state.unmatchedServices[key]) {
        state.unmatchedServices[key].mappedId = mappedId;
        state.unmatchedServices[key].mappedName = mappedName;
        state.mappingVersion += 1;
      }
    },

    mapLocationField: (
      state,
      action: PayloadAction<{
        value: string;
        mappedId: string;
        mappedName: string;
      }>,
    ) => {
      const { value, mappedId, mappedName } = action.payload;
      const key = value.toLowerCase();
      if (state.unmatchedLocations[key]) {
        state.unmatchedLocations[key].mappedId = mappedId;
        state.unmatchedLocations[key].mappedName = mappedName;
        state.mappingVersion += 1;
      }
    },

    mapCustomerField: (
      state,
      action: PayloadAction<{
        value: string;
        mappedId: string;
        mappedName: string;
      }>,
    ) => {
      const { value, mappedId, mappedName } = action.payload;
      const key = value.toLowerCase();
      if (state.unmatchedCustomers[key]) {
        state.unmatchedCustomers[key].mappedId = mappedId;
        state.unmatchedCustomers[key].mappedName = mappedName;
        state.mappingVersion += 1;
      }
    },

    mapEmployeeField: (
      state,
      action: PayloadAction<{
        value: string;
        mappedId: string;
        mappedName: string;
      }>,
    ) => {
      const { value, mappedId, mappedName } = action.payload;
      const key = value.toLowerCase();
      if (state.unmatchedEmployees[key]) {
        state.unmatchedEmployees[key].mappedId = mappedId;
        state.unmatchedEmployees[key].mappedName = mappedName;
        state.mappingVersion += 1;
      }
    },

    mapCustomFieldDropdownValue: (
      state,
      action: PayloadAction<{
        fieldName: string;
        value: string;
        mappedId: string;
        mappedName: string;
      }>,
    ) => {
      const { fieldName, value, mappedId, mappedName } = action.payload;
      const key = `${fieldName}:${value}`.toLowerCase();
      if (state.unmatchedCustomFieldDropdownValues[key]) {
        state.unmatchedCustomFieldDropdownValues[key].mappedId = mappedId;
        state.unmatchedCustomFieldDropdownValues[key].mappedName = mappedName;
        state.mappingVersion += 1;
      }
    },

    // Set processing state
    setFieldMappingsProcessing: (state, action: PayloadAction<boolean>) => {
      state.isProcessing = action.payload;
    },

    // Set processing error
    setFieldMappingsError: (state, action: PayloadAction<string | null>) => {
      state.processingError = action.payload;
    },

    // Reset all field mappings
    resetFieldMappings: (state) => {
      state.unmatchedClasses = {};
      state.unmatchedServices = {};
      state.unmatchedLocations = {};
      state.unmatchedCustomers = {};
      state.unmatchedEmployees = {};
      state.unmatchedCustomFieldDropdownValues = {};
      state.isProcessing = false;
      state.processingError = null;
    },

    // Reset to initial state (full reset including version)
    resetFieldMappingsState: (state) => {
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
  setUnmatchedClasses,
  setUnmatchedServices,
  setUnmatchedLocations,
  setUnmatchedCustomers,
  setUnmatchedEmployees,
  setUnmatchedCustomFieldDropdownValues,
  mapClassField,
  mapServiceField,
  mapLocationField,
  mapCustomerField,
  mapEmployeeField,
  mapCustomFieldDropdownValue,
  setFieldMappingsProcessing,
  setFieldMappingsError,
  resetFieldMappings,
  resetFieldMappingsState,
} = fieldMappingsSlice.actions;

export default fieldMappingsSlice.reducer;
