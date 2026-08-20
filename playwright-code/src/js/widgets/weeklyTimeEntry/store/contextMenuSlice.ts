import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Context information for positioning and identifying the context menu
 * Contains coordinates and grid position data for proper menu placement
 */
export interface ContextMenuContext {
  x: number; // X coordinate for menu positioning
  y: number; // Y coordinate for menu positioning
  rowId: string | null; // Row ID in the time entry grid
  dayIdx: number | null; // Day index in the weekly view
  menuType?: 'default' | 'superSearch'; // Type of context menu to display
}

/**
 * Represents a cell's data that can be copied to clipboard
 * Used for copy/paste functionality in the time entry grid
 */
export interface ClipboardCell {
  value: any; // The cell value to be copied (time entry data, etc.)
}

/**
 * State interface for context menu functionality
 * Manages visibility, positioning context, and clipboard operations
 */
export interface ContextMenuState {
  visible: boolean; // Whether the context menu is currently visible
  context: ContextMenuContext | null; // Current context for menu positioning
  clipboard: ClipboardCell | null; // Currently copied cell data
}

// Initial state for context menu slice
const initialState: ContextMenuState = {
  visible: false,
  context: null,
  clipboard: null,
};

/**
 * Redux slice for managing context menu state and operations
 * Handles opening/closing context menus and clipboard functionality
 */
const contextMenuSlice = createSlice({
  name: 'contextMenu',
  initialState,
  reducers: {
    /**
     * Opens the context menu at the specified position with given context
     * @param state - Current context menu state
     * @param action - Payload containing menu position and context data
     */
    openContextMenu: (state, action: PayloadAction<ContextMenuContext>) => {
      state.visible = true;
      state.context = action.payload;
    },
    /**
     * Closes the context menu and clears its context
     * @param state - Current context menu state
     */
    closeContextMenu: (state) => {
      state.visible = false;
      state.context = null;
    },
    /**
     * Sets the clipboard with cell data for copy/paste operations
     * @param state - Current context menu state
     * @param action - Payload containing cell data to copy
     */
    setClipboard: (state, action: PayloadAction<ClipboardCell>) => {
      state.clipboard = action.payload;
    },
    /**
     * Clears the clipboard data
     * @param state - Current context menu state
     */
    clearClipboard: (state) => {
      state.clipboard = null;
    },
    /**
     * Resets context menu to initial state
     * Closes menu, clears context, and clears clipboard
     * @param state - Current context menu state
     */
    resetContextMenu: (state) => {
      state.visible = false;
      state.context = null;
      state.clipboard = null;
    },
  },
});

// Export actions for use in components
export const {
  openContextMenu,
  closeContextMenu,
  setClipboard,
  clearClipboard,
  resetContextMenu,
} = contextMenuSlice.actions;

// Export the reducer for store configuration
export default contextMenuSlice.reducer;
