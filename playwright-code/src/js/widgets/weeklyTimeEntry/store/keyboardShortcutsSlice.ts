import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface KeyboardShortcutState {
  lastPressedKey: string | null;
  isEnabled: boolean;
}

const initialState: KeyboardShortcutState = {
  lastPressedKey: null,
  isEnabled: true,
};

const keyboardShortcutsSlice = createSlice({
  name: 'keyboardShortcuts',
  initialState,
  reducers: {
    setLastPressedKey: (state, action: PayloadAction<string>) => {
      state.lastPressedKey = action.payload;
    },
    clearLastPressedKey: (state) => {
      state.lastPressedKey = null;
    },
    setKeyboardShortcutsEnabled: (state, action: PayloadAction<boolean>) => {
      state.isEnabled = action.payload;
    },
  },
});

export const {
  setLastPressedKey,
  clearLastPressedKey,
  setKeyboardShortcutsEnabled,
} = keyboardShortcutsSlice.actions;

export default keyboardShortcutsSlice.reducer;
