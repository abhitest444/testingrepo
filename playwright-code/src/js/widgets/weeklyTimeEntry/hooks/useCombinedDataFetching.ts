import { useEffect, useRef, useMemo, useCallback } from 'react';
import dayjs from 'dayjs';
import updateLocale from 'dayjs/plugin/updateLocale';
import { useSandbox } from '@payroll/quicksand';
import { QuickbooksOnlineSandbox } from '@appfabric/sandbox-spec';
import { useCompanySettings } from 'src/js/service/hooks/settings/useCompanySettings';
import {
  useUxPreferences,
  UxPreferenceKey,
} from 'src/js/service/utils/useUXPreferences';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';
import { Week } from 'src/js/widgets/weeklyTimeTrowser/components/WeekSelector';
import { TimeForType } from '../types';
import { useAppDispatch, useAppSelector } from '../store';
import {
  setError,
  setTeamMember,
  setLoading,
  setDateRange,
  TeamMember,
} from '../store/timeEntryGridSlice';
import {
  setTimeEntrySettingsError,
  setUxPreferences,
  setCompanySettings,
  setFirstDayOfWeek,
  setTimeEntrySettingsLoading,
  setVisibleDays,
} from '../store/timeEntrySettingsSlice';
import { setSettingsError } from '../store/validationSlice';

import {
  selectDateRange,
  selectTeamMember,
  selectFirstDayOfWeek,
} from '../store/selectors';
import { getVisibleDaysFromPreferences } from '../utils/helpers';
import { useCustomFieldsData } from './useCustomFieldsData';

export type { Week };

export interface CombinedDataState {
  loading: boolean;
  error?: string;
  settings?: any;
  currentWeek: Week;
  timeEntrySettings?: any;
}

dayjs.extend(updateLocale);
/**
 * Combined data fetching hook that only runs once and returns stable results
 * Uses useRef to ensure it only runs once during the component lifecycle
 * @param employeeId - Logged in user's employee ID passed from parent (optional)
 */
export const useCombinedDataFetching = (
  employeeId?: string | null,
): CombinedDataState => {
  const dispatch = useAppDispatch();
  const dateRange = useAppSelector(selectDateRange);
  const hasInitializedRef = useRef(false);
  const sandbox = useSandbox();

  // Check if current user is a Workforce (WFS) user
  const isWorkforceUser = isWorkforceEnvironment(
    sandbox as QuickbooksOnlineSandbox,
  );

  // Memoize the current week to prevent unnecessary recalculations
  const currentWeek: Week = useMemo(() => {
    // If dateRange is empty, use current week as default
    if (!dateRange.start || !dateRange.end) {
      const now = dayjs();
      const defaultWeek = {
        startDate: now.startOf('week'),
        endDate: now.endOf('week'),
      };

      return defaultWeek;
    }

    const startDate = dayjs(dateRange.start);
    const endDate = dayjs(dateRange.end);

    const calculatedWeek = {
      startDate,
      endDate,
    };

    return calculatedWeek;
  }, [dateRange.start, dateRange.end]);

  // Fetch company settings
  const {
    settingsData: companySettings,
    loading: companySettingsLoading,
    error: companySettingsError,
    qlSettings,
  } = useCompanySettings({ isExported: false });

  // Fetch UX preferences
  const {
    data: uxPreferencesData,
    loading: uxPreferencesLoading,
    error: uxPreferencesError,
    getPreference,
  } = useUxPreferences();

  // Optimize loading state - consider settings loaded if we have basic data
  const loading = useMemo(() => {
    // If we have company settings, we can proceed even if preferences are still loading
    if (companySettings && !companySettingsLoading) {
      return uxPreferencesLoading;
    }
    return companySettingsLoading || uxPreferencesLoading;
  }, [companySettings, companySettingsLoading, uxPreferencesLoading]);

  // Combined error state (prioritize UX preferences error, then settings error)
  const error = uxPreferencesError || companySettingsError;

  // Load UX preferences on mount - only run once
  useEffect(() => {
    if (!hasInitializedRef.current) {
      getPreference(UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE);
      getPreference(UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS);
      getPreference(UxPreferenceKey.TIME_ENTRY_TIME_FOR);
      getPreference(UxPreferenceKey.WEEKLY_TIMESHEET_TOUR_COMPLETED);
      hasInitializedRef.current = true;
    }
  }, [getPreference]);

  // Group loading state dispatches
  useEffect(() => {
    dispatch(setLoading({ loading: companySettingsLoading }));
    dispatch(setTimeEntrySettingsLoading({ loading: uxPreferencesLoading }));
  }, [companySettingsLoading, uxPreferencesLoading, dispatch]);

  // Helper function to extract error message
  const getErrorMessage = useCallback((error: any): string => {
    if (typeof error === 'string') {
      return error;
    }
    if (error?.message) {
      return String(error.message);
    }
    return 'An error occurred';
  }, []);

  // Handle company settings errors separately
  useEffect(() => {
    if (companySettingsError) {
      dispatch(setSettingsError('company_settings_error'));
    } else {
      dispatch(setSettingsError(null));
    }
  }, [companySettingsError, dispatch]);

  // Handle UX preferences errors separately
  useEffect(() => {
    if (uxPreferencesError) {
      const errorMessage = getErrorMessage(uxPreferencesError);
      dispatch(setTimeEntrySettingsError(errorMessage));
    } else {
      dispatch(setTimeEntrySettingsError(null));
    }
  }, [uxPreferencesError, dispatch, getErrorMessage]);

  // Group preference-driven updates
  useEffect(() => {
    if (uxPreferencesData) {
      const timeFor = uxPreferencesData[UxPreferenceKey.TIME_ENTRY_TIME_FOR];
      let teamMember: TeamMember | null =
        timeFor && timeFor.id
          ? {
              id: timeFor.id,
              name: timeFor.name,
              type: timeFor.type as TimeForType,
            }
          : null;

      // TODO WFS: Need to add condition of employee's role (i.e. manager role or employee role) with these two conditions too.
      // If employeeId is passed (for workforce users), use it as the default
      if (isWorkforceUser && employeeId) {
        sandbox.logger.info(
          'Component=useCombinedDataFetching Event=SettingEmployeeIdAsDefaultTeamMember',
          {
            employeeId,
            source: 'prop',
          },
        );
        teamMember = {
          id: employeeId,
          name: '', // Name will be populated by the dropdown widget
          type: TimeForType.EMPLOYEE,
        };
      }
      dispatch(
        setUxPreferences({
          hideTimeEntryFields:
            uxPreferencesData[UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS],
          hideWeekdays:
            uxPreferencesData[UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE],
          timeEntryTimeFor: teamMember || undefined,
          weeklyTimesheetTourCompleted:
            uxPreferencesData[UxPreferenceKey.WEEKLY_TIMESHEET_TOUR_COMPLETED],
        }),
      );

      // Set team member if preference exists
      if (teamMember) {
        dispatch(setTeamMember(teamMember));
      }
    }
  }, [uxPreferencesData, dispatch, isWorkforceUser, employeeId]);

  // Update company settings when they change
  useEffect(() => {
    if (companySettings) {
      dispatch(
        setCompanySettings({
          isServiceFieldEnabled: companySettings.isServiceFieldEnabled,
          isBillingFieldEnabled: companySettings.isBillingFieldEnabled,
          billingRateForTimeEnabled: companySettings.billingRateForTimeEnabled,
          firstDayOfWeek: companySettings.firstDayOfWeek,
          isClassEnabled: qlSettings?.classForTimeSheetEnabled?.value, // Class field is controlled by tsheet settings for time entry
          isLocationEnabled: qlSettings?.locationForTimeSheetEnabled?.value, // Location field is controlled by tsheet settings for time entry
          classRequired: qlSettings?.classRequired?.value,
          locationRequired: qlSettings?.locationRequired?.value,
          serviceItemRequired: qlSettings?.serviceItemRequired?.value,
          requireBillable: qlSettings?.requireBillable?.value,
          timeSheetEntryMakesNotesRequiredEnabled:
            qlSettings?.timeSheetEntryMakesNotesRequiredEnabled?.value,
        }),
      );
    }
  }, [companySettings, qlSettings, dispatch]);

  // Update first day of week when settings change.
  // Also: align dayjs locale weekStart so subsequent week calculations respect
  // the company setting, and seed the Redux dateRange to the current week when
  // it has not been initialized yet. Owning this here (rather than in the
  // Trowser child) prevents the duplicate-dispatch race that caused the grid
  // to flash with the wrong week boundary on first open.
  useEffect(() => {
    if (
      !companySettingsLoading &&
      companySettings?.firstDayOfWeek !== undefined
    ) {
      dispatch(setFirstDayOfWeek(companySettings.firstDayOfWeek));
      dayjs.updateLocale(dayjs.locale(), {
        weekStart: companySettings.firstDayOfWeek,
      });

      // Only seed when empty — never overwrite a date range the user has
      // already navigated to.
      if (
        !dateRange.start ||
        !dateRange.end ||
        dayjs(dateRange.start).day() !== companySettings.firstDayOfWeek
      ) {
        const start = dayjs().startOf('week').format('YYYY-MM-DD');
        const end = dayjs().endOf('week').format('YYYY-MM-DD');
        dispatch(setDateRange({ start, end }));
      }
    }
    // dateRange.start / dateRange.end intentionally omitted from deps — this
    // effect should fire on settings arrival only, and the empty check above
    // guards against overwrite if the user has already navigated weeks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companySettingsLoading, companySettings?.firstDayOfWeek, dispatch]);

  // Update visible days based on UX preferences and first day of week
  useEffect(() => {
    if (uxPreferencesData && companySettings?.firstDayOfWeek !== undefined) {
      const hideWeekdays =
        uxPreferencesData[UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE];
      const { firstDayOfWeek } = companySettings;

      if (hideWeekdays && firstDayOfWeek !== undefined) {
        const visibleDays = getVisibleDaysFromPreferences(
          hideWeekdays,
          firstDayOfWeek,
        );
        dispatch(setVisibleDays({ visibleIndices: visibleDays }));
      }
    }
  }, [uxPreferencesData, companySettings, dispatch]);

  // Create stable result that only changes when data actually changes
  const result: CombinedDataState = useMemo(
    () => ({
      loading,
      error: error ? getErrorMessage(error) : undefined,
      settings: companySettings,
      currentWeek,
      timeEntrySettings: uxPreferencesData,
    }),
    [
      loading,
      error,
      companySettings,
      currentWeek,
      uxPreferencesData,
      getErrorMessage,
    ],
  );

  // Return memoized result directly so changes propagate
  return result;
};
