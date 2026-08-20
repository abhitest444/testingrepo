import { PageMessageType } from '@ids-ts/page-message/dist/types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Page message state for displaying notifications
 */
export interface PageMessage {
  show: boolean;
  type: PageMessageType;
  message: string;
  titleNlsKey?: string;
  title?: string;
  descriptionNlsKey?: string;
  code?: string;
}

/**
 * Assignment drawer types
 */
export type AssignmentDrawerType = 'create' | 'edit' | 'bulkAssign' | null;

/**
 * UI slice state for managing UI-related state
 */
interface UIState {
  // Drawer states
  isAssignmentDrawerOpen: boolean;
  assignmentDrawerType: AssignmentDrawerType;
  selectedAssignmentId: string | null;

  // Modal states
  deleteModalOpen: boolean;
  bulkDeleteModalOpen: boolean;
  confirmationModalOpen: boolean;

  // Filter panel
  isFilterPanelOpen: boolean;

  // Page message
  pageMessage: PageMessage;

  // Unsaved changes modal
  unsavedChangesModal: {
    isOpen: boolean;
    pendingActionType: string | null;
  };

  // Data grid state
  isDataGridLoading: boolean;

  // Bulk actions
  bulkActionMode: boolean;
}

/**
 * Initial state for UI slice
 */
const initialState: UIState = {
  // Drawer states
  isAssignmentDrawerOpen: false,
  assignmentDrawerType: null,
  selectedAssignmentId: null,

  // Modal states
  deleteModalOpen: false,
  bulkDeleteModalOpen: false,
  confirmationModalOpen: false,

  // Filter panel
  isFilterPanelOpen: false,

  // Page message
  pageMessage: {
    show: false,
    type: 'error',
    message: '',
    titleNlsKey: undefined,
    title: undefined,
    descriptionNlsKey: undefined,
    code: undefined,
  },

  // Unsaved changes modal
  unsavedChangesModal: {
    isOpen: false,
    pendingActionType: null,
  },

  // Data grid state
  isDataGridLoading: false,

  // Bulk actions
  bulkActionMode: false,
};

/**
 * UI slice for managing UI-related state
 */
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Assignment drawer actions
    openAssignmentDrawer: (
      state,
      action: PayloadAction<{
        type: AssignmentDrawerType;
        assignmentId?: string;
      }>,
    ) => {
      state.isAssignmentDrawerOpen = true;
      state.assignmentDrawerType = action.payload.type;
      state.selectedAssignmentId = action.payload.assignmentId ?? null;
      // Clear page message when opening drawer
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
    closeAssignmentDrawer: (state) => {
      state.isAssignmentDrawerOpen = false;
      state.assignmentDrawerType = null;
      state.selectedAssignmentId = null;
      // Clear page message when closing drawer
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

    // Modal actions
    setDeleteModalOpen: (state, action: PayloadAction<boolean>) => {
      state.deleteModalOpen = action.payload;
      if (!action.payload) {
        state.selectedAssignmentId = null;
      }
    },
    setBulkDeleteModalOpen: (state, action: PayloadAction<boolean>) => {
      state.bulkDeleteModalOpen = action.payload;
    },
    setConfirmationModalOpen: (state, action: PayloadAction<boolean>) => {
      state.confirmationModalOpen = action.payload;
    },

    // Filter panel actions
    toggleFilterPanel: (state) => {
      state.isFilterPanelOpen = !state.isFilterPanelOpen;
    },
    setFilterPanelOpen: (state, action: PayloadAction<boolean>) => {
      state.isFilterPanelOpen = action.payload;
    },

    // Page message actions
    setPageMessage: (state, action: PayloadAction<PageMessage>) => {
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
    showSuccessMessage: (
      state,
      action: PayloadAction<{
        message: string;
        title?: string;
        titleNlsKey?: string;
      }>,
    ) => {
      state.pageMessage = {
        show: true,
        type: 'success',
        message: action.payload.message,
        title: action.payload.title,
        titleNlsKey: action.payload.titleNlsKey,
      };
    },
    showErrorMessage: (
      state,
      action: PayloadAction<{
        message: string;
        title?: string;
        titleNlsKey?: string;
        code?: string;
      }>,
    ) => {
      state.pageMessage = {
        show: true,
        type: 'error',
        message: action.payload.message,
        title: action.payload.title,
        titleNlsKey: action.payload.titleNlsKey,
        code: action.payload.code,
      };
    },
    showWarningMessage: (
      state,
      action: PayloadAction<{
        message: string;
        title?: string;
        titleNlsKey?: string;
      }>,
    ) => {
      state.pageMessage = {
        show: true,
        type: 'warn',
        message: action.payload.message,
        title: action.payload.title,
        titleNlsKey: action.payload.titleNlsKey,
      };
    },

    // Unsaved changes modal actions
    openUnsavedChangesModal: (state, action: PayloadAction<string>) => {
      state.unsavedChangesModal.isOpen = true;
      state.unsavedChangesModal.pendingActionType = action.payload;
    },
    closeUnsavedChangesModal: (state) => {
      state.unsavedChangesModal.isOpen = false;
      state.unsavedChangesModal.pendingActionType = null;
    },

    // Data grid loading
    setDataGridLoading: (state, action: PayloadAction<boolean>) => {
      state.isDataGridLoading = action.payload;
    },

    // Bulk actions
    setBulkActionMode: (state, action: PayloadAction<boolean>) => {
      state.bulkActionMode = action.payload;
    },
    toggleBulkActionMode: (state) => {
      state.bulkActionMode = !state.bulkActionMode;
    },

    // Clear all UI state
    resetUIState: (state) => {
      state.isAssignmentDrawerOpen = false;
      state.assignmentDrawerType = null;
      state.selectedAssignmentId = null;
      state.deleteModalOpen = false;
      state.bulkDeleteModalOpen = false;
      state.confirmationModalOpen = false;
      state.isFilterPanelOpen = false;
      state.pageMessage = {
        show: false,
        type: 'error',
        message: '',
        titleNlsKey: undefined,
        title: undefined,
        descriptionNlsKey: undefined,
        code: undefined,
      };
      state.unsavedChangesModal = {
        isOpen: false,
        pendingActionType: null,
      };
      state.isDataGridLoading = false;
      state.bulkActionMode = false;
    },
  },
});

// Export actions
export const {
  openAssignmentDrawer,
  closeAssignmentDrawer,
  setDeleteModalOpen,
  setBulkDeleteModalOpen,
  setConfirmationModalOpen,
  toggleFilterPanel,
  setFilterPanelOpen,
  setPageMessage,
  clearPageMessage,
  showSuccessMessage,
  showErrorMessage,
  showWarningMessage,
  openUnsavedChangesModal,
  closeUnsavedChangesModal,
  setDataGridLoading,
  setBulkActionMode,
  toggleBulkActionMode,
  resetUIState,
} = uiSlice.actions;

// Selectors
export const selectIsAssignmentDrawerOpen = (state: { ui: UIState }) =>
  state.ui.isAssignmentDrawerOpen;
export const selectAssignmentDrawerType = (state: { ui: UIState }) =>
  state.ui.assignmentDrawerType;
export const selectSelectedAssignmentId = (state: { ui: UIState }) =>
  state.ui.selectedAssignmentId;
export const selectDeleteModalOpen = (state: { ui: UIState }) =>
  state.ui.deleteModalOpen;
export const selectBulkDeleteModalOpen = (state: { ui: UIState }) =>
  state.ui.bulkDeleteModalOpen;
export const selectConfirmationModalOpen = (state: { ui: UIState }) =>
  state.ui.confirmationModalOpen;
export const selectIsFilterPanelOpen = (state: { ui: UIState }) =>
  state.ui.isFilterPanelOpen;
export const selectPageMessage = (state: { ui: UIState }) =>
  state.ui.pageMessage;
export const selectUnsavedChangesModal = (state: { ui: UIState }) =>
  state.ui.unsavedChangesModal;
export const selectIsDataGridLoading = (state: { ui: UIState }) =>
  state.ui.isDataGridLoading;
export const selectBulkActionMode = (state: { ui: UIState }) =>
  state.ui.bulkActionMode;

export default uiSlice.reducer;
