import { useCallback, useMemo, useEffect } from 'react';
import { UxPreferenceHideWeekdaysData } from 'src/js/service/utils/useUXPreferences';
import { useAppSelector, useAppDispatch } from '../store';
import { selectHideWeekdays, selectPanelValues } from '../store/selectors';
import {
  initializePanelValues,
  updatePanelValue,
} from '../store/timeEntrySettingsSlice';

// Common weekday interface - using old property names for backward compatibility
interface WeekdayConfiguration {
  isSundayEnabled: boolean;
  isMondayEnabled: boolean;
  isTuesdayEnabled: boolean;
  isWednesdayEnabled: boolean;
  isThursdayEnabled: boolean;
  isFridayEnabled: boolean;
  isSaturdayEnabled: boolean;
}

// Utility functions to convert between formats
const convertHideWeekdaysToEnabled = (
  hideWeekdays: UxPreferenceHideWeekdaysData,
): WeekdayConfiguration => ({
  isSundayEnabled: !hideWeekdays.isSundayHidden,
  isMondayEnabled: !hideWeekdays.isMondayHidden,
  isTuesdayEnabled: !hideWeekdays.isTuesdayHidden,
  isWednesdayEnabled: !hideWeekdays.isWednesdayHidden,
  isThursdayEnabled: !hideWeekdays.isThursdayHidden,
  isFridayEnabled: !hideWeekdays.isFridayHidden,
  isSaturdayEnabled: !hideWeekdays.isSaturdayHidden,
});

const convertEnabledToHideWeekdays = (
  weekdays: WeekdayConfiguration,
): UxPreferenceHideWeekdaysData => ({
  isSundayHidden: !weekdays.isSundayEnabled,
  isMondayHidden: !weekdays.isMondayEnabled,
  isTuesdayHidden: !weekdays.isTuesdayEnabled,
  isWednesdayHidden: !weekdays.isWednesdayEnabled,
  isThursdayHidden: !weekdays.isThursdayEnabled,
  isFridayHidden: !weekdays.isFridayEnabled,
  isSaturdayHidden: !weekdays.isSaturdayEnabled,
});

export const useWeeklyTimeEntrySettings = (
  initialHideWeekdays: UxPreferenceHideWeekdaysData,
) => {
  const dispatch = useAppDispatch();

  // Get current Redux state
  const currentReduxHideWeekdays = useAppSelector(selectHideWeekdays);
  const panelValues = useAppSelector(selectPanelValues);

  // Initialize panel values when component mounts
  useEffect(() => {
    dispatch(initializePanelValues());
  }, [dispatch]);

  // Convert panel values to settings state format
  const settingsState = useMemo(
    () => ({
      weekdays: convertHideWeekdaysToEnabled(panelValues),
    }),
    [panelValues],
  );

  // Update weekday setting
  const updateWeekday = useCallback(
    (weekdayName: string, value: boolean) => {
      // Map enabled weekday names to hidden weekday keys
      const weekdayMapping: Record<string, keyof UxPreferenceHideWeekdaysData> =
        {
          isSundayEnabled: 'isSundayHidden',
          isMondayEnabled: 'isMondayHidden',
          isTuesdayEnabled: 'isTuesdayHidden',
          isWednesdayEnabled: 'isWednesdayHidden',
          isThursdayEnabled: 'isThursdayHidden',
          isFridayEnabled: 'isFridayHidden',
          isSaturdayEnabled: 'isSaturdayHidden',
        };

      const weekdayKey = weekdayMapping[weekdayName];
      if (weekdayKey) {
        dispatch(
          updatePanelValue({
            weekday: weekdayKey,
            value: !value, // Convert enabled to hidden format
          }),
        );
      }
    },
    [dispatch],
  );

  // Get form data for saving (memoized to prevent unnecessary recalculations)
  const getFormData = useMemo(
    () => ({
      hideWeekdays: convertEnabledToHideWeekdays(settingsState.weekdays),
    }),
    [settingsState.weekdays],
  );

  // Check if form is dirty by comparing current panel values with current Redux state
  const isDirty = useMemo(
    () =>
      JSON.stringify(panelValues) !== JSON.stringify(currentReduxHideWeekdays),
    [panelValues, currentReduxHideWeekdays],
  );

  return {
    settingsState,
    updateWeekday,
    getFormData,
    isDirty,
  };
};
