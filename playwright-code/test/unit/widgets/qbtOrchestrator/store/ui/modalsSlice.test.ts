import modalsReducer, {
  openModal,
  closeModal,
  closeAllModals,
  resetModals,
} from 'src/js/widgets/qbtOrchestrator/store/ui/modalsSlice';

// Helper to create typed state
type ModalState = ReturnType<typeof modalsReducer>;

describe('modalsSlice', () => {
  const initialState: ModalState = {
    openModals: [],
    modalData: {},
  };

  describe('reducers', () => {
    describe('openModal', () => {
      it('should add modal to openModals array', () => {
        const state = modalsReducer(
          initialState,
          openModal({ modalId: 'confirmDelete' }),
        );

        expect(state.openModals).toContain('confirmDelete');
        expect(state.openModals).toHaveLength(1);
      });

      it('should store modal data when provided', () => {
        const modalData = { itemId: '123', itemName: 'Test Item' };
        const state = modalsReducer(
          initialState,
          openModal({ modalId: 'editModal', data: modalData }),
        );

        expect(state.modalData.editModal).toEqual(modalData);
      });

      it('should not add duplicate modals', () => {
        let state = modalsReducer(
          initialState,
          openModal({ modalId: 'testModal' }),
        );
        state = modalsReducer(state, openModal({ modalId: 'testModal' }));

        expect(state.openModals).toHaveLength(1);
      });

      it('should allow multiple different modals', () => {
        let state = modalsReducer(
          initialState,
          openModal({ modalId: 'modal1' }),
        );
        state = modalsReducer(state, openModal({ modalId: 'modal2' }));
        state = modalsReducer(state, openModal({ modalId: 'modal3' }));

        expect(state.openModals).toHaveLength(3);
        expect(state.openModals).toEqual(['modal1', 'modal2', 'modal3']);
      });

      it('should update modal data for existing modal', () => {
        let state = modalsReducer(
          initialState,
          openModal({ modalId: 'testModal', data: { value: 1 } }),
        );
        state = modalsReducer(
          state,
          openModal({ modalId: 'testModal', data: { value: 2 } }),
        );

        // Modal not duplicated
        expect(state.openModals).toHaveLength(1);
        // But data is updated
        expect(state.modalData.testModal).toEqual({ value: 2 });
      });

      it('should not set modalData when data is not provided', () => {
        const state = modalsReducer(
          initialState,
          openModal({ modalId: 'testModal' }),
        );

        expect(state.modalData.testModal).toBeUndefined();
      });
    });

    describe('closeModal', () => {
      it('should remove modal from openModals array', () => {
        const stateWithModal: ModalState = {
          openModals: ['testModal', 'anotherModal'],
          modalData: {},
        };

        const state = modalsReducer(stateWithModal, closeModal('testModal'));

        expect(state.openModals).not.toContain('testModal');
        expect(state.openModals).toContain('anotherModal');
      });

      it('should clear modal data when closing', () => {
        const stateWithData: ModalState = {
          openModals: ['editModal'],
          modalData: {
            editModal: { itemId: '123' },
          },
        };

        const state = modalsReducer(stateWithData, closeModal('editModal'));

        expect(state.modalData.editModal).toBeUndefined();
      });

      it('should handle closing non-existent modal gracefully', () => {
        const state = modalsReducer(
          initialState,
          closeModal('nonExistentModal'),
        );

        expect(state.openModals).toHaveLength(0);
      });

      it('should only close the specified modal', () => {
        const stateWithModals: ModalState = {
          openModals: ['modal1', 'modal2', 'modal3'],
          modalData: {
            modal1: { data: 1 },
            modal2: { data: 2 },
            modal3: { data: 3 },
          },
        };

        const state = modalsReducer(stateWithModals, closeModal('modal2'));

        expect(state.openModals).toEqual(['modal1', 'modal3']);
        expect(state.modalData.modal1).toEqual({ data: 1 });
        expect(state.modalData.modal2).toBeUndefined();
        expect(state.modalData.modal3).toEqual({ data: 3 });
      });
    });

    describe('closeAllModals', () => {
      it('should clear all modals', () => {
        const stateWithModals: ModalState = {
          openModals: ['modal1', 'modal2', 'modal3'],
          modalData: {
            modal1: { data: 1 },
            modal2: { data: 2 },
          },
        };

        const state = modalsReducer(stateWithModals, closeAllModals());

        expect(state.openModals).toHaveLength(0);
        expect(state.modalData).toEqual({});
      });

      it('should handle empty state gracefully', () => {
        const state = modalsReducer(initialState, closeAllModals());

        expect(state.openModals).toHaveLength(0);
        expect(state.modalData).toEqual({});
      });
    });

    describe('resetModals', () => {
      it('should reset to initial state', () => {
        const modifiedState: ModalState = {
          openModals: ['modal1', 'modal2'],
          modalData: {
            modal1: { foo: 'bar' },
            modal2: { baz: 'qux' },
          },
        };

        const state = modalsReducer(modifiedState, resetModals());

        expect(state).toEqual(initialState);
      });
    });
  });

  describe('complex modal scenarios', () => {
    it('should handle modal stack for nested modals', () => {
      let state: ModalState = initialState;

      // Open main modal
      state = modalsReducer(
        state,
        openModal({ modalId: 'mainModal', data: { step: 1 } }),
      );
      // Open confirmation modal on top
      state = modalsReducer(
        state,
        openModal({ modalId: 'confirmModal', data: { action: 'delete' } }),
      );

      expect(state.openModals).toEqual(['mainModal', 'confirmModal']);

      // Close confirmation
      state = modalsReducer(state, closeModal('confirmModal'));

      expect(state.openModals).toEqual(['mainModal']);
      expect(state.modalData.mainModal).toEqual({ step: 1 });
    });

    it('should support different data types in modalData', () => {
      let state: ModalState = initialState;

      state = modalsReducer(
        state,
        openModal({ modalId: 'stringModal', data: 'simple string' }),
      );
      state = modalsReducer(
        state,
        openModal({ modalId: 'numberModal', data: 42 }),
      );
      state = modalsReducer(
        state,
        openModal({ modalId: 'arrayModal', data: [1, 2, 3] }),
      );
      state = modalsReducer(
        state,
        openModal({
          modalId: 'objectModal',
          data: { nested: { value: true } },
        }),
      );

      expect(state.modalData.stringModal).toBe('simple string');
      expect(state.modalData.numberModal).toBe(42);
      expect(state.modalData.arrayModal).toEqual([1, 2, 3]);
      expect(state.modalData.objectModal).toEqual({
        nested: { value: true },
      });
    });
  });
});
