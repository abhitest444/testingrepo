import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { resetAllSlices } from './globalActions';

export interface CustomField {
  id: string;
  name: string;
  type: string;
  deleted: boolean;
  required: boolean;
  options: string[];
}

export interface CustomFieldsState {
  customFields: CustomField[];
  loading: boolean;
  error: string | null;
}

const initialState: CustomFieldsState = {
  customFields: [],
  loading: false,
  error: null,
};

const customFieldsSlice = createSlice({
  name: 'customFields',
  initialState,
  reducers: {
    setCustomFields: (state, action: PayloadAction<CustomField[]>) => {
      state.customFields = action.payload;
    },
    setCustomFieldsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setCustomFieldsError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    resetCustomFields: (state) => {
      Object.assign(state, initialState);
    },
    resetCustomFieldsState: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const {
  setCustomFields,
  setCustomFieldsLoading,
  setCustomFieldsError,
  resetCustomFields,
  resetCustomFieldsState,
} = customFieldsSlice.actions;

export default customFieldsSlice.reducer;
