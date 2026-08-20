// @ts-nocheck
/**
 * Tests for breaksSlice Redux slice
 *
 * Tests for the Redux slice managing breaks settings state
 */

import breaksReducer, {
  BreaksCardMode,
  BreaksState,
  setBreaksMode,
  setBreaks,
  setBreaksLoading,
  setBreaksError,
  updateDraftBreaks,
  saveBreaks,
  cancelBreaksEdit,
  resetBreaksState,
  selectBreaksMode,
  selectBreaks,
  selectDraftBreaks,
  selectBreaksLoading,
  selectBreaksError,
  selectPaidBreaks,
  selectUnpaidBreaks,
  selectDraftPaidBreaks,
  selectDraftUnpaidBreaks,
} from 'src/js/widgets/userSettings/store/slices/breaksSlice';
import { Payroll_Break } from 'src/__generated__/oigql/graphql';

describe('breaksSlice', () => {
  // Mock break rules for testing
  const mockPaidBreak = {
    id: '1',
    breakName: 'Paid Lunch',
    breakType: Payroll_Break.Paid,
    breakDuration: 30,
    durationUnit: 'MINUTES',
    isActive: true,
    isDefaultPolicy: false,
    allowAuto: true,
    allowManual: true,
    noSetDuration: false,
  };

  const mockUnpaidBreak = {
    id: '2',
    breakName: 'Unpaid Break',
    breakType: Payroll_Break.Unpaid,
    breakDuration: 15,
    durationUnit: 'MINUTES',
    isActive: true,
    isDefaultPolicy: false,
    allowAuto: false,
    allowManual: true,
    noSetDuration: false,
  };

  const mockBreaks = [mockPaidBreak, mockUnpaidBreak];

  const mockInitialState: BreaksState = {
    mode: BreaksCardMode.VIEW,
    breaks: [],
    draftBreaks: [],
    loading: false,
    error: null,
  };

  const mockStateWithBreaks: BreaksState = {
    mode: BreaksCardMode.VIEW,
    breaks: mockBreaks,
    draftBreaks: mockBreaks,
    loading: false,
    error: null,
  };

  describe('reducer', () => {
    it('should return the initial state', () => {
      expect(breaksReducer(undefined, { type: 'unknown' })).toEqual(
        mockInitialState,
      );
    });
  });

  describe('setBreaksMode', () => {
    it('should set mode to EDIT and copy breaks to draft', () => {
      const newState = breaksReducer(
        mockStateWithBreaks,
        setBreaksMode(BreaksCardMode.EDIT),
      );

      expect(newState.mode).toBe(BreaksCardMode.EDIT);
      expect(newState.draftBreaks).toEqual(mockStateWithBreaks.breaks);
    });

    it('should set mode to VIEW without modifying draft', () => {
      const editModeState = {
        ...mockStateWithBreaks,
        mode: BreaksCardMode.EDIT,
      };

      const newState = breaksReducer(
        editModeState,
        setBreaksMode(BreaksCardMode.VIEW),
      );

      expect(newState.mode).toBe(BreaksCardMode.VIEW);
    });

    it('should preserve breaks when switching to edit mode', () => {
      const newState = breaksReducer(
        mockStateWithBreaks,
        setBreaksMode(BreaksCardMode.EDIT),
      );

      expect(newState.breaks).toEqual(mockStateWithBreaks.breaks);
    });
  });

  describe('setBreaks', () => {
    it('should set breaks from API response', () => {
      const newState = breaksReducer(mockInitialState, setBreaks(mockBreaks));

      expect(newState.breaks).toEqual(mockBreaks);
      expect(newState.draftBreaks).toEqual(mockBreaks);
      expect(newState.loading).toBe(false);
      expect(newState.error).toBeNull();
    });

    it('should clear loading and error when setting breaks', () => {
      const loadingState = {
        ...mockInitialState,
        loading: true,
        error: 'Some error',
      };

      const newState = breaksReducer(loadingState, setBreaks(mockBreaks));

      expect(newState.loading).toBe(false);
      expect(newState.error).toBeNull();
    });

    it('should handle empty breaks array', () => {
      const newState = breaksReducer(mockInitialState, setBreaks([]));

      expect(newState.breaks).toEqual([]);
      expect(newState.draftBreaks).toEqual([]);
    });
  });

  describe('setBreaksLoading', () => {
    it('should set loading to true', () => {
      const newState = breaksReducer(mockInitialState, setBreaksLoading(true));

      expect(newState.loading).toBe(true);
    });

    it('should set loading to false', () => {
      const loadingState = { ...mockInitialState, loading: true };

      const newState = breaksReducer(loadingState, setBreaksLoading(false));

      expect(newState.loading).toBe(false);
    });
  });

  describe('setBreaksError', () => {
    it('should set error message', () => {
      const errorMessage = 'Failed to fetch breaks';
      const newState = breaksReducer(
        mockInitialState,
        setBreaksError(errorMessage),
      );

      expect(newState.error).toBe(errorMessage);
      expect(newState.loading).toBe(false);
    });

    it('should clear loading when setting error', () => {
      const loadingState = { ...mockInitialState, loading: true };

      const newState = breaksReducer(
        loadingState,
        setBreaksError('Error occurred'),
      );

      expect(newState.loading).toBe(false);
    });

    it('should clear error when null is passed', () => {
      const errorState = { ...mockInitialState, error: 'Some error' };

      const newState = breaksReducer(errorState, setBreaksError(null));

      expect(newState.error).toBeNull();
    });
  });

  describe('updateDraftBreaks', () => {
    it('should update draft breaks', () => {
      const updatedBreaks = [{ ...mockPaidBreak, breakName: 'Updated Break' }];

      const newState = breaksReducer(
        mockStateWithBreaks,
        updateDraftBreaks(updatedBreaks),
      );

      expect(newState.draftBreaks).toEqual(updatedBreaks);
      expect(newState.breaks).toEqual(mockStateWithBreaks.breaks); // Original unchanged
    });
  });

  describe('saveBreaks', () => {
    it('should save draft breaks to breaks', () => {
      const modifiedDraft = [{ ...mockPaidBreak, breakName: 'Modified Break' }];
      const stateWithModifiedDraft = {
        ...mockStateWithBreaks,
        mode: BreaksCardMode.EDIT,
        draftBreaks: modifiedDraft,
      };

      const newState = breaksReducer(stateWithModifiedDraft, saveBreaks());

      expect(newState.breaks).toEqual(modifiedDraft);
      expect(newState.mode).toBe(BreaksCardMode.VIEW);
    });

    it('should switch to VIEW mode after saving', () => {
      const editModeState = {
        ...mockStateWithBreaks,
        mode: BreaksCardMode.EDIT,
      };

      const newState = breaksReducer(editModeState, saveBreaks());

      expect(newState.mode).toBe(BreaksCardMode.VIEW);
    });
  });

  describe('cancelBreaksEdit', () => {
    it('should discard draft changes and revert to breaks', () => {
      const modifiedDraft = [{ ...mockPaidBreak, breakName: 'Unsaved Change' }];
      const stateWithModifiedDraft = {
        ...mockStateWithBreaks,
        mode: BreaksCardMode.EDIT,
        draftBreaks: modifiedDraft,
      };

      const newState = breaksReducer(
        stateWithModifiedDraft,
        cancelBreaksEdit(),
      );

      expect(newState.draftBreaks).toEqual(mockStateWithBreaks.breaks);
      expect(newState.mode).toBe(BreaksCardMode.VIEW);
    });

    it('should switch to VIEW mode', () => {
      const editModeState = {
        ...mockStateWithBreaks,
        mode: BreaksCardMode.EDIT,
      };

      const newState = breaksReducer(editModeState, cancelBreaksEdit());

      expect(newState.mode).toBe(BreaksCardMode.VIEW);
    });
  });

  describe('resetBreaksState', () => {
    it('should reset state to initial values', () => {
      const modifiedState = {
        mode: BreaksCardMode.EDIT,
        breaks: mockBreaks,
        draftBreaks: mockBreaks,
        loading: true,
        error: 'Some error',
      };

      const newState = breaksReducer(modifiedState, resetBreaksState());

      expect(newState).toEqual(mockInitialState);
    });
  });

  describe('selectors', () => {
    const mockRootState = {
      breaks: mockStateWithBreaks,
    };

    it('selectBreaksMode should return mode', () => {
      expect(selectBreaksMode(mockRootState)).toBe(BreaksCardMode.VIEW);
    });

    it('selectBreaks should return breaks', () => {
      expect(selectBreaks(mockRootState)).toEqual(mockBreaks);
    });

    it('selectDraftBreaks should return draftBreaks', () => {
      expect(selectDraftBreaks(mockRootState)).toEqual(mockBreaks);
    });

    it('selectBreaksLoading should return loading', () => {
      expect(selectBreaksLoading(mockRootState)).toBe(false);
    });

    it('selectBreaksError should return error', () => {
      expect(selectBreaksError(mockRootState)).toBeNull();
    });
  });

  describe('derived selectors', () => {
    const mockRootState = {
      breaks: mockStateWithBreaks,
    };

    it('selectPaidBreaks should return only paid breaks', () => {
      const paidBreaks = selectPaidBreaks(mockRootState);

      expect(paidBreaks).toHaveLength(1);
      expect(paidBreaks[0].breakType).toBe(Payroll_Break.Paid);
    });

    it('selectUnpaidBreaks should return only unpaid breaks', () => {
      const unpaidBreaks = selectUnpaidBreaks(mockRootState);

      expect(unpaidBreaks).toHaveLength(1);
      expect(unpaidBreaks[0].breakType).toBe(Payroll_Break.Unpaid);
    });

    it('selectDraftPaidBreaks should return only draft paid breaks', () => {
      const draftPaidBreaks = selectDraftPaidBreaks(mockRootState);

      expect(draftPaidBreaks).toHaveLength(1);
      expect(draftPaidBreaks[0].breakType).toBe(Payroll_Break.Paid);
    });

    it('selectDraftUnpaidBreaks should return only draft unpaid breaks', () => {
      const draftUnpaidBreaks = selectDraftUnpaidBreaks(mockRootState);

      expect(draftUnpaidBreaks).toHaveLength(1);
      expect(draftUnpaidBreaks[0].breakType).toBe(Payroll_Break.Unpaid);
    });

    it('should return empty array when no breaks of type exist', () => {
      const stateWithOnlyPaid = {
        breaks: {
          ...mockStateWithBreaks,
          breaks: [mockPaidBreak],
          draftBreaks: [mockPaidBreak],
        },
      };

      expect(selectUnpaidBreaks(stateWithOnlyPaid)).toEqual([]);
      expect(selectDraftUnpaidBreaks(stateWithOnlyPaid)).toEqual([]);
    });
  });

  describe('Integration Tests', () => {
    it('should handle full edit workflow: edit -> update -> save', () => {
      let state = mockStateWithBreaks;

      // Switch to EDIT
      state = breaksReducer(state, setBreaksMode(BreaksCardMode.EDIT));
      expect(state.mode).toBe(BreaksCardMode.EDIT);

      // Make changes
      const updatedBreaks = [{ ...mockPaidBreak, breakName: 'Updated' }];
      state = breaksReducer(state, updateDraftBreaks(updatedBreaks));
      expect(state.draftBreaks[0].breakName).toBe('Updated');
      expect(state.breaks[0].breakName).toBe('Paid Lunch'); // Original unchanged

      // Save changes
      state = breaksReducer(state, saveBreaks());
      expect(state.mode).toBe(BreaksCardMode.VIEW);
      expect(state.breaks[0].breakName).toBe('Updated');
    });

    it('should handle full cancel workflow: edit -> update -> cancel', () => {
      let state = mockStateWithBreaks;

      // Switch to EDIT
      state = breaksReducer(state, setBreaksMode(BreaksCardMode.EDIT));

      // Make changes
      const updatedBreaks = [{ ...mockPaidBreak, breakName: 'Unsaved' }];
      state = breaksReducer(state, updateDraftBreaks(updatedBreaks));

      // Cancel changes
      state = breaksReducer(state, cancelBreaksEdit());

      expect(state.mode).toBe(BreaksCardMode.VIEW);
      expect(state.draftBreaks).toEqual(mockStateWithBreaks.breaks);
      expect(state.breaks[0].breakName).toBe('Paid Lunch');
    });

    it('should handle fetch workflow: loading -> success', () => {
      let state = mockInitialState;

      // Set loading
      state = breaksReducer(state, setBreaksLoading(true));
      expect(state.loading).toBe(true);

      // Set breaks (success)
      state = breaksReducer(state, setBreaks(mockBreaks));
      expect(state.loading).toBe(false);
      expect(state.breaks).toEqual(mockBreaks);
      expect(state.error).toBeNull();
    });

    it('should handle fetch workflow: loading -> error', () => {
      let state = mockInitialState;

      // Set loading
      state = breaksReducer(state, setBreaksLoading(true));
      expect(state.loading).toBe(true);

      // Set error (failure)
      state = breaksReducer(state, setBreaksError('Failed to fetch'));
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Failed to fetch');
    });
  });
});
