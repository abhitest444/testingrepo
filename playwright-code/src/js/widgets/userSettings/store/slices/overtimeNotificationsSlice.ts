/**
 * Redux slice for overtime notification rules from
 * {@link GET_USER_OVERTIME_NOTIFICATIONS} (consumed via useOvertimeNotificationsCardData).
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { GetUserOvertimeNotificationsQuery } from 'src/js/service/hooks/userLevelSettings/useGetUserOvertimeNotifications';
import { TimeTracking_OvertimeNotificationRule } from 'src/__generated__/timeTracking/graphql';
import type { RootState } from '../index';

export const mapUnifiedUserSettingsToOvertimeNotificationRules = (
  data: GetUserOvertimeNotificationsQuery | undefined,
): TimeTracking_OvertimeNotificationRule[] => {
  const rules =
    data?.timeTrackingUnifiedUserSettings?.overtimeNotifications?.rules?.filter(
      (r): r is TimeTracking_OvertimeNotificationRule => r != null,
    );
  return rules ?? [];
};

export interface OvertimeNotificationsState {
  rules: TimeTracking_OvertimeNotificationRule[];
  draftRules: TimeTracking_OvertimeNotificationRule[];
  loading: boolean;
  error: string | null;
  /** False until first GET completes or fetch is skipped (no settingsFor). Prevents empty-state copy before API sync. */
  hasLoadedFromApi: boolean;
}

const initialState: OvertimeNotificationsState = {
  rules: [],
  draftRules: [],
  loading: false,
  error: null,
  hasLoadedFromApi: false,
};

const overtimeNotificationsSlice = createSlice({
  name: 'overtimeNotifications',
  initialState,
  reducers: {
    resetOvertimeNotificationsState: (
      state,
      action: PayloadAction<GetUserOvertimeNotificationsQuery | undefined>,
    ) => {
      const apiRules = mapUnifiedUserSettingsToOvertimeNotificationRules(
        action.payload,
      );
      state.rules = apiRules;
      state.draftRules = [...apiRules];
      state.loading = false;
      state.error = null;
      // Skip path (`undefined`) must not look "loaded" or the setup copy flashes before fetch runs.
      state.hasLoadedFromApi = action.payload !== undefined;
    },

    setOvertimeNotificationsLoading: (
      state,
      action: PayloadAction<boolean>,
    ) => {
      state.loading = action.payload;
      if (action.payload) {
        state.hasLoadedFromApi = false;
      }
    },

    setOvertimeNotificationsError: (
      state,
      action: PayloadAction<string | null>,
    ) => {
      state.error = action.payload;
      state.loading = false;
      state.hasLoadedFromApi = true;
    },

    /** Replace draft rules (e.g. while editing) */
    setOvertimeNotificationDraftRules: (
      state,
      action: PayloadAction<TimeTracking_OvertimeNotificationRule[]>,
    ) => {
      state.draftRules = action.payload;
    },

    /** Discard overtime draft edits */
    cancelOvertimeNotificationsDraft: (state) => {
      state.draftRules = [...state.rules];
    },

    /** After a successful overtime save mutation that returned rules */
    syncOvertimeNotificationRulesFromSave: (
      state,
      action: PayloadAction<TimeTracking_OvertimeNotificationRule[]>,
    ) => {
      state.rules = action.payload;
      state.draftRules = [...action.payload];
      state.hasLoadedFromApi = true;
    },
  },
});

export const {
  resetOvertimeNotificationsState,
  setOvertimeNotificationsLoading,
  setOvertimeNotificationsError,
  setOvertimeNotificationDraftRules,
  cancelOvertimeNotificationsDraft,
  syncOvertimeNotificationRulesFromSave,
} = overtimeNotificationsSlice.actions;

export const selectOvertimeNotificationRules = (state: RootState) =>
  state.overtimeNotifications.rules;
export const selectOvertimeNotificationDraftRules = (state: RootState) =>
  state.overtimeNotifications.draftRules;
export const selectOvertimeNotificationsLoading = (state: RootState) =>
  state.overtimeNotifications.loading;
export const selectOvertimeNotificationsHasLoadedFromApi = (state: RootState) =>
  state.overtimeNotifications.hasLoadedFromApi;
export const selectOvertimeNotificationsError = (state: RootState) =>
  state.overtimeNotifications.error;

export default overtimeNotificationsSlice.reducer;
