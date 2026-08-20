// @ts-nocheck
/**
 * Tests for notificationsSlice Redux slice
 *
 * Tests for the Redux slice managing notification settings state
 */

import notificationsReducer, {
  setMode,
  updateDraft,
  saveSettings,
  cancelEdit,
  resetState,
  initializeDefaults,
  selectNotificationsMode,
  selectNotificationsSettings,
  selectNotificationsDraftSettings,
  selectNotificationsState,
  NotificationsState,
} from 'src/js/widgets/userSettings/store/slices/notificationsSlice';
import { NotificationsCardMode } from 'src/js/widgets/userSettings/components/cards/NotificationsCard/types/NotificationsCard.types';

describe('notificationsSlice', () => {
  // Mock initial state
  const mockInitialState: NotificationsState = {
    mode: NotificationsCardMode.VIEW,
    settings: {
      // Temporarily disabled as this is yet to be implemented in the API
      // notificationSetting: 'custom',
      clockInTime: '8:00 AM',
      clockOutTime: '5:00 PM',
      daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
      // adjustNotification: 'Admins and managers',
      // notesNotification: 'Admins and managers',
      clockInEmail: true,
      clockInMobile: true,
      clockOutEmail: true,
      clockOutMobile: false,
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
    },
    draftSettings: {
      // Temporarily disabled as this is yet to be implemented in the API
      // notificationSetting: 'custom',
      clockInTime: '8:00 AM',
      clockOutTime: '5:00 PM',
      daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
      // adjustNotification: 'Admins and managers',
      // notesNotification: 'Admins and managers',
      clockInEmail: true,
      clockInMobile: true,
      clockOutEmail: true,
      clockOutMobile: false,
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
    },
  };

  describe('reducer', () => {
    it('should return the initial state', () => {
      expect(notificationsReducer(undefined, { type: 'unknown' })).toEqual(
        expect.objectContaining({
          mode: NotificationsCardMode.VIEW,
        }),
      );
    });
  });

  describe('setMode', () => {
    it('should set mode to EDIT and copy settings to draft', () => {
      const newState = notificationsReducer(
        mockInitialState,
        setMode(NotificationsCardMode.EDIT),
      );

      expect(newState.mode).toBe(NotificationsCardMode.EDIT);
      expect(newState.draftSettings).toEqual(mockInitialState.settings);
    });

    it('should set mode to VIEW without modifying draft', () => {
      const editModeState = {
        ...mockInitialState,
        mode: NotificationsCardMode.EDIT,
      };

      const newState = notificationsReducer(
        editModeState,
        setMode(NotificationsCardMode.VIEW),
      );

      expect(newState.mode).toBe(NotificationsCardMode.VIEW);
    });

    it('should preserve settings when switching to edit mode', () => {
      const newState = notificationsReducer(
        mockInitialState,
        setMode(NotificationsCardMode.EDIT),
      );

      expect(newState.settings).toEqual(mockInitialState.settings);
    });
  });

  describe('updateDraft', () => {
    it('should update draft settings with partial data', () => {
      const newState = notificationsReducer(
        mockInitialState,
        updateDraft({ clockInTime: '9:00 AM' }),
      );

      expect(newState.draftSettings.clockInTime).toBe('9:00 AM');
      expect(newState.draftSettings.clockOutTime).toBe('5:00 PM'); // Other values unchanged
    });

    it('should update multiple draft settings fields', () => {
      const newState = notificationsReducer(
        mockInitialState,
        updateDraft({
          clockInTime: '9:00 AM',
          clockOutTime: '6:00 PM',
          clockInEmail: false,
        }),
      );

      expect(newState.draftSettings.clockInTime).toBe('9:00 AM');
      expect(newState.draftSettings.clockOutTime).toBe('6:00 PM');
      expect(newState.draftSettings.clockInEmail).toBe(false);
    });

    it('should not modify actual settings when updating draft', () => {
      const newState = notificationsReducer(
        mockInitialState,
        updateDraft({ clockInTime: '9:00 AM' }),
      );

      expect(newState.settings.clockInTime).toBe('8:00 AM');
      expect(newState.draftSettings.clockInTime).toBe('9:00 AM');
    });

    it('should update daysOfWeek array', () => {
      const newState = notificationsReducer(
        mockInitialState,
        updateDraft({ daysOfWeek: ['MONDAY', 'WEDNESDAY', 'FRIDAY'] }),
      );

      expect(newState.draftSettings.daysOfWeek).toEqual([
        'MONDAY',
        'WEDNESDAY',
        'FRIDAY',
      ]);
    });
  });

  describe('saveSettings', () => {
    it('should save draft settings to settings', () => {
      // First update draft
      const stateWithDraft = notificationsReducer(
        mockInitialState,
        updateDraft({ clockInTime: '9:00 AM' }),
      );

      // Then save
      const newState = notificationsReducer(
        stateWithDraft,
        saveSettings(undefined),
      );

      expect(newState.settings.clockInTime).toBe('9:00 AM');
      expect(newState.mode).toBe(NotificationsCardMode.VIEW);
    });

    it('should update versions from API response', () => {
      const apiResponse = {
        timeTrackingEffectiveUserSettings: {
          clockInSetting: {
            reminderTime: {
              meta: {
                version: '2',
              },
            },
            notificationMedium: {
              meta: {
                version: '3',
              },
            },
          },
          clockOutSetting: {
            reminderTime: {
              meta: {
                version: '4',
              },
            },
            notificationMedium: {
              meta: {
                version: '5',
              },
            },
          },
          notificationEnabledForDays: {
            meta: {
              version: '6',
            },
          },
        },
      };

      const stateWithDraft = notificationsReducer(
        mockInitialState,
        updateDraft({ clockInTime: '9:00 AM' }),
      );

      const newState = notificationsReducer(
        stateWithDraft,
        saveSettings(apiResponse),
      );

      expect(newState.settings.versions.clockInReminderTime).toBe('2');
      expect(newState.settings.versions.clockInNotificationMedium).toBe('3');
      expect(newState.settings.versions.clockOutReminderTime).toBe('4');
      expect(newState.settings.versions.clockOutNotificationMedium).toBe('5');
      expect(newState.settings.versions.notificationEnabledForDays).toBe('6');
    });

    it('should switch to VIEW mode after saving', () => {
      const editModeState = {
        ...mockInitialState,
        mode: NotificationsCardMode.EDIT,
      };

      const newState = notificationsReducer(
        editModeState,
        saveSettings(undefined),
      );

      expect(newState.mode).toBe(NotificationsCardMode.VIEW);
    });

    it('should handle save without API response', () => {
      const stateWithDraft = notificationsReducer(
        mockInitialState,
        updateDraft({ clockInEmail: false }),
      );

      const newState = notificationsReducer(
        stateWithDraft,
        saveSettings(undefined),
      );

      expect(newState.settings.clockInEmail).toBe(false);
      expect(newState.settings.versions.clockInReminderTime).toBe('1'); // Unchanged
    });
  });

  describe('cancelEdit', () => {
    it('should discard draft changes and revert to settings', () => {
      // First update draft
      const stateWithDraft = notificationsReducer(
        mockInitialState,
        updateDraft({ clockInTime: '9:00 AM', clockInEmail: false }),
      );

      // Then cancel
      const newState = notificationsReducer(stateWithDraft, cancelEdit());

      expect(newState.draftSettings).toEqual(mockInitialState.settings);
      expect(newState.draftSettings.clockInTime).toBe('8:00 AM');
      expect(newState.draftSettings.clockInEmail).toBe(true);
    });

    it('should switch to VIEW mode', () => {
      const editModeState = {
        ...mockInitialState,
        mode: NotificationsCardMode.EDIT,
      };

      const newState = notificationsReducer(editModeState, cancelEdit());

      expect(newState.mode).toBe(NotificationsCardMode.VIEW);
    });

    it('should not modify actual settings', () => {
      const stateWithDraft = notificationsReducer(
        mockInitialState,
        updateDraft({ clockInTime: '9:00 AM' }),
      );

      const newState = notificationsReducer(stateWithDraft, cancelEdit());

      expect(newState.settings).toEqual(mockInitialState.settings);
    });
  });

  describe('resetState', () => {
    it('should reset state with API data', () => {
      const apiData = {
        timeTrackingEffectiveUserSettings: {
          clockInSetting: {
            reminderTime: {
              value: {
                value: '09:00:00',
              },
            },
          },
        },
      };

      const modifiedState = {
        ...mockInitialState,
        mode: NotificationsCardMode.EDIT,
        settings: {
          ...mockInitialState.settings,
          clockInTime: '10:00 AM',
        },
      };

      const newState = notificationsReducer(modifiedState, resetState(apiData));

      expect(newState.mode).toBe(NotificationsCardMode.VIEW);
    });

    it('should reset mode to VIEW', () => {
      const editModeState = {
        ...mockInitialState,
        mode: NotificationsCardMode.EDIT,
      };

      const newState = notificationsReducer(editModeState, resetState({}));

      expect(newState.mode).toBe(NotificationsCardMode.VIEW);
    });

    it('should sync settings and draftSettings', () => {
      const newState = notificationsReducer(mockInitialState, resetState({}));

      expect(newState.settings).toEqual(newState.draftSettings);
    });
  });

  describe('initializeDefaults', () => {
    it('should reset to default settings', () => {
      const modifiedState = {
        ...mockInitialState,
        mode: NotificationsCardMode.EDIT,
        settings: {
          ...mockInitialState.settings,
          clockInTime: '10:00 AM',
          clockInEmail: false,
        },
      };

      const newState = notificationsReducer(
        modifiedState,
        initializeDefaults(),
      );

      expect(newState.mode).toBe(NotificationsCardMode.VIEW);
      expect(newState.settings.clockInTime).toBe('8:00 AM');
      expect(newState.settings.clockInEmail).toBe(false);
    });

    it('should sync settings and draftSettings to defaults', () => {
      const newState = notificationsReducer(
        mockInitialState,
        initializeDefaults(),
      );

      expect(newState.settings).toEqual(newState.draftSettings);
    });
  });

  describe('selectors', () => {
    const mockRootState = {
      notifications: mockInitialState,
    };

    it('selectNotificationsMode should return mode', () => {
      expect(selectNotificationsMode(mockRootState)).toBe(
        NotificationsCardMode.VIEW,
      );
    });

    it('selectNotificationsSettings should return settings', () => {
      expect(selectNotificationsSettings(mockRootState)).toEqual(
        mockInitialState.settings,
      );
    });

    it('selectNotificationsDraftSettings should return draftSettings', () => {
      expect(selectNotificationsDraftSettings(mockRootState)).toEqual(
        mockInitialState.draftSettings,
      );
    });

    it('selectNotificationsState should return entire state', () => {
      expect(selectNotificationsState(mockRootState)).toEqual(mockInitialState);
    });
  });

  describe('Integration Tests', () => {
    it('should handle full edit workflow: edit -> update -> save', () => {
      // Start in VIEW mode
      let state = mockInitialState;

      // Switch to EDIT
      state = notificationsReducer(state, setMode(NotificationsCardMode.EDIT));
      expect(state.mode).toBe(NotificationsCardMode.EDIT);

      // Make changes
      state = notificationsReducer(
        state,
        updateDraft({ clockInTime: '9:00 AM' }),
      );
      expect(state.draftSettings.clockInTime).toBe('9:00 AM');
      expect(state.settings.clockInTime).toBe('8:00 AM');

      // Save changes
      state = notificationsReducer(state, saveSettings(undefined));
      expect(state.mode).toBe(NotificationsCardMode.VIEW);
      expect(state.settings.clockInTime).toBe('9:00 AM');
    });

    it('should handle full cancel workflow: edit -> update -> cancel', () => {
      let state = mockInitialState;

      // Switch to EDIT
      state = notificationsReducer(state, setMode(NotificationsCardMode.EDIT));

      // Make changes
      state = notificationsReducer(
        state,
        updateDraft({ clockInTime: '9:00 AM', clockInEmail: false }),
      );

      // Cancel changes
      state = notificationsReducer(state, cancelEdit());

      expect(state.mode).toBe(NotificationsCardMode.VIEW);
      expect(state.draftSettings).toEqual(mockInitialState.settings);
      expect(state.settings.clockInTime).toBe('8:00 AM');
      expect(state.settings.clockInEmail).toBe(true);
    });

    it('should handle multiple draft updates before saving', () => {
      let state = mockInitialState;

      state = notificationsReducer(
        state,
        updateDraft({ clockInTime: '9:00 AM' }),
      );
      state = notificationsReducer(
        state,
        updateDraft({ clockOutTime: '6:00 PM' }),
      );
      state = notificationsReducer(state, updateDraft({ clockInEmail: false }));

      expect(state.draftSettings.clockInTime).toBe('9:00 AM');
      expect(state.draftSettings.clockOutTime).toBe('6:00 PM');
      expect(state.draftSettings.clockInEmail).toBe(false);

      // Original settings unchanged
      expect(state.settings.clockInTime).toBe('8:00 AM');
      expect(state.settings.clockOutTime).toBe('5:00 PM');
      expect(state.settings.clockInEmail).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty daysOfWeek array', () => {
      const newState = notificationsReducer(
        mockInitialState,
        updateDraft({ daysOfWeek: [] }),
      );

      expect(newState.draftSettings.daysOfWeek).toEqual([]);
    });

    it('should handle null API response in saveSettings', () => {
      const stateWithDraft = notificationsReducer(
        mockInitialState,
        updateDraft({ clockInTime: '9:00 AM' }),
      );

      const newState = notificationsReducer(stateWithDraft, saveSettings(null));

      expect(newState.settings.clockInTime).toBe('9:00 AM');
    });

    it('should handle partial API response in saveSettings', () => {
      const partialApiResponse = {
        timeTrackingEffectiveUserSettings: {
          clockInSetting: {
            reminderTime: {
              meta: {
                version: '2',
              },
            },
          },
        },
      };

      const stateWithDraft = notificationsReducer(
        mockInitialState,
        updateDraft({ clockInTime: '9:00 AM' }),
      );

      const newState = notificationsReducer(
        stateWithDraft,
        saveSettings(partialApiResponse),
      );

      expect(newState.settings.versions.clockInReminderTime).toBe('2');
      expect(newState.settings.versions.clockInNotificationMedium).toBe('1'); // Unchanged
    });

    it('should handle resetState with undefined data', () => {
      const newState = notificationsReducer(
        mockInitialState,
        resetState(undefined),
      );

      expect(newState.mode).toBe(NotificationsCardMode.VIEW);
      expect(newState.settings).toEqual(newState.draftSettings);
    });
  });
});
