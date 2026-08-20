import { PageMessageType } from '@ids-ts/page-message/dist/types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BreakRule } from '../types';
import { clearValidationErrors } from './breakPolicyFormSlice';
import {
  closeBreakEntryForm,
  closeBreakEntryEditForm,
} from './breakEntriesSlice';

interface UIState {
  preferencesOpen: boolean;
  deleteModalOpen: boolean;
  isCreateOrEditBreakOpen: boolean;
  isCreateBreakOpen: boolean;
  isEditBreakOpen: boolean;
  isAssignmentEditorOpen: boolean;
  breakToDelete: BreakRule | null;
  breakToEdit: BreakRule | null;
  isAddBreakRuleEnabled: boolean;
  unsavedChangesModal: {
    isOpen: boolean;
    pendingActionType: string | null;
  };
  pageMessage: {
    show: boolean;
    type: PageMessageType;
    message: string;
    titleNlsKey?: string;
    title?: string;
    descriptionNlsKey?: string;
    code?: string;
  };
}

const initialState: UIState = {
  preferencesOpen: false,
  deleteModalOpen: false,
  isCreateOrEditBreakOpen: false,
  isCreateBreakOpen: false,
  isEditBreakOpen: false,
  isAssignmentEditorOpen: false,
  breakToDelete: null,
  breakToEdit: null,
  isAddBreakRuleEnabled: true,
  unsavedChangesModal: {
    isOpen: false,
    pendingActionType: null,
  },
  pageMessage: {
    show: false,
    type: 'error',
    message: '',
    titleNlsKey: undefined,
    descriptionNlsKey: undefined,
    code: undefined,
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setPreferencesOpen: (state, action: PayloadAction<boolean>) => {
      state.preferencesOpen = action.payload;
      state.pageMessage = {
        show: !state.preferencesOpen ? false : state.pageMessage.show,
        type: 'error',
        message: '',
        titleNlsKey: undefined,
        title: undefined,
        descriptionNlsKey: undefined,
        code: undefined,
      };
    },
    setDeleteModalOpen: (state, action: PayloadAction<boolean>) => {
      state.deleteModalOpen = action.payload;
    },
    setIsCreateOrEditBreakOpen: (state, action: PayloadAction<boolean>) => {
      state.isCreateOrEditBreakOpen = action.payload;
    },
    setIsCreateBreakOpen: (state, action: PayloadAction<boolean>) => {
      state.isCreateBreakOpen = action.payload;
      state.pageMessage = {
        show: false,
        type: 'error',
        message: '',
        titleNlsKey: undefined,
        title: undefined,
        descriptionNlsKey: undefined,
        code: undefined,
      };
    },
    setIsEditBreakOpen: (state, action: PayloadAction<boolean>) => {
      state.isEditBreakOpen = action.payload;
      state.pageMessage = {
        show: false,
        type: 'error',
        message: '',
        titleNlsKey: undefined,
        title: undefined,
        descriptionNlsKey: undefined,
        code: undefined,
      };
    },
    setIsAssignmentEditorOpen: (state, action: PayloadAction<boolean>) => {
      state.isAssignmentEditorOpen = action.payload;
    },
    setBreakToDelete: (state, action: PayloadAction<BreakRule | null>) => {
      state.breakToDelete = action.payload;
    },
    setBreakToEdit: (state, action: PayloadAction<BreakRule | null>) => {
      state.breakToEdit = action.payload;
    },
    setIsAddBreakRuleEnabled: (state, action: PayloadAction<boolean>) => {
      state.isAddBreakRuleEnabled = action.payload;
    },
    closeDrawer: (state) => {
      state.isCreateBreakOpen = false;
      state.isEditBreakOpen = false;
      state.isAssignmentEditorOpen = false;
      state.breakToEdit = null;
      state.pageMessage = {
        show: false,
        type: 'error',
        message: '',
        titleNlsKey: undefined,
        title: undefined,
        descriptionNlsKey: undefined,
        code: undefined,
      };
    },
    setPageMessage: (
      state,
      action: PayloadAction<{
        show: boolean;
        type: PageMessageType;
        message: string;
        titleNlsKey?: string;
        title?: string;
        descriptionNlsKey?: string;
        code?: string;
      }>,
    ) => {
      state.pageMessage = action.payload;
    },
    clearPageMessage: (state) => {
      state.pageMessage = {
        show: false,
        type: 'error',
        message: '',
        titleNlsKey: undefined,
        title: undefined,
        descriptionNlsKey: undefined,
        code: undefined,
      };
    },
    openUnsavedChangesModal: (state, action: PayloadAction<string>) => {
      state.unsavedChangesModal.isOpen = true;
      state.unsavedChangesModal.pendingActionType = action.payload;
    },
    closeUnsavedChangesModal: (state) => {
      state.unsavedChangesModal.isOpen = false;
      state.unsavedChangesModal.pendingActionType = null;
    },
    resetUiState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(clearValidationErrors, (state) => {
        // Clear page message when validation errors are cleared
        state.pageMessage = {
          show: false,
          type: 'error',
          message: '',
          titleNlsKey: undefined,
          title: undefined,
          descriptionNlsKey: undefined,
          code: undefined,
        };
      })
      .addCase(setDeleteModalOpen, (state, action) => {
        if (!action.payload) {
          state.breakToDelete = null;
        }
      })
      .addCase(closeBreakEntryForm, (state) => {
        // Clear page message and errors when break entry form is closed
        state.pageMessage = {
          show: false,
          type: 'error',
          message: '',
          titleNlsKey: undefined,
          title: undefined,
          descriptionNlsKey: undefined,
          code: undefined,
        };
      })
      .addCase(closeBreakEntryEditForm, (state) => {
        // Clear page message and errors when break entry edit form is closed
        state.pageMessage = {
          show: false,
          type: 'error',
          message: '',
          titleNlsKey: undefined,
          title: undefined,
          descriptionNlsKey: undefined,
          code: undefined,
        };
      });
  },
});

export const {
  setPreferencesOpen,
  setDeleteModalOpen,
  setIsCreateOrEditBreakOpen,
  setIsCreateBreakOpen,
  setIsEditBreakOpen,
  setIsAssignmentEditorOpen,
  setBreakToDelete,
  setBreakToEdit,
  setIsAddBreakRuleEnabled,
  closeDrawer,
  setPageMessage,
  clearPageMessage,
  openUnsavedChangesModal,
  closeUnsavedChangesModal,
  resetUiState,
} = uiSlice.actions;

// Selectors
export const selectPreferencesOpen = (state: { ui: UIState }) =>
  state.ui.preferencesOpen;
export const selectDeleteModalOpen = (state: { ui: UIState }) =>
  state.ui.deleteModalOpen;
export const selectIsCreateOrEditBreakOpen = (state: { ui: UIState }) =>
  state.ui.isCreateOrEditBreakOpen;
export const selectIsCreateBreakOpen = (state: { ui: UIState }) =>
  state.ui.isCreateBreakOpen;
export const selectIsEditBreakOpen = (state: { ui: UIState }) =>
  state.ui.isEditBreakOpen;
export const selectIsAssignmentEditorOpen = (state: { ui: UIState }) =>
  state.ui.isAssignmentEditorOpen;
export const selectIsDrawerOpen = (state: { ui: UIState }) =>
  state.ui.isCreateBreakOpen ||
  state.ui.isEditBreakOpen ||
  state.ui.isAssignmentEditorOpen;
export const selectBreakToDelete = (state: { ui: UIState }) =>
  state.ui.breakToDelete;
export const selectBreakToEdit = (state: { ui: UIState }) =>
  state.ui.breakToEdit;
export const selectIsAddBreakRuleEnabled = (state: { ui: UIState }) =>
  state.ui.isAddBreakRuleEnabled;
export const selectPageMessage = (state: { ui: UIState }) =>
  state.ui.pageMessage;
export const selectUnsavedChangesModal = (state: { ui: UIState }) =>
  state.ui.unsavedChangesModal;

export default uiSlice.reducer;
