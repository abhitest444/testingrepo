import { act } from '@testing-library/react-hooks';
import {
  renderHookWithReduxProvider,
  createDefaultStore,
} from 'test/unit/testUtils';
import { useWeeklyTimeEntrySettings } from '../../../../../src/js/widgets/weeklyTimeEntry/hooks/useWeeklyTimeEntrySettings';
import { UxPreferenceHideWeekdaysData } from '../../../../../src/js/service/utils/useUXPreferences';
import timeEntrySettingsReducer from '../../../../../src/js/widgets/weeklyTimeEntry/store/timeEntrySettingsSlice';

describe('useWeeklyTimeEntrySettings', () => {
  // Base mock data
  const baseHideWeekdays: UxPreferenceHideWeekdaysData = {
    isSundayHidden: true,
    isMondayHidden: false,
    isTuesdayHidden: false,
    isWednesdayHidden: false,
    isThursdayHidden: false,
    isFridayHidden: false,
    isSaturdayHidden: true,
  };

  const createMockData = (hideWeekdays = baseHideWeekdays) => ({
    hideWeekdays,
  });

  const createMockStore = (hideWeekdays = baseHideWeekdays) =>
    createDefaultStore(
      {
        timeEntrySettings: timeEntrySettingsReducer,
      },
      {
        timeEntrySettings: {
          hideWeekdays,
          panelValues: hideWeekdays,
          // Add other required state properties
          hideTimeEntryFields: {
            isClassFieldEnabled: true,
            isProjectFieldEnabled: true,
            isLocationFieldEnabled: true,
            isPayTypeFieldEnabled: true,
            isCostRateFieldEnabled: true,
            isTaxableFieldEnabled: true,
          },
          timeEntryTimeFor: null,
          isServiceFieldEnabled: false,
          isBillingFieldEnabled: false,
          firstDayOfWeek: 0,
          isClassEnabled: false,
          isLocationEnabled: false,
          classRequired: false,
          requireBillable: false,
          locationRequired: false,
          serviceItemRequired: false,
          timeSheetEntryMakesNotesRequiredEnabled: false,
          loading: false,
          error: null,
          panelOpen: true,
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
        },
      },
    );

  const renderUseWeeklyTimeEntrySettings = (
    mockData: ReturnType<typeof createMockData>,
  ) => {
    const store = createMockStore(mockData.hideWeekdays);
    return renderHookWithReduxProvider(
      () => useWeeklyTimeEntrySettings(mockData.hideWeekdays),
      store,
    );
  };

  describe('Initialization', () => {
    it('should initialize with correct weekday states', () => {
      const mockData = createMockData();
      const { result } = renderUseWeeklyTimeEntrySettings(mockData);

      expect(result.current.settingsState.weekdays).toEqual({
        isSundayEnabled: false, // !isSundayHidden
        isMondayEnabled: true, // !isMondayHidden
        isTuesdayEnabled: true, // !isTuesdayHidden
        isWednesdayEnabled: true, // !isWednesdayHidden
        isThursdayEnabled: true, // !isThursdayHidden
        isFridayEnabled: true, // !isFridayHidden
        isSaturdayEnabled: false, // !isSaturdayHidden
      });
    });

    it('should initialize with correct form data', () => {
      const mockData = createMockData();
      const { result } = renderUseWeeklyTimeEntrySettings(mockData);

      expect(result.current.getFormData).toEqual({
        hideWeekdays: {
          isSundayHidden: true,
          isMondayHidden: false,
          isTuesdayHidden: false,
          isWednesdayHidden: false,
          isThursdayHidden: false,
          isFridayHidden: false,
          isSaturdayHidden: true,
        },
      });
    });

    it('should initialize with isDirty as false', () => {
      const mockData = createMockData();
      const { result } = renderUseWeeklyTimeEntrySettings(mockData);

      expect(result.current.isDirty).toBe(false);
    });
  });

  describe('updateWeekday', () => {
    it('should update weekday state correctly', () => {
      const mockData = createMockData();
      const { result } = renderUseWeeklyTimeEntrySettings(mockData);

      act(() => {
        result.current.updateWeekday('isMondayEnabled', false);
      });

      expect(result.current.settingsState.weekdays.isMondayEnabled).toBe(false);
    });

    it('should update multiple weekdays correctly', () => {
      const mockData = createMockData();
      const { result } = renderUseWeeklyTimeEntrySettings(mockData);

      act(() => {
        result.current.updateWeekday('isSundayEnabled', true);
        result.current.updateWeekday('isSaturdayEnabled', true);
      });

      expect(result.current.settingsState.weekdays.isSundayEnabled).toBe(true);
      expect(result.current.settingsState.weekdays.isSaturdayEnabled).toBe(
        true,
      );
    });

    it('should not affect other weekdays when updating one weekday', () => {
      const mockData = createMockData();
      const { result } = renderUseWeeklyTimeEntrySettings(mockData);

      const originalWeekdays = { ...result.current.settingsState.weekdays };

      act(() => {
        result.current.updateWeekday('isWednesdayEnabled', false);
      });

      // Check that only the updated weekday changed
      expect(result.current.settingsState.weekdays.isWednesdayEnabled).toBe(
        false,
      );
      expect(result.current.settingsState.weekdays.isMondayEnabled).toBe(
        originalWeekdays.isMondayEnabled,
      );
      expect(result.current.settingsState.weekdays.isTuesdayEnabled).toBe(
        originalWeekdays.isTuesdayEnabled,
      );
    });
  });

  describe('getFormData', () => {
    it('should return new reference when changes occur', () => {
      const mockData = createMockData();
      const { result } = renderUseWeeklyTimeEntrySettings(mockData);

      const initialFormData = result.current.getFormData;

      act(() => {
        result.current.updateWeekday('isMondayEnabled', false);
      });

      expect(result.current.getFormData).not.toBe(initialFormData);
      expect(result.current.getFormData.hideWeekdays.isMondayHidden).toBe(true);
    });

    it('should return correct form data after multiple updates', () => {
      const mockData = createMockData();
      const { result } = renderUseWeeklyTimeEntrySettings(mockData);

      act(() => {
        result.current.updateWeekday('isSundayEnabled', true);
        result.current.updateWeekday('isMondayEnabled', false);
        result.current.updateWeekday('isSaturdayEnabled', true);
      });

      expect(result.current.getFormData.hideWeekdays).toEqual({
        isSundayHidden: false, // !isSundayEnabled
        isMondayHidden: true, // !isMondayEnabled
        isTuesdayHidden: false,
        isWednesdayHidden: false,
        isThursdayHidden: false,
        isFridayHidden: false,
        isSaturdayHidden: false, // !isSaturdayEnabled
      });
    });
  });

  describe('isDirty', () => {
    it('should be false when no changes are made', () => {
      const mockData = createMockData();
      const { result } = renderUseWeeklyTimeEntrySettings(mockData);

      expect(result.current.isDirty).toBe(false);
    });

    it('should be true when weekday is changed', () => {
      const mockData = createMockData();
      const { result } = renderUseWeeklyTimeEntrySettings(mockData);

      act(() => {
        result.current.updateWeekday('isMondayEnabled', false);
      });

      expect(result.current.isDirty).toBe(true);
    });

    it('should be true when multiple weekdays are changed', () => {
      const mockData = createMockData();
      const { result } = renderUseWeeklyTimeEntrySettings(mockData);

      act(() => {
        result.current.updateWeekday('isSundayEnabled', true);
        result.current.updateWeekday('isSaturdayEnabled', true);
      });

      expect(result.current.isDirty).toBe(true);
    });

    it('should be false when changes are reverted to original values', () => {
      const mockData = createMockData();
      const { result } = renderUseWeeklyTimeEntrySettings(mockData);

      act(() => {
        result.current.updateWeekday('isMondayEnabled', false);
      });

      expect(result.current.isDirty).toBe(true);

      act(() => {
        result.current.updateWeekday('isMondayEnabled', true);
      });

      expect(result.current.isDirty).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle all weekdays hidden initially', () => {
      const allHiddenWeekdays: UxPreferenceHideWeekdaysData = {
        isSundayHidden: true,
        isMondayHidden: true,
        isTuesdayHidden: true,
        isWednesdayHidden: true,
        isThursdayHidden: true,
        isFridayHidden: true,
        isSaturdayHidden: true,
      };

      const mockData = createMockData(allHiddenWeekdays);
      const { result } = renderUseWeeklyTimeEntrySettings(mockData);

      expect(result.current.settingsState.weekdays).toEqual({
        isSundayEnabled: false,
        isMondayEnabled: false,
        isTuesdayEnabled: false,
        isWednesdayEnabled: false,
        isThursdayEnabled: false,
        isFridayEnabled: false,
        isSaturdayEnabled: false,
      });
    });

    it('should handle all weekdays visible initially', () => {
      const allVisibleWeekdays: UxPreferenceHideWeekdaysData = {
        isSundayHidden: false,
        isMondayHidden: false,
        isTuesdayHidden: false,
        isWednesdayHidden: false,
        isThursdayHidden: false,
        isFridayHidden: false,
        isSaturdayHidden: false,
      };

      const mockData = createMockData(allVisibleWeekdays);
      const { result } = renderUseWeeklyTimeEntrySettings(mockData);

      expect(result.current.settingsState.weekdays).toEqual({
        isSundayEnabled: true,
        isMondayEnabled: true,
        isTuesdayEnabled: true,
        isWednesdayEnabled: true,
        isThursdayEnabled: true,
        isFridayEnabled: true,
        isSaturdayEnabled: true,
      });
    });
  });

  describe('Performance', () => {
    it('should maintain memoized references for isDirty when no changes occur', () => {
      const mockData = createMockData();
      const { result, rerender } = renderUseWeeklyTimeEntrySettings(mockData);

      const initialIsDirty = result.current.isDirty;

      rerender();

      expect(result.current.isDirty).toBe(initialIsDirty);
    });

    it('should return new isDirty reference when changes occur', () => {
      const mockData = createMockData();
      const { result } = renderUseWeeklyTimeEntrySettings(mockData);

      const initialIsDirty = result.current.isDirty;

      act(() => {
        result.current.updateWeekday('isMondayEnabled', false);
      });

      expect(result.current.isDirty).not.toBe(initialIsDirty);
      expect(result.current.isDirty).toBe(true);
    });
  });
});
