// @ts-nocheck
/**
 * Tests for userSettings overtimeSlice Redux slice
 *
 * Tests for the Redux slice managing overtime user-level override state
 * in the User Settings widget (OvertimeCard VIEW/EDIT modes).
 */

import overtimeReducer, {
  OvertimeCardState,
  setOvertimeMode,
  setOvertimePolicy,
  setOvertimeLoading,
  setOvertimeError,
  cancelOvertimeEdit,
  resetOvertimeState,
  setDraftRuleType,
  setDraftRules,
  initializeEditDraft,
  selectOvertimeMode,
  selectOvertimePolicy,
  selectOvertimeLoading,
  selectOvertimeError,
  selectDraftRuleType,
  selectDraftRules,
} from 'src/js/widgets/userSettings/store/slices/overtimeSlice';
import { OvertimeCardMode } from 'src/js/widgets/userSettings/components/cards/OvertimeCard/types/OvertimeCard.types';

const mockBasicRule = {
  name: 'Weekly Overtime',
  type: 'weekly' as const,
  frequency: 'WEEKLY' as const,
  multiplier: 1.5,
  conditions: [{ field: 'threshold' as const, value: '40' }],
  enabled: true,
};

const mockDailyRule = {
  name: 'Daily Overtime',
  type: 'daily' as const,
  frequency: 'DAILY' as const,
  multiplier: 1.5,
  conditions: [{ field: 'threshold' as const, value: '8' }],
  enabled: true,
};

const mockConsecutiveRule = {
  name: 'Consecutive Daily',
  type: 'consecutive_daily' as const,
  frequency: 'DAILY' as const,
  multiplier: 1.5,
  conditions: [
    { field: 'days_in_a_row' as const, value: '7' },
    { field: 'threshold' as const, value: '0' },
  ],
  enabled: true,
};

const mockPolicy = {
  id: 'basic',
  name: 'Basic Overtime',
  description: '',
  isDefault: true,
  assignments: { values: [] },
  rules: { values: [mockBasicRule] },
};

const mockUserLevelPolicy = {
  id: 'basic_policy_abc123',
  name: 'Basic Overtime - John Doe',
  description: '',
  isDefault: false,
  assignments: { values: [] },
  rules: { values: [mockBasicRule, mockDailyRule] },
};

const initialState: OvertimeCardState = {
  mode: OvertimeCardMode.VIEW,
  policy: null,
  loading: false,
  error: null,
  overtimeRuleType: '',
  draftRules: [],
};

describe('userSettings/overtimeSlice', () => {
  describe('reducer initial state', () => {
    it('returns correct initial state', () => {
      expect(overtimeReducer(undefined, { type: 'unknown' })).toEqual(
        initialState,
      );
    });
  });

  describe('setOvertimeMode', () => {
    it('sets mode to EDIT', () => {
      const state = overtimeReducer(
        initialState,
        setOvertimeMode(OvertimeCardMode.EDIT),
      );
      expect(state.mode).toBe(OvertimeCardMode.EDIT);
    });

    it('sets mode back to VIEW', () => {
      const editState = { ...initialState, mode: OvertimeCardMode.EDIT };
      const state = overtimeReducer(
        editState,
        setOvertimeMode(OvertimeCardMode.VIEW),
      );
      expect(state.mode).toBe(OvertimeCardMode.VIEW);
    });
  });

  describe('setOvertimePolicy', () => {
    it('sets policy and clears loading and error', () => {
      const loadingErrorState = {
        ...initialState,
        loading: true,
        error: 'prev error',
      };
      const state = overtimeReducer(
        loadingErrorState,
        setOvertimePolicy(mockPolicy),
      );
      expect(state.policy).toEqual(mockPolicy);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('sets policy to null (no policy assigned)', () => {
      const stateWithPolicy = { ...initialState, policy: mockPolicy };
      const state = overtimeReducer(stateWithPolicy, setOvertimePolicy(null));
      expect(state.policy).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('setOvertimeLoading', () => {
    it('sets loading to true', () => {
      const state = overtimeReducer(initialState, setOvertimeLoading(true));
      expect(state.loading).toBe(true);
    });

    it('sets loading to false', () => {
      const loadingState = { ...initialState, loading: true };
      const state = overtimeReducer(loadingState, setOvertimeLoading(false));
      expect(state.loading).toBe(false);
    });
  });

  describe('setOvertimeError', () => {
    it('sets error message and clears loading', () => {
      const loadingState = { ...initialState, loading: true };
      const state = overtimeReducer(
        loadingState,
        setOvertimeError('Fetch failed'),
      );
      expect(state.error).toBe('Fetch failed');
      expect(state.loading).toBe(false);
    });

    it('clears error when null is passed', () => {
      const errorState = { ...initialState, error: 'Some error' };
      const state = overtimeReducer(errorState, setOvertimeError(null));
      expect(state.error).toBeNull();
    });
  });

  describe('cancelOvertimeEdit', () => {
    it('resets mode to VIEW and clears draft state', () => {
      const editState: OvertimeCardState = {
        mode: OvertimeCardMode.EDIT,
        policy: mockPolicy,
        loading: false,
        error: null,
        overtimeRuleType: 'basic',
        draftRules: [mockBasicRule],
      };
      const state = overtimeReducer(editState, cancelOvertimeEdit());
      expect(state.mode).toBe(OvertimeCardMode.VIEW);
      expect(state.overtimeRuleType).toBe('');
      expect(state.draftRules).toEqual([]);
    });

    it('does not modify policy when cancelling', () => {
      const editState: OvertimeCardState = {
        ...initialState,
        mode: OvertimeCardMode.EDIT,
        policy: mockPolicy,
        overtimeRuleType: 'basic',
        draftRules: [mockBasicRule],
      };
      const state = overtimeReducer(editState, cancelOvertimeEdit());
      expect(state.policy).toEqual(mockPolicy);
    });
  });

  describe('resetOvertimeState', () => {
    it('resets entire state to initial values', () => {
      const modifiedState: OvertimeCardState = {
        mode: OvertimeCardMode.EDIT,
        policy: mockPolicy,
        loading: true,
        error: 'Some error',
        overtimeRuleType: 'california',
        draftRules: [mockConsecutiveRule],
      };
      const state = overtimeReducer(modifiedState, resetOvertimeState());
      expect(state).toEqual(initialState);
    });
  });

  describe('setDraftRuleType', () => {
    it('sets draft rule type to basic', () => {
      const state = overtimeReducer(initialState, setDraftRuleType('basic'));
      expect(state.overtimeRuleType).toBe('basic');
    });

    it('sets draft rule type to california', () => {
      const state = overtimeReducer(
        initialState,
        setDraftRuleType('california'),
      );
      expect(state.overtimeRuleType).toBe('california');
    });

    it('sets draft rule type to empty string', () => {
      const stateWithType = {
        ...initialState,
        overtimeRuleType: 'basic' as const,
      };
      const state = overtimeReducer(stateWithType, setDraftRuleType(''));
      expect(state.overtimeRuleType).toBe('');
    });
  });

  describe('setDraftRules', () => {
    it('sets draft rules array', () => {
      const state = overtimeReducer(
        initialState,
        setDraftRules([mockBasicRule]),
      );
      expect(state.draftRules).toEqual([mockBasicRule]);
    });

    it('sets empty draft rules array', () => {
      const stateWithRules = { ...initialState, draftRules: [mockBasicRule] };
      const state = overtimeReducer(stateWithRules, setDraftRules([]));
      expect(state.draftRules).toEqual([]);
    });

    it('replaces existing draft rules', () => {
      const stateWithRules = {
        ...initialState,
        draftRules: [mockBasicRule],
      };
      const state = overtimeReducer(
        stateWithRules,
        setDraftRules([mockDailyRule]),
      );
      expect(state.draftRules).toEqual([mockDailyRule]);
    });
  });

  describe('initializeEditDraft', () => {
    it('detects basic rule type when no consecutive rules', () => {
      const policy = {
        ...mockPolicy,
        rules: { values: [mockBasicRule, mockDailyRule] },
      };
      const state = overtimeReducer(initialState, initializeEditDraft(policy));
      expect(state.overtimeRuleType).toBe('basic');
    });

    it('detects california rule type when consecutive_daily rule present', () => {
      const policy = {
        ...mockPolicy,
        rules: { values: [mockConsecutiveRule] },
      };
      const state = overtimeReducer(initialState, initializeEditDraft(policy));
      expect(state.overtimeRuleType).toBe('california');
    });

    it('detects california rule type when consecutive_double_daily rule present', () => {
      const consecutiveDoubleRule = {
        ...mockConsecutiveRule,
        type: 'consecutive_double_daily' as const,
        conditions: [
          { field: 'days_in_a_row' as const, value: '7' },
          { field: 'threshold' as const, value: '12' }, // California default for consecutive_double_daily
        ],
      };
      const policy = {
        ...mockPolicy,
        rules: { values: [consecutiveDoubleRule] },
      };
      const state = overtimeReducer(initialState, initializeEditDraft(policy));
      expect(state.overtimeRuleType).toBe('california');
    });

    it('filters out disabled rules when initializing draft', () => {
      const disabledRule = { ...mockBasicRule, enabled: false };
      const policy = {
        ...mockPolicy,
        rules: { values: [mockDailyRule, disabledRule] },
      };
      const state = overtimeReducer(initialState, initializeEditDraft(policy));
      expect(state.draftRules).toHaveLength(1);
      expect(state.draftRules[0].type).toBe('daily');
    });

    it('sets empty draft when policy is null', () => {
      const state = overtimeReducer(initialState, initializeEditDraft(null));
      expect(state.overtimeRuleType).toBe('');
      expect(state.draftRules).toEqual([]);
    });

    it('handles policy with empty rules array', () => {
      const policy = { ...mockPolicy, rules: { values: [] } };
      const state = overtimeReducer(initialState, initializeEditDraft(policy));
      expect(state.draftRules).toEqual([]);
      expect(state.overtimeRuleType).toBe('basic');
    });
  });

  describe('selectors', () => {
    const mockRootState = {
      overtime: {
        mode: OvertimeCardMode.EDIT,
        policy: mockUserLevelPolicy,
        loading: true,
        error: 'fetch error',
        overtimeRuleType: 'california',
        draftRules: [mockConsecutiveRule],
      },
    };

    it('selectOvertimeMode returns mode', () => {
      expect(selectOvertimeMode(mockRootState)).toBe(OvertimeCardMode.EDIT);
    });

    it('selectOvertimePolicy returns policy', () => {
      expect(selectOvertimePolicy(mockRootState)).toEqual(mockUserLevelPolicy);
    });

    it('selectOvertimeLoading returns loading', () => {
      expect(selectOvertimeLoading(mockRootState)).toBe(true);
    });

    it('selectOvertimeError returns error', () => {
      expect(selectOvertimeError(mockRootState)).toBe('fetch error');
    });

    it('selectDraftRuleType returns overtimeRuleType', () => {
      expect(selectDraftRuleType(mockRootState)).toBe('california');
    });

    it('selectDraftRules returns draftRules', () => {
      expect(selectDraftRules(mockRootState)).toEqual([mockConsecutiveRule]);
    });

    it('selectors return initial values from initial state', () => {
      const emptyRoot = { overtime: initialState };
      expect(selectOvertimeMode(emptyRoot)).toBe(OvertimeCardMode.VIEW);
      expect(selectOvertimePolicy(emptyRoot)).toBeNull();
      expect(selectOvertimeLoading(emptyRoot)).toBe(false);
      expect(selectOvertimeError(emptyRoot)).toBeNull();
      expect(selectDraftRuleType(emptyRoot)).toBe('');
      expect(selectDraftRules(emptyRoot)).toEqual([]);
    });
  });

  describe('integration: edit workflow', () => {
    it('handles full view → edit → cancel workflow', () => {
      let state = { ...initialState, policy: mockUserLevelPolicy };

      // User clicks edit — initialize draft from policy
      state = overtimeReducer(state, initializeEditDraft(mockUserLevelPolicy));
      expect(state.overtimeRuleType).toBe('basic');
      expect(state.draftRules).toHaveLength(2);

      // Switch mode to EDIT
      state = overtimeReducer(state, setOvertimeMode(OvertimeCardMode.EDIT));
      expect(state.mode).toBe(OvertimeCardMode.EDIT);

      // User changes rule type
      state = overtimeReducer(state, setDraftRuleType('california'));
      state = overtimeReducer(state, setDraftRules([mockConsecutiveRule]));

      // User cancels
      state = overtimeReducer(state, cancelOvertimeEdit());
      expect(state.mode).toBe(OvertimeCardMode.VIEW);
      expect(state.overtimeRuleType).toBe('');
      expect(state.draftRules).toEqual([]);
      expect(state.policy).toEqual(mockUserLevelPolicy); // policy unchanged
    });

    it('handles fetch lifecycle: loading → success', () => {
      let state = { ...initialState };

      state = overtimeReducer(state, setOvertimeLoading(true));
      expect(state.loading).toBe(true);

      state = overtimeReducer(state, setOvertimePolicy(mockPolicy));
      expect(state.policy).toEqual(mockPolicy);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('handles fetch lifecycle: loading → error', () => {
      let state = { ...initialState };

      state = overtimeReducer(state, setOvertimeLoading(true));
      expect(state.loading).toBe(true);

      state = overtimeReducer(state, setOvertimeError('Network error'));
      expect(state.error).toBe('Network error');
      expect(state.loading).toBe(false);
    });

    it('handles user switch: resetOvertimeState clears everything', () => {
      let state: OvertimeCardState = {
        mode: OvertimeCardMode.EDIT,
        policy: mockUserLevelPolicy,
        loading: false,
        error: null,
        overtimeRuleType: 'basic',
        draftRules: [mockBasicRule],
      };

      state = overtimeReducer(state, resetOvertimeState());
      expect(state).toEqual(initialState);
    });
  });
});
