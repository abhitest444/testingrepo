import approvalsReducer, {
  setSubmitTimePanelOpen,
  setSubmitThroughDate,
  setSubmitTimePanelData,
  toggleWeekExpanded,
  setLoading,
  setSubmitting,
  setError,
  resetSubmitTimePanel,
  resetApprovalsState,
} from 'src/js/widgets/qbtOrchestrator/features/approvals/store/approvalsSlice';
import type {
  ApprovalsState,
  WeekTimeGroup,
} from 'src/js/widgets/qbtOrchestrator/features/approvals/types/Approvals.types';

const buildWeek = (
  id: string,
  overrides: Partial<WeekTimeGroup> = {},
): WeekTimeGroup => ({
  id,
  weekStart: '2025-09-08',
  weekEnd: '2025-09-14',
  totalMinutes: 0,
  isSubmitted: false,
  isCurrentWeek: false,
  days: [],
  ...overrides,
});

describe('approvalsSlice', () => {
  const initialState: ApprovalsState = {
    submitTimePanel: {
      isOpen: false,
      submitThroughDate: null,
      periodStartDate: null,
      weekGroups: [],
      expandedWeekIds: [],
      isLoading: false,
      isSubmitting: false,
      error: null,
    },
  };

  it('initializes correctly and handles unknown actions', () => {
    expect(approvalsReducer(undefined, { type: 'unknown' })).toEqual(
      initialState,
    );
  });

  it.each([
    [
      'setSubmitThroughDate',
      setSubmitThroughDate,
      '2025-09-15',
      'submitThroughDate',
    ],
    ['setLoading', setLoading, true, 'isLoading'],
    ['setSubmitting', setSubmitting, true, 'isSubmitting'],
  ])('%s sets value', (_, action, value, key) => {
    expect(
      (
        approvalsReducer(initialState, (action as any)(value))
          .submitTimePanel as any
      )[key],
    ).toEqual(value);
  });

  it('setSubmitTimePanelOpen opens and resets on close', () => {
    expect(
      approvalsReducer(initialState, setSubmitTimePanelOpen(true))
        .submitTimePanel.isOpen,
    ).toBe(true);
    const populated: ApprovalsState = {
      submitTimePanel: {
        ...initialState.submitTimePanel,
        isOpen: true,
        weekGroups: [buildWeek('w-1')],
        error: 'err',
      },
    };
    expect(
      approvalsReducer(populated, setSubmitTimePanelOpen(false))
        .submitTimePanel,
    ).toEqual(initialState.submitTimePanel);
  });

  it('setSubmitTimePanelData stores groups, derives expanded current week, clears loading/error', () => {
    const loading: ApprovalsState = {
      submitTimePanel: {
        ...initialState.submitTimePanel,
        isLoading: true,
        error: 'err',
      },
    };
    const weekGroups = [
      buildWeek('current', { isCurrentWeek: true }),
      buildWeek('previous', { isSubmitted: true }),
    ];
    const afterData = approvalsReducer(
      loading,
      setSubmitTimePanelData({
        weekGroups,
        periodStartDate: '2025-08-15',
      }),
    ).submitTimePanel;
    expect(afterData.weekGroups).toEqual(weekGroups);
    expect(afterData.periodStartDate).toBe('2025-08-15');
    expect(afterData.expandedWeekIds).toEqual(['current']);
    expect(afterData.isLoading).toBe(false);
    expect(afterData.error).toBeNull();
  });

  it('setError clears loading/submitting flags', () => {
    const loading: ApprovalsState = {
      submitTimePanel: {
        ...initialState.submitTimePanel,
        isLoading: true,
        isSubmitting: true,
      },
    };
    const afterError = approvalsReducer(
      loading,
      setError('Failed'),
    ).submitTimePanel;
    expect(afterError.error).toBe('Failed');
    expect(afterError.isLoading).toBe(false);
    expect(afterError.isSubmitting).toBe(false);
  });

  it('toggleWeekExpanded adds/removes week ids', () => {
    const state = approvalsReducer(initialState, toggleWeekExpanded('w-1'));
    expect(state.submitTimePanel.expandedWeekIds).toEqual(['w-1']);
    expect(
      approvalsReducer(state, toggleWeekExpanded('w-1')).submitTimePanel
        .expandedWeekIds,
    ).toEqual([]);
  });

  it('reset actions restore initial state', () => {
    const modified: ApprovalsState = {
      submitTimePanel: {
        ...initialState.submitTimePanel,
        isOpen: true,
        error: 'err',
        weekGroups: [buildWeek('w-1')],
      },
    };
    expect(approvalsReducer(modified, resetSubmitTimePanel())).toEqual(
      initialState,
    );
    expect(approvalsReducer(modified, resetApprovalsState())).toEqual(
      initialState,
    );
  });
});
