import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { resetAllSlices } from './globalActions';

/**
 * Interface representing company settings
 */
export interface CompanySettings {
  isServiceFieldEnabled: boolean;
  isBillingFieldEnabled: boolean;
  firstDayOfWeek: number; // 0 (Sunday) to 6 (Saturday)
  isClassEnabled: boolean;
  isLocationEnabled: boolean;
  classRequired?: boolean;
  locationRequired?: boolean;
  serviceItemRequired?: boolean;
  requireBillable?: boolean;
  timeSheetEntryMakesNotesRequiredEnabled?: boolean;
}

/**
 * Interface representing the company settings state
 */
export interface CompanySettingsState {
  settings: CompanySettings | null;
  loading: boolean;
  error: string | null;
}

const initialState: CompanySettingsState = {
  settings: null,
  loading: false,
  error: null,
};

export const companySettingsSlice = createSlice({
  name: 'companySettings',
  initialState,
  reducers: {
    setCompanySettings: (state, action: PayloadAction<CompanySettings>) => {
      state.settings = action.payload;
      state.error = null;
    },

    setCompanySettingsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setCompanySettingsError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },

    resetCompanySettings: (state) => {
      state.settings = null;
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  setCompanySettings,
  setCompanySettingsLoading,
  setCompanySettingsError,
  resetCompanySettings,
} = companySettingsSlice.actions;

export default companySettingsSlice.reducer;
