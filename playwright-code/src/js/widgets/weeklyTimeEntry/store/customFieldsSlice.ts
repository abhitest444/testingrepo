import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Interface representing a custom field option for dropdown fields
 */
export interface CustomFieldOption {
  id: string;
  name: string;
  deleted: boolean;
}

/**
 * Interface representing a custom field definition
 */
export interface CustomFieldDefinition {
  id: string;
  name: string;
  type: string;
  deleted: boolean;
  required: boolean;
  options: CustomFieldOption[];
}

/**
 * Interface representing a custom field value for a specific time entry
 */
export interface CustomFieldValue {
  id: string;
  name: string;
  value?: string;
  optionID?: string; // For dropdown fields - the selected option's ID
}

/**
 * State interface for custom fields management
 */
export interface CustomFieldsState {
  customFields: CustomFieldDefinition[]; // Available custom field definitions
  loading: boolean; // Loading state for custom fields operations
  error: string | null; // Error message if any operation fails
}

/**
 * Initial state for custom fields slice
 */
const initialState: CustomFieldsState = {
  customFields: [],
  loading: false,
  error: null,
};

/**
 * Redux slice for managing custom fields
 * Handles loading, storing, and error management for custom field definitions
 */
const customFieldsSlice = createSlice({
  name: 'customFields',
  initialState,
  reducers: {
    /**
     * Sets the custom fields array with new custom field definitions
     * Clears any existing errors when new data is successfully loaded
     * @param state - Current custom fields state
     * @param action - Payload containing array of custom field definitions
     */
    setCustomFields: (
      state,
      action: PayloadAction<CustomFieldDefinition[]>,
    ) => {
      state.customFields = action.payload;
      state.loading = false;
      state.error = null;
    },

    /**
     * Sets the loading state for custom fields operations
     * @param state - Current custom fields state
     * @param action - Payload containing loading boolean
     */
    setCustomFieldsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    /**
     * Sets an error message for custom fields operations
     * Used when loading custom fields fails
     * @param state - Current custom fields state
     * @param action - Payload containing error message
     */
    setCustomFieldsError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },

    /**
     * Clears custom fields error state
     * @param state - Current custom fields state
     */
    clearCustomFieldsError: (state) => {
      state.error = null;
    },

    /**
     * Resets custom fields to initial state
     * Clears all custom fields data and returns to default state
     * @param state - Current custom fields state
     */
    resetCustomFields: (state) => {
      state.customFields = [];
      state.error = null;
      state.loading = false;
    },
  },
});

// Export actions
export const {
  setCustomFields,
  setCustomFieldsLoading,
  setCustomFieldsError,
  clearCustomFieldsError,
  resetCustomFields,
} = customFieldsSlice.actions;

// Export reducer
export default customFieldsSlice.reducer;
