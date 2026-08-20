// @ts-nocheck
import { configureStore } from '@reduxjs/toolkit';
import {
  TimeTracking_NotificationReminderMedium,
  TimeTracking_NotificationType,
} from 'src/__generated__/timeTracking/graphql';
import scheduleNotificationsReducer, {
  mapUnifiedUserSettingsToScheduleRows,
  resetScheduleNotificationsState,
  setScheduleNotificationsLoading,
  setScheduleNotificationsError,
  toggleDraftScheduleChannel,
  cancelScheduleNotificationsDraft,
  syncScheduleNotificationsWithSavedData,
  selectScheduleNotificationSubscriptions,
  selectScheduleNotificationDraftSubscriptions,
  selectScheduleNotificationsHasLoadedFromApi,
  selectScheduleNotificationsLoading,
  selectScheduleNotificationsError,
} from 'src/js/widgets/userSettings/store/slices/scheduleNotificationsSlice';

const { Email, PushNotification } = TimeTracking_NotificationReminderMedium;
const { ShiftPublished, ShiftStartBefore } = TimeTracking_NotificationType;

const makeStore = () =>
  configureStore({
    reducer: { scheduleNotifications: scheduleNotificationsReducer },
  });

const shiftPublishedRow = {
  notificationType: ShiftPublished,
  distributionMethods: [Email],
  version: 'v1',
};

const shiftStartBeforeRow = {
  notificationType: ShiftStartBefore,
  distributionMethods: [PushNotification],
  version: 'v2',
};

// ---------------------------------------------------------------------------
// mapUnifiedUserSettingsToScheduleRows
// ---------------------------------------------------------------------------
describe('mapUnifiedUserSettingsToScheduleRows', () => {
  it('returns empty array when data is undefined', () => {
    expect(mapUnifiedUserSettingsToScheduleRows(undefined)).toEqual([]);
  });

  it('returns empty array when subscriptions is absent', () => {
    const data = {
      timeTrackingUnifiedUserSettings: { scheduleNotifications: {} },
    };
    expect(mapUnifiedUserSettingsToScheduleRows(data as any)).toEqual([]);
  });

  it('maps subscriptions to rows with notificationType, distributionMethods, and version', () => {
    const data = {
      timeTrackingUnifiedUserSettings: {
        scheduleNotifications: {
          subscriptions: [
            {
              notificationType: ShiftPublished,
              distributionMethods: [Email],
              meta: { version: 'v1' },
            },
          ],
        },
      },
    };
    expect(mapUnifiedUserSettingsToScheduleRows(data as any)).toEqual([
      {
        notificationType: ShiftPublished,
        distributionMethods: [Email],
        version: 'v1',
      },
    ]);
  });

  it('filters out null subscription entries', () => {
    const data = {
      timeTrackingUnifiedUserSettings: {
        scheduleNotifications: {
          subscriptions: [
            null,
            {
              notificationType: ShiftPublished,
              distributionMethods: [Email],
              meta: { version: 'v1' },
            },
          ],
        },
      },
    };
    const result = mapUnifiedUserSettingsToScheduleRows(data as any);
    expect(result).toHaveLength(1);
    expect(result[0].notificationType).toBe(ShiftPublished);
  });

  it('sets version to undefined when meta is absent', () => {
    const data = {
      timeTrackingUnifiedUserSettings: {
        scheduleNotifications: {
          subscriptions: [
            { notificationType: ShiftPublished, distributionMethods: [Email] },
          ],
        },
      },
    };
    const result = mapUnifiedUserSettingsToScheduleRows(data as any);
    expect(result[0].version).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// reducers
// ---------------------------------------------------------------------------
describe('reducers', () => {
  describe('resetScheduleNotificationsState', () => {
    it('sets subscriptions and draftSubscriptions from payload', () => {
      const store = makeStore();
      const data = {
        timeTrackingUnifiedUserSettings: {
          scheduleNotifications: {
            subscriptions: [
              {
                notificationType: ShiftPublished,
                distributionMethods: [Email],
                meta: { version: 'v1' },
              },
            ],
          },
        },
      };
      store.dispatch(resetScheduleNotificationsState(data as any));
      const state = store.getState().scheduleNotifications;
      expect(state.subscriptions).toEqual([
        {
          notificationType: ShiftPublished,
          distributionMethods: [Email],
          version: 'v1',
        },
      ]);
      expect(state.draftSubscriptions).toEqual(state.subscriptions);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
      expect(state.hasLoadedFromApi).toBe(true);
    });

    it('clears hasLoadedFromApi when payload is undefined', () => {
      const store = makeStore();
      store.dispatch(resetScheduleNotificationsState(undefined));
      const state = store.getState().scheduleNotifications;
      expect(state.hasLoadedFromApi).toBe(false);
      expect(state.subscriptions).toEqual([]);
    });

    it('deep-copies distributionMethods so draft is independent of saved', () => {
      const store = makeStore();
      const data = {
        timeTrackingUnifiedUserSettings: {
          scheduleNotifications: {
            subscriptions: [
              {
                notificationType: ShiftPublished,
                distributionMethods: [Email],
                meta: {},
              },
            ],
          },
        },
      };
      store.dispatch(resetScheduleNotificationsState(data as any));
      const state = store.getState().scheduleNotifications;
      expect(state.draftSubscriptions[0].distributionMethods).not.toBe(
        state.subscriptions[0].distributionMethods,
      );
    });
  });

  describe('setScheduleNotificationsLoading', () => {
    it('sets loading true and clears hasLoadedFromApi', () => {
      const store = makeStore();
      store.dispatch(resetScheduleNotificationsState({} as any));
      store.dispatch(setScheduleNotificationsLoading(true));
      const state = store.getState().scheduleNotifications;
      expect(state.loading).toBe(true);
      expect(state.hasLoadedFromApi).toBe(false);
    });

    it('sets loading false without touching hasLoadedFromApi', () => {
      const store = makeStore();
      store.dispatch(resetScheduleNotificationsState({} as any));
      store.dispatch(setScheduleNotificationsLoading(false));
      expect(store.getState().scheduleNotifications.loading).toBe(false);
      expect(store.getState().scheduleNotifications.hasLoadedFromApi).toBe(
        true,
      );
    });
  });

  describe('setScheduleNotificationsError', () => {
    it('sets error, clears loading, and marks hasLoadedFromApi true', () => {
      const store = makeStore();
      store.dispatch(setScheduleNotificationsLoading(true));
      store.dispatch(setScheduleNotificationsError('something went wrong'));
      const state = store.getState().scheduleNotifications;
      expect(state.error).toBe('something went wrong');
      expect(state.loading).toBe(false);
      expect(state.hasLoadedFromApi).toBe(true);
    });

    it('accepts null to clear a previous error', () => {
      const store = makeStore();
      store.dispatch(setScheduleNotificationsError('boom'));
      store.dispatch(setScheduleNotificationsError(null));
      expect(store.getState().scheduleNotifications.error).toBe(null);
    });
  });

  describe('toggleDraftScheduleChannel', () => {
    it('adds a medium to a draft row that exists but lacks it', () => {
      const store = makeStore();
      store.dispatch(
        syncScheduleNotificationsWithSavedData([shiftPublishedRow]),
      );
      store.dispatch(
        toggleDraftScheduleChannel({
          notificationType: ShiftPublished,
          medium: PushNotification,
        }),
      );
      const draft = selectScheduleNotificationDraftSubscriptions(
        store.getState(),
      );
      expect(draft[0].distributionMethods).toContain(PushNotification);
      expect(draft[0].distributionMethods).toContain(Email);
    });

    it('removes a medium from a draft row that already has it', () => {
      const store = makeStore();
      store.dispatch(
        syncScheduleNotificationsWithSavedData([shiftPublishedRow]),
      );
      store.dispatch(
        toggleDraftScheduleChannel({
          notificationType: ShiftPublished,
          medium: Email,
        }),
      );
      const draft = selectScheduleNotificationDraftSubscriptions(
        store.getState(),
      );
      expect(draft[0].distributionMethods).not.toContain(Email);
    });

    it('creates a new draft row when notificationType is not yet in draft', () => {
      const store = makeStore();
      store.dispatch(
        toggleDraftScheduleChannel({
          notificationType: ShiftPublished,
          medium: Email,
        }),
      );
      const draft = selectScheduleNotificationDraftSubscriptions(
        store.getState(),
      );
      expect(draft).toHaveLength(1);
      expect(draft[0]).toMatchObject({
        notificationType: ShiftPublished,
        distributionMethods: [Email],
        version: undefined,
      });
    });

    it('does not mutate saved subscriptions when draft is toggled', () => {
      const store = makeStore();
      store.dispatch(
        syncScheduleNotificationsWithSavedData([shiftPublishedRow]),
      );
      store.dispatch(
        toggleDraftScheduleChannel({
          notificationType: ShiftPublished,
          medium: PushNotification,
        }),
      );
      const saved = selectScheduleNotificationSubscriptions(store.getState());
      expect(saved[0].distributionMethods).toEqual([Email]);
    });
  });

  describe('cancelScheduleNotificationsDraft', () => {
    it('resets draftSubscriptions back to saved subscriptions', () => {
      const store = makeStore();
      store.dispatch(
        syncScheduleNotificationsWithSavedData([shiftPublishedRow]),
      );
      store.dispatch(
        toggleDraftScheduleChannel({
          notificationType: ShiftPublished,
          medium: PushNotification,
        }),
      );
      store.dispatch(cancelScheduleNotificationsDraft());
      const state = store.getState().scheduleNotifications;
      expect(state.draftSubscriptions).toEqual(state.subscriptions);
    });

    it('deep-copies distributionMethods on cancel so draft stays independent', () => {
      const store = makeStore();
      store.dispatch(
        syncScheduleNotificationsWithSavedData([shiftPublishedRow]),
      );
      store.dispatch(cancelScheduleNotificationsDraft());
      const state = store.getState().scheduleNotifications;
      expect(state.draftSubscriptions[0].distributionMethods).not.toBe(
        state.subscriptions[0].distributionMethods,
      );
    });
  });

  describe('syncScheduleNotificationsWithSavedData', () => {
    it('replaces subscriptions and draftSubscriptions with the provided rows', () => {
      const store = makeStore();
      store.dispatch(
        syncScheduleNotificationsWithSavedData([
          shiftPublishedRow,
          shiftStartBeforeRow,
        ]),
      );
      const state = store.getState().scheduleNotifications;
      expect(state.subscriptions).toEqual([
        shiftPublishedRow,
        shiftStartBeforeRow,
      ]);
      expect(state.draftSubscriptions).toEqual([
        shiftPublishedRow,
        shiftStartBeforeRow,
      ]);
      expect(state.hasLoadedFromApi).toBe(true);
    });

    it('deep-copies distributionMethods so draft is independent of saved', () => {
      const store = makeStore();
      store.dispatch(
        syncScheduleNotificationsWithSavedData([shiftPublishedRow]),
      );
      const state = store.getState().scheduleNotifications;
      expect(state.draftSubscriptions[0].distributionMethods).not.toBe(
        state.subscriptions[0].distributionMethods,
      );
    });
  });
});

// ---------------------------------------------------------------------------
// selectors
// ---------------------------------------------------------------------------
describe('selectors', () => {
  it('selectScheduleNotificationsHasLoadedFromApi reads state', () => {
    const store = makeStore();
    expect(selectScheduleNotificationsHasLoadedFromApi(store.getState())).toBe(
      false,
    );
    store.dispatch(resetScheduleNotificationsState({} as any));
    expect(selectScheduleNotificationsHasLoadedFromApi(store.getState())).toBe(
      true,
    );
  });

  it('selectScheduleNotificationsLoading reads loading flag', () => {
    const store = makeStore();
    expect(selectScheduleNotificationsLoading(store.getState())).toBe(false);
    store.dispatch(setScheduleNotificationsLoading(true));
    expect(selectScheduleNotificationsLoading(store.getState())).toBe(true);
  });

  it('selectScheduleNotificationsError reads error', () => {
    const store = makeStore();
    expect(selectScheduleNotificationsError(store.getState())).toBe(null);
    store.dispatch(setScheduleNotificationsError('oops'));
    expect(selectScheduleNotificationsError(store.getState())).toBe('oops');
  });

  it('selectScheduleNotificationSubscriptions reads subscriptions', () => {
    const store = makeStore();
    store.dispatch(syncScheduleNotificationsWithSavedData([shiftPublishedRow]));
    expect(selectScheduleNotificationSubscriptions(store.getState())).toEqual([
      shiftPublishedRow,
    ]);
  });

  it('selectScheduleNotificationDraftSubscriptions reads draftSubscriptions', () => {
    const store = makeStore();
    store.dispatch(syncScheduleNotificationsWithSavedData([shiftPublishedRow]));
    store.dispatch(
      toggleDraftScheduleChannel({
        notificationType: ShiftPublished,
        medium: PushNotification,
      }),
    );
    const draft = selectScheduleNotificationDraftSubscriptions(
      store.getState(),
    );
    expect(draft[0].distributionMethods).toContain(PushNotification);
  });
});
