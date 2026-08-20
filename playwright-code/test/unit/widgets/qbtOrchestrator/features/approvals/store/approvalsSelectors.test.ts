import { configureStore } from '@reduxjs/toolkit';
import approvalsReducer from 'src/js/widgets/qbtOrchestrator/features/approvals/store/approvalsSlice';
import {
  selectSubmitTimePanelOpen,
  selectSubmitThroughDate,
  selectPeriodStartDate,
  selectWeekGroups,
  selectExpandedWeekIds,
  selectIsLoading,
  selectIsSubmitting,
  selectError,
  selectTotalUnapprovedMinutes,
  selectHasUnapprovedTime,
} from 'src/js/widgets/qbtOrchestrator/features/approvals/store/approvalsSelectors';
import type { WeekTimeGroup } from 'src/js/widgets/qbtOrchestrator/features/approvals/types/Approvals.types';

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

describe('approvalsSelectors', () => {
  const weeks: WeekTimeGroup[] = [
    buildWeek('current', {
      isCurrentWeek: true,
      totalMinutes: 1441,
      days: [
        {
          id: 'd1',
          date: '2025-09-15',
          minutes: 480,
          timesheetCount: 1,
          status: 'pending',
        },
        {
          id: 'd2',
          date: '2025-09-14',
          minutes: 481,
          timesheetCount: 1,
          status: 'pending',
        },
        {
          id: 'd3',
          date: '2025-09-13',
          minutes: 0,
          timesheetCount: 0,
          status: 'pending',
        },
        {
          id: 'd4',
          date: '2025-09-12',
          minutes: 480,
          timesheetCount: 1,
          status: 'pending',
        },
        {
          id: 'd5',
          date: '2025-09-11',
          minutes: 480,
          timesheetCount: 1,
          status: 'submitted',
        },
      ],
    }),
    buildWeek('previous', {
      isSubmitted: true,
      totalMinutes: 2160,
      days: [
        {
          id: 'p1',
          date: '2025-09-08',
          minutes: 270,
          timesheetCount: 1,
          status: 'submitted',
        },
      ],
    }),
  ];

  const getState = (overrides: any = {}) =>
    configureStore({
      reducer: { approvals: approvalsReducer },
      preloadedState: {
        approvals: {
          submitTimePanel: {
            isOpen: false,
            submitThroughDate: null,
            periodStartDate: null,
            weekGroups: [],
            expandedWeekIds: [],
            isLoading: false,
            isSubmitting: false,
            error: null,
            ...overrides,
          },
        },
      },
    }).getState() as any;
  const emptyState = { approvals: undefined } as any;

  it.each([
    [selectSubmitTimePanelOpen, 'isOpen', false, true],
    [selectSubmitThroughDate, 'submitThroughDate', null, '2025-09-15'],
    [selectPeriodStartDate, 'periodStartDate', null, '2025-08-15'],
    [selectIsLoading, 'isLoading', false, true],
    [selectIsSubmitting, 'isSubmitting', false, true],
    [selectError, 'error', null, 'Failed'],
  ])(
    '%p returns default, set value, and fallback',
    (selector, key, defaultVal, setVal) => {
      expect(selector(getState())).toEqual(defaultVal);
      expect(selector(getState({ [key]: setVal }))).toEqual(setVal);
      expect(selector(emptyState)).toEqual(defaultVal);
    },
  );

  it('selectWeekGroups / selectExpandedWeekIds return defaults, values, and fallbacks', () => {
    expect(selectWeekGroups(getState())).toEqual([]);
    expect(selectWeekGroups(getState({ weekGroups: weeks }))).toEqual(weeks);
    expect(selectWeekGroups(emptyState)).toEqual([]);

    expect(selectExpandedWeekIds(getState({ expandedWeekIds: ['x'] }))).toEqual(
      ['x'],
    );
    expect(selectExpandedWeekIds(emptyState)).toEqual([]);
  });

  it('selectTotalUnapprovedMinutes sums only pending day minutes', () => {
    // 480 + 481 + 0 + 480 = 1441 from current week pending; previous all submitted
    expect(selectTotalUnapprovedMinutes(getState({ weekGroups: weeks }))).toBe(
      1441,
    );
    expect(selectTotalUnapprovedMinutes(getState())).toBe(0);
  });

  it('selectHasUnapprovedTime reflects total pending minutes', () => {
    expect(selectHasUnapprovedTime(getState({ weekGroups: weeks }))).toBe(true);
    expect(selectHasUnapprovedTime(getState())).toBe(false);
  });
});
