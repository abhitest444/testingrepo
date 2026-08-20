// @ts-nocheck
/**
 * Tests for settingsContextSlice Redux slice
 *
 * Tests for the Redux slice managing settings context (timeForType and id)
 */

import settingsContextReducer, {
  setSettingsFor,
  clearSettingsFor,
  selectSettingsFor,
  SettingsContextState,
} from 'src/js/widgets/userSettings/store/slices/settingsContextSlice';
import { TimeTracking_TimeForType } from 'src/__generated__/timeTracking/graphql';

describe('settingsContextSlice', () => {
  const mockInitialState: SettingsContextState = {
    settingsFor: null,
  };

  const mockSettingsFor = {
    timeForType: TimeTracking_TimeForType.Employee,
    id: '123-456-789',
  };

  describe('reducer', () => {
    it('should return the initial state', () => {
      expect(settingsContextReducer(undefined, { type: 'unknown' })).toEqual(
        mockInitialState,
      );
    });

    it('should have null settingsFor in initial state', () => {
      const state = settingsContextReducer(undefined, { type: 'unknown' });
      expect(state.settingsFor).toBeNull();
    });
  });

  describe('setSettingsFor', () => {
    it('should set settingsFor with EMPLOYEE type', () => {
      const newState = settingsContextReducer(
        mockInitialState,
        setSettingsFor(mockSettingsFor),
      );

      expect(newState.settingsFor).toEqual(mockSettingsFor);
      expect(newState.settingsFor.timeForType).toBe(
        TimeTracking_TimeForType.Employee,
      );
      expect(newState.settingsFor.id).toBe('123-456-789');
    });

    it('should set settingsFor with TEAM type', () => {
      const teamSettingsFor = {
        timeForType: TimeTracking_TimeForType.Team,
        id: 'team-123',
      };

      const newState = settingsContextReducer(
        mockInitialState,
        setSettingsFor(teamSettingsFor),
      );

      expect(newState.settingsFor).toEqual(teamSettingsFor);
      expect(newState.settingsFor.timeForType).toBe(
        TimeTracking_TimeForType.Team,
      );
    });

    it('should set settingsFor with COMPANY type', () => {
      const companySettingsFor = {
        timeForType: TimeTracking_TimeForType.Company,
        id: 'company-123',
      };

      const newState = settingsContextReducer(
        mockInitialState,
        setSettingsFor(companySettingsFor),
      );

      expect(newState.settingsFor).toEqual(companySettingsFor);
      expect(newState.settingsFor.timeForType).toBe(
        TimeTracking_TimeForType.Company,
      );
    });

    it('should override existing settingsFor', () => {
      const stateWithSettings: SettingsContextState = {
        settingsFor: mockSettingsFor,
      };

      const newSettingsFor = {
        timeForType: TimeTracking_TimeForType.Team,
        id: 'new-id-456',
      };

      const newState = settingsContextReducer(
        stateWithSettings,
        setSettingsFor(newSettingsFor),
      );

      expect(newState.settingsFor).toEqual(newSettingsFor);
      expect(newState.settingsFor.id).toBe('new-id-456');
    });

    it('should handle UUID format IDs', () => {
      const uuidSettingsFor = {
        timeForType: TimeTracking_TimeForType.Employee,
        id: '550e8400-e29b-41d4-a716-446655440000',
      };

      const newState = settingsContextReducer(
        mockInitialState,
        setSettingsFor(uuidSettingsFor),
      );

      expect(newState.settingsFor.id).toBe(
        '550e8400-e29b-41d4-a716-446655440000',
      );
    });

    it('should handle numeric string IDs', () => {
      const numericSettingsFor = {
        timeForType: TimeTracking_TimeForType.Employee,
        id: '12345',
      };

      const newState = settingsContextReducer(
        mockInitialState,
        setSettingsFor(numericSettingsFor),
      );

      expect(newState.settingsFor.id).toBe('12345');
    });
  });

  describe('clearSettingsFor', () => {
    it('should clear settingsFor to null', () => {
      const stateWithSettings: SettingsContextState = {
        settingsFor: mockSettingsFor,
      };

      const newState = settingsContextReducer(
        stateWithSettings,
        clearSettingsFor(),
      );

      expect(newState.settingsFor).toBeNull();
    });

    it('should handle clearing already null settingsFor', () => {
      const newState = settingsContextReducer(
        mockInitialState,
        clearSettingsFor(),
      );

      expect(newState.settingsFor).toBeNull();
    });

    it('should clear settingsFor with EMPLOYEE type', () => {
      const stateWithEmployee: SettingsContextState = {
        settingsFor: {
          timeForType: TimeTracking_TimeForType.Employee,
          id: 'employee-123',
        },
      };

      const newState = settingsContextReducer(
        stateWithEmployee,
        clearSettingsFor(),
      );

      expect(newState.settingsFor).toBeNull();
    });

    it('should clear settingsFor with TEAM type', () => {
      const stateWithTeam: SettingsContextState = {
        settingsFor: {
          timeForType: TimeTracking_TimeForType.Team,
          id: 'team-123',
        },
      };

      const newState = settingsContextReducer(
        stateWithTeam,
        clearSettingsFor(),
      );

      expect(newState.settingsFor).toBeNull();
    });

    it('should clear settingsFor with COMPANY type', () => {
      const stateWithCompany: SettingsContextState = {
        settingsFor: {
          timeForType: TimeTracking_TimeForType.Company,
          id: 'company-123',
        },
      };

      const newState = settingsContextReducer(
        stateWithCompany,
        clearSettingsFor(),
      );

      expect(newState.settingsFor).toBeNull();
    });
  });

  describe('selectSettingsFor selector', () => {
    it('should select settingsFor from state', () => {
      const mockRootState = {
        settingsContext: {
          settingsFor: mockSettingsFor,
        },
      };

      expect(selectSettingsFor(mockRootState)).toEqual(mockSettingsFor);
    });

    it('should return null when settingsFor is not set', () => {
      const mockRootState = {
        settingsContext: {
          settingsFor: null,
        },
      };

      expect(selectSettingsFor(mockRootState)).toBeNull();
    });

    it('should select EMPLOYEE type settingsFor', () => {
      const mockRootState = {
        settingsContext: {
          settingsFor: {
            timeForType: TimeTracking_TimeForType.Employee,
            id: 'emp-123',
          },
        },
      };

      const result = selectSettingsFor(mockRootState);
      expect(result.timeForType).toBe(TimeTracking_TimeForType.Employee);
      expect(result.id).toBe('emp-123');
    });

    it('should select TEAM type settingsFor', () => {
      const mockRootState = {
        settingsContext: {
          settingsFor: {
            timeForType: TimeTracking_TimeForType.Team,
            id: 'team-456',
          },
        },
      };

      const result = selectSettingsFor(mockRootState);
      expect(result.timeForType).toBe(TimeTracking_TimeForType.Team);
      expect(result.id).toBe('team-456');
    });

    it('should select COMPANY type settingsFor', () => {
      const mockRootState = {
        settingsContext: {
          settingsFor: {
            timeForType: TimeTracking_TimeForType.Company,
            id: 'company-789',
          },
        },
      };

      const result = selectSettingsFor(mockRootState);
      expect(result.timeForType).toBe(TimeTracking_TimeForType.Company);
      expect(result.id).toBe('company-789');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete workflow: set -> clear', () => {
      let state = mockInitialState;

      // Set settingsFor
      state = settingsContextReducer(state, setSettingsFor(mockSettingsFor));
      expect(state.settingsFor).toEqual(mockSettingsFor);

      // Clear settingsFor
      state = settingsContextReducer(state, clearSettingsFor());
      expect(state.settingsFor).toBeNull();
    });

    it('should handle multiple set operations', () => {
      let state = mockInitialState;

      // Set first settings
      const firstSettings = {
        timeForType: TimeTracking_TimeForType.Employee,
        id: 'employee-1',
      };
      state = settingsContextReducer(state, setSettingsFor(firstSettings));
      expect(state.settingsFor).toEqual(firstSettings);

      // Set second settings (should override)
      const secondSettings = {
        timeForType: TimeTracking_TimeForType.Team,
        id: 'team-2',
      };
      state = settingsContextReducer(state, setSettingsFor(secondSettings));
      expect(state.settingsFor).toEqual(secondSettings);

      // Set third settings (should override again)
      const thirdSettings = {
        timeForType: TimeTracking_TimeForType.Company,
        id: 'company-3',
      };
      state = settingsContextReducer(state, setSettingsFor(thirdSettings));
      expect(state.settingsFor).toEqual(thirdSettings);
    });

    it('should handle set -> clear -> set workflow', () => {
      let state = mockInitialState;

      // Set initial settings
      state = settingsContextReducer(state, setSettingsFor(mockSettingsFor));
      expect(state.settingsFor).toEqual(mockSettingsFor);

      // Clear
      state = settingsContextReducer(state, clearSettingsFor());
      expect(state.settingsFor).toBeNull();

      // Set new settings
      const newSettings = {
        timeForType: TimeTracking_TimeForType.Team,
        id: 'team-new',
      };
      state = settingsContextReducer(state, setSettingsFor(newSettings));
      expect(state.settingsFor).toEqual(newSettings);
    });

    it('should work with selector after set operation', () => {
      const state = settingsContextReducer(
        mockInitialState,
        setSettingsFor(mockSettingsFor),
      );

      const mockRootState = {
        settingsContext: state,
      };

      expect(selectSettingsFor(mockRootState)).toEqual(mockSettingsFor);
    });

    it('should work with selector after clear operation', () => {
      let state = settingsContextReducer(
        mockInitialState,
        setSettingsFor(mockSettingsFor),
      );
      state = settingsContextReducer(state, clearSettingsFor());

      const mockRootState = {
        settingsContext: state,
      };

      expect(selectSettingsFor(mockRootState)).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string ID', () => {
      const emptyIdSettings = {
        timeForType: TimeTracking_TimeForType.Employee,
        id: '',
      };

      const newState = settingsContextReducer(
        mockInitialState,
        setSettingsFor(emptyIdSettings),
      );

      expect(newState.settingsFor.id).toBe('');
    });

    it('should handle very long ID', () => {
      const longIdSettings = {
        timeForType: TimeTracking_TimeForType.Employee,
        id: 'a'.repeat(1000),
      };

      const newState = settingsContextReducer(
        mockInitialState,
        setSettingsFor(longIdSettings),
      );

      expect(newState.settingsFor.id).toBe('a'.repeat(1000));
    });

    it('should maintain immutability when setting new value', () => {
      const originalState = mockInitialState;
      const newState = settingsContextReducer(
        originalState,
        setSettingsFor(mockSettingsFor),
      );

      expect(originalState.settingsFor).toBeNull();
      expect(newState.settingsFor).toEqual(mockSettingsFor);
      expect(originalState).not.toBe(newState);
    });

    it('should maintain immutability when clearing', () => {
      const originalState: SettingsContextState = {
        settingsFor: mockSettingsFor,
      };
      const newState = settingsContextReducer(
        originalState,
        clearSettingsFor(),
      );

      expect(originalState.settingsFor).toEqual(mockSettingsFor);
      expect(newState.settingsFor).toBeNull();
      expect(originalState).not.toBe(newState);
    });

    it('should handle rapid state changes', () => {
      let state = mockInitialState;

      // Rapid sequence of operations
      state = settingsContextReducer(
        state,
        setSettingsFor({
          timeForType: TimeTracking_TimeForType.Employee,
          id: '1',
        }),
      );
      state = settingsContextReducer(state, clearSettingsFor());
      state = settingsContextReducer(
        state,
        setSettingsFor({
          timeForType: TimeTracking_TimeForType.Team,
          id: '2',
        }),
      );
      state = settingsContextReducer(
        state,
        setSettingsFor({
          timeForType: TimeTracking_TimeForType.Company,
          id: '3',
        }),
      );

      expect(state.settingsFor.timeForType).toBe(
        TimeTracking_TimeForType.Company,
      );
      expect(state.settingsFor.id).toBe('3');
    });
  });

  describe('Type Safety', () => {
    it('should maintain proper type for EMPLOYEE', () => {
      const newState = settingsContextReducer(
        mockInitialState,
        setSettingsFor({
          timeForType: TimeTracking_TimeForType.Employee,
          id: 'emp-123',
        }),
      );

      expect(newState.settingsFor.timeForType).toBe(
        TimeTracking_TimeForType.Employee,
      );
    });

    it('should maintain proper type for TEAM', () => {
      const newState = settingsContextReducer(
        mockInitialState,
        setSettingsFor({
          timeForType: TimeTracking_TimeForType.Team,
          id: 'team-123',
        }),
      );

      expect(newState.settingsFor.timeForType).toBe(
        TimeTracking_TimeForType.Team,
      );
    });

    it('should maintain proper type for COMPANY', () => {
      const newState = settingsContextReducer(
        mockInitialState,
        setSettingsFor({
          timeForType: TimeTracking_TimeForType.Company,
          id: 'company-123',
        }),
      );

      expect(newState.settingsFor.timeForType).toBe(
        TimeTracking_TimeForType.Company,
      );
    });
  });
});
