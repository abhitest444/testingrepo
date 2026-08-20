import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { resetAllSlices } from './globalActions';

export interface ScannedEntry {
  name: string;
  customer?: string;
  service?: string;
  billable: boolean;
  date: string;
  hours: number;
  unknown: Array<{
    name: string;
    value?: any;
  }>;
}

export interface ScannedDataState {
  entries: ScannedEntry[];
  isLoading: boolean;
  error: string | null;
  isExtracting: boolean;
  extractionError: string | null;
}

const initialState: ScannedDataState = {
  entries: [],
  isLoading: false,
  error: null,
  isExtracting: false,
  extractionError: null,
};

const scannedDataSlice = createSlice({
  name: 'scannedData',
  initialState,
  reducers: {
    setScannedEntries: (state, action: PayloadAction<ScannedEntry[]>) => {
      state.entries = action.payload;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setExtracting: (state, action: PayloadAction<boolean>) => {
      state.isExtracting = action.payload;
    },
    setExtractionError: (state, action: PayloadAction<string | null>) => {
      state.extractionError = action.payload;
    },
    clearScannedData: (state) => {
      state.entries = [];
      state.isLoading = false;
      state.error = null;
      state.isExtracting = false;
      state.extractionError = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(resetAllSlices, (state) => {
      Object.assign(state, initialState);
    });
  },
});

export const {
  setScannedEntries,
  setLoading,
  setError,
  setExtracting,
  setExtractionError,
  clearScannedData,
} = scannedDataSlice.actions;

export default scannedDataSlice.reducer;
