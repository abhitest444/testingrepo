import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  TimeTracking_NotificationReminderMedium,
  TimeTracking_NotificationType,
  TimeTracking_UnifiedUserScheduleNotificationSettings,
} from 'src/__generated__/timeTracking/graphql';
import type { RootState } from '../index';

export type GetUserScheduleNotificationsQueryResult = {
  timeTrackingUnifiedUserSettings?: {
    __typename?: 'TimeTracking_UnifiedUserSettings';
    scheduleNotifications?: TimeTracking_UnifiedUserScheduleNotificationSettings | null;
  } | null;
};

export interface ScheduleNotificationRow {
  notificationType: TimeTracking_NotificationType;
  distributionMethods: TimeTracking_NotificationReminderMedium[];
  version?: string | null;
}

export interface ScheduleNotificationsState {
  subscriptions: ScheduleNotificationRow[];
  draftSubscriptions: ScheduleNotificationRow[];
  loading: boolean;
  error: string | null;
  hasLoadedFromApi: boolean;
}

const initialState: ScheduleNotificationsState = {
  subscriptions: [],
  draftSubscriptions: [],
  loading: false,
  error: null,
  hasLoadedFromApi: false,
};

export const mapUnifiedUserSettingsToScheduleRows = (
  data: GetUserScheduleNotificationsQueryResult | undefined,
): ScheduleNotificationRow[] => {
  const subs =
    data?.timeTrackingUnifiedUserSettings?.scheduleNotifications?.subscriptions?.filter(
      (s): s is NonNullable<typeof s> => s != null,
    );
  return (subs ?? []).map((s) => ({
    notificationType: s.notificationType,
    distributionMethods: [...s.distributionMethods],
    version: s.meta?.version,
  }));
};

const scheduleNotificationsSlice = createSlice({
  name: 'scheduleNotifications',
  initialState,
  reducers: {
    resetScheduleNotificationsState: (
      state,
      action: PayloadAction<
        GetUserScheduleNotificationsQueryResult | undefined
      >,
    ) => {
      const rows = mapUnifiedUserSettingsToScheduleRows(action.payload);
      state.subscriptions = rows;
      state.draftSubscriptions = rows.map((r) => ({
        ...r,
        distributionMethods: [...r.distributionMethods],
      }));
      state.loading = false;
      state.error = null;
      // undefined payload means no entity context — treat as not yet loaded
      state.hasLoadedFromApi = action.payload !== undefined;
    },

    setScheduleNotificationsLoading: (
      state,
      action: PayloadAction<boolean>,
    ) => {
      state.loading = action.payload;
      if (action.payload) {
        state.hasLoadedFromApi = false;
      }
    },

    setScheduleNotificationsError: (
      state,
      action: PayloadAction<string | null>,
    ) => {
      state.error = action.payload;
      state.loading = false;
      // Mark loaded so the UI stops showing a spinner and renders the error state instead
      state.hasLoadedFromApi = true;
    },

    /** Toggle a single medium on a draft row (identified by notificationType). */
    toggleDraftScheduleChannel: (
      state,
      action: PayloadAction<{
        notificationType: TimeTracking_NotificationType;
        medium: TimeTracking_NotificationReminderMedium;
      }>,
    ) => {
      const { notificationType, medium } = action.payload;
      const row = state.draftSubscriptions.find(
        (r) => r.notificationType === notificationType,
      );
      if (row) {
        if (row.distributionMethods.includes(medium)) {
          row.distributionMethods = row.distributionMethods.filter(
            (m) => m !== medium,
          );
        } else {
          row.distributionMethods = [...row.distributionMethods, medium];
        }
      } else {
        // Row not yet in draft (no server record yet) — create it
        state.draftSubscriptions.push({
          notificationType,
          distributionMethods: [medium],
          version: undefined,
        });
      }
    },

    cancelScheduleNotificationsDraft: (state) => {
      state.draftSubscriptions = state.subscriptions.map((r) => ({
        ...r,
        distributionMethods: [...r.distributionMethods],
      }));
    },

    // Called after a successful mutation — replaces both saved and draft with the server-returned rows so versions stay in sync
    syncScheduleNotificationsWithSavedData: (
      state,
      action: PayloadAction<ScheduleNotificationRow[]>,
    ) => {
      state.subscriptions = action.payload;
      state.draftSubscriptions = action.payload.map((r) => ({
        ...r,
        distributionMethods: [...r.distributionMethods],
      }));
      state.hasLoadedFromApi = true;
    },
  },
});

export const {
  resetScheduleNotificationsState,
  setScheduleNotificationsLoading,
  setScheduleNotificationsError,
  toggleDraftScheduleChannel,
  cancelScheduleNotificationsDraft,
  syncScheduleNotificationsWithSavedData,
} = scheduleNotificationsSlice.actions;

export const selectScheduleNotificationSubscriptions = (state: RootState) =>
  state.scheduleNotifications.subscriptions;
export const selectScheduleNotificationDraftSubscriptions = (
  state: RootState,
) => state.scheduleNotifications.draftSubscriptions;
export const selectScheduleNotificationsLoading = (state: RootState) =>
  state.scheduleNotifications.loading;
export const selectScheduleNotificationsError = (state: RootState) =>
  state.scheduleNotifications.error;
export const selectScheduleNotificationsHasLoadedFromApi = (state: RootState) =>
  state.scheduleNotifications.hasLoadedFromApi;

// Server returns `ShiftStartAfterManager` subscription only for admins and group managers — regular workers never see it.
// Reads `subscriptions` (server truth), not `draftSubscriptions`, so visibility can't drift from what the API authorized.
export const selectHasManagerNotificationSubscription = (state: RootState) =>
  state.scheduleNotifications.subscriptions.some(
    (s) =>
      s.notificationType ===
      TimeTracking_NotificationType.ShiftStartAfterManager,
  );

export default scheduleNotificationsSlice.reducer;
