/**
 * Redux Toolkit slice for Notifications settings
 * Migrated from Context API to Redux for better state management
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TimeTrackingEffectiveUserSettingsQuery } from 'src/__generated__/timeTracking/graphql';
import {
  NotificationSettings,
  NotificationsCardMode,
} from '../../components/cards/NotificationsCard/types/NotificationsCard.types';
import { mapEffectiveUserSettings } from '../../components/cards/NotificationsCard/utils/NotificationsCard.utils';
import type { RootState } from '../index';

// Default notification settings
const DEFAULT_SETTINGS: NotificationSettings = {
  clockInTime: '8:00 AM',
  clockOutTime: '5:00 PM',
  daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
  clockInEmail: false,
  clockInMobile: false,
  clockOutEmail: false,
  clockOutMobile: false,
  // TODO: Enable these settings once they are implemented and available from the API
  // notificationSetting: 'custom',
  // adjustNotification: 'Admins and managers',
  // notesNotification: 'Admins and managers',
  // scheduleEmail: true,
  // scheduleMobile: true,
  // shiftReminderEmail: true,
  // shiftReminderMobile: false,
  // timeOffEmail: true,
  // timeOffMobile: true,
  versions: {
    clockInReminderTime: '1',
    clockInNotificationMedium: '1',
    clockOutReminderTime: '1',
    clockOutNotificationMedium: '1',
    notificationEnabledForDays: '1',
  },
};

// State interface
export interface NotificationsState {
  mode: NotificationsCardMode;
  settings: NotificationSettings;
  draftSettings: NotificationSettings;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: NotificationsState = {
  mode: NotificationsCardMode.VIEW,
  settings: DEFAULT_SETTINGS,
  draftSettings: DEFAULT_SETTINGS,
  loading: false,
  error: null,
};

// Create the slice
const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // Set the current mode (VIEW or EDIT)
    setMode: (state, action: PayloadAction<NotificationsCardMode>) => {
      state.mode = action.payload;
      // When entering edit mode, copy current settings to draft
      if (action.payload === NotificationsCardMode.EDIT) {
        state.draftSettings = { ...state.settings };
      }
    },

    // Update draft settings (used while editing)
    updateDraft: (
      state,
      action: PayloadAction<Partial<NotificationSettings>>,
    ) => {
      state.draftSettings = { ...state.draftSettings, ...action.payload };
    },

    // Save draft settings to current settings
    // Optionally accepts updated data from API to merge versions
    saveSettings: (
      state,
      action: PayloadAction<TimeTrackingEffectiveUserSettingsQuery | undefined>,
    ) => {
      // Start with draft settings
      state.settings = { ...state.draftSettings };

      // If API data is provided, extract and update versions
      if (action.payload?.timeTrackingEffectiveUserSettings) {
        const apiData = action.payload.timeTrackingEffectiveUserSettings;

        // Update version numbers from API response in both settings and draftSettings
        if (apiData.clockInSetting?.reminderTime?.meta?.version) {
          state.settings.versions.clockInReminderTime =
            apiData.clockInSetting.reminderTime.meta.version;
          state.draftSettings.versions.clockInReminderTime =
            apiData.clockInSetting.reminderTime.meta.version;
        }

        if (apiData.clockInSetting?.notificationMedium?.meta?.version) {
          state.settings.versions.clockInNotificationMedium =
            apiData.clockInSetting.notificationMedium.meta.version;
          state.draftSettings.versions.clockInNotificationMedium =
            apiData.clockInSetting.notificationMedium.meta.version;
        }

        if (apiData.clockOutSetting?.reminderTime?.meta?.version) {
          state.settings.versions.clockOutReminderTime =
            apiData.clockOutSetting.reminderTime.meta.version;
          state.draftSettings.versions.clockOutReminderTime =
            apiData.clockOutSetting.reminderTime.meta.version;
        }

        if (apiData.clockOutSetting?.notificationMedium?.meta?.version) {
          state.settings.versions.clockOutNotificationMedium =
            apiData.clockOutSetting.notificationMedium.meta.version;
          state.draftSettings.versions.clockOutNotificationMedium =
            apiData.clockOutSetting.notificationMedium.meta.version;
        }

        if (apiData.notificationEnabledForDays?.meta?.version) {
          state.settings.versions.notificationEnabledForDays =
            apiData.notificationEnabledForDays.meta.version;
          state.draftSettings.versions.notificationEnabledForDays =
            apiData.notificationEnabledForDays.meta.version;
        }
      }

      state.mode = NotificationsCardMode.VIEW;
    },

    // Commit draft to saved state and flip to VIEW without syncing API versions
    commitDraft: (state) => {
      state.settings = { ...state.draftSettings };
      state.mode = NotificationsCardMode.VIEW;
    },

    // Cancel edit mode and discard draft changes
    cancelEdit: (state) => {
      state.draftSettings = { ...state.settings };
      state.mode = NotificationsCardMode.VIEW;
    },

    // Reset state with data from API
    resetState: (
      state,
      action: PayloadAction<TimeTrackingEffectiveUserSettingsQuery | undefined>,
    ) => {
      const apiSettings = mapEffectiveUserSettings(action.payload);
      const mergedSettings = { ...DEFAULT_SETTINGS, ...apiSettings };

      state.mode = NotificationsCardMode.VIEW;
      state.settings = mergedSettings;
      state.draftSettings = mergedSettings;
      state.loading = false;
      state.error = null;
    },

    // Initialize with default settings
    initializeDefaults: (state) => {
      state.mode = NotificationsCardMode.VIEW;
      state.settings = DEFAULT_SETTINGS;
      state.draftSettings = DEFAULT_SETTINGS;
      state.loading = false;
      state.error = null;
    },

    // Set loading state
    setNotificationsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // Set error state
    setNotificationsError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

// Export actions
export const {
  setMode,
  updateDraft,
  saveSettings,
  commitDraft,
  cancelEdit,
  resetState,
  initializeDefaults,
  setNotificationsLoading,
  setNotificationsError,
} = notificationsSlice.actions;

// Selectors
export const selectNotificationsMode = (state: RootState) =>
  state.notifications.mode;
export const selectNotificationsSettings = (state: RootState) =>
  state.notifications.settings;
export const selectNotificationsDraftSettings = (state: RootState) =>
  state.notifications.draftSettings;
export const selectNotificationsState = (state: RootState) =>
  state.notifications;
export const selectNotificationsLoading = (state: RootState) =>
  state.notifications.loading;
export const selectNotificationsError = (state: RootState) =>
  state.notifications.error;

// Export reducer
export default notificationsSlice.reducer;
