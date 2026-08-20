import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TimeTracking_CreateTimeEntryInput } from 'src/__generated__/timeTracking/graphql';
import { BreakEntry } from '../types';

interface BreakEntryFormState {
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  currentEntry: Partial<BreakEntry> | null;
  savedTimeEntryInput: TimeTracking_CreateTimeEntryInput | null;
}

interface BreakEntryEditFormState {
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  currentEntry: Partial<BreakEntry> | null;
}

interface BreakEntriesState {
  form: BreakEntryFormState;
  editForm: BreakEntryEditFormState;
  entries: BreakEntry[];
  timeEntryInputs: TimeTracking_CreateTimeEntryInput[];
  isQuickFindEnabled?: boolean;
}

const initialState: BreakEntriesState = {
  form: {
    isOpen: false,
    isLoading: false,
    error: null,
    currentEntry: null,
    savedTimeEntryInput: null,
  },
  editForm: {
    isOpen: false,
    isLoading: false,
    error: null,
    currentEntry: null,
  },
  entries: [],
  timeEntryInputs: [],
};

const breakEntriesSlice = createSlice({
  name: 'breakEntries',
  initialState,
  reducers: {
    openBreakEntryForm: (
      state,
      action: PayloadAction<Partial<BreakEntry> | undefined>,
    ) => {
      state.form.isOpen = true;
      state.form.currentEntry = action.payload || null;
      state.form.error = null;
    },
    closeBreakEntryForm: (state) => {
      state.form.isOpen = false;
      state.form.currentEntry = null;
      state.form.error = null;
      state.form.savedTimeEntryInput = null;
    },
    setBreakEntryFormLoading: (state, action: PayloadAction<boolean>) => {
      state.form.isLoading = action.payload;
    },
    setBreakEntryFormError: (state, action: PayloadAction<string | null>) => {
      state.form.error = action.payload;
    },
    addBreakEntry: (state, action: PayloadAction<BreakEntry>) => {
      state.entries.push(action.payload);
    },
    saveTimeEntryInput: (
      state,
      action: PayloadAction<TimeTracking_CreateTimeEntryInput>,
    ) => {
      state.form.savedTimeEntryInput = action.payload;
      state.timeEntryInputs.push(action.payload);
    },
    updateBreakEntry: (
      state,
      action: PayloadAction<{ id: string; entry: Partial<BreakEntry> }>,
    ) => {
      const { id, entry } = action.payload;
      const index = state.entries.findIndex((e) => e.name === id);
      if (index !== -1) {
        state.entries[index] = { ...state.entries[index], ...entry };
      }
    },
    removeBreakEntry: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      state.entries = state.entries.filter((e) => e.name !== id);
    },
    clearBreakEntries: (state) => {
      state.entries = [];
      state.timeEntryInputs = [];
    },
    openBreakEntryEditForm: (
      state,
      action: PayloadAction<Partial<BreakEntry> | undefined>,
    ) => {
      state.editForm.isOpen = true;
      state.editForm.currentEntry = action.payload || null;
      state.editForm.error = null;
    },
    closeBreakEntryEditForm: (state) => {
      state.editForm.isOpen = false;
      state.editForm.currentEntry = null;
      state.editForm.error = null;
    },
    setBreakEntryEditFormLoading: (state, action: PayloadAction<boolean>) => {
      state.editForm.isLoading = action.payload;
    },
    setBreakEntryEditFormError: (
      state,
      action: PayloadAction<string | null>,
    ) => {
      state.editForm.error = action.payload;
    },
    setIsQuickFindEnabled: (state, action: PayloadAction<boolean>) => {
      state.isQuickFindEnabled = action.payload;
    },
  },
});

export const {
  openBreakEntryForm,
  closeBreakEntryForm,
  setBreakEntryFormLoading,
  setBreakEntryFormError,
  openBreakEntryEditForm,
  closeBreakEntryEditForm,
  setBreakEntryEditFormLoading,
  setBreakEntryEditFormError,
  addBreakEntry,
  saveTimeEntryInput,
  updateBreakEntry,
  removeBreakEntry,
  clearBreakEntries,
  setIsQuickFindEnabled,
} = breakEntriesSlice.actions;

// Selectors
export const selectBreakEntryForm = (state: {
  breakEntries: BreakEntriesState;
}) => state.breakEntries.form;

export const selectBreakEntries = (state: {
  breakEntries: BreakEntriesState;
}) => state.breakEntries.entries;

export const selectBreakEntryFormIsOpen = (state: {
  breakEntries: BreakEntriesState;
}) => state.breakEntries.form.isOpen;

export const selectBreakEntryFormIsLoading = (state: {
  breakEntries: BreakEntriesState;
}) => state.breakEntries.form.isLoading;

export const selectBreakEntryFormError = (state: {
  breakEntries: BreakEntriesState;
}) => state.breakEntries.form.error;

export const selectCurrentBreakEntry = (state: {
  breakEntries: BreakEntriesState;
}) => state.breakEntries.form.currentEntry;

export const selectCurrentBreakEntryEdit = (state: {
  breakEntries: BreakEntriesState;
}) => state.breakEntries.editForm.currentEntry;

export const selectBreakEntryEditFormIsOpen = (state: {
  breakEntries: BreakEntriesState;
}) => state.breakEntries.editForm.isOpen;

export const selectBreakEntryEditFormIsLoading = (state: {
  breakEntries: BreakEntriesState;
}) => state.breakEntries.editForm.isLoading;

export const selectBreakEntryEditFormError = (state: {
  breakEntries: BreakEntriesState;
}) => state.breakEntries.editForm.error;

export const selectSavedTimeEntryInput = (state: {
  breakEntries: BreakEntriesState;
}) => state.breakEntries.form.savedTimeEntryInput;

export const selectTimeEntryInputs = (state: {
  breakEntries: BreakEntriesState;
}) => state.breakEntries.timeEntryInputs;

export default breakEntriesSlice.reducer;
