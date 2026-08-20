import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ModalState {
  openModals: string[];
  modalData: Record<string, unknown>;
}

const initialState: ModalState = {
  openModals: [],
  modalData: {},
};

const modalsSlice = createSlice({
  name: 'modals',
  initialState,
  reducers: {
    openModal: (
      state,
      action: PayloadAction<{ modalId: string; data?: unknown }>,
    ) => {
      const { modalId, data } = action.payload;
      if (!state.openModals.includes(modalId)) {
        state.openModals.push(modalId);
      }
      if (data) {
        state.modalData[modalId] = data;
      }
    },
    closeModal: (state, action: PayloadAction<string>) => {
      state.openModals = state.openModals.filter((id) => id !== action.payload);
      delete state.modalData[action.payload];
    },
    closeAllModals: (state) => {
      state.openModals = [];
      state.modalData = {};
    },
    resetModals: () => initialState,
  },
});

export const { openModal, closeModal, closeAllModals, resetModals } =
  modalsSlice.actions;

export default modalsSlice.reducer;
