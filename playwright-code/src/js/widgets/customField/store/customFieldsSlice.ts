import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CustomFieldOption {
  id?: string;
  name: string;
  deleted: boolean;
  workerAssignmentCount?: number;
  timeAgainstAssignmentCount?: number;
}

export interface CustomField {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  isRequired: boolean;
  deleted: boolean;
  customerAssignmentCount?: number;
  options: CustomFieldOption[];
}

interface CustomFieldsState {
  customFields: CustomField[];
  originalCustomFields: CustomField[];
  loading: boolean;
  error: string | null;
}

const initialState: CustomFieldsState = {
  customFields: [],
  originalCustomFields: [],
  loading: false,
  error: null,
};

const customFieldsSlice = createSlice({
  name: 'customFields',
  initialState,
  reducers: {
    setCustomFields: (state, action: PayloadAction<CustomField[]>) => {
      state.customFields = action.payload;
      state.loading = false;
      state.error = null;
    },
    setOriginalCustomFields: (state, action: PayloadAction<CustomField[]>) => {
      state.originalCustomFields = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    toggleCustomFieldRequired: (state, action: PayloadAction<string>) => {
      const field = state.customFields.find(
        (field) => field.id === action.payload,
      );
      if (field) {
        field.isRequired = !field.isRequired;
      }
    },
  },
});

export const {
  setCustomFields,
  setOriginalCustomFields,
  setLoading,
  setError,
  toggleCustomFieldRequired,
} = customFieldsSlice.actions;

// Selectors
export const selectCustomFields = (state: {
  customFields: CustomFieldsState;
}) => state.customFields.customFields;

export const selectOriginalCustomFields = (state: {
  customFields: CustomFieldsState;
}) => state.customFields.originalCustomFields;

export const selectCustomFieldsLoading = (state: {
  customFields: CustomFieldsState;
}) => state.customFields.loading;

export const selectCustomFieldsError = (state: {
  customFields: CustomFieldsState;
}) => state.customFields.error;

export default customFieldsSlice.reducer;
