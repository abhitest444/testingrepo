import { configureStore } from '@reduxjs/toolkit';
import {
  TypedUseSelectorHook,
  useDispatch,
  useSelector,
  useStore,
} from 'react-redux';
import type { Store } from '@reduxjs/toolkit';
import { enableMapSet } from 'immer';
import timeEntryGridReducer from './timeEntryGridSlice';
import timeEntrySettingsReducer from './timeEntrySettingsSlice';
import customerDataReducer from './customerSlice';
import contextMenuReducer from './contextMenuSlice';
import breaksReducer from './breaksSlice';
import customFieldsReducer from './customFieldsSlice';
import dimensionsReducer from './dimensionsSlice';
import validationReducer from './validationSlice';
import keyboardShortcutsReducer from './keyboardShortcutsSlice';
import undoRedoReducer from './undoRedoSlice';
import assignmentReducer from './assignmentSlice';
import { assignmentMiddleware } from './assignmentMiddleware';

// Enable Immer's MapSet plugin for Map support
enableMapSet();

/**
 * Redux store configuration for the weekly time entry widget
 * Combines all slices into a single store with development tools enabled
 */
const store = configureStore({
  reducer: {
    timeEntryGrid: timeEntryGridReducer, // Manages time entry grid data and operations
    timeEntrySettings: timeEntrySettingsReducer, // Handles time entry settings and preferences
    customers: customerDataReducer, // Stores customer-specific data and configurations
    contextMenu: contextMenuReducer, // Handles context menu visibility and clipboard operations
    breaks: breaksReducer, // Manages breaks data and operations
    customFields: customFieldsReducer, // Manages custom fields definitions and state
    dimensions: dimensionsReducer, // Manages custom dimensions definitions, options and state
    validation: validationReducer, // Manages validation error state
    keyboardShortcuts: keyboardShortcutsReducer, // Manages keyboard shortcuts state
    undoRedo: undoRedoReducer, // Manages undo/redo history
    assignments: assignmentReducer, // Manages assignment-based field visibility (customer-based caching)
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(assignmentMiddleware as any),
  devTools:
    process.env.NODE_ENV !== 'production'
      ? { name: 'Weekly time entry Store' }
      : false,
});

/**
 * TypeScript type for the complete store state
 * Derived from the store's getState method for type safety
 */
export type RootState = ReturnType<typeof store.getState>;

/**
 * TypeScript type for the store's dispatch function
 * Used for properly typing dispatch actions
 */
export type AppDispatch = typeof store.dispatch;

/**
 * Typed dispatch hook for use throughout the application
 * Provides type safety when dispatching actions
 */
export const useAppDispatch: () => AppDispatch = useDispatch;

/**
 * Typed selector hook for use throughout the application
 * Provides type safety when selecting state from the store
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/**
 * Typed store hook for reading the LIVE state inside event handlers via
 * `store.getState()`. Needed when several sibling fields update the same cell
 * within one tick: reading a render-time snapshot would let each write clobber
 * the others, whereas getState() reflects writes already dispatched this tick.
 */
export const useAppStore: () => Store<RootState> = useStore;

// Export the configured store as default
export default store;
