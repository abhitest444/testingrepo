import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  Payroll_EmployerBreakInput,
  Payroll_Break,
  Payroll_DurationUnit,
  Common_DayOfWeek,
} from 'src/__generated__/oigql/graphql';
import { TeamMember } from 'src/js/widgets/breaks/types';
import {
  BREAK_LOCATIONS,
  DEFAULT_NOTIFY_DURATION,
} from 'src/js/widgets/breaks/constants';

// Validation errors interface
interface ValidationErrors {
  breakName?: string;
  breakType?: string;
  breakDuration?: string;
  thresholdLimit?: string;
  frequency?: string;
  notifyDuration?: string;
  daysOfWeek?: string;
}

// Extended interface for form state that includes additional UI-specific fields
interface BreakPolicyFormState extends Payroll_EmployerBreakInput {
  // Additional UI-specific fields
  noSetDuration: boolean;
  shiftReach: string;
  repeat: string;
  breakLocation: string;
  teamMembers: string;
  frequency: string;
  repeatEvery: boolean;
  daysOfWeek: Common_DayOfWeek[];
  specificTime: string;
  // Manual section fields
  autoEndBreak: boolean;
  cantEndEarly: boolean;
  notify: boolean;
  notifyDuration: number;
  // For tracking form state
  isDirty: boolean;
  isValid: boolean;
  // Validation state
  validationErrors: ValidationErrors;
  hasValidationErrors: boolean;
}

interface BreakPolicyFormSliceState {
  formData: BreakPolicyFormState;
  isOpen: boolean;
  isEditing: boolean;
  editingId: string | null;
  loading: boolean;
  error: string | null;
  showAssignTeamMembers: boolean;
  tempAssignments: TeamMember[];
}

const defaultFormState: BreakPolicyFormState = {
  breakName: '',
  breakDuration: 15,
  durationUnit: Payroll_DurationUnit.Minutes,
  noSetDuration: false,
  breakType: Payroll_Break.Paid,
  allowAuto: false,
  allowManual: false,
  isActive: true,
  isDefaultPolicy: true,
  shiftReach: '',
  repeat: '',
  breakLocation: BREAK_LOCATIONS.MIDDLE,
  teamMembers: 'all',
  frequency: '04:00',
  repeatEvery: false,
  daysOfWeek: [
    Common_DayOfWeek.Monday,
    Common_DayOfWeek.Tuesday,
    Common_DayOfWeek.Wednesday,
    Common_DayOfWeek.Thursday,
    Common_DayOfWeek.Friday,
  ],
  specificTime: '09:00', // Default to 9:00 AM in 24-hour format
  autoEndBreak: false,
  cantEndEarly: false,
  notify: false,
  notifyDuration: DEFAULT_NOTIFY_DURATION,
  isDirty: false,
  isValid: false,
  validationErrors: {},
  hasValidationErrors: false,
  autoRule: undefined,
  manualRule: undefined,
};

const initialState: BreakPolicyFormSliceState = {
  formData: defaultFormState,
  isOpen: false,
  isEditing: false,
  editingId: null,
  loading: false,
  error: null,
  showAssignTeamMembers: false,
  tempAssignments: [],
};

const breakPolicyFormSlice = createSlice({
  name: 'breakPolicyForm',
  initialState,
  reducers: {
    // Form data management
    setFormData: (
      state,
      action: PayloadAction<Partial<BreakPolicyFormState>>,
    ) => {
      state.formData = { ...state.formData, ...action.payload, isDirty: true };
    },
    resetFormData: (state) => {
      state.formData = defaultFormState;
      state.formData.isDirty = false;
      state.formData.isValid = false;
      state.formData.validationErrors = {};
      state.formData.hasValidationErrors = false;
    },
    initializeFormData: (
      state,
      action: PayloadAction<Partial<BreakPolicyFormState>>,
    ) => {
      state.formData = { ...defaultFormState, ...action.payload };
      state.formData.isDirty = false;
      state.formData.isValid = false;
      state.formData.validationErrors = {};
      state.formData.hasValidationErrors = false;
    },

    // Form validation
    setFormValid: (state, action: PayloadAction<boolean>) => {
      state.formData.isValid = action.payload;
    },
    setValidationErrors: (state, action: PayloadAction<ValidationErrors>) => {
      state.formData.validationErrors = action.payload;
      state.formData.hasValidationErrors =
        Object.keys(action.payload).length > 0;
    },
    clearValidationErrors: (state) => {
      state.formData.validationErrors = {};
      state.formData.hasValidationErrors = false;
    },
    setFieldValidationError: (
      state,
      action: PayloadAction<{ field: keyof ValidationErrors; error: string }>,
    ) => {
      const { field, error } = action.payload;
      if (error) {
        state.formData.validationErrors[field] = error;
      } else {
        delete state.formData.validationErrors[field];
      }
      state.formData.hasValidationErrors =
        Object.keys(state.formData.validationErrors).length > 0;
    },

    // Drawer state management
    openForm: (
      state,
      action: PayloadAction<{ isEditing?: boolean; editingId?: string }>,
    ) => {
      state.isOpen = true;
      state.isEditing = action.payload.isEditing || false;
      state.editingId = action.payload.editingId || null;
      state.showAssignTeamMembers = false;
    },
    closeForm: (state) => {
      state.isOpen = false;
      state.isEditing = false;
      state.editingId = null;
      state.showAssignTeamMembers = false;
      state.error = null;
      state.formData = defaultFormState;
      state.tempAssignments = [];
    },

    // Loading states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Team members assignment view
    setShowAssignTeamMembers: (state, action: PayloadAction<boolean>) => {
      state.showAssignTeamMembers = action.payload;
    },

    // Temp assignments management
    setTempAssignments: (state, action: PayloadAction<TeamMember[]>) => {
      state.tempAssignments = action.payload;
    },
    clearTempAssignments: (state) => {
      state.tempAssignments = [];
    },

    // Specific field updates
    updateBreakName: (state, action: PayloadAction<string>) => {
      state.formData.breakName = action.payload;
      state.formData.isDirty = true;
    },
    updateBreakDuration: (state, action: PayloadAction<number>) => {
      state.formData.breakDuration = action.payload;
      state.formData.isDirty = true;
    },
    updateDurationUnit: (
      state,
      action: PayloadAction<Payroll_DurationUnit>,
    ) => {
      state.formData.durationUnit = action.payload;
      state.formData.isDirty = true;
    },
    updateBreakType: (state, action: PayloadAction<Payroll_Break>) => {
      state.formData.breakType = action.payload;
      state.formData.isDirty = true;
    },
    updateAllowAuto: (state, action: PayloadAction<boolean>) => {
      state.formData.allowAuto = action.payload;
      state.formData.isDirty = true;
    },
    updateAllowManual: (state, action: PayloadAction<boolean>) => {
      state.formData.allowManual = action.payload;
      state.formData.isDirty = true;
    },
    updateNoSetDuration: (state, action: PayloadAction<boolean>) => {
      state.formData.noSetDuration = action.payload;
      state.formData.isDirty = true;
    },
    // Auto section fields
    updateFrequency: (state, action: PayloadAction<string>) => {
      state.formData.frequency = action.payload;
      state.formData.isDirty = true;
    },
    updateRepeatEvery: (state, action: PayloadAction<boolean>) => {
      state.formData.repeatEvery = action.payload;
      state.formData.isDirty = true;
    },
    updateDaysOfWeek: (state, action: PayloadAction<Common_DayOfWeek[]>) => {
      state.formData.daysOfWeek = action.payload;
      state.formData.isDirty = true;
    },
    updateBreakLocation: (state, action: PayloadAction<string>) => {
      state.formData.breakLocation = action.payload;
      state.formData.isDirty = true;
    },
    updateSpecificTime: (state, action: PayloadAction<string>) => {
      state.formData.specificTime = action.payload;
      state.formData.isDirty = true;
    },
    // Manual section fields
    updateAutoEnd: (state, action: PayloadAction<boolean>) => {
      state.formData.autoEndBreak = action.payload;
      state.formData.isDirty = true;
    },
    updateCantEndEarly: (state, action: PayloadAction<boolean>) => {
      state.formData.cantEndEarly = action.payload;
      state.formData.isDirty = true;
    },
    updateNotify: (state, action: PayloadAction<boolean>) => {
      state.formData.notify = action.payload;
      state.formData.isDirty = true;
    },
    updateNotifyDuration: (state, action: PayloadAction<number>) => {
      state.formData.notifyDuration = action.payload;
      state.formData.isDirty = true;
    },
    resetDuration: (state) => {
      state.formData.breakDuration = defaultFormState.breakDuration;
      state.formData.isDirty = true;
    },
  },
});

export const {
  setFormData,
  resetFormData,
  initializeFormData,
  setFormValid,
  openForm,
  closeForm,
  setLoading,
  setError,
  setShowAssignTeamMembers,
  updateBreakName,
  updateBreakDuration,
  updateDurationUnit,
  updateBreakType,
  updateAllowAuto,
  updateAllowManual,
  updateNoSetDuration,
  updateFrequency,
  updateRepeatEvery,
  updateDaysOfWeek,
  updateBreakLocation,
  updateSpecificTime,
  updateAutoEnd,
  updateCantEndEarly,
  updateNotify,
  updateNotifyDuration,
  resetDuration,
  setValidationErrors,
  clearValidationErrors,
  setFieldValidationError,
  setTempAssignments,
  clearTempAssignments,
} = breakPolicyFormSlice.actions;

// Selectors
export const selectBreakPolicyForm = (state: {
  breakPolicyForm: BreakPolicyFormSliceState;
}) => state.breakPolicyForm;

export const selectFormData = (state: {
  breakPolicyForm: BreakPolicyFormSliceState;
}) => state.breakPolicyForm.formData;

export const selectIsFormOpen = (state: {
  breakPolicyForm: BreakPolicyFormSliceState;
}) => state.breakPolicyForm.isOpen;

export const selectIsEditing = (state: {
  breakPolicyForm: BreakPolicyFormSliceState;
}) => state.breakPolicyForm.isEditing;

export const selectEditingId = (state: {
  breakPolicyForm: BreakPolicyFormSliceState;
}) => state.breakPolicyForm.editingId;

export const selectFormLoading = (state: {
  breakPolicyForm: BreakPolicyFormSliceState;
}) => state.breakPolicyForm.loading;

export const selectFormError = (state: {
  breakPolicyForm: BreakPolicyFormSliceState;
}) => state.breakPolicyForm.error;

export const selectShowAssignTeamMembers = (state: {
  breakPolicyForm: BreakPolicyFormSliceState;
}) => state.breakPolicyForm.showAssignTeamMembers;

export const selectFormIsDirty = (state: {
  breakPolicyForm: BreakPolicyFormSliceState;
}) => state.breakPolicyForm.formData.isDirty;

export const selectFormIsValid = (state: {
  breakPolicyForm: BreakPolicyFormSliceState;
}) => state.breakPolicyForm.formData.isValid;

export const selectValidationErrors = (state: {
  breakPolicyForm: BreakPolicyFormSliceState;
}) => state.breakPolicyForm.formData.validationErrors;

export const selectHasValidationErrors = (state: {
  breakPolicyForm: BreakPolicyFormSliceState;
}) => state.breakPolicyForm.formData.hasValidationErrors;

export const selectTempAssignments = (state: {
  breakPolicyForm: BreakPolicyFormSliceState;
}) => state.breakPolicyForm.tempAssignments;

export default breakPolicyFormSlice.reducer;
