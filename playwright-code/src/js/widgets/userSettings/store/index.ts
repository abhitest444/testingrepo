import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import notificationsReducer from './slices/notificationsSlice';
import settingsContextReducer from './slices/settingsContextSlice';
import breaksReducer from './slices/breaksSlice';
import locationReducer from './slices/locationSlice';
import overtimeReducer from './slices/overtimeSlice';
import overtimeNotificationsReducer from './slices/overtimeNotificationsSlice';
import scheduleNotificationsReducer from './slices/scheduleNotificationsSlice';
import permissionsReducer from './slices/permissionsSlice';

/**
 * Redux store configuration for User Settings
 * Manages all user settings state across different categories
 */
const store = configureStore({
  reducer: {
    settingsContext: settingsContextReducer, // Manages settings context (timeForType and id)
    notifications: notificationsReducer, // Manages notification settings and preferences
    breaks: breaksReducer, // Manages break rules for VIEW/EDIT modes
    location: locationReducer, // Manages location tracking settings for VIEW/EDIT modes
    overtime: overtimeReducer, // Manages overtime policy settings for VIEW/EDIT modes
    overtimeNotifications: overtimeNotificationsReducer, // Overtime alert rules from unified user settings
    scheduleNotifications: scheduleNotificationsReducer, // Schedule notification subscriptions from unified user settings
    permissions: permissionsReducer, // Manages worker permissions for VIEW/EDIT modes
  },
  devTools: {
    name: 'UserLevelSettings', // Widget name for Redux DevTools
  },
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
 * Typed version of useDispatch hook
 * Provides type safety for dispatch actions
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Typed version of useSelector hook
 * Provides type safety for state selection
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
