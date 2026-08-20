import uiReducer, {
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
  selectIsAssignmentDrawerOpen,
  selectAssignmentDrawerType,
  selectSelectedAssignmentId,
  selectDeleteModalOpen,
  selectBulkDeleteModalOpen,
  selectConfirmationModalOpen,
  selectIsFilterPanelOpen,
  selectPageMessage,
  selectUnsavedChangesModal,
  selectIsDataGridLoading,
  selectBulkActionMode,
} from 'src/js/widgets/assignments/store/uiSlice';

describe('uiSlice', () => {
  const initialState = {
    isAssignmentDrawerOpen: false,
    assignmentDrawerType: null,
    selectedAssignmentId: null,
    deleteModalOpen: false,
    bulkDeleteModalOpen: false,
    confirmationModalOpen: false,
    isFilterPanelOpen: false,
    pageMessage: {
      show: false,
      type: 'error' as const,
      message: '',
      titleNlsKey: undefined,
      title: undefined,
      descriptionNlsKey: undefined,
      code: undefined,
    },
    unsavedChangesModal: {
      isOpen: false,
      pendingActionType: null,
    },
    isDataGridLoading: false,
    bulkActionMode: false,
  };

  describe('reducers', () => {
    describe('assignment drawer actions', () => {
      it('should open assignment drawer for create', () => {
        const state = uiReducer(
          initialState,
          openAssignmentDrawer({ type: 'create' }),
        );

        expect(state.isAssignmentDrawerOpen).toBe(true);
        expect(state.assignmentDrawerType).toBe('create');
        expect(state.selectedAssignmentId).toBeNull();
      });

      it('should open assignment drawer for edit with assignment id', () => {
        const state = uiReducer(
          initialState,
          openAssignmentDrawer({ type: 'edit', assignmentId: '123' }),
        );

        expect(state.isAssignmentDrawerOpen).toBe(true);
        expect(state.assignmentDrawerType).toBe('edit');
        expect(state.selectedAssignmentId).toBe('123');
      });

      it('should open assignment drawer for bulk assign', () => {
        const state = uiReducer(
          initialState,
          openAssignmentDrawer({ type: 'bulkAssign' }),
        );

        expect(state.isAssignmentDrawerOpen).toBe(true);
        expect(state.assignmentDrawerType).toBe('bulkAssign');
      });

      it('should clear page message when opening drawer', () => {
        const stateWithMessage = {
          ...initialState,
          pageMessage: {
            show: true,
            type: 'error' as const,
            message: 'Error occurred',
          },
        };

        const state = uiReducer(
          stateWithMessage,
          openAssignmentDrawer({ type: 'create' }),
        );

        expect(state.pageMessage.show).toBe(false);
        expect(state.pageMessage.message).toBe('');
      });

      it('should close assignment drawer', () => {
        const stateWithDrawer = uiReducer(
          initialState,
          openAssignmentDrawer({ type: 'edit', assignmentId: '123' }),
        );
        const state = uiReducer(stateWithDrawer, closeAssignmentDrawer());

        expect(state.isAssignmentDrawerOpen).toBe(false);
        expect(state.assignmentDrawerType).toBeNull();
        expect(state.selectedAssignmentId).toBeNull();
      });

      it('should clear page message when closing drawer', () => {
        const stateWithDrawerAndMessage = {
          ...initialState,
          isAssignmentDrawerOpen: true,
          pageMessage: {
            show: true,
            type: 'error' as const,
            message: 'Error occurred',
          },
        };

        const state = uiReducer(
          stateWithDrawerAndMessage,
          closeAssignmentDrawer(),
        );

        expect(state.pageMessage.show).toBe(false);
      });
    });

    describe('modal actions', () => {
      it('should open delete modal', () => {
        const state = uiReducer(initialState, setDeleteModalOpen(true));

        expect(state.deleteModalOpen).toBe(true);
      });

      it('should close delete modal and clear selected assignment', () => {
        const stateWithModal = {
          ...initialState,
          deleteModalOpen: true,
          selectedAssignmentId: '123',
        };
        const state = uiReducer(stateWithModal, setDeleteModalOpen(false));

        expect(state.deleteModalOpen).toBe(false);
        expect(state.selectedAssignmentId).toBeNull();
      });

      test.each([
        {
          description: 'should open bulk delete modal',
          action: setBulkDeleteModalOpen,
          payload: true,
          field: 'bulkDeleteModalOpen',
          expected: true,
        },
        {
          description: 'should close bulk delete modal',
          action: setBulkDeleteModalOpen,
          payload: false,
          field: 'bulkDeleteModalOpen',
          expected: false,
        },
        {
          description: 'should open confirmation modal',
          action: setConfirmationModalOpen,
          payload: true,
          field: 'confirmationModalOpen',
          expected: true,
        },
        {
          description: 'should close confirmation modal',
          action: setConfirmationModalOpen,
          payload: false,
          field: 'confirmationModalOpen',
          expected: false,
        },
      ])('$description', ({ action, payload, field, expected }) => {
        const state = uiReducer(initialState, action(payload));
        expect((state as any)[field]).toBe(expected);
      });
    });

    describe('filter panel actions', () => {
      it('should toggle filter panel', () => {
        const state = uiReducer(initialState, toggleFilterPanel());

        expect(state.isFilterPanelOpen).toBe(true);

        const toggledState = uiReducer(state, toggleFilterPanel());
        expect(toggledState.isFilterPanelOpen).toBe(false);
      });

      test.each([
        {
          description: 'should set filter panel open',
          payload: true,
          expected: true,
        },
        {
          description: 'should set filter panel closed',
          payload: false,
          expected: false,
        },
      ])('$description', ({ payload, expected }) => {
        const state = uiReducer(initialState, setFilterPanelOpen(payload));
        expect(state.isFilterPanelOpen).toBe(expected);
      });
    });

    describe('page message actions', () => {
      it('should set page message', () => {
        const state = uiReducer(
          initialState,
          setPageMessage({
            show: true,
            type: 'success',
            message: 'Success message',
            title: 'Success',
          }),
        );

        expect(state.pageMessage.show).toBe(true);
        expect(state.pageMessage.type).toBe('success');
        expect(state.pageMessage.message).toBe('Success message');
        expect(state.pageMessage.title).toBe('Success');
      });

      it('should clear page message', () => {
        const stateWithMessage = {
          ...initialState,
          pageMessage: {
            show: true,
            type: 'error' as const,
            message: 'Error occurred',
            title: 'Error',
          },
        };
        const state = uiReducer(stateWithMessage, clearPageMessage());

        expect(state.pageMessage.show).toBe(false);
        expect(state.pageMessage.message).toBe('');
        expect(state.pageMessage.title).toBeUndefined();
      });

      it('should show success message', () => {
        const state = uiReducer(
          initialState,
          showSuccessMessage({ message: 'Operation successful' }),
        );

        expect(state.pageMessage.show).toBe(true);
        expect(state.pageMessage.type).toBe('success');
        expect(state.pageMessage.message).toBe('Operation successful');
      });

      it('should show success message with title', () => {
        const state = uiReducer(
          initialState,
          showSuccessMessage({
            message: 'Operation successful',
            title: 'Success',
            titleNlsKey: 'success_key',
          }),
        );

        expect(state.pageMessage.title).toBe('Success');
        expect(state.pageMessage.titleNlsKey).toBe('success_key');
      });

      it('should show error message', () => {
        const state = uiReducer(
          initialState,
          showErrorMessage({ message: 'Error occurred' }),
        );

        expect(state.pageMessage.show).toBe(true);
        expect(state.pageMessage.type).toBe('error');
        expect(state.pageMessage.message).toBe('Error occurred');
      });

      it('should show error message with code', () => {
        const state = uiReducer(
          initialState,
          showErrorMessage({
            message: 'Error occurred',
            title: 'Error',
            code: 'ERR_001',
          }),
        );

        expect(state.pageMessage.code).toBe('ERR_001');
        expect(state.pageMessage.title).toBe('Error');
      });

      it('should show warning message', () => {
        const state = uiReducer(
          initialState,
          showWarningMessage({ message: 'Warning message' }),
        );

        expect(state.pageMessage.show).toBe(true);
        expect(state.pageMessage.type).toBe('warn');
        expect(state.pageMessage.message).toBe('Warning message');
      });
    });

    describe('unsaved changes modal actions', () => {
      it('should open unsaved changes modal', () => {
        const state = uiReducer(
          initialState,
          openUnsavedChangesModal('delete'),
        );

        expect(state.unsavedChangesModal.isOpen).toBe(true);
        expect(state.unsavedChangesModal.pendingActionType).toBe('delete');
      });

      it('should close unsaved changes modal', () => {
        const stateWithModal = {
          ...initialState,
          unsavedChangesModal: {
            isOpen: true,
            pendingActionType: 'delete',
          },
        };
        const state = uiReducer(stateWithModal, closeUnsavedChangesModal());

        expect(state.unsavedChangesModal.isOpen).toBe(false);
        expect(state.unsavedChangesModal.pendingActionType).toBeNull();
      });
    });

    describe('data grid loading', () => {
      test.each([
        {
          description: 'should set data grid loading',
          payload: true,
          expected: true,
        },
        {
          description: 'should clear data grid loading',
          payload: false,
          expected: false,
        },
      ])('$description', ({ payload, expected }) => {
        const state = uiReducer(initialState, setDataGridLoading(payload));
        expect(state.isDataGridLoading).toBe(expected);
      });
    });

    describe('bulk action mode', () => {
      it('should set bulk action mode', () => {
        const state = uiReducer(initialState, setBulkActionMode(true));

        expect(state.bulkActionMode).toBe(true);
      });

      it('should toggle bulk action mode', () => {
        const state = uiReducer(initialState, toggleBulkActionMode());

        expect(state.bulkActionMode).toBe(true);

        const toggledState = uiReducer(state, toggleBulkActionMode());
        expect(toggledState.bulkActionMode).toBe(false);
      });
    });

    describe('resetUIState', () => {
      it('should reset all UI state to initial values', () => {
        const modifiedState = {
          isAssignmentDrawerOpen: true,
          assignmentDrawerType: 'edit' as const,
          selectedAssignmentId: '123',
          deleteModalOpen: true,
          bulkDeleteModalOpen: true,
          confirmationModalOpen: true,
          isFilterPanelOpen: true,
          pageMessage: {
            show: true,
            type: 'error' as const,
            message: 'Error',
          },
          unsavedChangesModal: {
            isOpen: true,
            pendingActionType: 'delete',
          },
          isDataGridLoading: true,
          bulkActionMode: true,
        };

        const state = uiReducer(modifiedState, resetUIState());

        expect(state).toEqual(initialState);
      });
    });
  });

  describe('selectors', () => {
    const mockState = {
      ui: {
        isAssignmentDrawerOpen: true,
        assignmentDrawerType: 'edit' as const,
        selectedAssignmentId: '123',
        deleteModalOpen: true,
        bulkDeleteModalOpen: false,
        confirmationModalOpen: false,
        isFilterPanelOpen: true,
        pageMessage: {
          show: true,
          type: 'success' as const,
          message: 'Success message',
        },
        unsavedChangesModal: {
          isOpen: true,
          pendingActionType: 'delete',
        },
        isDataGridLoading: false,
        bulkActionMode: true,
      },
    };

    it('should select isAssignmentDrawerOpen', () => {
      expect(selectIsAssignmentDrawerOpen(mockState)).toBe(true);
    });

    it('should select assignmentDrawerType', () => {
      expect(selectAssignmentDrawerType(mockState)).toBe('edit');
    });

    it('should select selectedAssignmentId', () => {
      expect(selectSelectedAssignmentId(mockState)).toBe('123');
    });

    it('should select deleteModalOpen', () => {
      expect(selectDeleteModalOpen(mockState)).toBe(true);
    });

    it('should select bulkDeleteModalOpen', () => {
      expect(selectBulkDeleteModalOpen(mockState)).toBe(false);
    });

    it('should select confirmationModalOpen', () => {
      expect(selectConfirmationModalOpen(mockState)).toBe(false);
    });

    it('should select isFilterPanelOpen', () => {
      expect(selectIsFilterPanelOpen(mockState)).toBe(true);
    });

    it('should select pageMessage', () => {
      const pageMessage = selectPageMessage(mockState);

      expect(pageMessage.show).toBe(true);
      expect(pageMessage.type).toBe('success');
      expect(pageMessage.message).toBe('Success message');
    });

    it('should select unsavedChangesModal', () => {
      const modal = selectUnsavedChangesModal(mockState);

      expect(modal.isOpen).toBe(true);
      expect(modal.pendingActionType).toBe('delete');
    });

    it('should select isDataGridLoading', () => {
      expect(selectIsDataGridLoading(mockState)).toBe(false);
    });

    it('should select bulkActionMode', () => {
      expect(selectBulkActionMode(mockState)).toBe(true);
    });
  });
});
