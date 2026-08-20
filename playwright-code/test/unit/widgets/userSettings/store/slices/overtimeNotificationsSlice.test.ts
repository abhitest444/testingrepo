// @ts-nocheck
/**
 * Tests for overtimeNotifications Redux slice (GET + save sync for overtime alert rules).
 */

import { configureStore } from '@reduxjs/toolkit';
import {
  aTimeTracking_OvertimeNotificationRule,
  aTimeTracking_OvertimeThreshold,
} from '__mocks__/__generated__/timeTracking';
import { TimeTracking_OvertimePeriod } from 'src/__generated__/timeTracking/graphql';
import overtimeNotificationsReducer, {
  mapUnifiedUserSettingsToOvertimeNotificationRules,
  resetOvertimeNotificationsState,
  setOvertimeNotificationsLoading,
  setOvertimeNotificationsError,
  setOvertimeNotificationDraftRules,
  cancelOvertimeNotificationsDraft,
  syncOvertimeNotificationRulesFromSave,
  selectOvertimeNotificationRules,
  selectOvertimeNotificationsHasLoadedFromApi,
} from 'src/js/widgets/userSettings/store/slices/overtimeNotificationsSlice';

const dayRule = aTimeTracking_OvertimeNotificationRule({
  id: 'persisted-day-1',
  threshold: aTimeTracking_OvertimeThreshold({
    period: TimeTracking_OvertimePeriod.Day,
  }),
});

describe('overtimeNotificationsSlice', () => {
  describe('mapUnifiedUserSettingsToOvertimeNotificationRules', () => {
    it('returns empty array when data is undefined', () => {
      expect(
        mapUnifiedUserSettingsToOvertimeNotificationRules(undefined),
      ).toEqual([]);
    });

    it('maps rules from query shape', () => {
      const data = {
        timeTrackingUnifiedUserSettings: {
          overtimeNotifications: {
            rules: [dayRule],
          },
        },
      };
      expect(mapUnifiedUserSettingsToOvertimeNotificationRules(data)).toEqual([
        dayRule,
      ]);
    });

    it('filters null entries from rules', () => {
      const data = {
        timeTrackingUnifiedUserSettings: {
          overtimeNotifications: {
            rules: [dayRule, null],
          },
        },
      };
      expect(mapUnifiedUserSettingsToOvertimeNotificationRules(data)).toEqual([
        dayRule,
      ]);
    });
  });

  describe('reducers', () => {
    const makeStore = () =>
      configureStore({
        reducer: { overtimeNotifications: overtimeNotificationsReducer },
      });

    it('resetOvertimeNotificationsState with payload sets rules, draftRules, hasLoadedFromApi true', () => {
      const store = makeStore();
      store.dispatch(resetOvertimeNotificationsState({} as any));
      const state = store.getState().overtimeNotifications;
      expect(state.hasLoadedFromApi).toBe(true);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
    });

    it('resetOvertimeNotificationsState(undefined) clears hasLoadedFromApi', () => {
      const store = makeStore();
      store.dispatch(resetOvertimeNotificationsState(undefined));
      const state = store.getState().overtimeNotifications;
      expect(state.hasLoadedFromApi).toBe(false);
      expect(state.rules).toEqual([]);
    });

    it('setOvertimeNotificationsLoading(true) clears hasLoadedFromApi', () => {
      const store = makeStore();
      store.dispatch(resetOvertimeNotificationsState({} as any));
      store.dispatch(setOvertimeNotificationsLoading(true));
      expect(store.getState().overtimeNotifications.hasLoadedFromApi).toBe(
        false,
      );
      expect(store.getState().overtimeNotifications.loading).toBe(true);
    });

    it('setOvertimeNotificationsError sets error and hasLoadedFromApi', () => {
      const store = makeStore();
      store.dispatch(setOvertimeNotificationsError('boom'));
      const state = store.getState().overtimeNotifications;
      expect(state.error).toBe('boom');
      expect(state.loading).toBe(false);
      expect(state.hasLoadedFromApi).toBe(true);
    });

    it('cancelOvertimeNotificationsDraft copies rules into draftRules', () => {
      const store = makeStore();
      store.dispatch(syncOvertimeNotificationRulesFromSave([dayRule]));
      store.dispatch(setOvertimeNotificationDraftRules([]));
      store.dispatch(cancelOvertimeNotificationsDraft());
      expect(selectOvertimeNotificationRules(store.getState())).toEqual([
        dayRule,
      ]);
      expect(store.getState().overtimeNotifications.draftRules).toEqual([
        dayRule,
      ]);
    });

    it('syncOvertimeNotificationRulesFromSave updates rules and draftRules', () => {
      const store = makeStore();
      store.dispatch(syncOvertimeNotificationRulesFromSave([dayRule]));
      const s = store.getState().overtimeNotifications;
      expect(s.rules).toEqual([dayRule]);
      expect(s.draftRules).toEqual([dayRule]);
      expect(s.hasLoadedFromApi).toBe(true);
    });
  });

  describe('selectors', () => {
    it('selectOvertimeNotificationsHasLoadedFromApi reads state', () => {
      const store = configureStore({
        reducer: { overtimeNotifications: overtimeNotificationsReducer },
      });
      expect(
        selectOvertimeNotificationsHasLoadedFromApi(store.getState()),
      ).toBe(false);
      store.dispatch(resetOvertimeNotificationsState({} as any));
      expect(
        selectOvertimeNotificationsHasLoadedFromApi(store.getState()),
      ).toBe(true);
    });
  });
});
