import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UndoRedoChange {
  rowId: string;
  dayIdx: number;
  originalHours: number;
  newHours: number;
}

export interface UndoRedoState {
  changes: UndoRedoChange[];
  currentIndex: number; // Points to the current state (-1 means no changes)
  maxHistorySize: number;
}

const initialState: UndoRedoState = {
  changes: [],
  currentIndex: -1,
  maxHistorySize: 50, // Keep last 50 changes
};

const undoRedoSlice = createSlice({
  name: 'undoRedo',
  initialState,
  reducers: {
    /**
     * Records a new change to the undo/redo history
     * @param state - Current undo/redo state
     * @param action - Payload containing the change details
     */
    recordChange: (state, action: PayloadAction<UndoRedoChange>) => {
      const newChange = action.payload;

      // Remove any changes after currentIndex (if we're in the middle of history)
      if (state.currentIndex < state.changes.length - 1) {
        state.changes = state.changes.slice(0, state.currentIndex + 1);
      }

      // Add the new change
      state.changes.push(newChange);
      state.currentIndex = state.changes.length - 1;

      // Limit history size
      if (state.changes.length > state.maxHistorySize) {
        state.changes = state.changes.slice(-state.maxHistorySize);
        state.currentIndex = state.changes.length - 1;
      }
    },

    /**
     * Moves the history index back for undo
     * @param state - Current undo/redo state
     */
    undo: (state) => {
      if (state.currentIndex >= 0) {
        state.currentIndex -= 1;
      }
    },

    /**
     * Moves the history index forward for redo
     * @param state - Current undo/redo state
     */
    redo: (state) => {
      if (state.currentIndex < state.changes.length - 1) {
        state.currentIndex += 1;
      }
    },

    /**
     * Clears all undo/redo history
     * @param state - Current undo/redo state
     */
    clearHistory: (state) => {
      state.changes = [];
      state.currentIndex = -1;
    },
  },
});

export const { recordChange, undo, redo, clearHistory } = undoRedoSlice.actions;

// Selectors
export const selectCanUndo = (state: { undoRedo: UndoRedoState }) =>
  state.undoRedo.currentIndex >= 0;

export const selectCanRedo = (state: { undoRedo: UndoRedoState }) =>
  state.undoRedo.currentIndex < state.undoRedo.changes.length - 1;

export const selectCurrentChange = (state: { undoRedo: UndoRedoState }) => {
  const { changes, currentIndex } = state.undoRedo;
  return currentIndex >= 0 ? changes[currentIndex] : null;
};

export const selectNextRedoChange = (state: { undoRedo: UndoRedoState }) => {
  const { changes, currentIndex } = state.undoRedo;
  const nextIndex = currentIndex + 1;
  return nextIndex < changes.length ? changes[nextIndex] : null;
};

export default undoRedoSlice.reducer;
