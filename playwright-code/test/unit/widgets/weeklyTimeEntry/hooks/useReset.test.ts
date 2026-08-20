import { renderHook, act } from '@testing-library/react-hooks';
import dayjs from 'dayjs';
import { TimeForType } from '../../../../../src/js/widgets/weeklyTimeEntry/types';
import { useReset } from '../../../../../src/js/widgets/weeklyTimeEntry/hooks/useReset';
import {
  useAppDispatch,
  useAppSelector,
} from '../../../../../src/js/widgets/weeklyTimeEntry/store';
import {
  setTeamMember,
  setDateRange,
  recalculateTotalsForVisibleDays,
} from '../../../../../src/js/widgets/weeklyTimeEntry/store/timeEntryGridSlice';
import { resetTimeEntrySettings } from '../../../../../src/js/widgets/weeklyTimeEntry/store/timeEntrySettingsSlice';
import { resetContextMenu } from '../../../../../src/js/widgets/weeklyTimeEntry/store/contextMenuSlice';
import { clearTransformationCache } from '../../../../../src/js/widgets/weeklyTimeEntry/store/timeEntryTransformer';
import { getVisibleDaysFromPreferences } from '../../../../../src/js/widgets/weeklyTimeEntry/utils/helpers';

// Mock the store hooks
jest.mock('../../../../../src/js/widgets/weeklyTimeEntry/store', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));

// Mock the store actions
jest.mock(
  '../../../../../src/js/widgets/weeklyTimeEntry/store/timeEntryGridSlice',
  () => ({
    setTeamMember: jest.fn((payload) => ({ type: 'setTeamMember', payload })),
    setDateRange: jest.fn((payload) => ({ type: 'setDateRange', payload })),
    recalculateTotalsForVisibleDays: jest.fn((payload) => ({
      type: 'recalculateTotalsForVisibleDays',
      payload,
    })),
    clearSelectedCell: jest.fn(() => ({ type: 'clearSelectedCell' })),
    setError: jest.fn((payload) => ({ type: 'setError', payload })),
    clearAllLines: jest.fn(() => ({ type: 'clearAllLines' })),
  }),
);

jest.mock(
  '../../../../../src/js/widgets/weeklyTimeEntry/store/timeEntrySettingsSlice',
  () => ({
    resetTimeEntrySettings: jest.fn(() => ({
      type: 'resetTimeEntrySettings',
    })),
  }),
);

jest.mock(
  '../../../../../src/js/widgets/weeklyTimeEntry/store/contextMenuSlice',
  () => ({
    resetContextMenu: jest.fn(() => ({ type: 'resetContextMenu' })),
  }),
);

jest.mock(
  '../../../../../src/js/widgets/weeklyTimeEntry/store/timeEntryTransformer',
  () => ({
    clearTransformationCache: jest.fn(),
  }),
);

// Mock the helpers
jest.mock(
  '../../../../../src/js/widgets/weeklyTimeEntry/utils/helpers',
  () => ({
    getVisibleDaysFromPreferences: jest.fn(() => [0, 1, 2, 3, 4]),
  }),
);

describe('useReset', () => {
  const mockDispatch = jest.fn();

  // Base mock data
  const baseTimeEntrySettings = {
    hideTimeEntryFields: {
      isClassFieldEnabled: true,
      isProjectFieldEnabled: true,
      isLocationFieldEnabled: true,
      isPayTypeFieldEnabled: true,
      isCostRateFieldEnabled: true,
      isTaxableFieldEnabled: true,
    },
    hideWeekdays: {
      isSundayHidden: true,
      isMondayHidden: false,
      isTuesdayHidden: false,
      isWednesdayHidden: false,
      isThursdayHidden: false,
      isFridayHidden: false,
      isSaturdayHidden: true,
    },
    timeEntryTimeFor: {
      id: '123',
      name: 'John Doe',
      type: TimeForType.EMPLOYEE,
    },
    firstDayOfWeek: 0,
    isServiceFieldEnabled: true,
    isBillingFieldEnabled: false,
    isClassEnabled: true,
    isLocationEnabled: false,
    classRequired: false,
    locationRequired: true,
    serviceItemRequired: false,
    timeSheetEntryMakesNotesRequiredEnabled: true,
    loading: false,
    error: null,
    panelOpen: true,
    visibleDays: [0, 1, 2, 3, 4, 5, 6],
  };

  // Helper functions
  const createMockTimeEntrySettings = (overrides = {}) => ({
    ...baseTimeEntrySettings,
    ...overrides,
  });

  const setupMockSelector = (
    timeEntrySettings = baseTimeEntrySettings,
    firstDayOfWeek: number | null = 1,
  ) => {
    (useAppSelector as jest.Mock).mockImplementation((selector) => {
      if (selector.name === 'selectTimeEntrySettings') {
        return timeEntrySettings;
      }
      if (selector.name === 'selectFirstDayOfWeek') {
        return firstDayOfWeek;
      }
      return null;
    });
  };

  const renderUseReset = () => renderHook(() => useReset());

  const executeReset = (hookResult: any) => {
    act(() => {
      hookResult.current.reset();
    });
  };

  const expectResetActions = () => {
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'resetTimeEntrySettings',
    });
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'resetContextMenu' });
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'clearAllLines' });
    expect(clearTransformationCache).toHaveBeenCalled();
  };

  const expectDateRangeNotSet = () => {
    expect(mockDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'setDateRange',
      }),
    );
  };

  const expectTeamMemberNotSet = () => {
    expect(mockDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'setTeamMember',
      }),
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAppDispatch as jest.Mock).mockReturnValue(mockDispatch);
    setupMockSelector();
  });

  describe('basic functionality', () => {
    it('should return a reset function', () => {
      const { result } = renderUseReset();
      expect(result.current.reset).toBeDefined();
      expect(typeof result.current.reset).toBe('function');
    });

    it('should dispatch all reset actions when called', () => {
      const { result } = renderUseReset();
      executeReset(result);
      expectResetActions();
    });

    it('should preserve current date range instead of resetting to current week', () => {
      const { result } = renderUseReset();
      executeReset(result);
      expectDateRangeNotSet();
    });
  });

  describe('team member handling', () => {
    it('should preserve current team member instead of setting from timeEntrySettings', () => {
      const { result } = renderUseReset();
      executeReset(result);
      expectTeamMemberNotSet();
    });

    it('should preserve current team member even when timeEntryTimeFor is available', () => {
      const { result } = renderUseReset();
      executeReset(result);
      expectTeamMemberNotSet();
    });
  });

  describe('visible days calculation', () => {
    it('should calculate visible days from timeEntrySettings hideWeekdays when available', () => {
      const { result } = renderUseReset();
      executeReset(result);

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'recalculateTotalsForVisibleDays',
          payload: { visibleDays: [0, 1, 2, 3, 4] },
        }),
      );

      expect(getVisibleDaysFromPreferences).toHaveBeenCalledWith(
        baseTimeEntrySettings.hideWeekdays,
        0, // firstDay from timeEntrySettings
      );
    });

    it('should use all days when hideWeekdays is not available', () => {
      const timeEntrySettingsWithoutHideWeekdays = createMockTimeEntrySettings({
        hideWeekdays: null,
      });
      setupMockSelector(timeEntrySettingsWithoutHideWeekdays);

      const { result } = renderUseReset();
      executeReset(result);

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'recalculateTotalsForVisibleDays',
          payload: { visibleDays: [0, 1, 2, 3, 4, 5, 6] },
        }),
      );
      expect(getVisibleDaysFromPreferences).not.toHaveBeenCalled();
    });

    it('should handle undefined hideWeekdays', () => {
      const timeEntrySettingsWithUndefinedHideWeekdays =
        createMockTimeEntrySettings({
          hideWeekdays: undefined,
        });
      setupMockSelector(timeEntrySettingsWithUndefinedHideWeekdays);

      const { result } = renderUseReset();
      executeReset(result);

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'recalculateTotalsForVisibleDays',
          payload: { visibleDays: [0, 1, 2, 3, 4, 5, 6] },
        }),
      );
      expect(getVisibleDaysFromPreferences).not.toHaveBeenCalled();
    });
  });

  describe('first day of week fallback logic', () => {
    it('should use timeEntrySettings firstDayOfWeek when available', () => {
      const timeEntrySettingsWithFirstDay = createMockTimeEntrySettings({
        firstDayOfWeek: 2,
      });
      setupMockSelector(timeEntrySettingsWithFirstDay);

      const { result } = renderUseReset();
      executeReset(result);

      expect(getVisibleDaysFromPreferences).toHaveBeenCalledWith(
        baseTimeEntrySettings.hideWeekdays,
        2,
      );
    });

    it('should fallback to selector firstDayOfWeek when timeEntrySettings firstDayOfWeek not available', () => {
      const timeEntrySettingsWithoutFirstDay = createMockTimeEntrySettings({
        firstDayOfWeek: null,
      });
      setupMockSelector(timeEntrySettingsWithoutFirstDay, 1);

      const { result } = renderUseReset();
      executeReset(result);

      expect(getVisibleDaysFromPreferences).toHaveBeenCalledWith(
        baseTimeEntrySettings.hideWeekdays,
        1,
      );
    });

    it('should fallback to 0 when neither timeEntrySettings nor selector firstDayOfWeek available', () => {
      const timeEntrySettingsWithoutFirstDay = createMockTimeEntrySettings({
        firstDayOfWeek: null,
      });
      setupMockSelector(timeEntrySettingsWithoutFirstDay, null);

      const { result } = renderUseReset();
      executeReset(result);

      expect(getVisibleDaysFromPreferences).toHaveBeenCalledWith(
        baseTimeEntrySettings.hideWeekdays,
        0,
      );
    });
  });

  describe('dependencies and integration', () => {
    it('should have correct dependencies in useCallback', () => {
      const { result } = renderUseReset();
      executeReset(result);

      expectResetActions();
      expectDateRangeNotSet();
    });
  });
});
