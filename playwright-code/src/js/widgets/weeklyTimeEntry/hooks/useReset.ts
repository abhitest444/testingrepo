import { useCallback } from 'react';
import dayjs from 'dayjs';
import { useStore } from 'react-redux';
import { useAppDispatch, useAppSelector } from '../store';
import {
  clearSettingsError,
  clearValidationError,
  clearSaveError,
  clearTimeEntriesError,
} from '../store/validationSlice';
import {
  setTeamMember,
  setDateRange,
  recalculateTotalsForVisibleDays,
  setError,
  clearSelectedCell,
  clearAllLines,
} from '../store/timeEntryGridSlice';
import { resetTimeEntrySettings } from '../store/timeEntrySettingsSlice';
import { resetContextMenu } from '../store/contextMenuSlice';
import { clearTransformationCache } from '../store/timeEntryTransformer';
import { setError as setCustomerError } from '../store/customerSlice';
import { setError as setBreaksError } from '../store/breaksSlice';
import {
  selectTimeEntrySettings,
  selectFirstDayOfWeek,
} from '../store/selectors';
import { getVisibleDaysFromPreferences } from '../utils/helpers';

/**
 * Custom hook that provides a reset function
 * Resets time entry grid data while preserving settings and customer data
 * Resets: week preferences, team member, context menu, and validation errors
 * Settings remain intact until explicitly saved
 */
export const useReset = (onResetCallback?: () => void) => {
  const dispatch = useAppDispatch();
  const timeEntrySettings = useAppSelector(selectTimeEntrySettings);
  const firstDayOfWeek = useAppSelector(selectFirstDayOfWeek);

  const reset = useCallback(() => {
    // Reset context menu to initial state
    dispatch(resetContextMenu());

    // Clear transformation cache
    clearTransformationCache();

    // Clear selected cell state
    dispatch(clearSelectedCell());

    // Clear all time entries while preserving date range and team member
    dispatch(clearAllLines());

    // Preserve current date range and team member - do not reset them

    // Update visible days based on timeEntrySettings and first day of week
    const firstDay = timeEntrySettings?.firstDayOfWeek ?? firstDayOfWeek ?? 0;
    let visibleDays;
    if (timeEntrySettings?.hideWeekdays) {
      visibleDays = getVisibleDaysFromPreferences(
        timeEntrySettings.hideWeekdays,
        firstDay,
      );
    } else {
      // show all days as default if hideWeekdays is not available
      visibleDays = [0, 1, 2, 3, 4, 5, 6];
    }
    // need to recalculate totals for visible days as showing visible days is already handled in timeEntrySettingsSlice
    dispatch(recalculateTotalsForVisibleDays({ visibleDays }));

    // Clear ALL error messages from ALL slices
    dispatch(clearValidationError());
    dispatch(clearSettingsError());
    dispatch(clearSaveError());
    dispatch(clearTimeEntriesError());
    dispatch(setError({ error: null })); // timeEntryGrid errors
    dispatch(setCustomerError({ error: null })); // customer errors
    dispatch(setBreaksError(null)); // breaks errors

    // Reset time entry settings to current state (preserve settings until saved)
    dispatch(resetTimeEntrySettings());

    // Call the reset callback if provided
    onResetCallback?.();
  }, [dispatch, timeEntrySettings, firstDayOfWeek, onResetCallback]);

  return { reset };
};
