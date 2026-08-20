import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ValidationState {
  showValidationError: boolean;
  errorMessages: string[];
  saveError: string | null;
  timeEntriesError: string | null;
  fieldErrors: {
    [cellKey: string]: {
      service?: string;
      class?: string;
      location?: string;
      notes?: string;
      customFields?: { [fieldId: string]: string };
      dimensions?: { [definitionId: string]: string };
    };
  };
  rowErrors: {
    [rowId: string]: {
      overHours?: string;
    };
  };
  settingsError: string | null;
  // New fields for save payload and detailed errors
  savePayload: any | null;
  detailedSaveErrors: Array<{
    index: number;
    date: string;
    duration: number;
    errorCode: string;
    message: string;
    subCode?: string;
  }> | null;
  // Central save loading state
  isSaveLoading: boolean;
}

const initialState: ValidationState = {
  showValidationError: false,
  errorMessages: [],
  saveError: null,
  timeEntriesError: null,
  fieldErrors: {},
  rowErrors: {},
  settingsError: null,
  savePayload: null,
  detailedSaveErrors: null,
  isSaveLoading: false,
};

export const validationSlice = createSlice({
  name: 'validation',
  initialState,
  reducers: {
    setValidationError: (
      state,
      action: PayloadAction<{
        errorMessages: string[];
        fieldErrors: {
          [cellKey: string]: {
            service?: string;
            class?: string;
            location?: string;
            notes?: string;
            customFields?: { [fieldId: string]: string };
            dimensions?: { [definitionId: string]: string };
          };
        };
        rowErrors?: {
          [rowId: string]: {
            overHours?: string;
          };
        };
      }>,
    ) => {
      state.showValidationError = action.payload.errorMessages.length > 0;
      state.errorMessages = action.payload.errorMessages;
      state.fieldErrors = action.payload.fieldErrors;
      state.rowErrors = action.payload.rowErrors || {};
    },
    clearValidationError: (state) => {
      state.showValidationError = false;
      state.errorMessages = [];
      state.fieldErrors = {};
      state.rowErrors = {};
    },
    setSettingsError: (state, action: PayloadAction<string | null>) => {
      state.settingsError = action.payload;
    },
    clearSettingsError: (state) => {
      state.settingsError = null;
    },
    setSaveError: (state, action: PayloadAction<string | null>) => {
      state.saveError = action.payload;
    },
    clearSaveError: (state) => {
      state.saveError = null;
    },
    setTimeEntriesError: (state, action: PayloadAction<string | null>) => {
      state.timeEntriesError = action.payload;
    },
    clearTimeEntriesError: (state) => {
      state.timeEntriesError = null;
    },
    setSavePayload: (state, action: PayloadAction<any | null>) => {
      state.savePayload = action.payload;
    },
    clearSavePayload: (state) => {
      state.savePayload = null;
    },
    setDetailedSaveErrors: (
      state,
      action: PayloadAction<Array<{
        index: number;
        date: string;
        duration: number;
        errorCode: string;
        message: string;
        subCode?: string;
      }> | null>,
    ) => {
      state.detailedSaveErrors = action.payload;
    },
    clearDetailedSaveErrors: (state) => {
      state.detailedSaveErrors = null;
    },
    setSaveLoading: (state, action: PayloadAction<boolean>) => {
      state.isSaveLoading = action.payload;
    },
  },
});

export const {
  setValidationError,
  clearValidationError,
  setSettingsError,
  clearSettingsError,
} = validationSlice.actions;
export const {
  setSaveError,
  clearSaveError,
  setTimeEntriesError,
  clearTimeEntriesError,
} = validationSlice.actions;
export const {
  setSavePayload,
  clearSavePayload,
  setDetailedSaveErrors,
  clearDetailedSaveErrors,
  setSaveLoading,
} = validationSlice.actions;
export default validationSlice.reducer;
