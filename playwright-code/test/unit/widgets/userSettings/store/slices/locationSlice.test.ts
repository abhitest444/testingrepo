// @ts-nocheck
/**
 * Tests for locationSlice Redux slice
 *
 * Tests for the Redux slice managing location settings state
 */

import locationReducer, {
  LocationState,
  LocationSettings,
  setLocationMode,
  updateLocationDraft,
  saveLocationSettings,
  cancelLocationEdit,
  resetLocationState,
  initializeLocationDefaults,
  setLocationLoading,
  setLocationError,
  selectLocationMode,
  selectLocationSettings,
  selectLocationDraftSettings,
  selectLocationState,
  selectLocationLoading,
  selectLocationError,
} from 'src/js/widgets/userSettings/store/slices/locationSlice';
import { LocationCardMode } from 'src/js/widgets/userSettings/components/cards/LocationCard/types/LocationCard.types';
import {
  TimeTracking_LocationTrackingType,
  TimeTracking_UserLocationTrackingType,
  TimeTrackingUnifiedUserSettingsQuery,
} from 'src/__generated__/timeTracking/graphql';

describe('locationSlice', () => {
  // Mock default settings
  const defaultSettings: LocationSettings = {
    value: TimeTracking_UserLocationTrackingType.UseCompanySetting,
    effectiveValue: TimeTracking_LocationTrackingType.Optional,
    version: undefined,
  };

  // Mock initial state
  const mockInitialState: LocationState = {
    mode: LocationCardMode.VIEW,
    settings: defaultSettings,
    draftSettings: defaultSettings,
    loading: false,
    error: null,
  };

  // Mock settings with custom values
  const mockCustomSettings: LocationSettings = {
    value: TimeTracking_UserLocationTrackingType.Required,
    effectiveValue: TimeTracking_LocationTrackingType.Required,
    version: '1',
  };

  const mockStateWithCustomSettings: LocationState = {
    mode: LocationCardMode.VIEW,
    settings: mockCustomSettings,
    draftSettings: mockCustomSettings,
    loading: false,
    error: null,
  };

  // Mock API response
  const mockApiResponse: TimeTrackingUnifiedUserSettingsQuery = {
    timeTrackingUnifiedUserSettings: {
      locationTracking: {
        value: TimeTracking_UserLocationTrackingType.Optional,
        effectiveValue: TimeTracking_LocationTrackingType.Optional,
        meta: {
          version: '2',
        },
      },
    },
  };

  describe('reducer', () => {
    it('should return the initial state', () => {
      expect(locationReducer(undefined, { type: 'unknown' })).toEqual(
        mockInitialState,
      );
    });
  });

  describe('setLocationMode', () => {
    it('should set mode to EDIT and copy settings to draft', () => {
      const newState = locationReducer(
        mockStateWithCustomSettings,
        setLocationMode(LocationCardMode.EDIT),
      );

      expect(newState.mode).toBe(LocationCardMode.EDIT);
      expect(newState.draftSettings).toEqual(
        mockStateWithCustomSettings.settings,
      );
    });

    it('should set mode to VIEW without modifying draft', () => {
      const editModeState = {
        ...mockStateWithCustomSettings,
        mode: LocationCardMode.EDIT,
      };

      const newState = locationReducer(
        editModeState,
        setLocationMode(LocationCardMode.VIEW),
      );

      expect(newState.mode).toBe(LocationCardMode.VIEW);
    });

    it('should preserve settings when switching to edit mode', () => {
      const newState = locationReducer(
        mockStateWithCustomSettings,
        setLocationMode(LocationCardMode.EDIT),
      );

      expect(newState.settings).toEqual(mockStateWithCustomSettings.settings);
    });
  });

  describe('updateLocationDraft', () => {
    it('should update draft settings with partial data', () => {
      const newState = locationReducer(
        mockInitialState,
        updateLocationDraft({
          value: TimeTracking_UserLocationTrackingType.Required,
        }),
      );

      expect(newState.draftSettings.value).toBe(
        TimeTracking_UserLocationTrackingType.Required,
      );
      expect(newState.draftSettings.effectiveValue).toBe(
        TimeTracking_LocationTrackingType.Optional,
      ); // Other values unchanged
    });

    it('should update multiple draft settings fields', () => {
      const newState = locationReducer(
        mockInitialState,
        updateLocationDraft({
          value: TimeTracking_UserLocationTrackingType.Off,
          effectiveValue: TimeTracking_LocationTrackingType.Off,
          version: '3',
        }),
      );

      expect(newState.draftSettings.value).toBe(
        TimeTracking_UserLocationTrackingType.Off,
      );
      expect(newState.draftSettings.effectiveValue).toBe(
        TimeTracking_LocationTrackingType.Off,
      );
      expect(newState.draftSettings.version).toBe('3');
    });

    it('should not modify actual settings when updating draft', () => {
      const newState = locationReducer(
        mockInitialState,
        updateLocationDraft({
          value: TimeTracking_UserLocationTrackingType.Required,
        }),
      );

      expect(newState.settings.value).toBe(
        TimeTracking_UserLocationTrackingType.UseCompanySetting,
      );
      expect(newState.draftSettings.value).toBe(
        TimeTracking_UserLocationTrackingType.Required,
      );
    });
  });

  describe('saveLocationSettings', () => {
    it('should save settings from API response', () => {
      const stateWithDraft = {
        ...mockInitialState,
        mode: LocationCardMode.EDIT,
        draftSettings: {
          value: TimeTracking_UserLocationTrackingType.Optional,
          effectiveValue: TimeTracking_LocationTrackingType.Optional,
          version: undefined,
        },
      };

      const newState = locationReducer(
        stateWithDraft,
        saveLocationSettings(mockApiResponse),
      );

      expect(newState.settings.value).toBe(
        TimeTracking_UserLocationTrackingType.Optional,
      );
      expect(newState.settings.effectiveValue).toBe(
        TimeTracking_LocationTrackingType.Optional,
      );
      expect(newState.settings.version).toBe('2');
      expect(newState.mode).toBe(LocationCardMode.VIEW);
    });

    it('should update version from API response', () => {
      const stateWithDraft = {
        ...mockInitialState,
        mode: LocationCardMode.EDIT,
      };

      const newState = locationReducer(
        stateWithDraft,
        saveLocationSettings(mockApiResponse),
      );

      expect(newState.settings.version).toBe('2');
      expect(newState.draftSettings.version).toBe('2');
    });

    it('should switch to VIEW mode after saving', () => {
      const editModeState = {
        ...mockStateWithCustomSettings,
        mode: LocationCardMode.EDIT,
      };

      const newState = locationReducer(
        editModeState,
        saveLocationSettings(mockApiResponse),
      );

      expect(newState.mode).toBe(LocationCardMode.VIEW);
    });

    it('should fallback to draft settings when no API response provided', () => {
      const draftWithChanges = {
        value: TimeTracking_UserLocationTrackingType.Required,
        effectiveValue: TimeTracking_LocationTrackingType.Required,
        version: '5',
      };

      const stateWithDraft = {
        ...mockInitialState,
        mode: LocationCardMode.EDIT,
        draftSettings: draftWithChanges,
      };

      const newState = locationReducer(
        stateWithDraft,
        saveLocationSettings(undefined),
      );

      expect(newState.settings).toEqual(draftWithChanges);
      expect(newState.mode).toBe(LocationCardMode.VIEW);
    });

    it('should sync settings and draftSettings after save', () => {
      const stateWithDraft = {
        ...mockInitialState,
        mode: LocationCardMode.EDIT,
      };

      const newState = locationReducer(
        stateWithDraft,
        saveLocationSettings(mockApiResponse),
      );

      expect(newState.settings.value).toBe(newState.draftSettings.value);
      expect(newState.settings.effectiveValue).toBe(
        newState.draftSettings.effectiveValue,
      );
      expect(newState.settings.version).toBe(newState.draftSettings.version);
    });
  });

  describe('cancelLocationEdit', () => {
    it('should discard draft changes and revert to settings', () => {
      const modifiedDraft = {
        value: TimeTracking_UserLocationTrackingType.Off,
        effectiveValue: TimeTracking_LocationTrackingType.Off,
        version: '99',
      };

      const stateWithModifiedDraft = {
        ...mockStateWithCustomSettings,
        mode: LocationCardMode.EDIT,
        draftSettings: modifiedDraft,
      };

      const newState = locationReducer(
        stateWithModifiedDraft,
        cancelLocationEdit(),
      );

      expect(newState.draftSettings).toEqual(
        mockStateWithCustomSettings.settings,
      );
      expect(newState.mode).toBe(LocationCardMode.VIEW);
    });

    it('should switch to VIEW mode', () => {
      const editModeState = {
        ...mockStateWithCustomSettings,
        mode: LocationCardMode.EDIT,
      };

      const newState = locationReducer(editModeState, cancelLocationEdit());

      expect(newState.mode).toBe(LocationCardMode.VIEW);
    });

    it('should not modify actual settings', () => {
      const stateWithDraft = {
        ...mockStateWithCustomSettings,
        mode: LocationCardMode.EDIT,
        draftSettings: {
          value: TimeTracking_UserLocationTrackingType.Off,
          effectiveValue: TimeTracking_LocationTrackingType.Off,
          version: '99',
        },
      };

      const newState = locationReducer(stateWithDraft, cancelLocationEdit());

      expect(newState.settings).toEqual(mockStateWithCustomSettings.settings);
    });
  });

  describe('resetLocationState', () => {
    it('should reset state with API data', () => {
      const modifiedState = {
        mode: LocationCardMode.EDIT,
        settings: mockCustomSettings,
        draftSettings: {
          value: TimeTracking_UserLocationTrackingType.Off,
          effectiveValue: TimeTracking_LocationTrackingType.Off,
          version: '99',
        },
        loading: true,
        error: 'Some error',
      };

      const newState = locationReducer(
        modifiedState,
        resetLocationState(mockApiResponse),
      );

      expect(newState.mode).toBe(LocationCardMode.VIEW);
      expect(newState.settings.value).toBe(
        TimeTracking_UserLocationTrackingType.Optional,
      );
      expect(newState.settings.effectiveValue).toBe(
        TimeTracking_LocationTrackingType.Optional,
      );
      expect(newState.settings.version).toBe('2');
      expect(newState.loading).toBe(false);
      expect(newState.error).toBeNull();
    });

    it('should reset mode to VIEW', () => {
      const editModeState = {
        ...mockStateWithCustomSettings,
        mode: LocationCardMode.EDIT,
      };

      const newState = locationReducer(
        editModeState,
        resetLocationState(mockApiResponse),
      );

      expect(newState.mode).toBe(LocationCardMode.VIEW);
    });

    it('should sync settings and draftSettings', () => {
      const newState = locationReducer(
        mockStateWithCustomSettings,
        resetLocationState(mockApiResponse),
      );

      expect(newState.settings).toEqual(newState.draftSettings);
    });

    it('should clear loading and error states', () => {
      const stateWithLoadingAndError = {
        ...mockInitialState,
        loading: true,
        error: 'Failed to load',
      };

      const newState = locationReducer(
        stateWithLoadingAndError,
        resetLocationState(mockApiResponse),
      );

      expect(newState.loading).toBe(false);
      expect(newState.error).toBeNull();
    });

    it('should use default settings when API data is undefined', () => {
      const newState = locationReducer(
        mockStateWithCustomSettings,
        resetLocationState(undefined),
      );

      expect(newState.settings.value).toBe(
        TimeTracking_UserLocationTrackingType.UseCompanySetting,
      );
      expect(newState.settings.effectiveValue).toBe(
        TimeTracking_LocationTrackingType.Optional,
      );
      expect(newState.settings.version).toBeUndefined();
    });

    it('should use default settings when locationTracking is missing', () => {
      const emptyApiResponse: TimeTrackingUnifiedUserSettingsQuery = {
        timeTrackingUnifiedUserSettings: null,
      };

      const newState = locationReducer(
        mockStateWithCustomSettings,
        resetLocationState(emptyApiResponse),
      );

      expect(newState.settings.value).toBe(
        TimeTracking_UserLocationTrackingType.UseCompanySetting,
      );
      expect(newState.settings.effectiveValue).toBe(
        TimeTracking_LocationTrackingType.Optional,
      );
    });
  });

  describe('initializeLocationDefaults', () => {
    it('should reset to default settings', () => {
      const modifiedState = {
        mode: LocationCardMode.EDIT,
        settings: mockCustomSettings,
        draftSettings: mockCustomSettings,
        loading: true,
        error: 'Some error',
      };

      const newState = locationReducer(
        modifiedState,
        initializeLocationDefaults(),
      );

      expect(newState.mode).toBe(LocationCardMode.VIEW);
      expect(newState.settings).toEqual(defaultSettings);
      expect(newState.draftSettings).toEqual(defaultSettings);
      expect(newState.loading).toBe(false);
      expect(newState.error).toBeNull();
    });

    it('should sync settings and draftSettings to defaults', () => {
      const newState = locationReducer(
        mockStateWithCustomSettings,
        initializeLocationDefaults(),
      );

      expect(newState.settings).toEqual(newState.draftSettings);
      expect(newState.settings).toEqual(defaultSettings);
    });
  });

  describe('setLocationLoading', () => {
    it('should set loading to true', () => {
      const newState = locationReducer(
        mockInitialState,
        setLocationLoading(true),
      );

      expect(newState.loading).toBe(true);
    });

    it('should set loading to false', () => {
      const loadingState = { ...mockInitialState, loading: true };

      const newState = locationReducer(loadingState, setLocationLoading(false));

      expect(newState.loading).toBe(false);
    });
  });

  describe('setLocationError', () => {
    it('should set error message', () => {
      const errorMessage = 'Failed to fetch location settings';
      const newState = locationReducer(
        mockInitialState,
        setLocationError(errorMessage),
      );

      expect(newState.error).toBe(errorMessage);
      expect(newState.loading).toBe(false);
    });

    it('should clear loading when setting error', () => {
      const loadingState = { ...mockInitialState, loading: true };

      const newState = locationReducer(
        loadingState,
        setLocationError('Error occurred'),
      );

      expect(newState.loading).toBe(false);
    });

    it('should clear error when null is passed', () => {
      const errorState = { ...mockInitialState, error: 'Some error' };

      const newState = locationReducer(errorState, setLocationError(null));

      expect(newState.error).toBeNull();
    });
  });

  describe('selectors', () => {
    const mockRootState = {
      location: mockStateWithCustomSettings,
    };

    it('selectLocationMode should return mode', () => {
      expect(selectLocationMode(mockRootState)).toBe(LocationCardMode.VIEW);
    });

    it('selectLocationSettings should return settings', () => {
      expect(selectLocationSettings(mockRootState)).toEqual(mockCustomSettings);
    });

    it('selectLocationDraftSettings should return draftSettings', () => {
      expect(selectLocationDraftSettings(mockRootState)).toEqual(
        mockCustomSettings,
      );
    });

    it('selectLocationState should return entire state', () => {
      expect(selectLocationState(mockRootState)).toEqual(
        mockStateWithCustomSettings,
      );
    });

    it('selectLocationLoading should return loading', () => {
      expect(selectLocationLoading(mockRootState)).toBe(false);
    });

    it('selectLocationError should return error', () => {
      expect(selectLocationError(mockRootState)).toBeNull();
    });

    it('selectLocationLoading should return true when loading', () => {
      const loadingState = {
        location: { ...mockStateWithCustomSettings, loading: true },
      };

      expect(selectLocationLoading(loadingState)).toBe(true);
    });

    it('selectLocationError should return error message when present', () => {
      const errorState = {
        location: { ...mockStateWithCustomSettings, error: 'Test error' },
      };

      expect(selectLocationError(errorState)).toBe('Test error');
    });
  });

  describe('Integration Tests', () => {
    it('should handle full edit workflow: edit -> update -> save', () => {
      // Start in VIEW mode
      let state = mockInitialState;

      // Switch to EDIT
      state = locationReducer(state, setLocationMode(LocationCardMode.EDIT));
      expect(state.mode).toBe(LocationCardMode.EDIT);

      // Make changes
      state = locationReducer(
        state,
        updateLocationDraft({
          value: TimeTracking_UserLocationTrackingType.Required,
        }),
      );
      expect(state.draftSettings.value).toBe(
        TimeTracking_UserLocationTrackingType.Required,
      );
      expect(state.settings.value).toBe(
        TimeTracking_UserLocationTrackingType.UseCompanySetting,
      );

      // Save changes with API response
      const apiResponse: TimeTrackingUnifiedUserSettingsQuery = {
        timeTrackingUnifiedUserSettings: {
          locationTracking: {
            value: TimeTracking_UserLocationTrackingType.Required,
            effectiveValue: TimeTracking_LocationTrackingType.Required,
            meta: {
              version: '3',
            },
          },
        },
      };
      state = locationReducer(state, saveLocationSettings(apiResponse));
      expect(state.mode).toBe(LocationCardMode.VIEW);
      expect(state.settings.value).toBe(
        TimeTracking_UserLocationTrackingType.Required,
      );
      expect(state.settings.version).toBe('3');
    });

    it('should handle full cancel workflow: edit -> update -> cancel', () => {
      let state = mockStateWithCustomSettings;

      // Switch to EDIT
      state = locationReducer(state, setLocationMode(LocationCardMode.EDIT));

      // Make changes
      state = locationReducer(
        state,
        updateLocationDraft({
          value: TimeTracking_UserLocationTrackingType.Off,
          effectiveValue: TimeTracking_LocationTrackingType.Off,
        }),
      );

      // Cancel changes
      state = locationReducer(state, cancelLocationEdit());

      expect(state.mode).toBe(LocationCardMode.VIEW);
      expect(state.draftSettings).toEqual(mockStateWithCustomSettings.settings);
      expect(state.settings.value).toBe(
        TimeTracking_UserLocationTrackingType.Required,
      );
    });

    it('should handle fetch workflow: loading -> success', () => {
      let state = mockInitialState;

      // Set loading
      state = locationReducer(state, setLocationLoading(true));
      expect(state.loading).toBe(true);

      // Reset state with API data (success)
      state = locationReducer(state, resetLocationState(mockApiResponse));
      expect(state.loading).toBe(false);
      expect(state.settings.value).toBe(
        TimeTracking_UserLocationTrackingType.Optional,
      );
      expect(state.error).toBeNull();
    });

    it('should handle fetch workflow: loading -> error', () => {
      let state = mockInitialState;

      // Set loading
      state = locationReducer(state, setLocationLoading(true));
      expect(state.loading).toBe(true);

      // Set error (failure)
      state = locationReducer(state, setLocationError('Failed to fetch'));
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Failed to fetch');
    });

    it('should handle multiple draft updates before saving', () => {
      let state = mockInitialState;

      state = locationReducer(
        state,
        updateLocationDraft({
          value: TimeTracking_UserLocationTrackingType.Required,
        }),
      );
      state = locationReducer(
        state,
        updateLocationDraft({
          effectiveValue: TimeTracking_LocationTrackingType.Required,
        }),
      );
      state = locationReducer(state, updateLocationDraft({ version: '10' }));

      expect(state.draftSettings.value).toBe(
        TimeTracking_UserLocationTrackingType.Required,
      );
      expect(state.draftSettings.effectiveValue).toBe(
        TimeTracking_LocationTrackingType.Required,
      );
      expect(state.draftSettings.version).toBe('10');

      // Original settings unchanged
      expect(state.settings.value).toBe(
        TimeTracking_UserLocationTrackingType.UseCompanySetting,
      );
      expect(state.settings.effectiveValue).toBe(
        TimeTracking_LocationTrackingType.Optional,
      );
      expect(state.settings.version).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null API response in saveLocationSettings', () => {
      const stateWithDraft: LocationState = {
        ...mockInitialState,
        mode: LocationCardMode.EDIT,
        draftSettings: {
          value: TimeTracking_UserLocationTrackingType.Required,
          effectiveValue: TimeTracking_LocationTrackingType.Required,
          version: '5',
        },
      };

      const newState = locationReducer(
        stateWithDraft,
        saveLocationSettings(null),
      );

      expect(newState.settings.value).toBe(
        TimeTracking_UserLocationTrackingType.Required,
      );
      expect(newState.mode).toBe(LocationCardMode.VIEW);
    });

    it('should handle API response without meta/version', () => {
      const apiResponseWithoutMeta: TimeTrackingUnifiedUserSettingsQuery = {
        timeTrackingUnifiedUserSettings: {
          locationTracking: {
            value: TimeTracking_UserLocationTrackingType.Optional,
            effectiveValue: TimeTracking_LocationTrackingType.Optional,
            meta: null,
          },
        },
      };

      const stateWithDraft = {
        ...mockInitialState,
        mode: LocationCardMode.EDIT,
      };

      const newState = locationReducer(
        stateWithDraft,
        saveLocationSettings(apiResponseWithoutMeta),
      );

      expect(newState.settings.value).toBe(
        TimeTracking_UserLocationTrackingType.Optional,
      );
      expect(newState.settings.version).toBeUndefined();
    });

    it('should handle resetLocationState with undefined data', () => {
      const newState = locationReducer(
        mockStateWithCustomSettings,
        resetLocationState(undefined),
      );

      expect(newState.mode).toBe(LocationCardMode.VIEW);
      expect(newState.settings).toEqual(newState.draftSettings);
      expect(newState.settings.value).toBe(
        TimeTracking_UserLocationTrackingType.UseCompanySetting,
      );
    });

    it('should handle all location tracking types', () => {
      const trackingTypes = [
        TimeTracking_UserLocationTrackingType.UseCompanySetting,
        TimeTracking_UserLocationTrackingType.Required,
        TimeTracking_UserLocationTrackingType.Optional,
        TimeTracking_UserLocationTrackingType.Off,
      ];

      trackingTypes.forEach((type) => {
        const newState = locationReducer(
          mockInitialState,
          updateLocationDraft({ value: type }),
        );
        expect(newState.draftSettings.value).toBe(type);
      });
    });

    it('should handle all effective location tracking types', () => {
      const effectiveTypes = [
        TimeTracking_LocationTrackingType.Required,
        TimeTracking_LocationTrackingType.Optional,
        TimeTracking_LocationTrackingType.Off,
      ];

      effectiveTypes.forEach((type) => {
        const newState = locationReducer(
          mockInitialState,
          updateLocationDraft({ effectiveValue: type }),
        );
        expect(newState.draftSettings.effectiveValue).toBe(type);
      });
    });

    it('should preserve version when updating other draft fields', () => {
      const stateWithVersion = {
        ...mockInitialState,
        draftSettings: {
          ...mockInitialState.draftSettings,
          version: '42',
        },
      };

      const newState = locationReducer(
        stateWithVersion,
        updateLocationDraft({
          value: TimeTracking_UserLocationTrackingType.Required,
        }),
      );

      expect(newState.draftSettings.version).toBe('42');
    });
  });
});
